import { useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { live } from "./live";

type HairLook = {
  hair: string;
  skin: string;
  eyes?: string;
  eyeShape?: string;
  lashes?: string;
  mouth?: string;
  blush?: string;
  blushAmt?: number;
  cap?: string;
  longHair?: boolean;
  beard?: boolean;
  kerchief?: string;
  glasses?: boolean;
  mustache?: boolean;
  hat?: string;
  hairStyle?: string;
  nose?: string;
  brows?: string;
};

import { lamb as matLamb } from "./mats";

/** Shared storybook material — skin, cloth, metal, and wood react to light differently. */
export function lamb(
  color: string,
  opts?: { kind?: import("./mats").MatKind; emissive?: string; emit?: number; map?: THREE.Texture | null; side?: THREE.Side; flat?: boolean },
) {
  return matLamb(color, opts);
}

function shade(hex: string, amt: number) {
  const c = new THREE.Color(hex);
  if (amt >= 0) c.lerp(new THREE.Color("#ffffff"), amt);
  else c.lerp(new THREE.Color("#1a100c"), -amt);
  return `#${c.getHexString()}`;
}

function irisInner(hex: string) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, Math.min(1, hsl.s * 1.18 + 0.16), Math.max(0.34, Math.min(0.56, hsl.l + 0.24)));
  return `#${c.getHexString()}`;
}

function irisRim(hex: string) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, Math.min(1, hsl.s + 0.12), Math.max(0.07, hsl.l * 0.42));
  return `#${c.getHexString()}`;
}

const CREAM = "#efe6d4";
const LEATHER = "#5a3a22";
const GOLD = "#c9a227";
const STEEL = "#d8e0ea";
const WOOD = "#c4a06a";
const WOOD_DARK = "#6a4a28";

export function HeroSword({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, -0.36, 0]} scale={[0.26, 2.28, 0.085]} castShadow>
        <octahedronGeometry args={[0.12, 0]} />
        {lamb(STEEL, { kind: "metal" })}
      </mesh>
      <mesh position={[0, -0.36, 0]} scale={[0.11, 2.16, 0.1]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        {lamb("#c8d0d8", { kind: "metal" })}
      </mesh>
      <mesh position={[0, -0.61, 0]} rotation={[Math.PI, 0, 0]} scale={[0.5, 0.9, 0.2]} castShadow>
        <coneGeometry args={[0.09, 0.18, 4]} />
        {lamb("#e8eef4", { kind: "metal" })}
      </mesh>
      <mesh position={[0, -0.08, 0]} castShadow>
        <boxGeometry args={[0.34, 0.05, 0.1]} />
        {lamb(GOLD, { kind: "metal" })}
      </mesh>
      <mesh position={[-0.18, -0.08, 0]} rotation={[0, 0, 0.2]} castShadow>
        <boxGeometry args={[0.08, 0.04, 0.08]} />
        {lamb("#8a6a20", { kind: "metal" })}
      </mesh>
      <mesh position={[0.18, -0.08, 0]} rotation={[0, 0, -0.2]} castShadow>
        <boxGeometry args={[0.08, 0.04, 0.08]} />
        {lamb("#8a6a20", { kind: "metal" })}
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.034, 0.038, 0.28, 6]} />
        {lamb(LEATHER, { kind: "leather" })}
      </mesh>
      {[-0.04, 0.02, 0.08, 0.14].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.036, 0.006, 4, 8]} />
          {lamb("#3a2414", { kind: "leather" })}
        </mesh>
      ))}
      <mesh position={[0, 0.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <octahedronGeometry args={[0.046, 0]} />
        {lamb(GOLD, { kind: "metal" })}
      </mesh>
    </group>
  );
}

export function HeroPole({ scale = 1 }: { scale?: number }) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.02, 0),
      new THREE.Vector3(0.02, -0.28, 0.02),
      new THREE.Vector3(0.08, -0.7, 0.04),
      new THREE.Vector3(0.16, -1.12, 0.02),
      new THREE.Vector3(0.22, -1.48, -0.02),
    ]);
    return new THREE.TubeGeometry(curve, 12, 0.018, 5, false);
  }, []);
  return (
    <group scale={scale}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.038, 0.042, 0.22, 6]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.04, 0.008, 4, 8]} />
        {lamb("#3a2414", { kind: "leather" })}
      </mesh>
      <mesh position={[0.06, 0.08, 0.02]} rotation={[0.2, 0, 1.15]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.03, 8]} />
        {lamb("#5a3a22", { kind: "wood" })}
      </mesh>
      <mesh position={[0.08, 0.08, 0.02]} rotation={[0.2, 0, 1.15]}>
        <torusGeometry args={[0.042, 0.01, 4, 8]} />
        {lamb("#c9a227", { kind: "metal" })}
      </mesh>
      <mesh geometry={geo} castShadow>
        {lamb("#c4a06a", { kind: "wood" })}
      </mesh>
      <mesh position={[0.22, -1.5, -0.02]} rotation={[0.4, 0, 0.2]}>
        <cylinderGeometry args={[0.004, 0.004, 0.28, 4]} />
        {lamb("#efe6d4")}
      </mesh>
      <mesh position={[0.24, -1.66, -0.04]} rotation={[0.6, 0.2, 0.4]}>
        <torusGeometry args={[0.03, 0.006, 4, 8, Math.PI]} />
        {lamb("#8a9098", { kind: "metal" })}
      </mesh>
    </group>
  );
}

export function HeroShield({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.46, 0.42, 0.07, 12]} />
        {lamb(WOOD_DARK, { kind: "wood" })}
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.016, 0]} castShadow>
        <cylinderGeometry args={[0.39, 0.36, 0.048, 12]} />
        {lamb(WOOD, { kind: "wood" })}
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.034, 0]}>
        <torusGeometry args={[0.39, 0.022, 6, 16]} />
        {lamb(GOLD, { kind: "metal" })}
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.042, 0]} rotation={[-0.15, (i * Math.PI) / 2, 0]}>
          <coneGeometry args={[0.08, 0.24, 3]} />
          {lamb(GOLD, { kind: "metal" })}
        </mesh>
      ))}
      <mesh position={[0, 0.048, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.032, 8]} />
        {lamb(GOLD, { kind: "metal" })}
      </mesh>
    </group>
  );
}

/** Plain returning boomerang — curved wooden V, held big, spins in its own plane. */
export function HeroBoom({ scale = 1 }: { scale?: number }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.82, 0.38);
    s.bezierCurveTo(-0.86, 0.5, -0.72, 0.58, -0.58, 0.5);
    s.bezierCurveTo(-0.28, 0.32, -0.1, 0.12, 0, 0.02);
    s.bezierCurveTo(0.1, 0.12, 0.28, 0.32, 0.58, 0.5);
    s.bezierCurveTo(0.72, 0.58, 0.86, 0.5, 0.82, 0.38);
    s.bezierCurveTo(0.76, 0.28, 0.5, 0.12, 0.16, -0.08);
    s.bezierCurveTo(0.08, -0.14, -0.08, -0.14, -0.16, -0.08);
    s.bezierCurveTo(-0.5, 0.12, -0.76, 0.28, -0.82, 0.38);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.014,
      bevelSegments: 2,
      curveSegments: 8,
    });
    g.center();
    return g;
  }, []);
  return (
    <group scale={scale}>
      <mesh geometry={geo} castShadow>
        {lamb(WOOD, { kind: "wood" })}
      </mesh>
      <mesh position={[-0.42, 0.22, 0.03]} rotation={[0, 0, 0.55]} castShadow>
        <boxGeometry args={[0.28, 0.012, 0.02]} />
        {lamb("#8a6238", { kind: "wood" })}
      </mesh>
      <mesh position={[0.42, 0.22, 0.03]} rotation={[0, 0, -0.55]} castShadow>
        <boxGeometry args={[0.28, 0.012, 0.02]} />
        {lamb("#8a6238", { kind: "wood" })}
      </mesh>
      <mesh position={[-0.68, 0.4, 0.03]} rotation={[0, 0, 0.55]}>
        <boxGeometry args={[0.14, 0.018, 0.025]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      <mesh position={[0.68, 0.4, 0.03]} rotation={[0, 0, -0.55]}>
        <boxGeometry args={[0.14, 0.018, 0.025]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
    </group>
  );
}

/** Wooden Y-fork slingshot. Pouch pulls back with live.slingPull. */
export function HeroSling({ scale = 1 }: { scale?: number }) {
  const pouch = useRef<THREE.Group>(null);
  const bandL = useRef<THREE.Mesh>(null);
  const bandR = useRef<THREE.Mesh>(null);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame(() => {
    const pull = live.slingPull;
    const pz = 0.05 + pull * 0.42;
    const py = 0.12 - pull * 0.08;
    if (pouch.current) pouch.current.position.set(0, py, pz);
    const place = (mesh: THREE.Mesh | null, fx: number, fy: number, fz: number) => {
      if (!mesh) return;
      const mx = (fx + 0) * 0.5;
      const my = (fy + py) * 0.5;
      const mz = (fz + pz) * 0.5;
      mesh.position.set(mx, my, mz);
      const dir = new THREE.Vector3(0 - fx, py - fy, pz - fz);
      const len = dir.length() || 0.01;
      mesh.scale.set(1, len / 0.22, 1);
      mesh.quaternion.setFromUnitVectors(up, dir.multiplyScalar(1 / len));
    };
    place(bandL.current, -0.13, 0.34, 0.02);
    place(bandR.current, 0.13, 0.34, 0.02);
  });
  return (
    <group scale={scale}>
      <mesh position={[0, -0.08, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.034, 0.28, 6]} />
        {lamb("#5a3a22", { kind: "wood" })}
      </mesh>
      {[-0.04, 0.04].map((x) => (
        <mesh key={x} position={[x, -0.04, 0.018]}>
          <boxGeometry args={[0.012, 0.16, 0.01]} />
          {lamb("#3a2414", { kind: "leather" })}
        </mesh>
      ))}
      <mesh position={[-0.08, 0.2, 0]} rotation={[0.05, 0, 0.42]} castShadow>
        <cylinderGeometry args={[0.02, 0.026, 0.28, 5]} />
        {lamb(WOOD, { kind: "wood" })}
      </mesh>
      <mesh position={[0.08, 0.2, 0]} rotation={[0.05, 0, -0.42]} castShadow>
        <cylinderGeometry args={[0.02, 0.026, 0.28, 5]} />
        {lamb(WOOD, { kind: "wood" })}
      </mesh>
      <mesh position={[-0.13, 0.34, 0.02]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.04, 0.03, 0.03]} />
        {lamb("#c9a227", { kind: "metal" })}
      </mesh>
      <mesh position={[0.13, 0.34, 0.02]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.04, 0.03, 0.03]} />
        {lamb("#c9a227", { kind: "metal" })}
      </mesh>
      <mesh ref={bandL} position={[-0.08, 0.22, 0.08]}>
        <cylinderGeometry args={[0.008, 0.008, 0.22, 5]} />
        {lamb("#5a3a22", { kind: "leather" })}
      </mesh>
      <mesh ref={bandR} position={[0.08, 0.22, 0.08]}>
        <cylinderGeometry args={[0.008, 0.008, 0.22, 5]} />
        {lamb("#5a3a22", { kind: "leather" })}
      </mesh>
      <group ref={pouch} position={[0, 0.12, 0.05]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.06, 0.04]} />
          {lamb("#6a4a28", { kind: "leather" })}
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <boxGeometry args={[0.07, 0.04, 0.02]} />
          {lamb("#3a2414", { kind: "leather" })}
        </mesh>
      </group>
    </group>
  );
}

export function HeroBomb({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.22, 0]} />
        {lamb("#2a2a28", { kind: "stone" })}
      </mesh>
      <mesh rotation={[0, 0.4, 0.2]}>
        <torusGeometry args={[0.16, 0.018, 5, 10]} />
        {lamb("#8a6a40", { kind: "leather" })}
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.08, 6]} />
        {lamb("#5a3a22", { kind: "wood" })}
      </mesh>
      <mesh position={[0.04, 0.32, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 5]} />
        {lamb("#c4a070")}
      </mesh>
      <mesh position={[0.08, 0.42, 0]}>
        <sphereGeometry args={[0.03, 6, 5]} />
        {lamb("#e07030", { emissive: "#e07030", emit: 0.9 })}
      </mesh>
    </group>
  );
}

export function HeroScarf() {
  return (
    <group>
      <mesh position={[0, 0.52, 0.02]} rotation={[0.35, 0, 0]} castShadow>
        <torusGeometry args={[0.2, 0.055, 5, 10]} />
        {lamb("#b85c38", { kind: "cloth" })}
      </mesh>
      <mesh position={[0.12, 0.22, -0.22]} rotation={[0.35, 0.4, 0.2]} castShadow>
        <boxGeometry args={[0.18, 0.55, 0.05]} />
        {lamb("#c45c38", { kind: "cloth" })}
      </mesh>
      <mesh position={[0.18, -0.08, -0.28]} rotation={[0.15, 0.5, 0.1]} castShadow>
        <boxGeometry args={[0.16, 0.28, 0.04]} />
        {lamb("#a84830", { kind: "cloth" })}
      </mesh>
    </group>
  );
}

export function HeroBelt({ gold = GOLD }: { gold?: string }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}>
        <torusGeometry args={[0.3, 0.038, 6, 14]} />
        {lamb(LEATHER, { kind: "leather" })}
      </mesh>
      <mesh position={[0, 0.01, -0.3]} castShadow>
        <boxGeometry args={[0.11, 0.09, 0.04]} />
        {lamb(gold)}
      </mesh>
      <mesh position={[0, 0.01, -0.318]}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
        {lamb("#8a6a28")}
      </mesh>
    </group>
  );
}

export function HeroPack() {
  return (
    <group position={[0, 0.16, -0.32]} rotation={[0.18, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.34, 0.16]} />
        {lamb("#5a3a22", { kind: "leather" })}
      </mesh>
      <mesh position={[0, 0.14, 0.01]} castShadow>
        <boxGeometry args={[0.32, 0.08, 0.14]} />
        {lamb("#4a2e18", { kind: "leather" })}
      </mesh>
      <mesh position={[0, -0.02, 0.09]}>
        <boxGeometry args={[0.22, 0.12, 0.04]} />
        {lamb("#6a4a28", { kind: "leather" })}
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.22, 0.18]} rotation={[0.85, 0, x * 0.4]}>
          <cylinderGeometry args={[0.016, 0.016, 0.42, 6]} />
          {lamb("#4a2e18", { kind: "leather" })}
        </mesh>
      ))}
      <mesh position={[0, 0.2, -0.02]}>
        <boxGeometry args={[0.08, 0.05, 0.05]} />
        {lamb(GOLD, { kind: "metal" })}
      </mesh>
    </group>
  );
}

export function HeroSatchel() {
  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[0.15, 0.35, 0.12]} castShadow>
        <boxGeometry args={[0.22, 0.18, 0.12]} />
        {lamb("#6a4a2c")}
      </mesh>
      <mesh position={[0.02, 0.1, 0.02]} rotation={[0.1, 0.35, 0.1]}>
        <boxGeometry args={[0.18, 0.05, 0.1]} />
        {lamb("#4a3220")}
      </mesh>
      <mesh position={[-0.08, 0.22, 0.16]} rotation={[0.8, 0.2, -0.4]}>
        <cylinderGeometry args={[0.012, 0.012, 0.42, 6]} />
        {lamb(LEATHER, { kind: "leather" })}
      </mesh>
      <mesh position={[0.04, -0.02, -0.02]}>
        <boxGeometry args={[0.04, 0.04, 0.03]} />
        {lamb(GOLD, { kind: "metal" })}
      </mesh>
    </group>
  );
}

export function HeroBracer({ color = LEATHER }: { color?: string }) {
  return (
    <mesh rotation={[0.1, 0, 0]} castShadow>
      <cylinderGeometry args={[0.078, 0.072, 0.14, 8]} />
      {lamb(color)}
    </mesh>
  );
}

function Eye({
  x,
  color,
  wide,
  lashes,
  z = -0.226,
}: {
  x: number;
  color: string;
  wide: number;
  lashes?: boolean;
  z?: number;
}) {
  const inner = irisInner(color);
  const w = 0.05 * wide;
  return (
    <group position={[x, 0.848, z]} rotation={[0.22, 0, 0]}>
      <mesh rotation={[0, Math.PI, 0]} scale={[1.08, 0.72, 1]} renderOrder={2}>
        <circleGeometry args={[w, 8]} />
        {lamb("#fffef8", { kind: "eye" })}
      </mesh>
      <mesh position={[0, -0.003, -0.001]} rotation={[0, Math.PI, 0]} scale={[0.8, 0.8, 1]} renderOrder={3}>
        <circleGeometry args={[w * 0.7, 7]} />
        {lamb(inner, { kind: "eye" })}
      </mesh>
      <mesh position={[0, -0.001, -0.002]} rotation={[0, Math.PI, 0]} renderOrder={4}>
        <circleGeometry args={[w * 0.26, 6]} />
        {lamb("#120c0a", { kind: "eye" })}
      </mesh>
      <mesh position={[-0.01, 0.01, -0.003]} rotation={[0, Math.PI, 0]} renderOrder={5}>
        <circleGeometry args={[0.008, 8]} />
        {lamb("#ffffff", { kind: "metal" })}
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.08, 1, 0.72]} renderOrder={6}>
        <torusGeometry args={[w, 0.004, 4, 10]} />
        {lamb("#1a100c")}
      </mesh>
      <mesh position={[0, 0.028, 0.001]} rotation={[0.2, 0, 0]} scale={[1.08, 0.14, 0.22]}>
        <capsuleGeometry args={[0.016, 0.022, 2, 8]} />
        {lamb("#1a100c")}
      </mesh>
      {lashes ? (
        <>
          {[-0.03, 0.0, 0.03].map((lx, i) => (
            <mesh key={i} position={[lx, 0.038, 0]} rotation={[0.15, 0, lx * 6]} scale={[0.2, 0.55, 0.18]}>
              <capsuleGeometry args={[0.004, 0.02, 2, 4]} />
              {lamb("#1a100c")}
            </mesh>
          ))}
        </>
      ) : null}
    </group>
  );
}

function mouthPts(kind: string): THREE.Vector3[] {
  if (kind === "bolt") {
    return [
      new THREE.Vector3(-0.054, -0.004, 0),
      new THREE.Vector3(-0.01, 0.026, 0),
      new THREE.Vector3(0.018, -0.022, 0),
      new THREE.Vector3(0.058, 0.02, 0),
    ];
  }
  if (kind === "cat") {
    return [
      new THREE.Vector3(-0.058, 0.012, 0),
      new THREE.Vector3(-0.032, -0.016, 0),
      new THREE.Vector3(-0.012, 0.004, 0),
      new THREE.Vector3(0, 0.02, 0),
      new THREE.Vector3(0.012, 0.004, 0),
      new THREE.Vector3(0.032, -0.016, 0),
      new THREE.Vector3(0.058, 0.012, 0),
    ];
  }
  if (kind === "frown") {
    return [
      new THREE.Vector3(-0.05, -0.014, 0),
      new THREE.Vector3(0, 0.018, 0),
      new THREE.Vector3(0.05, -0.014, 0),
    ];
  }
  if (kind === "grin") {
    return [
      new THREE.Vector3(-0.072, 0.018, 0),
      new THREE.Vector3(-0.038, -0.01, 0),
      new THREE.Vector3(0, -0.028, 0),
      new THREE.Vector3(0.038, -0.01, 0),
      new THREE.Vector3(0.072, 0.018, 0),
    ];
  }
  if (kind === "line") {
    return [new THREE.Vector3(-0.044, 0, 0), new THREE.Vector3(0.044, 0, 0)];
  }
  return [
    new THREE.Vector3(-0.056, 0.014, 0),
    new THREE.Vector3(-0.028, -0.008, 0),
    new THREE.Vector3(0, -0.022, 0),
    new THREE.Vector3(0.028, -0.008, 0),
    new THREE.Vector3(0.056, 0.014, 0),
  ];
}

function boltPath() {
  const p = new THREE.CurvePath<THREE.Vector3>();
  const pts = mouthPts("bolt");
  p.add(new THREE.LineCurve3(pts[0]!, pts[1]!));
  p.add(new THREE.LineCurve3(pts[1]!, pts[2]!));
  p.add(new THREE.LineCurve3(pts[2]!, pts[3]!));
  return p;
}

function KawaiiMouth({ kind }: { kind: string }) {
  const geo = useMemo(() => {
    if (kind === "none" || kind === "o") return null;
    const curve =
      kind === "bolt"
        ? boltPath()
        : new THREE.CatmullRomCurve3(mouthPts(kind), false, "catmullrom", 0.38);
    return new THREE.TubeGeometry(curve, 24, kind === "bolt" ? 0.009 : 0.008, 5, false);
  }, [kind]);
  if (kind === "none") return null;
  if (kind === "o") {
    return (
      <group position={[0, 0.655, -0.318]} rotation={[-0.42, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.032, 0.015, 6, 14]} />
          {lamb("#4a1816")}
        </mesh>
      </group>
    );
  }
  if (!geo) return null;
  return (
    <group position={[0, 0.628, -0.322]} rotation={[-0.28, 0, 0]} scale={[0.92, 0.88, 1]}>
      <mesh geometry={geo} castShadow>
        {lamb("#4a1816")}
      </mesh>
    </group>
  );
}

function browTilt(kind: string | undefined, girl: boolean | undefined, side: number) {
  if (kind === "mad") return side * -0.42;
  if (kind === "sad" || kind === "worried") return side * 0.38;
  if (kind === "raised") return side * (side > 0 ? 0.22 : -0.08);
  return side * (girl ? 0.16 : -0.1);
}

export function pickFace(p: {
  hero?: boolean;
  talking?: boolean;
  scare?: boolean;
  mad?: boolean;
  wave?: boolean;
  sit?: boolean;
  id?: string;
  seed?: number;
  baseMouth?: string;
  baseBrows?: string;
}): { mouth: string; brows: string } {
  const id = p.id;
  const mood = id ? live.npcMood[id] : undefined;
  const anger = id ? live.npcMad[id] ?? 0 : 0;
  if (p.hero && live.bed) return { mouth: "line", brows: "none" };
  if (p.hero && live.ocarina) return { mouth: "o", brows: "raised" };
  if (p.hero && live.getItem) return { mouth: "grin", brows: "raised" };
  if (p.hero && live.dizzyT > 0) return { mouth: "o", brows: "worried" };
  if (p.hero && live.house === "yours") return { mouth: "smile", brows: "neutral" };
  if (p.hero && live.night && !live.house) return { mouth: "line", brows: "worried" };
  if (p.hero && live.cave) return { mouth: "line", brows: "worried" };
  if (p.hero && (live.jumpStretch > 0.35 || live.swim)) return { mouth: "o", brows: "raised" };
  if (p.hero && live.rolling) return { mouth: "o", brows: "mad" };
  if (p.hero && live.knock && live.knock.t > 0) return { mouth: "frown", brows: "mad" };
  if (p.hero && live.balloonRide) return { mouth: "grin", brows: "raised" };
  if (p.hero && live.carry === "cucco") return { mouth: "grin", brows: "neutral" };
  if (p.hero && live.carry === "frog") return { mouth: "o", brows: "raised" };
  if (p.hero && live.sit) return { mouth: "smile", brows: "neutral" };
  if (p.hero && Math.abs(live.speed) > 14) return { mouth: "grin", brows: "mad" };
  if (p.hero && live.wetT > 2.5) return { mouth: "frown", brows: "worried" };
  if (p.talking || (p.id && live.talkNpc === p.id && live.talking) || mood === "talk") {
    const open = Math.sin(live.playT * 22) > 0;
    return { mouth: open ? "o" : "line", brows: "raised" };
  }
  if (p.scare || mood === "scared") return { mouth: "o", brows: "worried" };
  if (p.mad || anger > 0 || mood === "mad") return { mouth: "frown", brows: "mad" };
  if (mood === "laugh") return { mouth: "grin", brows: "raised" };
  if (mood === "smile" || p.wave) return { mouth: "smile", brows: "raised" };
  if (mood === "sad" || mood === "worried") return { mouth: "frown", brows: "sad" };
  if (mood === "sleep") return { mouth: "line", brows: "none" };
  if (mood === "eat" || mood === "sip") return { mouth: Math.sin(live.playT * 10) > 0 ? "o" : "line", brows: "neutral" };
  if (p.sit) return { mouth: "smile", brows: "neutral" };
  const seed = p.seed ?? (id ? id.length * 3 : 0);
  const beat = Math.floor((live.playT + seed * 1.7) / 2.6) % 5;
  if (p.hero) {
    const cycle = ["cat", "smile", "line", "cat", "grin"] as const;
    return { mouth: cycle[beat]!, brows: beat === 4 ? "raised" : beat === 2 ? "neutral" : "neutral" };
  }
  const cycle = ["smile", "line", "cat", "grin", "frown"] as const;
  const brows = beat === 4 ? "sad" : beat === 3 ? "raised" : "neutral";
  return { mouth: p.baseMouth && beat === 0 ? p.baseMouth : cycle[beat]!, brows: p.baseBrows && beat === 0 ? p.baseBrows : brows };
}

export function ZeldaEar({
  skin,
  side,
}: {
  skin: string;
  side: number;
}) {
  const inner = shade(skin, -0.32);
  return (
    <group position={[side * 0.275, 0.84, 0.04]} rotation={[0.22, side * 0.62, side * 0.72]}>
      <mesh scale={[0.42, 1, 0.22]} castShadow>
        <coneGeometry args={[0.13, 0.26, 6]} />
        {lamb(skin, { kind: "skin" })}
      </mesh>
      <mesh position={[0, 0.015, 0.018]} scale={[0.26, 0.78, 0.1]}>
        <coneGeometry args={[0.13, 0.26, 6]} />
        {lamb(inner, { kind: "skin" })}
      </mesh>
    </group>
  );
}

export function HeroHead({
  look,
  girl,
  whites,
  lids,
}: {
  look: HairLook;
  girl: boolean;
  whites: React.RefObject<THREE.Group | null>;
  lids: React.RefObject<THREE.Group | null>;
}) {
  const skin = look.skin;
  const wide = look.eyeShape === "wide" ? 1.0 : look.eyeShape === "narrow" ? 0.82 : look.eyeShape === "sharp" ? 0.88 : 0.92;
  const showLashes = look.lashes ? look.lashes !== "none" : girl;
  const [mood, setMood] = useState(() => pickFace({ hero: true, baseMouth: look.mouth, baseBrows: look.brows }));
  useFrame(() => {
    const next = pickFace({ hero: true, talking: live.talking, sit: live.sit, baseMouth: look.mouth, baseBrows: look.brows });
    if (next.mouth !== mood.mouth || next.brows !== mood.brows) setMood(next);
  });
  const brows = mood.brows;
  const blushHex = look.blush || "#e89088";
  const blushAmt = Math.max(0.55, look.blushAmt ?? 0.72);
  return (
    <group>
      <mesh position={[0, 0.8, 0.03]} scale={[0.94, 1.08, 0.88]} castShadow>
        <sphereGeometry args={[0.305, 10, 8]} />
        {lamb(skin, { kind: "skin" })}
      </mesh>
      <mesh position={[-0.155, 0.71, -0.16]} scale={[0.78, 0.58, 0.62]} castShadow>
        <sphereGeometry args={[0.11, 8, 6]} />
        {lamb(skin, { kind: "skin" })}
      </mesh>
      <mesh position={[0.155, 0.71, -0.16]} scale={[0.78, 0.58, 0.62]} castShadow>
        <sphereGeometry args={[0.11, 8, 6]} />
        {lamb(skin, { kind: "skin" })}
      </mesh>
      <mesh position={[0, 0.575, -0.2]} scale={[0.72, 0.48, 0.58]} castShadow>
        <sphereGeometry args={[0.1, 8, 6]} />
        {lamb(shade(skin, -0.04), { kind: "skin" })}
      </mesh>
      <ZeldaEar skin={skin} side={-1} />
      <ZeldaEar skin={skin} side={1} />
      {look.nose === "line" ? (
        <mesh position={[0, 0.7, -0.33]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.012, 0.046, 0.012]} />
          {lamb(shade(skin, -0.12), { kind: "skin" })}
        </mesh>
      ) : look.nose === "pointy" ? (
        <mesh position={[0, 0.705, -0.332]} rotation={[0.55, 0, 0]} scale={[0.55, 0.9, 1.2]} castShadow>
          <coneGeometry args={[0.038, 0.07, 6]} />
          {lamb(shade(skin, -0.06), { kind: "skin" })}
        </mesh>
      ) : (
        <mesh position={[0, 0.705, -0.3]} rotation={[0.45, 0, 0]} scale={[0.55, 0.62, 0.85]} castShadow>
          <sphereGeometry args={[0.034, 8, 6]} />
          {lamb(shade(skin, -0.06), { kind: "skin" })}
        </mesh>
      )}
      <mesh position={[-0.15, 0.7, -0.24]} rotation={[0.32, 0.28, 0]} renderOrder={2}>
        <circleGeometry args={[0.055, 10]} />
        <meshLambertMaterial color={blushHex} transparent opacity={blushAmt * 0.55} depthWrite={false} />
      </mesh>
      <mesh position={[0.15, 0.7, -0.24]} rotation={[0.32, -0.28, 0]} renderOrder={2}>
        <circleGeometry args={[0.055, 10]} />
        <meshLambertMaterial color={blushHex} transparent opacity={blushAmt * 0.55} depthWrite={false} />
      </mesh>
      <group ref={whites}>
        <Eye x={-0.118} color={look.eyes ?? "#4a2e18"} wide={wide} lashes={showLashes} z={-0.218} />
        <Eye x={0.118} color={look.eyes ?? "#4a2e18"} wide={wide} lashes={showLashes} z={-0.218} />
      </group>
      <group ref={lids} visible={false}>
        <mesh position={[-0.118, 0.848, -0.218]} rotation={[0.22, 0, 0]} scale={[1.05, 0.5, 1]}>
          <circleGeometry args={[0.052, 12]} />
          {lamb(skin, { kind: "skin" })}
        </mesh>
        <mesh position={[0.118, 0.848, -0.218]} rotation={[0.22, 0, 0]} scale={[1.05, 0.5, 1]}>
          <circleGeometry args={[0.052, 12]} />
          {lamb(skin, { kind: "skin" })}
        </mesh>
      </group>
      {brows !== "none" ? (
        <>
          <mesh position={[-0.118, 0.93, -0.268]} rotation={[0.22, 0.06, browTilt(brows, girl, -1)]} castShadow>
            <boxGeometry args={[0.1, brows === "mad" ? 0.016 : 0.01, 0.012]} />
            {lamb("#2a1c14")}
          </mesh>
          <mesh position={[0.118, 0.93, -0.268]} rotation={[0.22, -0.06, browTilt(brows, girl, 1)]} castShadow>
            <boxGeometry args={[0.1, brows === "mad" ? 0.016 : 0.01, 0.012]} />
            {lamb("#2a1c14")}
          </mesh>
        </>
      ) : null}
      <KawaiiMouth kind={mood.mouth} />
    </group>
  );
}

function makeWavyHairCap() {
  const g = new THREE.SphereGeometry(1, 36, 22, 0, Math.PI * 2, 0, Math.PI * 0.7);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    x *= 0.35;
    z *= 0.33;
    y = y * 0.26 + 0.8;
    if (z < 0) {
      const bang = x < -0.02 ? 0.055 : 0.012;
      const line = 0.9 - bang * Math.min(1, -z * 4);
      if (y < line) y = line + (y - line) * 0.12;
      z = Math.max(z, -0.26);
    } else {
      y -= z * 0.38;
      if (y < 0.56) y = 0.56 + (y - 0.56) * 0.25;
    }
    if (y < 0.74 && z > 0.04) {
      y += Math.sin(x * 26) * 0.03 * Math.min(1, z * 5);
    }
    const dx = x;
    const dy = y - 0.78;
    const dz = z;
    const r = Math.hypot(dx, dy * 0.92, dz) || 1;
    const want = 0.34 + Math.max(0, z) * 0.04;
    const k = want / r;
    x = dx * k;
    y = 0.78 + dy * k;
    z = dz * k;
    pos.setXYZ(i, x, y, z);
  }
  g.deleteAttribute("normal");
  g.computeVertexNormals();
  return g;
}

const HAIR_CAP_GEO = makeWavyHairCap();

function makeHairFall() {
  const g = new THREE.SphereGeometry(0.34, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.72);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    x *= 0.92;
    z = z * 0.55 + 0.16;
    y = y * 0.85 + 0.62;
    pos.setXYZ(i, x, y, z);
  }
  g.deleteAttribute("normal");
  g.computeVertexNormals();
  return g;
}

const HAIR_FALL_GEO = makeHairFall();

export function HeroHair({ color, style }: { color: string; style?: string }) {
  const dark = shade(color, -0.1);
  const id = style || "wavy";
  const girlLong = id === "long" || id === "braid" || id === "pony";
  return (
    <group>
      <mesh geometry={HAIR_CAP_GEO} castShadow receiveShadow>
        {lamb(color, { kind: "hair", side: THREE.DoubleSide })}
      </mesh>
      {girlLong ? (
        <mesh geometry={HAIR_FALL_GEO} castShadow>
          {lamb(id === "pony" ? dark : color, { kind: "hair", side: THREE.DoubleSide })}
        </mesh>
      ) : null}
      {id === "braid" ? (
        <mesh position={[0, 0.14, 0.34]} castShadow>
          <torusGeometry args={[0.05, 0.012, 6, 10]} />
          {lamb(GOLD, { kind: "metal" })}
        </mesh>
      ) : null}
    </group>
  );
}

export function BoyHair({ color }: { color: string }) {
  return <HeroHair color={color} style="wavy" />;
}

export function GirlHair({ color }: { color: string }) {
  return <HeroHair color={color} style="long" />;
}

function paintFace(look: HairLook, girl: boolean) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  const skin = look.skin || "#e8b898";
  g.fillStyle = skin;
  g.fillRect(0, 0, 256, 256);
  const amt = look.blushAmt ?? 0.28;
  if (look.blush && amt > 0.04) {
    g.globalAlpha = 0.22 + amt * 0.28;
    g.fillStyle = look.blush;
    g.beginPath();
    g.ellipse(78, 168, 36, 18, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(178, 168, 36, 18, 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
  }
  const wide = look.eyeShape === "wide" ? 1.12 : look.eyeShape === "narrow" ? 0.84 : 1;
  const iris = look.eyes || "#6a3a18";
  const eye = (cx: number, cy: number, flip: number) => {
    g.save();
    g.translate(cx, cy);
    g.scale(flip * wide, 1);
    g.beginPath();
    g.moveTo(-28, 4);
    g.bezierCurveTo(-20, -20, 14, -22, 28, 3);
    g.bezierCurveTo(18, 18, -16, 20, -28, 4);
    g.closePath();
    g.fillStyle = "#fffef8";
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = irisRim(iris);
    g.beginPath();
    g.ellipse(0, 4, 16, 18, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = irisInner(iris);
    g.beginPath();
    g.ellipse(0, 3, 12, 14, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#120e0c";
    g.beginPath();
    g.ellipse(0, 5, 6, 8, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.arc(5, -4, 5.2, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(-6, 6, 2.2, 0, Math.PI * 2);
    g.fill();
    g.restore();
    g.strokeStyle = "#1a100c";
    g.lineWidth = 3.4;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(-28, 4);
    g.bezierCurveTo(-20, -20, 14, -22, 28, 3);
    g.stroke();
    if (girl) {
      g.lineWidth = 1.8;
      for (const [lx, ly] of [
        [-18, -10],
        [-4, -16],
        [10, -15],
        [20, -6],
      ] as const) {
        g.beginPath();
        g.moveTo(lx, ly);
        g.lineTo(lx, ly - 7);
        g.stroke();
      }
    }
    g.restore();
  };
  eye(94, 96, 1);
  eye(162, 96, -1);
  g.strokeStyle = "#2a1810";
  g.lineWidth = 3.4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(72, 68);
  g.quadraticCurveTo(94, 56, 116, 70);
  g.stroke();
  g.beginPath();
  g.moveTo(140, 70);
  g.quadraticCurveTo(162, 56, 184, 68);
  g.stroke();
  const mouth = look.mouth ?? "cat";
  if (mouth !== "none") {
    g.strokeStyle = "#4a1816";
    g.lineWidth = 3.4;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.beginPath();
    if (mouth === "frown") {
      g.moveTo(108, 196);
      g.quadraticCurveTo(128, 180, 148, 196);
    } else if (mouth === "bolt") {
      g.moveTo(104, 188);
      g.lineTo(122, 170);
      g.lineTo(134, 198);
      g.lineTo(156, 174);
    } else if (mouth === "cat") {
      g.moveTo(104, 184);
      g.quadraticCurveTo(114, 200, 122, 186);
      g.quadraticCurveTo(128, 176, 134, 186);
      g.quadraticCurveTo(142, 200, 152, 184);
    } else if (mouth === "o") {
      g.ellipse(128, 188, 8, 7, 0, 0, Math.PI * 2);
    } else if (mouth === "line") {
      g.moveTo(110, 186);
      g.lineTo(146, 186);
    } else if (mouth === "grin") {
      g.moveTo(100, 180);
      g.quadraticCurveTo(128, 208, 156, 180);
    } else {
      g.moveTo(106, 180);
      g.quadraticCurveTo(128, 200, 150, 180);
    }
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function StoryFace({
  look,
  girl,
  talking,
  scare,
  mad,
  wave,
  sit,
  moodId,
  seed,
}: {
  look: HairLook;
  girl?: boolean;
  y?: number;
  r?: number;
  z?: number;
  talking?: boolean;
  scare?: { current: boolean };
  mad?: { current: boolean };
  wave?: { current: boolean };
  sit?: { current: boolean };
  moodId?: string;
  seed?: number;
}) {
  const wide = look.eyeShape === "wide" ? 0.98 : look.eyeShape === "narrow" ? 0.82 : 0.9;
  const [mood, setMood] = useState(() =>
    pickFace({
      talking,
      scare: scare?.current,
      mad: mad?.current,
      wave: wave?.current,
      sit: sit?.current,
      id: moodId,
      seed,
      baseMouth: look.mouth,
      baseBrows: look.brows,
    }),
  );
  useFrame(() => {
    const next = pickFace({
      talking,
      scare: scare?.current,
      mad: mad?.current,
      wave: wave?.current,
      sit: sit?.current,
      id: moodId,
      seed,
      baseMouth: look.mouth,
      baseBrows: look.brows,
    });
    if (next.mouth !== mood.mouth || next.brows !== mood.brows) setMood(next);
  });
  const showLashes = look.lashes ? look.lashes !== "none" : Boolean(girl);
  return (
    <group>
      <Eye x={-0.11} color={look.eyes ?? "#4a2e18"} wide={wide} lashes={showLashes} z={-0.248} />
      <Eye x={0.11} color={look.eyes ?? "#4a2e18"} wide={wide} lashes={showLashes} z={-0.248} />
      {mood.brows !== "none" ? (
        <>
          <mesh position={[-0.11, 0.93, -0.268]} rotation={[0.22, 0.06, browTilt(mood.brows, girl, -1)]} castShadow>
            <boxGeometry args={[0.09, mood.brows === "mad" ? 0.016 : 0.01, 0.012]} />
            {lamb("#2a1c14")}
          </mesh>
          <mesh position={[0.11, 0.93, -0.268]} rotation={[0.22, -0.06, browTilt(mood.brows, girl, 1)]} castShadow>
            <boxGeometry args={[0.09, mood.brows === "mad" ? 0.016 : 0.01, 0.012]} />
            {lamb("#2a1c14")}
          </mesh>
        </>
      ) : null}
      <KawaiiMouth kind={mood.mouth} />
    </group>
  );
}

export function NpcHair({ look, seed = 0 }: { look: HairLook; seed?: number }) {
  const color = look.hair;
  const style = look.hairStyle || (look.longHair ? "long" : look.beard ? "beard" : look.cap ? "cap" : (seed + color.length) % 5);
  const hat = look.hat || (look.cap && look.cap !== "none" ? "cap" : undefined);
  return (
    <group>
      {look.longHair || style === "long" || style === "braid" ? (
        <GirlHair color={color} />
      ) : style === "ponytail" ? (
        <group>
          <mesh position={[0, 0.94, 0.02]} scale={[1.08, 0.5, 1.02]} castShadow>
            <sphereGeometry args={[0.26, 10, 8]} />
            {lamb(color, { kind: "hair" })}
          </mesh>
          <mesh position={[0.18, 0.72, 0.18]} rotation={[0.9, 0.4, 0.2]} castShadow>
            <capsuleGeometry args={[0.07, 0.28, 4, 8]} />
            {lamb(color, { kind: "hair" })}
          </mesh>
        </group>
      ) : style === "bun" || style === "greybun" ? (
        <group>
          <mesh position={[0, 0.94, 0.02]} scale={[1.05, 0.42, 1.0]} castShadow>
            <sphereGeometry args={[0.26, 10, 8]} />
            {lamb(color, { kind: "hair" })}
          </mesh>
          <mesh position={[0, 1.12, 0.08]} castShadow>
            <sphereGeometry args={[0.11, 8, 6]} />
            {lamb(color, { kind: "hair" })}
          </mesh>
        </group>
      ) : style === "curly" ? (
        <group>
          {[
            [0, 0.98, 0.02, 0.28],
            [-0.16, 0.92, 0.1, 0.12],
            [0.16, 0.92, 0.1, 0.12],
            [-0.12, 1.08, 0.0, 0.1],
            [0.12, 1.08, 0.0, 0.1],
            [0, 0.88, 0.18, 0.11],
          ].map(([x, y, z, r], i) => (
            <mesh key={i} position={[x, y, z]} castShadow>
              <icosahedronGeometry args={[r, 0]} />
              {lamb(i % 2 ? shade(color, 0.08) : color, { kind: "hair" })}
            </mesh>
          ))}
        </group>
      ) : style === "beard" || look.beard ? (
        <group>
          <mesh position={[0, 0.92, 0.04]} scale={[1.1, 0.48, 1.05]} castShadow>
            <sphereGeometry args={[0.28, 10, 8]} />
            {lamb(color, { kind: "hair" })}
          </mesh>
          <mesh position={[0, 0.58, -0.18]} scale={[0.85, 0.7, 0.55]} castShadow>
            <sphereGeometry args={[0.16, 8, 6]} />
            {lamb(shade(color, -0.1))}
          </mesh>
        </group>
      ) : (
        <group>
          <mesh position={[0, 0.92, 0.04]} scale={[1.12, 0.55, 1.08]} castShadow>
            <sphereGeometry args={[0.28, 10, 8]} />
            {lamb(color, { kind: "hair" })}
          </mesh>
          <mesh position={[0, 0.8, 0.16]} scale={[1.0, 0.65, 0.7]} castShadow>
            <sphereGeometry args={[0.2, 8, 6]} />
            {lamb(color, { kind: "hair" })}
          </mesh>
        </group>
      )}
      {look.kerchief ? (
        <group>
          <mesh position={[0, 1.0, 0.02]} scale={[1.22, 0.28, 1.16]} castShadow>
            <sphereGeometry args={[0.27, 8, 6]} />
            {lamb(look.kerchief, { kind: "cloth" })}
          </mesh>
          <mesh position={[0.16, 0.82, 0.12]} rotation={[0.4, 0.6, 0.2]} castShadow>
            <boxGeometry args={[0.16, 0.08, 0.04]} />
            {lamb(look.kerchief, { kind: "cloth" })}
          </mesh>
        </group>
      ) : hat === "wide" ? (
        <group>
          <mesh position={[0, 1.12, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.38, 0.04, 10]} />
            {lamb("#3a2a18", { kind: "leather" })}
          </mesh>
          <mesh position={[0, 1.22, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.18, 0.14, 8]} />
            {lamb("#3a2a18", { kind: "leather" })}
          </mesh>
          <mesh position={[-0.12, 1.28, 0.08]} rotation={[0.4, 0, -0.4]} castShadow>
            <boxGeometry args={[0.04, 0.12, 0.02]} />
            {lamb("#efe6d4")}
          </mesh>
        </group>
      ) : hat === "helm" ? (
        <group>
          <mesh position={[0, 1.02, 0.02]} scale={[1.18, 0.7, 1.12]} castShadow>
            <sphereGeometry args={[0.28, 8, 6]} />
            {lamb("#8a9098", { kind: "metal" })}
          </mesh>
          <mesh position={[0, 0.92, -0.28]} castShadow>
            <boxGeometry args={[0.42, 0.12, 0.08]} />
            {lamb("#8a9098", { kind: "metal" })}
          </mesh>
        </group>
      ) : hat === "green" ? (
        <mesh position={[0, 1.08, 0.02]} scale={[1.18, 0.34, 1.1]} castShadow>
          <sphereGeometry args={[0.27, 8, 6]} />
          {lamb("#3a5a38", { kind: "cloth" })}
        </mesh>
      ) : hat === "beret" ? (
        <mesh position={[0, 1.1, 0.04]} rotation={[0.15, 0, 0.2]} scale={[1.2, 0.28, 1.1]} castShadow>
          <sphereGeometry args={[0.24, 8, 6]} />
          {lamb("#5a3a22", { kind: "cloth" })}
        </mesh>
      ) : look.cap && look.cap !== "none" ? (
        <mesh position={[0, 1.02, 0.02]} scale={[1.2, 0.32, 1.12]} castShadow>
          <sphereGeometry args={[0.27, 8, 6]} />
          {lamb(look.cap, { kind: "cloth" })}
        </mesh>
      ) : null}
      {look.glasses ? (
        <group position={[0, 0.82, -0.28]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.1, 0, 0]}>
              <torusGeometry args={[0.055, 0.01, 6, 10]} />
              {lamb("#2a2418", { kind: "metal" })}
            </mesh>
          ))}
          <mesh>
            <boxGeometry args={[0.08, 0.012, 0.012]} />
            {lamb("#2a2418")}
          </mesh>
        </group>
      ) : null}
      {look.mustache ? (
        <mesh position={[0, 0.64, -0.3]} scale={[1.2, 0.35, 0.5]} castShadow>
          <sphereGeometry args={[0.06, 6, 5]} />
          {lamb(shade(color, -0.15))}
        </mesh>
      ) : null}
    </group>
  );
}

export function NpcOutfit({
  look,
}: {
  look: {
    tunic: string;
    sash: string;
    kit?: string;
    apron?: string;
    shirt?: string;
  };
}) {
  const kit = look.kit;
  return (
    <group>
      {look.shirt ? (
        <mesh position={[0, 0.48, -0.02]} rotation={[0.35, 0, 0]}>
          <torusGeometry args={[0.14, 0.035, 5, 12]} />
          {lamb(look.shirt, { kind: "cloth" })}
        </mesh>
      ) : null}
      {kit === "vest" || kit === "overalls" ? (
        <>
          <mesh position={[0, 0.28, 0.02]} scale={[1.02, 0.85, 0.92]} castShadow>
            <cylinderGeometry args={[0.24, 0.3, 0.42, 8]} />
            {lamb(look.tunic, { kind: "cloth" })}
          </mesh>
          <mesh position={[-0.12, 0.48, 0.02]} rotation={[0, 0, 0.35]} castShadow>
            <boxGeometry args={[0.08, 0.42, 0.08]} />
            {lamb(look.tunic, { kind: "cloth" })}
          </mesh>
          <mesh position={[0.12, 0.48, 0.02]} rotation={[0, 0, -0.35]} castShadow>
            <boxGeometry args={[0.08, 0.42, 0.08]} />
            {lamb(look.tunic, { kind: "cloth" })}
          </mesh>
          <mesh position={[0, 0.08, 0.03]}>
            <boxGeometry args={[0.18, 0.05, 0.08]} />
            {lamb("#c9a227", { kind: "metal" })}
          </mesh>
        </>
      ) : null}
      {kit === "apron" || look.apron ? (
        <mesh position={[0, 0.12, -0.22]} rotation={[0.08, 0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.55, 0.04]} />
          {lamb(look.apron ?? "#efe6d4", { kind: "cloth" })}
        </mesh>
      ) : null}
      {kit === "pinafore" ? (
        <mesh position={[0, 0.08, -0.18]} rotation={[0.12, 0, 0]} castShadow>
          <boxGeometry args={[0.46, 0.5, 0.05]} />
          {lamb(look.tunic, { kind: "cloth" })}
        </mesh>
      ) : null}
      {kit === "cloak" || kit === "robe" || kit === "scholar" ? (
        <mesh position={[0, 0.22, 0.22]} rotation={[0.25, 0, 0]} castShadow>
          <boxGeometry args={[0.58, 0.85, 0.08]} />
          {lamb(kit === "scholar" ? "#3a4a68" : look.tunic, { kind: "cloth" })}
        </mesh>
      ) : null}
      {kit === "guard" ? (
        <>
          <mesh position={[0, 0.28, -0.02]} castShadow>
            <boxGeometry args={[0.48, 0.28, 0.28]} />
            {lamb("#3a5a88", { kind: "cloth" })}
          </mesh>
          <mesh position={[0, 0.12, 0.02]}>
            <boxGeometry args={[0.22, 0.06, 0.1]} />
            {lamb("#c9a227", { kind: "metal" })}
          </mesh>
        </>
      ) : null}
      {kit === "dress" ? (
        <mesh position={[0, -0.02, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.26, 0.42, 8]} />
          {lamb(look.tunic, { kind: "cloth" })}
        </mesh>
      ) : null}
    </group>
  );
}

export function NpcProp({ kind }: { kind?: string }) {
  if (!kind) return null;
  if (kind === "lamb") {
    return (
      <group position={[0.02, -0.18, 0.12]} scale={0.55}>
        <mesh castShadow>
          <icosahedronGeometry args={[0.16, 0]} />
          {lamb("#f2eee6", { kind: "wool" })}
        </mesh>
        <mesh position={[0, 0.08, -0.14]} castShadow>
          <sphereGeometry args={[0.08, 6, 5]} />
          {lamb("#2a2418")}
        </mesh>
      </group>
    );
  }
  if (kind === "flowers" || kind === "veggies" || kind === "herbs") {
    const col = kind === "veggies" ? "#e07030" : kind === "herbs" ? "#3d8a42" : "#efe6d4";
    return (
      <group position={[0.02, -0.2, 0.08]}>
        <mesh rotation={[0.4, 0, 0.2]} castShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.12, 8]} />
          {lamb("#8a5a28", { kind: "wood" })}
        </mesh>
        <mesh position={[0, 0.08, 0]} castShadow>
          <sphereGeometry args={[0.07, 6, 5]} />
          {lamb(col)}
        </mesh>
      </group>
    );
  }
  if (kind === "pitchfork") {
    return (
      <group position={[0.04, -0.35, 0]} rotation={[0.2, 0, 0.15]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.02, 0.025, 0.9, 5]} />
          {lamb("#6a4a28", { kind: "wood" })}
        </mesh>
        {[-0.06, 0, 0.06].map((x) => (
          <mesh key={x} position={[x, -0.48, 0]} castShadow>
            <boxGeometry args={[0.02, 0.16, 0.02]} />
            {lamb("#c8c6c0", { kind: "metal" })}
          </mesh>
        ))}
      </group>
    );
  }
  if (kind === "flute") {
    return (
      <group position={[0.02, -0.12, 0.04]} rotation={[0.2, 0, 1.2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.018, 0.016, 0.42, 8]} />
          {lamb("#c4a06a", { kind: "wood" })}
        </mesh>
      </group>
    );
  }
  if (kind === "bread") {
    return (
      <group position={[0.02, -0.16, 0.08]}>
        <mesh rotation={[0.3, 0.2, 0.1]} castShadow>
          <capsuleGeometry args={[0.08, 0.16, 4, 8]} />
          {lamb("#c48a48", { kind: "cloth" })}
        </mesh>
      </group>
    );
  }
  if (kind === "net") {
    return (
      <group position={[0.04, -0.3, 0]} rotation={[0.15, 0, 0.1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.02, 0.025, 0.85, 5]} />
          {lamb("#6a4a28", { kind: "wood" })}
        </mesh>
        <mesh position={[0.08, -0.4, 0]} rotation={[0, 0, 0.4]}>
          <torusGeometry args={[0.1, 0.012, 5, 8]} />
          {lamb("#d8c48a")}
        </mesh>
      </group>
    );
  }
  if (kind === "scroll") {
    return (
      <group position={[0.02, -0.14, 0.06]} rotation={[0.4, 0.2, 0.3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.22, 8]} />
          {lamb("#efe6d4", { kind: "cloth" })}
        </mesh>
      </group>
    );
  }
  if (kind === "spear") {
    return (
      <group position={[0.05, -0.38, 0]} rotation={[0.15, 0, 0.12]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.02, 0.025, 1.05, 5]} />
          {lamb("#6a4a28", { kind: "wood" })}
        </mesh>
        <mesh position={[0, -0.58, 0]} castShadow>
          <coneGeometry args={[0.05, 0.16, 5]} />
          {lamb("#c8c6c0", { kind: "metal" })}
        </mesh>
      </group>
    );
  }
  if (kind === "book") {
    return (
      <group position={[0.02, -0.14, 0.08]} rotation={[0.4, 0.3, 0.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.04, 0.22]} />
          {lamb("#5a3a22", { kind: "leather" })}
        </mesh>
      </group>
    );
  }
  if (kind === "can") {
    return (
      <group position={[0.04, -0.18, 0.06]} rotation={[0.2, 0, 0.4]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.06, 0.05, 0.12, 6]} />
          {lamb("#6a7a78", { kind: "metal" })}
        </mesh>
        <mesh position={[0.1, 0.04, 0]} rotation={[0, 0, 1.2]}>
          <torusGeometry args={[0.05, 0.012, 5, 8, Math.PI]} />
          {lamb("#6a7a78", { kind: "metal" })}
        </mesh>
      </group>
    );
  }
  if (kind === "cloth") {
    return (
      <group position={[0.02, -0.16, 0.08]}>
        <mesh rotation={[0.5, 0.2, 0.3]} castShadow>
          <boxGeometry args={[0.16, 0.04, 0.22]} />
          {lamb("#8a3a38", { kind: "cloth" })}
        </mesh>
      </group>
    );
  }
  if (kind === "hammer") {
    return (
      <group position={[0.05, -0.22, 0]} rotation={[0.25, 0, 0.2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.02, 0.025, 0.55, 5]} />
          {lamb("#6a4a28", { kind: "wood" })}
        </mesh>
        <mesh position={[0, -0.28, 0]} castShadow>
          <boxGeometry args={[0.18, 0.1, 0.08]} />
          {lamb("#8a8a88", { kind: "metal" })}
        </mesh>
      </group>
    );
  }
  return null;
}

export function GoldTrim() {
  return (
    <group>
      <mesh position={[0, -0.22, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.38, 0.018, 5, 14]} />
        {lamb(GOLD, { kind: "metal" })}
      </mesh>
      <mesh position={[0, 0.48, -0.02]} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[0.16, 0.016, 5, 12]} />
        {lamb(GOLD, { kind: "metal" })}
      </mesh>
      {[-0.22, 0, 0.22].map((x) => (
        <mesh key={x} position={[x, -0.08, -0.32]}>
          <boxGeometry args={[0.08, 0.012, 0.012]} />
          {lamb(GOLD, { kind: "metal" })}
        </mesh>
      ))}
    </group>
  );
}

export function HandFingers({ skin }: { skin: string }) {
  const line = "#2a1810";
  const dark = shade(skin, -0.1);
  return (
    <group rotation={[0.55, 0, 0]}>
      <mesh scale={[1.12, 0.68, 1.22]} castShadow>
        <sphereGeometry args={[0.07, 8, 7]} />
        {lamb(skin, { kind: "skin" })}
      </mesh>
      <mesh position={[0, 0.01, -0.012]} scale={[0.98, 0.38, 0.72]}>
        <sphereGeometry args={[0.058, 6, 5]} />
        {lamb(dark, { kind: "skin" })}
      </mesh>
      <mesh position={[0.058, -0.012, 0.018]} rotation={[0.55, 0.85, 1.05]} scale={[0.62, 1.05, 0.58]} castShadow>
        <sphereGeometry args={[0.04, 7, 6]} />
        {lamb(skin, { kind: "skin" })}
      </mesh>
      <mesh position={[0.062, -0.028, 0.01]} rotation={[0.4, 0.7, 0.9]}>
        <boxGeometry args={[0.006, 0.028, 0.01]} />
        {lamb(line)}
      </mesh>
      <mesh position={[0, 0.048, 0.008]} rotation={[0.25, 0, 0]}>
        <cylinderGeometry args={[0.036, 0.044, 0.048, 7]} />
        {lamb(dark, { kind: "skin" })}
      </mesh>
      {[-0.024, 0, 0.024].map((x) => (
        <mesh key={`b${x}`} position={[x, -0.012, -0.068]} rotation={[0.12, 0, x * 3.2]}>
          <boxGeometry args={[0.008, 0.062, 0.012]} />
          {lamb(line)}
        </mesh>
      ))}
      {[-0.024, 0, 0.024].map((x) => (
        <mesh key={`f${x}`} position={[x, -0.008, 0.07]} rotation={[-0.08, 0, -x * 2.4]}>
          <boxGeometry args={[0.007, 0.05, 0.01]} />
          {lamb(line)}
        </mesh>
      ))}
      <mesh position={[0.004, -0.028, -0.05]} rotation={[0.5, 0.15, 1.15]}>
        <boxGeometry args={[0.006, 0.036, 0.01]} />
        {lamb(line)}
      </mesh>
    </group>
  );
}

export function HeroBoot({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.02, -0.02]} castShadow>
        <cylinderGeometry args={[0.095, 0.1, 0.18, 8]} />
        {lamb(color, { kind: "hair" })}
      </mesh>
      <mesh position={[0, -0.06, -0.08]} castShadow>
        <boxGeometry args={[0.18, 0.09, 0.28]} />
        {lamb(shade(color, -0.08))}
      </mesh>
      <mesh position={[0, -0.08, -0.2]} castShadow>
        <boxGeometry args={[0.16, 0.06, 0.12]} />
        {lamb(shade(color, -0.16))}
      </mesh>
      <mesh position={[0, 0.1, -0.02]} rotation={[0.15, 0, 0]}>
        <torusGeometry args={[0.09, 0.022, 5, 10]} />
        {lamb(shade(color, 0.12))}
      </mesh>
      {[-0.04, 0.04].map((x) => (
        <mesh key={x} position={[x, 0.02, -0.11]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.012, 0.08, 0.012]} />
          {lamb("#2a1810")}
        </mesh>
      ))}
    </group>
  );
}

export function wireMat(children: ReactNode, on: boolean) {
  void on;
  return children;
}

export function useWireframe(on: boolean) {
  return useMemo(() => on, [on]);
}

export const CREAM_SHIRT = CREAM;
export const LEATHER_COL = LEATHER;
export const GOLD_COL = GOLD;
