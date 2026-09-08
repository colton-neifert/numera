import { useEffect, useState } from "react";
import { live } from "../world3d/live";
import { POND, VX, VZ, VR } from "../world3d/field";
import { HOUSES } from "../world3d/house";
import { VILLAGE_REF_CAM } from "../world3d/villageArt";
import { playerMaxHp, WORLD_ORDER } from "../content";
import { useGame } from "../store";
import { sfx, playTheme, playFanfare, playCeremony, playCue, BEDS } from "../audio";
import { testGearPatch } from "../kit";
import { writeActive } from "../saves";

const SPOTS: { label: string; x: number; z: number }[] = [
  { label: "Oakstead", x: VX, z: VZ + 8 },
  { label: "Yard", x: 0, z: VZ + VR + 10 },
  { label: "Your house", x: 0, z: VZ + 4 },
  { label: "Keep door", x: 0, z: -22 },
  { label: "Pond", x: POND.x, z: POND.z + 8 },
  { label: "Shrine", x: -82, z: 12 },
  { label: "Inn", x: VX + 22, z: VZ - 6 },
  { label: "Mill", x: VX - 18, z: VZ + 10 },
];

function warp(x: number, z: number) {
  live.house = null;
  live.cave = false;
  live.pit = 0;
  live.dungeon = false;
  live.warpTo = { x, z };
  sfx.select();
}

export function DevPanel() {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setOpen(live.devOpen);
      setTick((n) => n + 1);
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  if (!open) return null;

  const g = useGame.getState();

  return (
    <div className="pointer-events-auto absolute top-3 right-3 z-[80] max-h-[min(88vh,40rem)] w-[min(94vw,22rem)] overflow-y-auto rounded-xl border-2 border-[#6ad0e8] bg-[#0c1418]/96 p-3 text-[#e8f4f8] shadow-2xl">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#6ad0e8] uppercase">Developer Tools</p>
        <button
          type="button"
          className="rounded-md border border-[#6ad0e8]/40 px-2 py-1 text-xs"
          onClick={() => {
            live.devOpen = false;
            setOpen(false);
          }}
        >
          Close
        </button>
      </div>
      <p className="mt-1 text-[11px] text-[#9ab8c4]">F2 to hide. Not part of the game. Normal play never shows this.</p>
      {live.showCoords ? (
        <p className="mt-2 font-mono text-[11px] text-[#e8d48a]">
          x {live.x.toFixed(1)} · y {live.y.toFixed(2)} · z {live.z.toFixed(1)} · {g.currentWorld ?? "—"}
        </p>
      ) : null}

      <p className="mt-3 text-[10px] tracking-[0.16em] text-[#6ad0e8] uppercase">Cameras</p>
      <button
        type="button"
        className="mt-1 min-h-10 w-full rounded-md border border-[#e8d48a]/50 bg-[#2a2418] px-2 text-sm text-[#e8d48a]"
        onClick={() => {
          if (g.currentWorld !== "meadow") g.enterWorld("meadow");
          live.house = null;
          live.day = 0.38;
          live.shotCam = { ...VILLAGE_REF_CAM };
          live.hint = "Village Reference View";
          sfx.select();
        }}
      >
        Village Reference View
      </button>
      <button
        type="button"
        className="mt-1 min-h-10 w-full rounded-md border border-[#e8d48a]/50 bg-[#2a2418] px-2 text-sm text-[#e8d48a]"
        onClick={() => {
          live.charView = true;
          live.viewerAnim = "idle";
          live.viewerWire = false;
          live.hint = "Character Viewer";
          sfx.select();
        }}
      >
        Character Viewer
      </button>
      <button
        type="button"
        className="mt-1 min-h-10 w-full rounded-md border border-[#e8d48a]/50 bg-[#2a2418] px-2 text-sm text-[#e8d48a]"
        onClick={() => {
          live.charView = true;
          live.viewerAnim = "idle";
          live.viewerWire = false;
          live.studioLight = "afternoon";
          live.hint = "Lighting Studio";
          sfx.select();
        }}
      >
        Lighting Studio
      </button>
      <button
        type="button"
        className="mt-1 min-h-9 w-full rounded-md border border-[#6ad0e8]/30 bg-[#102028] px-2 text-xs"
        onClick={() => {
          live.shotCam = null;
          live.hint = "Camera follow on.";
          sfx.select();
        }}
      >
        Clear camera
      </button>

      <p className="mt-3 text-[10px] tracking-[0.16em] text-[#6ad0e8] uppercase">Teleport</p>
      <div className="mt-1 grid grid-cols-2 gap-1.5">
        {SPOTS.map((s) => (
          <button
            key={s.label}
            type="button"
            className="min-h-9 rounded-md border border-[#6ad0e8]/30 bg-[#102028] px-2 text-xs"
            onClick={() => {
              if (g.currentWorld !== "meadow") g.enterWorld("meadow");
              warp(s.x, s.z);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[10px] tracking-[0.16em] text-[#6ad0e8] uppercase">Worlds / checkpoints</p>
      <div className="mt-1 grid grid-cols-3 gap-1.5">
        {WORLD_ORDER.map((w) => (
          <button
            key={w}
            type="button"
            className="min-h-9 rounded-md border border-[#6ad0e8]/30 bg-[#102028] px-1 text-[11px]"
            onClick={() => {
              useGame.getState().enterWorld(w);
              live.house = null;
              sfx.select();
            }}
          >
            {w}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[10px] tracking-[0.16em] text-[#6ad0e8] uppercase">Quests</p>
      <div className="mt-1 grid grid-cols-2 gap-1.5">
        <button type="button" className="min-h-9 rounded-md border border-[#6ad0e8]/30 bg-[#102028] px-2 text-xs" onClick={() => { g.setQuest("ash", 1); live.hint = "Ash quest started."; sfx.select(); }}>
          Start Ash
        </button>
        <button type="button" className="min-h-9 rounded-md border border-[#6ad0e8]/30 bg-[#102028] px-2 text-xs" onClick={() => { g.setQuest("ash", 5); live.hint = "Ash quest done."; sfx.select(); }}>
          Finish Ash
        </button>
        <button type="button" className="min-h-9 rounded-md border border-[#6ad0e8]/30 bg-[#102028] px-2 text-xs" onClick={() => { g.setQuest("rook", 1); live.hint = "Rook quest started."; sfx.select(); }}>
          Start Rook
        </button>
        <button type="button" className="min-h-9 rounded-md border border-[#6ad0e8]/30 bg-[#102028] px-2 text-xs" onClick={() => { g.setQuest("rook", 3); live.hint = "Rook quest done."; sfx.select(); }}>
          Finish Rook
        </button>
      </div>

      <p className="mt-3 text-[10px] tracking-[0.16em] text-[#6ad0e8] uppercase">Player</p>
      <div className="mt-1 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          className="min-h-9 rounded-md border border-[#6ad0e8]/30 bg-[#102028] px-2 text-xs"
          onClick={() => {
            useGame.setState({ hp: playerMaxHp(g.xp, g.outfit, g.heartsExtra ?? 0) });
            sfx.heart();
            live.hint = "Hearts full.";
          }}
        >
          Restore health
        </button>
        <button
          type="button"
          className={`min-h-9 rounded-md border px-2 text-xs ${live.god ? "border-[#e8d48a] bg-[#3a3020]" : "border-[#6ad0e8]/30 bg-[#102028]"}`}
          onClick={() => {
            live.god = !live.god;
            live.hint = live.god ? "Invincible on." : "Invincible off.";
          }}
        >
          {live.god ? "Invincible ON" : "Invincible"}
        </button>
        <button
          type="button"
          className="min-h-9 rounded-md border border-[#6ad0e8]/30 bg-[#102028] px-2 text-xs"
          onClick={() => {
            useGame.setState(testGearPatch());
            g.grantSword();
            g.grantAxe();
            g.grantBow();
            g.grantSling();
            g.grantBoom();
            g.grantBombs();
            g.grantPole();
            g.grantCompass();
            useGame.setState({ hasOcarina: true, hasHorse: true, horseName: g.horseName || "Star" });
            live.hasSword = true;
            live.hasShield = true;
            live.hint = "Quest tools given.";
            sfx.get();
          }}
        >
          Give quest items
        </button>
        <button
          type="button"
          className="min-h-9 rounded-md border border-[#6ad0e8]/30 bg-[#102028] px-2 text-xs"
          onClick={() => {
            live.warpTo = { x: live.x + 1.6, z: live.z + 1.6 };
            live.boostY = 6.2;
            sfx.hop();
            live.hint = "Unstuck.";
          }}
        >
          Unstick
        </button>
        <button
          type="button"
          className="min-h-9 rounded-md border border-[#6ad0e8]/30 bg-[#102028] px-2 text-xs"
          onClick={() => {
            useGame.setState({ doorQuiz: null, combat: null });
            live.doorMath = false;
            live.hint = "Puzzle reset.";
            sfx.select();
          }}
        >
          Reset puzzle
        </button>
        <button
          type="button"
          className={`min-h-9 rounded-md border px-2 text-xs ${live.showCol ? "border-[#e8d48a] bg-[#3a3020]" : "border-[#6ad0e8]/30 bg-[#102028]"}`}
          onClick={() => {
            live.showCol = !live.showCol;
            live.hint = live.showCol ? "Collision boxes on." : "Collision boxes off.";
          }}
        >
          Collision boxes
        </button>
        <button
          type="button"
          className={`min-h-9 rounded-md border px-2 text-xs ${live.showCoords ? "border-[#e8d48a] bg-[#3a3020]" : "border-[#6ad0e8]/30 bg-[#102028]"}`}
          onClick={() => {
            live.showCoords = !live.showCoords;
          }}
        >
          Coordinates
        </button>
        <button
          type="button"
          className="min-h-9 rounded-md border border-[#6ad0e8]/30 bg-[#102028] px-2 text-xs"
          onClick={() => {
            useGame.setState({
              worldsCleared: [...WORLD_ORDER],
              gems: { emerald: true, ruby: true, sapphire: true },
              gemsPlaced: ["emerald", "ruby", "sapphire"],
              hasSword: true,
              hasHorse: true,
              horseName: g.horseName || "Star",
            });
            useGame.getState().goHub();
            live.hint = "Ending unlocked.";
            sfx.ok();
          }}
        >
          Jump to ending
        </button>
      </div>
      <p className="mt-3 text-[10px] tracking-[0.16em] text-[#e8d48a] uppercase">Score</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {BEDS.map((id) => (
          <button
            key={id}
            type="button"
            className="min-h-8 rounded-md border border-[#6ad0e8]/30 bg-[#102028] px-2 text-[11px]"
            onClick={() => playTheme(id)}
          >
            {id}
          </button>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {(["sparkle", "short", "full", "sun", "fire", "water", "jewel"] as const).map((id) => (
          <button
            key={id}
            type="button"
            className="min-h-8 rounded-md border border-[#e8d48a]/40 bg-[#2a2418] px-2 text-[11px] text-[#e8d48a]"
            onClick={() => playFanfare(id)}
          >
            {id}
          </button>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {(["emerald", "ruby", "sapphire", "all"] as const).map((id) => (
          <button
            key={id}
            type="button"
            className="min-h-8 rounded-md border border-[#6ad0e8]/30 bg-[#102028] px-2 text-[11px]"
            onClick={() => playCeremony(id)}
          >
            rite {id}
          </button>
        ))}
        {(["oak", "secret", "home", "fear", "victory", "ending", "veyr", "sword"] as const).map((id) => (
          <button
            key={id}
            type="button"
            className="min-h-8 rounded-md border border-[#6ad0e8]/30 bg-[#102028] px-2 text-[11px]"
            onClick={() => playCue(id)}
          >
            {id}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-[#6a8894]">tick {tick} · houses {HOUSES.length}</p>
      <button
        type="button"
        className="mt-2 w-full min-h-10 rounded-md border border-[#6ad0e8] bg-[#163038] text-sm"
        onClick={() => {
          writeActive();
          live.devOpen = false;
          setOpen(false);
        }}
      >
        Close and return to play
      </button>
    </div>
  );
}
