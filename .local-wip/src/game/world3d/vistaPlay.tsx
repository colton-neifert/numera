import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, LOOK_AT } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { takeCipher } from "../cipher";
import { HeartContainerMesh } from "./actors";
import { lamb } from "./mats";
import { VISTA, type VistaId, markVista, vistaSeen, stepVista } from "./vista";

const WOOD_D = "#5a3a18";
const PLASTER = "#efe4cc";
const ROOF = "#8a3a28";
const STONE = "#8a8478";
const STONE_D = "#5a564c";

export function VistaPlay() {
  return (
    <group>
      <VistaDirector />
      <IsleHut />
      <PondHut />
      <RidgeRuin />
      <CliffMouth />
      <LookoutStone />
    </group>
  );
}

function VistaDirector() {
  const once = useRef(false);
  useFrame(() => {
    if (!once.current) {
      once.current = true;
      for (const id of ["isle", "pond", "ridge", "cliff"] as VistaId[]) {
        if (vistaSeen(id) && !live.smashed[`vista-${id}`]) live.smashed[`vista-${id}`] = true;
      }
    }
    if (live.house === "yours" || live.below || live.dungeon) return;
    stepVista();
  });
  return null;
}

function ChimneySmoke({ x, y, z }: { x: number; y: number; z: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    g.current.children.forEach((c, i) => {
      const u = (t * 0.22 + i * 0.28) % 1;
      c.position.y = u * 2.6;
      c.position.x = Math.sin(t * 0.7 + i) * 0.18 * u;
      const s = 0.18 + u * 0.55;
      c.scale.setScalar(s);
      const m = (c as THREE.Mesh).material as THREE.MeshLambertMaterial;
      m.opacity = 0.42 * (1 - u);
    });
  });
  return (
    <group ref={g} position={[x, y, z]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, i * 0.4, 0]}>
          <sphereGeometry args={[0.28, 6, 5]} />
          <meshLambertMaterial color="#d8d0c4" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Cottage({ id, plaster, roof }: { id: VistaId; plaster: string; roof: string }) {
  const v = VISTA[id];
  const y = heightAt(v.x, v.z);
  const W = v.hw * 2;
  const D = v.hd * 2;
  const H = 2.55;
  const doorW = v.door * 2;
  const side = (W - doorW) / 2;
  const T = 0.22;
  return (
    <group position={[v.x, y, v.z]} rotation={[0, v.yaw, 0]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W - 0.1, D - 0.1]} />
        {lamb("#c4a06a")}
      </mesh>
      <mesh position={[0, H * 0.5, -v.hd - T * 0.5]} castShadow>
        <boxGeometry args={[W + T, H, T]} />
        <meshLambertMaterial color={plaster} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-v.hw - T * 0.5, H * 0.5, 0]} castShadow>
        <boxGeometry args={[T, H, D + T]} />
        <meshLambertMaterial color={plaster} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[v.hw + T * 0.5, H * 0.5, 0]} castShadow>
        <boxGeometry args={[T, H, D + T]} />
        <meshLambertMaterial color={plaster} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-(doorW * 0.5 + side * 0.5), H * 0.5, v.hd + T * 0.5]} castShadow>
        <boxGeometry args={[side + 0.06, H, T]} />
        <meshLambertMaterial color={plaster} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[doorW * 0.5 + side * 0.5, H * 0.5, v.hd + T * 0.5]} castShadow>
        <boxGeometry args={[side + 0.06, H, T]} />
        <meshLambertMaterial color={plaster} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, H + 0.06, 0]} receiveShadow>
        <boxGeometry args={[W + T, 0.16, D + T]} />
        <meshLambertMaterial color="#3a2a18" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, H + 0.85, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[W * 0.78, 1.55, 4]} />
        {lamb(roof)}
      </mesh>
      <mesh position={[-v.hw * 0.55, H + 1.25, -v.hd * 0.15]} castShadow>
        <cylinderGeometry args={[0.14, 0.18, 0.7, 6]} />
        {lamb(WOOD_D)}
      </mesh>
      <mesh position={[-0.55, 1.55, -v.hd - 0.04]}>
        <boxGeometry args={[0.55, 0.55, 0.08]} />
        <meshLambertMaterial color="#6a9ab8" transparent opacity={0.55} />
      </mesh>
      {id !== "ridge" ? <ChimneySmoke x={-v.hw * 0.55} y={H + 1.4} z={-v.hd * 0.15} /> : null}
    </group>
  );
}

function IsleHut() {
  const v = VISTA.isle;
  const y = heightAt(v.x, v.z);
  return (
    <group>
      <Cottage id="isle" plaster={PLASTER} roof={ROOF} />
      <mesh position={[v.x + 2.6, y + 0.12, v.z + 0.4]} rotation={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.15, 0.22, 0.85]} />
        {lamb("#6a4a28")}
      </mesh>
      <IsleChest />
      <IsleListen />
    </group>
  );
}

function IsleListen() {
  useFrame(() => {
    if (live.below) return;
    const v = VISTA.isle;
    const d = Math.hypot(live.x - v.x, live.z - v.z);
    if (d < 14 && d > 4.2 && !live.house && !live.listen) {
      live.listen = "A chimney on the water. Someone lives on that island.";
    }
    if (live.house === "isle" && markVista("isle")) {
      takeCipher("isle-hut", true);
      live.listen = "A house you could see from the bank. You are standing in it.";
      sfx.ok();
    }
  });
  return null;
}

function IsleChest() {
  const v = VISTA.isle;
  const y = heightAt(v.x, v.z);
  const open = useRef(Boolean(live.smashed["vista-isle-chest"]));
  useFrame(() => {
    if (open.current || live.house !== "isle") return;
    if (Math.hypot(live.x - v.x, live.z - (v.z - 0.85)) < 1.15) {
      open.current = true;
      live.smashed["vista-isle-chest"] = true;
      const c = useGame.getState().addCoins(18);
      if (c > 0) revealItem("coin");
      sfx.get();
      live.listen = "The island kept a purse. The bank never mentioned it.";
    }
  });
  if (open.current) return null;
  return (
    <mesh position={[v.x, y + 0.28, v.z - 0.85]} castShadow>
      <boxGeometry args={[0.55, 0.38, 0.4]} />
      {lamb("#c9a227")}
    </mesh>
  );
}

function PondHut() {
  const v = VISTA.pond;
  const y = heightAt(v.x, v.z);
  return (
    <group>
      <Cottage id="pond" plaster="#e8dcc4" roof="#6a3a48" />
      {[-1.1, 1.1].map((s) =>
        [-1.0, 1.0].map((t) => (
          <mesh key={`${s}${t}`} position={[v.x + s, y - 0.55, v.z + t]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 1.35, 5]} />
            {lamb(WOOD_D)}
          </mesh>
        )),
      )}
      <mesh position={[v.x + 2.4, y + 0.05, v.z + 1.8]} receiveShadow>
        <boxGeometry args={[2.6, 0.12, 1.15]} />
        {lamb("#7a4a22")}
      </mesh>
      <PondChest />
      <PondListen />
    </group>
  );
}

function PondListen() {
  useFrame(() => {
    if (live.below) return;
    const v = VISTA.pond;
    const d = Math.hypot(live.x - v.x, live.z - v.z);
    if (d < 18 && d > 5 && !live.house && !live.listen) live.listen = "A shack in the pond. The stilts are real.";
    if (live.house === "pond" && markVista("pond")) {
      takeCipher("pond-isle", true);
      live.listen = "You swam for a roof you could already see.";
      sfx.ok();
    }
  });
  return null;
}

function PondChest() {
  const v = VISTA.pond;
  const y = heightAt(v.x, v.z);
  const open = useRef(Boolean(live.smashed["vista-pond-chest"]));
  useFrame(() => {
    if (open.current || live.house !== "pond") return;
    if (Math.hypot(live.x - v.x, live.z - (v.z - 0.7)) < 1.1) {
      open.current = true;
      live.smashed["vista-pond-chest"] = true;
      const c = useGame.getState().addCoins(12);
      if (c > 0) revealItem("coin");
      sfx.get();
    }
  });
  if (open.current) return null;
  return (
    <mesh position={[v.x, y + 0.26, v.z - 0.7]} castShadow>
      <boxGeometry args={[0.5, 0.34, 0.36]} />
      {lamb("#8a6a28")}
    </mesh>
  );
}

function RidgeRuin() {
  const v = VISTA.ridge;
  const y = heightAt(v.x, v.z);
  const got = useRef(vistaSeen("ridge"));
  useFrame(() => {
    const d = Math.hypot(live.x - v.x, live.z - v.z);
    if (d < 22 && d > 6 && !live.house && !live.listen) {
      live.listen = "The south hill has a broken mouth. You could see it from the ladder.";
    }
    if (live.house === "ridge" && markVista("ridge")) {
      takeCipher("south-ruin", true);
      live.listen = "The ruin was never a painting. It was a walk.";
      sfx.ok();
    }
  });
  const W = v.hw * 2;
  const D = v.hd * 2;
  const H = 2.9;
  const T = 0.28;
  const doorW = v.door * 2;
  const side = (W - doorW) / 2;
  return (
    <group position={[v.x, y, v.z]}>
      <mesh position={[0, H * 0.5, -v.hd - T * 0.5]} castShadow>
        <boxGeometry args={[W + T, H, T]} />
        <meshLambertMaterial color={STONE} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-v.hw - T * 0.5, H * 0.5, 0]} castShadow>
        <boxGeometry args={[T, H, D + T]} />
        <meshLambertMaterial color={STONE} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[v.hw + T * 0.5, H * 0.5, 0]} castShadow>
        <boxGeometry args={[T, H, D + T]} />
        <meshLambertMaterial color={STONE} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-(doorW * 0.5 + side * 0.5), H * 0.5, v.hd + T * 0.5]} castShadow>
        <boxGeometry args={[side + 0.08, H, T]} />
        <meshLambertMaterial color={STONE} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[doorW * 0.5 + side * 0.5, H * 0.5, v.hd + T * 0.5]} castShadow>
        <boxGeometry args={[side + 0.08, H, T]} />
        <meshLambertMaterial color={STONE} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, H + 0.08, 0]} receiveShadow>
        <boxGeometry args={[W + 0.4, 0.22, D + 0.4]} />
        {lamb(STONE_D)}
      </mesh>
      {[-1.4, 1.4].map((x) => (
        <mesh key={x} position={[x, H + 0.55, -0.4]} castShadow>
          <boxGeometry args={[0.42, 0.85, 0.42]} />
          {lamb(STONE_D)}
        </mesh>
      ))}
      <mesh position={[0.85, 8.4, -0.6]} castShadow>
        <cylinderGeometry args={[1.05, 1.35, 12.6, 8]} />
        {lamb(STONE)}
      </mesh>
      <mesh position={[0.85, 15.2, -0.6]} castShadow>
        <boxGeometry args={[1.15, 1.4, 1.15]} />
        {lamb(STONE_D)}
      </mesh>
      <mesh position={[0.85, 16.4, -0.6]} rotation={[0.1, 0.2, 0.08]} castShadow>
        <boxGeometry args={[0.55, 1.8, 0.55]} />
        {lamb(STONE)}
      </mesh>
      <RidgeHeart got={got} />
    </group>
  );
}

function RidgeHeart({ got }: { got: { current: boolean } }) {
  useFrame(() => {
    if (got.current || live.house !== "ridge") return;
    const v = VISTA.ridge;
    if (Math.hypot(live.x - v.x, live.z - (v.z - 0.6)) < 1.2) {
      got.current = true;
      if (useGame.getState().grantHeartContainer("south-ruin")) revealItem("container");
      sfx.get();
      live.listen = "The south hill was keeping a heart. The ladder could see the door the whole time.";
    }
  });
  if (got.current) return null;
  return (
    <group position={[0, 0.55, -0.55]}>
      <HeartContainerMesh />
    </group>
  );
}

function CliffMouth() {
  const v = VISTA.cliff;
  const y = heightAt(v.x, v.z);
  const got = useRef(Boolean(live.smashed["vista-cliff-chest"]));
  useFrame(() => {
    const d = Math.hypot(live.x - v.x, live.z - v.z);
    if (d < 28 && d > 8 && live.z < v.z && !live.house && !live.listen) {
      live.listen = "A hole in the north rock. The lookout can see it from here.";
    }
    if (live.house === "cliff" && markVista("cliff")) {
      takeCipher("cliff-mouth", true);
      live.listen = "The lookout’s hole was a room. You walked into the picture.";
      sfx.ok();
    }
    if (!got.current && live.house === "cliff" && Math.hypot(live.x - v.x, live.z - (v.z + 1.4)) < 1.2) {
      got.current = true;
      live.smashed["vista-cliff-chest"] = true;
      const c = useGame.getState().addCoins(22);
      if (c > 0) revealItem("coin");
      sfx.get();
    }
  });
  const W = v.hw * 2;
  const D = v.hd * 2;
  const H = 3.1;
  const T = 0.3;
  const doorW = v.door * 2;
  const side = (W - doorW) / 2;
  return (
    <group position={[v.x, y, v.z]} rotation={[0, v.yaw, 0]}>
      <mesh position={[0, H * 0.5, -v.hd - T * 0.5]} castShadow>
        <boxGeometry args={[W + T, H, T]} />
        <meshLambertMaterial color="#4a463c" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-v.hw - T * 0.5, H * 0.5, 0]} castShadow>
        <boxGeometry args={[T, H, D + T]} />
        <meshLambertMaterial color="#4a463c" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[v.hw + T * 0.5, H * 0.5, 0]} castShadow>
        <boxGeometry args={[T, H, D + T]} />
        <meshLambertMaterial color="#4a463c" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-(doorW * 0.5 + side * 0.5), H * 0.5, v.hd + T * 0.5]} castShadow>
        <boxGeometry args={[side + 0.1, H, T]} />
        <meshLambertMaterial color="#4a463c" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[doorW * 0.5 + side * 0.5, H * 0.5, v.hd + T * 0.5]} castShadow>
        <boxGeometry args={[side + 0.1, H, T]} />
        <meshLambertMaterial color="#4a463c" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, H + 0.1, 0]} receiveShadow>
        <boxGeometry args={[W + 0.5, 0.28, D + 0.5]} />
        {lamb(STONE_D)}
      </mesh>
      <mesh position={[0, 2.55, v.hd + 0.12]} castShadow>
        <boxGeometry args={[doorW + 0.7, 0.35, 0.35]} />
        {lamb(STONE_D)}
      </mesh>
      {!got.current ? (
        <mesh position={[0, 0.35, -1.4]} castShadow>
          <boxGeometry args={[0.52, 0.36, 0.38]} />
          {lamb("#c9a227")}
        </mesh>
      ) : null}
    </group>
  );
}

function LookoutStone() {
  const x = LOOK_AT.x + 3.6;
  const z = LOOK_AT.z - 2.4;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.below) return;
    if (Math.hypot(live.x - x, live.z - z) < 2.2 && live.stillT > 0.25) {
      live.listen =
        live.listen ||
        "East: a lamp on the river’s mouth. North: flags on a split hill. West: white water behind a ridge. They are walks, not paintings.";
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.55, 1.1, 0.22]} />
        {lamb("#8a8478")}
      </mesh>
    </group>
  );
}
