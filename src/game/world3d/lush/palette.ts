import * as THREE from "three";
import { vnoise } from "./grid";

/** Key-art meadow palette. Ground and grass blades share it so blades melt into the turf. */
export const GROUND = {
  dark: new THREE.Color("#3a6e22"),
  base: new THREE.Color("#55892c"),
  light: new THREE.Color("#7fab36"),
  sun: new THREE.Color("#a4bb48"),
  tip: new THREE.Color("#9fc544"),
  dry: new THREE.Color("#d9cf6a"),
  dirt: new THREE.Color("#b08a55"),
  dirtDark: new THREE.Color("#8a6a40"),
  sand: new THREE.Color("#c9b47c"),
  mud: new THREE.Color("#5d5a38"),
  rock: new THREE.Color("#7d8466"),
};

/** 0 … 1 broad light/dark mottling of the turf. */
export function groundShade(x: number, z: number) {
  const n1 = vnoise(x * 0.03 + 11, z * 0.03 - 7);
  const n2 = vnoise(x * 0.11 - 3, z * 0.11 + 19);
  const n3 = vnoise(x * 0.37, z * 0.37);
  return n1 * 0.55 + n2 * 0.3 + n3 * 0.15;
}

export function turfColor(v: number, out: THREE.Color) {
  out.copy(GROUND.dark).lerp(GROUND.base, Math.min(1, v * 1.7));
  if (v > 0.5) out.lerp(GROUND.light, Math.min(1, (v - 0.5) * 2.2));
  return out;
}
