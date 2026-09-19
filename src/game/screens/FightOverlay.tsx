import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScratchPad, type ScratchPadHandle } from "../components/ScratchPad";
import { sfx } from "../audio";
import { answersMatch, makeProblem } from "../math";
import { useGame } from "../store";
import type { MathProblem } from "../types";
import { live } from "../world3d/live";
import { puffAt } from "../world3d/fx";

export function FightOverlay() {
  const combat = useGame((s) => s.combat);
  const doorQuiz = useGame((s) => s.doorQuiz);
  const grade = useGame((s) => s.grade);
  const mathRung = useGame((s) => s.mathRung);
  const noteMath = useGame((s) => s.noteMath);
  const lastResult = useGame((s) => s.lastResult);
  const solveTry = useGame((s) => s.solveTry);
  const solveDoor = useGame((s) => s.solveDoor);
  const cancelQuiz = useGame((s) => s.cancelQuiz);
  const finishCast = useGame((s) => s.finishCast);
  const finishEnemy = useGame((s) => s.finishEnemy);
  const abandonCombat = useGame((s) => s.abandonCombat);
  const [problem, setProblem] = useState<MathProblem>(() => makeProblem(grade, mathRung));
  const [typed, setTyped] = useState("");
  const [flash, setFlash] = useState<"ok" | "miss" | null>(null);
  const [shownAnswer, setShownAnswer] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const padRef = useRef<ScratchPadHandle>(null);
  const prev = useRef("boot");

  const solving = Boolean(doorQuiz) || combat?.phase === "solve";
  const triesLeft = doorQuiz?.tries ?? combat?.triesLeft ?? 2;

  const pad = typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0);

  useEffect(() => {
    const key = doorQuiz ? `door-${doorQuiz.kind}-${doorQuiz.houseId}-${doorQuiz.need ?? 1}` : combat?.phase === "solve" ? "combat-solve" : "boot";
    if (solving && prev.current !== key) {
      setProblem(makeProblem(grade, useGame.getState().mathRung));
      setTyped("");
      setFlash(null);
      setShownAnswer(null);
      if (!pad) window.setTimeout(() => inputRef.current?.focus(), 50);
    }
    prev.current = key;
  }, [combat?.phase, doorQuiz?.kind, doorQuiz?.houseId, doorQuiz?.need, grade, solving, pad]);

  useEffect(() => {
    if (doorQuiz || !combat) return;
    if (combat.phase === "windup") {
      sfx.hiss();
      const t = window.setTimeout(() => {
        const c = useGame.getState().combat;
        if (c?.phase === "windup") useGame.setState({ combat: { ...c, phase: "solve", log: `${c.encounter.enemy.name} snaps. Prove the swing.` } });
      }, 520);
      return () => window.clearTimeout(t);
    }
    if (combat.phase === "cast") {
      sfx.swing();
      live.spark = Math.max(live.spark, 1.1);
      const t = window.setTimeout(() => useGame.getState().finishCast(), 720);
      return () => window.clearTimeout(t);
    }
    if (combat.phase === "enemy") {
      sfx.hiss();
      const t = window.setTimeout(() => useGame.getState().finishEnemy(), 900);
      return () => window.clearTimeout(t);
    }
    if (combat.phase === "ended") {
      if (lastResult === "win") sfx.win();
      const t = window.setTimeout(() => useGame.getState().abandonCombat(), 1500);
      return () => window.clearTimeout(t);
    }
  }, [combat?.phase, doorQuiz, lastResult, finishCast, finishEnemy, abandonCombat]);

  if (!combat && !doorQuiz) return null;
  const phase = doorQuiz ? "solve" : combat?.phase;
  const tag = combat?.tag;
  const log = combat?.log;
  if (!doorQuiz && phase !== "solve" && phase !== "windup" && phase !== "cast" && phase !== "enemy" && !tag && phase !== "ended") return null;

  function submit() {
    if (phase !== "solve" || flash || shownAnswer) return;
    const ok = answersMatch(typed, problem.answer);
    setFlash(ok ? "ok" : "miss");
    if (ok) {
      sfx.ok();
      noteMath(true);
      live.spark = Math.max(live.spark, 1.4);
      puffAt(live.x, live.z, live.y + 1.1, true);
      window.setTimeout(() => {
        setFlash(null);
        if (doorQuiz) solveDoor(true);
        else solveTry(true);
      }, 280);
      return;
    }
    sfx.miss();
    noteMath(false);
    setShownAnswer(String(problem.answer));
    window.setTimeout(() => {
      setShownAnswer(null);
      setFlash(null);
      setTyped("");
      padRef.current?.clear();
      setProblem(makeProblem(grade, useGame.getState().mathRung));
      if (doorQuiz) solveDoor(false);
      else solveTry(false);
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }, 1700);
  }

  return (
    <>
      {tag && phase !== "solve" ? (
        <p
          className={`pointer-events-none absolute top-1/3 left-1/2 z-40 -translate-x-1/2 font-display text-5xl tracking-wide ${
            tag === "crit" ? "text-[#f0c040]" : tag === "fumble" ? "text-[#d06050]" : tag === "dodge" ? "text-[#80c8f0]" : "text-white"
          }`}
        >
          {tag === "crit" ? "CRITICAL!" : tag === "fumble" ? "FUMBLE!" : tag === "dodge" ? "DODGE!" : ""}
        </p>
      ) : null}
      {phase !== "solve" && log ? (
        <p className="pointer-events-none absolute bottom-28 left-1/2 z-30 w-[min(92vw,28rem)] -translate-x-1/2 text-center text-sm text-white/85">
          {log}
        </p>
      ) : null}
      {phase === "ended" && lastResult === "win" ? (
        <p className="pointer-events-none absolute top-[42%] left-1/2 z-40 -translate-x-1/2 font-display text-3xl text-[#f3e2a0]">
          The lizard falls!
        </p>
      ) : null}

      {phase === "solve" ? (
        <div className={`scratch-veil pointer-events-auto absolute inset-0 z-50 flex flex-col bg-[#f6f1e6] ${flash === "ok" ? "ring-8 ring-[#6a9b6e]/70" : flash === "miss" ? "ring-8 ring-[#c45c4a]/40" : ""}`}>
          <p className="pointer-events-none absolute top-4 left-1/2 z-40 w-[min(72vw,28rem)] -translate-x-1/2 px-4 text-center text-[11px] tracking-[0.16em] text-stone-500 uppercase">
            {doorQuiz?.kind === "heart"
              ? "Prove a heart"
              : doorQuiz?.kind === "pack"
                ? "Prove you can open the backpack"
              : doorQuiz?.kind === "fish"
                ? "A nibble on the line"
              : doorQuiz?.kind === "shake"
                ? "Prove you can shake"
              : doorQuiz?.kind === "shroom"
                ? "Prove you can pick"
              : doorQuiz?.kind === "talk"
                ? doorQuiz.need && doorQuiz.need > 1
                  ? `They wait — ${doorQuiz.need} proofs`
                  : "They wait for a proof"
              : doorQuiz?.kind === "boss"
                ? doorQuiz.need && doorQuiz.need > 1
                  ? `Rook waits — ${doorQuiz.need} proofs`
                  : "Rook waits for a proof"
              : doorQuiz?.kind === "host"
                ? "Pell waits for a proof"
              : doorQuiz?.kind === "read"
                ? "The writing waits for a proof"
              : doorQuiz?.kind === "climb"
                ? doorQuiz.need && doorQuiz.need > 1
                  ? `The light waits — ${doorQuiz.need} proofs`
                  : "The light waits for a proof"
              : doorQuiz?.kind === "mail"
                ? "The mailbox waits for a proof"
              : doorQuiz?.kind === "menu"
                ? "The menu waits for a proof"
              : doorQuiz?.kind === "chest"
                ? doorQuiz.need && doorQuiz.need > 1
                  ? `The chest waits — ${doorQuiz.need} proofs`
                  : "The chest waits for a proof"
                : doorQuiz
                  ? doorQuiz.need && doorQuiz.need > 1
                    ? `The door waits — ${doorQuiz.need} proofs`
                    : "The door waits for a proof"
                  : problem.topic}
            {doorQuiz?.kind === "heart"
              ? " · right for a heart. Wrong — try again"
              : doorQuiz?.kind === "pack"
                ? " · two tries. Then the pack opens"
              : doorQuiz?.kind === "fish"
                ? " · right to catch. Wrong — it may get away"
                : doorQuiz?.kind === "shake" || doorQuiz?.kind === "shroom"
                  ? " · right first. Then hit F again"
                  : doorQuiz?.kind === "talk" || doorQuiz?.kind === "read" || doorQuiz?.kind === "climb" || doorQuiz?.kind === "mail" || doorQuiz?.kind === "menu" || doorQuiz?.kind === "host" || doorQuiz?.kind === "boss"
                    ? " · two tries"
                    : ` · try ${3 - triesLeft} of 2`}
          </p>
          {doorQuiz?.kind === "heart" ||
          doorQuiz?.kind === "pack" ||
          doorQuiz?.kind === "fish" ||
          doorQuiz?.kind === "shake" ||
          doorQuiz?.kind === "shroom" ||
          doorQuiz?.kind === "talk" ||
          doorQuiz?.kind === "read" ||
          doorQuiz?.kind === "climb" ||
          doorQuiz?.kind === "mail" ||
          doorQuiz?.kind === "menu" ||
          doorQuiz?.kind === "host" ||
          doorQuiz?.kind === "boss" ? (
            <button
              type="button"
              className="absolute top-3 left-3 z-50 flex h-12 w-12 items-center justify-center rounded-md border-2 border-stone-900 bg-white pt-1 text-3xl leading-none font-bold text-stone-900 shadow-lg"
              aria-label="Close"
              onClick={() => {
                sfx.select();
                cancelQuiz();
              }}
            >
              ×
            </button>
          ) : null}
          <div className={`relative min-h-0 ${pad ? "flex-[0.9]" : "flex-1"}`}>
            {pad ? null : <ScratchPad ref={padRef} key={problem.prompt} />}
            <div className={`pointer-events-none absolute inset-0 z-20 flex justify-center ${pad ? "items-center pt-8" : "pt-20 sm:pt-24"}`}>
              {shownAnswer ? (
                <div className="px-8 text-center">
                  <p className="text-sm tracking-[0.16em] text-stone-500 uppercase">The answer was</p>
                  <p className="font-display mt-2 text-6xl font-semibold text-stone-900 tabular">{shownAnswer}</p>
                  <p className="mt-3 text-sm text-stone-500">That’s okay. Try the next one.</p>
                </div>
              ) : problem.stack ? (
                <ColumnSum stack={problem.stack} />
              ) : (
                <p className={`font-display px-8 text-center font-semibold text-stone-900 ${pad ? "text-5xl" : "text-4xl"}`}>{problem.prompt}</p>
              )}
            </div>
          </div>
          <form
            className="flex flex-col gap-2 border-t border-stone-300/70 bg-white/80 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {pad ? (
              <div className="grid grid-cols-3 gap-1.5">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "0", "."].map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="min-h-14 rounded-md border-2 border-stone-900 bg-white text-xl font-semibold text-stone-900 active:bg-[#e8d48a]"
                    onClick={() => {
                      if (k === "-") setTyped((t) => (t.startsWith("-") ? t.slice(1) : `-${t}`.slice(0, 12)));
                      else setTyped((t) => (t + k).slice(0, 12));
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex gap-2">
            {pad ? null : (
            <Button
              type="button"
              size="lg"
              variant="primary"
              className="min-h-12 min-w-16 shrink-0 border-2 border-stone-900 bg-[#1a1410] px-3 text-base font-semibold text-[#f6f1e6] hover:bg-stone-800"
              onClick={() => padRef.current?.clear()}
            >
              Wipe
            </Button>
            )}
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              readOnly={pad}
              aria-label="Your answer"
              placeholder={pad ? "Tap numbers" : "Type the answer"}
              className={`min-h-12 flex-1 rounded-md border bg-white px-3 text-lg text-stone-900 tabular outline-none ${
                flash === "ok" ? "border-ok" : flash === "miss" ? "border-danger" : "border-stone-300 focus:border-stone-700"
              }`}
            />
            {pad ? (
              <Button
                type="button"
                size="lg"
                className="min-h-12 min-w-14 shrink-0 border-2 border-stone-900 bg-white px-3 text-lg font-semibold text-stone-900"
                onClick={() => setTyped((t) => t.slice(0, -1))}
              >
                ⌫
              </Button>
            ) : null}
            <Button type="submit" size="lg" variant="primary" disabled={Boolean(flash) || Boolean(shownAnswer)} className="min-h-12 min-w-24">
              Prove
            </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
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
