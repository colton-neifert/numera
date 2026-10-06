import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, fieldHeight } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { addTrapSpot } from "./dungeonTraps";
import { consumeTalk as consumeTalkRaw } from "../input";
import { MW, MOUNT_STREAM, mountLift, mountTrailU } from "./lands";
import { N64Sign, N64Person, HERO_LOOK } from "./actors";
import { takeCipher } from "../cipher";
import { isChestOpen, markChestOpen } from "./puzzles";
import { lamb } from "./mats";
import type { Ladder } from "./climb";
import { writeActive } from "../saves";
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

function hasClaws() {
  return (useGame.getState().quests?.claws ?? 0) >= 1;
}

const hits: { x: number; z: number; r: number }[] = [];

/** Line walls. Walking cannot cross these; ivy hop-off teleports past them. */
const WALLS: { ax: number; az: number; bx: number; bz: number; half: number }[] = [
  { ax: -110, az: 776, bx: 42, bz: 812, half: 2.4 },
  { ax: 122, az: 690, bx: 142, bz: 836, half: 2.25 },
  { ax: -50, az: 954, bx: 8, bz: 957, half: 2.3 },
  { ax: 32, az: 957, bx: 88, bz: 961, half: 2.3 },
];

export function addMountHit(x: number, z: number, r: number) {
  hits.push({ x, z, r });
}

function pushWalls(nx: number, nz: number): { x: number; z: number; hit: boolean } {
  if (live.climbing?.startsWith("mtn") || live.cave) return { x: nx, z: nz, hit: false };
  let x = nx;
  let z = nz;
  let hit = false;
  for (const w of WALLS) {
    const dx = w.bx - w.ax;
    const dz = w.bz - w.az;
    const len2 = dx * dx + dz * dz || 1;
    let t = ((x - w.ax) * dx + (z - w.az) * dz) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = w.ax + dx * t;
    const pz = w.az + dz * t;
    const sx = x - px;
    const sz = z - pz;
    const d = Math.hypot(sx, sz);
    if (d < w.half) {
      if (d > 1e-5) {
        x = px + (sx / d) * w.half;
        z = pz + (sz / d) * w.half;
      } else {
        z = pz + w.half;
      }
      hit = true;
    }
  }
  return { x, z, hit };
}

export function collideMount(nx: number, nz: number): { x: number; z: number } | null {
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
  const wall = pushWalls(x, z);
  x = wall.x;
  z = wall.z;
  if (wall.hit) hit = true;
  return hit ? { x, z } : null;
}

const VINES: { id: string; at: { x: number; z: number }; high: { x: number; z: number }; h: number }[] = [
  { id: "mtn-camp", at: MW.vineCamp, high: MW.shrine, h: 14.2 },
  { id: "mtn-gorge", at: MW.vineGorge, high: MW.tower, h: 16.4 },
  { id: "mtn-east", at: MW.vineEast, high: MW.eastledge, h: 18.2 },
  { id: "mtn-north", at: MW.vineNorth, high: MW.sky, h: 12.4 },
  { id: "mtn-summit", at: MW.vineSummit, high: MW.summit, h: 12.6 },
];

export function mountainLadders(): Ladder[] {
  if (!hasClaws()) return [];
  return VINES.map((v) => ({
    id: v.id,
    x: v.at.x,
    z: v.at.z,
    yaw: Math.atan2(-(v.high.x - v.at.x), -(v.high.z - v.at.z)),
    h: v.h,
    half: 0.74,
    destX: v.high.x,
    destZ: v.high.z,
  }));
}

let mountCave = false;

function fadeWarp(
  going: { current: "" | "in" | "out" },
  t: { current: number },
  dt: number,
  onMid: (dir: "in" | "out") => void,
) {
  if (!going.current) return;
  t.current += dt;
  const u = Math.min(1, t.current / 1.05);
  if (u < 0.5) live.roomFade = u / 0.5;
  else {
    live.roomFade = 1 - (u - 0.5) / 0.5;
    live.roomFadeOut = true;
  }
  live.speed = 0;
  if (u > 0.46 && u < 0.56) onMid(going.current);
  if (u >= 1) {
    going.current = "";
    live.roomFade = 0;
    live.roomFadeOut = false;
  }
}

export function MountPlay() {
  return (
    <group>
      <MountBegin />
      <VineHop />
      <MountGround />
      <MountSign />
      <StoneGate />
      <GoatMeadow />
      <HermitHut />
      <Camp />
      <RamGate />
      <NeedleRocks />
      <WestCairn />
      <Waterfall />
      <FallsCave />
      <CaveMouths />
      <CrackWall />
      <GorgeBridge />
      <Watchtower />
      <ShrineRuins />
      <EastLedge />
      <SkyBridge />
      <Summit />
      <CliffFaces />
      <CliffVines />
      <MountPines />
      <MountWildlife />
      <MountStream />
    </group>
  );
}

function MountBegin() {
  useFrame(() => {
    hits.length = 0;
  }, -3);
  return null;
}

function VineHop() {
  useFrame(() => {
    const id = live.climbing;
    if (!id || !id.startsWith("mtn")) return;
    const v = VINES.find((x) => x.id === id);
    if (!v || live.climbH < v.h * 0.88) return;
    live.x = v.high.x;
    live.z = v.high.z;
    live.y = heightAt(v.high.x, v.high.z) + 0.16;
    live.climbing = null;
    live.climbH = 0;
    live.climbV = 0;
    live.climbCool = 1.4;
    live.grounded = true;
    live.speed = 0;
    live.listen = "The claws found a hold. The shelf was always there.";
  }, 2);
  return null;
}

function MountGround() {
  const geo = useMemo(() => {
    const sizeX = 520;
    const sizeZ = 720;
    const ox = 10;
    const oz = 720;
    const segsX = 110;
    const segsZ = 128;
    const g = new THREE.PlaneGeometry(sizeX, sizeZ, segsX, segsZ);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + ox;
      const z = pos.getZ(i) + oz;
      pos.setX(i, x);
      pos.setZ(i, z);
      const ml = mountLift(x, z);
      const y = fieldHeight(x, z);
      pos.setY(i, y);
      const trail = mountTrailU(x, z);
      const snow = Math.min(1, Math.max(0, (ml - 42) / 14));
      const rock = Math.min(1, Math.max(0, (ml - 6) / 22));
      let r = 0.38 + rock * 0.18;
      let gv = 0.42 - rock * 0.08 + (1 - rock) * 0.08;
      let b = 0.28 + rock * 0.12;
      r = r * (1 - trail) + 0.55 * trail;
      gv = gv * (1 - trail) + 0.46 * trail;
      b = b * (1 - trail) + 0.32 * trail;
      r = r * (1 - snow) + 0.88 * snow;
      gv = gv * (1 - snow) + 0.9 * snow;
      b = b * (1 - snow) + 0.92 * snow;
      col[i * 3] = r;
      col[i * 3 + 1] = gv;
      col[i * 3 + 2] = b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}

function MountSign() {
  const { x, z } = MW.sign;
  useFrame(() => {
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 2.6) {
      const g = useGame.getState();
      if ((g.quests?.["map-mount"] ?? 0) < 1) g.setQuest("map-mount", 1);
      live.listen =
        live.listen ||
        "Stoneback. The peak is not a stair. Look up. Then find another way.";
    }
  });
  return <N64Sign x={x} z={z} />;
}

function StoneGate() {
  const { x, z } = MW.arch;
  const y = heightAt(x, z);
  useFrame(() => {
    addMountHit(x - 3.1, z, 0.95);
    addMountHit(x + 3.1, z, 0.95);
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 4 && live.stillT > 0.4)
      live.listen = live.listen || "Old work. They cut a door in the first hill so the rest would look farther.";
  }, -2);
  return (
    <group position={[x, y, z]}>
      {[-3.1, 3.1].map((s) => (
        <mesh key={s} position={[s, 3.1, 0]} castShadow>
          <boxGeometry args={[1.35, 6.2, 1.7]} />
          {lamb("#6a6458")}
        </mesh>
      ))}
      <mesh position={[0, 6.35, 0]} castShadow>
        <boxGeometry args={[7.6, 1.2, 1.9]} />
        {lamb("#7a7468")}
      </mesh>
      <mesh position={[0, 7.15, 0.15]} rotation={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[2.1, 0.7, 0.8]} />
        {lamb("#c9a227")}
      </mesh>
    </group>
  );
}

function GoatMeadow() {
  const { x, z } = MW.goat;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 8 && live.stillT > 0.7)
      live.listen = live.listen || "A shelf of grass. The tower sits above it like a tooth.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow>
        <circleGeometry args={[11.4, 16]} />
        {lamb("#6a7a44")}
      </mesh>
    </group>
  );
}

function HermitHut() {
  const { x, z } = MW.hut;
  const y = heightAt(x, z);
  useFrame(() => {
    addMountHit(x, z, 2.3);
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.2 && talkOk()) {
      live.listen = hasClaws()
        ? "The mountain took the claws back as a compliment. The top still keeps a count."
        : "The high rock is too smooth. Hands like iron live in the wet dark, behind the white water.";
    } else if (d < 4.2 && live.stillT > 0.5)
      live.listen = live.listen || "A hut under the switchbacks. Smoke. Someone stayed.";
  }, -2);
  return (
    <group>
      <group position={[x, y, z]}>
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[4.2, 2.1, 3.4]} />
          {lamb("#6a4a28")}
        </mesh>
        <mesh position={[0, 2.4, 0]} rotation={[0, 0.25, 0]} castShadow>
          <coneGeometry args={[3.2, 1.7, 4]} />
          {lamb("#5a5850")}
        </mesh>
        <mesh position={[0, 0.95, 1.75]} castShadow>
          <boxGeometry args={[0.85, 1.55, 0.12]} />
          {lamb("#3a2818")}
        </mesh>
        <mesh position={[1.35, 2.85, -0.3]} castShadow>
          <cylinderGeometry args={[0.2, 0.24, 1.0, 6]} />
          {lamb("#4a3a30")}
        </mesh>
      </group>
      <N64Person
        look={{ ...HERO_LOOK, tunic: "#6a6458", shirt: "#c8b090", kit: "vest", pants: "#4a463c", hairStyle: "short" }}
        x={x + 2.6}
        z={z + 2.2}
        seed={71}
        stay
        facing={-0.6}
      />
    </group>
  );
}

function Camp() {
  const { x, z } = MW.camp;
  const y = heightAt(x, z);
  const fire = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    addMountHit(x - 2.4, z + 1.1, 0.7);
    if (fire.current) {
      const u = 0.85 + Math.sin(clock.elapsedTime * 9) * 0.12;
      fire.current.scale.set(u, 1.1 + Math.sin(clock.elapsedTime * 11) * 0.15, u);
    }
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 5.5 && live.y > y + 8)
      live.listen = live.listen || "The camp is a toy under your boot. That is the point of a mountain.";
    else if (d < 4.2 && live.stillT > 0.4)
      live.listen =
        live.listen ||
        (hasClaws()
          ? "The north wall has holds now. The tower is not a painting."
          : "A fire. A cliff behind it. The tower sits up there pretending it is close.");
  }, -2);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[7.2, 14]} />
        {lamb("#6a5a40")}
      </mesh>
      {[-1.6, 1.4].map((s) => (
        <mesh key={s} position={[s, 0.55, -1.2]} rotation={[0, s * 0.2, 0.4]} castShadow>
          <cylinderGeometry args={[0.12, 0.16, 2.4, 5]} />
          {lamb("#4a3220")}
        </mesh>
      ))}
      <mesh position={[-1.6, 0.85, -1.2]} rotation={[0.15, 0.4, 0.2]} castShadow>
        <boxGeometry args={[1.8, 0.08, 1.1]} />
        {lamb("#5a3a22")}
      </mesh>
      <mesh ref={fire} position={[0.4, 0.55, 0.6]}>
        <coneGeometry args={[0.32, 0.9, 5]} />
        <meshLambertMaterial color="#e07030" emissive="#c04010" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.4, 0.12, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 8]} />
        {lamb("#3a2a20")}
      </mesh>
    </group>
  );
}

function RamGate() {
  const start = MW.ram;
  const p = useRef({ x: start.x, z: start.z });
  const g = useRef<THREE.Group>(null);
  const gone = useRef(Boolean(live.smashed.mtnram));
  useFrame(() => {
    if (live.house) return;
    const o = p.current;
    if (!gone.current) addMountHit(o.x, o.z, 1.45);
    const d = Math.hypot(live.x - o.x, live.z - o.z);
    const apples = useGame.getState().apples ?? 0;
    if (!gone.current && d < 1.9 && talkOk() && apples > 0) {
      useGame.setState({ apples: apples - 1 });
      gone.current = true;
      pay(10, "mtnram");
      live.listen = "It took the apple. The west ridge opened like a mouth.";
    } else if (!gone.current && live.slash && d < 2.0) {
      live.listen = "The horns rang. It did not move. An apple might.";
      sfx.hit();
    }
    if (gone.current) {
      o.x -= 0.012;
      o.z += 0.004;
    }
    if (g.current) {
      g.current.position.set(o.x, heightAt(o.x, o.z) + 0.45, o.z);
      g.current.visible = Math.hypot(o.x - start.x, o.z - start.z) < 22;
    }
    if (d < 2.8 && !gone.current)
      live.listen = live.listen || "A ram in the pinch. The west peak is behind it. Feed it, or turn around.";
  }, -2);
  return (
    <group ref={g} position={[start.x, heightAt(start.x, start.z) + 0.45, start.z]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.55, 8, 6]} />
        {lamb("#c8c0b4")}
      </mesh>
      <mesh position={[0, 0.62, -0.48]} castShadow>
        <sphereGeometry args={[0.32, 7, 6]} />
        {lamb("#d8d0c4")}
      </mesh>
      {[-0.22, 0.22].map((s) => (
        <mesh key={s} position={[s, 0.85, -0.42]} rotation={[0.4, 0, s * 2.4]}>
          <torusGeometry args={[0.22, 0.05, 5, 8, Math.PI]} />
          {lamb("#efe6d4")}
        </mesh>
      ))}
    </group>
  );
}

function NeedleRocks() {
  const { x, z } = MW.needle;
  const y = heightAt(x, z);
  const bits = [
    [0, 0, 7.4, 1.15],
    [-2.4, 1.6, 4.2, 0.9],
    [2.8, -1.1, 5.1, 0.8],
    [1.2, 2.4, 2.6, 0.7],
    [-1.1, -2.2, 3.4, 0.62],
  ];
  useFrame(() => {
    addMountHit(x, z, 1.2);
    addMountHit(x - 2.4, z + 1.6, 0.9);
    addMountHit(x + 2.8, z - 1.1, 0.85);
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 5)
      live.listen = live.listen || "Fingers of stone. The east ledge sits above them, empty, waiting.";
  }, -2);
  return (
    <group position={[x, y, z]}>
      {bits.map(([ox, oz, h, r], i) => (
        <mesh key={i} position={[ox, h * 0.5, oz]} castShadow>
          <cylinderGeometry args={[r * 0.55, r, h, 6]} />
          {lamb(i === 0 ? "#7a7468" : "#6a6458")}
        </mesh>
      ))}
    </group>
  );
}

function WestCairn() {
  const { x, z } = MW.westpeak;
  const y = heightAt(x, z);
  useFrame(() => {
    addMountHit(x, z, 0.7);
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 4 && live.stillT > 0.35)
      live.listen = live.listen || "A false top. The true peak still sits east, rude, and higher.";
  }, -2);
  return (
    <group position={[x, y, z]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.sin(i) * 0.35, 0.28 + i * 0.32, Math.cos(i) * 0.28]} castShadow>
          <dodecahedronGeometry args={[0.42 - i * 0.08, 0]} />
          {lamb("#8a8478")}
        </mesh>
      ))}
    </group>
  );
}

function Waterfall() {
  const { x, z } = MW.falls;
  const y = heightAt(x, z);
  const sheets = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    sheets.current.forEach((m, i) => {
      if (!m) return;
      const mat = m.material as THREE.MeshLambertMaterial;
      mat.opacity = 0.34 + Math.sin(t * 3.4 + i) * 0.1;
      m.position.y = y + 5.2 + Math.sin(t * 4.2 + i) * 0.1;
    });
    addMountHit(x + 4.2, z + 0.8, 1.9);
    addMountHit(x - 3.8, z + 0.6, 1.8);
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4.2 && !mountCave) live.listen = live.listen || "A white door. Walk through the middle.";
  }, -2);
  return (
    <group>
      <mesh position={[x + 0.6, y + 6.2, z + 1.8]} castShadow>
        <boxGeometry args={[9.4, 12.4, 3.6]} />
        {lamb("#5a5850")}
      </mesh>
      <mesh position={[x - 3.6, y + 5.4, z + 0.8]} castShadow>
        <boxGeometry args={[3.8, 10.8, 2.8]} />
        {lamb("#4a4840")}
      </mesh>
      <mesh position={[x + 0.2, y + 1.6, z + 0.15]}>
        <sphereGeometry args={[1.15, 8, 6]} />
        {lamb("#080604")}
      </mesh>
      {[-1.4, -0.2, 1.0].map((s, i) => (
        <mesh
          key={s}
          ref={(el) => {
            sheets.current[i] = el;
          }}
          position={[x + s * 0.85, y + 5.2, z - 0.4]}
          rotation={[0.1, 0, 0]}
        >
          <boxGeometry args={[1.35, 10.4, 0.22]} />
          <meshLambertMaterial color="#8ec8d8" transparent opacity={0.42} depthWrite={false} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={`mist${i}`} position={[x + (i - 2) * 0.8, y + 0.5 + (i % 2) * 0.25, z - 1.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.05, 8]} />
          <meshLambertMaterial color="#d8eef0" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
      <mesh position={[MW.pool.x, heightAt(MW.pool.x, MW.pool.z) + 0.08, MW.pool.z]} rotation={[-Math.PI / 2, 0, 0.1]}>
        <circleGeometry args={[7.6, 14]} />
        <meshLambertMaterial color="#3a7a88" transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
}

function FallsCave() {
  const fall = MW.falls;
  const cave = MW.claws;
  const out = MW.caveOut;
  const fy = heightAt(fall.x, fall.z);
  const cy = heightAt(cave.x, cave.z);
  const oy = heightAt(out.x, out.z);
  const going = useRef<"" | "in" | "out">("");
  const dest = useRef<"falls" | "ledge">("falls");
  const t = useRef(0);
  const got = useRef(isChestOpen("mtn-claws") || hasClaws());
  const [inside, setInside] = useState(false);
  useFrame((_, dt) => {
    if (live.house) return;
    const dFall = Math.hypot(live.x - fall.x, live.z - fall.z);
    const dCave = Math.hypot(live.x - cave.x, live.z - cave.z);
    if (!going.current && !mountCave && dFall < 1.55 && live.z > fall.z - 0.5) {
      going.current = "in";
      t.current = 0;
    }
    if (!going.current && mountCave && live.z > cave.z + 2.05 && dCave < 3.4) {
      going.current = "out";
      dest.current = "falls";
      t.current = 0;
    }
    if (!going.current && mountCave && live.z < cave.z - 2.05 && dCave < 3.4) {
      going.current = "out";
      dest.current = "ledge";
      t.current = 0;
    }
    fadeWarp(going, t, dt, (dir) => {
      mountCave = dir === "in";
      live.cave = mountCave;
      live.wetT = 2.4;
      if (dir === "in") {
        live.x = cave.x;
        live.z = cave.z + 0.2;
        live.y = cy + 0.2;
        pay(8, "mtncave");
        live.listen = "Behind the water. The mountain is hollow here.";
      } else if (dest.current === "ledge") {
        live.x = out.x;
        live.z = out.z + 1.4;
        live.y = oy + 0.2;
        live.cave = false;
        live.listen = "A mouth you did not enter. The camp is a toy below.";
      } else {
        live.x = fall.x;
        live.z = fall.z - 2.4;
        live.y = fy + 0.2;
        live.cave = false;
      }
    });
    if (inside !== mountCave) setInside(mountCave);
    if (mountCave) {
      live.dusk = Math.max(live.dusk, 0.78);
      addMountHit(cave.x - 2.6, cave.z, 0.5);
      addMountHit(cave.x + 2.6, cave.z, 0.5);
      if (!got.current && dCave < 1.45 && talkOk()) {
        got.current = true;
        markChestOpen("mtn-claws");
        const g = useGame.getState();
        g.setQuest("claws", 1);
        g.discover("claws");
        revealItem("claws", true);
        writeActive();
        live.listen = "Grip Claws. The smooth rock will have to argue now.";
      }
    }
  }, 1);
  if (!inside) return null;
  return (
    <group position={[cave.x, cy, cave.z]}>
      <mesh position={[0, 1.7, 2.4]}>
        <boxGeometry args={[6.2, 3.5, 0.45]} />
        {lamb("#1a1610")}
      </mesh>
      {[-3.0, 3.0].map((s) => (
        <mesh key={s} position={[s, 1.7, 0.2]}>
          <boxGeometry args={[0.45, 3.5, 5.2]} />
          {lamb("#221c14")}
        </mesh>
      ))}
      <mesh position={[0, 3.5, 0.2]}>
        <boxGeometry args={[6.2, 0.35, 5.4]} />
        {lamb("#140f0a")}
      </mesh>
      <mesh position={[-1.7, 1.7, -2.55]}>
        <boxGeometry args={[2.6, 3.5, 0.35]} />
        {lamb("#1a1610")}
      </mesh>
      <mesh position={[1.7, 1.7, -2.55]}>
        <boxGeometry args={[2.6, 3.5, 0.35]} />
        {lamb("#1a1610")}
      </mesh>
      <mesh position={[0, 3.05, -2.5]}>
        <boxGeometry args={[1.8, 0.8, 0.2]} />
        {lamb("#080604")}
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.6, 10]} />
        {lamb("#2a2418")}
      </mesh>
      <group position={[0.2, 0.2, -0.4]}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <boxGeometry args={[0.9, 0.5, 0.62]} />
          {lamb(got.current ? "#4a3220" : "#8a5a22")}
        </mesh>
        <mesh position={[0, 0.55, -0.04]} rotation={[got.current ? -1.35 : 0, 0, 0]} castShadow>
          <boxGeometry args={[0.9, 0.18, 0.62]} />
          {lamb("#c9a227")}
        </mesh>
      </group>
      <mesh position={[-1.4, 1.6, 1.1]}>
        <octahedronGeometry args={[0.14, 0]} />
        <meshLambertMaterial color="#e8d48a" emissive="#c9a227" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

function CaveMouths() {
  const fall = MW.falls;
  const out = MW.caveOut;
  const fy = heightAt(fall.x, fall.z);
  const oy = heightAt(out.x, out.z);
  useFrame(() => {
    if (live.house) return;
    if (Math.hypot(live.x - out.x, live.z - out.z) < 3.4 && !mountCave)
      live.listen = live.listen || "A dark mouth. It does not open from this side.";
  });
  return (
    <group>
      <mesh position={[out.x, oy + 1.4, out.z - 0.4]} castShadow>
        <boxGeometry args={[3.4, 2.8, 1.1]} />
        {lamb("#4a4840")}
      </mesh>
      <mesh position={[out.x, oy + 1.15, out.z + 0.15]}>
        <sphereGeometry args={[0.95, 8, 6]} />
        {lamb("#080604")}
      </mesh>
      <mesh position={[fall.x, fy + 1.55, fall.z + 0.55]}>
        <sphereGeometry args={[0.85, 8, 6]} />
        {lamb("#0a0806")}
      </mesh>
    </group>
  );
}

function CrackWall() {
  const { x, z } = MW.crack;
  const y = heightAt(x, z);
  const gone = useRef(Boolean(live.smashed.mtncrack));
  const going = useRef<"" | "in" | "out">("");
  const t = useRef(0);
  const [open, setOpen] = useState(gone.current);
  useFrame((_, dt) => {
    if (live.house) return;
    if (!gone.current) addMountHit(x, z, 1.55);
    for (const b of live.bombs) {
      if (b.boom && Math.hypot(b.x - x, b.z - z) < 3.4) {
        if (!gone.current) {
          gone.current = true;
          setOpen(true);
          pay(12, "mtncrack");
          live.listen = "The wall forgot it was a wall. A dark mouth behind it.";
          sfx.ok();
        }
      }
    }
    const d = Math.hypot(live.x - x, live.z - z);
    if (gone.current && d < 1.35 && !mountCave && !going.current) {
      going.current = "in";
      t.current = 0;
    }
    fadeWarp(going, t, dt, () => {
      mountCave = true;
      live.cave = true;
      live.x = MW.claws.x;
      live.z = MW.claws.z;
      live.y = heightAt(MW.claws.x, MW.claws.z) + 0.2;
      live.listen = "A cracked rib, then a room. Same dark as the water.";
    });
    if (!gone.current && d < 2.6)
      live.listen = live.listen || "A cracked rib of stone. Loud balls like this kind of argument.";
  }, -2);
  if (open) return null;
  return (
    <mesh position={[x, y + 1.7, z]} castShadow>
      <boxGeometry args={[2.6, 3.4, 1.1]} />
      {lamb("#5a5048")}
    </mesh>
  );
}

function GorgeBridge() {
  const a = MW.bridgeN;
  const b = MW.bridgeS;
  const ay = heightAt(a.x, a.z);
  const by = heightAt(b.x, b.z);
  const planks = [
    { x: a.x, z: a.z, y: ay },
    { x: a.x + 4, z: a.z + 3.2, y: ay - 0.4 },
    { x: b.x - 4, z: b.z - 3.2, y: by - 0.4 },
    { x: b.x, z: b.z, y: by },
  ];
  useFrame(() => {
    addTrapSpot(a.x, a.z, 1.35, 0.55);
    addTrapSpot(a.x + 3.2, a.z + 2.6, 1.15, 0.48);
    addTrapSpot(b.x - 3.2, b.z - 2.6, 1.15, 0.48);
    addTrapSpot(b.x, b.z, 1.35, 0.55);
    if (live.house) return;
    const mid = Math.hypot(live.x - MW.gorge.x, live.z - MW.gorge.z);
    if (mid < 5 && live.y > heightAt(live.x, live.z) + 2)
      live.listen = live.listen || "The middle is missing. The tower does not care.";
    else if (Math.hypot(live.x - a.x, live.z - a.z) < 3)
      live.listen = live.listen || "A bridge that lost its nerve. The far teeth still stand.";
  }, -2);
  return (
    <group>
      {planks.map((p, i) => (
        <mesh key={i} position={[p.x, p.y + 0.42, p.z]} rotation={[0, i < 2 ? 0.55 : 0.55, 0]} castShadow>
          <boxGeometry args={[2.6, 0.22, 1.4]} />
          {lamb("#5a3a22")}
        </mesh>
      ))}
      {[-1.1, 1.1].map((s) => (
        <mesh key={`r${s}`} position={[a.x + s * 0.7, ay + 1.05, a.z]} >
          <cylinderGeometry args={[0.06, 0.07, 1.6, 5]} />
          {lamb("#4a3220")}
        </mesh>
      ))}
    </group>
  );
}

function Watchtower() {
  const { x, z } = MW.tower;
  const y = heightAt(x, z);
  useFrame(() => {
    addMountHit(x, z, 1.85);
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4 && live.y > y + 1)
      live.listen = live.listen || "They watched the vale from here. The summit still sits higher, rude.";
    else if (d < 18 && live.y < y - 4 && live.stillT > 0.3)
      live.listen = live.listen || "A tower on a shelf you cannot walk. Something else has to hold.";
  }, -2);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 4.4, 0]} castShadow>
        <cylinderGeometry args={[1.7, 2.05, 8.8, 8]} />
        {lamb("#6a6458")}
      </mesh>
      <mesh position={[0, 9.1, 0]} castShadow>
        <cylinderGeometry args={[2.35, 2.2, 1.3, 8]} />
        {lamb("#7a7468")}
      </mesh>
      {[-1.6, 1.6].map((s) => (
        <mesh key={s} position={[s, 10.0, s * 0.2]} castShadow>
          <boxGeometry args={[0.35, 1.1, 0.35]} />
          {lamb("#5a5850")}
        </mesh>
      ))}
      <mesh position={[0, 5.2, 1.85]}>
        <boxGeometry args={[0.7, 1.2, 0.12]} />
        {lamb("#1a140e")}
      </mesh>
    </group>
  );
}

function ShrineRuins() {
  const { x, z } = MW.shrine;
  const y = heightAt(x, z);
  const cols = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return { x: Math.cos(a) * 5.4, z: Math.sin(a) * 5.4, h: 2.4 + (i % 3) * 0.7, broken: i === 2 || i === 5 };
      }),
    [],
  );
  useFrame(() => {
    for (const c of cols) addMountHit(x + c.x, z + c.z, 0.55);
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 6 && live.stillT > 0.35)
      live.listen = live.listen || "A count was kept here. Six stones. The seventh was the mountain.";
  }, -2);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[6.8, 14]} />
        {lamb("#7a7468")}
      </mesh>
      {cols.map((c, i) => (
        <mesh key={i} position={[c.x, c.broken ? c.h * 0.28 : c.h * 0.5, c.z]} rotation={[c.broken ? 1.1 : 0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.48, c.broken ? c.h * 0.55 : c.h, 7]} />
          {lamb("#8a8478")}
        </mesh>
      ))}
    </group>
  );
}

function EastLedge() {
  const { x, z } = MW.eastledge;
  const y = heightAt(x, z);
  const nest = MW.nest;
  const got = useRef(Boolean(live.smashed.mtnnest));
  useFrame(() => {
    addTrapSpot(x, z, 4.2, 0.2);
    addTrapSpot(nest.x, nest.z, 2.2, 0.25);
    if (live.house) return;
    const d = Math.hypot(live.x - nest.x, live.z - nest.z);
    if (!got.current && d < 1.2) {
      got.current = true;
      pay(24, "mtnnest");
      live.listen = "A nest of wind and gold. The bird was not using it.";
    }
    if (Math.hypot(live.x - x, live.z - z) < 5)
      live.listen = live.listen || "The ledge you saw from the needles. It was never a stair.";
  }, -2);
  return (
    <group>
      <group position={[x, y, z]}>
        <mesh position={[0, 0.8, 0]} rotation={[0.1, 0.4, -0.08]} castShadow>
          <boxGeometry args={[3.4, 1.6, 1.3]} />
          {lamb("#6a6458")}
        </mesh>
        <mesh position={[1.6, 1.6, -0.4]} rotation={[0.2, -0.3, 0.15]} castShadow>
          <boxGeometry args={[1.1, 2.4, 0.9]} />
          {lamb("#7a7468")}
        </mesh>
      </group>
      <mesh position={[nest.x, heightAt(nest.x, nest.z) + 0.12, nest.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.85, 8]} />
        {lamb("#6a4a28")}
      </mesh>
      {!got.current ? (
        <mesh position={[nest.x, heightAt(nest.x, nest.z) + 0.28, nest.z]}>
          <octahedronGeometry args={[0.14, 0]} />
          <meshLambertMaterial color="#3ec878" />
        </mesh>
      ) : null}
    </group>
  );
}

function SkyBridge() {
  const a = MW.sky;
  const b = MW.vineSummit;
  const ay = heightAt(a.x, a.z);
  useFrame(() => {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    for (let i = 0; i <= 6; i++) {
      const u = i / 6;
      addTrapSpot(a.x + dx * u, a.z + dz * u, 0.95, 0.7);
    }
    if (live.house) return;
    if (Math.hypot(live.x - a.x, live.z - a.z) < 3)
      live.listen = live.listen || "A spine of planks in the air. The top is no longer a rumor.";
  }, -2);
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  return (
    <mesh position={[(a.x + b.x) * 0.5, ay + 0.55, (a.z + b.z) * 0.5]} rotation={[0, Math.atan2(dx, dz), 0]} castShadow>
      <boxGeometry args={[1.5, 0.22, len + 0.6]} />
      {lamb("#6a5a48")}
    </mesh>
  );
}

function Summit() {
  const { x, z } = MW.summit;
  const tab = MW.tablet;
  const y = heightAt(x, z);
  const ty = heightAt(tab.x, tab.z);
  const got = useRef(isChestOpen("mtn-summit"));
  const stones = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        return { x: Math.cos(a) * 6.6, z: Math.sin(a) * 6.6, h: 1.3 + (i % 3) * 0.35 };
      }),
    [],
  );
  useFrame(() => {
    addTrapSpot(x, z, 7.2, 0.15);
    if (live.house) return;
    const d = Math.hypot(live.x - tab.x, live.z - tab.z);
    if (!got.current && d < 1.55 && talkOk()) {
      got.current = true;
      markChestOpen("mtn-summit");
      const g = useGame.getState();
      if (g.grantHeartContainer("peak-heart")) revealItem("container", true);
      revealItem("crystal", true);
      takeCipher("peak-count", false);
      if ((g.quests?.["map-mount"] ?? 0) < 1) g.setQuest("map-mount", 1);
      pay(40, "mtnsummit");
      writeActive();
      live.listen =
        "The mountain kept a digit the vale was told to forget. Not a jewel. A count. Oakstead is a green stamp under your heel.";
    } else if (Math.hypot(live.x - x, live.z - z) < 8 && live.stillT > 0.35)
      live.listen =
        live.listen ||
        "The top. Wind. A bronze disk. The vale looks small enough to count on one hand.";
  }, -2);
  return (
    <group>
      <group position={[x, y, z]}>
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[8.4, 16]} />
          {lamb("#d8e0e8")}
        </mesh>
        {stones.map((s, i) => (
          <mesh key={i} position={[s.x, s.h * 0.5, s.z]} castShadow>
            <boxGeometry args={[0.7, s.h, 0.48]} />
            {lamb(i === 0 ? "#c9a227" : "#8a8478")}
          </mesh>
        ))}
        <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0.4]} receiveShadow>
          <circleGeometry args={[2.2, 16]} />
          <meshLambertMaterial color="#b08a38" emissive="#6a4a10" emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[0, 2.4, -1.8]} castShadow>
          <cylinderGeometry args={[0.55, 0.7, 4.6, 8]} />
          {lamb("#8a8478")}
        </mesh>
        <mesh position={[0, 4.85, -1.8]} rotation={[0.15, 0, 0]} castShadow>
          <coneGeometry args={[1.35, 0.7, 6]} />
          {lamb("#6a6458")}
        </mesh>
      </group>
      <group position={[tab.x, ty, tab.z]}>
        <mesh position={[0, 0.7, 0]} rotation={[0.15, 0.4, 0]} castShadow>
          <boxGeometry args={[1.15, 1.35, 0.22]} />
          {lamb("#4a463c")}
        </mesh>
        <mesh position={[0, 0.72, 0.08]} rotation={[0.15, 0.4, 0]}>
          <boxGeometry args={[0.7, 0.12, 0.04]} />
          {lamb("#c9a227")}
        </mesh>
        <mesh position={[0, 0.5, 0.08]} rotation={[0.15, 0.4, 0]}>
          <boxGeometry args={[0.55, 0.1, 0.04]} />
          {lamb("#8a8478")}
        </mesh>
        {!got.current ? (
          <mesh position={[0, 1.55, 0]}>
            <octahedronGeometry args={[0.22, 0]} />
            <meshLambertMaterial color="#e8d48a" emissive="#c9a227" emissiveIntensity={0.85} />
          </mesh>
        ) : null}
      </group>
    </group>
  );
}

function CliffFaces() {
  const faces = useMemo(
    () => [
      { x: -42, z: 786, y: 8.4, w: 18, h: 16, d: 2.4, yaw: 0.18 },
      { x: 12, z: 818, y: 7.2, w: 16, h: 14, d: 2.2, yaw: 0.55 },
      { x: 132, z: 760, y: 9.2, w: 12, h: 18, d: 2.6, yaw: -0.4 },
      { x: 24, z: 968, y: 8.8, w: 22, h: 16, d: 2.8, yaw: 0.05 },
      { x: -88, z: 860, y: 7.6, w: 10, h: 12, d: 2.2, yaw: 1.1 },
    ],
    [],
  );
  useFrame(() => {
    for (const f of faces) addMountHit(f.x, f.z, Math.min(f.w, f.d) * 0.55);
  }, -2);
  return (
    <group>
      {faces.map((f, i) => (
        <mesh key={i} position={[f.x, heightAt(f.x, f.z) + f.y * 0.45, f.z]} rotation={[0, f.yaw, 0]} castShadow>
          <boxGeometry args={[f.w, f.h, f.d]} />
          {lamb(i % 2 ? "#6a6458" : "#5a5850")}
        </mesh>
      ))}
    </group>
  );
}

function CliffVines() {
  useFrame(() => {
    if (live.house) return;
    if (hasClaws()) return;
    for (const v of VINES) {
      if (Math.hypot(live.x - v.at.x, live.z - v.at.z) < 2.1)
        live.listen = live.listen || "Ivy on a face too smooth. You need something that bites rock.";
    }
  });
  return (
    <group>
      {VINES.map((v) => {
        const y = heightAt(v.at.x, v.at.z);
        const yaw = Math.atan2(-(v.high.x - v.at.x), -(v.high.z - v.at.z));
        return (
          <group key={v.id} position={[v.at.x, y, v.at.z]} rotation={[0, yaw, 0]}>
            {Array.from({ length: 10 }, (_, i) => (
              <mesh key={i} position={[((i % 2) - 0.5) * 0.18, 0.4 + i * (v.h / 10), 0.05]}>
                <boxGeometry args={[0.16, v.h / 11, 0.07]} />
                {lamb(hasClaws() ? "#2a7a38" : "#245a2c")}
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function MountPines() {
  const trees = useMemo(
    () => [
      { x: 8, z: 470, s: 1.7 },
      { x: -22, z: 490, s: 1.55 },
      { x: 44, z: 510, s: 1.8 },
      { x: -70, z: 560, s: 1.9 },
      { x: 8, z: 560, s: 1.45 },
      { x: -40, z: 600, s: 1.6 },
      { x: 60, z: 580, s: 1.5 },
      { x: -110, z: 640, s: 1.75 },
      { x: 40, z: 640, s: 1.4 },
      { x: -20, z: 680, s: 1.35 },
      { x: 80, z: 620, s: 1.65 },
      { x: -140, z: 700, s: 1.5 },
      { x: 20, z: 520, s: 1.3 },
      { x: -88, z: 500, s: 1.85 },
      { x: 100, z: 500, s: 1.4 },
    ],
    [],
  );
  useFrame(() => {
    for (const t of trees) addMountHit(t.x, t.z, 0.55 * t.s);
  }, -2);
  return (
    <group>
      {trees.map((t, i) => (
        <VolTree key={i} x={t.x} z={t.z} s={t.s} kind="pine" seed={80 + i} />
      ))}
    </group>
  );
}

function GoatBody({ tint }: { tint: string }) {
  return (
    <group>
      <mesh position={[0, 0.42, 0]} castShadow>
        <sphereGeometry args={[0.32, 7, 6]} />
        {lamb(tint)}
      </mesh>
      <mesh position={[0, 0.55, -0.32]} castShadow>
        <sphereGeometry args={[0.18, 6, 5]} />
        {lamb("#e0d8cc")}
      </mesh>
      {[-0.1, 0.1].map((s) => (
        <mesh key={s} position={[s, 0.72, -0.28]} rotation={[0.5, 0, s * 2.2]}>
          <coneGeometry args={[0.04, 0.22, 5]} />
          {lamb("#efe6d4")}
        </mesh>
      ))}
    </group>
  );
}

function MountWildlife() {
  const g0 = useRef<THREE.Group>(null);
  const g1 = useRef<THREE.Group>(null);
  const eagle = useRef<THREE.Group>(null);
  const marm = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = live.playT;
    if (g0.current) {
      const gx = MW.goat.x + Math.sin(t * 0.18) * 6;
      const gz = MW.goat.z + Math.cos(t * 0.14) * 4;
      g0.current.position.set(gx, heightAt(gx, gz) + 0.35, gz);
    }
    if (g1.current) {
      const gx = MW.goat.x + Math.cos(t * 0.15) * 5.5;
      const gz = MW.goat.z + 6 + Math.sin(t * 0.12) * 3;
      g1.current.position.set(gx, heightAt(gx, gz) + 0.35, gz);
    }
    if (eagle.current) {
      const a = t * 0.35;
      const ex = MW.summit.x + Math.cos(a) * 18;
      const ez = MW.summit.z + Math.sin(a) * 14;
      eagle.current.position.set(ex, heightAt(MW.summit.x, MW.summit.z) + 14 + Math.sin(t * 0.8) * 1.4, ez);
      eagle.current.rotation.y = a + Math.PI / 2;
    }
    if (marm.current) {
      const hide = Math.hypot(live.x - MW.needle.x, live.z - MW.needle.z) < 7;
      const mx = MW.needle.x + 4.2;
      const mz = MW.needle.z - 3.2;
      marm.current.position.set(mx, heightAt(mx, mz) + (hide ? -0.4 : 0.2), mz);
    }
  });
  return (
    <group>
      <group ref={g0}>
        <GoatBody tint="#d0c8bc" />
      </group>
      <group ref={g1}>
        <GoatBody tint="#c8c0b4" />
      </group>
      <group ref={eagle}>
        <mesh>
          <sphereGeometry args={[0.18, 6, 5]} />
          {lamb("#3a322c")}
        </mesh>
        <mesh>
          <boxGeometry args={[1.6, 0.06, 0.28]} />
          {lamb("#2a241c")}
        </mesh>
      </group>
      <group ref={marm}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <sphereGeometry args={[0.22, 6, 5]} />
          {lamb("#8a6a48")}
        </mesh>
      </group>
    </group>
  );
}

function MountStream() {
  const sheets = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    sheets.current.forEach((m, i) => {
      if (!m) return;
      const mat = m.material as THREE.MeshLambertMaterial;
      mat.opacity = 0.45 + Math.sin(t * 2.4 + i) * 0.08;
    });
  });
  return (
    <group>
      {MOUNT_STREAM.slice(0, -1).map((a, i) => {
        const b = MOUNT_STREAM[i + 1]!;
        const mx = (a[0] + b[0]) * 0.5;
        const mz = (a[1] + b[1]) * 0.5;
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const len = Math.hypot(dx, dz);
        const y = heightAt(mx, mz) + 0.08;
        return (
          <mesh
            key={i}
            ref={(el) => {
              sheets.current[i] = el;
            }}
            position={[mx, y, mz]}
            rotation={[-Math.PI / 2, 0, Math.atan2(dx, dz)]}
          >
            <planeGeometry args={[1.55, len + 0.6]} />
            <meshLambertMaterial color="#4a90a0" transparent opacity={0.5} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}
