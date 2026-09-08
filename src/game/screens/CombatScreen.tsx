import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { ScratchPad, type ScratchPadHandle } from "../components/ScratchPad";
import { Hearts } from "../components/Hud";
import { sfx } from "../audio";
import { WORLD_META, SPELLS, playerMaxHp, talk, weaponById } from "../content";
import { answersMatch, makeProblem } from "../math";
import { unlockedSpells, useGame } from "../store";
import type { MathProblem, Spell } from "../types";
import type { FighterAct } from "../world3d/actors";
import type { CombatStageProps } from "./CombatStage";

export function CombatScreen() {
  const combat = useGame((s) => s.combat);
  const grade = useGame((s) => s.grade);
  const mathRung = useGame((s) => s.mathRung);
  const noteMath = useGame((s) => s.noteMath);
  const xp = useGame((s) => s.xp);
  const outfit = useGame((s) => s.outfit);
  const weapon = useGame((s) => s.weapon);
  const heroName = useGame((s) => s.heroName);
  const lastResult = useGame((s) => s.lastResult);
  const chooseSpell = useGame((s) => s.chooseSpell);
  const solveTry = useGame((s) => s.solveTry);
  const finishCast = useGame((s) => s.finishCast);
  const finishEnemy = useGame((s) => s.finishEnemy);
  const abandonCombat = useGame((s) => s.abandonCombat);
  const [problem, setProblem] = useState<MathProblem>(() => makeProblem(grade, mathRung));
  const [typed, setTyped] = useState("");
  const [flash, setFlash] = useState<"ok" | "miss" | null>(null);
  const [motion, setMotion] = useState<"idle" | "lunge" | "hurt" | "foehit">("idle");
  const [splash] = useState(false);
  const [slam, setSlam] = useState(false);
  const [foeHop, setFoeHop] = useState(false);
  const [foeSlam, setFoeSlam] = useState(false);
  const [foeStrike, setFoeStrike] = useState(false);
  const [heroDash, setHeroDash] = useState(0);
  const [foeDash, setFoeDash] = useState(0);
  const [Stage, setStage] = useState<ComponentType<CombatStageProps> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const padRef = useRef<ScratchPadHandle>(null);

  const ownedWeapons = useGame((s) => s.ownedWeapons);
  const spells = useMemo(() => unlockedSpells(xp, ownedWeapons), [xp, ownedWeapons]);
  const gear = weaponById(weapon);

  const prevPhase = useRef<string>("boot");

  useEffect(() => {
    if (combat?.phase === "solve" && prevPhase.current !== "solve") {
      setProblem(makeProblem(grade, useGame.getState().mathRung));
      setTyped("");
      setFlash(null);
    }
    prevPhase.current = combat?.phase ?? "boot";
  }, [combat?.phase, grade]);

  useEffect(() => {
    let live = true;
    void import("./CombatStage").then((m) => {
      if (live) setStage(() => m.CombatStage);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (combat?.phase === "cast") {
      setMotion("lunge");
      setSlam(false);
      setHeroDash(1);
      setFoeDash(0);
      sfx.jump();
      const hop = window.setTimeout(() => {
        setSlam(true);
        sfx.thud();
        sfx.swing();
        sfx.hit();
      }, 380);
      const t = window.setTimeout(() => {
        setMotion("foehit");
        sfx.hit();
        finishCast();
        setHeroDash(0);
      }, 1100);
      return () => {
        window.clearTimeout(hop);
        window.clearTimeout(t);
      };
    }
    if (combat?.phase === "enemy") {
      setFoeHop(false);
      setFoeSlam(false);
      setFoeStrike(false);
      setFoeDash(1);
      setHeroDash(0);
      sfx.hiss();
      const hop = window.setTimeout(() => {
        setFoeSlam(true);
        sfx.thud();
      }, 380);
      const strike = window.setTimeout(() => {
        setFoeStrike(true);
        setMotion("hurt");
        sfx.hit();
      }, 560);
      const t = window.setTimeout(() => {
        finishEnemy();
        setMotion("idle");
        setFoeHop(false);
        setFoeSlam(false);
        setFoeStrike(false);
        setFoeDash(0);
      }, 1200);
      return () => {
        window.clearTimeout(hop);
        window.clearTimeout(strike);
        window.clearTimeout(t);
      };
    }
    if (combat?.phase === "ended" && lastResult === "win") sfx.win();
    if (combat?.phase === "solve") {
      setMotion("idle");
      setSlam(false);
      setFoeHop(false);
      setFoeSlam(false);
      setFoeStrike(false);
      setHeroDash(0);
      setFoeDash(0);
    }
    return undefined;
  }, [combat?.phase, finishCast, finishEnemy, lastResult]);

  if (!combat) return null;
  const { encounter, playerHp, enemyHp, phase, log, triesLeft } = combat;
  const enemy = encounter.enemy;
  const world = WORLD_META[encounter.worldId];
  const playerMax = playerMaxHp(xp, outfit, useGame.getState().heartsExtra ?? 0);
  const ended = phase === "ended";
  const battleBg = world.bg.replace("overworld", "battle");
  const heroAct: FighterAct =
    slam && motion === "lunge" ? "slam" : motion === "hurt" ? "hurt" : "idle";
  const foeAct: FighterAct = foeSlam && !foeStrike ? "slam" : motion === "foehit" ? "hurt" : "idle";

  function submit() {
    if (!problem || phase !== "solve" || flash) return;
    const ok = answersMatch(typed, problem.answer);
    setFlash(ok ? "ok" : "miss");
    noteMath(ok);
    if (ok) sfx.ok();
    else sfx.miss();
    window.setTimeout(() => {
      setFlash(null);
      if (!ok) setTyped("");
      solveTry(ok);
    }, 380);
  }

  return (
    <div className="relative isolate flex h-full flex-col overflow-hidden">
      <img src={battleBg} alt="" className="absolute inset-0 size-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-[#0c0b09]/70" />
      {Stage ? (
        <Stage
          enemyKind={enemy.sprite === "boss" ? "remainder" : enemy.sprite}
          heroAct={heroAct}
          foeAct={foeAct}
          boss={enemy.boss}
          element={SPELLS.find((s) => s.id === combat.selected)?.element}
          bolt={phase === "cast" && slam}
          heroDash={heroDash}
          foeDash={foeDash}
          slow={false}
        />
      ) : null}

      <div className="relative z-10 flex items-start justify-between gap-3 px-4 pt-4">
        <FighterStat name={talk("{name}", heroName)} hp={playerHp} max={playerMax} />
        <FighterStat
          name={enemy.name}
          hp={enemyHp}
          max={enemy.maxHp}
          flip
          note={`Fears ${enemy.weak} · shrugs ${enemy.resist}`}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10">
        {phase === "cast" && slam ? (
          <SpellVfx element={SPELLS.find((s) => s.id === combat.selected)?.element} />
        ) : null}
        {motion === "foehit" ? (
          <span className={`spell-boom ${SPELLS.find((s) => s.id === combat.selected)?.element ?? "leaf"}`} />
        ) : null}
        {foeStrike ? <span className="spell-boom dark hero-hit" /> : null}
      </div>

      <div className="relative z-10 min-h-0 flex-1" />

      <div className="relative z-10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="panel mx-auto max-w-2xl rounded-xl p-4 sm:p-5">
          <p className="text-sm leading-relaxed text-muted">{log}</p>
          <p className="mt-1 text-[11px] tracking-wide text-subtle">
            {gear.name} · {gear.element} +{gear.atk} atk
          </p>

          {phase === "solve" && !typed ? null : null}

          {phase === "cast" && (
            <p className="font-display mt-4 text-lg text-[#e8d48a]">
              {talk("{name} runs in — the sword hits!", heroName)}
            </p>
          )}
          {phase === "enemy" && (
            <p className="font-display mt-4 text-lg">The grey lizard runs in and scratches you.</p>
          )}

          {ended && lastResult === "win" ? (
            <div className="item-get mt-4 text-center">
              <p className="text-[11px] tracking-[0.2em] text-[#e8d48a] uppercase">You got</p>
              <p className="font-display mt-1 text-2xl text-[#f3e2a0]">{world.stone}</p>
            </div>
          ) : null}

          {ended && (
            <Button
              className="mt-4 w-full"
              variant="accent"
              onClick={() => {
                if (lastResult === "win") sfx.coin();
                abandonCombat();
              }}
            >
              {lastResult === "win"
                ? `Return to the field${combat.coinsWon ? ` · +${combat.coinsWon} rupees` : ""}`
                : "Retreat"}
            </Button>
          )}
        </div>
      </div>

      {phase === "solve" ? (
        <div className="scratch-veil pointer-events-auto absolute inset-0 z-50 flex flex-col bg-[#f6f1e6]">
          <p className="pointer-events-none absolute top-4 left-5 z-40 text-[11px] tracking-[0.16em] text-stone-500 uppercase">
            {problem.topic} · try {3 - triesLeft} of 2
          </p>
          <div className="relative min-h-0 flex-1">
            <ScratchPad ref={padRef} key={problem.prompt} />
            <div className="pointer-events-none absolute inset-0 flex justify-center pt-20 sm:pt-24">
              {problem.stack ? (
                <ColumnSum stack={problem.stack} />
              ) : (
                <p className="font-display px-8 text-center text-4xl font-semibold text-stone-900">
                  {problem.prompt}
                </p>
              )}
            </div>
          </div>
          <form
            className="flex gap-2 border-t border-stone-300/70 bg-white/80 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Button
              type="button"
              size="lg"
              variant="primary"
              className="min-h-12 min-w-28 shrink-0 border-2 border-stone-900 bg-[#1a1410] px-4 text-base font-semibold text-[#f6f1e6] hover:bg-stone-800"
              onClick={() => padRef.current?.clear()}
            >
              Wipe pad
            </Button>
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Your answer"
              placeholder="Type the answer"
              className={`min-h-12 flex-1 rounded-md border bg-white px-3 text-lg text-stone-900 tabular outline-none ${
                flash === "ok"
                  ? "border-ok"
                  : flash === "miss"
                    ? "border-danger"
                    : "border-stone-300 focus:border-stone-700"
              }`}
            />
            <Button type="submit" size="lg" variant="primary" disabled={Boolean(flash)}>
              Prove
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function ColumnSum({ stack }: { stack: { top: string; bot: string; op: string } }) {
  const w = Math.max(stack.top.length, stack.bot.length);
  const top = stack.top.padStart(w, " ");
  const bot = stack.bot.padStart(w, " ");
  return (
    <div className="select-none text-stone-900">
      <p className="mb-10 text-center text-sm text-stone-500">Write carries up here · answer under the line</p>
      <div className="font-mono text-5xl leading-[1.15] font-semibold tracking-[0.55em] sm:text-6xl">
        <p className="text-right whitespace-pre">{top}</p>
        <p className="flex items-baseline justify-end gap-3">
          <span className="tracking-normal">{stack.op}</span>
          <span className="whitespace-pre">{bot}</span>
        </p>
        <div className="mt-2 border-t-[5px] border-stone-900" />
        <div className="h-28" />
      </div>
    </div>
  );
}

function SpellVfx({ element }: { element?: string }) {
  const el = element ?? "leaf";
  if (el === "leaf") {
    return (
      <div className="spell-stage" aria-hidden>
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} className={`leaf-bit n${i % 7}`} />
        ))}
      </div>
    );
  }
  if (el === "fire") {
    return (
      <div className="spell-stage" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className={`ember-bit n${i % 6}`} />
        ))}
      </div>
    );
  }
  if (el === "ice") {
    return (
      <div className="spell-stage" aria-hidden>
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} className={`ice-bit n${i % 5}`} />
        ))}
      </div>
    );
  }
  if (el === "storm") {
    return (
      <div className="spell-stage" aria-hidden>
        <span className="storm-flash" />
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className={`storm-bit n${i % 4}`} />
        ))}
      </div>
    );
  }
  return (
    <div className="spell-stage" aria-hidden>
      <span className={`spell-bolt ${el}`} />
    </div>
  );
}

function FighterStat({
  name,
  hp,
  max,
  flip,
  note,
}: {
  name: string;
  hp: number;
  max: number;
  flip?: boolean;
  note?: string;
}) {
  return (
    <div className={`panel min-w-36 rounded-lg px-3 py-2 ${flip ? "text-right" : ""}`}>
      <p className="font-display text-sm font-semibold">{name}</p>
      {note ? <p className="mt-0.5 text-[10px] tracking-wide text-[#e8d48a] uppercase">{note}</p> : null}
      <div className={`mt-1 ${flip ? "flex justify-end" : ""}`}>
        <Hearts hp={hp} max={max} size={13} />
      </div>
      <p className="tabular mt-1 text-[11px] text-muted">
        {hp}/{max}
      </p>
    </div>
  );
}

function SpellButton({ spell, onPick }: { spell: Spell; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`spell-slot spell-${spell.element ?? "none"} rounded-md px-3 py-3 text-left`}
    >
      <span className="block text-sm font-semibold">{spell.name}</span>
      {spell.element ? (
        <span className="mt-0.5 block text-[10px] tracking-wide text-[#e8d48a] uppercase">{spell.element}</span>
      ) : null}
      <span className="mt-0.5 block text-xs text-muted">{spell.hint}</span>
    </button>
  );
}
