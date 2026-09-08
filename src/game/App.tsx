import { useEffect, useRef } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { loadProgress, saveProgress } from "@/lib/progress";
import { playTheme, setLowHealth, setMuted, unlockAudio, setHidden } from "./audio";
import { GameOverScreen } from "./screens/GameOverScreen";
import { HubScreen } from "./screens/HubScreen";
import { OverworldScreen } from "./screens/OverworldScreen";
import { TitleScreen } from "./screens/TitleScreen";
import { HP_PER_HEART } from "./components/Hud";
import { writeActive, startNew } from "./saves";
import { useGame } from "./store";
import { MysteryBoot } from "./world3d/mysteryLayer";
import { live } from "./world3d/live";

export function GameApp() {
  const screen = useGame((s) => s.screen);
  const muted = useGame((s) => s.muted);
  const hp = useGame((s) => s.hp);
  const { user, isPending } = useCurrentUserState();
  const cloudReady = useRef(false);
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    const vis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", vis);
    window.__gameTest = {
      get: () => {
        const s = useGame.getState();
        return {
          screen: s.screen,
          world: s.currentWorld,
          hp: s.hp,
          coins: s.coins,
          name: s.heroName,
          muted: s.muted,
          quiz: Boolean(s.doorQuiz),
          combat: Boolean(s.combat),
          pack: s.screen,
          hasSword: s.hasSword,
          hasBoom: s.hasBoom,
          hasBombs: s.hasBombs,
          worlds: s.worldsCleared,
        };
      },
      set: (p) => useGame.setState(p as never),
      enter: (w) => useGame.getState().enterWorld(w as never),
      live: () => live,
      boot: () => {
        startNew(0, "Tester", "g23", "boy");
        useGame.getState().enterWorld("meadow");
      },
      quiz: (ok: boolean) => {
        const s = useGame.getState();
        if (ok) {
          if (s.doorQuiz) s.solveDoor(true);
          else if (s.combat) s.solveTry(true);
        } else {
          if (s.doorQuiz) s.solveDoor(false);
          else if (s.combat) s.solveTry(false);
        }
      },
      startQuiz: () => useGame.getState().startDoorQuiz("yours", "talk"),
      pause: () => {
        live.openPack = true;
        live.wantPause = true;
      },
      mute: () => useGame.getState().toggleMute(),
    };
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", vis);
      delete window.__gameTest;
    };
  }, []);

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const danger =
      !muted &&
      hp > 0 &&
      hp <= HP_PER_HEART &&
      screen !== "title" &&
      screen !== "gameover";
    setLowHealth(danger);
    return () => setLowHealth(false);
  }, [hp, muted, screen]);

  useEffect(() => {
    if (screen === "gameover") playTheme("none");
    else if (screen === "hub") playTheme("field");
  }, [screen]);

  useEffect(() => {
    if (isPending || !user || cloudReady.current) return;
    cloudReady.current = true;
    void loadProgress()
      .then((remote) => {
        if (!remote) {
          const local = useGame.getState();
          return saveProgress({
            data: {
              grade: local.grade,
              xp: local.xp,
              hp: local.hp,
              worldsCleared: local.worldsCleared,
              defeated: local.defeated,
              collected: local.collected,
              loadout: {
                coins: local.coins,
                weapon: local.weapon,
                outfit: local.outfit,
                ownedWeapons: local.ownedWeapons,
                ownedOutfits: local.ownedOutfits,
              },
            },
          });
        }
        useGame.setState({
          grade: remote.grade,
          xp: remote.xp,
          hp: remote.hp,
          worldsCleared: remote.worldsCleared,
          defeated: {
            meadow: remote.defeated.meadow ?? [],
            cavern: remote.defeated.cavern ?? [],
            marsh: remote.defeated.marsh ?? [],
            grove: remote.defeated.grove ?? [],
            crater: remote.defeated.crater ?? [],
            lake: remote.defeated.lake ?? [],
            grave: remote.defeated.grave ?? [],
            waste: remote.defeated.waste ?? [],
            keep: remote.defeated.keep ?? [],
            echo: remote.defeated.echo ?? [],
            ridge: remote.defeated.ridge ?? [],
            spire: remote.defeated.spire ?? [],
            fen: remote.defeated.fen ?? [],
            hollow: remote.defeated.hollow ?? [],
            vault: remote.defeated.vault ?? [],
            arena: remote.defeated.arena ?? [],
          },
          collected: {
            meadow: remote.collected.meadow ?? [],
            cavern: remote.collected.cavern ?? [],
            marsh: remote.collected.marsh ?? [],
            grove: remote.collected.grove ?? [],
            crater: remote.collected.crater ?? [],
            lake: remote.collected.lake ?? [],
            grave: remote.collected.grave ?? [],
            waste: remote.collected.waste ?? [],
            keep: remote.collected.keep ?? [],
            echo: remote.collected.echo ?? [],
            ridge: remote.collected.ridge ?? [],
            spire: remote.collected.spire ?? [],
            fen: remote.collected.fen ?? [],
            hollow: remote.collected.hollow ?? [],
            vault: remote.collected.vault ?? [],
            arena: remote.collected.arena ?? [],
          },
          ...(remote.loadout
            ? {
                coins: remote.loadout.coins,
                weapon: remote.loadout.weapon,
                outfit: remote.loadout.outfit,
                ownedWeapons: remote.loadout.ownedWeapons,
                ownedOutfits: remote.loadout.ownedOutfits,
              }
            : {}),
        });
      })
      .catch(() => {
        /* guest / unauthorized — local save is enough */
      });
  }, [user, isPending]);

  useEffect(() => {
    const unsub = useGame.subscribe(() => {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        const state = useGame.getState();
        if (state.screen === "gameover" || state.hp <= 0) return;
        if (state.heroName) writeActive();
        if (!user) return;
        void saveProgress({
          data: {
            grade: state.grade,
            xp: state.xp,
            hp: state.hp,
            worldsCleared: state.worldsCleared,
            defeated: state.defeated,
            collected: state.collected,
            loadout: {
              coins: state.coins,
              weapon: state.weapon,
              outfit: state.outfit,
              ownedWeapons: state.ownedWeapons,
              ownedOutfits: state.ownedOutfits,
            },
          },
        }).catch(() => {});
      }, 500);
    });
    const flush = () => {
      const state = useGame.getState();
      if (state.heroName && state.hp > 0 && state.screen !== "gameover") writeActive();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      unsub();
      flush();
      window.clearTimeout(saveTimer.current);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
    };
  }, [user]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <MysteryBoot />
      {screen === "title" && <TitleScreen />}
      {screen === "hub" && <HubScreen />}
      {screen === "overworld" && <OverworldScreen />}
      {screen === "gameover" && <GameOverScreen />}
    </div>
  );
}
