import * as THREE from "three";
import {
  heightAt,
  TREE_HOME,
  TREE_TRUNK,
  TREE_LADDER,
  TREE_LADDER_YAW,
  TREE_HOUSE_H,
  TREE_HW,
  TREE_HD,
  TREE_CEIL,
  TREE_DOOR,
  TREE_DECK_D,
} from "./field";
import { live } from "./live";
import { ZipLine } from "./zipPlay";

const WOOD = "#8a5a28";
const WOOD_DARK = "#5a3d24";
const PLANK = "#c4a06a";
const WALL = "#efe4cc";
const WALL_IN = "#e6d4b4";
const ROOF = "#8a3a28";

/** Hollow oak treehouse: real inside, open doorway, fenced deck, ladder. */
export function TreeHouse() {
  const y = heightAt(TREE_TRUNK.x, TREE_TRUNK.z);
  const hy = heightAt(TREE_HOME.x, TREE_HOME.z);
  const plat = hy + TREE_HOUSE_H;
  const dx = TREE_HOME.x - TREE_TRUNK.x;
  const dz = TREE_HOME.z - TREE_TRUNK.z;
  const yaw = Math.atan2(dx, dz);
  const len = Math.hypot(dx, dz);
  const W = TREE_HW * 2;
  const D = TREE_HD * 2;
  const T = 0.28;
  const doorW = TREE_DOOR * 2;
  const sideW = (W - doorW) / 2;
  return (
    <group>
      <mesh position={[TREE_TRUNK.x, y + 4.4, TREE_TRUNK.z]} castShadow>
        <cylinderGeometry args={[1.15, 1.55, 9.0, 8]} />
        <meshLambertMaterial color="#5a3d24" />
      </mesh>
      <mesh position={[TREE_TRUNK.x + 0.45, y + 9.1, TREE_TRUNK.z - 0.25]} rotation={[0.12, 0.35, 0.28]} castShadow>
        <cylinderGeometry args={[0.32, 0.48, 3.8, 6]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
      {[
        [0, 11.6, 0, 3.7],
        [1.9, 10.8, 1.3, 2.6],
        [-2.1, 11.0, -0.7, 2.4],
        [0.5, 12.6, -1.6, 2.15],
        [-1.0, 12.2, 1.8, 2.0],
        [2.2, 11.4, -1.2, 1.9],
      ].map((p, i) => (
        <mesh key={i} position={[TREE_TRUNK.x + p[0], y + p[1], TREE_TRUNK.z + p[2]]} castShadow>
          <sphereGeometry args={[p[3], 10, 8]} />
          <meshLambertMaterial color={i % 2 ? "#2a6a32" : "#245a28"} />
        </mesh>
      ))}
      <group position={[TREE_TRUNK.x + dx * 0.48, y + 5.7, TREE_TRUNK.z + dz * 0.48]} rotation={[0.14, yaw, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.48, 0.68, len * 0.94, 8]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      </group>

      <group position={[TREE_HOME.x, plat, TREE_HOME.z]}>
        <mesh position={[0, -0.12, 0]} receiveShadow>
          <boxGeometry args={[W + 0.2, 0.26, D + 0.2]} />
          <meshLambertMaterial color={WOOD} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[W - 0.16, D - 0.16]} />
          <meshLambertMaterial color={PLANK} />
        </mesh>
        {[-2.4, 0, 2.4].map((x) => (
          <mesh key={x} position={[x, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.06, D - 0.4]} />
            <meshLambertMaterial color="#a88858" />
          </mesh>
        ))}

        <mesh position={[0, TREE_CEIL * 0.5, -TREE_HD - T * 0.5]} castShadow>
          <boxGeometry args={[W + T, TREE_CEIL, T]} />
          <meshLambertMaterial color={WALL} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-TREE_HW - T * 0.5, TREE_CEIL * 0.5, 0]} castShadow>
          <boxGeometry args={[T, TREE_CEIL, D + T]} />
          <meshLambertMaterial color={WALL_IN} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[TREE_HW + T * 0.5, TREE_CEIL * 0.5, 0]} castShadow>
          <boxGeometry args={[T, TREE_CEIL, D + T]} />
          <meshLambertMaterial color={WALL_IN} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-(doorW * 0.5 + sideW * 0.5), TREE_CEIL * 0.5, TREE_HD + T * 0.5]} castShadow>
          <boxGeometry args={[sideW + 0.04, TREE_CEIL, T]} />
          <meshLambertMaterial color={WALL} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[doorW * 0.5 + sideW * 0.5, TREE_CEIL * 0.5, TREE_HD + T * 0.5]} castShadow>
          <boxGeometry args={[sideW + 0.04, TREE_CEIL, T]} />
          <meshLambertMaterial color={WALL} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, TREE_CEIL - 0.28, TREE_HD + T * 0.5]} castShadow>
          <boxGeometry args={[doorW + 0.16, 0.56, T + 0.04]} />
          <meshLambertMaterial color={WOOD} />
        </mesh>
        <mesh position={[0, TREE_CEIL + 0.08, 0]} receiveShadow>
          <boxGeometry args={[W + T, 0.18, D + T]} />
          <meshLambertMaterial color="#3a2a18" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, TREE_CEIL + 1.15, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[W * 0.72, 2.35, 4]} />
          <meshLambertMaterial color={ROOF} />
        </mesh>
        <mesh position={[TREE_HW * 0.55, TREE_CEIL + 1.85, -TREE_HD * 0.22]} castShadow>
          <cylinderGeometry args={[0.16, 0.2, 0.85, 6]} />
          <meshLambertMaterial color="#6a4a38" />
        </mesh>
        <mesh position={[0, TREE_CEIL + 2.55, 0.15]} castShadow>
          <sphereGeometry args={[0.2, 8, 6]} />
          <meshLambertMaterial color="#f4c878" emissive="#f0b040" emissiveIntensity={live.night ? 2.2 : 0.15} />
        </mesh>
        {live.night ? <pointLight position={[0, TREE_CEIL + 2.4, 0.15]} intensity={5.2} distance={48} color="#f4c070" /> : null}

        <mesh position={[-TREE_DOOR - 0.06, 1.15, TREE_HD + 0.08]} castShadow>
          <boxGeometry args={[0.16, 2.3, 0.22]} />
          <meshLambertMaterial color={WOOD_DARK} />
        </mesh>
        <mesh position={[TREE_DOOR + 0.06, 1.15, TREE_HD + 0.08]} castShadow>
          <boxGeometry args={[0.16, 2.3, 0.22]} />
          <meshLambertMaterial color={WOOD_DARK} />
        </mesh>
        <mesh position={[0, 2.38, TREE_HD + 0.1]} castShadow>
          <boxGeometry args={[doorW + 0.28, 0.16, 0.24]} />
          <meshLambertMaterial color={WOOD} />
        </mesh>

        <TreeBeds />
        <TreeTable />
        <TreeRug />
        <ShelfBits />
        <mesh position={[0, TREE_CEIL - 0.55, 0]} castShadow>
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshLambertMaterial color="#f4c878" emissive="#f0b040" emissiveIntensity={1.5} />
        </mesh>
        <pointLight position={[0, TREE_CEIL - 0.55, 0]} intensity={7.2} distance={16} color="#ffe2b0" />
        <ambientLight intensity={0.62} />
      </group>

      <mesh position={[TREE_HOME.x, plat - 0.1, TREE_HOME.z + TREE_HD + TREE_DECK_D * 0.5]} receiveShadow>
        <boxGeometry args={[W + 0.9, 0.22, TREE_DECK_D + 0.15]} />
        <meshLambertMaterial color="#7a4a22" />
      </mesh>
      <DeckRail plat={plat} />
      <LadderMesh />
      <ZipLine />
    </group>
  );
}

function TreeBeds() {
  return (
    <group>
      <group position={[-2.2, 0, -3.35]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[2.35, 0.16, 1.28]} />
          <meshLambertMaterial color={WOOD_DARK} />
        </mesh>
        <mesh position={[0, 0.36, 0]} castShadow>
          <boxGeometry args={[2.22, 0.18, 1.14]} />
          <meshLambertMaterial color="#6a3a48" />
        </mesh>
        <mesh position={[-0.88, 0.48, 0]} castShadow>
          <boxGeometry args={[0.44, 0.16, 0.92]} />
          <meshLambertMaterial color="#efe4cc" />
        </mesh>
      </group>
      <group position={[-4.15, 0, 0.15]}>
        <mesh position={[0, 0.16, 0]} castShadow>
          <boxGeometry args={[0.95, 0.12, 2.15]} />
          <meshLambertMaterial color={WOOD_DARK} />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.86, 0.14, 2.02]} />
          <meshLambertMaterial color="#4a5a78" />
        </mesh>
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[0.08, 1.55, 2.15]} />
          <meshLambertMaterial color={WOOD} />
        </mesh>
        <mesh position={[0, 1.78, 0]} castShadow>
          <boxGeometry args={[0.9, 0.1, 2.1]} />
          <meshLambertMaterial color={WOOD_DARK} />
        </mesh>
        <mesh position={[0, 1.92, 0]} castShadow>
          <boxGeometry args={[0.82, 0.14, 1.96]} />
          <meshLambertMaterial color="#7a3a58" />
        </mesh>
      </group>
    </group>
  );
}

function TreeTable() {
  return (
    <group position={[3.55, 0, -2.85]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.42, 0.08, 0.95]} />
        <meshLambertMaterial color={WOOD_DARK} />
      </mesh>
      {[-0.55, 0.55].map((sx) =>
        [-0.34, 0.34].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx, 0.24, sz]} castShadow>
            <boxGeometry args={[0.08, 0.48, 0.08]} />
            <meshLambertMaterial color={WOOD} />
          </mesh>
        )),
      )}
      <mesh position={[0.42, 0.26, 0.72]} castShadow>
        <boxGeometry args={[0.34, 0.38, 0.34]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function TreeRug() {
  return (
    <mesh position={[0.35, 0.03, -0.15]} rotation={[-Math.PI / 2, 0, 0.08]}>
      <planeGeometry args={[2.4, 1.55]} />
      <meshLambertMaterial color="#6a3a40" />
    </mesh>
  );
}

function ShelfBits() {
  return (
    <group position={[0, 1.72, -TREE_HD + 0.16]}>
      <mesh castShadow>
        <boxGeometry args={[1.55, 0.07, 0.26]} />
        <meshLambertMaterial color={WOOD_DARK} />
      </mesh>
      <mesh position={[-0.38, 0.16, 0]}>
        <boxGeometry args={[0.2, 0.26, 0.14]} />
        <meshLambertMaterial color="#8a3a28" />
      </mesh>
    </group>
  );
}

function DeckRail({ plat }: { plat: number }) {
  const x = TREE_HOME.x;
  const z0 = TREE_HOME.z + TREE_HD;
  const z1 = z0 + TREE_DECK_D;
  const hw = TREE_HW + 0.35;
  const posts: [number, number][] = [
    [x - hw, z0 + 0.15],
    [x - hw, z1],
    [x - TREE_DOOR - 0.15, z1],
    [x + TREE_DOOR + 0.15, z1],
    [x + hw, z1],
    [x + hw, z0 + 0.15],
  ];
  return (
    <group>
      {posts.map(([px, pz], i) => (
        <mesh key={i} position={[px, plat + 0.58, pz]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 1.16, 5]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      ))}
      <mesh position={[x - hw, plat + 0.78, z0 + TREE_DECK_D * 0.5]} castShadow>
        <boxGeometry args={[0.08, 0.08, TREE_DECK_D]} />
        <meshLambertMaterial color="#8a5a28" />
      </mesh>
      <mesh position={[x + hw, plat + 0.78, z0 + TREE_DECK_D * 0.5]} castShadow>
        <boxGeometry args={[0.08, 0.08, TREE_DECK_D]} />
        <meshLambertMaterial color="#8a5a28" />
      </mesh>
      <mesh position={[x - (hw + TREE_DOOR) * 0.5, plat + 0.78, z1]} castShadow>
        <boxGeometry args={[hw - TREE_DOOR, 0.08, 0.08]} />
        <meshLambertMaterial color="#8a5a28" />
      </mesh>
      <mesh position={[x + (hw + TREE_DOOR) * 0.5, plat + 0.78, z1]} castShadow>
        <boxGeometry args={[hw - TREE_DOOR, 0.08, 0.08]} />
        <meshLambertMaterial color="#8a5a28" />
      </mesh>
      <mesh position={[x - (hw + TREE_DOOR) * 0.5, plat + 0.4, z1]} castShadow>
        <boxGeometry args={[hw - TREE_DOOR, 0.06, 0.06]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[x + (hw + TREE_DOOR) * 0.5, plat + 0.4, z1]} castShadow>
        <boxGeometry args={[hw - TREE_DOOR, 0.06, 0.06]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function LadderMesh() {
  const y = heightAt(TREE_LADDER.x, TREE_LADDER.z);
  const h = TREE_HOUSE_H + 0.2;
  return (
    <group position={[TREE_LADDER.x, y, TREE_LADDER.z]} rotation={[0, TREE_LADDER_YAW, 0]}>
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, h * 0.5, 0]} castShadow>
          <boxGeometry args={[0.08, h, 0.08]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[0, 0.22 + i * (h / 14), 0.05]} castShadow>
          <boxGeometry args={[0.7, 0.07, 0.11]} />
          <meshLambertMaterial color="#8a5a28" />
        </mesh>
      ))}
    </group>
  );
}
