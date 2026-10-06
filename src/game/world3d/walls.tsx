import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { sampleH } from "./lush/grid";
import { terraceLift } from "./terraces";
import { live } from "./live";
import { lamb } from "./mats";
import { sfx } from "../audio";
import { useGame } from "../store";
import { playerMaxHp } from "../content";
import { revealItem } from "../items";

export type Face = {
  id: string;
  x: number;
  z: number;
  along: "x" | "z";
  /** -1: climb from the lesser side. +1: climb from the greater side. */
  side: 1 | -1;
  half: number;
  h: number;
  vine: boolean;
  prize: "coins" | "heart" | "heal" | "arrows";
  n?: number;
  line: string;
};

/** Designed faces only. A plain cliff is not one of these. */
export const FACES: Face[] = [
  {
    id: "roof",
    x: 52,
    z: -62,
    along: "x",
    side: -1,
    half: 1.65,
    h: 3.2,
    vine: true,
    prize: "coins",
    n: 12,
    line: "A purse was sitting on the roof.",
  },
  {
    id: "alley",
    x: -36,
    z: -102,
    along: "x",
    side: -1,
    half: 1.35,
    h: 3.15,
    vine: true,
    prize: "coins",
    n: 6,
    line: "Six coins, tucked where the vines start.",
  },
  {
    id: "west",
    x: -108,
    z: -72,
    along: "z",
    side: 1,
    half: 2.05,
    h: 3.3,
    vine: false,
    prize: "heart",
    line: "A heart, on a ledge the road never shows you.",
  },
  {
    id: "woods",
    x: -70,
    z: -166,
    along: "x",
    side: 1,
    half: 1.85,
    h: 3.2,
    vine: true,
    prize: "heal",
    line: "Above the trees. Your health fills.",
  },
  {
    id: "ringvine",
    x: -98,
    z: 140,
    along: "z",
    side: 1,
    half: 2.2,
    h: 7.5,
    vine: true,
    prize: "coins",
    n: 15,
    line: "The vines were the only way up. The rest of the cliff is bare.",
  },
  {
    id: "rangevine",
    x: -108,
    z: 258,
    along: "x",
    side: -1,
    half: 2.4,
    h: 8,
    vine: true,
    prize: "coins",
    n: 20,
    line: "Only this patch of vines. The mountain does not offer another.",
  },
  {
    id: "gate",
    x: 32,
    z: 16,
    along: "z",
    side: -1,
    half: 1.75,
    h: 3.25,
    vine: false,
    prize: "arrows",
    n: 8,
    line: "Arrows, left on the cliff above the road.",
  },
];

export function wallBase(x: number, z: number) {
  return sampleH(x, z) + terraceLift(x, z);
}

function yawOf(f: Face) {
  if (f.along === "x") return f.side < 0 ? Math.PI : 0;
  return f.side < 0 ? -Math.PI / 2 : Math.PI / 2;
}

function pose(f: Face, u: number, h: number) {
  const y = wallBase(f.x, f.z) + h;
  if (f.along === "x") return { x: f.x + u, y, z: f.z + f.side * 0.46, yaw: yawOf(f) };
  return { x: f.x + f.side * 0.46, y, z: f.z + u, yaw: yawOf(f) };
}

function ledgeOf(f: Face) {
  if (f.along === "x") return { x: f.x, z: f.z - f.side * 1.05, hx: f.half * 0.82, hz: 0.95 };
  return { x: f.x - f.side * 1.05, z: f.z, hx: 0.95, hz: f.half * 0.82 };
}

export function ledgeLift(x: number, z: number) {
  let best = 0;
  for (const f of FACES) {
    const L = ledgeOf(f);
    if (Math.abs(x - L.x) > L.hx || Math.abs(z - L.z) > L.hz) continue;
    const top = wallBase(f.x, f.z) + f.h;
    best = Math.max(best, top - wallBase(x, z));
  }
  return best;
}

type Box = { x: number; z: number; hx: number; hz: number };

function pushOut(nx: number, nz: number, b: Box) {
  const dx = nx - b.x;
  const dz = nz - b.z;
  const hx = b.hx + 0.38;
  const hz = b.hz + 0.38;
  if (Math.abs(dx) >= hx || Math.abs(dz) >= hz) return null;
  if (hx - Math.abs(dx) < hz - Math.abs(dz)) return { x: b.x + Math.sign(dx || 1) * hx, z: nz };
  return { x: nx, z: b.z + Math.sign(dz || 1) * hz };
}

function wallBox(f: Face): Box {
  if (f.along === "x") return { x: f.x, z: f.z, hx: f.half, hz: 0.42 };
  return { x: f.x, z: f.z, hx: 0.42, hz: f.half };
}

export function collideWalls(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house || (live.climbing && live.climbing.startsWith("wall:"))) return null;
  if (live.y > wallBase(nx, nz) + 1.35) return null;
  let x = nx;
  let z = nz;
  let hit = false;
  for (const f of FACES) {
    const p = pushOut(x, z, wallBox(f));
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

export function grabWall() {
  if (live.climbing || live.climbCool > 0 || live.house || live.mounted || live.swim) return null;
  for (const f of FACES) {
    if (!f.vine) continue;
    const u = f.along === "x" ? live.x - f.x : live.z - f.z;
    if (Math.abs(u) > f.half - 0.15) continue;
    const perp = f.along === "x" ? live.z - f.z : live.x - f.x;
    const onSide = f.side < 0 ? perp < -0.12 && perp > -1.2 : perp > 0.12 && perp < 1.2;
    if (!onSide) continue;
    const h = live.y - wallBase(f.x, f.z);
    if (h < -0.25 || h > f.h - 0.15) continue;
    return { f, u, h: Math.max(0.18, Math.min(h, f.h - 0.3)) };
  }
  return null;
}

export function startWall(g: { f: Face; u: number; h: number }) {
  live.climbing = `wall:${g.f.id}`;
  live.climbU = g.u;
  live.climbH = g.h;
  live.climbV = 0;
  live.climbPhase = 0;
  live.speed = 0;
  live.vx = 0;
  const p = pose(g.f, g.u, g.h);
  live.x = p.x;
  live.y = p.y;
  live.z = p.z;
  live.yaw = p.yaw;
  live.grounded = false;
  sfx.thud();
}

function pay(f: Face) {
  const id = `climb-${f.id}`;
  if ((useGame.getState().quests?.[id] ?? 0) > 0) return;
  useGame.getState().setQuest(id, 1);
  const g = useGame.getState();
  if (f.prize === "heart") {
    if (g.grantHeartContainer(id)) {
      revealItem("container", true);
      sfx.heart();
      sfx.secret();
    } else {
      g.addCoins(20);
      sfx.chest();
    }
  } else if (f.prize === "heal") {
    const max = playerMaxHp(g.xp, g.outfit, g.heartsExtra ?? 0);
    useGame.setState({ hp: max });
    sfx.heart();
  } else if (f.prize === "arrows") {
    const n = g.addArrows(f.n ?? 6);
    sfx.chest();
    if (!n) g.addCoins(8);
  } else {
    g.addCoins(f.n ?? 8);
    sfx.chest();
  }
  live.listen = f.line;
}

function crest(f: Face) {
  const L = ledgeOf(f);
  live.x = L.x;
  live.z = L.z;
  live.y = wallBase(f.x, f.z) + f.h + 0.04;
  live.climbing = null;
  live.climbH = 0;
  live.climbV = 0;
  live.climbU = 0;
  live.climbCool = 0.4;
  live.grounded = true;
  live.speed = 0;
  live.vx = 0;
  pay(f);
}

export function dropWall() {
  const id = live.climbing?.startsWith("wall:") ? live.climbing.slice(5) : "";
  const f = FACES.find((face) => face.id === id);
  live.climbing = null;
  live.climbCool = 0.35;
  live.climbV = 0;
  live.grounded = false;
  live.speed = 0;
  if (!f) return;
  if (f.along === "x") live.z = f.z + f.side * 1.05;
  else live.x = f.x + f.side * 1.05;
}

export function stepWall(dt: number, throttle: number, steer: number) {
  const id = live.climbing?.startsWith("wall:") ? live.climbing.slice(5) : "";
  const f = FACES.find((face) => face.id === id);
  if (!f) {
    live.climbing = null;
    return;
  }
  live.climbU = Math.max(-f.half + 0.35, Math.min(f.half - 0.35, (live.climbU || 0) + steer * 2.5 * dt));
  live.climbV = throttle * 3.05;
  live.climbH += live.climbV * dt;
  live.climbPhase += dt * (Math.abs(throttle) + Math.abs(steer) > 0.12 ? 5.1 : 0.6);
  if (Math.abs(live.climbV) > 0.5 || Math.abs(steer) > 0.35) {
    live.climbTick = (live.climbTick || 0) - dt;
    if (live.climbTick <= 0) {
      live.climbTick = 0.42;
      sfx.step("stone");
    }
  }
  if (live.climbH >= f.h - 0.05) {
    crest(f);
    return;
  }
  if (live.climbH <= 0.08 && throttle < -0.18) {
    dropWall();
    return;
  }
  live.climbH = Math.max(0.12, live.climbH);
  const p = pose(f, live.climbU, live.climbH);
  live.x = p.x;
  live.y = p.y;
  live.z = p.z;
  live.yaw = p.yaw;
  live.grounded = false;
  live.speed = 0;
  live.vx = 0;
}

export function wallHint() {
  if (live.climbing || live.listen || live.hint || live.talking) return;
  const g = grabWall();
  if (!g) return;
  live.hint = g.f.vine ? "The vines are thick enough." : "The rock is full of holds.";
}

function FaceMesh({ f }: { f: Face }) {
  const vines = useRef<THREE.Group>(null);
  const y = wallBase(f.x, f.z);
  const rot = f.along === "z" ? Math.PI / 2 : 0;
  const stone = f.vine ? "#6e6256" : "#8a7b68";
  useFrame(() => {
    if (!vines.current) return;
    vines.current.rotation.z = Math.sin(live.playT * 1.3 + f.x) * 0.03;
  });
  const holds = [-0.7, -0.1, 0.55, 1.1];
  return (
    <group position={[f.x, y, f.z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[f.half * 2.05, 1.1, 0.72]} />
        {lamb("#6a6258")}
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[f.half * 2, 1.15, 0.62]} />
        {lamb(stone)}
      </mesh>
      <mesh position={[0, 2.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[f.half * 1.96, 0.7, 0.58]} />
        {lamb("#7d7368")}
      </mesh>
      <mesh position={[0, f.h - 0.22, 0]} castShadow>
        <boxGeometry args={[f.half * 2.15, 0.42, 0.82]} />
        {lamb("#9a8d7c")}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (f.half - 0.15), f.h * 0.48, 0]} castShadow>
          <boxGeometry args={[0.38, f.h, 0.9]} />
          {lamb("#5c564e")}
        </mesh>
      ))}
      <mesh position={[0, f.h * 0.45, 0.34]}>
        <boxGeometry args={[0.06, f.h * 0.5, 0.05]} />
        {lamb("#3a342c")}
      </mesh>
      {holds.map((t, i) => (
        <mesh key={i} position={[(i - 1.5) * f.half * 0.42, f.h * (0.28 + (i % 3) * 0.18), 0.42]}>
          <boxGeometry args={[0.28, 0.12, 0.16]} />
          {lamb(i % 2 ? "#9a8b74" : "#6a5e50")}
        </mesh>
      ))}
      <mesh position={[0, 0.18, 0.4]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.9, 0.12, 0.12]} />
        {lamb("#5a3a22")}
      </mesh>
      {f.vine ? (
        <group ref={vines}>
          {[-0.85, -0.35, 0.15, 0.7].map((x, i) => (
            <mesh key={i} position={[x * f.half, f.h * 0.48, 0.55]}>
              <boxGeometry args={[0.34, f.h * 0.92, 0.28]} />
              {lamb(i % 2 ? "#2a6a30" : "#3e8a42")}
            </mesh>
          ))}
          {[-0.6, 0.1, 0.55].map((x, i) => (
            <mesh key={`leaf-${i}`} position={[x * f.half, f.h * (0.3 + i * 0.22), 0.72]}>
              <boxGeometry args={[0.45, 0.16, 0.28]} />
              {lamb("#4aaa48")}
            </mesh>
          ))}
        </group>
      ) : null}
      <mesh position={[0, f.h + 0.08, -f.side * 1.05]} receiveShadow>
        <boxGeometry args={[f.half * 1.6, 0.16, 1.9]} />
        {lamb("#6a8a48")}
      </mesh>
    </group>
  );
}

export function ClimbWalls() {
  useFrame(() => wallHint());
  return (
    <group>
      {FACES.map((f) => (
        <FaceMesh key={f.id} f={f} />
      ))}
    </group>
  );
}
