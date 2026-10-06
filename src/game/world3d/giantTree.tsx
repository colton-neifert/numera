import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { useGame } from "../store";
import { sfx } from "../audio";
import { CLIMB, MOUTH_0, MOUTH_1, MOUTH_HALF, TREE, VALLEY, passageZ, treeLift } from "./giantTreeData";

function Bark({ p, a, c = "#6a442c" }: { p: [number, number, number]; a: [number, number, number]; c?: string }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={a} />
      {lamb(c, { kind: "wood" })}
    </mesh>
  );
}

function Mouth({ x }: { x: number }) {
  const z = passageZ(x);
  const y = heightAt(x, z);
  return (
    <group>
      <Bark p={[x, y + 6.2, z - 6.2]} a={[4.2, 13, 3.6]} c="#5a3824" />
      <Bark p={[x, y + 6.2, z + 6.2]} a={[4.2, 13, 3.6]} c="#5a3824" />
      <Bark p={[x, y + 12.2, z]} a={[4.4, 3.2, 16]} c="#4e321f" />
    </group>
  );
}

function Tunnel() {
  const ribs = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const x = MOUTH_0 + (MOUTH_1 - MOUTH_0) * t;
    const z = passageZ(x);
    const y = heightAt(x, z);
    ribs.push({ x, y, z, t });
  }
  return (
    <group>
      {ribs.map((r, i) => (
        <group key={i} position={[r.x, r.y, r.z]}>
          <Bark p={[0, 3.4, -(MOUTH_HALF + 1.3)]} a={[3.2, 7.2, 2.4]} />
          <Bark p={[0, 3.4, MOUTH_HALF + 1.3]} a={[3.2, 7.2, 2.4]} c={i % 3 === 0 ? "#5a3a26" : "#6a442c"} />
          <Bark p={[0, 7.3, 0]} a={[3.2, 1.5, MOUTH_HALF * 2 + 4]} c="#5c3c28" />
          {i % 4 === 2 ? <Bark p={[0, 5.6, 0]} a={[0.4, 0.35, MOUTH_HALF * 2]} c="#4a3424" /> : null}
          {i % 5 === 1 ? (
            <mesh position={[0.8, 0.28, -1.2]}>
              <coneGeometry args={[0.28, 0.4, 6]} />
              {lamb(i % 2 ? "#c45a48" : "#d8c060")}
            </mesh>
          ) : null}
          {i % 6 === 3 ? (
            <mesh position={[-1.4, 4.2, 0.4]} rotation={[0.4, 0, 0.2]}>
              <boxGeometry args={[0.15, 2.4, 0.8]} />
              {lamb("#e8d9a0", { emissive: "#ffe7a0", emit: 0.55 })}
            </mesh>
          ) : null}
        </group>
      ))}
    </group>
  );
}

function Trunk() {
  const y = heightAt(TREE.x, TREE.z);
  return (
    <group position={[TREE.x, y, TREE.z]}>
      <Bark p={[0, 22, 0]} a={[20, 26, 18]} c="#6b4630" />
      <Bark p={[0, 38, 0]} a={[13, 10, 12]} c="#5e3e2a" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 7, 42, Math.sin(a) * 6]} castShadow>
            <coneGeometry args={[9, 14, 6]} />
            {lamb(i % 2 ? "#1f6a32" : "#2f8a40")}
          </mesh>
        );
      })}
      <mesh position={[0, 50, 0]} castShadow>
        <coneGeometry args={[6, 9, 6]} />
        {lamb("#3aaa52")}
      </mesh>
      {[-1, 1].map((s) => (
        <Bark key={s} p={[s * 8, 1.1, 10]} a={[3, 2.2, 8]} c="#5a3c28" />
      ))}
      <Bark p={[-12, 0.8, 0]} a={[8, 1.6, 3]} />
      <Bark p={[11, 0.7, -2]} a={[7, 1.4, 2.6]} />
      <mesh position={[-6, 4.5, -MOUTH_HALF - 0.2]}>
        <boxGeometry args={[0.25, 3.2, 0.25]} />
        {lamb("#2f6a34")}
      </mesh>
    </group>
  );
}

function ValleyBowl() {
  const y = heightAt(VALLEY.x, VALLEY.z);
  const segs = 18;
  return (
    <group>
      {Array.from({ length: segs }, (_, i) => {
        const a = (i / segs) * Math.PI * 2;
        let d = a - Math.PI;
        if (d > Math.PI) d -= Math.PI * 2;
        if (Math.abs(d) < 0.55) return null;
        const x = VALLEY.x + Math.cos(a) * 24;
        const z = VALLEY.z + Math.sin(a) * 24;
        const gy = heightAt(x, z);
        return (
          <mesh key={i} position={[x, gy + 6, z]} rotation={[0, -a, 0]} castShadow receiveShadow>
            <boxGeometry args={[9, 12, 6]} />
            {lamb(i % 2 ? "#7a6248" : "#6a5640", { kind: "stone" })}
          </mesh>
        );
      })}
      <mesh position={[VALLEY.x, y + 0.04, VALLEY.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[16, 20]} />
        {lamb("#6a9a48")}
      </mesh>
      <mesh position={[VALLEY.x + 4, y + 0.08, VALLEY.z + 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.2, 16]} />
        {lamb("#3a88b0")}
      </mesh>
      <mesh position={[VALLEY.x - 6, y + 1.6, VALLEY.z + 4]} castShadow>
        <boxGeometry args={[1.2, 3.2, 0.8]} />
        {lamb("#d8d0c4", { kind: "stone" })}
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[VALLEY.x + Math.cos(i) * 8, y + 0.25, VALLEY.z - 4 + Math.sin(i) * 5]}>
          <coneGeometry args={[0.16, 0.4, 5]} />
          {lamb(i % 2 ? "#e090a8" : "#f0d868")}
        </mesh>
      ))}
      <Deer />
    </group>
  );
}

function Deer() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.25;
    const x = VALLEY.x + Math.sin(t) * 6;
    const z = VALLEY.z - 6 + Math.cos(t * 0.8) * 3;
    ref.current.position.set(x, heightAt(x, z), z);
    ref.current.rotation.y = t;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.4, 0.45, 0.9]} />
        {lamb("#8a5a32")}
      </mesh>
      <mesh position={[0, 1.05, -0.45]} castShadow>
        <boxGeometry args={[0.22, 0.28, 0.28]} />
        {lamb("#a07040")}
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 1.35, -0.5]}>
          <boxGeometry args={[0.06, 0.28, 0.06]} />
          {lamb("#6a4a30")}
        </mesh>
      ))}
    </group>
  );
}

function ForestLane() {
  const spots = [
    [250, 58],
    [268, 88],
    [286, 48],
    [274, 96],
    [240, 78],
    [296, 90],
  ];
  return (
    <group>
      {spots.map(([x, z], i) => {
        const y = heightAt(x!, z!);
        return (
          <group key={i} position={[x, y, z]}>
            <mesh position={[0, 1.3, 0]} castShadow>
              <boxGeometry args={[0.45, 2.6, 0.45]} />
              {lamb("#5a4030", { kind: "wood" })}
            </mesh>
            <mesh position={[0, 3.1, 0]} castShadow>
              <coneGeometry args={[1.5, 2.6, 6]} />
              {lamb("#1f5a32")}
            </mesh>
          </group>
        );
      })}
      <mesh position={[270, heightAt(270, 50) + 0.05, 50]} rotation={[-Math.PI / 2, 0, 0.12]}>
        <planeGeometry args={[46, 3.2]} />
        {lamb("#2a6aaa")}
      </mesh>
      <mesh position={[270, heightAt(270, 50) + 0.25, 50]} castShadow>
        <boxGeometry args={[1.4, 0.28, 4.2]} />
        {lamb("#6a5340", { kind: "wood" })}
      </mesh>
    </group>
  );
}

export function GiantTree() {
  const seen = useRef(false);
  const pocket = useRef(false);
  const branch = useRef(false);
  const stone = useRef(false);
  useFrame(() => {
    const zc = passageZ(live.x);
    const emerging = live.x > MOUTH_1 - 2 && Math.abs(live.z - passageZ(MOUTH_1)) < 6;
    if (!seen.current && emerging && !useGame.getState().quests?.sawValley) {
      seen.current = true;
      useGame.getState().setQuest("sawValley", 1);
      live.banner = "A hidden valley.";
      live.objective = "The tree was the door.";
      sfx.chime();
    }
    const midZ = passageZ(TREE.x + 2);
    if (!pocket.current && Math.abs(live.x - (TREE.x + 2)) < 2.4 && live.z < midZ - 5 && live.z > midZ - 9) {
      pocket.current = true;
      if (!useGame.getState().quests?.treePocket) {
        useGame.getState().setQuest("treePocket", 1);
        useGame.getState().addCoins(16);
        live.banner = "A pocket in the roots.";
        sfx.chime();
      }
    }
    const top = CLIMB[CLIMB.length - 1]!;
    if (!branch.current && Math.hypot(live.x - top.x, live.z - top.z) < 2 && !useGame.getState().quests?.treeBranch) {
      branch.current = true;
      useGame.getState().setQuest("treeBranch", 1);
      useGame.getState().addCoins(20);
      live.banner = "The high branch.";
      sfx.chime();
    }
    if (!stone.current && Math.hypot(live.x - (VALLEY.x - 6), live.z - (VALLEY.z + 4)) < 1.8 && !useGame.getState().quests?.valleyStone) {
      stone.current = true;
      useGame.getState().setQuest("valleyStone", 1);
      useGame.getState().addCoins(14);
      live.banner = "The stone in the valley was waiting.";
      sfx.ok();
    }
  });
  const y = heightAt(TREE.x, TREE.z);
  return (
    <group>
      <Trunk />
      <Tunnel />
      <Mouth x={MOUTH_0} />
      <Mouth x={MOUTH_1} />
      <ValleyBowl />
      <ForestLane />
      {CLIMB.map((p, i) => {
        const lift = treeLift(p.x, p.z);
        const h = Math.max(0.5, lift);
        const gy = heightAt(p.x, p.z);
        return (
          <mesh key={i} position={[p.x, gy - lift + h * 0.5, p.z]} castShadow receiveShadow>
            <boxGeometry args={[3.4, h, 3.4]} />
            {lamb("#5a3c28", { kind: "wood" })}
          </mesh>
        );
      })}
      <mesh position={[TREE.x + 2, y + 1.2, passageZ(TREE.x + 2) - 7]}>
        <boxGeometry args={[2.2, 1.6, 0.3]} />
        {lamb("#c4a060")}
      </mesh>
      <mesh position={[TREE.x + 2, y + 0.4, passageZ(TREE.x + 2) - 7.4]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        {lamb("#e8d48a")}
      </mesh>
    </group>
  );
}
