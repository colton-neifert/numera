import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { consumeTalk as consumeTalkRaw } from "../input";
import { lamb } from "./mats";
import { N64Sign } from "./actors";
import { N64Foe, type FangPose } from "./n64";
import { puffAt } from "./fx";
import {
  LOST,
  DEN,
  lost,
  lostAway,
  lostReady,
  beginBolt,
  markDen,
  talkCage,
  smashLatch,
  hydrateLost,
  noteClue,
  lostYip,
  lostSearching,
} from "../lost";

function talkOk() {
  if (live.nearHouse || live.nearChest || live.nearHorse) return false;
  if (live.nearNpc && live.nearNpc !== "nim") return false;
  return consumeTalkRaw();
}

const DIRT = "#3a2818";
const DIRT_L = "#5a4228";
const ROOT = "#4a3220";
const ROOT_D = "#2e2014";
const GOLD = "#c9a227";
const WOOD = "#8a5a28";
const WOOD_D = "#5a3a18";
const THORN = "#3a4a28";
const FUR = "#d4a04a";
const ROCK = "#6a6458";
const ROCK_D = "#4a463c";

export function LostPlay() {
  return (
    <group>
      <LostBegin />
      <LostTrail />
      <LostHole />
      <LostThicket />
      <LostCreekDress />
      <LostDen />
      <LostCage />
      <LostFoes />
      <LostSigns />
      <LostListen />
    </group>
  );
}

function LostBegin() {
  const once = useRef(false);
  useFrame(() => {
    if (!once.current) {
      once.current = true;
      hydrateLost();
    }
    if (live.house || live.below) return;
    if (lostReady()) beginBolt();
    if (lost.phase === "search" && Math.hypot(live.x - LOST.den.x, live.z - LOST.den.z) < 16) {
      if (markDen() && !lost.seen.den) {
        noteClue("den", "A den. Something counted the bars.");
      }
    }
    lostYip(live.playT);
  });
  return null;
}

function LostTrail() {
  const [on, setOn] = useState(false);
  useFrame(() => {
    const want = lostSearching() || lost.phase === "bolt";
    if (want !== on) setOn(want);
    if (!want || live.house) return;
    const hits: { id: string; x: number; z: number; r: number; line: string }[] = [
      { id: "tracks", x: LOST.tracks.x, z: LOST.tracks.z, r: 2.6, line: "Prints. Small. Running west." },
      { id: "crate", x: LOST.crate.x, z: LOST.crate.z, r: 2.2, line: "A crate on its side. Something knocked it going west." },
      { id: "fur", x: LOST.fur.x, z: LOST.fur.z, r: 2.1, line: "Gold fur on a thorn. She came this way." },
      { id: "ribbon", x: LOST.hole.x + 0.85, z: LOST.hole.z + 0.4, r: 1.8, line: "The lamp ribbon. She left it." },
      { id: "hole", x: LOST.hole.x, z: LOST.hole.z, r: 2.4, line: "Too small. Gold thread on the dirt." },
      { id: "detour", x: LOST.detour.x, z: LOST.detour.z, r: 2.8, line: "Scratches south. The west is a wall of root." },
      { id: "creek", x: LOST.creek.x, z: LOST.creek.z, r: 3.2, line: "A log. Water. She would have jumped." },
    ];
    for (const h of hits) {
      if (Math.hypot(live.x - h.x, live.z - h.z) < h.r) noteClue(h.id, h.line);
    }
  });
  if (!on) return null;
  const prints = PRINTS;
  return (
    <group>
      {prints.map((p, i) => {
        const y = heightAt(p.x, p.z);
        return (
          <mesh key={i} position={[p.x, y + 0.03, p.z]} rotation={[-Math.PI / 2, 0, p.yaw]} receiveShadow>
            <circleGeometry args={[0.11, 6]} />
            <meshLambertMaterial color={DIRT} />
          </mesh>
        );
      })}
      <CrateTip />
      <ThornFur />
      <Ribbon />
    </group>
  );
}

const PRINTS: { x: number; z: number; yaw: number }[] = (() => {
  const path = [
    LOST.scent,
    { x: -98, z: -28 },
    LOST.tracks,
    { x: -124, z: -42 },
    LOST.crate,
    LOST.fur,
    { x: -160, z: -62 },
    LOST.hole,
  ];
  const out: { x: number; z: number; yaw: number }[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!;
    const b = path[i + 1]!;
    const yaw = Math.atan2(b.x - a.x, b.z - a.z);
    const n = i === 0 || i === path.length - 2 ? 2 : 3;
    for (let k = 0; k < n; k++) {
      const t = (k + 0.35) / n;
      const x = a.x + (b.x - a.x) * t + ((k % 2) * 2 - 1) * 0.12;
      const z = a.z + (b.z - a.z) * t;
      out.push({ x, z, yaw });
    }
  }
  return out;
})();

function CrateTip() {
  const y = heightAt(LOST.crate.x, LOST.crate.z);
  return (
    <mesh position={[LOST.crate.x, y + 0.28, LOST.crate.z]} rotation={[0.18, 1.15, 0.72]} castShadow>
      <boxGeometry args={[0.62, 0.62, 0.62]} />
      {lamb(WOOD)}
    </mesh>
  );
}

function ThornFur() {
  const y = heightAt(LOST.fur.x, LOST.fur.z);
  return (
    <group position={[LOST.fur.x, y, LOST.fur.z]}>
      <mesh position={[0, 0.55, 0]} rotation={[0.3, 0.4, 0.2]} castShadow>
        <coneGeometry args={[0.12, 1.15, 5]} />
        {lamb(THORN)}
      </mesh>
      <mesh position={[0.08, 0.42, 0.06]}>
        <sphereGeometry args={[0.07, 5, 4]} />
        {lamb(FUR)}
      </mesh>
    </group>
  );
}

function Ribbon() {
  const y = heightAt(LOST.hole.x, LOST.hole.z);
  return (
    <group position={[LOST.hole.x + 0.85, y + 0.08, LOST.hole.z + 0.35]} rotation={[0.9, 0.4, 0.2]}>
      <mesh>
        <boxGeometry args={[0.28, 0.04, 0.08]} />
        {lamb(GOLD)}
      </mesh>
      <mesh position={[0.16, 0, 0]} rotation={[0, 0, 0.8]}>
        <boxGeometry args={[0.14, 0.03, 0.06]} />
        {lamb(GOLD)}
      </mesh>
    </group>
  );
}

function LostHole() {
  const y = heightAt(LOST.hole.x, LOST.hole.z);
  return (
    <group position={[LOST.hole.x, y, LOST.hole.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[0.52, 10]} />
        <meshLambertMaterial color="#0e0a08" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.34, 0.52, 10]} />
        {lamb(ROOT_D)}
      </mesh>
      <mesh position={[-0.42, 0.22, 0.1]} rotation={[0.4, 0.6, 0.3]} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 0.9, 5]} />
        {lamb(ROOT)}
      </mesh>
      <mesh position={[0.38, 0.18, -0.12]} rotation={[0.5, -0.4, -0.2]} castShadow>
        <cylinderGeometry args={[0.07, 0.12, 0.72, 5]} />
        {lamb(ROOT_D)}
      </mesh>
    </group>
  );
}

function LostThicket() {
  const posts = useMemo(() => {
    const out: { x: number; z: number; h: number; r: number; yaw: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      out.push({
        x: -174,
        z: -72 + t * 22,
        h: 1.6 + (i % 3) * 0.35,
        r: 0.28 + (i % 2) * 0.08,
        yaw: i * 0.7,
      });
    }
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      out.push({
        x: -174 + t * 18,
        z: -50,
        h: 1.45 + (i % 2) * 0.4,
        r: 0.26 + (i % 3) * 0.06,
        yaw: i * 0.9,
      });
    }
    return out;
  }, []);
  return (
    <group>
      {posts.map((p, i) => {
        const y = heightAt(p.x, p.z);
        return (
          <mesh key={i} position={[p.x, y + p.h * 0.5, p.z]} rotation={[0.08, p.yaw, 0.04]} castShadow>
            <cylinderGeometry args={[p.r * 0.7, p.r, p.h, 5]} />
            {lamb(i % 2 ? ROOT : ROOT_D)}
          </mesh>
        );
      })}
    </group>
  );
}

function LostCreekDress() {
  const y = heightAt(LOST.creek.x, LOST.creek.z);
  const rocks = [
    { x: -3.6, z: -0.8, s: 0.55 },
    { x: 3.4, z: -0.6, s: 0.62 },
    { x: -2.2, z: 0.9, s: 0.4 },
    { x: 2.4, z: 0.7, s: 0.44 },
  ];
  return (
    <group position={[LOST.creek.x, y, LOST.creek.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[7.2, 1.8]} />
        <meshLambertMaterial color="#3a5a58" transparent opacity={0.55} />
      </mesh>
      {rocks.map((r, i) => (
        <mesh key={i} position={[r.x, r.s * 0.35, r.z]} castShadow>
          <dodecahedronGeometry args={[r.s, 0]} />
          {lamb(i % 2 ? ROCK : ROCK_D)}
        </mesh>
      ))}
    </group>
  );
}

function LostDen() {
  const y = heightAt(LOST.den.x, LOST.den.z);
  const cx = LOST.den.x;
  const hw = DEN.hw;
  const depth = DEN.front - DEN.back;
  const midZ = (DEN.front + DEN.back) * 0.5;
  return (
    <group>
      <mesh position={[cx - hw, y + 1.55, midZ]} castShadow>
        <boxGeometry args={[0.7, 3.2, depth + 0.4]} />
        {lamb(ROCK)}
      </mesh>
      <mesh position={[cx + hw, y + 1.55, midZ]} castShadow>
        <boxGeometry args={[0.7, 3.2, depth + 0.4]} />
        {lamb(ROCK_D)}
      </mesh>
      <mesh position={[cx, y + 1.7, DEN.back]} castShadow>
        <boxGeometry args={[hw * 2 + 0.7, 3.5, 0.7]} />
        {lamb(ROCK)}
      </mesh>
      <mesh position={[cx, y + 3.15, midZ]} rotation={[0.02, 0, 0]} receiveShadow>
        <boxGeometry args={[hw * 2 + 0.4, 0.45, depth + 0.2]} />
        {lamb(DIRT)}
      </mesh>
      <mesh position={[cx, y + 0.04, midZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[hw * 2 - 0.3, depth - 0.2]} />
        {lamb(DIRT_L)}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[cx + s * (hw - 0.2), y + 1.8, DEN.front - 0.2]} rotation={[0.25, 0, -s * 0.35]} castShadow>
          <cylinderGeometry args={[0.22, 0.38, 2.4, 6]} />
          {lamb(ROOT)}
        </mesh>
      ))}
    </group>
  );
}

function LostCage() {
  const [on, setOn] = useState(false);
  const latch = useRef<THREE.Group>(null);
  useFrame(() => {
    const want = lost.phase === "search" || lost.phase === "den" || lost.phase === "open" || lost.phase === "done";
    if (want !== on) setOn(want);
    if (!want || live.house) return;
    const d = Math.hypot(live.x - LOST.cage.x, live.z - LOST.cage.z);
    if (d < 2.4 && (lost.phase === "den" || lost.phase === "open")) {
      const press = talkOk();
      if (press) talkCage();
      if (live.slash && Math.hypot(live.slash.x - LOST.cage.x, live.slash.z - DEN.bars) < 1.45) {
        const ok = smashLatch();
        live.slash = null;
        if (ok) {
          puffAt(LOST.cage.x, DEN.bars);
          sfx.hit();
        }
      }
    }
    if (latch.current) latch.current.visible = !lost.latch;
  }, -2);
  if (!on) return null;
  const y = heightAt(LOST.cage.x, LOST.cage.z);
  const bars = [-1.6, -0.96, -0.32, 0.32, 0.96, 1.6];
  return (
    <group position={[LOST.cage.x, y, DEN.bars]}>
      {bars.map((x, i) => (
        <mesh key={i} position={[x, 0.95, 0]} castShadow>
          <boxGeometry args={[0.08, 1.9, 0.08]} />
          {lamb(WOOD_D)}
        </mesh>
      ))}
      <mesh position={[0, 1.92, 0]} castShadow>
        <boxGeometry args={[3.5, 0.12, 0.14]} />
        {lamb(WOOD)}
      </mesh>
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[3.5, 0.12, 0.14]} />
        {lamb(WOOD)}
      </mesh>
      <group ref={latch} position={[0, 1.05, 0.12]}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.18, 0.16]} />
          {lamb(WOOD)}
        </mesh>
        <mesh position={[0.22, 0, 0.08]}>
          <cylinderGeometry args={[0.05, 0.05, 0.12, 6]} />
          {lamb(GOLD)}
        </mesh>
      </group>
    </group>
  );
}

function LostFoes() {
  const [on, setOn] = useState(false);
  useFrame(() => {
    const want = lostAway();
    if (want !== on) setOn(want);
  });
  if (!on) return null;
  return (
    <group>
      {LOST.foes.map((f) => (
        <LostBody key={f.id} id={f.id} ox={f.x} oz={f.z} seed={f.seed} />
      ))}
    </group>
  );
}

function LostBody({ id, ox, oz, seed }: { id: string; ox: number; oz: number; seed: number }) {
  const g = useRef<THREE.Group>(null);
  const pos = useRef({ x: ox, z: oz });
  const yaw = useRef(0);
  const pose = useRef<FangPose>("walk");
  const hp = useRef(3);
  const swipeAt = useRef(-9);
  const [show, setShow] = useState(true);
  useFrame((_, dt) => {
    if (!g.current) return;
    if (hp.current <= 0) {
      g.current.visible = false;
      delete live.foeTrack[id];
      return;
    }
    const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
    g.current.visible = d < 70 && !live.house;
    if (!g.current.visible) {
      delete live.foeTrack[id];
      return;
    }
    if (d < 16) live.aggroIds.add(id);
    else live.aggroIds.delete(id);
    const hitAgo = live.playT - (live.foeHitT[id] ?? -9);
    if (d < 14 && d > 1.2) {
      pos.current.x += ((live.x - pos.current.x) / d) * 2.4 * dt;
      pos.current.z += ((live.z - pos.current.z) / d) * 2.4 * dt;
      yaw.current = Math.atan2(-(live.x - pos.current.x), -(live.z - pos.current.z));
      pose.current = d < 4 ? "chase" : "walk";
    }
    if (live.slash && Math.hypot(live.slash.x - pos.current.x, live.slash.z - pos.current.z) < (live.slash.r ?? 1.2)) {
      if (hitAgo > 0.35) {
        hp.current -= live.spinning || live.jumpAtk ? 2 : 1;
        live.foeHitT[id] = live.playT;
        puffAt(pos.current.x, pos.current.z);
        sfx.hit();
        if (hp.current <= 0) {
          useGame.getState().addCoins(4);
          live.aggroIds.delete(id);
          delete live.foeTrack[id];
          if (live.lock?.id === id) live.lock = null;
          sfx.ok();
          setShow(false);
          return;
        }
      }
    }
    if (d < 1.28 && !live.god && live.heroFlash < 0.22 && hitAgo > 0.2 && live.playT - swipeAt.current > 0.95) {
      swipeAt.current = live.playT;
      pose.current = "swipe";
      if (live.shieldUp && useGame.getState().hasShield) sfx.block();
      else {
        useGame.getState().hurtField(2);
        live.knock = {
          vx: ((live.x - pos.current.x) / (d || 1)) * 8.2,
          vz: ((live.z - pos.current.z) / (d || 1)) * 8.2,
          t: 0.2,
        };
      }
    }
    if (live.playT - swipeAt.current < 0.35) pose.current = "swipe";
    live.foeTrack[id] = { x: pos.current.x, z: pos.current.z };
    const gy = heightAt(pos.current.x, pos.current.z);
    g.current.position.set(pos.current.x, gy, pos.current.z);
    g.current.rotation.y = yaw.current;
  });
  if (!show) return null;
  return (
    <group ref={g} visible={false}>
      <N64Foe kind="plusling" seed={seed} pose="walk" poseRef={pose} world="grove" />
    </group>
  );
}

function LostSigns() {
  return (
    <group>
      <N64Sign x={LOST.hole.x + 1.6} z={LOST.hole.z + 1.2} />
      <N64Sign x={LOST.den.x + 2.2} z={LOST.den.z + 3.4} />
    </group>
  );
}

function LostListen() {
  useFrame(() => {
    if (live.house || live.below) return;
    const holeD = Math.hypot(live.x - LOST.hole.x, live.z - LOST.hole.z);
    if (holeD < 2.4) {
      live.listen =
        live.listen ||
        (lostAway() ? "Too small. Gold thread on the dirt." : "A fox-sized hole. The dirt is chewed.");
    }
    const denD = Math.hypot(live.x - LOST.den.x, live.z - LOST.den.z);
    if (denD < 3.2 && denD > 0.4) {
      live.listen =
        live.listen ||
        (lost.phase === "den"
          ? "A den. Something counted the bars."
          : lost.phase === "done"
            ? "The bars are still here. She is not."
            : "A hollow in the west bank. Something lives in it.");
    }
  });
  return null;
}
