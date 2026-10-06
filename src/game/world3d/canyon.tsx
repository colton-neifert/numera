import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { waterMaterial } from "./lush/water";
import { useGame } from "../store";
import { sfx } from "../audio";
import { DECK, N_WALL, RIVER_Z, S_WALL, WALL_HALF, canyonLift } from "./canyonData";

function openAt(x: number, north: boolean) {
  if (Math.abs(x) < 8) return true;
  if (north && Math.abs(x + 180) < 8) return true;
  if (!north && Math.abs(x + 120) < 7) return true;
  if (!north && Math.abs(x - 170) < 6) return true;
  return false;
}

function Cliffs() {
  const rock = useRef<THREE.InstancedMesh>(null);
  const moss = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const pieces = useMemo(() => {
    const out: { x: number; y: number; z: number; sy: number; north: boolean }[] = [];
    for (const north of [true, false]) {
      const z = north ? N_WALL : S_WALL;
      for (let x = -390; x <= 390; x += 14) {
        if (openAt(x, north)) continue;
        const j = Math.sin(x * 0.11 + (north ? 1 : 2)) * 0.5 + 0.5;
        const sy = 36 + j * 12;
        out.push({ x, y: heightAt(x, z) + sy * 0.5, z, sy, north });
        out.push({
          x,
          y: heightAt(x, z) + sy - 2,
          z: z + (north ? 8 : -8),
          sy: 7,
          north,
        });
      }
    }
    return out;
  }, []);
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    pieces.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(15, p.sy, WALL_HALF * 2.1);
      dummy.updateMatrix();
      rock.current?.setMatrixAt(i, dummy.matrix);
      dummy.position.y = p.y + p.sy * 0.15;
      dummy.scale.set(p.north && i % 4 === 0 ? 4 : 0.01, 1.2, 1.2);
      dummy.updateMatrix();
      moss.current?.setMatrixAt(i, dummy.matrix);
    });
    if (rock.current) rock.current.instanceMatrix.needsUpdate = true;
    if (moss.current) moss.current.instanceMatrix.needsUpdate = true;
  }, [pieces]);
  return (
    <group>
      <instancedMesh ref={rock} args={[geo, undefined, Math.max(1, pieces.length)]} frustumCulled={false} receiveShadow>
        {lamb("#7a624c", { kind: "stone" })}
      </instancedMesh>
      <instancedMesh ref={moss} args={[geo, undefined, Math.max(1, pieces.length)]} frustumCulled={false}>
        {lamb("#3f6a32")}
      </instancedMesh>
    </group>
  );
}

function waterStrip(x0: number, x1: number, z: number, w: number) {
  const g = new THREE.PlaneGeometry(Math.abs(x1 - x0), w, 18, 1);
  g.rotateX(-Math.PI / 2);
  const edge = new Float32Array(g.attributes.position.count);
  edge.fill(0.25);
  g.setAttribute("aEdge", new THREE.BufferAttribute(edge, 1));
  return { g, x: (x0 + x1) / 2, z };
}

function Bridge() {
  const slabs = [];
  for (let z = N_WALL + 16; z >= S_WALL - 16; z -= 3.2) {
    const lift = canyonLift(0, z);
    if (lift < 0.4) continue;
    const top = heightAt(0, z);
    slabs.push({ z, y: top - 0.16, broken: z < -286 && z > -294 });
  }
  const y0 = heightAt(6, RIVER_Z);
  return (
    <group>
      {slabs.map((s, i) => (
        <group key={i} position={[0, s.y, s.z]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[s.broken ? 4.2 : 6.4, 0.4, 3.3]} />
            {lamb(i % 5 === 0 ? "#a09078" : "#8a7b68", { kind: "stone" })}
          </mesh>
          {s.broken ? null : (
            <>
              <mesh position={[-3.5, 0.55, 0]}>
                <boxGeometry args={[0.35, 0.7, 2.4]} />
                {lamb("#6e624e", { kind: "stone" })}
              </mesh>
              <mesh position={[3.5, 0.55, 0]}>
                <boxGeometry args={[0.35, 0.7, 2.4]} />
                {lamb("#6e624e", { kind: "stone" })}
              </mesh>
            </>
          )}
          {i % 7 === 2 ? (
            <mesh position={[2.2, 0.7, 0]}>
              <boxGeometry args={[0.5, 0.35, 0.15]} />
              {lamb("#c4a060")}
            </mesh>
          ) : null}
        </group>
      ))}
      {[-276, -289, -302].map((z) => (
        <group key={z}>
          {[-5.6, 5.6].map((x) => (
            <mesh key={x} position={[x, y0 + DECK * 0.45, z]} castShadow>
              <boxGeometry args={[1.5, DECK * 0.9, 1.6]} />
              {lamb("#6a5a48", { kind: "stone" })}
            </mesh>
          ))}
          <mesh position={[0, y0 + 6.2, z]}>
            <boxGeometry args={[10, 1.4, 1.3]} />
            {lamb("#5c4e40", { kind: "stone" })}
          </mesh>
        </group>
      ))}
    </group>
  );
}

function River() {
  const strips = useMemo(() => [waterStrip(-250, -20, RIVER_Z, 4.2), waterStrip(20, 175, RIVER_Z, 3.6)], []);
  const y = heightAt(0, RIVER_Z) + 0.12;
  return (
    <group>
      {strips.map((s, i) => (
        <mesh key={i} geometry={s.g} position={[s.x, y, s.z]} material={waterMaterial()} />
      ))}
      {[-210, -150, -100, 40, 90, 140].map((x) => (
        <mesh key={x} position={[x, y + 0.2, RIVER_Z + (x % 2 ? 0.8 : -0.6)]} castShadow>
          <dodecahedronGeometry args={[0.55, 0]} />
          {lamb("#6a6058", { kind: "stone" })}
        </mesh>
      ))}
    </group>
  );
}

function Falls() {
  const x = -240;
  const z = N_WALL - WALL_HALF - 1;
  const y = heightAt(x, z);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(5, 12, 1, 6);
    const edge = new Float32Array(g.attributes.position.count);
    edge.fill(0.15);
    g.setAttribute("aEdge", new THREE.BufferAttribute(edge, 1));
    return g;
  }, []);
  return (
    <group>
      <mesh geometry={geo} position={[x, y + 6, z]} material={waterMaterial()} />
      <mesh position={[x, y + 0.15, RIVER_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.2, 14]} />
        {lamb("#2a7090")}
      </mesh>
      <mesh position={[x, y + 1.6, N_WALL - WALL_HALF + 0.6]}>
        <boxGeometry args={[3.6, 3.2, 2.2]} />
        {lamb("#141210")}
      </mesh>
      <mesh position={[x, y + 0.45, N_WALL - WALL_HALF + 0.2]}>
        <octahedronGeometry args={[0.4, 0]} />
        {lamb("#7ec8e8", { emissive: "#9ad8f0", emit: 0.5 })}
      </mesh>
    </group>
  );
}

function Shelf() {
  const pads = [];
  for (let x = -200; x <= -70; x += 6) {
    const z = N_WALL - WALL_HALF - 1.8;
    const lift = canyonLift(x, z);
    const top = heightAt(x, z);
    const h = Math.max(0.4, lift);
    pads.push({ x, z, y: top - lift + h * 0.5, h });
  }
  return (
    <group>
      {pads.map((p, i) => (
        <group key={i} position={[p.x, heightAt(p.x, p.z) - 0.15, p.z]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[6.2, 0.35, 2.8]} />
            {lamb("#6a5640", { kind: "stone" })}
          </mesh>
          <mesh position={[0, 1.6, -0.9]}>
            <boxGeometry args={[0.35, 3.2, 0.28]} />
            {lamb(i % 2 ? "#2a6a30" : "#3e8a42")}
          </mesh>
          <mesh position={[1.1, 2.2, -0.9]}>
            <boxGeometry args={[0.4, 0.16, 0.24]} />
            {lamb("#4aaa48")}
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Life() {
  const bird = useRef<THREE.Group>(null);
  const flee = useRef<THREE.Group>(null);
  const home = useRef({ x: -150, z: RIVER_Z + 5 });
  const guard = useRef(0);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (bird.current) {
      bird.current.position.set(-30 + Math.sin(t * 0.6) * 18, heightAt(-30, RIVER_Z) + 16 + Math.sin(t * 3) * 0.4, RIVER_Z);
    }
    if (flee.current) {
      const d = Math.hypot(live.x - home.current.x, live.z - home.current.z);
      if (d < 4) home.current.x += Math.sign(home.current.x - live.x) * dt * 4;
      flee.current.position.set(home.current.x, heightAt(home.current.x, home.current.z), home.current.z);
    }
    guard.current -= dt;
    if (guard.current <= 0 && canyonLift(live.x, live.z) > 8 && Math.abs(live.x) < 2.2 && live.z < N_WALL && live.z > S_WALL) {
      guard.current = 1.5;
      const g = useGame.getState();
      useGame.setState({ hp: Math.max(1, (g.hp ?? 4) - 1) });
      live.banner = "Something on the bridge snaps at you.";
    }
  });
  const y = heightAt(-150, RIVER_Z + 5);
  return (
    <group>
      <group ref={bird}>
        <mesh>
          <boxGeometry args={[0.7, 0.08, 0.28]} />
          {lamb("#d8e4ee")}
        </mesh>
      </group>
      <group ref={flee} position={[-150, y, RIVER_Z + 5]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.35, 0.22, 0.55]} />
          {lamb("#c4a060")}
        </mesh>
      </group>
      <mesh position={[12, heightAt(12, RIVER_Z) + 0.3, RIVER_Z + 4]}>
        <boxGeometry args={[0.8, 0.28, 1.1]} />
        {lamb("#4a6a38")}
      </mesh>
    </group>
  );
}

export function stepCanyon(talk: boolean) {
  if (!talk || live.bazaar) return false;
  if (Math.hypot(live.x - 10, live.z - (S_WALL - 24)) < 2.3) {
    live.banner = "The old bridge hasn't been crossed safely in years.";
    return true;
  }
  return false;
}

export function Canyon() {
  const step = useRef(0);
  const on = useRef(-1);
  const slab = useRef<THREE.Mesh>(null);
  const rock = useRef<THREE.Mesh>(null);
  const got = useRef(false);
  const gotCave = useRef(false);
  const saw = useRef(false);
  useFrame(() => {
    const q = useGame.getState().quests;
    const up = Boolean(q?.canyonSlab);
    if (slab.current) slab.current.position.y = heightAt(-40, RIVER_Z) + (up ? 0.35 : -1.2);
    if (rock.current) rock.current.visible = !up;
    if (!saw.current && live.z < S_WALL - 10 && Math.abs(live.x) < 8) {
      saw.current = true;
      if (!q?.sawCanyonFar) {
        useGame.getState().setQuest("sawCanyonFar", 1);
        live.banner = "The far side of the gorge.";
        live.objective = "The bridge brought you somewhere greener.";
        sfx.chime();
      }
    }
    if (!gotCave.current && Math.hypot(live.x + 240, live.z - (N_WALL - WALL_HALF)) < 2.2 && !q?.canyonGem) {
      gotCave.current = true;
      useGame.getState().setQuest("canyonGem", 1);
      useGame.getState().addCoins(16);
      live.banner = "Behind the waterfall.";
      sfx.chime();
    }
    if (!got.current && Math.hypot(live.x - 14, live.z - RIVER_Z) < 1.6 && !q?.canyonUnder) {
      got.current = true;
      useGame.getState().setQuest("canyonUnder", 1);
      useGame.getState().addCoins(18);
      live.banner = "Under the old arches.";
      sfx.chime();
    }
    let plate = -1;
    if (Math.hypot(live.x + 78, live.z - (RIVER_Z + 5)) < 1.2) plate = 0;
    if (Math.hypot(live.x + 70, live.z - (RIVER_Z + 5)) < 1.2) plate = 1;
    if (Math.hypot(live.x + 62, live.z - (RIVER_Z + 5)) < 1.2) plate = 2;
    if (plate !== on.current) {
      on.current = plate;
      if (plate >= 0) {
        step.current = plate === step.current ? step.current + 1 : plate === 0 ? 1 : 0;
        if (step.current >= 3 && !useGame.getState().quests?.canyonSlab) {
          useGame.getState().setQuest("canyonSlab", 1);
          live.banner = "One, then two, then three. A slab rises in the river.";
          sfx.chime();
        }
      }
    }
  });
  return (
    <group>
      <Cliffs />
      <Bridge />
      <River />
      <Falls />
      <Shelf />
      <Life />
      <mesh ref={slab} position={[-40, heightAt(-40, RIVER_Z) - 1.2, RIVER_Z]} receiveShadow>
        <boxGeometry args={[3.2, 0.4, 4.4]} />
        {lamb("#8a7b68", { kind: "stone" })}
      </mesh>
      <mesh ref={rock} position={[170, heightAt(170, S_WALL) + 1.3, S_WALL]} castShadow>
        <dodecahedronGeometry args={[2.1, 0]} />
        {lamb("#5a5048", { kind: "stone" })}
      </mesh>
      {[-78, -70, -62].map((x, i) => (
        <group key={x} position={[x, heightAt(x, RIVER_Z + 5), RIVER_Z + 5]}>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[1.1, 0.7, 1.1]} />
            {lamb("#6a5a48", { kind: "stone" })}
          </mesh>
          {Array.from({ length: i + 1 }, (_, k) => (
            <mesh key={k} position={[(k - i / 2) * 0.28, 0.85, 0]}>
              <boxGeometry args={[0.22, 0.22, 0.22]} />
              {lamb("#c4a060")}
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[14, heightAt(14, RIVER_Z) + 0.35, RIVER_Z]}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        {lamb("#e8d48a")}
      </mesh>
      <FarSide />
      <NearSide />
      <Lookout />
      <GateCaps />
      <mesh position={[-2, heightAt(-2, S_WALL - 26) + 16, S_WALL - 26]} castShadow>
        <boxGeometry args={[14, 32, 5]} />
        {lamb("#6a5644", { kind: "stone" })}
      </mesh>
    </group>
  );
}

function GateCaps() {
  const spots = [
    [0, N_WALL],
    [0, S_WALL],
    [-180, N_WALL],
    [-120, S_WALL],
    [170, S_WALL],
  ];
  return (
    <group>
      {spots.map(([x, z], i) => (
        <mesh key={i} position={[x!, heightAt(x!, z!) + 36, z!]} castShadow>
          <boxGeometry args={[18, 32, 16]} />
          {lamb("#6a5644", { kind: "stone" })}
        </mesh>
      ))}
    </group>
  );
}

function Lookout() {
  const x = 48;
  const z = N_WALL + 12;
  const lift = canyonLift(x, z);
  const top = heightAt(x, z);
  const h = Math.max(1, lift);
  return (
    <mesh position={[x, top - lift + h * 0.5, z]} castShadow receiveShadow>
      <boxGeometry args={[7, h, 7]} />
      {lamb("#7a6248", { kind: "stone" })}
    </mesh>
  );
}

function NearSide() {
  const z = N_WALL + 16;
  const y = heightAt(0, z);
  return (
    <group position={[0, y, z]}>
      {[-18, -8, 24, 36].map((x) => (
        <mesh key={x} position={[x, 0.6, 2]} castShadow>
          <dodecahedronGeometry args={[0.8, 0]} />
          {lamb("#8a7058", { kind: "stone" })}
        </mesh>
      ))}
    </group>
  );
}

function FarSide() {
  const z = S_WALL - 22;
  const y = heightAt(6, z);
  return (
    <group position={[6, y, z]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} position={[Math.sin(i) * 7, 0, -4 - (i % 3)]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <boxGeometry args={[0.4, 3, 0.4]} />
            {lamb("#4a3428", { kind: "wood" })}
          </mesh>
          <mesh position={[0, 3.4, 0]} castShadow>
            <coneGeometry args={[1.7, 3, 6]} />
            {lamb("#1c6a38")}
          </mesh>
        </group>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[2 + i * 0.6, 0.25, 2]}>
          <coneGeometry args={[0.14, 0.35, 5]} />
          {lamb(i % 2 ? "#70a0e0" : "#f0d060")}
        </mesh>
      ))}
      <mesh position={[4, 1.1, -2]} castShadow>
        <boxGeometry args={[0.45, 0.9, 0.3]} />
        {lamb("#3a5a48")}
      </mesh>
      <mesh position={[4, 1.75, -2]}>
        <boxGeometry args={[0.32, 0.32, 0.28]} />
        {lamb("#e0b090")}
      </mesh>
      <mesh position={[4, 1.2, 3]} castShadow>
        <boxGeometry args={[0.8, 2.4, 0.5]} />
        {lamb("#d8d0c4", { kind: "stone" })}
      </mesh>
      <mesh position={[4, 2.1, 3.2]}>
        <boxGeometry args={[0.45, 0.3, 0.08]} />
        {lamb("#c4a060")}
      </mesh>
    </group>
  );
}
