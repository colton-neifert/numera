import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { lamb, type MatKind } from "./mats";

/** One tiny brick in a packed character. Merged into a single mesh per material. */
export type Brick = {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  rx?: number;
  ry?: number;
  rz?: number;
  /** −0.45 … 0.45 vertex-color shade so packed cubes read as form, not a flat blob. */
  shade?: number;
};

export type FillOpts = {
  /** Keep only the outer shell (0 = solid). Default 0.68. */
  inner?: number;
  /** Position jitter as a fraction of step. */
  jitter?: number;
  /** Extra euler wobble so the pack isn't a Minecraft grid. */
  spin?: number;
  /** Size wobble (0–0.3). */
  sizeJit?: number;
  seed?: number;
  solid?: boolean;
};

const FACE_POS: number[][] = [
  [-0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5],
  [0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5],
  [-0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5],
  [-0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5],
  [0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5],
  [-0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5],
];
const FACE_N: number[][] = [
  [0, 0, 1],
  [0, 0, -1],
  [0, 1, 0],
  [0, -1, 0],
  [1, 0, 0],
  [-1, 0, 0],
];
const FACE_UV = [0, 0, 1, 0, 1, 1, 0, 1];

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _nm = new THREE.Matrix3();

function fract(n: number) {
  return n - Math.floor(n);
}

export function h3(i: number, j: number, k: number, seed = 0) {
  return fract(Math.sin(i * 127.1 + j * 311.7 + k * 74.7 + seed * 19.13) * 43758.5453);
}

/** Merge tiny boxes into one BufferGeometry (one draw call). */
export function mergeBricks(bricks: Brick[]): THREE.BufferGeometry {
  const n = bricks.length;
  const g = new THREE.BufferGeometry();
  if (!n) return g;
  const pos = new Float32Array(n * 24 * 3);
  const nrm = new Float32Array(n * 24 * 3);
  const col = new Float32Array(n * 24 * 3);
  const uv = new Float32Array(n * 24 * 2);
  const idx = n * 24 > 65535 ? new Uint32Array(n * 36) : new Uint16Array(n * 36);
  let vi = 0;
  let ui = 0;
  let ii = 0;
  let v = 0;
  for (let b = 0; b < n; b++) {
    const br = bricks[b]!;
    _p.set(br.x, br.y, br.z);
    _s.set(br.sx, br.sy, br.sz);
    _e.set(br.rx ?? 0, br.ry ?? 0, br.rz ?? 0, "XYZ");
    _q.setFromEuler(_e);
    _m.compose(_p, _q, _s);
    _nm.getNormalMatrix(_m);
    const e = _m.elements;
    const ne = _nm.elements;
    const sh = 1 + (br.shade ?? 0);
    for (let f = 0; f < 6; f++) {
      const fv = FACE_POS[f]!;
      const fn = FACE_N[f]!;
      const nx = ne[0] * fn[0] + ne[3] * fn[1] + ne[6] * fn[2];
      const ny = ne[1] * fn[0] + ne[4] * fn[1] + ne[7] * fn[2];
      const nz = ne[2] * fn[0] + ne[5] * fn[1] + ne[8] * fn[2];
      const nl = Math.hypot(nx, ny, nz) || 1;
      const Nx = nx / nl;
      const Ny = ny / nl;
      const Nz = nz / nl;
      for (let k = 0; k < 4; k++) {
        const lx = fv[k * 3]!;
        const ly = fv[k * 3 + 1]!;
        const lz = fv[k * 3 + 2]!;
        pos[vi] = e[0] * lx + e[4] * ly + e[8] * lz + e[12];
        pos[vi + 1] = e[1] * lx + e[5] * ly + e[9] * lz + e[13];
        pos[vi + 2] = e[2] * lx + e[6] * ly + e[10] * lz + e[14];
        nrm[vi] = Nx;
        nrm[vi + 1] = Ny;
        nrm[vi + 2] = Nz;
        col[vi] = sh;
        col[vi + 1] = sh;
        col[vi + 2] = sh;
        vi += 3;
        uv[ui] = FACE_UV[k * 2]!;
        uv[ui + 1] = FACE_UV[k * 2 + 1]!;
        ui += 2;
      }
      idx[ii++] = v;
      idx[ii++] = v + 1;
      idx[ii++] = v + 2;
      idx[ii++] = v;
      idx[ii++] = v + 2;
      idx[ii++] = v + 3;
      v += 4;
    }
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  g.computeBoundingBox();
  return g;
}

function stamp(
  bricks: Brick[],
  x: number,
  y: number,
  z: number,
  step: number,
  i: number,
  j: number,
  k: number,
  opts: FillOpts | undefined,
  extraShade: number,
) {
  const seed = opts?.seed ?? 0;
  const jitter = opts?.jitter ?? 0.1;
  const spin = opts?.spin ?? 0.22;
  const sizeJit = opts?.sizeJit ?? 0.1;
  const a = h3(i, j, k, seed);
  const b = h3(i + 3, j - 1, k + 2, seed + 1);
  const c = h3(i - 2, j + 5, k, seed + 2);
  const sj = 1.12 + (a - 0.5) * sizeJit;
  bricks.push({
    x: x + (a - 0.5) * jitter * step,
    y: y + (b - 0.5) * jitter * step,
    z: z + (c - 0.5) * jitter * step,
    sx: step * sj,
    sy: step * (1 + (b - 0.5) * sizeJit),
    sz: step * (1 + (c - 0.5) * sizeJit),
    rx: (a - 0.5) * spin,
    ry: (b - 0.5) * spin,
    rz: (c - 0.5) * spin,
    shade: extraShade + (a - 0.5) * 0.18,
  });
}

/** Pack an ellipsoid with a shell of tiny cubes. */
export function fillEllipsoid(
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  rz: number,
  step: number,
  opts?: FillOpts,
): Brick[] {
  const bricks: Brick[] = [];
  const inner = opts?.solid || Math.max(rx, ry, rz) < step * 2.2 ? 0 : (opts?.inner ?? 0.7);
  const nx = Math.max(1, Math.ceil(rx / step));
  const ny = Math.max(1, Math.ceil(ry / step));
  const nz = Math.max(1, Math.ceil(rz / step));
  for (let j = -ny; j <= ny; j++) {
    for (let i = -nx; i <= nx; i++) {
      for (let k = -nz; k <= nz; k++) {
        const x = i * step;
        const y = j * step;
        const z = k * step;
        const u = (x / rx) * (x / rx) + (y / ry) * (y / ry) + (z / rz) * (z / rz);
        if (u > 1.06 || u < inner) continue;
        stamp(bricks, cx + x, cy + y, cz + z, step, i, j, k, opts, (y / ry) * 0.1);
      }
    }
  }
  return bricks;
}

/** Capsule along +Y, centered at (cx,cy,cz). `h` is cylinder height, `r` radius. */
export function fillCapsule(
  cx: number,
  cy: number,
  cz: number,
  r: number,
  h: number,
  step: number,
  opts?: FillOpts,
): Brick[] {
  const bricks: Brick[] = [];
  const half = h * 0.5;
  const inner = opts?.solid ? 0 : (opts?.inner ?? 0.62);
  const nx = Math.max(1, Math.ceil((r * 1.08) / step));
  const ny = Math.max(1, Math.ceil((half + r) / step));
  const r2 = r * r;
  for (let j = -ny; j <= ny; j++) {
    for (let i = -nx; i <= nx; i++) {
      for (let k = -nx; k <= nx; k++) {
        const x = i * step;
        const y = j * step;
        const z = k * step;
        let u: number;
        if (y > half) {
          const dy = y - half;
          u = (x * x + dy * dy + z * z) / r2;
        } else if (y < -half) {
          const dy = y + half;
          u = (x * x + dy * dy + z * z) / r2;
        } else {
          u = (x * x + z * z) / r2;
        }
        if (u > 1.08 || u < inner) continue;
        stamp(bricks, cx + x, cy + y, cz + z, step, i, j, k, opts, (y / (half + r)) * 0.08);
      }
    }
  }
  return bricks;
}

/** Flared skirt / tunic — radius lerps from rTop to rBot over height h, +Y up, centered. */
export function fillFlare(
  cx: number,
  cy: number,
  cz: number,
  rTop: number,
  rBot: number,
  h: number,
  step: number,
  opts?: FillOpts,
): Brick[] {
  const bricks: Brick[] = [];
  const half = h * 0.5;
  const inner = opts?.inner ?? 0.72;
  const rMax = Math.max(rTop, rBot);
  const nx = Math.max(1, Math.ceil((rMax * 1.08) / step));
  const ny = Math.max(1, Math.ceil(half / step));
  for (let j = -ny; j <= ny; j++) {
    const t = (j / ny + 1) * 0.5;
    const r = rTop + (rBot - rTop) * t;
    const r2 = r * r;
    for (let i = -nx; i <= nx; i++) {
      for (let k = -nx; k <= nx; k++) {
        const x = i * step;
        const z = k * step;
        const u = (x * x + z * z) / r2;
        if (u > 1.08 || u < inner) continue;
        const y = j * step;
        if (Math.abs(y) > half + step * 0.2) continue;
        stamp(bricks, cx + x, cy + y, cz + z, step, i, j, k, opts, (1 - t) * 0.08);
      }
    }
  }
  return bricks;
}

/** Stack of shrinking boxes along a local +Y, rotated by euler. */
export function fillSpike(
  x: number,
  y: number,
  z: number,
  rx: number,
  ry: number,
  rz: number,
  length: number,
  rBase: number,
  count: number,
  opts?: { seed?: number; shade?: number },
): Brick[] {
  const bricks: Brick[] = [];
  _e.set(rx, ry, rz, "XYZ");
  _q.setFromEuler(_e);
  _p.set(0, 1, 0).applyQuaternion(_q);
  const dirX = _p.x;
  const dirY = _p.y;
  const dirZ = _p.z;
  const n = Math.max(2, count);
  const seed = opts?.seed ?? 0;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const r = rBase * (1 - t * 0.82);
    const h = length / n;
    const a = h3(i, 2, seed, seed);
    bricks.push({
      x: x + dirX * (t * length) + (a - 0.5) * r * 0.15,
      y: y + dirY * (t * length),
      z: z + dirZ * (t * length),
      sx: r * 1.85,
      sy: h * 1.25,
      sz: r * 1.85,
      rx,
      ry,
      rz,
      shade: (opts?.shade ?? 0) + 0.1 - t * 0.22 + (a - 0.5) * 0.1,
    });
  }
  return bricks;
}

export function fillBox(
  cx: number,
  cy: number,
  cz: number,
  sx: number,
  sy: number,
  sz: number,
  step: number,
  opts?: FillOpts & { rx?: number; ry?: number; rz?: number },
): Brick[] {
  const bricks: Brick[] = [];
  const nx = Math.max(1, Math.ceil(sx / step));
  const ny = Math.max(1, Math.ceil(sy / step));
  const nz = Math.max(1, Math.ceil(sz / step));
  const inner = opts?.solid ? 0 : (opts?.inner ?? 0);
  const rx = opts?.rx ?? 0;
  const ry = opts?.ry ?? 0;
  const rz = opts?.rz ?? 0;
  const rot = rx || ry || rz;
  if (rot) {
    _e.set(rx, ry, rz, "XYZ");
    _q.setFromEuler(_e);
  }
  const hx = sx * 0.5;
  const hy = sy * 0.5;
  const hz = sz * 0.5;
  for (let j = -ny; j <= ny; j++) {
    for (let i = -nx; i <= nx; i++) {
      for (let k = -nz; k <= nz; k++) {
        const x = nx ? (i / nx) * hx : 0;
        const y = ny ? (j / ny) * hy : 0;
        const z = nz ? (k / nz) * hz : 0;
        if (inner > 0) {
          const ux = hx ? Math.abs(x) / hx : 0;
          const uy = hy ? Math.abs(y) / hy : 0;
          const uz = hz ? Math.abs(z) / hz : 0;
          if (ux < inner && uy < inner && uz < inner) continue;
        }
        let px = x;
        let py = y;
        let pz = z;
        if (rot) {
          _p.set(x, y, z).applyQuaternion(_q);
          px = _p.x;
          py = _p.y;
          pz = _p.z;
        }
        stamp(bricks, cx + px, cy + py, cz + pz, step, i, j, k, opts, (hy ? y / hy : 0) * 0.06);
        if (rot) {
          const last = bricks[bricks.length - 1]!;
          last.rx = (last.rx ?? 0) + rx;
          last.ry = (last.ry ?? 0) + ry;
          last.rz = (last.rz ?? 0) + rz;
        }
      }
    }
  }
  return bricks;
}

/** Ribbon of tiny cubes that waves to the side — hair, not spikes. */
export function fillWave(
  x: number,
  y: number,
  z: number,
  length: number,
  r: number,
  amp: number,
  freq: number,
  phase: number,
  yaw: number,
  n: number,
  opts?: { seed?: number; shade?: number; droop?: number },
): Brick[] {
  const bricks: Brick[] = [];
  const sy = Math.sin(yaw);
  const cy = Math.cos(yaw);
  const droop = opts?.droop ?? 0.32;
  const seed = opts?.seed ?? 0;
  const count = Math.max(4, n);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const a = h3(i, 4, seed, seed);
    const wave = Math.sin(t * freq * Math.PI * 2 + phase) * amp * (0.25 + t);
    const along = t * length;
    const px = x + sy * (along * 0.72 + wave) + (a - 0.5) * r * 0.2;
    const py = y + along * (0.42 - droop * t * 0.35) - t * t * length * 0.22;
    const pz = z + cy * (along * 0.72 + wave);
    const rr = r * (1 - t * 0.48);
    bricks.push({
      x: px,
      y: py,
      z: pz,
      sx: rr * 1.7,
      sy: rr * 1.25,
      sz: rr * 1.7,
      ry: yaw + wave * 1.8,
      rx: t * 0.55,
      rz: (a - 0.5) * 0.3,
      shade: (opts?.shade ?? 0) + (i % 2 ? 0.1 : -0.08) - t * 0.12,
    });
  }
  return bricks;
}

export function brick(
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  extra?: Partial<Brick>,
): Brick {
  return { x, y, z, sx, sy, sz, ...extra };
}

/** One merged mesh of packed tiny cubes. */
export function PackedMesh({
  bricks,
  color,
  kind,
  castShadow = true,
}: {
  bricks: Brick[];
  color: string;
  kind?: MatKind;
  castShadow?: boolean;
}) {
  const geo = useMemo(() => mergeBricks(bricks), [bricks]);
  useEffect(() => () => geo.dispose(), [geo]);
  if (!bricks.length) return null;
  return (
    <mesh geometry={geo} castShadow={castShadow}>
      {lamb(color, { kind, vertexColors: true, flat: true })}
    </mesh>
  );
}

const SHARED_GEO = new Map<string, THREE.BufferGeometry>();

/** Village NPCs share one BufferGeometry per body part so the meadow does not stall. */
export function SharedPackedMesh({
  geoKey,
  bricks,
  color,
  kind,
  castShadow = true,
}: {
  geoKey: string;
  bricks: Brick[];
  color: string;
  kind?: MatKind;
  castShadow?: boolean;
}) {
  const geo = useMemo(() => {
    let g = SHARED_GEO.get(geoKey);
    if (!g) {
      g = mergeBricks(bricks);
      SHARED_GEO.set(geoKey, g);
    }
    return g;
  }, [geoKey, bricks]);
  if (!bricks.length) return null;
  return (
    <mesh geometry={geo} castShadow={castShadow}>
      {lamb(color, { kind, vertexColors: true, flat: true })}
    </mesh>
  );
}
