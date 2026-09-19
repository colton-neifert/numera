import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, TREE_HOME } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
}

const BRAM_HIDE = { x: TREE_TRUNK.x - 2.4, z: TREE_TRUNK.z + 1.6 };
const SELA_HIDE = { x: TREE_HOME.x + 5.6, z: TREE_HOME.z - 2.2 };

export function FamilyPlay() {
  return (
    <group>
      <HideSeek />
      <GranApple />
    </group>
  );
}

function KidMesh({ shirt, hair }: { shirt: string; hair: string }) {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <capsuleGeometry args={[0.12, 0.28, 3, 6]} />
        <meshLambertMaterial color={shirt} />
      </mesh>
      <mesh position={[0, 0.68, 0]}>
        <sphereGeometry args={[0.13, 7, 6]} />
        <meshLambertMaterial color="#c9a06a" />
      </mesh>
      <mesh position={[0, 0.76, 0]}>
        <sphereGeometry args={[0.14, 7, 5]} />
        <meshLambertMaterial color={hair} />
      </mesh>
    </group>
  );
}

function HideSeek() {
  const wasIn = useRef(false);
  const [out, setOut] = useState(false);
  const bram = useRef(false);
  const sela = useRef(false);
  const bg = useRef<THREE.Group>(null);
  const sg = useRef<THREE.Group>(null);
  useFrame(() => {
    if (live.house === "yours") wasIn.current = true;
    if (wasIn.current && !live.house && !out) setOut(true);
    if (!out || live.house) return;
    const db = Math.hypot(live.x - BRAM_HIDE.x, live.z - BRAM_HIDE.z);
    const ds = Math.hypot(live.x - SELA_HIDE.x, live.z - SELA_HIDE.z);
    if (!bram.current && db < 1.4) {
      bram.current = true;
      pay(8, "findbram");
      live.listen = "Bram!! Behind the tree. “I was bark.”";
    }
    if (!sela.current && ds < 1.4) {
      sela.current = true;
      pay(8, "findsela");
      live.listen = "Sela. Under the long arm. “I was a quiet rock.”";
    }
    if (bram.current && sela.current) {
      pay(12, "hideboth");
      live.listen = "You found them both. They want to hide again later.";
    }
    if (bg.current) bg.current.visible = !bram.current;
    if (sg.current) sg.current.visible = !sela.current;
    if (db < 3.4 && !bram.current) live.listen = live.listen || "Someone is giggling behind the tree.";
    if (ds < 3.4 && !sela.current) live.listen = live.listen || "A small shoe sticks out under the house.";
  });
  if (!out) return null;
  return (
    <group>
      <group ref={bg} position={[BRAM_HIDE.x, heightAt(BRAM_HIDE.x, BRAM_HIDE.z), BRAM_HIDE.z]}>
        <KidMesh shirt="#3a5a88" hair="#5c3a22" />
      </group>
      <group ref={sg} position={[SELA_HIDE.x, heightAt(SELA_HIDE.x, SELA_HIDE.z), SELA_HIDE.z]}>
        <KidMesh shirt="#8a3a58" hair="#4a3220" />
      </group>
    </group>
  );
}

function GranApple() {
  useFrame(() => {
    if (live.house !== "yours") return;
    const has = Boolean(live.smashed.homeapple || live.smashed.orchard || live.smashed.nestegg);
    if (has && live.nearNpc === "gran") {
      pay(10, "granapple");
      live.listen = "Gran took the apple. She cut it in four. One for you.";
    }
  });
  return null;
}
