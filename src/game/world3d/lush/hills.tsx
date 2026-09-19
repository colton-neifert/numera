import { useMemo } from "react";
import * as THREE from "three";
import { seeded } from "./grid";

export type Peak = { x: number; z: number; r: number; h: number };

const _c = new THREE.Color();

/** Far ranges: long faceted ridgelines, blue-green and soft, that the honey haze swallows. */
export function LushPeaks({ peaks }: { peaks: Peak[] }) {
  const geo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const foot = new THREE.Color("#7f9a78");
    const rock = new THREE.Color("#5d7f80");
    const shade = new THREE.Color("#466a74");
    const snow = new THREE.Color("#eef0f2");
    peaks.forEach((pk, pi) => {
      const rnd = seeded(pi * 131 + 7);
      const subs = 3 + Math.floor(rnd() * 3);
      const axis = rnd() * Math.PI;
      for (let s = 0; s < subs; s++) {
        const along = (s / (subs - 1) - 0.5) * pk.r * 2.4;
        const r = pk.r * (0.75 + rnd() * 0.5);
        const h = pk.h * (0.75 + rnd() * 0.7) * (1 - Math.abs(s / (subs - 1) - 0.5) * 0.7);
        const g = new THREE.SphereGeometry(r, 10, 5, 0, Math.PI * 2, 0, Math.PI * 0.5).toNonIndexed();
        const p = g.getAttribute("position");
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i);
          const y = p.getY(i);
          const z = p.getZ(i);
          const hs = Math.sin(x * 0.129 + y * 0.782 + z * 0.377 + pi + s) * 43758.5453;
          const k = hs - Math.floor(hs);
          const t = y / r;
          // Pinch the dome toward a ridge and roughen it.
          const pinch = 1 - t * 0.35;
          p.setXYZ(i, x * pinch * (1 + (k - 0.5) * 0.3), (y * h * 1.5) / r + (t > 0.05 ? (k - 0.5) * h * 0.22 : 0), z * pinch * (1 + (k - 0.5) * 0.3));
        }
        g.rotateY(axis);
        g.translate(pk.x + Math.cos(axis) * along + (rnd() - 0.5) * r * 0.4, -4, pk.z - Math.sin(axis) * along + (rnd() - 0.5) * r * 0.4);
        const col = new Float32Array(p.count * 3);
        const top = h * 1.5;
        for (let i = 0; i < p.count; i += 3) {
          const ya = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
          const t = Math.max(0, Math.min(1, (ya + 4) / top));
          const f = rnd();
          _c.copy(foot).lerp(f > 0.45 ? rock : shade, Math.min(1, t * 1.4 + f * 0.2));
          if (t > 0.7 && top > 190) _c.lerp(snow, Math.min(1, (t - 0.7) * 4) * (0.5 + f * 0.5));
          for (let v = 0; v < 3; v++) {
            col[(i + v) * 3] = _c.r;
            col[(i + v) * 3 + 1] = _c.g;
            col[(i + v) * 3 + 2] = _c.b;
          }
        }
        g.setAttribute("color", new THREE.BufferAttribute(col, 3));
        g.deleteAttribute("uv");
        g.computeVertexNormals();
        parts.push(g);
      }
    });
    return mergeGeos(parts);
  }, [peaks]);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0, envMapIntensity: 0 });
    // Haze, but never a full white-out: far ranges keep a readable silhouette.
    m.customProgramCacheKey = () => "lush-peaks";
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace(
        "#include <fog_fragment>",
        `#ifdef USE_FOG
          float lushFog = smoothstep(fogNear, fogFar, vFogDepth) * 0.86;
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, lushFog);
        #endif`,
      );
    };
    return m;
  }, []);
  return <mesh geometry={geo} material={mat} frustumCulled={false} />;
}

function mergeGeos(parts: THREE.BufferGeometry[]) {
  let n = 0;
  for (const g of parts) n += (g.index ? g.toNonIndexed() : g).getAttribute("position").count;
  const pos = new Float32Array(n * 3);
  const nrm = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  let o = 0;
  for (const src of parts) {
    const g = src.index ? src.toNonIndexed() : src;
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    const c = g.getAttribute("position").count;
    pos.set(g.getAttribute("position").array as Float32Array, o * 3);
    nrm.set(g.getAttribute("normal").array as Float32Array, o * 3);
    col.set(g.getAttribute("color").array as Float32Array, o * 3);
    o += c;
    if (g !== src) g.dispose();
    src.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  out.setAttribute("color", new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}
