import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WorldId } from "../types";
import { heightAt, TREE_HOME, TREE_HOUSE_H, TREE_TRUNK, POND, LOOK_AT, PATH_CREEK, ROOT_HOLLOW } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { consumeTalk as consumeTalkRaw } from "../input";
import { lamb } from "./mats";
import { FangWolf } from "./fangWolf";
import { STATUE_AT, BRIDGE_AT, ORDER_AT, GOURD_AT } from "./mathWorld";
import { nearestStuff, STUFF_AT } from "./stuff";
import { PEEKS } from "./reach";
import { roomZ } from "./dungeonLayout";
import { playerMaxHp } from "../content";
import { landAt } from "./lands";
import { quietRoom, inHollow } from "./quiet";
import { FARM_AT } from "./townLife";
import { puffAt } from "./fx";
import { festOn } from "../fest";
import { chaseOn, chase } from "../chase";
import { stormOn, fogAmt, snowAmt } from "../weather";
import {
  considerNim,
  hydrateNim,
  markNimMet,
  nimFollowing,
  nimShelf,
  nimYip,
  type NimMood,
} from "../companion";
import {
  LOST,
  lost,
  lostAway,
  finishBolt,
  hydrateLost,
} from "../lost";
import {
  dangerLine,
  finishNimSpot,
  foxVent,
  jobAskLabel,
  jobDuration,
  jobMood,
  jobTarget,
  nearestFoe,
  nearestNimSpot,
  nimDangerAhead,
  nimSpots,
  spotDone,
  spotReady,
  startNimJob,
} from "../nimJobs";

const SIGHTS: { x: number; z: number; r: number }[] = [
  { x: PATH_CREEK.x, z: PATH_CREEK.z, r: 28 },
  { x: STUFF_AT.creek.x, z: STUFF_AT.creek.z, r: 22 },
  { x: ROOT_HOLLOW.x, z: ROOT_HOLLOW.z, r: 14 },
  { x: POND.x, z: POND.z, r: 20 },
  { x: LOOK_AT.x, z: LOOK_AT.z, r: 36 },
  { x: TREE_TRUNK.x, z: TREE_TRUNK.z, r: 10 },
  ...PEEKS.map((p) => ({ x: p.x, z: p.z, r: 34 })),
];

function nearestSight(x: number, z: number) {
  let best: { x: number; z: number; d: number } | null = null;
  for (const s of SIGHTS) {
    const d = Math.hypot(x - s.x, z - s.z);
    if (d < s.r && d > 1.4 && (!best || d < best.d)) best = { x: s.x, z: s.z, d };
  }
  const log = nearestStuff(x, z, 8);
  if (log && (log.kind === "log" || log.kind === "statue") && !log.held) {
    const d = Math.hypot(x - log.x, z - log.z);
    if (d > 1.2 && (!best || d < best.d)) best = { x: log.x, z: log.z, d };
  }
  return best;
}



function talkSteal() {
  if (live.nearNpc && live.nearNpc !== "nim") return false;
  if (live.nearHouse || live.nearChest || live.nearHorse || live.nearGate) return false;
  return consumeTalkRaw();
}

export function Companion({ worldId, paused }: { worldId: WorldId; paused?: boolean }) {
  const g = useRef<THREE.Group>(null);
  const pos = useRef({ x: nimShelf().x, z: nimShelf().z, y: 0 });
  const yaw = useRef(Math.PI);
  const hop = useRef(0);
  const after = useRef<string | null>(null);
  const leftHome = useRef(0);
  const sawHome = useRef(false);
  const glow = useRef<THREE.PointLight>(null);
  const plateAt = useRef<{ x: number; z: number } | null>(null);
  const lastWarn = useRef(-99);
  const lastBark = useRef(-99);
  const lastPet = useRef(-99);
  const lastPuff = useRef(-99);

  useEffect(() => {
    hydrateNim();
    hydrateLost();
    if (lost.phase === "bolt" || lost.phase === "search") {
      pos.current.x = lost.phase === "search" ? LOST.den.x : live.nimX || live.x;
      pos.current.z = lost.phase === "search" ? LOST.den.z : live.nimZ || live.z;
    } else if (lost.phase === "den" || lost.phase === "open") {
      pos.current.x = LOST.cage.x;
      pos.current.z = LOST.cage.z;
    } else if (!nimFollowing()) {
      const s = nimShelf();
      pos.current.x = s.x;
      pos.current.z = s.z;
    }
  }, [worldId]);

  useFrame((_, rawDt) => {
    const dt = Math.min(0.1, rawDt);
    const gState = useGame.getState();
    const away = lostAway();
    if (away) live.nimFollow = false;
    else if ((gState.quests?.nim ?? 0) >= 1) live.nimFollow = true;
    const freeze = paused || live.paused || live.doorMath || live.talking;
    const shelf = nimShelf();
    const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
    const following = nimFollowing();
    const p = pos.current;

    if (live.house === "yours") sawHome.current = true;

    if (live.talkNpc && live.talkNpc !== "nim") after.current = live.talkNpc;

    if (live.talkNpc === "nim") markNimMet();

    const plate = nearbyPlate(worldId);
    if (plate) plateAt.current = plate;
    if (following && plate && Math.hypot(live.x - plate.x, live.z - plate.z) < 2.4 && talkSteal()) {
      live.nimOnPlate = true;
      sfx.ok();
      nimYip("Fine. I am the weight. Do not make it a habit.", "plate", true);
    }
    if (live.nimOnPlate) {
      const dStay = Math.hypot(live.x - live.nimX, live.z - live.nimZ);
      if (dStay > 22) live.nimOnPlate = false;
    }

    const jobSpot = following ? nearestNimSpot(live.x, live.z, worldId, 3.8) : null;
    live.nimPrompt = "";
    if (lost.phase === "den" && !lost.talked) live.nimPrompt = "Talk";
    else if (lost.phase === "den" && lost.talked && !lost.latch) live.nimPrompt = "The wood is a latch";
    else if (following && !live.nimJob) {
      if (jobSpot) live.nimPrompt = jobAskLabel(jobSpot.kind);
      else if (plate && Math.hypot(live.x - plate.x, live.z - plate.z) < 2.4 && !live.nimOnPlate) {
        live.nimPrompt = jobAskLabel("plate");
      }
    }
    if (following && jobSpot && !live.nimJob && !live.nimOnPlate) {
      const dJob = Math.hypot(live.x - jobSpot.x, live.z - jobSpot.z);
      const asked = dJob < jobSpot.r && talkSteal();
      const auto = jobSpot.kind === "sniff" && dJob < jobSpot.r * 0.62 && live.stillT > 1.55;
      if (asked || auto) {
        startNimJob(jobSpot.id);
        nimYip(jobSpot.notice, "job", true);
        if (jobSpot.kind === "dig") sfx.rustle();
        else sfx.yelp();
      }
    }

    const active = live.nimJob ? nimSpots().find((s) => s.id === live.nimJob) : null;
    if (active && following && !freeze) {
      live.nimJobT += dt;
      if (active.kind === "dig" && live.nimJobT > 0.4 && live.nimJobT < 2.1 && Math.random() < 0.08) {
        puffAt(active.x, active.z, heightAt(active.x, active.z) + 0.1, false);
      }
      if (live.nimJobT >= jobDuration(active)) {
        finishNimSpot(active);
        if (active.kind === "crawl" && active.plate) {
          live.nimOnPlate = true;
          plateAt.current = active.plate;
        }
      }
    }

    let tx = p.x;
    let tz = p.z;
    let want: NimMood = "sit";

    const working = Boolean(active && live.nimJob);
    const phase = lost.phase;

    if (phase === "bolt") {
      tx = LOST.hole.x;
      tz = LOST.hole.z;
      want = "hop";
      if (Math.hypot(p.x - LOST.hole.x, p.z - LOST.hole.z) < 1.15) {
        puffAt(LOST.hole.x, LOST.hole.z);
        finishBolt();
      }
    } else if (phase === "search") {
      tx = p.x;
      tz = p.z;
      want = "hide";
    } else if (phase === "den" || phase === "open") {
      p.x = LOST.cage.x;
      p.z = LOST.cage.z;
      tx = p.x;
      tz = p.z;
      want = "sit";
    } else if (!following) {
      tx = shelf.x;
      tz = shelf.z;
      want = "sit";
      if (live.house === "yours" && Math.hypot(live.x - shelf.x, live.z - shelf.z) < 2.2) {
        want = "look";
        yaw.current = Math.atan2(-(live.x - p.x), -(live.z - p.z));
        if (live.stillT > 0.5) live.listen = live.listen || "Fang on the shelf. The lamp is warm under him.";
      }
      if (sawHome.current && !live.house) {
        leftHome.current += dt;
        if (leftHome.current > 7) {
          markNimMet();
          nimYip("Wait. Roofs are boring.", "meet", true);
        }
      } else if (live.house === "yours") {
        leftHome.current = 0;
      }
    } else if (working && active) {
      const tgt = jobTarget(active);
      tx = tgt.x;
      tz = tgt.z;
      want = jobMood(active) as NimMood;
    } else if (live.nimOnPlate && plateAt.current) {
      const sitAt = plateAt.current;
      tx = sitAt.x;
      tz = sitAt.z;
      want = "plate";
    } else if (live.bossFight) {
      tx = live.x + 7.2;
      tz = live.z + 5.4;
      want = "hide";
    } else if (live.mounted) {
      tx = live.x + Math.cos(live.yaw) * 0.22;
      tz = live.z + Math.sin(live.yaw) * 0.22;
      want = "sit";
    } else if (live.balloonRide) {
      tx = live.x + 0.35;
      tz = live.z + 0.2;
      want = "sit";
    } else if (live.zipping) {
      tx = p.x;
      tz = p.z;
      want = "look";
    } else {
      const danger = nimDangerAhead(live.x, live.z, live.yaw, Math.abs(live.speed) > 1.4);
      const foe = nearestFoe(live.x, live.z);
      live.nimAlert = foe && foe.d < 16 ? Math.max(0, 1 - foe.d / 16) : 0;
      if (danger && Math.abs(live.speed) > 1.6) {
        tx = live.x - Math.sin(live.yaw) * 1.7;
        tz = live.z - Math.cos(live.yaw) * 1.7;
        want = "growl";
        if (live.playT - lastWarn.current > 5.5) {
          lastWarn.current = live.playT;
          nimYip(dangerLine(danger), danger, true);
          sfx.bark();
        }
      } else if (foe && foe.d < 10 && live.stillT < 0.4) {
        tx = live.x - Math.sin(live.yaw + 0.95) * 1.2;
        tz = live.z - Math.cos(live.yaw + 0.95) * 1.2;
        want = "growl";
        yaw.current = Math.atan2(-(foe.x - p.x), -(foe.z - p.z));
        if (live.playT - lastBark.current > 7) {
          lastBark.current = live.playT;
          sfx.bark();
        }
      } else if (jobSpot && !live.nimJob) {
        const dJob = Math.hypot(p.x - jobSpot.x, p.z - jobSpot.z);
        tx = jobSpot.x;
        tz = jobSpot.z;
        want = jobSpot.kind === "dig" || jobSpot.kind === "sniff" ? "sniff" : jobSpot.kind === "crawl" ? "look" : "walk";
        if (dJob < 0.55 && jobSpot.kind === "sniff") want = "sniff";
      } else if (live.fangMark && Math.hypot(p.x - live.fangMark.x, p.z - live.fangMark.z) < 18) {
        const mark = live.fangMark;
        tx = mark.x;
        tz = mark.z;
        want =
          mark.kind === "ring" || mark.kind === "hen" || mark.kind === "hearth" || mark.kind === "thorn" || mark.kind === "clamp"
            ? "growl"
            : mark.kind === "peekit" || mark.kind === "stump" || mark.kind === "apple"
              ? "hop"
              : mark.kind === "dial" || mark.kind === "wick"
                ? "sniff"
                : "sniff";
        if (live.playT - lastBark.current > 9 && (mark.kind === "ring" || mark.kind === "hen" || mark.kind === "hearth")) {
          lastBark.current = live.playT;
          sfx.bark();
        }
      } else {
        const side = live.yaw + 0.95;
        tx = live.x - Math.sin(side) * 1.35;
        tz = live.z - Math.cos(side) * 1.35;
        const dist = Math.hypot(tx - p.x, tz - p.z);
        const sight = live.stillT > 0.7 ? nearestSight(p.x, p.z) : null;
        if (dist > 0.55) want = dist > 4.5 ? "hop" : "walk";
        else if (sight && sight.d < 32) {
          want = sight.d < 9 && live.stillT > 1.6 ? "sniff" : "look";
          if (sight.d > 3.2 && sight.d < 11 && live.stillT > 1.8) {
            tx = sight.x;
            tz = sight.z;
            want = "walk";
          }
        } else if (live.stillT > 1.1) want = "sit";
        else want = "idle";
      }
    }

    if (!freeze) {
      const dx = tx - p.x;
      const dz = tz - p.z;
      const dist = Math.hypot(dx, dz);
      const bolting = phase === "bolt";
      const spd = bolting
        ? 14.2
        : want === "hop" || want === "fetch" || want === "track"
          ? 11.5
          : want === "walk" || want === "sniff" || want === "crawl"
            ? 7.4
            : want === "plate" || want === "hide" || want === "dig" || want === "growl"
              ? 8.2
              : 0;
      if (dist > 0.12 && spd > 0) {
        if (dist > 28) {
          p.x = tx;
          p.z = tz;
        } else {
          const step = Math.min(dist, spd * dt);
          p.x += (dx / dist) * step;
          p.z += (dz / dist) * step;
        }
        if (want !== "growl") yaw.current = Math.atan2(-dx, -dz);
      }
      if (want === "hop" || want === "fetch") hop.current = (hop.current + dt * 10) % (Math.PI * 2);
      else if (want === "dig") hop.current = (hop.current + dt * 16) % (Math.PI * 2);
      else hop.current *= Math.exp(-dt * 8);
      if (want === "look" || (want === "sniff" && live.stillT > 0.6)) {
        const gaze = nearestSight(p.x, p.z);
        if (gaze) {
          const ty = Math.atan2(-(gaze.x - p.x), -(gaze.z - p.z));
          let dAng = ty - yaw.current;
          while (dAng > Math.PI) dAng -= Math.PI * 2;
          while (dAng < -Math.PI) dAng += Math.PI * 2;
          yaw.current += dAng * Math.min(1, dt * 3.6);
        }
      }
    }

    let gy = heightAt(p.x, p.z);
    const caged = phase === "den" || phase === "open";
    const bolting = phase === "bolt";
    if (bolting || caged) gy = heightAt(p.x, p.z);
    else if (phase === "search") gy = heightAt(LOST.den.x, LOST.den.z);
    else if (!following) gy = plat + shelf.yOff;
    else if (live.house === "yours") gy = plat;
    else if (live.house && live.houseY) gy = live.houseY;
    else if (live.mounted || live.balloonRide) gy = live.y;
    else if (live.swim) gy = Math.max(gy, 0.22);
    else if (live.grounded && live.y - gy > 2.2) gy = live.y;
    const bounce = want === "hop" || want === "fetch" ? Math.abs(Math.sin(hop.current)) * 0.28 : want === "dig" ? Math.abs(Math.sin(hop.current)) * 0.1 : 0;
    let targetY = gy + bounce;
    if (want === "sniff") targetY -= 0.06;
    if (want === "crawl" && live.nimJobT > 0.7 && live.nimJobT < 2.4) targetY -= 0.18;
    if (!following) p.y = targetY;
    else p.y += (targetY - p.y) * Math.min(1, 1 - Math.exp(-dt * 9));

    live.nimX = phase === "search" ? LOST.den.x : p.x;
    live.nimZ = phase === "search" ? LOST.den.z : p.z;
    live.nimY = p.y;
    live.nimMood = want;
    live.nimYaw = yaw.current;

    const show =
      following ||
      bolting ||
      caged ||
      (worldId === "meadow" && live.house === "yours" && !away);
    if (g.current) {
      g.current.position.set(p.x, p.y, p.z);
      g.current.rotation.y = yaw.current;
      g.current.visible = show;
      const crawlHide = want === "crawl" && live.nimJobT > 0.9 && live.nimJobT < 2.6;
      const sc = crawlHide ? 0.35 : 1;
      g.current.scale.setScalar(sc);
    }
    if (glow.current) {
      const night = live.dusk > 0.45 || live.dungeon;
      const alert = live.nimAlert;
      glow.current.color.set(alert > 0.35 ? "#c45c48" : "#f0d080");
      glow.current.intensity = (night ? 1.6 + Math.sin(live.playT * 2.4) * 0.4 : 0.15) + alert * 2.2;
    }

    const dPlayer = Math.hypot(live.x - p.x, live.z - p.z);
    if (show && dPlayer < 1.6 && !caged && phase !== "search") {
      if (!live.nearNpc || live.nearNpc === "nim") live.nearNpc = "nim";
    }
    if (
      show &&
      following &&
      !caged &&
      dPlayer < 1.2 &&
      live.stillT > 2.1 &&
      (want === "sit" || want === "idle") &&
      live.playT - lastPet.current > 16 &&
      !live.listen
    ) {
      lastPet.current = live.playT;
      live.listen = "He leans into your hand. The fur is warm. He is not a statue.";
    }
    if (show && (want === "hop" || want === "walk" || want === "fetch") && live.playT - lastPuff.current > 0.28 && bounce < 0.04) {
      lastPuff.current = live.playT;
      if (want === "hop" || want === "fetch") puffAt(p.x, p.z, gy, false);
    }

    if (freeze) return;
    const foes = live.lock;
    const fangD = foes ? Math.hypot(live.x - foes.x, live.z - foes.z) : 99;
    const foe = nearestFoe(live.x, live.z);
    const land = landAt(live.x, live.z).id;
    const line = considerNim({
      world: worldId,
      house: live.house,
      fangD,
      boss: Boolean(live.bossFight),
      hp: gState.hp,
      maxHp: playerMaxHp(gState.xp, gState.outfit, gState.heartsExtra ?? 0),
      cipherN: (gState.cipher ?? []).length,
      still: live.stillT,
      speed: Math.abs(live.speed),
      wet: live.swim || live.wetT > 0,
      night: live.dusk > 0.55,
      afterTalk: after.current,
      nearStatue: near(STATUE_AT) || (worldId === "cavern" && Math.hypot(live.x, live.z - (roomZ(3) + 12)) < 8),
      nearBridge: near(BRIDGE_AT, 10),
      nearCrate: near(ORDER_AT, 6),
      nearGourd: near(GOURD_AT, 6),
      nearPlate: Boolean(plate),
      dungeon: Boolean(live.dungeon) || worldId === "cavern",
      horse: live.mounted,
      jewel: Boolean(live.ceremony),
      low: gState.hp <= 8,
      item: live.getItem,
      village: live.area === "village",
      rain: live.rainT > 0.2,
      storm: stormOn(),
      fog: fogAmt() > 0.45,
      snow: snowAmt() > 0.4,
      mill: live.millSpin > 0.35,
      carry: live.carry,
      nearLoose: Boolean(nearestStuff(live.x, live.z, 2.1)),
      food: Math.hypot(live.x - FARM_AT.x, live.z - FARM_AT.z) < 8 || Math.hypot(live.x - POND.x, live.z - POND.z) < 10,
      fishing: Boolean(live.fishAct),
      fest: festOn() && live.area === "village",
      chase: chaseOn(),
      chaseLost: chase.phase === "hide" || chase.phase === "lost",
      place:
        live.placeName === "lookout"
          ? "lookout"
          : live.placeName === "silverrun" || live.placeName === "pond"
            ? "river"
            : live.placeName === "stoneback" || live.placeName === "summit"
              ? "mount"
              : live.placeName === "cavern" || live.placeName === "cavern-mouth"
                ? "cavern"
          : live.placeName === "undervale" ||
              live.placeName === "glow-grotto" ||
              live.placeName === "count"
            ? "undervale"
            : live.placeName === "blackwater"
              ? "blackwater"
              : live.placeName === "root-cathedral"
                ? "rootcat"
                : live.placeName === "elderfour"
                  ? "elderfour"
                  : live.placeName === "scent-hollow"
                ? "scent"
                : live.placeName === "keep-road"
                    ? "keeproad"
          : quietRoom() === "hall"
          ? "hall"
          : quietRoom() === "roots"
            ? "roots"
            : inHollow(live.x, live.z)
              ? "hollow"
              : land === "ruins" || land === "desert" || land === "snow" || land === "forest"
                ? land
                : worldId === "keep"
                  ? "keep"
                  : null,
      creature:
        live.longMode !== "hide" && Math.hypot(live.x - live.longX, live.z - live.longZ) < 110
          ? "long"
          : Math.hypot(live.x - FARM_AT.x, live.z - FARM_AT.z) < 7
            ? "pig"
            : live.carry === "cucco"
              ? "chicken"
              : live.fangMark?.kind === "peekit"
                ? "peekit"
                : live.fangMark?.kind === "jack"
                  ? "jack"
                  : live.fangMark?.kind === "hare"
                    ? "hare"
                    : live.fangMark?.kind === "ring"
                      ? "ring"
                      : live.fangMark?.kind === "hen"
                        ? "henmark"
                        : live.fangMark?.kind === "dial"
                          ? "dial"
                          : live.fangMark?.kind === "stump"
                            ? "stump"
                            : live.fangMark?.kind === "wick"
                              ? "wick"
                              : live.fangMark?.kind === "hearth"
                                ? "hearth"
                                : live.fangMark?.kind === "thorn"
                                  ? "thorn"
                                  : live.fangMark?.kind === "apple"
                                    ? "apple"
                                    : live.fangMark?.kind === "clamp"
                                      ? "clamp"
                                      : live.fangMark?.kind === "millstick"
                                        ? "millstick"
                                        : live.fangMark?.kind === "woodlog"
                                          ? "woodlog"
                                          : live.fangMark?.kind === "road"
                                            ? "road"
                                            : live.fangMark?.kind === "cart"
                                              ? "cart"
                                              : live.fangMark?.kind === "shrine"
                                                ? "shrine"
              : live.mounted
                ? "horse"
                : Math.hypot(live.x - 920, live.z - 1080) < 12
                  ? "fox"
                  : null,
      jobNear: jobSpot && !live.nimJob ? jobSpot.kind : null,
      danger: nimDangerAhead(live.x, live.z, live.yaw, Math.abs(live.speed) > 1.2),
      foeNear: Boolean(foe && foe.d < 12),
    });
    if (line) {
      const cat =
        line.includes("teeth") || line.includes("going first") ? "fang"
        : line.includes("snack") ? "sink"
        : line.includes("lying about being a floor") ? "ice"
        : line.includes("in a hurry") ? "rapids"
        : line.includes("chewing") ? "sniff"
        : line.includes("measuring") ? "hole"
        : line.includes("mound is a door") ? "dig"
        : line.includes("complain") ? "fetch"
        : line.includes("The smell did not") ? "track"
        : line.includes("watch you miss") || line.includes("still want credit") ? "fish"
        : line.includes("hung lanterns") ? "fest"
        : line.includes("involved") ? "food"
        : line.includes("better ones") ? "pig"
        : line.includes("personal insult") ? "hen"
        : line.includes("hill has legs") ? "long"
        : line.includes("ran out") ? "ruins"
        : line.includes("pretending to be a bed") ? "sand"
        : line.includes("white is lying") ? "snow"
        : line.includes("swim") ? "wet"
        : line.includes("leaking") ? "hurt"
        : line.includes("cushion") ? "wait"
        : line.includes("small legs") ? "run"
        : line.includes("hole in the sky") ? "night"
        : line.includes("name for the last") ? "fourth"
        : line.includes("count to three") ? "marks"
        : line.includes("planks") ? "bridge"
        : line.includes("wall is already") ? "statue"
        : line.includes("crates") || line.includes("Smallest") ? "crate"
        : line.includes("not scenery") ? "loose"
        : line.includes("groups") ? "gourd"
        : line.includes("heavy") ? "plate"
        : line.includes("sit behind") ? "horse"
        : line.includes("Light.") ? "jewel"
        : line.includes("Mouths") ? "hollow"
        : line.includes("shelf") ? "home"
        : line.includes("opinions") || line.includes("sing") || line.includes("Distance") || line.includes("Loud balls") || line.includes("points") ? "item"
        : line.includes("bird") || line.includes("collection") || line.includes("box is yours") ? "carry"
        : line.includes("towel") ? "rain"
        : line.includes("feet") ? "town"
        : line.includes("mill") ? "mill"
        : after.current ?? "say";
      if (nimYip(line, cat)) {
        sfx.ok();
        after.current = null;
      }
    }
  }, -1);

  return (
    <group>
      <group ref={g}>
        <group scale={1.12}>
          <FangWolf />
        </group>
        <pointLight ref={glow} color="#f0d080" intensity={0.2} distance={4.5} position={[0, 0.48, -0.1]} />
      </group>
      <NimJobMarks worldId={worldId} />
    </group>
  );
}

function near(at: { x: number; z: number }, r = 7) {
  return Math.hypot(live.x - at.x, live.z - at.z) < r;
}

function nearbyPlate(worldId: WorldId): { x: number; z: number } | null {
  const plates: { x: number; z: number }[] = [];
  if (worldId === "cavern") {
    plates.push({ x: 42, z: roomZ(2) }, { x: -22.4, z: roomZ(1) - 18 });
    plates.push(foxVent().innerPlate);
  }
  let best: { x: number; z: number } | null = null;
  let bestD = 6;
  for (const p of plates) {
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

function NimJobMarks({ worldId }: { worldId: WorldId }) {
  const [, bump] = useState(0);
  const n = useRef(0);
  useFrame(() => {
    const c = Object.keys(live.smashed).length + Object.keys(live.nimSniffed).length + (live.nimFollow ? 1 : 0);
    if (c !== n.current) {
      n.current = c;
      bump((x) => x + 1);
    }
  });
  const following = live.nimFollow;
  const spots = nimSpots().filter((s) => (s.world === "any" || s.world === worldId) && !spotDone(s.id));
  return (
    <group>
      {spots.map((s) => {
        const y = heightAt(s.x, s.z);
        if (s.kind === "crawl" && s.hole) {
          const hy = heightAt(s.hole.x, s.hole.z);
          return (
            <group key={s.id} position={[s.hole.x, hy + 0.03, s.hole.z]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.34, 10]} />
                <meshLambertMaterial color="#1a1410" />
              </mesh>
              <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.22, 0.34, 10]} />
                <meshLambertMaterial color="#3a2818" />
              </mesh>
            </group>
          );
        }
        if (s.kind === "dig" && spotReady(s)) {
          return (
            <group key={s.id} position={[s.x, y + 0.04, s.z]}>
              <mesh>
                <sphereGeometry args={[0.22, 7, 5]} />
                {lamb("#5a4028")}
              </mesh>
              <mesh position={[0.08, 0.02, -0.06]} scale={[0.7, 0.45, 0.7]}>
                <sphereGeometry args={[0.16, 6, 4]} />
                {lamb("#4a3018")}
              </mesh>
            </group>
          );
        }
        if (s.kind === "sniff" && following && spotReady(s)) {
          return <ScentMotes key={s.id} x={s.x} z={s.z} y={y} />;
        }
        if (s.kind === "fetch" && s.fetch && following) {
          const fy = heightAt(s.fetch.x, s.fetch.z);
          return (
            <mesh key={s.id} position={[s.fetch.x, fy + 0.55 + Math.sin(live.playT * 3) * 0.08, s.fetch.z]}>
              <octahedronGeometry args={[0.12, 0]} />
              <meshLambertMaterial color="#c9a227" emissive="#c9a227" emissiveIntensity={0.7} />
            </mesh>
          );
        }
        if (s.kind === "track" && s.trail && following) {
          return (
            <group key={s.id}>
              {s.trail.map((p, i) => (
                <mesh key={i} position={[p.x, heightAt(p.x, p.z) + 0.025, p.z]} rotation={[-Math.PI / 2, 0, i * 0.7]}>
                  <circleGeometry args={[0.11, 6]} />
                  <meshBasicMaterial color="#5a3a20" transparent opacity={0.45} />
                </mesh>
              ))}
            </group>
          );
        }
        return null;
      })}
    </group>
  );
}

function ScentMotes({ x, z, y }: { x: number; z: number; y: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!g.current) return;
    const t = live.playT;
    g.current.children.forEach((c, i) => {
      const u = (t * 0.55 + i * 0.22) % 1;
      c.position.set(Math.sin(t * 1.4 + i) * 0.22, 0.12 + u * 0.7, Math.cos(t * 1.1 + i) * 0.22);
      const m = c as THREE.Mesh;
      const mat = m.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = 0.55 * (1 - u);
    });
  });
  return (
    <group ref={g} position={[x, y, z]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.045, 5, 4]} />
          <meshBasicMaterial color="#e8c040" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
