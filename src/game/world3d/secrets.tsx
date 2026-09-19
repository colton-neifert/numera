import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, vWorld, VX, VZ, POLE_CHEST, POND, WATER_Y, isDeepDungeon, fieldActors, DOCK, ECHO_GLADE, blownRocks, rockGone, COW_PAD, FAIRY_RING, PICNIC_AT, FAR_POND, LONELY_CHEST, KEEP_OUT, PIG_AT, BALLOON_AT, BOTTLE_AT, GOAT_AT, SHROOM_AT, BEE_AT, KITE_AT, RABBIT_AT, CAMP_AT, SHEEP_AT, SNOW_AT, STAR_HILL, GIANT_AT, ICE_AT, OWL_AT, BUSH_AT, CRATE_AT, TALK_TREE, FLAG_AT, DESERT_AT, BELL_AT, LOG_AT, WIND_HILL, MOON_POND, LOST_CART, HAT_ROCK, BALL_AT, SNEEZE_TREE, MOLE_AT, SHY_AT, TINY_HOLE, BARREL_AT, PUMPKIN_AT, ECHO_ROCK, SCARECROW_AT, GEYSER_AT, LIGHT_AT, FACE_AT, FOX_AT, MAIL_NOWHERE, RED_SHROOM, PLANE_AT, GHOST_BENCH, PAINT_DOOR, CONCH_AT, BEAN_AT, POTATO_AT, SEE_AT, WHOOP_AT, BANANA_AT, LEMON_AT, DANDELION_AT, SWING_AT, CLOVER_AT, SLEEP_GIANT, STONE_RING, MIRROR_LAKE, CANNON_AT, FOSSIL_AT, SWORD_STONE, HAMMOCK_AT, DUCK_AT, WET_PAINT, CRAB_AT, VANE_AT, LOOK_AT, LOOK_LADDER, LAUNDRY_AT, BOUNCE_AT, WHALE_AT, NEEDLE_AT, CLOUD_PIER, ICE_CROWN, SAND_SHIP, WELL_AT, KEEP_Z, RIDE_AT, SOCK_PEAK, CLOCK_WOOD, FLOWER_SEA, SNORE_HILL, RAINBOW_ARCH, ANT_TABLE, BIRD_STACK, LOST_SHOE, ORCHARD_TREE, FOOT_AT, PUSH_AT, MILL_AT, BREAD_HILL, EDGE_MAIL, STAIR_NONE, CHESS_AT, DUCK_LAKE, DOOR_FIELD, YOU_COMPASS, CONE_AT, PIANO_AT, SPOON_AT, BOAT_AT, CAT_AT, WISH_AT, CART_AT, CUP_AT, UMBRELLA_AT, SLIDE_AT, HAT_FAR, WHOOP_AT_TOWN, SANDWICH_AT, BOUNCE_HOUSE, CARD_AT, SPIRE_AT, CHEESE_AT, TREE_HOME, TREE_TRUNK, TREE_HOUSE_H, TREE_HW, TREE_HD, TREE_LADDER, pondU, pondSurfaceY } from "./field";
import { live, gameClock, duskAmt } from "./live";
import { bunkSpots, HOUSES, houseSize, roofAt } from "./house";
import { sfx } from "../audio";
import { revealItem } from "../items";
import { useGame } from "../store";
import { playerMaxHp } from "../content";
import { isChestOpen } from "./puzzles";
import { npcsIn } from "../dialogue";
import type { WorldId } from "../types";
import { N64Person, RupeeMesh, HeartContainerMesh, HERO_LOOK, N64Sign } from "./actors";
import { puffAt } from "./fx";
import { consumeTalk as consumeTalkRaw } from "../input";
import { addTrapSpot } from "./dungeonTraps";
import { RealPlay } from "./realPlay";
import { WonderPack } from "./wonderPack";
import { YardPlay } from "./yardPlay";
import { FieldPlay } from "./fieldPlay";
import { PeoplePlay } from "./peoplePlay";
import { AdventPlay } from "./adventPlay";
import { SecretPlay } from "./secretPlay";
import { ChainPlay } from "./chainPlay";
import { CleverPlay } from "./cleverPlay";
import { HushPlay } from "./hushPlay";
import { TalePlay } from "./talePlay";
import { SparkPlay } from "./sparkPlay";
import { HerdPlay } from "./herdPlay";
import { FamilyPlay } from "./familyPlay";
import { QuestPlay } from "./questPlay";
import { SavePlay } from "./savePlay";
import { IcePlay } from "./icePlay";
import { TrailPlay } from "./trailPlay";
import { RidePlay } from "./ridePlay";
import { FishPlay } from "./fishPlay";
import { FeelPlay } from "./feelPlay";
import { ExtraPlay } from "./extraPlay";

function consumeTalk() {
  if (live.doorMath || live.doorUse || live.gateUse) return false;
  const busy =
    Boolean(live.nearNpc) ||
    Boolean(live.nearHouse) ||
    Boolean(live.nearExit) ||
    Boolean(live.nearCave) ||
    Boolean(live.nearGate) ||
    Boolean(live.nearChest) ||
    Boolean(live.nearHorse) ||
    Boolean(live.nearPet) ||
    live.nearRock ||
    live.nearMail;
  if (busy && !live.carry) return false;
  return consumeTalkRaw();
}

const GOT = new Set<string>();

function secretHas(id: string) {
  if (GOT.has(id)) return true;
  if ((useGame.getState().seenItems ?? []).includes(`s:${id}`)) {
    GOT.add(id);
    return true;
  }
  return false;
}

function secretTake(id: string) {
  if (GOT.has(id)) return;
  GOT.add(id);
  useGame.getState().discover(`s:${id}`);
}

export function HiddenSecrets({ worldId }: { worldId: WorldId }) {
  return (
    <group>
      <HydrateSecrets />
      {worldId === "meadow" ? <GoldBehindMill /> : null}
      {worldId === "meadow" ? <PondGold /> : null}
      {worldId === "meadow" ? <NightWisp /> : null}
      {worldId === "meadow" ? <KeepBackChest /> : null}
      {worldId === "meadow" ? <DockPoleChest /> : null}
      {worldId === "meadow" ? <RockCrown /> : null}
      {worldId === "meadow" ? <UnderBunk /> : null}
      {worldId === "meadow" ? <CrackedGrotto /> : null}
      {worldId === "meadow" ? <ShrineGold /> : null}
      {worldId === "meadow" ? <CobbBoot /> : null}
      {worldId === "meadow" ? <HideSeek /> : null}
      {worldId === "meadow" ? <NightWindow /> : null}
      {worldId === "meadow" ? <NightMotes /> : null}
      {worldId === "meadow" ? <QuestWatch /> : null}
      {worldId === "meadow" ? <EchoGlade /> : null}
      {worldId === "meadow" ? <UnderDock /> : null}
      {worldId === "meadow" ? <DawnGold /> : null}
      {worldId === "meadow" ? <KnockDoors /> : null}
      {worldId === "meadow" ? <NorthBoulders /> : null}
      {worldId === "meadow" ? <LookoutChest /> : null}
      {worldId === "meadow" ? <RookLoot /> : null}
      {worldId === "meadow" ? <NumberPath /> : null}
      {worldId === "meadow" ? <TargetPosts /> : null}
      {worldId === "meadow" ? <ScarecrowSong /> : null}
      {worldId === "meadow" ? <WildToys /> : null}
      {worldId === "meadow" ? <RealPlay /> : null}
      {worldId === "meadow" ? <WonderPack /> : null}
      {worldId === "meadow" ? <YardPlay /> : null}
      {worldId === "meadow" ? <FieldPlay /> : null}
      {worldId === "meadow" ? <PeoplePlay /> : null}
      {worldId === "meadow" ? <AdventPlay /> : null}
      {worldId === "meadow" ? <SecretPlay /> : null}
      {worldId === "meadow" ? <ChainPlay /> : null}
      {worldId === "meadow" ? <CleverPlay /> : null}
      {worldId === "meadow" ? <HushPlay /> : null}
      {worldId === "meadow" ? <TalePlay /> : null}
      {worldId === "meadow" ? <SparkPlay /> : null}
      {worldId === "meadow" ? <HerdPlay /> : null}
      {worldId === "meadow" ? <FamilyPlay /> : null}
      {worldId === "meadow" ? <QuestPlay /> : null}
      {worldId === "meadow" ? <SavePlay /> : null}
      {worldId === "meadow" ? <IcePlay /> : null}
      {worldId === "meadow" ? <TrailPlay /> : null}
      {worldId === "meadow" ? <RidePlay /> : null}
      {worldId === "meadow" ? <FishPlay /> : null}
      {worldId === "meadow" ? <FeelPlay /> : null}
      {worldId === "meadow" ? <ExtraPlay /> : null}
      {worldId === "cavern" ? <CavernDripGold /> : null}
      {worldId === "marsh" ? <MarshReedHeart /> : null}
      {isDeepDungeon(worldId) ? <TempleDigits worldId={worldId} /> : null}
      {isDeepDungeon(worldId) ? <TempleGold worldId={worldId} /> : null}
      <WellToss worldId={worldId} />
      <GossipSong worldId={worldId} />
    </group>
  );
}

function HydrateSecrets() {
  const once = useRef(false);
  if (!once.current) {
    once.current = true;
    if (secretHas("hide-seek")) live.hideSeek = { hiding: false, pending: false, round: 3, x: 0, z: 0, done: true };
    if (secretHas("cobb-boot")) live.foundBoot = true;
    if (secretHas("well-boy") || secretHas("well-boy-seen")) live.sawWellBoy = true;
    for (const s of useGame.getState().seenItems ?? []) {
      if (s.startsWith("rk:")) blownRocks.add(s.slice(3));
    }
  }
  return null;
}

function NumberPath() {
  const got = useRef(secretHas("num-path"));
  const seq = useRef<number[]>([]);
  const last = useRef(0);
  const pads = [
    { n: 2, x: 4.2, z: -46 },
    { n: 3, x: 8.4, z: -46 },
    { n: 5, x: 12.6, z: -46 },
  ];
  useFrame(() => {
    if (got.current || live.house || live.cave) return;
    const now = performance.now();
    if (now - last.current < 420) return;
    for (const p of pads) {
      if (Math.hypot(live.x - p.x, live.z - p.z) > 1.05) continue;
      last.current = now;
      if (seq.current[seq.current.length - 1] === p.n) return;
      seq.current.push(p.n);
      if (seq.current.length > 3) seq.current = [p.n];
      const s = seq.current.join("+");
      if (s === "2+3+5") {
        got.current = true;
        secretTake("num-path");
        const n = useGame.getState().addCoins(20);
        if (n > 0) revealItem("coin");
        live.hint = "Two plus three is five. The stones liked that.";
        sfx.chime();
        puffAt(p.x, p.z, heightAt(p.x, p.z) + 0.4, true);
      } else if (p.n === 5 && seq.current.length === 1) {
        seq.current = [];
        live.hint = "Five is the answer. Start on the small numbers.";
        sfx.miss();
      } else {
        live.hint =
          s === "2" ? "Two. Now the next piece." : s === "2+3" ? "Two plus three. Step on the sum." : "The stones want 2, then 3, then 5.";
        sfx.ok();
      }
    }
  });
  return (
    <group>
      {pads.map((p) => (
        <group key={p.n} position={[p.x, heightAt(p.x, p.z) + 0.08, p.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[0.85, 10]} />
            <meshLambertMaterial color={p.n === 5 ? "#c9a227" : "#6a8a4a"} />
          </mesh>
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.62, 0.78, 16]} />
            <meshBasicMaterial color="#efe6d4" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PondGold() {
  const got = useRef(secretHas("pond-gold"));
  const spin = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  const x = POND.x;
  const z = POND.z;
  const y = WATER_Y - 5.7;
  useFrame(({ clock }) => {
    if (spin.current) {
      spin.current.rotation.y = clock.elapsedTime * 1.35;
      spin.current.position.y = y + Math.sin(clock.elapsedTime * 2.2) * 0.06;
    }
    if (got.current || live.house || live.cave) return;
    if (!live.under) return;
    if (Math.hypot(live.x - x, live.z - z) > 1.2) return;
    if (live.y > y + 1.35) return;
    got.current = true;
    secretTake("pond-gold");
    const n = useGame.getState().addCoins(50);
    if (n > 0) revealItem("coin");
    live.hint = "A gold rupee, resting on the pond floor.";
    bump((v) => v + 1);
  });
  if (got.current) return null;
  return (
    <group ref={spin} position={[x, y, z]}>
      <RupeeMesh tint="gold" scale={1.55} />
      <pointLight color="#ffe28a" intensity={4.5} distance={3.8} />
    </group>
  );
}

function ShrineGold() {
  const got = useRef(secretHas("shrine-gold"));
  const spin = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  const h = HOUSES.find((x) => x.id === "sum-shrine");
  const x = (h?.x ?? -82) + 6.1;
  const z = (h?.z ?? 12) - 16.2;
  useFrame(({ clock }) => {
    if (spin.current) {
      spin.current.visible = live.house === "sum-shrine" && !got.current;
      spin.current.rotation.y = clock.elapsedTime * 1.2;
      spin.current.position.y = 0.28 + Math.sin(clock.elapsedTime * 2) * 0.05;
    }
    if (got.current || live.house !== "sum-shrine") return;
    if (Math.hypot(live.x - x, live.z - z) > 0.9) return;
    got.current = true;
    secretTake("shrine-gold");
    const n = useGame.getState().addCoins(50);
    if (n > 0) revealItem("coin");
    live.hint = "A gold rupee, tucked in the shrine’s right corner.";
    bump((v) => v + 1);
  });
  if (got.current) return null;
  return (
    <group ref={spin} position={[x, 0.28, z]} visible={false}>
      <RupeeMesh tint="gold" scale={1.2} />
    </group>
  );
}

function CavernDripGold() {
  const got = useRef(secretHas("cavern-gold"));
  const spin = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  const x = -8.1;
  const z = -11.4;
  useFrame(({ clock }) => {
    if (spin.current) {
      spin.current.rotation.y = clock.elapsedTime * 1.15;
      spin.current.position.y = 0.22 + Math.sin(clock.elapsedTime * 2.4) * 0.04;
    }
    if (got.current || live.house) return;
    if (Math.hypot(live.x - x, live.z - z) > 0.85) return;
    got.current = true;
    secretTake("cavern-gold");
    const n = useGame.getState().addCoins(20);
    if (n > 0) revealItem("coin");
    live.hint = "A rupee under the drip. The cave was counting too.";
    bump((v) => v + 1);
  });
  if (got.current) return null;
  return (
    <group ref={spin} position={[x, 0.22, z]}>
      <RupeeMesh tint="red" scale={1.05} />
    </group>
  );
}

function MarshReedHeart() {
  const got = useRef(secretHas("marsh-heart"));
  const bob = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  const x = -11.2;
  const z = 11.4;
  useFrame(({ clock }) => {
    if (bob.current) bob.current.position.y = 0.35 + Math.sin(clock.elapsedTime * 1.8) * 0.08;
    if (got.current || live.house) return;
    if (Math.hypot(live.x - x, live.z - z) > 0.9) return;
    got.current = true;
    secretTake("marsh-heart");
    live.drops.push({ id: "marsh-secret-h", kind: "heart", x, y: 0.4, z, n: 1 });
    sfx.get();
    live.hint = "A heart in the reeds. Measure hid one.";
    bump((v) => v + 1);
  });
  if (got.current) return null;
  return (
    <group ref={bob} position={[x, 0.35, z]}>
      <mesh scale={[0.55, 0.55, 0.55]}>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshLambertMaterial color="#e04040" emissive="#a01018" emissiveIntensity={0.45} />
      </mesh>
    </group>
  );
}

function GoldBehindMill() {
  const got = useRef(secretHas("gold-mill"));
  const [, bump] = useState(0);
  const gold = vWorld(-3.6, -112.8);
  const x = gold.x;
  const z = gold.z;
  useFrame(() => {
    if (got.current || live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 0.75) {
      got.current = true;
      secretTake("gold-mill");
      const n = useGame.getState().addCoins(50);
      if (n > 0) revealItem("coin");
      live.hint = "A gold rupee, tucked in the mill weeds.";
      bump((v) => v + 1);
    }
  });
  if (got.current) return null;
  return (
    <group position={[x, heightAt(x, z) + 0.32, z]}>
      <RupeeMesh tint="gold" scale={1.4} />
      <pointLight color="#ffe28a" intensity={1.6} distance={4} />
    </group>
  );
}

function EchoGlade() {
  const got = useRef(secretHas("echo-glade"));
  const spin = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  const x = ECHO_GLADE.x;
  const z = ECHO_GLADE.z;
  useFrame(({ clock }) => {
    if (spin.current) {
      spin.current.rotation.y = clock.elapsedTime * 1.15;
      spin.current.position.y = heightAt(x, z) + 0.42 + Math.sin(clock.elapsedTime * 2.1) * 0.06;
    }
    if (got.current || live.house || live.cave) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 8 && d > 1.1) {
      live.hint = "A quiet glade. Shout · F";
      if (consumeTalk()) {
        sfx.hoot();
        window.setTimeout(() => sfx.hoot(), 420);
        window.setTimeout(() => sfx.hoot(), 840);
        live.hint = "Hello... hello... hello.";
        if (!live.smashed.gladeecho) {
          live.smashed.gladeecho = true;
          const n = useGame.getState().addCoins(10);
          if (n > 0) revealItem("coin");
        }
      }
    }
    if (d > 1.05) return;
    got.current = true;
    secretTake("echo-glade");
    const n = useGame.getState().addCoins(50);
    if (n > 0) revealItem("coin");
    useGame.getState().healGrass();
    live.hint = "The far oak was saving a gold rupee.";
    bump((v) => v + 1);
  });
  if (got.current) return null;
  return (
    <group ref={spin} position={[x, heightAt(x, z) + 0.42, z]}>
      <RupeeMesh tint="gold" scale={1.45} />
      <pointLight color="#ffe28a" intensity={2.2} distance={5} />
    </group>
  );
}

function UnderDock() {
  const got = useRef(secretHas("under-dock"));
  const spin = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  const x = DOCK.x + 0.15;
  const z = DOCK.z - 0.35;
  const y = WATER_Y - 2.4;
  useFrame(({ clock }) => {
    if (spin.current) {
      spin.current.rotation.y = clock.elapsedTime * 1.3;
      spin.current.position.y = y + Math.sin(clock.elapsedTime * 2) * 0.05;
    }
    if (got.current || live.house || live.cave) return;
    if (!live.under) return;
    if (Math.hypot(live.x - x, live.z - z) > 1.15) return;
    got.current = true;
    secretTake("under-dock");
    const n = useGame.getState().addCoins(20);
    if (n > 0) revealItem("coin");
    live.hint = "A rupee under the dock. The posts were counting.";
    bump((v) => v + 1);
  });
  if (got.current) return null;
  return (
    <group ref={spin} position={[x, y, z]}>
      <RupeeMesh tint="red" scale={1.1} />
    </group>
  );
}

function KnockDoors() {
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (!live.slash || live.house || cool.current > 0) return;
    for (const h of HOUSES) {
      if (h.world !== "meadow" || h.kind === "keep" || h.kind === "shrine") continue;
      const { d } = houseSize(h);
      const dz = (h.z as number) + d * 0.48;
      const dx = h.x as number;
      if (Math.hypot((live.slash.x ?? 0) - dx, (live.slash.z ?? 0) - dz) < 1.45) {
        cool.current = 1.4;
        sfx.thud();
        live.hint = live.night ? "A voice inside: who's there?" : "Knock knock.";
        if (!live.smashed.knock) {
          live.smashed.knock = true;
          const n = useGame.getState().addCoins(2);
          if (n > 0) revealItem("coin");
        }
        break;
      }
    }
  });
  return null;
}

function DawnGold() {
  const got = useRef(secretHas("dawn-gold"));
  const spin = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  const x = 56.4;
  const z = -6.2;
  useFrame(({ clock }) => {
    const day = !live.night && !live.house && !live.cave;
    if (spin.current) {
      spin.current.visible = day && !got.current;
      spin.current.rotation.y = clock.elapsedTime * 1.2;
      spin.current.position.y = heightAt(x, z) + 0.36 + Math.sin(clock.elapsedTime * 2.2) * 0.05;
    }
    if (got.current || !day) return;
    if (Math.hypot(live.x - x, live.z - z) > 0.9) return;
    got.current = true;
    secretTake("dawn-gold");
    const n = useGame.getState().addCoins(20);
    if (n > 0) revealItem("coin");
    live.hint = "A rupee in the morning grass. Night hides it.";
    bump((v) => v + 1);
  });
  if (got.current) return null;
  return (
    <group ref={spin} position={[x, heightAt(x, z) + 0.36, z]} visible={false}>
      <RupeeMesh tint="red" scale={1.15} />
    </group>
  );
}

function NorthBoulders() {
  const [, bump] = useState(0);
  const rocks = [
    { x: 88.4, z: 214.2 },
    { x: 94.6, z: 220.8 },
    { x: 82.2, z: 226.4 },
  ];
  useFrame(() => {
    const n = rocks.filter((r) => rockGone(r.x, r.z)).length;
    if (n === 3 && !secretHas("north-path")) {
      secretTake("north-path");
      live.hint = "The north stones are gone. The hill is open.";
      bump((v) => v + 1);
    }
  });
  return null;
}

function LookoutChest() {
  const blocked = !rockGone(-92.4, 348.2);
  const [open, setOpen] = useState(isChestOpen("secret:lookout"));
  useFrame(() => {
    const o = isChestOpen("secret:lookout");
    if (o !== open) setOpen(o);
    if (blocked || live.house) return;
    const d = Math.hypot(live.x + 90.2, live.z - 356.4);
    if (d < 2.2 && !live.mounted) {
      live.nearChair = true;
      live.sitAt = { x: -90.2, z: 356.4, yaw: 0.4 };
      live.hint = live.sit ? "You can see the whole vale from here." : "Sit on the lookout · F";
      if (live.sit && !live.smashed.lookout) {
        live.smashed.lookout = true;
        const n = useGame.getState().addCoins(5);
        if (n > 0) revealItem("coin");
      }
    }
  });
  if (blocked) return null;
  return <TreasureChest id="lookout" x={-90.2} z={356.4} open={open} size="small" />;
}

function TargetPosts() {
  const hit = useRef([false, false, false, false]);
  const [, bump] = useState(0);
  const posts = [
    { x: 48.2, z: 38.4 },
    { x: 54.6, z: 42.2 },
    { x: 60.4, z: 36.8 },
    { x: 52.2, z: 30.4 },
  ];
  useFrame(() => {
    posts.forEach((p, i) => {
      if (hit.current[i]) return;
      const y = heightAt(p.x, p.z);
      const slash = live.slash && Math.hypot(live.slash.x - p.x, live.slash.z - p.z) < 0.7;
      const rock = live.throws.some((t) => Math.hypot(t.x - p.x, t.z - p.z) < 0.55 && t.y > y + 0.5);
      const boom = live.bombs.some((b) => b.boom && Math.hypot(b.x - p.x, b.z - p.z) < 1.8);
      let arrow = false;
      for (const a of live.arrows) {
        if (Math.hypot(a.x - p.x, a.z - p.z) < 0.55 && a.y > y + 0.4) arrow = true;
      }
      if (slash || rock || boom || arrow) {
        hit.current[i] = true;
        useGame.getState().addCoins(3);
        revealItem("coin");
        sfx.chime();
        live.hint = boom ? "The post exploded." : "The post rang.";
        puffAt(p.x, p.z, y + 1.2);
        bump((v) => v + 1);
        if (hit.current.every(Boolean) && !live.smashed.targets) {
          live.smashed.targets = true;
          const n = useGame.getState().addCoins(20);
          if (n > 0) revealItem("coin");
          live.hint = "Every post. Nice shooting.";
        }
      }
    });
  });
  return (
    <group>
      {posts.map((p, i) =>
        hit.current[i] ? null : (
          <group key={i} position={[p.x, heightAt(p.x, p.z), p.z]}>
            <mesh position={[0, 0.85, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 1.7, 8]} />
              <meshLambertMaterial color="#6a4a28" />
            </mesh>
            <mesh position={[0, 1.72, 0]} castShadow>
              <cylinderGeometry args={[0.28, 0.28, 0.08, 12]} />
              <meshLambertMaterial color="#c45c48" />
            </mesh>
          </group>
        ),
      )}
    </group>
  );
}

function NightWisp() {
  const got = useRef(secretHas("night-wisp"));
  const ref = useRef<THREE.Group>(null);
  const i = useRef(0);
  const lost = useRef(0);
  const [, bump] = useState(0);
  const path = useMemo(
    () => [
      { x: 22.4, z: -9.6 },
      { x: 14.2, z: 8.4 },
      { x: -6.8, z: 16.2 },
      { x: -18.6, z: 4.2 },
      { x: -12.4, z: -14.8 },
    ],
    [],
  );
  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    const on = live.night && !got.current && !live.house;
    ref.current.visible = on;
    if (!on) {
      i.current = 0;
      lost.current = 0;
      return;
    }
    const tgt = path[Math.min(i.current, path.length - 1)]!;
    const d = Math.hypot(live.x - tgt.x, live.z - tgt.z);
    const y = heightAt(tgt.x, tgt.z) + 1.15 + Math.sin(clock.elapsedTime * 2.4) * 0.22;
    ref.current.position.set(tgt.x + Math.sin(clock.elapsedTime * 0.9) * 0.28, y, tgt.z);
    ref.current.children.forEach((c, n) => {
      if (n < 2) return;
      const u = clock.elapsedTime * 2.2 + n;
      c.position.set(Math.cos(u) * 0.28, -0.05 * n + Math.sin(u * 1.4) * 0.08, Math.sin(u) * 0.28);
    });
    if (d < 1.35) {
      i.current += 1;
      if (i.current >= path.length) {
        got.current = true;
        secretTake("night-wisp");
        const n = useGame.getState().addCoins(50);
        if (n > 0) revealItem("coin");
        useGame.getState().healGrass();
        revealItem("heart");
        live.hint = "The night light led you the long way. A gold rupee, and a heart.";
        bump((v) => v + 1);
        return;
      }
      live.hint = "It drifts on. Stay close.";
    } else if (d > 9.5) {
      lost.current += dt;
      if (lost.current > 2.4) {
        i.current = 0;
        lost.current = 0;
        live.hint = "The light forgot you. It starts again at the east grass.";
      }
    } else lost.current = 0;
  });
  if (got.current) return null;
  return (
    <group ref={ref} visible={false}>
      <mesh>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshBasicMaterial color="#b8e8ff" transparent opacity={0.85} />
      </mesh>
      <pointLight color="#c8f0ff" intensity={2.4} distance={4} />
      {[0, 1, 2, 3].map((n) => (
        <mesh key={n} position={[Math.cos(n) * 0.22, -0.08 * n, Math.sin(n) * 0.22]}>
          <sphereGeometry args={[0.045, 6, 5]} />
          <meshBasicMaterial color="#d8f0ff" transparent opacity={0.45} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

const HIDE_SPOTS = [
  vWorld(6.6, -118.2),
  { x: 8.6, z: -36.4 },
  { x: DOCK.x - 1.1, z: DOCK.z + 2.4 },
];

function HideSeek() {
  const talking = useRef(false);
  const [, bump] = useState(0);
  useFrame(() => {
    const now = live.talkNpc === "tallow" && live.talking;
    const songs = useGame.getState().songs ?? [];
    const hs = live.hideSeek;
    if (now && songs.includes("sun") && !hs?.done && !hs?.hiding && !hs?.pending) {
      live.hideSeek = { hiding: false, pending: true, round: hs?.round ?? 0, x: 0, z: 0, done: false };
    }
    if (talking.current && !now && live.hideSeek?.pending && !live.hideSeek.hiding && !live.hideSeek.done) {
      const round = live.hideSeek.round;
      const spot = HIDE_SPOTS[Math.min(round, HIDE_SPOTS.length - 1)]!;
      live.hideSeek = { hiding: true, pending: false, round, x: spot.x, z: spot.z, done: false };
      live.hint = round === 0 ? "Tallow is hiding. Wheels, walls, or water." : "He ran off again.";
      bump((v) => v + 1);
    }
    talking.current = now;
    const hide = live.hideSeek;
    if (!hide?.hiding) return;
    if (Math.hypot(live.x - hide.x, live.z - hide.z) > 1.55) return;
    const next = hide.round + 1;
    if (next >= HIDE_SPOTS.length) {
      sfx.get();
      live.hideSeek = { hiding: false, pending: false, round: next, x: hide.x, z: hide.z, done: true };
      secretTake("hide-seek");
      const n = useGame.getState().addCoins(50);
      if (n > 0) revealItem("coin");
      useGame.getState().healGrass();
      revealItem("heart");
      live.hint = "Found you three times! A gold rupee, and a heart.";
      bump((v) => v + 1);
    } else {
      sfx.giggle();
      const spot = HIDE_SPOTS[next]!;
      live.hideSeek = { hiding: true, pending: false, round: next, x: spot.x, z: spot.z, done: false };
      live.hint = next === 1 ? "Found you! He bolts toward the keep." : "Found you! He runs for the water.";
      bump((v) => v + 1);
    }
  });
  const hide = live.hideSeek;
  if (!hide?.hiding) return null;
  return (
    <group position={[hide.x, heightAt(hide.x, hide.z), hide.z]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.38, 4, 6]} />
        <meshLambertMaterial color="#3a6a88" />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow>
        <sphereGeometry args={[0.13, 8, 6]} />
        <meshLambertMaterial color="#c4a090" />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.08, 6, 5]} />
        <meshLambertMaterial color="#3a2818" />
      </mesh>
    </group>
  );
}

function WellBoy() {
  const got = useRef(secretHas("well-boy"));
  const ref = useRef<THREE.Group>(null);
  const fade = useRef(0);
  const [, bump] = useState(0);
  const x = -17.2;
  const z = 12.6;
  useFrame(({ clock }, dt) => {
    const night = live.night && !live.house && !got.current;
    const d = Math.hypot(live.x - x, live.z - z);
    if (night && d < 5.5) {
      live.sawWellBoy = true;
      secretTake("well-boy-seen");
      if (d < 2.6) fade.current = Math.min(1, fade.current + dt * 0.85);
    } else fade.current = Math.max(0, fade.current - dt * 1.4);
    if (ref.current) {
      const show = night && fade.current < 0.92;
      ref.current.visible = show;
      const y = heightAt(x, z) + 0.72 + Math.sin(clock.elapsedTime * 1.6) * 0.04;
      ref.current.position.set(x + 0.85, y, z + 0.4);
      ref.current.rotation.y = Math.atan2(-(live.x - x), -(live.z - z));
    }
    if (night && d < 2.4 && fade.current < 0.9) {
      live.hint = "A boy by the well. F";
      if (consumeTalk()) {
        live.hint = "He put a finger to his lips. Then he pointed at the water.";
        sfx.giggle();
        if (!live.smashed.wellboy) {
          live.smashed.wellboy = true;
          const n = useGame.getState().addCoins(5);
          if (n > 0) revealItem("coin");
        }
      }
    }
    if (got.current || live.house) return;
    const oak = Boolean(live.songOk && live.songOk.toLowerCase().includes("oak"));
    if (oak && d < 2.8) {
      if (!live.night) {
        live.hint = "The well is quiet until night.";
        return;
      }
      got.current = true;
      secretTake("well-boy");
      const ok = useGame.getState().grantHeartContainer("well-boy");
      if (ok) {
        live.getItem = "container";
        sfx.get();
        live.hint = "A small hand from the well. You got a Heart Container.";
      } else {
        useGame.getState().healGrass();
        revealItem("heart");
        live.hint = "The well remembers you.";
      }
      bump((v) => v + 1);
    }
  });
  if (got.current) return null;
  return (
    <group ref={ref} visible={false}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.42, 4, 6]} />
        <meshLambertMaterial color="#3a5a3a" transparent opacity={0.72} />
      </mesh>
      <mesh position={[0, 1.02, 0.02]}>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshLambertMaterial color="#c49674" transparent opacity={0.78} />
      </mesh>
      <mesh position={[-0.05, 1.06, 0.14]}>
        <sphereGeometry args={[0.028, 6, 4]} />
        <meshBasicMaterial color="#1a1010" />
      </mesh>
      <mesh position={[0.05, 1.06, 0.14]}>
        <sphereGeometry args={[0.028, 6, 4]} />
        <meshBasicMaterial color="#1a1010" />
      </mesh>
      <pointLight color="#7a9a6a" intensity={0.8} distance={2.4} />
    </group>
  );
}

function CobbBoot() {
  const got = useRef(secretHas("cobb-boot") || live.foundBoot);
  const garden = vWorld(16, -102);
  const x = garden.x + 0.35;
  const z = garden.z - 0.4;
  const [, bump] = useState(0);
  useFrame(() => {
    if (!got.current) {
      if (live.plot.phase === "stomp" || live.plot.phase === "chase") {
        if (!secretHas("boot-out")) {
          secretTake("boot-out");
          bump((v) => v + 1);
        }
      }
      if (secretHas("boot-out") && Math.hypot(live.x - x, live.z - z) < 0.85) {
        got.current = true;
        secretTake("cobb-boot");
        live.foundBoot = true;
        live.hint = "Cobb’s boot. Still warm. Ask him.";
        bump((v) => v + 1);
      }
    }
    if (live.foundBoot && !secretHas("boot-pay") && live.talkNpc === "cobb" && live.talking) {
      secretTake("boot-pay");
      const n = useGame.getState().addCoins(20);
      if (n > 0) revealItem("coin");
    }
  });
  if (got.current) return null;
  if (!secretHas("boot-out")) return null;
  return (
    <group position={[x, heightAt(x, z) + 0.08, z]} rotation={[0.2, 0.6, 0.15]}>
      <mesh position={[0, 0.06, 0.04]} castShadow>
        <boxGeometry args={[0.16, 0.12, 0.32]} />
        <meshLambertMaterial color="#2a2018" />
      </mesh>
      <mesh position={[0, 0.1, -0.14]} rotation={[0.4, 0, 0]} castShadow>
        <boxGeometry args={[0.14, 0.1, 0.16]} />
        <meshLambertMaterial color="#3a2818" />
      </mesh>
    </group>
  );
}

function NightWindow() {
  const hut = HOUSES.find((h) => h.id === "cabin");
  const ducked = useRef(false);
  const ref = useRef<THREE.Group>(null);
  if (!hut) return null;
  const { d } = houseSize(hut);
  const x = hut.x + 1.55;
  const z = hut.z + d * 0.5 + 0.1;
  const y = heightAt(hut.x, hut.z) + 2.05;
  useFrame((_, dt) => {
    if (!ref.current) return;
    if (!live.night) ducked.current = false;
    const dist = Math.hypot(live.x - x, live.z - z);
    if (live.night && dist < 1.15) ducked.current = true;
    const show = Boolean(live.night && !ducked.current && !live.house);
    ref.current.visible = show;
    if (show) {
      ref.current.rotation.y = 0;
      if (dist < 2.4) {
        live.hint = "Someone's in the window. Knock · F";
        if (consumeTalk()) {
          ducked.current = true;
          sfx.thud();
          live.hint = "They ducked.";
          if (!live.smashed.window) {
            live.smashed.window = true;
            const n = useGame.getState().addCoins(5);
            if (n > 0) revealItem("coin");
          }
        }
      }
    }
  });
  return (
    <group ref={ref} position={[x, y, z]} visible={false}>
      <mesh position={[0, -0.08, 0.02]}>
        <capsuleGeometry args={[0.09, 0.16, 4, 6]} />
        <meshLambertMaterial color="#2a2018" />
      </mesh>
      <mesh position={[0, 0.12, 0.03]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshLambertMaterial color="#3a2a20" />
      </mesh>
      <pointLight color="#f4c060" intensity={0.55} distance={1.8} />
    </group>
  );
}

function NightMotes() {
  const group = useRef<THREE.Group>(null);
  const motes = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        x: ((i * 97) % 160) - 80,
        z: ((i * 71) % 150) - 95,
        p: 0.38 + (i % 3) * 0.11,
        s: 0.032 + (i % 2) * 0.01,
      })),
    [],
  );
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.visible = live.night && !live.house && !live.cave;
    const t = clock.elapsedTime;
    for (let i = 0; i < group.current.children.length; i++) {
      const m = motes[i];
      const child = group.current.children[i];
      if (!m || !child) continue;
      child.position.set(
        m.x + Math.sin(t * 0.22 + i) * 2.2,
        heightAt(m.x, m.z) + 1.35 + Math.sin(t * m.p + i) * 0.55,
        m.z + Math.cos(t * 0.18 + i * 0.7) * 1.8,
      );
    }
  });
  return (
    <group ref={group} visible={false}>
      {motes.map((m, i) => (
        <mesh key={i} position={[m.x, 1.2, m.z]}>
          <sphereGeometry args={[m.s, 6, 4]} />
          <meshBasicMaterial color={i % 2 ? "#fff6d0" : "#ffe08a"} transparent opacity={0.88} />
        </mesh>
      ))}
    </group>
  );
}

function KeepBackChest() {
  const [open, setOpen] = useState(isChestOpen("secret:keep-back"));
  const x = 7.8;
  const z = -34.6;
  useFrame(() => {
    const o = isChestOpen("secret:keep-back");
    if (o !== open) setOpen(o);
  });
  return <TreasureChest id="keep-back" x={x} z={z} open={open} size="small" />;
}

function DockPoleChest() {
  const [open, setOpen] = useState(isChestOpen("secret:dock-pole"));
  useFrame(() => {
    const o = isChestOpen("secret:dock-pole") || useGame.getState().hasPole;
    if (o !== open) setOpen(o);
  });
  return <TreasureChest id="dock-pole" x={POLE_CHEST.x} z={POLE_CHEST.z} open={open} size="small" />;
}

function RookLoot() {
  const [show, setShow] = useState(
    Boolean(live.rookLootAt || (useGame.getState().defeated.meadow ?? []).includes("rook")),
  );
  const [gotHeart, setGotHeart] = useState((useGame.getState().heartsFrom ?? []).includes("rook-boss"));
  const [open, setOpen] = useState(isChestOpen("secret:rook-chest"));
  const spin = useRef<THREE.Group>(null);
  const at = live.rookLootAt ?? vWorld(3.2, -84);
  useFrame(({ clock }) => {
    const on = Boolean(live.rookLootAt || (useGame.getState().defeated.meadow ?? []).includes("rook"));
    if (on !== show) setShow(on);
    const o = isChestOpen("secret:rook-chest");
    if (o !== open) setOpen(o);
    if (spin.current) {
      spin.current.rotation.y = clock.elapsedTime * 1.2;
      spin.current.position.y = heightAt(at.x, at.z) + 0.85 + Math.sin(clock.elapsedTime * 2.2) * 0.08;
    }
    if (!on || gotHeart || live.house || live.cave || live.getItem) return;
    if (Math.hypot(live.x - at.x, live.z - at.z) > 1.05) return;
    const g = useGame.getState();
    if ((g.heartsFrom ?? []).includes("rook-boss")) {
      setGotHeart(true);
      return;
    }
    g.grantHeartContainer("rook-boss");
    const now = useGame.getState();
    const max = playerMaxHp(now.xp, now.outfit, now.heartsExtra ?? 0);
    useGame.setState({ hp: max });
    live.getItem = "container";
    now.discover("container");
    sfx.get();
    live.hint = "A gold heart. Your life grew — and every heart filled.";
    setGotHeart(true);
  });
  if (!show) return null;
  const hx = at.x;
  const hz = at.z;
  const cx = hx + 2.4;
  const cz = hz + 1.6;
  return (
    <group>
      {gotHeart ? null : (
        <group ref={spin} position={[hx, heightAt(hx, hz) + 0.85, hz]}>
          <HeartContainerMesh scale={1.35} fog={false} />
        </group>
      )}
      <TreasureChest id="rook-chest" x={cx} z={cz} open={open} size="big" />
    </group>
  );
}

function RockCrown() {
  const got = useRef(secretHas("rock-crown"));
  const [, bump] = useState(0);
  const x = 10.5;
  const z = 9.2;
  useFrame(() => {
    if (got.current) return;
    const onTop = live.y > heightAt(x, z) + 0.85 && Math.hypot(live.x - x, live.z - z) < 1.15;
    if (onTop) {
      got.current = true;
      secretTake("rock-crown");
      useGame.getState().healGrass();
      revealItem("heart");
      live.hint = "A heart on the crown of the stones.";
      bump((v) => v + 1);
    }
  });
  if (got.current) return null;
  return (
    <mesh position={[x, heightAt(x, z) + 1.55, z]}>
      <sphereGeometry args={[0.1, 8, 6]} />
      <meshLambertMaterial color="#e07070" emissive="#c04040" emissiveIntensity={0.8} />
    </mesh>
  );
}

function UnderBunk() {
  const got = useRef(secretHas("under-bunk"));
  const [, bump] = useState(0);
  useFrame(() => {
    if (got.current || live.house !== "oak3") return;
    const hut = HOUSES.find((h) => h.id === "oak3");
    if (!hut) return;
    const spots = bunkSpots(hut);
    const d = Math.hypot(live.x - (spots.lie.x - 0.85), live.z - spots.lie.z);
    if (d < 0.7 && !live.bed) {
      live.hint = "Something under the bunk · walk into it";
      if (d < 0.42) {
        got.current = true;
        secretTake("under-bunk");
        useGame.getState().addApple();
        useGame.getState().setQuest("tess-apple", 2);
        revealItem("apple");
        live.hint = "Tess’s apple. Take it back to her.";
        bump((v) => v + 1);
      }
    }
  });
  if (got.current || live.house !== "oak3") return null;
  const hut = HOUSES.find((h) => h.id === "oak3");
  if (!hut) return null;
  const spots = bunkSpots(hut);
  return (
    <mesh position={[spots.lie.x - 0.85, 0.12, spots.lie.z]} castShadow>
      <sphereGeometry args={[0.08, 8, 6]} />
      <meshLambertMaterial color="#c45c48" />
    </mesh>
  );
}

function QuestWatch() {
  const paid = useRef(new Set<string>());
  useFrame(() => {
    if (!live.talking || !live.talkNpc) {
      paid.current.delete("flint-now");
      paid.current.delete("bramble-now");
      return;
    }
    const g = useGame.getState();
    const q = g.quests ?? {};
    const who = live.talkNpc;
    if (who === "nana") {
      if ((q["nana-broth"] ?? 0) < 1 && !paid.current.has("nana-start")) {
        paid.current.add("nana-start");
        g.setQuest("nana-broth", 1);
      }
      if ((q["nana-broth"] ?? 0) === 1 && (g.mushrooms ?? 0) >= 3 && !paid.current.has("nana-broth")) {
        paid.current.add("nana-broth");
        g.setQuest("nana-broth", 2);
        const max = playerMaxHp(g.xp, g.outfit, g.heartsExtra ?? 0);
        useGame.setState({ mushrooms: Math.max(0, (g.mushrooms ?? 0) - 3), hp: max });
        g.addCoins(15);
        revealItem("coin");
        live.hint = "Nana took three mushrooms. Your hearts filled.";
        sfx.get();
      }
    }
    if (who === "mill-man") {
      if ((q["mill-wood"] ?? 0) < 1 && !paid.current.has("mill-start")) {
        paid.current.add("mill-start");
        g.setQuest("mill-wood", 1);
      }
      if ((q["mill-wood"] ?? 0) === 1 && (g.wood ?? 0) >= 5 && !paid.current.has("mill-wood")) {
        paid.current.add("mill-wood");
        g.setQuest("mill-wood", 2);
        useGame.setState({ wood: Math.max(0, (g.wood ?? 0) - 5) });
        g.addCoins(25);
        revealItem("coin");
        live.hint = "The miller took five stacks. A purse for the walk.";
        sfx.get();
      }
    }
    if (who === "tess") {
      if ((q["tess-apple"] ?? 0) < 1 && !paid.current.has("tess-start")) {
        paid.current.add("tess-start");
        g.setQuest("tess-apple", 1);
      }
      if ((q["tess-apple"] ?? 0) === 2 && !paid.current.has("tess-apple")) {
        paid.current.add("tess-apple");
        g.setQuest("tess-apple", 3);
        g.addCoins(10);
        revealItem("coin");
        live.hint = "Tess took her apple. A rupee for being taller.";
        sfx.get();
      }
    }
    if (who === "brin" && (q["tess-apple"] ?? 0) < 1 && !paid.current.has("brin-start")) {
      paid.current.add("brin-start");
      g.setQuest("tess-apple", 1);
    }
    if (who === "flint") {
      if ((q["flint-ore"] ?? 0) < 1 && !paid.current.has("flint-start")) {
        paid.current.add("flint-start");
        g.setQuest("flint-ore", 1);
      }
      if ((g.rocks ?? 0) >= 5 && (q["flint-ore"] ?? 0) >= 1 && !paid.current.has("flint-now")) {
        paid.current.add("flint-now");
        const first = (q["flint-ore"] ?? 0) < 2;
        useGame.setState({ rocks: Math.max(0, (g.rocks ?? 0) - 5) });
        g.setQuest("flint-ore", Math.max(2, q["flint-ore"] ?? 0));
        g.addCoins(first ? 20 : 8);
        revealItem("coin");
        live.hint = first ? "Flint took five rocks. A purse for the walk." : "Flint bought five more.";
        sfx.get();
      }
    }
    if (who === "bramble") {
      if ((q["bramble-crow"] ?? 0) === 1 && !paid.current.has("bramble-now")) {
        paid.current.add("bramble-now");
        g.setQuest("bramble-crow", 2);
        g.addCoins(15);
        revealItem("coin");
        live.hint = "Bramble paid for the quiet rows.";
        sfx.get();
      }
    }
  });
  return null;
}

function CrackedGrotto() {
  const open = useRef(secretHas("grotto"));
  const looted = useRef(secretHas("grotto-loot"));
  const [, bump] = useState(0);
  const x = 18.6;
  const z = 6.4;
  useFrame(() => {
    if (!open.current) {
      const d = Math.hypot(live.x - x, live.z - z);
      if (d < 2.2 && !live.house) live.hint = "This wall looks weak. A bomb might do it.";
      for (const b of live.bombs) {
        if (b.boom && Math.hypot(b.x - x, b.z - z) < 2.4) {
          open.current = true;
          secretTake("grotto");
          sfx.smash();
          live.hint = "The wall gave way.";
          bump((v) => v + 1);
        }
      }
      return;
    }
    if (looted.current) return;
    if (Math.hypot(live.x - x, live.z - z) < 0.9) {
      looted.current = true;
      secretTake("grotto-loot");
      useGame.getState().healGrass();
      useGame.getState().healGrass();
      revealItem("heart");
      const n = useGame.getState().addCoins(8);
      if (n > 0) live.hint = "A hidden nook. Hearts and rupees.";
      bump((v) => v + 1);
    }
  });
  if (open.current && looted.current) return null;
  return (
    <group position={[x, heightAt(x, z), z]}>
      {open.current ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.7, 10]} />
          <meshLambertMaterial color="#1a1410" />
        </mesh>
      ) : (
        <group>
          <mesh position={[0, 0.55, 0]} rotation={[0.1, 0.4, 0.08]} castShadow>
            <boxGeometry args={[1.15, 1.1, 0.35]} />
            <meshLambertMaterial color="#6a645c" />
          </mesh>
          <mesh position={[0.12, 0.62, 0.18]} rotation={[0.2, 0.1, 0.4]}>
            <boxGeometry args={[0.55, 0.04, 0.04]} />
            <meshLambertMaterial color="#3a3228" />
          </mesh>
          <mesh position={[-0.08, 0.4, 0.18]} rotation={[0.1, -0.2, -0.5]}>
            <boxGeometry args={[0.4, 0.03, 0.03]} />
            <meshLambertMaterial color="#3a3228" />
          </mesh>
        </group>
      )}
    </group>
  );
}

function WellToss({ worldId }: { worldId: WorldId }) {
  const wells = useMemo(() => npcsIn(worldId).filter((n) => n.kind === "well"), [worldId]);
  useFrame(() => {
    for (const w of wells) {
      if (!secretHas("well-toss")) {
        for (const th of live.throws) {
          if (th.broken && Math.hypot(th.x - w.x, th.z - w.z) < 0.85) {
            secretTake("well-toss");
            useGame.getState().healGrass();
            revealItem("heart");
            puffAt(w.x, w.z, heightAt(w.x, w.z) + 0.4);
            sfx.splash();
            live.hint = "The well gives one back.";
          }
        }
      }
      for (const b of live.bombs) {
        if (b.boom && Math.hypot(b.x - w.x, b.z - w.z) < 1.6) {
          sfx.splash();
          live.hint = "The well coughed up the blast.";
          if (!live.smashed.wellbomb) {
            live.smashed.wellbomb = true;
            const n = useGame.getState().addCoins(8);
            if (n > 0) revealItem("coin");
          }
        }
      }
    }
  });
  return null;
}

function GossipSong({ worldId }: { worldId: WorldId }) {
  const stones = useMemo(() => npcsIn(worldId).filter((n) => n.kind === "stone"), [worldId]);
  useFrame(() => {
    if (secretHas("gossip-song") || !live.songOk) return;
    for (const s of stones) {
      if (Math.hypot(live.x - s.x, live.z - s.z) < 2.2) {
        secretTake("gossip-song");
        const n = useGame.getState().addCoins(10);
        if (n > 0) revealItem("coin");
        live.hint = "The stone liked that song.";
      }
    }
  });
  return null;
}

function ScarecrowSong() {
  const posts = useMemo(() => [vWorld(-26, -78), vWorld(22, -108)], []);
  useFrame(() => {
    if (secretHas("scarecrow-song") || !live.songOk || !live.night) return;
    for (const p of posts) {
      if (Math.hypot(live.x - p.x, live.z - p.z) < 2.6) {
        secretTake("scarecrow-song");
        const n = useGame.getState().addCoins(15);
        if (n > 0) revealItem("coin");
        puffAt(p.x, p.z, heightAt(p.x, p.z) + 1.4);
        live.hint = "The scarecrow turns. It liked the song.";
        sfx.ok();
      }
    }
  });
  return null;
}

function TempleDigits({ worldId }: { worldId: WorldId }) {
  const spots = useMemo(() => fieldActors(worldId).crystals, [worldId]);
  const taken = useGame((s) => s.collected[worldId] ?? []);
  const spin = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (spin.current) spin.current.rotation.y = clock.elapsedTime * 1.4;
    for (const c of spots) {
      if (taken.includes(c.id)) continue;
      if (Math.hypot(live.x - c.x, live.z - c.z) > 0.95) continue;
      if (live.digitOk) {
        const remaining = spots.filter((s) => !taken.includes(s.id)).sort((a, b) => b.z - a.z);
        const next = remaining[0];
        if (!next || c.id !== next.id) live.digitOk = false;
        else live.digitN += 1;
      }
      useGame.getState().collectCrystal(worldId, c.id);
      revealItem("crystal");
      if (live.digitOk && live.digitN >= spots.length && spots.length >= 4) {
        const n = useGame.getState().addCoins(50);
        if (n > 0) revealItem("coin");
        useGame.getState().healGrass();
        live.hint = "You counted every digit in order. The leftover is impressed.";
      } else {
        live.hint = live.digitOk ? "A lost digit. Keep counting as you walk." : "A lost digit. The temple was still counting.";
      }
    }
  });
  return (
    <group ref={spin}>
      {spots
        .filter((c) => !taken.includes(c.id))
        .map((c) => (
          <mesh key={c.id} position={[c.x, 0.55, c.z]}>
            <octahedronGeometry args={[0.22, 0]} />
            <meshLambertMaterial color="#7eb8b0" emissive="#4a8890" emissiveIntensity={0.7} />
          </mesh>
        ))}
    </group>
  );
}

function TempleGold({ worldId }: { worldId: WorldId }) {
  const key = `${worldId}-gold`;
  const got = useRef(secretHas(key));
  const spin = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  const x = 22.4;
  const z = -172.4;
  useFrame(({ clock }) => {
    if (spin.current) {
      spin.current.rotation.y = clock.elapsedTime * 1.2;
      spin.current.position.y = 0.28 + Math.sin(clock.elapsedTime * 2.1) * 0.05;
    }
    if (got.current || live.house) return;
    if (Math.hypot(live.x - x, live.z - z) > 0.9) return;
    got.current = true;
    secretTake(key);
    const n = useGame.getState().addCoins(20);
    if (n > 0) revealItem("coin");
    live.hint = "A rupee in the last alcove. The leftover hid one.";
    bump((v) => v + 1);
  });
  if (got.current) return null;
  return (
    <group ref={spin} position={[x, 0.28, z]}>
      <RupeeMesh tint="red" scale={1.1} />
    </group>
  );
}

function WildToys() {
  return (
    <group>
      <FairyRing />
      <PicnicLeftover />
      <FarPondGold />
      <KeepOutChest />
      <WellBounce />
      <MillBump />
      <SkyBalloon />
      <PondBottle />
      <MillRoofGold />
      <StillBugs />
      <BounceShroom />
      <BeeHive />
      <StuckKite />
      <HorseDrop />
      <TravelerCamp />
      <SnowMan />
      <NightStar />
      <RainFall />
      <WindowPie />
      <GiantShroom />
      <IcePond />
      <BushSeller />
      <CrateStack />
      <TalkTree />
      <HillFlag />
      <DesertCactus />
      <FieldBell />
      <IceFish />
      <NorthLights />
      <KickLog />
      <BirdBurst />
      <PondDuck />
      <WhimsyPack />
    </group>
  );
}

function LonelyCow() {
  const { x, z } = COW_PAD;
  const g = useRef<THREE.Group>(null);
  const rocked = useRef(0);
  const milked = useRef(secretHas("cow-milk"));
  useFrame((_, dt) => {
    if (!g.current) return;
    const d = Math.hypot(live.x - x, live.z - z);
    const charging = live.mounted && (live.horseGallop || Math.abs(live.speed) > 16);
    if (charging && d < 1.8 && rocked.current <= 0) {
      rocked.current = 1.2;
      sfx.moo();
      puffAt(x, z, heightAt(x, z) + 0.4);
      live.hint = "She barely moved. Rude.";
    }
    if (!live.mounted && d < 1.35 && live.y > heightAt(x, z) + 0.9 && live.boostY === 0 && !live.house) {
      live.boostY = 16.5;
      sfx.moo();
      live.hint = "The cow launched you.";
      if (!live.smashed["cow-bounce"]) {
        live.smashed["cow-bounce"] = true;
        const n = useGame.getState().addCoins(5);
        if (n > 0) revealItem("coin");
      }
    }
    if (live.carry === "cat" && d < 2.4 && !live.smashed["cat-cow"]) {
      live.smashed["cat-cow"] = true;
      sfx.meow();
      sfx.moo();
      live.hint = "The cat and the cow had a meeting.";
      const n = useGame.getState().addCoins(10);
      if (n > 0) revealItem("coin");
    }
    if (live.carry === "frog" && d < 2.4 && !live.smashed["frog-cow"]) {
      live.smashed["frog-cow"] = true;
      sfx.moo();
      live.hint = "The cow stared at the frog. The frog stared back.";
      const n = useGame.getState().addCoins(5);
      if (n > 0) revealItem("coin");
    }
    if (rocked.current > 0) {
      rocked.current -= dt;
      g.current.rotation.z = Math.sin(rocked.current * 14) * 0.12;
    } else g.current.rotation.z += (0 - g.current.rotation.z) * Math.min(1, dt * 6);
    g.current.position.set(x, heightAt(x, z), z);
    if (d < 2.1 && !live.house && !live.mounted) {
      live.hint = milked.current ? "Pet the cow · F" : "A lonely cow. F to milk";
      if (consumeTalk()) {
        if (!milked.current) {
          milked.current = true;
          secretTake("cow-milk");
          useGame.getState().healAll();
          sfx.moo();
          sfx.heal();
          live.hint = "Warm milk. Every heart filled.";
        } else {
          sfx.moo();
          live.hint = "She likes that.";
          if (!live.smashed["cow-pet"]) {
            live.smashed["cow-pet"] = true;
            const n = useGame.getState().addCoins(3);
            if (n > 0) revealItem("coin");
          }
        }
      }
    }
    if (live.songOk && d < 3.2) {
      g.current.rotation.y += dt * 2.4;
      if (!secretHas("cow-dance")) {
        secretTake("cow-dance");
        live.hint = "The cow is dancing.";
        sfx.moo();
      }
    }
  });
  return (
    <group ref={g} position={[x, heightAt(x, z), z]}>
      <mesh position={[0, 0.55, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.7, 4, 8]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0.08, 0.82, -0.55]} castShadow>
        <sphereGeometry args={[0.28, 8, 6]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0.08, 0.78, -0.82]} castShadow>
        <boxGeometry args={[0.22, 0.16, 0.18]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[-0.12, 1.08, -0.5]} rotation={[0.2, 0, 0.4]} castShadow>
        <coneGeometry args={[0.06, 0.16, 5]} />
        <meshLambertMaterial color="#d8d0c4" />
      </mesh>
      <mesh position={[0.28, 1.08, -0.5]} rotation={[0.2, 0, -0.4]} castShadow>
        <coneGeometry args={[0.06, 0.16, 5]} />
        <meshLambertMaterial color="#d8d0c4" />
      </mesh>
      {[-0.18, 0.18].map((sx) =>
        [-0.22, 0.32].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx, 0.22, sz]} castShadow>
            <capsuleGeometry args={[0.07, 0.22, 3, 5]} />
            <meshLambertMaterial color="#3a2818" />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.28, 0.18]}>
        <sphereGeometry args={[0.1, 6, 5]} />
        <meshLambertMaterial color="#d8d0c4" />
      </mesh>
      <mesh position={[0, 0.7, 0.55]} rotation={[0.5, 0, 0]}>
        <capsuleGeometry args={[0.04, 0.28, 3, 5]} />
        <meshLambertMaterial color="#c4a060" />
      </mesh>
    </group>
  );
}

function FairyRing() {
  const { x, z } = FAIRY_RING;
  const got = useRef(secretHas("fairy-ring"));
  const glow = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (glow.current) glow.current.intensity = 3.2 + Math.sin(clock.elapsedTime * 2.4) * 1.4;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.4 && !live.house) {
      live.hint = got.current ? "The ring remembers you." : "A fairy ring. Play a song here.";
      if (!got.current && live.songOk) {
        got.current = true;
        secretTake("fairy-ring");
        useGame.getState().healAll();
        puffAt(x, z, heightAt(x, z) + 0.8, true);
        sfx.heal();
        sfx.chime();
        live.hint = "A fairy kissed the field. Hearts full.";
      }
    }
  });
  return (
    <group position={[x, heightAt(x, z), z]}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 1.55, 0, Math.sin(a) * 1.55]}>
            <mesh position={[0, 0.08, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.07, 0.16, 6]} />
              <meshLambertMaterial color="#efe6d4" />
            </mesh>
            <mesh position={[0, 0.2, 0]} castShadow>
              <sphereGeometry args={[0.16, 8, 6]} />
              <meshLambertMaterial color={i % 2 ? "#c45c48" : "#e8d48a"} />
            </mesh>
          </group>
        );
      })}
      <pointLight ref={glow} position={[0, 0.8, 0]} color="#ffe8a0" intensity={3.4} distance={7} />
      <FairyMotes />
    </group>
  );
}

function FairyMotes() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    g.current.children.forEach((c, i) => {
      const t = clock.elapsedTime * 1.4 + i * 0.8;
      c.position.set(Math.cos(t) * 1.1, 0.4 + Math.sin(t * 2.1) * 0.35, Math.sin(t) * 1.1);
      const mat = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = 0.45 + Math.sin(t * 3) * 0.35;
    });
  });
  return (
    <group ref={g}>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.05, 6, 5]} />
          <meshBasicMaterial color="#fff4c8" transparent opacity={0.7} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function PicnicLeftover() {
  const { x, z } = PICNIC_AT;
  const ate = useRef(secretHas("picnic-pie"));
  const [, bump] = useState(0);
  useFrame(() => {
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.6 && !live.house && !live.mounted) {
      live.nearChair = true;
      live.sitAt = { x, z: z + 0.4, yaw: 0 };
    }
    if (d < 1.6 && !live.house && !ate.current && (live.sit || live.stillT > 1.1)) {
      ate.current = true;
      secretTake("picnic-pie");
      useGame.getState().healGrass();
      useGame.getState().healGrass();
      sfx.ok();
      live.listen = "Cold pie. Someone packed it and did not come back. Still good.";
      bump((n) => n + 1);
    } else if (d < 1.6 && !ate.current) live.listen = live.listen || "Someone left pie. Sit.";
  });
  if (ate.current) {
    return (
      <group position={[x, heightAt(x, z), z]}>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[1.15, 0.08, 0.7]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      </group>
    );
  }
  return (
    <group position={[x, heightAt(x, z), z]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[1.15, 0.08, 0.7]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.1, 10]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.08, 6, 5]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}

function FarPondGold() {
  const got = useRef(secretHas("far-pond"));
  const spin = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  const { x, z } = FAR_POND;
  useFrame(({ clock }) => {
    if (spin.current) {
      spin.current.rotation.y = clock.elapsedTime * 1.3;
      spin.current.position.y = WATER_Y - 1.8 + Math.sin(clock.elapsedTime * 2) * 0.06;
    }
    if (got.current || live.house) return;
    if (!live.under && !live.swim) return;
    if (Math.hypot(live.x - x, live.z - z) > 2.4) return;
    got.current = true;
    secretTake("far-pond");
    const n = useGame.getState().addCoins(50);
    if (n > 0) revealItem("coin");
    live.hint = "A gold rupee under a pond nobody mapped.";
    bump((v) => v + 1);
  });
  return (
    <group>
      <mesh position={[x, WATER_Y, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[9.4, 22]} />
        <meshLambertMaterial color="#4a90a0" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      {got.current ? null : (
        <group ref={spin} position={[x, WATER_Y - 1.8, z]}>
          <RupeeMesh tint="gold" scale={1.4} />
        </group>
      )}
    </group>
  );
}

function KeepOutChest() {
  const got = useRef(secretHas("keep-out"));
  const spin = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  useFrame(({ clock }) => {
    const dSign = Math.hypot(live.x - KEEP_OUT.x, live.z - KEEP_OUT.z);
    if (dSign < 2.4) live.hint = "KEEP OUT. (You don't have to.)";
    if (spin.current) {
      spin.current.rotation.y = clock.elapsedTime * 1.2;
      spin.current.position.y = heightAt(LONELY_CHEST.x, LONELY_CHEST.z) + 0.45 + Math.sin(clock.elapsedTime * 2) * 0.06;
    }
    if (got.current || live.house) return;
    if (Math.hypot(live.x - LONELY_CHEST.x, live.z - LONELY_CHEST.z) < 1.05) {
      got.current = true;
      secretTake("keep-out");
      const n = useGame.getState().addCoins(50);
      if (n > 0) revealItem("coin");
      live.hint = "They said keep out. You did not.";
      bump((v) => v + 1);
    }
  });
  return (
    <group>
      <group position={[KEEP_OUT.x, heightAt(KEEP_OUT.x, KEEP_OUT.z), KEEP_OUT.z]}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[0.08, 1.4, 0.08]} />
          <meshLambertMaterial color="#5a3d24" />
        </mesh>
        <mesh position={[0, 1.35, -0.04]} castShadow>
          <boxGeometry args={[0.85, 0.45, 0.06]} />
          <meshLambertMaterial color="#6a3a22" />
        </mesh>
      </group>
      {got.current ? null : (
        <group ref={spin} position={[LONELY_CHEST.x, heightAt(LONELY_CHEST.x, LONELY_CHEST.z) + 0.45, LONELY_CHEST.z]}>
          <RupeeMesh tint="gold" scale={1.35} />
        </group>
      )}
    </group>
  );
}

function WellBounce() {
  const cool = useRef(0);
  const wells = useMemo(() => npcsIn("meadow").filter((n) => n.kind === "well"), []);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (!live.mounted || live.house || cool.current > 0) return;
    for (const w of wells) {
      if (Math.hypot(live.x - w.x, live.z - w.z) < 1.15) {
        const fx = -Math.sin(live.yaw);
        const fz = -Math.cos(live.yaw);
        live.knock = { vx: -fx * 14, vz: -fz * 14, t: 0.28 };
        sfx.splash();
        puffAt(w.x, w.z, heightAt(w.x, w.z) + 0.5, true);
        live.hint = "The well spat you back out.";
        cool.current = 1.4;
        if (!secretHas("well-bounce")) {
          secretTake("well-bounce");
          const n = useGame.getState().addCoins(5);
          if (n > 0) revealItem("coin");
        }
      }
    }
  });
  return null;
}

function MillBump() {
  const mill = vWorld(2, -116);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    const mx = mill.x + 4.2;
    const mz = mill.z;
    const d = Math.hypot(live.x - mx, live.z - mz);
    if (live.house || cool.current > 0) return;
    if (live.mounted && d < 1.6) {
      live.millSpin = Math.max(live.millSpin, 8);
      sfx.creak();
      live.hint = "The mill wheel spun like it was scared.";
      cool.current = 2.2;
    } else if (!live.mounted && d < 1.5) {
      live.hint = "Push the mill · F";
      if (consumeTalk()) {
        live.millSpin = Math.max(live.millSpin, 6);
        sfx.creak();
        live.hint = "It creaked.";
        cool.current = 1.2;
        if (!live.smashed.millpush) {
          live.smashed.millpush = true;
          const n = useGame.getState().addCoins(5);
          if (n > 0) revealItem("coin");
        }
      }
    }
  });
  return null;
}

function WildPig() {
  const g = useRef<THREE.Group>(null);
  const pos = useRef({ x: PIG_AT.x, z: PIG_AT.z, yaw: 0.4, vx: 0, vz: 0 });
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (!g.current) return;
    if (cool.current > 0) cool.current -= dt;
    const p = pos.current;
    const dHero = Math.hypot(live.x - p.x, live.z - p.z);
    const charging = live.mounted && (live.horseGallop || Math.abs(live.speed) > 16);
    if (live.pigRide > 0) {
      p.vx += -Math.sin(p.yaw) * 28 * dt;
      p.vz += -Math.cos(p.yaw) * 28 * dt;
      p.yaw += Math.sin(performance.now() * 0.004) * 2.4 * dt;
      p.vx *= Math.exp(-dt * 1.6);
      p.vz *= Math.exp(-dt * 1.6);
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      live.pigX = p.x;
      live.pigZ = p.z;
      live.pigYaw = p.yaw;
    } else {
      if (charging && dHero < 1.5 && cool.current <= 0) {
        const fx = -Math.sin(live.yaw);
        const fz = -Math.cos(live.yaw);
        p.vx = fx * 10;
        p.vz = fz * 10;
        cool.current = 0.8;
        sfx.baa();
        live.hint = "The pig oinked and ran.";
      }
      if (!live.mounted && live.pigRide <= 0 && dHero < 1.35 && !live.house) {
        live.hint = "Ride the pig · F  (or jump on)";
        if (consumeTalk() || live.y > heightAt(p.x, p.z) + 0.85) {
          live.pigRide = 6.2;
          live.pigX = p.x;
          live.pigZ = p.z;
          live.pigYaw = live.yaw;
          p.yaw = live.yaw;
          sfx.baa();
          live.hint = "You're on a pig. Jump to hop off.";
        }
      }
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.vx *= Math.exp(-dt * 2.4);
      p.vz *= Math.exp(-dt * 2.4);
      if (Math.hypot(p.vx, p.vz) < 0.4) {
        const a = performance.now() * 0.0003 + 1.2;
        p.x += Math.cos(a) * 0.6 * dt;
        p.z += Math.sin(a) * 0.6 * dt;
        p.yaw = Math.atan2(-Math.cos(a), -Math.sin(a));
      } else p.yaw = Math.atan2(-p.vx, -p.vz);
    }
    g.current.position.set(p.x, heightAt(p.x, p.z), p.z);
    g.current.rotation.y = p.yaw;
  });
  return (
    <group ref={g} position={[PIG_AT.x, heightAt(PIG_AT.x, PIG_AT.z), PIG_AT.z]} scale={[1.25, 1.05, 1.35]}>
      <mesh position={[0, 0.32, 0.04]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.42, 4, 8]} />
        <meshLambertMaterial color="#e8a090" />
      </mesh>
      <mesh position={[0, 0.38, -0.38]} castShadow>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshLambertMaterial color="#e8a090" />
      </mesh>
      <mesh position={[0, 0.34, -0.55]}>
        <sphereGeometry args={[0.08, 6, 5]} />
        <meshLambertMaterial color="#d49080" />
      </mesh>
      <mesh position={[0, 0.42, 0.42]} rotation={[0.6, 0, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.18, 3, 5]} />
        <meshLambertMaterial color="#e8a090" />
      </mesh>
      {[-0.12, 0.12].map((sx) =>
        [-0.14, 0.16].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx, 0.12, sz]} castShadow>
            <capsuleGeometry args={[0.045, 0.1, 3, 5]} />
            <meshLambertMaterial color="#3a2818" />
          </mesh>
        )),
      )}
    </group>
  );
}

function SkyBalloon() {
  const g = useRef<THREE.Group>(null);
  const popped = useRef(secretHas("balloon"));
  const [, bump] = useState(0);
  const { x, z } = BALLOON_AT;
  useFrame(({ clock }) => {
    if (popped.current) return;
    const y = heightAt(x, z) + 6.4 + Math.sin(clock.elapsedTime * 0.7) * 0.55;
    if (g.current) {
      g.current.position.y = y;
      g.current.rotation.y = clock.elapsedTime * 0.4;
    }
    const hit =
      Math.hypot(live.x - x, live.z - z) < 1.4 && live.y > y - 1.2 && live.y < y + 1.6
        || (live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 1.6 && (live.slash.r ?? 1) > 0)
        || live.arrows.some((a) => Math.hypot(a.x - x, a.z - z) < 1.2 && a.y > y - 1)
        || live.bombs.some((b) => b.boom && Math.hypot(b.x - x, b.z - z) < 3.2);
    if (hit) {
      popped.current = true;
      secretTake("balloon");
      puffAt(x, z, y, true);
      sfx.ok();
      const n = useGame.getState().addCoins(20);
      if (n > 0) revealItem("coin");
      live.hint = "The balloon popped. A rupee was inside.";
      bump((v) => v + 1);
    }
  });
  if (popped.current) return null;
  return (
    <group ref={g} position={[x, heightAt(x, z) + 6.4, z]}>
      <mesh castShadow>
        <sphereGeometry args={[0.55, 12, 10]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
      <mesh position={[0, -0.7, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.9, 4]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0, -1.15, 0]}>
        <boxGeometry args={[0.18, 0.12, 0.18]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function PondBottle() {
  const got = useRef(secretHas("bottle"));
  const { x, z } = BOTTLE_AT;
  const g = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  useFrame(({ clock }) => {
    if (g.current) {
      g.current.position.y = WATER_Y + 0.12 + Math.sin(clock.elapsedTime * 1.4) * 0.06;
      g.current.rotation.z = Math.sin(clock.elapsedTime) * 0.2;
    }
    if (got.current || live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 1.4) {
      live.hint = "A bottle in the reeds. F to open";
      if (consumeTalk()) {
        got.current = true;
        secretTake("bottle");
        const n = useGame.getState().addCoins(10);
        if (n > 0) revealItem("coin");
        live.hint = "The note says: the cow out west is lonely.";
        sfx.ok();
        bump((v) => v + 1);
      }
    }
  });
  if (got.current) return null;
  return (
    <group ref={g} position={[x, WATER_Y + 0.12, z]}>
      <mesh rotation={[0.4, 0.2, 0.1]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.32, 8]} />
        <meshLambertMaterial color="#3d8a68" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.1, 6]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function MillRoofGold() {
  const mill = vWorld(2, -116);
  const got = useRef(secretHas("mill-roof"));
  const spin = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  const x = mill.x;
  const z = mill.z;
  useFrame(({ clock }) => {
    if (spin.current) {
      spin.current.rotation.y = clock.elapsedTime * 1.3;
      spin.current.position.y = heightAt(x, z) + 5.05 + Math.sin(clock.elapsedTime * 2) * 0.08;
    }
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    const roof = heightAt(x, z) + 4.05;
    if (d < 5 && live.y < roof && !live.mounted) live.hint = "Glide onto the mill with a chicken.";
    if (d < 2.6 && live.y > roof) {
      live.nearChair = true;
      live.sitAt = { x, z, yaw: 0 };
      live.hint = live.sit ? "The vale from the mill." : "Sit on the mill roof · F";
    }
    if (got.current) return;
    if (d < 2.2 && live.y > roof) {
      got.current = true;
      secretTake("mill-roof");
      const n = useGame.getState().addCoins(20);
      if (n > 0) revealItem("coin");
      live.hint = "The mill roof was hiding a rupee.";
      bump((v) => v + 1);
    }
  });
  if (got.current) return null;
  return (
    <group ref={spin} position={[x, heightAt(x, z) + 5.05, z]}>
      <RupeeMesh tint="red" scale={1.15} />
    </group>
  );
}

function StillBugs() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const on = live.stillT > 2.6 && !live.house && !live.mounted && !live.sit;
    g.current.visible = on;
    if (!on) return;
    g.current.position.set(live.x, (live.y || heightAt(live.x, live.z)) + 1.35, live.z);
    g.current.children.forEach((c, i) => {
      const t = clock.elapsedTime * (1.1 + i * 0.15) + i;
      c.position.set(Math.cos(t) * 0.35, Math.sin(t * 2.2) * 0.18, Math.sin(t) * 0.35);
      c.rotation.y = Math.sin(t * 9) * 0.55;
    });
    if (live.stillT > 3.2) live.hint = live.night ? "Fireflies found you." : "Butterflies landed on you.";
  });
  return (
    <group ref={g} visible={false}>
      {Array.from({ length: 5 }, (_, i) => (
        <group key={i}>
          <mesh rotation={[0, 0, 0.4]}>
            <planeGeometry args={[0.12, 0.08]} />
            <meshBasicMaterial
              color={live.night ? "#e8d48a" : i % 2 ? "#d478a0" : "#6a8ad4"}
              side={THREE.DoubleSide}
              transparent
              opacity={0.9}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation={[0, 0, -0.4]} position={[0.02, 0, 0]}>
            <planeGeometry args={[0.12, 0.08]} />
            <meshBasicMaterial
              color={live.night ? "#ffe080" : i % 2 ? "#e8a090" : "#8ab0e0"}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function WildGoat() {
  const g = useRef<THREE.Group>(null);
  const pos = useRef({ x: GOAT_AT.x, z: GOAT_AT.z, yaw: 0.2, cool: 0 });
  useFrame((_, dt) => {
    if (!g.current) return;
    const p = pos.current;
    if (p.cool > 0) p.cool -= dt;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    const pal = Boolean(live.smashed.goatfriend);
    if (d < 1.7 && !live.house && live.pigRide <= 0) {
      const apples = useGame.getState().apples ?? 0;
      if (!pal && apples > 0) {
        live.hint = "Feed the goat an apple · F";
        if (consumeTalk()) {
          useGame.setState({ apples: apples - 1 });
          live.smashed.goatfriend = true;
          sfx.baa();
          live.hint = "The goat is your friend now.";
          p.cool = 0.4;
        }
      } else if (pal && d < 1.45) {
        live.hint = "The goat follows you.";
      }
    }
    if (d < 1.35 && p.cool <= 0 && !live.house && live.pigRide <= 0 && !pal) {
      const away = Math.atan2(live.x - p.x, live.z - p.z);
      p.yaw = away + Math.PI;
      if (live.shieldUp) {
        live.knock = { vx: Math.sin(away) * 10, vz: Math.cos(away) * 10, t: 0.28 };
        live.hint = "The goat met your shield.";
        sfx.thud();
      } else {
        live.knock = { vx: Math.sin(away) * 14, vz: Math.cos(away) * 14, t: 0.35 };
        useGame.getState().hurtField(2, true);
        live.hint = "Headbutted by a goat.";
        sfx.hit();
      }
      p.cool = 1.4;
      sfx.baa();
    }
    if (pal && !live.house) {
      const dx = live.x - p.x;
      const dz = live.z - p.z;
      const dd = Math.max(0.2, Math.hypot(dx, dz));
      if (dd > 1.8) {
        p.x += (dx / dd) * 3.2 * dt;
        p.z += (dz / dd) * 3.2 * dt;
        p.yaw = Math.atan2(-dx, -dz);
      }
    } else {
      const a = performance.now() * 0.00025;
      p.x = GOAT_AT.x + Math.cos(a) * 2.4;
      p.z = GOAT_AT.z + Math.sin(a) * 2.4;
      if (p.cool <= 0) p.yaw = a + Math.PI / 2;
    }
    g.current.position.set(p.x, heightAt(p.x, p.z), p.z);
    g.current.rotation.y = p.yaw;
  });
  return (
    <group ref={g} position={[GOAT_AT.x, heightAt(GOAT_AT.x, GOAT_AT.z), GOAT_AT.z]} scale={[1.15, 1.1, 1.2]}>
      <mesh position={[0, 0.34, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.36, 4, 8]} />
        <meshLambertMaterial color="#cfc6b4" />
      </mesh>
      <mesh position={[0, 0.42, -0.34]} castShadow>
        <sphereGeometry args={[0.15, 8, 6]} />
        <meshLambertMaterial color="#cfc6b4" />
      </mesh>
      <mesh position={[-0.1, 0.58, -0.34]} rotation={[0.2, 0, 0.5]} castShadow>
        <coneGeometry args={[0.03, 0.18, 5]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0.1, 0.58, -0.34]} rotation={[0.2, 0, -0.5]} castShadow>
        <coneGeometry args={[0.03, 0.18, 5]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0, 0.38, -0.48]}>
        <sphereGeometry args={[0.05, 6, 5]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
    </group>
  );
}

function BounceShroom() {
  const { x, z } = SHROOM_AT;
  const y = heightAt(x, z);
  const cap = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (cap.current) {
      const squish = Math.hypot(live.x - x, live.z - z) < 1.2 ? 0.72 : 1;
      cap.current.scale.y = squish + Math.sin(clock.elapsedTime * 2) * 0.04;
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.44, 8]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh ref={cap} position={[0, 0.52, 0]} castShadow>
        <sphereGeometry args={[0.42, 10, 8]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos(i * 1.7) * 0.18, 0.62, Math.sin(i * 1.7) * 0.18]}>
          <sphereGeometry args={[0.07, 6, 5]} />
          <meshLambertMaterial color="#efe6d4" />
        </mesh>
      ))}
    </group>
  );
}

function BeeHive() {
  const { x, z } = BEE_AT;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  const peck = useRef(0);
  const buzz = useRef(0);
  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 1.5 && live.beeRage <= 0) {
      live.beeRage = 7;
      live.hint = "The hive did not like that.";
      sfx.cluck();
    }
    if (d < 1.35 && live.beeRage <= 0 && !live.house && !live.mounted) {
      live.hint = secretHas("bottle") ? "Scoop honey · F" : "Bees. Don't swing.";
      if (secretHas("bottle") && consumeTalk() && !live.smashed.honey) {
        live.smashed.honey = true;
        useGame.getState().healAll();
        live.hint = "Honey in the bottle. Every heart filled.";
        sfx.heal();
      }
    }
    buzz.current -= dt;
    if (d < 5 && buzz.current <= 0) {
      buzz.current = live.beeRage > 0 ? 0.35 : 1.6;
      sfx.buzz();
    }
    g.current.children.forEach((c, i) => {
      if (i === 0) return;
      c.visible = true;
      const rage = live.beeRage > 0;
      const t = clock.elapsedTime * (rage ? 5.2 : 2.1) + i;
      const r = rage ? 0.9 + i * 0.18 : 0.45 + i * 0.08;
      const follow = rage && d < 8;
      const ox = follow ? live.x - x : 0;
      const oz = follow ? live.z - z : 0;
      c.position.set(ox + Math.cos(t * 2.2) * r, 1.35 + Math.sin(t * 3.1) * 0.22, oz + Math.sin(t * 2.2) * r);
    });
    if (live.beeRage > 0 && d < 1.1 && peck.current <= 0 && !live.house) {
      peck.current = 0.5;
      useGame.getState().hurtField(1, true);
      sfx.hit();
    }
    if (live.beeRage > 0 && live.beeRage < 0.2 && !live.smashed.honey) {
      live.smashed.honey = true;
      useGame.getState().healAll();
      live.hint = "Honey. Every heart filled.";
      sfx.heal();
    }
    if (peck.current > 0) peck.current -= dt;
    if (live.beeRage > 0) {
      live.beeRage = Math.max(0, live.beeRage - dt * (live.swim ? 4.2 : 1));
      if (live.swim && !live.smashed.beeswim) pay(7, "The bees would not follow you into the water.", "beeswim");
    }
  });
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i} position={[0.3, 1.55, 0]}>
          <mesh>
            <sphereGeometry args={[0.035, 6, 5]} />
            <meshLambertMaterial color="#f0d060" />
          </mesh>
          <mesh position={[0, 0, 0.01]} scale={[1.05, 0.7, 0.7]}>
            <sphereGeometry args={[0.028, 6, 5]} />
            <meshLambertMaterial color="#2a2018" />
          </mesh>
          <mesh position={[0.04, 0.01, 0]} rotation={[0.4, 0.6, 0]}>
            <planeGeometry args={[0.07, 0.04]} />
            <meshBasicMaterial color="#efe6d4" transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function StuckKite() {
  const { x, z } = KITE_AT;
  const y = heightAt(x, z);
  const got = useRef(false);
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (got.current || live.hat === "kite") {
      if (g.current) g.current.visible = false;
      return;
    }
    if (g.current) {
      g.current.rotation.z = Math.sin(clock.elapsedTime * 1.6) * 0.25;
      g.current.visible = true;
    }
    const hit = live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 1.8;
    if (hit || (!live.house && Math.hypot(live.x - x, live.z - z) < 1.4 && !live.mounted)) {
      if (hit || consumeTalk()) {
        got.current = true;
        live.hat = "kite";
        sfx.ok();
        live.hint = "A kite came loose and stuck to you.";
      } else if (Math.hypot(live.x - x, live.z - z) < 1.4) {
        live.nearHat = "kite";
        live.hint = "A kite in the tree. F or slash";
      }
    }
  });
  return (
    <group ref={g} position={[x, y + 2.4, z]}>
      <mesh rotation={[0.3, 0.4, 0.2]} castShadow>
        <planeGeometry args={[0.7, 0.9]} />
        <meshLambertMaterial color="#3a6a88" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1.4, 4]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}

function FrogChorus() {
  const g = useRef<THREE.Group>(null);
  const sung = useRef(false);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const near = Math.hypot(live.x - POND.x, live.z - POND.z) < POND.r + 4;
    const on = live.songOk && near;
    g.current.visible = on || (live.night && near);
    g.current.children.forEach((c, i) => {
      const t = clock.elapsedTime * 1.4 + i;
      c.position.y = 0.08 + Math.max(0, Math.sin(t * 3) * 0.12);
    });
    if (on && !sung.current) {
      sung.current = true;
      sfx.ok();
      live.hint = "The frogs learned the song.";
      if (!live.smashed.frogs) {
        live.smashed.frogs = true;
        const n = useGame.getState().addCoins(10);
        if (n > 0) revealItem("coin");
      }
    }
    if (!live.songOk) sung.current = false;
  });
  return (
    <group ref={g} position={[POND.x, WATER_Y, POND.z]} visible={false}>
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} position={[Math.cos(i * 1.7) * (POND.r * 0.7), 0.08, Math.sin(i * 1.7) * (POND.r * 0.7)]}>
          <sphereGeometry args={[0.08, 6, 5]} />
          <meshLambertMaterial color="#3d8a68" />
        </mesh>
      ))}
    </group>
  );
}

function PondDuck() {
  const g = useRef<THREE.Group>(null);
  const pos = useRef({ x: POND.x + 4, z: POND.z + 2 });
  const quack = useRef(2.4);
  useFrame((_, dt) => {
    if (!g.current) return;
    const p = pos.current;
    const dist = Math.hypot(live.x - p.x, live.z - p.z);
    quack.current -= dt;
    if (dist < 4.5 && quack.current <= 0 && !live.house) {
      sfx.quack();
      quack.current = live.swim ? 1.4 : 3.8;
      if (dist < 1.8) live.hint = "The duck quacked at you. F";
      if (dist < 1.5 && consumeTalk() && !live.smashed.duck) {
        pay(5, "You quacked back. It paid you to stop.", "duck");
      }
    }
    if (live.swim && Math.hypot(live.x - POND.x, live.z - POND.z) < POND.r + 2) {
      const dx = live.x - p.x;
      const dz = live.z - p.z;
      const d = Math.max(0.2, Math.hypot(dx, dz));
      if (d > 1.3) {
        p.x += (dx / d) * 3.4 * dt;
        p.z += (dz / d) * 3.4 * dt;
      }
      g.current.rotation.y = Math.atan2(-dx, -dz);
      if (d < 1.6) live.hint = "The duck is following you.";
    } else {
      const t = performance.now() * 0.0004;
      p.x = POND.x + Math.cos(t) * (POND.r * 0.55);
      p.z = POND.z + Math.sin(t) * (POND.r * 0.55);
      g.current.rotation.y = t + Math.PI / 2;
    }
    g.current.position.set(p.x, WATER_Y + 0.06, p.z);
  });
  return (
    <group ref={g} position={[POND.x + 4, WATER_Y + 0.06, POND.z + 2]}>
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.18, 3, 6]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[0, 0.16, -0.16]}>
        <sphereGeometry args={[0.08, 6, 5]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[0, 0.14, -0.24]}>
        <coneGeometry args={[0.03, 0.08, 5]} />
        <meshLambertMaterial color="#e07030" />
      </mesh>
    </group>
  );
}

function HorseDrop() {
  const piles = useRef<{ x: number; z: number; t: number }[]>([]);
  const last = useRef(0);
  const g = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  useFrame((_, dt) => {
    if (live.appleFed >= 3 && live.appleFed !== last.current && live.mounted) {
      last.current = live.appleFed;
      const bx = live.x + Math.sin(live.yaw) * 1.1;
      const bz = live.z + Math.cos(live.yaw) * 1.1;
      piles.current.push({ x: bx, z: bz, t: 40 });
      sfx.thud();
      live.hint = "The horse left something.";
      bump((n) => n + 1);
    }
    piles.current.forEach((p) => {
      p.t -= dt;
    });
    if (piles.current.some((p) => p.t <= 0)) {
      piles.current = piles.current.filter((p) => p.t > 0);
      bump((n) => n + 1);
    }
    if (g.current) {
      g.current.children.forEach((c, i) => {
        const p = piles.current[i];
        if (!p) {
          c.visible = false;
          return;
        }
        c.visible = true;
        c.position.set(p.x, heightAt(p.x, p.z) + 0.06, p.z);
      });
    }
  });
  return (
    <group ref={g}>
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} visible={false}>
          <sphereGeometry args={[0.12, 6, 5]} />
          <meshLambertMaterial color="#4a3220" />
        </mesh>
      ))}
    </group>
  );
}

function FieldRabbit() {
  const g = useRef<THREE.Group>(null);
  const pos = useRef({ x: RABBIT_AT.x, z: RABBIT_AT.z });
  const hop = useRef(0);
  const gone = useRef(secretHas("rabbit"));
  const [, bump] = useState(0);
  useFrame((_, dt) => {
    if (!g.current || gone.current) return;
    const p = pos.current;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 6 && d > 0.05 && !(live.stillT > 2 && Math.abs(live.speed) < 0.2 && d < 1.4)) {
      p.x += ((p.x - live.x) / d) * 11 * dt;
      p.z += ((p.z - live.z) / d) * 11 * dt;
      hop.current = 0.22;
      g.current.rotation.y = Math.atan2(-(p.x - live.x), -(p.z - live.z));
    }
    if (d < 1.35 && live.stillT > 2 && Math.abs(live.speed) < 0.2 && !live.house) {
      live.hint = "The rabbit is sniffing you. F";
      if (consumeTalk()) {
        gone.current = true;
        secretTake("rabbit");
        const n = useGame.getState().addCoins(20);
        if (n > 0) revealItem("coin");
        live.hint = "It let you hold it. Then it hopped off and left a rupee.";
        sfx.chime();
        puffAt(p.x, p.z, heightAt(p.x, p.z) + 0.3, true);
        bump((v) => v + 1);
        return;
      }
    }
    if (hop.current > 0) hop.current -= dt;
    const ran = Math.hypot(p.x - RABBIT_AT.x, p.z - RABBIT_AT.z);
    if (ran > 55 && d < 2.8) {
      gone.current = true;
      secretTake("rabbit");
      const n = useGame.getState().addCoins(20);
      if (n > 0) revealItem("coin");
      live.hint = "The rabbit led you to a rupee and vanished.";
      sfx.chime();
      puffAt(p.x, p.z, heightAt(p.x, p.z) + 0.3, true);
      bump((v) => v + 1);
      return;
    }
    g.current.position.set(p.x, heightAt(p.x, p.z) + (hop.current > 0 ? 0.35 : 0.08), p.z);
    if (d < 6) live.hint = "A rabbit. It doesn't want to be friends.";
  });
  if (gone.current) return null;
  return (
    <group ref={g} position={[RABBIT_AT.x, heightAt(RABBIT_AT.x, RABBIT_AT.z), RABBIT_AT.z]} scale={[0.7, 0.7, 0.7]}>
      <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.16, 3, 6]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0, 0.28, -0.14]} castShadow>
        <sphereGeometry args={[0.1, 6, 5]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[-0.04, 0.42, -0.14]} rotation={[0.15, 0, 0.2]}>
        <capsuleGeometry args={[0.025, 0.14, 3, 5]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0.04, 0.42, -0.14]} rotation={[0.15, 0, -0.2]}>
        <capsuleGeometry args={[0.025, 0.14, 3, 5]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}

function TravelerCamp() {
  const { x, z } = CAMP_AT;
  const y = heightAt(x, z);
  const lit = useRef(false);
  useFrame(() => {
    if (!lit.current && live.night) {
      lit.current = true;
      if (!live.fires.some((f) => Math.hypot(f.x - x, f.z - z) < 0.5)) live.fires.push({ x: x + 0.2, z: z + 0.2, boost: 1 });
    }
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.35 && !live.sit && !live.mounted) {
      live.nearChair = true;
      live.sitAt = { x: x - 0.7, z: z + 0.55, yaw: 0.4 };
    }
    if (d < 2.2) {
      live.hint = live.nearCook ? "Cook · F   Traveler · F" : "A traveler. Sit or talk · F";
      if (consumeTalk() && !live.nearCook) {
        live.hint = "Traveler: stand still and a rabbit might sniff you. Follow it if it runs.";
        sfx.ok();
        if (!live.smashed.camp) {
          live.smashed.camp = true;
          const n = useGame.getState().addCoins(5);
          if (n > 0) revealItem("coin");
        }
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0.8, 0.15, 0.4]} castShadow>
        <coneGeometry args={[0.9, 1.4, 5]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.45, 4, 8]} />
        <meshLambertMaterial color="#3a6a88" />
      </mesh>
      <mesh position={[0, 0.78, -0.02]} castShadow>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshLambertMaterial color="#c4a090" />
      </mesh>
      <mesh position={[0.2, 0.12, 0.2]}>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshLambertMaterial color="#c45c48" emissive="#c45c48" emissiveIntensity={0.4} />
      </mesh>
      <pointLight color="#ffb050" intensity={live.night ? 1.4 : 0.2} distance={6} position={[0.2, 0.4, 0.2]} />
    </group>
  );
}

function SheepFlock() {
  const g = useRef<THREE.Group>(null);
  const flock = useRef(
    [0, 1, 2].map((i) => ({
      x: SHEEP_AT.x + Math.cos(i * 2.1) * 2.2,
      z: SHEEP_AT.z + Math.sin(i * 2.1) * 2.2,
      vx: 0,
      vz: 0,
      wool: true,
    })),
  );
  useFrame((_, dt) => {
    if (!g.current) return;
    const charging = live.mounted && (live.horseGallop || Math.abs(live.speed) > 16);
    flock.current.forEach((s, i) => {
      const d = Math.hypot(live.x - s.x, live.z - s.z);
      if (charging && d < 1.4) {
        const fx = -Math.sin(live.yaw);
        const fz = -Math.cos(live.yaw);
        s.vx = fx * 8;
        s.vz = fz * 8;
        sfx.baa();
        live.hint = "The sheep scattered.";
        if (!live.smashed.sheep) {
          live.smashed.sheep = true;
          const n = useGame.getState().addCoins(5);
          if (n > 0) revealItem("coin");
        }
      }
      s.x += s.vx * dt;
      s.z += s.vz * dt;
      s.vx *= Math.exp(-dt * 2);
      s.vz *= Math.exp(-dt * 2);
      live.sheep[`sec${i}`] = { x: s.x, z: s.z, r: 0.55 };
      const c = g.current!.children[i];
      if (c) {
        c.position.set(s.x, heightAt(s.x, s.z), s.z);
        if (Math.hypot(s.vx, s.vz) > 0.4) c.rotation.y = Math.atan2(-s.vx, -s.vz);
        c.scale.set(s.wool ? 1.05 : 0.78, s.wool ? 0.95 : 0.72, s.wool ? 1.15 : 0.85);
      }
      if (s.wool && d < 1.25 && !live.mounted && !live.house) {
        live.hint = "Pick wool · F";
        if (consumeTalk()) {
          s.wool = false;
          sfx.rustle();
          live.hint = "A puff of wool.";
          if (!live.smashed.wool) {
            live.smashed.wool = true;
            const n = useGame.getState().addCoins(5);
            if (n > 0) revealItem("coin");
            live.hint = "The wool had a rupee in it.";
          }
        }
      }
    });
  });
  return (
    <group ref={g}>
      {flock.current.map((s, i) => (
        <group key={i} position={[s.x, heightAt(s.x, s.z), s.z]} scale={[1.05, 0.95, 1.15]}>
          <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.2, 0.28, 4, 8]} />
            <meshLambertMaterial color="#efe6d4" />
          </mesh>
          <mesh position={[0, 0.32, -0.28]} castShadow>
            <sphereGeometry args={[0.12, 7, 6]} />
            <meshLambertMaterial color="#3a2818" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SnowMan() {
  const { x, z } = SNOW_AT;
  const y = heightAt(x, z);
  const smashed = useRef(false);
  const hatted = useRef(false);
  const g = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  useFrame(() => {
    if (smashed.current || !g.current) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (!hatted.current && live.hat === "pumpkin" && d < 1.6 && !live.house) {
      live.hint = "Put the pumpkin on the snowman · F";
      if (consumeTalk()) {
        hatted.current = true;
        live.hat = null;
        live.hint = "He looks finished.";
        if (!live.smashed.snowhat) {
          live.smashed.snowhat = true;
          const n = useGame.getState().addCoins(15);
          if (n > 0) revealItem("coin");
        }
        bump((v) => v + 1);
      }
    }
    const hit =
      (live.mounted && (live.horseGallop || Math.abs(live.speed) > 16) && d < 1.4) ||
      (live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 1.4);
    if (hit) {
      smashed.current = true;
      puffAt(x, z, y + 0.8, true);
      sfx.thud();
      const n = useGame.getState().addCoins(20);
      if (n > 0) revealItem("coin");
      live.hint = "The snowman had a gold rupee for a heart.";
      bump((v) => v + 1);
    }
  });
  if (smashed.current) return null;
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.38, 10, 8]} />
        <meshLambertMaterial color="#eef4f8" />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.26, 10, 8]} />
        <meshLambertMaterial color="#eef4f8" />
      </mesh>
      <mesh position={[0, 1.18, 0]} castShadow>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshLambertMaterial color="#eef4f8" />
      </mesh>
      <mesh position={[0, 1.16, -0.18]}>
        <coneGeometry args={[0.04, 0.16, 5]} />
        <meshLambertMaterial color="#e07030" />
      </mesh>
      {hatted.current ? (
        <mesh position={[0, 1.38, 0]} castShadow>
          <sphereGeometry args={[0.16, 8, 6]} />
          <meshLambertMaterial color="#e07030" />
        </mesh>
      ) : null}
    </group>
  );
}

function NightStar() {
  const g = useRef<THREE.Group>(null);
  const t = useRef(0);
  const got = useRef(false);
  useFrame((_, dt) => {
    if (!g.current) return;
    const onHill = Math.hypot(live.x - STAR_HILL.x, live.z - STAR_HILL.z) < 18;
    const show = live.night && live.stillT > 3.5 && onHill && !got.current;
    g.current.visible = show || t.current > 0;
    if (show && t.current <= 0) t.current = 2.4;
    if (t.current > 0) {
      t.current -= dt;
      const u = 1 - t.current / 2.4;
      g.current.position.set(STAR_HILL.x + 8 - u * 22, 14 - u * 6, STAR_HILL.z - 4 + u * 10);
      if (t.current < 0.4 && !got.current && live.stillT > 3) {
        got.current = true;
        const n = useGame.getState().addCoins(20);
        if (n > 0) revealItem("coin");
        live.hint = "You wished on a star.";
        sfx.chime();
      }
    }
  });
  return (
    <group ref={g} visible={false}>
      <mesh>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshBasicMaterial color="#fff4d8" />
      </mesh>
    </group>
  );
}

function RainFall() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const on = live.rainT > 0 && !live.house;
    g.current.visible = on;
    if (!on) return;
    g.current.position.set(live.x, live.y + 4, live.z);
    g.current.children.forEach((c, i) => {
      const t = clock.elapsedTime * 8 + i * 0.37;
      c.position.set(((i * 17) % 11) - 5, 2 - (t % 4.2), ((i * 13) % 11) - 5);
    });
  });
  return (
    <group ref={g} visible={false}>
      {Array.from({ length: 40 }, (_, i) => (
        <mesh key={i}>
          <cylinderGeometry args={[0.012, 0.012, 0.35, 3]} />
          <meshBasicMaterial color="#a8c8e0" transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function WindowPie() {
  const hut = { x: vWorld(24, -66).x, z: vWorld(24, -66).z };
  const x = hut.x + 2.1;
  const z = hut.z + 0.2;
  const y = heightAt(hut.x, hut.z) + 1.15;
  const got = useRef(false);
  const g = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  useFrame(() => {
    if (got.current || live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 1.35) {
      live.hint = "A pie cooling. F to take it";
      if (consumeTalk()) {
        got.current = true;
        useGame.getState().healAll();
        sfx.ok();
        live.hint = "Nana's going to notice.";
        live.smashed.nanapie = true;
        bump((v) => v + 1);
      }
    }
  });
  if (got.current) return null;
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 10]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.12, 8, 5]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
    </group>
  );
}

function GiantShroom() {
  const { x, z } = GIANT_AT;
  const y = heightAt(x, z);
  const cap = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!cap.current) return;
    const on = Math.hypot(live.x - x, live.z - z) < 1.25 && !live.house;
    cap.current.scale.y = (on ? 0.72 : 1) + Math.sin(clock.elapsedTime * 1.6) * 0.05;
    cap.current.position.y = on ? 0.52 : 0.62;
    if (on && live.y > y + 0.9 && live.tinyT <= 0 && !live.mounted) {
      live.tinyT = 22;
      sfx.ok();
      live.hint = "You got small. A little hole might fit you now.";
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.55, 8]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh ref={cap} position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.55, 10, 8]} />
        <meshLambertMaterial color="#3a6a88" />
      </mesh>
    </group>
  );
}

function IcePond() {
  const { x, z } = ICE_AT;
  const y = heightAt(x, z) + 0.04;
  const spark = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!spark.current) return;
    const on = Math.hypot(live.x - x, live.z - z) < 8.2 && Math.abs(live.speed) > 4 && !live.house;
    spark.current.visible = on;
    if (!on) return;
    spark.current.position.set(live.x, y + 0.08, live.z);
    spark.current.children.forEach((c, i) => {
      const t = clock.elapsedTime * 8 + i;
      c.position.set(Math.cos(t * 2.2 + i) * 0.35, (t % 1) * 0.4, Math.sin(t * 2.2 + i) * 0.35);
    });
    if (on && Math.abs(live.speed) > 12 && !live.smashed.iceskate) {
      live.smashed.iceskate = true;
      live.hint = "You're skating.";
      sfx.ok();
    }
  });
  return (
    <group>
      <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[8.2, 24]} />
        <meshLambertMaterial color="#c8e4f0" transparent opacity={0.85} />
      </mesh>
      <group ref={spark} visible={false}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.04, 5, 4]} />
            <meshBasicMaterial color="#e8f4ff" transparent opacity={0.7} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function NightOwl() {
  const { x, z } = OWL_AT;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!g.current) return;
    g.current.visible = true;
    g.current.position.set(x, y + (live.night ? 3.4 : 3.15), z);
    g.current.rotation.x = live.night ? 0 : 0.55;
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 3.2) {
      if (!live.night) live.listen = live.listen || "A sleeping owl.";
      else {
        live.listen = live.songOk ? "The owl likes that song." : "An owl. Talk to it.";
        if (live.songOk && !live.smashed.owl) {
          live.smashed.owl = true;
          const n = useGame.getState().addCoins(10);
          if (n > 0) revealItem("coin");
          sfx.hoot();
          live.listen = "The owl dropped a rupee. Then it looked at the keep. Then at the tree roots.";
        } else if (consumeTalk()) {
          sfx.hoot();
          live.listen = "Hoo. The tree has a mouth in the roots. The keep has a crack. The pond has a person.";
        }
      }
    }
    if (d < 3.2 && !live.night) live.listen = live.listen || "A sleeping owl. Come back when it is dark.";
  });
  return (
    <group ref={g} visible={false}>
      <mesh castShadow>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 0.16, -0.02]}>
        <sphereGeometry args={[0.14, 7, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[-0.05, 0.2, -0.12]}>
        <sphereGeometry args={[0.035, 5, 4]} />
        <meshLambertMaterial color="#e8d48a" />
      </mesh>
      <mesh position={[0.05, 0.2, -0.12]}>
        <sphereGeometry args={[0.035, 5, 4]} />
        <meshLambertMaterial color="#e8d48a" />
      </mesh>
    </group>
  );
}

function BushSeller() {
  const { x, z } = BUSH_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.8) {
      live.hint = live.hat === "mask" ? "The bush is quiet now." : "A bush? F";
      if (live.hat !== "mask" && consumeTalk()) {
        const coins = useGame.getState().coins ?? 0;
        if (coins >= 10) {
          useGame.setState({ coins: coins - 10 });
          live.hat = "mask";
          sfx.ok();
          live.hint = "A mask from the bush. Don't ask.";
        } else live.hint = "It wants 10 rupees for a mask.";
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.55, 8, 6]} />
        <meshLambertMaterial color="#3d8a68" />
      </mesh>
      <mesh position={[0.12, 0.55, -0.4]}>
        <sphereGeometry args={[0.05, 6, 5]} />
        <meshLambertMaterial color="#e8d48a" />
      </mesh>
    </group>
  );
}

function CrateStack() {
  const { x, z } = CRATE_AT;
  const y = heightAt(x, z);
  const broke = useRef(false);
  const g = useRef<THREE.Group>(null);
  const [, bump] = useState(0);
  useFrame(() => {
    if (broke.current) return;
    if (Math.hypot(live.x - x, live.z - z) < 1.2 && live.y > y + 1.1 && !live.smashed.crates) {
      live.smashed.crates = true;
      const n = useGame.getState().addCoins(5);
      if (n > 0) revealItem("coin");
      sfx.chime();
    }
    if (Math.hypot(live.x - x, live.z - z) < 1.4 && consumeTalk() && !live.carry) {
      live.carry = "crate";
      sfx.ok();
      if (!live.smashed.cratecarry) pay(6, "You picked up a crate. Z throws it.", "cratecarry");
    }
    const smash =
      (live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 1.5) ||
      live.bombs.some((b) => b.boom && Math.hypot(b.x - x, b.z - z) < 2.4);
    if (smash) {
      broke.current = true;
      puffAt(x, z, y + 0.5, true);
      sfx.smash();
      if (!live.smashed.cratebreak) {
        live.smashed.cratebreak = true;
        const n = useGame.getState().addCoins(8);
        if (n > 0) revealItem("coin");
        live.hint = "The crates were full of packing rupees.";
      } else live.hint = "Smashed.";
      bump((v) => v + 1);
    }
  });
  if (broke.current || live.carry === "crate") return null;
  return (
    <group ref={g} position={[x, y, z]}>
      <WoodCrate y={0.28} s={1} yaw={0.08} />
      <WoodCrate y={0.82} s={0.82} yaw={-0.22} />
    </group>
  );
}

function WoodCrate({ y, s, yaw }: { y: number; s: number; yaw: number }) {
  return (
    <group position={[0, y, 0]} rotation={[0, yaw, 0]} scale={s}>
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.5, 0.7]} />
        <meshLambertMaterial color="#8a5a28" />
      </mesh>
      <mesh position={[0, 0.27, 0]} castShadow>
        <boxGeometry args={[0.74, 0.06, 0.74]} />
        <meshLambertMaterial color="#6a4220" />
      </mesh>
      {[-0.24, 0.24].map((v) => (
        <mesh key={`x${v}`} position={[v, 0, 0]} castShadow>
          <boxGeometry args={[0.07, 0.52, 0.72]} />
          <meshLambertMaterial color="#3a2414" />
        </mesh>
      ))}
      {[-0.24, 0.24].map((v) => (
        <mesh key={`z${v}`} position={[0, 0, v]} castShadow>
          <boxGeometry args={[0.72, 0.52, 0.07]} />
          <meshLambertMaterial color="#3a2414" />
        </mesh>
      ))}
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[0.74, 0.05, 0.74]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
    </group>
  );
}

function TalkTree() {
  const { x, z } = TALK_TREE;
  const y = heightAt(x, z);
  const n = useRef(0);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.8) {
      live.hint = "A tree. F to talk to it";
      if (consumeTalk()) {
        n.current += 1;
        sfx.rustle();
        if (n.current === 1) live.hint = "...hello.";
        else if (n.current === 2) live.hint = "The tree is listening.";
        else if (n.current === 3) {
          live.hint = "A leaf fell on your head.";
          live.leafN += 1;
        } else if (n.current === 4 && !live.smashed.talktree) {
          live.smashed.talktree = true;
          live.drops.push({ id: "tree-c", kind: "coin", x: x + 0.6, z, y: y + 0.5, n: 5 });
          live.hint = "The tree said nothing. Then a rupee fell.";
        } else live.hint = "It's a tree.";
      }
    }
  });
  return null;
}

function PondFrog() {
  const g = useRef<THREE.Group>(null);
  const pos = useRef({ x: POND.x + POND.r * 0.85, z: POND.z + 2 });
  useFrame((_, dt) => {
    if (!g.current) return;
    if (live.carry === "frog") {
      g.current.visible = false;
      return;
    }
    g.current.visible = true;
    const p = pos.current;
    const t = performance.now() * 0.0005;
    p.x = POND.x + Math.cos(t) * (POND.r * 0.82);
    p.z = POND.z + Math.sin(t) * (POND.r * 0.82);
    g.current.position.set(p.x, WATER_Y + 0.08 + (Math.sin(t * 8) > 0.7 ? 0.16 : 0), p.z);
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 1.35 && !live.mounted && !live.house && !live.carry) {
      live.nearPet = "frog";
      if (!live.nearNpc) live.hint = "Pick up the frog · F";
    }
  });
  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[0.1, 6, 5]} />
        <meshLambertMaterial color="#3d8a68" />
      </mesh>
      <mesh position={[0, 0.05, -0.1]}>
        <sphereGeometry args={[0.07, 6, 5]} />
        <meshLambertMaterial color="#3d8a68" />
      </mesh>
    </group>
  );
}

function HillFlag() {
  const { x, z } = FLAG_AT;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  const down = useRef(false);
  const [, bump] = useState(0);
  useFrame(({ clock }) => {
    if (!g.current) return;
    if (!down.current && g.current.children[1]) {
      g.current.children[1].rotation.y = Math.sin(clock.elapsedTime * 2.2) * 0.4;
    }
    const hit = live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 1.6;
    if (hit && !down.current) {
      down.current = true;
      sfx.thud();
      const n = useGame.getState().addCoins(10);
      if (n > 0) revealItem("coin");
      live.hint = "You cut the flag down.";
      bump((v) => v + 1);
    }
    if (down.current && g.current.children[1]) {
      g.current.children[1].rotation.z = 1.2;
      g.current.children[1].position.y = 0.4;
    }
  });
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 3.2, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0.35, 2.7, 0]} castShadow>
        <planeGeometry args={[0.7, 0.45]} />
        <meshLambertMaterial color="#c45c48" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function DesertCactus() {
  const { x, z } = DESERT_AT;
  const y = heightAt(x, z);
  const poked = useRef(false);
  const fruit = useRef(true);
  const [, bump] = useState(0);
  useFrame(() => {
    const d = Math.hypot(live.x - x, live.z - z);
    const hit =
      d < 0.72 ||
      (live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 1.3);
    if (hit && !poked.current && !live.house) {
      poked.current = true;
      useGame.getState().hurtField(1, true);
      sfx.hit();
      live.hint = "Ow. Cactus.";
      if (!live.smashed.cactus) {
        live.smashed.cactus = true;
        const n = useGame.getState().addCoins(5);
        if (n > 0) revealItem("coin");
      }
      window.setTimeout(() => {
        poked.current = false;
      }, 800);
    }
    if (fruit.current && d < 1.55 && d > 0.85 && !live.house && !live.mounted) {
      live.hint = "Pick the cactus fruit · F";
      if (consumeTalk()) {
        fruit.current = false;
        useGame.getState().healGrass();
        sfx.ok();
        live.hint = "Sweet. A little dusty.";
        bump((v) => v + 1);
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 1.4, 8]} />
        <meshLambertMaterial color="#3d8a68" />
      </mesh>
      <mesh position={[0.28, 0.85, 0]} rotation={[0, 0, 1.1]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.55, 6]} />
        <meshLambertMaterial color="#3d8a68" />
      </mesh>
      <mesh position={[-0.22, 1.05, 0]} rotation={[0, 0, -0.9]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.45, 6]} />
        <meshLambertMaterial color="#3d8a68" />
      </mesh>
      {fruit.current ? (
        <mesh position={[0.22, 1.22, 0.08]} castShadow>
          <sphereGeometry args={[0.08, 6, 5]} />
          <meshLambertMaterial color="#c45c48" />
        </mesh>
      ) : null}
    </group>
  );
}

function FieldBell() {
  const { x, z } = BELL_AT;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  const ring = useRef(0);
  const n = useRef(0);
  useFrame((_, dt) => {
    if (!g.current) return;
    if (ring.current > 0) {
      ring.current -= dt;
      g.current.rotation.z = Math.sin(ring.current * 22) * 0.25;
    } else g.current.rotation.z *= 0.9;
    const d = Math.hypot(live.x - x, live.z - z);
    const hit = live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 1.6;
    if ((d < 1.5 && !live.house && consumeTalk()) || hit) {
      if (ring.current <= 0.15) {
        ring.current = 0.9;
        sfx.chime();
        n.current += 1;
        live.bellT = 3.2;
        live.listen = live.night ? "The bell. Home might hear it." : "The bell rang.";
        if (n.current === 3 && !live.smashed.bell) {
          live.smashed.bell = true;
          const c = useGame.getState().addCoins(10);
          if (c > 0) revealItem("coin");
          live.listen = live.night
            ? "Three rings. The lamp at the tree got brighter. They heard you."
            : "Three rings. Something fell out.";
        }
      }
    } else if (d < 1.5 && !live.house) live.listen = live.listen || "A bell. Hit it. At night, three times.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 2.2, 6]} />
        <meshLambertMaterial color="#5a3d24" />
      </mesh>
      <group ref={g} position={[0, 2.05, 0]}>
        <mesh>
          <sphereGeometry args={[0.22, 8, 6]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      </group>
    </group>
  );
}

function IceFish() {
  const { x, z } = ICE_AT;
  const got = useRef(false);
  const [, bump] = useState(0);
  useFrame(() => {
    if (got.current || live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 3.2) {
      live.hint = "Something's frozen in the ice. F";
      if (consumeTalk()) {
        got.current = true;
        useGame.getState().addFish();
        revealItem("fish");
        sfx.ok();
        live.hint = "A fish from the ice.";
        bump((v) => v + 1);
      }
    }
  });
  if (got.current) return null;
  return (
    <mesh position={[x + 1.2, heightAt(x, z) + 0.08, z - 0.8]} rotation={[0.2, 0.4, 0.1]}>
      <capsuleGeometry args={[0.06, 0.18, 3, 5]} />
      <meshLambertMaterial color="#3a6a88" />
    </mesh>
  );
}

function NorthLights() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const on = live.night && Math.hypot(live.x - SNOW_AT.x, live.z - SNOW_AT.z) < 80;
    g.current.visible = on;
    if (!on) return;
    g.current.children.forEach((c, i) => {
      const t = clock.elapsedTime * 0.4 + i;
      c.position.x = Math.sin(t) * 12 + i * 4;
      (c as THREE.Mesh).scale.setScalar(1.2 + Math.sin(t * 1.6) * 0.3);
    });
    if (on && !live.smashed.aurora && live.stillT > 2) {
      live.smashed.aurora = true;
      live.hint = "The sky is doing something.";
      const n = useGame.getState().addCoins(20);
      if (n > 0) revealItem("coin");
      sfx.chime();
    }
  });
  return (
    <group ref={g} position={[SNOW_AT.x, heightAt(SNOW_AT.x, SNOW_AT.z) + 18, SNOW_AT.z]} visible={false}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[i * 4, 0, 0]} rotation={[0.2, 0, 0]}>
          <planeGeometry args={[8, 5]} />
          <meshBasicMaterial color={i % 2 ? "#6ad0a8" : "#88a0e8"} transparent opacity={0.28} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function KickLog() {
  const pos = useRef({ x: LOG_AT.x, z: LOG_AT.z, vx: 0, vz: 0 });
  const g = useRef<THREE.Group>(null);
  const spin = useRef(0);
  useFrame((_, dt) => {
    if (!g.current) return;
    const p = pos.current;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    const hit =
      (live.mounted && (live.horseGallop || Math.abs(live.speed) > 16) && d < 1.4) ||
      (!live.mounted && Math.abs(live.speed) > 5.5 && d < 1.2);
    if (hit) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      p.vx = fx * 10;
      p.vz = fz * 10;
      sfx.thud();
      live.hint = "The log rolled.";
      if (!live.smashed.log) {
        live.smashed.log = true;
        const n = useGame.getState().addCoins(5);
        if (n > 0) revealItem("coin");
      }
    }
    p.x += p.vx * dt;
    p.z += p.vz * dt;
    p.vx *= Math.exp(-dt * 1.4);
    p.vz *= Math.exp(-dt * 1.4);
    spin.current += Math.hypot(p.vx, p.vz) * dt * 1.8;
    g.current.position.set(p.x, heightAt(p.x, p.z) + 0.22, p.z);
    g.current.rotation.x = spin.current;
  });
  return (
    <group ref={g} position={[LOG_AT.x, heightAt(LOG_AT.x, LOG_AT.z) + 0.22, LOG_AT.z]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 1.6, 8]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function BirdBurst() {
  const g = useRef<THREE.Group>(null);
  const home = { x: 90, z: 40 };
  const scare = useRef(0);
  useFrame((_, dt) => {
    if (!g.current) return;
    const d = Math.hypot(live.x - home.x, live.z - home.z);
    if (d < 3.2 && Math.abs(live.speed) > 4) {
      if (scare.current <= 0) {
        sfx.hoot();
        live.hint = "Birds everywhere.";
        if (!live.smashed.birds) {
          live.smashed.birds = true;
          const n = useGame.getState().addCoins(5);
          if (n > 0) revealItem("coin");
        }
      }
      scare.current = 2.4;
    }
    if (scare.current > 0) scare.current -= dt;
    g.current.children.forEach((c, i) => {
      const t = performance.now() * 0.002 + i;
      if (scare.current > 0) {
        c.position.set(Math.cos(t * 3) * (4 + scare.current), 2 + scare.current * 1.4, Math.sin(t * 3) * (4 + scare.current));
      } else {
        c.position.set(Math.cos(t) * 1.2, 1.1 + Math.sin(t * 2) * 0.2, Math.sin(t) * 1.2);
      }
    });
  });
  return (
    <group ref={g} position={[home.x, heightAt(home.x, home.z), home.z]}>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.07, 5, 4]} />
          <meshLambertMaterial color="#3a2818" />
        </mesh>
      ))}
    </group>
  );
}

function pay(n: number, _hint: string, key?: string) {
  if (key) {
    if (live.smashed[key]) return;
    live.smashed[key] = true;
  }
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
}

function WhimsyPack() {
  return (
    <group>
      <WindHill />
      <MoonPondSecret />
      <LostCart />
      <HatRock />
      <KickBall />
      <SneezeTree />
      <JumpMole />
      <ShyMerchant />
      <TinyHole />
      <HideBarrel />
      <EchoRock />
      <ScarecrowCopy />
      <PumpkinPatch />
      <CircleDance />
      <ExtraWhimsy />
    </group>
  );
}

function WindHill() {
  const { x, z } = WIND_HILL;
  const y = heightAt(x, z);
  const cool = useRef(0);
  const gust = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (gust.current) {
      gust.current.visible = !live.house;
      gust.current.rotation.y += dt * 1.8;
    }
    if (live.house || live.mounted) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 12) live.windT = Math.max(live.windT, 0.6);
    if (d < 5.4 && live.grounded && cool.current <= 0 && live.y > y - 3.2) {
      cool.current = 2.4;
      live.boostY = live.hat === "kite" ? 22 : live.jumpN >= 2 ? 18 : 13.5;
      live.knock = { vx: live.hat === "kite" ? 30 : 22, vz: 6, t: live.hat === "kite" ? 1.15 : 0.85 };
      puffAt(live.x, live.z, live.y + 0.2);
      sfx.jump();
      live.hint = live.hat === "kite" ? "The kite stole you." : "The hill threw you.";
      if (!live.smashed.windhill) {
        live.smashed.windhill = true;
        const n = useGame.getState().addCoins(5);
        if (n > 0) revealItem("coin");
      }
    } else if (d < 9 && live.grounded) {
      live.hint = "A mean wind lives up here.";
    }
  });
  return (
    <group position={[x, y, z]}>
      <group ref={gust} position={[0, 2.2, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.cos(i) * 1.4, i * 0.35, Math.sin(i) * 1.4]} rotation={[0.4, i, 0.2]}>
            <planeGeometry args={[1.6, 0.35]} />
            <meshBasicMaterial color="#d8e8f0" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function MoonPondSecret() {
  const { x, z } = MOON_POND;
  const y = heightAt(x, z) + 0.08;
  const fish = useRef<THREE.Group>(null);
  const caught = useRef(secretHas("moon-fish"));
  const [, bump] = useState(0);
  useFrame(({ clock }) => {
    if (!fish.current) return;
    const night = live.night && !live.house;
    fish.current.visible = night;
    if (!night) return;
    fish.current.children.forEach((c, i) => {
      const t = clock.elapsedTime * 0.7 + i * 1.1;
      c.position.set(Math.cos(t) * (4.2 + (i % 3)), 0.06 + Math.sin(t * 2.2) * 0.05, Math.sin(t * 0.9) * (3.6 + (i % 2)));
    });
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 7.4) {
      if (live.hat === "mask" && night && live.stillT > 2.4 && !live.smashed.mermaid) {
        pay(40, "A mermaid waved. Then she was a rupee.", "mermaid");
      } else {
      live.hint = caught.current ? "The pond remembers you." : "Moon fish. F to scoop one";
      if (!caught.current && consumeTalk()) {
        caught.current = true;
        secretTake("moon-fish");
        useGame.getState().addFish();
        revealItem("fish");
        const n = useGame.getState().addCoins(15);
        if (n > 0) revealItem("coin");
        sfx.ok();
        live.hint = "It glowed in your hands. Then it was a rupee.";
        bump((v) => v + 1);
      }
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[11.4, 28]} />
        <meshLambertMaterial color="#3a6a88" transparent opacity={0.82} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[7.2, 20]} />
        <meshLambertMaterial color="#88b8d0" transparent opacity={0.35} />
      </mesh>
      <group ref={fish} visible={false}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i}>
            <capsuleGeometry args={[0.05, 0.16, 3, 5]} />
            <meshBasicMaterial color="#d8f0ff" transparent opacity={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function LostCart() {
  const { x, z } = LOST_CART;
  const y = heightAt(x, z);
  const got = useRef(secretHas("lost-cart"));
  const [, bump] = useState(0);
  useFrame(() => {
    if (got.current || live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.2) {
      live.hint = "Somebody left a cart. F";
      if (consumeTalk()) {
        got.current = true;
        secretTake("lost-cart");
        pay(25, "A note: 'back in five years.'");
        bump((v) => v + 1);
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.8, 0.22, 1.05]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 0.78, 0.42]} castShadow>
        <boxGeometry args={[1.7, 0.7, 0.08]} />
        <meshLambertMaterial color="#8a6a40" />
      </mesh>
      <mesh position={[0.7, 0.28, 0.48]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.08, 10]} />
        <meshLambertMaterial color="#3a2818" />
      </mesh>
      <mesh position={[-0.7, 0.28, 0.48]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.08, 10]} />
        <meshLambertMaterial color="#3a2818" />
      </mesh>
      <mesh position={[0.7, 0.28, -0.48]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.08, 10]} />
        <meshLambertMaterial color="#3a2818" />
      </mesh>
      <mesh position={[-0.7, 0.28, -0.48]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.08, 10]} />
        <meshLambertMaterial color="#3a2818" />
      </mesh>
      {!got.current ? (
        <group position={[0.1, 0.72, 0]}>
          <RupeeMesh tint="green" scale={0.7} />
        </group>
      ) : null}
    </group>
  );
}

function HatRock() {
  const { x, z } = HAT_ROCK;
  const y = heightAt(x, z);
  const took = useRef(live.hat === "giant" || Boolean(live.smashed.gianthat));
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.visible = !took.current;
    if (took.current || live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.1) {
      live.nearHat = "giant";
      live.hint = "A hat for a giant. F";
      if (consumeTalk()) {
        took.current = true;
        live.hat = "giant";
        live.smashed.gianthat = true;
        sfx.ok();
        live.hint = "It covers your whole face. Perfect.";
      }
    }
    if (g.current) g.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.08;
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <dodecahedronGeometry args={[1.15, 0]} />
        <meshLambertMaterial color="#6a6860" />
      </mesh>
      <group ref={g} position={[0, 1.55, 0]}>
        <mesh rotation={[-0.12, 0, 0]} castShadow>
          <cylinderGeometry args={[0.95, 1.35, 0.28, 12]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.62, 0.55, 10]} />
          <meshLambertMaterial color="#d8b84a" />
        </mesh>
      </group>
    </group>
  );
}

function KickBall() {
  const pos = useRef({ x: BALL_AT.x, z: BALL_AT.z, vx: 0, vz: 0 });
  const g = useRef<THREE.Group>(null);
  const hoop = { x: BALL_AT.x + 8.4, z: BALL_AT.z - 2.2 };
  const scored = useRef(Boolean(live.smashed.kickball));
  useFrame((_, dt) => {
    if (!g.current) return;
    const p = pos.current;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (!live.house && !live.mounted && Math.abs(live.speed) > 3.2 && d < 0.95) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      p.vx = fx * Math.min(16, 6 + Math.abs(live.speed));
      p.vz = fz * Math.min(16, 6 + Math.abs(live.speed));
      sfx.thud();
      live.hint = "Kick!";
    }
    p.x += p.vx * dt;
    p.z += p.vz * dt;
    p.vx *= Math.exp(-dt * 1.15);
    p.vz *= Math.exp(-dt * 1.15);
    g.current.position.set(p.x, heightAt(p.x, p.z) + 0.22, p.z);
    g.current.rotation.x += p.vz * dt * 1.4;
    g.current.rotation.z -= p.vx * dt * 1.4;
    if (!scored.current && Math.hypot(p.x - hoop.x, p.z - hoop.z) < 1.15) {
      scored.current = true;
      pay(20, "In. The hoop did not ask for that.", "kickball");
    }
  });
  return (
    <group>
      <group ref={g} position={[BALL_AT.x, heightAt(BALL_AT.x, BALL_AT.z) + 0.22, BALL_AT.z]}>
        <mesh castShadow>
          <sphereGeometry args={[0.22, 10, 8]} />
          <meshLambertMaterial color="#c45c48" />
        </mesh>
      </group>
      <group position={[hoop.x, heightAt(hoop.x, hoop.z), hoop.z]}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 1.4, 6]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
        <mesh position={[0, 1.35, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.04, 6, 14]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      </group>
    </group>
  );
}

function SneezeTree() {
  const { x, z } = SNEEZE_TREE;
  const y = heightAt(x, z);
  const cool = useRef(0);
  const shake = useRef(0);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (shake.current > 0) shake.current -= dt;
    if (g.current) g.current.rotation.z = Math.sin(shake.current * 28) * shake.current * 0.18;
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.55 && Math.abs(live.speed) > 7 && cool.current <= 0) {
      cool.current = 4.5;
      shake.current = 0.7;
      sfx.hiss();
      sfx.hoot();
      live.hint = "ACHOO.";
      puffAt(x, z, y + 1.6);
      if (!live.smashed.sneeze) {
        pay(10, "The tree sneezed rupees on you.", "sneeze");
      } else live.hint = "It already sneezed today.";
    } else if (d < 2.2) live.hint = "This tree looks allergic.";
  });
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 1.8, 7]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 2.05, 0]} castShadow>
        <sphereGeometry args={[1.05, 8, 6]} />
        <meshLambertMaterial color="#3d8a68" />
      </mesh>
    </group>
  );
}

function JumpMole() {
  const { x, z } = MOLE_AT;
  const y = heightAt(x, z);
  const out = useRef(0);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 3.4 && live.jumpN >= 8 && out.current <= 0) {
      out.current = 4.2;
      sfx.thud();
      live.hint = "A mole hated the stomping.";
      if (!live.smashed.mole) pay(15, "It tossed a rupee and hid.", "mole");
    }
    if (out.current > 0) out.current -= dt;
    const show = out.current > 0 ? Math.min(1, out.current) : 0;
    g.current.position.y = y + show * 0.42 - 0.22;
    g.current.visible = show > 0.05;
  });
  return (
    <group>
      <mesh position={[x, y + 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 10]} />
        <meshLambertMaterial color="#3a2818" />
      </mesh>
      <group ref={g} position={[x, y - 0.22, z]} visible={false}>
        <mesh castShadow>
          <sphereGeometry args={[0.16, 8, 6]} />
          <meshLambertMaterial color="#4a3828" />
        </mesh>
        <mesh position={[-0.05, 0.06, -0.12]}>
          <sphereGeometry args={[0.03, 5, 4]} />
          <meshLambertMaterial color="#1a1410" />
        </mesh>
        <mesh position={[0.05, 0.06, -0.12]}>
          <sphereGeometry args={[0.03, 5, 4]} />
          <meshLambertMaterial color="#1a1410" />
        </mesh>
      </group>
    </group>
  );
}

function ShyMerchant() {
  const { x, z } = SHY_AT;
  const g = useRef<THREE.Group>(null);
  const sold = useRef(Boolean(live.smashed.shy));
  useFrame(() => {
    if (!g.current) return;
    const show = live.backT > 26 && !live.house && !live.mounted;
    g.current.visible = show;
    if (!show) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.8) {
      live.hint = sold.current ? "He already sold you the quiet." : "He only talks to people walking backwards. F";
      if (!sold.current && consumeTalk()) {
        const coins = useGame.getState().coins ?? 0;
        if (coins >= 5) {
          useGame.setState({ coins: coins - 5 });
          sold.current = true;
          live.smashed.shy = true;
          useGame.getState().healGrass();
          sfx.ok();
          live.hint = "A shy drink. Hearts a little better.";
        } else live.hint = "Five rupees. He whispers it.";
      }
    }
  });
  return (
    <group ref={g} visible={false}>
      <N64Person
        look={{
          ...HERO_LOOK,
          tunic: "#4a3a68",
          sash: "#c9a227",
          hair: "#2a2018",
          kit: "cloak",
        }}
        x={x}
        z={z}
        stay
        seed={91}
      />
    </group>
  );
}

function TinyHole() {
  const { x, z } = TINY_HOLE;
  const y = heightAt(x, z);
  const got = useRef(secretHas("tiny-hole"));
  const [, bump] = useState(0);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.4 && live.tinyT <= 0) live.hint = "A hole too small.";
    if (d < 0.85 && live.tinyT > 0) {
      live.hint = got.current ? "The mouse already paid you." : "You fit. F";
      if (!got.current && consumeTalk()) {
        got.current = true;
        secretTake("tiny-hole");
        pay(30, "A mouse house. They left a fat rupee.");
        live.tinyT = 0;
        bump((v) => v + 1);
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.32, 10]} />
        <meshLambertMaterial color="#1a1410" />
      </mesh>
      <mesh position={[0.02, 0.18, 0.22]} castShadow>
        <dodecahedronGeometry args={[0.28, 0]} />
        <meshLambertMaterial color="#6a6860" />
      </mesh>
    </group>
  );
}

function HideBarrel() {
  const { x, z } = BARREL_AT;
  const y = heightAt(x, z);
  const hidT = useRef(0);
  useFrame((_, dt) => {
    if (live.house) {
      live.hideBarrel = false;
      return;
    }
    const d = Math.hypot(live.x - x, live.z - z);
    if (live.hideBarrel) {
      live.x = x;
      live.z = z;
      live.speed = 0;
      live.y = y;
      hidT.current += dt;
      live.hint = "Nobody can see you. F to hop out";
      if (hidT.current > 3.5 && !live.smashed.barrel) {
        pay(10, "A rupee was hiding with you.", "barrel");
      }
      if (consumeTalk()) {
        live.hideBarrel = false;
        live.hint = "You popped out.";
      }
    } else if (d < 1.25 && !live.mounted) {
      live.nearBarrel = true;
      live.hint = "A barrel. F to hide";
      if (consumeTalk()) {
        live.hideBarrel = true;
        hidT.current = 0;
        sfx.thud();
        live.hint = "You are a barrel now.";
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.4, 0.85, 10]} />
        <meshLambertMaterial color="#8a5a28" />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <torusGeometry args={[0.4, 0.03, 5, 12]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function EchoRock() {
  const { x, z } = ECHO_ROCK;
  const y = heightAt(x, z);
  const n = useRef(0);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.1) {
      live.listen = live.listen || "A rock that talks back. Say something. Or play.";
      if ((consumeTalk() || live.ocarina) && cool.current <= 0) {
        cool.current = 0.8;
        n.current += 1;
        sfx.hoot();
        const last = live.listen || "hello";
        live.listen = n.current === 1 ? last : n.current === 2 ? `${last} ${last}` : "It said the keep has a crack. Then it got shy.";
        if (n.current >= 3) pay(10, "It told you a real thing. Then it got bored.", "echo");
      }
    }
  });
  return (
    <mesh position={[x, y + 1.1, z]} castShadow>
      <dodecahedronGeometry args={[1.05, 0]} />
      <meshLambertMaterial color="#7a7468" />
    </mesh>
  );
}

function ScarecrowCopy() {
  const { x, z } = SCARECROW_AT;
  const y = heightAt(x, z);
  const hat = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const dance = useRef(0);
  useFrame((_, dt) => {
    if (!hat.current) return;
    hat.current.visible = Boolean(live.hat) || Boolean(live.smashed.scarecrow);
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.8 && live.hat && consumeTalk() && !live.smashed.scarecrow) {
      pay(8, "You gave it your hat. It looked proud. You looked cold.", "scarecrow");
      live.hat = null;
    }
    if (d < 2.4 && live.spinning) {
      dance.current = 2.4;
      if (!live.smashed.scaredance) pay(7, "You spun. The scarecrow tried. It is still a stick.", "scaredance");
    }
    dance.current = Math.max(0, dance.current - dt);
    if (body.current) body.current.rotation.y = dance.current > 0 ? Math.sin(live.playT * 10) * 0.55 : 0;
  });
  return (
    <group ref={body} position={[x, y, z]}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 1.7, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 1.25, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.3, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <group ref={hat} position={[0, 1.92, 0]} visible={false}>
        <mesh>
          <cylinderGeometry args={[0.28, 0.38, 0.12, 10]} />
          <meshLambertMaterial color="#3a6a88" />
        </mesh>
      </group>
    </group>
  );
}

function PumpkinPatch() {
  const { x, z } = PUMPKIN_AT;
  const y = heightAt(x, z);
  const took = useRef(live.hat === "pumpkin");
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = !took.current && live.hat !== "pumpkin";
    if (took.current || live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.5) {
      live.nearHat = "pumpkin";
      live.hint = "A pumpkin. F to wear it";
      if (consumeTalk()) {
        took.current = true;
        live.hat = "pumpkin";
        sfx.ok();
        live.hint = "You are a pumpkin now. A snowman might want this.";
      }
    }
  });
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <sphereGeometry args={[0.28, 8, 6]} />
        <meshLambertMaterial color="#c45c38" />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.12, 5]} />
        <meshLambertMaterial color="#3d8a68" />
      </mesh>
    </group>
  );
}

function CircleDance() {
  const last = useRef(0);
  const acc = useRef(0);
  useFrame(() => {
    const cx = BALL_AT.x;
    const cz = BALL_AT.z;
    const d = Math.hypot(live.x - cx, live.z - cz);
    const a = Math.atan2(live.x - cx, live.z - cz);
    let da = a - last.current;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    last.current = a;
    if (d < 7.5 && d > 1.2 && Math.abs(live.speed) > 2.4 && !live.house) {
      acc.current += da;
      live.circleN = Math.abs(acc.current);
      if (Math.abs(acc.current) > Math.PI * 4 && !live.smashed.circle) {
        pay(15, "You danced a circle. The grass paid you.", "circle");
        acc.current = 0;
      }
    } else acc.current *= 0.96;
  });
  return null;
}

function ExtraWhimsy() {
  return (
    <group>
      <GeyserLaunch />
      <Lighthouse />
      <FaceHill />
      <FoxChase />
      <NowhereMail />
      <RedShroom />
      <PaperPlane />
      <GhostBench />
      <PaintedDoor />
      <ConchHorn />
      <Beanstalk />
      <PotatoRock />
      <Seesaw />
      <WhoopeeStump />
      <BananaPeel />
      <LemonadeStand />
      <DandelionBlow />
      <PondSwing />
      <LuckyClover />
      <TumbleWeed />
      <RainbowPot />
      <PieCloud />
      <SnowAngel />
      <HorseDance />
      <GoldenEgg />
      <ChocoCow />
      <SleepGiant />
      <StoneRing />
      <MirrorLake />
      <KeepCannon />
      <FossilDig />
      <WoodSword />
      <HammockNap />
      <WetPaint />
      <CrabSteal />
      <WeatherVane />
      <RainDance />
      <HowlHill />
      <CountSheep />
      <CampMallow />
      <HiccupApple />
      <RainWorm />
      <ShadowFive />
      <LookoutTower />
      <LookoutSign />
      <KeepOffGrass />
      <SkipStones />
      <TalkMoon />
      <LaundryBounce />
      <WishWell />
      <StarCatch />
      <WhaleHill />
      <GiantNeedle />
      <CloudPier />
      <IceCrown />
      <SandShip />
      <BounceMush />
      <BirdOnHead />
      <RollStreak />
      <SplashHorse />
      <BowToOwl />
      <CountClouds />
      <TownBalloon />
      <GalePilot />
      <BalloonSign />
      <TownSock />
      <WellStomp />
      <HugTree />
      <WhistleTown />
      <CuccoLookout />
      <WrongWay />
      <LaundryCape />
      <ScareHighFive />
      <YawnEcho />
      <SockPeak />
      <ClockWood />
      <FlowerSea />
      <SnoreHill />
      <RainbowArch />
      <AntTable />
      <BirdStack />
      <LostShoe />
      <GiantFoot />
      <PushRock />
      <HayDog />
      <FenceSong />
      <MillFan />
      <AcornWait />
      <PondApple />
      <BreadHill />
      <EdgeMail />
      <StairNone />
      <ChessPiece />
      <DuckLake />
      <DoorField />
      <YouCompass />
      <KickCone />
      <SpinTown />
      <TownFlock />
      <PianoHill />
      <GiantSpoon />
      <PaperBoat />
      <SleepCat />
      <WishBone />
      <TownCart />
      <ShadowWave />
      <TeaCup />
      <FarUmbrella />
      <GrassSlide />
      <GiantHat />
      <WhoopeeTown />
      <GiantSandwich />
      <BounceCastle />
      <LostCard />
      <WhimsyBits />
      <GiantFork />
      <SouthKid />
      <SouthArrow />
      <CheeseWheel />
      <RiverDuckRide />
      <GooseFriend />
      <SheepRun />
      <RainBucket />
      <TownKite />
      <TownCow />
      <TownMailHop />
      <Bumpkin />
      <HorizonWalk />
      <ForkBounce />
      <LookUpSky />
      <CrabWalk />
      <SouthHole />
      <SouthWagon />
      <PetPebble />
      <FriendFly />
      <RoadBoot />
      <KickCan />
      <CircleSpin />
      <StickHat />
      <BackWalk />
      <PondTalk />
      <CowBell />
      <NightName />
      <LongWalk />
      <RoofHop />
      <MoonSit />
      <ShallowFish />
      <KeepEcho />
      <LostMitten />
      <WindChime />
      <PicnicAnts />
      <ThreeHops />
      <LostMarble />
      <HorseWhisper />
      <SkipStone />
      <PlayDead />
      <HayNap />
      <LeafPile />
      <PondFrog />
      <PieSill />
      <PotHead />
      <RainHands />
      <DoorKnock />
      <TownBall />
      <Butterflies />
      <TownDog />
      <PineKick />
      <PondRaft />
      <TownBell />
      <StickPickup />
      <BounceTown />
      <TownSeesaw />
      <KickRing />
      <VillagePlayground />
      <TownBirds />
      <TreeHomePlay />
      <ThinkWhimsy />
    </group>
  );
}

function ThinkWhimsy() {
  return (
    <group>
      <WellLaps />
      <BombPond />
      <FairyTune />
      <VaneShot />
      <MailStick />
      <ScarecrowLaps />
      <TreeSong />
      <FrogHome />
      <WellHen />
      <ScareArm />
      <NightPondTune />
      <ShieldBoom />
      <MillRoofSit />
      <CrateKeep />
      <RainPot />
      <TownBucket />
      <WellFish />
      <GrassJump />
      <FlowerWell />
      <MailBoom />
      <PotTalk />
      <TownBench />
      <TownCone />
      <RockStack />
      <TreeKite />
      <LaundryHop />
      <HorseTreat />
      <InnTune />
      <PathRace />
      <PathGourd />
      <HomeMail />
      <YardBall />
      <YardSee />
      <BramTag />
      <PathCamp />
      <BellHide />
      <RoofTown />
      <BackWave />
      <ShopCrate />
      <LookSpy />
      <FenceBirds />
      <DuskLamps />
      <HenTune />
      <PathButterfly />
      <WellEcho />
      <PathHole />
      <SibCatch />
      <WakeGran />
      <DockDive />
      <HomeMush />
      <LookFly />
      <DuskBugs />
      <NightHowl />
      <LeafHat />
      <StumpOwl />
      <HomeHive />
      <WagonHide />
      <FlowerCrown />
      <DuckSnack />
      <PondSteps />
      <WellHat />
      <FrogWell />
      <FlagClimb />
      <ChimneyDrop />
      <TownDial />
    </group>
  );
}

function WellLaps() {
  const { x, z } = WELL_AT;
  const wrap = useRef(0);
  const last = useRef(0);
  const ready = useRef(false);
  useFrame(() => {
    if (live.house) return;
    const dx = live.x - x;
    const dz = live.z - z;
    const d = Math.hypot(dx, dz);
    if (d < 1.2 || d > 4.8) {
      wrap.current = 0;
      ready.current = false;
      last.current = Math.atan2(dx, dz);
      return;
    }
    const a = Math.atan2(dx, dz);
    let da = a - last.current;
    if (da > Math.PI) da -= Math.PI * 2;
    if (da < -Math.PI) da += Math.PI * 2;
    wrap.current += da;
    last.current = a;
    if (Math.abs(wrap.current) > Math.PI * 6 && !live.smashed.welllaps) {
      pay(12, "You walked around the well three times. A coin was stuck in the bricks.", "welllaps");
      wrap.current = 0;
    }
  });
  return null;
}

function BombPond() {
  useFrame(() => {
    if (live.house || live.smashed.bombpond) return;
    const b = live.lastBoom;
    if (!b) return;
    if (pondU(b.x, b.z) > 0.35) {
      pay(10, "The pond jumped. A silver fish left a coin and went back under.", "bombpond");
    }
  });
  return null;
}

function FairyTune() {
  const { x, z } = FAIRY_RING;
  const y = heightAt(x, z);
  const glow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (glow.current) glow.current.rotation.y = clock.elapsedTime * 0.4;
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 3.2 && live.ocarina && !live.smashed.fairytune) {
      pay(14, "The ring liked the song. Light sat in your hands.", "fairytune");
      useGame.getState().healGrass();
    }
  });
  return (
    <group position={[x, y, z]}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 2.4, 0.18, Math.cos(a) * 2.4]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 0.36, 6]} />
            <meshLambertMaterial color="#6a8a58" />
          </mesh>
        );
      })}
      <mesh ref={glow} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.15, 16]} />
        <meshBasicMaterial color="#d8f0c8" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function VaneShot() {
  const { x, z } = VANE_AT;
  const spin = useRef(0);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    spin.current += dt * (live.smashed.vaneshot ? 8 : 1.4);
    if (g.current) g.current.rotation.y = spin.current;
    if (live.house) return;
    const hit =
      (live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 1.8) ||
      (live.lastBoom && Math.hypot(live.lastBoom.x - x, live.lastBoom.z - z) < 2.4);
    if (hit && !live.smashed.vaneshot) {
      pay(9, "The arrow on the roof spun the wrong way. A coin fell.", "vaneshot");
      if (live.slash) live.slash = null;
    }
  });
  return (
    <group position={[x, heightAt(x, z) + 4.2, z]} ref={g}>
      <mesh>
        <boxGeometry args={[0.9, 0.08, 0.18]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function MailStick() {
  useFrame(() => {
    if (live.house || live.smashed.mailstick) return;
    if (live.nearMail && live.carry === "stick" && consumeTalk()) {
      live.carry = null;
      pay(8, "You mailed the stick. Tomorrow it came back as a letter that said thanks.", "mailstick");
    }
  });
  return null;
}

function ScarecrowLaps() {
  const { x, z } = SCARECROW_AT;
  const wrap = useRef(0);
  const last = useRef(0);
  useFrame(() => {
    if (live.house) return;
    const dx = live.x - x;
    const dz = live.z - z;
    const d = Math.hypot(dx, dz);
    if (d < 1.4 || d > 5.2) {
      wrap.current = 0;
      last.current = Math.atan2(dx, dz);
      return;
    }
    const a = Math.atan2(dx, dz);
    let da = a - last.current;
    if (da > Math.PI) da -= Math.PI * 2;
    if (da < -Math.PI) da += Math.PI * 2;
    wrap.current += da;
    last.current = a;
    if (Math.abs(wrap.current) > Math.PI * 6 && !live.smashed.scarelaps) {
      pay(12, "You walked around him three times. He remembered your face.", "scarelaps");
      wrap.current = 0;
    }
  });
  return null;
}

function TreeSong() {
  const { x, z } = TREE_TRUNK;
  useFrame(() => {
    if (live.house || live.smashed.treesong) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4.2 && live.ocarina) {
      pay(10, "The house tree hummed with you. A leaf fell with a coin on it.", "treesong");
    }
  });
  return null;
}

function FrogHome() {
  useFrame(() => {
    if (live.house || live.smashed.froghome) return;
    if (live.carry !== "frog") return;
    if (pondU(live.x, live.z) > 0.42) {
      live.carry = null;
      live.carryId = null;
      pay(10, "You took the frog home. It dove. It left a coin like a thank you.", "froghome");
    }
  });
  return null;
}

function WellHen() {
  const { x, z } = WELL_AT;
  useFrame(() => {
    if (live.house || live.smashed.wellhen) return;
    if (live.carry !== "cucco") return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.35 && (live.y < heightAt(x, z) + 0.4 || consumeTalk())) {
      live.carry = null;
      live.boostY = 14;
      sfx.jump();
      pay(11, "The chicken did not like the well. It flew you out.", "wellhen");
    }
  });
  return null;
}

function ScareArm() {
  const { x, z } = SCARECROW_AT;
  useFrame(() => {
    if (live.house || live.smashed.scarearm) return;
    if (live.carry !== "stick") return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.6 && consumeTalk()) {
      live.carry = null;
      pay(9, "You gave him an arm. He stood a little prouder.", "scarearm");
    }
  });
  return null;
}

function NightPondTune() {
  useFrame(() => {
    if (live.house || live.smashed.nightpond) return;
    if (!live.night || !live.ocarina) return;
    if (pondU(live.x, live.z) > 0.12 && pondU(live.x, live.z) < 0.55) {
      pay(12, "Night water liked the song. A silver ring floated up, then sank, then left a coin.", "nightpond");
      useGame.getState().healGrass();
    }
  });
  return null;
}

function ShieldBoom() {
  useFrame(() => {
    if (live.house || live.smashed.shieldboom) return;
    if (!live.shieldUp || !live.lastBoom) return;
    const d = Math.hypot(live.x - live.lastBoom.x, live.z - live.lastBoom.z);
    if (d < 3.2 && d > 0.4) {
      const a = Math.atan2(live.x - live.lastBoom.x, live.z - live.lastBoom.z);
      live.knock = { vx: Math.sin(a) * 18, vz: Math.cos(a) * 18, t: 0.7 };
      live.boostY = 10;
      pay(8, "You hid behind the shield. The bang sent you.", "shieldboom");
    }
  });
  return null;
}

function MillRoofSit() {
  const { x, z } = MILL_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.2 && live.y > y + 3.4 && live.grounded && live.stillT > 0.9 && Math.abs(live.speed) < 0.4 && !live.smashed.millroof) {
      live.sit = true;
      pay(8, "The mill roof. Town looks small from here.", "millroof");
    }
  });
  return (
    <mesh position={[x, y + 4.6, z]}>
      <cylinderGeometry args={[0.12, 0.22, 2.8, 6]} />
      <meshLambertMaterial color="#6a6660" transparent opacity={0.35} />
    </mesh>
  );
}

function CrateKeep() {
  const { x, z } = KEEP_OUT;
  useFrame(() => {
    if (live.house || live.smashed.cratekeep) return;
    if (live.carry !== "crate") return;
    if (Math.hypot(live.x - x, live.z - z) < 2.4 && consumeTalk()) {
      live.carry = null;
      pay(10, "You set the crate by the door. Someone inside said thanks through the wood.", "cratekeep");
    }
  });
  return null;
}

function RainPot() {
  useFrame(() => {
    if (live.house || live.smashed.rainpot) return;
    if (live.rainT > 0.4 && live.hat === "pot") {
      pay(9, "You caught the rain in the pot. It was a hat. Now it is soup.", "rainpot");
    }
  });
  return null;
}

function TownBucket() {
  const pos = useRef({ x: WELL_AT.x + 1.6, z: WELL_AT.z + 1.1 });
  const g = useRef<THREE.Group>(null);
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (g.current) g.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z) + 0.18, pos.current.z);
    if (live.house) return;
    const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
    if (d < 1.15 && Math.abs(live.speed) > 6 && cool.current <= 0) {
      const a = live.yaw;
      pos.current.x += -Math.sin(a) * 1.8;
      pos.current.z += -Math.cos(a) * 1.8;
      cool.current = 0.5;
      sfx.thud();
      if (!live.smashed.kickbucket) pay(7, "You kicked the bucket. It did not die. It rolled.", "kickbucket");
    }
  });
  return (
    <group ref={g} position={[WELL_AT.x + 1.6, 0, WELL_AT.z + 1.1]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.18, 0.32, 8]} />
        <meshLambertMaterial color="#8a6a38" />
      </mesh>
      <mesh position={[0, 0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.16, 0.02, 6, 10]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function WellFish() {
  const { x, z } = WELL_AT;
  useFrame(() => {
    if (live.house || live.smashed.wellfish) return;
    if (live.holding !== "pole") return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.7 && consumeTalk()) {
      pay(11, "You fished the well. A boot came up. There was a coin in the boot.", "wellfish");
    }
  });
  return null;
}

function GrassJump() {
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (live.house || live.smashed.grassjump) return;
    if (!live.hideGrass || !live.nearNpc || cool.current > 0) return;
    if (live.jumpStretch > 0.4) {
      cool.current = 2;
      live.npcMood[live.nearNpc] = "scared";
      pay(8, "You hid in the grass. Then you jumped. They yelled.", "grassjump");
    }
  });
  return null;
}

function FlowerWell() {
  const { x, z } = WELL_AT;
  useFrame(() => {
    if (live.house || live.smashed.flowerwell) return;
    if (live.carry !== "flower") return;
    if (Math.hypot(live.x - x, live.z - z) < 1.4 && consumeTalk()) {
      live.carry = null;
      pay(8, "You dropped a flower in the well. A wish, maybe. A coin came back, definitely.", "flowerwell");
    }
  });
  return null;
}

function MailBoom() {
  useFrame(() => {
    if (live.house || live.smashed.mailboom) return;
    if (!live.lastBoom || !live.nearMail) return;
    if (Math.hypot(live.lastBoom.x - live.x, live.lastBoom.z - live.z) < 3.2) {
      pay(9, "The mailbox jumped. A letter flew out that said please do not.", "mailboom");
    }
  });
  return null;
}

function PotTalk() {
  useFrame(() => {
    if (live.house || live.smashed.pottalk) return;
    if (live.hat !== "pot" || !live.nearNpc) return;
    if (consumeTalkRaw()) {
      live.npcMood[live.nearNpc] = "laugh";
      pay(8, "They talked to the pot. Then they saw you. Then they laughed.", "pottalk");
    }
  });
  return null;
}

function TownBench() {
  const x = VX + 6.4;
  const z = VZ + 11.2;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.2 && live.stillT > 1.05 && live.grounded && Math.abs(live.speed) < 0.35) {
      live.sit = true;
      if (!live.smashed.townbench) pay(6, "A bench in the sun. Town walks by.", "townbench");
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[1.35, 0.1, 0.42]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 0.55, -0.16]} castShadow>
        <boxGeometry args={[1.35, 0.38, 0.08]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      {[-0.58, 0.58].map((ox) => (
        <mesh key={ox} position={[ox, 0.16, 0]} castShadow>
          <boxGeometry args={[0.08, 0.32, 0.4]} />
          <meshLambertMaterial color="#4a3220" />
        </mesh>
      ))}
    </group>
  );
}

function TownCone() {
  const pos = useRef({ x: VX + 1.2, z: VZ + 9.4 });
  const g = useRef<THREE.Group>(null);
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (g.current) g.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z) + 0.1, pos.current.z);
    if (live.house) return;
    const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
    if (d < 1.05 && Math.abs(live.speed) > 7 && cool.current <= 0) {
      pos.current.x += -Math.sin(live.yaw) * 2.4;
      pos.current.z += -Math.cos(live.yaw) * 2.4;
      cool.current = 0.4;
      sfx.thud();
      if (!live.smashed.towncone) pay(7, "The pinecone rolled. It hit a post. A coin fell out.", "towncone");
    }
  });
  return (
    <group ref={g}>
      <mesh rotation={[0.4, 0.2, 0.1]} castShadow>
        <coneGeometry args={[0.14, 0.28, 6]} />
        <meshLambertMaterial color="#6a4224" />
      </mesh>
    </group>
  );
}

function RockStack() {
  const x = VX + 8.2;
  const z = VZ - 22.4;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.5 && live.y > y + 1.4 && live.grounded && !live.smashed.rockstack) {
      pay(8, "Three rocks. You stood on top. Town looked small.", "rockstack");
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <dodecahedronGeometry args={[0.42, 0]} />
        <meshLambertMaterial color="#7a7468" />
      </mesh>
      <mesh position={[0.08, 0.7, 0.04]} castShadow>
        <dodecahedronGeometry args={[0.3, 0]} />
        <meshLambertMaterial color="#6a6660" />
      </mesh>
      <mesh position={[-0.04, 1.05, -0.02]} castShadow>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshLambertMaterial color="#8a8478" />
      </mesh>
    </group>
  );
}

function TreeKite() {
  const x = VX - 16.4;
  const z = VZ + 5.2;
  const y = heightAt(x, z);
  const stuck = useRef(true);
  useFrame(() => {
    if (live.house || !stuck.current) return;
    const hit =
      (live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 2.4) ||
      (live.lastBoom && Math.hypot(live.lastBoom.x - x, live.lastBoom.z - z) < 3.2);
    if (hit) {
      stuck.current = false;
      if (!live.smashed.treekite) pay(10, "A kite was stuck. You knocked it down. It liked you.", "treekite");
      live.hat = live.hat ?? "kite";
    }
  });
  if (!stuck.current) return null;
  return (
    <group position={[x, y + 4.2, z]}>
      <mesh rotation={[0.5, 0.3, 0.2]} castShadow>
        <planeGeometry args={[0.7, 0.9]} />
        <meshLambertMaterial color="#c45c38" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.7, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1.2, 4]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}

function LaundryHop() {
  const { x, z } = LAUNDRY_AT;
  useFrame(() => {
    if (live.house || live.smashed.laundryhop) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.6 && live.y > heightAt(x, z) + 1.1 && !live.grounded) {
      live.boostY = 8;
      pay(8, "You jumped in the laundry. It smelled like soap. A coin was in a sock.", "laundryhop");
    }
  });
  return null;
}

function HorseTreat() {
  useFrame(() => {
    if (live.house || live.smashed.horsetreat) return;
    if (!live.nearHorse) return;
    if ((live.carry === "flower" || live.carry === "stick") && consumeTalk()) {
      live.carry = null;
      pay(9, "The horse ate it. Then it waited. Then it nuzzled you.", "horsetreat");
    }
  });
  return null;
}

function InnTune() {
  const inn = vWorld(-34, -126);
  useFrame(() => {
    if (live.house || live.smashed.inntune) return;
    if (!live.ocarina) return;
    if (Math.hypot(live.x - inn.x, live.z - inn.z) < 8.4) {
      pay(9, "You played under the inn window. Someone hummed the rest from inside.", "inntune");
    }
  });
  return null;
}

function PathRace() {
  const run = useRef(false);
  useFrame(() => {
    if (live.house || live.smashed.pathrace) return;
    const home = Math.hypot(live.x - TREE_TRUNK.x, live.z - TREE_TRUNK.z);
    const town = Math.hypot(live.x - VX, live.z - VZ);
    if (home < 16 && Math.abs(live.speed) > 16) run.current = true;
    if (run.current && Math.abs(live.speed) < 6) run.current = false;
    if (run.current && town < 14 && home > 40) {
      pay(12, "You ran the whole way to town without stopping. Gran would say that is how legs work.", "pathrace");
      run.current = false;
    }
  });
  return null;
}

function PathGourd() {
  const pos = useRef({ x: TREE_TRUNK.x + 16.4, z: TREE_TRUNK.z + 14.2 });
  const g = useRef<THREE.Group>(null);
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (g.current) g.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z) + 0.16, pos.current.z);
    if (live.house) return;
    const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
    if (d < 1.1 && Math.abs(live.speed) > 7 && cool.current <= 0) {
      pos.current.x += -Math.sin(live.yaw) * 2.2;
      pos.current.z += -Math.cos(live.yaw) * 2.2;
      cool.current = 0.45;
      sfx.thud();
      if (!live.smashed.pathgourd) pay(7, "A gourd on the path. It bounced. Seeds went everywhere. One was a coin.", "pathgourd");
    }
  });
  return (
    <group ref={g}>
      <mesh castShadow>
        <sphereGeometry args={[0.22, 7, 6]} />
        <meshLambertMaterial color="#d4a03a" />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.12, 4]} />
        <meshLambertMaterial color="#3a5a28" />
      </mesh>
    </group>
  );
}

function HomeMail() {
  const x = TREE_TRUNK.x + 6.8;
  const z = TREE_TRUNK.z + 4.4;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.35 && live.carry === "flower" && consumeTalk()) {
      live.carry = null;
      if (!live.smashed.homemail) pay(8, "You mailed Gran a flower. She will say she already has a garden. She will keep it anyway.", "homemail");
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.28, 0.22, 0.18]} />
        <meshLambertMaterial color="#8a3a28" />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.85, 5]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function YardBall() {
  const pos = useRef({ x: TREE_TRUNK.x + 6.2, z: TREE_TRUNK.z + 6.8 });
  const g = useRef<THREE.Group>(null);
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (g.current) g.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z) + 0.16, pos.current.z);
    if (live.house) return;
    const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
    if (d < 1.05 && Math.abs(live.speed) > 6 && cool.current <= 0) {
      pos.current.x += -Math.sin(live.yaw) * 2.6;
      pos.current.z += -Math.cos(live.yaw) * 2.6;
      cool.current = 0.35;
      sfx.thud();
      if (!live.smashed.yardball) pay(6, "Bram’s ball. It does not stay.", "yardball");
    }
  });
  return (
    <group ref={g}>
      <mesh castShadow>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshLambertMaterial color="#c45c38" />
      </mesh>
    </group>
  );
}

function YardSee() {
  const x = TREE_TRUNK.x - 3.4;
  const z = TREE_TRUNK.z + 6.2;
  const y = heightAt(x, z);
  const board = useRef<THREE.Group>(null);
  const tilt = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const left = Math.hypot(live.x - (x - 1.1), live.z - z) < 0.85;
    const right = Math.hypot(live.x - (x + 1.1), live.z - z) < 0.85;
    const want = left ? 0.45 : right ? -0.45 : 0;
    tilt.current += (want - tilt.current) * (1 - Math.exp(-dt * 6));
    if (board.current) board.current.rotation.z = tilt.current;
    if ((left || right) && live.grounded && Math.abs(want) > 0.2 && !live.smashed.yardsee) {
      live.boostY = 7;
      pay(7, "A seesaw. The other end went up. You did too.", "yardsee");
    }
  });
  return (
    <group position={[x, y + 0.42, z]} rotation={[0, 0.2, 0]} ref={board}>
      <mesh castShadow>
        <boxGeometry args={[2.6, 0.1, 0.38]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[0.18, 0.35, 0.18]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
    </group>
  );
}

function BramTag() {
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (live.house || live.smashed.bramtag) return;
    const p = live.npcPos.bram;
    if (!p) return;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 1.25 && Math.abs(live.speed) > 16 && cool.current <= 0) {
      cool.current = 3;
      live.npcMood.bram = "laugh";
      pay(8, "You tagged Bram. He said you are it. Then he ran behind the tree.", "bramtag");
    }
  });
  return null;
}

function PathCamp() {
  const x = TREE_TRUNK.x + 42;
  const z = TREE_TRUNK.z + 28;
  const y = heightAt(x, z);
  useFrame(({ clock }) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.2 && live.sit && !live.smashed.pathcamp) {
      pay(10, "A little camp on the way. You sat. The smoke went up. Hearts felt warmer.", "pathcamp");
      useGame.getState().healGrass();
    }
    void clock;
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.62, 0.16, 8]} />
        <meshLambertMaterial color="#3a3228" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.sin(i * 2.1) * 0.22, 0.22, Math.cos(i * 2.1) * 0.22]} rotation={[0.4, i, 0.2]} castShadow>
          <boxGeometry args={[0.12, 0.12, 0.4]} />
          <meshLambertMaterial color="#5a3a22" />
        </mesh>
      ))}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.16, 6, 5]} />
        <meshLambertMaterial color="#c45c38" emissive="#c45c38" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <coneGeometry args={[0.35, 3.2, 6]} />
        <meshBasicMaterial color="#c8d0d4" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}

function BellHide() {
  useFrame(() => {
    if (live.house || live.smashed.bellhide) return;
    if (live.bellT > 0.2 && live.hideGrass) {
      pay(9, "The bell rang. Everyone looked. You were grass.", "bellhide");
    }
  });
  return null;
}

function RoofTown() {
  useFrame(() => {
    if (live.house || live.smashed.rooftown) return;
    const roof = roofAt(live.x, live.z, "meadow");
    if (roof > 2.4 && live.grounded && live.y > heightAt(live.x, live.z) + 2.1) {
      pay(8, "A roof. Town did not look up.", "rooftown");
    }
  });
  return null;
}

function BackWave() {
  useFrame(() => {
    if (live.house || live.smashed.backwave) return;
    if (live.backT < 0.35 || !live.nearNpc) return;
    const p = live.npcPos[live.nearNpc];
    if (!p) return;
    const fx = -Math.sin(live.yaw);
    const fz = -Math.cos(live.yaw);
    const dx = p.x - live.x;
    const dz = p.z - live.z;
    if (dx * fx + dz * fz > 0) return;
    if (consumeTalkRaw()) {
      live.npcMood[live.nearNpc] = "smile";
      pay(7, "You waved without turning around. They waved at your backpack.", "backwave");
    }
  });
  return null;
}

function ShopCrate() {
  const shop = vWorld(18, -42);
  useFrame(() => {
    if (live.house || live.smashed.shopcrate) return;
    if (live.carry !== "crate") return;
    if (Math.hypot(live.x - shop.x, live.z - shop.z) < 4.2 && consumeTalk()) {
      live.carry = null;
      pay(9, "You set the crate on the counter. They said that is not how shopping works. Then they paid you for the crate.", "shopcrate");
    }
  });
  return null;
}

function LookSpy() {
  useFrame((_, dt) => {
    if (live.house) {
      live.spyT = 0;
      return;
    }
    const d = Math.hypot(live.x - LOOK_AT.x, live.z - LOOK_AT.z);
    const high = live.y > heightAt(LOOK_AT.x, LOOK_AT.z) + 6.5;
    if (d < 2.2 && high && live.stillT > 0.7 && Math.abs(live.speed) < 0.4) {
      live.spyT = Math.min(1, live.spyT + dt * 1.4);
      if (!live.smashed.lookspy) pay(8, "You looked far. The vale is huge.", "lookspy");
    } else live.spyT = Math.max(0, live.spyT - dt * 2.2);
  });
  return null;
}

function FenceBirds() {
  const g = useRef<THREE.Group>(null);
  const fly = useRef(0);
  useFrame((_, dt) => {
    if (!g.current) return;
    const x = VX + 10.4;
    const z = VZ - 6.2;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.4 && (Math.abs(live.speed) > 8 || live.rolling || live.slash)) {
      fly.current = 1;
      if (!live.smashed.fencebirds) pay(6, "The fence birds left. One dropped a shiny.", "fencebirds");
    }
    if (fly.current > 0) fly.current += dt;
    g.current.children.forEach((c, i) => {
      if (fly.current > 0) {
        c.position.y = 1.2 + fly.current * 4 + i * 0.2;
        c.position.x += dt * (2 + i);
        c.position.z -= dt * 1.4;
      } else {
        const t = live.playT * 2 + i;
        c.position.y = 1.15 + Math.sin(t) * 0.04;
      }
    });
  });
  return (
    <group ref={g} position={[VX + 10.4, heightAt(VX + 10.4, VZ - 6.2), VZ - 6.2]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[(i - 1.5) * 0.45, 1.15, 0]} castShadow>
          <sphereGeometry args={[0.07, 5, 4]} />
          <meshLambertMaterial color={i % 2 ? "#3a3228" : "#efe6d4"} />
        </mesh>
      ))}
    </group>
  );
}

function DuskLamps() {
  const pts = [
    [TREE_TRUNK.x + 8, TREE_TRUNK.z + 10],
    [TREE_TRUNK.x + 18, TREE_TRUNK.z + 22],
    [TREE_TRUNK.x + 32, TREE_TRUNK.z + 36],
    [(TREE_TRUNK.x + VX) / 2, (TREE_TRUNK.z + VZ) / 2],
    [VX - 12, VZ - 8],
    [VX - 4, VZ - 2],
  ] as const;
  const mats = useRef<(THREE.MeshLambertMaterial | null)[]>([]);
  useFrame(() => {
    const on = duskAmt() > 0.35 || live.night;
    for (const m of mats.current) {
      if (!m) continue;
      m.emissiveIntensity = on ? 0.85 : 0;
      m.color.set(on ? "#f0d48a" : "#8a7a60");
    }
  });
  return (
    <group>
      {pts.map(([x, z], i) => (
        <group key={i} position={[x, heightAt(x, z), z]}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 2.2, 5]} />
            <meshLambertMaterial color="#4a3220" />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <sphereGeometry args={[0.12, 6, 5]} />
            <meshLambertMaterial
              color="#8a7a60"
              emissive="#f0d48a"
              emissiveIntensity={0}
              ref={(el) => {
                mats.current[i] = el;
              }}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function HenTune() {
  useFrame(() => {
    if (live.house || !live.ocarina || live.smashed.hentune) return;
    for (const c of Object.values(live.chickens)) {
      if (Math.hypot(live.x - c.x, live.z - c.z) < 4.5) {
        pay(8, "The chickens danced. One laid a coin. That is not how eggs work.", "hentune");
        break;
      }
    }
  });
  return null;
}

function PathButterfly() {
  const g = useRef<THREE.Group>(null);
  const u = useRef(0);
  const near = useRef(0);
  const home = { x: TREE_TRUNK.x + 3.2, z: TREE_TRUNK.z + 5.4 };
  const end = { x: TREE_TRUNK.x + 38, z: TREE_TRUNK.z + 8.4 };
  useFrame((_, dt) => {
    u.current = (u.current + dt * 0.07) % 1;
    const t = u.current;
    const x = home.x + (end.x - home.x) * t + Math.sin(t * 12) * 1.4;
    const z = home.z + (end.z - home.z) * t + Math.cos(t * 9) * 1.1;
    const y = heightAt(x, z) + 1.3 + Math.sin(live.playT * 4) * 0.25;
    if (g.current) g.current.position.set(x, y, z);
    if (live.house) return;
    if (Math.hypot(live.x - x, live.z - z) < 3.2) near.current += dt;
    else near.current = Math.max(0, near.current - dt);
    if (near.current > 4.5 && t > 0.88 && !live.smashed.followfly) {
      pay(12, "You followed it. It sat on a rock. The rock had a coin under it.", "followfly");
    }
  });
  return (
    <group ref={g}>
      <mesh rotation={[0.4, 0.2, 0.3]}>
        <planeGeometry args={[0.28, 0.18]} />
        <meshBasicMaterial color="#e8d48a" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function PathMud() {
  const x = TREE_TRUNK.x + 14.2;
  const z = TREE_TRUNK.z + 16.6;
  const y = heightAt(x, z);
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.6 && Math.abs(live.speed) > 16 && live.grounded && cool.current <= 0) {
      cool.current = 1.2;
      live.speed *= 0.15;
      live.knock = { vx: -Math.sin(live.yaw) * 2, vz: -Math.cos(live.yaw) * 2, t: 0.4 };
      live.wetT = Math.max(live.wetT, 3);
      sfx.thud();
      if (!live.smashed.pathmud) pay(6, "Mud. You ran. You slid. Walk next time.", "pathmud");
    }
  });
  return (
    <mesh position={[x, y + 0.03, z]} rotation={[-Math.PI / 2, 0, 0.2]}>
      <circleGeometry args={[1.55, 10]} />
      <meshLambertMaterial color="#5a3a22" transparent opacity={0.7} />
    </mesh>
  );
}

function WellEcho() {
  const { x, z } = WELL_AT;
  useFrame(() => {
    if (live.house || live.smashed.wellecho) return;
    if (!live.ocarina) return;
    if (Math.hypot(live.x - x, live.z - z) < 1.8) {
      pay(8, "The well sang it back. A little late. A little wet.", "wellecho");
    }
  });
  return null;
}

function PathHole() {
  const x = TREE_TRUNK.x + 22;
  const z = TREE_TRUNK.z - 9.4;
  const y = heightAt(x, z);
  const inNook = useRef(false);
  const fade = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (!inNook.current && d < 1.15 && live.grounded) {
      fade.current += dt * 1.6;
      live.roomFade = Math.min(1, fade.current);
      if (fade.current >= 1) {
        inNook.current = true;
        live.x = x;
        live.z = z - 3.2;
        live.y = heightAt(live.x, live.z);
        live.roomFadeOut = true;
        live.roomFade = 1;
        fade.current = 0;
        if (!live.smashed.pathhole) pay(10, "A hole in the hill. It was bigger inside.", "pathhole");
      }
    } else if (inNook.current && d < 1.2 && live.z > z - 1.2) {
      fade.current += dt * 1.6;
      live.roomFade = Math.min(1, fade.current);
      if (fade.current >= 1) {
        inNook.current = false;
        live.x = x;
        live.z = z + 2.2;
        live.roomFadeOut = true;
        live.roomFade = 1;
        fade.current = 0;
      }
    } else if (!live.roomFadeOut) fade.current = 0;
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.7, -0.2]} rotation={[0.15, 0, 0]} castShadow>
        <sphereGeometry args={[1.15, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
        <meshLambertMaterial color="#1a1814" />
      </mesh>
      {[-0.9, 0.9].map((ox) => (
        <mesh key={ox} position={[ox, 0.45, 0.3]} castShadow>
          <dodecahedronGeometry args={[0.4, 0]} />
          <meshLambertMaterial color="#5a5448" />
        </mesh>
      ))}
    </group>
  );
}

function CutGrass() {
  const tufts = useMemo(() => {
    const out: { x: number; z: number; h: number; cut: boolean }[] = [];
    for (let i = 0; i < 22; i++) {
      const a = i * 1.7;
      out.push({
        x: TREE_TRUNK.x + Math.cos(a) * (4.2 + (i % 5) * 0.9),
        z: TREE_TRUNK.z + Math.sin(a) * (4.2 + (i % 4) * 1.1),
        h: 0.45 + (i % 3) * 0.12,
        cut: false,
      });
    }
    for (let i = 0; i < 14; i++) {
      const a = i * 2.1;
      out.push({
        x: VX + Math.cos(a) * (6 + (i % 3)),
        z: VZ + Math.sin(a) * (5.5 + (i % 4)),
        h: 0.4 + (i % 2) * 0.1,
        cut: false,
      });
    }
    return out;
  }, []);
  const n = useRef(0);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (live.house || !g.current) return;
    const sx = live.slash?.x ?? 0;
    const sz = live.slash?.z ?? 0;
    const spin = live.spinning;
    const hit = Boolean(live.slash) || spin;
    if (!hit) return;
    g.current.children.forEach((c, i) => {
      const t = tufts[i];
      if (!t || t.cut) return;
      const d = Math.hypot((spin ? live.x : sx) - t.x, (spin ? live.z : sz) - t.z);
      if (d > (spin ? 2.2 : 1.35)) return;
      t.cut = true;
      c.scale.set(1, 0.18, 1);
      c.position.y = heightAt(t.x, t.z) + 0.04;
      puffAt(t.x, t.z, heightAt(t.x, t.z) + 0.1);
      n.current += 1;
      if (n.current <= 6) {
        useGame.getState().addCoins(1);
        if (n.current === 1) revealItem("coin");
        sfx.ok();
      } else sfx.thud();
      if (n.current === 6 && !live.smashed.cutgrass) pay(8, "The long grass hid coins. Then it was just grass.", "cutgrass");
    });
  });
  return (
    <group ref={g}>
      {tufts.map((t, i) => (
        <mesh key={i} position={[t.x, heightAt(t.x, t.z) + t.h * 0.5, t.z]} castShadow>
          <coneGeometry args={[0.12, t.h, 5]} />
          <meshLambertMaterial color={i % 2 ? "#3d8a42" : "#2e6a32"} />
        </mesh>
      ))}
    </group>
  );
}

function SibCatch() {
  const ball = useRef<THREE.Mesh>(null);
  const pos = useRef({ x: 0, z: 0 });
  useFrame(({ clock }) => {
    const a = live.npcPos.bram;
    const b = live.npcPos.sela;
    if (!a || !b || !ball.current) return;
    const t = (Math.sin(clock.elapsedTime * 0.9) + 1) / 2;
    const x = a.x + (b.x - a.x) * t;
    const z = a.z + (b.z - a.z) * t;
    const y = heightAt(x, z) + 1.1 + Math.sin(t * Math.PI) * 1.4;
    pos.current = { x, z };
    ball.current.position.set(x, y, z);
    if (live.house || live.smashed.sibcatch) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.15 && (live.slash || live.jumpStretch > 0.3 || live.carry)) {
      pay(10, "You stole the catch. Bram said hey. Sela laughed.", "sibcatch");
      live.npcMood.bram = "mad";
      live.npcMood.sela = "laugh";
    }
  });
  return (
    <mesh ref={ball} castShadow>
      <sphereGeometry args={[0.12, 7, 6]} />
      <meshLambertMaterial color="#c45c38" />
    </mesh>
  );
}

function WakeGran() {
  useFrame(() => {
    if (live.house !== "yours" || live.smashed.wakegran) return;
    if (live.jumpN >= 2 || (live.stompT > 0 && live.landSquash > 0.3)) {
      pay(7, "The floor boomed. Gran said some of us are sleeping.", "wakegran");
    }
  });
  return null;
}

function DockDive() {
  const { x, z } = DOCK;
  useFrame(() => {
    if (live.house || live.smashed.dockdive) return;
    if (!live.swim) return;
    if (Math.hypot(live.x - x, live.z - z) < 2.4 && live.y < pondSurfaceY() - 0.2) {
      pay(10, "Under the dock it was dark. A coin was stuck to a post.", "dockdive");
    }
  });
  return null;
}

function HomeMush() {
  const x = TREE_TRUNK.x - 5.2;
  const z = TREE_TRUNK.z + 4.4;
  const y = heightAt(x, z);
  const cool = useRef(0);
  const cap = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (cap.current) cap.current.scale.y = cool.current > 0 ? 0.55 : 1;
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 0.95 && live.grounded && cool.current <= 0 && (live.landSquash > 0.2 || Math.abs(live.speed) > 8)) {
      cool.current = 0.7;
      live.boostY = 13;
      sfx.jump();
      if (!live.smashed.homemush) pay(6, "A mushroom by the oak. It throws you.", "homemush");
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.36, 6]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh ref={cap} position={[0, 0.42, 0]} castShadow>
        <sphereGeometry args={[0.32, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshLambertMaterial color="#c45c38" />
      </mesh>
    </group>
  );
}

function LookFly() {
  useFrame(() => {
    if (live.house || live.smashed.lookfly) return;
    if (live.carry !== "cucco") return;
    const d = Math.hypot(live.x - LOOK_AT.x, live.z - LOOK_AT.z);
    if (d < 8 && live.y > heightAt(live.x, live.z) + 5 && !live.grounded) {
      live.glideT = Math.max(live.glideT, 3.4);
      pay(10, "The chicken did not like the lookout. It flew. You came too.", "lookfly");
    }
  });
  return null;
}

function DuskBugs() {
  const bugs = useRef(
    Array.from({ length: 10 }, (_, i) => ({
      x: TREE_TRUNK.x + Math.sin(i * 1.7) * 6,
      z: TREE_TRUNK.z + Math.cos(i * 1.3) * 6,
      y: 1.2,
      got: false,
    })),
  );
  const g = useRef<THREE.Group>(null);
  const n = useRef(0);
  useFrame(({ clock }) => {
    const on = duskAmt() > 0.4 || live.night;
    if (!g.current) return;
    g.current.visible = on && !live.house;
    if (!on || live.house) return;
    const t = clock.elapsedTime;
    g.current.children.forEach((c, i) => {
      const b = bugs.current[i];
      if (!b || b.got) {
        c.visible = false;
        return;
      }
      c.visible = true;
      const x = b.x + Math.sin(t * 0.7 + i) * 1.8;
      const z = b.z + Math.cos(t * 0.55 + i * 0.8) * 1.8;
      const y = heightAt(x, z) + 1.1 + Math.sin(t * 2.2 + i) * 0.35;
      c.position.set(x, y, z);
      if (Math.hypot(live.x - x, live.z - z) < 0.85 && (live.jumpStretch > 0.2 || live.slash)) {
        b.got = true;
        n.current += 1;
        sfx.chime();
        if (n.current >= 3 && !live.smashed.duskbugs) pay(8, "You caught the evening lights. They went out in your hands. A coin was left.", "duskbugs");
      }
    });
  });
  return (
    <group ref={g}>
      {bugs.current.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.05, 6, 5]} />
          <meshBasicMaterial color="#e8f0a0" />
        </mesh>
      ))}
    </group>
  );
}

function NightHowl() {
  useFrame(() => {
    if (live.house || !live.night || live.smashed.nighthowl) return;
    if (!live.ocarina) return;
    if (Math.hypot(live.x - LOOK_AT.x, live.z - LOOK_AT.z) < 6 && live.y > heightAt(LOOK_AT.x, LOOK_AT.z) + 5) {
      pay(10, "You played on the lookout. The vale howled back. Far away, something gray sat down.", "nighthowl");
    }
  });
  return null;
}

function LeafHat() {
  useFrame(() => {
    if (live.house || live.hat) return;
    const d = Math.hypot(live.x - TREE_TRUNK.x, live.z - TREE_TRUNK.z);
    if (d < 2.6 && live.stompT > 0 && live.jumpN >= 2) {
      live.hat = "leaf";
      if (!live.smashed.leafhat) pay(6, "A leaf stuck to your head. Gran will pick it off later.", "leafhat");
    }
  });
  return null;
}

function StumpOwl() {
  const x = TREE_TRUNK.x - 7.4;
  const z = TREE_TRUNK.z - 3.2;
  const y = heightAt(x, z);
  const land = useRef(0);
  const owl = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.4 && (live.sit || live.stillT > 2.2) && Math.abs(live.speed) < 0.4) {
      land.current = Math.min(1, land.current + dt * 0.8);
      if (land.current > 0.85 && !live.smashed.stumpowl) pay(8, "An owl sat with you. It did not talk. It did not have to.", "stumpowl");
    } else land.current = Math.max(0, land.current - dt);
    if (owl.current) {
      owl.current.visible = land.current > 0.2;
      owl.current.position.y = 0.55 + (1 - land.current) * 2.4;
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.38, 0.44, 8]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <group ref={owl} visible={false} position={[0.12, 0.55, 0.05]}>
        <mesh scale={[1, 1.15, 1]} castShadow>
          <sphereGeometry args={[0.12, 7, 6]} />
          <meshLambertMaterial color="#6a5a48" />
        </mesh>
        <mesh position={[0, 0.12, 0.04]}>
          <sphereGeometry args={[0.08, 6, 5]} />
          <meshLambertMaterial color="#7a6a58" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.04, 0.14, 0.06]}>
            <sphereGeometry args={[0.028, 6, 5]} />
            <meshLambertMaterial color="#efe6d4" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function HomeHive() {
  const x = TREE_TRUNK.x + 0.85;
  const z = TREE_TRUNK.z + 0.55;
  const y = heightAt(TREE_TRUNK.x, TREE_TRUNK.z) + 2.4;
  const bees = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (live.house) return;
    if (live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 1.6 && live.beeRage <= 0) {
      live.beeRage = 8;
      sfx.cluck();
      if (!live.smashed.homehive) pay(6, "The oak had a hive. The hive had opinions.", "homehive");
    }
    if (bees.current) {
      bees.current.visible = live.beeRage > 0;
      bees.current.position.set(live.x - x, live.y - y + 1.2, live.z - z);
      bees.current.rotation.y = clock.elapsedTime * 8;
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh scale={[1, 1.25, 1]} castShadow>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <group ref={bees} visible={false}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.cos(i) * 0.35, Math.sin(i * 1.4) * 0.2, Math.sin(i) * 0.35]}>
            <sphereGeometry args={[0.04, 5, 4]} />
            <meshLambertMaterial color="#f0d060" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function WagonHide() {
  const x = VX + 16;
  const z = VZ - 6;
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.55 && live.grounded && (live.sit || Math.abs(live.speed) < 0.45)) {
      live.hideGrass = true;
      if (!live.smashed.wagonhide) pay(7, "Under the wagon it smelled like oats. The vale did not look.", "wagonhide");
    }
  });
  return null;
}

function FlowerCrown() {
  useFrame(() => {
    if (live.house || live.flowerHat) return;
    if (live.carry === "flower" && !live.nearNpc && !live.nearMail && !live.nearHorse && consumeTalk()) {
      live.carry = null;
      live.flowerHat = true;
      pay(6, "You wore the flower. Nobody told you to. It looked right.", "flowercrown");
    }
  });
  return null;
}

function DuckSnack() {
  const { x, z } = DUCK_AT;
  const g = useRef<THREE.Group>(null);
  const follow = useRef(false);
  useFrame(() => {
    if (!g.current) return;
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.4 && (live.smashed.bread || live.carry === "flower") && Math.abs(live.speed) > 1.5) {
      follow.current = true;
      if (!live.smashed.ducksnack) pay(7, "The duck believed you had bread. It followed anyway.", "ducksnack");
    }
    if (follow.current) {
      const tx = live.x + Math.sin(live.playT) * 0.8;
      const tz = live.z + 1.2;
      g.current.position.set(tx, pondU(tx, tz) > 0.2 ? pondSurfaceY() : heightAt(tx, tz), tz);
    } else g.current.position.set(x, pondU(x, z) > 0.15 ? pondSurfaceY() : heightAt(x, z), z);
  });
  return (
    <group ref={g} position={[x, 1, z]}>
      <mesh position={[0, 0.12, 0]} scale={[1.2, 0.7, 1.4]} castShadow>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[0, 0.18, 0.14]}>
        <sphereGeometry args={[0.07, 5, 4]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[0, 0.16, 0.22]} rotation={[0.4, 0, 0]}>
        <coneGeometry args={[0.025, 0.08, 4]} />
        <meshLambertMaterial color="#c45c38" />
      </mesh>
    </group>
  );
}

function PondSteps() {
  const pts = [
    [POND.x - 2.1, POND.z + 1.4],
    [POND.x - 0.3, POND.z + 2.6],
    [POND.x + 1.4, POND.z + 2.1],
    [POND.x + 2.6, POND.z + 0.6],
  ] as const;
  const hit = useRef(0);
  const last = useRef(-1);
  useFrame(() => {
    if (live.house) return;
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i]!;
      if (Math.hypot(live.x - x, live.z - z) < 0.65 && live.grounded) {
        if (last.current === i - 1 || (i === 0 && last.current < 0)) {
          last.current = i;
          hit.current = i + 1;
          if (hit.current === 4 && !live.smashed.pondsteps) pay(10, "You crossed on the stones. Your socks stayed dry. Almost.", "pondsteps");
        }
      }
    }
  });
  const y = pondSurfaceY() + 0.04;
  return (
    <group>
      {pts.map(([x, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[-Math.PI / 2, 0, i * 0.4]} castShadow>
          <circleGeometry args={[0.48, 7]} />
          <meshLambertMaterial color="#6a6860" />
        </mesh>
      ))}
    </group>
  );
}

function WellHat() {
  const { x, z } = WELL_AT;
  useFrame(() => {
    if (live.house || live.hat) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.35 && live.jumpN >= 1 && live.grounded && !live.nearNpc) {
      live.hat = "pot";
      if (!live.smashed.wellhat) pay(6, "You wore the well bucket. Gran will not be proud.", "wellhat");
    }
  });
  return null;
}

function FrogWell() {
  const { x, z } = WELL_AT;
  useFrame(() => {
    if (live.house || live.carry !== "frog") return;
    if (Math.hypot(live.x - x, live.z - z) < 1.4 && consumeTalk()) {
      live.carry = null;
      if (!live.smashed.frogwell) pay(8, "You put the frog in the well. It sang. The well sang back.", "frogwell");
    }
  });
  return null;
}

function FlagClimb() {
  const { x, z } = FLAG_AT;
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 0.8 && live.y > heightAt(x, z) + 3.2 && !live.smashed.flagclimb) {
      pay(9, "You climbed the flag. The vale looked small. Then it looked huge again.", "flagclimb");
    }
  });
  return null;
}

function ChimneyDrop() {
  const x = TREE_HOME.x + TREE_HW * 0.55;
  const z = TREE_HOME.z - TREE_HD * 0.22;
  const y = heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H;
  useFrame(() => {
    if (live.house || live.doorUse) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 0.45 && live.y > y - 0.8 && live.grounded) {
      live.house = "yours";
      live.houseY = heightAt(TREE_HOME.x, TREE_HOME.z);
      live.x = TREE_HOME.x;
      live.z = TREE_HOME.z;
      live.y = y + 0.04;
      if (!live.smashed.chimney) pay(8, "You fell down the chimney. Gran did not ask.", "chimney");
    }
  });
  return (
    <mesh position={[x, y + 0.35, z]} castShadow>
      <cylinderGeometry args={[0.18, 0.22, 0.7, 6]} />
      <meshLambertMaterial color="#5a5448" />
    </mesh>
  );
}

function TownDial() {
  const x = VX - 2.4;
  const z = VZ + 3.2;
  const y = heightAt(x, z);
  const hits = useRef(0);
  const last = useRef(0);
  const arm = useRef<THREE.Group>(null);
  useFrame(() => {
    if (arm.current) arm.current.rotation.y = live.day * Math.PI * 2;
    if (live.house) return;
    if (live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 1.5 && live.playT - last.current > 0.35) {
      last.current = live.playT;
      hits.current += 1;
      sfx.thud();
      if (hits.current >= 3) {
        hits.current = 0;
        live.day = (live.day + 0.22) % 1;
        if (!live.smashed.towndial) pay(8, "You hit the sundial. The vale skipped a bit of day. The chickens complained.", "towndial");
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <circleGeometry args={[0.55, 10]} />
        <meshLambertMaterial color="#8a8070" />
      </mesh>
      <group ref={arm} position={[0, 0.18, 0]}>
        <mesh position={[0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.02, 0.03, 0.44, 5]} />
          <meshLambertMaterial color="#3a3228" />
        </mesh>
      </group>
    </group>
  );
}

function GeyserLaunch() {
  const { x, z } = GEYSER_AT;
  const y = heightAt(x, z);
  const cool = useRef(0);
  const jet = useRef<THREE.Mesh>(null);
  useFrame(({ clock }, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (jet.current) {
      const u = 0.6 + Math.abs(Math.sin(clock.elapsedTime * 3.2));
      jet.current.scale.y = u;
      jet.current.position.y = 0.4 + u;
    }
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.6 && live.grounded && cool.current <= 0) {
      cool.current = 2.8;
      live.boostY = 20;
      puffAt(x, z, y + 0.4);
      sfx.jump();
      live.hint = "WHOOSH. A geyser.";
      if (!live.smashed.geyser) pay(10, "The ground spit you out.", "geyser");
    } else if (d < 4) live.hint = "The ground is burping.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.4, 12]} />
        <meshLambertMaterial color="#6a6860" />
      </mesh>
      <mesh ref={jet} position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.12, 0.35, 2.4, 8]} />
        <meshBasicMaterial color="#c8e4f0" transparent opacity={0.45} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Lighthouse() {
  const { x, z } = LIGHT_AT;
  const y = heightAt(x, z);
  const beam = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (beam.current) {
      beam.current.visible = live.night;
      beam.current.rotation.y += dt * 0.7;
    }
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 3.2) {
      live.hint = live.night ? "A light that never had a ship. F" : "A lighthouse with no ocean.";
      if (live.night && consumeTalk() && !live.smashed.lighthouse) {
        pay(20, "You waved at nobody. Somebody waved back.", "lighthouse");
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 4.2, 0]} castShadow>
        <cylinderGeometry args={[0.7, 1.15, 8.4, 10]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0, 8.5, 0]}>
        <cylinderGeometry args={[0.85, 0.8, 0.7, 10]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
      <group ref={beam} position={[0, 8.5, 0]} visible={false}>
        <mesh position={[0, 0, -6]} rotation={[0.15, 0, 0]}>
          <coneGeometry args={[2.4, 12, 8, 1, true]} />
          <meshBasicMaterial color="#ffe9a0" transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function FaceHill() {
  const { x, z } = FACE_AT;
  const y = heightAt(x, z);
  const wink = useRef(false);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 18 && live.stillT > 3.2 && !live.smashed.facehill) {
      wink.current = true;
      pay(15, "The hill winked.", "facehill");
    } else if (d < 14) live.hint = "That cliff looks like a face.";
  });
  return (
    <group position={[x, y + 10, z]}>
      <mesh position={[-1.6, 2.2, -4.2]}>
        <sphereGeometry args={[0.7, 8, 6]} />
        <meshLambertMaterial color="#1a1410" />
      </mesh>
      <mesh position={[1.6, 2.2, -4.2]} scale={[1, wink.current ? 0.2 : 1, 1]}>
        <sphereGeometry args={[0.7, 8, 6]} />
        <meshLambertMaterial color="#1a1410" />
      </mesh>
      <mesh position={[0, 0.2, -4.4]} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[1.1, 0.12, 6, 10, Math.PI]} />
        <meshLambertMaterial color="#1a1410" />
      </mesh>
    </group>
  );
}

function FoxChase() {
  const pos = useRef({ x: FOX_AT.x, z: FOX_AT.z });
  const ran = useRef(0);
  const lead = useRef(false);
  const g = useRef<THREE.Group>(null);
  const den = { x: FOX_AT.x + 8.4, z: FOX_AT.z - 6.2 };
  useFrame((_, dt) => {
    if (!g.current || live.house) return;
    const p = pos.current;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 4.5 && live.stillT > 1.1 && !lead.current) {
      lead.current = true;
      live.listen = "The fox sat. Then it walked. Follow. Quietly.";
    }
    if (lead.current && Math.abs(live.speed) < 9) {
      p.x += (den.x - p.x) * dt * 0.45;
      p.z += (den.z - p.z) * dt * 0.45;
      if (Math.hypot(live.x - den.x, live.z - den.z) < 2.2 && Math.hypot(p.x - den.x, p.z - den.z) < 1.4) {
        pay(20, "The den. A rupee. And a sock.", "foxden");
        live.listen = "The den. A rupee. And a sock.";
      }
    } else if (d < 8 && d > 0.2 && !lead.current) {
      const inv = 1 / d;
      p.x += (p.x - live.x) * inv * 9 * dt;
      p.z += (p.z - live.z) * inv * 9 * dt;
      ran.current += dt;
      g.current.rotation.y = Math.atan2(-(p.x - live.x), -(p.z - live.z));
      if (ran.current > 11 && !live.smashed.fox) pay(12, "The fox got tired of being chased.", "fox");
    }
    g.current.position.set(p.x, heightAt(p.x, p.z) + 0.22, p.z);
    if (d < 5 && !lead.current) live.listen = live.listen || "A fox. Chase it, or sit still.";
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.28, 4, 6]} />
        <meshLambertMaterial color="#c45c38" />
      </mesh>
      <mesh position={[0, 0.18, -0.22]}>
        <sphereGeometry args={[0.1, 6, 5]} />
        <meshLambertMaterial color="#c45c38" />
      </mesh>
    </group>
  );
}

function NowhereMail() {
  const { x, z } = MAIL_NOWHERE;
  const y = heightAt(x, z);
  const sent = useRef(Boolean(live.smashed.nowheremail));
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.6) {
      live.hint = sent.current ? "You already mailed yourself." : "A mailbox with no house. F";
      if (!sent.current && consumeTalk()) {
        sent.current = true;
        pay(15, "You mailed yourself a rupee. It arrived instantly.", "nowheremail");
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.45, 0.32, 0.28]} />
        <meshLambertMaterial color="#3a6a88" />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.7, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function RedShroom() {
  const { x, z } = RED_SHROOM;
  const y = heightAt(x, z);
  const cap = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!cap.current) return;
    const on = Math.hypot(live.x - x, live.z - z) < 1.2 && !live.house;
    cap.current.scale.y = on ? 0.7 : 1;
    if (on && live.y > y + 0.9 && live.giantT <= 0 && !live.mounted) {
      live.giantT = 16;
      sfx.ok();
      live.hint = "You got huge. Houses look nervous.";
    }
    cap.current.rotation.y = Math.sin(clock.elapsedTime) * 0.05;
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.6, 8]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh ref={cap} position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.62, 10, 8]} />
        <meshLambertMaterial color="#c42838" />
      </mesh>
    </group>
  );
}

function PaperPlane() {
  const { x, z } = PLANE_AT;
  const y = heightAt(x, z);
  const flew = useRef(false);
  const g = useRef<THREE.Group>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!g.current) return;
    if (!flew.current && !live.house && Math.hypot(live.x - x, live.z - z) < 1.6) {
      live.hint = "A paper plane. F to throw";
      if (consumeTalk()) {
        flew.current = true;
        t.current = 0;
        sfx.ok();
        live.hint = "It knows where the geyser is.";
      }
    }
    if (flew.current) {
      t.current += dt;
      const u = Math.min(1, t.current / 8);
      g.current.position.set(x + (GEYSER_AT.x - x) * u, y + 4 + Math.sin(t.current * 3) * 0.4, z + (GEYSER_AT.z - z) * u);
      g.current.rotation.y = Math.atan2(-(GEYSER_AT.x - x), -(GEYSER_AT.z - z));
    }
  });
  return (
    <group ref={g} position={[x, y + 0.8, z]}>
      <mesh rotation={[0.4, 0.2, 0.1]} castShadow>
        <planeGeometry args={[0.55, 0.35]} />
        <meshLambertMaterial color="#efe6d4" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function GhostBench() {
  const { x, z } = GHOST_BENCH;
  const y = heightAt(x, z);
  const ghost = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ghost.current) return;
    const d = Math.hypot(live.x - x, live.z - z);
    const on = live.night && d < 4.5 && live.stillT > 1.6 && !live.house;
    ghost.current.visible = on;
    ghost.current.position.y = 0.7 + Math.sin(clock.elapsedTime * 2) * 0.08;
    if (on && !live.smashed.ghostbench) {
      pay(15, "A ghost sat down. It just wanted company.", "ghostbench");
      live.listen = "A ghost sat down. Then it stood. Follow it.";
    } else if (d < 2.2) live.listen = live.listen || (live.night ? "A bench. Sit still." : "A lonely bench. Come back at night.");
    if (live.smashed.ghostbench && live.night && ghost.current) {
      const gx = x + 4.2;
      const gz = z - 6.4;
      ghost.current.position.x += (4.2 - ghost.current.position.x) * 0.02;
      ghost.current.position.z += (-6.4 - ghost.current.position.z) * 0.02;
      if (Math.hypot(live.x - (x + 4.2), live.z - (z - 6.4)) < 1.6) {
        pay(12, "ghostfollow");
        live.listen = "It pointed at the grass. A rupee that is cold.";
      }
      void gx;
      void gz;
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[1.4, 0.08, 0.4]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[-0.6, 0.18, 0]}>
        <boxGeometry args={[0.08, 0.36, 0.4]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0.6, 0.18, 0]}>
        <boxGeometry args={[0.08, 0.36, 0.4]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <group ref={ghost} visible={false}>
        <mesh>
          <sphereGeometry args={[0.22, 8, 6]} />
          <meshBasicMaterial color="#d8e8f0" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

function PaintedDoor() {
  const { x, z } = PAINT_DOOR;
  const y = heightAt(x, z);
  const n = useRef(0);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.4 && live.ocarina) {
      pay(16, "The paint became a door. For a second.", "paintdoor");
      live.listen = "The paint became a door. For a second. A ledge.";
      live.x = x;
      live.z = z - 3.2;
      live.y = y + 2.4;
      live.boostY = 6;
    } else if (d < 2.2 && consumeTalk()) {
      n.current += 1;
      sfx.thud();
      live.listen = n.current < 3 ? "Knock. Nobody." : "A song might know this door.";
    } else if (d < 2.2) live.listen = live.listen || "A door painted on a cliff. Knock. Or play.";
  });
  return (
    <group position={[x, y + 1.4, z]}>
      <mesh>
        <boxGeometry args={[1.1, 2.1, 0.08]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0.32, -0.1, 0.06]}>
        <sphereGeometry args={[0.06, 6, 5]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function ConchHorn() {
  const { x, z } = CONCH_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.6 && (consumeTalk() || live.ocarina)) {
      sfx.hoot();
      pay(10, "A seagull dropped a rupee. Then it pointed at the pond.", "conch");
      live.listen = "A seagull dropped a rupee. Then it pointed at the pond.";
    } else if (d < 1.8) live.listen = live.listen || "A conch. Blow it.";
  });
  return (
    <mesh position={[x, y + 0.18, z]} rotation={[0.4, 0.6, 0.2]} castShadow>
      <coneGeometry args={[0.16, 0.42, 7]} />
      <meshLambertMaterial color="#efe6d4" />
    </mesh>
  );
}

function Beanstalk() {
  const { x, z } = BEAN_AT;
  const y = heightAt(x, z);
  const grown = useRef(Boolean(live.smashed.bean));
  const h = useRef(grown.current ? 12 : 0.2);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    if (!grown.current && !live.house && Math.hypot(live.x - x, live.z - z) < 1.5) {
      const seeds = useGame.getState().seeds ?? 0;
      live.hint = seeds > 0 ? "Plant a seed · F" : "Dirt. It wants a seed.";
      if (seeds > 0 && consumeTalk()) {
        useGame.setState({ seeds: seeds - 1 });
        grown.current = true;
        live.smashed.bean = true;
        sfx.ok();
        live.hint = "It shot up. Climb it.";
      }
    }
    if (grown.current) h.current += (12 - h.current) * (1 - Math.exp(-dt * 1.4));
    g.current.scale.y = Math.max(0.05, h.current / 12);
    if (grown.current && Math.hypot(live.x - x, live.z - z) < 1.1 && live.y > y + 6 && !live.smashed.beansteal) {
      pay(25, "A cloud left a rupee on the top.", "beansteal");
    }
  });
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh position={[0, 6, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.22, 12, 8]} />
        <meshLambertMaterial color="#3d8a68" />
      </mesh>
    </group>
  );
}

function PotatoRock() {
  const { x, z } = POTATO_AT;
  const y = heightAt(x, z);
  const n = useRef(0);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.5) {
      live.hint = "A potato? F";
      if (consumeTalk()) {
        n.current += 1;
        live.hint = n.current % 2 ? "It's a rock." : "It's a potato.";
        if (n.current >= 4 && !live.smashed.potato) pay(5, "Fine. It's both.", "potato");
      }
    }
  });
  return (
    <mesh position={[x, y + 0.22, z]} rotation={[0.2, 0.4, 0.1]} castShadow>
      <dodecahedronGeometry args={[0.32, 0]} />
      <meshLambertMaterial color="#8a6a40" />
    </mesh>
  );
}

function Seesaw() {
  const { x, z } = SEE_AT;
  const y = heightAt(x, z);
  const plank = useRef<THREE.Group>(null);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    const d = Math.hypot(live.x - x, live.z - z);
    const side = live.x < x ? -1 : 1;
    if (plank.current) plank.current.rotation.z += ((d < 1.4 && !live.mounted ? side * 0.28 : 0) - plank.current.rotation.z) * 0.12;
    if (d < 1.3 && !live.house && !live.mounted && Math.abs(live.speed) > 4 && cool.current <= 0) {
      cool.current = 1.6;
      live.boostY = 11;
      sfx.jump();
      live.hint = "Seesaw!";
      if (!live.smashed.seesaw) pay(5, "The other end had nobody. Rude.", "seesaw");
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.12, 0.28, 0.12]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <group ref={plank} position={[0, 0.44, 0]}>
        <mesh>
          <boxGeometry args={[2.4, 0.08, 0.35]} />
          <meshLambertMaterial color="#8a6a40" />
        </mesh>
      </group>
    </group>
  );
}

function WhoopeeStump() {
  const { x, z } = WHOOP_AT;
  const y = heightAt(x, z);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 0.7 && live.grounded && cool.current <= 0) {
      cool.current = 2.2;
      sfx.hiss();
      sfx.moo();
      live.hint = "PFFFT.";
      if (!live.smashed.whoopee) pay(5, "The stump is a whoopee cushion.", "whoopee");
    } else if (d < 1.4) live.hint = "A perfectly normal stump.";
  });
  return (
    <mesh position={[x, y + 0.18, z]} castShadow>
      <cylinderGeometry args={[0.38, 0.42, 0.36, 8]} />
      <meshLambertMaterial color="#6a4a28" />
    </mesh>
  );
}

function BananaPeel() {
  const pos = useRef({ x: BANANA_AT.x, z: BANANA_AT.z });
  const g = useRef<THREE.Group>(null);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (!g.current) return;
    if (cool.current > 0) cool.current -= dt;
    const p = pos.current;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 0.7 && Math.abs(live.speed) > 2 && cool.current <= 0 && !live.house) {
      cool.current = 1.8;
      live.knock = { vx: -Math.sin(live.yaw + 1.2) * 8, vz: -Math.cos(live.yaw + 1.2) * 8, t: 0.45 };
      live.dizzyT = Math.max(live.dizzyT, 0.7);
      sfx.thud();
      live.hint = "A banana peel. Of course.";
      if (!live.smashed.banana) pay(5, "You slipped. A rupee slipped with you.", "banana");
    }
    g.current.position.set(p.x, heightAt(p.x, p.z) + 0.04, p.z);
  });
  return (
    <group ref={g}>
      <mesh rotation={[0.4, 0.2, 0.6]}>
        <capsuleGeometry args={[0.05, 0.16, 3, 5]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function LemonadeStand() {
  const { x, z } = LEMON_AT;
  const y = heightAt(x, z);
  const sold = useRef(Boolean(live.smashed.lemon));
  useFrame(() => {
    if (live.house) return;
    const hr = gameClock().t;
    const open = hr >= 11 && hr < 15;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.7) {
      live.hint = !open ? "Lemonade. Back at noon." : sold.current ? "Sold out of the good stuff." : "Lemonade · 5 rupees · F";
      if (open && !sold.current && consumeTalk()) {
        const coins = useGame.getState().coins ?? 0;
        if (coins >= 5) {
          useGame.setState({ coins: coins - 5 });
          sold.current = true;
          live.smashed.lemon = true;
          useGame.getState().healGrass();
          sfx.ok();
          live.hint = "Sour. Hearts a little better.";
        } else live.hint = "Five rupees.";
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.1, 0.12, 0.55]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[-0.45, 0.28, 0]}>
        <boxGeometry args={[0.08, 0.55, 0.08]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0.45, 0.28, 0]}>
        <boxGeometry args={[0.08, 0.55, 0.08]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.1, 6, 5]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function DandelionBlow() {
  const { x, z } = DANDELION_AT;
  const y = heightAt(x, z);
  const blew = useRef(0);
  const seeds = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (seeds.current) {
      seeds.current.visible = blew.current > 0;
      if (blew.current > 0) blew.current -= dt;
      seeds.current.children.forEach((c, i) => {
        c.position.y += dt * 0.8;
        c.position.x += Math.sin(i) * dt * 0.4;
      });
    }
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.2) {
      live.hint = "A dandelion. F to blow";
      if (consumeTalk()) {
        blew.current = 2.2;
        sfx.ok();
        live.flowers += 1;
        live.hint = "Make a wish.";
        if (live.flowers >= 3 && !live.smashed.dandelion) pay(10, "Three wishes. One rupee. Fair.", "dandelion");
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.44, 4]} />
        <meshLambertMaterial color="#3d8a68" />
      </mesh>
      <mesh position={[0, 0.46, 0]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <group ref={seeds} visible={false}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.cos(i) * 0.1, 0.5, Math.sin(i) * 0.1]}>
            <sphereGeometry args={[0.025, 4, 3]} />
            <meshBasicMaterial color="#efe6d4" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function PondSwing() {
  const { x, z } = SWING_AT;
  const y = heightAt(x, z);
  const seat = useRef<THREE.Group>(null);
  const cool = useRef(0);
  useFrame(({ clock }, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (seat.current) seat.current.rotation.x = Math.sin(clock.elapsedTime * 1.4) * 0.35;
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.5 && !live.mounted) {
      live.hint = "A swing. F";
      if (consumeTalk() && cool.current <= 0) {
        cool.current = 1.4;
        live.boostY = 8;
        live.knock = { vx: 7, vz: -6, t: 0.7 };
        sfx.jump();
        live.hint = "Weeee.";
        if (!live.smashed.swing) pay(5, "The swing launched you.", "swing");
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[-0.7, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 2.8, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0.7, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 2.8, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <group ref={seat} position={[0, 2.6, 0]}>
        <mesh position={[0, -1.1, 0]}>
          <boxGeometry args={[0.7, 0.06, 0.28]} />
          <meshLambertMaterial color="#8a5a28" />
        </mesh>
      </group>
    </group>
  );
}

function LuckyClover() {
  const { x, z } = CLOVER_AT;
  const y = heightAt(x, z);
  const took = useRef(Boolean(live.smashed.clover));
  const [, bump] = useState(0);
  useFrame(() => {
    if (took.current || live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.1) {
      live.hint = "Four leaves. F";
      if (consumeTalk()) {
        took.current = true;
        live.lucky = 1;
        pay(10, "Luck. Don't spend it all.", "clover");
        bump((v) => v + 1);
      }
    }
  });
  if (took.current) return null;
  return (
    <mesh position={[x, y + 0.08, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.18, 8]} />
      <meshLambertMaterial color="#3d8a68" />
    </mesh>
  );
}

function TumbleWeed() {
  const pos = useRef({ x: DESERT_AT.x + 8, z: DESERT_AT.z + 4, vx: 2, vz: 1.2 });
  const g = useRef<THREE.Group>(null);
  const spin = useRef(0);
  useFrame((_, dt) => {
    if (!g.current) return;
    const p = pos.current;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 1.2 && Math.abs(live.speed) > 3) {
      p.vx = -Math.sin(live.yaw) * 8;
      p.vz = -Math.cos(live.yaw) * 8;
      if (!live.smashed.tumble) pay(5, "You kicked a tumbleweed. Western.", "tumble");
    }
    p.x += p.vx * dt;
    p.z += p.vz * dt;
    p.vx *= Math.exp(-dt * 0.4);
    p.vz *= Math.exp(-dt * 0.4);
    if (Math.hypot(p.x - DESERT_AT.x, p.z - DESERT_AT.z) > 40) {
      p.x = DESERT_AT.x + 8;
      p.z = DESERT_AT.z + 4;
      p.vx = 2;
      p.vz = 1.2;
    }
    spin.current += dt * 4;
    g.current.position.set(p.x, heightAt(p.x, p.z) + 0.28, p.z);
    g.current.rotation.x = spin.current;
  });
  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[0.28, 7, 6]} />
        <meshLambertMaterial color="#8a6a40" wireframe />
      </mesh>
    </group>
  );
}

function RainbowPot() {
  const g = useRef<THREE.Group>(null);
  const got = useRef(Boolean(live.smashed.rainbow));
  useFrame(() => {
    if (!g.current) return;
    const on = live.rainT <= 0 && live.smashed.rainbowwait && !live.night && !live.house;
    // set flag while raining
    if (live.rainT > 0) live.smashed.rainbowwait = true;
    g.current.visible = Boolean(on);
    if (!on) return;
    const x = VX + 40;
    const z = VZ - 40;
    g.current.position.set(x, heightAt(x, z) + 0.2, z);
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.8 && !got.current) {
      live.hint = "A pot. F";
      if (consumeTalk()) {
        got.current = true;
        pay(50, "The rainbow's leftover.", "rainbow");
      }
    }
  });
  return (
    <group ref={g} visible={false}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.35, 8]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function PieCloud() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const on = Boolean(live.smashed.nanapie) && !live.house;
    g.current.visible = on;
    if (!on) return;
    g.current.position.set(live.x + Math.sin(clock.elapsedTime) * 0.4, live.y + 2.4, live.z);
    if (!live.smashed.piecloud) {
      live.hint = "A raincloud followed the pie thief.";
      live.smashed.piecloud = true;
    }
  });
  return (
    <group ref={g} visible={false}>
      <mesh>
        <sphereGeometry args={[0.45, 8, 6]} />
        <meshLambertMaterial color="#8a98a8" />
      </mesh>
    </group>
  );
}

function SnowAngel() {
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - SNOW_AT.x, live.z - SNOW_AT.z);
    if (d < 10 && live.sit && !live.smashed.snowangel) {
      pay(10, "A snow angel. Cold. Cute.", "snowangel");
    } else if (d < 8 && live.stillT > 2.5) live.hint = "Lie down in the snow? Sit.";
  });
  return null;
}

function HorseDance() {
  useFrame(() => {
    if (live.mounted && live.songOk && !live.smashed.horsedance) {
      live.horseRear = 1;
      pay(10, "Your horse danced. Don't tell anyone.", "horsedance");
    }
  });
  return null;
}

function GoldenEgg() {
  const acc = useRef(0);
  const last = useRef(0);
  useFrame(() => {
    if (live.house || live.backT < 6) {
      acc.current *= 0.9;
      return;
    }
    const hens = Object.values(live.chickens);
    if (!hens.length) return;
    let best = 99;
    let hx = 0;
    let hz = 0;
    for (const h of hens) {
      const d = Math.hypot(live.x - h.x, live.z - h.z);
      if (d < best) {
        best = d;
        hx = h.x;
        hz = h.z;
      }
    }
    if (best > 5.5 || best < 0.7) return;
    const a = Math.atan2(live.x - hx, live.z - hz);
    let da = a - last.current;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    last.current = a;
    acc.current += da;
    if (Math.abs(acc.current) > Math.PI * 2 && !live.smashed.goldeneegg) {
      pay(25, "The chicken laid a gold egg. Don't ask.", "goldeneegg");
    }
  });
  return null;
}

function ChocoCow() {
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - COW_PAD.x, live.z - COW_PAD.z);
    if (d < 1.8 && live.night && live.hat === "pumpkin" && !live.smashed.choco) {
      live.hint = "She likes the pumpkin. F";
      if (consumeTalk()) {
        useGame.getState().healAll();
        pay(5, "Chocolate milk. Don't tell the cow.", "choco");
        sfx.moo();
      }
    }
  });
  return null;
}

function SleepGiant() {
  const { x, z } = SLEEP_GIANT;
  const y = heightAt(x, z);
  const n = useRef(0);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 14) live.listen = live.listen || "A hill that's snoring. The ear looks like a cave.";
    const ear = { x: x + 2.2, z: z - 8 };
    if (Math.hypot(live.x - ear.x, live.z - ear.z) < 1.4 && live.y > y + 4) {
      addTrapSpot(ear.x, ear.z, 0.8, 5.2);
      pay(20, "You walked into an ear. It is warm. A rupee was wax.", "sleepgiant");
      live.listen = "You walked into an ear. It is warm. A rupee was wax.";
    }
    if (d < 6 && live.y > y + 4 && live.grounded && live.jumpN >= 3) {
      live.boostY = 16;
      sfx.moo();
    }
  });
  return (
    <group position={[x, y + 6, z]}>
      <mesh position={[-2.2, 3.2, -8]}>
        <sphereGeometry args={[0.9, 8, 6]} />
        <meshLambertMaterial color="#1a1410" />
      </mesh>
      <mesh position={[2.2, 3.2, -8]}>
        <sphereGeometry args={[0.9, 8, 6]} />
        <meshLambertMaterial color="#1a1410" />
      </mesh>
      <mesh position={[0, 1.2, -8.4]} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[1.4, 0.16, 6, 10, Math.PI]} />
        <meshLambertMaterial color="#1a1410" />
      </mesh>
    </group>
  );
}

function StoneRing() {
  const last = useRef(0);
  const acc = useRef(0);
  const { x, z } = STONE_RING;
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    const a = Math.atan2(live.x - x, live.z - z);
    let da = a - last.current;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    last.current = a;
    if (d > 5 && d < 11 && Math.abs(live.speed) > 2) {
      acc.current += da;
      if (Math.abs(acc.current) > Math.PI * 2 && !live.smashed.stonering) {
        pay(25, "The stones hummed. A rupee hummed back.", "stonering");
      }
    } else acc.current *= 0.97;
    if (d < 12 && d > 4) live.listen = live.listen || "Walk the ring all the way around.";
  });
  return (
    <group position={[x, heightAt(x, z), z]}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 8.2, 0.7, Math.sin(a) * 8.2]} castShadow>
            <dodecahedronGeometry args={[0.7, 0]} />
            <meshLambertMaterial color="#7a7468" />
          </mesh>
        );
      })}
    </group>
  );
}

function MirrorLake() {
  const { x, z } = MIRROR_LAKE;
  const y = heightAt(x, z) + 0.06;
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 8 && live.stillT > 2.4 && !live.smashed.mirror) {
      pay(20, "Your reflection waved first.", "mirror");
      live.listen = "Your reflection waved first.";
    } else if (d < 8 && Math.abs(live.speed) > 5) {
      pay(8, "A skip. The rings went out and came back.", "mirrorskip");
      live.listen = "A skip. The rings went out and came back.";
    } else if (d < 8) live.listen = live.listen || "Still water. Skip a stone, or wait.";
  });
  return (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[10.4, 24]} />
      <meshLambertMaterial color="#4a7088" transparent opacity={0.8} />
    </mesh>
  );
}

function KeepCannon() {
  const { x, z } = CANNON_AT;
  const y = heightAt(x, z);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.7 && !live.mounted) {
      live.hint = "A cannon. F to sit in it";
      if (consumeTalk() && cool.current <= 0) {
        cool.current = 2.4;
        live.boostY = 18;
        live.knock = { vx: 8, vz: 22, t: 1.1 };
        sfx.jump();
        live.hint = "BOOM. You were the cannonball.";
        if (!live.smashed.cannon) pay(10, "The keep did not ask for that.", "cannon");
      }
    }
  });
  return (
    <group position={[x, y, z]} rotation={[0, 0.4, 0]}>
      <mesh position={[0, 0.55, 0]} rotation={[0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 1.6, 10]} />
        <meshLambertMaterial color="#3a2818" />
      </mesh>
      <mesh position={[0, 0.22, 0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.12, 10]} />
        <meshLambertMaterial color="#1a1410" />
      </mesh>
    </group>
  );
}

function FossilDig() {
  const { x, z } = FOSSIL_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.4 && (live.stompT > 0 || (!live.grounded && live.y < y + 1.4))) {
      pay(15, "A bone. A very old bone.", "fossil");
      live.listen = "A bone. Someone stomped it up.";
    } else if (d < 2.4) live.listen = live.listen || "The ground looks bony. Stomp.";
  });
  return (
    <mesh position={[x, y + 0.06, z]} rotation={[-0.2, 0.4, 0.1]} castShadow>
      <capsuleGeometry args={[0.08, 0.7, 3, 5]} />
      <meshLambertMaterial color="#efe6d4" />
    </mesh>
  );
}

function WoodSword() {
  const { x, z } = SWORD_STONE;
  const y = heightAt(x, z);
  const pulled = useRef(Boolean(live.smashed.woodsword));
  const hits = useRef(0);
  const cool = useRef(0);
  const [, bump] = useState(0);
  useFrame((_, dt) => {
    if (pulled.current || live.house) return;
    cool.current = Math.max(0, cool.current - dt);
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.7 && live.slash && cool.current <= 0) {
      hits.current += 1;
      cool.current = 0.4;
      sfx.thud();
      live.listen = hits.current < 3 ? "It shook. Hit it again." : "Now pull.";
    }
    if (d < 1.6 && hits.current >= 3 && consumeTalk()) {
      pulled.current = true;
      pay(12, "It came free. Wood. Still sharp enough.", "woodsword");
      live.listen = "It came free. Wood. Still sharp enough.";
      bump((v) => v + 1);
    }
    if (d < 1.8 && hits.current < 3) live.listen = live.listen || "A sword in a stone. Hit it, then pull.";
  });
  if (pulled.current) {
    return (
      <mesh position={[x, y + 0.35, z]} castShadow>
        <dodecahedronGeometry args={[0.55, 0]} />
        <meshLambertMaterial color="#6a6860" />
      </mesh>
    );
  }
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <dodecahedronGeometry args={[0.55, 0]} />
        <meshLambertMaterial color="#6a6860" />
      </mesh>
      <mesh position={[0, 1.15, 0]} rotation={[0.15, 0, 0.08]} castShadow>
        <boxGeometry args={[0.08, 1.3, 0.18]} />
        <meshLambertMaterial color="#8a6a40" />
      </mesh>
    </group>
  );
}

function HammockNap() {
  const { x, z } = HAMMOCK_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    addTrapSpot(x, z, 0.7, 0.7);
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.4 && (live.sit || live.stillT > 1.2) && !live.smashed.hammock) {
      pay(10, "Best nap. Hearts came back. A rupee in the pocket.", "hammock");
      live.listen = "Best nap. Hearts came back. A rupee in the pocket.";
      useGame.getState().healAll();
    } else if (d < 1.6) live.listen = live.listen || "A hammock. Lie still.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[-0.9, 0.7, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 1.4, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0.9, 0.7, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 1.4, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 0.85, 0]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[1.6, 0.06, 0.5]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
    </group>
  );
}

function WetPaint() {
  const { x, z } = WET_PAINT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 0.8 && Math.abs(live.speed) > 1.5) {
      pay(5, "You touched it. Blue hand. Footprints.", "wetpaint");
      live.listen = "Wet paint. Your feet are blue. Walk. The prints go somewhere.";
    }
    if (live.smashed.wetpaint && Math.hypot(live.x - (x + 4.2), live.z - (z + 3.6)) < 1.2) {
      pay(10, "paintend");
      live.listen = "The last print. A rupee stuck in the grass.";
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.08, 1.4, 1.1]} />
        <meshLambertMaterial color="#3a6a88" />
      </mesh>
    </group>
  );
}

function CrabSteal() {
  const pos = useRef({ x: CRAB_AT.x, z: CRAB_AT.z, got: false });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    const p = pos.current;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 2.2 && live.stillT > 0.8 && !p.got) {
      p.x += (live.x - p.x) * dt * 1.4;
      p.z += (live.z - p.z) * dt * 1.4;
      if (d < 0.7) {
        p.got = true;
        pay(10, "The crab took a crumb. It left a rupee. Even trade.", "crab");
        live.listen = "The crab took a crumb. It left a rupee. Even trade.";
      }
    } else if (d < 2.2 && !p.got) {
      const inv = d > 0.1 ? 1 / d : 1;
      p.x += (p.x - live.x) * inv * 6 * dt;
      p.z += (p.z - live.z) * inv * 6 * dt;
    }
    g.current.position.set(p.x, heightAt(p.x, p.z) + 0.08, p.z);
    if (d < 2.4 && !p.got) live.listen = live.listen || "A crab. If you chase it, it runs. If you wait, it comes.";
  });
  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
    </group>
  );
}

function WeatherVane() {
  const { x, z } = VANE_AT;
  const y = heightAt(x, z);
  const spin = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (spin.current) spin.current.rotation.y = clock.elapsedTime * 0.7;
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.8) live.listen = live.listen || "It points at the geyser. Follow the arrow.";
    if (d < 1.6 && consumeTalk()) {
      pay(5, "Spinning it did nothing. The arrow still means geyser.", "vane");
      live.listen = "It still points at the geyser.";
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 2.2, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <group ref={spin} position={[0, 2.2, 0]}>
        <mesh rotation={[0, 0, 0.4]}>
          <coneGeometry args={[0.12, 0.7, 4]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      </group>
    </group>
  );
}

function RainDance() {
  useFrame(() => {
    if (live.rainT > 0 && live.circleN > Math.PI * 3 && !live.smashed.raindance) {
      pay(15, "You danced in the rain. The rain tipped you.", "raindance");
    }
  });
  return null;
}

function HowlHill() {
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - STAR_HILL.x, live.z - STAR_HILL.z);
    if (d < 8 && live.night && (live.songOk || live.whistleN > 2) && !live.smashed.howl) {
      pay(15, "Something howled back. It left a rupee.", "howl");
      sfx.hoot();
    } else if (d < 6 && live.night) live.hint = "A good hill for howling.";
  });
  return null;
}

function CountSheep() {
  const n = useRef(0);
  const last = useRef(0);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - SHEEP_AT.x, live.z - SHEEP_AT.z);
    if (d < 10 && live.sit && live.playT - last.current > 1.4) {
      last.current = live.playT;
      n.current += 1;
      live.hint = `${n.current} sheep...`;
      if (n.current >= 5 && !live.smashed.sheepcount) pay(10, "You fell asleep counting. A rupee snored.", "sheepcount");
    }
  });
  return null;
}

function CampMallow() {
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - CAMP_AT.x, live.z - CAMP_AT.z);
    if (d < 2.4 && live.sit && live.fireLit && !live.smashed.mallow) {
      pay(10, "A marshmallow you didn't bring. Perfect.", "mallow");
      useGame.getState().healGrass();
    } else if (d < 2.2 && live.fireLit) live.hint = "The fire wants a sit.";
  });
  return null;
}

function HiccupApple() {
  useFrame(() => {
    if (live.appleAte >= 4 && !live.smashed.hiccup) {
      live.hint = "Hic. Hic.";
      pay(5, "Hic. A rupee fell out.", "hiccup");
    }
  });
  return null;
}

function RainWorm() {
  const { x, z } = { x: VX + 8, z: VZ + 18 };
  const show = live.rainT > 0 || Boolean(live.smashed.rainbowwait);
  const took = useRef(Boolean(live.smashed.worm));
  useFrame(() => {
    if (!show || took.current || live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.2) {
      live.hint = "A worm. F";
      if (consumeTalk()) {
        took.current = true;
        useGame.getState().addFish();
        pay(5, "Bait. The worm is a fish now. Don't think about it.", "worm");
      }
    }
  });
  if (took.current) return null;
  return (
    <mesh position={[x, heightAt(x, z) + 0.04, z]} rotation={[0.4, 0.2, 1.1]} visible={show}>
      <capsuleGeometry args={[0.03, 0.16, 3, 4]} />
      <meshLambertMaterial color="#c45c58" />
    </mesh>
  );
}

function ShadowFive() {
  useFrame(() => {
    if (live.house) return;
    const dusk = duskAmt();
    if (dusk > 0.35 && dusk < 0.85 && live.swinging && live.stillT < 0.2 && Math.abs(live.speed) < 0.4 && !live.smashed.shadowfive) {
      pay(10, "You high-fived your shadow.", "shadowfive");
    }
  });
  return null;
}

function LookoutTower() {
  const { x, z } = LOOK_AT;
  const y = heightAt(x, z);
  const still = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    const onDeck = d < 1.45 && live.y > y + 7.4;
    const atLadder = Math.hypot(live.x - LOOK_LADDER.x, live.z - LOOK_LADDER.z) < 1.4;
    if (onDeck) {
      still.current += Math.abs(live.speed) < 0.5 ? dt : 0;
      live.hint = "The vale never ends.";
      if (still.current > 2.4 && !live.smashed.lookout) {
        pay(25, "You found the view. The vale is huge.", "lookout");
      }
    } else {
      still.current = 0;
      if (atLadder && !live.climbing) live.hint = "A ladder. Walk into it.";
      else if (d < 5.5) live.hint = "A lookout. The rest of the vale is up there.";
    }
  });
  return (
    <group position={[x, y, z]}>
      {[
        [-1.05, -1.05],
        [1.05, -1.05],
        [-1.05, 1.05],
        [1.05, 1.05],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, 4.7, pz]} castShadow>
          <cylinderGeometry args={[0.12, 0.16, 9.4, 6]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      ))}
      <mesh position={[0, 9.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.16, 2.7]} />
        <meshLambertMaterial color="#8a6a3c" />
      </mesh>
      {[
        [0, 1.22],
        [0, -1.22],
        [1.22, 0],
        [-1.22, 0],
      ].map(([px, pz], i) => (
        <mesh key={`r${i}`} position={[px, 9.85, pz]}>
          <boxGeometry args={[px === 0 ? 2.55 : 0.1, 0.55, pz === 0 ? 2.55 : 0.1]} />
          <meshLambertMaterial color="#5a3a1c" />
        </mesh>
      ))}
      {[-0.55, 0, 0.55, 1.1, 1.65, 2.2, 2.75, 3.3, 3.85, 4.4, 4.95, 5.5, 6.05, 6.6, 7.15, 7.7, 8.25, 8.8].map((h, i) => (
        <mesh key={`g${i}`} position={[0, h, -1.88]}>
          <boxGeometry args={[0.55, 0.08, 0.1]} />
          <meshLambertMaterial color="#4a3018" />
        </mesh>
      ))}
      <mesh position={[0, 4.6, -1.92]}>
        <boxGeometry args={[0.08, 9.2, 0.08]} />
        <meshLambertMaterial color="#3a2414" />
      </mesh>
      <mesh position={[0.28, 4.6, -1.92]}>
        <boxGeometry args={[0.08, 9.2, 0.08]} />
        <meshLambertMaterial color="#3a2414" />
      </mesh>
    </group>
  );
}

function LookoutSign() {
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - (VX - 8), live.z - (VZ + 28));
    if (d < 1.8) live.hint = "NORTH · the rest of the vale";
  });
  return <N64Sign x={VX - 8} z={VZ + 28} />;
}

function KeepOffGrass() {
  const t = useRef(0);
  useFrame((_, dt) => {
    if (live.house || live.mounted) return;
    const dKeep = Math.hypot(live.x, live.z - KEEP_Z);
    const onRoad = Math.abs(live.x) < 9 && live.z > VZ + 16 && live.z < KEEP_Z - 10;
    if (dKeep < 36 && dKeep > 16 && !onRoad && Math.abs(live.speed) > 2.2) {
      t.current += dt;
      live.hint = "The lawn is watching.";
      if (t.current > 3.6 && !live.smashed.keepgrass) {
        pay(5, "A ghost gardener coughed. Get off the grass.", "keepgrass");
      }
    } else t.current = Math.max(0, t.current - dt * 1.4);
  });
  return null;
}

function SkipStones() {
  const n = useRef(0);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - DOCK.x, live.z - DOCK.z);
    if (d < 2.4) {
      live.hint = "Skip a stone. F";
      if (consumeTalk() && cool.current <= 0) {
        cool.current = 0.45;
        n.current += 1;
        puffAt(POND.x, POND.z, heightAt(POND.x, POND.z) + 0.2);
        sfx.ok();
        live.hint = n.current === 1 ? "One skip." : n.current === 2 ? "Two skips." : `${n.current} skips.`;
        if (n.current >= 5 && !live.smashed.skipstone) {
          pay(15, "Five skips. The pond clapped.", "skipstone");
        }
      }
    }
  });
  return null;
}

function TalkMoon() {
  useFrame(() => {
    if (live.house || !live.night || live.talking || live.nearNpc) return;
    if (live.stillT > 2.6 && Math.abs(live.speed) < 0.25) {
      live.hint = "The moon is listening. F";
      if (consumeTalk() && !live.smashed.talkmoon) {
        pay(20, "You told the moon a secret. It did not tell anyone.", "talkmoon");
      }
    }
  });
  return null;
}

function LaundryBounce() {
  const { x, z } = LAUNDRY_AT;
  const y = heightAt(x, z);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house || live.mounted) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.35 && live.y > y + 0.4 && live.y < y + 2.4 && cool.current <= 0) {
      cool.current = 0.9;
      live.boostY = 14;
      live.laundryOn = 1;
      puffAt(x, z, y + 1.2);
      sfx.jump();
      live.hint = "The laundry launched you.";
      if (!live.smashed.laundry) pay(10, "Clean bounce.", "laundry");
    } else if (d < 2.2) live.hint = "Sheets. Jump into them.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[-1.1, 1.15, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 2.3, 5]} />
        <meshLambertMaterial color="#5a3a20" />
      </mesh>
      <mesh position={[1.1, 1.15, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 2.3, 5]} />
        <meshLambertMaterial color="#5a3a20" />
      </mesh>
      <mesh position={[0, 2.18, 0]} rotation={[0, 0, 0.04]}>
        <boxGeometry args={[2.3, 0.04, 0.04]} />
        <meshLambertMaterial color="#3a2a18" />
      </mesh>
      {[-0.7, 0, 0.7].map((ox, i) => (
        <mesh key={i} position={[ox, 1.7, 0.02]} rotation={[0.1, 0.2 * i, 0.08]}>
          <planeGeometry args={[0.7, 0.95]} />
          <meshLambertMaterial color={i === 1 ? "#efe6d4" : "#d8c4a8"} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function WishWell() {
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house || live.raceT > 0 || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - WELL_AT.x, live.z - WELL_AT.z);
    if (d < 1.8) {
      live.hint = "A wish. F";
      if (consumeTalk() && cool.current <= 0 && !live.smashed.wishwell) {
        cool.current = 1.2;
        live.lucky = 1;
        pay(8, "The well liked your wish. It paid you.", "wishwell");
      }
    }
  });
  return null;
}

function StarCatch() {
  useFrame(() => {
    if (live.house || !live.night) return;
    const d = Math.hypot(live.x - STAR_HILL.x, live.z - STAR_HILL.z);
    if (d < 8 && !live.grounded && live.y > heightAt(live.x, live.z) + 2.4 && !live.smashed.starcatch) {
      pay(25, "You caught a star. Put it back, it said. You did.", "starcatch");
    } else if (d < 6 && live.night) live.hint = "The stars feel close.";
  });
  return null;
}

function WhaleHill() {
  const { x, z } = WHALE_AT;
  const y = heightAt(x, z);
  const cool = useRef(0);
  const spout = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (spout.current) {
      const on = cool.current > 1.4;
      spout.current.visible = on;
      spout.current.scale.y = on ? 1 + (2.4 - cool.current) : 0.2;
    }
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 8 && live.grounded && cool.current <= 0) {
      cool.current = 2.4;
      live.boostY = 16;
      sfx.jump();
      live.hint = "The hill blew water. It is a whale.";
      if (!live.smashed.whale) pay(20, "A hill that is also a whale.", "whale");
    } else if (d < 16) live.hint = "This hill is breathing.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 2.2, -6]} rotation={[0.3, 0.2, 0]}>
        <sphereGeometry args={[3.4, 8, 6]} />
        <meshLambertMaterial color="#6a7a88" />
      </mesh>
      <mesh ref={spout} position={[0, 8, 0]} visible={false}>
        <cylinderGeometry args={[0.2, 0.8, 8, 8]} />
        <meshBasicMaterial color="#c8e4f0" transparent opacity={0.4} depthWrite={false} />
      </mesh>
    </group>
  );
}

function GiantNeedle() {
  const { x, z } = NEEDLE_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 3.2) {
      live.hint = "A needle the size of a tree. F";
      if (consumeTalk() && !live.smashed.needle) {
        pay(15, "You did not thread it. Good.", "needle");
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 6.4, 0]} rotation={[0.18, 0.4, 0.08]} castShadow>
        <cylinderGeometry args={[0.08, 0.02, 12.8, 6]} />
        <meshLambertMaterial color="#c0c8d0" />
      </mesh>
      <mesh position={[0.15, 12.4, 0.2]} rotation={[0.18, 0.4, 0.08]}>
        <torusGeometry args={[0.28, 0.07, 6, 10]} />
        <meshLambertMaterial color="#a8b0b8" />
      </mesh>
    </group>
  );
}

function CloudPier() {
  const { x, z } = CLOUD_PIER;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4.5) {
      live.listen = live.listen || "A pier in the clouds. Jump off the end.";
      if (!live.grounded && live.y > y + 1.2) {
        live.glideT = Math.max(live.glideT, 7);
        pay(20, "The cloud caught you.", "cloudpier");
        live.listen = "The cloud caught you.";
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      {[-2.2, -0.7, 0.8, 2.3].map((oz, i) => (
        <mesh key={i} position={[0, 0.18, oz]} receiveShadow>
          <boxGeometry args={[1.8, 0.12, 1.2]} />
          <meshLambertMaterial color="#8a6a40" />
        </mesh>
      ))}
      <mesh position={[-0.7, 0.7, 2.8]}>
        <cylinderGeometry args={[0.06, 0.07, 1.4, 5]} />
        <meshLambertMaterial color="#5a3a20" />
      </mesh>
      <mesh position={[0.7, 0.7, 2.8]}>
        <cylinderGeometry args={[0.06, 0.07, 1.4, 5]} />
        <meshLambertMaterial color="#5a3a20" />
      </mesh>
    </group>
  );
}

function IceCrown() {
  const { x, z } = ICE_CROWN;
  const y = heightAt(x, z);
  const spin = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 3.4 && Math.abs(live.speed) > 2) {
      spin.current += dt;
      if (spin.current > 2.2 && !live.smashed.icecrown) {
        live.dizzyT = 2.4;
        pay(15, "The ice crown spun you. You are king of cold.", "icecrown");
      }
    } else spin.current = Math.max(0, spin.current - dt);
    if (d < 6) live.hint = "A crown of ice. Run around it.";
  });
  return (
    <group position={[x, y + 1.2, z]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.cos(i * 1.26) * 1.1, 0.4 + (i % 2) * 0.4, Math.sin(i * 1.26) * 1.1]} rotation={[0.2, i, 0.1]}>
          <coneGeometry args={[0.28, 1.6, 5]} />
          <meshLambertMaterial color="#d8eef8" transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function SandShip() {
  const { x, z } = SAND_SHIP;
  const pos = useRef({ x, z });
  const g = useRef<THREE.Group>(null);
  const on = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    const p = pos.current;
    const y = heightAt(p.x, p.z);
    addTrapSpot(p.x, p.z, 2.2, 0.85);
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 2.4 && live.y > y + 0.5) on.current = true;
    if (on.current && (d > 3.2 || !live.grounded)) on.current = false;
    if (on.current && (live.ocarina || live.sprinting)) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      p.x += fx * 5.2 * dt;
      p.z += fz * 5.2 * dt;
      live.x = p.x;
      live.z = p.z;
      pay(20, "The sand-ship slid. A little.", "sandship");
      live.listen = "The sand-ship slid. Stop running to hop off.";
    }
    if (g.current) g.current.position.set(p.x, y, p.z);
    if (d < 4 && !on.current) live.listen = live.listen || "A ship with no water. Climb on. Run to sail.";
  }, -2);
  return (
    <group ref={g} position={[x, heightAt(x, z), z]}>
      <mesh position={[0, 0.7, 0]} rotation={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[5.4, 1.1, 1.6]} />
        <meshLambertMaterial color="#c4a06a" />
      </mesh>
      <mesh position={[0.2, 2.6, 0.1]}>
        <cylinderGeometry args={[0.08, 0.1, 3.6, 5]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0.2, 3.4, 0.55]} rotation={[0.15, 0, 0]}>
        <planeGeometry args={[1.6, 2.2]} />
        <meshLambertMaterial color="#efe6d4" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function BounceMush() {
  const { x, z } = BOUNCE_AT;
  const y = heightAt(x, z);
  const cool = useRef(0);
  const cap = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (cap.current) cap.current.scale.y = cool.current > 0 ? 0.7 : 1;
    if (live.house || live.mounted) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.15 && live.grounded && cool.current <= 0) {
      cool.current = 0.7;
      live.boostY = 12;
      sfx.jump();
      live.hint = "Boing.";
      if (!live.smashed.bounce) pay(5, "A mushroom that is a trampoline.", "bounce");
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 0.5, 6]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh ref={cap} position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.55, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color="#c45c58" />
      </mesh>
    </group>
  );
}

function BirdOnHead() {
  useFrame(() => {
    if (live.house || live.mounted) return;
    if (live.stillT > 9 && Math.hypot(live.x - VX, live.z - VZ) < 40 && !live.smashed.birdhat) {
      pay(10, "A bird sat on you. It left a rupee. Rude and fair.", "birdhat");
    }
  });
  return null;
}

function RollStreak() {
  useFrame(() => {
    if (live.rollN >= 3 && live.rollN < 6 && !live.smashed.rollfive) {
      pay(5, "Three rolls. The grass got dizzy first.", "rollfive");
    }
  });
  return null;
}

function SplashHorse() {
  useFrame(() => {
    if (!live.mounted || live.house) return;
    if (live.swim && Math.abs(live.speed) > 8 && !live.smashed.horsesplash) {
      pay(10, "The horse took a bath. You also took a bath.", "horsesplash");
    }
  });
  return null;
}

function BowToOwl() {
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - OWL_AT.x, live.z - OWL_AT.z);
    if (d < 3.2 && live.sit && !live.smashed.bowowl) {
      pay(10, "You sat. The owl nodded first.", "bowowl");
    } else if (d < 3.2) live.hint = "The owl wants a sit.";
  });
  return null;
}

function CountClouds() {
  const t = useRef(0);
  useFrame((_, dt) => {
    if (live.house || live.night || live.rainT > 0) {
      t.current = 0;
      return;
    }
    if (live.stillT > 1 && Math.abs(live.speed) < 0.15 && !live.mounted) {
      t.current += dt;
      if (t.current > 6 && !live.smashed.clouds) {
        pay(8, "You counted clouds. There were seven. One was a sheep.", "clouds");
      }
    } else t.current = 0;
  });
  return null;
}

function TownBalloon() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const x = live.balloonRide ? live.x : live.balloonX;
    const z = live.balloonRide ? live.z : live.balloonZ;
    const y0 = heightAt(x, z);
    const h = live.balloonRide ? live.balloonH : 2.8 + Math.sin(clock.elapsedTime * 0.65) * 0.5;
    if (g.current) g.current.position.set(x, y0 + h, z);
  });
  return (
    <group ref={g} position={[live.balloonX, heightAt(live.balloonX, live.balloonZ) + 2.8, live.balloonZ]}>
      <mesh position={[0, 6.2, 0]} castShadow>
        <sphereGeometry args={[3.6, 14, 12]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
      <mesh position={[0, 7.1, 0.2]}>
        <sphereGeometry args={[1.6, 8, 6]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 5.6, 4]} />
        <meshLambertMaterial color="#3a2a18" />
      </mesh>
      <mesh position={[0.75, 2.7, 0.55]}>
        <cylinderGeometry args={[0.018, 0.018, 5.2, 4]} />
        <meshLambertMaterial color="#3a2a18" />
      </mesh>
      <mesh position={[-0.75, 2.7, 0.55]}>
        <cylinderGeometry args={[0.018, 0.018, 5.2, 4]} />
        <meshLambertMaterial color="#3a2a18" />
      </mesh>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[1.55, 0.7, 1.55]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function BalloonSign() {
  return <N64Sign x={RIDE_AT.x - 5.2} z={RIDE_AT.z + 3.2} />;
}

function GalePilot() {
  return (
    <N64Person
      look={{ ...HERO_LOOK, tunic: "#3a6a88", shirt: "#efe6d4", kit: "vest", pants: "#3a3228", hair: "#c8b090" }}
      x={RIDE_AT.x + 2.15}
      z={RIDE_AT.z + 1.35}
      seed={41}
      stay
      id="gale"
      facing={-0.4}
    />
  );
}

function TownSock() {
  const { x, z } = { x: LAUNDRY_AT.x + 1.6, z: LAUNDRY_AT.z + 1.1 };
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.4) {
      live.hint = "A lonely sock. F";
      if (consumeTalk() && !live.smashed.townsock) {
        pay(5, "Someone lost a sock. The other one is a mountain.", "townsock");
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.12, 0]} rotation={[0.4, 0.6, 0.2]} castShadow>
        <capsuleGeometry args={[0.09, 0.22, 4, 6]} />
        <meshLambertMaterial color="#c45c58" />
      </mesh>
    </group>
  );
}

function WellStomp() {
  useFrame(() => {
    if (live.house || live.mounted) return;
    const d = Math.hypot(live.x - WELL_AT.x, live.z - WELL_AT.z);
    if (d < 1.05 && live.jumpN >= 2 && live.grounded && !live.smashed.welldive) {
      live.tinyT = 9;
      live.x = SPIRE_AT.x + 4;
      live.z = SPIRE_AT.z + 6;
      live.y = heightAt(live.x, live.z) + 1.2;
      live.boostY = 8;
      pay(10, "The well spat you out at the giant fork. Rude. Helpful.", "welldive");
    }
  });
  return null;
}

function HugTree() {
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - ORCHARD_TREE.x, live.z - ORCHARD_TREE.z);
    if (d < 1.7) {
      live.hint = "The tree looks huggable. F";
      if (consumeTalk() && !live.smashed.hugtree) {
        pay(8, "The tree hugged back. Sap and a rupee.", "hugtree");
      }
    }
  });
  return null;
}

function WhistleTown() {
  useFrame(() => {
    if (live.house) return;
    if (Math.hypot(live.x - VX, live.z - VZ) < 48 && live.whistleN >= 5 && !live.smashed.whistletown) {
      pay(10, "Every animal in town looked at you. Then they sat down.", "whistletown");
    }
  });
  return null;
}

function CuccoLookout() {
  useFrame(() => {
    if (live.house || live.carry !== "cucco") return;
    const d = Math.hypot(live.x - LOOK_AT.x, live.z - LOOK_AT.z);
    const y = heightAt(LOOK_AT.x, LOOK_AT.z);
    if (d < 1.5 && live.y > y + 7.4 && !live.smashed.cuccolook) {
      pay(20, "You showed a chicken the vale. It was not ready.", "cuccolook");
    }
  });
  return null;
}

function WrongWay() {
  const g = useRef<THREE.Group>(null);
  const flipped = useRef(false);
  const { x, z } = { x: VX + 18, z: VZ - 42 };
  useFrame(() => {
    if (g.current) g.current.rotation.y = flipped.current ? Math.PI : 0;
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 8 && d > 2.2) flipped.current = true;
    if (d < 1.6) {
      live.hint = "The sign says that way. It is behind you now.";
      if (!live.smashed.wrongway) pay(5, "The sign turned when you weren't looking.", "wrongway");
    }
  });
  return (
    <group ref={g} position={[x, heightAt(x, z), z]}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 1.1, 6]} />
        <meshLambertMaterial color="#5a3a20" />
      </mesh>
      <mesh position={[0, 1.2, 0.04]}>
        <boxGeometry args={[0.7, 0.42, 0.06]} />
        <meshLambertMaterial color="#8a4a28" />
      </mesh>
    </group>
  );
}

function LaundryCape() {
  useFrame(() => {
    if (live.house) return;
    if (live.laundryOn > 0 && Math.abs(live.speed) > 14 && !live.smashed.caprun) {
      pay(8, "A sheet for a cape. You are a laundry hero.", "caprun");
    }
  });
  return null;
}

function ScareHighFive() {
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - SCARECROW_AT.x, live.z - SCARECROW_AT.z);
    if (d < 1.6 && live.swinging && !live.smashed.scarefive) {
      pay(5, "The scarecrow high-fived back. Straw handshake.", "scarefive");
    }
  });
  return null;
}

function YawnEcho() {
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - ECHO_GLADE.x, live.z - ECHO_GLADE.z);
    if (d < 6 && live.stillT > 3.2 && Math.abs(live.speed) < 0.2) {
      live.hint = "Yawn. F";
      if (consumeTalk() && !live.smashed.yawnecho) {
        pay(10, "The glade yawned back. Louder.", "yawnecho");
      }
    }
  });
  return null;
}

function SockPeak() {
  const { x, z } = SOCK_PEAK;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 6) {
      live.hint = "A mountain of socks. F";
      if (consumeTalk() && !live.smashed.sockpeak) {
        pay(20, live.smashed.townsock ? "You found the other sock. It is a mountain." : "Socks. So many socks. One rupee in a toe.", "sockpeak");
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[Math.cos(i * 1.1) * 1.6, 0.5 + (i % 3) * 0.35, Math.sin(i * 1.1) * 1.6]} rotation={[0.4, i, 0.2]} castShadow>
          <capsuleGeometry args={[0.28, 0.7, 4, 6]} />
          <meshLambertMaterial color={i % 2 ? "#c45c58" : "#6a7a88"} />
        </mesh>
      ))}
    </group>
  );
}

function ClockWood() {
  const { x, z } = CLOCK_WOOD;
  const y = heightAt(x, z);
  const hand = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const { t } = gameClock();
    if (hand.current) hand.current.rotation.z = -((t % 12) / 12) * Math.PI * 2;
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4.2) {
      live.hint = "A clock in the woods. It is huge.";
      const h = t % 24;
      if ((h < 0.4 || (h > 11.6 && h < 12.4)) && live.stillT > 1.6 && !live.smashed.clockwood) {
        pay(15, "A stopped clock is right twice a day. You were there.", "clockwood");
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 3.4, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 6.8, 8]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 6.6, 0.2]}>
        <cylinderGeometry args={[1.15, 1.15, 0.18, 16]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh ref={hand} position={[0, 6.6, 0.32]}>
        <boxGeometry args={[0.08, 0.85, 0.06]} />
        <meshLambertMaterial color="#3a2414" />
      </mesh>
    </group>
  );
}

function FlowerSea() {
  const { x, z } = FLOWER_SEA;
  const y = heightAt(x, z);
  const run = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 18 && Math.abs(live.speed) > 8) {
      run.current += dt;
      live.hint = "A sea of flowers. Run.";
      if (run.current > 2.4 && !live.smashed.flowersea) {
        live.flowers += 3;
        pay(15, "You ran a flower ocean. Pollen. A rupee.", "flowersea");
      }
    } else run.current = Math.max(0, run.current - dt);
  });
  return (
    <group position={[x, y, z]}>
      {[-6, -2, 2, 6, 0, -4, 4, -8, 8].map((ox, i) => (
        <mesh key={i} position={[ox, 0.7, ((i * 3) % 11) - 5]} castShadow>
          <coneGeometry args={[0.55, 1.4, 6]} />
          <meshLambertMaterial color={i % 3 === 0 ? "#c45c78" : i % 3 === 1 ? "#e8c04a" : "#7a9ad0"} />
        </mesh>
      ))}
    </group>
  );
}

function SnoreHill() {
  const { x, z } = SNORE_HILL;
  const y = heightAt(x, z);
  const cool = useRef(0);
  const puff = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (puff.current) {
      const on = cool.current > 1.2;
      puff.current.visible = on;
      puff.current.scale.setScalar(on ? 1 + (2.6 - cool.current) * 0.4 : 0.2);
    }
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 10 && live.grounded && cool.current <= 0) {
      cool.current = 2.6;
      live.boostY = 15;
      sfx.jump();
      live.hint = "The hill snored. It launched you.";
      if (!live.smashed.snore) pay(20, "A volcano that only snores.", "snore");
    } else if (d < 18) live.hint = "This hill is asleep. Loudly.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[-1.4, 3.2, 4]} rotation={[0.3, 0, 0]}>
        <sphereGeometry args={[1.4, 7, 5]} />
        <meshLambertMaterial color="#6a5a50" />
      </mesh>
      <mesh position={[1.4, 3.2, 4]} rotation={[0.3, 0, 0]}>
        <sphereGeometry args={[1.4, 7, 5]} />
        <meshLambertMaterial color="#6a5a50" />
      </mesh>
      <mesh ref={puff} position={[0, 7, 3]} visible={false}>
        <sphereGeometry args={[1.1, 6, 5]} />
        <meshBasicMaterial color="#d8d0c4" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}

function RainbowArch() {
  const { x, z } = RAINBOW_ARCH;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4.2 && !live.smashed.rainbowarch) {
      pay(25, "You walked under a rainbow. No pot. Just you.", "rainbowarch");
    } else if (d < 10) live.hint = "A rainbow you can walk under.";
  });
  return (
    <group position={[x, y + 0.2, z]}>
      <mesh>
        <torusGeometry args={[5.2, 0.28, 6, 18, Math.PI]} />
        <meshLambertMaterial color="#c45c58" />
      </mesh>
      <mesh>
        <torusGeometry args={[4.7, 0.24, 6, 18, Math.PI]} />
        <meshLambertMaterial color="#e8c04a" />
      </mesh>
      <mesh>
        <torusGeometry args={[4.25, 0.22, 6, 18, Math.PI]} />
        <meshLambertMaterial color="#5a8a48" />
      </mesh>
      <mesh>
        <torusGeometry args={[3.85, 0.2, 6, 18, Math.PI]} />
        <meshLambertMaterial color="#4a6aaa" />
      </mesh>
    </group>
  );
}

function AntTable() {
  const { x, z } = ANT_TABLE;
  const y = heightAt(x, z);
  const still = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    const on = d < 3.6 && live.y > y + 1.6;
    if (on) {
      still.current += Math.abs(live.speed) < 0.4 ? dt : 0;
      live.hint = "A picnic table for giants. The ants invited you.";
      if (still.current > 2.2 && !live.smashed.anttable) {
        pay(15, "You sat with the ants. They packed a rupee.", "anttable");
      }
    } else still.current = 0;
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.4, 0.22, 3.6]} />
        <meshLambertMaterial color="#8a6a40" />
      </mesh>
      {[
        [-3.2, -1.4],
        [3.2, -1.4],
        [-3.2, 1.4],
        [3.2, 1.4],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.9, pz]} castShadow>
          <boxGeometry args={[0.28, 1.8, 0.28]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      ))}
      <mesh position={[1.2, 2.12, 0.4]}>
        <cylinderGeometry args={[0.35, 0.32, 0.22, 8]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
    </group>
  );
}

function BirdStack() {
  const { x, z } = BIRD_STACK;
  const y = heightAt(x, z);
  const still = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4 && Math.abs(live.speed) < 0.25) {
      still.current += dt;
      live.hint = "Birds in a tower. Don't move.";
      if (still.current > 3.4 && !live.smashed.birdstack) {
        pay(15, "They stacked on you. Then they left a rupee.", "birdstack");
      }
    } else still.current = 0;
  });
  return (
    <group position={[x, y, z]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.sin(i) * 0.12, 0.45 + i * 0.55, Math.cos(i) * 0.1]} castShadow>
          <sphereGeometry args={[0.32 - i * 0.02, 7, 5]} />
          <meshLambertMaterial color={i % 2 ? "#4a4a58" : "#c4c0b0"} />
        </mesh>
      ))}
    </group>
  );
}

function LostShoe() {
  const { x, z } = LOST_SHOE;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4) {
      live.hint = "A shoe the size of a hut. F";
      if (consumeTalk() && !live.smashed.lostshoe) {
        pay(15, "No giant. Just a shoe. You looked inside.", "lostshoe");
      }
    }
  });
  return (
    <group position={[x, y, z]} rotation={[0, 0.6, 0]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[2.8, 1.1, 1.4]} />
        <meshLambertMaterial color="#4a3020" />
      </mesh>
      <mesh position={[1.4, 1.3, 0]} rotation={[0, 0, 0.4]} castShadow>
        <boxGeometry args={[1.6, 1.6, 1.35]} />
        <meshLambertMaterial color="#3a2418" />
      </mesh>
    </group>
  );
}

function GiantFoot() {
  const { x, z } = FOOT_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.6 && !live.smashed.giantfoot) {
      pay(5, "A footprint bigger than you. The vale has bigger feet.", "giantfoot");
    } else if (d < 3.2) live.hint = "Someone huge walked here.";
  });
  return (
    <group position={[x, y + 0.04, z]} rotation={[-Math.PI / 2, 0, 0.4]}>
      <mesh>
        <circleGeometry args={[0.85, 10]} />
        <meshLambertMaterial color="#4a6a38" />
      </mesh>
      {[0.55, 0.7, 0.62, 0.48, 0.38].map((ox, i) => (
        <mesh key={i} position={[ox - 0.15, 0.95 + i * 0.22, 0.01]}>
          <circleGeometry args={[0.16, 8]} />
          <meshLambertMaterial color="#4a6a38" />
        </mesh>
      ))}
    </group>
  );
}

function PushRock() {
  const { x, z } = PUSH_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.5) {
      live.hint = "A rock. It says do not push. F";
      if ((consumeTalk() || (live.rolling && d < 1.1)) && !live.smashed.pushrock) {
        pay(5, "You pushed it. It was a pebble. Rude of the sign.", "pushrock");
      }
    }
  });
  return (
    <mesh position={[x, y + 0.32, z]} castShadow>
      <dodecahedronGeometry args={[0.38, 0]} />
      <meshLambertMaterial color="#7a7a70" />
    </mesh>
  );
}

function HayDog() {
  const x = VX - 16;
  const z = VZ + 18;
  const y = heightAt(x, z);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house || live.mounted) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.5 && live.y > y + 0.9 && cool.current <= 0) {
      cool.current = 0.8;
      live.boostY = 10;
      sfx.jump();
      live.hint = "The hay snored. Then it bounced you.";
      if (!live.smashed.haydog) pay(5, "A dog in the hay. Best trampoline.", "haydog");
    } else if (d < 2.4) live.hint = "The hay is breathing.";
  });
  return (
    <group position={[x, y + 0.7, z]}>
      <mesh rotation={[0.2, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.28, 7, 5]} />
        <meshLambertMaterial color="#c4a06a" />
      </mesh>
      <mesh position={[0.28, 0.06, 0.08]} rotation={[0.3, 0.2, 0.1]}>
        <sphereGeometry args={[0.16, 6, 5]} />
        <meshLambertMaterial color="#c4a06a" />
      </mesh>
    </group>
  );
}

function FenceSong() {
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house || !live.rolling) return;
    const d = Math.hypot(live.x - VX, live.z - VZ);
    if (d > 28 && d < 46 && cool.current <= 0 && !live.smashed.fencesong) {
      cool.current = 1;
      sfx.chime();
      pay(5, "The fence is a xylophone if you roll it.", "fencesong");
    }
  });
  return null;
}

function MillFan() {
  const { x, z } = MILL_AT;
  const y = heightAt(x, z);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house || live.mounted) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 3.6 && d > 1.2 && cool.current <= 0) {
      const dx = live.x - x;
      const dz = live.z - z;
      const n = Math.hypot(dx, dz) || 1;
      live.knock = { vx: (dx / n) * 14, vz: (dz / n) * 14, t: 0.42 };
      live.boostY = 5;
      cool.current = 1.6;
      live.hint = "The mill blew you.";
      if (!live.smashed.millfan) pay(8, "The mill is a fan. You are a leaf.", "millfan");
    } else if (d < 5.5) live.hint = "The mill is very windy.";
  });
  return (
    <group position={[x, y + 6.4, z]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[Math.cos(i * 1.57) * 1.1, Math.sin(i * 1.57) * 1.1, 0.2]}>
          <boxGeometry args={[2.2, 0.35, 0.08]} />
          <meshLambertMaterial color="#efe6d4" />
        </mesh>
      ))}
    </group>
  );
}

function AcornWait() {
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - ORCHARD_TREE.x, live.z - ORCHARD_TREE.z);
    if (d < 2.2 && live.stillT > 5.5 && Math.abs(live.speed) < 0.2 && !live.smashed.acorn) {
      pay(8, "An acorn bonked you. A rupee was inside.", "acorn");
    }
  });
  return null;
}

function PondApple() {
  useFrame(() => {
    if (live.house) return;
    if (live.swim && live.appleAte >= 1 && Math.hypot(live.x - POND.x, live.z - POND.z) < 12 && !live.smashed.pondapple) {
      pay(5, "A fish ate your apple thought. It paid rent.", "pondapple");
    }
  });
  return null;
}

function BreadHill() {
  const { x, z } = BREAD_HILL;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 8) {
      live.hint = "This hill smells like toast. F";
      if (consumeTalk() && !live.smashed.bread) {
        pay(20, "A loaf the size of a hill. No butter. A rupee.", "bread");
      }
    }
  });
  return (
    <group position={[x, y + 4, z]}>
      <mesh rotation={[0.15, 0.4, 0.08]} castShadow>
        <capsuleGeometry args={[3.4, 6.2, 6, 10]} />
        <meshLambertMaterial color="#c4a06a" />
      </mesh>
    </group>
  );
}

function EdgeMail() {
  const { x, z } = EDGE_MAIL;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.4) {
      live.hint = "A mailbox at the end of the vale. F";
      if (consumeTalk() && !live.smashed.edgemail) {
        pay(25, "A note: 'you made it. turn around.'", "edgemail");
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 1.4, 6]} />
        <meshLambertMaterial color="#5a3a20" />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <boxGeometry args={[0.55, 0.38, 0.32]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
    </group>
  );
}

function StairNone() {
  const { x, z } = STAIR_NONE;
  const y = heightAt(x, z);
  const n = useRef(0);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.8 && live.y > y + 3.5 && !live.smashed.stairnone) {
      n.current += 1;
      pay(15, "Stairs to nowhere. The view is the point.", "stairnone");
    } else if (d < 5) live.hint = "Stairs. They stop.";
  });
  return (
    <group position={[x, y, z]}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <mesh key={i} position={[0, 0.18 + i * 0.42, -i * 0.55]} receiveShadow>
          <boxGeometry args={[1.8, 0.2, 0.7]} />
          <meshLambertMaterial color="#8a8a82" />
        </mesh>
      ))}
    </group>
  );
}

function ChessPiece() {
  const { x, z } = CHESS_AT;
  const p = useRef({ x, z });
  const g = useRef<THREE.Group>(null);
  const home = { x, z };
  useFrame((_, dt) => {
    if (live.house) return;
    const c = p.current;
    const d = Math.hypot(live.x - c.x, live.z - c.z);
    if (d < 1.8 && Math.abs(live.speed) > 2.4) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      c.x += fx * 2.8 * dt;
      c.z += fz * 2.8 * dt;
    }
    const dx = Math.abs(c.x - home.x);
    const dz = Math.abs(c.z - home.z);
    const L = (dx > 3.2 && dz > 1.4 && dx < 8) || (dz > 3.2 && dx > 1.4 && dz < 8);
    if (L) {
      pay(18, "The knight moved like a knight. Check.", "chess");
      live.listen = "The knight moved like a knight. Check.";
    }
    if (g.current) g.current.position.set(c.x, heightAt(c.x, c.z), c.z);
    if (d < 2.4) live.listen = live.listen || "A knight. Push it. Knights move in an L.";
  });
  return (
    <group ref={g} position={[x, heightAt(x, z), z]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.9, 1.15, 2.2, 8]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0, 2.8, 0]} castShadow>
        <sphereGeometry args={[0.85, 8, 6]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0.55, 3.5, 0.2]} rotation={[0.3, 0.2, 0.4]} castShadow>
        <boxGeometry args={[0.35, 1.1, 0.28]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}

function DuckLake() {
  const { x, z } = DUCK_LAKE;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    addTrapSpot(x, z, 1.6, 1.35);
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.8 && live.y > y + 1.1 && !live.grounded) {
      live.boostY = 14;
      pay(20, "You bounced on the beak. Squeak.", "ducklake");
      live.listen = "You bounced on the beak. Squeak.";
    }
    if (d < 4) live.listen = live.listen || "A duck the size of a lake. Climb it. Bounce.";
  }, -2);
  return (
    <group position={[x, y + 0.8, z]}>
      <mesh castShadow>
        <sphereGeometry args={[1.6, 8, 6]} />
        <meshLambertMaterial color="#e8c04a" />
      </mesh>
      <mesh position={[1.4, 0.7, 0]} rotation={[0.2, 0, 0.3]} castShadow>
        <sphereGeometry args={[0.7, 7, 5]} />
        <meshLambertMaterial color="#e8c04a" />
      </mesh>
      <mesh position={[2.0, 0.75, 0]} rotation={[0, 0, 0.4]}>
        <coneGeometry args={[0.18, 0.55, 5]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
    </group>
  );
}

function DoorField() {
  const { x, z } = DOOR_FIELD;
  const y = heightAt(x, z);
  const garden = { x: x, z: z - 4.4 };
  const gy = heightAt(garden.x, garden.z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 0.7 && live.z < z) {
      pay(16, "You walked through. A garden nobody planted.", "doorfield");
      live.listen = "You walked through. A garden nobody planted.";
    }
    if (d < 2.2 && live.z > z) live.listen = live.listen || "A door. No house. Walk through.";
  });
  return (
    <group>
      <group position={[x, y, z]}>
        <mesh position={[0, 1.45, 0]} castShadow>
          <boxGeometry args={[1.15, 2.9, 0.12]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
        <mesh position={[0.38, 1.35, 0.08]}>
          <sphereGeometry args={[0.07, 6, 5]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      </group>
      <mesh position={[garden.x, gy + 0.04, garden.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.2, 10]} />
        <meshLambertMaterial color="#4a8a38" />
      </mesh>
      <mesh position={[garden.x + 0.4, gy + 0.35, garden.z]}>
        <sphereGeometry args={[0.28, 6, 5]} />
        <meshLambertMaterial color="#c45c78" />
      </mesh>
    </group>
  );
}

function YouCompass() {
  const { x, z } = YOU_COMPASS;
  const y = heightAt(x, z);
  const needle = useRef<THREE.Group>(null);
  const last = useRef(0);
  const acc = useRef(0);
  useFrame(() => {
    if (needle.current) needle.current.rotation.y = live.smashed.youcompass ? 0 : Math.atan2(live.x - x, live.z - z);
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    const a = Math.atan2(live.x - x, live.z - z);
    if (d > 2.2 && d < 5.5 && Math.abs(live.speed) > 2) {
      let da = a - last.current;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      acc.current += da;
      if (Math.abs(acc.current) > Math.PI * 2) {
        pay(15, "You walked around it. Now it points north. For real.", "youcompass");
        live.listen = "You walked around it. Now it points north. For real.";
      }
    }
    last.current = a;
    if (d < 6 && !live.smashed.youcompass) live.listen = live.listen || "It points at you. Walk around it.";
  });
  return (
    <group position={[x, y + 0.2, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.4, 16]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <group ref={needle}>
        <mesh position={[0, 0.12, 0.55]}>
          <coneGeometry args={[0.12, 1.1, 5]} />
          <meshLambertMaterial color="#c45c48" />
        </mesh>
      </group>
    </group>
  );
}

function KickCone() {
  const pos = useRef({ x: CONE_AT.x, z: CONE_AT.z, vx: 0, vz: 0 });
  const g = useRef<THREE.Group>(null);
  const kicked = useRef(false);
  useFrame((_, dt) => {
    if (!g.current) return;
    const p = pos.current;
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (!live.house && !live.mounted && Math.abs(live.speed) > 2.4 && d < 0.85) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      p.vx = fx * Math.min(14, 5 + Math.abs(live.speed));
      p.vz = fz * Math.min(14, 5 + Math.abs(live.speed));
      sfx.thud();
      live.hint = "A pinecone!";
      if (!kicked.current && !live.smashed.kickcone) {
        kicked.current = true;
        pay(5, "You kicked a pinecone. It had a rupee in it. Why.", "kickcone");
      }
    }
    p.x += p.vx * dt;
    p.z += p.vz * dt;
    p.vx *= Math.exp(-dt * 1.4);
    p.vz *= Math.exp(-dt * 1.4);
    g.current.position.set(p.x, heightAt(p.x, p.z) + 0.16, p.z);
  });
  return (
    <group ref={g} position={[CONE_AT.x, heightAt(CONE_AT.x, CONE_AT.z) + 0.16, CONE_AT.z]}>
      <mesh rotation={[0.4, 0.2, 0]} castShadow>
        <coneGeometry args={[0.16, 0.38, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function SpinTown() {
  const acc = useRef(0);
  const last = useRef(0);
  useFrame(() => {
    if (live.house || live.mounted || live.balloonRide) {
      acc.current = 0;
      last.current = live.yaw;
      return;
    }
    if (Math.abs(live.speed) > 4.5) {
      acc.current = 0;
      last.current = live.yaw;
      return;
    }
    let d = live.yaw - last.current;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    acc.current += d;
    last.current = live.yaw;
    if (Math.abs(acc.current) > Math.PI * 2.15 && !live.smashed.spintown) {
      live.dizzyT = 2.2;
      pay(5, "You spun in place. The vale spun with you.", "spintown");
    }
  });
  return null;
}

function TownFlock() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.08;
    if (!g.current) return;
    g.current.position.x = VX + Math.sin(t) * 90;
    g.current.position.z = VZ - 220 + Math.cos(t * 0.7) * 50;
    g.current.position.y = 22 + Math.sin(t * 1.4) * 1.2;
  });
  return (
    <group ref={g} position={[VX, 14, VZ - 8]}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[(i % 3) * 1.6 - 1.6, (i % 2) * 0.7, -i * 1.1]}>
          <sphereGeometry args={[0.16, 6, 5]} />
          <meshLambertMaterial color="#2a2420" />
        </mesh>
      ))}
    </group>
  );
}

function PianoHill() {
  const { x, z } = PIANO_AT;
  const y = heightAt(x, z);
  const step = useRef(0);
  useFrame(() => {
    if (live.house) return;
    addTrapSpot(x, z, 1.6, 0.72);
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.7 && live.y > y + 0.4) {
      const key = live.x < x - 0.5 ? 1 : live.x > x + 0.5 ? 3 : 2;
      if (key === step.current + 1) {
        step.current = key;
        sfx.ok();
        if (step.current === 3) {
          pay(20, "Left, middle, right. The funny key was the last one.", "piano");
          live.listen = "Left, middle, right. The funny key was the last one.";
        } else live.listen = "A note. Keep walking the keys.";
      } else if (key !== step.current) {
        if (key === 1) step.current = 1;
      }
    }
    if (d < 4.2 && step.current < 3) live.listen = live.listen || "A piano. Walk the keys. Left to right.";
  }, -2);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[3.4, 0.7, 1.4]} />
        <meshLambertMaterial color="#2a2420" />
      </mesh>
      <mesh position={[0, 0.92, 0.05]}>
        <boxGeometry args={[3.1, 0.08, 1.05]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}

function GiantSpoon() {
  const { x, z } = SPOON_AT;
  const y = heightAt(x, z);
  const filled = useRef(false);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.4 && (live.wetT > 0.8 || live.bucket > 0) && !filled.current) {
      filled.current = true;
      pay(15, "You filled the spoon. A giant might come. Might.", "spoon");
      live.listen = "You filled the spoon. A giant might come. Might.";
    }
    if (d < 3.6 && !filled.current) live.listen = live.listen || "A giant spoon. It is dry. Water would fill it.";
  });
  return (
    <group position={[x, y + 0.4, z]} rotation={[0.4, 0.8, -0.2]}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.85, 8, 6]} />
        <meshLambertMaterial color="#c0c4c8" />
      </mesh>
      <mesh position={[0, 0.15, -2.4]} rotation={[1.2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 4.2, 6]} />
        <meshLambertMaterial color="#c0c4c8" />
      </mesh>
    </group>
  );
}

function PaperBoat() {
  const { x, z } = BOAT_AT;
  const pos = useRef({ x, z });
  const g = useRef<THREE.Group>(null);
  const on = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    const p = pos.current;
    const y = heightAt(p.x, p.z) + 0.2;
    addTrapSpot(p.x, p.z, 0.9, 0.35);
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 1.15 && live.grounded) on.current = true;
    if (on.current && (d > 1.8 || !live.grounded)) on.current = false;
    if (on.current && Math.abs(live.speed) > 1.4) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      p.x += fx * 3.6 * dt;
      p.z += fz * 3.6 * dt;
      live.x = p.x;
      live.z = p.z;
      pay(16, "The paper boat went. It should not float this well.", "paperboat");
      live.listen = "The paper boat went. Jump off when you want.";
    }
    if (g.current) g.current.position.set(p.x, y + Math.sin(live.playT * 1.4) * 0.08, p.z);
    if (d < 2.2 && !on.current) live.listen = live.listen || "A paper boat. Stand on it. Walk.";
  }, -2);
  return (
    <group ref={g} position={[x, heightAt(x, z) + 0.25, z]}>
      <mesh rotation={[0.15, 0.4, 0]} castShadow>
        <coneGeometry args={[0.9, 0.7, 3]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}

function SleepCat() {
  const { x, z } = CAT_AT;
  const y = heightAt(x, z);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house || live.mounted) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4.5 && live.stillT > 1.4 && !live.smashed.sleepcat) {
      pay(12, "You sat. It purred. The whole hill purred.", "sleepcat");
      live.listen = "You sat. It purred. The whole hill purred.";
    } else if (d < 4.5 && live.y > y + 1.1 && cool.current <= 0) {
      cool.current = 1.1;
      live.boostY = 12;
      sfx.jump();
      pay(20, "A cat the size of a hill. Best bounce.", "sleepcatbounce");
      live.listen = "The hill bounced you.";
    } else if (d < 7) live.listen = live.listen || "This hill is breathing. Sit, or jump.";
  });
  return (
    <group position={[x, y + 2.2, z]}>
      <mesh rotation={[0.15, 0.6, 0]} castShadow>
        <sphereGeometry args={[2.4, 8, 6]} />
        <meshLambertMaterial color="#c4a06a" />
      </mesh>
      <mesh position={[2.1, 0.6, 0.4]} rotation={[0.2, 0.3, 0.1]} castShadow>
        <sphereGeometry args={[1.1, 7, 5]} />
        <meshLambertMaterial color="#c4a06a" />
      </mesh>
      <mesh position={[2.4, 1.5, 0.2]} rotation={[0, 0, 0.4]}>
        <coneGeometry args={[0.22, 0.7, 4]} />
        <meshLambertMaterial color="#c4a06a" />
      </mesh>
    </group>
  );
}

function WishBone() {
  const { x, z } = WISH_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.4 && live.slash) {
      pay(15, "It snapped. You got the bigger half.", "wishbone");
      live.listen = "It snapped. You got the bigger half. That is the rule.";
    } else if (d < 2.4) live.listen = live.listen || "A wishbone. Two people pull. Or a sword.";
  });
  return (
    <group position={[x, y + 0.4, z]} rotation={[0.2, 0.4, 0]}>
      <mesh position={[-0.45, 0.4, 0]} rotation={[0, 0, 0.5]} castShadow>
        <capsuleGeometry args={[0.12, 1.1, 4, 6]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0.45, 0.4, 0]} rotation={[0, 0, -0.5]} castShadow>
        <capsuleGeometry args={[0.12, 1.1, 4, 6]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}

function TownCart() {
  const { x, z } = CART_AT;
  const pos = useRef({ x, z });
  const g = useRef<THREE.Group>(null);
  const on = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    const p = pos.current;
    const y = heightAt(p.x, p.z);
    addTrapSpot(p.x, p.z, 0.8, 0.42);
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (d < 1.2 && live.grounded) on.current = true;
    if (on.current && (d > 1.8 || !live.grounded)) on.current = false;
    if (on.current && live.sprinting) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      p.x += fx * 6.2 * dt;
      p.z += fz * 6.2 * dt;
      live.x = p.x;
      live.z = p.z;
      pay(8, "The cart rolled. The vale is that way.", "towncart");
      live.listen = "The cart rolled. Stop running to hop off.";
    }
    if (g.current) g.current.position.set(p.x, y, p.z);
    if (d < 1.7 && !on.current) live.listen = live.listen || "A cart. Climb in. Run.";
  }, -2);
  return (
    <group ref={g} position={[x, heightAt(x, z), z]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.35, 0.45, 0.95]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[-0.48, 0.22, 0.42]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.12, 8]} />
        <meshLambertMaterial color="#3a2a18" />
      </mesh>
      <mesh position={[0.48, 0.22, 0.42]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.12, 8]} />
        <meshLambertMaterial color="#3a2a18" />
      </mesh>
    </group>
  );
}

function ShadowWave() {
  useFrame(() => {
    if (live.house || live.balloonRide || live.talking || live.nearNpc || live.mounted) return;
    if (live.stillT > 1.6 && live.dusk > 0.35 && Math.abs(live.speed) < 0.2) {
      pay(5, "Your shadow got long. It pointed at the tree. Then at the keep.", "shadowwave");
      live.listen = "Your shadow got long. It pointed at the tree. Then at the keep.";
    }
  });
  return null;
}

function TeaCup() {
  const { x, z } = CUP_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    addTrapSpot(x, z, 1.1, 1.15);
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.4 && live.y > y + 0.8) {
      pay(20, "You sat in a giant cup of cold tea. A rupee sank past your knee.", "teacup");
      live.listen = "You sat in a giant cup of cold tea. A rupee sank past your knee.";
    } else if (d < 2.2 && live.wetT > 0.6) {
      pay(12, "You poured. Now it is tea. Sort of.", "teacupfill");
      live.listen = "You poured. Now it is tea. Sort of.";
    } else if (d < 3.6) live.listen = live.listen || "A teacup for a giant. Climb in. Or fill it.";
  }, -2);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.25, 2.0, 10]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[1.7, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.55, 0.12, 6, 10]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}

function FarUmbrella() {
  const { x, z } = UMBRELLA_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4.5 && !live.smashed.umbrella) {
      live.glideT = Math.max(live.glideT, 8);
      live.hint = "The umbrella caught the wind.";
      pay(15, "You stood under it. Now you float a little.", "umbrella");
    } else if (d < 8) live.hint = "A picnic umbrella the size of a house.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 5.6, 5]} />
        <meshLambertMaterial color="#5a3a20" />
      </mesh>
      <mesh position={[0, 5.6, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[3.2, 1.6, 8]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
    </group>
  );
}

function GrassSlide() {
  const { x, z } = SLIDE_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.mounted) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 6 && live.y > y + 4) {
      live.knock = { vx: 0, vz: 18, t: 0.7 };
      pay(15, "A hill that is a slide. No line.", "grassslide");
      live.listen = "Weeeee.";
    } else if (d < 10) live.listen = live.listen || "This hill is suspiciously smooth. Climb up. Slide.";
  });
  return (
    <mesh position={[x, y + 3.2, z]} rotation={[0.55, 0, 0]} castShadow>
      <boxGeometry args={[4.4, 0.35, 9.2]} />
      <meshLambertMaterial color="#7a9a48" />
    </mesh>
  );
}

function GiantHat() {
  const { x, z } = HAT_FAR;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.2 && consumeTalk()) {
      live.hat = "giant";
      pay(15, "You put it on. The world got smaller.", "gianthat");
      live.listen = "You put it on. The world got smaller.";
    } else if (d < 3.4) live.listen = live.listen || "A hat with nobody in it. Try it on.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <circleGeometry args={[2.2, 12]} />
        <meshLambertMaterial color="#3a2a18" />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[1.05, 1.2, 1.7, 8]} />
        <meshLambertMaterial color="#3a2a18" />
      </mesh>
    </group>
  );
}

function WhoopeeTown() {
  const { x, z } = WHOOP_AT_TOWN;
  const y = heightAt(x, z);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house || live.balloonRide || live.mounted) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 0.85 && live.grounded && cool.current <= 0) {
      cool.current = 1.2;
      sfx.thud();
      live.boostY = 7;
      live.hint = "Pfffft.";
      if (!live.smashed.whoopee) pay(5, "A whoopee cushion. Classic.", "whoopee");
    }
  });
  return (
    <mesh position={[x, y + 0.06, z]} rotation={[-Math.PI / 2, 0, 0.3]}>
      <circleGeometry args={[0.42, 10]} />
      <meshLambertMaterial color="#c45c48" />
    </mesh>
  );
}

function GiantSandwich() {
  const { x, z } = SANDWICH_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4) {
      live.hint = "A sandwich the size of a shed. F";
      if (consumeTalk() && !live.smashed.sandwich) {
        pay(20, "Nobody claimed it. You took a rupee from the pickle.", "sandwich");
      }
    }
  });
  return (
    <group position={[x, y + 0.8, z]} rotation={[0, 0.5, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[3.2, 0.35, 2.2]} />
        <meshLambertMaterial color="#c4a06a" />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[3.0, 0.28, 2.0]} />
        <meshLambertMaterial color="#6a8a40" />
      </mesh>
      <mesh position={[0, 1.22, 0]} castShadow>
        <boxGeometry args={[3.2, 0.35, 2.2]} />
        <meshLambertMaterial color="#c4a06a" />
      </mesh>
    </group>
  );
}

function BounceCastle() {
  const { x, z } = BOUNCE_HOUSE;
  const y = heightAt(x, z);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house || live.mounted || live.balloonRide) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 3.2 && cool.current <= 0) {
      cool.current = 0.55;
      live.boostY = 14;
      sfx.jump();
      live.hint = "A castle you are supposed to bounce in.";
      if (!live.smashed.bouncecastle) pay(15, "The walls are air. The rupee was real.", "bouncecastle");
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[4.2, 0.35, 4.2]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.9, 2.2, 0]}>
          <boxGeometry args={[0.35, 2.2, 4.0]} />
          <meshLambertMaterial color="#efe6d4" />
        </mesh>
      ))}
    </group>
  );
}

function LostCard() {
  const { x, z } = CARD_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.8) {
      live.hint = "A library card. In a field. F";
      if (consumeTalk() && !live.smashed.lostcard) {
        pay(10, "Due date: yesterday. Fine: one rupee. You kept it.", "lostcard");
      }
    }
  });
  return (
    <mesh position={[x, y + 0.05, z]} rotation={[-Math.PI / 2, 0, 0.4]}>
      <planeGeometry args={[0.7, 0.42]} />
      <meshLambertMaterial color="#efe6d4" />
    </mesh>
  );
}

const BITS: { id: string; x: number; z: number; kind: string; hint: string; say: string; n: number }[] = [
  { id: "kettle", x: VX + 22, z: VZ + 28, kind: "pot", hint: "A kettle. F", say: "Still hot. Nobody is making tea.", n: 5 },
  { id: "pieslice", x: VX + 4.2, z: VZ - 22, kind: "cake", hint: "A pie on the road. F", say: "South is dessert. Then a fork.", n: 5 },
  { id: "roadnote", x: VX + 1.5, z: VZ - 48, kind: "book", hint: "A note. F", say: "It says: keep walking. the fork is bigger.", n: 5 },
  { id: "frogstool", x: VX + 8, z: VZ - 88, kind: "drum", hint: "A stool. F", say: "A frog used to live here. It moved.", n: 5 },
  { id: "yarn", x: VX - 3, z: VZ - 140, kind: "hat", hint: "A ball of yarn. F", say: "The cat hill will want this.", n: 5 },
  { id: "jam", x: VX + 9, z: VZ - 190, kind: "pot", hint: "A jam jar. F", say: "The fork is for salad. This is jam. Chaos.", n: 8 },
  { id: "boot2", x: VX - 24, z: VZ + 22, kind: "boot", hint: "Another boot. F", say: "Its twin is a mountain.", n: 5 },
  { id: "cake", x: VX + 36, z: VZ - 22, kind: "cake", hint: "A cake in the dirt. F", say: "One slice missing. A rupee instead.", n: 5 },
  { id: "fishdry", x: VX - 38, z: VZ - 18, kind: "fish", hint: "A fish. No water. F", say: "It asked for the pond. You gave a rupee.", n: 5 },
  { id: "chair2", x: VX + 8, z: VZ + 40, kind: "chair", hint: "A chair facing nothing. F", say: "The view is the joke.", n: 5 },
  { id: "mug", x: 160, z: -40, kind: "pot", hint: "A mug as big as your head. F", say: "Cold cocoa. A rupee stuck to it.", n: 8 },
  { id: "keygrass", x: -180, z: 70, kind: "key", hint: "A key. F", say: "It opens nothing. You kept it anyway.", n: 8 },
  { id: "book", x: 90, z: 170, kind: "book", hint: "A book. Wet. F", say: "Page one: 'turn around.'", n: 8 },
  { id: "wheel", x: 260, z: -160, kind: "wheel", hint: "A wagon wheel. F", say: "The wagon is still missing.", n: 8 },
  { id: "hat2", x: -240, z: -200, kind: "hat", hint: "A hat on a stick. F", say: "The stick was proud of it.", n: 8 },
  { id: "drum", x: 420, z: 80, kind: "drum", hint: "A drum. F", say: "You hit it. A rupee bounced out.", n: 8 },
  { id: "lamp", x: -380, z: 240, kind: "lamp", hint: "A lamp. Daytime. F", say: "It still wanted to help.", n: 8 },
  { id: "sock2", x: 620, z: -420, kind: "boot", hint: "A sock on a rock. F", say: "The rock did not ask for this.", n: 10 },
  { id: "spoon2", x: -560, z: -380, kind: "spoon", hint: "A tiny spoon. F", say: "For a very polite ant.", n: 10 },
  { id: "bell2", x: 780, z: 260, kind: "bell", hint: "A bell in a field. F", say: "Ding. The vale heard you.", n: 10 },
  { id: "fish2", x: -720, z: 480, kind: "fish", hint: "Another fish. F", say: "They are organizing.", n: 10 },
  { id: "cake2", x: 1100, z: -200, kind: "cake", hint: "Picnic cake. No picnic. F", say: "You were the picnic.", n: 12 },
  { id: "chair3", x: -980, z: 620, kind: "chair", hint: "A chair on a hill. F", say: "Someone watched the vale from here.", n: 12 },
  { id: "key2", x: 1400, z: 400, kind: "key", hint: "A rusty key. F", say: "The lock moved to another county.", n: 12 },
  { id: "wheel2", x: -1300, z: -700, kind: "wheel", hint: "Half a wheel. F", say: "The other half is a moon.", n: 12 },
  { id: "book2", x: 1680, z: -900, kind: "book", hint: "A dictionary. F", say: "It only has the word 'vale'.", n: 15 },
  { id: "lamp2", x: -1600, z: 1100, kind: "lamp", hint: "A streetlamp. No street. F", say: "Optimistic.", n: 15 },
  { id: "drum2", x: 2100, z: 700, kind: "drum", hint: "A big drum. F", say: "Thunder answered. Rude.", n: 15 },
  { id: "hat3", x: -2000, z: -1100, kind: "hat", hint: "A wizard hat. F", say: "No wizard. Just you.", n: 15 },
];

function BitMesh({ kind }: { kind: string }) {
  if (kind === "boot") {
    return (
      <mesh position={[0, 0.22, 0]} rotation={[0.3, 0.4, 0]} castShadow>
        <boxGeometry args={[0.28, 0.22, 0.55]} />
        <meshLambertMaterial color="#4a3020" />
      </mesh>
    );
  }
  if (kind === "cake") {
    return (
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.4, 0.28, 8]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    );
  }
  if (kind === "fish") {
    return (
      <mesh position={[0, 0.18, 0]} rotation={[0.2, 0.5, 0.3]} castShadow>
        <sphereGeometry args={[0.22, 6, 5]} />
        <meshLambertMaterial color="#6a8aaa" />
      </mesh>
    );
  }
  if (kind === "chair") {
    return (
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.42, 0.12, 0.42]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    );
  }
  if (kind === "key") {
    return (
      <mesh position={[0, 0.12, 0]} rotation={[0.4, 0.2, 0.6]}>
        <boxGeometry args={[0.08, 0.08, 0.42]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    );
  }
  if (kind === "book") {
    return (
      <mesh position={[0, 0.08, 0]} rotation={[-0.2, 0.4, 0]}>
        <boxGeometry args={[0.34, 0.08, 0.26]} />
        <meshLambertMaterial color="#6a3040" />
      </mesh>
    );
  }
  if (kind === "wheel") {
    return (
      <mesh position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.1, 8]} />
        <meshLambertMaterial color="#5a3a20" />
      </mesh>
    );
  }
  if (kind === "hat") {
    return (
      <mesh position={[0, 0.35, 0]} castShadow>
        <coneGeometry args={[0.28, 0.55, 6]} />
        <meshLambertMaterial color="#3a2a18" />
      </mesh>
    );
  }
  if (kind === "drum") {
    return (
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.4, 8]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
    );
  }
  if (kind === "lamp") {
    return (
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 1.4, 5]} />
        <meshLambertMaterial color="#4a4a48" />
      </mesh>
    );
  }
  if (kind === "bell") {
    return (
      <mesh position={[0, 0.4, 0]} castShadow>
        <coneGeometry args={[0.22, 0.4, 6]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    );
  }
  if (kind === "spoon") {
    return (
      <mesh position={[0, 0.2, 0]} rotation={[0.8, 0.2, 0]}>
        <capsuleGeometry args={[0.06, 0.4, 3, 5]} />
        <meshLambertMaterial color="#c0c4c8" />
      </mesh>
    );
  }
  return (
    <mesh position={[0, 0.28, 0]} castShadow>
      <cylinderGeometry args={[0.22, 0.18, 0.32, 8]} />
      <meshLambertMaterial color="#8a8a82" />
    </mesh>
  );
}

function WhimsyBits() {
  return (
    <group>
      {BITS.map((b) => (
        <Bit key={b.id} bit={b} />
      ))}
    </group>
  );
}

function Bit({ bit }: { bit: (typeof BITS)[number] }) {
  const y = heightAt(bit.x, bit.z);
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc || live.balloonRide) return;
    const d = Math.hypot(live.x - bit.x, live.z - bit.z);
    if (d < 1.6) {
      live.hint = bit.hint;
      if (consumeTalk() && !live.smashed[bit.id]) pay(bit.n, bit.say, bit.id);
    }
  });
  return (
    <group position={[bit.x, y, bit.z]}>
      <BitMesh kind={bit.kind} />
    </group>
  );
}

function GiantFork() {
  const { x, z } = SPIRE_AT;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 4.5) {
      live.hint = live.climbing === "spire" ? "Up the fork." : "A fork the size of a tower. Climb.";
      if (d < 2.2 && !live.smashed.spire && live.y > y + 20) {
        pay(20, "You climbed a fork. Dinner is canceled. The vale is huge.", "spire");
      }
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 22, 0]} castShadow>
        <cylinderGeometry args={[1.15, 1.6, 44, 8]} />
        <meshLambertMaterial color="#c0c4c8" />
      </mesh>
      <mesh position={[-1.4, 48, 0]} rotation={[0, 0, 0.18]} castShadow>
        <boxGeometry args={[0.7, 16, 0.55]} />
        <meshLambertMaterial color="#c0c4c8" />
      </mesh>
      <mesh position={[1.4, 48, 0]} rotation={[0, 0, -0.18]} castShadow>
        <boxGeometry args={[0.7, 16, 0.55]} />
        <meshLambertMaterial color="#c0c4c8" />
      </mesh>
      <mesh position={[0, 42, 0]} castShadow>
        <boxGeometry args={[3.2, 1.1, 0.7]} />
        <meshLambertMaterial color="#c0c4c8" />
      </mesh>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
        <mesh key={i} position={[0, 2 + i * 3.6, 2.05]}>
          <boxGeometry args={[0.7, 0.12, 0.18]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
      ))}
    </group>
  );
}

function SouthKid() {
  const g = useRef<THREE.Group>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    const u = (t.current * 0.08) % 1;
    const z = VZ + 20 - u * 360;
    const x = VX + 4 + Math.sin(t.current * 0.7) * 1.4;
    const y = heightAt(x, z);
    if (g.current) g.current.position.set(x, y, z);
    if (live.house || live.balloonRide) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.2) {
      live.hint = "He will not stop running. F";
      if (consumeTalk() && !live.smashed.southkid) {
        pay(5, "He said 'the fork!' and kept going.", "southkid");
      }
    }
  });
  return (
    <group ref={g} position={[VX + 4, 0, VZ + 20]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.55, 4, 6]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
      <mesh position={[0, 1.22, 0]}>
        <sphereGeometry args={[0.2, 6, 5]} />
        <meshLambertMaterial color="#c49674" />
      </mesh>
    </group>
  );
}

function SouthArrow() {
  const x = VX + 3;
  const z = VZ + 10;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.balloonRide || live.talking) return;
    if (live.playT < 16 && Math.hypot(live.x - VX, live.z - VZ) < 40) {
      live.hint = "South. Giant fork. Balloon on the way if you want the sky.";
    }
  });
  return (
    <group position={[x, y + 0.08, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.55, 1.8]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[0, 0.02, -1.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.42, 0.7, 3]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function CheeseWheel() {
  const g = useRef<THREE.Group>(null);
  const pos = useRef({ x: CHEESE_AT.x, z: CHEESE_AT.z });
  const ang = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    if (live.wheelT > 0) {
      live.wheelT -= dt;
      pos.current.z -= 14 * dt;
      pos.current.x += Math.sin(live.playT * 2) * dt * 1.4;
      live.x = pos.current.x;
      live.z = pos.current.z;
      live.y = heightAt(live.x, live.z) + 1.05;
      live.speed = 14;
      live.yaw = 0;
      live.hint = "Cheese taxi. Jump hops off.";
      if (live.wheelT <= 0) {
        live.boostY = 4;
        live.hint = "You smell like lunch.";
        if (!live.smashed.cheese) pay(12, "You rode a cheese to the fork.", "cheese");
      }
    } else {
      const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
      if (d < 1.6 && !live.mounted && !live.balloonRide) {
        live.hint = "A wheel of cheese. Hop on. F";
        if (consumeTalk()) {
          live.wheelT = 8;
          sfx.ok();
        }
      }
    }
    ang.current += dt * (live.wheelT > 0 ? 8 : 1.2);
    if (g.current) {
      g.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z) + 0.7, pos.current.z);
      g.current.rotation.x = ang.current;
    }
  });
  return (
    <group ref={g} position={[CHEESE_AT.x, heightAt(CHEESE_AT.x, CHEESE_AT.z) + 0.7, CHEESE_AT.z]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.32, 12]} />
        <meshLambertMaterial color="#e8c85a" />
      </mesh>
    </group>
  );
}

function RiverDuckRide() {
  const g = useRef<THREE.Group>(null);
  const pos = useRef({ x: 90, z: -96 });
  useFrame((_, dt) => {
    if (live.house) return;
    if (live.duckRide) {
      pos.current.z -= 16 * dt;
      pos.current.x += Math.sin(live.playT * 1.4) * dt * 2;
      live.x = pos.current.x;
      live.z = pos.current.z;
      live.y = heightAt(live.x, live.z) + 0.55;
      live.speed = 16;
      live.hint = "Duck. Jump hops off.";
      if (pos.current.z < -900) {
        live.duckRide = false;
        live.boostY = 3;
        if (!live.smashed.duckrides) pay(10, "The duck had places to be.", "duckrides");
      }
    } else {
      const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
      if (d < 1.7 && !live.mounted && !live.balloonRide && live.wheelT <= 0) {
        live.hint = "A duck. Ride it. F";
        if (consumeTalk()) {
          live.duckRide = true;
          sfx.ok();
        }
      }
    }
    if (g.current) g.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z) + 0.2, pos.current.z);
  });
  return (
    <group ref={g} position={[90, 2, -96]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <sphereGeometry args={[0.28, 8, 6]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0, 0.38, 0.28]}>
        <sphereGeometry args={[0.14, 6, 5]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0, 0.34, 0.42]}>
        <coneGeometry args={[0.06, 0.16, 5]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
    </group>
  );
}

function GooseFriend() {
  const g = useRef<THREE.Group>(null);
  const pos = useRef({ x: VX - 8, z: VZ + 6 });
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
    if (d < 1.8 && !live.gooseOn && !live.mounted) {
      live.hint = "A goose. Honk at it. F";
      if (consumeTalk()) {
        live.gooseOn = true;
        sfx.ok();
        if (!live.smashed.goose) pay(6, "It will follow you now. Forever, maybe.", "goose");
      }
    }
    if (live.gooseOn) {
      const tx = live.x - Math.sin(live.yaw) * -1.6;
      const tz = live.z - Math.cos(live.yaw) * -1.6;
      pos.current.x += (tx - pos.current.x) * (1 - Math.exp(-dt * 3.2));
      pos.current.z += (tz - pos.current.z) * (1 - Math.exp(-dt * 3.2));
      live.hint = live.hint || "The goose has opinions.";
    }
    if (g.current) g.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z), pos.current.z);
  });
  return (
    <group ref={g} position={[VX - 8, 0, VZ + 6]}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <sphereGeometry args={[0.22, 7, 5]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0, 0.48, 0.22]}>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}

function SheepRun() {
  const g = useRef<THREE.Group>(null);
  const pack = useRef(
    [0, 1, 2, 3, 4].map((i) => ({
      x: VX - 86 + i * 4.2,
      z: VZ + 62,
      a: i * 1.3,
    })),
  );
  useFrame((_, dt) => {
    if (live.house) return;
    for (const sh of pack.current) {
      sh.a += dt * 0.22;
      sh.x = VX - 86 + Math.sin(sh.a) * 6;
      sh.z = VZ + 62 + Math.cos(sh.a * 0.8) * 5;
    }
    if (live.sheepRide >= 0) {
      const sh = pack.current[live.sheepRide]!;
      live.x = sh.x;
      live.z = sh.z;
      live.y = heightAt(sh.x, sh.z) + 1.05;
      live.speed = 2.4;
      live.yaw = 0;
    } else if (!live.mounted && !live.balloonRide && live.wheelT <= 0 && !live.duckRide) {
      for (let i = 0; i < pack.current.length; i++) {
        const sh = pack.current[i]!;
        const d = Math.hypot(live.x - sh.x, live.z - sh.z);
        if (d < 1.35 && consumeTalk()) {
          live.sheepRide = i;
          sfx.ok();
          break;
        }
      }
    }
    if (g.current) {
      for (let i = 0; i < g.current.children.length; i++) {
        const sh = pack.current[i]!;
        const c = g.current.children[i]!;
        c.position.set(sh.x, heightAt(sh.x, sh.z), sh.z);
      }
    }
  });
  return (
    <group ref={g}>
      {pack.current.map((sh, i) => (
        <group key={i} position={[sh.x, 0, sh.z]}>
          <mesh position={[0, 0.42, 0]} castShadow>
            <sphereGeometry args={[0.38, 7, 5]} />
            <meshLambertMaterial color="#efe6d4" />
          </mesh>
          <mesh position={[0, 0.52, 0.38]}>
            <sphereGeometry args={[0.16, 6, 5]} />
            <meshLambertMaterial color="#3a2a18" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function RainBucket() {
  const x = VX - 7.4;
  const z = VZ + 10;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.4 && !live.mounted) {
      live.hint = "A bucket. Dump it. F";
      if (consumeTalk()) {
        live.rainT = Math.max(live.rainT, 14);
        sfx.ok();
        if (!live.smashed.bucket) pay(6, "You made weather. The vale did not ask.", "bucket");
      }
    }
  });
  return (
    <mesh position={[x, y + 0.22, z]} castShadow>
      <cylinderGeometry args={[0.22, 0.18, 0.32, 8]} />
      <meshLambertMaterial color="#6a8aaa" />
    </mesh>
  );
}

function TownKite() {
  const x = VX + 15.6;
  const z = VZ + 4.2;
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const y = heightAt(x, z);
    if (g.current) {
      g.current.position.y = y + 2.4 + Math.sin(clock.elapsedTime * 1.4) * 0.35;
      g.current.rotation.z = Math.sin(clock.elapsedTime * 1.1) * 0.25;
    }
    if (live.house || live.mounted || live.balloonRide || live.wheelT > 0) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 2.8 && Math.abs(live.speed) > 12 && live.grounded) {
      live.boostY = 11;
      live.glideT = 9;
      live.hint = "The kite stole you.";
      if (!live.smashed.townkite) pay(8, "You ran with a kite. Gravity filed a complaint.", "townkite");
    } else if (d < 3.5) live.hint = "A kite. Run by it.";
  });
  return (
    <group ref={g} position={[x, 4, z]}>
      <mesh rotation={[0.3, 0.4, 0.1]} castShadow>
        <planeGeometry args={[0.7, 0.9]} />
        <meshLambertMaterial color="#c45c48" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 2.2, 4]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}

function TownCow() {
  const x = VX - 13.4;
  const z = VZ + 7.2;
  const y = heightAt(x, z);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house || live.mounted || live.balloonRide) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.7 && live.z < z - 0.1 && live.carry === "flower" && consumeTalk()) {
      live.carry = null;
      if (!live.smashed.cowgift) pay(11, "You gave the cow a flower. It chewed. Then a bottle of milk sat there.", "cowgift");
    } else if (d < 1.55 && live.z > z + 0.15 && cool.current <= 0 && live.grounded) {
      cool.current = 1.4;
      live.boostY = 8;
      live.vx = 0;
      live.x += 0.2;
      live.z -= 6;
      sfx.thud();
      live.hint = "The cow did not like that.";
      if (!live.smashed.cowkick) pay(6, "You stood behind a cow. Physics.", "cowkick");
    } else if (d < 2.4) live.hint = "Do not stand behind the cow.";
  });
  return (
    <group position={[x, y, z]} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.7, 4, 6]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0, 0.72, 0.48]} castShadow>
        <sphereGeometry args={[0.22, 7, 6]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[-0.12, 0.92, 0.42]}>
        <cylinderGeometry args={[0.03, 0.02, 0.16, 5]} />
        <meshLambertMaterial color="#3a2a18" />
      </mesh>
      <mesh position={[0.12, 0.92, 0.42]}>
        <cylinderGeometry args={[0.03, 0.02, 0.16, 5]} />
        <meshLambertMaterial color="#3a2a18" />
      </mesh>
    </group>
  );
}

function TownMailHop() {
  const x = VX + 11.8;
  const z = VZ + 18.4;
  const y = heightAt(x, z);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house || live.mounted) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 0.85 && live.jumpN >= 1 && live.grounded && cool.current <= 0) {
      cool.current = 1.6;
      live.tinyT = 5;
      live.boostY = 10;
      live.hint = "The mailbox spat you out.";
      if (!live.smashed.mailhop) pay(7, "Postage paid. You are the letter.", "mailhop");
    } else if (d < 1.6) live.hint = "A mailbox. Jump in.";
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.38, 0.32, 0.28]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.36, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function Bumpkin() {
  const pos = useRef({ x: VX - 9.2, z: VZ - 4 });
  const g = useRef<THREE.Group>(null);
  const vz = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    pos.current.z += vz.current * dt;
    vz.current *= Math.exp(-dt * 1.8);
    const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
    if (d < 1.1 && Math.abs(live.speed) > 5 && live.grounded) {
      vz.current = -18;
      live.hint = "The pumpkin left.";
      if (!live.smashed.bumpkin) pay(5, "You kicked a pumpkin. It had places.", "bumpkin");
    }
    if (g.current) g.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z) + 0.28, pos.current.z);
  });
  return (
    <group ref={g} position={[VX - 9.2, 2, VZ - 4]}>
      <mesh castShadow>
        <sphereGeometry args={[0.28, 8, 6]} />
        <meshLambertMaterial color="#c45c28" />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.12, 5]} />
        <meshLambertMaterial color="#3d6a38" />
      </mesh>
    </group>
  );
}

function HorizonWalk() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.07;
    const x = Math.sin(t) * 420;
    const z = -420;
    const y = heightAt(x, z);
    if (g.current) {
      g.current.position.set(x, y, z);
      g.current.rotation.y = Math.cos(t) >= 0 ? 0 : Math.PI;
    }
    if (live.house || live.balloonRide) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 28 && !live.smashed.colossus) {
      pay(20, "Something huge is walking the vale. It waved. Sort of.", "colossus");
    } else if (d < 80) live.hint = "It is bigger than the keep.";
  });
  return (
    <group ref={g} position={[0, 8, -420]}>
      <mesh position={[0, 28, 0]} castShadow>
        <boxGeometry args={[10, 36, 8]} />
        <meshLambertMaterial color="#6a5a48" />
      </mesh>
      <mesh position={[0, 52, 0]} castShadow>
        <boxGeometry args={[9, 10, 9]} />
        <meshLambertMaterial color="#6a5a48" />
      </mesh>
      <mesh position={[-8, 22, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[4, 22, 4]} />
        <meshLambertMaterial color="#5a4a38" />
      </mesh>
      <mesh position={[8, 22, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[4, 22, 4]} />
        <meshLambertMaterial color="#5a4a38" />
      </mesh>
      <mesh position={[-2.6, 8, 0]}>
        <boxGeometry args={[3, 16, 3]} />
        <meshLambertMaterial color="#4a3a28" />
      </mesh>
      <mesh position={[2.6, 8, 0]}>
        <boxGeometry args={[3, 16, 3]} />
        <meshLambertMaterial color="#4a3a28" />
      </mesh>
    </group>
  );
}

function ForkBounce() {
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house || live.mounted || live.balloonRide) return;
    const d = Math.hypot(live.x - SPIRE_AT.x, live.z - SPIRE_AT.z);
    if (d < 3.2 && live.grounded && cool.current <= 0) {
      cool.current = 0.45;
      live.boostY = 16;
      sfx.jump();
      live.hint = "The fork is a trampoline. Of course it is.";
      if (!live.smashed.forkbounce) pay(8, "Dinner bounced you.", "forkbounce");
    }
  });
  return null;
}

function LookUpSky() {
  const t = useRef(0);
  useFrame((_, dt) => {
    if (live.house || live.mounted) {
      t.current = 0;
      return;
    }
    if (live.jumpN >= 3 && Math.abs(live.speed) < 1.2 && live.grounded) t.current += dt;
    else t.current = 0;
    if (t.current > 0.4 && !live.smashed.skyrup) {
      live.boostY = 6;
      pay(12, "You hopped in place. The sky tipped rupees.", "skyrup");
    }
  });
  return null;
}

function CrabWalk() {
  const t = useRef(0);
  useFrame((_, dt) => {
    if (live.house || live.mounted || live.balloonRide) {
      t.current = 0;
      return;
    }
    if (live.backT > 8 && !live.smashed.crabwalk) {
      live.dizzyT = 3;
      pay(8, "You walked backward so long you became a crab.", "crabwalk");
    }
  });
  return null;
}

function SouthHole() {
  const x = VX + 4;
  const z = VZ - 52;
  const y = heightAt(x, z);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house || live.mounted || live.balloonRide) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.15 && live.grounded && cool.current <= 0 && (live.jumpN >= 1 || consumeTalk())) {
      cool.current = 4;
      live.x = SPIRE_AT.x + 8;
      live.z = SPIRE_AT.z + 10;
      live.y = heightAt(live.x, live.z) + 8;
      live.boostY = 4;
      live.hint = "A hole. It was a shortcut. Rude.";
      if (!live.smashed.southhole) pay(10, "The hole dropped you at the fork.", "southhole");
    } else if (d < 2.2) live.hint = "A hole. Walk in?";
  });
  return (
    <mesh position={[x, y + 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.15, 12]} />
      <meshLambertMaterial color="#1a140e" />
    </mesh>
  );
}

function SouthWagon() {
  const pos = useRef({ x: VX + 10.4, z: VZ - 48 });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    if (live.wagonRide) {
      pos.current.z -= 16 * dt;
      live.x = pos.current.x;
      live.z = pos.current.z;
      live.y = heightAt(live.x, live.z) + 1.15;
      live.speed = 16;
      live.yaw = 0;
      live.hint = "Wagon. Jump hops off.";
      if (pos.current.z < -640) {
        live.wagonRide = false;
        live.boostY = 5;
        if (!live.smashed.wagon) pay(14, "The wagon took you into the vale.", "wagon");
      }
    } else {
      pos.current.z -= 2.2 * dt;
      if (pos.current.z < VZ - 140) {
        pos.current.x = VX + 10.4;
        pos.current.z = VZ - 40;
      }
      const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
      if (d < 1.8 && !live.mounted && !live.balloonRide && live.wheelT <= 0 && !live.duckRide && live.sheepRide < 0) {
        live.hint = "A wagon going south. Hop on. F";
        if (consumeTalk()) {
          live.wagonRide = true;
          sfx.ok();
        }
      }
    }
    if (g.current) {
      g.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z) + 0.35, pos.current.z);
    }
  });
  return (
    <group ref={g} position={[VX + 10.4, 3, VZ - 28]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.15, 0.55, 1.7]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      {[-0.55, 0.55].map((z) =>
        [-0.48, 0.48].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 0.22, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.12, 8]} />
            <meshLambertMaterial color="#3a2a18" />
          </mesh>
        )),
      )}
    </group>
  );
}

function PetPebble() {
  const pos = useRef({ x: VX - 4.8, z: VZ + 6.2 });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    if (!live.pebbleOn) {
      const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
      if (d < 0.85 && (live.rolling || Math.abs(live.speed) > 8)) {
        live.pebbleOn = true;
        sfx.ok();
        live.hint = "The pebble likes you now.";
        if (!live.smashed.pebble) pay(6, "You rolled a rock. It followed you home.", "pebble");
      } else if (d < 1.4) live.hint = "A pebble. Roll over it.";
    } else {
      const tx = live.x + Math.sin(live.yaw) * 0.9;
      const tz = live.z + Math.cos(live.yaw) * 0.9;
      pos.current.x += (tx - pos.current.x) * (1 - Math.exp(-dt * 6));
      pos.current.z += (tz - pos.current.z) * (1 - Math.exp(-dt * 6));
    }
    if (g.current) g.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z) + 0.08, pos.current.z);
  });
  return (
    <mesh ref={g} position={[VX - 4.8, 2, VZ + 6.2]} castShadow>
      <dodecahedronGeometry args={[0.12, 0]} />
      <meshLambertMaterial color="#8a8478" />
    </mesh>
  );
}

function DashSneeze() {
  const last = useRef(0);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (cool.current > 0) cool.current -= dt;
    if (live.house || live.mounted || live.balloonRide) return;
    const sp = Math.abs(live.speed);
    if (last.current > 14 && sp < 2 && live.grounded && cool.current <= 0) {
      cool.current = 4;
      live.hint = "Achoo.";
      puffAt(live.x, live.z, live.y + 1.2, false);
      sfx.crow();
      if (!live.smashed.sneeze) pay(5, "You stopped too fast. The vale caught a cold.", "sneeze");
    }
    last.current = sp;
  });
  return null;
}

function FriendFly() {
  const g = useRef<THREE.Group>(null);
  const on = useRef(false);
  const pos = useRef({ x: VX + 8, z: VZ + 4, y: 3 });
  useFrame(({ clock }, dt) => {
    if (live.house) return;
    if (!on.current && live.stillT > 2.2 && !live.mounted) {
      on.current = true;
      live.hint = "A bug decided you are a flower.";
      if (!live.smashed.flyfriend) pay(6, "Stand still and the world sits with you.", "flyfriend");
    }
    if (!on.current) return;
    const t = clock.elapsedTime;
    const tx = live.x + Math.cos(t * 2.4) * 0.55;
    const tz = live.z + Math.sin(t * 2.4) * 0.55;
    const ty = live.y + 1.35 + Math.sin(t * 6) * 0.12;
    pos.current.x += (tx - pos.current.x) * (1 - Math.exp(-dt * 5));
    pos.current.z += (tz - pos.current.z) * (1 - Math.exp(-dt * 5));
    pos.current.y += (ty - pos.current.y) * (1 - Math.exp(-dt * 5));
    if (g.current) {
      g.current.visible = true;
      g.current.position.set(pos.current.x, pos.current.y, pos.current.z);
    }
  });
  return (
    <group ref={g} visible={false}>
      <mesh>
        <sphereGeometry args={[0.04, 6, 5]} />
        <meshLambertMaterial color="#e8d48a" />
      </mesh>
    </group>
  );
}

function RoadBoot() {
  const x = 10;
  const z = -280;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house || live.mounted) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 3.4 && live.grounded && live.jumpN >= 1) {
      live.boostY = 12;
      live.hint = "A boot. You jumped in it.";
      if (!live.smashed.roadboot) pay(8, "Someone lost a boot the size of a shed.", "roadboot");
    } else if (d < 6) live.hint = "A giant boot. Jump in.";
  });
  return (
    <group position={[x, y, z]} rotation={[0, 0.4, 0]}>
      <mesh position={[0, 1.1, 0.2]} castShadow>
        <boxGeometry args={[2.2, 1.4, 3.6]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[0, 2.2, 1.2]} castShadow>
        <boxGeometry args={[2.1, 2.4, 1.4]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 0.4, -1.1]}>
        <boxGeometry args={[2.0, 0.35, 1.1]} />
        <meshLambertMaterial color="#3a2a18" />
      </mesh>
    </group>
  );
}

function KickCan() {
  const pos = useRef({ x: 8, z: -168 });
  const vz = useRef(0);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    pos.current.z += vz.current * dt;
    vz.current *= Math.exp(-dt * 1.4);
    const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
    if (d < 0.9 && Math.abs(live.speed) > 4 && live.grounded) {
      vz.current = -22 - Math.abs(live.speed) * 0.4;
      live.hint = "You kicked a can. It kept going.";
      if (!live.smashed.kickcan) pay(5, "A can. Down the road. Like real life.", "kickcan");
    }
    if (g.current) g.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z) + 0.12, pos.current.z);
  });
  return (
    <mesh ref={g} position={[8, 2, -168]} rotation={[0.4, 0.2, 0.1]} castShadow>
      <cylinderGeometry args={[0.09, 0.1, 0.22, 8]} />
      <meshLambertMaterial color="#8a9098" />
    </mesh>
  );
}

function CircleSpin() {
  const yaw0 = useRef(0);
  const acc = useRef(0);
  useFrame((_, dt) => {
    if (live.house || live.mounted) {
      acc.current = 0;
      return;
    }
    let d = live.yaw - yaw0.current;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    if (Math.abs(live.speed) > 3) acc.current += d;
    else acc.current *= Math.exp(-dt * 0.6);
    yaw0.current = live.yaw;
    if (Math.abs(acc.current) > Math.PI * 2.2 && !live.smashed.circlerup) {
      acc.current = 0;
      pay(9, "You walked in a circle. A rupee got dizzy and fell.", "circlerup");
      live.dizzyT = 1.2;
    }
  });
  return null;
}

function StickHat() {
  const x = 14;
  const z = -210;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  const gone = useRef(false);
  useFrame(() => {
    if (gone.current || live.house) {
      if (g.current) g.current.visible = !gone.current;
      return;
    }
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.3 && consumeTalk()) {
      gone.current = true;
      live.hat = "kite";
      sfx.ok();
      if (g.current) g.current.visible = false;
      if (!live.smashed.stickhat) pay(7, "You wore a hat that was not yours.", "stickhat");
    }
  });
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 1.4, 5]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 1.45, 0]} rotation={[0.15, 0.2, 0.1]} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.12, 8]} />
        <meshLambertMaterial color="#3a6a88" />
      </mesh>
    </group>
  );
}

function BackWalk() {
  const t = useRef(0);
  useFrame((_, dt) => {
    if (live.house || live.mounted || live.balloonRide) {
      t.current = 0;
      return;
    }
    if (live.speed < -4.2) t.current += dt;
    else t.current = Math.max(0, t.current - dt * 0.6);
    if (t.current > 7 && !live.smashed.backwalk) {
      pay(8, "You walked backwards so long the vale forgot which way was home.", "backwalk");
    }
  });
  return null;
}

function PondTalk() {
  useFrame(() => {
    if (live.house || live.talking || live.nearNpc) return;
    const d = Math.hypot(live.x - POND.x, live.z - POND.z);
    if (d < 7.2 && pondU(live.x, live.z) > 0.12 && consumeTalk() && !live.smashed.pondtalk) {
      pay(6, "You said hello to the pond. It did not say hello back. A fish did.", "pondtalk");
    }
  });
  return null;
}

function CowBell() {
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - COW_PAD.x, live.z - COW_PAD.z);
    if (d < 2.2 && consumeTalk() && !live.smashed.cowbell) {
      pay(7, "The cow let you ring her bell. She is famous now.", "cowbell");
      sfx.ok();
    }
  });
  return null;
}

function NightName() {
  useFrame(() => {
    if (live.house || live.talking) return;
    const night = duskAmt() > 0.72;
    if (night && live.stillT > 2.4 && consumeTalk() && !live.smashed.namestar) {
      pay(9, "You named a star after your horse. The star did not mind.", "namestar");
    }
  });
  return null;
}

function LongWalk() {
  const steps = useRef(0);
  useFrame((_, dt) => {
    if (live.house || live.mounted) return;
    if (Math.abs(live.speed) > 2) steps.current += Math.abs(live.speed) * dt;
    if (steps.current > 420 && !live.smashed.longwalk) {
      pay(12, "You just walked. And walked. A rupee was tired for you.", "longwalk");
    }
  });
  return null;
}

function RoofHop() {
  const roofs = useRef(new Set<string>());
  useFrame(() => {
    if (live.house || live.mounted) return;
    const ground = heightAt(live.x, live.z);
    if (live.y < ground + 2.1) return;
    for (const h of HOUSES) {
      if (h.world && h.world !== "meadow") continue;
      const { w, d } = houseSize(h);
      if (Math.abs(live.x - h.x) < w * 0.42 && Math.abs(live.z - h.z) < d * 0.42) {
        roofs.current.add(h.id);
      }
    }
    if (roofs.current.size >= 3 && !live.smashed.roofhop) {
      pay(11, "Three roofs. You are the mailman of roofs.", "roofhop");
    }
  });
  return null;
}

function MoonSit() {
  useFrame(() => {
    if (live.house) return;
    if (live.sit && duskAmt() > 0.7 && live.stillT > 2 && !live.smashed.moonsit) {
      pay(8, "You sat with the moon. It sat back.", "moonsit");
    }
  });
  return null;
}

function ShallowFish() {
  const t = useRef(0);
  useFrame((_, dt) => {
    if (live.house) {
      t.current = 0;
      return;
    }
    if (live.swim && !live.under && Math.abs(live.speed) < 1.2) t.current += dt;
    else t.current = 0;
    if (t.current > 5 && !live.smashed.fishchat) {
      pay(8, "A fish told you a secret. You forgot it. The fish was relieved.", "fishchat");
    }
  });
  return null;
}

function KeepEcho() {
  useFrame(() => {
    if (live.house || !live.slash) return;
    if (Math.abs(live.z - KEEP_Z) < 22 && Math.hypot(live.x, live.z - KEEP_Z) < 28 && !live.smashed.keepecho) {
      pay(7, "Your swing came back as a hiss. The keep is a copycat.", "keepecho");
    }
  });
  return null;
}

function LostMitten() {
  const x = VX - 14.5;
  const z = VZ + 8.2;
  const y = heightAt(x, z);
  const gone = useRef(false);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (gone.current || live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.25 && consumeTalk()) {
      gone.current = true;
      if (g.current) g.current.visible = false;
      if (!live.smashed.mitten) pay(6, "A mitten. Someone's hand is cold now. Not yours.", "mitten");
    }
  });
  return (
    <group ref={g} position={[x, y, z]} rotation={[0.2, 0.4, 0.1]}>
      <mesh position={[0, 0.08, 0]} scale={[1.1, 0.55, 1.35]} castShadow>
        <sphereGeometry args={[0.12, 7, 5]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
    </group>
  );
}

function WindChime() {
  const x = VX + 8.6;
  const z = VZ - 6.4;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.z = Math.sin(clock.elapsedTime * 1.6) * 0.18;
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.6 && consumeTalk() && !live.smashed.chime) {
      pay(6, "You rang a chime that was not a door. Birds took notes.", "chime");
    }
  });
  return (
    <group ref={g} position={[x, y + 2.1, z]}>
      <mesh>
        <cylinderGeometry args={[0.015, 0.015, 0.9, 4]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      {[-0.12, 0, 0.12].map((ox, i) => (
        <mesh key={i} position={[ox, -0.55, 0]}>
          <cylinderGeometry args={[0.025, 0.03, 0.22, 5]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      ))}
    </group>
  );
}

function PicnicAnts() {
  const x = VX - 22;
  const z = VZ - 18;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.6 && live.stompT > 0 && !live.smashed.picnicants) {
      pay(7, "You stomped the ants' picnic. They will write a tiny letter.", "picnicants");
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <circleGeometry args={[0.55, 8]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0.08, 0.08, 0.06]} castShadow>
        <sphereGeometry args={[0.08, 6, 5]} />
        <meshLambertMaterial color="#c45c48" />
      </mesh>
    </group>
  );
}

function ThreeHops() {
  const n = useRef(0);
  const last = useRef(0);
  const cool = useRef(0);
  useFrame((_, dt) => {
    if (live.house || live.mounted) {
      n.current = 0;
      return;
    }
    cool.current += dt;
    if (live.jumpN > last.current) {
      if (Math.abs(live.speed) < 2.2 && cool.current < 1.1) n.current += 1;
      else n.current = 1;
      cool.current = 0;
    }
    last.current = live.jumpN;
    if (n.current >= 4 && !live.smashed.threehop) {
      pay(6, "You hopped in place. A rupee hopped too.", "threehop");
    }
  });
  return null;
}

function LostMarble() {
  const x = VX + 5.4;
  const z = VZ + 11.2;
  const y = heightAt(x, z);
  const gone = useRef(false);
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.position.y = y + 0.06 + Math.sin(clock.elapsedTime * 2.2) * 0.02;
    if (gone.current || live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.1 && consumeTalk()) {
      gone.current = true;
      if (g.current) g.current.visible = false;
      if (!live.smashed.marble) pay(5, "A marble. Someone is going to miss this at recess.", "marble");
    }
  });
  return (
    <group ref={g} position={[x, y + 0.06, z]}>
      <mesh castShadow>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshLambertMaterial color="#3a6ab0" />
      </mesh>
    </group>
  );
}

function HorseWhisper() {
  useFrame(() => {
    if (live.house || live.mounted) return;
    if (live.horseX == null || live.horseZ == null) return;
    const d = Math.hypot(live.x - live.horseX, live.z - live.horseZ);
    if (d < 1.8 && live.stillT > 1.6 && consumeTalk() && !live.smashed.horsewhisp) {
      pay(6, "You told the horse a secret. She already knew.", "horsewhisp");
    }
  });
  return null;
}

function SkipStone() {
  const n = useRef(0);
  useFrame(() => {
    if (live.house) return;
    for (const t of live.throws) {
      if (t.broken) continue;
      if (pondU(t.x, t.z) > 0.28 && t.y < heightAt(t.x, t.z) + 1.4) {
        n.current += 1;
        t.broken = true;
        if (n.current >= 3 && !live.smashed.skipstone) {
          pay(8, "You skipped a rock. The pond kept it.", "skipstone");
        }
      }
    }
  });
  return null;
}

function PlayDead() {
  const saw = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    let close = false;
    for (const p of Object.values(live.foeTrack)) {
      if (Math.hypot(live.x - p.x, live.z - p.z) < 9) close = true;
    }
    if (close && live.sit) {
      saw.current = true;
      if (!live.smashed.playdead) pay(9, "You played dead. The fang got bored.", "playdead");
    }
    void dt;
  });
  return null;
}

function HayNap() {
  const x = MILL_AT.x + 4.2;
  const z = MILL_AT.z + 2.6;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.8 && (live.sit || live.stillT > 2.4) && !live.smashed.haynap) {
      pay(7, "You napped in hay. You smell like a horse's dream.", "haynap");
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.28, 0]} scale={[1.6, 0.7, 1.2]} castShadow>
        <sphereGeometry args={[0.55, 8, 6]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

function LeafPile() {
  const x = VX - 18;
  const z = VZ + 22;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.6 && (live.stompT > 0 || !live.grounded) && !live.smashed.leafpile) {
      pay(6, "You jumped in a pile of leaves. Fall is proud.", "leafpile");
      puffAt(x, z, y + 0.3);
    }
  });
  return (
    <group position={[x, y, z]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[(i % 3) * 0.22 - 0.22, 0.08, Math.floor(i / 3) * 0.2]} rotation={[0.4, i, 0.2]} castShadow>
          <boxGeometry args={[0.18, 0.02, 0.12]} />
          <meshLambertMaterial color={i % 2 ? "#c45c38" : "#c9a227"} />
        </mesh>
      ))}
    </group>
  );
}

function PieSill() {
  const hut = HOUSES.find((h) => h.id === "yours") ?? HOUSES[1]!;
  const x = hut.x + 1.6;
  const z = hut.z + 1.1;
  const y = heightAt(x, z);
  const gone = useRef(false);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (gone.current || live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.4 && consumeTalk()) {
      gone.current = true;
      if (g.current) g.current.visible = false;
      if (!live.smashed.pie) pay(8, "A pie cooling. You ate the evidence.", "pie");
    }
  });
  return (
    <group ref={g} position={[x, y + 1.15, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.05, 10]} />
        <meshLambertMaterial color="#c45c38" />
      </mesh>
    </group>
  );
}

function PotHead() {
  const x = VX + 6.4;
  const z = VZ - 9.2;
  const y = heightAt(x, z);
  const gone = useRef(false);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (gone.current || live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.3 && consumeTalk()) {
      gone.current = true;
      live.hat = "pot";
      if (g.current) g.current.visible = false;
      sfx.ok();
      if (!live.smashed.pothead) pay(6, "You wore a pot. Dinner is confused.", "pothead");
    }
  });
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh position={[0, 0.22, 0]} rotation={[0.15, 0.4, 0.1]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.28, 8]} />
        <meshLambertMaterial color="#6a5a48" />
      </mesh>
    </group>
  );
}

function RainHands() {
  useFrame(() => {
    if (live.house || live.rainT <= 0) return;
    if (live.stillT > 3.2 && live.grounded && !live.smashed.rainhands) {
      pay(7, "You caught the rain. It did not stay.", "rainhands");
    }
  });
  return null;
}

function DoorKnock() {
  const n = useRef(0);
  const last = useRef(0);
  const who = useRef("");
  useFrame(() => {
    if (live.house || live.talking) {
      n.current = 0;
      return;
    }
    if (!live.slash) return;
    for (const h of HOUSES) {
      if (h.world && h.world !== "meadow") continue;
      const d = Math.hypot(live.x - h.x, live.z - h.z);
      if (d >= 3.4 || d < 0.8) continue;
      if (live.playT - last.current < 0.28) return;
      if (who.current !== h.id) {
        who.current = h.id;
        n.current = 0;
      }
      last.current = live.playT;
      n.current += 1;
      sfx.thud();
      if (n.current >= 3 && !live.smashed.doorknock) {
        pay(8, "Three knocks. A sleepy voice said we are closed. Then a rupee under the door.", "doorknock");
      }
      return;
    }
  });
  return null;
}

function KickToy({
  x0,
  z0,
  id,
  color,
  r = 0.16,
}: {
  x0: number;
  z0: number;
  id: string;
  color: string;
  r?: number;
}) {
  const pos = useRef({ x: x0, z: z0, vx: 0, vz: 0 });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (live.house) return;
    pos.current.x += pos.current.vx * dt;
    pos.current.z += pos.current.vz * dt;
    pos.current.vx *= Math.exp(-dt * 1.6);
    pos.current.vz *= Math.exp(-dt * 1.6);
    if (live.spinning || live.dizzyT > 0.4) {
      const dx = live.x - pos.current.x;
      const dz = live.z - pos.current.z;
      const d0 = Math.hypot(dx, dz) || 1;
      if (d0 < 7) {
        pos.current.vx += (dx / d0) * 18 * dt;
        pos.current.vz += (dz / d0) * 18 * dt;
      }
    }
    for (const p of Object.values(live.npcPos)) {
      const nd = Math.hypot(p.x - pos.current.x, p.z - pos.current.z);
      if (nd < 0.7) {
        pos.current.vx += (pos.current.x - p.x) * 8 * dt;
        pos.current.vz += (pos.current.z - p.z) * 8 * dt;
      }
    }
    const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
    if (d < 0.95 && Math.abs(live.speed) > 3.2 && live.grounded) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      pos.current.vx = fx * (10 + Math.abs(live.speed) * 0.55);
      pos.current.vz = fz * (10 + Math.abs(live.speed) * 0.55);
      if (!live.smashed[id]) pay(5, "You kicked it. It kept going.", id);
    }
    if (g.current) g.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z) + r, pos.current.z);
  });
  return (
    <group ref={g} position={[x0, heightAt(x0, z0) + r, z0]}>
      <mesh castShadow>
        <sphereGeometry args={[r, 8, 6]} />
        <meshLambertMaterial color={color} />
      </mesh>
    </group>
  );
}

function TownBall() {
  return <KickToy x0={VX + 4.8} z0={VZ + 18} id="townball" color="#c45c38" r={0.2} />;
}

function PineKick() {
  return (
    <>
      <KickToy x0={VX - 12} z0={VZ + 9} id="pine1" color="#6a4a28" r={0.11} />
      <KickToy x0={VX + 16} z0={VZ - 14} id="pine2" color="#5a3a22" r={0.1} />
    </>
  );
}

function Butterflies() {
  const g = useRef<THREE.Group>(null);
  const caught = useRef(0);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (g.current) {
      g.current.position.set(VX + Math.sin(t * 0.35) * 7, 1.4 + Math.sin(t * 1.6) * 0.35, VZ + 4 + Math.cos(t * 0.28) * 6);
    }
    if (live.house) return;
    if (!g.current) return;
    const d = Math.hypot(live.x - g.current.position.x, live.z - g.current.position.z);
    if (d < 1.4 && !live.grounded && live.stompT > 0) {
      caught.current += 1;
      if (caught.current >= 1 && !live.smashed.butterfly) pay(6, "You caught a butterfly. You let it go.", "butterfly");
    }
  });
  return (
    <group ref={g} position={[VX, 1.4, VZ + 4]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[(i % 2) * 0.4 - 0.2, (i % 3) * 0.15, i * 0.2]}>
          <sphereGeometry args={[0.05, 5, 4]} />
          <meshLambertMaterial color={i % 2 ? "#e8d48a" : "#c45c88"} />
        </mesh>
      ))}
    </group>
  );
}

function TownDog() {
  const pos = useRef({ x: VX - 6, z: VZ + 14 });
  const g = useRef<THREE.Group>(null);
  const follow = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
    if (d < 1.5 && consumeTalk()) {
      follow.current = true;
      sfx.ok();
      if (live.carry === "stick") {
        live.carry = null;
        if (!live.smashed.dogstick) pay(10, "You threw the stick. The dog brought it back. Then it ate it.", "dogstick");
      } else if (!live.smashed.towndog) pay(6, "The dog will come. It likes your shoes.", "towndog");
    }
    if (follow.current) {
      const tx = live.x - Math.sin(live.yaw) * -1.8;
      const tz = live.z - Math.cos(live.yaw) * -1.8;
      pos.current.x += (tx - pos.current.x) * (1 - Math.exp(-dt * 3.4));
      pos.current.z += (tz - pos.current.z) * (1 - Math.exp(-dt * 3.4));
    }
    if (g.current) g.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z), pos.current.z);
  });
  return (
    <group ref={g} position={[VX - 6, 0, VZ + 14]}>
      <mesh position={[0, 0.28, 0]} scale={[1.15, 0.7, 1.4]} castShadow>
        <sphereGeometry args={[0.22, 7, 5]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <mesh position={[0, 0.38, 0.28]}>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
    </group>
  );
}

function PondRaft() {
  const g = useRef<THREE.Group>(null);
  const pos = useRef({ x: POND.x + 2.4, z: POND.z + 1.2 });
  useFrame(() => {
    if (live.house) return;
    if (live.raftRide) {
      pos.current.x = live.x;
      pos.current.z = live.z;
    } else {
      const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
      if (d < 1.8 && pondU(live.x, live.z) > 0.2 && consumeTalk()) {
        live.raftRide = true;
        live.x = pos.current.x;
        live.z = pos.current.z;
        sfx.ok();
        if (!live.smashed.raftride) pay(8, "A raft. Jump when you want off.", "raftride");
      }
    }
    if (g.current) g.current.position.set(pos.current.x, pondSurfaceY() + 0.08, pos.current.z);
  });
  return (
    <group ref={g} position={[POND.x + 2.4, 1, POND.z + 1.2]}>
      <mesh rotation={[-Math.PI / 2, 0, 0.2]} castShadow>
        <boxGeometry args={[1.8, 1.1, 0.16]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.08, 0]} rotation={[0, 0, 0.5]} castShadow>
          <cylinderGeometry args={[0.04, 0.05, 1.15, 5]} />
          <meshLambertMaterial color="#5a3a22" />
        </mesh>
      ))}
    </group>
  );
}

function TownBell() {
  const g = useRef<THREE.Group>(null);
  const { x, z } = BELL_AT;
  const y = heightAt(x, z);
  const rings = useRef(0);
  useFrame((_, dt) => {
    if (g.current && live.bellT > 0) g.current.rotation.z = Math.sin(live.playT * 18) * 0.25;
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.6 && consumeTalk()) {
      live.bellT = 2.4;
      sfx.chime();
      rings.current += 1;
      if (!live.smashed.townbell) pay(6, "Everyone looked. Then they looked away.", "townbell");
    }
    if (live.slash && Math.hypot(live.slash.x - x, live.slash.z - z) < 2.1) {
      live.bellT = 2.2;
      sfx.chime();
      rings.current += 1;
      live.slash = null;
      if (rings.current >= 3 && !live.smashed.bell3) {
        pay(12, "Three hits. A coin fell out of the bell.", "bell3");
      }
    }
    void dt;
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 3.2, 6]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      <group ref={g} position={[0, 2.85, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.22, 8, 6]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      </group>
    </group>
  );
}

function StickPickup() {
  const x = VX - 8.4;
  const z = VZ - 6.2;
  const y = heightAt(x, z);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = live.carry !== "stick";
    if (live.house || live.carry) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.3 && consumeTalk()) {
      live.carry = "stick";
      sfx.ok();
      if (!live.smashed.stick) pay(5, "A stick. You can swing it. You can throw it.", "stick");
    }
  });
  return (
    <group ref={g} position={[x, y, z]} rotation={[0.4, 0.6, 0.2]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 0.7, 5]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function BounceTown() {
  const x = VX + 1.2;
  const z = VZ + 20.4;
  const y = heightAt(x, z);
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.45 && !live.mounted && cool.current <= 0 && (live.stompT > 0 || !live.grounded || Math.abs(live.speed) > 8)) {
      live.boostY = live.carryKid ? 19.5 : 16.5;
      cool.current = 0.45;
      sfx.jump();
      if (!live.smashed.bouncepad) pay(6, "A bounce. The vale got taller.", "bouncepad");
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.18, 0]} scale={[1.15, 0.35, 1.15]} castShadow>
        <sphereGeometry args={[1.05, 12, 8]} />
        <meshLambertMaterial color="#c45c38" />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 0.7, 8]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0, 1.05, 0]} scale={[1, 0.7, 1]} castShadow>
        <sphereGeometry args={[0.55, 10, 8]} />
        <meshLambertMaterial color="#3d8a42" />
      </mesh>
    </group>
  );
}

function TownSeesaw() {
  const x = VX - 11.4;
  const z = VZ + 17.2;
  const y = heightAt(x, z);
  const plank = useRef<THREE.Group>(null);
  const cool = useRef(0);
  useFrame((_, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    const d = Math.hypot(live.x - x, live.z - z);
    const side = live.x < x ? -1 : 1;
    if (plank.current) plank.current.rotation.z += ((d < 1.8 ? side * 0.28 : 0) - plank.current.rotation.z) * (1 - Math.exp(-dt * 6));
    if (live.house) return;
    if (d < 1.7 && live.stompT > 0 && cool.current <= 0) {
      live.boostY = 12.5;
      live.knock = { vx: -side * 7, vz: 2, t: 0.4 };
      cool.current = 0.7;
      sfx.jump();
      if (!live.smashed.seesawtown) pay(6, "The other end went up. So did you.", "seesawtown");
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.4, 6]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <group ref={plank} position={[0, 0.48, 0]}>
        <mesh rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[2.6, 0.08, 0.4]} />
          <meshLambertMaterial color="#8a5a28" />
        </mesh>
      </group>
    </group>
  );
}

function KickRing() {
  return (
    <>
      <KickToy x0={VX + 3.2} z0={VZ + 6.4} id="kickapple" color="#c45c38" r={0.12} />
      <KickToy x0={VX - 4.1} z0={VZ + 8.2} id="kickpail" color="#6a7a88" r={0.14} />
      <KickToy x0={VX + 6.8} z0={VZ + 2.2} id="kickshoe" color="#3a2820" r={0.1} />
      <KickToy x0={VX - 2.4} z0={VZ + 12.6} id="kickmelon" color="#3d8a42" r={0.16} />
      <KickToy x0={VX + 8.4} z0={VZ + 11.2} id="kickmug" color="#efe6d4" r={0.09} />
    </>
  );
}

function VillagePlayground() {
  const spin = useRef(0);
  const ride = useRef(false);
  const plat = useRef<THREE.Group>(null);
  const cx = VX - 7.2;
  const cz = VZ + 5.4;
  const cy = heightAt(cx, cz);
  const sx = VX + 9.6;
  const sz = VZ + 15.8;
  const sy = heightAt(sx, sz);
  useFrame((_, dt) => {
    if (live.house) {
      ride.current = false;
      return;
    }
    const d = Math.hypot(live.x - cx, live.z - cz);
    if (!ride.current && d < 1.55 && consumeTalk() && live.grounded && !live.mounted) {
      ride.current = true;
      if (!live.smashed.carousel) pay(6, "A tiny carousel. Jump when you want off.", "carousel");
    }
    if (ride.current) {
      spin.current += dt * 1.8;
      const a = spin.current;
      live.x = cx + Math.sin(a) * 1.45;
      live.z = cz + Math.cos(a) * 1.45;
      live.yaw = a + Math.PI / 2;
      live.speed = 0;
      live.y = cy + 0.55;
      if (!live.grounded) ride.current = false;
    }
    if (plat.current) plat.current.rotation.y = spin.current;
    const sd = Math.hypot(live.x - sx, live.z - sz);
    if (sd < 1.1 && live.y > sy + 1.4 && live.grounded === false) {
      live.knock = { vx: 0, vz: 11, t: 0.55 };
      if (!live.smashed.townslide) pay(5, "A slide. Wheee is a real word.", "townslide");
    }
  });
  return (
    <group>
      <group position={[cx, cy, cz]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.28, 0.36, 8]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
        <group ref={plat} position={[0, 0.42, 0]}>
          {[0, 1, 2, 3].map((i) => {
            const a = (i / 4) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.sin(a) * 1.35, 0, Math.cos(a) * 1.35]} castShadow>
                <boxGeometry args={[0.55, 0.08, 0.4]} />
                <meshLambertMaterial color={i % 2 ? "#c45c38" : "#efe6d4"} />
              </mesh>
            );
          })}
        </group>
      </group>
      <group position={[sx, sy, sz]}>
        <mesh position={[0, 1.35, 0]} rotation={[0.55, 0, 0]} castShadow>
          <boxGeometry args={[0.7, 0.08, 3.4]} />
          <meshLambertMaterial color="#3a6ab0" />
        </mesh>
        <mesh position={[0, 0.2, 1.4]} castShadow>
          <boxGeometry args={[0.85, 0.12, 0.7]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
      </group>
    </group>
  );
}

function TownBirds() {
  const g = useRef<THREE.Group>(null);
  const scare = useRef(0);
  const home = { x: VX + 0.4, z: VZ + 7.2 };
  useFrame((_, dt) => {
    if (!g.current) return;
    const d = Math.hypot(live.x - home.x, live.z - home.z);
    if (d < 2.6 && (Math.abs(live.speed) > 6 || live.rolling || live.stompT > 0)) {
      if (scare.current <= 0 && !live.smashed.townbirds) {
        live.smashed.townbirds = true;
        useGame.getState().addCoins(5);
      }
      scare.current = 2.8;
    }
    if (scare.current > 0) scare.current -= dt;
    g.current.children.forEach((c, i) => {
      const t = live.playT * (scare.current > 0 ? 4 : 1.2) + i;
      const r = scare.current > 0 ? 3.5 + scare.current : 0.9;
      c.position.set(Math.cos(t) * r, 0.8 + (scare.current > 0 ? scare.current * 1.1 : Math.sin(t * 2) * 0.15), Math.sin(t) * r);
    });
  });
  return (
    <group ref={g} position={[home.x, heightAt(home.x, home.z), home.z]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.06, 5, 4]} />
          <meshLambertMaterial color="#2a2018" />
        </mesh>
      ))}
    </group>
  );
}

function TreeHomePlay() {
  const sx = TREE_TRUNK.x + 4.6;
  const sz = TREE_TRUNK.z + 0.35;
  const sy = heightAt(sx, sz);
  const seat = useRef<THREE.Group>(null);
  const chime = useRef(0);
  const cool = useRef(0);
  const leaves = useRef(0);
  const [bramOut, setBramOut] = useState(false);
  const [selaOut, setSelaOut] = useState(false);
  const [pearGone, setPearGone] = useState(false);
  const picnic = { x: TREE_TRUNK.x + 2.8, z: TREE_TRUNK.z + 3.4 };
  const hammock = { x: TREE_TRUNK.x + 5.4, z: TREE_TRUNK.z - 0.4 };
  useFrame(({ clock }, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (leaves.current > 0) leaves.current -= dt;
    if (seat.current) seat.current.rotation.x = Math.sin(clock.elapsedTime * 1.25) * 0.42;
    if (live.house) return;
    const d = Math.hypot(live.x - sx, live.z - sz);
    const pd = Math.hypot(live.x - picnic.x, live.z - picnic.z);
    if (live.mounted && pd < 1.5 && !pearGone) {
      setPearGone(true);
      sfx.ok();
      if (!live.smashed.horsepear) pay(6, "The horse ate Gran’s pears.", "horsepear");
    }
    const hd = Math.hypot(live.x - hammock.x, live.z - hammock.z);
    const td = Math.hypot(live.x - TREE_TRUNK.x, live.z - TREE_TRUNK.z);
    const sd = Math.hypot(live.x - (TREE_TRUNK.x + 11.2), live.z - (TREE_TRUNK.z + 14.5));
    if (sd < 1.6 && !live.nearNpc) {
      const behind = live.z < TREE_TRUNK.z + 14.1;
      live.listen = behind
        ? "Someone wrote on the back. The front only points."
        : "The sign points to town.";
      if (behind && !live.smashed.signback) pay(6, "The front points. The back talks.", "signback");
    }
    if (live.stompT > 0 && td < 2.4) leaves.current = 1.4;
    if (consumeTalk() && cool.current <= 0 && !live.mounted) {
      const bram = live.npcPos.bram;
      const sela = live.npcPos.sela;
      if (live.carry && bram && Math.hypot(live.x - bram.x, live.z - bram.z) < 1.45) {
        cool.current = 0.8;
        sfx.ok();
        if (live.carry === "frog") {
          live.npcMood.bram = "scared";
          if (!live.smashed.givebram) pay(6, "Bram held the frog. Then he did not hold the frog.", "givebram");
        } else if (live.carry === "stick") {
          live.npcMood.bram = "laugh";
          if (!live.smashed.givebramstick) pay(5, "Bram took the stick. He is a knight now.", "givebramstick");
        } else if (live.carry === "cucco") {
          live.npcMood.bram = "smile";
          if (!live.smashed.givebramhen) pay(5, "Bram named the chicken Soup. He was joking. Probably.", "givebramhen");
        }
        live.carry = null;
        live.carryId = null;
      } else if (live.carry && sela && Math.hypot(live.x - sela.x, live.z - sela.z) < 1.45) {
        cool.current = 0.8;
        sfx.ok();
        live.npcMood.sela = live.carry === "frog" ? "scared" : "smile";
        if (!live.smashed.givesela) pay(5, "Sela said thank you. Then she put it in her pocket.", "givesela");
        live.carry = null;
        live.carryId = null;
      } else if (pd < 1.25 && live.y < sy + 2) {
        useGame.getState().healGrass();
        sfx.ok();
        cool.current = 1.2;
        if (!live.smashed.granlunch) pay(6, "Gran packed pears. They are still warm.", "granlunch");
      } else if (d < 1.45 && live.y < sy + 3.2) {
        cool.current = 0.9;
        live.boostY = 9.5;
        live.knock = { vx: 8, vz: 1.4, t: 0.65 };
        sfx.jump();
        if (!live.smashed.treeswing) pay(6, "The branch swing sent you toward town.", "treeswing");
      } else if (hd < 1.4 && live.y > sy + 3.5) {
        live.sit = true;
        sfx.ok();
        if (!live.smashed.hammock) pay(5, "A hammock on the arm of the tree.", "hammock");
      } else if (td < 1.7 && live.y < sy + 2.2) {
        live.listen = "The oak did not talk. It creaked, which is almost talking.";
        if (!live.smashed.talktreehome) pay(5, "You said hi to your own house.", "talktreehome");
      } else {
        const cx = TREE_HOME.x + 1.8;
        const cz = TREE_HOME.z - 1.4;
        if (Math.hypot(live.x - cx, live.z - cz) < 1.5 && live.y > heightAt(cx, cz) + TREE_HOUSE_H - 1.2) {
          sfx.chime();
          chime.current = 1;
          if (!live.smashed.treechime) pay(5, "The chime answered. Gran heard it.", "treechime");
        }
      }
    }
    if (chime.current > 0) chime.current -= dt;
    const pile = { x: TREE_TRUNK.x - 2.8, z: TREE_TRUNK.z + 3.6 };
    const piled = Math.hypot(live.x - pile.x, live.z - pile.z);
    if (piled < 1.45 && live.landSquash > 0.25 && live.boostY < 2) {
      live.boostY = 11;
      live.landSquash = 0;
      sfx.jump();
      if (!live.smashed.leafpile) pay(5, "A pile of leaves. It throws you.", "leafpile");
    }
    if (!bramOut && live.playT > 14) setBramOut(true);
    if (!selaOut && live.playT > 28) setSelaOut(true);
    const far = Math.hypot(live.x - TREE_TRUNK.x, live.z - TREE_TRUNK.z);
    if (far > 88) live.awayFar = true;
    if (live.awayFar && far < 18 && !live.house) {
      live.awayFar = false;
      live.homecoming = true;
      useGame.getState().healAll();
      sfx.heal();
      if (!live.smashed.homesoup) {
        pay(8, "Gran had the kettle on. Hearts filled.", "homesoup");
        const g = useGame.getState();
        if ((g.quests?.homesoup ?? 0) < 1) g.setQuest("homesoup", 1);
        if (live.smashed.homeflower && live.smashed.homehorse && live.smashed.givebram) {
          if (g.grantHeartContainer("home")) revealItem("container");
        }
      }
    }
  });
  return (
    <group>
      <group position={[sx, sy, sz]}>
        <mesh position={[-0.55, 2.2, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.05, 3.6, 5]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
        <mesh position={[0.55, 2.2, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.05, 3.6, 5]} />
          <meshLambertMaterial color="#6a4a28" />
        </mesh>
        <group ref={seat} position={[0, 3.8, 0]}>
          <mesh position={[0, -1.55, 0]} castShadow>
            <boxGeometry args={[0.85, 0.07, 0.32]} />
            <meshLambertMaterial color="#c9a227" />
          </mesh>
        </group>
      </group>
      <group position={[TREE_HOME.x + 1.8, heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H + 1.55, TREE_HOME.z - 1.4]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[(i - 1) * 0.16, -0.35, 0]} rotation={[0.2, 0, 0.1 * i]}>
            <cylinderGeometry args={[0.04, 0.05, 0.55, 5]} />
            <meshLambertMaterial color="#c9a227" />
          </mesh>
        ))}
      </group>
      <KickToy x0={TREE_TRUNK.x + 2.2} z0={TREE_TRUNK.z + 2.6} id="treepine" color="#6a4a28" r={0.13} />
      <KickToy x0={TREE_TRUNK.x - 1.4} z0={TREE_TRUNK.z + 1.8} id="treepine2" color="#5a3a20" r={0.11} />
      <mesh position={[picnic.x, heightAt(picnic.x, picnic.z) + 0.18, picnic.z]} castShadow>
        <boxGeometry args={[0.55, 0.28, 0.4]} />
        <meshLambertMaterial color="#8a5a28" />
      </mesh>
      {pearGone ? null : (
        <mesh position={[picnic.x, heightAt(picnic.x, picnic.z) + 0.38, picnic.z]} castShadow>
          <sphereGeometry args={[0.12, 7, 6]} />
          <meshLambertMaterial color="#c45c38" />
        </mesh>
      )}
      <mesh position={[hammock.x, heightAt(hammock.x, hammock.z) + TREE_HOUSE_H - 0.55, hammock.z]} rotation={[0.15, 0.4, 0.08]} castShadow>
        <boxGeometry args={[1.6, 0.06, 0.55]} />
        <meshLambertMaterial color="#6a4a88" />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={i}
          position={[
            TREE_TRUNK.x + Math.sin(i * 1.7) * 1.3,
            heightAt(TREE_TRUNK.x, TREE_TRUNK.z) + 0.08 + (leaves.current > 0 ? 0.4 + (i % 4) * 0.2 : 0),
            TREE_TRUNK.z + Math.cos(i * 1.3) * 1.3,
          ]}
        >
          <sphereGeometry args={[0.07, 4, 3]} />
          <meshLambertMaterial color={i % 2 ? "#3d8a42" : "#c45c38"} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={`pile${i}`}
          position={[
            TREE_TRUNK.x - 2.8 + Math.sin(i * 2.1) * 0.55,
            heightAt(TREE_TRUNK.x - 2.8, TREE_TRUNK.z + 3.6) + 0.12 + (i % 3) * 0.08,
            TREE_TRUNK.z + 3.6 + Math.cos(i * 1.6) * 0.5,
          ]}
          castShadow
        >
          <sphereGeometry args={[0.22, 5, 4]} />
          <meshLambertMaterial color={i % 2 ? "#3d8a42" : "#2e6a32"} />
        </mesh>
      ))}
      {bramOut ? (
        <N64Person
          id="bram"
          look={{ ...HERO_LOOK, tunic: "#3a5a88", hair: "#5c3a22", pants: "#3a3228", kit: "vest", eyeShape: "round" }}
          x={TREE_LADDER.x + 1.5}
          z={TREE_LADDER.z + 1.8}
          facing={2.4}
          kid
          stay
        />
      ) : null}
      {selaOut ? (
        <N64Person
          id="sela"
          look={{
            ...HERO_LOOK,
            tunic: "#8a3a58",
            hair: "#4a3220",
            pants: "#8a3a58",
            kit: "dress",
            longHair: true,
            lashes: "long",
            eyeShape: "round",
          }}
          x={TREE_TRUNK.x + 6.2}
          z={TREE_TRUNK.z + 5.4}
          facing={3.6}
          kid
          stay
        />
      ) : null}
      <HomeFrog />
      <HomeHen />
      <HomeStick />
      <HomeCart />
      <TreeApples />
      <HomeHoop />
      <PathPuddle />
      <HomeLog />
      <HomeGlow />
      <HomeBirds />
      <HomeCreek />
      <HomeFlowers />
      <N64Sign x={TREE_TRUNK.x + 11.2} z={TREE_TRUNK.z + 14.5} />
    </group>
  );
}

function HomeFrog() {
  const g = useRef<THREE.Group>(null);
  const home = { x: TREE_TRUNK.x + 4.2, z: TREE_TRUNK.z + 4.8 };
  useFrame(() => {
    if (!g.current) return;
    if (live.carry === "frog") {
      g.current.visible = false;
      return;
    }
    g.current.visible = true;
    const hop = Math.sin(live.playT * 7) > 0.72 ? 0.18 : 0;
    g.current.position.set(home.x, heightAt(home.x, home.z) + 0.1 + hop, home.z);
    const d = Math.hypot(live.x - home.x, live.z - home.z);
    if (d < 1.65 && !live.mounted && !live.house && !live.carry) live.nearPet = "frog";
  });
  return (
    <group ref={g} position={[home.x, heightAt(home.x, home.z), home.z]}>
      <mesh>
        <sphereGeometry args={[0.11, 6, 5]} />
        <meshLambertMaterial color="#3d8a42" />
      </mesh>
      <mesh position={[0.08, 0.06, 0.07]}>
        <sphereGeometry args={[0.035, 5, 4]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
    </group>
  );
}

function HomeHen() {
  const home = { x: TREE_TRUNK.x + 7.2, z: TREE_TRUNK.z + 1.6 };
  const g = useRef<THREE.Group>(null);
  const id = "homehen";
  useFrame(({ clock }) => {
    if (!g.current) return;
    if (live.carry === "cucco" && live.carryId === id) {
      g.current.visible = false;
      live.chickens[id] = { x: live.x, z: live.z, r: 0.55 };
      return;
    }
    g.current.visible = true;
    const t = clock.elapsedTime * 0.7;
    const x = home.x + Math.sin(t) * 0.7;
    const z = home.z + Math.cos(t * 0.8) * 0.5;
    g.current.position.set(x, heightAt(x, z), z);
    g.current.rotation.y = t;
    live.chickens[id] = { x, z, r: 0.55 };
  });
  return (
    <group ref={g} position={[home.x, heightAt(home.x, home.z), home.z]}>
      <mesh position={[0, 0.22, 0]} scale={[1, 0.85, 1.15]} castShadow>
        <sphereGeometry args={[0.16, 6, 5]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0, 0.34, 0.14]} castShadow>
        <sphereGeometry args={[0.08, 5, 4]} />
        <meshLambertMaterial color="#efe6d4" />
      </mesh>
      <mesh position={[0, 0.4, 0.2]} rotation={[0.6, 0, 0]}>
        <coneGeometry args={[0.03, 0.08, 4]} />
        <meshLambertMaterial color="#c45c38" />
      </mesh>
    </group>
  );
}

function HomeStick() {
  const home = { x: TREE_TRUNK.x + 3.2, z: TREE_TRUNK.z - 1.8 };
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!g.current) return;
    if (live.carry === "stick") {
      g.current.visible = false;
      return;
    }
    g.current.visible = true;
    const d = Math.hypot(live.x - home.x, live.z - home.z);
    if (d < 1.55 && !live.mounted && !live.house && !live.carry) live.nearPet = "stick";
  });
  return (
    <group ref={g} position={[home.x, heightAt(home.x, home.z) + 0.08, home.z]} rotation={[0.2, 0.4, 1.2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.025, 0.032, 0.72, 5]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
    </group>
  );
}

function HomeCart() {
  const pos = useRef({ x: TREE_LADDER.x + 3.4, z: TREE_LADDER.z + 4.2 });
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (live.house) return;
    if (live.pathCart) {
      pos.current.x = live.x;
      pos.current.z = live.z;
      if (!live.smashed.pathcart) pay(6, "A cart. Jump hops off.", "pathcart");
    } else {
      const d = Math.hypot(live.x - pos.current.x, live.z - pos.current.z);
      if (d < 1.15 && !live.mounted && !live.balloonRide && !live.townSheep && live.sheepRide < 0 && consumeTalk()) {
        live.pathCart = true;
        sfx.ok();
      }
    }
    if (g.current) g.current.position.set(pos.current.x, heightAt(pos.current.x, pos.current.z) + 0.28, pos.current.z);
  });
  return (
    <group ref={g} position={[pos.current.x, 2, pos.current.z]}>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[1.05, 0.42, 1.55]} />
        <meshLambertMaterial color="#8a5a28" />
      </mesh>
      {([-0.42, 0.42] as const).map((x) =>
        ([-0.48, 0.48] as const).map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.22, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.12, 8]} />
            <meshLambertMaterial color="#3a2818" />
          </mesh>
        )),
      )}
    </group>
  );
}

function HomeHoop() {
  const pos = useRef({ x: TREE_TRUNK.x + 8.4, z: TREE_TRUNK.z + 10.2, vx: 0, vz: 0, spin: 0, hung: false });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    const p = pos.current;
    const post = { x: TREE_TRUNK.x + 11.2, z: TREE_TRUNK.z + 14.5 };
    if (p.hung) {
      g.current.position.set(post.x, heightAt(post.x, post.z) + 1.15, post.z);
      g.current.rotation.x = Math.PI / 2;
      return;
    }
    const d = Math.hypot(live.x - p.x, live.z - p.z);
    if (!live.house && !live.mounted && Math.abs(live.speed) > 2.2 && d < 1.05) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      p.vx = fx * Math.min(16, 6 + Math.abs(live.speed));
      p.vz = fz * Math.min(16, 6 + Math.abs(live.speed));
      sfx.thud();
      if (!live.smashed.homehoop) pay(5, "A hoop. It rolls if you kick it.", "homehoop");
    }
    p.x += p.vx * dt;
    p.z += p.vz * dt;
    p.vx *= Math.exp(-dt * 0.7);
    p.vz *= Math.exp(-dt * 0.7);
    p.spin += Math.hypot(p.vx, p.vz) * dt * 2.4;
    if (Math.hypot(p.x - post.x, p.z - post.z) < 0.72 && Math.hypot(p.vx, p.vz) > 1.2) {
      p.hung = true;
      p.vx = 0;
      p.vz = 0;
      sfx.ok();
      if (!live.smashed.hoopsign) pay(8, "It stuck on the sign.", "hoopsign");
    }
    g.current.position.set(p.x, heightAt(p.x, p.z) + 0.42, p.z);
    g.current.rotation.x = p.spin;
  });
  return (
    <group ref={g} position={[pos.current.x, 1, pos.current.z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.42, 0.05, 6, 12]} />
        <meshLambertMaterial color="#8a5a28" />
      </mesh>
    </group>
  );
}

function PathPuddle() {
  const x = TREE_TRUNK.x + 9.6;
  const z = TREE_TRUNK.z + 18;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    if (d < 1.35 && Math.abs(live.speed) > 3) {
      live.wetT = Math.max(live.wetT, 3.2);
      if (!live.smashed.pathpuddle) pay(4, "A puddle on the way to town. You made a splash.", "pathpuddle");
    }
  });
  return (
    <mesh position={[x, y + 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.15, 10]} />
      <meshLambertMaterial color="#4a7a88" transparent opacity={0.55} />
    </mesh>
  );
}

function HomeLog() {
  const creekZ = TREE_TRUNK.z + 22.5;
  const creekX = TREE_TRUNK.x + 10.4;
  const pos = useRef({ x: creekX, z: creekZ + 4.2, vx: 0, vz: 0, a: 0 });
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    const p = pos.current;
    const across = Math.abs(live.x - p.x);
    const along = Math.abs(live.z - p.z);
    if (!live.house && !live.mounted && Math.abs(live.speed) > 1.6 && across < 1.05 && along < 3.4) {
      const fx = -Math.sin(live.yaw);
      const fz = -Math.cos(live.yaw);
      p.vx = fx * Math.min(12, 4 + Math.abs(live.speed) * 0.7);
      p.vz = fz * Math.min(12, 4 + Math.abs(live.speed) * 0.7);
    }
    p.x += p.vx * dt;
    p.z += p.vz * dt;
    p.vx *= Math.exp(-dt * 0.85);
    p.vz *= Math.exp(-dt * 0.85);
    p.a += Math.hypot(p.vx, p.vz) * dt * 1.6;
    p.x = Math.max(creekX - 4, Math.min(creekX + 4, p.x));
    live.logAt = { x: p.x, z: p.z };
    const inWater = Math.abs(p.z - creekZ) < 2.6 && Math.abs(p.x - creekX) < 5.2;
    if (inWater && Math.hypot(p.vx, p.vz) < 0.5 && !live.smashed.logbridge) {
      pay(8, "", "logbridge");
    }
    const y = heightAt(p.x, p.z) + (inWater ? 0.14 : 0.26);
    g.current.position.set(p.x, y, p.z);
    g.current.rotation.x = p.a;
  });
  return (
    <group ref={g} position={[pos.current.x, 1, pos.current.z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.26, 6.2, 8]} />
        <meshLambertMaterial color="#6a4a28" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0, s * 3.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.08, 8]} />
          <meshLambertMaterial color="#4a3220" />
        </mesh>
      ))}
    </group>
  );
}

function HomeGlow() {
  const g = useRef<THREE.Group>(null);
  const caught = useRef(0);
  useFrame(({ clock }) => {
    if (!g.current || live.house) return;
    const t = clock.elapsedTime;
    g.current.children.forEach((c, i) => {
      c.position.set(Math.sin(t * 0.8 + i) * 1.4, 0.7 + Math.sin(t * 2.2 + i) * 0.35, Math.cos(t * 0.7 + i * 1.3) * 1.4);
    });
    const d = Math.hypot(live.x - (TREE_TRUNK.x + 2), live.z - (TREE_TRUNK.z + 6));
    if (d < 2.2 && !live.grounded && live.stompT > 0) {
      caught.current += 1;
      if (caught.current >= 1 && !live.smashed.homeglow) pay(5, "You caught a glow bug. It flew off anyway.", "homeglow");
    }
  });
  return (
    <group ref={g} position={[TREE_TRUNK.x + 2, heightAt(TREE_TRUNK.x, TREE_TRUNK.z) + 0.8, TREE_TRUNK.z + 6]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.045, 5, 4]} />
          <meshLambertMaterial color="#e8e080" emissive="#e8e080" emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function HomeBirds() {
  const g = useRef<THREE.Group>(null);
  const scare = useRef(0);
  const home = { x: TREE_TRUNK.x + 1.2, z: TREE_TRUNK.z - 2.4 };
  useFrame((_, dt) => {
    if (!g.current || live.house) return;
    const d = Math.hypot(live.x - home.x, live.z - home.z);
    if (live.ocarina && d < 8) {
      scare.current = 0;
      if (!live.smashed.homebirds) pay(4, "You played. The birds sat down to listen.", "homebirds");
    } else if (d < 2.4 && (Math.abs(live.speed) > 7 || live.rolling || live.stompT > 0)) {
      if (scare.current <= 0 && !live.smashed.homebirds) pay(4, "The birds had a meeting. You ended it.", "homebirds");
      scare.current = 2.6;
    }
    if (scare.current > 0) scare.current -= dt;
    g.current.children.forEach((c, i) => {
      const t = live.playT * (scare.current > 0 && !live.ocarina ? 5 : 1.1) + i;
      const r = live.ocarina ? 0.4 : scare.current > 0 ? 4 + scare.current : 0.7;
      c.position.set(Math.cos(t) * r, 0.7 + (scare.current > 0 && !live.ocarina ? scare.current * 1.2 : Math.sin(t * 2) * 0.12), Math.sin(t) * r);
    });
  });
  return (
    <group ref={g} position={[home.x, heightAt(home.x, home.z), home.z]}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.055, 5, 4]} />
          <meshLambertMaterial color={i % 2 ? "#2a2018" : "#c45c38"} />
        </mesh>
      ))}
    </group>
  );
}

function HomeCreek() {
  const x = TREE_TRUNK.x + 10.4;
  const z = TREE_TRUNK.z + 22.5;
  const y = heightAt(x, z);
  useFrame(() => {
    if (live.house) return;
    const d = Math.abs(live.z - z);
    const along = Math.abs(live.x - x);
    if (along < 5.2 && d < 2.7) {
      const onLog = live.logAt && Math.abs(live.x - live.logAt.x) < 0.72 && Math.abs(live.z - live.logAt.z) < 3.2;
      if (!onLog) {
        live.wetT = Math.max(live.wetT, 2.8);
        if (live.carry === "frog") {
          live.carry = null;
          live.carryId = null;
          sfx.ok();
          if (!live.smashed.frogfish) pay(8, "", "frogfish");
        }
      }
    }
  });
  return (
    <group>
      <mesh position={[x, y + 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10.4, 5.4]} />
        <meshLambertMaterial color="#4a8898" transparent opacity={0.62} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[x, y + 0.08, z + s * 2.7]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10.6, 0.55]} />
          <meshLambertMaterial color="#5a4a32" />
        </mesh>
      ))}
    </group>
  );
}

function HomeFlowers() {
  const spots = useRef(
    [0, 1, 2, 3, 4, 5].map((i) => ({
      x: TREE_TRUNK.x + 5.5 + Math.sin(i * 1.7) * 2.4,
      z: TREE_TRUNK.z + 7.2 + Math.cos(i * 1.3) * 2.2,
      gone: false,
    })),
  );
  const [, bump] = useState(0);
  useFrame(() => {
    if (live.house) return;
    for (const f of spots.current) {
      if (f.gone) continue;
      const d = Math.hypot(live.x - f.x, live.z - f.z);
      if (d < 1.15 && !live.mounted && !live.carry) live.nearPet = "flower";
      if (d < 0.95 && live.carry === "flower") {
        f.gone = true;
        if (!live.smashed.homeflower) pay(4, "A wildflower. Someone might want it.", "homeflower");
        bump((n) => n + 1);
        break;
      }
    }
  });
  return (
    <group>
      {spots.current.map((f, i) =>
        f.gone ? null : (
          <mesh key={i} position={[f.x, heightAt(f.x, f.z) + 0.12, f.z]} castShadow>
            <sphereGeometry args={[0.09, 6, 5]} />
            <meshLambertMaterial color={i % 2 ? "#c45c88" : "#e8d48a"} />
          </mesh>
        ),
      )}
    </group>
  );
}

function TreeApples() {
  const kite = useRef(Boolean(live.hat === "kite"));
  const spots = useRef([
    { x: TREE_TRUNK.x + 1.6, z: TREE_TRUNK.z + 1.1, gone: false },
    { x: TREE_TRUNK.x - 0.8, z: TREE_TRUNK.z + 2.2, gone: false },
    { x: TREE_TRUNK.x + 0.4, z: TREE_TRUNK.z - 1.6, gone: false },
  ]);
  const [, bump] = useState(0);
  useFrame(() => {
    if (live.house) return;
    if (!kite.current) {
      const kx = TREE_HOME.x - 2.4;
      const kz = TREE_HOME.z - 0.6;
      const d = Math.hypot(live.x - kx, live.z - kz);
      if (d < 1.35 && live.y > heightAt(kx, kz) + TREE_HOUSE_H - 1.4) {
        kite.current = true;
        live.hat = "kite";
        sfx.ok();
        if (!live.smashed.homekite) pay(6, "A kite in the leaves. Jump and it holds you.", "homekite");
        bump((n) => n + 1);
      }
    }
    for (const a of spots.current) {
      if (a.gone) continue;
      const d = Math.hypot(live.x - a.x, live.z - a.z);
      if (d < 0.95 || (live.swinging && live.carry === "stick" && d < 1.85) || ((live.rolling || live.slash) && d < 2.4) || (live.booms.some((b) => Math.hypot(b.x - a.x, b.z - a.z) < 1.6))) {
        a.gone = true;
        useGame.getState().healGrass();
        sfx.ok();
        if (!live.smashed.treeapple) pay(5, "A tree apple. Still a bit leafy.", "treeapple");
        bump((n) => n + 1);
      }
    }
  });
  return (
    <group>
      {spots.current.map((a, i) =>
        a.gone ? null : (
          <mesh key={i} position={[a.x, heightAt(a.x, a.z) + 0.16, a.z]} castShadow>
            <sphereGeometry args={[0.13, 7, 6]} />
            <meshLambertMaterial color="#c45c38" />
          </mesh>
        ),
      )}
      {kite.current ? null : (
        <mesh position={[TREE_HOME.x - 2.4, heightAt(TREE_HOME.x, TREE_HOME.z) + TREE_HOUSE_H + 1.1, TREE_HOME.z - 0.6]} rotation={[0.4, 0.2, 0.3]} castShadow>
          <boxGeometry args={[0.55, 0.7, 0.04]} />
          <meshLambertMaterial color="#c45c38" />
        </mesh>
      )}
    </group>
  );
}

export function TreasureChest({
  id,
  x,
  z,
  open,
  size = "small",
}: {
  id: string;
  x: number;
  z: number;
  open: boolean;
  size?: "big" | "small";
}) {
  const lid = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Group>(null);
  const wink = useRef<THREE.PointLight>(null);
  const ang = useRef(open ? 1 : 0);
  const y = heightAt(x, z);
  const s = size === "big" ? 1.62 : 1.18;
  useFrame((_, dt) => {
    const mine = Boolean(
      live.chestOpen && (id ? live.chestOpen.id === id : Math.hypot(live.chestOpen.x - x, live.chestOpen.z - z) < 0.45),
    );
    ang.current += ((open || mine ? 1 : 0) - ang.current) * (1 - Math.exp(-dt * 5.5));
    if (lid.current) lid.current.rotation.x = -ang.current * 1.85;
    if (glow.current) {
      const t = mine && live.chestOpen ? live.chestOpen.t : 0;
      const shine = mine && t > 0 && t < 2.4 ? Math.min(1, t * 2.4) * Math.max(0, 1 - (t - 1.15) / 1.25) : 0;
      glow.current.visible = shine > 0.02;
      glow.current.scale.setScalar(0.7 + shine * 0.8);
    }
    if (wink.current) wink.current.intensity = open || mine ? 0 : 0.35 + Math.sin(performance.now() * 0.003) * 0.18;
  });
  return (
    <group position={[x, y, z]} scale={[s, s, s]}>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[0.72, 0.82, 0.12, 8]} />
        <meshLambertMaterial color="#6a6458" />
      </mesh>
      {[-0.55, 0.55].map((ox) =>
        [-0.4, 0.4].map((oz) => (
          <mesh key={`${ox}${oz}`} position={[ox, 0.08, oz]} castShadow>
            <boxGeometry args={[0.16, 0.12, 0.16]} />
            <meshLambertMaterial color="#5a554c" />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.86, 0.46, 0.58]} />
        <meshLambertMaterial color={size === "big" ? "#7a4e22" : "#6a4a24"} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.92, 0.08, 0.64]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[0.9, 0.06, 0.62]} />
        <meshLambertMaterial color="#c9a227" />
      </mesh>
      {size === "big" ? (
        <mesh position={[0, 0.28, 0.31]}>
          <boxGeometry args={[0.34, 0.2, 0.1]} />
          <meshLambertMaterial color="#e8d48a" />
        </mesh>
      ) : (
        <mesh position={[0, 0.22, 0.3]}>
          <boxGeometry args={[0.2, 0.14, 0.08]} />
          <meshLambertMaterial color="#e8d48a" />
        </mesh>
      )}
      <mesh position={[0, 0.22, 0.35]}>
        <sphereGeometry args={[0.035, 8, 6]} />
        <meshLambertMaterial color="#8a6a20" />
      </mesh>
      <group ref={lid} position={[0, 0.44, -0.24]}>
        <mesh position={[0, 0.1, 0.24]} castShadow>
          <boxGeometry args={[0.86, 0.2, 0.58]} />
          <meshLambertMaterial color={size === "big" ? "#9a642c" : "#8a5a28"} />
        </mesh>
        <mesh position={[0, 0.1, 0.24]}>
          <boxGeometry args={[0.7, 0.06, 0.62]} />
          <meshLambertMaterial color="#c9a227" />
        </mesh>
        <mesh position={[0, 0.1, 0.52]}>
          <boxGeometry args={[0.24, 0.1, 0.08]} />
          <meshLambertMaterial color="#e8d48a" />
        </mesh>
      </group>
      <group ref={glow} visible={false} position={[0, 0.55, 0]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.22, 3.4, 8]} />
          <meshBasicMaterial color="#fff4c0" transparent opacity={0.45} depthWrite={false} />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.28, 8, 6]} />
          <meshBasicMaterial color="#ffe9a0" transparent opacity={0.55} depthWrite={false} />
        </mesh>
        <pointLight color="#ffe7a0" intensity={8} distance={7} />
      </group>
      <pointLight ref={wink} color="#ffe08a" intensity={0} distance={2.4} position={[0, 0.55, 0.2]} />
    </group>
  );
}
