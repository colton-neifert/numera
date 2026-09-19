import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_HOME, TREE_TRUNK, POND, pondSurfaceY, KEEP_Z, WELL_AT, LOOK_AT } from "./field";
import { live, duskAmt } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { consumeTalk as consumeTalkRaw } from "../input";

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  if (n > 0) {
    const c = useGame.getState().addCoins(n);
    if (c > 0) revealItem("coin");
    sfx.ok();
  }
}

function talkOk() {
  if (live.nearNpc || live.nearHouse || live.nearChest || live.nearHorse) return false;
  return consumeTalkRaw();
}

export function FeelPlay() {
  return (
    <group>
      <Homecoming />
      <WoodsEyes />
      <Memorial />
      <EmptySwing />
      <LampStar />
      <NightPond />
      <WellWhisper />
      <Crows />
      <ScareLook />
      <BramSock />
      <HouseQuiet />
      <NightTownMood />
      <LowHeart />
      <CaveBreath />
      <RainRoof />
      <Lullaby />
      <DreamWake />
      <FarRoad />
    </group>
  );
}

function Homecoming() {
  const away = useRef(0);
  useFrame((_, dt) => {
    const d = Math.hypot(live.x - TREE_HOME.x, live.z - TREE_HOME.z);
    if (live.house === "yours") {
      if (away.current > 50) {
        live.homecoming = true;
        live.listen = live.listen || "The lamp was on. They were waiting.";
        pay(0, "homecoming");
      }
      away.current = 0;
      return;
    }
    if (d > 70) away.current += dt;
    else if (d < 14 && away.current > 50) {
      live.homecoming = true;
      live.listen = "The tree looks smaller from here. Then it looks like home.";
      away.current = 0;
    }
  });
  return null;
}

function WoodsEyes() {
  const spots = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      x: TREE_TRUNK.x + Math.cos(i * 1.7) * (22 + (i % 5) * 8),
      z: TREE_TRUNK.z + Math.sin(i * 2.1) * (24 + (i % 4) * 9),
      blink: i * 0.4,
    })),
  );
  const gs = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, dt) => {
    const night = live.night && !live.house;
    spots.current.forEach((s, i) => {
      s.blink += dt;
      const g = gs.current[i];
      if (!g) return;
      const d = Math.hypot(live.x - s.x, live.z - s.z);
      const on = night && d > 6 && d < 38 && (s.blink % 3.2) > 0.18;
      g.visible = on;
      if (on && d < 14 && d > 8) live.listen = live.listen || "Eyes in the trees. They go out if you walk closer.";
    });
  });
  return (
    <group>
      {spots.current.map((s, i) => (
        <group
          key={i}
          ref={(el) => {
            gs.current[i] = el;
          }}
          position={[s.x, heightAt(s.x, s.z) + 1.15, s.z]}
          visible={false}
        >
          <mesh position={[-0.08, 0, 0]}>
            <sphereGeometry args={[0.045, 6, 5]} />
            <meshBasicMaterial color="#c42828" />
          </mesh>
          <mesh position={[0.08, 0, 0]}>
            <sphereGeometry args={[0.045, 6, 5]} />
            <meshBasicMaterial color="#c42828" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Memorial() {
  const x = TREE_TRUNK.x - 7.4;
  const z = TREE_TRUNK.z - 11.2;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.6) {
      if (live.carry === "flower") {
        live.carry = null;
        pay(6, "memflower");
        live.listen = "You put a flower down. The names stay.";
      } else if (talkOk()) {
        live.listen = "Oat. Reed. People who went in a box. Oakstead still says their names.";
        pay(4, "memorial");
      } else live.listen = live.listen || "A stone. Names. Someone left a dry flower.";
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.7, 1.1, 0.18]} />
        <meshLambertMaterial color="#6a6660" />
      </mesh>
      <mesh position={[0.18, 0.08, 0.16]} rotation={[-0.4, 0.2, 0.3]}>
        <sphereGeometry args={[0.08, 6, 5]} />
        <meshLambertMaterial color="#8a3a58" />
      </mesh>
    </group>
  );
}

function EmptySwing() {
  const x = TREE_TRUNK.x + 4.8;
  const z = TREE_TRUNK.z - 7.6;
  const y = heightAt(x, z);
  const seat = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (seat.current) seat.current.position.z = Math.sin(clock.elapsedTime * 0.7) * 0.18;
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.5) live.listen = live.listen || "A swing. Nobody is on it. The wind is.";
    if (d < 1.1 && live.sit) {
      pay(5, "sadswing");
      live.listen = "You sat. It creaked like it missed someone smaller.";
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[-0.55, 1.1, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 2.2, 5]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0.55, 1.1, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 2.2, 5]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh ref={seat} position={[0, 0.55, 0]}>
        <boxGeometry args={[0.9, 0.06, 0.28]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
    </group>
  );
}

function LampStar() {
  const plat = heightAt(TREE_HOME.x, TREE_HOME.z) + 6.2;
  const g = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const on = live.dusk > 0.35 || live.night;
    if (g.current) {
      g.current.intensity = on ? 1.8 + Math.sin(live.playT * 2.2) * 0.15 : 0;
      g.current.visible = on;
    }
    const d = Math.hypot(live.x - TREE_HOME.x, live.z - TREE_HOME.z);
    if (on && d > 18 && d < 40) live.listen = live.listen || "The lamp is on. Gran leaves it on so the tree is a star.";
  });
  return <pointLight ref={g} position={[TREE_HOME.x, plat, TREE_HOME.z]} color="#ffe0a0" distance={28} intensity={0} />;
}

function NightPond() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const on = live.night && !live.house;
    if (g.current) {
      g.current.visible = on;
      g.current.position.y = pondSurfaceY() + Math.sin(clock.elapsedTime * 1.4) * 0.06;
    }
    if (!on) return;
    const d = Math.hypot(live.x - POND.x, live.z - POND.z);
    if (d < 5 && live.stillT > 1.2) live.listen = live.listen || "The pond is too still. Something is under it. Then it isn’t.";
  });
  return (
    <group ref={g} position={[POND.x + 1.2, pondSurfaceY(), POND.z - 0.8]} visible={false}>
      <mesh rotation={[0.4, 0, 0.2]}>
        <sphereGeometry args={[0.14, 6, 5]} />
        <meshLambertMaterial color="#1a2420" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function WellWhisper() {
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (live.house) return;
    const d = Math.hypot(live.x - WELL_AT.x, live.z - WELL_AT.z);
    if (d < 1.6 && live.stillT > 0.8) {
      live.listen = live.listen || "A whisper from the well. It said a name. Then it didn’t.";
      if (cool.current <= 0) {
        cool.current = 8;
        sfx.whisper();
        pay(4, "wellwhisper");
      }
    }
  });
  return null;
}

function Crows() {
  const g = useRef<THREE.Group>(null);
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    const dusk = duskAmt();
    const on = dusk > 0.45 && !live.house;
    if (g.current) g.current.visible = on;
    if (on && Math.hypot(live.x, live.z - KEEP_Z) < 28 && cool.current <= 0) {
      cool.current = 11;
      sfx.crow();
    }
    if (on && Math.hypot(live.x, live.z - KEEP_Z) < 22)
      live.listen = live.listen || "Crows on the keep. They know who went in.";
  });
  return (
    <group ref={g} position={[2.4, heightAt(0, KEEP_Z - 18) + 9.2, KEEP_Z - 18]} visible={false}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[i * 0.55 - 1, 0, (i % 2) * 0.3]}>
          <sphereGeometry args={[0.08, 5, 4]} />
          <meshLambertMaterial color="#1a1410" />
        </mesh>
      ))}
    </group>
  );
}

function ScareLook() {
  const x = TREE_TRUNK.x - 12.4;
  const z = TREE_TRUNK.z + 8.2;
  useFrame(() => {
    if (!live.night || live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 3.2) live.listen = live.listen || "The scarecrow turned. It is looking at the road home.";
  });
  return null;
}

function BramSock() {
  const x = TREE_TRUNK.x + 0.9;
  const z = TREE_TRUNK.z + 1.1;
  const y = heightAt(x, z) + 2.4;
  useFrame(() => {
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 1.6)
      live.listen = live.listen || "A sock on a branch. Bram said he would throw it at a fang.";
  });
  return (
    <mesh position={[x, y, z]} rotation={[0.4, 0.2, 0.8]}>
      <capsuleGeometry args={[0.05, 0.16, 3, 5]} />
      <meshLambertMaterial color="#3a5a88" />
    </mesh>
  );
}

function HouseQuiet() {
  useFrame(() => {
    if (live.house !== "yours") return;
    if (live.night && live.stillT > 1.4)
      live.listen = live.listen || "The roof ticks. Gran’s chair creaks. Someone is pretending to sleep.";
    if (live.nearNpc === "gran" && live.night && live.stillT > 0.6 && talkOk()) {
      pay(5, "blanket");
      live.listen = "You pulled the blanket up. Gran did not open her eyes. She said thank you anyway.";
    }
    if (Math.abs(live.x) < 0.4 && live.z < -0.8)
      live.listen = live.listen || "A drawing on the wall. Four people. One is you. The lamp is a star.";
    if (live.x < -0.8 && live.z > 0.4)
      live.listen = live.listen || "Bram’s bed. A stick under it. He practiced being you.";
    if (live.x > 0.7 && live.z > 0.5)
      live.listen = live.listen || "Sela’s cup. Two flowers. One smooshed. One from the yard.";
    if (live.stillT > 2.2 && live.sit) {
      pay(4, "homesit");
      live.listen = "You sat. The vale got quieter. Soup would be good.";
    }
  });
  return (
    <group>
      <mesh position={[TREE_HOME.x - 0.2, heightAt(TREE_HOME.x, TREE_HOME.z) + 7.35, TREE_HOME.z - 1.5]}>
        <planeGeometry args={[0.38, 0.32]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}

function NightTownMood() {
  const ids = ["mira", "nora", "tallow", "pip", "pell", "cobb", "nell", "oak5"];
  useFrame(() => {
    if (live.house) return;
    if (live.night) {
      for (const id of ids) live.npcMood[id] = live.npcMood[id] || "worried";
    } else {
      for (const id of ids) if (live.npcMood[id] === "worried") delete live.npcMood[id];
    }
  });
  return null;
}

function LowHeart() {
  const beat = useRef(0);
  useFrame((_, dt) => {
    const hp = useGame.getState().hp;
    if (hp > 8 || live.house) {
      beat.current = 0;
      return;
    }
    beat.current += dt;
    if (beat.current > 0.72) {
      beat.current = 0;
      sfx.pulse();
    }
    if (hp <= 4) live.listen = live.listen || "Your chest is loud. Home is far.";
  });
  return null;
}

function CaveBreath() {
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!live.cave && !live.dungeon) return;
    t.current += dt;
    if (t.current > 4.5) {
      t.current = 0;
      sfx.whisper();
    }
    if (live.stillT > 1.5) live.listen = live.listen || "Drip. Then nothing. Then drip. Do not wait for the third.";
  });
  return null;
}

function RainRoof() {
  useFrame(() => {
    if (live.rainT <= 0) return;
    if (live.house === "yours") live.listen = live.listen || "Rain on the roof. Gran says that is the vale washing its face.";
    else if (!live.house && live.stillT > 1) live.listen = live.listen || "Rain. The vale looks like it is sorry.";
  });
  return null;
}

function Lullaby() {
  useFrame(() => {
    if (live.house !== "yours" || !live.ocarina || !live.night) return;
    pay(8, "lullaby");
    live.listen = "A quiet song. Bram stopped kicking the wall. Sela’s breathing got slow.";
  });
  return null;
}

function DreamWake() {
  const was = useRef(false);
  useFrame(() => {
    if (live.bed) was.current = true;
    if (was.current && !live.bed && live.house === "yours") {
      was.current = false;
      if (live.night) live.listen = "You dreamed the king’s wings. Then the lamp. Then soup.";
      else live.listen = "You dreamed the vale was small enough to hold.";
    }
  });
  return null;
}

function FarRoad() {
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - TREE_HOME.x, live.z - TREE_HOME.z);
    if (d > 120 && live.stillT > 1.8)
      live.listen = live.listen || "The tree is a speck. The lamp is still on. You could go back.";
    if (d > 40 && d < 55 && live.dusk > 0.5)
      live.listen = live.listen || "Dusk. The road home is the color of soup.";
    if (Math.hypot(live.x - LOOK_AT.x, live.z - LOOK_AT.z) < 3 && live.night)
      live.listen = live.listen || "From here the vale is dark. One light. Yours.";
  });
  return null;
}
