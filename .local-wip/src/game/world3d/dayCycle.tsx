import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { WorldId } from "../types";
import { heightAt, TREE_TRUNK, POND, WELL_AT } from "./field";
import { live } from "./live";
import { FIRE_PIT, VX, VZ } from "./village";
import { FARM_AT, SMITH_AT } from "./townLife";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import {
  dayShift,
  plantOpen,
  moonDir,
  shadowTip,
  MOON_STONE,
  NIGHT_GLYPHS,
  woodsHunt,
} from "../dayNight";

function pay(n: number, key: string, listen?: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  if (n > 0) {
    const c = useGame.getState().addCoins(n);
    if (c > 0) revealItem("coin");
    sfx.ok();
  }
  if (listen) live.listen = listen;
}

export function DayCycle({ worldId }: { worldId: WorldId }) {
  if (worldId !== "meadow") {
    return (
      <group>
        <CycleAmbience />
        <PlayerLantern />
      </group>
    );
  }
  return (
    <group>
      <CycleAmbience />
      <PlayerLantern />
      <MoonShadowPuzzle />
      <NightGlyphs />
      <DayBees />
      <NightMoths />
      <NightStalkers />
      <WoodsHunt />
    </group>
  );
}

function CycleAmbience() {
  const next = useRef(2.4);
  const lastShift = useRef(dayShift());
  useFrame((_, dt) => {
    if (live.house || live.paused || live.cave || live.dungeon) return;
    const shift = dayShift();
    if (shift !== lastShift.current) {
      lastShift.current = shift;
      if (shift === "dawn") {
        sfx.rooster();
        live.banner = live.banner || "Dawn. The vale is waking.";
      } else if (shift === "day") {
        sfx.morning();
        live.banner = live.banner || "Morning. Oakstead is at work.";
      } else if (shift === "dusk") {
        sfx.crow();
        live.banner = live.banner || "Dusk. Lamps are coming on. Come home before the woods do.";
      } else {
        sfx.howl();
        live.banner = live.banner || "Night. The woods hunt. Stay near firelight.";
      }
    }
    next.current -= dt;
    if (next.current > 0) return;
    const dFire = Math.hypot(live.x - FIRE_PIT.x, live.z - FIRE_PIT.z);
    if (shift === "night") {
      next.current = 4.2 + Math.random() * 5.5;
      if (dFire < 14) sfx.cricket();
      else if (woodsHunt() && Math.random() < 0.45) sfx.hoot();
      else sfx.cricket();
    } else if (shift === "dawn") {
      next.current = 6 + Math.random() * 6;
      if (Math.random() < 0.5) sfx.chirp();
      else sfx.crow();
    } else if (shift === "day") {
      next.current = 7 + Math.random() * 8;
      if (plantOpen() > 0.6) sfx.chirp();
    } else {
      next.current = 5 + Math.random() * 5;
      sfx.crow();
    }
  });
  return null;
}

function PlayerLantern() {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (!ref.current) return;
    const on = live.dusk > 0.42 && !live.house && !live.dungeon;
    const nearFire = Math.hypot(live.x - FIRE_PIT.x, live.z - FIRE_PIT.z) < 6;
    const k = on ? (nearFire ? 0.55 : 1) : 0;
    ref.current.intensity = k * (1.65 + Math.sin(live.playT * 3.1) * 0.12);
    ref.current.visible = k > 0.02;
    ref.current.position.set(live.x + 0.35, live.y + 1.55, live.z + 0.2);
  });
  return <pointLight ref={ref} color="#ffc070" distance={11} intensity={0} />;
}

function MoonShadowPuzzle() {
  const stone = useRef<THREE.Group>(null);
  const shade = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    const night = live.night && !live.house;
    if (stone.current) stone.current.visible = true;
    const tip = shadowTip();
    const mx = (MOON_STONE.x + tip.x) * 0.5;
    const mz = (MOON_STONE.z + tip.z) * 0.5;
    const len = Math.hypot(tip.x - MOON_STONE.x, tip.z - MOON_STONE.z);
    const yaw = Math.atan2(tip.x - MOON_STONE.x, tip.z - MOON_STONE.z);
    if (shade.current) {
      shade.current.visible = night;
      shade.current.position.set(mx, heightAt(mx, mz) + 0.04, mz);
      shade.current.rotation.set(-Math.PI / 2, 0, yaw);
      shade.current.scale.set(0.85, len, 1);
    }
    const onPath = night && Math.hypot(live.x - tip.x, live.z - tip.z) < 1.2;
    if (glow.current) {
      glow.current.emissiveIntensity = night ? (onPath ? 1.4 : 0.35) : 0.04;
    }
    if (onPath) {
      live.hint = live.hint || "The moon laid a path. Stand in it.";
      pay(18, "moonpath", "The shadow touched you. A mark on the stone woke up.");
    } else if (night && Math.hypot(live.x - MOON_STONE.x, live.z - MOON_STONE.z) < 3.2) {
      live.listen = live.listen || "A standing stone. Its shadow moves when the moon does.";
    }
  });
  const y = heightAt(MOON_STONE.x, MOON_STONE.z);
  return (
    <group>
      <group ref={stone} position={[MOON_STONE.x, y, MOON_STONE.z]}>
        <mesh position={[0, 1.45, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.42, 2.9, 7]} />
          <meshLambertMaterial color="#6a6458" />
        </mesh>
        <mesh position={[0, 2.85, 0.12]} rotation={[0.2, 0.4, 0.1]}>
          <circleGeometry args={[0.22, 7]} />
          <meshStandardMaterial
            ref={glow}
            color="#c8d8ff"
            emissive="#9ad0ff"
            emissiveIntensity={0.04}
            toneMapped={false}
          />
        </mesh>
      </group>
      <mesh ref={shade} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#1a2238" transparent opacity={0.42} depthWrite={false} />
      </mesh>
    </group>
  );
}

function NightGlyphs() {
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const seen = useRef(0);
  useFrame(() => {
    const night = live.night && !live.house;
    let near = 0;
    NIGHT_GLYPHS.forEach((g, i) => {
      const m = mats.current[i];
      const d = Math.hypot(live.x - g.x, live.z - g.z);
      const on = night && d < 28;
      if (m) {
        m.opacity = on ? Math.min(1, 0.25 + (28 - d) * 0.04) : 0;
        m.emissiveIntensity = on ? 0.7 + Math.sin(live.playT * 2.4 + i) * 0.25 : 0;
      }
      if (night && d < 2.1) {
        near += 1;
        live.listen = live.listen || "A mark that only the night can hold.";
      }
    });
    if (night && near && seen.current < NIGHT_GLYPHS.length) {
      seen.current = Math.min(NIGHT_GLYPHS.length, seen.current + near);
    }
    if (seen.current >= 3 && !live.smashed.nightglyphs) {
      pay(12, "nightglyphs", "Three night marks. The vale keeps a fourth on the standing stone.");
    }
  });
  return (
    <group>
      {NIGHT_GLYPHS.map((g, i) => {
        const y = heightAt(g.x, g.z) + 0.08;
        return (
          <group key={g.id} position={[g.x, y, g.z]}>
            <mesh rotation={[-Math.PI / 2, 0, i * 0.7]}>
              <ringGeometry args={[0.18, 0.32, 6]} />
              <meshStandardMaterial
                ref={(el) => {
                  mats.current[i] = el;
                }}
                color="#b8e0ff"
                emissive="#7ec8ff"
                emissiveIntensity={0}
                transparent
                opacity={0}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function DayBees() {
  const bits = useRef(
    Array.from({ length: 7 }, (_, i) => ({
      x: FARM_AT.x + (i % 3) * 1.6,
      z: FARM_AT.z + Math.floor(i / 3) * 1.4,
      a: i * 1.1,
      y: 0.7,
    })),
  );
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const open = plantOpen();
    const on = open > 0.35 && !live.house && !live.night;
    if (g.current) g.current.visible = on;
    if (!on) return;
    bits.current.forEach((b, i) => {
      b.a += dt * (1.6 + (i % 3) * 0.4);
      b.x += Math.cos(b.a) * dt * 0.7;
      b.z += Math.sin(b.a * 0.8) * dt * 0.7;
      b.y = 0.55 + Math.sin(b.a * 2.2) * 0.22;
      const ch = g.current?.children[i];
      if (ch) ch.position.set(b.x, heightAt(b.x, b.z) + b.y, b.z);
    });
    if (Math.hypot(live.x - FARM_AT.x, live.z - FARM_AT.z) < 8)
      live.listen = live.listen || "Bees. The rows are open.";
  });
  return (
    <group ref={g} visible={false}>
      {bits.current.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.045, 5, 4]} />
          <meshBasicMaterial color={i % 2 ? "#f0d060" : "#2a2418"} />
        </mesh>
      ))}
    </group>
  );
}

function NightMoths() {
  const lamps = useMemo(
    () => [
      { x: VX + 4.8, z: VZ + 10.2 },
      { x: VX - 5.2, z: VZ + 8.4 },
      { x: SMITH_AT.x - 1.2, z: SMITH_AT.z + 8.4 },
      { x: FIRE_PIT.x, z: FIRE_PIT.z },
      { x: WELL_AT.x, z: WELL_AT.z },
    ],
    [],
  );
  const bits = useRef(
    lamps.flatMap((l, i) =>
      [0, 1].map((k) => ({
        x: l.x + k * 0.3,
        z: l.z,
        a: i + k,
        ox: l.x,
        oz: l.z,
        y: 2.1,
      })),
    ),
  );
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const on = live.night && !live.house;
    if (g.current) g.current.visible = on;
    if (!on) return;
    bits.current.forEach((b, i) => {
      b.a += dt * 2.2;
      b.x = b.ox + Math.cos(b.a) * 0.55;
      b.z = b.oz + Math.sin(b.a * 1.3) * 0.55;
      b.y = 1.7 + Math.sin(b.a * 2.6) * 0.35;
      const ch = g.current?.children[i];
      if (ch) ch.position.set(b.x, heightAt(b.x, b.z) + b.y, b.z);
    });
  });
  return (
    <group ref={g} visible={false}>
      {bits.current.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.035, 5, 4]} />
          <meshBasicMaterial color="#e8e0d0" />
        </mesh>
      ))}
    </group>
  );
}

function NightStalkers() {
  const packs = useRef(
    Array.from({ length: 3 }, (_, i) => ({
      a: i * 2.1,
      r: 16 + i * 5,
      x: TREE_TRUNK.x,
      z: TREE_TRUNK.z,
    })),
  );
  const gs = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, dt) => {
    const on = live.night && !live.house;
    packs.current.forEach((p, i) => {
      const g = gs.current[i];
      if (!g) return;
      if (!on) {
        g.visible = false;
        return;
      }
      p.a += dt * (0.18 + i * 0.04);
      p.x = TREE_TRUNK.x + Math.cos(p.a) * p.r;
      p.z = TREE_TRUNK.z + Math.sin(p.a) * p.r;
      const d = Math.hypot(live.x - p.x, live.z - p.z);
      if (d < 9) {
        p.r = Math.min(28, p.r + dt * 4);
      }
      g.visible = d > 4.5 && d < 36;
      g.position.set(p.x, heightAt(p.x, p.z) + 0.35, p.z);
      g.rotation.y = p.a + Math.PI / 2;
      if (d < 14 && d > 7) live.listen = live.listen || "Something gray is circling the trees. It does not like the square.";
    });
  });
  return (
    <group>
      {packs.current.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            gs.current[i] = el;
          }}
          visible={false}
        >
          <mesh scale={[1.4, 0.7, 0.55]} castShadow>
            <sphereGeometry args={[0.28, 6, 5]} />
            <meshLambertMaterial color="#1a1816" />
          </mesh>
          <mesh position={[0.28, 0.12, 0]} scale={[0.7, 0.55, 0.5]}>
            <sphereGeometry args={[0.18, 5, 4]} />
            <meshLambertMaterial color="#1a1816" />
          </mesh>
          <mesh position={[0.34, 0.16, 0.08]}>
            <sphereGeometry args={[0.03, 4, 4]} />
            <meshBasicMaterial color="#c42828" />
          </mesh>
          <mesh position={[0.34, 0.16, -0.08]}>
            <sphereGeometry args={[0.03, 4, 4]} />
            <meshBasicMaterial color="#c42828" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function WoodsHunt() {
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (!woodsHunt()) {
      live.nightCreep = false;
      return;
    }
    live.nightCreep = true;
    live.nightFang = true;
    if (Math.abs(live.speed) > 8 && cool.current <= 0) {
      cool.current = 7;
      live.listen = "Don't run. The woods like the sound.";
    } else if (cool.current <= 0 && Math.hypot(live.x - POND.x, live.z - POND.z) > 12) {
      cool.current = 11;
      live.listen = live.listen || "The lane is wrong after dark. Firelight is a promise.";
    }
  });
  return null;
}

export function SkyMoon() {
  const ref = useRef<THREE.Group>(null);
  const shade = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  useFrame(() => {
    if (!ref.current) return;
    if (live.house || live.dungeon || live.cave) {
      ref.current.visible = false;
      return;
    }
    const m = moonDir();
    const up = m.y;
    if (up < 0.08 && !live.night) {
      ref.current.visible = false;
      return;
    }
    const dist = 165;
    ref.current.position.set(
      camera.position.x + m.x * dist,
      camera.position.y + Math.max(18, m.y * 90 + 24),
      camera.position.z + m.z * dist,
    );
    ref.current.visible = live.dusk > 0.28;
    if (shade.current) {
      const phase = Math.sin(live.day * Math.PI * 4);
      shade.current.position.x = phase * 0.85;
    }
  });
  return (
    <group ref={ref} visible={false}>
      <mesh>
        <sphereGeometry args={[6.4, 16, 12]} />
        <meshBasicMaterial color="#f4eed8" fog={false} />
      </mesh>
      <mesh ref={shade} position={[0.7, 0.1, 0.4]} scale={[0.82, 0.95, 0.9]}>
        <sphereGeometry args={[5.6, 14, 10]} />
        <meshBasicMaterial color="#1a2238" fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[9.2, 12, 8]} />
        <meshBasicMaterial color="#d8e4ff" transparent opacity={0.14} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}

export function SkySun() {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();
  useFrame(() => {
    if (!ref.current) return;
    if (live.house || live.dungeon || live.cave || live.dusk > 0.92) {
      ref.current.visible = false;
      return;
    }
    const a = live.day * Math.PI * 2;
    const elev = Math.sin(a);
    if (elev < 0.04) {
      ref.current.visible = false;
      return;
    }
    const pitch = 0.28 + elev * 0.95;
    const dist = 175;
    ref.current.position.set(
      camera.position.x + Math.cos(a) * dist * Math.cos(pitch),
      camera.position.y + Math.sin(pitch) * dist,
      camera.position.z + Math.sin(a) * dist * Math.cos(pitch),
    );
    ref.current.visible = live.dusk < 0.85;
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[8.4, 16, 12]} />
        <meshBasicMaterial color="#ffe08a" fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[12.2, 12, 8]} />
        <meshBasicMaterial color="#ffd060" transparent opacity={0.2} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}
