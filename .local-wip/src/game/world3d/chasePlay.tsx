import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { sfx } from "../audio";
import { useGame } from "../store";
import { N64Foe, type FangPose } from "./n64";
import { puffAt } from "./fx";
import { addAdvHit } from "./adventurePlay";
import { consumeTalk as consumeTalkRaw } from "../input";
import {
  chase,
  chaseOn,
  chaseDone,
  chaseReady,
  beginChase,
  stepChase,
  endChase,
  CHASE_HIDES,
  CHASE_ROUTE,
  CHASE_BRIDGE,
  CHASE_FARM,
  CHASE_POLE,
  CHASE_SMITH,
  chaseClueNear,
} from "../chase";

function talkOk() {
  if (live.nearNpc || live.nearHouse || live.nearChest || live.nearHorse) return false;
  return consumeTalkRaw();
}

export function ChasePlay() {
  const [on, setOn] = useState(false);
  return (
    <group>
      <ChaseDirector on={on} setOn={setOn} />
      <HangLeaf />
      {on || chase.phase === "caught" ? (
        <>
          <ThiefBody />
          <ChaseDress />
          <FarmJump />
          <CreekPlanks />
          <RollingDodge />
          <Scraps />
          <HideSearch />
        </>
      ) : null}
    </group>
  );
}

function ChaseDirector({ on, setOn }: { on: boolean; setOn: (v: boolean) => void }) {
  const dwell = useRef(0);
  useFrame((_, dt) => {
    if (chaseDone()) {
      if (on) setOn(false);
      live.chaseOn = false;
      return;
    }
    if (chase.phase === "off") {
      if (chaseReady()) {
        dwell.current += dt;
        if (dwell.current > 0.35) live.listen = live.listen || "The last green leaf. Still hanging.";
        if (dwell.current > 1.6) beginChase();
      } else dwell.current = Math.max(0, dwell.current - dt * 0.4);
    } else {
      stepChase(dt);
    }
    const now = chaseOn() || chase.phase === "caught";
    if (now !== on) setOn(now);

    if (chase.phase === "run") {
      const d = Math.hypot(live.x - chase.x, live.z - chase.z);
      if (d < 18 && d > 6) live.listen = live.listen || "Sprint. Jump the crates. Don’t follow every turn.";
    }
    const clue = chaseClueNear(live.x, live.z);
    if (clue && (chase.phase === "lost" || chase.phase === "hide" || chase.phase === "run")) {
      if (Math.hypot(live.x - clue.x, live.z - clue.z) < 1.6) live.listen = live.listen || clue.clue;
    }
  });
  return null;
}

function HangLeaf() {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!g.current) return;
    const hanging = !chaseDone() && chase.phase === "off" && (useGame.getState().quests?.lefthome ?? 0) >= 1;
    g.current.visible = hanging;
    if (!hanging) return;
    g.current.rotation.z = Math.sin(live.playT * 1.6) * 0.12;
    g.current.rotation.x = Math.cos(live.playT * 1.1) * 0.04;
  });
  const y = heightAt(CHASE_POLE.x, CHASE_POLE.z);
  return (
    <group position={[CHASE_POLE.x, y, CHASE_POLE.z]}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 2.3, 6]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      <group ref={g} position={[0.16, 2.12, 0]} visible={false}>
        <mesh rotation={[0.4, 0.2, 0.5]}>
          <coneGeometry args={[0.16, 0.42, 5]} />
          <meshLambertMaterial color="#3d7a48" />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <sphereGeometry args={[0.045, 6, 5]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      </group>
    </group>
  );
}

function ThiefBody() {
  const g = useRef<THREE.Group>(null);
  const pose = useRef<FangPose>("idle");
  const hop = useRef(0);
  useFrame((_, dt) => {
    if (!g.current) return;
    const show = chase.phase === "steal" || chase.phase === "run";
    g.current.visible = show;
    if (!show) return;
    const jumping = chase.phase === "run" && Boolean(CHASE_ROUTE[chase.i]?.jump);
    hop.current += dt * (chase.phase === "run" ? (jumping ? 18 : 14) : 4);
    const bounce = Math.abs(Math.sin(hop.current)) * (chase.phase === "run" ? (jumping ? 0.42 : 0.16) : 0.04);
    const y = heightAt(chase.x, chase.z) + bounce;
    g.current.position.set(chase.x, y, chase.z);
    g.current.rotation.y = chase.yaw;
    pose.current = chase.phase === "run" ? "chase" : "yell";
    if (chase.phase === "run" && Math.random() < dt * 2.4) puffAt(chase.x, chase.z, y + 0.1);
  });
  return (
    <group ref={g} visible={false}>
      <N64Foe kind="plusling" seed={21} pose="chase" poseRef={pose} world="grave" />
      <mesh position={[0.08, 1.12, 0.28]} rotation={[0.5, 0.2, 0.1]}>
        <coneGeometry args={[0.12, 0.34, 5]} />
        <meshLambertMaterial color="#3d7a48" />
      </mesh>
      <mesh position={[0.08, 1.28, 0.28]}>
        <sphereGeometry args={[0.05, 6, 5]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function ChaseDress() {
  const dust = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const bits = useRef(
    Array.from({ length: 16 }, () => ({ x: chase.x, z: chase.z, a: 0, s: 0.12 + Math.random() * 0.1 })),
  );
  useFrame((_, dt) => {
    if (!dust.current) return;
    const running = chase.phase === "run";
    if (running && Math.hypot(bits.current[0]!.x - chase.x, bits.current[0]!.z - chase.z) > 1.1) {
      bits.current.pop();
      bits.current.unshift({ x: chase.x, z: chase.z, a: 1, s: 0.16 });
    }
    bits.current.forEach((b, i) => {
      b.a = Math.max(0, b.a - dt * 0.55);
      dummy.position.set(b.x, heightAt(b.x, b.z) + 0.06, b.z);
      dummy.scale.setScalar(b.s * (0.4 + b.a));
      dummy.rotation.set(-Math.PI / 2, 0, i);
      dummy.updateMatrix();
      dust.current!.setMatrixAt(i, dummy.matrix);
    });
    dust.current.count = bits.current.length;
    dust.current.instanceMatrix.needsUpdate = true;
    dust.current.visible = running || chase.phase === "lost";
  });
  return (
    <instancedMesh ref={dust} args={[undefined, undefined, 16]} frustumCulled={false}>
      <circleGeometry args={[1, 8]} />
      <meshLambertMaterial color="#c4a06a" transparent opacity={0.45} depthWrite={false} />
    </instancedMesh>
  );
}

function FarmJump() {
  const { x, z } = CHASE_FARM;
  const crates = useMemo(
    () => [
      { x: x - 4.2, z: z + 0.4, h: 0.9 },
      { x: x - 3.4, z: z + 0.2, h: 1.15 },
      { x: x - 1.6, z: z + 0.1, h: 0.42 },
      { x: x - 0.6, z: z + 0.2, h: 1.1 },
      { x: x + 0.2, z: z + 0.35, h: 0.95 },
    ],
    [x, z],
  );
  useFrame(() => {
    if (!chaseOn()) return;
    crates.forEach((c) => {
      if (c.h > 0.7) addAdvHit(c.x, c.z, 0.55);
    });
    const mid = crates[2]!;
    if (Math.hypot(live.x - mid.x, live.z - mid.z) < 2.2 && live.y > heightAt(mid.x, mid.z) + 0.7) {
      live.listen = live.listen || "The gap. That’s the shortcut.";
    }
  });
  if (!chaseOn() && chase.phase !== "caught") return null;
  return (
    <group>
      {crates.map((c, i) => (
        <mesh key={i} position={[c.x, heightAt(c.x, c.z) + c.h * 0.5, c.z]} castShadow>
          <boxGeometry args={[0.7, c.h, 0.62]} />
          {lamb(i === 2 ? "#8a6a38" : "#6a4a28", { kind: "wood" })}
        </mesh>
      ))}
    </group>
  );
}

function CreekPlanks() {
  const { x, z } = CHASE_BRIDGE;
  const y = heightAt(x, z);
  useFrame(() => {
    if (!chaseOn()) return;
    addAdvHit(x - 1.6, z, 0.35);
    addAdvHit(x + 1.6, z, 0.35);
    if (Math.hypot(live.x - x, live.z - z) < 3.2) live.listen = live.listen || "Planks. Or jump the water.";
  });
  if (!chaseOn() && chase.phase !== "caught") return null;
  return (
    <group position={[x, y, z]} rotation={[0, 0.7, 0]}>
      {[-0.35, 0.35].map((s, i) => (
        <mesh key={i} position={[s, 0.22, 0]} rotation={[0.04, 0, 0]} receiveShadow>
          <boxGeometry args={[0.42, 0.1, 3.4]} />
          {lamb("#8a6238", { kind: "wood" })}
        </mesh>
      ))}
      {[-1.55, 1.55].map((s) => (
        <mesh key={s} position={[0, 0.55, s]} castShadow>
          <boxGeometry args={[1.15, 0.7, 0.14]} />
          {lamb("#6a4a28", { kind: "wood" })}
        </mesh>
      ))}
    </group>
  );
}

/** Barrels on the farm road, a cart by the forge — jump or eat dirt. */
function RollingDodge() {
  const barrels = useRef(
    [
      { u: 0.05, sp: 0.22, w: 0.55 },
      { u: 0.38, sp: 0.18, w: 0.62 },
      { u: 0.72, sp: 0.25, w: 0.5 },
    ].map((b) => ({ ...b })),
  );
  const cart = useRef({ u: 0.2, dir: 1 });
  const knockT = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const wagon = useRef<THREE.Group>(null);
  const ax = CHASE_FARM.x - 1.2;
  const az = CHASE_FARM.z + 2;
  const bx = CHASE_SMITH.x - 2;
  const bz = CHASE_SMITH.z + 4;
  useFrame((_, dt) => {
    if (!chaseOn()) return;
    knockT.current = Math.max(0, knockT.current - dt);
    const jumping = live.y > heightAt(live.x, live.z) + 0.72;
    barrels.current.forEach((b, i) => {
      b.u = (b.u + b.sp * dt) % 1;
      const x = ax + (bx - ax) * b.u + Math.sin(i + b.u * 8) * 0.35;
      const z = az + (bz - az) * b.u;
      dummy.position.set(x, heightAt(x, z) + b.w * 0.42, z);
      dummy.rotation.set(Math.PI / 2, 0, b.u * Math.PI * 8);
      dummy.scale.set(b.w, b.w, b.w * 1.1);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(i, dummy.matrix);
      if (!jumping) {
        addAdvHit(x, z, 0.48);
        const d = Math.hypot(live.x - x, live.z - z);
        if (d < 0.7 && knockT.current <= 0) {
          const nx = (live.x - x) / Math.max(0.2, d);
          const nz = (live.z - z) / Math.max(0.2, d);
          live.knock = { vx: nx * 8.4, vz: nz * 8.4, t: 0.18 };
          knockT.current = 0.45;
          sfx.hit();
          live.listen = live.listen || "Jump the barrels!!";
        }
      }
    });
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;

    const c = cart.current;
    c.u += c.dir * 0.16 * dt;
    if (c.u > 1) {
      c.u = 1;
      c.dir = -1;
    }
    if (c.u < 0) {
      c.u = 0;
      c.dir = 1;
    }
    const cx = CHASE_SMITH.x - 8 + c.u * 14;
    const cz = CHASE_SMITH.z + 2.4;
    if (wagon.current) {
      wagon.current.position.set(cx, heightAt(cx, cz), cz);
      wagon.current.rotation.y = c.dir > 0 ? 1.2 : 1.2 + Math.PI;
    }
    if (!jumping) {
      addAdvHit(cx, cz, 0.7);
      const d = Math.hypot(live.x - cx, live.z - cz);
      if (d < 0.95 && knockT.current <= 0) {
        live.knock = { vx: 0, vz: c.dir * 7, t: 0.2 };
        knockT.current = 0.45;
        sfx.hit();
        live.listen = live.listen || "The cart. Around or over.";
      }
    }
  });
  if (!chaseOn() && chase.phase !== "caught") return null;
  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, 3]} frustumCulled={false}>
        <cylinderGeometry args={[0.5, 0.5, 0.7, 8]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </instancedMesh>
      <group ref={wagon}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.4, 0.55, 0.85]} />
          {lamb("#5a3a22", { kind: "wood" })}
        </mesh>
        {[-0.45, 0.45].map((s) => (
          <mesh key={s} position={[s, 0.22, 0.48]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.12, 8]} />
            {lamb("#3a2414", { kind: "wood" })}
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Scraps() {
  const [, bump] = useState(0);
  const n = useRef(0);
  const bob = useRef(0);
  useFrame((_, dt) => {
    bob.current += dt;
    if (chase.scraps.length !== n.current) {
      n.current = chase.scraps.length;
      bump((v) => v + 1);
    }
  });
  if (!chaseOn() && chase.phase !== "caught") return null;
  return (
    <group>
      {chase.scraps.map((s) => (
        <mesh key={s.id} position={[s.x, heightAt(s.x, s.z) + 0.1 + Math.sin(s.x + bob.current * 3) * 0.03, s.z]} rotation={[-Math.PI / 2, 0, s.x]}>
          <coneGeometry args={[0.14, 0.24, 4]} />
          <meshLambertMaterial color="#3d7a48" />
        </mesh>
      ))}
    </group>
  );
}

function HideSearch() {
  useFrame(() => {
    if (chase.phase !== "hide" && chase.phase !== "lost") return;
    const hid = CHASE_HIDES.find((h) => h.id === chase.hide);
    if (!hid) return;
    const d = Math.hypot(live.x - hid.x, live.z - hid.z);
    if (d < 2.6) live.listen = live.listen || hid.look;
    const slash = live.slash && Math.hypot(live.slash.x - hid.x, live.slash.z - hid.z) < 1.4;
    const talk = d < 1.7 && talkOk();
    const sprint = d < 1.4 && live.sprinting;
    if (slash || talk || sprint) {
      puffAt(hid.x, hid.z, heightAt(hid.x, hid.z) + 0.8, true);
      sfx.hit();
      endChase(true);
    }
  });
  if (chase.phase !== "hide") return null;
  const hid = CHASE_HIDES.find((h) => h.id === chase.hide);
  if (!hid) return null;
  const y = heightAt(hid.x, hid.z);
  return (
    <group position={[hid.x, y, hid.z]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        {hid.id === "hay" ? <sphereGeometry args={[0.85, 8, 6]} /> : <boxGeometry args={[1.1, 0.9, 0.8]} />}
        <meshLambertMaterial color={hid.id === "hay" ? "#c9a227" : hid.id === "mill" ? "#8a6a38" : "#3d7a48"} />
      </mesh>
      <mesh position={[0.15, 0.72, 0.4]}>
        <sphereGeometry args={[0.08, 6, 5]} />
        <meshLambertMaterial color="#ffe080" />
      </mesh>
    </group>
  );
}
