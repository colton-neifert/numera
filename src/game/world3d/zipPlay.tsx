import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  heightAt,
  TREE_HOME,
  TREE_HOUSE_H,
  TREE_HW,
  TREE_HD,
  TREE_DECK_D,
  ZIP_LAND,
} from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";

export type ZipPt = { x: number; y: number; z: number };

export function zipStart(): ZipPt {
  const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
  return {
    x: TREE_HOME.x + TREE_HW - 0.72,
    y: plat + 2.62,
    z: TREE_HOME.z + TREE_HD + TREE_DECK_D * 0.62,
  };
}

export function zipEnd(): ZipPt {
  const y = heightAt(ZIP_LAND.x, ZIP_LAND.z) + 3.05;
  return { x: ZIP_LAND.x, y, z: ZIP_LAND.z };
}

export function zipPoint(u: number): ZipPt {
  const s = zipStart();
  const e = zipEnd();
  const t = Math.max(0, Math.min(1, u));
  const sag = 3.15 * 4 * t * (1 - t);
  return {
    x: s.x + (e.x - s.x) * t,
    y: s.y + (e.y - s.y) * t - sag,
    z: s.z + (e.z - s.z) * t,
  };
}

export function zipYaw() {
  const s = zipStart();
  const e = zipEnd();
  return Math.atan2(-(e.x - s.x), -(e.z - s.z));
}

const SEGS = 14;

export function ZipLine() {
  const handle = useRef<THREE.Group>(null);
  const pts = useMemo(() => Array.from({ length: SEGS + 1 }, (_, i) => zipPoint(i / SEGS)), []);
  const segs = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const out: { x: number; y: number; z: number; len: number; q: [number, number, number, number] }[] = [];
    for (let i = 0; i < SEGS; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const dir = new THREE.Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
      const len = dir.length() || 0.01;
      dir.multiplyScalar(1 / len);
      const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
      out.push({
        x: (a.x + b.x) * 0.5,
        y: (a.y + b.y) * 0.5,
        z: (a.z + b.z) * 0.5,
        len,
        q: [q.x, q.y, q.z, q.w],
      });
    }
    return out;
  }, [pts]);
  const s = zipStart();
  const e = zipEnd();
  const landY = heightAt(ZIP_LAND.x, ZIP_LAND.z);

  useFrame(({ clock }) => {
    const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
    const onDeck = live.y > plat - 0.55 && Math.hypot(live.x - s.x, live.z - s.z) < 1.45;
    live.nearZip = !live.zipping && !live.house && !live.climbing && onDeck;
    const u = live.zipping ? live.zipU : 0;
    const p = zipPoint(u);
    const swing = live.zipping ? 0 : Math.sin(clock.elapsedTime * 1.4) * 0.04;
    if (handle.current) {
      handle.current.position.set(p.x, p.y + swing - 0.12, p.z);
      handle.current.rotation.y = zipYaw();
      handle.current.rotation.z = live.zipping ? Math.sin(live.zipU * 18) * 0.04 : swing * 0.6;
    }
    if (live.nearZip && !live.hint) live.hint = "The zip line. Grab on.";
  });

  return (
    <group>
      {segs.map((g, i) => (
        <mesh key={i} position={[g.x, g.y, g.z]} quaternion={g.q}>
          <cylinderGeometry args={[0.028, 0.028, g.len, 5]} />
          <meshLambertMaterial color={i % 2 ? "#c8b090" : "#a89878"} />
        </mesh>
      ))}
      <group position={[s.x, s.y - 2.62, s.z]}>
        <mesh position={[0, 1.45, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.12, 2.9, 6]} />
          <meshLambertMaterial color="#5a3d24" />
        </mesh>
        <mesh position={[0, 2.72, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.42, 6]} />
          <meshLambertMaterial color="#8a8070" />
        </mesh>
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <boxGeometry args={[0.7, 0.12, 0.7]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      </group>
      <group position={[e.x, landY, e.z]}>
        <mesh position={[0, 0.1, 0]} receiveShadow>
          <boxGeometry args={[3.6, 0.22, 3.2]} />
          <meshLambertMaterial color="#7a4a22" />
        </mesh>
        <mesh position={[0, 1.55, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.14, 3.1, 6]} />
          <meshLambertMaterial color="#5a3d24" />
        </mesh>
        <mesh position={[0, 3.12, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.42, 6]} />
          <meshLambertMaterial color="#8a8070" />
        </mesh>
        {[
          [-1.65, -1.45],
          [1.65, -1.45],
          [-1.65, 1.45],
          [1.65, 1.45],
        ].map(([px, pz], i) => (
          <mesh key={i} position={[px, 0.55, pz]} castShadow>
            <cylinderGeometry args={[0.06, 0.07, 1.0, 5]} />
            <meshLambertMaterial color="#6a4a28" />
          </mesh>
        ))}
        <mesh position={[0, 0.92, -1.45]} castShadow>
          <boxGeometry args={[3.4, 0.07, 0.07]} />
          <meshLambertMaterial color="#8a5a28" />
        </mesh>
        <mesh position={[0, 0.92, 1.45]} castShadow>
          <boxGeometry args={[3.4, 0.07, 0.07]} />
          <meshLambertMaterial color="#8a5a28" />
        </mesh>
        <mesh position={[-1.65, 0.92, 0]} castShadow>
          <boxGeometry args={[0.07, 0.07, 2.9]} />
          <meshLambertMaterial color="#8a5a28" />
        </mesh>
        <mesh position={[1.65, 0.92, 0]} castShadow>
          <boxGeometry args={[0.07, 0.07, 2.9]} />
          <meshLambertMaterial color="#8a5a28" />
        </mesh>
      </group>
      <group ref={handle}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.72, 6]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <torusGeometry args={[0.07, 0.018, 5, 8]} />
          <meshLambertMaterial color="#8a8070" />
        </mesh>
      </group>
    </group>
  );
}

export function beginZip() {
  live.zipping = true;
  live.zipU = 0.0;
  live.house = null;
  live.climbing = null;
  live.mounted = false;
  live.speed = 0;
  live.grounded = false;
  live.yaw = zipYaw();
  const p = zipPoint(0);
  live.x = p.x;
  live.z = p.z;
  live.y = p.y - 1.38;
  sfx.jump();
  if (!live.smashed.zipline) {
    live.smashed.zipline = true;
    const c = useGame.getState().addCoins(12);
    if (c > 0) revealItem("coin");
  }
}

export function stepZip(dt: number, drop: boolean) {
  if (!live.zipping) return;
  const haste = 0.085 + 0.14 * Math.sin(Math.min(1, live.zipU) * Math.PI);
  live.zipU = Math.min(1, live.zipU + dt * haste);
  const p = zipPoint(live.zipU);
  live.x = p.x;
  live.z = p.z;
  live.y = p.y - 1.38;
  live.yaw = zipYaw();
  live.speed = 0;
  live.vx = 0;
  live.grounded = false;
  live.house = null;
  if (live.zipU >= 0.995 || drop) {
    live.zipping = false;
    live.zipU = 0;
    live.nearZip = false;
    if (drop && p.y - 1.38 > heightAt(p.x, p.z) + 1.4) {
      sfx.jump();
    } else {
      live.x = ZIP_LAND.x;
      live.z = ZIP_LAND.z;
      live.y = heightAt(ZIP_LAND.x, ZIP_LAND.z) + 0.22;
      live.grounded = true;
      sfx.land("stone");
      live.listen = live.listen || "You held on the whole way.";
    }
  }
}
