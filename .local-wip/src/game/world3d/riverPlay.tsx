import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, pondU } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { addTrapSpot } from "./dungeonTraps";
import { consumeTalk as consumeTalkRaw } from "../input";
import { RV, RIVER_CANAL, inRapids } from "./lands";
import { N64Person, HERO_LOOK, N64Sign } from "./actors";
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

const hits: { x: number; z: number; r: number }[] = [];

export function addRiverHit(x: number, z: number, r: number) {
  hits.push({ x, z, r });
}

export function collideRiver(nx: number, nz: number): { x: number; z: number } | null {
  let x = nx;
  let z = nz;
  let hit = false;
  for (const s of hits) {
    const dx = x - s.x;
    const dz = z - s.z;
    const d2 = dx * dx + dz * dz;
    const rr = s.r * s.r;
    if (d2 < rr && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = s.x + (dx / d) * s.r;
      z = s.z + (dz / d) * s.r;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

export function riverLadders(): Ladder[] {
  return [{ id: "fallsivy", x: RV.ivy.x, z: RV.ivy.z, yaw: Math.PI * 0.5, h: 7.4, half: 0.68 }];
}

let riverCave = false;

export function RiverPlay() {
  return (
    <group>
      <RiverBegin />
      <RiverSign />
      <OutflowBridge />
      <LilyHop />
      <RiverHeron />
      <WreckBoat />
      <FordStones />
      <IsleReed />
      <ReedPath />
      <FallLog />
      <StoneBridge />
      <FishDock />
      <SluiceGate />
      <MillCanal />
      <RiverTurtle />
      <TurtleGate />
      <RiverOtter />
      <RapidsLog />
      <RapidsRocks />
      <Waterfall />
      <FallsCave />
      <BankNook />
      <DeepPool />
      <IsleTern />
      <Sandbar />
      <BankReeds />
      <Fisherman />
    </group>
  );
}

function RiverBegin() {
  useFrame(() => {
    hits.length = 0;
  }, -3);
  return null;
}

function RiverSign() {
  const { x, z } = RV.sign;
  useFrame(() => {
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 2.4)
      live.listen = live.listen || "Silverrun. Follow the water. It does not only go across.";
  });
  return <N64Sign x={x} z={z} />;
}

function FordStones() {
  const { x, z } = RV.ford;
  const y = heightAt(x, z);
  const stones = [
    [-4.2, -1.1],
    [-1.4, 0.6],
    [1.6, -0.4],
    [4.0, 0.8],
  ];
  useFrame(() => {
    if (live.house) return;
    for (const [ox, oz] of stones) addTrapSpot(x + ox, z + oz, 0.85, 0.38);
    if (Math.hypot(live.x - x, live.z - z) < 6 && pondU(live.x, live.z) > 0.12 && pondU(live.x, live.z) < 0.5)
      live.listen = live.listen || "The water is only to the knee here. You can walk.";
    if (Math.hypot(live.x - x, live.z - z) < 5) pay(6, "rivford");
  }, -2);
  return (
    <group>
      {stones.map(([ox, oz], i) => (
        <mesh key={i} position={[x + ox, y + 0.16, z + oz]} castShadow>
          <dodecahedronGeometry args={[0.55 + (i % 3) * 0.08, 0]} />
          <meshLambertMaterial color={i % 2 ? "#6a6858" : "#7a7868"} />
        </mesh>
      ))}
    </group>
  );
}

function IsleReed() {
  const { x, z } = RV.isle;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    addTrapSpot(x, z, 6.4, 0.55);
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 5.8) {
      live.listen = live.listen || "A spit of grass in the water. The river goes around.";
      if (d < 2.2) pay(10, "rivisle");
    }
  }, -2);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow>
        <circleGeometry args={[6.2, 12]} />
        <meshLambertMaterial color="#5a7a3a" />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = i * 1.7;
        return (
          <mesh key={i} position={[Math.cos(a) * 2.4, 0.7, Math.sin(a) * 2.1]} castShadow>
            <coneGeometry args={[0.55, 1.4, 6]} />
            <meshLambertMaterial color="#2a6a32" />
          </mesh>
        );
      })}
      <mesh position={[0.4, 0.42, -0.6]}>
        <boxGeometry args={[0.45, 0.35, 0.45]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function ReedPath() {
  const { x, z } = RV.reed;
  const y = heightAt(x, z);
  const end = { x: x + 8.4, z: z - 4.2 };
  const found = useRef(false);
  useFrame(() => {
    if (live.house) return;
    const along =
      live.x > x - 1.2 && live.x < end.x + 1.2 && live.z < z + 1.6 && live.z > end.z - 1.4 && Math.abs(live.z - (z + ((live.x - x) / 8.4) * (end.z - z))) < 1.5;
    if (along) {
      live.listen = live.listen || "The reeds close behind you.";
      found.current = true;
    }
    if (found.current && Math.hypot(live.x - end.x, live.z - end.z) < 1.4) {
      pay(14, "rivreed");
      live.listen = "A path the river hid. Someone left a rupee in the mud.";
    }
    if (Math.hypot(live.x - x, live.z - z) < 2.2 && !found.current)
      live.listen = live.listen || "The reeds are thicker here. You could push through.";
  });
  const stalks = Array.from({ length: 18 }, (_, i) => {
    const u = i / 17;
    return { x: x + u * 8.4 + (i % 3) * 0.35 - 0.35, z: z + u * (end.z - z) + ((i % 2) * 0.5 - 0.25) };
  });
  return (
    <group>
      {stalks.map((s, i) => (
        <mesh key={i} position={[s.x, y + 0.7, s.z]}>
          <cylinderGeometry args={[0.04, 0.05, 1.4, 4]} />
          <meshLambertMaterial color={i % 2 ? "#3a6a38" : "#2a5a30"} />
        </mesh>
      ))}
      <mesh position={[end.x, y + 0.18, end.z]}>
        <octahedronGeometry args={[0.16, 0]} />
        <meshLambertMaterial color="#3ec878" emissive="#1a6a40" emissiveIntensity={0.55} />
      </mesh>
    </group>
  );
}

function OutflowBridge() {
  const { x, z } = RV.span;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    for (let i = 0; i < 6; i++) addTrapSpot(x, z - 3.2 + i * 1.2, 0.7, 0.55);
    if (Math.hypot(live.x - x, live.z - z) < 4)
      live.listen = live.listen || "The pond lets go here. Wade, or take the planks. The river keeps going.";
    if (Math.hypot(live.x - x, live.z - z) < 2.2) pay(6, "rivspan");
  }, -2);
  return (
    <group>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[x, y + 0.38, z - 3.2 + i * 1.2]} castShadow>
          <boxGeometry args={[1.55, 0.16, 1.15]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      ))}
      {[-0.7, 0.7].map((s) => (
        <mesh key={s} position={[x + s, y + 0.72, z]} >
          <boxGeometry args={[0.08, 0.7, 7.2]} />
          <meshLambertMaterial color="#4a3220" />
        </mesh>
      ))}
    </group>
  );
}

function LilyHop() {
  const { x, z } = RV.lily;
  const pads = [
    [0, 0],
    [3.2, -1.4],
    [6.6, 0.6],
    [9.4, -1.1],
    [12.8, 0.4],
  ];
  useFrame(() => {
    if (live.house) return;
    for (const [ox, oz] of pads) addTrapSpot(x + ox, z + oz, 0.85, 0.22);
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 8) live.listen = live.listen || "Lily pads. They hold if you are light about it.";
    if (Math.hypot(live.x - (x + 12.8), live.z - (z + 0.4)) < 1.1) pay(10, "rivlily");
  }, -2);
  const y = heightAt(x, z);
  return (
    <group>
      {pads.map(([ox, oz], i) => (
        <mesh key={i} position={[x + ox, y + 0.12, z + oz]} rotation={[-Math.PI / 2, 0, i]} receiveShadow>
          <circleGeometry args={[0.72 + (i % 2) * 0.1, 7]} />
          <meshLambertMaterial color={i % 2 ? "#2e6a32" : "#3a7a38"} />
        </mesh>
      ))}
    </group>
  );
}

function RiverHeron() {
  const start = RV.heron;
  const p = useRef({ x: start.x, z: start.z, y: 0, gone: false });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const o = p.current;
    const d = Math.hypot(live.x - start.x, live.z - start.z);
    if (!o.gone && d < 2.8) {
      o.gone = true;
      sfx.ok();
      live.listen = "The bird left. It had been standing on a rupee.";
      pay(12, "rivheron");
    }
    if (o.gone) {
      o.x += dt * 4.2;
      o.y += dt * 2.6;
      o.z -= dt * 1.1;
    }
    if (g.current) {
      g.current.position.set(o.x, heightAt(start.x, start.z) + 0.55 + o.y, o.z);
      g.current.visible = o.y < 18;
    }
    if (d < 4 && !o.gone) live.listen = live.listen || "A heron in the shallows. Walk up. It will tell on the mud.";
  });
  return (
    <group ref={g} position={[start.x, heightAt(start.x, start.z) + 0.55, start.z]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.22, 6, 5]} />
        <meshLambertMaterial color="#e8e0d0" />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.7, 4]} />
        <meshLambertMaterial color="#e8e0d0" />
      </mesh>
      <mesh position={[0.18, 0.7, 0.12]} rotation={[0.2, 0.4, 0.8]}>
        <boxGeometry args={[0.55, 0.06, 0.22]} />
        <meshLambertMaterial color="#d8d0c0" />
      </mesh>
      <mesh position={[0, 0.82, 0.22]}>
        <coneGeometry args={[0.04, 0.28, 4]} />
        <meshLambertMaterial color="#c87828" />
      </mesh>
    </group>
  );
}

function WreckBoat() {
  const { x, z } = RV.wreck;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    addTrapSpot(x, z, 1.3, 0.28);
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.6 && talkOk()) {
      pay(14, "rivwreck");
      live.listen = "A boat that lost the argument. Someone left a rupee under the rib.";
    }
    if (d < 2.4) live.listen = live.listen || "A wreck in the weeds. Talk to it. Boats keep pockets.";
  }, -2);
  return (
    <group position={[x, y, z]} rotation={[0.18, 0.6, 0.12]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[2.4, 0.22, 1.05]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      {[-0.9, 0.9].map((s) => (
        <mesh key={s} position={[s, 0.42, 0]}>
          <boxGeometry args={[0.12, 0.4, 1.0]} />
          <meshLambertMaterial color="#4a3220" />
        </mesh>
      ))}
    </group>
  );
}

function FallLog() {
  const { x, z } = RV.log;
  const y = heightAt(x, z);
  const hitsN = useRef(0);
  const down = useRef(Boolean(live.smashed.rivlog));
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (!down.current && live.slash && d < 1.8) {
      hitsN.current += 1;
      sfx.thud();
      live.listen = hitsN.current < 3 ? "The trunk shook." : "It is coming down.";
      if (hitsN.current >= 3) {
        down.current = true;
        pay(10, "rivlog");
        live.listen = "The log fell across the water. A bridge.";
      }
    }
    if (g.current) {
      const want = down.current ? Math.PI / 2 : 0;
      g.current.rotation.x += (want - g.current.rotation.x) * (1 - Math.exp(-dt * 4));
    }
    if (down.current) {
      for (let i = 0; i < 9; i++) addTrapSpot(x, z + 0.7 + i * 1.15, 0.72, 0.45);
    }
    if (d < 2.2 && !down.current) live.listen = live.listen || "A leaning tree. Chop. It wants to be a bridge.";
  }, -2);
  return (
    <group ref={g} position={[x, y + 0.18, z]}>
      <mesh position={[0, 5.4, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.3, 11.2, 7]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[0, 11.1, 0]} castShadow>
        <sphereGeometry args={[1.05, 6, 5]} />
        <meshLambertMaterial color="#2a6a32" />
      </mesh>
    </group>
  );
}

function StoneBridge() {
  const { x, z } = RV.ford;
  const y = heightAt(x, z);
  const bx = x + 8.4;
  const bz = z + 0.4;
  useFrame(() => {
    if (live.house) return;
    for (let i = 0; i < 5; i++) addTrapSpot(bx + i * 1.15, bz, 0.7, 0.62);
    if (Math.hypot(live.x - bx, live.z - bz) < 3)
      live.listen = live.listen || "Old stone. It only goes halfway. The rest is water.";
  }, -2);
  return (
    <group>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[bx + i * 1.15, y + 0.42, bz]} castShadow>
          <boxGeometry args={[1.2, 0.38, 1.7]} />
          <meshLambertMaterial color="#7a7868" />
        </mesh>
      ))}
      <mesh position={[bx + 2.2, y + 0.95, bz + 0.95]}>
        <boxGeometry args={[5.4, 0.7, 0.18]} />
        <meshLambertMaterial color="#6a6858" />
      </mesh>
    </group>
  );
}

function FishDock() {
  const { x, z } = RV.dock;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    addTrapSpot(x, z, 1.6, 0.42);
    if (Math.abs(live.x - x) < 2.4 && Math.abs(live.z - z) < 1.6)
      live.listen = live.listen || "A dock. Equip the pole. Cast. Pull when it dives.";
  }, -2);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <boxGeometry args={[3.4, 0.16, 1.8]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      {[-1.4, 1.4].map((s) => (
        <mesh key={s} position={[s, -0.15, 0.7]}>
          <cylinderGeometry args={[0.08, 0.1, 0.7, 5]} />
          <meshLambertMaterial color="#4a3220" />
        </mesh>
      ))}
    </group>
  );
}

function SluiceGate() {
  const { x, z } = RV.sluice;
  const y = heightAt(x, z);
  const lever = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    addRiverHit(x, z - 0.4, 0.85);
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.6 && talkOk()) {
      live.riverLow = !live.riverLow;
      sfx.ok();
      if (live.riverLow) {
        pay(12, "rivsluice");
        live.listen = "The wheel turned. The river sank. A sandbar woke up.";
      } else {
        live.listen = "The water climbed back. The sandbar went to sleep.";
      }
    }
    if (lever.current) {
      const want = live.riverLow ? 0.9 : 0;
      lever.current.rotation.z += (want - lever.current.rotation.z) * (1 - Math.exp(-dt * 6));
    }
    if (d < 2.2) live.listen = live.listen || "A sluice. Talk to it. The river will listen.";
  }, -2);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.7, -0.4]} castShadow>
        <boxGeometry args={[2.4, 1.4, 0.28]} />
        <meshLambertMaterial color="#5a4a3c" />
      </mesh>
      <mesh position={[0, 1.1, -0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.55, 0.55, 0.22, 10]} />
        <meshLambertMaterial color="#8a8478" />
      </mesh>
      <group ref={lever} position={[0.7, 1.15, 0]}>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 1.15, 5]} />
          <meshLambertMaterial color="#4a3220" />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <sphereGeometry args={[0.12, 6, 5]} />
          <meshLambertMaterial color="#c42828" />
        </mesh>
      </group>
    </group>
  );
}

function MillCanal() {
  const { x, z } = RV.mill;
  const y = heightAt(x, z);
  const wheel = useRef<THREE.Group>(null);
  const gate = useRef<THREE.Mesh>(null);
  const canal = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    addRiverHit(x, z, 1.4);
    const lever = { x: x + 2.6, z: z + 1.2 };
    const d = Math.hypot(live.x - lever.x, live.z - lever.z);
    if (d < 1.4 && talkOk()) {
      live.riverDivert = !live.riverDivert;
      sfx.ok();
      if (live.riverDivert) {
        pay(12, "rivdivert");
        live.listen = "Water left the main. The wheel woke. A hatch clicked.";
      } else {
        live.listen = "The canal went dry. The wheel forgot.";
      }
    }
    if (canal.current) canal.current.visible = live.riverDivert;
    if (wheel.current && live.riverDivert) wheel.current.rotation.z -= dt * 1.6;
    if (gate.current) gate.current.position.y += ((live.riverDivert ? 1.6 : 0.35) - gate.current.position.y) * (1 - Math.exp(-dt * 5));
    if (live.riverDivert && Math.hypot(live.x - x, live.z - (z - 2.2)) < 1.3) {
      pay(16, "rivmillchest");
      live.listen = "Grain. And a rupee the miller hid from the river.";
    }
    if (d < 2) live.listen = live.listen || "A gate on the bank. Open it. The river will take a new road.";
  }, -2);
  const canalY = heightAt(RIVER_CANAL[1]![0], RIVER_CANAL[1]![1]);
  return (
    <group>
      {RIVER_CANAL.slice(0, -1).map((a, i) => {
        const b = RIVER_CANAL[i + 1]!;
        const mx = (a[0] + b[0]) * 0.5;
        const mz = (a[1] + b[1]) * 0.5;
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const len = Math.hypot(dx, dz);
        return (
          <mesh key={`bed${i}`} position={[mx, canalY + 0.02, mz]} rotation={[-Math.PI / 2, 0, Math.atan2(dx, dz)]} receiveShadow>
            <planeGeometry args={[4.8, len + 1.0]} />
            <meshLambertMaterial color="#6a4a28" />
          </mesh>
        );
      })}
      <group ref={canal} visible={false}>
        {RIVER_CANAL.slice(0, -1).map((a, i) => {
            const b = RIVER_CANAL[i + 1]!;
            const mx = (a[0] + b[0]) * 0.5;
            const mz = (a[1] + b[1]) * 0.5;
            const dx = b[0] - a[0];
            const dz = b[1] - a[1];
            const len = Math.hypot(dx, dz);
            return (
              <mesh key={i} position={[mx, canalY + 0.06, mz]} rotation={[-Math.PI / 2, 0, Math.atan2(dx, dz)]}>
                <planeGeometry args={[4.4, len + 0.8]} />
                <meshLambertMaterial color="#3a7a88" transparent opacity={0.8} />
              </mesh>
            );
          })}
      </group>
      <group position={[x, y, z]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[2.8, 2.8, 2.4]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
        <mesh position={[0, 2.95, 0]} rotation={[0, 0.2, 0]} castShadow>
          <coneGeometry args={[2.1, 1.1, 4]} />
          <meshLambertMaterial color="#8a3a28" />
        </mesh>
        <group ref={wheel} position={[1.55, 1.2, 0.2]}>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[1.05, 1.05, 0.22, 10]} />
            <meshLambertMaterial color="#5a3a22" />
          </mesh>
          {[-0.7, 0, 0.7].map((s) => (
            <mesh key={s} position={[0, s, 0]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[1.9, 0.08, 0.12]} />
              <meshLambertMaterial color="#4a3220" />
            </mesh>
          ))}
        </group>
        <mesh ref={gate} position={[0, 0.35, -1.35]}>
          <boxGeometry args={[1.1, 1.2, 0.1]} />
          <meshLambertMaterial color="#2a1810" />
        </mesh>
      </group>
      <mesh position={[x + 2.6, heightAt(x + 2.6, z + 1.2) + 0.55, z + 1.2]}>
        <boxGeometry args={[0.35, 1.1, 0.18]} />
        <meshLambertMaterial color="#8a8478" />
      </mesh>
    </group>
  );
}

function RiverTurtle() {
  const start = RV.turtle;
  const p = useRef({ x: start.x, z: start.z });
  const g = useRef<THREE.Group>(null);
  const gone = useRef(Boolean(live.smashed.rivturtle));
  const hp = useRef(3);
  useFrame((_, dt) => {
    if (live.house) return;
    const o = p.current;
    if (!gone.current) addRiverHit(o.x, o.z, 1.55);
    const d = Math.hypot(live.x - o.x, live.z - o.z);
    const have = useGame.getState().fish ?? 0;
    if (!gone.current && d < 1.8 && talkOk() && have > 0) {
      useGame.setState({ fish: have - 1 });
      gone.current = true;
      pay(14, "rivturtle");
      live.listen = "It took the fish. Then it took itself out of the way.";
    } else if (!gone.current && live.slash && d < 1.9) {
      hp.current -= 1;
      sfx.hit();
      live.listen = hp.current > 0 ? "The shell rang." : "It decided the shortcut was not worth it.";
      if (hp.current <= 0) {
        gone.current = true;
        pay(14, "rivturtle");
      }
    }
    if (gone.current) {
      o.x += dt * 1.4;
      o.z += dt * 0.4;
    }
    if (g.current) {
      g.current.position.set(o.x, heightAt(o.x, o.z) + 0.28, o.z);
      g.current.visible = Math.hypot(o.x - start.x, o.z - start.z) < 18;
    }
    if (d < 2.6 && !gone.current)
      live.listen = live.listen || "A turtle in the shortcut. Feed it a fish. Or insist.";
    if (gone.current) {
      for (let i = 0; i < 6; i++) addTrapSpot(start.x + 1.2 + i * 1.1, start.z + 1.6 + i * 0.15, 0.7, 0.5);
    }
  }, -2);
  return (
    <group ref={g} position={[start.x, heightAt(start.x, start.z) + 0.28, start.z]}>
      <mesh castShadow>
        <sphereGeometry args={[0.72, 8, 6]} />
        <meshLambertMaterial color="#3a6a48" />
      </mesh>
      <mesh position={[0, 0.22, 0]} scale={[1.15, 0.45, 1.05]}>
        <sphereGeometry args={[0.7, 8, 6]} />
        <meshLambertMaterial color="#2a4a32" />
      </mesh>
      <mesh position={[0, 0.15, 0.72]}>
        <sphereGeometry args={[0.22, 6, 5]} />
        <meshLambertMaterial color="#4a7a58" />
      </mesh>
    </group>
  );
}

function RapidsLog() {
  const p = useRef({ x: RV.drift.x, z: RV.drift.z, u: 0 });
  const g = useRef<THREE.Group>(null);
  const on = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    const c = p.current;
    if (!on.current) {
      c.u += dt * 0.18;
      c.x = RV.drift.x + Math.sin(c.u) * 6.4;
      c.z = RV.drift.z + c.u * 1.1;
      if (c.u > 8) {
        c.u = 0;
        c.x = RV.drift.x;
        c.z = RV.drift.z;
      }
    } else {
      c.x += 5.8 * dt;
      c.z += 2.2 * dt;
      live.x = c.x;
      live.z = c.z;
      addTrapSpot(c.x, c.z, 0.8, 0.4);
      if (c.x > RV.falls.x - 4) {
        on.current = false;
        live.listen = "The log would not go over. Jump.";
        c.u = 0;
        c.x = RV.drift.x;
        c.z = RV.drift.z;
      } else {
        live.listen = "The log is going. Jump when you want off.";
      }
    }
    const d = Math.hypot(live.x - c.x, live.z - c.z);
    if (d < 1.05 && live.grounded && !on.current && live.stillT > 0.2) {
      on.current = true;
      pay(8, "rivdrift");
    }
    if (on.current && (Math.abs(live.speed) > 3.2 || consumeTalkRaw())) on.current = false;
    if (g.current) g.current.position.set(c.x, heightAt(c.x, c.z) + 0.22, c.z);
    if (d < 1.8 && !on.current && inRapids(c.x, c.z))
      live.listen = live.listen || "A log in the white water. Stand on it.";
  }, -2);
  return (
    <group ref={g}>
      <mesh rotation={[0, 0.5, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.24, 1.7, 7]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function Waterfall() {
  const { x, z } = RV.falls;
  const y = heightAt(x, z);
  const sheets = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    sheets.current.forEach((m, i) => {
      if (!m) return;
      const mat = m.material as THREE.MeshLambertMaterial;
      mat.opacity = 0.32 + Math.sin(t * 3.2 + i) * 0.1;
      m.position.y = y + 3.4 + Math.sin(t * 4 + i) * 0.08;
    });
    addRiverHit(x + 3.5, z + 0.6, 1.85);
    addRiverHit(x - 3.6, z + 0.4, 1.85);
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 3.8 && !riverCave) live.listen = live.listen || "A waterfall. Walk through the middle. The water is a door.";
  }, -2);
  return (
    <group>
      <mesh position={[x + 0.4, y + 4.2, z + 1.4]} castShadow>
        <boxGeometry args={[8.4, 8.6, 3.2]} />
        <meshLambertMaterial color="#6a6858" />
      </mesh>
      <mesh position={[x - 3.2, y + 3.6, z + 0.6]} castShadow>
        <boxGeometry args={[3.4, 7.4, 2.6]} />
        <meshLambertMaterial color="#5a5850" />
      </mesh>
      {[-1.2, -0.2, 0.8].map((s, i) => (
        <mesh
          key={s}
          ref={(el) => {
            sheets.current[i] = el;
          }}
          position={[x + s * 0.7, y + 3.4, z - 0.35]}
          rotation={[0.08, 0, 0]}
        >
          <boxGeometry args={[1.15, 7.2, 0.18]} />
          <meshLambertMaterial color="#8ec8d8" transparent opacity={0.42} depthWrite={false} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`mist${i}`} position={[x + (i - 1.5) * 0.7, y + 0.4 + (i % 2) * 0.3, z - 1.4 - (i % 2) * 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.85, 7]} />
          <meshLambertMaterial color="#d8eef0" transparent opacity={0.28} depthWrite={false} />
        </mesh>
      ))}
      <mesh position={[x + 0.2, y + 0.15, z - 2.4]} rotation={[-Math.PI / 2, 0, 0.1]}>
        <circleGeometry args={[3.4, 12]} />
        <meshLambertMaterial color="#8ec8d0" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <group position={[RV.ivy.x, heightAt(RV.ivy.x, RV.ivy.z), RV.ivy.z]}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[0, 0.45 + i * 0.88, 0]}>
            <boxGeometry args={[0.18, 0.7, 0.08]} />
            <meshLambertMaterial color="#2a6a32" />
          </mesh>
        ))}
      </group>
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
  const u = Math.min(1, t.current / 1.12);
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

function FallsCave() {
  const fall = RV.falls;
  const cave = RV.cave;
  const fy = heightAt(fall.x, fall.z);
  const cy = heightAt(cave.x, cave.z);
  const going = useRef<"" | "in" | "out">("");
  const t = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const dFall = Math.hypot(live.x - fall.x, live.z - fall.z);
    const dCave = Math.hypot(live.x - cave.x, live.z - cave.z);
    const mouth = live.riverLow ? 1.7 : 1.35;
    if (!going.current && !riverCave && dFall < mouth && live.z > fall.z - 0.4) {
      going.current = "in";
      t.current = 0;
    }
    if (!going.current && riverCave && dCave < 1.3 && live.z < cave.z - 1.8) {
      going.current = "out";
      t.current = 0;
    }
    fadeWarp(going, t, dt, (dir) => {
      riverCave = dir === "in";
      live.cave = riverCave;
      live.wetT = 3;
      if (dir === "in") {
        live.x = cave.x;
        live.z = cave.z;
        live.y = cy + 0.2;
        pay(12, "rivcave");
        live.listen = "Behind the water. The river sounds like a door from here.";
      } else {
        live.x = fall.x;
        live.z = fall.z - 2.1;
        live.y = fy + 0.2;
        live.cave = false;
      }
    });
    if (riverCave) {
      live.dusk = Math.max(live.dusk, 0.82);
      if (dCave < 1.2 && talkOk()) {
        pay(18, "rivcavechest");
        live.listen = "Someone hid this from the sun. And from the fish.";
      }
    }
  }, 1);
  if (!riverCave) return null;
  return (
    <group position={[cave.x, cy, cave.z]}>
      <mesh position={[0, 1.5, 2.2]}>
        <boxGeometry args={[5.2, 3.1, 0.4]} />
        <meshLambertMaterial color="#2a2218" />
      </mesh>
      {[-2.4, 2.4].map((s) => (
        <mesh key={s} position={[s, 1.5, 0.2]}>
          <boxGeometry args={[0.4, 3.1, 4.4]} />
          <meshLambertMaterial color="#2a2218" />
        </mesh>
      ))}
      <mesh position={[0, 3.1, 0.2]}>
        <boxGeometry args={[5.2, 0.3, 4.6]} />
        <meshLambertMaterial color="#1a140e" />
      </mesh>
      <mesh position={[0.6, 0.4, 0.8]}>
        <octahedronGeometry args={[0.18, 0]} />
        <meshLambertMaterial color="#3ec8c8" emissive="#1a6a6a" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

function DeepPool() {
  const { x, z } = RV.hole;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4 && pondU(live.x, live.z) > 0.5)
      live.listen = live.listen || "The dark water. Hold talk to go under.";
    if (live.under && d < 1.6) {
      pay(20, "rivdive");
      live.listen = "A rupee on the floor of the river. It had been waiting.";
    }
  });
  return (
    <mesh position={[x, y + 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[2.2, 12]} />
      <meshLambertMaterial color="#1a3a48" transparent opacity={0.55} />
    </mesh>
  );
}

function IsleTern() {
  const { x, z } = RV.isle2;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    addTrapSpot(x, z, 5.2, 0.5);
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4.8) live.listen = live.listen || "The second island. The pool keeps it.";
    if (d < 1.4 && talkOk()) {
      pay(16, "rivisle2");
      live.listen = "A nest. The bird was not home. The rupee was.";
    }
  }, -2);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[5.0, 12]} />
        <meshLambertMaterial color="#5a7a3a" />
      </mesh>
      <mesh position={[0.2, 0.48, 0.3]}>
        <torusGeometry args={[0.45, 0.12, 6, 10]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function TurtleGate() {
  const { x, z } = RV.turtle;
  const y = heightAt(x, z);
  const rocks = [
    [-2.4, 1.8],
    [-1.2, 2.4],
    [1.4, 2.2],
    [2.6, 1.6],
  ];
  useFrame(() => {
    if (live.house) return;
    for (const [ox, oz] of rocks) addRiverHit(x + ox, z + oz, 0.85);
    if (Math.hypot(live.x - x, live.z - z) < 4 && !live.smashed.rivturtle)
      live.listen = live.listen || "Rocks pinch the bank. The turtle is the gate.";
  }, -2);
  return (
    <group>
      {rocks.map(([ox, oz], i) => (
        <mesh key={i} position={[x + ox, y + 0.45, z + oz]} castShadow>
          <dodecahedronGeometry args={[0.7 + (i % 2) * 0.12, 0]} />
          <meshLambertMaterial color={i % 2 ? "#6a6858" : "#5a5848"} />
        </mesh>
      ))}
    </group>
  );
}

function RiverOtter() {
  const start = RV.otter;
  const p = useRef({ u: 0 });
  const g = useRef<THREE.Group>(null);
  const saw = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    p.current.u += dt * 0.22;
    const u = p.current.u;
    const x = start.x + Math.sin(u) * 10.4;
    const z = start.z + Math.cos(u * 0.7) * 3.2;
    if (g.current) g.current.position.set(x, heightAt(x, z) + 0.16, z);
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.2) {
      live.listen = live.listen || "An otter. It wants you to keep up.";
      saw.current = true;
    }
    if (saw.current && Math.hypot(live.x - RV.reed.x, live.z - RV.reed.z) < 2.2) {
      pay(12, "rivotter");
      live.listen = "The otter dove. The reeds kept a rupee.";
    }
  });
  return (
    <group ref={g}>
      <mesh rotation={[0, 0.4, 0.2]} castShadow>
        <sphereGeometry args={[0.28, 6, 5]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[0.28, 0.05, 0.08]}>
        <sphereGeometry args={[0.14, 5, 4]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function RapidsRocks() {
  const { x, z } = RV.rapids;
  const y = heightAt(x, z);
  const stones = [
    [-2.4, -1.6],
    [0.2, 0.4],
    [2.6, -0.8],
    [5.0, 0.6],
    [7.4, -0.4],
  ];
  useFrame(() => {
    if (live.house) return;
    for (const [ox, oz] of stones) addTrapSpot(x + ox, z + oz, 0.8, 0.52);
    if (Math.hypot(live.x - x, live.z - z) < 6)
      live.listen = live.listen || "White water. Hop the stones or the river will take you.";
  }, -2);
  return (
    <group>
      {stones.map(([ox, oz], i) => (
        <mesh key={i} position={[x + ox, y + 0.28, z + oz]} castShadow>
          <dodecahedronGeometry args={[0.62 + (i % 3) * 0.08, 0]} />
          <meshLambertMaterial color={i % 2 ? "#8a8880" : "#7a786e"} />
        </mesh>
      ))}
    </group>
  );
}

function BankNook() {
  const { x, z } = RV.bankcave;
  const y = heightAt(x, z);
  const inNook = useRef(false);
  useFrame(() => {
    if (live.house) return;
    addRiverHit(x - 1.6, z + 0.8, 1.1);
    addRiverHit(x + 1.6, z + 0.8, 1.1);
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.4 && live.z > z - 0.2) {
      inNook.current = true;
      pay(16, "rivnook");
      live.listen = "A hole in the bank. The river did not want this seen from the path.";
    }
    if (d < 2.6 && !inNook.current) live.listen = live.listen || "Ivy on the north bank. Push through.";
  }, -2);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.1, 0.9]} castShadow>
        <boxGeometry args={[3.4, 2.2, 1.6]} />
        <meshLambertMaterial color="#4a463c" />
      </mesh>
      <mesh position={[0, 0.85, 0.05]}>
        <boxGeometry args={[1.15, 1.5, 0.4]} />
        <meshLambertMaterial color="#1a140e" />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-0.4 + (i % 3) * 0.4, 0.4 + i * 0.28, -0.15]}>
          <boxGeometry args={[0.14, 0.5, 0.06]} />
          <meshLambertMaterial color="#2a6a32" />
        </mesh>
      ))}
    </group>
  );
}

function Sandbar() {
  const a = { x: RV.isle.x - 10.4, z: RV.isle.z + 1.2 };
  const y = heightAt(a.x, a.z);
  const g = useRef<THREE.Group>(null);
  const chest = { x: a.x + 4.2, z: a.z - 0.4 };
  useFrame(() => {
    if (g.current) g.current.visible = live.riverLow;
    if (live.house || !live.riverLow) return;
    for (let i = 0; i < 7; i++) addTrapSpot(a.x + i * 1.35, a.z - i * 0.15, 0.95, 0.32);
    if (Math.hypot(live.x - a.x, live.z - a.z) < 8)
      live.listen = live.listen || "The river gave the sand back. Walk it before the wheel forgets.";
    if (Math.hypot(live.x - chest.x, live.z - chest.z) < 1.2) {
      pay(18, "rivsandchest");
      live.listen = "Buried while the water was high. The sluice is a thief too.";
    }
  }, -2);
  return (
    <group ref={g} visible={false}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[a.x + i * 1.35, y + 0.08, a.z - i * 0.15]} rotation={[-Math.PI / 2, 0, 0.1]} receiveShadow>
          <circleGeometry args={[1.05, 8]} />
          <meshLambertMaterial color="#c4b07a" />
        </mesh>
      ))}
      <mesh position={[chest.x, y + 0.28, chest.z]} castShadow>
        <boxGeometry args={[0.55, 0.42, 0.42]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function BankReeds() {
  const pts = [
    [RV.span.x + 8, RV.span.z + 10],
    [RV.lily.x - 6, RV.lily.z + 8],
    [RV.heron.x + 10, RV.heron.z + 9],
    [RV.ford.x - 8, RV.ford.z + 12],
    [RV.dock.x - 6, RV.dock.z + 8],
    [RV.pool.x - 14, RV.pool.z + 10],
    [RV.isle.x + 10, RV.isle.z + 12],
    [RV.rapids.x - 8, RV.rapids.z + 10],
  ];
  return (
    <group>
      {pts.map(([x, z], i) => {
        const y = heightAt(x, z);
        return (
          <group key={i} position={[x, y, z]}>
            {Array.from({ length: 9 }, (_, k) => (
              <mesh key={k} position={[(k % 3) * 0.45 - 0.45, 0.7, Math.floor(k / 3) * 0.38]}>
                <cylinderGeometry args={[0.035, 0.045, 1.4, 4]} />
                <meshLambertMaterial color={k % 2 ? "#3a6a38" : "#2a5a30"} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function Fisherman() {
  const x = RV.dock.x - 3.4;
  const z = RV.dock.z + 3.2;
  useFrame(() => {
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 2.4)
      live.listen =
        live.listen ||
        (live.riverLow
          ? "He lowered it. The sand remembers fish that used to swim there."
          : "East is the mill gate. Further, a turtle sits in a pinch. The falls keep a room.");
  });
  return (
    <N64Person
      look={{
        ...HERO_LOOK,
        tunic: "#3a6a88",
        shirt: "#efe6d4",
        kit: "vest",
        pants: "#3a3228",
        hair: "#c8b090",
      }}
      x={x}
      z={z}
      seed={77}
      stay
      facing={0.6}
    />
  );
}
