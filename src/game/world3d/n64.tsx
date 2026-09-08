import { useMemo, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, ROCKS, TREES, vWorld, rockGone, blownRocks, type TreeSpot } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";

import { lamb as stdLamb, GroundBlob, type MatKind } from "./mats";

function lamb(color: string, opts?: { emissive?: string; emit?: number; flat?: boolean; map?: THREE.Texture | null; kind?: MatKind }) {
  return stdLamb(color, { ...opts, kind: opts?.kind ?? (opts?.flat ? "scale" : "default") });
}

export type FighterAct = "idle" | "hop" | "slam" | "hurt";
export type FangPose = "walk" | "idle" | "yell" | "hiss" | "chase" | "gallop" | "swipe" | "guard" | "sit" | "lean";
export type FangArm = "claw" | "sword" | "spear";

export function fangArm(kind: string, seed: number, guard = false): FangArm {
  if (guard || kind === "timesprout") return "spear";
  if (kind === "nag" || kind === "leftover" || kind === "remainder" || kind === "warden") return "claw";
  const u = Math.abs(Math.sin(seed * 12.9898 + 78.23));
  if (u < 0.33) return "spear";
  if (u < 0.66) return "sword";
  return "claw";
}

function coatOf(kind: string, world?: string) {
  const snow = world === "grave" || world === "spire";
  const scaled = !snow;
  if (kind === "nag" || kind === "leftover" || kind === "remainder") {
    return { fur: "#245a28", belly: "#e8d48a", dark: "#102010", shade: "#1a3a1c", snout: "#3a7a38", paw: "#1e4a22", eye: "#ffe080", scaled: true };
  }
  if (snow) {
    return { fur: "#a8a49c", belly: "#d8d4cc", dark: "#6a6660", shade: "#7a7670", snout: "#98948c", paw: "#7a7670", eye: "#c45c38", scaled: false };
  }
  if (kind === "driplet" || world === "marsh" || world === "fen" || world === "lake") {
    return { fur: "#2e6e5c", belly: "#d0c490", dark: "#142e28", shade: "#1e4a3c", snout: "#3e7e6c", paw: "#245848", eye: "#88e0c8", scaled: true };
  }
  if (kind === "emberling" || world === "crater" || world === "hollow") {
    return { fur: "#8a4830", belly: "#d0b080", dark: "#4a2018", shade: "#7a3828", snout: "#9a5840", paw: "#7a3820", eye: "#e07040", scaled: true };
  }
  return { fur: "#3a6e2c", belly: "#d8cc98", dark: "#183018", shade: "#245024", snout: "#4a7e3c", paw: "#2e5a28", eye: "#c9a227", scaled };
}

function SlimTail({
  fur,
  dark,
  long,
  sway,
}: {
  fur: string;
  dark: string;
  long?: boolean;
  sway: RefObject<THREE.Group | null>;
}) {
  const h = long ? 1.15 : 0.92;
  return (
    <group ref={sway} position={[0, 0.7, -0.13]} rotation={[1.05, 0, 0]}>
      <mesh position={[0, -h * 0.48, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.09, h, 10]} />
        {lamb(fur)}
      </mesh>
      <mesh position={[0, -h * 0.22, -0.02]} scale={[1.15, 0.4, 1.05]} castShadow>
        <sphereGeometry args={[0.07, 8, 6]} />
        {lamb(dark)}
      </mesh>
      <mesh position={[0, -h * 0.55, -0.03]} scale={[1.1, 0.38, 1]} castShadow>
        <sphereGeometry args={[0.055, 8, 6]} />
        {lamb(dark)}
      </mesh>
      <mesh position={[0, -h * 0.98, 0]} castShadow>
        <sphereGeometry args={[0.035, 8, 6]} />
        {lamb(dark)}
      </mesh>
    </group>
  );
}

const U_GEO = new THREE.TorusGeometry(0.016, 0.005, 5, 8, Math.PI);

function onHide(x: number, y: number, side = 0): [number, number, number] {
  const cx = 0;
  const cz = 0.03;
  const r = 0.236;
  let px: number;
  let pz: number;
  if (side !== 0) {
    const th = side < 0 ? 2.05 : -2.05;
    px = Math.sin(th) * r;
    pz = cz + Math.cos(th) * r;
  } else {
    px = x;
    pz = cz - Math.sqrt(Math.max(0.0001, r * r - x * x));
  }
  const dx = px - cx;
  const dz = pz - cz;
  const n = Math.hypot(dx, dz) || 1;
  const sink = 0.014;
  return [px - (dx / n) * sink, y, pz - (dz / n) * sink];
}

const SCALE_US: { p: [number, number, number]; yaw: number }[] = [
  ...[
    [-0.05, 1.32],
    [0.05, 1.32],
    [0, 1.24],
  ].map(([x, y]) => ({ p: onHide(x, y), yaw: 0 })),
  ...[
    [-0.042, 1.14],
    [0.042, 1.14],
  ].map(([x, y]) => ({ p: onHide(x, y), yaw: 0 })),
  ...[
    [-0.055, 1.04],
    [0.055, 1.04],
    [0, 0.96],
  ].map(([x, y]) => ({ p: onHide(x, y), yaw: 0 })),
  ...[
    [-0.04, 0.86],
    [0.04, 0.86],
  ].map(([x, y]) => ({ p: onHide(x, y), yaw: 0 })),
  ...[
    [-0.05, 0.76],
    [0.05, 0.76],
    [0, 0.68],
  ].map(([x, y]) => ({ p: onHide(x, y), yaw: 0 })),
  ...[
    [-0.038, 0.58],
    [0.038, 0.58],
  ].map(([x, y]) => ({ p: onHide(x, y), yaw: 0 })),
  { p: onHide(0, 1.2, -1), yaw: -1.05 },
  { p: onHide(0, 1.06, -1), yaw: -1.05 },
  { p: onHide(0, 0.92, -1), yaw: -1.05 },
  { p: onHide(0, 1.26, 1), yaw: 1.05 },
  { p: onHide(0, 1.12, 1), yaw: 1.05 },
  { p: onHide(0, 0.98, 1), yaw: 1.05 },
  { p: onHide(0, 0.84, 1), yaw: 1.05 },
];

function ScaleUs({ color }: { color: string }) {
  return (
    <group>
      {SCALE_US.map((u, i) => (
        <mesh key={i} geometry={U_GEO} position={u.p} rotation={[0.08, u.yaw, Math.PI]}>
          {lamb(color)}
        </mesh>
      ))}
    </group>
  );
}

function HideMarks({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[-0.05, 1.08, -0.26]} rotation={[1.15, 0, 0.55]} castShadow>
        <boxGeometry args={[0.12, 0.028, 0.035]} />
        {lamb(color)}
      </mesh>
      <mesh position={[0.05, 1.08, -0.26]} rotation={[1.15, 0, -0.55]} castShadow>
        <boxGeometry args={[0.12, 0.028, 0.035]} />
        {lamb(color)}
      </mesh>
      <mesh position={[-0.22, 1.16, 0.02]} rotation={[0.2, 0.4, 0]} castShadow>
        <torusGeometry args={[0.045, 0.012, 6, 10]} />
        {lamb(color)}
      </mesh>
      <mesh position={[-0.22, 1.16, 0.02]} rotation={[0.2, 0.4, 0]}>
        <sphereGeometry args={[0.016, 6, 5]} />
        {lamb(color)}
      </mesh>
      <mesh position={[0.04, 1.08, -0.2]} rotation={[1.2, 0.2, 0]} castShadow>
        <boxGeometry args={[0.035, 0.16, 0.022]} />
        {lamb(color)}
      </mesh>
      <mesh position={[-0.05, 1.12, -0.2]} rotation={[1.2, -0.15, 0]} castShadow>
        <boxGeometry args={[0.028, 0.12, 0.02]} />
        {lamb(color)}
      </mesh>
    </group>
  );
}

function BatWing({
  side,
  membrane,
  bone,
  flap,
}: {
  side: number;
  membrane: string;
  bone: string;
  flap: RefObject<THREE.Group | null>;
}) {
  return (
    <group ref={flap} position={[side * 0.22, 1.28, -0.22]} rotation={[0.18, side * 0.38, side * 0.62]} scale={[1.35, 1.28, 1.28]}>
      <mesh position={[side * 0.28, 0.02, 0]} rotation={[0.1, 0, side * 0.15]} castShadow>
        <cylinderGeometry args={[0.028, 0.045, 0.72, 6]} />
        {lamb(bone)}
      </mesh>
      {[0.15, 0.42, 0.68].map((u, i) => (
        <mesh
          key={i}
          position={[side * (0.18 + u * 0.55), -0.08 - i * 0.12, 0.04]}
          rotation={[0.35 + i * 0.15, side * 0.1, side * (0.55 + i * 0.18)]}
          castShadow
        >
          <cylinderGeometry args={[0.014, 0.022, 0.55 - i * 0.06, 5]} />
          {lamb(bone)}
        </mesh>
      ))}
      <mesh position={[side * 0.48, -0.18, 0.02]} rotation={[0.35, side * 0.15, side * 0.22]} scale={[1, 1, 1]} castShadow>
        <planeGeometry args={[0.95, 0.72]} />
        <meshLambertMaterial color={membrane} side={THREE.DoubleSide} transparent opacity={0.88} />
      </mesh>
      <mesh position={[side * 0.62, -0.38, 0.06]} rotation={[0.55, side * 0.08, side * 0.12]} castShadow>
        <planeGeometry args={[0.72, 0.55]} />
        <meshLambertMaterial color={membrane} side={THREE.DoubleSide} transparent opacity={0.82} />
      </mesh>
    </group>
  );
}

export function N64Foe({
  kind,
  seed = 0,
  act,
  world,
  pose = "walk",
  side = 1,
}: {
  kind: string;
  seed?: number;
  act?: FighterAct;
  world?: string;
  pose?: FangPose;
  side?: number;
}) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const lArm = useRef<THREE.Group>(null);
  const rArm = useRef<THREE.Group>(null);
  const lLeg = useRef<THREE.Group>(null);
  const rLeg = useRef<THREE.Group>(null);
  const spear = useRef<THREE.Group>(null);
  const blade = useRef<THREE.Group>(null);
  const tongue = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Group>(null);
  const wingR = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const phase = useRef(seed * 1.7);
  const hopY = useRef(0);
  const swipeU = useRef(0);
  const flick = useRef(0);
  const boss = kind === "leftover" || kind === "warden";
  const winged = kind === "nag" || kind === "leftover" || kind === "remainder";
  const coat = coatOf(kind, world);
  const guard = pose === "guard";
  const arm = fangArm(kind, seed, guard);

  useFrame((_, dt) => {
    phase.current += dt * (pose === "chase" || pose === "swipe" ? 9.2 : pose === "walk" ? 5.4 : 1.6);
    const breath = Math.sin(phase.current) * 0.035;
    const swing = Math.sin(phase.current);
    const hop = act === "hop";
    const slam = act === "slam";
    const hurt = act === "hurt";
    const sit = pose === "sit";
    const lean = pose === "lean";
    const hiss = pose === "hiss" || pose === "yell";
    const swipe = pose === "swipe";
    const chase = pose === "chase";
    const walking = pose === "walk";
    hopY.current += ((hop ? 0.55 : slam ? 0 : hurt ? 0.08 : 0) - hopY.current) * (1 - Math.exp(-dt * (slam ? 18 : 9)));

    if (spear.current) spear.current.visible = arm === "spear";
    if (blade.current) blade.current.visible = arm === "sword" && pose !== "sit";
    if (lLeg.current) lLeg.current.position.set(-0.14, sit ? 0.42 : 0.56, sit ? 0.22 : 0.04);
    if (rLeg.current) rLeg.current.position.set(0.14, sit ? 0.42 : 0.56, sit ? 0.22 : 0.04);

    if (sit) {
      if (lLeg.current) lLeg.current.rotation.set(-0.15, 0.08, 0.12);
      if (rLeg.current) rLeg.current.rotation.set(-0.12, -0.08, -0.12);
      if (lArm.current) lArm.current.rotation.set(-0.35, 0, 0.28);
      if (rArm.current) rArm.current.rotation.set(-0.32, 0, -0.28);
      if (head.current) head.current.rotation.set(0.08 + breath, 0, 0);
    } else if (lean) {
      if (lLeg.current) lLeg.current.rotation.set(0.15, 0, 0.2);
      if (rLeg.current) rLeg.current.rotation.set(0.35, 0, -0.08);
      if (lArm.current) lArm.current.rotation.set(-0.8, 0.2, 0.55);
      if (rArm.current) rArm.current.rotation.set(-0.15, 0, -0.25);
    } else if (hiss) {
      swipeU.current = 0;
      if (lLeg.current) lLeg.current.rotation.x = 0.35;
      if (rLeg.current) rLeg.current.rotation.x = 0.55;
      if (lArm.current) lArm.current.rotation.set(-0.35, 0, 0.45);
      if (rArm.current) rArm.current.rotation.set(0.95, -0.55, -0.65);
      if (head.current) head.current.rotation.set(pose === "yell" ? -0.28 : 0.18, 0, 0);
    } else if (swipe) {
      swipeU.current = Math.min(1, swipeU.current + dt * (arm === "sword" ? 10.5 : 7.5));
      const u = swipeU.current;
      if (lLeg.current) lLeg.current.rotation.x = 0.45;
      if (rLeg.current) rLeg.current.rotation.x = 0.2;
      if (lArm.current) lArm.current.rotation.set(-0.45, 0, 0.55);
      if (arm === "spear") {
        if (rArm.current) rArm.current.rotation.set(-0.15 - u * 1.85, -0.2, -0.35 + u * 0.2);
      } else {
        if (rArm.current) rArm.current.rotation.set(0.95 - u * 2.7, -0.55 + u * 1.05, -0.65 + u * 1.25);
      }
    } else if (chase) {
      if (lLeg.current) lLeg.current.rotation.set(-swing * 0.95, 0, 0);
      if (rLeg.current) rLeg.current.rotation.set(swing * 0.95, 0, 0);
      if (lArm.current) lArm.current.rotation.set(swing * 0.85 - 0.4, 0, 0.35);
      if (rArm.current) rArm.current.rotation.set(-swing * 0.85 - 0.4, 0, -0.35);
    } else if (guard) {
      const stab = live.guardStab;
      if (lLeg.current) lLeg.current.rotation.x = 0.04;
      if (rLeg.current) rLeg.current.rotation.x = 0.08;
      if (lArm.current) lArm.current.rotation.set(0.08, 0, 0.16);
      if (rArm.current) rArm.current.rotation.set(0.1 - stab * 1.05, -0.06 - stab * 0.35 * side, -0.28 + stab * 0.85 * side);
      if (spear.current) spear.current.rotation.set(0.06 + stab * 1.05, 0, 0.04 + stab * 0.7 * side);
    } else {
      if (lLeg.current) lLeg.current.rotation.set(walking ? -swing * 0.42 : hop ? -0.3 : slam ? 0.15 : 0.04, 0, 0);
      if (rLeg.current) rLeg.current.rotation.set(walking ? swing * 0.42 : hop ? -0.3 : slam ? 0.15 : 0.04, 0, 0);
      if (lArm.current) lArm.current.rotation.set(slam ? -2.35 : hop ? -1.2 : walking ? swing * 0.35 : 0.08 + breath, 0, 0.55);
      if (rArm.current) rArm.current.rotation.set(slam ? -2.35 : hop ? -1.2 : walking ? -swing * 0.35 : 0.08 + breath, 0, -0.55);
      if (head.current) head.current.rotation.set(walking ? 0.06 : breath * 0.4, 0, 0);
    }

    flick.current -= dt;
    if (tongue.current) {
      if (flick.current <= 0 && Math.random() < dt * 0.35) flick.current = 0.14;
      const show = flick.current > 0;
      tongue.current.visible = show;
      if (show) {
        tongue.current.rotation.y = Math.sin(flick.current * 92) * 0.85;
        tongue.current.position.z = 0.42 + (0.14 - flick.current) * 0.55;
      }
    }
    if (root.current) {
      root.current.position.y = hopY.current;
      root.current.rotation.x = hop
        ? -0.08
        : slam
          ? 0.22
          : hurt
            ? 0.2
            : sit
              ? 0.28 + breath * 0.08
              : swipe
                ? 0.18
                : pose === "yell"
                  ? winged
                    ? -0.18
                    : -0.12
                  : hiss
                    ? 0.22
                    : chase
                      ? 0.18
                      : walking
                        ? -0.04
                        : breath * 0.05;
      root.current.rotation.z = lean ? 0.18 : swipe ? swipeU.current * -0.22 : 0;
    }
    if (winged) {
      const flap = pose === "yell" ? Math.sin(phase.current * 5.2) * 0.42 : Math.sin(phase.current * 1.15) * 0.1;
      if (wingL.current) {
        wingL.current.rotation.z = -0.55 - flap;
        wingL.current.rotation.y = -0.42 - flap * 0.35;
      }
      if (wingR.current) {
        wingR.current.rotation.z = 0.55 + flap;
        wingR.current.rotation.y = 0.42 + flap * 0.35;
      }
    }
    if (tail.current) {
      const wag = walking || chase ? Math.sin(phase.current * 0.85) * 0.16 : Math.sin(phase.current * 0.35) * 0.05;
      tail.current.rotation.y = wag;
      tail.current.rotation.z = wag * 0.25;
    }
  });

  const s = kind === "nag" ? 2.15 : boss ? 1.72 : 1.5;
  const royal = kind === "nag" || kind === "leftover" || kind === "remainder";
  const { fur, belly, dark, snout, paw, eye } = coat;
  return (
    <group rotation={[0, Math.PI, 0]} scale={[s * 1.2, s * 1.14, s * 1.2]} position={[0, -0.02, 0]}>
      <GroundBlob radius={0.52} opacity={0.34} y={0.04} />
      <group ref={root}>
        <mesh position={[0, 0.92, 0.03]} rotation={[0.1, 0, 0]} castShadow>
          <capsuleGeometry args={[0.24, 0.3, 8, 14]} />
          {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
        </mesh>
        <mesh position={[-0.09, 1.06, 0.14]} scale={[1.05, 0.72, 0.82]} castShadow>
          <sphereGeometry args={[0.11, 8, 6]} />
          {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
        </mesh>
        <mesh position={[0.09, 1.06, 0.14]} scale={[1.05, 0.72, 0.82]} castShadow>
          <sphereGeometry args={[0.11, 8, 6]} />
          {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
        </mesh>
        <mesh position={[0, 0.88, 0.14]} rotation={[0.12, 0, 0]} castShadow>
          <capsuleGeometry args={[0.17, 0.22, 4, 8]} />
          {lamb(belly)}
        </mesh>
        <mesh position={[-0.22, 1.14, 0.02]} rotation={[0.08, 0, 0.45]} castShadow>
          <sphereGeometry args={[0.13, 10, 8]} />
          {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
        </mesh>
        <mesh position={[0.22, 1.14, 0.02]} rotation={[0.08, 0, -0.45]} castShadow>
          <sphereGeometry args={[0.13, 10, 8]} />
          {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
        </mesh>
        <mesh position={[0, 1.26, 0.05]} rotation={[0.22, 0, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.18, 6, 10]} />
          {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
        </mesh>
        {coat.scaled ? <ScaleUs color={dark} /> : null}
        <HideMarks color={dark} />
        {winged ? (
          <>
            <mesh position={[-0.16, 1.22, -0.02]} rotation={[0.1, 0, 0.4]} castShadow>
              <capsuleGeometry args={[0.06, 0.12, 3, 6]} />
              {lamb("#3a3228")}
            </mesh>
            <mesh position={[0.16, 1.22, -0.02]} rotation={[0.1, 0, -0.4]} castShadow>
              <capsuleGeometry args={[0.06, 0.12, 3, 6]} />
              {lamb("#3a3228")}
            </mesh>
            <BatWing side={-1} membrane={royal ? "#1a2810" : "#1a2e18"} bone="#2a2018" flap={wingL} />
            <BatWing side={1} membrane={royal ? "#1a2810" : "#1a2e18"} bone="#2a2018" flap={wingR} />
          </>
        ) : null}
        {royal ? (
          <mesh position={[0, 0.92, -0.28]} rotation={[0.42, 0, 0]} castShadow>
            <boxGeometry args={[0.62, 0.85, 0.05]} />
            {lamb("#6a5018")}
          </mesh>
        ) : null}
        <group ref={head} position={[0, 1.52, 0.08]}>
          <mesh castShadow>
            <sphereGeometry args={[royal ? 0.18 : 0.155, 12, 10]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0, royal ? -0.04 : -0.02, royal ? 0.32 : 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[royal ? 0.09 : 0.07, royal ? 0.34 : 0.16, 4, 8]} />
            {lamb(snout)}
          </mesh>
          <mesh position={[0, royal ? -0.08 : -0.06, royal ? 0.38 : 0.22]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[royal ? 0.05 : 0.045, royal ? 0.22 : 0.12, 3, 6]} />
            {lamb(dark)}
          </mesh>
          {[-1, 1].map((sd) => (
            <mesh key={`f${sd}`} position={[sd * 0.045, royal ? -0.1 : -0.08, royal ? 0.52 : 0.3]} rotation={[Math.PI * 0.92, 0, sd * 0.2]} castShadow>
              <coneGeometry args={[0.016, royal ? 0.12 : 0.09, 6]} />
              {lamb("#f4eee6")}
            </mesh>
          ))}
          {[-1, 1].map((sd) => (
            <group key={`e${sd}`} position={[sd * (royal ? 0.11 : 0.09), 0.04, royal ? 0.08 : 0.11]}>
              <mesh>
                <sphereGeometry args={[royal ? 0.052 : 0.045, 8, 6]} />
                {lamb("#f4f8c8")}
              </mesh>
              <mesh position={[0, 0, 0.022]}>
                <sphereGeometry args={[royal ? 0.026 : 0.022, 8, 6]} />
                {lamb(eye, { emissive: eye, emit: royal ? 0.95 : 0.6 })}
              </mesh>
            </group>
          ))}
          <mesh position={[-0.08, 0.14, -0.04]} rotation={[-0.4, 0, 0.3]} castShadow>
            <coneGeometry args={[0.028, 0.1, 6]} />
            {lamb(dark)}
          </mesh>
          <mesh position={[0.08, 0.14, -0.04]} rotation={[-0.4, 0, -0.3]} castShadow>
            <coneGeometry args={[0.028, 0.1, 6]} />
            {lamb(dark)}
          </mesh>
          {royal ? (
            <group position={[0, 0.16, -0.04]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.13, 0.14, 0.09, 8]} />
                {lamb("#c9a227")}
              </mesh>
              {[-1, 0, 1].map((i) => (
                <mesh key={`c${i}`} position={[i * 0.08, 0.1, 0.02]} castShadow>
                  <coneGeometry args={[0.032, 0.14, 5]} />
                  {lamb("#e8d48a")}
                </mesh>
              ))}
            </group>
          ) : null}
          {coat.scaled ? (
            <group position={[0, 0.18, -0.04]}>
              {[0, 1, 2, 3, 4].map((i) => (
                <mesh key={i} position={[0, 0.08 + i * 0.07, -0.04 - i * 0.02]} rotation={[-0.55, 0, 0]} castShadow>
                  <coneGeometry args={[0.045 - i * 0.005, 0.16 - i * 0.012, 5]} />
                  {lamb(i % 2 ? "#e07030" : "#c45c28", { kind: "scale" })}
                </mesh>
              ))}
            </group>
          ) : null}
          <group ref={tongue} visible={false} position={[0, -0.08, royal ? 0.48 : 0.32]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.018, 0.14, 6]} />
              {lamb("#c45c58")}
            </mesh>
          </group>
        </group>
        <group ref={lArm} position={[-0.28, 1.1, 0.02]}>
          <mesh position={[0, -0.1, 0.03]} scale={[1.15, 0.7, 1.05]} castShadow>
            <sphereGeometry args={[0.078, 8, 6]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0, -0.24, 0.02]} rotation={[0.15, 0, 0.18]} castShadow>
            <capsuleGeometry args={[0.068, 0.28, 6, 10]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0, -0.5, 0.06]} castShadow>
            <sphereGeometry args={[0.068, 8, 6]} />
            {lamb(paw)}
          </mesh>
          {[-0.03, 0.03].map((x) => (
            <mesh key={`lc${x}`} position={[x, -0.56, 0.1]} rotation={[1.2, 0, 0]}>
              <coneGeometry args={[0.012, 0.06, 5]} />
              {lamb("#e8e0d4")}
            </mesh>
          ))}
        </group>
        <group ref={rArm} position={[0.28, 1.1, 0.02]}>
          <mesh position={[0, -0.1, 0.03]} scale={[1.15, 0.7, 1.05]} castShadow>
            <sphereGeometry args={[0.078, 8, 6]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0, -0.24, 0.02]} rotation={[0.15, 0, -0.18]} castShadow>
            <capsuleGeometry args={[0.068, 0.28, 6, 10]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0, -0.5, 0.06]} castShadow>
            <sphereGeometry args={[0.068, 8, 6]} />
            {lamb(paw)}
          </mesh>
          {[-0.03, 0.03].map((x) => (
            <mesh key={`rc${x}`} position={[x, -0.56, 0.1]} rotation={[1.2, 0, 0]}>
              <coneGeometry args={[0.012, 0.06, 5]} />
              {lamb("#e8e0d4")}
            </mesh>
          ))}
          <group ref={spear} visible={false} position={[0.08, -0.18, 0.04]} rotation={[0.08, 0, 0.06]}>
            <mesh position={[0, 0.55, 0]} castShadow>
              <cylinderGeometry args={[0.022, 0.028, 1.25, 6]} />
              {lamb("#5a3d24")}
            </mesh>
            <mesh position={[0, 1.22, 0]} rotation={[Math.PI, 0, 0]} castShadow>
              <coneGeometry args={[0.05, 0.2, 5]} />
              {lamb("#c8d0d4")}
            </mesh>
          </group>
          <group ref={blade} visible={false} position={[0.04, -0.48, 0.1]} rotation={[1.22, 0.12, -0.18]}>
            <mesh position={[0, 0.06, 0]} castShadow>
              <cylinderGeometry args={[0.022, 0.028, 0.12, 6]} />
              {lamb("#3a2818")}
            </mesh>
            <mesh position={[0, 0.14, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <boxGeometry args={[0.16, 0.028, 0.03]} />
              {lamb("#8a8070")}
            </mesh>
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.04, 0.72, 0.012]} />
              {lamb("#c8d0d8")}
            </mesh>
          </group>
        </group>
        <group ref={lLeg} position={[-0.14, 0.56, 0.04]}>
          <mesh position={[0, -0.12, 0.06]} scale={[1.2, 0.75, 1.1]} castShadow>
            <sphereGeometry args={[0.085, 8, 6]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0, -0.28, 0.04]} rotation={[0.12, 0, 0]} castShadow>
            <capsuleGeometry args={[0.074, 0.32, 6, 10]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0, -0.54, 0.1]} scale={[1.15, 0.55, 1.35]} castShadow>
            <sphereGeometry args={[0.072, 8, 6]} />
            {lamb(paw)}
          </mesh>
        </group>
        <group ref={rLeg} position={[0.14, 0.56, 0.04]}>
          <mesh position={[0, -0.12, 0.06]} scale={[1.2, 0.75, 1.1]} castShadow>
            <sphereGeometry args={[0.085, 8, 6]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0, -0.28, 0.04]} rotation={[0.12, 0, 0]} castShadow>
            <capsuleGeometry args={[0.074, 0.32, 6, 10]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0, -0.54, 0.1]} scale={[1.15, 0.55, 1.35]} castShadow>
            <sphereGeometry args={[0.072, 8, 6]} />
            {lamb(paw)}
          </mesh>
        </group>
        <SlimTail fur={fur} dark={dark} long={winged} sway={tail} />
      </group>
    </group>
  );
}

export function treeKey(x: number, z: number) {
  return `${x.toFixed(2)},${z.toFixed(2)}`;
}

export const fallenTrees = new Set<string>();
export const treeChops = new Map<string, number>();

export type AppleDrop = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  grounded: boolean;
  taken: boolean;
};
export const dropApples: AppleDrop[] = [];

const orchard = vWorld(-24.2, -80.8);
export const ORCHARD_TREE: TreeSpot = { x: orchard.x, z: orchard.z, s: 1.85, r: 0.2, h: 1.45 };

export const APPLE_SPOTS: TreeSpot[] = [ORCHARD_TREE, ...TREES.filter((_, i) => i % 6 === 2).slice(0, 22)];
export const APPLE_KEYS = new Set(APPLE_SPOTS.map((t) => treeKey(t.x, t.z)));
const JACKPOT = APPLE_SPOTS[11] ? treeKey(APPLE_SPOTS[11].x, APPLE_SPOTS[11].z) : "";

const appleStock = new Map<string, number>();
const appleReady = new Map<string, number>();

export function applesLeft(k: string) {
  const until = appleReady.get(k) ?? 0;
  if (until > performance.now()) return 0;
  if (appleStock.has(k)) return appleStock.get(k)!;
  return k === JACKPOT ? 30 : 2;
}

export function shakeAppleTree(k: string, x: number, z: number) {
  const n = applesLeft(k);
  if (n <= 0) return;
  const drop = k === JACKPOT ? n : Math.min(n, 1 + Math.floor(Math.random() * 2));
  const y = heightAt(x, z);
  for (let i = 0; i < drop; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.55 + Math.random() * 0.85;
    dropApples.push({
      x: x + Math.cos(a) * r,
      y: y + 5.2 + Math.random() * 1.2,
      z: z + Math.sin(a) * r,
      vx: Math.cos(a) * (1.1 + Math.random()),
      vy: 0.4,
      vz: Math.sin(a) * (1.1 + Math.random()),
      grounded: false,
      taken: false,
    });
  }
  appleStock.set(k, 0);
  appleReady.set(k, performance.now() + 42000);
  sfx.rustle();
}

const TRUNK_GEO = (() => {
  const pts = [0.22, 0, 0.2, 0.2, 0.18, 0.55, 0.16, 1, 0.14, 1.35].reduce<THREE.Vector2[]>((a, v, i, src) => {
    if (i % 2 === 0) a.push(new THREE.Vector2(v, src[i + 1]!));
    return a;
  }, []);
  return new THREE.LatheGeometry(pts, 14);
})();
const CROWN_GEO = new THREE.IcosahedronGeometry(1, 1);
const ROCK_GEO = (() => {
  const g = new THREE.DodecahedronGeometry(0.62, 0);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = 1 + Math.sin(x * 7.1 + z * 5.3) * 0.08 + Math.cos(y * 6.2) * 0.05;
    pos.setXYZ(i, x * n, y * n * 0.78, z * n);
  }
  g.computeVertexNormals();
  return g;
})();

function TreeApples({ k, y, s }: { k: string; y: number; s: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = applesLeft(k) > 0;
  });
  const n = 11;
  return (
    <group ref={g}>
      {Array.from({ length: n }, (_, i) => {
        const a = i * 2.15 + s;
        const r = (0.72 + (i % 3) * 0.22) * s;
        const py = y + ((i % 4) * 0.18 - 0.22) * s;
        return (
          <mesh key={i} position={[Math.cos(a) * r, py, Math.sin(a) * r]} castShadow>
            <sphereGeometry args={[0.11 * Math.min(1.35, s), 8, 6]} />
            {lamb(i % 2 ? "#c43c32" : "#d45438")}
          </mesh>
        );
      })}
    </group>
  );
}

function SculptTree({ t, leaf }: { t: TreeSpot; leaf: string }) {
  const k = treeKey(t.x, t.z);
  const down = fallenTrees.has(k);
  const dent = treeChops.get(k) ?? 0;
  const y = heightAt(t.x, t.z);
  const apple = APPLE_KEYS.has(k);
  const grow = apple ? 2.15 : 1.55;
  const h = 3.4 * t.s * t.h * grow;
  return (
    <group position={[t.x, y - 0.22, t.z]} rotation={[down ? 1.42 : 0, t.r, down ? 0.18 : 0]}>
      <mesh geometry={TRUNK_GEO} scale={[t.s * 1.15, h, t.s * 1.15]}>
        {lamb(dent >= 2 ? "#4a3220" : "#5a3d24")}
      </mesh>
      <mesh geometry={CROWN_GEO} position={[0, h * 0.92, 0]} scale={[1.7 * t.s * grow, 1.35 * t.s * t.h * grow, 1.65 * t.s * grow]}>
        {lamb(leaf)}
      </mesh>
      <mesh geometry={CROWN_GEO} position={[0.4 * t.s * grow, h * 0.78, 0.18 * t.s * grow]} scale={[0.95 * t.s * grow, 0.85 * t.s * grow, 1.0 * t.s * grow]}>
        {lamb(leaf)}
      </mesh>
      {apple && !down ? <TreeApples k={k} y={h * 0.88} s={t.s * grow} /> : null}
    </group>
  );
}

export function N64Grove({ denser, leaf, skipValley }: { denser: boolean; leaf: string; skipValley?: boolean }) {
  const spots = useMemo(() => {
    let list = denser ? TREES : TREES.filter((_, i) => i % 3 === 0);
    if (skipValley) list = list.filter((t) => t.z < -250 || t.z > 110 || Math.abs(t.x) > 210);
    return list.slice(0, denser ? 48 : 28);
  }, [denser, skipValley]);
  const [rev, setRev] = useState(0);
  const last = useRef(0);
  useFrame(() => {
    let n = fallenTrees.size;
    for (const v of treeChops.values()) n += v;
    if (n !== last.current) {
      last.current = n;
      setRev(n);
    }
  });
  return (
    <group>
      {spots.map((t, i) => (
        <SculptTree key={`${i}-${rev}`} t={t} leaf={leaf} />
      ))}
      <FallingLeaves leaf={leaf} />
    </group>
  );
}

function FallingLeaves({ leaf }: { leaf: string }) {
  const g = useRef<THREE.Group>(null);
  const bits = useRef(
    Array.from({ length: 6 }, (_, i) => {
      const t = TREES[i * 3] ?? TREES[i] ?? { x: 0, z: 0 };
      return {
        x: t.x + (Math.random() - 0.5) * 4,
        y: heightAt(t.x, t.z) + 4 + Math.random() * 3,
        z: t.z + (Math.random() - 0.5) * 4,
        s: 0.08 + Math.random() * 0.06,
        spin: Math.random() * 6,
      };
    }),
  );
  useFrame((_, dt) => {
    if (!g.current || live.house || live.cave) return;
    const rain = live.rainT > 0 ? 2.4 : 1;
    bits.current.forEach((b, i) => {
      b.y -= dt * (0.85 * rain);
      b.x += Math.sin(b.spin + b.y) * dt * 0.45;
      b.z += Math.cos(b.spin * 0.7) * dt * 0.3;
      b.spin += dt * 2.4;
      const floor = heightAt(b.x, b.z) + 0.04;
      if (b.y <= floor) {
        const t = TREES[(i * 5 + (live.dayCycle % 9)) % TREES.length] ?? TREES[0]!;
        b.x = t.x + (Math.random() - 0.5) * 5;
        b.z = t.z + (Math.random() - 0.5) * 5;
        b.y = heightAt(b.x, b.z) + 5.2 + Math.random() * 2.4;
      }
      const c = g.current!.children[i];
      if (c) {
        c.position.set(b.x, b.y, b.z);
        c.rotation.set(b.spin, b.spin * 0.7, b.spin * 0.4);
      }
      if (Math.hypot(live.x - b.x, live.z - b.z) < 0.55 && Math.abs(live.y - b.y) < 0.7 && !live.sit) {
        const t = TREES[(i * 3) % TREES.length] ?? TREES[0]!;
        b.x = t.x;
        b.z = t.z;
        b.y = heightAt(t.x, t.z) + 6;
        live.leafN += 1;
        sfx.rustle();
        if (live.leafN === 8 && !live.smashed.leaves) {
          live.smashed.leaves = true;
          const n = useGame.getState().addCoins(10);
          if (n > 0) revealItem("coin");
          live.hint = "Eight leaves. You caught the wind.";
          sfx.chime();
        } else live.hint = live.leafN === 1 ? "A falling leaf." : `${live.leafN} leaves.`;
      }
    });
  });
  return (
    <group ref={g}>
      {bits.current.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]}>
          <planeGeometry args={[b.s * 2.2, b.s * 1.4]} />
          <meshLambertMaterial color={i % 3 ? leaf : "#c45c48"} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

export function N64Rocks() {
  const [n, setN] = useState(0);
  useFrame(() => {
    if (blownRocks.size !== n) setN(blownRocks.size);
  });
  const spots = useMemo(() => ROCKS.filter((_, i) => i % 3 === 0).slice(0, 36), []);
  return (
    <group>
      {spots.map((r, i) => {
        if (rockGone(r.x, r.z)) return null;
        const y = heightAt(r.x, r.z);
        const big = r.s >= 1.1;
        return (
          <mesh
            key={i}
            geometry={ROCK_GEO}
            position={[r.x, y + (big ? 0.42 : 0.16) * r.s, r.z]}
            rotation={[0.15, r.r, 0.08]}
            scale={[r.s * (big ? 1.35 : 0.72), r.s * (big ? 1.05 : 0.55), r.s * (big ? 1.28 : 0.7)]}
          >
            {lamb(i % 3 === 0 ? "#8a8680" : i % 3 === 1 ? "#7a7468" : "#6a6860")}
          </mesh>
        );
      })}
    </group>
  );
}

export function N64Nag({ laugh, seed = 0 }: { laugh?: boolean; seed?: number }) {
  return <N64Foe kind="nag" seed={seed} pose={laugh ? "yell" : "idle"} world="grove" />;
}
