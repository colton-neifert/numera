import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, TREE_HOME, TREE_HOUSE_H, TREE_HD } from "./field";
import { STALL } from "./village";
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

export function CleverPlay() {
  return (
    <group>
      <KickHoop />
      <MudPrints />
      <NestEgg />
      <AtticPainting />
      <CreekLog />
      <PlateGate />
      <CopyCrow />
      <TownBarrel />
    </group>
  );
}

function KickHoop() {
  const hoop = { x: TREE_TRUNK.x + 8.4, z: TREE_TRUNK.z + 16.8 };
  const ball = useRef({ x: hoop.x - 2.4, z: hoop.z, vx: 0, vz: 0 });
  const g = useRef<THREE.Group>(null);
  const scored = useRef(false);
  const hy = heightAt(hoop.x, hoop.z);
  useFrame((_, dt) => {
    if (live.house) return;
    const b = ball.current;
    const d = Math.hypot(live.x - b.x, live.z - b.z);
    if (d < 0.85 && Math.abs(live.speed) > 2.2) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      b.vx = fx * Math.min(11, Math.abs(live.speed) * 0.9);
      b.vz = fz * Math.min(11, Math.abs(live.speed) * 0.9);
    }
    b.x += b.vx * dt;
    b.z += b.vz * dt;
    b.vx *= Math.exp(-dt * 1.8);
    b.vz *= Math.exp(-dt * 1.8);
    const to = Math.hypot(b.x - hoop.x, b.z - hoop.z);
    if (!scored.current && to < 0.55 && Math.hypot(b.vx, b.vz) > 1.2) {
      scored.current = true;
      pay(10, "kickhoop");
      live.listen = "In. The hoop rang.";
      sfx.ok();
    }
    if (g.current) g.current.position.set(b.x, heightAt(b.x, b.z) + 0.16, b.z);
    if (d < 1.6) live.listen = live.listen || "A ball. Kick it through the hoop.";
  });
  return (
    <group>
      <mesh position={[hoop.x, hy + 1.15, hoop.z]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.04, 6, 12]} />
        <meshLambertMaterial color="#c42828" />
      </mesh>
      <mesh position={[hoop.x, hy + 0.55, hoop.z]}>
        <cylinderGeometry args={[0.04, 0.05, 1.1, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <group ref={g}>
        <mesh>
          <sphereGeometry args={[0.16, 8, 6]} />
          <meshLambertMaterial color="#c45c28" />
        </mesh>
      </group>
    </group>
  );
}

function MudPrints() {
  const start = { x: TREE_TRUNK.x - 4.2, z: TREE_TRUNK.z + 18.4 };
  const end = { x: TREE_TRUNK.x - 9.6, z: TREE_TRUNK.z + 24.2 };
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - end.x, live.z - end.z);
    if (d < 1.15 && live.stillT > 0.6) {
      pay(10, "mudprints");
      live.listen = "The prints stopped. You dug. A rupee.";
    }
    if (Math.hypot(live.x - start.x, live.z - start.z) < 2.2)
      live.listen = live.listen || "Muddy prints. Follow them.";
  });
  const steps = Array.from({ length: 6 }, (_, i) => {
    const u = i / 5;
    return { x: start.x + (end.x - start.x) * u, z: start.z + (end.z - start.z) * u };
  });
  return (
    <group>
      {steps.map((p, i) => (
        <mesh key={i} position={[p.x, heightAt(p.x, p.z) + 0.02, p.z]} rotation={[-Math.PI / 2, 0, 0.3]}>
          <circleGeometry args={[0.12, 6]} />
          <meshLambertMaterial color="#4a3220" />
        </mesh>
      ))}
    </group>
  );
}

function NestEgg() {
  const x = TREE_TRUNK.x + 3.2;
  const z = TREE_TRUNK.z - 6.4;
  const y = heightAt(x, z);
  const held = useRef(false);
  const given = useRef(false);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (given.current) return;
    if (!held.current) {
      const d = Math.hypot(live.x - x, live.z - z);
      if (!live.house && d < 1.1 && (talkOk() || live.slash)) {
        held.current = true;
        live.listen = "A warm egg. Someone would want this.";
      }
      if (d < 1.6) live.listen = live.listen || "A nest. An egg.";
    } else {
      if (g.current) g.current.position.set(live.x, live.y + 1.15, live.z);
      if (live.nearNpc === "gran" || live.house === "yours") {
        given.current = true;
        pay(12, "nestegg");
        live.listen = "Gran wrapped it. Breakfast later.";
      }
    }
    if (g.current) g.current.visible = !given.current;
  });
  return (
    <group ref={g} position={[x, y + 0.22, z]}>
      <mesh position={[0, -0.08, 0]}>
        <torusGeometry args={[0.18, 0.05, 5, 8]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.08, 7, 5]} />
        <meshLambertMaterial color="#efe4cc" />
      </mesh>
    </group>
  );
}

function AtticPainting() {
  const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
  useFrame(() => {
    if (live.house !== "yours") return;
    if (Math.abs(live.z - (TREE_HOME.z - TREE_HD + 0.4)) < 0.7 && Math.abs(live.x - TREE_HOME.x) < 1.1 && talkOk()) {
      pay(8, "painting");
      live.listen = "The painting hung crooked. Behind it, a rupee.";
    }
  });
  return (
    <mesh position={[TREE_HOME.x, plat + 1.55, TREE_HOME.z - TREE_HD + 0.16]}>
      <boxGeometry args={[0.42, 0.5, 0.04]} />
      <meshLambertMaterial color="#6a3a22" />
    </mesh>
  );
}

function CreekLog() {
  const p = useRef({ x: TREE_TRUNK.x + 10.4, z: TREE_TRUNK.z + 6.2, u: 0 });
  const g = useRef<THREE.Group>(null);
  const on = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    const c = p.current;
    c.u += dt * 0.22;
    c.x = TREE_TRUNK.x + 10.4 + Math.sin(c.u) * 2.4;
    c.z = TREE_TRUNK.z + 6.2 + Math.cos(c.u * 0.7) * 1.2;
    const y = heightAt(c.x, c.z) + 0.22;
    const d = Math.hypot(live.x - c.x, live.z - c.z);
    if (d < 1.05 && live.grounded && live.stillT > 0.3) on.current = true;
    if (on.current && Math.abs(live.speed) > 2.8) on.current = false;
    if (on.current && d > 1.6) on.current = false;
    if (on.current) {
      live.x = c.x;
      live.z = c.z;
      addTrapSpot(c.x, c.z, 0.7, 0.35);
      pay(7, "creeklog");
      live.listen = "The log is going. Jump when you want off.";
    }
    if (g.current) g.current.position.set(c.x, y, c.z);
    if (d < 1.6 && !on.current) live.listen = live.listen || "A log in the creek. Stand on it.";
  }, -2);
  return (
    <group ref={g}>
      <mesh rotation={[0, 0.4, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.24, 1.6, 7]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function PlateGate() {
  const plate = { x: TREE_TRUNK.x + 20.4, z: TREE_TRUNK.z - 4.2 };
  const gate = { x: TREE_TRUNK.x + 22.8, z: TREE_TRUNK.z - 4.2 };
  const open = useRef(false);
  const bar = useRef<THREE.Group>(null);
  const py = heightAt(plate.x, plate.z);
  const gy = heightAt(gate.x, gate.z);
  useFrame((_, dt) => {
    if (live.house) return;
    const on = Math.hypot(live.x - plate.x, live.z - plate.z) < 0.7 && live.grounded;
    if (on) open.current = true;
    if (bar.current) bar.current.rotation.y += ((open.current ? 1.45 : 0) - bar.current.rotation.y) * (1 - Math.exp(-dt * 5));
    if (on && !live.smashed.plategate) {
      pay(8, "plategate");
      live.listen = "You stood on it. The bar swung.";
    }
    if (Math.hypot(live.x - plate.x, live.z - plate.z) < 1.5)
      live.listen = live.listen || "A stone in the grass. Stand on it.";
  });
  return (
    <group>
      <mesh position={[plate.x, py + 0.05, plate.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 8]} />
        <meshLambertMaterial color="#8a8070" />
      </mesh>
      <group ref={bar} position={[gate.x, gy + 0.7, gate.z]}>
        <mesh position={[0.75, 0, 0]}>
          <boxGeometry args={[1.5, 0.14, 0.12]} />
          <meshLambertMaterial color="#5a3a22" />
        </mesh>
      </group>
    </group>
  );
}

function CopyCrow() {
  const x = TREE_TRUNK.x - 12.4;
  const z = TREE_TRUNK.z + 8.2;
  const y = heightAt(x, z);
  const arm = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const want = live.sit ? 1.1 : Math.abs(live.speed) > 9 ? -0.75 : 0.15;
    if (arm.current) arm.current.rotation.x += (want - arm.current.rotation.x) * (1 - Math.exp(-dt * 6));
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.2 && live.sit) {
      pay(7, "copycrow");
      live.listen = "It sat when you sat.";
    }
    if (d < 2.4) live.listen = live.listen || "A scarecrow. It is watching you.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 1.4, 5]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <group ref={arm} position={[0, 1.15, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 1.1, 5]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      </group>
      <mesh position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.14, 6, 5]} />
        <meshLambertMaterial color="#c9a06a" />
      </mesh>
    </group>
  );
}

function TownBarrel() {
  const x = STALL.x - 3.4;
  const z = STALL.z + 2.2;
  const y = heightAt(x, z);
  const hid = useRef(false);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (hid.current) {
      live.x = x;
      live.z = z;
      live.speed = 0;
      live.hideBarrel = true;
      t.current += dt;
      if (t.current > 2.4) {
        pay(8, "townbarrel");
        live.listen = "The shopkeep walked by. He did not see you.";
      }
      if (talkOk()) {
        hid.current = false;
        live.hideBarrel = false;
        live.listen = "You popped out.";
      }
    } else if (d < 1.15 && talkOk()) {
      hid.current = true;
      t.current = 0;
      live.hideBarrel = true;
      live.listen = "You are a barrel. F to hop out.";
      sfx.thud();
    }
    if (d < 1.5 && !hid.current) live.listen = live.listen || "A barrel by the shop. Hide.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.4, 0.84, 10]} />
        <meshLambertMaterial color="#8a5a28" />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <torusGeometry args={[0.4, 0.03, 5, 10]} />
        <meshLambertMaterial color="#3a2818" />
      </mesh>
    </group>
  );
}
