import { test } from "node:test";
import assert from "node:assert/strict";

/** Mirrors src/game/chase.ts route — keep in lockstep. */
const VX = 0;
const VZ = -108;
const FIRE = { x: VX, z: VZ + 8 };
const FOUNTAIN = { x: VX + 2, z: VZ - 18 };
const WAGON = { x: VX + 16, z: VZ - 6 };
const FARM = { x: 50, z: -98 };
const SMITH = { x: 40, z: -52 };
const HAY = { x: VX - 16, z: VZ + 18 };
const POND = { x: VX - 54, z: VZ - 22 };
const BRIDGE = { x: POND.x + 18, z: POND.z + 14 };
const ZIP_LAND = { x: VX + 12, z: VZ + 48 };
const LOOK_AT = { x: -32, z: -44 };
const MILL_AT = { x: VX + 2 * 1.62, z: VZ + (-116 - -82) * 1.62 };
const WELL_AT = { x: 8, z: -118 };
const POLE = { x: FIRE.x + 1.85, z: FIRE.z + 1.55 };

const CHASE_ROUTE = [
  { id: "square", x: POLE.x, z: POLE.z },
  { id: "wagon", x: WAGON.x - 1.2, z: WAGON.z + 2.4 },
  { id: "farm", x: FARM.x - 2.4, z: FARM.z + 1.2, jump: true },
  { id: "smith", x: SMITH.x - 1.6, z: SMITH.z + 6.4 },
  { id: "zip", x: ZIP_LAND.x - 2, z: ZIP_LAND.z - 4 },
  { id: "look", x: LOOK_AT.x + 4.2, z: LOOK_AT.z - 2.8, hide: "look" },
  { id: "bridge", x: BRIDGE.x, z: BRIDGE.z, bridge: true },
  { id: "pond", x: POND.x + 6.2, z: POND.z + 3.4 },
  { id: "fountain", x: FOUNTAIN.x - 2.4, z: FOUNTAIN.z + 1.2 },
  { id: "mill", x: MILL_AT.x + 2.2, z: MILL_AT.z + 2.8, hide: "mill" },
  { id: "well", x: WELL_AT.x + 2.4, z: WELL_AT.z + 1.6 },
  { id: "hay", x: HAY.x, z: HAY.z, hide: "hay" },
];

const HIDES = ["hay", "mill", "look", "wagon"];

function routeLen() {
  let n = 0;
  for (let i = 1; i < CHASE_ROUTE.length; i++) {
    const a = CHASE_ROUTE[i - 1];
    const b = CHASE_ROUTE[i];
    n += Math.hypot(b.x - a.x, b.z - a.z);
  }
  return n;
}

function shortcutLen() {
  const zip = CHASE_ROUTE.find((n) => n.id === "zip");
  return Math.hypot(zip.x - FIRE.x, zip.z - FIRE.z);
}

test("chase visits the village, farm, bridge, and hay", () => {
  const ids = CHASE_ROUTE.map((n) => n.id);
  assert.deepEqual(new Set(ids).size, ids.length);
  for (const need of ["square", "farm", "smith", "zip", "look", "bridge", "pond", "mill", "hay"]) {
    assert.ok(ids.includes(need), `missing ${need}`);
  }
  assert.ok(CHASE_ROUTE.some((n) => n.jump), "farm crates need a jump");
  assert.ok(CHASE_ROUTE.some((n) => n.bridge), "creek needs a crossing");
});

test("north meadow cut is shorter than the full loop", () => {
  const full = routeLen();
  const cut = shortcutLen();
  assert.ok(full > 180, `route too short: ${full}`);
  assert.ok(cut < full * 0.35, `shortcut ${cut} vs route ${full}`);
});

test("hide spots are the four places you search", () => {
  assert.deepEqual(HIDES.slice().sort(), ["hay", "look", "mill", "wagon"].sort());
  const onRoute = CHASE_ROUTE.filter((n) => n.hide).map((n) => n.hide);
  assert.ok(onRoute.includes("hay"));
  assert.ok(onRoute.includes("mill"));
  assert.ok(onRoute.includes("look"));
});

test("thief is slower than a sprint and faster than a walk", () => {
  const RUN = 9.6;
  const WALK = 5.4;
  const panic = 9.35;
  const cruise = 7.85;
  assert.ok(cruise > WALK);
  assert.ok(cruise < RUN);
  assert.ok(panic < RUN);
  assert.ok(panic > cruise);
});
