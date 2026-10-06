import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { useGame } from "../store";
import { sfx } from "../audio";

export const PALE = { x: 96, z: 408 };

export function collidePale(nx: number, nz: number, open: boolean) {
  const spots = [
    { x: PALE.x - 6, z: PALE.z - 2, hx: 2.2, hz: 1.8 },
    { x: PALE.x + 6, z: PALE.z + 2, hx: 2.2, hz: 1.6 },
    { x: PALE.x, z: PALE.z + 7, hx: 1.2, hz: 1.2 },
    { x: PALE.x - 8, z: PALE.z + 6, hx: 1.4, hz: 1.4 },
  ];
  for (const s of spots) {
    if (Math.abs(nx - s.x) < s.hx && Math.abs(nz - s.z) < s.hz) {
      const dx = nx - s.x;
      const dz = nz - s.z;
      if (Math.abs(dx) / s.hx > Math.abs(dz) / s.hz) return { x: s.x + Math.sign(dx || 1) * s.hx, z: nz };
      return { x: nx, z: s.z + Math.sign(dz || 1) * s.hz };
    }
  }
  if (!open && Math.abs(nx - (PALE.x + 1)) < 1.3 && Math.abs(nz - (PALE.z - 6)) < 0.8) {
    return { x: nx, z: nz > PALE.z - 6 ? PALE.z - 5 : PALE.z - 7 };
  }
  return null;
}

export function stepPale(talk: boolean) {
  if (!talk || (live.realm && live.realm !== "surface")) return false;
  if (Math.hypot(live.x - (PALE.x + 3), live.z - PALE.z) < 2.2) {
    const night = live.night;
    live.banner = night
      ? "Brann keeps the stones after dark. The gate still wants the mountain crystal."
      : "Brann walks the ruins by day. The pale gate opens for the mountain crystal.";
    return true;
  }
  return false;
}

export function PaleStones() {
  const door = useRef<THREE.Mesh>(null);
  const brann = useRef<THREE.Group>(null);
  const wolf = useRef<THREE.Group>(null);
  const got = useRef(false);
  const nip = useRef(0);
  useFrame((_, dt) => {
    const open = Boolean(useGame.getState().quests?.rangeCrystal);
    if (door.current) door.current.position.y = open ? -2 : 1.3;
    const t = performance.now() * 0.001;
    if (brann.current) {
      if (live.night) brann.current.position.set(3, 0, 0);
      else brann.current.position.set(Math.sin(t * 0.35) * 3.2, 0, 1 + Math.cos(t * 0.35) * 2);
    }
    if (wolf.current) {
      wolf.current.visible = Boolean(live.night);
      const lx = -2 + Math.sin(t * 0.4) * 2;
      wolf.current.position.set(lx, 0, 5);
      nip.current -= dt;
      if (live.night && nip.current <= 0 && Math.hypot(live.x - (PALE.x + lx), live.z - (PALE.z + 5)) < 1.4) {
        nip.current = 1.6;
        const g = useGame.getState();
        useGame.setState({ hp: Math.max(1, (g.hp ?? 4) - 1) });
        live.banner = "A night wolf keeps the statue.";
      }
    }
    if (!got.current && open && Math.hypot(live.x - (PALE.x + 1), live.z - (PALE.z - 8)) < 1.6 && !useGame.getState().quests?.paleCache) {
      got.current = true;
      useGame.getState().setQuest("paleCache", 1);
      useGame.getState().addCoins(24);
      live.banner = "The pale gate stayed open.";
      sfx.chime();
    }
  });
  const y = heightAt(PALE.x, PALE.z);
  return (
    <>
    <group position={[PALE.x, y, PALE.z]}>
      {[
        [-6, -2, 4, 2.2],
        [6, 2, 3.6, 2.4],
        [-8, 6, 2.6, 1.4],
      ].map(([x, z, w, h], i) => (
        <mesh key={i} position={[x!, 1.1, z!]} castShadow receiveShadow>
          <boxGeometry args={[w, 2.2, h]} />
          {lamb(i % 2 ? "#c8c2b4" : "#b0a898")}
        </mesh>
      ))}
      <mesh position={[0, 3.2, 7]} castShadow>
        <boxGeometry args={[1.1, 6.4, 0.8]} />
        {lamb("#d8d4cc", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 6.6, 7]}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        {lamb("#ece8e0")}
      </mesh>
      <mesh ref={door} position={[1, 1.3, -6]} castShadow>
        <boxGeometry args={[2.4, 2.6, 0.45]} />
        {lamb("#8a8478", { kind: "stone" })}
      </mesh>
      <mesh position={[1, 0.4, -8.2]}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        {lamb("#e8d48a")}
      </mesh>
      <mesh position={[-4, 1.1, -4]}>
        <boxGeometry args={[0.7, 1.3, 0.12]} />
        {lamb("#efe6d4")}
      </mesh>
      <group ref={brann} position={[3, 0, 0]}>
        <mesh position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[0.34, 1.5, 0.28]} />
          {lamb("#6a7a88")}
        </mesh>
        <mesh position={[0, 2.05, 0]}>
          <boxGeometry args={[0.28, 0.28, 0.24]} />
          {lamb("#c8a888")}
        </mesh>
      </group>
      <group ref={wolf}>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.4, 0.32, 0.9]} />
          {lamb("#4a4e56")}
        </mesh>
      </group>
    </group>
    <mesh position={[36, heightAt(36, 362) + 0.7, 362]}>
      <boxGeometry args={[1.1, 1.2, 0.12]} />
      {lamb("#efe6d4")}
    </mesh>
    </>
  );
}
