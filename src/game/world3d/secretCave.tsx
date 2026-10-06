import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleH } from "./lush/grid";
import { live } from "./live";
import { lamb } from "./mats";
import { sfx } from "../audio";
import { useGame } from "../store";
import { playerMaxHp } from "../content";
import { revealItem } from "../items";

/** A cracked rock west of the field arch. A bomb opens the cave behind it. */
const ROCK = { x: -113.2, z: -56 };
const CAVE_KEY = "numeria-crack";
const HEART_KEY = "numeria-caveheart";
const PURSE_KEY = "numeria-cavepurse";

function readFlag(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
function writeFlag(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* private mode */
  }
}

let rockGone = readFlag(CAVE_KEY);
let heartTaken = readFlag(HEART_KEY);
let purseTaken = readFlag(PURSE_KEY);

type Box = { x: number; z: number; hx: number; hz: number };

const WALLS: Box[] = [
  { x: -124, z: -58.6, hx: 10, hz: 0.45 },
  { x: -124, z: -53.4, hx: 10, hz: 0.45 },
  { x: -134.4, z: -56, hx: 0.45, hz: 2.8 },
];

function pushOut(nx: number, nz: number, b: Box) {
  const dx = nx - b.x;
  const dz = nz - b.z;
  const hx = b.hx + 0.42;
  const hz = b.hz + 0.42;
  if (Math.abs(dx) >= hx || Math.abs(dz) >= hz) return null;
  if (hx - Math.abs(dx) < hz - Math.abs(dz)) return { x: b.x + Math.sign(dx || 1) * hx, z: nz };
  return { x: nx, z: b.z + Math.sign(dz || 1) * hz };
}

export function collideSecret(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house) return null;
  let x = nx;
  let z = nz;
  let hit = false;
  if (!rockGone) {
    const rock = pushOut(x, z, { x: ROCK.x, z: ROCK.z, hx: 1.35, hz: 2.5 });
    if (rock) {
      x = rock.x;
      z = rock.z;
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

function HeartGlyph() {
  return (
    <group>
      <mesh position={[-0.07, 0.04, 0]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        {lamb("#e04850")}
      </mesh>
      <mesh position={[0.07, 0.04, 0]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        {lamb("#e04850")}
      </mesh>
      <mesh position={[0, -0.06, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.14, 0.16, 4]} />
        {lamb("#c03040")}
      </mesh>
    </group>
  );
}

export function SecretCave() {
  const rock = useRef<THREE.Group>(null);
  const dustG = useRef<THREE.Group>(null);
  const heart = useRef<THREE.Group>(null);
  const purse = useRef<THREE.Group>(null);
  const y = sampleH(ROCK.x, ROCK.z);
  const roomY = sampleH(-128, -56);

  useFrame(({ clock }, dt) => {
    if (!rockGone) {
      const blast = live.blast;
      const nearBlast = Boolean(blast && Math.hypot(blast.x - ROCK.x, blast.z - ROCK.z) < 2.7);
      const nearFuse = live.bombs.some((b) => b.fuse < 0.08 && Math.hypot(b.x - ROCK.x, b.z - ROCK.z) < 2.7);
      if (nearBlast || nearFuse) {
        rockGone = true;
        writeFlag(CAVE_KEY);
        dustG.current && (dustG.current.visible = true);
        if (dustG.current) dustG.current.userData.t = 0.7;
        sfx.grind();
        sfx.secret();
        live.listen = "The rock gives way. There is a cave behind it.";
      } else if (Math.hypot(live.x - ROCK.x, live.z - ROCK.z) < 2.4 && !live.listen && !live.talking) {
        live.hint = "Black cracks. This rock is not like the others.";
      }
    }
    const puff = dustG.current;
    if (puff) {
      const t = Number(puff.userData.t ?? 0);
      if (t > 0) {
        puff.userData.t = t - dt;
        puff.visible = true;
        puff.position.y = y + 0.5 + (0.7 - t) * 1.3;
      } else puff.visible = false;
    }
    if (rock.current) rock.current.visible = !rockGone;
    if (!heartTaken && Math.hypot(live.x + 128, live.z + 56) < 0.85) {
      heartTaken = true;
      writeFlag(HEART_KEY);
      const g = useGame.getState();
      const max = playerMaxHp(g.xp, g.outfit, g.heartsExtra ?? 0);
      useGame.setState({ hp: max });
      sfx.heart();
      revealItem("heart", true);
      live.listen = "A whole heart. The ache is gone.";
    }
    if (!purseTaken && Math.hypot(live.x + 124, live.z + 57.2) < 0.85) {
      purseTaken = true;
      writeFlag(PURSE_KEY);
      const g = useGame.getState();
      const room = Math.max(0, (g.coinsMax ?? 100) - (g.coins ?? 0));
      if (room > 0) g.addCoins(room);
      sfx.purse();
      revealItem("coin");
      live.listen = room > 0 ? "The sack fills your purse." : "The sack is empty. Your purse was already full.";
    }
    const spin = clock.elapsedTime * 1.6;
    if (heart.current) {
      heart.current.visible = !heartTaken;
      heart.current.rotation.y = spin;
      heart.current.position.y = roomY + 0.85 + Math.sin(clock.elapsedTime * 2) * 0.06;
    }
    if (purse.current) {
      purse.current.visible = !purseTaken;
      purse.current.rotation.y = spin * 0.6;
    }
  });

  return (
    <group>
      <group ref={rock} position={[ROCK.x, y + 0.85, ROCK.z]}>
        <mesh castShadow>
          <dodecahedronGeometry args={[1.15, 0]} />
          {lamb("#5c5854")}
        </mesh>
        <mesh position={[0.2, 0.15, 0.7]} rotation={[0.2, 0.4, 0.8]}>
          <boxGeometry args={[0.08, 0.9, 0.06]} />
          {lamb("#1a1a1c")}
        </mesh>
        <mesh position={[-0.35, -0.1, 0.65]} rotation={[0.4, -0.2, -0.4]}>
          <boxGeometry args={[0.07, 0.7, 0.05]} />
          {lamb("#1a1a1c")}
        </mesh>
      </group>
      {WALLS.map((b, i) => (
        <mesh key={i} position={[b.x, sampleH(b.x, b.z) + 1.35, b.z]} castShadow receiveShadow>
          <boxGeometry args={[b.hx * 2, 2.7, b.hz * 2]} />
          {lamb("#6a645c")}
        </mesh>
      ))}
      <mesh position={[-124, sampleH(-124, -56) + 2.55, -56]}>
        <boxGeometry args={[20, 0.35, 5.6]} />
        {lamb("#4e4a44")}
      </mesh>
      <group ref={heart} position={[-128, roomY + 0.85, -56]}>
        <HeartGlyph />
      </group>
      <group ref={purse} position={[-124, roomY + 0.35, -57.2]}>
        <mesh castShadow>
          <sphereGeometry args={[0.22, 8, 6]} />
          {lamb("#e0b030")}
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.08]} />
          {lamb("#8a6820")}
        </mesh>
      </group>
      <group ref={dustG} visible={false} position={[ROCK.x, y + 0.5, ROCK.z]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[(i - 2) * 0.32, 0, (i % 2) * 0.3 - 0.15]}>
            <boxGeometry args={[0.12, 0.12, 0.12]} />
            {lamb("#8a8478")}
          </mesh>
        ))}
      </group>
    </group>
  );
}
