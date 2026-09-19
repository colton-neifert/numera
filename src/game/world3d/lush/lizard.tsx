import * as THREE from "three";
import { lamb } from "../mats";

/**
 * The lizardfolk, rebuilt to be feared: a hunched, long-snouted raider with a toothed jaw, swept horns,
 * a bony dorsal ridge, clawed hands and digitigrade legs. Everything is swept, faceted geometry with
 * painted scale colours (dark spine, mottled flanks, banded belly plates), one mesh per body part, so it
 * drops into the existing rig: same pivots, same animation, new skin.
 * Local space: the creature faces +Z.
 */

export type Coat = { fur: string; belly: string; dark: string; shade: string; snout: string; paw: string; eye: string };

type Ring = { p: [number, number, number]; rx: number; ry: number };
type Buf = { pos: number[]; col: number[] };

const BONE = new THREE.Color("#e6dcc0");
const BONE_DARK = new THREE.Color("#a89a78");

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const _t = new THREE.Vector3();
const _s = new THREE.Vector3();
const _n = new THREE.Vector3();
const _c = new THREE.Color();

/** Sweep elliptical rings along a path. `paint(u, ventral, side, face)` returns the facet colour. */
function sweep(
  buf: Buf,
  rings: Ring[],
  radial: number,
  paint: (u: number, ventral: number, face: number) => THREE.Color,
  opts: { dorsal?: 1 | -1; capStart?: boolean; capEnd?: boolean; mirrorX?: boolean } = {},
) {
  const dorsal = opts.dorsal ?? -1;
  const pts: THREE.Vector3[][] = [];
  const mx = opts.mirrorX ? -1 : 1;
  rings.forEach((r, i) => {
    const a = rings[Math.max(0, i - 1)]!.p;
    const b = rings[Math.min(rings.length - 1, i + 1)]!.p;
    _t.set((b[0] - a[0]) * mx, b[1] - a[1], b[2] - a[2]).normalize();
    _s.set(1, 0, 0).addScaledVector(_t, -_t.x).normalize();
    _n.crossVectors(_s, _t).normalize();
    const row: THREE.Vector3[] = [];
    for (let k = 0; k < radial; k++) {
      const ang = (k / radial) * Math.PI * 2;
      row.push(
        new THREE.Vector3(r.p[0] * mx, r.p[1], r.p[2])
          .addScaledVector(_s, Math.cos(ang) * r.rx)
          .addScaledVector(_n, Math.sin(ang) * r.ry),
      );
    }
    pts.push(row);
  });
  let face = buf.pos.length;
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, u: number, ventral: number) => {
    face += 9;
    const col = paint(u, ventral, face);
    for (const q of [a, b, c]) {
      buf.pos.push(q.x, q.y, q.z);
      buf.col.push(col.r, col.g, col.b);
    }
  };
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 0; k < radial; k++) {
      const k1 = (k + 1) % radial;
      const ang = ((k + 0.5) / radial) * Math.PI * 2;
      const ventral = -Math.sin(ang) * dorsal;
      const u = (i + 0.5) / (pts.length - 1);
      tri(pts[i]![k]!, pts[i + 1]![k]!, pts[i]![k1]!, u, ventral);
      tri(pts[i]![k1]!, pts[i + 1]![k]!, pts[i + 1]![k1]!, u, ventral);
    }
  }
  const cap = (row: THREE.Vector3[], r: Ring, end: boolean, u: number) => {
    const c = new THREE.Vector3(r.p[0] * mx, r.p[1], r.p[2]);
    for (let k = 0; k < radial; k++) {
      const k1 = (k + 1) % radial;
      if (end) tri(c, row[k1]!, row[k]!, u, 0);
      else tri(c, row[k]!, row[k1]!, u, 0);
    }
  };
  if (opts.capStart) cap(pts[0]!, rings[0]!, false, 0);
  if (opts.capEnd) cap(pts[pts.length - 1]!, rings[rings.length - 1]!, true, 1);
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);
const _d = new THREE.Vector3();
const _v = new THREE.Vector3();

/** A faceted spike from `base` along `dir`. */
function spike(buf: Buf, base: [number, number, number], dir: [number, number, number], r: number, h: number, col: THREE.Color, sides = 4) {
  const g = new THREE.ConeGeometry(r, h, sides, 1, false).toNonIndexed();
  g.translate(0, h / 2, 0);
  _d.set(dir[0], dir[1], dir[2]).normalize();
  _q.setFromUnitVectors(_up, _d);
  _m.compose(new THREE.Vector3(base[0], base[1], base[2]), _q, new THREE.Vector3(1, 1, 0.7));
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    _v.fromBufferAttribute(p, i).applyMatrix4(_m);
    const shadeK = 0.82 + hash(i * 3.1 + base[1] * 17) * 0.3;
    buf.pos.push(_v.x, _v.y, _v.z);
    buf.col.push(col.r * shadeK, col.g * shadeK, col.b * shadeK);
  }
  g.dispose();
}

function finish(buf: Buf) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(buf.pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(buf.col, 3));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

function painter(coat: Coat, seed: number, opts: { plates?: boolean; limb?: boolean } = {}) {
  const fur = new THREE.Color(coat.fur);
  const dark = new THREE.Color(coat.dark);
  const shadeC = new THREE.Color(coat.shade);
  const belly = new THREE.Color(coat.belly);
  const bellyDark = belly.clone().multiplyScalar(0.72);
  return (u: number, ventral: number, face: number) => {
    const r = hash(face * 0.37 + seed);
    if (opts.plates && ventral > 0.42) {
      // Belly scutes: pale plates split by darker seams.
      const band = Math.floor(u * 11) % 2 === 0;
      return _c.copy(band ? belly : bellyDark).multiplyScalar(0.92 + r * 0.14);
    }
    if (ventral < -0.55) return _c.copy(dark).lerp(shadeC, r * 0.5);
    // Flanks: mottled, with broken dark bars like a monitor lizard.
    const bar = Math.sin(u * 23 + seed) > 0.55 && r > 0.3;
    _c.copy(bar ? shadeC : fur).lerp(dark, bar ? 0.35 : r * 0.22);
    if (opts.limb && ventral > 0.3) _c.lerp(belly, 0.25);
    return _c;
  };
}

const cache = new Map<string, THREE.BufferGeometry>();
function cached(key: string, make: () => THREE.BufferGeometry) {
  let g = cache.get(key);
  if (!g) {
    g = make();
    cache.set(key, g);
  }
  return g;
}
const keyOf = (c: Coat) => `${c.fur}${c.belly}${c.dark}${c.shade}`;

function Skin({ geo }: { geo: THREE.BufferGeometry }) {
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      {lamb("#ffffff", { kind: "scale", vertexColors: true, flat: true, rim: true })}
    </mesh>
  );
}

/** Hunched torso and neck with belly plates and a bony ridge down the spine. */
export function LizardTorso({ coat, seed = 0 }: { coat: Coat; seed?: number }) {
  const geo = cached(`torso${keyOf(coat)}${seed % 4}`, () => {
    const buf: Buf = { pos: [], col: [] };
    const rings: Ring[] = [
      { p: [0, 0.6, -0.07], rx: 0.1, ry: 0.09 },
      { p: [0, 0.7, -0.06], rx: 0.205, ry: 0.17 },
      { p: [0, 0.84, -0.03], rx: 0.235, ry: 0.2 },
      { p: [0, 0.98, 0.01], rx: 0.245, ry: 0.205 },
      { p: [0, 1.1, 0.05], rx: 0.27, ry: 0.2 },
      { p: [0, 1.2, 0.09], rx: 0.22, ry: 0.17 },
      { p: [0, 1.3, 0.12], rx: 0.13, ry: 0.125 },
      { p: [0, 1.42, 0.12], rx: 0.1, ry: 0.105 },
      { p: [0, 1.54, 0.09], rx: 0.09, ry: 0.095 },
    ];
    sweep(buf, rings, 10, painter(coat, seed, { plates: true }), { dorsal: -1, capStart: true, capEnd: true });
    // Dorsal ridge: tall over the shoulders, shrinking toward the hips and up the neck.
    const ridge: [number, number, number, number][] = [
      [1.5, -0.0, 0.1, 0.5],
      [1.4, 0.015, 0.15, 0.4],
      [1.28, -0.005, 0.2, 0.2],
      [1.17, -0.11, 0.26, 0.05],
      [1.04, -0.17, 0.3, -0.1],
      [0.92, -0.2, 0.26, -0.25],
      [0.8, -0.21, 0.2, -0.4],
      [0.7, -0.2, 0.14, -0.55],
    ];
    ridge.forEach(([y, z, h, lean], i) => spike(buf, [0, y, z], [0, 0.55 + lean * 0.4, -1], 0.05 + h * 0.08, h, i % 2 ? BONE_DARK : BONE));
    return finish(buf);
  });
  return <Skin geo={geo} />;
}

/** Long toothed skull. Sits in the rig's head group (origin at the top of the neck). */
export function LizardHead({ coat, royal }: { coat: Coat; royal?: boolean }) {
  const upper = cached(`skull${keyOf(coat)}`, () => {
    const buf: Buf = { pos: [], col: [] };
    const rings: Ring[] = [
      { p: [0, 0.02, -0.17], rx: 0.05, ry: 0.05 },
      { p: [0, 0.03, -0.1], rx: 0.125, ry: 0.105 },
      { p: [0, 0.035, 0.0], rx: 0.158, ry: 0.118 },
      { p: [0, 0.03, 0.1], rx: 0.15, ry: 0.098 },
      { p: [0, 0.012, 0.2], rx: 0.112, ry: 0.07 },
      { p: [0, 0.0, 0.32], rx: 0.088, ry: 0.055 },
      { p: [0, -0.005, 0.42], rx: 0.07, ry: 0.046 },
      { p: [0, -0.015, 0.47], rx: 0.04, ry: 0.028 },
    ];
    const paint = painter({ ...coat, fur: coat.snout }, 3);
    sweep(buf, rings, 10, (u, v, f) => (v > 0.5 ? _c.set("#3a1414") : paint(u, v, f)), { dorsal: -1, capStart: true, capEnd: true });
    // Swept-back horns and a crest of smaller spines.
    for (const sd of [-1, 1]) {
      spike(buf, [sd * 0.085, 0.11, -0.06], [sd * 0.35, 0.55, -1], 0.04, 0.27, BONE, 5);
      spike(buf, [sd * 0.13, 0.05, -0.1], [sd * 0.9, 0.25, -0.8], 0.028, 0.13, BONE_DARK);
      spike(buf, [sd * 0.14, -0.02, -0.06], [sd * 1, -0.1, -0.7], 0.024, 0.1, BONE_DARK);
      // Brow ridge: a hard slab that scowls toward the snout.
      spike(buf, [sd * 0.135, 0.085, 0.015], [sd * -0.25, -0.22, 1], 0.05, 0.17, new THREE.Color(coat.dark), 4);
    }
    spike(buf, [0, 0.13, -0.02], [0, 0.8, -0.6], 0.03, 0.12, BONE_DARK);
    // Upper teeth: uneven, curving back.
    for (const sd of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const z = 0.14 + i * 0.055;
        const x = sd * (0.118 - i * 0.0125);
        const big = i === 4 || i === 1;
        spike(buf, [x, -0.035 + i * 0.002, z], [sd * 0.08, -1, -0.12], big ? 0.016 : 0.011, big ? 0.075 : 0.04, BONE, 4);
      }
    }
    return finish(buf);
  });
  const jaw = cached(`jaw${keyOf(coat)}`, () => {
    const buf: Buf = { pos: [], col: [] };
    const rings: Ring[] = [
      { p: [0, 0, -0.03], rx: 0.1, ry: 0.035 },
      { p: [0, -0.01, 0.06], rx: 0.125, ry: 0.045 },
      { p: [0, -0.005, 0.18], rx: 0.1, ry: 0.036 },
      { p: [0, 0.0, 0.31], rx: 0.074, ry: 0.028 },
      { p: [0, 0.006, 0.4], rx: 0.05, ry: 0.02 },
    ];
    const belly = new THREE.Color(coat.belly).multiplyScalar(0.85);
    const paint = painter(coat, 5);
    sweep(buf, rings, 8, (u, v, f) => (v > 0.2 ? _c.copy(belly).multiplyScalar(0.9 + hash(f) * 0.15) : v < -0.4 ? _c.set("#4a1818") : paint(u, v, f)), {
      dorsal: -1,
      capStart: true,
      capEnd: true,
    });
    for (const sd of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const z = 0.12 + i * 0.058;
        spike(buf, [sd * (0.092 - i * 0.011), 0.02, z], [sd * 0.05, 1, -0.1], 0.01, i === 3 ? 0.06 : 0.034, BONE, 4);
      }
    }
    return finish(buf);
  });
  const k = royal ? 1.16 : 1;
  return (
    <group scale={k}>
      <Skin geo={upper} />
      {/* Jaw hangs a little open: teeth and a dark throat, always. */}
      <group position={[0, -0.07, 0.0]} rotation={[0.2, 0, 0]}>
        <Skin geo={jaw} />
      </group>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[sd * 0.118, 0.052, 0.075]} rotation={[0.1, sd * 0.75, sd * -0.32]}>
          {/* deep socket, then a lit slit eye that glows at dusk */}
          <mesh scale={[1.25, 0.8, 0.5]}>
            <sphereGeometry args={[0.04, 10, 8]} />
            <meshLambertMaterial color="#0c0806" />
          </mesh>
          <mesh position={[0, -0.002, 0.012]} scale={[1.1, 0.62, 0.5]}>
            <sphereGeometry args={[0.034, 12, 10]} />
            <meshLambertMaterial color={coat.eye} emissive={coat.eye} emissiveIntensity={royal ? 2.6 : 1.9} />
          </mesh>
          <mesh position={[0, -0.002, 0.026]} scale={[0.22, 0.6, 0.3]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshLambertMaterial color="#080404" />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((sd) => (
        <mesh key={`n${sd}`} position={[sd * 0.028, 0.02, 0.45]} scale={[0.7, 0.5, 1]}>
          <sphereGeometry args={[0.012, 6, 5]} />
          <meshLambertMaterial color="#0e0a08" />
        </mesh>
      ))}
    </group>
  );
}

/** One arm: knotted shoulder, forearm spurs, three hooked claws. `side` −1 = its left. */
export function LizardArm({ coat, side, pauldron }: { coat: Coat; side: number; pauldron?: boolean }) {
  const geo = cached(`arm${keyOf(coat)}${side}${pauldron ? 1 : 0}`, () => {
    const buf: Buf = { pos: [], col: [] };
    const mirror = side > 0;
    const rings: Ring[] = [
      { p: [0, 0.05, 0.0], rx: 0.05, ry: 0.05 },
      { p: [0, 0.0, 0.0], rx: 0.1, ry: 0.095 },
      { p: [-0.01, -0.13, 0.0], rx: 0.085, ry: 0.08 },
      { p: [-0.015, -0.27, 0.02], rx: 0.058, ry: 0.058 },
      { p: [-0.015, -0.37, 0.07], rx: 0.07, ry: 0.062 },
      { p: [-0.01, -0.49, 0.12], rx: 0.046, ry: 0.042 },
      { p: [-0.01, -0.555, 0.15], rx: 0.06, ry: 0.04 },
      { p: [-0.01, -0.6, 0.17], rx: 0.03, ry: 0.022 },
    ];
    sweep(buf, rings, 8, painter(coat, 11 + side, { limb: true }), { dorsal: 1, capStart: true, capEnd: true, mirrorX: mirror });
    const mx = mirror ? -1 : 1;
    // Elbow and forearm spurs.
    spike(buf, [-0.015 * mx, -0.27, -0.03], [0, 0.2, -1], 0.03, 0.12, BONE_DARK);
    spike(buf, [-0.015 * mx, -0.4, 0.01], [0, 0.1, -1], 0.022, 0.08, BONE_DARK);
    // Claws.
    for (const cx of [-0.035, 0, 0.035]) spike(buf, [(-0.01 + cx) * mx, -0.585, 0.175], [cx * 3 * mx, -0.85, 0.75], 0.016, 0.12, BONE, 4);
    if (pauldron) {
      const iron = new THREE.Color("#4a4c52");
      spike(buf, [-0.03 * mx, 0.04, 0], [-0.9 * mx, 0.8, 0], 0.085, 0.2, iron, 5);
      spike(buf, [-0.02 * mx, 0.06, 0.05], [-0.5 * mx, 1, 0.5], 0.05, 0.14, iron, 5);
      spike(buf, [-0.02 * mx, 0.06, -0.05], [-0.5 * mx, 1, -0.5], 0.05, 0.14, iron, 5);
    }
    return finish(buf);
  });
  return <Skin geo={geo} />;
}

/** One digitigrade leg: heavy thigh, back-swept shank, long clawed foot. */
export function LizardLeg({ coat, side }: { coat: Coat; side: number }) {
  const geo = cached(`leg${keyOf(coat)}${side}`, () => {
    const buf: Buf = { pos: [], col: [] };
    const mirror = side > 0;
    const rings: Ring[] = [
      { p: [0.04, 0.12, -0.04], rx: 0.07, ry: 0.08 },
      { p: [0.04, 0.04, -0.02], rx: 0.15, ry: 0.16 },
      { p: [0.03, -0.14, 0.07], rx: 0.125, ry: 0.13 },
      { p: [0.02, -0.31, 0.16], rx: 0.08, ry: 0.085 },
      { p: [0.02, -0.46, 0.06], rx: 0.062, ry: 0.07 },
      { p: [0.015, -0.62, 0.01], rx: 0.048, ry: 0.052 },
      { p: [0.015, -0.71, 0.06], rx: 0.07, ry: 0.05 },
      { p: [0.015, -0.742, 0.2], rx: 0.085, ry: 0.034 },
      { p: [0.015, -0.752, 0.3], rx: 0.06, ry: 0.022 },
    ];
    sweep(buf, rings, 8, painter(coat, 21 + side, { limb: true }), { dorsal: 1, capStart: true, capEnd: true, mirrorX: mirror });
    const mx = mirror ? -1 : 1;
    for (const cx of [-0.045, 0, 0.045]) spike(buf, [(0.015 + cx) * mx, -0.748, 0.3], [cx * 2.4 * mx, -0.18, 1], 0.02, 0.13, BONE, 4);
    // Heel spur.
    spike(buf, [0.015 * mx, -0.62, -0.03], [0, -0.3, -1], 0.022, 0.09, BONE_DARK);
    return finish(buf);
  });
  return <Skin geo={geo} />;
}

/** Heavy tail with a spined top edge. Lives in the rig's tail group, running down its −Y. */
export function LizardTail({ coat, long }: { coat: Coat; long?: boolean }) {
  const geo = cached(`tail${keyOf(coat)}${long ? 1 : 0}`, () => {
    const buf: Buf = { pos: [], col: [] };
    const h = long ? 1.35 : 1.12;
    const n = 9;
    const rings: Ring[] = Array.from({ length: n }, (_, i) => {
      const u = i / (n - 1);
      const r = 0.15 * Math.pow(1 - u, 1.25) + 0.012;
      return { p: [0, -h * u + 0.06, Math.sin(u * 2.6) * 0.09 * u] as [number, number, number], rx: r * 0.92, ry: r };
    });
    sweep(buf, rings, 8, painter(coat, 31, { plates: true }), { dorsal: 1, capStart: true, capEnd: true });
    for (let i = 1; i < 7; i++) {
      const u = i / (n - 1);
      const r = 0.15 * Math.pow(1 - u, 1.25) + 0.012;
      spike(buf, [0, -h * u + 0.06, Math.sin(u * 2.6) * 0.09 * u - r * 0.9], [0, -0.35, -1], 0.035 * (1 - u * 0.6), 0.16 * (1 - u * 0.6), i % 2 ? BONE_DARK : BONE);
    }
    return finish(buf);
  });
  return <Skin geo={geo} />;
}

/** Raider's kit: a slung belt, a ragged loincloth and a bone charm. */
export function LizardKit({ seed = 0 }: { seed?: number }) {
  const cloth = ["#5a1f1c", "#3c2a22", "#4a3420", "#2e3a2a"][seed % 4]!;
  return (
    <group>
      <mesh position={[0, 0.74, -0.04]} rotation={[0.12, 0, 0.06]} scale={[1, 1, 0.84]}>
        <cylinderGeometry args={[0.232, 0.222, 0.07, 10, 1, true]} />
        {lamb("#2e2018", { kind: "leather", side: THREE.DoubleSide, flat: true, rim: true })}
      </mesh>
      {[1, -1].map((f) => (
        <mesh key={f} position={[0.01 * f, 0.56, f > 0 ? 0.15 : -0.23]} rotation={[f > 0 ? -0.1 : 0.16, 0, 0]}>
          <planeGeometry args={[0.2, 0.34, 1, 3]} />
          {lamb(cloth, { kind: "cloth", side: THREE.DoubleSide, flat: true, rim: true })}
        </mesh>
      ))}
      <mesh position={[0.05, 0.73, 0.16]} rotation={[0.2, 0, 0.3]} scale={[1, 1.2, 0.6]}>
        <octahedronGeometry args={[0.04, 0]} />
        {lamb("#e6dcc0", { flat: true, rim: true })}
      </mesh>
    </group>
  );
}

/** War spear: barbed iron head, bound shaft, a rag of colour under the blade. */
export function LizardSpear() {
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.026, 1.3, 6]} />
        {lamb("#4a3220", { kind: "wood", flat: true, rim: true })}
      </mesh>
      <mesh position={[0, 1.34, 0]} scale={[1, 1, 0.32]} castShadow>
        <coneGeometry args={[0.07, 0.34, 4]} />
        {lamb("#aab2ba", { kind: "metal", flat: true })}
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * 0.055, 1.2, 0]} rotation={[0, 0, sd * 2.5]} scale={[1, 1, 0.3]} castShadow>
          <coneGeometry args={[0.03, 0.13, 4]} />
          {lamb("#8a929a", { kind: "metal", flat: true })}
        </mesh>
      ))}
      <mesh position={[0, 1.13, 0]}>
        <cylinderGeometry args={[0.034, 0.034, 0.09, 6]} />
        {lamb("#2e2018", { kind: "leather", flat: true })}
      </mesh>
      <mesh position={[0.045, 1.02, 0]} rotation={[0, 0, -0.35]}>
        <planeGeometry args={[0.07, 0.24]} />
        {lamb("#8a2420", { kind: "cloth", side: THREE.DoubleSide })}
      </mesh>
    </group>
  );
}
