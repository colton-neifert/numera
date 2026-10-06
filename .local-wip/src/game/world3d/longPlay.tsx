import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, pondU } from "./field";
import { riverWet } from "./lands";
import { live } from "./live";
import { lamb } from "./mats";
import { sfx } from "../audio";
import { takeCipher } from "../cipher";
import { useGame } from "../store";
import { puffAt } from "./fx";
import { longNow, longVisible, stepLong, LONG_SCALE } from "./longOne";

const COAT = "#6a7a4e";
const DARK = "#4a5a38";
const BELLY = "#8a9464";
const SCUTE = "#5a6a40";
const PIT = "#2e3424";
const SCRAPE = "#b0b490";
const EYE = "#1a1610";
const GLOW = "#c9a227";

function wetAt(x: number, z: number) {
  return Math.max(riverWet(x, z), pondU(x, z));
}

function Body() {
  return (
    <group>
      <mesh position={[0, 7.2, 1.4]} scale={[1.15, 0.82, 1.85]} castShadow>
        <sphereGeometry args={[5.6, 9, 7]} />
        {lamb(COAT)}
      </mesh>
      <mesh position={[0, 5.6, 1.2]} scale={[0.95, 0.55, 1.55]} castShadow>
        <sphereGeometry args={[5.4, 8, 6]} />
        {lamb(BELLY)}
      </mesh>
      {([-3.6, -1.2, 1.4, 3.8, 6.2] as const).map((z, i) => (
        <mesh key={z} position={[0, 10.1 - i * 0.18, z]} rotation={[0.18 - i * 0.04, 0, 0]} castShadow>
          <boxGeometry args={[6.4 - i * 0.35, 1.7, 2.6]} />
          {lamb(SCUTE)}
        </mesh>
      ))}
      <mesh position={[0, 9.6, -4.4]} rotation={[0.55, 0, 0]} castShadow>
        <boxGeometry args={[4.2, 1.4, 2.2]} />
        {lamb(DARK)}
      </mesh>
      {[0.9, 2.6, 4.3].map((z) => (
        <mesh key={z} position={[3.7, 7.4, z]} rotation={[0, 0, -0.7]}>
          <circleGeometry args={[0.52, 8]} />
          {lamb(PIT)}
        </mesh>
      ))}
      <mesh position={[3.7, 7.4, 6.0]} rotation={[0, 0, -0.7]}>
        <circleGeometry args={[0.46, 8]} />
        {lamb(SCRAPE)}
      </mesh>
      <mesh position={[0, 6.4, 11.4]} rotation={[0.85, 0, 0]} castShadow>
        <cylinderGeometry args={[0.35, 1.4, 6.4, 6]} />
        {lamb(DARK)}
      </mesh>
    </group>
  );
}

function NeckHead() {
  return (
    <group position={[0, 9.4, -6.2]}>
      <mesh position={[0, 1.4, -2.4]} rotation={[0.85, 0, 0]} castShadow>
        <cylinderGeometry args={[1.35, 1.7, 5.2, 6]} />
        {lamb(COAT)}
      </mesh>
      <mesh position={[0, 4.6, -5.4]} rotation={[0.55, 0, 0]} castShadow>
        <cylinderGeometry args={[1.05, 1.35, 4.6, 6]} />
        {lamb(COAT)}
      </mesh>
      <mesh position={[0, 7.2, -8.2]} castShadow>
        <sphereGeometry args={[1.85, 8, 6]} />
        {lamb(COAT)}
      </mesh>
      <mesh position={[0, 6.85, -9.6]} castShadow>
        <sphereGeometry args={[1.15, 7, 5]} />
        {lamb(BELLY)}
      </mesh>
      <mesh position={[-0.62, 7.55, -9.55]}>
        <sphereGeometry args={[0.22, 6, 5]} />
        {lamb(EYE)}
      </mesh>
      <mesh position={[0.62, 7.55, -9.55]}>
        <sphereGeometry args={[0.22, 6, 5]} />
        {lamb(EYE)}
      </mesh>
      <mesh position={[-0.62, 7.58, -9.72]}>
        <sphereGeometry args={[0.08, 5, 4]} />
        {lamb(GLOW, { emit: 0.35, emissive: GLOW })}
      </mesh>
      <mesh position={[0.62, 7.58, -9.72]}>
        <sphereGeometry args={[0.08, 5, 4]} />
        {lamb(GLOW, { emit: 0.35, emissive: GLOW })}
      </mesh>
      <mesh position={[-1.05, 8.7, -8.0]} rotation={[0, 0, 0.4]}>
        <coneGeometry args={[0.28, 0.7, 5]} />
        {lamb(DARK)}
      </mesh>
      <mesh position={[1.05, 8.7, -8.0]} rotation={[0, 0, -0.4]}>
        <coneGeometry args={[0.28, 0.7, 5]} />
        {lamb(DARK)}
      </mesh>
    </group>
  );
}

function Leg({ side, hip }: { side: number; hip: number }) {
  return (
    <group position={[side * 3.15, 5.4, hip]}>
      <mesh position={[0, -1.6, 0]} castShadow>
        <cylinderGeometry args={[1.15, 0.95, 3.4, 6]} />
        {lamb(COAT)}
      </mesh>
      <mesh position={[0, -4.1, 0]} castShadow>
        <cylinderGeometry args={[0.82, 0.7, 2.6, 6]} />
        {lamb(DARK)}
      </mesh>
      <mesh position={[0, -5.55, 0.15]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[1.5, 0.55, 2.1]} />
        {lamb(DARK)}
      </mesh>
    </group>
  );
}

export function LongPlay() {
  const root = useRef<THREE.Group>(null);
  const neck = useRef<THREE.Group>(null);
  const legs = useRef<THREE.Group>(null);
  const spout = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const lastStep = useRef(0);
  const lastLook = useRef(false);
  const ciphered = useRef(false);

  useFrame((_, raw) => {
    const dt = Math.min(0.1, raw);
    if (live.dungeon || live.cave) return;
    stepLong(dt, {
      height: heightAt,
      wet: wetAt,
      px: live.x,
      pz: live.z,
      pyaw: live.yaw,
      slash: live.slash,
      boom: live.lastBoom,
      indoor: Boolean(live.house),
      song: live.songBuf ?? "",
    });
    const S = longNow();
    const show = longVisible();
    if (root.current) {
      root.current.visible = show && !live.house;
      root.current.position.set(S.x, S.y, S.z);
      root.current.rotation.y = S.yaw;
    }
    if (S.emerge && show) {
      puffAt(S.x, S.z, S.y + 2.4, true);
      sfx.longStep();
    }

    const gait = S.phase;
    if (legs.current) {
      const swim = S.mode === "swim";
      const look = S.mode === "look";
      const amp = look ? 0.08 : swim ? 0.55 : 1;
      legs.current.children.forEach((ch, i) => {
        const g = ch as THREE.Group;
        const ph = gait + (i === 0 || i === 3 ? 0 : Math.PI);
        const lift = Math.max(0, Math.sin(ph)) * (swim ? 0.7 : 1.35) * amp;
        g.position.y = lift;
        g.rotation.x = Math.sin(ph) * 0.38 * amp;
      });
    }
    if (neck.current) {
      neck.current.rotation.y = S.headYaw;
      neck.current.rotation.x = S.mode === "swim" ? -0.22 : S.mode === "look" ? 0.12 : Math.sin(live.playT * 0.7) * 0.04;
    }
    if (spout.current) {
      const on = S.mode === "swim" && S.spoutT < 1.15 && S.spoutT > 0.15;
      spout.current.visible = on;
      if (on) {
        const k = 1 - Math.abs(S.spoutT - 0.65) / 0.5;
        spout.current.scale.set(1, 0.4 + k * 2.6, 1);
        spout.current.position.y = 16 + k * 4;
      }
    }
    if (shadow.current) {
      shadow.current.visible = show && S.mode !== "swim" && !live.house;
      shadow.current.position.set(S.x, heightAt(S.x, S.z) + 0.05, S.z);
    }

    if (!show || live.house || live.talking) return;

    if (S.dist < 260 && S.dist > 18 && S.mode !== "look") {
      lastStep.current -= dt;
      if (lastStep.current <= 0) {
        lastStep.current = S.mode === "swim" ? 2.8 : 1.85;
        if (S.dist < 140) sfx.longStep();
      }
    }

    const q = useGame.getState().quests ?? {};
    if (S.seen && (q.longSeen ?? 0) < 1) useGame.getState().setQuest("longSeen", 1);
    if (S.close && (q.longClose ?? 0) < 1) useGame.getState().setQuest("longClose", 1);
    if (S.close && !ciphered.current) {
      ciphered.current = true;
      takeCipher("long-count", true);
    }

    if (S.mode === "look" && !lastLook.current && S.dist < 36) {
      lastLook.current = true;
      sfx.moo();
    }
    if (S.mode !== "look") lastLook.current = false;
  });

  return (
    <group>
      <group ref={root} frustumCulled={false} scale={LONG_SCALE}>
        <Body />
        <group ref={neck}>
          <NeckHead />
          <mesh ref={spout} position={[0, 16, -8.4]} visible={false}>
            <cylinderGeometry args={[0.18, 0.85, 7.2, 7]} />
            <meshBasicMaterial color="#c8e4f0" transparent opacity={0.38} depthWrite={false} />
          </mesh>
        </group>
        <group ref={legs}>
          <group>
            <Leg side={-1} hip={3.6} />
          </group>
          <group>
            <Leg side={1} hip={3.6} />
          </group>
          <group>
            <Leg side={-1} hip={-3.4} />
          </group>
          <group>
            <Leg side={1} hip={-3.4} />
          </group>
        </group>
      </group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <circleGeometry args={[11.6, 10]} />
        <meshBasicMaterial color="#1a1810" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}
