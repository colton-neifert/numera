import { useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, POND, VX, VZ, LOOK_AT } from "./field";
import { FIRE_PIT, WELL_AT } from "./village";
import { LANDS } from "./lands";
import { live, duskAmt, gameClock } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { consumeTalk as consumeTalkRaw } from "../input";
import { addTrapSpot } from "./dungeonTraps";
import { puffAt, crackAt } from "./fx";
import { N64Foe, type FangPose } from "./n64";
import { N64Sign, RupeeMesh, HeartContainerMesh } from "./actors";
import { playerMaxHp } from "../content";

/**
 * The adventure that happens between the toys.
 * Paths a kid actually walks, plus the four empty countries that were just fog.
 */

function pay(n: number, key: string) {
  if (live.smashed[key]) return false;
  live.smashed[key] = true;
  if (n > 0) {
    const c = useGame.getState().addCoins(n);
    if (c > 0) revealItem("coin");
  }
  sfx.ok();
  return true;
}

function talked() {
  if (live.nearNpc || live.nearHouse || live.nearChest || live.nearHorse || live.nearGate) return false;
  return consumeTalkRaw();
}

function quest(id: string, n = 1) {
  const g = useGame.getState();
  if ((g.quests?.[id] ?? 0) >= n) return false;
  g.setQuest(id, n);
  return true;
}

function hasSword() {
  return Boolean(useGame.getState().hasSword);
}

const hits: { x: number; z: number; r: number }[] = [];

export function addAdvHit(x: number, z: number, r: number) {
  hits.push({ x, z, r });
}

export function collideAdventure(nx: number, nz: number): { x: number; z: number } | null {
  let x = nx;
  let z = nz;
  let hit = false;
  for (const s of hits) {
    const dx = x - s.x;
    const dz = z - s.z;
    const d2 = dx * dx + dz * dz;
    const rr = s.r * s.r;
    if (d2 < rr && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = s.x + (dx / d) * s.r;
      z = s.z + (dz / d) * s.r;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

function Near({ x, z, r = 78, children }: { x: number; z: number; r?: number; children: ReactNode }) {
  const [on, setOn] = useState(() => Math.hypot(live.x - x, live.z - z) < r);
  useFrame(() => {
    const n = Math.hypot(live.x - x, live.z - z) < r;
    if (n !== on) setOn(n);
  });
  if (!on) return null;
  return <group>{children}</group>;
}

export function AdventurePlay() {
  return (
    <group>
      <AdvBegin />
      <Pulse />
      <ThiefChase />
      <NestCamp />
      <SleepingBrute />
      <FireflyDance />
      <CookStew />
      <FallenLog />
      <RedBalloon />
      <FrogChoir />
      <LookoutStar />
      <NightHunter />
      <WellRace />
      <PadGrotto />
      <WindChimes />
      <RoadCaravan />
      <BogFirst />
      <SandFirst />
      <SouthStones />
      <Goldwaste />
      <Mirefen />
      <WhiteCrown />
      <OldNumer />
    </group>
  );
}

function AdvBegin() {
  useFrame(() => {
    hits.length = 0;
  }, -3);
  return null;
}

/** If the vale goes quiet too long, point at something worth walking toward. */
function Pulse() {
  const quiet = useRef(0);
  const last = useRef("");
  useFrame((_, dt) => {
    if (live.house || live.dungeon || live.talking || live.listen || live.banner) {
      quiet.current = 0;
      return;
    }
    if (live.aggroIds.size > 0) {
      quiet.current = 0;
      return;
    }
    if (Math.abs(live.speed) > 1.2) quiet.current += dt;
    else quiet.current *= 0.985;
    if (quiet.current < 70) return;
    quiet.current = 0;
    const g = useGame.getState();
    const q = g.quests ?? {};
    const picks: [string, string][] = [];
    if (!q.thief) picks.push(["thief", "A lizard just ran north with something shiny."]);
    if (!q.balloon) picks.push(["balloon", "A red balloon slipped past the well."]);
    if (!q.fireflies && duskAmt() > 0.45) picks.push(["flies", "The pond is growing extra stars."]);
    if (!q.stew && (g.apples ?? 0) > 0 && (g.mushrooms ?? 0) > 0) picks.push(["stew", "The pit fire would take an apple and a mushroom."]);
    if (!g.gems?.emerald) picks.push(["cave", "East of the keep road a dark mouth is still sitting."]);
    if (!q.dune && Math.hypot(live.x - LANDS.desert.x, live.z - LANDS.desert.z) > 400)
      picks.push(["dune", "Southeast the grass gives up. Sand pretends to be a bed."]);
    if (!q.fen && Math.hypot(live.x - LANDS.swamp.x, live.z - LANDS.swamp.z) > 400)
      picks.push(["fen", "Southwest the ground wants a snack. Keep moving."]);
    if (!q.ice && Math.hypot(live.x - LANDS.snow.x, live.z - LANDS.snow.z) > 500)
      picks.push(["ice", "Past the mountain the white is lying about being soft."]);
    if (!q.ruin && Math.hypot(live.x - LANDS.ruins.x, live.z - LANDS.ruins.z) > 400)
      picks.push(["ruin", "South the stones still remember a count."]);
    const next = picks.find((p) => p[0] !== last.current) ?? picks[0];
    if (!next) return;
    last.current = next[0];
    live.listen = next[1];
  });
  return null;
}

/** A lizard on the keep road with a rupee on its back. Chase it. */
function ThiefChase() {
  const start = { x: 6.4, z: -28 };
  const p = useRef({ x: start.x, z: start.z, yaw: 0 });
  const dead = useRef(Boolean(live.smashed.thief));
  const g = useRef<THREE.Group>(null);
  const pose = useRef<FangPose>("walk");
  const spark = useRef(0);
  useFrame((_, dt) => {
    if (live.house || dead.current) {
      if (g.current) g.current.visible = false;
      return;
    }
    spark.current += dt;
    const o = p.current;
    const dx = live.x - o.x;
    const dz = live.z - o.z;
    const d = Math.hypot(dx, dz);
    if (d < 22 && d > 0.2) {
      if (d < 11) {
        const away = 1 / d;
        o.x -= dx * away * 7.2 * dt;
        o.z -= dz * away * 7.2 * dt;
        o.yaw = Math.atan2(dx, dz);
        pose.current = "chase";
        live.aggroIds.add("thief");
        if (d < 7 && !live.smashed.thiefsee) {
          live.smashed.thiefsee = true;
          live.listen = live.listen || "It has a rupee. It knows you saw.";
        }
      } else {
        pose.current = "walk";
        live.aggroIds.delete("thief");
      }
    }
    if (live.slash && Math.hypot(live.slash.x - o.x, live.slash.z - o.z) < (live.slash.r ?? 1.2) + 0.45) {
      dead.current = true;
      live.aggroIds.delete("thief");
      pay(20, "thief");
      quest("thief");
      puffAt(o.x, o.z, heightAt(o.x, o.z) + 0.8, true);
      live.listen = "It dropped the shine. It looked offended.";
      sfx.hit();
    }
    if (g.current) {
      g.current.visible = true;
      g.current.position.set(o.x, heightAt(o.x, o.z), o.z);
      g.current.rotation.y = o.yaw;
    }
  });
  if (dead.current) return null;
  return (
    <group ref={g}>
      <N64Foe kind="plusling" seed={9} pose="walk" poseRef={pose} world="meadow" />
      <mesh position={[0, 1.35, 0.12]} rotation={[0.4, 0, 0.2]}>
        <octahedronGeometry args={[0.16, 0]} />
        <meshLambertMaterial color="#3dce70" emissive="#1a8a40" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

/** Three lizards around a stick nest. A chest waits if you clear them. Visual only — foes live in field.ts. */
function NestCamp() {
  const at = { x: 18.4, z: 4.2 };
  const y = heightAt(at.x, at.z);
  const opened = useRef(Boolean(live.smashed.nestchest));
  useFrame(() => {
    if (live.house || opened.current) return;
    const g = useGame.getState();
    const down = g.defeated.meadow ?? [];
    const all = ["nest-e0", "nest-e1", "nest-e2"].every((id) => down.includes(id));
    const d = Math.hypot(live.x - at.x, live.z - at.z);
    if (d < 8 && !all) live.listen = live.listen || "A nest. They sit on a chest like it is an egg.";
    if (all && d < 1.4) {
      opened.current = true;
      pay(25, "nestchest");
      quest("nest");
      puffAt(at.x, at.z, y + 0.6);
      live.listen = "The nest forgot how to be scary.";
      sfx.chime();
    }
  });
  return (
    <Near x={at.x} z={at.z} r={60}>
      <group position={[at.x, y, at.z]}>
        {[-1.4, 0, 1.3].map((ox, i) => (
          <mesh key={i} position={[ox, 0.18, -0.4 + i * 0.2]} rotation={[0.15, i, 0.2]}>
            <cylinderGeometry args={[0.05, 0.07, 1.4, 5]} />
            <meshLambertMaterial color="#5a3a20" />
          </mesh>
        ))}
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0.2]}>
          <torusGeometry args={[1.15, 0.18, 6, 10]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
        {opened.current ? (
          <group position={[0, 0.55, 0.2]}>
            <RupeeMesh tint="gold" scale={1.15} />
          </group>
        ) : (
          <mesh position={[0, 0.38, 0.15]}>
            <boxGeometry args={[0.7, 0.48, 0.52]} />
            <meshLambertMaterial color="#8a5a20" />
          </mesh>
        )}
      </group>
    </Near>
  );
}

/** A big lizard asleep west of the keep road. Sneak, or wake it. */
function SleepingBrute() {
  const at = { x: -46, z: 6 };
  const hp = useRef(5);
  const dead = useRef(Boolean(live.smashed.sleeper));
  const woke = useRef(false);
  const g = useRef<THREE.Group>(null);
  const pose = useRef<FangPose>("idle");
  const pos = useRef({ x: at.x, z: at.z, yaw: 1.2 });
  useFrame((_, dt) => {
    if (live.house || dead.current) {
      if (g.current) g.current.visible = false;
      return;
    }
    const o = pos.current;
    const d = Math.hypot(live.x - o.x, live.z - o.z);
    if (!woke.current) {
      pose.current = "idle";
      if (d < 9) live.listen = live.listen || "It is sleeping. It is also very large.";
      if (d < 2.1 || (live.slash && Math.hypot(live.slash.x - o.x, live.slash.z - o.z) < 2.2)) {
        woke.current = true;
        live.listen = "It woke up in a bad mood.";
        sfx.hiss();
      }
      if (g.current) {
        g.current.visible = true;
        g.current.position.set(o.x, heightAt(o.x, o.z), o.z);
        g.current.rotation.y = o.yaw;
        g.current.rotation.x = -0.55;
      }
      return;
    }
    live.aggroIds.add("sleeper");
    if (d > 1.3) {
      o.x += ((live.x - o.x) / d) * 3.1 * dt;
      o.z += ((live.z - o.z) / d) * 3.1 * dt;
      o.yaw = Math.atan2(-(live.x - o.x), -(live.z - o.z));
      pose.current = "chase";
    }
    if (live.slash && Math.hypot(live.slash.x - o.x, live.slash.z - o.z) < (live.slash.r ?? 1.2) + 0.7) {
      hp.current -= live.spinning || live.jumpAtk ? 2 : 1;
      puffAt(o.x, o.z, heightAt(o.x, o.z) + 1, true);
      sfx.hit();
      if (hp.current <= 0) {
        dead.current = true;
        live.aggroIds.delete("sleeper");
        pay(40, "sleeper");
        quest("sleeper");
        live.listen = "It went back to sleep. Permanently.";
        sfx.chime();
      }
    }
    if (d < 1.6 && live.heroFlash < 0.2) {
      useGame.getState().hurtField(3);
      live.knock = { vx: ((live.x - o.x) / Math.max(0.2, d)) * 9, vz: ((live.z - o.z) / Math.max(0.2, d)) * 9, t: 0.22 };
      live.heroFlash = 0.4;
    }
    if (g.current) {
      g.current.visible = true;
      g.current.position.set(o.x, heightAt(o.x, o.z), o.z);
      g.current.rotation.y = o.yaw;
      g.current.rotation.x = 0;
      g.current.scale.setScalar(1.55);
    }
  });
  if (dead.current) return null;
  return (
    <group ref={g} scale={1.55}>
      <N64Foe kind="glyphite" seed={3} pose="idle" poseRef={pose} world="cavern" />
    </group>
  );
}

/** Dusk at the pond. Catch five lights. They follow you, then make a picture. */
function FireflyDance() {
  const spots = useRef(
    Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2;
      return {
        x: POND.x + Math.cos(a) * 6.4,
        z: POND.z + Math.sin(a) * 5.2,
        got: Boolean(live.smashed[`fly-${i}`]),
      };
    }),
  );
  const done = useRef(Boolean(live.smashed.fireflies));
  const spin = useRef(0);
  useFrame((_, dt) => {
    spin.current += dt;
    if (live.house || done.current) return;
    const dusk = duskAmt();
    if (dusk < 0.35 && !live.night) return;
    spots.current.forEach((s, i) => {
      if (s.got) {
        s.x += (live.x + Math.cos(spin.current * 2 + i) * 0.7 - s.x) * 0.08;
        s.z += (live.z + Math.sin(spin.current * 2 + i) * 0.7 - s.z) * 0.08;
        return;
      }
      s.x += Math.sin(spin.current * 1.4 + i * 1.7) * 0.6 * dt;
      s.z += Math.cos(spin.current * 1.1 + i) * 0.6 * dt;
      if (Math.hypot(live.x - s.x, live.z - s.z) < 0.95) {
        s.got = true;
        pay(2, `fly-${i}`);
        sfx.chime();
        if (spots.current.every((f) => f.got)) {
          done.current = true;
          pay(18, "fireflies");
          quest("fireflies");
          live.listen = "Five lights. They sat in a shape that looked like a six, then a laugh.";
        } else {
          live.listen = live.listen || "A pond-star. It likes your pocket.";
        }
      }
    });
  });
  const dusk = duskAmt();
  if (!live.night && dusk < 0.3 && !done.current) return null;
  return (
    <group>
      {spots.current.map((s, i) => (
        <mesh key={i} position={[s.x, heightAt(s.x, s.z) + 1.15 + Math.sin(spin.current * 4 + i) * 0.12, s.z]}>
          <sphereGeometry args={[0.08, 6, 5]} />
          <meshBasicMaterial color={s.got ? "#f4e878" : "#c8f070"} />
        </mesh>
      ))}
    </group>
  );
}

/** Apple + mushroom on the pit fire. A stew. Not a worksheet. */
function CookStew() {
  const done = useRef(Boolean(live.smashed.stew));
  const pot = useRef(0);
  useFrame((_, dt) => {
    pot.current += dt;
    if (live.house || done.current) return;
    const d = Math.hypot(live.x - FIRE_PIT.x, live.z - FIRE_PIT.z);
    if (d > 3.2) return;
    const g = useGame.getState();
    const have = (g.apples ?? 0) > 0 && (g.mushrooms ?? 0) > 0;
    live.listen =
      live.listen ||
      (have ? "The fire will take an apple and a mushroom. Talk to the pot." : "A pot. It wants an apple and a mushroom.");
    if (have && talked()) {
      done.current = true;
      g.eatApple();
      g.eatMushroom();
      const max = playerMaxHp(g.xp, g.outfit, g.heartsExtra ?? 0);
      useGame.setState({ hp: max });
      pay(8, "stew");
      quest("stew");
      live.listen = "Stew. It tastes like two numbers that got along.";
      sfx.chime();
    }
  });
  const y = heightAt(FIRE_PIT.x, FIRE_PIT.z);
  return (
    <group position={[FIRE_PIT.x + 1.15, y, FIRE_PIT.z - 0.4]}>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.38, 0.42, 0.42, 8]} />
        <meshLambertMaterial color="#3a322c" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.08, 8]} />
        <meshLambertMaterial
          color={done.current ? "#c47828" : "#4a6a38"}
          emissive={done.current ? "#c47828" : "#000000"}
          emissiveIntensity={done.current ? 0.35 : 0}
        />
      </mesh>
    </group>
  );
}

/** A tree across the keep-road ditch. Slash it, it falls, you walk. */
function FallenLog() {
  const tree = { x: 4.2, z: -14.6 };
  const down = useRef(Boolean(live.smashed.advlog));
  useFrame(() => {
    if (live.house) return;
    if (!down.current) {
      addAdvHit(tree.x + 2.4, tree.z, 1.15);
      addAdvHit(tree.x - 2.4, tree.z, 1.15);
      if (live.slash && Math.hypot(live.slash.x - tree.x, live.slash.z - tree.z) < 1.7) {
        down.current = true;
        pay(6, "advlog");
        puffAt(tree.x, tree.z, heightAt(tree.x, tree.z) + 1.2, true);
        live.listen = "The tree decided to be a bridge.";
        sfx.smash();
        crackAt(tree.x, tree.z);
      } else if (Math.hypot(live.x - tree.x, live.z - tree.z) < 4.5) {
        live.listen = live.listen || (hasSword() ? "A thin tree. It wants to fall across that ditch." : "A ditch. A tree. You need a blade.");
      }
    } else {
      addTrapSpot(tree.x, tree.z, 2.4, 0.18);
    }
  });
  const y = heightAt(tree.x, tree.z);
  return (
    <group position={[tree.x, y, tree.z]}>
      {down.current ? (
        <mesh position={[0, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.28, 5.2, 7]} />
          <meshLambertMaterial color="#5a3a20" />
        </mesh>
      ) : (
        <>
          <mesh position={[0, 1.7, 0]}>
            <cylinderGeometry args={[0.16, 0.22, 3.4, 6]} />
            <meshLambertMaterial color="#4a3220" />
          </mesh>
          <mesh position={[0, 3.5, 0]}>
            <icosahedronGeometry args={[1.05, 0]} />
            <meshLambertMaterial color="#2a6a28" />
          </mesh>
          <mesh position={[-2.4, 0.4, 0]}>
            <boxGeometry args={[1.1, 0.8, 1.4]} />
            <meshLambertMaterial color="#6a6458" />
          </mesh>
          <mesh position={[2.4, 0.4, 0]}>
            <boxGeometry args={[1.1, 0.8, 1.4]} />
            <meshLambertMaterial color="#6a6458" />
          </mesh>
        </>
      )}
    </group>
  );
}

/** Tess's balloon. Jump into it. */
function RedBalloon() {
  const home = { x: WELL_AT.x + 4.2, z: WELL_AT.z - 3.4 };
  const p = useRef({ x: home.x, z: home.z, y: 2.4 });
  const got = useRef(Boolean(live.smashed.balloon));
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (live.house || got.current) return;
    const o = p.current;
    o.x = home.x + Math.sin(t.current * 0.35) * 6.4;
    o.z = home.z + Math.cos(t.current * 0.28) * 4.8;
    o.y = 2.1 + Math.sin(t.current * 1.6) * 0.45;
    const d = Math.hypot(live.x - o.x, live.z - o.z);
    const reach = live.y + 1.4 > heightAt(o.x, o.z) + o.y - 0.6;
    if (d < 1.15 && reach) {
      got.current = true;
      pay(12, "balloon");
      quest("balloon");
      live.listen = "The balloon popped into your hands. Tess is going to scream in a good way.";
      sfx.chime();
      puffAt(o.x, o.z, heightAt(o.x, o.z) + o.y);
    } else if (d < 8) {
      live.listen = live.listen || "A runaway balloon. Jump.";
    }
  });
  if (got.current) return null;
  const o = p.current;
  const gy = heightAt(o.x, o.z);
  return (
    <group position={[o.x, gy + o.y, o.z]}>
      <mesh>
        <sphereGeometry args={[0.38, 8, 7]} />
        <meshLambertMaterial color="#d42838" emissive="#a01828" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1.0, 4]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}

/** Three frogs. Talk to hear them count. Funny, then a rupee. */
function FrogChoir() {
  const frogs = [
    { x: POND.x + 8.4, z: POND.z + 3.2, n: 1 },
    { x: POND.x + 10.2, z: POND.z + 1.4, n: 2 },
    { x: POND.x + 9.1, z: POND.z - 1.6, n: 3 },
  ];
  const step = useRef(0);
  const done = useRef(Boolean(live.smashed.frogs));
  const croak = useRef(0);
  useFrame((_, dt) => {
    croak.current = Math.max(0, croak.current - dt);
    if (live.house || done.current) return;
    for (const f of frogs) {
      const d = Math.hypot(live.x - f.x, live.z - f.z);
      if (d < 1.35 && talked()) {
        const need = step.current + 1;
        if (f.n === need) {
          step.current = f.n;
          croak.current = 0.5;
          sfx.ok();
          live.listen = f.n === 1 ? "Ribbit." : f.n === 2 ? "Ribbit ribbit." : "Ribbit ribbit ribbit. They looked proud.";
          if (f.n === 3) {
            done.current = true;
            pay(15, "frogs");
            live.listen = "One, two, three. The pond paid you for the concert.";
            sfx.chime();
          }
        } else {
          step.current = f.n === 1 ? 1 : 0;
          croak.current = 0.35;
          sfx.miss();
          live.listen = "Wrong frog. They are picky about order.";
        }
      } else if (d < 3.4) {
        live.listen = live.listen || "Three frogs. They look like they can count.";
      }
    }
  });
  return (
    <Near x={POND.x + 9} z={POND.z} r={40}>
      {frogs.map((f) => {
        const y = heightAt(f.x, f.z);
        return (
          <group key={f.n} position={[f.x, y, f.z]}>
            <mesh position={[0, 0.16, 0]} scale={[1, 0.7, 1.15]}>
              <sphereGeometry args={[0.22, 7, 6]} />
              <meshLambertMaterial color={done.current || step.current >= f.n ? "#c9a227" : "#3d7a48"} />
            </mesh>
            <mesh position={[0.08, 0.28, 0.12]}>
              <sphereGeometry args={[0.06, 5, 4]} />
              <meshLambertMaterial color="#efe6d4" />
            </mesh>
            <mesh position={[-0.08, 0.28, 0.12]}>
              <sphereGeometry args={[0.06, 5, 4]} />
              <meshLambertMaterial color="#efe6d4" />
            </mesh>
          </group>
        );
      })}
    </Near>
  );
}

/** Stand still at the lookout at dusk. A star falls. Just beautiful, then a shard. */
function LookoutStar() {
  const seen = useRef(Boolean(live.smashed.meteor));
  const fall = useRef(-1);
  const pos = useRef({ x: LOOK_AT.x + 8, y: 28, z: LOOK_AT.z - 4 });
  useFrame((_, dt) => {
    if (live.house || seen.current) return;
    const d = Math.hypot(live.x - LOOK_AT.x, live.z - LOOK_AT.z);
    const dusk = duskAmt();
    if (d < 4.2 && live.stillT > 1.6 && (dusk > 0.55 || live.night) && fall.current < 0) {
      fall.current = 0;
      live.listen = "A star forgot how to stay up.";
    }
    if (fall.current >= 0 && fall.current < 1) {
      fall.current += dt * 0.35;
      const u = Math.min(1, fall.current);
      pos.current.x = LOOK_AT.x + 8 - u * 8;
      pos.current.z = LOOK_AT.z - 4 + u * 4;
      pos.current.y = 22 - u * 20;
      if (u >= 1) {
        seen.current = true;
        pay(22, "meteor");
        quest("meteor");
        puffAt(LOOK_AT.x, LOOK_AT.z, heightAt(LOOK_AT.x, LOOK_AT.z) + 1.2, true);
        live.listen = "It landed like a coin that had been thinking.";
        sfx.chime();
      }
    }
  });
  if (seen.current || fall.current < 0) return null;
  const p = pos.current;
  return (
    <mesh position={[p.x, p.y, p.z]}>
      <octahedronGeometry args={[0.22, 0]} />
      <meshBasicMaterial color="#f4f0d8" />
    </mesh>
  );
}

/** Night only. Faster. Meaner. West of town. */
function NightHunter() {
  const start = { x: VX - 92, z: VZ + 18 };
  const p = useRef({ x: start.x, z: start.z, yaw: 0 });
  const dead = useRef(Boolean(live.smashed.hunter));
  const g = useRef<THREE.Group>(null);
  const pose = useRef<FangPose>("walk");
  const swipe = useRef(-9);
  useFrame((_, dt) => {
    const night = live.night || duskAmt() > 0.82;
    if (live.house || dead.current || !night) {
      if (g.current) g.current.visible = false;
      live.aggroIds.delete("hunter");
      return;
    }
    const o = p.current;
    const dx = live.x - o.x;
    const dz = live.z - o.z;
    const d = Math.hypot(dx, dz);
    if (d < 22 && d > 1.2) {
      o.x += (dx / d) * 5.4 * dt;
      o.z += (dz / d) * 5.4 * dt;
      o.yaw = Math.atan2(-dx, -dz);
      pose.current = d < 5 ? "chase" : "walk";
      live.aggroIds.add("hunter");
      if (d < 16 && !live.smashed.huntersee) {
        live.smashed.huntersee = true;
        live.listen = "This one hunts. It is not like the others.";
      }
    } else {
      live.aggroIds.delete("hunter");
    }
    if (live.slash && Math.hypot(live.slash.x - o.x, live.slash.z - o.z) < (live.slash.r ?? 1.2) + 0.5) {
      dead.current = true;
      live.aggroIds.delete("hunter");
      pay(30, "hunter");
      quest("hunter");
      puffAt(o.x, o.z, heightAt(o.x, o.z) + 0.9, true);
      live.listen = "Night went a little quieter.";
      sfx.hit();
    }
    if (d < 1.35 && live.playT - swipe.current > 1.0 && !live.god) {
      swipe.current = live.playT;
      pose.current = "swipe";
      if (!(live.shieldUp && useGame.getState().hasShield)) {
        useGame.getState().hurtField(4);
        live.knock = { vx: (dx / Math.max(0.2, d)) * 10, vz: (dz / Math.max(0.2, d)) * 10, t: 0.24 };
      } else sfx.block();
    }
    if (g.current) {
      g.current.visible = true;
      g.current.position.set(o.x, heightAt(o.x, o.z), o.z);
      g.current.rotation.y = o.yaw;
      g.current.scale.setScalar(1.2);
    }
  });
  if (dead.current) return null;
  return (
    <group ref={g} scale={1.2}>
      <N64Foe kind="umbral" seed={11} pose="walk" poseRef={pose} world="grave" />
    </group>
  );
}

/** Brin's well race — actually time you. */
function WellRace() {
  const line = { x: -24.2, z: -86.4 };
  const on = useRef(false);
  const t = useRef(0);
  const best = useRef(false);
  useFrame((_, dt) => {
    if (live.house || best.current) return;
    const d0 = Math.hypot(live.x - line.x, live.z - line.z);
    if (!on.current && d0 < 1.15 && Math.abs(live.speed) > 2.5) {
      on.current = true;
      t.current = 0;
      live.listen = "Twelve counts. The well. Go.";
      sfx.ok();
    }
    if (!on.current) {
      if (d0 < 3.2) live.listen = live.listen || "A scratch in the dirt. Start here. Finish at the well.";
      return;
    }
    t.current += dt;
    const dw = Math.hypot(live.x - WELL_AT.x, live.z - WELL_AT.z);
    if (dw < 1.6) {
      on.current = false;
      if (t.current <= 12.2) {
        best.current = true;
        pay(20, "wellrace");
        quest("wellrace");
        live.listen = `${t.current.toFixed(1)} counts. Brin is going to be insufferable. Then he will pay you.`;
        sfx.chime();
      } else {
        live.listen = `${t.current.toFixed(1)}. The well waited. Brin will not.`;
        sfx.miss();
      }
    }
    if (t.current > 18) {
      on.current = false;
      live.listen = "The race went home without you.";
    }
  });
  const y = heightAt(line.x, line.z);
  return (
    <mesh position={[line.x, y + 0.03, line.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.7, 10]} />
      <meshLambertMaterial color={best.current ? "#c9a227" : "#8a4030"} />
    </mesh>
  );
}

/** A little cave by the mill. Three pads in order. A heart. */
function PadGrotto() {
  const mouth = { x: VX + 8.4, z: VZ - 38 };
  const pads = [
    { n: 1, x: mouth.x + 3.4, z: mouth.z - 2.2 },
    { n: 2, x: mouth.x + 5.2, z: mouth.z - 0.4 },
    { n: 3, x: mouth.x + 3.6, z: mouth.z + 1.8 },
  ];
  const step = useRef(0);
  const done = useRef(Boolean(live.smashed.padgrotto));
  const last = useRef(-1);
  useFrame(() => {
    if (live.house || done.current) return;
    for (const p of pads) addTrapSpot(p.x, p.z, 0.5, 0.16);
    for (const p of pads) {
      const d = Math.hypot(live.x - p.x, live.z - p.z);
      if (d < 0.62 && live.grounded && last.current !== p.n) {
        last.current = p.n;
        if (p.n === step.current + 1) {
          step.current = p.n;
          sfx.ok();
          puffAt(p.x, p.z);
          if (p.n === 3) {
            done.current = true;
            pay(10, "padgrotto");
            if (useGame.getState().grantHeartContainer("padgrotto")) revealItem("container", true);
            live.listen = "One, two, three. The cave had been saving a heart.";
            sfx.chime();
          }
        } else {
          step.current = p.n === 1 ? 1 : 0;
          last.current = p.n === 1 ? 1 : -1;
          sfx.miss();
        }
      }
    }
    if (Math.hypot(live.x - mouth.x, live.z - mouth.z) < 4) {
      live.listen = live.listen || "Three stones. They want to be counted in order.";
    }
  });
  return (
    <Near x={mouth.x} z={mouth.z} r={50}>
      <group>
        <mesh position={[mouth.x, heightAt(mouth.x, mouth.z) + 1.1, mouth.z - 1.4]}>
          <boxGeometry args={[4.4, 2.2, 0.6]} />
          <meshLambertMaterial color="#5a5248" />
        </mesh>
        {pads.map((p) => (
          <mesh key={p.n} position={[p.x, heightAt(p.x, p.z) + 0.08, p.z]}>
            <cylinderGeometry args={[0.52, 0.58, 0.16, 8]} />
            <meshLambertMaterial color={done.current || step.current >= p.n ? "#c9a227" : "#6a6458"} />
          </mesh>
        ))}
        {done.current ? (
          <group position={[mouth.x + 5.8, heightAt(mouth.x + 5.8, mouth.z) + 0.7, mouth.z]}>
            <HeartContainerMesh />
          </group>
        ) : null}
      </group>
    </Near>
  );
}

/** Just beautiful. Stand still. The hill sings. */
function WindChimes() {
  const at = { x: LOOK_AT.x - 3.2, z: LOOK_AT.z + 2.4 };
  const sang = useRef(false);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (live.house) return;
    const d = Math.hypot(live.x - at.x, live.z - at.z);
    if (d < 2.6 && live.stillT > 1.4 && !sang.current) {
      sang.current = true;
      pay(5, "chimes");
      live.listen = "The chimes counted the wind. It came out even.";
      sfx.ok();
    }
  });
  const y = heightAt(at.x, at.z);
  return (
    <group position={[at.x, y, at.z]}>
      <mesh position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 5]} />
        <meshLambertMaterial color="#5a3a20" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.sin(i) * 0.22, 1.7 - (i % 2) * 0.15, Math.cos(i) * 0.22]}>
          <cylinderGeometry args={[0.04, 0.05, 0.7 + i * 0.08, 6]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      ))}
    </group>
  );
}

/** East road toward the river — a tipped cart, three crates, pick the even one. */
function RoadCaravan() {
  const at = { x: 210, z: -96 };
  const boxes = [
    { n: 1, x: at.x - 1.6, z: at.z + 0.8 },
    { n: 2, x: at.x, z: at.z + 1.4 },
    { n: 3, x: at.x + 1.6, z: at.z + 0.6 },
  ];
  const got = useRef(Boolean(live.smashed.caravan));
  const wrong = useRef(0);
  useFrame((_, dt) => {
    wrong.current = Math.max(0, wrong.current - dt);
    if (live.house || got.current) return;
    for (const b of boxes) {
      const d = Math.hypot(live.x - b.x, live.z - b.z);
      if (d < 1.05 && talked()) {
        if (b.n === 2) {
          got.current = true;
          pay(16, "caravan");
          live.listen = "The even crate. Cobb would have liked this cart.";
          sfx.chime();
        } else {
          wrong.current = 0.5;
          sfx.miss();
          live.listen = "Odd. The cart spit dust at you.";
        }
      } else if (d < 5) {
        live.listen = live.listen || "A tipped cart. Three crates. One of them is even.";
      }
    }
  });
  return (
    <Near x={at.x} z={at.z}>
      <group>
        <mesh position={[at.x, heightAt(at.x, at.z) + 0.55, at.z - 1.2]} rotation={[0.4, 0.6, 0.15]}>
          <boxGeometry args={[2.2, 0.85, 1.15]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
        {boxes.map((b) => (
          <mesh key={b.n} position={[b.x, heightAt(b.x, b.z) + 0.32, b.z]}>
            <boxGeometry args={[0.7, 0.64, 0.7]} />
            <meshLambertMaterial color={got.current && b.n === 2 ? "#c9a227" : wrong.current > 0 ? "#a42828" : "#8a5a28"} />
          </mesh>
        ))}
        <N64Sign x={at.x - 2.4} z={at.z - 0.8} />
      </group>
    </Near>
  );
}

/** First bog on the southwest road. Hop three sinking stones. */
function BogFirst() {
  const stones = [
    { x: -470, z: -410 },
    { x: -488, z: -424 },
    { x: -506, z: -412 },
  ];
  const sink = useRef([0, 0, 0]);
  const got = useRef(Boolean(live.smashed.bogfirst));
  useFrame((_, dt) => {
    if (live.house) return;
    stones.forEach((s, i) => {
      const d = Math.hypot(live.x - s.x, live.z - s.z);
      if (d < 0.85 && live.grounded) {
        sink.current[i] = Math.min(1, (sink.current[i] ?? 0) + dt * 0.7);
        addTrapSpot(s.x, s.z, 0.7, 0.12);
        if ((sink.current[i] ?? 0) > 0.92) {
          live.y -= 0.4;
          live.listen = live.listen || "The stone wanted a snack. Jump.";
        }
      } else {
        sink.current[i] = Math.max(0, (sink.current[i] ?? 0) - dt * 0.4);
      }
    });
    if (!got.current && Math.hypot(live.x - stones[2]!.x, live.z - stones[2]!.z) < 1.1) {
      got.current = true;
      pay(10, "bogfirst");
      live.listen = "The last stone held. The swamp is still ahead.";
      sfx.ok();
    }
  });
  return (
    <Near x={-488} z={-418}>
      {stones.map((s, i) => (
        <mesh key={i} position={[s.x, heightAt(s.x, s.z) + 0.12 - (sink.current[i] ?? 0) * 0.5, s.z]}>
          <cylinderGeometry args={[0.7, 0.8, 0.22, 7]} />
          <meshLambertMaterial color="#4a5a40" />
        </mesh>
      ))}
    </Near>
  );
}

/** First dune on the southeast road. A ring of buried coins. Slash the sand. */
function SandFirst() {
  const at = { x: 640, z: -420 };
  const piles = [
    { x: at.x - 2.2, z: at.z },
    { x: at.x + 2.0, z: at.z + 1.2 },
    { x: at.x + 0.4, z: at.z - 2.0 },
  ];
  const got = useRef(piles.map((_, i) => Boolean(live.smashed[`sandpile-${i}`])));
  useFrame(() => {
    if (live.house) return;
    piles.forEach((p, i) => {
      if (got.current[i]) return;
      if (live.slash && Math.hypot(live.slash.x - p.x, live.slash.z - p.z) < 1.4) {
        got.current[i] = true;
        pay(6, `sandpile-${i}`);
        puffAt(p.x, p.z, heightAt(p.x, p.z) + 0.4);
        if (got.current.every(Boolean)) {
          pay(12, "sandfirst");
          live.listen = "The sand was hiding a count of three. Goldwaste is further on.";
          sfx.chime();
        }
      } else if (Math.hypot(live.x - p.x, live.z - p.z) < 5) {
        live.listen = live.listen || "Three humps of sand. They look slashable.";
      }
    });
  });
  return (
    <Near x={at.x} z={at.z}>
      {piles.map((p, i) =>
        got.current[i] ? null : (
          <mesh key={i} position={[p.x, heightAt(p.x, p.z) + 0.28, p.z]}>
            <sphereGeometry args={[0.55, 7, 5]} />
            <meshLambertMaterial color="#c4a05a" />
          </mesh>
        ),
      )}
    </Near>
  );
}

/** First standing stones on the south road. Walk them 1-2-3-4. */
function SouthStones() {
  const stones = [
    { n: 1, x: 18, z: -620 },
    { n: 2, x: 34, z: -636 },
    { n: 3, x: 12, z: -652 },
    { n: 4, x: 28, z: -668 },
  ];
  const step = useRef(0);
  const done = useRef(Boolean(live.smashed.southstones));
  const last = useRef(-1);
  useFrame(() => {
    if (live.house || done.current) return;
    for (const s of stones) {
      const d = Math.hypot(live.x - s.x, live.z - s.z);
      if (d < 1.15 && live.grounded && last.current !== s.n) {
        last.current = s.n;
        if (s.n === step.current + 1) {
          step.current = s.n;
          sfx.ok();
          puffAt(s.x, s.z);
          if (s.n === 4) {
            done.current = true;
            pay(18, "southstones");
            live.listen = "The stones remember a city further south.";
            sfx.chime();
          }
        } else {
          step.current = s.n === 1 ? 1 : 0;
          last.current = s.n === 1 ? 1 : -1;
          sfx.miss();
        }
      } else if (d < 6) {
        live.listen = live.listen || "Four stones. Walk them in order. Do not skip.";
      }
    }
  });
  return (
    <Near x={22} z={-640}>
      {stones.map((s) => (
        <group key={s.n} position={[s.x, heightAt(s.x, s.z), s.z]}>
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[0.7, 2.2, 0.45]} />
            <meshLambertMaterial color={done.current || step.current >= s.n ? "#c9a227" : "#7a6a48"} />
          </mesh>
        </group>
      ))}
    </Near>
  );
}

/* ───────── Goldwaste ───────── */
function Goldwaste() {
  const c = LANDS.desert;
  return (
    <Near x={c.x} z={c.z} r={220}>
      <Oasis />
      <BuriedDoor />
      <DuneSlide />
      <Mirage />
    </Near>
  );
}

function Oasis() {
  const at = { x: LANDS.desert.x - 24, z: LANDS.desert.z + 18 };
  const drank = useRef(Boolean(live.smashed.oasis));
  useFrame(() => {
    if (live.house || drank.current) return;
    const d = Math.hypot(live.x - at.x, live.z - at.z);
    if (d < 2.4 && talked()) {
      drank.current = true;
      const g = useGame.getState();
      const max = playerMaxHp(g.xp, g.outfit, g.heartsExtra ?? 0);
      useGame.setState({ hp: max });
      pay(8, "oasis");
      quest("dune");
      live.listen = "The water was real. The rest of the desert is still lying.";
      sfx.chime();
    } else if (d < 8) {
      live.listen = live.listen || "Shade. Water. Palms. Talk to drink.";
    }
  });
  const y = heightAt(at.x, at.z);
  return (
    <group position={[at.x, y, at.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[3.4, 14]} />
        <meshLambertMaterial color="#3a7a88" />
      </mesh>
      {[-1.6, 1.4].map((ox, i) => (
        <group key={i} position={[ox, 0, -2.2 + i]}>
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.12, 0.18, 3.2, 6]} />
            <meshLambertMaterial color="#6a4a28" />
          </mesh>
          <mesh position={[0.6, 3.1, 0]} rotation={[0, 0, 0.7]}>
            <boxGeometry args={[1.4, 0.08, 0.35]} />
            <meshLambertMaterial color="#3d7a48" />
          </mesh>
          <mesh position={[-0.5, 3.0, 0.2]} rotation={[0, 0.4, -0.6]}>
            <boxGeometry args={[1.2, 0.08, 0.3]} />
            <meshLambertMaterial color="#2a6a28" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BuriedDoor() {
  const at = { x: LANDS.desert.x + 36, z: LANDS.desert.z - 22 };
  const piles = [0, 1, 2].map((i) => ({
    x: at.x + (i - 1) * 2.2,
    z: at.z + 2.4,
  }));
  const got = useRef(piles.map((_, i) => Boolean(live.smashed[`dunedoor-${i}`])));
  const open = useRef(Boolean(live.smashed.dunedoor));
  useFrame(() => {
    if (live.house || open.current) return;
    piles.forEach((p, i) => {
      if (got.current[i]) return;
      if (live.slash && Math.hypot(live.slash.x - p.x, live.slash.z - p.z) < 1.3) {
        got.current[i] = true;
        pay(5, `dunedoor-${i}`);
        puffAt(p.x, p.z, heightAt(p.x, p.z) + 0.3);
        if (got.current.every(Boolean)) {
          open.current = true;
          pay(28, "dunedoor");
          if (useGame.getState().grantHeartContainer("dunedoor")) revealItem("container", true);
          live.listen = "Three piles. A door. The desert had been sitting on a heart.";
          sfx.chime();
        }
      }
    });
    if (Math.hypot(live.x - at.x, live.z - at.z) < 6) live.listen = live.listen || "A lintel in the sand. Three humps in front of it.";
  });
  const y = heightAt(at.x, at.z);
  return (
    <group>
      <mesh position={[at.x, y + 1.4, at.z]}>
        <boxGeometry args={[3.2, 2.8, 0.5]} />
        <meshLambertMaterial color="#8a6a40" />
      </mesh>
      <mesh position={[at.x, y + 1.2, at.z + 0.1]}>
        <boxGeometry args={[1.4, 2.2, 0.2]} />
        <meshLambertMaterial color={open.current ? "#1a1410" : "#5a4030"} />
      </mesh>
      {piles.map((p, i) =>
        got.current[i] ? null : (
          <mesh key={i} position={[p.x, heightAt(p.x, p.z) + 0.3, p.z]}>
            <sphereGeometry args={[0.62, 7, 5]} />
            <meshLambertMaterial color="#c4a05a" />
          </mesh>
        ),
      )}
    </group>
  );
}

function DuneSlide() {
  const top = { x: LANDS.desert.x + 80, z: LANDS.desert.z + 40 };
  const used = useRef(false);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - top.x, live.z - top.z);
    if (d < 3.5 && live.grounded && live.z < top.z + 2) {
      live.speed = Math.max(live.speed, 14);
      if (!used.current) {
        used.current = true;
        pay(8, "duneslide");
        live.listen = "The dune decided you were a sled.";
      }
    }
  });
  const y = heightAt(top.x, top.z);
  return (
    <mesh position={[top.x, y + 0.04, top.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[2.2, 10]} />
      <meshLambertMaterial color="#e8c888" />
    </mesh>
  );
}

function Mirage() {
  const at = { x: LANDS.desert.x - 70, z: LANDS.desert.z - 50 };
  const fade = useRef(1);
  const seen = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - at.x, live.z - at.z);
    if (d < 14 && d > 5) fade.current = Math.max(0.15, fade.current - dt * 0.25);
    else fade.current = Math.min(1, fade.current + dt * 0.2);
    if (d < 8 && !seen.current) {
      seen.current = true;
      live.listen = "Oakstead? No. The heat is telling a joke.";
    }
  });
  const y = heightAt(at.x, at.z);
  return (
    <group position={[at.x, y, at.z]} scale={0.45}>
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[4.4, 2.8, 3.2]} />
        <meshLambertMaterial color="#c8b89a" transparent opacity={fade.current * 0.55} />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <coneGeometry args={[2.6, 1.4, 4]} />
        <meshLambertMaterial color="#a83838" transparent opacity={fade.current * 0.5} />
      </mesh>
    </group>
  );
}

/* ───────── Mirefen ───────── */
function Mirefen() {
  const c = LANDS.swamp;
  return (
    <Near x={c.x} z={c.z} r={220}>
      <Wisps />
      <LilyHop />
      <SunkenBell />
      <FenBoat />
    </Near>
  );
}

function Wisps() {
  const path = [
    { x: LANDS.swamp.x + 40, z: LANDS.swamp.z + 20 },
    { x: LANDS.swamp.x + 18, z: LANDS.swamp.z - 8 },
    { x: LANDS.swamp.x - 6, z: LANDS.swamp.z - 24 },
    { x: LANDS.swamp.x - 22, z: LANDS.swamp.z - 8 },
  ];
  const i = useRef(0);
  const got = useRef(Boolean(live.smashed.wisps));
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (live.house || got.current) return;
    const p = path[Math.min(i.current, path.length - 1)]!;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 2.2) {
      i.current += 1;
      sfx.ok();
      if (i.current >= path.length) {
        got.current = true;
        pay(24, "wisps");
        quest("fen");
        live.listen = "The lights sat on a chest that had been drowning politely.";
        sfx.chime();
      } else {
        live.listen = live.listen || "The light moved. It wants you to follow.";
      }
    } else if (d < 10) {
      live.listen = live.listen || "A wet star. It will not wait.";
    }
  });
  const p = got.current ? path[path.length - 1]! : path[Math.min(i.current, path.length - 1)]!;
  return (
    <group>
      <mesh position={[p.x, heightAt(p.x, p.z) + 1.6 + Math.sin(t.current * 3) * 0.2, p.z]}>
        <sphereGeometry args={[0.14, 6, 5]} />
        <meshBasicMaterial color="#a8f0c0" />
      </mesh>
      {got.current ? (
        <group position={[p.x, heightAt(p.x, p.z) + 0.55, p.z]}>
          <RupeeMesh tint="gold" scale={1.2} />
        </group>
      ) : null}
    </group>
  );
}

function LilyHop() {
  const pads = [
    { x: LANDS.swamp.x - 40, z: LANDS.swamp.z + 30 },
    { x: LANDS.swamp.x - 52, z: LANDS.swamp.z + 38 },
    { x: LANDS.swamp.x - 64, z: LANDS.swamp.z + 28 },
  ];
  const got = useRef(Boolean(live.smashed.lilies));
  useFrame(() => {
    if (live.house) return;
    for (const p of pads) addTrapSpot(p.x, p.z, 0.9, 0.1);
    if (!got.current && Math.hypot(live.x - pads[2]!.x, live.z - pads[2]!.z) < 1.1) {
      got.current = true;
      pay(12, "lilies");
      live.listen = "Three lilies. You did not sink. The fen is impressed.";
      sfx.ok();
    }
  });
  return (
    <group>
      {pads.map((p, i) => (
        <mesh key={i} position={[p.x, heightAt(p.x, p.z) + 0.06, p.z]} rotation={[-Math.PI / 2, 0, i]}>
          <circleGeometry args={[0.95, 8]} />
          <meshLambertMaterial color="#3d6a38" />
        </mesh>
      ))}
    </group>
  );
}

function SunkenBell() {
  const at = { x: LANDS.swamp.x + 8, z: LANDS.swamp.z + 44 };
  const rang = useRef(Boolean(live.smashed.fenbell));
  useFrame(() => {
    if (live.house || rang.current) return;
    const hit =
      (live.slash && Math.hypot(live.slash.x - at.x, live.slash.z - at.z) < 1.8) ||
      (live.lastBoom && Math.hypot(live.lastBoom.x - at.x, live.lastBoom.z - at.z) < 2.6);
    if (hit) {
      rang.current = true;
      pay(18, "fenbell");
      live.listen = "The bell remembered a town that paid taxes in frogs.";
      sfx.chime();
    } else if (Math.hypot(live.x - at.x, live.z - at.z) < 5) {
      live.listen = live.listen || "A bell in the water. Hit it.";
    }
  });
  const y = heightAt(at.x, at.z);
  return (
    <group position={[at.x, y + 0.4, at.z]}>
      <mesh>
        <sphereGeometry args={[0.45, 8, 6]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.4, 6]} />
        <meshLambertMaterial color="#8a6a28" />
      </mesh>
    </group>
  );
}

function FenBoat() {
  const at = { x: LANDS.swamp.x - 18, z: LANDS.swamp.z + 56 };
  const y = heightAt(at.x, at.z);
  return (
    <group>
      <group position={[at.x, y + 0.15, at.z]} rotation={[0.08, 0.6, 0.04]}>
        <mesh>
          <boxGeometry args={[2.8, 0.35, 1.1]} />
          <meshLambertMaterial color="#5a3a20" />
        </mesh>
      </group>
      <N64Sign x={at.x + 1.8} z={at.z - 1.6} />
    </group>
  );
}

/* ───────── White Crown ───────── */
function WhiteCrown() {
  const c = LANDS.snow;
  return (
    <Near x={c.x} z={c.z} r={240}>
      <IceFlags />
      <FrozenChest />
      <SnowMan />
      <IcePads />
    </Near>
  );
}

function IceFlags() {
  const flags = [
    { x: LANDS.snow.x - 20, z: LANDS.snow.z + 8 },
    { x: LANDS.snow.x - 8, z: LANDS.snow.z + 28 },
    { x: LANDS.snow.x + 10, z: LANDS.snow.z + 40 },
    { x: LANDS.snow.x + 24, z: LANDS.snow.z + 22 },
  ];
  const hit = useRef([false, false, false, false]);
  const on = useRef(false);
  const done = useRef(Boolean(live.smashed.iceflags));
  useFrame(() => {
    if (live.house || done.current) return;
    flags.forEach((f, i) => {
      if (hit.current[i]) return;
      if (Math.hypot(live.x - f.x, live.z - f.z) < 1.5) {
        if (i === 0 || hit.current[i - 1]) {
          hit.current[i] = true;
          on.current = true;
          sfx.ok();
          if (i === 3) {
            done.current = true;
            pay(22, "iceflags");
            quest("ice");
            live.listen = "Four flags. The hill liked your line.";
            sfx.chime();
          }
        }
      }
    });
    if (Math.hypot(live.x - flags[0]!.x, live.z - flags[0]!.z) < 6) {
      live.listen = live.listen || "Flags down the ice. Slide through them in order.";
    }
  });
  return (
    <group>
      {flags.map((f, i) => (
        <group key={i} position={[f.x, heightAt(f.x, f.z), f.z]}>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 2.2, 5]} />
            <meshLambertMaterial color="#efe6d4" />
          </mesh>
          <mesh position={[0.28, 1.7, 0]}>
            <boxGeometry args={[0.55, 0.32, 0.04]} />
            <meshLambertMaterial color={done.current || hit.current[i] ? "#c9a227" : "#d42838"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function FrozenChest() {
  const at = { x: LANDS.snow.x + 36, z: LANDS.snow.z - 16 };
  const brazier = { x: at.x - 3.2, z: at.z };
  const lit = useRef(Boolean(live.smashed.icebraze));
  const open = useRef(Boolean(live.smashed.icechest));
  useFrame(() => {
    if (live.house || open.current) return;
    if (!lit.current) {
      const fire =
        live.fireLit ||
        (live.lastBoom && Math.hypot(live.lastBoom.x - brazier.x, live.lastBoom.z - brazier.z) < 2.2);
      if (fire && Math.hypot(live.x - brazier.x, live.z - brazier.z) < 4) {
        lit.current = true;
        pay(6, "icebraze");
        live.listen = "The ice started thinking about being water.";
        sfx.ok();
      } else if (Math.hypot(live.x - at.x, live.z - at.z) < 5) {
        live.listen = live.listen || "A chest in a block of ice. The brazier looks useful.";
      }
    } else if (Math.hypot(live.x - at.x, live.z - at.z) < 1.3) {
      open.current = true;
      pay(20, "icechest");
      if (useGame.getState().grantHeartContainer("icechest")) revealItem("container", true);
      live.listen = "The ice gave up. A heart was being patient.";
      sfx.chime();
    }
  });
  const y = heightAt(at.x, at.z);
  return (
    <group>
      <mesh position={[brazier.x, heightAt(brazier.x, brazier.z) + 0.4, brazier.z]}>
        <cylinderGeometry args={[0.28, 0.34, 0.7, 7]} />
        <meshLambertMaterial color="#4a4038" />
      </mesh>
      {lit.current ? (
        <mesh position={[brazier.x, heightAt(brazier.x, brazier.z) + 0.9, brazier.z]}>
          <sphereGeometry args={[0.18, 6, 5]} />
          <meshBasicMaterial color="#e07038" />
        </mesh>
      ) : null}
      <mesh position={[at.x, y + 0.5, at.z]}>
        <boxGeometry args={[1.1, 1.0, 1.1]} />
        <meshLambertMaterial color={lit.current ? "#8ac0d8" : "#d8e4ee"} transparent opacity={lit.current ? 0.35 : 0.75} />
      </mesh>
    </group>
  );
}

function SnowMan() {
  const at = { x: LANDS.snow.x - 40, z: LANDS.snow.z - 8 };
  const laps = useRef(0);
  const ang = useRef(0);
  const last = useRef(0);
  const done = useRef(Boolean(live.smashed.snowman));
  useFrame(() => {
    if (live.house || done.current) return;
    const dx = live.x - at.x;
    const dz = live.z - at.z;
    const d = Math.hypot(dx, dz);
    if (d > 2.2 && d < 5.5) {
      const a = Math.atan2(dx, dz);
      let da = a - last.current;
      if (da > Math.PI) da -= Math.PI * 2;
      if (da < -Math.PI) da += Math.PI * 2;
      ang.current += da;
      last.current = a;
      if (Math.abs(ang.current) > Math.PI * 2) {
        ang.current = 0;
        laps.current += 1;
        sfx.ok();
        if (laps.current >= 3) {
          done.current = true;
          pay(16, "snowman");
          live.listen = "Achoo. Coins. He is fine.";
          sfx.chime();
        } else {
          live.listen = live.listen || "Keep running around him. He is winding up a sneeze.";
        }
      }
    } else if (d < 7) {
      last.current = Math.atan2(dx, dz);
      live.listen = live.listen || "A snowman. Circle him. He looks ticklish.";
    }
  });
  const y = heightAt(at.x, at.z);
  return (
    <group position={[at.x, y, at.z]}>
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.55, 8, 6]} />
        <meshLambertMaterial color="#eef4f8" />
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <sphereGeometry args={[0.38, 8, 6]} />
        <meshLambertMaterial color="#eef4f8" />
      </mesh>
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.26, 7, 5]} />
        <meshLambertMaterial color="#eef4f8" />
      </mesh>
      <mesh position={[0, 1.68, 0.24]}>
        <coneGeometry args={[0.05, 0.28, 5]} />
        <meshLambertMaterial color="#e07a28" />
      </mesh>
    </group>
  );
}

function IcePads() {
  const pads = [
    { n: 1, x: LANDS.snow.x + 8, z: LANDS.snow.z - 40 },
    { n: 2, x: LANDS.snow.x + 16, z: LANDS.snow.z - 52 },
    { n: 3, x: LANDS.snow.x + 6, z: LANDS.snow.z - 62 },
    { n: 4, x: LANDS.snow.x - 4, z: LANDS.snow.z - 50 },
  ];
  const step = useRef(0);
  const done = useRef(Boolean(live.smashed.icepads));
  const last = useRef(-1);
  useFrame(() => {
    if (live.house || done.current) return;
    for (const p of pads) {
      if (Math.hypot(live.x - p.x, live.z - p.z) < 0.8 && live.grounded && last.current !== p.n) {
        last.current = p.n;
        if (p.n === step.current + 1) {
          step.current = p.n;
          sfx.ok();
          if (p.n === 4) {
            done.current = true;
            pay(18, "icepads");
            live.listen = "The ice kept your count. It almost never does that.";
            sfx.chime();
          }
        } else {
          step.current = p.n === 1 ? 1 : 0;
          last.current = p.n === 1 ? 1 : -1;
          sfx.miss();
        }
      }
    }
  });
  return (
    <group>
      {pads.map((p) => (
        <mesh key={p.n} position={[p.x, heightAt(p.x, p.z) + 0.06, p.z]}>
          <cylinderGeometry args={[0.7, 0.78, 0.14, 8]} />
          <meshLambertMaterial color={done.current || step.current >= p.n ? "#c9a227" : "#b8d0e0"} />
        </mesh>
      ))}
    </group>
  );
}

/* ───────── Old Numer ───────── */
function OldNumer() {
  const c = LANDS.ruins;
  return (
    <Near x={c.x} z={c.z} r={240}>
      <Colonnade />
      <GhostWalk />
      <Sundial />
      <FallenGiant />
    </Near>
  );
}

function Colonnade() {
  const cols = [
    { n: 1, x: LANDS.ruins.x - 16, z: LANDS.ruins.z + 8 },
    { n: 2, x: LANDS.ruins.x - 6, z: LANDS.ruins.z + 8 },
    { n: 3, x: LANDS.ruins.x + 4, z: LANDS.ruins.z + 8 },
    { n: 4, x: LANDS.ruins.x + 14, z: LANDS.ruins.z + 8 },
    { n: 5, x: LANDS.ruins.x + 24, z: LANDS.ruins.z + 8 },
  ];
  const step = useRef(0);
  const done = useRef(Boolean(live.smashed.cols));
  const last = useRef(-1);
  useFrame(() => {
    if (live.house || done.current) return;
    for (const c of cols) {
      const d = Math.hypot(live.x - c.x, live.z - c.z);
      if (d < 1.3 && live.grounded && last.current !== c.n) {
        last.current = c.n;
        if (c.n === step.current + 1) {
          step.current = c.n;
          sfx.ok();
          puffAt(c.x, c.z);
          if (c.n === 5) {
            done.current = true;
            pay(30, "cols");
            quest("ruin");
            if (useGame.getState().grantHeartContainer("cols")) revealItem("container", true);
            live.listen = "Five pillars. They used to hold a roof. Now they hold a heart.";
            sfx.chime();
          }
        } else {
          step.current = c.n === 1 ? 1 : 0;
          last.current = c.n === 1 ? 1 : -1;
          sfx.miss();
          live.listen = "The pillars want one through five. No skipping.";
        }
      } else if (d < 7) {
        live.listen = live.listen || "Walk the pillars. One to five. The city used to start that way.";
      }
    }
  });
  return (
    <group>
      {cols.map((c) => (
        <group key={c.n} position={[c.x, heightAt(c.x, c.z), c.z]}>
          <mesh position={[0, 2.2, 0]}>
            <cylinderGeometry args={[0.42, 0.5, 4.4, 8]} />
            <meshLambertMaterial color={done.current || step.current >= c.n ? "#c9a227" : "#8a7a60"} />
          </mesh>
          <mesh position={[0, 4.5, 0]}>
            <boxGeometry args={[1.1, 0.28, 1.1]} />
            <meshLambertMaterial color="#6a5a40" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GhostWalk() {
  const t = useRef(0);
  const seen = useRef(false);
  useFrame((_, dt) => {
    t.current += dt;
    if (live.house) return;
    if (!(live.night || duskAmt() > 0.75)) return;
    const c = LANDS.ruins;
    const d = Math.hypot(live.x - c.x, live.z - c.z);
    if (d < 40 && !seen.current) {
      seen.current = true;
      live.listen = "They are still going to work. They just forgot to stay.";
    }
  });
  if (!(live.night || duskAmt() > 0.75)) return null;
  const c = LANDS.ruins;
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => {
        const u = ((t.current * 0.12 + i * 0.18) % 1);
        const x = c.x - 30 + u * 70;
        const z = c.z - 12 + Math.sin(u * 6 + i) * 3;
        return (
          <mesh key={i} position={[x, heightAt(x, z) + 1.15, z]}>
            <capsuleGeometry args={[0.18, 0.7, 4, 6]} />
            <meshLambertMaterial color="#d8e4ee" transparent opacity={0.35} />
          </mesh>
        );
      })}
    </group>
  );
}

function Sundial() {
  const at = { x: LANDS.ruins.x - 8, z: LANDS.ruins.z - 28 };
  const got = useRef(Boolean(live.smashed.sundial));
  useFrame(() => {
    if (live.house || got.current) return;
    const d = Math.hypot(live.x - at.x, live.z - at.z);
    const h = gameClock().h;
    const noon = h >= 11 && h <= 13;
    if (d < 1.8 && noon) {
      got.current = true;
      pay(20, "sundial");
      live.listen = "Noon. The shadow sat on four. The stone had been waiting for someone who could tell time.";
      sfx.chime();
    } else if (d < 5) {
      live.listen = live.listen || (noon ? "The shadow is right. Stand in it." : "A sundial. It only tells the truth at noon.");
    }
  });
  const y = heightAt(at.x, at.z);
  return (
    <group position={[at.x, y, at.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <circleGeometry args={[1.6, 12]} />
        <meshLambertMaterial color="#8a7a60" />
      </mesh>
      <mesh position={[0, 0.55, 0]} rotation={[0.4, 0.2, 0]}>
        <coneGeometry args={[0.08, 1.1, 5]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function FallenGiant() {
  const at = { x: LANDS.ruins.x + 48, z: LANDS.ruins.z - 18 };
  const climbed = useRef(Boolean(live.smashed.colossus));
  useFrame(() => {
    if (live.house || climbed.current) return;
    const d = Math.hypot(live.x - at.x, live.z - (at.z - 8));
    if (d < 2.2 && live.y > heightAt(at.x, at.z) + 3.5) {
      climbed.current = true;
      pay(16, "colossus");
      live.listen = "From his shoulder the vale is a map someone folded wrong.";
      sfx.ok();
    } else if (Math.hypot(live.x - at.x, live.z - at.z) < 10) {
      live.listen = live.listen || "A giant who lay down. You can walk the arm.";
    }
    addTrapSpot(at.x, at.z - 2, 1.4, 0.4);
    addTrapSpot(at.x, at.z - 6, 1.2, 0.8);
    addTrapSpot(at.x, at.z - 10, 1.0, 1.4);
  });
  const y = heightAt(at.x, at.z);
  return (
    <group position={[at.x, y, at.z]} rotation={[0.15, 0.3, 0.08]}>
      <mesh position={[0, 1.1, -2]} rotation={[1.15, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.9, 8.4, 7]} />
        <meshLambertMaterial color="#8a7a60" />
      </mesh>
      <mesh position={[0, 1.6, 3.2]}>
        <sphereGeometry args={[1.15, 8, 6]} />
        <meshLambertMaterial color="#9a8a6c" />
      </mesh>
    </group>
  );
}
