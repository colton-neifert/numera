import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { live } from "../live";
import { atmo, gfxLevel } from "./atmo";
import { landMul, sampleGrass, sampleH, seeded, vnoise } from "./grid";
import { GROUND, groundShade, turfColor } from "./palette";

/**
 * Key-art grass: real blades, everywhere you look.
 *
 * Three tiers of instanced clumps on camera-centred tiles — fine blades underfoot, broader clumps in the
 * mid field, big soft tufts far out. Each tier scales itself to nothing at the edge of its band in the
 * vertex shader, so tiles can pop in and out without a visible seam. Blades take their root colour from
 * the same palette + noise as the ground, so they melt into the turf instead of sitting on it.
 */

type Tier = {
  id: string;
  tile: number;
  radius: number;
  density: number;
  fadeIn: [number, number];
  fadeOut: [number, number];
  blades: number;
  width: number;
  height: number;
  spread: number;
  segs: number;
  flower?: boolean;
};

const TIERS_HIGH: Tier[] = [
  { id: "a", tile: 12, radius: 30, density: 15, fadeIn: [-2, -1], fadeOut: [21, 30], blades: 3, width: 0.055, height: 0.3, spread: 0.13, segs: 2 },
  { id: "b", tile: 24, radius: 84, density: 2.6, fadeIn: [16, 27], fadeOut: [62, 84], blades: 4, width: 0.13, height: 0.36, spread: 0.3, segs: 2 },
  { id: "c", tile: 48, radius: 190, density: 0.42, fadeIn: [52, 80], fadeOut: [140, 190], blades: 5, width: 0.42, height: 0.46, spread: 0.8, segs: 1 },
  { id: "f", tile: 24, radius: 70, density: 0.55, fadeIn: [-2, -1], fadeOut: [48, 70], blades: 1, width: 0.12, height: 0.34, spread: 0, segs: 1, flower: true },
];

const TIERS_LOW: Tier[] = [
  { id: "a", tile: 12, radius: 20, density: 5, fadeIn: [-2, -1], fadeOut: [13, 20], blades: 3, width: 0.07, height: 0.42, spread: 0.16, segs: 1 },
  { id: "b", tile: 24, radius: 56, density: 0.9, fadeIn: [10, 18], fadeOut: [40, 56], blades: 4, width: 0.2, height: 0.5, spread: 0.4, segs: 1 },
  { id: "f", tile: 24, radius: 44, density: 0.3, fadeIn: [-2, -1], fadeOut: [30, 44], blades: 1, width: 0.12, height: 0.34, spread: 0, segs: 1, flower: true },
];

/** A clump of tapered, forward-curving blades. uv.y = height along the blade. */
function clumpGeo(t: Tier) {
  const rnd = seeded(t.blades * 97 + Math.round(t.width * 1000));
  const pos: number[] = [];
  const nrm: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let b = 0; b < t.blades; b++) {
    const a = (b / t.blades) * Math.PI * 2 + rnd() * 1.2;
    const r = b === 0 ? 0 : t.spread * (0.45 + rnd() * 0.55);
    const ox = Math.cos(a) * r;
    const oz = Math.sin(a) * r;
    const yaw = rnd() * Math.PI * 2;
    const h = t.height * (0.7 + rnd() * 0.6);
    const w = t.width * (0.8 + rnd() * 0.4);
    const lean = (0.25 + rnd() * 0.45) * h;
    const cx = Math.cos(yaw);
    const sx = Math.sin(yaw);
    const base = pos.length / 3;
    const rows = t.segs;
    for (let k = 0; k <= rows; k++) {
      const u = k / (rows + 1);
      const ww = w * (1 - u * 0.55);
      const fwd = lean * u * u;
      for (const side of [-1, 1]) {
        const lx = side * ww * 0.5;
        pos.push(ox + lx * cx + fwd * sx, h * u, oz - lx * sx + fwd * cx);
        nrm.push(sx, 0, cx);
        uv.push(side * 0.5 + 0.5, u);
      }
    }
    pos.push(ox + lean * sx, h, oz + lean * cx);
    nrm.push(sx, 0, cx);
    uv.push(0.5, 1);
    for (let k = 0; k < rows; k++) {
      const i0 = base + k * 2;
      idx.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2);
    }
    const top = base + rows * 2;
    idx.push(top, top + 1, top + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Little meadow flower: thin stem, six flat petals, a bead centre. uv.x tags the part. */
function flowerGeo() {
  const pos: number[] = [];
  const nrm: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const h = 1;
  // stem (crossed quads), part = 0
  for (const yaw of [0, Math.PI / 2]) {
    const c = Math.cos(yaw) * 0.018;
    const s = Math.sin(yaw) * 0.018;
    const b = pos.length / 3;
    pos.push(-c, 0, -s, c, 0, s, -c * 0.6, h, -s * 0.6, c * 0.6, h, s * 0.6);
    for (let i = 0; i < 4; i++) nrm.push(0, 1, 0);
    uv.push(0, 0, 0, 0, 0, 0.9, 0, 0.9);
    idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
  }
  // petals, part = 1
  const petals = 6;
  for (let p = 0; p < petals; p++) {
    const a = (p / petals) * Math.PI * 2;
    const a0 = a - 0.34;
    const a1 = a + 0.34;
    const r = 0.11;
    const b = pos.length / 3;
    pos.push(0, h, 0, Math.cos(a0) * r, h + 0.035, Math.sin(a0) * r, Math.cos(a) * r * 1.25, h + 0.02, Math.sin(a) * r * 1.25, Math.cos(a1) * r, h + 0.035, Math.sin(a1) * r);
    for (let i = 0; i < 4; i++) nrm.push(0, 1, 0);
    uv.push(1, 1, 1, 1, 1, 1, 1, 1);
    idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
  }
  // centre, part = 2
  {
    const b = pos.length / 3;
    const r = 0.042;
    pos.push(0, h + 0.06, 0);
    nrm.push(0, 1, 0);
    uv.push(2, 1);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      pos.push(Math.cos(a) * r, h + 0.03, Math.sin(a) * r);
      nrm.push(0, 1, 0);
      uv.push(2, 1);
    }
    for (let k = 0; k < 6; k++) idx.push(b, b + 1 + ((k + 1) % 6), b + 1 + k);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

type Uniforms = {
  uTime: { value: number };
  uHero: { value: THREE.Vector3 };
  uSunDir: { value: THREE.Vector3 };
  uSunColor: { value: THREE.Color };
  uBack: { value: number };
  uCuts: { value: THREE.Vector4[] };
};

const MAX_CUTS = 12;

function grassMaterial(t: Tier, u: Uniforms) {
  const m = new THREE.MeshLambertMaterial({ color: "#ffffff", side: THREE.DoubleSide });
  m.defines = { ...(m.defines ?? {}), LUSH_FLOWER: t.flower ? 1 : 0 };
  m.customProgramCacheKey = () => `lush-grass-${t.flower ? 1 : 0}`;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u, {
      uFadeIn: { value: new THREE.Vector2(...t.fadeIn) },
      uFadeOut: { value: new THREE.Vector2(...t.fadeOut) },
      uTip: { value: GROUND.tip },
      uDry: { value: GROUND.dry },
    });
    sh.vertexShader = sh.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute vec3 aOffset; attribute vec4 aParams; attribute vec3 aRoot;
        uniform float uTime; uniform vec3 uHero; uniform vec2 uFadeIn; uniform vec2 uFadeOut; uniform vec4 uCuts[${MAX_CUTS}];
        varying float vLushH; varying float vLushRnd; varying vec3 vLushRoot; varying vec3 vLushWorld; varying float vLushPart;`,
      )
      .replace(
        "#include <beginnormal_vertex>",
        `float lushC = cos(aParams.x); float lushS = sin(aParams.x);
        vec3 objectNormal = normalize(vec3((normal.x * lushC + normal.z * lushS) * 0.28, 1.0, (normal.z * lushC - normal.x * lushS) * 0.28));`,
      )
      .replace(
        "#include <begin_vertex>",
        `vec3 lp = position;
        lp.xz = vec2(lp.x * lushC + lp.z * lushS, lp.z * lushC - lp.x * lushS);
        float hh = uv.y;
        float dcam = distance(aOffset.xz, cameraPosition.xz);
        float fade = smoothstep(uFadeIn.x, uFadeIn.y, dcam) * (1.0 - smoothstep(uFadeOut.x, uFadeOut.y, dcam));
        // Sword cuts: mown stubble that grows back.
        float cut = 0.0;
        for (int i = 0; i < ${MAX_CUTS}; i++) {
          vec4 c = uCuts[i];
          cut = max(cut, c.w * (1.0 - smoothstep(c.z * 0.75, c.z, distance(aOffset.xz, c.xy))));
        }
        float grow = aParams.y * fade;
        lp.xz *= grow * (1.0 - cut * 0.35);
        lp.y *= grow * (1.0 - cut * 0.8);
        float ph = aParams.w * 6.283;
        float gust = sin(uTime * 0.55 + aOffset.x * 0.045 + aOffset.z * 0.06) * 0.5 + 0.5;
        float flutter = sin(uTime * 2.3 + aOffset.x * 0.9 + aOffset.z * 0.7 + ph);
        float swayAmt = (0.035 + gust * 0.11) * (1.0 - cut);
        vec2 wind = vec2(0.82, 0.57) * (swayAmt * (0.6 + flutter * 0.4) + gust * 0.04);
        lp.xz += wind * hh * hh * aParams.y;
        // The hero parts the grass.
        vec2 away = aOffset.xz - uHero.xz;
        float dl = length(away);
        float push = (1.0 - smoothstep(0.25, 1.15, dl)) * step(abs(aOffset.y - uHero.y), 1.6);
        lp.xz += (away / max(dl, 0.001)) * push * 0.34 * hh;
        lp.y -= push * 0.16 * hh;
        vec3 transformed = lp + aOffset;
        vLushH = hh; vLushRnd = aParams.w; vLushRoot = aRoot; vLushWorld = transformed; vLushPart = uv.x;`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform vec3 uTip; uniform vec3 uDry; uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uBack;
        varying float vLushH; varying float vLushRnd; varying vec3 vLushRoot; varying vec3 vLushWorld; varying float vLushPart;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec3 lushTipCol = mix(uTip, uDry, smoothstep(0.72, 1.0, vLushRnd) * 0.45);
        lushTipCol = mix(vLushRoot * 1.75, lushTipCol, 0.42);
        vec3 lushCol = mix(vLushRoot * 0.82, lushTipCol, smoothstep(0.05, 0.95, vLushH));
        #if LUSH_FLOWER == 1
          vec3 petal = vLushRnd < 0.5 ? vec3(0.98, 0.97, 0.92) : (vLushRnd < 0.8 ? vec3(1.0, 0.84, 0.22) : (vLushRnd < 0.9 ? vec3(0.95, 0.55, 0.62) : vec3(0.62, 0.66, 0.96)));
          vec3 heart = vLushRnd < 0.5 ? vec3(1.0, 0.8, 0.2) : vec3(0.85, 0.5, 0.12);
          lushCol = vLushPart < 0.5 ? mix(vLushRoot * 0.8, vLushRoot * 1.5, vLushH) : (vLushPart < 1.5 ? petal : heart);
        #endif
        diffuseColor.rgb = lushCol;`,
      )
      .replace("#include <normal_fragment_begin>", `#include <normal_fragment_begin>\nnormal = normalize(vNormal);`)
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        {
          // Low sun through the blades: tips glow when you look toward the light.
          vec3 V = normalize(vLushWorld - cameraPosition);
          float toward = pow(max(dot(V, uSunDir), 0.0), 2.0);
          float tipMask = smoothstep(0.35, 1.0, vLushH);
          #if LUSH_FLOWER == 1
            tipMask *= 0.4;
          #endif
          totalEmissiveRadiance += diffuseColor.rgb * uSunColor * (toward * 0.6 + 0.04) * tipMask * uBack;
        }`,
      );
  };
  return m;
}

type Tile = { mesh: THREE.Mesh; tx: number; tz: number; tier: Tier };

const _col = new THREE.Color();
const _mul: [number, number, number] = [1, 1, 1];

function buildTile(t: Tier, base: THREE.BufferGeometry, tx: number, tz: number) {
  const rnd = seeded((tx * 73856093) ^ (tz * 19349663) ^ (t.id.charCodeAt(0) * 83492791));
  const x0 = tx * t.tile;
  const z0 = tz * t.tile;
  const want = Math.round(t.tile * t.tile * t.density);
  const off = new Float32Array(want * 3);
  const par = new Float32Array(want * 4);
  const root = new Float32Array(want * 3);
  let n = 0;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < want; i++) {
    const x = x0 + rnd() * t.tile;
    const z = z0 + rnd() * t.tile;
    const r1 = rnd();
    const r2 = rnd();
    const r3 = rnd();
    let m = sampleGrass(x, z);
    if (t.flower) {
      // Flowers gather in drifts.
      const drift = vnoise(x * 0.045 + 40, z * 0.045 - 12);
      m *= Math.max(0, (drift - 0.48) * 3.2);
    }
    if (r1 >= m) continue;
    const y = sampleH(x, z);
    off[n * 3] = x;
    off[n * 3 + 1] = y - 0.03;
    off[n * 3 + 2] = z;
    const patch = vnoise(x * 0.35 + 9, z * 0.35 + 3);
    par[n * 4] = r2 * Math.PI * 2;
    par[n * 4 + 1] = (t.flower ? 0.3 + r3 * 0.22 : 0.62 + patch * 0.55 + r3 * 0.45) * (0.55 + Math.min(1, m) * 0.45);
    par[n * 4 + 2] = patch;
    par[n * 4 + 3] = rnd();
    turfColor(groundShade(x, z), _col);
    landMul(x, z, _mul);
    root[n * 3] = Math.min(1, _col.r * _mul[0]);
    root[n * 3 + 1] = Math.min(1, _col.g * _mul[1]);
    root[n * 3 + 2] = Math.min(1, _col.b * _mul[2]);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    n++;
  }
  if (n === 0) return null;
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  g.setAttribute("position", base.getAttribute("position"));
  g.setAttribute("normal", base.getAttribute("normal"));
  g.setAttribute("uv", base.getAttribute("uv"));
  g.setAttribute("aOffset", new THREE.InstancedBufferAttribute(off.subarray(0, n * 3), 3));
  g.setAttribute("aParams", new THREE.InstancedBufferAttribute(par.subarray(0, n * 4), 4));
  g.setAttribute("aRoot", new THREE.InstancedBufferAttribute(root.subarray(0, n * 3), 3));
  g.instanceCount = n;
  g.userData.full = n;
  const half = t.tile / 2;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(x0 + half, (minY + maxY) / 2, z0 + half), Math.hypot(half, half, (maxY - minY) / 2 + 1.5));
  return g;
}

export function LushGrass() {
  const { gl } = useThree();
  const tiers = gfxLevel(gl) === "high" ? TIERS_HIGH : TIERS_LOW;
  const group = useRef<THREE.Group>(null);
  const tiles = useRef(new Map<string, Tile | null>());
  const cuts = useRef<{ x: number; z: number; t: number }[]>([]);
  const lastSlash = useRef<unknown>(null);
  const shown = useRef(1);
  const uniforms = useMemo<Uniforms>(
    () => ({
      uTime: { value: 0 },
      uHero: { value: new THREE.Vector3() },
      uSunDir: { value: atmo.sunDir },
      uSunColor: { value: atmo.sunColor },
      uBack: { value: 1 },
      uCuts: { value: Array.from({ length: MAX_CUTS }, () => new THREE.Vector4(0, 0, 1, 0)) },
    }),
    [],
  );
  const kit = useMemo(
    () => tiers.map((t) => ({ tier: t, geo: t.flower ? flowerGeo() : clumpGeo(t), mat: grassMaterial(t, uniforms) })),
    [tiers, uniforms],
  );
  useEffect(
    () => () => {
      for (const k of kit) {
        k.geo.dispose();
        k.mat.dispose();
      }
      for (const t of tiles.current.values()) t?.mesh.geometry.dispose();
      tiles.current.clear();
    },
    [kit],
  );

  useFrame(({ camera, clock }, dt) => {
    const g = group.current;
    if (!g) return;
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uHero.value.set(live.x, live.y, live.z);
    uniforms.uBack.value = Math.max(0, 1 - atmo.dusk * 1.3) * Math.min(1.4, atmo.sunI);

    // Sword swings mow a patch; it grows back over a minute.
    if (live.slash && live.slash !== lastSlash.current) {
      lastSlash.current = live.slash;
      cuts.current.push({ x: live.slash.x, z: live.slash.z, t: 1 });
      if (cuts.current.length > MAX_CUTS) cuts.current.shift();
    }
    if (!live.slash) lastSlash.current = null;
    for (const c of cuts.current) c.t = Math.max(0, c.t - dt / 70);
    cuts.current = cuts.current.filter((c) => c.t > 0);
    uniforms.uCuts.value.forEach((v, i) => {
      const c = cuts.current[i];
      if (c) v.set(c.x, c.z, 1.7, Math.min(1, c.t * 4));
      else v.set(0, 0, 1, 0);
    });

    // Instances are in random order, so drawing a prefix thins the field evenly.
    if (shown.current !== atmo.grass) {
      shown.current = atmo.grass;
      for (const tile of tiles.current.values()) {
        if (!tile) continue;
        const ig = tile.mesh.geometry as THREE.InstancedBufferGeometry;
        ig.instanceCount = Math.max(1, Math.floor((ig.userData.full as number) * atmo.grass));
      }
    }

    const t0 = performance.now();
    const cx = camera.position.x;
    const cz = camera.position.z;
    for (const k of kit) {
      const t = k.tier;
      const span = Math.ceil(t.radius / t.tile);
      const ctx = Math.floor(cx / t.tile);
      const ctz = Math.floor(cz / t.tile);
      const want: { tx: number; tz: number; d: number }[] = [];
      for (let dz = -span; dz <= span; dz++) {
        for (let dx = -span; dx <= span; dx++) {
          const tx = ctx + dx;
          const tz = ctz + dz;
          // Nearest / farthest point of the tile from the camera.
          const nx = Math.max(tx * t.tile, Math.min(cx, (tx + 1) * t.tile));
          const nz = Math.max(tz * t.tile, Math.min(cz, (tz + 1) * t.tile));
          const near = Math.hypot(nx - cx, nz - cz);
          if (near > t.radius) continue;
          const fx = Math.abs(cx - (tx + 0.5) * t.tile) + t.tile / 2;
          const fz = Math.abs(cz - (tz + 0.5) * t.tile) + t.tile / 2;
          if (Math.hypot(fx, fz) < t.fadeIn[0]) continue;
          if (!tiles.current.has(`${t.id}${tx},${tz}`)) want.push({ tx, tz, d: near });
        }
      }
      want.sort((a, b) => a.d - b.d);
      let built = 0;
      for (const w of want) {
        // Always lay a couple of tiles per tier, so slow machines still fill in promptly.
        if (performance.now() - t0 > (live.shotCam ? 900 : 6) && built >= 2) break;
        built++;
        const key = `${t.id}${w.tx},${w.tz}`;
        const geo = buildTile(t, k.geo, w.tx, w.tz);
        if (!geo) {
          tiles.current.set(key, null);
          continue;
        }
        geo.instanceCount = Math.max(1, Math.floor((geo.userData.full as number) * atmo.grass));
        const mesh = new THREE.Mesh(geo, k.mat);
        mesh.matrixAutoUpdate = false;
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        g.add(mesh);
        tiles.current.set(key, { mesh, tx: w.tx, tz: w.tz, tier: t });
      }
    }
    // Retire tiles far outside their band.
    if (tiles.current.size > 0 && Math.random() < 0.1) {
      for (const [key, tile] of tiles.current) {
        const t = tile?.tier ?? kit.find((k) => key.startsWith(k.tier.id))!.tier;
        const m = /(-?\d+),(-?\d+)$/.exec(key)!;
        const tx = Number(m[1]);
        const tz = Number(m[2]);
        const d = Math.hypot((tx + 0.5) * t.tile - cx, (tz + 0.5) * t.tile - cz);
        if (d > t.radius + t.tile * 2) {
          if (tile) {
            g.remove(tile.mesh);
            tile.mesh.geometry.dispose();
          }
          tiles.current.delete(key);
        }
      }
    }
  });

  return <group ref={group} />;
}
