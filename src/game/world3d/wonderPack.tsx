import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_TRUNK, TREE_HOME, TREE_HOUSE_H, TREE_HD, POND, KEEP_Z, FAIRY_RING, VX, VZ } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { consumeTalk as consumeTalkRaw } from "../input";
import { addTrapSpot } from "./dungeonTraps";
import { N64Nag } from "./n64";

/**
 * 25 real-life toys plus a reason to come back:
 * a new gift each calendar day, a little wonder every 30 minutes,
 * a big one every hour.
 */

const SAVE = "vale-return-v1";

type Save = { day: string; streak: number; playSec: number; half: number; hour: number };

function load(): Save {
  try {
    const raw = localStorage.getItem(SAVE);
    if (raw) return JSON.parse(raw) as Save;
  } catch {
    /* ignore */
  }
  return { day: "", streak: 0, playSec: 0, half: 0, hour: 0 };
}

function write(s: Save) {
  try {
    localStorage.setItem(SAVE, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
}

function talkOk() {
  if (live.nearNpc || live.nearHouse || live.nearChest || live.nearHorse) return false;
  return consumeTalkRaw();
}

function banner(text: string) {
  live.banner = text;
}

const T = TREE_TRUNK;

type Kind = "stomp" | "slash" | "talk" | "still" | "jump" | "wet" | "bump";

const SPOTS: { id: string; x: number; z: number; kind: Kind; near: string; done: string; n: number; mesh: string }[] = [
  { id: "w-pine", x: T.x + 5.2, z: T.z + 12.4, kind: "bump", near: "A pinecone.", done: "It rolled.", n: 5, mesh: "pine" },
  { id: "w-can", x: T.x + 8.6, z: T.z + 14.2, kind: "slash", near: "An old can.", done: "The can rang.", n: 6, mesh: "can" },
  { id: "w-stump", x: T.x - 6.4, z: T.z + 4.2, kind: "slash", near: "A stump. You can count the rings.", done: "Forty rings. The oak is old.", n: 6, mesh: "stump" },
  { id: "w-dandy", x: T.x + 3.2, z: T.z - 6.8, kind: "stomp", near: "A dandelion.", done: "The seeds went. Make a wish.", n: 5, mesh: "dandy" },
  { id: "w-shroom", x: T.x - 8.2, z: T.z + 9.1, kind: "talk", near: "A mushroom. Look under it.", done: "A bug ran. And a rupee.", n: 7, mesh: "shroom" },
  { id: "w-ant", x: T.x + 11.2, z: T.z + 2.4, kind: "still", near: "Ants in a line. They are busy.", done: "You followed. They had a crumb of gold.", n: 7, mesh: "ant" },
  { id: "w-bird", x: T.x - 3.4, z: T.z - 4.6, kind: "jump", near: "A birdhouse.", done: "A feather. They did not mind.", n: 6, mesh: "bird" },
  { id: "w-top", x: T.x + 7.4, z: T.z - 3.2, kind: "slash", near: "A wooden top.", done: "It spun. Then it fell.", n: 5, mesh: "top" },
  { id: "w-boat", x: POND.x + 8.4, z: POND.z + 6.2, kind: "wet", near: "A paper boat.", done: "It floated. Then it sank. That is what they do.", n: 6, mesh: "boat" },
  { id: "w-berry", x: T.x - 10.4, z: T.z + 16.2, kind: "talk", near: "Berries. Some are ripe.", done: "Sour. You ate one anyway.", n: 5, mesh: "berry" },
  { id: "w-wood", x: T.x + 16.2, z: T.z + 6.4, kind: "jump", near: "A woodpile.", done: "You climbed it. Gran stacks these.", n: 6, mesh: "wood" },
  { id: "w-shoe", x: TREE_HOME.x, z: TREE_HOME.z + TREE_HD, kind: "talk", near: "A horseshoe over the door.", done: "Gran says it keeps luck in.", n: 6, mesh: "shoe" },
  { id: "w-tent", x: T.x - 14.2, z: T.z + 8.4, kind: "still", near: "A blanket tent.", done: "You hid. The vale got quiet.", n: 7, mesh: "tent" },
  { id: "w-kite", x: T.x + 2.2, z: T.z + 18.6, kind: "slash", near: "A kite in the branches.", done: "You got it down. The tail was stuck.", n: 8, mesh: "kite" },
  { id: "w-worm", x: T.x + 4.8, z: T.z + 7.2, kind: "slash", near: "Soft dirt. A stick would dig.", done: "A worm. Fish like those.", n: 6, mesh: "dirt" },
  { id: "w-hop", x: T.x + 9.4, z: T.z + 8.8, kind: "jump", near: "Squares in the dirt.", done: "Hopscotch. You did all the squares.", n: 6, mesh: "hop" },
  { id: "w-dew", x: T.x - 2.2, z: T.z + 13.4, kind: "still", near: "Dew on the grass.", done: "You caught a drop. It was cold.", n: 5, mesh: "dew" },
  { id: "w-daisy", x: T.x + 13.4, z: T.z - 2.8, kind: "talk", near: "Daisies.", done: "A chain. It does not last. That is fine.", n: 5, mesh: "daisy" },
  { id: "w-bug", x: T.x - 5.6, z: T.z + 11.8, kind: "slash", near: "A flat rock.", done: "A bug ran out. You put the rock back.", n: 6, mesh: "rock" },
  { id: "w-mud", x: T.x + 6.8, z: T.z + 20.4, kind: "stomp", near: "Mud.", done: "A mud pie. Gran will not want this one.", n: 5, mesh: "mud" },
  { id: "w-barrow", x: VX + 10.4, z: VZ + 6.2, kind: "bump", near: "A wheelbarrow.", done: "You rode it. It has one wheel. It showed.", n: 7, mesh: "barrow" },
  { id: "w-hat", x: VX + 22.4, z: VZ + 18.2, kind: "talk", near: "The scarecrow’s hat.", done: "You put it back. The crows noticed.", n: 6, mesh: "hat" },
  { id: "w-split", x: T.x + 18.8, z: T.z + 11.2, kind: "slash", near: "Firewood to split.", done: "One log. Two. Gran can stack them.", n: 6, mesh: "split" },
  { id: "w-echo", x: T.x - 12.6, z: T.z - 2.4, kind: "talk", near: "A hollow in the hill.", done: "You yelled. It yelled back. Same words.", n: 7, mesh: "echo" },
  { id: "w-log", x: T.x + 1.2, z: T.z + 22.6, kind: "jump", near: "A fallen log.", done: "You walked it. Did not fall. Almost.", n: 6, mesh: "log" },
];

export function WonderPack() {
  return (
    <group>
      <ReturnLoop />
      {SPOTS.map((s) => (
        <WonderSpot key={s.id} s={s} />
      ))}
      <SkyShow />
    </group>
  );
}

function ReturnLoop() {
  const s = useRef(load());
  const duskOn = useRef(false);
  useEffect(() => {
    const cur = s.current;
    const d = today();
    if (cur.day !== d) {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const y = `${yest.getFullYear()}-${yest.getMonth() + 1}-${yest.getDate()}`;
      cur.streak = cur.day === y ? cur.streak + 1 : 1;
      cur.day = d;
      live.streak = cur.streak;
      const n = 12 + Math.min(20, cur.streak * 3);
      useGame.getState().addCoins(n);
      revealItem("coin");
      sfx.chime();
      const gifts = [
        "Gran left pie. Come back tomorrow. She bakes again.",
        "Ash wrote. He says the vale missed you.",
        "A flower opened by the oak overnight.",
        "A merchant is in town today only.",
        "Something shiny slept in the grass.",
        "Prints by the path. Small. Soft.",
        "The pond has a skin of ice this morning.",
      ];
      banner(gifts[(cur.streak - 1) % gifts.length]!);
      live.listen = `Day ${cur.streak}. The vale kept a seat for you.`;
      write(cur);
    } else {
      live.streak = cur.streak;
    }
  }, []);
  useFrame((_, dt) => {
    if (live.house || live.paused) return;
    const cur = s.current;
    cur.playSec += dt;
    if (cur.playSec - cur.half * 1800 >= 1800) {
      cur.half += 1;
      littleWonder(cur.half);
      write(cur);
    }
    if (cur.playSec - cur.hour * 3600 >= 3600) {
      cur.hour += 1;
      bigWonder(cur.hour);
      write(cur);
    }
    const dusk = live.dusk > 0.55;
    if (dusk && !duskOn.current) {
      duskOn.current = true;
      banner("Lanterns. The vale is going to sleep.");
      pay(6, `dusk-${cur.day}`);
    }
    if (!dusk && duskOn.current) {
      duskOn.current = false;
      banner("Morning. Dew. Birds.");
      pay(6, `dawn-${cur.day}-${Math.floor(cur.playSec)}`);
    }
    if (live.playT > 0 && Math.floor(live.playT) % 20 === 0) write(cur);
  });
  return null;
}

const LITTLE = [
  "A star fell. Make a wish.",
  "Frogs started. The pond is loud.",
  "Someone is baking. You can smell it.",
  "A sheep is stuck in the fence.",
  "A bottle on the shore.",
  "Butterflies. They know a way.",
  "The wind has a kite.",
  "A kid dropped a ball.",
  "Dew rupees on the grass.",
  "Mail. Someone wrote you.",
];

const BIG = [
  "The King is in the air. He is looking.",
  "Stars are falling. The vale is gold.",
  "A rainbow over the pond.",
  "A chest on the lookout. It was not there.",
  "The fairy ring is awake.",
  "Balloons. A whole sky of them.",
  "A giant cucco. It is not mad. Yet.",
  "The moon is close. You could almost climb it.",
  "A roar from the castle. The fangs froze.",
  "Gold beetles. They do not bite. They shine.",
];

function littleWonder(n: number) {
  banner(LITTLE[(n - 1) % LITTLE.length]!);
  pay(10, `little-${n}`);
  live.eventKind = "little";
  live.eventT = 12;
  sfx.chime();
}

function bigWonder(n: number) {
  banner(BIG[(n - 1) % BIG.length]!);
  pay(25, `hour-${n}`);
  live.eventKind = n % 2 === 1 ? "king" : "stars";
  live.eventT = 18;
  sfx.chime();
  sfx.ok();
}

function WonderSpot({ s }: { s: (typeof SPOTS)[number] }) {
  const got = useRef(false);
  const g = useRef<THREE.Group>(null);
  const y = heightAt(s.x, s.z);
  useFrame(() => {
    if (live.house || got.current) return;
    const d = Math.hypot(live.x - s.x, live.z - s.z);
    if (d > 2.4) return;
    live.listen = live.listen || s.near;
    const hit =
      (s.kind === "stomp" && (live.stompT > 0 || !live.grounded) && d < 1.2) ||
      (s.kind === "slash" && live.slash && Math.hypot(live.slash.x - s.x, live.slash.z - s.z) < 1.5) ||
      (s.kind === "talk" && d < 1.2 && talkOk()) ||
      (s.kind === "still" && d < 1.15 && live.stillT > 0.7) ||
      (s.kind === "jump" && d < 1.2 && (!live.grounded || live.stompT > 0)) ||
      (s.kind === "wet" && d < 1.3 && live.wetT > 0.4) ||
      (s.kind === "bump" && d < 1.05 && Math.abs(live.speed) > 2.2);
    if (s.kind === "jump" && (s.mesh === "wood" || s.mesh === "log")) addTrapSpot(s.x, s.z, 0.7, s.mesh === "wood" ? 0.85 : 0.45);
    if (hit) {
      got.current = true;
      pay(s.n, s.id);
      live.listen = s.done;
      if (g.current && (s.mesh === "dandy" || s.mesh === "kite" || s.mesh === "pine")) g.current.visible = false;
    }
  }, -2);
  return (
    <group ref={g} position={[s.x, y, s.z]}>
      <SpotMesh mesh={s.mesh} />
    </group>
  );
}

function SpotMesh({ mesh }: { mesh: string }) {
  if (mesh === "pine")
    return (
      <mesh position={[0, 0.08, 0]} rotation={[0.4, 0, 0.2]}>
        <coneGeometry args={[0.1, 0.22, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    );
  if (mesh === "can")
    return (
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.22, 8]} />
        <meshLambertMaterial color="#8a8a78" />
      </mesh>
    );
  if (mesh === "stump")
    return (
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.42, 0.48, 0.36, 8]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    );
  if (mesh === "dandy")
    return (
      <group>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.015, 0.02, 0.36, 4]} />
          <meshLambertMaterial color="#3a7a28" />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshLambertMaterial color="#f4f0d8" />
        </mesh>
      </group>
    );
  if (mesh === "shroom")
    return (
      <group>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.22, 6]} />
          <meshLambertMaterial color="#efe4cc" />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <sphereGeometry args={[0.16, 8, 5]} />
          <meshLambertMaterial color="#c42828" />
        </mesh>
      </group>
    );
  if (mesh === "ant")
    return (
      <group>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[i * 0.22, 0.03, i * 0.04]}>
            <sphereGeometry args={[0.04, 5, 4]} />
            <meshLambertMaterial color="#1a120c" />
          </mesh>
        ))}
      </group>
    );
  if (mesh === "bird")
    return (
      <mesh position={[0, 1.35, 0]}>
        <boxGeometry args={[0.35, 0.28, 0.28]} />
        <meshLambertMaterial color="#8a5a28" />
      </mesh>
    );
  if (mesh === "top")
    return (
      <mesh position={[0, 0.12, 0]}>
        <coneGeometry args={[0.12, 0.22, 8]} />
        <meshLambertMaterial color="#c45c28" />
      </mesh>
    );
  if (mesh === "boat")
    return (
      <mesh position={[0, 0.06, 0]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.45, 0.06, 0.22]} />
        <meshLambertMaterial color="#efe4cc" />
      </mesh>
    );
  if (mesh === "berry")
    return (
      <group>
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.35, 6, 5]} />
          <meshLambertMaterial color="#2a6a32" />
        </mesh>
        <mesh position={[0.12, 0.5, 0.1]}>
          <sphereGeometry args={[0.06, 5, 4]} />
          <meshLambertMaterial color="#8a1a28" />
        </mesh>
      </group>
    );
  if (mesh === "wood")
    return (
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.1, 0.9, 0.7]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
    );
  if (mesh === "shoe")
    return (
      <mesh position={[0, 2.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.12, 0.03, 6, 10]} />
        <meshLambertMaterial color="#8a8a78" />
      </mesh>
    );
  if (mesh === "tent")
    return (
      <mesh position={[0, 0.55, 0]} rotation={[0, 0.2, 0]}>
        <coneGeometry args={[0.7, 1.1, 4]} />
        <meshLambertMaterial color="#6a8aaa" />
      </mesh>
    );
  if (mesh === "kite")
    return (
      <mesh position={[0, 2.2, 0]} rotation={[0.3, 0.4, 0.2]}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshLambertMaterial color="#c42828" />
      </mesh>
    );
  if (mesh === "dirt")
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 8]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
    );
  if (mesh === "hop")
    return (
      <group>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.02, i * 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.45, 0.45]} />
            <meshLambertMaterial color="#c9a227" transparent opacity={0.45} />
          </mesh>
        ))}
      </group>
    );
  if (mesh === "dew")
    return (
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.06, 6, 5]} />
        <meshLambertMaterial color="#a8d8e8" transparent opacity={0.7} />
      </mesh>
    );
  if (mesh === "daisy")
    return (
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.1, 7, 5]} />
        <meshLambertMaterial color="#f4f0d8" />
      </mesh>
    );
  if (mesh === "rock")
    return (
      <mesh position={[0, 0.08, 0]} rotation={[0.2, 0.4, 0]}>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshLambertMaterial color="#7a7268" />
      </mesh>
    );
  if (mesh === "mud")
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 10]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
    );
  if (mesh === "barrow")
    return (
      <group>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[1.1, 0.35, 0.55]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
        <mesh position={[0.55, 0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 0.08, 8]} />
          <meshLambertMaterial color="#3a3228" />
        </mesh>
      </group>
    );
  if (mesh === "hat")
    return (
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.22, 0.18, 0.16, 8]} />
        <meshLambertMaterial color="#3a3228" />
      </mesh>
    );
  if (mesh === "split")
    return (
      <mesh position={[0, 0.22, 0]} rotation={[0, 0.3, 0.1]}>
        <cylinderGeometry args={[0.12, 0.14, 0.7, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    );
  if (mesh === "echo")
    return (
      <mesh position={[0, 0.55, 0]} rotation={[0.3, 0, 0]}>
        <dodecahedronGeometry args={[0.55, 0]} />
        <meshLambertMaterial color="#4a4034" />
      </mesh>
    );
  return (
    <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.18, 0.2, 1.8, 7]} />
      <meshLambertMaterial color="#5a3a22" />
    </mesh>
  );
}

function SkyShow() {
  const king = useRef<THREE.Group>(null);
  const pose = useRef<"idle" | "walk" | "yell" | "gallop">("gallop");
  const stars = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      x: (i % 6) * 8 - 20,
      y: 14 + (i % 3) * 3,
      z: Math.floor(i / 6) * 10 - 8,
    })),
  );
  useFrame((_, dt) => {
    live.eventT = Math.max(0, (live.eventT || 0) - dt);
    if (!live.eventKind || live.eventT <= 0) {
      if (king.current) king.current.visible = false;
      return;
    }
    if (live.eventKind === "king" && king.current) {
      king.current.visible = true;
      const u = 1 - live.eventT / 18;
      king.current.position.set(VX + 8 - u * 40, 16 + Math.sin(u * 6) * 2.4, KEEP_Z - 40 - u * 80);
      king.current.rotation.y = 1.2;
      pose.current = "gallop";
    } else if (king.current) king.current.visible = false;
    if (live.eventKind === "stars") {
      const f = FAIRY_RING;
      if (Math.hypot(live.x - f.x, live.z - f.z) < 4) pay(12, "fairyring-hour");
    }
  });
  const showStars = live.eventKind === "stars" && live.eventT > 0;
  return (
    <group>
      <group ref={king} visible={false}>
        <N64Nag poseRef={pose} seed={2} />
      </group>
      {showStars
        ? stars.current.map((p, i) => (
            <mesh key={i} position={[live.x + p.x, p.y, live.z + p.z]}>
              <octahedronGeometry args={[0.12, 0]} />
              <meshLambertMaterial color="#f4e878" emissive="#f4e878" emissiveIntensity={1.2} />
            </mesh>
          ))
        : null}
    </group>
  );
}
