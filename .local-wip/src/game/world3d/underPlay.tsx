import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { takeCipher } from "../cipher";
import { consumeTalk as consumeTalkRaw } from "../input";
import {
  UR,
  UNDER_ROOMS,
  UNDER_TUNNELS,
  UNDER_HOLES,
  UNDER_SHORTS,
  underHeight,
  underRegionAt,
  surfaceHoleAt,
  underExitAt,
  enterBelow,
  leaveBelow,
  type UnderHole,
} from "./under";

function pay(n: number, key: string, listen?: string) {
  if (live.smashed[key]) return false;
  live.smashed[key] = true;
  if (n > 0) {
    const c = useGame.getState().addCoins(n);
    if (c > 0) revealItem("coin");
  }
  sfx.ok();
  if (listen) live.listen = listen;
  return true;
}

function talkOk() {
  if (live.nearNpc || live.nearHouse || live.nearChest || live.nearHorse || live.doorMath) return false;
  return consumeTalkRaw();
}

function fadeWarp(
  going: { current: "" | "in" | "out" },
  t: { current: number },
  dt: number,
  onMid: (dir: "in" | "out") => void,
) {
  if (!going.current) return;
  t.current += dt;
  const u = Math.min(1, t.current / 1.12);
  if (u < 0.5) live.roomFade = u / 0.5;
  else {
    live.roomFade = 1 - (u - 0.5) / 0.5;
    live.roomFadeOut = true;
  }
  live.speed = 0;
  if (u > 0.48 && u < 0.58) onMid(going.current);
  if (u >= 1) {
    going.current = "";
    live.roomFade = 0;
    live.roomFadeOut = false;
  }
}

export function UnderPlay() {
  return (
    <group>
      <UnderLoop />
      <SurfaceMouths />
      <BelowWorld />
    </group>
  );
}

function UnderLoop() {
  const going = useRef<"" | "in" | "out">("");
  const t = useRef(0);
  const dest = useRef<UnderHole | null>(null);
  const diveT = useRef(0);
  const cool = useRef(0);
  useFrame((_, raw) => {
    const dt = Math.min(0.1, raw);
    if (live.house || live.dungeon) return;
    const g = useGame.getState();
    cool.current = Math.max(0, cool.current - dt);

    if (!live.below) {
      live.underAt = "";
      const near = surfaceHoleAt(live.x, live.z);
      if (near && !going.current) {
        const h = near.hole;
        if (h.enter === "dive" && live.swim && near.d < h.r) diveT.current += dt;
        else diveT.current = 0;
        if (h.enter !== "walk" || near.d < h.r * 0.85) live.listen = live.listen || h.listen;
        const ready =
          (h.enter === "walk" && near.d < h.r * 0.72) ||
          (h.enter === "talk" && talkOk()) ||
          (h.enter === "dive" && diveT.current > 0.55);
        if (ready) {
          going.current = "in";
          dest.current = h;
          t.current = 0;
          sfx.thud();
        }
      } else diveT.current = 0;
    } else {
      const reg = underRegionAt(live.x, live.z);
      if (reg) live.underAt = reg;
      if (reg === "black" && !live.listen) live.listen = "Blackwater. A river with no sky.";
      const exit = cool.current <= 0 ? underExitAt(live.x, live.z) : null;
      if (exit && !going.current) {
        live.listen = live.listen || exit.hole.outListen;
        if (exit.d < 1.25 && talkOk()) {
          going.current = "out";
          dest.current = exit.hole;
          t.current = 0;
          sfx.thud();
        }
      }
      if (live.slash) tickSlash(g);
    }

    fadeWarp(going, t, dt, (dir) => {
      const hole = dest.current;
      if (!hole) return;
      if (dir === "in") {
        enterBelow(hole);
        cool.current = 1.35;
        if (takeCipher("under-world", false)) {
          live.listen = "The vale has a cellar. Nobody mended the stairs.";
        } else {
          live.listen = UR[hole.region].sub;
        }
      } else {
        leaveBelow(hole);
        live.listen = hole.outListen;
      }
    });
  }, 1);
  return null;
}

function tickSlash(g: ReturnType<typeof useGame.getState>) {
  const sl = live.slash;
  if (!sl) return;
  const r = sl.r ?? 1.4;
  if (Math.hypot(sl.x - UR.count.x, sl.z - UR.count.z + 2.2) < 1.8) {
    if (pay(0, "under-mural")) {
      takeCipher("under-count", true);
      if (g.grantHeartContainer("under-count")) {
        revealItem("container", true);
        live.listen = "Four pits. One blank. The well was never just a well.";
      }
    }
  }
}

function SurfaceMouths() {
  const [below, setBelow] = useState(false);
  useFrame(() => {
    if (live.below !== below) setBelow(live.below);
  });
  if (below) return null;
  return (
    <group>
      {UNDER_HOLES.filter((h) => h.kind !== "out").map((h) => (
        <Mouth key={h.id} hole={h} />
      ))}
    </group>
  );
}

function Mouth({ hole }: { hole: UnderHole }) {
  const y = heightAt(hole.x, hole.z);
  if (hole.enter === "dive") {
    return (
      <mesh position={[hole.x, y - 0.08, hole.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[hole.r * 0.62, 12]} />
        {lamb("#0a1014", { emit: 0.04, emissive: "#102028" })}
      </mesh>
    );
  }
  if (hole.id === "well" || hole.id === "mill" || hole.id === "count") {
    return (
      <group position={[hole.x, y, hole.z]}>
        <mesh position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.72, 10]} />
          {lamb("#0c0a08")}
        </mesh>
        <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0.2]}>
          <ringGeometry args={[0.55, 0.78, 10]} />
          {lamb("#3a3228")}
        </mesh>
      </group>
    );
  }
  return (
    <group position={[hole.x, y, hole.z]}>
      <mesh position={[0, 1.05, 0.12]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[1.55, 2.15, 0.22]} />
        {lamb("#14110e")}
      </mesh>
      <mesh position={[0, 0.02, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 8]} />
        {lamb("#0a0806")}
      </mesh>
    </group>
  );
}

function BelowWorld() {
  const [on, setOn] = useState(false);
  useFrame(() => {
    if (live.below !== on) setOn(live.below);
  });
  if (!on) return null;
  return (
    <group>
      <UnderFloors />
      <UnderTunnels />
      <UnderRiver />
      <UnderBridge />
      <GlowPlants />
      <RootHall />
      <BoneRuins />
      <EmberCracks />
      <CountMural />
      <MillGears />
      <WellShaft />
      <ExitDoors />
      <Creatures />
      <Loot />
      <UnderLights />
    </group>
  );
}

function UnderFloors() {
  return (
    <group>
      {UNDER_ROOMS.map((r) => (
        <group key={r.id}>
          <mesh position={[r.x, underHeight(r.x, r.z) - 0.02, r.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[r.r, 18]} />
            {lamb(r.floor, { kind: "stone" })}
          </mesh>
          <mesh position={[r.x, underHeight(r.x, r.z) + 5.6, r.z]}>
            <cylinderGeometry args={[r.r * 0.96, r.r * 1.05, 11.2, 14, 1, true]} />
            {lamb("#0c1012", { side: THREE.BackSide })}
          </mesh>
        </group>
      ))}
    </group>
  );
}

function UnderTunnels() {
  return (
    <group>
      {UNDER_TUNNELS.map((t) => {
        const a = UR[t.a];
        const b = UR[t.b];
        const mx = (a.x + b.x) * 0.5;
        const mz = (a.z + b.z) * 0.5;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const len = Math.hypot(dx, dz);
        const yaw = Math.atan2(dx, dz);
        const y = (underHeight(a.x, a.z) + underHeight(b.x, b.z)) * 0.5;
        return (
          <group key={`${t.a}-${t.b}`} position={[mx, y, mz]} rotation={[0, yaw, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[t.w * 2 - 0.4, len]} />
              {lamb("#1c1814", { kind: "stone" })}
            </mesh>
            <mesh position={[t.w + 0.15, 2.2, 0]}>
              <boxGeometry args={[0.45, 4.6, len]} />
              {lamb("#121014")}
            </mesh>
            <mesh position={[-(t.w + 0.15), 2.2, 0]}>
              <boxGeometry args={[0.45, 4.6, len]} />
              {lamb("#121014")}
            </mesh>
            <mesh position={[0, 4.55, 0]}>
              <boxGeometry args={[t.w * 2 + 0.6, 0.35, len]} />
              {lamb("#0a0c0e")}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function UnderRiver() {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshLambertMaterial>(null);
  useFrame(() => {
    if (mat.current) mat.current.emissiveIntensity = 0.22 + Math.sin(live.playT * 1.4) * 0.08;
  });
  const a = UR.glow;
  const b = UR.well;
  const c = UR.black;
  const segs: { x: number; z: number; len: number; yaw: number }[] = [];
  const push = (ax: number, az: number, bx: number, bz: number) => {
    const mx = (ax + bx) * 0.5;
    const mz = (az + bz) * 0.5;
    segs.push({ x: mx, z: mz, len: Math.hypot(bx - ax, bz - az), yaw: Math.atan2(bx - ax, bz - az) });
  };
  push(a.x + 6, a.z - 2, b.x + 4, b.z - 3.2);
  push(b.x + 4, b.z - 3.2, c.x - 2, c.z - 1.4);
  return (
    <group>
      {segs.map((s, i) => (
        <mesh
          key={i}
          ref={i === 0 ? mesh : undefined}
          position={[s.x, underHeight(s.x, s.z) - 0.42, s.z]}
          rotation={[-Math.PI / 2, 0, s.yaw]}
        >
          <planeGeometry args={[5.6, s.len + 1.2]} />
          <meshLambertMaterial
            ref={i === 0 ? mat : undefined}
            color="#1a3a50"
            emissive="#163848"
            emissiveIntensity={0.24}
            transparent
            opacity={0.88}
          />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => {
        const u = (i + 0.5) / 7;
        const x = THREE.MathUtils.lerp(b.x + 4, c.x - 2, u);
        const z = THREE.MathUtils.lerp(b.z - 3.2, c.z - 1.4, u) + Math.sin(i * 1.7) * 0.4;
        return (
          <mesh key={`fish-${i}`} position={[x, underHeight(x, z) - 0.18, z]}>
            <sphereGeometry args={[0.09, 6, 5]} />
            {lamb("#3a6a78", { emit: 0.35, emissive: "#2a8898" })}
          </mesh>
        );
      })}
    </group>
  );
}

function UnderBridge() {
  const x = UR.black.x - 3.2;
  const z = UR.black.z + 0.4;
  const y = 2.28;
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[2.1, 0.16, 8.4]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      {[-3.8, 3.8].map((s) => (
        <mesh key={s} position={[0.9, 0.55, s]}>
          <boxGeometry args={[0.12, 1.1, 0.12]} />
          {lamb("#4a3220")}
        </mesh>
      ))}
      {[-3.8, 3.8].map((s) => (
        <mesh key={`b${s}`} position={[-0.9, 0.55, s]}>
          <boxGeometry args={[0.12, 1.1, 0.12]} />
          {lamb("#4a3220")}
        </mesh>
      ))}
      <mesh position={[0, 1.05, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2.05, 0.08, 8.4]} />
        {lamb("#3a2818", { transparent: true, opacity: 0 })}
      </mesh>
    </group>
  );
}

function seeded(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function GlowPlants() {
  const spots = useMemo(() => {
    const out: { x: number; z: number; s: number; c: string }[] = [];
    const cols = ["#3ec8a0", "#7ae07a", "#c9e878", "#6ad0e8"];
    for (const r of [UR.glow, UR.root, UR.quiet, UR.well, UR.sink]) {
      for (let i = 0; i < 14; i++) {
        const a = seeded(i * 3 + r.x) * Math.PI * 2;
        const d = 2.2 + seeded(i * 9 + r.z) * (r.r - 3.4);
        out.push({
          x: r.x + Math.cos(a) * d,
          z: r.z + Math.sin(a) * d,
          s: 0.35 + seeded(i + r.r) * 0.45,
          c: cols[i % cols.length]!,
        });
      }
    }
    return out;
  }, []);
  const glow = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!glow.current) return;
    const k = 0.85 + Math.sin(live.playT * 2.1) * 0.15;
    glow.current.scale.setScalar(k);
  });
  return (
    <group>
      {spots.map((p, i) => {
        const y = underHeight(p.x, p.z);
        return (
          <group key={i} position={[p.x, y, p.z]}>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.04, 0.07, 0.28, 5]} />
              {lamb("#245038")}
            </mesh>
            <mesh position={[0, 0.34, 0]} scale={p.s}>
              <sphereGeometry args={[0.22, 7, 6]} />
              {lamb(p.c, { emit: 0.7, emissive: p.c })}
            </mesh>
          </group>
        );
      })}
      <group ref={glow} position={[UR.glow.x, underHeight(UR.glow.x, UR.glow.z) + 1.4, UR.glow.z]}>
        <pointLight color="#3ec8a0" intensity={1.6} distance={16} />
      </group>
    </group>
  );
}

function RootHall() {
  const r = UR.root;
  const y = underHeight(r.x, r.z);
  return (
    <group position={[r.x, y, r.z]}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 8.4, 3.4, Math.sin(a) * 8.4]} rotation={[0.4, -a, 0.15]}>
            <cylinderGeometry args={[0.38, 0.55, 8.2, 6]} />
            {lamb("#3a2a18", { kind: "wood" })}
          </mesh>
        );
      })}
      <mesh position={[0, 7.2, 0]}>
        <sphereGeometry args={[3.4, 8, 6]} />
        {lamb("#241810")}
      </mesh>
    </group>
  );
}

function BoneRuins() {
  const r = UR.bone;
  const y = underHeight(r.x, r.z);
  return (
    <group position={[r.x, y, r.z]}>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const broken = i % 3 === 1;
        return (
          <mesh key={i} position={[Math.cos(a) * 9.6, broken ? 1.1 : 2.35, Math.sin(a) * 9.6]}>
            <cylinderGeometry args={[0.42, 0.5, broken ? 2.2 : 4.7, 7]} />
            {lamb("#c4b090", { kind: "stone" })}
          </mesh>
        );
      })}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.4, 5.6, 16]} />
        {lamb("#8a7a58")}
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={`pit-${i}`} position={[Math.cos(a) * 2.4, 0.12, Math.sin(a) * 2.4]}>
            <cylinderGeometry args={[0.32, 0.38, 0.16, 8]} />
            {lamb(i === 3 ? "#1a1410" : "#c9a227", { emit: i === 3 ? 0 : 0.35, emissive: i === 3 ? "#000" : "#c9a227" })}
          </mesh>
        );
      })}
    </group>
  );
}

function EmberCracks() {
  const r = UR.ember;
  const y = underHeight(r.x, r.z);
  const mat = useRef<THREE.MeshLambertMaterial>(null);
  useFrame(() => {
    if (mat.current) mat.current.emissiveIntensity = 0.55 + Math.sin(live.playT * 2.8) * 0.2;
  });
  return (
    <group position={[r.x, y, r.z]}>
      {[-4, 0, 3.4].map((s, i) => (
        <mesh key={i} position={[s * 0.7, 0.04, s * 0.4]} rotation={[-Math.PI / 2, 0, i * 0.6]}>
          <planeGeometry args={[6.4, 0.42]} />
          <meshLambertMaterial ref={i === 0 ? mat : undefined} color="#e07038" emissive="#e07038" emissiveIntensity={0.6} />
        </mesh>
      ))}
      <pointLight position={[0, 1.6, 0]} color="#e07038" intensity={1.8} distance={18} />
    </group>
  );
}

function CountMural() {
  const r = UR.count;
  const y = underHeight(r.x, r.z);
  return (
    <group position={[r.x, y, r.z]}>
      <mesh position={[0, 2.1, -8.4]}>
        <boxGeometry args={[8.4, 4.2, 0.28]} />
        {lamb("#3a3228")}
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-2.7 + i * 1.8, 2.15, -8.22]}>
          <circleGeometry args={[0.42, 10]} />
          {lamb(i === 3 ? "#1a1410" : "#c9a227", { emit: i === 3 ? 0.05 : 0.45, emissive: i === 3 ? "#402010" : "#c9a227" })}
        </mesh>
      ))}
      <mesh position={[0, 0.2, -2.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 12]} />
        {lamb("#c9a227", { emit: 0.3, emissive: "#c9a227" })}
      </mesh>
    </group>
  );
}

function MillGears() {
  const r = UR.mill;
  const y = underHeight(r.x, r.z);
  const g1 = useRef<THREE.Mesh>(null);
  const g2 = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (g1.current) g1.current.rotation.z += dt * 0.4;
    if (g2.current) g2.current.rotation.z -= dt * 0.55;
  });
  return (
    <group position={[r.x, y, r.z]}>
      <mesh ref={g1} position={[-1.4, 1.6, -2.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.15, 1.15, 0.22, 12]} />
        {lamb("#8a6a38", { kind: "metal" })}
      </mesh>
      <mesh ref={g2} position={[1.2, 1.35, -2.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.78, 0.78, 0.22, 10]} />
        {lamb("#8a6a38", { kind: "metal" })}
      </mesh>
    </group>
  );
}

function WellShaft() {
  const r = UR.well;
  const y = underHeight(r.x, r.z);
  return (
    <group position={[r.x, y, r.z]}>
      <mesh position={[0, 6.4, 5.4]}>
        <cylinderGeometry args={[0.85, 0.95, 8.4, 10, 1, true]} />
        {lamb("#1a1410", { side: THREE.BackSide })}
      </mesh>
      <pointLight position={[0, 7.6, 5.4]} color="#e8d48a" intensity={1.35} distance={14} />
      <mesh position={[0, 10.4, 5.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 10]} />
        {lamb("#8ab0d0", { emit: 0.4, emissive: "#88a0c0" })}
      </mesh>
    </group>
  );
}

function ExitDoors() {
  const all = [...UNDER_HOLES, ...UNDER_SHORTS];
  return (
    <group>
      {all
        .filter((h) => h.kind !== "in")
        .map((h) => {
          const y = underHeight(h.ux, h.uz);
          return (
            <group key={h.id} position={[h.ux, y, h.uz]}>
              <mesh position={[0, 1.2, 0]}>
                <boxGeometry args={[1.25, 2.35, 0.16]} />
                {lamb("#0e0c0a")}
              </mesh>
              <mesh position={[0, 2.55, 0]}>
                <sphereGeometry args={[0.12, 6, 5]} />
                {lamb("#e8d48a", { emit: 0.8, emissive: "#e8d48a" })}
              </mesh>
            </group>
          );
        })}
    </group>
  );
}

function Creatures() {
  return (
    <group>
      <Crawlers />
      <PaleCounter />
      <Bats />
    </group>
  );
}

function Crawlers() {
  const homes = useMemo(
    () => [
      { x: UR.bone.x + 6, z: UR.bone.z + 4 },
      { x: UR.sink.x - 4, z: UR.sink.z + 2 },
      { x: UR.well.x + 10, z: UR.well.z - 8 },
      { x: (UR.well.x + UR.black.x) * 0.5, z: (UR.well.z + UR.black.z) * 0.5 },
      { x: UR.root.x + 8, z: UR.root.z - 4 },
      { x: UR.ember.x - 6, z: UR.ember.z - 4 },
    ],
    [],
  );
  const pos = useRef(homes.map((h) => ({ ...h, a: Math.random() * 6, dead: false })));
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, dt) => {
    const sl = live.slash;
    pos.current.forEach((p, i) => {
      if (p.dead) {
        if (refs.current[i]) refs.current[i]!.visible = false;
        return;
      }
      p.a += dt * 0.7;
      const x = homes[i]!.x + Math.cos(p.a) * 3.4;
      const z = homes[i]!.z + Math.sin(p.a * 0.85) * 3.4;
      p.x = x;
      p.z = z;
      const g = refs.current[i];
      if (g) {
        g.position.set(x, underHeight(x, z) + 0.22, z);
        g.rotation.y = p.a + 1.2;
        g.visible = Math.hypot(live.x - x, live.z - z) < 42;
      }
      if (sl && Math.hypot(sl.x - x, sl.z - z) < (sl.r ?? 1.4) + 0.4) {
        p.dead = true;
        pay(5, `crawler-${i}`, "It was counting legs. It stopped.");
      }
    });
  });
  return (
    <group>
      {homes.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <mesh>
            <sphereGeometry args={[0.28, 7, 6]} />
            {lamb("#5a4a38")}
          </mesh>
          <mesh position={[0.22, 0.04, 0.12]}>
            <sphereGeometry args={[0.08, 5, 4]} />
            {lamb("#c45c38", { emit: 0.4, emissive: "#c45c38" })}
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PaleCounter() {
  const p = useRef({ a: 0 });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!live.below) return;
    p.current.a += dt * 0.22;
    const x = UR.bone.x + Math.cos(p.current.a) * 6.4;
    const z = UR.bone.z + Math.sin(p.current.a) * 6.4;
    if (g.current) {
      g.current.position.set(x, underHeight(x, z), z);
      g.current.rotation.y = p.current.a + Math.PI / 2;
      g.current.visible = Math.hypot(live.x - x, live.z - z) < 36;
    }
    if (Math.hypot(live.x - x, live.z - z) < 3.2) {
      live.listen = live.listen || "It is still counting. It does not look up.";
    }
  });
  return (
    <group ref={g}>
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.28, 0.34, 1.5, 6]} />
        {lamb("#d8c8a0")}
      </mesh>
      <mesh position={[0, 2.05, 0]}>
        <sphereGeometry args={[0.28, 7, 6]} />
        {lamb("#efe6d4")}
      </mesh>
    </group>
  );
}

function Bats() {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!g.current) return;
    g.current.visible = live.underAt === "root" || live.underAt === "well";
    g.current.rotation.y = live.playT * 0.6;
  });
  const y = underHeight(UR.root.x, UR.root.z) + 3.6;
  return (
    <group ref={g} position={[UR.root.x, y, UR.root.z]}>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 4.2, Math.sin(i + 1) * 0.6, Math.sin(a) * 4.2]}>
            <sphereGeometry args={[0.12, 5, 4]} />
            {lamb("#1a1418")}
          </mesh>
        );
      })}
    </group>
  );
}

function Loot() {
  const [, bump] = useState(0);
  const got = (k: string) => Boolean(live.smashed[k]);
  const bits: { id: string; x: number; z: number; n: number; listen: string }[] = [
    { id: "glow-cache", x: UR.glow.x - 8.4, z: UR.glow.z + 4.2, n: 12, listen: "A rupee nest. The plants were keeping it." },
    { id: "root-cache", x: UR.root.x - 12.2, z: UR.root.z + 6.4, n: 16, listen: "Behind the hanging root. Someone hid a count." },
    { id: "ember-cache", x: UR.ember.x + 6.8, z: UR.ember.z - 5.2, n: 14, listen: "Warm rupees. The vein did not want them." },
    { id: "black-cache", x: UR.black.x + 8.4, z: UR.black.z + 9.2, n: 22, listen: "Behind the dark water. A purse nobody claimed." },
    { id: "quiet-cache", x: UR.quiet.x + 2.2, z: UR.quiet.z - 6.4, n: 10, listen: "They left a coin and a quiet." },
    { id: "sink-cache", x: UR.sink.x + 7.2, z: UR.sink.z - 3.4, n: 8, listen: "Mud kept a rupee. It can keep fewer now." },
    { id: "mill-cache", x: UR.mill.x - 3.4, z: UR.mill.z - 2.2, n: 9, listen: "Grain and gold. The mill forgot both." },
  ];
  useFrame(() => {
    if (!live.below) return;
    let hit = false;
    for (const b of bits) {
      if (got(b.id)) continue;
      if (Math.hypot(live.x - b.x, live.z - b.z) < 1.15) {
        pay(b.n, b.id, b.listen);
        hit = true;
      }
    }
    if (!got("bone-urn") && Math.hypot(live.x - UR.bone.x, live.z - (UR.bone.z - 6)) < 1.25) {
      pay(20, "bone-urn", "An urn with a number scraped off. The coins stayed.");
      hit = true;
    }
    if (!got("under-mural") && Math.hypot(live.x - UR.count.x, live.z - (UR.count.z - 2.2)) < 1.35) {
      live.listen = live.listen || "A gold ring on the floor. The wall is the same count. Swing if you want it to speak.";
    }
    if (hit) bump((n) => n + 1);
  });
  return (
    <group>
      {bits.map((b) =>
        got(b.id) ? null : (
          <mesh key={b.id} position={[b.x, underHeight(b.x, b.z) + 0.28, b.z]}>
            <octahedronGeometry args={[0.16, 0]} />
            {lamb("#3ec878", { emit: 0.7, emissive: "#1a6a40" })}
          </mesh>
        ),
      )}
      {got("bone-urn") ? null : (
        <mesh position={[UR.bone.x, underHeight(UR.bone.x, UR.bone.z - 6) + 0.45, UR.bone.z - 6]}>
          <cylinderGeometry args={[0.28, 0.34, 0.7, 8]} />
          {lamb("#c4b090")}
        </mesh>
      )}
    </group>
  );
}

function UnderLights() {
  return (
    <group>
      {UNDER_ROOMS.map((r) => (
        <pointLight
          key={r.id}
          position={[r.x, underHeight(r.x, r.z) + 2.4, r.z]}
          color={r.glow}
          intensity={r.id === "ember" ? 1.7 : 1.15}
          distance={r.r * 1.6}
        />
      ))}
    </group>
  );
}
