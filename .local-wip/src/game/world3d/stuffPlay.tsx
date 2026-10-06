import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { addTrapSpot } from "./dungeonTraps";
import { consumeTalk as consumeTalkRaw } from "../input";
import { puffAt } from "./fx";
import {
  stuffWorld,
  stepStuff,
  liveStuffCtx,
  stuffTrapSpots,
  stuffHeld,
  nearestStuff,
  stuffChestReady,
  STUFF_AT,
  type StuffEvent,
  type StuffWorld,
} from "./stuff";
import type { WorldId } from "../types";

function pay(n: number, key: string, line?: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
  if (line) live.listen = line;
}

function talkOk() {
  if (live.nearNpc || live.nearHouse || live.nearChest || live.nearHorse || live.nearCave || live.nearGate) {
    if (!stuffHeld()) return false;
  }
  return consumeTalkRaw();
}

function playEvents(ev: StuffEvent[], w: StuffWorld) {
  for (const e of ev) {
    if (e === "lift") sfx.pick();
    else if (e === "throw") sfx.throw();
    else if (e === "break") sfx.smash();
    else if (e === "thud") sfx.thud();
    else if (e === "splash") sfx.splash();
    else if (e === "plate" || e === "gate" || e === "beam" || e === "bridge") sfx.ok();
    else if (e === "smash") sfx.smash();
  }
  const held = stuffHeld();
  live.carry = held ? (held.kind === "crate" || held.kind === "barrel" || held.kind === "pot" ? "crate" : live.carry) : live.carry === "crate" ? null : live.carry;
  if (held) live.carryT = 1;

  const yard = w.gates.find((g) => g.id === "gate-yard");
  if (yard?.open) pay(8, "stuff-yard", "The bar lifted. Something was waiting.");
  const beam = w.gates.find((g) => g.id === "gate-beam");
  if (beam?.open) pay(10, "stuff-beam", "The light sat. The bar went with it.");
  const gap = w.gaps.find((g) => g.id === "gap-creek");
  if (gap?.bridged) pay(8, "stuff-bridge", "The bark sat in the water. The other bank got closer.");
  const path = w.gaps.find((g) => g.id === "gap-path");
  if (path?.bridged) pay(8, "stuff-path", "The path remembered.");
  const crack = w.cracks.find((c) => c.id === "crack-hill");
  if (crack?.dead) pay(8, "stuff-crack", "The wall remembered the bang.");

  const isle = w.chests.find((c) => c.id === "chest-isle");
  if (isle && !isle.open) {
    const crate = w.things.find((t) => t.id === "crate-pond" && !t.dead);
    if (crate?.wet && Math.hypot(crate.x - isle.x, crate.z - isle.z) < 2.4) {
      pay(10, "stuff-raft", "The box rode the water. You could too.");
    }
  }
}

export function StuffPlay({ worldId }: { worldId: WorldId }) {
  const map = worldId === "cavern" ? "cavern" : "meadow";
  if (worldId !== "meadow" && worldId !== "cavern") return null;
  return (
    <group>
      <StuffSim map={map} />
      <StuffMeshes map={map} />
      <YardGate />
      {worldId === "meadow" ? <CreekGap /> : null}
      {worldId === "meadow" ? <LookLedge /> : null}
      {worldId === "meadow" ? <SunBeam /> : null}
      {worldId === "meadow" ? <CrackWall /> : null}
      {worldId === "meadow" ? <StuffChests /> : null}
    </group>
  );
}

function StuffSim({ map }: { map: string }) {
  useFrame((_, dt) => {
    const w = stuffWorld(map);
    const want = !live.paused && talkOk();
    const ev = stepStuff(w, liveStuffCtx(dt, want));
    if (ev.length) playEvents(ev, w);
    const carrying = stuffHeld();
    if (carrying && (carrying.kind === "crate" || carrying.kind === "barrel" || carrying.kind === "pot")) live.carry = "crate";
    else if (!carrying && live.carry === "crate") live.carry = null;
    stuffTrapSpots(addTrapSpot);

    const n = nearestStuff(live.x, live.z, 1.35);
    if (n && !n.held && !live.listen && live.stillT > 0.45) {
      if (n.kind === "statue") live.listen = "A stone with a bright face.";
      else if (n.kind === "boulder") live.listen = "The hill wants it.";
      else if (n.pinned) live.listen = "It does not even lean.";
    }
    const held = stuffHeld();
    if (held && !live.listen && !live.smashed.stuffhold) {
      live.smashed.stuffhold = true;
      live.listen = "F lets go.";
    }

    for (const t of w.things) {
      if (!t.dead || live.smashed[`box-${t.id}`]) continue;
      if (t.kind === "pot") {
        live.smashed[`box-${t.id}`] = true;
        const nCoins = useGame.getState().addCoins(3);
        if (nCoins > 0) revealItem("coin");
        puffAt(t.x, t.z, t.y + 0.3, true);
      } else if (t.kind === "crate" || t.kind === "barrel") {
        live.smashed[`box-${t.id}`] = true;
        puffAt(t.x, t.z, t.y + 0.4, true);
        const nCoins = useGame.getState().addCoins(4);
        if (nCoins > 0) revealItem("coin");
      }
    }
  }, -2);
  return null;
}

function StuffMeshes({ map }: { map: string }) {
  const w = stuffWorld(map);
  return (
    <group>
      {w.things.map((t) => (
        <ThingMesh key={t.id} id={t.id} map={map} />
      ))}
    </group>
  );
}

function ThingMesh({ id, map }: { id: string; map: string }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = stuffWorld(map).things.find((x) => x.id === id);
    if (!g.current) return;
    if (!t || t.dead) {
      g.current.visible = false;
      return;
    }
    g.current.visible = true;
    g.current.position.set(t.x, t.y, t.z);
    if (t.kind === "log") {
      g.current.rotation.set(t.spin, t.yaw, Math.PI / 2);
    } else if (t.kind === "barrel") {
      g.current.rotation.set(t.spin * 0.4, t.yaw, t.spin * 0.2);
    } else {
      g.current.rotation.set(0, t.yaw, 0);
    }
  });
  const t = stuffWorld(map).things.find((x) => x.id === id);
  if (!t) return null;
  return (
    <group ref={g} position={[t.x, t.y, t.z]}>
      {t.kind === "crate" ? <CrateMesh /> : null}
      {t.kind === "barrel" ? <BarrelMesh /> : null}
      {t.kind === "rock" ? <RockMesh /> : null}
      {t.kind === "log" ? <LogMesh /> : null}
      {t.kind === "pot" ? <PotMesh /> : null}
      {t.kind === "statue" ? <StatueMesh /> : null}
      {t.kind === "boulder" ? <BoulderMesh /> : null}
    </group>
  );
}

function CrateMesh() {
  return (
    <group position={[0, 0.35, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshLambertMaterial color="#8a5a28" />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[0.74, 0.06, 0.74]} />
        <meshLambertMaterial color="#6a4220" />
      </mesh>
      {[-0.24, 0.24].map((v) => (
        <mesh key={`x${v}`} position={[v, 0, 0]} castShadow>
          <boxGeometry args={[0.07, 0.72, 0.72]} />
          <meshLambertMaterial color="#3a2414" />
        </mesh>
      ))}
      {[-0.24, 0.24].map((v) => (
        <mesh key={`z${v}`} position={[0, 0, v]} castShadow>
          <boxGeometry args={[0.72, 0.72, 0.07]} />
          <meshLambertMaterial color="#3a2414" />
        </mesh>
      ))}
    </group>
  );
}

function BarrelMesh() {
  return (
    <group position={[0, 0.43, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.36, 0.4, 0.86, 10]} />
        <meshLambertMaterial color="#8a5a28" />
      </mesh>
      {[-0.22, 0, 0.22].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <torusGeometry args={[0.38, 0.03, 5, 10]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      ))}
    </group>
  );
}

function RockMesh() {
  return (
    <mesh position={[0, 0.32, 0]} castShadow>
      <dodecahedronGeometry args={[0.38, 0]} />
      <meshLambertMaterial color="#7a7a70" />
    </mesh>
  );
}

function LogMesh() {
  return (
    <mesh castShadow>
      <cylinderGeometry args={[0.22, 0.24, 2.6, 8]} />
      <meshLambertMaterial color="#6a4a28" />
    </mesh>
  );
}

function PotMesh() {
  return (
    <group position={[0, 0.22, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.36, 8]} />
        <meshLambertMaterial color="#8a4a32" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.18, 0.14, 0.08, 8]} />
        <meshLambertMaterial color="#6a3220" />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <torusGeometry args={[0.1, 0.025, 5, 8]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function StatueMesh() {
  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.7, 0.44, 0.7]} />
        <meshLambertMaterial color="#8a8070" />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.48, 0.85, 0.42]} />
        <meshLambertMaterial color="#9a9080" />
      </mesh>
      <mesh position={[0, 1.28, -0.22]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.36, 0.42, 0.06]} />
        <meshLambertMaterial color="#e8c040" emissive="#e8c040" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0, 1.42, 0]} castShadow>
        <boxGeometry args={[0.38, 0.22, 0.38]} />
        <meshLambertMaterial color="#8a8070" />
      </mesh>
    </group>
  );
}

function BoulderMesh() {
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow>
        <dodecahedronGeometry args={[0.7, 0]} />
        <meshLambertMaterial color="#6a6860" />
      </mesh>
      <mesh position={[0.22, 0.7, 0.1]} castShadow>
        <dodecahedronGeometry args={[0.32, 0]} />
        <meshLambertMaterial color="#5a5850" />
      </mesh>
    </group>
  );
}

function YardGate() {
  const bar = useRef<THREE.Group>(null);
  const plate = useRef<THREE.MeshLambertMaterial>(null);
  useFrame((_, dt) => {
    const w = stuffWorld();
    const g = w.gates.find((x) => x.id === "gate-yard");
    const p = w.plates.find((x) => x.id === "plate-yard");
    if (bar.current && g) {
      bar.current.rotation.y += ((g.open ? 1.45 : 0) - bar.current.rotation.y) * (1 - Math.exp(-dt * 5));
    }
    if (plate.current && p) {
      plate.current.color.set(p.on ? "#c9a227" : "#8a8070");
      plate.current.emissive.set(p.on ? "#c9a227" : "#000000");
      plate.current.emissiveIntensity = p.on ? 0.35 : 0;
    }
  });
  const p = STUFF_AT.plate;
  const gy = heightAt(p.x, p.z);
  return (
    <group>
      <mesh position={[p.x, gy + 0.04, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.62, 10]} />
        <meshLambertMaterial ref={plate} color="#8a8070" />
      </mesh>
      <group ref={bar} position={[p.x + 2.4, gy + 0.72, p.z]}>
        <mesh position={[0.02, 0, 0]}>
          <boxGeometry args={[0.16, 1.35, 2.2]} />
          <meshLambertMaterial color="#5a3a22" />
        </mesh>
      </group>
    </group>
  );
}

function CreekGap() {
  return (
    <group>
      <CreekWater x={STUFF_AT.creek.x} z={STUFF_AT.creek.z} hx={3.4} hz={0.85} />
      <CreekWater x={STUFF_AT.path.x} z={STUFF_AT.path.z} hx={3.6} hz={0.92} />
    </group>
  );
}

function CreekWater({ x, z, hx, hz }: { x: number; z: number; hx: number; hz: number }) {
  const water = useRef<THREE.Mesh>(null);
  const y = heightAt(x, z);
  useFrame(({ clock }) => {
    if (water.current) water.current.position.y = y - 0.18 + Math.sin(clock.elapsedTime * 0.9) * 0.03;
  });
  return (
    <group>
      <mesh position={[x, y - 0.55, z]} receiveShadow>
        <boxGeometry args={[hx * 2.1, 1.1, hz * 2.0]} />
        <meshLambertMaterial color="#2a5a68" />
      </mesh>
      <mesh ref={water} position={[x, y - 0.18, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[hx * 2.0, hz * 1.75]} />
        <meshLambertMaterial color="#3a7a88" transparent opacity={0.62} emissive="#1a4048" emissiveIntensity={0.22} />
      </mesh>
      {[-1, 1].flatMap((s) =>
        [-0.7, 0.15, 0.85].map((t, i) => {
          const rx = x + s * (hx + 0.35) + t * 0.4;
          const rz = z + (i - 1) * hz * 0.7;
          return (
            <mesh key={`${s}${i}`} position={[rx, heightAt(rx, rz) + 0.12, rz]} castShadow>
              <dodecahedronGeometry args={[0.22 + (i % 2) * 0.08, 0]} />
              <meshLambertMaterial color={i % 2 ? "#6a5a48" : "#5a5040"} />
            </mesh>
          );
        }),
      )}
    </group>
  );
}

function LookLedge() {
  const L = STUFF_AT.look;
  const y = heightAt(L.x, L.z);
  useFrame(() => {
    addTrapSpot(L.x + 0.4, L.z + 3.35, 0.95, 1.22);
  }, -2);
  return (
    <group position={[L.x + 0.4, y, L.z + 3.35]}>
      <mesh position={[0, 0.58, 0]} castShadow>
        <boxGeometry args={[1.8, 1.16, 1.35]} />
        <meshLambertMaterial color="#6a6860" />
      </mesh>
      <mesh position={[0, 1.18, 0]} receiveShadow>
        <boxGeometry args={[1.9, 0.1, 1.45]} />
        <meshLambertMaterial color="#8a8070" />
      </mesh>
    </group>
  );
}

function SunBeam() {
  const line = useRef<THREE.Mesh>(null);
  const rec = useRef<THREE.MeshLambertMaterial>(null);
  const bar = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const w = stuffWorld();
    const b = w.beams[0];
    const r = w.recs[0];
    const g = w.gates.find((x) => x.id === "gate-beam");
    if (line.current && b) {
      const dx = b.hitX - b.ox;
      const dz = b.hitZ - b.oz;
      const len = Math.hypot(dx, dz) || 0.2;
      line.current.position.set(b.ox + dx * 0.5, heightAt(b.ox, b.oz) + 1.15, b.oz + dz * 0.5);
      line.current.scale.set(1, 1, len);
      line.current.rotation.set(0, Math.atan2(dx, dz), 0);
      const mat = line.current.material as THREE.MeshLambertMaterial;
      mat.emissiveIntensity = b.powered ? 0.9 : 0.45;
    }
    if (rec.current && r) {
      rec.current.emissiveIntensity = r.on ? 0.85 : 0.12;
      rec.current.color.set(r.on ? "#e8c040" : "#8a8070");
    }
    if (bar.current && g) {
      bar.current.rotation.y += ((g.open ? 1.5 : 0) - bar.current.rotation.y) * (1 - Math.exp(-dt * 5));
    }
  });
  const o = STUFF_AT.beam;
  const oy = heightAt(o.x - 8.4, o.z);
  const ry = heightAt(o.x, o.z + 8.2);
  const gy = heightAt(o.x, o.z + 10.2);
  return (
    <group>
      <mesh position={[o.x - 8.4, oy + 1.35, o.z]} castShadow>
        <cylinderGeometry args={[0.22, 0.32, 2.7, 8]} />
        <meshLambertMaterial color="#c9a227" emissive="#e8c040" emissiveIntensity={0.4} />
      </mesh>
      <mesh ref={line} position={[o.x - 4, oy + 1.15, o.z]}>
        <boxGeometry args={[0.08, 0.08, 1]} />
        <meshLambertMaterial color="#e8c040" emissive="#e8c040" emissiveIntensity={0.5} transparent opacity={0.85} />
      </mesh>
      <mesh position={[o.x, ry + 0.7, o.z + 8.2]} castShadow>
        <octahedronGeometry args={[0.42, 0]} />
        <meshLambertMaterial ref={rec} color="#8a8070" emissive="#e8c040" emissiveIntensity={0.12} />
      </mesh>
      <group ref={bar} position={[o.x, gy + 0.75, o.z + 10.2]}>
        <mesh>
          <boxGeometry args={[2.4, 1.4, 0.16]} />
          <meshLambertMaterial color="#5a3a22" />
        </mesh>
      </group>
    </group>
  );
}

function CrackWall() {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const c = stuffWorld().cracks.find((x) => x.id === "crack-hill");
    if (g.current) g.current.visible = Boolean(c && !c.dead);
  });
  const p = STUFF_AT.crack;
  const y = heightAt(p.x, p.z);
  return (
    <group ref={g} position={[p.x, y, p.z]}>
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[2.6, 1.9, 0.7]} />
        <meshLambertMaterial color="#7a6a58" />
      </mesh>
      <mesh position={[0.1, 1.05, 0.36]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.08, 1.5, 0.04]} />
        <meshLambertMaterial color="#2a2418" />
      </mesh>
      <mesh position={[-0.2, 0.7, 0.36]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.06, 0.9, 0.04]} />
        <meshLambertMaterial color="#2a2418" />
      </mesh>
    </group>
  );
}

function StuffChests() {
  return (
    <group>
      <LootChest id="chest-yard" />
      <LootChest id="chest-isle" />
      <LootChest id="chest-look" yOff={1.22} />
      <LootChest id="chest-beam" />
      <LootChest id="chest-crack" />
      <LootChest id="chest-snap" />
      <LootChest id="chest-mill" />
      <LootChest id="chest-wood" />
    </group>
  );
}

function LootChest({ id, yOff = 0 }: { id: string; yOff?: number }) {
  const lid = useRef<THREE.Group>(null);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const c = stuffWorld().chests.find((x) => x.id === id);
    if (!c || !g.current) return;
    const y = heightAt(c.x, c.z) + yOff;
    g.current.position.y = y + 0.22;
    const ready = stuffChestReady(stuffWorld(), c.need, live.x, live.y, live.z);
    const d = Math.hypot(live.x - c.x, live.z - c.z);
    if (ready && !c.open && d < 1.3) live.nearChest = live.nearChest ?? id;
    if (lid.current) {
      const want = c.open ? -1.15 : 0;
      lid.current.rotation.x += (want - lid.current.rotation.x) * (1 - Math.exp(-dt * 6));
    }
  });
  const c = stuffWorld().chests.find((x) => x.id === id);
  if (!c) return null;
  const y = heightAt(c.x, c.z) + yOff;
  return (
    <group ref={g} position={[c.x, y + 0.22, c.z]}>
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.42, 0.5]} />
        <meshLambertMaterial color="#8a5a22" />
      </mesh>
      <group ref={lid} position={[0, 0.2, -0.22]}>
        <mesh position={[0, 0.08, 0.22]} castShadow>
          <boxGeometry args={[0.7, 0.16, 0.5]} />
          <meshLambertMaterial color="#6a4220" />
        </mesh>
      </group>
      <mesh position={[0, 0.08, 0.26]}>
        <boxGeometry args={[0.12, 0.1, 0.06]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}
