import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WorldId } from "../types";
import { heightAt } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { TreasureChest } from "./secrets";
import { addTrapSpot } from "./dungeonTraps";
import {
  TREASURES,
  FEATHERS,
  SHELLS,
  CRACK_AT,
  MILL_KEY_AT,
  HORSE_PLATE,
  MATH_PADS,
  MATH_AT,
  EYE_AT,
  treasureOpen,
  pickupGot,
  grantPickup,
  atTreasure,
  nearTreasureHint,
  gateReady,
  markTreasureFlag,
  type TreasureDef,
  type PickupDef,
} from "../treasure";

export function TreasurePlay({ worldId }: { worldId: WorldId }) {
  const list = useMemo(() => TREASURES.filter((t) => t.world === worldId), [worldId]);
  const picks = useMemo(
    () => (worldId === "meadow" ? [...FEATHERS, ...SHELLS] : []),
    [worldId],
  );
  return (
    <group>
      {list.map((t) => (
        <PlacedChest key={t.id} t={t} />
      ))}
      {picks.map((p) => (
        <Glint key={p.id} p={p} />
      ))}
      {worldId === "meadow" ? <CrackRock /> : null}
      {worldId === "meadow" ? <MillKey /> : null}
      {worldId === "meadow" ? <HorsePlate /> : null}
      {worldId === "meadow" ? <MathRing /> : null}
      {worldId === "meadow" ? <WindEye /> : null}
    </group>
  );
}

function PlacedChest({ t }: { t: TreasureDef }) {
  const [open, setOpen] = useState(() => treasureOpen(t.id));
  const [show, setShow] = useState(() => gateReady(t) || treasureOpen(t.id) || t.gate.kind === "none" || t.gate.kind === "climb" || t.gate.kind === "night" || t.gate.kind === "song" || t.gate.kind === "lantern" || t.gate.kind === "horse" || t.gate.kind === "swim");
  const yOff =
    t.gate.kind === "bean"
      ? 6.4
      : t.gate.kind === "climb"
        ? t.id === "look"
          ? 9.45
          : t.id === "spire"
            ? 42
            : Math.max(0, t.gate.rise)
        : t.gate.kind === "swim"
          ? -0.35
          : 0;
  const hideUntilReady = t.gate.kind === "sling" || t.gate.kind === "math" || t.gate.kind === "bean" || (t.gate.kind === "bomb" && t.gate.rock === "crack") || t.gate.kind === "house";
  useFrame(() => {
    const o = treasureOpen(t.id);
    if (o !== open) setOpen(o);
    const ready = !hideUntilReady || gateReady(t) || o;
    if (ready !== show) setShow(ready);
    if (t.gate.kind === "climb") addTrapSpot(t.x, t.z, 1.2, yOff + 0.25);
    if (t.gate.kind === "bean" && live.smashed.bean) addTrapSpot(t.x, t.z, 1.4, 6.6);
    if (hideUntilReady && !ready) return;
    if (t.gate.kind === "house" && live.house !== t.gate.house) return;
    const hint = nearTreasureHint(t);
    if (hint && !live.listen) live.listen = hint;
    if (!o && atTreasure(t) && !live.nearChest) live.nearChest = t.id;
  });
  if (!show) return null;
  return <TreasureChest id={t.id} x={t.x} z={t.z} open={open} size={t.size} yOff={t.gate.kind === "bean" && live.smashed.bean ? 6.4 : yOff} />;
}

function Glint({ p }: { p: PickupDef }) {
  const got = useRef(pickupGot(p.id));
  const g = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  useFrame(({ clock }) => {
    if (got.current) return;
    const ground = heightAt(p.x, p.z) + (p.yOff ?? 0.28);
    if (g.current) {
      g.current.position.y = ground + Math.sin(clock.elapsedTime * 2.4 + p.x) * 0.08;
      g.current.rotation.y = clock.elapsedTime * 1.4;
    }
    if (live.house && !p.yOff) return;
    if (Math.hypot(live.x - p.x, live.z - p.z) > 0.95) return;
    if (p.yOff && Math.abs(live.y - ground) > 1.6) return;
    got.current = true;
    grantPickup(p);
    sfx.chime();
    bump((v) => v + 1);
  });
  if (got.current) return null;
  const gold = p.kind === "feather";
  return (
    <group ref={g} position={[p.x, heightAt(p.x, p.z) + (p.yOff ?? 0.28), p.z]}>
      {gold ? (
        <mesh castShadow>
          <coneGeometry args={[0.12, 0.38, 5]} />
          <meshLambertMaterial color="#e8d48a" emissive="#c9a227" emissiveIntensity={0.35} />
        </mesh>
      ) : (
        <mesh rotation={[0.4, 0.2, 0.5]} castShadow>
          <sphereGeometry args={[0.16, 7, 5]} />
          <meshLambertMaterial color="#d8c8b0" />
        </mesh>
      )}
    </group>
  );
}

function CrackRock() {
  const gone = useRef(Boolean(live.smashed.crack));
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (gone.current) return;
    const boom = live.lastBoom && Math.hypot(live.lastBoom.x - CRACK_AT.x, live.lastBoom.z - CRACK_AT.z) < 2.8;
    const bomb = live.bombs.some((b) => b.boom && Math.hypot(b.x - CRACK_AT.x, b.z - CRACK_AT.z) < 2.2);
    if (boom || bomb) {
      gone.current = true;
      markTreasureFlag("crack");
      sfx.smash();
      live.listen = "The cracked rock split. A chest was sitting in the dark.";
      if (g.current) g.current.visible = false;
    } else if (Math.hypot(live.x - CRACK_AT.x, live.z - CRACK_AT.z) < 2.4) {
      live.listen = live.listen || "The east rock is cracked. A bang would open it.";
    }
  });
  if (gone.current) return null;
  const y = heightAt(CRACK_AT.x, CRACK_AT.z);
  return (
    <group ref={g} position={[CRACK_AT.x, y, CRACK_AT.z]}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <dodecahedronGeometry args={[1.15, 0]} />
        <meshLambertMaterial color="#6a6458" />
      </mesh>
      <mesh position={[0.15, 0.9, 0.55]} rotation={[0.2, 0.4, 0.1]}>
        <boxGeometry args={[0.08, 1.3, 0.04]} />
        <meshLambertMaterial color="#2a1810" />
      </mesh>
    </group>
  );
}

function MillKey() {
  const got = useRef(pickupGot("manor-key") || (useGame.getState().quests?.manorKey ?? 0) >= 1);
  const g = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  useFrame(({ clock }) => {
    if (got.current) return;
    const y = heightAt(MILL_KEY_AT.x, MILL_KEY_AT.z) + MILL_KEY_AT.y;
    if (g.current) {
      g.current.position.y = y + Math.sin(clock.elapsedTime * 1.8) * 0.06;
      g.current.rotation.z = Math.sin(clock.elapsedTime * 1.2) * 0.15;
    }
    const boom = live.booms.some((b) => Math.hypot(b.x - MILL_KEY_AT.x, b.z - MILL_KEY_AT.z) < 1.1);
    const high = live.y > y - 1.35 && Math.hypot(live.x - MILL_KEY_AT.x, live.z - MILL_KEY_AT.z) < 1.5;
    if (boom || high) {
      got.current = true;
      grantPickup({ id: "manor-key", kind: "key", x: MILL_KEY_AT.x, z: MILL_KEY_AT.z, world: "meadow" });
      sfx.chime();
      bump((v) => v + 1);
      return;
    }
    if (Math.hypot(live.x - MILL_KEY_AT.x, live.z - MILL_KEY_AT.z) < 3.2)
      live.listen = live.listen || "A key hangs on the mill wheel. Too high for a jump. A throw might knock it.";
  });
  if (got.current) return null;
  const y = heightAt(MILL_KEY_AT.x, MILL_KEY_AT.z) + MILL_KEY_AT.y;
  return (
    <group ref={g} position={[MILL_KEY_AT.x, y, MILL_KEY_AT.z]}>
      <mesh rotation={[0, 0, 0.4]} castShadow>
        <torusGeometry args={[0.14, 0.045, 6, 10]} />
        <meshLambertMaterial color="#c9a227" emissive="#c9a227" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.18, -0.12, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.22, 0.05, 0.05]} />
        <meshLambertMaterial color="#e8d48a" />
      </mesh>
    </group>
  );
}

function HorsePlate() {
  const on = useRef(Boolean(live.smashed["horse-plate"]));
  const glow = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const hx = live.horseX;
    const hz = live.horseZ;
    const horseOn = hx != null && hz != null && Math.hypot(hx - HORSE_PLATE.x, hz - HORSE_PLATE.z) < 1.15;
    if (horseOn && !on.current) {
      on.current = true;
      markTreasureFlag("horse-plate");
      sfx.ok();
      live.listen = "She stepped on the stone. A click in the grass.";
    }
    if (glow.current) {
      const mat = glow.current.material as THREE.MeshLambertMaterial;
      mat.color.set(on.current ? "#3d8a40" : "#6a6058");
    }
    if (!on.current && Math.hypot(live.x - HORSE_PLATE.x, live.z - HORSE_PLATE.z) < 2.2)
      live.listen = live.listen || "A low stone in the paddock. Too wide for a boot.";
  });
  const y = heightAt(HORSE_PLATE.x, HORSE_PLATE.z);
  return (
    <mesh ref={glow} position={[HORSE_PLATE.x, y + 0.04, HORSE_PLATE.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.85, 10]} />
      <meshLambertMaterial color="#6a6058" />
    </mesh>
  );
}

function MathRing() {
  const step = useRef(0);
  const cool = useRef(0);
  const done = useRef(Boolean(live.smashed.math) || treasureOpen("math"));
  useFrame((_, dt) => {
    if (done.current) return;
    cool.current = Math.max(0, cool.current - dt);
    if (cool.current > 0) return;
    for (const p of MATH_PADS) {
      if (Math.hypot(live.x - p.x, live.z - p.z) > 0.7) continue;
      cool.current = 0.45;
      if (p.n === step.current + 1) {
        step.current = p.n;
        sfx.chime();
        live.listen = p.n === 4 ? "The last stone sat. A chest rose in the middle." : `${p.n}.`;
        if (p.n === 4) {
          done.current = true;
          markTreasureFlag("math");
        }
      } else if (p.n === 1) {
        step.current = 1;
        sfx.ok();
        live.listen = "1.";
      } else {
        step.current = 0;
        sfx.thud();
        live.listen = "The count broke. Start at the smallest.";
      }
    }
    if (!done.current && Math.hypot(live.x - MATH_AT.x, live.z - MATH_AT.z) < 6)
      live.listen = live.listen || "Four stones. They want to be walked smallest to biggest.";
  });
  return (
    <group>
      {MATH_PADS.map((p) => (
        <group key={p.n} position={[p.x, heightAt(p.x, p.z), p.z]}>
          <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.55, 8]} />
            <meshLambertMaterial color={done.current || step.current >= p.n ? "#c9a227" : "#6a6058"} />
          </mesh>
          <PadNum n={p.n} />
        </group>
      ))}
    </group>
  );
}

function PadNum({ n }: { n: number }) {
  const segs: [number, number, number, number][] =
    n === 1
      ? [[0.12, 0.28, 0.07, 0.42]]
      : n === 2
        ? [
            [-0.12, 0.42, 0.28, 0.07],
            [0.1, 0.22, 0.07, 0.28],
            [-0.12, 0.08, 0.28, 0.07],
            [-0.16, -0.08, 0.07, 0.28],
            [-0.12, -0.24, 0.28, 0.07],
          ]
        : n === 3
          ? [
              [-0.12, 0.42, 0.28, 0.07],
              [0.1, 0.22, 0.07, 0.28],
              [-0.08, 0.08, 0.22, 0.07],
              [0.1, -0.08, 0.07, 0.28],
              [-0.12, -0.24, 0.28, 0.07],
            ]
          : [
              [0.1, 0.22, 0.07, 0.55],
              [-0.16, 0.08, 0.22, 0.07],
              [-0.12, 0.28, 0.07, 0.22],
            ];
  return (
    <group position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {segs.map((s, i) => (
        <mesh key={i} position={[s[0], s[1], 0.02]}>
          <planeGeometry args={[s[2], s[3]]} />
          <meshBasicMaterial color="#efe6d4" />
        </mesh>
      ))}
    </group>
  );
}

function WindEye() {
  const hit = useRef(Boolean(live.smashed.eye));
  const lid = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (hit.current) return;
    const y = heightAt(EYE_AT.x, EYE_AT.z) + EYE_AT.y;
    const seed = live.arrows.some((a) => Math.hypot(a.x - EYE_AT.x, a.z - EYE_AT.z) < 0.7 && Math.abs(a.y - y) < 1.4);
    const shot = live.throws.some((t) => Math.hypot(t.x - EYE_AT.x, t.z - EYE_AT.z) < 0.7);
    const boom = live.booms.some((b) => Math.hypot(b.x - EYE_AT.x, b.z - EYE_AT.z) < 0.9);
    if (seed || shot || boom) {
      hit.current = true;
      markTreasureFlag("eye");
      sfx.chime();
      live.listen = "The eye shut. A chest dropped at the foot of the crag.";
      if (lid.current) lid.current.visible = false;
    }
    if (Math.hypot(live.x - EYE_AT.x, live.z - EYE_AT.z) < 14)
      live.listen = live.listen || "A red eye on the west crag. A seed would knock it.";
  });
  if (hit.current) return null;
  const y = heightAt(EYE_AT.x, EYE_AT.z) + EYE_AT.y;
  return (
    <group position={[EYE_AT.x, y, EYE_AT.z]}>
      <mesh ref={lid} castShadow>
        <sphereGeometry args={[0.38, 8, 6]} />
        <meshLambertMaterial color="#8a3a38" emissive="#c45c48" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0, 0, 0.22]}>
        <sphereGeometry args={[0.14, 6, 5]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}
