import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { CAVERN_SHAPE, roomZ } from "./dungeonLayout";
import { lamb } from "./mats";

/**
 * Sun Hollow — first dungeon. Varied rooms around a four-mouth hub.
 * East: key. North: the lessons. West: the shortcut that opens later.
 */

const STONE = "#4a4038";
const STONE2 = "#3a322c";
const SAND = "#6a5a48";
const GOLD = "#c9a227";
const SUN = "#e8c040";

export function CavernRooms() {
  return (
    <group>
      <EntranceRoom />
      <PitDress />
      <HubRoom />
      <CombatRoom />
      <PadRoom />
      <EyeRoom />
      <TreasureRoom />
      <FarRoom />
      <CombineRoom />
      <QuietHall />
      <AnteRoom />
      <BossRoom />
      <JewelShrine />
      <ShortcutHall />
      <RoomTorches />
      <HubSun />
    </group>
  );
}

function RoomTorches() {
  return (
    <group>
      {CAVERN_SHAPE.map((s, i) => {
        const z = roomZ(i);
        const x = Math.max(6, s.halfW - 2.4);
        return (
          <group key={i}>
            <WallTorch x={x} z={z + 8} />
            <WallTorch x={-x} z={z - 6} />
            {s.east ? <WallTorch x={s.halfW + s.east * 0.55} z={z} /> : null}
            {s.west ? <WallTorch x={-(s.halfW + (s.west ?? 0) * 0.55)} z={z} /> : null}
          </group>
        );
      })}
    </group>
  );
}

function WallTorch({ x, z }: { x: number; z: number }) {
  const flame = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!flame.current) return;
    const u = 0.72 + Math.sin(clock.elapsedTime * 9 + x) * 0.2;
    flame.current.scale.setScalar(u);
  });
  return (
    <group position={[x, 3.15, z]}>
      <mesh>
        <cylinderGeometry args={[0.055, 0.08, 0.62, 6]} />
        {lamb("#4a3220")}
      </mesh>
      <mesh ref={flame} position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.11, 6, 5]} />
        <meshLambertMaterial color="#e07038" emissive="#e07038" emissiveIntensity={1.35} />
      </mesh>
      <pointLight color="#c88850" intensity={3.6} distance={9} />
    </group>
  );
}

function Pillar({ x, z, h = 8.4, r = 0.55 }: { x: number; z: number; h?: number; r?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h * 0.5, 0]} castShadow>
        <cylinderGeometry args={[r, r * 1.12, h, 8]} />
        {lamb(STONE)}
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[r * 1.35, r * 1.4, 0.36, 8]} />
        {lamb(STONE2)}
      </mesh>
      <mesh position={[0, h - 0.12, 0]}>
        <cylinderGeometry args={[r * 1.28, r * 1.05, 0.28, 8]} />
        {lamb(SAND)}
      </mesh>
    </group>
  );
}

function Arch({ x, z, yaw = 0, w = 8.4 }: { x: number; z: number; yaw?: number; w?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <mesh position={[-w * 0.42, 2.4, 0]} castShadow>
        <boxGeometry args={[0.7, 4.8, 1.1]} />
        {lamb(STONE)}
      </mesh>
      <mesh position={[w * 0.42, 2.4, 0]} castShadow>
        <boxGeometry args={[0.7, 4.8, 1.1]} />
        {lamb(STONE)}
      </mesh>
      <mesh position={[0, 5.05, 0]} castShadow>
        <boxGeometry args={[w * 0.95, 0.7, 1.2]} />
        {lamb(SAND)}
      </mesh>
      <mesh position={[0, 5.55, 0]}>
        <boxGeometry args={[1.1, 0.55, 0.4]} />
        <meshLambertMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function EntranceRoom() {
  const z = roomZ(0);
  return (
    <group>
      <Arch x={0} z={z + 11} />
      <Pillar x={-8.4} z={z + 6} />
      <Pillar x={8.4} z={z + 6} />
      <Pillar x={-8.4} z={z - 4} />
      <Pillar x={8.4} z={z - 4} />
      <mesh position={[0, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.4, 16]} />
        <meshLambertMaterial color="#5a4a30" />
      </mesh>
      <mesh position={[0, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 2.4, 16]} />
        <meshLambertMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 4.6, z + 16.6]} castShadow>
        <boxGeometry args={[10, 3.2, 0.4]} />
        {lamb("#5a4a3c")}
      </mesh>
      {[-2.2, 2.2].map((x) => (
        <mesh key={x} position={[x, 4.7, z + 16.4]}>
          <circleGeometry args={[0.7, 10]} />
          <meshLambertMaterial color={x < 0 ? GOLD : "#e07a28"} emissive={x < 0 ? GOLD : "#e07a28"} emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function PitDress() {
  const z = roomZ(1);
  return (
    <group>
      <Pillar x={-22} z={z + 18} h={7.2} r={0.42} />
      <Pillar x={22} z={z + 18} h={7.2} r={0.42} />
      <Pillar x={-22} z={z - 18} h={7.2} r={0.42} />
      <Pillar x={22} z={z - 18} h={7.2} r={0.42} />
      {[-18, -6, 6, 18].map((x) => (
        <mesh key={x} position={[x, 0.22, z + 22]}>
          <boxGeometry args={[3.2, 0.44, 1.1]} />
          {lamb("#5a4a38")}
        </mesh>
      ))}
    </group>
  );
}

function HubRoom() {
  const z = roomZ(2);
  return (
    <group>
      <Arch x={0} z={z + 22} />
      <Arch x={0} z={z - 22} />
      <Arch x={22} z={z} yaw={Math.PI / 2} />
      <Arch x={-22} z={z} yaw={Math.PI / 2} />
      <Pillar x={-16} z={z + 16} h={9.2} r={0.7} />
      <Pillar x={16} z={z + 16} h={9.2} r={0.7} />
      <Pillar x={-16} z={z - 16} h={9.2} r={0.7} />
      <Pillar x={16} z={z - 16} h={9.2} r={0.7} />
      <mesh position={[0, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[11.4, 24]} />
        <meshLambertMaterial color="#3a3228" />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 8.4, 0.06, z + Math.cos(a) * 8.4]} rotation={[-Math.PI / 2, 0, a]}>
            <planeGeometry args={[1.15, 3.6]} />
            <meshLambertMaterial color={i % 2 ? GOLD : SUN} emissive={GOLD} emissiveIntensity={0.12} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.08, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.2, 16]} />
        <meshLambertMaterial color={SUN} emissive={SUN} emissiveIntensity={0.35} />
      </mesh>
      <pointLight position={[0, 6.4, z]} color="#f0d8a0" intensity={8} distance={28} />
      <mesh position={[46, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.2, 14]} />
        <meshLambertMaterial color="#3a3228" />
      </mesh>
    </group>
  );
}

function HubSun() {
  const mats = useRef<(THREE.MeshLambertMaterial | null)[]>([]);
  useFrame(() => {
    const f = live.dungFlags;
    const on = [f.plates, f.key, f.pads, f.eyes];
    mats.current.forEach((m, i) => {
      if (!m) return;
      m.emissiveIntensity = on[i] ? 0.7 : 0.08;
    });
  });
  const z = roomZ(2);
  const rays: [number, number, number][] = [
    [0, 0, 1],
    [1, 0, 0],
    [0, 0, -1],
    [-1, 0, 0],
  ];
  return (
    <group position={[0, 0.09, z]}>
      {rays.map((r, i) => (
        <mesh key={i} position={[r[0] * 5.5, 0, r[2] * 5.5]} rotation={[-Math.PI / 2, 0, Math.atan2(r[0], r[2])]}>
          <planeGeometry args={[1.4, 5.2]} />
          <meshLambertMaterial
            ref={(el) => {
              mats.current[i] = el;
            }}
            color={GOLD}
            emissive={GOLD}
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}
    </group>
  );
}

function CombatRoom() {
  const z = roomZ(3);
  return (
    <group>
      <mesh position={[0, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[9.5, 18]} />
        <meshLambertMaterial color="#2e2822" />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return <Pillar key={i} x={Math.sin(a) * 14} z={z + Math.cos(a) * 14} h={6.4} r={0.4} />;
      })}
      {[-8, 8].map((x) => (
        <mesh key={x} position={[x, 0.22, z - 12]} rotation={[0.1, 0.4, 0.05]}>
          <boxGeometry args={[1.4, 0.35, 0.55]} />
          {lamb("#c8c0b0")}
        </mesh>
      ))}
    </group>
  );
}

function PadRoom() {
  const z = roomZ(4);
  return (
    <group>
      <mesh position={[0, 0.12, z]} receiveShadow>
        <boxGeometry args={[28, 0.24, 16]} />
        {lamb("#3a4a28")}
      </mesh>
      <Pillar x={-14} z={z + 10} h={7.4} />
      <Pillar x={14} z={z + 10} h={7.4} />
      <Pillar x={-14} z={z - 10} h={7.4} />
      <Pillar x={14} z={z - 10} h={7.4} />
    </group>
  );
}

function EyeRoom() {
  const z = roomZ(5);
  return (
    <group>
      {[-10.2, 0, 10.2].map((x, i) => (
        <mesh key={x} position={[x, 0.28, z + 4]}>
          <cylinderGeometry args={[0.85 - i * 0.08, 1.05, 0.55, 8]} />
          {lamb("#4a3a28")}
        </mesh>
      ))}
      <mesh position={[0, 6.6, z - 18]} rotation={[0.2, 0, 0]}>
        <circleGeometry args={[1.6, 12]} />
        <meshLambertMaterial color={SUN} emissive={SUN} emissiveIntensity={0.45} />
      </mesh>
    </group>
  );
}

function TreasureRoom() {
  const z = roomZ(6);
  return (
    <group>
      <mesh position={[0, 0.42, z + 6]} receiveShadow>
        <cylinderGeometry args={[3.4, 3.8, 0.84, 10]} />
        {lamb("#5a4a38")}
      </mesh>
      <mesh position={[0, 0.88, z + 6]}>
        <cylinderGeometry args={[2.6, 2.8, 0.22, 10]} />
        <meshLambertMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.2} />
      </mesh>
      {[-8, 8].map((x) => (
        <Pillar key={x} x={x} z={z} h={8.8} r={0.62} />
      ))}
      <pointLight position={[0, 4.4, z + 6]} color="#f0d080" intensity={5} distance={12} />
    </group>
  );
}

function FarRoom() {
  const z = roomZ(7);
  return (
    <group>
      <mesh position={[0, -1.15, z - 8]} receiveShadow>
        <boxGeometry args={[36, 2.2, 14]} />
        <meshLambertMaterial color="#1a1814" />
      </mesh>
      <mesh position={[0, 0.08, z - 8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[34, 12]} />
        <meshLambertMaterial color="#2a4a58" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 18.4, 0.22, z - 8]}>
          <boxGeometry args={[1.1, 0.44, 14.4]} />
          {lamb("#5a4a38")}
        </mesh>
      ))}
      <mesh position={[0, 1.1, z - 16]}>
        <cylinderGeometry args={[0.55, 0.7, 2.2, 8]} />
        {lamb("#4a3a28")}
      </mesh>
    </group>
  );
}

function CombineRoom() {
  const z = roomZ(8);
  return (
    <group>
      <Pillar x={-12} z={z + 10} />
      <Pillar x={12} z={z + 10} />
      <Pillar x={-12} z={z - 10} />
      <Pillar x={12} z={z - 10} />
      <mesh position={[0, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.4, 8.2, 20]} />
        <meshLambertMaterial color="#4a3a22" />
      </mesh>
    </group>
  );
}

function QuietHall() {
  const z = roomZ(9);
  return (
    <group>
      {[-8, 8].map((x) =>
        [-12, -4, 4, 12].map((dz) => <Pillar key={`${x}-${dz}`} x={x} z={z + dz} h={8.2} r={0.48} />),
      )}
      <mesh position={[0, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 28]} />
        <meshLambertMaterial color="#3a3228" />
      </mesh>
    </group>
  );
}

function AnteRoom() {
  const z = roomZ(10);
  return (
    <group>
      {[-6, 6].map((x) => (
        <group key={x}>
          {[-8, 0, 8].map((dz) => (
            <WallTorch key={dz} x={x} z={z + dz} />
          ))}
        </group>
      ))}
      <mesh position={[0, 0.35, z + 8]} receiveShadow>
        <boxGeometry args={[4.4, 0.7, 3.2]} />
        {lamb("#5a4a38")}
      </mesh>
      <mesh position={[0, 4.8, z - 14]}>
        <boxGeometry args={[8.4, 2.4, 0.35]} />
        {lamb("#3a322c")}
      </mesh>
      <mesh position={[0, 4.85, z - 13.8]}>
        <circleGeometry args={[0.7, 10]} />
        <meshLambertMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function BossRoom() {
  const z = roomZ(11);
  return (
    <group>
      <mesh position={[0, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[16, 24]} />
        <meshLambertMaterial color="#2a221c" />
      </mesh>
      <mesh position={[0, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[12.4, 14.6, 24]} />
        <meshLambertMaterial color="#5a3a20" emissive="#8a5020" emissiveIntensity={0.15} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.4;
        return <Pillar key={i} x={Math.sin(a) * 18} z={z + Math.cos(a) * 18} h={9.6} r={0.72} />;
      })}
      <pointLight position={[0, 6.2, z]} color="#e07030" intensity={7} distance={22} />
    </group>
  );
}

function JewelShrine() {
  const z = roomZ(11);
  return (
    <group position={[0, 0, z - 14]}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1.6, 2.0, 1.0, 8]} />
        {lamb("#4a3a28")}
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[1.05, 1.2, 0.28, 8]} />
        <meshLambertMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function ShortcutHall() {
  const z0 = roomZ(2) - 16;
  const z1 = roomZ(7) + 12;
  const mid = (z0 + z1) * 0.5;
  const len = Math.abs(z1 - z0);
  return (
    <group>
      <mesh position={[-48, 0.02, mid]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9.6, len]} />
        <meshLambertMaterial color="#2e2822" />
      </mesh>
      {[-4, 4].map((s) =>
        [-0.3, 0, 0.3].map((t, i) => (
          <WallTorch key={`${s}-${i}`} x={-48 + s} z={mid + t * len * 0.7} />
        )),
      )}
    </group>
  );
}

export function FarGap() {
  const z = roomZ(7) - 8;
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    const inGap = Math.abs(live.x) < 17.6 && Math.abs(live.z - z) < 6.4;
    if (inGap && live.y < 0.35 && !live.god && !live.balloonRide) {
      if (cool.current <= 0 && live.y < -0.2) {
        cool.current = 1.1;
        sfx.splash();
        sfx.ouch();
        useGame.getState().hurtField(8, true);
        live.z = z + 8.4;
        live.y = 0.2;
        live.knock = { vx: 0, vz: 14, t: 0.32 };
        live.listen = "Too wide. The eye is on the other side.";
      }
    } else if (inGap) {
      live.listen = live.listen || "A drop. The eye watches from the far ledge.";
    }
  }, -2);
  return null;
}

export function CavernCombine() {
  const z = roomZ(8);
  const crate = useRef({ x: -8.4, z: z + 4, vx: 0, vz: 0 });
  const plate = { x: 8.4, z };
  const eye = { x: 0, z: z - 12 };
  const g = useRef<THREE.Group>(null);
  const eyeMat = useRef<THREE.MeshLambertMaterial>(null);
  const plateMat = useRef<THREE.MeshLambertMaterial>(null);
  const onCrate = useRef(false);
  const onEye = useRef(false);
  const onPad = useRef(false);
  const done = useRef(false);
  const pad = { x: 0, z: z + 8 };

  useFrame((_, dt) => {
    const c = crate.current;
    const d = Math.hypot(live.x - c.x, live.z - c.z);
    if (!live.mounted && Math.abs(live.speed) > 0.7 && d < 1.12) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      c.vx += fx * 22 * dt;
      c.vz += fz * 22 * dt;
    }
    c.x += c.vx * dt;
    c.z += c.vz * dt;
    c.vx *= Math.exp(-dt * 3.2);
    c.vz *= Math.exp(-dt * 3.2);
    c.x = Math.max(-16, Math.min(16, c.x));
    c.z = Math.max(z - 14, Math.min(z + 14, c.z));
    if (g.current) g.current.position.set(c.x, 0.48, c.z);

    onCrate.current = Math.hypot(c.x - plate.x, c.z - plate.z) < 1.05;
    onPad.current = Math.hypot(live.x - pad.x, live.z - pad.z) < 0.95;
    if (live.slash && Math.hypot(live.slash.x - eye.x, live.slash.z - eye.z) < 1.4) onEye.current = true;
    for (const a of live.arrows) {
      if (Math.hypot(a.x - eye.x, a.z - eye.z) < 1.1) onEye.current = true;
    }
    if (plateMat.current) {
      plateMat.current.emissiveIntensity = onCrate.current ? 0.55 : 0;
      plateMat.current.color.set(onCrate.current ? GOLD : "#8a7a48");
    }
    if (eyeMat.current) eyeMat.current.emissiveIntensity = onEye.current ? 1.1 : 0.35;

    const all = onCrate.current && onEye.current && onPad.current;
    if (all && !done.current) {
      done.current = true;
      live.dungFlags.mix = true;
      sfx.chime();
      live.listen = "Stone. Seed. Step. The last inner door believed you.";
      const n = useGame.getState().addCoins(12);
      if (n > 0) revealItem("coin");
    }
    if (Math.hypot(live.x, live.z - z) < 18) {
      live.listen =
        live.listen ||
        (onCrate.current
          ? onEye.current
            ? "The number stone is left."
            : "Hit the watching eye."
          : "A stone wants the gold circle.");
    }
  }, -1);

  return (
    <group>
      <group ref={g} position={[crate.current.x, 0.48, crate.current.z]}>
        <mesh castShadow>
          <boxGeometry args={[0.95, 0.95, 0.95]} />
          {lamb("#8a6a40")}
        </mesh>
      </group>
      <mesh position={[plate.x, 0.04, plate.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.95, 14]} />
        <meshLambertMaterial ref={plateMat} color="#8a7a48" emissive={GOLD} emissiveIntensity={0} />
      </mesh>
      <mesh position={[pad.x, 0.05, pad.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.05, 14]} />
        <meshLambertMaterial color="#6a8a4a" />
      </mesh>
      <mesh position={[eye.x, 1.15, eye.z]} castShadow>
        <octahedronGeometry args={[0.32, 0]} />
        <meshLambertMaterial ref={eyeMat} color="#e8c040" emissive="#e8c040" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

