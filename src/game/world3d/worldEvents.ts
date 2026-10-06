import { useGame } from "../store";
import { live } from "./live";
import { sfx } from "../audio";

/** 0 dormant, 1 distant cue, 2 active, 3 escalating, 4 resolved, 5 failed, 6 aftermath, 7 expired */
export const EV = {
  dormant: 0,
  spawning: 1,
  active: 2,
  escalating: 3,
  resolved: 4,
  failed: 5,
  aftermath: 6,
  expired: 7,
} as const;

export const CARAVAN = { x: 6, z: -52 };
export const CAMP = { x: 34, z: -18 };
export const BONES = { x: -46, z: -78 };
export const STALL = { x: 16, z: -78 };

type Run = { state: number; t: number; away: number; help: number; bell: number };

const run = new Map<string, Run>();

function saved(id: string) {
  return useGame.getState().quests?.[`ev_${id}`] ?? 0;
}

function commit(id: string, state: number) {
  const row = run.get(id);
  if (!row || row.state === state) return;
  row.state = state;
  row.t = 0;
  row.away = 0;
  row.help = 0;
  if (saved(id) !== state) useGame.getState().setQuest(`ev_${id}`, state);
}

function row(id: string): Run {
  let r = run.get(id);
  if (!r) {
    r = { state: saved(id), t: 0, away: 0, help: 0, bell: 0 };
    run.set(id, r);
  }
  return r;
}

export function eventState(id: string) {
  return row(id).state;
}

export function eventClock(id: string) {
  return row(id).t;
}

function surface() {
  return !live.realm || live.realm === "surface";
}

function dist(x: number, z: number) {
  return Math.hypot(live.x - x, live.z - z);
}

/** One cheap pass. Full scenes only exist near the player. */
export function tickEvents(dt: number) {
  if (!surface() || live.house) return;
  const car = row("caravan");
  const camp = row("camp");
  const bones = row("bones");
  const night = Boolean(live.night);
  const dCar = dist(CARAVAN.x, CARAVAN.z);
  const dBones = dist(BONES.x, BONES.z);

  if (car.state === EV.failed && !night) commit("caravan", EV.dormant);
  if (car.state === EV.resolved) commit("caravan", EV.aftermath);
  if ((car.state === EV.dormant || car.state === EV.expired) && night && dCar < 110) commit("caravan", EV.spawning);
  if (car.state === EV.spawning) {
    car.t += dt;
    car.bell -= dt;
    if (dCar < 80 && car.bell <= 0) {
      car.bell = 9;
      sfx.chime();
    }
    if (dCar < 26) commit("caravan", EV.active);
    else if (!night && car.t > 20) commit("caravan", EV.expired);
  } else if (car.state === EV.active) {
    car.t += dt;
    if (car.t > 18 && night) commit("caravan", EV.escalating);
    if (!night && car.t > 8) commit("caravan", EV.expired);
  } else if (car.state === EV.escalating) {
    car.t += dt;
    if (dCar < 8) {
      car.help += dt;
      car.away = 0;
      if (car.help > 5 || live.swinging) commit("caravan", EV.resolved);
    } else if (dCar > 64) {
      car.away += dt;
      if (car.away > 16) commit("caravan", EV.failed);
    }
    if (car.t > 70) commit("caravan", EV.failed);
  } else if (car.state === EV.aftermath && camp.state === EV.dormant && saved("camp") === 0) {
    commit("camp", EV.spawning);
  }

  if (camp.state === EV.spawning && dist(CAMP.x, CAMP.z) < 10) commit("camp", EV.active);
  if (camp.state === EV.active && dist(CAMP.x, CAMP.z) < 2.2) {
    if (!useGame.getState().quests?.ev_camp_loot) {
      useGame.getState().setQuest("ev_camp_loot", 1);
      useGame.getState().addCoins(18);
      live.banner = "The escaped bandit left a camp. And a purse.";
    }
    commit("camp", EV.resolved);
  }

  const hot = car.state === EV.active || car.state === EV.escalating;
  if (!hot) {
    if ((bones.state === EV.dormant || bones.state === EV.expired) && night && dBones < 70) commit("bones", EV.spawning);
    if (bones.state === EV.spawning && dBones < 12) commit("bones", EV.active);
    if (bones.state === EV.active && !night) commit("bones", EV.expired);
    if (bones.state === EV.failed && !night) commit("bones", EV.dormant);
  }
}

const BONE_LINES = [
  "The horned one says you did not hear them.",
  "The hat says you heard every word. The map is his.",
  "They both point at the dirt. The map is drawn upside down.",
];

export function stepEvents(talk: boolean) {
  if (!talk || !surface()) return false;
  const bones = row("bones");
  if (bones.state === EV.active && dist(BONES.x, BONES.z) < 3.2) {
    const n = (useGame.getState().quests?.ev_bones_line ?? 0) + 1;
    useGame.getState().setQuest("ev_bones_line", n);
    if (n >= 3) {
      if (!useGame.getState().quests?.ev_bones_map) {
        useGame.getState().setQuest("ev_bones_map", 1);
        useGame.getState().addCoins(10);
      }
      live.banner = "They drop the map and march off, still arguing about the hat.";
      commit("bones", EV.resolved);
    } else {
      live.banner = BONE_LINES[n - 1] ?? BONE_LINES[0];
    }
    return true;
  }
  const car = row("caravan");
  if ((car.state === EV.aftermath || car.state === EV.resolved) && dist(STALL.x, STALL.z) < 2.4) {
    if (!useGame.getState().quests?.ev_stall) {
      useGame.getState().setQuest("ev_stall", 1);
      useGame.getState().addCoins(8);
      sfx.ok();
    }
    live.banner = "The merchant knows you. The stall is open because the road stayed open.";
    return true;
  }
  if (car.state === EV.escalating && dist(CARAVAN.x, CARAVAN.z) < 8) {
    live.banner = "Stay with the cart. The guard is holding the road.";
    return true;
  }
  if (car.state === EV.failed && dist(CARAVAN.x, CARAVAN.z) < 8) {
    live.banner = "The cart is broken. The road remembers that you kept walking.";
    return true;
  }
  return false;
}

export function eventRows() {
  return ["caravan", "camp", "bones"].map((id) => ({ id, ...row(id) }));
}
