import { useGame } from "../store";
import { ECHO_GLADE, ELDER_OAK, HORN_PEAK, LOOK_AT, RIDE_AT, VX, VZ, WATCH_SPIRE, WILD_POND } from "./field";
import { live } from "./live";
import { onSurface } from "./realms";

const NEAR: { id: string; name: string; x: number; z: number; r: number }[] = [
  { id: "map_wild", name: "", x: WILD_POND.x, z: WILD_POND.z, r: 18 },
  { id: "map_echo", name: "Echo Glade", x: ECHO_GLADE.x, z: ECHO_GLADE.z, r: 16 },
  { id: "map_look", name: "", x: LOOK_AT.x, z: LOOK_AT.z, r: 14 },
  { id: "map_watch", name: "", x: WATCH_SPIRE.x, z: WATCH_SPIRE.z, r: 16 },
  { id: "map_elder", name: "The Elder Oak", x: ELDER_OAK.x, z: ELDER_OAK.z, r: 16 },
  { id: "map_horn", name: "", x: HORN_PEAK.x, z: HORN_PEAK.z, r: 22 },
  { id: "map_balloon", name: "", x: RIDE_AT.x, z: RIDE_AT.z, r: 14 },
];

function mark(id: string, name: string) {
  const g = useGame.getState();
  if ((g.quests?.[id] ?? 0) >= 1) return;
  g.setQuest(id, 1);
  if (name) {
    live.banner = name;
    live.bannerMs = 2000;
  }
}

/** The chart only learns a place after you have actually been there. */
export function watchChart() {
  if (live.realm === "oldroot") {
    mark("map_oldroot", "");
    return;
  }
  if (!onSurface()) return;
  if (Math.hypot(live.x - VX, live.z - VZ) < 34) mark("map_oak", "");
  if (live.z > 358 && Math.abs(live.x) < 100) mark("map_high", "");
  if (Math.abs(live.z + 280) < 24 && Math.abs(live.x) < 40) mark("map_gorge", "");
  if (live.z < -330 && Math.abs(live.x) < 30) mark("map_green", "Greenreach");
  if (Math.hypot(live.x - 368, live.z - 80) < 22) mark("map_valley", "");
  if (Math.hypot(live.x - 96, live.z - 408) < 16) mark("map_pale", "The Pale Stones");
  for (const s of NEAR) {
    if (Math.hypot(live.x - s.x, live.z - s.z) < s.r) mark(s.id, s.name);
  }
}
