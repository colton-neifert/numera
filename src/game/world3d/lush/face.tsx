import { useMemo } from "react";
import * as THREE from "three";
import { lamb } from "../mats";

/**
 * Storybook head + face that is actually *on* the head.
 *
 * The skull is a sculpted ellipsoid (full cranium, soft cheeks, small chin) and every feature — eyes, lids,
 * brows, blush, mouth — is a thin piece of geometry projected onto that surface, a millimetre or so proud of
 * it. Nothing floats in front of the face, so it holds up from the side and from far away.
 * Head space: centre ≈ (0, 0.8, 0.02), face looks down −Z (same convention the old primitives used).
 */

const C = new THREE.Vector3(0, 0.8, 0.02);
const R = new THREE.Vector3(0.292, 0.326, 0.278);

function sculpt(d: THREE.Vector3, out: THREE.Vector3) {
  let x = d.x;
  const y = d.y;
  let z = d.z;
  const low = Math.max(0, -y);
  // Jaw narrows to a small chin; cheeks stay full just under the eyes.
  x *= 1 - 0.36 * Math.pow(low, 1.7);
  const cheek = Math.exp(-((y + 0.36) * (y + 0.36)) / 0.05);
  x *= 1 + 0.085 * cheek * (z < 0 ? 1 : 0.4);
  // Flatter face plane, fuller back of the skull.
  if (z < 0) z *= 0.92 - 0.1 * Math.pow(low, 2);
  else z *= 1.06;
  if (y > 0) {
    x *= 1 + 0.035 * y;
    z *= 1 + 0.03 * y;
  }
  return out.set(C.x + x * R.x, C.y + y * R.y * (y < 0 ? 0.97 : 1), C.z + z * R.z);
}

let HEAD_GEO: THREE.BufferGeometry | null = null;
let HEAD_MESH: THREE.Mesh | null = null;

export function headGeo() {
  if (HEAD_GEO) return HEAD_GEO;
  const W = 44;
  const H = 30;
  const g = new THREE.SphereGeometry(1, W, H);
  const p = g.getAttribute("position");
  const v = new THREE.Vector3();
  const o = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    sculpt(v, o);
    p.setXYZ(i, o.x, o.y, o.z);
  }
  g.computeVertexNormals();
  // Close the UV seam so there is no shading crease down the side of the head.
  const n = g.getAttribute("normal");
  for (let j = 0; j <= H; j++) {
    const a = j * (W + 1);
    const b = a + W;
    const nx = n.getX(a) + n.getX(b);
    const ny = n.getY(a) + n.getY(b);
    const nz = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(nx, ny, nz) || 1;
    n.setXYZ(a, nx / l, ny / l, nz / l);
    n.setXYZ(b, nx / l, ny / l, nz / l);
  }
  g.computeBoundingSphere();
  HEAD_GEO = g;
  return g;
}

const ray = new THREE.Raycaster();
const from = new THREE.Vector3();
const dir = new THREE.Vector3(0, 0, 1);
const hitCache = new Map<number, [number, number, number, number, number, number]>();

/** Front-surface point + normal of the skull under face-plane coordinates (x, y). */
function onFace(x: number, y: number) {
  const key = Math.round(x * 2000) * 8192 + Math.round(y * 2000);
  let h = hitCache.get(key);
  if (!h) {
    if (!HEAD_MESH) {
      HEAD_MESH = new THREE.Mesh(headGeo(), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
      HEAD_MESH.updateMatrixWorld(true);
    }
    from.set(x, y, -2);
    ray.set(from, dir);
    const hit = ray.intersectObject(HEAD_MESH, false)[0];
    if (hit) {
      const nn = hit.normal ?? new THREE.Vector3(0, 0, -1);
      h = [hit.point.x, hit.point.y, hit.point.z, nn.x, nn.y, nn.z];
    } else {
      // Off the silhouette: fall back to the centre plane so stray vertices tuck in behind the edge.
      h = [x, y, C.z, 0, 0, -1];
    }
    hitCache.set(key, h);
  }
  return h;
}

/** Wrap a flat 2D mesh onto the face, `lift` metres proud of the skin. */
function wrap(pts: [number, number][], tris: number[], lift: number) {
  const pos = new Float32Array(pts.length * 3);
  const nrm = new Float32Array(pts.length * 3);
  pts.forEach(([x, y], i) => {
    const h = onFace(x, y);
    pos[i * 3] = h[0] + h[3] * lift;
    pos[i * 3 + 1] = h[1] + h[4] * lift;
    pos[i * 3 + 2] = h[2] + h[5] * lift;
    nrm[i * 3] = h[3];
    nrm[i * 3 + 1] = h[4];
    nrm[i * 3 + 2] = h[5];
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  g.setIndex(tris);
  return g;
}

const geoCache = new Map<string, THREE.BufferGeometry>();
function cached(key: string, make: () => THREE.BufferGeometry) {
  let g = geoCache.get(key);
  if (!g) {
    g = make();
    geoCache.set(key, g);
  }
  return g;
}

/** Filled ellipse, tessellated in rings so it bends with the skull. Faces −Z. */
function ellipse(cx: number, cy: number, rx: number, ry: number, rot: number, lift: number, segs = 26, rings = 3) {
  return cached(`e${cx},${cy},${rx},${ry},${rot},${lift},${segs}`, () => {
    const pts: [number, number][] = [[cx, cy]];
    const tris: number[] = [];
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    for (let r = 1; r <= rings; r++) {
      for (let k = 0; k < segs; k++) {
        const a = (k / segs) * Math.PI * 2;
        const ex = (Math.cos(a) * rx * r) / rings;
        const ey = (Math.sin(a) * ry * r) / rings;
        pts.push([cx + ex * c - ey * s, cy + ex * s + ey * c]);
      }
    }
    for (let k = 0; k < segs; k++) tris.push(0, 1 + ((k + 1) % segs), 1 + k);
    for (let r = 1; r < rings; r++) {
      const a0 = 1 + (r - 1) * segs;
      const b0 = 1 + r * segs;
      for (let k = 0; k < segs; k++) {
        const k1 = (k + 1) % segs;
        tris.push(a0 + k, a0 + k1, b0 + k, a0 + k1, b0 + k1, b0 + k);
      }
    }
    return wrap(pts, tris, lift);
  });
}

/** A stroke along a 2D polyline with a width profile (0 … 1 along its length). Faces −Z. */
function stroke(key: string, line: [number, number][], width: (u: number) => number, lift: number) {
  return cached(`s${key},${lift}`, () => {
    const pts: [number, number][] = [];
    const tris: number[] = [];
    line.forEach((p, i) => {
      const a = line[Math.max(0, i - 1)]!;
      const b = line[Math.min(line.length - 1, i + 1)]!;
      const tx = b[0] - a[0];
      const ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      const w = width(i / (line.length - 1)) / 2;
      pts.push([p[0] - (ty / tl) * w, p[1] + (tx / tl) * w], [p[0] + (ty / tl) * w, p[1] - (tx / tl) * w]);
      if (i < line.length - 1) {
        const k = i * 2;
        tris.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
      }
    });
    // Both windings: strokes are thin enough that orientation flips with the curve.
    const flip: number[] = [];
    for (let i = 0; i < tris.length; i += 3) flip.push(tris[i]!, tris[i + 2]!, tris[i + 1]!);
    return wrap(pts, tris.concat(flip), lift);
  });
}

/** Closed shape between an upper and a lower curve (open mouths). */
function lens(key: string, upper: [number, number][], lower: [number, number][], lift: number) {
  return cached(`l${key},${lift}`, () => {
    const pts: [number, number][] = [];
    const tris: number[] = [];
    const n = upper.length;
    for (let i = 0; i < n; i++) {
      const u = upper[i]!;
      const l = lower[i]!;
      const m: [number, number] = [(u[0] + l[0]) / 2, (u[1] + l[1]) / 2];
      pts.push(u, m, l);
      if (i < n - 1) {
        const k = i * 3;
        tris.push(k, k + 1, k + 3, k + 1, k + 4, k + 3, k + 1, k + 2, k + 4, k + 2, k + 5, k + 4);
        tris.push(k, k + 3, k + 1, k + 1, k + 3, k + 4, k + 1, k + 4, k + 2, k + 2, k + 4, k + 5);
      }
    }
    return wrap(pts, tris, lift);
  });
}

function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 14): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / (n - 1);
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as [number, number];
  });
}

function Ink({ geo, color, glow = 0, layer, opacity }: { geo: THREE.BufferGeometry; color: string; glow?: number; layer: number; opacity?: number }) {
  return (
    <mesh geometry={geo} renderOrder={layer}>
      <meshLambertMaterial
        color={color}
        emissive={color}
        emissiveIntensity={glow}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
        depthWrite={opacity === undefined}
        polygonOffset
        polygonOffsetFactor={-layer}
        polygonOffsetUnits={-layer * 2}
      />
    </mesh>
  );
}

const EYE_Y = 0.828;
const EYE_X = 0.108;
const MM = 0.0011;

function irisTones(hex: string) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  const rim = new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s + 0.1), Math.max(0.06, hsl.l * 0.45));
  const mid = new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 1.1 + 0.1), Math.max(0.22, Math.min(0.42, hsl.l + 0.12)));
  const low = new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 1.1 + 0.16), Math.max(0.36, Math.min(0.58, hsl.l + 0.3)));
  return { rim: `#${rim.getHexString()}`, mid: `#${mid.getHexString()}`, low: `#${low.getHexString()}` };
}

export function LushEyes({ color, wide = 1, lashes }: { color: string; wide?: number; lashes?: boolean }) {
  const tone = useMemo(() => irisTones(color), [color]);
  const rx = 0.058 * wide;
  const ry = 0.074 * wide;
  return (
    <group>
      {[-1, 1].map((sd) => {
        const cx = sd * EYE_X;
        const ix = cx - sd * 0.006;
        const iy = EYE_Y - 0.006;
        return (
          <group key={sd}>
            <Ink geo={ellipse(cx, EYE_Y, rx, ry, sd * -0.08, MM)} color="#fffdf5" glow={0.3} layer={1} />
            <Ink geo={ellipse(ix, iy, rx * 0.8, ry * 0.8, 0, MM * 2)} color={tone.rim} glow={0.05} layer={2} />
            <Ink geo={ellipse(ix, iy - 0.002, rx * 0.68, ry * 0.68, 0, MM * 3)} color={tone.mid} glow={0.22} layer={3} />
            {/* lighter lower iris: the painted "glassy" look */}
            <Ink geo={ellipse(ix, iy - ry * 0.3, rx * 0.5, ry * 0.3, 0, MM * 4, 18, 2)} color={tone.low} glow={0.3} layer={4} />
            <Ink geo={ellipse(ix, iy + 0.004, rx * 0.4, ry * 0.42, 0, MM * 5, 18, 2)} color="#120a08" layer={5} />
            <Ink geo={ellipse(ix - 0.02, iy + ry * 0.36, rx * 0.26, ry * 0.22, 0.3, MM * 6, 12, 2)} color="#ffffff" glow={0.9} layer={6} />
            <Ink geo={ellipse(ix + 0.018, iy - ry * 0.34, rx * 0.12, ry * 0.1, 0, MM * 6, 10, 1)} color="#ffffff" glow={0.9} layer={6} />
            {/* upper lash line, heavier toward the outer corner */}
            <Ink
              geo={stroke(
                `lid${sd},${wide}`,
                arc(cx, EYE_Y, rx * 1.02, ry * 1.02, sd > 0 ? Math.PI * 0.94 : Math.PI * 0.06, sd > 0 ? Math.PI * 0.1 : Math.PI * 0.9, 16),
                (u) => 0.006 + 0.012 * Math.pow(u, 1.4),
                MM * 7,
              )}
              color="#1c100b"
              layer={7}
            />
            {lashes
              ? [0.12, 0.22].map((a, i) => (
                  <Ink
                    key={i}
                    geo={stroke(
                      `lash${sd},${i},${wide}`,
                      [
                        [cx + sd * Math.cos(Math.PI * a) * rx, EYE_Y + Math.sin(Math.PI * a) * ry],
                        [cx + sd * Math.cos(Math.PI * a) * rx * 1.42, EYE_Y + Math.sin(Math.PI * a) * ry * 1.32 + 0.006],
                      ],
                      (u) => 0.011 * (1 - u * 0.8),
                      MM * 7,
                    )}
                    color="#1c100b"
                    layer={7}
                  />
                ))
              : null}
          </group>
        );
      })}
    </group>
  );
}

/** Closed eyes for blinks and sleep: a lash-dark curve where the eye was. */
export function LushLids({ wide = 1 }: { wide?: number }) {
  const rx = 0.058 * wide;
  return (
    <group>
      {[-1, 1].map((sd) => (
        <Ink
          key={sd}
          geo={stroke(`shut${sd},${wide}`, arc(sd * EYE_X, EYE_Y + 0.012, rx, 0.03, Math.PI * 1.08, Math.PI * 1.92, 14), (u) => 0.007 + 0.006 * Math.sin(u * Math.PI), MM * 3)}
          color="#1c100b"
          layer={3}
        />
      ))}
    </group>
  );
}

export function LushBrows({ kind, girl, color = "#3a2416" }: { kind: string; girl?: boolean; color?: string }) {
  if (kind === "none") return null;
  const tilt = (sd: number) => {
    if (kind === "mad") return sd * -0.42;
    if (kind === "sad" || kind === "worried") return sd * 0.36;
    if (kind === "raised") return sd * 0.1;
    return sd * (girl ? 0.14 : -0.06);
  };
  const lift = kind === "raised" ? 0.014 : kind === "mad" ? -0.012 : 0;
  return (
    <group>
      {[-1, 1].map((sd) => {
        const t = tilt(sd);
        const cx = sd * (EYE_X + 0.004);
        const cy = EYE_Y + 0.112 + lift;
        const line = Array.from({ length: 9 }, (_, i) => {
          const u = i / 8 - 0.5;
          const x = u * 0.105;
          const y = -u * u * 0.09;
          return [cx + x * Math.cos(t) - y * Math.sin(t), cy + x * Math.sin(t) + y * Math.cos(t)] as [number, number];
        });
        return <Ink key={sd} geo={stroke(`brow${sd},${kind},${girl ? 1 : 0}`, line, (u) => (girl ? 0.011 : 0.017) * (0.55 + 0.45 * Math.sin(u * Math.PI)), MM * 2)} color={color} layer={2} />;
      })}
    </group>
  );
}

const MOUTH_Y = 0.648;

export function LushMouth({ kind }: { kind: string }) {
  if (kind === "none") return null;
  const dark = "#5a1c1c";
  if (kind === "o") {
    return (
      <group>
        <Ink geo={ellipse(0, MOUTH_Y - 0.004, 0.026, 0.032, 0, MM * 2, 18, 2)} color={dark} layer={2} />
        <Ink geo={ellipse(0, MOUTH_Y - 0.018, 0.016, 0.012, 0, MM * 3, 12, 1)} color="#c9605c" layer={3} />
      </group>
    );
  }
  if (kind === "grin") {
    const n = 13;
    const upper = Array.from({ length: n }, (_, i) => {
      const u = i / (n - 1) - 0.5;
      return [u * 0.13, MOUTH_Y + 0.012 - u * u * 0.02] as [number, number];
    });
    const lower = Array.from({ length: n }, (_, i) => {
      const u = i / (n - 1) - 0.5;
      return [u * 0.13, MOUTH_Y + 0.012 - (0.25 - u * u) * 0.2] as [number, number];
    });
    const teeth = lower.map((l, i) => [l[0], Math.max(l[1], upper[i]![1] - 0.014)] as [number, number]);
    return (
      <group>
        <Ink geo={lens("grin", upper, lower, MM * 2)} color={dark} layer={2} />
        <Ink geo={lens("teeth", upper, teeth, MM * 3)} color="#fdf8ee" glow={0.2} layer={3} />
      </group>
    );
  }
  let line: [number, number][];
  if (kind === "line") line = [[-0.04, MOUTH_Y], [-0.013, MOUTH_Y], [0.013, MOUTH_Y], [0.04, MOUTH_Y]];
  else if (kind === "frown") line = Array.from({ length: 11 }, (_, i) => [(i / 10 - 0.5) * 0.1, MOUTH_Y - 0.018 + (0.25 - (i / 10 - 0.5) ** 2) * 0.1] as [number, number]);
  else if (kind === "cat" || kind === "bolt")
    line = Array.from({ length: 17 }, (_, i) => {
      const u = i / 16 - 0.5;
      return [u * 0.11, MOUTH_Y - 0.004 - Math.abs(Math.sin(u * Math.PI * 2)) * 0.016 + Math.abs(u) * 0.03] as [number, number];
    });
  else line = Array.from({ length: 13 }, (_, i) => [(i / 12 - 0.5) * 0.118, MOUTH_Y - 0.02 + ((i / 12 - 0.5) ** 2) * 0.13] as [number, number]);
  return <Ink geo={stroke(`mouth${kind}`, line, (u) => 0.0075 + 0.0075 * Math.sin(u * Math.PI), MM * 2)} color={dark} layer={2} />;
}

export function LushBlush({ color, amount }: { color: string; amount: number }) {
  return (
    <group>
      {[-1, 1].map((sd) => (
        <Ink key={sd} geo={ellipse(sd * 0.168, 0.716, 0.05, 0.032, sd * 0.2, MM, 18, 2)} color={color} layer={1} opacity={Math.min(0.6, amount * 0.55)} />
      ))}
    </group>
  );
}

function tone(hex: string, amt: number) {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color(amt >= 0 ? "#ffffff" : "#5a2a1a"), Math.abs(amt));
  return `#${c.getHexString()}`;
}

/** Skull, small rounded ears and a button nose that grows out of the face rather than hovering on it. */
export function LushSkull({ skin, nose = "round" }: { skin: string; nose?: string }) {
  const tip = useMemo(() => onFace(0, 0.728), []);
  return (
    <group>
      <mesh geometry={headGeo()} castShadow receiveShadow>
        {lamb(skin, { kind: "skin", rim: true })}
      </mesh>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[sd * 0.272, 0.79, 0.05]} rotation={[0, sd * -0.35, sd * -0.12]}>
          <mesh scale={[0.4, 1, 0.72]} castShadow>
            <sphereGeometry args={[0.068, 14, 12]} />
            {lamb(skin, { kind: "skin", rim: true })}
          </mesh>
          <mesh position={[sd * 0.016, -0.004, -0.012]} scale={[0.22, 0.62, 0.42]}>
            <sphereGeometry args={[0.068, 10, 8]} />
            {lamb(tone(skin, -0.16), { kind: "skin" })}
          </mesh>
        </group>
      ))}
      <mesh
        position={[tip[0], tip[1], tip[2] - 0.004]}
        scale={nose === "pointy" ? [0.8, 0.8, 1.5] : nose === "line" ? [0.5, 1.1, 0.9] : [1, 0.82, 1]}
        castShadow
      >
        <sphereGeometry args={[nose === "line" ? 0.016 : 0.024, 14, 10]} />
        {lamb(tone(skin, -0.05), { kind: "skin", rim: true })}
      </mesh>
    </group>
  );
}
