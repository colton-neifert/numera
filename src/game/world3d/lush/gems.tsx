import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Brilliant-cut gem: flat table, faceted crown, long pavilion. Unit height ≈ 1.6. */
function cutGeo() {
  const sides = 8;
  const rings: [number, number][] = [
    [0.0, 0.62],
    [0.52, 0.62],
    [1.0, 0.28],
    [0.0, -1.0],
  ];
  const pos: number[] = [];
  const ring = (r: number, y: number, twist: number) =>
    Array.from({ length: sides }, (_, i) => {
      const a = ((i + twist) / sides) * Math.PI * 2;
      return [Math.cos(a) * r, y, Math.sin(a) * r] as [number, number, number];
    });
  const table = ring(rings[1]![0], rings[1]![1], 0);
  const girdle = ring(rings[2]![0], rings[2]![1], 0.5);
  const top: [number, number, number] = [0, rings[0]![1], 0];
  const tip: [number, number, number] = [0, rings[3]![1], 0];
  const tri = (a: number[], b: number[], c: number[]) => pos.push(...a, ...b, ...c);
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    tri(top, table[j]!, table[i]!);
    // crown: alternating kite facets between the table and the girdle
    tri(table[i]!, table[j]!, girdle[i]!);
    tri(table[j]!, girdle[j]!, girdle[i]!);
    tri(girdle[i]!, girdle[j]!, tip);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

let GEO: THREE.BufferGeometry | null = null;
let GLOW: THREE.Texture | null = null;

function glowTex() {
  if (GLOW) return GLOW;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.25, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  GLOW = new THREE.CanvasTexture(c);
  return GLOW;
}

export const GEM_TINTS = ["#e0262e", "#f2b316", "#2356e0", "#23b45a", "#a23be0"];

/** A floating, slowly turning jewel with a painted-glass sheen and a soft halo. */
export function LushGem({ color = "#2356e0", size = 0.34, seed = 0 }: { color?: string; size?: number; seed?: number }) {
  const spin = useRef<THREE.Group>(null);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.32,
      roughness: 0.12,
      metalness: 0.05,
      flatShading: true,
    });
    m.customProgramCacheKey = () => "lush-gem";
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        {
          // Glassy facets: bright rims, and a hard glint on facets that face the eye.
          vec3 n = normalize(normal);
          vec3 v = normalize(vViewPosition);
          float f = pow(1.0 - abs(dot(n, v)), 2.2);
          float glint = smoothstep(0.93, 0.995, abs(dot(n, normalize(v + vec3(0.35, 0.6, 0.2)))));
          totalEmissiveRadiance += mix(diffuseColor.rgb, vec3(1.0), 0.65) * (f * 0.9 + glint * 1.6);
        }`,
      );
    };
    return m;
  }, [color]);
  useFrame(({ clock }) => {
    if (!spin.current) return;
    const t = clock.elapsedTime + seed;
    spin.current.rotation.y = t * 0.9;
    spin.current.position.y = Math.sin(t * 1.6) * 0.09;
  });
  if (!GEO) GEO = cutGeo();
  return (
    <group>
      <group ref={spin} rotation={[0.12, 0, 0.1]}>
        <mesh geometry={GEO} material={mat} scale={[size * 0.8, size, size * 0.8]} castShadow />
      </group>
      <sprite scale={[size * 4.2, size * 4.2, 1]}>
        <spriteMaterial map={glowTex()} color={color} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}
