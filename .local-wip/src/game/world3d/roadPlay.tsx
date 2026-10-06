import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, KEEP_Z, VX, VZ } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { lamb } from "./mats";
import { VolTree } from "./trees";
import { KING_ROAD, ROAD_CART, ROAD_DUMMY, ROAD_GATE, ROAD_SHRINE, alongRoad, onKingRoad } from "./road";
import { takeCipher } from "../cipher";
import { puffAt } from "./fx";

function pay(n: number, key: string, line?: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
  if (line) live.listen = line;
}

export function RoadPlay() {
  return (
    <group>
      <RoadTrees />
      <RoadBanners />
      <RoadCart />
      <RoadShrine />
      <KeepGate />
      <TrainDummy />
      <RoadListen />
    </group>
  );
}

function RoadTrees() {
  const spots = [];
  for (let i = 0; i < KING_ROAD.length - 1; i++) {
    for (const u of [0.22, 0.55, 0.82]) {
      const p = alongRoad(i, u);
      spots.push({ x: p.x - 5.8 - (i % 2), z: p.z + u, s: 0.82 + ((i + u) % 3) * 0.08 });
      spots.push({ x: p.x + 6.2 + (i % 2) * 0.4, z: p.z - 0.4, s: 0.76 + ((i * 3 + u) % 2) * 0.12 });
    }
  }
  return (
    <group>
      {spots.map((s, i) => (
        <VolTree key={i} x={s.x} z={s.z} s={s.s} kind={i % 3 === 0 ? "elm" : "oak"} />
      ))}
    </group>
  );
}

function RoadBanners() {
  const poles = KING_ROAD.slice(0, -1).map((p, i) => ({ x: p[0] + (i % 2 ? 3.4 : -3.4), z: p[1] }));
  const flags = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    flags.current.forEach((m, i) => {
      if (m) m.rotation.y = Math.sin(t * 1.6 + i) * 0.22;
    });
  });
  return (
    <group>
      {poles.map((p, i) => {
        const y = heightAt(p.x, p.z);
        return (
          <group key={i} position={[p.x, y, p.z]}>
            <mesh position={[0, 1.55, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.07, 3.1, 5]} />
              {lamb("#5a3a22", { kind: "wood" })}
            </mesh>
            <mesh ref={(el) => { flags.current[i] = el; }} position={[0.42, 2.55, 0]}>
              <planeGeometry args={[0.82, 0.62]} />
              <meshLambertMaterial color={i % 2 ? "#3a5a88" : "#c45c38"} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function RoadCart() {
  const p = ROAD_CART;
  const y = heightAt(p.x, p.z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 2.4 && !live.listen) live.listen = "A cart stopped. The wheel is honest about why.";
    if (d < 14) live.fangMark = live.fangMark ?? { x: p.x, z: p.z, kind: "cart" };
  });
  return (
    <group position={[p.x, y, p.z]} rotation={[0, 0.4, 0]}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[1.7, 0.55, 1.05]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[1.55, 0.12, 0.95]} />
        {lamb("#5a3a20", { kind: "wood" })}
      </mesh>
      {[-0.55, 0.55].map((s) => (
        <mesh key={s} position={[s, 0.28, 0.52]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 0.12, 8]} />
          {lamb("#3a2a18", { kind: "wood" })}
        </mesh>
      ))}
      <mesh position={[-0.55, 0.22, -0.52]} rotation={[0, 0, 0.7]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.12, 8]} />
        {lamb("#3a2a18", { kind: "wood" })}
      </mesh>
      <mesh position={[0.2, 0.18, -0.4]} rotation={[0.4, 0.2, 0.3]} castShadow>
        <boxGeometry args={[0.55, 0.22, 0.4]} />
        {lamb("#8a5a22", { kind: "wood" })}
      </mesh>
    </group>
  );
}

function RoadShrine() {
  const p = ROAD_SHRINE;
  const y = heightAt(p.x, p.z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 1.5 && live.stillT > 0.5 && live.ocarina) {
      pay(10, "road-shrine", "The little stone liked the song. It had been a long time.");
      takeCipher("road-shrine", false);
    }
    if (d < 2.2 && !live.listen) live.listen = "A stone with a worn face. It is listening, or used to.";
    if (d < 12) live.fangMark = live.fangMark ?? { x: p.x, z: p.z, kind: "shrine" };
  });
  return (
    <group position={[p.x, y, p.z]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.7, 1.1, 0.42]} />
        {lamb("#8a8478", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 1.18, 0.12]}>
        <circleGeometry args={[0.16, 8]} />
        {lamb("#c9a227", { emissive: "#c9a227", emit: 0.25 })}
      </mesh>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[0.55, 0.62, 0.12, 8]} />
        {lamb("#7a7468", { kind: "stone" })}
      </mesh>
    </group>
  );
}

function KeepGate() {
  const p = ROAD_GATE;
  const y = heightAt(p.x, p.z);
  const torch = useRef<(THREE.PointLight | null)[]>([]);
  useFrame(() => {
    const dusk = live.dusk;
    for (const l of torch.current) if (l) l.intensity = 0.6 + dusk * 2.4;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 6 && live.z > p.z - 2 && !live.smashed["keep-arrive"]) {
      live.smashed["keep-arrive"] = true;
      live.placeCue = "the castle";
      live.placeName = "the castle";
      live.listen = "The road ran out. The castle did not.";
      sfx.ok();
      takeCipher("keep-gate", false);
    }
  });
  return (
    <group position={[p.x, y, p.z]}>
      {[-3.6, 3.6].map((s, i) => (
        <group key={i} position={[s, 0, 0]}>
          <mesh position={[0, 2.2, 0]} castShadow>
            <boxGeometry args={[1.15, 4.4, 1.15]} />
            {lamb("#c8b8a0", { kind: "stone" })}
          </mesh>
          <mesh position={[0, 4.55, 0]}>
            <boxGeometry args={[1.35, 0.35, 1.35]} />
            {lamb("#b8a888", { kind: "stone" })}
          </mesh>
          <mesh position={[0, 3.4, 0.62]} castShadow>
            <boxGeometry args={[0.28, 0.42, 0.22]} />
            {lamb("#c9a227", { kind: "metal" })}
          </mesh>
          <pointLight
            ref={(el) => {
              torch.current[i] = el;
            }}
            position={[0, 3.4, 0.7]}
            color="#ffb060"
            intensity={1.2}
            distance={8}
          />
        </group>
      ))}
      <mesh position={[0, 4.35, 0]} castShadow>
        <boxGeometry args={[7.4, 0.55, 1.05]} />
        {lamb("#c4b49a", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 4.85, 0]}>
        <boxGeometry args={[2.2, 0.7, 0.18]} />
        {lamb("#c45c38")}
      </mesh>
    </group>
  );
}

function TrainDummy() {
  const p = ROAD_DUMMY;
  const y = heightAt(p.x, p.z);
  const sway = useRef(0);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.slash && Math.hypot(live.slash.x - p.x, live.slash.z - p.z) < 1.5) {
      sway.current = 0.55;
      sfx.thud();
      puffAt(p.x, p.z, y + 1.1, false);
      pay(6, "keep-dummy", "The dummy has heard worse. It spun anyway.");
    }
    sway.current += (0 - sway.current) * Math.min(1, dt * 4);
    if (g.current) g.current.rotation.z = Math.sin(live.playT * 18) * sway.current;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 2.2 && !live.listen) live.listen = "Someone has been practicing. The straw remembers.";
  });
  return (
    <group ref={g} position={[p.x, y, p.z]}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.7, 5]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.28, 7, 6]} />
        {lamb("#c4a06a")}
      </mesh>
      <mesh position={[0, 1.18, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 1.15, 5]} />
        {lamb("#8a6a40")}
      </mesh>
      <mesh position={[0, 1.18, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.45, 4, 6]} />
        {lamb("#c45c38")}
      </mesh>
    </group>
  );
}

function RoadListen() {
  useFrame(() => {
    if (live.house || live.listen) return;
    if (onKingRoad(live.x, live.z, 7) && live.z > VZ + 30 && live.z < KEEP_Z - 28 && live.stillT > 0.8)
      live.listen = "The road keeps going. So does the castle.";
    if (onKingRoad(live.x, live.z, 10) && live.z > VZ + 20)
      live.fangMark = live.fangMark ?? { x: VX, z: live.z + 8, kind: "road" };
  });
  return null;
}
