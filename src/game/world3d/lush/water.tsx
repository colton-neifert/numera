import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fieldHeight } from "../field";
import { atmo } from "./atmo";

const shared = {
  uTime: { value: 0 },
  uSunDir: { value: atmo.sunDir },
  uSunColor: { value: atmo.sunColor },
  uSky: { value: atmo.horizon },
  uZen: { value: atmo.zenith },
};

let MAT: THREE.ShaderMaterial | null = null;

/** Painted water: teal depths, sky on the glancing angles, drifting ripple lines and a broken sun road. */
export function waterMaterial() {
  if (MAT) return MAT;
  MAT = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: true,
    uniforms: { ...THREE.UniformsLib.fog, ...shared },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      #include <fog_pars_vertex>
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uSky; uniform vec3 uZen;
      varying vec3 vW;
      #include <fog_pars_fragment>
      float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float noise(vec2 p){
        vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
      }
      float height(vec2 p){
        return noise(p * 0.9 + vec2(uTime * 0.22, uTime * 0.09)) * 0.6 + noise(p * 2.3 - vec2(uTime * 0.31, -uTime * 0.17)) * 0.4;
      }
      void main() {
        vec2 p = vW.xz;
        float e = 0.18;
        float h0 = height(p);
        vec3 n = normalize(vec3(h0 - height(p + vec2(e, 0.0)), 0.55, h0 - height(p + vec2(0.0, e))));
        vec3 V = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(dot(V, n), 0.0), 3.0);
        vec3 deep = vec3(0.05, 0.27, 0.33);
        vec3 shallow = vec3(0.16, 0.5, 0.52);
        vec3 col = mix(deep, shallow, h0);
        vec3 sky = mix(uSky, uZen, 0.45);
        col = mix(col, sky, clamp(fres * 0.85 + 0.08, 0.0, 1.0));
        // Sun road: glints where the rippled normal throws the low sun at the eye.
        vec3 R = reflect(-V, n);
        float spec = pow(max(dot(R, uSunDir), 0.0), 90.0);
        col += uSunColor * spec * 1.6;
        // Thin bright ripple crests, storybook style.
        float crest = smoothstep(0.62, 0.66, h0) * (1.0 - smoothstep(0.66, 0.7, h0));
        col += vec3(0.9, 0.97, 1.0) * crest * 0.22;
        gl_FragColor = vec4(col, 0.9);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
  return MAT;
}

export function LushWaterClock() {
  useFrame(({ clock }) => {
    shared.uTime.value = clock.elapsedTime;
  });
  return null;
}

/** One continuous river surface draped along a polyline, a touch above the bed. */
export function LushRiver({ pts, w, lift = 0.16 }: { pts: [number, number][]; w: number; lift?: number }) {
  const geo = useMemo(() => {
    const path: { x: number; z: number }[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n = Math.max(1, Math.round(len / 7));
      for (let k = 0; k < n; k++) path.push({ x: a[0] + ((b[0] - a[0]) * k) / n, z: a[1] + ((b[1] - a[1]) * k) / n });
    }
    const last = pts[pts.length - 1]!;
    path.push({ x: last[0], z: last[1] });
    // Relax the corners so the ribbon bends instead of kinking.
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 1; i < path.length - 1; i++) {
        path[i] = { x: (path[i - 1]!.x + path[i]!.x * 2 + path[i + 1]!.x) / 4, z: (path[i - 1]!.z + path[i]!.z * 2 + path[i + 1]!.z) / 4 };
      }
    }
    const pos: number[] = [];
    const idx: number[] = [];
    let prevY = Infinity;
    path.forEach((p, i) => {
      const q = path[Math.min(path.length - 1, i + 1)]!;
      const o = path[Math.max(0, i - 1)]!;
      const tx = q.x - o.x;
      const tz = q.z - o.z;
      const tl = Math.hypot(tx, tz) || 1;
      const nx = -tz / tl;
      const nz = tx / tl;
      const half = (w / 2) * (1 + 0.18 * Math.sin(i * 0.37));
      // Water never runs uphill: carry the lowest level forward, with a little slack.
      const y = Math.min(fieldHeight(p.x, p.z) + lift, prevY + 0.02);
      prevY = y;
      pos.push(p.x - nx * half, y, p.z - nz * half, p.x + nx * half, y, p.z + nz * half);
      if (i < path.length - 1) {
        const a = i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeBoundingSphere();
    return g;
  }, [pts, w, lift]);
  return <mesh geometry={geo} material={waterMaterial()} renderOrder={2} />;
}
