import { useFrame } from "@react-three/fiber";
import { heightAt, TREE_TRUNK } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { setMusicDuck } from "../music";

const STONE = { x: TREE_TRUNK.x - 7.4, z: TREE_TRUNK.z - 11.2 };

/** A quiet stone south of the tree. Sit, and the music gets out of the way. */
export function HeartPlay() {
  const y = heightAt(STONE.x, STONE.z);
  const bench = { x: STONE.x, z: STONE.z + 1.35 };
  useFrame(() => {
    if (live.house || live.mounted) return;
    const d = Math.hypot(live.x - bench.x, live.z - bench.z);
    if (d < 1.35) {
      live.nearChair = true;
      live.sitAt = { x: bench.x, z: bench.z, yaw: Math.PI };
      if (!live.sit) live.hint = "Sit · F";
    }
    if (live.sit && d < 1.6 && !live.smashed.memorialSit) {
      live.smashed.memorialSit = true;
      live.smashed.memorial = true;
      live.heartSay = "Oat liked the mill. Reed liked names. The vale still says them.";
      setMusicDuck(true);
      sfx.secret();
      window.setTimeout(() => setMusicDuck(false), 8000);
    }
  });
  return (
    <group position={[STONE.x, y, STONE.z]}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.72, 1.2, 0.16]} />
        <meshLambertMaterial color="#6a6660" />
      </mesh>
      <mesh position={[0, 0.95, 0.09]}>
        <boxGeometry args={[0.4, 0.06, 0.02]} />
        <meshLambertMaterial color="#3a3834" />
      </mesh>
      <mesh position={[0, 0.78, 0.09]}>
        <boxGeometry args={[0.28, 0.05, 0.02]} />
        <meshLambertMaterial color="#3a3834" />
      </mesh>
      <mesh position={[0.22, 0.06, 0.2]} rotation={[-0.5, 0.2, 0.4]}>
        <sphereGeometry args={[0.07, 6, 5]} />
        <meshLambertMaterial color="#8a3a58" />
      </mesh>
      <mesh position={[bench.x - STONE.x, 0.42, bench.z - STONE.z]} castShadow>
        <boxGeometry args={[1.15, 0.1, 0.38]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      {[-0.42, 0.42].map((sx) => (
        <mesh key={sx} position={[sx, 0.2, bench.z - STONE.z]} castShadow>
          <boxGeometry args={[0.08, 0.4, 0.32]} />
          <meshLambertMaterial color="#3a2818" />
        </mesh>
      ))}
    </group>
  );
}
