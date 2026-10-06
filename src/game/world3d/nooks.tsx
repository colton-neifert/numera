import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { sampleH } from "./lush/grid";
import { live } from "./live";
import { lamb } from "./mats";
import { sfx } from "../audio";
import { useGame } from "../store";
import { playerMaxHp } from "../content";
import { revealItem } from "../items";
import { consumeTalk } from "../input";

/**
 * Small things in the walkable world. Most are easy to pass.
 * A few only make sense after another find.
 */
type How = "bomb" | "talk" | "fire" | "ice" | "knife" | "night";
type Shape =
  | "tree"
  | "stump"
  | "crack"
  | "rock"
  | "chest"
  | "pot"
  | "sign"
  | "bell"
  | "grave"
  | "leaf"
  | "shroom"
  | "flower"
  | "dirt"
  | "vine"
  | "fence"
  | "tile"
  | "bush"
  | "figure"
  | "ice";
type Pay = "coins" | "heal" | "piece" | "sling" | "arrows" | "key" | "warp" | "note" | "coin" | "bombs";

type Nook = {
  id: string;
  x: number;
  z: number;
  how: How;
  shape: Shape;
  hint: string;
  line: string;
  pay: Pay;
  n?: number;
  wx?: number;
  wz?: number;
  needs?: string;
  locked?: string;
  showAfter?: string;
  hole?: boolean;
};

const Q = (id: string) => `nk:${id}`;

const NOOKS: Nook[] = [
  { id: "pale-tree", x: -18, z: -138, how: "bomb", shape: "tree", hint: "The bark is the wrong color.", line: "The pale tree falls in. A hole is under it.", pay: "note", hole: true },
  { id: "pale-chest", x: -18, z: -151, how: "talk", shape: "chest", hint: "A chest, under the tree.", line: "A sling. It was waiting down here.", pay: "sling", showAfter: "pale-tree" },
  { id: "rust-stump", x: -46, z: -128, how: "bomb", shape: "stump", hint: "A crack runs around the stump.", line: "Inside the wood: a rusty key.", pay: "key" },
  { id: "locked-box", x: 18, z: -122, how: "talk", shape: "chest", hint: "A small lock. It smells like cut wood.", line: "The rusty key fits. A new heart.", pay: "piece", needs: Q("rust-stump"), locked: "Locked. It smells like a stump." },
  { id: "mailbox", x: 10, z: -96, how: "talk", shape: "sign", hint: "A mailbox that is not yours.", line: "The note says: south of town, the pale tree is not quite a tree.", pay: "note" },
  { id: "pot", x: 48, z: -94, how: "talk", shape: "pot", hint: "A pot behind the house.", line: "Empty. Someone already ate.", pay: "note" },
  { id: "crate", x: 40, z: -52, how: "talk", shape: "pot", hint: "A crate with a loose lid.", line: "Six coins under a turnip.", pay: "coins", n: 6 },
  { id: "crack-wall", x: -32, z: -104, how: "bomb", shape: "crack", hint: "A crack, no wider than a finger.", line: "The crack was a door. Coins in the dust.", pay: "coins", n: 14 },
  { id: "wrong-sign", x: 6, z: -124, how: "talk", shape: "sign", hint: "The sign faces the wrong way.", line: "The back says: you are reading the back.", pay: "note" },
  { id: "lunch-bell", x: 2, z: -100, how: "talk", shape: "bell", hint: "A little bell.", line: "You are early for lunch.", pay: "note" },
  { id: "night-grave", x: -20, z: -122, how: "night", shape: "grave", hint: "The letters are faint.", line: "You can read it now. Your health fills.", pay: "heal" },
  { id: "day-grave", x: 48, z: -118, how: "talk", shape: "grave", hint: "A stone with one word.", line: "The word is: later.", pay: "note" },
  { id: "frost-latch", x: -24, z: -58, how: "fire", shape: "ice", hint: "Ice on a latch.", line: "The latch lets go. Ten coins.", pay: "coins", n: 10 },
  { id: "warm-puddle", x: 24, z: -132, how: "ice", shape: "dirt", hint: "A puddle that will not hold you.", line: "The cold holds. Coins under the ice.", pay: "coins", n: 8 },
  { id: "bottle", x: -10, z: -72, how: "knife", shape: "pot", hint: "A bottle on a post. Too fiddly for a sword.", line: "The bottle breaks. One coin, and a wet boot.", pay: "coin" },
  { id: "leaf-pile", x: 30, z: -116, how: "talk", shape: "leaf", hint: "A pile of leaves where nothing grows.", line: "You kick them. Three coins and a button that does nothing.", pay: "coin", n: 3 },
  { id: "hollow", x: -52, z: -148, how: "talk", shape: "tree", hint: "This trunk sounds empty.", line: "You reach in. Your health fills.", pay: "heal" },
  { id: "root-gap", x: -34, z: -170, how: "talk", shape: "fence", hint: "A gap under the root. Cold air.", line: "You come out by the water.", pay: "warp", wx: -98, wz: -166 },
  { id: "loose-dirt", x: 4, z: -80, how: "talk", shape: "dirt", hint: "The dirt here is loose.", line: "A rusty spoon. And two coins.", pay: "coins", n: 2 },
  { id: "chicken", x: 22, z: -98, how: "talk", shape: "pot", hint: "A bucket. Something is in it.", line: "A chicken. It stares. You leave it.", pay: "note" },
  { id: "white-flower", x: -8, z: -58, how: "talk", shape: "flower", hint: "One white flower, and a warm rock.", line: "Further west, a cracked rock likes a loud answer.", pay: "note" },
  { id: "embarrassed", x: -50, z: -64, how: "talk", shape: "chest", hint: "A tiny chest in the grass.", line: "One coin. The chest looks embarrassed.", pay: "coin" },
  { id: "three-stones", x: 36, z: -108, how: "talk", shape: "rock", hint: "Three stones. The middle one sits wrong.", line: "It clicks. Seven coins underneath.", pay: "coins", n: 7 },
  { id: "side-boulder", x: -14, z: -50, how: "bomb", shape: "rock", hint: "This boulder has a pale seam.", line: "The seam was the whole trick.", pay: "coins", n: 18 },
  { id: "dry-vines", x: -62, z: -146, how: "fire", shape: "vine", hint: "Dry vines. They would catch.", line: "The vines go up. A purse was tied in them.", pay: "coins", n: 12 },
  { id: "ice-cake", x: -84, z: -44, how: "ice", shape: "ice", hint: "A glint inside the ice.", line: "You crack a window in the ice. Coins.", pay: "coins", n: 16 },
  { id: "pond-shelf", x: -96, z: -166, how: "talk", shape: "rock", hint: "A dry shelf behind the splash.", line: "Five coins, still dry.", pay: "coins", n: 5 },
  { id: "hat", x: -2, z: -114, how: "talk", shape: "leaf", hint: "A hat in the grass.", line: "You do not take it.", pay: "note" },
  { id: "chair-boards", x: -8, z: -90, how: "talk", shape: "tile", hint: "A board that springs.", line: "Under it: one chair, and nothing else.", pay: "note" },
  { id: "night-coat", x: -30, z: -74, how: "night", shape: "figure", hint: "Someone is standing where nobody stands.", line: "They whisper: the pale one, south. Bring something that breaks. Then they are gone.", pay: "note" },
  { id: "shroom", x: -6, z: -154, how: "talk", shape: "shroom", hint: "Three mushrooms in a row.", line: "The middle one is soft. It is not a door. It is just soft.", pay: "note" },
  { id: "fence-coin", x: -42, z: -96, how: "talk", shape: "fence", hint: "A gap behind the fence slat.", line: "Your hand fits. Four coins.", pay: "coins", n: 4 },
  { id: "rubble", x: -78, z: -128, how: "bomb", shape: "rock", hint: "Rubble stacked too neatly.", line: "Under the stack: a handful of arrows.", pay: "arrows", n: 8 },
  { id: "bush-button", x: 16, z: -108, how: "talk", shape: "bush", hint: "The bush is rounder than the others.", line: "A button. It pays you nine coins and then sticks.", pay: "coins", n: 9 },
  { id: "spoon", x: -16, z: -86, how: "talk", shape: "dirt", hint: "A patch of dirt by the path.", line: "Two coins and a spoon that is not yours.", pay: "coins", n: 2 },
];

function got(id: string) {
  return (useGame.getState().quests?.[id] ?? 0) > 0;
}

type Box = { x: number; z: number; hx: number; hz: number };

function pushOut(nx: number, nz: number, b: Box) {
  const dx = nx - b.x;
  const dz = nz - b.z;
  const hx = b.hx + 0.42;
  const hz = b.hz + 0.42;
  if (Math.abs(dx) >= hx || Math.abs(dz) >= hz) return null;
  if (hx - Math.abs(dx) < hz - Math.abs(dz)) return { x: b.x + Math.sign(dx || 1) * hx, z: nz };
  return { x: nx, z: b.z + Math.sign(dz || 1) * hz };
}

export function collideNooks(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house) return null;
  const walls: Box[] = [];
  const tree = NOOKS[0]!;
  const boulder = NOOKS.find((n) => n.id === "side-boulder")!;
  const stump = NOOKS.find((n) => n.id === "rust-stump")!;
  if (!got(Q("pale-tree"))) walls.push({ x: tree.x, z: tree.z, hx: 0.7, hz: 0.7 });
  else {
    walls.push({ x: -21.4, z: -148, hx: 0.4, hz: 7 });
    walls.push({ x: -14.6, z: -148, hx: 0.4, hz: 7 });
    walls.push({ x: -18, z: -155.2, hx: 3.6, hz: 0.4 });
  }
  if (!got(Q("side-boulder"))) walls.push({ x: boulder.x, z: boulder.z, hx: 0.9, hz: 0.9 });
  if (!got(Q("rust-stump"))) walls.push({ x: stump.x, z: stump.z, hx: 0.45, hz: 0.45 });
  let x = nx;
  let z = nz;
  let hit = false;
  for (const b of walls) {
    const p = pushOut(x, z, b);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

function pay(n: Nook) {
  const g = useGame.getState();
  if (n.pay === "coins" || n.pay === "coin") {
    const c = g.addCoins(n.n ?? (n.pay === "coin" ? 1 : 5));
    if (c > 0) revealItem("coin");
    sfx.purse();
  } else if (n.pay === "heal") {
    const max = playerMaxHp(g.xp, g.outfit, g.heartsExtra ?? 0);
    useGame.setState({ hp: max });
    sfx.heart();
  } else if (n.pay === "piece") {
    if (g.grantHeartContainer(Q(n.id))) {
      revealItem("container", true);
      sfx.heart();
    } else {
      g.addCoins(25);
      sfx.chest();
    }
  } else if (n.pay === "sling") {
    if (!g.hasSling) {
      g.grantSling();
      revealItem("sling", true);
      sfx.chestRare();
    } else {
      g.addCoins(40);
      revealItem("coin");
      sfx.chest();
      live.listen = "Rupees. You already carry a sling.";
      return;
    }
  } else if (n.pay === "arrows") {
    const gotN = g.addArrows(n.n ?? 5);
    sfx.chest();
    if (!gotN) g.addCoins(8);
  } else if (n.pay === "key") {
    sfx.secret();
  } else if (n.pay === "warp") {
    live.x = n.wx ?? live.x;
    live.z = n.wz ?? live.z;
    live.vx = 0;
    live.vz = 0;
    sfx.secret();
  } else if (n.pay === "bombs") {
    if (g.hasBombs) useGame.setState({ bombs: Math.min(g.bombsMax ?? 20, (g.bombs ?? 0) + 3) });
    else g.addCoins(8);
    sfx.chest();
  } else {
    sfx.chime();
  }
  if (n.hole) sfx.secret();
  live.listen = n.line;
}

function handsFree() {
  return !live.nearNpc && !live.nearHouse && !live.nearChest && !live.talking && !live.doorMath && !live.listen;
}

function triggered(n: Nook) {
  const d = Math.hypot(live.x - n.x, live.z - n.z);
  if (n.how === "bomb") return !!live.blast && Math.hypot(live.blast.x - n.x, live.blast.z - n.z) < 2.55;
  if (n.how === "fire") return live.blade === "fire" && !!live.slash && Math.hypot(live.slash.x - n.x, live.slash.z - n.z) < 2.5;
  if (n.how === "ice") return live.blade === "ice" && !!live.slash && Math.hypot(live.slash.x - n.x, live.slash.z - n.z) < 2.5;
  if (n.how === "knife") return live.arrows.some((a) => a.kind === "knife" && Math.hypot(a.x - n.x, a.z - n.z) < 1.35);
  if (n.how === "night") return live.night && d < 1.6 && handsFree() && consumeTalk();
  return d < 1.55 && handsFree() && consumeTalk();
}

function Mark({ n }: { n: Nook }) {
  const y = sampleH(n.x, n.z);
  const c = n.how === "bomb" ? "#8a7568" : "#6d8a55";
  return (
    <group position={[n.x, y, n.z]}>
      {n.shape === "tree" ? (
        <group>
          <mesh position={[0.15, 1.3, 0]} rotation={[0, 0, 0.18]} castShadow>
            <cylinderGeometry args={[0.22, 0.34, 2.5, 6]} />
            {lamb(n.id === "pale-tree" ? "#d9d3c4" : "#6b4a32")}
          </mesh>
          <mesh position={[0.35, 2.5, 0]}>
            <sphereGeometry args={[0.85, 7, 6]} />
            {lamb(n.id === "pale-tree" ? "#c5d6a4" : "#3f7a3a")}
          </mesh>
        </group>
      ) : null}
      {n.shape === "stump" ? (
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.48, 0.55, 7]} />
          {lamb("#7a5a3c")}
        </mesh>
      ) : null}
      {n.shape === "rock" || n.shape === "crack" ? (
        <mesh position={[0, 0.35, 0]} castShadow>
          <dodecahedronGeometry args={[n.shape === "crack" ? 0.45 : 0.7, 0]} />
          {lamb(c)}
        </mesh>
      ) : null}
      {n.shape === "chest" || n.shape === "ice" ? (
        <mesh position={[0, 0.28, 0]} castShadow>
          <boxGeometry args={[0.62, 0.4, 0.42]} />
          {lamb(n.shape === "ice" ? "#d5f2ff" : "#c9a24a")}
        </mesh>
      ) : null}
      {n.shape === "pot" ? (
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.18, 0.22, 0.36, 7]} />
          {lamb("#a3533a")}
        </mesh>
      ) : null}
      {n.shape === "sign" ? (
        <group>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[0.08, 1.3, 0.08]} />
            {lamb("#6b4a32")}
          </mesh>
          <mesh position={[0, 1.25, 0]}>
            <boxGeometry args={[0.7, 0.4, 0.06]} />
            {lamb("#e6d3a1")}
          </mesh>
        </group>
      ) : null}
      {n.shape === "bell" ? (
        <group>
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[0.08, 1.4, 0.08]} />
            {lamb("#5c4636")}
          </mesh>
          <mesh position={[0, 1.7, 0]}>
            <sphereGeometry args={[0.16, 7, 6]} />
            {lamb("#e0b030")}
          </mesh>
        </group>
      ) : null}
      {n.shape === "grave" ? (
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.55, 0.7, 0.12]} />
          {lamb("#9aa3a8")}
        </mesh>
      ) : null}
      {n.shape === "leaf" || n.shape === "dirt" || n.shape === "tile" ? (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.55, 8]} />
          {lamb(n.shape === "leaf" ? "#6a7a32" : n.shape === "tile" ? "#b7a48a" : "#8a6240")}
        </mesh>
      ) : null}
      {n.shape === "shroom" ? (
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.22, 7, 5]} />
          {lamb("#c45050")}
        </mesh>
      ) : null}
      {n.shape === "flower" ? (
        <mesh position={[0, 0.25, 0]}>
          <sphereGeometry args={[0.12, 6, 5]} />
          {lamb("#f4f4f0")}
        </mesh>
      ) : null}
      {n.shape === "vine" || n.shape === "bush" ? (
        <mesh position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.45, 7, 6]} />
          {lamb("#2f6a32")}
        </mesh>
      ) : null}
      {n.shape === "fence" ? (
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.9, 0.7, 0.08]} />
          {lamb("#8b6914")}
        </mesh>
      ) : null}
      {n.shape === "figure" ? (
        <group>
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[0.4, 1.1, 0.28]} />
            {lamb("#3a3e55")}
          </mesh>
          <mesh position={[0, 1.55, 0]}>
            <boxGeometry args={[0.28, 0.28, 0.28]} />
            {lamb("#e6c2a0")}
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

export function Nooks() {
  const [, bump] = useState(0);
  const nightWas = useRef(live.night);
  useFrame(() => {
    if (nightWas.current !== live.night) {
      nightWas.current = live.night;
      bump((v) => v + 1);
    }
    const px = live.x;
    const pz = live.z;
    let hinted = false;
    for (const n of NOOKS) {
      if (n.showAfter && !got(Q(n.showAfter))) continue;
      const id = Q(n.id);
      const d = Math.hypot(px - n.x, pz - n.z);
      if (d > 40) continue;
      if (n.id === "lunch-bell" && got(id) && d < 1.5 && handsFree() && consumeTalk()) {
        sfx.chime();
        live.listen = "You already rang it.";
        continue;
      }
      if (got(id)) continue;
      if (n.how === "night" && !live.night) {
        if (d < 1.7 && !live.listen && !live.talking) live.hint = "Nothing here until dark.";
        continue;
      }
      if (!hinted && d < 1.35 && !live.listen && !live.talking && !live.hint) {
        live.hint = n.hint;
        hinted = true;
      }
      if (!triggered(n)) continue;
      if (n.needs && !got(n.needs)) {
        live.listen = n.locked ?? "Not yet.";
        continue;
      }
      useGame.getState().setQuest(id, 1);
      pay(n);
      bump((v) => v + 1);
      break;
    }
  });

  const openHole = got(Q("pale-tree"));
  return (
    <group>
      {NOOKS.map((n) => {
        if (n.showAfter && !got(Q(n.showAfter))) return null;
        if (got(Q(n.id)) && n.how !== "talk" && n.shape !== "sign" && n.shape !== "bell" && n.shape !== "grave") return null;
        if (got(Q(n.id)) && (n.how === "bomb" || n.how === "fire" || n.how === "ice" || n.how === "knife")) return null;
        if (n.shape === "figure" && !live.night) return null;
        if (n.id === "pale-chest") return null;
        return <Mark key={n.id} n={n} />;
      })}
      {openHole ? (
        <group>
          <mesh position={[-18, sampleH(-18, -146) + 0.02, -146]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.1, 8]} />
            {lamb("#1c1816")}
          </mesh>
          <mesh position={[-21.4, sampleH(-21.4, -148) + 1.1, -148]}>
            <boxGeometry args={[0.5, 2.2, 14]} />
            {lamb("#5c5148")}
          </mesh>
          <mesh position={[-14.6, sampleH(-14.6, -148) + 1.1, -148]}>
            <boxGeometry args={[0.5, 2.2, 14]} />
            {lamb("#5c5148")}
          </mesh>
          <mesh position={[-18, sampleH(-18, -155) + 1.1, -155.2]}>
            <boxGeometry args={[7.2, 2.2, 0.5]} />
            {lamb("#5c5148")}
          </mesh>
          {!got(Q("pale-chest")) ? <Mark n={NOOKS[1]!} /> : null}
        </group>
      ) : null}
    </group>
  );
}
