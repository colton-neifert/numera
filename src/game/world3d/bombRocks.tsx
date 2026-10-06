import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { heightAt, ROCKS, GROTTO_ROCKS, blownRocks, rockKey, rockGone, rockRadius, type RockSpot } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { sfx } from "../audio";
import { useGame } from "../store";
import { playerMaxHp } from "../content";
import { revealItem } from "../items";
import { beginRealm } from "./realms";

export const SECRET_HOLES: RockSpot[] = GROTTO_ROCKS.map((r) => ({ ...r, s: 1, r: 0, k: 0 }));

const SECRET_AT = new Set(SECRET_HOLES.map((r) => rockKey(r.x, r.z)));

let synced = -1;
export function syncBlownRocks() {
  const seen = useGame.getState().seenItems ?? [];
  if (seen.length === synced) return;
  synced = seen.length;
  for (const s of seen) {
    if (s.startsWith("rk:")) blownRocks.add(s.slice(3));
  }
}

export function shatterRocks(x: number, z: number) {
  syncBlownRocks();
  let secret = false;
  for (const r of ROCKS) {
    const key = rockKey(r.x, r.z);
    if (blownRocks.has(key)) continue;
    const reach = Math.max(1.75, rockRadius(r.s) + 1.3);
    if (Math.hypot(r.x - x, r.z - z) > reach) continue;
    blownRocks.add(key);
    useGame.getState().discover(`rk:${key}`);
    synced = (useGame.getState().seenItems ?? []).length;
    if (SECRET_AT.has(key)) secret = true;
  }
  if (secret) {
    sfx.grind();
    sfx.secret();
    live.listen = "The ground gives way.";
  }
}

type Box = { x: number; z: number; hx: number; hz: number };

export function collideRockHoles(_nx: number, _nz: number): { x: number; z: number } | null {
  return null;
}

export const GROTTO = { x: 3600, z: 3600 };

export function collideGrotto(nx: number, nz: number) {
  if (live.realm !== "grotto") return null;
  const x0 = GROTTO.x - 6;
  const x1 = GROTTO.x + 6;
  const z0 = GROTTO.z - 5;
  const z1 = GROTTO.z + 7;
  let x = nx;
  let z = nz;
  if (x < x0) x = x0;
  if (x > x1) x = x1;
  if (z > z1) z = z1;
  if (z < z0 && Math.abs(x - GROTTO.x) > 1.2) z = z0;
  if (x === nx && z === nz) return null;
  return { x, z };
}

function payHole(r: RockSpot, i: number) {
  const id = `hr:${rockKey(r.x, r.z)}`;
  if ((useGame.getState().quests?.[id] ?? 0) > 0) return;
  useGame.getState().setQuest(id, 1);
  const g = useGame.getState();
  const kind = i % 6;
  if (kind === 1) {
    const max = playerMaxHp(g.xp, g.outfit, g.heartsExtra ?? 0);
    useGame.setState({ hp: max });
    sfx.heart();
    live.listen = "Your health fills.";
  } else if (kind === 2) {
    const n = g.addArrows(6);
    sfx.chest();
    live.listen = n ? "Arrows, still dry." : "The quiver is full. A few coins instead.";
    if (!n) g.addCoins(8);
  } else if (kind === 4) {
    sfx.chime();
    live.listen = "A chair, underground. Nobody is sitting in it.";
  } else if (kind === 5) {
    if (g.grantHeartContainer(id)) {
      revealItem("container", true);
      sfx.heart();
      sfx.secret();
      live.listen = "A heart was under the rock.";
    } else {
      g.addCoins(20);
      sfx.chest();
      live.listen = "Coins. The heart was already yours.";
    }
  } else {
    const n = kind === 3 ? 20 : 12;
    g.addCoins(n);
    sfx.chest();
    live.listen = "Coins in the dark.";
  }
}

function Hole({ r, i }: { r: RockSpot; i: number }) {
  const y = heightAt(r.x, r.z);
  const [paid, setPaid] = useState((useGame.getState().quests?.[`hr:${rockKey(r.x, r.z)}`] ?? 0) > 0);
  useFrame(() => {
    if (paid) return;
    if (live.realm !== "grotto") return;
    if (!live.grottoBack) return;
    if (Math.hypot(live.grottoBack.x - r.x, live.grottoBack.z - r.z) > 0.4) return;
    if (Math.hypot(live.x - GROTTO.x, live.z - (GROTTO.z + 2)) > 1.4) return;
    payHole(r, i);
    setPaid(true);
  });
  return (
    <group position={[r.x, y, r.z]}>
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[1.05, 0.72, 1.8, 8]} />
        {lamb("#100e0c")}
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.95, 1.45, 8]} />
        {lamb("#c4924e", { kind: "dirt" })}
      </mesh>
    </group>
  );
}

export function GrottoRoom() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = live.realm === "grotto";
    if (live.realmWarp || live.roomWarp || live.house || live.gateCross) return;
    if (!live.realm || live.realm === "surface") {
      for (const r of SECRET_HOLES) {
        if (!rockGone(r.x, r.z)) continue;
        if (Math.hypot(live.x - r.x, live.z - r.z) > 0.82) continue;
        live.grottoBack = { x: r.x, z: r.z };
        beginRealm("grotto", "Grotto", GROTTO.x, GROTTO.z + 2.4, 0);
        return;
      }
      return;
    }
    if (live.realm === "grotto" && Math.hypot(live.x - GROTTO.x, live.z - (GROTTO.z - 1.2)) < 1.15) {
      const back = live.grottoBack ?? { x: GROTTO.x, z: GROTTO.z };
      live.grottoPop = 7;
      beginRealm("surface", "", back.x + 1.6, back.z, 0);
    }
  });
  return (
    <group ref={ref} position={[GROTTO.x, 0, GROTTO.z]}>
      <mesh position={[0, -0.2, 1]} receiveShadow>
        <boxGeometry args={[12, 0.4, 14]} />
        {lamb("#6a5344", { kind: "dirt" })}
      </mesh>
      <mesh position={[0, 2.2, 1]}>
        <boxGeometry args={[12, 0.4, 14]} />
        {lamb("#4a382c")}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 6, 2, 1]}>
          <boxGeometry args={[0.6, 4.4, 14]} />
          {lamb("#8d6a48", { kind: "stone", flat: true })}
        </mesh>
      ))}
      <mesh position={[0, 2, 8]}>
        <boxGeometry args={[12, 4.4, 0.6]} />
        {lamb("#8d6a48", { kind: "stone", flat: true })}
      </mesh>
      <mesh position={[0, 3.2, -1.2]}>
        <cylinderGeometry args={[0.35, 0.9, 3.2, 6]} />
        <meshBasicMaterial color="#fff2c4" transparent opacity={0.55} />
      </mesh>
      <mesh position={[2.2, 0.35, 3]}>
        <boxGeometry args={[0.7, 0.45, 0.5]} />
        {lamb("#c9a24a")}
      </mesh>
    </group>
  );
}

export function BombRocks() {
  const [tick, setTick] = useState(0);
  const cell = useRef("");
  useFrame(() => {
    syncBlownRocks();
    const key = `${Math.round(live.x / 16)}:${Math.round(live.z / 16)}:${blownRocks.size}`;
    if (key !== cell.current) {
      cell.current = key;
      setTick((n) => n + 1);
    }
  });
  void tick;
  return (
    <group>
      {ROCKS.map((r, i) => {
        if (rockGone(r.x, r.z)) return null;
        if (Math.hypot(r.x - live.x, r.z - live.z) > 110) return null;
        const y = heightAt(r.x, r.z);
        const tint = i % 3 === 0 ? "#8a8680" : i % 3 === 1 ? "#7a7468" : "#6a6860";
        return (
          <mesh key={rockKey(r.x, r.z)} position={[r.x, y + 0.28 * r.s, r.z]} rotation={[0.12, r.r, 0.06]} scale={[r.s, r.s * 0.78, r.s * 0.92]}>
            <dodecahedronGeometry args={[0.72, 0]} />
            {lamb(tint)}
          </mesh>
        );
      })}
      {SECRET_HOLES.map((r, i) => (rockGone(r.x, r.z) ? <Hole key={rockKey(r.x, r.z)} r={r} i={i} /> : null))}
    </group>
  );
}
