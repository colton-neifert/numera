import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, pondSurfaceY, POND, VX, VZ, WELL_AT } from "./field";
import { FIRE_PIT, FOUNTAIN } from "./village";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { lamb } from "./mats";

export const SMITH_AT = { x: 40, z: -52 };
export const FARM_AT = { x: 50, z: -98 };
export const MANOR_AT = { x: -48, z: -124 };
export const BOARD_AT = { x: VX + 3.4, z: VZ + 4.8 };
export const FARM_CROW = { x: FARM_AT.x + 6.4, z: FARM_AT.z + 3.2 };

export function TownLife() {
  return (
    <group>
      <MainRoad />
      <Creek />
      <ForgeYard />
      <FarmYard />
      <Chickens />
      <FarmPig />
      <Barrels />
      <SlashCrates />
      <NoticeBoard />
      <WaySigns />
      <BoardedManor />
      <MarketBits />
      <ClothesLines />
      <SquareBenches />
      <FlowerBeds />
      <TownCat />
      <SquareLanterns />
      <WashTub />
      <MillAlley />
      <WellFlowers />
    </group>
  );
}

function MainRoad() {
  const segs = useMemo(
    () => [
      { x: VX + 2, z: VZ + 6, w: 4.4, d: 28, yaw: 0.04 },
      { x: VX + 12, z: VZ - 8, w: 3.2, d: 22, yaw: 0.7 },
      { x: VX - 10, z: VZ - 6, w: 3.1, d: 20, yaw: -0.55 },
      { x: SMITH_AT.x - 4, z: SMITH_AT.z + 8, w: 2.8, d: 16, yaw: 0.35 },
      { x: FARM_AT.x - 8, z: FARM_AT.z + 10, w: 2.6, d: 18, yaw: -0.4 },
      { x: MANOR_AT.x + 10, z: MANOR_AT.z + 8, w: 2.4, d: 16, yaw: 0.5 },
      { x: VX, z: VZ + 28, w: 3.4, d: 18, yaw: 0.02 },
      { x: VX - 22, z: VZ - 4, w: 2.6, d: 16, yaw: -0.2 },
    ],
    [],
  );
  return (
    <group>
      {segs.map((s, i) => {
        const y = heightAt(s.x, s.z) + 0.03;
        return (
          <mesh key={i} position={[s.x, y, s.z]} rotation={[-Math.PI / 2, 0, s.yaw]} receiveShadow>
            <planeGeometry args={[s.w, s.d]} />
            {lamb(i % 2 ? "#c4a06a" : "#b89460", { kind: "dirt" })}
          </mesh>
        );
      })}
    </group>
  );
}

function Creek() {
  const pts = useMemo(() => {
    const list: { x: number; z: number; s: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      list.push({
        x: POND.x + 10 + t * 22,
        z: POND.z + 8 + t * 18 + Math.sin(t * 6) * 2.4,
        s: 1.15 + Math.sin(t * 8) * 0.2,
      });
    }
    return list;
  }, []);
  const y = pondSurfaceY() - 0.02;
  return (
    <group>
      {pts.map((p, i) => (
        <mesh key={i} position={[p.x, y, p.z]} rotation={[-Math.PI / 2, 0, i * 0.2]}>
          <circleGeometry args={[p.s, 10]} />
          <meshLambertMaterial color="#2e6a68" transparent opacity={0.78} />
        </mesh>
      ))}
    </group>
  );
}

function ForgeYard() {
  const x = SMITH_AT.x + 0.4;
  const z = SMITH_AT.z + 7.2;
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[2.4, 0.42, 1.6]} castShadow>
        <boxGeometry args={[1.15, 0.72, 0.85]} />
        {lamb("#4a4640", { kind: "stone" })}
      </mesh>
      <mesh position={[2.4, 0.92, 1.6]}>
        <boxGeometry args={[0.55, 0.22, 0.55]} />
        {lamb("#2a2824", { kind: "metal" })}
      </mesh>
      <pointLight position={[2.4, 1.15, 1.6]} intensity={4.5} color="#ff8020" distance={5} />
      <mesh position={[-1.8, 0.28, 2.4]} rotation={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.85, 0.22, 0.55]} />
        {lamb("#3a3834", { kind: "metal" })}
      </mesh>
      <mesh position={[-1.8, 0.55, 2.4]} rotation={[0.15, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.28, 8]} />
        {lamb("#5a5854", { kind: "metal" })}
      </mesh>
      {[-2.4, -1.6, 3.1].map((bx, i) => (
        <mesh key={i} position={[bx, 0.38, 3.2 + (i % 2) * 0.4]} castShadow>
          <cylinderGeometry args={[0.28, 0.32, 0.72, 8]} />
          {lamb(i % 2 ? "#6a4a28" : "#5a3a20", { kind: "wood" })}
        </mesh>
      ))}
      <mesh position={[0.2, 0.08, 3.6]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow>
        <circleGeometry args={[2.2, 12]} />
        {lamb("#6a5a48", { kind: "dirt" })}
      </mesh>
      <mesh position={[3.6, 1.05, -1.2]} castShadow>
        <boxGeometry args={[0.55, 2.1, 0.55]} />
        {lamb("#4a4640", { kind: "stone" })}
      </mesh>
      <mesh position={[3.6, 2.25, -1.2]}>
        <boxGeometry args={[0.72, 0.22, 0.72]} />
        {lamb("#3a3834", { kind: "metal" })}
      </mesh>
    </group>
  );
}

function FarmYard() {
  const { x, z } = FARM_AT;
  const y = heightAt(x, z);
  const rows = useMemo(() => {
    const list: { x: number; z: number; h: number; c: string }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 7; c++) {
        list.push({
          x: 3.4 + c * 0.85,
          z: -1.2 + r * 1.05,
          h: 0.32 + ((r + c) % 3) * 0.08,
          c: (r + c) % 2 ? "#3d8a38" : "#6aaa40",
        });
      }
    }
    return list;
  }, []);
  return (
    <group position={[x, y, z]}>
      <mesh position={[6.2, 0.04, 1.2]} rotation={[-Math.PI / 2, 0, 0.08]} receiveShadow>
        <planeGeometry args={[8.4, 6.2]} />
        {lamb("#8a6a38", { kind: "dirt" })}
      </mesh>
      {rows.map((p, i) => (
        <mesh key={i} position={[p.x, p.h * 0.5, p.z]} castShadow>
          <coneGeometry args={[0.08, p.h, 4]} />
          {lamb(p.c, { kind: "leaf" })}
        </mesh>
      ))}
      <group position={[6.4, 0, 3.2]}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 1.7, 6]} />
          {lamb("#6a4a28", { kind: "wood" })}
        </mesh>
        <mesh position={[0, 1.55, 0]} castShadow>
          <sphereGeometry args={[0.16, 8, 6]} />
          {lamb("#c4a06a", { kind: "cloth" })}
        </mesh>
        <mesh position={[0, 1.22, 0]} castShadow>
          <boxGeometry args={[0.72, 0.08, 0.12]} />
          {lamb("#8a3a28", { kind: "cloth" })}
        </mesh>
        <mesh position={[-0.08, 1.58, 0.12]}>
          <sphereGeometry args={[0.025, 6, 5]} />
          {lamb("#1a1410")}
        </mesh>
        <mesh position={[0.08, 1.58, 0.12]}>
          <sphereGeometry args={[0.025, 6, 5]} />
          {lamb("#1a1410")}
        </mesh>
      </group>
      {[-1.2, 1.4, 3.8].map((hx, i) => (
        <mesh key={i} position={[hx, 0.55, -3.4]} castShadow>
          <sphereGeometry args={[0.55, 8, 6]} />
          {lamb("#c9a227", { kind: "grass" })}
        </mesh>
      ))}
      <ScarecrowHit />
    </group>
  );
}

function ScarecrowHit() {
  const hit = useRef(false);
  useFrame(() => {
    if (hit.current || !live.slash) return;
    const dx = live.slash.x - FARM_CROW.x;
    const dz = live.slash.z - FARM_CROW.z;
    if (dx * dx + dz * dz < 2.2 * 2.2) {
      hit.current = true;
      const g = useGame.getState();
      if ((g.quests?.["bramble-crow"] ?? 0) < 1) {
        g.setQuest("bramble-crow", 1);
        live.listen = "The crows scatter. Bramble will want to hear that.";
        sfx.ok();
      }
    }
  });
  return null;
}

function Chickens() {
  const bits = useRef(
    Array.from({ length: 5 }, (_, i) => ({
      x: FARM_AT.x + 2 + (i % 3) * 1.4,
      z: FARM_AT.z + 4.5 + Math.floor(i / 3) * 1.6,
      a: i * 1.3,
      yaw: i,
      hop: 0,
    })),
  );
  useFrame((_, dt) => {
    const g = bits.current;
    for (const c of g) {
      c.a += dt * (0.8 + (c.x % 1));
      if (Math.sin(c.a) > 0.92) {
        c.yaw += (Math.random() - 0.5) * 0.8;
        c.x += Math.sin(c.yaw) * dt * 1.4;
        c.z += Math.cos(c.yaw) * dt * 1.4;
      }
      const dx = c.x - FARM_AT.x - 4;
      const dz = c.z - FARM_AT.z - 3;
      if (dx * dx + dz * dz > 36) {
        c.yaw += 2.4;
        c.x = FARM_AT.x + 4 + Math.sin(c.yaw) * 4;
        c.z = FARM_AT.z + 3 + Math.cos(c.yaw) * 4;
      }
      if (live.slash && Math.hypot(live.slash.x - c.x, live.slash.z - c.z) < 1.4) {
        c.hop = 0.55;
        c.yaw += 2;
        sfx.rustle();
      }
      c.hop *= Math.exp(-dt * 6);
    }
  });
  const mesh = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!mesh.current) return;
    mesh.current.children.forEach((ch, i) => {
      const c = bits.current[i];
      if (!c) return;
      ch.position.set(c.x, heightAt(c.x, c.z) + 0.16 + c.hop, c.z);
      ch.rotation.y = c.yaw;
    });
  });
  return (
    <group ref={mesh}>
      {bits.current.map((_, i) => (
        <group key={i}>
          <mesh position={[0, 0.08, 0]} castShadow>
            <sphereGeometry args={[0.14, 8, 6]} />
            {lamb("#efe6d4")}
          </mesh>
          <mesh position={[0, 0.16, 0.12]} castShadow>
            <sphereGeometry args={[0.08, 7, 5]} />
            {lamb("#efe6d4")}
          </mesh>
          <mesh position={[0, 0.16, 0.2]}>
            <coneGeometry args={[0.025, 0.08, 4]} />
            {lamb("#e07a28")}
          </mesh>
          <mesh position={[0, 0.22, -0.04]} rotation={[0.4, 0, 0]}>
            <coneGeometry args={[0.08, 0.12, 5]} />
            {lamb("#c45c48")}
          </mesh>
        </group>
      ))}
    </group>
  );
}

function FarmPig() {
  const p = useRef({ x: FARM_AT.x - 1.4, z: FARM_AT.z + 6.2, a: 0, yaw: 0.4 });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const c = p.current;
    c.a += dt * 0.55;
    if (Math.sin(c.a) > 0.7) {
      c.yaw += (Math.random() - 0.5) * 0.4;
      c.x += Math.sin(c.yaw) * dt * 0.7;
      c.z += Math.cos(c.yaw) * dt * 0.7;
    }
    const dx = c.x - FARM_AT.x;
    const dz = c.z - (FARM_AT.z + 5);
    if (dx * dx + dz * dz > 16) {
      c.yaw += 1.8;
      c.x = FARM_AT.x + Math.sin(c.yaw) * 2.4;
      c.z = FARM_AT.z + 5 + Math.cos(c.yaw) * 2.4;
    }
    if (g.current) {
      g.current.position.set(c.x, heightAt(c.x, c.z) + 0.22, c.z);
      g.current.rotation.y = c.yaw;
    }
    if (Math.hypot(live.x - c.x, live.z - c.z) < 1.4) live.listen = live.listen || "A pig. It has opinions about the fence.";
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <sphereGeometry args={[0.22, 8, 6]} />
        {lamb("#e8a090")}
      </mesh>
      <mesh position={[0, 0.12, 0.22]} castShadow>
        <sphereGeometry args={[0.12, 7, 5]} />
        {lamb("#e8a090")}
      </mesh>
      <mesh position={[0, 0.1, 0.34]}>
        <cylinderGeometry args={[0.04, 0.05, 0.08, 6]} />
        {lamb("#d49088")}
      </mesh>
    </group>
  );
}

function Barrels() {
  const spots = useMemo(
    () => [
      { x: SMITH_AT.x - 2.2, z: SMITH_AT.z + 7.4 },
      { x: SMITH_AT.x - 1.4, z: SMITH_AT.z + 7.8 },
      { x: VX + 8.4, z: VZ + 2.2 },
      { x: VX + 9.1, z: VZ + 1.6 },
      { x: VX - 6.2, z: VZ - 4.4 },
      { x: MANOR_AT.x + 4.2, z: MANOR_AT.z + 6.4 },
      { x: FARM_AT.x - 3.4, z: FARM_AT.z + 5.1 },
    ],
    [],
  );
  const [broke, setBroke] = useState<number[]>([]);
  useFrame(() => {
    if (!live.slash) return;
    spots.forEach((s, i) => {
      if (broke.includes(i)) return;
      if (Math.hypot(live.slash!.x - s.x, live.slash!.z - s.z) < 1.15) {
        setBroke((b) => (b.includes(i) ? b : [...b, i]));
        useGame.getState().addCoins(1);
        revealItem("coin");
        sfx.ok();
        live.listen = "A rupee in the barrel.";
      }
    });
  });
  return (
    <group>
      {spots.map((s, i) =>
        broke.includes(i) ? null : (
          <mesh key={i} position={[s.x, heightAt(s.x, s.z) + 0.38, s.z]} castShadow>
            <cylinderGeometry args={[0.28, 0.32, 0.72, 8]} />
            {lamb(i % 2 ? "#6a4a28" : "#5a3a20", { kind: "wood" })}
          </mesh>
        ),
      )}
    </group>
  );
}

function SlashCrates() {
  const spots = useMemo(
    () => [
      { x: VX + 11.2, z: VZ - 1.2 },
      { x: VX + 11.8, z: VZ - 0.6 },
      { x: SMITH_AT.x + 3.2, z: SMITH_AT.z + 7.1 },
      { x: VX - 14.4, z: VZ + 6.2 },
    ],
    [],
  );
  const [broke, setBroke] = useState<number[]>([]);
  useFrame(() => {
    if (!live.slash) return;
    spots.forEach((s, i) => {
      if (broke.includes(i)) return;
      if (Math.hypot(live.slash!.x - s.x, live.slash!.z - s.z) < 1.1) {
        setBroke((b) => (b.includes(i) ? b : [...b, i]));
        useGame.getState().addCoins(1);
        revealItem("coin");
        sfx.ok();
        live.listen = "A rupee in the crate.";
      }
    });
  });
  return (
    <group>
      {spots.map((s, i) =>
        broke.includes(i) ? null : (
          <mesh key={i} position={[s.x, heightAt(s.x, s.z) + 0.28, s.z]} castShadow>
            <boxGeometry args={[0.48, 0.48, 0.48]} />
            {lamb(i % 2 ? "#8a6a38" : "#7a5a28", { kind: "wood" })}
          </mesh>
        ),
      )}
    </group>
  );
}

function NoticeBoard() {
  const { x, z } = BOARD_AT;
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[-0.55, 0.7, 0]} castShadow>
        <boxGeometry args={[0.08, 1.4, 0.08]} />
        {lamb("#5a3a20", { kind: "wood" })}
      </mesh>
      <mesh position={[0.55, 0.7, 0]} castShadow>
        <boxGeometry args={[0.08, 1.4, 0.08]} />
        {lamb("#5a3a20", { kind: "wood" })}
      </mesh>
      <mesh position={[0, 1.15, 0.02]} castShadow>
        <boxGeometry args={[1.35, 0.95, 0.06]} />
        {lamb("#d8c49a", { kind: "wood" })}
      </mesh>
      <mesh position={[0.15, 1.22, 0.06]} rotation={[0, 0, 0.08]}>
        <planeGeometry args={[0.42, 0.28]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[-0.22, 1.05, 0.06]} rotation={[0, 0, -0.06]}>
        <planeGeometry args={[0.32, 0.22]} />
        <meshLambertMaterial color="#f0d090" />
      </mesh>
    </group>
  );
}

function WaySigns() {
  const bits = [
    { x: VX + 4.2, z: VZ + 22, yaw: 0, a: "Castle", b: "North" },
    { x: VX - 16, z: VZ - 8, yaw: -1.1, a: "Pond", b: "West" },
    { x: VX + 18, z: VZ - 4, yaw: 0.8, a: "Farm", b: "East" },
    { x: VX - 8, z: VZ - 22, yaw: 3.1, a: "Home", b: "South" },
  ];
  return (
    <group>
      {bits.map((s, i) => {
        const y = heightAt(s.x, s.z);
        return (
          <group key={i} position={[s.x, y, s.z]} rotation={[0, s.yaw, 0]}>
            <mesh position={[0, 0.7, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.08, 1.4, 6]} />
              {lamb("#5a3a20", { kind: "wood" })}
            </mesh>
            <mesh position={[0.28, 1.15, 0]} castShadow>
              <boxGeometry args={[0.7, 0.22, 0.06]} />
              {lamb("#c4a06a", { kind: "wood" })}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function BoardedManor() {
  const { x, z } = MANOR_AT;
  const y = heightAt(x, z);
  const d = 11.4;
  const taken = useRef(false);
  useFrame(() => {
    if (taken.current || live.house) return;
    const hx = x - 2.8;
    const hz = z - d * 0.52;
    if (Math.hypot(live.x - hx, live.z - hz) < 1.15 && live.stillT > 0.4) {
      taken.current = true;
      useGame.getState().addCoins(20);
      revealItem("coin");
      sfx.chime();
      live.listen = "A purse in the weeds behind the boarded house.";
    }
  });
  return (
    <group position={[x, y, z]}>
      {[-0.45, 0, 0.45].map((px, i) => (
        <mesh key={i} position={[px, 1.15, d * 0.5 + 0.08]} rotation={[0, 0, 0.4 - i * 0.4]} castShadow>
          <boxGeometry args={[0.16, 1.55, 0.08]} />
          {lamb("#5a3a20", { kind: "wood" })}
        </mesh>
      ))}
      <mesh position={[-2.8, 0.08, -d * 0.52]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        {lamb("#c9a227", { kind: "metal" })}
      </mesh>
    </group>
  );
}

function MarketBits() {
  const stall = { x: VX + 10.2, z: VZ - 2.4 };
  const y = heightAt(stall.x, stall.z);
  return (
    <group position={[stall.x, y, stall.z]}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[2.4, 0.08, 1.4]} />
        {lamb("#8a3a28", { kind: "cloth" })}
      </mesh>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.55, 0.55]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 1.1, 6]} />
          {lamb("#5a3a20", { kind: "wood" })}
        </mesh>
      ))}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.8, 0.55, 0.7]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      {[-0.45, 0, 0.45].map((x, i) => (
        <mesh key={i} position={[x, 0.92, 0.05]}>
          <sphereGeometry args={[0.12, 7, 5]} />
          {lamb(["#c45c48", "#3ecf6a", "#e8d48a"][i]!, { kind: "flower" })}
        </mesh>
      ))}
    </group>
  );
}

function ClothesLines() {
  const lines = [
    { ax: VX - 18.4, az: VZ + 2.2, bx: VX - 12.6, bz: VZ + 3.4 },
    { ax: VX + 16.2, az: VZ - 14.4, bx: VX + 21.4, bz: VZ - 12.8 },
  ];
  return (
    <group>
      {lines.map((l, i) => {
        const mx = (l.ax + l.bx) * 0.5;
        const mz = (l.az + l.bz) * 0.5;
        const y = heightAt(mx, mz);
        const yaw = Math.atan2(l.bx - l.ax, l.bz - l.az);
        const len = Math.hypot(l.bx - l.ax, l.bz - l.az);
        return (
          <group key={i} position={[mx, y, mz]} rotation={[0, yaw, 0]}>
            {[-len * 0.5, len * 0.5].map((px) => (
              <mesh key={px} position={[0, 1.15, px]} castShadow>
                <cylinderGeometry args={[0.05, 0.06, 2.3, 6]} />
                {lamb("#5a3a20", { kind: "wood" })}
              </mesh>
            ))}
            <mesh position={[0, 2.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, len, 4]} />
              {lamb("#d8c49a")}
            </mesh>
            {[-0.7, 0, 0.7].map((pz, k) => (
              <mesh key={k} position={[0.02, 1.85, pz]} castShadow>
                <boxGeometry args={[0.04, 0.55, 0.38]} />
                {lamb(["#efe6d4", "#3a5a88", "#8a3a38"][k]!, { kind: "cloth" })}
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function SquareBenches() {
  const spots = [
    { x: FOUNTAIN.x + 2.6, z: FOUNTAIN.z + 0.4, yaw: -0.4 },
    { x: FOUNTAIN.x - 2.4, z: FOUNTAIN.z + 0.8, yaw: 0.9 },
    { x: FIRE_PIT.x + 3.4, z: FIRE_PIT.z - 1.2, yaw: 0.2 },
    { x: BOARD_AT.x - 1.8, z: BOARD_AT.z + 1.2, yaw: 0.15 },
  ];
  return (
    <group>
      {spots.map((s, i) => {
        const y = heightAt(s.x, s.z);
        return (
          <group key={i} position={[s.x, y, s.z]} rotation={[0, s.yaw, 0]}>
            <mesh position={[0, 0.32, 0]} castShadow>
              <boxGeometry args={[1.15, 0.12, 0.38]} />
              {lamb("#6a4a28", { kind: "wood" })}
            </mesh>
            {[-0.48, 0.48].map((px) => (
              <mesh key={px} position={[px, 0.16, 0]} castShadow>
                <boxGeometry args={[0.08, 0.32, 0.32]} />
                {lamb("#5a3a20", { kind: "wood" })}
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function FlowerBeds() {
  const beds = useMemo(() => {
    const list: { x: number; z: number; c: string }[] = [];
    const hubs = [
      { x: VX - 8.4, z: VZ + 4.2 },
      { x: VX + 6.2, z: VZ - 10.4 },
      { x: FOUNTAIN.x + 1.6, z: FOUNTAIN.z - 2.2 },
      { x: WELL_AT.x + 1.8, z: WELL_AT.z - 1.2 },
    ];
    const cols = ["#c45c48", "#e8d48a", "#d478a0", "#3ecf6a", "#efe6d4"];
    hubs.forEach((h, hi) => {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        list.push({
          x: h.x + Math.cos(a) * 0.55,
          z: h.z + Math.sin(a) * 0.45,
          c: cols[(i + hi) % cols.length]!,
        });
      }
    });
    return list;
  }, []);
  return (
    <group>
      {beds.map((f, i) => (
        <mesh key={i} position={[f.x, heightAt(f.x, f.z) + 0.12, f.z]} castShadow>
          <sphereGeometry args={[0.09, 6, 5]} />
          {lamb(f.c, { kind: "flower" })}
        </mesh>
      ))}
    </group>
  );
}

function TownCat() {
  const p = useRef({ x: VX + 5.4, z: VZ + 2.2, a: 0, yaw: 0 });
  const g = useRef<THREE.Group>(null);
  const paid = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    const c = p.current;
    const d = Math.hypot(live.x - c.x, live.z - c.z);
    if (d < 3.6) {
      c.a += dt;
      const tx = live.x + Math.sin(live.yaw + 1.4) * 0.7;
      const tz = live.z + Math.cos(live.yaw + 1.4) * 0.7;
      c.x += (tx - c.x) * dt * 1.4;
      c.z += (tz - c.z) * dt * 1.4;
      c.yaw = Math.atan2(tx - c.x, tz - c.z);
      if (d < 1.15 && live.stillT > 0.8 && !paid.current) {
        paid.current = true;
        useGame.getState().addCoins(5);
        revealItem("coin");
        sfx.ok();
        live.listen = "The tan cat winds around your feet. A rupee in the fur.";
      }
    } else {
      c.a += dt * 0.4;
      c.x = VX + 5.4 + Math.sin(c.a) * 3.2;
      c.z = VZ + 2.2 + Math.cos(c.a * 0.7) * 2.6;
    }
    if (g.current) {
      g.current.position.set(c.x, heightAt(c.x, c.z) + 0.16, c.z);
      g.current.rotation.y = c.yaw;
    }
    if (d < 1.8) live.listen = live.listen || "A tan cat. It likes still feet.";
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0.04, 0]} castShadow>
        <sphereGeometry args={[0.13, 7, 5]} />
        {lamb("#c9a06a")}
      </mesh>
      <mesh position={[0, 0.1, 0.12]} castShadow>
        <sphereGeometry args={[0.08, 6, 5]} />
        {lamb("#c9a06a")}
      </mesh>
      {[-0.04, 0.04].map((x) => (
        <mesh key={x} position={[x, 0.18, 0.1]} rotation={[0.2, 0, x * 4]}>
          <coneGeometry args={[0.03, 0.08, 4]} />
          {lamb("#c9a06a")}
        </mesh>
      ))}
      <mesh position={[0, 0.02, -0.16]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.015, 0.22, 5]} />
        {lamb("#c9a06a")}
      </mesh>
    </group>
  );
}

function SquareLanterns() {
  const posts = [
    { x: VX + 4.8, z: VZ + 10.2 },
    { x: VX - 5.2, z: VZ + 8.4 },
    { x: SMITH_AT.x - 1.2, z: SMITH_AT.z + 8.4 },
    { x: FARM_AT.x - 4.2, z: FARM_AT.z + 2.2 },
  ];
  const lights = useRef<(THREE.PointLight | null)[]>([]);
  useFrame(() => {
    const want = live.night ? 3.4 : 0.35;
    for (const l of lights.current) {
      if (l) l.intensity = want;
    }
  });
  return (
    <group>
      {posts.map((p, i) => {
        const y = heightAt(p.x, p.z);
        return (
          <group key={i} position={[p.x, y, p.z]}>
            <mesh position={[0, 1.15, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.07, 2.3, 6]} />
              {lamb("#4a3a28", { kind: "wood" })}
            </mesh>
            <mesh position={[0, 2.28, 0]} castShadow>
              <boxGeometry args={[0.28, 0.32, 0.28]} />
              {lamb("#c9a227", { kind: "metal" })}
            </mesh>
            <pointLight
              ref={(el) => {
                lights.current[i] = el;
              }}
              position={[0, 2.28, 0]}
              intensity={0.4}
              color="#ffb060"
              distance={7}
            />
          </group>
        );
      })}
    </group>
  );
}

function WashTub() {
  const x = VX - 12.4;
  const z = VZ + 4.6;
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.38, 0.42, 10]} />
        {lamb("#6a7a78", { kind: "metal" })}
      </mesh>
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34, 10]} />
        <meshLambertMaterial color="#4a90a0" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function MillAlley() {
  const x = VX + 8.4;
  const z = VZ - 22.6;
  const taken = useRef(false);
  useFrame(() => {
    if (taken.current || live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 1.05 && live.stillT > 0.35) {
      taken.current = true;
      useGame.getState().addCoins(8);
      revealItem("coin");
      sfx.chime();
      live.listen = "A coin under the last mill board.";
    }
  });
  return (
    <mesh position={[x, heightAt(x, z) + 0.04, z]} rotation={[-Math.PI / 2, 0, 0.3]}>
      <planeGeometry args={[1.4, 0.55]} />
      {lamb("#5a3a20", { kind: "wood" })}
    </mesh>
  );
}

function WellFlowers() {
  const { x, z } = WELL_AT;
  return (
    <group>
      {[0.4, 1.6, 2.8, 4.1].map((a, i) => {
        const px = x + Math.sin(a) * 1.35;
        const pz = z + Math.cos(a) * 1.35;
        return (
          <mesh key={i} position={[px, heightAt(px, pz) + 0.12, pz]}>
            <sphereGeometry args={[0.08, 6, 5]} />
            {lamb(i % 2 ? "#c45c48" : "#efe6d4", { kind: "flower" })}
          </mesh>
        );
      })}
    </group>
  );
}
