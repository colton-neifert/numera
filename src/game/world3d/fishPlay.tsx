import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, DOCK, pondU, pondSurfaceY } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { consumeTalk as consumeTalkRaw } from "../input";

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
}

export function FishPlay() {
  return (
    <group>
      <DockFish />
      <GoldSkull />
    </group>
  );
}

function DockFish() {
  const wait = useRef(0);
  const bite = useRef(false);
  const bob = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const onDock = Math.abs(live.x - DOCK.x) < 2.2 && Math.abs(live.z - DOCK.z) < 1.8 && live.grounded;
    const byWater = pondU(live.x, live.z) > 0.05 && pondU(live.x, live.z) < 0.35;
    const fishing = (onDock || byWater) && live.stillT > 0.8 && (live.holding === "pole" || live.carry === "stick");
    if (fishing && !bite.current) {
      wait.current += dt;
      live.listen = live.listen || "The water is quiet. Wait.";
      if (wait.current > 2.6) {
        bite.current = true;
        sfx.ok();
        live.listen = "A bite. Pull!";
      }
    } else if (!fishing) {
      wait.current = 0;
      bite.current = false;
    }
    if (bite.current && (consumeTalkRaw() || live.slash)) {
      bite.current = false;
      wait.current = 0;
      pay(12, "dockfish");
      live.listen = "A fish. It flopped. Then it was a rupee. Then it was a fish again.";
    }
    if (bob.current) {
      bob.current.visible = fishing || bite.current;
      const wy = pondSurfaceY();
      bob.current.position.set(DOCK.x + 1.4, wy + (bite.current ? 0.12 : 0.02 + Math.sin(live.playT * 3) * 0.03), DOCK.z + 0.8);
    }
  });
  return (
    <mesh ref={bob} visible={false}>
      <sphereGeometry args={[0.06, 6, 5]} />
      <meshLambertMaterial color="#c42828" />
    </mesh>
  );
}

function GoldSkull() {
  const x = TREE_TRUNK.x - 0.8;
  const z = TREE_TRUNK.z - 1.6;
  const y = heightAt(TREE_TRUNK.x, TREE_TRUNK.z) + 3.4;
  const down = useRef(false);
  const g = useRef<THREE.Group>(null);
  const py = useRef(y);
  useFrame((_, dt) => {
    if (live.house) return;
    const boom = live.lastBoom && Math.hypot(live.lastBoom.x - x, live.lastBoom.z - z) < 3.4;
    const roll = live.rolling && Math.hypot(live.x - TREE_TRUNK.x, live.z - TREE_TRUNK.z) < 1.6;
    if ((boom || roll) && !down.current) {
      down.current = true;
      live.listen = "Something fell out of the oak.";
    }
    if (down.current) py.current = Math.max(heightAt(x, z) + 0.2, py.current - dt * 8);
    if (down.current && Math.hypot(live.x - x, live.z - z) < 1.1 && py.current < heightAt(x, z) + 0.5) {
      pay(20, "goldskull");
      live.listen = "A gold skull. Who put that in a tree.";
    }
    if (g.current) {
      g.current.position.set(x, py.current, z);
      g.current.visible = !live.smashed.goldskull;
    }
    if (!down.current && Math.hypot(live.x - TREE_TRUNK.x, live.z - TREE_TRUNK.z) < 2.4)
      live.listen = live.listen || "Something gold in the branches. A bang. Or a roll into the trunk.";
  });
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh>
        <sphereGeometry args={[0.16, 7, 6]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[-0.05, 0.04, 0.12]}>
        <sphereGeometry args={[0.03, 5, 4]} />
        <meshLambertMaterial color="#1a120c" />
      </mesh>
      <mesh position={[0.05, 0.04, 0.12]}>
        <sphereGeometry args={[0.03, 5, 4]} />
        <meshLambertMaterial color="#1a120c" />
      </mesh>
    </group>
  );
}

