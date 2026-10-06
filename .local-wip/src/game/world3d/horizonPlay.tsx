import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fieldHeight } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { takeCipher } from "../cipher";
import { HeartContainerMesh } from "./actors";
import { lamb } from "./mats";
import { HZ, logBridged, mesaOpen, glenOpen, markHorizon, type HorizonId } from "./horizon";

const STONE = "#8a8478";
const STONE_D = "#5a564c";
const GOLD = "#c9a227";
const WOOD = "#6a4a28";
const PLASTER = "#efe4cc";
const ROOF = "#8a3a28";

function pay(n: number, key: string, listen?: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  if (n > 0) {
    const c = useGame.getState().addCoins(n);
    if (c > 0) revealItem("coin");
    sfx.ok();
  }
  if (listen) live.listen = listen;
}

export function HorizonPlay() {
  return (
    <group>
      <HorizonSee />
      <WatchCastle />
      <GorgeAndLog />
      <CliffTunnel />
      <MouthLight />
      <CanopyHut />
      <WestFall />
      <MesaPalace />
      <IceSpire />
      <FenLantern />
      <OldZig />
    </group>
  );
}

function HorizonSee() {
  const told = useRef<Record<string, boolean>>({});
  useFrame(() => {
    if (live.house || live.below || live.dungeon) return;
    const spots: { id: HorizonId; x: number; z: number; r: number; line: string }[] = [
      { id: "watch", x: HZ.watch.x, z: HZ.watch.z, r: 220, line: "Flags on a hill. A split in the land before them." },
      { id: "light", x: HZ.light.x, z: HZ.light.z, r: 280, line: "A white tooth on the river’s mouth. The lamp is real." },
      { id: "canopy", x: HZ.canopy.x, z: HZ.canopy.z, r: 160, line: "A roof in the owl tree. Someone climbed that." },
      { id: "fall", x: HZ.fall.x, z: HZ.fall.z, r: 90, line: "White water behind the west hill. You can hear it from here." },
      { id: "palace", x: HZ.palace.x, z: HZ.palace.z, r: 420, line: "Gold on the southeast sky. A palace on a table of sand." },
      { id: "crown", x: HZ.crown.x, z: HZ.crown.z, r: 480, line: "A needle of ice, north of the last mountain." },
      { id: "fen", x: HZ.fen.x, z: HZ.fen.z, r: 380, line: "A lamp in the swamp that does not go out." },
      { id: "zig", x: HZ.zig.x, z: HZ.zig.z, r: 400, line: "Old Numer’s stair. The south stones still have a top." },
    ];
    for (const s of spots) {
      const d = Math.hypot(live.x - s.x, live.z - s.z);
      if (d < s.r && d > 18 && !told.current[s.id] && !live.listen) {
        told.current[s.id] = true;
        live.listen = s.line;
      }
    }
  });
  return null;
}

function WatchCastle() {
  const v = HZ.watch;
  const y = fieldHeight(v.x, v.z);
  useFrame(() => {
    const d = Math.hypot(live.x - v.x, live.z - v.z);
    if (d < 22 && d > 7 && !live.house && !live.listen) {
      live.listen = logBridged()
        ? "The watch is open. The gorge kept it for later."
        : "The keep on the hill. The road is a mouth. You will need a tree.";
    }
    if (live.house === "watch" && markHorizon("watch")) {
      takeCipher("watch-keep", true);
      live.listen = "The flags you saw from the lookout. You are under them.";
      sfx.ok();
    }
  });
  const H = 7.4;
  return (
    <group position={[v.x, y, v.z]}>
      <mesh position={[0, H * 0.38, 0]} castShadow>
        <boxGeometry args={[8.4, H * 0.76, 6.8]} />
        {lamb("#c2b094")}
      </mesh>
      <mesh position={[0, H * 0.78, 0]} receiveShadow>
        <boxGeometry args={[8.9, 0.28, 7.3]} />
        {lamb(STONE)}
      </mesh>
      {[-3.6, -1.2, 1.2, 3.6].flatMap((x) =>
        [-3.0, 3.0].map((z) => (
          <mesh key={`${x}${z}`} position={[x, H * 0.86, z]} castShadow>
            <boxGeometry args={[0.55, 0.7, 0.55]} />
            {lamb(STONE_D)}
          </mesh>
        )),
      )}
      <mesh position={[-3.4, H * 1.15, -2.4]} castShadow>
        <cylinderGeometry args={[1.15, 1.28, H * 0.85, 10]} />
        {lamb("#b8a888")}
      </mesh>
      <mesh position={[-3.4, H * 1.62, -2.4]} castShadow>
        <coneGeometry args={[1.55, 1.7, 10]} />
        {lamb(ROOF)}
      </mesh>
      <mesh position={[3.4, H * 1.05, -2.2]} castShadow>
        <cylinderGeometry args={[1.05, 1.18, H * 0.7, 10]} />
        {lamb("#b8a888")}
      </mesh>
      <mesh position={[3.4, H * 1.48, -2.2]} castShadow>
        <coneGeometry args={[1.42, 1.5, 10]} />
        {lamb(ROOF)}
      </mesh>
      <mesh position={[0, 2.2, 3.55]} castShadow>
        <boxGeometry args={[2.15, 3.4, 0.28]} />
        {lamb("#5a4030")}
      </mesh>
      <mesh position={[0, 1.55, 3.72]}>
        <boxGeometry args={[1.05, 2.15, 0.12]} />
        {lamb("#3a2818")}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 2.6, H * 1.55, -2.3]} rotation={[0, 0.2 * s, 0]}>
          <planeGeometry args={[0.85, 0.55]} />
          <meshLambertMaterial color="#8a2a28" side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh position={[0, 16.4, -1.1]} castShadow>
        <cylinderGeometry args={[1.65, 1.95, 18.4, 10]} />
        {lamb("#b8a888")}
      </mesh>
      <mesh position={[0, 26.2, -1.1]} castShadow>
        <coneGeometry args={[2.35, 3.2, 8]} />
        {lamb(ROOF)}
      </mesh>
      {[-2.8, 2.8].map((s) => (
        <group key={`pole${s}`} position={[s, 0, 2.4]}>
          <mesh position={[0, 18, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 22, 5]} />
            {lamb(STONE_D)}
          </mesh>
          <mesh position={[s > 0 ? 1.6 : -1.6, 26.4, 0]} rotation={[0, 0.15 * Math.sign(s), 0.08]}>
            <planeGeometry args={[3.2, 1.55]} />
            <meshLambertMaterial color="#8a2a28" side={THREE.DoubleSide} fog={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 27.6, -1.1]}>
        <sphereGeometry args={[0.55, 8, 6]} />
        <meshLambertMaterial color="#f4c878" emissive="#f0a020" emissiveIntensity={2.4} fog={false} />
      </mesh>
      <mesh position={[0, 52, -1.1]}>
        <cylinderGeometry args={[0.22, 0.55, 48, 6]} />
        <meshBasicMaterial color="#ffd080" transparent opacity={0.22} depthWrite={false} fog={false} />
      </mesh>
      <pointLight position={[0, 28, -1.1]} color="#ffc060" distance={90} intensity={6.5} />
      <WatchChest />
    </group>
  );
}

function WatchChest() {
  const open = useRef(Boolean(live.smashed["watch-chest"]));
  const v = HZ.watch;
  useFrame(() => {
    if (open.current || live.house !== "watch") return;
    if (Math.hypot(live.x - v.x, live.z - (v.z - 1.1)) < 1.2) {
      open.current = true;
      live.smashed["watch-chest"] = true;
      if (useGame.getState().grantHeartContainer("watch-keep")) revealItem("container");
      sfx.get();
      live.listen = "The hill kept a heart. The gorge was only ever a delay.";
    }
  });
  if (open.current) return null;
  return (
    <group position={[0, 0.42, -1.1]}>
      <HeartContainerMesh />
    </group>
  );
}

function GorgeAndLog() {
  const log = useRef({ x: HZ.log.x, z: HZ.log.z });
  const g = useRef<THREE.Group>(null);
  const bridged = useRef(logBridged());
  useFrame((_, dt) => {
    if (live.house || bridged.current) return;
    const o = log.current;
    const d = Math.hypot(live.x - o.x, live.z - o.z);
    if (d < 1.35 && Math.abs(live.speed) > 1.6) {
      o.x += -Math.sin(live.yaw) * 5.2 * dt;
      o.z += -Math.cos(live.yaw) * 5.2 * dt;
    }
    const onto = Math.abs(o.x - HZ.gorge.x) < 3.4 && Math.abs(o.z - HZ.gorge.z) < 4.6;
    if (onto) {
      bridged.current = true;
      o.x = HZ.gorge.x;
      o.z = HZ.gorge.z;
      pay(16, "watch-log", "The pine sat. The hill is a walk now.");
      sfx.ok();
    } else if (d < 2.4) {
      live.listen = live.listen || "A fallen pine. The gorge wants this.";
    }
    if (g.current) {
      const y = fieldHeight(o.x, o.z) + 0.42;
      g.current.position.set(o.x, y, o.z);
    }
  });
  const gy = fieldHeight(HZ.gorge.x, HZ.gorge.z - 6);
  return (
    <group>
      <mesh position={[HZ.gorge.x - 24, gy - 3.2, HZ.gorge.z]} rotation={[0, 0.02, 0]}>
        <boxGeometry args={[22, 8, 6.4]} />
        {lamb("#3a3228")}
      </mesh>
      <mesh position={[HZ.gorge.x + 24, gy - 3.2, HZ.gorge.z]} rotation={[0, -0.02, 0]}>
        <boxGeometry args={[22, 8, 6.4]} />
        {lamb("#3a3228")}
      </mesh>
      <group ref={g} rotation={[0.08, 0.15, 0]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.48, 9.4, 8]} />
          {lamb(WOOD)}
        </mesh>
      </group>
    </group>
  );
}

function CliffTunnel() {
  useFrame(() => {
    if (live.house !== "cliff") return;
    if (live.z > HZ.watch.z - 90 && Math.abs(live.x - 54) < 1.6 && live.z > 405.4) {
      live.x = HZ.watch.x;
      live.z = HZ.watch.z + 8.4;
      live.y = fieldHeight(HZ.watch.x, HZ.watch.z + 8.4);
      live.house = null;
      live.houseY = 0;
      live.listen = "The hole in the rock had a back door. The castle was always this close.";
      sfx.ok();
      markHorizon("watch");
    }
  });
  return null;
}

function MouthLight() {
  const v = HZ.light;
  const y = fieldHeight(v.x, v.z);
  const lamp = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const d = Math.hypot(live.x - v.x, live.z - v.z);
    if (d < 28 && d > 6 && !live.house && !live.listen) {
      live.listen = "The mouth-light. From the vale it was a tooth. Up close it is a door.";
    }
    if (live.house === "light" && markHorizon("light")) {
      takeCipher("mouth-light", true);
      live.listen = "You walked the river until the lamp was a room.";
      sfx.ok();
    }
    if (lamp.current) lamp.current.intensity = 4.2 + Math.sin(clock.elapsedTime * 2.4) * 0.6;
  });
  return (
    <group position={[v.x, y, v.z]}>
      <mesh position={[0, 10.4, 0]} castShadow>
        <cylinderGeometry args={[1.22, 1.55, 20.8, 10]} />
        {lamb("#efe6d4")}
      </mesh>
      <mesh position={[0, 21.1, 0]} castShadow>
        <cylinderGeometry args={[1.75, 1.75, 0.32, 10]} />
        {lamb(STONE_D)}
      </mesh>
      <mesh position={[0, 22.4, 0]}>
        <cylinderGeometry args={[1.15, 1.22, 2.2, 8]} />
        <meshLambertMaterial color="#f4e4a8" emissive="#f0c060" emissiveIntensity={1.6} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 24.1, 0]} castShadow>
        <coneGeometry args={[1.65, 1.7, 8]} />
        {lamb(ROOF)}
      </mesh>
      <mesh position={[0, 48, 0]}>
        <cylinderGeometry args={[0.18, 0.7, 52, 6]} />
        <meshBasicMaterial color="#ffe8b0" transparent opacity={0.28} depthWrite={false} fog={false} />
      </mesh>
      <pointLight ref={lamp} position={[0, 22.4, 0]} color="#ffd080" distance={80} intensity={5.4} />
      <LightChest />
    </group>
  );
}

function LightChest() {
  const open = useRef(Boolean(live.smashed["light-chest"]));
  const v = HZ.light;
  useFrame(() => {
    if (open.current || live.house !== "light") return;
    if (Math.hypot(live.x - v.x, live.z - v.z) < 1.15) {
      open.current = true;
      pay(22, "light-chest", "The lamp kept a purse for whoever finished the river.");
    }
  });
  if (open.current) return null;
  return (
    <mesh position={[0, 0.32, -0.55]} castShadow>
      <boxGeometry args={[0.5, 0.34, 0.38]} />
      {lamb(GOLD)}
    </mesh>
  );
}

function CanopyHut() {
  const v = HZ.canopy;
  const y = fieldHeight(v.x, v.z);
  useFrame(() => {
    const d = Math.hypot(live.x - v.x, live.z - v.z);
    if (d < 16 && live.y < y + 4 && !live.listen) {
      live.listen = "A hut in the owl tree. The ladder is on the south bark.";
    }
    if (live.house === "canopy" && markHorizon("canopy")) {
      takeCipher("owl-hut", true);
      live.listen = "The roof the woods gate could see. You climbed into it.";
      sfx.ok();
    }
  });
  return (
    <group position={[v.x, y + 9.15, v.z]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.4, 3.1]} />
        {lamb("#c4a06a")}
      </mesh>
      <mesh position={[0, 1.15, -1.55]} castShadow>
        <boxGeometry args={[3.5, 2.3, 0.18]} />
        {lamb(PLASTER)}
      </mesh>
      <mesh position={[-1.7, 1.15, 0]} castShadow>
        <boxGeometry args={[0.18, 2.3, 3.2]} />
        {lamb(PLASTER)}
      </mesh>
      <mesh position={[1.7, 1.15, 0]} castShadow>
        <boxGeometry args={[0.18, 2.3, 3.2]} />
        {lamb(PLASTER)}
      </mesh>
      <mesh position={[-1.05, 1.15, 1.58]} castShadow>
        <boxGeometry args={[1.4, 2.3, 0.18]} />
        {lamb(PLASTER)}
      </mesh>
      <mesh position={[1.05, 1.15, 1.58]} castShadow>
        <boxGeometry args={[1.4, 2.3, 0.18]} />
        {lamb(PLASTER)}
      </mesh>
      <mesh position={[0, 2.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.55, 1.55, 4]} />
        {lamb("#3d6a38")}
      </mesh>
      <mesh position={[0.9, 1.55, -1.5]}>
        <boxGeometry args={[0.5, 0.5, 0.08]} />
        <meshLambertMaterial color="#6a9ab8" transparent opacity={0.5} />
      </mesh>
      <CanopyChest />
    </group>
  );
}

function CanopyChest() {
  const open = useRef(Boolean(live.smashed["canopy-chest"]));
  useFrame(() => {
    if (open.current || live.house !== "canopy") return;
    if (Math.hypot(live.x - HZ.canopy.x, live.z - HZ.canopy.z) < 1.1) {
      open.current = true;
      pay(14, "canopy-chest", "The owl kept coins in the rafters.");
    }
  });
  if (open.current) return null;
  return (
    <mesh position={[0, 0.28, -0.7]} castShadow>
      <boxGeometry args={[0.48, 0.32, 0.36]} />
      {lamb("#8a6a28")}
    </mesh>
  );
}

function WestFall() {
  const v = HZ.fall;
  const y = fieldHeight(v.x, v.z);
  const spray = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (spray.current) {
      spray.current.children.forEach((c, i) => {
        const u = (t * 0.55 + i * 0.2) % 1;
        c.position.y = 3.4 - u * 4.6;
        const s = 0.22 + u * 0.7;
        c.scale.setScalar(s);
        const m = (c as THREE.Mesh).material as THREE.MeshLambertMaterial;
        m.opacity = 0.42 * (1 - u);
      });
    }
    const d = Math.hypot(live.x - v.x, live.z - v.z);
    if (d < 18 && !live.house && !live.listen) live.listen = "The west fall. The lookout could hear this. Now you are in it.";
    if (live.house === "fall" && markHorizon("fall")) {
      takeCipher("west-fall", true);
      live.listen = "Behind the hill the whole time.";
      sfx.ok();
    }
    const cave = HZ.cave;
    const cd = Math.hypot(live.x - cave.x, live.z - cave.z);
    if (cd < 1.8 && !glenOpen()) {
      live.listen = live.listen || "A dark mouth. Bombs, or a song, would wake it.";
      const boom = live.lastBoom && Math.hypot(live.lastBoom.x - cave.x, live.lastBoom.z - cave.z) < 3.2;
      const sung = useGame.getState().hasOcarina && live.songOk;
      if (boom || sung) {
        pay(10, "glen-cave", "The hill opened. The fall was never a painting.");
      }
    }
    if (glenOpen() && cd < 1.2 && Math.abs(live.z - cave.z) < 0.8) {
      live.x = v.x;
      live.z = v.z + 4.2;
      live.y = fieldHeight(v.x, v.z + 4.2);
      live.listen = "The cave dropped you behind the hill. The water is loud here.";
    }
  });
  return (
    <group>
      <mesh position={[v.x, y + 7.4, v.z - 6.4]} castShadow>
        <boxGeometry args={[8.2, 16.4, 2.6]} />
        {lamb(STONE)}
      </mesh>
      <mesh position={[v.x, y + 6.8, v.z - 5.2]} rotation={[0.12, 0, 0]}>
        <planeGeometry args={[3.2, 14.4]} />
        <meshLambertMaterial color="#8ec8d8" transparent opacity={0.55} depthWrite={false} fog={false} />
      </mesh>
      <group ref={spray} position={[v.x, y + 6.2, v.z - 4.8]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[(i - 2) * 0.28, 0, 0]}>
            <sphereGeometry args={[0.22, 6, 5]} />
            <meshLambertMaterial color="#d8eef4" transparent opacity={0.35} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <mesh position={[HZ.cave.x, fieldHeight(HZ.cave.x, HZ.cave.z) + 1.15, HZ.cave.z]} rotation={[0.2, 0.4, 0]} castShadow>
        <sphereGeometry args={[1.35, 8, 6]} />
        {lamb("#2a2418")}
      </mesh>
      <group position={[v.x, y, v.z]}>
        <mesh position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[3.8, 2.3, 3.4]} />
          {lamb("#d8cbb4")}
        </mesh>
        <mesh position={[0, 2.65, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[2.7, 1.4, 4]} />
          {lamb("#4a6a48")}
        </mesh>
        <FallChest />
      </group>
    </group>
  );
}

function FallChest() {
  const open = useRef(Boolean(live.smashed["fall-chest"]));
  useFrame(() => {
    if (open.current || live.house !== "fall") return;
    if (Math.hypot(live.x - HZ.fall.x, live.z - HZ.fall.z) < 1.15) {
      open.current = true;
      pay(18, "fall-chest", "Mist on the coins. The glen was waiting.");
    }
  });
  if (open.current) return null;
  return (
    <mesh position={[0, 0.28, -0.55]} castShadow>
      <boxGeometry args={[0.5, 0.34, 0.36]} />
      {lamb(GOLD)}
    </mesh>
  );
}

function MesaPalace() {
  const p = HZ.palace;
  const y = fieldHeight(p.x, p.z);
  useFrame(() => {
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 28 && !mesaOpen() && !live.listen) {
      live.listen = "A palace on a table of sand. The stair is sealed. Fire would open it.";
    }
    const wall = { x: p.x, z: p.z + 8.4 };
    const boom = live.lastBoom && Math.hypot(live.lastBoom.x - wall.x, live.lastBoom.z - wall.z) < 4.2;
    if (boom && !mesaOpen()) {
      pay(12, "mesa-stair", "The sand wall fell. The palace was never a mirage.");
    }
    if (d < 6 && mesaOpen() && markHorizon("palace")) {
      takeCipher("gold-palace", true);
      live.listen = "The southeast tooth. You can stand on it.";
    }
  });
  return (
    <group position={[p.x, y, p.z]}>
      <mesh position={[0, 2.2, 0]} castShadow>
        <boxGeometry args={[16.4, 4.4, 16.4]} />
        {lamb("#d4b06a")}
      </mesh>
      <mesh position={[0, 5.6, 0]} castShadow>
        <boxGeometry args={[11.2, 3.2, 11.2]} />
        {lamb("#e8c878")}
      </mesh>
      <mesh position={[0, 8.4, 0]} castShadow>
        <boxGeometry args={[6.4, 2.6, 6.4]} />
        {lamb("#f0d090")}
      </mesh>
      <mesh position={[0, 10.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[4.2, 2.8, 4]} />
        {lamb(GOLD)}
      </mesh>
      {!mesaOpen() ? (
        <mesh position={[0, 1.8, 8.6]} castShadow>
          <boxGeometry args={[10.4, 3.6, 1.4]} />
          {lamb("#c4a05a")}
        </mesh>
      ) : (
        <mesh position={[0, 0.4, 9.4]} rotation={[0.35, 0, 0]} receiveShadow>
          <boxGeometry args={[3.2, 0.28, 8.4]} />
          {lamb("#b89050")}
        </mesh>
      )}
      <PalaceChest />
    </group>
  );
}

function PalaceChest() {
  const open = useRef(Boolean(live.smashed["palace-chest"]));
  useFrame(() => {
    if (open.current || !mesaOpen()) return;
    if (Math.hypot(live.x - HZ.palace.x, live.z - HZ.palace.z) < 2.2) {
      open.current = true;
      if (useGame.getState().grantHeartContainer("gold-palace")) revealItem("container");
      sfx.get();
      live.listen = "The desert kept a heart under the gold tooth.";
    }
  });
  if (open.current) return null;
  return (
    <group position={[0, 4.55, 0]}>
      <HeartContainerMesh />
    </group>
  );
}

function IceSpire() {
  const p = HZ.crown;
  const y = fieldHeight(p.x, p.z);
  useFrame(() => {
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 22 && !live.listen) live.listen = "White Crown’s needle. The ice wanted a climber.";
    if (d < 3.2 && live.y > y + 6 && markHorizon("crown")) {
      takeCipher("ice-crown", true);
      pay(24, "crown-chest", "The north ice was a place. You stood on it.");
    }
  });
  return (
    <group position={[p.x, y, p.z]}>
      <mesh position={[0, 16, 0]} castShadow>
        <coneGeometry args={[4.2, 32, 7]} />
        <meshLambertMaterial color="#d8e4ee" fog={false} />
      </mesh>
      <mesh position={[0, 28, 0]} castShadow>
        <coneGeometry args={[1.65, 14, 6]} />
        <meshLambertMaterial color="#eef4f8" fog={false} />
      </mesh>
      <mesh position={[1.6, 4.2, 0.4]} rotation={[0, 0.4, 0.15]} castShadow>
        <coneGeometry args={[1.1, 5.2, 6]} />
        <meshLambertMaterial color="#c8d8e4" />
      </mesh>
    </group>
  );
}

function FenLantern() {
  const p = HZ.fen;
  const y = fieldHeight(p.x, p.z);
  const glow = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 16 && !live.listen) live.listen = "A house on stilts. The lamp you saw from the vale.";
    if (d < 2.2 && markHorizon("fen")) {
      takeCipher("fen-lamp", true);
      pay(16, "fen-chest", "The swamp lamp was a porch. You knocked.");
    }
    if (glow.current) glow.current.intensity = 2.4 + Math.sin(clock.elapsedTime * 1.6) * 0.4;
  });
  return (
    <group position={[p.x, y, p.z]}>
      {[-1.1, 1.1].map((s) =>
        [-1.0, 1.0].map((t) => (
          <mesh key={`${s}${t}`} position={[s, 0.7, t]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 1.4, 5]} />
            {lamb(WOOD)}
          </mesh>
        )),
      )}
      <mesh position={[0, 1.85, 0]} castShadow>
        <boxGeometry args={[2.8, 1.7, 2.5]} />
        {lamb("#d8c4a0")}
      </mesh>
      <mesh position={[0, 2.95, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.05, 1.2, 4]} />
        {lamb("#4a5a38")}
      </mesh>
      <mesh position={[0, 8.4, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 12.4, 6]} />
        {lamb(WOOD)}
      </mesh>
      <mesh position={[0, 14.8, 0]}>
        <sphereGeometry args={[0.38, 8, 6]} />
        <meshLambertMaterial color="#f4c878" emissive="#f0b040" emissiveIntensity={2.2} fog={false} />
      </mesh>
      <pointLight ref={glow} position={[0, 14.8, 0]} color="#ffc070" distance={36} intensity={3.2} />
    </group>
  );
}

function OldZig() {
  const p = HZ.zig;
  const y = fieldHeight(p.x, p.z);
  useFrame(() => {
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 20 && !live.listen) live.listen = "Old Numer’s stair. The south ridge could see the top.";
    if (d < 2.8 && live.y > y + 5 && markHorizon("zig")) {
      takeCipher("old-numer", true);
      pay(20, "zig-chest", "The broken country still had a roof.");
    }
  });
  return (
    <group position={[p.x, y, p.z]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[14.2, 2.4, 8.4]} />
        {lamb("#7a6a48")}
      </mesh>
      <mesh position={[0, 3.3, -0.4]} castShadow>
        <boxGeometry args={[10.2, 2.0, 6.2]} />
        {lamb("#8a7a58")}
      </mesh>
      <mesh position={[0, 5.1, -0.8]} castShadow>
        <boxGeometry args={[6.4, 1.7, 4.4]} />
        {lamb("#9a8a68")}
      </mesh>
      <mesh position={[0, 6.5, -1.0]} castShadow>
        <boxGeometry args={[3.4, 1.2, 2.8]} />
        {lamb("#6a5a40")}
      </mesh>
      <mesh position={[0, 1.1, 5.2]} rotation={[0.42, 0, 0]} receiveShadow>
        <boxGeometry args={[3.4, 0.28, 7.2]} />
        {lamb("#6a5a40")}
      </mesh>
    </group>
  );
}
