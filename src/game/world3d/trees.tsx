import { useMemo, useRef } from "react";
import * as THREE from "three";
import { fieldHeight } from "./field";
import { lamb } from "./mats";
import { LushTree } from "./lush/trees";

const TRUNK = new THREE.CylinderGeometry(0.16, 0.28, 1, 12);
const TRUNK_TOP = new THREE.CylinderGeometry(0.08, 0.14, 0.7, 10);
const BRANCH = new THREE.CylinderGeometry(0.035, 0.07, 1, 8);
const ROOT = new THREE.CapsuleGeometry(0.07, 0.42, 3, 8);
const LEAF = new THREE.IcosahedronGeometry(1, 1);
const BARK_NUB = new THREE.DodecahedronGeometry(0.08, 0);
const STEM = new THREE.CylinderGeometry(0.025, 0.04, 0.4, 5);
const PINE_CONE = new THREE.ConeGeometry(1, 1, 8);
const PINE_TRUNK = new THREE.CylinderGeometry(0.13, 0.22, 1, 8);
const PINE_GREEN = ["#1a3a1c", "#224a22", "#2a5a28", "#326832", "#1e4820", "#3a7434"];
const LEAF_DARK = ["#3a5e28", "#456828", "#355820"];
const LEAF_MID = ["#5a7e32", "#628a34", "#54782c"];
const LEAF_LIT = ["#7a9a3a", "#8aaa40", "#6e9234"];
const BARK = ["#6a4a2c", "#5a3a22", "#7a5230", "#4a3220"];

function seeded(n: number) {
  let x = (n * 9301 + 49297) % 233280;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

type TreeKind = "oak" | "elm" | "pine";

export function VolTree({
  x,
  z,
  s = 1,
  seed = 0,
  kind = "oak",
  y,
}: {
  x: number;
  z: number;
  s?: number;
  seed?: number;
  kind?: TreeKind;
  y?: number;
}) {
  const gy = y ?? fieldHeight(x, z);
  const r = seeded(seed + Math.round(x * 7) + Math.round(z * 13));
  const twist = r() * Math.PI * 2;
  const lean = (r() - 0.5) * 0.08;
  const k = kind === "pine" ? s * 1.3 : s * 1.15;
  return (
    <LushTree
      kind={kind === "pine" ? "pine" : "oak"}
      variant={Math.floor(r() * 97)}
      position={[x, gy - 0.12 * k, z]}
      rotation={[0, twist, lean]}
      scale={[k, k * (0.94 + r() * 0.16), k]}
    />
  );
}

export function VolBush({
  x,
  z,
  s = 1,
  seed = 0,
  berry = false,
  y,
}: {
  x: number;
  z: number;
  s?: number;
  seed?: number;
  berry?: boolean;
  y?: number;
}) {
  const gy = y ?? fieldHeight(x, z);
  const r = seeded(seed + 19);
  const twist = r() * 6;
  return (
    <group position={[x, gy - 0.04, z]} rotation={[0, twist, 0]}>
      <LushTree kind="bush" variant={Math.floor(r() * 97)} scale={s * 0.95} />
      {berry
        ? [0, 1, 2, 3].map((k) => (
            <mesh key={k} position={[Math.cos(k * 1.9) * 0.42 * s, (0.5 + (k % 2) * 0.22) * s, Math.sin(k * 1.9) * 0.42 * s]}>
              <icosahedronGeometry args={[0.055 * s, 0]} />
              {lamb(k % 2 ? "#a32f3a" : "#d2485c", { kind: "flower" })}
            </mesh>
          ))
        : null}
    </group>
  );
}

export function grassTuftGeo() {
  const g = new THREE.ConeGeometry(0.045, 0.32, 3);
  const merged = new THREE.BufferGeometry();
  const pos: number[] = [];
  const nrm: number[] = [];
  const src = g.attributes.position;
  const sn = g.attributes.normal;
  const offsets: [number, number, number, number][] = [
    [0, 0, 0, 0],
    [0.04, 0, 0.02, 0.4],
    [-0.035, 0, 0.025, -0.5],
    [0.01, 0, -0.04, 0.8],
    [-0.02, 0, -0.03, -0.9],
  ];
  for (const [ox, oy, oz, rot] of offsets) {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    for (let i = 0; i < src.count; i++) {
      const x = src.getX(i);
      const y = src.getY(i);
      const z = src.getZ(i);
      pos.push(x * c - z * s + ox, y + oy + 0.16, x * s + z * c + oz);
      const nx = sn.getX(i);
      const ny = sn.getY(i);
      const nz = sn.getZ(i);
      nrm.push(nx * c - nz * s, ny, nx * s + nz * c);
    }
  }
  merged.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  merged.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  return merged;
}
