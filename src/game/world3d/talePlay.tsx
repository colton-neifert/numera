import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, TREE_HOME, TREE_HD, TREE_DECK_D, LOOK_AT } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { addTrapSpot } from "./dungeonTraps";
import { consumeTalk as consumeTalkRaw } from "../input";
import type { Ladder } from "./climb";

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
}

function talkOk() {
  if (live.nearNpc || live.nearHouse || live.nearChest || live.nearHorse) return false;
  return consumeTalkRaw();
}

const HATCH = { x: TREE_HOME.x + 3.4, z: TREE_HOME.z + TREE_HD + 0.9 };
const CELLAR = { x: TREE_HOME.x + 3.4, z: TREE_HOME.z + TREE_HD + TREE_DECK_D + 2.2 };
const FENCE = { x: TREE_TRUNK.x + 32.4, z: TREE_TRUNK.z + 4.2 };
const SONG = { x: TREE_TRUNK.x - 14.8, z: TREE_TRUNK.z - 6.2 };
let cellarOn = false;

export function taleLadders(): Ladder[] {
  if (!cellarOn) return [];
  return [{ id: "cellar", x: CELLAR.x, z: CELLAR.z, yaw: 0, h: 4.6, half: 0.7 }];
}

export function TalePlay() {
  return (
    <group>
      <RootCellar />
      <HorseFence />
      <RainBow />
      <SongRock />
      <NightKnock />
      <LookSpy />
    </group>
  );
}

function fadeWarp(
  going: { current: "" | "in" | "out" },
  t: { current: number },
  dt: number,
  onMid: (dir: "in" | "out") => void,
) {
  if (!going.current) return;
  t.current += dt;
  const u = Math.min(1, t.current / 1.1);
  if (u < 0.5) live.roomFade = u / 0.5;
  else {
    live.roomFade = 1 - (u - 0.5) / 0.5;
    live.roomFadeOut = true;
  }
  live.speed = 0;
  if (u > 0.48 && u < 0.56) onMid(going.current);
  if (u >= 1) {
    going.current = "";
    live.roomFade = 0;
    live.roomFadeOut = false;
  }
}

function RootCellar() {
  const hy = heightAt(HATCH.x, HATCH.z);
  const cy = heightAt(CELLAR.x, CELLAR.z) - 2.4;
  const inC = useRef(false);
  const going = useRef<"" | "in" | "out">("");
  const t = useRef(0);
  useFrame((_, dt) => {
    if (live.house && !inC.current) return;
    const dH = Math.hypot(live.x - HATCH.x, live.z - HATCH.z);
    if (!going.current && !inC.current && dH < 0.85 && (talkOk() || live.y < hy + 0.3)) {
      going.current = "in";
      t.current = 0;
    }
    if (!going.current && inC.current && live.climbH > 2.2) {
      going.current = "out";
      t.current = 0;
    }
    fadeWarp(going, t, dt, (dir) => {
      cellarOn = dir === "in";
      inC.current = cellarOn;
      live.cave = cellarOn;
      if (dir === "in") {
        live.house = null;
        live.x = CELLAR.x;
        live.z = CELLAR.z;
        live.y = cy + 0.2;
        pay(10, "rootcellar");
        live.listen = "Under the tree. Roots. Quiet. A box.";
      } else {
        live.x = HATCH.x;
        live.z = HATCH.z - 1.2;
        live.y = hy + 0.2;
        live.cave = false;
      }
    });
    if (inC.current) {
      addTrapSpot(CELLAR.x, CELLAR.z, 1.6, cy + 0.05 - heightAt(CELLAR.x, CELLAR.z));
      if (Math.hypot(live.x - CELLAR.x, live.z - CELLAR.z) < 1.1 && talkOk()) {
        pay(14, "cellarbox");
        live.listen = "Gran’s winter jars. And a rupee in the sugar.";
      }
    }
    if (dH < 1.4 && !inC.current) live.listen = live.listen || "A hatch under the tree. Climb down.";
  }, 1);
  return (
    <group>
      <mesh position={[HATCH.x, hy + 0.04, HATCH.z]} rotation={[-Math.PI / 2, 0, 0.2]}>
        <circleGeometry args={[0.55, 8]} />
        <meshLambertMaterial color="#3a2818" />
      </mesh>
      <group position={[CELLAR.x, cy, CELLAR.z]}>
        {[-1.7, 1.7].map((s) => (
          <mesh key={s} position={[s, 1.1, 0]}>
            <boxGeometry args={[0.3, 2.2, 3.4]} />
            <meshLambertMaterial color="#2a1c12" />
          </mesh>
        ))}
        <mesh position={[0, 1.1, 1.7]}>
          <boxGeometry args={[3.4, 2.2, 0.3]} />
          <meshLambertMaterial color="#2a1c12" />
        </mesh>
        <mesh position={[0, 0.22, 0.3]}>
          <boxGeometry args={[0.5, 0.35, 0.4]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      </group>
    </group>
  );
}

function HorseFence() {
  const y = heightAt(FENCE.x, FENCE.z);
  const over = useRef(false);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - FENCE.x, live.z - FENCE.z);
    if (live.mounted && d < 1.8 && live.y > y + 1.4) {
      over.current = true;
      pay(10, "horsefence");
      live.listen = "The horse jumped. Flowers on the other side.";
    }
    if (over.current && d < 3.2 && !live.mounted && Math.hypot(live.x - FENCE.x, live.z - (FENCE.z + 3)) < 2.2) {
      pay(8, "fenceflowers");
      live.listen = "A rupee in the flowers. The horse knew.";
    }
    if (d < 2.4 && live.mounted) live.listen = live.listen || "A fence. The horse can jump it.";
  });
  return (
    <group position={[FENCE.x, y, FENCE.z]}>
      {[-1.2, 0, 1.2].map((s) => (
        <mesh key={s} position={[s, 0.55, 0]}>
          <boxGeometry args={[0.08, 1.1, 0.08]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      ))}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[2.6, 0.08, 0.08]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 0.12, 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.4, 10]} />
        <meshLambertMaterial color="#c45c78" />
      </mesh>
    </group>
  );
}

function RainBow() {
  const show = useRef(false);
  const g = useRef<THREE.Group>(null);
  const x = TREE_TRUNK.x - 8;
  const z = TREE_TRUNK.z - 18;
  useFrame((_, dt) => {
    if (live.rainT > 0.6) show.current = true;
    if (live.rainT > 0.05 && live.rainT < 0.25 && live.dusk < 0.4) show.current = true;
    const on = show.current && live.dusk < 0.55 && live.rainT < 0.45;
    if (g.current) g.current.visible = on;
    if (!on || live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 3.2) {
      pay(12, "rainbow");
      live.listen = "You walked under it. The end is never where you think.";
    }
  });
  return (
    <group ref={g} position={[x, heightAt(x, z) + 4.2, z]} visible={false} rotation={[0, 0.4, 0]}>
      {["#c42828", "#e09030", "#e8d448", "#3a8a38", "#3a6ab0", "#6a3a8a"].map((c, i) => (
        <mesh key={c} rotation={[0, 0, 0]}>
          <torusGeometry args={[3.2 - i * 0.16, 0.08, 5, 18, Math.PI]} />
          <meshLambertMaterial color={c} />
        </mesh>
      ))}
    </group>
  );
}

function SongRock() {
  const y = heightAt(SONG.x, SONG.z);
  const down = useRef(0);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - SONG.x, live.z - SONG.z);
    if (d < 3.4 && live.ocarina) down.current = Math.min(1, down.current + dt * 0.55);
    if (down.current > 0.85 && g.current) {
      pay(12, "songrock");
      live.listen = "The rock sank. The song knew the way.";
    }
    if (g.current) g.current.position.y = y + 0.7 - down.current * 1.5;
    if (d < 2.2 && down.current < 0.8) live.listen = live.listen || "A rock with holes. A song might move it.";
  });
  return (
    <group ref={g} position={[SONG.x, y + 0.7, SONG.z]}>
      <mesh castShadow>
        <dodecahedronGeometry args={[0.7, 0]} />
        <meshLambertMaterial color="#6a5a4c" />
      </mesh>
      <mesh position={[0, 0.1, 0.55]}>
        <circleGeometry args={[0.08, 8]} />
        <meshLambertMaterial color="#1a120c" />
      </mesh>
    </group>
  );
}

function NightKnock() {
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (live.house || live.dusk < 0.55) return;
    if (live.nearHouse && live.stillT > 0.9 && cool.current <= 0) {
      cool.current = 12;
      pay(6, "nightknock");
      live.listen = "Someone is home. A sleepy voice. Then a coin under the door.";
    }
  });
  return null;
}

function LookSpy() {
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - LOOK_AT.x, live.z - LOOK_AT.z);
    if (d < 2.2 && live.y > heightAt(LOOK_AT.x, LOOK_AT.z) + 4 && live.spyT > 0) {
      pay(10, "lookspy");
      live.listen = "From up here you saw the island. And the hatch. And the rock with holes.";
    }
  });
  return null;
}
