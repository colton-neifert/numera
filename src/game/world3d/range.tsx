import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { useGame } from "../store";
import { sfx } from "../audio";
import {
  CAVE,
  CHAMBER,
  CLEFT,
  CRYSTAL,
  MINE,
  PASS,
  RANGE_HALF,
  RANGE_X0,
  RANGE_X1,
  RANGE_Z,
  pathDist,
  rangeLift,
} from "./rangeData";

function columnOpen(x: number) {
  for (let z = RANGE_Z - RANGE_HALF; z <= RANGE_Z + RANGE_HALF; z += 10) {
    if (pathDist(x, z, PASS) < 11) return true;
    if (pathDist(x, z, CAVE) < 6) return true;
    if (pathDist(x, z, MINE) < 6) return true;
    if (pathDist(x, z, CLEFT) < 5.5) return true;
  }
  return false;
}

function Rocks() {
  const rock = useRef<THREE.InstancedMesh>(null);
  const dirt = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const pieces = useMemo(() => {
    const out: { x: number; y: number; z: number; sy: number; sx: number; sz: number }[] = [];
    for (let x = RANGE_X0; x <= RANGE_X1; x += 14) {
      if (columnOpen(x)) continue;
      const z = RANGE_Z;
      const base = heightAt(x, z);
      const crest = 54;
      const sy = Math.max(30, crest - base);
      out.push({ x, y: base + sy * 0.5, z, sy, sx: 16, sz: RANGE_HALF * 1.85 });
    }
    return out;
  }, []);
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    pieces.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.sx, p.sy, p.sz);
      dummy.updateMatrix();
      rock.current?.setMatrixAt(i, dummy.matrix);
      dummy.position.y = p.y - p.sy * 0.28;
      dummy.scale.set(p.sx * 0.92, 2.2, p.sz * 0.55);
      dummy.updateMatrix();
      dirt.current?.setMatrixAt(i, dummy.matrix);
    });
    if (rock.current) rock.current.instanceMatrix.needsUpdate = true;
    if (dirt.current) dirt.current.instanceMatrix.needsUpdate = true;
  }, [pieces]);
  return (
    <group>
      <instancedMesh ref={rock} args={[geo, undefined, pieces.length]} frustumCulled={false} receiveShadow>
        {lamb("#6e5c4a", { kind: "stone" })}
      </instancedMesh>
      <instancedMesh ref={dirt} args={[geo, undefined, pieces.length]} frustumCulled={false}>
        {lamb("#8a6844", { kind: "dirt" })}
      </instancedMesh>
    </group>
  );
}

function Ribs({ pts, half, tall }: { pts: { x: number; z: number }[]; half: number; tall: number }) {
  const ribs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    for (let t = 0; t <= 1; t += 0.34) {
      const x = a.x + (b.x - a.x) * t;
      const z = a.z + (b.z - a.z) * t;
      ribs.push({ x, z, y: heightAt(x, z) });
    }
  }
  return (
    <group>
      {ribs.map((r, i) => (
        <group key={i} position={[r.x, r.y, r.z]}>
          <mesh position={[-(half + 1.4), tall * 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.6, tall, 3.2]} />
            {lamb("#5c4a3c", { kind: "stone" })}
          </mesh>
          <mesh position={[half + 1.4, tall * 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.6, tall, 3.2]} />
            {lamb(i % 4 === 0 ? "#6a5644" : "#5c4a3c", { kind: "stone" })}
          </mesh>
          <mesh position={[0, tall, 0]} castShadow>
            <boxGeometry args={[half * 2 + 4, 2.2, 3.2]} />
            {lamb("#4a3c32", { kind: "stone" })}
          </mesh>
          {i % 3 === 1 ? (
            <mesh position={[0, tall - 0.4, 0]}>
              <boxGeometry args={[0.35, 0.35, half * 1.4]} />
              {lamb("#3f6a32")}
            </mesh>
          ) : null}
        </group>
      ))}
    </group>
  );
}

function Mouth({ x, z, half, h }: { x: number; z: number; half: number; h: number }) {
  const y = heightAt(x, z);
  return (
    <group>
      <mesh position={[x, y + h * 0.55, z - (half + 2.2)]} castShadow>
        <boxGeometry args={[6, h * 1.2, 4]} />
        {lamb("#6a5644", { kind: "stone" })}
      </mesh>
      <mesh position={[x, y + h * 0.55, z + (half + 2.2)]} castShadow>
        <boxGeometry args={[6, h * 1.2, 4]} />
        {lamb("#6a5644", { kind: "stone" })}
      </mesh>
      <mesh position={[x, y + h + 1.2, z]} castShadow>
        <boxGeometry args={[6, 3, half * 2 + 8]} />
        {lamb("#5a4638", { kind: "stone" })}
      </mesh>
    </group>
  );
}

function Steps({ cx, half }: { cx: number; half: number }) {
  const pads = [];
  for (let i = -4; i <= 4; i++) {
    const z = RANGE_Z + i * 8;
    const lift = rangeLift(cx, z);
    const h = Math.max(0.45, lift);
    const gy = heightAt(cx, z);
    pads.push({ z, h, y: gy - lift + h * 0.5 });
  }
  return (
    <group>
      {pads.map((p, i) => (
        <mesh key={i} position={[cx, p.y, p.z]} receiveShadow castShadow>
          <boxGeometry args={[half * 2, p.h, 4]} />
          {lamb(i % 2 ? "#7a6248" : "#6a5640", { kind: "stone" })}
        </mesh>
      ))}
    </group>
  );
}

function Lizard() {
  const ref = useRef<THREE.Group>(null);
  const hurt = useRef(0);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    const x = CHAMBER.x + Math.sin(t * 0.7) * 5;
    const z = CHAMBER.z + Math.cos(t * 0.5) * 4;
    ref.current.position.set(x, heightAt(x, z), z);
    ref.current.rotation.y = t;
    hurt.current -= dt;
    if (hurt.current <= 0 && Math.hypot(live.x - x, live.z - z) < 1.35) {
      hurt.current = 1.4;
      const g = useGame.getState();
      const hp = Math.max(1, (g.hp ?? 4) - 1);
      useGame.setState({ hp });
      live.banner = "A cave lizard nips your boot.";
    }
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.7, 0.35, 1.3]} />
        {lamb("#4a6a40")}
      </mesh>
      <mesh position={[0, 0.5, -0.7]} castShadow>
        <boxGeometry args={[0.4, 0.28, 0.4]} />
        {lamb("#3a5a32")}
      </mesh>
    </group>
  );
}

export function MountainRange() {
  const plates = useRef(0);
  const onPlate = useRef(-1);
  const boards = useRef<THREE.Mesh>(null);
  const gotCrystal = useRef(false);
  const gotLedge = useRef(false);
  const gotAlpine = useRef(false);
  const saw = useRef(false);
  useFrame(() => {
    const crystal = Boolean(useGame.getState().quests?.rangeCrystal);
    if (boards.current) boards.current.visible = !crystal;
    const emerging = live.z > 344 && Math.abs(live.x - 36) < 12;
    if (!saw.current && emerging && !useGame.getState().quests?.sawHigh) {
      saw.current = true;
      useGame.getState().setQuest("sawHigh", 1);
      live.banner = "The high country.";
      live.objective = "You walked through the mountain.";
      sfx.chime();
    }
    if (!gotCrystal.current && Math.hypot(live.x - CRYSTAL.x, live.z - CRYSTAL.z) < 1.6) {
      gotCrystal.current = true;
      if (!useGame.getState().quests?.rangeCrystal) {
        useGame.getState().setQuest("rangeCrystal", 1);
        useGame.getState().addCoins(18);
        live.banner = "A mountain crystal. The old mine answers it.";
        sfx.chime();
      }
    }
    if (!gotLedge.current && Math.hypot(live.x + 42, live.z - 256) < 2.2) {
      gotLedge.current = true;
      if (!useGame.getState().quests?.rangeLedge) {
        useGame.getState().setQuest("rangeLedge", 1);
        useGame.getState().addCoins(12);
        live.banner = "A cache on the ledge.";
        sfx.ok();
      }
    }
    if (!gotAlpine.current && Math.hypot(live.x - 20, live.z - 390) < 1.8) {
      gotAlpine.current = true;
      if (!useGame.getState().quests?.rangeCairn) {
        useGame.getState().setQuest("rangeCairn", 1);
        useGame.getState().addCoins(15);
        live.banner = "The cairn on the far side.";
        sfx.ok();
      }
    }
    if (crystal && Math.hypot(live.x - 158, live.z - 300) < 1.7 && !useGame.getState().quests?.rangeOre) {
      useGame.getState().setQuest("rangeOre", 1);
      useGame.getState().addCoins(22);
      live.banner = "Old ore, still bright.";
      sfx.chime();
    }
    let plate = -1;
    const spots = [-4, 0, 4];
    for (let i = 0; i < 3; i++) {
      if (Math.hypot(live.x - (CHAMBER.x + spots[i]!), live.z - (CHAMBER.z + 4)) < 1.1) plate = i;
    }
    if (plate !== onPlate.current) {
      onPlate.current = plate;
      if (plate >= 0) {
        plates.current = plate === plates.current ? plates.current + 1 : plate === 0 ? 1 : 0;
        if (plates.current >= 3 && !useGame.getState().quests?.rangePlates) {
          useGame.getState().setQuest("rangePlates", 1);
          useGame.getState().addCoins(20);
          live.banner = "The floor remembered the order.";
          sfx.chime();
        }
      }
    }
  });
  const south = PASS[0]!;
  const north = PASS[PASS.length - 1]!;
  return (
    <group>
      <Rocks />
      <Ribs pts={PASS} half={6.2} tall={8.2} />
      <Ribs pts={CAVE} half={3.4} tall={6.2} />
      <Ribs pts={MINE} half={3.2} tall={5.8} />
      <Ribs pts={CLEFT} half={3} tall={6} />
      {PASS.map((p, i) =>
        i === 0 || i === PASS.length - 1 ? (
          <mesh key={i} position={[p.x, heightAt(p.x, p.z) + 30, p.z]} castShadow>
            <boxGeometry args={[22, 36, 16]} />
            {lamb("#6a5644", { kind: "stone" })}
          </mesh>
        ) : null,
      )}
      <Mouth x={south.x} z={south.z} half={7} h={9} />
      <Mouth x={north.x} z={north.z} half={7} h={9} />
      {(() => {
        const lift = rangeLift(-42, 256);
        const top = heightAt(-42, 256);
        const h = Math.max(0.8, lift);
        return (
          <mesh position={[-42, top - lift + h * 0.5, 256]} castShadow receiveShadow>
            <boxGeometry args={[6, h, 8]} />
            {lamb("#7a6248", { kind: "stone" })}
          </mesh>
        );
      })()}
      <Lizard />
      <mesh ref={boards} position={[170, heightAt(170, 266) + 1.6, 266]} castShadow>
        <boxGeometry args={[6, 3.2, 0.8]} />
        {lamb("#5a4030", { kind: "wood" })}
      </mesh>
      <mesh position={[CRYSTAL.x, heightAt(CRYSTAL.x, CRYSTAL.z) + 0.8, CRYSTAL.z]}>
        <octahedronGeometry args={[0.55, 0]} />
        {lamb("#7ec8e8", { emissive: "#9ad8f0", emit: 0.6 })}
      </mesh>
      <mesh position={[14, heightAt(14, 286) + 0.8, 286]} castShadow>
        <dodecahedronGeometry args={[1.5, 0]} />
        {lamb("#5a5048", { kind: "stone" })}
      </mesh>
      <mesh position={[22, heightAt(22, 300) + 0.05, 300]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.4, 12]} />
        {lamb("#2a6a88")}
      </mesh>
      {[-4, 0, 4].map((x, i) => (
        <mesh key={x} position={[CHAMBER.x + x, heightAt(CHAMBER.x, CHAMBER.z) + 0.08, CHAMBER.z + 4]}>
          <boxGeometry args={[1.3, 0.12, 1.3]} />
          {lamb(i === 2 ? "#c9a24a" : "#8a8478")}
        </mesh>
      ))}
      <mesh position={[CHAMBER.x, heightAt(CHAMBER.x, CHAMBER.z) + 2.2, CHAMBER.z - 6]}>
        <boxGeometry args={[3.2, 1.4, 0.2]} />
        {lamb("#c4a060")}
      </mesh>
      <ForestSide />
      <HighCountry />
    </group>
  );
}

function ForestSide() {
  const y = heightAt(-6, 248);
  return (
    <group position={[-6, y, 248]}>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[Math.cos(i) * 8, 0, -4 + (i % 2) * 3]}>
          <mesh position={[0, 1.4, 0]} castShadow>
            <boxGeometry args={[0.4, 2.8, 0.4]} />
            {lamb("#5a4030", { kind: "wood" })}
          </mesh>
          <mesh position={[0, 3.2, 0]} castShadow>
            <coneGeometry args={[1.6, 2.8, 6]} />
            {lamb("#1f6a34")}
          </mesh>
        </group>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[4 + i, 0.2, 2]}>
          <coneGeometry args={[0.14, 0.32, 5]} />
          {lamb(i % 2 ? "#e090a8" : "#f0d060")}
        </mesh>
      ))}
    </group>
  );
}

function HighCountry() {
  const x = 24;
  const z = 378;
  const y = heightAt(x, z);
  const goat = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!goat.current) return;
    const t = clock.elapsedTime * 0.3;
    const gx = 48 + Math.sin(t) * 5;
    const gz = 400 + Math.cos(t * 0.7) * 3;
    goat.current.position.set(gx, heightAt(gx, gz), gz);
  });
  return (
    <group>
      <mesh position={[x, y + 0.04, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[42, 20]} />
        {lamb("#8a9488")}
      </mesh>
      <mesh position={[20, heightAt(20, 390) + 1.1, 390]} castShadow>
        <boxGeometry args={[1.1, 2.2, 1.1]} />
        {lamb("#9aa0a4", { kind: "stone" })}
      </mesh>
      <mesh position={[55, y + 1.3, 360]} castShadow>
        <boxGeometry args={[3.2, 2.4, 2.6]} />
        {lamb("#c8c2b4")}
      </mesh>
      <mesh position={[55, y + 2.7, 360]}>
        <boxGeometry args={[3.6, 0.4, 3]} />
        {lamb("#6a6058")}
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[10 + i * 8, heightAt(10 + i * 8, 410) + 1.6, 410]} castShadow>
          <coneGeometry args={[0.8, 3.2, 5]} />
          {lamb("#3a5a58")}
        </mesh>
      ))}
      <group ref={goat}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[0.45, 0.4, 0.8]} />
          {lamb("#d8d4cc")}
        </mesh>
        <mesh position={[0, 0.85, -0.35]}>
          <boxGeometry args={[0.22, 0.22, 0.22]} />
          {lamb("#eeeae2")}
        </mesh>
      </group>
    </group>
  );
}
