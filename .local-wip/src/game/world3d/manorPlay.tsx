import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { live } from "./live";
import { lamb } from "./mats";
import { sfx } from "../audio";
import { useGame } from "../store";
import { takeCipher } from "../cipher";

export const MANOR_AT = { x: -48, z: -124 };

const WOOD = "#6a4a28";
const DARK = "#4a3220";
const PLASTER = "#c4b090";
const FLOOR = "#7a5a38";
const FOUR = -((4 / 12) * Math.PI * 2);

function q() {
  return useGame.getState().quests ?? {};
}
function setQ(id: string, n = 1) {
  if ((q()[id] ?? 0) >= n) return;
  useGame.getState().setQuest(id, n);
}
function latched() {
  return (q().manorLatch ?? 0) >= 1 || (q().manorFox ?? 0) >= 1;
}

function local(x: number, z: number) {
  return { x: x - MANOR_AT.x, z: z - MANOR_AT.z };
}

function pushBox(nx: number, nz: number, cx: number, cz: number, hw: number, hd: number, rad = 0.4) {
  const dx = nx - cx;
  const dz = nz - cz;
  const hx = hw + rad;
  const hz = hd + rad;
  if (Math.abs(dx) >= hx || Math.abs(dz) >= hz) return null;
  if (hx - Math.abs(dx) < hz - Math.abs(dz)) return { x: cx + Math.sign(dx || 1) * hx, z: nz };
  return { x: nx, z: cz + Math.sign(dz || 1) * hz };
}

/** Loft + stair height inside the west house. */
export function manorLift(x: number, z: number) {
  if (live.house !== "manor") return 0;
  const p = local(x, z);
  if (p.z < -1.45 && p.x > -2.05) return 2.52;
  if (p.x > 3.28 && p.z < 2.55 && p.z > -1.7) {
    const u = (2.45 - p.z) / 4.15;
    return Math.max(0, Math.min(2.52, u * 2.52));
  }
  return 0;
}

export function collideManor(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house !== "manor") return null;
  let x = nx;
  let z = nz;
  const bump = (hit: { x: number; z: number } | null) => {
    if (hit) {
      x = hit.x;
      z = hit.z;
    }
  };
  bump(pushBox(x, z, MANOR_AT.x + 0.35, MANOR_AT.z + 1.15, 1.15, 0.7, 0.38));
  bump(pushBox(x, z, MANOR_AT.x - 3.6, MANOR_AT.z - 2.4, 0.7, 0.45, 0.34));
  const open = latched();
  if (!open) bump(pushBox(x, z, MANOR_AT.x - 2.18, MANOR_AT.z + 0.15, 0.16, 2.35, 0.32));
  else {
    bump(pushBox(x, z, MANOR_AT.x - 2.18, MANOR_AT.z + 1.55, 0.16, 0.95, 0.32));
    bump(pushBox(x, z, MANOR_AT.x - 2.18, MANOR_AT.z - 1.45, 0.16, 0.85, 0.32));
  }
  bump(pushBox(x, z, MANOR_AT.x + 4.15, MANOR_AT.z + 0.4, 0.55, 2.2, 0.3));
  bump(pushBox(x, z, MANOR_AT.x + 1.35, MANOR_AT.z - 0.72, 3.7, 0.1, 0.28));
  if (open) bump(pushBox(x, z, MANOR_AT.x - 3.65, MANOR_AT.z - 1.1, 0.7, 0.38, 0.3));
  if (x === nx && z === nz) return null;
  return { x, z };
}

export function manorChairs() {
  return [
    { x: MANOR_AT.x + 0.35, z: MANOR_AT.z + 2.05, yaw: Math.PI, id: "n" },
    { x: MANOR_AT.x + 1.45, z: MANOR_AT.z + 1.15, yaw: -Math.PI / 2, id: "e" },
    { x: MANOR_AT.x + 0.35, z: MANOR_AT.z + 0.25, yaw: 0, id: "s" },
    { x: MANOR_AT.x - 0.85, z: MANOR_AT.z + 1.15, yaw: Math.PI / 2, id: "w" },
  ];
}

/** What the player is standing next to, or null. */
export function manorLook(): string | null {
  if (live.house !== "manor") return null;
  const p = local(live.x, live.z);
  const lift = manorLift(live.x, live.z);
  const night = live.dusk > 0.55;
  if (Math.hypot(p.x - 1.55, p.z + 0.62) < 1.4 && lift < 0.45) return "clock";
  if (Math.hypot(p.x + 1.35, p.z + 0.62) < 1.55 && lift < 0.45) return "pics";
  if (Math.hypot(p.x - 0.35, p.z - 1.15) < 1.05 && lift < 0.4) return "book";
  if (night && Math.hypot(p.x + 0.85, p.z - 1.15) < 0.85 && lift < 0.4) return "cup";
  if (Math.abs(p.x + 2.18) < 0.95 && Math.abs(p.z - 0.15) < 1.25 && lift < 0.4) return "door";
  if (lift > 1.8 && Math.hypot(p.x - 0.15, p.z + 3.35) < 1.7) return "bed";
  if (latched() && p.x < -2.35 && Math.hypot(p.x + 3.6, p.z + 0.2) < 1.35) return "desk";
  if (Math.hypot(p.x + 0.4, p.z - 3.4) < 1.1 && lift < 0.4) return "prints";
  return null;
}

/** Called from the world talk handler once F is consumed. */
export function inspectManor(): boolean {
  const id = manorLook();
  if (!id) return false;
  const night = live.dusk > 0.55;
  if (id === "clock") {
    setQ("manorClock");
    live.listen = "The hands do not move. They are both on four.";
    sfx.ok();
  } else if (id === "pics") {
    setQ("manorPic");
    live.listen = night
      ? "Three faces. The fourth frame has eyes tonight. They are not paint."
      : (q().manorDone ?? 0) >= 1
        ? "Three faces. The fourth is only a shape now. It was not there this morning."
        : "Three faces. A fourth frame. Someone scraped the paint down to the wood.";
    sfx.ok();
  } else if (id === "book") {
    setQ("manorBook");
    live.listen = "The last pages were torn out. The binding still has the stubs.";
    sfx.ok();
  } else if (id === "cup") {
    setQ("manorCup");
    live.listen = "The cup was not here in the day. It is still warm.";
    sfx.ok();
  } else if (id === "door") {
    if (!latched()) {
      live.listen = "The latch is on the other side.";
      sfx.thud();
    } else {
      live.listen = "The door is already listening.";
    }
  } else if (id === "bed") {
    setQ("manorUp");
    live.listen = night
      ? "The bed is unmade. The window is open. The shoes are gone."
      : "The bed is unmade. The window is open. The shoes are still here.";
    sfx.ok();
  } else if (id === "desk") {
    setQ("manorDone");
    if (!takeCipher("manor-four", true)) {
      live.listen = night ? "The ink is wet." : "The letter stops mid-line. The ink is not old.";
    }
    sfx.ok();
  } else if (id === "prints") {
    setQ("manorPrints");
    live.listen = night
      ? "The prints are wet. They go under the west door."
      : "Someone walked from the stairs to the west door. Then they stopped.";
    sfx.ok();
  }
  return true;
}

function Chair({ x, z, yaw }: { x: number; z: number; yaw: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[0.56, 0.08, 0.5]} />
        {lamb(WOOD)}
      </mesh>
      {[[-0.2, -0.16], [0.2, -0.16], [-0.2, 0.16], [0.2, 0.16]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.22, lz]} castShadow>
          <boxGeometry args={[0.07, 0.44, 0.07]} />
          {lamb(DARK)}
        </mesh>
      ))}
      <mesh position={[0, 0.82, 0.2]} castShadow>
        <boxGeometry args={[0.56, 0.7, 0.07]} />
        {lamb(WOOD)}
      </mesh>
    </group>
  );
}

function StoppedClock() {
  return (
    <group position={[1.55, 2.22, -0.62]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.48, 0.48, 0.1, 20]} />
        {lamb(DARK)}
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <circleGeometry args={[0.42, 22]} />
        {lamb("#efe6d4")}
      </mesh>
      <group position={[0, 0, 0.09]} rotation={[0, 0, FOUR]}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.05, 0.26, 0.016]} />
          {lamb("#1a1410")}
        </mesh>
      </group>
      <group position={[0, 0, 0.11]} rotation={[0, 0, FOUR]}>
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[0.028, 0.34, 0.016]} />
          {lamb("#6a2018")}
        </mesh>
      </group>
      <mesh position={[0, 0, 0.12]}>
        <sphereGeometry args={[0.035, 8, 6]} />
        {lamb("#c9a227")}
      </mesh>
    </group>
  );
}

function Frames({ night, seen }: { night: boolean; seen: boolean }) {
  const faces = ["#c49674", "#b08060", "#d4a07a", null] as const;
  return (
    <group position={[-1.35, 2.15, -0.64]}>
      {faces.map((skin, i) => (
        <group key={i} position={[i * 0.72, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.62, 0.78, 0.06]} />
            {lamb(DARK)}
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <planeGeometry args={[0.48, 0.62]} />
            {lamb(skin ? "#d8c4a0" : night ? "#8a7a62" : "#c8b898")}
          </mesh>
          {skin ? (
            <>
              <mesh position={[0, 0.08, 0.05]}>
                <sphereGeometry args={[0.14, 8, 6]} />
                {lamb(skin)}
              </mesh>
              <mesh position={[-0.05, 0.12, 0.16]}>
                <sphereGeometry args={[0.025, 6, 4]} />
                {lamb("#1a1410")}
              </mesh>
              <mesh position={[0.05, 0.12, 0.16]}>
                <sphereGeometry args={[0.025, 6, 4]} />
                {lamb("#1a1410")}
              </mesh>
            </>
          ) : night ? (
            <>
              <mesh position={[-0.05, 0.1, 0.055]}>
                <sphereGeometry args={[0.03, 6, 4]} />
                {lamb("#c9a227", { emit: 0.45, emissive: "#c9a227" })}
              </mesh>
              <mesh position={[0.05, 0.1, 0.055]}>
                <sphereGeometry args={[0.03, 6, 4]} />
                {lamb("#c9a227", { emit: 0.45, emissive: "#c9a227" })}
              </mesh>
            </>
          ) : seen ? (
            <mesh position={[0, 0.04, 0.05]}>
              <sphereGeometry args={[0.11, 8, 6]} />
              {lamb("#8a7a68", { emit: 0.08, emissive: "#6a5a48" })}
            </mesh>
          ) : (
            <mesh position={[0, 0.04, 0.05]} rotation={[0, 0, 0.4]}>
              <boxGeometry args={[0.28, 0.04, 0.02]} />
              {lamb("#8a7a60")}
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function Footprints({ night }: { night: boolean }) {
  const spots: [number, number, number][] = [
    [3.15, 1.55, 0.4],
    [2.35, 1.35, 0.15],
    [1.55, 1.2, -0.1],
    [0.7, 1.05, 0.2],
    [-0.15, 0.85, -0.15],
    [-0.95, 0.55, 0.05],
    [-1.65, 0.25, -0.1],
  ];
  return (
    <group>
      {spots.map(([x, z, yaw], i) => (
        <mesh key={i} position={[x, 0.03, z]} rotation={[-Math.PI / 2, 0, yaw]}>
          <circleGeometry args={[0.11, 8]} />
          <meshBasicMaterial
            color={night ? "#3a4a58" : "#5a4a38"}
            transparent
            opacity={night ? 0.55 : 0.28}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function Cup() {
  const steam = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!steam.current) return;
    steam.current.children.forEach((c, i) => {
      c.position.y += dt * 0.35;
      if (c.position.y > 0.55) c.position.y = 0.05;
      const m = c as THREE.Mesh;
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.28 * (1 - c.position.y / 0.55);
      void i;
    });
  });
  return (
    <group position={[-0.85, 0.92, 1.15]}>
      <mesh>
        <cylinderGeometry args={[0.07, 0.06, 0.1, 8]} />
        {lamb("#efe6d4")}
      </mesh>
      <mesh position={[0.08, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.045, 0.012, 6, 8, Math.PI]} />
        {lamb("#efe6d4")}
      </mesh>
      <group ref={steam}>
        {[0.08, 0.2, 0.34].map((y, i) => (
          <mesh key={i} position={[0.02 * i, y, 0]}>
            <sphereGeometry args={[0.03, 6, 4]} />
            <meshBasicMaterial color="#efe6d4" transparent opacity={0.25} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Shoes() {
  return (
    <group position={[0.85, 2.58, -4.15]}>
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.08, 0]} rotation={[0.1, x > 0 ? 0.2 : -0.15, 0]} castShadow>
          <boxGeometry args={[0.16, 0.1, 0.32]} />
          {lamb("#3a2820")}
        </mesh>
      ))}
    </group>
  );
}

export function ManorInterior({ hut, y }: { hut: { x: number; z: number }; y: number }) {
  const sitT = useRef(0);
  const creakT = useRef(7);
  const foxTold = useRef(false);
  const [nightNow, setNight] = useState(live.dusk > 0.55);
  const [open, setOpen] = useState(latched());
  const [done, setDone] = useState((q().manorDone ?? 0) >= 1);

  useFrame((_, dt) => {
    if (live.house !== "manor") {
      live.nearLook = null;
      return;
    }
    const n = live.dusk > 0.55;
    if (n !== nightNow) setNight(n);
    if (latched() !== open) setOpen(latched());
    const saw = (q().manorDone ?? 0) >= 1;
    if (saw !== done) setDone(saw);

    live.nearChair = false;
    live.nearLook = null;

    if (!foxTold.current && (q().manorFox ?? 0) >= 1 && (q().manorLatch ?? 0) < 1) {
      foxTold.current = true;
      setQ("manorLatch");
      setOpen(true);
      live.listen = "The latch is already lifted. Something small sat in the chair.";
    }

    const lift = manorLift(live.x, live.z);
    const upstairs = lift > 1.8;
    const chairs = manorChairs();
    let onChair = false;
    for (const c of chairs) {
      if (Math.hypot(live.x - c.x, live.z - c.z) < 0.62) {
        live.nearChair = true;
        live.sitAt = { x: c.x, z: c.z, yaw: c.yaw };
        live.sitFresh = live.playT;
        onChair = true;
        if (c.id === "w" && live.sit) {
          sitT.current += dt;
          if (sitT.current > 1.15 && (q().manorLatch ?? 0) < 1) {
            setQ("manorLatch");
            setOpen(true);
            sfx.open();
            live.listen = "A latch answered in the west wall.";
          }
        }
        break;
      }
    }
    if (!onChair) sitT.current = 0;
    if (!onChair && !live.sit) live.nearLook = manorLook();

    creakT.current -= dt;
    if (creakT.current <= 0 && !upstairs && !live.talking) {
      creakT.current = 8 + Math.random() * 7;
      sfx.creak();
      if (!live.listen && (q().manorUp ?? 0) < 1) live.listen = "A step, above you. Then nothing.";
    }
  });

  return (
    <group position={[hut.x, y, hut.z]}>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[12.4, 1.1, 11.2]} />
        {lamb("#3a2414")}
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10.6, 9.8]} />
        {lamb(FLOOR)}
      </mesh>
      <mesh position={[0, 3.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10.6, 9.8]} />
        {lamb("#3a2a18")}
      </mesh>
      <mesh position={[0, 1.7, 5.05]} castShadow>
        <boxGeometry args={[10.6, 3.4, 0.28]} />
        {lamb(PLASTER)}
      </mesh>
      <mesh position={[0, 1.7, -5.05]} castShadow>
        <boxGeometry args={[10.6, 3.4, 0.28]} />
        {lamb(PLASTER)}
      </mesh>
      <mesh position={[5.25, 1.7, 0]} castShadow>
        <boxGeometry args={[0.28, 3.4, 9.9]} />
        {lamb(PLASTER)}
      </mesh>
      <mesh position={[-5.25, 1.7, 0]} castShadow>
        <boxGeometry args={[0.28, 3.4, 9.9]} />
        {lamb(PLASTER)}
      </mesh>
      <mesh position={[0, 1.15, 5.18]}>
        <boxGeometry args={[1.7, 2.3, 0.12]} />
        {lamb(DARK)}
      </mesh>
      <mesh position={[2.4, 2.15, 5.22]}>
        <boxGeometry args={[0.7, 0.85, 0.08]} />
        {lamb("#1a1410")}
      </mesh>
      <mesh position={[2.4, 2.15, 5.28]}>
        <boxGeometry args={[0.42, 0.55, 0.04]} />
        {lamb("#f4c878", { emit: nightNow ? 0.9 : 0.55, emissive: "#f0b040" })}
      </mesh>
      <pointLight position={[2.4, 2.2, 5.4]} color="#f4c070" intensity={nightNow ? 9 : 6} distance={7} />

      <mesh position={[-2.18, 1.55, 1.55]} castShadow>
        <boxGeometry args={[0.14, 3.1, 1.9]} />
        {lamb(WOOD)}
      </mesh>
      <mesh position={[-2.18, 1.55, -1.45]} castShadow>
        <boxGeometry args={[0.14, 3.1, 1.7]} />
        {lamb(WOOD)}
      </mesh>
      <group position={[-2.18, 1.35, 0.15]} rotation={[0, open ? -0.85 : 0, 0]}>
        <mesh position={[open ? -0.42 : 0, 0, 0]} castShadow>
          <boxGeometry args={[0.1, 2.55, 1.15]} />
          {lamb(DARK)}
        </mesh>
      </group>

      <mesh position={[0.35, 0.78, 1.15]} castShadow>
        <boxGeometry args={[2.2, 0.12, 1.35]} />
        {lamb(WOOD)}
      </mesh>
      {[[-0.9, -0.5], [0.9, -0.5], [-0.9, 0.5], [0.9, 0.5]].map(([lx, lz], i) => (
        <mesh key={i} position={[0.35 + lx, 0.38, 1.15 + lz]} castShadow>
          <boxGeometry args={[0.1, 0.76, 0.1]} />
          {lamb(DARK)}
        </mesh>
      ))}
      {manorChairs().map((c) => (
        <Chair key={c.id} x={c.x - hut.x} z={c.z - hut.z} yaw={c.yaw} />
      ))}
      {[[0.2, 1.15], [0.55, 1.35], [0.1, 0.9]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.84, lz]} rotation={[-Math.PI / 2, 0, i * 0.4]}>
          <circleGeometry args={[0.16, 10]} />
          {lamb(i === 2 ? "#d8c4a0" : "#efe6d4")}
        </mesh>
      ))}
      <mesh position={[0.2, 0.88, 1.15]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.32, 0.04, 0.24]} />
        {lamb("#efe4cc")}
      </mesh>
      <mesh position={[0.22, 0.92, 1.14]} rotation={[0.08, 0.2, 0]}>
        <boxGeometry args={[0.28, 0.02, 0.2]} />
        {lamb("#d8c4a0")}
      </mesh>
      <mesh position={[0.34, 0.93, 1.12]}>
        <boxGeometry args={[0.12, 0.015, 0.18]} />
        {lamb("#c4b090")}
      </mesh>
      <mesh position={[0.42, 0.93, 1.05]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.08, 0.01, 0.11]} />
        {lamb("#efe6d4")}
      </mesh>

      <StoppedClock />
      <Frames night={nightNow} seen={done} />
      <Footprints night={nightNow} />
      {nightNow ? <Cup /> : null}

      <group position={[-3.7, 0, -2.55]}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[1.4, 1.7, 0.55]} />
          {lamb(DARK)}
        </mesh>
        <mesh position={[0, 1.55, 0.02]}>
          <boxGeometry args={[0.7, 0.85, 0.12]} />
          {lamb("#1a1410")}
        </mesh>
        <pointLight position={[0, 1.7, 0.2]} color="#e87838" intensity={nightNow ? 8 : 3.5} distance={5} />
      </group>

      <group position={[4.05, 0, 0.4]}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[0, 0.14 + i * 0.31, 2.1 - i * 0.46]} castShadow>
            <boxGeometry args={[1.15, 0.12, 0.5]} />
            {lamb(i % 2 ? WOOD : DARK)}
          </mesh>
        ))}
      </group>

      <mesh position={[1.35, 2.5, -2.85]} receiveShadow>
        <boxGeometry args={[7.4, 0.14, 4.3]} />
        {lamb(FLOOR)}
      </mesh>
      <mesh position={[1.35, 1.25, -0.72]}>
        <boxGeometry args={[7.4, 2.5, 0.12]} />
        {lamb(WOOD)}
      </mesh>
      <mesh position={[1.35, 2.72, -0.72]} castShadow>
        <boxGeometry args={[7.4, 0.12, 0.1]} />
        {lamb(DARK)}
      </mesh>
      <group position={[0.15, 2.58, -3.35]}>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[2.1, 0.28, 1.15]} />
          {lamb(DARK)}
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[1.9, 0.12, 0.95]} />
          {lamb("#6a4a58")}
        </mesh>
        <mesh position={[0.55, 0.52, -0.15]}>
          <boxGeometry args={[0.55, 0.18, 0.4]} />
          {lamb("#efe6d4")}
        </mesh>
      </group>
      <mesh position={[-0.7, 4.05, -4.9]}>
        <boxGeometry args={[0.7, 0.9, 0.08]} />
        {lamb("#9ec8e8")}
      </mesh>
      {!nightNow ? <Shoes /> : null}

      {open ? (
        <group position={[-3.65, 0, 0.1]}>
          <mesh position={[0, 0.85, -1.1]} castShadow>
            <boxGeometry args={[1.35, 0.08, 0.7]} />
            {lamb(WOOD)}
          </mesh>
          <mesh position={[-0.4, 1.15, -1.1]} castShadow>
            <boxGeometry args={[0.12, 0.55, 0.12]} />
            {lamb(DARK)}
          </mesh>
          <mesh position={[0.4, 1.15, -1.1]} castShadow>
            <boxGeometry args={[0.12, 0.55, 0.12]} />
            {lamb(DARK)}
          </mesh>
          <mesh position={[0, 1.22, -1.05]} rotation={[0.1, 0.2, 0]}>
            <boxGeometry args={[0.28, 0.02, 0.2]} />
            {lamb("#d8c4a0")}
          </mesh>
          <mesh position={[-0.9, 1.7, 0.4]}>
            <boxGeometry args={[0.08, 1.6, 0.55]} />
            {lamb("#3a4a38")}
          </mesh>
        </group>
      ) : null}

      <pointLight position={[0, 2.4, 1.1]} color="#ffe2b0" intensity={nightNow ? 11 : 16} distance={12} />
      <pointLight position={[1.2, 3.4, -3.1]} color="#f0d080" intensity={6} distance={7} />
      <ambientLight intensity={nightNow ? 0.42 : 0.78} />
    </group>
  );
}
