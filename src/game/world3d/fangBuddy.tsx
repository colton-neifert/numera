import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_HOME, TREE_LADDER, TREE_HOUSE_H, TREE_HD, TREE_DECK_D, WELL_AT, LOOK_AT, KEEP_Z } from "./field";
import { FANG_LOOKS } from "./wowPlay";
import { ALIVE_LOOKS } from "./alivePlay";
import { live } from "./live";
import { sfx } from "../audio";
import { lamb } from "./mats";
import { useGame } from "../store";
import { revealItem } from "../items";

const FUR = "#8e8a82";
const SHADE = "#6a6660";
const DARK = "#4a4640";
const LIGHT = "#cfc8be";
const NOSE = "#1a1410";
const EYE = "#c46a28";

const DIGS = [
  { id: "fang-yard", x: TREE_HOME.x + 5.6, z: TREE_HOME.z + 8.2, coins: 8 },
  { id: "fang-creek", x: -20.4, z: -134.8, coins: 10 },
  { id: "fang-cave", x: 19.2, z: 6.4, coins: 12 },
  { id: "fang-well", x: WELL_AT.x + 2.6, z: WELL_AT.z - 1.8, coins: 8 },
];

function fluff(c: string) {
  return lamb(c, { kind: "wool" });
}

/** Soft wolf — rounded tufts, long muzzle, no spikes. Local −Z is the snout. */
function WolfMesh({ phase, sit, lookY }: { phase: number; sit: number; lookY: number }) {
  const sway = Math.sin(phase);
  const trot = 1 - sit;
  const hip = sit * 0.22;
  const fl = Math.sin(phase) * 0.55 * trot;
  const fr = -fl;
  const bl = -fl * 0.92;
  const br = fl * 0.92;
  return (
    <group position={[0, sit * -0.18, 0]} rotation={[sit * 0.22, 0, 0]}>
      <mesh position={[0, 0.52 + hip, 0.06]} rotation={[0.08, 0, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.48, 5, 10]} />
        {fluff(FUR)}
      </mesh>
      <mesh position={[0, 0.56 + hip, -0.16]} scale={[1.15, 0.95, 1.05]} castShadow>
        <sphereGeometry args={[0.24, 10, 8]} />
        {fluff(FUR)}
      </mesh>
      <mesh position={[0, 0.5 + hip, -0.18]} scale={[0.85, 0.7, 0.7]} castShadow>
        <sphereGeometry args={[0.2, 8, 7]} />
        {fluff(LIGHT)}
      </mesh>
      <mesh position={[0, 0.5 + hip, 0.28]} scale={[0.9, 0.85, 1]} castShadow>
        <sphereGeometry args={[0.18, 8, 7]} />
        {fluff(SHADE)}
      </mesh>
      {[
        [0.16, 0.62, -0.02, 0.11],
        [-0.16, 0.62, -0.02, 0.11],
        [0.14, 0.58, 0.18, 0.1],
        [-0.14, 0.58, 0.18, 0.1],
        [0, 0.7, 0.04, 0.12],
        [0.1, 0.48, -0.28, 0.09],
        [-0.1, 0.48, -0.28, 0.09],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], p[1] + hip, p[2]]} scale={[1.15, 0.7, 1]} castShadow>
          <sphereGeometry args={[p[3], 7, 6]} />
          {fluff(i % 2 ? SHADE : FUR)}
        </mesh>
      ))}
      <group position={[0, 0.78 + hip * 0.4, -0.32]} rotation={[0.12 + lookY, 0, 0]}>
        <mesh position={[0, 0.02, 0.02]} castShadow>
          <sphereGeometry args={[0.155, 10, 8]} />
          {fluff(FUR)}
        </mesh>
        <mesh position={[0, -0.02, -0.16]} rotation={[0.18, 0, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.22, 4, 8]} />
          {fluff(LIGHT)}
        </mesh>
        <mesh position={[0, -0.01, -0.3]} scale={[0.9, 0.7, 1]} castShadow>
          <sphereGeometry args={[0.055, 7, 6]} />
          {fluff(LIGHT)}
        </mesh>
        <mesh position={[0, -0.01, -0.36]} castShadow>
          <sphereGeometry args={[0.028, 6, 5]} />
          {lamb(NOSE)}
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} name={s < 0 ? "fang-ear-l" : "fang-ear-r"} position={[s * 0.1, 0.16, 0.02]} rotation={[0.15, s * 0.12, s * 0.28]}>
            <mesh castShadow>
              <sphereGeometry args={[0.055, 7, 6]} />
              {fluff(FUR)}
            </mesh>
            <mesh position={[0, 0.05, -0.01]} scale={[0.7, 1.15, 0.45]} castShadow>
              <sphereGeometry args={[0.045, 6, 5]} />
              {fluff(SHADE)}
            </mesh>
          </group>
        ))}
        {[-1, 1].map((s) => (
          <group key={`e${s}`} position={[s * 0.07, 0.04, -0.12]}>
            <mesh>
              <sphereGeometry args={[0.032, 7, 6]} />
              {lamb("#f4eee4")}
            </mesh>
            <mesh position={[0, 0, -0.012]}>
              <sphereGeometry args={[0.018, 6, 5]} />
              {lamb(EYE, { emissive: EYE, emit: 0.18 })}
            </mesh>
            <mesh position={[0, 0, -0.022]}>
              <sphereGeometry args={[0.008, 5, 4]} />
              {lamb(NOSE)}
            </mesh>
          </group>
        ))}
        <mesh position={[0.05, -0.04, -0.22]} rotation={[0.4, 0.2, 0]} scale={[0.7, 0.35, 0.5]}>
          <sphereGeometry args={[0.04, 6, 5]} />
          {fluff("#3a2a24")}
        </mesh>
      </group>
      <Leg x={-0.14} z={-0.18} lift={fl} sit={sit} hip={hip} />
      <Leg x={0.14} z={-0.18} lift={fr} sit={sit} hip={hip} />
      <Leg x={-0.13} z={0.22} lift={bl} sit={sit} hip={hip} hind />
      <Leg x={0.13} z={0.22} lift={br} sit={sit} hip={hip} hind />
      <group position={[0, 0.58 + hip, 0.38]} rotation={[0.85 - sit * 0.35, 0, sway * 0.22]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, -0.02, -0.08 - i * 0.09]} scale={[1.15 - i * 0.12, 0.72, 1.05]} castShadow>
            <sphereGeometry args={[0.09 - i * 0.01, 7, 6]} />
            {fluff(i % 2 ? SHADE : FUR)}
          </mesh>
        ))}
        <mesh position={[0, 0.02, -0.06]} scale={[1.3, 0.55, 1.1]} castShadow>
          <sphereGeometry args={[0.08, 7, 6]} />
          {fluff(DARK)}
        </mesh>
      </group>
    </group>
  );
}

function Leg({ x, z, lift, sit, hip, hind }: { x: number; z: number; lift: number; sit: number; hip: number; hind?: boolean }) {
  const y = 0.42 + hip * 0.4;
  return (
    <group position={[x, y, z]} rotation={[lift * 0.55 + sit * (hind ? 0.9 : 0.35), 0, x > 0 ? 0.08 : -0.08]}>
      <mesh position={[0, -0.14, 0]} castShadow>
        <capsuleGeometry args={[0.045, hind ? 0.22 : 0.2, 3, 6]} />
        {fluff(SHADE)}
      </mesh>
      <mesh position={[0, -0.3, 0.01]} rotation={[0.15, 0, 0]} castShadow>
        <capsuleGeometry args={[0.038, 0.14, 3, 6]} />
        {fluff(DARK)}
      </mesh>
      <mesh position={[0, -0.4, 0.04]} scale={[1.15, 0.55, 1.35]} castShadow>
        <sphereGeometry args={[0.055, 6, 5]} />
        {lamb(NOSE)}
      </mesh>
    </group>
  );
}

function FangMounds() {
  return (
    <group>
      {DIGS.map((d) => (
        <Mound key={d.id} id={d.id} x={d.x} z={d.z} />
      ))}
    </group>
  );
}

function Mound({ id, x, z }: { id: string; x: number; z: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = !live.smashed[id] && !live.house;
  });
  const y = heightAt(x, z);
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh position={[0, 0.08, 0]} scale={[1.15, 0.45, 1]} castShadow>
        <sphereGeometry args={[0.32, 7, 5]} />
        {lamb("#6a5438", { kind: "dirt" })}
      </mesh>
      <mesh position={[0.12, 0.1, -0.08]} scale={[0.7, 0.35, 0.7]} castShadow>
        <sphereGeometry args={[0.22, 6, 5]} />
        {lamb("#5a4630", { kind: "dirt" })}
      </mesh>
    </group>
  );
}

export function FangBuddy() {
  const g = useRef<THREE.Group>(null);
  const pos = useRef({ x: TREE_HOME.x + 2.4, z: TREE_HOME.z + 3.2, y: 0, yaw: 0 });
  const phase = useRef(0);
  const sit = useRef(0);
  const look = useRef(0);
  const barkT = useRef(0);
  const mode = useRef<"follow" | "sit" | "alert" | "scout" | "play">("follow");
  const playA = useRef(0);
  const wasHouse = useRef(false);
  const mats = useMemo(() => 1, []);
  void mats;
  useFrame((_, dt) => {
    if (!g.current) return;
    const p = pos.current;
    const house = Boolean(live.house);
    const home = live.house === "yours";
    const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
    let tx: number;
    let tz: number;
    live.fangLookT = Math.max(0, live.fangLookT - dt);
    const sniff = DIGS.find((d) => {
      if (live.smashed[d.id]) return false;
      const fd = Math.hypot(p.x - d.x, p.z - d.z);
      const pd = Math.hypot(live.x - d.x, live.z - d.z);
      return fd < 9.5 || pd < 6.4;
    });
    const notice = !house && live.fangNotice ? live.fangNotice : null;
    const yardHomeX = TREE_HOME.x + 4.2;
    const yardHomeZ = TREE_HOME.z + 6.4;
    if (home) {
      tx = TREE_HOME.x + 2.05;
      tz = TREE_HOME.z + TREE_HD + Math.min(TREE_DECK_D * 0.55, 1.45);
    } else if (house) {
      tx = yardHomeX;
      tz = yardHomeZ;
    } else if (live.stickFly && !live.stickFly.held) {
      tx = live.stickFly.x;
      tz = live.stickFly.z;
    } else if (live.stickFly?.held) {
      tx = yardHomeX;
      tz = yardHomeZ;
    } else {
      const behind = 2.8;
      const side = 1.15;
      tx = live.x + Math.sin(live.yaw) * behind + Math.cos(live.yaw) * side;
      tz = live.z + Math.cos(live.yaw) * behind - Math.sin(live.yaw) * side;
    }
    wasHouse.current = house;
    let d = Math.hypot(tx - p.x, tz - p.z);
    if (d > 36) {
      p.x = tx;
      p.z = tz;
      d = 0;
    }
    const chasingStick = Boolean(live.stickFly && !live.stickFly.held);
    const heel = !house && !chasingStick && !live.stickFly?.held;
    const moving = !house && (chasingStick ? d > 0.45 : heel && d > 1.7);
    if (moving) {
      const sp = Math.min(d, (d > 8 ? 11 : chasingStick ? 9 : 4.6) * dt);
      if (d > 0.05) {
        p.x += ((tx - p.x) / d) * sp;
        p.z += ((tz - p.z) / d) * sp;
        p.yaw = Math.atan2(-(tx - p.x), -(tz - p.z));
      }
      mode.current = chasingStick ? "scout" : "follow";
    } else {
      let lookX = live.x;
      let lookZ = live.z;
      let best = 99;
      if (live.fangLookT > 0) {
        lookX = live.fangLookX;
        lookZ = live.fangLookZ;
        best = 0;
      } else if (live.stillT > 0.8) {
        for (const s of [...FANG_LOOKS, ...ALIVE_LOOKS]) {
          const dL = Math.hypot(p.x - s.x, p.z - s.z);
          if (dL < s.r && dL < best) {
            best = dL;
            lookX = s.x;
            lookZ = s.z;
          }
        }
        if (Math.hypot(live.x - LOOK_AT.x, live.z - LOOK_AT.z) < 5) {
          lookX = 0;
          lookZ = KEEP_Z;
        }
      }
      const face = Math.atan2(-(lookX - p.x), -(lookZ - p.z));
      p.yaw += Math.atan2(Math.sin(face - p.yaw), Math.cos(face - p.yaw)) * Math.min(1, dt * 3.2);
    }
    let alert = false;
    barkT.current = Math.max(0, barkT.current - dt);
    if (!house) {
      if (live.flyover && barkT.current <= 0 && live.smashed.valeLook) {
        barkT.current = 4.2;
        sfx.bark();
      }
      for (const id of live.aggroIds) {
        const f = live.foeTrack[id];
        if (!f) continue;
        const fd = Math.hypot(f.x - p.x, f.z - p.z);
        if (fd < 11) {
          alert = true;
          p.yaw = Math.atan2(-(f.x - p.x), -(f.z - p.z));
          if (barkT.current <= 0) {
            barkT.current = 2.6;
            sfx.bark();
          }
          break;
        }
      }
    }
    mode.current = house || (!moving && live.stillT > 1.4 && !alert && !sniff && !notice) ? "sit" : alert ? "alert" : mode.current;
    const wantSit = mode.current === "sit" ? 1 : sniff && d < 1.05 ? 0.35 : notice && d < 1.2 ? 0.28 : 0;
    sit.current += (wantSit - sit.current) * (1 - Math.exp(-dt * 6));
    phase.current += dt * (moving ? 9.6 : alert ? 4.2 : sniff ? 3.4 : 1.6);
    look.current += ((alert ? -0.12 : sniff || notice ? 0.42 : moving ? 0.06 : 0.02) - look.current) * (1 - Math.exp(-dt * 5));
    if (sniff && !house) {
      const at = Math.hypot(p.x - sniff.x, p.z - sniff.z);
      const playerNear = Math.hypot(live.x - sniff.x, live.z - sniff.z) < 3.6;
      if (at < 1.15 && playerNear) {
        if (barkT.current <= 0) {
          barkT.current = 2.8;
          sfx.bark();
        }
        if (live.stillT > 1.05 && !live.smashed[sniff.id]) {
          live.smashed[sniff.id] = true;
          const n = useGame.getState().addCoins(sniff.coins);
          if (n > 0) revealItem("coin");
          sfx.ok();
        }
      }
    }
    if (notice && !house) {
      const at = Math.hypot(p.x - notice.x, p.z - notice.z);
      if (at < 1.6 && barkT.current <= 0) {
        barkT.current = 3.4;
        sfx.bark();
      }
    }
    p.y = home ? plat : heightAt(p.x, p.z);
    live.fangX = p.x;
    live.fangZ = p.z;
    g.current.position.set(p.x, p.y, p.z);
    g.current.rotation.y = p.yaw;
    g.current.visible = !live.charView;
  });
  return (
    <>
      <group ref={g}>
        <WolfBody sitRef={sit} phaseRef={phase} lookRef={look} />
      </group>
      <FangMounds />
    </>
  );
}

function WolfBody({
  sitRef,
  phaseRef,
  lookRef,
}: {
  sitRef: { current: number };
  phaseRef: { current: number };
  lookRef: { current: number };
}) {
  const wrap = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!wrap.current) return;
    wrap.current.userData.p = phaseRef.current;
  });
  return (
    <group ref={wrap}>
      <WolfLive sitRef={sitRef} phaseRef={phaseRef} lookRef={lookRef} />
    </group>
  );
}

function WolfLive({
  sitRef,
  phaseRef,
  lookRef,
}: {
  sitRef: { current: number };
  phaseRef: { current: number };
  lookRef: { current: number };
}) {
  const root = useRef<THREE.Group>(null);
  useFrame(() => {
    /* mesh is rebuilt-free; pose baked via children using refs each frame through WolfMesh props would remount. Drive via a dummy. */
  });
  return <WolfDriven sitRef={sitRef} phaseRef={phaseRef} lookRef={lookRef} />;
}

function WolfDriven({
  sitRef,
  phaseRef,
  lookRef,
}: {
  sitRef: { current: number };
  phaseRef: { current: number };
  lookRef: { current: number };
}) {
  const holder = useRef<THREE.Group>(null);
  const bits = useRef({ p: 0, s: 0, l: 0 });
  useFrame(() => {
    bits.current.p = phaseRef.current;
    bits.current.s = sitRef.current;
    bits.current.l = lookRef.current;
  });
  return (
    <group ref={holder}>
      <WolfTick bits={bits} />
    </group>
  );
}

function WolfTick({ bits }: { bits: { current: { p: number; s: number; l: number } } }) {
  const root = useRef<THREE.Group>(null);
  useFrame(() => {
    const b = bits.current;
    const g = root.current;
    if (!g) return;
    g.rotation.x = b.s * 0.18;
    g.position.y = b.s * -0.12;
    const body = g.children[0] as THREE.Group | undefined;
    if (body) body.rotation.z = Math.sin(b.p) * 0.04 * (1 - b.s);
    const head = g.getObjectByName("fang-head");
    if (head) head.rotation.x = 0.12 + b.l;
    const tail = g.getObjectByName("fang-tail");
    if (tail) tail.rotation.y = Math.sin(b.p * 1.4) * 0.28 * (1 - b.s * 0.5);
    const el = g.getObjectByName("fang-ear-l");
    const er = g.getObjectByName("fang-ear-r");
    const twitch = Math.sin(b.p * 2.15) * 0.14 * (1 - b.s * 0.35);
    if (el) el.rotation.z = -0.28 + twitch;
    if (er) er.rotation.z = 0.28 + Math.sin(b.p * 2.15 + 0.7) * 0.14 * (1 - b.s * 0.35);
    const eyes = g.getObjectByName("fang-eyes");
    if (eyes) {
      const blink = (b.p * 0.31) % 4.2 > 4.02 ? 0.12 : 1;
      eyes.scale.set(1, blink, 1);
    }
    const fl = g.getObjectByName("leg-fl");
    const fr = g.getObjectByName("leg-fr");
    const bl = g.getObjectByName("leg-bl");
    const br = g.getObjectByName("leg-br");
    const lift = Math.sin(b.p) * 0.55 * (1 - b.s);
    const step = (leg: THREE.Object3D | undefined, hip: number) => {
      if (!leg) return;
      leg.rotation.x = hip;
      const shin = leg.getObjectByName("shin");
      if (shin) shin.rotation.x = Math.max(0, -hip) * 1.15;
    };
    step(fl, lift + b.s * 0.35);
    step(br, lift * 0.85 + b.s * 0.9);
    step(fr, -lift + b.s * 0.35);
    step(bl, -lift * 0.85 + b.s * 0.9);
  });
  return (
    <group ref={root}>
      <StaticWolf />
    </group>
  );
}

function StaticWolf() {
  return (
    <group>
      {/* long athletic body: chest broad, waist narrower, local −Z is snout */}
      <mesh position={[0, 0.5, 0.04]} rotation={[0.12, 0, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.58, 5, 10]} />
        {fluff(FUR)}
      </mesh>
      <mesh position={[0, 0.54, -0.22]} scale={[1.22, 1.02, 1.08]} castShadow>
        <sphereGeometry args={[0.22, 10, 8]} />
        {fluff(FUR)}
      </mesh>
      <mesh position={[0, 0.46, -0.24]} scale={[0.78, 0.62, 0.7]} castShadow>
        <sphereGeometry args={[0.18, 8, 7]} />
        {fluff(LIGHT)}
      </mesh>
      <mesh position={[0, 0.48, 0.32]} scale={[0.78, 0.72, 0.95]} castShadow>
        <sphereGeometry args={[0.16, 8, 7]} />
        {fluff(SHADE)}
      </mesh>
      <mesh position={[0, 0.62, -0.05]} scale={[1.35, 0.55, 0.9]} castShadow>
        <sphereGeometry args={[0.2, 8, 6]} />
        {fluff(SHADE)}
      </mesh>
      {[ -0.16, 0.0, 0.16, 0.32 ].map((z, i) => (
        <mesh key={`ruff${i}`} position={[0, 0.78 - i * 0.04, z]} rotation={[-0.7, 0, 0]} castShadow>
          <coneGeometry args={[0.09 - i * 0.012, 0.2, 5]} />
          {fluff(i % 2 ? FUR : SHADE)}
        </mesh>
      ))}
      <group name="fang-head" position={[0, 0.78, -0.38]} rotation={[0.1, 0, 0]}>
        <mesh position={[0, 0.02, 0.06]} scale={[1.05, 0.92, 1]} castShadow>
          <sphereGeometry args={[0.15, 10, 8]} />
          {fluff(FUR)}
        </mesh>
        <mesh position={[0.08, 0.0, -0.02]} scale={[0.7, 0.55, 0.7]} castShadow>
          <sphereGeometry args={[0.08, 7, 6]} />
          {fluff(FUR)}
        </mesh>
        <mesh position={[-0.08, 0.0, -0.02]} scale={[0.7, 0.55, 0.7]} castShadow>
          <sphereGeometry args={[0.08, 7, 6]} />
          {fluff(FUR)}
        </mesh>
        <mesh position={[0, -0.02, -0.28]} rotation={[0.28, 0, 0]} castShadow>
          <capsuleGeometry args={[0.048, 0.4, 4, 8]} />
          {fluff(LIGHT)}
        </mesh>
        <mesh position={[0, -0.03, -0.5]} scale={[0.7, 0.5, 1.15]} castShadow>
          <sphereGeometry args={[0.045, 7, 6]} />
          {fluff(LIGHT)}
        </mesh>
        <mesh position={[0, -0.015, -0.56]} castShadow>
          <sphereGeometry args={[0.026, 6, 5]} />
          {lamb(NOSE)}
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} name={s < 0 ? "fang-ear-l" : "fang-ear-r"} position={[s * 0.1, 0.16, 0.04]} rotation={[0.22, s * 0.08, s * 0.22]}>
            <mesh rotation={[0, 0, 0]} castShadow>
              <coneGeometry args={[0.055, 0.24, 5]} />
              {fluff(FUR)}
            </mesh>
            <mesh position={[0, 0.02, -0.01]} scale={[0.55, 0.85, 0.35]}>
              <coneGeometry args={[0.04, 0.12, 5]} />
              {fluff(SHADE)}
            </mesh>
          </group>
        ))}
        <group name="fang-eyes">
          {[-1, 1].map((s) => (
            <group key={`e${s}`} position={[s * 0.068, 0.045, -0.14]}>
              <mesh>
                <sphereGeometry args={[0.03, 7, 6]} />
                {lamb("#f4eee4")}
              </mesh>
              <mesh position={[0, 0, -0.012]}>
                <sphereGeometry args={[0.016, 6, 5]} />
                {lamb(EYE, { emissive: EYE, emit: 0.18 })}
              </mesh>
              <mesh position={[0, 0, -0.02]}>
                <sphereGeometry args={[0.007, 5, 4]} />
                {lamb(NOSE)}
              </mesh>
            </group>
          ))}
        </group>
      </group>
      <StaticLeg name="leg-fl" x={-0.13} z={-0.2} />
      <StaticLeg name="leg-fr" x={0.13} z={-0.2} />
      <StaticLeg name="leg-bl" x={-0.12} z={0.26} hind />
      <StaticLeg name="leg-br" x={0.12} z={0.26} hind />
      <group name="fang-tail" position={[0, 0.56, 0.42]} rotation={[0.72, 0, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0.02 + i * 0.02, -0.08 - i * 0.12]} scale={[1.35 - i * 0.14, 0.85, 1.15]} castShadow>
            <sphereGeometry args={[0.12 - i * 0.012, 7, 6]} />
            {fluff(i % 2 ? SHADE : FUR)}
          </mesh>
        ))}
      </group>
    </group>
  );
}

function StaticLeg({ name, x, z, hind }: { name: string; x: number; z: number; hind?: boolean }) {
  return (
    <group name={name} position={[x, 0.46, z]} rotation={[0, 0, x > 0 ? 0.06 : -0.06]}>
      <mesh position={[0, -0.12, 0]} castShadow>
        <capsuleGeometry args={[0.042, hind ? 0.16 : 0.14, 3, 6]} />
        {fluff(SHADE)}
      </mesh>
      <group name="shin" position={[0, -0.22, 0]}>
        <mesh position={[0, -0.1, 0.02]} castShadow>
          <capsuleGeometry args={[0.034, 0.14, 3, 6]} />
          {fluff(DARK)}
        </mesh>
        <mesh position={[0, -0.22, 0.06]} scale={[1.2, 0.48, 1.45]} castShadow>
          <sphereGeometry args={[0.052, 6, 5]} />
          {lamb(NOSE)}
        </mesh>
      </group>
    </group>
  );
}
