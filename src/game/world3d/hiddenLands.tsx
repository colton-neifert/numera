import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fieldHeight, TERRAIN_REV } from "./field";
import { lamb } from "./mats";
import { LushPond, LushRiver } from "./lush/water";
import { LushTree } from "./lush/trees";
import { addTrapSpot } from "./dungeonTraps";
import { duskAmt, live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { puffAt } from "./fx";
import {
  CAVE_HEART,
  CAVE_PATH,
  CAVE_PLATES,
  CRACK,
  DECOY_FALLS,
  FORGOT,
  FORGOT_TRUNKS,
  HAMLET,
  HOLLOW,
  HUSH,
  HUSH_FALLS,
  HUSH_LADDER,
  HUSH_LOG,
  HUSH_POOL,
  HUSH_TOWER,
  SHELF,
  STREAM,
  UNDER_BRIDGE,
  VEIL,
  VEIL_ISLE,
  VEIL_STONES,
  WHISPER,
  WHISPER_END,
  cavePlatesOpen,
  clearHushLog,
  hiddenMood,
  hushLogCleared,
  markMargin,
  openCavePlates,
  seenCave,
} from "./hidden";

const CAVE_RIVER_W: [number, number][] = [
  [-238.6, -250],
  [-232.3, -250],
];
const CAVE_RIVER_E: [number, number][] = [
  [-227.7, -250],
  [-221.4, -250],
];

type Note = { x: number; z: number; from: string; lines: string[] | (() => string[]) };

const NOTES: Note[] = [
  {
    x: -228.2,
    z: -256.4,
    from: "A wet page",
    lines: ["Three stones in the round room.", "The dark one drinks.", "It drinks last."],
  },
  {
    x: HAMLET.x + 4.2,
    z: HAMLET.z + 1.4,
    from: "A toy",
    lines: ["A horse with one ear.", "Someone small left it facing the water."],
  },
  {
    x: HAMLET.x - 6.4,
    z: HAMLET.z + 3.2,
    from: "A stone",
    lines: ["Reed.", "The mill still says his name. The stone does not."],
  },
  {
    x: -178.5,
    z: -246.2,
    from: "A broken cart",
    lines: ["One wheel. The rest of it is not here.", "Nobody came back."],
  },
  {
    x: UNDER_BRIDGE.x,
    z: UNDER_BRIDGE.z,
    from: "Under the boards",
    lines: ["I slept where the planks stay dry.", "The falls are loud enough to hide a person.", "I left the spiral where the roots drink."],
  },
  {
    x: HOLLOW.x,
    z: HOLLOW.z,
    from: "Inside the trunk",
    lines: ["A spiral, cut into the wood.", "The same hand, or a copy. You cannot tell."],
  },
  {
    x: CRACK.x - 1.4,
    z: CRACK.z,
    from: "A crack",
    lines: ["The loud water is a door.", "The quiet water is not."],
  },
  {
    x: WHISPER_END.x + 1.2,
    z: WHISPER_END.z,
    from: "Wet stone",
    lines: ["It stops.", "That is the whole story."],
  },
  {
    x: -232.4,
    z: -343.6,
    from: "A garden",
    lines: ["Carrots.", "They are not a message."],
  },
  {
    x: -246.8,
    z: -354.2,
    from: "A grave",
    lines: ["No name. A tin cup.", "Someone still pulls the weeds."],
  },
  {
    x: -228.6,
    z: -197.8,
    from: "A statue",
    lines: ["A person with no face, looking at the water.", "The base has a spiral, almost worn away."],
  },
  {
    x: SHELF.x,
    z: SHELF.z,
    from: "A high shelf",
    lines: ["A broken bench.", "The vale is below. Nothing else was left."],
  },
];

function noteLines(n: Note): string[] {
  return typeof n.lines === "function" ? n.lines() : n.lines;
}

/** Talk at a thing. No prompt until you do. */
export function tryHiddenRead() {
  if (live.house || live.dungeon || live.nearNpc || live.nearHouse || live.nearChest || live.talking) return false;
  const nightStone = Math.hypot(live.x - VEIL_ISLE.x, live.z - (VEIL_ISLE.z + 1.6)) < 1.45;
  if (nightStone) {
    const night = duskAmt() > 0.5;
    const known = seenCave();
    live.letter = {
      from: "A standing stone",
      lines: night
        ? known
          ? ["A spiral, cut the same way as the wet stone under the ridge.", "It only shows after the light goes."]
          : ["A spiral. It is hard to believe it was hidden by daylight.", "You do not know the other one yet."]
        : ["A warm stone.", "The cut is there. This light will not show it."],
    };
    live.pendingLetter = true;
    return true;
  }
  for (let i = 0; i < NOTES.length; i++) {
    const n = NOTES[i]!;
    if (Math.hypot(live.x - n.x, live.z - n.z) < 1.35) {
      live.letter = { from: n.from, lines: noteLines(n) };
      live.pendingLetter = true;
      return true;
    }
  }
  return false;
}

function yAt(x: number, z: number) {
  return fieldHeight(x, z);
}

function Rock({ x, z, s = 1, tint = "#6e6256" }: { x: number; z: number; s?: number; tint?: string }) {
  const y = yAt(x, z);
  return (
    <mesh position={[x, y + 0.22 * s, z]} rotation={[0.2, x * 0.2, 0.15]} castShadow>
      <dodecahedronGeometry args={[0.55 * s, 0]} />
      {lamb(tint, { kind: "stone" })}
    </mesh>
  );
}

function SpiralMark({ x, y, z, rot = 0, scale = 1 }: { x: number; y: number; z: number; rot?: number; scale?: number }) {
  const bits = [];
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const a = t * Math.PI * 3.1;
    const r = (0.06 + t * 0.38) * scale;
    bits.push(
      <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r, 0]}>
        <boxGeometry args={[0.055 * scale, 0.05 * scale, 0.03]} />
        {lamb("#e4d2a4", { kind: "stone" })}
      </mesh>,
    );
  }
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      {bits}
    </group>
  );
}

function FallsSheet({ x, z, tall }: { x: number; z: number; tall: number }) {
  const foot = yAt(x + 2.2, z);
  const crown = yAt(x - 2.4, z);
  const h = Math.max(tall, crown - foot + 1.4);
  const mid = foot + h * 0.5;
  return (
    <group position={[x, mid, z]} rotation={[0, Math.PI / 2, 0]}>
      <mesh>
        <planeGeometry args={[7.2, h]} />
        {lamb("#d7eef8", { transparent: true, opacity: 0.55, side: THREE.DoubleSide })}
      </mesh>
      <mesh position={[0, -0.2, 0.18]}>
        <planeGeometry args={[5.4, h * 0.92]} />
        {lamb("#f4fbff", { transparent: true, opacity: 0.38, side: THREE.DoubleSide })}
      </mesh>
      <mesh position={[0, -h * 0.42, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.4, 14]} />
        {lamb("#eef6f8", { transparent: true, opacity: 0.35, side: THREE.DoubleSide })}
      </mesh>
    </group>
  );
}

function ValleyWater() {
  return (
    <group>
      <LushPond x={HUSH_POOL.x} z={HUSH_POOL.z} r={HUSH_POOL.r} />
      <LushRiver pts={STREAM} w={2.2} lift={0.08} />
      <LushRiver pts={WHISPER} w={1.35} lift={0.06} />
      <FallsSheet x={HUSH_FALLS.x} z={HUSH_FALLS.z} tall={8} />
      <Rock x={HUSH_FALLS.x + 0.4} z={HUSH_FALLS.z - 4.4} s={1.8} />
      <Rock x={HUSH_FALLS.x + 0.2} z={HUSH_FALLS.z + 4.6} s={1.6} tint="#5c534c" />
    </group>
  );
}

function Hamlet() {
  const spots = useMemo(
    () => [
      { x: HAMLET.x - 2.2, z: HAMLET.z - 1.2, s: 1.4 },
      { x: HAMLET.x + 1.6, z: HAMLET.z - 2.4, s: 1.1 },
      { x: HAMLET.x - 0.4, z: HAMLET.z + 2.2, s: 0.8 },
    ],
    [],
  );
  return (
    <group>
      {spots.map((p, i) => (
        <mesh key={i} position={[p.x, yAt(p.x, p.z) + 0.55 * p.s, p.z]} castShadow>
          <boxGeometry args={[0.7 * p.s, 1.1 * p.s, 0.45 * p.s]} />
          {lamb(i === 0 ? "#2a2420" : "#6a5a48", { kind: "stone" })}
        </mesh>
      ))}
      <mesh position={[HAMLET.x - 2.2, yAt(HAMLET.x - 2.2, HAMLET.z - 1.2) + 1.35, HAMLET.z - 1.2]} rotation={[0.15, 0.4, 0.2]} castShadow>
        <boxGeometry args={[1.5, 0.12, 0.7]} />
        {lamb("#3a3028", { kind: "wood" })}
      </mesh>
      <group position={[-178.5, yAt(-178.5, -246.2), -246.2]} rotation={[0, 0.6, 0.4]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.16, 10]} />
          {lamb("#5a4030", { kind: "wood" })}
        </mesh>
        <mesh position={[0.7, 0.05, 0.2]}>
          <boxGeometry args={[1.1, 0.08, 0.28]} />
          {lamb("#4a3428", { kind: "wood" })}
        </mesh>
      </group>
      <group position={[HAMLET.x + 4.2, yAt(HAMLET.x + 4.2, HAMLET.z + 1.4), HAMLET.z + 1.4]} rotation={[0, 0.8, 0]}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.28, 0.1, 0.1]} />
          {lamb("#8a5a32", { kind: "wood" })}
        </mesh>
        <mesh position={[0.16, 0.2, 0]}>
          <boxGeometry args={[0.1, 0.08, 0.06]} />
          {lamb("#c9a06a", { kind: "wood" })}
        </mesh>
      </group>
      <mesh position={[HAMLET.x - 6.4, yAt(HAMLET.x - 6.4, HAMLET.z + 3.2) + 0.38, HAMLET.z + 3.2]} castShadow>
        <boxGeometry args={[0.7, 0.72, 0.16]} />
        {lamb("#8a8478", { kind: "stone" })}
      </mesh>
      <group position={[-188.2, yAt(-188.2, -244.6), -244.6]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[1.3, 0.08, 0.36]} />
          {lamb("#6a5340", { kind: "wood" })}
        </mesh>
        <mesh position={[-0.5, 0.22, 0]}>
          <boxGeometry args={[0.08, 0.4, 0.32]} />
          {lamb("#5a4332", { kind: "wood" })}
        </mesh>
        <mesh position={[0.5, 0.22, 0]}>
          <boxGeometry args={[0.08, 0.4, 0.32]} />
          {lamb("#5a4332", { kind: "wood" })}
        </mesh>
      </group>
    </group>
  );
}

function LowBridge() {
  const y = yAt(UNDER_BRIDGE.x, UNDER_BRIDGE.z + 2.2);
  return (
    <group position={[UNDER_BRIDGE.x, y, UNDER_BRIDGE.z]}>
      <mesh position={[0, 1.72, -1.5]} castShadow>
        <boxGeometry args={[1.35, 0.1, 5.2]} />
        {lamb("#6b5038", { kind: "wood" })}
      </mesh>
      <mesh position={[-0.55, 0.85, -3.4]}>
        <boxGeometry args={[0.12, 1.5, 0.12]} />
        {lamb("#5a4030", { kind: "wood" })}
      </mesh>
      <mesh position={[0.55, 0.85, -3.4]}>
        <boxGeometry args={[0.12, 1.5, 0.12]} />
        {lamb("#5a4030", { kind: "wood" })}
      </mesh>
      <mesh position={[0.15, 0.06, 0.15]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.7, 0.05, 0.4]} />
        {lamb("#8a6848", { kind: "cloth" })}
      </mesh>
      <mesh position={[-0.22, 0.08, -0.15]}>
        <cylinderGeometry args={[0.06, 0.05, 0.08, 6]} />
        {lamb("#8a8a84", { kind: "metal" })}
      </mesh>
    </group>
  );
}

function Tower() {
  const y = yAt(HUSH_TOWER.x, HUSH_TOWER.z);
  const h = HUSH_LADDER.h;
  const rungs = [];
  for (let i = 0; i < 16; i++) {
    rungs.push(
      <mesh key={i} position={[0, ((i + 0.5) / 16) * h, 0.16]}>
        <boxGeometry args={[0.42, 0.05, 0.06]} />
        {lamb("#6a4e34", { kind: "wood" })}
      </mesh>,
    );
  }
  return (
    <group>
      <mesh position={[HUSH_TOWER.x, y + h * 0.5, HUSH_TOWER.z]} castShadow>
        <cylinderGeometry args={[0.72, 0.95, h, 8]} />
        {lamb("#7a7168", { kind: "stone" })}
      </mesh>
      <mesh position={[HUSH_TOWER.x, y + h + 0.08, HUSH_TOWER.z]} castShadow>
        <cylinderGeometry args={[2.25, 2.25, 0.16, 10]} />
        {lamb("#6a6258", { kind: "stone" })}
      </mesh>
      <SpiralMark x={HUSH_TOWER.x + 0.78} y={y + 2.4} z={HUSH_TOWER.z} rot={Math.PI / 2} scale={0.7} />
      <group position={[HUSH_LADDER.x, y, HUSH_LADDER.z]} rotation={[0, HUSH_LADDER.yaw, 0]}>
        {rungs}
        <mesh position={[-0.22, h * 0.5, 0.16]}>
          <boxGeometry args={[0.05, h, 0.05]} />
          {lamb("#5a4030", { kind: "wood" })}
        </mesh>
        <mesh position={[0.22, h * 0.5, 0.16]}>
          <boxGeometry args={[0.05, h, 0.05]} />
          {lamb("#5a4030", { kind: "wood" })}
        </mesh>
      </group>
    </group>
  );
}

function TowerLift() {
  useFrame(() => {
    addTrapSpot(HUSH_TOWER.x, HUSH_TOWER.z, 2.42, HUSH_LADDER.h);
  }, -2);
  return null;
}

function CaveShell() {
  const built = useMemo(() => {
    const slabs: { x: number; y: number; z: number; sx: number; sy: number; sz: number; rot: number }[] = [];
    const pts = CAVE_PATH;
    const cover = (x: number, z: number, rx: number, rz: number, floor: number) => {
      const bank = Math.min(fieldHeight(x + rx * 5.5, z + rz * 5.5), fieldHeight(x - rx * 5.5, z - rz * 5.5));
      if (bank < floor + 2.2) return null;
      const bot = floor + 3.15;
      const top = Math.max(bot + 0.4, bank + 0.2);
      return { y: (bot + top) / 2, sy: top - bot };
    };
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len = Math.hypot(dx, dz) || 1;
      const steps = Math.max(1, Math.round(len / 4.2));
      const rot = Math.atan2(dx, dz);
      const rx = -dz / len;
      const rz = dx / len;
      for (let s = 0; s < steps; s++) {
        const u = (s + 0.5) / steps;
        if (i === pts.length - 2 && u > 0.62) continue;
        const x = a[0] + dx * u;
        const z = a[1] + dz * u;
        if (Math.hypot(x + 230, z + 250) < 5.5) continue;
        const floor = fieldHeight(x, z);
        const cap = cover(x, z, rx, rz, floor);
        if (!cap) continue;
        slabs.push({ x, y: cap.y, z, sx: 7.4, sy: cap.sy, sz: len / steps + 0.7, rot });
      }
    }
    const cFloor = fieldHeight(-230, -250);
    let bank = Infinity;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      bank = Math.min(bank, fieldHeight(-230 + Math.cos(a) * 10, -250 + Math.sin(a) * 10));
    }
    let drip = false;
    if (bank > cFloor + 2.4) {
      const bot = cFloor + 5.4;
      const top = Math.max(bot + 0.5, bank + 0.3);
      slabs.push({ x: -230, y: (bot + top) / 2, z: -250, sx: 13.5, sy: top - bot, sz: 13.5, rot: 0 });
      drip = true;
    }
    const hFloor = fieldHeight(CAVE_HEART.x, CAVE_HEART.z);
    const hBank = Math.min(
      fieldHeight(CAVE_HEART.x + 5, CAVE_HEART.z),
      fieldHeight(CAVE_HEART.x, CAVE_HEART.z + 5),
    );
    if (hBank > hFloor + 2.2) {
      const bot = hFloor + 3.2;
      const top = Math.max(bot + 0.4, hBank + 0.15);
      slabs.push({ x: CAVE_HEART.x, y: (bot + top) / 2, z: CAVE_HEART.z, sx: 6.4, sy: top - bot, sz: 6.4, rot: 0 });
    }
    return { slabs, drip, cFloor };
  }, [TERRAIN_REV]);
  const floor = built.cFloor;
  return (
    <group>
      {built.slabs.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]} rotation={[0, s.rot, 0]} castShadow>
          <boxGeometry args={[s.sx, s.sy, s.sz]} />
          {lamb("#2c2824", { kind: "stone" })}
        </mesh>
      ))}
      {built.drip
        ? Array.from({ length: 7 }, (_, i) => {
            const a = (i / 7) * Math.PI * 2;
            const x = -230 + Math.cos(a) * 4.2;
            const z = -250 + Math.sin(a) * 4.2;
            return (
              <mesh key={`st${i}`} position={[x, floor + 5.1, z]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.16, 0.55 + (i % 3) * 0.12, 5]} />
                {lamb("#3a342c", { kind: "stone" })}
              </mesh>
            );
          })
        : null}
      {built.drip ? (
        <mesh position={[-224.2, floor + 3.4, -250]}>
          <planeGeometry args={[0.28, 4.2]} />
          {lamb("#c5dff0", { transparent: true, opacity: 0.45, side: THREE.DoubleSide })}
        </mesh>
      ) : null}
      <SpiralMark x={-230} y={floor + 1.7} z={-243.6} rot={0} />
      <LushRiver pts={CAVE_RIVER_W} w={2.4} lift={0.05} />
      <LushRiver pts={CAVE_RIVER_E} w={2.4} lift={0.05} />
      {Array.from({ length: 6 }, (_, i) => {
        const x = -230 + (i - 2.5) * 0.35;
        const z = -256 + i * 2.1;
        return (
          <mesh key={`pl${i}`} position={[x, yAt(x, z) + 0.08, z]}>
            <boxGeometry args={[1.15, 0.08, 0.34]} />
            {lamb("#5a4030", { kind: "wood" })}
          </mesh>
        );
      })}
      {[
        [-232.4, -244.2],
        [-226.5, -247.5],
        [-234.2, -255.2],
        [-224.8, -236.4],
        [-231.2, -268.5],
        [-233.5, -290],
      ].map(([x, z], i) => (
        <group key={`mu${i}`} position={[x!, yAt(x!, z!), z!]}>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.045, 0.06, 0.26, 5]} />
            {lamb("#efe4cc", { kind: "wood" })}
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <sphereGeometry args={[0.14 + (i % 3) * 0.02, 7, 5]} />
            {lamb(i % 2 ? "#6a3a68" : "#3a6a58", { emissive: "#241428", emit: 0.28 })}
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Plates({ open }: { open: boolean }) {
  return (
    <group>
      {CAVE_PLATES.map(([x, z], i) => {
        const wet = i === 2;
        return (
          <mesh key={i} position={[x, yAt(x, z) + 0.06, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.62, 12]} />
            {lamb(wet ? "#1c3a44" : "#8a7a58", { kind: "stone", emissive: wet ? "#1a4a55" : "#000000", emit: open && wet ? 0.4 : wet ? 0.18 : 0 })}
          </mesh>
        );
      })}
      {open ? null : (
        <group>
          <Rock x={-236.2} z={-250} s={1.35} tint="#4a453e" />
          <Rock x={-238.2} z={-248.75} s={1.15} />
          <Rock x={-238.2} z={-251.25} s={1.2} tint="#5a534a" />
        </group>
      )}
      <mesh position={[-228.2, yAt(-228.2, -256.4) + 0.04, -256.4]} rotation={[-Math.PI / 2, 0, 0.4]}>
        <planeGeometry args={[0.42, 0.28]} />
        {lamb("#d9cba6", { kind: "cloth" })}
      </mesh>
    </group>
  );
}

function Forgotten({ broke }: { broke: boolean }) {
  return (
    <group>
      {FORGOT_TRUNKS.map(([x, z], i) => (
        <LushTree key={i} kind={i % 4 === 0 ? "pine" : "oak"} variant={i + 2} scale={1.55 + (i % 3) * 0.15} position={[x, yAt(x, z) - 0.2, z]} />
      ))}
      <LushTree kind="oak" variant={4} scale={1.8} position={[FORGOT.x + 8, yAt(FORGOT.x + 8, FORGOT.z + 4) - 0.2, FORGOT.z + 4]} />
      <group position={[-234, yAt(-234, -351), -351]}>
        <mesh position={[0, 1.15, -1.6]}>
          <boxGeometry args={[5.4, 2.1, 0.18]} />
          {lamb("#6a5844", { kind: "wood" })}
        </mesh>
        <mesh position={[-3.2, 1.15, 1.5]}>
          <boxGeometry args={[0.18, 2.1, 3.2]} />
          {lamb("#5c4a38", { kind: "wood" })}
        </mesh>
        <mesh position={[3.2, 1.15, 1.5]}>
          <boxGeometry args={[0.18, 2.1, 3.2]} />
          {lamb("#5c4a38", { kind: "wood" })}
        </mesh>
        <mesh position={[0, 2.35, 0]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[6.2, 0.12, 4.4]} />
          {lamb("#4a5a3a", { kind: "shingle" })}
        </mesh>
        <mesh position={[1.4, 2.7, -0.4]}>
          <boxGeometry args={[0.4, 0.7, 0.4]} />
          {lamb("#5a4034", { kind: "stone" })}
        </mesh>
      </group>
      {Array.from({ length: 5 }, (_, i) => {
        const x = -233.2 + (i % 3) * 0.7;
        const z = -343.4 - Math.floor(i / 3) * 0.55;
        return (
          <mesh key={i} position={[x, yAt(x, z) + 0.08, z]}>
            <coneGeometry args={[0.12, 0.22, 5]} />
            {lamb("#3d8a40", { kind: "leaf" })}
          </mesh>
        );
      })}
      <mesh position={[-246.8, yAt(-246.8, -354.2) + 0.32, -354.2]}>
        <boxGeometry args={[0.55, 0.6, 0.14]} />
        {lamb("#8d877c", { kind: "stone" })}
      </mesh>
      {broke ? null : (
        <group position={[HUSH_LOG.x, yAt(HUSH_LOG.x, HUSH_LOG.z) + 0.42, HUSH_LOG.z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.42, 0.48, 8.2, 8]} />
            {lamb("#5a4030", { kind: "wood" })}
          </mesh>
          <mesh position={[0, 0, 3.6]} rotation={[0.4, 0.2, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 1.4, 5]} />
            {lamb("#3d6a32", { kind: "leaf" })}
          </mesh>
        </group>
      )}
    </group>
  );
}

function Deer() {
  const g = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    const u = t.current * 0.18;
    const x = FORGOT.x + 4.8 + Math.sin(u) * 3.4;
    const z = FORGOT.z - 7.2 + Math.cos(u * 0.75) * 2.2;
    if (!g.current) return;
    g.current.position.set(x, yAt(x, z), z);
    const vx = Math.cos(u) * 0.6;
    const vz = -Math.sin(u * 0.75) * 0.3;
    if (Math.hypot(vx, vz) > 0.05) g.current.rotation.y = Math.atan2(vx, vz);
    const step = Math.sin(t.current * 2.6);
    legs.current.forEach((leg, i) => {
      if (leg) leg.rotation.x = (i % 2 ? step : -step) * 0.4;
    });
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0.78, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.16, 0.62, 4, 8]} />
        {lamb("#8d6a42", { kind: "wool" })}
      </mesh>
      <mesh position={[0, 1.15, 0.42]} castShadow>
        <sphereGeometry args={[0.13, 8, 6]} />
        {lamb("#7a5a38", { kind: "wool" })}
      </mesh>
      <mesh position={[-0.08, 1.28, 0.4]} rotation={[0.4, 0, -0.5]}>
        <coneGeometry args={[0.03, 0.22, 4]} />
        {lamb("#4a3828", { kind: "wood" })}
      </mesh>
      <mesh position={[0.08, 1.28, 0.4]} rotation={[0.4, 0, 0.5]}>
        <coneGeometry args={[0.03, 0.22, 4]} />
        {lamb("#4a3828", { kind: "wood" })}
      </mesh>
      {[
        [-0.1, 0.12],
        [0.1, 0.12],
        [-0.1, -0.28],
        [0.1, -0.28],
      ].map(([lx, lz], i) => (
        <group
          key={i}
          ref={(el) => {
            legs.current[i] = el;
          }}
          position={[lx!, 0.62, lz!]}
        >
          <mesh position={[0, -0.22, 0]}>
            <cylinderGeometry args={[0.035, 0.04, 0.42, 5]} />
            {lamb("#5c4632", { kind: "wool" })}
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Veil() {
  const stone = useRef<THREE.MeshLambertMaterial>(null);
  useFrame(() => {
    if (!stone.current) return;
    const n = duskAmt();
    stone.current.emissiveIntensity = n > 0.45 ? 0.15 + n * 0.7 : 0.02;
  });
  const isleY = yAt(VEIL_ISLE.x, VEIL_ISLE.z);
  return (
    <group>
      <LushPond x={VEIL.x} z={VEIL.z} r={VEIL.r * 0.96} />
      {VEIL_STONES.map(([x, z], i) => (
        <mesh key={i} position={[x, yAt(x, z) + 0.18, z]} castShadow>
          <dodecahedronGeometry args={[0.42, 0]} />
          {lamb("#7a7368", { kind: "stone" })}
        </mesh>
      ))}
      <LushTree kind="pine" variant={1} scale={1.15} position={[VEIL_ISLE.x + 1.4, isleY - 0.15, VEIL_ISLE.z - 0.8]} />
      <mesh position={[VEIL_ISLE.x - 0.2, isleY + 0.85, VEIL_ISLE.z + 1.6]} castShadow>
        <boxGeometry args={[0.55, 1.5, 0.28]} />
        <meshLambertMaterial ref={stone} color="#6a7380" emissive="#9fd0c8" emissiveIntensity={0.02} />
      </mesh>
      <SpiralMark x={VEIL_ISLE.x - 0.2} y={isleY + 1.15} z={VEIL_ISLE.z + 1.78} scale={0.55} />
      <mesh position={[VEIL.x + 4.5, yAt(VEIL.x, VEIL.z) - 1.35, VEIL.z - 3]} rotation={[0.2, 0.6, 0]}>
        <capsuleGeometry args={[0.28, 0.8, 4, 6]} />
        {lamb("#5a6a62", { kind: "stone" })}
      </mesh>
    </group>
  );
}

function Quiets() {
  const hy = yAt(HOLLOW.x, HOLLOW.z);
  return (
    <group>
      <group position={[HOLLOW.x, hy, HOLLOW.z]}>
        <mesh rotation={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[1.15, 1.35, 3.4, 8, 1, true, 0.7, Math.PI * 1.7]} />
          {lamb("#5a4030", { kind: "bark", side: THREE.DoubleSide })}
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[1.7, 8, 6]} />
          {lamb("#3d6a32", { kind: "leaf" })}
        </mesh>
        <SpiralMark x={0.15} y={1.15} z={0.15} scale={0.85} />
      </group>
      <Rock x={CRACK.x + 0.8} z={CRACK.z + 1.55} s={1.7} />
      <Rock x={CRACK.x + 0.8} z={CRACK.z - 1.55} s={1.65} tint="#5a534c" />
      <Rock x={CRACK.x - 2.3} z={CRACK.z + 1.7} s={1.3} />
      <Rock x={CRACK.x - 2.3} z={CRACK.z - 1.7} s={1.35} tint="#4e4944" />
      <SpiralMark x={CRACK.x - 1.5} y={yAt(CRACK.x - 1.5, CRACK.z) + 0.7} z={CRACK.z} rot={Math.PI / 2} scale={0.6} />
      <FallsSheet x={WHISPER_END.x} z={WHISPER_END.z} tall={3.2} />
      <Rock x={WHISPER_END.x - 1.4} z={WHISPER_END.z + 0.4} s={1.5} />
      <Rock x={WHISPER_END.x} z={WHISPER_END.z - 1.3} s={1.2} />
      <FallsSheet x={DECOY_FALLS.x} z={DECOY_FALLS.z} tall={5.5} />
      <Rock x={DECOY_FALLS.x - 1.6} z={DECOY_FALLS.z} s={2.1} tint="#6a645c" />
      <Rock x={DECOY_FALLS.x - 0.3} z={DECOY_FALLS.z - 2.5} s={1.3} />
      <Rock x={DECOY_FALLS.x - 0.3} z={DECOY_FALLS.z + 2.5} s={1.25} />
      <group position={[SHELF.x, yAt(SHELF.x, SHELF.z), SHELF.z]}>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[3.2, 0.35, 1.4]} />
          {lamb("#7a7368", { kind: "stone" })}
        </mesh>
        <mesh position={[-0.8, 0.7, 0.15]} rotation={[0.4, 0.2, 0.5]}>
          <boxGeometry args={[1.1, 0.1, 0.28]} />
          {lamb("#5a4030", { kind: "wood" })}
        </mesh>
        <mesh position={[1.3, 0.9, -0.2]}>
          <boxGeometry args={[0.35, 0.7, 0.35]} />
          {lamb("#6a6258", { kind: "stone" })}
        </mesh>
      </group>
      <mesh position={[-228.6, yAt(-228.6, -197.8) + 1.05, -197.8]} castShadow>
        <capsuleGeometry args={[0.32, 0.9, 4, 6]} />
        {lamb("#8a8478", { kind: "stone" })}
      </mesh>
      <SpiralMark x={-228.6} y={yAt(-228.6, -197.8) + 0.35} z={-197.2} scale={0.45} />
      {[
        [-158, -220],
        [-152, -224],
        [-146, -227],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x!, yAt(x!, z!) + 0.02, z!]} rotation={[-Math.PI / 2, 0, i]}>
          <circleGeometry args={[0.16, 6]} />
          {lamb("#5a4632", { kind: "dirt" })}
        </mesh>
      ))}
    </group>
  );
}

function Critters() {
  const rabbit = useRef<THREE.Group>(null);
  const bird = useRef<THREE.Group>(null);
  const wing = useRef<THREE.Mesh>(null);
  const flies = useRef<THREE.Group>(null);
  const t = useRef(0);
  const ran = useRef(false);
  const run = useRef(-1);
  const flyHome = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        x: HUSH.x + Math.cos(i * 1.7) * (6 + (i % 4) * 3),
        z: HUSH.z + Math.sin(i * 1.3) * (5 + (i % 3) * 2.5),
        p: i * 0.7,
      })),
    [],
  );
  useFrame((_, dt) => {
    t.current += dt;
    if (!ran.current && Math.hypot(live.x + 112, live.z + 204) < 18) {
      ran.current = true;
      run.current = 0;
    }
    if (rabbit.current) {
      if (run.current < 0) {
        rabbit.current.position.set(-118, yAt(-118, -208), -208);
        rabbit.current.visible = true;
      } else {
        run.current += dt;
        const u = Math.min(1, run.current / 6.5);
        const x = -118 + (-162 - -118) * u;
        const z = -208 + (-226 - -208) * u;
        rabbit.current.position.set(x, yAt(x, z), z);
        rabbit.current.rotation.y = Math.atan2(-44, -18);
        rabbit.current.visible = u < 1;
      }
    }
    if (bird.current) {
      const ang = t.current * 0.32;
      let x = -156 + Math.cos(ang) * 9;
      let z = -208 + Math.sin(ang * 0.8) * 5;
      const k = Math.max(0, Math.sin(t.current * 0.17));
      x = x * (1 - k * 0.45) + HUSH_FALLS.x * k * 0.45;
      z = z * (1 - k * 0.45) + HUSH_FALLS.z * k * 0.45;
      const py = yAt(x, z) + 8 + Math.sin(t.current * 1.6) * 0.7;
      bird.current.position.set(x, py, z);
      bird.current.rotation.y = ang;
      if (wing.current) wing.current.rotation.z = Math.sin(t.current * 11) * 0.7;
    }
    if (flies.current) {
      flies.current.visible = duskAmt() > 0.4;
      flies.current.children.forEach((c, i) => {
        const h = flyHome[i];
        if (!h) return;
        const y = yAt(h.x, h.z) + 0.8 + Math.sin(t.current * 1.4 + h.p) * 0.45;
        c.position.set(h.x + Math.sin(t.current + h.p) * 0.4, y, h.z + Math.cos(t.current * 0.8 + h.p) * 0.4);
      });
    }
  });
  return (
    <group>
      <group ref={rabbit}>
        <mesh position={[0, 0.16, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.07, 0.16, 3, 5]} />
          {lamb("#c8b49a", { kind: "wool" })}
        </mesh>
        <mesh position={[-0.04, 0.28, 0.08]} rotation={[0.2, 0, -0.4]}>
          <boxGeometry args={[0.02, 0.12, 0.02]} />
          {lamb("#e6d8c4", { kind: "wool" })}
        </mesh>
        <mesh position={[0.04, 0.28, 0.08]} rotation={[0.2, 0, 0.4]}>
          <boxGeometry args={[0.02, 0.12, 0.02]} />
          {lamb("#e6d8c4", { kind: "wool" })}
        </mesh>
      </group>
      <group ref={bird}>
        <mesh>
          <sphereGeometry args={[0.12, 6, 5]} />
          {lamb("#d7e4ef")}
        </mesh>
        <mesh ref={wing} position={[0.12, 0, 0]}>
          <boxGeometry args={[0.22, 0.02, 0.08]} />
          {lamb("#eef4f8")}
        </mesh>
      </group>
      <group ref={flies}>
        {flyHome.map((h, i) => (
          <mesh key={i} position={[h.x, 2, h.z]}>
            <sphereGeometry args={[0.045, 4, 4]} />
            {lamb("#d6f0a8", { emissive: "#c6e86a", emit: 0.8 })}
          </mesh>
        ))}
      </group>
    </group>
  );
}

function HiddenLogic({ onLog, onPlates }: { onLog: () => void; onPlates: () => void }) {
  const latched = useRef(false);
  const dent = useRef(false);
  const chops = useRef(0);
  const step = useRef(0);
  const plateLatched = useRef(-1);
  useFrame(() => {
    if (live.paused || live.house) return;
    const mood = hiddenMood(live.x, live.z);
    if (mood === "hush" || mood === "cave" || mood === "veil" || mood === "forgot") markMargin(mood);
    if (!live.swinging) latched.current = false;
    else if (!latched.current && live.slash && !hushLogCleared()) {
      let near = false;
      for (let i = -3; i <= 3; i++) {
        if (Math.hypot(live.slash.x - (HUSH_LOG.x + i * 1.15), live.slash.z - HUSH_LOG.z) < 1.4) near = true;
      }
      if (near) {
        latched.current = true;
        const g = useGame.getState();
        if (live.holding === "axe" && g.hasAxe) {
          chops.current += 1;
          sfx.chop();
          puffAt(HUSH_LOG.x, HUSH_LOG.z, yAt(HUSH_LOG.x, HUSH_LOG.z) + 0.5, chops.current >= 3);
          if (chops.current >= 3) {
            clearHushLog();
            const had = g.wood ?? 0;
            g.addWood(2);
            if (had === 0) revealItem("wood", true);
            onLog();
          }
        } else if (live.holding === "sword" && g.hasSword && !dent.current) {
          dent.current = true;
          live.listen = "It dents. It does not move.";
          sfx.thud();
        }
      }
    }
    if (cavePlatesOpen() || !live.grounded) {
      if (!live.grounded) plateLatched.current = -1;
      return;
    }
    let on = -1;
    for (let i = 0; i < CAVE_PLATES.length; i++) {
      const p = CAVE_PLATES[i]!;
      if (Math.hypot(live.x - p[0], live.z - p[1]) < 0.72) on = i;
    }
    if (on < 0) {
      plateLatched.current = -1;
      return;
    }
    if (on === plateLatched.current) return;
    plateLatched.current = on;
    const order = [0, 1, 2];
    if (on === order[step.current]) {
      step.current += 1;
      sfx.ok();
      if (step.current >= 3) {
        openCavePlates();
        sfx.chime();
        puffAt(-237, -250, yAt(-237, -250) + 0.4, true);
        onPlates();
      }
    } else {
      step.current = on === 0 ? 1 : 0;
      sfx.thud();
    }
  });
  return null;
}

export function HiddenLands() {
  const [broke, setBroke] = useState(false);
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    if (hushLogCleared()) setBroke(true);
    if (cavePlatesOpen()) setOpened(true);
  }, []);
  return (
    <group>
      <HiddenLogic onLog={() => setBroke(true)} onPlates={() => setOpened(true)} />
      <TowerLift />
      <ValleyWater />
      <Hamlet />
      <LowBridge />
      <Tower />
      <CaveShell />
      <Plates open={opened} />
      <Forgotten broke={broke} />
      <Deer />
      <Veil />
      <Quiets />
      <Critters />
    </group>
  );
}
