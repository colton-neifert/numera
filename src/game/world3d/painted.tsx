import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { LOGS, ROCKS, SHROOMS, TREES, heightAt, pondU } from "./field";
import { live } from "./live";

const _look = new THREE.Vector3();

function prep(tex: THREE.Texture, repeat = 1) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeat > 1) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  }
  return tex;
}

if (typeof document !== "undefined") {
  useTexture.preload("/game/world/grass.jpg");
  useTexture.preload("/game/world/tree.png");
  useTexture.preload("/game/world/rock.png");
  useTexture.preload("/game/world/log.png");
  useTexture.preload("/game/world/shroom.png");
  useTexture.preload("/game/world/cartoon-boy-front.png");
  useTexture.preload("/game/world/cartoon-boy-back.png");
  useTexture.preload("/game/world/cartoon-girl-front.png");
  useTexture.preload("/game/world/cartoon-girl-back.png");
  useTexture.preload("/game/world/cartoon-boy-walk-front.png");
  useTexture.preload("/game/world/cartoon-boy-walk-back.png");
  useTexture.preload("/game/world/cartoon-girl-walk-front.png");
  useTexture.preload("/game/world/cartoon-girl-walk-back.png");
  useTexture.preload("/game/world/cartoon-boy-side.png");
  useTexture.preload("/game/world/plusling.png");
  useTexture.preload("/game/world/timesprout.png");
  useTexture.preload("/game/world/glyphite.png");
  useTexture.preload("/game/world/remainder.png");
}

export function GrassTerrain({ grass = "#6a9a48", snow = false, segs = 72 }: { grass?: string; snow?: boolean; segs?: number }) {
  const tex = prep(useTexture("/game/world/grass.jpg"), 220);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(54000, 54000, segs, segs);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color(snow ? "#eef4f8" : grass);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      let y = heightAt(x, z);
      pos.setY(i, y);
      const pu = pondU(x, z);
      let r = c.r;
      let gv = c.g;
      let b = c.b;
      if (snow) {
        r = 0.9;
        gv = 0.93;
        b = 0.96;
      }
      if (pu > 0.08) {
        const w = Math.min(1, pu * 1.35);
        r = r * (1 - w) + (snow ? 0.72 : 0.22) * w;
        gv = gv * (1 - w) + (snow ? 0.82 : 0.42) * w;
        b = b * (1 - w) + (snow ? 0.9 : 0.22) * w;
      } else if (!snow) {
        if (x > 1400) {
          const u = Math.min(1, (x - 1400) / 2800);
          r = r * (1 - u) + 0.78 * u;
          gv = gv * (1 - u) + 0.66 * u;
          b = b * (1 - u) + 0.38 * u;
        } else if (x < -1400) {
          const u = Math.min(1, (-1400 - x) / 2800);
          r = r * (1 - u) + 0.42 * u;
          gv = gv * (1 - u) + 0.52 * u;
          b = b * (1 - u) + 0.38 * u;
        }
        if (z > 1600) {
          const u = Math.min(1, (z - 1600) / 3200);
          r = r * (1 - u) + 0.55 * u;
          gv = gv * (1 - u) + 0.62 * u;
          b = b * (1 - u) + 0.58 * u;
        } else if (z < -1600) {
          const u = Math.min(1, (-1600 - z) / 3200);
          r = r * (1 - u) + 0.38 * u;
          gv = gv * (1 - u) + 0.5 * u;
          b = b * (1 - u) + 0.28 * u;
        }
      }
      col[i * 3] = r;
      col[i * 3 + 1] = gv;
      col[i * 3 + 2] = b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, [grass, snow, segs]);
  return (
    <mesh geometry={geo}>
      {snow ? (
        <meshStandardMaterial vertexColors roughness={0.92} metalness={0} envMapIntensity={0.12} />
      ) : (
        <meshStandardMaterial vertexColors map={tex} roughness={0.86} metalness={0} envMapIntensity={0.1} />
      )}
    </mesh>
  );
}

const plantedGeo = new THREE.PlaneGeometry(1, 1);
plantedGeo.translate(0, 0.5, 0);

function PlantedCard({
  map,
  x,
  z,
  w,
  h,
  sink = 0.06,
  sway = false,
}: {
  map: THREE.Texture;
  x: number;
  z: number;
  w: number;
  h: number;
  sink?: number;
  sway?: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const y = heightAt(x, z) - sink;
  useFrame(({ camera, clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.atan2(camera.position.x - x, camera.position.z - z);
    if (sway) ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.65 + x * 0.12) * 0.04;
  });
  return (
    <mesh ref={ref} position={[x, y, z]} scale={[w, h, 1]} geometry={plantedGeo}>
      <meshStandardMaterial map={map} transparent alphaTest={0.12} depthWrite side={THREE.DoubleSide} />
    </mesh>
  );
}

export function PaintedGrove({ denser }: { denser: boolean }) {
  const map = prep(useTexture("/game/world/tree.png"));
  const spots = denser ? TREES : TREES.filter((_, i) => i % 2 === 0);
  return (
    <group>
      {spots.map((t, i) => {
        const h = 11.6 * t.s * t.h;
        return <PlantedCard key={i} map={map} x={t.x} z={t.z} w={h * 0.62} h={h} sink={0.2} sway />;
      })}
    </group>
  );
}

export function PaintedRocks() {
  const map = prep(useTexture("/game/world/rock.png"));
  return (
    <group>
      {ROCKS.map((r, i) => {
        const h = 1.15 * r.s;
        return <PlantedCard key={i} map={map} x={r.x} z={r.z} w={h * 1.35} h={h} sink={0.08} />;
      })}
    </group>
  );
}

export function PaintedLogs() {
  const map = prep(useTexture("/game/world/log.png"));
  return (
    <group>
      {LOGS.map((log, i) => {
        const y = heightAt(log.x, log.z);
        return (
          <mesh
            key={i}
            position={[log.x, y + 0.38 * log.s, log.z]}
            rotation={[0, log.r, 0]}
            scale={log.s}
          >
            <planeGeometry args={[3.4, 1.05]} />
            <meshStandardMaterial map={map} transparent alphaTest={0.14} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

export function PaintedShrooms() {
  const map = prep(useTexture("/game/world/shroom.png"));
  return (
    <group>
      {SHROOMS.map((s, i) => {
        const h = 0.7 * s.s;
        return <PlantedCard key={i} map={map} x={s.x} z={s.z} w={h * 0.95} h={h} sink={0.04} />;
      })}
    </group>
  );
}

function frameSheet(tex: THREE.Texture, i: number) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(0.5, 0.5);
  const col = i & 1;
  const row = (i >> 1) & 1;
  tex.offset.set(col * 0.5, 0.5 - row * 0.5);
  tex.needsUpdate = true;
}

export function PaintedHero({ girl = false }: { girl?: boolean }) {
  const boyF = prep(useTexture("/game/world/cartoon-boy-front.png"));
  const boyB = prep(useTexture("/game/world/cartoon-boy-back.png"));
  const girlF = prep(useTexture("/game/world/cartoon-girl-front.png"));
  const girlB = prep(useTexture("/game/world/cartoon-girl-back.png"));
  const boyWF = prep(useTexture("/game/world/cartoon-boy-walk-front.png"));
  const boyWB = prep(useTexture("/game/world/cartoon-boy-walk-back.png"));
  const girlWF = prep(useTexture("/game/world/cartoon-girl-walk-front.png"));
  const girlWB = prep(useTexture("/game/world/cartoon-girl-walk-back.png"));
  const side = prep(useTexture("/game/world/cartoon-boy-side.png"));
  const frontM = useRef<THREE.MeshLambertMaterial>(null);
  const backM = useRef<THREE.MeshLambertMaterial>(null);
  const body = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const walkF = useMemo(() => {
    const t = (girl ? girlWF : boyWF).clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, [girl, girlWF, boyWF]);
  const walkB = useMemo(() => {
    const t = (girl ? girlWB : boyWB).clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, [girl, girlWB, boyWB]);
  const W = 0.72;
  const H = 1.72;
  const D = 0.34;

  useFrame((_, dt) => {
    const g = body.current;
    if (!g) return;
    const moving = live.speed > 0.35 && !live.rolling && live.grounded && !live.mounted && !live.sit && !live.bed;
    phase.current += dt * (moving ? 6.8 + Math.min(8, live.speed) * 0.45 : 1.2);
    const idleF = girl ? girlF : boyF;
    const idleB = girl ? girlB : boyB;
    if (frontM.current) {
      if (moving) {
        frameSheet(walkF, Math.floor(phase.current) % 4);
        frontM.current.map = walkF;
      } else {
        idleF.repeat.set(1, 1);
        idleF.offset.set(0, 0);
        frontM.current.map = idleF;
      }
      frontM.current.needsUpdate = true;
    }
    if (backM.current) {
      if (moving) {
        frameSheet(walkB, Math.floor(phase.current) % 4);
        backM.current.map = walkB;
      } else {
        idleB.repeat.set(1, 1);
        idleB.offset.set(0, 0);
        backM.current.map = idleB;
      }
      backM.current.needsUpdate = true;
    }
    if (live.rolling) {
      g.rotation.x = live.rollU * Math.PI * 2;
      g.position.y = 0.82 + Math.sin(live.rollU * Math.PI) * 0.28;
      g.rotation.z = 0;
    } else if (live.mounted) {
      g.rotation.x = 0.12;
      g.rotation.z = 0;
      g.position.y = 1.18;
    } else if (moving) {
      const step = Math.sin(phase.current * Math.PI);
      g.rotation.x = 0.06;
      g.rotation.z = step * 0.07;
      g.position.y = 0.9 + Math.abs(step) * 0.045;
    } else {
      g.rotation.x = 0;
      g.rotation.z = 0;
      g.position.y = 0.9;
    }
  });

  return (
    <group>
      <group ref={body} position={[0, 0.9, 0]}>
        <mesh position={[0, 0, -D / 2]} rotation={[0, Math.PI, 0]} castShadow>
          <planeGeometry args={[W, H]} />
          <meshLambertMaterial ref={frontM} map={boyF} transparent alphaTest={0.2} depthWrite />
        </mesh>
        <mesh position={[0, 0, D / 2]} castShadow>
          <planeGeometry args={[W, H]} />
          <meshLambertMaterial ref={backM} map={boyB} transparent alphaTest={0.2} depthWrite />
        </mesh>
        <mesh position={[-W / 2 + 0.02, 0, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow>
          <planeGeometry args={[D, H]} />
          <meshLambertMaterial map={side} transparent alphaTest={0.2} depthWrite />
        </mesh>
        <mesh position={[W / 2 - 0.02, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <planeGeometry args={[D, H]} />
          <meshLambertMaterial map={side} transparent alphaTest={0.2} depthWrite />
        </mesh>
      </group>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
        <circleGeometry args={[0.42, 14]} />
        <meshBasicMaterial color="#1a140e" transparent opacity={0.32} depthWrite={false} />
      </mesh>
      <FairyOrb />
    </group>
  );
}

function FairyOrb() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.set(0.55 + Math.sin(t * 1.4) * 0.12, 1.35 + Math.sin(t * 2.2) * 0.14, 0.2);
  });
  return (
    <mesh ref={ref} position={[0.55, 1.35, 0.2]}>
      <sphereGeometry args={[0.07, 10, 8]} />
      <meshStandardMaterial color="#cfe8ff" emissive="#7eb8ff" emissiveIntensity={2.2} />
    </mesh>
  );
}

const FOE: Record<string, string> = {
  plusling: "/game/world/plusling.png",
  timesprout: "/game/world/timesprout.png",
  glyphite: "/game/world/glyphite.png",
  remainder: "/game/world/remainder.png",
};

export function PaintedFoe({ kind, seed = 0 }: { kind: string; seed?: number }) {
  const url = FOE[kind] ?? FOE.plusling!;
  const map = prep(useTexture(url));
  const spr = useRef<THREE.Sprite>(null);
  const tall = kind === "remainder" ? 2.4 : kind === "timesprout" ? 2.0 : kind === "glyphite" ? 1.4 : 1.3;
  const wide = kind === "remainder" ? 1.2 : kind === "timesprout" ? 1.25 : 1.75;
  useFrame(({ clock }) => {
    if (!spr.current) return;
    const t = clock.elapsedTime * 1.7 + seed;
    const b = Math.sin(t);
    spr.current.position.y = tall * 0.48 + b * 0.05;
    spr.current.scale.set(wide * (1 + b * 0.028), tall * (1 + b * 0.06), 1);
  });
  return (
    <sprite ref={spr} position={[0, tall * 0.48, 0]} scale={[wide, tall, 1]}>
      <spriteMaterial map={map} transparent alphaTest={0.12} depthWrite />
    </sprite>
  );
}
