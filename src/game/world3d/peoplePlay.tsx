import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, FLAG_AT, KEEP_Z } from "./field";
import { STALL, MILL_AT } from "./village";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
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

let flagOn = true;

export function peopleLadders(): Ladder[] {
  if (!flagOn) return [];
  const { x, z } = FLAG_AT;
  return [{ id: "flagpole", x, z, yaw: 0, h: 7.2, half: 0.55 }];
}

export function PeoplePlay() {
  return (
    <group>
      <WaveBack />
      <SitBeside />
      <LostHat />
      <CrateShop />
      <KidRace />
      <YardCat />
      <DogDig />
      <CuccoRoof />
      <CrackWall />
      <FlagTop />
      <FlowerGift />
    </group>
  );
}

function WaveBack() {
  useFrame(() => {
    if (live.house || live.nearNpc) return;
    const fx = -Math.sin(live.yaw);
    const fz = -Math.cos(live.yaw);
    for (const [id, p] of Object.entries(live.npcPos)) {
      if (!p) continue;
      const dx = p.x - live.x;
      const dz = p.z - live.z;
      const d = Math.hypot(dx, dz);
      if (d > 3.2 && d < 9 && live.stillT > 0.45) {
        const face = (dx * fx + dz * fz) / d;
        if (face > 0.55) {
          live.npcMood[id] = "smile";
          pay(5, "waveback");
          live.listen = "They waved back.";
        }
      }
    }
  });
  return null;
}

function SitBeside() {
  useFrame(() => {
    if (live.house || !live.sit) return;
    for (const [id, p] of Object.entries(live.npcPos)) {
      if (!p) continue;
      const d = Math.hypot(live.x - p.x, live.z - p.z);
      if (d < 1.6) {
        live.npcMood[id] = "smile";
        pay(6, "sitbeside");
        live.listen = "You sat. They scooted over.";
      }
    }
  });
  return null;
}

function LostHat() {
  const p = useRef({ x: TREE_TRUNK.x + 6.4, z: TREE_TRUNK.z + 14.8, held: false, given: false });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house || p.current.given) return;
    const h = p.current;
    if (!h.held) {
      h.x += Math.sin(live.playT) * dt * 0.15;
      const d = Math.hypot(live.x - h.x, live.z - h.z);
      if (d < 1.1 && (talkOk() || live.slash)) h.held = true;
      if (d < 1.5) live.listen = live.listen || "A hat in the grass. Someone lost it.";
    } else {
      h.x = live.x;
      h.z = live.z - 0.4;
      for (const [id, np] of Object.entries(live.npcPos)) {
        if (!np || id === "rook") continue;
        if (Math.hypot(live.x - np.x, live.z - np.z) < 1.6) {
          h.given = true;
          live.npcMood[id] = "smile";
          pay(10, "losthat");
          live.listen = "My hat! The wind took it.";
          break;
        }
      }
    }
    if (g.current) {
      g.current.visible = !h.given;
      g.current.position.set(h.x, heightAt(h.x, h.z) + (h.held ? 1.2 : 0.12), h.z);
    }
  });
  return (
    <group ref={g}>
      <mesh>
        <cylinderGeometry args={[0.18, 0.22, 0.12, 8]} />
        <meshLambertMaterial color="#3a5a8a" />
      </mesh>
    </group>
  );
}

function CrateShop() {
  useFrame(() => {
    if (live.house || live.carry !== "crate") return;
    const d = Math.hypot(live.x - STALL.x, live.z - STALL.z);
    if (d < 2.2) {
      live.carry = null;
      pay(10, "crateshop");
      live.listen = "They took the crate. Thanks. It was heavy.";
      live.npcMood.shopkeep = "smile";
    }
    if (d < 4) live.listen = live.listen || "The shop could use this crate.";
  });
  return null;
}

function KidRace() {
  const on = useRef(false);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const tess = live.npcPos.tess ?? live.npcPos.oak6;
    if (!on.current && tess && Math.hypot(live.x - tess.x, live.z - tess.z) < 2.4 && live.sprinting) {
      on.current = true;
      t.current = 18;
      live.listen = "Race you to the mill!";
      live.npcMood.tess = "smile";
    }
    if (on.current) {
      t.current -= dt;
      const d = Math.hypot(live.x - MILL_AT.x, live.z - MILL_AT.z);
      if (d < 3.4) {
        on.current = false;
        pay(12, "kidrace");
        live.listen = t.current > 0 ? "You won. They are breathing hard." : "They got there. Barely.";
      }
      if (t.current <= 0 && d >= 3.4) {
        on.current = false;
        live.listen = "They won. Rematch anytime.";
      }
    }
  });
  return null;
}

function YardCat() {
  const p = useRef({ x: TREE_TRUNK.x - 8.4, z: TREE_TRUNK.z + 12.2, a: 0 });
  const hole = { x: TREE_TRUNK.x - 11.2, z: TREE_TRUNK.z + 15.4 };
  const g = useRef<THREE.Group>(null);
  const shown = useRef(false);
  const holeMesh = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const c = p.current;
    const d = Math.hypot(live.x - c.x, live.z - c.z);
    if (d < 3.4) {
      c.a += dt;
      c.x += (hole.x - c.x) * dt * 0.6;
      c.z += (hole.z - c.z) * dt * 0.6;
      shown.current = true;
      if (holeMesh.current) holeMesh.current.visible = true;
    }
    if (g.current) g.current.position.set(c.x, heightAt(c.x, c.z) + 0.18, c.z);
    if (shown.current && Math.hypot(live.x - hole.x, live.z - hole.z) < 1.2) {
      pay(10, "cathole");
      live.listen = "The cat knew. A rupee in the hole.";
    }
    if (d < 2) live.listen = live.listen || "A cat. It wants you to follow.";
  });
  return (
    <group>
      <group ref={g}>
        <mesh>
          <sphereGeometry args={[0.14, 6, 5]} />
          <meshLambertMaterial color="#c9a06a" />
        </mesh>
        <mesh position={[0.12, 0.1, 0]}>
          <sphereGeometry args={[0.09, 5, 4]} />
          <meshLambertMaterial color="#c9a06a" />
        </mesh>
      </group>
      <mesh ref={holeMesh} visible={false} position={[hole.x, heightAt(hole.x, hole.z) + 0.02, hole.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 8]} />
        <meshLambertMaterial color="#1a120c" />
      </mesh>
    </group>
  );
}

function DogDig() {
  const x = TREE_TRUNK.x + 10.2;
  const z = TREE_TRUNK.z + 18.6;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.3 && live.stillT > 1.1) {
      pay(8, "dogdig");
      live.listen = "The dog dug. You waited. There was a rupee.";
    }
    if (d < 1.7) live.listen = live.listen || "A dog is digging. Wait.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.16, 6, 5]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0.16, 0.22, 0.06]}>
        <sphereGeometry args={[0.1, 5, 4]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function CuccoRoof() {
  useFrame(() => {
    if (live.house || live.carry !== "cucco") return;
    if (!live.grounded && live.y > heightAt(live.x, live.z) + 1.8) {
      pay(8, "cuccoroof");
      live.listen = "The chicken glided. Roofs are easy this way.";
    }
  });
  return null;
}

function CrackWall() {
  const x = 4.2;
  const z = KEEP_Z - 18;
  const y = heightAt(x, z);
  const gone = useRef(false);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (live.house || gone.current) return;
    const d = Math.hypot(live.x - x, live.z - z);
    const boom = live.lastBoom && Math.hypot(live.lastBoom.x - x, live.lastBoom.z - z) < 3.2;
    if (boom || (live.slash && d < 1.4 && live.holding === "bomb")) {
      gone.current = true;
      pay(12, "crackwall");
      live.listen = "The wall was cracked. Something was behind it.";
      if (g.current) g.current.visible = false;
    }
    if (d < 2.2) live.listen = live.listen || "A cracked wall. A bang would open it.";
  });
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[2.4, 2.2, 0.45]} />
        <meshLambertMaterial color="#6a5a4c" />
      </mesh>
      <mesh position={[0.2, 1.2, 0.24]}>
        <boxGeometry args={[0.08, 1.4, 0.04]} />
        <meshLambertMaterial color="#2a2218" />
      </mesh>
    </group>
  );
}

function FlagTop() {
  const { x, z } = FLAG_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.4 && live.y > y + 5.4) {
      pay(10, "flagtop");
      live.listen = "The whole vale. The flag is loud up here.";
    }
    if (d < 1.8 && live.y < y + 2) live.listen = live.listen || "A flagpole. You can climb it.";
  });
  return (
    <mesh position={[x, y + 7.1, z]}>
      <boxGeometry args={[0.7, 0.4, 0.12]} />
      <meshLambertMaterial color="#c42828" />
    </mesh>
  );
}

function FlowerGift() {
  useFrame(() => {
    if (live.house || live.carry !== "flower" || !live.nearNpc) return;
    if (live.stillT > 0.55) {
      live.carry = null;
      live.npcMood[live.nearNpc] = "smile";
      pay(8, "flowergift");
      live.listen = "For me? They put it in their pocket. It will not last. They know.";
    }
  });
  return null;
}

