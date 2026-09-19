import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, DOCK, pondSurfaceY } from "./field";
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

const FALL = { x: TREE_TRUNK.x - 16.4, z: TREE_TRUNK.z + 26.2 };
const CAVE = { x: FALL.x, z: FALL.z + 6.4 };
const IVY = { x: FALL.x - 3.2, z: FALL.z + 1.4 };

export function adventLadders(): Ladder[] {
  return [{ id: "ivy", x: IVY.x, z: IVY.z, yaw: 0, h: 5.8, half: 0.62 }];
}

export function AdventPlay() {
  return (
    <group>
      <WaterfallCave />
      <BounceShroom />
      <PushBoulder />
      <DockFisher />
      <BottleNote />
      <OwlNight />
    </group>
  );
}

function WaterfallCave() {
  const y = heightAt(FALL.x, FALL.z);
  const cy = heightAt(CAVE.x, CAVE.z);
  const going = useRef<"" | "in" | "out">("");
  const t = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const dFall = Math.hypot(live.x - FALL.x, live.z - FALL.z);
    const dCave = Math.hypot(live.x - CAVE.x, live.z - CAVE.z);
    if (!going.current && !live.cave && dFall < 1.35 && Math.abs(live.z - FALL.z) < 1.1) {
      going.current = "in";
      t.current = 0;
      live.speed = 0;
    }
    if (!going.current && live.cave && dCave < 1.2 && live.z < CAVE.z - 2.4) {
      going.current = "out";
      t.current = 0;
      live.speed = 0;
    }
    if (going.current) {
      t.current += dt;
      const u = Math.min(1, t.current / 1.15);
      if (u < 0.5) live.roomFade = u / 0.5;
      else {
        live.roomFade = 1 - (u - 0.5) / 0.5;
        live.roomFadeOut = true;
      }
      live.speed = 0;
      if (u > 0.48 && u < 0.55) {
        if (going.current === "in") {
          live.x = CAVE.x;
          live.z = CAVE.z;
          live.y = cy + 0.2;
          live.cave = true;
          live.wetT = 3;
          pay(10, "fallcave");
          live.listen = "Behind the water. It is quiet in here.";
        } else {
          live.x = FALL.x;
          live.z = FALL.z - 1.6;
          live.y = y + 0.2;
          live.cave = false;
          live.wetT = 2;
        }
      }
      if (u >= 1) {
        going.current = "";
        live.roomFade = 0;
        live.roomFadeOut = false;
      }
    }
    if (live.cave) {
      live.dusk = Math.max(live.dusk, 0.82);
      if (dCave < 1.1 && talkOk()) {
        pay(14, "cavechest");
        live.listen = "Someone hid this. They did not come back.";
      }
    }
    if (dFall < 2.2 && !live.cave) live.listen = live.listen || "A waterfall. You can walk through.";
  }, 1);
  return (
    <group>
      {[-0.7, 0, 0.7].map((s) => (
        <mesh key={s} position={[FALL.x + s * 0.45, y + 2.1, FALL.z]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.55, 4.2, 0.12]} />
          <meshLambertMaterial color="#8ec8d8" transparent opacity={0.45} />
        </mesh>
      ))}
      <mesh position={[FALL.x, y + 4.1, FALL.z + 0.4]}>
        <boxGeometry args={[3.4, 1.2, 2.2]} />
        <meshLambertMaterial color="#5a4a3c" />
      </mesh>
      <group position={[CAVE.x, cy, CAVE.z]}>
        <mesh position={[0, 1.4, 2.4]}>
          <boxGeometry args={[4.6, 2.8, 0.4]} />
          <meshLambertMaterial color="#2a2218" />
        </mesh>
        {[-2.2, 2.2].map((s) => (
          <mesh key={s} position={[s, 1.4, 0.4]}>
            <boxGeometry args={[0.4, 2.8, 4.2]} />
            <meshLambertMaterial color="#2a2218" />
          </mesh>
        ))}
        <mesh position={[0, 2.85, 0.4]}>
          <boxGeometry args={[4.6, 0.3, 4.4]} />
          <meshLambertMaterial color="#1a140e" />
        </mesh>
        <mesh position={[0, 0.35, 0.6]}>
          <boxGeometry args={[0.55, 0.4, 0.4]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
        <mesh position={[0.8, 0.35, 1.2]}>
          <sphereGeometry args={[0.16, 6, 5]} />
          <meshLambertMaterial color="#68a050" emissive="#3a6a28" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
}

function BounceShroom() {
  const x = FALL.x + 4.6;
  const z = FALL.z - 2.2;
  const y = heightAt(x, z);
  const squash = useRef(1);
  useFrame((_, dt) => {
    if (live.house) return;
    addTrapSpot(x, z, 0.7, 0.55 * squash.current);
    const d = Math.hypot(live.x - x, live.z - z);
    const on = d < 0.7 && live.y < y + 1.4;
    squash.current += ((on ? 0.55 : 1) - squash.current) * (1 - Math.exp(-dt * 10));
    if (on && live.grounded) {
      live.boostY = 10.4;
      live.grounded = false;
      pay(8, "bounceshroom");
      live.listen = "The mushroom threw you. That is what they do.";
      sfx.jump();
    }
    if (d < 1.5) live.listen = live.listen || "A fat mushroom. Jump on it.";
  }, -2);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.44, 6]} />
        <meshLambertMaterial color="#efe4cc" />
      </mesh>
      <mesh position={[0, 0.52, 0]} scale={[1, squash.current, 1]}>
        <sphereGeometry args={[0.48, 8, 5]} />
        <meshLambertMaterial color="#c42828" />
      </mesh>
    </group>
  );
}

function PushBoulder() {
  const p = useRef({ x: TREE_TRUNK.x + 28.4, z: TREE_TRUNK.z + 8.2 });
  const g = useRef<THREE.Group>(null);
  const gem = { x: TREE_TRUNK.x + 32.2, z: TREE_TRUNK.z + 8.2 };
  useFrame((_, dt) => {
    if (live.house || !g.current) return;
    const b = p.current;
    const d = Math.hypot(live.x - b.x, live.z - b.z);
    if (d < 1.25 && Math.abs(live.speed) > 2.4) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      b.x += fx * 3.6 * dt;
      b.z += fz * 3.6 * dt;
      pay(7, "pushrock");
      live.listen = "It rolled. Something was behind it.";
    }
    g.current.position.set(b.x, heightAt(b.x, b.z) + 0.55, b.z);
    if (Math.hypot(live.x - gem.x, live.z - gem.z) < 1.1 && Math.hypot(b.x - gem.x, b.z - gem.z) > 1.6) {
      pay(12, "rockgem");
      live.listen = "A rupee the rock was sitting on.";
    }
    if (d < 1.7) live.listen = live.listen || "A rock in the path. Push.";
  });
  return (
    <group>
      <group ref={g}>
        <mesh>
          <dodecahedronGeometry args={[0.7, 0]} />
          <meshLambertMaterial color="#6a5a4c" />
        </mesh>
      </group>
      <mesh position={[gem.x, heightAt(gem.x, gem.z) + 0.12, gem.z]}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshLambertMaterial color="#3ec878" />
      </mesh>
    </group>
  );
}

function DockFisher() {
  const x = DOCK.x + 0.8;
  const z = DOCK.z + 0.4;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.4 && talkOk()) {
      pay(6, "dockfisher");
      live.listen = "Bite yet? He shook his head. Then the line jumped.";
    }
    if (d < 1.8) live.listen = live.listen || "Someone is fishing. They have been here a while.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.9, 6]} />
        <meshLambertMaterial color="#3a5a8a" />
      </mesh>
      <mesh position={[0, 1.22, 0]}>
        <sphereGeometry args={[0.16, 6, 5]} />
        <meshLambertMaterial color="#c9a06a" />
      </mesh>
      <mesh position={[0.35, 1.15, 0.2]} rotation={[0, 0, -0.6]}>
        <cylinderGeometry args={[0.02, 0.02, 1.6, 4]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
    </group>
  );
}

function BottleNote() {
  const x = DOCK.x + 3.4;
  const z = DOCK.z + 2.8;
  const g = useRef<THREE.Group>(null);
  const got = useRef(false);
  const wy = pondSurfaceY();
  useFrame((_, dt) => {
    if (got.current) return;
    const bob = Math.sin(live.playT * 1.4) * 0.06;
    if (g.current) g.current.position.set(x, wy + 0.08 + bob, z);
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.2 && (talkOk() || live.wetT > 0.3)) {
      got.current = true;
      pay(9, "bottlenote");
      live.listen = "A note in a bottle. It says: look behind the water.";
      if (g.current) g.current.visible = false;
    }
    if (d < 1.7) live.listen = live.listen || "A bottle. Something is in it.";
  });
  return (
    <group ref={g}>
      <mesh rotation={[0.3, 0, 0.2]}>
        <cylinderGeometry args={[0.07, 0.08, 0.28, 6]} />
        <meshLambertMaterial color="#8ec8a8" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function OwlNight() {
  const p = useRef({ x: TREE_TRUNK.x - 6, z: TREE_TRUNK.z - 8, a: 0 });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house || live.dusk < 0.55) {
      if (g.current) g.current.visible = false;
      return;
    }
    if (g.current) g.current.visible = true;
    const o = p.current;
    const d = Math.hypot(live.x - o.x, live.z - o.z);
    if (d < 8) {
      o.a += dt;
      o.x += Math.cos(o.a) * dt * 1.4;
      o.z += Math.sin(o.a * 0.7) * dt * 1.4;
    }
    if (g.current) g.current.position.set(o.x, heightAt(o.x, o.z) + 3.4 + Math.sin(live.playT * 2) * 0.2, o.z);
    if (d < 2.2) {
      pay(8, "owlnight");
      live.listen = "The owl waited. Then it flew toward the water.";
    }
  });
  return (
    <group ref={g} visible={false}>
      <mesh>
        <sphereGeometry args={[0.18, 6, 5]} />
        <meshLambertMaterial color="#c9b48a" />
      </mesh>
      <mesh position={[0.12, 0.04, 0]}>
        <sphereGeometry args={[0.1, 5, 4]} />
        <meshLambertMaterial color="#c9b48a" />
      </mesh>
    </group>
  );
}
