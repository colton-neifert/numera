import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { BONES, CAMP, CARAVAN, EV, STALL, eventClock, eventRows, eventState } from "./worldEvents";
import { BoneFolk } from "./skeletonMesh";

function Person({ y, color, h, wide }: { y: number; color: string; h: number; wide: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, h * 0.45, 0]}>
        <boxGeometry args={[wide, h, 0.28]} />
        {lamb(color)}
      </mesh>
      <mesh position={[0, h + 0.16, 0]}>
        <boxGeometry args={[0.26, 0.26, 0.22]} />
        {lamb("#e0b090")}
      </mesh>
    </group>
  );
}

export function WorldEvents() {
  const cart = useRef<THREE.Group>(null);
  const band = useRef<THREE.Group>(null);
  const bones = useRef<THREE.Group>(null);
  const arm = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const st = eventState("caravan");
    if (cart.current) {
      const show = st === EV.spawning || st === EV.active || st === EV.escalating || st === EV.failed;
      cart.current.visible = show;
      const walk = st === EV.active ? Math.min(8, eventClock("caravan") * 0.7) : st === EV.escalating ? 8 : 0;
      const y = heightAt(CARAVAN.x, CARAVAN.z + walk);
      cart.current.position.set(CARAVAN.x, y, CARAVAN.z + walk);
    }
    if (band.current) {
      const on = eventState("caravan") === EV.escalating;
      band.current.visible = on;
      const u = Math.min(1, eventClock("caravan") / 6);
      band.current.position.set(CARAVAN.x + 7 - u * 5, heightAt(CARAVAN.x + 4, CARAVAN.z + 8), CARAVAN.z + 8);
    }
    if (bones.current) {
      const b = eventState("bones");
      bones.current.visible = b === EV.spawning || b === EV.active;
      const y = heightAt(BONES.x, BONES.z);
      bones.current.position.set(BONES.x, y, BONES.z);
    }
    if (arm.current) arm.current.rotation.z = Math.sin(t * 6) * 0.6;
  });
  const smoke = eventState("caravan") === EV.spawning;
  const wreck = eventState("caravan") === EV.failed;
  const stall = eventState("caravan") === EV.aftermath;
  const campOn = eventState("camp") === EV.spawning || eventState("camp") === EV.active || eventState("camp") === EV.resolved;
  return (
    <group>
      <group ref={cart}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.5, 0.7, 2.2]} />
          {lamb(wreck ? "#5a4030" : "#8a5a32")}
        </mesh>
        <mesh position={[0.55, 0.22, 0.7]}>
          <cylinderGeometry args={[0.28, 0.28, 0.16, 6]} />
          {lamb("#222")}
        </mesh>
        {!wreck ? (
          <mesh position={[-0.55, 0.22, -0.7]}>
            <cylinderGeometry args={[0.28, 0.28, 0.16, 6]} />
            {lamb("#222")}
          </mesh>
        ) : null}
        <group position={[-1.1, 0, 0.4]}>
          <Person y={0} color="#6a5038" h={0.85} wide={0.5} />
        </group>
        <group position={[1.2, 0, -0.2]}>
          <Person y={0} color="#3e4a62" h={1.15} wide={0.36} />
        </group>
        <group position={[0.2, 0, 1.5]}>
          <Person y={0} color="#7a6848" h={1.05} wide={0.32} />
        </group>
        {smoke
          ? [0, 1, 2].map((i) => (
              <mesh key={i} position={[0.2, 2.2 + i * 0.8, -0.2]}>
                <boxGeometry args={[0.7 - i * 0.15, 0.6, 0.7 - i * 0.15]} />
                {lamb("#6a645c")}
              </mesh>
            ))
          : null}
      </group>
      <group ref={band}>
        <Person y={0} color="#2a2420" h={0.9} wide={0.4} />
        <group position={[1.1, 0, 0.4]}>
          <Person y={0} color="#241c18" h={0.8} wide={0.36} />
        </group>
      </group>
      {campOn
        ? [0, 1, 2, 3, 4].map((i) => {
            const x = CARAVAN.x + ((CAMP.x - CARAVAN.x) * (i + 1)) / 6;
            const z = CARAVAN.z + ((CAMP.z - CARAVAN.z) * (i + 1)) / 6;
            return (
              <mesh key={i} position={[x, heightAt(x, z) + 0.05, z]}>
                <boxGeometry args={[0.28, 0.06, 0.45]} />
                {lamb("#3a3228")}
              </mesh>
            );
          })
        : null}
      {campOn ? (
        <group position={[CAMP.x, heightAt(CAMP.x, CAMP.z), CAMP.z]}>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[1.6, 1.2, 1.4]} />
            {lamb("#6a5840")}
          </mesh>
        </group>
      ) : null}
      {stall ? (
        <group position={[STALL.x, heightAt(STALL.x, STALL.z), STALL.z]}>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[1.4, 1.2, 0.8]} />
            {lamb("#c45a3a")}
          </mesh>
          <group position={[0.9, 0, 0]}>
            <Person y={0} color="#6a5038" h={0.85} wide={0.5} />
          </group>
        </group>
      ) : null}
      <group ref={bones}>
        <group position={[-0.7, 0, 0]}>
          <BoneFolk horns walk={false} />
        </group>
        <group position={[0.75, 0, 0.15]}>
          <BoneFolk hat cloth="#3a4038" sword walk={false} />
        </group>
      </group>
      <EventDebug />
    </group>
  );
}

function EventDebug() {
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const el = document.createElement("div");
    el.style.cssText =
      "display:none;position:fixed;left:8px;bottom:8px;z-index:40;padding:6px 8px;background:rgba(12,10,8,0.82);color:#efe6d4;font:11px ui-monospace,monospace;white-space:pre;pointer-events:none";
    document.body.appendChild(el);
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Backquote") live.eventDebug = !live.eventDebug;
    };
    window.addEventListener("keydown", onKey);
    const id = window.setInterval(() => {
      const on = live.eventDebug;
      el.style.display = on ? "block" : "none";
      if (!on) return;
      el.textContent = eventRows()
        .map((r) => `${r.id}  state ${r.state}  t ${r.t.toFixed(1)}  realm ${live.realm || "surface"}`)
        .join("\n");
    }, 400);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("keydown", onKey);
      el.remove();
    };
  }, []);
  return null;
}
