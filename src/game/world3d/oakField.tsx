import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { heightAt } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { useGame } from "../store";

/** Wide valley east of the town road. Open grass, a few marks, cliffs on the horizon. */
export const FIELD_AT = { x: 62, z: -16 };

export function OaksteadField() {
  const deer = useRef(0);
  const seen = useRef(false);
  useFrame((_, dt) => {
    deer.current += dt;
    if (seen.current) return;
    if (Math.hypot(live.x - FIELD_AT.x, live.z - FIELD_AT.z) < 28 && Math.hypot(live.x - 0, live.z + 108) > 70) {
      seen.current = true;
      if (!useGame.getState().quests?.map_field) {
        useGame.getState().setQuest("map_field", 1);
        live.banner = "Oakstead Field";
        live.bannerMs = 2200;
      }
    }
  });
  const y = heightAt(FIELD_AT.x, FIELD_AT.z);
  const ruin = heightAt(150, -70);
  const pond = heightAt(-70, 20);
  const mill = heightAt(180, 40);
  const sign = heightAt(16, -62);
  return (
    <group>
      <group position={[16, sign, -62]}>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.12, 1.4, 0.9]} />
          {lamb("#efe6d4")}
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.16, 0.7, 0.16]} />
          {lamb("#6a5340", { kind: "wood" })}
        </mesh>
      </group>
      <group position={[FIELD_AT.x, y, FIELD_AT.z]}>
        {[-18, 0, 22].map((x) => (
          <mesh key={x} position={[x, 0.15, 8]} rotation={[-Math.PI / 2, 0, 0.4]}>
            <planeGeometry args={[7, 3.2]} />
            {lamb("#7a9a48")}
          </mesh>
        ))}
      </group>
      <group position={[-70, pond, 20]}>
        <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[7.5, 14]} />
          {lamb("#3a88a8")}
        </mesh>
      </group>
      <group position={[150, ruin, -70]}>
        <mesh position={[-2.2, 0.7, 0]} castShadow>
          <boxGeometry args={[0.6, 1.4, 3.2]} />
          {lamb("#c8c0b0")}
        </mesh>
        <mesh position={[2.2, 0.45, 0.4]} castShadow>
          <boxGeometry args={[0.55, 0.9, 2.4]} />
          {lamb("#b0a898")}
        </mesh>
        <mesh position={[0.2, 0.35, 1.6]}>
          <boxGeometry args={[0.7, 0.45, 0.7]} />
          {lamb("#e8d48a")}
        </mesh>
      </group>
      <group position={[180, mill, 40]}>
        <mesh position={[0, 4.2, 0]} castShadow>
          <boxGeometry args={[2.2, 8.4, 2.2]} />
          {lamb("#d8d0c0")}
        </mesh>
        <mesh position={[0, 8.8, 0]} rotation={[0, 0.4, 0]}>
          <boxGeometry args={[7, 0.25, 0.8]} />
          {lamb("#8a5a3a", { kind: "wood" })}
        </mesh>
      </group>
      {[
        [90, -90],
        [-40, 55],
        [30, 70],
      ].map(([x, z], i) => (
        <group key={i} position={[x!, heightAt(x!, z!), z!]}>
          {[0, 1, 2, 3].map((n) => (
            <mesh key={n} position={[Math.cos(n + i) * 3.2, 1.6, Math.sin(n * 1.7) * 2.4]} castShadow>
              <coneGeometry args={[1.1, 3.2, 6]} />
              {lamb(n % 2 ? "#2f6a34" : "#3a7a40")}
            </mesh>
          ))}
        </group>
      ))}
      <group position={[100, heightAt(100, -10), -10]}>
        <mesh position={[0, 0.35, Math.sin(deer.current) * 2]}>
          <boxGeometry args={[0.35, 0.45, 0.9]} />
          {lamb("#8a6844")}
        </mesh>
      </group>
    </group>
  );
}
