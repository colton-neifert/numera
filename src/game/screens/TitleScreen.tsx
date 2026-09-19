import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { GRADES, cleanName } from "../content";
import { sfx, unlockAudio, playTheme } from "../audio";
import { introMood } from "../intro/mood";
import { PROLOGUE } from "../story";
import { ForgeCinema } from "../intro/ForgeCinema";
import { StoryShot, shotFromVid } from "../intro/StoryShot";
import { eraseSlot, loadSlot, patchSlotHero, readSlots, startNew, type FileSlot } from "../saves";
import { useGame } from "../store";
import { BOY_LOOK, BROWS, EYE_SHAPES, HAIR_STYLES, LASHES, LOOK_OPTS, MOUTHS, NOSES } from "../looks";
import { LookCanvas } from "./LookCanvas";
import type { GradeBand } from "../types";

const BEATS = PROLOGUE;

function LookPickers() {
  const heroLook = useGame((s) => s.heroLook);
  const setHeroLook = useGame((s) => s.setHeroLook);
  const girl = useGame((s) => s.heroGender) === "girl";
  return (
    <div className="mt-4 space-y-3 pr-1">
      {(
        [
          ["hair", "Hair"],
          ["skin", "Skin"],
          ["eyes", "Eyes"],
          ["tunic", "Clothes"],
          ["pants", "Pants"],
          ["boots", "Boots"],
        ] as const
      ).map(([key, label]) => (
        <div key={key}>
          <p className="text-[11px] tracking-[0.16em] text-white/45 uppercase">{label}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {LOOK_OPTS[key].map((opt) => {
              const on = (heroLook?.[key] ?? "") === opt.hex;
              return (
                <button
                  key={opt.name}
                  type="button"
                  title={opt.name}
                  onClick={() => {
                    sfx.select();
                    setHeroLook({ [key]: opt.hex });
                  }}
                  className={`size-10 rounded-full border-2 ${on ? "border-white" : "border-white/20"}`}
                  style={{ background: opt.hex }}
                />
              );
            })}
          </div>
        </div>
      ))}
      <div>
        <p className="text-[11px] tracking-[0.16em] text-white/45 uppercase">Hair style</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {HAIR_STYLES.map((opt) => {
            const on = (heroLook?.hairStyle ?? "fluffy") === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  sfx.select();
                  setHeroLook({ hairStyle: opt.id });
                }}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  on ? "border-white bg-white/15 text-white" : "border-white/20 bg-white/5 text-white/70"
                }`}
              >
                {opt.name}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-[11px] tracking-[0.16em] text-white/45 uppercase">Eye shape</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {EYE_SHAPES.map((opt) => {
            const on = (heroLook?.eyeShape ?? "round") === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  sfx.select();
                  setHeroLook({ eyeShape: opt.id });
                }}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  on ? "border-white bg-white/15 text-white" : "border-white/20 bg-white/5 text-white/70"
                }`}
              >
                {opt.name}
              </button>
            );
          })}
        </div>
      </div>
      {girl ? (
        <div>
          <p className="text-[11px] tracking-[0.16em] text-white/45 uppercase">Eyelashes</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {LASHES.map((opt) => {
              const on = (heroLook?.lashes ?? "long") === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    sfx.select();
                    setHeroLook({ lashes: opt.id });
                  }}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    on ? "border-white bg-white/15 text-white" : "border-white/20 bg-white/5 text-white/70"
                  }`}
                >
                  {opt.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div>
        <p className="text-[11px] tracking-[0.16em] text-white/45 uppercase">Eyebrows</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {BROWS.map((opt) => {
            const on = (heroLook?.brows ?? "neutral") === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  sfx.select();
                  setHeroLook({ brows: opt.id });
                }}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  on ? "border-white bg-white/15 text-white" : "border-white/20 bg-white/5 text-white/70"
                }`}
              >
                {opt.name}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-[11px] tracking-[0.16em] text-white/45 uppercase">Nose</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {NOSES.map((opt) => {
            const on = (heroLook?.nose ?? "round") === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  sfx.select();
                  setHeroLook({ nose: opt.id });
                }}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  on ? "border-white bg-white/15 text-white" : "border-white/20 bg-white/5 text-white/70"
                }`}
              >
                {opt.name}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-[11px] tracking-[0.16em] text-white/45 uppercase">Mouth</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {MOUTHS.map((opt) => {
            const on = (heroLook?.mouth ?? "line") === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  sfx.select();
                  setHeroLook({ mouth: opt.id });
                }}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  on ? "border-white bg-white/15 text-white" : "border-white/20 bg-white/5 text-white/70"
                }`}
              >
                {opt.name}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-[11px] tracking-[0.16em] text-white/45 uppercase">Blush</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {LOOK_OPTS.blush.map((opt) => {
            const on = (heroLook?.blush ?? "") === opt.hex;
            return (
              <button
                key={opt.name}
                type="button"
                title={opt.name}
                onClick={() => {
                  sfx.select();
                  setHeroLook({
                    blush: opt.hex,
                    blushAmt: opt.hex ? heroLook?.blushAmt || 0.72 : 0,
                  });
                }}
                className={`size-8 rounded-full border-2 ${on ? "border-white" : "border-white/20"} ${
                  opt.hex ? "" : "bg-white/10"
                }`}
                style={opt.hex ? { background: opt.hex } : undefined}
              />
            );
          })}
        </div>
        {heroLook?.blush ? (
          <label className="mt-3 block">
            <span className="text-[11px] tracking-[0.16em] text-white/45 uppercase">How dark</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((heroLook.blushAmt ?? 0.72) * 100)}
              onChange={(e) => setHeroLook({ blushAmt: Number(e.target.value) / 100 })}
              className="mt-2 h-3 w-full max-w-sm cursor-pointer accent-[#c45c68]"
            />
            <span className="mt-1 flex max-w-sm justify-between text-[10px] tracking-wide text-white/40 uppercase">
              <span>Light</span>
              <span>Dark</span>
            </span>
          </label>
        ) : null}
      </div>
    </div>
  );
}

export function TitleScreen() {
  const grade = useGame((s) => s.grade);
  const setGrade = useGame((s) => s.setGrade);
  const heroName = useGame((s) => s.heroName);
  const setHeroName = useGame((s) => s.setHeroName);
  const setHeroGender = useGame((s) => s.setHeroGender);
  const setHeroLook = useGame((s) => s.setHeroLook);
  const heroLook = useGame((s) => s.heroLook);
  const { isPending } = useCurrentUserState();
  const [beat, setBeat] = useState(0);
  const [phase, setPhase] = useState<"story" | "cinema" | "nag" | "ride" | "files" | "hero" | "look" | "year" | "edit">("ride");
  const [fade, setFade] = useState(false);
  const [draft, setDraft] = useState(heroName);
  const [slots, setSlots] = useState<FileSlot[]>([{ empty: true }, { empty: true }, { empty: true }]);
  const [file, setFile] = useState(0);
  const [kind, setKind] = useState<"boy" | "girl">("boy");
  const story = phase === "story";
  const started = useRef(false);
  const fileLock = useRef(false);

  const beginFiles = () => {
    if (started.current || phase !== "ride") return;
    started.current = true;
    try {
      unlockAudio();
      sfx.ok();
    } catch {
      /* audio must never block start */
    }
    setPhase("files");
  };

  const pickFile = (i: number, s: FileSlot) => {
    setFile(i);
    try {
      sfx.open();
    } catch {
      /* ignore */
    }
    if (s.empty) {
      setBeat(0);
      setPhase("story");
      return;
    }
    try {
      loadSlot(i);
      useGame.getState().enterWorld("meadow");
    } catch (err) {
      console.warn("load file failed", err);
      setPhase("hero");
    }
  };

  useEffect(() => {
    setSlots(readSlots());
  }, []);

  useEffect(() => {
    const w = window as Window & { __titlePhase?: (p: string) => void };
    w.__titlePhase = (p) => setPhase(p as typeof phase);
    return () => {
      delete w.__titlePhase;
    };
  }, []);

  useEffect(() => {
    introMood.playing = story;
    introMood.t = story ? beat / Math.max(1, BEATS.length - 1) : 1;
  }, [story, beat]);

  useEffect(() => {
    if (phase !== "story") return;
    setFade(false);
    const show = window.setTimeout(() => setFade(true), 80);
    const hide = window.setTimeout(() => setFade(false), 9800);
    const next = window.setTimeout(() => {
      if (beat >= BEATS.length - 1) {
        introMood.playing = false;
        introMood.t = 1;
        goAfterStory();
        return;
      }
      setBeat((b) => b + 1);
    }, 11800);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
      window.clearTimeout(next);
    };
  }, [beat, phase]);

  useEffect(() => {
    if (phase === "cinema") playTheme("chamber");
    else playTheme("none");
    return () => playTheme("none");
  }, [phase]);

  useEffect(() => {
    if (phase !== "ride") return;
    started.current = false;
    setFade(true);
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === "Tab" || k === "Shift" || k === "Meta" || k === "Control" || k === "Alt") return;
      e.preventDefault();
      beginFiles();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  function goAfterStory() {
    setPhase("cinema");
  }

  function finishCinema() {
    setPhase("hero");
  }

  function finishNag() {
    try {
      localStorage.setItem("numera-saw-nag", "1");
    } catch {
      /* ignore */
    }
    setPhase("ride");
  }

  useEffect(() => {
    if (phase !== "nag") return;
    const t = window.setTimeout(finishNag, 7200);
    return () => window.clearTimeout(t);
  }, [phase]);

  const current = BEATS[beat]!;

  return (
    <div className="relative isolate flex h-full flex-col overflow-hidden bg-black">
      <header className="relative z-40 flex items-center justify-between px-5 pt-5 pb-2">
        <p className="text-xs font-medium tracking-[0.2em] text-white/70 uppercase">
          {phase === "ride" ? "" : "The Legend of Numera"}
        </p>
        <div className="flex min-h-8 items-center gap-4">
          {isPending ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-white/10" />
          ) : (
            <>
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <Link
                  to="/login"
                  className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
                >
                  Sign in
                </Link>
              </SignedOut>
            </>
          )}
        </div>
      </header>

      {phase === "cinema" ? (
        <ForgeCinema onDone={finishCinema} />
      ) : phase === "story" ? (
        <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
          <div
            className={`max-w-xl transition-opacity duration-[1100ms] ease-in-out ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          >
            {current.vid || current.img ? (
              <StoryShot kind={shotFromVid(current.vid, current.kicker)} />
            ) : null}
            <p className="text-[11px] tracking-[0.22em] text-white/45 uppercase">
              {current.kicker}
            </p>
            {current.lines.map((line) => (
              <p
                key={line}
                className="font-display mt-3 text-2xl leading-snug font-medium tracking-tight text-white sm:text-3xl"
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      ) : phase === "files" ? (
        <div className="relative z-20 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center overflow-y-auto px-5 pb-16">
          <p className="text-[11px] tracking-[0.22em] text-white/50 uppercase">Select a file</p>
          <p className="mt-1 text-sm text-white/55">Tap a file to play. Empty files start a new adventure.</p>
          <div className="mt-4 space-y-3">
            {(slots.length ? slots : [{ empty: true }, { empty: true }, { empty: true }] as FileSlot[]).map((s, i) => (
              <div key={i} className="flex items-stretch gap-2">
                <button
                  type="button"
                  className="min-h-24 flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-4 text-left hover:bg-white/15"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    pickFile(i, s);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    pickFile(i, s);
                  }}
                >
                  <p className="text-[11px] tracking-wide text-[#e8d48a] uppercase">File {i + 1}</p>
                  {s.empty ? (
                    <p className="font-display mt-1 text-xl text-white/60">No file</p>
                  ) : (
                    <>
                      <p className="font-display mt-1 text-2xl text-white">{s.name}</p>
                      <p className="mt-1 text-xs text-white/55">
                        Hearts {s.hearts} · Temples {s.worlds} · {s.data.coins ?? 0} rupees
                        {s.hasSword ? " · Sword" : ""}
                        {s.data.hasHorse ? " · Horse" : ""}
                      </p>
                    </>
                  )}
                </button>
                {!s.empty ? (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 uppercase hover:bg-white/10"
                      onClick={() => {
                        sfx.select();
                        setFile(i);
                        setDraft(s.name);
                        const g = s.data.heroGender === "girl" ? "girl" : "boy";
                        setKind(g);
                        setHeroGender(g);
                        setHeroLook(s.data.heroLook ?? {});
                        setPhase("edit");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/50 uppercase hover:bg-white/10"
                      onClick={() => {
                        eraseSlot(i);
                        setSlots(readSlots());
                      }}
                    >
                      Erase
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : phase === "nag" ? (
        <div className="pointer-events-none relative z-10 flex flex-1 flex-col items-center justify-end px-6 pb-16 text-center">
          <p className="text-[11px] tracking-[0.28em] text-white/50 uppercase">The round hall</p>
          <p className="font-display mt-2 text-5xl tracking-tight text-white drop-shadow">Is open</p>
          <p className="mt-3 max-w-md text-sm text-white/70">A boy climbed in. Fangs came out. You can shut the door.</p>
        </div>
      ) : phase === "ride" ? (
        <button
          type="button"
          aria-label="Tap to start"
          className="relative z-20 flex flex-1 cursor-pointer flex-col items-center justify-center px-6 pb-24 text-center"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            beginFiles();
          }}
          onClick={(e) => {
            e.preventDefault();
            beginFiles();
          }}
        >
          <p
            className={`pointer-events-none text-[12px] tracking-[0.46em] text-white/55 uppercase transition-opacity duration-700 ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          >
            The Legend of
          </p>
          <h1
            className={`title-gold pointer-events-none font-display mt-4 text-6xl leading-none font-semibold tracking-tight sm:text-8xl transition-opacity duration-700 ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          >
            Numera
          </h1>
          <p
            className={`pointer-events-none mt-10 rounded-full border border-white/25 bg-black/35 px-6 py-3 text-base tracking-[0.28em] text-white uppercase ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          >
            Tap to start
          </p>
        </button>
      ) : phase === "hero" ? (
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-end px-5 pt-6 pb-8">
          <p className="mt-3 text-sm tracking-[0.28em] text-white/50 uppercase">The legend of</p>
          <h1 className="title-gold font-display mt-2 text-6xl leading-none font-semibold tracking-tight sm:text-7xl">
            Numera
          </h1>
          <div className="mt-8">
            <p className="text-xs font-medium tracking-[0.16em] text-white/40 uppercase">
              What is your name?
            </p>
          </div>
          <label className="mt-4 block max-w-sm">
            <span className="text-[11px] tracking-[0.18em] text-white/45 uppercase">What is your name?</span>
            <input
              value={draft}
              maxLength={12}
              placeholder="Scholar"
              autoComplete="off"
              onChange={(e) => setDraft(e.target.value)}
              className="font-display mt-2 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xl text-white outline-none placeholder:text-white/30 focus:border-[#e8d48a]"
            />
          </label>
          <div className="mt-8">
            <Button
              size="xl"
              variant="primary"
              className="min-w-44 min-h-14"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const name = cleanName(draft);
                setHeroName(name);
                setHeroGender("boy");
                setHeroLook(BOY_LOOK);
                try {
                  sfx.select();
                  setPhase("year");
                } catch (err) {
                  console.warn("start failed", err);
                }
              }}
              onClick={(e) => {
                e.preventDefault();
                const name = cleanName(draft);
                setHeroName(name);
                setHeroGender("boy");
                setHeroLook(BOY_LOOK);
                try {
                  setPhase("year");
                } catch (err) {
                  console.warn("start failed", err);
                }
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : phase === "look" ? (
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-start overflow-y-auto px-5 pt-6 pb-8">
          <p className="text-[11px] tracking-[0.22em] text-white/50 uppercase">How you look</p>
          <h1 className="title-gold font-display mt-2 text-4xl leading-none font-semibold tracking-tight">
            Pick your look
          </h1>
          <div className="mt-4 min-h-80 overflow-hidden rounded-lg border border-white/15">
            <LookCanvas />
          </div>
          <LookPickers />
          <div className="mt-6">
            <Button
              size="xl"
              variant="primary"
              className="min-w-44"
              onClick={() => {
                sfx.select();
                setPhase("year");
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : phase === "edit" ? (
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-start overflow-y-auto px-5 pt-6 pb-8">
          <p className="text-[11px] tracking-[0.22em] text-white/50 uppercase">File {file + 1}</p>
          <h1 className="title-gold font-display mt-2 text-4xl leading-none font-semibold tracking-tight">
            Edit your name
          </h1>
          <label className="mt-6 block max-w-sm">
            <span className="text-[11px] tracking-[0.18em] text-white/45 uppercase">Name</span>
            <input
              value={draft}
              maxLength={12}
              placeholder="Scholar"
              autoComplete="off"
              onChange={(e) => setDraft(e.target.value)}
              className="font-display mt-2 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xl text-white outline-none placeholder:text-white/30 focus:border-[#e8d48a]"
            />
          </label>
          <div className="mt-6 flex gap-3">
            <Button
              size="xl"
              variant="primary"
              className="min-w-44"
              onClick={() => {
                const name = cleanName(draft);
                sfx.open();
                setHeroName(name);
                setHeroGender("boy");
                patchSlotHero(file, name, "boy", BOY_LOOK);
                setSlots(readSlots());
                setPhase("files");
              }}
            >
              Save
            </Button>
            <Button
              size="xl"
              variant="ghost"
              onClick={() => {
                sfx.select();
                setPhase("files");
              }}
            >
              Back
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-end px-5 pt-6 pb-8">
          <p className="text-[11px] tracking-[0.22em] text-white/50 uppercase">
            {cleanName(draft) || "Scholar"}
          </p>
          <h1 className="title-gold font-display mt-2 text-5xl leading-none font-semibold tracking-tight">
            Choose your year
          </h1>
          <div className="mt-8">
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADES.map((g) => {
                const active = grade === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGrade(g.id as GradeBand)}
                    className={`min-h-16 rounded-lg border px-3 py-4 text-left transition-colors duration-(--motion-fast) ${
                      active
                        ? "border-white bg-white/15 text-white"
                        : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    <span className="block text-[11px] tracking-wide text-white/45 uppercase">
                      {g.ages}
                    </span>
                    <span className="font-display mt-1 block text-lg font-semibold">
                      {g.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/50">
              {GRADES.find((g) => g.id === grade)?.blurb}
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="xl"
              variant="primary"
              className="min-w-44"
              onClick={() => {
                unlockAudio();
                sfx.open();
                const g = useGame.getState().grade;
                setHeroName(cleanName(draft));
                setHeroGender("boy");
                setHeroLook(BOY_LOOK);
                startNew(file, cleanName(draft), g, "boy", BOY_LOOK);
              }}
            >
              Continue
            </Button>
            <p className="text-xs text-white/50">
              Kick the can. Walk in a circle. Steal the hat on a stick. W and jump.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
