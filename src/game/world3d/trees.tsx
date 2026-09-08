import { useMemo, useRef } from "react";
import * as THREE from "three";
import { heightAt } from "./field";
import { lamb } from "./mats";

const TRUNK = new THREE.CylinderGeometry(0.16, 0.28, 1, 8);
const TRUNK_TOP = new THREE.CylinderGeometry(0.08, 0.14, 0.7, 6);
const BRANCH = new THREE.CylinderGeometry(0.035, 0.07, 1, 6);
const ROOT = new THREE.CapsuleGeometry(0.07, 0.42, 3, 6);
const LEAF = new THREE.IcosahedronGeometry(1, 0);
const BARK_NUB = new THREE.DodecahedronGeometry(0.08, 0);
const STEM = new THREE.CylinderGeometry(0.025, 0.04, 0.4, 5);
const LEAF_DARK = ["#3d6a32", "#456e30", "#355e2c"];
const LEAF_MID = ["#5a8a3c", "#6a9a40", "#5e8e38"];
const LEAF_LIT = ["#9aba48", "#b4c85a", "#c4d46a"];
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
  const gy = y ?? heightAt(x, z);
  const sway = useRef<THREE.Group>(null);
  const rnd = useMemo(() => seeded(seed + Math.round(x * 7) + Math.round(z * 13)), [seed, x, z]);
  const bits = useMemo(() => {
    const r = seeded(seed + Math.round(x * 7) + Math.round(z * 13));
    const lean = (r() - 0.5) * 0.12;
    const twist = r() * Math.PI * 2;
    const h = (kind === "pine" ? 5.2 : 4.2) * s * (0.85 + r() * 0.35);
    const roots = Array.from({ length: 0 }, (_, i) => {
      const a = (i / 4) * Math.PI * 2 + r() * 0.4;
      return { a, len: 0.55 + r() * 0.35, thick: 0.8 + r() * 0.4 };
    });
    const branches = Array.from({ length: 0 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 + r();
      const elev = 0.55 + r() * 0.7;
      return {
        a,
        elev,
        y: h * (kind === "pine" ? 0.35 + i * 0.12 : 0.42 + r() * 0.4),
        len: (kind === "pine" ? 0.7 : 1.1) * s * (0.7 + r() * 0.6),
        thick: 0.7 + r() * 0.5,
      };
    });
    const clusters = Array.from({ length: kind === "pine" ? 3 : 3 }, (_, i) => ({
      x: (r() - 0.5) * 1.4 * s,
      y: h * (kind === "pine" ? 0.52 + i * 0.16 : 0.72) + (r() - 0.4) * 0.45 * s,
      z: (r() - 0.5) * 1.4 * s,
      s: (kind === "pine" ? 0.85 : 1.15) * s * (0.7 + r() * 0.4),
      col: i < 1 ? LEAF_DARK[i % 3]! : i < 2 ? LEAF_MID[i % 3]! : LEAF_LIT[i % 3]!,
    }));
    const nubs = Array.from({ length: 0 }, () => ({
      y: 0.3 + r() * h * 0.5,
      a: r() * Math.PI * 2,
      s: 0.7 + r() * 0.6,
    }));
    return { lean, twist, h, roots, branches, clusters, nubs, bark: BARK[Math.floor(r() * BARK.length)]! };
  }, [seed, x, z, s, kind]);

  void rnd;
  const { lean, twist, h, roots, branches, clusters, nubs, bark } = bits;
  void roots;
  void branches;
  void nubs;

  if (kind === "pine") {
    return (
      <group position={[x, gy, z]} rotation={[0, twist, lean]}>
        <mesh geometry={TRUNK} position={[0, h * 0.38, 0]} scale={[s * 0.85, h, s * 0.85]}>
          {lamb(bark, { kind: "bark" })}
        </mesh>
        {clusters.map((c, i) => (
          <mesh key={i} position={[c.x * 0.4, c.y, c.z * 0.4]}>
            <coneGeometry args={[c.s * 1.35, c.s * 1.7, 5]} />
            {lamb(c.col, { kind: "leaf" })}
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group position={[x, gy, z]} rotation={[0, twist, lean]}>
      <mesh geometry={TRUNK} position={[0, h * 0.38, 0]} scale={[s * 1.05, h * 0.78, s * 1.05]}>
        {lamb(bark, { kind: "bark" })}
      </mesh>
      <mesh geometry={TRUNK_TOP} position={[0.04 * s, h * 0.78, 0.02 * s]} rotation={[0.12, 0.4, 0.08]} scale={[s, h * 0.45, s]}>
        {lamb(bark, { kind: "bark" })}
      </mesh>
      <group ref={sway}>
        {clusters.map((c, i) => (
          <mesh key={i} geometry={LEAF} position={[c.x, c.y, c.z]} scale={[c.s * 1.35, c.s * 1.05, c.s * 1.25]}>
            {lamb(c.col, { kind: "leaf" })}
          </mesh>
        ))}
      </group>
    </group>
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
  const gy = y ?? heightAt(x, z);
  const bits = useMemo(() => {
    const r = seeded(seed + 19);
    return {
      n: 2,
      twist: r() * 6,
      stems: Array.from({ length: 1 }, (_, i) => ({
        a: (i / 3) * 6 + r(),
        lean: 0.3 + r() * 0.4,
      })),
      leaves: Array.from({ length: 2 }, (_, i) => ({
        x: (r() - 0.5) * 0.55 * s,
        y: 0.22 * s + (i % 2) * 0.12 * s,
        z: (r() - 0.5) * 0.5 * s,
        s: (0.7 + r() * 0.5) * s,
        col: i === 0 ? "#3d6a32" : i < 3 ? "#5a8a3c" : "#9aba48",
      })),
    };
  }, [seed, s]);
  return (
    <group position={[x, gy, z]} rotation={[0, bits.twist, 0]}>
      {bits.stems.map((st, i) => (
        <mesh
          key={i}
          geometry={STEM}
          position={[Math.cos(st.a) * 0.08 * s, 0.16 * s, Math.sin(st.a) * 0.08 * s]}
          rotation={[st.lean, 0, st.a]}
        >
          {lamb("#3a2818", { kind: "bark" })}
        </mesh>
      ))}
      {bits.leaves.map((c, i) => (
        <mesh key={i} geometry={LEAF} position={[c.x, c.y, c.z]} scale={[c.s, c.s * 0.75, c.s]}>
          {lamb(c.col, { kind: "leaf" })}
        </mesh>
      ))}
      {berry
        ? [0, 1, 2].map((k) => (
            <mesh key={k} position={[(k - 1) * 0.14 * s, 0.38 * s, 0.1 * s]}>
              <sphereGeometry args={[0.04 * s, 5, 4]} />
              {lamb(k % 2 ? "#8a3a3a" : "#c45c68", { kind: "flower" })}
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
