import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, POND, pondU, pondSurfaceY, BELL_AT } from "./field";
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

let beanUp = false;
let gateOpen = false;

export function chainLadders(): Ladder[] {
  if (!beanUp) return [];
  return [{ id: "bean", x: TREE_TRUNK.x + 7.4, z: TREE_TRUNK.z - 10.2, yaw: 0, h: 7.2, half: 0.7 }];
}

export function ChainPlay() {
  return (
    <group>
      <MillLock />
      <TargetPlank />
      <PondDive />
      <WaterBean />
      <YardGoat />
      <BellGate />
      <StackCrates />
    </group>
  );
}

function MillLock() {
  const x = MILL_AT.x + 1.6;
  const z = MILL_AT.z - 0.8;
  const y = heightAt(MILL_AT.x, MILL_AT.z);
  const open = useRef(false);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    const inMill = Math.hypot(live.x - MILL_AT.x, live.z - MILL_AT.z) < 3.4 && live.cave;
    if (!inMill && d > 4) return;
    const key = Boolean(live.smashed.wellgem || live.smashed.wellbottom);
    if (d < 1.3 && (talkOk() || live.slash)) {
      if (!key) {
        live.listen = "A small chest. It needs a key. The well is deep.";
      } else {
        open.current = true;
        pay(18, "milllock");
        live.listen = "The well key fit. Whoever hid this used both places.";
      }
    }
    if (d < 1.8) live.listen = live.listen || (key ? "The chest. You have a key." : "A locked chest.");
  });
  return (
    <group position={[x, y + 0.28, z]}>
      <mesh>
        <boxGeometry args={[0.55, 0.35, 0.4]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 0.12, 0.22]}>
        <boxGeometry args={[0.08, 0.08, 0.04]} />
        <meshLambertMaterial color={open.current ? "#3ec878" : "#c9a227"} />
      </mesh>
    </group>
  );
}

function TargetPlank() {
  const tgt = { x: TREE_TRUNK.x + 24.8, z: TREE_TRUNK.z + 2.4 };
  const plank = { x: TREE_TRUNK.x + 22.2, z: TREE_TRUNK.z + 2.4 };
  const y = heightAt(tgt.x, tgt.z);
  const down = useRef(false);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - tgt.x, live.z - tgt.z);
    const shot =
      live.slash && Math.hypot((live.slash.x ?? 0) - tgt.x, (live.slash.z ?? 0) - tgt.z) < 1.6;
    const boom = live.lastBoom && Math.hypot(live.lastBoom.x - tgt.x, live.lastBoom.z - tgt.z) < 2.8;
    const sling = live.slingShot && d < 14 && d > 2;
    if (!down.current && (shot || boom || sling)) {
      down.current = true;
      pay(10, "targetplank");
      live.listen = "The target rang. A plank fell.";
      sfx.thud();
    }
    if (g.current) g.current.rotation.z += ((down.current ? 0 : -1.15) - g.current.rotation.z) * (1 - Math.exp(-dt * 6));
    if (down.current) {
      for (let i = 0; i < 4; i++) addTrapSpot(plank.x - 0.4 + i * 0.7, plank.z, 0.5, 0.55);
    }
    if (d < 8 && d > 1.5) live.listen = live.listen || "A target. A hanging plank. Hit the target.";
  }, -2);
  return (
    <group>
      <mesh position={[tgt.x, y + 1.55, tgt.z]}>
        <cylinderGeometry args={[0.35, 0.35, 0.08, 10]} />
        <meshLambertMaterial color="#c42828" />
      </mesh>
      <mesh position={[tgt.x, y + 1.55, tgt.z]}>
        <cylinderGeometry args={[0.16, 0.16, 0.1, 8]} />
        <meshLambertMaterial color="#f4e878" />
      </mesh>
      <group ref={g} position={[plank.x + 1.4, y + 1.8, plank.z]}>
        <mesh position={[-1.4, 0, 0]}>
          <boxGeometry args={[2.8, 0.12, 0.55]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      </group>
    </group>
  );
}

function PondDive() {
  useFrame(() => {
    if (live.house || !live.swim) return;
    const u = pondU(live.x, live.z);
    const d = Math.hypot(live.x - POND.x, live.z - POND.z);
    if (u > 0.55 && d < 3.2 && live.y < heightAt(POND.x, POND.z) + 0.4) {
      pay(14, "ponddive");
      live.listen = "Under the pond. A chest in the weeds. Your lungs said hurry.";
    }
    if (live.swim && d < 4) live.listen = live.listen || "The middle is deep. Something sits on the bottom.";
  });
  return (
    <mesh position={[POND.x, pondSurfaceY() - 0.85, POND.z]}>
      <boxGeometry args={[0.45, 0.28, 0.35]} />
      <meshLambertMaterial color="#4a3220" />
    </mesh>
  );
}

function WaterBean() {
  const x = TREE_TRUNK.x + 7.4;
  const z = TREE_TRUNK.z - 10.2;
  const y = heightAt(x, z);
  const grow = useRef(0);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (!beanUp && d < 1.3 && (live.wetT > 0.8 || live.rainT > 0.3 || live.bucket > 0)) {
      grow.current = Math.min(1, grow.current + dt * 0.55);
      if (grow.current >= 1) {
        beanUp = true;
        pay(10, "waterbean");
        live.listen = "You watered it. It climbed. You can too.";
      } else live.listen = "A dry bean. It wants water.";
    }
    if (g.current) g.current.scale.y = 0.15 + grow.current * 0.85;
    if (beanUp) addTrapSpot(x, z, 0.55, 2.2);
    if (d < 1.6 && !beanUp) live.listen = live.listen || "A dry bean. Water would wake it.";
  }, -2);
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh position={[0, 3.4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 6.8, 6]} />
        <meshLambertMaterial color="#3a7a38" />
      </mesh>
    </group>
  );
}

function YardGoat() {
  const p = useRef({ x: TREE_TRUNK.x + 18.4, z: TREE_TRUNK.z + 20.6, a: 0 });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const o = p.current;
    o.a += dt * 0.3;
    o.x += Math.cos(o.a) * dt * 0.4;
    const d = Math.hypot(live.x - o.x, live.z - o.z);
    if (d < 1.3 && live.carry === "flower") {
      live.carry = null;
      pay(7, "goateat");
      live.listen = "The goat ate it. It did not say thank you. Goats don’t.";
    }
    if (g.current) g.current.position.set(o.x, heightAt(o.x, o.z) + 0.35, o.z);
    if (d < 1.7) live.listen = live.listen || "A goat. It is looking at what you are holding.";
  });
  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[0.22, 6, 5]} />
        <meshLambertMaterial color="#d8d0c4" />
      </mesh>
      <mesh position={[0.22, 0.12, 0]}>
        <sphereGeometry args={[0.12, 5, 4]} />
        <meshLambertMaterial color="#d8d0c4" />
      </mesh>
      <mesh position={[0.18, 0.28, 0.08]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.02, 0.03, 0.22, 4]} />
        <meshLambertMaterial color="#efe4cc" />
      </mesh>
    </group>
  );
}

function BellGate() {
  const fence = { x: TREE_TRUNK.x + 12.4, z: TREE_TRUNK.z + 24.8 };
  const yb = heightAt(BELL_AT.x, BELL_AT.z);
  const yf = heightAt(fence.x, fence.z);
  const bar = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const db = Math.hypot(live.x - BELL_AT.x, live.z - BELL_AT.z);
    if (!gateOpen && db < 1.4 && (live.slash || talkOk())) {
      gateOpen = true;
      sfx.chime();
      pay(8, "bellgate");
      live.listen = "The bell rang. A latch clicked, far off.";
    }
    if (bar.current) bar.current.rotation.y += ((gateOpen ? 1.4 : 0) - bar.current.rotation.y) * (1 - Math.exp(-dt * 4));
    if (!gateOpen) {
      /* closed — still walkable, just a bar you notice */
    }
    if (Math.hypot(live.x - fence.x, live.z - fence.z) < 1.6)
      live.listen = live.listen || (gateOpen ? "The latch opened." : "A latch. The bell in town might reach it.");
  });
  return (
    <group>
      <mesh position={[BELL_AT.x, yb + 2.8, BELL_AT.z]}>
        <sphereGeometry args={[0.28, 8, 6]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <group ref={bar} position={[fence.x, yf + 0.7, fence.z]}>
        <mesh position={[0.7, 0, 0]}>
          <boxGeometry args={[1.5, 0.12, 0.12]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      </group>
    </group>
  );
}

function StackCrates() {
  const a = useRef({ x: TREE_TRUNK.x + 15.2, z: TREE_TRUNK.z + 1.4, y: 0 });
  const b = useRef({ x: TREE_TRUNK.x + 16.6, z: TREE_TRUNK.z + 1.4, y: 0 });
  const ga = useRef<THREE.Group>(null);
  const gb = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    for (const c of [a.current, b.current]) {
      const d = Math.hypot(live.x - c.x, live.z - c.z);
      if (d < 1.05 && Math.abs(live.speed) > 2 && live.carry !== "crate") {
        const fx = -Math.sin(live.yaw);
        const fz = -Math.cos(live.yaw);
        c.x += fx * 3.2 * dt;
        c.z += fz * 3.2 * dt;
      }
      addTrapSpot(c.x, c.z, 0.45, 0.5);
    }
    const stacked = Math.hypot(a.current.x - b.current.x, a.current.z - b.current.z) < 0.7;
    if (stacked) {
      addTrapSpot(a.current.x, a.current.z, 0.5, 1.05);
      pay(10, "stackcrate");
      live.listen = "You stacked them. Now you can climb.";
    }
    const ya = heightAt(a.current.x, a.current.z);
    const yb = heightAt(b.current.x, b.current.z);
    if (ga.current) ga.current.position.set(a.current.x, ya + 0.28, a.current.z);
    if (gb.current) gb.current.position.set(b.current.x, yb + 0.28 + (stacked ? 0.55 : 0), b.current.z);
    const near =
      Math.hypot(live.x - a.current.x, live.z - a.current.z) < 2 ||
      Math.hypot(live.x - b.current.x, live.z - b.current.z) < 2;
    if (near && !stacked) live.listen = live.listen || "Two crates. Stack them. Climb.";
  }, -2);
  return (
    <group>
      <group ref={ga}>
        <mesh>
          <boxGeometry args={[0.7, 0.55, 0.7]} />
          <meshLambertMaterial color="#8a5a28" />
        </mesh>
      </group>
      <group ref={gb}>
        <mesh>
          <boxGeometry args={[0.7, 0.55, 0.7]} />
          <meshLambertMaterial color="#7a4a22" />
        </mesh>
      </group>
    </group>
  );
}
