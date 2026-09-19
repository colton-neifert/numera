import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { KEEP_Z, PATH_RUNS, VZ, pondU } from "../field";
import { riverU } from "../lands";
import { live } from "../live";
import { waterU } from "./waterRuns";
import { CELL, gridH, landMul } from "./grid";
import { GROUND, groundShade, turfColor } from "./palette";

/**
 * Chunked terrain that actually follows `heightAt`.
 *
 * Near ring: 48 m chunks at 1.5 m cells. Far ring: 192 m chunks at 6 m cells, sunk under the near ring
 * by the vertex shader so the two never fight. Chunks build a few milliseconds per frame, nearest first,
 * and stay cached at module level so stepping out of a house is instant.
 */

const N = 32;
type Lod = { id: string; size: number; step: number; ring: number; drop: number };
const NEAR: Lod = { id: "n", size: N * CELL, step: 1, ring: 2, drop: 2.5 };
const FAR: Lod = { id: "f", size: N * CELL * 4, step: 4, ring: 3, drop: 14 };
const VAST: Lod = { id: "v", size: N * CELL * 16, step: 16, ring: 2, drop: 60 };
const LODS = [NEAR, FAR, VAST];

const _c = new THREE.Color();
const _mul: [number, number, number] = [1, 1, 1];

function groundColor(x: number, z: number, y: number, slope: number, out: THREE.Color) {
  turfColor(groundShade(x, z), out);
  // Hill tops catch the low sun.
  const top = Math.max(0, Math.min(1, (y - 6) / 18));
  out.lerp(GROUND.sun, top * 0.45);
  if (slope > 0.75) out.lerp(GROUND.rock, Math.min(1, (slope - 0.75) / 0.7) * 0.8);
  const pu = pondU(x, z);
  if (pu > 0) {
    const shore = Math.min(1, pu / 0.12);
    out.lerp(GROUND.sand, shore * 0.85);
    if (pu > 0.16) out.lerp(GROUND.mud, Math.min(1, (pu - 0.16) / 0.2));
  }
  const ru = riverU(x, z);
  if (ru > 0) {
    out.lerp(GROUND.sand, Math.min(1, ru * 3) * 0.75);
    if (ru > 0.3) out.lerp(GROUND.mud, Math.min(1, (ru - 0.3) / 0.3) * 0.8);
  }
  const wu = waterU(x, z, 5);
  if (wu > 0) {
    out.lerp(GROUND.sand, Math.min(1, wu * 2.2) * 0.8);
    if (wu > 0.55) out.lerp(GROUND.mud, Math.min(1, (wu - 0.55) / 0.3) * 0.85);
  }
  landMul(x, z, _mul);
  out.r = Math.min(1, out.r * _mul[0]);
  out.g = Math.min(1, out.g * _mul[1]);
  out.b = Math.min(1, out.b * _mul[2]);
  return out;
}

function buildChunk(cx: number, cz: number, lod: Lod) {
  const step = lod.step;
  const ix0 = cx * N * step;
  const iz0 = cz * N * step;
  const side = N + 1;
  const skirt = 4 * side;
  const count = side * side + skirt;
  const pos = new Float32Array(count * 3);
  const nrm = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const d = CELL * step;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let j = 0; j < side; j++) {
    for (let i = 0; i < side; i++) {
      const ix = ix0 + i * step;
      const iz = iz0 + j * step;
      const x = ix * CELL;
      const z = iz * CELL;
      const y = gridH(ix, iz);
      const hx = gridH(ix + step, iz) - gridH(ix - step, iz);
      const hz = gridH(ix, iz + step) - gridH(ix, iz - step);
      const k = (j * side + i) * 3;
      pos[k] = x;
      pos[k + 1] = y;
      pos[k + 2] = z;
      const nx = -hx / (2 * d);
      const nz = -hz / (2 * d);
      const len = Math.hypot(nx, 1, nz);
      nrm[k] = nx / len;
      nrm[k + 1] = 1 / len;
      nrm[k + 2] = nz / len;
      groundColor(x, z, y, Math.hypot(hx, hz) / (2 * d), _c);
      col[k] = _c.r;
      col[k + 1] = _c.g;
      col[k + 2] = _c.b;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  // Skirt: a dropped copy of the border, so LOD steps never show sky.
  const drop = lod.drop;
  const border: number[] = [];
  for (let i = 0; i < side; i++) border.push(i);
  for (let j = 0; j < side; j++) border.push(j * side + (side - 1));
  for (let i = side - 1; i >= 0; i--) border.push((side - 1) * side + i);
  for (let j = side - 1; j >= 0; j--) border.push(j * side);
  const idx: number[] = [];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const a = j * side + i;
      const b = a + 1;
      const c = a + side;
      const e = c + 1;
      idx.push(a, c, b, b, c, e);
    }
  }
  const base = side * side;
  for (let s = 0; s < border.length; s++) {
    const src = border[s]! * 3;
    const dst = (base + s) * 3;
    pos[dst] = pos[src]!;
    pos[dst + 1] = pos[src + 1]! - drop;
    pos[dst + 2] = pos[src + 2]!;
    nrm[dst] = nrm[src]!;
    nrm[dst + 1] = nrm[src + 1]!;
    nrm[dst + 2] = nrm[src + 2]!;
    col[dst] = col[src]!;
    col[dst + 1] = col[src + 1]!;
    col[dst + 2] = col[src + 2]!;
  }
  for (let s = 0; s < border.length - 1; s++) {
    const a = border[s]!;
    const b = border[s + 1]!;
    if (a === b) continue;
    const sa = base + s;
    const sb = base + s + 1;
    idx.push(a, b, sa, b, sb, sa);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  const half = lod.size / 2;
  g.boundingSphere = new THREE.Sphere(
    new THREE.Vector3((cx + 0.5) * lod.size, (minY + maxY) / 2, (cz + 0.5) * lod.size),
    Math.hypot(half, half, (maxY - minY) / 2 + drop),
  );
  return g;
}

/** Road + trail mask, rasterised once. R = packed dirt, sampled by world XZ in the ground shader. */
const MASK = { x0: -192, z0: VZ - 176, size: 384 };
let maskTex: THREE.Texture | null = null;
function pathMask() {
  if (maskTex) return maskTex;
  const px = 2048;
  const c = document.createElement("canvas");
  c.width = c.height = px;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, px, px);
  const s = px / MASK.size;
  const tx = (x: number) => (x - MASK.x0) * s;
  const tz = (z: number) => (z - MASK.z0) * s;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.filter = `blur(${(0.55 * s).toFixed(1)}px)`;
  ctx.strokeStyle = "#fff";
  for (const run of PATH_RUNS) {
    ctx.lineWidth = run.half * 1.5 * s;
    ctx.beginPath();
    run.pts.forEach((p, i) => (i ? ctx.lineTo(tx(p[0]), tz(p[1])) : ctx.moveTo(tx(p[0]), tz(p[1]))));
    ctx.stroke();
  }
  // Keep road: a gentle S from the village green up to the gate.
  ctx.lineWidth = 3.6 * s;
  ctx.beginPath();
  for (let z = VZ + 10; z <= KEEP_Z - 8; z += 2) {
    const x = -Math.sin(z * 0.045) * 1.6;
    if (z === VZ + 10) ctx.moveTo(tx(x), tz(z));
    else ctx.lineTo(tx(x), tz(z));
  }
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  maskTex = t;
  return t;
}


const NOISE_GLSL = /* glsl */ `
float lushHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float lushNoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(lushHash(i), lushHash(i+vec2(1,0)), u.x), mix(lushHash(i+vec2(0,1)), lushHash(i+vec2(1,1)), u.x), u.y);
}`;

type Shared = { uSink: { value: number }[] };

function groundMaterial(level: number, shared: Shared) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0, envMapIntensity: 0.05 });
  if (level > 0) {
    m.polygonOffset = true;
    m.polygonOffsetFactor = 2 * level;
    m.polygonOffsetUnits = 2 * level;
  }
  // Coarser rings duck under the finer ring in front of them so the two never fight.
  const inner = level === 1 ? [70, 92, 9] : [470, 560, 40];
  // Each ring compiles different vertex code; without its own key three would reuse ring 0's program.
  m.customProgramCacheKey = () => `lush-ground-${level}`;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uMask = { value: pathMask() };
    sh.uniforms.uMaskRect = { value: new THREE.Vector3(MASK.x0, MASK.z0, MASK.size) };
    sh.uniforms.uDirt = { value: GROUND.dirt };
    sh.uniforms.uDirtDark = { value: GROUND.dirtDark };
    sh.uniforms.uSink = shared.uSink[level]!;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vLushPos;\nuniform float uSink;`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        ${
          level > 0
            ? `float lushD = distance(transformed.xz, cameraPosition.xz);
               transformed.y -= ${(0.3 * level).toFixed(2)} + uSink * (1.0 - smoothstep(${inner[0]!.toFixed(1)}, ${inner[1]!.toFixed(1)}, lushD)) * ${inner[2]!.toFixed(1)};`
            : ""
        }
        vLushPos = transformed;`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vLushPos;
        uniform sampler2D uMask; uniform vec3 uMaskRect; uniform vec3 uDirt; uniform vec3 uDirtDark;
        ${NOISE_GLSL}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        {
          vec2 wp = vLushPos.xz;
          float fine = lushNoise(wp * 2.3) * 0.6 + lushNoise(wp * 7.1) * 0.4;
          float broad = lushNoise(wp * 0.23);
          diffuseColor.rgb *= 0.86 + fine * 0.2 + broad * 0.1;
          vec2 muv = (wp - uMaskRect.xy) / uMaskRect.z;
          if (muv.x > 0.0 && muv.x < 1.0 && muv.y > 0.0 && muv.y < 1.0) {
            float pm = texture2D(uMask, muv).r;
            float edge = pm + (fine - 0.5) * 0.35;
            float ef = smoothstep(0.0, 0.05, min(min(muv.x, 1.0 - muv.x), min(muv.y, 1.0 - muv.y)));
            float k = smoothstep(0.34, 0.52, edge) * ef;
            vec3 dirt = mix(uDirtDark, uDirt, smoothstep(0.45, 0.9, pm) * 0.7 + fine * 0.3);
            dirt *= 0.9 + lushNoise(wp * 13.0) * 0.18;
            diffuseColor.rgb = mix(diffuseColor.rgb, dirt, k);
          }
        }`,
      );
  };
  return m;
}

type Chunk = { mesh: THREE.Mesh; cx: number; cz: number; lod: Lod };
const geoCache = new Map<string, THREE.BufferGeometry>();

export function LushTerrain() {
  const group = useRef<THREE.Group>(null);
  const chunks = useRef(new Map<string, Chunk>());
  const shared = useMemo<Shared>(() => ({ uSink: [{ value: 0 }, { value: 0 }, { value: 0 }] }), []);
  const mats = useMemo(() => LODS.map((_, i) => groundMaterial(i, shared)), [shared]);
  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);

  useFrame(({ camera }) => {
    const g = group.current;
    if (!g) return;
    const t0 = performance.now();
    // Is the ring that must cover a coarser ring's hole fully there?
    const ringHas = (lod: Lod, r: number) => {
      const ccx = Math.floor(camera.position.x / lod.size);
      const ccz = Math.floor(camera.position.z / lod.size);
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) if (!chunks.current.has(`${lod.id}${ccx + dx},${ccz + dz}`)) return false;
      }
      return true;
    };
    const covered = LODS.map((lod) => ringHas(lod, lod.ring));
    const core = LODS.map((lod) => ringHas(lod, lod.ring - 1));
    // A QA shot camera is a teleport: fill in at once rather than over a second of frames.
    const budget = live.shotCam ? 600 : covered[0] ? 5 : 22;
    LODS.forEach((lod, li) => {
      const ccx = Math.floor(camera.position.x / lod.size);
      const ccz = Math.floor(camera.position.z / lod.size);
      const want: { cx: number; cz: number; d: number }[] = [];
      for (let dz = -lod.ring; dz <= lod.ring; dz++) {
        for (let dx = -lod.ring; dx <= lod.ring; dx++) {
          const cx = ccx + dx;
          const cz = ccz + dz;
          if (!chunks.current.has(`${lod.id}${cx},${cz}`)) want.push({ cx, cz, d: dx * dx + dz * dz });
        }
      }
      want.sort((a, b) => a.d - b.d);
      for (const w of want) {
        // Always make progress on every ring, even on a slow frame.
        if (performance.now() - t0 > budget && w !== want[0]) break;
        const k = `${lod.id}${w.cx},${w.cz}`;
        let geo = geoCache.get(k);
        if (!geo) {
          geo = buildChunk(w.cx, w.cz, lod);
          geoCache.set(k, geo);
        }
        const mesh = new THREE.Mesh(geo, mats[li]);
        mesh.receiveShadow = true;
        mesh.matrixAutoUpdate = false;
        g.add(mesh);
        chunks.current.set(k, { mesh, cx: w.cx, cz: w.cz, lod });
      }
      for (const [k, c] of chunks.current) {
        if (c.lod !== lod) continue;
        if (Math.abs(c.cx - ccx) > lod.ring + 1 || Math.abs(c.cz - ccz) > lod.ring + 1) {
          g.remove(c.mesh);
          chunks.current.delete(k);
        }
      }
    });
    if (geoCache.size > 320) {
      for (const [k, geo] of geoCache) {
        if (chunks.current.has(k)) continue;
        geo.dispose();
        geoCache.delete(k);
        if (geoCache.size <= 240) break;
      }
    }
    for (let i = 1; i < LODS.length; i++) {
      const u = shared.uSink[i]!;
      if (covered[i - 1]) u.value = 1;
      else if (!core[i - 1]) u.value = 0;
    }
  });

  return <group ref={group} />;
}
