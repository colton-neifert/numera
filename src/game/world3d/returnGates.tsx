import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleH } from "./lush/grid";
import { live } from "./live";
import { lamb } from "./mats";
import { sfx } from "../audio";
import { useGame } from "../store";
import { playerMaxHp } from "../content";

/** North gap in the Numeria Field wall. Fire, then a knife, then ice. */
const GATE = { x: -62, z: -36.4 };
const SWITCH = { x: -70.2, z: -30 };
const DOOR = { x: -62, z: -24.2 };
const PIT = { x: -62, z: -16.4 };
const PRIZE = { x: -62, z: -11.2 };

function quest(id: string) {
  return (useGame.getState().quests?.[id] ?? 0) > 0;
}
function mark(id: string) {
  useGame.getState().setQuest(id, 1);
}

type Box = { x: number; z: number; hx: number; hz: number };

function pushOut(nx: number, nz: number, b: Box) {
  const dx = nx - b.x;
  const dz = nz - b.z;
  const hx = b.hx + 0.42;
  const hz = b.hz + 0.42;
  if (Math.abs(dx) >= hx || Math.abs(dz) >= hz) return null;
  if (hx - Math.abs(dx) < hz - Math.abs(dz)) return { x: b.x + Math.sign(dx || 1) * hx, z: nz };
  return { x: nx, z: b.z + Math.sign(dz || 1) * hz };
}

export function collideReturn(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house) return null;
  const walls: Box[] = [
    { x: -74.4, z: -22, hx: 0.45, hz: 13 },
    { x: -49.6, z: -22, hx: 0.45, hz: 13 },
    { x: -62, z: -9.2, hx: 12, hz: 0.45 },
  ];
  if (!quest("frostgate")) walls.push({ x: GATE.x, z: GATE.z, hx: 6.4, hz: 0.55 });
  if (!quest("rootswitch")) walls.push({ x: DOOR.x, z: DOOR.z, hx: 12, hz: 0.45 });
  if (!quest("iceford")) walls.push({ x: PIT.x, z: PIT.z, hx: 11, hz: 0.7 });
  walls.push({ x: SWITCH.x, z: SWITCH.z, hx: 0.7, hz: 0.7 });
  let x = nx;
  let z = nz;
  let hit = false;
  for (const b of walls) {
    const p = pushOut(x, z, b);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

function nearSlash(x: number, z: number, r: number) {
  const s = live.slash;
  if (!s) return false;
  return Math.hypot(s.x - x, s.z - z) < r;
}

export function ReturnGates() {
  const gateM = useRef<THREE.Group>(null);
  const doorM = useRef<THREE.Mesh>(null);
  const pitIce = useRef<THREE.Mesh>(null);
  const pitGap = useRef<THREE.Mesh>(null);
  const prizeM = useRef<THREE.Mesh>(null);
  const plate = useRef<THREE.Mesh>(null);
  const y = sampleH(GATE.x, GATE.z);
  const sy = sampleH(SWITCH.x, SWITCH.z);
  const py = sampleH(PRIZE.x, PRIZE.z);

  useFrame(() => {
    if (!quest("frostgate")) {
      if (live.blade === "fire" && nearSlash(GATE.x, GATE.z, 3.2)) {
        mark("frostgate");
        sfx.secret();
        live.listen = "The ice breaks. Ashdoor is open.";
      } else if (Math.hypot(live.x - GATE.x, live.z - GATE.z) < 3.2 && !live.listen && !live.talking) {
        live.hint = "A wall of ice. Steel will not move it.";
      }
    }
    if (quest("frostgate") && !quest("rootswitch")) {
      const thrown = live.arrows.some((a) => a.kind === "knife" && Math.hypot(a.x - SWITCH.x, a.z - SWITCH.z) < 1.35);
      if (thrown) {
        mark("rootswitch");
        sfx.secret();
        live.listen = "The knife hits the plate. The inner door lifts.";
      } else if (Math.hypot(live.x - SWITCH.x, live.z - SWITCH.z) < 3.4 && !live.listen && !live.talking) {
        live.hint = "The plate is out of reach.";
      }
    }
    if (quest("rootswitch") && !quest("iceford")) {
      if (live.blade === "ice" && nearSlash(PIT.x, PIT.z, 3)) {
        mark("iceford");
        sfx.secret();
        live.listen = "The cold holds. You can cross.";
      } else if (Math.hypot(live.x - PIT.x, live.z - PIT.z) < 2.6 && !live.listen && !live.talking) {
        live.hint = "A gap of warm air. Cold might make a path.";
      }
    }
    if (quest("iceford") && !quest("ashprize") && Math.hypot(live.x - PRIZE.x, live.z - PRIZE.z) < 1.1) {
      mark("ashprize");
      const g = useGame.getState();
      const max = playerMaxHp(g.xp, g.outfit, g.heartsExtra ?? 0);
      useGame.setState({ hp: max, coinsMax: Math.min(300, (g.coinsMax ?? 100) + 50) });
      sfx.heart();
      sfx.purse();
      live.listen = "Your health fills, and your purse can hold fifty more.";
    }
    if (gateM.current) gateM.current.visible = !quest("frostgate");
    if (doorM.current) doorM.current.visible = !quest("rootswitch");
    if (pitIce.current) pitIce.current.visible = quest("iceford");
    if (pitGap.current) pitGap.current.visible = !quest("iceford");
    if (prizeM.current) prizeM.current.visible = !quest("ashprize");
    if (plate.current) plate.current.scale.setScalar(quest("rootswitch") ? 1 : 1);
  });

  return (
    <group>
      <group ref={gateM} position={[GATE.x, y + 1.3, GATE.z]}>
        {[-5, -3, -1, 1, 3, 5].map((x) => (
          <mesh key={x} position={[x, 0, 0]} castShadow>
            <boxGeometry args={[0.28, 2.6, 0.28]} />
            <meshLambertMaterial color="#d7f4ff" emissive="#9fd4ff" emissiveIntensity={0.35} transparent opacity={0.78} />
          </mesh>
        ))}
      </group>
      {[
        [-74.4, -22, 0.9, 26],
        [-49.6, -22, 0.9, 26],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x!, sampleH(x!, z!) + 1.4, z!]} castShadow receiveShadow>
          <boxGeometry args={[w, 2.8, d]} />
          {lamb("#6a5348")}
        </mesh>
      ))}
      <mesh position={[-62, sampleH(-62, -9.2) + 1.4, -9.2]} castShadow>
        <boxGeometry args={[25.6, 2.8, 0.9]} />
        {lamb("#6a5348")}
      </mesh>
      <mesh ref={doorM} position={[DOOR.x, sampleH(DOOR.x, DOOR.z) + 1.3, DOOR.z]} castShadow>
        <boxGeometry args={[24, 2.6, 0.4]} />
        {lamb("#4a4038")}
      </mesh>
      <mesh ref={pitIce} visible={false} position={[PIT.x, sampleH(PIT.x, PIT.z) + 0.08, PIT.z]} receiveShadow>
        <boxGeometry args={[10, 0.12, 1.6]} />
        <meshLambertMaterial color="#e7f7ff" emissive="#b7e6ff" emissiveIntensity={0.25} />
      </mesh>
      <mesh ref={pitGap} position={[PIT.x, sampleH(PIT.x, PIT.z) + 0.02, PIT.z]}>
        <boxGeometry args={[10, 0.08, 1.4]} />
        {lamb("#2a2428")}
      </mesh>
      <group position={[SWITCH.x, sy, SWITCH.z]}>
        <mesh position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.7, 2.2, 8]} />
          {lamb("#7a7368")}
        </mesh>
        <mesh ref={plate} position={[0, 2.25, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.08, 10]} />
          {lamb("#e0b030")}
        </mesh>
      </group>
      <mesh ref={prizeM} position={[PRIZE.x, py + 0.35, PRIZE.z]} castShadow>
        <boxGeometry args={[0.7, 0.45, 0.45]} />
        {lamb("#c9a24a")}
      </mesh>
    </group>
  );
}
