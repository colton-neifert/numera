import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, pondU, VX, VZ, POND, TREE_TRUNK } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { FIRE_PIT, FOUNTAIN, PADDOCK, HAY, MILL_AT, WELL_AT, WELL_TWO } from "./village";
import { SMITH_AT, FARM_AT, MANOR_AT } from "./townLife";
import { HOUSES, houseSize } from "./house";
import { FW, RV, MW, LANDS, riverU } from "./lands";
import { dayShift } from "../dayNight";

/** Soft collision for logs, stumps, hay, troughs, columns. */
const hits: { x: number; z: number; r: number }[] = [];

function mark(x: number, z: number, r: number) {
  for (const h of hits) {
    if (Math.abs(h.x - x) < 0.05 && Math.abs(h.z - z) < 0.05) return;
  }
  hits.push({ x, z, r });
}

export function collideDetail(nx: number, nz: number): { x: number; z: number } | null {
  let x = nx;
  let z = nz;
  let hit = false;
  for (const s of hits) {
    const dx = x - s.x;
    const dz = z - s.z;
    const d2 = dx * dx + dz * dz;
    const rr = s.r * s.r;
    if (d2 < rr && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      x = s.x + (dx / d) * s.r;
      z = s.z + (dz / d) * s.r;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

function seeded(n: number) {
  let x = n | 0;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}

function NearGate({ x, z, r, children }: { x: number; z: number; r: number; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = Math.hypot(live.x - x, live.z - z) < r;
  });
  return <group ref={g} visible={false}>{children}</group>;
}

function Rock({ x, z, s = 0.28, moss = false, yaw = 0 }: { x: number; z: number; s?: number; moss?: boolean; yaw?: number }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]} rotation={[0.08, yaw, 0.05]}>
      <mesh position={[0, s * 0.42, 0]} castShadow>
        <dodecahedronGeometry args={[s, 0]} />
        {lamb(moss ? "#5a6a48" : "#8a7a68", { kind: "stone" })}
      </mesh>
    </group>
  );
}

function Log({ x, z, yaw = 0, len = 2.2, r = 0.22 }: { x: number; z: number; yaw?: number; len?: number; r?: number }) {
  mark(x, z, Math.max(0.42, len * 0.22));
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0.08]}>
      <mesh position={[0, r, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r * 0.85, r, len, 7]} />
        {lamb("#5a3a20", { kind: "bark" })}
      </mesh>
      <mesh position={[len * 0.48, r, 0]} rotation={[0, 0, Math.PI / 2]}>
        <circleGeometry args={[r * 0.82, 8]} />
        {lamb("#c4a06a", { kind: "wood" })}
      </mesh>
    </group>
  );
}

function Stump({ x, z, s = 0.38 }: { x: number; z: number; s?: number }) {
  mark(x, z, s + 0.12);
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, s * 0.55, 0]} castShadow>
        <cylinderGeometry args={[s * 0.82, s, s * 1.05, 8]} />
        {lamb("#5a3a20", { kind: "bark" })}
      </mesh>
      <mesh position={[0, s * 1.08, 0]} rotation={[-Math.PI / 2, 0, 0.2]}>
        <circleGeometry args={[s * 0.78, 8]} />
        {lamb("#c4a06a", { kind: "wood" })}
      </mesh>
      {[-0.7, 0.4, 1.6].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * s * 0.9, s * 0.18, Math.sin(a) * s * 0.9]} rotation={[0.4, a, 0.2]} castShadow>
          <boxGeometry args={[s * 0.18, s * 0.55, s * 0.08]} />
          {lamb("#4a3220", { kind: "bark" })}
        </mesh>
      ))}
    </group>
  );
}

function Roots({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      {[0.2, 1.3, 2.4, 3.7, 5.0].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 1.05 * s, 0.08, Math.sin(a) * 1.05 * s]} rotation={[0.55, a, 0]} castShadow>
          <cylinderGeometry args={[0.07 * s, 0.12 * s, 1.35 * s, 5]} />
          {lamb("#4a3220", { kind: "bark" })}
        </mesh>
      ))}
    </group>
  );
}

function HayBale({ x, z, yaw = 0, stacked = 0 }: { x: number; z: number; yaw?: number; stacked?: number }) {
  mark(x, z, 0.55);
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.38 + stacked * 0.72, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.38, 0.4, 0.78, 8]} />
        {lamb("#c9a227", { kind: "grass" })}
      </mesh>
      <mesh position={[0, 0.38 + stacked * 0.72, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.32, 0.03, 4, 8]} />
        {lamb("#6a4a28", { kind: "cloth" })}
      </mesh>
    </group>
  );
}

function Bucket({ x, z, water = false }: { x: number; z: number; water?: boolean }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.14, 0.32, 8]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      <mesh position={[0, 0.38, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.15, 0.012, 4, 10]} />
        {lamb("#8a6a38", { kind: "wood" })}
      </mesh>
      {water ? (
        <mesh position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.12, 8]} />
          <meshLambertMaterial color="#4a90a0" transparent opacity={0.55} />
        </mesh>
      ) : null}
    </group>
  );
}

function LanternPost({ x, z }: { x: number; z: number }) {
  const y = heightAt(x, z);
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (light.current) light.current.intensity = 0.25 + live.dusk * 2.8;
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 2.1, 6]} />
        {lamb("#4a3a28", { kind: "wood" })}
      </mesh>
      <mesh position={[0, 2.12, 0]} castShadow>
        <boxGeometry args={[0.24, 0.28, 0.24]} />
        {lamb("#c9a227", { kind: "metal" })}
      </mesh>
      <pointLight ref={light} position={[0, 2.12, 0]} intensity={0.3} color="#ffb060" distance={6.5} />
    </group>
  );
}

function Bench({ x, z, yaw = 0 }: { x: number; z: number; yaw?: number }) {
  mark(x, z, 0.38);
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.34, 0]} castShadow>
        <boxGeometry args={[1.15, 0.1, 0.36]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      {[-0.46, 0.46].map((px) => (
        <mesh key={px} position={[px, 0.16, 0]} castShadow>
          <boxGeometry args={[0.08, 0.32, 0.3]} />
          {lamb("#5a3a20", { kind: "wood" })}
        </mesh>
      ))}
    </group>
  );
}

function SignPost({ x, z, yaw = 0 }: { x: number; z: number; yaw?: number }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 1.4, 6]} />
        {lamb("#5a3a20", { kind: "wood" })}
      </mesh>
      <mesh position={[0.32, 1.18, 0]} castShadow>
        <boxGeometry args={[0.78, 0.28, 0.06]} />
        {lamb("#c4a06a", { kind: "wood" })}
      </mesh>
    </group>
  );
}

function Firewood({ x, z, yaw = 0 }: { x: number; z: number; yaw?: number }) {
  mark(x, z, 0.42);
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[(i - 1) * 0.16, 0.1 + (i % 2) * 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.7, 6]} />
          {lamb(i % 2 ? "#5a3a20" : "#6a4a28", { kind: "bark" })}
        </mesh>
      ))}
    </group>
  );
}

function Trough({ x, z, yaw = 0 }: { x: number; z: number; yaw?: number }) {
  mark(x, z, 0.7);
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[1.35, 0.32, 0.48]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      <mesh position={[0, 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.15, 0.32]} />
        <meshLambertMaterial color="#4a7a78" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function Pitchfork({ x, z, yaw = 0 }: { x: number; z: number; yaw?: number }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]} rotation={[0.35, yaw, 0.08]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 1.35, 5]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      {[-0.08, 0, 0.08].map((px, i) => (
        <mesh key={i} position={[px, 1.38, 0.04]} rotation={[0.4, 0, px * 2]}>
          <boxGeometry args={[0.02, 0.22, 0.02]} />
          {lamb("#8a8a80", { kind: "metal" })}
        </mesh>
      ))}
    </group>
  );
}

function Wheelbarrow({ x, z, yaw = 0 }: { x: number; z: number; yaw?: number }) {
  mark(x, z, 0.55);
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.38, 0]} rotation={[0.15, 0, 0]} castShadow>
        <boxGeometry args={[0.7, 0.22, 0.95]} />
        {lamb("#6a4a28", { kind: "wood" })}
      </mesh>
      <mesh position={[0, 0.22, 0.38]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.08, 8]} />
        {lamb("#3a2818", { kind: "wood" })}
      </mesh>
      {[-0.18, 0.18].map((px) => (
        <mesh key={px} position={[px, 0.42, -0.62]} rotation={[0.7, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.7, 5]} />
          {lamb("#5a3a20", { kind: "wood" })}
        </mesh>
      ))}
    </group>
  );
}

function ClothesLine({ ax, az, bx, bz }: { ax: number; az: number; bx: number; bz: number }) {
  const mx = (ax + bx) * 0.5;
  const mz = (az + bz) * 0.5;
  const y = heightAt(mx, mz);
  const yaw = Math.atan2(bx - ax, bz - az);
  const len = Math.hypot(bx - ax, bz - az);
  const cloth = useRef<THREE.Group>(null);
  useFrame(() => {
    if (cloth.current) cloth.current.visible = dayShift() !== "night";
  });
  return (
    <group position={[mx, y, mz]} rotation={[0, yaw, 0]}>
      {[-len * 0.5, len * 0.5].map((pz) => (
        <mesh key={pz} position={[0, 1.05, pz]} castShadow>
          <cylinderGeometry args={[0.045, 0.055, 2.1, 6]} />
          {lamb("#5a3a20", { kind: "wood" })}
        </mesh>
      ))}
      <mesh position={[0, 2.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, len, 4]} />
        {lamb("#d8c49a")}
      </mesh>
      <group ref={cloth}>
        {[-0.55, 0.05, 0.62].map((pz, i) => (
          <mesh key={i} position={[0.02, 1.72, pz]} castShadow>
            <boxGeometry args={[0.04, 0.5, 0.34]} />
            {lamb(["#efe6d4", "#3a5a88", "#8a3a38"][i]!, { kind: "cloth" })}
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Track({ x, z, yaw = 0, kind = "deer" }: { x: number; z: number; yaw?: number; kind?: "deer" | "horse" | "hen" | "wolf" | "goat" }) {
  const y = heightAt(x, z) + 0.025;
  const w = kind === "horse" ? 0.16 : kind === "hen" ? 0.06 : kind === "wolf" ? 0.1 : 0.09;
  const d = kind === "horse" ? 0.22 : kind === "hen" ? 0.08 : 0.14;
  const gap = kind === "hen" ? 0.1 : 0.16;
  return (
    <group position={[x, y, z]} rotation={[-Math.PI / 2, 0, yaw]}>
      {[-gap, gap].map((px) => (
        <mesh key={px} position={[px, 0, 0]}>
          <planeGeometry args={[w, d]} />
          <meshLambertMaterial color="#6a4a28" transparent opacity={0.42} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function TrackRun({ x, z, yaw, n, kind, step = 0.55 }: { x: number; z: number; yaw: number; n: number; kind: "deer" | "horse" | "hen" | "wolf" | "goat"; step?: number }) {
  const bits = [];
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  for (let i = 0; i < n; i++) {
    bits.push(
      <Track key={i} x={x + fx * i * step} z={z + fz * i * step} yaw={yaw + (i % 2) * 0.08} kind={kind} />,
    );
  }
  return <group>{bits}</group>;
}

function TinyStream({ pts, color = "#2e6a68" }: { pts: [number, number][]; color?: string }) {
  return (
    <group>
      {pts.map(([x, z], i) => (
        <mesh key={i} position={[x, heightAt(x, z) + 0.04, z]} rotation={[-Math.PI / 2, 0, i * 0.3]}>
          <circleGeometry args={[0.85 + (i % 3) * 0.12, 10]} />
          <meshLambertMaterial color={color} transparent opacity={0.72} />
        </mesh>
      ))}
    </group>
  );
}

function Reed({ x, z, h = 0.85, c = "#3d8a38" }: { x: number; z: number; h?: number; c?: string }) {
  const y = heightAt(x, z);
  return (
    <mesh position={[x, y + h * 0.5, z]} castShadow>
      <coneGeometry args={[0.04, h, 4]} />
      {lamb(c, { kind: "leaf" })}
    </mesh>
  );
}

function Column({ x, z, h = 2.4, broken = false }: { x: number; z: number; h?: number; broken?: boolean }) {
  mark(x, z, 0.55);
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, (broken ? h * 0.42 : h) * 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, broken ? h * 0.42 : h, 8]} />
        {lamb("#b8a888", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.14, 8]} />
        {lamb("#a89880", { kind: "stone" })}
      </mesh>
      {broken ? (
        <mesh position={[0.55, 0.22, 0.2]} rotation={[0.4, 0.5, 0.2]} castShadow>
          <cylinderGeometry args={[0.22, 0.24, 0.7, 7]} />
          {lamb("#a89880", { kind: "stone" })}
        </mesh>
      ) : (
        <mesh position={[0, h + 0.08, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.16, 8]} />
          {lamb("#a89880", { kind: "stone" })}
        </mesh>
      )}
    </group>
  );
}

function FirePitRing({ x, z }: { x: number; z: number }) {
  mark(x, z, 0.7);
  const y = heightAt(x, z);
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const night = dayShift() === "night" || dayShift() === "dusk";
    if (light.current) light.current.intensity = night ? 2.4 : 0;
  });
  return (
    <group position={[x, y, z]}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.55, 0.08, Math.sin(a) * 0.55]} castShadow>
            <dodecahedronGeometry args={[0.14, 0]} />
            {lamb("#6a5a48", { kind: "stone" })}
          </mesh>
        );
      })}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 10]} />
        {lamb("#3a2818", { kind: "dirt" })}
      </mesh>
      <pointLight ref={light} position={[0, 0.45, 0]} intensity={0} color="#ff8020" distance={5} />
    </group>
  );
}

function ScatterInstanced({
  hubs,
  per,
  seed,
  yOff,
  scale,
  geo,
  colors,
  skipPath,
}: {
  hubs: { x: number; z: number; r: number }[];
  per: number;
  seed: number;
  yOff: number;
  scale: [number, number];
  geo: THREE.BufferGeometry;
  colors: string[];
  skipPath?: boolean;
}) {
  const n = hubs.length * per;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const ready = useRef(false);
  useFrame(() => {
    if (!mesh.current || ready.current) return;
    const rnd = seeded(seed);
    let k = 0;
    for (const h of hubs) {
      for (let i = 0; i < per && k < n; i++) {
        const a = rnd() * Math.PI * 2;
        const rad = rnd() * h.r;
        const x = h.x + Math.cos(a) * rad;
        const z = h.z + Math.sin(a) * rad;
        if (pondU(x, z) > 0.12) continue;
        if (skipPath && Math.hypot(x - VX, z - VZ) < 4) continue;
        dummy.position.set(x, heightAt(x, z) + yOff, z);
        dummy.rotation.set((rnd() - 0.5) * 0.4, rnd() * 6.28, (rnd() - 0.5) * 0.3);
        const s = scale[0] + rnd() * (scale[1] - scale[0]);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(k, dummy.matrix);
        col.set(colors[k % colors.length]!);
        mesh.current.setColorAt(k, col);
        k++;
      }
    }
    mesh.current.count = k;
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    ready.current = true;
  });
  return (
    <instancedMesh ref={mesh} args={[geo, undefined, n]} frustumCulled={false} castShadow={false}>
      <meshLambertMaterial vertexColors />
    </instancedMesh>
  );
}

function Pebbles({ hubs, per = 14, seed = 11, gray = false }: { hubs: { x: number; z: number; r: number }[]; per?: number; seed?: number; gray?: boolean }) {
  const geo = useMemo(() => new THREE.DodecahedronGeometry(0.08, 0), []);
  return (
    <ScatterInstanced
      hubs={hubs}
      per={per}
      seed={seed}
      yOff={0.04}
      scale={[0.45, 1.15]}
      geo={geo}
      colors={gray ? ["#8a8a80", "#6a6a62", "#a09a90"] : ["#8a7a68", "#6a5a48", "#a09078"]}
    />
  );
}

function Leaves({ hubs, per = 22, seed = 29 }: { hubs: { x: number; z: number; r: number }[]; per?: number; seed?: number }) {
  const geo = useMemo(() => new THREE.PlaneGeometry(0.18, 0.12), []);
  return (
    <ScatterInstanced
      hubs={hubs}
      per={per}
      seed={seed}
      yOff={0.03}
      scale={[0.7, 1.4]}
      geo={geo}
      colors={["#c45c38", "#c9a227", "#8a3a28", "#6a4a20"]}
    />
  );
}

function Wildflowers({ hubs, per = 10, seed = 41, cols }: { hubs: { x: number; z: number; r: number }[]; per?: number; seed?: number; cols?: string[] }) {
  const geo = useMemo(() => new THREE.SphereGeometry(0.07, 6, 5), []);
  return (
    <ScatterInstanced
      hubs={hubs}
      per={per}
      seed={seed}
      yOff={0.11}
      scale={[0.55, 1.1]}
      geo={geo}
      colors={cols ?? ["#c45c48", "#e8d48a", "#d478a0", "#3ecf6a", "#efe6d4"]}
    />
  );
}

function GrassPatch({ hubs, per, seed, tall }: { hubs: { x: number; z: number; r: number }[]; per: number; seed: number; tall: boolean }) {
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(tall ? 0.045 : 0.03, tall ? 0.55 : 0.22, 3);
    g.translate(0, tall ? 0.28 : 0.11, 0);
    return g;
  }, [tall]);
  const n = hubs.length * per;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const ready = useRef(false);
  const mat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: tall ? "#3d8a38" : "#5c8434", emissive: "#1a3a12", emissiveIntensity: 0.08 }),
    [tall],
  );
  useFrame(() => {
    if (!mesh.current || ready.current) return;
    const rnd = seeded(seed);
    let k = 0;
    for (const h of hubs) {
      for (let i = 0; i < per && k < n; i++) {
        const a = rnd() * Math.PI * 2;
        const rad = rnd() * h.r;
        const x = h.x + Math.cos(a) * rad;
        const z = h.z + Math.sin(a) * rad;
        if (pondU(x, z) > 0.1 || riverU(x, z) > 0.16) continue;
        dummy.position.set(x, heightAt(x, z) + 0.02, z);
        dummy.rotation.set(0, rnd() * 6.28, (rnd() - 0.5) * 0.12);
        dummy.scale.setScalar(0.75 + rnd() * 0.55);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(k, dummy.matrix);
        k++;
      }
    }
    mesh.current.count = k;
    mesh.current.instanceMatrix.needsUpdate = true;
    ready.current = true;
  });
  return <instancedMesh ref={mesh} args={[geo, mat, n]} frustumCulled={false} />;
}

function CottageYards() {
  const bits = useMemo(() => {
    return HOUSES.filter((h) => (!h.world || h.world === "meadow") && (h.kind === "cottage" || h.kind === "cabin" || h.kind === "home" || h.kind === "inn"));
  }, []);
  return (
    <group>
      {bits.map((h, i) => {
        const { w, d } = houseSize(h);
        const fx = h.x + w * 0.38;
        const fz = h.z + d * 0.42;
        return (
          <group key={h.id ?? i}>
            <Firewood x={fx} z={fz} yaw={i * 0.4} />
            {i % 2 === 0 ? <Bucket x={h.x - w * 0.32} z={h.z + d * 0.38} water={i % 3 === 0} /> : null}
            {h.kind === "inn" ? <Bench x={h.x} z={h.z + d * 0.55} yaw={0} /> : null}
            {h.kind === "home" || h.kind === "cabin" ? (
              <Wildflowers hubs={[{ x: h.x + w * 0.2, z: h.z - d * 0.45, r: 1.4 }]} per={8} seed={80 + i} />
            ) : null}
          </group>
        );
      })}
    </group>
  );
}

function VillageDetails() {
  return (
    <NearGate x={VX} z={VZ} r={220}>
      <Pebbles
        hubs={[
          { x: VX, z: VZ + 6, r: 7 },
          { x: FOUNTAIN.x, z: FOUNTAIN.z, r: 3.2 },
          { x: WELL_AT.x, z: WELL_AT.z, r: 2.4 },
          { x: WELL_TWO.x, z: WELL_TWO.z, r: 2.2 },
          { x: FIRE_PIT.x, z: FIRE_PIT.z, r: 4.2 },
          { x: POND.x + 4, z: POND.z + 2, r: 5 },
        ]}
        per={16}
        seed={3}
      />
      <GrassPatch
        hubs={[
          { x: VX - 10, z: VZ + 4, r: 5 },
          { x: VX + 8, z: VZ - 8, r: 4.5 },
          { x: VX - 6, z: VZ - 16, r: 4 },
        ]}
        per={28}
        seed={5}
        tall={false}
      />
      <Wildflowers
        hubs={[
          { x: FOUNTAIN.x + 3.2, z: FOUNTAIN.z - 1.4, r: 1.8 },
          { x: VX - 12, z: VZ + 6, r: 2.2 },
          { x: WELL_AT.x - 2.2, z: WELL_AT.z + 1.4, r: 1.6 },
        ]}
        per={9}
        seed={9}
      />
      <CottageYards />
      <LanternPost x={VX - 8.4} z={VZ + 12} />
      <LanternPost x={MILL_AT.x + 4.2} z={MILL_AT.z + 5.4} />
      <LanternPost x={MANOR_AT.x + 6.2} z={MANOR_AT.z + 8.4} />
      <Bench x={FOUNTAIN.x + 3.6} z={FOUNTAIN.z - 1.8} yaw={-0.6} />
      <Bench x={MILL_AT.x - 3.4} z={MILL_AT.z + 4.8} yaw={0.3} />
      <Bucket x={WELL_AT.x + 1.15} z={WELL_AT.z + 0.8} water />
      <Bucket x={WELL_TWO.x - 1.05} z={WELL_TWO.z + 0.6} />
      <SignPost x={VX + 10.4} z={VZ + 6.2} yaw={-0.4} />
      <SignPost x={VX - 14.2} z={VZ - 6.4} yaw={1.2} />
      <ClothesLine ax={MANOR_AT.x + 6} az={MANOR_AT.z + 4} bx={MANOR_AT.x + 11} bz={MANOR_AT.z + 5.4} />
      <Rock x={POND.x + 8.4} z={POND.z + 4.2} s={0.32} moss />
      <Rock x={POND.x + 10.2} z={POND.z + 2.6} s={0.22} yaw={0.8} />
      <Rock x={POND.x - 6.4} z={POND.z + 5.2} s={0.26} moss yaw={1.2} />
      <Log x={POND.x - 10.4} z={POND.z + 6.8} yaw={0.7} len={1.8} r={0.16} />
      {[-0.2, 0.4, 1.1, 1.8, 2.6].map((a, i) => (
        <Reed key={i} x={POND.x + 7.2 + Math.cos(a) * 1.4} z={POND.z + 3.4 + Math.sin(a) * 1.1} h={0.45 + (i % 3) * 0.12} />
      ))}
    </NearGate>
  );
}

function FarmDetails() {
  const { x, z } = FARM_AT;
  return (
    <NearGate x={x} z={z} r={90}>
      <HayBale x={x - 4.2} z={z + 3.4} yaw={0.2} />
      <HayBale x={x - 4.6} z={z + 4.2} yaw={-0.4} />
      <HayBale x={x - 4.35} z={z + 3.8} yaw={0.1} stacked={1} />
      <HayBale x={HAY.x + 1.4} z={HAY.z - 0.8} yaw={0.6} />
      <Pitchfork x={x - 5.2} z={z + 2.6} yaw={0.4} />
      <Pitchfork x={x + 8.4} z={z - 3.2} yaw={-0.8} />
      <Wheelbarrow x={x - 2.8} z={z + 5.6} yaw={-0.5} />
      <Trough x={x - 5.4} z={z + 6.2} yaw={0.2} />
      <Bucket x={x - 6.1} z={z + 5.6} water />
      <SignPost x={x - 8.2} z={z + 8.4} yaw={0.35} />
      <LanternPost x={x - 7.4} z={z + 1.2} />
      <Firewood x={x - 3.8} z={z - 3.6} yaw={0.2} />
      <Pebbles hubs={[{ x: x + 2, z: z + 2, r: 5 }]} per={18} seed={17} />
      <GrassPatch hubs={[{ x: x - 8, z: z + 10, r: 6 }]} per={22} seed={19} tall />
      <TrackRun x={x + 1.2} z={z + 4.8} yaw={0.4} n={7} kind="hen" step={0.32} />
      <TrackRun x={x - 2.4} z={z + 6.8} yaw={-0.8} n={5} kind="hen" step={0.28} />
      <Wildflowers hubs={[{ x: x + 9.4, z: z + 2.2, r: 2.4 }]} per={8} seed={21} cols={["#e8d48a", "#c45c48", "#efe6d4"]} />
    </NearGate>
  );
}

function PaddockDetails() {
  const { x, z } = PADDOCK;
  return (
    <NearGate x={x} z={z} r={70}>
      <Trough x={x - 4.6} z={z + 2.2} yaw={1.57} />
      <HayBale x={x + 4.8} z={z - 3.4} yaw={0.3} />
      <HayBale x={x + 5.4} z={z - 2.6} yaw={-0.5} />
      <Bucket x={x - 5.2} z={z + 2.8} water />
      <LanternPost x={x + 7.8} z={z} />
      <SignPost x={x + 8.4} z={z + 2.2} yaw={-1.5} />
      <TrackRun x={x - 2} z={z} yaw={0.2} n={6} kind="horse" step={0.7} />
      <TrackRun x={x + 1.4} z={z + 2.2} yaw={-1.1} n={5} kind="horse" step={0.65} />
      <Pebbles hubs={[{ x, z, r: 5 }]} per={10} seed={23} />
      <GrassPatch hubs={[{ x: x - 8, z: z - 8, r: 4 }]} per={16} seed={25} tall />
    </NearGate>
  );
}

function SmithDetails() {
  const { x, z } = SMITH_AT;
  return (
    <NearGate x={x} z={z} r={55}>
      <mesh position={[x + 3.2, heightAt(x + 3.2, z + 6.4) + 0.12, z + 6.4]} rotation={[0.1, 0.4, 0]} castShadow>
        <boxGeometry args={[0.55, 0.08, 0.22]} />
        {lamb("#5a5854", { kind: "metal" })}
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[x + 3.8 + (i % 2) * 0.18, heightAt(x, z) + 0.04, z + 5.6 + Math.floor(i / 2) * 0.16]}>
          <dodecahedronGeometry args={[0.07, 0]} />
          {lamb("#2a2824", { kind: "stone" })}
        </mesh>
      ))}
      <Bucket x={x + 1.8} z={z + 8.4} />
      <Firewood x={x - 3.2} z={z + 6.2} yaw={0.4} />
      <LanternPost x={x + 5.2} z={z + 8.8} />
      <Pebbles hubs={[{ x: x + 1, z: z + 7, r: 3.4 }]} per={12} seed={27} gray />
    </NearGate>
  );
}

function ForestDetails() {
  return (
    <NearGate x={FW.oak.x} z={FW.oak.z} r={420}>
      <Roots x={FW.oak.x} z={FW.oak.z} s={1.35} />
      <Roots x={FW.twins.x - 3.2} z={FW.twins.z} s={0.9} />
      <Roots x={FW.twins.x + 3.4} z={FW.twins.z + 1.2} s={0.85} />
      <Log x={FW.log.x} z={FW.log.z} yaw={0.6} len={3.4} r={0.28} />
      <Log x={FW.trail.x + 6} z={FW.trail.z - 4} yaw={-0.4} len={2.4} r={0.2} />
      <Log x={FW.camp.x + 4.2} z={FW.camp.z - 3.4} yaw={1.1} len={2.1} r={0.18} />
      <Log x={FW.fern.x - 5} z={FW.fern.z + 3} yaw={0.2} len={1.8} r={0.16} />
      <Stump x={FW.camp.x - 3.4} z={FW.camp.z + 2.2} s={0.42} />
      <Stump x={FW.deer.x + 4.8} z={FW.deer.z - 2.6} s={0.34} />
      <Stump x={FW.hut.x + 5.2} z={FW.hut.z + 3.4} s={0.36} />
      <Stump x={FW.sun.x - 8.4} z={FW.sun.z + 4.2} s={0.3} />
      <Leaves
        hubs={[
          { x: FW.oak.x, z: FW.oak.z, r: 8 },
          { x: FW.birch.x, z: FW.birch.z, r: 7 },
          { x: FW.twins.x, z: FW.twins.z, r: 6 },
          { x: FW.trail.x, z: FW.trail.z, r: 5 },
          { x: FW.sun.x, z: FW.sun.z, r: 7 },
        ]}
        per={26}
        seed={31}
      />
      <GrassPatch
        hubs={[
          { x: FW.sun.x, z: FW.sun.z, r: 8 },
          { x: FW.deer.x, z: FW.deer.z, r: 6 },
        ]}
        per={30}
        seed={33}
        tall
      />
      <Wildflowers hubs={[{ x: FW.sun.x, z: FW.sun.z, r: 5 }]} per={8} seed={35} cols={["#d478a0", "#efe6d4", "#3ecf6a"]} />
      <Pebbles
        hubs={[
          { x: FW.trail.x, z: FW.trail.z, r: 4 },
          { x: FW.gate.x, z: FW.gate.z, r: 5 },
        ]}
        per={12}
        seed={37}
        gray
      />
      <Rock x={FW.gate.x - 4.2} z={FW.gate.z + 3.4} s={0.4} moss />
      <Rock x={FW.owl.x + 3.2} z={FW.owl.z - 2.4} s={0.36} moss yaw={0.7} />
      <Rock x={FW.den.x - 5.4} z={FW.den.z + 2.2} s={0.48} yaw={1.1} />
      <FirePitRing x={FW.camp.x} z={FW.camp.z} />
      <Bench x={FW.hut.x + 3.4} z={FW.hut.z + 2.2} yaw={-0.4} />
      <Bucket x={FW.hut.x + 2.2} z={FW.hut.z + 3.6} />
      <LanternPost x={FW.hut.x - 2.4} z={FW.hut.z + 4.2} />
      <SignPost x={FW.gate.x + 3.4} z={FW.gate.z + 4.8} yaw={0.4} />
      <TrackRun x={FW.deer.x - 6} z={FW.deer.z + 2} yaw={0.7} n={8} kind="deer" step={0.5} />
      <TrackRun x={FW.den.x + 4} z={FW.den.z - 6} yaw={-0.3} n={7} kind="wolf" step={0.52} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Reed
          key={i}
          x={FW.pool.x + Math.cos(i) * 2.4}
          z={FW.pool.z + Math.sin(i) * 2.2}
          h={0.55 + (i % 3) * 0.14}
          c="#2a6a28"
        />
      ))}
      <TinyStream
        pts={[
          [FW.gate.x - 22, FW.gate.z + 18],
          [FW.gate.x - 14, FW.gate.z + 10],
          [FW.arch.x + 8, FW.arch.z + 6],
        ]}
        color="#2a5a48"
      />
    </NearGate>
  );
}

function RiverDetails() {
  return (
    <NearGate x={RV.ford.x} z={RV.ford.z} r={380}>
      <Pebbles
        hubs={[
          { x: RV.ford.x, z: RV.ford.z, r: 8 },
          { x: RV.span.x, z: RV.span.z, r: 5 },
          { x: RV.dock.x, z: RV.dock.z, r: 4 },
          { x: RV.pool.x, z: RV.pool.z, r: 6 },
        ]}
        per={18}
        seed={43}
        gray
      />
      <Log x={RV.wreck.x - 4} z={RV.wreck.z + 3.2} yaw={0.9} len={2.8} r={0.2} />
      <Log x={RV.drift.x} z={RV.drift.z + 6} yaw={-0.3} len={2.2} r={0.16} />
      <Bucket x={RV.dock.x + 2.4} z={RV.dock.z + 1.6} />
      <SignPost x={RV.sign.x} z={RV.sign.z} yaw={0.2} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Reed key={i} x={RV.reed.x + Math.cos(i * 0.9) * 3.4} z={RV.reed.z + Math.sin(i * 0.9) * 2.2} h={0.7 + (i % 3) * 0.18} c="#3d8a58" />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <Reed key={`l${i}`} x={RV.lily.x + Math.cos(i) * 2.8} z={RV.lily.z + Math.sin(i) * 2.2} h={0.5} c="#4a9a48" />
      ))}
      <Rock x={RV.ford.x - 6.2} z={RV.ford.z + 4.4} s={0.34} moss />
      <Rock x={RV.ford.x + 5.4} z={RV.ford.z - 3.2} s={0.28} yaw={0.6} />
      <GrassPatch hubs={[{ x: RV.heron.x, z: RV.heron.z + 8, r: 6 }]} per={18} seed={45} tall />
    </NearGate>
  );
}

function RuinDetails() {
  const U = LANDS.ruins;
  return (
    <NearGate x={U.x} z={U.z} r={280}>
      <Column x={U.x - 6} z={U.z + 4} h={3.2} />
      <Column x={U.x + 6.4} z={U.z + 4.2} h={2.8} broken />
      <Column x={U.x - 5.4} z={U.z - 6} h={2.4} broken />
      <Column x={U.x + 5.8} z={U.z - 5.6} h={3.0} />
      <Column x={U.x} z={U.z + 10.4} h={1.8} broken />
      <mesh position={[U.x, heightAt(U.x, U.z) + 0.22, U.z]} rotation={[0.15, 0.4, 0.08]} castShadow>
        <boxGeometry args={[3.4, 0.38, 0.55]} />
        {lamb("#a89880", { kind: "stone" })}
      </mesh>
      {[-2, 0, 2, 4].flatMap((ix) =>
        [-2, 0, 2].map((iz) => (
          <mesh
            key={`${ix}${iz}`}
            position={[U.x + ix * 1.4, heightAt(U.x + ix * 1.4, U.z + iz * 1.4) + 0.03, U.z + iz * 1.4]}
            rotation={[-Math.PI / 2, 0, (ix + iz) * 0.04]}
          >
            <planeGeometry args={[1.2, 1.2]} />
            {lamb("#9a8a70", { kind: "stone" })}
          </mesh>
        )),
      )}
      <Pebbles hubs={[{ x: U.x, z: U.z, r: 12 }]} per={20} seed={47} gray />
      <GrassPatch hubs={[{ x: U.x + 10, z: U.z - 8, r: 8 }]} per={16} seed={49} tall={false} />
      <Wildflowers hubs={[{ x: U.x - 8, z: U.z + 8, r: 4 }]} per={6} seed={51} cols={["#8a6a38", "#c4a06a"]} />
      <SignPost x={U.x} z={U.z + 18} yaw={3.14} />
      <Rock x={U.x + 12} z={U.z + 2} s={0.5} moss yaw={0.4} />
      <Rock x={U.x - 11} z={U.z - 4} s={0.42} yaw={1.2} />
    </NearGate>
  );
}

function MountainDetails() {
  return (
    <NearGate x={MW.camp.x} z={MW.camp.z} r={320}>
      <FirePitRing x={MW.camp.x} z={MW.camp.z} />
      <Rock x={MW.sign.x + 3.2} z={MW.sign.z - 2.4} s={0.44} />
      <Rock x={MW.arch.x - 4.4} z={MW.arch.z + 2.2} s={0.52} yaw={0.5} />
      <Rock x={MW.goat.x + 6} z={MW.goat.z - 3} s={0.38} />
      <Rock x={MW.ridge.x - 5} z={MW.ridge.z + 2} s={0.6} yaw={0.8} />
      <Pebbles
        hubs={[
          { x: MW.arch.x, z: MW.arch.z, r: 6 },
          { x: MW.camp.x, z: MW.camp.z, r: 5 },
          { x: MW.gorge.x, z: MW.gorge.z, r: 4 },
        ]}
        per={14}
        seed={53}
        gray
      />
      <TrackRun x={MW.goat.x - 4} z={MW.goat.z + 2} yaw={0.5} n={6} kind="goat" step={0.48} />
      <Wildflowers hubs={[{ x: MW.shrine.x, z: MW.shrine.z, r: 3.4 }]} per={7} seed={55} cols={["#efe6d4", "#d478a0"]} />
      <LanternPost x={MW.hut.x + 3.2} z={MW.hut.z + 2.4} />
      <Bench x={MW.hut.x + 2.4} z={MW.hut.z - 1.8} yaw={0.4} />
      <SignPost x={MW.sign.x} z={MW.sign.z} yaw={0} />
      <Stump x={MW.camp.x - 4.2} z={MW.camp.z + 3.4} s={0.28} />
    </NearGate>
  );
}

function DesertDetails() {
  const D = LANDS.desert;
  return (
    <NearGate x={D.x} z={D.z} r={300}>
      <Pebbles hubs={[{ x: D.x, z: D.z, r: 14 }, { x: D.x + 42, z: D.z - 18, r: 8 }]} per={16} seed={57} gray />
      <mesh position={[D.x + 8, heightAt(D.x + 8, D.z - 6) + 0.12, D.z - 6]} rotation={[0.2, 0.5, 0.1]} castShadow>
        <boxGeometry args={[1.6, 0.22, 0.7]} />
        {lamb("#8a6a38", { kind: "wood" })}
      </mesh>
      <mesh position={[D.x + 8.6, heightAt(D.x + 8, D.z - 6) + 0.18, D.z - 5.4]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 8]} />
        {lamb("#5a3a20", { kind: "wood" })}
      </mesh>
      <group position={[D.x - 6.4, heightAt(D.x - 6.4, D.z + 4.2), D.z + 4.2]}>
        <mesh position={[0, 0.12, 0]} rotation={[0.4, 0.6, 0.2]} castShadow>
          <boxGeometry args={[0.55, 0.12, 0.12]} />
          {lamb("#efe6d4", { kind: "stone" })}
        </mesh>
        <mesh position={[0.28, 0.16, 0.04]} rotation={[0.2, 0.4, 0.5]} castShadow>
          <boxGeometry args={[0.32, 0.08, 0.08]} />
          {lamb("#efe6d4", { kind: "stone" })}
        </mesh>
        <mesh position={[-0.05, 0.22, 0.12]} castShadow>
          <sphereGeometry args={[0.11, 7, 5]} />
          {lamb("#efe6d4", { kind: "stone" })}
        </mesh>
      </group>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={i}
          position={[
            D.x + Math.cos(i * 1.1) * (8 + i),
            heightAt(D.x + Math.cos(i * 1.1) * (8 + i), D.z + Math.sin(i * 1.1) * (8 + i)) + 0.18,
            D.z + Math.sin(i * 1.1) * (8 + i),
          ]}
          rotation={[0.2, i, 0.1]}
          castShadow
        >
          <coneGeometry args={[0.12, 0.45, 4]} />
          {lamb("#8a6a38", { kind: "leaf" })}
        </mesh>
      ))}
      <SignPost x={D.x - 40} z={D.z + 22} yaw={0.4} />
      <Rock x={D.x + 16} z={D.z - 10} s={0.55} yaw={0.3} />
      <Rock x={D.x - 12} z={D.z + 8} s={0.42} yaw={1.1} />
    </NearGate>
  );
}

function SwampDetails() {
  const S = LANDS.swamp;
  return (
    <NearGate x={S.x} z={S.z} r={300}>
      <Stump x={S.x + 6} z={S.z - 4} s={0.4} />
      <Stump x={S.x - 8} z={S.z + 6} s={0.34} />
      <Stump x={S.x + 12} z={S.z + 8} s={0.46} />
      <Log x={S.x - 4} z={S.z + 10} yaw={0.7} len={2.6} r={0.2} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <Reed
          key={i}
          x={S.x + Math.cos(i * 0.7) * (6 + (i % 4))}
          z={S.z + Math.sin(i * 0.7) * (6 + (i % 3))}
          h={0.9 + (i % 4) * 0.2}
          c="#3a6a40"
        />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={`l${i}`}
          position={[S.x - 10 + i * 1.6, heightAt(S.x - 10 + i * 1.6, S.z + 4) + 0.06, S.z + 4 + Math.sin(i) * 1.2]}
          rotation={[-Math.PI / 2, 0, i]}
        >
          <circleGeometry args={[0.32, 10]} />
          {lamb("#3d8a38", { kind: "leaf" })}
        </mesh>
      ))}
      <Pebbles hubs={[{ x: S.x, z: S.z, r: 10 }]} per={10} seed={59} />
      <GrassPatch hubs={[{ x: S.x + 16, z: S.z - 8, r: 7 }]} per={20} seed={61} tall />
      <TinyStream
        pts={[
          [S.x - 18, S.z + 4],
          [S.x - 8, S.z + 2],
          [S.x + 2, S.z],
        ]}
        color="#2a4a38"
      />
    </NearGate>
  );
}

function SnowDetails() {
  const N = LANDS.snow;
  return (
    <NearGate x={N.x} z={N.z} r={280}>
      <Rock x={N.x + 8} z={N.z - 6} s={0.4} />
      <Rock x={N.x - 10} z={N.z + 4} s={0.5} yaw={0.6} />
      <Stump x={N.x - 6} z={N.z - 8} s={0.3} />
      <Pebbles hubs={[{ x: N.x, z: N.z, r: 10 }]} per={12} seed={63} gray />
      <TrackRun x={N.x + 4} z={N.z - 4} yaw={0.3} n={6} kind="wolf" step={0.55} />
      <SignPost x={N.x} z={N.z - 48} yaw={0} />
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[N.x + Math.cos(i * 1.4) * 5, heightAt(N.x, N.z) + 0.18, N.z + Math.sin(i * 1.4) * 5]}
          rotation={[0.4, i, 0.2]}
        >
          <octahedronGeometry args={[0.16, 0]} />
          {lamb("#d8e4ee", { kind: "stone" })}
        </mesh>
      ))}
    </NearGate>
  );
}

function ValeMeadowDetails() {
  return (
    <NearGate x={VX} z={VZ} r={380}>
      <GrassPatch
        hubs={[
          { x: VX + 70, z: VZ + 10, r: 12 },
          { x: VX - 70, z: VZ + 8, r: 10 },
          { x: TREE_TRUNK.x + 18, z: TREE_TRUNK.z + 8, r: 7 },
          { x: 88, z: 360, r: 8 },
        ]}
        per={26}
        seed={65}
        tall
      />
      <Wildflowers
        hubs={[
          { x: VX + 40, z: VZ - 20, r: 8 },
          { x: VX - 48, z: VZ + 30, r: 6 },
          { x: TREE_TRUNK.x + 8, z: TREE_TRUNK.z - 6, r: 4 },
        ]}
        per={12}
        seed={67}
      />
      <Log x={VX - 52} z={VZ + 18} yaw={0.5} len={2.0} r={0.18} />
      <Stump x={VX + 62} z={VZ - 14} s={0.32} />
      <Rock x={VX + 36} z={VZ + 44} s={0.34} moss />
    </NearGate>
  );
}

function Flier({
  kind,
  origin,
}: {
  kind: "bee" | "butterfly" | "bird" | "dragonfly" | "moth";
  origin: { x: number; z: number; r: number };
}) {
  const g = useRef<THREE.Group>(null);
  const st = useRef({ a: Math.random() * 6.28, h: 0.6 + Math.random() * 1.4, s: 0.7 + Math.random() * 0.8 });
  useFrame((_, dt) => {
    const c = st.current;
    const night = dayShift() === "night";
    if ((kind === "bee" || kind === "butterfly" || kind === "dragonfly") && night) {
      if (g.current) g.current.visible = false;
      return;
    }
    if (kind === "moth" && !night) {
      if (g.current) g.current.visible = false;
      return;
    }
    c.a += dt * c.s * (kind === "bird" ? 0.55 : 1.4);
    const x = origin.x + Math.cos(c.a) * origin.r * (0.4 + 0.6 * Math.sin(c.a * 0.7));
    const z = origin.z + Math.sin(c.a * 0.85) * origin.r * (0.4 + 0.5 * Math.cos(c.a * 0.5));
    const y = heightAt(x, z) + c.h + Math.sin(c.a * 3) * (kind === "bird" ? 0.8 : 0.22);
    if (g.current) {
      g.current.visible = true;
      g.current.position.set(x, y, z);
      g.current.rotation.y = c.a + Math.PI / 2;
      const flap = Math.sin(c.a * (kind === "bird" ? 14 : 22)) * 0.45;
      const L = g.current.children[1];
      const R = g.current.children[2];
      if (L) L.rotation.z = flap;
      if (R) R.rotation.z = -flap;
    }
  });
  const body =
    kind === "bird" ? "#4a3a28" : kind === "bee" ? "#c9a227" : kind === "dragonfly" ? "#3a7a78" : kind === "moth" ? "#8a7a68" : "#d478a0";
  const wing =
    kind === "bird" ? "#efe6d4" : kind === "bee" ? "#1a1410" : kind === "dragonfly" ? "#a8d0c8" : kind === "moth" ? "#c4a06a" : "#efe6d4";
  const bs = kind === "bird" ? 0.09 : kind === "dragonfly" ? 0.05 : 0.035;
  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[bs, 6, 5]} />
        {lamb(body)}
      </mesh>
      <mesh position={[0.04, 0, 0]} rotation={[0, 0, 0.2]}>
        <planeGeometry args={[kind === "bird" ? 0.22 : 0.14, kind === "bird" ? 0.1 : 0.08]} />
        <meshLambertMaterial color={wing} side={THREE.DoubleSide} transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh position={[-0.04, 0, 0]} rotation={[0, 0, -0.2]}>
        <planeGeometry args={[kind === "bird" ? 0.22 : 0.14, kind === "bird" ? 0.1 : 0.08]} />
        <meshLambertMaterial color={wing} side={THREE.DoubleSide} transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Wildlife() {
  const wrap = useRef<THREE.Group>(null);
  useFrame(() => {
    if (wrap.current) wrap.current.visible = !live.house;
  });
  return (
    <group ref={wrap}>
      {Array.from({ length: 6 }, (_, i) => (
        <Flier key={`bf${i}`} kind="butterfly" origin={{ x: FOUNTAIN.x, z: FOUNTAIN.z, r: 5 + i * 0.4 }} />
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <Flier key={`bee${i}`} kind="bee" origin={{ x: FARM_AT.x + 4, z: FARM_AT.z, r: 4 + i * 0.3 }} />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <Flier key={`bd${i}`} kind="bird" origin={{ x: VX, z: VZ, r: 18 + i * 3 }} />
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <Flier key={`df${i}`} kind="dragonfly" origin={{ x: POND.x, z: POND.z, r: 6 + i }} />
      ))}
      {Array.from({ length: 3 }, (_, i) => (
        <Flier key={`rv${i}`} kind="dragonfly" origin={{ x: RV.lily.x, z: RV.lily.z, r: 5 }} />
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <Flier key={`wb${i}`} kind="bird" origin={{ x: FW.oak.x, z: FW.oak.z, r: 12 }} />
      ))}
      {Array.from({ length: 3 }, (_, i) => (
        <Flier key={`mt${i}`} kind="moth" origin={{ x: FIRE_PIT.x, z: FIRE_PIT.z, r: 3.4 }} />
      ))}
    </group>
  );
}

export function DetailPlay() {
  return (
    <group>
      <VillageDetails />
      <FarmDetails />
      <PaddockDetails />
      <SmithDetails />
      <ForestDetails />
      <RiverDetails />
      <RuinDetails />
      <MountainDetails />
      <DesertDetails />
      <SwampDetails />
      <SnowDetails />
      <ValeMeadowDetails />
      <Wildlife />
    </group>
  );
}
