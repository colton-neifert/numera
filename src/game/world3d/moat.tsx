import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { KEEP_Z, MOAT_IN, MOAT_OUT, fieldHeight, moatGate, moatRing, onDrawbridge } from "./field";
import { duskAmt, live } from "./live";
import { lamb } from "./mats";
import { sfx } from "../audio";
import { useGame } from "../store";
import { puffAt } from "./fx";
import { waterMaterial } from "./lush/water";

const _end = new THREE.Vector3();
const _post = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const HINGE_Z = KEEP_Z - MOAT_IN + 0.2;
const LEN = MOAT_OUT - MOAT_IN + 1.4;
const BRIDGE_W = 10.4;

export function collideCastleGate(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house || live.gateCross || moatGate.down > 0.72) return null;
  if (Math.abs(nx) > 3.5 || Math.abs(nz - HINGE_Z) > 0.85) return null;
  return { x: nx, z: nz < HINGE_Z ? HINGE_Z - 0.9 : HINGE_Z + 0.9 };
}

let gateLatch = false;
function watchCastleGate() {
  const open = moatGate.down > 0.9;
  const inMouth = Math.abs(live.x) < 3.2 && live.z > HINGE_Z - 1.2 && live.z < HINGE_Z + 1.4;
  if (!open || live.house) {
    if (!inMouth) gateLatch = false;
    return;
  }
  if (!inMouth || gateLatch) return;
  gateLatch = true;
  live.banner = live.z > HINGE_Z ? "The Keep" : "";
  live.bannerMs = 1200;
}

export function collideMoat(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house || onDrawbridge(nx, nz)) return null;
  if (!live.mounted) return null;
  if (moatRing(nx, nz) < 0.2) return null;
  const dx = nx;
  const dz = nz - KEEP_Z;
  const dist = Math.hypot(dx, dz) || 0.001;
  const mid = (MOAT_IN + MOAT_OUT) * 0.5;
  const target = dist < mid ? MOAT_IN - 0.85 : MOAT_OUT + 0.85;
  const s = target / dist;
  return { x: dx * s, z: KEEP_Z + dz * s };
}

function MoatWater() {
  const mesh = useRef<THREE.Mesh>(null);
  const y = fieldHeight(0, KEEP_Z) - 0.55;
  const geo = useMemo(() => {
    const g = new THREE.RingGeometry(MOAT_IN + 0.35, MOAT_OUT - 0.25, 48);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const edge = new Float32Array(pos.count);
    const mid = (MOAT_IN + MOAT_OUT) * 0.5;
    const half = (MOAT_OUT - MOAT_IN) * 0.5;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const pz = pos.getZ(i);
      edge[i] = Math.min(1, Math.abs(Math.hypot(px, pz) - mid) / half);
      pos.setX(i, px);
      pos.setZ(i, KEEP_Z + pz);
    }
    g.setAttribute("aEdge", new THREE.BufferAttribute(edge, 1));
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (mesh.current) mesh.current.position.y = y + Math.sin(clock.elapsedTime * 0.6) * 0.02;
  });
  return (
    <mesh ref={mesh} geometry={geo} position={[0, y, 0]} receiveShadow>
      <primitive object={waterMaterial()} attach="material" />
    </mesh>
  );
}

function BankBits() {
  const y0 = fieldHeight(0, KEEP_Z);
  const bits: { x: number; z: number; s: number; rock: boolean; grass: boolean }[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    if (Math.abs(a + Math.PI / 2) < 0.42 || Math.abs(a - (3 * Math.PI) / 2) < 0.42) continue;
    const outer = i % 2 === 0;
    const r = outer ? MOAT_OUT + 0.7 : MOAT_IN - 0.85;
    bits.push({
      x: Math.cos(a) * r,
      z: KEEP_Z + Math.sin(a) * r,
      s: 0.28 + (i % 4) * 0.06,
      rock: i % 3 !== 0,
      grass: i % 3 === 0,
    });
  }
  return (
    <group>
      {bits.map((b, i) => (
        <group key={i} position={[b.x, y0, b.z]}>
          {b.rock ? (
            <mesh position={[0, b.s * 0.35, 0]} castShadow>
              <dodecahedronGeometry args={[b.s, 0]} />
              {lamb(i % 2 ? "#7a6a58" : "#8a7a64", { kind: "stone" })}
            </mesh>
          ) : (
            <>
              <mesh position={[0, 0.45, 0]} castShadow>
                <coneGeometry args={[0.08, 0.9, 4]} />
                {lamb("#3f7a3a")}
              </mesh>
              <mesh position={[0.16, 0.28, 0.08]}>
                <coneGeometry args={[0.1, 0.22, 5]} />
                {lamb(i % 2 ? "#e090a8" : "#e8d060")}
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
}

function Drawbridge() {
  const plank = useRef<THREE.Group>(null);
  const chainL = useRef<THREE.Mesh>(null);
  const chainR = useRef<THREE.Mesh>(null);
  const doorL = useRef<THREE.Group>(null);
  const doorR = useRef<THREE.Group>(null);
  const prev = useRef(moatGate.down);
  const clank = useRef(0);
  const chainT = useRef(-1);
  const waterTick = useRef(0);
  const y = fieldHeight(0, KEEP_Z) - 0.02;
  useFrame((_, dt) => {
    const night = live.night || duskAmt() > 0.42;
    const want = night ? 0 : 1;
    const before = moatGate.down;
    moatGate.down += (want - moatGate.down) * Math.min(1, dt * 0.28);
    const moving = Math.abs(want - moatGate.down) > 0.03;
    clank.current -= dt;
    if (moving && clank.current <= 0) {
      clank.current = 0.22;
      sfx.chain();
      if (Math.random() < 0.55) sfx.creak();
    }
    if (before < 0.93 && moatGate.down >= 0.93 && want > 0.5) {
      sfx.bridgeSlam();
      puffAt(0, KEEP_Z - MOAT_OUT, y + 0.1, false);
    }
    if (before > 0.2 && moatGate.down <= 0.12 && want < 0.5) sfx.gate();
    prev.current = moatGate.down;
    const lift = (1 - moatGate.down) * 1.42;
    if (plank.current) plank.current.rotation.x = lift;
    const open = Math.max(0, Math.min(1, (moatGate.down - 0.55) / 0.4));
    if (doorL.current) doorL.current.rotation.y = open * 1.55;
    if (doorR.current) doorR.current.rotation.y = -open * 1.55;
    for (const [mesh, side] of [
      [chainL.current, -1],
      [chainR.current, 1],
    ] as const) {
      if (!mesh || !plank.current) continue;
      _end.set(side * (BRIDGE_W * 0.42), 0.28, -LEN + 0.4);
      plank.current.localToWorld(_end);
      _post.set(side * (BRIDGE_W * 0.46), y + 6.4, HINGE_Z + 0.2);
      _dir.copy(_end).sub(_post);
      const span = Math.max(0.2, _dir.length());
      _dir.multiplyScalar(1 / span);
      mesh.position.copy(_post).add(_end).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(_up, _dir);
      mesh.scale.set(1, span, 1);
    }
    if (!live.house && moatGate.down < 0.4 && Math.abs(live.x) < 6 && live.z < KEEP_Z - MOAT_OUT + 2 && live.z > KEEP_Z - MOAT_OUT - 8) {
      live.hint = "The drawbridge is up until morning.";
    }
    waterTick.current -= dt;
    if (waterTick.current <= 0 && moatRing(live.x, live.z) > 0.2) {
      waterTick.current = 1.6;
      sfx.splash();
    }
    if (moatGate.down > 0.82 && !live.mounted && !live.swim) {
      const side = live.x < 0 ? -1 : 1;
      const x0 = side * (BRIDGE_W * 0.46);
      const y0 = y + 0.4;
      const z0 = HINGE_Z - LEN + 0.6;
      const y1 = y + 6.2;
      const z1 = HINGE_Z;
      if (chainT.current < 0) {
        const near = Math.hypot(live.x - x0, live.z - z0) < 1.5 && live.grounded;
        if (near && Math.abs(live.speed) > 0.4) {
          chainT.current = 0.02;
          live.hint = "The chain holds.";
        }
      } else {
        chainT.current = Math.min(1, chainT.current + dt * 0.28);
        const t = chainT.current;
        const cy = y0 + (y1 - y0) * t;
        live.chainY = cy;
        live.x = x0;
        live.y = cy;
        live.z = z0 + (z1 - z0) * t;
        live.speed = 0;
        live.grounded = true;
        if (t >= 1) {
          if ((useGame.getState().quests?.chainGold ?? 0) < 1) {
            useGame.getState().setQuest("chainGold", 1);
            useGame.getState().addCoins(50);
            sfx.coinPile();
            live.hint = "Fifty coins. The chain was the way up.";
          }
          chainT.current = -1;
          live.chainY = null;
        }
      }
    } else if (live.swim || moatGate.down < 0.7) {
      chainT.current = -1;
      live.chainY = null;
    }
    if (
      live.swim &&
      Math.abs(live.x) < 2.2 &&
      live.z < HINGE_Z - 2 &&
      live.z > HINGE_Z - LEN + 2 &&
      (useGame.getState().quests?.moatCoin ?? 0) < 1
    ) {
      useGame.getState().setQuest("moatCoin", 1);
      useGame.getState().addCoins(5);
      sfx.coin();
      live.hint = "A coin under the bridge.";
    }
    watchCastleGate();
  });
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (BRIDGE_W * 0.5 + 0.35), y + 3.3, HINGE_Z]} castShadow>
          <boxGeometry args={[0.7, 6.6, 0.7]} />
          {lamb("#6a5340", { kind: "wood" })}
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`cap${s}`} position={[s * (BRIDGE_W * 0.5 + 0.35), y + 6.7, HINGE_Z]} castShadow>
          <boxGeometry args={[1.1, 0.35, 1.1]} />
          {lamb("#4a3428", { kind: "wood" })}
        </mesh>
      ))}
      <group ref={plank} position={[0, y + 0.16, HINGE_Z]}>
        <mesh position={[0, 0, -LEN * 0.5]} castShadow receiveShadow>
          <boxGeometry args={[BRIDGE_W, 0.38, LEN]} />
          {lamb("#8a6844", { kind: "wood" })}
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (BRIDGE_W * 0.46), 0.32, -LEN * 0.5]} castShadow>
            <boxGeometry args={[0.42, 0.55, LEN]} />
            {lamb("#5c4030", { kind: "wood" })}
          </mesh>
        ))}
        {[0.18, 0.4, 0.62, 0.84].map((t) => (
          <mesh key={`iron${t}`} position={[0, 0.28, -LEN * t]}>
            <boxGeometry args={[BRIDGE_W - 0.2, 0.06, 0.14]} />
            {lamb("#6a6e74")}
          </mesh>
        ))}
        {[-1, 1].map((s) =>
          [0.22, 0.5, 0.78].map((t) => (
            <mesh key={`bolt${s}${t}`} position={[s * (BRIDGE_W * 0.42), 0.32, -LEN * t]}>
              <boxGeometry args={[0.12, 0.08, 0.12]} />
              {lamb("#3a3e44")}
            </mesh>
          )),
        )}
      </group>
      <group ref={doorL} position={[-3.55, y, HINGE_Z + 0.15]}>
        <mesh position={[1.7, 2.35, 0]} castShadow>
          <boxGeometry args={[3.4, 4.7, 0.32]} />
          {lamb("#6e5038", { kind: "wood" })}
        </mesh>
        <mesh position={[1.15, 2.35, 0.2]}>
          <boxGeometry args={[0.16, 3.6, 0.08]} />
          {lamb("#c9a24a")}
        </mesh>
      </group>
      <group ref={doorR} position={[3.55, y, HINGE_Z + 0.15]}>
        <mesh position={[-1.7, 2.35, 0]} castShadow>
          <boxGeometry args={[3.4, 4.7, 0.32]} />
          {lamb("#6e5038", { kind: "wood" })}
        </mesh>
        <mesh position={[-1.15, 2.35, 0.2]}>
          <boxGeometry args={[0.16, 3.6, 0.08]} />
          {lamb("#c9a24a")}
        </mesh>
      </group>
      <mesh ref={chainL}>
        <cylinderGeometry args={[0.2, 0.2, 1, 6]} />
        {lamb("#3a342c")}
      </mesh>
      <mesh ref={chainR}>
        <cylinderGeometry args={[0.2, 0.2, 1, 6]} />
        {lamb("#3a342c")}
      </mesh>
    </group>
  );
}

function Approach() {
  const y = fieldHeight(0, KEEP_Z);
  const zPath = KEEP_Z - MOAT_OUT - 12;
  const flowers = [-8, -5, 5, 8, -6, 6];
  return (
    <group>
      <mesh position={[0, y + 0.04, zPath]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.1, 22]} />
        {lamb("#8d6b45", { kind: "dirt" })}
      </mesh>
      {flowers.map((x, i) => (
        <mesh key={x} position={[x, y + 0.18, KEEP_Z - MOAT_OUT - 4 - (i % 3)]} castShadow>
          <coneGeometry args={[0.12, 0.28, 5]} />
          {lamb(i % 2 ? "#e090a8" : "#f0d060")}
        </mesh>
      ))}
      {[[-16, -8], [15, -6], [-18, 4]].map(([x, dz], i) => (
        <group key={i} position={[x, y, KEEP_Z - MOAT_OUT + dz]}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <boxGeometry args={[0.35, 2.2, 0.35]} />
            {lamb("#5a4030", { kind: "wood" })}
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <coneGeometry args={[1.15, 1.8, 6]} />
            {lamb(i === 1 ? "#2f7a40" : "#1f5a32")}
          </mesh>
        </group>
      ))}
      {[-4.6, 4.6].map((x) => (
        <group key={x} position={[x, y, KEEP_Z - MOAT_OUT - 2.4]}>
          <mesh position={[0, 1.6, 0]} castShadow>
            <boxGeometry args={[0.1, 3.2, 0.1]} />
            {lamb("#4a3220", { kind: "wood" })}
          </mesh>
          <mesh position={[x > 0 ? -0.55 : 0.55, 2.5, 0]}>
            <boxGeometry args={[1.1, 0.7, 0.06]} />
            {lamb("#8a3030")}
          </mesh>
          <mesh position={[0, 1.1, 0.12]}>
            <boxGeometry args={[0.16, 0.22, 0.08]} />
            {lamb("#e8c878", { emissive: "#e09040", emit: 0.7 })}
          </mesh>
        </group>
      ))}
      <mesh position={[-8.5, y + 0.35, KEEP_Z - MOAT_OUT - 5]} castShadow>
        <boxGeometry args={[1.5, 0.45, 0.55]} />
        {lamb("#6a5340", { kind: "wood" })}
      </mesh>
    </group>
  );
}

function DayCrosser() {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);
  const y = fieldHeight(0, KEEP_Z);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const open = moatGate.down > 0.82;
    if (open) t.current += dt * 0.22;
    const u = (Math.sin(t.current) + 1) / 2;
    const z0 = KEEP_Z - MOAT_OUT - 4;
    const z1 = KEEP_Z - MOAT_IN + 1.5;
    ref.current.position.set(-0.7, y, open ? z0 + (z1 - z0) * u : z0);
    ref.current.rotation.y = Math.cos(t.current) > 0 ? 0 : Math.PI;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.42, 0.7, 0.28]} />
        {lamb("#3a5a88")}
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.32, 0.32, 0.28]} />
        {lamb("#e0b090")}
      </mesh>
    </group>
  );
}

export function CastleMoat() {
  const y = fieldHeight(0, KEEP_Z);
  return (
    <group>
      <mesh position={[0, y - 0.08, KEEP_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[MOAT_IN - 0.15, MOAT_OUT + 0.55, 48]} />
        {lamb("#6a8a48")}
      </mesh>
      <MoatWater />
      <BankBits />
      <Drawbridge />
      <Approach />
    </group>
  );
}
