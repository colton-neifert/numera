import { useMemo, type ReactNode } from "react";
import * as THREE from "three";

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
};

import { lamb as matLamb } from "./mats";

/** Shared storybook material — skin, cloth, metal, and wood react to light differently. */
export function lamb(
  color: string,
  opts?: { kind?: import("./mats").MatKind; emissive?: string; emit?: number; map?: THREE.Texture | null },
) {
  return matLamb(color, opts);
}

function shade(hex: string, amt: number) {
  const c = new THREE.Color(hex);
  if (amt >= 0) c.lerp(new THREE.Color("#ffffff"), amt);
  else c.lerp(new THREE.Color("#1a100c"), -amt);
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
      <mesh position={[0, -0.48, 0]} castShadow>
        <octahedronGeometry args={[0.11, 0]} />
        {lamb("#e8eef4", { kind: "metal" })}
      </mesh>
      <mesh position={[0, -0.48, 0]} scale={[0.42, 3.15, 0.18]} castShadow>
        <octahedronGeometry args={[0.11, 0]} />
        {lamb(STEEL, { kind: "metal" })}
      </mesh>
      <mesh position={[0, -0.06, 0]} castShadow>
        <boxGeometry args={[0.26, 0.05, 0.1]} />
        {lamb(GOLD, { kind: "metal" })}
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.036, 0.22, 7]} />
        {lamb(LEATHER, { kind: "leather" })}
      </mesh>
      <mesh position={[0, 0.26, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <octahedronGeometry args={[0.042, 0]} />
        {lamb(GOLD, { kind: "metal" })}
      </mesh>
    </group>
  );
}

export function HeroShield({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.28, 0.06, 12]} />
        {lamb(WOOD_DARK, { kind: "wood" })}
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.014, 0]} castShadow>
        <cylinderGeometry args={[0.255, 0.24, 0.042, 12]} />
        {lamb(WOOD, { kind: "wood" })}
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <torusGeometry args={[0.255, 0.018, 6, 16]} />
        {lamb(GOLD, { kind: "metal" })}
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.038, 0]} rotation={[-0.15, (i * Math.PI) / 2, 0]}>
          <coneGeometry args={[0.055, 0.16, 3]} />
          {lamb(GOLD, { kind: "metal" })}
        </mesh>
      ))}
      <mesh position={[0, 0.042, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.03, 8]} />
        {lamb(GOLD, { kind: "metal" })}
      </mesh>
    </group>
  );
}

/** Wide wooden V matching the character sheet (and a Zelda-style returning boomerang). */
export function HeroBoom({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[-0.34, 0.1, 0]} rotation={[0.05, 0.08, 0.58]} castShadow>
        <boxGeometry args={[0.12, 0.62, 0.08]} />
        {lamb(WOOD, { kind: "wood" })}
      </mesh>
      <mesh position={[0.34, 0.1, 0]} rotation={[0.05, -0.08, -0.58]} castShadow>
        <boxGeometry args={[0.12, 0.62, 0.08]} />
        {lamb("#b89058", { kind: "wood" })}
      </mesh>
      <mesh position={[0, 0.0, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[0.16, 0.16, 0.09]} />
        {lamb("#a07840", { kind: "wood" })}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.58, 0.32, 0]} rotation={[0, 0, s * 0.58]} castShadow>
          <boxGeometry args={[0.14, 0.05, 0.1]} />
          {lamb(GOLD, { kind: "metal" })}
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`t${s}`} position={[s * 0.28, 0.12, 0.045]} rotation={[0, 0, s * 0.55]}>
          <coneGeometry args={[0.05, 0.1, 3]} />
          {lamb(GOLD, { kind: "metal" })}
        </mesh>
      ))}
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
}: {
  x: number;
  color: string;
  wide: number;
  lashes?: boolean;
}) {
  return (
    <group position={[x, 0.82, -0.29]}>
      <mesh scale={[1.15 * wide, 1.22, 0.62]} castShadow>
        <sphereGeometry args={[0.072, 10, 8]} />
        {lamb("#fff8f2", { kind: "eye" })}
      </mesh>
      <mesh position={[0, -0.004, -0.038]} scale={[0.95, 1.05, 0.7]}>
        <sphereGeometry args={[0.042, 10, 8]} />
        {lamb(color, { kind: "eye" })}
      </mesh>
      <mesh position={[0, -0.004, -0.058]}>
        <sphereGeometry args={[0.022, 8, 6]} />
        {lamb("#1a120e", { kind: "eye" })}
      </mesh>
      <mesh position={[0.014, 0.016, -0.068]}>
        <sphereGeometry args={[0.012, 6, 5]} />
        {lamb("#ffffff", { kind: "metal" })}
      </mesh>
      {lashes ? (
        <>
          <mesh position={[-0.04, 0.055, -0.02]} rotation={[0.3, 0.4, 0.55]} scale={[0.5, 1, 0.4]}>
            <capsuleGeometry args={[0.01, 0.04, 2, 5]} />
            {lamb("#2a1c14")}
          </mesh>
          <mesh position={[0, 0.062, -0.03]} rotation={[0.45, 0, 0]} scale={[0.45, 1, 0.4]}>
            <capsuleGeometry args={[0.01, 0.045, 2, 5]} />
            {lamb("#2a1c14")}
          </mesh>
          <mesh position={[0.04, 0.055, -0.02]} rotation={[0.3, -0.4, -0.55]} scale={[0.5, 1, 0.4]}>
            <capsuleGeometry args={[0.01, 0.04, 2, 5]} />
            {lamb("#2a1c14")}
          </mesh>
        </>
      ) : null}
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
  const wide = look.eyeShape === "wide" ? 1.12 : look.eyeShape === "narrow" ? 0.82 : look.eyeShape === "sharp" ? 0.92 : 1;
  return (
    <group>
      <mesh position={[0, 0.78, 0.02]} scale={[1.05, 1.02, 0.98]} castShadow>
        <sphereGeometry args={[0.32, 16, 14]} />
        {lamb(skin, { kind: "skin" })}
      </mesh>
      <mesh position={[0, 0.7, -0.12]} scale={[0.92, 0.78, 0.85]} castShadow>
        <sphereGeometry args={[0.22, 12, 10]} />
        {lamb(skin, { kind: "skin" })}
      </mesh>
      <mesh position={[0, 0.92, 0.02]} scale={[0.95, 0.55, 0.9]}>
        <sphereGeometry args={[0.22, 12, 8]} />
        {lamb(skin, { kind: "skin" })}
      </mesh>
      <mesh position={[-0.3, 0.76, 0.02]} rotation={[0.1, 0.15, 0.35]} scale={[0.55, 0.85, 0.7]} castShadow>
        <sphereGeometry args={[0.09, 8, 6]} />
        {lamb(skin, { kind: "skin" })}
      </mesh>
      <mesh position={[0.3, 0.76, 0.02]} rotation={[0.1, -0.15, -0.35]} scale={[0.55, 0.85, 0.7]} castShadow>
        <sphereGeometry args={[0.09, 8, 6]} />
        {lamb(skin, { kind: "skin" })}
      </mesh>
      <mesh position={[0, 0.72, -0.3]} rotation={[0.35, 0, 0]} scale={[0.7, 0.85, 1.15]} castShadow>
        <sphereGeometry args={[0.048, 8, 6]} />
        {lamb(shade(skin, -0.06), { kind: "skin" })}
      </mesh>
      {look.blush ? (
        <>
          <mesh position={[-0.14, 0.68, -0.255]} rotation={[0.15, 0.4, 0]}>
            <circleGeometry args={[0.055, 10]} />
            <meshLambertMaterial color={look.blush} transparent opacity={(look.blushAmt ?? 0.6) * 0.45} depthWrite={false} />
          </mesh>
          <mesh position={[0.14, 0.68, -0.255]} rotation={[0.15, -0.4, 0]}>
            <circleGeometry args={[0.055, 10]} />
            <meshLambertMaterial color={look.blush} transparent opacity={(look.blushAmt ?? 0.6) * 0.45} depthWrite={false} />
          </mesh>
        </>
      ) : null}
      <group ref={whites}>
        <Eye x={-0.1} color={look.eyes ?? "#3a2418"} wide={wide} lashes={girl} />
        <Eye x={0.1} color={look.eyes ?? "#3a2418"} wide={wide} lashes={girl} />
      </group>
      <group ref={lids} visible={false}>
        <mesh position={[-0.1, 0.82, -0.3]} scale={[1.2, 0.45, 0.7]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          {lamb(skin, { kind: "skin" })}
        </mesh>
        <mesh position={[0.1, 0.82, -0.3]} scale={[1.2, 0.45, 0.7]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          {lamb(skin, { kind: "skin" })}
        </mesh>
      </group>
      <mesh position={[-0.1, 0.94, -0.26]} rotation={[0.15, 0.2, girl ? 0.18 : -0.12]} castShadow>
        <boxGeometry args={[0.1, girl ? 0.016 : 0.02, 0.02]} />
        {lamb("#2a1c14")}
      </mesh>
      <mesh position={[0.1, 0.94, -0.26]} rotation={[0.15, -0.2, girl ? -0.18 : 0.12]} castShadow>
        <boxGeometry args={[0.1, girl ? 0.016 : 0.02, 0.02]} />
        {lamb("#2a1c14")}
      </mesh>
      {look.mouth === "smile" ? (
        <mesh position={[0, 0.6, -0.292]} rotation={[1.2, 0, 0]} scale={[1.25, 0.42, 1]}>
          <torusGeometry args={[0.042, 0.008, 6, 12, Math.PI]} />
          {lamb("#8a3a38")}
        </mesh>
      ) : look.mouth === "frown" ? (
        <mesh position={[0, 0.62, -0.292]} rotation={[-1.2, 0, Math.PI]} scale={[1.15, 0.4, 1]}>
          <torusGeometry args={[0.036, 0.008, 6, 12, Math.PI]} />
          {lamb("#8a3a38")}
        </mesh>
      ) : look.mouth === "none" ? null : (
        <mesh position={[0, 0.612, -0.3]}>
          <boxGeometry args={[0.07, 0.012, 0.016]} />
          {lamb("#6a3028")}
        </mesh>
      )}
    </group>
  );
}

const BOY_CURLS: [number, number, number, number, number, number, number][] = [
  [0, 0.22, 0.04, 1.22, 0.72, 1.18, 0.3],
  [0, 0.12, 0.22, 1.08, 0.85, 0.78, 0.24],
  [-0.22, 0.14, 0.08, 0.78, 0.95, 0.82, 0.2],
  [0.22, 0.14, 0.08, 0.78, 0.95, 0.82, 0.2],
  [-0.16, 0.2, -0.16, 0.7, 0.65, 0.72, 0.16],
  [0.16, 0.2, -0.16, 0.7, 0.65, 0.72, 0.16],
  [0, 0.32, 0.0, 0.95, 0.48, 0.9, 0.2],
  [-0.12, 0.08, 0.26, 0.55, 0.7, 0.55, 0.13],
  [0.12, 0.08, 0.26, 0.55, 0.7, 0.55, 0.13],
  [-0.26, 0.02, 0.12, 0.5, 0.72, 0.55, 0.12],
  [0.26, 0.02, 0.12, 0.5, 0.72, 0.55, 0.12],
  [-0.2, 0.06, -0.2, 0.48, 0.55, 0.5, 0.11],
  [0.2, 0.06, -0.2, 0.48, 0.55, 0.5, 0.11],
  [0, 0.04, -0.24, 0.7, 0.45, 0.48, 0.12],
  [-0.08, 0.24, 0.16, 0.45, 0.42, 0.45, 0.1],
  [0.08, 0.24, 0.16, 0.45, 0.42, 0.45, 0.1],
];

export function BoyHair({ color }: { color: string }) {
  const hi = shade(color, 0.12);
  const lo = shade(color, -0.18);
  return (
    <group position={[0, 0.78, 0.02]}>
      {BOY_CURLS.map((c, i) => (
        <mesh
          key={i}
          position={[c[0], c[1], c[2]]}
          scale={[c[3], c[4], c[5]]}
          rotation={[c[2] * 0.4, i * 0.4, c[0] * 0.3]}
          castShadow
        >
          <sphereGeometry args={[c[6], 8, 7]} />
          {lamb(i % 3 === 0 ? lo : i % 3 === 1 ? color : hi, { kind: "hair" })}
        </mesh>
      ))}
    </group>
  );
}

export function GirlHair({ color }: { color: string }) {
  const hi = shade(color, 0.1);
  const lo = shade(color, -0.16);
  return (
    <group>
      <mesh position={[0, 1.0, 0.04]} scale={[1.18, 0.62, 1.12]} castShadow>
        <sphereGeometry args={[0.3, 12, 10]} />
        {lamb(color, { kind: "hair" })}
      </mesh>
      <mesh position={[0, 0.92, 0.18]} scale={[1.05, 0.7, 0.72]} castShadow>
        <sphereGeometry args={[0.24, 10, 8]} />
        {lamb(hi, { kind: "hair" })}
      </mesh>
      <mesh position={[-0.22, 0.86, 0.06]} scale={[0.7, 1.05, 0.78]} castShadow>
        <sphereGeometry args={[0.18, 10, 8]} />
        {lamb(color, { kind: "hair" })}
      </mesh>
      <mesh position={[0.22, 0.86, 0.06]} scale={[0.7, 1.05, 0.78]} castShadow>
        <sphereGeometry args={[0.18, 10, 8]} />
        {lamb(color, { kind: "hair" })}
      </mesh>
      <mesh position={[0, 0.88, -0.18]} scale={[0.95, 0.45, 0.55]} castShadow>
        <sphereGeometry args={[0.16, 8, 6]} />
        {lamb(lo, { kind: "hair" })}
      </mesh>
      <mesh position={[-0.1, 0.86, -0.24]} rotation={[0.45, 0.25, 0.15]} castShadow>
        <capsuleGeometry args={[0.045, 0.1, 3, 6]} />
        {lamb(color, { kind: "hair" })}
      </mesh>
      <mesh position={[0.1, 0.86, -0.24]} rotation={[0.45, -0.25, -0.15]} castShadow>
        <capsuleGeometry args={[0.045, 0.1, 3, 6]} />
        {lamb(color, { kind: "hair" })}
      </mesh>
      <group position={[0.16, 0.78, 0.16]} rotation={[0.55, -0.35, -0.45]}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <mesh key={i} position={[0, -i * 0.11, i * 0.012]} rotation={[0.08, 0.15, 0.05]} castShadow>
            <capsuleGeometry args={[0.055 - i * 0.003, 0.08, 3, 7]} />
            {lamb(i % 2 ? color : lo)}
          </mesh>
        ))}
        <mesh position={[0, -0.92, 0.08]} castShadow>
          <sphereGeometry args={[0.055, 8, 6]} />
          {lamb(hi, { kind: "hair" })}
        </mesh>
        <mesh position={[0, -0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.06, 0.012, 5, 10]} />
          {lamb("#3d8a68")}
        </mesh>
      </group>
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
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.055, 7, 6]} />
        {lamb(skin, { kind: "skin" })}
      </mesh>
      {[-0.035, 0, 0.035].map((x) => (
        <mesh key={x} position={[x, -0.055, 0.01]} rotation={[0.35, 0, x * 2]} castShadow>
          <capsuleGeometry args={[0.016, 0.04, 2, 5]} />
          {lamb(skin, { kind: "skin" })}
        </mesh>
      ))}
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
      <mesh position={[0, 0.1, -0.02]} rotation={[0.15, 0, 0]}>
        <torusGeometry args={[0.09, 0.022, 5, 10]} />
        {lamb(shade(color, 0.12))}
      </mesh>
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
