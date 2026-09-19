import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, TREE_HOME, TREE_HOUSE_H, TREE_LADDER, TREE_HD, TREE_DECK_D, DOCK, WELL_AT, pondU, POND } from "./field";
import { FOUNTAIN, HAY, STALL, MILL_AT, PADDOCK, FIRE_PIT, WAGON_AT } from "./village";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { addTrapSpot, beginTrapFrame } from "./dungeonTraps";
import { consumeTalk as consumeTalkRaw, consumeJump } from "../input";
import type { Ladder } from "./climb";

/**
 * Real-life toys around home and town. Things a person would try:
 * water a dry plant, ram a stuck door, knock apples, tip a dock, kick a barrel.
 */

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

const vineAt = { x: TREE_TRUNK.x + 7.4, z: TREE_TRUNK.z + 15.2 };
const shedAt = { x: TREE_TRUNK.x - 11.6, z: TREE_TRUNK.z + 5.2 };
const appleAt = { x: TREE_TRUNK.x + 6.8, z: TREE_TRUNK.z - 5.4 };
const postAt = { x: TREE_TRUNK.x + 19.4, z: TREE_TRUNK.z + 19.6 };
const barrelAt = { x: TREE_TRUNK.x - 8.2, z: TREE_TRUNK.z + 11.4 };

let vineUp = false;

export function extraLadders(): Ladder[] {
  if (!vineUp) return [];
  return [{ id: "vine", x: vineAt.x, z: vineAt.z, yaw: 0, h: 6.4, half: 0.72 }];
}

export function RealPlay() {
  return (
    <group>
      <FieldBegin />
      <WaterVine />
      <StuckShed />
      <HomeApples />
      <BoomPost />
      <TipDock />
      <KickBarrel />
      <DoorMat />
      <LeafPile />
      <WellBucket />
      <LatchGate />
      <CartStep />
      <LooseStone />
      <StickNest />
      <HomeInside />
      <DeckToys />
      <PathPuddle />
      <MailPeek />
      <LineHide />
      <FountainWish />
      <HayDive />
      <WindowPie />
      <RoofBall />
      <BroomFind />
      <DoorKnock />
      <SeeSaw />
      <ShoreSkip />
      <MillRide />
      <FenceHop />
      <HorseApple />
      <FireStick />
      <OakSwing />
      <KnotHole />
      <HandFish />
      <DinnerBell />
      <WagonHide />
    </group>
  );
}

export function LiveToys() {
  return (
    <group>
      <ShopBell />
    </group>
  );
}

function FieldBegin() {
  useEffect(
    () => () => {
      vineUp = false;
    },
    [],
  );
  useFrame(() => {
    beginTrapFrame();
  }, -3);
  return null;
}

function WaterVine() {
  const grow = useRef(0);
  const g = useRef<THREE.Group>(null);
  const y = heightAt(vineAt.x, vineAt.z);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - vineAt.x, live.z - vineAt.z);
    const wet = live.wetT > 0.5 || pondU(live.x, live.z) > 0.2;
    if (!vineUp && d < 1.45 && wet && (live.stompT > 0 || live.slash || talkOk())) {
      vineUp = true;
      sfx.ok();
      pay(6, "watervine");
      live.listen = "The plant drank.";
    }
    if (vineUp) grow.current = Math.min(1, grow.current + dt * 1.1);
    if (g.current) g.current.scale.y = 0.12 + grow.current * 0.88;
    if (vineUp && grow.current > 0.9) {
      addTrapSpot(vineAt.x, vineAt.z - 0.85, 0.9, y + 5.6 - heightAt(vineAt.x, vineAt.z - 0.85));
    }
    if (d < 1.8 && !vineUp) live.listen = live.listen || "A thirsty plant. The creek is close.";
    if (vineUp && live.climbing === "vine" && live.climbH > 4.6) pay(12, "vinenest");
  }, -2);
  return (
    <group position={[vineAt.x, y, vineAt.z]}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.22, 7]} />
        <meshLambertMaterial color={vineUp ? "#3a6a32" : "#6a4a28"} />
      </mesh>
      <group ref={g} position={[0, 0.1, 0]} scale={[1, 0.12, 1]}>
        <mesh position={[0, 2.7, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.14, 5.4, 6]} />
          <meshLambertMaterial color="#2a5a28" />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.sin(i * 1.4) * 0.35, 1.2 + i * 0.9, Math.cos(i * 1.4) * 0.35]} rotation={[0.4, i, 0.2]}>
            <sphereGeometry args={[0.28, 6, 5]} />
            <meshLambertMaterial color="#3a8a38" />
          </mesh>
        ))}
      </group>
      {vineUp ? (
        <mesh position={[0, 5.7, -0.7]}>
          <sphereGeometry args={[0.32, 6, 5]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      ) : null}
    </group>
  );
}

function StuckShed() {
  const open = useRef(0);
  const door = useRef<THREE.Group>(null);
  const got = useRef(false);
  const y = heightAt(shedAt.x, shedAt.z);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - shedAt.x, live.z - (shedAt.z + 1.55));
    const into = live.z > shedAt.z + 0.4 && d < 1.35;
    if (open.current < 1 && into && Math.abs(live.speed) > 9.2 && live.grounded) {
      open.current = 1;
      sfx.thud();
      live.knock = { vx: 0, vz: 6, t: 0.25 };
      pay(8, "ramshed");
      live.listen = "The door was stuck. Your shoulder was not.";
    }
    if (open.current >= 1) {
      addTrapSpot(shedAt.x, shedAt.z, 1.45, 0.12);
      if (!got.current && Math.hypot(live.x - shedAt.x, live.z - shedAt.z) < 1.05 && live.z < shedAt.z + 0.4) {
        got.current = true;
        pay(14, "shedchest");
      }
    } else if (d < 1.8) {
      live.listen = live.listen || "A shed. The door does not want to move.";
    }
    if (door.current) door.current.rotation.y = open.current * 1.45;
  }, -2);
  return (
    <group position={[shedAt.x, y, shedAt.z]}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[2.6, 2.3, 2.4]} />
        <meshLambertMaterial color="#6a4e32" />
      </mesh>
      <mesh position={[0, 2.45, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.05, 0.7, 4]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
      <group ref={door} position={[0.7, 0.95, 1.22]}>
        <mesh position={[-0.7, 0, 0]}>
          <boxGeometry args={[1.35, 1.85, 0.08]} />
          <meshLambertMaterial color="#5a3e28" />
        </mesh>
      </group>
    </group>
  );
}

function HomeApples() {
  const drops = useRef<{ x: number; z: number; y: number; vy: number; got: boolean }[]>([]);
  const left = useRef(4);
  const g = useRef<THREE.Group>(null);
  const y = heightAt(appleAt.x, appleAt.z);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - appleAt.x, live.z - appleAt.z);
    const hit =
      (live.slash && Math.hypot(live.slash.x - appleAt.x, live.slash.z - appleAt.z) < 1.8) ||
      (d < 1.35 && (live.rolling || Math.abs(live.speed) > 10));
    if (hit && left.current > 0) {
      left.current -= 1;
      const a = Math.random() * Math.PI * 2;
      drops.current.push({
        x: appleAt.x + Math.cos(a) * 0.7,
        z: appleAt.z + Math.sin(a) * 0.7,
        y: y + 2.4,
        vy: 0,
        got: false,
      });
      sfx.rustle();
      if (live.slash) live.slash = null;
    }
    for (const p of drops.current) {
      if (p.got) continue;
      p.vy -= 28 * dt;
      p.y += p.vy * dt;
      const gy = heightAt(p.x, p.z) + 0.12;
      if (p.y < gy) {
        p.y = gy;
        p.vy = 0;
      }
      if (Math.hypot(live.x - p.x, live.z - p.z) < 0.85 && Math.abs(live.y - p.y) < 1.2) {
        p.got = true;
        useGame.getState().addApple();
        sfx.ok();
        pay(4, "homeapple");
      }
    }
    if (g.current) {
      g.current.children.forEach((c: THREE.Object3D, i: number) => {
        const p = drops.current[i];
        if (!p || p.got) {
          c.visible = false;
          return;
        }
        c.visible = true;
        c.position.set(p.x - appleAt.x, p.y - y, p.z - appleAt.z);
      });
    }
    if (d < 2.2 && left.current > 0) live.listen = live.listen || "Apples. Hit the tree, or run into it.";
  });
  return (
    <group position={[appleAt.x, y, appleAt.z]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 1.4, 6]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[1.05, 8, 6]} />
        <meshLambertMaterial color="#3a6a32" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.sin(i * 1.7) * 0.45, 1.7, Math.cos(i * 1.7) * 0.45]}>
          <sphereGeometry args={[0.12, 6, 5]} />
          <meshLambertMaterial color="#c42838" />
        </mesh>
      ))}
      <group ref={g}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} visible={false}>
            <sphereGeometry args={[0.13, 6, 5]} />
            <meshLambertMaterial color="#c42838" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function BoomPost() {
  const got = useRef(false);
  const y = heightAt(postAt.x, postAt.z);
  const ditch = postAt.z - 2.4;
  useFrame(() => {
    if (live.house || got.current) return;
    const hit =
      live.booms.some((b) => Math.hypot(b.x - postAt.x, b.z - postAt.z) < 1.1) ||
      live.arrows.some((a) => Math.hypot(a.x - postAt.x, a.z - postAt.z) < 0.9) ||
      Math.hypot(live.x - postAt.x, live.z - postAt.z) < 0.7;
    if (hit) {
      got.current = true;
      pay(10, "boompost");
    }
    if (Math.abs(live.z - ditch) < 1.1 && Math.abs(live.x - postAt.x) < 2.4 && live.grounded) {
      live.wetT = Math.max(live.wetT, 1.6);
    }
    if (Math.hypot(live.x - postAt.x, live.z - (postAt.z + 2.2)) < 2.4) {
      live.listen = live.listen || "A coin on a post. The ditch is in the way.";
    }
  });
  return (
    <group>
      <mesh position={[postAt.x, heightAt(postAt.x, ditch) + 0.04, ditch]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.2, 2.1]} />
        <meshLambertMaterial color="#4a7a88" transparent opacity={0.55} />
      </mesh>
      <mesh position={[postAt.x, y + 1.05, postAt.z]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 2.1, 6]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      {!got.current ? (
        <mesh position={[postAt.x, y + 2.15, postAt.z]}>
          <octahedronGeometry args={[0.18, 0]} />
          <meshLambertMaterial color="#2ec8a0" emissive="#2ec8a0" emissiveIntensity={0.45} />
        </mesh>
      ) : null}
    </group>
  );
}

function TipDock() {
  const tilt = useRef(0);
  const g = useRef<THREE.Group>(null);
  const y = heightAt(DOCK.x, DOCK.z);
  const end = { x: DOCK.x - 2.6, z: DOCK.z };
  useFrame((_, dt) => {
    if (live.house) return;
    const onEnd = Math.hypot(live.x - end.x, live.z - end.z) < 1.15 && live.y < y + 1.4;
    const onNear = Math.hypot(live.x - DOCK.x, live.z - DOCK.z) < 1.1;
    const crate = live.carry === "crate" && onNear;
    const want = onEnd && !crate ? 0.42 : 0;
    tilt.current += (want - tilt.current) * (1 - Math.exp(-dt * 5));
    if (g.current) g.current.rotation.z = tilt.current;
    if (onEnd && tilt.current > 0.28 && live.grounded) {
      live.x += (end.x - DOCK.x) * dt * 2.4;
      live.wetT = Math.max(live.wetT, 3);
      if (live.y > pondU(live.x, live.z) && tilt.current > 0.35) {
        live.boostY = -1;
      }
      pay(5, "tipdock");
    }
    if (onEnd) live.listen = live.listen || "The dock leans. Something heavy on the land side would help.";
  });
  return (
    <group ref={g} position={[DOCK.x - 1.2, y + 0.18, DOCK.z]}>
      <mesh rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[4.4, 0.14, 1.35]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function KickBarrel() {
  const p = useRef({ x: barrelAt.x, z: barrelAt.z, vx: 0, vz: 0, spin: 0, broke: false });
  const g = useRef<THREE.Group>(null);
  const crate = { x: barrelAt.x + 6.4, z: barrelAt.z + 8.2 };
  useFrame((_, dt) => {
    if (live.house || !g.current) return;
    const b = p.current;
    const d = Math.hypot(live.x - b.x, live.z - b.z);
    if (!b.broke && Math.abs(live.speed) > 2.2 && d < 1.05) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      b.vx += fx * 18 * dt * 8;
      b.vz += fz * 18 * dt * 8;
    }
    b.x += b.vx * dt;
    b.z += b.vz * dt;
    b.vx *= Math.exp(-dt * 0.55);
    b.vz *= Math.exp(-dt * 0.55);
    b.spin += Math.hypot(b.vx, b.vz) * dt * 2.2;
    const gy = heightAt(b.x, b.z) + 0.42;
    g.current.position.set(b.x, gy, b.z);
    g.current.rotation.x = b.spin;
    if (!b.broke && Math.hypot(b.x - crate.x, b.z - crate.z) < 1.15 && Math.hypot(b.vx, b.vz) > 2) {
      b.broke = true;
      b.vx = 0;
      b.vz = 0;
      sfx.smash();
      pay(12, "barrelcrate");
    }
    if (d < 1.8 && !b.broke) live.listen = live.listen || "A barrel. It rolls if you bump it. You can also get in.";
    if (!b.broke && d < 0.82 && Math.abs(live.speed) < 0.8 && live.grounded) {
      live.hideGrass = true;
      live.x = b.x;
      live.z = b.z;
      pay(7, "barrelhide");
      live.listen = "You fit. Barely.";
    }
    if (b.broke) g.current.visible = false;
  }, 1);
  const cy = heightAt(crate.x, crate.z);
  return (
    <group>
      <group ref={g} position={[barrelAt.x, 1, barrelAt.z]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.7, 8]} />
          <meshLambertMaterial color="#8a5a28" />
        </mesh>
      </group>
      <mesh position={[crate.x, cy + 0.45, crate.z]} castShadow visible={!p.current.broke}>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshLambertMaterial color="#7a5a38" />
      </mesh>
    </group>
  );
}

function DoorMat() {
  const up = useRef(false);
  const g = useRef<THREE.Group>(null);
  const y = heightAt(TREE_LADDER.x, TREE_LADDER.z);
  const x = TREE_LADDER.x;
  const z = TREE_LADDER.z + 1.15;
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.15) {
      live.listen = live.listen || (up.current ? "The mat is flipped." : "A mat at the bottom of the ladder.");
      if (!up.current && talkOk()) {
        up.current = true;
        pay(10, "doormat");
        live.listen = "It was under the mat.";
      }
    }
    if (g.current) g.current.rotation.x = up.current ? 1.15 : 0;
  });
  return (
    <group ref={g} position={[x, y + 0.03, z]} rotation={[0, 0.12, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.15, 0.7]} />
        <meshLambertMaterial color="#6a3a2a" />
      </mesh>
    </group>
  );
}

function LeafPile() {
  const gone = useRef(false);
  const g = useRef<THREE.Group>(null);
  const x = TREE_TRUNK.x + 2.2;
  const z = TREE_TRUNK.z + 8.4;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || gone.current) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.35 && (live.stompT > 0 || live.rolling || !live.grounded)) {
      gone.current = true;
      sfx.rustle();
      pay(7, "leafpile");
      live.listen = "Leaves. And something that was not a leaf.";
      if (g.current) g.current.visible = false;
    }
    if (d < 1.8) live.listen = live.listen || "A pile of leaves.";
  });
  return (
    <group ref={g} position={[x, y + 0.22, z]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.sin(i * 1.5) * 0.32, (i % 3) * 0.08, Math.cos(i * 1.5) * 0.32]} castShadow>
          <sphereGeometry args={[0.28, 6, 5]} />
          <meshLambertMaterial color={i % 2 ? "#c45c28" : "#8a6a28"} />
        </mesh>
      ))}
    </group>
  );
}

function WellBucket() {
  const u = useRef(0);
  const dir = useRef(0);
  const got = useRef(false);
  const bucket = useRef<THREE.Group>(null);
  const y = heightAt(WELL_AT.x, WELL_AT.z);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - WELL_AT.x, live.z - WELL_AT.z);
    if (d < 1.7 && talkOk() && dir.current === 0) {
      dir.current = u.current < 0.2 ? 1 : -1;
      sfx.ok();
    }
    if (dir.current !== 0) {
      u.current += dir.current * dt * 0.7;
      if (u.current >= 1) {
        u.current = 1;
        dir.current = 0;
      }
      if (u.current <= 0) {
        u.current = 0;
        dir.current = 0;
        if (!got.current) {
          got.current = true;
          pay(11, "wellbucket");
          live.listen = "The bucket brought something up.";
        }
      }
    }
    if (bucket.current) bucket.current.position.y = 0.4 - u.current * 3.4;
    if (d < 1.9) live.listen = live.listen || "A bucket on a rope. You can lower it.";
  });
  return (
    <group position={[WELL_AT.x, y, WELL_AT.z]}>
      <group ref={bucket} position={[0.35, 0.4, 0]}>
        <mesh>
          <cylinderGeometry args={[0.16, 0.14, 0.22, 8]} />
          <meshLambertMaterial color="#5a3a22" />
        </mesh>
      </group>
    </group>
  );
}

function LatchGate() {
  const open = useRef(false);
  const x = TREE_TRUNK.x + 16.4;
  const z = TREE_TRUNK.z + 34.2;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (live.house) return;
    const near = Math.abs(live.x - x) < 1.8 && Math.abs(live.z - z) < 1.15;
    if (!open.current && Math.abs(live.z - z) < 0.42 && Math.abs(live.x - x) < 1.35) {
      if (Math.abs(live.speed) > 3.2 || talkOk()) {
        open.current = true;
        sfx.ok();
        pay(6, "latchgate");
        live.listen = "The latch lifted.";
      } else {
        live.z = z + (live.z >= z ? 0.45 : -0.45);
        live.speed *= 0.35;
        live.listen = "A latch. Push, or lift it.";
      }
    }
    if (near && live.slash && !open.current) {
      live.listen = "The latch is on top. A sword does not lift a latch.";
    }
    if (near && talkOk()) {
      open.current = true;
      sfx.ok();
      pay(6, "latchgate");
      live.listen = "The latch lifted.";
    }
    if (g.current) g.current.rotation.y = open.current ? 1.4 : 0;
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[-1.35, 0.7, 0]} castShadow>
        <boxGeometry args={[0.16, 1.4, 0.16]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
      <mesh position={[1.35, 0.7, 0]} castShadow>
        <boxGeometry args={[0.16, 1.4, 0.16]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
      <group ref={g} position={[-1.28, 0.75, 0]}>
        <mesh position={[1.28, 0, 0]} castShadow>
          <boxGeometry args={[2.4, 1.15, 0.1]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
        <mesh position={[2.2, 0.28, 0.08]}>
          <boxGeometry args={[0.18, 0.12, 0.08]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      </group>
    </group>
  );
}

function CartStep() {
  const c = useRef({ x: TREE_TRUNK.x + 1.2, z: TREE_TRUNK.z + 11.6, vx: 0, vz: 0 });
  const bag = { x: TREE_TRUNK.x + 4.8, z: TREE_TRUNK.z + 11.6 };
  const got = useRef(false);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const p = c.current;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (Math.abs(live.speed) > 0.8 && d < 1.15 && !live.mounted) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      p.vx += fx * 18 * dt;
      p.vz += fz * 18 * dt;
    }
    p.x += p.vx * dt;
    p.z += p.vz * dt;
    p.vx *= Math.exp(-dt * 3.4);
    p.vz *= Math.exp(-dt * 3.4);
    addTrapSpot(p.x, p.z, 0.85, 0.72);
    if (g.current) g.current.position.set(p.x, heightAt(p.x, p.z) + 0.38, p.z);
    const onCart = Math.hypot(live.x - p.x, live.z - p.z) < 0.9 && live.y > heightAt(p.x, p.z) + 0.5;
    const underBag = Math.hypot(p.x - bag.x, p.z - bag.z) < 1.05;
    if (!got.current && onCart && underBag && (talkOk() || live.slash)) {
      got.current = true;
      pay(12, "cartbag");
      live.listen = "You stood on the cart. The bag was not high anymore.";
    }
    if (d < 2 && !got.current) live.listen = live.listen || "A cart. A bag hangs over there.";
  }, -2);
  const by = heightAt(bag.x, bag.z);
  return (
    <group>
      <group ref={g}>
        <mesh castShadow>
          <boxGeometry args={[1.35, 0.55, 0.85]} />
          <meshLambertMaterial color="#7a5a38" />
        </mesh>
        {[-0.4, 0.4].map((sx) => (
          <mesh key={sx} position={[sx, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.08, 8]} />
            <meshLambertMaterial color="#3a3228" />
          </mesh>
        ))}
      </group>
      <mesh position={[bag.x, by + 2.35, bag.z]}>
        <sphereGeometry args={[0.22, 6, 5]} />
        <meshLambertMaterial color="#8a3a28" />
      </mesh>
      <mesh position={[bag.x, by + 2.7, bag.z]}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 4]} />
        <meshLambertMaterial color="#5a4a38" />
      </mesh>
    </group>
  );
}

function LooseStone() {
  const up = useRef(false);
  const x = TREE_TRUNK.x + 9.4;
  const z = TREE_TRUNK.z + 3.8;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.05 && talkOk()) {
      up.current = true;
      pay(8, "loosestone");
      live.listen = "The stone was loose. Something was under it.";
    }
    if (g.current) g.current.position.y = up.current ? 0.42 : 0.06;
    if (d < 1.4 && !up.current) live.listen = live.listen || "This stone sits different from the others.";
    void dt;
  });
  return (
    <group position={[x, y, z]} ref={g}>
      <mesh rotation={[0.08, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.48, 0.12, 7]} />
        <meshLambertMaterial color="#7a7268" />
      </mesh>
    </group>
  );
}

function StickNest() {
  const fell = useRef(false);
  const yOff = useRef(2.35);
  const vy = useRef(0);
  const x = TREE_TRUNK.x + 1.4;
  const z = TREE_TRUNK.z - 1.2;
  const y = heightAt(x, z);
  const nest = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    const hit =
      (live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 1.6) ||
      (live.carry === "stick" && live.swinging && d < 2.2);
    if (!fell.current && hit) {
      fell.current = true;
      vy.current = 0;
      sfx.rustle();
    }
    if (fell.current && yOff.current > 0.2) {
      vy.current -= 22 * dt;
      yOff.current += vy.current * dt;
      if (yOff.current < 0.2) {
        yOff.current = 0.2;
        pay(9, "sticknest");
        live.listen = "The nest was only sitting there.";
      }
    }
    if (nest.current) nest.current.position.y = yOff.current;
    if (d < 2 && !fell.current) live.listen = live.listen || "A nest. Too high for hands. Not for a stick.";
  });
  return (
    <group position={[x, y, z]} ref={nest}>
      <mesh>
        <torusGeometry args={[0.22, 0.08, 5, 8]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.08, 5, 4]} />
        <meshLambertMaterial color="#e8d8a8" />
      </mesh>
    </group>
  );
}

function HomeInside() {
  const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
  const bed = { x: TREE_HOME.x - 2.2, z: TREE_HOME.z - 3.35 };
  const rug = { x: TREE_HOME.x + 0.35, z: TREE_HOME.z - 0.15 };
  const table = { x: TREE_HOME.x + 3.55, z: TREE_HOME.z - 2.85 };
  const cup = useRef<THREE.Group>(null);
  const cupGone = useRef(false);
  const rugUp = useRef(false);
  const rugG = useRef<THREE.Group>(null);
  const bounce = useRef(0);
  useFrame((_, dt) => {
    bounce.current = Math.max(0, bounce.current - dt);
    if (live.house !== "yours") return;
    const db = Math.hypot(live.x - bed.x, live.z - bed.z);
    if (db < 1.05 && !live.grounded && bounce.current <= 0 && live.y > plat + 0.4) {
      live.boostY = 8.4;
      bounce.current = 0.55;
      sfx.jump();
      pay(5, "bedbounce");
      live.listen = "The bed bounced.";
    }
    if (db < 1.1 && live.sit && !live.smashed.underbed) {
      pay(9, "underbed");
      live.listen = "Gran keeps coins under the bed. She said not to look.";
    }
    const dr = Math.hypot(live.x - rug.x, live.z - rug.z);
    if (!rugUp.current && dr < 0.95 && (live.stompT > 0 || live.slash)) {
      rugUp.current = true;
      pay(8, "homerug");
      live.listen = "The rug hid a coin. Rugs do that.";
    }
    if (rugG.current) rugG.current.rotation.x = rugUp.current ? 0.9 : 0;
    const dtb = Math.hypot(live.x - table.x, live.z - table.z);
    if (!cupGone.current && dtb < 1.15 && live.slash) {
      cupGone.current = true;
      sfx.thud();
      pay(6, "tablecup");
      live.listen = "The cup rolled. Gran is going to know.";
    }
    if (cup.current) cup.current.visible = !cupGone.current;
    if (dtb < 1.0 && talkOk()) {
      pay(4, "tablebook");
      live.listen = "A book about a boy with a sword. The last page is missing.";
    }
  });
  return (
    <group>
      <group ref={rugG} position={[rug.x, plat + 0.04, rug.z]} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0.2]}>
          <circleGeometry args={[0.72, 10]} />
          <meshLambertMaterial color="#6a3a40" />
        </mesh>
      </group>
      <group ref={cup} position={[table.x, plat + 0.62, table.z]} visible={false}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.08, 0.16, 8]} />
          <meshLambertMaterial color="#f4ead2" />
        </mesh>
      </group>
    </group>
  );
}

function DeckToys() {
  const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
  const pot = { x: TREE_HOME.x - 3.35, z: TREE_HOME.z + TREE_HD + TREE_DECK_D * 0.55 };
  const glass = { x: TREE_HOME.x - 3.05, z: TREE_HOME.z + TREE_HD + TREE_DECK_D * 0.68 };
  const chime = { x: TREE_HOME.x + 0.2, z: TREE_HOME.z + TREE_HD + 0.15 };
  const potG = useRef<THREE.Group>(null);
  const potHit = useRef(false);
  const ding = useRef(0);
  useFrame((_, dt) => {
    ding.current = Math.max(0, ding.current - dt);
    const onDeck = live.y > plat - 0.4 && Math.hypot(live.x - TREE_HOME.x, live.z - (TREE_HOME.z + TREE_HD + TREE_DECK_D * 0.5)) < 4.2;
    if (!onDeck && live.house !== "yours") return;
    const dp = Math.hypot(live.x - pot.x, live.z - pot.z);
    if (!potHit.current && dp < 0.7 && Math.abs(live.speed) > 2.4) {
      potHit.current = true;
      sfx.thud();
      pay(7, "deckpot");
      live.listen = "The pot went off the deck. Dirt. And a rupee.";
    }
    if (potG.current) {
      potG.current.rotation.z = potHit.current ? 1.4 : 0;
      potG.current.position.y = plat + (potHit.current ? -0.4 : 0.22);
    }
    const dg = Math.hypot(live.x - glass.x, live.z - glass.z);
    if (dg < 1.05 && talkOk()) {
      live.spyT = Math.max(live.spyT, 5.5);
      pay(6, "deckglass");
      live.listen = "The vale is huge from here.";
    }
    const dc = Math.hypot(live.x - chime.x, live.z - chime.z);
    if (dc < 1.2 && (live.slash || live.stompT > 0) && ding.current <= 0) {
      ding.current = 0.8;
      sfx.ok();
      pay(5, "deckchime");
      live.listen = "The chime rang. Birds left the oak.";
    }
  });
  return (
    <group>
      <group ref={potG} position={[pot.x, plat + 0.22, pot.z]}>
        <mesh>
          <cylinderGeometry args={[0.16, 0.12, 0.28, 7]} />
          <meshLambertMaterial color="#8a3a28" />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <sphereGeometry args={[0.14, 6, 5]} />
          <meshLambertMaterial color="#3a7a38" />
        </mesh>
      </group>
      <group position={[glass.x, plat + 0.85, glass.z]} visible={false}>
        <mesh rotation={[0.4, 0, 0.2]}>
          <cylinderGeometry args={[0.08, 0.1, 0.55, 8]} />
          <meshLambertMaterial color="#4a4a58" />
        </mesh>
        <mesh position={[0, 0.22, 0.12]}>
          <sphereGeometry args={[0.09, 8, 6]} />
          <meshLambertMaterial color="#8ec8e8" transparent opacity={0.55} />
        </mesh>
      </group>
      <mesh position={[chime.x, plat + 1.55, chime.z]} visible={false}>
        <cylinderGeometry args={[0.02, 0.02, 0.7, 4]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      {[-0.12, 0, 0.12].map((ox) => (
        <mesh key={ox} position={[chime.x + ox, plat + 1.15, chime.z]} visible={false}>
          <cylinderGeometry args={[0.04, 0.05, 0.28, 6]} />
          <meshLambertMaterial color="#d4c878" />
        </mesh>
      ))}
    </group>
  );
}

function PathPuddle() {
  const x = TREE_TRUNK.x + 10.4;
  const z = TREE_TRUNK.z + 22.2;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.15 && (!live.grounded || live.stompT > 0)) {
      live.wetT = Math.max(live.wetT, 2.8);
      pay(5, "pathpuddle");
      for (const [id, p] of Object.entries(live.npcPos)) {
        if (Math.hypot(p.x - live.x, p.z - live.z) < 3.2) {
          live.npcMood[id] = "mad";
          pay(6, "splashnpc");
          live.listen = "They got splashed. They did not think it was funny.";
        }
      }
    }
    if (d < 1.6) live.listen = live.listen || "A puddle from last night.";
  });
  return (
    <mesh position={[x, y + 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.05, 10]} />
      <meshLambertMaterial color="#4a7a88" transparent opacity={0.55} />
    </mesh>
  );
}

function MailPeek() {
  const x = TREE_LADDER.x + 2.6;
  const z = TREE_LADDER.z + 2.4;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.15 && talkOk()) {
      pay(6, "mailpeek");
      live.listen = "A letter for Gran. You put it back. Mostly.";
    }
    if (d < 1.4) live.listen = live.listen || "The mailbox. It is not locked.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.42, 0.28, 0.22]} />
        <meshLambertMaterial color="#8a3a28" />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.08, 0.55, 0.08]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
    </group>
  );
}

function LineHide() {
  const x = TREE_TRUNK.x - 4.8;
  const z = TREE_TRUNK.z + 7.2;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.15 && live.stillT > 0.45) {
      live.hideGrass = true;
      pay(7, "linehide");
      live.listen = "You stood in the laundry. From far away you were a shirt.";
    }
    if (d < 1.7) live.listen = live.listen || "Laundry on a line.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[-1.1, 1.05, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 2.1, 5]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[1.1, 1.05, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 2.1, 5]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[0, 1.95, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 2.3, 4]} />
        <meshLambertMaterial color="#d8d0c4" />
      </mesh>
      {[-0.6, 0, 0.6].map((sx, i) => (
        <mesh key={sx} position={[sx, 1.55, 0]}>
          <boxGeometry args={[0.45, 0.7, 0.06]} />
          <meshLambertMaterial color={i === 1 ? "#efe4cc" : i === 0 ? "#6a8aaa" : "#c45c58"} />
        </mesh>
      ))}
    </group>
  );
}

function FountainWish() {
  const y = heightAt(FOUNTAIN.x, FOUNTAIN.z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - FOUNTAIN.x, live.z - FOUNTAIN.z);
    if (d < 1.7 && (!live.grounded || live.stompT > 0)) {
      live.wetT = Math.max(live.wetT, 2.4);
      pay(5, "fountainsplash");
      live.listen = "You jumped in the fountain. People looked.";
    }
    if (d < 1.6 && talkOk()) {
      const g = useGame.getState();
      if (g.coins < 1) {
        live.listen = "A wish needs a coin.";
      } else if (!live.smashed.fountainwish) {
        useGame.setState({ coins: g.coins - 1 });
        live.smashed.fountainwish = true;
        sfx.ok();
        live.listen = "You wished. The water does not talk back. Not out loud.";
        pay(12, "wishback");
      } else {
        live.listen = "You already wished today.";
      }
    }
    if (d < 2.1) live.listen = live.listen || "The town fountain. People throw coins in.";
  });
  return (
    <mesh position={[FOUNTAIN.x, y + 0.08, FOUNTAIN.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.35, 12]} />
      <meshLambertMaterial color="#4a88a8" transparent opacity={0.5} />
    </mesh>
  );
}

function HayDive() {
  const y = heightAt(HAY.x, HAY.z);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - HAY.x, live.z - HAY.z);
    if (d < 1.7 && live.y < y + 2.2) {
      live.haySoft = 0.8;
      if (!live.grounded || live.stompT > 0) {
        live.boostY = Math.min(live.boostY, 2);
        pay(8, "haydive");
        live.listen = "Hay is soft. Something hard was in it anyway.";
      }
    }
    live.haySoft = Math.max(0, live.haySoft - dt);
    if (d < 2.2) live.listen = live.listen || "A hay pile. Jump in it.";
  });
  return null;
}

function WindowPie() {
  const x = STALL.x + 0.2;
  const z = STALL.z + 7.1;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  const gone = useRef(false);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (!gone.current && d < 1.15 && (talkOk() || live.slash)) {
      gone.current = true;
      sfx.ok();
      pay(10, "windowpie");
      live.listen = "The pie was cooling. It is yours now. They will notice.";
      live.npcMood.shopkeep = "mad";
      live.npcMad.shopkeep = 10;
      live.npcTarget.shopkeep = "hero";
    }
    if (g.current) g.current.visible = !gone.current;
    if (d < 1.6 && !gone.current) live.listen = live.listen || "A pie on the sill. Still warm.";
  });
  return (
    <group ref={g} position={[x, y + 1.05, z]}>
      <mesh>
        <cylinderGeometry args={[0.18, 0.18, 0.08, 8]} />
        <meshLambertMaterial color="#c47a38" />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.14, 6, 4]} />
        <meshLambertMaterial color="#d45a28" />
      </mesh>
    </group>
  );
}

function RoofBall() {
  const x = STALL.x - 1.4;
  const z = STALL.z + 0.6;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  const fell = useRef(false);
  const yOff = useRef(2.85);
  const vy = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    const hit =
      (live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 2.2) ||
      live.booms.some((b) => Math.hypot(b.x - x, b.z - z) < 2.4) ||
      live.arrows.some((a) => Math.hypot(a.x - x, a.z - z) < 1.6);
    if (!fell.current && hit) {
      fell.current = true;
      vy.current = 0;
    }
    if (fell.current && yOff.current > 0.2) {
      vy.current -= 24 * dt;
      yOff.current += vy.current * dt;
      if (yOff.current < 0.2) {
        yOff.current = 0.2;
        pay(8, "roofball");
        live.listen = "A kid’s ball. They left it up there.";
      }
    }
    if (g.current) g.current.position.y = y + yOff.current;
    if (d < 3 && !fell.current) live.listen = live.listen || "A ball on the roof.";
  });
  return (
    <group ref={g} position={[x, y + 2.85, z]}>
      <mesh>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshLambertMaterial color="#c42828" />
      </mesh>
    </group>
  );
}

function BroomFind() {
  const x = STALL.x - 6.4;
  const z = STALL.z + 4.2;
  const y = heightAt(x, z);
  const used = useRef(false);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (!used.current && d < 1.2 && (talkOk() || live.slash || live.stompT > 0)) {
      used.current = true;
      pay(7, "broomsweep");
      live.listen = "You swept. A rupee was in the dirt.";
      if (g.current) g.current.visible = false;
    }
    if (d < 1.5 && !used.current) live.listen = live.listen || "A broom by the stall.";
  });
  return (
    <group ref={g} position={[x, y + 0.55, z]} rotation={[0, 0.4, 0.15]}>
      <mesh>
        <cylinderGeometry args={[0.03, 0.03, 1.15, 5]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, -0.55, 0]}>
        <coneGeometry args={[0.16, 0.35, 6]} />
        <meshLambertMaterial color="#8a6a38" />
      </mesh>
    </group>
  );
}

function DoorKnock() {
  useFrame(() => {
    if (live.house) return;
    if (live.nearHouse && live.slash) {
      pay(5, `knock-${live.nearHouse}`);
      live.listen = "A voice from inside: We’re eating!";
    }
  });
  return null;
}

function ShopBell() {
  const ding = useRef(0);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    ding.current = Math.max(0, ding.current - dt);
    const inShop = live.house === "shop";
    if (g.current) g.current.visible = inShop;
    if (!inShop) return;
    const hutX = STALL.x;
    const hutZ = STALL.z;
    const d = Math.hypot(live.x - hutX, live.z - (hutZ - 1.8));
    if (d < 1.4 && talkOk() && ding.current <= 0) {
      ding.current = 1.2;
      sfx.ok();
      pay(6, "shopbell");
      live.listen = "The bell rang. They came out wiping their hands.";
      live.npcMood.shopkeep = "smile";
    }
  });
  return (
    <group ref={g} visible={false} position={[STALL.x, 1.4, STALL.z - 1.8]}>
      <mesh>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

let torchLit = false;

function SeeSaw() {
  const ful = { x: TREE_TRUNK.x + 13.2, z: TREE_TRUNK.z + 9.4 };
  const tilt = useRef(0);
  const g = useRef<THREE.Group>(null);
  const y = heightAt(ful.x, ful.z);
  useFrame((_, dt) => {
    if (live.house) return;
    const dx = live.x - ful.x;
    const on = Math.abs(live.z - ful.z) < 0.7 && Math.abs(dx) < 2.4 && live.y < y + 1.6;
    const crate = live.carry === "crate";
    const want = on ? THREE.MathUtils.clamp(dx * 0.22, -0.42, 0.42) : 0;
    tilt.current += (want - tilt.current) * (1 - Math.exp(-dt * 6));
    if (g.current) g.current.rotation.z = tilt.current;
    if (on) {
      addTrapSpot(live.x, ful.z, 0.7, 0.55 + Math.sin(Math.abs(tilt.current)) * 0.4);
      if (!crate && dx > 1.35 && tilt.current > 0.28 && live.grounded) {
        live.listen = "The board dumped you. Something heavy on the other end would hold it.";
      }
      if (crate && dx > 1.1 && tilt.current < 0.12) {
        live.boostY = 8.2;
        pay(10, "seesaw");
        live.listen = "The crate held the other end. You went up.";
      }
    }
    if (Math.hypot(live.x - ful.x, live.z - ful.z) < 2.6) live.listen = live.listen || "A board on a log.";
  }, -2);
  return (
    <group ref={g} position={[ful.x, y + 0.42, ful.z]}>
      <mesh>
        <boxGeometry args={[4.6, 0.12, 0.7]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, -0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.7, 8]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
    </group>
  );
}

function ShoreSkip() {
  const pebs = useRef(
    Array.from({ length: 5 }, (_, i) => ({
      x: POND.x + Math.cos(i * 1.1) * (POND.r * 0.92),
      z: POND.z + Math.sin(i * 1.1) * (POND.r * 0.92),
      gone: false,
    })),
  );
  const fly = useRef<{ x: number; z: number; u: number; n: number } | null>(null);
  const stone = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    for (const p of pebs.current) {
      if (p.gone) continue;
      const d = Math.hypot(live.x - p.x, live.z - p.z);
      if (d < 1.05 && (talkOk() || live.slash)) {
        p.gone = true;
        fly.current = { x: p.x, z: p.z, u: 0, n: 0 };
        if (stone.current) stone.current.visible = true;
        sfx.ok();
        live.listen = "You skipped it.";
      }
      if (d < 1.4) live.listen = live.listen || "Flat stones. The pond is right there.";
    }
    const f = fly.current;
    if (f && stone.current) {
      f.u += dt * 1.35;
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      const dist = f.u * 7.4;
      const yHop = Math.abs(Math.sin(f.u * Math.PI * 3.2)) * 0.55;
      const px = f.x + fx * dist;
      const pz = f.z + fz * dist;
      stone.current.position.set(px, 0.25 + yHop, pz);
      if (f.u > 0.28 && f.n < 3 && yHop < 0.08) {
        f.n += 1;
        sfx.thud();
      }
      if (f.u > 2.2) {
        if (f.n >= 3) pay(9, "skip3");
        fly.current = null;
        stone.current.visible = false;
      }
    }
  });
  return (
    <group>
      {pebs.current.map((p, i) => (
        <mesh key={i} position={[p.x, heightAt(p.x, p.z) + 0.04, p.z]}>
          <cylinderGeometry args={[0.12, 0.14, 0.05, 6]} />
          <meshLambertMaterial color="#8a8278" />
        </mesh>
      ))}
      <mesh ref={stone} visible={false}>
        <cylinderGeometry args={[0.1, 0.12, 0.04, 6]} />
        <meshLambertMaterial color="#8a8278" />
      </mesh>
    </group>
  );
}

function MillRide() {
  useFrame(() => {
    if (live.house || live.millRide > 0 || live.mounted || live.balloonRide) return;
    const hy = heightAt(MILL_AT.x, MILL_AT.z);
    const wx = MILL_AT.x + 3.35;
    const wz = MILL_AT.z;
    if (Math.hypot(live.x - wx, live.z - wz) > 2.4) return;
    for (let i = 0; i < 8; i++) {
      const ang = live.millSpin + (i / 8) * Math.PI;
      const tx = wx + Math.sin(ang) * 1.52;
      const ty = hy + 2.15 + Math.cos(ang) * 1.52;
      if (ty < hy + 1.25 && Math.hypot(live.x - tx, live.z - wz) < 1.05 && (live.y > ty - 0.4 || !live.grounded)) {
        live.millRide = i + 1;
        pay(10, "millride");
        live.listen = "The wheel took you. Jump when you want off.";
        sfx.ok();
        break;
      }
    }
    if (Math.hypot(live.x - wx, live.z - wz) < 2.2) live.listen = live.listen || "The mill wheel. A blade is low.";
  });
  return null;
}

function FenceHop() {
  const posts = [
    { x: PADDOCK.x - 5.4, z: PADDOCK.z },
    { x: PADDOCK.x - 5.4, z: PADDOCK.z + 3.2 },
    { x: PADDOCK.x - 5.4, z: PADDOCK.z - 3.2 },
  ];
  useFrame(() => {
    if (live.house) return;
    for (const p of posts) {
      addTrapSpot(p.x, p.z, 0.55, 1.05);
      const d = Math.hypot(live.x - p.x, live.z - p.z);
      if (d < 0.8 && live.y > heightAt(p.x, p.z) + 0.7) {
        pay(6, "fencehop");
        live.listen = "You walked the fence. The sheep watched.";
      }
    }
  }, -2);
  return (
    <group>
      {posts.map((p, i) => (
        <mesh key={i} position={[p.x, heightAt(p.x, p.z) + 1.05, p.z]}>
          <boxGeometry args={[0.12, 0.08, 3.1]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      ))}
    </group>
  );
}

function HorseApple() {
  const x = TREE_TRUNK.x + 14.2;
  const z = TREE_TRUNK.z + 6.4;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  const gone = useRef(false);
  useFrame(() => {
    if (live.house || gone.current) return;
    const d = Math.hypot(live.x - x, live.z - z);
    const hx = live.horseX ?? x;
    const hz = live.horseZ ?? z;
    const horseNear = Math.hypot(hx - x, hz - z) < 3.2;
    if (d < 1.15 && horseNear && (live.slash || Math.abs(live.speed) > 0.5 || live.stompT > 0)) {
      gone.current = true;
      live.horseCall = true;
      sfx.neigh();
      pay(8, "horseapple");
      live.listen = "The horse ate it. Now it will come when you call.";
      if (g.current) g.current.visible = false;
    }
    if (d < 1.5) live.listen = live.listen || "An apple by the horse.";
  });
  return (
    <group ref={g} position={[x, y + 0.12, z]}>
      <mesh>
        <sphereGeometry args={[0.12, 7, 6]} />
        <meshLambertMaterial color="#c42828" />
      </mesh>
    </group>
  );
}

function FireStick() {
  const lantern = { x: MILL_AT.x, z: MILL_AT.z + 3.4 };
  const glow = useRef<THREE.MeshLambertMaterial>(null);
  useFrame(() => {
    if (live.house) return;
    if (live.carry === "stick" && Math.hypot(live.x - FIRE_PIT.x, live.z - FIRE_PIT.z) < 1.6) {
      torchLit = true;
      live.listen = "The stick caught. It is a torch now.";
    }
    const d = Math.hypot(live.x - lantern.x, live.z - lantern.z);
    if (torchLit && !live.smashed.torchlantern && d < 1.35) {
      pay(9, "torchlantern");
      live.listen = "You lit the lantern with the stick.";
    }
    if (glow.current) {
      const on = Boolean(live.smashed.torchlantern);
      glow.current.emissiveIntensity = on ? 1.4 : 0;
      glow.current.color.set(on ? "#f4c878" : "#2a2420");
    }
    if (d < 1.6 && !live.smashed.torchlantern) live.listen = live.listen || "A dark lantern. Fire would help.";
  });
  const y = heightAt(lantern.x, lantern.z);
  return (
    <group position={[lantern.x, y + 1.55, lantern.z]}>
      <mesh>
        <cylinderGeometry args={[0.06, 0.07, 0.4, 6]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshLambertMaterial ref={glow} color="#2a2420" emissive="#f0b040" emissiveIntensity={0} />
      </mesh>
    </group>
  );
}

function OakSwing() {
  const origin = { x: TREE_TRUNK.x + 3.4, z: TREE_TRUNK.z + 2.6 };
  const phase = useRef(0);
  const on = useRef(false);
  const seat = useRef<THREE.Group>(null);
  const y = heightAt(origin.x, origin.z);
  useFrame((_, dt) => {
    if (live.house) {
      on.current = false;
      return;
    }
    const sx = origin.x + Math.sin(phase.current) * 1.85;
    const sy = y + 0.55 - Math.abs(Math.sin(phase.current)) * 0.35;
    const sz = origin.z;
    const d = Math.hypot(live.x - sx, live.z - sz);
    if (!on.current && d < 1.05 && live.y < sy + 1.2 && (talkOk() || !live.grounded)) {
      on.current = true;
      live.sit = true;
      pay(7, "oakswing");
      live.listen = "The oak has a swing.";
    }
    if (on.current) {
      const analog = Math.min(1, Math.abs(live.speed) * 0.08 + 0.35);
      phase.current += dt * (0.9 + analog * 1.6);
      live.x = sx;
      live.z = sz;
      live.y = sy + 0.7;
      live.speed = 0;
      live.sit = true;
      if (consumeJump()) {
        on.current = false;
        live.sit = false;
        live.boostY = 8.8;
        live.glideT = 2.4;
        sfx.jump();
      }
    } else {
      phase.current += dt * 0.35;
    }
    if (seat.current) seat.current.position.set(sx, sy, sz);
    if (d < 1.6 && !on.current) live.listen = live.listen || "A swing on the oak.";
  }, 1);
  return (
    <group>
      <mesh position={[TREE_TRUNK.x + 1.2, y + 4.4, TREE_TRUNK.z + 1.0]} rotation={[0.4, 0.2, 0.5]}>
        <cylinderGeometry args={[0.02, 0.02, 4.2, 4]} />
        <meshLambertMaterial color="#c9b48a" />
      </mesh>
      <group ref={seat}>
        <mesh>
          <boxGeometry args={[0.7, 0.08, 0.35]} />
          <meshLambertMaterial color="#5a3a22" />
        </mesh>
      </group>
    </group>
  );
}

function KnotHole() {
  const got = useRef(false);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - TREE_TRUNK.x, live.z - TREE_TRUNK.z);
    if (d < 1.65 && d > 0.9) {
      live.listen = live.listen || "A hole in the oak. Something shines.";
      if (!got.current && (live.slash || talkOk())) {
        got.current = true;
        pay(8, "knothole");
        live.listen = "A rupee in the tree. Birds were saving it.";
      }
    }
  });
  return (
    <mesh position={[TREE_TRUNK.x + 0.85, heightAt(TREE_TRUNK.x, TREE_TRUNK.z) + 1.15, TREE_TRUNK.z + 0.15]}>
      <sphereGeometry args={[0.09, 6, 5]} />
      <meshLambertMaterial color="#1a120c" />
    </mesh>
  );
}

function HandFish() {
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (live.house) return;
    const wet = pondU(live.x, live.z);
    if (wet > 0.18 && wet < 0.72 && live.stillT > 1.05 && cool.current <= 0 && (talkOk() || live.stompT > 0)) {
      cool.current = 4;
      live.wetT = Math.max(live.wetT, 2);
      pay(8, "handfish");
      live.listen = "You caught it with your hands. It is wet. You are wet.";
      sfx.ok();
    }
    if (wet > 0.18 && wet < 0.72 && live.stillT > 0.4) live.listen = live.listen || "Fish in the shallows. Stay still.";
  });
  return null;
}

function DinnerBell() {
  const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
  const x = TREE_HOME.x - 2.15;
  const z = TREE_HOME.z + TREE_HD + 0.55;
  const ding = useRef(0);
  useFrame((_, dt) => {
    ding.current = Math.max(0, ding.current - dt);
    const onDeck = live.y > plat - 0.5 && Math.hypot(live.x - x, live.z - z) < 1.15;
    if (onDeck && (live.slash || talkOk()) && ding.current <= 0) {
      ding.current = 1.4;
      sfx.ok();
      pay(6, "dinnerbell");
      live.listen = "Gran: Supper is not ready! And get down from there!";
    }
    if (onDeck) live.listen = live.listen || "A dinner bell.";
  });
  return (
    <group position={[x, plat + 1.15, z]}>
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, 0.55, 4]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[0, -0.28, 0]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshLambertMaterial color="#d4c878" />
      </mesh>
    </group>
  );
}

function WagonHide() {
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - WAGON_AT.x, live.z - WAGON_AT.z);
    if (d < 1.35 && live.stillT > 0.5 && live.y < heightAt(WAGON_AT.x, WAGON_AT.z) + 1.8) {
      live.hideGrass = true;
      pay(7, "wagonhide");
      live.listen = "You hid in the wagon. From the road you were a sack.";
    }
    if (d < 1.8) live.listen = live.listen || "The wagon is empty.";
  });
  return null;
}





