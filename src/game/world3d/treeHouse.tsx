import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
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

const STUMP = makeStumpFloor(5.38);
const WALL_GAP = 0.64;

/** Cut face of the oak: tight growth rings, one wood family, dark bark rim. */
function makeStumpFloor(R: number) {
  const rings = 40;
  const segs = 72;
  const row = segs + 1;
  const pos = new Float32Array((rings + 1) * row * 3);
  const col = new Float32Array((rings + 1) * row * 3);
  const idx: number[] = [];
  const c = new THREE.Color();
  const bark = new THREE.Color("#5b3c28");
  const cambium = new THREE.Color("#8a6244");
  const wood = new THREE.Color("#c4a36e");
  const woodDark = new THREE.Color("#b48e5c");
  const woodLite = new THREE.Color("#cdb078");
  const heart = new THREE.Color("#a67c4a");
  let o = 0;
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const rad = R * (1 - t);
    if (t < 0.035) c.copy(bark);
    else if (t < 0.055) c.copy(cambium);
    else {
      const band = Math.sin(t * Math.PI * 26);
      c.copy(band > 0.35 ? woodLite : band < -0.35 ? woodDark : wood);
      c.lerp(heart, Math.pow(t, 1.25) * 0.42);
    }
    for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      pos[o * 3] = Math.cos(a) * rad;
      pos[o * 3 + 1] = 0.04;
      pos[o * 3 + 2] = Math.sin(a) * rad;
      col[o * 3] = c.r;
      col[o * 3 + 1] = c.g;
      col[o * 3 + 2] = c.b;
      o++;
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * row + j;
      idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const WOOD = "#6a4428";
const WOOD_DARK = "#4a3018";
const BARK = "#4e3420";

/** Hollow oak. The door opens into the tree. The room is the inside of the trunk. */
export function TreeHouse() {
  const y = heightAt(TREE_TRUNK.x, TREE_TRUNK.z);
  const hy = heightAt(TREE_HOME.x, TREE_HOME.z);
  const plat = hy + TREE_HOUSE_H;
  const doorW = TREE_DOOR * 2;
  const stumpH = Math.max(2.2, plat - y);
  return (
    <group>
      <mesh position={[TREE_HOME.x, y + stumpH * 0.5, TREE_HOME.z]} castShadow>
        <cylinderGeometry args={[6.15, 7.4, stumpH, 12]} />
        <meshLambertMaterial color={BARK} />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const rx = Math.sin(a) * 6.45;
        const rz = Math.cos(a) * 6.45;
        if (rz > 4.4 && Math.abs(rx) < 1.8) return null;
        return (
          <mesh key={`bark${i}`} position={[TREE_HOME.x + rx, y + stumpH * 0.52, TREE_HOME.z + rz]} rotation={[0, -a, 0]} castShadow>
            <boxGeometry args={[0.28, stumpH * 0.9, 0.18]} />
            <meshLambertMaterial color={i % 3 === 0 ? "#3a2616" : i % 3 === 1 ? "#5a3c26" : "#6a4a30"} />
          </mesh>
        );
      })}
      {[0.9, 2.2, 3.5, 4.7, 5.6].map((a, i) => {
        const rx = Math.sin(a) * 7.1;
        const rz = Math.cos(a) * 7.1;
        if (rz > 4.6) return null;
        return (
          <mesh key={`root${i}`} position={[TREE_HOME.x + rx, y + 0.42, TREE_HOME.z + rz]} rotation={[0.55, -a, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.62, 1.35, 6]} />
            <meshLambertMaterial color="#3e2a18" />
          </mesh>
        );
      })}

      <group position={[TREE_HOME.x, plat, TREE_HOME.z]}>
        <mesh geometry={STUMP} receiveShadow>
          <meshLambertMaterial vertexColors side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, TREE_CEIL * 0.5, 0]}>
          <cylinderGeometry args={[5.42, 5.58, TREE_CEIL + 0.2, 48, 1, true, WALL_GAP * 0.5, Math.PI * 2 - WALL_GAP]} />
          <meshLambertMaterial color="#6a4832" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, TREE_CEIL * 0.5, 0]}>
          <cylinderGeometry args={[5.58, 5.76, TREE_CEIL + 0.08, 48, 1, true, WALL_GAP * 0.5, Math.PI * 2 - WALL_GAP]} />
          <meshLambertMaterial color="#543c28" side={THREE.BackSide} />
        </mesh>
        {[
          [0, 5.4, 0, 4.6],
          [3.4, 4.6, 1.6, 3.2],
          [-3.6, 4.8, -1.2, 3.4],
          [1.2, 6.2, -2.4, 2.8],
          [-1.6, 5.8, 2.2, 2.6],
        ].map((p, i) => (
          <group key={`leaf${i}`}>
            <mesh position={[p[0]!, TREE_CEIL + p[1]!, p[2]!]} castShadow>
              <sphereGeometry args={[p[3], 8, 6]} />
              <meshLambertMaterial color={i % 2 ? "#245a28" : "#2a6a32"} />
            </mesh>
            <mesh position={[p[0]!, TREE_CEIL + p[1]! - p[3]! * 0.45, p[2]!]}>
              <sphereGeometry args={[p[3]! * 0.72, 7, 5]} />
              <meshLambertMaterial color="#163818" />
            </mesh>
          </group>
        ))}

        <mesh position={[-TREE_DOOR - 0.06, 1.15, TREE_HD + 0.12]} castShadow>
          <boxGeometry args={[0.18, 2.35, 0.28]} />
          <meshLambertMaterial color={WOOD_DARK} />
        </mesh>
        <mesh position={[TREE_DOOR + 0.06, 1.15, TREE_HD + 0.12]} castShadow>
          <boxGeometry args={[0.18, 2.35, 0.28]} />
          <meshLambertMaterial color={WOOD_DARK} />
        </mesh>
        <mesh position={[0, 2.38, TREE_HD + 0.14]} castShadow>
          <boxGeometry args={[doorW + 0.36, 0.2, 0.3]} />
          <meshLambertMaterial color={WOOD} />
        </mesh>
        <mesh position={[0, (2.52 + TREE_CEIL) * 0.5, 5.18]} castShadow>
          <boxGeometry args={[4.05, TREE_CEIL - 2.48, 0.42]} />
          <meshLambertMaterial color="#e6d5b8" />
        </mesh>
        <DoorBlur />
        <DoorCurtains />
        <mesh position={[0, TREE_CEIL - 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[5.36, 40]} />
          <meshLambertMaterial color="#4a3018" side={THREE.DoubleSide} />
        </mesh>

        <TreeBeds />
        <TreeTable />
        <TreeRug />
        <ShelfBits />
        <mesh position={[0, TREE_CEIL - 0.55, 0]} castShadow>
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshLambertMaterial color="#f4c878" emissive="#f0b040" emissiveIntensity={1.5} />
        </mesh>
      </group>

      {Array.from({ length: 7 }, (_, i) => {
        const span = TREE_HW * 2 + 0.7;
        const gap = 0.07;
        const w = (span - gap * 6) / 7;
        const px = TREE_HOME.x - span * 0.5 + w * 0.5 + i * (w + gap);
        return (
          <mesh key={`plank${i}`} position={[px, plat - 0.08, TREE_HOME.z + TREE_HD + TREE_DECK_D * 0.5]} receiveShadow castShadow>
            <boxGeometry args={[w, 0.14, TREE_DECK_D]} />
            <meshLambertMaterial color={i % 2 ? "#6b3e1c" : "#8a5528"} />
          </mesh>
        );
      })}
      <mesh position={[TREE_HOME.x, plat - 0.48, TREE_HOME.z + TREE_HD + TREE_DECK_D - 0.15]} castShadow>
        <boxGeometry args={[TREE_HW * 1.7, 0.62, 0.28]} />
        <meshLambertMaterial color="#3e2a18" />
      </mesh>
      <DeckRail plat={plat} />
      <LadderMesh />
      {live.quality === "high" ? <ZipLine /> : null}
    </group>
  );
}

function DoorBlur() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const inside = live.house === "yours" && !live.doorUse && live.z < TREE_HOME.z + TREE_HD - 0.2;
    ref.current.visible = inside;
    const t = clock.elapsedTime;
    ref.current.children.forEach((c, i) => {
      if (i === 0) return;
      c.position.x = Math.sin(t * 0.12 + i * 1.7) * 0.18;
      c.position.y = Math.cos(t * 0.1 + i) * 0.08;
    });
  });
  const blobs: { x: number; y: number; s: number; c: string }[] = [
    { x: -0.35, y: 0.35, s: 0.95, c: "#7ea85a" },
    { x: 0.4, y: -0.15, s: 1.05, c: "#6e9850" },
    { x: 0.05, y: 0.55, s: 0.8, c: "#c5d4b0" },
    { x: -0.15, y: -0.45, s: 0.9, c: "#8a9a62" },
    { x: 0.25, y: 0.1, s: 0.7, c: "#d5e4c4" },
  ];
  return (
    <group ref={ref} position={[0, 1.15, 5.12]}>
      <mesh>
        <planeGeometry args={[2.28, 2.32]} />
        <meshBasicMaterial color="#9ab872" side={THREE.BackSide} />
      </mesh>
      {blobs.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, -0.02]}>
          <circleGeometry args={[b.s, 18]} />
          <meshBasicMaterial color={b.c} transparent opacity={0.72} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function DoorCurtains() {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const drop = 2.15;
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (left.current) left.current.rotation.y = -0.42 + Math.sin(t * 0.45) * 0.03;
    if (right.current) right.current.rotation.y = 0.42 + Math.sin(t * 0.45 + 1.1) * 0.03;
  });
  return (
    <group>
      {([-1, 1] as const).map((side) => (
        <group
          key={side}
          ref={side < 0 ? left : right}
          position={[side * (TREE_DOOR + 0.02), 2.22, 4.85]}
          rotation={[0, side * 0.55, 0]}
        >
          <mesh position={[side * 0.22, -drop * 0.5, 0]} castShadow>
            <boxGeometry args={[0.72, drop, 0.04]} />
            <meshLambertMaterial color="#f3e6d2" />
          </mesh>
          <mesh position={[side * 0.08, -drop * 0.5, 0.03]} rotation={[0, 0, side * 0.04]} castShadow>
            <boxGeometry args={[0.28, drop * 0.98, 0.03]} />
            <meshLambertMaterial color="#e4d0b4" />
          </mesh>
          <mesh position={[side * 0.38, -drop * 0.42, 0.04]} rotation={[0, 0, side * 0.5]}>
            <boxGeometry args={[0.08, 0.55, 0.04]} />
            <meshLambertMaterial color="#8a3a32" />
          </mesh>
          <mesh position={[side * 0.05, -drop + 0.02, 0.02]}>
            <boxGeometry args={[0.78, 0.08, 0.05]} />
            <meshLambertMaterial color="#efe2cc" />
          </mesh>
        </group>
      ))}
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
    <group position={[0, 1.72, -4.92]}>
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
        <mesh key={i} position={[px, plat + 0.62, pz]} castShadow>
          <boxGeometry args={[0.22, 1.28, 0.22]} />
          <meshLambertMaterial color="#5a3a22" />
        </mesh>
      ))}
      <mesh position={[x - hw, plat + 0.95, z0 + TREE_DECK_D * 0.5]} castShadow>
        <boxGeometry args={[0.16, 0.16, TREE_DECK_D]} />
        <meshLambertMaterial color="#6a4428" />
      </mesh>
      <mesh position={[x + hw, plat + 0.95, z0 + TREE_DECK_D * 0.5]} castShadow>
        <boxGeometry args={[0.16, 0.16, TREE_DECK_D]} />
        <meshLambertMaterial color="#6a4428" />
      </mesh>
      <mesh position={[x - hw, plat + 0.48, z0 + TREE_DECK_D * 0.5]} castShadow>
        <boxGeometry args={[0.14, 0.12, TREE_DECK_D]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[x + hw, plat + 0.48, z0 + TREE_DECK_D * 0.5]} castShadow>
        <boxGeometry args={[0.14, 0.12, TREE_DECK_D]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[x - (hw + TREE_DOOR) * 0.5, plat + 0.95, z1]} castShadow>
        <boxGeometry args={[hw - TREE_DOOR, 0.16, 0.16]} />
        <meshLambertMaterial color="#6a4428" />
      </mesh>
      <mesh position={[x + (hw + TREE_DOOR) * 0.5, plat + 0.95, z1]} castShadow>
        <boxGeometry args={[hw - TREE_DOOR, 0.16, 0.16]} />
        <meshLambertMaterial color="#6a4428" />
      </mesh>
      <mesh position={[x - (hw + TREE_DOOR) * 0.5, plat + 0.48, z1]} castShadow>
        <boxGeometry args={[hw - TREE_DOOR, 0.12, 0.14]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[x + (hw + TREE_DOOR) * 0.5, plat + 0.48, z1]} castShadow>
        <boxGeometry args={[hw - TREE_DOOR, 0.12, 0.14]} />
        <meshLambertMaterial color="#5a3a22" />
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
