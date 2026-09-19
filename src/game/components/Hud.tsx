import { useEffect, useRef, useId, useState, memo } from "react";
import type { GemId } from "../content";
import { GEM_META, GEM_ORDER } from "../content";
import { live } from "../world3d/live";
import { TEMPLE_GATES, VX, VZ } from "../world3d/village";
import { POND, vWorld, WILD_POND, KEEP_Z, ECHO_GLADE, SNOW_AT, DESERT_AT, CAMP_AT, FAIRY_RING, FAR_POND, WIND_HILL, MOON_POND, GEYSER_AT, LIGHT_AT, STONE_RING, MIRROR_LAKE, SLEEP_GIANT, LOOK_AT, WHALE_AT, CLOUD_PIER, SAND_SHIP, ICE_CROWN, RIDE_AT, SOCK_PEAK, CLOCK_WOOD, FLOWER_SEA, SNORE_HILL, RAINBOW_ARCH, ANT_TABLE, BIRD_STACK, LOST_SHOE, BREAD_HILL, EDGE_MAIL, CHESS_AT, DUCK_LAKE, DOOR_FIELD, PIANO_AT, SPOON_AT, BOAT_AT, CAT_AT, CUP_AT, UMBRELLA_AT, SLIDE_AT, HAT_FAR, SPIRE_AT, TREE_HOME } from "../world3d/field";
import { askClue, type HintSnap } from "../askHint";
import { useGame } from "../store";
import { sfx } from "../audio";

export const HP_PER_HEART = 4;

export function Hearts({ hp, max, size = 15 }: { hp: number; max: number; size?: number; extra?: number }) {
  const total = Math.max(1, Math.min(24, Math.round(max / HP_PER_HEART)));
  const fill = hp / HP_PER_HEART;
  return (
    <div className="heart-row" aria-label={`${hp} of ${max} health`}>
      {Array.from({ length: total }, (_, i) => {
        const left = fill - i;
        const state = left >= 0.99 ? "full" : left >= 0.4 ? "half" : "empty";
        return <HeartIcon key={i} state={state} size={size} />;
      })}
    </div>
  );
}

const HEART_PATH =
  "M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

function HeartIcon({ state, size }: { state: "full" | "half" | "empty"; size: number }) {
  const clipId = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`heart-icon ${state}`}
      aria-hidden
    >
      {state === "half" ? (
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="12" height="24" />
          </clipPath>
        </defs>
      ) : null}
      <path d={HEART_PATH} className="heart-empty" />
      {state === "full" ? <path d={HEART_PATH} /> : null}
      {state === "half" ? <path d={HEART_PATH} clipPath={`url(#${clipId})`} className="heart-half" /> : null}
    </svg>
  );
}

export function Rupees({ n, max }: { n: number; max?: number }) {
  return (
    <span className="rupee-count" aria-label={`${n} rupees`}>
      <RupeeGem />
      <span className="tabular">{max ? `${n}/${max}` : n}</span>
    </span>
  );
}

function RupeeGem() {
  const gid = useId().replace(/:/g, "");
  return (
    <svg className="rupee-gem" viewBox="0 0 20 28" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="10" y1="0" x2="10" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c8ffb0" />
          <stop offset="0.45" stopColor="#4fd86a" />
          <stop offset="1" stopColor="#2a9a44" />
        </linearGradient>
      </defs>
      <polygon points="10,0 20,8.4 20,19.6 10,28 0,19.6 0,8.4" fill={`url(#${gid})`} />
      <polygon points="10,2.2 17.4,8.6 17.4,19.2 10,25.6 10,2.2" fill="#e8ffd4" opacity="0.38" />
      <polygon points="10,3.4 10,24.4 3.2,18.8 3.2,9.2" fill="#1e7a34" opacity="0.28" />
      <polygon points="10,4 14.6,8.8 10,12.4" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

const CARDINALS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

/** Screen degrees clockwise from north. Yaw 0 faces −Z (north); +yaw turns west. */
function yawToClockwiseDeg(yaw: number) {
  let deg = ((-yaw * 180) / Math.PI) % 360;
  if (deg < 0) deg += 360;
  return deg;
}

function headingOf(yaw: number) {
  return CARDINALS[Math.round(yawToClockwiseDeg(yaw) / 45) % 8]!;
}

export const CompassRose = memo(function CompassRose() {
  const face = useRef<SVGGElement>(null);
  const home = useRef<SVGGElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let id = 0;
    const tick = () => {
      const yaw = live.yaw;
      const faceDeg = yawToClockwiseDeg(yaw);
      if (face.current) face.current.setAttribute("transform", `rotate(${faceDeg} 36 36)`);
      const ang = Math.atan2(-(VX - live.x), -(VZ - live.z));
      const homeDeg = yawToClockwiseDeg(ang);
      if (home.current) home.current.setAttribute("transform", `rotate(${homeDeg} 36 36)`);
      if (label.current) {
        const next = headingOf(yaw);
        if (label.current.textContent !== next) label.current.textContent = next;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className="flex shrink-0 items-center gap-1.5"
      role="img"
      aria-label="Compass. White arrow is the way you face. Gold mark finds Oakstead. North stays at the top."
      title="White arrow · the way you face · gold · Oakstead"
    >
      <svg viewBox="0 0 72 72" className="h-14 w-14 shrink-0 drop-shadow" aria-hidden>
        <circle cx="36" cy="36" r="23.5" fill="#1a2418" stroke="#c9a227" strokeWidth="2.4" />
        <circle cx="36" cy="36" r="20.4" fill="none" stroke="#3d4a32" strokeWidth="0.7" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          const outer = 20.2;
          const inner = i % 2 === 0 ? 16.2 : 17.8;
          const x1 = 36 + Math.sin(a) * inner;
          const y1 = 36 - Math.cos(a) * inner;
          const x2 = 36 + Math.sin(a) * outer;
          const y2 = 36 - Math.cos(a) * outer;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={i === 0 ? "#e8d48a" : "#6a6558"}
              strokeWidth={i % 2 === 0 ? 1.5 : 1}
              strokeLinecap="round"
            />
          );
        })}
        <text x="36" y="11" textAnchor="middle" fill="#e8d48a" fontSize="10" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">
          N
        </text>
        <text x="36" y="70" textAnchor="middle" fill="#b0a490" fontSize="9" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">
          S
        </text>
        <text x="67" y="39.5" textAnchor="middle" fill="#b0a490" fontSize="9" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">
          E
        </text>
        <text x="5" y="39.5" textAnchor="middle" fill="#b0a490" fontSize="9" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">
          W
        </text>
        <g ref={face}>
          <polygon
            points="36,11.4 41.6,24.2 37.2,21.6 37.2,49.2 36,55.2 34.8,49.2 34.8,21.6 30.4,24.2"
            fill="#f6f1e6"
            stroke="#1a1410"
            strokeWidth="0.85"
            strokeLinejoin="round"
          />
        </g>
        <g ref={home}>
          <polygon points="36,14.6 38.6,20.4 36,18.8 33.4,20.4" fill="#e8c040" stroke="#5a4010" strokeWidth="0.45" />
        </g>
        <circle cx="36" cy="36" r="2.5" fill="#c9a227" stroke="#1a1410" strokeWidth="0.6" />
      </svg>
      <span ref={label} className="min-w-[1.4em] text-center text-[12px] font-bold leading-none tracking-wide text-[#e8d48a]">
        N
      </span>
    </div>
  );
});


export function FairyHint({ text }: { text: string }) {
  return (
    <div className="fairy-hint">
      <p>{text}</p>
    </div>
  );
}

export function QuestWhisper({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="pointer-events-none max-w-xs rounded-lg border border-[#c9a227]/40 bg-[#120e0a]/80 px-3 py-2 text-sm text-[#f6f1e6]">
      <p>{text}</p>
    </div>
  );
}

export function StonesMark() {
  return (
    <svg className="stones-mark" viewBox="0 0 64 56" aria-hidden>
      <polygon points="32,4 48,32 16,32" />
      <polygon points="16,32 32,52 2,52" />
      <polygon points="48,32 62,52 32,52" />
    </svg>
  );
}

export function GemRow({ gems }: { gems: Record<GemId, boolean> }) {
  return (
    <div className="flex items-center gap-1.5" aria-label="Spiritual gems">
      {GEM_ORDER.map((id) => (
        <span
          key={id}
          title={GEM_META[id].name}
          className="inline-block size-3.5 rotate-45 border"
          style={{
            background: gems[id] ? GEM_META[id].color : "transparent",
            borderColor: GEM_META[id].color,
            opacity: gems[id] ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  );
}

function snapFromGame(): HintSnap {
  const g = useGame.getState();
  return {
    hasSword: g.hasSword,
    hasOcarina: g.hasOcarina,
    hasHorse: g.hasHorse,
    hasAxe: g.hasAxe,
    hasBow: g.hasBow,
    hasShield: g.hasShield,
    hasPole: Boolean(g.hasPole),
    hasBombs: Boolean(g.hasBombs),
    songs: g.songs ?? [],
    metNpcs: g.metNpcs ?? [],
    worldsCleared: g.worldsCleared ?? [],
    gems: g.gems,
    gemsPlaced: g.gemsPlaced ?? [],
    quests: g.quests ?? {},
    mushrooms: g.mushrooms ?? 0,
    wood: g.wood ?? 0,
    rocks: g.rocks ?? 0,
    currentWorld: g.currentWorld,
  };
}

export function AskClue({ hidden }: { hidden?: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [think, setThink] = useState(false);
  const box = useRef<HTMLInputElement>(null);

  useEffect(() => {
    live.paused = open;
    if (open) window.setTimeout(() => box.current?.focus(), 40);
    return () => {
      if (open) live.paused = false;
    };
  }, [open]);

  if (hidden) return null;

  function submit() {
    if (think) return;
    const text = q.trim();
    if (!text) return;
    sfx.select();
    setThink(true);
    setA("");
    window.setTimeout(() => {
      setA(askClue(text, snapFromGame()));
      setThink(false);
    }, 420);
  }

  return (
    <div className="ask-clue pointer-events-auto">
      {open ? (
        <div className="ask-clue-panel">
          <div className="flex items-center justify-between gap-2">
            <p className="ask-clue-tag">Ask for a clue</p>
            <button
              type="button"
              className="text-xs text-[#e8d48a] hover:text-white"
              onClick={() => {
                sfx.select();
                setOpen(false);
                live.paused = false;
              }}
            >
              Close
            </button>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-[#c8b090]">
            Type what you want to do. You’ll get a hint, not the whole path.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              ref={box}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") {
                  setOpen(false);
                  live.paused = false;
                }
              }}
              placeholder="How do I get my horse?"
              className="ask-clue-input"
              maxLength={80}
            />
            <button type="button" className="ask-clue-go" onClick={submit}>
              Ask
            </button>
          </div>
          {think ? <p className="mt-2 text-xs text-[#e8d48a]">Thinking…</p> : null}
          {a ? <p className="ask-clue-answer">{a}</p> : null}
        </div>
      ) : (
        <button
          type="button"
          className="ask-clue-btn"
          onClick={() => {
            sfx.select();
            setOpen(true);
          }}
        >
          ?
        </button>
      )}
    </div>
  );
}

const MILL = vWorld(2, -116);
const PELL = vWorld(32, -112);
const LOFT = vWorld(46, -94);

const MAP_MARKS: { id: string; label: string; x: number; z: number; kind: "town" | "keep" | "shrine" | "cave" | "water" | "gate" }[] = [
  { id: "oak", label: "Oakstead", x: VX, z: VZ, kind: "town" },
  { id: "home", label: "Home", x: TREE_HOME.x, z: TREE_HOME.z, kind: "town" },
  { id: "keep", label: "Keep", x: 0, z: KEEP_Z, kind: "keep" },
  { id: "pond", label: "Pond", x: POND.x, z: POND.z, kind: "water" },
  { id: "wild", label: "Wild Pond", x: WILD_POND.x, z: WILD_POND.z, kind: "water" },
  { id: "farpond", label: "North Pool", x: FAR_POND.x, z: FAR_POND.z, kind: "water" },
  { id: "loft", label: "Loft", x: LOFT.x, z: LOFT.z, kind: "town" },
  { id: "mill", label: "Mill", x: MILL.x, z: MILL.z, kind: "town" },
  { id: "pell", label: "Pell", x: PELL.x, z: PELL.z, kind: "town" },
  { id: "echo", label: "Echo", x: ECHO_GLADE.x, z: ECHO_GLADE.z, kind: "shrine" },
  { id: "fairy", label: "Fairy", x: FAIRY_RING.x, z: FAIRY_RING.z, kind: "shrine" },
  { id: "snow", label: "Snow", x: SNOW_AT.x, z: SNOW_AT.z, kind: "keep" },
  { id: "desert", label: "Sand", x: DESERT_AT.x, z: DESERT_AT.z, kind: "gate" },
  { id: "camp", label: "Camp", x: CAMP_AT.x, z: CAMP_AT.z, kind: "town" },
  { id: "wind", label: "Wind", x: WIND_HILL.x, z: WIND_HILL.z, kind: "gate" },
  { id: "moonpond", label: "Moon Pond", x: MOON_POND.x, z: MOON_POND.z, kind: "water" },
  { id: "geyser", label: "Geyser", x: GEYSER_AT.x, z: GEYSER_AT.z, kind: "gate" },
  { id: "light", label: "Light", x: LIGHT_AT.x, z: LIGHT_AT.z, kind: "keep" },
  { id: "ring", label: "Ring", x: STONE_RING.x, z: STONE_RING.z, kind: "shrine" },
  { id: "mirror", label: "Mirror", x: MIRROR_LAKE.x, z: MIRROR_LAKE.z, kind: "water" },
  { id: "giant", label: "Giant", x: SLEEP_GIANT.x, z: SLEEP_GIANT.z, kind: "gate" },
  { id: "lookout", label: "Lookout", x: LOOK_AT.x, z: LOOK_AT.z, kind: "town" },
  { id: "whale", label: "Whale", x: WHALE_AT.x, z: WHALE_AT.z, kind: "gate" },
  { id: "cloud", label: "Cloud", x: CLOUD_PIER.x, z: CLOUD_PIER.z, kind: "keep" },
  { id: "ship", label: "Ship", x: SAND_SHIP.x, z: SAND_SHIP.z, kind: "gate" },
  { id: "ice", label: "Crown", x: ICE_CROWN.x, z: ICE_CROWN.z, kind: "keep" },
  { id: "balloon", label: "Balloon", x: RIDE_AT.x, z: RIDE_AT.z, kind: "town" },
  { id: "fork", label: "Fork", x: SPIRE_AT.x, z: SPIRE_AT.z, kind: "keep" },
  { id: "socks", label: "Socks", x: SOCK_PEAK.x, z: SOCK_PEAK.z, kind: "gate" },
  { id: "clock", label: "Clock", x: CLOCK_WOOD.x, z: CLOCK_WOOD.z, kind: "shrine" },
  { id: "flowers", label: "Flowers", x: FLOWER_SEA.x, z: FLOWER_SEA.z, kind: "gate" },
  { id: "snore", label: "Snore", x: SNORE_HILL.x, z: SNORE_HILL.z, kind: "keep" },
  { id: "arch", label: "Arch", x: RAINBOW_ARCH.x, z: RAINBOW_ARCH.z, kind: "shrine" },
  { id: "ants", label: "Table", x: ANT_TABLE.x, z: ANT_TABLE.z, kind: "town" },
  { id: "birds", label: "Birds", x: BIRD_STACK.x, z: BIRD_STACK.z, kind: "keep" },
  { id: "shoe", label: "Shoe", x: LOST_SHOE.x, z: LOST_SHOE.z, kind: "gate" },
  { id: "bread", label: "Loaf", x: BREAD_HILL.x, z: BREAD_HILL.z, kind: "gate" },
  { id: "edge", label: "Far Mail", x: EDGE_MAIL.x, z: EDGE_MAIL.z, kind: "town" },
  { id: "chess", label: "Knight", x: CHESS_AT.x, z: CHESS_AT.z, kind: "keep" },
  { id: "ducklake", label: "Duck", x: DUCK_LAKE.x, z: DUCK_LAKE.z, kind: "water" },
  { id: "doorfield", label: "Door", x: DOOR_FIELD.x, z: DOOR_FIELD.z, kind: "shrine" },
  { id: "piano", label: "Piano", x: PIANO_AT.x, z: PIANO_AT.z, kind: "keep" },
  { id: "spoon", label: "Spoon", x: SPOON_AT.x, z: SPOON_AT.z, kind: "gate" },
  { id: "boat", label: "Boat", x: BOAT_AT.x, z: BOAT_AT.z, kind: "water" },
  { id: "cat", label: "Cat", x: CAT_AT.x, z: CAT_AT.z, kind: "gate" },
  { id: "cup", label: "Cup", x: CUP_AT.x, z: CUP_AT.z, kind: "town" },
  { id: "umb", label: "Shade", x: UMBRELLA_AT.x, z: UMBRELLA_AT.z, kind: "shrine" },
  { id: "slide", label: "Slide", x: SLIDE_AT.x, z: SLIDE_AT.z, kind: "gate" },
  { id: "bighat", label: "Hat", x: HAT_FAR.x, z: HAT_FAR.z, kind: "keep" },
];

export function ValeMap({ you }: { you?: { x: number; z: number } }) {
  const quests = useGame((s) => s.quests);
  const found = TEMPLE_GATES.filter((g) => (quests?.[`found_${g.world}`] ?? 0) >= 1);
  const youRef = useRef<HTMLSpanElement>(null);
  const pts = [
    ...MAP_MARKS.map((m) => ({ x: m.x, z: m.z })),
    ...found.map((g) => ({ x: g.x, z: g.z })),
    { x: you?.x ?? live.x, z: you?.z ?? live.z },
  ];
  let x0 = Math.min(...pts.map((p) => p.x));
  let x1 = Math.max(...pts.map((p) => p.x));
  let z0 = Math.min(...pts.map((p) => p.z));
  let z1 = Math.max(...pts.map((p) => p.z));
  const pad = 48;
  x0 -= pad;
  x1 += pad;
  z0 -= pad;
  z1 += pad;
  const minX = 220;
  const minZ = 180;
  if (x1 - x0 < minX) {
    const m = (x0 + x1) / 2;
    x0 = m - minX / 2;
    x1 = m + minX / 2;
  }
  if (z1 - z0 < minZ) {
    const m = (z0 + z1) / 2;
    z0 = m - minZ / 2;
    z1 = m + minZ / 2;
  }
  const px = (x: number) => ((x - x0) / (x1 - x0)) * 100;
  const pz = (z: number) => ((z - z0) / (z1 - z0)) * 100;
  const pr = (r: number) => (r / (x1 - x0)) * 100;
  const proj = useRef({ px, pz });
  proj.current = { px, pz };
  useEffect(() => {
    let id = 0;
    const tick = () => {
      const el = youRef.current;
      if (el) {
        const p = proj.current;
        const left = Math.max(3, Math.min(97, p.px(live.x)));
        const top = Math.max(3, Math.min(97, p.pz(live.z)));
        el.style.left = `${left}%`;
        el.style.top = `${top}%`;
        el.style.transform = `translate(-50%, -50%) rotate(${(-live.yaw * 180) / Math.PI}deg)`;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
  const road = (a: { x: number; z: number }, b: { x: number; z: number }) => {
    const x1p = px(a.x);
    const y1p = pz(a.z);
    const x2p = px(b.x);
    const y2p = pz(b.z);
    const len = Math.hypot(x2p - x1p, y2p - y1p);
    const ang = (Math.atan2(y2p - y1p, x2p - x1p) * 180) / Math.PI;
    return { left: x1p, top: y1p, len, ang };
  };
  const roads = [
    road({ x: VX, z: VZ }, { x: 0, z: KEEP_Z }),
    road({ x: VX, z: VZ }, { x: POND.x, z: POND.z }),
    road({ x: PELL.x, z: PELL.z }, { x: LOFT.x, z: LOFT.z }),
    road({ x: VX, z: VZ }, { x: MILL.x, z: MILL.z }),
    road({ x: MILL.x, z: MILL.z }, { x: PELL.x, z: PELL.z }),
    road({ x: VX, z: VZ }, { x: WILD_POND.x, z: WILD_POND.z }),
  ];
  const blobs: { x: number; z: number; r: number; color: string }[] = [
    { x: VX, z: VZ, r: 42, color: "rgba(90,130,56,0.42)" },
    { x: 0, z: KEEP_Z, r: 22, color: "rgba(90,86,78,0.5)" },
    { x: POND.x, z: POND.z, r: 14, color: "rgba(48,110,140,0.48)" },
    { x: WILD_POND.x, z: WILD_POND.z, r: 16, color: "rgba(48,110,140,0.38)" },
    { x: FAR_POND.x, z: FAR_POND.z, r: 14, color: "rgba(48,110,140,0.32)" },
    { x: LOFT.x, z: LOFT.z, r: 10, color: "rgba(140,90,50,0.35)" },
    { x: ECHO_GLADE.x, z: ECHO_GLADE.z, r: 18, color: "rgba(80,140,90,0.32)" },
    { x: SNOW_AT.x, z: SNOW_AT.z, r: 24, color: "rgba(200,210,220,0.35)" },
    { x: DESERT_AT.x, z: DESERT_AT.z, r: 22, color: "rgba(180,150,80,0.32)" },
  ];
  for (const g of found) blobs.push({ x: g.x, z: g.z, r: 16, color: `${g.color}55` });
  const glyph = (kind: string) => (kind === "water" ? "○" : kind === "keep" ? "▲" : kind === "shrine" ? "✦" : kind === "cave" ? "▽" : "●");
  return (
    <div className="vale-map relative overflow-hidden rounded-lg border-2 border-[#c9a227]/70">
      <div className="absolute inset-0 bg-[#cbb892]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,#6a8a48_0%,transparent_42%),radial-gradient(ellipse_at_52%_38%,#8a9a68_0%,transparent_28%),linear-gradient(180deg,#8aa868_0%,#5a7a40_55%,#3a5a2c_100%)] opacity-90" />
      <div className="absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(90deg,transparent_0,transparent_11px,#5a4a32_12px),repeating-linear-gradient(0deg,transparent_0,transparent_11px,#5a4a32_12px)]" />
      {blobs.map((b, i) => (
        <span
          key={`b${i}`}
          className="absolute rounded-full"
          style={{
            left: `${px(b.x)}%`,
            top: `${pz(b.z)}%`,
            width: `${pr(b.r) * 2}%`,
            height: `${(b.r / (z1 - z0)) * 200}%`,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
          }}
        />
      ))}
      {roads.map((r, i) => (
        <span
          key={i}
          className="absolute h-[2px] origin-left bg-[#6a5a40]/80"
          style={{ left: `${r.left}%`, top: `${r.top}%`, width: `${r.len}%`, transform: `rotate(${r.ang}deg)` }}
        />
      ))}
      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-[0.28em] text-[#e8d48a]">SOME MEADOW</span>
      {MAP_MARKS.map((m) => (
        <span
          key={m.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[8px] font-semibold leading-none text-[#f6f1e6] drop-shadow"
          style={{ left: `${px(m.x)}%`, top: `${pz(m.z)}%` }}
        >
          {glyph(m.kind)} {m.label}
        </span>
      ))}
      {found.map((g) => {
        const left = Math.max(4, Math.min(96, px(g.x)));
        const top = Math.max(6, Math.min(94, pz(g.z)));
        return (
          <span
            key={g.world}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[7px] font-semibold leading-none drop-shadow"
            style={{ left: `${left}%`, top: `${top}%`, color: g.color }}
          >
            ▽ hole
          </span>
        );
      })}
      <span
        ref={youRef}
        className="absolute z-10"
        style={{ left: "50%", top: "50%" }}
        title="You"
      >
        <span className="block h-0 w-0 border-l-[5px] border-r-[5px] border-b-[11px] border-l-transparent border-r-transparent border-b-[#e8c040] drop-shadow" />
      </span>
      <span className="absolute right-1 bottom-1 rounded bg-[#1a1410]/55 px-1 py-0.5 text-[8px] tracking-wide text-[#e8d48a]">
        you · gold
      </span>
    </div>
  );
}
