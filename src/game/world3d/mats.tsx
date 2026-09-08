import * as THREE from "three";

export type MatKind =
  | "skin"
  | "eye"
  | "hair"
  | "cloth"
  | "leather"
  | "metal"
  | "wood"
  | "bark"
  | "leaf"
  | "grass"
  | "flower"
  | "dirt"
  | "stone"
  | "plaster"
  | "shingle"
  | "scale"
  | "wool"
  | "water"
  | "mountain"
  | "default";

type KindTune = {
  roughness: number;
  metalness: number;
  env: number;
  emit?: number;
  sheen?: number;
};

const TUNE: Record<MatKind, KindTune> = {
  skin: { roughness: 0.68, metalness: 0, env: 0.18 },
  eye: { roughness: 0.16, metalness: 0.12, env: 0.55 },
  hair: { roughness: 0.46, metalness: 0.02, env: 0.28 },
  cloth: { roughness: 0.88, metalness: 0, env: 0.12 },
  leather: { roughness: 0.5, metalness: 0.05, env: 0.22 },
  metal: { roughness: 0.26, metalness: 0.78, env: 0.85 },
  wood: { roughness: 0.72, metalness: 0.02, env: 0.2 },
  bark: { roughness: 0.94, metalness: 0, env: 0.08 },
  leaf: { roughness: 0.48, metalness: 0, env: 0.28, emit: 0.08 },
  grass: { roughness: 0.78, metalness: 0, env: 0.14, emit: 0.03 },
  flower: { roughness: 0.55, metalness: 0, env: 0.2 },
  dirt: { roughness: 0.95, metalness: 0, env: 0.06 },
  stone: { roughness: 0.9, metalness: 0.04, env: 0.12 },
  plaster: { roughness: 0.84, metalness: 0, env: 0.14 },
  shingle: { roughness: 0.78, metalness: 0.08, env: 0.16 },
  scale: { roughness: 0.42, metalness: 0.12, env: 0.35 },
  wool: { roughness: 0.96, metalness: 0, env: 0.08 },
  water: { roughness: 0.12, metalness: 0.22, env: 0.9 },
  mountain: { roughness: 0.88, metalness: 0, env: 0.2 },
  default: { roughness: 0.78, metalness: 0, env: 0.14 },
};

let noise: THREE.Texture | null = null;
let grain: THREE.Texture | null = null;
let streak: THREE.Texture | null = null;
let wool: THREE.Texture | null = null;
let nrmSoft: THREE.Texture | null = null;
let nrmRough: THREE.Texture | null = null;
let envCube: THREE.CubeTexture | null = null;

function hash(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function makeNoise(size: number, scale: number, seed: number, contrast = 1) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      let amp = 1;
      let freq = scale;
      let tot = 0;
      for (let o = 0; o < 4; o++) {
        const nx = Math.floor((x * freq) / size);
        const ny = Math.floor((y * freq) / size);
        const fx = ((x * freq) / size) % 1;
        const fy = ((y * freq) / size) % 1;
        const i00 = hash(nx * 13 + ny * 47 + seed + o * 19);
        const i10 = hash((nx + 1) * 13 + ny * 47 + seed + o * 19);
        const i01 = hash(nx * 13 + (ny + 1) * 47 + seed + o * 19);
        const i11 = hash((nx + 1) * 13 + (ny + 1) * 47 + seed + o * 19);
        const ux = fx * fx * (3 - 2 * fx);
        const uy = fy * fy * (3 - 2 * fy);
        const a = i00 + (i10 - i00) * ux;
        const b = i01 + (i11 - i01) * ux;
        v += (a + (b - a) * uy) * amp;
        tot += amp;
        amp *= 0.5;
        freq *= 2;
      }
      v = (v / tot - 0.5) * contrast + 0.5;
      v = Math.max(0, Math.min(1, v));
      const n = Math.round(v * 255);
      const i = (y * size + x) * 4;
      d[i] = n;
      d[i + 1] = n;
      d[i + 2] = n;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function makeStreak(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = 0.42 + hash(Math.floor(x * 0.35) * 17 + Math.floor(y * 3.2) * 9) * 0.35 + hash(x * 0.08 + y * 2.4) * 0.2;
      const n = Math.round(Math.max(0, Math.min(1, v)) * 255);
      const i = (y * size + x) * 4;
      d[i] = n;
      d[i + 1] = n;
      d[i + 2] = n;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function makeWool(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#c8c0b4";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 90; i++) {
    const x = hash(i * 3.1) * size;
    const y = hash(i * 7.7) * size;
    const r = 6 + hash(i * 11) * 14;
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, "rgba(250,246,238,0.85)");
    g.addColorStop(1, "rgba(180,168,150,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

function canvasToTex(c: HTMLCanvasElement, repeat = 2, srgb = false) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

function heightToNormal(src: HTMLCanvasElement, strength = 2.4) {
  const size = src.width;
  const ctx = src.getContext("2d")!;
  const srcData = ctx.getImageData(0, 0, size, size).data;
  const out = document.createElement("canvas");
  out.width = out.height = size;
  const octx = out.getContext("2d")!;
  const img = octx.createImageData(size, size);
  const d = img.data;
  const at = (x: number, y: number) => {
    const i = (((y + size) % size) * size + ((x + size) % size)) * 4;
    return srcData[i]! / 255;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      let nx = -dx;
      let ny = -dy;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * size + x) * 4;
      d[i] = Math.round((nx * 0.5 + 0.5) * 255);
      d[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      d[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      d[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return canvasToTex(out, 2, false);
}

function ensureMaps() {
  if (typeof document === "undefined") return;
  if (noise) return;
  const n = makeNoise(128, 6, 4, 1.15);
  const g = makeNoise(128, 18, 9, 0.7);
  const s = makeStreak(128);
  noise = canvasToTex(n, 3);
  grain = canvasToTex(g, 4);
  streak = canvasToTex(s, 2);
  wool = canvasToTex(makeWool(128), 2, true);
  nrmSoft = heightToNormal(g, 1.3);
  nrmRough = heightToNormal(n, 3.2);
}

function mapsFor(kind: MatKind): {
  map?: THREE.Texture | null;
  roughnessMap?: THREE.Texture | null;
  normalMap?: THREE.Texture | null;
  aoMap?: THREE.Texture | null;
  normalScale?: THREE.Vector2;
} {
  ensureMaps();
  switch (kind) {
    case "skin":
      return { roughnessMap: grain, normalMap: nrmSoft, normalScale: new THREE.Vector2(0.18, 0.18) };
    case "hair":
      return { roughnessMap: streak, normalMap: nrmSoft, normalScale: new THREE.Vector2(0.35, 0.55) };
    case "cloth":
      return { roughnessMap: grain, normalMap: nrmSoft, normalScale: new THREE.Vector2(0.22, 0.22) };
    case "leather":
      return { roughnessMap: noise, normalMap: nrmSoft, normalScale: new THREE.Vector2(0.4, 0.4) };
    case "wood":
    case "bark":
      return { roughnessMap: streak, normalMap: nrmRough, aoMap: streak, normalScale: new THREE.Vector2(0.7, 0.85) };
    case "leaf":
    case "grass":
      return { roughnessMap: grain, normalMap: nrmSoft, normalScale: new THREE.Vector2(0.35, 0.35) };
    case "stone":
    case "mountain":
    case "dirt":
      return { roughnessMap: noise, normalMap: nrmRough, aoMap: noise, normalScale: new THREE.Vector2(0.65, 0.65) };
    case "plaster":
      return { roughnessMap: grain, normalMap: nrmSoft, normalScale: new THREE.Vector2(0.28, 0.28) };
    case "shingle":
      return { roughnessMap: noise, normalMap: nrmRough, normalScale: new THREE.Vector2(0.45, 0.45) };
    case "scale":
      return { roughnessMap: noise, normalMap: nrmSoft, normalScale: new THREE.Vector2(0.55, 0.4) };
    case "wool":
      return { map: wool, roughnessMap: noise, normalMap: nrmRough, normalScale: new THREE.Vector2(0.9, 0.9) };
    case "water":
      return { roughnessMap: grain, normalMap: nrmSoft, normalScale: new THREE.Vector2(0.2, 0.2) };
    case "metal":
      return { roughnessMap: grain, normalMap: nrmSoft, normalScale: new THREE.Vector2(0.12, 0.12) };
    case "eye":
      return {};
    default:
      return { roughnessMap: grain, normalMap: nrmSoft, normalScale: new THREE.Vector2(0.2, 0.2) };
  }
}

export function getStoryEnv() {
  if (envCube) return envCube;
  if (typeof document === "undefined") return null;
  const mk = (top: string, bot: string) => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d")!;
    const grd = g.createLinearGradient(0, 0, 0, 32);
    grd.addColorStop(0, top);
    grd.addColorStop(0.55, "#e8c090");
    grd.addColorStop(1, bot);
    g.fillStyle = grd;
    g.fillRect(0, 0, 32, 32);
    return c;
  };
  const cube = new THREE.CubeTexture();
  cube.images = [
    mk("#f4d8a8", "#8a6a40"),
    mk("#f0d0a0", "#7a5a38"),
    mk("#fff0d0", "#f0d4a0"),
    mk("#6a5a38", "#4a3a28"),
    mk("#f2d4a4", "#84643c"),
    mk("#efd0a0", "#7e5e3a"),
  ];
  cube.colorSpace = THREE.SRGBColorSpace;
  cube.needsUpdate = true;
  envCube = cube;
  return cube;
}

export function lamb(
  color: string,
  opts?: {
    kind?: MatKind;
    emissive?: string;
    emit?: number;
    map?: THREE.Texture | null;
    transparent?: boolean;
    opacity?: number;
    side?: THREE.Side;
    vertexColors?: boolean;
    flat?: boolean;
  },
) {
  const kind = opts?.kind ?? "default";
  const t = TUNE[kind];
  const maps = mapsFor(kind);
  const emitCol = opts?.emissive ?? (t.emit ? color : "#000000");
  const emitAmt = opts?.emit ?? t.emit ?? 0;
  return (
    <meshStandardMaterial
      color={color}
      map={opts?.map ?? maps.map ?? null}
      roughness={t.roughness}
      metalness={t.metalness}
      roughnessMap={maps.roughnessMap ?? null}
      normalMap={maps.normalMap ?? null}
      normalScale={maps.normalScale ?? new THREE.Vector2(0.25, 0.25)}
      aoMap={maps.aoMap ?? null}
      aoMapIntensity={maps.aoMap ? 0.35 : 0}
      envMapIntensity={t.env}
      emissive={emitCol}
      emissiveIntensity={emitAmt}
      transparent={opts?.transparent ?? kind === "water"}
      opacity={opts?.opacity ?? (kind === "water" ? 0.78 : 1)}
      side={opts?.side ?? (kind === "leaf" ? THREE.DoubleSide : THREE.FrontSide)}
      vertexColors={opts?.vertexColors ?? false}
      flatShading={opts?.flat ?? false}
      depthWrite={opts?.transparent ? false : kind !== "water"}
    />
  );
}

export function GroundBlob({ radius = 0.42, opacity = 0.3, y = 0.03 }: { radius?: number; opacity?: number; y?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} renderOrder={-1}>
      <circleGeometry args={[radius, 14]} />
      <meshBasicMaterial color="#1a140c" transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}
