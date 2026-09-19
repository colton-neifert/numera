import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, CRATE_AT } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { addTrapSpot } from "./dungeonTraps";

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
}

export function ExtraPlay() {
  return (
    <group>
      <CrateSwitch />
      <StuckKite />
    </group>
  );
}

function CrateSwitch() {
  const start = { x: CRATE_AT.x, z: CRATE_AT.z };
  const plate = { x: CRATE_AT.x + 3.6, z: CRATE_AT.z - 0.4 };
  const p = useRef({ x: start.x, z: start.z });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const o = p.current;
    const d = Math.hypot(live.x - o.x, live.z - o.z);
    if (d < 1.1 && Math.abs(live.speed) > 2) {
      o.x += -Math.sin(live.yaw) * 4.4 * dt;
      o.z += -Math.cos(live.yaw) * 4.4 * dt;
    }
    addTrapSpot(o.x, o.z, 0.45, 0.4);
    const on = Math.hypot(o.x - plate.x, o.z - plate.z) < 0.9;
    if (on) {
      pay(12, "crateswitch");
      live.listen = "The crate sat. A click. A door in the grass.";
    }
    if (g.current) g.current.position.set(o.x, heightAt(o.x, o.z) + 0.35, o.z);
    if (d < 1.8 && !on) live.listen = live.listen || "A crate. Push it onto the stone.";
  }, -2);
  const py = heightAt(plate.x, plate.z);
  return (
    <group>
      <mesh position={[plate.x, py + 0.03, plate.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 8]} />
        <meshLambertMaterial color="#6a6058" />
      </mesh>
      <group ref={g}>
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshLambertMaterial color="#8a5a28" />
        </mesh>
      </group>
    </group>
  );
}

function StuckKite() {
  const x = TREE_TRUNK.x - 3.4;
  const z = TREE_TRUNK.z + 2.2;
  const y = heightAt(TREE_TRUNK.x, TREE_TRUNK.z) + 5.6;
  const down = useRef(false);
  const g = useRef<THREE.Group>(null);
  const py = useRef(y);
  useFrame((_, dt) => {
    if (live.house) return;
    const boom = live.lastBoom && Math.hypot(live.lastBoom.x - x, live.lastBoom.z - z) < 3.2;
    const climb = live.climbing && Math.hypot(live.x - TREE_TRUNK.x, live.z - TREE_TRUNK.z) < 1.8 && live.y > y - 1.2;
    const slash = live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 2.4;
    if ((boom || climb || slash) && !down.current) {
      down.current = true;
      live.listen = "The kite came loose.";
    }
    if (down.current) py.current = Math.max(heightAt(x, z) + 0.15, py.current - dt * 6);
    if (down.current && Math.hypot(live.x - x, live.z - z) < 1.1 && py.current < heightAt(x, z) + 0.5) {
      pay(10, "stuckkite");
      live.listen = "A kite. It still wanted the wind.";
    }
    if (g.current) {
      g.current.position.set(x, py.current, z);
      g.current.visible = !live.smashed.stuckkite;
    }
    if (!down.current && Math.hypot(live.x - TREE_TRUNK.x, live.z - TREE_TRUNK.z) < 2.6)
      live.listen = live.listen || "A kite in the oak. Climb. Or a bang.";
  });
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh rotation={[0.3, 0.4, 0.2]}>
        <planeGeometry args={[0.5, 0.7]} />
        <meshLambertMaterial color="#c42828" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
