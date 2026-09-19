import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, TREE_HOME, TREE_HOUSE_H, TREE_HD, POND } from "./field";
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

const T = TREE_TRUNK;

export function YardPlay() {
  return (
    <group>
      <StepStones />
      <PinWheel />
      <RainBarrel />
      <Butterflies />
      <MapleSeed />
      <CreakBoard />
      <HollowKnock />
      <PondDucks />
      <ShoeToss />
      <SunDial />
      <PicnicSit />
      <BounceBall />
      <CowBell />
      <DogStick />
      <NightCount />
      <FrogHop />
    </group>
  );
}

function StepStones() {
  const x = T.x + 10.4;
  const z = T.z + 22.5;
  const stones = [-3.2, -1.05, 1.05, 3.2].map((ox) => ({ x: x + ox, z }));
  useFrame(() => {
    if (live.house) return;
    for (const s of stones) {
      addTrapSpot(s.x, s.z, 0.48, 0.22);
      const d = Math.hypot(live.x - s.x, live.z - s.z);
      if (d < 0.55 && live.grounded) pay(6, "stepstone");
    }
    if (Math.abs(live.z - z) < 2 && Math.abs(live.x - x) < 5.4) live.listen = live.listen || "Stones in the creek. Keep your feet dry.";
  }, -2);
  return (
    <group>
      {stones.map((s, i) => (
        <mesh key={i} position={[s.x, heightAt(s.x, s.z) + 0.16, s.z]} rotation={[0.05, i * 0.4, 0]}>
          <cylinderGeometry args={[0.42, 0.48, 0.16, 7]} />
          <meshLambertMaterial color="#7a7268" />
        </mesh>
      ))}
    </group>
  );
}

function PinWheel() {
  const x = T.x + 15.6;
  const z = T.z + 4.8;
  const y = heightAt(x, z);
  const spin = useRef(0);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    const wind = d < 2.4 ? Math.abs(live.speed) * 0.35 : 0.4;
    spin.current += dt * (1.2 + wind * 4);
    if (g.current) g.current.rotation.z = spin.current;
    if (d < 1.4 && Math.abs(live.speed) > 4) {
      pay(5, "pinwheel");
      live.listen = "The pinwheel went crazy.";
    }
    if (d < 1.6) live.listen = live.listen || "A pinwheel. Run past it.";
  });
  return (
    <group position={[x, y + 0.85, z]}>
      <mesh>
        <cylinderGeometry args={[0.02, 0.03, 1.7, 4]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <group ref={g} position={[0, 0.7, 0.04]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[0.16, 0, 0]}>
            <boxGeometry args={[0.32, 0.12, 0.02]} />
            <meshLambertMaterial color={i % 2 ? "#c42828" : "#f4e878"} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function RainBarrel() {
  const x = T.x - 6.8;
  const z = T.z + 6.2;
  const y = heightAt(x, z);
  const fill = useRef(0.15);
  useFrame((_, dt) => {
    if (live.house) return;
    if (live.rainT > 0) fill.current = Math.min(1, fill.current + dt * 0.08);
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.15 && fill.current > 0.4 && (talkOk() || live.wetT > 0.2)) {
      live.wetT = Math.max(live.wetT, 3);
      pay(7, "rainbarrel");
      live.listen = "Rain water. Cold. The dry vine would like this.";
    }
    if (d < 1.5) live.listen = live.listen || "A barrel waiting for rain.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.38, 0.42, 0.9, 8]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[0, 0.2 + fill.current * 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.32, 10]} />
        <meshLambertMaterial color="#4a7a88" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function Butterflies() {
  const x = T.x + 8.2;
  const z = T.z - 8.4;
  const y = heightAt(x, z);
  const t = useRef(0);
  const got = useRef(false);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    t.current += dt;
    if (g.current) g.current.position.y = y + 0.9 + Math.sin(t.current * 3) * 0.2;
    if (g.current) g.current.rotation.y = t.current;
    if (live.house || got.current) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.2 && live.stillT > 0.85) {
      got.current = true;
      pay(8, "butterfly");
      live.listen = "It landed on you. Then it left. That still counts.";
      if (g.current) g.current.visible = false;
    }
    if (d < 1.8) live.listen = live.listen || "Butterflies. Stay still.";
  });
  return (
    <group ref={g} position={[x, y + 0.9, z]}>
      <mesh rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.28, 0.02, 0.18]} />
        <meshLambertMaterial color="#e8a028" />
      </mesh>
    </group>
  );
}

function MapleSeed() {
  const x = T.x - 1.4;
  const z = T.z + 2.2;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  const fall = useRef(0);
  const start = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (!start.current && d < 1.6 && (live.slash || live.stompT > 0)) start.current = true;
    if (start.current && fall.current < 1) {
      fall.current += dt * 0.55;
      if (g.current) {
        g.current.position.y = y + 3.4 - fall.current * 3.2;
        g.current.rotation.y += dt * 14;
      }
      if (fall.current >= 1) {
        pay(6, "mapleseed");
        live.listen = "A spinning seed. It helicoptered.";
      }
    }
    if (d < 1.8 && !start.current) live.listen = live.listen || "Seeds in the oak. Shake it.";
  });
  return (
    <group ref={g} position={[x, y + 3.4, z]}>
      <mesh rotation={[0.2, 0, 0.6]}>
        <boxGeometry args={[0.28, 0.02, 0.08]} />
        <meshLambertMaterial color="#c47a28" />
      </mesh>
    </group>
  );
}

function CreakBoard() {
  const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
  const x = TREE_HOME.x + 1.35;
  const z = TREE_HOME.z + TREE_HD + 0.85;
  useFrame(() => {
    const d = Math.hypot(live.x - x, live.z - z);
    if (live.y > plat - 0.4 && d < 0.7 && Math.abs(live.speed) > 0.4) {
      pay(5, "creakboard");
      live.listen = "That board always creaks. Gran knows when you sneak.";
    }
  });
  return (
    <mesh position={[x, plat + 0.03, z]}>
      <boxGeometry args={[0.85, 0.05, 0.4]} />
      <meshLambertMaterial color="#6a3a22" />
    </mesh>
  );
}

function HollowKnock() {
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - T.x, live.z - T.z);
    if (d < 1.7 && d > 1.05 && live.slash) {
      pay(6, "hollowknock");
      live.listen = "The oak is hollow on this side. Something knocked back.";
    }
  });
  return null;
}

function PondDucks() {
  const ducks = useRef([
    { x: POND.x - 2.2, z: POND.z + 1.4, a: 0 },
    { x: POND.x + 1.6, z: POND.z - 2.1, a: 2 },
  ]);
  useFrame((_, dt) => {
    if (live.house) return;
    for (const dck of ducks.current) {
      dck.a += dt * 0.35;
      dck.x = POND.x + Math.cos(dck.a) * 4.2;
      dck.z = POND.z + Math.sin(dck.a * 0.8) * 3.4;
      const d = Math.hypot(live.x - dck.x, live.z - dck.z);
      if (d < 1.4 && live.carry === "flower") {
        live.carry = null;
        pay(8, "feedduck");
        live.listen = "They ate the flower. They wanted bread. They did not say no.";
      }
      if (d < 1.6) live.listen = live.listen || "Ducks. They will follow food.";
    }
  });
  const y = heightAt(POND.x, POND.z);
  return (
    <group>
      {ducks.current.map((_, i) => (
        <DuckMesh key={i} i={i} ducks={ducks} y={y} />
      ))}
    </group>
  );
}

function DuckMesh({
  i,
  ducks,
  y,
}: {
  i: number;
  ducks: MutableRefObject<{ x: number; z: number; a: number }[]>;
  y: number;
}) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const d = ducks.current[i]!;
    if (g.current) g.current.position.set(d.x, y + 0.22, d.z);
  });
  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[0.16, 6, 5]} />
        <meshLambertMaterial color="#d8c878" />
      </mesh>
      <mesh position={[0.14, 0.1, 0]}>
        <sphereGeometry args={[0.08, 5, 4]} />
        <meshLambertMaterial color="#d8c878" />
      </mesh>
      <mesh position={[0.22, 0.08, 0]}>
        <coneGeometry args={[0.04, 0.1, 4]} />
        <meshLambertMaterial color="#c45c28" />
      </mesh>
    </group>
  );
}

function ShoeToss() {
  const stake = { x: T.x + 20.2, z: T.z + 8.4 };
  const shoe = useRef({ x: T.x + 17.4, z: T.z + 8.4, flying: false, u: 0 });
  const g = useRef<THREE.Group>(null);
  const y = heightAt(stake.x, stake.z);
  useFrame((_, dt) => {
    if (live.house) return;
    const s = shoe.current;
    const d = Math.hypot(live.x - s.x, live.z - s.z);
    if (!s.flying && d < 1.1 && (talkOk() || live.slash)) {
      s.flying = true;
      s.u = 0;
    }
    if (s.flying) {
      s.u += dt * 1.1;
      const u = Math.min(1, s.u);
      s.x = T.x + 17.4 + (stake.x - (T.x + 17.4)) * u;
      s.z = T.z + 8.4;
      if (g.current) g.current.position.set(s.x, y + 0.2 + Math.sin(u * Math.PI) * 1.4, s.z);
      if (u >= 1) {
        s.flying = false;
        pay(8, "shoetoss");
        live.listen = "Ringer. Or close. Gran used to win this.";
      }
    }
    if (d < 1.6 && !s.flying) live.listen = live.listen || "Horseshoes. Throw at the stake.";
  });
  return (
    <group>
      <mesh position={[stake.x, y + 0.45, stake.z]}>
        <cylinderGeometry args={[0.04, 0.05, 0.9, 5]} />
        <meshLambertMaterial color="#8a8a78" />
      </mesh>
      <group ref={g} position={[T.x + 17.4, y + 0.12, T.z + 8.4]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <torusGeometry args={[0.14, 0.035, 6, 10]} />
          <meshLambertMaterial color="#8a8a78" />
        </mesh>
      </group>
    </group>
  );
}

function SunDial() {
  const x = T.x + 12.8;
  const z = T.z + 16.6;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.15 && talkOk()) {
      pay(6, "sundial");
      live.listen = "The shadow says it is later than you think.";
    }
    if (d < 1.5) live.listen = live.listen || "A sundial. No gears. Just the sun.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 12]} />
        <meshLambertMaterial color="#9a9288" />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation={[0.4, 0, 0]}>
        <coneGeometry args={[0.06, 0.45, 4]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
    </group>
  );
}

function PicnicSit() {
  const x = T.x + 4.4;
  const z = T.z - 9.6;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.2 && live.sit) {
      pay(6, "picnic");
      live.listen = "A picnic with no food. Still a picnic.";
    }
    if (d < 1.5) live.listen = live.listen || "A blanket. You can sit.";
  });
  return (
    <mesh position={[x, y + 0.03, z]} rotation={[-Math.PI / 2, 0, 0.3]}>
      <planeGeometry args={[1.6, 1.2]} />
      <meshLambertMaterial color="#c45c58" />
    </mesh>
  );
}

function BounceBall() {
  const p = useRef({ x: T.x + 11.6, z: T.z + 10.2, y: 0.3, vy: 0 });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house || !g.current) return;
    const b = p.current;
    const gy = heightAt(b.x, b.z);
    const d = Math.hypot(live.x - b.x, live.z - b.z);
    if (d < 1.05 && (live.stompT > 0 || !live.grounded || Math.abs(live.speed) > 3)) {
      b.vy = 6.4;
      pay(6, "bounceball");
      live.listen = "The ball bounced. Then it bounced again.";
    }
    b.vy -= 18 * dt;
    b.y += b.vy * dt;
    if (b.y < 0.18) {
      b.y = 0.18;
      b.vy *= -0.62;
    }
    g.current.position.set(b.x, gy + b.y, b.z);
    if (d < 1.5) live.listen = live.listen || "A ball. Kick it.";
  });
  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshLambertMaterial color="#c42828" />
      </mesh>
    </group>
  );
}

function CowBell() {
  const x = T.x + 19.6;
  const z = T.z + 18.2;
  const y = heightAt(x, z);
  const ding = useRef(0);
  useFrame((_, dt) => {
    ding.current = Math.max(0, ding.current - dt);
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.2 && (live.slash || talkOk()) && ding.current <= 0) {
      ding.current = 1;
      sfx.ok();
      pay(5, "cowbell");
      live.listen = "The cows did not come. They are not cows. They are sheep.";
    }
    if (d < 1.5) live.listen = live.listen || "A cowbell on a post.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 1.4, 5]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[0.12, 1.25, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.16, 6]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function DogStick() {
  const x = T.x + 14.8;
  const z = T.z + 13.6;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  const gone = useRef(false);
  useFrame(() => {
    if (live.house || gone.current) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.15 && (talkOk() || live.slash || live.carry === "stick")) {
      gone.current = true;
      live.dogFollow = Math.max(live.dogFollow, 8);
      pay(7, "dogstick");
      live.listen = "You threw it. Something ran. It did not bring it back.";
      if (g.current) g.current.visible = false;
    }
    if (d < 1.5) live.listen = live.listen || "A stick. Something would chase it.";
  });
  return (
    <group ref={g} position={[x, y + 0.06, z]} rotation={[0, 0.4, 0.2]}>
      <mesh>
        <cylinderGeometry args={[0.03, 0.04, 0.7, 5]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function NightCount() {
  useFrame(() => {
    if (live.house || live.dusk < 0.7) return;
    if (live.stillT > 1.4 && live.grounded && !live.sit) {
      pay(8, "starcount");
      live.listen = "You counted. You lost count. That is how stars work.";
    }
  });
  return null;
}

function FrogHop() {
  const p = useRef({ x: POND.x + 6.4, z: POND.z + 5.2, a: 0 });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const f = p.current;
    f.a += dt;
    if (Math.sin(f.a * 2) > 0.92) {
      f.x += Math.cos(f.a) * 0.8 * dt * 8;
      f.z += Math.sin(f.a) * 0.8 * dt * 8;
    }
    const y = heightAt(f.x, f.z) + (Math.sin(f.a * 2) > 0.7 ? 0.35 : 0.08);
    if (g.current) g.current.position.set(f.x, y, f.z);
    const d = Math.hypot(live.x - f.x, live.z - f.z);
    if (d < 1.05 && !live.grounded) {
      pay(8, "froghop");
      live.listen = "You hopped when it hopped.";
    }
    if (d < 1.6) live.listen = live.listen || "A frog. Hop when it hops.";
  });
  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[0.1, 6, 5]} />
        <meshLambertMaterial color="#3a7a38" />
      </mesh>
    </group>
  );
}
