import type { Encounter, WorldId } from "../types";
import { LEVELS } from "./levels";
import { makeOverworldScene } from "./OverworldScene";

export type OverworldHooks = {
  onEncounter: (encounter: Encounter, at: { x: number; y: number }) => void;
  onCollect: (id: string) => void;
  onGate: () => void;
};

export type OverworldHandle = {
  destroy: () => void;
  removeEnemy: (id: string) => void;
  pause: () => void;
  resume: () => void;
};

export async function bootOverworld(
  parent: HTMLElement,
  worldId: WorldId,
  defeated: string[],
  collected: string[],
  spawn: { x: number; y: number } | null,
  hooks: OverworldHooks,
): Promise<OverworldHandle> {
  const Phaser = await import("phaser");
  const level = LEVELS[worldId];
  const scene = makeOverworldScene(Phaser, {
    level,
    defeated: new Set(defeated),
    collected: new Set(collected),
    spawn: spawn ?? level.spawn,
    hooks,
  });

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: "#0c0d10",
    banner: false,
    audio: { noAudio: true },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    render: { antialias: true, roundPixels: false },
    scene,
  });

  return {
    destroy: () => {
      game.destroy(true);
    },
    removeEnemy: (id: string) => {
      const s = game.scene.getScene("overworld") as unknown as {
        removeEnemy?: (id: string) => void;
      };
      s.removeEnemy?.(id);
    },
    pause: () => {
      game.scene.pause("overworld");
    },
    resume: () => {
      game.scene.resume("overworld");
    },
  };
}
