import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_HOME, TREE_TRUNK } from "./field";
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

const HATCH = { x: TREE_HOME.x + 3.2, z: TREE_HOME.z + 2.8 };
const SPOTS = [
  { x: TREE_TRUNK.x + 1.2, z: TREE_TRUNK.z + 2.4 },
  { x: TREE_TRUNK.x + 2.2, z: TREE_TRUNK.z + 2.6 },
  { x: TREE_HOME.x + 0.4, z: TREE_HOME.z + 2.5 },
  { x: HATCH.x - 0.8, z: HATCH.z + 0.2 },
  { x: HATCH.x, z: HATCH.z },
];

export function TrailPlay() {
  const got = useRef([false, false, false, false, false]);
  const n = useRef(0);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    if (live.house) return;
    SPOTS.forEach((s, i) => {
      const m = meshes.current[i];
      if (m) m.visible = !got.current[i];
      if (got.current[i]) return;
      if (Math.hypot(live.x - s.x, live.z - s.z) < 0.7) {
        got.current[i] = true;
        n.current += 1;
        useGame.getState().addCoins(1);
        sfx.ok();
        if (n.current >= 5) {
          pay(8, "rupeetrail");
          live.listen = "The last one sat on a hatch.";
        } else live.listen = "A rupee in the grass. Another glints.";
      }
    });
  });
  return (
    <group>
      {SPOTS.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          position={[s.x, heightAt(s.x, s.z) + 0.18, s.z]}
        >
          <octahedronGeometry args={[0.1, 0]} />
          <meshLambertMaterial color="#3ec878" />
        </mesh>
      ))}
    </group>
  );
}
