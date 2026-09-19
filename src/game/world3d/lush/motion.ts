import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Joint = { shown: THREE.Quaternion; target: THREE.Quaternion; written: THREE.Quaternion };

/**
 * Ease a rig's joints toward whatever pose the animation code set this frame, so stance changes blend
 * instead of snapping. Register it *after* the pose code's own useFrame. `rate` is per-second stiffness.
 */
export function useEasedJoints(refs: RefObject<THREE.Object3D | null>[], rate: () => number) {
  const state = useRef(new Map<THREE.Object3D, Joint>());
  useFrame((_, dtRaw) => {
    const k = 1 - Math.exp(-Math.min(dtRaw, 0.05) * rate());
    for (const ref of refs) {
      const obj = ref.current;
      if (!obj) continue;
      let j = state.current.get(obj);
      if (!j) {
        j = { shown: obj.quaternion.clone(), target: obj.quaternion.clone(), written: obj.quaternion.clone() };
        state.current.set(obj, j);
        continue;
      }
      if (!obj.quaternion.equals(j.written)) j.target.copy(obj.quaternion);
      j.shown.slerp(j.target, k);
      obj.quaternion.copy(j.shown);
      j.written.copy(j.shown);
    }
  });
}
