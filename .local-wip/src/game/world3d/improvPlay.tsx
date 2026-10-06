import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { lamb } from "./mats";
import { STUFF_AT, stuffWorld } from "./stuff";
import { millOpen, SNAP, stepImprov, vineCut, woodCapsCut } from "./improv";
import { takeCipher } from "../cipher";

function pay(n: number, key: string, line?: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
  if (line) live.listen = line;
}

export function ImprovPlay() {
  return (
    <group>
      <ImprovSim />
      <SnapjawBend />
      <MillDitch />
      <WoodSlope />
    </group>
  );
}

function ImprovSim() {
  useFrame(() => {
    if (live.house || live.paused) return;
    stepImprov();
    const w = stuffWorld();
    const snap = w.gaps.find((g) => g.id === "gap-snap");
    if (snap?.bridged) {
      pay(14, "improv-snap", "The bark remembered the other bank.");
      takeCipher("snap-bend", false);
    }
    const mill = w.gaps.find((g) => g.id === "gap-mill");
    if (mill?.bridged) pay(10, "improv-mill", "The plank sat. The ditch forgot it was in a hurry.");
    const wood = w.gaps.find((g) => g.id === "gap-wood");
    if (wood?.bridged) pay(12, "improv-wood", "The hill finished what it started.");
  }, -2);
  return null;
}

function SnapjawBend() {
  const S = SNAP;
  const gy = heightAt(S.x, S.z);
  const vine = useRef<THREE.Group>(null);
  const chock = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Group>(null);
  const jawP = useRef({ x: S.x, z: S.z, dive: 0 });
  useFrame((_, dt) => {
    if (live.house) return;
    const w = stuffWorld();
    const log = w.things.find((t) => t.id === "log-snap");
    const rock = w.things.find((t) => t.id === "rock-snap");
    const gap = w.gaps.find((g) => g.id === "gap-snap");
    const d = Math.hypot(live.x - S.x, live.z - S.z);

    if (log && live.slash && Math.hypot(live.slash.x - log.x, live.slash.z - log.z) < 1.7) {
      if (!live.smashed["snap-vine"]) {
        live.smashed["snap-vine"] = true;
        sfx.swing();
        live.listen = "Green cords let go. The bark is still sitting like it was planted.";
      }
    }

    if (log?.pinned && Math.hypot(live.x - (log.x), live.z - log.z) < 1.6 && Math.abs(live.speed) > 1.4) {
      live.listen = live.listen || "It does not even lean.";
    }

    if (vine.current) {
      vine.current.visible = !vineCut() && Boolean(log) && !log?.dead;
      if (log && vine.current.visible) vine.current.position.set(log.x - S.x, log.y - gy + 0.2, log.z - S.z);
    }
    if (chock.current && rock) {
      const home = Math.hypot(rock.x - (S.x + 6.3), rock.z - (S.z + 6.5));
      chock.current.visible = home < 1.4;
      chock.current.position.set(rock.x - S.x, heightAt(rock.x, rock.z) - gy + 0.08, rock.z - S.z);
    }

    const j = jawP.current;
    const bridged = Boolean(gap?.bridged);
    j.dive += ((bridged ? 1 : 0) - j.dive) * Math.min(1, dt * 2.4);
    if (!bridged) {
      j.x = S.x + Math.sin(live.playT * 0.9) * 1.8;
      j.z = S.z + Math.cos(live.playT * 1.1) * 0.45;
    }
    if (jaw.current) {
      jaw.current.visible = j.dive < 0.92 && d < 70 && !live.house;
      jaw.current.position.set(j.x - S.x, gy - 0.05 - j.dive * 1.4 - gy + (heightAt(S.x, S.z) - gy), j.z - S.z);
      jaw.current.position.y = -0.05 - j.dive * 1.35 + Math.sin(live.playT * 3) * 0.04 * (1 - j.dive);
      jaw.current.rotation.y = Math.atan2(-(live.x - j.x), -(live.z - j.z));
    }
    if (d < 14) live.fangMark = { x: j.x, z: j.z, kind: "clamp" };
    if (d < 7 && !bridged && !live.listen) live.listen = "The water has a mouth. The other bank has a box.";
    if (log && Math.hypot(live.x - log.x, live.z - log.z) < 2.4 && vineCut() && !live.listen)
      live.listen = "One end is still sitting like it was planted.";
  });

  return (
    <group position={[S.x, gy, S.z]}>
      <mesh position={[0, -0.62, 0]} receiveShadow>
        <boxGeometry args={[9.2, 1.15, 2.45]} />
        {lamb("#2a4a52")}
      </mesh>
      <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.8, 2.2]} />
        <meshLambertMaterial color="#3a7a78" transparent opacity={0.7} emissive="#1a4040" emissiveIntensity={0.2} />
      </mesh>
      {[-3.6, -1.2, 1.2, 3.6].map((s, i) => (
        <mesh key={i} position={[s, 0.12, 1.35]} castShadow>
          <dodecahedronGeometry args={[0.28 + (i % 2) * 0.08, 0]} />
          {lamb(i % 2 ? "#5a5040" : "#6a5a48")}
        </mesh>
      ))}
      {[-3.2, 0.4, 3.4].map((s, i) => (
        <mesh key={i} position={[s, 0.1, -1.4]} castShadow>
          <dodecahedronGeometry args={[0.24, 0]} />
          {lamb("#4a4034")}
        </mesh>
      ))}
      <group ref={vine}>
        <mesh rotation={[0.2, 0.4, 1.1]}>
          <torusGeometry args={[0.42, 0.045, 5, 10]} />
          {lamb("#3d6a32")}
        </mesh>
        <mesh position={[0.1, 0.08, 0.2]} rotation={[0.5, -0.3, 0.8]}>
          <torusGeometry args={[0.32, 0.04, 5, 8]} />
          {lamb("#2e5a28")}
        </mesh>
      </group>
      <group ref={chock}>
        <mesh rotation={[0.4, 0.2, 0.15]} castShadow>
          <dodecahedronGeometry args={[0.22, 0]} />
          {lamb("#6a5a48")}
        </mesh>
      </group>
      <group ref={jaw}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <sphereGeometry args={[0.34, 8, 6]} />
          {lamb("#3a6a58")}
        </mesh>
        <mesh position={[0, 0.18, -0.32]} rotation={[0.4, 0, 0]} castShadow>
          <coneGeometry args={[0.16, 0.38, 5]} />
          {lamb("#2a4a40")}
        </mesh>
        <mesh position={[0.08, 0.22, -0.22]}>
          <sphereGeometry args={[0.04, 5, 4]} />
          {lamb("#c9a227", { emissive: "#c9a227", emit: 0.4 })}
        </mesh>
        <mesh position={[-0.08, 0.22, -0.22]}>
          <sphereGeometry args={[0.04, 5, 4]} />
          {lamb("#c9a227", { emissive: "#c9a227", emit: 0.4 })}
        </mesh>
        <mesh position={[0.22, 0.02, 0.1]} rotation={[0.8, 0.4, 0.2]}>
          <cylinderGeometry args={[0.04, 0.07, 0.45, 5]} />
          {lamb("#2e5a4a")}
        </mesh>
        <mesh position={[-0.22, 0.02, 0.1]} rotation={[0.8, -0.4, -0.2]}>
          <cylinderGeometry args={[0.04, 0.07, 0.45, 5]} />
          {lamb("#2e5a4a")}
        </mesh>
      </group>
    </group>
  );
}

function MillDitch() {
  const M = STUFF_AT.millDitch;
  const gy = heightAt(M.x, M.z);
  const stick = useRef<THREE.Group>(null);
  const water = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (live.house) return;
    const open = millOpen();
    const sx = M.x + 4.6;
    const sz = M.z + 1.2;
    if (!open && live.slash && Math.hypot(live.slash.x - sx, live.slash.z - sz) < 1.15) {
      live.smashed["mill-stick"] = true;
      sfx.ok();
      live.listen = "The stick came out. The water remembered how to sit.";
    }
    if (stick.current) stick.current.visible = !open;
    if (water.current) {
      water.current.position.y = (open ? -0.55 : -0.18) + Math.sin(live.playT * 1.4) * (open ? 0.02 : 0.06);
      const mat = water.current.material as THREE.MeshLambertMaterial;
      mat.opacity = open ? 0.42 : 0.72;
    }
    const d = Math.hypot(live.x - M.x, live.z - M.z);
    if (d < 8 && !open && !live.listen) live.listen = "A stick is keeping a door in the water from being a door.";
    if (d < 5 && open && !live.listen) live.listen = "The ditch is quieter. A plank is still leaning on the cart.";
    if (d < 16) live.fangMark = live.fangMark ?? { x: sx, z: sz, kind: "millstick" };
  });
  return (
    <group position={[M.x, gy, M.z]}>
      <mesh position={[0, -0.7, 0]} receiveShadow>
        <boxGeometry args={[8.4, 1.2, 2.3]} />
        {lamb("#2a4848")}
      </mesh>
      <mesh ref={water} position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.0, 2.05]} />
        <meshLambertMaterial color="#3a7a88" transparent opacity={0.7} />
      </mesh>
      <mesh position={[4.4, 0.55, 1.15]} castShadow>
        <boxGeometry args={[0.22, 1.15, 1.4]} />
        {lamb("#5a4a38")}
      </mesh>
      <group ref={stick} position={[4.55, 0.62, 1.2]} rotation={[0.2, 0, 0.4]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.05, 1.05, 5]} />
          {lamb("#6a4a28")}
        </mesh>
      </group>
      <mesh position={[6.6, 0.55, 4.2]} castShadow>
        <boxGeometry args={[1.6, 1.05, 0.9]} />
        {lamb("#6a4a28")}
      </mesh>
      <mesh position={[6.6, 1.15, 4.2]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.85, 0.12, 1.1]} />
        {lamb("#5a3a20")}
      </mesh>
    </group>
  );
}

function WoodSlope() {
  const G = STUFF_AT.woodGap;
  const gy = heightAt(G.x, G.z);
  const caps = useRef<THREE.Group>(null);
  useFrame(() => {
    if (live.house) return;
    const w = stuffWorld();
    const log = w.things.find((t) => t.id === "log-wood");
    const cut = woodCapsCut();
    if (log && !cut && live.slash && Math.hypot(live.slash.x - log.x, live.slash.z - log.z) < 1.8) {
      live.smashed["wood-caps"] = true;
      sfx.smash();
      live.listen = "The caps came apart. The hill is still tilted.";
    }
    if (caps.current) {
      caps.current.visible = !cut && Boolean(log);
      if (log && caps.current.visible) caps.current.position.set(log.x - G.x, log.y - gy + 0.28, log.z - G.z);
    }
    const d = Math.hypot(live.x - G.x, live.z - G.z);
    if (d < 9 && !cut && !live.listen) live.listen = "A log on a tilt. Soft things are growing under one end.";
    if (d < 18) live.fangMark = live.fangMark ?? { x: G.x + 5.6, z: G.z + 6.2, kind: "woodlog" };
  });
  return (
    <group position={[G.x, gy, G.z]}>
      <mesh position={[0, -0.58, 0]} receiveShadow>
        <boxGeometry args={[8.2, 1.05, 2.2]} />
        {lamb("#1a3a28")}
      </mesh>
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.8, 1.95]} />
        <meshLambertMaterial color="#245a40" transparent opacity={0.55} />
      </mesh>
      <group ref={caps}>
        {[-0.25, 0.15, 0.35].map((s, i) => (
          <mesh key={i} position={[s, 0.08, i * 0.12]} castShadow>
            <sphereGeometry args={[0.16 + i * 0.03, 6, 5]} />
            {lamb(i === 1 ? "#c45c38" : "#8a3a28")}
          </mesh>
        ))}
      </group>
    </group>
  );
}
