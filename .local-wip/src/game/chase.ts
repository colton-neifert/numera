import { live } from "./world3d/live";
import { VX, VZ, WELL_AT, POND, MILL_AT, LOOK_AT, ZIP_LAND } from "./world3d/field";
import { useGame } from "./store";
import { revealItem } from "./items";
import { sfx } from "./audio";
import { takeCipher } from "./cipher";

const FIRE = { x: VX, z: VZ + 8 };
const FOUNTAIN = { x: VX + 2, z: VZ - 18 };
const WAGON = { x: VX + 16, z: VZ - 6 };
const FARM = { x: 50, z: -98 };
const SMITH = { x: 40, z: -52 };
const HAY = { x: VX - 16, z: VZ + 18 };
const BRIDGE = { x: POND.x + 18, z: POND.z + 14 };
/** Pole by the pit — the last green leaf hangs here until something takes it. */
const POLE = { x: FIRE.x + 1.85, z: FIRE.z + 1.55 };

export type ChasePhase = "off" | "steal" | "run" | "lost" | "hide" | "caught";

export type ChaseNode = {
  id: string;
  x: number;
  z: number;
  jump?: boolean;
  bridge?: boolean;
  hide?: "hay" | "mill" | "look" | "wagon";
  say: string;
  clue: string;
};

/** A loop through the real vale — square, farm, forge, meadow, lookout, creek, pond, mill, hay. */
export const CHASE_ROUTE: ChaseNode[] = [
  { id: "square", x: POLE.x, z: POLE.z, say: "Tess: THE LEAF!! It took the last green one!!", clue: "A torn green scrap by the fire." },
  { id: "wagon", x: WAGON.x - 1.2, z: WAGON.z + 2.4, say: "It knocked the wagon. East!!", clue: "Wagon tracks gouged the dirt east." },
  { id: "farm", x: FARM.x - 2.4, z: FARM.z + 1.2, jump: true, say: "Over the crates!! The farm!!", clue: "Crates stacked like a wall. A gap in the middle." },
  { id: "smith", x: SMITH.x - 1.6, z: SMITH.z + 6.4, say: "Flint: North of the anvil. I SAW the green.", clue: "A scorch of green on the forge dirt." },
  { id: "zip", x: ZIP_LAND.x - 2, z: ZIP_LAND.z - 4, say: "The north meadow. Dust on the zip grass.", clue: "The zip landing is scuffed. Something landed running." },
  { id: "look", x: LOOK_AT.x + 4.2, z: LOOK_AT.z - 2.8, hide: "look", say: "The lookout hill. It went over the top.", clue: "Green caught on the lookout grass." },
  { id: "bridge", x: BRIDGE.x, z: BRIDGE.z, bridge: true, say: "Wet prints on the planks. West, the pond.", clue: "The planks are wet. Something did not like the water." },
  { id: "pond", x: POND.x + 6.2, z: POND.z + 3.4, say: "Finn: It ran the dock!! Green in its teeth!!", clue: "A wet leaf on the dock boards." },
  { id: "fountain", x: FOUNTAIN.x - 2.4, z: FOUNTAIN.z + 1.2, say: "Back through town. The fountain!!", clue: "Mud around the fountain. Heading for the mill." },
  { id: "mill", x: MILL_AT.x + 2.2, z: MILL_AT.z + 2.8, hide: "mill", say: "Grain in the air. The mill.", clue: "Grain bags torn. A green thread." },
  { id: "well", x: WELL_AT.x + 2.4, z: WELL_AT.z + 1.6, say: "Past the well. The hay!!", clue: "The well rope is swinging." },
  { id: "hay", x: HAY.x, z: HAY.z, hide: "hay", say: "The hay is breathing.", clue: "Hay with a hole chewed in it." },
];

export const CHASE_HIDES: { id: "hay" | "mill" | "look" | "wagon"; x: number; z: number; look: string }[] = [
  { id: "hay", x: HAY.x, z: HAY.z, look: "The hay is too still." },
  { id: "mill", x: MILL_AT.x + 1.4, z: MILL_AT.z + 1.2, look: "A grain bag is the wrong shape." },
  { id: "look", x: LOOK_AT.x + 3.2, z: LOOK_AT.z - 1.6, look: "A bush on the hill is wearing teeth." },
  { id: "wagon", x: WAGON.x, z: WAGON.z - 1.4, look: "Something is under the wagon." },
];

export type ChaseSnap = {
  phase: ChasePhase;
  i: number;
  x: number;
  z: number;
  yaw: number;
  hide: "hay" | "mill" | "look" | "wagon" | null;
  stealT: number;
  lostT: number;
  seen: boolean;
  scraps: { x: number; z: number; id: string }[];
};

export const chase: ChaseSnap = {
  phase: "off",
  i: 0,
  x: POLE.x,
  z: POLE.z,
  yaw: 0,
  hide: null,
  stealT: 0,
  lostT: 0,
  seen: false,
  scraps: [],
};

export function chaseOn() {
  return chase.phase === "steal" || chase.phase === "run" || chase.phase === "lost" || chase.phase === "hide";
}

export function chaseDone() {
  return (useGame.getState().quests?.chase ?? 0) >= 2;
}

export function chaseReady() {
  if (chaseDone() || chase.phase !== "off") return false;
  const g = useGame.getState();
  if (!g.hasSword) return false;
  if ((g.quests?.lefthome ?? 0) < 1) return false;
  if (live.house || live.dungeon || live.cave || live.below || live.talking || live.festAct) return false;
  const places = g.placesSeen ?? [];
  if (!places.includes("oakstead") && Math.hypot(live.x - FIRE.x, live.z - FIRE.z) > 22) return false;
  return Math.hypot(live.x - POLE.x, live.z - POLE.z) < 5.8;
}

export function beginChase(force = false) {
  if (!force && (chaseDone() || chase.phase !== "off")) return false;
  const n = CHASE_ROUTE[0]!;
  chase.phase = "steal";
  chase.i = 0;
  chase.x = n.x;
  chase.z = n.z;
  chase.yaw = 0.2;
  chase.hide = null;
  chase.stealT = 1.7;
  chase.lostT = 0;
  chase.seen = false;
  chase.scraps = [];
  dropScrap("square", n.x, n.z);
  live.chaseOn = true;
  live.banner = "The Last Leaf";
  live.bannerSub = "Something green ran.";
  live.listen = n.say;
  sfx.yelp();
  useGame.getState().setQuest("chase", 1);
  return true;
}

export function endChase(caught: boolean) {
  if (chase.phase === "caught") return;
  live.chaseOn = false;
  live.aggroIds.delete("leafthief");
  delete live.foeTrack.leafthief;
  if (!caught) {
    chase.phase = "off";
    return;
  }
  chase.phase = "caught";
  const g = useGame.getState();
  g.setQuest("chase", 2);
  g.setQuest("stolenleaf", 1);
  const n = g.addCoins(25);
  if (n > 0) revealItem("coin");
  takeCipher("chase-leaf", false);
  live.getItem = "stolenleaf";
  live.getTitle = "You got the Last Leaf!";
  live.getBlurb = "Green. Still warm. Mira would want this back.";
  revealItem("stolenleaf", true);
  live.listen = "It dropped the leaf. It looked at you like you had counted wrong.";
}

export function returnLeaf(): boolean {
  const g = useGame.getState();
  if ((g.quests?.stolenleaf ?? 0) < 1) return false;
  if ((g.quests?.chaseLeaf ?? 0) >= 1) return false;
  g.setQuest("chaseLeaf", 1);
  if (g.grantHeartContainer("chase-leaf")) {
    live.getItem = "container";
    live.getTitle = "You got a Heart Container!";
    live.getBlurb = "Mira took the leaf. The oak can keep counting. Your life grew.";
    revealItem("container", true);
  }
  sfx.ok();
  return true;
}

export function dropScrap(id: string, x: number, z: number) {
  if (chase.scraps.some((s) => s.id === id)) return;
  chase.scraps.push({ id, x, z });
}

export function nearestHide(x: number, z: number) {
  let best = CHASE_HIDES[0]!;
  let d = 99;
  for (const h of CHASE_HIDES) {
    const n = Math.hypot(x - h.x, z - h.z);
    if (n < d) {
      d = n;
      best = h;
    }
  }
  return { hide: best, d };
}

/** Route length vs a north cut from the square to the zip meadow. */
export function chaseRouteLen() {
  let n = 0;
  for (let i = 1; i < CHASE_ROUTE.length; i++) {
    const a = CHASE_ROUTE[i - 1]!;
    const b = CHASE_ROUTE[i]!;
    n += Math.hypot(b.x - a.x, b.z - a.z);
  }
  return n;
}

export function chaseShortcutLen() {
  const zip = CHASE_ROUTE.find((n) => n.id === "zip")!;
  return Math.hypot(zip.x - FIRE.x, zip.z - FIRE.z);
}

export function chaseTalk(who: string, name: string): string | null {
  if (chaseDone() && (useGame.getState().quests?.chaseLeaf ?? 0) < 1) {
    if (who === "Mira") return null;
    if (who === "Fern") return "You caught it. The leaf is not a notice. Take it to Mira.";
    if (who === "Tess") return "YOU GOT IT!! Give it back!! It is the LAST one!!";
  }
  if (chaseDone()) {
    if (who === "Mira") return "The leaf is home. The oak can keep counting.";
    return null;
  }
  if (!chaseOn()) return null;
  const bits: Record<string, string> = {
    Tess: chase.phase === "hide" || chase.phase === "lost" ? "I lost it!! Hay? Mill? The hill?? LOOK!!" : "RUN!! It has the LEAF in its TEETH!!",
    Fern: chase.phase === "hide" || chase.phase === "lost" ? "I will not pin a thief I cannot see. Check the hay. The mill. The lookout bush." : `${name}. North, then the farm, then it was a blur. I hate blurs.`,
    Cole: "I am sitting. That is not the same as helping. It went east.",
    Flint: "Forge road. Then the north grass. I do not chase leaves. I chase iron.",
    Holt: "It packed nothing. It just ran. East rows, then north.",
    Finn: "If it hits the pond I will not fish it out. I will point. That is my help.",
    Mira: "That was the last green one. Bring it. I will come down when you have it.",
    Ash: "Don’t swing wild in town. Catch it when it slows. It will slow.",
    Bramble: "The crates are a wall unless you jump the middle.",
    Tallow: "I saw green!! Then I saw dust!! Then I saw NOTHING!!",
    Wren: "Wipe your feet AFTER. Run NOW.",
  };
  return bits[who] ?? null;
}

export function stepChase(dt: number) {
  if (chase.phase === "off" || chase.phase === "caught") {
    live.chaseOn = false;
    return;
  }
  if (live.house || live.dungeon) return;

  if (chase.phase === "steal") {
    chase.stealT -= dt;
    live.listen = live.listen || "A gray thing. A green leaf. Then it ran.";
    if (chase.stealT <= 0) {
      chase.phase = "run";
      chase.i = 1;
      sfx.bark();
    }
    live.foeTrack.leafthief = { x: chase.x, z: chase.z };
    live.aggroIds.add("leafthief");
    live.chaseOn = true;
    return;
  }

  const dPlayer = Math.hypot(live.x - chase.x, live.z - chase.z);

  if (chase.phase === "run") {
    const node = CHASE_ROUTE[chase.i] ?? CHASE_ROUTE[CHASE_ROUTE.length - 1]!;
    const dx = node.x - chase.x;
    const dz = node.z - chase.z;
    const d = Math.hypot(dx, dz) || 1;
    const panic = dPlayer < 9.5;
    const far = dPlayer > 34;
    const sp = panic ? 9.35 : far ? 8.6 : 7.85;
    chase.x += (dx / d) * sp * dt;
    chase.z += (dz / d) * sp * dt;
    chase.yaw = Math.atan2(-dx, -dz);
    if (d < 1.35) {
      dropScrap(node.id, node.x, node.z);
      if (node.say) live.listen = node.say;
      if (chase.i >= CHASE_ROUTE.length - 1) {
        if (dPlayer > 10) {
          enterLost(node.hide ?? "hay");
          return;
        }
      } else {
        if (node.hide && far) {
          enterLost(node.hide);
          return;
        }
        chase.i = Math.min(CHASE_ROUTE.length - 1, chase.i + 1);
      }
    }
    if (far) chase.lostT += dt;
    else chase.lostT = 0;
    if (chase.lostT > 5.5) {
      enterLost();
      return;
    }
    if (dPlayer < 22) chase.seen = true;
    live.foeTrack.leafthief = { x: chase.x, z: chase.z };
    live.aggroIds.add("leafthief");
    live.chaseOn = true;
    tryCatch(dPlayer);
    return;
  }

  if (chase.phase === "lost") {
    live.aggroIds.delete("leafthief");
    delete live.foeTrack.leafthief;
    const hid = CHASE_HIDES.find((h) => h.id === chase.hide) ?? CHASE_HIDES[0]!;
    chase.x = hid.x;
    chase.z = hid.z;
    chase.lostT += dt;
    if (chase.lostT > 2.2) {
      chase.phase = "hide";
      live.listen = live.listen || hid.look;
    }
    return;
  }

  if (chase.phase === "hide") {
    live.aggroIds.delete("leafthief");
    delete live.foeTrack.leafthief;
    const hid = CHASE_HIDES.find((h) => h.id === chase.hide) ?? CHASE_HIDES[0]!;
    chase.x = hid.x;
    chase.z = hid.z;
    const d = Math.hypot(live.x - hid.x, live.z - hid.z);
    if (d < 2.4) live.listen = live.listen || hid.look;
  }
}

function enterLost(id?: "hay" | "mill" | "look" | "wagon") {
  chase.phase = "lost";
  chase.lostT = 0;
  chase.hide = id ?? nearestHide(chase.x, chase.z).hide.id;
  const h = CHASE_HIDES.find((n) => n.id === chase.hide) ?? CHASE_HIDES[0]!;
  chase.x = h.x;
  chase.z = h.z;
  live.aggroIds.delete("leafthief");
  delete live.foeTrack.leafthief;
  live.listen = "Dust. Then nothing. Green scraps. Hay. Mill. The hill. The wagon.";
  live.bannerSub = "It went behind something.";
  sfx.hiss();
}

function tryCatch(dPlayer: number) {
  if (dPlayer > 1.62) return;
  const hit = Boolean(live.slash && Math.hypot(live.slash.x - chase.x, live.slash.z - chase.z) < (live.slash.r ?? 1.2) + 0.5);
  const tackle = live.sprinting && dPlayer < 1.35;
  if (hit || tackle) endChase(true);
}

export function chaseClueNear(x: number, z: number) {
  let best: { x: number; z: number; id: string; clue: string } | null = null;
  let d = 3.2;
  for (const s of chase.scraps) {
    const n = Math.hypot(x - s.x, z - s.z);
    if (n < d) {
      const node = CHASE_ROUTE.find((r) => r.id === s.id);
      d = n;
      best = { ...s, clue: node?.clue ?? "A scrap of green." };
    }
  }
  return best;
}

/** North cut from the fire to the zip grass — the clever intercept. */
export const CHASE_CUT = { x: ZIP_LAND.x, z: ZIP_LAND.z };

export { FIRE as CHASE_FIRE, BRIDGE as CHASE_BRIDGE, HAY as CHASE_HAY, FARM as CHASE_FARM, POLE as CHASE_POLE, SMITH as CHASE_SMITH, WAGON as CHASE_WAGON };
