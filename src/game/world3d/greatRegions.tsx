import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { KEEP_Z, fieldHeight, heightAt } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { useGame } from "../store";
import { sfx } from "../audio";

type Prize = "coins" | "map" | "heart" | "none";
type Kind =
  | "castle"
  | "forest"
  | "under"
  | "climb"
  | "fang"
  | "village"
  | "river"
  | "temple"
  | "ruin"
  | "beast"
  | "island"
  | "fire"
  | "snow"
  | "desert"
  | "machine"
  | "magic"
  | "archery"
  | "haunt"
  | "animals"
  | "rail"
  | "ancient"
  | "fort"
  | "tree"
  | "merchant"
  | "map"
  | "optional"
  | "math"
  | "sky"
  | "escape"
  | "below";

type Site = {
  id: Kind;
  kind: Kind;
  name: string;
  line: string;
  x: number;
  z: number;
  prize: Prize;
  hx: number;
  hz: number;
};

const DEFS: { kind: Kind; name: string; line: string; prize: Prize }[] = [
  { kind: "castle", name: "Castle gardens", line: "Courtyards, a library wing, and a stair that goes under the wall.", prize: "coins" },
  { kind: "forest", name: "The Deepwood", line: "Giant trees, a clearing, and a path that forgets you.", prize: "map" },
  { kind: "under", name: "A dark mouth", line: "This cave does not end. It goes under the world.", prize: "none" },
  { kind: "climb", name: "The carved cliffs", line: "Dirt stone, old brick, and vines. The path is upward.", prize: "heart" },
  { kind: "fang", name: "Gray Fang wilds", line: "Dens, tracks, and wolves that are not statues.", prize: "coins" },
  { kind: "village", name: "Hearth town", line: "Houses, a well, a barn, and people with different work.", prize: "coins" },
  { kind: "river", name: "The great river", line: "A bridge, a mill, and a log that makes a crossing.", prize: "none" },
  { kind: "temple", name: "The thinking temple", line: "Plates in the floor. Step them in order.", prize: "map" },
  { kind: "ruin", name: "The broken spears", line: "Something ended here. The walls still remember.", prize: "coins" },
  { kind: "beast", name: "The wide tracks", line: "Something enormous walks this valley.", prize: "none" },
  { kind: "island", name: "The lost island", line: "You only get here if you mean to.", prize: "map" },
  { kind: "fire", name: "Fire mountain", line: "Black rock, orange cracks, and a path that fails.", prize: "heart" },
  { kind: "snow", name: "The frozen north", line: "Cabins, ice, and prints that are not yours.", prize: "coins" },
  { kind: "desert", name: "The buried dunes", line: "A statue's shadow points at a door.", prize: "map" },
  { kind: "machine", name: "The old machine", line: "Gears bigger than a house. It used to move.", prize: "coins" },
  { kind: "magic", name: "Oddwick", line: "A town of strange, friendly people.", prize: "heart" },
  { kind: "archery", name: "The long butts", line: "Targets far enough that you have to mean it.", prize: "coins" },
  { kind: "haunt", name: "The quiet street", line: "Nobody lives here now. The doors still move.", prize: "none" },
  { kind: "animals", name: "The herds", line: "They eat, wander, and leave when you run.", prize: "coins" },
  { kind: "rail", name: "The old line", line: "A cart. It still knows the way.", prize: "none" },
  { kind: "ancient", name: "The first road", line: "Statues of people who were here before Oakstead.", prize: "map" },
  { kind: "fort", name: "The gray fortress", line: "Walls, a side door, and more than one way in.", prize: "coins" },
  { kind: "tree", name: "The world tree", line: "Roots, a hollow, and branches above the weather.", prize: "none" },
  { kind: "merchant", name: "The wagon road", line: "He is not always here.", prize: "none" },
  { kind: "map", name: "The map table", line: "One piece of a map that does not match the roads.", prize: "map" },
  { kind: "optional", name: "A ordinary well", line: "Nothing important. Probably.", prize: "none" },
  { kind: "math", name: "The number hall", line: "The door listens for three plus five.", prize: "heart" },
  { kind: "sky", name: "The high islands", line: "Above Numeria. Waterfalls go down forever.", prize: "coins" },
  { kind: "escape", name: "The failing bridge", line: "When it starts, you run. The ground does not wait.", prize: "coins" },
  { kind: "below", name: "The world beneath", line: "A whole place under the one you knew.", prize: "heart" },
];

function spot(i: number) {
  const a = (i / DEFS.length) * Math.PI * 2 + 0.4;
  const rad = 540 + (i % 5) * 80;
  return { x: Math.cos(a) * rad, z: Math.sin(a) * rad };
}

export const SITES: Site[] = DEFS.map((d, i) => {
  const p = d.kind === "castle" ? { x: 24, z: KEEP_Z + 10 } : spot(i);
  return { ...d, id: d.kind, x: p.x, z: p.z, hx: d.kind === "beast" ? 3.2 : 1.6, hz: d.kind === "beast" ? 4.2 : 1.6 };
});

function site(id: Kind) {
  return SITES.find((s) => s.id === id)!;
}

function seen(id: string) {
  return Boolean(useGame.getState().quests?.[`seen-${id}`]);
}

function got(id: string) {
  return Boolean(useGame.getState().quests?.[`got-${id}`]);
}

function markSeen(s: Site) {
  if (seen(s.id)) return;
  useGame.getState().setQuest(`seen-${s.id}`, 1);
  live.banner = s.name;
  live.objective = s.line;
  sfx.ok();
}

function mapCount() {
  const q = useGame.getState().quests ?? {};
  return ["forest", "temple", "island", "desert", "map"].filter((id) => q[`got-${id}`]).length;
}

function grantPrize(s: Site) {
  if (s.prize === "none" || got(s.id)) return;
  const g = useGame.getState();
  if (s.prize === "coins") {
    g.addCoins(14);
    live.banner = `Found in ${s.name}.`;
  } else if (s.prize === "heart") {
    g.addCoins(4);
    live.banner = "You feel steadier.";
    sfx.heal();
  } else {
    const n = mapCount() + 1;
    live.banner = n >= 5 ? "The map is whole. The world tree will lift you." : `Map piece ${n} of 5.`;
    sfx.chime();
  }
  g.setQuest(`got-${s.id}`, 1);
}

const escape = { on: false, t: 0, x: 0, z: 0 };
const mathStep = { n: 0, on: -1 };

function warp(x: number, z: number, name: string, deck?: { y: number; r: number }) {
  if (live.roomWarp || live.warp || live.bazaar) return;
  if (deck) live.deck = { x, z, y: deck.y, r: deck.r };
  live.roomWarp = { to: "meadow", x, z, t: 0, phase: "out", walkX: live.x, walkZ: live.z };
  live.banner = name;
}

function merchantPos() {
  const ids: Kind[] = ["village", "magic", "desert", "merchant"];
  const i = Math.abs(Math.floor(live.day * 4)) % ids.length;
  const s = site(ids[i]!);
  return { x: s.x + 7, z: s.z + 2 };
}

export function stepRegions(talk: boolean) {
  if (live.bazaar || live.house) return false;
  const m = merchantPos();
  if (talk && Math.hypot(live.x - m.x, live.z - m.z) < 2.4) {
    const g = useGame.getState();
    if (g.quests?.bead) live.banner = "The bead likes old roads. I told you.";
    else if (g.coins < 25) live.banner = "One strange bead. Twenty-five coins.";
    else {
      useGame.setState({ coins: g.coins - 25 });
      g.setQuest("bead", 1);
      live.banner = "A bead. It warms when a hidden door is near.";
      sfx.ok();
    }
    return true;
  }
  if (!talk) return false;
  const links: { id: Kind; ox: number; oz: number; go: Kind; name: string; sky?: boolean }[] = [
    { id: "under", ox: 0, oz: 4, go: "below", name: "The world beneath" },
    { id: "below", ox: 0, oz: -4, go: "under", name: "The surface" },
    { id: "rail", ox: 3, oz: 0, go: "machine", name: "The old machine" },
    { id: "machine", ox: -3, oz: 0, go: "rail", name: "The old line" },
    { id: "river", ox: 5, oz: 0, go: "island", name: "The lost island" },
    { id: "island", ox: -4, oz: 0, go: "river", name: "The great river" },
    { id: "fort", ox: 4, oz: 3, go: "ancient", name: "The first road" },
    { id: "castle", ox: -4, oz: 2, go: "below", name: "Under the castle" },
  ];
  for (const L of links) {
    const s = site(L.id);
    if (Math.hypot(live.x - (s.x + L.ox), live.z - (s.z + L.oz)) < 1.8) {
      const dest = site(L.go);
      warp(dest.x, dest.z + 6, L.name);
      return true;
    }
  }
  const tree = site("tree");
  if (Math.hypot(live.x - tree.x, live.z - (tree.z + 3)) < 2) {
    if (mapCount() < 3) {
      live.banner = "The branches stay shut. The map is still missing pieces.";
      return true;
    }
    const sky = site("sky");
    const y = fieldHeight(sky.x, sky.z) + 18;
    warp(sky.x, sky.z, "The high islands", { y, r: 10 });
    return true;
  }
  for (const s of SITES) {
    if (Math.hypot(live.x - (s.x + 2.4), live.z - s.z) > 1.7) continue;
    if (s.id === "optional") {
      useGame.getState().setQuest("opt1", 1);
      live.banner = "A note in the well: follow the broken spears.";
      return true;
    }
    if (s.id === "ruin" && useGame.getState().quests?.opt1 && !useGame.getState().quests?.opt2) {
      useGame.getState().setQuest("opt2", 1);
      useGame.getState().addCoins(20);
      live.banner = "Under the spears: the buried gate is real.";
      return true;
    }
    if (s.id === "below" && useGame.getState().quests?.opt2 && !useGame.getState().quests?.opt3) {
      useGame.getState().setQuest("opt3", 1);
      useGame.getState().addCoins(40);
      live.banner = "You were not supposed to find this. Good.";
      sfx.chime();
      return true;
    }
    if (s.id === "math") {
      live.banner = mathStep.n >= 2 ? "The hall heard you." : "Three plus five. Step that stone.";
      if (mathStep.n >= 2) grantPrize(s);
      return true;
    }
    if (s.id === "escape" && !escape.on) {
      grantPrize(s);
      escape.on = true;
      escape.t = 9;
      escape.x = live.x;
      escape.z = live.z;
      live.banner = "The bridge is going. Run!";
      return true;
    }
    grantPrize(s);
    return true;
  }
  return false;
}

export function collideRegions(nx: number, nz: number) {
  if (live.house) return null;
  for (const s of SITES) {
    if (Math.abs(nx - s.x) > 24 || Math.abs(nz - s.z) > 24) continue;
    const dx = nx - s.x;
    const dz = nz - s.z;
    if (Math.abs(dx) > s.hx + 0.4 || Math.abs(dz) > s.hz + 0.4) continue;
    const px = s.hx + 0.4 - Math.abs(dx);
    const pz = s.hz + 0.4 - Math.abs(dz);
    if (px < pz) return { x: s.x + Math.sign(dx || 1) * (s.hx + 0.4), z: nz };
    return { x: nx, z: s.z + Math.sign(dz || 1) * (s.hz + 0.4) };
  }
  return null;
}

function Box({ p, a, c, y = 0 }: { p: [number, number, number]; a: [number, number, number]; c: string; y?: number }) {
  return (
    <mesh position={[p[0], p[1] + y, p[2]]} castShadow receiveShadow>
      <boxGeometry args={a} />
      {lamb(c)}
    </mesh>
  );
}

function Wolf({ ox, oz, seed }: { ox: number; oz: number; seed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.35 + seed;
    ref.current.position.set(ox + Math.sin(t) * 2.2, 0, oz + Math.cos(t * 0.8) * 1.6);
    ref.current.rotation.y = t;
  });
  const fur = seed % 2 ? "#5c5c62" : "#7a736c";
  return (
    <group ref={ref}>
      <Box p={[0, 0.42, 0]} a={[0.38, 0.32, 0.95]} c={fur} />
      <Box p={[0, 0.58, -0.52]} a={[0.3, 0.26, 0.4]} c={fur} />
      <Box p={[0, 0.52, -0.74]} a={[0.16, 0.12, 0.18]} c="#3a3532" />
      <Box p={[-0.1, 0.78, -0.5]} a={[0.08, 0.16, 0.06]} c={fur} />
      <Box p={[0.1, 0.78, -0.5]} a={[0.08, 0.16, 0.06]} c={fur} />
      <Box p={[0, 0.48, 0.62]} a={[0.1, 0.1, 0.4]} c={fur} />
      {[-0.16, 0.16].map((s) =>
        [-0.28, 0.28].map((z) => <Box key={`${s}${z}`} p={[s, 0.16, z]} a={[0.1, 0.28, 0.1]} c="#4a4844" />),
      )}
    </group>
  );
}

function SiteView({ s }: { s: Site }) {
  const y = heightAt(s.x, s.z);
  const k = s.kind;
  return (
    <group position={[s.x, y, s.z]}>
      {k === "castle" ? (
        <>
          <Box p={[0, 1.2, 0]} a={[3.2, 2.4, 2.2]} c="#efe4cc" />
          <Box p={[0, 2.6, 0]} a={[3.6, 0.3, 2.5]} c="#8a3030" />
          <Box p={[-3.2, 0.4, 1]} a={[1.4, 0.8, 1.4]} c="#3f6a32" />
          <Box p={[2.2, 0.7, -1]} a={[1.1, 1.4, 1.1]} c="#6a5340" />
        </>
      ) : null}
      {k === "forest" ? (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <group key={i} position={[Math.cos(i) * 3.2, 0, Math.sin(i) * 2.4]}>
              <Box p={[0, 1.4, 0]} a={[0.4, 2.8, 0.4]} c="#5a4030" />
              <mesh position={[0, 3.2, 0]} castShadow>
                <coneGeometry args={[1.3 + (i % 2) * 0.3, 2.4, 6]} />
                {lamb(i % 2 ? "#1f5a32" : "#2f7a40")}
              </mesh>
            </group>
          ))}
        </>
      ) : null}
      {k === "under" || k === "below" ? (
        <>
          <Box p={[0, 1.6, 0]} a={[4, 3.2, 1.2]} c="#3a3834" />
          <Box p={[0, 1.1, 0.4]} a={[1.6, 2, 0.8]} c="#141210" />
          {k === "below" ? <Box p={[2.4, 0.4, 2]} a={[2, 0.3, 2]} c="#3a6858" /> : null}
        </>
      ) : null}
      {k === "climb" ? (
        <>
          <Box p={[0, 3.2, 0]} a={[6, 6.4, 1.4]} c="#7a6248" />
          <Box p={[1.2, 2.2, 0.75]} a={[0.8, 0.5, 0.1]} c="#c9a24a" />
          <Box p={[-1, 1.2, 0.8]} a={[0.3, 1.4, 0.2]} c="#3f6a32" />
        </>
      ) : null}
      {k === "fang" ? (
        <>
          <Box p={[0, 0.8, 0]} a={[3.4, 1.6, 2.2]} c="#5a5048" />
          <Box p={[0, 0.5, 1.4]} a={[1.4, 0.9, 0.8]} c="#1a1814" />
          <Wolf ox={4} oz={1} seed={1} />
          <Wolf ox={-3} oz={4} seed={2} />
          <Wolf ox={2} oz={-4} seed={4} />
        </>
      ) : null}
      {k === "village" || k === "magic" || k === "haunt" ? (
        <>
          {[-3.2, 0, 3.2].map((x, i) => (
            <group key={x}>
              <Box p={[x, 1, 0]} a={[2, 2, 1.8]} c={k === "magic" ? ["#c45a78", "#3a6aaa", "#e0c040"][i]! : k === "haunt" ? "#6a6858" : "#e7d6b8"} />
              <Box p={[x, 2.2, 0]} a={[2.3, 0.4, 2]} c={k === "haunt" ? "#4a4038" : "#8a3030"} />
            </group>
          ))}
        </>
      ) : null}
      {k === "river" ? (
        <>
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[14, 3.2]} />
            {lamb("#2a6aaa")}
          </mesh>
          <Box p={[0, 0.4, 0]} a={[2.2, 0.25, 3.4]} c="#6a5340" />
          <Box p={[4, 1.2, -2]} a={[1.6, 2.4, 1.6]} c="#d8c8a8" />
        </>
      ) : null}
      {k === "temple" || k === "math" ? (
        <>
          <Box p={[0, 1.5, -1]} a={[5, 3, 1]} c="#d8d0c4" />
          {[0, 1, 2].map((i) => (
            <Box key={i} p={[-1.4 + i * 1.4, 0.08, 1.6]} a={[0.9, 0.16, 0.9]} c={i === 2 ? "#c9a24a" : "#8a8478"} />
          ))}
        </>
      ) : null}
      {k === "ruin" || k === "ancient" || k === "fort" ? (
        <>
          <Box p={[-1.5, 1.2, 0]} a={[0.6, 2.4, 2]} c={k === "fort" ? "#6a5848" : "#8a8478"} />
          <Box p={[1.6, 0.7, 0.4]} a={[0.5, 1.4, 1.6]} c="#6a6860" />
          <Box p={[0, 1.8, -1]} a={[0.4, 1.6, 0.4]} c="#5a5048" />
        </>
      ) : null}
      {k === "beast" ? <Beast /> : null}
      {k === "island" ? (
        <>
          <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[8, 20]} />
            {lamb("#2a6aaa")}
          </mesh>
          <Box p={[0, 0.5, 0]} a={[3, 0.4, 3]} c="#c4a56c" />
          <Box p={[0, 1.3, 0]} a={[1.6, 1.2, 1.4]} c="#e7d6b8" />
        </>
      ) : null}
      {k === "fire" ? (
        <>
          <Box p={[0, 1.4, 0]} a={[4, 2.8, 3]} c="#2a2424" />
          <Box p={[0.4, 1.2, 1.2]} a={[1.2, 0.2, 0.3]} c="#e07030" />
          <Box p={[-0.8, 2, 0.8]} a={[0.4, 0.2, 0.8]} c="#ffb060" />
        </>
      ) : null}
      {k === "snow" ? (
        <>
          <Box p={[0, 1, 0]} a={[2.4, 2, 2]} c="#d8e4ee" />
          <Box p={[0, 2.3, 0]} a={[2.6, 0.3, 2.2]} c="#8aa0b0" />
          <Box p={[2.4, 1.5, 0]} a={[0.3, 3, 0.3]} c="#6a5040" />
        </>
      ) : null}
      {k === "desert" ? (
        <>
          <mesh position={[0, 0.6, 0]} castShadow>
            <coneGeometry args={[3.2, 1.4, 5]} />
            {lamb("#e0c080")}
          </mesh>
          <Box p={[2, 1.6, 1]} a={[0.6, 3.2, 0.6]} c="#c4b090" />
        </>
      ) : null}
      {k === "machine" ? (
        <>
          <Box p={[0, 1.5, 0]} a={[3.4, 3, 2]} c="#6a6860" />
          <mesh position={[0, 2.2, 1.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.9, 0.9, 0.3, 8]} />
            {lamb("#a09060")}
          </mesh>
        </>
      ) : null}
      {k === "archery" ? (
        <>
          {[0, 1, 2].map((i) => (
            <Box key={i} p={[i * 1.6 - 1.6, 1.2, -2 - i]} a={[0.8, 1.4, 0.15]} c={i === 1 ? "#c04040" : "#efe6d4"} />
          ))}
        </>
      ) : null}
      {k === "animals" ? (
        <>
          <Box p={[-1, 0.4, 0]} a={[0.7, 0.5, 1]} c="#f0f0f0" />
          <Box p={[1.2, 0.7, 0.6]} a={[0.5, 0.8, 1.1]} c="#8a5a30" />
          <Box p={[0, 0.35, -1.4]} a={[0.4, 0.35, 0.6]} c="#c4a060" />
        </>
      ) : null}
      {k === "rail" ? (
        <>
          <Box p={[0, 0.08, 0]} a={[1.2, 0.12, 8]} c="#5a4030" />
          <Box p={[0, 0.4, 1]} a={[1, 0.5, 1.4]} c="#6a5340" />
        </>
      ) : null}
      {k === "tree" ? (
        <>
          <Box p={[0, 4, 0]} a={[2.2, 8, 2.2]} c="#5a4030" />
          <mesh position={[0, 8.5, 0]} castShadow>
            <sphereGeometry args={[3.2, 8, 6]} />
            {lamb("#1f6a34")}
          </mesh>
        </>
      ) : null}
      {k === "map" ? <Box p={[0, 0.8, 0]} a={[2.2, 1.2, 1.2]} c="#d8d0c0" /> : null}
      {k === "optional" ? (
        <>
          <Box p={[0, 0.5, 0]} a={[1.6, 1, 1.6]} c="#8a8478" />
          <Box p={[0, 0.4, 0]} a={[0.7, 0.5, 0.7]} c="#1a1814" />
        </>
      ) : null}
      {k === "sky" ? (
        <>
          <Box p={[0, 18, 0]} a={[8, 0.4, 6]} c="#e8eef8" />
          <Box p={[3, 19.2, 1]} a={[1.2, 2, 1.2]} c="#d8d0c4" />
          <Box p={[-2, 18.4, -1]} a={[1, 0.6, 1]} c="#8aa0b0" />
        </>
      ) : null}
      {k === "escape" ? (
        <>
          <Box p={[0, 0.3, 0]} a={[2, 0.2, 8]} c="#6a5340" />
          <Box p={[0, 1.2, -3]} a={[2.4, 2, 0.3]} c="#5a4030" />
        </>
      ) : null}
      <Box p={[2.4, 0.35, 0]} a={[0.7, 0.7, 0.7]} c="#e8d48a" />
    </group>
  );
}

function Beast() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.35;
  });
  return (
    <group ref={ref} position={[6, 0, 2]}>
      <Box p={[0, 2.2, 0]} a={[2.4, 1.8, 4.2]} c="#4a6a40" />
      <Box p={[0, 3.2, -2.2]} a={[1.2, 1.1, 1.6]} c="#3a5a32" />
      <Box p={[0, 3.4, -3]} a={[0.5, 0.35, 0.6]} c="#2a4028" />
      <Box p={[0, 2.4, 2.4]} a={[0.4, 0.4, 1.4]} c="#3a5a32" />
      {[-0.7, 0.7].map((x) =>
        [-1.2, 1.2].map((z) => <Box key={`${x}${z}`} p={[x, 0.8, z]} a={[0.35, 1.6, 0.35]} c="#3a4a30" />),
      )}
    </group>
  );
}

function Wagon() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const p = merchantPos();
    if (!ref.current) return;
    ref.current.position.set(p.x, heightAt(p.x, p.z), p.z);
  });
  return (
    <group ref={ref}>
      <Box p={[0, 0.7, 0]} a={[1.6, 1, 2.4]} c="#6a4030" />
      <Box p={[0, 1.5, -0.2]} a={[1.7, 0.7, 1.6]} c="#8a3030" />
      <Box p={[0.7, 1.15, 0.9]} a={[0.4, 0.7, 0.35]} c="#e0b090" />
      <Box p={[0.7, 1.55, 0.9]} a={[0.35, 0.3, 0.3]} c="#5a3a22" />
    </group>
  );
}

export function GreatRegions() {
  const [near, setNear] = useState<Kind[]>([]);
  const deckOwn = useRef(false);
  useFrame((_, dt) => {
    const ids = SITES.filter((s) => Math.hypot(live.x - s.x, live.z - s.z) < 120).map((s) => s.id);
    setNear((prev) => (prev.join() === ids.join() ? prev : ids));
    for (const s of SITES) {
      if (Math.hypot(live.x - s.x, live.z - s.z) < 16) markSeen(s);
    }
    const tree = site("tree");
    const sky = site("sky");
    const onSky = Math.hypot(live.x - sky.x, live.z - sky.z) < 10 && (live.deck?.y ?? 0) > fieldHeight(sky.x, sky.z) + 8;
    const onTree = Math.hypot(live.x - tree.x, live.z - tree.z) < 3.2 && mapCount() >= 3;
    if (onSky) {
      live.deck = { x: sky.x, z: sky.z, y: fieldHeight(sky.x, sky.z) + 18, r: 10 };
      deckOwn.current = true;
    } else if (onTree) {
      live.deck = { x: tree.x, z: tree.z + 1, y: fieldHeight(tree.x, tree.z) + 6, r: 2.4 };
      deckOwn.current = true;
    } else if (deckOwn.current) {
      live.deck = null;
      deckOwn.current = false;
    }
    if (site("math")) {
      const m = site("math");
      const stones = [-1.4, 0, 1.4];
      let on = -1;
      for (let i = 0; i < 3; i++) {
        if (Math.hypot(live.x - (m.x + stones[i]!), live.z - (m.z + 1.6)) < 0.7) on = i;
      }
      if (on !== mathStep.on) {
        mathStep.on = on;
        if (on >= 0) {
          if (on === mathStep.n) mathStep.n += 1;
          else mathStep.n = on === 0 ? 1 : 0;
          live.banner = mathStep.n >= 3 ? "The hall heard you." : "Keep the count.";
        }
      }
    }
    if (escape.on) {
      escape.t -= dt;
      const far = Math.hypot(live.x - escape.x, live.z - escape.z);
      if (far > 16) {
        escape.on = false;
        useGame.getState().addCoins(18);
        live.banner = "You got off the bridge.";
        sfx.chime();
      } else if (escape.t <= 0) {
        escape.on = false;
        useGame.getState().setQuest("got-escape", 0);
        live.banner = "The bridge went. Try the far end again.";
      }
    }
  });
  return (
    <group>
      {near.map((id) => (
        <SiteView key={id} s={site(id)} />
      ))}
      <Wagon />
      <group position={[6, heightAt(6, KEEP_Z - 52), KEEP_Z - 52]}>
        <Box p={[0, 1.1, 0]} a={[0.12, 2.2, 1.3]} c="#efe6d4" />
      </group>
    </group>
  );
}
