import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, POND } from "./field";
import { live } from "./live";
import { lamb } from "./mats";
import { sfx } from "../audio";
import { useGame } from "../store";
import { consumeTalk } from "../input";

const BED = { x: -4, z: -136 };
const DOOR = { x: 16, z: -90 };
const POT = { x: -14, z: -102 };
const SIGN = { x: 24, z: -114 };
const HOUSE = { x: 39, z: -82 };
const BELL = { x: 2, z: -100 };
const WINDOW = { x: 38.2, z: -84.6 };

function q(id: string) {
  return (useGame.getState().quests?.[id] ?? 0) > 0;
}
function mark(id: string) {
  useGame.getState().setQuest(id, 1);
}
function free() {
  return !live.nearNpc && !live.nearHouse && !live.talking && !live.doorMath && !live.listen;
}

export function Curious() {
  const body = useRef<THREE.Group>(null);
  const phase = useRef<"sleep" | "up" | "run">("sleep");
  const pos = useRef({ x: BED.x, z: BED.z });
  const yell = useRef(0);
  const back = useRef(0);
  const knocks = useRef(0);
  const knockIdle = useRef(0);
  const signIdle = useRef(0);
  const potGone = useRef(q("curious-pot"));
  const potM = useRef<THREE.Mesh>(null);
  const signG = useRef<THREE.Group>(null);
  const signHits = useRef(q("curious-sign") ? 3 : 0);
  const rocks = useRef(new Set<string>());
  const rockN = useRef(0);
  const bombCool = useRef(0);
  const bellN = useRef(0);
  const bombN = useRef(0);
  const windowN = useRef(0);
  const doorM = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    bombCool.current = Math.max(0, bombCool.current - dt);
    const p = pos.current;

    if (phase.current === "sleep") {
      p.x += (BED.x - p.x) * Math.min(1, dt * 2);
      p.z += (BED.z - p.z) * Math.min(1, dt * 2);
      const d = Math.hypot(live.x - p.x, live.z - p.z);
      if (d < 1.45 && free() && consumeTalk()) {
        sfx.chime();
        live.listen = q("curious-blanket") ? "I remember you. I was having a very good dream." : "This guy seems to be asleep.";
      } else if (live.slash && Math.hypot(live.slash.x - p.x, live.slash.z - p.z) < 1.5) {
        live.listen = "Mmm. Five more minutes.";
      } else if (live.arrows.some((a) => a.kind === "knife" && Math.hypot(a.x - p.x, a.z - p.z) < 1.2)) {
        live.listen = "Ow. I was dreaming about soup.";
        phase.current = "up";
        yell.current = 1.4;
      } else if (live.blast && Math.hypot(live.blast.x - p.x, live.blast.z - p.z) < 3.6) {
        phase.current = "up";
        yell.current = 1.6;
        sfx.crow();
        live.listen = "WHO BOMBS A SLEEPING MAN?!";
        if (!q("curious-blanket")) {
          mark("curious-blanket");
          useGame.getState().addCoins(15);
          sfx.secret();
          live.listen = "WHO BOMBS A SLEEPING MAN?! He was asleep on a purse.";
        }
      }
    } else if (phase.current === "up") {
      yell.current -= dt;
      if (yell.current <= 0) phase.current = "run";
    } else {
      const tx = BED.x + 8;
      const tz = BED.z + 2;
      p.x += (tx - p.x) * Math.min(1, dt * 1.6);
      p.z += (tz - p.z) * Math.min(1, dt * 1.6);
      back.current += dt;
      if (Math.hypot(live.x - p.x, live.z - p.z) < 1.5 && free() && consumeTalk()) {
        live.listen = "I was asleep. I am choosing to stay that way.";
      }
      if (back.current > 8 && Math.hypot(live.x - BED.x, live.z - BED.z) > 6) {
        phase.current = "sleep";
        back.current = 0;
      }
    }

    if (body.current) {
      const y = heightAt(p.x, p.z);
      body.current.position.set(p.x, y, p.z);
      const up = phase.current !== "sleep";
      body.current.rotation.z = up ? 0 : Math.PI / 2;
      body.current.position.y = y + (up ? 0 : 0.15);
    }

    knockIdle.current += dt;
    const doorHit =
      (live.slash && Math.hypot(live.slash.x - DOOR.x, live.slash.z - DOOR.z) < 1.45) ||
      (Math.hypot(live.x - DOOR.x, live.z - DOOR.z) < 1.35 && free() && consumeTalk());
    if (doorHit && knockIdle.current > 0.45) {
      knockIdle.current = 0;
      knocks.current += 1;
      sfx.select();
      const n = knocks.current;
      if (n === 1) live.listen = "Who is it?";
      else if (n === 2) live.listen = "I'm serious.";
      else if (n === 3) live.listen = "GO AWAY!";
      else if (n === 4 && !q("curious-door")) {
        mark("curious-door");
        useGame.getState().addCoins(5);
        sfx.purse();
        live.listen = "Fine. Take this. And stop knocking.";
      } else live.listen = "They are not home. Probably.";
      if (doorM.current) doorM.current.rotation.y = n >= 4 ? 0.7 : 0;
    }

    if (!potGone.current) {
      const sword = live.slash && live.blade !== "knife" && Math.hypot(live.slash.x - POT.x, live.slash.z - POT.z) < 1.35;
      const boom = live.blast && Math.hypot(live.blast.x - POT.x, live.blast.z - POT.z) < 2.4;
      if (sword || boom) {
        potGone.current = true;
        mark("curious-pot");
        if (potM.current) potM.current.visible = false;
        sfx.smash();
        if (boom && !sword) {
          useGame.getState().addCoins(7);
          sfx.secret();
          live.listen = "You bombed a pot. It had coins. That feels excessive.";
        } else live.listen = "The pot was empty. It seems personal.";
      }
    }

    signIdle.current += dt;
    if (signG.current && signHits.current < 3 && live.slash && Math.hypot(live.slash.x - SIGN.x, live.slash.z - SIGN.z) < 1.4) {
      if (signIdle.current > 0.45) {
        signIdle.current = 0;
        signHits.current += 1;
        signG.current.rotation.y += 0.8;
        sfx.thud();
        if (signHits.current === 1) live.listen = "The sign says: do not hit the sign.";
        else if (signHits.current === 2) live.listen = "It now says: I warned you.";
        else {
          mark("curious-sign");
          signG.current.rotation.z = 1.2;
          useGame.getState().addCoins(1);
          sfx.chime();
          live.listen = "There was one coin nailed to the back.";
        }
      }
    }

    for (const t of live.throws) {
      if (t.kind !== "rock" || rocks.current.has(t.id)) continue;
      if (Math.hypot(t.x - HOUSE.x, t.z - HOUSE.z) < 3.2) {
        rocks.current.add(t.id);
        rockN.current += 1;
        sfx.thud();
        live.listen = rockN.current === 1 ? "Please don't throw rocks at my house." : "I JUST SAID DON'T.";
      }
    }

    const pondBlast = live.blast && Math.hypot(live.blast.x - POND.x, live.blast.z - POND.z) < POND.r + 2;
    const pondKnife = live.arrows.some((a) => a.kind === "knife" && Math.hypot(a.x - POND.x, a.z - POND.z) < POND.r);
    if ((pondBlast || pondKnife) && !q("curious-fish")) {
      mark("curious-fish");
      useGame.getState().addCoins(3);
      sfx.secret();
      live.listen = "A fish is offended. It throws three coins back.";
    }

    if (live.slash && Math.hypot(live.slash.x - BELL.x, live.slash.z - BELL.z) < 1.5 && bombCool.current <= 0) {
      bombCool.current = 1.4;
      bellN.current += 1;
      sfx.chime();
      live.listen = bellN.current >= 4 ? "I HEARD IT THE FIRST TIME." : "Was that lunch? It is not lunch.";
    }

    if (live.slash && Math.hypot(live.slash.x - WINDOW.x, live.slash.z - WINDOW.z) < 1.35 && bombCool.current <= 0) {
      bombCool.current = 0.8;
      windowN.current += 1;
      sfx.thud();
      live.listen = windowN.current === 1 ? "A face was in the window. Then it wasn't." : "The curtain shuts.";
    } else if (live.blast && Math.hypot(live.blast.x - WINDOW.x, live.blast.z - WINDOW.z) < 3 && bombCool.current <= 0) {
      bombCool.current = 2;
      sfx.crow();
      live.listen = "THE WINDOW.";
    }

    if (live.blast && bombCool.current <= 0) {
      const bx = live.blast.x;
      const bz = live.blast.z;
      const sleeper = Math.hypot(bx - p.x, bz - p.z) < 3.6 && phase.current !== "sleep";
      const farm = Math.hypot(bx - 50, bz + 98) < 10;
      const town = Math.hypot(bx, bz + 108) < 24;
      if (!sleeper && (farm || town)) {
        bombCool.current = 7;
        bombN.current += 1;
        const lines = farm
          ? ["Leave the hens alone!", "The hens will remember this."]
          : ["DO IT AGAIN!", "STOP MAKING THAT NOISE.", "Stand back.", "…Was that supposed to happen?"];
        live.listen = lines[bombN.current % lines.length]!;
      }
    }

    if (!q("curious-fire") && live.blade === "fire" && Math.hypot(live.x, live.z + 108) < 16 && !live.talking) {
      mark("curious-fire");
      live.listen = "Your sword is on fire. Wren would like you to take it outside.";
    }
  });

  const yBed = heightAt(BED.x, BED.z);
  const yDoor = heightAt(DOOR.x, DOOR.z);
  const yPot = heightAt(POT.x, POT.z);
  const ySign = heightAt(SIGN.x, SIGN.z);
  const yWin = heightAt(WINDOW.x, WINDOW.z);
  return (
    <group>
      <group ref={body} position={[BED.x, yBed, BED.z]}>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.42, 0.7, 0.28]} />
          {lamb("#3d4a62")}
        </mesh>
        <mesh position={[0, 0.78, 0]}>
          <boxGeometry args={[0.26, 0.26, 0.26]} />
          {lamb("#e6c2a0")}
        </mesh>
      </group>
      <group ref={doorM} position={[DOOR.x, yDoor + 1.05, DOOR.z]}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 1.9, 0.12]} />
          {lamb("#6b4428")}
        </mesh>
        <mesh position={[0.28, 0.05, 0.08]}>
          <sphereGeometry args={[0.06, 6, 5]} />
          {lamb("#e0b030")}
        </mesh>
      </group>
      <mesh ref={potM} position={[POT.x, yPot + 0.22, POT.z]} visible={!q("curious-pot")}>
        <cylinderGeometry args={[0.2, 0.24, 0.4, 7]} />
        {lamb("#a3533a")}
      </mesh>
      <group ref={signG} position={[SIGN.x, ySign, SIGN.z]}>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.08, 1.3, 0.08]} />
          {lamb("#5c4636")}
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[0.7, 0.38, 0.06]} />
          {lamb("#e6d3a1")}
        </mesh>
      </group>
      <mesh position={[WINDOW.x, yWin + 1.35, WINDOW.z]}>
        <boxGeometry args={[0.7, 0.55, 0.08]} />
        {lamb("#9ec8d8")}
      </mesh>
    </group>
  );
}
