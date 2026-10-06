import { sampleH } from "./lush/grid";
import { live } from "./live";
import { lamb } from "./mats";

/**
 * West of Oakstead: a flat lawn, two stair runs, two terraces, then a walled field.
 * Collision height is a smooth ramp. The steps are only the visible treads.
 */

const MID = 2.2;
const TOP = 4.0;
const WALL = 2.7;

type Box = { x: number; z: number; hx: number; hz: number };

const COTTAGES: Box[] = [
  { x: -68.2, z: -111.2, hx: 1.75, hz: 1.45 },
  { x: -59.4, z: -111.2, hx: 1.75, hz: 1.45 },
  { x: -66, z: -86.2, hx: 1.85, hz: 1.5 },
];

const WALLS: Box[] = [
  { x: -90, z: -68, hx: 0.55, hz: 8 },
  { x: -90, z: -46, hx: 0.55, hz: 8 },
  { x: -78, z: -36, hx: 10, hz: 0.55 },
  { x: -48, z: -36, hx: 8, hz: 0.55 },
  { x: -80, z: -78, hx: 8, hz: 0.55 },
  { x: -52, z: -78, hx: 6, hz: 0.55 },
  { x: -78, z: -101.6, hx: 6, hz: 0.38 },
  { x: -60, z: -101.6, hx: 4, hz: 0.38 },
  { x: -70, z: -118.4, hx: 8, hz: 0.38 },
];

function clamp01(u: number) {
  return Math.min(1, Math.max(0, u));
}

function ramp(x: number, z: number, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, along: "x" | "z") {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minZ = Math.min(z0, z1);
  const maxZ = Math.max(z0, z1);
  if (x < minX || x > maxX || z < minZ || z > maxZ) return 0;
  const u = along === "x" ? (x - x0) / (x1 - x0 || 1) : (z - z0) / (z1 - z0 || 1);
  return y0 + (y1 - y0) * clamp01(u);
}

function pad(x: number, z: number, cx: number, cz: number, hx: number, hz: number, h: number) {
  if (Math.abs(x - cx) > hx || Math.abs(z - cz) > hz) return 0;
  return h;
}

/** Extra metres above the lawn. Zero everywhere else. */
export function terraceLift(x: number, z: number) {
  if (x < -120 || x > -30 || z < -130 || z > -20) return 0;
  let y = 0;
  y = Math.max(y, ramp(x, z, -46, -56, -108.4, -105.2, 0, MID, "x"));
  y = Math.max(y, pad(x, z, -66, -110, 12, 8.2, MID));
  y = Math.max(y, ramp(x, z, -68.6, -65.2, -102, -93, MID, TOP, "z"));
  y = Math.max(y, pad(x, z, -66, -86.5, 10, 6.2, TOP));
  y = Math.max(y, ramp(x, z, -68, -64, -81.5, -74.5, TOP, 0, "z"));
  y = Math.max(y, ramp(x, z, -91.3, -88.7, -78, -72.2, 0, WALL, "z"));
  y = Math.max(y, pad(x, z, -90, -68, 0.7, 5.5, WALL));
  y = Math.max(y, pad(x, z, -90, -46, 0.7, 5.5, WALL));
  return y;
}

function pushOut(nx: number, nz: number, b: Box) {
  const dx = nx - b.x;
  const dz = nz - b.z;
  const hx = b.hx + 0.42;
  const hz = b.hz + 0.42;
  if (Math.abs(dx) >= hx || Math.abs(dz) >= hz) return null;
  if (hx - Math.abs(dx) < hz - Math.abs(dz)) {
    return { x: b.x + Math.sign(dx || 1) * hx, z: nz };
  }
  return { x: nx, z: b.z + Math.sign(dz || 1) * hz };
}

export function collideTerrace(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house || live.y > sampleH(nx, nz) + terraceLift(nx, nz) + 2.4) return null;
  let x = nx;
  let z = nz;
  let hit = false;
  for (const b of COTTAGES) {
    const p = pushOut(x, z, b);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  for (const b of WALLS) {
    const p = pushOut(x, z, b);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

function Steps({
  x0,
  z0,
  x1,
  z1,
  y0,
  y1,
  n,
  along,
}: {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  y0: number;
  y1: number;
  n: number;
  along: "x" | "z";
}) {
  const base = sampleH((x0 + x1) / 2, (z0 + z1) / 2);
  const boxes = [];
  for (let i = 0; i < n; i++) {
    const a = i / n;
    const b = (i + 1) / n;
    const y = y0 + (y1 - y0) * b;
    const rise = (y1 - y0) / n;
    const x = along === "x" ? x0 + (x1 - x0) * ((a + b) / 2) : (x0 + x1) / 2;
    const z = along === "z" ? z0 + (z1 - z0) * ((a + b) / 2) : (z0 + z1) / 2;
    const w = along === "x" ? Math.abs(x1 - x0) / n : Math.abs(x1 - x0);
    const d = along === "z" ? Math.abs(z1 - z0) / n : Math.abs(z1 - z0);
    boxes.push(
      <mesh key={i} position={[x, base + y - rise * 0.5, z]} receiveShadow castShadow>
        <boxGeometry args={[Math.max(0.2, w), rise, Math.max(0.2, d)]} />
        {lamb(i % 2 ? "#8d877c" : "#9a9488")}
      </mesh>,
    );
  }
  return <>{boxes}</>;
}

function Slab({ x, z, hx, hz, h }: { x: number; z: number; hx: number; hz: number; h: number }) {
  const y = sampleH(x, z);
  return (
    <mesh position={[x, y + h * 0.5, z]} receiveShadow>
      <boxGeometry args={[hx * 2, h, hz * 2]} />
      {lamb("#b7a488")}
    </mesh>
  );
}

function Cottage({ x, z, h, yaw = 0 }: { x: number; z: number; h: number; yaw?: number }) {
  const y = sampleH(x, z) + h;
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[3.3, 2.3, 2.7]} />
        {lamb("#efe6d2")}
      </mesh>
      <mesh position={[0, 2.45, 0]} castShadow>
        <boxGeometry args={[3.7, 0.55, 3.15]} />
        {lamb("#8d3b32")}
      </mesh>
      <mesh position={[0, 2.85, 0]} castShadow>
        <boxGeometry args={[2.4, 0.35, 1.8]} />
        {lamb("#6e2e28")}
      </mesh>
      <mesh position={[0, 1.0, 1.36]}>
        <boxGeometry args={[0.72, 1.35, 0.08]} />
        {lamb("#5c3a22")}
      </mesh>
      {[-0.95, 0.95].map((s) => (
        <mesh key={s} position={[s, 1.4, 1.37]}>
          <boxGeometry args={[0.48, 0.4, 0.06]} />
          {lamb("#b7d7e4")}
        </mesh>
      ))}
    </group>
  );
}

function Wall({ b, h = WALL }: { b: Box; h?: number }) {
  const y = sampleH(b.x, b.z);
  return (
    <mesh position={[b.x, y + h * 0.5, b.z]} castShadow receiveShadow>
      <boxGeometry args={[b.hx * 2, h, b.hz * 2]} />
      {lamb("#7e7870")}
    </mesh>
  );
}

function Bush({ x, z }: { x: number; z: number }) {
  const y = sampleH(x, z);
  return (
    <mesh position={[x, y + 0.35, z]} castShadow>
      <sphereGeometry args={[0.42, 7, 5]} />
      {lamb("#3f7a3a")}
    </mesh>
  );
}

export function Terraces() {
  const gate = sampleH(-108, -56);
  return (
    <group>
      <Steps x0={-46} z0={-108.4} x1={-56} z1={-105.2} y0={0.16} y1={MID} n={14} along="x" />
      <Slab x={-66} z={-110} hx={12} hz={8.2} h={MID} />
      <Steps x0={-68.6} z0={-102} x1={-65.2} z1={-93} y0={MID} y1={TOP} n={12} along="z" />
      <Slab x={-66} z={-86.5} hx={10} hz={6.2} h={TOP} />
      <Steps x0={-68} z0={-81.5} x1={-64} z1={-74.5} y0={TOP} y1={0.16} n={14} along="z" />
      <Cottage x={-68.2} z={-111.2} h={MID} />
      <Cottage x={-59.4} z={-111.2} h={MID} yaw={0.04} />
      <Cottage x={-66} z={-86.2} h={TOP} yaw={Math.PI} />
      {WALLS.map((b, i) => (
        <Wall key={i} b={b} h={b.z < -90 ? 1.35 : WALL} />
      ))}
      <Steps x0={-91.3} z0={-78} x1={-88.7} z1={-72.2} y0={0.12} y1={WALL} n={12} along="z" />
      <mesh position={[-90, sampleH(-90, -68) + WALL + 0.12, -68]} receiveShadow>
        <boxGeometry args={[1.5, 0.24, 11]} />
        {lamb("#6a6560")}
      </mesh>
      <mesh position={[-90, sampleH(-90, -46) + WALL + 0.12, -46]} receiveShadow>
        <boxGeometry args={[1.5, 0.24, 11]} />
        {lamb("#6a6560")}
      </mesh>
      <Bush x={-44.5} z={-107} />
      <Bush x={-44.2} z={-104.2} />
      <Bush x={-86} z={-74} />
      <Bush x={-84} z={-40} />
      <Bush x={-42} z={-40} />
      <Bush x={-74} z={-74} />
      <group position={[-108, gate, -56]}>
        {[-2.2, 2.2].map((s) => (
          <mesh key={s} position={[s, 1.3, 0]} castShadow>
            <boxGeometry args={[0.7, 2.6, 0.7]} />
            {lamb("#6e6860")}
          </mesh>
        ))}
        <mesh position={[0, 2.45, 0]} castShadow>
          <boxGeometry args={[5.1, 0.45, 0.7]} />
          {lamb("#5e5954")}
        </mesh>
        <mesh position={[0.8, 0.35, 1.6]} castShadow>
          <dodecahedronGeometry args={[0.45, 0]} />
          {lamb("#7a7368")}
        </mesh>
      </group>
    </group>
  );
}
