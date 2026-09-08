import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, pondU, POND, VX, VZ, VR, pathU } from "./field";
import { pushAabb } from "./house";
import { live } from "./live";
import { inVillage } from "./village";
import { HERO_LOOK, N64Person } from "./actors";
import { VolTree } from "./trees";
import { lamb as stdLamb, GroundBlob, type MatKind } from "./mats";

/** Keep collision — visual towers stay inside this AABB. Do not move. */
export const KEEP_COL = { cx: 0, cz: -26, hx: 15.8, hz: 11.4 };
export const JAIL_COL = { cx: 0, cz: -44, hx: 9.2, hz: 8.2 };

const COTTAGES: { cx: number; cz: number; hx: number; hz: number; yaw: number; s: number; brick: boolean }[] = [
  { cx: -38, cz: -118, hx: 3.45, hz: 3.05, yaw: 0.18, s: 1.12, brick: false },
  { cx: -50, cz: -132, hx: 3.2, hz: 2.9, yaw: -0.28, s: 1.0, brick: true },
  { cx: -28, cz: -136, hx: 3.15, hz: 2.8, yaw: 0.48, s: 0.94, brick: false },
  { cx: -54, cz: -108, hx: 3.35, hz: 3.0, yaw: 0.08, s: 1.04, brick: true },
  { cx: -22, cz: -110, hx: 3.05, hz: 2.75, yaw: -0.42, s: 0.9, brick: false },
];

const SPRING = { cx: 6, cz: -122, r: 1.7 };

export function collideKeep(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house || live.doorUse) return null;
  let x = nx;
  let z = nz;
  let hit = false;
  const k = pushAabb(x, z, KEEP_COL.cx, KEEP_COL.cz, KEEP_COL.hx, KEEP_COL.hz, 0.5);
  if (k) {
    x = k.x;
    z = k.z;
    hit = true;
  }
  const j = pushAabb(x, z, JAIL_COL.cx, JAIL_COL.cz, JAIL_COL.hx, JAIL_COL.hz, 0.5);
  if (j) {
    x = j.x;
    z = j.z;
    hit = true;
  }
  for (const c of COTTAGES) {
    const p = pushAabb(x, z, c.cx, c.cz, c.hx, c.hz, 0.42);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  const dx = x - SPRING.cx;
  const dz = z - SPRING.cz;
  const d = Math.hypot(dx, dz);
  if (d < SPRING.r && d > 0.001) {
    const u = SPRING.r / d;
    x = SPRING.cx + dx * u;
    z = SPRING.cz + dz * u;
    hit = true;
  }
  return hit ? { x, z } : null;
}

function lamb(color: string, extra?: { emissive?: string; emit?: number; kind?: MatKind }) {
  return stdLamb(color, extra);
}

function Tower({
  x,
  z,
  h,
  r,
  roof = 3.4,
  warm = false,
}: {
  x: number;
  z: number;
  h: number;
  r: number;
  roof?: number;
  warm?: boolean;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h * 0.5, 0]} castShadow>
        <cylinderGeometry args={[r * 0.9, r * 1.04, h, 12]} />
        {lamb("#c2b094")}
      </mesh>
      <mesh position={[0, h * 0.28, 0]}>
        <cylinderGeometry args={[r * 1.06, r * 1.08, 0.42, 12]} />
        {lamb("#a89880")}
      </mesh>
      <mesh position={[0, h * 0.62, 0]}>
        <cylinderGeometry args={[r * 0.96, r * 0.96, 0.22, 12]} />
        {lamb("#b0a088")}
      </mesh>
      {[0.32, 0.52, 0.72, 0.88].map((u, i) => (
        <mesh key={i} position={[0, h * u, r * 0.82]} castShadow>
          <boxGeometry args={[r * 0.38, 0.38, 0.1]} />
          {lamb("#2a2418", { emissive: warm ? "#e8a050" : "#1a1410", emit: warm ? 0.62 : 0 })}
        </mesh>
      ))}
      {[-0.7, 0.7].map((s, i) => (
        <mesh key={`s${i}`} position={[s * r * 0.55, h * 0.48, r * 0.78]}>
          <boxGeometry args={[0.1, 0.28, 0.08]} />
          {lamb("#2a2418", { emissive: warm ? "#d48840" : "#000", emit: warm ? 0.4 : 0 })}
        </mesh>
      ))}
      <mesh position={[0, h + 0.08, 0]}>
        <cylinderGeometry args={[r * 1.18, r * 1.18, 0.22, 12]} />
        {lamb("#8a4030")}
      </mesh>
      <mesh position={[0, h + roof * 0.42, 0]} castShadow>
        <coneGeometry args={[r * 1.28, roof, 12]} />
        {lamb("#c45c38")}
      </mesh>
      <mesh position={[0, h + roof * 0.86, 0]}>
        <sphereGeometry args={[0.13, 6, 5]} />
        {lamb("#c9a227")}
      </mesh>
    </group>
  );
}

function Merlon({ x, z, y }: { x: number; z: number; y: number }) {
  return (
    <mesh position={[x, y, z]} castShadow>
      <boxGeometry args={[0.52, 0.78, 0.52]} />
      {lamb("#b8a888")}
    </mesh>
  );
}

function Win({ x, y, z, w = 0.62, h = 0.78 }: { x: number; y: number; z: number; w?: number; h?: number }) {
  return (
    <mesh position={[x, y, z]} castShadow>
      <boxGeometry args={[w, h, 0.12]} />
      {lamb("#2a2418", { emissive: "#e8a060", emit: 0.5 })}
    </mesh>
  );
}

/** Storybook castle at keep-hall. Collision AABB is KEEP_COL — do not enlarge. */
export function MeadowKeep() {
  const y = heightAt(0, -26);
  const flags = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    flags.current.forEach((m, i) => {
      if (m) m.rotation.y = Math.sin(t * 1.4 + i) * 0.18;
    });
  });
  return (
    <group position={[0, y, -26]}>
      <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[24.4, 6.4, 16.4]} />
        {lamb("#d8cbb4")}
      </mesh>
      <mesh position={[0, 6.55, 0]} receiveShadow>
        <boxGeometry args={[25.4, 0.42, 17.4]} />
        {lamb("#c4b49a")}
      </mesh>
      <mesh position={[0, 9.4, -1.4]} castShadow>
        <boxGeometry args={[11.6, 8.8, 9.2]} />
        {lamb("#e4d8c4")}
      </mesh>
      <mesh position={[0, 14.0, -1.4]} receiveShadow>
        <boxGeometry args={[12.4, 0.38, 10.0]} />
        {lamb("#c4b49a")}
      </mesh>
      <mesh position={[0, 16.2, -1.4]} rotation={[0.78, 0, 0]} castShadow>
        <boxGeometry args={[12.6, 0.18, 7.4]} />
        {lamb("#c45c38")}
      </mesh>
      <mesh position={[0, 16.2, -1.4]} rotation={[-0.78, 0, 0]} castShadow>
        <boxGeometry args={[12.6, 0.18, 7.4]} />
        {lamb("#b84c30")}
      </mesh>
      {[0.4, 0.9, 1.4, 1.9, 2.4].map((t, i) => (
        <mesh key={`kt${i}`} position={[0, 14.15 + t * 0.95, -1.4]} rotation={[0.78, 0, 0]}>
          <boxGeometry args={[12.4, 0.05, 0.18]} />
          {lamb("#a84428")}
        </mesh>
      ))}
      {[-5.4, -1.8, 1.8, 5.4].flatMap((x) =>
        [-4.4, 1.6].map((z) => <Merlon key={`k${x}${z}`} x={x} z={z} y={14.35} />),
      )}
      {[-11.4, -5.7, 0, 5.7, 11.4].flatMap((x) =>
        [-7.8, 7.8].map((z) => <Merlon key={`${x}:${z}`} x={x} z={z} y={6.92} />),
      )}
      {[-4.2, 0, 4.2].flatMap((z) =>
        [-12.1, 12.1].map((x) => <Merlon key={`s${x}:${z}`} x={x} z={z} y={6.92} />),
      )}
      <mesh position={[0, 3.15, 8.42]} castShadow>
        <boxGeometry args={[4.2, 5.2, 0.5]} />
        {lamb("#5a4030")}
      </mesh>
      <mesh position={[0, 2.45, 8.72]}>
        <boxGeometry args={[1.7, 3.2, 0.18]} />
        {lamb("#3a2818")}
      </mesh>
      <mesh position={[0, 3.85, 8.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 1.25, 6]} />
        {lamb("#c9a227")}
      </mesh>
      <mesh position={[0, 5.2, 8.64]}>
        <boxGeometry args={[1.15, 1.35, 0.12]} />
        {lamb("#2a2018", { emissive: "#e09040", emit: 0.75 })}
      </mesh>
      <mesh position={[0, 3.4, -8.42]} castShadow>
        <boxGeometry args={[5.6, 4.4, 0.4]} />
        {lamb("#c8b8a0")}
      </mesh>
      <mesh position={[0, 2.35, -8.68]}>
        <boxGeometry args={[2.55, 3.1, 0.2]} />
        {lamb("#3a2818")}
      </mesh>
      {[-8.6, -4.3, 0, 4.3, 8.6].map((x) => (
        <Win key={`ss${x}`} x={x} y={3.55} z={-8.32} />
      ))}
      {[-8.4, -2.8, 2.8, 8.4].map((x) => (
        <Win key={`n${x}`} x={x} y={3.35} z={8.32} />
      ))}
      {[-3.6, 0, 3.6].map((x) => (
        <Win key={`u${x}`} x={x} y={10.4} z={-5.9} w={0.7} h={0.9} />
      ))}
      {[-5.2, 5.2].map((z) =>
        [-12.2, 12.2].map((x) =>
          [2.1, 4.0].map((yy) => (
            <mesh key={`w${x}${z}${yy}`} position={[x, yy, z]} castShadow>
              <boxGeometry args={[0.12, 0.82, 0.62]} />
              {lamb("#2a2418", { emissive: "#d48840", emit: 0.48 })}
            </mesh>
          )),
        ),
      )}
      {[-1, 1].map((s, i) => (
        <group key={i} position={[s * 2.4, 5.4, 6.85]}>
          <mesh ref={(el) => { flags.current[i] = el; }}>
            <planeGeometry args={[1.15, 1.55]} />
            <meshLambertMaterial color={i ? "#3a5a88" : "#c45c38"} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      <Tower x={-12.4} z={6.15} h={13.2} r={2.12} roof={4.2} warm />
      <Tower x={12.4} z={6.15} h={13.2} r={2.12} roof={4.2} warm />
      <Tower x={-13.15} z={-6.35} h={18.4} r={2.52} roof={6.0} warm />
      <Tower x={13.15} z={-6.35} h={18.4} r={2.52} roof={6.0} warm />
      <Tower x={0} z={-7.15} h={24.6} r={2.82} roof={7.4} warm />
      <Tower x={-6.2} z={-1.15} h={16.2} r={1.82} roof={4.8} warm />
      <Tower x={6.2} z={-1.15} h={14.8} r={1.7} roof={4.4} warm />
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[0, 0.2 + i * 0.16, 7.55 + i * 0.48]} receiveShadow>
          <boxGeometry args={[4.6 - i * 0.28, 0.2, 1.1]} />
          {lamb("#b8a888")}
        </mesh>
      ))}
      <pointLight position={[0, 6.2, 7.0]} color="#e8a050" intensity={4.2} distance={16} />
      <pointLight position={[-8.4, 11.2, 5.4]} color="#e09040" intensity={3.2} distance={10} />
      <pointLight position={[8.4, 11.2, 5.4]} color="#e09040" intensity={3.2} distance={10} />
    </group>
  );
}

export function MeadowJail() {
  const y = heightAt(0, -44);
  return (
    <group position={[0, y, -44]}>
      <mesh position={[0, 2.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[14.2, 4.7, 12.0]} />
        {lamb("#d4c8b4")}
      </mesh>
      <mesh position={[0, 4.82, 0]}>
        <boxGeometry args={[14.9, 0.32, 12.6]} />
        {lamb("#c4b49a")}
      </mesh>
      {[-6.2, 0, 6.2].flatMap((x) =>
        [-5.6, 5.6].map((z) => <Merlon key={`j${x}${z}`} x={x} z={z} y={5.12} />),
      )}
      <Tower x={-6.2} z={-5.0} h={9.2} r={1.48} roof={3.0} warm />
      <Tower x={6.2} z={-5.0} h={9.2} r={1.48} roof={3.0} warm />
      <Tower x={-6.0} z={5.0} h={7.6} r={1.32} roof={2.6} warm />
      <Tower x={6.0} z={5.0} h={7.6} r={1.32} roof={2.6} warm />
      <mesh position={[0, 2.35, 6.15]} castShadow>
        <boxGeometry args={[4.6, 3.9, 0.32]} />
        {lamb("#c0b094")}
      </mesh>
      <mesh position={[0, 1.7, 6.34]}>
        <boxGeometry args={[2.25, 2.7, 0.16]} />
        {lamb("#2a2018")}
      </mesh>
      <mesh position={[0, 3.05, 6.36]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.12, 1.12, 0.14, 10, 1, true, 0, Math.PI]} />
        {lamb("#2a2018")}
      </mesh>
      {[-3.4, 3.4].map((x) => (
        <Win key={x} x={x} y={2.7} z={6.08} w={0.55} h={0.7} />
      ))}
      {[-4.8, -1.6, 1.6, 4.8].map((x) => (
        <Win key={`b${x}`} x={x} y={2.55} z={-6.08} />
      ))}
    </group>
  );
}

const RIVER: [number, number][] = [
  [48, 22],
  [52, -8],
  [50, -36],
  [46, -64],
  [42, -92],
  [40, -118],
  [46, -144],
  [50, -168],
  [44, -190],
  [32, -210],
  [8, -224],
  [-22, -232],
];

const STREAM: [number, number][] = [
  [44, 16],
  [48, -12],
  [46, -40],
  [42, -70],
  [38, -98],
  [36, -124],
  [42, -152],
  [38, -182],
  [28, -208],
];

function RiverPath({ pts, w }: { pts: [number, number][]; w: number }) {
  const segs = useMemo(() => {
    const out: { x: number; z: number; yaw: number; len: number; y: number }[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const x = (a[0] + b[0]) * 0.5;
      const z = (a[1] + b[1]) * 0.5;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len = Math.hypot(dx, dz);
      out.push({ x, z, yaw: Math.atan2(dx, dz), len, y: Math.min(heightAt(x, z), heightAt(a[0], a[1]), heightAt(b[0], b[1])) - 0.22 });
    }
    return out;
  }, [pts]);
  return (
    <group>
      {segs.map((s, i) => (
        <group key={i} position={[s.x, s.y, s.z]} rotation={[0, s.yaw, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[w, s.len + 1.1]} />
            <meshLambertMaterial color="#3a7a88" transparent opacity={0.84} />
          </mesh>
          <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w * 0.58, s.len + 0.3]} />
            <meshLambertMaterial color="#8ec8d0" transparent opacity={0.38} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function MeadowRiver() {
  const glow = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (glow.current) glow.current.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.04;
  });
  return (
    <group ref={glow}>
      <RiverPath pts={RIVER} w={7.2} />
      <RiverPath pts={STREAM} w={4.2} />
      <mesh position={[38, heightAt(38, -118) + 0.22, -118]} rotation={[0, 0.4, 0]} receiveShadow>
        <boxGeometry args={[4.6, 0.18, 1.35]} />
        {lamb("#6a4a28")}
      </mesh>
      <mesh position={[38, heightAt(38, -118) + 0.08, -118.55]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.22, 0.55, 1.15]} />
        {lamb("#5a3a20")}
      </mesh>
      <mesh position={[38, heightAt(38, -118) + 0.08, -117.45]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.22, 0.55, 1.15]} />
        {lamb("#5a3a20")}
      </mesh>
    </group>
  );
}

function Hill({ x, z, r, h, color }: { x: number; z: number; r: number; h: number; color: string }) {
  return (
    <mesh position={[x, heightAt(x, z) + h * 0.16, z]} scale={[1, h / r, 1]}>
      <sphereGeometry args={[r, 7, 5]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

export function DistantMountains() {
  const rows = useMemo(() => {
    const list: { x: number; z: number; r: number; h: number; c: string }[] = [];
    const cols = ["#7a6a88", "#6a7a90", "#5a6a80", "#8a7a94", "#4a5a70"];
    for (let i = 0; i < 6; i++) {
      list.push({
        x: -180 + i * 64,
        z: 110 + (i % 3) * 28,
        r: 48 + (i % 5) * 12,
        h: 62 + (i % 3) * 14,
        c: cols[i % cols.length]!,
      });
    }
    for (let i = 0; i < 3; i++) {
      list.push({
        x: -140 + i * 52,
        z: 185 + (i % 3) * 18,
        r: 58 + (i % 4) * 12,
        h: 72,
        c: cols[(i + 2) % cols.length]!,
      });
    }
    for (let i = 0; i < 5; i++) {
      list.push({
        x: 230 + (i % 3) * 36,
        z: -30 + i * 26,
        r: 36 + (i % 3) * 8,
        h: 46,
        c: cols[(i + 1) % cols.length]!,
      });
    }
    for (let i = 0; i < 5; i++) {
      list.push({
        x: -250 + (i % 3) * 28,
        z: -10 + i * 24,
        r: 34 + (i % 3) * 8,
        h: 42,
        c: cols[(i + 3) % cols.length]!,
      });
    }
    return list;
  }, []);
  return (
    <group>
      {rows.map((h, i) => (
        <Hill key={i} x={h.x} z={h.z} r={h.r} h={h.h} color={h.c} />
      ))}
      {rows.slice(0, 12).map((h, i) => (
        <mesh key={`p${i}`} position={[h.x, heightAt(h.x, h.z) + h.h * 0.55, h.z]}>
          <coneGeometry args={[h.r * 0.42, h.h * 0.55, 7]} />
          <meshLambertMaterial color="#e4ddd4" />
        </mesh>
      ))}
    </group>
  );
}

function Sheep({ x, z, seed }: { x: number; z: number; seed: number }) {
  const g = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime * 0.22 + seed;
    const graze = Math.sin(t * 1.5);
    const walk = seed % 3 !== 0;
    const gx = walk ? x + Math.sin(t) * 1.4 : x;
    const gz = walk ? z + Math.cos(t * 0.7) * 1.05 : z;
    g.current.position.set(gx, heightAt(gx, gz), gz);
    if (walk) g.current.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t * 0.7));
    if (head.current) head.current.rotation.x = graze * 0.38 - 0.28;
  });
  const wool = "#f6f0e6";
  const wool2 = "#efe4d2";
  return (
    <group ref={g} position={[x, heightAt(x, z), z]} scale={1.55}>
      <GroundBlob radius={0.55} opacity={0.28} />
      <mesh position={[0, 0.52, 0]} castShadow scale={[1.15, 0.92, 1.48]}>
        <sphereGeometry args={[0.46, 12, 10]} />
        {lamb(wool, { kind: "wool" })}
      </mesh>
      {[
        [0.28, 0.64, 0.22],
        [-0.26, 0.7, 0.08],
        [0.12, 0.76, -0.26],
        [-0.2, 0.58, -0.34],
        [0.32, 0.54, -0.14],
        [0.02, 0.82, 0.04],
        [-0.32, 0.5, 0.18],
        [0.18, 0.48, 0.38],
        [-0.08, 0.72, 0.32],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} scale={[1, 0.88, 1]} castShadow>
          <sphereGeometry args={[0.18 + (i % 3) * 0.04, 8, 7]} />
          {lamb(i % 2 ? wool2 : wool, { kind: "wool" })}
        </mesh>
      ))}
      <group ref={head} position={[0, 0.58, 0.62]}>
        <mesh castShadow>
          <sphereGeometry args={[0.18, 9, 8]} />
          {lamb("#d4c09a")}
        </mesh>
        <mesh position={[0, -0.03, 0.14]} scale={[0.72, 0.55, 0.9]}>
          <sphereGeometry args={[0.12, 7, 6]} />
          {lamb("#c4a888")}
        </mesh>
        {[-0.11, 0.11].map((s) => (
          <mesh key={s} position={[s, 0.06, 0.14]}>
            <sphereGeometry args={[0.032, 6, 5]} />
            {lamb("#1a1410")}
          </mesh>
        ))}
        {[-0.14, 0.14].map((s) => (
          <mesh key={`e${s}`} position={[s, 0.14, -0.02]} rotation={[0.2, 0, s > 0 ? -0.7 : 0.7]} castShadow>
            <sphereGeometry args={[0.07, 6, 5]} />
            {lamb(wool, { kind: "wool" })}
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0.46, -0.62]} rotation={[0.45, 0, 0]}>
        <sphereGeometry args={[0.08, 5, 4]} />
        {lamb(wool2, { kind: "wool" })}
      </mesh>
      {[
        [-0.2, 0.22],
        [0.2, 0.22],
        [-0.2, -0.26],
        [0.2, -0.26],
      ].map(([lx, lz], i) => (
        <group key={i} position={[lx, 0, lz]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 0.36, 6]} />
            {lamb("#4a3a28")}
          </mesh>
          <mesh position={[0, 0.02, 0.03]}>
            <boxGeometry args={[0.08, 0.045, 0.12]} />
            {lamb("#3a2818")}
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function MeadowSheep() {
  const flock = useMemo(() => {
    const list: { x: number; z: number; s: number }[] = [
      { x: 14, z: -126, s: 1 },
      { x: 20, z: -118, s: 2 },
      { x: 10, z: -132, s: 3 },
      { x: 24, z: -112, s: 4 },
      { x: 8, z: -116, s: 5 },
      { x: 18, z: -136, s: 6 },
      { x: 4, z: -128, s: 8 },
      { x: 22, z: -130, s: 12 },
    ];
    return list.filter((s) => {
      if (pondU(s.x, s.z) > 0.18) return false;
      if (Math.hypot(s.x, s.z + 26) < 22) return false;
      if (Math.hypot(s.x, s.z + 44) < 12) return false;
      if (Math.hypot(s.x - SPRING.cx, s.z - SPRING.cz) < 4) return false;
      return true;
    });
  }, []);
  return (
    <group>
      {flock.map((s) => (
        <Sheep key={s.s} x={s.x} z={s.z} seed={s.s * 1.7} />
      ))}
    </group>
  );
}

function seeded(n: number) {
  let x = n;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}

export function MeadowGrass() {
  const geo = useMemo(() => {
    const blade = new THREE.ConeGeometry(0.045, 0.3, 3);
    const pos: number[] = [];
    const nrm: number[] = [];
    const src = blade.attributes.position;
    const sn = blade.attributes.normal;
    const offsets: [number, number, number, number][] = [
      [0, 0, 0, 0],
      [0.04, 0, 0.02, 0.5],
      [-0.035, 0, 0.025, -0.45],
      [0.012, 0, -0.038, 0.9],
    ];
    for (const [ox, oy, oz, rot] of offsets) {
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      for (let i = 0; i < src.count; i++) {
        const x = src.getX(i);
        const y = src.getY(i);
        const z = src.getZ(i);
        pos.push(x * c - z * s + ox, y + oy + 0.15, x * s + z * c + oz);
        const nx = sn.getX(i);
        const ny = sn.getY(i);
        const nz = sn.getZ(i);
        nrm.push(nx * c - nz * s, ny, nx * s + nz * c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
    return g;
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8aaa48", roughness: 0.78, metalness: 0, emissive: "#4a6a20", emissiveIntensity: 0.08 }), []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const n = 70;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const ready = useRef(false);
  useFrame(() => {
    if (!mesh.current || ready.current) return;
    const rnd = seeded(19);
    let i = 0;
    let tries = 0;
    while (i < n && tries < n * 12) {
      tries++;
      const a = rnd() * Math.PI * 2;
      const rad = 6 + rnd() * 200;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad - 80;
      if (inVillage(x, z) && rnd() > 0.4) continue;
      if (pondU(x, z) > 0.12) continue;
      if (Math.hypot(x, z + 26) < 16) continue;
      dummy.position.set(x, heightAt(x, z) + 0.15, z);
      dummy.rotation.set(rnd() * 0.2 - 0.1, rnd() * 6, rnd() * 0.15);
      dummy.scale.setScalar(0.65 + rnd() * 1.05);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
      i++;
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    ready.current = true;
  });
  return <instancedMesh ref={mesh} args={[geo, mat, n]} castShadow={false} receiveShadow />;
}

export function MeadowTufts() {
  const geo = useMemo(() => new THREE.ConeGeometry(0.12, 0.55, 4), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7a9a42", roughness: 0.82, metalness: 0 }), []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const n = 28;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const ready = useRef(false);
  useFrame(() => {
    if (!mesh.current || ready.current) return;
    const rnd = seeded(71);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const rad = 8 + rnd() * 150;
      const x = Math.cos(a) * rad + (rnd() - 0.5) * 6;
      const z = Math.sin(a) * rad - 85;
      dummy.position.set(x, heightAt(x, z) + 0.22, z);
      dummy.rotation.set(0.05, rnd() * 6, (rnd() - 0.5) * 0.2);
      dummy.scale.setScalar(0.8 + rnd() * 0.7);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    ready.current = true;
  });
  return <instancedMesh ref={mesh} args={[geo, mat, n]} />;
}

export function MeadowFlowers() {
  const geo = useMemo(() => new THREE.SphereGeometry(0.065, 5, 4), []);
  const n = 36;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const ready = useRef(false);
  useFrame(() => {
    if (!mesh.current || ready.current) return;
    const rnd = seeded(41);
    const cols = ["#e8d48a", "#c45c68", "#f4ead2", "#6a8ac0", "#d47848"];
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const rad = 8 + rnd() * 155;
      const x = Math.cos(a) * rad + (rnd() - 0.5) * 8;
      const z = Math.sin(a) * rad - 80;
      dummy.position.set(x, heightAt(x, z) + 0.2, z);
      dummy.scale.setScalar(0.65 + rnd() * 0.85);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
      color.set(cols[i % cols.length]!);
      mesh.current.setColorAt(i, color);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    ready.current = true;
  });
  return <instancedMesh ref={mesh} args={[geo, undefined, n]} />;
}

export function MeadowStones() {
  const spots = useMemo(() => {
    const rnd = seeded(7);
    const list: { x: number; z: number; s: number }[] = [];
    for (let i = 0; i < 32; i++) {
      const a = rnd() * Math.PI * 2;
      const rad = 10 + rnd() * 165;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad - 50;
      if (pondU(x, z) > 0.15) continue;
      if (Math.hypot(x, z + 26) < 18) continue;
      list.push({ x, z, s: 0.16 + rnd() * 0.42 });
    }
    return list;
  }, []);
  return (
    <group>
      {spots.map((s, i) => (
        <mesh key={i} position={[s.x, heightAt(s.x, s.z) + s.s * 0.35, s.z]} rotation={[0.1, i, 0.08]} castShadow>
          <dodecahedronGeometry args={[s.s, 0]} />
          {lamb(i % 3 ? "#8a8478" : "#6a665c")}
        </mesh>
      ))}
    </group>
  );
}

export function MeadowPaths() {
  const paths: { from: [number, number]; to: [number, number]; n: number }[] = [
    { from: [-28, -118], to: [0, -38], n: 28 },
    { from: [6, -122], to: [0, -38], n: 20 },
    { from: [-38, -118], to: [6, -122], n: 14 },
    { from: [6, -122], to: [26, -90], n: 12 },
    { from: [14, -58], to: [22.6, 9.4], n: 16 },
  ];
  return (
    <group>
      {paths.map((p, i) => {
        const bits = [];
        for (let k = 0; k < p.n; k++) {
          const u = k / (p.n - 1);
          const x = p.from[0] + (p.to[0] - p.from[0]) * u;
          const z = p.from[1] + (p.to[1] - p.from[1]) * u;
          bits.push(
            <mesh key={k} position={[x, heightAt(x, z) + 0.035, z]} rotation={[-Math.PI / 2, 0, u]} receiveShadow>
              <circleGeometry args={[0.58 + (k % 3) * 0.09, 8]} />
              <meshLambertMaterial color="#c4b080" />
            </mesh>,
          );
        }
        return <group key={i}>{bits}</group>;
      })}
    </group>
  );
}

export function MeadowFences() {
  const runs: { x: number; z: number; yaw: number; n: number }[] = [
    { x: -56, z: -112, yaw: 0.08, n: 9 },
    { x: -44, z: -124, yaw: 0.18, n: 8 },
    { x: -32, z: -128, yaw: 1.15, n: 6 },
    { x: -16, z: -72, yaw: -0.35, n: 6 },
    { x: 8, z: -108, yaw: 0.4, n: 6 },
    { x: 22, z: -92, yaw: 1.35, n: 5 },
  ];
  return (
    <group>
      {runs.map((r, ri) => (
        <group key={ri} position={[r.x, 0, r.z]} rotation={[0, r.yaw, 0]}>
          {Array.from({ length: r.n }, (_, i) => {
            const x = i * 1.35;
            const y = heightAt(r.x + Math.sin(r.yaw) * x, r.z + Math.cos(r.yaw) * x);
            return (
              <group key={i} position={[x, y, 0]}>
                <mesh position={[0, 0.55, 0]} castShadow>
                  <cylinderGeometry args={[0.06, 0.07, 1.1, 5]} />
                  {lamb("#6a4a28")}
                </mesh>
                {i < r.n - 1 ? (
                  <>
                    <mesh position={[0.67, 0.72, 0]} rotation={[0, 0, Math.PI / 2]}>
                      <cylinderGeometry args={[0.035, 0.035, 1.35, 4]} />
                      {lamb("#5a3a20")}
                    </mesh>
                    <mesh position={[0.67, 0.38, 0]} rotation={[0, 0, Math.PI / 2]}>
                      <cylinderGeometry args={[0.035, 0.035, 1.35, 4]} />
                      {lamb("#5a3a20")}
                    </mesh>
                  </>
                ) : null}
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}

export function BroadTrees() {
  const spots = useMemo(() => {
    const rnd = seeded(23);
    const list: { x: number; z: number; s: number }[] = [
      { x: -24, z: -152, s: 1.85 },
      { x: -18, z: -146, s: 1.35 },
      { x: -42, z: -148, s: 1.48 },
      { x: -16, z: -70, s: 1.28 },
      { x: -8, z: -118, s: 1.18 },
      { x: 22, z: -64, s: 1.22 },
      { x: 12, z: -122, s: 1.2 },
      { x: -8, z: -132, s: 1.1 },
      { x: -22, z: 6, s: 1.24 },
      { x: 8, z: -8, s: 1.12 },
    ];
    for (let i = 0; i < 4; i++) {
      const a = rnd() * Math.PI * 2;
      const rad = 28 + rnd() * 150;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad - 50;
      if (inVillage(x, z) && rnd() > 0.5) continue;
      if (Math.hypot(x - VX, z - VZ) < 40) continue;
      if (Math.hypot(x, z + 26) < 22) continue;
      if (pondU(x, z) > 0.08) continue;
      list.push({ x, z, s: 0.85 + rnd() * 0.55 });
    }
    return list;
  }, []);
  return (
    <group>
      {spots.map((t, i) => (
        <VolTree
          key={i}
          x={t.x}
          z={t.z}
          s={t.s}
          seed={i * 17}
          kind={i % 7 === 0 ? "elm" : "oak"}
        />
      ))}
    </group>
  );
}

function Cottage({
  x,
  z,
  yaw,
  s,
  brick,
}: {
  x: number;
  z: number;
  yaw: number;
  s: number;
  brick: boolean;
}) {
  const y = heightAt(x, z);
  const wall = brick ? "#d8d0c4" : "#f4ead8";
  const beam = "#4a3220";
  const pitch = 0.86;
  const rise = 3.15;
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]} scale={s}>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.7, 0.58, 4.9]} />
        {lamb("#9a9488", { kind: "stone" })}
      </mesh>
      {/* rounded corner posts */}
      {[[-2.58, -2.18], [2.58, -2.18], [-2.58, 2.18], [2.58, 2.18]].map(([cx, cz], i) => (
        <mesh key={`cr${i}`} position={[cx, 1.85, cz]} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 2.55, 8]} />
          {lamb("#5a3a22", { kind: "wood" })}
        </mesh>
      ))}
      <mesh position={[0, 1.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.35, 2.55, 4.55]} />
        {lamb(wall, { kind: "plaster" })}
      </mesh>
      <mesh position={[1.85, 1.55, 2.0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 2.05, 2.45]} />
        {lamb(wall)}
      </mesh>
      {[-2.62, 0, 2.62].map((sx) => (
        <mesh key={`c${sx}`} position={[sx, 1.85, 2.32]} castShadow>
          <boxGeometry args={[0.18, 2.55, 0.18]} />
          {lamb(beam)}
        </mesh>
      ))}
      <mesh position={[0, 2.35, 2.34]}>
        <boxGeometry args={[5.35, 0.14, 0.14]} />
        {lamb(beam)}
      </mesh>
      <mesh position={[0, 1.35, 2.34]}>
        <boxGeometry args={[5.35, 0.12, 0.12]} />
        {lamb(beam)}
      </mesh>
      <mesh position={[0, 1.85, 0]}>
        <boxGeometry args={[0.14, 2.55, 4.55]} />
        {lamb(beam)}
      </mesh>
      <mesh position={[0, 3.35 + rise * 0.42, 1.15]} rotation={[pitch, 0, 0]} castShadow>
        <boxGeometry args={[6.15, 0.18, 3.55]} />
        {lamb("#b85a38", { kind: "shingle" })}
      </mesh>
      <mesh position={[0, 3.35 + rise * 0.42, -1.15]} rotation={[-pitch, 0, 0]} castShadow>
        <boxGeometry args={[6.15, 0.18, 3.55]} />
        {lamb("#a84c30", { kind: "shingle" })}
      </mesh>
      {[0.35, 0.75, 1.15, 1.55, 1.95, 2.35].map((t, i) => (
        <mesh key={`t${i}`} position={[0, 3.42 + t * 0.72, 1.15 - t * 0.38]} rotation={[pitch, 0, 0]}>
          <boxGeometry args={[6.05, 0.055, 0.18]} />
          {lamb(i % 2 ? "#8a3c28" : "#c46840", { kind: "shingle" })}
        </mesh>
      ))}
      <mesh position={[0, 3.35 + rise, 0]} castShadow>
        <boxGeometry args={[6.05, 0.14, 0.22]} />
        {lamb("#8a4030", { kind: "shingle" })}
      </mesh>
      <mesh position={[-2.72, 4.15, 0]} castShadow>
        <boxGeometry args={[0.1, 2.4, 4.7]} />
        {lamb(wall)}
      </mesh>
      <mesh position={[2.72, 4.15, 0]} castShadow>
        <boxGeometry args={[0.1, 2.4, 4.7]} />
        {lamb(wall)}
      </mesh>
      <mesh position={[1.85, 5.55, -0.55]} castShadow>
        <boxGeometry args={[0.62, 1.7, 0.62]} />
        {lamb("#8a8478")}
      </mesh>
      <mesh position={[1.85, 6.48, -0.55]}>
        <boxGeometry args={[0.78, 0.16, 0.78]} />
        {lamb("#6a665c")}
      </mesh>
      <mesh position={[1.85, 6.7, -0.55]}>
        <boxGeometry args={[0.2, 0.28, 0.2]} />
        {lamb("#4a4840")}
      </mesh>
      <mesh position={[0, 1.15, 2.38]} castShadow>
        <boxGeometry args={[1.12, 1.55, 0.14]} />
        {lamb("#5a3a22", { kind: "wood" })}
      </mesh>
      <mesh position={[0, 1.95, 2.38]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.56, 0.56, 0.14, 10]} />
        {lamb("#5a3a22", { kind: "wood" })}
      </mesh>
      <mesh position={[0.38, 1.15, 2.48]}>
        <sphereGeometry args={[0.055, 6, 5]} />
        {lamb("#c9a227", { kind: "metal" })}
      </mesh>
      {[-1.55, 1.55].map((sx) => (
        <group key={sx} position={[sx, 2.15, 2.34]}>
          <mesh>
            <boxGeometry args={[0.72, 0.82, 0.08]} />
            {lamb("#2a2418", { emissive: "#e8a050", emit: 0.62 })}
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.82, 0.08, 0.08]} />
            {lamb(beam)}
          </mesh>
          {[-0.42, 0.42].map((sh) => (
            <mesh key={sh} position={[sh, 0, 0.05]} castShadow>
              <boxGeometry args={[0.12, 0.78, 0.06]} />
              {lamb("#6a3a18")}
            </mesh>
          ))}
          <mesh position={[0, -0.55, 0.16]} castShadow>
            <boxGeometry args={[0.88, 0.14, 0.26]} />
            {lamb("#5a3a20")}
          </mesh>
          {[-0.2, 0.2].map((fx, i) => (
            <mesh key={fx} position={[fx, -0.4, 0.22]}>
              <sphereGeometry args={[0.07, 5, 4]} />
              {lamb(i ? "#e8d48a" : "#c45c68")}
            </mesh>
          ))}
        </group>
      ))}
      {[-2.55, 2.55].map((sx) =>
        [0.55, 1.05, 1.55, 2.05].map((sy, i) => (
          <mesh key={`v${sx}${i}`} position={[sx, sy, 2.05 + (i % 2) * 0.12]}>
            <sphereGeometry args={[0.16, 6, 5]} />
            {lamb(i % 2 ? "#5a8a3c" : "#3d6a32", { kind: "leaf" })}
          </mesh>
        )),
      )}
      {[-2.6, 2.6, -1.3, 1.4].map((fx, i) => (
        <group key={`fn${i}`} position={[fx, 0, 2.85]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.05, 0.9, 4]} />
            {lamb("#6a4a28")}
          </mesh>
          {i < 3 ? (
            <mesh position={[0.65, 0.58, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 1.3, 4]} />
              {lamb("#5a3a20")}
            </mesh>
          ) : null}
        </group>
      ))}
      <pointLight position={[0, 2.15, 1.5]} color="#e8a050" intensity={2.8} distance={8} />
    </group>
  );
}

export function MeadowCottages() {
  return (
    <group>
      {COTTAGES.map((c, i) => (
        <Cottage key={i} x={c.cx} z={c.cz} yaw={c.yaw} s={c.s} brick={c.brick} />
      ))}
    </group>
  );
}

export function MeadowFountain() {
  const spray = useRef<THREE.Mesh>(null);
  const y = heightAt(SPRING.cx, SPRING.cz);
  useFrame(({ clock }) => {
    if (!spray.current) return;
    const t = clock.elapsedTime;
    spray.current.scale.setScalar(0.95 + Math.sin(t * 3.4) * 0.16);
    spray.current.position.y = 1.85 + Math.sin(t * 4.2) * 0.08;
  });
  return (
    <group position={[SPRING.cx, y, SPRING.cz]}>
      <mesh position={[0, 0.16, 0]} receiveShadow>
        <cylinderGeometry args={[2.15, 2.35, 0.38, 20]} />
        {lamb("#9a9488")}
      </mesh>
      <mesh position={[0, 0.4, 0]} receiveShadow>
        <cylinderGeometry args={[1.62, 1.7, 0.22, 18]} />
        {lamb("#8a8680")}
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 1.52, 22]} />
        <meshLambertMaterial color="#4a90a0" transparent opacity={0.62} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.92, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 0.95, 12]} />
        {lamb("#8a8478")}
      </mesh>
      <mesh position={[0, 1.38, 0]}>
        <cylinderGeometry args={[0.72, 0.78, 0.18, 14]} />
        {lamb("#9a9488")}
      </mesh>
      <mesh position={[0, 1.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.62, 14]} />
        <meshLambertMaterial color="#6ab0b8" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.62, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.42, 8]} />
        {lamb("#8a8478")}
      </mesh>
      <mesh ref={spray} position={[0, 1.85, 0]}>
        <coneGeometry args={[0.2, 0.62, 8]} />
        <meshLambertMaterial color="#8ec8d8" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.72, 0.38, Math.sin(a) * 1.72]}>
            <sphereGeometry args={[0.1, 6, 5]} />
            {lamb("#b0aaa0")}
          </mesh>
        );
      })}
    </group>
  );
}

function HillSkirt({
  cx,
  cz,
  rTop,
  rBot,
  h,
  color = "#4a8c32",
}: {
  cx: number;
  cz: number;
  rTop: number;
  rBot: number;
  h: number;
  color?: string;
}) {
  const top = heightAt(cx, cz);
  return (
    <mesh position={[cx, Math.max(h * 0.5, top - h * 0.5), cz]}>
      <cylinderGeometry args={[rTop, rBot, h, 8, 1, false]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

export function MeadowGround() {
  const geo = useMemo(() => {
    const size = 480;
    const segs = 28;
    const g = new THREE.PlaneGeometry(size, size, segs, segs);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const lo = new THREE.Color("#6a8a38");
    const mid = new THREE.Color("#9ab84a");
    const hi = new THREE.Color("#d4dc78");
    const dirt = new THREE.Color("#c4a06a");
    const bank = new THREE.Color("#a8c060");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i) - 80;
      pos.setZ(i, z);
      const y = heightAt(x, z);
      pos.setY(i, y + 0.05);
      const pu = pondU(x, z);
      const hillT = Math.max(0, Math.min(1, (y - 3) / 20));
      const valley = y < -1 ? Math.min(1, (-1 - y) / 8) : 0;
      let r = mid.r * (1 - hillT) + hi.r * hillT;
      let gv = mid.g * (1 - hillT) + hi.g * hillT;
      let b = mid.b * (1 - hillT) + hi.b * hillT;
      r = r * (1 - valley) + lo.r * valley;
      gv = gv * (1 - valley) + lo.g * valley;
      b = b * (1 - valley) + bank.b * valley;
      const mix = (Math.sin(x * 0.07) + Math.cos(z * 0.05)) * 0.5 + 0.5;
      r = r * (0.9 + mix * 0.1);
      gv = gv * (0.92 + mix * 0.08);
      const village = Math.hypot(x - VX, z - VZ) < VR;
      if (village) {
        r = r * 0.55 + 0.62 * 0.45;
        gv = gv * 0.55 + 0.74 * 0.45;
        b = b * 0.55 + 0.32 * 0.45;
      }
      const keepPath = Math.min(
        Math.hypot(x + 8, z + 108),
        Math.hypot(x - 6, z + 88),
        Math.abs(x) * 0.35 + Math.abs(z + 70) * 0.12,
      );
      const pth = pathU(x, z);
      const puw = pu > 0.08 ? Math.min(1, pu * 1.4) : 0;
      const dw = Math.max(pth, keepPath < 3.2 ? ((3.2 - keepPath) / 3.2) * 0.5 : 0);
      if (pu > 0.42) pos.setY(i, 0.48);
      col[i * 3] = r * (1 - puw - dw * 0.85) + 0.16 * puw + dirt.r * dw * 0.85;
      col[i * 3 + 1] = gv * (1 - puw - dw * 0.85) + 0.36 * puw + dirt.g * dw * 0.85;
      col[i * 3 + 2] = b * (1 - puw - dw * 0.85) + 0.26 * puw + dirt.b * dw * 0.85;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.9} metalness={0} envMapIntensity={0.1} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  );
}

function MeadowHills() {
  return (
    <group>
      <HillSkirt cx={0} cz={-26} rTop={12.4} rBot={36} h={17.5} color="#5a9a38" />
      <HillSkirt cx={-36} cz={-118} rTop={6.4} rBot={20} h={7.4} color="#4a8c32" />
      <HillSkirt cx={-50} cz={-108} rTop={4.2} rBot={14} h={4.2} color="#5a9a38" />
      <HillSkirt cx={-22} cz={-132} rTop={4.6} rBot={15} h={4.8} color="#3d8a32" />
    </group>
  );
}

function MeadowPool() {
  const water = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(1, 28);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const wobble = 1 + 0.22 * Math.sin(a * 3.1) + 0.16 * Math.cos(a * 5.4);
      pos.setX(i, 32 + x * 8.4 * wobble);
      pos.setZ(i, -76 + z * 6.8 * wobble);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (!water.current) return;
    const t = clock.elapsedTime;
    const y = heightAt(32, -76);
    water.current.position.y = y + 0.14 + Math.sin(t * 0.7) * 0.04;
    const mat = water.current.material as THREE.MeshStandardMaterial;
    mat.opacity = 0.64 + Math.sin(t * 1.4) * 0.06;
  });
  const y = heightAt(32, -76);
  return (
    <group>
      <mesh ref={water} geometry={geo} position={[0, y + 0.14, 0]} receiveShadow>
        {lamb("#3a8890", { kind: "water" })}
      </mesh>
      <mesh position={[32, y + 0.18, -76]} rotation={[-Math.PI / 2, 0, 0.4]}>
        <circleGeometry args={[4.6, 20]} />
        {lamb("#8ec8d0", { kind: "water" })}
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const wobble = 1 + 0.18 * Math.sin(a * 3);
        const r = 8.2 * wobble;
        const x = 32 + Math.cos(a) * r;
        const z = -76 + Math.sin(a) * r * 0.8;
        return (
          <mesh key={i} position={[x, heightAt(x, z) + 0.12, z]} rotation={[0.15, a, 0.1]} castShadow>
            <dodecahedronGeometry args={[0.26 + (i % 3) * 0.1, 0]} />
            {lamb(i % 2 ? "#8a8478" : "#6a665c")}
          </mesh>
        );
      })}
      {Array.from({ length: 8 }, (_, i) => {
        const a = i * 0.7;
        const x = 32 + Math.cos(a) * 8.8;
        const z = -76 + Math.sin(a) * 7.2;
        return (
          <mesh key={`r${i}`} position={[x, heightAt(x, z) + 0.45, z]}>
            <coneGeometry args={[0.06, 0.85, 4]} />
            {lamb("#3d6a32")}
          </mesh>
        );
      })}
      <mesh position={[26, heightAt(26, -70) + 0.14, -70]} receiveShadow>
        <boxGeometry args={[2.8, 0.14, 1.05]} />
        {lamb("#6a4a28")}
      </mesh>
    </group>
  );
}

function MeadowClouds() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.position.x = Math.sin(clock.elapsedTime * 0.015) * 12;
  });
  const puffs = [
    { x: 40, y: 38, z: -20, s: 18 },
    { x: 80, y: 42, z: 10, s: 22 },
    { x: -30, y: 36, z: 30, s: 16 },
    { x: 20, y: 44, z: 50, s: 20 },
    { x: 110, y: 40, z: -40, s: 24 },
  ];
  return (
    <group ref={g}>
      {puffs.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} scale={[1.8, 0.45, 1]}>
          <sphereGeometry args={[p.s, 10, 8]} />
          <meshBasicMaterial color="#f4d8b0" transparent opacity={0.35} depthWrite={false} fog={false} />
        </mesh>
      ))}
    </group>
  );
}

export function MeadowHaze() {
  return (
    <group>
      <mesh position={[0, 16, 70]} rotation={[-0.14, 0, 0]}>
        <planeGeometry args={[480, 70]} />
        <meshBasicMaterial color="#e8c4a0" transparent opacity={0.2} depthWrite={false} fog={false} />
      </mesh>
      <mesh position={[0, 22, 140]} rotation={[-0.1, 0, 0]}>
        <planeGeometry args={[640, 110]} />
        <meshBasicMaterial color="#c4a0c0" transparent opacity={0.18} depthWrite={false} fog={false} />
      </mesh>
      <mesh position={[0, 10, -40]} rotation={[-0.06, 0, 0]}>
        <planeGeometry args={[360, 40]} />
        <meshBasicMaterial color="#e8d4b0" transparent opacity={0.1} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}

export function MeadowArt() {
  return (
    <group>
      <MeadowGround />
      <MeadowHills />
      <MeadowKeep />
      <MeadowJail />
      <MeadowCottages />
      <MeadowFountain />
      <MeadowPool />
      <MeadowRiver />
      <DistantMountains />
      <MeadowClouds />
      <MeadowSheep />
      <MeadowGrass />
      <MeadowTufts />
      <MeadowFlowers />
      <MeadowStones />
      <MeadowPaths />
      <MeadowFences />
      <BroadTrees />
      <MeadowHaze />
      <N64Person look={{ ...HERO_LOOK, tunic: "#8a3a38", shirt: "#efe6d4", kit: "dress", kerchief: "#c8b090", longHair: true, pants: "#8a3a38" }} x={4.2} z={-124} seed={21} kid stay id="meadow-kid-a" facing={0.4} />
      <N64Person look={{ ...HERO_LOOK, tunic: "#5a3a22", shirt: "#efe6d4", kit: "vest", hairStyle: "curly", pants: "#3d6a38" }} x={8.4} z={-125} seed={22} kid stay id="meadow-kid-b" facing={-0.5} />
    </group>
  );
}
