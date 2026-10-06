import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { lamb } from "./mats";

/**
 * Four standing stones with chip-counts 1, 2, 3, 5.
 * A stump nearby shows the same counts as apple piles.
 * Stepping 1 → 2 → 3 → 5 (each is the last two added) raises a chest.
 * Nothing tells you to do that.
 */
const STONES = [
  { n: 1, x: -18.4, z: -129.6 },
  { n: 2, x: -13.2, z: -124.8 },
  { n: 3, x: -7.6, z: -120.4 },
  { n: 5, x: -2.2, z: -116.2 },
];
const WANT = [1, 2, 3, 5];
const CHEST = { x: -10.2, z: -122.8 };

let step: number[] = [];
let cool = 0;
let open = false;

export function CountStones() {
  return (
    <group>
      {STONES.map((s) => (
        <Pillar key={s.n} n={s.n} x={s.x} z={s.z} />
      ))}
      <AppleHint />
      <ChestRise />
      <Stepper />
    </group>
  );
}

function Pillar({ n, x, z }: { n: number; x: number; z: number }) {
  const y = heightAt(x, z);
  const glow = useRef<THREE.MeshLambertMaterial>(null);
  useFrame(() => {
    if (!glow.current) return;
    const on = step[step.length - 1] === n && !open;
    glow.current.emissiveIntensity = on ? 0.55 : 0.08;
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.55, 1.24, 0.38]} />
        {lamb("#8a8478", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 1.28, 0]} castShadow>
        <boxGeometry args={[0.62, 0.16, 0.44]} />
        {lamb("#9a9488", { kind: "stone" })}
      </mesh>
      {Array.from({ length: n }, (_, i) => {
        const row = n <= 2 ? i : i < 3 ? i : i - 3;
        const c = i >= 3 ? 1 : 0;
        return (
          <mesh key={i} position={[(c - 0.5) * 0.16, 0.92 - row * 0.16, 0.2]}>
            <sphereGeometry args={[0.045, 6, 5]} />
            <meshLambertMaterial ref={i === 0 ? glow : undefined} color="#c9a227" emissive="#c9a227" emissiveIntensity={0.08} />
          </mesh>
        );
      })}
    </group>
  );
}

function AppleHint() {
  const x = -21.6;
  const z = -132.4;
  const y = heightAt(x, z);
  const piles = [1, 2, 3, 5];
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.22, 0]} rotation={[0.08, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.48, 0.38, 8]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      {piles.map((n, p) =>
        Array.from({ length: n }, (_, i) => (
          <mesh
            key={`${p}-${i}`}
            position={[(p - 1.5) * 0.32 + (i % 2) * 0.06, 0.46 + Math.floor(i / 2) * 0.1, (i % 3) * 0.08 - 0.08]}
            castShadow
          >
            <sphereGeometry args={[0.055, 6, 5]} />
            {lamb(i % 2 ? "#c42838" : "#a83828")}
          </mesh>
        )),
      )}
    </group>
  );
}

function ChestRise() {
  const g = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const y0 = heightAt(CHEST.x, CHEST.z);
  const ang = useRef(0);
  useFrame((_, dt) => {
    if (!g.current) return;
    const want = open ? y0 : y0 - 1.15;
    g.current.position.y += (want - g.current.position.y) * (1 - Math.exp(-dt * 3.2));
    g.current.visible = g.current.position.y > y0 - 1.05;
    ang.current += ((open ? 1 : 0) - ang.current) * (1 - Math.exp(-dt * 4.2));
    if (lid.current) lid.current.rotation.x = -ang.current * 1.55;
  });
  return (
    <group ref={g} position={[CHEST.x, y0 - 1.15, CHEST.z]} visible={false}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.72, 0.38, 0.48]} />
        {lamb("#6a4a24", { kind: "wood" })}
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.78, 0.07, 0.54]} />
        {lamb("#c9a227", { kind: "metal" })}
      </mesh>
      <group ref={lid} position={[0, 0.4, -0.2]}>
        <mesh position={[0, 0.08, 0.2]} castShadow>
          <boxGeometry args={[0.72, 0.16, 0.48]} />
          {lamb("#8a5a28", { kind: "wood" })}
        </mesh>
      </group>
      <mesh position={[0, 0.22, 0.26]}>
        <boxGeometry args={[0.16, 0.12, 0.06]} />
        {lamb("#e8d48a", { kind: "metal" })}
      </mesh>
    </group>
  );
}

function Stepper() {
  const on = useRef<number | null>(null);
  useFrame((_, dt) => {
    cool = Math.max(0, cool - dt);
    if (live.house || open) return;
    let hit: number | null = null;
    for (const s of STONES) {
      if (Math.hypot(live.x - s.x, live.z - s.z) < 0.72 && live.grounded) {
        hit = s.n;
        break;
      }
    }
    if (hit && hit !== on.current && cool <= 0) {
      cool = 0.35;
      const next = WANT[step.length];
      if (hit === next) {
        step = [...step, hit];
        sfx.ok();
        if (step.length === WANT.length) {
          open = true;
          if (!live.smashed.countstones) {
            live.smashed.countstones = true;
            const n = useGame.getState().addCoins(8);
            if (n > 0) revealItem("coin");
            live.drops.push({
              id: `count-heart-${live.playT.toFixed(2)}`,
              kind: "heart",
              x: CHEST.x,
              z: CHEST.z,
              y: 0.55,
              n: 1,
            });
            live.drops.push({
              id: `count-coin-${live.playT.toFixed(2)}`,
              kind: "coin",
              x: CHEST.x + 0.35,
              z: CHEST.z + 0.15,
              y: 0.55,
              n: 8,
            });
          }
        }
      } else {
        step = hit === WANT[0] ? [hit] : [];
        sfx.miss();
      }
    }
    on.current = hit;
  });
  return null;
}
