import { useRef, useState, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WorldId } from "../types";
import { heightAt } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import {
  PUZZLES,
  platesSatisfied,
  doorOpen,
  keyVisible,
  chestAlreadyLooted,
  chestTier,
  stepPuzzle,
  type PuzzleRuntime,
  type PadSpot,
  type Door,
} from "./puzzles";
import { TreasureChest } from "./secrets";

export function PuzzleLayer({ worldId, puzzle }: { worldId: WorldId; puzzle: MutableRefObject<PuzzleRuntime> }) {
  const spec = PUZZLES[worldId];
  const [open, setOpen] = useState(false);
  const [keyed, setKeyed] = useState(false);
  const [tick, setTick] = useState(0);
  const blockRefs = useRef<(THREE.Mesh | null)[]>([]);
  const plateMats = useRef<(THREE.MeshLambertMaterial | null)[]>([]);
  const switchMats = useRef<(THREE.MeshLambertMaterial | null)[]>([]);

  useFrame((_, dt) => {
    const rt = puzzle.current;
    const hits: { x: number; z: number; r: number }[] = [];
    if (live.slash) hits.push({ x: live.slash.x, z: live.slash.z, r: live.slash.r ?? 1.2 });
    for (const a of live.arrows) hits.push({ x: a.x, z: a.z, r: a.kind === "seed" ? 0.5 : 0.7 });
    for (const b of live.booms) hits.push({ x: b.x, z: b.z, r: 0.9 });
    const cue = stepPuzzle(worldId, rt, spec, live.x, live.z, dt, hits, performance.now());
    if (cue.hint) live.hint = cue.hint;
    if (cue.sfx === "ok") sfx.ok();
    else if (cue.sfx === "miss") sfx.miss();
    else if (cue.sfx === "chime") sfx.chime();
    else if (cue.sfx === "key") {
      sfx.key();
      live.keys = (live.keys || 0) + 1;
    } else if (cue.sfx === "pick") sfx.pick();

    live.dungeonDoors = spec.doors.filter((d) => !doorOpen(rt, d)).map((d) => ({ x: d.x, z: d.z, w: d.w, axis: d.axis }));

    if (live.dungFlags.mix) rt.switch2On = true;
    live.dungFlags.plates = rt.platesOn;
    live.dungFlags.key = rt.hasKey;
    live.dungFlags.pads = rt.padOn;
    live.dungFlags.eyes = rt.eyeOn;
    live.dungFlags.far = rt.farOn;

    const on = platesSatisfied(rt, spec) || rt.platesOn;
    rt.platesOn = on;
    for (let i = 0; i < rt.blocks.length; i++) {
      const b = rt.blocks[i]!;
      const m = blockRefs.current[i];
      if (m) m.position.set(b.x, heightAt(b.x, b.z) + 0.45, b.z);
    }
    for (let i = 0; i < spec.plates.length; i++) {
      const mat = plateMats.current[i];
      if (!mat) continue;
      const p = spec.plates[i]!;
      const filled = rt.blocks.some((b) => {
        if (Math.hypot(b.x - p.x, b.z - p.z) >= 0.95) return false;
        if (p.color && b.color && p.color !== b.color) return false;
        return true;
      });
      mat.color.set(filled ? (p.color ?? "#c9a227") : "#8a7a48");
      mat.emissive.set(filled ? (p.color ?? "#c9a227") : "#000");
      mat.emissiveIntensity = filled ? 0.45 : 0;
    }
    for (let i = 0; i < spec.switches.length; i++) {
      const mat = switchMats.current[i];
      if (!mat) continue;
      const onSw = i === 0 ? rt.switchOn : rt.switch2On;
      mat.color.set(onSw ? "#3d8a40" : "#a05038");
      mat.emissive.set(onSw ? "#3d8a40" : "#a05038");
      mat.emissiveIntensity = onSw ? 0.55 : 0.15;
    }
    const anyOpen = spec.doors.some((d) => doorOpen(rt, d));
    if (anyOpen !== open) setOpen(anyOpen);
    if (rt.hasKey !== keyed) setKeyed(rt.hasKey);
    const nextTick =
      rt.eyeSeq.length +
      rt.padSeq.length +
      rt.torchSeq.length +
      (rt.memoryI + 1) +
      (rt.switch2On ? 8 : 0) +
      (rt.hasKey2 ? 16 : 0) +
      (rt.hasBoss ? 32 : 0) +
      (rt.shortcut ? 64 : 0) +
      (rt.farOn ? 128 : 0) +
      (rt.padOn ? 256 : 0) +
      (rt.eyeOn ? 512 : 0);
    if (nextTick !== tick) setTick(nextTick);
  });

  const rt = puzzle.current;
  return (
    <group>
      {spec.plates.map((p, i) => (
        <group key={p.id} position={[p.x, heightAt(p.x, p.z) + 0.04, p.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[0.92, 16]} />
            <meshLambertMaterial
              ref={(el) => {
                plateMats.current[i] = el;
              }}
              color="#8a7a48"
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.72, 0.9, 16]} />
            <meshBasicMaterial color={p.color ?? "#c9a227"} transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
      {rt.blocks.map((b, i) => (
        <mesh
          key={b.id}
          ref={(el) => {
            blockRefs.current[i] = el;
          }}
          position={[b.x, heightAt(b.x, b.z) + 0.45, b.z]}
          castShadow
        >
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshLambertMaterial color={b.color ?? "#8a7460"} />
        </mesh>
      ))}
      {spec.switches.map((s, i) => (
        <group key={s.id} position={[s.x, heightAt(s.x, s.z), s.z]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.42, 0.5, 0.28, 10]} />
            <meshLambertMaterial
              ref={(el) => {
                switchMats.current[i] = el;
              }}
              color="#a05038"
              emissive="#a05038"
              emissiveIntensity={0.15}
            />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.22, 8, 6]} />
            <meshLambertMaterial color="#c42838" emissive="#c42838" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
      {spec.doors.map((d) => (
        <DungeonDoor key={d.id} d={d} open={doorOpen(rt, d)} />
      ))}
      {spec.keys.map((k) =>
        keyVisible(rt, k) ? (
          <KeyMesh key={k.id} x={k.x} z={k.z} boss={k.kind === "boss"} />
        ) : null,
      )}
      {spec.chests.map((ch) => (
        <TreasureChest
          key={ch.id}
          id={ch.id}
          x={ch.x}
          z={ch.z}
          open={rt.opened.has(ch.id) || chestAlreadyLooted(worldId, ch)}
          size={chestTier(ch)}
        />
      ))}
      {(spec.eyes ?? []).map((e, i) => (
        <EyeCrystal
          key={e.id}
          x={e.x}
          z={e.z}
          color={e.color}
          size={e.size ?? 1}
          lit={
            rt.eyeSeq.includes(i) ||
            (spec.memory && !rt.memoryReady && spec.eyeOrder && spec.eyeOrder[rt.memoryI] === i)
          }
        />
      ))}
      {(spec.pads ?? []).map((p) => (
        <NumberPad key={p.id} pad={p} active={rt.padSeq.includes(p.n) && rt.padSeq.indexOf(p.n) < rt.padSeq.length} />
      ))}
      {(spec.torches ?? []).map((t, i) => (
        <PuzzleTorch key={t.id} x={t.x} z={t.z} color={t.color ?? "#e07030"} lit={rt.torchSeq.includes(i)} />
      ))}
      {(spec.murals ?? []).map((m, i) => (
        <Mural key={`mu${i}`} x={m.x} z={m.z} yaw={m.yaw} colors={m.colors} dots={m.dots} />
      ))}
    </group>
  );
}

function DungeonDoor({ d, open }: { d: Door; open: boolean }) {
  const lift = useRef(open ? 4.4 : 0);
  const was = useRef(open);
  const slab = useRef<THREE.Group>(null);
  const y = heightAt(d.x, d.z);
  const yaw = d.axis === "x" ? Math.PI / 2 : 0;
  const w = d.w;
  useFrame((_, dt) => {
    if (open !== was.current) {
      if (open) {
        sfx.thud();
        live.spark = Math.max(live.spark, 0.7);
        live.hitStop = Math.max(live.hitStop, 0.14);
      }
      was.current = open;
    }
    const want = open ? 4.45 : 0;
    lift.current += (want - lift.current) * (1 - Math.exp(-dt * 5.4));
    if (Math.abs(lift.current - want) < 0.02) lift.current = want;
    if (slab.current) slab.current.position.y = lift.current;
  });
  const wood = d.need === "boss" ? "#6a4a22" : d.need === "shortcut" ? "#3a3a42" : "#6a5440";
  const emblem =
    d.need === "key" || d.need === "key2"
      ? "#c9a227"
      : d.need === "boss"
        ? "#e8c040"
        : d.need === "eyes"
          ? "#e07a28"
          : d.need === "pads"
            ? "#c9a227"
            : d.need === "plates"
              ? "#c9a227"
              : "#8a7050";
  return (
    <group position={[d.x, y, d.z]} rotation={[0, yaw, 0]}>
      <mesh position={[-(w * 0.5 + 0.24), 1.72, 0]} castShadow>
        <boxGeometry args={[0.5, 3.45, 0.78]} />
        <meshLambertMaterial color="#4a4038" />
      </mesh>
      <mesh position={[w * 0.5 + 0.24, 1.72, 0]} castShadow>
        <boxGeometry args={[0.5, 3.45, 0.78]} />
        <meshLambertMaterial color="#4a4038" />
      </mesh>
      <mesh position={[0, 3.52, 0]} castShadow>
        <boxGeometry args={[w + 1.15, 0.52, 0.88]} />
        <meshLambertMaterial color="#5a4a38" />
      </mesh>
      <mesh position={[0, 3.82, 0]}>
        <boxGeometry args={[1.15, 0.28, 0.4]} />
        <meshLambertMaterial color={emblem} emissive={emblem} emissiveIntensity={0.22} />
      </mesh>
      <group ref={slab}>
        <mesh position={[0, 1.55, 0]} castShadow>
          <boxGeometry args={[Math.max(0.6, w - 0.18), 3.08, 0.3]} />
          <meshLambertMaterial color={wood} />
        </mesh>
        {[-0.28, 0, 0.28].map((t) => (
          <mesh key={t} position={[t * w * 0.28, 1.55, 0.16]}>
            <boxGeometry args={[0.05, 2.72, 0.04]} />
            <meshLambertMaterial color="#4a3828" />
          </mesh>
        ))}
        <mesh position={[0, 1.62, 0.17]} rotation={[0, 0, 0]}>
          <circleGeometry args={[0.26, 10]} />
          <meshLambertMaterial color={emblem} emissive={emblem} emissiveIntensity={open ? 0.12 : 0.5} />
        </mesh>
        {d.need === "key" || d.need === "key2" || d.need === "boss" ? (
          <mesh position={[0, 1.5, 0.2]}>
            <torusGeometry args={[0.09, 0.028, 6, 10]} />
            <meshLambertMaterial color="#2a2018" />
          </mesh>
        ) : d.need === "pads" ? (
          [-0.12, 0, 0.12].map((ox) => (
            <mesh key={ox} position={[ox, 1.5, 0.2]}>
              <sphereGeometry args={[0.045, 6, 5]} />
              <meshBasicMaterial color="#efe6d4" />
            </mesh>
          ))
        ) : d.need === "eyes" ? (
          <mesh position={[0, 1.5, 0.2]}>
            <sphereGeometry args={[0.07, 6, 5]} />
            <meshBasicMaterial color="#1a1410" />
          </mesh>
        ) : null}
      </group>
    </group>
  );
}

function KeyMesh({ x, z, boss }: { x: number; z: number; boss?: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    g.current.position.y = heightAt(x, z) + 0.55 + Math.sin(clock.elapsedTime * 2.4) * 0.08;
    g.current.rotation.y = clock.elapsedTime * 1.6;
  });
  const col = boss ? "#e8c040" : "#c9a227";
  const s = boss ? 1.35 : 1;
  return (
    <group ref={g} position={[x, heightAt(x, z) + 0.55, z]} scale={[s, s, s]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.05, 6, 10]} />
        <meshLambertMaterial color={col} emissive={col} emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.28, 6]} />
        <meshLambertMaterial color={col} emissive={col} emissiveIntensity={0.4} />
      </mesh>
      <pointLight color={col} intensity={2.4} distance={3.5} />
    </group>
  );
}

function EyeCrystal({ x, z, color, size, lit }: { x: number; z: number; color: string; size: number; lit?: boolean }) {
  const mat = useRef<THREE.MeshLambertMaterial>(null);
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.position.y = heightAt(x, z) + 0.95 * size + Math.sin(clock.elapsedTime * 2.2 + x) * 0.06;
    if (mat.current) mat.current.emissiveIntensity = lit ? 1.15 : 0.35 + Math.sin(clock.elapsedTime * 3 + x) * 0.12;
  });
  const s = 0.28 * size;
  return (
    <group ref={g} position={[x, heightAt(x, z) + 0.95 * size, z]}>
      <mesh rotation={[0, Math.PI / 5, 0]} castShadow>
        <octahedronGeometry args={[s, 0]} />
        <meshLambertMaterial ref={mat} color={color} emissive={color} emissiveIntensity={lit ? 1.1 : 0.4} />
      </mesh>
      <mesh position={[0, -0.55 * size, 0]}>
        <cylinderGeometry args={[0.08, 0.14, 0.5 * size, 6]} />
        <meshLambertMaterial color="#4a3a28" />
      </mesh>
      {lit ? <pointLight color={color} intensity={3.6} distance={5} /> : null}
    </group>
  );
}

function NumberPad({ pad, active }: { pad: PadSpot; active: boolean }) {
  const y = heightAt(pad.x, pad.z) + 0.05;
  const dots = dieDots(pad.n);
  return (
    <group position={[pad.x, y, pad.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.05, 16]} />
        <meshLambertMaterial color={active ? "#c9a227" : pad.color ?? "#6a8a4a"} emissive={active ? "#c9a227" : "#000"} emissiveIntensity={active ? 0.4 : 0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.86, 1.02, 16]} />
        <meshBasicMaterial color="#efe6d4" />
      </mesh>
      {dots.map((d, i) => (
        <mesh key={i} position={[d[0], 0.08, d[1]]}>
          <sphereGeometry args={[0.11, 8, 6]} />
          <meshLambertMaterial color="#efe6d4" />
        </mesh>
      ))}
    </group>
  );
}

function dieDots(n: number): [number, number][] {
  const c = 0.38;
  const map: Record<number, [number, number][]> = {
    1: [[0, 0]],
    2: [
      [-c, -c],
      [c, c],
    ],
    3: [
      [-c, -c],
      [0, 0],
      [c, c],
    ],
    4: [
      [-c, -c],
      [c, -c],
      [-c, c],
      [c, c],
    ],
    5: [
      [-c, -c],
      [c, -c],
      [0, 0],
      [-c, c],
      [c, c],
    ],
    6: [
      [-c, -c],
      [c, -c],
      [-c, 0],
      [c, 0],
      [-c, c],
      [c, c],
    ],
    7: [
      [-c, -c],
      [c, -c],
      [-c, 0],
      [0, 0],
      [c, 0],
      [-c, c],
      [c, c],
    ],
    8: [
      [-c, -c],
      [0, -c],
      [c, -c],
      [-c, c],
      [0, c],
      [c, c],
      [-c, 0],
      [c, 0],
    ],
    9: [
      [-c, -c],
      [0, -c],
      [c, -c],
      [-c, 0],
      [0, 0],
      [c, 0],
      [-c, c],
      [0, c],
      [c, c],
    ],
  };
  return map[Math.max(1, Math.min(9, n))] ?? [[0, 0]];
}

function PuzzleTorch({ x, z, color, lit }: { x: number; z: number; color: string; lit: boolean }) {
  const flame = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!flame.current) return;
    flame.current.visible = lit;
    if (lit) flame.current.scale.setScalar(0.8 + Math.sin(clock.elapsedTime * 10 + x) * 0.2);
  });
  return (
    <group position={[x, heightAt(x, z), z]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.48, 0.4, 8]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
      <mesh ref={flame} position={[0, 0.7, 0]} visible={lit}>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshLambertMaterial color={color} emissive={color} emissiveIntensity={1.3} />
      </mesh>
      {lit ? <pointLight color={color} intensity={4} distance={6} position={[0, 0.8, 0]} /> : null}
    </group>
  );
}

function Mural({ x, z, yaw, colors, dots }: { x: number; z: number; yaw: number; colors: string[]; dots?: number[] }) {
  return (
    <group position={[x, 2.1, z]} rotation={[0, yaw, 0]}>
      <mesh castShadow>
        <boxGeometry args={[4.6, 2.6, 0.22]} />
        <meshLambertMaterial color="#6a5848" />
      </mesh>
      <mesh position={[0, 0, 0.13]}>
        <planeGeometry args={[4.2, 2.2]} />
        <meshLambertMaterial color="#3a2e24" />
      </mesh>
      {colors.map((c, i) => {
        const n = colors.length;
        const px = (i - (n - 1) * 0.5) * (n > 3 ? 0.9 : 1.15);
        const count = dots?.[i] ?? 0;
        return (
          <group key={i} position={[px, 0.1, 0.18]}>
            <mesh>
              <circleGeometry args={[count ? 0.42 : 0.32 + i * 0.08, 12]} />
              <meshLambertMaterial color={c} emissive={c} emissiveIntensity={0.35} />
            </mesh>
            {count > 0
              ? Array.from({ length: Math.min(count, 9) }, (_, k) => {
                  const a = (k / Math.max(1, count)) * Math.PI * 2 - Math.PI / 2;
                  const r = count === 1 ? 0 : 0.18;
                  return (
                    <mesh key={k} position={[Math.cos(a) * r, Math.sin(a) * r, 0.02]}>
                      <sphereGeometry args={[0.045, 6, 5]} />
                      <meshBasicMaterial color="#efe6d4" />
                    </mesh>
                  );
                })
              : null}
          </group>
        );
      })}
    </group>
  );
}
