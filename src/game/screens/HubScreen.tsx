import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  WORLD_META,
  FIRST_ARC,
  SECOND_ARC,
  THIRD_ARC,
  crystalGoal,
  playerMaxHp,
  talk,
  xpIntoLevel,
} from "../content";
import { sfx, setMuted } from "../audio";
import { FairyHint, GemRow, Hearts, Rupees } from "../components/Hud";
import { heardTales } from "../dialogue";
import { useGame, worldUnlocked } from "../store";
import type { WorldId } from "../types";
import { useEffect } from "react";

export function HubScreen() {
  const xp = useGame((s) => s.xp);
  const hp = useGame((s) => s.hp);
  const coins = useGame((s) => s.coins);
  const muted = useGame((s) => s.muted);
  const outfit = useGame((s) => s.outfit);
  const grade = useGame((s) => s.grade);
  const cleared = useGame((s) => s.worldsCleared);
  const heroName = useGame((s) => s.heroName);
  const metNpcs = useGame((s) => s.metNpcs);
  const collected = useGame((s) => s.collected);
  const hasHorse = useGame((s) => s.hasHorse);
  const gems = useGame((s) => s.gems);
  const gemsPlaced = useGame((s) => s.gemsPlaced);
  const enterWorld = useGame((s) => s.enterWorld);
  const toggleMute = useGame((s) => s.toggleMute);
  const won = cleared.includes("keep");
  const leftoverNamed = cleared.includes("echo");
  const named = cleared.includes("vault");
  const digits = Object.values(collected).reduce((n, a) => n + a.length, 0);
  const setScreenTitle = () => useGame.setState({ screen: "title" });
  const maxHp = playerMaxHp(xp, outfit, useGame.getState().heartsExtra ?? 0);
  const bar = xpIntoLevel(xp);

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  return (
    <div className="relative isolate flex h-full flex-col overflow-y-auto">
      <img
        src="/game/maps/battle-meadow.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-bg/75" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted uppercase">
              {named ? "The count is whole" : won ? "The leftover still walks" : "The unfinished count"}
            </p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">
              {talk(
                named
                  ? "The Vale is even, {name}"
                  : won
                    ? "The crown fell, {name}"
                    : "The Oak chose you, {name}",
                heroName,
              )}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              {named
                ? "The valley is even. Your tree is still there."
                : won
                  ? "The Lizard King is gone. The vale is still wide."
                  : "Your house is the tree. Oakstead is down the road. Three jewels lock a moon door in the castle."}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button variant="ghost" size="sm" onClick={setScreenTitle}>
              Title
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                toggleMute();
                sfx.ok();
              }}
            >
              {muted ? "Sound off" : "Sound on"}
            </Button>
          </div>
        </div>

        <section className="panel mt-6 rounded-xl p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.16em] text-[#e8d48a] uppercase">Hearts</p>
              <p className="font-display text-2xl font-semibold">{Math.round(maxHp / 4)}</p>
            </div>
            <div className="text-right">
              <Hearts hp={hp} max={maxHp} extra={useGame.getState().heartsExtra ?? 0} />
              <div className="mt-2">
                <Rupees n={coins} />
              </div>
              <div className="mt-2 flex justify-end">
                <GemRow gems={gems} />
              </div>
              <p className="tabular mt-1 text-xs text-muted">
                Until the next heart {bar.current}/{bar.needed}
              </p>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-elevated">
            <div
              className="hp-fill h-full bg-accent"
              style={{ width: `${(bar.current / bar.needed) * 100}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="ml-auto text-xs text-subtle">Band {grade}</span>
          </div>
        </section>

        <div className="panel mt-4 rounded-xl px-4 py-3">
          <FairyHint text={talk(
            named
              ? "The valley is safe. Your tree still has the lamp."
              : won
                ? "The king fell. Come home when you want soup."
                : gemsPlaced.length >= 3
                  ? "The jewels sit in the castle. The Lizard King is in the round hall."
                  : gems.emerald && gems.ruby && gems.sapphire
                    ? "You have all three. Take them to the castle."
                    : "Wren. Cole. Holt. They talk if you stand still.",
            heroName,
          )} />
        </div>

        {heardTales(metNpcs).length > 0 ? (
          <section className="panel mt-4 rounded-xl px-4 py-3">
            <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Heard in the Vale</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted">
              {heardTales(metNpcs).map((t) => (
                <li key={t}>— {t}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-6 max-w-md">
          <button
            type="button"
            className="panel w-full rounded-xl px-5 py-4 text-left"
            onClick={() => {
              sfx.open();
              enterWorld("meadow");
            }}
          >
            <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Some Meadow</p>
            <p className="font-display mt-1 text-2xl font-semibold">Open the vale</p>
            <p className="mt-1 text-sm text-muted">The oak. The road. Oakstead.</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function WorldCard({
  id,
  locked,
  done,
  onEnter,
}: {
  id: WorldId;
  locked: boolean;
  done: boolean;
  onEnter: () => void;
}) {
  const meta = WORLD_META[id];
  return (
    <article className="panel overflow-hidden rounded-xl">
      <div className="relative h-32">
        <img src={meta.bg} alt="" className="size-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-surface to-transparent" />
        {done && (
          <span className="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-ok text-bg">
            <Check className="size-4" strokeWidth={2.2} />
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs tracking-wide text-muted uppercase">{meta.region}</p>
        <h2 className="font-display mt-1 text-xl font-semibold">{meta.name}</h2>
        <p className="mt-2 text-xs leading-relaxed text-subtle">{meta.stone}</p>
        <Button
          className="mt-4 min-h-12 w-full"
          variant={locked ? "outline" : "accent"}
          disabled={locked}
          onClick={() => {
            if (locked) sfx.locked();
            else onEnter();
          }}
        >
          {locked ? (
            <span className="inline-flex items-center gap-2">
              <Lock className="size-3.5" /> Locked
            </span>
          ) : (
            "Enter"
          )}
        </Button>
      </div>
    </article>
  );
}
