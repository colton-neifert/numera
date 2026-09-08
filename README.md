# Numera

Original Zelda-inspired 3D math-adventure (React Three Fiber / Three.js + TanStack Start). Legally distinct from Nintendo.

## Run

```bash
npm install
npm run dev
```

Opens the game in the browser. Sign-in is real (Google / X). Preview uses a local database fallback.

```bash
npm test              # node tests (97)
node scripts/game-e2e.mjs   # Playwright walk / jump / weapons / math
```

## What this pack is

The full playable project: source, public art, sprite sheets, scripts, and screenshots of Sum Meadow after the valley rebuild.

Not included: `node_modules` (run `npm install`), generated Imagine intermediates, Grok sandbox internals.

## Sum Meadow rebuild (latest)

The overworld was a flat lawn with a close beige castle. It is now a rolling 3D valley.

| File | What changed |
|---|---|
| `src/game/world3d/painted.tsx` | `GrassTerrain` takes `segs`; meadow uses 36 (was 160) so PLAY no longer freezes |
| `src/game/world3d/meadowArt.tsx` | One height-displaced ground overlay, closed hill volumes, timber cottages, organic pond, sheep flock |
| `src/game/world3d/field.ts` | Rolling hills + river valley in `heightAt`; meadow spawn ignores bogus `(0,12)` resume |
| `src/game/world3d/WorldCanvas.tsx` | Yellow inverted-triangle lock reticle; bombs ~0.46; wide-V boomerang |
| `src/game/world3d/village.tsx` | Wider fire ring (3 seats); pond water surface |
| `src/game/world3d/fx.tsx` / `biome.tsx` | Meadow butterflies removed |
| `src/game/screens/OverworldScreen.tsx` | HUD inverted yellow triangle |
| `src/game/components/TouchPad.tsx` | Gold ▼ Lock button |
| `src/game/world3d/actors.tsx` | Hand bomb/boom match flying meshes |
| `src/game/world3d/house.tsx` | Shutters on story huts |

Do not move: spawn `(14, -58)`, `KEEP_COL` AABB, `TEST_ALL_GEAR` at start. Reverse-walk only while Z-targeted.

Screenshots in `screenshots/`:

- `meadow-side-by-side.png` — painting vs playable valley
- `meadow-profile.png` — castle on a real 3D hill (side view)
- `meadow-compose.png` — cottages left, fountain/sheep, river, keep on a hill
- `meadow-lock.png` — yellow inverted-triangle target

## Controls

WASD walks (vehicle-style; A is left). L / ▼ Lock targets. Hold lock to walk backwards. B swings. Z picks up. F2 developer tools.
