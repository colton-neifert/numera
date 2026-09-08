import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, POND, VX, VZ } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { consumeTalk } from "../input";
import { useGame } from "../store";
import { hasMystery, setMystery, rollMystery, hashSeed } from "../mystery";
import { revealItem } from "../items";
import { N64Person, RupeeMesh, HeartContainerMesh, HERO_LOOK } from "./actors";
import { puffAt } from "./fx";
import type { WorldId } from "../types";

const CHESTS = [
  { x: VX + 18, z: VZ - 22 },
  { x: POND.x + 14, z: POND.z - 9 },
  { x: -36, z: VZ + 40 },
  { x: 42, z: VZ + 28 },
];

export function MysteryBoot() {
  const mystery = useGame((s) => s.mystery);
  const name = useGame((s) => s.heroName);
  useEffect(() => {
    if (mystery?.on?.length) {
      setMystery(mystery);
      return;
    }
    const m = rollMystery(hashSeed(name || "Scholar", 11));
    useGame.setState({ mystery: m });
    setMystery(m);
  }, [mystery, name]);
  return null;
}

export function MysteryLayer({ worldId }: { worldId: WorldId }) {
  if (worldId !== "meadow") return <WeatherOnly />;
  return (
    <group>
      <WeatherOnly />
      <ShiftingChest />
      <NightLantern />
      <Merchant />
      <HiddenHole />
      <DistantBeast />
      <GhostBench />
      <RedFox />
      <LostLetter />
      <MoonRupee />
      <Stranger />
      <Starfall />
      <WhiteStag />
      <EchoLure />
      <RookBloom />
      <RareBug />
      <KidPair />
      <OwlWatch />
      <CrackedWall />
      <SecondPath />
    </group>
  );
}

function WeatherOnly() {
  useFrame((_, dt) => {
    const { h } = clock();
    if (hasMystery("stormNights") && live.night && !live.house && live.rainT < 2) live.rainT = 8;
    if (hasMystery("fogMornings") && h >= 6 && h < 10 && !live.night && !live.house) live.fogT = Math.min(1, (live.fogT ?? 0) + dt * 0.15);
    else live.fogT = Math.max(0, (live.fogT ?? 0) - dt * 0.12);
    if (hasMystery("windDays") && !live.night && !live.house) live.windT = 1;
    else live.windT = Math.max(0, (live.windT ?? 0) - dt);
    if (hasMystery("wellWhisper") && !live.house && Math.hypot(live.x - VX + 8, live.z - VZ + 6) < 6 && Math.random() < dt * 0.4) {
      if (Math.random() < 0.2) live.hint = "A whisper from the stones.";
      sfx.cricket();
    }
  });
  return live.rainT > 0 && !live.house ? <RainVeil /> : null;
}

function clock() {
  const t = (live.day * 24 + 6) % 24;
  return { h: Math.floor(t) };
}

function RainVeil() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const n = 420;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      a[i * 3] = (Math.random() - 0.5) * 46;
      a[i * 3 + 1] = Math.random() * 18;
      a[i * 3 + 2] = (Math.random() - 0.5) * 46;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return g;
  }, []);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.set(live.x, live.y, live.z);
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - dt * 18;
      if (y < 0) y = 16 + Math.random() * 4;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial color="#c8dce8" size={0.07} transparent opacity={0.55} depthWrite={false} />
    </points>
  );
}

function near(x: number, z: number, r: number) {
  return Math.hypot(live.x - x, live.z - z) < r;
}

function ShiftingChest() {
  const m = useGame((s) => s.mystery);
  const taken = useGame((s) => (s.seenItems ?? []).includes("s:m-chest"));
  if (!hasMystery("shiftingChest") || taken || !m) return null;
  const p = CHESTS[m.chest % CHESTS.length]!;
  return (
    <SecretPickup
      id="m-chest"
      x={p.x}
      z={p.z}
      kind="rupee"
      n={20}
      hint="The box was not here yesterday."
    />
  );
}

function SecretPickup({
  id,
  x,
  z,
  kind,
  n,
  hint,
}: {
  id: string;
  x: number;
  z: number;
  kind: "rupee" | "heart";
  n: number;
  hint: string;
}) {
  const gone = useRef((useGame.getState().seenItems ?? []).includes(`s:${id}`));
  useFrame(() => {
    if (gone.current || live.house || live.cave) return;
    if (!near(x, z, 1.15)) return;
    gone.current = true;
    useGame.getState().discover(`s:${id}`);
    if (kind === "rupee") {
      const got = useGame.getState().addCoins(n);
      if (got > 0) revealItem("coin");
    } else {
      useGame.setState({ hp: Math.min(useGame.getState().hp + 4, 80) });
      revealItem("heart");
    }
    live.hint = hint;
    sfx.chime();
    puffAt(x, z, heightAt(x, z) + 0.5, true);
  });
  if (gone.current) return null;
  const y = heightAt(x, z) + 0.55;
  return (
    <group position={[x, y, z]}>
      {kind === "rupee" ? <RupeeMesh tint="gold" scale={1.2} /> : <HeartContainerMesh scale={1.1} />}
    </group>
  );
}

function NightLantern() {
  if (!hasMystery("nightLantern")) return null;
  const t = live.day * Math.PI * 2;
  const x = VX + Math.sin(t * 0.7) * 22;
  const z = VZ + 12 + Math.cos(t * 0.7) * 18;
  if (!live.night || live.house) return null;
  return (
    <group position={[x, heightAt(x, z) + 1.6, z]}>
      <pointLight color="#ffd080" intensity={3.2} distance={8} />
      <mesh>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshBasicMaterial color="#ffe8a0" />
      </mesh>
    </group>
  );
}

function Merchant() {
  const m = useGame((s) => s.mystery);
  const sold = useRef((useGame.getState().seenItems ?? []).includes("s:m-merch"));
  if (!hasMystery("merchant") || !m) return null;
  const { h } = clock();
  const here = Math.abs(h - m.merchantHour) < 3;
  const x = VX + 10;
  const z = VZ + 16;
  useFrame(() => {
    if (!here || sold.current || live.house) return;
    if (!near(x, z, 2.2)) return;
    live.hint = "A traveler. Talk · F";
    if (consumeTalk()) {
      const coins = useGame.getState().coins;
      if (coins >= 8) {
        useGame.setState({ coins: coins - 8 });
        useGame.getState().addApple();
        revealItem("apple");
        sold.current = true;
        useGame.getState().discover("s:m-merch");
        live.hint = "They sold you a sweet. Then they packed up.";
        sfx.buy();
      } else live.hint = "Eight rupees, they said. Then they looked away.";
    }
  });
  if (!here || sold.current) return null;
  return <N64Person look={{ ...HERO_LOOK, tunic: "#3a5a78", sash: "#c9a227" }} x={x} z={z} seed={91} facing={2.2} stay id="m-merch" />;
}

function HiddenHole() {
  if (!hasMystery("hiddenCave") && !hasMystery("hollowDoor")) return null;
  const x = hasMystery("hollowDoor") ? VX - 48 : -22;
  const z = hasMystery("hollowDoor") ? VZ + 36 : VZ - 40;
  const taken = useRef((useGame.getState().seenItems ?? []).includes("s:m-hole"));
  useFrame(() => {
    if (taken.current || live.house) return;
    if (!near(x, z, 1.4)) return;
    live.hint = "A dark mouth in the hill.";
    if (consumeTalk() || near(x, z, 0.7)) {
      taken.current = true;
      useGame.getState().discover("s:m-hole");
      const n = useGame.getState().addCoins(15);
      if (n > 0) revealItem("coin");
      live.hint = "Something glittered in the dark.";
      sfx.chime();
    }
  });
  return (
    <mesh position={[x, heightAt(x, z) + 0.4, z]} rotation={[-0.4, 0.6, 0]}>
      <circleGeometry args={[0.85, 10]} />
      <meshLambertMaterial color="#0a0806" />
    </mesh>
  );
}

function DistantBeast() {
  if (!hasMystery("distantBeast") && !hasMystery("whiteStag")) return null;
  const rare = hasMystery("whiteStag");
  const t = live.playT * (rare ? 0.12 : 0.2);
  const x = live.x - 38 + Math.sin(t) * 8;
  const z = live.z - 46 + Math.cos(t * 0.7) * 10;
  useFrame((_, dt) => {
    if (live.house || live.night === rare) return;
    if (near(x, z, 14) && Math.random() < dt * 0.35) live.hint = rare ? "A pale shape in the trees." : "Something big moved far off.";
  });
  return (
    <mesh position={[x, heightAt(x, z) + (rare ? 1.6 : 2.1), z]}>
      <sphereGeometry args={[rare ? 0.55 : 0.9, 6, 5]} />
      <meshLambertMaterial color={rare ? "#efe6d4" : "#2a241c"} />
    </mesh>
  );
}

function GhostBench() {
  if (!hasMystery("ghostBench") || !live.night || live.house) return null;
  const x = VX - 6;
  const z = VZ - 8;
  useFrame(() => {
    if (near(x, z, 2.4)) live.hint = "Someone was sitting here. The wood is still warm.";
  });
  return (
    <mesh position={[x, heightAt(x, z) + 1.1, z]}>
      <sphereGeometry args={[0.22, 8, 6]} />
      <meshBasicMaterial color="#d8e8ff" transparent opacity={0.45} />
    </mesh>
  );
}

function RedFox() {
  if (!hasMystery("redFox") || live.night || live.house) return null;
  const t = live.playT * 0.35;
  const x = VX + 28 + Math.sin(t) * 16;
  const z = VZ + 8 + Math.cos(t * 1.3) * 12;
  return (
    <mesh position={[x, heightAt(x, z) + 0.35, z]}>
      <sphereGeometry args={[0.22, 6, 5]} />
      <meshLambertMaterial color="#c45c28" />
    </mesh>
  );
}

function LostLetter() {
  if (!hasMystery("lostLetter")) return null;
  return (
    <SecretPickup
      id="m-letter"
      x={VX + 6}
      z={VZ - 18}
      kind="rupee"
      n={5}
      hint="A folded note. The ink just said: remember the well."
    />
  );
}

function MoonRupee() {
  if (!hasMystery("moonRupee") || !live.night) return null;
  return <SecretPickup id="m-moon" x={POND.x - 6} z={POND.z + 7} kind="rupee" n={50} hint="It only shines when the moon does." />;
}

function Stranger() {
  const helped = useGame((s) => s.mystery?.helped);
  if (!hasMystery("stranger")) return null;
  const x = VX - 20;
  const z = VZ + 22;
  useFrame(() => {
    if (live.house || helped) return;
    if (!near(x, z, 2.2)) return;
    live.hint = "They look lost. Talk · F";
    if (consumeTalk()) {
      const cur = useGame.getState().mystery;
      if (cur) useGame.setState({ mystery: { ...cur, helped: true } });
      live.hint = "You pointed the way. They pressed a rupee in your hand.";
      useGame.getState().addCoins(10);
      revealItem("coin");
      sfx.ok();
    }
  });
  if (helped) return null;
  return <N64Person look={{ ...HERO_LOOK, tunic: "#5a4860", hair: "#2a2018" }} x={x} z={z} seed={44} facing={-0.4} stay id="m-stranger" />;
}

function Starfall() {
  if (!hasMystery("starfall") || !live.night || live.house) return null;
  return <SecretPickup id="m-star" x={VX + 52} z={VZ - 30} kind="heart" n={1} hint="A star hit the grass. Warm." />;
}

function WhiteStag() {
  return null;
}

function EchoLure() {
  const aim = useRef({ x: VX + 32, z: VZ - 44 });
  const found = useRef((useGame.getState().seenItems ?? []).includes("s:m-echo"));
  useFrame((_, dt) => {
    if (!hasMystery("echoSteps") || found.current || live.house) return;
    const d = Math.hypot(live.x - aim.current.x, live.z - aim.current.z);
    if (d < 22 && Math.random() < dt * 0.55) {
      sfx.cricket();
      if (d < 12) live.hint = "A sound again. Closer.";
    }
    if (d < 1.2) {
      found.current = true;
      useGame.getState().discover("s:m-echo");
      useGame.getState().addCoins(25);
      revealItem("coin");
      live.hint = "The sound was a rupee, tapping stone.";
      sfx.chime();
    }
  });
  return null;
}

function RookBloom() {
  const rook = useGame((s) => (s.defeated.meadow ?? []).includes("rook") || (s.worldsCleared ?? []).length > 0);
  if (!hasMystery("afterRookBloom") || !rook) return null;
  const spots = [
    [VX + 4, VZ + 6],
    [VX - 5, VZ + 9],
    [VX + 8, VZ - 2],
  ] as const;
  return (
    <group>
      {spots.map(([x, z], i) => (
        <mesh key={i} position={[x, heightAt(x, z) + 0.2, z]}>
          <sphereGeometry args={[0.12, 6, 5]} />
          <meshLambertMaterial color="#d478a0" emissive="#a04070" emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function RareBug() {
  if (!hasMystery("rareBug")) return null;
  return <SecretPickup id="m-bug" x={VX - 14} z={VZ + 48} kind="rupee" n={100} hint="A gold beetle. It left a rupee and flew." />;
}

function KidPair() {
  if (!hasMystery("kidPair") || live.night) return null;
  return (
    <>
      <N64Person look={{ ...HERO_LOOK, tunic: "#d47828" }} x={VX + 3} z={VZ + 14} seed={12} kid stay={false} id="m-kid1" />
      <N64Person look={{ ...HERO_LOOK, tunic: "#4878a0" }} x={VX + 4.2} z={VZ + 13.4} seed={13} kid stay={false} id="m-kid2" />
    </>
  );
}

function OwlWatch() {
  if (!hasMystery("owlWatch") || !live.night) return null;
  const x = VX + 24;
  const z = VZ - 6;
  useFrame((_, dt) => {
    if (near(x, z, 8) && Math.random() < dt * 0.8) sfx.cricket();
  });
  return (
    <mesh position={[x, heightAt(x, z) + 3.4, z]}>
      <sphereGeometry args={[0.14, 6, 5]} />
      <meshLambertMaterial color="#c8b090" />
    </mesh>
  );
}

function CrackedWall() {
  if (!hasMystery("crackedWall") && !hasMystery("hiddenRoom")) return null;
  return <SecretPickup id="m-crack" x={VX + 2} z={VZ + 2} kind="heart" n={1} hint="The wall had a gap. A heart was stuffed in the dark." />;
}

function SecondPath() {
  if (!hasMystery("secondPath") && !hasMystery("cratePath")) return null;
  return null;
}
