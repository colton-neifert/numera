import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, KEEP_Z } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
}

export function QuestPlay() {
  return (
    <group>
      <BramRace />
      <SelaFlower />
      <CrackKeep />
    </group>
  );
}

function BramRace() {
  const start = { x: TREE_TRUNK.x + 4.2, z: TREE_TRUNK.z + 12.4 };
  const goal = { x: TREE_TRUNK.x + 22.4, z: TREE_TRUNK.z + 12.4 };
  const p = useRef({ x: start.x, z: start.z, go: false, t: 0 });
  const g = useRef<THREE.Group>(null);
  const wrap = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (wrap.current) wrap.current.visible = Boolean(live.smashed.findbram) && !live.house;
    if (live.house || !live.smashed.findbram) return;
    const o = p.current;
    const d = Math.hypot(live.x - o.x, live.z - o.z);
    if (!o.go && d < 2.2 && live.sprinting) {
      o.go = true;
      o.t = 12;
      live.listen = "Bram ran. “Race you to the fence!!”";
    }
    if (o.go) {
      o.t -= dt;
      o.x += (goal.x - o.x) * dt * 0.7;
      o.z += (goal.z - o.z) * dt * 0.7;
      if (Math.hypot(live.x - goal.x, live.z - goal.z) < 2.2 && o.t > 0) {
        o.go = false;
        pay(12, "bramrace");
        live.listen = "You beat Bram. He is on the ground laughing.";
      } else if (o.t <= 0) {
        o.go = false;
        o.x = start.x;
        o.z = start.z;
        live.listen = "Bram won. “Again!!”";
      }
    }
    if (g.current) g.current.position.set(o.x, heightAt(o.x, o.z), o.z);
    if (d < 2 && !o.go && live.smashed.findbram) live.listen = live.listen || "Bram is bouncing. Run and he will race you.";
  });
  return (
    <group ref={wrap} visible={false}>
      <mesh position={[goal.x, heightAt(goal.x, goal.z) + 0.7, goal.z]}>
        <boxGeometry args={[0.08, 1.4, 0.08]} />
        <meshLambertMaterial color="#c42828" />
      </mesh>
      <group ref={g}>
        <mesh position={[0, 0.35, 0]}>
          <capsuleGeometry args={[0.12, 0.28, 3, 6]} />
          <meshLambertMaterial color="#3a5a88" />
        </mesh>
        <mesh position={[0, 0.68, 0]}>
          <sphereGeometry args={[0.13, 7, 6]} />
          <meshLambertMaterial color="#c9a06a" />
        </mesh>
      </group>
    </group>
  );
}

function SelaFlower() {
  useFrame(() => {
    if (live.house !== "yours") return;
    if (live.carry === "flower" && (live.nearNpc === "sela" || Math.hypot(live.x, live.z - 1.5) < 1.2)) {
      live.carry = null;
      pay(10, "selaflower");
      live.listen = "Sela put it in a cup. “Now I have two. One smooshed. One from you.”";
    }
  });
  return null;
}

function CrackKeep() {
  const x = 8.4;
  const z = KEEP_Z - 20;
  const y = heightAt(x, z);
  const gone = useRef(false);
  const wall = useRef<THREE.Group>(null);
  const gem = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (live.house) return;
    const boom = live.lastBoom && Math.hypot(live.lastBoom.x - x, live.lastBoom.z - z) < 3.2;
    if (boom && !gone.current) {
      gone.current = true;
      if (wall.current) wall.current.visible = false;
      if (gem.current) gem.current.visible = true;
      pay(14, "crackkeep");
      live.listen = "The wall fell in. A hole. The keep did not like that.";
      sfx.thud();
    }
    if (gone.current && Math.hypot(live.x - x, live.z - z) < 1.2) {
      pay(16, "keepgem");
      live.listen = "It was in the dark behind the bricks.";
    }
    if (!gone.current && Math.hypot(live.x - x, live.z - z) < 2.4)
      live.listen = live.listen || "The keep wall is cracked. A bang would open it.";
  });
  return (
    <group>
      <group ref={wall} position={[x, y + 1.1, z]}>
        <mesh>
          <boxGeometry args={[2.2, 2.2, 0.35]} />
          <meshLambertMaterial color="#6a6660" />
        </mesh>
        <mesh position={[0.2, 0.1, 0.2]} rotation={[0, 0, 0.4]}>
          <planeGeometry args={[0.8, 0.08]} />
          <meshLambertMaterial color="#2a1810" />
        </mesh>
      </group>
      <mesh ref={gem} visible={false} position={[x, y + 0.4, z + 0.6]}>
        <octahedronGeometry args={[0.16, 0]} />
        <meshLambertMaterial color="#3ec878" />
      </mesh>
    </group>
  );
}
