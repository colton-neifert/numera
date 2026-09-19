import { useMemo, useRef, useState, type MutableRefObject, type RefObject } from "react";
import { useEasedJoints } from "./lush/motion";
import { LizardArm, LizardHead, LizardKit, LizardLeg, LizardSpear, LizardTail, LizardTorso } from "./lush/lizard";
import { LushTree } from "./lush/trees";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, ROCKS, TREES, vWorld, rockGone, blownRocks, type TreeSpot } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";

import { lamb as stdLamb, GroundBlob, type MatKind } from "./mats";

function lamb(color: string, opts?: { emissive?: string; emit?: number; flat?: boolean; map?: THREE.Texture | null; kind?: MatKind }) {
  return stdLamb(color, { ...opts, rim: true, kind: opts?.kind ?? (opts?.flat ? "scale" : "default") });
}

export type FighterAct = "idle" | "hop" | "slam" | "hurt";
export type FangPose = "walk" | "idle" | "yell" | "hiss" | "chase" | "gallop" | "swipe" | "guard" | "sit" | "lean" | "carry";
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
    return { fur: "#9a9388", belly: "#d6cfc4", dark: "#3e3a34", shade: "#6a645c", snout: "#cfc6ba", paw: "#2e2c28", eye: "#ff2a28", scaled: false };
  }
  if (kind === "driplet" || world === "marsh" || world === "fen" || world === "lake") {
    return { fur: "#2e6e5c", belly: "#d0c490", dark: "#142e28", shade: "#1e4a3c", snout: "#3e7e6c", paw: "#245848", eye: "#88e0c8", scaled: true };
  }
  if (kind === "emberling" || world === "crater" || world === "hollow") {
    return { fur: "#8a4830", belly: "#d0b080", dark: "#4a2018", shade: "#7a3828", snout: "#9a5840", paw: "#7a3820", eye: "#e07040", scaled: true };
  }
  // Vale raider: olive hide barred with near-black, bone-tan belly plates, ember eyes.
  return { fur: "#4a7a36", belly: "#c9bd84", dark: "#17291a", shade: "#2a4c26", snout: "#557f3a", paw: "#2f5a2b", eye: "#ffa51a", scaled };
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

const TUFT_GEO = (() => {
  const g = new THREE.ConeGeometry(1, 1, 4);
  g.translate(0, 0.5, 0);
  return g;
})();

type TuftBit = { p: [number, number, number]; q: [number, number, number, number]; s: [number, number, number]; c: string };

function tuftBits(
  samples: { x: number; y: number; z: number; nx: number; ny: number; nz: number; h: number; w: number; col: string }[],
) {
  const up = new THREE.Vector3(0, 1, 0);
  const n = new THREE.Vector3();
  const q = new THREE.Quaternion();
  return samples.map((s) => {
    n.set(s.nx, s.ny, s.nz).normalize();
    q.setFromUnitVectors(up, n);
    return { p: [s.x, s.y, s.z] as [number, number, number], q: q.toArray() as [number, number, number, number], s: [s.w, s.h, s.w * 0.42] as [number, number, number], c: s.col };
  });
}

function FurTufts({ bits }: { bits: TuftBit[] }) {
  return (
    <group>
      {bits.map((t, i) => (
        <mesh key={i} geometry={TUFT_GEO} position={t.p} quaternion={t.q} scale={t.s} castShadow>
          {lamb(t.c, { kind: "wool" })}
        </mesh>
      ))}
    </group>
  );
}

function WolfTail({
  fur,
  dark,
  shade,
  sway,
}: {
  fur: string;
  dark: string;
  shade: string;
  sway: RefObject<THREE.Group | null>;
}) {
  const bits = useMemo(() => {
    const samples: { x: number; y: number; z: number; nx: number; ny: number; nz: number; h: number; w: number; col: string }[] = [];
    const cols = [fur, shade, dark, fur, shade];
    for (let i = 0; i < 7; i++) {
      const u = i / 6;
      const y = -0.08 - u * 0.82;
      const r = 0.12 * (1 - u * 0.55);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + i * 0.31;
        const x = Math.sin(a) * r;
        const z = Math.cos(a) * r * 0.85;
        samples.push({
          x,
          y,
          z,
          nx: Math.sin(a) * 0.85,
          ny: -0.35 - u * 0.2,
          nz: Math.cos(a) * 0.85,
          h: 0.14 + (1 - u) * 0.08 + (k % 3) * 0.02,
          w: 0.05 + (k % 2) * 0.012,
          col: cols[(i + k) % cols.length]!,
        });
      }
    }
    return tuftBits(samples);
  }, [fur, dark, shade]);
  return (
    <group ref={sway} position={[0, 0.78, -0.28]} rotation={[1.05, 0, 0]}>
      <mesh position={[0, -0.38, 0]} rotation={[0.08, 0, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.72, 5, 8]} />
        {lamb(fur, { kind: "wool" })}
      </mesh>
      <mesh position={[0, -0.78, -0.02]} scale={[0.85, 1.15, 0.9]} castShadow>
        <sphereGeometry args={[0.055, 7, 6]} />
        {lamb(shade, { kind: "wool" })}
      </mesh>
      <FurTufts bits={bits} />
    </group>
  );
}

function WolfFur({ fur, dark, shade }: { fur: string; dark: string; shade: string }) {
  const bits = useMemo(() => {
    const samples: { x: number; y: number; z: number; nx: number; ny: number; nz: number; h: number; w: number; col: string }[] = [];
    const cols = [fur, shade, dark, fur, shade, fur];
    const push = (
      x: number,
      y: number,
      z: number,
      nx: number,
      ny: number,
      nz: number,
      h: number,
      w: number,
      col: string,
    ) => samples.push({ x, y, z, nx, ny, nz, h, w, col });
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + 0.11;
      const y = 1.28 + Math.sin(i * 1.9) * 0.05;
      const r = 0.27 + (i % 4) * 0.018;
      push(Math.sin(a) * r, y, Math.cos(a) * r * 0.78, Math.sin(a), 0.55 + (i % 5) * 0.08, Math.cos(a), 0.15 + (i % 4) * 0.035, 0.048 + (i % 3) * 0.01, cols[i % cols.length]!);
    }
    for (let i = 0; i < 10; i++) {
      const u = i / 9;
      push((i % 2 ? -1 : 1) * 0.04, 1.18 - u * 0.42, -0.22 - u * 0.04, 0, 0.2, -1, 0.16 + (1 - u) * 0.06, 0.055, i % 2 ? dark : shade);
    }
    for (const sd of [-1, 1]) {
      push(sd * 0.24, 1.14, 0.08, sd, 0.4, 0.35, 0.16, 0.055, fur);
      push(sd * 0.22, 1.04, 0.16, sd * 0.7, 0.15, 0.7, 0.14, 0.05, shade);
      push(sd * 0.2, 0.94, -0.12, sd * 0.5, 0.1, -0.8, 0.15, 0.05, dark);
      push(sd * 0.18, 0.82, 0.1, sd, 0.05, 0.4, 0.12, 0.045, fur);
    }
    for (let i = 0; i < 8; i++) {
      const a = -0.8 + (i / 7) * 1.6;
      push(Math.sin(a) * 0.16, 1.34, 0.1 + Math.cos(a) * 0.08, Math.sin(a) * 0.4, 1, 0.2, 0.11 + (i % 3) * 0.02, 0.04, i % 2 ? shade : fur);
    }
    return tuftBits(samples);
  }, [fur, dark, shade]);
  return <FurTufts bits={bits} />;
}

function BackSpikes({ color, tip }: { color: string; tip: string }) {
  const ridge = [
    { y: 1.14, z: -0.16, r: 0.034, h: 0.16, tilt: -1.05 },
    { y: 1.04, z: -0.20, r: 0.048, h: 0.26, tilt: -1.14 },
    { y: 0.92, z: -0.24, r: 0.064, h: 0.36, tilt: -1.22 },
    { y: 0.80, z: -0.26, r: 0.070, h: 0.40, tilt: -1.28 },
    { y: 0.68, z: -0.24, r: 0.056, h: 0.30, tilt: -1.34 },
    { y: 0.58, z: -0.20, r: 0.040, h: 0.20, tilt: -1.40 },
  ];
  return (
    <group>
      {ridge.map((s, i) => {
        const along = s.h * 0.42;
        return (
          <mesh
            key={i}
            position={[0, s.y + Math.cos(s.tilt) * along, s.z + Math.sin(s.tilt) * along]}
            rotation={[s.tilt, 0, 0]}
            castShadow
          >
            <coneGeometry args={[s.r, s.h, 5]} />
            {lamb(i % 2 ? tip : color, { kind: "scale" })}
          </mesh>
        );
      })}
    </group>
  );
}

function FangInk({ seed }: { seed: number }) {
  const mark = seed % 4;
  if (mark === 3) return null;
  const ink = "#1a2414";
  return (
    <group>
      {mark === 0 || mark === 2 ? (
        <group position={[0, 0.96, 0.28]} rotation={[0.2, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.055, 8, 6]} />
            {lamb(ink)}
          </mesh>
          {[-0.018, 0.018].map((x) => (
            <mesh key={x} position={[x, 0.01, 0.03]}>
              <sphereGeometry args={[0.012, 6, 5]} />
              {lamb("#0c100c")}
            </mesh>
          ))}
          <mesh position={[0, -0.028, 0.02]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.05, 0.016, 0.01]} />
            {lamb("#0c100c")}
          </mesh>
        </group>
      ) : null}
      {mark === 1 || mark === 2 ? (
        <group position={[0.22, 1.02, 0.12]} rotation={[0.2, 0.6, 0.4]}>
          <mesh rotation={[0.4, 0.2, 0.8]}>
            <capsuleGeometry args={[0.012, 0.16, 3, 6]} />
            {lamb(ink)}
          </mesh>
          <mesh position={[0.04, -0.08, 0.02]} rotation={[-0.6, 0.3, 0.4]}>
            <capsuleGeometry args={[0.01, 0.1, 3, 6]} />
            {lamb(ink)}
          </mesh>
          <mesh position={[0.07, -0.14, 0.03]}>
            <sphereGeometry args={[0.016, 6, 5]} />
            {lamb(ink)}
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

function DragonWing({
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
  const sail = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.02);
    s.lineTo(0.42, 0.22);
    s.lineTo(0.92, 0.12);
    s.lineTo(1.38, -0.08);
    s.lineTo(1.62, -0.28);
    s.quadraticCurveTo(1.28, -0.62, 0.98, -0.58);
    s.quadraticCurveTo(0.7, -0.42, 0.48, -0.7);
    s.quadraticCurveTo(0.22, -0.48, 0.08, -0.55);
    s.quadraticCurveTo(0.02, -0.22, 0, -0.04);
    s.closePath();
    const g = new THREE.ShapeGeometry(s, 8);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group ref={flap} position={[side * 0.2, 1.22, -0.18]} rotation={[0.12, side * 0.22, side * 0.55]}>
      <mesh geometry={sail} scale={[side, 1, 1]} position={[0, 0, 0.01]} castShadow>
        <meshLambertMaterial color={membrane} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[side * 0.55, 0.08, 0]} rotation={[0.15, 0, side * 1.05]} castShadow>
        <cylinderGeometry args={[0.018, 0.038, 1.12, 6]} />
        {lamb(bone)}
      </mesh>
      <mesh position={[side * 0.72, -0.18, 0.02]} rotation={[0.85, 0, side * 0.55]} castShadow>
        <cylinderGeometry args={[0.012, 0.022, 0.72, 5]} />
        {lamb(bone)}
      </mesh>
      <mesh position={[side * 1.05, -0.08, 0.02]} rotation={[0.55, 0, side * 0.85]} castShadow>
        <cylinderGeometry args={[0.012, 0.02, 0.82, 5]} />
        {lamb(bone)}
      </mesh>
      <mesh position={[side * 1.32, -0.22, 0.02]} rotation={[0.95, 0, side * 0.35]} castShadow>
        <cylinderGeometry args={[0.01, 0.016, 0.62, 5]} />
        {lamb(bone)}
      </mesh>
      <mesh position={[side * 1.58, -0.28, 0.01]} rotation={[0.2, 0, side * 0.4]} castShadow>
        <coneGeometry args={[0.022, 0.1, 5]} />
        {lamb("#d8d0c4")}
      </mesh>
    </group>
  );
}

function KingMantle() {
  return (
    <group position={[0, 1.2, -0.06]} rotation={[0.48, 0, 0]}>
      <mesh position={[0, -0.38, -0.08]} castShadow>
        <coneGeometry args={[0.46, 1.02, 8, 1, true]} />
        {lamb("#163018", { kind: "cloth" })}
      </mesh>
      <mesh position={[0, -0.52, -0.12]} rotation={[0.08, 0, 0]} castShadow>
        <coneGeometry args={[0.38, 0.72, 8, 1, true]} />
        {lamb("#1e4020", { kind: "cloth" })}
      </mesh>
      <mesh position={[0, 0.02, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.035, 6, 12]} />
        {lamb("#c9a227")}
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
  poseRef,
  side = 1,
}: {
  kind: string;
  seed?: number;
  act?: FighterAct;
  world?: string;
  pose?: FangPose;
  poseRef?: MutableRefObject<FangPose>;
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
  const flyH = useRef(0);
  const blob = useRef<THREE.Group>(null);
  const boss = kind === "leftover" || kind === "warden";
  const winged = kind === "nag" || kind === "leftover" || kind === "remainder";
  const coat = coatOf(kind, world);
  const wolf = !coat.scaled;
  const guard = pose === "guard";
  const arm = fangArm(kind, seed, guard);

  useFrame((_, dt) => {
    const now = poseRef?.current ?? pose;
    const flying = winged && (now === "walk" || now === "chase" || now === "gallop" || now === "carry");
    phase.current += dt * (now === "carry" ? 18.2 : flying ? 16.5 : now === "yell" ? 8.4 : now === "chase" || now === "swipe" ? 9.2 : now === "walk" ? 5.4 : 1.6);
    const breath = Math.sin(phase.current) * 0.035;
    const swing = Math.sin(phase.current);
    const hop = act === "hop";
    const slam = act === "slam";
    const hurt = act === "hurt";
    const sit = now === "sit";
    const lean = now === "lean";
    const hiss = now === "hiss" || now === "yell";
    const swipe = now === "swipe";
    const chase = now === "chase";
    const walking = now === "walk";
    hopY.current += ((hop ? 0.55 : slam ? 0 : hurt ? 0.08 : 0) - hopY.current) * (1 - Math.exp(-dt * (slam ? 18 : 9)));
    flyH.current += ((flying ? 0.92 : 0) - flyH.current) * (1 - Math.exp(-dt * 4.2));
    if (blob.current) blob.current.visible = flyH.current < 0.18;

    if (spear.current) spear.current.visible = arm === "spear";
    if (blade.current) blade.current.visible = arm === "sword" && now !== "sit";
    if (lLeg.current) lLeg.current.position.set(-0.18, sit ? 0.62 : 0.80, sit ? 0.16 : 0.04);
    if (rLeg.current) rLeg.current.position.set(0.18, sit ? 0.62 : 0.80, sit ? 0.16 : 0.04);

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
    } else if (now === "carry") {
      const beat = Math.sin(phase.current);
      if (lLeg.current) lLeg.current.rotation.set(1.05 + beat * 0.06, 0.12, 0.2);
      if (rLeg.current) rLeg.current.rotation.set(1.12 - beat * 0.06, -0.12, -0.2);
      if (lArm.current) lArm.current.rotation.set(1.18 + beat * 0.06, 0.62, 0.12);
      if (rArm.current) rArm.current.rotation.set(1.18 - beat * 0.06, -0.62, -0.12);
      if (head.current) head.current.rotation.set(0.42, 0, 0);
    } else if (flying) {
      const beat = Math.sin(phase.current);
      if (lLeg.current) lLeg.current.rotation.set(0.95 + beat * 0.08, 0.1, 0.22);
      if (rLeg.current) rLeg.current.rotation.set(1.05 - beat * 0.08, -0.1, -0.22);
      if (lArm.current) lArm.current.rotation.set(-0.55 + beat * 0.12, 0.15, 0.85);
      if (rArm.current) rArm.current.rotation.set(-0.55 - beat * 0.12, -0.15, -0.85);
      if (head.current) head.current.rotation.set(0.18, 0, 0);
    } else if (hiss) {
      swipeU.current = 0;
      if (lLeg.current) lLeg.current.rotation.x = 0.35;
      if (rLeg.current) rLeg.current.rotation.x = 0.55;
      if (lArm.current) lArm.current.rotation.set(-0.35, 0, 0.45);
      if (rArm.current) rArm.current.rotation.set(0.95, -0.55, -0.65);
      if (head.current) head.current.rotation.set(now === "yell" ? -0.28 : 0.18, 0, 0);
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
      if (lLeg.current) lLeg.current.rotation.set(-swing * 0.55, 0, 0);
      if (rLeg.current) rLeg.current.rotation.set(swing * 0.55, 0, 0);
      if (lArm.current) lArm.current.rotation.set(swing * 0.5 - 0.35, 0, 0.35);
      if (rArm.current) rArm.current.rotation.set(-swing * 0.5 - 0.35, 0, -0.35);
    } else if (guard) {
      const stab = live.guardStab;
      if (lLeg.current) lLeg.current.rotation.x = 0.04;
      if (rLeg.current) rLeg.current.rotation.x = 0.08;
      if (lArm.current) lArm.current.rotation.set(0.08, 0, 0.16);
      if (rArm.current) rArm.current.rotation.set(0.1 - stab * 1.05, -0.06 - stab * 0.35 * side, -0.28 + stab * 0.85 * side);
      if (spear.current) spear.current.rotation.set(0.06 + stab * 1.05, 0, 0.04 + stab * 0.7 * side);
    } else {
      if (lLeg.current) lLeg.current.rotation.set(walking ? -swing * 0.32 : hop ? -0.3 : slam ? 0.15 : 0.04, 0, 0);
      if (rLeg.current) rLeg.current.rotation.set(walking ? swing * 0.32 : hop ? -0.3 : slam ? 0.15 : 0.04, 0, 0);
      if (lArm.current) lArm.current.rotation.set(slam ? -2.35 : hop ? -1.2 : walking ? swing * 0.35 : 0.08 + breath, 0, 0.55);
      if (rArm.current) rArm.current.rotation.set(slam ? -2.35 : hop ? -1.2 : walking ? -swing * 0.35 : 0.08 + breath, 0, -0.55);
      if (head.current) head.current.rotation.set(walking ? 0.06 : breath * 0.4, 0, 0);
    }

    flick.current -= dt;
    if (tongue.current) {
      if (wolf) {
        tongue.current.visible = false;
      } else {
        if (flick.current <= 0 && Math.random() < dt * 0.35) flick.current = 0.14;
        const show = flick.current > 0;
        tongue.current.visible = show;
        if (show) {
          tongue.current.rotation.y = Math.sin(flick.current * 92) * 0.85;
          tongue.current.position.z = 0.42 + (0.14 - flick.current) * 0.55;
        }
      }
    }
    if (root.current) {
      const plant = !flying && (walking || chase) ? Math.abs(swing) * (chase ? 0.045 : 0.028) : 0;
      root.current.position.y = hopY.current + flyH.current - 0.08 - plant;
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
                : now === "carry"
                  ? 0.16
                  : flying
                  ? 0.38 + Math.sin(phase.current * 0.5) * 0.06
                  : now === "yell"
                    ? -0.12
                    : hiss
                      ? 0.22
                      : chase
                        ? wolf
                          ? 0.28
                          : 0.18
                        : walking
                          ? wolf
                            ? 0.12
                            : -0.04
                          : breath * 0.05;
      root.current.rotation.z = lean ? 0.18 : swipe ? swipeU.current * -0.22 : 0;
    }
    if (winged) {
      const flap = flying
        ? Math.sin(phase.current) * 0.62
        : now === "yell"
          ? Math.sin(phase.current) * 0.34
          : Math.sin(phase.current * 0.35) * 0.02;
      if (wingL.current) {
        wingL.current.rotation.z = -0.42 - flap;
        wingL.current.rotation.y = -0.28 - flap * 0.35;
        wingL.current.rotation.x = flying ? -0.18 : 0.05;
      }
      if (wingR.current) {
        wingR.current.rotation.z = 0.42 + flap;
        wingR.current.rotation.y = 0.28 + flap * 0.35;
        wingR.current.rotation.x = flying ? -0.18 : 0.05;
      }
    }
    if (tail.current) {
      const wag = walking || chase ? Math.sin(phase.current * 0.85) * 0.16 : Math.sin(phase.current * 0.35) * 0.05;
      tail.current.rotation.y = wag;
      tail.current.rotation.z = wag * 0.25;
    }
  });

  // Blend between poses; strikes stay sharp.
  useEasedJoints([head, lArm, rArm, lLeg, rLeg, tail], () => {
    const now = poseRef?.current ?? pose;
    return now === "swipe" || now === "chase" || act === "slam" || act === "hurt" ? 34 : 14;
  });
  const royal0 = kind === "nag" || kind === "leftover" || kind === "remainder";
  // Rank-and-file lizards are hero-sized and big-headed; bosses still loom.
  const s = kind === "nag" ? 2.15 : boss ? 1.72 : royal0 ? 1.5 : 1.28;
  const royal = royal0;
  const { fur, belly, dark, shade, snout, paw, eye } = coat;
  return (
    <group rotation={[0, Math.PI, 0]} scale={[s * 1.2, s * 1.14, s * 1.2]} position={[0, -0.04, 0]}>
      <group ref={blob}>
        <GroundBlob radius={0.52} opacity={0.34} y={0.04} />
      </group>
      <group ref={root}>
        {wolf ? (
          <>
        <mesh position={[0, 0.92, 0.03]} rotation={[wolf ? 0.22 : 0.1, 0, 0]} castShadow>
          <capsuleGeometry args={[wolf ? 0.28 : 0.24, wolf ? 0.4 : 0.3, 8, 14]} />
          {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
        </mesh>
        {wolf ? null : (
          <>
            <mesh position={[-0.09, 1.06, 0.14]} scale={[1.05, 0.72, 0.82]} castShadow>
              <sphereGeometry args={[0.11, 16, 12]} />
              {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
            </mesh>
            <mesh position={[0.09, 1.06, 0.14]} scale={[1.05, 0.72, 0.82]} castShadow>
              <sphereGeometry args={[0.11, 16, 12]} />
              {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
            </mesh>
          </>
        )}
        <mesh position={[0, 0.86, 0.16]} rotation={[0.18, 0, 0]} castShadow>
          <capsuleGeometry args={[wolf ? 0.18 : 0.17, wolf ? 0.26 : 0.22, 6, 14]} />
          {lamb(belly, { kind: wolf ? "wool" : undefined })}
        </mesh>
        {wolf ? null : (
          <>
            <mesh position={[-0.22, 1.14, 0.02]} rotation={[0.08, 0, 0.45]} castShadow>
              <sphereGeometry args={[0.13, 16, 12]} />
              {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
            </mesh>
            <mesh position={[0.22, 1.14, 0.02]} rotation={[0.08, 0, -0.45]} castShadow>
              <sphereGeometry args={[0.13, 16, 12]} />
              {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
            </mesh>
          </>
        )}
        <mesh position={[0, 1.26, 0.05]} rotation={[0.22, 0, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.18, 6, 10]} />
          {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
        </mesh>
        {wolf ? <WolfFur fur={fur} dark={dark} shade={shade} /> : <BackSpikes color={belly} tip="#f0e6b8" />}
        {!royal ? <FangInk seed={seed} /> : null}
          </>
        ) : (
          <>
            <LizardTorso coat={coat} seed={seed} />
            {royal ? null : <LizardKit seed={seed} />}
          </>
        )}
        {winged ? (
          <>
            <mesh position={[-0.16, 1.22, -0.02]} rotation={[0.1, 0, 0.4]} castShadow>
              <capsuleGeometry args={[0.06, 0.12, 6, 14]} />
              {lamb("#3a3228")}
            </mesh>
            <mesh position={[0.16, 1.22, -0.02]} rotation={[0.1, 0, -0.4]} castShadow>
              <capsuleGeometry args={[0.06, 0.12, 6, 14]} />
              {lamb("#3a3228")}
            </mesh>
            <DragonWing side={-1} membrane={royal ? "#142410" : "#1a2e18"} bone="#2a2018" flap={wingL} />
            <DragonWing side={1} membrane={royal ? "#142410" : "#1a2e18"} bone="#2a2018" flap={wingR} />
          </>
        ) : null}
        {royal ? <KingMantle /> : null}
        <group ref={head} position={[0, wolf ? 1.48 : 1.56, wolf ? 0.14 : 0.1]}>
          {wolf ? (
            <mesh castShadow>
              <sphereGeometry args={[0.17, 24, 18]} />
              {lamb(fur, { kind: "wool" })}
            </mesh>
          ) : null}
          {wolf ? (
            <>
              <mesh position={[0, -0.01, 0.22]} rotation={[Math.PI / 2 + 0.18, 0, 0]} castShadow>
                <capsuleGeometry args={[0.068, 0.28, 6, 14]} />
                {lamb(snout, { kind: "wool" })}
              </mesh>
              <mesh position={[0, -0.04, 0.26]} rotation={[Math.PI / 2 + 0.18, 0, 0]}>
                <capsuleGeometry args={[0.042, 0.18, 6, 14]} />
                {lamb(belly, { kind: "wool" })}
              </mesh>
              <mesh position={[0, 0.0, 0.46]} scale={[1.15, 0.72, 0.9]} castShadow>
                <sphereGeometry args={[0.042, 16, 12]} />
                {lamb("#1a1410")}
              </mesh>
              {[-1, 1].map((sd) => (
                <group key={`we${sd}`} position={[sd * 0.1, 0.16, -0.06]} rotation={[0.12, sd * 0.22, sd * 0.38]}>
                  <mesh scale={[0.48, 1, 0.22]} castShadow>
                    <coneGeometry args={[0.1, 0.26, 5]} />
                    {lamb(fur, { kind: "wool" })}
                  </mesh>
                  <mesh position={[0, 0.02, 0.018]} scale={[0.28, 0.82, 0.08]}>
                    <coneGeometry args={[0.1, 0.24, 5]} />
                    {lamb("#c4a090")}
                  </mesh>
                  <mesh position={[0, 0.12, 0]} rotation={[0.2, 0, 0]} scale={[0.35, 0.45, 0.18]}>
                    <coneGeometry args={[0.08, 0.1, 4]} />
                    {lamb(shade, { kind: "wool" })}
                  </mesh>
                </group>
              ))}
              {[-1, 1].map((sd) => (
                <mesh key={`chk${sd}`} position={[sd * 0.13, -0.01, 0.08]} scale={[0.95, 0.62, 0.85]} castShadow>
                  <sphereGeometry args={[0.075, 16, 12]} />
                  {lamb(fur, { kind: "wool" })}
                </mesh>
              ))}
              {[-1, 1].map((sd) => (
                <group key={`e${sd}`} position={[sd * 0.085, 0.055, 0.14]}>
                  <mesh scale={[1.1, 0.82, 0.55]}>
                    <sphereGeometry args={[0.042, 16, 12]} />
                    {lamb("#1a0808")}
                  </mesh>
                  <mesh position={[0, 0.002, 0.024]}>
                    <sphereGeometry args={[0.022, 16, 12]} />
                    {lamb("#ff2a28", { emissive: "#ff2020", emit: 1.6 })}
                  </mesh>
                  <mesh position={[0.007, 0.01, 0.034]}>
                    <sphereGeometry args={[0.007, 16, 12]} />
                    {lamb("#ffd0d0", { emissive: "#ffffff", emit: 0.8 })}
                  </mesh>
                  <mesh position={[0, 0.028, 0.01]} scale={[1.15, 0.28, 0.7]}>
                    <sphereGeometry args={[0.04, 6, 4]} />
                    {lamb(dark, { kind: "wool" })}
                  </mesh>
                </group>
              ))}
              {[-1, 1].map((sd) => (
                <mesh key={`wf${sd}`} position={[sd * 0.032, -0.07, 0.4]} rotation={[Math.PI * 0.95, 0, sd * 0.18]} castShadow>
                  <coneGeometry args={[0.014, 0.08, 5]} />
                  {lamb("#f4eee6")}
                </mesh>
              ))}
            </>
          ) : (
            <LizardHead coat={coat} royal={royal} />
          )}
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
          <group ref={tongue} visible={false} position={[0, -0.06, wolf ? 0.32 : royal ? 0.52 : 0.46]}>
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[sd * 0.012, 0, 0.05]} rotation={[Math.PI / 2, 0, sd * -0.22]}>
                <coneGeometry args={[0.009, 0.2, 4]} />
                {lamb("#8a2a30")}
              </mesh>
            ))}
          </group>
        </group>
        <group ref={lArm} position={[-0.28, 1.1, 0.02]}>
          {wolf ? (
            <>
          <mesh position={[0, -0.1, 0.03]} scale={[1.15, 0.7, 1.05]} castShadow>
            <sphereGeometry args={[0.078, 16, 12]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0, -0.24, 0.02]} rotation={[0.15, 0, 0.18]} castShadow>
            <capsuleGeometry args={[0.068, 0.28, 6, 10]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0, -0.5, 0.06]} castShadow>
            <sphereGeometry args={[0.068, 16, 12]} />
            {lamb(paw)}
          </mesh>
          {[-0.03, 0.03].map((x) => (
            <mesh key={`lc${x}`} position={[x, -0.56, 0.1]} rotation={[1.2, 0, 0]}>
              <coneGeometry args={[0.012, 0.06, 5]} />
              {lamb("#e8e0d4")}
            </mesh>
          ))}
            </>
          ) : (
            <group rotation={[0, 0, -0.5]}>
              <LizardArm coat={coat} side={-1} pauldron={seed % 2 === 0} />
            </group>
          )}
        </group>
        <group ref={rArm} position={[0.28, 1.1, 0.02]}>
          {wolf ? (
            <>
          <mesh position={[0, -0.1, 0.03]} scale={[1.15, 0.7, 1.05]} castShadow>
            <sphereGeometry args={[0.078, 16, 12]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0, -0.24, 0.02]} rotation={[0.15, 0, -0.18]} castShadow>
            <capsuleGeometry args={[0.068, 0.28, 6, 10]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0, -0.5, 0.06]} castShadow>
            <sphereGeometry args={[0.068, 16, 12]} />
            {lamb(paw)}
          </mesh>
          {[-0.03, 0.03].map((x) => (
            <mesh key={`rc${x}`} position={[x, -0.56, 0.1]} rotation={[1.2, 0, 0]}>
              <coneGeometry args={[0.012, 0.06, 5]} />
              {lamb("#e8e0d4")}
            </mesh>
          ))}
            </>
          ) : (
            <group rotation={[0, 0, 0.5]}>
              <LizardArm coat={coat} side={1} pauldron={seed % 3 === 0} />
            </group>
          )}
          <group ref={spear} visible={false} position={[0.08, -0.18, 0.04]} rotation={[0.08, 0, 0.06]}>
            {wolf ? (
              <>
            <mesh position={[0, 0.55, 0]} castShadow>
              <cylinderGeometry args={[0.022, 0.028, 1.25, 6]} />
              {lamb("#5a3d24")}
            </mesh>
            <mesh position={[0, 1.22, 0]} rotation={[Math.PI, 0, 0]} castShadow>
              <coneGeometry args={[0.05, 0.2, 5]} />
              {lamb("#c8d0d4")}
            </mesh>
              </>
            ) : (
              <LizardSpear />
            )}
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
        {wolf ? (
        <mesh position={[0, 0.76, 0.04]} rotation={[0.12, 0, 0]} castShadow>
          <sphereGeometry args={[0.20, 16, 12]} />
          {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
        </mesh>
        ) : null}
        <group ref={lLeg} position={[-0.18, 0.80, 0.04]}>
          {wolf ? (
            <>
          <mesh position={[0.06, 0.06, -0.02]} scale={[wolf ? 1.05 : 1.2, 1.05, wolf ? 1.1 : 1.15]} castShadow>
            <sphereGeometry args={[0.15, 16, 12]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0.03, -0.20, 0.05]} rotation={[0.32, 0, 0.06]} castShadow>
            <capsuleGeometry args={[0.095, 0.24, 6, 10]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0.02, -0.48, 0.14]} rotation={[0.42, 0, 0.03]} castShadow>
            <capsuleGeometry args={[0.078, 0.22, 6, 14]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[0.01, -0.72, 0.22]} scale={[wolf ? 1.55 : 1.3, wolf ? 0.85 : 0.72, wolf ? 1.85 : 1.55]} castShadow>
            <sphereGeometry args={[0.095, 16, 12]} />
            {lamb(paw)}
          </mesh>
            </>
          ) : (
            <LizardLeg coat={coat} side={-1} />
          )}
        </group>
        <group ref={rLeg} position={[0.18, 0.80, 0.04]}>
          {wolf ? (
            <>
          <mesh position={[-0.06, 0.06, -0.02]} scale={[wolf ? 1.05 : 1.2, 1.05, wolf ? 1.1 : 1.15]} castShadow>
            <sphereGeometry args={[0.15, 16, 12]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[-0.03, -0.20, 0.05]} rotation={[0.32, 0, -0.06]} castShadow>
            <capsuleGeometry args={[0.095, 0.24, 6, 10]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[-0.02, -0.48, 0.14]} rotation={[0.42, 0, -0.03]} castShadow>
            <capsuleGeometry args={[0.078, 0.22, 6, 14]} />
            {lamb(fur, { kind: coat.scaled ? "scale" : "wool" })}
          </mesh>
          <mesh position={[-0.01, -0.72, 0.22]} scale={[wolf ? 1.55 : 1.3, wolf ? 0.85 : 0.72, wolf ? 1.85 : 1.55]} castShadow>
            <sphereGeometry args={[0.095, 16, 12]} />
            {lamb(paw)}
          </mesh>
            </>
          ) : (
            <LizardLeg coat={coat} side={1} />
          )}
        </group>
        {wolf ? <WolfTail fur={fur} dark={dark} shade={shade} sway={tail} /> : (
          <group ref={tail} position={[0, 0.72, -0.17]} rotation={[1.05, 0, 0]}>
            <LizardTail coat={coat} long={winged} />
          </group>
        )}
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

function SculptTree({ t }: { t: TreeSpot; leaf: string }) {
  const k = treeKey(t.x, t.z);
  const down = fallenTrees.has(k);
  const dent = treeChops.get(k) ?? 0;
  const y = heightAt(t.x, t.z);
  const apple = APPLE_KEYS.has(k);
  const grow = apple ? 3.15 : 2.45;
  const h = 3.4 * t.s * t.h * grow;
  return (
    <group position={[t.x, y - 0.22, t.z]} rotation={[down ? 1.42 : 0, t.r, down ? 0.18 : 0]}>
      <LushTree kind="oak" variant={Math.round(Math.abs(t.x * 3 + t.z * 5))} scale={(h / 3.4) * 0.8} />
      {dent >= 2 && !down ? (
        <mesh position={[0, 0.9, 0.34 * (h / 3.4)]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.5 * t.s, 0.34, 0.2]} />
          {lamb("#e2c48a")}
        </mesh>
      ) : null}
      {apple && !down ? <TreeApples k={k} y={h * 1.0} s={t.s * grow * 2.3} /> : null}
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

export function Boulder({ s = 1, r = 0, moss = false }: { s?: number; r?: number; moss?: boolean }) {
  return (
    <mesh geometry={ROCK_GEO} rotation={[0.12, r, 0.06]} scale={[s * 1.15, s * 0.82, s * 1.08]} castShadow>
      {lamb(moss ? "#6a7460" : "#7a7468")}
    </mesh>
  );
}

export function ThrownBoulder({ scale = 1 }: { scale?: number }) {
  return (
    <mesh geometry={ROCK_GEO} scale={scale} castShadow>
      {lamb("#7a7468")}
    </mesh>
  );
}

export function N64Nag({
  laugh,
  seed = 0,
  pose,
  poseRef,
}: {
  laugh?: boolean;
  seed?: number;
  pose?: FangPose;
  poseRef?: MutableRefObject<FangPose>;
}) {
  return <N64Foe kind="nag" seed={seed} pose={pose ?? (laugh ? "yell" : "idle")} poseRef={poseRef} world="grove" />;
}
