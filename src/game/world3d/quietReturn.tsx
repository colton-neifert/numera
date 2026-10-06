import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { sfx } from "../audio";
import { consumeTalk } from "../input";
import { BELL_AT, heightAt, VR, VX, VZ } from "./field";
import { live } from "./live";
import { PADDOCK } from "./village";
import { lamb } from "./mats";
import {
  markQuietArmed,
  markQuietKept,
  markQuietLeft,
  markQuietSeen,
  markQuietStirred,
  quietArmed,
  quietKept,
  quietLeft,
  quietSeen,
  quietStirred,
} from "./quietFlag";

const GLOVE = { x: BELL_AT.x - 5.6, z: BELL_AT.z + 4.6 };

function prints() {
  const out: { x: number; z: number; y: number }[] = [];
  for (let i = 1; i <= 6; i++) {
    const u = i / 7;
    const x = BELL_AT.x + (GLOVE.x - BELL_AT.x) * u;
    const z = BELL_AT.z + (GLOVE.z - BELL_AT.z) * u;
    out.push({ x, z, y: heightAt(x, z) + 0.03 });
  }
  return out;
}

/** Something small changes after you have already been here, left, and come home. */
export function QuietReturn() {
  const step = useRef(0);
  const noted = useRef(false);
  const phase = useRef<"none" | "stir" | "kept">(quietKept() ? "kept" : quietStirred() ? "stir" : "none");
  const [, bump] = useState(0);
  const feet = prints();
  const gy = heightAt(GLOVE.x, GLOVE.z);
  const gateX = PADDOCK.x - 7.2;
  const gateZ = PADDOCK.z;
  const gateY = heightAt(gateX, gateZ);

  useFrame(() => {
    if (live.house || live.story) return;
    const home = Math.hypot(live.x - VX, live.z - VZ);
    if (home < VR - 6) markQuietSeen();
    if (quietSeen() && home > VR + 26) markQuietLeft();
    if (quietSeen() && quietLeft() && !quietArmed() && !quietStirred() && home < VR - 8 && live.playT > 70) {
      markQuietArmed();
    }
    const bellD = Math.hypot(live.x - BELL_AT.x, live.z - BELL_AT.z);
    if (quietArmed() && !quietStirred() && !live.talking && bellD < 15 && bellD > 3.2) {
      markQuietStirred();
      live.bellT = 2.6;
      sfx.thud();
    }
    const keptNow = quietKept();
    const stirredNow = quietStirred();
    const next = keptNow ? "kept" : stirredNow ? "stir" : "none";
    if (next !== phase.current) {
      phase.current = next;
      bump((n) => n + 1);
    }
    const gd = Math.hypot(live.x - GLOVE.x, live.z - GLOVE.z);
    if (stirredNow && !keptNow && gd < 6 && gd > 1.4 && !noted.current && !live.listen) {
      noted.current = true;
      live.listen = "Footprints. They stop where nobody usually stands.";
    }
    if (stirredNow && !keptNow && gd < 1.25 && !live.nearNpc && !live.talking && consumeTalk()) {
      step.current += 1;
      if (step.current === 1) live.listen = "A rope glove. The fingers are still a little warm.";
      else if (step.current === 2) live.listen = "A scrap in the cuff. I rang it. Don't make a fuss.";
      else {
        markQuietKept();
        phase.current = "kept";
        bump((n) => n + 1);
        live.listen = "Under that: the horse fence, west side. The loop is off. The glove stays. He means to come back.";
        sfx.ok();
      }
    }
  });

  const kept = phase.current === "kept";
  const stirred = phase.current === "stir" || kept;
  if (!stirred) return null;

  return (
    <group>
      {!kept
        ? feet.map((p, i) => (
            <mesh key={i} position={[p.x, p.y, p.z]} rotation={[-Math.PI / 2, 0, i * 0.4]} receiveShadow>
              <circleGeometry args={[0.11, 6]} />
              {lamb("#5a4630", { kind: "dirt" })}
            </mesh>
          ))
        : null}
      <group position={[GLOVE.x, gy, GLOVE.z]}>
        {kept ? (
          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 0.7, 5]} />
            {lamb("#6a4a28", { kind: "wood" })}
          </mesh>
        ) : null}
        <mesh position={[0.02, kept ? 0.72 : 0.06, 0]} rotation={[0.4, 0.2, 0.8]} castShadow>
          <boxGeometry args={[0.16, 0.1, 0.22]} />
          {lamb("#8a5a32", { kind: "leather" })}
        </mesh>
      </group>
      {kept ? (
        <group position={[gateX, gateY, gateZ]}>
          <mesh position={[0.22, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 1.1, 5]} />
            {lamb("#5a4030", { kind: "wood" })}
          </mesh>
          <mesh position={[0.22, 1.15, 0.08]} rotation={[0.6, 0, 0.4]}>
            <torusGeometry args={[0.12, 0.025, 5, 8]} />
            {lamb("#c4a060")}
          </mesh>
        </group>
      ) : null}
    </group>
  );
}
