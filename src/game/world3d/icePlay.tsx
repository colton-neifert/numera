import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, ICE_AT, TREE_TRUNK } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { addTrapSpot } from "./dungeonTraps";
import type { Ladder } from "./climb";

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
}

let caveOn = false;

export function iceLadders(): Ladder[] {
  if (!caveOn) return [];
  return [{ id: "bouldercave", x: TREE_TRUNK.x + 26.4, z: TREE_TRUNK.z - 11.4, yaw: 0, h: 3.4, half: 0.7 }];
}

export function IcePlay() {
  return (
    <group>
      <IceBlock />
      <BoulderCave />
    </group>
  );
}

function IceBlock() {
  const start = { x: ICE_AT.x - 3.2, z: ICE_AT.z + 1.4 };
  const plate = { x: ICE_AT.x + 3.4, z: ICE_AT.z - 1.2 };
  const p = useRef({ x: start.x, z: start.z });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const o = p.current;
    const d = Math.hypot(live.x - o.x, live.z - o.z);
    if (d < 1.15 && Math.abs(live.speed) > 2) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      o.x += fx * 5.4 * dt;
      o.z += fz * 5.4 * dt;
    }
    const boom = live.lastBoom && Math.hypot(live.lastBoom.x - o.x, live.lastBoom.z - o.z) < 2.6;
    const on = Math.hypot(o.x - plate.x, o.z - plate.z) < 1.1;
    if ((boom || (live.cookT > 0 && d < 2.2)) && !live.smashed.iceblock) {
      pay(14, "iceblock");
      live.listen = "The ice went. Water under it. A rupee that was stuck.";
      if (g.current) g.current.visible = false;
    }
    if (on && !live.smashed.iceblock) {
      pay(16, "iceblock");
      live.listen = "The ice sat on the plate. Something clicked under the pond.";
    }
    if (!live.smashed.iceblock) addTrapSpot(o.x, o.z, 0.55, 0.45);
    if (g.current && !live.smashed.iceblock) g.current.position.set(o.x, heightAt(o.x, o.z) + 0.35, o.z);
    if (d < 2 && !on && !live.smashed.iceblock) live.listen = live.listen || "A block of ice. Push it onto the stone. Or a bang. Or a fire.";
    if (Math.hypot(live.x - plate.x, live.z - plate.z) < 1.6 && !on && !live.smashed.iceblock)
      live.listen = live.listen || "A stone in the ice. It wants weight.";
  }, -2);
  const py = heightAt(plate.x, plate.z);
  return (
    <group>
      <mesh position={[plate.x, py + 0.04, plate.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 8]} />
        <meshLambertMaterial color="#8a8070" />
      </mesh>
      <group ref={g}>
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshLambertMaterial color="#c8e4f0" transparent opacity={0.85} />
        </mesh>
      </group>
    </group>
  );
}

function BoulderCave() {
  const rock = { x: TREE_TRUNK.x + 26.4, z: TREE_TRUNK.z - 8.2 };
  const cave = { x: TREE_TRUNK.x + 26.4, z: TREE_TRUNK.z - 11.4 };
  const gone = useRef(false);
  const rg = useRef<THREE.Group>(null);
  const inC = useRef(false);
  useFrame(() => {
    if (live.house) return;
    const boom = live.lastBoom && Math.hypot(live.lastBoom.x - rock.x, live.lastBoom.z - rock.z) < 2.8;
    if (boom && !gone.current) {
      gone.current = true;
      if (rg.current) rg.current.visible = false;
      pay(10, "bouldercave");
      live.listen = "The rock rolled. A hole. Dark.";
      sfx.thud();
    }
    if (gone.current && Math.hypot(live.x - rock.x, live.z - rock.z) < 1.1 && !inC.current) {
      inC.current = true;
      caveOn = true;
      live.cave = true;
      live.x = cave.x;
      live.z = cave.z;
      live.listen = "A little cave. Someone hid a rupee and a sock.";
      pay(14, "cavestock");
    }
    if (inC.current && live.climbH > 1.8) {
      inC.current = false;
      caveOn = false;
      live.cave = false;
      live.x = rock.x;
      live.z = rock.z + 1.4;
    }
    if (!gone.current && Math.hypot(live.x - rock.x, live.z - rock.z) < 2.2)
      live.listen = live.listen || "A rock against the hill. A bang would move it.";
  });
  const ry = heightAt(rock.x, rock.z);
  const cy = heightAt(cave.x, cave.z);
  return (
    <group>
      <group ref={rg} position={[rock.x, ry + 0.7, rock.z]}>
        <mesh castShadow>
          <dodecahedronGeometry args={[0.85, 0]} />
          <meshLambertMaterial color="#6a5a4c" />
        </mesh>
      </group>
      <mesh position={[cave.x, cy + 0.9, cave.z]}>
        <boxGeometry args={[2.4, 1.8, 0.3]} />
        <meshLambertMaterial color="#1a120c" />
      </mesh>
    </group>
  );
}
