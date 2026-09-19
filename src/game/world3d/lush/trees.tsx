import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fieldHeight } from "../field";
import { atmo } from "./atmo";
import { seeded } from "./grid";

/**
 * Key-art trees: chunky faceted canopies with sun-struck tops and deep blue-green undersides,
 * on thick planar trunks. Every tree is one vertex-coloured mesh, so a forest can be instanced.
 */

const LEAF = {
  top: new THREE.Color("#a7c843"),
  lit: new THREE.Color("#7fae35"),
  mid: new THREE.Color("#4f8a2c"),
  dark: new THREE.Color("#2c5f2a"),
  deep: new THREE.Color("#1e4a2b"),
};
const PINE = {
  top: new THREE.Color("#6f9e3c"),
  lit: new THREE.Color("#3f7a34"),
  mid: new THREE.Color("#2a5c30"),
  dark: new THREE.Color("#1b4430"),
  deep: new THREE.Color("#12332a"),
};
const BARK = {
  lit: new THREE.Color("#8a6238"),
  mid: new THREE.Color("#6a472a"),
  dark: new THREE.Color("#45301f"),
};

type Buf = { pos: number[]; col: number[]; sway: number[] };

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _n = new THREE.Vector3();
const _col = new THREE.Color();

/** Append a flat-shaded triangle soup, colouring each face by where it points. */
function pushFaces(
  buf: Buf,
  geo: THREE.BufferGeometry,
  m: THREE.Matrix4,
  pal: { top?: THREE.Color; lit: THREE.Color; mid: THREE.Color; dark: THREE.Color; deep?: THREE.Color },
  rnd: () => number,
  sway: number,
  swayBase = 0,
) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i += 3) {
    _a.fromBufferAttribute(p, i).applyMatrix4(m);
    _b.fromBufferAttribute(p, i + 1).applyMatrix4(m);
    _c.fromBufferAttribute(p, i + 2).applyMatrix4(m);
    _n.subVectors(_b, _a).cross(_c.clone().sub(_a)).normalize();
    // Painted light: up-facing and sun-side facets go bright, undersides go deep and cool.
    const up = _n.y;
    const side = _n.x * -0.55 + _n.z * 0.6;
    let v = up * 0.62 + side * 0.3 + (rnd() - 0.5) * 0.42;
    v = Math.max(-1, Math.min(1, v));
    if (v > 0.5 && pal.top) _col.copy(pal.lit).lerp(pal.top, (v - 0.5) * 2);
    else if (v > 0) _col.copy(pal.mid).lerp(pal.lit, v * 2);
    else if (v > -0.5 || !pal.deep) _col.copy(pal.mid).lerp(pal.dark, Math.min(1, -v * 2));
    else _col.copy(pal.dark).lerp(pal.deep, (-v - 0.5) * 2);
    for (const q of [_a, _b, _c]) {
      buf.pos.push(q.x, q.y, q.z);
      buf.col.push(_col.r, _col.g, _col.b);
      buf.sway.push(swayBase + sway);
    }
  }
  if (g !== geo) g.dispose();
}

function blob(r: number, detail: number, rnd: () => number, jitter: number) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  // Icosahedron is non-indexed: jitter by position hash so shared corners stay welded.
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    const k = 1 + ((h - Math.floor(h)) - 0.5) * 2 * jitter;
    p.setXYZ(i, x * k, y * k, z * k);
  }
  void rnd;
  return g;
}

function finish(buf: Buf) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(buf.pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(buf.col, 3));
  g.setAttribute("aSway", new THREE.Float32BufferAttribute(buf.sway, 1));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

function trunkInto(buf: Buf, rnd: () => number, h: number, r0: number, r1: number, sides = 7) {
  const rings = 4;
  const bend = (rnd() - 0.5) * 0.5;
  const bendA = rnd() * Math.PI * 2;
  const m = new THREE.Matrix4();
  for (let k = 0; k < rings; k++) {
    const u0 = k / rings;
    const u1 = (k + 1) / rings;
    const ra = r0 + (r1 - r0) * Math.pow(u0, 0.7) + (k === 0 ? r0 * 0.55 : 0);
    const rb = r0 + (r1 - r0) * Math.pow(u1, 0.7);
    const seg = new THREE.CylinderGeometry(rb, ra, h / rings, sides, 1, true);
    const off = (u: number) => Math.sin(u * Math.PI) * bend;
    m.makeTranslation(Math.cos(bendA) * off((u0 + u1) / 2), h * (u0 + u1) * 0.5, Math.sin(bendA) * off((u0 + u1) / 2));
    pushFaces(buf, seg, m, BARK, rnd, 0);
    seg.dispose();
  }
  return { bend, bendA };
}

/** Broad-leaf tree, ~6.4 units tall at scale 1. */
export function oakGeo(seed: number) {
  const rnd = seeded(seed * 7919 + 13);
  const buf: Buf = { pos: [], col: [], sway: [] };
  const h = 2.9 + rnd() * 0.7;
  trunkInto(buf, rnd, h, 0.36, 0.2);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const crownY = h + 1.15;
  const n = 7 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const main = i === 0;
    const a = (i / (n - 1)) * Math.PI * 2 + rnd() * 0.7;
    const rad = main ? 0 : 1.15 + rnd() * 0.75;
    const r = main ? 1.95 + rnd() * 0.25 : 1.05 + rnd() * 0.55;
    const y = main ? crownY + 0.35 : crownY - 0.55 + rnd() * 1.25;
    const g = blob(1, 1, rnd, 0.16);
    e.set(rnd() * 3, rnd() * 3, rnd() * 3);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad), q, new THREE.Vector3(r * 1.12, r * 0.86, r * 1.12));
    pushFaces(buf, g, m, LEAF, rnd, 0.5 + rnd() * 0.5, 0.2);
    g.dispose();
    if (!main && i % 2 === 0) {
      // A limb reaching into the clump.
      const limb = new THREE.CylinderGeometry(0.07, 0.13, 1, 5, 1, true);
      const from = new THREE.Vector3(0, h * 0.78, 0);
      const to = new THREE.Vector3(Math.cos(a) * rad * 0.8, y - r * 0.35, Math.sin(a) * rad * 0.8);
      const dir = to.clone().sub(from);
      const len = dir.length();
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      m.compose(from.clone().add(to).multiplyScalar(0.5), q, new THREE.Vector3(1, len, 1));
      pushFaces(buf, limb, m, BARK, rnd, 0);
      limb.dispose();
    }
  }
  return finish(buf);
}

/** Conifer: stacked skirts of faceted cones, ~7.5 units tall at scale 1. */
export function pineGeo(seed: number) {
  const rnd = seeded(seed * 4157 + 5);
  const buf: Buf = { pos: [], col: [], sway: [] };
  const h = 7 + rnd() * 1.4;
  trunkInto(buf, rnd, h * 0.42, 0.26, 0.14, 6);
  const tiers = 4 + Math.floor(rnd() * 2);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let i = 0; i < tiers; i++) {
    const u = i / (tiers - 1);
    const r = (2.05 - u * 1.45) * (0.9 + rnd() * 0.2);
    const th = (2.5 - u * 0.7) * (0.9 + rnd() * 0.2);
    const y = h * 0.24 + u * h * 0.62;
    const cone = new THREE.ConeGeometry(r, th, 7, 2, true);
    const p = cone.getAttribute("position");
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k);
      const yy = p.getY(k);
      const z = p.getZ(k);
      const hsh = Math.sin(x * 12.9898 + yy * 78.233 + z * 37.719 + i) * 43758.5453;
      const j = 1 + ((hsh - Math.floor(hsh)) - 0.5) * 0.3;
      // Skirt hem droops.
      const droop = yy < -th * 0.4 ? -0.25 * (hsh - Math.floor(hsh)) : 0;
      p.setXYZ(k, x * j, yy + droop, z * j);
    }
    q.setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.1, rnd() * 6, (rnd() - 0.5) * 0.1));
    m.compose(new THREE.Vector3(0, y + th * 0.5, 0), q, new THREE.Vector3(1, 1, 1));
    pushFaces(buf, cone, m, PINE, rnd, 0.3 + u * 0.7, 0.1);
    cone.dispose();
  }
  return finish(buf);
}

/** Low rounded shrub. */
export function bushGeo(seed: number) {
  const rnd = seeded(seed * 3301 + 29);
  const buf: Buf = { pos: [], col: [], sway: [] };
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const n = 3 + Math.floor(rnd() * 2);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = i === 0 ? 0 : 0.35 + rnd() * 0.3;
    const r = i === 0 ? 0.62 : 0.4 + rnd() * 0.2;
    const g = blob(1, 1, rnd, 0.18);
    q.setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3));
    m.compose(new THREE.Vector3(Math.cos(a) * rad, r * 0.7, Math.sin(a) * rad), q, new THREE.Vector3(r * 1.15, r * 0.85, r * 1.15));
    pushFaces(buf, g, m, LEAF, rnd, 0.4, 0.1);
    g.dispose();
  }
  return finish(buf);
}

const geoCache = new Map<string, THREE.BufferGeometry>();
export function treeGeo(kind: "oak" | "pine" | "bush", variant: number) {
  const k = `${kind}${variant}`;
  let g = geoCache.get(k);
  if (!g) {
    g = kind === "pine" ? pineGeo(variant + 1) : kind === "bush" ? bushGeo(variant + 1) : oakGeo(variant + 1);
    geoCache.set(k, g);
  }
  return g;
}
export const OAK_VARIANTS = 5;
export const PINE_VARIANTS = 4;
export const BUSH_VARIANTS = 3;

const uniforms = {
  uTime: { value: 0 },
  uSunDir: { value: atmo.sunDir },
  uSunColor: { value: atmo.sunColor },
  uBack: { value: 1 },
};

let sharedMat: THREE.MeshStandardMaterial | null = null;
/** One material for every lush tree. Leaves sway; canopy edges glow toward a low sun. */
export function treeMaterial() {
  if (sharedMat) return sharedMat;
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.82, metalness: 0, envMapIntensity: 0.1 });
  m.customProgramCacheKey = () => "lush-tree";
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>\nattribute float aSway; uniform float uTime; varying float vLushLeaf; varying vec3 vLushW;`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        {
          vec3 wp = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          #ifdef USE_INSTANCING
            wp = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          #endif
          float ph = wp.x * 0.13 + wp.z * 0.17;
          float gust = sin(uTime * 0.55 + wp.x * 0.045 + wp.z * 0.06) * 0.5 + 0.5;
          float s = aSway * (0.03 + gust * 0.07);
          transformed.x += sin(uTime * 1.3 + ph + position.y * 0.6) * s;
          transformed.z += cos(uTime * 1.1 + ph * 1.3 + position.x * 0.5) * s * 0.7;
          transformed.y += sin(uTime * 1.7 + ph + position.x * 0.9) * s * 0.25;
          vLushLeaf = step(0.05, aSway);
        }`,
      )
      .replace("#include <worldpos_vertex>", `#include <worldpos_vertex>\nvLushW = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#ifdef USE_INSTANCING\nvLushW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#endif`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uBack; varying float vLushLeaf; varying vec3 vLushW;`)
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        {
          vec3 V = normalize(vLushW - cameraPosition);
          float toward = pow(max(dot(V, uSunDir), 0.0), 3.0);
          totalEmissiveRadiance += diffuseColor.rgb * uSunColor * toward * 0.55 * vLushLeaf * uBack;
        }`,
      );
  };
  sharedMat = m;
  return m;
}

export function LushTreeClock() {
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uBack.value = Math.max(0, 1 - atmo.dusk * 1.3) * Math.min(1.4, atmo.sunI);
  });
  return null;
}

export type TreeSpec = { x: number; z: number; s: number; kind: "oak" | "pine" | "bush"; y?: number; seed?: number };

const CELL = 320;

/** A whole forest in a handful of draw calls: instanced per variant, bucketed so far cells cull. */
export function LushForest({ spots, castShadow = true }: { spots: TreeSpec[]; castShadow?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const meshes = useMemo(() => {
    const buckets = new Map<string, { kind: TreeSpec["kind"]; variant: number; items: TreeSpec[]; cx: number; cz: number }>();
    spots.forEach((t, i) => {
      const nVar = t.kind === "pine" ? PINE_VARIANTS : t.kind === "bush" ? BUSH_VARIANTS : OAK_VARIANTS;
      const variant = Math.abs(Math.floor((t.seed ?? i) * 2654435761)) % nVar;
      const cx = Math.floor(t.x / CELL);
      const cz = Math.floor(t.z / CELL);
      const k = `${cx},${cz},${t.kind}${variant}`;
      let b = buckets.get(k);
      if (!b) {
        b = { kind: t.kind, variant, items: [], cx, cz };
        buckets.set(k, b);
      }
      b.items.push(t);
    });
    const mat = treeMaterial();
    const dummy = new THREE.Object3D();
    const out: THREE.InstancedMesh[] = [];
    for (const b of buckets.values()) {
      const geo = treeGeo(b.kind, b.variant);
      const im = new THREE.InstancedMesh(geo, mat, b.items.length);
      const box = new THREE.Box3();
      b.items.forEach((t, i) => {
        const rnd = seeded(Math.round(t.x * 13 + t.z * 7) + 3);
        const y = t.y ?? fieldHeight(t.x, t.z);
        dummy.position.set(t.x, y - 0.12 * t.s, t.z);
        dummy.rotation.set((rnd() - 0.5) * 0.06, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.06);
        const sy = t.s * (0.92 + rnd() * 0.2);
        dummy.scale.set(t.s, sy, t.s);
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
        box.expandByPoint(new THREE.Vector3(t.x, y, t.z));
      });
      im.instanceMatrix.needsUpdate = true;
      box.expandByScalar(16);
      im.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
      im.castShadow = castShadow;
      im.receiveShadow = true;
      im.matrixAutoUpdate = false;
      out.push(im);
    }
    return out;
  }, [spots, castShadow]);

  useEffect(() => {
    const g = group.current;
    if (!g) return;
    for (const m of meshes) g.add(m);
    return () => {
      for (const m of meshes) {
        g.remove(m);
        m.dispose();
      }
    };
  }, [meshes]);

  useFrame(({ camera }) => {
    for (const m of meshes) {
      const s = m.boundingSphere!;
      m.visible = s.center.distanceTo(camera.position) - s.radius < 1700;
    }
  });

  return <group ref={group} />;
}

/** A single lush tree, for the places that still want one tree as a component. */
export function LushTree({
  kind = "oak",
  variant = 0,
  scale = 1,
  ...rest
}: { kind?: "oak" | "pine" | "bush"; variant?: number; scale?: number | [number, number, number] } & Omit<
  React.ComponentProps<"mesh">,
  "scale"
>) {
  const nVar = kind === "pine" ? PINE_VARIANTS : kind === "bush" ? BUSH_VARIANTS : OAK_VARIANTS;
  return <mesh geometry={treeGeo(kind, Math.abs(variant) % nVar)} material={treeMaterial()} scale={scale} castShadow receiveShadow {...rest} />;
}
