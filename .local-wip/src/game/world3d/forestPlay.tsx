import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { addTrapSpot } from "./dungeonTraps";
import { consumeTalk as consumeTalkRaw } from "../input";
import { FW } from "./lands";
import { N64Sign } from "./actors";
import { takeCipher } from "../cipher";
import { isChestOpen, markChestOpen } from "./puzzles";
import { lamb } from "./mats";
import type { Ladder } from "./climb";
import { VolTree } from "./trees";

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
}

function talkOk() {
  if (live.nearNpc || live.nearHouse || live.nearChest || live.nearHorse) return false;
  return consumeTalkRaw();
}

const hits: { x: number; z: number; r: number }[] = [];

export function addForestHit(x: number, z: number, r: number) {
  hits.push({ x, z, r });
}

export function collideForest(nx: number, nz: number): { x: number; z: number } | null {
  let x = nx;
  let z = nz;
  let hit = false;
  for (const s of hits) {
    const dx = x - s.x;
    const dz = z - s.z;
    const d2 = dx * dx + dz * dz;
    const rr = s.r * s.r;
    if (d2 < rr && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = s.x + (dx / d) * s.r;
      z = s.z + (dz / d) * s.r;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

export function forestLadders(): Ladder[] {
  return [{ id: "woodoak", x: FW.oak.x + 1.55, z: FW.oak.z + 0.15, yaw: Math.PI * 0.5, h: 7.2, half: 0.7 }];
}

type MazeDir = "n" | "s" | "e" | "w";
const DIRS: { id: MazeDir; dx: number; dz: number }[] = [
  { id: "n", dx: 0, dz: 1 },
  { id: "s", dx: 0, dz: -1 },
  { id: "e", dx: 1, dz: 0 },
  { id: "w", dx: -1, dz: 0 },
];

const JUNCS: { id: number; x: number; z: number; ok: MazeDir; next: number }[] = [
  { id: 0, x: FW.maze0.x, z: FW.maze0.z, ok: "n", next: 1 },
  { id: 1, x: FW.maze1.x, z: FW.maze1.z, ok: "w", next: 2 },
  { id: 2, x: FW.maze2.x, z: FW.maze2.z, ok: "n", next: 3 },
  { id: 3, x: FW.maze3.x, z: FW.maze3.z, ok: "w", next: -1 },
];

function fadeWarp(
  going: { current: "" | "in" | "out" | "loop" },
  t: { current: number },
  dt: number,
  onMid: () => void,
) {
  if (!going.current) return;
  t.current += dt;
  const u = Math.min(1, t.current / 0.82);
  if (u < 0.5) live.roomFade = u / 0.5;
  else {
    live.roomFade = 1 - (u - 0.5) / 0.5;
    live.roomFadeOut = true;
  }
  live.speed = 0;
  if (u > 0.46 && u < 0.56) onMid();
  if (u >= 1) {
    going.current = "";
    live.roomFade = 0;
    live.roomFadeOut = false;
  }
}

export function ForestPlay() {
  return (
    <group>
      <ForestBegin />
      <WoodsSign />
      <StoneArch />
      <TwinPines />
      <RangerHut />
      <SunClearing />
      <FallenLog />
      <DeerGlade />
      <HollowOak />
      <OwlSnag />
      <OldCamp />
      <RuinStones />
      <FernTunnel />
      <WolfDen />
      <LostPath />
      <SecretGrove />
      <ForestWildlife />
      <ForestSounds />
      <PickShrooms />
    </group>
  );
}

function ForestBegin() {
  useFrame(() => {
    hits.length = 0;
  }, -3);
  return null;
}

function WoodsSign() {
  const { x, z } = FW.sign;
  useFrame(() => {
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 2.4)
      live.listen = live.listen || "Whisperwood. Twin pines north. A hollow oak further west. The trees after that do not keep still.";
  });
  return <N64Sign x={x} z={z} />;
}

function StoneArch() {
  const { x, z } = FW.arch;
  const y = heightAt(x, z);
  useFrame(() => {
    addForestHit(x - 2.6, z, 0.85);
    addForestHit(x + 2.6, z, 0.85);
  }, -2);
  return (
    <group position={[x, y, z]}>
      {[-2.6, 2.6].map((s) => (
        <mesh key={s} position={[s, 2.4, 0]} castShadow>
          <boxGeometry args={[1.15, 4.8, 1.4]} />
          {lamb("#6a6458")}
        </mesh>
      ))}
      <mesh position={[0, 4.7, 0]} castShadow>
        <boxGeometry args={[6.4, 1.05, 1.55]} />
        {lamb("#7a7468")}
      </mesh>
      <mesh position={[0, 5.35, 0.1]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1.6, 0.55, 0.7]} />
        {lamb("#5a554c")}
      </mesh>
      {[-1.8, 0, 1.8].map((s, i) => (
        <mesh key={i} position={[s, 0.12, 1.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.55, 7]} />
          {lamb("#8a7a58")}
        </mesh>
      ))}
    </group>
  );
}

function TwinPines() {
  const { x, z } = FW.twins;
  useFrame(() => {
    addForestHit(x - 3.2, z, 1.35);
    addForestHit(x + 3.4, z + 1.1, 1.3);
  }, -2);
  return (
    <group>
      <VolTree x={x - 3.2} z={z} s={2.85} kind="pine" seed={41} />
      <VolTree x={x + 3.4} z={z + 1.1} s={2.7} kind="pine" seed={42} />
    </group>
  );
}

function RangerHut() {
  const { x, z } = FW.hut;
  const y = heightAt(x, z);
  useFrame(() => {
    addForestHit(x, z, 2.4);
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 4.2 && live.stillT > 0.6)
      live.listen = live.listen || "A hut with a split-log roof. Someone still lives here.";
  }, -2);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[4.4, 2.3, 3.6]} />
        {lamb("#6a4a28")}
      </mesh>
      <mesh position={[0, 2.55, 0]} rotation={[0, 0.2, 0]} castShadow>
        <coneGeometry args={[3.4, 1.8, 4]} />
        {lamb("#4a3220")}
      </mesh>
      <mesh position={[0, 1.05, 1.85]} castShadow>
        <boxGeometry args={[0.9, 1.7, 0.12]} />
        {lamb("#3a2818")}
      </mesh>
      <mesh position={[1.4, 1.55, 1.82]}>
        <boxGeometry args={[0.55, 0.45, 0.08]} />
        {lamb("#c9a227")}
      </mesh>
      <mesh position={[1.55, 2.9, -0.4]} castShadow>
        <cylinderGeometry args={[0.22, 0.26, 1.1, 6]} />
        {lamb("#4a3a30")}
      </mesh>
      <mesh position={[0, 0.04, 2.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.4, 1.6]} />
        {lamb("#6a4a28")}
      </mesh>
    </group>
  );
}

function SunClearing() {
  const { x, z } = FW.sun;
  const y = heightAt(x, z);
  const stones = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2 + 0.3;
        return { x: Math.cos(a) * 8.4, z: Math.sin(a) * 8.4, h: 0.55 + (i % 3) * 0.18 };
      }),
    [],
  );
  useFrame(() => {
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 7 && live.stillT > 0.8)
      live.listen = live.listen || "A hole in the canopy. The rest of the woods does not get this much sky.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow>
        <circleGeometry args={[11.4, 16]} />
        {lamb("#7a9a3c")}
      </mesh>
      {stones.map((s, i) => (
        <mesh key={i} position={[s.x, s.h * 0.5, s.z]} castShadow>
          <boxGeometry args={[0.7, s.h, 0.55]} />
          {lamb(i === 0 ? "#c9a227" : "#6a6458")}
        </mesh>
      ))}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.5, 1.4, 7]} />
        {lamb("#8a8478")}
      </mesh>
    </group>
  );
}

function FallenLog() {
  const { x, z } = FW.log;
  const y = heightAt(x, z);
  const span = 14.4;
  useFrame(() => {
    for (let i = -4; i <= 4; i++) addTrapSpot(x + i * 1.45, z + i * 0.12, 0.7, 0.85);
    addForestHit(x - 7.4, z - 0.4, 0.95);
    addForestHit(x + 7.4, z + 0.6, 0.95);
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 4 && live.y > y + 0.5)
      live.listen = live.listen || "The trunk holds. It did not fall for you, but it works.";
  }, -2);
  return (
    <group position={[x, y + 0.7, z]} rotation={[0.08, 0.18, 0.12]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.62, 0.78, span, 8]} />
        {lamb("#5a3a22")}
      </mesh>
      <mesh position={[-6.8, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.82, 0.7, 1.2, 8]} />
        {lamb("#4a3220")}
      </mesh>
      {[0.4, -0.2, 0.1].map((s, i) => (
        <mesh key={i} position={[2 + i * 1.8, 0.55, s]} castShadow>
          <sphereGeometry args={[0.22, 6, 5]} />
          {lamb("#c42838")}
        </mesh>
      ))}
    </group>
  );
}

function DeerGlade() {
  const { x, z } = FW.deer;
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[9.2, 14]} />
        {lamb("#6a8a34")}
      </mesh>
    </group>
  );
}

function HollowOak() {
  const { x, z } = FW.oak;
  const y = heightAt(x, z);
  const lid = FW.oak;
  useFrame(() => {
    addForestHit(x, z, 1.75);
    addTrapSpot(x - 0.2, z - 0.8, 1.6, 7.05);
    addTrapSpot(x + 0.6, z - 0.2, 1.1, 7.05);
    if (live.house) return;
    const d = Math.hypot(live.x - lid.x, live.z - lid.z);
    if (d < 3.4 && live.y < y + 2)
      live.listen = live.listen || "A hollow oak. The inside is a stair of roots. A ladder goes the rest of the way.";
  }, -2);
  return (
    <group>
      <VolTree x={x} z={z} s={3.15} kind="oak" seed={9} />
      <group position={[x, y, z]}>
        <mesh position={[0.2, 1.1, 1.5]}>
          <sphereGeometry args={[0.72, 8, 6]} />
          {lamb("#2a1a10")}
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[1.55, 0.4 + i * 0.85, 0.12]}>
            <boxGeometry args={[0.16, 0.62, 0.08]} />
            {lamb("#2a6a32")}
          </mesh>
        ))}
        <mesh position={[-0.2, 7.15, -0.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[1.7, 10]} />
          {lamb("#5a3a22")}
        </mesh>
        {[-1.4, 1.4].map((s) => (
          <mesh key={s} position={[s * 0.4, 7.45, -1.5]} castShadow>
            <boxGeometry args={[1.8, 0.55, 0.16]} />
            {lamb("#4a3220")}
          </mesh>
        ))}
      </group>
    </group>
  );
}

function OwlSnag() {
  const { x, z } = FW.owl;
  const y = heightAt(x, z);
  const owl = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    addForestHit(x, z, 1.05);
    const t = clock.elapsedTime;
    if (owl.current) {
      owl.current.position.y = 8.4 + Math.sin(t * 0.7) * 0.04;
      owl.current.rotation.y = Math.sin(t * 0.35) * 0.4;
      owl.current.visible = live.dusk > 0.35 || t % 14 < 9;
    }
  }, -2);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 4.6, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.42, 9.2, 7]} />
        {lamb("#4a3a28")}
      </mesh>
      <mesh position={[0.7, 7.4, 0]} rotation={[0, 0, 1.1]} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 2.2, 6]} />
        {lamb("#4a3a28")}
      </mesh>
      <group ref={owl} position={[0.15, 8.4, 0.2]}>
        <mesh castShadow>
          <sphereGeometry args={[0.28, 8, 6]} />
          {lamb("#c8b090")}
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <sphereGeometry args={[0.18, 7, 6]} />
          {lamb("#d8c8a8")}
        </mesh>
        {[-0.08, 0.08].map((s) => (
          <mesh key={s} position={[s, 0.26, 0.14]}>
            <sphereGeometry args={[0.05, 6, 5]} />
            {lamb("#1a1a14")}
          </mesh>
        ))}
      </group>
    </group>
  );
}

function OldCamp() {
  const { x, z } = FW.camp;
  const y = heightAt(x, z);
  const fire = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (fire.current) {
      const u = 0.7 + Math.sin(clock.elapsedTime * 7) * 0.18;
      fire.current.scale.setScalar(u);
    }
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 3.4 && live.stillT > 0.5)
      live.listen = live.listen || "A camp that stopped. The pot is still hanging.";
  });
  return (
    <group position={[x, y, z]}>
      {[-1.6, 1.4].map((s, i) => (
        <mesh key={i} position={[s, 0.12, i ? -1.1 : 1.2]} rotation={[0.4, i, 0.2]} castShadow>
          <cylinderGeometry args={[0.16, 0.2, 2.4, 6]} />
          {lamb("#5a3a22")}
        </mesh>
      ))}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.7, 0.85, 0.22, 8]} />
        {lamb("#4a4840")}
      </mesh>
      <mesh ref={fire} position={[0, 0.45, 0]}>
        <coneGeometry args={[0.28, 0.7, 5]} />
        <meshLambertMaterial color="#e07030" emissive="#c45c38" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <sphereGeometry args={[0.28, 7, 5]} />
        {lamb("#4a4a48")}
      </mesh>
    </group>
  );
}

function RuinStones() {
  const { x, z } = FW.ruin;
  const y = heightAt(x, z);
  const got = useRef(false);
  useFrame(() => {
    addForestHit(x, z - 0.4, 2.1);
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.8 && live.stillT > 0.55 && !got.current) {
      got.current = true;
      takeCipher("woods-rings", true);
    }
    if (d < 3.2 && live.stillT > 0.7)
      live.listen = live.listen || "Four rings cut in a fallen lintel. The last ring is only a scratch.";
  }, -2);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.1, -1.6]} castShadow>
        <boxGeometry args={[6.4, 2.2, 0.7]} />
        {lamb("#8a8478")}
      </mesh>
      {[-2.6, 2.6].map((s) => (
        <mesh key={s} position={[s, 1.4, 0.2]} castShadow>
          <boxGeometry args={[0.8, 2.8, 0.7]} />
          {lamb("#7a7468")}
        </mesh>
      ))}
      <mesh position={[0, 0.35, 1.4]} rotation={[0.5, 0.2, 0]} castShadow>
        <boxGeometry args={[2.4, 0.45, 0.8]} />
        {lamb("#6a6458")}
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.9 + i * 0.6, 1.55, -1.22]}>
          <torusGeometry args={[0.16, 0.035, 6, 10]} />
          <meshLambertMaterial color={i === 3 ? "#4a4840" : "#c9a227"} />
        </mesh>
      ))}
    </group>
  );
}

function FernTunnel() {
  const a = FW.fern;
  const b = FW.deer;
  const pts = useMemo(() => {
    const out: { x: number; z: number }[] = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      out.push({
        x: a.x + (b.x - a.x) * u + Math.sin(u * 6) * 1.4,
        z: a.z + (b.z - a.z) * u + Math.cos(u * 5) * 1.1,
      });
    }
    return out;
  }, [a.x, a.z, b.x, b.z]);
  useFrame(() => {
    if (live.house) return;
    let on = false;
    for (const p of pts) if (Math.hypot(live.x - p.x, live.z - p.z) < 1.5) on = true;
    if (on && live.stillT > 0.4) live.listen = live.listen || "The ferns close behind. It is still a path.";
  });
  return (
    <group>
      {pts.map((p, i) => {
        const y = heightAt(p.x, p.z);
        return (
          <group key={i} position={[p.x, y, p.z]}>
            {[-0.7, 0.7].map((s) => (
              <mesh key={s} position={[s, 0.45, (i % 2) * 0.2]} rotation={[0.2, i, 0.3]} castShadow>
                <coneGeometry args={[0.45, 1.1, 5]} />
                {lamb(i % 2 ? "#2a6a32" : "#3a7a38")}
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function WolfDen() {
  const { x, z } = FW.den;
  const y = heightAt(x, z);
  useFrame(() => {
    addForestHit(x - 1.2, z + 0.6, 1.4);
    addForestHit(x + 1.4, z - 0.4, 1.2);
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 4)
      live.listen = live.listen || "Something dens here. The dirt is scratched in a circle.";
  }, -2);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.9, 0.4]} rotation={[0.2, 0.4, 0]} castShadow>
        <dodecahedronGeometry args={[1.8, 0]} />
        {lamb("#5a5850")}
      </mesh>
      <mesh position={[0.2, 0.55, 1.6]}>
        <sphereGeometry args={[0.85, 8, 6]} />
        {lamb("#1a140e")}
      </mesh>
    </group>
  );
}

function LostPath() {
  const going = useRef<"" | "in" | "out" | "loop">("");
  const t = useRef(0);
  const here = useRef(0);
  const loopTo = useRef({ x: JUNCS[0]!.x, z: JUNCS[0]!.z });
  const didMid = useRef(false);
  const noteT = useRef(0);

  useFrame((_, dt) => {
    if (live.house) return;
    fadeWarp(going, t, dt, () => {
      if (didMid.current) return;
      didMid.current = true;
      live.x = loopTo.current.x;
      live.z = loopTo.current.z;
      live.y = heightAt(live.x, live.z);
      sfx.creak();
    });
    if (going.current) return;

    let nearest = -1;
    let best = 99;
    for (const j of JUNCS) {
      const d = Math.hypot(live.x - j.x, live.z - j.z);
      if (d < best) {
        best = d;
        nearest = j.id;
      }
    }
    if (nearest >= 0 && best < 10.4) here.current = nearest;
    const j = JUNCS[here.current];
    if (!j) return;

    const dx = live.x - j.x;
    const dz = live.z - j.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 12.5 && dist < 22) {
      let dir: MazeDir = "n";
      let score = -1;
      for (const d of DIRS) {
        const s = dx * d.dx + dz * d.dz;
        if (s > score) {
          score = s;
          dir = d.id;
        }
      }
      const entry = here.current === 0 && dir === "e";
      if (!entry && dir !== j.ok) {
        going.current = "loop";
        t.current = 0;
        didMid.current = false;
        loopTo.current = { x: j.x, z: j.z };
      }
    }

    if (here.current === 3 && j.ok === "w" && live.x < j.x - 14 && Math.abs(live.z - j.z) < 8) {
      if (!live.smashed["woods-maze"]) {
        pay(16, "woods-maze");
        live.listen = "The woods let you through.";
      }
    }

    noteT.current -= dt;
    if (best < 9 && live.stillT > 0.85 && noteT.current <= 0) {
      const lines = [
        "White caps crowd one mouth. The others are red.",
        "Something hangs and ticks in the wind on one side.",
        "A stone in the middle is green on one face.",
        "A bird sits over one mouth and not the others.",
      ];
      live.listen = live.listen || lines[here.current]!;
    }

    for (const d of DIRS) {
      const mx = j.x + d.dx * 7.2;
      const mz = j.z + d.dz * 7.2;
      addForestHit(mx + d.dz * 3.4, mz - d.dx * 3.4, 1.15);
      addForestHit(mx - d.dz * 3.4, mz + d.dx * 3.4, 1.15);
    }
  }, -2);

  return (
    <group>
      {JUNCS.map((j) => (
        <Junction key={j.id} j={j} />
      ))}
      <MazeWalls />
    </group>
  );
}

function Junction({ j }: { j: (typeof JUNCS)[number] }) {
  const y = heightAt(j.x, j.z);
  const clue = DIRS.find((d) => d.id === j.ok)!;
  return (
    <group position={[j.x, y, j.z]}>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[8.6, 14]} />
        {lamb("#3a5a28")}
      </mesh>
      {DIRS.map((d) => {
        const ok = d.id === j.ok;
        const entry = j.id === 0 && d.id === "e";
        return (
          <group key={d.id} position={[d.dx * 8.2, 0, d.dz * 8.2]}>
            {ok
              ? j.id === 0
                ? [0, 1, 2].map((i) => (
                    <mesh key={i} position={[(i - 1) * 0.45, 0.16, 0.2]} castShadow>
                      <sphereGeometry args={[0.2, 6, 5]} />
                      {lamb("#efe6d4")}
                    </mesh>
                  ))
                : j.id === 1
                  ? [0, 1, 2].map((i) => (
                      <mesh key={i} position={[0, 2.2 + i * 0.35, 0]}>
                        <sphereGeometry args={[0.08, 6, 5]} />
                        <meshLambertMaterial color="#c9a227" emissive="#8a6a20" emissiveIntensity={0.4} />
                      </mesh>
                    ))
                  : j.id === 2
                    ? null
                    : (
                        <mesh position={[0, 2.4, 0]} castShadow>
                          <sphereGeometry args={[0.14, 6, 5]} />
                          {lamb("#d8c070")}
                        </mesh>
                      )
              : !entry
                ? [0, 1].map((i) => (
                    <mesh key={i} position={[(i - 0.5) * 0.4, 0.14, 0]} castShadow>
                      <sphereGeometry args={[0.16, 6, 5]} />
                      {lamb("#c42838")}
                    </mesh>
                  ))
                : null}
          </group>
        );
      })}
      {j.id === 2 ? (
        <mesh position={[clue.dx * 1.2, 0.85, clue.dz * 1.2]} rotation={[0.1, 0, 0.08]} castShadow>
          <boxGeometry args={[0.7, 1.7, 0.5]} />
          {lamb("#4a6a38")}
        </mesh>
      ) : (
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.7, 8]} />
          {lamb("#2a4a24")}
        </mesh>
      )}
    </group>
  );
}

function MazeWalls() {
  const trees = useMemo(() => {
    const list: { x: number; z: number; s: number; pine: boolean }[] = [];
    const corridors: [{ x: number; z: number }, { x: number; z: number }][] = [
      [FW.maze0, FW.maze1],
      [FW.maze1, FW.maze2],
      [FW.maze2, FW.maze3],
      [FW.maze3, FW.secret],
    ];
    for (const [a, b] of corridors) {
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz) || 1;
      const nx = -dz / len;
      const nz = dx / len;
      for (let i = 1; i < 5; i++) {
        const u = i / 5;
        const cx = a.x + dx * u;
        const cz = a.z + dz * u;
        list.push({ x: cx + nx * 4.2, z: cz + nz * 4.2, s: 1.55, pine: i % 2 === 0 });
        list.push({ x: cx - nx * 4.2, z: cz - nz * 4.2, s: 1.48, pine: i % 2 === 1 });
      }
    }
    for (const j of JUNCS) {
      for (const d of DIRS) {
        if (d.id === j.ok) continue;
        if (j.id === 0 && d.id === "e") continue;
        for (let k = 1; k <= 2; k++) {
          const cx = j.x + d.dx * (10 + k * 3.6);
          const cz = j.z + d.dz * (10 + k * 3.6);
          list.push({ x: cx + d.dz * 3.6, z: cz - d.dx * 3.6, s: 1.4, pine: true });
          list.push({ x: cx - d.dz * 3.6, z: cz + d.dx * 3.6, s: 1.35, pine: false });
        }
      }
    }
    return list;
  }, []);
  return (
    <group>
      {trees.map((t, i) => {
        const y = heightAt(t.x, t.z);
        const h = 6.4 * t.s;
        return (
          <group key={i} position={[t.x, y, t.z]}>
            <mesh position={[0, h * 0.32, 0]} castShadow>
              <cylinderGeometry args={[0.18 * t.s, 0.28 * t.s, h * 0.64, 6]} />
              {lamb("#5a3a22")}
            </mesh>
            {t.pine ? (
              [0.48, 0.66, 0.82].map((u, k) => (
                <mesh key={k} position={[0, h * u, 0]} castShadow>
                  <coneGeometry args={[(1.6 - k * 0.4) * t.s, h * 0.32, 7]} />
                  {lamb(["#1a3a1c", "#224a22", "#2a5a28"][k]!)}
                </mesh>
              ))
            ) : (
              <mesh position={[0, h * 0.72, 0]} castShadow>
                <icosahedronGeometry args={[1.35 * t.s, 0]} />
                {lamb("#3a5e28")}
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function SecretGrove() {
  const { x, z } = FW.secret;
  const y = heightAt(x, z);
  const open = useRef(isChestOpen("woods-heart"));
  const fire = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    fire.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.35 + i * 0.17) % 1;
      m.position.y = 0.4 + Math.sin(t * 1.4 + i) * 0.35;
      const mat = m.material as THREE.MeshLambertMaterial;
      mat.opacity = 0.55 * (1 - u * 0.4);
    });
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.2 && talkOk() && !open.current) {
      open.current = true;
      markChestOpen("woods-heart");
      const g = useGame.getState();
      if (g.grantHeartContainer("woods-heart")) revealItem("container");
      sfx.get();
      live.listen = "The grove had been keeping a heart. The trees around it skipped a year.";
      takeCipher("woods-rings", false);
    }
    if (d < 8 && live.stillT > 0.6)
      live.listen = live.listen || "A circle the woods did not want found. Gold leaves. A chest in the middle.";
  });
  return (
    <group>
      <group position={[x, y, z]}>
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[12.2, 16]} />
          {lamb("#5a7a32")}
        </mesh>
        <group position={[0, 0.15, 0]}>
          <mesh position={[0, 0.22, 0]} castShadow>
            <boxGeometry args={[0.86, 0.46, 0.58]} />
            {lamb(open.current ? "#4a3220" : "#7a4e22")}
          </mesh>
          <mesh position={[0, 0.48, -0.05]} rotation={[open.current ? -1.4 : 0, 0, 0]} castShadow>
            <boxGeometry args={[0.86, 0.2, 0.58]} />
            {lamb("#9a642c")}
          </mesh>
        </group>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh
            key={i}
            ref={(el) => {
              fire.current[i] = el;
            }}
            position={[Math.cos(i * 0.7) * 4.2, 0.5, Math.sin(i * 0.7) * 4.2]}
          >
            <sphereGeometry args={[0.07, 5, 4]} />
            <meshLambertMaterial color="#e8d48a" emissive="#c9a227" emissiveIntensity={0.8} transparent opacity={0.6} depthWrite={false} />
          </mesh>
        ))}
      </group>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <VolTree key={i} x={x + Math.cos(a) * 10.4} z={z + Math.sin(a) * 10.4} s={1.7} kind="oak" seed={200 + i} />;
      })}
    </group>
  );
}

function ForestWildlife() {
  const deer = useRef<THREE.Group>(null);
  const fox = useRef<THREE.Group>(null);
  const sq = useRef<THREE.Group>(null);
  const deerP = useRef({ x: FW.deer.x + 2, z: FW.deer.z, yaw: 0.4 });
  const foxP = useRef({ x: FW.trail.x, z: FW.trail.z, yaw: 1.2, t: 0 });
  const sqP = useRef({ a: 0 });
  useFrame((_, dt) => {
    if (live.house) return;
    const d = deerP.current;
    const scare = Math.hypot(live.x - d.x, live.z - d.z) < 7.5;
    const tx = scare ? FW.deer.x - 16 : FW.deer.x + Math.sin(live.playT * 0.12) * 5;
    const tz = scare ? FW.deer.z - 8 : FW.deer.z + Math.cos(live.playT * 0.1) * 4;
    d.x += (tx - d.x) * Math.min(1, dt * (scare ? 2.6 : 0.6));
    d.z += (tz - d.z) * Math.min(1, dt * (scare ? 2.6 : 0.6));
    d.yaw = Math.atan2(-(tx - d.x), -(tz - d.z));
    if (deer.current) deer.current.position.set(d.x, heightAt(d.x, d.z), d.z);

    const f = foxP.current;
    f.t += dt;
    const u = (f.t * 0.18) % 1;
    const path: [number, number][] = [
      [FW.trail.x, FW.trail.z],
      [FW.sun.x + 10, FW.sun.z + 8],
      [FW.oak.x + 14, FW.oak.z - 8],
      [FW.hut.x + 8, FW.hut.z + 10],
    ];
    const i = Math.min(path.length - 2, Math.floor(u * (path.length - 1)));
    const local = u * (path.length - 1) - i;
    const a = path[i]!;
    const b = path[i + 1]!;
    f.x = a[0] + (b[0] - a[0]) * local;
    f.z = a[1] + (b[1] - a[1]) * local;
    f.yaw = Math.atan2(-(b[0] - a[0]), -(b[1] - a[1]));
    if (fox.current) {
      fox.current.position.set(f.x, heightAt(f.x, f.z), f.z);
      fox.current.rotation.y = f.yaw;
    }

    sqP.current.a += dt * 1.4;
    if (sq.current) {
      const ox = FW.oak.x + Math.cos(sqP.current.a) * 2.4;
      const oz = FW.oak.z + Math.sin(sqP.current.a) * 2.4;
      sq.current.position.set(ox, heightAt(ox, oz) + 0.85 + Math.abs(Math.sin(sqP.current.a * 4)) * 0.35, oz);
    }
  });
  return (
    <group>
      <group ref={deer}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <sphereGeometry args={[0.38, 8, 6]} />
          {lamb("#8a6a40")}
        </mesh>
        <mesh position={[0, 0.95, -0.42]} castShadow>
          <sphereGeometry args={[0.22, 7, 6]} />
          {lamb("#a07a48")}
        </mesh>
        {[-0.08, 0.08].map((s) => (
          <mesh key={s} position={[s, 1.28, -0.48]} rotation={[0.2, 0, s * 2]}>
            <cylinderGeometry args={[0.02, 0.03, 0.32, 4]} />
            {lamb("#efe6d4")}
          </mesh>
        ))}
        <mesh position={[0, 0.55, 0.45]} rotation={[0.8, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.08, 0.45, 5]} />
          {lamb("#8a6a40")}
        </mesh>
      </group>
      <group ref={fox}>
        <mesh position={[0, 0.32, 0]} castShadow>
          <sphereGeometry args={[0.22, 7, 6]} />
          {lamb("#c45c38")}
        </mesh>
        <mesh position={[0, 0.42, -0.28]} castShadow>
          <sphereGeometry args={[0.14, 6, 5]} />
          {lamb("#c45c38")}
        </mesh>
        <mesh position={[0, 0.28, 0.32]} rotation={[0.6, 0, 0]}>
          <coneGeometry args={[0.08, 0.4, 5]} />
          {lamb("#c45c38")}
        </mesh>
      </group>
      <group ref={sq}>
        <mesh castShadow>
          <sphereGeometry args={[0.12, 6, 5]} />
          {lamb("#7a5230")}
        </mesh>
      </group>
    </group>
  );
}

function ForestSounds() {
  const cool = useRef(4);
  useFrame((_, dt) => {
    if (live.house || live.x > -300) return;
    cool.current -= dt;
    if (cool.current > 0) return;
    cool.current = 11 + Math.random() * 10;
    const dOwl = Math.hypot(live.x - FW.owl.x, live.z - FW.owl.z);
    const dDen = Math.hypot(live.x - FW.den.x, live.z - FW.den.z);
    const dMaze = Math.hypot(live.x - FW.maze1.x, live.z - FW.maze1.z);
    if (dOwl < 28 && live.dusk > 0.4) sfx.hoot();
    else if (dDen < 22) sfx.howl();
    else if (dMaze < 40) sfx.chime();
    else if (Math.random() < 0.45) sfx.creak();
    else sfx.chirp();
  });
  return null;
}

function PickShrooms() {
  const spots = useMemo(
    () => [
      { x: FW.birch.x + 3.2, z: FW.birch.z + 2.1, id: "fs0" },
      { x: FW.log.x + 2.4, z: FW.log.z - 1.6, id: "fs1" },
      { x: FW.camp.x - 3.2, z: FW.camp.z + 2.4, id: "fs2" },
      { x: FW.oak.x + 5.5, z: FW.oak.z + 3.2, id: "fs3" },
      { x: FW.sun.x - 9.2, z: FW.sun.z + 4.4, id: "fs4" },
    ],
    [],
  );
  const groups = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    if (live.house) return;
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i]!;
      const g = groups.current[i];
      if (live.smashed[`shroom-${s.id}`]) {
        if (g) g.visible = false;
        continue;
      }
      if (Math.hypot(live.x - s.x, live.z - s.z) < 1.15 && talkOk()) {
        live.smashed[`shroom-${s.id}`] = true;
        useGame.getState().addMushroom();
        revealItem("mushroom");
        sfx.ok();
        if (g) g.visible = false;
      }
    }
  });
  return (
    <group>
      {spots.map((s, i) => (
        <group
          key={s.id}
          ref={(el) => {
            groups.current[i] = el;
          }}
          position={[s.x, heightAt(s.x, s.z), s.z]}
        >
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.07, 0.28, 5]} />
            {lamb("#efe6d4")}
          </mesh>
          <mesh position={[0, 0.3, 0]} castShadow>
            <sphereGeometry args={[0.16, 7, 5]} />
            {lamb("#c42838")}
          </mesh>
        </group>
      ))}
    </group>
  );
}
