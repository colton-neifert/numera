import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, ORCHARD_TREE } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { playerMaxHp } from "../content";
import { consumeTalk as consumeTalkRaw } from "../input";
import { takeCipher } from "../cipher";
import { lamb } from "./mats";
import { WHIM, lookingAt } from "./whimsy";
import {
  CELLAR,
  COTTAGES,
  HEARTH,
  MOSS,
  SOCKETS,
  STUMPS,
  THORN,
  WICK_HOME,
  hearthOpen,
  socketsFilled,
} from "./storybook";
import { VX, VZ } from "./village";

function pay(n: number, key: string) {
  if (live.smashed[key]) return false;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
  return true;
}

function talkOk() {
  if (live.nearNpc || live.nearHouse || live.nearChest || live.nearHorse) return false;
  return consumeTalkRaw();
}

export function StorybookPlay() {
  return (
    <group>
      <LastHearth />
      <Stumpkins />
      <Wickwisps />
      <Thornling />
      <HopKids />
      <FallApples />
      <CrumbStall />
    </group>
  );
}

function LastHearth() {
  const g = useRef<THREE.Group>(null);
  const door = useRef<THREE.Group>(null);
  const hold = useRef<number | null>(null);
  const set = useRef([false, false, false]);
  const mossG = useRef<(THREE.Group | null)[]>([null, null, null]);
  const sockG = useRef<(THREE.Mesh | null)[]>([null, null, null]);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - HEARTH.x, live.z - HEARTH.z);
    if (g.current) g.current.visible = d < 95 && !live.house;
    if (d > 95) return;

    if ((useGame.getState().quests?.hearthOpen ?? 0) >= 1) live.smashed["hearth-open"] = true;
    const open = hearthOpen();
    if (door.current) {
      door.current.rotation.y += ((open ? -1.35 : 0) - door.current.rotation.y) * Math.min(1, dt * 3.2);
    }

    if (d < 22) live.fangMark = { x: HEARTH.x, z: HEARTH.z, kind: "hearth" };

    for (let i = 0; i < MOSS.length; i++) {
      const m = MOSS[i]!;
      const placed = set.current[i] || live.smashed[`hearth-moss-${i}`];
      if (placed) set.current[i] = true;
      const carrying = hold.current === i;
      let mx = m.x;
      let mz = m.z;
      if (carrying) {
        mx = live.x - Math.sin(live.yaw) * 0.7;
        mz = live.z - Math.cos(live.yaw) * 0.7;
        const sock = SOCKETS[i]!;
        if (Math.hypot(live.x - sock.x, live.z - sock.z) < 1.15 && (talkOk() || !live.grounded)) {
          hold.current = null;
          set.current[i] = true;
          live.smashed[`hearth-moss-${i}`] = true;
          sfx.ok();
          live.listen = "The bowl took the moss like it had been waiting.";
        }
      } else if (!placed) {
        const md = Math.hypot(live.x - m.x, live.z - m.z);
        if (md < 1.15 && talkOk() && hold.current == null) {
          hold.current = i;
          live.listen = "Heavier than moss. It wants a bowl.";
        } else if (md < 2.2 && !live.listen) {
          live.listen = "A lump of moss that is heavier than moss.";
        }
      }
      const node = mossG.current[i];
      if (node) {
        const wx = placed ? SOCKETS[i]!.x : mx;
        const wz = placed ? SOCKETS[i]!.z : mz;
        const py = heightAt(HEARTH.x, HEARTH.z);
        const wy = carrying ? live.y + 0.55 : heightAt(wx, wz) + (placed ? 0.22 : 0.16);
        node.position.set(wx - HEARTH.x, wy - py, wz - HEARTH.z);
        node.visible = true;
      }
    }

    if (!open && socketsFilled(set.current)) {
      live.smashed["hearth-open"] = true;
      useGame.getState().setQuest("hearthOpen", 1);
      takeCipher("last-hearth", true);
      sfx.ok();
      live.banner = "The cellar remembered how to open.";
      live.listen = "The door gave. Steam that is not steam. Someone left in a hurry a long time ago.";
    }

    const table = Math.hypot(live.x - HEARTH.x, live.z - (HEARTH.z + 0.4));
    if (table < 2.1 && talkOk()) {
      takeCipher("hearth-table", true);
      pay(6, "hearth-look");
      live.listen = "Four bowls. Three have the shape of moss. The fourth is only a scratch.";
    } else if (table < 2.4 && !live.listen) {
      live.listen = "A table still set. The soup is not on.";
    }

    if (open && Math.hypot(live.x - CELLAR.x, live.z - CELLAR.z) < 1.4) {
      if (!live.smashed["hearth-chest"]) {
        live.smashed["hearth-chest"] = true;
        useGame.getState().addCoins(25);
        if (useGame.getState().grantHeartContainer("last-hearth")) revealItem("container");
        else revealItem("coin");
        sfx.ok();
        live.listen = "A heart the woods kept. And a mark that does not match three.";
        takeCipher("last-hearth", false);
      }
    }

    if (d < 8 && !live.listen && !open) {
      live.listen = "Chimneys with no smoke. Bowls with no soup. Fang will not sit.";
    }
  });

  const y = heightAt(HEARTH.x, HEARTH.z);
  return (
    <group ref={g} position={[HEARTH.x, y, HEARTH.z]}>
      {COTTAGES.map((c, i) => (
        <group key={i} position={[c.x - HEARTH.x, heightAt(c.x, c.z) - y, c.z - HEARTH.z]}>
          {c.ruin ? (
            <>
              <mesh position={[0, 0.35, 0]} rotation={[0.4, 0.3, 0.15]} castShadow>
                <boxGeometry args={[3.4, 0.7, 2.8]} />
                {lamb("#6a5848")}
              </mesh>
              <mesh position={[0.8, 0.9, -0.4]} rotation={[0.2, 0.6, 0.4]} castShadow>
                <boxGeometry args={[1.6, 1.1, 0.35]} />
                {lamb("#5a4a3a")}
              </mesh>
            </>
          ) : (
            <>
              <mesh position={[0, 1.15, 0]} castShadow>
                <boxGeometry args={[3.9, 2.3, 3.3]} />
                {lamb(i ? "#6e5340" : "#7a5a40")}
              </mesh>
              <mesh position={[0, 2.55, 0]} rotation={[0, 0.2, 0]} castShadow>
                <coneGeometry args={[2.85, 1.55, 4]} />
                {lamb("#4a3224")}
              </mesh>
              <mesh position={[0.7, 1.45, 1.68]}>
                <boxGeometry args={[0.55, 0.5, 0.08]} />
                {lamb("#c9a227")}
              </mesh>
              <mesh position={[-0.15, 0.95, 1.68]} castShadow>
                <boxGeometry args={[0.72, 1.55, 0.1]} />
                {lamb("#3a2818")}
              </mesh>
              <mesh position={[1.2, 2.85, -0.35]} castShadow>
                <cylinderGeometry args={[0.18, 0.22, 0.9, 6]} />
                {lamb("#4a3a30")}
              </mesh>
            </>
          )}
        </group>
      ))}

      <mesh position={[0.1, 0.42, 0.35]} castShadow>
        <boxGeometry args={[1.85, 0.12, 1.05]} />
        {lamb("#5a3a22")}
      </mesh>
      <mesh position={[0.1, 0.22, 0.35]}>
        <boxGeometry args={[1.7, 0.32, 0.9]} />
        {lamb("#4a3220")}
      </mesh>
      {[-0.45, 0.05, 0.55, 0.95].map((s, i) => (
        <mesh key={i} position={[s - 0.2, 0.52, 0.35]}>
          <cylinderGeometry args={[0.12, 0.14, 0.08, 8]} />
          {lamb(i === 3 ? "#4a4840" : "#6a8a48")}
        </mesh>
      ))}

      {[-0.6, 0, 0.55, 1.1, 1.6].map((s, i) => (
        <mesh key={i} position={[-0.3 + s * 0.15, 0.03, -1.4 - s * 0.55]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow>
          <circleGeometry args={[0.16, 7]} />
          {lamb("#3a3228")}
        </mesh>
      ))}

      <mesh position={[0, 0.06, 4.05]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[1.15, 1.55, 16]} />
        {lamb("#6a5848")}
      </mesh>
      {SOCKETS.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => {
            sockG.current[i] = el;
          }}
          position={[s.x - HEARTH.x, 0.08, s.z - HEARTH.z]}
        >
          <cylinderGeometry args={[0.28, 0.32, 0.1, 8]} />
          {lamb("#4a4034")}
        </mesh>
      ))}

      {MOSS.map((m, i) => (
        <group
          key={i}
          ref={(el) => {
            mossG.current[i] = el;
          }}
        >
          <mesh castShadow>
            <sphereGeometry args={[0.22, 7, 5]} />
            {lamb("#4a7a38", { kind: "wool" })}
          </mesh>
          <mesh position={[0.08, 0.06, 0.04]} scale={[0.7, 0.45, 0.7]}>
            <sphereGeometry args={[0.16, 6, 4]} />
            {lamb("#2e5a28", { kind: "wool" })}
          </mesh>
        </group>
      ))}

      <group position={[CELLAR.x - HEARTH.x, 0.02, CELLAR.z - HEARTH.z]}>
        <mesh position={[0, 1.05, -0.05]} castShadow>
          <boxGeometry args={[1.55, 2.1, 0.18]} />
          {lamb("#4a4640")}
        </mesh>
        <mesh position={[0, 1.85, 0.02]}>
          <boxGeometry args={[0.7, 0.45, 0.08]} />
          {lamb("#2a2824")}
        </mesh>
        {[ -0.16, 0, 0.16].map((s) => (
          <mesh key={s} position={[s, 1.85, 0.08]}>
            <boxGeometry args={[0.04, 0.42, 0.04]} />
            {lamb("#c9a227")}
          </mesh>
        ))}
        <group ref={door} position={[0.72, 1.05, 0.02]}>
          <mesh position={[-0.72, 0, 0]} castShadow>
            <boxGeometry args={[1.5, 2.05, 0.1]} />
            {lamb("#5a4030")}
          </mesh>
        </group>
        <mesh position={[0, 0.22, 0.85]} visible={false}>
          <boxGeometry args={[0.8, 0.4, 0.6]} />
          {lamb("#c9a227")}
        </mesh>
      </group>

      <group position={[3.4, 0, 6.2]}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[0.08, 1.4, 0.08]} />
          {lamb("#5a3a20")}
        </mesh>
        <mesh position={[0, 1.35, 0.02]} castShadow>
          <boxGeometry args={[0.85, 0.45, 0.06]} />
          {lamb("#c4a06a")}
        </mesh>
      </group>
      <HearthSign />
    </group>
  );
}

function HearthSign() {
  useFrame(() => {
    if (live.house) return;
    const x = HEARTH.x + 3.4;
    const z = HEARTH.z + 6.2;
    if (Math.hypot(live.x - x, live.z - z) < 2.2 && !live.listen)
      live.listen = "Last Hearth — knock twice if the soup is on.";
  });
  return null;
}

function Stumpkins() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const pos = useRef(STUMPS.map((s) => ({ x: s.x, z: s.z, hop: false, freeze: false })));
  const eye = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, dt) => {
    if (live.house) return;
    const near = pos.current.some((p) => Math.hypot(live.x - p.x, live.z - p.z) < 55);
    if (!near) return;
    for (let i = 0; i < pos.current.length; i++) {
      const p = pos.current[i]!;
      const home = STUMPS[i]!;
      const d = Math.hypot(live.x - p.x, live.z - p.z);
      const seen = lookingAt(live.x, live.z, live.yaw, p.x, p.z, 16);
      p.freeze = seen && d < 14;
      if (!p.freeze) {
        p.hop = true;
        const ang = live.playT * 0.55 + i * 1.7;
        const tx = home.x + Math.cos(ang) * 2.4;
        const tz = home.z + Math.sin(ang * 0.8) * 2.1;
        p.x += (tx - p.x) * Math.min(1, dt * 1.8);
        p.z += (tz - p.z) * Math.min(1, dt * 1.8);
      } else {
        p.hop = false;
      }
      if (d < 11) live.fangMark = { x: p.x, z: p.z, kind: "stump" };
      if (d < 2.2 && talkOk()) {
        pay(6, `stump-${i}`);
        live.listen = "The stump sat down. Then it was a stump. It will not discuss it.";
      } else if (d < 4.5 && p.hop && !live.listen) {
        live.listen = "A stump took a step. Then it was a stump again.";
      }
      const node = refs.current[i];
      if (node) {
        const bob = p.hop ? Math.abs(Math.sin(live.playT * 7 + i)) * 0.18 : 0;
        node.position.set(p.x, heightAt(p.x, p.z) + bob, p.z);
        node.rotation.y = p.hop ? Math.atan2(-(live.x - p.x), -(live.z - p.z)) : node.rotation.y;
      }
      const eg = eye.current[i];
      if (eg) eg.visible = p.hop;
    }
  });
  return (
    <group>
      {STUMPS.map((s, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[s.x, 0, s.z]}
        >
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.38, 0.55, 8]} />
            {lamb("#6a4a28")}
          </mesh>
          <mesh position={[0, 0.55, 0]} scale={[1, 0.45, 1]} castShadow>
            <sphereGeometry args={[0.34, 7, 5]} />
            {lamb("#3d6a32", { kind: "wool" })}
          </mesh>
          <mesh position={[0.14, 0.08, 0.1]} scale={[0.55, 0.35, 0.7]}>
            <sphereGeometry args={[0.16, 6, 4]} />
            {lamb("#4a3220")}
          </mesh>
          <mesh position={[-0.14, 0.08, 0.1]} scale={[0.55, 0.35, 0.7]}>
            <sphereGeometry args={[0.16, 6, 4]} />
            {lamb("#4a3220")}
          </mesh>
          <group
            ref={(el) => {
              eye.current[i] = el;
            }}
            visible={false}
          >
            <mesh position={[0.12, 0.42, -0.28]}>
              <sphereGeometry args={[0.055, 6, 4]} />
              {lamb("#1a1410")}
            </mesh>
            <mesh position={[-0.12, 0.42, -0.28]}>
              <sphereGeometry args={[0.055, 6, 4]} />
              {lamb("#1a1410")}
            </mesh>
            <mesh position={[0.12, 0.44, -0.32]}>
              <sphereGeometry args={[0.02, 4, 3]} />
              {lamb("#f4efe4")}
            </mesh>
            <mesh position={[-0.12, 0.44, -0.32]}>
              <sphereGeometry args={[0.02, 4, 3]} />
              {lamb("#f4efe4")}
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

function Wickwisps() {
  const g = useRef<THREE.Group>(null);
  const moths = useRef(
    Array.from({ length: 8 }, (_, i) => ({
      a: i * 0.8,
      r: 1.4 + (i % 3) * 0.45,
      y: 0.8 + (i % 4) * 0.22,
    })),
  );
  const nodes = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, dt) => {
    if (live.house) return;
    const night = live.dusk > 0.45 || live.night;
    const home = hearthOpen() ? HEARTH : WICK_HOME;
    const d = Math.hypot(live.x - home.x, live.z - home.z);
    const scatter = Math.abs(live.speed) > 3.2 && d < 10;
    if (g.current) g.current.visible = night && !live.house && d < 80;
    if (!night || d > 80) return;
    if (d < 14) live.fangMark = { x: home.x, z: home.z, kind: "wick" };
    if (d < 3.4 && talkOk()) {
      pay(8, "wickwisp");
      live.listen = "The Wickwisp landed on your sleeve, decided you were not a lamp, and left.";
    } else if (d < 6 && !live.listen) {
      live.listen = night
        ? "Little lamps with wings. They prefer the path that still has a table."
        : "";
    }
    for (let i = 0; i < moths.current.length; i++) {
      const m = moths.current[i]!;
      m.a += dt * (scatter ? 5.5 : 1.35);
      const node = nodes.current[i];
      if (!node) continue;
      const rr = scatter ? m.r * 2.4 : m.r;
      const ox = home.x + Math.cos(m.a) * rr;
      const oz = home.z + Math.sin(m.a * 0.9) * rr;
      const trail = !hearthOpen() && night && d < 40;
      const hx = trail ? THREE.MathUtils.lerp(WICK_HOME.x, HEARTH.x, i / 7) : ox;
      const hz = trail ? THREE.MathUtils.lerp(WICK_HOME.z, HEARTH.z, i / 7) : oz;
      const px = scatter ? ox : hx + Math.cos(m.a) * 0.6;
      const pz = scatter ? oz : hz + Math.sin(m.a) * 0.6;
      node.position.set(px, heightAt(px, pz) + m.y + Math.sin(live.playT * 3 + i) * 0.12, pz);
    }
  });
  return (
    <group ref={g} visible={false}>
      {moths.current.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            nodes.current[i] = el;
          }}
        >
          <mesh>
            <sphereGeometry args={[0.06, 6, 4]} />
            {lamb("#efe6d4", { emissive: "#ffe9a0", emit: 0.85 })}
          </mesh>
          <mesh position={[0.08, 0.01, 0]} rotation={[0.4, 0.6, 0.2]}>
            <planeGeometry args={[0.16, 0.1]} />
            <meshLambertMaterial color="#f4e8b0" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-0.08, 0.01, 0]} rotation={[0.4, -0.6, -0.2]}>
            <planeGeometry args={[0.16, 0.1]} />
            <meshLambertMaterial color="#f4e8b0" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
          {i < 2 ? <pointLight intensity={0.7} distance={4.2} color="#ffe9a0" /> : null}
        </group>
      ))}
    </group>
  );
}

function Thornling() {
  const g = useRef<THREE.Group>(null);
  const p = useRef({ x: THORN.x, z: THORN.z, yaw: 0, t: 0 });
  useFrame((_, dt) => {
    if (live.house) return;
    const s = p.current;
    s.t += dt;
    const path: [number, number][] = [
      [THORN.x, THORN.z],
      [THORN.x + 18, THORN.z + 8],
      [THORN.x + 8, THORN.z + 22],
      [THORN.x - 10, THORN.z + 6],
    ];
    const u = (s.t * 0.07) % 1;
    const i = Math.min(path.length - 2, Math.floor(u * (path.length - 1)));
    const local = u * (path.length - 1) - i;
    const a = path[i]!;
    const b = path[i + 1]!;
    s.x = a[0] + (b[0] - a[0]) * local;
    s.z = a[1] + (b[1] - a[1]) * local;
    s.yaw = Math.atan2(-(b[0] - a[0]), -(b[1] - a[1]));
    const d = Math.hypot(live.x - s.x, live.z - s.z);
    if (g.current) {
      g.current.visible = d < 70 && !live.house;
      g.current.position.set(s.x, heightAt(s.x, s.z), s.z);
      g.current.rotation.y = s.yaw;
    }
    if (d < 12) live.fangMark = live.fangMark?.kind === "hearth" ? live.fangMark : { x: s.x, z: s.z, kind: "thorn" };
    if (d < 1.15 && live.heroFlash < 0.1 && !live.god) {
      live.heroFlash = 0.35;
      const dx = live.x - s.x;
      const dz = live.z - s.z;
      const n = Math.max(0.001, Math.hypot(dx, dz));
      live.knock = { vx: (dx / n) * 5.2, vz: (dz / n) * 5.2, t: 0.16 };
      live.listen = "The Thornling pinched. It did not mean to. It also did not apologize.";
      sfx.thud();
    } else if (d < 4.2 && !live.listen) {
      live.listen = "A bush with opinions. It is going somewhere. It will not say where.";
    }
  });
  return (
    <group ref={g} visible={false}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <icosahedronGeometry args={[0.55, 0]} />
        {lamb("#2e5a28")}
      </mesh>
      <mesh position={[0.18, 0.72, 0.2]} castShadow>
        <icosahedronGeometry args={[0.28, 0]} />
        {lamb("#3d6a32")}
      </mesh>
      <mesh position={[-0.2, 0.68, -0.1]} castShadow>
        <icosahedronGeometry args={[0.24, 0]} />
        {lamb("#245024")}
      </mesh>
      <mesh position={[0.16, 0.7, -0.38]}>
        <sphereGeometry args={[0.07, 6, 4]} />
        {lamb("#8a2830")}
      </mesh>
      <mesh position={[-0.16, 0.7, -0.38]}>
        <sphereGeometry args={[0.07, 6, 4]} />
        {lamb("#8a2830")}
      </mesh>
      {[-0.22, 0.22].map((s) => (
        <mesh key={s} position={[s, 0.14, 0.12]} scale={[0.45, 0.35, 0.7]}>
          <sphereGeometry args={[0.16, 5, 4]} />
          {lamb("#3a5a28")}
        </mesh>
      ))}
    </group>
  );
}

function KidHop({ shirt, hair }: { shirt: string; hair: string }) {
  return (
    <group>
      <mesh position={[0, 0.32, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.26, 3, 6]} />
        {lamb(shirt)}
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.12, 7, 6]} />
        {lamb("#c9a06a")}
      </mesh>
      <mesh position={[0, 0.7, 0.02]} castShadow>
        <sphereGeometry args={[0.13, 7, 5]} />
        {lamb(hair)}
      </mesh>
      <mesh position={[0.05, 0.64, -0.1]}>
        <sphereGeometry args={[0.025, 5, 4]} />
        {lamb("#1a1410")}
      </mesh>
      <mesh position={[-0.05, 0.64, -0.1]}>
        <sphereGeometry args={[0.025, 5, 4]} />
        {lamb("#1a1410")}
      </mesh>
    </group>
  );
}

function HopKids() {
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  const { x, z } = WHIM.hopscotch;
  useFrame(() => {
    if (live.house) return;
    const scare = Math.hypot(live.x - x, live.z - z) < 1.6 && Math.abs(live.speed) > 4;
    const t = live.playT;
    const step = Math.floor(t * 1.35) % 8;
    const ax = x + (step % 2) * 0.55;
    const az = z + Math.floor(step / 2) * 0.7;
    const hop = Math.abs(Math.sin(t * 8.4)) * 0.22;
    if (a.current) {
      a.current.visible = !live.house;
      a.current.position.set(scare ? x - 2.4 : ax, heightAt(ax, az) + (scare ? 0 : hop), scare ? z - 1.2 : az);
    }
    const step2 = (step + 3) % 8;
    const bx = x + (step2 % 2) * 0.55;
    const bz = z + Math.floor(step2 / 2) * 0.7;
    if (b.current) {
      b.current.visible = !live.house;
      b.current.position.set(scare ? x + 2.6 : bx, heightAt(bx, bz) + (scare ? 0 : hop * 0.85), scare ? z + 0.8 : bz);
    }
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 3.4 && scare) live.listen = live.listen || "They hopped off. Watching is a kind of winning, Brin said.";
    else if (d < 2.8 && !live.listen) live.listen = "Tess hops. Brin counts. The chalk is the only honest thing.";
  });
  return (
    <group>
      <group ref={a} position={[x, 0, z]}>
        <KidHop shirt="#efe6d4" hair="#8a4a28" />
      </group>
      <group ref={b} position={[x + 0.55, 0, z + 0.7]}>
        <KidHop shirt="#2a2824" hair="#2a2018" />
      </group>
    </group>
  );
}

function FallApples() {
  const apples = useRef(
    Array.from({ length: 6 }, (_, i) => ({
      x: ORCHARD_TREE.x + Math.cos(i * 1.1) * 1.15,
      z: ORCHARD_TREE.z + Math.sin(i * 1.1) * 1.15,
      y: 4.4 + (i % 3) * 0.35,
      fall: false,
      gone: false,
      vy: 0,
    })),
  );
  const nodes = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((_, dt) => {
    if (live.house) return;
    const ox = ORCHARD_TREE.x;
    const oz = ORCHARD_TREE.z;
    const dTree = Math.hypot(live.x - ox, live.z - oz);
    const slash = Boolean(live.slash) && dTree < 3.2;
    for (let i = 0; i < apples.current.length; i++) {
      const a = apples.current[i]!;
      if (a.gone) {
        if (nodes.current[i]) nodes.current[i]!.visible = false;
        continue;
      }
      if (!a.fall && slash) {
        a.fall = true;
        a.vy = 0.2;
        live.fangMark = { x: a.x, z: a.z, kind: "apple" };
        if (!live.listen) live.listen = "An apple decided the ground was a better tree.";
      }
      if (a.fall) {
        a.vy -= 14 * dt;
        a.y += a.vy * dt;
        const gy = heightAt(a.x, a.z) + 0.12;
        if (a.y < gy) {
          a.y = gy;
          a.vy = 0;
        }
        if (a.y <= gy + 0.02 && Math.hypot(live.x - a.x, live.z - a.z) < 0.85) {
          a.gone = true;
          pay(2, `apple-${i}`);
          const g = useGame.getState();
          const max = playerMaxHp(g.xp, g.outfit, g.heartsExtra ?? 0);
          useGame.setState({ hp: Math.min(g.hp + 1, max) });
          live.listen = "Crunch. Gran will say that was hers. It was on the tree.";
        }
      }
      const n = nodes.current[i];
      if (n) {
        n.visible = !a.gone;
        n.position.set(a.x, a.y, a.z);
      }
    }
  });
  return (
    <group>
      {apples.current.map((a, i) => (
        <mesh
          key={i}
          ref={(el) => {
            nodes.current[i] = el;
          }}
          position={[a.x, a.y, a.z]}
          castShadow
        >
          <sphereGeometry args={[0.11, 7, 5]} />
          {lamb(i % 2 ? "#c42838" : "#c45c38")}
        </mesh>
      ))}
    </group>
  );
}

function CrumbStall() {
  const x = VX - 7.6;
  const z = VZ + 2.2;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 2.4 && !live.nearNpc && !live.listen)
      live.listen = "Steam that smells like a contract with the morning.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[1.7, 0.08, 1.1]} />
        {lamb("#6a4a28")}
      </mesh>
      <mesh position={[-0.72, 0.42, -0.45]} castShadow>
        <boxGeometry args={[0.08, 0.85, 0.08]} />
        {lamb("#5a3a20")}
      </mesh>
      <mesh position={[0.72, 0.42, -0.45]} castShadow>
        <boxGeometry args={[0.08, 0.85, 0.08]} />
        {lamb("#5a3a20")}
      </mesh>
      <mesh position={[-0.72, 0.42, 0.45]} castShadow>
        <boxGeometry args={[0.08, 0.85, 0.08]} />
        {lamb("#5a3a20")}
      </mesh>
      <mesh position={[0.72, 0.42, 0.45]} castShadow>
        <boxGeometry args={[0.08, 0.85, 0.08]} />
        {lamb("#5a3a20")}
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <boxGeometry args={[1.85, 0.06, 1.25]} />
        {lamb("#c45c38")}
      </mesh>
      {[-0.4, 0, 0.4].map((s) => (
        <mesh key={s} position={[s, 0.98, 0.1]} castShadow>
          <sphereGeometry args={[0.14, 7, 5]} />
          {lamb("#d4a060")}
        </mesh>
      ))}
      <mesh position={[0.35, 0.96, -0.22]}>
        <cylinderGeometry args={[0.08, 0.1, 0.16, 8]} />
        {lamb("#efe6d4")}
      </mesh>
    </group>
  );
}
