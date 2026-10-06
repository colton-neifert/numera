import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { consumeTalk as consumeTalkRaw } from "../input";
import { takeCipher } from "../cipher";
import { lamb } from "./mats";
import { N64Sign } from "./actors";
import { RING_MARKS, WHIM, lookingAt } from "./whimsy";

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

export function WhimsyPlay() {
  return (
    <group>
      <Peekit />
      <Glimmerjack />
      <Puddlehop />
      <ClockHen />
      <DuskHare />
      <RingMarks />
      <HollowPear />
      <CampJournal />
      <Hopscotch />
      <HearthMotes />
      <RoofCat />
      <FunnySigns />
      <DrawerBits />
      <CozyWindows />
      <FangMarkClear />
    </group>
  );
}

function FangMarkClear() {
  useFrame(() => {
    if (!live.fangMark) return;
    const d = Math.hypot(live.x - live.fangMark.x, live.z - live.fangMark.z);
    if (d > 22) live.fangMark = null;
  }, 2);
  return null;
}

function Peekit() {
  const g = useRef<THREE.Group>(null);
  const pos = useRef({ x: WHIM.peekHome.x, z: WHIM.peekHome.z });
  const hide = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    const p = pos.current;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    const seen = lookingAt(live.x, live.z, live.yaw, p.x, p.z, 12);
    if (seen && d < 9.5) {
      hide.current = true;
      const t = live.playT % 2 < 1 ? WHIM.peekHide : WHIM.peekHome;
      p.x += (t.x - p.x) * Math.min(1, dt * 4.2);
      p.z += (t.z - p.z) * Math.min(1, dt * 4.2);
      if (d < 7) live.fangMark = { x: p.x, z: p.z, kind: "peekit" };
    } else {
      hide.current = false;
      if (d < 14 && live.stillT > 1.2) {
        p.x += (live.x - p.x) * dt * 0.22;
        p.z += (live.z - p.z) * dt * 0.22;
      }
      if (d < 11) live.fangMark = { x: p.x, z: p.z, kind: "peekit" };
    }
    if (d < 2.4 && talkOk()) {
      pay(8, "peekit");
      live.listen = "The Peekit squeaked and left a coin. It does not like being named.";
    } else if (d < 4.8 && !live.listen) {
      live.listen = hide.current ? "Something watched. Then it was a tree." : "A small face in the roots. It is counting you.";
    }
    if (g.current) {
      const y = heightAt(p.x, p.z);
      g.current.position.set(p.x, y + (hide.current ? 0.18 : 0.28 + Math.sin(live.playT * 3) * 0.03), p.z);
      g.current.rotation.y = Math.atan2(-(live.x - p.x), -(live.z - p.z));
      g.current.visible = !live.house;
    }
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <sphereGeometry args={[0.22, 8, 6]} />
        {lamb("#8a6a52", { kind: "wool" })}
      </mesh>
      <mesh position={[0.09, 0.22, -0.16]}>
        <sphereGeometry args={[0.08, 6, 5]} />
        {lamb("#1a1410")}
      </mesh>
      <mesh position={[-0.09, 0.22, -0.16]}>
        <sphereGeometry args={[0.08, 6, 5]} />
        {lamb("#1a1410")}
      </mesh>
      <mesh position={[0.09, 0.24, -0.22]}>
        <sphereGeometry args={[0.025, 5, 4]} />
        {lamb("#f4efe4")}
      </mesh>
      <mesh position={[-0.09, 0.24, -0.22]}>
        <sphereGeometry args={[0.025, 5, 4]} />
        {lamb("#f4efe4")}
      </mesh>
      <mesh position={[0.12, 0.34, 0.02]} rotation={[0.2, 0, 0.4]}>
        <sphereGeometry args={[0.07, 5, 4]} />
        {lamb("#6a5040", { kind: "wool" })}
      </mesh>
      <mesh position={[-0.12, 0.34, 0.02]} rotation={[0.2, 0, -0.4]}>
        <sphereGeometry args={[0.07, 5, 4]} />
        {lamb("#6a5040", { kind: "wool" })}
      </mesh>
      <mesh position={[0, 0.12, 0.28]} scale={[0.7, 0.45, 1.4]}>
        <sphereGeometry args={[0.1, 6, 5]} />
        {lamb("#d8c4a0", { kind: "wool" })}
      </mesh>
    </group>
  );
}

function Glimmerjack() {
  const g = useRef<THREE.Group>(null);
  const stole = useRef(false);
  const t0 = useRef(Math.random() * 10);
  useFrame((_, dt) => {
    if (live.house) return;
    t0.current += dt;
    const nest = WHIM.jackNest;
    const circling = !stole.current;
    const ang = t0.current * 0.7;
    const cx = circling ? live.x + Math.sin(ang) * 3.4 : nest.x;
    const cz = circling ? live.z + Math.cos(ang) * 3.4 : nest.z;
    const y = circling
      ? heightAt(cx, cz) + 2.4 + Math.sin(t0.current * 4) * 0.25
      : heightAt(nest.x, nest.z) + 3.15;
    if (circling && live.stillT > 3.6 && (useGame.getState().coins ?? 0) > 0 && !live.smashed.jacksteal) {
      stole.current = true;
      live.smashed.jacksteal = true;
      const g = useGame.getState();
      useGame.setState({ coins: Math.max(0, (g.coins ?? 0) - 1) });
      sfx.rustle();
      live.listen = "A Glimmerjack took a coin. The nest is by the mill.";
      live.fangMark = { x: nest.x, z: nest.z, kind: "jack" };
    }
    const dn = Math.hypot(live.x - nest.x, live.z - nest.z);
    if (stole.current && dn < 1.8 && (talkOk() || (live.slash && Math.hypot(live.slash.x - nest.x, live.slash.z - nest.z) < 1.6))) {
      pay(12, "jacknest");
      live.listen = "The nest had your coin. And two more it did not earn.";
      stole.current = false;
    } else if (dn < 2.4 && stole.current && !live.listen) {
      live.listen = "A bronze nest. Something shiny is kicking.";
    }
    if (g.current) {
      g.current.position.set(cx, y, cz);
      g.current.rotation.y = circling ? ang + Math.PI / 2 : 0.4;
      g.current.visible = !live.house;
    }
  });
  const ny = heightAt(WHIM.jackNest.x, WHIM.jackNest.z);
  return (
    <group>
      <group ref={g}>
        <mesh castShadow>
          <sphereGeometry args={[0.11, 6, 5]} />
          {lamb("#8a5a28")}
        </mesh>
        <mesh position={[0, 0, -0.16]} scale={[0.5, 0.35, 1.1]}>
          <sphereGeometry args={[0.1, 5, 4]} />
          {lamb("#c9a227")}
        </mesh>
        <mesh position={[0.12, 0.02, 0]} rotation={[0.2, 0.4, 0.6]}>
          <boxGeometry args={[0.28, 0.04, 0.12]} />
          {lamb("#6a3a18")}
        </mesh>
        <mesh position={[-0.12, 0.02, 0]} rotation={[0.2, -0.4, -0.6]}>
          <boxGeometry args={[0.28, 0.04, 0.12]} />
          {lamb("#6a3a18")}
        </mesh>
      </group>
      <mesh position={[WHIM.jackNest.x, ny + 3.05, WHIM.jackNest.z]}>
        <sphereGeometry args={[0.22, 6, 4]} />
        {lamb("#5a3a20")}
      </mesh>
    </group>
  );
}

function Puddlehop() {
  const g = useRef<THREE.Group>(null);
  const hop = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    hop.current += dt;
    const { x, z } = WHIM.puddle;
    const d = Math.hypot(live.x - x, live.z - z);
    const bounce = Math.abs(Math.sin(hop.current * 3.2));
    if (d < 1.6 && live.y > heightAt(x, z) + 0.7) {
      pay(6, "puddlehop");
      live.listen = "The Puddlehop flipped. It is very proud of a small trick.";
    } else if (d < 2.6 && !live.listen) {
      live.listen = "A spiral back in the puddle. It hops when you hop.";
    }
    if (g.current) {
      g.current.position.set(x + Math.sin(hop.current) * 0.35, heightAt(x, z) + 0.12 + bounce * 0.28, z + Math.cos(hop.current * 0.8) * 0.2);
      g.current.rotation.y = hop.current;
    }
  });
  return (
    <group ref={g}>
      <mesh castShadow>
        <sphereGeometry args={[0.18, 7, 5]} />
        {lamb("#4a6a38")}
      </mesh>
      <mesh position={[0, 0.12, 0.02]} rotation={[0.4, 0, 0]} scale={[0.9, 0.45, 0.9]}>
        <sphereGeometry args={[0.16, 7, 5]} />
        {lamb("#c4b090")}
      </mesh>
      <mesh position={[0.07, 0.1, -0.14]}>
        <sphereGeometry args={[0.04, 5, 4]} />
        {lamb("#1a1814")}
      </mesh>
      <mesh position={[-0.07, 0.1, -0.14]}>
        <sphereGeometry args={[0.04, 5, 4]} />
        {lamb("#1a1814")}
      </mesh>
    </group>
  );
}

function ClockHen() {
  const g = useRef<THREE.Group>(null);
  const spook = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const { x, z } = WHIM.hen;
    const d = Math.hypot(live.x - x, live.z - z);
    const fd = Math.hypot(live.nimX - x, live.nimZ - z);
    if (fd < 1.8) spook.current = 1.6;
    if (spook.current > 0) spook.current -= dt;
    const peck = Math.abs(Math.sin(live.playT * 8.2));
    if (d < 2.2 && talkOk()) {
      pay(5, "clockhen");
      live.listen = "The hen pecks in fours. Cress says this is a legal matter.";
    }
    if (g.current) {
      const spin = spook.current > 0 ? live.playT * 8 : 0.3;
      g.current.position.set(x + Math.sin(spin) * (spook.current > 0 ? 0.8 : 0.05), heightAt(x, z) + 0.18, z + Math.cos(spin) * (spook.current > 0 ? 0.8 : 0.05));
      g.current.rotation.y = spin;
      g.current.rotation.x = spook.current > 0 ? 0 : peck * 0.35;
    }
    if (fd < 2.4) live.fangMark = live.fangMark ?? { x, z, kind: "hen" };
  });
  return (
    <group ref={g}>
      <mesh castShadow>
        <sphereGeometry args={[0.16, 6, 5]} />
        {lamb("#d8c8a0")}
      </mesh>
      <mesh position={[0, 0.14, -0.14]}>
        <sphereGeometry args={[0.08, 5, 4]} />
        {lamb("#efe6d4")}
      </mesh>
      <mesh position={[0, 0.14, -0.22]}>
        <coneGeometry args={[0.03, 0.08, 4]} />
        {lamb("#e07a28")}
      </mesh>
      <mesh position={[0, 0.22, -0.12]}>
        <sphereGeometry args={[0.05, 5, 4]} />
        {lamb("#c45c48")}
      </mesh>
    </group>
  );
}

function DuskHare() {
  const g = useRef<THREE.Group>(null);
  const frozen = useRef(false);
  useFrame(() => {
    if (live.house) {
      if (g.current) g.current.visible = false;
      return;
    }
    const night = live.night || live.dusk > 0.45;
    const { x, z } = WHIM.hare;
    const d = Math.hypot(live.x - x, live.z - z);
    frozen.current = lookingAt(live.x, live.z, live.yaw, x, z, 16);
    if (g.current) {
      g.current.visible = night;
      g.current.position.set(x, heightAt(x, z) + (frozen.current ? 0.22 : 0.22 + Math.sin(live.playT * 7) * 0.06), z);
      g.current.rotation.y = frozen.current ? Math.atan2(-(live.x - x), -(live.z - z)) : live.playT * 0.4;
    }
    if (night && d < 11) live.fangMark = { x, z, kind: "hare" };
    if (night && frozen.current && d < 2.2 && talkOk()) {
      pay(9, "duskhare");
      live.listen = "The Duskhare did not move. You counted its whiskers. It counted you back.";
    } else if (night && d < 4 && !live.listen) {
      live.listen = frozen.current ? "It is pretending to be a stone. The ears are a clue." : "Something hops when you look away.";
    }
  });
  return (
    <group ref={g}>
      <mesh castShadow>
        <sphereGeometry args={[0.2, 7, 5]} />
        {lamb("#6a7088", { kind: "wool" })}
      </mesh>
      <mesh position={[0.05, 0.32, 0.02]} rotation={[0.15, 0, 0.1]} scale={[0.35, 1, 0.35]}>
        <sphereGeometry args={[0.16, 5, 4]} />
        {lamb("#5a6078", { kind: "wool" })}
      </mesh>
      <mesh position={[-0.05, 0.32, 0.02]} rotation={[0.15, 0, -0.1]} scale={[0.35, 1, 0.35]}>
        <sphereGeometry args={[0.16, 5, 4]} />
        {lamb("#5a6078", { kind: "wool" })}
      </mesh>
      <mesh position={[0, 0.08, -0.2]} scale={[0.7, 0.5, 1]}>
        <sphereGeometry args={[0.1, 5, 4]} />
        {lamb("#c8c2b8")}
      </mesh>
    </group>
  );
}

function RingMarks() {
  const nearI = useRef(-1);
  useFrame(() => {
    if (live.house) return;
    nearI.current = -1;
    for (let i = 0; i < RING_MARKS.length; i++) {
      const m = RING_MARKS[i]!;
      const d = Math.hypot(live.x - m.x, live.z - m.z);
      if (d < 2.4) {
        nearI.current = i;
        live.fangMark = { x: m.x, z: m.z, kind: "ring" };
        if (talkOk()) {
          takeCipher("ring-three", true);
          pay(7, `ring${i}`);
          live.listen = live.listen || "Three rings. The inside one is empty. Fang will not stand on it.";
        } else if (!live.listen) {
          live.listen = "Old rings in the stone. Someone stopped counting.";
        }
      }
    }
  });
  return (
    <group>
      {RING_MARKS.map((m, i) => {
        const y = heightAt(m.x, m.z);
        return (
          <group key={i} position={[m.x, y + 0.06, m.z]} rotation={[-Math.PI / 2, 0, i * 0.4]}>
            <mesh>
              <torusGeometry args={[0.55, 0.045, 5, 16]} />
              {lamb("#c9a227")}
            </mesh>
            <mesh>
              <torusGeometry args={[0.34, 0.04, 5, 14]} />
              {lamb("#8a7a48")}
            </mesh>
            <mesh>
              <torusGeometry args={[0.16, 0.035, 5, 12]} />
              {lamb("#4a4030")}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function HollowPear() {
  const glow = useRef<THREE.PointLight>(null);
  const taken = useRef(false);
  useFrame(() => {
    if (live.house) return;
    const { x, z } = WHIM.hollow;
    const d = Math.hypot(live.x - x, live.z - z);
    if (glow.current) glow.current.intensity = taken.current ? 0.05 : 0.55 + Math.sin(live.playT * 2) * 0.15;
    if (d < 1.8 && talkOk() && !taken.current) {
      taken.current = true;
      pay(14, "emberpear");
      live.listen = "A warm fruit in the hollow. It tastes like a leftover sunset.";
    } else if (d < 3.2 && !taken.current && !live.listen) {
      live.listen = "The tree is holding a light. It does not grow that on the outside.";
    }
  });
  const { x, z } = WHIM.hollow;
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.55, 0.7, 2.3, 7]} />
        {lamb("#4a3220")}
      </mesh>
      <mesh position={[0.12, 1.35, -0.42]}>
        <sphereGeometry args={[0.16, 6, 5]} />
        {lamb("#e07a28", { emissive: "#e07a28", emit: 0.4 })}
      </mesh>
      <pointLight ref={glow} color="#e07a28" distance={5.5} position={[0.12, 1.4, -0.4]} />
    </group>
  );
}

function CampJournal() {
  const { x, z } = WHIM.camp;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.2 && talkOk()) {
      takeCipher("camp-fold", true);
      pay(6, "campnote");
      live.listen = "The page says: ‘The maps fold here. Do not ask the man on the stump where.’";
    } else if (d < 3.4 && !live.listen) {
      live.listen = "An old camp. The fire is years cold. The book is not.";
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0.6, 0.18, -0.4]} rotation={[0.1, 0.4, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 1.1, 5]} />
        {lamb("#5a3a20")}
      </mesh>
      <mesh position={[-0.5, 0.14, 0.5]} rotation={[0.2, -0.5, 0.1]}>
        <cylinderGeometry args={[0.1, 0.12, 0.9, 5]} />
        {lamb("#4a3220")}
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <circleGeometry args={[1.1, 8]} />
        {lamb("#3a2a20")}
      </mesh>
      <mesh position={[0.15, 0.08, 0.1]} rotation={[-1.2, 0.2, 0.1]}>
        <boxGeometry args={[0.28, 0.04, 0.22]} />
        {lamb("#d8c8a0")}
      </mesh>
    </group>
  );
}

function Hopscotch() {
  const { x, z } = WHIM.hopscotch;
  const squares = useMemo(() => [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
    x: x + (i % 2) * 0.55,
    z: z + Math.floor(i / 2) * 0.7,
    n: i + 1,
  })), [x, z]);
  const last = useRef(0);
  useFrame(() => {
    if (live.house) return;
    for (const s of squares) {
      const d = Math.hypot(live.x - s.x, live.z - s.z);
      if (d < 0.38 && !live.grounded && s.n === last.current + 1) {
        last.current = s.n;
        if (s.n === 8) {
          pay(10, "hopscotch");
          live.listen = "Eight. Tess will say you cheated. You did not.";
        }
      }
    }
    if (Math.hypot(live.x - x, live.z - z) < 3.2 && last.current === 0 && !live.listen) {
      live.listen = "Chalk squares. Jump them in order. The numbers go up.";
    }
  });
  return (
    <group>
      {squares.map((s) => (
        <mesh key={s.n} position={[s.x, heightAt(s.x, s.z) + 0.03, s.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.48, 0.58]} />
          {lamb(s.n % 2 ? "#efe6d4" : "#e8d48a")}
        </mesh>
      ))}
    </group>
  );
}

function HearthMotes() {
  const pts = useMemo(() => {
    const a: THREE.Vector3[] = [];
    for (let i = 0; i < 18; i++) {
      a.push(new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 2.4, (Math.random() - 0.5) * 4));
    }
    return a;
  }, []);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const on = live.dusk > 0.25 || live.night;
    if (g.current) {
      g.current.visible = on && !live.house;
      g.current.position.set(WHIM.fire.x, heightAt(WHIM.fire.x, WHIM.fire.z) + 1.4, WHIM.fire.z);
      g.current.rotation.y = live.playT * 0.15;
    }
  });
  return (
    <group ref={g}>
      {pts.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.04, 4, 3]} />
          {lamb("#e8a040", { emissive: "#e07a28", emit: 0.6 })}
        </mesh>
      ))}
    </group>
  );
}

function RoofCat() {
  const x = WHIM.cress.x - 18;
  const z = WHIM.cress.z - 8;
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) {
      g.current.position.set(x, heightAt(x, z) + 3.35, z);
      g.current.rotation.y = Math.sin(live.playT * 0.4) * 0.4;
    }
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 3.2 && talkOk()) {
      pay(4, "roofcat");
      live.listen = "The cat blinked once. That is the whole conversation.";
    }
  });
  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[0.14, 6, 5]} />
        {lamb("#3a3228")}
      </mesh>
      <mesh position={[0.08, 0.16, 0.02]} rotation={[0, 0, 0.4]} scale={[0.35, 0.7, 0.3]}>
        <sphereGeometry args={[0.1, 5, 4]} />
        {lamb("#3a3228")}
      </mesh>
      <mesh position={[-0.08, 0.16, 0.02]} rotation={[0, 0, -0.4]} scale={[0.35, 0.7, 0.3]}>
        <sphereGeometry args={[0.1, 5, 4]} />
        {lamb("#3a3228")}
      </mesh>
      <mesh position={[0, 0.02, 0.28]} scale={[0.4, 0.35, 1.2]}>
        <sphereGeometry args={[0.08, 5, 4]} />
        {lamb("#3a3228")}
      </mesh>
    </group>
  );
}

function FunnySigns() {
  return (
    <group>
      <N64Sign x={WHIM.signHen.x} z={WHIM.signHen.z} />
      <N64Sign x={WHIM.signPath.x} z={WHIM.signPath.z} />
      <N64Sign x={WHIM.signHome.x} z={WHIM.signHome.z} />
      <SignTalk />
    </group>
  );
}

function SignTalk() {
  useFrame(() => {
    if (live.house) return;
    const spots: [number, number, string, string][] = [
      [WHIM.signHen.x, WHIM.signHen.z, "hensign", "Please do not teach the hens math. They are already proud."],
      [WHIM.signPath.x, WHIM.signPath.z, "pathsign", "This path is shorter if you do not stop to read signs."],
      [WHIM.signHome.x, WHIM.signHome.z, "homesign", "Lost: one sensible hat. If found, keep it. I look better this way."],
    ];
    for (const [x, z, key, line] of spots) {
      const d = Math.hypot(live.x - x, live.z - z);
      if (d < 1.8 && talkOk()) {
        pay(3, key);
        live.listen = line;
      }
    }
  });
  return null;
}

function DrawerBits() {
  const hut = WHIM.drawer;
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = live.house === "drawer";
    if (live.house !== "drawer") return;
    const spoon = { x: hut.x + 2.4, z: hut.z - 1.2 };
    const d = Math.hypot(live.x - spoon.x, live.z - spoon.z);
    if (d < 1.6 && talkOk() && !live.listen) {
      live.listen = "The Peril Spoon. Midge will not sell it. She says it is too dangerous.";
    }
  });
  const y = heightAt(hut.x, hut.z);
  return (
    <group ref={g} visible={false} position={[hut.x, y, hut.z]}>
      <mesh position={[2.2, 1.15, -1.4]}>
        <boxGeometry args={[1.6, 1.8, 0.28]} />
        {lamb("#6a4a28")}
      </mesh>
      <mesh position={[2.2, 1.55, -1.22]} rotation={[0.15, 0.2, 0.4]}>
        <cylinderGeometry args={[0.04, 0.05, 0.7, 5]} />
        {lamb("#c9a227")}
      </mesh>
      <mesh position={[-2.1, 0.55, 1.4]}>
        <boxGeometry args={[0.7, 0.5, 0.7]} />
        {lamb("#4a5a38")}
      </mesh>
      <mesh position={[0, 0.35, 2.2]}>
        <boxGeometry args={[1.1, 0.7, 0.8]} />
        {lamb("#8a5a28")}
      </mesh>
      <pointLight color="#e8c080" intensity={0.55} distance={8} position={[0, 2.2, 0]} />
    </group>
  );
}

function CozyWindows() {
  const wins = useMemo(
    () =>
      [
        vSafe(WHIM.fire.x - 22, WHIM.fire.z - 16),
        vSafe(WHIM.fire.x + 18, WHIM.fire.z - 4),
        vSafe(WHIM.fire.x + 8, WHIM.fire.z - 22),
        vSafe(WHIM.fire.x - 10, WHIM.fire.z + 2),
      ],
    [],
  );
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = (live.dusk > 0.35 || live.night) && !live.house;
  });
  return (
    <group ref={g}>
      {wins.map((p, i) => (
        <mesh key={i} position={[p.x, heightAt(p.x, p.z) + 1.55, p.z]}>
          <planeGeometry args={[0.55, 0.7]} />
          {lamb("#e8c080", { emissive: "#e8a040", emit: 0.7 })}
        </mesh>
      ))}
    </group>
  );
}

function vSafe(x: number, z: number) {
  return { x, z };
}
