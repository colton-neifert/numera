import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { GradeBand, WorldId } from "@/game/types";

const loadoutSchema = z.object({
  coins: z.number().int().min(0).max(100000),
  weapon: z.enum(["reed", "oak", "copper", "teal", "axiom"]),
  outfit: z.enum(["academy", "meadow", "ember", "keep", "royal"]),
  ownedWeapons: z.array(z.enum(["reed", "oak", "copper", "teal", "axiom"])),
  ownedOutfits: z.array(z.enum(["academy", "meadow", "ember", "keep", "royal"])),
});

export type SavedProgress = {
  grade: GradeBand;
  xp: number;
  hp: number;
  worldsCleared: WorldId[];
  defeated: Record<WorldId, string[]>;
  collected: Record<WorldId, string[]>;
  loadout?: z.infer<typeof loadoutSchema>;
};

const saveSchema = z.object({
  grade: z.enum(["k1", "g23", "g45", "g68"]),
  xp: z.number().int().min(0).max(100000),
  hp: z.number().int().min(0).max(400),
  worldsCleared: z.array(z.enum(["meadow", "grove", "keep"])),
  defeated: z.record(z.string(), z.array(z.string())),
  collected: z.record(z.string(), z.array(z.string())),
  loadout: loadoutSchema.optional(),
});

export const loadProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<
      SavedProgress & {
        worlds_cleared: string;
        defeated: string;
        collected: string;
        loadout: string | null;
      }
    >`
      select grade, xp, hp, worlds_cleared, defeated, collected, loadout
      from player_progress
      where user_id = ${context.userId}
    `;
    const row = rows[0];
    if (!row) return null;
    let loadout: SavedProgress["loadout"];
    try {
      loadout = row.loadout ? loadoutSchema.parse(JSON.parse(row.loadout)) : undefined;
    } catch {
      loadout = undefined;
    }
    return {
      grade: row.grade,
      xp: row.xp,
      hp: row.hp,
      worldsCleared: JSON.parse(row.worlds_cleared) as WorldId[],
      defeated: JSON.parse(row.defeated) as SavedProgress["defeated"],
      collected: JSON.parse(row.collected) as SavedProgress["collected"],
      loadout,
    } satisfies SavedProgress;
  });

export const saveProgress = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into player_progress (user_id, grade, xp, hp, worlds_cleared, defeated, collected, loadout, updated_at)
      values (
        ${context.userId},
        ${data.grade},
        ${data.xp},
        ${data.hp},
        ${JSON.stringify(data.worldsCleared)},
        ${JSON.stringify(data.defeated)},
        ${JSON.stringify(data.collected)},
        ${JSON.stringify(data.loadout ?? {})},
        now()
      )
      on conflict (user_id) do update set
        grade = excluded.grade,
        xp = excluded.xp,
        hp = excluded.hp,
        worlds_cleared = excluded.worlds_cleared,
        defeated = excluded.defeated,
        collected = excluded.collected,
        loadout = excluded.loadout,
        updated_at = now()
    `;
    return { ok: true as const };
  });
