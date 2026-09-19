import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, TREE_HOME, TREE_HOUSE_H, TREE_HD, POND, pondSurfaceY } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { addTrapSpot } from "./dungeonTraps";
import { consumeTalk as consumeTalkRaw, consumeJump } from "../input";

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

const T = TREE_TRUNK;

export function FieldPlay() {
  return (
    <group>
      <Hammock />
      <WindChime />
      <Fireflies />
      <MailFlag />
      <LilyPads />
      <StuckBalloon />
      <GrassWhistle />
      <BeeFollow />
      <VaneSpin />
      <TableHide />
      <CartPull />
      <RoosterCrow />
      <ChimneyLook />
      <ScareWave />
    </group>
  );
}

function Hammock() {
  const a = { x: T.x + 6.2, z: T.z - 5.4 };
  const b = { x: T.x + 9.6, z: T.z - 4.2 };
  const mx = (a.x + b.x) / 2;
  const mz = (a.z + b.z) / 2;
  const y = heightAt(mx, mz);
  const on = useRef(false);
  const sag = useRef(0.35);
  useFrame((_, dt) => {
    if (live.house) {
      on.current = false;
      return;
    }
    addTrapSpot(mx, mz, 0.9, 0.45);
    const d = Math.hypot(live.x - mx, live.z - mz);
    if (!on.current && d < 1.05 && live.y < y + 1.4) {
      on.current = true;
      live.sit = true;
      pay(7, "hammock");
      live.listen = "A hammock. Jump to get out. Do not fall asleep.";
    }
    sag.current += ((on.current ? 0.7 : 0.35) - sag.current) * (1 - Math.exp(-dt * 6));
    if (on.current) {
      live.x = mx;
      live.z = mz;
      live.y = y + 0.55;
      live.speed = 0;
      live.sit = true;
      if (consumeJump()) {
        on.current = false;
        live.sit = false;
        live.boostY = 7.8;
        sfx.jump();
      }
    }
    if (d < 1.6 && !on.current) live.listen = live.listen || "A hammock between two trees.";
  }, 1);
  return (
    <group>
      <mesh position={[mx, y + 0.7 - sag.current * 0.15, mz]} rotation={[0.15, Math.atan2(b.x - a.x, b.z - a.z), 0.12]}>
        <boxGeometry args={[3.4, 0.06, 0.7]} />
        <meshLambertMaterial color="#6a8aaa" />
      </mesh>
    </group>
  );
}

function WindChime() {
  const x = TREE_HOME.x - 1.6;
  const z = TREE_HOME.z + TREE_HD + 0.2;
  const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
  const ding = useRef(0);
  useFrame((_, dt) => {
    ding.current = Math.max(0, ding.current - dt);
    const d = Math.hypot(live.x - x, live.z - z);
    if (live.y > plat - 0.5 && d < 1.2 && (Math.abs(live.speed) > 2 || live.slash) && ding.current <= 0) {
      ding.current = 0.8;
      sfx.chime();
      pay(5, "windchime");
      live.listen = "The chimes. Gran hears them from inside.";
    }
  });
  return (
    <group position={[x, plat + 1.35, z]} visible={false}>
      {[ -0.12, 0, 0.12 ].map((s, i) => (
        <mesh key={i} position={[s, -0.2 - i * 0.08, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.28, 5]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      ))}
    </group>
  );
}

function Fireflies() {
  const bugs = useRef(
    Array.from({ length: 8 }, (_, i) => ({
      x: T.x + Math.cos(i) * 6,
      z: T.z + Math.sin(i * 1.3) * 6,
      y: 1.2,
      a: i,
    })),
  );
  const jar = useRef(0);
  useFrame((_, dt) => {
    if (live.house || live.dusk < 0.45) return;
    for (const b of bugs.current) {
      b.a += dt * 1.4;
      b.x += Math.cos(b.a) * dt * 0.8;
      b.z += Math.sin(b.a * 0.7) * dt * 0.8;
      b.y = 0.8 + Math.sin(b.a * 2) * 0.45;
      const d = Math.hypot(live.x - b.x, live.z - b.z);
      if (d < 0.7 && Math.abs(live.y - (heightAt(b.x, b.z) + b.y)) < 1.2 && (!live.grounded || live.stillT > 0.4)) {
        jar.current += 1;
        b.x += 4;
        if (jar.current >= 3) {
          pay(10, "fireflyjar");
          live.listen = "Three fireflies. The jar is a lantern now.";
        } else live.listen = `${jar.current}. A few more and you have a lantern.`;
      }
    }
    if (Math.hypot(live.x - T.x, live.z - T.z) < 10 && live.dusk > 0.45) live.listen = live.listen || "Fireflies. Catch them with your hands.";
  });
  if (live.dusk < 0.45) return null;
  return (
    <group>
      {bugs.current.map((b, i) => (
        <FireBug key={i} b={b} />
      ))}
    </group>
  );
}

function FireBug({ b }: { b: { x: number; z: number; y: number; a: number } }) {
  const g = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (g.current) g.current.position.set(b.x, heightAt(b.x, b.z) + b.y, b.z);
  });
  return (
    <mesh ref={g}>
      <sphereGeometry args={[0.05, 5, 4]} />
      <meshLambertMaterial color="#d8f080" emissive="#c8e050" emissiveIntensity={1.4} />
    </mesh>
  );
}

function MailFlag() {
  const x = T.x + 8.2;
  const z = T.z + 5.4;
  const y = heightAt(x, z);
  const up = useRef(false);
  const flag = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.15 && (talkOk() || live.slash)) {
      up.current = !up.current;
      if (flag.current) flag.current.rotation.z = up.current ? 0 : -Math.PI / 2;
      pay(5, "mailflag");
      live.listen = up.current ? "Flag up. Mail will come." : "Flag down. The mailman will skip you.";
    }
    if (d < 1.5) live.listen = live.listen || "The mailbox flag.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.45, 0.28, 0.22]} />
        <meshLambertMaterial color="#c42828" />
      </mesh>
      <mesh ref={flag} position={[0.22, 0.7, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <boxGeometry args={[0.22, 0.06, 0.04]} />
        <meshLambertMaterial color="#f4e878" />
      </mesh>
    </group>
  );
}

function LilyPads() {
  const pads = [
    { x: POND.x - 3.4, z: POND.z + 2.2 },
    { x: POND.x - 1.6, z: POND.z + 3.4 },
    { x: POND.x + 0.4, z: POND.z + 3.8 },
    { x: POND.x + 2.2, z: POND.z + 2.6 },
  ];
  const wy = pondSurfaceY();
  useFrame(() => {
    if (live.house) return;
    for (const p of pads) {
      addTrapSpot(p.x, p.z, 0.55, wy + 0.08 - heightAt(p.x, p.z));
      const d = Math.hypot(live.x - p.x, live.z - p.z);
      if (d < 0.6) {
        pay(8, "lilypad");
        live.listen = "The pad held. Do not stay. They sink if you stay.";
      }
    }
    if (Math.hypot(live.x - POND.x, live.z - POND.z) < POND.r * 0.9) live.listen = live.listen || "Lily pads. Hop.";
  }, -2);
  return (
    <group>
      {pads.map((p, i) => (
        <mesh key={i} position={[p.x, wy + 0.04, p.z]} rotation={[-Math.PI / 2, 0, i * 0.4]}>
          <circleGeometry args={[0.48, 8]} />
          <meshLambertMaterial color="#3a7a38" />
        </mesh>
      ))}
    </group>
  );
}

function StuckBalloon() {
  const x = T.x + 1.8;
  const z = T.z - 1.2;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  const gone = useRef(false);
  useFrame(() => {
    if (live.house || gone.current) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.4 && live.y > y + 2.4 && (live.slash || talkOk())) {
      gone.current = true;
      live.boostY = 9.2;
      live.glideT = 6;
      pay(10, "stuckballoon");
      live.listen = "The balloon took you a little. Then it popped. Sorry.";
      if (g.current) g.current.visible = false;
      sfx.jump();
    }
    if (d < 2 && live.y > y + 1.5) live.listen = live.listen || "A balloon in the oak. Climb.";
  });
  return (
    <group ref={g} position={[x, y + 4.2, z]}>
      <mesh>
        <sphereGeometry args={[0.28, 8, 6]} />
        <meshLambertMaterial color="#c42828" />
      </mesh>
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1.1, 4]} />
        <meshLambertMaterial color="#efe4cc" />
      </mesh>
    </group>
  );
}

function GrassWhistle() {
  useFrame(() => {
    if (live.house) return;
    if (live.hideGrass && live.stillT > 0.6 && talkOk()) {
      pay(6, "grasswhistle");
      live.listen = "A blade of grass. It whistled. The birds answered.";
      sfx.ok();
    }
  });
  return null;
}

function BeeFollow() {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    const on = live.carry === "flower";
    g.current.visible = on;
    if (!on) return;
    const tx = live.x + Math.sin(live.playT * 3) * 0.5;
    const tz = live.z + Math.cos(live.playT * 3) * 0.5;
    g.current.position.set(tx, live.y + 1.35, tz);
    if (!live.smashed.beeflower) {
      pay(6, "beeflower");
      live.listen = "A bee. It likes what you are holding.";
    }
  });
  return (
    <group ref={g} visible={false}>
      <mesh>
        <sphereGeometry args={[0.06, 5, 4]} />
        <meshLambertMaterial color="#f4e878" />
      </mesh>
    </group>
  );
}

function VaneSpin() {
  const x = T.x + 16.8;
  const z = T.z - 1.4;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * (0.4 + Math.abs(live.speed) * 0.08);
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.2 && live.slash) {
      pay(5, "vane");
      live.listen = "The vane spun. Wind is that way. Probably.";
    }
    if (d < 1.5) live.listen = live.listen || "A weather vane. A rooster that never crows.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 1.6, 5]} />
        <meshLambertMaterial color="#8a8a78" />
      </mesh>
      <group ref={g} position={[0, 1.55, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.08, 0.55, 4]} />
          <meshLambertMaterial color="#c42828" />
        </mesh>
      </group>
    </group>
  );
}

function TableHide() {
  useFrame(() => {
    if (live.house !== "yours") return;
    const d = Math.hypot(live.x - 0.2, live.z + 0.4);
    if (d < 0.9 && live.hideGrass) {
      pay(6, "tablehide");
      live.listen = "Under the table. Gran still sees you.";
    }
  });
  return null;
}

function CartPull() {
  const p = useRef({ x: T.x + 22.4, z: T.z + 4.2 });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house || !g.current) return;
    const c = p.current;
    const d = Math.hypot(live.x - c.x, live.z - c.z);
    if (d < 1.25 && Math.abs(live.speed) > 2.4) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      c.x += fx * 4.2 * dt;
      c.z += fz * 4.2 * dt;
      pay(7, "cartpull");
      live.listen = "You pulled the cart. It has no horse. It has you.";
    }
    g.current.position.set(c.x, heightAt(c.x, c.z) + 0.35, c.z);
    if (d < 1.6) live.listen = live.listen || "A cart. Pull it.";
  });
  return (
    <group ref={g}>
      <mesh>
        <boxGeometry args={[1.3, 0.4, 0.7]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      {[-0.4, 0.4].map((s) => (
        <mesh key={s} position={[s, -0.22, 0.38]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 0.08, 8]} />
          <meshLambertMaterial color="#3a3228" />
        </mesh>
      ))}
    </group>
  );
}

function RoosterCrow() {
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (live.house || live.dusk > 0.35) return;
    if (live.stillT > 2.2 && cool.current <= 0 && live.area === "field") {
      cool.current = 18;
      pay(5, "roostercrow");
      live.listen = "A rooster. Morning already happened. He does not care.";
    }
  });
  return null;
}

function ChimneyLook() {
  const x = TREE_HOME.x - 1.6;
  const z = TREE_HOME.z - 1.2;
  const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
  useFrame(() => {
    const d = Math.hypot(live.x - x, live.z - z);
    if (live.y > plat + 1.2 && d < 1.1) {
      pay(8, "chimney");
      live.listen = "You looked down the chimney. Pie. You cannot reach it from here.";
    }
  });
  return (
    <mesh position={[x, plat + 1.55, z]}>
      <boxGeometry args={[0.45, 0.7, 0.45]} />
      <meshLambertMaterial color="#6a6660" />
    </mesh>
  );
}

function ScareWave() {
  const arm = useRef<THREE.Mesh>(null);
  const scare = { x: T.x + 24.2, z: T.z + 16.4 };
  const y = heightAt(scare.x, scare.z);
  useFrame((_, dt) => {
    if (arm.current) arm.current.rotation.z = Math.sin(live.playT * 1.6) * 0.5;
    if (live.house) return;
    const d = Math.hypot(live.x - scare.x, live.z - scare.z);
    if (d < 1.4 && live.slash) {
      pay(6, "scarewave");
      live.listen = "You spun him. The crows left. Then they came back.";
    }
    if (d < 1.7) live.listen = live.listen || "A scarecrow. His arm waves even when the wind does not.";
  });
  return (
    <group position={[scare.x, y, scare.z]}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 1.8, 5]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh ref={arm} position={[0, 1.35, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[1.3, 0.08, 0.08]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.18, 6, 5]} />
        <meshLambertMaterial color="#c9a06a" />
      </mesh>
    </group>
  );
}

