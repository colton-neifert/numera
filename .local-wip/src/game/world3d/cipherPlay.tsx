import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WorldId } from "../types";
import { heightAt, TREE_HOME, POND, VX, VZ, WELL_AT } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { useGame } from "../store";
import { takeCipher, hasCipher } from "../cipher";
import { roomZ } from "./dungeonLayout";
import { FARM_AT } from "./townLife";

const GLYPHS: { id: "glyph-sun" | "glyph-fire" | "glyph-water" | "glyph-blank"; x: number; z: number; mark: "sun" | "fire" | "water" | "blank" }[] = [
  { id: "glyph-sun", x: VX + 2.2, z: VZ + 44, mark: "sun" },
  { id: "glyph-fire", x: FARM_AT.x - 6.4, z: FARM_AT.z + 5.2, mark: "fire" },
  { id: "glyph-water", x: POND.x + 9.4, z: POND.z + 6.2, mark: "water" },
  { id: "glyph-blank", x: TREE_HOME.x + 10.2, z: TREE_HOME.z - 18.4, mark: "blank" },
];

export const RUIN_AT = { x: VX - 6, z: VZ - 122 };

export function CipherPlay({ worldId }: { worldId: WorldId }) {
  return (
    <group>
      {worldId === "meadow" ? (
        <>
          <SkyHole />
          <GlyphRow />
          <BuriedSeats />
          <WellCount />
          <ChiselStone />
        </>
      ) : null}
      {worldId === "cavern" ? (
        <>
          <CavernFourSuns />
          <QuietScratch />
          <WardenTablet />
        </>
      ) : null}
    </group>
  );
}

function SkyHole() {
  const ring = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const seen = useRef(false);
  useFrame(({ camera }) => {
    const on = live.dusk > 0.68 && !live.house && !live.dungeon;
    if (ring.current) ring.current.visible = on;
    if (glow.current) glow.current.visible = on;
    if (!on) return;
    const p = camera.position;
    ring.current?.position.set(p.x + 18, p.y + 42, p.z - 70);
    glow.current?.position.set(p.x + 18, p.y + 42, p.z - 70);
    if (seen.current || live.speed > 2.4) return;
    if (live.dusk > 0.74 && (live.stillT > 1.2 || Math.abs(live.speed) < 0.35)) {
      seen.current = true;
      takeCipher("sky-ring", true);
    }
  });
  return (
    <group>
      <mesh ref={glow} visible={false} frustumCulled={false}>
        <ringGeometry args={[4.6, 7.4, 28]} />
        <meshBasicMaterial color="#d8e8ff" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={ring} visible={false} frustumCulled={false}>
        <ringGeometry args={[5.2, 6.1, 28]} />
        <meshBasicMaterial color="#f4f8ff" transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function GlyphRow() {
  return (
    <group>
      {GLYPHS.map((g) => (
        <GlyphStone key={g.id} {...g} />
      ))}
    </group>
  );
}

function GlyphStone({
  id,
  x,
  z,
  mark,
}: {
  id: "glyph-sun" | "glyph-fire" | "glyph-water" | "glyph-blank";
  x: number;
  z: number;
  mark: "sun" | "fire" | "water" | "blank";
}) {
  const y = heightAt(x, z);
  const color = mark === "sun" ? "#e8c040" : mark === "fire" ? "#e07a28" : mark === "water" ? "#6ab0c8" : "#8a8478";
  const taken = useRef(hasCipher(id));
  useFrame(() => {
    if (taken.current || live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 1.55 && (live.stillT > 0.35 || Math.abs(live.speed) < 0.3)) {
      taken.current = true;
      takeCipher(id, mark === "blank");
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.7, 1.22, 0.28]} />
        {lamb("#6a6054", { kind: "stone" })}
      </mesh>
      <mesh position={[0, 0.72, 0.16]}>
        {mark === "blank" ? <planeGeometry args={[0.32, 0.32]} /> : <circleGeometry args={[0.16, 10]} />}
        <meshLambertMaterial color={color} emissive={mark === "blank" ? "#2a2824" : color} emissiveIntensity={mark === "blank" ? 0 : live.dusk > 0.5 ? 0.55 : 0.18} />
      </mesh>
      {mark === "blank" ? (
        <mesh position={[0.04, 0.7, 0.17]} rotation={[0, 0, 0.4]}>
          <planeGeometry args={[0.22, 0.05]} />
          <meshLambertMaterial color="#4a443c" />
        </mesh>
      ) : null}
    </group>
  );
}

function BuriedSeats() {
  const { x, z } = RUIN_AT;
  const y = heightAt(x, z);
  const taken = useRef(hasCipher("ruin"));
  useFrame(() => {
    if (taken.current || live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 3.4 && (live.stillT > 0.4 || Math.abs(live.speed) < 0.3)) {
      taken.current = true;
      takeCipher("ruin", true);
    }
  });
  const seats = [
    { x: -2.4, z: -2.1, buried: false, c: "#e8c040" },
    { x: 2.4, z: -2.1, buried: false, c: "#e07a28" },
    { x: -2.4, z: 2.1, buried: false, c: "#6ab0c8" },
    { x: 2.4, z: 2.1, buried: true, c: "#6a6458" },
  ];
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[5.4, 16]} />
        {lamb("#5a5044", { kind: "stone" })}
      </mesh>
      {seats.map((s, i) => (
        <group key={i} position={[s.x, s.buried ? 0.12 : 0.42, s.z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.55, 0.62, s.buried ? 0.28 : 0.7, 8]} />
            {lamb(s.buried ? "#4a4438" : "#7a7060", { kind: "stone" })}
          </mesh>
          {!s.buried ? (
            <mesh position={[0, 0.42, 0]}>
              <circleGeometry args={[0.18, 8]} />
              <meshLambertMaterial color={s.c} emissive={s.c} emissiveIntensity={0.35} />
            </mesh>
          ) : (
            <mesh position={[0, 0.2, 0]}>
              <sphereGeometry args={[0.28, 8, 6]} />
              {lamb("#3a4a28", { kind: "dirt" })}
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function ChiselStone() {
  const x = TREE_HOME.x - 7.2;
  const z = TREE_HOME.z - 14.6;
  const y = heightAt(x, z);
  const taken = useRef(hasCipher("chisel"));
  useFrame(() => {
    if (taken.current || live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 1.5 && (live.stillT > 0.3 || Math.abs(live.speed) < 0.3)) {
      taken.current = true;
      takeCipher("chisel", true);
    }
  });
  return (
    <group position={[x, y, z]} rotation={[0.08, 0.4, 0]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[1.15, 0.42, 0.85]} />
        {lamb("#7a7468", { kind: "stone" })}
      </mesh>
      {[ -0.36, -0.12, 0.12, 0.36 ].map((px, i) => (
        <mesh key={i} position={[px, 0.44, 0]}>
          <cylinderGeometry args={[0.07, 0.08, i === 3 ? 0.04 : 0.12, 8]} />
          {lamb(i === 3 ? "#4a443c" : "#c9a227", { kind: "stone" })}
        </mesh>
      ))}
    </group>
  );
}

function WellCount() {
  const cool = useRef(4);
  const taken = useRef(hasCipher("well"));
  useFrame((_, dt) => {
    if (live.house || taken.current) return;
    if (Math.hypot(live.x - WELL_AT.x, live.z - WELL_AT.z) > 2.2) return;
    cool.current -= dt;
    if (cool.current > 0) return;
    cool.current = 18;
    taken.current = true;
    takeCipher("well", true);
  });
  return null;
}

function CavernFourSuns() {
  const z = roomZ(0) + 10.4;
  const taken = useRef(hasCipher("cavern-mural"));
  useFrame(() => {
    if (taken.current || !live.dungeon) return;
    if (Math.hypot(live.x, live.z - z) < 3.2 && (live.stillT > 0.4 || Math.abs(live.speed) < 0.3)) {
      taken.current = true;
      takeCipher("cavern-mural", true);
    }
  });
  return (
    <group position={[0, 2.4, z]}>
      {[ -1.65, -0.55, 0.55, 1.65 ].map((px, i) => (
        <mesh key={i} position={[px, 0.1, 0.2]}>
          <circleGeometry args={[0.28, 12]} />
          <meshLambertMaterial
            color={i === 3 ? "#3a322c" : "#e8c040"}
            emissive={i === 3 ? "#1a1410" : "#e8c040"}
            emissiveIntensity={i === 3 ? 0 : 0.4}
          />
        </mesh>
      ))}
      <mesh position={[1.65, 0.1, 0.22]} rotation={[0, 0, 0.5]}>
        <planeGeometry args={[0.42, 0.06]} />
        <meshLambertMaterial color="#2a221c" />
      </mesh>
      <mesh position={[1.65, 0.1, 0.22]} rotation={[0, 0, -0.4]}>
        <planeGeometry args={[0.34, 0.05]} />
        <meshLambertMaterial color="#2a221c" />
      </mesh>
    </group>
  );
}

function QuietScratch() {
  const z = roomZ(9) - 8;
  const x = -8;
  const taken = useRef(hasCipher("cavern-slate"));
  useFrame(() => {
    if (taken.current || !live.dungeon) return;
    if (Math.hypot(live.x - x, live.z - z) < 1.8 && (live.stillT > 0.3 || Math.abs(live.speed) < 0.3)) {
      taken.current = true;
      takeCipher("cavern-slate", true);
    }
  });
  return (
    <group position={[x + 0.5, 1.12, z]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[-0.18, 0.12, 0.02]}>
        <boxGeometry args={[0.16, 0.035, 0.02]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[-0.18, 0.02, 0.02]}>
        <boxGeometry args={[0.035, 0.22, 0.02]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[0.08, 0.04, 0.02]} rotation={[0, 0, 0.6]}>
        <boxGeometry args={[0.28, 0.03, 0.02]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[0.32, 0.12, 0.02]}>
        <boxGeometry args={[0.22, 0.035, 0.02]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function WardenTablet() {
  const done = useRef(hasCipher("tablet"));
  useFrame(() => {
    if (done.current) return;
    const dead = useGame.getState().defeated.cavern ?? [];
    if (dead.includes("cavern-warden")) {
      done.current = true;
      takeCipher("tablet", true);
    }
  });
  return null;
}
