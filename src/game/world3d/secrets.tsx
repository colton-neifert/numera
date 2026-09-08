import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, vWorld, POLE_CHEST, POND, WATER_Y, isDeepDungeon, fieldActors, DOCK, ECHO_GLADE, blownRocks, rockGone, COW_PAD, FAIRY_RING, PICNIC_AT, FAR_POND, LONELY_CHEST, KEEP_OUT, PIG_AT, BALLOON_AT, BOTTLE_AT, GOAT_AT, SHROOM_AT, BEE_AT, KITE_AT, RABBIT_AT, CAMP_AT, SHEEP_AT, SNOW_AT, STAR_HILL, GIANT_AT, ICE_AT, OWL_AT, BUSH_AT, CRATE_AT, TALK_TREE, FLAG_AT, DESERT_AT, BELL_AT, LOG_AT } from "./field";
import { live } from "./live";
import { bunkSpots, HOUSES, houseSize } from "./house";
import { sfx } from "../audio";
import { revealItem } from "../items";
import { useGame } from "../store";
import { playerMaxHp } from "../content";
import { isChestOpen } from "./puzzles";
import { npcsIn } from "../dialogue";
import type { WorldId } from "../types";
import { RupeeMesh, HeartContainerMesh } from "./actors";
import { puffAt } from "./fx";
import { consumeTalk } from "../input";

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
    if (!live.talking || !live.talkNpc) return;
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
    if (d < 1.6 && !live.house && !ate.current) {
      live.hint = "Someone left pie. F to eat it";
      if (consumeTalk()) {
        ate.current = true;
        secretTake("picnic-pie");
        useGame.getState().healGrass();
        useGame.getState().healGrass();
        sfx.ok();
        live.hint = "Cold pie. Still good.";
        bump((n) => n + 1);
      }
    }
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
      spin.current.position.y = heightAt(x, z) + 9.1 + Math.sin(clock.elapsedTime * 2) * 0.08;
    }
    if (live.house) return;
    const d = Math.hypot(live.x - x, live.z - z);
    const roof = heightAt(x, z) + 7.2;
    if (d < 4.5 && live.y < roof && !live.mounted) live.hint = "The mill roof looks climbable.";
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
    <group ref={spin} position={[x, heightAt(x, z) + 9.1, z]}>
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
      if (dist < 1.8) live.hint = "The duck quacked at you.";
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
    if (!lit.current) {
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
      if (!live.night) live.hint = "A sleeping owl.";
      else {
        live.hint = live.songOk ? "The owl likes that song." : "An owl. F to hoot at it";
        if (live.songOk && !live.smashed.owl) {
          live.smashed.owl = true;
          const n = useGame.getState().addCoins(10);
          if (n > 0) revealItem("coin");
          sfx.hoot();
          live.hint = "The owl dropped a rupee.";
        } else if (consumeTalk()) {
          sfx.hoot();
          live.hint = "You hooted. It hooted back.";
        }
      }
    }
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
      live.hint = "A rupee on the crates.";
      sfx.chime();
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
  if (broke.current) return null;
  return (
    <group ref={g} position={[x, y, z]}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.7, 0.55, 0.7]} />
        <meshLambertMaterial color="#8a6a40" />
      </mesh>
      <mesh position={[0.08, 0.82, -0.05]} castShadow>
        <boxGeometry args={[0.55, 0.5, 0.55]} />
        <meshLambertMaterial color="#7a5a32" />
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
        live.hint = "The bell rang.";
        if (n.current === 3 && !live.smashed.bell) {
          live.smashed.bell = true;
          const c = useGame.getState().addCoins(10);
          if (c > 0) revealItem("coin");
          live.hint = "Three rings. Something fell out.";
        }
      }
    } else if (d < 1.5 && !live.house) live.hint = "A bell. F or slash";
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
