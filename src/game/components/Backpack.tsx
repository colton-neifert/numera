import { useEffect, useMemo, useRef, useState } from "react";
import { sfx, setMusicMix, setSfxMix, getMusicMix, getSfxMix, setTalkMix, getTalkMix, setMuted } from "../audio";
import { useGame } from "../store";
import { live } from "../world3d/live";
import { writeActive } from "../saves";
import { SONGS, completeSong } from "../songs";
import { ValeMap } from "./Hud";
import { isPad, moveAxes } from "../input";
import { ItemArt } from "./ItemArt";

export type PackId =
  | "sword"
  | "shield"
  | "axe"
  | "bow"
  | "arrows"
  | "sling"
  | "boom"
  | "bomb"
  | "pole"
  | "flute"
  | "compass"
  | "map"
  | "key"
  | "emerald"
  | "ruby"
  | "sapphire"
  | "apple"
  | "mushroom"
  | "fish"
  | "cooked"
  | "wood"
  | "rock"
  | "rupee"
  | "lantern"
  | "bottle";

type PackEntry = {
  id: PackId;
  name: string;
  blurb: string;
  action: "equip" | "use" | "info";
  hold?: "sword" | "axe" | "bow" | "sling" | "boom" | "bomb" | "shield" | "pole";
  count?: number;
  max?: number;
  equipped?: boolean;
  useWhy?: string;
};

let remembered: PackId = "sword";

function useOwned(): PackEntry[] {
  const g = useGame();
  const holding = g.holding;
  const pad = isPad();
  const list: PackEntry[] = [];
  if (g.hasSword)
    list.push({
      id: "sword",
      name: "Hero’s Sword",
      blurb: pad ? "Equip it, then tap Sword to swing." : "Equip it, then press V to swing.",
      action: "equip",
      hold: "sword",
      equipped: holding === "sword",
    });
  if (g.hasShield)
    list.push({
      id: "shield",
      name: "Hero’s Shield",
      blurb: "Raises to block scratches. Equip it to keep it ready.",
      action: "equip",
      hold: "shield",
      equipped: holding === "shield" || live.shieldUp,
    });
  if (g.hasAxe)
    list.push({
      id: "axe",
      name: "Forest Axe",
      blurb: "Chop a tree three times. Chop the fallen log for wood.",
      action: "equip",
      hold: "axe",
      equipped: holding === "axe",
    });
  if (g.hasBow)
    list.push({
      id: "bow",
      name: "Hero’s Bow",
      blurb: pad ? "Lock on, then Sword to shoot." : "Lock on, then V to shoot.",
      action: "equip",
      hold: "bow",
      equipped: holding === "bow",
    });
  if (g.hasBow)
    list.push({
      id: "arrows",
      name: "Arrows",
      blurb: "For the Hero’s Bow. Cut grass if you run out.",
      action: "info",
      count: g.arrows ?? 0,
      max: g.arrowsMax ?? 20,
    });
  if (g.hasSling)
    list.push({
      id: "sling",
      name: "Slingshot",
      blurb: "Shoots Deku seeds. Cut grass for more.",
      action: "equip",
      hold: "sling",
      equipped: holding === "sling",
    });
  if (g.hasBoom)
    list.push({
      id: "boom",
      name: "Boomerang",
      blurb: pad ? "Sword throws it. It flies out and comes back." : "V throws it. It flies out and comes back.",
      action: "equip",
      hold: "boom",
      equipped: holding === "boom",
    });
  if (g.hasBombs)
    list.push({
      id: "bomb",
      name: "Bombs",
      blurb: pad ? "Sword throws. They bounce, then burst." : "V throws. They bounce, then burst.",
      action: "equip",
      hold: "bomb",
      count: g.bombs ?? 0,
      max: g.bombsMax ?? 20,
      equipped: holding === "bomb",
    });
  if (g.hasPole)
    list.push({
      id: "pole",
      name: "Fishing Pole",
      blurb: "Stand by the pond and Talk to cast.",
      action: "equip",
      hold: "pole",
      equipped: holding === "pole",
    });
  if (g.hasOcarina)
    list.push({
      id: "flute",
      name: "Reed Flute",
      blurb: "Play a song you have learned. People in Oakstead teach them.",
      action: "use",
      useWhy: (g.songs ?? []).length ? undefined : "No songs yet. Talk to people.",
    });
  if (g.hasCompass)
    list.push({
      id: "compass",
      name: "Hero’s Compass",
      blurb: "The gold needle finds Oakstead. North stays north.",
      action: "info",
    });
  list.push({
    id: "map",
    name: "Vale Map",
    blurb: "Gold arrow is you. Temples mark as the count opens them.",
    action: "info",
  });
  if (live.keys > 0)
    list.push({
      id: "key",
      name: "Small Key",
      blurb: "Opens a locked door in this place.",
      action: "info",
      count: live.keys,
    });
  if (g.gems?.emerald)
    list.push({ id: "emerald", name: "Sun Jewel", blurb: "The orange jewel. Take it to the castle altar.", action: "info" });
  if (g.gems?.ruby)
    list.push({ id: "ruby", name: "Fire Jewel", blurb: "The red jewel. Take it to the castle altar.", action: "info" });
  if (g.gems?.sapphire)
    list.push({ id: "sapphire", name: "Water Jewel", blurb: "The blue jewel. Take it to the castle altar.", action: "info" });
  if ((g.apples ?? 0) > 0)
    list.push({
      id: "apple",
      name: "Apple",
      blurb: "Eat it for one heart.",
      action: "use",
      count: g.apples,
      useWhy: g.hp >= 999 ? "Hearts are full." : undefined,
    });
  if ((g.mushrooms ?? 0) > 0)
    list.push({
      id: "mushroom",
      name: "Heart Mushroom",
      blurb: "Eat it for one heart.",
      action: "use",
      count: g.mushrooms,
    });
  if ((g.fish ?? 0) > 0)
    list.push({
      id: "fish",
      name: "Fish",
      blurb: "Eat raw for one heart, or cook it on a fire for two.",
      action: "use",
      count: g.fish,
    });
  if ((g.cooked ?? 0) > 0)
    list.push({
      id: "cooked",
      name: "Cooked Fish",
      blurb: "Eat it for two hearts.",
      action: "use",
      count: g.cooked,
    });
  if ((g.wood ?? 0) > 0)
    list.push({
      id: "wood",
      name: "Wood",
      blurb: "Use to lay a campfire at your feet.",
      action: "use",
      count: g.wood,
    });
  if ((g.rocks ?? 0) > 0)
    list.push({
      id: "rock",
      name: "Rocks",
      blurb: "Throw them. A heart or rupee sometimes hides inside.",
      action: "info",
      count: g.rocks,
    });
  list.push({
    id: "rupee",
    name: "Rupees",
    blurb: "Spend them at shops in Oakstead.",
    action: "info",
    count: g.coins,
    max: g.coinsMax ?? 100,
  });
  return list;
}

export function Backpack({ onClose }: { onClose: () => void }) {
  const items = useOwned();
  const holdTool = useGame((s) => s.holdTool);
  const eatApple = useGame((s) => s.eatApple);
  const eatMushroom = useGame((s) => s.eatMushroom);
  const eatFish = useGame((s) => s.eatFish);
  const eatCooked = useGame((s) => s.eatCooked);
  const songs = useGame((s) => s.songs) ?? [];
  const muted = useGame((s) => s.muted);
  const [sel, setSel] = useState(() => {
    const i = items.findIndex((x) => x.id === remembered);
    return i >= 0 ? i : 0;
  });
  const [shift, setShift] = useState(0);
  const busy = useRef(false);
  const [saved, setSaved] = useState(false);
  const [musicVol, setMusicVol] = useState(getMusicMix);
  const [sfxVol, setSfxVol] = useState(getSfxMix);
  const [talkVol, setTalkVol] = useState(getTalkMix);
  const n = items.length;
  const cur = items[sel] ?? items[0];
  const stepRef = useRef<(d: 1 | -1) => void>(() => {});
  const primaryRef = useRef<() => void>(() => {});

  useEffect(() => {
    try {
      sfx.open();
    } catch {
      /* ignore */
    }
    live.paused = true;
    return () => {
      live.paused = false;
    };
  }, []);

  useEffect(() => {
    if (cur) remembered = cur.id;
  }, [cur]);

  const step = (dir: 1 | -1) => {
    if (busy.current || n < 2) return;
    busy.current = true;
    try {
      sfx.select();
    } catch {
      /* ignore */
    }
    setShift(dir);
    window.setTimeout(() => {
      setSel((s) => (s + dir + n) % n);
      setShift(0);
      busy.current = false;
    }, 200);
  };
  stepRef.current = step;

  const doEquip = () => {
    if (!cur?.hold) return;
    holdTool(cur.hold);
    live.holding = cur.hold;
    live.shieldUp = cur.hold === "shield";
    try {
      sfx.equip();
    } catch {
      /* ignore */
    }
    writeActive();
  };

  const doUse = () => {
    if (!cur) return;
    if (cur.id === "apple") {
      eatApple();
      sfx.heart();
      return;
    }
    if (cur.id === "mushroom") {
      eatMushroom();
      sfx.heart();
      return;
    }
    if (cur.id === "fish") {
      eatFish();
      sfx.heart();
      return;
    }
    if (cur.id === "cooked") {
      eatCooked();
      sfx.heart();
      return;
    }
    if (cur.id === "wood") {
      if ((useGame.getState().wood ?? 0) < 1) return;
      useGame.setState({ wood: useGame.getState().wood - 1 });
      live.pendingFire = true;
      sfx.fire();
      onClose();
      return;
    }
    if (cur.id === "flute") {
      const first = SONGS.find((s) => songs.includes(s.id));
      if (!first) return;
      completeSong(first.id);
      sfx.ok();
      onClose();
    }
  };

  const doPrimary = () => {
    if (cur?.action === "equip") doEquip();
    else if (cur?.action === "use" && !cur.useWhy) doUse();
  };
  primaryRef.current = doPrimary;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepRef.current(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        stepRef.current(1);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        primaryRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let acc = 0;
    const id = window.setInterval(() => {
      const a = moveAxes();
      if (a.steer < -0.55) {
        if (acc !== 1) {
          acc = 1;
          stepRef.current(1);
        }
      } else if (a.steer > 0.55) {
        if (acc !== -1) {
          acc = -1;
          stepRef.current(-1);
        }
      } else acc = 0;
    }, 90);
    return () => window.clearInterval(id);
  }, []);

  const swipe = useRef({ x: 0, on: false });
  const onSwipeDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, on: true };
  };
  const onSwipeUp = (e: React.PointerEvent) => {
    if (!swipe.current.on) return;
    const dx = e.clientX - swipe.current.x;
    swipe.current.on = false;
    if (dx > 48) stepRef.current(-1);
    else if (dx < -48) stepRef.current(1);
  };

  const windowItems = useMemo(() => {
    if (!n) return [];
    const out: { item: PackEntry; k: number }[] = [];
    for (let i = -2; i <= 2; i++) {
      const idx = (sel + i + n * 8) % n;
      out.push({ item: items[idx]!, k: i });
    }
    return out;
  }, [items, sel, n]);

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-3 sm:p-6">
      <style>{`@keyframes packGlow { 0%,100% { opacity: .45 } 50% { opacity: 1 } }`}</style>
      <div
        className="flex max-h-full w-full max-w-3xl flex-col overflow-y-auto rounded-2xl border-4 px-4 py-4 sm:px-6 sm:py-5"
        style={{
          background: "linear-gradient(180deg, #3a2a1c 0%, #24180f 55%, #1a120c 100%)",
          borderColor: "#c9a227",
          boxShadow: "0 18px 50px rgba(0,0,0,0.55), inset 0 0 0 2px #6a4a22",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-2xl tracking-wide text-[#e8d48a] sm:text-3xl">Backpack</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="min-h-12 min-w-20 rounded-lg border-2 border-[#c9a227] bg-[#2a1e14] px-3 text-sm font-semibold text-[#e8d48a]"
              onPointerDown={() => {
                writeActive();
                sfx.save();
                setSaved(true);
                window.setTimeout(() => setSaved(false), 1400);
              }}
            >
              {saved ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              className="min-h-12 min-w-20 rounded-lg border-2 border-[#c9a227] bg-[#c9a227] px-3 text-sm font-semibold text-[#1a1410]"
              onPointerDown={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div
          className="relative mt-4 flex items-center gap-2"
          onPointerDown={onSwipeDown}
          onPointerUp={onSwipeUp}
          onPointerCancel={() => {
            swipe.current.on = false;
          }}
        >
          <button
            type="button"
            aria-label="Previous item"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl sm:h-20 sm:w-20"
            style={{ background: "#2a1c12", border: "3px solid #c9a227" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              step(-1);
            }}
          >
            <svg viewBox="0 0 24 24" className="h-10 w-10 sm:h-12 sm:w-12" aria-hidden>
              <polygon points="18,3 18,21 5,12" fill="#e8d48a" />
            </svg>
          </button>

          <div
            className="relative flex min-h-[10.5rem] flex-1 items-center justify-center overflow-hidden rounded-xl sm:min-h-[12.5rem]"
            style={{ background: "#1c140e", border: "2px solid #6a5030" }}
          >
            <div
              className="flex items-center justify-center gap-2 sm:gap-3"
              style={{
                transform: `translateX(${-shift * 18}%)`,
                transition: shift !== 0 ? "transform 200ms ease" : "none",
              }}
            >
              {windowItems.map(({ item, k }) => (
                <button
                  key={`hit-${item.id}-${k}`}
                  type="button"
                  className={`rounded-xl ${Math.abs(k) > 1 ? "hidden sm:block" : ""}`}
                  style={{
                    width: k === 0 ? "7.4rem" : "5.6rem",
                    height: k === 0 ? "7.4rem" : "5.6rem",
                    border: k === 0 ? "3px solid #e8d48a" : "2px solid #6a5030",
                    boxShadow: k === 0 ? "0 0 20px rgba(201,162,39,0.55)" : "none",
                    transform: k === 0 ? "translateY(-6px)" : "none",
                    animation: k === 0 ? "packGlow 2.4s ease-in-out infinite" : undefined,
                    transition: "width 200ms ease, height 200ms ease, transform 200ms ease",
                    overflow: "hidden",
                    background: "#24180f",
                  }}
                  aria-label={item.name}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (k === 0) return;
                    try {
                      sfx.select();
                    } catch {
                      /* ignore */
                    }
                    setSel((sel + k + n) % n);
                  }}
                >
                  <ItemArt id={item.id} className="h-full w-full" />
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            aria-label="Next item"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl sm:h-20 sm:w-20"
            style={{ background: "#2a1c12", border: "3px solid #c9a227" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              step(1);
            }}
          >
            <svg viewBox="0 0 24 24" className="h-10 w-10 sm:h-12 sm:w-12" aria-hidden>
              <polygon points="6,3 6,21 19,12" fill="#e8d48a" />
            </svg>
          </button>
        </div>

        {cur ? (
          <div className="mt-4 text-center">
            <p className="font-display text-2xl text-[#f6f1e6] sm:text-3xl">{cur.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-[#d8c8a8] sm:text-base">{cur.blurb}</p>
            <p className="mt-1 text-sm text-[#e8d48a]">
              {cur.count != null ? (cur.max != null ? `${cur.name.replace(/s$/, "")}: ${cur.count} / ${cur.max}` : `${cur.name}: ${cur.count}`) : null}
              {cur.equipped ? (cur.count != null ? "  ·  Equipped" : "Equipped") : null}
            </p>
          </div>
        ) : (
          <p className="mt-6 text-center text-[#d8c8a8]">The backpack is empty.</p>
        )}

        {cur?.id === "map" ? (
          <div className="mx-auto mt-2 w-full max-w-md">
            <ValeMap you={{ x: live.x, z: live.z }} />
          </div>
        ) : null}

        {cur?.id === "flute" && songs.length > 0 ? (
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {SONGS.filter((s) => songs.includes(s.id)).map((s) => (
              <button
                key={s.id}
                type="button"
                className="min-h-11 rounded-lg border border-[#c9a227] bg-[#2a1e14] px-3 text-sm text-[#e8d48a]"
                onPointerDown={() => {
                  completeSong(s.id);
                  sfx.ok();
                  onClose();
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={cur?.action !== "equip"}
            className="min-h-14 min-w-32 rounded-xl px-6 text-lg font-semibold disabled:opacity-40"
            style={{ background: "#c9a227", color: "#1a1410" }}
            onPointerDown={() => {
              if (cur?.action === "equip") doEquip();
            }}
          >
            Equip
          </button>
          <button
            type="button"
            disabled={cur?.action !== "use" || Boolean(cur?.useWhy)}
            className="min-h-14 min-w-32 rounded-xl border-2 border-[#c9a227] px-6 text-lg font-semibold text-[#e8d48a] disabled:opacity-40"
            style={{ background: "#2a1e14" }}
            onPointerDown={() => {
              if (cur?.action === "use" && !cur.useWhy) doUse();
            }}
          >
            Use
          </button>
          <button
            type="button"
            className="min-h-14 min-w-28 rounded-xl border-2 border-[#8a6a38] px-6 text-lg font-semibold text-[#d8c8a8]"
            style={{ background: "#1a1410" }}
            onPointerDown={onClose}
          >
            Back
          </button>
        </div>
        {cur?.action !== "equip" ? (
          <p className="mt-2 text-center text-xs text-[#a89878]">
            {cur?.action === "use" && cur.useWhy ? cur.useWhy : cur?.action === "use" ? "Use never happens just by tapping the picture." : "This stays in the pack. It cannot be equipped."}
          </p>
        ) : (
          <p className="mt-2 text-center text-xs text-[#a89878]">Tapping a picture only selects it. Press Equip to hold it.</p>
        )}

        <div className="mt-3 rounded-lg bg-black/25 p-3">
          <p className="text-[10px] tracking-[0.16em] text-[#e8d48a] uppercase">Sound</p>
          <label className="mt-2 flex items-center gap-3 text-sm text-[#efe6d4]">
            Music
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={musicVol}
              className="h-2 flex-1 accent-[#c9a227]"
              onChange={(e) => {
                const v = Number(e.target.value);
                setMusicVol(v);
                setMusicMix(v);
              }}
            />
          </label>
          <label className="mt-2 flex items-center gap-3 text-sm text-[#efe6d4]">
            Sounds
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={sfxVol}
              className="h-2 flex-1 accent-[#c9a227]"
              onChange={(e) => {
                const v = Number(e.target.value);
                setSfxVol(v);
                setSfxMix(v);
              }}
            />
          </label>
          <label className="mt-2 flex items-center gap-3 text-sm text-[#efe6d4]">
            Voices
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={talkVol}
              className="h-2 flex-1 accent-[#c9a227]"
              onChange={(e) => {
                const v = Number(e.target.value);
                setTalkVol(v);
                setTalkMix(v);
              }}
            />
          </label>
          <button
            type="button"
            className="mt-2 min-h-11 text-sm text-[#e8d48a]"
            onPointerDown={() => {
              useGame.getState().toggleMute();
              setMuted(useGame.getState().muted);
              sfx.select();
            }}
          >
            {muted ? "Unmute all" : "Mute all"}
          </button>
        </div>
      </div>
    </div>
  );
}
