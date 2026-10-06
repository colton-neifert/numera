import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, WELL_AT } from "./field";
import { live } from "./live";
import { sfx, playFanfare } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { takeCipher } from "../cipher";
import { addTrapSpot } from "./dungeonTraps";
import { consumeTalk as consumeTalkRaw } from "../input";
import { lamb } from "./mats";
import { N64Sign, HeartContainerMesh } from "./actors";
import { N64Foe, type FangPose } from "./n64";
import { puffAt, crackAt } from "./fx";
import {
  Q,
  STONES,
  MOSAIC,
  HOLLOW_HOMES,
  HALL,
  ROOT_EXITS,
  quietRoom,
  setQuietRoom,
  qn,
  setQ,
  hasSteel,
  hallOpen,
  hallHasKey,
  takeHallKey,
  hallEastDone,
  crackOpen,
  smashCrack,
  tangWallOpen,
  smashTangWall,
  strikeStone,
  mosaicPush,
  hallPush,
  inHollow,
  lanternTrail,
  hydrateQuiet,
} from "./quiet";
import { QH } from "./lands";

function talkOk() {
  if (live.nearNpc || live.nearHouse || live.nearChest || live.nearHorse) return false;
  return consumeTalkRaw();
}

function pay(n: number, key: string) {
  if (live.smashed[key]) return;
  live.smashed[key] = true;
  const c = useGame.getState().addCoins(n);
  if (c > 0) revealItem("coin");
  sfx.ok();
}

function fadeWarp(
  going: { current: "" | "in" | "out" },
  t: { current: number },
  dt: number,
  onMid: (dir: "in" | "out") => void,
) {
  if (!going.current) return;
  t.current += dt;
  const u = Math.min(1, t.current / 1.05);
  if (u < 0.5) live.roomFade = u / 0.5;
  else {
    live.roomFade = 1 - (u - 0.5) / 0.5;
    live.roomFadeOut = true;
  }
  live.speed = 0;
  if (u > 0.48 && u < 0.56) onMid(going.current);
  if (u >= 1) {
    going.current = "";
    live.roomFade = 0;
    live.roomFadeOut = false;
  }
}

let hallPadOn = -1;

export function QuietPlay() {
  const boot = useRef(false);
  if (!boot.current) {
    boot.current = true;
    hydrateQuiet();
  }
  return (
    <group>
      <QuietGround />
      <FourStones />
      <ClothMosaic />
      <LanternWalk />
      <QuietHollow />
      <RootRoads />
      <UncountedHall />
      <RemainderBoss />
      <BladePieces />
      <WellFourth />
    </group>
  );
}

function QuietGround() {
  const geo = useMemo(() => {
    const size = 96;
    const segs = 36;
    const g = new THREE.PlaneGeometry(size, size, segs, segs);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + QH.x;
      const z = pos.getZ(i) + QH.z;
      pos.setX(i, x);
      pos.setZ(i, z);
      pos.setY(i, heightAt(x, z));
      const d = Math.hypot(x - QH.x, z - QH.z);
      const u = Math.max(0, 1 - d / 48);
      col[i * 3] = 0.28 + u * 0.1;
      col[i * 3 + 1] = 0.38 + u * 0.08;
      col[i * 3 + 2] = 0.18 + u * 0.04;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}

function StoneMesh({ x, z, pip, struck }: { x: number; z: number; pip: number; struck: boolean }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.72, 2.3, 7]} />
        {lamb(struck ? "#8a7a58" : "#6a6458")}
      </mesh>
      <mesh position={[0, 2.28, 0.42]} rotation={[0.1, 0, 0]}>
        <circleGeometry args={[0.22, 8]} />
        <meshLambertMaterial
          color={pip === 0 ? "#2a2420" : "#c9a227"}
          emissive={struck ? "#c9a227" : "#000000"}
          emissiveIntensity={struck ? 0.55 : 0}
        />
      </mesh>
      {pip > 0
        ? Array.from({ length: pip }, (_, i) => (
            <mesh key={i} position={[-0.12 + (i % 2) * 0.18, 2.28, 0.46 + Math.floor(i / 2) * 0.12]}>
              <sphereGeometry args={[0.045, 6, 5]} />
              {lamb("#c9a227")}
            </mesh>
          ))
        : null}
    </group>
  );
}

function FourStones() {
  const bits = useRef(qn("qStone"));
  useFrame(() => {
    if (live.house || quietRoom()) return;
    bits.current = qn("qStone");
    for (const s of STONES) {
      const d = Math.hypot(live.x - s.x, live.z - s.z);
      if (d < 2.2) {
        const hit = Boolean(bits.current & s.bit);
        if (!live.listen) {
          live.listen = hit
            ? s.pip
              ? `A stone. ${s.pip} mark${s.pip > 1 ? "s" : ""}. It already rang.`
              : "A stone with no mark. It already rang."
            : s.pip
              ? `A standing stone. ${s.pip} small pit${s.pip > 1 ? "s" : ""}.`
              : "A standing stone. The face is blank. Someone scraped it.";
        }
        if (live.slash && Math.hypot(live.slash.x - s.x, live.slash.z - s.z) < 1.6 && !hit) {
          const next = strikeStone(s.bit);
          bits.current = next;
          sfx.ok();
          puffAt(s.x, s.z, heightAt(s.x, s.z) + 1.4);
          if (next === 15) {
            live.listen = "Somewhere far south, stone answered.";
            takeCipher("four-stones", true);
            setQ("qStones", 1);
          } else {
            live.listen = s.pip ? "The stone rang once." : "The blank one rang anyway.";
          }
        }
      }
    }
  }, 1);
  return (
    <group>
      {STONES.map((s) => (
        <StoneMesh key={s.id} x={s.x} z={s.z} pip={s.pip} struck={Boolean(bits.current & s.bit)} />
      ))}
    </group>
  );
}

function ClothMosaic() {
  const glow = useRef<(THREE.MeshLambertMaterial | null)[]>([]);
  const onPad = useRef(-1);
  useFrame(() => {
    if (live.house || quietRoom()) return;
    const near = Math.hypot(live.x - Q.mosaic.x, live.z - Q.mosaic.z) < 9;
    if (near && !live.listen) {
      live.listen = qn("qMosaic")
        ? "The four pits remember."
        : live.dusk > 0.55
          ? "Four pits in the dirt. One does not shine."
          : "Four pits in the dirt. Three gold. One empty.";
    }
    let standing = -1;
    for (const p of MOSAIC) {
      const d = Math.hypot(live.x - p.x, live.z - p.z);
      if (d < 1.05 && live.grounded) standing = p.id;
    }
    if (standing >= 0 && onPad.current !== standing && qn("qMosaic") < 1) {
      onPad.current = standing;
      const p = MOSAIC[standing]!;
      const seq = mosaicPush(p.id);
      if (qn("qMosaic") >= 1) {
        live.listen = "The empty pit took a step. A mouth opened south.";
        sfx.ok();
        takeCipher("uncounted");
      } else if (seq.length === 0) {
        live.listen = "The pits went dark.";
      } else {
        live.listen = p.pip ? `${p.pip}.` : "The empty one.";
      }
    }
    if (standing < 0) onPad.current = -1;
    const night = live.dusk > 0.55;
    glow.current.forEach((m, i) => {
      if (!m) return;
      const on = MOSAIC[i]!.pip === 0 ? night : true;
      m.emissiveIntensity = on ? 0.45 + Math.sin(live.playT * 2 + i) * 0.12 : 0.05;
    });
    if (hallOpen()) addTrapSpot(HALL.door.x, HALL.door.z, 1.6, 0.08);
  }, -1);
  const y = heightAt(Q.mosaic.x, Q.mosaic.z);
  return (
    <group position={[Q.mosaic.x, y, Q.mosaic.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow>
        <circleGeometry args={[7.2, 14]} />
        {lamb("#5a4a38")}
      </mesh>
      {MOSAIC.map((p, i) => (
        <mesh key={p.id} position={[p.x - Q.mosaic.x, 0.1, p.z - Q.mosaic.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.05, 10]} />
          <meshLambertMaterial
            ref={(el) => {
              glow.current[i] = el;
            }}
            color={p.pip === 0 ? "#2a2420" : "#c9a227"}
            emissive={p.pip === 0 ? "#6a5030" : "#c9a227"}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
      {hallOpen() ? (
        <mesh position={[HALL.door.x - Q.mosaic.x, 0.02, HALL.door.z - Q.mosaic.z]}>
          <boxGeometry args={[2.6, 0.16, 2.2]} />
          {lamb("#1a1410")}
        </mesh>
      ) : null}
    </group>
  );
}

function LanternWalk() {
  const posts = useMemo(() => lanternTrail(), []);
  const lit = live.dusk > 0.42;
  return (
    <group>
      {posts.map((p, i) => {
        const y = heightAt(p.x, p.z);
        return (
          <group key={i} position={[p.x, y, p.z]}>
            <mesh position={[0, 1.15, 0]}>
              <cylinderGeometry args={[0.07, 0.1, 2.3, 6]} />
              {lamb("#4a3220")}
            </mesh>
            <mesh position={[0, 2.35, 0]}>
              <boxGeometry args={[0.28, 0.32, 0.28]} />
              <meshLambertMaterial
                color={lit ? "#e8b060" : "#5a4a30"}
                emissive={lit ? "#e07030" : "#000000"}
                emissiveIntensity={lit ? 0.8 : 0}
              />
            </mesh>
            {lit ? <pointLight position={[0, 2.4, 0]} intensity={1.6} distance={8} color="#ffb060" /> : null}
          </group>
        );
      })}
    </group>
  );
}

function QuietHollow() {
  const found = useRef(qn("qHollow") >= 1);
  useFrame(() => {
    if (live.house || quietRoom()) return;
    if (!inHollow(live.x, live.z)) return;
    if (!found.current) {
      found.current = true;
      setQ("qHollow", 1);
      takeCipher("quiet-hollow", true);
      live.listen = "A town that does not pay taxes. They look up, then away.";
      pay(5, "hollowin");
    }
    if (!live.listen) live.listen = "Quiet Hollow. They count past three here.";
  }, 1);
  const y = heightAt(QH.x, QH.z);
  return (
    <group>
      {HOLLOW_HOMES.map((h) => (
        <HollowHouse key={h.id} h={h} />
      ))}
      <mesh position={[QH.x, y + 0.08, QH.z + 9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.6, 12]} />
        {lamb("#4a6a32")}
      </mesh>
      <group position={[QH.x + 0.4, y, QH.z + 9.2]}>
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.7, 0.78, 0.7, 10]} />
          {lamb("#6a6458")}
        </mesh>
        <mesh position={[0, 1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.7, 10]} />
          {lamb("#8a8478")}
        </mesh>
      </group>
      <N64Sign x={QH.x - 2.2} z={QH.z + 14.4} />
      <QuietWellHint />
    </group>
  );
}

function QuietWellHint() {
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - (QH.x + 0.4), live.z - (QH.z + 9.2));
    if (d < 1.8 && !live.listen) live.listen = "Their well goes nowhere. Oakstead’s goes somewhere.";
  }, 1);
  return null;
}

function HollowHouse({ h }: { h: (typeof HOLLOW_HOMES)[number] }) {
  const y = heightAt(h.x, h.z);
  return (
    <group position={[h.x, y, h.z]} rotation={[0, h.yaw, 0]}>
      <mesh position={[0, h.h * 0.38, 0]} castShadow>
        <boxGeometry args={[h.w, h.h * 0.76, h.d]} />
        {lamb(h.color)}
      </mesh>
      <mesh position={[0, h.h * 0.88, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[h.w * 0.72, h.h * 0.55, 4]} />
        {lamb("#6a2820")}
      </mesh>
      <mesh position={[0, 1.05, h.d * 0.51]}>
        <boxGeometry args={[0.7, 1.5, 0.08]} />
        {lamb("#2a1810")}
      </mesh>
      <mesh position={[h.w * 0.28, 1.55, h.d * 0.51]}>
        <boxGeometry args={[0.45, 0.45, 0.06]} />
        <meshLambertMaterial color="#c9a227" emissive="#e07030" emissiveIntensity={live.dusk > 0.45 ? 0.7 : 0.05} />
      </mesh>
    </group>
  );
}

function RootRoads() {
  const going = useRef<"" | "in" | "out">("");
  const t = useRef(0);
  const dest = useRef<"well" | "wood" | "river" | "mosaic" | "in">("in");
  useFrame((_, dt) => {
    if (live.house) return;
    const room = quietRoom();
    const wellY = heightAt(WELL_AT.x, WELL_AT.z);
    const crackX = WELL_AT.x;
    const crackZ = WELL_AT.z - 0.95;
    const atCrack = Math.hypot(live.x - crackX, live.z - crackZ) < 0.72 && live.y > wellY - 0.5 && !live.climbing;
    const crackReady = (qn("qNoll") >= 1 || (useGame.getState().cipher ?? []).length >= 3 || qn("qHollow") >= 1) && !room;
    if (!going.current && !room && crackReady && atCrack) {
      going.current = "in";
      dest.current = "in";
      t.current = 0;
    }
    if (room === "roots" && !going.current) {
      addTrapSpot(WELL_AT.x, WELL_AT.z, 22, wellY - 4.35 - heightAt(live.x, live.z));
      const west = ROOT_EXITS.west;
      const east = ROOT_EXITS.east;
      const south = ROOT_EXITS.south;
      if (Math.hypot(live.x - west.x, live.z - west.z) < 1.3) {
        going.current = "out";
        dest.current = "wood";
        t.current = 0;
      } else if (Math.hypot(live.x - east.x, live.z - east.z) < 1.3) {
        going.current = "out";
        dest.current = "river";
        t.current = 0;
      } else if (Math.hypot(live.x - south.x, live.z - south.z) < 1.3) {
        going.current = "out";
        dest.current = "mosaic";
        t.current = 0;
      } else if (live.climbing === "rootup" && live.climbH > 4.6) {
        going.current = "out";
        dest.current = "well";
        t.current = 0;
      }
      if (!live.listen) live.listen = "Root roads. West woods. East water. South stones.";
    }
    fadeWarp(going, t, dt, (dir) => {
      if (dir === "in") {
        setQuietRoom("roots");
        live.x = WELL_AT.x;
        live.z = WELL_AT.z + 0.4;
        live.y = wellY - 4.2;
        live.climbing = null;
        setQ("qRoots", 1);
        takeCipher("root-roads");
        live.listen = "The well kept a road. Nobody mended it.";
      } else {
        setQuietRoom("");
        live.climbing = null;
        if (dest.current === "wood") {
          live.x = ROOT_EXITS.west.out.x;
          live.z = ROOT_EXITS.west.out.z;
        } else if (dest.current === "river") {
          live.x = ROOT_EXITS.east.out.x;
          live.z = ROOT_EXITS.east.out.z;
        } else if (dest.current === "mosaic") {
          live.x = ROOT_EXITS.south.out.x;
          live.z = ROOT_EXITS.south.out.z;
        } else {
          live.x = WELL_AT.x + 1.5;
          live.z = WELL_AT.z;
        }
        live.y = heightAt(live.x, live.z) + 0.2;
      }
    });
  }, 1);
  if (quietRoom() !== "roots") {
    const y = heightAt(WELL_AT.x, WELL_AT.z);
    const show = qn("qNoll") >= 1 || (useGame.getState().cipher ?? []).length >= 3 || qn("qHollow") >= 1;
    if (!show) return null;
    return (
      <mesh position={[WELL_AT.x, y - 0.4, WELL_AT.z - 0.85]}>
        <boxGeometry args={[0.7, 1.1, 0.08]} />
        {lamb("#1a1410")}
      </mesh>
    );
  }
  const y = heightAt(WELL_AT.x, WELL_AT.z) - 4.35;
  return (
    <group>
      <mesh position={[WELL_AT.x, y, WELL_AT.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.4, 12]} />
        {lamb("#2a2218")}
      </mesh>
      <mesh position={[WELL_AT.x, y, WELL_AT.z - 10]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.2, 22]} />
        {lamb("#2a2218")}
      </mesh>
      <mesh position={[WELL_AT.x, y, WELL_AT.z]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
        <planeGeometry args={[4.2, 44]} />
        {lamb("#241c14")}
      </mesh>
      {[
        [WELL_AT.x - 20, WELL_AT.z],
        [WELL_AT.x + 20, WELL_AT.z],
        [WELL_AT.x, WELL_AT.z - 20],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, y + 1.15, z]}>
          <boxGeometry args={[1.2, 2.2, 0.16]} />
          {lamb("#1a1410")}
        </mesh>
      ))}
      <pointLight position={[WELL_AT.x, y + 2.2, WELL_AT.z]} intensity={1.4} distance={14} color="#c9a227" />
    </group>
  );
}

function UncountedHall() {
  const going = useRef<"" | "in" | "out">("");
  const t = useRef(0);
  useFrame((_, dt) => {
    if (live.house) return;
    const room = quietRoom();
    const open = hallOpen();
    const dDoor = Math.hypot(live.x - HALL.door.x, live.z - HALL.door.z);
    if (!going.current && !room && open && dDoor < 1.25) {
      going.current = "in";
      t.current = 0;
    }
    if (!going.current && room === "hall" && dDoor < 1.2 && live.z > HALL.door.z + 0.4) {
      going.current = "out";
      t.current = 0;
    }
    fadeWarp(going, t, dt, (dir) => {
      if (dir === "in") {
        setQuietRoom("hall");
        live.x = HALL.hub.x;
        live.z = HALL.hub.z + 4;
        live.y = heightAt(Q.mosaic.x, Q.mosaic.z) + 0.2;
        setQ("qHall", 1);
        takeCipher("uncounted", true);
        live.listen = "The Uncounted Hall. Four mouths. One was filled in.";
      } else {
        setQuietRoom("");
        live.bossFight = false;
        live.bossLock = false;
        live.x = HALL.door.x;
        live.z = HALL.door.z + 2.2;
        live.y = heightAt(live.x, live.z) + 0.2;
      }
    });
    if (room !== "hall") return;
    const fy = heightAt(Q.mosaic.x, Q.mosaic.z) + 0.12;
    addTrapSpot(HALL.hub.x, HALL.hub.z, 8.2, fy - heightAt(live.x, live.z));
    addTrapSpot(HALL.east.x, HALL.east.z, 7, fy - heightAt(live.x, live.z));
    addTrapSpot(HALL.west.x, HALL.west.z, 7, fy - heightAt(live.x, live.z));
    addTrapSpot(HALL.boss.x, HALL.boss.z, 10.4, fy - heightAt(live.x, live.z));
    addTrapSpot(HALL.gold.x, HALL.gold.z, 5, fy - heightAt(live.x, live.z));

    const east = HALL.east;
    const pads = [
      { id: 0, x: east.x - 2.2, z: east.z + 1.6, pip: 1 },
      { id: 1, x: east.x + 2.2, z: east.z + 1.6, pip: 2 },
      { id: 2, x: east.x + 2.2, z: east.z - 1.6, pip: 3 },
      { id: 3, x: east.x - 2.2, z: east.z - 1.6, pip: 0 },
    ];
    if (!hallEastDone()) {
      let standing = -1;
      for (const p of pads) {
        if (Math.hypot(live.x - p.x, live.z - p.z) < 1.05 && live.grounded) standing = p.id;
      }
      if (standing >= 0 && hallPadOn !== standing) {
        hallPadOn = standing;
        const p = pads[standing]!;
        const seq = hallPush(p.id);
        if (hallEastDone()) {
          live.listen = "The east mouth liked the same order as the dirt.";
          sfx.ok();
        } else if (seq.length === 0) live.listen = "Wrong order. The pits forgot.";
        else live.listen = p.pip ? `${p.pip}.` : "Blank.";
      }
      if (standing < 0) hallPadOn = -1;
    }

    if (!crackOpen()) {
      const cx = HALL.west.x - 4.4;
      const cz = HALL.west.z;
      if (live.lastBoom && live.playT - live.lastBoom.t < 0.25) {
        if (Math.hypot(live.lastBoom.x - cx, live.lastBoom.z - cz) < 3.4) {
          smashCrack();
          crackAt(cx, cz);
          sfx.thud();
          live.listen = "The wall gave. A key sat in the dust.";
        }
      }
      if (Math.hypot(live.x - cx, live.z - cz) < 2.4 && !live.listen) live.listen = "A wall that was poured, not built.";
    } else if (!hallHasKey()) {
      const kx = HALL.west.x - 4.2;
      const kz = HALL.west.z;
      if (Math.hypot(live.x - kx, live.z - kz) < 1.3) {
        takeHallKey();
        revealItem("key", true);
        live.listen = "A key that does not match three.";
      }
    }

    if (qn("qRemain") >= 1) {
      const g = HALL.gold;
      if (Math.hypot(live.x - g.x, live.z - g.z) < 1.6 && talkOk()) {
        if (qn("qGold") < 1) {
          setQ("qGold", 1);
          const c = useGame.getState().addCoins(200);
          if (c > 0) revealItem("coin");
          useGame.getState().grantHeartContainer("quiet-gold");
          revealItem("container", true);
          playFanfare("full");
          live.listen = "The quiet purse. They hid a count in gold.";
        }
      } else if (Math.hypot(live.x - g.x, live.z - g.z) < 2.6 && qn("qGold") < 1) {
        live.listen = live.listen || "A chest that does not want a song. It wants a victory.";
      }
    }

    if (hallHasKey() && !hallEastDone() && Math.hypot(live.x - HALL.hub.x, live.z - (HALL.hub.z - 6)) < 2.4) {
      live.listen = live.listen || "The south mouth is a lock. The east mouth is a lesson.";
    }
  }, 1);

  if (quietRoom() !== "hall") return null;
  const fy = heightAt(Q.mosaic.x, Q.mosaic.z) + 0.12;
  return (
    <group>
      <HallRoom cx={HALL.hub.x} cz={HALL.hub.z} w={14.6} d={14.6} y={fy} />
      <HallRoom cx={HALL.east.x} cz={HALL.east.z} w={12.2} d={12.2} y={fy} />
      <HallRoom cx={HALL.west.x} cz={HALL.west.z} w={12.2} d={12.2} y={fy} />
      <HallRoom cx={HALL.boss.x} cz={HALL.boss.z} w={19} d={19} y={fy} />
      <HallRoom cx={HALL.gold.x} cz={HALL.gold.z} w={8} d={8} y={fy} />
      <group position={[HALL.hub.x, fy, HALL.hub.z]}>
        {[-3.2, -1.05, 1.05, 3.2].map((px, i) => (
          <mesh key={i} position={[px, 1.8, -4.6]}>
            <cylinderGeometry args={[0.32, 0.38, 3.6, 8]} />
            {lamb(i === 3 ? "#3a322c" : "#6a5a48")}
          </mesh>
        ))}
      </group>
      {crackOpen() ? null : (
        <mesh position={[HALL.west.x - 5.8, fy + 1.6, HALL.west.z]}>
          <boxGeometry args={[0.4, 3.2, 3.6]} />
          {lamb("#5a4a3c")}
        </mesh>
      )}
      {hallHasKey() ? null : (
        <mesh position={[HALL.west.x - 4.2, fy + 0.3, HALL.west.z]}>
          <boxGeometry args={[0.18, 0.42, 0.08]} />
          {lamb("#c9a227")}
        </mesh>
      )}
      {qn("qRemain") >= 1 && qn("qGold") < 1 ? (
        <group position={[HALL.gold.x, fy + 0.45, HALL.gold.z]}>
          <mesh>
            <boxGeometry args={[1.1, 0.7, 0.8]} />
            {lamb("#c9a227")}
          </mesh>
          <HeartContainerMesh />
        </group>
      ) : null}
      <pointLight position={[HALL.hub.x, fy + 3.4, HALL.hub.z]} intensity={1.5} distance={18} color="#e8c070" />
      <pointLight position={[HALL.boss.x, fy + 4, HALL.boss.z]} intensity={1.2} distance={16} color="#d0a060" />
    </group>
  );
}

function HallRoom({ cx, cz, w, d, y }: { cx: number; cz: number; w: number; d: number; y: number }) {
  return (
    <group position={[cx, y, cz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        {lamb("#4a4038")}
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <boxGeometry args={[w, 0.2, d]} />
        {lamb("#2a221c")}
      </mesh>
    </group>
  );
}

function RemainderBoss() {
  const beaten = useRef((useGame.getState().defeated.meadow ?? []).includes("quiet-remain") || qn("qRemain") >= 1);
  const root = useRef<THREE.Group>(null);
  const poseRef = useRef<FangPose>("idle");
  const pos = useRef({ x: HALL.boss.x, z: HALL.boss.z });
  const yaw = useRef(0);
  const hp = useRef(8);
  const mode = useRef<"sleep" | "echo" | "split" | "count" | "down" | "dead">(beaten.current ? "dead" : "sleep");
  const t = useRef(0);
  const countN = useRef(0);
  const hitAt = useRef(-9);
  const ghosts = useRef<{ x: number; z: number }[]>([
    { x: HALL.boss.x + 4, z: HALL.boss.z },
    { x: HALL.boss.x - 4, z: HALL.boss.z },
    { x: HALL.boss.x, z: HALL.boss.z + 4 },
  ]);

  useFrame((_, rawDt) => {
    const dt = Math.min(0.05, rawDt);
    if (quietRoom() !== "hall") {
      if (mode.current !== "dead" && mode.current !== "sleep") {
        mode.current = "sleep";
        live.bossFight = false;
        live.bossLock = false;
      }
      return;
    }
    const inArena = Math.hypot(live.x - HALL.boss.x, live.z - HALL.boss.z) < 9.2;
    if (beaten.current || mode.current === "dead") {
      live.bossFight = false;
      live.bossLock = false;
      poseRef.current = "sit";
      return;
    }
    if (mode.current === "sleep" && inArena) {
      mode.current = "echo";
      t.current = 0;
      hp.current = 8;
      live.bossFight = true;
      live.bossLock = true;
      live.bossTitle = "The Remainder";
      live.bossTitleT = 2.4;
      live.bossHp = hp.current;
      live.bossMax = 8;
      live.listen = "It copied the vale’s count. Then it was told to stop.";
      sfx.thud();
    }
    t.current += dt;
    const p = pos.current;
    live.foeTrack["quiet-remain"] = { x: p.x, z: p.z };
    live.foeHp["quiet-remain"] = hp.current;

    const dx = live.x - p.x;
    const dz = live.z - p.z;
    const d = Math.hypot(dx, dz) || 1;

    if (mode.current === "echo") {
      poseRef.current = "walk";
      p.x += (dx / d) * 2.4 * dt * (live.speed !== 0 ? 1 : 0.15);
      p.z += (dz / d) * 2.4 * dt * (live.speed !== 0 ? 1 : 0.15);
      yaw.current = Math.atan2(-dx, -dz);
      if (Math.abs(live.speed) < 0.2 && d < 2.4) poseRef.current = "idle";
    } else if (mode.current === "split") {
      poseRef.current = "chase";
      ghosts.current = [0, 1, 2].map((i) => {
        const a = live.playT * 0.7 + i * 2.1;
        return { x: HALL.boss.x + Math.cos(a) * 5.2, z: HALL.boss.z + Math.sin(a) * 5.2 };
      });
      const a = live.playT * 0.7 + 3 * 2.1;
      p.x = HALL.boss.x + Math.cos(a) * 5.2;
      p.z = HALL.boss.z + Math.sin(a) * 5.2;
      yaw.current = a + Math.PI;
      if (!live.listen) live.listen = "Three of them. The vale would stop counting.";
    } else if (mode.current === "count") {
      poseRef.current = "yell";
      const beat = Math.floor(t.current / 1.15) % 4;
      countN.current = beat;
      if (beat === 3 && !live.listen) live.listen = "…";
      if (beat < 3 && t.current % 1.15 < 0.08) live.listen = `${beat + 1}.`;
    }

    if (d < 1.35 && live.playT - hitAt.current > 1.1 && mode.current !== "down") {
      useGame.getState().hurtField(hasSteel() ? 4 : 6);
      live.knock = { vx: (dx / d) * -6, vz: (dz / d) * -6, t: 0.28 };
      hitAt.current = live.playT;
      sfx.hit();
    }

    const slash = live.slash;
    if (slash && live.playT - hitAt.current > 0.4) {
      const sd = Math.hypot(slash.x - p.x, slash.z - p.z);
      let can = false;
      if (mode.current === "echo") can = Math.abs(live.speed) < 0.25 && sd < (slash.r ?? 1.5) + 0.4;
      if (mode.current === "split") can = sd < (slash.r ?? 1.5) + 0.3;
      if (mode.current === "count") can = countN.current === 3 && sd < (slash.r ?? 1.5) + 0.5;
      if (can) {
        const dmg = (live.spinning || live.jumpAtk ? 2 : 1) * (hasSteel() ? 2 : 1);
        hp.current -= dmg;
        hitAt.current = live.playT;
        live.bossHp = Math.max(0, hp.current);
        sfx.thud();
        puffAt(p.x, p.z, heightAt(p.x, p.z) + 1.2);
        poseRef.current = "hiss";
        if (hp.current <= 5 && mode.current === "echo") {
          mode.current = "split";
          t.current = 0;
          live.listen = "It split into the official count.";
        } else if (hp.current <= 2 && mode.current === "split") {
          mode.current = "count";
          t.current = 0;
          live.listen = "It counts. It skips.";
        }
        if (hp.current <= 0) {
          mode.current = "dead";
          beaten.current = true;
          live.bossFight = false;
          live.bossLock = false;
          live.bossDown = true;
          useGame.getState().markDefeated("meadow", "quiet-remain");
          setQ("qRemain", 1);
          takeCipher("remainder", true);
          useGame.getState().addCoins(80);
          revealItem("coin");
          playFanfare("full");
          live.listen = "The fourth thing sat down. It was tired of being a mistake.";
        }
      }
    }

    if (root.current) {
      root.current.position.set(p.x, heightAt(Q.mosaic.x, Q.mosaic.z) + 0.12, p.z);
      root.current.rotation.y = yaw.current;
    }
  }, 1);

  if (quietRoom() !== "hall") return null;
  if (beaten.current && mode.current === "dead") return null;
  const fy = heightAt(Q.mosaic.x, Q.mosaic.z) + 0.12;
  return (
    <group>
      {mode.current === "split"
        ? ghosts.current.map((g, i) => (
            <group key={i} position={[g.x, fy, g.z]}>
              <N64Foe kind="leftover" world="grave" pose="walk" seed={i + 4} />
            </group>
          ))
        : null}
      <group ref={root} position={[pos.current.x, fy, pos.current.z]}>
        <N64Foe kind="leftover" world="grave" poseRef={poseRef} seed={11} />
      </group>
    </group>
  );
}

function BladePieces() {
  useFrame(() => {
    if (live.house) return;
    if (qn("qTang") < 1) {
      const d = Math.hypot(live.x - Q.tang.x, live.z - Q.tang.z);
      const wallDown = tangWallOpen();
      if (!wallDown && live.lastBoom && live.playT - live.lastBoom.t < 0.25) {
        if (Math.hypot(live.lastBoom.x - Q.tang.x, live.lastBoom.z - Q.tang.z) < 3.2) {
          smashTangWall();
          crackAt(Q.tang.x, Q.tang.z);
        }
      }
      if (wallDown && d < 1.4) {
        setQ("qTang", 1);
        revealItem("tang", true);
        live.listen = "A rusty tang. It used to be a longer blade.";
        takeCipher("quiet-blade");
      } else if (d < 2.6 && !wallDown && !live.listen) live.listen = "A cracked wall in the old count. Loud balls know walls.";
    }
    if (qn("qWhet") < 1 && (useGame.getState().quests?.claws ?? 0) >= 1) {
      const d = Math.hypot(live.x - Q.whet.x, live.z - Q.whet.z);
      if (d < 1.5) {
        setQ("qWhet", 1);
        revealItem("whet", true);
        live.listen = "A whetstone. Someone meant to finish a blade up here.";
      } else if (d < 2.8 && !live.listen) live.listen = "A grey stone on the east ledge. Not a jewel.";
    }
    if (qn("qTang") >= 1 && qn("qWhet") >= 1 && qn("qSteel") < 1 && qn("qHollow") >= 1) {
      const q = HOLLOW_HOMES[0]!;
      const d = Math.hypot(live.x - q.x, live.z - (q.z + 2.2));
      if (d < 2.2 && !live.listen) live.listen = "Quill’s door. He can hear metal from inside.";
    }
  }, 1);
  return (
    <group>
      {qn("qTang") < 1 && !tangWallOpen() ? (
        <mesh position={[Q.tang.x, heightAt(Q.tang.x, Q.tang.z) + 1.4, Q.tang.z]}>
          <boxGeometry args={[2.6, 2.8, 0.4]} />
          {lamb("#6a5a48")}
        </mesh>
      ) : null}
      {qn("qTang") < 1 && tangWallOpen() ? (
        <mesh position={[Q.tang.x, heightAt(Q.tang.x, Q.tang.z) + 0.25, Q.tang.z]} rotation={[0.4, 0.2, 0.1]}>
          <boxGeometry args={[0.08, 0.7, 0.16]} />
          {lamb("#8a8478")}
        </mesh>
      ) : null}
      {qn("qWhet") < 1 ? (
        <mesh position={[Q.whet.x, heightAt(Q.whet.x, Q.whet.z) + 0.16, Q.whet.z]}>
          <boxGeometry args={[0.5, 0.14, 0.32]} />
          {lamb("#7a7468")}
        </mesh>
      ) : null}
    </group>
  );
}

function WellFourth() {
  useFrame(() => {
    if (live.house || quietRoom()) return;
    if (qn("qWellGold") >= 1) return;
    const d = Math.hypot(live.x - WELL_AT.x, live.z - WELL_AT.z);
    if (d > 3.2) return;
    const buf = live.songBuf || "";
    const fourth = buf.endsWith("ADGFDSADH");
    const night = live.dusk > 0.55;
    if (fourth && night) {
      setQ("qWellGold", 1);
      useGame.getState().addCoins(120);
      useGame.getState().grantHeartContainer("well-fourth");
      revealItem("container", true);
      playFanfare("full");
      takeCipher("well-fourth", true);
      live.listen = "The torn note. The well kept it.";
      puffAt(WELL_AT.x, WELL_AT.z, heightAt(WELL_AT.x, WELL_AT.z) + 1);
    } else if (live.songOk === "Oak’s Song" && night && d < 2.2) {
      live.listen = live.listen || "The well liked three verses. It is waiting for a fourth.";
    }
  }, 1);
  return qn("qWellGold") >= 1 ? null : (
    <mesh position={[WELL_AT.x, heightAt(WELL_AT.x, WELL_AT.z) + 0.08, WELL_AT.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.85, 0.95, 10]} />
      <meshLambertMaterial
        color="#c9a227"
        emissive="#c9a227"
        emissiveIntensity={live.dusk > 0.55 ? 0.35 : 0}
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}
