import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  WORLD_META,
  FIRST_ARC,
  SECOND_ARC,
  THIRD_ARC,
  crystalGoal,
  levelFromXp,
  playerMaxHp,
  talk,
  xpIntoLevel,
} from "../content";
import { playTheme, sfx, setMuted } from "../audio";
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
  const level = levelFromXp(xp);
  const maxHp = playerMaxHp(xp, outfit, useGame.getState().heartsExtra ?? 0);
  const bar = xpIntoLevel(xp);

  useEffect(() => {
    setMuted(muted);
    playTheme("field");
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
                ? "The last of his magic is gone. A horse waits in the meadow. The Arena is still there if you want a fight that does not end."
                : leftoverNamed
                  ? "You beat the last hall — then the magic split. Five quiet temples. High Ridge first. Then Clock Tower, Glass Swamp, Thunder Hollow, Crown Cave."
                  : won
                    ? "The Lizard King is gone. A horse waits in the meadow. His magic hid in five places. Forest, fire, water, night, sand."
                    : "Find the Sun Jewel in the meadow, the Fire Jewel in the cave, and the Water Jewel in the swamp. Put them in the castle. Then stop the Lizard King."}
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
              <p className="text-xs tracking-[0.16em] text-[#e8d48a] uppercase">Hero</p>
              <p className="font-display text-2xl font-semibold">Level {level}</p>
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
                {bar.current}/{bar.needed} wisdom
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
              ? "The valley is safe. Ride. Walk. The Arena is still there."
              : leftoverNamed
                ? cleared.includes("hollow")
                  ? "Four quiet temples are done. Crown Cave has opened."
                  : "The magic split again. High Ridge first. Then Clock Tower, Glass Swamp, Thunder Hollow, Crown Cave."
              : won
                ? cleared.includes("waste")
                  ? "Five places are done. The Last Hall has opened."
                  : "His magic hid. Green Forest first. Then Fire Mountain, Blue Lake, Night Grave, Sand Land."
                : gemsPlaced.length >= 3
                  ? "The jewels sit in the castle. The Lizard King is waiting."
                  : gems.emerald && gems.ruby && gems.sapphire
                    ? "You have all three. Take them to the castle."
                    : "Sun jewel in the meadow. Fire jewel in the cave. Water jewel in the swamp. Then the castle.",
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

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {FIRST_ARC.map((id) => (
            <WorldCard
              key={id}
              id={id}
              locked={!worldUnlocked(id, cleared, gems)}
              done={cleared.includes(id)}
              onEnter={() => {
                sfx.open();
                enterWorld(id);
              }}
            />
          ))}
        </div>

        {won ? (
          <section className="mt-6">
            <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">The leftover temples</p>
            <p className="mt-1 text-sm text-muted">Five places. Then the Last Hall.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {SECOND_ARC.map((id) => (
                <WorldCard
                  key={id}
                  id={id}
                  locked={!worldUnlocked(id, cleared, gems)}
                  done={cleared.includes(id)}
                  onEnter={() => {
                    sfx.open();
                    enterWorld(id);
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}

        {leftoverNamed ? (
          <section className="mt-6">
            <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">The silent temples</p>
            <p className="mt-1 text-sm text-muted">Five borrowed proofs. Then the Crown Vault.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {THIRD_ARC.map((id) => (
                <WorldCard
                  key={id}
                  id={id}
                  locked={!worldUnlocked(id, cleared, gems)}
                  done={cleared.includes(id)}
                  onEnter={() => {
                    sfx.open();
                    enterWorld(id);
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-4 max-w-sm">
          <WorldCard
            id="arena"
            locked={!worldUnlocked("arena", cleared, gems)}
            done={cleared.includes("arena")}
            onEnter={() => {
              sfx.open();
              enterWorld("arena");
            }}
          />
        </div>

        {won ? (
          <section className="panel mt-6 rounded-xl p-4">
            <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Still in the Vale</p>
            <p className="font-display mt-1 text-xl font-semibold">
              {named ? "The story ended. The walking did not." : leftoverNamed ? "You won the last hall. Five quiet temples still wait." : "The king fell. His magic did not."}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              <li>— Crystals {digits}/{crystalGoal()} (hidden in every temple)</li>
              <li>— Five far places, then the Last Hall. Then five quiet temples, then Crown Cave.</li>
              <li>— Extra lizards walk old fields after you finish a place.</li>
              {named ? <li>— The last scrap is gone. The horse is still in the meadow if you want her.</li> : leftoverNamed ? <li>— Crown Cave opens after High Ridge, Clock Tower, Glass Swamp, and Thunder Hollow.</li> : <li>— The Last Hall opens after all five far places.</li>}
              {hasHorse ? <li>— Your horse waits west of the cedar chest. Walk up and Ride.</li> : <li>— Ash in the paddock hall will hand you a blade. A cedar on the keep road hides another. A horse waits just west of that chest.</li>}
            </ul>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <WorldCard
                id="echo"
                locked={!worldUnlocked("echo", cleared, gems)}
                done={cleared.includes("echo")}
                onEnter={() => {
                  sfx.open();
                  enterWorld("echo");
                }}
              />
              {leftoverNamed ? (
                <WorldCard
                  id="vault"
                  locked={!worldUnlocked("vault", cleared, gems)}
                  done={cleared.includes("vault")}
                  onEnter={() => {
                    sfx.open();
                    enterWorld("vault");
                  }}
                />
              ) : null}
            </div>
          </section>
        ) : null}
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
