import { useMemo, useRef } from "react";
import { LushTerrain } from "./lush/terrain";
import { LushGrass } from "./lush/grass";
import { LushPeaks } from "./lush/hills";
import { LushRiver, LushWaterClock, waterMaterial } from "./lush/water";
import { RIVER, STREAM } from "./lush/waterRuns";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, fieldHeight, pondU, POND, WILD_POND, VX, VZ, VR, pathU, HF_SIZE, HF_SEGS, HF_OZ, TERRAIN_REV, vWorld, KEEP_Z, JAIL_Z } from "./field";
import { pushAabb, HOUSES, houseSize, collideHouses } from "./house";
import { live } from "./live";
import { inVillage, PADDOCK, allFenceRuns } from "./village";
import { FenceRun } from "./villageArt";
import { HERO_LOOK, N64Person } from "./actors";
import { LushForest, LushTreeClock, type TreeSpec } from "./lush/trees";
import { lamb as stdLamb, GroundBlob, type MatKind } from "./mats";
import { sfx } from "../audio";
import { useGame } from "../store";
import { puffAt } from "./fx";
import { Boulder } from "./n64";

/** Keep collision — visual towers stay inside this AABB. Do not move. */
export const KEEP_COL = { cx: 0, cz: KEEP_Z, hx: 12.4, hz: 9.2 };
export const JAIL_COL = { cx: 0, cz: JAIL_Z, hx: 9.2, hz: 8.2 };

const COTTAGES: { cx: number; cz: number; hx: number; hz: number; yaw: number; s: number; brick: boolean }[] = [];

const SPRING = { cx: VX + 2, cz: VZ - 16, r: 1.7 };

export function collideKeep(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house || live.doorUse) return null;
  if (live.y > heightAt(KEEP_COL.cx, KEEP_COL.cz) + 5.6) return null;
  let x = nx;
  let z = nz;
  let hit = false;
  const k = pushAabb(x, z, KEEP_COL.cx, KEEP_COL.cz, KEEP_COL.hx, KEEP_COL.hz, 0.25);
  if (k) {
    x = k.x;
    z = k.z;
    hit = true;
  }
  const j = pushAabb(x, z, JAIL_COL.cx, JAIL_COL.cz, JAIL_COL.hx, JAIL_COL.hz, 0.25);
  if (j) {
    x = j.x;
    z = j.z;
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
        {lamb("#b9b6ad")}
      </mesh>
      <mesh position={[0, h * 0.28, 0]}>
        <cylinderGeometry args={[r * 1.06, r * 1.08, 0.42, 12]} />
        {lamb("#9b988f")}
      </mesh>
      <mesh position={[0, h * 0.62, 0]}>
        <cylinderGeometry args={[r * 0.96, r * 0.96, 0.22, 12]} />
        {lamb("#a8a59c")}
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
        {lamb("#44566e")}
      </mesh>
      <mesh position={[0, h + roof * 0.42, 0]} castShadow>
        <coneGeometry args={[r * 1.28, roof, 12]} />
        {lamb("#5d7493")}
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
      {lamb("#aeaba2")}
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
  const y = heightAt(0, KEEP_Z);
  const flags = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    flags.current.forEach((m, i) => {
      if (m) m.rotation.y = Math.sin(t * 1.4 + i) * 0.18;
    });
  });
  return (
    <group position={[0, y, KEEP_Z]} scale={[0.68, 0.68, 0.68]}>
      <mesh position={[0, -1.15, 0]} receiveShadow>
        <boxGeometry args={[26.4, 2.8, 18.6]} />
        {lamb("#8a8478", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 0.18, 0]} receiveShadow>
        <boxGeometry args={[25.2, 0.42, 17.2]} />
        {lamb("#9a9488", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[24.4, 6.4, 16.4]} />
        {lamb("#c6c3ba")}
      </mesh>
      <mesh position={[0, 6.55, 0]} receiveShadow>
        <boxGeometry args={[25.4, 0.42, 17.4]} />
        {lamb("#b0ada4")}
      </mesh>
      <mesh position={[0, 9.4, -1.4]} castShadow>
        <boxGeometry args={[11.6, 8.8, 9.2]} />
        {lamb("#d2cfc6")}
      </mesh>
      <mesh position={[0, 14.0, -1.4]} receiveShadow>
        <boxGeometry args={[12.4, 0.38, 10.0]} />
        {lamb("#b0ada4")}
      </mesh>
      <mesh position={[0, 16.2, -1.4]} rotation={[0.78, 0, 0]} castShadow>
        <boxGeometry args={[12.6, 0.18, 7.4]} />
        {lamb("#5d7493")}
      </mesh>
      <mesh position={[0, 16.2, -1.4]} rotation={[-0.78, 0, 0]} castShadow>
        <boxGeometry args={[12.6, 0.18, 7.4]} />
        {lamb("#52688a")}
      </mesh>
      {[0.4, 0.9, 1.4, 1.9, 2.4].map((t, i) => (
        <mesh key={`kt${i}`} position={[0, 14.15 + t * 0.95, -1.4]} rotation={[0.78, 0, 0]}>
          <boxGeometry args={[12.4, 0.05, 0.18]} />
          {lamb("#48607f")}
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
        {lamb("#b8b5ac")}
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
            <meshLambertMaterial color={i ? "#3a5a88" : "#5d7493"} side={THREE.DoubleSide} />
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
          {lamb("#aeaba2")}
        </mesh>
      ))}
      <pointLight position={[0, 6.2, 7.0]} color="#e8a050" intensity={4.2} distance={16} />
      <pointLight position={[-8.4, 11.2, 5.4]} color="#e09040" intensity={3.2} distance={10} />
      <pointLight position={[8.4, 11.2, 5.4]} color="#e09040" intensity={3.2} distance={10} />
    </group>
  );
}

export function MeadowJail() {
  const y = heightAt(0, JAIL_Z);
  return (
    <group position={[0, y, JAIL_Z]}>
      <mesh position={[0, -1.05, 0]} receiveShadow>
        <boxGeometry args={[16.2, 2.5, 14.0]} />
        {lamb("#8a8478", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 0.16, 0]} receiveShadow>
        <boxGeometry args={[15.2, 0.38, 13.0]} />
        {lamb("#9a9488", { kind: "stone" })}
      </mesh>
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
      <LushWaterClock />
      <LushRiver pts={RIVER} w={9.4} />
      <LushRiver pts={STREAM} w={5.2} />
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
  const far = [
    { x: -520, z: 920, r: 180, h: 88, c: "#8a9aa6" },
    { x: -40, z: 1020, r: 210, h: 108, c: "#7a8c9a" },
    { x: 480, z: 960, r: 190, h: 94, c: "#8494a2" },
    { x: 820, z: 620, r: 160, h: 74, c: "#90a0aa" },
    { x: -860, z: 560, r: 170, h: 80, c: "#7e8e98" },
    { x: 80, z: 1140, r: 230, h: 118, c: "#748890" },
    { x: -280, z: -1040, r: 170, h: 78, c: "#8898a2" },
    { x: 220, z: -1100, r: 190, h: 86, c: "#7c8c96" },
    { x: 700, z: -840, r: 150, h: 68, c: "#8a98a0" },
    { x: -740, z: -780, r: 160, h: 72, c: "#809098" },
    { x: 1020, z: 80, r: 170, h: 76, c: "#8696a0" },
    { x: -1060, z: 40, r: 175, h: 80, c: "#7a8a94" },
    { x: 900, z: -420, r: 140, h: 64, c: "#8494a0" },
    { x: -920, z: 320, r: 150, h: 70, c: "#7e8e96" },
    { x: 1480, z: 220, r: 210, h: 96, c: "#80909a" },
    { x: -1520, z: 160, r: 220, h: 102, c: "#748890" },
    { x: 180, z: 1560, r: 240, h: 118, c: "#6e8490" },
    { x: -120, z: -1580, r: 230, h: 110, c: "#7a8c96" },
    { x: 1280, z: -980, r: 190, h: 88, c: "#8494a0" },
    { x: -1360, z: -920, r: 200, h: 92, c: "#7e8e98" },
    { x: 1100, z: 1180, r: 180, h: 86, c: "#809098" },
    { x: -1180, z: 1240, r: 185, h: 90, c: "#768890" },
    { x: 1680, z: -200, r: 230, h: 108, c: "#748890" },
    { x: -1700, z: 80, r: 240, h: 112, c: "#6e8490" },
    { x: 200, z: 1780, r: 250, h: 122, c: "#6a808c" },
    { x: -80, z: -1760, r: 240, h: 116, c: "#768892" },
    { x: 1540, z: 980, r: 210, h: 100, c: "#7a8c96" },
    { x: -1600, z: -1100, r: 220, h: 104, c: "#748890" },
    { x: 80, z: -2100, r: 260, h: 128, c: "#6a808c" },
    { x: -2000, z: 420, r: 250, h: 122, c: "#748890" },
    { x: 2100, z: 160, r: 255, h: 124, c: "#6e8490" },
    { x: 400, z: 2200, r: 270, h: 132, c: "#6a808c" },
    { x: -300, z: -2200, r: 260, h: 126, c: "#768892" },
    { x: -2400, z: -200, r: 280, h: 140, c: "#6a808c" },
    { x: 500, z: 2700, r: 280, h: 138, c: "#6e8490" },
    { x: -2300, z: 1400, r: 250, h: 128, c: "#748890" },
    { x: 2300, z: -900, r: 255, h: 130, c: "#6a808c" },
    { x: -3180, z: 900, r: 290, h: 148, c: "#6a808c" },
    { x: 2760, z: 2100, r: 240, h: 122, c: "#748890" },
    { x: -180, z: 3480, r: 300, h: 158, c: "#6a808c" },
    { x: -80, z: -3360, r: 280, h: 150, c: "#6e8490" },
    { x: 3380, z: -420, r: 250, h: 118, c: "#809098" },
    { x: 1200, z: 3200, r: 260, h: 136, c: "#6a808c" },
    { x: -1400, z: -3100, r: 250, h: 128, c: "#748890" },
    { x: -4100, z: -2360, r: 300, h: 162, c: "#6a808c" },
    { x: 2720, z: -3180, r: 240, h: 128, c: "#748890" },
    { x: 4180, z: 1540, r: 260, h: 118, c: "#809098" },
    { x: -2920, z: 3180, r: 290, h: 150, c: "#6a808c" },
    { x: 1540, z: 4180, r: 250, h: 132, c: "#6e8490" },
    { x: -3520, z: -2680, r: 230, h: 120, c: "#748890" },
    { x: 540, z: 4560, r: 270, h: 146, c: "#6a808c" },
    { x: 4560, z: -720, r: 240, h: 124, c: "#809098" },
    { x: 3800, z: 2800, r: 255, h: 136, c: "#6e8490" },
    { x: -3800, z: 1400, r: 250, h: 130, c: "#748890" },
    { x: 800, z: -4200, r: 280, h: 148, c: "#6a808c" },
    { x: -800, z: 4200, r: 270, h: 142, c: "#6e8490" },
    { x: -4800, z: 920, r: 280, h: 150, c: "#809098" },
    { x: 80, z: 6680, r: 240, h: 118, c: "#6a808c" },
    { x: 5600, z: 2100, r: 250, h: 132, c: "#748890" },
    { x: -1680, z: 5380, r: 260, h: 140, c: "#6e8490" },
    { x: 5080, z: -2580, r: 240, h: 120, c: "#809098" },
    { x: -5380, z: -1180, r: 250, h: 128, c: "#748890" },
    { x: 2780, z: 5180, r: 245, h: 126, c: "#6a808c" },
    { x: -6200, z: 1800, r: 260, h: 138, c: "#748890" },
    { x: 7200, z: -1400, r: 250, h: 124, c: "#809098" },
    { x: 120, z: 7900, r: 230, h: 110, c: "#6e8490" },
    { x: -7200, z: -2200, r: 270, h: 146, c: "#6a808c" },
    { x: 6400, z: 4200, r: 240, h: 122, c: "#748890" },
    { x: 8800, z: 800, r: 255, h: 136, c: "#6e8490" },
    { x: -8800, z: 400, r: 265, h: 148, c: "#809098" },
    { x: 280, z: -8800, r: 280, h: 160, c: "#6a808c" },
    { x: -280, z: 9200, r: 250, h: 132, c: "#748890" },
    { x: 14000, z: 400, r: 420, h: 220, c: "#6a808c" },
    { x: -14000, z: -280, r: 400, h: 210, c: "#748890" },
    { x: 500, z: -14000, r: 460, h: 240, c: "#6a808c" },
    { x: -400, z: 14000, r: 430, h: 225, c: "#6e8490" },
    { x: 16000, z: 1800, r: 380, h: 190, c: "#748890" },
    { x: -16000, z: 1200, r: 370, h: 185, c: "#6a808c" },
    { x: 1800, z: 16000, r: 400, h: 200, c: "#809098" },
    { x: -1600, z: -16000, r: 390, h: 195, c: "#6e8490" },
    { x: 22000, z: 800, r: 480, h: 250, c: "#6a808c" },
    { x: -22000, z: -600, r: 460, h: 240, c: "#748890" },
    { x: 600, z: -22000, r: 520, h: 270, c: "#6a808c" },
    { x: -500, z: 22000, r: 500, h: 260, c: "#6e8490" },
    { x: 18, z: -620, r: 90, h: 64, c: "#5a7040" },
    { x: -70, z: -760, r: 110, h: 72, c: "#627848" },
    { x: 90, z: -880, r: 100, h: 68, c: "#546c3c" },
  ];
  return (
    <group>
      <LushPeaks peaks={far.filter((p) => Math.hypot(p.x, p.z) < 4200 && p.c !== "#5a7040" && p.c !== "#627848" && p.c !== "#546c3c")} />
    </group>
  );
}

function Sheep({ x, z, seed }: { x: number; z: number; seed: number }) {
  const g = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const legs = useRef<THREE.Group>(null);
  const id = `m${seed}`;
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime * 0.18 + seed * 1.7;
    const graze = Math.sin(t * 1.5);
    const walk = seed % 3 !== 0;
    const orbit = 0.55 + (seed % 5) * 0.12;
    let gx = walk ? x + Math.sin(t + seed) * orbit : x;
    let gz = walk ? z + Math.cos(t * 0.73 + seed * 0.4) * orbit : z;
    for (const [oid, s] of Object.entries(live.sheep)) {
      if (oid === id || !s) continue;
      const dx = gx - s.x;
      const dz = gz - s.z;
      const d = Math.hypot(dx, dz);
      const need = 1.15;
      if (d < need && d > 0.001) {
        gx = s.x + (dx / d) * need;
        gz = s.z + (dz / d) * need;
      }
    }
    if (live.townSheep === id) {
      gx = live.x;
      gz = live.z;
      g.current.rotation.y = live.yaw;
    } else {
      const hut = collideHouses(gx, gz, "meadow", true);
      if (hut) {
        gx = hut.x;
        gz = hut.z;
      }
      if (walk) g.current.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t * 0.7));
    }
    g.current.position.set(gx, heightAt(gx, gz), gz);
    if (head.current) head.current.rotation.x = graze * 0.38 - 0.28;
    live.sheep[id] = { x: gx, z: gz, r: 0.62 };
    if (legs.current) {
      const step = walk ? Math.sin(clock.elapsedTime * 5.2 + seed) : 0;
      legs.current.children.forEach((c, i) => {
        c.rotation.x = (i === 0 || i === 3 ? 1 : -1) * step * 0.28;
      });
    }
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
      <group ref={legs}>
        {[
          [-0.2, 0.22],
          [0.2, 0.22],
          [-0.2, -0.26],
          [0.2, -0.26],
        ].map(([lx, lz], i) => (
          <group key={i} position={[lx, 0.18, lz]}>
            <mesh position={[0, -0.02, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.06, 0.36, 6]} />
              {lamb("#4a3a28")}
            </mesh>
            <mesh position={[0, -0.18, 0.03]}>
              <boxGeometry args={[0.08, 0.045, 0.12]} />
              {lamb("#3a2818")}
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export function MeadowSheep() {
  const flock = useMemo(() => {
    const cx = PADDOCK.x;
    const cz = PADDOCK.z;
    return [
      { x: cx + 2.6, z: cz - 2.4, s: 1 },
      { x: cx - 3.2, z: cz + 1.6, s: 2 },
      { x: cx + 0.8, z: cz + 3.4, s: 3 },
      { x: cx + 3.8, z: cz + 0.6, s: 4 },
      { x: cx - 3.6, z: cz - 2.2, s: 5 },
      { x: cx - 1.2, z: cz - 3.6, s: 6 },
      { x: cx + 3.2, z: cz - 3.8, s: 8 },
      { x: cx - 2.4, z: cz + 3.6, s: 12 },
    ];
  }, []);
  return (
    <group>
      {flock.map((s) => (
        <Sheep key={s.s} x={s.x} z={s.z} seed={s.s * 1.7} />
      ))}
    </group>
  );
}

function Chicken({ x, z, seed }: { x: number; z: number; seed: number }) {
  const g = useRef<THREE.Group>(null);
  const wings = useRef<THREE.Group>(null);
  const id = `c${seed}`;
  const hits = useRef(0);
  const cool = useRef(0);
  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    cool.current = Math.max(0, cool.current - dt);
    if (live.carry === "cucco" && live.carryId === id) {
      g.current.visible = false;
      live.chickens[id] = { x: live.x, z: live.z, r: 0.55 };
      return;
    }
    g.current.visible = true;
    const angry = live.cuccoRage > 0;
    const t = clock.elapsedTime * (angry ? 2.4 : 0.55) + seed;
    let gx = x + Math.sin(t) * (angry ? 0.2 : 0.85);
    let gz = z + Math.cos(t * 0.8) * (angry ? 0.2 : 0.65);
    if (angry) {
      const dx = live.x - gx;
      const dz = live.z - gz;
      const d = Math.hypot(dx, dz) || 1;
      gx = live.x - (dx / d) * 0.85 + Math.sin(t * 3) * 0.4;
      gz = live.z - (dz / d) * 0.85 + Math.cos(t * 3) * 0.4;
      if (d < 1.15 && cool.current <= 0) {
        cool.current = 0.32;
        useGame.getState().hurtField(4, true);
        sfx.crow();
      }
    }
    g.current.position.set(gx, heightAt(gx, gz), gz);
    g.current.rotation.y = angry ? Math.atan2(live.x - gx, live.z - gz) : Math.atan2(Math.cos(t), -Math.sin(t * 0.8));
    live.chickens[id] = { x: gx, z: gz, r: 0.55 };
    if (wings.current) {
      const flap = Math.sin(clock.elapsedTime * (angry ? 28 : 10) + seed) * (angry ? 0.9 : 0.35);
      wings.current.children.forEach((c, i) => {
        c.rotation.z = (i ? 1 : -1) * (0.35 + flap);
      });
    }
    if (live.lastBoom && Math.hypot(live.lastBoom.x - gx, live.lastBoom.z - gz) < 3.4 && !angry) {
      hits.current = 9;
      live.cuccoRage = Math.max(live.cuccoRage, 12);
      sfx.crow();
      live.hint = "The chickens are furious!";
    }
    if (live.slash && !angry && cool.current <= 0) {
      if (Math.hypot(live.slash.x - gx, live.slash.z - gz) < 1.35) {
        cool.current = 0.35;
        hits.current += 1;
        sfx.swing();
        if (hits.current >= 2) {
          live.cuccoRage = 12;
          sfx.crow();
          live.hint = "The chickens are furious!";
        }
      }
    }
  });
  return (
    <group ref={g} position={[x, heightAt(x, z), z]} scale={1.35}>
      <mesh position={[0, 0.28, 0]} castShadow scale={[1, 0.85, 1.15]}>
        <sphereGeometry args={[0.16, 8, 7]} />
        {lamb("#f6f2ea")}
      </mesh>
      <mesh position={[0, 0.42, 0.12]} castShadow>
        <sphereGeometry args={[0.1, 8, 7]} />
        {lamb("#ffffff")}
      </mesh>
      <mesh position={[0, 0.4, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.035, 0.08, 5]} />
        {lamb("#e09030")}
      </mesh>
      <mesh position={[0, 0.5, 0.08]} castShadow>
        <coneGeometry args={[0.04, 0.08, 4]} />
        {lamb("#c43c32")}
      </mesh>
      {[-0.045, 0.045].map((s) => (
        <mesh key={s} position={[s, 0.45, 0.18]}>
          <sphereGeometry args={[0.018, 5, 4]} />
          {lamb("#1a1410")}
        </mesh>
      ))}
      <group ref={wings}>
        <mesh position={[-0.16, 0.3, 0]} rotation={[0, 0, -0.4]} castShadow>
          <boxGeometry args={[0.16, 0.04, 0.12]} />
          {lamb("#ffffff")}
        </mesh>
        <mesh position={[0.16, 0.3, 0]} rotation={[0, 0, 0.4]} castShadow>
          <boxGeometry args={[0.16, 0.04, 0.12]} />
          {lamb("#ffffff")}
        </mesh>
      </group>
      <mesh position={[0, 0.28, -0.16]} rotation={[0.5, 0, 0]}>
        <coneGeometry args={[0.04, 0.12, 5]} />
        {lamb("#f6f2ea")}
      </mesh>
      {[-0.05, 0.05].map((s) => (
        <mesh key={`l${s}`} position={[s, 0.08, 0.02]}>
          <cylinderGeometry args={[0.015, 0.018, 0.14, 4]} />
          {lamb("#e09030")}
        </mesh>
      ))}
    </group>
  );
}

export function MeadowChickens() {
  const flock = useMemo(() => {
    const yards = [
      vWorld(0, -50),
      vWorld(-24, -66),
      vWorld(24, -66),
      vWorld(-14, -74),
    ];
    const list: { x: number; z: number; s: number }[] = [];
    let s = 1;
    for (const y of yards) {
      list.push(
        { x: y.x + 2.4, z: y.z + 6.2, s: s++ },
        { x: y.x - 1.8, z: y.z + 5.4, s: s++ },
      );
    }
    return list;
  }, []);
  return (
    <group>
      {flock.map((c) => (
        <Chicken key={c.s} x={c.x} z={c.z} seed={c.s * 2.1} />
      ))}
      <CuccoStorm />
    </group>
  );
}

function CuccoStorm() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const on = live.cuccoRage > 0;
    g.current.visible = on;
    if (!on) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < g.current.children.length; i++) {
      const c = g.current.children[i]!;
      const a = t * 3.2 + i * 0.7;
      c.position.set(
        live.x + Math.cos(a) * (1.1 + (i % 3) * 0.45),
        live.y + 1.1 + Math.sin(t * 8 + i) * 0.35,
        live.z + Math.sin(a) * (1.1 + (i % 3) * 0.45),
      );
    }
  });
  return (
    <group ref={g} visible={false}>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} scale={1.1}>
          <sphereGeometry args={[0.14, 6, 5]} />
          <meshLambertMaterial color="#f6f2ea" />
        </mesh>
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
    const blade = new THREE.ConeGeometry(0.04, 0.26, 3);
    const pos: number[] = [];
    const nrm: number[] = [];
    const src = blade.attributes.position;
    const sn = blade.attributes.normal;
    const offsets: [number, number, number, number][] = [
      [0, 0, 0, 0],
      [0.12, 0, 0.08, 0.7],
      [-0.11, 0, 0.09, -0.55],
      [0.07, 0, -0.12, 1.2],
      [-0.08, 0, -0.1, -1.15],
      [0.16, 0, -0.03, 2.1],
      [-0.15, 0, 0.03, -1.9],
      [0.04, 0, 0.14, 0.3],
      [-0.05, 0, -0.15, 2.6],
    ];
    for (const [ox, oy, oz, rot] of offsets) {
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      for (let i = 0; i < src.count; i++) {
        const x = src.getX(i);
        const y = src.getY(i);
        const z = src.getZ(i);
        pos.push(x * c - z * s + ox, y + oy + 0.12, x * s + z * c + oz);
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
  const mat = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({ color: "#5a8234", emissive: "#2a4a18", emissiveIntensity: 0.12 });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         float h = max(0.0, position.y);
         float gust = sin(uTime * 1.35);
         transformed.x += gust * h * 0.26;
         transformed.z += gust * h * 0.07;`,
      );
      m.userData.shader = shader;
    };
    return m;
  }, []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const n = 56000;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const ready = useRef(false);
  const baked = useRef(-1);
  useFrame(({ clock }) => {
    const sh = mat.userData.shader as { uniforms: { uTime: { value: number } } } | undefined;
    if (sh) sh.uniforms.uTime.value = clock.elapsedTime;
    if (!mesh.current) return;
    if (baked.current !== TERRAIN_REV) {
      baked.current = TERRAIN_REV;
      ready.current = false;
    }
    if (!ready.current) {
      const rnd = seeded(19);
      const huts = HOUSES.filter((h: { world?: string }) => !h.world || h.world === "meadow");
      const step = 0.52;
      let i = 0;
      const innerCap = 12000;
      const blocked = (x: number, z: number) => {
        if (pondU(x, z) > 0.08) return true;
        if (pathU(x, z) > 0.78) return true;
        if (Math.hypot(x, z - KEEP_Z) < 20) return true;
        if (Math.hypot(x, z - JAIL_Z) < 12) return true;
        for (const h of huts) {
          const { w, d } = houseSize(h);
          if (Math.abs(x - h.x) < w * 0.28 && Math.abs(z - h.z) < d * 0.28) return true;
        }
        return false;
      };
      for (let ix = -90; ix <= 90 && i < innerCap; ix++) {
        for (let iz = -70; iz <= 110 && i < innerCap; iz++) {
          const x = VX + ix * step + (rnd() - 0.5) * 0.9;
          const z = VZ + iz * step + (rnd() - 0.5) * 0.9;
          if (blocked(x, z)) continue;
          dummy.position.set(x, fieldHeight(x, z) + 0.02, z);
          dummy.rotation.set((rnd() - 0.5) * 0.1, rnd() * 6.28, (rnd() - 0.5) * 0.1);
          dummy.scale.setScalar(0.72 + rnd() * 0.38);
          dummy.updateMatrix();
          mesh.current.setMatrixAt(i, dummy.matrix);
          i++;
        }
      }
      for (let k = 0; i < n && k < 90000; k++) {
        const a = rnd() * Math.PI * 2;
        const rad = 40 + rnd() * 22000;
        const x = VX + Math.cos(a) * rad;
        const z = VZ + Math.sin(a) * rad;
        if (blocked(x, z)) continue;
        dummy.position.set(x, fieldHeight(x, z) + 0.02, z);
        dummy.rotation.set((rnd() - 0.5) * 0.1, rnd() * 6.28, (rnd() - 0.5) * 0.1);
        dummy.scale.setScalar(0.9 + rnd() * 0.7);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
        i++;
      }
      mesh.current.count = i;
      mesh.current.instanceMatrix.needsUpdate = true;
      ready.current = true;
    }
  });
  return <instancedMesh ref={mesh} args={[geo, mat, n]} frustumCulled={false} castShadow={false} receiveShadow />;
}

export function MeadowCarpet() {
  const geo = useMemo(() => {
    const blade = new THREE.ConeGeometry(0.026, 0.14, 3);
    const pos: number[] = [];
    const nrm: number[] = [];
    const src = blade.attributes.position;
    const sn = blade.attributes.normal;
    const offsets: [number, number, number, number][] = [
      [0, 0, 0, 0],
      [0.07, 0, 0.04, 0.8],
      [-0.06, 0, 0.05, -0.7],
      [0.03, 0, -0.07, 1.4],
    ];
    for (const [ox, oy, oz, rot] of offsets) {
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      for (let i = 0; i < src.count; i++) {
        pos.push(src.getX(i) * c - src.getZ(i) * s + ox, src.getY(i) + oy + 0.06, src.getX(i) * s + src.getZ(i) * c + oz);
        nrm.push(sn.getX(i) * c - sn.getZ(i) * s, sn.getY(i), sn.getX(i) * s + sn.getZ(i) * c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
    return g;
  }, []);
  const mat = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({ color: "#4e8a32", emissive: "#244a18", emissiveIntensity: 0.12 });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         float h = max(0.0, position.y);
         float gust = sin(uTime * 1.35);
         transformed.x += gust * h * 0.22;
         transformed.z += gust * h * 0.06;`,
      );
      m.userData.shader = shader;
    };
    return m;
  }, []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const n = 36000;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const ready = useRef(false);
  const baked = useRef(-1);
  useFrame(({ clock }) => {
    const sh = mat.userData.shader as { uniforms: { uTime: { value: number } } } | undefined;
    if (sh) sh.uniforms.uTime.value = clock.elapsedTime;
    if (!mesh.current) return;
    if (baked.current !== TERRAIN_REV) {
      baked.current = TERRAIN_REV;
      ready.current = false;
    }
    if (ready.current) return;
    const rnd = seeded(31);
    const huts = HOUSES.filter((h: { world?: string }) => !h.world || h.world === "meadow");
    const step = 0.7;
    let i = 0;
    for (let ix = -70; ix <= 70 && i < 8000; ix++) {
      for (let iz = -50; iz <= 90 && i < 8000; iz++) {
        const x = VX + ix * step + (rnd() - 0.5) * 0.6;
        const z = VZ + iz * step + (rnd() - 0.5) * 0.6;
        if (pondU(x, z) > 0.08) continue;
        if (pathU(x, z) > 0.82) continue;
        let hut = false;
        for (const h of huts) {
          const { w, d } = houseSize(h);
          if (Math.abs(x - h.x) < w * 0.28 && Math.abs(z - h.z) < d * 0.28) {
            hut = true;
            break;
          }
        }
        if (hut) continue;
        dummy.position.set(x, fieldHeight(x, z) + 0.01, z);
        dummy.rotation.set(0, rnd() * 6.28, 0);
        dummy.scale.setScalar(0.75 + rnd() * 0.35);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
        i++;
      }
    }
    for (let k = 0; i < n && k < 80000; k++) {
      const a = rnd() * Math.PI * 2;
      const rad = 50 + rnd() * 22000;
      const x = VX + Math.cos(a) * rad;
      const z = VZ + Math.sin(a) * rad;
      if (pondU(x, z) > 0.08) continue;
      dummy.position.set(x, fieldHeight(x, z) + 0.01, z);
      dummy.rotation.set(0, rnd() * 6.28, 0);
      dummy.scale.setScalar(0.8 + rnd() * 0.5);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
      i++;
    }
    mesh.current.count = i;
    mesh.current.instanceMatrix.needsUpdate = true;
    ready.current = true;
  });
  return <instancedMesh ref={mesh} args={[geo, mat, n]} frustumCulled={false} castShadow={false} receiveShadow />;
}

export function MeadowTufts() {
  const geo = useMemo(() => {
    const pos: number[] = [];
    const nrm: number[] = [];
    const leaves: { yaw: number; tilt: number; h: number; r: number }[] = [
      { yaw: 0.15, tilt: 0.1, h: 0.78, r: 0.085 },
      { yaw: 0.05, tilt: 0.62, h: 0.92, r: 0.1 },
      { yaw: 1.22, tilt: 0.7, h: 0.98, r: 0.095 },
      { yaw: 2.4, tilt: 0.56, h: 0.86, r: 0.105 },
      { yaw: 3.62, tilt: 0.66, h: 1.02, r: 0.098 },
      { yaw: 4.9, tilt: 0.6, h: 0.9, r: 0.092 },
      { yaw: 0.7, tilt: 0.34, h: 0.84, r: 0.09 },
      { yaw: 2.9, tilt: 0.3, h: 0.9, r: 0.09 },
      { yaw: 5.5, tilt: 0.36, h: 0.8, r: 0.088 },
    ];
    for (const L of leaves) {
      const cone = new THREE.ConeGeometry(L.r, L.h, 4);
      cone.translate(0, L.h * 0.5, 0);
      cone.rotateX(L.tilt);
      cone.rotateY(L.yaw);
      const src = cone.attributes.position;
      const sn = cone.attributes.normal;
      for (let i = 0; i < src.count; i++) {
        pos.push(src.getX(i), src.getY(i), src.getZ(i));
        // Light tufts like turf (mostly-up normals) so they never go black against the sun.
        const nl = Math.hypot(sn.getX(i) * 0.35, 1, sn.getZ(i) * 0.35);
        nrm.push((sn.getX(i) * 0.35) / nl, 1 / nl, (sn.getZ(i) * 0.35) / nl);
      }
      cone.dispose();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
    return g;
  }, []);
  const mat = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({ color: "#7db43a", emissive: "#2c4a12", emissiveIntensity: 0.2 });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         float h = max(0.0, position.y);
         float gust = sin(uTime * 1.15 + position.x * 0.4);
         transformed.x += gust * h * 0.1;
         transformed.z += gust * h * 0.04;`,
      );
      m.userData.shader = shader;
    };
    return m;
  }, []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const n = 9000;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const bases = useRef<{ x: number; z: number }[]>([]);
  const gone = useRef(new Set<number>());
  const ready = useRef(false);
  const baked = useRef(-1);
  useFrame(({ clock }) => {
    const sh = mat.userData.shader as { uniforms: { uTime: { value: number } } } | undefined;
    if (sh) sh.uniforms.uTime.value = clock.elapsedTime;
    if (!mesh.current) return;
    if (baked.current !== TERRAIN_REV) {
      baked.current = TERRAIN_REV;
      ready.current = false;
      gone.current.clear();
    }
    if (!ready.current) {
      const rnd = seeded(71);
      const huts = HOUSES.filter((h: { world?: string }) => !h.world || h.world === "meadow");
      const spots: { x: number; z: number }[] = [];
      const inWall = (x: number, z: number) => {
        if (pondU(x, z) > 0.08) return true;
        if (pathU(x, z) > 0.55) return true;
        if (Math.hypot(x, z - KEEP_Z) < 18) return true;
        if (Math.hypot(x, z - JAIL_Z) < 11) return true;
        for (const h of huts) {
          const { w, d } = houseSize(h);
          if (Math.abs(x - h.x) < w * 0.3 && Math.abs(z - h.z) < d * 0.3) return true;
        }
        return false;
      };
      const place = (x: number, z: number, s: number) => {
        if (spots.length >= n) return;
        if (inWall(x, z)) return;
        dummy.position.set(x, heightAt(x, z) + 0.02, z);
        dummy.rotation.set(0, rnd() * 6.28, (rnd() - 0.5) * 0.08);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        mesh.current!.setMatrixAt(spots.length, dummy.matrix);
        spots.push({ x, z });
      };
      for (const h of huts) {
        const { w, d } = houseSize(h);
        const around = 28 + Math.floor(rnd() * 10);
        for (let i = 0; i < around; i++) {
          const a = rnd() * Math.PI * 2;
          const rx = w * (0.42 + rnd() * 0.7);
          const rz = d * (0.42 + rnd() * 0.7);
          place(h.x + Math.cos(a) * rx, h.z + Math.sin(a) * rz, 1.35 + rnd() * 0.85);
        }
      }
      for (let ix = -48; ix <= 48; ix++) {
        for (let iz = -40; iz <= 90; iz++) {
          if ((ix * 13 + iz * 7 + 3) % 5 === 0) continue;
          const x = VX + ix * 3.15 + (rnd() - 0.5) * 2.4;
          const z = VZ + iz * 3.15 + (rnd() - 0.5) * 2.4;
          const big = rnd() < 0.09;
          place(x, z, big ? 1.55 + rnd() * 0.7 : 0.52 + rnd() * 0.42);
        }
      }
      for (let i = 0; spots.length < n && i < 20000; i++) {
        const a = rnd() * Math.PI * 2;
        const rad = 20 + rnd() * 22000;
        const x = VX + Math.cos(a) * rad;
        const z = VZ + Math.sin(a) * rad;
        const big = rnd() < 0.18;
        place(x, z, big ? 1.85 + rnd() * 1.1 : 0.7 + rnd() * 0.5);
      }
      for (let p = 0; p < 48 && spots.length < n; p++) {
        const a = rnd() * Math.PI * 2;
        const rad = 80 + rnd() * 18000;
        const cx = VX + Math.cos(a) * rad;
        const cz = VZ + Math.sin(a) * rad;
        for (let k = 0; k < 22 && spots.length < n; k++) {
          place(cx + (rnd() - 0.5) * 14, cz + (rnd() - 0.5) * 14, 1.9 + rnd() * 1.3);
        }
      }
      bases.current = spots;
      mesh.current.count = spots.length;
      mesh.current.instanceMatrix.needsUpdate = true;
      ready.current = true;
      return;
    }
    if (!live.slash) return;
    let cut = false;
    bases.current.forEach((b, i) => {
      if (gone.current.has(i)) return;
      if (Math.hypot(live.slash!.x - b.x, live.slash!.z - b.z) > 1.5) return;
      gone.current.add(i);
      dummy.position.set(b.x, -40, b.z);
      dummy.scale.setScalar(0.001);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
      puffAt(b.x, b.z, heightAt(b.x, b.z) + 0.2, false);
      if (Math.random() < 0.22) {
        live.drops.push({
          id: `t-${i}`,
          kind: Math.random() < 0.4 ? "heart" : "coin",
          x: b.x,
          z: b.z,
          y: 0.3,
          n: 1,
        });
      }
      cut = true;
    });
    if (cut) {
      sfx.swing();
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  });
  return <instancedMesh ref={mesh} args={[geo, mat, n]} frustumCulled={false} castShadow={false} receiveShadow />;
}

export function MeadowFlowers() {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(0.055, 6, 5);
    return g;
  }, []);
  const n = 5600;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const ready = useRef(false);
  const baked = useRef(-1);
  useFrame(() => {
    if (!mesh.current) return;
    if (baked.current !== TERRAIN_REV) {
      baked.current = TERRAIN_REV;
      ready.current = false;
    }
    if (ready.current) return;
    const rnd = seeded(41);
    const cols = ["#3a78d4", "#d43c3c", "#e87828", "#f0d040", "#f2eee4"];
    const huts = HOUSES.filter((h: { world?: string }) => !h.world || h.world === "meadow");
    let k = 0;
    for (let ix = -70; ix <= 70 && k < 3200; ix++) {
      for (let iz = -60; iz <= 160 && k < 3200; iz++) {
        if ((ix * 11 + iz * 5) % 3 !== 0) continue;
        const x = VX + ix * 1.85 + (rnd() - 0.5) * 1.4;
        const z = VZ + iz * 1.85 + (rnd() - 0.5) * 1.4;
        if (pondU(x, z) > 0.08) continue;
        if (pathU(x, z) > 0.62) continue;
        let hut = false;
        for (const h of huts) {
          const { w, d } = houseSize(h);
          if (Math.abs(x - h.x) < w * 0.42 && Math.abs(z - h.z) < d * 0.42) {
            hut = true;
            break;
          }
        }
        if (hut) continue;
        dummy.position.set(x, fieldHeight(x, z) + 0.12, z);
        dummy.scale.setScalar(0.55 + rnd() * 0.55);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(k, dummy.matrix);
        color.set(cols[k % cols.length]!);
        mesh.current.setColorAt(k, color);
        k++;
      }
    }
    for (let i = 0; k < n && i < 8000; i++) {
      const a = rnd() * Math.PI * 2;
      const rad = 110 + rnd() * 4000;
      const x = VX + Math.cos(a) * rad;
      const z = VZ + Math.sin(a) * rad;
      if (pondU(x, z) > 0.08) continue;
      dummy.position.set(x, fieldHeight(x, z) + 0.12, z);
      dummy.scale.setScalar(0.6 + rnd() * 0.6);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(k, dummy.matrix);
      color.set(cols[k % cols.length]!);
      mesh.current.setColorAt(k, color);
      k++;
    }
    mesh.current.count = k;
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    ready.current = true;
  });
  return (
    <instancedMesh ref={mesh} args={[geo, undefined, n]}>
      <meshLambertMaterial vertexColors />
    </instancedMesh>
  );
}

export function MeadowStones() {
  const spots = useMemo(() => {
    const rnd = seeded(7);
    const list: { x: number; z: number; s: number; r: number }[] = [];
    for (let i = 0; i < 52; i++) {
      const a = rnd() * Math.PI * 2;
      const rad = 18 + rnd() * 820;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad - 50;
      if (pondU(x, z) > 0.08) continue;
      if (Math.hypot(x, z - KEEP_Z) < 18) continue;
      if (Math.hypot(x - VX, z - VZ) < VR + 10) continue;
      list.push({ x, z, s: 0.22 + rnd() * 0.28, r: rnd() * Math.PI });
    }
    return list;
  }, []);
  return (
    <group>
      {spots.map((s, i) => (
        <group key={i} position={[s.x, heightAt(s.x, s.z), s.z]}>
          <Boulder s={s.s} r={s.r} moss={i % 5 === 0} />
        </group>
      ))}
    </group>
  );
}

export function MeadowPaths() {
  const paths: { from: [number, number]; to: [number, number]; n: number }[] = [
    { from: [VX + 4, VZ + 16], to: [VX, VZ - 8], n: 14 },
    { from: [VX, VZ + 8], to: [VX - 18, VZ - 4], n: 10 },
    { from: [VX, VZ + 8], to: [VX + 18, VZ - 2], n: 10 },
    { from: [VX - 4, VZ - 8], to: [POND.x + 6, POND.z + 5], n: 8 },
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
  const runs = allFenceRuns();
  return (
    <group>
      {runs.map((r, i) => (
        <FenceRun key={i} ax={r.ax} az={r.az} bx={r.bx} bz={r.bz} gate={r.gate} />
      ))}
    </group>
  );
}

export function BroadTrees() {
  const spots = useMemo(() => {
    const list: TreeSpec[] = [];
    const blocked = (x: number, z: number) => {
      if (Math.hypot(x - VX, z - VZ) < VR - 8) return true;
      if (Math.abs(x) < 18 && Math.abs(z - KEEP_Z) < 14) return true;
      if (Math.abs(x) < 12 && Math.abs(z - JAIL_Z) < 10) return true;
      if (pondU(x, z) > 0.08) return true;
      return false;
    };
    const push = (x: number, z: number, s: number, kind: "pine" | "oak", force = false) => {
      if (!force && blocked(x, z)) return;
      list.push({ x, z, s: s * 1.42 * (kind === "pine" ? 1.3 : 1.15), kind, seed: list.length * 17 });
    };
    // Pines on the west bank — never in the water.
    push(POND.x - 28, POND.z - 12, 3.35, "pine");
    push(POND.x - 32, POND.z + 6, 2.95, "pine");
    push(POND.x - 26, POND.z + 14, 2.7, "pine");
    push(POND.x - 34, POND.z - 4, 2.45, "pine");
    push(POND.x - 22, POND.z - 22, 2.3, "pine");
    push(POND.x - 30, POND.z - 20, 2.15, "pine");
    push(POND.x - 38, POND.z + 4, 2.55, "pine");
    push(POND.x - 20, POND.z + 18, 1.85, "oak");
    push(POND.x + 22, POND.z + 14, 1.7, "oak");
    push(POND.x + 26, POND.z + 2, 1.55, "oak");
    push(POND.x + 20, POND.z - 16, 1.5, "oak");
    push(POND.x + 8, POND.z - 22, 1.42, "oak");
    push(POND.x + 24, POND.z + 18, 1.38, "oak");
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2 + 0.08;
      const dist = VR + 8 + (i % 5) * 7;
      push(VX + Math.sin(a) * dist, VZ + Math.cos(a) * dist, 1.35 + (i % 5) * 0.22, i % 3 === 0 ? "oak" : "pine");
    }
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + 0.4;
      const dist = VR + 36 + (i % 3) * 10;
      push(VX + Math.sin(a) * dist, VZ + Math.cos(a) * dist, 1.7 + (i % 4) * 0.22, i % 2 ? "oak" : "pine");
    }
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + 0.22;
      const dist = VR + 88 + (i % 4) * 14;
      push(VX + Math.sin(a) * dist, VZ + Math.cos(a) * dist, 1.8 + (i % 3) * 0.28, i % 2 ? "pine" : "oak");
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.9;
      const dist = VR + 168 + (i % 3) * 18;
      push(VX + Math.sin(a) * dist, VZ + Math.cos(a) * dist, 2.05 + (i % 4) * 0.25, i % 3 ? "oak" : "pine");
    }
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + 0.18;
      const dist = VR + 280 + (i % 4) * 22;
      push(VX + Math.sin(a) * dist, VZ + Math.cos(a) * dist, 2.15 + (i % 4) * 0.28, i % 2 ? "pine" : "oak");
    }
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + 0.55;
      const dist = VR + 430 + (i % 3) * 28;
      push(VX + Math.sin(a) * dist, VZ + Math.cos(a) * dist, 2.3 + (i % 5) * 0.3, i % 3 ? "oak" : "pine");
    }
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + 1.1;
      const dist = VR + 620 + (i % 4) * 32;
      push(VX + Math.sin(a) * dist, VZ + Math.cos(a) * dist, 2.45 + (i % 3) * 0.32, i % 2 ? "pine" : "oak");
    }
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + 0.4;
      const dist = VR + 900 + (i % 5) * 40;
      push(VX + Math.sin(a) * dist, VZ + Math.cos(a) * dist, 2.55 + (i % 4) * 0.34, i % 2 ? "pine" : "oak");
    }
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + 1.7;
      const dist = VR + 1220 + (i % 4) * 48;
      push(VX + Math.sin(a) * dist, VZ + Math.cos(a) * dist, 2.7 + (i % 3) * 0.36, i % 3 ? "oak" : "pine");
    }
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + 0.2;
      const dist = VR + 1550 + (i % 5) * 52;
      push(VX + Math.sin(a) * dist, VZ + Math.cos(a) * dist, 2.85 + (i % 4) * 0.32, i % 2 ? "pine" : "oak");
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.9;
      const dist = VR + 2200 + (i % 4) * 70;
      push(VX + Math.sin(a) * dist, VZ + Math.cos(a) * dist, 3.0 + (i % 3) * 0.4, i % 2 ? "pine" : "oak");
    }
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 1.4;
      const dist = VR + 3000 + (i % 5) * 80;
      push(VX + Math.sin(a) * dist, VZ + Math.cos(a) * dist, 3.2 + (i % 3) * 0.36, i % 2 ? "oak" : "pine");
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.6;
      const dist = VR + 4000 + (i % 5) * 90;
      push(VX + Math.sin(a) * dist, VZ + Math.cos(a) * dist, 3.4 + (i % 3) * 0.4, i % 2 ? "pine" : "oak");
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 1.1;
      const dist = VR + 5200 + (i % 4) * 100;
      push(VX + Math.sin(a) * dist, VZ + Math.cos(a) * dist, 3.5 + (i % 3) * 0.4, i % 2 ? "oak" : "pine");
    }
    const hills: [number, number][] = [
      [VX - 76, VZ + 2],
      [VX + 78, VZ - 8],
      [VX + 6, VZ - 82],
      [VX - 58, VZ - 58],
      [VX + 56, VZ - 54],
      [-62, VZ + 78],
      [8, VZ + 92],
      [68, VZ + 82],
      [-18, VZ + 108],
      [268, 18],
      [-248, 52],
      [148, 252],
      [-172, 236],
      [WILD_POND.x - 18, WILD_POND.z + 8],
      [WILD_POND.x + 16, WILD_POND.z - 10],
      [380, 48],
      [-360, -36],
      [430, 270],
      [-248, 310],
      [510, 390],
      [-70, 680],
      [710, -450],
      [-620, 170],
      [640, -260],
      [-1080, 90],
      [1080, 720],
      [-920, -860],
      [260, -1120],
      [1100, -80],
      [-1180, -200],
      [1480, -220],
      [80, -1720],
      [-1560, 380],
      [920, 1080],
      [-1520, -980],
      [640, -920],
      [-180, 1480],
      [-880, 980],
      [1580, 180],
      [1680, 520],
      [-2200, -180],
      [420, 2480],
      [-2100, 1320],
      [2100, -860],
      [-780, 1680],
      [-32, -44],
      [-3180, 880],
      [2760, 2080],
      [-160, 3460],
      [-60, -3360],
      [3380, -400],
      [-4100, -2360],
      [2720, -3180],
      [4180, 1540],
      [-2920, 3180],
      [1540, 4180],
      [-3520, -2680],
      [540, 4560],
      [4560, -720],
      [-4800, 920],
      [36, 6680],
      [5600, 2100],
      [-1680, 5380],
      [5080, -2580],
      [-5380, -1180],
      [2780, 5180],
      [-6200, 1800],
      [7200, -1400],
      [120, 7900],
      [-7200, -2200],
      [6400, 4200],
    ];
    hills.forEach(([hx, hz], hi) => {
      const far = Math.hypot(hx, hz - VZ) > 1600;
      const n = far ? 2 : 8;
      for (let k = 0; k < n; k++) {
        const a = k * 0.85 + hi;
        push(hx + Math.cos(a) * (6 + k * 2.0), hz + Math.sin(a) * (6 + k * 2.0), 1.35 + (k % 3) * 0.2, k % 2 ? "pine" : "oak");
      }
    });
    return list;
  }, []);
  return (
    <LushForest spots={spots} />
  );
}

function GableWall({ x, y, width, height, color }: { x: number; y: number; width: number; height: number; color: string }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-width * 0.5, 0);
    s.lineTo(width * 0.5, 0);
    s.lineTo(0, height);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false });
    g.translate(0, 0, -0.07);
    return g;
  }, [width, height]);
  return (
    <mesh geometry={geo} position={[x, y, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
      {lamb(color, { kind: "plaster" })}
    </mesh>
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
      <GableWall x={-2.68} y={3.12} width={4.5} height={3.2} color={wall} />
      <GableWall x={2.68} y={3.12} width={4.5} height={3.2} color={wall} />
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

export function MeadowGround() {
  const geo = useMemo(() => {
    const size = HF_SIZE;
    const segs = HF_SEGS;
    const g = new THREE.PlaneGeometry(size, size, segs, segs);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const lo = new THREE.Color("#3a6424");
    const mid = new THREE.Color("#5c8434");
    const hi = new THREE.Color("#9aaa4c");
    const dirt = new THREE.Color("#c4a06a");
    const mud = new THREE.Color("#6a4a28");
    const villageG = new THREE.Color("#5c7c38");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i) + HF_OZ;
      pos.setZ(i, z);
      const y = fieldHeight(x, z);
      pos.setY(i, y);
      const pu = pondU(x, z);
      const hillT = Math.max(0, Math.min(1, (y - 3) / 20));
      const valley = y < -1 ? Math.min(1, (-1 - y) / 8) : 0;
      let r = mid.r * (1 - hillT) + hi.r * hillT;
      let gv = mid.g * (1 - hillT) + hi.g * hillT;
      let b = mid.b * (1 - hillT) + hi.b * hillT;
      r = r * (1 - valley) + lo.r * valley;
      gv = gv * (1 - valley) + lo.g * valley;
      b = b * (1 - valley) + lo.b * valley;
      const mix = (Math.sin(x * 0.07) + Math.cos(z * 0.05)) * 0.5 + 0.5;
      r = r * (0.94 + mix * 0.06);
      gv = gv * (0.95 + mix * 0.05);
      const village = Math.hypot(x - VX, z - VZ) < VR;
      if (village) {
        r = r * 0.4 + villageG.r * 0.6;
        gv = gv * 0.4 + villageG.g * 0.6;
        b = b * 0.4 + villageG.b * 0.6;
      }
      const keepRoad = Math.abs(x) * 0.42;
      const pth = pathU(x, z);
      const onKeep = z > VZ + 10 && z < KEEP_Z - 8 && keepRoad < 3.6;
      const mudU = pu > 0.04 && pu < 0.48 ? (pu - 0.04) / 0.44 : 0;
      const puw = pu > 0.38 ? Math.min(1, (pu - 0.38) * 2.2) : 0;
      const dw = Math.max(pth, onKeep ? ((3.6 - keepRoad) / 3.6) * 0.7 : 0);
      const mudW = Math.max(0, mudU - puw) * 0.95;
      col[i * 3] = r * (1 - puw - dw * 0.92 - mudW) + 0.12 * puw + dirt.r * dw * 0.92 + mud.r * mudW;
      col[i * 3 + 1] = gv * (1 - puw - dw * 0.92 - mudW) + 0.28 * puw + dirt.g * dw * 0.92 + mud.g * mudW;
      col[i * 3 + 2] = b * (1 - puw - dw * 0.92 - mudW) + 0.2 * puw + dirt.b * dw * 0.92 + mud.b * mudW;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, [TERRAIN_REV]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}

function MeadowPool() {
  const water = useRef<THREE.Mesh>(null);
  const y = fieldHeight(WILD_POND.x, WILD_POND.z) + 1.12;
  useFrame(({ clock }) => {
    if (water.current) water.current.position.y = y + Math.sin(clock.elapsedTime * 0.45) * 0.04;
  });
  return (
    <group>
      <mesh ref={water} position={[WILD_POND.x, y, WILD_POND.z]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow>
        <circleGeometry args={[WILD_POND.r * 0.96, 28]} />
        <primitive object={waterMaterial()} attach="material" />
      </mesh>
    </group>
  );
}

function MeadowClouds() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.position.x = Math.sin(clock.elapsedTime * 0.012) * 16;
  });
  const puffs = [
    { x: 30, y: 38, z: VZ + 70, s: 18 },
    { x: 70, y: 42, z: VZ + 90, s: 24 },
    { x: -40, y: 36, z: VZ + 80, s: 16 },
    { x: 10, y: 44, z: VZ + 120, s: 22 },
    { x: 100, y: 40, z: VZ + 50, s: 20 },
    { x: -70, y: 40, z: VZ + 60, s: 15 },
    { x: 48, y: 34, z: VZ + 100, s: 14 },
    { x: -24, y: 32, z: VZ + 130, s: 12 },
    { x: 220, y: 48, z: VZ + 180, s: 26 },
    { x: -180, y: 46, z: VZ + 160, s: 22 },
    { x: 80, y: 50, z: VZ - 220, s: 20 },
    { x: -120, y: 44, z: VZ - 180, s: 18 },
    { x: 340, y: 52, z: 40, s: 24 },
    { x: -300, y: 50, z: 20, s: 22 },
    { x: 900, y: 90, z: -800, s: 48 },
    { x: -820, y: 88, z: -600, s: 42 },
    { x: 400, y: 110, z: -1800, s: 56 },
    { x: -1400, y: 100, z: 400, s: 50 },
    { x: 2200, y: 130, z: -400, s: 64 },
    { x: -2000, y: 120, z: -2200, s: 58 },
    { x: 80, y: 140, z: -4200, s: 72 },
    { x: 3200, y: 150, z: 800, s: 70 },
  ];
  return (
    <group ref={g}>
      {puffs.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]}>
          <mesh scale={[1.9, 0.42, 1.1]}>
            <sphereGeometry args={[p.s, 10, 8]} />
            <meshBasicMaterial color="#f4f1e8" transparent opacity={0.72} depthWrite={false} fog={false} />
          </mesh>
          <mesh position={[p.s * 0.35, p.s * 0.08, 0]} scale={[1.2, 0.38, 0.9]}>
            <sphereGeometry args={[p.s * 0.55, 8, 6]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.65} depthWrite={false} fog={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function MeadowHaze() {
  return (
    <group>
      <mesh position={[0, 80, 2200]} rotation={[-0.04, 0, 0]}>
        <planeGeometry args={[8000, 420]} />
        <meshBasicMaterial color="#c8dce4" transparent opacity={0.1} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}

function MeadowSky() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[18000, 24, 16]} />
        <meshBasicMaterial color="#d8d4c6" side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 400, 0]}>
        <sphereGeometry args={[18000, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
        <meshBasicMaterial color="#efe6d2" side={THREE.BackSide} fog={false} depthWrite={false} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

export function MeadowArt() {
  return (
    <group>
      <LushTerrain />
      <LushTreeClock />
      <LushGrass />
      <MeadowKeep />
      <MeadowJail />
      <MeadowPool />
      <MeadowRiver />
      <DistantMountains />
      <MeadowSheep />
      <MeadowChickens />
      <MeadowTufts />
      <MeadowStones />
      <MeadowFences />
      <BroadTrees />
      <MeadowHaze />
      <N64Person look={{ ...HERO_LOOK, tunic: "#8a3a38", shirt: "#efe6d4", kit: "dress", kerchief: "#c8b090", longHair: true, pants: "#8a3a38" }} x={VX + 3.2} z={VZ + 10} seed={21} kid stay id="meadow-kid-a" facing={0.4} />
      <N64Person look={{ ...HERO_LOOK, tunic: "#5a3a22", shirt: "#a83838", kit: "vest", hairStyle: "curly", pants: "#3a5a88" }} x={VX + 6.4} z={VZ + 9} seed={22} kid stay id="meadow-kid-b" facing={-0.5} />
    </group>
  );
}

