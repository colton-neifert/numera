import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, POND, pondSurfaceY, pondU } from "./field";
import { STALL, MILL_AT } from "./village";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { addTrapSpot } from "./dungeonTraps";
import { consumeTalk as consumeTalkRaw } from "../input";

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

const ISLE = { x: POND.x + 1.6, z: POND.z - 3.4 };

export function HushPlay() {
  return (
    <group>
      <PondIsle />
      <BookShelf />
      <ShadowStone />
      <SleepDawn />
      <CrackFloor />
      <DogDash />
      <NightCart />
    </group>
  );
}

function PondIsle() {
  const wy = pondSurfaceY();
  const y = wy + 0.28;
  useFrame(() => {
    if (live.house) return;
    const lift = y - heightAt(ISLE.x, ISLE.z);
    addTrapSpot(ISLE.x, ISLE.z, 1.55, lift);
    const d = Math.hypot(live.x - ISLE.x, live.z - ISLE.z);
    if (d < 1.2 && live.grounded && !live.swim) {
      pay(12, "pondisle");
      live.listen = "A tiny island. Nobody comes here. A chest.";
    }
    if (d < 1.2 && talkOk()) {
      pay(16, "islechest");
      live.listen = "Whoever hid this swam.";
    }
    if (pondU(live.x, live.z) > 0.3 && d < 5)
      live.listen = live.listen || "Something sticks out of the pond.";
  }, -2);
  return (
    <group position={[ISLE.x, y, ISLE.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.5, 10]} />
        <meshLambertMaterial color="#5a7a38" />
      </mesh>
      <mesh position={[0.2, 0.9, -0.2]}>
        <cylinderGeometry args={[0.08, 0.1, 1.6, 6]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[0.2, 1.7, -0.2]}>
        <sphereGeometry args={[0.45, 7, 5]} />
        <meshLambertMaterial color="#2a6a32" />
      </mesh>
      <mesh position={[-0.4, 0.22, 0.3]}>
        <boxGeometry args={[0.4, 0.28, 0.32]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function BookShelf() {
  useFrame(() => {
    if (live.house !== "yours") return;
    if (live.x > 0.9 && Math.abs(live.z) < 0.7 && talkOk()) {
      pay(9, "bookshelf");
      live.listen = "A book was hollow. Gran knows. She smiled anyway.";
    }
  });
  return null;
}

function ShadowStone() {
  const x = TREE_TRUNK.x + 14.2;
  const z = TREE_TRUNK.z - 8.4;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    const west = live.x < x - 0.6 && live.x > x - 2.4 && Math.abs(live.z - z) < 0.7;
    if (west && live.dusk > 0.45 && live.dusk < 0.78 && live.stillT > 0.7) {
      pay(12, "shadowstone");
      live.listen = "Your shadow hit the mark. The stone clicked.";
    }
    if (d < 1.8) live.listen = live.listen || "A stone with a mark. Wait for a long shadow.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.45, 1.4, 0.22]} />
        <meshLambertMaterial color="#6a6660" />
      </mesh>
      <mesh position={[-0.12, 0.85, 0.12]}>
        <circleGeometry args={[0.08, 8]} />
        <meshLambertMaterial color="#1a120c" />
      </mesh>
    </group>
  );
}

function SleepDawn() {
  const was = useRef(false);
  useFrame(() => {
    if (live.bed) was.current = true;
    if (was.current && !live.bed && live.house === "yours") {
      was.current = false;
      pay(8, "sleepdawn");
      live.listen = "You slept. The vale is a different color now.";
    }
  });
  return null;
}

function CrackFloor() {
  const x = MILL_AT.x + 4.8;
  const z = MILL_AT.z - 2.4;
  const y = heightAt(x, z);
  const gone = useRef(false);
  const g = useRef<THREE.Group>(null);
  const hole = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (live.house) return;
    const boom = live.lastBoom && Math.hypot(live.lastBoom.x - x, live.lastBoom.z - z) < 2.8;
    if (boom && !gone.current) {
      gone.current = true;
      pay(12, "crackfloor");
      live.listen = "The floor dropped. A hole. Something gleamed.";
      if (g.current) g.current.visible = false;
      if (hole.current) hole.current.visible = true;
    }
    if (gone.current && Math.hypot(live.x - x, live.z - z) < 1.1) {
      pay(14, "crackgem");
      live.listen = "It was under the boards.";
    }
    if (!gone.current && Math.hypot(live.x - x, live.z - z) < 1.8)
      live.listen = live.listen || "The ground is cracked. A bang would open it.";
  });
  return (
    <group>
      <group ref={g} position={[x, y + 0.04, z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0.2]}>
          <circleGeometry args={[0.7, 8]} />
          <meshLambertMaterial color="#5a4a3c" />
        </mesh>
        <mesh position={[0.1, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0.4]}>
          <planeGeometry args={[0.5, 0.08]} />
          <meshLambertMaterial color="#2a1810" />
        </mesh>
      </group>
      <mesh ref={hole} visible={false} position={[x, y + 0.12, z]}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshLambertMaterial color="#3ec878" />
      </mesh>
    </group>
  );
}

function DogDash() {
  const p = useRef({ x: TREE_TRUNK.x + 6.4, z: TREE_TRUNK.z + 10.2, go: false, t: 0 });
  const g = useRef<THREE.Group>(null);
  const goal = { x: TREE_TRUNK.x + 22, z: TREE_TRUNK.z + 12 };
  useFrame((_, dt) => {
    if (live.house) return;
    const d = p.current;
    const near = Math.hypot(live.x - d.x, live.z - d.z);
    if (!d.go && near < 2.2 && live.sprinting) {
      d.go = true;
      d.t = 14;
      live.listen = "The dog ran. Catch it at the fence.";
    }
    if (d.go) {
      d.t -= dt;
      d.x += (goal.x - d.x) * dt * 0.55;
      d.z += (goal.z - d.z) * dt * 0.55;
      if (Math.hypot(live.x - goal.x, live.z - goal.z) < 2.2 && d.t > 0) {
        d.go = false;
        pay(10, "dogdash");
        live.listen = "You beat the dog. It licked your hand.";
      } else if (d.t <= 0) {
        d.go = false;
        live.listen = "The dog won. It is waiting to try again.";
      }
    }
    if (g.current) g.current.position.set(d.x, heightAt(d.x, d.z) + 0.2, d.z);
    if (near < 1.8 && !d.go) live.listen = live.listen || "A dog. Run and it will race you.";
  });
  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[0.16, 6, 5]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[0.16, 0.08, 0.04]}>
        <sphereGeometry args={[0.1, 5, 4]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
    </group>
  );
}

function NightCart() {
  const x = STALL.x + 4.2;
  const z = STALL.z - 1.6;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const on = live.dusk > 0.5 && !live.house;
    if (g.current) g.current.visible = on;
    if (!on) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.5 && talkOk()) {
      pay(10, "nightcart");
      live.listen = "A night cart. He only comes when the bell-town is asleep.";
    }
    if (d < 1.8) live.listen = live.listen || "A cart that was not here by day.";
  });
  return (
    <group ref={g} position={[x, y, z]} visible={false}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.2, 0.5, 0.7]} />
        <meshLambertMaterial color="#3a3228" />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.16, 6, 5]} />
        <meshLambertMaterial color="#c9a06a" />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.08, 6, 5]} />
        <meshLambertMaterial color="#d8f080" emissive="#c8e050" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

