import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_LADDER, TREE_TRUNK, VX, VZ } from "./field";
import { WELL_AT } from "./village";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { puffAt } from "./fx";
import { RupeeMesh } from "./actors";
import { addTrapSpot } from "./dungeonTraps";
import { N64Nag } from "./n64";

function pay(n: number, key: string) {
  if (live.smashed[key]) return false;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
  return true;
}

function hasSword() {
  return Boolean(useGame.getState().hasSword);
}

/** The first hour of play — things you DO, not things you read. */
export function BeatPlay() {
  return (
    <group>
      <RupeeTrail />
      <HopStones />
      <CowardFang />
      <GourdLine />
      <DummyPost />
      <GoldBugs />
      <KeepRoadPack />
    </group>
  );
}

/** Green rupees leading from the ladder toward Oakstead. */
function rupeeSpots() {
  const out: { x: number; z: number }[] = [];
  const sx = TREE_LADDER.x + 1.2;
  const sz = TREE_LADDER.z + 3.4;
  const ex = VX - 6;
  const ez = VZ - 18;
  for (let i = 0; i < 8; i++) {
    const t = (i + 1) / 9;
    out.push({
      x: sx + (ex - sx) * t + Math.sin(i * 1.7) * 1.1,
      z: sz + (ez - sz) * t,
    });
  }
  return out;
}

const RUPEES = rupeeSpots();

function RupeeTrail() {
  const got = useRef<boolean[]>(RUPEES.map((_, i) => Boolean(live.smashed[`rupee-trail-${i}`])));
  const spin = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    spin.current += dt;
    RUPEES.forEach((p, i) => {
      if (got.current[i]) return;
      if (Math.hypot(live.x - p.x, live.z - p.z) < 0.85 && live.y < heightAt(p.x, p.z) + 1.8) {
        got.current[i] = true;
        pay(1, `rupee-trail-${i}`);
        puffAt(p.x, p.z, heightAt(p.x, p.z) + 0.6);
        sfx.chime();
        if (got.current.every(Boolean)) {
          pay(12, "rupee-trail-all");
          live.listen = "You followed the shine all the way. The vale likes that.";
        }
      }
    });
  });
  return (
    <group>
      {RUPEES.map((p, i) =>
        got.current[i] ? null : (
          <group key={i} position={[p.x, heightAt(p.x, p.z) + 0.55 + Math.sin(spin.current * 3 + i) * 0.08, p.z]} rotation={[0, spin.current * 2 + i, 0.2]}>
            <RupeeMesh tint="green" scale={0.85} />
          </group>
        ),
      )}
    </group>
  );
}

/** Four numbered stones. Hop 1-2-3-4. Wrong order resets. Physical math, no overlay. */
const HOPS: { n: number; x: number; z: number }[] = [
  { n: 1, x: TREE_LADDER.x + 6.2, z: TREE_LADDER.z + 14.4 },
  { n: 2, x: TREE_LADDER.x + 8.8, z: TREE_LADDER.z + 18.6 },
  { n: 3, x: TREE_LADDER.x + 6.0, z: TREE_LADDER.z + 22.8 },
  { n: 4, x: TREE_LADDER.x + 9.4, z: TREE_LADDER.z + 26.6 },
];

function HopStones() {
  const step = useRef(0);
  const done = useRef(Boolean(live.smashed.hopstones));
  const flash = useRef(0);
  const last = useRef(-1);
  useFrame((_, dt) => {
    flash.current = Math.max(0, flash.current - dt);
    if (live.house || done.current) return;
    for (const h of HOPS) addTrapSpot(h.x, h.z, 0.55, 0.22);
    for (const h of HOPS) {
      const d = Math.hypot(live.x - h.x, live.z - h.z);
      if (d < 0.7 && last.current !== h.n && live.grounded) {
        last.current = h.n;
        const need = step.current + 1;
        if (h.n === need) {
          step.current = h.n;
          sfx.ok();
          puffAt(h.x, h.z);
          if (h.n === 4) {
            done.current = true;
            pay(20, "hopstones");
            live.listen = "One, two, three, four. The stones liked being counted in order.";
            sfx.chime();
          }
        } else {
          step.current = h.n === 1 ? 1 : 0;
          last.current = h.n === 1 ? 1 : -1;
          flash.current = 0.45;
          sfx.miss();
        }
      }
    }
  });
  return (
    <group>
      {HOPS.map((h) => (
        <group key={h.n} position={[h.x, heightAt(h.x, h.z) + 0.12, h.z]}>
          <mesh>
            <cylinderGeometry args={[0.62, 0.7, 0.22, 8]} />
            <meshLambertMaterial color={done.current || step.current >= h.n ? "#c9a227" : flash.current > 0 ? "#a42828" : "#6a6458"} />
          </mesh>
          <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.22, 8]} />
            <meshBasicMaterial color={step.current >= h.n ? "#f4e878" : "#efe6d4"} />
          </mesh>
        </group>
      ))}
      {done.current ? (
        <group position={[HOPS[3]!.x + 1.6, heightAt(HOPS[3]!.x + 1.6, HOPS[3]!.z) + 0.45, HOPS[3]!.z]}>
          <RupeeMesh tint="gold" scale={1.1} />
        </group>
      ) : null}
    </group>
  );
}

/** A fang on the home path. Runs from you until you have a sword. Then it means it. */
function CowardFang() {
  const start = { x: TREE_LADDER.x + 10.4, z: TREE_LADDER.z + 32 };
  const p = useRef({ x: start.x, z: start.z, yaw: 0 });
  const dead = useRef(Boolean(live.smashed.pathfang));
  const g = useRef<THREE.Group>(null);
  const scare = useRef(false);
  useFrame((_, dt) => {
    if (live.house || dead.current) {
      if (g.current) g.current.visible = false;
      return;
    }
    const o = p.current;
    const dx = live.x - o.x;
    const dz = live.z - o.z;
    const d = Math.hypot(dx, dz);
    const armed = hasSword();
    if (!armed) {
      if (d < 7.5) {
        if (!scare.current) {
          scare.current = true;
          live.listen = live.listen || "It saw you. It did not like that. It ran.";
        }
        const away = d > 0.01 ? 1 / d : 1;
        o.x -= dx * away * 6.4 * dt;
        o.z -= dz * away * 6.4 * dt;
        o.yaw = Math.atan2(dx, dz);
      }
    } else if (d < 14) {
      if (d > 1.2) {
        o.x += (dx / d) * 3.6 * dt;
        o.z += (dz / d) * 3.6 * dt;
      }
      o.yaw = Math.atan2(-dx, -dz);
      live.aggroIds.add("pathfang");
      if (live.slash && Math.hypot(live.slash.x - o.x, live.slash.z - o.z) < (live.slash.r ?? 1.2) + 0.4) {
        dead.current = true;
        live.aggroIds.delete("pathfang");
        pay(8, "pathfang");
        puffAt(o.x, o.z, heightAt(o.x, o.z) + 0.8, true);
        live.listen = "It thought you still did not have a stick.";
        sfx.hit();
      }
    } else {
      live.aggroIds.delete("pathfang");
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
      <N64Nag />
    </group>
  );
}

/** Slash the hanging gourds. Kids love this. */
const GOURDS = [
  { x: VX - 10.4, z: VZ + 6.2 },
  { x: VX - 8.6, z: VZ + 7.4 },
  { x: VX - 6.8, z: VZ + 6.0 },
];

function GourdLine() {
  const pop = useRef(GOURDS.map((_, i) => Boolean(live.smashed[`gourd-${i}`])));
  useFrame(() => {
    if (live.house) return;
    GOURDS.forEach((g, i) => {
      if (pop.current[i]) return;
      const hit = live.slash && Math.hypot(live.slash.x - g.x, live.slash.z - g.z) < 1.5;
      const boom = live.lastBoom && Math.hypot(live.lastBoom.x - g.x, live.lastBoom.z - g.z) < 2.2;
      if (hit || boom) {
        pop.current[i] = true;
        pay(5, `gourd-${i}`);
        puffAt(g.x, g.z, heightAt(g.x, g.z) + 1.6);
        sfx.smash();
        if (pop.current.every(Boolean)) {
          pay(10, "gourd-all");
          live.listen = "Three gourds. Tess is going to be jealous.";
        }
      } else if (Math.hypot(live.x - g.x, live.z - g.z) < 3.2) {
        live.listen = live.listen || "Gourds on a string. They look smashable.";
      }
    });
  });
  return (
    <group>
      {GOURDS.map((g, i) => {
        const y = heightAt(g.x, g.z);
        return (
          <group key={i} position={[g.x, y, g.z]}>
            <mesh position={[0, 2.1, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 1.6, 5]} />
              <meshLambertMaterial color="#3a3228" />
            </mesh>
            {pop.current[i] ? null : (
              <mesh position={[0, 1.25, 0]} rotation={[0.2, i, 0.1]}>
                <sphereGeometry args={[0.28, 7, 6]} />
                <meshLambertMaterial color="#c47828" />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

/** After you have a sword, a dummy that teaches slash then spin. */
function DummyPost() {
  const hits = useRef(0);
  const spin = useRef(false);
  const x = 18.4;
  const z = -78.2;
  const wobble = useRef(0);
  useFrame((_, dt) => {
    wobble.current = Math.max(0, wobble.current - dt * 4);
    if (live.house || !hasSword()) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 8) live.listen = live.listen || (spin.current ? "The dummy had enough." : hits.current >= 3 ? "Hold Sword, then let go. A spin." : "The dummy. Hit it.");
    if (live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 1.6) {
      wobble.current = 1;
      if (live.spinning && !spin.current && hits.current >= 3) {
        spin.current = true;
        pay(15, "dummy-spin");
        live.listen = "The dummy fell in love with that spin. Then it fell over.";
        sfx.chime();
      } else if (!live.spinning && hits.current < 6) {
        hits.current += 1;
        if (hits.current === 3) {
          pay(6, "dummy-hits");
          live.listen = "Three hits. Now hold Sword until it hums, then let go.";
        }
      }
    }
  });
  const y = heightAt(x, z);
  if (spin.current) return null;
  return (
    <group position={[x, y, z]} rotation={[0, 0, wobble.current * 0.18]}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 1.4, 6]} />
        <meshLambertMaterial color="#5a3a20" />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.28, 7, 6]} />
        <meshLambertMaterial color="#8a6a40" />
      </mesh>
      <mesh position={[0, 1.55, 0.22]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.7, 0.12, 0.08]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

/** Gold tokens on tree bark. Slash to collect. */
const BUGS = [
  { x: TREE_TRUNK.x + 2.2, z: TREE_TRUNK.z + 8.4, y: 1.6 },
  { x: TREE_TRUNK.x - 4.8, z: TREE_TRUNK.z + 18.2, y: 2.1 },
  { x: VX - 22, z: VZ - 36, y: 1.8 },
  { x: VX + 16, z: VZ - 28, y: 2.0 },
  { x: WELL_AT.x - 8.4, z: WELL_AT.z + 10.2, y: 1.7 },
];

function GoldBugs() {
  const got = useRef(BUGS.map((_, i) => Boolean(live.smashed[`goldbug-${i}`])));
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (live.house) return;
    BUGS.forEach((b, i) => {
      if (got.current[i]) return;
      const d = Math.hypot(live.x - b.x, live.z - b.z);
      const hit = live.slash && Math.hypot(live.slash.x - b.x, live.slash.z - b.z) < 1.4 && live.y + 1.2 > heightAt(b.x, b.z) + b.y - 0.6;
      if (hit || (d < 0.9 && live.y > heightAt(b.x, b.z) + b.y - 0.5)) {
        got.current[i] = true;
        pay(8, `goldbug-${i}`);
        puffAt(b.x, b.z, heightAt(b.x, b.z) + b.y);
        sfx.chime();
        if (got.current.every(Boolean)) {
          pay(20, "goldbug-all");
          live.listen = "Five gold bugs. They were counting you too.";
        }
      } else if (d < 4.5) live.listen = live.listen || "Something gold on the bark. A swing would get it.";
    });
  });
  return (
    <group>
      {BUGS.map((b, i) =>
        got.current[i] ? null : (
          <mesh key={i} position={[b.x, heightAt(b.x, b.z) + b.y + Math.sin(t.current * 4 + i) * 0.06, b.z]}>
            <sphereGeometry args={[0.12, 6, 5]} />
            <meshLambertMaterial color="#e8d48a" emissive="#c9a227" emissiveIntensity={0.7} />
          </mesh>
        ),
      )}
    </group>
  );
}

/** Two fangs that actually hunt as a pair on the keep road. */
function KeepRoadPack() {
  const spots = useRef([
    { x: 10.4, z: 18.2, dead: Boolean(live.smashed.roadfang0) },
    { x: -8.2, z: 36.4, dead: Boolean(live.smashed.roadfang1) },
  ]);
  const gs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  useFrame((_, dt) => {
    if (live.house || !hasSword()) return;
    spots.current.forEach((o, i) => {
      if (o.dead) {
        live.aggroIds.delete(`roadfang${i}`);
        return;
      }
      const dx = live.x - o.x;
      const dz = live.z - o.z;
      const d = Math.hypot(dx, dz);
      if (d < 16 && d > 1.2) {
        o.x += (dx / d) * 3.2 * dt;
        o.z += (dz / d) * 3.2 * dt;
        live.aggroIds.add(`roadfang${i}`);
      } else if (d > 16) live.aggroIds.delete(`roadfang${i}`);
      if (live.slash && Math.hypot(live.slash.x - o.x, live.slash.z - o.z) < (live.slash.r ?? 1.2) + 0.35) {
        o.dead = true;
        live.aggroIds.delete(`roadfang${i}`);
        pay(8, `roadfang${i}`);
        puffAt(o.x, o.z, heightAt(o.x, o.z) + 0.7, true);
        sfx.hit();
      }
      const g = gs[i]!.current;
      if (g) {
        g.visible = !o.dead;
        g.position.set(o.x, heightAt(o.x, o.z), o.z);
        g.rotation.y = Math.atan2(-dx, -dz);
      }
    });
  });
  return (
    <group>
      {spots.current.map((_, i) => (
        <group key={i} ref={gs[i]} visible={false}>
          <N64Nag />
        </group>
      ))}
    </group>
  );
}
