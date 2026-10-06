import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { lamb } from "./mats";
import { live } from "./live";
import type { NimMood } from "../companion";

/** Shared gray-wolf coat. Warm, layered, never one flat gray. */
const COAT = "#8a847c";
const SADDLE = "#5a5550";
const SHADE = "#6c6761";
const LIGHT = "#cfc8bc";
const CHEEK = "#d8d2c6";
const MUZ = "#b9b3a8";
const DARK = "#2e2a26";
const PAD = "#241e1a";
const NOSE = "#1a1410";
const EYE = "#e0a040";
const INNER = "#c4a090";
const TIP = "#d4cec4";

const SPH = /* @__PURE__ */ new THREE.SphereGeometry(1, 9, 7);
const SPH_LO = /* @__PURE__ */ new THREE.SphereGeometry(1, 7, 5);

function Fur({
  p,
  s = [1.35, 0.52, 1.12],
  r = 0.07,
  c = COAT,
  lo,
}: {
  p: [number, number, number];
  s?: [number, number, number];
  r?: number;
  c?: string;
  lo?: boolean;
}) {
  return (
    <mesh geometry={lo ? SPH_LO : SPH} position={p} scale={[r * s[0], r * s[1], r * s[2]]} castShadow>
      {lamb(c, { kind: "wool" })}
    </mesh>
  );
}

function Cap({
  p,
  rot,
  r,
  h,
  c,
  wool = true,
}: {
  p: [number, number, number];
  rot?: [number, number, number];
  r: number;
  h: number;
  c: string;
  wool?: boolean;
}) {
  return (
    <mesh position={p} rotation={rot} castShadow>
      <capsuleGeometry args={[r, h, 5, 8]} />
      {lamb(c, { kind: wool ? "wool" : "default" })}
    </mesh>
  );
}

type Bit = { p: [number, number, number]; s: [number, number, number]; r: number; c: string };

function bodyFur(): Bit[] {
  const bits: Bit[] = [];
  const add = (x: number, y: number, z: number, sx: number, sy: number, sz: number, r: number, c: string) =>
    bits.push({ p: [x, y, z], s: [sx, sy, sz], r, c });
  for (let i = 0; i < 8; i++) {
    const u = i / 7;
    const z = -0.24 + u * 0.6;
    const y = 0.51 - u * 0.05 + (u > 0.35 && u < 0.7 ? 0.015 : 0);
    add(0, y + 0.07, z, 1.7, 0.5, 1.35, 0.09 - u * 0.012, u < 0.25 ? COAT : SADDLE);
    add(-0.1, y + 0.02, z, 1.2, 0.48, 1.15, 0.075, SHADE);
    add(0.1, y + 0.02, z, 1.2, 0.48, 1.15, 0.075, SHADE);
  }
  for (let i = 0; i < 6; i++) {
    const a = -0.7 + (i / 5) * 1.4;
    add(Math.sin(a) * 0.14, 0.42, -0.26 + Math.cos(a) * 0.08, 1.45, 0.62, 1.2, 0.08, i % 2 ? LIGHT : COAT);
  }
  add(0, 0.36, -0.24, 1.8, 0.7, 1.5, 0.095, LIGHT);
  add(0, 0.32, -0.1, 1.6, 0.55, 1.4, 0.085, LIGHT);
  add(-0.16, 0.5, -0.16, 1.3, 0.5, 1.2, 0.075, COAT);
  add(0.16, 0.5, -0.16, 1.3, 0.5, 1.2, 0.075, COAT);
  add(-0.14, 0.44, 0.26, 1.25, 0.5, 1.15, 0.07, SHADE);
  add(0.14, 0.44, 0.26, 1.25, 0.5, 1.15, 0.07, SHADE);
  add(0, 0.48, 0.34, 1.4, 0.48, 1.1, 0.065, SADDLE);
  for (const sd of [-1, 1]) {
    add(sd * 0.09, 0.28, -0.14, 1.1, 0.7, 1.2, 0.06, COAT);
    add(sd * 0.08, 0.26, 0.2, 1.15, 0.72, 1.15, 0.055, SHADE);
  }
  return bits;
}

function headFur(): Bit[] {
  const bits: Bit[] = [];
  const add = (x: number, y: number, z: number, sx: number, sy: number, sz: number, r: number, c: string) =>
    bits.push({ p: [x, y, z], s: [sx, sy, sz], r, c });
  add(0, 0.08, 0.02, 1.55, 0.5, 1.3, 0.07, SADDLE);
  add(-0.1, 0.02, -0.02, 1.4, 0.62, 1.2, 0.075, CHEEK);
  add(0.1, 0.02, -0.02, 1.4, 0.62, 1.2, 0.075, CHEEK);
  add(-0.08, -0.02, 0.04, 1.2, 0.5, 1.1, 0.055, COAT);
  add(0.08, -0.02, 0.04, 1.2, 0.5, 1.1, 0.055, COAT);
  add(0, 0.06, -0.08, 1.3, 0.45, 1.15, 0.05, COAT);
  add(-0.07, 0.1, 0.0, 1.1, 0.48, 1.0, 0.04, SADDLE);
  add(0.07, 0.1, 0.0, 1.1, 0.48, 1.0, 0.04, SADDLE);
  return bits;
}

function tailFur(): Bit[] {
  const bits: Bit[] = [];
  for (let i = 0; i < 7; i++) {
    const u = i / 6;
    const z = 0.05 + u * 0.42;
    const y = 0.01 - u * 0.05;
    const r = 0.062 * (1 - u * 0.48);
    bits.push({
      p: [0, y, z],
      s: [1.4, 0.62, 1.25],
      r,
      c: u < 0.15 ? SADDLE : u > 0.8 ? TIP : i % 2 ? COAT : SHADE,
    });
    if (i < 5) {
      bits.push({ p: [-r * 0.55, y - 0.008, z + 0.015], s: [1.1, 0.5, 1.05], r: r * 0.62, c: SHADE });
      bits.push({ p: [r * 0.55, y - 0.008, z + 0.015], s: [1.1, 0.5, 1.05], r: r * 0.62, c: COAT });
    }
  }
  return bits;
}

function WolfEar({ side }: { side: number }) {
  return (
    <group position={[side * 0.078, 0.12, 0.02]} rotation={[0.18, side * 0.22, side * 0.32]}>
      <mesh scale={[0.42, 1, 0.2]} castShadow>
        <coneGeometry args={[0.09, 0.2, 6]} />
        {lamb(COAT, { kind: "wool" })}
      </mesh>
      <mesh position={[0, 0.01, 0.012]} scale={[0.26, 0.82, 0.08]}>
        <coneGeometry args={[0.09, 0.175, 6]} />
        {lamb(INNER, { kind: "wool" })}
      </mesh>
      <mesh position={[0, 0.1, 0]} scale={[0.7, 0.45, 0.55]} castShadow>
        <sphereGeometry args={[0.028, 6, 5]} />
        {lamb(SADDLE, { kind: "wool" })}
      </mesh>
    </group>
  );
}

function WolfPaw({ dark }: { dark?: boolean }) {
  const c = dark ? PAD : DARK;
  return (
    <group>
      <mesh position={[0, 0, 0.018]} scale={[1.15, 0.52, 1.45]} castShadow>
        <sphereGeometry args={[0.042, 7, 5]} />
        {lamb(c, { kind: "wool" })}
      </mesh>
      {[-0.018, 0, 0.018].map((x) => (
        <mesh key={x} position={[x, -0.006, 0.042]} scale={[0.7, 0.4, 0.85]} castShadow>
          <sphereGeometry args={[0.016, 5, 4]} />
          {lamb(c, { kind: "wool" })}
        </mesh>
      ))}
    </group>
  );
}

function WolfLeg({
  side,
  hind,
  gRef,
  lowRef,
}: {
  side: number;
  hind?: boolean;
  gRef: RefObject<THREE.Group | null>;
  lowRef: RefObject<THREE.Group | null>;
}) {
  const hipY = hind ? 0.47 : 0.52;
  const z = hind ? 0.28 : -0.2;
  const x = side * (hind ? 0.1 : 0.118);
  return (
    <group ref={gRef} position={[x, hipY, z]}>
      <mesh position={[side * 0.02, hind ? 0.02 : 0.04, hind ? -0.01 : 0]} scale={[1.15, 0.85, 1.2]} castShadow>
        <sphereGeometry args={[hind ? 0.07 : 0.075, 8, 6]} />
        {lamb(hind ? SHADE : COAT, { kind: "wool" })}
      </mesh>
      <Cap
        p={[0, hind ? -0.1 : -0.11, hind ? 0.02 : 0.01]}
        rot={[hind ? 0.22 : 0.12, 0, side * 0.06]}
        r={hind ? 0.048 : 0.05}
        h={hind ? 0.16 : 0.18}
        c={COAT}
      />
      <group ref={lowRef} position={[0, hind ? -0.2 : -0.22, hind ? 0.05 : 0.03]}>
        <Cap p={[0, -0.08, 0.02]} rot={[hind ? 0.28 : 0.18, 0, 0]} r={0.034} h={0.14} c={SHADE} />
        <Fur p={[0, -0.04, -0.02]} s={[1.1, 0.7, 1.3]} r={0.045} c={SHADE} lo />
        <group position={[0, -0.175, 0.04]}>
          <WolfPaw />
        </group>
      </group>
    </group>
  );
}

/**
 * Stylized gray wolf. Horizontal quadruped, snout along local -Z
 * (matches Numeria yaw=0 → world -Z). Paws sit on y=0.
 */
export function FangWolf({ studio = false }: { studio?: boolean }) {
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Group>(null);
  const earR = useRef<THREE.Group>(null);
  const fl = useRef<THREE.Group>(null);
  const fr = useRef<THREE.Group>(null);
  const hl = useRef<THREE.Group>(null);
  const hr = useRef<THREE.Group>(null);
  const flLow = useRef<THREE.Group>(null);
  const frLow = useRef<THREE.Group>(null);
  const hlLow = useRef<THREE.Group>(null);
  const hrLow = useRef<THREE.Group>(null);
  const sit = useRef(0);
  const gait = useRef(0);
  const blink = useRef(2.2);
  const lids = useRef<THREE.Group>(null);
  const coat = useMemo(bodyFur, []);
  const mane = useMemo(headFur, []);
  const plume = useMemo(tailFur, []);

  useFrame((_, raw) => {
    const dt = Math.min(0.08, raw);
    const mood: NimMood = studio
      ? live.viewerAnim === "run" || live.viewerAnim === "sprint"
        ? "hop"
        : live.viewerAnim === "walk"
          ? "walk"
          : live.viewerAnim === "hurt"
            ? "growl"
            : "idle"
      : (live.nimMood as NimMood);
    const moving =
      mood === "walk" || mood === "hop" || mood === "fetch" || mood === "track" || mood === "sniff" || mood === "dig";
    const running = mood === "hop" || mood === "fetch";
    const wantSit = mood === "sit" || mood === "plate" || mood === "look" ? 1 : mood === "hide" || mood === "crawl" ? 0.55 : 0;
    sit.current += (wantSit - sit.current) * Math.min(1, 1 - Math.exp(-dt * 7));
    const s = sit.current;
    const t = live.playT;
    const spd = running ? 14 : mood === "walk" || mood === "track" ? 9.2 : mood === "dig" ? 16 : 0;
    if (moving) gait.current += dt * spd;
    const g = gait.current;
    const step = moving ? Math.sin(g) : 0;
    const stepB = moving ? Math.sin(g + Math.PI) : 0;
    const amp = running ? 0.55 : 0.38;
    const lift = running ? 0.12 : 0.07;

    if (body.current) {
      body.current.rotation.x = s * 0.42 + (mood === "sniff" ? 0.38 : mood === "dig" ? 0.28 : mood === "growl" ? 0.12 : 0);
      body.current.position.y = -s * 0.1 + (mood === "crawl" ? -0.12 : 0) + (moving ? Math.sin(g * 2) * 0.012 : Math.sin(t * 2.2) * 0.008);
      body.current.rotation.z = moving ? step * 0.04 : 0;
    }
    if (chest.current) {
      const breath = 1 + Math.sin(t * (mood === "growl" ? 5 : 2.15)) * 0.025;
      chest.current.scale.set(breath, 1 + (breath - 1) * 0.6, breath);
    }
    const plant = (leg: THREE.Group | null, low: THREE.Group | null, ph: number, hind: boolean) => {
      if (!leg) return;
      const raise = Math.max(0, ph) * lift;
      leg.rotation.x = ph * amp * (hind ? 0.9 : 1) - s * (hind ? 1.15 : 0.15);
      leg.position.y = (hind ? 0.47 : 0.52) + raise - s * (hind ? 0.16 : 0.04);
      if (low) low.rotation.x = Math.max(0, -ph) * 0.45 + s * (hind ? 1.35 : 0.35);
    };
    plant(fl.current, flLow.current, step, false);
    plant(fr.current, frLow.current, stepB, false);
    plant(hl.current, hlLow.current, stepB, true);
    plant(hr.current, hrLow.current, step, true);

    if (head.current) {
      let lookY = 0;
      let lookX = mood === "sniff" ? 0.55 : mood === "dig" ? 0.4 : mood === "growl" ? -0.12 : s * -0.28;
      if (!studio && (mood === "idle" || mood === "sit" || mood === "plate")) {
        const yaw = live.nimYaw || 0;
        const to = Math.atan2(-(live.x - live.nimX), -(live.z - live.nimZ));
        let d = to - yaw;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        lookY = THREE.MathUtils.clamp(d, -0.7, 0.7);
        lookX += THREE.MathUtils.clamp((live.y + 1.05 - live.nimY) * 0.08, -0.25, 0.2);
      } else if (moving) {
        lookY = Math.sin(t * 0.7) * 0.08;
      }
      head.current.rotation.y += (lookY - head.current.rotation.y) * Math.min(1, dt * 6);
      head.current.rotation.x += (lookX - head.current.rotation.x) * Math.min(1, dt * 8);
    }
    const twitch = Math.sin(t * 3.05) * 0.07;
    const alert = live.nimAlert || (mood === "growl" ? 1 : 0);
    if (earL.current) earL.current.rotation.z = 0.08 + twitch - alert * 0.35 + (mood === "sniff" ? 0.1 : 0);
    if (earR.current) earR.current.rotation.z = -0.08 - twitch * 0.8 + alert * 0.35 - (mood === "sniff" ? 0.1 : 0);
    if (tail.current) {
      const wagSpd = mood === "fetch" || mood === "hop" ? 11 : mood === "sit" || mood === "idle" ? 2.4 : 6.5;
      const wag = Math.sin(t * wagSpd) * (mood === "hide" || mood === "growl" ? 0.06 : 0.22);
      tail.current.rotation.y = wag;
      tail.current.rotation.x = 0.95 - s * 0.1 + (mood === "hide" || mood === "growl" ? 0.35 : 0) + Math.sin(t * 2.1) * 0.03;
      tail.current.rotation.z = wag * 0.28;
    }
    blink.current -= dt;
    if (blink.current < 0) blink.current = 2.1 + Math.random() * 2.8;
    if (lids.current) lids.current.scale.y = blink.current < 0.12 ? 0.08 : 1;
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} renderOrder={-1}>
        <circleGeometry args={[0.28, 10]} />
        <meshBasicMaterial color="#1a1814" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <group ref={body}>
        <group ref={chest}>
          <Cap p={[0, 0.42, -0.16]} rot={[1.42, 0, 0]} r={0.14} h={0.24} c={COAT} />
          <mesh position={[0, 0.4, -0.18]} rotation={[1.35, 0, 0]} scale={[0.88, 1.08, 0.82]} castShadow>
            <sphereGeometry args={[0.155, 10, 8]} />
            {lamb(COAT, { kind: "wool" })}
          </mesh>
          <mesh position={[0, 0.34, -0.14]} rotation={[1.4, 0, 0]} scale={[0.7, 0.95, 0.68]} castShadow>
            <sphereGeometry args={[0.135, 8, 6]} />
            {lamb(LIGHT, { kind: "wool" })}
          </mesh>
        </group>
        <Cap p={[0, 0.39, 0.16]} rot={[1.55, 0, 0]} r={0.1} h={0.3} c={SADDLE} />
        <mesh position={[0, 0.37, 0.32]} scale={[0.92, 0.8, 1.08]} castShadow>
          <sphereGeometry args={[0.115, 8, 6]} />
          {lamb(SHADE, { kind: "wool" })}
        </mesh>
        <Cap p={[0, 0.5, -0.32]} rot={[0.85, 0, 0]} r={0.078} h={0.15} c={COAT} />
        {coat.map((b, i) => (
          <Fur key={i} p={b.p} s={b.s} r={b.r} c={b.c} lo={i % 3 === 0} />
        ))}

        <group ref={head} position={[0, 0.58, -0.42]}>
          <mesh scale={[1.08, 0.92, 1.22]} castShadow>
            <sphereGeometry args={[0.115, 12, 10]} />
            {lamb(COAT, { kind: "wool" })}
          </mesh>
          <mesh position={[0, 0.02, 0.06]} scale={[1.0, 0.7, 0.85]} castShadow>
            <sphereGeometry args={[0.1, 10, 8]} />
            {lamb(SADDLE, { kind: "wool" })}
          </mesh>
          <mesh position={[0, -0.01, -0.18]} rotation={[Math.PI / 2 + 0.06, 0, 0]} castShadow>
            <capsuleGeometry args={[0.05, 0.22, 5, 8]} />
            {lamb(MUZ, { kind: "wool" })}
          </mesh>
          <mesh position={[0, -0.028, -0.19]} rotation={[Math.PI / 2 + 0.1, 0, 0]}>
            <capsuleGeometry args={[0.03, 0.18, 4, 6]} />
            {lamb(LIGHT, { kind: "wool" })}
          </mesh>
          <mesh position={[0, -0.008, -0.34]} scale={[1.15, 0.72, 0.9]} castShadow>
            <sphereGeometry args={[0.032, 8, 6]} />
            {lamb(NOSE)}
          </mesh>
          <mesh position={[0, 0.01, -0.292]}>
            <sphereGeometry args={[0.007, 5, 4]} />
            <meshBasicMaterial color="#5a5048" />
          </mesh>
          <mesh position={[0, -0.045, -0.14]} rotation={[0.15, 0, 0]} scale={[0.9, 0.35, 1.05]}>
            <sphereGeometry args={[0.04, 7, 5]} />
            {lamb(DARK)}
          </mesh>
          {[-1, 1].map((sd) => (
            <mesh key={`chk${sd}`} position={[sd * 0.09, -0.01, -0.02]} scale={[1.05, 0.7, 0.95]} castShadow>
              <sphereGeometry args={[0.07, 8, 6]} />
              {lamb(CHEEK, { kind: "wool" })}
            </mesh>
          ))}
          {mane.map((b, i) => (
            <Fur key={`h${i}`} p={b.p} s={b.s} r={b.r} c={b.c} />
          ))}
          {[-1, 1].map((sd) => (
            <group key={`e${sd}`} position={[sd * 0.068, 0.03, -0.07]} rotation={[0.08, sd * 0.42, sd * 0.1]}>
              <mesh scale={[1.2, 0.72, 0.5]} castShadow>
                <sphereGeometry args={[0.028, 8, 6]} />
                {lamb("#1a100c")}
              </mesh>
              <mesh position={[0, 0.002, 0.012]} scale={[0.95, 0.78, 0.42]}>
                <sphereGeometry args={[0.02, 8, 6]} />
                {lamb(EYE, { kind: "eye", emissive: EYE, emit: 0.18 })}
              </mesh>
              <mesh position={[0, 0.002, 0.016]} scale={[0.45, 0.7, 0.25]}>
                <sphereGeometry args={[0.012, 6, 5]} />
                {lamb(NOSE)}
              </mesh>
              <mesh position={[sd * -0.006, 0.008, 0.02]}>
                <sphereGeometry args={[0.005, 5, 4]} />
                <meshBasicMaterial color="#fff6e8" />
              </mesh>
              <mesh position={[0, 0.022, 0.004]} scale={[1.15, 0.22, 0.7]}>
                <sphereGeometry args={[0.028, 6, 4]} />
                {lamb(SADDLE, { kind: "wool" })}
              </mesh>
            </group>
          ))}
          <group ref={lids}>
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[sd * 0.068, 0.042, -0.068]} rotation={[0.2, sd * 0.4, 0]} scale={[1.05, 0.18, 0.55]}>
                <sphereGeometry args={[0.03, 6, 4]} />
                {lamb(COAT, { kind: "wool" })}
              </mesh>
            ))}
          </group>
          <group ref={earL}>
            <WolfEar side={-1} />
          </group>
          <group ref={earR}>
            <WolfEar side={1} />
          </group>
        </group>

        <group ref={tail} position={[0, 0.36, 0.36]}>
          <Cap p={[0, -0.02, 0.14]} rot={[1.28, 0, 0]} r={0.042} h={0.32} c={SADDLE} />
          {plume.map((b, i) => (
            <Fur key={`t${i}`} p={b.p} s={b.s} r={b.r} c={b.c} lo />
          ))}
        </group>

        <WolfLeg side={-1} gRef={fl} lowRef={flLow} />
        <WolfLeg side={1} gRef={fr} lowRef={frLow} />
        <WolfLeg side={-1} hind gRef={hl} lowRef={hlLow} />
        <WolfLeg side={1} hind gRef={hr} lowRef={hrLow} />
      </group>
    </group>
  );
}
