import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { takeCipher } from "../cipher";
import { consumeTalk as consumeTalkRaw } from "../input";
import { lamb } from "./mats";
import { N64Sign, HeartContainerMesh } from "./actors";
import { N64Foe, type FangPose } from "./n64";
import { puffAt } from "./fx";
import { isChestOpen, markChestOpen } from "./puzzles";
import {
  ET,
  ELDER,
  FLOORS,
  WINDOWS,
  BRANCHES,
  BELLS,
  setElderGnd,
  extraY,
  elderRad,
  offsetAt,
  bellAt,
  knotAt,
  chestAt,
  strikeBell,
  pushKnot,
  bellsOpen,
  knotsOpen,
  elderFloorName,
} from "./elder";

function talkOk() {
  if (live.nearNpc || live.nearHouse || live.nearChest || live.nearHorse) return false;
  return consumeTalkRaw();
}

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
}

const BARK = "#5a3a22";
const BARK_D = "#3e2818";
const BARK_IN = "#4a3220";
const LEAF_A = "#245a28";
const LEAF_B = "#2e6a30";
const LEAF_C = "#1e4a22";
const LEAF_NEW = "#6a9a38";
const WOOD = "#8a5a28";
const GOLD = "#c9a227";

export function ElderPlay() {
  return (
    <group>
      <ElderBegin />
      <ElderFar />
      <ElderRoots />
      <ElderInterior />
      <ElderBranches />
      <ElderWindows />
      <ElderBells />
      <ElderKnots />
      <ElderLaddersViz />
      <ElderChests />
      <ElderCrown />
      <ElderFoes />
      <ElderSign />
      <ElderListen />
    </group>
  );
}

function ElderBegin() {
  useFrame(() => {
    if (live.house || live.below) return;
    setElderGnd(heightAt(ET.x, ET.z));
  }, -3);
  return null;
}

function ElderFar() {
  const gy = heightAt(ET.x, ET.z);
  const segs = live.quality === "low" ? 7 : 9;
  const trunk = useRef<THREE.Group>(null);
  const crowns: [number, number, number, number, string][] = [
    [7.4, 82.2, 6.2, 11.4, LEAF_A],
    [-6.8, 80.6, -5.4, 10.6, LEAF_B],
    [5.2, 79.4, -7.8, 10.2, LEAF_C],
    [-4.4, 84.8, 5.6, 9.4, LEAF_NEW],
  ];
  useFrame(() => {
    if (!trunk.current) return;
    const d = elderRad(live.x, live.z);
    const extra = extraY();
    trunk.current.visible = d > 22 && extra < 8;
  });
  return (
    <group position={[ET.x, gy, ET.z]}>
      <group ref={trunk}>
        <mesh position={[0, 18, 0]} castShadow>
          <cylinderGeometry args={[11.4, 13.2, 36, segs]} />
          {lamb(BARK)}
        </mesh>
        <mesh position={[0, 48, 0]} castShadow>
          <cylinderGeometry args={[9.2, 11.4, 28, segs]} />
          {lamb(BARK)}
        </mesh>
        <mesh position={[0, 68, 0]} castShadow>
          <cylinderGeometry args={[7.4, 9.2, 16, segs]} />
          {lamb(BARK_D)}
        </mesh>
      </group>
      {crowns.map((c, i) => (
        <mesh key={i} position={[c[0], c[1], c[2]]} castShadow>
          <sphereGeometry args={[c[3], 10, 8]} />
          {lamb(c[4])}
        </mesh>
      ))}
      {[
        [2.2, 86.4, 1.4, 6.8, LEAF_B],
        [-1.6, 88.2, -2.2, 5.6, LEAF_A],
        [3.4, 78.8, 8.6, 5.2, LEAF_C],
        [-8.2, 77.4, 2.8, 4.8, LEAF_A],
      ].map((c, i) => (
        <mesh key={`n${i}`} position={[c[0] as number, c[1] as number, c[2] as number]} castShadow>
          <sphereGeometry args={[c[3] as number, 8, 6]} />
          {lamb(c[4] as string)}
        </mesh>
      ))}
      <Scar />
      <OuterBark />
    </group>
  );
}

function OuterBark() {
  const g = useRef<THREE.Group>(null);
  const bands = [
    { y: 6.4, h: 12.4, r: ELDER.outer - 0.15 },
    { y: 20.6, h: 15.2, r: ELDER.outer - 0.55 },
    { y: 36.4, h: 15.0, r: ELDER.outer - 1.1 },
    { y: 51.4, h: 14.6, r: ELDER.outer - 1.7 },
    { y: 66.6, h: 16.8, r: ELDER.outer - 2.4 },
  ];
  const n = live.quality === "low" ? 8 : 10;
  useFrame(() => {
    if (g.current) g.current.visible = elderRad(live.x, live.z) < 48 || extraY() > 6;
  });
  return (
    <group ref={g}>
      {bands.map((b, bi) =>
        Array.from({ length: n }, (_, i) => {
          const yaw = (i / n) * Math.PI * 2;
          const y0 = b.y - b.h * 0.5;
          const y1 = b.y + b.h * 0.5;
          const open = WINDOWS.some(
            (w) => y1 > w.y0 && y0 < w.y1 && Math.abs(angWrap(yaw - w.yaw)) < w.half + 0.16,
          );
          const door = y0 < 6.4 && Math.abs(angWrap(yaw - ELDER.doorYaw)) < ELDER.doorHalf + 0.12;
          if (open || door) return null;
          const at = { x: Math.sin(yaw) * b.r, z: Math.cos(yaw) * b.r };
          const w = (Math.PI * 2 * b.r) / n - 0.04;
          return (
            <mesh key={`o${bi}-${i}`} position={[at.x, b.y, at.z]} rotation={[0, yaw, 0]} castShadow>
              <boxGeometry args={[w, b.h, 0.55]} />
              {lamb(BARK, { side: THREE.DoubleSide })}
            </mesh>
          );
        }),
      )}
    </group>
  );
}

function Scar() {
  const yaw = ELDER.doorYaw;
  return (
    <group rotation={[0, yaw, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 9.4, ELDER.outer - 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42 + i * 0.22, i === 3 ? 0.035 : 0.05, 6, 12]} />
          <meshLambertMaterial color={i === 3 ? "#3a3228" : GOLD} emissive={i === 3 ? "#000000" : GOLD} emissiveIntensity={i === 3 ? 0 : 0.18} />
        </mesh>
      ))}
    </group>
  );
}

function ElderRoots() {
  const gy = heightAt(ET.x, ET.z);
  const roots = useMemo(() => {
    const out: { yaw: number; len: number; thick: number; lift: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const yaw = (i / 10) * Math.PI * 2 + 0.18;
      if (Math.abs(angWrap(yaw - ELDER.doorYaw)) < ELDER.doorHalf + 0.12) continue;
      out.push({ yaw, len: 8.4 + (i % 3) * 1.6, thick: 0.55 + (i % 2) * 0.18, lift: 0.2 });
    }
    return out;
  }, []);
  const door = offsetAt(ELDER.doorYaw, ELDER.outer + 0.4);
  return (
    <group>
      {roots.map((r, i) => {
        const at = offsetAt(r.yaw, ELDER.outer - 1.2);
        return (
          <mesh
            key={i}
            position={[at.x, gy + 0.55, at.z]}
            rotation={[0.72, r.yaw, 0.08]}
            castShadow
          >
            <cylinderGeometry args={[r.thick * 0.45, r.thick, r.len, 6]} />
            {lamb(i % 2 ? BARK_D : BARK)}
          </mesh>
        );
      })}
      <group position={[door.x, gy + 2.4, door.z]} rotation={[0, ELDER.doorYaw, 0]}>
        <mesh position={[-1.85, 0.4, 0.2]} rotation={[0.15, 0, 0.4]} castShadow>
          <cylinderGeometry args={[0.42, 0.7, 6.4, 6]} />
          {lamb(BARK_D)}
        </mesh>
        <mesh position={[1.85, 0.4, 0.2]} rotation={[0.15, 0, -0.4]} castShadow>
          <cylinderGeometry args={[0.42, 0.7, 6.4, 6]} />
          {lamb(BARK_D)}
        </mesh>
        <mesh position={[0, 3.35, 0.15]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.38, 0.48, 4.2, 6]} />
          {lamb(BARK)}
        </mesh>
      </group>
    </group>
  );
}

function angWrap(d: number) {
  let x = d;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
}

function ElderInterior() {
  const gy = heightAt(ET.x, ET.z);
  const floors: { id: string; y: number; hole: boolean; r: number }[] = [
    { id: "roots", y: FLOORS.roots, hole: false, r: ELDER.inner - 0.2 },
    { id: "hollow", y: FLOORS.hollow, hole: true, r: ELDER.inner - 0.35 },
    { id: "trunk", y: FLOORS.trunk, hole: true, r: ELDER.inner - 0.55 },
    { id: "loft", y: FLOORS.loft, hole: true, r: ELDER.inner - 0.7 },
    { id: "branch", y: FLOORS.branch, hole: true, r: ELDER.inner - 0.85 },
    { id: "canopy", y: FLOORS.canopy, hole: false, r: 9.4 },
  ];
  return (
    <group position={[ET.x, gy, ET.z]}>
      {floors.map((f) => (
        <group key={f.id} position={[0, f.y, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[f.hole ? ELDER.shaft : 0.05, f.r, 16]} />
            {lamb(f.id === "canopy" ? "#6a8a38" : f.id === "roots" ? "#3a2818" : "#5a3e24")}
          </mesh>
          {f.hole ? (
            <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[ELDER.shaft - 0.12, ELDER.shaft + 0.08, 12]} />
              {lamb("#2a1c10")}
            </mesh>
          ) : null}
        </group>
      ))}
      <InnerWalls />
    </group>
  );
}

function InnerWalls() {
  const bands = [
    { y: 6.4, h: 12.2, r: ELDER.inner - 0.08 },
    { y: 20.4, h: 14.8, r: ELDER.inner - 0.22 },
    { y: 36.2, h: 14.4, r: ELDER.inner - 0.4 },
    { y: 51.2, h: 14.2, r: ELDER.inner - 0.55 },
    { y: 66.4, h: 16.4, r: ELDER.inner - 0.7 },
  ];
  const n = live.quality === "low" ? 8 : 10;
  return (
    <group>
      {bands.map((b, bi) =>
        Array.from({ length: n }, (_, i) => {
          const yaw = (i / n) * Math.PI * 2;
          const y0 = b.y - b.h * 0.5;
          const y1 = b.y + b.h * 0.5;
          const open = WINDOWS.some(
            (w) => y1 > w.y0 && y0 < w.y1 && Math.abs(angWrap(yaw - w.yaw)) < w.half + 0.14,
          );
          const door = y0 < 6.4 && Math.abs(angWrap(yaw - ELDER.doorYaw)) < ELDER.doorHalf + 0.1;
          if (open || door) return null;
          const at = { x: Math.sin(yaw) * b.r, z: Math.cos(yaw) * b.r };
          const w = (Math.PI * 2 * b.r) / n - 0.08;
          return (
            <mesh key={`${bi}-${i}`} position={[at.x, b.y, at.z]} rotation={[0, yaw, 0]} castShadow>
              <boxGeometry args={[w, b.h, 0.42]} />
              {lamb(BARK_IN, { side: THREE.DoubleSide })}
            </mesh>
          );
        }),
      )}
    </group>
  );
}

function ElderWindows() {
  const gy = heightAt(ET.x, ET.z);
  return (
    <group>
      {WINDOWS.map((w) => {
        const at = offsetAt(w.yaw, ELDER.outer - 0.2);
        const h = w.y1 - w.y0;
        return (
          <group key={w.id} position={[at.x, gy + (w.y0 + w.y1) * 0.5, at.z]} rotation={[0, w.yaw, 0]}>
            <mesh position={[-1.55, 0, 0.05]} castShadow>
              <boxGeometry args={[0.22, h + 0.4, 0.28]} />
              {lamb(WOOD)}
            </mesh>
            <mesh position={[1.55, 0, 0.05]} castShadow>
              <boxGeometry args={[0.22, h + 0.4, 0.28]} />
              {lamb(WOOD)}
            </mesh>
            <mesh position={[0, h * 0.5 + 0.12, 0.05]} castShadow>
              <boxGeometry args={[3.3, 0.2, 0.28]} />
              {lamb(WOOD)}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function ElderBranches() {
  const gy = heightAt(ET.x, ET.z);
  return (
    <group>
      {BRANCHES.map((b) => {
        const mid = offsetAt(b.yaw, ELDER.outer + b.len * 0.42);
        const nest = b.id === "south";
        return (
          <group key={b.id}>
            <mesh
              position={[mid.x, gy + b.y + 0.35, mid.z]}
              rotation={[0.18, b.yaw, 0.08]}
              castShadow
            >
              <cylinderGeometry args={[0.42, 0.85, b.len * 0.92, 7]} />
              {lamb(BARK)}
            </mesh>
            <mesh position={[mid.x, gy + b.y, mid.z]} rotation={[-Math.PI / 2, 0, b.yaw]} receiveShadow>
              <planeGeometry args={[b.w * 1.7, b.len * 0.72]} />
              {lamb("#6a4a28")}
            </mesh>
            {nest ? (
              <mesh position={[offsetAt(b.yaw, ELDER.outer + 9.4).x, gy + b.y + 0.22, offsetAt(b.yaw, ELDER.outer + 9.4).z]}>
                <torusGeometry args={[0.7, 0.16, 6, 10]} />
                {lamb("#6a4a28")}
              </mesh>
            ) : null}
            {b.id === "east"
              ? [0.35, 0.6, 0.82].map((u, i) => {
                  const p = offsetAt(b.yaw, ELDER.outer + b.len * u);
                  return (
                    <mesh key={i} position={[p.x, gy + b.y + 1.8 + i * 0.3, p.z]} castShadow>
                      <sphereGeometry args={[1.6 - i * 0.2, 7, 5]} />
                      {lamb(i === 2 ? LEAF_NEW : LEAF_B)}
                    </mesh>
                  );
                })
              : null}
          </group>
        );
      })}
    </group>
  );
}

function ElderBells() {
  const gy = heightAt(ET.x, ET.z);
  const glow = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    if (live.house) return;
    if (extraY() > 8 || elderRad(live.x, live.z) > ELDER.inner) return;
    for (let i = 0; i < 4; i++) {
      const p = bellAt(i);
      const close = Math.hypot(live.x - p.x, live.z - p.z) < 1.5;
      const cut = Boolean(live.slash && Math.hypot(live.slash.x - p.x, live.slash.z - p.z) < 1.45);
      if (!cut && !(close && talkOk())) continue;
      const r = strikeBell(i);
      puffAt(p.x, p.z);
      sfx.hit();
      if (r === "done") {
        live.listen = "The vine dropped. One, two, three, four. The tree kept the last one.";
        sfx.ok();
      } else if (r === "reset") live.listen = "The roots went still. Start on the north one.";
      else if (r === "ok") live.listen = live.listen || "A root rang. It wants the next.";
      if (cut) live.slash = null;
      break;
    }
  });
  return (
    <group>
      {BELLS.map((b, i) => {
        const p = bellAt(i);
        return (
          <group key={i} position={[p.x, gy + FLOORS.roots + 2.6, p.z]}>
            <mesh position={[0, 1.1, 0]}>
              <cylinderGeometry args={[0.04, 0.05, 2.2, 5]} />
              {lamb("#3a2818")}
            </mesh>
            <mesh
              ref={(el) => {
                glow.current[i] = el;
              }}
              position={[0, 0, 0]}
              castShadow
            >
              <sphereGeometry args={[0.32, 7, 5]} />
              <meshLambertMaterial
                color={b.pip === 0 ? "#4a4840" : GOLD}
                emissive={b.pip === 0 ? "#2a2820" : GOLD}
                emissiveIntensity={b.pip === 0 ? 0.05 : 0.35}
              />
            </mesh>
            {b.pip > 0
              ? Array.from({ length: b.pip }, (_, k) => (
                  <mesh key={k} position={[0, -0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.12 + k * 0.07, 0.02, 5, 8]} />
                    {lamb("#3a3228")}
                  </mesh>
                ))
              : null}
          </group>
        );
      })}
    </group>
  );
}

function ElderKnots() {
  const gy = heightAt(ET.x, ET.z);
  const last = useRef(-1);
  useFrame(() => {
    if (live.house) return;
    if (Math.abs(extraY() - FLOORS.hollow) > 2.2) return;
    if (elderRad(live.x, live.z) > ELDER.inner) return;
    for (let i = 0; i < 4; i++) {
      const p = knotAt(i);
      if (Math.hypot(live.x - p.x, live.z - p.z) > 1.15) continue;
      if (last.current === i) return;
      last.current = i;
      const r = pushKnot(i);
      if (r === "done") {
        live.listen = "The knots sat down. A ladder of living wood found the next floor.";
        sfx.ok();
      } else if (r === "reset") live.listen = "The knots forgot you. North first. Then the sun. Then south. Then the blank.";
      else if (r === "ok") live.listen = live.listen || "A knot took your weight.";
      return;
    }
    last.current = -1;
  });
  return (
    <group>
      {BELLS.map((b, i) => {
        const p = knotAt(i);
        return (
          <mesh key={i} position={[p.x, gy + FLOORS.hollow + 0.06, p.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[0.85, 10]} />
            <meshLambertMaterial
              color={b.pip === 0 ? "#3a3228" : "#7a5a28"}
              emissive={b.pip === 0 ? "#000000" : GOLD}
              emissiveIntensity={b.pip === 0 ? 0 : 0.12}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function ElderLaddersViz() {
  const gy = heightAt(ET.x, ET.z);
  const rungs = (yaw: number, r: number, y0: number, y1: number, show: boolean, key: string) => {
    if (!show) return null;
    const n = Math.max(4, Math.round((y1 - y0) / 1.15));
    const at = offsetAt(yaw, r);
    return (
      <group key={key} position={[at.x, gy, at.z]} rotation={[0, yaw + Math.PI, 0]}>
        {[-0.22, 0.22].map((s) => (
          <mesh key={s} position={[s, (y0 + y1) * 0.5, 0.08]}>
            <boxGeometry args={[0.07, y1 - y0, 0.07]} />
            {lamb("#4a3220")}
          </mesh>
        ))}
        {Array.from({ length: n }, (_, i) => (
          <mesh key={i} position={[0, y0 + ((i + 0.5) / n) * (y1 - y0), 0.08]}>
            <boxGeometry args={[0.52, 0.07, 0.1]} />
            {lamb(WOOD)}
          </mesh>
        ))}
      </group>
    );
  };
  const vine = offsetAt(1.92, ELDER.outer + 2.2);
  return (
    <group>
      {rungs(ELDER.doorYaw + Math.PI, 7.6, FLOORS.roots + 0.4, FLOORS.hollow, bellsOpen(), "h")}
      {rungs(ELDER.doorYaw + 1.15, 7.4, FLOORS.hollow + 0.3, FLOORS.trunk, knotsOpen(), "t")}
      {rungs(ELDER.doorYaw - 1.05, 7.2, FLOORS.trunk + 0.3, FLOORS.loft, true, "l")}
      {rungs(ELDER.doorYaw + Math.PI * 0.55, 7.0, FLOORS.loft + 0.3, FLOORS.branch, true, "b")}
      <mesh position={[vine.x, gy + (FLOORS.branch + FLOORS.canopy) * 0.5, vine.z]} castShadow>
        <cylinderGeometry args={[0.09, 0.14, FLOORS.canopy - FLOORS.branch, 6]} />
        {lamb("#3a5a28")}
      </mesh>
    </group>
  );
}

function ChestMesh({
  x,
  z,
  y,
  open,
  gold,
}: {
  x: number;
  z: number;
  y: number;
  open: boolean;
  gold?: boolean;
}) {
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.86, 0.46, 0.58]} />
        {lamb(open ? "#4a3220" : gold ? "#9a642c" : "#7a4e22")}
      </mesh>
      <mesh position={[0, 0.48, -0.05]} rotation={[open ? -1.4 : 0, 0, 0]} castShadow>
        <boxGeometry args={[0.86, 0.2, 0.58]} />
        {lamb("#9a642c")}
      </mesh>
    </group>
  );
}

function ElderChests() {
  const gy = heightAt(ET.x, ET.z);
  const roots = chestAt("roots");
  const hollow = chestAt("hollow");
  const nest = chestAt("nest");
  const rOpen = useRef(isChestOpen("elder-rupees"));
  const hOpen = useRef(isChestOpen("elder-hollow"));
  const nOpen = useRef(isChestOpen("elder-nest"));
  useFrame(() => {
    if (live.house) return;
    const tryChest = (id: string, p: { x: number; z: number }, yNeed: number, take: () => void, flag: { current: boolean }) => {
      if (flag.current) return;
      if (Math.abs(extraY() - yNeed) > 2.6) return;
      if (Math.hypot(live.x - p.x, live.z - p.z) > 1.55) return;
      if (!talkOk() && !live.slash) return;
      flag.current = true;
      markChestOpen(id);
      take();
      sfx.get();
    };
    tryChest(
      "elder-rupees",
      roots,
      FLOORS.roots,
      () => {
        pay(20, "elder-rupees");
        live.listen = "The roots had been saving. Twenty. They do not count past that out loud.";
      },
      rOpen,
    );
    tryChest(
      "elder-hollow",
      hollow,
      FLOORS.hollow,
      () => {
        pay(12, "elder-hollow");
        useGame.getState().healGrass();
        live.listen = "A heart-shaped seed. It went into you, not the pack.";
      },
      hOpen,
    );
    tryChest(
      "elder-nest",
      nest,
      FLOORS.branch + 1.4,
      () => {
        pay(8, "elder-nest");
        live.listen = "A nest that kept coins instead of eggs. The vale is a long way down.";
      },
      nOpen,
    );
  });
  return (
    <group>
      <ChestMesh x={roots.x} z={roots.z} y={gy + FLOORS.roots} open={rOpen.current} />
      <ChestMesh x={hollow.x} z={hollow.z} y={gy + FLOORS.hollow} open={hOpen.current} />
      <ChestMesh x={nest.x} z={nest.z} y={gy + FLOORS.branch + 1.4} open={nOpen.current} />
    </group>
  );
}

function ElderCrown() {
  const gy = heightAt(ET.x, ET.z);
  const p = chestAt("crown");
  const got = useRef(isChestOpen("elder-crown") || (useGame.getState().heartsFrom ?? []).includes("elder-crown"));
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ring.current) {
      ring.current.rotation.z = clock.elapsedTime * 0.35;
      const mat = ring.current.material as THREE.MeshLambertMaterial;
      mat.emissiveIntensity = 0.45 + Math.sin(clock.elapsedTime * 2.2) * 0.25;
    }
    if (got.current || live.house) return;
    if (Math.abs(extraY() - FLOORS.canopy) > 3.2) return;
    if (Math.hypot(live.x - p.x, live.z - p.z) > 1.8) return;
    if (!talkOk() && live.stillT < 0.35) return;
    got.current = true;
    markChestOpen("elder-crown");
    const g = useGame.getState();
    if (g.grantHeartContainer("elder-crown")) revealItem("container");
    takeCipher("elder-ring", true);
    g.setQuest("elder", 1);
    live.listen = "The fourth ring is still growing. The vale was told to stop. The tree did not.";
    sfx.get();
  });
  return (
    <group>
      <mesh ref={ring} position={[ET.x, gy + FLOORS.canopy + 1.55, ET.z]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.15, 0.08, 8, 18]} />
        <meshLambertMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.6} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[ET.x, gy + FLOORS.canopy + 1.55, ET.z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7 + i * 0.18, 0.035, 6, 14]} />
          {lamb("#8a6a28")}
        </mesh>
      ))}
      {got.current ? null : (
        <group position={[p.x, gy + FLOORS.canopy + 0.45, p.z]} scale={1.15}>
          <HeartContainerMesh />
        </group>
      )}
      {live.night && extraY() > 50 ? (
        <pointLight position={[ET.x, gy + FLOORS.canopy + 2.4, ET.z]} intensity={4.2} distance={28} color="#f4c070" />
      ) : null}
    </group>
  );
}

function ElderFoes() {
  const spots = useMemo(
    () => [
      { id: "elder-e0", ...offsetAt(3.1, 4.8), y: FLOORS.roots, seed: 17 },
      { id: "elder-e1", ...offsetAt(0.4, 5.2), y: FLOORS.hollow, seed: 23 },
      { id: "elder-e2", ...offsetAt(1.92, ELDER.outer + 8.4), y: FLOORS.branch, seed: 29 },
    ],
    [],
  );
  return (
    <group>
      {spots.map((s) => (
        <ElderBody key={s.id} id={s.id} ox={s.x} oz={s.z} yOff={s.y} seed={s.seed} />
      ))}
    </group>
  );
}

function ElderBody({
  id,
  ox,
  oz,
  yOff,
  seed,
}: {
  id: string;
  ox: number;
  oz: number;
  yOff: number;
  seed: number;
}) {
  const g = useRef<THREE.Group>(null);
  const pos = useRef({ x: ox, z: oz });
  const yaw = useRef(0);
  const pose = useRef<FangPose>("walk");
  const hp = useRef(3);
  const swipeAt = useRef(-9);
  const [show, setShow] = useState(true);
  useFrame((_, dt) => {
    if (!g.current) return;
    if (hp.current <= 0) {
      g.current.visible = false;
      delete live.foeTrack[id];
      return;
    }
    const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
    const nearY = Math.abs(extraY() - yOff) < 6.5;
    g.current.visible = d < 70 && nearY && !live.house;
    if (!g.current.visible) {
      delete live.foeTrack[id];
      return;
    }
    if (d < 16) live.aggroIds.add(id);
    else live.aggroIds.delete(id);
    const hitAgo = live.playT - (live.foeHitT[id] ?? -9);
    if (d < 14 && d > 1.2 && nearY) {
      pos.current.x += ((live.x - pos.current.x) / d) * 2.5 * dt;
      pos.current.z += ((live.z - pos.current.z) / d) * 2.5 * dt;
      yaw.current = Math.atan2(-(live.x - pos.current.x), -(live.z - pos.current.z));
      pose.current = d < 4 ? "chase" : "walk";
    }
    if (live.slash && Math.hypot(live.slash.x - pos.current.x, live.slash.z - pos.current.z) < (live.slash.r ?? 1.2)) {
      if (hitAgo > 0.35) {
        hp.current -= live.spinning || live.jumpAtk ? 2 : 1;
        live.foeHitT[id] = live.playT;
        puffAt(pos.current.x, pos.current.z);
        sfx.hit();
        if (hp.current <= 0) {
          useGame.getState().addCoins(5);
          live.hint = "It fell through the wood. Something else is still counting.";
          live.aggroIds.delete(id);
          delete live.foeTrack[id];
          if (live.lock?.id === id) live.lock = null;
          sfx.ok();
          setShow(false);
          return;
        }
      }
    }
    if (d < 1.28 && nearY && !live.god && live.heroFlash < 0.22 && hitAgo > 0.2 && live.playT - swipeAt.current > 0.95) {
      swipeAt.current = live.playT;
      pose.current = "swipe";
      if (live.shieldUp && useGame.getState().hasShield) sfx.block();
      else {
        useGame.getState().hurtField(2);
        live.knock = { vx: ((live.x - pos.current.x) / (d || 1)) * 8.2, vz: ((live.z - pos.current.z) / (d || 1)) * 8.2, t: 0.2 };
      }
    }
    if (live.playT - swipeAt.current < 0.35) pose.current = "swipe";
    live.foeTrack[id] = { x: pos.current.x, z: pos.current.z };
    const gy = heightAt(pos.current.x, pos.current.z);
    g.current.position.set(pos.current.x, gy + yOff, pos.current.z);
    g.current.rotation.y = yaw.current;
  });
  if (!show) return null;
  return (
    <group ref={g} visible={false}>
      <N64Foe kind="plusling" seed={seed} pose="walk" poseRef={pose} world="grove" />
    </group>
  );
}

function ElderSign() {
  const p = offsetAt(ELDER.doorYaw, ELDER.outer + 6.4);
  useFrame(() => {
    if (live.house) return;
    if (Math.hypot(live.x - p.x, live.z - p.z) < 2.6)
      live.listen = live.listen || "Elderfour. Four crowns. The south mouth is a door. The windows are real.";
  });
  return <N64Sign x={p.x} z={p.z} />;
}

function ElderListen() {
  const last = useRef("");
  useFrame(() => {
    if (live.house || live.below) return;
    const r = elderRad(live.x, live.z);
    if (r > 36) return;
    const extra = extraY();
    const floor = elderFloorName(extra);
    if (r < ELDER.outer + 1.5 && extra < 3 && r > ELDER.outer - 2 && Math.abs(angWrap(Math.atan2(live.x - ET.x, live.z - ET.z) - ELDER.doorYaw)) < ELDER.doorHalf + 0.1) {
      if (last.current !== "door") {
        last.current = "door";
        live.listen = live.listen || "A mouth of living wood. The vale is behind you. The tree is not.";
      }
    }
    if (floor === "hollow" && extra > 11) {
      live.listen = live.listen || "A window. Oakstead is a toy from here. You can still see the well.";
    }
    if (floor === "trunk") {
      live.listen = live.listen || "The trunk keeps a stair of air. The hole in the middle is a way down.";
    }
    if (floor === "branch") {
      live.listen = live.listen || "A branch that is a road. The vale is under your feet. Do not look if you do not want to.";
    }
    if (floor === "canopy") {
      live.listen = live.listen || "Four crowns. The new one is still growing. The whole region fits in one look.";
    }
    if (r < ELDER.inner && extra < 8 && !bellsOpen()) {
      live.listen = live.listen || "Four roots hang. One is blank. They want an order.";
    }
  });
  return null;
}
