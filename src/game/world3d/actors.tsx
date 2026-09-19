import { useMemo, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../store";
import { heightAt, vWorld, VX, VZ, ORCHARD_TREE, ORCHARD_LADDER, ORCHARD_LADDER_YAW, ORCHARD_STAND, pondU, BELL_AT, TREE_TRUNK } from "./field";
import { applesLeft, treeKey } from "./n64";
import { live } from "./live";
import { collideHouses, collideSheep } from "./house";
import { collideVillage } from "./village";
import { sfx } from "../audio";
import { revealItem } from "../items";
import { HP_PER_HEART } from "../components/Hud";
import { puffAt } from "./fx";
import {
  GirlHair,
  HeroHair as StoryHair,
  HandFingers,
  HeroBelt,
  HeroBoom,
  HeroSling,
  HeroBomb,
  HeroBoot,
  HeroBracer,
  HeroHead,
  ZeldaEar,
  StoryFace,
  HeroSatchel,
  HeroPack,
  HeroScarf,
  HeroShield,
  HeroSword,
  HeroPole,
  NpcHair,
  NpcOutfit,
  NpcProp,
  CREAM_SHIRT,
  lamb as heroLamb,
} from "./heroes";
import { GroundBlob } from "./mats";

function blockNpc(px: number, pz: number, selfId?: string) {
  let x = px;
  let z = pz;
  const h = collideHouses(x, z, "meadow", true);
  if (h) {
    x = h.x;
    z = h.z;
  }
  const v = collideVillage(x, z);
  if (v) {
    x = v.x;
    z = v.z;
  }
  const sh = collideSheep(x, z);
  if (sh) {
    x = sh.x;
    z = sh.z;
  }
  for (const [oid, p] of Object.entries(live.npcPos)) {
    if (!p || oid === selfId) continue;
    if (oid.startsWith("sign") || oid === "well" || oid === "rook") continue;
    const dx = x - p.x;
    const dz = z - p.z;
    const d2 = dx * dx + dz * dz;
    const rad = 0.85;
    if (d2 < rad * rad && d2 > 1e-5) {
      const d = Math.sqrt(d2);
      x = p.x + (dx / d) * rad;
      z = p.z + (dz / d) * rad;
    }
  }
  if (x === px && z === pz) return null;
  return { x, z };
}

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
  hairStyle?: string;
  kit?: "apron" | "overalls" | "vest" | "robe" | "cloak" | "guard" | "pinafore" | "dress" | "scholar";
  prop?: "lamb" | "flowers" | "pitchfork" | "flute" | "bread" | "net" | "scroll" | "veggies" | "herbs" | "cloth" | "spear" | "book" | "can" | "hammer";
  kerchief?: string;
  glasses?: boolean;
  mustache?: boolean;
  hat?: string;
};

export const HERO_LOOK: HumanLook = {
  tunic: "#2f7a38",
  sash: "#c9a227",
  hair: "#5a3a22",
  skin: "#e8b898",
  boots: "#6a4a28",
  pants: "#3a5a88",
  shirt: "#efe6d4",
  mouth: "cat",
  brows: "neutral",
  eyes: "#3a6ab0",
  eyeShape: "round",
  nose: "round",
  blush: "#e8a090",
  blushAmt: 0.22,
  hairStyle: "wavy",
};

export const HERO_GIRL_LOOK: HumanLook = {
  tunic: "#3a7088",
  sash: "#c45c38",
  hair: "#6a3a22",
  skin: "#e8b898",
  boots: "#6a4a28",
  pants: "#4a3828",
  longHair: true,
  mouth: "cat",
  brows: "neutral",
  eyes: "#6a3a18",
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

const _lookE = new THREE.Euler();
const _lookQ = new THREE.Quaternion();

function tintHex(hex: string, amt: number) {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color("#fff6c8"), amt);
  return `#${c.getHexString()}`;
}

function lathe(profile: [number, number][], segs = 28) {
  // Profiles are written collar-to-hem; lathe wants them bottom-up for outward faces.
  const g = new THREE.LatheGeometry(
    [...profile].reverse().map(([r, y]) => new THREE.Vector2(r, y)),
    segs,
  );
  g.computeVertexNormals();
  return g;
}

/** A limb with some anatomy: rounded at the joint, tapering to the wrist/ankle. Hangs down from y = 0. */
function limb(r0: number, r1: number, len: number, belly = 0.06) {
  const pts: [number, number][] = [];
  const n = 10;
  // hemispherical top
  for (let i = 0; i <= 4; i++) {
    const a = (i / 4) * (Math.PI / 2);
    pts.push([Math.sin(a) * r0, r0 * 0.9 * Math.cos(a)]);
  }
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const r = r0 + (r1 - r0) * u + Math.sin(u * Math.PI) * belly * r0 * (1 - u * 0.5);
    pts.push([r, -len * u]);
  }
  pts.push([r1 * 0.6, -len - r1 * 0.35], [0.001, -len - r1 * 0.45]);
  return lathe(pts, 18);
}

const UPPER_ARM_GEO = limb(0.074, 0.058, 0.27, 0.1);
const FOREARM_GEO = limb(0.06, 0.046, 0.24, 0.16);
const THIGH_GEO = limb(0.118, 0.094, 0.3, 0.08);
const SHIN_GEO = limb(0.096, 0.08, 0.28, 0.14);
/** Short set-in sleeve: a soft cap that flares to an open cuff. */
const SLEEVE_GEO = lathe(
  [
    [0.001, 0.105],
    [0.05, 0.098],
    [0.09, 0.07],
    [0.106, 0.02],
    [0.112, -0.06],
    [0.122, -0.15],
    [0.112, -0.152],
    [0.09, -0.11],
  ],
  18,
);

/** Hero tunic: rounded shoulders, nipped waist, a skirt that kicks out over the hips. */
const TUNIC_GEO = lathe([
  [0.001, 0.575],
  [0.09, 0.57],
  [0.165, 0.535],
  [0.212, 0.47],
  [0.236, 0.37],
  [0.236, 0.24],
  [0.226, 0.1],
  [0.232, 0.03],
  [0.258, -0.07],
  [0.288, -0.14],
  [0.306, -0.19],
  [0.292, -0.196],
  [0.262, -0.16],
]);
/** Lighter band sewn round the hem. */
const HEM_GEO = lathe([
  [0.291, -0.145],
  [0.309, -0.192],
  [0.3, -0.2],
]);
/** Villager shirt: same build, shorter hem. */
const SHIRT_GEO = lathe([
  [0.001, 0.575],
  [0.09, 0.57],
  [0.165, 0.535],
  [0.212, 0.47],
  [0.24, 0.37],
  [0.242, 0.24],
  [0.236, 0.1],
  [0.244, 0.0],
  [0.262, -0.09],
  [0.25, -0.1],
  [0.22, -0.06],
]);
/** A-line dress. */
const DRESS_GEO = lathe([
  [0.2, 0.2],
  [0.224, 0.08],
  [0.25, -0.02],
  [0.31, -0.18],
  [0.372, -0.36],
  [0.384, -0.41],
  [0.36, -0.415],
  [0.3, -0.36],
]);
const BODICE_GEO = lathe([
  [0.001, 0.575],
  [0.09, 0.57],
  [0.165, 0.535],
  [0.208, 0.47],
  [0.228, 0.37],
  [0.226, 0.24],
  [0.218, 0.16],
]);

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
  moodId,
  holdTray,
  hang,
}: {
  look: HumanLook;
  hero?: boolean;
  act?: FighterAct;
  kid?: boolean;
  chore?: "pick";
  gait?: { current: boolean };
  scare?: { current: boolean };
  hang?: { current: boolean };
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
  const poleG = useRef<THREE.Group>(null);
  const shield = useRef<THREE.Group>(null);
  const shieldUpG = useRef<THREE.Group>(null);
  const sheath = useRef<THREE.Group>(null);
  const flute = useRef<THREE.Group>(null);
  const rockG = useRef<THREE.Mesh>(null);
  const whites = useRef<THREE.Group>(null);
  const lids = useRef<THREE.Group>(null);
  const notes = useRef<THREE.Group>(null);
  const blob = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const hopY = useRef(0);
  const armLerp = useRef(0);
  const blink = useRef(2.4);

  const hatOn = Boolean(look.cap && look.cap !== "none");
  void hatOn;
  const girl = Boolean(look.longHair);
  const dress = girl || look.kit === "dress" || look.kit === "pinafore";
  const sit = (hero && live.sit) || Boolean(sitPose?.current);
  const warming = sit && ((hero && Boolean(live.sitAt?.warm)) || Boolean(warm?.current));
  const shirtCol = hero ? look.tunic : look.shirt ?? look.tunic;
  const bodyCloth = shirtCol;
  const pantsCol = dress || hero ? look.pants : "#3a5a88";
  const sleeveCol = look.shirt && look.shirt !== look.tunic ? look.shirt : bodyCloth;
  const longSleeve = !dress;

  useFrame((_, dt) => {
    if (!root.current) return;
    const riding = Boolean(hero && (live.mounted || live.zipping));
    const view = Boolean(hero && live.charView);
    const viewA = view ? live.viewerAnim : "";
    const walk =
      !act &&
      !riding &&
      ((hero && (view ? viewA === "walk" || viewA === "run" || viewA === "sprint" : Math.abs(live.speed) > 0.4) && !live.rolling && live.grounded) ||
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
    if (poleG.current) poleG.current.visible = Boolean(hero) && !riding && !live.getItem && hold === "pole";
    if (sheath.current) sheath.current.visible = Boolean(hero && (riding || hold === "shield") && live.hasSword);
    if (shieldUpG.current) shieldUpG.current.visible = Boolean(hero && !riding && live.hasShield && live.shieldUp);
    if (shield.current) shield.current.visible = Boolean(hero && live.hasShield && (!live.shieldUp || riding));
    if (flute.current) flute.current.visible = Boolean(hero && live.ocarina);

    phase.current += dt * (riding ? 10.8 : scared ? 11.5 : walk ? (9.4 + (viewA === "sprint" ? 9 : viewA === "run" ? 5.5 : Math.abs(live.speed)) * 0.55) * (live.speed < -0.2 ? -1 : 1) : 1.45);
    const ce = walk ? Math.sin(phase.current) : 0;
    const breath = Math.sin(phase.current) * (walk ? 0.018 : 0.04);
    const hopping = act === "hop" || viewA === "jump";
    const slam = act === "slam" || viewA === "land";
    const hurt = act === "hurt" || Boolean(hero && live.heroFlash > 0.4) || viewA === "hurt";
    hopY.current += ((hopping ? 0.92 : slam ? 0 : hurt ? 0.08 : 0) - hopY.current) * (1 - Math.exp(-dt * (slam ? 22 : 10)));
    const wantArm = hopping ? -2.35 : slam ? 1.25 : hurt ? 0.4 : ce * 1.05;
    armLerp.current += (wantArm - armLerp.current) * (1 - Math.exp(-dt * 16));

    const setArms = (lx: number, ly: number, lz: number, rx: number, ry: number, rz: number) => {
      if (lArm.current) lArm.current.rotation.set(lx, ly, lz);
      if (rArm.current) rArm.current.rotation.set(rx, ry, rz);
    };

    if (hero && live.zipping && !act) {
      const e = Math.sin(live.playT * 9.4);
      setArms(-2.92, 0.16, 0.12, -2.92, -0.16, -0.12);
      if (lFore.current) lFore.current.rotation.set(-0.72, 0.1, 0.22);
      if (rFore.current) rFore.current.rotation.set(-0.72, -0.1, -0.22);
      if (lLeg.current) {
        lLeg.current.position.set(-0.12, 0.5, 0.04);
        lLeg.current.rotation.set(0.22 + e * 0.28, 0.08, 0.08);
      }
      if (rLeg.current) {
        rLeg.current.position.set(0.12, 0.5, 0.04);
        rLeg.current.rotation.set(0.22 - e * 0.28, -0.08, -0.08);
      }
      if (lShin.current) lShin.current.rotation.x = 0.18;
      if (rShin.current) rShin.current.rotation.x = 0.18;
      if (torso.current) {
        torso.current.position.y = 0.58;
        torso.current.rotation.set(0.28, 0, 0);
      }
      root.current.rotation.x = 0.42;
      root.current.position.y = hopY.current;
      return;
    }

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

    if (hero && live.climbing && !act) {
      const e = Math.sin(live.climbPhase);
      const moving = Math.abs(live.climbV) > 0.12;
      const reach = moving ? e : 0.35;
      setArms(-2.62 + reach * 0.95, 0.18, 0.28, -2.62 - reach * 0.95, -0.18, -0.28);
      if (lFore.current) lFore.current.rotation.set(-1.05 - reach * 0.35, 0.08, 0.18);
      if (rFore.current) rFore.current.rotation.set(-1.05 + reach * 0.35, -0.08, -0.18);
      if (lLeg.current) {
        lLeg.current.position.set(-0.12, 0.5, 0.08);
        lLeg.current.rotation.set(0.42 + reach * 1.12, 0.1, 0.1);
      }
      if (rLeg.current) {
        rLeg.current.position.set(0.12, 0.5, 0.08);
        rLeg.current.rotation.set(0.42 - reach * 1.12, -0.1, -0.1);
      }
      if (lShin.current) lShin.current.rotation.x = 0.55 + Math.max(0, -reach) * 0.85;
      if (rShin.current) rShin.current.rotation.x = 0.55 + Math.max(0, reach) * 0.85;
      if (torso.current) {
        torso.current.position.y = 0.58 + (moving ? Math.abs(e) * 0.05 : 0);
        torso.current.rotation.set(0.22, reach * 0.12, 0);
      }
      root.current.rotation.x = 0.18;
      root.current.position.y = hopY.current + (moving ? Math.sin(live.climbPhase) * 0.05 : 0);
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
      const arc = Math.sin(t * Math.PI);
      if (rArm.current) rArm.current.rotation.set(-0.42 + arc * 2.55, (t - 0.42) * 1.55, t < 0.38 ? 0.72 : -0.78);
      if (lArm.current) lArm.current.rotation.set(-0.62 + arc * 1.95, 0.28 - t * 0.5, -0.48);
      if (rFore.current) rFore.current.rotation.set(-0.55 - arc * 0.28, -0.08, 0);
      if (lFore.current) lFore.current.rotation.set(-0.62, 0.22, 0.18);
      if (torso.current) {
        torso.current.position.y = 0.58;
        torso.current.rotation.set(0.1, arc * 0.48, 0.06);
      }
      root.current.rotation.y = arc * 0.38;
      root.current.rotation.x = look.stoop ?? 0;
      root.current.position.y = hopY.current;
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

    if (hang?.current) {
      const e = Math.sin(phase.current * 2.6);
      setArms(-3.08, 0.14, 0.12, -3.08, -0.14, -0.12);
      if (lFore.current) lFore.current.rotation.set(0.04, 0.08, 0.06);
      if (rFore.current) rFore.current.rotation.set(0.04, -0.08, -0.06);
      if (lLeg.current) {
        lLeg.current.position.set(-0.13, 0.5, 0.02);
        lLeg.current.rotation.set(0.42 + e * 0.28, 0.1, 0.14);
      }
      if (rLeg.current) {
        rLeg.current.position.set(0.13, 0.5, 0.02);
        rLeg.current.rotation.set(0.5 - e * 0.24, -0.1, -0.14);
      }
      if (lShin.current) lShin.current.rotation.x = 0.55 + e * 0.16;
      if (rShin.current) rShin.current.rotation.x = 0.62 - e * 0.14;
      if (torso.current) {
        torso.current.position.y = 0.58;
        torso.current.rotation.set(0.06, 0, e * 0.05);
      }
      if (head.current) head.current.rotation.set(0.22, 0, e * 0.04);
      if (blob.current) blob.current.visible = false;
      root.current.position.y = 0;
      root.current.rotation.x = 0.02;
      root.current.rotation.z = e * 0.1;
      return;
    }
    if (blob.current) blob.current.visible = true;

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

    if (hero && hold === "boom" && !act && !swing) {
      if (lLeg.current) {
        lLeg.current.position.set(-0.14, 0.52, 0);
        lLeg.current.rotation.set(walk ? Math.sin(phase.current) * 0.55 : 0.08, 0, 0.04);
      }
      if (rLeg.current) {
        rLeg.current.position.set(0.14, 0.52, 0);
        rLeg.current.rotation.set(walk ? -Math.sin(phase.current) * 0.55 : 0.06, 0, -0.04);
      }
      setArms(-0.42, 0.12, 0.32, -1.95, -0.28, -0.62);
      if (lFore.current) lFore.current.rotation.set(-0.18, 0, 0);
      if (rFore.current) rFore.current.rotation.set(-0.55, -0.12, -0.18);
      if (torso.current) {
        torso.current.position.y = 0.58;
        torso.current.rotation.set(-0.06, 0, 0.08);
      }
      root.current.rotation.x = -0.04;
      root.current.position.y = hopY.current;
      return;
    }

    if (hero && hold === "sling" && !act && !swing) {
      const pull = live.slingPull;
      if (lLeg.current) {
        lLeg.current.position.set(-0.14, 0.52, 0);
        lLeg.current.rotation.set(0.12, 0, 0.06);
      }
      if (rLeg.current) {
        rLeg.current.position.set(0.14, 0.52, 0);
        rLeg.current.rotation.set(0.08, 0, -0.06);
      }
      setArms(-1.22 - pull * 0.55, 0.55 + pull * 0.22, 0.92, -1.42, -0.22, -0.18);
      if (lFore.current) lFore.current.rotation.set(-0.15 - pull * 0.95, 0.28, 0.22);
      if (rFore.current) rFore.current.rotation.set(-0.22, -0.08, -0.12);
      if (torso.current) {
        torso.current.position.y = 0.58;
        torso.current.rotation.set(-0.04 - pull * 0.12, 0.18, 0.06);
      }
      root.current.rotation.x = -0.08 - pull * 0.1;
      root.current.rotation.y = 0.22;
      root.current.position.y = hopY.current;
      return;
    }

    if (hero && hold === "bow" && !act && !swing) {
      if (lLeg.current) {
        lLeg.current.position.set(-0.14, 0.52, 0);
        lLeg.current.rotation.set(walk ? Math.sin(phase.current) * 0.5 : 0.08, 0, 0.04);
      }
      if (rLeg.current) {
        rLeg.current.position.set(0.14, 0.52, 0);
        rLeg.current.rotation.set(walk ? -Math.sin(phase.current) * 0.5 : 0.06, 0, -0.04);
      }
      setArms(-1.15, 0.62, 0.85, -0.95, -0.18, -0.42);
      if (lFore.current) lFore.current.rotation.set(-0.22, 0.2, 0.12);
      if (rFore.current) rFore.current.rotation.set(-0.18, 0, 0);
      if (torso.current) {
        torso.current.position.y = 0.58;
        torso.current.rotation.set(-0.05, 0.12, 0.04);
      }
      root.current.rotation.x = -0.04;
      root.current.position.y = hopY.current;
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
      const rear = Math.min(1, live.horseRear * 1.2);
      if (lLeg.current) {
        lLeg.current.position.set(-0.34, 0.5, 0.04);
        lLeg.current.rotation.set(0.98, 0.08, -0.78);
      }
      if (rLeg.current) {
        rLeg.current.position.set(0.34, 0.5, 0.04);
        rLeg.current.rotation.set(0.98, -0.08, 0.78);
      }
      setArms(-0.78 - rear * 0.4, 0.42, 0.12, -0.78 - rear * 0.4, -0.42, -0.12);
      root.current.position.y = 0.66 + rear * 0.32;
      root.current.rotation.x = -0.12 - rear * 0.55;
      return;
    }

    if (lLeg.current) lLeg.current.position.set(-0.15, 0.52 + (walk ? Math.max(0, -ce) * 0.05 : 0), walk ? ce * 0.07 : 0);
    if (rLeg.current) rLeg.current.position.set(0.15, 0.52 + (walk ? Math.max(0, ce) * 0.05 : 0), walk ? -ce * 0.07 : 0);
    if (lArm.current) lArm.current.rotation.z = -0.14;
    if (rArm.current) rArm.current.rotation.z = 0.14;
    const he = walk ? ce * 0.72 : 0;
    if (lLeg.current) lLeg.current.rotation.set(hopping ? -0.5 : slam ? 0.15 : he, 0, 0.035);
    if (rLeg.current) rLeg.current.rotation.set(hopping ? -0.5 : slam ? 0.15 : -he, 0, -0.035);
    if (lShin.current) lShin.current.rotation.x = hopping ? 0.55 : walk ? 0.12 + Math.max(0, -ce) * 0.78 : 0.1;
    if (rShin.current) rShin.current.rotation.x = hopping ? 0.55 : walk ? 0.12 + Math.max(0, ce) * 0.78 : 0.1;
    if (lFore.current) lFore.current.rotation.set(walk ? -0.22 - Math.max(0, -ce) * 0.32 : -0.16, 0.04, 0.06);
    if (rFore.current) rFore.current.rotation.set(walk ? -0.22 - Math.max(0, ce) * 0.32 : -0.16, -0.04, -0.06);
    if (lArm.current) lArm.current.rotation.x = hopping ? -0.8 : slam ? 0.3 : walk ? -armLerp.current : 0.1 + Math.sin(phase.current * 0.7) * 0.04;
    if (lArm.current) lArm.current.rotation.y = 0.05;
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
    if (rArm.current) rArm.current.rotation.y = -0.05;
    if (rockG.current) rockG.current.visible = Boolean(hero && live.heldRock);
    if (torso.current) {
      const run = walk && ((hero && Math.abs(live.speed) > 5.4) || viewA === "run" || viewA === "sprint");
      const bob = walk ? Math.abs(ce) * 0.032 : 0;
      torso.current.position.y = 0.58 + bob;
      torso.current.rotation.set(run ? 0.1 : walk ? 0.035 : 0, walk ? ce * 0.1 : Math.sin(phase.current * 0.5) * 0.04, walk ? -ce * 0.045 : 0);
    }
    if (chest.current) chest.current.scale.set(1 + breath * 0.45, 1 + breath, 1 + breath * 0.22);
    root.current.rotation.x = (look.stoop ?? 0) + (hurt ? 0.18 : hopping ? -0.12 : walk ? (Math.abs(live.speed) > 5.4 ? 0.09 : 0.03) : Math.sin(phase.current * 0.6) * 0.02);
    root.current.rotation.y = 0;
    root.current.rotation.z = walk ? -ce * 0.035 : 0;
    root.current.position.y = hopY.current + (walk ? Math.abs(Math.cos(phase.current)) * 0.016 : breath * 0.35);
  });

  // Motion polish: the pose code above snaps joints straight to their targets. Ease every joint toward
  // its target so stance changes blend, then layer a little life on the head (idle glances, and staying
  // level against the torso's twist while walking). Reads the pose without changing what it means.
  const eased = useRef(new Map<THREE.Object3D, { shown: THREE.Quaternion; target: THREE.Quaternion; written: THREE.Quaternion }>());
  const lookSeed = useMemo(() => (look.hair?.length ?? 3) * 1.7 + (look.tunic?.charCodeAt(2) ?? 0) * 0.13, [look.hair, look.tunic]);
  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const snappy = Boolean(hero && (live.swinging || live.rolling || live.spinning || live.knock));
    const k = 1 - Math.exp(-dt * (snappy ? 40 : 19));
    for (const ref of [torso, lArm, rArm, lFore, rFore, lLeg, rLeg, lShin, rShin, head]) {
      const obj = ref.current;
      if (!obj) continue;
      let j = eased.current.get(obj);
      if (!j) {
        j = { shown: obj.quaternion.clone(), target: obj.quaternion.clone(), written: obj.quaternion.clone() };
        eased.current.set(obj, j);
        continue;
      }
      if (!obj.quaternion.equals(j.written)) j.target.copy(obj.quaternion);
      j.shown.slerp(j.target, k);
      obj.quaternion.copy(j.shown);
      if (ref === head) {
        const moving = hero ? Math.abs(live.speed) > 0.4 : Boolean(gait?.current);
        const busy = Boolean(act) || Boolean(talking) || (hero && (live.swinging || live.ocarina || Boolean(live.getItem) || live.bed));
        const t = clock.elapsedTime + lookSeed;
        const calm = moving || busy ? 0 : 1;
        // Slow glances left and right with the odd tilt; none while walking, talking or fighting.
        const yaw = calm * (Math.sin(t * 0.37) * 0.2 + Math.sin(t * 0.91 + 1.3) * 0.08) - (torso.current ? torso.current.rotation.y * 0.7 : 0);
        const pitch = calm * Math.sin(t * 0.53 + 0.7) * 0.05;
        const roll = calm * Math.sin(t * 0.29 + 2.1) * 0.04;
        _lookE.set(pitch, yaw, roll);
        _lookQ.setFromEuler(_lookE);
        obj.quaternion.multiply(_lookQ);
      }
      j.written.copy(obj.quaternion);
    }
  });

  return (
    <group ref={root} scale={kid ? 0.78 : 1} rotation={[look.stoop ?? 0, 0, 0]}>
      <group ref={blob}>
        <GroundBlob radius={hero ? 0.5 : 0.4} opacity={0.32} y={0.02} />
      </group>
      <group ref={torso} position={[0, 0.58, 0]}>
        <group ref={chest}>
          {/* One smooth garment from collar to hem instead of stacked cans. */}
          {!dress ? (
            <mesh position={[0, -0.06, 0.02]} scale={[0.9, 1, 0.8]} castShadow>
              <cylinderGeometry args={[0.2, 0.2, 0.24, 16]} />
              {lamb(pantsCol, { kind: "cloth" })}
            </mesh>
          ) : null}
          <mesh geometry={dress ? DRESS_GEO : hero ? TUNIC_GEO : SHIRT_GEO} position={[0, 0, 0.02]} scale={[0.96, 1, 0.74]} castShadow receiveShadow>
            {lamb(dress ? look.tunic : bodyCloth, { kind: "cloth" })}
          </mesh>
          {dress ? (
            <mesh geometry={BODICE_GEO} position={[0, 0, 0.02]} scale={[0.975, 1, 0.755]} castShadow>
              {lamb(bodyCloth, { kind: "cloth" })}
            </mesh>
          ) : null}
          {hero && !dress ? (
            <>
              <mesh geometry={HEM_GEO} position={[0, 0, 0.02]} scale={[0.965, 1, 0.745]}>
                {lamb(tintHex(bodyCloth, 0.22), { kind: "cloth" })}
              </mesh>
              {/* laced V-neck over the cream undershirt */}
              <mesh position={[0, 0.455, -0.158]} rotation={[-0.2, 0, Math.PI]} scale={[1, 1, 0.3]}>
                <coneGeometry args={[0.06, 0.16, 3]} />
                {lamb(CREAM_SHIRT, { kind: "cloth" })}
              </mesh>
              {[0.49, 0.455, 0.42].map((y, i) => (
                <mesh key={y} position={[0, y, -0.172 - i * 0.004]} rotation={[0, 0, i % 2 ? 0.5 : -0.5]}>
                  <boxGeometry args={[0.06 - i * 0.014, 0.008, 0.006]} />
                  {lamb("#5a3a22", { kind: "leather" })}
                </mesh>
              ))}
              {/* baldric for the shield */}
              <mesh position={[0, 0.27, 0.02]} rotation={[Math.PI / 2, 0.6, 0]} scale={[1, 0.735, 1]}>
                <torusGeometry args={[0.238, 0.016, 6, 28]} />
                {lamb("#5a3a22", { kind: "leather" })}
              </mesh>
            </>
          ) : null}
          {hero && !dress
            ? [-0.15, 0.15].map((x) => (
                <mesh key={`pouch${x}`} position={[x, -0.02, -0.176]} rotation={[0.1, 0, 0]} castShadow>
                  <boxGeometry args={[0.085, 0.08, 0.05]} />
                  {lamb("#5a3a22", { kind: "leather" })}
                </mesh>
              ))
            : null}
          {hero ? (
            <mesh position={[0, 0.548, 0.0]} rotation={[Math.PI / 2 + 0.1, 0, 0]} scale={[1, 0.82, 0.55]}>
              <torusGeometry args={[0.1, 0.032, 8, 20]} />
              {lamb(CREAM_SHIRT, { kind: "cloth" })}
            </mesh>
          ) : null}
          {hero ? <group position={[0, 0.04, 0]}><HeroBelt /></group> : (
            <mesh position={[0, 0.05, 0.02]} scale={[0.96, 1, 0.74]}>
              <cylinderGeometry args={[0.236, 0.242, 0.07, 24, 1, true]} />
              {lamb(look.sash, { kind: "cloth" })}
            </mesh>
          )}
          {hero ? (
            <group position={[-0.11, -0.14, 0.03]} rotation={[0.05, Math.PI / 2, 0]} scale={0.56}>
              <HeroPack />
            </group>
          ) : null}
          {hero && girl ? <HeroScarf /> : null}
          {hero && girl ? (
            <group position={[-0.28, -0.12, 0.08]} rotation={[0.1, 0.4, 0.15]}>
              <HeroSatchel />
            </group>
          ) : null}
          {!hero ? <NpcOutfit look={look} /> : null}
          {hero ? (
            <group ref={shield} visible={false} position={[0.03, 0.2, 0.235]} rotation={[-0.12, 0.1, 0.12]}>
              <HeroShield />
            </group>
          ) : null}
        </group>
        <mesh position={[0, 0.58, 0]} castShadow>
          <cylinderGeometry args={[0.068, 0.08, 0.16, 16]} />
          {lamb(look.skin, { kind: "skin" })}
        </mesh>
        <group scale={kid ? 1.12 : hero ? 1.0 : 0.96} position={[0, kid ? 0.0 : hero ? -0.035 : -0.04, 0]} ref={head}>
          {hero ? (
            <>
              <HeroHead look={look} girl={girl} whites={whites} lids={lids} />
              {girl ? <GirlHair color={look.hair} /> : <StoryHair color={look.hair} style={look.hairStyle === "long" || look.hairStyle === "braid" || look.hairStyle === "pony" ? "messy" : look.hairStyle || "wavy"} />}
            </>
          ) : (
            <>
              <HeroHead
                look={look}
                girl={Boolean(look.longHair)}
                whites={whites}
                lids={lids}
                npc={{ talking, scare, mad, wave, sit: sitPose, moodId }}
              />
              <NpcHair look={look} seed={(look.tunic?.length ?? 0) + (look.hair?.length ?? 0)} />
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
          {hero ? <HeroHats /> : null}
        </group>

        <group ref={lArm} position={[-0.285, 0.41, 0.02]}>
          <mesh geometry={UPPER_ARM_GEO} position={[0, 0.0, 0]} rotation={[0.06, 0, 0.04]} castShadow>
            {lamb(hero ? CREAM_SHIRT : sleeveCol, { kind: "cloth" })}
          </mesh>
          <mesh geometry={SLEEVE_GEO} position={[0.05, 0.0, 0]} rotation={[0, 0, 0.04 * 3]} castShadow>
            {lamb(bodyCloth, { kind: "cloth" })}
          </mesh>
          <group ref={lFore} position={[0, -0.28, 0.01]}>
            <mesh geometry={FOREARM_GEO} position={[0, 0.01, 0.005]} rotation={[0.1, 0, 0]} castShadow>
              {lamb(hero ? CREAM_SHIRT : longSleeve ? sleeveCol : look.skin, { kind: hero || longSleeve ? "cloth" : "skin" })}
            </mesh>
            {hero ? (
              <group position={[0, -0.15, 0.02]} scale={[0.8, 1, 0.8]}>
                <HeroBracer />
              </group>
            ) : null}
            <group position={[0.006, -0.262, 0.035]} scale={hero ? 1.04 : 0.94}>
              <HandFingers skin={look.skin} />
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

        <group ref={rArm} position={[0.285, 0.41, 0.02]}>
          <mesh geometry={UPPER_ARM_GEO} position={[0, 0.0, 0]} rotation={[0.06, 0, -0.04]} castShadow>
            {lamb(hero ? CREAM_SHIRT : sleeveCol, { kind: "cloth" })}
          </mesh>
          <mesh geometry={SLEEVE_GEO} position={[-0.05, 0.0, 0]} rotation={[0, 0, -0.04 * 3]} castShadow>
            {lamb(bodyCloth, { kind: "cloth" })}
          </mesh>
          <group ref={rFore} position={[0, -0.28, 0.01]}>
            <mesh geometry={FOREARM_GEO} position={[0, 0.01, 0.005]} rotation={[0.1, 0, 0]} castShadow>
              {lamb(hero ? CREAM_SHIRT : longSleeve ? sleeveCol : look.skin, { kind: hero || longSleeve ? "cloth" : "skin" })}
            </mesh>
            {hero ? (
              <group position={[0, -0.15, 0.02]} scale={[0.8, 1, 0.8]}>
                <HeroBracer />
              </group>
            ) : null}
            <group position={[-0.006, -0.262, 0.035]} scale={hero ? 1.04 : 0.94}>
              <HandFingers skin={look.skin} />
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
              <group ref={blade} visible={false} position={[0.02, -0.12, 0.02]} rotation={[0.55, 0.12, 0.22]}>
                <HeroSword />
              </group>
            ) : null}
            {hero ? (
              <group ref={poleG} visible={false} position={[0.04, -0.12, 0.02]} rotation={[0.55, 0.15, 0.35]}>
                <HeroPole />
              </group>
            ) : null}
            {hero ? (
              <group ref={bow} visible={false} position={[0.04, -0.18, 0.04]} rotation={[0.2, 0, 0.4]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <torusGeometry args={[0.28, 0.028, 5, 12, Math.PI]} />
                  {lamb("#6a4a28", { kind: "wood" })}
                </mesh>
                <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.01]}>
                  <torusGeometry args={[0.28, 0.012, 4, 12, Math.PI]} />
                  {lamb("#c4a06a", { kind: "wood" })}
                </mesh>
              </group>
            ) : null}
            {hero ? (
              <group ref={sling} visible={false} position={[0.02, -0.28, 0.1]} rotation={[1.05, 0.15, 0.08]}>
                <HeroSling scale={1.15} />
              </group>
            ) : null}
            {hero ? (
              <group ref={boom} visible={false} position={[0.1, -0.32, 0.08]} rotation={[0.15, 0.55, 1.22]}>
                <HeroBoom scale={1.72} />
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
        <mesh geometry={THIGH_GEO} position={[0, 0.02, 0]} castShadow>
          {lamb(pantsCol, { kind: "cloth" })}
        </mesh>
        <group ref={lShin} position={[0, -0.3, 0]}>
          <mesh geometry={SHIN_GEO} position={[0, 0.02, 0]} castShadow>
            {lamb(pantsCol, { kind: "cloth" })}
          </mesh>
          <group position={[0, -0.28, -0.02]}>
            <HeroBoot color={look.boots} />
          </group>
        </group>
      </group>
      <group ref={rLeg} position={[0.14, 0.52, 0]}>
        <mesh geometry={THIGH_GEO} position={[0, 0.02, 0]} castShadow>
          {lamb(pantsCol, { kind: "cloth" })}
        </mesh>
        <group ref={rShin} position={[0, -0.3, 0]}>
          <mesh geometry={SHIN_GEO} position={[0, 0.02, 0]} castShadow>
            {lamb(pantsCol, { kind: "cloth" })}
          </mesh>
          <group position={[0, -0.28, -0.02]}>
            <HeroBoot color={look.boots} />
          </group>
        </group>
      </group>
    </group>
  );
}



function HeroHats() {
  const kite = useRef<THREE.Group>(null);
  const mask = useRef<THREE.Group>(null);
  const pumpkin = useRef<THREE.Group>(null);
  const giant = useRef<THREE.Group>(null);
  const pot = useRef<THREE.Group>(null);
  const leaf = useRef<THREE.Group>(null);
  const bloom = useRef<THREE.Group>(null);
  useFrame(() => {
    const h = live.hat;
    if (kite.current) kite.current.visible = h === "kite";
    if (mask.current) mask.current.visible = h === "mask";
    if (pumpkin.current) pumpkin.current.visible = h === "pumpkin";
    if (giant.current) giant.current.visible = h === "giant";
    if (pot.current) pot.current.visible = h === "pot";
    if (leaf.current) leaf.current.visible = h === "leaf";
    if (bloom.current) bloom.current.visible = live.flowerHat;
  });
  return (
    <group>
      <group ref={kite} visible={false} position={[0, 1.12, 0.02]} rotation={[0.35, 0.2, 0.15]}>
        <mesh castShadow>
          <planeGeometry args={[0.55, 0.7]} />
          <meshLambertMaterial color="#3a6a88" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.42, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.4, 4]} />
          <meshLambertMaterial color="#efe6d4" />
        </mesh>
      </group>
      <group ref={mask} visible={false} position={[0, 0.82, -0.28]}>
        <mesh castShadow>
          <sphereGeometry args={[0.22, 8, 6]} />
          <meshLambertMaterial color="#e8d48a" />
        </mesh>
        <mesh position={[-0.07, 0.02, -0.14]}>
          <sphereGeometry args={[0.04, 6, 5]} />
          <meshLambertMaterial color="#1a1410" />
        </mesh>
        <mesh position={[0.07, 0.02, -0.14]}>
          <sphereGeometry args={[0.04, 6, 5]} />
          <meshLambertMaterial color="#1a1410" />
        </mesh>
      </group>
      <group ref={pumpkin} visible={false} position={[0, 1.08, 0]}>
        <mesh scale={[1.15, 1, 1.1]} castShadow>
          <sphereGeometry args={[0.38, 10, 8]} />
          <meshLambertMaterial color="#c45c38" />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 0.12, 5]} />
          <meshLambertMaterial color="#3d8a68" />
        </mesh>
        <mesh position={[-0.1, 0.04, -0.32]}>
          <sphereGeometry args={[0.05, 6, 5]} />
          <meshLambertMaterial color="#1a1410" />
        </mesh>
        <mesh position={[0.1, 0.04, -0.32]}>
          <sphereGeometry args={[0.05, 6, 5]} />
          <meshLambertMaterial color="#1a1410" />
        </mesh>
      </group>
      <group ref={giant} visible={false} position={[0, 1.08, 0]} rotation={[-0.18, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.85, 1.25, 0.22, 12]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.48, 0.55, 0.5, 10]} />
          <meshLambertMaterial color="#d8b84a" />
        </mesh>
      </group>
      <group ref={pot} visible={false} position={[0, 1.12, 0]} rotation={[0.12, 0.2, 0]}>
        <mesh rotation={[Math.PI, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.28, 0.32, 8]} />
          <meshLambertMaterial color="#6a5a48" />
        </mesh>
        <mesh position={[0.2, 0.02, 0]} rotation={[0, 0, 1.2]}>
          <torusGeometry args={[0.08, 0.018, 5, 10]} />
          <meshLambertMaterial color="#5a4a38" />
        </mesh>
      </group>
      <group ref={leaf} visible={false} position={[0, 1.08, 0.04]} rotation={[0.4, 0.2, 0.5]}>
        <mesh castShadow>
          <sphereGeometry args={[0.16, 6, 4]} />
          <meshLambertMaterial color="#3d8a42" />
        </mesh>
        <mesh position={[0, -0.08, 0]} scale={[0.6, 0.2, 1.1]}>
          <sphereGeometry args={[0.12, 5, 4]} />
          <meshLambertMaterial color="#2e6a32" />
        </mesh>
      </group>
      <group ref={bloom} visible={false} position={[0.08, 1.02, 0.06]}>
        <mesh>
          <sphereGeometry args={[0.07, 6, 5]} />
          <meshLambertMaterial color="#c45c38" />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.03, 5, 4]} />
          <meshLambertMaterial color="#e8d48a" />
        </mesh>
      </group>
    </group>
  );
}

export function N64Hero({ act }: { act?: FighterAct } = {}) {
  const pick = useGame((s) => s.heroLook);
  return (
    <Humanoid
      look={{
        tunic: pick?.tunic ?? "#2f7a38",
        sash: "#c9a227",
        cap: undefined,
        hair: "#5a3a22",
        skin: pick?.skin ?? "#e8b898",
        boots: pick?.boots ?? "#5a3a22",
        pants: pick?.pants ?? "#e9dfc6",
        longHair: false,
        eyes: pick?.eyes ?? "#3a6ab0",
        eyeShape: "round",
        lashes: pick?.lashes ?? "none",
        mouth: pick?.mouth ?? "cat",
        nose: pick?.nose ?? "round",
        brows: pick?.brows ?? "neutral",
        blush: pick?.blush ?? "#e89088",
        blushAmt: pick?.blushAmt ?? 0.72,
        hairStyle: pick?.hairStyle ?? "wavy",
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
  const punch = useRef(0);
  const tag = useRef(0);
  useFrame((_, dt) => {
    if (!root.current) return;
    sitPose.current = Boolean(sit);
    const talking = Boolean(id && live.talkNpc === id && live.talking);
    let px = stay ? x : pos.current.x;
    let pz = stay ? z : pos.current.z;
    if (id === "bram" && !live.house && live.carryKid !== "bram") {
      const homeD = Math.hypot(live.x - TREE_TRUNK.x, live.z - TREE_TRUNK.z);
      if (homeD > 6.5 && Math.abs(live.speed) > 4.5) {
        const tx = live.x - Math.sin(live.yaw + 1.05) * 1.9;
        const tz = live.z - Math.cos(live.yaw + 1.05) * 1.9;
        const d = Math.hypot(tx - px, tz - pz);
        if (d > 0.35) {
          px += ((tx - px) / d) * Math.min(d, 8.4 * dt);
          pz += ((tz - pz) / d) * Math.min(d, 8.4 * dt);
          yaw.current = Math.atan2(-(tx - px), -(tz - pz));
          gait.current = true;
        } else gait.current = false;
        if (!live.smashed.bramfollow) {
          live.smashed.bramfollow = true;
          useGame.getState().addCoins(5);
        }
      }
    } else if (id === "ash" && live.ashFollow && !live.house) {
      const tx = live.x - Math.sin(live.yaw + 0.8) * 1.6;
      const tz = live.z - Math.cos(live.yaw + 0.8) * 1.6;
      const d = Math.hypot(tx - px, tz - pz);
      if (d > 0.4) {
        px += ((tx - px) / d) * Math.min(d, 7.2 * dt);
        pz += ((tz - pz) / d) * Math.min(d, 7.2 * dt);
        yaw.current = Math.atan2(-(tx - px), -(tz - pz));
        gait.current = true;
      } else gait.current = false;
    } else if (id === "gale") {
      if (live.balloonRide) {
        px = live.x + 0.38;
        pz = live.z + 0.22;
        yaw.current = live.yaw + 0.4;
      } else {
        px = live.balloonX + 2.15;
        pz = live.balloonZ + 1.35;
        yaw.current = Math.atan2(-(live.x - px), -(live.z - pz));
      }
      gait.current = false;
    } else if (id === "mira" && chore === "pick") {
      px = ORCHARD_LADDER.x;
      pz = ORCHARD_LADDER.z;
      yaw.current = ORCHARD_LADDER_YAW;
      gait.current = false;
    } else if (!stay && !talking && !sit && !hearth) {
      wait.current -= dt;
      if (wait.current <= 0) {
        let picked = false;
        for (let n = 0; n < 8; n++) {
          const a = Math.random() * Math.PI * 2;
          const r = 1.4 + Math.random() * 2.4;
          const tx = x + Math.cos(a) * r;
          const tz = z + Math.sin(a) * r;
          if (!blockNpc(tx, tz, id)) {
            dest.current = { x: tx, z: tz };
            picked = true;
            break;
          }
        }
        if (!picked) dest.current = { x: px, z: pz };
        wait.current = 2.4 + Math.random() * 5;
      }
      const dx = dest.current.x - px;
      const dz = dest.current.z - pz;
      const d = Math.hypot(dx, dz);
      if (d > 0.35) {
        const sp = 1.35 * dt;
        px += (dx / d) * sp;
        pz += (dz / d) * sp;
        const hit = blockNpc(px, pz, id);
        if (hit) {
          px = hit.x;
          pz = hit.z;
          dest.current = { x: px, z: pz };
          wait.current = 1.2 + Math.random() * 2;
          gait.current = false;
        } else {
          yaw.current = Math.atan2(-dx, -dz);
          gait.current = true;
        }
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
    } else if (id && live.sit && !talking && Math.hypot(live.x - px, live.z - pz) < 3.4) {
      sitPose.current = true;
    }
    if (talking) yaw.current = Math.atan2(-(live.x - px), -(live.z - pz));
    if (live.bellT > 0) yaw.current = Math.atan2(-(BELL_AT.x - px), -(BELL_AT.z - pz));
    punch.current = Math.max(0, punch.current - dt);
    tag.current = Math.max(0, tag.current - dt);
    if (id && tag.current > 0 && kid && !talking && live.carryKid !== id) {
      if (live.hideBarrel || live.sit) {
        if (!live.smashed.hidetag) {
          live.smashed.hidetag = true;
          useGame.getState().addCoins(7);
          sfx.ok();
        }
        tag.current = 0;
      } else {
      const dx = live.x - px;
      const dz = live.z - pz;
      const d = Math.hypot(dx, dz) || 1;
      if (d > 0.9) {
        px += (dx / d) * 4.4 * dt;
        pz += (dz / d) * 4.4 * dt;
        yaw.current = Math.atan2(-dx, -dz);
        gait.current = true;
      } else if (!live.smashed.kidtag) {
        live.smashed.kidtag = true;
        useGame.getState().addCoins(6);
        sfx.ok();
        tag.current = 0;
      }
      }
    }
    if (id && !live.house) {
      const pd = Math.hypot(live.x - px, live.z - pz);
      if (live.slash && Math.hypot(live.slash.x - px, live.slash.z - pz) < 1.45) {
        live.npcMad[id] = Math.max(live.npcMad[id] ?? 0, 8);
        live.npcTarget[id] = "hero";
        live.npcMood[id] = "mad";
        if (!kid) live.hint = "You started a fight.";
        else live.hint = "The kid is scared.";
      }
      if (kid && pd < 3.4 && Math.abs(live.speed) > 15 && tag.current <= 0) {
        tag.current = 12;
      }
      if (pd < 0.85 && Math.abs(live.speed) > 2.4 && !live.mounted && !live.sit) {
        const fx = -Math.sin(live.yaw);
        const fz = -Math.cos(live.yaw);
        px += fx * 0.48;
        pz += fz * 0.48;
        live.npcBumps[id] = (live.npcBumps[id] ?? 0) + dt * 5;
        if (pondU(px, pz) > 0.36) {
          live.npcMad[id] = Math.max(live.npcMad[id] ?? 0, 7);
          live.npcMood[id] = "mad";
          live.npcTarget[id] = "hero";
          if (!live.smashed.pondpush) {
            live.smashed.pondpush = true;
            useGame.getState().addCoins(8);
            sfx.ok();
          }
        } else if (kid && Math.abs(live.speed) > 8) {
          tag.current = 12;
        } else if ((live.npcBumps[id] ?? 0) > 2.4) {
          live.npcMad[id] = Math.max(live.npcMad[id] ?? 0, 6);
          live.npcTarget[id] = "hero";
        }
      }
      if (live.shieldUp && pd < 1.3 && Math.abs(live.speed) > 2.4 && !kid) {
        const fx = -Math.sin(live.yaw);
        const fz = -Math.cos(live.yaw);
        px += fx * 0.7;
        pz += fz * 0.7;
        live.npcMad[id] = Math.max(live.npcMad[id] ?? 0, 5);
        live.npcMood[id] = "mad";
        if (!live.smashed.shieldbash) {
          live.smashed.shieldbash = true;
          useGame.getState().addCoins(6);
          sfx.thud();
        }
      }
      if (live.rolling && pd < 1.35 && !kid) {
        scare.current = true;
        live.npcMad[id] = Math.max(live.npcMad[id] ?? 0, 3);
        if (!live.smashed.rollscare) {
          live.smashed.rollscare = true;
          useGame.getState().addCoins(6);
          sfx.ok();
        }
      }
      if (live.talking && live.talkNpc === id && (live.hat || live.flowerHat)) {
        live.npcMood[id] = kid ? "laugh" : live.hat === "pot" ? "scared" : "laugh";
        if (!live.smashed.hathaha) {
          live.smashed.hathaha = true;
          useGame.getState().addCoins(6);
          sfx.ok();
        }
      }
      if (live.wetT > 0.4 && pd < 1.15 && Math.abs(live.speed) > 3) {
        live.hint = "You dripped on them.";
        if (!live.smashed.dripnpc) {
          live.smashed.dripnpc = true;
          useGame.getState().addCoins(5);
          sfx.ok();
        }
      }
      const anger = live.npcMad[id] ?? 0;
      mad.current = anger > 0 && !kid;
      scare.current = (anger > 0 && kid) || (live.lastBoom != null && Math.hypot((live.lastBoom.x) - px, live.lastBoom.z - pz) < 8);
      if (anger > 0) {
        const tid = live.npcTarget[id] ?? "hero";
        let tx = live.x;
        let tz = live.z;
        const other = tid !== "hero" ? live.npcPos[tid] : null;
        if (other) {
          tx = other.x;
          tz = other.z;
        } else if (kid) {
          tx = px + (px - live.x);
          tz = pz + (pz - live.z);
        }
        const dx = tx - px;
        const dz = tz - pz;
        const d = Math.hypot(dx, dz) || 1;
        if (d > 0.75) {
          const sp = (kid ? 3.4 : 5.2) * dt;
          px += (dx / d) * sp;
          pz += (dz / d) * sp;
          yaw.current = Math.atan2(-dx, -dz);
          gait.current = true;
        } else if (!kid && tid === "hero" && punch.current <= 0 && pd < 1.2) {
          punch.current = 0.75;
          useGame.getState().hurtField(2, true);
          sfx.thud();
          live.hint = "They punched you. Fair.";
        } else if (!kid && other && d < 0.9) {
          live.hint = "They are arguing about the bomb.";
        }
      }
      if (live.hat === "mask" && pd < 3.2 && kid) {
        scare.current = true;
        live.npcMood[id] = "scared";
        const dx = px - live.x;
        const dz = pz - live.z;
        const d = Math.hypot(dx, dz) || 1;
        px += (dx / d) * 3.8 * dt;
        pz += (dz / d) * 3.8 * dt;
        if (!live.smashed.maskkids) {
          live.smashed.maskkids = true;
          useGame.getState().addCoins(6);
          sfx.ok();
        }
      }
      if (live.carry === "cucco" && pd < 2.2 && !kid) {
        scare.current = true;
        if (!live.smashed.chickennpc) {
          live.smashed.chickennpc = true;
          live.listen = "They backed up. The chicken is judging them.";
        }
      }
      if (live.carry === "crate" && pd < 0.95 && Math.abs(live.speed) > 3) {
        live.npcMad[id] = Math.max(live.npcMad[id] ?? 0, 4);
        live.knock = { vx: Math.sin(live.yaw) * 6, vz: Math.cos(live.yaw) * 6, t: 0.35 };
        if (!live.smashed.cratebonk) {
          live.smashed.cratebonk = true;
          useGame.getState().addCoins(5);
        }
      }
      if (live.townSheep && pd < 2.4) {
        scare.current = true;
      }
      if (live.jumpStretch > 0.4 && pd < 1.5 && !kid) {
        wave.current = true;
        if (!live.smashed.highfive) {
          live.smashed.highfive = true;
          useGame.getState().addCoins(5);
          sfx.ok();
        }
      }
      if (live.spinning && pd < 4.5 && anger <= 0) {
        wave.current = true;
        live.hint = "They waved back.";
      } else if (anger <= 0) wave.current = false;
      if (live.swim && pd < 2.2) live.hint = "You're dripping on them.";
    }
    const stuck = blockNpc(px, pz, id);
    if (stuck) {
      px = stuck.x;
      pz = stuck.z;
    }
    if (id && live.carryKid === id) {
      const back = live.mounted ? 0.48 : 0.05;
      px = live.x + Math.sin(live.yaw) * back;
      pz = live.z + Math.cos(live.yaw) * back;
      yaw.current = live.yaw;
      gait.current = false;
      sitPose.current = true;
    }
    pos.current = { x: px, z: pz };
    if (id) live.npcPos[id] = { x: px, z: pz };
    const gy = id && live.carryKid === id
      ? live.y + (live.mounted ? 0.78 : 1.18)
      : id === "gale" && live.balloonRide ? live.y : (floorY ?? heightAt(px, pz));
    const climbY = id === "mira" && chore === "pick" ? 1.85 : 0;
    root.current.position.set(px, gy + (sitPose.current && live.carryKid !== id ? 0.28 : 0) + climbY, pz);
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
        moodId={id}
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
    const rear = Math.min(1, live.horseRear);
    root.current.position.set(hx, hy + rear * 0.28, hz);
    root.current.rotation.set(-rear * 0.72, live.horseYaw, 0);
    const moving = live.mounted ? Math.abs(live.speed) > 0.4 && rear <= 0 : live.horseCall;
    const dir = live.speed < -0.2 ? -1 : 1;
    phase.current += dt * (moving ? 10 * dir : 2.2);
    const g = Math.sin(phase.current);
    if (lF.current) lF.current.rotation.x = rear > 0.1 ? -0.85 : moving ? g * 0.32 : 0.08;
    if (rF.current) rF.current.rotation.x = rear > 0.1 ? -0.85 : moving ? -g * 0.32 : 0.06;
    if (lB.current) lB.current.rotation.x = rear > 0.1 ? 0.45 : moving ? -g * 0.28 : 0.04;
    if (rB.current) rB.current.rotation.x = rear > 0.1 ? 0.45 : moving ? g * 0.28 : 0.05;
    if (tail.current) tail.current.rotation.z = 0.4 + Math.sin(phase.current * 0.8) * 0.15;
  });
  const coat = "#6a4a28";
  const mane = "#2a2018";
  return (
    <group ref={root}>
      <GroundBlob radius={0.7} opacity={0.32} y={0.03} />
      <mesh position={[0, 0.72, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.26, 1.05, 4, 8]} />
        {lamb(coat)}
      </mesh>
      <mesh position={[0, 0.92, -0.52]} rotation={[0.85, 0, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.42, 4, 7]} />
        {lamb(coat)}
      </mesh>
      <mesh position={[0, 1.18, -0.78]} castShadow>
        <sphereGeometry args={[0.18, 8, 7]} />
        {lamb(coat)}
      </mesh>
      <mesh position={[0, 1.12, -0.96]} castShadow>
        <sphereGeometry args={[0.1, 6, 5]} />
        {lamb("#3a2a20")}
      </mesh>
      <mesh position={[-0.1, 1.32, -0.72]} rotation={[0.15, 0, -0.35]} castShadow>
        <boxGeometry args={[0.05, 0.16, 0.08]} />
        {lamb(coat)}
      </mesh>
      <mesh position={[0.1, 1.32, -0.72]} rotation={[0.15, 0, 0.35]} castShadow>
        <boxGeometry args={[0.05, 0.16, 0.08]} />
        {lamb(coat)}
      </mesh>
      <mesh position={[0, 1.08, -0.42]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.08, 0.28, 0.42]} />
        {lamb(mane)}
      </mesh>
      <group ref={tail} position={[0, 0.82, 0.62]} rotation={[0.55, 0, 0.4]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.45, 3, 6]} />
          {lamb(mane)}
        </mesh>
      </group>
      <group ref={lF} position={[-0.16, 0.58, -0.38]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.38, 3, 6]} />
          {lamb(coat)}
        </mesh>
        <mesh position={[0, -0.5, 0.02]} castShadow>
          <boxGeometry args={[0.11, 0.09, 0.15]} />
          {lamb("#1a1410")}
        </mesh>
      </group>
      <group ref={rF} position={[0.16, 0.58, -0.38]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.38, 3, 6]} />
          {lamb(coat)}
        </mesh>
        <mesh position={[0, -0.5, 0.02]} castShadow>
          <boxGeometry args={[0.11, 0.09, 0.15]} />
          {lamb("#1a1410")}
        </mesh>
      </group>
      <group ref={lB} position={[-0.18, 0.6, 0.4]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.38, 3, 6]} />
          {lamb(coat)}
        </mesh>
        <mesh position={[0, -0.5, 0.02]} castShadow>
          <boxGeometry args={[0.11, 0.09, 0.15]} />
          {lamb("#1a1410")}
        </mesh>
      </group>
      <group ref={rB} position={[0.18, 0.6, 0.4]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.38, 3, 6]} />
          {lamb(coat)}
        </mesh>
        <mesh position={[0, -0.5, 0.02]} castShadow>
          <boxGeometry args={[0.11, 0.09, 0.15]} />
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
  const hit = useRef(false);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (hit.current || live.house) {
      if (g.current && hit.current) g.current.rotation.set(0.35, 0.15, 0.4);
      return;
    }
    if (live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 1.4) {
      hit.current = true;
      if (!live.smashed.signslash) {
        live.smashed.signslash = true;
        useGame.getState().addCoins(6);
        sfx.ok();
      }
    }
  });
  return (
    <group ref={g} position={[x, y, z]}>
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

export function Flame({ scale = 1 }: { scale?: number }) {
  const tongues = useRef<THREE.Group>(null);
  const sparks = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (tongues.current) {
      tongues.current.children.forEach((c, i) => {
        const flick = 0.84 + Math.sin(t * (8.5 + i * 2.2) + i) * 0.16 + Math.sin(t * 19 + i * 4) * 0.07;
        c.scale.y = flick;
        c.scale.x = 0.92 + Math.sin(t * 12 + i) * 0.1;
        c.scale.z = 0.92 + Math.cos(t * 10 + i) * 0.08;
        c.rotation.y = Math.sin(t * 2.6 + i) * 0.2;
      });
    }
    if (sparks.current) {
      sparks.current.children.forEach((c, i) => {
        const u = (t * 0.48 + i * 0.13) % 1;
        c.position.set(Math.sin(i * 2.5 + t) * 0.14 * scale, 0.28 * scale + u * 1.35 * scale, Math.cos(i * 1.9 + t * 0.4) * 0.14 * scale);
        const s = (1 - u) * (1 - u) * 0.05 * scale;
        c.scale.setScalar(Math.max(0.001, s));
      });
    }
  });
  const bits: { x: number; y: number; z: number; s: [number, number, number]; c: string; e: string }[] = [
    { x: 0, y: 0.22, z: 0, s: [0.16, 0.42, 0.16], c: "#2a0c06", e: "#6a1808" },
    { x: 0.02, y: 0.32, z: 0.01, s: [0.26, 0.7, 0.24], c: "#c44014", e: "#ff5010" },
    { x: -0.05, y: 0.38, z: -0.03, s: [0.18, 0.62, 0.18], c: "#e86818", e: "#ff7818" },
    { x: 0.06, y: 0.44, z: 0.02, s: [0.14, 0.55, 0.14], c: "#f4a030", e: "#ffc040" },
    { x: 0, y: 0.58, z: 0, s: [0.1, 0.72, 0.1], c: "#ffe078", e: "#fff0a8" },
    { x: -0.04, y: 0.5, z: 0.05, s: [0.09, 0.4, 0.09], c: "#ffd060", e: "#ffe890" },
  ];
  return (
    <group scale={scale}>
      <pointLight color="#ff9a38" intensity={2.2 * scale} distance={7 * scale} decay={2} position={[0, 0.45, 0]} />
      <group ref={tongues}>
        {bits.map((b, i) => (
          <mesh key={i} position={[b.x, b.y, b.z]} scale={b.s} rotation={[0, i * 0.6, 0]}>
            <coneGeometry args={[1, 1, 5]} />
            <meshLambertMaterial color={b.c} emissive={b.e} emissiveIntensity={1.15} transparent opacity={0.92} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <group ref={sparks}>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[1, 5, 4]} />
            <meshLambertMaterial color="#ffd070" emissive="#ffc050" emissiveIntensity={1.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
