import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WorldId } from "../types";
import { heightAt } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { consumeTalk as consumeTalkRaw } from "../input";
import { addTrapSpot, beginTrapFrame } from "./dungeonTraps";
import { puffAt } from "./fx";
import { lamb } from "./mats";
import {
  STATUE_AT,
  BRIDGE_AT,
  ORDER_AT,
  GOURD_AT,
  FOREST_AT,
  HOLLOW_AT,
  HOLLOW_STATUE,
  CREEK,
  worldMath,
  plateNeed,
  cratesSolved,
  gourdCounts,
  platesSolved,
  beginMathBodies,
  addMathBody,
  inCreek,
  clampAround,
  mushOrder,
  type Op,
  type StatueSet,
  type BridgeSet,
  type CrateSet,
  type PlateSet,
} from "./mathWorld";

function talkOk() {
  if (live.nearNpc || live.nearHouse || live.nearChest || live.nearHorse || live.nearGate) return false;
  return consumeTalkRaw();
}

function paid(key: string) {
  if (live.smashed[key]) return true;
  if ((useGame.getState().seenItems ?? []).includes(`s:${key}`)) {
    live.smashed[key] = true;
    return true;
  }
  return false;
}

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  useGame.getState().discover(`s:${key}`);
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.chime();
}

function gradeMath() {
  return worldMath(useGame.getState().grade);
}

export function MathPlay({ worldId }: { worldId: WorldId }) {
  return (
    <group>
      <MathBegin />
      {worldId === "meadow" ? (
        <>
          <StatueGarden spec={gradeMath().statue} at={STATUE_AT} keyName="math-statue" />
          <CountBridges spec={gradeMath().bridge} />
          <OrderCrates spec={gradeMath().crates} />
          <GourdPlates spec={gradeMath().plates} />
          <ForestCaps />
        </>
      ) : null}
      {worldId === "cavern" ? (
        <StatueGarden spec={HOLLOW_STATUE} at={HOLLOW_AT} keyName="math-hollow" dungeon />
      ) : null}
    </group>
  );
}

function MathBegin() {
  useFrame(() => {
    beginMathBodies();
    beginTrapFrame();
  }, -3);
  return null;
}

function StatueGarden({
  spec,
  at,
  keyName,
  dungeon,
}: {
  spec: StatueSet;
  at: { x: number; z: number };
  keyName: string;
  dungeon?: boolean;
}) {
  const homes = useMemo(
    () =>
      spec.nums.map((n, i) => ({
        n,
        x: at.x + (i - 1.5) * 3.4,
        z: at.z + 3.6,
      })),
    [spec, at],
  );
  const pos = useRef(homes.map((h) => ({ n: h.n, x: h.x, z: h.z })));
  const locked = useRef(paid(keyName));
  const wrong = useRef(-1);
  const daisMat = useRef<THREE.MeshLambertMaterial>(null);
  const dais = { x: at.x, z: at.z - 0.4 };
  const stone = dungeon ? "#5a5248" : "#8a8074";

  useFrame((_, dt) => {
    if (live.house) return;
    const list = pos.current;
    for (let i = 0; i < list.length; i++) {
      const o = list[i]!;
      addMathBody(`st:${keyName}:${o.n}`, o.x, o.z, 0.48, !locked.current);
      if (locked.current) continue;
      const d = Math.hypot(live.x - o.x, live.z - o.z);
      if (d < 1.18 && Math.abs(live.speed) > 0.7 && live.grounded) {
        const fx = -Math.sin(live.yaw);
        const fz = -Math.cos(live.yaw);
        const into = fx * (o.x - live.x) + fz * (o.z - live.z) > 0.02;
        if (into) {
          o.x += fx * 4.2 * dt;
          o.z += fz * 4.2 * dt;
          clampAround(o, at.x, at.z + 1.2, 7.4);
        }
      }
      const on = Math.hypot(o.x - dais.x, o.z - dais.z) < 0.92;
      if (on) {
        if (o.n === spec.answer) {
          locked.current = true;
          o.x = dais.x;
          o.z = dais.z;
          pay(dungeon ? 14 : 16, keyName);
          puffAt(dais.x, dais.z, heightAt(dais.x, dais.z) + 0.6, true);
          live.listen = "The ring took that one.";
        } else {
          wrong.current = i;
          sfx.miss();
          puffAt(o.x, o.z, heightAt(o.x, o.z) + 0.4);
        }
      }
      if (wrong.current === i) {
        const h = homes[i]!;
        o.x += (h.x - o.x) * (1 - Math.exp(-dt * 4.2));
        o.z += (h.z - o.z) * (1 - Math.exp(-dt * 4.2));
        if (Math.hypot(o.x - h.x, o.z - h.z) < 0.08) wrong.current = -1;
      }
    }
    if (Math.hypot(live.x - at.x, live.z - at.z) < 6.4 && live.stillT > 0.7 && !locked.current) {
      live.listen = live.listen || "Two piles. One ring. The stones have numbers.";
    }
    if (daisMat.current) {
      daisMat.current.emissiveIntensity = locked.current ? 0.55 : 0.12;
      daisMat.current.color.set(locked.current ? "#c9a227" : "#8a7a48");
    }
  }, -2);

  const dy = heightAt(dais.x, dais.z);
  return (
    <group>
      <mesh position={[dais.x, dy + 0.06, dais.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.15, 16]} />
        <meshLambertMaterial ref={daisMat} color="#c9a227" emissive="#c9a227" emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[dais.x, dy + 0.08, dais.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 1.12, 16]} />
        <meshBasicMaterial color="#efe6d4" />
      </mesh>
      <PileTablet x={at.x} z={at.z - 3.8} spec={spec} yaw={0} />
      {pos.current.map((o) => (
        <PushStatue key={o.n} body={o} color={stone} gold={locked} answer={spec.answer} />
      ))}
    </group>
  );
}

function PushStatue({
  body,
  color,
  gold,
  answer,
}: {
  body: { n: number; x: number; z: number };
  color: string;
  gold: { current: boolean };
  answer: number;
}) {
  const g = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshLambertMaterial>(null);
  useFrame(() => {
    if (!g.current) return;
    g.current.position.set(body.x, heightAt(body.x, body.z), body.z);
    if (mat.current) mat.current.color.set(gold.current && body.n === answer ? "#c9a227" : color);
  });
  return (
    <group ref={g} position={[body.x, heightAt(body.x, body.z), body.z]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.5, 0.36, 8]} />
        <meshLambertMaterial ref={mat} color={color} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.58, 0.78, 0.38]} />
        {lamb(color)}
      </mesh>
      <mesh position={[0, 1.28, 0]} castShadow>
        <sphereGeometry args={[0.22, 8, 6]} />
        {lamb("#c9b49a")}
      </mesh>
      <mesh position={[-0.38, 0.78, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.16, 0.12, 0.12]} />
        {lamb("#c9b49a")}
      </mesh>
      <mesh position={[0.38, 0.78, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.16, 0.12, 0.12]} />
        {lamb("#c9b49a")}
      </mesh>
      <group position={[0, 0.78, 0.22]} scale={0.42}>
        <DigitMesh n={body.n} color="#e8c040" />
      </group>
    </group>
  );
}

function CountBridges({ spec }: { spec: BridgeSet }) {
  const cx = BRIDGE_AT.x;
  const cz = BRIDGE_AT.z;
  const xs = useMemo(() => spec.nums.map((_, i) => cx + (i - 1) * 5.2), [spec, cx]);
  const drop = useRef([0, 0, 0]);
  const cool = useRef(0);
  const done = useRef(paid("math-bridge"));
  const prize = useRef<THREE.Group>(null);
  const span = 8.6;

  useFrame((_, dt) => {
    if (live.house) return;
    cool.current = Math.max(0, cool.current - dt);
    for (let i = 0; i < spec.nums.length; i++) {
      if (drop.current[i]! > 0 && spec.nums[i] !== spec.answer) {
        drop.current[i] = Math.max(0, drop.current[i]! - dt);
      }
      const x = xs[i]!;
      const fallen = drop.current[i]! > 0 && spec.nums[i] !== spec.answer && !done.current;
      const on = Math.abs(live.x - x) < 1.05 && Math.abs(live.z - cz) < span * 0.52 && !fallen;
      if (on) {
        addTrapSpot(live.x, live.z, 0.7, 0.42);
        if (spec.nums[i] === spec.answer) {
          if (!done.current && Math.abs(live.z - cz) < 1.4) {
            done.current = true;
            pay(18, "math-bridge");
            puffAt(x, cz, heightAt(x, cz) + 0.5, true);
            live.listen = "That plank held.";
          }
        } else if (!done.current && Math.abs(live.z - cz) < span * 0.22 && drop.current[i]! <= 0) {
          drop.current[i] = 2.6;
          sfx.thud();
          sfx.splash();
          live.listen = "The plank gave up.";
          live.z = cz + CREEK.hz + 1.8;
          live.y = heightAt(live.x, live.z);
          live.knock = { vx: 0, vz: 14, t: 0.34 };
        }
      }
    }
    if (inCreek(live.x, live.z) && !live.god && !live.balloonRide) {
      let onPlank = false;
      for (let i = 0; i < spec.nums.length; i++) {
        const fallen = drop.current[i]! > 0 && spec.nums[i] !== spec.answer && !done.current;
        if (fallen) continue;
        if (Math.abs(live.x - xs[i]!) < 1.05 && Math.abs(live.z - cz) < span * 0.52) onPlank = true;
      }
      if (!onPlank && cool.current <= 0) {
        cool.current = 0.9;
        sfx.splash();
        live.z = cz + CREEK.hz + 1.8;
        live.y = heightAt(live.x, live.z);
        live.knock = { vx: 0, vz: 12, t: 0.3 };
        live.listen = "Cold water.";
      }
    }
    if (prize.current) prize.current.visible = done.current;
    if (Math.hypot(live.x - cx, live.z - (cz + 6.2)) < 4.2 && live.stillT > 0.65 && !done.current) {
      live.listen = live.listen || "Three planks. Two piles on this bank.";
    }
  }, -2);

  const wy = heightAt(cx, cz) - 0.55;
  return (
    <group>
      <mesh position={[cx, wy, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CREEK.hx * 2.2, CREEK.hz * 2.15]} />
        <meshLambertMaterial color="#2a6a88" transparent opacity={0.88} />
      </mesh>
      {[-CREEK.hz, CREEK.hz].map((sz) => (
        <mesh key={sz} position={[cx, heightAt(cx, cz + sz) + 0.12, cz + sz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[CREEK.hx * 2.15, 1.35]} />
          {lamb("#6a5a3a")}
        </mesh>
      ))}
      {spec.nums.map((n, i) => (
        <Plank
          key={n}
          x={xs[i]!}
          z={cz}
          n={n}
          span={span}
          drop={drop}
          i={i}
          answer={spec.answer}
          done={done}
        />
      ))}
      <PileCairn x={cx - 3.4} z={cz + 6.4} count={spec.left} />
      <OpStone x={cx} z={cz + 6.4} op={spec.op} />
      <PileCairn x={cx + 3.4} z={cz + 6.4} count={spec.right} />
      <group ref={prize} visible={false}>
        <RupeeMark x={cx} z={cz - 6.8} />
      </group>
    </group>
  );
}

function Plank({
  x,
  z,
  n,
  span,
  drop,
  i,
  answer,
  done,
}: {
  x: number;
  z: number;
  n: number;
  span: number;
  drop: { current: number[] };
  i: number;
  answer: number;
  done: { current: boolean };
}) {
  const g = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshLambertMaterial>(null);
  useFrame(() => {
    if (!g.current) return;
    const fallen = drop.current[i]! > 0 && n !== answer && !done.current;
    g.current.position.y = heightAt(x, z) + (fallen ? -0.9 : 0.22);
    g.current.rotation.x = fallen ? 0.58 : 0;
    if (mat.current) mat.current.color.set(done.current && n === answer ? "#c9a227" : "#7a5230");
  });
  return (
    <group ref={g} position={[x, heightAt(x, z) + 0.22, z]}>
      <mesh castShadow>
        <boxGeometry args={[1.55, 0.12, span]} />
        <meshLambertMaterial ref={mat} color="#7a5230" />
      </mesh>
      {[-0.7, 0.7].map((sx) => (
        <mesh key={sx} position={[sx, 0.28, 0]}>
          <boxGeometry args={[0.06, 0.46, span * 0.92]} />
          {lamb("#5a3a20")}
        </mesh>
      ))}
      <group position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.5}>
        <DigitMesh n={n} color="#e8c040" />
      </group>
    </group>
  );
}

function OrderCrates({ spec }: { spec: CrateSet }) {
  const slots = useMemo(
    () => spec.nums.map((n, i) => ({ n, x: ORDER_AT.x + (i - 1.5) * 1.7, z: ORDER_AT.z })),
    [spec],
  );
  const scramble = useMemo(() => {
    const s = [...spec.nums];
    s.reverse();
    if (s[0] === spec.nums[0]) {
      const a = s[0]!;
      s[0] = s[s.length - 1]!;
      s[s.length - 1] = a;
    }
    return s;
  }, [spec]);
  const pos = useRef(
    scramble.map((n, i) => ({
      n,
      x: ORDER_AT.x + (i - 1.5) * 1.7,
      z: ORDER_AT.z + 2.6,
    })),
  );
  const done = useRef(paid("math-crates"));

  useFrame((_, dt) => {
    if (live.house) return;
    const list = pos.current;
    for (const o of list) {
      addMathBody(`cr:${o.n}`, o.x, o.z, 0.4, !done.current);
      if (done.current) continue;
      const d = Math.hypot(live.x - o.x, live.z - o.z);
      if (d < 1.05 && Math.abs(live.speed) > 0.65 && live.grounded) {
        const fx = -Math.sin(live.yaw);
        const fz = -Math.cos(live.yaw);
        if (fx * (o.x - live.x) + fz * (o.z - live.z) > 0.02) {
          o.x += fx * 4.4 * dt;
          o.z += fz * 4.4 * dt;
          clampAround(o, ORDER_AT.x, ORDER_AT.z + 1.2, 6.2);
        }
      }
    }
    if (!done.current && cratesSolved(list, slots, 0.78)) {
      done.current = true;
      pay(14, "math-crates");
      puffAt(ORDER_AT.x, ORDER_AT.z, heightAt(ORDER_AT.x, ORDER_AT.z) + 0.5, true);
      live.listen = "The line agreed.";
      for (const s of slots) {
        const c = list.find((o) => o.n === s.n);
        if (c) {
          c.x = s.x;
          c.z = s.z;
        }
      }
    }
    if (Math.hypot(live.x - ORDER_AT.x, live.z - ORDER_AT.z) < 4.5 && live.stillT > 0.6 && !done.current) {
      live.listen = live.listen || "Four crates. Four dents. Smallest on the left.";
    }
  }, -2);

  const y = heightAt(ORDER_AT.x, ORDER_AT.z);
  return (
    <group>
      {slots.map((s) => (
        <mesh key={`s${s.n}`} position={[s.x, y + 0.03, s.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.52, 10]} />
          <meshLambertMaterial color="#5a4a32" />
        </mesh>
      ))}
      {pos.current.map((o) => (
        <CrateMark key={o.n} body={o} done={done} />
      ))}
    </group>
  );
}

function CrateMark({ body, done }: { body: { n: number; x: number; z: number }; done: { current: boolean } }) {
  const g = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshLambertMaterial>(null);
  useFrame(() => {
    if (!g.current) return;
    g.current.position.set(body.x, heightAt(body.x, body.z) + 0.32, body.z);
    if (mat.current) mat.current.color.set(done.current ? "#c9a227" : "#8a5a28");
  });
  return (
    <group ref={g}>
      <mesh castShadow>
        <boxGeometry args={[0.64, 0.64, 0.64]} />
        <meshLambertMaterial ref={mat} color="#8a5a28" />
      </mesh>
      <group position={[0, 0.08, 0.34]} scale={0.38}>
        <DigitMesh n={body.n} color="#efe6d4" />
      </group>
    </group>
  );
}

function GourdPlates({ spec }: { spec: PlateSet }) {
  const plates = useMemo(
    () =>
      spec.plates.map((p, i) => ({
        ...p,
        x: GOURD_AT.x + (i - (spec.plates.length - 1) * 0.5) * 3.6,
        z: GOURD_AT.z,
      })),
    [spec],
  );
  const needs = useMemo(() => spec.plates.map(plateNeed), [spec]);
  const total = needs.reduce((a, b) => a + b, 0) + spec.extra;
  const gourds = useRef(
    Array.from({ length: total }, (_, i) => ({
      x: GOURD_AT.x + (i % 4) * 0.55 - 0.8,
      z: GOURD_AT.z + 3.2 + Math.floor(i / 4) * 0.55,
      held: false,
    })),
  );
  const held = useRef<number | null>(null);
  const done = useRef(paid("math-gourds"));
  const plateMats = useRef<(THREE.MeshLambertMaterial | null)[]>([]);

  useFrame((_, dt) => {
    if (live.house) return;
    const list = gourds.current;
    if (held.current != null) {
      const g = list[held.current];
      if (g) {
        g.x = live.x - Math.sin(live.yaw) * 0.55;
        g.z = live.z - Math.cos(live.yaw) * 0.55;
        g.held = true;
      }
    }
    for (let i = 0; i < list.length; i++) {
      const g = list[i]!;
      if (g.held) continue;
      const d = Math.hypot(live.x - g.x, live.z - g.z);
      if (d < 0.5 && Math.abs(live.speed) > 2.4) {
        const fx = -Math.sin(live.yaw);
        const fz = -Math.cos(live.yaw);
        g.x += fx * 5.5 * dt;
        g.z += fz * 5.5 * dt;
        clampAround(g, GOURD_AT.x, GOURD_AT.z + 1.4, 7);
      }
    }
    if (!done.current && talkOk()) {
      if (held.current != null) {
        const g = list[held.current]!;
        g.held = false;
        g.x = live.x - Math.sin(live.yaw) * 0.8;
        g.z = live.z - Math.cos(live.yaw) * 0.8;
        held.current = null;
        sfx.thud();
      } else {
        let best = -1;
        let bestD = 1.05;
        for (let i = 0; i < list.length; i++) {
          const g = list[i]!;
          const d = Math.hypot(live.x - g.x, live.z - g.z);
          if (d < bestD) {
            best = i;
            bestD = d;
          }
        }
        if (best >= 0) {
          held.current = best;
          list[best]!.held = true;
          sfx.ok();
        }
      }
    }
    const counts = gourdCounts(list, plates);
    if (!done.current && platesSolved(counts, needs)) {
      done.current = true;
      pay(18, "math-gourds");
      puffAt(GOURD_AT.x, GOURD_AT.z, heightAt(GOURD_AT.x, GOURD_AT.z) + 0.5, true);
      live.listen = "The plates went quiet.";
    }
    for (let i = 0; i < plateMats.current.length; i++) {
      const mat = plateMats.current[i];
      if (!mat) continue;
      const ok = done.current || counts[i] === needs[i];
      mat.color.set(done.current ? "#c9a227" : ok && (counts[i] ?? 0) > 0 ? "#7a8a40" : "#6a5a40");
      mat.emissive.set(done.current ? "#c9a227" : "#000");
      mat.emissiveIntensity = done.current ? 0.4 : 0;
    }
    if (Math.hypot(live.x - GOURD_AT.x, live.z - GOURD_AT.z) < 5 && live.stillT > 0.55 && !done.current) {
      live.listen = live.listen || "The plates have groups. The gourds do not.";
    }
  }, -2);

  return (
    <group>
      {plates.map((p, i) => (
        <group key={i} position={[p.x, heightAt(p.x, p.z) + 0.04, p.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[1.12, 14]} />
            <meshLambertMaterial
              ref={(el) => {
                plateMats.current[i] = el;
              }}
              color="#6a5a40"
            />
          </mesh>
          <GroupDots groups={p.groups} size={p.size} />
        </group>
      ))}
      {gourds.current.map((g, i) => (
        <Gourd key={i} body={g} />
      ))}
    </group>
  );
}

function Gourd({ body }: { body: { x: number; z: number; held: boolean } }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!g.current) return;
    const y = body.held ? live.y + 1.12 : heightAt(body.x, body.z) + 0.16;
    g.current.position.set(body.x, y, body.z);
  });
  return (
    <group ref={g}>
      <mesh castShadow>
        <sphereGeometry args={[0.16, 8, 6]} />
        {lamb("#e07030")}
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.1, 5]} />
        {lamb("#3a5a28")}
      </mesh>
    </group>
  );
}

function ForestCaps() {
  const order = mushOrder();
  const spots = useMemo(
    () =>
      order.map((n, i) => {
        const a = (i / order.length) * Math.PI * 2 - Math.PI / 2;
        return { n, x: FOREST_AT.x + Math.cos(a) * 4.2, z: FOREST_AT.z + Math.sin(a) * 4.2 };
      }),
    [order],
  );
  const seq = useRef<number[]>([]);
  const last = useRef("");
  const done = useRef(paid("math-caps"));
  const cool = useRef(0);
  const mats = useRef<(THREE.MeshLambertMaterial | null)[]>([]);

  useFrame((_, dt) => {
    if (live.house) return;
    cool.current = Math.max(0, cool.current - dt);
    if (!done.current && cool.current <= 0) {
      for (const p of spots) {
        if (Math.hypot(live.x - p.x, live.z - p.z) > 0.85) continue;
        if (last.current === String(p.n)) break;
        last.current = String(p.n);
        cool.current = 0.35;
        const want = order[seq.current.length];
        if (p.n === want) {
          seq.current = [...seq.current, p.n];
          sfx.ok();
          if (seq.current.length >= order.length) {
            done.current = true;
            pay(22, "math-caps");
            puffAt(FOREST_AT.x, FOREST_AT.z, heightAt(FOREST_AT.x, FOREST_AT.z) + 0.5, true);
            live.listen = "The caps went still.";
          }
        } else {
          seq.current = p.n === order[0] ? [p.n] : [];
          sfx.miss();
        }
        break;
      }
    }
    if (Math.hypot(live.x - FOREST_AT.x, live.z - FOREST_AT.z) > 6.2) last.current = "";
    for (let i = 0; i < mats.current.length; i++) {
      const mat = mats.current[i];
      if (!mat) continue;
      const n = spots[i]?.n;
      const lit = done.current || (n != null && seq.current.includes(n));
      mat.color.set(done.current ? "#c9a227" : lit ? "#e07030" : "#c42838");
    }
    if (Math.hypot(live.x - FOREST_AT.x, live.z - FOREST_AT.z) < 5.5 && live.stillT > 0.7 && !done.current) {
      live.listen = live.listen || "Caps in a ring. Each one is twice the last.";
    }
  });

  return (
    <group>
      {spots.map((p, i) => (
        <group key={p.n} position={[p.x, heightAt(p.x, p.z), p.z]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.36, 6]} />
            {lamb("#efe6d4")}
          </mesh>
          <mesh position={[0, 0.38, 0]} castShadow>
            <sphereGeometry args={[0.28, 8, 5]} />
            <meshLambertMaterial
              ref={(el) => {
                mats.current[i] = el;
              }}
              color="#c42838"
            />
          </mesh>
          <group position={[0, 0.62, 0]} scale={0.28}>
            <DigitMesh n={p.n} color="#efe6d4" />
          </group>
        </group>
      ))}
    </group>
  );
}

function PileTablet({ x, z, spec, yaw }: { x: number; z: number; spec: StatueSet; yaw: number }) {
  const y = heightAt(x, z) + 1.15;
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <mesh castShadow>
        <boxGeometry args={[3.4, 1.7, 0.18]} />
        {lamb("#6a5848")}
      </mesh>
      <group position={[-0.95, 0.05, 0.12]}>
        <FruitPile n={spec.left} />
      </group>
      <group position={[0, 0.05, 0.12]} scale={0.7}>
        <OpMesh op={spec.op} />
      </group>
      <group position={[0.95, 0.05, 0.12]}>
        <FruitPile n={spec.right} />
      </group>
    </group>
  );
}

function FruitPile({ n }: { n: number }) {
  const pts = packDots(n, 0.16);
  return (
    <group>
      {pts.map((p, i) => (
        <mesh key={i} position={[p[0], p[1] * 0.5, 0.02]}>
          <sphereGeometry args={[0.07, 6, 5]} />
          {lamb(i % 2 ? "#c42838" : "#e07030")}
        </mesh>
      ))}
    </group>
  );
}

function PileCairn({ x, z, count }: { x: number; z: number; count: number }) {
  const y = heightAt(x, z);
  const pts = packDots(count, 0.18);
  return (
    <group position={[x, y, z]}>
      {pts.map((p, i) => (
        <mesh key={i} position={[p[0], 0.1 + i * 0.02, p[1]]} castShadow>
          <sphereGeometry args={[0.12, 6, 5]} />
          {lamb(i % 2 ? "#8a8070" : "#6a6058")}
        </mesh>
      ))}
    </group>
  );
}

function OpStone({ x, z, op }: { x: number; z: number; op: Op }) {
  return (
    <group position={[x, heightAt(x, z) + 0.22, z]}>
      <mesh>
        <boxGeometry args={[0.4, 0.12, 0.4]} />
        {lamb("#4a4038")}
      </mesh>
      <group position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.45}>
        <OpMesh op={op} />
      </group>
    </group>
  );
}

function OpMesh({ op }: { op: Op }) {
  if (op === "×") {
    return (
      <group>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.42, 0.08, 0.06]} />
          <meshLambertMaterial color="#e8c040" emissive="#e8c040" emissiveIntensity={0.4} />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.42, 0.08, 0.06]} />
          <meshLambertMaterial color="#e8c040" emissive="#e8c040" emissiveIntensity={0.4} />
        </mesh>
      </group>
    );
  }
  if (op === "−") {
    return (
      <mesh>
        <boxGeometry args={[0.42, 0.08, 0.06]} />
        <meshLambertMaterial color="#e8c040" emissive="#e8c040" emissiveIntensity={0.4} />
      </mesh>
    );
  }
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.42, 0.08, 0.06]} />
        <meshLambertMaterial color="#e8c040" emissive="#e8c040" emissiveIntensity={0.4} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.08, 0.42, 0.06]} />
        <meshLambertMaterial color="#e8c040" emissive="#e8c040" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function GroupDots({ groups, size }: { groups: number; size: number }) {
  const cells = [];
  for (let g = 0; g < groups; g++) {
    const gx = (g - (groups - 1) * 0.5) * 0.42;
    const pts = packDots(size, 0.1);
    for (let i = 0; i < pts.length; i++) {
      cells.push({ x: gx + pts[i]![0], z: pts[i]![1] });
    }
  }
  return (
    <group>
      {cells.map((c, i) => (
        <mesh key={i} position={[c.x, 0.08, c.z]}>
          <sphereGeometry args={[0.055, 6, 5]} />
          <meshLambertMaterial color="#efe6d4" />
        </mesh>
      ))}
    </group>
  );
}

function RupeeMark({ x, z }: { x: number; z: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    g.current.position.y = heightAt(x, z) + 0.45 + Math.sin(clock.elapsedTime * 2.2) * 0.08;
    g.current.rotation.y = clock.elapsedTime * 1.4;
  });
  return (
    <group ref={g} position={[x, heightAt(x, z) + 0.45, z]}>
      <mesh>
        <octahedronGeometry args={[0.18, 0]} />
        <meshLambertMaterial color="#3d8a40" emissive="#3d8a40" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

const SEG: Record<string, number[]> = {
  "0": [1, 1, 1, 1, 1, 1, 0],
  "1": [0, 1, 1, 0, 0, 0, 0],
  "2": [1, 1, 0, 1, 1, 0, 1],
  "3": [1, 1, 1, 1, 0, 0, 1],
  "4": [0, 1, 1, 0, 0, 1, 1],
  "5": [1, 0, 1, 1, 0, 1, 1],
  "6": [1, 0, 1, 1, 1, 1, 1],
  "7": [1, 1, 1, 0, 0, 0, 0],
  "8": [1, 1, 1, 1, 1, 1, 1],
  "9": [1, 1, 1, 1, 0, 1, 1],
};

function DigitMesh({ n, color }: { n: number; color: string }) {
  const s = String(Math.max(0, Math.floor(n)));
  const w = (s.length - 1) * 0.72;
  return (
    <group>
      {s.split("").map((ch, i) => (
        <Seven key={i} bits={SEG[ch] ?? SEG["0"]!} color={color} x={i * 0.72 - w / 2} />
      ))}
    </group>
  );
}

function Seven({ bits, color, x }: { bits: number[]; color: string; x: number }) {
  const segs: [number, number, number, number][] = [
    [0, 0.36, 0.42, 0.07],
    [0.2, 0.18, 0.07, 0.32],
    [0.2, -0.18, 0.07, 0.32],
    [0, -0.36, 0.42, 0.07],
    [-0.2, -0.18, 0.07, 0.32],
    [-0.2, 0.18, 0.07, 0.32],
    [0, 0, 0.42, 0.07],
  ];
  return (
    <group position={[x, 0, 0]}>
      {segs.map((s, i) =>
        bits[i] ? (
          <mesh key={i} position={[s[0], s[1], 0.02]}>
            <boxGeometry args={[s[2], s[3], 0.06]} />
            <meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.45} />
          </mesh>
        ) : null,
      )}
    </group>
  );
}

function packDots(n: number, s: number): [number, number][] {
  const c = Math.max(1, Math.ceil(Math.sqrt(n)));
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const col = i % c;
    const row = Math.floor(i / c);
    out.push([(col - (c - 1) / 2) * s * 1.35, (row - (Math.ceil(n / c) - 1) / 2) * s * 1.35]);
  }
  return out;
}
