import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { takeCipher } from "../cipher";
import { puffAt } from "./fx";
import {
  festOn,
  festGlow,
  tickFest,
  FEST_SPOTS,
  FEST_RIBBONS,
  markFestGame,
  festGameDone,
  countProblem,
  type CountProb,
} from "../fest";
import { FIRE_PIT, VX, VZ } from "./village";

function hitAt(x: number, z: number, y: number, r: number, needY = 0.35) {
  if (live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < r) return true;
  for (const t of live.throws) {
    if (!t.broken && Math.hypot(t.x - x, t.z - z) < r && t.y > y + needY) return true;
  }
  for (const a of live.arrows) {
    if (Math.hypot(a.x - x, a.z - z) < r && a.y > y + needY) return true;
  }
  return false;
}

export function FestPlay() {
  const [on, setOn] = useState(false);
  return (
    <group>
      <FestDirector on={on} setOn={setOn} />
      {on ? (
        <>
          <FestDress />
          <ArcheryBooth />
          <PotToss />
          <FairRace />
          <CountBooth />
          <RibbonHunt />
          <PieCrate />
          <SpinWheel />
        </>
      ) : null}
    </group>
  );
}

function FestDirector({ on, setOn }: { on: boolean; setOn: (v: boolean) => void }) {
  const last = useRef(-1);
  useFrame(() => {
    tickFest();
    const now = festOn();
    if (now !== on) setOn(now);
    if (now && last.current !== 2 && inTown()) {
      last.current = 2;
      if (!live.banner) {
        live.banner = "The Last Leaf Fair";
        live.bannerSub = "Oakstead hung lanterns. The leaf is still green.";
      }
    }
    if (!now) {
      last.current = -1;
      live.nearFest = null;
      if (live.festAct) live.festAct = null;
    }
    if (now) live.miraUp = false;
  });
  return null;
}

function inTown() {
  return Math.hypot(live.x - VX, live.z - VZ) < 42 && !live.house;
}

function FestDress() {
  const glow = festGlow();
  const on = festOn();
  const strings = useMemo(
    () => [
      { ax: VX - 10, az: VZ + 12, bx: VX + 10, bz: VZ + 12 },
      { ax: VX - 12, az: VZ + 2, bx: VX - 2, bz: VZ + 14 },
      { ax: VX + 12, az: VZ + 2, bx: VX + 2, bz: VZ + 14 },
      { ax: VX - 8, az: VZ - 6, bx: VX + 8, bz: VZ - 6 },
    ],
    [],
  );
  const lamps = useMemo(() => {
    const list: { x: number; z: number; c: string }[] = [];
    const cols = ["#e8a040", "#c42828", "#3d7a48", "#2a6ad8", "#e8d48a"];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      list.push({
        x: FIRE_PIT.x + Math.sin(a) * 5.4,
        z: FIRE_PIT.z + Math.cos(a) * 5.4,
        c: cols[i % cols.length]!,
      });
    }
    return list;
  }, []);
  if (!on) return null;
  return (
    <group>
      {strings.map((s, i) => (
        <Bunting key={i} ax={s.ax} az={s.az} bx={s.bx} bz={s.bz} />
      ))}
      {lamps.map((l, i) => {
        const y = heightAt(l.x, l.z) + 2.15;
        return (
          <group key={i} position={[l.x, y, l.z]}>
            <mesh>
              <sphereGeometry args={[0.16, 8, 6]} />
              <meshLambertMaterial color={l.c} emissive={l.c} emissiveIntensity={glow ? 0.85 : 0.25} />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.28, 5]} />
              {lamb("#5a3a20", { kind: "wood" })}
            </mesh>
          </group>
        );
      })}
      {glow ? <pointLight position={[FIRE_PIT.x, heightAt(FIRE_PIT.x, FIRE_PIT.z) + 3.2, FIRE_PIT.z]} intensity={6.5} color="#ffb060" distance={18} /> : null}
      <FoodTable x={FEST_SPOTS.table.x} z={FEST_SPOTS.table.z} />
      <FoodTable x={FIRE_PIT.x - 4.6} z={FIRE_PIT.z + 2.0} />
      <Dancers />
      <Petals />
      {glow ? <CrowdBits /> : null}
    </group>
  );
}

function Bunting({ ax, az, bx, bz }: { ax: number; az: number; bx: number; bz: number }) {
  const cols = ["#c42828", "#e8d48a", "#3d7a48", "#2a6ad8", "#efe6d4"];
  const n = 7;
  const flags = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    flags.push({
      x: ax + (bx - ax) * t,
      z: az + (bz - az) * t,
      c: cols[i % cols.length]!,
    });
  }
  const yaw = Math.atan2(bx - ax, bz - az);
  return (
    <group>
      {flags.map((f, i) => {
        const y = heightAt(f.x, f.z) + 3.15;
        return (
          <mesh key={i} position={[f.x, y, f.z]} rotation={[0.55, yaw, 0]} castShadow>
            <coneGeometry args={[0.22, 0.48, 3]} />
            {lamb(f.c, { kind: "wood" })}
          </mesh>
        );
      })}
    </group>
  );
}

function FoodTable({ x, z }: { x: number; z: number }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[1.8, 0.08, 0.85]} />
        {lamb("#8a6238", { kind: "wood" })}
      </mesh>
      <mesh position={[-0.78, 0.36, 0.32]} castShadow>
        <boxGeometry args={[0.08, 0.72, 0.08]} />
        {lamb("#5a3a20", { kind: "wood" })}
      </mesh>
      <mesh position={[0.78, 0.36, 0.32]} castShadow>
        <boxGeometry args={[0.08, 0.72, 0.08]} />
        {lamb("#5a3a20", { kind: "wood" })}
      </mesh>
      <mesh position={[-0.78, 0.36, -0.32]} castShadow>
        <boxGeometry args={[0.08, 0.72, 0.08]} />
        {lamb("#5a3a20", { kind: "wood" })}
      </mesh>
      <mesh position={[0.78, 0.36, -0.32]} castShadow>
        <boxGeometry args={[0.08, 0.72, 0.08]} />
        {lamb("#5a3a20", { kind: "wood" })}
      </mesh>
      {[-0.5, 0, 0.5].map((ox, i) => (
        <mesh key={i} position={[ox, 0.86, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.12, 8]} />
          {lamb(i === 1 ? "#c45c48" : "#e8d48a", { kind: "wood" })}
        </mesh>
      ))}
    </group>
  );
}

function Dancers() {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!g.current || !festOn()) return;
    g.current.rotation.y += dt * 0.55;
  });
  if (!festOn()) return null;
  const y = heightAt(FIRE_PIT.x, FIRE_PIT.z);
  const kits = ["#3a5a88", "#a83838", "#3d7a48", "#6a4a28"];
  return (
    <group ref={g} position={[FIRE_PIT.x, y, FIRE_PIT.z]}>
      {kits.map((c, i) => {
        const a = (i / kits.length) * Math.PI * 2;
        return (
          <group key={i} position={[Math.sin(a) * 3.4, 0, Math.cos(a) * 3.4]}>
            <mesh position={[0, 0.42, 0]} castShadow>
              <capsuleGeometry args={[0.14, 0.38, 3, 6]} />
              <meshLambertMaterial color={c} />
            </mesh>
            <mesh position={[0, 0.82, 0]} castShadow>
              <sphereGeometry args={[0.14, 7, 6]} />
              <meshLambertMaterial color="#c49674" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Petals() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const bits = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        x: FIRE_PIT.x + ((i * 17) % 21) - 10,
        z: FIRE_PIT.z + ((i * 13) % 19) - 9,
        y: 1.4 + (i % 5) * 0.45,
        s: 0.06 + (i % 3) * 0.02,
        ph: i * 0.7,
      })),
    [],
  );
  useFrame(({ clock }) => {
    if (!mesh.current || !festOn()) return;
    const t = clock.elapsedTime;
    bits.forEach((b, i) => {
      const y = heightAt(b.x, b.z) + ((b.y + t * 0.35 + b.ph) % 3.2);
      dummy.position.set(b.x + Math.sin(t * 0.6 + b.ph) * 0.4, y, b.z);
      dummy.rotation.set(t + b.ph, t * 0.4, 0.4);
      dummy.scale.setScalar(b.s);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.visible = true;
  });
  if (!festOn()) return null;
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, bits.length]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshLambertMaterial color="#c9a227" side={THREE.DoubleSide} transparent opacity={0.85} />
    </instancedMesh>
  );
}

function CrowdBits() {
  const spots = useMemo(
    () => [
      { x: FIRE_PIT.x + 7.2, z: FIRE_PIT.z - 1.2, c: "#efe6d4" },
      { x: FIRE_PIT.x - 7.4, z: FIRE_PIT.z + 0.8, c: "#6a4a28" },
      { x: VX + 6.4, z: VZ + 12.2, c: "#3a4a68" },
      { x: VX - 5.2, z: VZ + 11.4, c: "#5a3a22" },
    ],
    [],
  );
  return (
    <group>
      {spots.map((s, i) => {
        const y = heightAt(s.x, s.z);
        return (
          <group key={i} position={[s.x, y, s.z]}>
            <mesh position={[0, 0.4, 0]} castShadow>
              <capsuleGeometry args={[0.13, 0.34, 3, 5]} />
              <meshLambertMaterial color={s.c} />
            </mesh>
            <mesh position={[0, 0.78, 0]} castShadow>
              <sphereGeometry args={[0.13, 6, 5]} />
              <meshLambertMaterial color="#c49674" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function ArcheryBooth() {
  const hit = useRef([false, false, false, false, false]);
  const [, bump] = useState(0);
  const { x, z } = FEST_SPOTS.arch;
  const targets = useMemo(
    () =>
      [0, 1, 2, 3, 4].map((i) => ({
        x: x + 0.2,
        z: z - 3.2 + i * 1.55,
        yOff: 1.15 + (i % 2) * 0.35,
      })),
    [x, z],
  );
  useFrame(() => {
    if (!festOn() || live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4.5 && !festGameDone("arch")) live.listen = live.listen || "Five hanging marks. Shoot them. A sling works.";
    if (festGameDone("arch")) return;
    let changed = false;
    targets.forEach((t, i) => {
      if (hit.current[i]) return;
      const gy = heightAt(t.x, t.z);
      if (hitAt(t.x, t.z, gy + t.yOff, 0.55, 0.2)) {
        hit.current[i] = true;
        puffAt(t.x, t.z, gy + t.yOff);
        sfx.ok();
        useGame.getState().addCoins(2);
        changed = true;
      }
    });
    if (changed) bump((v) => v + 1);
    if (hit.current.every(Boolean)) {
      markFestGame("arch", 14, "Every mark. Ash would clap. He is pretending not to.");
    }
  });
  if (!festOn()) return null;
  const y = heightAt(x, z);
  return (
    <group>
      <mesh position={[x - 1.6, y + 1.15, z]} castShadow>
        <boxGeometry args={[0.12, 2.3, 0.12]} />
        {lamb("#5a3a20", { kind: "wood" })}
      </mesh>
      <mesh position={[x - 1.6, y + 2.25, z]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.1, 3.6, 0.1]} />
        {lamb("#5a3a20", { kind: "wood" })}
      </mesh>
      {targets.map((t, i) =>
        hit.current[i] ? null : (
          <group key={i} position={[t.x, heightAt(t.x, t.z) + t.yOff, t.z]}>
            <mesh rotation={[0, 0.2, 0]} castShadow>
              <cylinderGeometry args={[0.32, 0.32, 0.08, 12]} />
              <meshLambertMaterial color="#efe6d4" />
            </mesh>
            <mesh rotation={[0, 0.2, 0]} position={[0, 0, 0.01]}>
              <cylinderGeometry args={[0.18, 0.18, 0.09, 10]} />
              <meshLambertMaterial color="#c42828" />
            </mesh>
            <mesh rotation={[0, 0.2, 0]} position={[0, 0, 0.02]}>
              <cylinderGeometry args={[0.07, 0.07, 0.1, 8]} />
              <meshLambertMaterial color="#e8d48a" />
            </mesh>
          </group>
        ),
      )}
    </group>
  );
}

function PotToss() {
  const spots = useMemo(() => {
    const { x, z } = FEST_SPOTS.toss;
    return [
      { x, z, h: 0.28 },
      { x: x + 0.42, z, h: 0.28 },
      { x: x - 0.42, z, h: 0.28 },
      { x: x + 0.22, z: z + 0.05, h: 0.72 },
      { x: x - 0.22, z: z + 0.05, h: 0.72 },
      { x, z: z + 0.08, h: 1.14 },
    ];
  }, []);
  const down = useRef([false, false, false, false, false, false]);
  const [, bump] = useState(0);
  useFrame(() => {
    if (!festOn() || live.house) return;
    const s = FEST_SPOTS.toss;
    const d = Math.hypot(live.x - s.x, live.z - s.z);
    if (d < 3.6 && !festGameDone("toss")) live.listen = live.listen || "Stacked pots. Throw a rock. Or a seed.";
    if (festGameDone("toss")) return;
    let changed = false;
    spots.forEach((p, i) => {
      if (down.current[i]) return;
      const gy = heightAt(p.x, p.z);
      if (hitAt(p.x, p.z, gy + p.h, 0.38, 0.05)) {
        down.current[i] = true;
        puffAt(p.x, p.z, gy + p.h);
        sfx.thud();
        sfx.ok();
        changed = true;
      }
    });
    if (changed) bump((v) => v + 1);
    if (down.current.every(Boolean)) {
      markFestGame("toss", 12, "Every pot. Tess already tried with bread. This is better.");
    }
  });
  if (!festOn()) return null;
  const { x, z } = FEST_SPOTS.toss;
  const y = heightAt(x, z);
  return (
    <group>
      <mesh position={[x, y + 0.08, z + 0.55]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.15, 10]} />
        {lamb("#6a5a48", { kind: "dirt" })}
      </mesh>
      {spots.map((p, i) =>
        down.current[i] ? null : (
          <mesh key={i} position={[p.x, heightAt(p.x, p.z) + p.h, p.z]} castShadow>
            <cylinderGeometry args={[0.16, 0.2, 0.38, 8]} />
            {lamb(i % 2 ? "#8a4a28" : "#6a3a20", { kind: "wood" })}
          </mesh>
        ),
      )}
    </group>
  );
}

function FairRace() {
  const on = useRef(false);
  const t = useRef(0);
  const well = useRef(false);
  const start = FEST_SPOTS.race;
  const chk = FEST_SPOTS.well;
  useFrame((_, dt) => {
    if (!festOn() || live.house) return;
    const d0 = Math.hypot(live.x - start.x, live.z - start.z);
    if (!on.current && d0 < 2.6 && live.sprinting && !festGameDone("race")) {
      on.current = true;
      well.current = false;
      t.current = 16;
      live.listen = "Race!! Fountain to the well and back!!";
      sfx.ok();
    }
    if (!on.current && d0 < 2.8 && !festGameDone("race")) {
      live.listen = live.listen || "Sprint here and Tess will race you around the well.";
    }
    if (!on.current) return;
    t.current -= dt;
    live.festRaceT = t.current;
    if (!well.current && Math.hypot(live.x - chk.x, live.z - chk.z) < 3.2) {
      well.current = true;
      live.listen = "The well!! Back to the fountain!!";
    }
    if (well.current && Math.hypot(live.x - start.x, live.z - start.z) < 2.4) {
      on.current = false;
      const beat = t.current > 0;
      markFestGame("race", beat ? 16 : 6, beat ? "You beat Tess. She is on the ground laughing." : "Tess got there. Barely. Rematch anytime.");
    }
    if (t.current <= 0 && on.current) {
      on.current = false;
      live.listen = "Tess won. She is being very normal about it.";
    }
  });
  if (!festOn()) return null;
  const y = heightAt(start.x, start.z);
  const yw = heightAt(chk.x, chk.z);
  return (
    <group>
      <mesh position={[start.x, y + 0.04, start.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 12]} />
        <meshLambertMaterial color="#c42828" transparent opacity={0.45} />
      </mesh>
      <mesh position={[chk.x, yw + 0.04, chk.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.85, 10]} />
        <meshLambertMaterial color="#e8d48a" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

let COUNT: CountProb | null = null;

function CountBooth() {
  const { x, z } = FEST_SPOTS.count;
  const pads = useMemo(() => {
    if (!COUNT) COUNT = countProblem(useGame.getState().grade ?? "k1", 3);
    const c = COUNT.choices;
    return [
      { x: x - 1.35, z: z + 0.2, n: c[0]! },
      { x, z: z + 0.2, n: c[1]! },
      { x: x + 1.35, z: z + 0.2, n: c[2]! },
    ];
  }, [x, z]);
  const dark = { x: x + 2.55, z: z - 0.8 };
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (!festOn() || live.house) return;
    cool.current -= dt;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4.2 && !festGameDone("count") && COUNT) {
      live.listen = live.listen || `Cobb’s lanterns. ${COUNT.a} ${COUNT.op} ${COUNT.b}. Step on the answer.`;
    }
    if (Math.hypot(live.x - dark.x, live.z - dark.z) < 1.35) {
      if (takeCipher("fest-four", true)) {
        live.listen = "Four lanterns. One never lights. Cobb says he did not hang a fourth.";
      }
    }
    if (festGameDone("count") || cool.current > 0) return;
    for (const p of pads) {
      if (Math.hypot(live.x - p.x, live.z - p.z) < 0.72) {
        cool.current = 0.8;
        if (COUNT && p.n === COUNT.answer) {
          markFestGame("count", 14, `That’s ${COUNT.answer}. Cobb counted too. He is pretending he knew.`);
        } else {
          live.listen = "Not that one.";
          sfx.miss();
        }
      }
    }
  });
  if (!festOn() || !COUNT) return null;
  const y = heightAt(x, z);
  const cols = ["#c42828", "#2a6ad8", "#3d7a48"];
  return (
    <group>
      <mesh position={[x, y + 0.85, z - 1.15]} castShadow>
        <boxGeometry args={[2.6, 0.08, 0.7]} />
        {lamb("#8a6238", { kind: "wood" })}
      </mesh>
      {Array.from({ length: COUNT.a }, (_, i) => (
        <mesh key={`a${i}`} position={[x - 0.7 + (i % 4) * 0.22, y + 0.98, z - 1.15 + Math.floor(i / 4) * 0.2]} castShadow>
          <sphereGeometry args={[0.09, 6, 5]} />
          <meshLambertMaterial color="#c42828" />
        </mesh>
      ))}
      {Array.from({ length: COUNT.b }, (_, i) => (
        <mesh key={`b${i}`} position={[x + 0.15 + (i % 4) * 0.22, y + 0.98, z - 1.15 + Math.floor(i / 4) * 0.2]} castShadow>
          <sphereGeometry args={[0.09, 6, 5]} />
          <meshLambertMaterial color="#2a6ad8" />
        </mesh>
      ))}
      {pads.map((p, i) => {
        const gy = heightAt(p.x, p.z);
        return (
          <group key={i} position={[p.x, gy, p.z]}>
            <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.62, 12]} />
              <meshLambertMaterial color={cols[i]!} />
            </mesh>
            <mesh position={[0, 1.15, 0]}>
              <sphereGeometry args={[0.22, 8, 6]} />
              <meshLambertMaterial color={cols[i]!} emissive={cols[i]!} emissiveIntensity={0.55} />
            </mesh>
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.04, 0.05, 1.0, 6]} />
              {lamb("#5a3a20", { kind: "wood" })}
            </mesh>
            <NumberPips n={p.n} y={1.48} />
          </group>
        );
      })}
      <group position={[dark.x, heightAt(dark.x, dark.z), dark.z]}>
        <mesh position={[0, 1.15, 0]}>
          <sphereGeometry args={[0.22, 8, 6]} />
          <meshLambertMaterial color="#2a2824" />
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 1.0, 6]} />
          {lamb("#3a2a18", { kind: "wood" })}
        </mesh>
      </group>
    </group>
  );
}

function NumberPips({ n, y }: { n: number; y: number }) {
  const shown = Math.min(16, Math.max(1, n));
  const bits = [];
  for (let i = 0; i < shown; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    bits.push(
      <mesh key={i} position={[(col - 1.5) * 0.11, y + row * 0.1, 0.12]}>
        <boxGeometry args={[0.07, 0.07, 0.04]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>,
    );
  }
  return <group>{bits}</group>;
}

function RibbonHunt() {
  const got = useRef<Record<string, boolean>>({});
  const [, bump] = useState(0);
  useFrame(() => {
    if (!festOn() || live.house) return;
    if (festGameDone("hide")) return;
    let n = 0;
    for (const r of FEST_RIBBONS) {
      if (got.current[r.id] || (useGame.getState().quests?.[`festRib_${r.id}`] ?? 0) >= 1) {
        got.current[r.id] = true;
        n += 1;
        continue;
      }
      const d = Math.hypot(live.x - r.x, live.z - r.z);
      if (d < 1.35) {
        got.current[r.id] = true;
        useGame.getState().setQuest(`festRib_${r.id}`, 1);
        useGame.getState().addCoins(3);
        revealItem("coin");
        sfx.ok();
        live.listen = r.hint;
        n += 1;
        bump((v) => v + 1);
      } else if (d < 3.4) {
        live.listen = live.listen || "A ribbon in the grass.";
      }
    }
    n = FEST_RIBBONS.filter((r) => got.current[r.id]).length;
    if (n >= 5) {
      markFestGame("hide", 18, "Five ribbons. Tallow forgot where the last one was. You did not.");
    }
  });
  if (!festOn()) return null;
  return (
    <group>
      {FEST_RIBBONS.map((r) =>
        got.current[r.id] ? null : (
          <mesh key={r.id} position={[r.x, heightAt(r.x, r.z) + 0.55, r.z]} rotation={[0.3, 0.4, 0.5]} castShadow>
            <boxGeometry args={[0.08, 0.55, 0.18]} />
            <meshLambertMaterial color={r.color} />
          </mesh>
        ),
      )}
    </group>
  );
}

function PieCrate() {
  const held = useRef(false);
  const g = useRef<THREE.Group>(null);
  const start = FEST_SPOTS.crate;
  const dest = FEST_SPOTS.table;
  useFrame(() => {
    if (!festOn() || live.house) return;
    if (festGameDone("help")) {
      if (g.current) g.current.visible = false;
      return;
    }
    const p = held.current ? { x: live.x, z: live.z - 0.35 } : start;
    if (!held.current) {
      const d = Math.hypot(live.x - start.x, live.z - start.z);
      if (d < 1.2 && (live.carry === "crate" || Math.abs(live.speed) > 1.2 || live.slash)) {
        held.current = true;
        live.carry = "crate";
        live.listen = "Pies. Heavy pies. Pell’s table is in the square.";
      } else if (d < 2.6) live.listen = live.listen || "A crate of pies. Holt packed four.";
    } else {
      const d = Math.hypot(live.x - dest.x, live.z - dest.z);
      if (d < 1.8) {
        held.current = false;
        live.carry = null;
        markFestGame("help", 12, "Pell counted the pies. Four. Cobb counted three. They are both still talking.");
      } else if (d < 5) live.listen = live.listen || "Pell’s table is close.";
    }
    if (g.current) {
      g.current.visible = !festGameDone("help");
      const y = held.current ? live.y + 1.15 : heightAt(p.x, p.z) + 0.32;
      g.current.position.set(held.current ? live.x : start.x, y, held.current ? live.z - 0.4 : start.z);
    }
  });
  if (!festOn()) return null;
  return (
    <group ref={g}>
      <mesh castShadow>
        <boxGeometry args={[0.55, 0.4, 0.45]} />
        {lamb("#8a6a38", { kind: "wood" })}
      </mesh>
    </group>
  );
}

function SpinWheel() {
  const { x, z } = FEST_SPOTS.wheel;
  const spin = useRef(0);
  const vel = useRef(0);
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!festOn() || live.house) {
      if (live.festAct === "spin") live.festAct = null;
      return;
    }
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.2) live.nearFest = "wheel";
    else if (live.nearFest === "wheel") live.nearFest = null;
    const pulling = live.festPull;
    live.festPull = false;
    if (d < 2.4 && !festGameDone("wheel") && live.festAct !== "spin") {
      live.listen = live.listen || "A carnival wheel. Talk to spin. Stop it on gold.";
    }
    if (d > 3.6 && live.festAct === "spin") {
      live.festAct = null;
      live.listen = "The wheel kept spinning without you.";
    }
    if (live.festAct !== "spin") {
      if (pulling && d < 2.2 && !festGameDone("wheel")) {
        live.festAct = "spin";
        vel.current = 9 + Math.random() * 5;
        live.festNeedle = 0.5;
        live.festSweet = 0.62;
        live.festSweetW = 0.16;
        live.listen = "Stop it on the gold.";
        sfx.ok();
      }
      return;
    }
    vel.current *= Math.exp(-dt * 0.55);
    spin.current += vel.current * dt;
    const u = ((spin.current / (Math.PI * 2)) % 1 + 1) % 1;
    live.festNeedle = u;
    live.festSweet = 0.62;
    live.festSweetW = 0.16;
    if (mesh.current) mesh.current.rotation.z = -spin.current;
    if (pulling || vel.current < 0.35) {
      const gold = Math.abs(u - live.festSweet) < live.festSweetW * 0.5 || Math.abs(u - live.festSweet) > 1 - live.festSweetW * 0.5;
      live.festAct = null;
      if (gold) markFestGame("wheel", 20, "Gold. The wheel is a liar except when it isn’t.");
      else {
        live.listen = "Not gold. Spin again. The wheel knows you know.";
        sfx.miss();
      }
    }
  });
  if (!festOn()) return null;
  const y = heightAt(x, z);
  return (
    <group position={[x, y + 1.15, z]}>
      <mesh position={[0, -0.7, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 1.4, 6]} />
        {lamb("#5a3a20", { kind: "wood" })}
      </mesh>
      <mesh ref={mesh} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.85, 0.85, 0.12, 12]} />
        {lamb("#8a6238", { kind: "wood" })}
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        const gold = i === 0;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.55, Math.cos(a) * 0.55, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.16, 8]} />
            <meshLambertMaterial color={gold ? "#e8d48a" : i % 2 ? "#c42828" : "#3a5a88"} />
          </mesh>
        );
      })}
    </group>
  );
}
