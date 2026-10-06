import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, LAUNDRY_AT } from "./field";
import { live } from "./live";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { takeCipher } from "../cipher";
import { consumeTalk as consumeTalkRaw } from "../input";
import { lamb } from "./mats";
import { N64Sign, HeartContainerMesh } from "./actors";
import { puffAt } from "./fx";
import { isChestOpen, markChestOpen } from "./puzzles";
import { nimYip } from "../companion";
import {
  MEM,
  WATCH_STATUES,
  WATCH_TILES,
  WELL_RIM,
  WELL_POSTS,
  CLOTH_LINE,
  CLOTH_PADS,
  CAIRN_STACKS,
  KEEP_PILLARS,
  memPush,
  memOpen,
  hydrateMemory,
  watchOpen,
  type MemKind,
} from "./memory";

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

const STONE = "#7a7468";
const STONE_D = "#5a564c";
const GOLD = "#c9a227";
const RED = "#c42828";
const GREEN = "#3a8a40";
const BLUE = "#3a6a98";
const BLANK = "#3a3834";

const COL: Record<string, string> = {
  sun: GOLD,
  leaf: GREEN,
  wave: BLUE,
  blank: BLANK,
  gold: GOLD,
  red: RED,
  green: GREEN,
  empty: BLANK,
};

function FaceMark({ sym, s = 1 }: { sym: string; s?: number }) {
  if (sym === "sun") {
    return (
      <group scale={s}>
        <mesh>
          <circleGeometry args={[0.22, 10]} />
          {lamb(GOLD)}
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position={[Math.sin((i * Math.PI) / 3) * 0.32, Math.cos((i * Math.PI) / 3) * 0.32, 0]} rotation={[0, 0, (i * Math.PI) / 3]}>
            <boxGeometry args={[0.05, 0.16, 0.04]} />
            {lamb("#e8b050")}
          </mesh>
        ))}
      </group>
    );
  }
  if (sym === "leaf") {
    return (
      <group scale={s} rotation={[0, 0, 0.4]}>
        <mesh>
          <sphereGeometry args={[0.18, 7, 5]} />
          {lamb(GREEN)}
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.04, 0.18, 0.04]} />
          {lamb("#4a6a28")}
        </mesh>
      </group>
    );
  }
  if (sym === "wave") {
    return (
      <group scale={s}>
        {[0, 1].map((i) => (
          <mesh key={i} position={[0, -0.08 + i * 0.16, 0]} rotation={[Math.PI / 2, 0, 0.2]}>
            <torusGeometry args={[0.16 + i * 0.04, 0.035, 5, 10, Math.PI]} />
            {lamb(BLUE)}
          </mesh>
        ))}
      </group>
    );
  }
  return (
    <mesh scale={s}>
      <circleGeometry args={[0.18, 8]} />
      {lamb(BLANK)}
    </mesh>
  );
}

export function MemoryPlay() {
  const boot = useRef(false);
  if (!boot.current) {
    boot.current = true;
    hydrateMemory();
  }
  return (
    <group>
      <WatchersClue />
      <WatchersLock />
      <WellClue />
      <WellLock />
      <ClothClue />
      <ClothLock />
      <CairnClue />
      <CairnLock />
      <MemorySigns />
    </group>
  );
}

function struck(kind: MemKind, id: number, how: "slash" | "talk" | "step") {
  const r = memPush(kind, id);
  if (r === "have") return r;
  if (how !== "step") sfx.hit();
  if (r === "done") {
    sfx.ok();
    sfx.get();
  } else if (r === "reset") sfx.hit();
  return r;
}

function WatchersClue() {
  const yipped = useRef(false);
  useFrame(() => {
    if (live.house) return;
    let near = -1;
    for (const s of WATCH_STATUES) {
      const d = Math.hypot(live.x - s.x, live.z - s.z);
      if (d < 2.1) near = s.id;
    }
    if (near < 0) return;
    const s = WATCH_STATUES.find((w) => w.id === near)!;
    if (!live.listen) {
      live.listen =
        s.sym === "sun"
          ? "An old man with a sun cut in his chest."
          : s.sym === "leaf"
            ? "An old man with an oak leaf on his chest."
            : s.sym === "wave"
              ? "An old man with a wave on his chest."
              : "An old man. The face on his chest was scraped blank.";
    }
    const row = Math.hypot(live.x - MEM.watchClue.x, live.z - MEM.watchClue.z);
    if (row < 8 && !yipped.current) {
      yipped.current = true;
      nimYip("Four old men. They are not saying their names. I also will not.", "watch-clue");
    }
  });
  return (
    <group>
      {WATCH_STATUES.map((s) => {
        const y = heightAt(s.x, s.z);
        return (
          <group key={s.id} position={[s.x, y, s.z]}>
            <mesh position={[0, 0.22, 0]} castShadow>
              <cylinderGeometry args={[0.55, 0.62, 0.44, 7]} />
              {lamb(STONE_D)}
            </mesh>
            <mesh position={[0, 1.15, 0]} castShadow>
              <cylinderGeometry args={[0.32, 0.42, 1.7, 7]} />
              {lamb(STONE)}
            </mesh>
            <mesh position={[0, 2.18, 0]} castShadow>
              <sphereGeometry args={[0.34, 7, 6]} />
              {lamb("#8a8478")}
            </mesh>
            <group position={[0, 1.35, 0.36]}>
              <FaceMark sym={s.sym} s={1.05} />
            </group>
            <group position={[0, 1.35, -0.36]} rotation={[0, Math.PI, 0]}>
              <FaceMark sym={s.sym} s={1.05} />
            </group>
          </group>
        );
      })}
    </group>
  );
}

function WatchersLock() {
  const open = useRef(watchOpen());
  const got = useRef(isChestOpen("mem-watch") || (useGame.getState().heartsFrom ?? []).includes("watchers"));
  const [, bump] = useState(0);
  const slab = useRef<THREE.Mesh>(null);
  const glow = useRef<(THREE.MeshLambertMaterial | null)[]>([]);
  const yipped = useRef(false);
  useFrame((_, dt) => {
    if (live.house) return;
    const dDoor = Math.hypot(live.x - MEM.watchDoor.x, live.z - MEM.watchDoor.z);
    if (dDoor < 9 && !open.current && !live.listen) {
      live.listen = "Four faces again. Not in a line. The door wants the old order. It will not say it.";
    }
    if (dDoor < 8 && !open.current && !yipped.current) {
      yipped.current = true;
      nimYip("The door copied the road. Badly. I am not lining them up for you.", "watch-lock");
    }
    if (!open.current) {
      for (const t of WATCH_TILES) {
        const close = Math.hypot(live.x - t.x, live.z - t.z) < 1.15;
        const cut = Boolean(live.slash && Math.hypot(live.slash.x - t.x, live.slash.z - t.z) < 1.25);
        if (!cut && !(close && talkOk())) continue;
        const r = struck("watch", t.id, cut ? "slash" : "talk");
        puffAt(t.x, t.z);
        if (r === "done") {
          open.current = true;
          live.listen = "The slab remembered the road. It sat down.";
          bump((n) => n + 1);
        } else if (r === "reset") live.listen = "The faces went dark. The road still knows.";
        else if (r === "ok") live.listen = "A face rang. It wants the next.";
        if (cut) live.slash = null;
        break;
      }
    }
    glow.current.forEach((m, i) => {
      if (!m) return;
      const t = WATCH_TILES[i]!;
      m.emissiveIntensity = open.current ? 0.55 : 0.18 + Math.sin(live.playT * 2 + i) * 0.08;
      m.color.set(COL[t.sym] ?? STONE);
    });
    if (slab.current) {
      const yWant = open.current ? -1.35 : 1.15;
      const cur = slab.current.position.y;
      slab.current.position.y += (yWant - cur) * Math.min(1, dt * 3.2);
    }
    if (!got.current && open.current) {
      const p = MEM.watchChest;
      if (Math.hypot(live.x - p.x, live.z - p.z) < 1.6 && (talkOk() || live.stillT > 0.35)) {
        got.current = true;
        markChestOpen("mem-watch");
        const g = useGame.getState();
        if (g.grantHeartContainer("watchers")) revealItem("container");
        takeCipher("watchers", true);
        live.listen = "The road had them first. The woods only copied.";
        sfx.get();
        bump((n) => n + 1);
      }
    }
  });
  const doorY = heightAt(MEM.watchDoor.x, MEM.watchDoor.z);
  const chestY = heightAt(MEM.watchChest.x, MEM.watchChest.z);
  return (
    <group>
      <group position={[MEM.watchDoor.x, doorY, MEM.watchDoor.z]}>
        {[-1.7, 1.7].map((s) => (
          <mesh key={s} position={[s, 1.7, 0]} castShadow>
            <boxGeometry args={[0.7, 3.4, 0.7]} />
            {lamb("#6a6458")}
          </mesh>
        ))}
        <mesh position={[0, 3.35, 0]} castShadow>
          <boxGeometry args={[4.2, 0.55, 0.8]} />
          {lamb("#5a564c")}
        </mesh>
        <mesh ref={slab} position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[2.35, 2.3, 0.38]} />
          {lamb("#4a4840")}
        </mesh>
        {[-2.55, 2.55].map((s) => (
          <mesh key={`w${s}`} position={[s, 1.35, 1.9]} castShadow>
            <boxGeometry args={[0.42, 2.7, 4.4]} />
            {lamb("#5a564c")}
          </mesh>
        ))}
        <mesh position={[0, 1.25, 4.55]} castShadow>
          <boxGeometry args={[5.5, 2.5, 0.42]} />
          {lamb("#4a4840")}
        </mesh>
      </group>
      {WATCH_TILES.map((t, i) => {
        const y = heightAt(t.x, t.z);
        return (
          <group key={t.id} position={[t.x, y, t.z]}>
            <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <circleGeometry args={[0.95, 10]} />
              <meshLambertMaterial
                ref={(el) => {
                  glow.current[i] = el;
                }}
                color={COL[t.sym]}
                emissive={COL[t.sym]}
                emissiveIntensity={0.2}
              />
            </mesh>
            <group position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <FaceMark sym={t.sym} s={1.15} />
            </group>
          </group>
        );
      })}
      {got.current ? null : (
        <group position={[MEM.watchChest.x, chestY + 0.55, MEM.watchChest.z]} scale={1.12}>
          <HeartContainerMesh />
        </group>
      )}
    </group>
  );
}

function WellClue() {
  useFrame(() => {
    if (live.house) return;
    let near = -1;
    for (const p of WELL_RIM) {
      if (Math.hypot(live.x - p.x, live.z - p.z) < 1.05) near = p.id;
    }
    if (near < 0) {
      if (Math.hypot(live.x - MEM.wellClue.x, live.z - MEM.wellClue.z) < 2.4 && !live.listen)
        live.listen = "The well rim is marked. Four sides. They do not match.";
      return;
    }
    const p = WELL_RIM.find((w) => w.id === near)!;
    if (!live.listen) {
      live.listen =
        p.pip === 0
          ? "The west rim is blank. Someone scraped the pits out."
          : p.pip === 1
            ? "One pit on the east rim."
            : p.pip === 2
              ? "Two pits on the north rim."
              : "Three pits on the south rim.";
    }
  });
  return (
    <group>
      {WELL_RIM.map((p) => (
        <group key={p.id} position={[p.x, heightAt(p.x, p.z) + 0.42, p.z]}>
          <mesh>
            <boxGeometry args={[0.28, 0.12, 0.22]} />
            {lamb("#8a8a82")}
          </mesh>
          {p.pip > 0
            ? Array.from({ length: p.pip }, (_, i) => (
                <mesh key={i} position={[-0.08 + (i % 2) * 0.12, 0.1, -0.04 + Math.floor(i / 2) * 0.1]}>
                  <sphereGeometry args={[0.04, 6, 5]} />
                  {lamb(GOLD)}
                </mesh>
              ))
            : (
                <mesh position={[0, 0.08, 0]}>
                  <circleGeometry args={[0.07, 8]} />
                  {lamb(BLANK)}
                </mesh>
              )}
        </group>
      ))}
    </group>
  );
}

function WellLock() {
  const open = useRef(memOpen("well"));
  const onPad = useRef(-1);
  const got = useRef(isChestOpen("mem-well"));
  const [, bump] = useState(0);
  const yipped = useRef(false);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - MEM.wellLock.x, live.z - MEM.wellLock.z);
    if (d < 7 && !open.current && !live.listen) live.listen = "Four posts. Blank. They want a count you already saw.";
    if (d < 7 && !open.current && !yipped.current) {
      yipped.current = true;
      nimYip("These posts copied the well and forgot the pits. I remember the well. I am not saying it.", "well-lock");
    }
    let standing = -1;
    for (const p of WELL_POSTS) {
      if (Math.hypot(live.x - p.x, live.z - p.z) < 1.05 && live.grounded) standing = p.id;
    }
    if (!open.current && standing >= 0 && onPad.current !== standing) {
      onPad.current = standing;
      const r = struck("well", standing, "step");
      puffAt(WELL_POSTS[standing]!.x, WELL_POSTS[standing]!.z);
      if (r === "done") {
        open.current = true;
        live.listen = "The posts remembered the rim. A lid lifted.";
        bump((n) => n + 1);
      } else if (r === "reset") live.listen = "The posts went still. The well still knows.";
      else if (r === "ok") live.listen = "A post took a step. It wants the next.";
    }
    if (standing < 0) onPad.current = -1;
    if (!got.current && open.current) {
      const p = MEM.wellChest;
      if (Math.hypot(live.x - p.x, live.z - p.z) < 1.45 && (talkOk() || live.slash)) {
        got.current = true;
        markChestOpen("mem-well");
        pay(25, "mem-well");
        takeCipher("well-pips", true);
        live.listen = "The well counted first. The river only copied.";
        sfx.get();
        bump((n) => n + 1);
      }
    }
  });
  const chestY = heightAt(MEM.wellChest.x, MEM.wellChest.z);
  return (
    <group>
      {WELL_POSTS.map((p) => {
        const y = heightAt(p.x, p.z);
        return (
          <group key={p.id} position={[p.x, y, p.z]}>
            <mesh position={[0, 0.85, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.28, 1.7, 7]} />
              {lamb(STONE)}
            </mesh>
            <mesh position={[0, 1.72, 0.18]} rotation={[0.1, 0, 0]}>
              <circleGeometry args={[0.16, 8]} />
              {lamb(BLANK)}
            </mesh>
          </group>
        );
      })}
      <ChestBox x={MEM.wellChest.x} y={chestY} z={MEM.wellChest.z} open={got.current} />
    </group>
  );
}

function ClothClue() {
  useFrame(() => {
    if (live.house) return;
    const { x, z } = LAUNDRY_AT;
    if (Math.hypot(live.x - x, live.z - z) > 2.6) return;
    let slot = -1;
    for (const c of CLOTH_LINE) {
      if (Math.abs(live.x - (x + c.ox)) < 0.38 && Math.abs(live.z - z) < 0.7) slot = c.id;
    }
    if (slot < 0) {
      if (!live.listen) live.listen = "Nana hangs four. One pin is empty.";
      return;
    }
    const c = CLOTH_LINE.find((w) => w.id === slot)!;
    if (!live.listen) {
      live.listen =
        c.col === "gold"
          ? "A gold sheet."
          : c.col === "red"
            ? "A red sheet."
            : c.col === "green"
              ? "A green sheet."
              : "An empty pin. The line skips here.";
    }
  });
  const y = heightAt(LAUNDRY_AT.x, LAUNDRY_AT.z);
  const empty = CLOTH_LINE.find((c) => c.col === "empty");
  if (!empty) return null;
  return (
    <mesh position={[LAUNDRY_AT.x + empty.ox, y + 2.18, LAUNDRY_AT.z]}>
      <cylinderGeometry args={[0.035, 0.035, 0.16, 5]} />
      {lamb("#5a3a20")}
    </mesh>
  );
}

function ClothLock() {
  const open = useRef(memOpen("cloth"));
  const onPad = useRef(-1);
  const got = useRef(isChestOpen("mem-cloth"));
  const [, bump] = useState(0);
  const yipped = useRef(false);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - MEM.clothLock.x, live.z - MEM.clothLock.z);
    if (d < 7 && !open.current && !live.listen) live.listen = "Four cloths on the dirt. Same colors. Not the same line.";
    if (d < 7 && !open.current && !yipped.current) {
      yipped.current = true;
      nimYip("Town laundry. Mountain dirt. I am not folding it for you.", "cloth-lock");
    }
    let standing = -1;
    for (const p of CLOTH_PADS) {
      if (Math.hypot(live.x - p.x, live.z - p.z) < 1.05 && live.grounded) standing = p.id;
    }
    if (!open.current && standing >= 0 && onPad.current !== standing) {
      onPad.current = standing;
      const r = struck("cloth", standing, "step");
      const pad = CLOTH_PADS.find((p) => p.id === standing)!;
      puffAt(pad.x, pad.z);
      if (r === "done") {
        open.current = true;
        live.listen = "The dirt remembered the line. A lid lifted.";
        bump((n) => n + 1);
      } else if (r === "reset") live.listen = "The colors went dull. Nana’s line still hangs.";
      else if (r === "ok") live.listen = "A color took a step. It wants the next.";
    }
    if (standing < 0) onPad.current = -1;
    if (!got.current && open.current) {
      const p = MEM.clothChest;
      if (Math.hypot(live.x - p.x, live.z - p.z) < 1.45 && (talkOk() || live.slash)) {
        got.current = true;
        markChestOpen("mem-cloth");
        pay(16, "mem-cloth");
        takeCipher("laundry-line", true);
        live.listen = "The line in town hangs true. The mountain only copied.";
        sfx.get();
        bump((n) => n + 1);
      }
    }
  });
  const chestY = heightAt(MEM.clothChest.x, MEM.clothChest.z);
  return (
    <group>
      {CLOTH_PADS.map((p) => {
        const y = heightAt(p.x, p.z);
        const color = COL[p.col];
        return (
          <group key={p.id} position={[p.x, y, p.z]}>
            <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <circleGeometry args={[1.05, 10]} />
              <meshLambertMaterial color={color} emissive={color} emissiveIntensity={p.col === "empty" ? 0.05 : 0.28} />
            </mesh>
            {p.col !== "empty" ? (
              <mesh position={[0, 0.55, 0]} rotation={[0.15, p.id, 0.08]} castShadow>
                <planeGeometry args={[0.7, 0.95]} />
                <meshLambertMaterial color={color} side={THREE.DoubleSide} />
              </mesh>
            ) : (
              <mesh position={[0, 0.55, 0]}>
                <cylinderGeometry args={[0.04, 0.05, 1.1, 5]} />
                {lamb("#5a3a20")}
              </mesh>
            )}
          </group>
        );
      })}
      <ChestBox x={MEM.clothChest.x} y={chestY} z={MEM.clothChest.z} open={got.current} />
    </group>
  );
}

function RingStack({ n, gold }: { n: number; gold?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.48, 0.7, 7]} />
        {lamb(STONE)}
      </mesh>
      {n > 0
        ? Array.from({ length: n }, (_, i) => (
            <mesh key={i} position={[0, 0.78 + i * 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.22 + i * 0.02, 0.04, 5, 10]} />
              {lamb(gold ? GOLD : "#8a6a28")}
            </mesh>
          ))
        : (
            <mesh position={[0, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.2, 0.03, 5, 10]} />
              {lamb(BLANK)}
            </mesh>
          )}
    </group>
  );
}

function CairnClue() {
  const yipped = useRef(false);
  useFrame(() => {
    if (live.house) return;
    let near = -1;
    for (const s of CAIRN_STACKS) {
      if (Math.hypot(live.x - s.x, live.z - s.z) < 1.35) near = s.id;
    }
    const row = Math.hypot(live.x - MEM.cairnClue.x, live.z - MEM.cairnClue.z);
    if (row < 7 && !yipped.current) {
      yipped.current = true;
      nimYip("Little stacks. They face the vale. I am not counting them twice.", "cairn-clue");
    }
    if (near < 0) {
      if (row < 6 && !live.listen) live.listen = "Four little stacks. They face the vale.";
      return;
    }
    const s = CAIRN_STACKS.find((w) => w.id === near)!;
    if (!live.listen) {
      live.listen =
        s.rings === 0 ? "No rings. Just a stone." : s.rings === 1 ? "One ring." : s.rings === 2 ? "Two rings." : "Three rings.";
    }
  });
  return (
    <group>
      {CAIRN_STACKS.map((s) => (
        <group key={s.id} position={[s.x, heightAt(s.x, s.z), s.z]}>
          <RingStack n={s.rings} gold />
        </group>
      ))}
    </group>
  );
}

function CairnLock() {
  const open = useRef(memOpen("cairn"));
  const got = useRef(isChestOpen("mem-cairn"));
  const [, bump] = useState(0);
  const yipped = useRef(false);
  useFrame(() => {
    if (live.house) return;
    const d = Math.hypot(live.x - MEM.cairnLock.x, live.z - MEM.cairnLock.z);
    if (d < 7 && !open.current && !live.listen) live.listen = "The same stones. Different pile. They will not count for you.";
    if (d < 7 && !open.current && !yipped.current) {
      yipped.current = true;
      nimYip("The hill stacked them first. These ones mixed it up. I am not doing your remembering.", "cairn-lock");
    }
    if (!open.current) {
      for (const p of KEEP_PILLARS) {
        const close = Math.hypot(live.x - p.x, live.z - p.z) < 1.2;
        const cut = Boolean(live.slash && Math.hypot(live.slash.x - p.x, live.slash.z - p.z) < 1.3);
        if (!cut && !(close && talkOk())) continue;
        const r = struck("cairn", p.id, cut ? "slash" : "talk");
        puffAt(p.x, p.z);
        if (r === "done") {
          open.current = true;
          live.listen = "The stones remembered the hill. A lid lifted.";
          bump((n) => n + 1);
        } else if (r === "reset") live.listen = "The rings went still. The lookout still knows.";
        else if (r === "ok") live.listen = "A pillar rang. It wants the next.";
        if (cut) live.slash = null;
        break;
      }
    }
    if (!got.current && open.current) {
      const p = MEM.cairnChest;
      if (Math.hypot(live.x - p.x, live.z - p.z) < 1.45 && (talkOk() || live.slash)) {
        got.current = true;
        markChestOpen("mem-cairn");
        pay(20, "mem-cairn");
        takeCipher("cairn-rings", true);
        live.listen = "The hill stacked them first. The keep road only copied.";
        sfx.get();
        bump((n) => n + 1);
      }
    }
  });
  const chestY = heightAt(MEM.cairnChest.x, MEM.cairnChest.z);
  return (
    <group>
      {KEEP_PILLARS.map((p) => (
        <group key={p.id} position={[p.x, heightAt(p.x, p.z), p.z]}>
          <mesh position={[0, 1.15, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.4, 2.3, 7]} />
            {lamb(STONE)}
          </mesh>
          <group position={[0, 0.85, 0]}>
            <RingStack n={p.rings} gold />
          </group>
        </group>
      ))}
      <ChestBox x={MEM.cairnChest.x} y={chestY} z={MEM.cairnChest.z} open={got.current} />
    </group>
  );
}

function ChestBox({ x, y, z, open }: { x: number; y: number; z: number; open: boolean }) {
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.86, 0.46, 0.58]} />
        {lamb(open ? "#4a3220" : "#7a4e22")}
      </mesh>
      <mesh position={[0, 0.48, -0.05]} rotation={[open ? -1.4 : 0, 0, 0]} castShadow>
        <boxGeometry args={[0.86, 0.2, 0.58]} />
        {lamb("#9a642c")}
      </mesh>
    </group>
  );
}

function MemorySigns() {
  const spots = useMemo(
    () => [
      { x: MEM.watchClue.x + 7.4, z: MEM.watchClue.z + 1.6, line: "The road remembers." },
      { x: MEM.watchDoor.x + 3.6, z: MEM.watchDoor.z + 0.4, line: "Four faces. The road had them first." },
      { x: MEM.wellLock.x + 4.4, z: MEM.wellLock.z + 1.2, line: "The well counted first." },
      { x: MEM.clothLock.x + 4.2, z: MEM.clothLock.z - 1.4, line: "The line in town hangs true." },
      { x: MEM.cairnLock.x + 4.6, z: MEM.cairnLock.z + 1.2, line: "The hill stacked them first." },
    ],
    [],
  );
  useFrame(() => {
    if (live.house) return;
    for (const s of spots) {
      if (Math.hypot(live.x - s.x, live.z - s.z) < 2.2) live.listen = live.listen || s.line;
    }
  });
  return (
    <group>
      {spots.map((s, i) => (
        <N64Sign key={i} x={s.x} z={s.z} />
      ))}
    </group>
  );
}
