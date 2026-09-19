import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, TREE_HOME, TREE_HOUSE_H, WELL_AT, BELL_AT } from "./field";
import { MILL_AT } from "./village";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { addTrapSpot } from "./dungeonTraps";
import { consumeTalk as consumeTalkRaw } from "../input";
import type { Ladder } from "./climb";

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
}

function talkOk() {
  if (live.nearNpc || live.nearHouse || live.nearChest || live.nearHorse) return false;
  return consumeTalkRaw();
}

const MILL_DOOR = { x: MILL_AT.x, z: MILL_AT.z + 3.4 };
let millIn = false;
let wellIn = false;

export function secretLadders(): Ladder[] {
  const extra: Ladder[] = [{ id: "bell", x: BELL_AT.x, z: BELL_AT.z, yaw: 0, h: 6.4, half: 0.55 }];
  if (wellIn) extra.push({ id: "wellout", x: WELL_AT.x, z: WELL_AT.z, yaw: 0, h: 5.2, half: 0.7 });
  if (millIn) extra.push({ id: "millin", x: MILL_AT.x - 1.6, z: MILL_AT.z, yaw: 0, h: 4.4, half: 0.55 });
  return extra;
}

export function SecretPlay() {
  return (
    <group>
      <MillInside />
      <WellBottom />
      <FallTree />
      <HangSack />
      <AtticHatch />
      <ThreePads />
    </group>
  );
}

function fadeWarp(
  going: { current: "" | "in" | "out" },
  t: { current: number },
  dt: number,
  onMid: (dir: "in" | "out") => void,
) {
  if (!going.current) return;
  t.current += dt;
  const u = Math.min(1, t.current / 1.1);
  if (u < 0.5) live.roomFade = u / 0.5;
  else {
    live.roomFade = 1 - (u - 0.5) / 0.5;
    live.roomFadeOut = true;
  }
  live.speed = 0;
  if (u > 0.48 && u < 0.56) onMid(going.current);
  if (u >= 1) {
    going.current = "";
    live.roomFade = 0;
    live.roomFadeOut = false;
  }
}

function MillInside() {
  const y = heightAt(MILL_AT.x, MILL_AT.z);
  const going = useRef<"" | "in" | "out">("");
  const t = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const dDoor = Math.hypot(live.x - MILL_DOOR.x, live.z - MILL_DOOR.z);
    if (!going.current && !millIn && dDoor < 1.25) {
      going.current = "in";
      t.current = 0;
    }
    if (!going.current && millIn && dDoor < 1.25 && live.z > MILL_AT.z + 1.6) {
      going.current = "out";
      t.current = 0;
    }
    fadeWarp(going, t, dt, (dir) => {
      millIn = dir === "in";
      live.cave = millIn;
      if (dir === "in") {
        live.x = MILL_AT.x;
        live.z = MILL_AT.z + 0.4;
        live.y = y + 0.2;
        pay(8, "millin");
        live.listen = "Inside the mill. Grain. Dust. A ladder.";
      } else {
        live.x = MILL_DOOR.x;
        live.z = MILL_DOOR.z + 1.4;
        live.y = y + 0.2;
      }
    });
    if (millIn && live.y > y + 3.6) {
      pay(10, "millroof2");
      live.listen = "The mill roof. Town looks small.";
    }
    if (dDoor < 1.8 && !millIn) live.listen = live.listen || "The mill door. It is open.";
  }, 1);
  if (!millIn) return (
    <mesh position={[MILL_DOOR.x, y + 1.15, MILL_DOOR.z]}>
      <boxGeometry args={[1.05, 2.1, 0.08]} />
      <meshLambertMaterial color="#2a1810" />
    </mesh>
  );
  return (
    <group position={[MILL_AT.x, y, MILL_AT.z]}>
      {[-1.6, 1.6].map((s) => (
        <mesh key={s} position={[s, 0.45, -0.4]}>
          <cylinderGeometry args={[0.35, 0.38, 0.9, 8]} />
          <meshLambertMaterial color="#c9b48a" />
        </mesh>
      ))}
      <mesh position={[0, 0.08, 0.2]}>
        <boxGeometry args={[3.4, 0.08, 2.8]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function WellBottom() {
  const y = heightAt(WELL_AT.x, WELL_AT.z);
  const going = useRef<"" | "in" | "out">("");
  const t = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - WELL_AT.x, live.z - WELL_AT.z);
    if (!going.current && !wellIn && d < 0.85 && live.y < y + 1.4) {
      going.current = "in";
      t.current = 0;
    }
    if (!going.current && wellIn && live.climbH > 4.6) {
      going.current = "out";
      t.current = 0;
    }
    fadeWarp(going, t, dt, (dir) => {
      wellIn = dir === "in";
      live.cave = wellIn || millIn;
      if (dir === "in") {
        live.x = WELL_AT.x;
        live.z = WELL_AT.z;
        live.y = y - 3.6;
        pay(10, "wellbottom");
        live.listen = "The bottom of the well. Cold. A gleam.";
      } else {
        live.x = WELL_AT.x + 1.4;
        live.z = WELL_AT.z;
        live.y = y + 0.2;
        wellIn = false;
        live.cave = millIn;
      }
    });
    if (wellIn && d < 0.9 && talkOk()) {
      pay(14, "wellgem");
      live.listen = "A rupee nobody could reach from the top.";
    }
    if (d < 1.5 && !wellIn) live.listen = live.listen || "The well. You could climb down.";
  }, 1);
  if (!wellIn) return null;
  return (
    <group position={[WELL_AT.x, y - 3.8, WELL_AT.z]}>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[1.35, 1.45, 3.4, 10]} />
        <meshLambertMaterial color="#2a2218" side={THREE.BackSide} />
      </mesh>
      <mesh position={[0.4, 0.2, 0.2]}>
        <octahedronGeometry args={[0.14, 0]} />
        <meshLambertMaterial color="#3ec878" emissive="#1a6a40" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function FallTree() {
  const base = { x: TREE_TRUNK.x + 21.4, z: TREE_TRUNK.z + 22.8 };
  const y = heightAt(base.x, base.z);
  const hits = useRef(0);
  const down = useRef(false);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - base.x, live.z - base.z);
    if (!down.current && live.slash && d < 1.5) {
      hits.current += 1;
      sfx.thud();
      live.listen = hits.current < 3 ? "The tree shook." : "It is coming down.";
      if (hits.current >= 3) {
        down.current = true;
        pay(10, "falltree");
        live.listen = "It fell across the ditch. A bridge.";
      }
    }
    if (g.current) g.current.rotation.z = down.current ? Math.PI / 2 : 0;
    if (down.current) {
      for (let i = 0; i < 5; i++) addTrapSpot(base.x + 1.1 + i * 0.7, base.z, 0.45, 0.42);
    }
    if (d < 1.8 && !down.current) live.listen = live.listen || "A thin tree by a ditch. Chop.";
  }, -2);
  return (
    <group>
      <mesh position={[base.x + 3.2, y - 0.4, base.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.4, 2.2]} />
        <meshLambertMaterial color="#4a3a28" />
      </mesh>
      <group ref={g} position={[base.x, y, base.z]}>
        <mesh position={[0, 2.2, 0]}>
          <cylinderGeometry args={[0.16, 0.22, 4.4, 6]} />
          <meshLambertMaterial color="#5a3a22" />
        </mesh>
        <mesh position={[0, 4.4, 0]}>
          <sphereGeometry args={[0.7, 6, 5]} />
          <meshLambertMaterial color="#2a6a32" />
        </mesh>
      </group>
    </group>
  );
}

function HangSack() {
  const x = MILL_AT.x - 3.4;
  const z = MILL_AT.z + 1.2;
  const y = heightAt(x, z);
  const cut = useRef(false);
  const sackY = useRef(2.4);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (!cut.current && live.slash && d < 1.6 && live.y > y + 0.8) {
      cut.current = true;
      live.listen = "The rope snapped.";
    }
    if (cut.current && sackY.current > 0.4) {
      sackY.current = Math.max(0.4, sackY.current - dt * 8);
      if (sackY.current <= 0.4) {
        sfx.thud();
        pay(9, "hangsack");
        live.listen = "Grain. And a rupee the miller lost.";
      }
    }
    if (g.current) g.current.position.y = y + sackY.current;
    if (d < 1.8 && !cut.current) live.listen = live.listen || "A sack on a rope. Slash the rope.";
  });
  return (
    <group>
      {!cut.current ? (
        <mesh position={[x, y + 3.1, z]}>
          <cylinderGeometry args={[0.015, 0.015, 1.6, 4]} />
          <meshLambertMaterial color="#c9b48a" />
        </mesh>
      ) : null}
      <group ref={g} position={[x, y + 2.4, z]}>
        <mesh>
          <sphereGeometry args={[0.32, 7, 5]} />
          <meshLambertMaterial color="#c9b48a" />
        </mesh>
      </group>
    </group>
  );
}

function AtticHatch() {
  const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
  useFrame(() => {
    if (live.house !== "yours") return;
    const d = Math.hypot(live.x, live.z + 0.2);
    if (d < 1.1 && live.y > 1.6 && (talkOk() || !live.grounded)) {
      pay(9, "attic");
      live.listen = "The attic. Gran’s winter coats. And a rupee in a pocket.";
    }
  });
  return (
    <mesh position={[TREE_HOME.x, plat + 2.05, TREE_HOME.z]} visible={false}>
      <boxGeometry args={[0.6, 0.05, 0.6]} />
      <meshLambertMaterial color="#3a2818" />
    </mesh>
  );
}

function ThreePads() {
  const pads = [
    { x: TREE_TRUNK.x + 26.4, z: TREE_TRUNK.z + 14.2, on: false },
    { x: TREE_TRUNK.x + 28.6, z: TREE_TRUNK.z + 16.4, on: false },
    { x: TREE_TRUNK.x + 30.4, z: TREE_TRUNK.z + 13.6, on: false },
  ];
  const state = useRef(pads.map((p) => ({ ...p })));
  const done = useRef(false);
  useFrame(() => {
    if (live.house || done.current) return;
    let n = 0;
    for (const p of state.current) {
      const d = Math.hypot(live.x - p.x, live.z - p.z);
      if (d < 0.7 && live.grounded) p.on = true;
      if (p.on) n += 1;
    }
    if (n >= 3) {
      done.current = true;
      pay(12, "threepads");
      live.listen = "Three stones. A lid opened in the grass.";
    }
    if (state.current.some((p) => Math.hypot(live.x - p.x, live.z - p.z) < 1.4))
      live.listen = live.listen || "Three flat stones. Stand on each.";
  });
  return (
    <group>
      {state.current.map((p, i) => (
        <mesh key={i} position={[p.x, heightAt(p.x, p.z) + 0.06, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.48, 8]} />
          <meshLambertMaterial color={p.on ? "#c9a227" : "#7a7268"} />
        </mesh>
      ))}
    </group>
  );
}
