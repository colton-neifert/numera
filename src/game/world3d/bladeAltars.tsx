import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SNOW_AT } from "./field";
import { sampleH } from "./lush/grid";
import { live } from "./live";
import { lamb } from "./mats";
import { sfx } from "../audio";
import { useGame } from "../store";
import { FireSword, IceSword, ThrowKnife } from "./heroes";

const KNIVES = { x: -63, z: -108 };
const ICE = { x: -68, z: -152 };
const FIRE = { x: SNOW_AT.x + 4, z: SNOW_AT.z - 6 };

function Pedestal({
  x,
  z,
  quest,
  blade,
  line,
  children,
}: {
  x: number;
  z: number;
  quest: string;
  blade: "fire" | "ice" | "knife";
  line: string;
  children: ReactNode;
}) {
  const g = useRef<THREE.Group>(null);
  const y = sampleH(x, z);
  useFrame(({ clock }) => {
    const owned = (useGame.getState().quests?.[quest] ?? 0) > 0;
    if (g.current) {
      g.current.visible = !owned;
      g.current.rotation.y = clock.elapsedTime * 0.6;
      g.current.position.y = y + 1.15 + Math.sin(clock.elapsedTime * 2) * 0.05;
    }
    if (owned) return;
    if (Math.hypot(live.x - x, live.z - z) < 1.15 && !live.talking) {
      useGame.getState().setQuest(quest, 1);
      live.blade = blade;
      live.holding = "sword";
      useGame.getState().holdTool("sword");
      sfx.get();
      live.listen = line;
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.5, 0.7, 8]} />
        {lamb("#8a8478")}
      </mesh>
      <group ref={g}>{children}</group>
    </group>
  );
}

export function BladeAltars() {
  return (
    <group>
      <Pedestal x={KNIVES.x} z={KNIVES.z} quest="knives" blade="knife" line="Throwing knives. Equip them, then swing.">
        <ThrowKnife />
      </Pedestal>
      <Pedestal x={ICE.x} z={ICE.z} quest="iceblade" blade="ice" line="An ice sword. Frost grew around the steel. Grove lizards will hate this.">
        <group scale={0.85}>
          <IceSword />
        </group>
      </Pedestal>
      <Pedestal x={FIRE.x} z={FIRE.z} quest="fireblade" blade="fire" line="A fire sword. The gray fangs of this snow will hate it.">
        <group scale={0.85}>
          <FireSword />
        </group>
      </Pedestal>
    </group>
  );
}
