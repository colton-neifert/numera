import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fieldHeight, TERRAIN_REV } from "../field";
import { atmo } from "./atmo";

const shared = {
  uTime: { value: 0 },
  uSunDir: { value: atmo.sunDir },
  uSunColor: { value: atmo.sunColor },
  uSky: { value: atmo.horizon },
  uZen: { value: atmo.zenith },
};

let MAT: THREE.ShaderMaterial | null = null;

/** Painted water: teal depths, a bright shoreline, drifting ripples, a broken sun road. Land stays matte. */
export function waterMaterial() {
  if (MAT) return MAT;
  MAT = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    fog: true,
    uniforms: { ...THREE.UniformsLib.fog, ...shared },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      varying float vEdge;
      attribute float aEdge;
      #include <fog_pars_vertex>
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        float wave = sin(w.x * 0.62 + uTime * 1.15) * 0.045 + sin(w.z * 0.48 - uTime * 0.85) * 0.035;
        w.y += wave * (0.35 + aEdge * 0.2);
        vW = w.xyz;
        vEdge = aEdge;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uSky; uniform vec3 uZen;
      varying vec3 vW;
      varying float vEdge;
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
        vec3 n = normalize(vec3(h0 - height(p + vec2(e, 0.0)), 0.62, h0 - height(p + vec2(0.0, e))));
        vec3 V = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(dot(V, n), 0.0), 3.4);
        // Centre of a ribbon is deep; pond circles have aEdge=0 and stay mid-depth.
        float shore = clamp(vEdge, 0.0, 1.0);
        float shallow = smoothstep(0.0, 0.42, shore);
        vec3 deep = vec3(0.02, 0.28, 0.62);
        vec3 mid = vec3(0.08, 0.55, 0.82);
        vec3 pale = vec3(0.45, 0.82, 0.92);
        vec3 col = mix(deep, mix(mid, pale, h0 * 0.45), 0.35 + shallow * 0.65);
        vec3 sky = mix(uSky, uZen, 0.55);
        col = mix(col, sky, clamp(fres * 0.28, 0.0, 0.28));
        vec3 R = reflect(-V, n);
        float spec = pow(max(dot(R, uSunDir), 0.0), 110.0);
        col += uSunColor * spec * (0.7 + 0.5 * (1.0 - shallow));
        float crest = smoothstep(0.62, 0.66, h0) * (1.0 - smoothstep(0.66, 0.72, h0));
        col += vec3(0.9, 0.97, 1.0) * crest * 0.16;
        // Foam only on the bank, so grass never picks up a white sheen.
        float foam = smoothstep(0.62, 0.92, shore);
        col = mix(col, vec3(0.86, 0.94, 0.92), foam * 0.55);
        float alpha = mix(0.97, 0.88, shallow) + foam * 0.08;
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
  (MAT.defaultAttributeValues as Record<string, number[]>).aEdge = [0];
  return MAT;
}

export function LushWaterClock() {
  useFrame(({ clock }) => {
    shared.uTime.value = clock.elapsedTime;
  });
  return null;
}

/** One continuous river surface draped along a polyline, sitting in the carved bed — never on the grass. */
export function LushRiver({ pts, w, lift = 0.14 }: { pts: [number, number][]; w: number; lift?: number }) {
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
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 1; i < path.length - 1; i++) {
        path[i] = { x: (path[i - 1]!.x + path[i]!.x * 2 + path[i + 1]!.x) / 4, z: (path[i - 1]!.z + path[i]!.z * 2 + path[i + 1]!.z) / 4 };
      }
    }
    const pos: number[] = [];
    const edge: number[] = [];
    const idx: number[] = [];
    path.forEach((p, i) => {
      const q = path[Math.min(path.length - 1, i + 1)]!;
      const o = path[Math.max(0, i - 1)]!;
      const tx = q.x - o.x;
      const tz = q.z - o.z;
      const tl = Math.hypot(tx, tz) || 1;
      const nx = -tz / tl;
      const nz = tx / tl;
      const half = (w / 2) * (1 + 0.08 * Math.sin(i * 0.37));
      const yL = fieldHeight(p.x - nx * (half + 1.4), p.z - nz * (half + 1.4));
      const yR = fieldHeight(p.x + nx * (half + 1.4), p.z + nz * (half + 1.4));
      const yC = fieldHeight(p.x, p.z);
      const y = Math.min(yC + lift, Math.min(yL, yR) - 0.38);
      pos.push(p.x - nx * half, y, p.z - nz * half, p.x, y, p.z, p.x + nx * half, y, p.z + nz * half);
      edge.push(1, 0, 1);
      if (i < path.length - 1) {
        const a = i * 3;
        idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aEdge", new THREE.Float32BufferAttribute(edge, 1));
    g.setIndex(idx);
    g.computeBoundingSphere();
    return g;
  }, [pts, w, lift, TERRAIN_REV]);

  const banks = useMemo(() => {
    const rocks: { x: number; y: number; z: number; s: number }[] = [];
    for (let i = 2; i < pts.length - 1; i += 1) {
      const a = pts[i]!;
      const b = pts[Math.min(pts.length - 1, i + 1)]!;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const tl = Math.hypot(dx, dz) || 1;
      const nx = -dz / tl;
      const nz = dx / tl;
      const side = i % 2 ? 1 : -1;
      const x = a[0] + nx * side * (w * 0.58 + 0.45);
      const z = a[1] + nz * side * (w * 0.58 + 0.45);
      rocks.push({ x, y: fieldHeight(x, z) + 0.12, z, s: 0.28 + (i % 3) * 0.08 });
    }
    return rocks;
  }, [pts, w, TERRAIN_REV]);

  return (
    <group>
      <mesh geometry={geo} material={waterMaterial()} />
      {banks.map((r, i) => (
        <mesh key={i} position={[r.x, r.y, r.z]} castShadow>
          <dodecahedronGeometry args={[r.s, 0]} />
          <meshLambertMaterial color={i % 2 ? "#6a5a48" : "#7a6a52"} />
        </mesh>
      ))}
    </group>
  );
}

/** Water sits just under the bank, not a fixed height above the middle of the bowl. */
export function pondLevel(x: number, z: number, r: number) {
  let shore = Infinity;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const hy = fieldHeight(x + Math.cos(a) * r * 0.92, z + Math.sin(a) * r * 0.92);
    if (hy < shore) shore = hy;
  }
  if (!Number.isFinite(shore)) shore = fieldHeight(x, z);
  return shore - 0.05;
}

/** Round pond sitting in the carved bowl — shoreline foam on the rim, sand on the bank. */
export function LushPond({ x, z, r }: { x: number; z: number; r: number; lift?: number }) {
  const water = useRef<THREE.Mesh>(null);
  const inner = r * 0.86;
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(inner, 36);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const edge = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const pz = pos.getZ(i);
      edge[i] = Math.min(1, Math.hypot(px, pz) / inner);
      pos.setX(i, x + px);
      pos.setZ(i, z + pz);
    }
    g.setAttribute("aEdge", new THREE.BufferAttribute(edge, 1));
    g.computeVertexNormals();
    return g;
  }, [x, z, inner]);
  const y = pondLevel(x, z, r);
  useFrame(({ clock }) => {
    if (water.current) water.current.position.y = y + Math.sin(clock.elapsedTime * 0.42) * 0.015;
  });
  return (
    <group>
      <mesh position={[x, y - 0.02, z]} rotation={[-Math.PI / 2, 0, 0.12]} receiveShadow>
        <ringGeometry args={[inner * 0.92, r * 1.08, 28]} />
        <meshLambertMaterial color="#c4a56c" />
      </mesh>
      <mesh ref={water} geometry={geo} position={[0, y, 0]} receiveShadow>
        <primitive object={waterMaterial()} attach="material" />
      </mesh>
    </group>
  );
}
