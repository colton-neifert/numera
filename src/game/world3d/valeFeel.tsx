import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, POND, pondU, standingInWater } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { lamb } from "./mats";
import { LushRiver, waterMaterial, pondLevel } from "./lush/water";
import { CREEK, creekU } from "./lush/waterRuns";

/** Brook between the treehouse and Oakstead. The log starts on the south bank — not across. */
const LOG0 = { x: -16.2, z: -144.6, yaw: 0.15 };
/** South-west bank of the village pond — water you can walk through. */
const FALL = { x: POND.x - 7.4, z: POND.z - POND.r * 0.78 };
const GROTTO = { x: FALL.x - 1.2, z: FALL.z - 5.6 };

function brookU(x: number, z: number) {
  return creekU(x, z);
}

let log = { x: LOG0.x, z: LOG0.z, yaw: LOG0.yaw };
let bridged = false;

export function creekLift(x: number, z: number) {
  if (!bridged) return 0;
  const dx = x - log.x;
  const dz = z - log.z;
  const c = Math.cos(-log.yaw);
  const s = Math.sin(-log.yaw);
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  if (Math.abs(lz) < 0.55 && Math.abs(lx) < 3.2) return 0.42;
  return 0;
}

export function collideCreek(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house || live.doorUse || live.cave) return null;
  if (creekLift(nx, nz) > 0) return null;
  if (creekU(nx, nz) < 0.7) return null;
  const bank = CREEK.half + 0.95;
  return { x: nx, z: nz >= CREEK.z ? CREEK.z + bank : CREEK.z - bank };
}

export function collideLog(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house || bridged) return null;
  const dx = nx - log.x;
  const dz = nz - log.z;
  const c = Math.cos(-log.yaw);
  const s = Math.sin(-log.yaw);
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  if (Math.abs(lx) > 3.15 || Math.abs(lz) > 0.62) return null;
  const out = Math.sign(lz || 1) * 0.62;
  const wx = out * s;
  const wz = out * c;
  return { x: log.x + lx * c + wx, z: log.z - lx * s + wz };
}

const GLADE = { x: -68, z: -158 };
const GLADE_SOLIDS = [
  { dx: -4.2, dz: -2.4, r: 0.55 },
  { dx: 4.6, dz: -1.2, r: 0.48 },
  { dx: 1.2, dz: 5.4, r: 0.6 },
  { dx: -5.1, dz: 3.6, r: 0.42 },
  { dx: 0.2 - 1.15, dz: -1.6, r: 0.42 },
  { dx: 0.2 + 1.15, dz: -1.6, r: 0.42 },
];

export function collideGlade(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house) return null;
  let x = nx;
  let z = nz;
  let hit = false;
  for (const s of GLADE_SOLIDS) {
    const cx = GLADE.x + s.dx;
    const cz = GLADE.z + s.dz;
    const dx = x - cx;
    const dz = z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < s.r * s.r && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = cx + (dx / d) * s.r;
      z = cz + (dz / d) * s.r;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

const STONE0 = { x: GLADE.x + 1.5, z: GLADE.z + 2.8 };
const STONE_SLOT = { x: GLADE.x + 4.1, z: GLADE.z + 3.6 };
let looseStone = { x: STONE0.x, z: STONE0.z };
let stoneSet = false;

export function collideStone(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house) return null;
  const dx = nx - looseStone.x;
  const dz = nz - looseStone.z;
  const r = 0.72;
  const d2 = dx * dx + dz * dz;
  if (d2 >= r * r || d2 < 1e-6) return null;
  const d = Math.sqrt(d2);
  return { x: looseStone.x + (dx / d) * r, z: looseStone.z + (dz / d) * r };
}

function PushStone() {
  const g = useRef<THREE.Group>(null);
  const paid = useRef(false);
  useFrame((_, dt) => {
    if (!stoneSet) {
      const d = Math.hypot(live.x - looseStone.x, live.z - looseStone.z);
      if (d < 1.45 && Math.abs(live.speed) > 1.15 && live.grounded && !live.rolling && !live.talking) {
        looseStone.x += Math.sin(live.yaw) * 2.2 * dt;
        looseStone.z += Math.cos(live.yaw) * 2.2 * dt;
        looseStone.x = Math.max(GLADE.x - 1.5, Math.min(GLADE.x + 6.4, looseStone.x));
        looseStone.z = Math.max(GLADE.z - 1.5, Math.min(GLADE.z + 6.4, looseStone.z));
        if (Math.hypot(looseStone.x - STONE_SLOT.x, looseStone.z - STONE_SLOT.z) < 0.72) {
          stoneSet = true;
          looseStone.x = STONE_SLOT.x;
          looseStone.z = STONE_SLOT.z;
          sfx.ok();
        }
      } else if (d < 1.7 && !live.listen && !live.talking) {
        live.hint = "A heavy stone.";
      }
    }
    if (stoneSet && !paid.current) {
      paid.current = true;
      const n = useGame.getState().addCoins(15);
      if (n > 0) revealItem("coin");
      live.listen = "The stone settles. Coins were under it.";
    }
    if (g.current) g.current.position.set(looseStone.x, heightAt(looseStone.x, looseStone.z) + 0.32, looseStone.z);
  });
  const slotY = heightAt(STONE_SLOT.x, STONE_SLOT.z);
  return (
    <group>
      <group ref={g}>
        <mesh castShadow>
          <dodecahedronGeometry args={[0.58, 0]} />
          {lamb("#6e675c")}
        </mesh>
      </group>
      <mesh position={[STONE_SLOT.x, slotY + 0.03, STONE_SLOT.z]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow>
        <ringGeometry args={[0.62, 0.86, 10]} />
        {lamb("#4e483e")}
      </mesh>
    </group>
  );
}

export function brookSlow(x: number, z: number) {
  if (creekLift(x, z) > 0) return false;
  return brookU(x, z) > 0.45;
}

export function collideFall(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house || live.doorUse) return null;
  if (live.cave) {
    return {
      x: Math.max(GROTTO.x - 1.7, Math.min(GROTTO.x + 1.7, nx)),
      z: Math.max(GROTTO.z - 1.5, Math.min(GROTTO.z + 2.0, nz)),
    };
  }
  const cx = FALL.x;
  const cz = FALL.z - 0.85;
  const dx = nx - cx;
  const dz = nz - cz;
  if (Math.abs(dx) > 3.3 || Math.abs(dz) > 1.35) return null;
  const gap = Math.abs(dx) < 1.05 && nz > FALL.z - 0.7;
  if (gap) return null;
  let x = nx;
  let z = nz;
  if (Math.abs(dx) / 3.3 > Math.abs(dz) / 1.35) x = cx + Math.sign(dx || 1) * 3.3;
  else z = cz + Math.sign(dz || 1) * 1.35;
  return { x, z };
}

export function ValeFeel() {
  return (
    <group>
      <Brook />
      <PushLog />
      <CreekStones />
      <CreekLife />
      <WestGlade />
      <PushStone />
      <WadeRings />
      <PondFall />
    </group>
  );
}

function Brook() {
  const cx = (CREEK.x0 + CREEK.x1) * 0.5;
  const w = CREEK.x1 - CREEK.x0;
  return (
    <group>
      <LushRiver
        pts={[
          [CREEK.x0 - 0.4, CREEK.z],
          [CREEK.x1 + 0.4, CREEK.z],
        ]}
        w={CREEK.half * 1.15}
        lift={0.1}
      />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[cx, heightAt(cx, CREEK.z + s * (CREEK.half + 0.42)) + 0.03, CREEK.z + s * (CREEK.half + 0.38)]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w + 0.8, 0.7]} />
          {lamb("#8a7048", { kind: "dirt" })}
        </mesh>
      ))}
    </group>
  );
}

function PushLog() {
  const g = useRef<THREE.Group>(null);
  const wheel = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const o = log;
    const d = Math.hypot(live.x - o.x, live.z - o.z);
    if (d < 1.45 && Math.abs(live.speed) > 1.15 && !bridged) {
      const push = 6.4 * dt;
      o.x += -Math.sin(live.yaw) * push;
      o.z += -Math.cos(live.yaw) * push;
      o.yaw += (live.yaw - o.yaw) * dt * 0.8;
      o.x = Math.max(CREEK.x0 + 1.2, Math.min(CREEK.x1 - 1.2, o.x));
      o.z = Math.max(CREEK.z - 2.2, Math.min(CREEK.z + 10, o.z));
    }
    if (d < 2.4 && !bridged && creekU(live.x, live.z) > 0.35 && !live.talking && !live.listen) {
      live.hint = "The water runs too fast to wade.";
    }
    const across = Math.abs(o.z - CREEK.z) < 0.7 && o.x > CREEK.x0 + 2 && o.x < CREEK.x1 - 2;
    if (across && !bridged) {
      bridged = true;
      o.z = CREEK.z;
      o.yaw = 1.57;
      if (!live.smashed.creeklog) {
        live.smashed.creeklog = true;
        const n = useGame.getState().addCoins(8);
        if (n > 0) revealItem("coin");
        sfx.ok();
        live.listen = "The log sits across. Two banks. One stick. Reed can use this bank again.";
      }
    }
    if (g.current) {
      g.current.position.set(o.x, heightAt(o.x, o.z) + 0.22, o.z);
      g.current.rotation.y = o.yaw;
    }
    if (wheel.current) wheel.current.visible = !bridged;
  });
  return (
    <group>
      <group ref={g} position={[LOG0.x, heightAt(LOG0.x, LOG0.z) + 0.22, LOG0.z]} rotation={[0, LOG0.yaw, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 6.2, 8]} />
          {lamb("#6a4a28", { kind: "wood" })}
        </mesh>
        <mesh position={[2.9, 0.08, 0.04]} rotation={[0.4, 0.2, 0.5]} castShadow>
          <sphereGeometry args={[0.18, 6, 5]} />
          {lamb("#5a3a20", { kind: "wood" })}
        </mesh>
      </group>
      <group ref={wheel} position={[LOG0.x + 1.4, heightAt(LOG0.x + 1.4, LOG0.z + 0.8) + 0.28, LOG0.z + 0.8]} rotation={[1.2, 0.4, 0.2]}>
        <mesh castShadow>
          <torusGeometry args={[0.34, 0.06, 6, 10]} />
          {lamb("#4a3420", { kind: "wood" })}
        </mesh>
        <mesh rotation={[0, 0.2, 0.4]}>
          <boxGeometry args={[0.5, 0.04, 0.08]} />
          {lamb("#6a4a28", { kind: "wood" })}
        </mesh>
      </group>
    </group>
  );
}

function CreekStones() {
  const spots = [
    { x: -28.4, z: -138.2, s: 0.55 },
    { x: -6.2, z: -139.4, s: 0.42 },
    { x: -20.5, z: -148.8, s: 0.7 },
    { x: -11.4, z: -129.6, s: 0.48 },
  ];
  return (
    <group>
      {spots.map((p, i) => (
        <mesh key={i} position={[p.x, heightAt(p.x, p.z) + p.s * 0.28, p.z]} castShadow>
          <dodecahedronGeometry args={[p.s, 0]} />
          {lamb(i % 2 ? "#7a756c" : "#8a8074", { kind: "stone" })}
        </mesh>
      ))}
    </group>
  );
}

function WestGlade() {
  const x = -68;
  const z = -158;
  const y = heightAt(x, z);
  const trees = [
    { dx: -4.2, dz: -2.4, h: 4.6, r: 1.7, leaf: "#2f6a34" },
    { dx: 4.6, dz: -1.2, h: 3.4, r: 1.25, leaf: "#3d7a40" },
    { dx: 1.2, dz: 5.4, h: 5.2, r: 1.9, leaf: "#245c30" },
    { dx: -5.1, dz: 3.6, h: 2.8, r: 1.05, leaf: "#4a8a48" },
  ];
  return (
    <group position={[x, y, z]}>
      {trees.map((t, i) => (
        <group key={i} position={[t.dx, 0, t.dz]}>
          <mesh position={[0, t.h * 0.32, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.28, t.h * 0.64, 6]} />
            {lamb("#5a3a24")}
          </mesh>
          <mesh position={[0, t.h * 0.72, 0]} castShadow>
            <sphereGeometry args={[t.r, 8, 6]} />
            {lamb(t.leaf)}
          </mesh>
          <mesh position={[t.r * 0.45, t.h * 0.62, 0.2]} castShadow>
            <sphereGeometry args={[t.r * 0.62, 7, 5]} />
            {lamb(i % 2 ? "#3f8a44" : "#2a6234")}
          </mesh>
        </group>
      ))}
      <mesh position={[1.6, 0.28, 0.4]} rotation={[0.08, 0.4, 1.35]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 3.4, 6]} />
        {lamb("#6a4a2c")}
      </mesh>
      {[-1.2, 0.2, 1.4].map((s, i) => (
        <mesh key={s} position={[-2.2 + i * 0.35, 0.12, 1.1 + s * 0.15]} castShadow>
          <sphereGeometry args={[0.16 + i * 0.04, 6, 5]} />
          {lamb(i === 1 ? "#c45a48" : "#8a6848")}
        </mesh>
      ))}
      <group position={[0.2, 0, -1.6]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 1.15, 1.15, 0]} castShadow>
            <boxGeometry args={[0.42, 2.3, 0.42]} />
            {lamb("#7a7368")}
          </mesh>
        ))}
        <mesh position={[0, 2.2, 0]} castShadow>
          <boxGeometry args={[2.7, 0.38, 0.5]} />
          {lamb("#6a645c")}
        </mesh>
      </group>
      {[-8, -5.5, -3].map((dx, i) => (
        <mesh key={dx} position={[dx + 2, 0.06, 1.8 - i * 0.4]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow>
          <circleGeometry args={[0.55, 7]} />
          {lamb("#b89a6a")}
        </mesh>
      ))}
    </group>
  );
}

function CreekLife() {
  const g = useRef<THREE.Group>(null);
  const x = -18.6;
  const z = -149.4;
  const y = heightAt(x, z);
  useFrame(({ clock }) => {
    const root = g.current;
    if (!root) return;
    const t = clock.elapsedTime;
    root.children.forEach((c, i) => {
      const a = t * 0.65 + i * 2.05;
      c.position.set(Math.cos(a) * (0.9 + i * 0.35), 0.7 + Math.sin(t * 2.2 + i) * 0.22, Math.sin(a * 0.85) * 0.8);
      c.rotation.y = a;
    });
  });
  return (
    <group ref={g} position={[x, y, z]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[0.4, 0, 0]}>
          <planeGeometry args={[0.18, 0.1]} />
          {lamb(i === 1 ? "#e8c84a" : "#f6f1e4")}
        </mesh>
      ))}
    </group>
  );
}

function WadeRings() {
  const rings = useRef<THREE.Mesh[]>([]);
  const t = useRef(0);
  const wasWet = useRef(false);
  useFrame((_, dt) => {
    const pond = pondU(live.x, live.z) > 0.4;
    const wet = standingInWater(live.x, live.z) || live.swim;
    if (wet && !wasWet.current && Math.abs(live.speed) > 1.2) t.current = 0;
    wasWet.current = wet;
    if (wet && Math.abs(live.speed) > 0.45) t.current += dt * (live.swim ? 1.6 : 2.6);
    const gy = pond || live.swim ? pondSurfaceY() + 0.03 : heightAt(live.x, live.z) + 0.05;
    const side = Math.cos(live.yaw);
    const fwd = Math.sin(live.yaw);
    rings.current.forEach((m, i) => {
      if (!m) return;
      const u = (t.current + i * 0.28) % 1.15;
      const on = wet && u < 1;
      m.visible = on;
      if (!on) return;
      const s = 0.32 + u * 1.85;
      m.scale.set(s, s, s);
      const foot = (i % 2) * 0.34 - 0.17;
      m.position.set(live.x + side * foot, gy, live.z + fwd * foot);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.42 * (1 - u) * (pond ? 0.85 : 1));
    });
  });
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) rings.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <ringGeometry args={[0.26, 0.34, 18]} />
          <meshBasicMaterial color="#d8eef0" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function PondFall() {
  const sheets = useRef<(THREE.Mesh | null)[]>([]);
  const mist = useRef<THREE.Mesh>(null);
  const going = useRef<"" | "in" | "out">("");
  const t = useRef(0);
  const yCave = heightAt(GROTTO.x, GROTTO.z);
  const yPond = pondLevel(POND.x, POND.z, POND.r);
  useFrame(({ clock }, dt) => {
    if (live.house) return;
    const t0 = clock.elapsedTime;
    sheets.current.forEach((m, i) => {
      if (!m) return;
      const scroll = (t0 * 1.8 + i * 0.35) % 1.4;
      m.position.y = yPond + 3.15 - scroll;
      const mat = m.material as THREE.MeshBasicMaterial;
      if (mat.opacity !== undefined) mat.opacity = 0.48 + Math.sin(t0 * 4 + i) * 0.1;
    });
    if (mist.current) {
      const s = 1 + Math.sin(t0 * 2.4) * 0.12;
      mist.current.scale.set(s * 1.4, s, s * 1.1);
      mist.current.position.y = yPond + 0.85 + Math.sin(t0 * 1.7) * 0.1;
    }
    const dFall = Math.hypot(live.x - FALL.x, live.z - FALL.z);
    const dCave = Math.hypot(live.x - GROTTO.x, live.z - GROTTO.z);
    if (!going.current && !live.cave && dFall < 1.65 && live.z < FALL.z + 1.0 && live.z > FALL.z - 1.2) {
      going.current = "in";
      t.current = 0;
      live.speed = 0;
    }
    if (!going.current && live.cave && dCave < 1.8 && live.z > GROTTO.z + 1.35) {
      going.current = "out";
      t.current = 0;
      live.speed = 0;
    }
    if (going.current) {
      t.current += dt;
      const u = Math.min(1, t.current / 1.05);
      if (u < 0.5) live.roomFade = u / 0.5;
      else {
        live.roomFade = 1 - (u - 0.5) / 0.5;
        live.roomFadeOut = true;
      }
      live.speed = 0;
      if (u > 0.48 && u < 0.56) {
        if (going.current === "in") {
          live.x = GROTTO.x;
          live.z = GROTTO.z;
          live.y = yCave + 0.2;
          live.cave = true;
          live.wetT = 3;
          if (!live.smashed.fallcave) {
            live.smashed.fallcave = true;
            const n = useGame.getState().addCoins(12);
            if (n > 0) revealItem("coin");
            sfx.ok();
          }
        } else {
          live.x = FALL.x;
          live.z = FALL.z + 1.5;
          live.y = yPond + 0.2;
          live.cave = false;
          live.wetT = 2;
        }
      }
      if (u >= 1) {
        going.current = "";
        live.roomFade = 0;
        live.roomFadeOut = false;
      }
    }
    if (live.cave) live.dusk = Math.max(live.dusk, 0.78);
  });
  return (
    <group>
      <mesh position={[FALL.x, yPond + 3.6, FALL.z - 0.85]} castShadow>
        <boxGeometry args={[6.4, 7.4, 2.4]} />
        {lamb("#5a4c3c")}
      </mesh>
      <mesh position={[FALL.x, yPond + 7.15, FALL.z - 0.35]} castShadow>
        <boxGeometry args={[5.2, 0.85, 2.2]} />
        {lamb("#3e362c")}
      </mesh>
      {[-2.2, 0, 2.2].map((s) => (
        <mesh key={`r${s}`} position={[FALL.x + s, yPond + 2.1, FALL.z + 0.15]} rotation={[0.12, 0, s * 0.08]} castShadow>
          <dodecahedronGeometry args={[1.35, 0]} />
          {lamb("#4a3e32")}
        </mesh>
      ))}
      {[-1.05, -0.35, 0.35, 1.05].map((s, i) => (
        <mesh
          key={s}
          ref={(el) => {
            sheets.current[i] = el;
          }}
          position={[FALL.x + s * 0.85, yPond + 3.55, FALL.z + 0.42]}
          rotation={[0.18, 0, s * 0.03]}
        >
          <boxGeometry args={[0.95, 7.2, 0.14]} />
          <meshBasicMaterial color="#b5dbe8" transparent opacity={0.52} depthWrite={false} />
        </mesh>
      ))}
      {[-0.7, 0.7].map((s, i) => (
        <mesh key={`w${s}`} position={[FALL.x + s, yPond + 3.4, FALL.z + 0.55]} rotation={[0.22, 0, 0]}>
          <boxGeometry args={[0.55, 6.6, 0.1]} />
          <meshBasicMaterial color="#d8eef4" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
      <mesh position={[FALL.x, yPond + 7.05, FALL.z + 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.4, 1.15]} />
        <primitive object={waterMaterial()} attach="material" />
      </mesh>
      <mesh ref={mist} position={[FALL.x, yPond + 0.85, FALL.z + 1.35]}>
        <sphereGeometry args={[1.45, 8, 6]} />
        <meshBasicMaterial color="#eef6f8" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <mesh position={[FALL.x, yPond + 0.05, FALL.z + 1.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.05, 14]} />
        <primitive object={waterMaterial()} attach="material" />
      </mesh>
      {[-1.6, 1.6].map((s) => (
        <mesh key={`moss${s}`} position={[FALL.x + s * 1.5, yPond + 1.55, FALL.z + 0.55]}>
          <sphereGeometry args={[0.42, 6, 5]} />
          {lamb("#4a7a38")}
        </mesh>
      ))}
      <group position={[GROTTO.x, yCave, GROTTO.z]}>
        <mesh position={[0, 1.45, 2.35]} castShadow>
          <boxGeometry args={[4.8, 2.9, 0.5]} />
          {lamb("#2a2218")}
        </mesh>
        {[-2.2, 2.2].map((s) => (
          <mesh key={s} position={[s, 1.45, 0.35]} castShadow>
            <boxGeometry args={[0.45, 2.9, 4.2]} />
            {lamb("#2a2218")}
          </mesh>
        ))}
        <mesh position={[0, 2.95, 0.35]}>
          <boxGeometry args={[4.8, 0.3, 4.4]} />
          {lamb("#1a140e")}
        </mesh>
        <mesh position={[0, 0.3, 0.5]} castShadow>
          <boxGeometry args={[0.55, 0.4, 0.4]} />
          {lamb("#6a4a28")}
        </mesh>
        <mesh position={[0, 0.62, 0.15]} castShadow>
          <boxGeometry args={[0.55, 0.28, 0.4]} />
          <meshLambertMaterial color="#c9a227" emissive="#c9a227" emissiveIntensity={live.smashed.fallcave ? 0 : 0.45} />
        </mesh>
        <mesh position={[0.78, 0.34, 1.2]}>
          <sphereGeometry args={[0.16, 6, 5]} />
          <meshLambertMaterial color="#68a050" emissive="#3a6a28" emissiveIntensity={0.85} />
        </mesh>
      </group>
    </group>
  );
}
