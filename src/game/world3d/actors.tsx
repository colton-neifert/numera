import { useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../store";
import { heightAt, vWorld, VX, VZ, ORCHARD_TREE, ORCHARD_LADDER, ORCHARD_STAND, pondU } from "./field";
import { applesLeft, treeKey } from "./n64";
import { live } from "./live";
import { collideHouses } from "./house";
import { sfx } from "../audio";
import { revealItem } from "../items";
import { HP_PER_HEART } from "../components/Hud";
import { puffAt } from "./fx";
import {
  BoyHair,
  GirlHair,
  GoldTrim,
  HandFingers,
  HeroBelt,
  HeroBoom,
  HeroBomb,
  HeroBoot,
  HeroBracer,
  HeroHead,
  HeroSatchel,
  HeroScarf,
  HeroShield,
  HeroSword,
  NpcHair,
  NpcOutfit,
  NpcProp,
  CREAM_SHIRT,
  lamb as heroLamb,
} from "./heroes";
import { GroundBlob } from "./mats";

export type FighterAct = "idle" | "hop" | "slam" | "hurt";

export type HumanLook = {
  tunic: string;
  sash: string;
  cap?: string;
  hair: string;
  skin: string;
  boots: string;
  pants: string;
  longHair?: boolean;
  eyes?: string;
  eyeShape?: string;
  lashes?: string;
  mouth?: string;
  nose?: string;
  brows?: string;
  blush?: string;
  blushAmt?: number;
  stoop?: number;
  beard?: boolean;
  shirt?: string;
  apron?: string;
  kit?: "apron" | "overalls" | "vest" | "robe" | "cloak" | "guard" | "pinafore" | "dress" | "scholar";
  prop?: "lamb" | "flowers" | "pitchfork" | "flute" | "bread" | "net" | "scroll" | "veggies" | "herbs" | "cloth" | "spear" | "book" | "can";
  kerchief?: string;
  glasses?: boolean;
  mustache?: boolean;
  hat?: string;
  hairStyle?: string;
};

export const HERO_LOOK: HumanLook = {
  tunic: "#2f7a38",
  sash: "#c9a227",
  hair: "#6a4224",
  skin: "#e8b898",
  boots: "#6a4a28",
  pants: "#4a3828",
  mouth: "smile",
  brows: "neutral",
  eyes: "#3a2418",
  eyeShape: "wide",
  nose: "round",
  blush: "#e8a090",
  blushAmt: 0.55,
};

export const HERO_GIRL_LOOK: HumanLook = {
  tunic: "#3a7088",
  sash: "#c45c38",
  hair: "#6a3a22",
  skin: "#e8b898",
  boots: "#6a4a28",
  pants: "#4a3828",
  longHair: true,
  mouth: "smile",
  brows: "neutral",
  eyes: "#3a2418",
  eyeShape: "wide",
  lashes: "long",
  nose: "round",
  blush: "#e8a090",
  blushAmt: 0.62,
};

function lamb(color: string, opts?: { emissive?: string; emit?: number; map?: THREE.Texture | null; kind?: import("./mats").MatKind }) {
  return heroLamb(color, opts);
}

function HeroPointedCap({ color }: { color: string }) {
  const tail = useRef<THREE.Group>(null);
  const flop = useRef(0);
  const sway = useRef(0);
  useFrame((_, dt) => {
    const walk = live.speed > 0.2 || live.sliding;
    flop.current += ((walk ? 1 : 0) - flop.current) * Math.min(1, dt * 3.2);
    const t = performance.now() * 0.001;
    const want = Math.sin(t * 2.05) * flop.current * 0.22;
    sway.current += (want - sway.current) * Math.min(1, dt * 3.4);
    if (tail.current) {
      tail.current.rotation.x = 2.68 + Math.sin(t * 2.05) * flop.current * 0.04;
      tail.current.rotation.y = -0.05;
      tail.current.rotation.z = 0.12 + sway.current;
    }
  });
  return (
    <group position={[0, 1.04, 0.02]}>
      <mesh position={[0, 0.02, 0.02]} scale={[1.14, 0.78, 1.18]} castShadow>
        <sphereGeometry args={[0.24, 14, 12]} />
        {lamb(color)}
      </mesh>
      <mesh position={[0.02, 0.12, 0.06]} scale={[0.88, 0.62, 0.92]} castShadow>
        <sphereGeometry args={[0.2, 12, 10]} />
        {lamb(color)}
      </mesh>
      <group ref={tail} position={[0.03, 0.1, 0.08]} rotation={[2.68, -0.05, 0.12]}>
        <mesh position={[0, 0.04, 0]} castShadow>
          <sphereGeometry args={[0.16, 12, 10]} />
          {lamb(color)}
        </mesh>
        <mesh position={[0, 0.2, 0]} rotation={[0.06, 0, 0]} castShadow>
          <capsuleGeometry args={[0.135, 0.18, 4, 10]} />
          {lamb(color)}
        </mesh>
        <mesh position={[0, 0.44, 0]} rotation={[0.05, 0, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.26, 4, 10]} />
          {lamb(color)}
        </mesh>
        <mesh position={[0, 0.74, 0]} rotation={[0.04, 0, 0]} castShadow>
          <capsuleGeometry args={[0.085, 0.32, 4, 10]} />
          {lamb(color)}
        </mesh>
        <mesh position={[0, 1.08, 0]} rotation={[0.03, 0, 0]} castShadow>
          <capsuleGeometry args={[0.062, 0.34, 4, 10]} />
          {lamb(color)}
        </mesh>
        <mesh position={[0, 1.42, 0]} rotation={[0.02, 0, 0]} castShadow>
          <capsuleGeometry args={[0.042, 0.32, 4, 8]} />
          {lamb(color)}
        </mesh>
        <mesh position={[0, 1.68, 0]} rotation={[0.02, 0, 0]} castShadow>
          <capsuleGeometry args={[0.026, 0.16, 3, 8]} />
          {lamb(color)}
        </mesh>
      </group>
    </group>
  );
}

function HeroHair({ color, long }: { color: string; long?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.88, 0.05]} scale={[1.22, 0.78, 1.18]} castShadow>
        <sphereGeometry args={[0.285, 12, 10]} />
        {lamb(color)}
      </mesh>
      <mesh position={[0, 0.78, 0.2]} scale={[1.12, 0.92, 0.85]} castShadow>
        <sphereGeometry args={[0.22, 10, 8]} />
        {lamb(color)}
      </mesh>
      <mesh position={[-0.2, 0.8, 0.04]} scale={[0.72, 0.95, 0.88]} castShadow>
        <sphereGeometry args={[0.17, 10, 8]} />
        {lamb(color)}
      </mesh>
      <mesh position={[0.2, 0.8, 0.04]} scale={[0.72, 0.95, 0.88]} castShadow>
        <sphereGeometry args={[0.17, 10, 8]} />
        {lamb(color)}
      </mesh>
      <mesh position={[0, 1.02, 0.02]} scale={[0.95, 0.42, 0.9]} castShadow>
        <sphereGeometry args={[0.18, 10, 8]} />
        {lamb(color)}
      </mesh>
      <mesh position={[-0.08, 0.86, -0.2]} rotation={[0.35, 0.25, 0.2]} scale={[0.7, 0.45, 0.85]} castShadow>
        <sphereGeometry args={[0.12, 8, 7]} />
        {lamb(color)}
      </mesh>
      <mesh position={[0.08, 0.86, -0.2]} rotation={[0.35, -0.25, -0.2]} scale={[0.7, 0.45, 0.85]} castShadow>
        <sphereGeometry args={[0.12, 8, 7]} />
        {lamb(color)}
      </mesh>
      {long ? (
        <>
          <mesh position={[-0.2, 0.58, 0.12]} rotation={[0.55, 0.2, 0.18]} castShadow>
            <capsuleGeometry args={[0.055, 0.28, 4, 8]} />
            {lamb(color)}
          </mesh>
          <mesh position={[0.2, 0.58, 0.12]} rotation={[0.55, -0.2, -0.18]} castShadow>
            <capsuleGeometry args={[0.055, 0.28, 4, 8]} />
            {lamb(color)}
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[-0.18, 0.68, 0.14]} rotation={[0.4, 0.15, 0.15]} scale={[0.7, 0.85, 0.7]} castShadow>
            <sphereGeometry args={[0.1, 8, 7]} />
            {lamb(color)}
          </mesh>
          <mesh position={[0.18, 0.68, 0.14]} rotation={[0.4, -0.15, -0.15]} scale={[0.7, 0.85, 0.7]} castShadow>
            <sphereGeometry args={[0.1, 8, 7]} />
            {lamb(color)}
          </mesh>
        </>
      )}
    </group>
  );
}

function FaceEyes({ shape, color, whites, lids, skin }: { shape: string; color: string; whites: React.RefObject<THREE.Group | null>; lids: React.RefObject<THREE.Group | null>; skin: string }) {
  const a = shape === "narrow" ? 1.22 : shape === "wide" ? 1.5 : shape === "sharp" ? 1.38 : 1.34;
  const o = shape === "narrow" ? 0.72 : shape === "wide" ? 1.34 : shape === "sharp" ? 0.82 : 1.06;
  return (
    <>
      <group ref={whites}>
        <mesh position={[-0.096, 0.812, -0.3]} scale={[a, o, 0.68]}>
          <sphereGeometry args={[0.058, 8, 6]} />
          {lamb("#fff8f0")}
        </mesh>
        <mesh position={[0.096, 0.812, -0.3]} scale={[a, o, 0.68]}>
          <sphereGeometry args={[0.058, 8, 6]} />
          {lamb("#fff8f0")}
        </mesh>
        <mesh position={[-0.096, 0.81, -0.33]} scale={[1.02, 1.12, 0.82]}>
          <sphereGeometry args={[0.034, 8, 6]} />
          {lamb(color)}
        </mesh>
        <mesh position={[0.096, 0.81, -0.33]} scale={[1.02, 1.12, 0.82]}>
          <sphereGeometry args={[0.034, 8, 6]} />
          {lamb(color)}
        </mesh>
        <mesh position={[-0.096, 0.81, -0.348]}>
          <sphereGeometry args={[0.02, 6, 5]} />
          {lamb("#1a1410")}
        </mesh>
        <mesh position={[0.096, 0.81, -0.348]}>
          <sphereGeometry args={[0.02, 6, 5]} />
          {lamb("#1a1410")}
        </mesh>
        <mesh position={[-0.082, 0.826, -0.354]}>
          <sphereGeometry args={[0.011, 5, 4]} />
          {lamb("#ffffff")}
        </mesh>
        <mesh position={[0.11, 0.826, -0.354]}>
          <sphereGeometry args={[0.011, 5, 4]} />
          {lamb("#ffffff")}
        </mesh>
      </group>
      <group ref={lids} visible={false}>
        <mesh position={[-0.096, 0.812, -0.31]} scale={[a, 0.45, 0.7]}>
          <sphereGeometry args={[0.055, 8, 6]} />
          {lamb(skin)}
        </mesh>
        <mesh position={[0.096, 0.812, -0.31]} scale={[a, 0.45, 0.7]}>
          <sphereGeometry args={[0.055, 8, 6]} />
          {lamb(skin)}
        </mesh>
      </group>
    </>
  );
}

function FaceNose({ kind, skin }: { kind: string; skin: string }) {
  if (kind === "line") {
    return (
      <mesh position={[0, 0.732, -0.318]} rotation={[0.55, 0, 0]}>
        <boxGeometry args={[0.016, 0.052, 0.012]} />
        {lamb("#3a241c")}
      </mesh>
    );
  }
  if (kind === "pointy") {
    return (
      <mesh position={[0, 0.728, -0.3]} rotation={[-Math.PI / 2.15, 0, 0]} castShadow>
        <coneGeometry args={[0.03, 0.072, 6]} />
        {lamb(skin)}
      </mesh>
    );
  }
  return (
    <mesh position={[0, 0.726, -0.312]} scale={[0.82, 0.88, 1.2]} castShadow>
      <sphereGeometry args={[0.036, 7, 6]} />
      {lamb(skin)}
    </mesh>
  );
}

function FaceBrows({ kind, bushy }: { kind: string; bushy: boolean }) {
  if (kind === "none") return null;
  const y = kind === "mad" ? 0.868 : kind === "raised" ? 0.892 : kind === "worried" ? 0.88 : kind === "sad" ? 0.876 : 0.872;
  const x = kind === "mad" ? 0.09 : 0.1;
  let lz = -0.12;
  let rz = 0.12;
  if (kind === "mad") {
    lz = -0.48;
    rz = 0.48;
  } else if (kind === "sad") {
    lz = 0.42;
    rz = -0.42;
  } else if (kind === "worried") {
    lz = 0.32;
    rz = -0.32;
  } else if (kind === "raised") {
    lz = 0.18;
    rz = -0.18;
  }
  const h = bushy ? (kind === "mad" ? 0.04 : 0.034) : kind === "mad" ? 0.02 : 0.016;
  const w = bushy ? 0.112 : 0.094;
  const d = bushy ? 0.028 : 0.018;
  return (
    <group>
      <mesh position={[-x, y, -0.305]} rotation={[0.08, 0.1, lz]}>
        <boxGeometry args={[w, h, d]} />
        {lamb("#2a1c14")}
      </mesh>
      <mesh position={[x, y, -0.305]} rotation={[0.08, -0.1, rz]}>
        <boxGeometry args={[w, h, d]} />
        {lamb("#2a1c14")}
      </mesh>
    </group>
  );
}

function FaceMouth({ kind }: { kind: string }) {
  if (kind === "none") return null;
  if (kind === "smile") {
    return (
      <mesh position={[0, 0.638, -0.3]} rotation={[1.15, 0, 0]} scale={[1.2, 0.42, 1]}>
        <torusGeometry args={[0.038, 0.007, 5, 10, Math.PI]} />
        {lamb("#3a241c")}
      </mesh>
    );
  }
  if (kind === "frown") {
    return (
      <mesh position={[0, 0.66, -0.3]} rotation={[-1.15, 0, Math.PI]} scale={[1.15, 0.42, 1]}>
        <torusGeometry args={[0.034, 0.007, 5, 10, Math.PI]} />
        {lamb("#3a241c")}
      </mesh>
    );
  }
  return (
    <mesh position={[0, 0.648, -0.305]} rotation={[-0.08, 0, 0]}>
      <boxGeometry args={[0.07, 0.01, 0.014]} />
      {lamb("#3a241c")}
    </mesh>
  );
}

function OldRoundShield() {
  return <HeroShield />;
}

export function Humanoid({
  look,
  hero,
  act,
  kid,
  chore,
  gait,
  scare,
  talking,
  wave,
  mad,
  sitPose,
  warm,
}: {
  look: HumanLook;
  hero?: boolean;
  act?: FighterAct;
  kid?: boolean;
  chore?: "pick";
  gait?: { current: boolean };
  scare?: { current: boolean };
  talking?: boolean;
  wave?: { current: boolean };
  mad?: { current: boolean };
  sitPose?: { current: boolean };
  warm?: { current: boolean };
  sleep?: { current: boolean };
  stomp?: { current: boolean };
  moodId?: string;
  climb?: { current: number };
  holdSword?: boolean;
  swordSwing?: { current: number };
  swordSpin?: { current: boolean };
  holdTray?: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Group>(null);
  const lArm = useRef<THREE.Group>(null);
  const rArm = useRef<THREE.Group>(null);
  const lFore = useRef<THREE.Group>(null);
  const rFore = useRef<THREE.Group>(null);
  const lLeg = useRef<THREE.Group>(null);
  const rLeg = useRef<THREE.Group>(null);
  const lShin = useRef<THREE.Group>(null);
  const rShin = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const blade = useRef<THREE.Group>(null);
  const axe = useRef<THREE.Group>(null);
  const bow = useRef<THREE.Group>(null);
  const sling = useRef<THREE.Group>(null);
  const boom = useRef<THREE.Group>(null);
  const bomb = useRef<THREE.Group>(null);
  const shield = useRef<THREE.Group>(null);
  const shieldUpG = useRef<THREE.Group>(null);
  const sheath = useRef<THREE.Group>(null);
  const flute = useRef<THREE.Group>(null);
  const rockG = useRef<THREE.Mesh>(null);
  const whites = useRef<THREE.Group>(null);
  const lids = useRef<THREE.Group>(null);
  const notes = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const hopY = useRef(0);
  const armLerp = useRef(0);
  const blink = useRef(2.4);

  const hatOn = Boolean(look.cap && look.cap !== "none");
  void hatOn;
  const girl = Boolean(look.longHair);
  const sit = (hero && live.sit) || Boolean(sitPose?.current);
  const warming = sit && ((hero && Boolean(live.sitAt?.warm)) || Boolean(warm?.current));
  const bodyCloth = hero ? look.tunic : look.shirt ?? look.tunic;

  useFrame((_, dt) => {
    if (!root.current) return;
    const riding = Boolean(hero && live.mounted);
    const view = Boolean(hero && live.charView);
    const viewA = view ? live.viewerAnim : "";
    const walk =
      !act &&
      !riding &&
      ((hero && (view ? viewA === "walk" || viewA === "run" || viewA === "sprint" : live.speed > 0.4) && !live.rolling && live.grounded) ||
        Boolean(gait?.current) ||
        viewA === "walk" ||
        viewA === "run" ||
        viewA === "sprint");
    const hold = hero
      ? viewA === "boom"
        ? "boom"
        : viewA === "bomb"
          ? "bomb"
          : viewA === "bow"
            ? "bow"
            : viewA === "block"
              ? "shield"
              : live.holding
      : "";
    const swing = Boolean((hero && live.swinging && !act) || viewA === "swing");
    const swim = Boolean(hero && live.swim && !act);
    const scared = Boolean(scare?.current && !act && !hero);

    if (blade.current) blade.current.visible = Boolean(hero) && !riding && !live.ocarina && !live.getItem && hold === "sword";
    if (axe.current) axe.current.visible = Boolean(hero) && !riding && !live.getItem && hold === "axe";
    if (bow.current) bow.current.visible = Boolean(hero) && !riding && !live.getItem && hold === "bow";
    if (sling.current) sling.current.visible = Boolean(hero) && !riding && !live.getItem && hold === "sling";
    if (boom.current) boom.current.visible = Boolean(hero) && !riding && !live.getItem && hold === "boom" && live.booms.length === 0;
    if (bomb.current) bomb.current.visible = Boolean(hero) && !riding && !live.getItem && hold === "bomb" && live.bombs.length === 0;
    if (sheath.current) sheath.current.visible = Boolean(hero && (riding || hold === "shield") && live.hasSword);
    if (shieldUpG.current) shieldUpG.current.visible = Boolean(hero && !riding && live.hasShield && live.shieldUp);
    if (shield.current) shield.current.visible = Boolean(hero && live.hasShield && (!live.shieldUp || riding));
    if (flute.current) flute.current.visible = Boolean(hero && live.ocarina);

    phase.current += dt * (riding ? 10.8 : scared ? 11.5 : walk ? 9.4 + (viewA === "sprint" ? 9 : viewA === "run" ? 5.5 : live.speed) * 0.55 : 1.45);
    const ce = walk ? Math.sin(phase.current) : 0;
    const breath = Math.sin(phase.current) * (walk ? 0.018 : 0.04);
    const hopping = act === "hop" || viewA === "jump";
    const slam = act === "slam" || viewA === "land";
    const hurt = act === "hurt" || Boolean(hero && live.heroFlash > 0.4) || viewA === "hurt";
    hopY.current += ((hopping ? 0.92 : slam ? 0 : hurt ? 0.08 : 0) - hopY.current) * (1 - Math.exp(-dt * (slam ? 22 : 10)));
    const wantArm = hopping ? -2.35 : slam ? 1.25 : hurt ? 0.4 : ce * 0.75;
    armLerp.current += (wantArm - armLerp.current) * (1 - Math.exp(-dt * 14));

    const setArms = (lx: number, ly: number, lz: number, rx: number, ry: number, rz: number) => {
      if (lArm.current) lArm.current.rotation.set(lx, ly, lz);
      if (rArm.current) rArm.current.rotation.set(rx, ry, rz);
    };

    if (hero && live.swim && !act) {
      const e = Math.sin(phase.current * (live.under ? 2.2 : 1.35));
      setArms(-1.2 + e * 0.62, 0.1, 0.55, -1.2 - e * 0.62, -0.1, -0.55);
      if (lFore.current) lFore.current.rotation.set(0.45, 0, 0);
      if (rFore.current) rFore.current.rotation.set(0.45, 0, 0);
      if (lLeg.current) lLeg.current.rotation.set(0.62 + e * 0.85, 0, 0.1);
      if (rLeg.current) rLeg.current.rotation.set(0.62 - e * 0.85, 0, -0.1);
      root.current.rotation.x = live.under ? 1.05 : 0.38;
      root.current.position.y = hopY.current;
      return;
    }

    if (sit && !act) {
      if (warming) setArms(-1.05, 0.08, 0.22, -1.02, -0.08, -0.22);
      else setArms(-0.22, 0.08, 0.32, -0.18, -0.08, -0.32);
      if (lFore.current) lFore.current.rotation.set(-0.35, 0, 0);
      if (rFore.current) rFore.current.rotation.set(-0.32, 0, 0);
      if (lLeg.current) {
        lLeg.current.position.set(-0.13, 0.42, -0.12);
        lLeg.current.rotation.set(-1.18, 0.06, 0.08);
      }
      if (rLeg.current) {
        rLeg.current.position.set(0.13, 0.42, -0.12);
        rLeg.current.rotation.set(-1.15, -0.06, -0.08);
      }
      if (torso.current) torso.current.position.y = 0.36;
      root.current.rotation.x = 0.12;
      root.current.position.y = 0.02;
      return;
    }

    if ((hero && live.getItem && !act) || viewA === "item") {
      setArms(-2.88, -0.12, -0.18, -2.92, 0.12, 0.18);
      if (torso.current) torso.current.position.y = 0.7;
      root.current.rotation.x = -0.48;
      root.current.position.y = 0.04;
      return;
    }

    if ((hero && (live.rolling || live.sliding) && !act) || viewA === "roll") {
      const e = live.sliding ? live.slideU : live.rollU;
      const t = live.sliding ? 1.05 : e * Math.PI * 2;
      setArms(live.sliding ? -0.55 : 1.5, 0, live.sliding ? 0.85 : 0.55, live.sliding ? 0.95 : 1.5, 0, live.sliding ? -0.35 : -0.55);
      if (lLeg.current) lLeg.current.rotation.set(live.sliding ? 0.25 : 1.65, 0, 0.2);
      if (rLeg.current) rLeg.current.rotation.set(live.sliding ? 1.45 : 1.65, 0, -0.2);
      root.current.rotation.x = t;
      root.current.position.y = live.sliding ? 0.08 : Math.sin(e * Math.PI) * 0.62;
      return;
    }

    if (hero && hold === "bomb" && !act && !swing) {
      const wind = Math.min(1, Math.max(0, live.bombWind));
      if (lLeg.current) {
        lLeg.current.position.set(-0.14, 0.52, 0);
        lLeg.current.rotation.set(walk ? Math.sin(phase.current) * 0.7 : 0.1, 0, 0.04);
      }
      if (rLeg.current) {
        rLeg.current.position.set(0.14, 0.52, 0);
        rLeg.current.rotation.set(walk ? -Math.sin(phase.current) * 0.7 : 0.08, 0, -0.04);
      }
      setArms(-2.72 - wind * 0.28, 0.12 + wind * 0.2, 0.35 + wind * 0.45, -2.72 - wind * 0.95, -0.18, -0.35 - wind * 0.85);
      if (lFore.current) lFore.current.rotation.set(-0.35 - wind * 0.15, 0.15, 0.2);
      if (rFore.current) rFore.current.rotation.set(-0.35 - wind * 0.55, -0.15, -0.2 - wind * 0.35);
      if (torso.current) {
        torso.current.position.y = 0.58;
        torso.current.rotation.set(-0.08 - wind * 0.22, 0, wind * 0.18);
      }
      root.current.rotation.x = -0.06 - wind * 0.12;
      root.current.position.y = 0;
      return;
    }

    if (swing) {
      const t = live.swingU;
      if (rArm.current) rArm.current.rotation.set(-0.55 + Math.sin(t * Math.PI) * 2.45, (t - 0.45) * 1.8, t < 0.4 ? 1.15 : -0.55);
      if (lArm.current) lArm.current.rotation.set(0.25, 0, -0.28);
      root.current.rotation.y = Math.sin(t * Math.PI) * 0.35;
      root.current.rotation.x = look.stoop ?? 0;
      root.current.position.y = 0;
      return;
    }

    if (hero && live.charging && !act) {
      if (rArm.current) rArm.current.rotation.set(0.85 + live.chargeU * 0.4, -0.55, 1.15);
      if (lArm.current) lArm.current.rotation.set(0.45, 0, -0.35);
      root.current.rotation.y = -0.45;
      return;
    }

    if (hero && live.spinning && !act) {
      if (rArm.current) rArm.current.rotation.set(-0.2, 0, 1.35);
      if (lArm.current) lArm.current.rotation.set(0.4, 0, -0.6);
      root.current.rotation.y = live.spinU * Math.PI * 2 * 3.2;
      root.current.position.y = Math.sin(live.spinU * Math.PI) * 0.22;
      return;
    }

    if (scared) {
      const e = Math.sin(phase.current);
      setArms(-2.95, -0.15, 0.22, -2.95, 0.15, -0.22);
      if (lLeg.current) lLeg.current.rotation.x = e * 1.15;
      if (rLeg.current) rLeg.current.rotation.x = -e * 1.15;
      root.current.position.y = Math.abs(e) * 0.06;
      return;
    }

    if ((talking || viewA === "talk") && !act) {
      const t = phase.current;
      if (rArm.current) rArm.current.rotation.set(-0.55 + Math.sin(t * 5.2) * 0.45, Math.sin(t * 2.4) * 0.25, 0.45);
      if (lArm.current) lArm.current.rotation.set(-0.15 + Math.sin(t * 4.4 + 1) * 0.28, 0, -0.25);
      root.current.rotation.x = (look.stoop ?? 0) + Math.sin(t * 2.2) * 0.03;
      return;
    }

    if (wave?.current && !act) {
      if (rArm.current) rArm.current.rotation.set(-2.15, 0.2, -0.15 + Math.sin(phase.current * 7) * 0.45);
      if (lArm.current) lArm.current.rotation.set(0.15, 0, 0.22);
      return;
    }

    if (mad?.current && !act) {
      setArms(-1.15, 0.35, 0.55, -1.15, -0.35, -0.55);
      return;
    }

    if (chore === "pick") {
      if (rArm.current) rArm.current.rotation.set(-2.05 + Math.sin(phase.current * 1.4) * 0.35, 0, 0.15);
      if (lArm.current) lArm.current.rotation.set(0.4, 0, 0.2);
      return;
    }

    if (hero && live.ocarina) {
      const sway = Math.sin(phase.current * 1.15) * 0.08;
      if (rArm.current) rArm.current.rotation.set(-0.55, -0.22, -1.12);
      if (lArm.current) lArm.current.rotation.set(-0.28, 0.42, 1.18);
      if (flute.current) flute.current.visible = true;
      if (notes.current) notes.current.visible = true;
      root.current.rotation.z = sway * 0.6;
      root.current.rotation.x = 0.04;
      return;
    }
    if (notes.current) notes.current.visible = false;

    blink.current -= dt;
    if (lids.current && whites.current) {
      let closed = false;
      if (blink.current <= 0) {
        closed = blink.current > -0.11;
        if (blink.current <= -0.11) blink.current = 2.5 + Math.random() * 3.4;
      }
      lids.current.visible = closed;
      whites.current.visible = !closed;
    }

    if (lFore.current) lFore.current.rotation.set(-0.18, 0, 0);
    if (rFore.current) rFore.current.rotation.set(-0.18, 0, 0);

    if ((riding && !act) || viewA === "ride") {
      if (lLeg.current) {
        lLeg.current.position.set(-0.34, 0.5, 0.04);
        lLeg.current.rotation.set(0.98, 0.08, -0.78);
      }
      if (rLeg.current) {
        rLeg.current.position.set(0.34, 0.5, 0.04);
        rLeg.current.rotation.set(0.98, -0.08, 0.78);
      }
      setArms(-0.78, 0.42, 0.12, -0.78, -0.42, -0.12);
      root.current.position.y = 0.48;
      root.current.rotation.x = -0.12;
      return;
    }

    if (lLeg.current) lLeg.current.position.set(-0.14, 0.52, 0);
    if (rLeg.current) rLeg.current.position.set(0.14, 0.52, 0);
    if (lArm.current) lArm.current.rotation.z = -0.28;
    if (rArm.current) rArm.current.rotation.z = 0.28;
    const he = walk ? ce * 0.98 : 0;
    if (lLeg.current) lLeg.current.rotation.set(hopping ? -0.5 : slam ? 0.15 : he, 0, 0);
    if (rLeg.current) rLeg.current.rotation.set(hopping ? -0.5 : slam ? 0.15 : -he, 0, 0);
    if (lShin.current) lShin.current.rotation.x = hopping ? 0.55 : walk ? Math.max(0.1, -ce) * 1.05 : 0.12;
    if (rShin.current) rShin.current.rotation.x = hopping ? 0.55 : walk ? Math.max(0.1, ce) * 1.05 : 0.12;
    if (lArm.current) lArm.current.rotation.x = hopping ? -0.8 : slam ? 0.3 : walk ? -ce * 0.88 : 0.08 + Math.sin(phase.current * 0.7) * 0.04;
    if (!hero && look.prop && rArm.current) {
      const two = look.prop === "lamb" || look.prop === "bread" || look.prop === "flowers" || look.prop === "veggies" || look.prop === "herbs" || look.prop === "book";
      const pole = look.prop === "pitchfork" || look.prop === "spear" || look.prop === "net";
      if (pole) {
        rArm.current.rotation.set(-0.28, 0.08, 0.12);
      } else if (two) {
        rArm.current.rotation.set(-1.08, -0.12, -0.18);
        if (lArm.current) lArm.current.rotation.set(-1.02, 0.12, 0.18);
      } else {
        rArm.current.rotation.set(-0.92, 0.05, -0.18);
      }
    }
    if (hero && live.heldRock && lArm.current) {
      lArm.current.rotation.x = -1.15;
      lArm.current.rotation.z = 0.4;
    }
    if (hero && live.shieldUp && !act && !live.heldRock && lArm.current) {
      lArm.current.rotation.set(-1.58, 0.38, 0.12);
    }
    if (rArm.current) rArm.current.rotation.x = armLerp.current;
    if (rockG.current) rockG.current.visible = Boolean(hero && live.heldRock);
    if (torso.current) {
      const bob = walk ? Math.abs(Math.sin(phase.current)) * 0.08 : 0;
      torso.current.position.y = 0.58 + bob;
      torso.current.rotation.y = walk ? ce * 0.28 : Math.sin(phase.current * 0.5) * 0.05;
    }
    if (chest.current) chest.current.scale.set(1 + breath * 0.45, 1 + breath, 1 + breath * 0.22);
    root.current.rotation.x = (look.stoop ?? 0) + (hurt ? 0.18 : hopping ? -0.12 : walk ? 0.12 : Math.sin(phase.current * 0.6) * 0.02);
    root.current.rotation.y = 0;
    root.current.rotation.z = walk ? ce * 0.08 : 0;
    root.current.position.y = hopY.current + (walk ? Math.abs(Math.sin(phase.current)) * 0.07 : breath * 0.35);
  });

  return (
    <group ref={root} scale={kid ? 0.78 : 1} rotation={[look.stoop ?? 0, 0, 0]}>
      <GroundBlob radius={hero ? 0.5 : 0.4} opacity={0.32} y={0.02} />
      <group ref={torso} position={[0, 0.58, 0]}>
        <group ref={chest}>
          {hero ? (
            <mesh position={[0, 0.18, 0.01]} castShadow>
              <cylinderGeometry args={[0.26, 0.3, 0.42, 10]} />
              {lamb(CREAM_SHIRT, { kind: "cloth" })}
            </mesh>
          ) : null}
          <mesh position={[0, -0.1, 0.02]} castShadow>
            <cylinderGeometry args={[girl ? 0.38 : 0.34, girl ? 0.42 : 0.38, girl ? 0.52 : 0.34, 10]} />
            {lamb(look.tunic, { kind: "cloth" })}
          </mesh>
          <mesh position={[0, 0.22, 0.02]} castShadow>
            <cylinderGeometry args={[0.27, 0.33, 0.52, 10]} />
            {lamb(bodyCloth, { kind: "cloth" })}
          </mesh>
          <mesh position={[0, 0.5, 0.02]} scale={[1.15, 0.55, 0.95]} castShadow>
            <sphereGeometry args={[0.24, 10, 8]} />
            {lamb(bodyCloth, { kind: "cloth" })}
          </mesh>
          {hero ? (
            <mesh position={[0, 0.52, -0.02]} rotation={[0.4, 0, 0]}>
              <torusGeometry args={[0.15, 0.032, 6, 12]} />
              {lamb(CREAM_SHIRT, { kind: "cloth" })}
            </mesh>
          ) : null}
          {hero ? <group position={[0, 0.04, 0]}><HeroBelt /></group> : (
            <mesh position={[0, 0.06, 0.03]}>
              <torusGeometry args={[0.3, 0.05, 6, 12]} />
              {lamb(look.sash)}
            </mesh>
          )}
          {hero && girl ? <GoldTrim /> : null}
          {hero && girl ? <HeroScarf /> : null}
          {hero && girl ? (
            <group position={[-0.28, -0.12, 0.08]} rotation={[0.1, 0.4, 0.15]}>
              <HeroSatchel />
            </group>
          ) : null}
          <mesh position={[0, 0.48, -0.02]} rotation={[0.2, 0, 0]}>
            <torusGeometry args={[0.15, 0.04, 5, 10]} />
            {lamb(bodyCloth, { kind: "cloth" })}
          </mesh>
          {!hero ? <NpcOutfit look={look} /> : null}
          {hero ? (
            <group ref={shield} visible={false} position={[0.04, 0.12, 0.34]} rotation={[0.2, 0.12, 0.08]}>
              <HeroShield />
            </group>
          ) : null}
        </group>
        <mesh position={[0, 0.58, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.1, 0.12, 7]} />
          {lamb(look.skin)}
        </mesh>
        <group scale={kid ? 1.26 : hero ? 1.16 : 1.06} position={[0, kid ? 0.06 : hero ? 0.04 : 0.02, 0]} ref={head}>
          {hero ? (
            <>
              <HeroHead look={look} girl={girl} whites={whites} lids={lids} />
              {girl ? <GirlHair color={look.hair} /> : <BoyHair color={look.hair} />}
            </>
          ) : (
            <>
              <mesh position={[0, 0.78, 0]} scale={[1.08, 0.96, 1.02]} castShadow>
                <sphereGeometry args={[0.31, 12, 10]} />
                {lamb(look.skin)}
              </mesh>
              {look.blush !== "" ? (
                <>
                  <mesh position={[-0.125, 0.698, -0.278]} rotation={[0.1, 0.35, 0]}>
                    <circleGeometry args={[0.046, 8]} />
                    <meshLambertMaterial color={look.blush ?? "#e8a090"} transparent opacity={0.26} depthWrite={false} />
                  </mesh>
                  <mesh position={[0.125, 0.698, -0.278]} rotation={[0.1, -0.35, 0]}>
                    <circleGeometry args={[0.046, 8]} />
                    <meshLambertMaterial color={look.blush ?? "#e8a090"} transparent opacity={0.26} depthWrite={false} />
                  </mesh>
                </>
              ) : null}
              <mesh position={[0, 0.74, -0.3]} scale={[0.7, 0.55, 0.45]} castShadow>
                <sphereGeometry args={[0.055, 6, 5]} />
                {lamb(look.skin)}
              </mesh>
              <mesh position={[-0.3, 0.76, 0.02]} rotation={[0.1, 0, 0.55]} scale={[0.7, 1, 1]} castShadow>
                <sphereGeometry args={[0.07, 8, 6]} />
                {lamb(look.skin)}
              </mesh>
              <mesh position={[0.3, 0.76, 0.02]} rotation={[0.1, 0, -0.55]} scale={[0.7, 1, 1]} castShadow>
                <sphereGeometry args={[0.07, 8, 6]} />
                {lamb(look.skin)}
              </mesh>
              <NpcHair look={look} seed={(look.tunic?.length ?? 0) + (look.hair?.length ?? 0)} />
              <FaceEyes shape={look.eyeShape ?? "round"} color={look.eyes ?? "#3a5a88"} whites={whites} lids={lids} skin={look.skin} />
              <FaceNose kind={look.nose ?? "round"} skin={look.skin} />
              <FaceBrows kind={look.brows ?? "neutral"} bushy={!look.longHair} />
              <FaceMouth kind={look.mouth ?? "line"} />
            </>
          )}
          {hero ? (
            <group ref={notes} visible={false} position={[0, 1.18, -0.05]}>
              {[0, 1, 2, 3, 4].map((i) => (
                <mesh key={i} position={[0, 0, 0]}>
                  <sphereGeometry args={[0.045, 6, 5]} />
                  {lamb("#1a1410")}
                </mesh>
              ))}
            </group>
          ) : null}
          {hero ? (
            <group ref={flute} visible={false} position={[0.2, 0.78, -0.2]} rotation={[0.12, 0.08, 1.18]}>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.018, 0.015, 0.52, 10]} />
                {lamb("#d8c48a")}
              </mesh>
            </group>
          ) : null}
        </group>

        <group ref={lArm} position={[-0.36, 0.42, 0.04]}>
          <mesh position={[0, -0.14, 0]} rotation={[0.08, 0, 0.08]} castShadow>
            <capsuleGeometry args={[0.1, 0.16, 4, 8]} />
            {lamb(hero ? CREAM_SHIRT : bodyCloth)}
          </mesh>
          <mesh position={[0, -0.26, 0.01]} castShadow>
            <sphereGeometry args={[0.078, 8, 6]} />
            {lamb(look.skin)}
          </mesh>
          <group ref={lFore} position={[0, -0.26, 0.01]}>
            <mesh position={[0, -0.12, 0.02]} rotation={[0.12, 0, 0]} castShadow>
              <capsuleGeometry args={[0.068, 0.16, 4, 8]} />
              {lamb(look.skin)}
            </mesh>
            {hero ? (
              <group position={[0, -0.08, 0.02]}>
                <HeroBracer />
              </group>
            ) : null}
            <group position={[0.01, -0.24, 0.04]}>
              {hero ? <HandFingers skin={look.skin} /> : (
                <mesh castShadow>
                  <sphereGeometry args={[0.07, 6, 5]} />
                  {lamb(look.skin)}
                </mesh>
              )}
            </group>
            {hero ? (
              <mesh ref={rockG} visible={false} position={[0.02, -0.3, 0.06]} castShadow>
                <dodecahedronGeometry args={[0.11, 0]} />
                {lamb("#7a7468")}
              </mesh>
            ) : null}
            {hero ? (
              <group ref={shieldUpG} visible={false} position={[0.01, -0.26, 0.1]} rotation={[0.12, 0.05, 1.52]}>
                <HeroShield />
              </group>
            ) : null}
          </group>
        </group>

        <group ref={rArm} position={[0.36, 0.42, 0.04]}>
          <mesh position={[0, -0.14, 0]} rotation={[0.08, 0, -0.08]} castShadow>
            <capsuleGeometry args={[0.1, 0.16, 4, 8]} />
            {lamb(hero ? CREAM_SHIRT : bodyCloth)}
          </mesh>
          <mesh position={[0, -0.26, 0.01]} castShadow>
            <sphereGeometry args={[0.078, 8, 6]} />
            {lamb(look.skin)}
          </mesh>
          <group ref={rFore} position={[0, -0.26, 0.01]}>
            <mesh position={[0, -0.12, 0.02]} rotation={[0.12, 0, 0]} castShadow>
              <capsuleGeometry args={[0.068, 0.16, 4, 8]} />
              {lamb(look.skin)}
            </mesh>
            {hero ? (
              <group position={[0, -0.08, 0.02]}>
                <HeroBracer />
              </group>
            ) : null}
            <group position={[-0.01, -0.24, 0.04]}>
              {hero ? <HandFingers skin={look.skin} /> : (
                <mesh castShadow>
                  <sphereGeometry args={[0.07, 6, 5]} />
                  {lamb(look.skin)}
                </mesh>
              )}
            </group>
            {hero ? (
              <group ref={axe} visible={false} position={[0.03, -0.22, 0]} rotation={[0.35, 0.2, 0.45]}>
                <mesh position={[0, -0.28, 0]} castShadow>
                  <cylinderGeometry args={[0.028, 0.034, 0.7, 6]} />
                  {lamb("#6a4a28")}
                </mesh>
                <mesh position={[0.08, -0.58, 0]} rotation={[0, 0, 0.15]} castShadow>
                  <boxGeometry args={[0.28, 0.16, 0.04]} />
                  {lamb("#8a9098")}
                </mesh>
              </group>
            ) : null}
            {hero ? (
              <group ref={blade} visible={false} position={[0.02, -0.18, 0.02]} rotation={[0.35, 0.1, 0.2]}>
                <HeroSword />
              </group>
            ) : null}
            {hero ? (
              <group ref={bow} visible={false} position={[0.04, -0.18, 0.04]} rotation={[0.2, 0, 0.4]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <torusGeometry args={[0.22, 0.025, 5, 10, Math.PI]} />
                  {lamb("#6a4a28")}
                </mesh>
              </group>
            ) : null}
            {hero ? (
              <group ref={sling} visible={false} position={[0.02, -0.18, 0.02]} rotation={[0.4, 0, 0.2]}>
                <mesh>
                  <cylinderGeometry args={[0.02, 0.02, 0.34, 5]} />
                  {lamb("#5a3d24")}
                </mesh>
              </group>
            ) : null}
            {hero ? (
              <group ref={boom} visible={false} position={[0.06, -0.16, 0.02]} rotation={[0.55, 0.15, 0.35]}>
                <HeroBoom />
              </group>
            ) : null}
            {hero ? (
              <group ref={bomb} visible={false} position={[0.02, -0.22, 0.04]}>
                <HeroBomb />
              </group>
            ) : (
              <NpcProp kind={look.prop} />
            )}
          </group>
        </group>
        {hero ? (
          <group ref={sheath} visible={false} position={[0.22, 0.62, -0.04]} rotation={[0.2, 0, -1.05]}>
            <mesh position={[0, -0.28, 0]} castShadow>
              <boxGeometry args={[0.055, 0.58, 0.09]} />
              {lamb("#4a3220")}
            </mesh>
            <mesh position={[0, 0.08, 0]}>
              <boxGeometry args={[0.14, 0.045, 0.11]} />
              {lamb("#c9a227")}
            </mesh>
          </group>
        ) : null}
      </group>
      <group ref={lLeg} position={[-0.14, 0.52, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.18, 4, 8]} />
          {lamb(look.pants)}
        </mesh>
        <group ref={lShin} position={[0, -0.3, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.16, 4, 8]} />
            {lamb(look.pants)}
          </mesh>
          <group position={[0, -0.28, -0.02]}>
            {hero ? <HeroBoot color={look.boots} /> : (
              <>
                <mesh position={[0, 0.02, -0.02]} castShadow>
                  <cylinderGeometry args={[0.1, 0.11, 0.16, 6]} />
                  {lamb(look.boots)}
                </mesh>
                <mesh position={[0, -0.06, -0.06]} castShadow>
                  <boxGeometry args={[0.2, 0.08, 0.28]} />
                  {lamb(look.boots)}
                </mesh>
              </>
            )}
          </group>
        </group>
      </group>
      <group ref={rLeg} position={[0.14, 0.52, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.18, 4, 8]} />
          {lamb(look.pants)}
        </mesh>
        <group ref={rShin} position={[0, -0.3, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.16, 4, 8]} />
            {lamb(look.pants)}
          </mesh>
          <group position={[0, -0.28, -0.02]}>
            {hero ? <HeroBoot color={look.boots} /> : (
              <>
                <mesh position={[0, 0.02, -0.02]} castShadow>
                  <cylinderGeometry args={[0.1, 0.11, 0.16, 6]} />
                  {lamb(look.boots)}
                </mesh>
                <mesh position={[0, -0.06, -0.06]} castShadow>
                  <boxGeometry args={[0.2, 0.08, 0.28]} />
                  {lamb(look.boots)}
                </mesh>
              </>
            )}
          </group>
        </group>
      </group>
    </group>
  );
}



export function N64Hero({ act }: { act?: FighterAct } = {}) {
  const girl = useGame((s) => s.heroGender) === "girl";
  const pick = useGame((s) => s.heroLook);
  const base = girl ? HERO_GIRL_LOOK : HERO_LOOK;
  return (
    <Humanoid
      look={{
        tunic: pick?.tunic || base.tunic,
        sash: base.sash,
        cap: undefined,
        hair: pick?.hair ?? base.hair,
        skin: pick?.skin ?? base.skin,
        boots: pick?.boots || base.boots,
        pants: pick?.pants || base.pants,
        longHair: girl,
        eyes: pick?.eyes ?? base.eyes,
        eyeShape: pick?.eyeShape ?? "wide",
        lashes: girl ? (pick?.lashes && pick.lashes !== "none" ? pick.lashes : "long") : (pick?.lashes ?? "none"),
        mouth: pick?.mouth ?? "smile",
        nose: pick?.nose ?? "round",
        brows: pick?.brows ?? "neutral",
        blush: pick?.blush ?? "#c45c58",
        blushAmt: pick?.blushAmt ?? 0.6,
      }}
      hero
      moodId="hero"
      act={act}
    />
  );
}

export function N64Person({
  look,
  x,
  z,
  seed = 0,
  facing = 0,
  chore,
  id,
  kid,
  stay,
  hearth,
  sit,
  floorY,
  holdTray,
}: {
  look: HumanLook;
  x: number;
  z: number;
  seed?: number;
  facing?: number;
  chore?: "pick";
  id?: string;
  kid?: boolean;
  stay?: boolean;
  hearth?: { x: number; z: number; yaw: number; lighter?: boolean };
  sit?: boolean;
  floorY?: number;
  holdTray?: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const pos = useRef(id && live.npcPos[id] ? { ...live.npcPos[id]! } : { x, z });
  const yaw = useRef(facing);
  const gait = useRef(false);
  const scare = useRef(false);
  const wave = useRef(false);
  const mad = useRef(false);
  const sitPose = useRef(Boolean(sit));
  const warm = useRef(false);
  const wait = useRef(2 + (seed % 4));
  const dest = useRef({ x, z });
  useFrame((_, dt) => {
    if (!root.current) return;
    sitPose.current = Boolean(sit);
    const talking = Boolean(id && live.talkNpc === id && live.talking);
    let px = stay ? x : pos.current.x;
    let pz = stay ? z : pos.current.z;
    if (id === "ash" && live.ashFollow && !live.house) {
      const tx = live.x - Math.sin(live.yaw + 0.8) * 1.6;
      const tz = live.z - Math.cos(live.yaw + 0.8) * 1.6;
      const d = Math.hypot(tx - px, tz - pz);
      if (d > 0.4) {
        px += ((tx - px) / d) * Math.min(d, 7.2 * dt);
        pz += ((tz - pz) / d) * Math.min(d, 7.2 * dt);
        yaw.current = Math.atan2(-(tx - px), -(tz - pz));
        gait.current = true;
      } else gait.current = false;
    } else if (id === "mira" && chore === "pick") {
      px = ORCHARD_TREE.x;
      pz = ORCHARD_TREE.z;
      gait.current = false;
    } else if (!stay && !talking && !sit && !hearth) {
      wait.current -= dt;
      if (wait.current <= 0) {
        const a = Math.random() * Math.PI * 2;
        dest.current = { x: x + Math.cos(a) * 3.2, z: z + Math.sin(a) * 3.2 };
        wait.current = 3 + Math.random() * 5;
      }
      const dx = dest.current.x - px;
      const dz = dest.current.z - pz;
      const d = Math.hypot(dx, dz);
      if (d > 0.35) {
        const sp = 1.6 * dt;
        px += (dx / d) * sp;
        pz += (dz / d) * sp;
        const hit = collideHouses(px, pz, "meadow");
        if (hit) {
          px = hit.x;
          pz = hit.z;
        }
        yaw.current = Math.atan2(-dx, -dz);
        gait.current = true;
      } else gait.current = false;
    } else {
      gait.current = false;
    }
    if (hearth && !talking) {
      px = hearth.x;
      pz = hearth.z;
      yaw.current = hearth.yaw;
      sitPose.current = true;
      warm.current = Boolean(hearth.lighter);
    }
    if (talking) yaw.current = Math.atan2(-(live.x - px), -(live.z - pz));
    pos.current = { x: px, z: pz };
    if (id) live.npcPos[id] = { x: px, z: pz };
    const gy = floorY ?? heightAt(px, pz);
    const climbY = id === "mira" && chore === "pick" ? 4.6 * (live.miraClimb ?? 1) : 0;
    root.current.position.set(px, gy + (sitPose.current ? 0.28 : 0) + climbY, pz);
    root.current.rotation.y = yaw.current;
  });
  return (
    <group ref={root}>
      <Humanoid
        look={look}
        kid={kid}
        chore={chore}
        gait={gait}
        scare={scare}
        talking={Boolean(id && live.talkNpc === id && live.talking)}
        wave={wave}
        mad={mad}
        sitPose={sitPose}
        warm={warm}
        holdTray={holdTray}
      />
    </group>
  );
}

export function N64Horse({ x, z }: { x: number; z: number }) {
  const root = useRef<THREE.Group>(null);
  const lF = useRef<THREE.Group>(null);
  const rF = useRef<THREE.Group>(null);
  const lB = useRef<THREE.Group>(null);
  const rB = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const phase = useRef(0);
  useFrame((_, dt) => {
    if (!root.current) return;
    if (live.horseX == null || live.horseZ == null) {
      live.horseX = x;
      live.horseZ = z;
    }
    if (live.mounted) {
      live.horseX = live.x;
      live.horseZ = live.z;
      live.horseYaw = live.yaw;
      live.horseCall = false;
    } else if (live.horseCall) {
      const dx = live.x - live.horseX;
      const dz = live.z - live.horseZ;
      const d = Math.hypot(dx, dz);
      live.horseYaw = Math.atan2(-dx, -dz);
      if (d < 2.4) {
        live.horseCall = false;
        sfx.neigh();
        live.hint = "She's here. Ride · F";
      } else {
        const sp = 18 * dt;
        live.horseX += (dx / d) * sp;
        live.horseZ += (dz / d) * sp;
      }
    }
    const hx = live.horseX ?? x;
    const hz = live.horseZ ?? z;
    const hy = heightAt(hx, hz);
    root.current.position.set(hx, hy, hz);
    root.current.rotation.y = live.horseYaw;
    const moving = live.mounted ? Math.abs(live.speed) > 0.4 : live.horseCall;
    phase.current += dt * (moving ? 10 : 2.2);
    const g = Math.sin(phase.current);
    if (lF.current) lF.current.rotation.x = moving ? g * 0.7 : 0.08;
    if (rF.current) rF.current.rotation.x = moving ? -g * 0.7 : 0.06;
    if (lB.current) lB.current.rotation.x = moving ? -g * 0.55 : 0.04;
    if (rB.current) rB.current.rotation.x = moving ? g * 0.55 : 0.05;
    if (tail.current) tail.current.rotation.z = 0.4 + Math.sin(phase.current * 0.8) * 0.15;
  });
  const coat = "#6a4a28";
  const mane = "#2a2018";
  return (
    <group ref={root}>
      <GroundBlob radius={0.7} opacity={0.32} y={0.03} />
      <mesh position={[0, 1.05, 0.05]} rotation={[0.08, 0, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.95, 4, 8]} />
        {lamb(coat)}
      </mesh>
      <mesh position={[0, 1.35, 0.55]} rotation={[0.55, 0, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.45, 4, 7]} />
        {lamb(coat)}
      </mesh>
      <mesh position={[0, 1.55, 0.82]} castShadow>
        <sphereGeometry args={[0.22, 8, 7]} />
        {lamb(coat)}
      </mesh>
      <mesh position={[0, 1.48, 1.02]} castShadow>
        <sphereGeometry args={[0.12, 6, 5]} />
        {lamb("#3a2a20")}
      </mesh>
      <mesh position={[0, 1.72, 0.55]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.08, 0.35, 0.45]} />
        {lamb(mane)}
      </mesh>
      <group ref={tail} position={[0, 1.15, -0.55]} rotation={[0.5, 0, 0.4]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.45, 3, 6]} />
          {lamb(mane)}
        </mesh>
      </group>
      <group ref={lF} position={[-0.18, 0.72, 0.38]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.42, 3, 6]} />
          {lamb(coat)}
        </mesh>
        <mesh position={[0, -0.58, 0.02]} castShadow>
          <boxGeometry args={[0.12, 0.1, 0.16]} />
          {lamb("#1a1410")}
        </mesh>
      </group>
      <group ref={rF} position={[0.18, 0.72, 0.38]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.42, 3, 6]} />
          {lamb(coat)}
        </mesh>
        <mesh position={[0, -0.58, 0.02]} castShadow>
          <boxGeometry args={[0.12, 0.1, 0.16]} />
          {lamb("#1a1410")}
        </mesh>
      </group>
      <group ref={lB} position={[-0.2, 0.75, -0.38]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.42, 3, 6]} />
          {lamb(coat)}
        </mesh>
        <mesh position={[0, -0.58, 0.02]} castShadow>
          <boxGeometry args={[0.12, 0.1, 0.16]} />
          {lamb("#1a1410")}
        </mesh>
      </group>
      <group ref={rB} position={[0.2, 0.75, -0.38]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.42, 3, 6]} />
          {lamb(coat)}
        </mesh>
        <mesh position={[0, -0.58, 0.02]} castShadow>
          <boxGeometry args={[0.12, 0.1, 0.16]} />
          {lamb("#1a1410")}
        </mesh>
      </group>
    </group>
  );
}

export function AppleOrchard({ x, z }: { x?: number; z?: number } = {}) {
  const p = ORCHARD_TREE;
  const ox = x ?? p.x;
  const oz = z ?? p.z;
  const y = heightAt(ox, oz);
  const lx = ORCHARD_LADDER.x - ox;
  const lz = ORCHARD_LADDER.z - oz;
  return (
    <group position={[ox, y, oz]}>
      <mesh position={[0, 2.4, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.42, 4.8, 8]} />
        {lamb("#5a3d24")}
      </mesh>
      <mesh position={[0, 5.1, 0]} castShadow>
        <icosahedronGeometry args={[2.15, 0]} />
        {lamb("#2a6a28")}
      </mesh>
      <mesh position={[0.9, 4.6, 0.4]} castShadow>
        <icosahedronGeometry args={[1.35, 0]} />
        {lamb("#3d8a32")}
      </mesh>
      <group position={[lx, 0, lz]} rotation={[0, 0.2, 0]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[0.08, 2.8, 0.08]} />
          {lamb("#6a4a28")}
        </mesh>
        <mesh position={[0.42, 1.4, 0]} castShadow>
          <boxGeometry args={[0.08, 2.8, 0.08]} />
          {lamb("#6a4a28")}
        </mesh>
        {[0.4, 0.9, 1.4, 1.9, 2.4].map((yy) => (
          <mesh key={yy} position={[0.21, yy, 0]}>
            <boxGeometry args={[0.5, 0.06, 0.08]} />
            {lamb("#5a3a20")}
          </mesh>
        ))}
      </group>
    </group>
  );
}

export type RupeeTint = "green" | "blue" | "red" | "gold";
const RUPEE_PALETTE: Record<RupeeTint, string> = { green: "#3d8a40", blue: "#3a70c8", red: "#c42838", gold: "#c9a227" };
export function rupeeTintFor(n: number): RupeeTint {
  if (n >= 50) return "gold";
  if (n >= 20) return "red";
  if (n >= 5) return "blue";
  return "green";
}
export function RupeeMesh({ tint = "green", scale = 1, fog = true }: { tint?: RupeeTint; scale?: number; fog?: boolean }) {
  return (
    <mesh scale={scale} castShadow>
      <octahedronGeometry args={[0.22, 0]} />
      <meshLambertMaterial color={RUPEE_PALETTE[tint]} emissive={RUPEE_PALETTE[tint]} emissiveIntensity={0.35} fog={fog} />
    </mesh>
  );
}
export function HeartContainerMesh({ scale = 1, fog = true }: { scale?: number; fog?: boolean }) {
  return (
    <group scale={scale}>
      <mesh position={[-0.12, 0.06, 0]} castShadow>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshLambertMaterial color="#c45c38" fog={fog} />
      </mesh>
      <mesh position={[0.12, 0.06, 0]} castShadow>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshLambertMaterial color="#c45c38" fog={fog} />
      </mesh>
      <mesh position={[0, -0.12, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[0.22, 0.22, 0.18]} />
        <meshLambertMaterial color="#c45c38" fog={fog} />
      </mesh>
    </group>
  );
}

export function SongAura() {
  const g = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    const a = live.songAura;
    if (!a) {
      g.current.visible = false;
      return;
    }
    a.t += dt;
    g.current.visible = true;
    g.current.position.set(live.x, live.y + 0.08, live.z);
    const u = Math.min(1, a.t / 2.2);
    g.current.scale.setScalar(1.2 + u * 6);
    const mat = g.current.material as THREE.MeshBasicMaterial;
    mat.color.set(a.color);
    mat.opacity = 0.45 * (1 - u);
    if (a.t > 2.2) live.songAura = null;
  });
  return (
    <mesh ref={g} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.6, 0.85, 24]} />
      <meshBasicMaterial color="#c9a227" transparent opacity={0.4} depthWrite={false} />
    </mesh>
  );
}

export function N64Sign({ x, z }: { x: number; z: number }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 1.1, 6]} />
        {lamb("#5a3a20")}
      </mesh>
      <mesh position={[0, 1.2, 0.04]}>
        <boxGeometry args={[0.7, 0.42, 0.06]} />
        {lamb("#6a4a28")}
      </mesh>
    </group>
  );
}

export function N64Note({ x, z }: { x: number; z: number }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.15, 0.12]} rotation={[0, 0.2, 0.05]}>
        <planeGeometry args={[0.35, 0.28]} />
        <meshLambertMaterial color="#efe6d4" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 2.8, 6]} />
        {lamb("#5a3d24")}
      </mesh>
    </group>
  );
}

export function N64Gossip({ x, z }: { x: number; z: number }) {
  const y = heightAt(x, z);
  const eye = useRef<THREE.Mesh>(null);
  const paid = useRef((useGame.getState().seenItems ?? []).includes(`s:gossip-${Math.round(x)}-${Math.round(z)}`));
  useFrame(({ clock }) => {
    if (eye.current) eye.current.scale.y = 0.7 + Math.sin(clock.elapsedTime * 2.2) * 0.15;
    if (paid.current || !live.songOk) return;
    if (Math.hypot(live.x - x, live.z - z) > 2.6) return;
    paid.current = true;
    if (useGame.getState().discover(`s:gossip-${Math.round(x)}-${Math.round(z)}`)) {
      const n = useGame.getState().addCoins(5);
      if (n > 0) revealItem("coin");
      live.hint = "The gold eye blinks. It leaves a rupee.";
      sfx.get();
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.42, 10, 8]} />
        {lamb("#6a6560")}
      </mesh>
      <mesh ref={eye} position={[0, 0.62, 0.32]}>
        <sphereGeometry args={[0.08, 8, 6]} />
        {lamb("#c9a227", { emissive: "#c9a227", emit: 0.6 })}
      </mesh>
    </group>
  );
}

export function N64Well({ x, z }: { x: number; z: number }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.72, 0.82, 0.56, 10]} />
        {lamb("#8a8a82")}
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.52, 0.52, 0.12, 10]} />
        {lamb("#2a4a58")}
      </mesh>
    </group>
  );
}
