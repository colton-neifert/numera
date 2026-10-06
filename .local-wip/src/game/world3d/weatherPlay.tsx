import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WorldId } from "../types";
import { heightAt } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { sfx } from "../audio";
import { useGame } from "../store";
import { N64Foe, type FangPose } from "./n64";
import { puffAt } from "./fx";
import { takeCipher, hasCipher } from "../cipher";
import { DRY_BED } from "./lands";
import {
  weather,
  tickWeather,
  stormOn,
  fogAmt,
  localPrecip,
  streamFlow,
  STORM_STONE,
  WOOD_MARKS,
  FOG_BANKS,
} from "../weather";

export function WeatherPlay({ worldId }: { worldId: WorldId }) {
  const meadow = worldId === "meadow";
  return (
    <group>
      <WeatherDirector />
      <SkyClouds />
      <RainFall />
      <SnowFall />
      <StormFlash />
      {meadow ? (
        <>
          <DryCreek />
          <FogBanks />
          <WoodMarks />
          <StormFangs />
          <LightningStone />
        </>
      ) : null}
    </group>
  );
}

function WeatherDirector() {
  const lastFlash = useRef(0);
  useFrame((_, dt) => {
    tickWeather(dt);
    if (weather.flash > 0.85 && live.playT - lastFlash.current > 0.4) {
      lastFlash.current = live.playT;
      sfx.thunder();
    }
  });
  return null;
}

function SkyClouds() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const n = live.quality === "low" ? 10 : 16;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        ox: (i % 5) * 22 - 44,
        oz: Math.floor(i / 5) * 24 - 36,
        y: 26 + (i % 4) * 3.4,
        s: 6.5 + (i % 3) * 2.2,
        spin: i * 0.7,
      })),
    [],
  );
  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const hide = live.house || live.below || live.dungeon || live.cave;
    mesh.visible = !hide && weather.cloud > 0.12;
    if (!mesh.visible) return;
    const wind = 2.2 + weather.rain * 3.4 + live.windT * 4;
    const a = weather.cloud;
    for (let i = 0; i < n; i++) {
      const c = seeds[i]!;
      c.spin += dt * 0.08;
      dummy.position.set(
        live.x + c.ox + Math.sin(c.spin + i) * 6,
        live.y + c.y,
        live.z + c.oz + Math.cos(c.spin * 0.7) * 5,
      );
      dummy.position.x += ((live.playT * wind) % 90) - 45;
      dummy.scale.setScalar(c.s * (0.7 + a * 0.5));
      dummy.rotation.set(0.1, c.spin, 0.08);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    const mat = mesh.material as THREE.MeshLambertMaterial;
    mat.opacity = 0.22 + a * 0.45;
    mat.color.set(weather.kind === "storm" ? "#6a7884" : weather.kind === "rain" ? "#8a98a4" : "#e8eef4");
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]} frustumCulled={false} visible={false}>
      <sphereGeometry args={[1, 6, 5]} />
      <meshLambertMaterial color="#e8eef4" transparent opacity={0.4} depthWrite={false} />
    </instancedMesh>
  );
}

function RainFall() {
  const ref = useRef<THREE.Points>(null);
  const n = live.quality === "low" ? 280 : 560;
  const geo = useMemo(() => {
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      a[i * 3] = (Math.random() - 0.5) * 48;
      a[i * 3 + 1] = Math.random() * 18;
      a[i * 3 + 2] = (Math.random() - 0.5) * 48;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return g;
  }, [n]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const p = localPrecip();
    const on = p.rain > 0.12 && !live.house && !live.below && !live.dungeon;
    ref.current.visible = on;
    if (!on) return;
    ref.current.position.set(live.x, live.y, live.z);
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const fall = 16 + p.rain * 14 + weather.storm * 8;
    const drift = weather.storm * 8 + live.windT * 6;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - dt * fall;
      let x = pos.getX(i) + dt * drift;
      if (y < 0) {
        y = 14 + Math.random() * 6;
        x = (Math.random() - 0.5) * 48;
        pos.setZ(i, (Math.random() - 0.5) * 48);
      }
      if (x > 24) x -= 48;
      pos.setX(i, x);
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = 0.28 + p.rain * 0.45;
    mat.size = weather.storm > 0.4 ? 0.09 : 0.065;
  });
  return (
    <points ref={ref} geometry={geo} frustumCulled={false} visible={false}>
      <pointsMaterial color="#c8dce8" size={0.07} transparent opacity={0.5} depthWrite={false} />
    </points>
  );
}

function SnowFall() {
  const ref = useRef<THREE.Points>(null);
  const n = live.quality === "low" ? 220 : 400;
  const geo = useMemo(() => {
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      a[i * 3] = (Math.random() - 0.5) * 44;
      a[i * 3 + 1] = Math.random() * 16;
      a[i * 3 + 2] = (Math.random() - 0.5) * 44;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return g;
  }, [n]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const p = localPrecip();
    const on = p.snow > 0.2 && !live.house && !live.below && !live.dungeon;
    ref.current.visible = on;
    if (!on) return;
    ref.current.position.set(live.x, live.y, live.z);
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const fall = 2.4 + p.snow * 2.2;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - dt * fall;
      let x = pos.getX(i) + Math.sin(live.playT * 0.7 + i) * dt * 0.8;
      if (y < 0) {
        y = 12 + Math.random() * 6;
        x = (Math.random() - 0.5) * 44;
        pos.setZ(i, (Math.random() - 0.5) * 44);
      }
      pos.setX(i, x);
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = 0.4 + p.snow * 0.4;
  });
  return (
    <points ref={ref} geometry={geo} frustumCulled={false} visible={false}>
      <pointsMaterial color="#f4f8ff" size={0.11} transparent opacity={0.7} depthWrite={false} />
    </points>
  );
}

function StormFlash() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const on = weather.flash > 0.05 && !live.house && !live.below;
    ref.current.visible = on;
    if (!on) return;
    ref.current.position.set(live.x, live.y + 18, live.z - 8);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = weather.flash * 0.42;
  });
  return (
    <mesh ref={ref} visible={false} frustumCulled={false}>
      <planeGeometry args={[80, 48]} />
      <meshBasicMaterial color="#e8f0ff" transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function DryCreek() {
  const segs = useMemo(() => {
    const out: { x: number; z: number; yaw: number; len: number; y: number; w: number }[] = [];
    for (let i = 0; i < DRY_BED.length - 1; i++) {
      const a = DRY_BED[i]!;
      const b = DRY_BED[i + 1]!;
      const x = (a[0] + b[0]) * 0.5;
      const z = (a[1] + b[1]) * 0.5;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len = Math.hypot(dx, dz);
      out.push({
        x,
        z,
        yaw: Math.atan2(dx, dz),
        len,
        y: Math.min(heightAt(x, z), heightAt(a[0], a[1]), heightAt(b[0], b[1])) + 0.04,
        w: 4.2,
      });
    }
    return out;
  }, []);
  const water = useRef<(THREE.Mesh | null)[]>([]);
  const told = useRef(false);
  useFrame(() => {
    const on = streamFlow();
    for (const m of water.current) {
      if (!m) continue;
      m.visible = on;
      const mat = m.material as THREE.MeshLambertMaterial;
      mat.opacity = 0.35 + live.dryFlow * 0.5;
    }
    if (on && !told.current && dryNear()) {
      told.current = true;
      live.listen = live.listen || "The dry cut is a creek. It was waiting for the sky.";
    }
    if (!on) told.current = false;
  });
  return (
    <group>
      {segs.map((s, i) => (
        <group key={i} position={[s.x, s.y, s.z]} rotation={[0, s.yaw, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[s.w, s.len + 0.8]} />
            {lamb("#6a5438", { kind: "dirt" })}
          </mesh>
          <mesh
            ref={(el) => {
              water.current[i] = el;
            }}
            position={[0, 0.05, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
          >
            <planeGeometry args={[s.w * 0.72, s.len + 0.4]} />
            <meshLambertMaterial color="#2e6a58" transparent opacity={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function dryNear() {
  const a = DRY_BED[0]!;
  const b = DRY_BED[DRY_BED.length - 1]!;
  const mx = (a[0] + b[0]) * 0.5;
  const mz = (a[1] + b[1]) * 0.5;
  return Math.hypot(live.x - mx, live.z - mz) < 18;
}

function FogBanks() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const f = fogAmt();
    const hide = live.house || live.below || f < 0.18;
    for (let i = 0; i < FOG_BANKS.length; i++) {
      const m = refs.current[i];
      const b = FOG_BANKS[i]!;
      if (!m) continue;
      m.visible = !hide;
      if (hide) continue;
      m.position.set(b.x, heightAt(b.x, b.z) + 4.2, b.z);
      const mat = m.material as THREE.MeshLambertMaterial;
      mat.opacity = 0.22 + f * 0.5;
      m.scale.setScalar(b.r * (0.85 + Math.sin(live.playT * 0.4 + i) * 0.08));
    }
  });
  return (
    <group>
      {FOG_BANKS.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[b.x, 6, b.z]}
          visible={false}
          frustumCulled={false}
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshLambertMaterial color="#d0d8dc" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function WoodMarks() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const told = useRef(false);
  useFrame(() => {
    const hidden = fogAmt() > 0.42;
    for (const g of refs.current) {
      if (g) g.visible = !hidden && !live.house;
    }
    if (hidden && !told.current && Math.hypot(live.x + 380, live.z + 72) < 18) {
      told.current = true;
      live.listen = live.listen || "The trail stones hid. The woods kept them.";
    }
    if (!hidden) told.current = false;
  });
  return (
    <group>
      {WOOD_MARKS.map((m, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[m.x, heightAt(m.x, m.z), m.z]}
        >
          <mesh position={[0, 0.16, 0]} castShadow>
            <boxGeometry args={[0.42, 0.32, 0.28]} />
            {lamb("#7a6a50", { kind: "stone" })}
          </mesh>
          <mesh position={[0, 0.38, 0.02]}>
            <sphereGeometry args={[0.07, 6, 5]} />
            <meshLambertMaterial color="#c9a227" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const STORM_SPOTS = [
  { id: "storm-e0", x: -28, z: -40 },
  { id: "storm-e1", x: 54, z: -96 },
  { id: "storm-e2", x: -372, z: -68 },
];

function StormFangs() {
  const on = useRef(false);
  const [show, setShow] = useState(false);
  useFrame(() => {
    const v = stormOn() && !live.house && !live.below;
    if (v !== on.current) {
      on.current = v;
      setShow(v);
      if (v) live.hint = live.hint || "Storm things. Gray, in the grass.";
      else {
        for (const s of STORM_SPOTS) delete live.foeTrack[s.id];
        delete live.foeTrack["storm-hunt"];
      }
    }
  });
  if (!show) return null;
  return (
    <group>
      {STORM_SPOTS.map((s, i) => (
        <StormBody key={s.id} id={s.id} ox={s.x} oz={s.z} seed={30 + i} />
      ))}
      <StormBody id="storm-hunt" ox={0} oz={0} seed={41} hunt />
    </group>
  );
}

function StormBody({
  id,
  ox,
  oz,
  seed,
  hunt,
}: {
  id: string;
  ox: number;
  oz: number;
  seed: number;
  hunt?: boolean;
}) {
  const g = useRef<THREE.Group>(null);
  const pos = useRef({ x: ox, z: oz });
  const yaw = useRef(0);
  const pose = useRef<FangPose>("walk");
  const hp = useRef(3);
  const swipeAt = useRef(-9);
  const born = useRef(false);
  useFrame((_, dt) => {
    if (!g.current) return;
    if (!born.current) {
      born.current = true;
      if (hunt) {
        const a = Math.random() * Math.PI * 2;
        pos.current.x = live.x + Math.cos(a) * 14;
        pos.current.z = live.z + Math.sin(a) * 14;
      } else {
        pos.current.x = ox;
        pos.current.z = oz;
      }
    }
    if (!stormOn() || hp.current <= 0) {
      g.current.visible = false;
      delete live.foeTrack[id];
      return;
    }
    g.current.visible = Math.hypot(live.x - pos.current.x, live.z - pos.current.z) < 90;
    const dx = live.x - pos.current.x;
    const dz = live.z - pos.current.z;
    const d = Math.hypot(dx, dz);
    if (d < 16) live.aggroIds.add(id);
    else live.aggroIds.delete(id);
    const hitAgo = live.playT - (live.foeHitT[id] ?? -9);
    if (d < 18 && d > 1.2) {
      const spd = hunt ? 3.4 : 2.6;
      pos.current.x += (dx / d) * spd * dt;
      pos.current.z += (dz / d) * spd * dt;
      yaw.current = Math.atan2(-dx, -dz);
      pose.current = d < 4 ? "chase" : "walk";
    }
    if (live.slash && Math.hypot(live.slash.x - pos.current.x, live.slash.z - pos.current.z) < (live.slash.r ?? 1.2)) {
      if (hitAgo > 0.35) {
        hp.current -= live.spinning || live.jumpAtk ? 2 : 1;
        live.foeHitT[id] = live.playT;
        puffAt(pos.current.x, pos.current.z);
        sfx.hit();
        if (hp.current <= 0) {
          useGame.getState().addCoins(4);
          live.hint = "The storm thing fell. The sky did not.";
          live.aggroIds.delete(id);
          delete live.foeTrack[id];
          if (live.lock?.id === id) live.lock = null;
          sfx.ok();
          g.current.visible = false;
          return;
        }
      }
    }
    if (d < 1.28 && !live.god && live.heroFlash < 0.22 && hitAgo > 0.2 && live.playT - swipeAt.current > 0.95) {
      swipeAt.current = live.playT;
      pose.current = "swipe";
      if (live.shieldUp && useGame.getState().hasShield) sfx.block();
      else {
        useGame.getState().hurtField(2);
        if (d > 0.001) live.knock = { vx: (dx / d) * 8.2, vz: (dz / d) * 8.2, t: 0.2 };
      }
    }
    if (live.playT - swipeAt.current < 0.35) pose.current = "swipe";
    live.foeTrack[id] = { x: pos.current.x, z: pos.current.z };
    g.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z), pos.current.z);
    g.current.rotation.y = yaw.current;
  });
  return (
    <group ref={g} visible={false}>
      <N64Foe kind="plusling" seed={seed} pose="walk" poseRef={pose} world="grave" />
    </group>
  );
}

function LightningStone() {
  const glow = useRef<THREE.Mesh>(null);
  const taken = useRef(hasCipher("storm-flash"));
  const saw = useRef(false);
  const y = heightAt(STORM_STONE.x, STORM_STONE.z);
  useFrame(() => {
    if (!glow.current) return;
    const flash = weather.flash > 0.28;
    glow.current.visible = flash || (taken.current && weather.kind === "storm");
    const mat = glow.current.material as THREE.MeshLambertMaterial;
    mat.emissiveIntensity = flash ? 1.4 : 0.25;
    if (taken.current || live.house) return;
    const d = Math.hypot(live.x - STORM_STONE.x, live.z - STORM_STONE.z);
    if (flash && d < 9) {
      if (!saw.current) {
        saw.current = true;
        live.listen = "A four on the stone. The sky wrote it. Then it was gone.";
      }
      if (d < 2.2) {
        taken.current = true;
        takeCipher("storm-flash", true);
      }
    }
  });
  return (
    <group position={[STORM_STONE.x, y, STORM_STONE.z]}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.62, 1.42, 0.28]} />
        {lamb("#5a544c", { kind: "stone" })}
      </mesh>
      <mesh ref={glow} position={[0, 0.92, 0.16]} visible={false}>
        <planeGeometry args={[0.28, 0.42]} />
        <meshLambertMaterial color="#d8e8ff" emissive="#c8d8f4" emissiveIntensity={0} transparent opacity={0.92} />
      </mesh>
    </group>
  );
}
