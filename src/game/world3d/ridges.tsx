import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { lamb, ootFieldTex } from "./mats";
import { useGame } from "../store";
import { sfx } from "../audio";
import {
  OPENINGS,
  RIDGE_C,
  RIDGE_RX,
  RIDGE_RZ,
  RIDGE_THICK,
  RIDGE_CREST,
  angDiff,
  ellipseR,
  ridgeAngle,
  ridgeDist,
  type Opening,
} from "./ridgeData";

function yawOut(a: number) {
  return Math.PI / 2 - a;
}

function cliffGeo() {
  const pos: number[] = [];
  const col: number[] = [];
  const uv: number[] = [];
  const rock = new THREE.Color("#c4a078");
  const earth = new THREE.Color("#c47a42");
  const grass = new THREE.Color("#4ea034");
  const push = (x: number, y: number, z: number, c: THREE.Color) => {
    pos.push(x, y, z);
    col.push(c.r, c.g, c.b);
    uv.push(x + 0.5, y);
  };
  const tri = (a: [number, number, number], b: [number, number, number], c: [number, number, number], color: THREE.Color) => {
    push(a[0], a[1], a[2], color);
    push(b[0], b[1], b[2], color);
    push(c[0], c[1], c[2], color);
  };
  const quad = (
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
    d: [number, number, number],
    color: THREE.Color,
  ) => {
    tri(a, b, c, color);
    tri(a, c, d, color);
  };
  const y0 = 0;
  const y1 = 0.72;
  const y2 = 1;
  quad([-0.5, y0, 0.42], [0.5, y0, 0.42], [0.5, y1, 0.28], [-0.5, y1, 0.28], earth);
  quad([-0.5, y1, 0.28], [0.5, y1, 0.28], [0.5, y2, 0.16], [-0.5, y2, 0.16], rock);
  quad([-0.5, y0, -0.42], [-0.5, y2, -0.16], [0.5, y2, -0.16], [0.5, y0, -0.42], earth);
  quad([-0.5, y2, -0.16], [0.5, y2, -0.16], [0.5, y2, 0.16], [-0.5, y2, 0.16], grass);
  quad([-0.5, y0, -0.42], [-0.5, y0, 0.42], [-0.5, y2, 0.16], [-0.5, y2, -0.16], rock);
  quad([0.5, y0, 0.42], [0.5, y0, -0.42], [0.5, y2, -0.16], [0.5, y2, 0.16], rock);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

function RidgeRocks() {
  const rock = useRef<THREE.InstancedMesh>(null);
  const moss = useRef<THREE.InstancedMesh>(null);
  const pieces = useMemo(() => {
    const out: { x: number; y: number; z: number; yaw: number; sx: number; sy: number; sz: number }[] = [];
    const bands = [{ rx: RIDGE_RX, rz: RIDGE_RZ, thick: RIDGE_THICK, openings: OPENINGS, crest: RIDGE_CREST }];
    for (const band of bands) {
      const step = 0.028;
      for (let a = -Math.PI; a < Math.PI; a += step) {
        const skip = band.openings.some((o) => Math.abs(angDiff(a, o.a)) < (o.kind === "climb" ? o.half : o.half + 0.01));
        if (skip) continue;
        const rad = ellipseR(a, band.rx, band.rz);
        const x = RIDGE_C.x + Math.cos(a) * rad;
        const z = RIDGE_C.z + Math.sin(a) * rad;
        const base = heightAt(x, z);
        out.push({
          x,
          y: base,
          z,
          yaw: yawOut(a),
          sx: rad * step * 1.45,
          sy: 16,
          sz: band.thick * 1.7,
        });
      }
    }
    return out;
  }, []);
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    pieces.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, p.yaw, 0);
      dummy.scale.set(p.sx, p.sy, p.sz);
      dummy.updateMatrix();
      rock.current?.setMatrixAt(i, dummy.matrix);
      const tuft = i % 6 === 0;
      dummy.position.y = p.y + p.sy;
      dummy.scale.set(tuft ? 1.5 : 0.001, tuft ? 1.8 : 0.001, tuft ? 1.5 : 0.001);
      dummy.updateMatrix();
      moss.current?.setMatrixAt(i, dummy.matrix);
    });
    if (rock.current) rock.current.instanceMatrix.needsUpdate = true;
    if (moss.current) moss.current.instanceMatrix.needsUpdate = true;
  }, [pieces]);
  const geo = useMemo(() => cliffGeo(), []);
  const tuft = useMemo(() => new THREE.ConeGeometry(0.4, 1.2, 5), []);
  const tex = useMemo(() => ootFieldTex(), []);
  return (
    <group>
      <instancedMesh ref={rock} args={[geo, undefined, pieces.length]} frustumCulled={false} receiveShadow>
        <meshLambertMaterial vertexColors flatShading map={tex ?? undefined} />
      </instancedMesh>
      <instancedMesh ref={moss} args={[tuft, undefined, pieces.length]} frustumCulled={false}>
        {lamb("#7d9a48", { kind: "grass", flat: true })}
      </instancedMesh>
    </group>
  );
}

function Arch({ o, r, thick = RIDGE_THICK }: { o: Opening; r: number; thick?: number }) {
  if (o.kind === "climb") return null;
  const x = RIDGE_C.x + Math.cos(o.a) * r;
  const z = RIDGE_C.z + Math.sin(o.a) * r;
  const y = heightAt(x, z);
  const crest = r > 300 ? OUTER_CREST : RIDGE_CREST;
  const open = Math.max(8, r * (o.half - 0.016) * 2 * 0.9);
  const depth = thick * 2.05;
  const h = o.kind === "cave" ? 6.2 : o.kind === "river" ? 7.2 : 8.4;
  const stone = o.kind === "brick" ? "#b9a48a" : o.kind === "hollow" ? "#6a5344" : "#8d7b68";
  const pier = open * 0.5 + 2.4;
  const capH = Math.max(8, crest - y - h);
  return (
    <group position={[x, y, z]} rotation={[0, yawOut(o.a), 0]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * pier, h * 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.2, h * 1.1, depth]} />
          {lamb(stone, { kind: "stone", flat: true })}
        </mesh>
      ))}
      <mesh position={[0, h + capH * 0.5, 0]} castShadow>
        <boxGeometry args={[open + 10, capH, depth]} />
        {lamb("#c47a42", { kind: "dirt", flat: true })}
      </mesh>
      <mesh position={[0, h + capH - 0.4, 0]}>
        <boxGeometry args={[open + 8, 1.1, depth + 0.6]} />
        {lamb("#4ea034", { kind: "grass", flat: true })}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`glen${s}`} position={[s * (open * 0.5 + 1.6), 11, depth * 0.35 + 11]} castShadow>
          <boxGeometry args={[3.2, 22, 22]} />
          {lamb("#c4a078", { kind: "dirt", flat: true })}
        </mesh>
      ))}
      <mesh position={[0, 11, depth * 0.35 + 21]} castShadow>
        <boxGeometry args={[open + 6, 22, 3.2]} />
        {lamb("#b08860", { kind: "dirt", flat: true })}
      </mesh>
      {o.kind === "brick"
        ? [0.3, 0.55, 0.8].map((t) => (
            <mesh key={t} position={[0, h * t, depth * 0.48]}>
              <boxGeometry args={[open + 1.2, 0.22, 0.25]} />
              {lamb("#d8c4a0")}
            </mesh>
          ))
        : null}
      {o.kind === "hollow" ? (
        <mesh position={[0, 2.4, 0]}>
          <boxGeometry args={[open * 0.7, 0.35, depth * 0.7]} />
          {lamb("#6a5340", { kind: "wood", flat: true })}
        </mesh>
      ) : null}
      {o.kind === "river" ? (
        <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[open - 1, depth]} />
          {lamb("#3d8ea8", { kind: "water" })}
        </mesh>
      ) : null}
    </group>
  );
}

function Beyond({ o, r, thick = RIDGE_THICK }: { o: Opening; r: number; thick?: number }) {
  if (o.kind === "climb" || o.kind === "cave") return null;
  const dist = r + thick + 16;
  const x = RIDGE_C.x + Math.cos(o.a) * dist;
  const z = RIDGE_C.z + Math.sin(o.a) * dist;
  const y = heightAt(x, z);
  if (o.kind !== "river") {
    return (
      <mesh position={[x, y + 2.2, z]} castShadow>
        <coneGeometry args={[1.4, 4.4, 6]} />
        {lamb("#2f6a34", { kind: "leaf", flat: true })}
      </mesh>
    );
  }
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, o.a]}>
        <planeGeometry args={[7, 16]} />
        {lamb("#3d8ea8", { kind: "water" })}
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[1.6, 0.2, 7]} />
        {lamb("#6a5340", { kind: "wood", flat: true })}
      </mesh>
    </group>
  );
}

const BACKDROP = [
  { a: 0.4, d: 690, h: 96 },
  { a: 1.1, d: 740, h: 120 },
  { a: 1.8, d: 710, h: 88 },
  { a: 2.5, d: 760, h: 110 },
  { a: 3.3, d: 700, h: 92 },
  { a: 4.2, d: 750, h: 104 },
  { a: 5.2, d: 720, h: 86 },
  { a: 5.9, d: 780, h: 118 },
];

export function Ridges() {
  const was = useRef(ridgeDist(0, -108));
  const got = useRef(false);
  useFrame(() => {
    const d = ridgeDist(live.x, live.z);
    const a = ridgeAngle(live.x, live.z);
    const bands = [{ rx: RIDGE_RX, rz: RIDGE_RZ, thick: RIDGE_THICK, list: OPENINGS }];
    for (const b of bands) {
      const rad = ellipseR(a, b.rx, b.rz);
      if (was.current < rad && d > rad + b.thick - 1) {
        const o = b.list.find((n) => Math.abs(angDiff(a, n.a)) < n.half);
        if (o) {
          live.banner = o.name;
          live.objective = "The cliff was the wall. This is the other side.";
        }
      }
    }
    was.current = d;
    const north = OPENINGS[0]!;
    const northR = ellipseR(north.a, RIDGE_RX, RIDGE_RZ);
    const open = Math.max(8, northR * (north.half - 0.016) * 2 * 0.9);
    const depth = RIDGE_THICK * 2.05;
    const yaw = Math.PI / 2 - north.a;
    const lx = open * 0.32;
    const lz = -depth * 0.15;
    const bx = RIDGE_C.x + Math.cos(north.a) * northR;
    const bz = RIDGE_C.z + Math.sin(north.a) * northR;
    const ax = bx + lx * Math.cos(yaw) + lz * Math.sin(yaw);
    const az = bz - lx * Math.sin(yaw) + lz * Math.cos(yaw);
    if (!got.current && !useGame.getState().quests?.passGold && Math.hypot(live.x - ax, live.z - az) < 1.6) {
      got.current = true;
      useGame.getState().setQuest("passGold", 1);
      useGame.getState().addCoins(12);
      live.banner = "A cache in the side of the pass.";
      sfx.chime();
    }
  });
  return (
    <group>
      <RidgeRocks />
      {OPENINGS.map((o) => (
        <Arch key={o.id} o={o} r={ellipseR(o.a, RIDGE_RX, RIDGE_RZ)} />
      ))}
      {OPENINGS.map((o) => (
        <Beyond key={`b${o.id}`} o={o} r={ellipseR(o.a, RIDGE_RX, RIDGE_RZ)} />
      ))}
      {BACKDROP.map((p) => (
        <mesh key={p.a} position={[Math.cos(p.a) * p.d, p.h * 0.35, Math.sin(p.a) * p.d]}>
          <coneGeometry args={[46, p.h, 5]} />
          <meshLambertMaterial color="#d2b07a" flatShading />
        </mesh>
      ))}
    </group>
  );
}
