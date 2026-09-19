import * as THREE from "three";
import { lamb, type MatKind } from "./mats";

/** Module-level geometry cache — one BufferGeometry per shape, many meshes. */
const CACHE = new Map<string, THREE.BufferGeometry>();

export function cachedGeo(key: string, make: () => THREE.BufferGeometry) {
  let g = CACHE.get(key);
  if (!g) {
    g = make();
    g.computeVertexNormals();
    CACHE.set(key, g);
  }
  return g;
}

export const S16 = cachedGeo("s16", () => new THREE.SphereGeometry(1, 8, 6));
export const S12 = cachedGeo("s12", () => new THREE.SphereGeometry(1, 7, 5));
export const S8 = cachedGeo("s8", () => new THREE.SphereGeometry(1, 6, 4));
export const ICO0 = cachedGeo("ico0", () => new THREE.IcosahedronGeometry(1, 0));
export const ICO1 = cachedGeo("ico1", () => new THREE.IcosahedronGeometry(1, 1));
export const OCT = cachedGeo("oct", () => new THREE.OctahedronGeometry(1, 0));
export const BOX = cachedGeo("unit-box", () => new THREE.BoxGeometry(1, 1, 1));

type V3 = [number, number, number];

export function Form({
  g,
  color,
  kind = "default",
  p,
  r,
  s,
  cast = true,
}: {
  g: THREE.BufferGeometry;
  color: string;
  kind?: MatKind;
  p?: V3;
  r?: V3;
  s?: V3 | number;
  cast?: boolean;
}) {
  return (
    <mesh geometry={g} position={p} rotation={r} scale={s} castShadow={cast} receiveShadow>
      {lamb(color, { kind })}
    </mesh>
  );
}

export function Ellipsoid({
  p,
  rad,
  segs = 16,
  color,
  kind,
  rot,
}: {
  p?: V3;
  rad: V3;
  segs?: 16 | 12 | 8;
  color: string;
  kind?: MatKind;
  rot?: V3;
}) {
  const g = segs >= 16 ? S16 : segs >= 12 ? S12 : S8;
  return <Form g={g} s={rad} p={p} r={rot} color={color} kind={kind} />;
}

export function Cap({
  p,
  radius,
  length,
  color,
  kind,
  segs = 6,
  rot,
}: {
  p?: V3;
  radius: number;
  length: number;
  color: string;
  kind?: MatKind;
  segs?: number;
  rot?: V3;
}) {
  const g = cachedGeo(
    `cap:${radius.toFixed(3)}:${length.toFixed(3)}:${segs}`,
    () => new THREE.CapsuleGeometry(radius, length, 3, segs),
  );
  return <Form g={g} p={p} r={rot} color={color} kind={kind} />;
}

export function Lathe({
  id,
  profile,
  segs = 8,
  color,
  kind,
  p,
  rot,
}: {
  id: string;
  profile: [number, number][];
  segs?: number;
  color: string;
  kind?: MatKind;
  p?: V3;
  rot?: V3;
}) {
  const g = cachedGeo(
    `lathe:${id}`,
    () => new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), segs),
  );
  return <Form g={g} p={p} r={rot} color={color} kind={kind} />;
}

export function Strand({
  id,
  pts,
  radius,
  color,
  tubular = 6,
  radial = 5,
}: {
  id: string;
  pts: V3[];
  radius: number;
  color: string;
  tubular?: number;
  radial?: number;
}) {
  const g = cachedGeo(`tube:${id}`, () => {
    const c = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(q[0], q[1], q[2])));
    return new THREE.TubeGeometry(c, tubular, radius, radial, false);
  });
  return <Form g={g} color={color} kind="hair" />;
}

export function Disc({
  id,
  r,
  tube,
  color,
  kind,
  p,
  rot,
  radial = 10,
}: {
  id: string;
  r: number;
  tube: number;
  color: string;
  kind?: MatKind;
  p?: V3;
  rot?: V3;
  radial?: number;
}) {
  const g = cachedGeo(
    `torus:${id}`,
    () => new THREE.TorusGeometry(r, tube, 6, radial),
  );
  return <Form g={g} p={p} r={rot} color={color} kind={kind} />;
}

export function Cyl({
  id,
  rTop,
  rBot,
  h,
  segs = 8,
  color,
  kind,
  p,
  rot,
}: {
  id: string;
  rTop: number;
  rBot: number;
  h: number;
  segs?: number;
  color: string;
  kind?: MatKind;
  p?: V3;
  rot?: V3;
}) {
  const g = cachedGeo(
    `cyl:${id}`,
    () => new THREE.CylinderGeometry(rTop, rBot, h, segs),
  );
  return <Form g={g} p={p} r={rot} color={color} kind={kind} />;
}

export function Cone({
  id,
  r,
  h,
  segs = 6,
  color,
  kind,
  p,
  rot,
}: {
  id: string;
  r: number;
  h: number;
  segs?: number;
  color: string;
  kind?: MatKind;
  p?: V3;
  rot?: V3;
}) {
  const g = cachedGeo(`cone:${id}`, () => new THREE.ConeGeometry(r, h, segs));
  return <Form g={g} p={p} r={rot} color={color} kind={kind} />;
}
