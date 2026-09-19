import { useMemo } from "react";
import * as THREE from "three";
import {
  heightAt,
  PATH_RUNS,
  pathU,
  pondSurfaceY,
  pondU,
  POND,
  VX,
  VZ,
  vWorld,
} from "./field";
import { FIRE_PIT, FOUNTAIN, PADDOCK } from "./village";
import { VolBush, VolTree } from "./trees";

import { lamb as stdLamb, type MatKind } from "./mats";

function lamb(color: string, extra?: { emissive?: string; emit?: number; kind?: MatKind }) {
  return stdLamb(color, extra);
}

function seeded(n: number) {
  let x = n;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}

/** Camera matching the painted village: pond left, houses right, path in front. */
export const VILLAGE_REF_CAM = {
  x: 10,
  y: 9.8,
  z: VZ - 20,
  lx: -22,
  ly: 2.6,
  lz: VZ + 4,
};

export function VillageGround() {
  const geo = useMemo(() => {
    const w = 300;
    const d = 260;
    const segs = 40;
    const g = new THREE.PlaneGeometry(w, d, segs, segs);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const grass = new THREE.Color("#8aaa48");
    const olive = new THREE.Color("#b4c85a");
    const gold = new THREE.Color("#d4dc78");
    const dirt = new THREE.Color("#c4a06a");
    const mud = new THREE.Color("#a07a48");
    const bank = new THREE.Color("#b8a070");
    const cx = 2;
    const cz = -210;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + cx;
      const z = pos.getZ(i) + cz;
      pos.setX(i, x);
      pos.setZ(i, z);
      const pu = pondU(x, z);
      const pth = pathU(x, z);
      let y = heightAt(x, z);
      if (pu > 0.42) y = pondSurfaceY() - 0.12;
      pos.setY(i, y + 0.04);
      const mix = (Math.sin(x * 0.09) + Math.cos(z * 0.07)) * 0.5 + 0.5;
      const sun = (Math.sin(x * 0.031 + z * 0.02) * 0.5 + 0.5) * 0.45;
      let r = grass.r * (1 - mix) + olive.r * mix;
      let gv = grass.g * (1 - mix) + olive.g * mix;
      let b = grass.b * (1 - mix) + olive.b * mix;
      r = r * (1 - sun) + gold.r * sun;
      gv = gv * (1 - sun) + gold.g * sun;
      b = b * (1 - sun) + gold.b * sun;
      if (pth > 0.08) {
        const t = Math.min(1, pth * 1.15);
        const worn = t * t;
        r = r * (1 - worn) + dirt.r * worn;
        gv = gv * (1 - worn) + dirt.g * worn;
        b = b * (1 - worn) + dirt.b * worn;
        if (t > 0.55) {
          const m = (t - 0.55) / 0.45;
          r = r * (1 - m * 0.25) + mud.r * m * 0.25;
          gv = gv * (1 - m * 0.25) + mud.g * m * 0.25;
        }
      }
      if (pu > 0.08) {
        const wgt = Math.min(1, pu * 1.35);
        r = r * (1 - wgt) + bank.r * wgt;
        gv = gv * (1 - wgt) + 0.32 * wgt;
        b = b * (1 - wgt) + 0.22 * wgt;
      }
      col[i * 3] = r;
      col[i * 3 + 1] = gv;
      col[i * 3 + 2] = b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshLambertMaterial vertexColors polygonOffset polygonOffsetFactor={-1} />
    </mesh>
  );
}

function PathRibbon() {
  const meshes = useMemo(() => {
    const out: THREE.BufferGeometry[] = [];
    for (const run of PATH_RUNS) {
      const pts = run.pts;
      const half = run.half * 0.95;
      let total = 0;
      const lens: number[] = [0];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]!;
        const b = pts[i + 1]!;
        total += Math.hypot(b[0] - a[0], b[1] - a[1]);
        lens.push(total);
      }
      if (total < 0.5) continue;
      const segs = Math.max(8, Math.round(total / 2.2));
      const across = 4;
      const positions: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];
      const at = (u: number) => {
        const d = u * total;
        let i = 0;
        while (i < lens.length - 2 && lens[i + 1]! < d) i++;
        const a = pts[i]!;
        const b = pts[i + 1]!;
        const span = Math.max(0.001, lens[i + 1]! - lens[i]!);
        const t = (d - lens[i]!) / span;
        const x = a[0] + (b[0] - a[0]) * t;
        const z = a[1] + (b[1] - a[1]) * t;
        const tx = b[0] - a[0];
        const tz = b[1] - a[1];
        const len = Math.hypot(tx, tz) || 1;
        return { x, z, tx: tx / len, tz: tz / len };
      };
      for (let i = 0; i <= segs; i++) {
        const s = at(i / segs);
        const nx = -s.tz;
        const nz = s.tx;
        const wobble = 1 + 0.1 * Math.sin(i * 0.55);
        for (let j = 0; j <= across; j++) {
          const v = j / across * 2 - 1;
          const edge = 1 - Math.abs(v) * 0.35;
          const x = s.x + nx * v * half * wobble;
          const z = s.z + nz * v * half * wobble;
          const y = heightAt(x, z) + 0.05 * edge;
          positions.push(x, y, z);
          normals.push(0, 1, 0);
        }
      }
      for (let i = 0; i < segs; i++) {
        for (let j = 0; j < across; j++) {
          const a = i * (across + 1) + j;
          const b = a + 1;
          const c = a + across + 1;
          const d = c + 1;
          indices.push(a, c, b, b, c, d);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
      g.setIndex(indices);
      g.computeVertexNormals();
      out.push(g);
    }
    return out;
  }, []);
  return (
    <group>
      {meshes.map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow>
          <meshLambertMaterial color={i === 0 ? "#d2b07a" : "#c4a068"} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      ))}
    </group>
  );
}

function PathBits() {
  const bits = useMemo(() => {
    const rnd = seeded(91);
    const out: { x: number; z: number; s: number; c: string }[] = [];
    const main = PATH_RUNS[0]!.pts;
    for (let i = 0; i < main.length - 1; i++) {
      const a = main[i]!;
      const b = main[i + 1]!;
      for (let k = 0; k < 3; k++) {
        const t = (k + rnd()) / 3;
        const x = a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * 1.6;
        const z = a[1] + (b[1] - a[1]) * t + (rnd() - 0.5) * 1.6;
        if (pondU(x, z) > 0.2) continue;
        out.push({
          x,
          z,
          s: 0.12 + rnd() * 0.16,
          c: rnd() > 0.5 ? "#6a6458" : "#5a564c",
        });
      }
    }
    return out;
  }, []);
  return (
    <group>
      {bits.map((b, i) => (
        <mesh key={i} position={[b.x, heightAt(b.x, b.z) + 0.06, b.z]} rotation={[0.1, i, 0.08]}>
          <dodecahedronGeometry args={[b.s, 0]} />
          {lamb(b.c)}
        </mesh>
      ))}
    </group>
  );
}

const PINE_SPOTS: { x: number; z: number; s: number; lean: number }[] = [
  { x: POND.x - 8.4, z: POND.z - 10.2, s: 1.55, lean: 0.06 },
  { x: POND.x - 14.2, z: POND.z - 2.4, s: 1.85, lean: -0.04 },
  { x: POND.x - 6.2, z: POND.z + 14.5, s: 1.42, lean: 0.08 },
  { x: POND.x + 16.4, z: POND.z - 8.8, s: 1.28, lean: -0.05 },
  { x: POND.x - 18.5, z: POND.z + 8.2, s: 1.62, lean: 0.03 },
  { x: POND.x - 11.2, z: POND.z + 4.8, s: 2.05, lean: -0.02 },
  { x: POND.x - 20.8, z: POND.z - 6.4, s: 1.72, lean: 0.05 },
  { x: -72, z: -188, s: 1.35, lean: 0.05 },
  { x: -78, z: -210, s: 1.7, lean: -0.06 },
  { x: -68, z: -236, s: 1.48, lean: 0.04 },
  { x: -88, z: -252, s: 1.9, lean: -0.03 },
  { x: -52, z: -268, s: 1.55, lean: 0.07 },
  { x: -28, z: -278, s: 1.38, lean: -0.05 },
  { x: 8, z: -286, s: 1.62, lean: 0.04 },
  { x: 38, z: -274, s: 1.44, lean: -0.06 },
  { x: 62, z: -258, s: 1.72, lean: 0.05 },
  { x: 78, z: -232, s: 1.5, lean: -0.04 },
  { x: 82, z: -198, s: 1.32, lean: 0.06 },
  { x: 70, z: -168, s: 1.22, lean: -0.05 },
  { x: -42, z: -158, s: 1.18, lean: 0.04 },
  { x: -58, z: -148, s: 1.08, lean: -0.03 },
  { x: 48, z: -142, s: 1.14, lean: 0.05 },
  { x: -96, z: -300, s: 2.05, lean: 0.02 },
  { x: -40, z: -330, s: 1.95, lean: -0.04 },
  { x: 20, z: -338, s: 2.15, lean: 0.03 },
  { x: 70, z: -318, s: 1.88, lean: -0.05 },
];

function VillagePines() {
  return (
    <group>
      {PINE_SPOTS.map((t, i) =>
        i < 10 ? (
          <VolTree key={i} x={t.x} z={t.z} s={t.s * 1.35} seed={i * 31} kind="oak" />
        ) : i < 16 ? (
          <VolTree key={i} x={t.x} z={t.z} s={t.s * 1.4} seed={i * 31} kind="pine" />
        ) : (
          <group key={i} position={[t.x, heightAt(t.x, t.z), t.z]} rotation={[0, t.lean * 4, t.lean]}>
            <mesh position={[0, 7.2 * t.s * 0.38, 0]} castShadow>
              <cylinderGeometry args={[0.24 * t.s, 0.42 * t.s, 7.2 * t.s * 0.78, 6]} />
              {lamb("#4a3220")}
            </mesh>
            <mesh position={[0, 7.2 * t.s * 0.52, 0]} castShadow>
              <coneGeometry args={[2.35 * t.s, 2.55 * t.s, 7]} />
              {lamb(i % 2 ? "#5a8a3c" : "#6a9a40", { kind: "leaf" })}
            </mesh>
            <mesh position={[0.08 * t.s, 7.2 * t.s * 0.74, -0.05 * t.s]} castShadow>
              <coneGeometry args={[1.75 * t.s, 2.25 * t.s, 7]} />
              {lamb("#8aaa48", { kind: "leaf" })}
            </mesh>
            <mesh position={[0, 7.2 * t.s * 0.98, 0]} castShadow>
              <coneGeometry args={[1.08 * t.s, 1.8 * t.s, 6]} />
              {lamb("#5a8a3c", { kind: "leaf" })}
            </mesh>
          </group>
        ),
      )}
    </group>
  );
}

function VillageBushes() {
  const spots = useMemo(() => {
    const rnd = seeded(53);
    const list: { x: number; z: number; s: number; n: number; berry: boolean }[] = [];
    const anchors: [number, number][] = [
      [POND.x + 10, POND.z + 8],
      [POND.x - 4, POND.z + 12],
      [POND.x + 12, POND.z - 4],
      [-18, -150],
      [16, -152],
      [-8, -168],
      [22, -176],
      [-36, -186],
      [12, -198],
      [-22, -214],
      [18, -222],
      [-48, -160],
      [40, -170],
      [-14, -240],
      [8, -244],
      [FIRE_PIT.x - 8, FIRE_PIT.z + 6],
      [FOUNTAIN.x + 6, FOUNTAIN.z + 5],
      [PADDOCK.x - 10, PADDOCK.z - 8],
      [-70, -200],
      [54, -190],
    ];
    for (const [ax, az] of anchors) {
      const n = 1 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) {
        const x = ax + (rnd() - 0.5) * 4.2;
        const z = az + (rnd() - 0.5) * 3.6;
        if (pathU(x, z) > 0.45) continue;
        if (pondU(x, z) > 0.28) continue;
        list.push({ x, z, s: 0.55 + rnd() * 0.55, n: 2 + Math.floor(rnd() * 2), berry: rnd() > 0.72 });
      }
    }
    return list;
  }, []);
  return (
    <group>
      {spots.map((b, i) => (
        <VolBush key={i} x={b.x} z={b.z} s={b.s} seed={i * 13} berry={b.berry} />
      ))}
    </group>
  );
}

export function FenceRun({
  ax,
  az,
  bx,
  bz,
  gate,
}: {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  gate?: { t: number; w: number };
}) {
  const posts = useMemo(() => {
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz) || 1;
    const n = Math.max(2, Math.round(len / 1.35));
    const list: { x: number; z: number; skip: boolean }[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = ax + dx * t;
      const z = az + dz * t;
      const inGate = gate ? Math.abs(t - gate.t) * len < gate.w * 0.5 : false;
      list.push({ x, z, skip: inGate });
    }
    return list;
  }, [ax, az, bx, bz, gate]);
  return (
    <group>
      {posts.map((p, i) => {
        if (p.skip) return null;
        const y = heightAt(p.x, p.z);
        const next = posts[i + 1];
        const drawRail = Boolean(next && !next.skip);
        const mx = next ? (p.x + next.x) * 0.5 : p.x;
        const mz = next ? (p.z + next.z) * 0.5 : p.z;
        const my = next ? (y + heightAt(next.x, next.z)) * 0.5 : y;
        const yaw = next ? Math.atan2(next.x - p.x, next.z - p.z) : 0;
        const span = next ? Math.hypot(next.x - p.x, next.z - p.z) + 0.04 : 1.35;
        return (
          <group key={i}>
            <mesh position={[p.x, y + 0.52, p.z]} castShadow>
              <boxGeometry args={[0.14, 1.08, 0.14]} />
              {lamb(i % 2 ? "#6a4a28" : "#5a3c22")}
            </mesh>
            <mesh position={[p.x, y + 0.04, p.z]}>
              <boxGeometry args={[0.2, 0.1, 0.2]} />
              {lamb("#4a3220")}
            </mesh>
            {drawRail ? (
              <>
                <mesh position={[mx, my + 0.74, mz]} rotation={[0, yaw, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.09, span + 0.08]} />
                  {lamb("#7a5430")}
                </mesh>
                <mesh position={[mx, my + 0.4, mz]} rotation={[0, yaw, 0]} castShadow>
                  <boxGeometry args={[0.075, 0.08, span + 0.08]} />
                  {lamb("#5c3e24")}
                </mesh>
              </>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}

function VillageFences() {
  return null;
}

function PondBanks() {
  const bits = useMemo(() => {
    const rnd = seeded(11);
    const rocks: { x: number; z: number; s: number }[] = [];
    const reeds: { x: number; z: number; h: number }[] = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + rnd() * 0.2;
      const wobble = 1 + 0.18 * Math.sin(a * 3.2);
      const r = POND.r * (1.12 + rnd() * 0.18) * wobble;
      const x = POND.x + Math.cos(a) * r;
      const z = POND.z + Math.sin(a) * r * 0.86;
      rocks.push({ x, z, s: 0.18 + rnd() * 0.28 });
      if (i % 2 === 0) reeds.push({ x: x + Math.cos(a) * 0.6, z: z + Math.sin(a) * 0.5, h: 0.7 + rnd() * 0.45 });
    }
    return { rocks, reeds };
  }, []);
  return (
    <group>
      {bits.rocks.map((r, i) => (
        <mesh key={i} position={[r.x, heightAt(r.x, r.z) + r.s * 0.28, r.z]} rotation={[0.1, i, 0.08]} castShadow>
          <dodecahedronGeometry args={[r.s, 0]} />
          {lamb(i % 2 ? "#8a6840" : "#6e4e2c", { kind: "stone" })}
        </mesh>
      ))}
      {bits.reeds.map((r, i) => (
        <mesh key={`d${i}`} position={[r.x, heightAt(r.x, r.z) + r.h * 0.45, r.z]} rotation={[0.08, i, 0.04]}>
          <coneGeometry args={[0.05, r.h, 4]} />
          {lamb(i % 2 ? "#5a8a3c" : "#3d6a32", { kind: "leaf" })}
        </mesh>
      ))}
    </group>
  );
}

function VillageHills() {
  const hills = [
    { x: -78, z: -345, r: 42, h: 16, c: "#7a9a42" },
    { x: 88, z: -360, r: 38, h: 15, c: "#8aaa48" },
    { x: -8, z: -410, r: 52, h: 20, c: "#6a8a38" },
    { x: -108, z: -268, r: 24, h: 9, c: "#8aaa48" },
    { x: 108, z: -248, r: 22, h: 8, c: "#9aba52" },
  ];
  return (
    <group>
      {hills.map((h, i) => {
        const top = heightAt(h.x, h.z);
        return (
          <mesh key={i} position={[h.x, Math.max(h.h * 0.42, top - h.h * 0.35), h.z]} receiveShadow>
            <cylinderGeometry args={[h.r * 0.42, h.r, h.h, 16, 1, false]} />
            {lamb(h.c)}
          </mesh>
        );
      })}
      {[-180, -40, 100, 220].map((x, i) => (
        <mesh key={`m${i}`} position={[x, 42 + (i % 2) * 10, -780]} rotation={[0.02, 0.08 * i, 0]}>
          <coneGeometry args={[90 + i * 10, 70 + i * 8, 7]} />
          <meshLambertMaterial color={i % 2 ? "#9aa8b8" : "#8a9aac"} />
        </mesh>
      ))}
    </group>
  );
}

function Flowers() {
  const spots = useMemo(() => {
    const rnd = seeded(29);
    const list: { x: number; z: number; c: string; k: "bloom" | "clover" | "fern" }[] = [];
    for (let i = 0; i < 72; i++) {
      const t = i / 72;
      const main = PATH_RUNS[0]!.pts;
      const idx = Math.min(main.length - 2, Math.floor(t * (main.length - 1)));
      const a = main[idx]!;
      const side = i % 2 ? 1 : -1;
      const x = a[0] + side * (2.4 + rnd() * 1.8) + (rnd() - 0.5);
      const z = a[1] + (rnd() - 0.5) * 2.4;
      if (pathU(x, z) > 0.5 || pondU(x, z) > 0.2) continue;
      const k = i % 5 === 0 ? "fern" : i % 3 === 0 ? "clover" : "bloom";
      list.push({
        x,
        z,
        k,
        c: k === "clover" ? "#6aaa48" : k === "fern" ? "#3d6a32" : i % 3 === 0 ? "#f4ead2" : i % 3 === 1 ? "#e8d48a" : "#c45c68",
      });
    }
    return list;
  }, []);
  return (
    <group>
      {spots.map((s, i) =>
        s.k === "fern" ? (
          <mesh key={i} position={[s.x, heightAt(s.x, s.z) + 0.22, s.z]} rotation={[0.15, i, 0.08]}>
            <coneGeometry args={[0.12, 0.42, 5]} />
            {lamb(s.c, { kind: "leaf" })}
          </mesh>
        ) : (
          <mesh key={i} position={[s.x, heightAt(s.x, s.z) + (s.k === "clover" ? 0.06 : 0.14), s.z]}>
            <sphereGeometry args={[s.k === "clover" ? 0.08 : 0.07, 5, 4]} />
            {lamb(s.c, { kind: s.k === "clover" ? "leaf" : "flower" })}
          </mesh>
        ),
      )}
    </group>
  );
}

function StoneBridge() {
  const x = 38;
  const z = -196;
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, 0.55, 0]}>
      {[-1.6, 1.6].map((s) => (
        <mesh key={s} position={[s, 0.55, 0]} castShadow>
          <boxGeometry args={[0.7, 1.1, 3.4]} />
          {lamb("#9a9488", { kind: "stone" })}
        </mesh>
      ))}
      <mesh position={[0, 1.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.85, 0.85, 3.4, 10, 1, true, 0, Math.PI]} />
        {lamb("#b8b0a4", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 1.55, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.18, 1.7]} />
        {lamb("#8a8478", { kind: "stone" })}
      </mesh>
      {[-1.55, 1.55].flatMap((sx) =>
        [-0.7, 0.7].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx, 1.85, sz]} castShadow>
            <boxGeometry args={[0.18, 0.42, 0.18]} />
            {lamb("#9a9488", { kind: "stone" })}
          </mesh>
        )),
      )}
    </group>
  );
}

function EastRiver() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(10, 28, 6, 10);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setX(i, 44 + x + Math.sin(z * 0.18) * 1.6);
      pos.setZ(i, -208 + z);
      pos.setY(i, heightAt(44, -208 + z) - 0.35);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      {lamb("#5aa8b0", { kind: "water" })}
    </mesh>
  );
}

export function VillageScenery() {
  return (
    <group>
      <PathRibbon />
      <PondBanks />
      <VillageFences />
    </group>
  );
}
