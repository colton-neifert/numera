import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { heightAt, WELL_AT } from "./field";
import { FOUNTAIN } from "./village";
import { live } from "./live";
import { lamb } from "./mats";
import { sfx } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { consumeTalk } from "../input";

type Tree = { id: string; x: number; z: number; lean: number; knot: boolean; kind: "sling" | "coins" | "joke" };

const TREES: Tree[] = [
  { id: "bent", x: -48, z: -158, lean: 0.22, knot: true, kind: "sling" },
  { id: "knot", x: 36, z: -40, lean: 0.04, knot: true, kind: "coins" },
  { id: "plain", x: -90, z: -48, lean: 0.02, knot: false, kind: "joke" },
];

const ICE = { x: -88, z: -30 };
const GAP = { x: 14, z: -150 };
const RING = { x: -58, z: -146 };
const NIGHT = { x: FOUNTAIN.x + 4.2, z: FOUNTAIN.z + 2.4 };

function q(id: string) {
  return (useGame.getState().quests?.[id] ?? 0) > 0;
}
function mark(id: string) {
  useGame.getState().setQuest(id, 1);
}

const GRATE = { x: WELL_AT.x + 5.2, z: WELL_AT.z + 1.4 };

type Box = { x: number; z: number; hx: number; hz: number };

function pushOut(nx: number, nz: number, b: Box) {
  const dx = nx - b.x;
  const dz = nz - b.z;
  const hx = b.hx + 0.4;
  const hz = b.hz + 0.4;
  if (Math.abs(dx) >= hx || Math.abs(dz) >= hz) return null;
  if (hx - Math.abs(dx) < hz - Math.abs(dz)) return { x: b.x + Math.sign(dx || 1) * hx, z: nz };
  return { x: nx, z: b.z + Math.sign(dz || 1) * hz };
}

function hit(x: number, z: number, boxes: Box[]) {
  let hit = false;
  for (const b of boxes) {
    const p = pushOut(x, z, b);
    if (p) {
      x = p.x;
      z = p.z;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

export function collideFinds(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house) return null;
  const boxes: Box[] = [];
  for (const t of TREES) {
    if (!q(`find-${t.id}`)) boxes.push({ x: t.x, z: t.z, hx: 0.55, hz: 0.55 });
    else {
      boxes.push({ x: t.x - 2.2, z: t.z + 3.4, hx: 0.35, hz: 3.2 });
      boxes.push({ x: t.x + 2.2, z: t.z + 3.4, hx: 0.35, hz: 3.2 });
      boxes.push({ x: t.x, z: t.z + 6.6, hx: 2.3, hz: 0.35 });
    }
  }
  if (!q("find-ice")) boxes.push({ x: ICE.x, z: ICE.z, hx: 0.7, hz: 0.7 });
  if (!q("find-gap")) boxes.push({ x: GAP.x, z: GAP.z, hx: 2.2, hz: 0.55 });
  if (!q("find-grate")) boxes.push({ x: GRATE.x, z: GRATE.z, hx: 0.7, hz: 0.35 });
  return hit(nx, nz, boxes);
}

function openTree(t: Tree) {
  mark(`find-${t.id}`);
  sfx.grind();
  sfx.secret();
  const g = useGame.getState();
  if (t.kind === "sling") {
    if (!g.hasSling) {
      g.grantSling();
      revealItem("sling", true);
    } else g.addCoins(20);
    if (!q("root-key")) {
      mark("root-key");
      live.listen = "The roots kept a sling, and a key that is not a key for this room.";
    } else live.listen = "The hollow is already empty.";
  } else if (t.kind === "coins") {
    g.addCoins(9);
    sfx.chest();
    live.listen = "Nine coins in a knot of wood.";
  } else {
    live.listen = "The tree breaks. It was a tree. One coin, out of pity.";
    g.addCoins(1);
    sfx.chime();
  }
}

export function Finds() {
  const blast = useRef(false);
  const seen = useRef("");
  const [rev, setRev] = useState(0);
  const yIce = heightAt(ICE.x, ICE.z);
  const yGap = heightAt(GAP.x, GAP.z);
  const yRing = heightAt(RING.x, RING.z);
  const yNight = heightAt(NIGHT.x, NIGHT.z);
  const yGrate = heightAt(GRATE.x, GRATE.z);

  useFrame(() => {
    if (!live.blast) blast.current = false;
    else if (!blast.current) {
      blast.current = true;
      let special = false;
      for (const t of TREES) {
        if (q(`find-${t.id}`)) continue;
        if (Math.hypot(live.blast.x - t.x, live.blast.z - t.z) < 2.7) {
          openTree(t);
          special = true;
        }
      }
      if (!special && Math.hypot(live.blast.x, live.blast.z + 108) < 180 && !q("find-trees")) {
        mark("find-trees");
        live.listen = live.listen || "Most trees are just trees.";
      }
    }

    if (!q("find-ice") && live.blade === "fire" && live.slash && Math.hypot(live.slash.x - ICE.x, live.slash.z - ICE.z) < 2.2) {
      mark("find-ice");
      useGame.getState().addBombs(3);
      useGame.getState().addCoins(8);
      sfx.secret();
      live.listen = "The ice gives up. Bombs, and a few coins, were frozen inside.";
    } else if (!q("find-ice") && Math.hypot(live.x - ICE.x, live.z - ICE.z) < 2.4 && !live.listen && !live.talking) {
      live.hint = "A block of ice. Steel will not move it.";
    }

    if (!q("find-gap") && live.blade === "ice" && live.slash && Math.hypot(live.slash.x - GAP.x, live.slash.z - GAP.z) < 2.6) {
      mark("find-gap");
      sfx.secret();
      live.listen = "The cold holds. You can cross.";
    } else if (!q("find-gap") && Math.hypot(live.x - GAP.x, live.z - GAP.z) < 2.2 && !live.listen && !live.talking) {
      live.hint = "Too thin to swim. Too wet to walk.";
    }
    if (q("find-gap") && !q("find-gap-pay") && Math.hypot(live.x - (GAP.x + 3.2), live.z - GAP.z) < 1.1) {
      mark("find-gap-pay");
      useGame.getState().addCoins(11);
      sfx.chest();
      live.listen = "Eleven coins on the far bank.";
    }

    if (!q("find-ring") && Math.hypot(live.x - RING.x, live.z - RING.z) < 1.6 && !live.listen) {
      mark("find-ring");
      sfx.chime();
      live.listen = "Mushrooms in a circle. Nothing else happens. It is still a nice circle.";
    }

    const nearGrate = Math.hypot(live.x - GRATE.x, live.z - GRATE.z) < 1.6;
    if (nearGrate && !live.talking && !live.listen) {
      if (!q("root-key")) live.hint = "A grate. The lock looks like a root.";
      else if (!q("find-grate") && consumeTalk()) {
        mark("find-grate");
        useGame.getState().addCoins(25);
        sfx.secret();
        sfx.chest();
        live.listen = "The root key turns. Twenty-five coins were under the well road.";
      } else if (!q("find-grate")) live.hint = "The root key fits. Talk to the lock.";
    }

    if (live.night && !q("find-night") && Math.hypot(live.x - NIGHT.x, live.z - NIGHT.z) < 1.5 && consumeTalk() && !live.nearNpc && !live.talking) {
      mark("find-night");
      sfx.chime();
      live.listen = "I only sit here after dark. South, one trunk leans. I would not bomb it. Unless I would.";
    } else if (!live.night && q("find-night") && !q("find-warm") && Math.hypot(live.x - NIGHT.x, live.z - NIGHT.z) < 1.4) {
      mark("find-warm");
      live.listen = "The grass is still warm. They only come at night.";
    }

    if (live.sit && !q("find-sit") && Math.hypot(live.x - FOUNTAIN.x, live.z - FOUNTAIN.z) < 3.2) {
      mark("find-sit");
      sfx.chime();
      live.listen = "The fountain does not mind the company.";
    }
    const key = `${q("find-bent")}${q("find-knot")}${q("find-plain")}${q("find-ice")}${q("find-gap")}${q("find-grate")}${live.night ? 1 : 0}`;
    if (key !== seen.current) {
      seen.current = key;
      setRev((n) => n + 1);
    }
  });
  void rev;

  return (
    <group>
      {TREES.map((t) => {
        const open = q(`find-${t.id}`);
        const y = heightAt(t.x, t.z);
        if (open) {
          return (
            <group key={t.id}>
              <mesh position={[t.x, y + 0.04, t.z + 3.2]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1, 8]} />
                {lamb("#1a1614")}
              </mesh>
              <mesh position={[t.x, y + 0.9, t.z + 6.4]}>
                <boxGeometry args={[4.2, 1.8, 0.4]} />
                {lamb("#4a4034")}
              </mesh>
            </group>
          );
        }
        return (
          <group key={t.id} position={[t.x, y, t.z]} rotation={[t.lean, 0.4, 0]}>
            <mesh position={[0, 1.3, 0]} castShadow>
              <cylinderGeometry args={[0.28, 0.4, 2.4, 6]} />
              {lamb(t.knot ? "#5a4030" : "#6b4a32")}
            </mesh>
            <mesh position={[0.1, 2.8, 0]} castShadow>
              <dodecahedronGeometry args={[1.15, 0]} />
              {lamb("#2f6a34")}
            </mesh>
            {t.knot ? (
              <mesh position={[0.32, 1.1, 0.2]}>
                <sphereGeometry args={[0.16, 6, 5]} />
                {lamb("#2a2218")}
              </mesh>
            ) : null}
          </group>
        );
      })}
      {q("find-ice") ? null : (
        <mesh position={[ICE.x, yIce + 0.45, ICE.z]}>
          <boxGeometry args={[1.1, 0.9, 1.1]} />
          {lamb("#c5e4f2")}
        </mesh>
      )}
      <mesh position={[GAP.x, yGap + 0.05, GAP.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.4, 1.3]} />
        {lamb(q("find-gap") ? "#d5eef8" : "#3a78a8")}
      </mesh>
      {q("find-grate") ? null : (
        <mesh position={[GRATE.x, yGrate + 0.08, GRATE.z]}>
          <boxGeometry args={[1.2, 0.12, 0.7]} />
          {lamb("#3a3e42")}
        </mesh>
      )}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[RING.x + Math.cos(a) * 0.8, yRing + 0.08, RING.z + Math.sin(a) * 0.8]}>
            <sphereGeometry args={[0.1, 5, 4]} />
            {lamb(i % 2 ? "#c45a3a" : "#e6d2a8")}
          </mesh>
        );
      })}
      {live.night ? (
        <group position={[NIGHT.x, yNight, NIGHT.z]}>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.4, 0.7, 0.3]} />
            {lamb("#2c3148")}
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <boxGeometry args={[0.24, 0.24, 0.24]} />
            {lamb("#e6c2a0")}
          </mesh>
        </group>
      ) : null}
    </group>
  );
}
