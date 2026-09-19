import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, POND, pondU, pondSurfaceY } from "./field";
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

export function SavePlay() {
  return (
    <group>
      <PondKid />
      <GranKey />
      <OakChest />
    </group>
  );
}

function PondKid() {
  const p = useRef({
    x: POND.x + 2.4,
    z: POND.z + 1.2,
    saved: false,
    shore: false,
  });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const o = p.current;
    if (o.shore) {
      if (g.current) g.current.position.set(o.x, heightAt(o.x, o.z), o.z);
      return;
    }
    const d = Math.hypot(live.x - o.x, live.z - o.z);
    if (!o.saved && pondU(live.x, live.z) > 0.25 && d < 1.35) {
      o.saved = true;
      live.listen = "You got them. Swim to the grass.";
    }
    if (o.saved) {
      o.x += (live.x - o.x) * dt * 2.2;
      o.z += (live.z - o.z) * dt * 2.2;
      if (pondU(live.x, live.z) < 0.12 && live.grounded) {
        o.shore = true;
        o.x = live.x + 0.6;
        o.z = live.z + 0.4;
        pay(16, "pondkid");
        live.listen = "They coughed. Then they ran home. They did not say thank you. They will.";
      }
    } else {
      o.x += Math.sin(live.playT * 1.6) * dt * 0.4;
      o.z += Math.cos(live.playT * 1.1) * dt * 0.3;
    }
    const wy = pondSurfaceY();
    if (g.current) {
      g.current.visible = !o.shore;
      g.current.position.set(o.x, o.saved || pondU(o.x, o.z) > 0.2 ? wy + 0.1 : heightAt(o.x, o.z), o.z);
    }
    if (d < 6 && !o.saved && pondU(o.x, o.z) > 0.2)
      live.listen = live.listen || "Someone is in the pond. They are not swimming on purpose.";
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0.2, 0]}>
        <capsuleGeometry args={[0.11, 0.22, 3, 6]} />
        <meshLambertMaterial color="#3a5a88" />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshLambertMaterial color="#c9a06a" />
      </mesh>
    </group>
  );
}

function GranKey() {
  useFrame(() => {
    if (live.house !== "yours") return;
    if (live.nearNpc === "gran" && !live.smashed.grankey) {
      live.smashed.grankey = true;
      live.listen = "Gran pointed at the sugar jar. “If you need the little key.”";
    }
    if (live.smashed.grankey && !live.smashed.tookkey && live.x > 0.6 && Math.abs(live.z) < 0.8) {
      pay(6, "tookkey");
      live.listen = "A little key in the sugar. She knew.";
    }
  });
  return null;
}

function OakChest() {
  const x = TREE_TRUNK.x + 6.8;
  const z = TREE_TRUNK.z - 5.2;
  const y = heightAt(x, z);
  const open = useRef(false);
  const lid = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.3 && live.smashed.tookkey && !open.current) {
      open.current = true;
      pay(18, "oakchest");
      live.listen = "The little key fit. Gran’s rainy-day rupees.";
      sfx.ok();
    }
    if (lid.current) lid.current.rotation.x += ((open.current ? -1.1 : 0) - lid.current.rotation.x) * (1 - Math.exp(-dt * 6));
    if (d < 1.8 && !open.current)
      live.listen = live.listen || (live.smashed.tookkey ? "A chest. You have a key." : "A chest. It wants a little key.");
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.55, 0.32, 0.4]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh ref={lid} position={[0, 0.38, -0.18]}>
        <boxGeometry args={[0.55, 0.08, 0.4]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
    </group>
  );
}

