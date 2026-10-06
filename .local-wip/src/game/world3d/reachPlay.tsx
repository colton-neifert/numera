import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fieldHeight, heightAt, MILL_AT, LOOK_AT, TREE_HOME, TREE_HOUSE_H, TREE_HD, TREE_DECK_D } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { takeCipher } from "../cipher";
import { consumeTalk } from "../input";
import { HeartContainerMesh } from "./actors";
import { lamb } from "./mats";
import { LILY, HERM, STONES, startPeek, onHomeDeck, type ReachId } from "./reach";

const WOOD = "#6a4a28";
const WOOD_D = "#5a3a18";
const PLASTER = "#efe4cc";
const ROOF = "#8a3a28";
const STONE = "#8a8478";

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

export function markReach(id: ReachId) {
  const key = `vista-${id}`;
  if (live.smashed[key]) return false;
  live.smashed[key] = true;
  return true;
}

export function ReachPlay() {
  return (
    <group>
      <DeckWake />
      <DeckGlass />
      <LilyHut />
      <PondStones />
      <MillLoft />
      <HermitHut />
      <LookoutPeek />
    </group>
  );
}

function DeckWake() {
  const said = useRef(false);
  useFrame(() => {
    if (said.current || live.house || live.below) return;
    if (!onHomeDeck()) return;
    said.current = true;
    if (!live.smashed["deck-wake"]) {
      live.smashed["deck-wake"] = true;
      live.listen =
        "Your tree. Oakstead below. A chimney in the pond. Flags on a far hill. You can walk all of it.";
    }
  });
  return null;
}

function DeckGlass() {
  const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
  const gx = TREE_HOME.x + 2.55;
  const gz = TREE_HOME.z + TREE_HD + TREE_DECK_D * 0.62;
  useFrame(() => {
    if (live.peekT > 0.2) return;
    if (!onHomeDeck() && live.house !== "yours") return;
    const d = Math.hypot(live.x - gx, live.z - gz);
    if (d < 1.15) {
      live.hint = live.hint || "A spyglass. Talk to look far.";
      if (consumeTalk()) {
        startPeek();
        pay(8, "deckglass", undefined);
        sfx.ok();
      }
    }
  });
  return (
    <group position={[gx, plat + 1.05, gz]}>
      <mesh position={[0, -0.42, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.85, 6]} />
        <meshLambertMaterial color={WOOD_D} />
      </mesh>
      <mesh rotation={[0.55, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 0.62, 8]} />
        <meshLambertMaterial color="#3a3a48" />
      </mesh>
      <mesh position={[0.02, 0.18, 0.16]} rotation={[0.55, 0.2, 0]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshLambertMaterial color="#8ec8e8" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function Cottage({
  x,
  z,
  yaw,
  hw,
  hd,
  plaster,
  roof,
  chimney = true,
}: {
  x: number;
  z: number;
  yaw: number;
  hw: number;
  hd: number;
  plaster: string;
  roof: string;
  chimney?: boolean;
}) {
  const y = fieldHeight(x, z);
  const W = hw * 2;
  const D = hd * 2;
  const H = 2.45;
  const T = 0.2;
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W - 0.08, D - 0.08]} />
        {lamb("#c4a06a")}
      </mesh>
      <mesh position={[0, H * 0.5, -hd - T * 0.5]} castShadow>
        <boxGeometry args={[W + T, H, T]} />
        <meshLambertMaterial color={plaster} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-hw - T * 0.5, H * 0.5, 0]} castShadow>
        <boxGeometry args={[T, H, D + T]} />
        <meshLambertMaterial color={plaster} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[hw + T * 0.5, H * 0.5, 0]} castShadow>
        <boxGeometry args={[T, H, D + T]} />
        <meshLambertMaterial color={plaster} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-(0.62 + (W - 1.24) * 0.25), H * 0.5, hd + T * 0.5]} castShadow>
        <boxGeometry args={[(W - 1.24) * 0.5 + 0.08, H, T]} />
        <meshLambertMaterial color={plaster} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.62 + (W - 1.24) * 0.25, H * 0.5, hd + T * 0.5]} castShadow>
        <boxGeometry args={[(W - 1.24) * 0.5 + 0.08, H, T]} />
        <meshLambertMaterial color={plaster} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, H + 0.06, 0]} receiveShadow>
        <boxGeometry args={[W + T, 0.14, D + T]} />
        <meshLambertMaterial color="#3a2a18" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, H + 0.82, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[W * 0.78, 1.5, 4]} />
        {lamb(roof)}
      </mesh>
      {chimney ? (
        <>
          <mesh position={[-hw * 0.5, H + 1.35, -hd * 0.2]} castShadow>
            <cylinderGeometry args={[0.16, 0.2, 0.95, 6]} />
            {lamb(WOOD_D)}
          </mesh>
          <ChimneySmoke />
        </>
      ) : null}
    </group>
  );
}

function ChimneySmoke() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    g.current.children.forEach((c, i) => {
      const u = (t * 0.2 + i * 0.28) % 1;
      c.position.y = u * 3.4;
      c.position.x = Math.sin(t * 0.7 + i) * 0.2 * u;
      c.scale.setScalar(0.22 + u * 0.7);
      const m = (c as THREE.Mesh).material as THREE.MeshLambertMaterial;
      m.opacity = 0.4 * (1 - u);
    });
  });
  return (
    <group ref={g} position={[-0.85, 3.9, -0.3]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.3, 6, 5]} />
          <meshLambertMaterial color="#d8d0c4" transparent opacity={0.28} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function LilyHut() {
  const v = LILY;
  useFrame(() => {
    const d = Math.hypot(live.x - v.x, live.z - v.z);
    if (d < 16 && d > 4 && !live.house && !live.listen) {
      live.listen = "A chimney in the pond. The stones are real.";
    }
    if (live.house === "lily" && markReach("lily")) {
      takeCipher("lily-hut", true);
      live.listen = "A house you could see from the deck. You hopped to it.";
      sfx.ok();
    }
  });
  const y = fieldHeight(v.x, v.z);
  return (
    <group>
      {[-1.15, 1.15].map((s) =>
        [-1.0, 1.0].map((t) => (
          <mesh key={`${s}${t}`} position={[v.x + s * 0.7, y - 0.45, v.z + t * 0.65]} castShadow>
            <cylinderGeometry args={[0.09, 0.12, 1.55, 5]} />
            {lamb(WOOD_D)}
          </mesh>
        )),
      )}
      <Cottage x={v.x} z={v.z} yaw={v.yaw} hw={v.hw} hd={v.hd} plaster="#e8dcc4" roof="#6a3a48" />
      <LilyChest />
    </group>
  );
}

function LilyChest() {
  const open = useRef(Boolean(live.smashed["lily-chest"]));
  useFrame(() => {
    if (open.current || live.house !== "lily") return;
    if (Math.hypot(live.x - LILY.x, live.z - LILY.z) < 1.1) {
      open.current = true;
      live.smashed["lily-chest"] = true;
      if (useGame.getState().grantHeartContainer("lily-pond")) revealItem("container");
      sfx.get();
      live.listen = "The pond kept a heart under the floorboards.";
    }
  });
  if (open.current) return null;
  return (
    <group position={[LILY.x, fieldHeight(LILY.x, LILY.z) + 0.42, LILY.z - 0.35]}>
      <HeartContainerMesh scale={0.85} />
    </group>
  );
}

function PondStones() {
  useFrame(() => {
    if (live.house || live.below) return;
    for (const s of STONES) {
      if (Math.hypot(live.x - s.x, live.z - s.z) < 0.7) {
        live.listen = live.listen || "A stone in the pond. The next one is a hop.";
        pay(4, "pond-stone");
      }
    }
  });
  return (
    <group>
      {STONES.map((s, i) => {
        const y = fieldHeight(s.x, s.z);
        return (
          <mesh key={i} position={[s.x, y + 0.22, s.z]} castShadow receiveShadow>
            <cylinderGeometry args={[0.48 + (i % 2) * 0.06, 0.55, 0.38, 7]} />
            {lamb(i % 2 ? "#7a7468" : "#6a6458")}
          </mesh>
        );
      })}
    </group>
  );
}

function MillLoft() {
  const y = heightAt(MILL_AT.x, MILL_AT.z);
  const lx = MILL_AT.x - 0.15;
  const lz = MILL_AT.z + 3.15;
  useFrame(() => {
    if (live.house) return;
    const onRoof = Math.hypot(live.x - MILL_AT.x, live.z - MILL_AT.z) < 2.6 && live.y > y + 3.6;
    if (onRoof) {
      live.listen = live.listen || "The mill roof. Oakstead is a map from here. The flags are north.";
      if (!live.smashed["mill-loft"]) {
        live.smashed["mill-loft"] = true;
        takeCipher("mill-loft", true);
        const c = useGame.getState().addCoins(14);
        if (c > 0) revealItem("coin");
        sfx.ok();
        live.listen = "The mill roof. You saw this wheel from the tree.";
      }
    } else if (Math.hypot(live.x - lx, live.z - lz) < 1.6 && !live.climbing) {
      live.hint = live.hint || "A ladder up the mill.";
    }
  });
  return (
    <group>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[lx, y + 0.28 + i * 0.46, lz]}>
          <boxGeometry args={[0.55, 0.08, 0.1]} />
          <meshLambertMaterial color="#4a3018" />
        </mesh>
      ))}
      <mesh position={[lx - 0.22, y + 2.15, lz]}>
        <boxGeometry args={[0.08, 4.3, 0.08]} />
        <meshLambertMaterial color="#3a2414" />
      </mesh>
      <mesh position={[lx + 0.22, y + 2.15, lz]}>
        <boxGeometry args={[0.08, 4.3, 0.08]} />
        <meshLambertMaterial color="#3a2414" />
      </mesh>
      <MillChest />
    </group>
  );
}

function MillChest() {
  const open = useRef(Boolean(live.smashed["mill-roof-chest"]));
  const y = heightAt(MILL_AT.x, MILL_AT.z);
  useFrame(() => {
    if (open.current) return;
    const onRoof = Math.hypot(live.x - MILL_AT.x, live.z - MILL_AT.z) < 2.2 && live.y > y + 3.6;
    if (onRoof && Math.hypot(live.x - MILL_AT.x, live.z - (MILL_AT.z - 0.8)) < 1.2) {
      open.current = true;
      pay(18, "mill-roof-chest", "Miller never counted the roof.");
    }
  });
  if (open.current) return null;
  return (
    <mesh position={[MILL_AT.x, y + 4.45, MILL_AT.z - 0.8]} castShadow>
      <boxGeometry args={[0.5, 0.34, 0.38]} />
      {lamb("#c9a227")}
    </mesh>
  );
}

function HermitHut() {
  const v = HERM;
  useFrame(() => {
    const d = Math.hypot(live.x - v.x, live.z - v.z);
    if (d < 22 && d > 5 && !live.house && !live.listen) {
      live.listen = "A roof on Elderfour. The vale could see the chimney the whole time.";
    }
    if (live.house === "herm" && markReach("herm")) {
      takeCipher("herm-ledge", true);
      live.listen = "The west hill was a walk. Someone lives where the goats do.";
      sfx.ok();
    }
  });
  return (
    <group>
      <Cottage x={v.x} z={v.z} yaw={v.yaw} hw={v.hw} hd={v.hd} plaster="#e4d4b8" roof="#5a3a28" />
      <HermitChest />
    </group>
  );
}

function HermitChest() {
  const open = useRef(Boolean(live.smashed["herm-chest"]));
  useFrame(() => {
    if (open.current || live.house !== "herm") return;
    if (Math.hypot(live.x - HERM.x, live.z - HERM.z) < 1.15) {
      open.current = true;
      pay(20, "herm-chest", "The hermit counted in silence. Then they left a purse.");
    }
  });
  if (open.current) return null;
  return (
    <mesh position={[HERM.x, fieldHeight(HERM.x, HERM.z) + 0.32, HERM.z - 0.4]} castShadow>
      <boxGeometry args={[0.48, 0.32, 0.36]} />
      {lamb("#8a6a28")}
    </mesh>
  );
}

function LookoutPeek() {
  useFrame(() => {
    if (live.house || live.peekT > 0.15) return;
    const y = heightAt(LOOK_AT.x, LOOK_AT.z);
    const on = Math.hypot(live.x - LOOK_AT.x, live.z - LOOK_AT.z) < 1.5 && live.y > y + 7.2;
    if (!on) return;
    live.hint = live.hint || "Talk to look north. The flags are real.";
    if (consumeTalk()) {
      startPeek("watch");
      pay(6, "lookspy");
    }
  });
  const y = heightAt(LOOK_AT.x, LOOK_AT.z);
  return (
    <group position={[LOOK_AT.x + 0.55, y + 10.15, LOOK_AT.z + 0.35]}>
      <mesh rotation={[0.35, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.55, 8]} />
        <meshLambertMaterial color="#3a3a48" />
      </mesh>
      <mesh position={[0.02, 0.16, 0.14]}>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshLambertMaterial color="#8ec8e8" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
