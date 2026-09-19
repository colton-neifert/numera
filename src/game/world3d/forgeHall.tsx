import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Pantheon-like round hall: flat circle floor, walls that go up, moon in the oculus. */
export function ForgeHall({
  radius = 16.4,
  wallH = 18.2,
  coffinOpen = 0,
  openRef,
  glowRef,
  showCoffin = true,
}: {
  radius?: number;
  wallH?: number;
  coffinOpen?: number;
  openRef?: MutableRefObject<number>;
  glowRef?: MutableRefObject<number>;
  showCoffin?: boolean;
}) {
  const stone = "#5a5650";
  const dark = "#2e2c28";
  const rim = "#7a7468";
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius + 0.4, 48]} />
        <meshLambertMaterial color="#6a6660" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <ringGeometry args={[radius * 0.38, radius * 0.72, 48]} />
        <meshLambertMaterial color="#3a3834" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[1.15, 2.05, 32]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[0, wallH * 0.5, 0]}>
        <cylinderGeometry args={[radius + 0.55, radius + 0.55, wallH, 40, 1, true]} />
        <meshLambertMaterial color={stone} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, wallH * 0.5, 0]}>
        <cylinderGeometry args={[radius + 1.35, radius + 1.35, wallH, 40, 1, true]} />
        <meshLambertMaterial color={dark} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[0, wallH + 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.6, radius + 1.4, 40]} />
        <meshLambertMaterial color={dark} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, wallH + 0.28, 0]}>
        <torusGeometry args={[4.85, 0.28, 8, 32]} />
        <meshLambertMaterial color={rim} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        const r = radius - 1.15;
        return (
          <mesh key={i} position={[Math.sin(a) * r, wallH * 0.42, Math.cos(a) * r]} castShadow>
            <cylinderGeometry args={[0.38, 0.46, wallH * 0.84, 8]} />
            <meshLambertMaterial color="#6a6560" />
          </mesh>
        );
      })}
      <MoonBeam y={wallH} />
      {showCoffin ? <CoffinCage open={coffinOpen} openRef={openRef} glowRef={glowRef} z={-(radius - 3.4)} /> : null}
    </group>
  );
}

function MoonBeam({ y }: { y: number }) {
  return (
    <group>
      <mesh position={[0, y + 7.4, 0]}>
        <sphereGeometry args={[3.4, 28, 20]} />
        <meshBasicMaterial color="#eef4ff" />
      </mesh>
      <mesh position={[0.9, y + 7.1, 0.55]}>
        <sphereGeometry args={[0.85, 12, 8]} />
        <meshBasicMaterial color="#c8d4ea" />
      </mesh>
      <mesh position={[0, y * 0.52, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[3.8, y * 1.05, 20, 1, true]} />
        <meshBasicMaterial color="#c8dcff" transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, y + 1.6, 0]} intensity={52} color="#d8e8ff" distance={46} />
      <pointLight position={[0, 4.2, 0]} intensity={16} color="#b8c8e8" distance={24} />
    </group>
  );
}

export function CoffinCage({
  open = 0,
  openRef,
  glowRef,
  z = -13,
}: {
  open?: number;
  openRef?: MutableRefObject<number>;
  glowRef?: MutableRefObject<number>;
  z?: number;
}) {
  const door = useRef<THREE.Group>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const glowLit = useRef<THREE.PointLight>(null);
  const steam = useRef<THREE.Group>(null);
  const innerLit = useRef<THREE.MeshBasicMaterial>(null);
  const barXs = [-0.58, -0.29, 0, 0.29, 0.58];
  useFrame(({ clock }) => {
    if (!door.current) return;
    const u = openRef ? openRef.current : open;
    door.current.rotation.y = -u * 1.42;
    const g = glowRef ? glowRef.current : 0;
    if (glowMat.current) glowMat.current.opacity = 0.04 + g * 0.92;
    if (innerLit.current) innerLit.current.opacity = 0.08 + g * 0.7;
    if (glowLit.current) glowLit.current.intensity = g * 42;
    if (steam.current) {
      const on = u > 0.28;
      steam.current.visible = on;
      if (on) {
        const t = clock.elapsedTime;
        steam.current.children.forEach((c, i) => {
          const rise = ((t * 0.72 + i * 0.13) % 2.35);
          c.position.y = 0.25 + rise;
          c.scale.setScalar(0.7 + rise * 0.55);
          const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
          if (m) m.opacity = Math.max(0, 0.42 - rise * 0.16);
        });
      }
    }
  });
  const iron = "#6a6660";
  const gold = "#c9a227";
  const dark = "#3a3834";
  const concrete = "#8a8680";
  const wood = "#2c2822";
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.12, 0.15]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.55, 16]} />
        <meshLambertMaterial color="#2a2620" />
      </mesh>
      <mesh position={[0, 0.28, 0.1]} castShadow>
        <boxGeometry args={[2.55, 0.34, 1.85]} />
        <meshLambertMaterial color="#3a3630" />
      </mesh>
      {([-1.05, 1.05] as const).map((x) =>
        ([-0.62, 0.62] as const).map((dz) => (
          <mesh key={`${x}${dz}`} position={[x, 0.22, dz]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 0.28, 8]} />
            <meshLambertMaterial color="#4a443c" />
          </mesh>
        )),
      )}
      <mesh position={[0, 2.05, -0.42]} castShadow>
        <boxGeometry args={[2.15, 3.85, 1.22]} />
        <meshLambertMaterial color={wood} />
      </mesh>
      <mesh position={[0, 4.12, -0.42]} castShadow>
        <boxGeometry args={[1.55, 0.55, 0.95]} />
        <meshLambertMaterial color="#24211c" />
      </mesh>
      <mesh position={[0, 4.52, -0.42]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.55, 0.55, 4]} />
        <meshLambertMaterial color={gold} />
      </mesh>
      {[-1.02, 1.02].map((x) => (
        <mesh key={`p${x}`} position={[x, 2.05, 0.08]} castShadow>
          <boxGeometry args={[0.16, 3.9, 0.16]} />
          <meshLambertMaterial color={iron} />
        </mesh>
      ))}
      <mesh position={[0, 4.02, 0.08]}>
        <boxGeometry args={[2.12, 0.14, 0.16]} />
        <meshLambertMaterial color={iron} />
      </mesh>
      <mesh position={[0, 0.22, 0.08]}>
        <boxGeometry args={[2.12, 0.16, 0.16]} />
        <meshLambertMaterial color={iron} />
      </mesh>
      <mesh position={[0, 2.05, -0.08]}>
        <boxGeometry args={[1.72, 3.4, 0.08]} />
        <meshBasicMaterial color="#0c0a08" />
      </mesh>
      <group ref={door} position={[1.02, 2.05, 0.58]}>
        <mesh position={[-1.02, -0.52, 0]} castShadow>
          <boxGeometry args={[2.08, 2.38, 0.18]} />
          <meshLambertMaterial color={concrete} />
        </mesh>
        <mesh position={[-1.02 - 0.93, 1.08, 0]} castShadow>
          <boxGeometry args={[0.22, 0.95, 0.18]} />
          <meshLambertMaterial color={concrete} />
        </mesh>
        <mesh position={[-1.02 + 0.93, 1.08, 0]} castShadow>
          <boxGeometry args={[0.22, 0.95, 0.18]} />
          <meshLambertMaterial color={concrete} />
        </mesh>
        <mesh position={[-1.02, 1.62, 0]} castShadow>
          <boxGeometry args={[2.08, 0.22, 0.18]} />
          <meshLambertMaterial color={concrete} />
        </mesh>
        <mesh position={[-1.02, 0.58, 0.01]} castShadow>
          <boxGeometry args={[1.92, 0.1, 0.2]} />
          <meshLambertMaterial color={dark} />
        </mesh>
        <mesh position={[-1.02, 1.08, -0.04]}>
          <planeGeometry args={[1.58, 0.82]} />
          <meshBasicMaterial ref={innerLit} color="#140e08" transparent opacity={0.2} />
        </mesh>
        <mesh position={[-1.02, 1.08, -0.02]}>
          <planeGeometry args={[1.52, 0.76]} />
          <meshBasicMaterial ref={glowMat} color="#ffe7a0" transparent opacity={0.08} />
        </mesh>
        {barXs.map((ox) => (
          <mesh key={ox} position={[ox - 1.02, 1.08, 0.07]} castShadow>
            <boxGeometry args={[0.08, 0.86, 0.08]} />
            <meshLambertMaterial color="#1c1a16" />
          </mesh>
        ))}
        {[-0.36, 0, 0.36].map((oy) => (
          <mesh key={oy} position={[-1.02, 1.08 + oy, 0.07]}>
            <boxGeometry args={[1.52, 0.06, 0.06]} />
            <meshLambertMaterial color="#1c1a16" />
          </mesh>
        ))}
        <pointLight ref={glowLit} position={[-1.02, 1.08, -0.42]} color="#ffe08a" intensity={0} distance={10} />
        <mesh position={[0.02, -0.15, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.16, 8]} />
          <meshLambertMaterial color={iron} />
        </mesh>
        <mesh position={[0.02, -0.15, 0.14]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshLambertMaterial color="#4a443c" />
        </mesh>
      </group>
      <group ref={steam} position={[0, 0.45, 0.95]} visible={false}>
        {Array.from({ length: 16 }, (_, i) => (
          <mesh key={i} position={[(i % 5) * 0.32 - 0.64, 0.15, (i % 4) * 0.22 - 0.18]}>
            <sphereGeometry args={[0.28 + (i % 4) * 0.08, 7, 6]} />
            <meshBasicMaterial color="#d4d8e0" transparent opacity={0.28} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

