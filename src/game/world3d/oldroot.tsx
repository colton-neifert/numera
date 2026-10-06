import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { useGame } from "../store";
import { sfx, setMusicDuck } from "../audio";
import { CAVE_AT, MOUTH, onSurface } from "./realms";

function Mouth() {
  const y = heightAt(MOUTH.x, MOUTH.z);
  return (
    <group position={[MOUTH.x, y, MOUTH.z]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 3.2, 3.2, -5]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 6.4, 12]} />
          {lamb("#5c4e42", { kind: "stone" })}
        </mesh>
      ))}
      <mesh position={[0, 6.2, -5]} castShadow>
        <boxGeometry args={[9, 2.2, 12]} />
        {lamb("#4a3e34", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 2.2, -10.6]}>
        <boxGeometry args={[3.2, 4, 1.2]} />
        {lamb("#141210")}
      </mesh>
      <mesh position={[1.4, 3.4, -2]}>
        <boxGeometry args={[0.28, 2.4, 0.22]} />
        {lamb("#2f6a34")}
      </mesh>
    </group>
  );
}

function Cave() {
  const y = heightAt(CAVE_AT.x, CAVE_AT.z);
  const drip = useRef(0);
  useFrame((_, dt) => {
    const here = live.realm === "oldroot";
    setMusicDuck(here);
    if (!here) return;
    drip.current -= dt;
    if (drip.current <= 0) {
      drip.current = 2.6 + Math.random() * 2.2;
      sfx.drip();
    }
    if (!useGame.getState().quests?.oldrootGem && Math.hypot(live.x - (CAVE_AT.x + 5.4), live.z - (CAVE_AT.z + 0.4)) < 1.3) {
      useGame.getState().setQuest("oldrootGem", 1);
      useGame.getState().addCoins(12);
      live.banner = "A cave crystal. It belongs to this place.";
      sfx.chime();
    }
  });
  return (
    <group position={[CAVE_AT.x, y, CAVE_AT.z]}>
      <mesh position={[0, 5.2, 2]} receiveShadow>
        <boxGeometry args={[20, 0.4, 28]} />
        {lamb("#3a342c", { kind: "stone" })}
      </mesh>
      <mesh position={[0, -0.2, 1]} receiveShadow>
        <boxGeometry args={[16.4, 0.3, 26]} />
        {lamb("#4a4038", { kind: "dirt" })}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 8.2, 3.2, 2]} receiveShadow>
          <boxGeometry args={[1.6, 6.4, 28]} />
          {lamb("#5a4c40", { kind: "stone" })}
        </mesh>
      ))}
      <mesh position={[0, 3.2, 15.2]} receiveShadow>
        <boxGeometry args={[18, 6.4, 1.6]} />
        {lamb("#5a4c40", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 3.2, -10.6]}>
        <boxGeometry args={[14, 6.4, 1.4]} />
        {lamb("#2a241e", { kind: "stone" })}
      </mesh>
      <mesh position={[5.4, 0.7, 0.4]}>
        <octahedronGeometry args={[0.45, 0]} />
        {lamb("#7ec8e8", { emissive: "#9ad8f0", emit: 0.45 })}
      </mesh>
      <mesh position={[-3, 0.55, -2]}>
        <boxGeometry args={[0.7, 1.1, 0.25]} />
        {lamb("#efe6d4")}
      </mesh>
      <group position={[4.2, 0, -3]}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[0.46, 0.9, 0.32]} />
          {lamb("#6a5340")}
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.26]} />
          {lamb("#e0b090")}
        </mesh>
      </group>
      <pointLight position={[0, 3.2, -1]} intensity={0.6} distance={16} color="#ffd0a0" />
    </group>
  );
}

export function stepOldroot(talk: boolean) {
  if (live.realm !== "oldroot" || !talk) return false;
  if (Math.hypot(live.x - (CAVE_AT.x + 4.2), live.z - (CAVE_AT.z - 3)) < 2.1) {
    live.banner = "The miner stays with the cave. Oakstead is another world from here.";
    return true;
  }
  if (Math.hypot(live.x - (CAVE_AT.x - 3), live.z - (CAVE_AT.z - 2)) < 1.6) {
    live.banner = "Oldroot Cave. The town is not above you.";
    return true;
  }
  return false;
}

export function Oldroot() {
  const mouth = useRef<THREE.Group>(null);
  const cave = useRef<THREE.Group>(null);
  useFrame(() => {
    const surface = onSurface();
    if (mouth.current) mouth.current.visible = surface;
    if (cave.current) cave.current.visible = !surface && live.realm === "oldroot";
  });
  return (
    <group>
      <group ref={mouth}>
        <Mouth />
      </group>
      <group ref={cave}>
        <Cave />
      </group>
    </group>
  );
}
