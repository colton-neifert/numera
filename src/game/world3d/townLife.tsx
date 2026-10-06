import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, SRGBColorSpace } from "three";
import type * as THREE from "three";
import { heightAt, VX, VZ, WELL_AT, POND, vWorld } from "./field";
import { FIRE_PIT, FOUNTAIN } from "./village";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { consumeTalk as consumeTalkRaw, moveAxes } from "../input";
import { lamb } from "./mats";
import { LushRiver } from "./lush/water";
import { TOWN_DRAIN } from "./lush/waterRuns";

export const SMITH_AT = { x: 40, z: -52 };
export const FARM_AT = { x: 50, z: -98 };
export const MANOR_AT = { x: -48, z: -124 };
export const BOARD_AT = { x: VX + 3.4, z: VZ + 4.8 };
export const FARM_CROW = { x: FARM_AT.x + 6.4, z: FARM_AT.z + 3.2 };

export function TownLife() {
  return (
    <group>
      <Creek />
      <ForgeYard />
      <FarmYard />
      <Chickens />
      <FarmPig />
      <NoticeBoard />
      <WaySigns />
      <BoardedManor />
      <LostBasket />
      <FourthSack />
      <MillBoards />
    </group>
  );
}

const TALLY = { x: POND.x - POND.r - 2.4, z: POND.z + 3.6 };

export function PondLife() {
  return (
    <group>
      <TallyBoard />
      <PondDucks />
    </group>
  );
}

function TallyBoard() {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const q = useGame.getState().quests?.["finn-tally"] ?? 0;
    if (g.current) g.current.visible = q < 1;
    if (q >= 1 || live.house) return;
    if (Math.hypot(live.x - TALLY.x, live.z - TALLY.z) < 1.4) {
      useGame.getState().setQuest("finn-tally", 1);
      live.listen = "Finn's tally board. The marks are in threes.";
      sfx.pick();
    }
  });
  const y = heightAt(TALLY.x, TALLY.z);
  return (
    <group ref={g} position={[TALLY.x, y, TALLY.z]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.08, 0.7, 0.42]} />
        {lamb("#c4a06a", { kind: "wood" })}
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0.05, 0.48 - i * 0.14, -0.1]}>
          <boxGeometry args={[0.02, 0.1, 0.016]} />
          {lamb("#2a2018")}
        </mesh>
      ))}
      <mesh position={[0.2, 0.55, 0.15]} rotation={[0.3, 0, 0.4]} castShadow>
        <coneGeometry args={[0.16, 0.55, 5]} />
        {lamb("#3d7a40", { kind: "leaf" })}
      </mesh>
      <mesh position={[-0.15, 0.4, -0.2]} rotation={[-0.2, 0.4, -0.3]} castShadow>
        <coneGeometry args={[0.12, 0.42, 5]} />
        {lamb("#2f6a34", { kind: "leaf" })}
      </mesh>
    </group>
  );
}

function PondDucks() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const state = useRef([
    { a: 0.4, fly: 0 },
    { a: 2.4, fly: 0 },
    { a: 4.3, fly: 0 },
  ]);
  useFrame((_, dt) => {
    const shore = POND.r + 1.15;
    state.current.forEach((d, i) => {
      const g = refs.current[i];
      if (!g) return;
      d.a += dt * (0.28 + i * 0.05);
      const x = POND.x + Math.cos(d.a) * shore;
      const z = POND.z + Math.sin(d.a) * shore * 0.78;
      const dist = Math.hypot(live.x - x, live.z - z);
      if (dist < 3.4 && Math.abs(live.speed) > 1.5) d.fly = 1.5;
      d.fly = Math.max(0, d.fly - dt);
      const hop = d.fly > 0 ? 1.7 + Math.sin(live.playT * 16 + i) * 0.2 : 0.12;
      g.position.set(x, heightAt(x, z) + hop, z);
      g.rotation.y = -d.a;
      const wing = g.getObjectByName("wing");
      if (wing) wing.rotation.z = d.fly > 0 ? Math.sin(live.playT * 22 + i) * 0.9 : 0.2;
    });
  });
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <mesh castShadow>
            <sphereGeometry args={[0.16, 8, 6]} />
            {lamb("#f4f1e8", { kind: "cloth" })}
          </mesh>
          <mesh position={[0, 0.08, -0.14]} castShadow>
            <sphereGeometry args={[0.08, 7, 6]} />
            {lamb("#2a6a48", { kind: "cloth" })}
          </mesh>
          <mesh position={[0, 0.06, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.03, 0.08, 5]} />
            {lamb("#e0a030")}
          </mesh>
          <group name="wing" position={[0, 0.04, 0]}>
            <mesh position={[0.16, 0, 0]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.22, 0.025, 0.1]} />
              {lamb("#d8d4c8", { kind: "cloth" })}
            </mesh>
            <mesh position={[-0.16, 0, 0]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.22, 0.025, 0.1]} />
              {lamb("#d8d4c8", { kind: "cloth" })}
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

function LostBasket() {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const q = useGame.getState().quests?.["nora-basket"] ?? 0;
    if (g.current) g.current.visible = q < 1;
    if (q >= 1 || live.house) return;
    if (Math.hypot(live.x + 22, live.z + 104) < 1.35) {
      useGame.getState().setQuest("nora-basket", 1);
      live.listen = "A bread basket. Nora’s. Still warm in the middle.";
      sfx.pick();
    }
  });
  const x = -22;
  const z = -104;
  const y = heightAt(x, z);
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.22, 8]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 6]} />
        {lamb("#c9a24a", { kind: "cloth" })}
      </mesh>
      <mesh position={[0, 0.42, 0.02]} rotation={[0.4, 0.2, 0]}>
        <boxGeometry args={[0.16, 0.06, 0.1]} />
        {lamb("#e8d8c0", { kind: "cloth" })}
      </mesh>
      <mesh position={[0.22, 0.28, 0]} rotation={[0, 0, 0.6]}>
        <torusGeometry args={[0.1, 0.018, 4, 8]} />
        {lamb("#5a3a22", { kind: "wood" })}
      </mesh>
    </group>
  );
}

const SACK_PAD = { x: FARM_AT.x + 0.9, z: FARM_AT.z + 4.7 };
const SACK_START = { x: FARM_AT.x - 6.8, z: FARM_AT.z + 8.2 };
const looseSack = { x: SACK_START.x, z: SACK_START.z, done: false };

function GrainSack() {
  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow>
        <sphereGeometry args={[0.32, 8, 6]} />
        {lamb("#c4a060", { kind: "cloth" })}
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[0.2, 0.4, 0]}>
        <torusGeometry args={[0.1, 0.02, 4, 8]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
    </group>
  );
}

function FourthSack() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const saved = (useGame.getState().quests?.["holt-four"] ?? 0) >= 1;
    if (saved && !looseSack.done) {
      looseSack.x = SACK_PAD.x;
      looseSack.z = SACK_PAD.z;
      looseSack.done = true;
    }
    if (!looseSack.done && !live.house) {
      const d = Math.hypot(live.x - looseSack.x, live.z - looseSack.z);
      if (d < 1.2 && Math.abs(live.speed) > 1.6) {
        looseSack.x += -Math.sin(live.yaw) * 3.2 * dt;
        looseSack.z += -Math.cos(live.yaw) * 3.2 * dt;
        const dx = looseSack.x - FARM_AT.x;
        const dz = looseSack.z - FARM_AT.z;
        const dd = Math.hypot(dx, dz) || 1;
        if (dd > 12) {
          looseSack.x = FARM_AT.x + (dx / dd) * 12;
          looseSack.z = FARM_AT.z + (dz / dd) * 12;
        }
      }
      if (Math.hypot(looseSack.x - SACK_PAD.x, looseSack.z - SACK_PAD.z) < 1.05) {
        looseSack.x = SACK_PAD.x;
        looseSack.z = SACK_PAD.z;
        looseSack.done = true;
        if (!saved) useGame.getState().setQuest("holt-four", 1);
        sfx.ok();
        live.listen = "Four. The row is even. Cobb can stop calling the gap a fifth.";
      }
    }
    if (ref.current) {
      ref.current.position.set(looseSack.x, heightAt(looseSack.x, looseSack.z), looseSack.z);
    }
  });
  const py = heightAt(SACK_PAD.x, SACK_PAD.z);
  return (
    <group>
      <mesh position={[SACK_PAD.x, py + 0.03, SACK_PAD.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.72, 12]} />
        {lamb("#d9d0bc", { kind: "stone" })}
      </mesh>
      {[1.45, 2.85, 4.25].map((dx) => {
        const x = SACK_PAD.x + dx;
        const z = SACK_PAD.z;
        return (
          <group key={dx} position={[x, heightAt(x, z), z]}>
            <GrainSack />
          </group>
        );
      })}
      <group ref={ref} position={[SACK_START.x, heightAt(SACK_START.x, SACK_START.z), SACK_START.z]}>
        <GrainSack />
      </group>
    </group>
  );
}

function MillBoards() {
  const mill = vWorld(2, -116);
  const boards = useMemo(
    () =>
      [0, 1, 2, 3].map((i) => ({
        x: mill.x - 1.15,
        z: mill.z - 5.5 - i * 1.5,
      })),
    [mill.x, mill.z],
  );
  const [up, setUp] = useState([false, false, false, false]);
  const latch = useRef(false);
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) {
      latch.current = false;
      return;
    }
    let best = -1;
    let bestD = 1.4;
    boards.forEach((b, i) => {
      const d = Math.hypot(live.x - b.x, live.z - b.z);
      if (d < bestD) {
        best = i;
        bestD = d;
      }
    });
    if (best < 0) {
      latch.current = false;
      return;
    }
    if (!up[best] && !live.listen) live.hint = "Loose boards behind the mill.";
    const struck =
      Boolean(live.slash) &&
      Math.hypot(live.slash!.x - boards[best].x, live.slash!.z - boards[best].z) < 1.7;
    const want = consumeTalkRaw() || struck;
    if (!want) {
      latch.current = false;
      return;
    }
    if (latch.current || up[best]) return;
    latch.current = true;
    const next = up.slice();
    next[best] = true;
    setUp(next);
    if (best === boards.length - 1) {
      if ((useGame.getState().quests?.["mill-board"] ?? 0) < 1) {
        useGame.getState().setQuest("mill-board", 1);
        useGame.getState().addCoins(15);
        revealItem("coin");
      }
      sfx.ok();
      live.listen = "The last board. A purse was under it. Fifteen coins. The name is worn off.";
    } else {
      sfx.select();
      live.listen = "Not the last. The row keeps going.";
    }
  });
  return (
    <group>
      {boards.map((b, i) => (
        <group key={i} position={[b.x, heightAt(b.x, b.z), b.z]} rotation={[up[i] ? -1.15 : 0.12, 0.15, 0]}>
          <mesh position={[0, 0.06, 0]} castShadow>
            <boxGeometry args={[1.05, 0.08, 0.46]} />
            {lamb(i === 3 ? "#7a5a30" : "#6a4a28", { kind: "wood" })}
          </mesh>
        </group>
      ))}
      {up[3] ? (
        <mesh position={[boards[3].x, heightAt(boards[3].x, boards[3].z) + 0.08, boards[3].z]} castShadow>
          <boxGeometry args={[0.28, 0.1, 0.16]} />
          {lamb("#c9a227", { kind: "metal" })}
        </mesh>
      ) : null}
    </group>
  );
}

function Creek() {
  return <LushRiver pts={TOWN_DRAIN} w={1.7} lift={0.12} />;
}

function ForgeYard() {
  const x = SMITH_AT.x + 0.4;
  const z = SMITH_AT.z + 7.2;
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[2.4, 0.42, 1.6]} castShadow>
        <boxGeometry args={[1.15, 0.72, 0.85]} />
        {lamb("#4a4640", { kind: "stone" })}
      </mesh>
      <mesh position={[2.4, 0.92, 1.6]}>
        <boxGeometry args={[0.55, 0.22, 0.55]} />
        {lamb("#2a2824", { kind: "metal" })}
      </mesh>
      <pointLight position={[2.4, 1.15, 1.6]} intensity={4.5} color="#ff8020" distance={5} />
      <mesh position={[-1.8, 0.28, 2.4]} rotation={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.85, 0.22, 0.55]} />
        {lamb("#3a3834", { kind: "metal" })}
      </mesh>
      <mesh position={[-1.8, 0.55, 2.4]} rotation={[0.15, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.28, 8]} />
        {lamb("#5a5854", { kind: "metal" })}
      </mesh>
      {[-2.4, -1.6, 3.1].map((bx, i) => (
        <mesh key={i} position={[bx, 0.38, 3.2 + (i % 2) * 0.4]} castShadow>
          <cylinderGeometry args={[0.28, 0.32, 0.72, 8]} />
          {lamb(i % 2 ? "#6a4a28" : "#5a3a20", { kind: "wood" })}
        </mesh>
      ))}
      <mesh position={[0.2, 0.08, 3.6]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow>
        <circleGeometry args={[2.2, 12]} />
        {lamb("#6a5a48", { kind: "dirt" })}
      </mesh>
      <mesh position={[3.6, 1.05, -1.2]} castShadow>
        <boxGeometry args={[0.55, 2.1, 0.55]} />
        {lamb("#4a4640", { kind: "stone" })}
      </mesh>
      <mesh position={[3.6, 2.25, -1.2]}>
        <boxGeometry args={[0.72, 0.22, 0.72]} />
        {lamb("#3a3834", { kind: "metal" })}
      </mesh>
    </group>
  );
}

function FarmYard() {
  const { x, z } = FARM_AT;
  const y = heightAt(x, z);
  const rows = useMemo(() => {
    const list: { x: number; z: number; h: number; c: string }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 7; c++) {
        list.push({
          x: 3.4 + c * 0.85,
          z: -1.2 + r * 1.05,
          h: 0.32 + ((r + c) % 3) * 0.08,
          c: (r + c) % 2 ? "#3d8a38" : "#6aaa40",
        });
      }
    }
    return list;
  }, []);
  return (
    <group position={[x, y, z]}>
      <mesh position={[6.2, 0.04, 1.2]} rotation={[-Math.PI / 2, 0, 0.08]} receiveShadow>
        <planeGeometry args={[8.4, 6.2]} />
        {lamb("#8a6a38", { kind: "dirt" })}
      </mesh>
      {rows.map((p, i) => (
        <mesh key={i} position={[p.x, p.h * 0.5, p.z]} castShadow>
          <coneGeometry args={[0.08, p.h, 4]} />
          {lamb(p.c, { kind: "leaf" })}
        </mesh>
      ))}
      <group position={[6.4, 0, 3.2]}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 1.7, 6]} />
          {lamb("#6a4a28", { kind: "wood" })}
        </mesh>
        <mesh position={[0, 1.55, 0]} castShadow>
          <sphereGeometry args={[0.16, 8, 6]} />
          {lamb("#c4a06a", { kind: "cloth" })}
        </mesh>
        <mesh position={[0, 1.22, 0]} castShadow>
          <boxGeometry args={[0.72, 0.08, 0.12]} />
          {lamb("#8a3a28", { kind: "cloth" })}
        </mesh>
        <mesh position={[-0.08, 1.58, 0.12]}>
          <sphereGeometry args={[0.025, 6, 5]} />
          {lamb("#1a1410")}
        </mesh>
        <mesh position={[0.08, 1.58, 0.12]}>
          <sphereGeometry args={[0.025, 6, 5]} />
          {lamb("#1a1410")}
        </mesh>
      </group>
      {[-1.2, 1.4, 3.8].map((hx, i) => (
        <mesh key={i} position={[hx, 0.55, -3.4]} castShadow>
          <sphereGeometry args={[0.55, 8, 6]} />
          {lamb("#c9a227", { kind: "grass" })}
        </mesh>
      ))}
      <ScarecrowHit />
    </group>
  );
}

function ScarecrowHit() {
  const hit = useRef(false);
  useFrame(() => {
    if (hit.current || !live.slash) return;
    const dx = live.slash.x - FARM_CROW.x;
    const dz = live.slash.z - FARM_CROW.z;
    if (dx * dx + dz * dz < 2.2 * 2.2) {
      hit.current = true;
      const g = useGame.getState();
      if ((g.quests?.["bramble-crow"] ?? 0) < 1) {
        g.setQuest("bramble-crow", 1);
        live.listen = "The crows scatter. Bramble will want to hear that.";
        sfx.ok();
      }
    }
  });
  return null;
}

function Chickens() {
  const bits = useRef(
    Array.from({ length: 5 }, (_, i) => ({
      x: FARM_AT.x + 2 + (i % 3) * 1.4,
      z: FARM_AT.z + 4.5 + Math.floor(i / 3) * 1.6,
      a: i * 1.3,
      yaw: i,
      hop: 0,
      hits: 0,
      peck: 0,
    })),
  );
  useFrame((_, dt) => {
    const g = bits.current;
    const angry = live.cuccoRage > 0;
    for (const c of g) {
      const id = `farm${g.indexOf(c)}`;
      c.a += dt * (angry ? 4.2 : 0.8 + (c.x % 1));
      if (live.carry === "cucco" && live.carryId === id) {
        if (live.henToss) {
          c.x = live.x - Math.sin(live.yaw) * 2.2;
          c.z = live.z - Math.cos(live.yaw) * 2.2;
          c.hop = 0.7;
          live.carry = null;
          live.carryId = null;
          live.henToss = 0;
          sfx.crow();
        } else {
          c.x = live.x;
          c.z = live.z;
        }
        live.chickens[id] = { x: c.x, z: c.z, r: 0.55 };
        continue;
      }
      const pd = Math.hypot(live.x - c.x, live.z - c.z);
      if (pd < 1.2 && !live.carry && !live.mounted && !live.house) {
        live.nearPet = "cucco";
        live.nearPetId = id;
      } else if (live.nearPetId === id) {
        live.nearPet = null;
        live.nearPetId = null;
      }
      live.chickens[id] = { x: c.x, z: c.z, r: 0.55 };
      if (angry) {
        const homeD = Math.hypot(c.x - (FARM_AT.x + 4), c.z - (FARM_AT.z + 3));
        if (homeD > 28) {
          c.x = FARM_AT.x + 4;
          c.z = FARM_AT.z + 3;
        }
        const dx = live.x - c.x;
        const dz = live.z - c.z;
        const d = pd || 1;
        if (pd < 22) {
          c.x += (dx / d) * 5.8 * dt;
          c.z += (dz / d) * 5.8 * dt;
          c.yaw = Math.atan2(dx, dz);
          c.hop = 0.22 + Math.abs(Math.sin(c.a * 8)) * 0.18;
          c.peck = Math.max(0, c.peck - dt);
          if (d < 1.05 && c.peck <= 0) {
            c.peck = 0.45;
            useGame.getState().hurtField(3, true);
            sfx.crow();
          }
        }
      } else if (live.blast && Math.hypot(live.blast.x - c.x, live.blast.z - c.z) < 8) {
        const dx = c.x - live.blast.x;
        const dz = c.z - live.blast.z;
        const d = Math.hypot(dx, dz) || 1;
        c.x += (dx / d) * 7 * dt;
        c.z += (dz / d) * 7 * dt;
        c.yaw = Math.atan2(-dx, -dz);
        c.hop = 0.4;
        if (!live.listen) live.listen = "The hens have opinions.";
      } else if (pd < 2.4 && Math.abs(live.speed) > 3.2) {
        const dx = c.x - live.x;
        const dz = c.z - live.z;
        const d = pd || 1;
        c.x += (dx / d) * 4.6 * dt;
        c.z += (dz / d) * 4.6 * dt;
        c.yaw = Math.atan2(-dx, -dz);
        c.hop = 0.2;
        if (pd < 1.5) live.listen = live.listen || "The chickens ran.";
      } else if (Math.sin(c.a) > 0.92) {
        c.yaw += (Math.random() - 0.5) * 0.8;
        c.x += Math.sin(c.yaw) * dt * 1.4;
        c.z += Math.cos(c.yaw) * dt * 1.4;
      }
      const dx = c.x - FARM_AT.x - 4;
      const dz = c.z - FARM_AT.z - 3;
      if (!angry && dx * dx + dz * dz > 36) {
        c.yaw += 2.4;
        c.x = FARM_AT.x + 4 + Math.sin(c.yaw) * 4;
        c.z = FARM_AT.z + 3 + Math.cos(c.yaw) * 4;
      }
      if (live.slash && Math.hypot(live.slash.x - c.x, live.slash.z - c.z) < 1.4) {
        c.hop = 0.55;
        c.yaw += 2;
        c.hits += 1;
        sfx.rustle();
        if (c.hits >= 2) {
          live.cuccoRage = Math.max(live.cuccoRage, 10);
          live.hint = "The chickens are furious!";
          sfx.crow();
        }
      }
      c.hop *= Math.exp(-dt * 6);
    }
  });
  const mesh = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!mesh.current) return;
    mesh.current.children.forEach((ch, i) => {
      const id = `farm${i}`;
      const c = bits.current[i];
      ch.visible = !(live.carry === "cucco" && live.carryId === id);
      if (!c) return;
      ch.position.set(c.x, heightAt(c.x, c.z) + 0.16 + c.hop, c.z);
      ch.rotation.y = c.yaw;
    });
  });
  return (
    <group ref={mesh}>
      {bits.current.map((_, i) => (
        <group key={i}>
          <mesh position={[0, 0.08, 0]} castShadow>
            <sphereGeometry args={[0.14, 8, 6]} />
            {lamb("#efe6d4")}
          </mesh>
          <mesh position={[0, 0.16, 0.12]} castShadow>
            <sphereGeometry args={[0.08, 7, 5]} />
            {lamb("#efe6d4")}
          </mesh>
          <mesh position={[0, 0.16, 0.2]}>
            <coneGeometry args={[0.025, 0.08, 4]} />
            {lamb("#e07a28")}
          </mesh>
          <mesh position={[0, 0.22, -0.04]} rotation={[0.4, 0, 0]}>
            <coneGeometry args={[0.08, 0.12, 5]} />
            {lamb("#c45c48")}
          </mesh>
        </group>
      ))}
    </group>
  );
}

function FarmPig() {
  const p = useRef({ x: FARM_AT.x - 1.4, z: FARM_AT.z + 6.2, a: 0, yaw: 0.4, vx: 0, vz: 0 });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const c = p.current;
    if (live.pigRide > 0) {
      c.yaw += moveAxes().steer * 1.8 * dt;
      c.vx += -Math.sin(c.yaw) * 22 * dt;
      c.vz += -Math.cos(c.yaw) * 22 * dt;
      c.vx *= Math.exp(-dt * 1.8);
      c.vz *= Math.exp(-dt * 1.8);
      c.x += c.vx * dt;
      c.z += c.vz * dt;
      live.pigX = c.x;
      live.pigZ = c.z;
      live.pigYaw = c.yaw;
    } else {
      c.a += dt * 0.55;
      if (Math.sin(c.a) > 0.7) {
        c.yaw += (Math.random() - 0.5) * 0.4;
        c.x += Math.sin(c.yaw) * dt * 0.7;
        c.z += Math.cos(c.yaw) * dt * 0.7;
      }
      const dx = c.x - FARM_AT.x;
      const dz = c.z - (FARM_AT.z + 5);
      if (dx * dx + dz * dz > 22) {
        c.yaw += 1.8;
        c.x = FARM_AT.x + Math.sin(c.yaw) * 2.4;
        c.z = FARM_AT.z + 5 + Math.cos(c.yaw) * 2.4;
      }
      const d = Math.hypot(live.x - c.x, live.z - c.z);
      if (d < 2.2 && Math.abs(live.speed) > 4) {
        c.x += ((c.x - live.x) / (d || 1)) * 3.2 * dt;
        c.z += ((c.z - live.z) / (d || 1)) * 3.2 * dt;
      }
      if (d < 1.35 && !live.house && !live.mounted) {
        live.listen = live.listen || "The pig. Jump on, or talk.";
        if (consumeTalkRaw() || live.y > heightAt(c.x, c.z) + 0.9) {
          live.pigRide = 8.5;
          live.pigX = c.x;
          live.pigZ = c.z;
          live.pigYaw = live.yaw;
          c.yaw = live.yaw;
          sfx.ok();
          live.listen = "You're on a pig. Jump to hop off.";
        }
      }
    }
    if (g.current) {
      g.current.position.set(c.x, heightAt(c.x, c.z) + 0.22 + (live.pigRide > 0 ? 0.08 : 0), c.z);
      g.current.rotation.y = c.yaw;
    }
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <sphereGeometry args={[0.22, 8, 6]} />
        {lamb("#e8a090")}
      </mesh>
      <mesh position={[0, 0.12, 0.22]} castShadow>
        <sphereGeometry args={[0.12, 7, 5]} />
        {lamb("#e8a090")}
      </mesh>
      <mesh position={[0, 0.1, 0.34]}>
        <cylinderGeometry args={[0.04, 0.05, 0.08, 6]} />
        {lamb("#d49088")}
      </mesh>
    </group>
  );
}

function Barrels() {
  const spots = useMemo(
    () => [
      { x: SMITH_AT.x - 2.2, z: SMITH_AT.z + 7.4 },
      { x: SMITH_AT.x - 1.4, z: SMITH_AT.z + 7.8 },
      { x: VX + 8.4, z: VZ + 2.2 },
      { x: VX + 9.1, z: VZ + 1.6 },
      { x: VX - 6.2, z: VZ - 4.4 },
      { x: MANOR_AT.x + 4.2, z: MANOR_AT.z + 6.4 },
      { x: FARM_AT.x - 3.4, z: FARM_AT.z + 5.1 },
    ],
    [],
  );
  const [broke, setBroke] = useState<number[]>([]);
  useFrame(() => {
    if (!live.slash) return;
    spots.forEach((s, i) => {
      if (broke.includes(i)) return;
      if (Math.hypot(live.slash!.x - s.x, live.slash!.z - s.z) < 1.15) {
        setBroke((b) => (b.includes(i) ? b : [...b, i]));
        useGame.getState().addCoins(1);
        revealItem("coin");
        sfx.ok();
        live.listen = "A rupee in the barrel.";
      }
    });
  });
  return (
    <group>
      {spots.map((s, i) =>
        broke.includes(i) ? null : (
          <mesh key={i} position={[s.x, heightAt(s.x, s.z) + 0.38, s.z]} castShadow>
            <cylinderGeometry args={[0.28, 0.32, 0.72, 8]} />
            {lamb(i % 2 ? "#6a4a28" : "#5a3a20", { kind: "wood" })}
          </mesh>
        ),
      )}
    </group>
  );
}

function SlashCrates() {
  const spots = useMemo(
    () => [
      { x: VX + 11.2, z: VZ - 1.2 },
      { x: VX + 11.8, z: VZ - 0.6 },
      { x: SMITH_AT.x + 3.2, z: SMITH_AT.z + 7.1 },
      { x: VX - 14.4, z: VZ + 6.2 },
    ],
    [],
  );
  const [broke, setBroke] = useState<number[]>([]);
  useFrame(() => {
    if (!live.slash) return;
    spots.forEach((s, i) => {
      if (broke.includes(i)) return;
      if (Math.hypot(live.slash!.x - s.x, live.slash!.z - s.z) < 1.1) {
        setBroke((b) => (b.includes(i) ? b : [...b, i]));
        useGame.getState().addCoins(1);
        revealItem("coin");
        sfx.ok();
        live.listen = "A rupee in the crate.";
      }
    });
  });
  return (
    <group>
      {spots.map((s, i) =>
        broke.includes(i) ? null : (
          <mesh key={i} position={[s.x, heightAt(s.x, s.z) + 0.28, s.z]} castShadow>
            <boxGeometry args={[0.48, 0.48, 0.48]} />
            {lamb(i % 2 ? "#8a6a38" : "#7a5a28", { kind: "wood" })}
          </mesh>
        ),
      )}
    </group>
  );
}

function NoticeBoard() {
  const { x, z } = BOARD_AT;
  const y = heightAt(x, z);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 384;
    const g = c.getContext("2d");
    if (!g) return null;
    g.fillStyle = "#e7d3a4";
    g.fillRect(0, 0, 512, 384);
    g.strokeStyle = "#5a3a22";
    g.lineWidth = 14;
    g.strokeRect(10, 10, 492, 364);
    g.fillStyle = "#3a2414";
    g.textAlign = "center";
    g.font = "bold 42px Georgia, serif";
    g.fillText("THREE GEMS", 256, 58);
    g.font = "26px Georgia, serif";
    g.fillText("Then the king.", 256, 98);
    g.textAlign = "left";
    g.font = "bold 28px Georgia, serif";
    g.fillText("Dark mouth", 40, 160);
    g.font = "22px Georgia, serif";
    g.fillText("North of town. Orange stone.", 40, 192);
    g.font = "bold 28px Georgia, serif";
    g.fillText("Wet mouth", 40, 246);
    g.font = "22px Georgia, serif";
    g.fillText("Follow the river.", 40, 278);
    g.font = "bold 28px Georgia, serif";
    g.fillText("Sealed crag", 40, 318);
    g.font = "22px Georgia, serif";
    g.fillText("Far east. Bring a bomb.", 40, 348);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, []);
  return (
    <group position={[x, y, z]}>
      <mesh position={[-0.55, 0.7, 0]} castShadow>
        <boxGeometry args={[0.08, 1.4, 0.08]} />
        {lamb("#5a3a20", { kind: "wood" })}
      </mesh>
      <mesh position={[0.55, 0.7, 0]} castShadow>
        <boxGeometry args={[0.08, 1.4, 0.08]} />
        {lamb("#5a3a20", { kind: "wood" })}
      </mesh>
      <mesh position={[0, 1.22, 0.02]} castShadow>
        <boxGeometry args={[1.45, 1.15, 0.06]} />
        {tex ? <meshLambertMaterial map={tex} /> : lamb("#d8c49a", { kind: "wood" })}
      </mesh>
    </group>
  );
}

function WaySigns() {
  const bits = [
    { x: VX + 4.2, z: VZ + 22, yaw: 0, a: "Keep", b: "North" },
    { x: VX - 16, z: VZ - 8, yaw: -1.1, a: "Pond", b: "West" },
    { x: VX + 18, z: VZ - 4, yaw: 0.8, a: "Farm", b: "East" },
    { x: VX - 8, z: VZ - 22, yaw: 3.1, a: "Home", b: "South" },
  ];
  const tex = useMemo(
    () =>
      bits.map((s) => {
        const c = document.createElement("canvas");
        c.width = 256;
        c.height = 96;
        const g = c.getContext("2d");
        if (!g) return null;
        g.fillStyle = "#e7d3a4";
        g.fillRect(0, 0, 256, 96);
        g.fillStyle = "#3a2414";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.font = "bold 40px Georgia, serif";
        g.fillText(s.a, 128, 36);
        g.font = "26px Georgia, serif";
        g.fillText(s.b, 128, 70);
        const t = new CanvasTexture(c);
        t.colorSpace = SRGBColorSpace;
        t.needsUpdate = true;
        return t;
      }),
    [],
  );
  return (
    <group>
      {bits.map((s, i) => {
        const y = heightAt(s.x, s.z);
        return (
          <group key={i} position={[s.x, y, s.z]} rotation={[0, s.yaw, 0]}>
            <mesh position={[0, 0.7, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.08, 1.4, 6]} />
              {lamb("#5a3a20", { kind: "wood" })}
            </mesh>
            <mesh position={[0.36, 1.18, 0]} castShadow>
              <boxGeometry args={[0.86, 0.32, 0.05]} />
              {tex[i] ? <meshLambertMaterial map={tex[i]!} /> : lamb("#c4a06a", { kind: "wood" })}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function BoardedManor() {
  const { x, z } = MANOR_AT;
  const y = heightAt(x, z);
  const d = 11.4;
  const taken = useRef(false);
  const knocks = useRef(0);
  const idle = useRef(0);
  const latched = useRef(false);
  const opened = useRef(false);
  const shutter = useRef<THREE.Group>(null);
  const lamp = useRef<THREE.PointLight>(null);
  const backX = x - 1.6;
  const backZ = z - d * 0.5 - 0.35;
  useFrame((_, dt) => {
    const saved = (useGame.getState().quests?.["manor-even"] ?? 0) >= 1;
    if (saved) opened.current = true;
    if (shutter.current) shutter.current.position.x = opened.current ? 0.85 : 0;
    if (lamp.current) {
      const pulse = opened.current ? 1 : 0.45 + Math.sin(live.playT * 3.2) * 0.35;
      lamp.current.intensity = 2.2 * pulse;
    }
    if (live.house) return;
    if (!taken.current && !opened.current) {
      const hx = x - 2.8;
      const hz = z - d * 0.52;
      if (Math.hypot(live.x - hx, live.z - hz) < 1.15 && live.stillT > 0.4) {
        taken.current = true;
        useGame.getState().addCoins(20);
        revealItem("coin");
        sfx.chime();
        live.listen = "A purse in the weeds behind the boarded house.";
      }
    }
    if (opened.current) return;
    const near = live.slash && Math.hypot(live.slash.x - backX, live.slash.z - backZ) < 1.6;
    if (near) {
      if (!latched.current) {
        latched.current = true;
        knocks.current += 1;
        idle.current = 0;
        sfx.select();
        const n = knocks.current;
        live.listen = n > 6 ? "Too many. She stopped counting." : `${n}.`;
        if (n > 6) knocks.current = 0;
      }
    } else latched.current = false;
    if (knocks.current > 0) {
      idle.current += dt;
      if (idle.current > 1.15) {
        const n = knocks.current;
        knocks.current = 0;
        idle.current = 0;
        if (n === 2 || n === 4 || n === 6) {
          opened.current = true;
          useGame.getState().setQuest("manor-even", 1);
          useGame.getState().addCoins(15);
          sfx.ok();
          live.listen = "The shutter slides. She only answers even knocks.";
        } else {
          sfx.miss();
          live.listen = "Odd. The lamp goes dim. She does not answer an odd knock.";
        }
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      {[-0.45, 0, 0.45].map((px, i) => (
        <mesh key={i} position={[px, 1.15, d * 0.5 + 0.08]} rotation={[0, 0, 0.4 - i * 0.4]} castShadow>
          <boxGeometry args={[0.16, 1.55, 0.08]} />
          {lamb("#5a3a20", { kind: "wood" })}
        </mesh>
      ))}
      <mesh position={[-2.8, 0.08, -d * 0.52]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        {lamb("#c9a227", { kind: "metal" })}
      </mesh>
      <group ref={shutter} position={[-1.6, 1.35, -d * 0.5 - 0.06]}>
        <mesh castShadow>
          <boxGeometry args={[0.72, 0.9, 0.08]} />
          {lamb("#6a4a28", { kind: "wood" })}
        </mesh>
      </group>
      <pointLight ref={lamp} position={[-1.2, 1.7, -d * 0.42]} color="#ffb060" intensity={2} distance={6} />
      {[2, 4, 6].map((n, gi) =>
        Array.from({ length: n }, (_, i) => (
          <mesh key={`${n}-${i}`} position={[-3.1 + gi * 0.7, 0.06, -d * 0.5 - 1.15 + (i % 2) * 0.16]} castShadow>
            <sphereGeometry args={[0.05, 6, 5]} />
            {lamb("#d9d0bc", { kind: "stone" })}
          </mesh>
        )),
      )}
    </group>
  );
}

function MarketBits() {
  const stall = { x: VX + 10.2, z: VZ - 2.4 };
  const y = heightAt(stall.x, stall.z);
  return (
    <group position={[stall.x, y, stall.z]}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[2.4, 0.08, 1.4]} />
        {lamb("#8a3a28", { kind: "cloth" })}
      </mesh>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.55, 0.55]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 1.1, 6]} />
          {lamb("#5a3a20", { kind: "wood" })}
        </mesh>
      ))}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.8, 0.55, 0.7]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      {[-0.45, 0, 0.45].map((x, i) => (
        <mesh key={i} position={[x, 0.92, 0.05]}>
          <sphereGeometry args={[0.12, 7, 5]} />
          {lamb(["#c45c48", "#3ecf6a", "#e8d48a"][i]!, { kind: "flower" })}
        </mesh>
      ))}
    </group>
  );
}

function ClothesLines() {
  const lines = [
    { ax: VX - 18.4, az: VZ + 2.2, bx: VX - 12.6, bz: VZ + 3.4 },
    { ax: VX + 16.2, az: VZ - 14.4, bx: VX + 21.4, bz: VZ - 12.8 },
  ];
  return (
    <group>
      {lines.map((l, i) => {
        const mx = (l.ax + l.bx) * 0.5;
        const mz = (l.az + l.bz) * 0.5;
        const y = heightAt(mx, mz);
        const yaw = Math.atan2(l.bx - l.ax, l.bz - l.az);
        const len = Math.hypot(l.bx - l.ax, l.bz - l.az);
        return (
          <group key={i} position={[mx, y, mz]} rotation={[0, yaw, 0]}>
            {[-len * 0.5, len * 0.5].map((px) => (
              <mesh key={px} position={[0, 1.15, px]} castShadow>
                <cylinderGeometry args={[0.05, 0.06, 2.3, 6]} />
                {lamb("#5a3a20", { kind: "wood" })}
              </mesh>
            ))}
            <mesh position={[0, 2.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, len, 4]} />
              {lamb("#d8c49a")}
            </mesh>
            {[-0.7, 0, 0.7].map((pz, k) => (
              <mesh key={k} position={[0.02, 1.85, pz]} castShadow>
                <boxGeometry args={[0.04, 0.55, 0.38]} />
                {lamb(["#efe6d4", "#3a5a88", "#8a3a38"][k]!, { kind: "cloth" })}
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function SquareBenches() {
  const spots = [
    { x: FOUNTAIN.x + 2.6, z: FOUNTAIN.z + 0.4, yaw: -0.4 },
    { x: FOUNTAIN.x - 2.4, z: FOUNTAIN.z + 0.8, yaw: 0.9 },
    { x: FIRE_PIT.x + 3.4, z: FIRE_PIT.z - 1.2, yaw: 0.2 },
    { x: BOARD_AT.x - 1.8, z: BOARD_AT.z + 1.2, yaw: 0.15 },
  ];
  return (
    <group>
      {spots.map((s, i) => {
        const y = heightAt(s.x, s.z);
        return (
          <group key={i} position={[s.x, y, s.z]} rotation={[0, s.yaw, 0]}>
            <mesh position={[0, 0.32, 0]} castShadow>
              <boxGeometry args={[1.15, 0.12, 0.38]} />
              {lamb("#6a4a28", { kind: "wood" })}
            </mesh>
            {[-0.48, 0.48].map((px) => (
              <mesh key={px} position={[px, 0.16, 0]} castShadow>
                <boxGeometry args={[0.08, 0.32, 0.32]} />
                {lamb("#5a3a20", { kind: "wood" })}
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function FlowerBeds() {
  const beds = useMemo(() => {
    const list: { x: number; z: number; c: string }[] = [];
    const hubs = [
      { x: VX - 8.4, z: VZ + 4.2 },
      { x: VX + 6.2, z: VZ - 10.4 },
      { x: FOUNTAIN.x + 1.6, z: FOUNTAIN.z - 2.2 },
      { x: WELL_AT.x + 1.8, z: WELL_AT.z - 1.2 },
    ];
    const cols = ["#c45c48", "#e8d48a", "#d478a0", "#3ecf6a", "#efe6d4"];
    hubs.forEach((h, hi) => {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        list.push({
          x: h.x + Math.cos(a) * 0.55,
          z: h.z + Math.sin(a) * 0.45,
          c: cols[(i + hi) % cols.length]!,
        });
      }
    });
    return list;
  }, []);
  return (
    <group>
      {beds.map((f, i) => (
        <mesh key={i} position={[f.x, heightAt(f.x, f.z) + 0.12, f.z]} castShadow>
          <sphereGeometry args={[0.09, 6, 5]} />
          {lamb(f.c, { kind: "flower" })}
        </mesh>
      ))}
    </group>
  );
}

function TownCat() {
  const p = useRef({ x: VX + 5.4, z: VZ + 2.2, a: 0, yaw: 0 });
  const g = useRef<THREE.Group>(null);
  const paid = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    const c = p.current;
    const d = Math.hypot(live.x - c.x, live.z - c.z);
    if (d < 3.6) {
      c.a += dt;
      const tx = live.x + Math.sin(live.yaw + 1.4) * 0.7;
      const tz = live.z + Math.cos(live.yaw + 1.4) * 0.7;
      c.x += (tx - c.x) * dt * 1.4;
      c.z += (tz - c.z) * dt * 1.4;
      c.yaw = Math.atan2(tx - c.x, tz - c.z);
      if (d < 1.15 && live.stillT > 0.8 && !paid.current) {
        paid.current = true;
        useGame.getState().addCoins(5);
        revealItem("coin");
        sfx.ok();
        live.listen = "The tan cat winds around your feet. A rupee in the fur.";
      }
    } else {
      c.a += dt * 0.4;
      c.x = VX + 5.4 + Math.sin(c.a) * 3.2;
      c.z = VZ + 2.2 + Math.cos(c.a * 0.7) * 2.6;
    }
    if (g.current) {
      g.current.position.set(c.x, heightAt(c.x, c.z) + 0.16, c.z);
      g.current.rotation.y = c.yaw;
    }
    if (d < 1.8) live.listen = live.listen || "A tan cat. It likes still feet.";
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0.04, 0]} castShadow>
        <sphereGeometry args={[0.13, 7, 5]} />
        {lamb("#c9a06a")}
      </mesh>
      <mesh position={[0, 0.1, 0.12]} castShadow>
        <sphereGeometry args={[0.08, 6, 5]} />
        {lamb("#c9a06a")}
      </mesh>
      {[-0.04, 0.04].map((x) => (
        <mesh key={x} position={[x, 0.18, 0.1]} rotation={[0.2, 0, x * 4]}>
          <coneGeometry args={[0.03, 0.08, 4]} />
          {lamb("#c9a06a")}
        </mesh>
      ))}
      <mesh position={[0, 0.02, -0.16]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.015, 0.22, 5]} />
        {lamb("#c9a06a")}
      </mesh>
    </group>
  );
}

function SquareLanterns() {
  const posts = [
    { x: VX + 4.8, z: VZ + 10.2 },
    { x: VX - 5.2, z: VZ + 8.4 },
    { x: SMITH_AT.x - 1.2, z: SMITH_AT.z + 8.4 },
    { x: FARM_AT.x - 4.2, z: FARM_AT.z + 2.2 },
  ];
  const lights = useRef<(THREE.PointLight | null)[]>([]);
  useFrame(() => {
    const want = live.night ? 3.4 : 0.35;
    for (const l of lights.current) {
      if (l) l.intensity = want;
    }
  });
  return (
    <group>
      {posts.map((p, i) => {
        const y = heightAt(p.x, p.z);
        return (
          <group key={i} position={[p.x, y, p.z]}>
            <mesh position={[0, 1.15, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.07, 2.3, 6]} />
              {lamb("#4a3a28", { kind: "wood" })}
            </mesh>
            <mesh position={[0, 2.28, 0]} castShadow>
              <boxGeometry args={[0.28, 0.32, 0.28]} />
              {lamb("#c9a227", { kind: "metal" })}
            </mesh>
            <pointLight
              ref={(el) => {
                lights.current[i] = el;
              }}
              position={[0, 2.28, 0]}
              intensity={0.4}
              color="#ffb060"
              distance={7}
            />
          </group>
        );
      })}
    </group>
  );
}

function WashTub() {
  const x = VX - 12.4;
  const z = VZ + 4.6;
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.38, 0.42, 10]} />
        {lamb("#6a7a78", { kind: "metal" })}
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34, 10]} />
        <meshLambertMaterial color="#4a90a0" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function MillAlley() {
  const x = VX + 8.4;
  const z = VZ - 22.6;
  const taken = useRef(false);
  useFrame(() => {
    if (taken.current || live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 1.05 && live.stillT > 0.35) {
      taken.current = true;
      useGame.getState().addCoins(8);
      revealItem("coin");
      sfx.chime();
      live.listen = "A coin under the last mill board.";
    }
  });
  return (
    <mesh position={[x, heightAt(x, z) + 0.04, z]} rotation={[-Math.PI / 2, 0, 0.3]}>
      <planeGeometry args={[1.4, 0.55]} />
      {lamb("#5a3a20", { kind: "wood" })}
    </mesh>
  );
}

function WellFlowers() {
  const { x, z } = WELL_AT;
  return (
    <group>
      {[0.4, 1.6, 2.8, 4.1].map((a, i) => {
        const px = x + Math.sin(a) * 1.35;
        const pz = z + Math.cos(a) * 1.35;
        return (
          <mesh key={i} position={[px, heightAt(px, pz) + 0.12, pz]}>
            <sphereGeometry args={[0.08, 6, 5]} />
            {lamb(i % 2 ? "#c45c48" : "#efe6d4", { kind: "flower" })}
          </mesh>
        );
      })}
    </group>
  );
}
