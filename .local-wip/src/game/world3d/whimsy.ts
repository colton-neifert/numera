import { TREE_TRUNK, TREE_HOME, VX, VZ, POND, vWorld, MILL_AT } from "./field";

const PADDOCK = { x: VX + 28, z: VZ + 24 };
const FIRE_PIT = { x: VX, z: VZ + 8 };

/** Original Numeria oddities — not copies of anyone else's creatures. */
export const WHIM = {
  peekHome: { x: TREE_TRUNK.x - 9.4, z: TREE_TRUNK.z + 15.8 },
  peekHide: { x: TREE_TRUNK.x + 6.2, z: TREE_TRUNK.z + 11.4 },
  jackNest: { x: MILL_AT.x + 6.8, z: MILL_AT.z - 3.4 },
  puddle: { x: VX - 11.2, z: VZ - 7.4 },
  pipkin: { x: TREE_HOME.x + 9.2, z: TREE_HOME.z + 17.6 },
  drawer: vWorld(36, -28),
  cress: { x: PADDOCK.x - 4.6, z: PADDOCK.z + 3.2 },
  hen: { x: PADDOCK.x - 3.1, z: PADDOCK.z + 4.4 },
  ringVale: { x: TREE_TRUNK.x + 19.4, z: TREE_TRUNK.z - 9.2 },
  camp: { x: VX + 64, z: VZ - 76 },
  hollow: { x: TREE_TRUNK.x - 17.2, z: TREE_TRUNK.z + 7.1 },
  hare: { x: TREE_TRUNK.x + 22.4, z: TREE_TRUNK.z + 26.8 },
  hopscotch: vWorld(12, -70),
  signHen: { x: PADDOCK.x - 8.4, z: PADDOCK.z - 1.8 },
  signPath: { x: VX - 7.6, z: VZ - 38 },
  signHome: { x: TREE_HOME.x + 3.6, z: TREE_HOME.z + 9.2 },
  fire: FIRE_PIT,
  pond: POND,
};

export const RING_MARKS = [
  WHIM.ringVale,
  { x: WHIM.camp.x + 4.2, z: WHIM.camp.z - 3.4 },
  { x: WHIM.hollow.x + 5.5, z: WHIM.hollow.z - 8.2 },
] as const;

export function lookingAt(px: number, pz: number, yaw: number, tx: number, tz: number, max = 14) {
  const dx = tx - px;
  const dz = tz - pz;
  const d = Math.hypot(dx, dz);
  if (d < 0.4 || d > max) return false;
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  return (dx * fx + dz * fz) / d > 0.55;
}