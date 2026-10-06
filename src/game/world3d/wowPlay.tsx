import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  heightAt,
  KEEP_Z,
  LOOK_AT,
  VX,
  VZ,
  ELDER_OAK,
  WATCH_SPIRE,
  HORN_PEAK,
  GLOW_GLADE,
  WOW_CART,
  WOW_BRIDGE,
  WOW_CLEAR,
  POND,
} from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { Near } from "./nearMount";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";

/** Places Fang turns to look at when the player is still. */
export const FANG_LOOKS: { x: number; z: number; r: number }[] = [
  { x: LOOK_AT.x, z: LOOK_AT.z, r: 18 },
  { x: WATCH_SPIRE.x, z: WATCH_SPIRE.z, r: 22 },
  { x: ELDER_OAK.x, z: ELDER_OAK.z, r: 20 },
  { x: WOW_CART.x, z: WOW_CART.z, r: 8 },
  { x: 0, z: KEEP_Z, r: 40 },
  { x: HORN_PEAK.x, z: HORN_PEAK.z, r: 50 },
  { x: GLOW_GLADE.x, z: GLOW_GLADE.z, r: 12 },
];

export function collideWow(nx: number, nz: number): { x: number; z: number } | null {
  const hits: [number, number, number][] = [
    [WATCH_SPIRE.x, WATCH_SPIRE.z, 1.55],
    [ELDER_OAK.x, ELDER_OAK.z, 1.85],
    [WOW_CART.x, WOW_CART.z, 1.15],
  ];
  let x = nx;
  let z = nz;
  let hit = false;
  for (const [cx, cz, r] of hits) {
    const dx = x - cx;
    const dz = z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = cx + (dx / d) * r;
      z = cz + (dz / d) * r;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

export function WowPlay() {
  return (
    <group>
      <WatchSpire />
      <ElderOak />
      <HornPeak />
      <SunsetHill />
      <KeepRoadStories />
      <Near x={WOW_CLEAR.x} z={WOW_CLEAR.z} r={36}>
        <SunClearing />
      </Near>
      <Near x={GLOW_GLADE.x} z={GLOW_GLADE.z} r={40}>
        <GlowGlade />
      </Near>
      <VillageHearths />
      <WowPlaces />
    </group>
  );
}

function WatchSpire() {
  const y = heightAt(WATCH_SPIRE.x, WATCH_SPIRE.z);
  const flag = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 1.6) * 0.28;
  });
  return (
    <group position={[WATCH_SPIRE.x, y, WATCH_SPIRE.z]}>
      <mesh position={[0, 9.4, 0]} castShadow>
        <cylinderGeometry args={[1.35, 1.7, 18.8, 8]} />
        {lamb("#8a8478", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 18.9, 0]} castShadow>
        <cylinderGeometry args={[1.55, 1.45, 0.42, 8]} />
        {lamb("#9a9488", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 21.4, 0]} rotation={[0, Math.PI / 8, 0]} castShadow>
        <coneGeometry args={[2.05, 4.6, 4]} />
        {lamb("#6a3a28")}
      </mesh>
      <mesh position={[0, 19.35, 1.42]}>
        <boxGeometry args={[0.55, 0.85, 0.12]} />
        {lamb("#1a1814")}
      </mesh>
      <mesh position={[0, 2.2, 1.72]} castShadow>
        <boxGeometry args={[0.85, 2.4, 0.18]} />
        {lamb("#3a2a1c")}
      </mesh>
      <mesh position={[0.05, 12.4, 0]} rotation={[Math.PI / 2, 0.4, 0]}>
        <torusGeometry args={[1.48, 0.07, 5, 12]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      <mesh ref={flag} position={[0.15, 23.5, 0.05]}>
        <boxGeometry args={[0.05, 1.15, 1.35]} />
        {lamb("#a83828")}
      </mesh>
      <mesh position={[0, 24.15, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 1.6, 5]} />
        {lamb("#4a3220")}
      </mesh>
    </group>
  );
}

function ElderOak() {
  const y = heightAt(ELDER_OAK.x, ELDER_OAK.z);
  const birds = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (birds.current) birds.current.rotation.y = clock.elapsedTime * 0.22;
  });
  return (
    <group position={[ELDER_OAK.x, y, ELDER_OAK.z]}>
      <mesh position={[0, 6.4, 0]} castShadow>
        <cylinderGeometry args={[1.55, 2.15, 12.8, 8]} />
        {lamb("#5a3d24", { kind: "wood" })}
      </mesh>
      <mesh position={[1.4, 8.6, 0.4]} rotation={[0.2, 0.4, 0.55]} castShadow>
        <cylinderGeometry args={[0.38, 0.62, 5.4, 6]} />
        {lamb("#4a3220", { kind: "wood" })}
      </mesh>
      <mesh position={[-1.2, 9.2, -0.6]} rotation={[-0.15, -0.5, -0.45]} castShadow>
        <cylinderGeometry args={[0.32, 0.55, 4.8, 6]} />
        {lamb("#4a3220", { kind: "wood" })}
      </mesh>
      {[
        [0, 14.2, 0, 5.4],
        [3.2, 13.1, 1.8, 3.6],
        [-3.4, 13.4, -1.4, 3.4],
        [1.6, 15.6, -2.2, 3.1],
        [-2.0, 15.2, 2.4, 2.9],
        [4.1, 12.4, -1.6, 2.5],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]} castShadow>
          <sphereGeometry args={[p[3], 8, 6]} />
          {lamb(i % 2 ? "#245a28" : "#2a6a32")}
        </mesh>
      ))}
      <group ref={birds} position={[0, 16.4, 0]}>
        {[0, 2.1, 4.2].map((a) => (
          <mesh key={a} position={[Math.cos(a) * 6.4, Math.sin(a * 1.3) * 0.8, Math.sin(a) * 6.4]} rotation={[0.4, a, 0.2]}>
            <boxGeometry args={[0.55, 0.06, 0.22]} />
            {lamb("#2a2824")}
          </mesh>
        ))}
      </group>
      <mesh position={[2.4, 0.12, 1.6]} rotation={[0.1, 0.4, 0.08]} castShadow>
        <boxGeometry args={[1.15, 0.22, 0.42]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
    </group>
  );
}

function HornPeak() {
  const y = heightAt(HORN_PEAK.x, HORN_PEAK.z) - 6;
  return (
    <group position={[HORN_PEAK.x, y, HORN_PEAK.z]}>
      <mesh position={[0, 18, 0]} castShadow>
        <coneGeometry args={[22, 44, 7]} />
        {lamb("#6a7a68")}
      </mesh>
      <mesh position={[-7.4, 28, -4.2]} rotation={[0, 0.4, -0.18]} castShadow>
        <coneGeometry args={[7.4, 26, 6]} />
        {lamb("#5a6e62")}
      </mesh>
      <mesh position={[6.2, 24, 3.4]} rotation={[0.08, -0.3, 0.22]} castShadow>
        <coneGeometry args={[6.2, 18, 6]} />
        {lamb("#748878")}
      </mesh>
      <mesh position={[-2, 38, -1]} rotation={[0.15, 0.2, -0.12]}>
        <coneGeometry args={[3.4, 10, 5]} />
        {lamb("#e8ecec")}
      </mesh>
    </group>
  );
}

function SunsetHill() {
  const y = heightAt(LOOK_AT.x, LOOK_AT.z);
  const grass = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!grass.current) return;
    const w = Math.sin(clock.elapsedTime * 1.15) * 0.08;
    grass.current.rotation.z = w;
  });
  return (
    <group position={[LOOK_AT.x, y, LOOK_AT.z]}>
      <mesh position={[0.85, 0.22, 0.55]} rotation={[0.05, 0.6, 0]} castShadow>
        <boxGeometry args={[1.35, 0.22, 0.42]} />
        {lamb("#8a8478", { kind: "stone" })}
      </mesh>
      <mesh position={[0.85, 0.42, 0.72]} rotation={[-0.35, 0.6, 0]} castShadow>
        <boxGeometry args={[1.35, 0.12, 0.55]} />
        {lamb("#9a9488", { kind: "stone" })}
      </mesh>
      <group ref={grass} position={[0, 0.05, 0]}>
        {[-1.6, -0.6, 0.4, 1.4, 2.2].map((x, i) => (
          <mesh key={i} position={[x, 0.35, -1.1 + (i % 3) * 0.7]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[0.08, 0.7, 0.08]} />
            {lamb(i % 2 ? "#5a8a38" : "#4a7a30")}
          </mesh>
        ))}
      </group>
    </group>
  );
}

function KeepRoadStories() {
  const yCart = heightAt(WOW_CART.x, WOW_CART.z);
  const yBr = heightAt(WOW_BRIDGE.x, WOW_BRIDGE.z);
  return (
    <group>
      <group position={[WOW_CART.x, yCart, WOW_CART.z]} rotation={[0, 0.35, 0]}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[1.85, 0.55, 1.05]} />
          {lamb("#6a4a28", { kind: "wood" })}
        </mesh>
        <mesh position={[0, 0.95, 0]} rotation={[0, 0, 0.18]} castShadow>
          <boxGeometry args={[1.7, 0.12, 0.95]} />
          {lamb("#5a3d24", { kind: "wood" })}
        </mesh>
        {[-0.55, 0.55].map((z) =>
          [-0.55, 0.55].map((x) => (
            <mesh key={`${x}${z}`} position={[x, 0.32, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <torusGeometry args={[0.28, 0.06, 5, 10]} />
              {lamb("#3a3228")}
            </mesh>
          )),
        )}
        <mesh position={[0.85, 0.22, 0.15]} rotation={[0.4, 0.2, 0.5]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 1.15, 5]} />
          {lamb("#4a3220")}
        </mesh>
        <mesh position={[-0.15, 0.08, 1.15]} rotation={[0.1, 0.4, 0]}>
          <boxGeometry args={[0.22, 0.08, 0.18]} />
          {lamb("#c9a227")}
        </mesh>
      </group>
      <group position={[WOW_BRIDGE.x, yBr, WOW_BRIDGE.z]}>
        {[-1.55, 1.55].map((x) => (
          <mesh key={x} position={[x, 0.55, 0]} castShadow>
            <boxGeometry args={[0.18, 1.1, 4.4]} />
            {lamb("#5a3d24", { kind: "wood" })}
          </mesh>
        ))}
        <mesh position={[0, 1.05, -1.55]} castShadow>
          <boxGeometry args={[3.2, 0.14, 1.35]} />
          {lamb("#6a4a28", { kind: "wood" })}
        </mesh>
        <mesh position={[0.35, 0.55, 1.65]} rotation={[0.55, 0.1, 0.2]} castShadow>
          <boxGeometry args={[2.8, 0.14, 1.15]} />
          {lamb("#5a3d24", { kind: "wood" })}
        </mesh>
        <mesh position={[0, -0.15, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.4, 2.8]} />
          {lamb("#3a4a38")}
        </mesh>
      </group>
      {/* Footprints peeling off the road toward the glow glade. */}
      {Array.from({ length: 7 }, (_, i) => {
        const t = i / 6;
        const x = WOW_CART.x - 2.4 - t * 18;
        const z = WOW_CART.z + 1.2 + t * 22;
        const y = heightAt(x, z);
        return (
          <mesh key={i} position={[x, y + 0.03, z]} rotation={[-Math.PI / 2, 0, t * 0.4]}>
            <circleGeometry args={[0.12, 6]} />
            {lamb("#5a4630")}
          </mesh>
        );
      })}
    </group>
  );
}

function SunClearing() {
  const y = heightAt(WOW_CLEAR.x, WOW_CLEAR.z);
  const shafts = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!shafts.current) return;
    const a = 0.1 + Math.sin(clock.elapsedTime * 0.35) * 0.04;
    shafts.current.children.forEach((c, i) => {
      const m = c as THREE.Mesh;
      const mat = m.material as THREE.MeshBasicMaterial;
      if (mat.opacity !== undefined) mat.opacity = a + i * 0.02;
    });
  });
  return (
    <group position={[WOW_CLEAR.x, y, WOW_CLEAR.z]}>
      <group ref={shafts}>
        {[-1.4, 0.2, 1.6].map((x, i) => (
          <mesh key={i} position={[x, 4.2, -0.4]} rotation={[0.35, 0.15, x * 0.04]}>
            <planeGeometry args={[1.15, 8.4]} />
            <meshBasicMaterial color="#f4e4b0" transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
      {[
        [-1.8, 0.9],
        [1.4, -0.6],
        [0.4, 1.6],
        [-0.8, -1.4],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.12, z]}>
          <sphereGeometry args={[0.16 + (i % 3) * 0.04, 6, 5]} />
          {lamb(i % 2 ? "#c45c48" : "#8a3a28")}
        </mesh>
      ))}
      <mesh position={[0.8, 0.08, 0.4]} rotation={[0.2, 0.4, 0.1]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 1.35, 5]} />
        {lamb("#5a3d24", { kind: "wood" })}
      </mesh>
    </group>
  );
}

function GlowGlade() {
  const y = heightAt(GLOW_GLADE.x, GLOW_GLADE.z);
  const glow = useRef<THREE.Mesh>(null);
  const marks = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const night = live.dusk > 0.45;
    if (glow.current) {
      glow.current.visible = night;
      const s = 1.4 + Math.sin(clock.elapsedTime * 1.4) * 0.18;
      glow.current.scale.setScalar(s);
    }
    if (marks.current) marks.current.visible = night;
  });
  return (
    <group position={[GLOW_GLADE.x, y, GLOW_GLADE.z]}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.32, 2.3, 6]} />
        {lamb("#4a3220", { kind: "wood" })}
      </mesh>
      <group ref={marks} position={[0, 1.55, 0.24]} visible={false}>
        {[-0.12, 0, 0.12].map((x, i) => (
          <mesh key={i} position={[x, i * 0.18, 0]}>
            <boxGeometry args={[0.08, 0.05, 0.02]} />
            <meshBasicMaterial color="#7eb8b0" />
          </mesh>
        ))}
      </group>
      <mesh ref={glow} position={[0, 1.7, 0]} visible={false}>
        <sphereGeometry args={[0.85, 8, 6]} />
        <meshBasicMaterial color="#7eb8b0" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh position={[1.1, 0.18, 0.4]}>
        <sphereGeometry args={[0.22, 6, 5]} />
        {lamb("#3d8a48")}
      </mesh>
    </group>
  );
}

function VillageHearths() {
  const stacks: [number, number][] = [
    [VX - 8.4, VZ + 6.2],
    [VX + 10.2, VZ - 4.4],
    [VX + 3.2, VZ + 11.4],
    [POND.x + 14, POND.z + 6],
  ];
  return (
    <group>
      {stacks.map(([x, z], i) => (
        <Chimney key={i} x={x} z={z} />
      ))}
    </group>
  );
}

function Chimney({ x, z }: { x: number; z: number }) {
  const puffs = useRef<THREE.Mesh[]>([]);
  const y = heightAt(x, z);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    puffs.current.forEach((m, i) => {
      if (!m) return;
      const u = ((t * 0.18 + i * 0.33) % 1);
      m.position.y = 4.4 + u * 3.6;
      m.position.x = Math.sin(t * 0.4 + i) * 0.35;
      const s = 0.35 + u * 0.7;
      m.scale.setScalar(s);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - u) * 0.22 * (0.45 + live.dusk * 0.55);
    });
  });
  return (
    <group position={[x, y, z]}>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) puffs.current[i] = el;
          }}
          position={[0, 4.4, 0]}
        >
          <sphereGeometry args={[0.45, 6, 5]} />
          <meshBasicMaterial color="#c8c4bc" transparent opacity={0.15} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function WowPlaces() {
  const still = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const dHill = Math.hypot(live.x - LOOK_AT.x, live.z - LOOK_AT.z);
    if (dHill < 4.2 && live.stillT > 1.2) {
      still.current += dt;
      if (still.current > 2.8 && !live.smashed.sunsetHill) {
        live.smashed.sunsetHill = true;
        const n = useGame.getState().addCoins(8);
        if (n > 0) revealItem("coin");
        sfx.ok();
      }
    } else still.current = 0;
    if (Math.hypot(live.x - WATCH_SPIRE.x, live.z - WATCH_SPIRE.z) < 8 && !live.smashed.placeWatch) {
      live.smashed.placeWatch = true;
      live.banner = "The Watch";
    }
    if (Math.hypot(live.x - ELDER_OAK.x, live.z - ELDER_OAK.z) < 10 && !live.smashed.placeElder) {
      live.smashed.placeElder = true;
      live.banner = "The Elder Oak";
    }
    if (dHill < 6 && !live.smashed.placeHill) {
      live.smashed.placeHill = true;
      live.banner = "Sunset Hill";
    }
    if (Math.hypot(live.x - HORN_PEAK.x, live.z - HORN_PEAK.z) < 28 && !live.smashed.placeHorn) {
      live.smashed.placeHorn = true;
      live.banner = "Horn Peak";
    }
    if (Math.hypot(live.x - GLOW_GLADE.x, live.z - GLOW_GLADE.z) < 5 && live.night && !live.smashed.placeGlow) {
      live.smashed.placeGlow = true;
      live.banner = "A Quiet Light";
    }
  });
  return null;
}
