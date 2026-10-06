import { useEffect, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { live } from "./live";
import { sfx, playFanfare } from "../audio";
import { useGame } from "../store";
import { revealItem } from "../items";
import { N64Foe, type FangPose } from "./n64";
import { heightAt } from "./field";
import { roomZ, splitZ } from "./dungeonLayout";
import { lamb } from "./mats";
import { puffAt, crackAt } from "./fx";
import { pushAabb } from "./house";
import { takeCipher } from "../cipher";

/** Sun Hollow boss room center. */
export const WARDEN_AT = { x: 0, z: roomZ(11) };
const DOOR_Z = splitZ(10);
const ARENA_R = 15.4;
const SHRINE = { x: 0, z: roomZ(11) - 14 };

const GOLD = "#c9a227";
const FIRE = "#e07a28";
const LEAF = "#6a8a4a";
const EMBER = "#c42838";
const SUN = "#e8c040";

type PlateId = "gold" | "fire" | "leaf" | "ember";
const PLATES: { id: PlateId; x: number; z: number; color: string }[] = [
  { id: "gold", x: 0, z: WARDEN_AT.z + 8.2, color: GOLD },
  { id: "fire", x: 8.2, z: WARDEN_AT.z, color: FIRE },
  { id: "leaf", x: 0, z: WARDEN_AT.z - 8.2, color: LEAF },
  { id: "ember", x: -8.2, z: WARDEN_AT.z, color: EMBER },
];

const LENSES = [0, 1, 2, 3].map((i) => {
  const a = (i / 4) * Math.PI * 2 + 0.55;
  return { x: Math.sin(a) * 12.6, z: WARDEN_AT.z + Math.cos(a) * 12.6 };
});

type Mode =
  | "sleep"
  | "intro"
  | "stalk"
  | "wind"
  | "slam"
  | "open"
  | "paw"
  | "charge"
  | "swipe"
  | "leap"
  | "rain"
  | "beam"
  | "down"
  | "fall"
  | "dead";

type Ring = { r: number; t: number; x: number; z: number };
type Bolt = { x: number; y: number; z: number; vx: number; vz: number; age: number };

const MAX_HP = 6;

function plateAt(x: number, z: number): PlateId | null {
  for (const p of PLATES) {
    if (Math.hypot(x - p.x, z - p.z) < 2.15) return p.id;
  }
  return null;
}

function clampArena(x: number, z: number) {
  const dx = x - WARDEN_AT.x;
  const dz = z - WARDEN_AT.z;
  const d = Math.hypot(dx, dz);
  if (d <= ARENA_R) return { x, z };
  const s = ARENA_R / d;
  return { x: WARDEN_AT.x + dx * s, z: WARDEN_AT.z + dz * s };
}

export function collideWarden(nx: number, nz: number): { x: number; z: number } | null {
  if (live.house) return null;
  let x = nx;
  let z = nz;
  let hit = false;
  if (live.bossLock) {
    const door = pushAabb(x, z, 0, DOOR_Z, 5.4, 0.55, 0.55);
    if (door) {
      x = door.x;
      z = door.z;
      hit = true;
    }
  }
  const p = live.foeTrack["cavern-warden"];
  if (p && live.bossFight && !live.bossDown) {
    const body = pushAabb(x, z, p.x, p.z, 1.15, 1.15, 0.85);
    if (body) {
      x = body.x;
      z = body.z;
      hit = true;
    }
  }
  return hit ? { x, z } : null;
}

export function WardenBoss() {
  const beaten = useRef((useGame.getState().defeated.cavern ?? []).includes("cavern-warden"));
  const root = useRef<THREE.Group>(null);
  const eye = useRef<THREE.MeshLambertMaterial>(null);
  const lid = useRef<THREE.Mesh>(null);
  const crown = useRef<THREE.Group>(null);
  const eyeLight = useRef<THREE.PointLight>(null);
  const poseRef = useRef<FangPose>("sit");
  const act = useRef<"hurt" | "slam" | "hop" | undefined>(undefined);
  const mode = useRef<Mode>(beaten.current ? "dead" : "sleep");
  const pos = useRef({ x: WARDEN_AT.x, z: WARDEN_AT.z });
  const yaw = useRef(0);
  const t = useRef(0);
  const phase = useRef(1);
  const hp = useRef(MAX_HP);
  const eyeOpen = useRef(false);
  const color = useRef<PlateId>("gold");
  const rings = useRef<Ring[]>([]);
  const bolts = useRef<Bolt[]>([]);
  const lenses = useRef([false, false, false, false]);
  const clangN = useRef(0);
  const clangAt = useRef(-9);
  const hitAt = useRef(-9);
  const swipeAt = useRef(-9);
  const rainN = useRef(0);
  const gemTook = useRef(Boolean(useGame.getState().gems.emerald));
  const taught = useRef({ lid: false, plate: false, lens: false, jump: false, down: false });
  const seal = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Mesh>(null);
  const plateMats = useRef<(THREE.MeshLambertMaterial | null)[]>([]);
  const lensMats = useRef<(THREE.MeshLambertMaterial | null)[]>([]);
  const ringMesh = useRef<(THREE.Mesh | null)[]>([]);
  const ringMat = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const shell = useRef<(THREE.Mesh | null)[]>([]);
  const rubble = useRef<THREE.Group>(null);

  useEffect(() => {
    return () => {
      live.bossFight = false;
      live.bossLock = false;
      if (!beaten.current) {
        live.bossTitle = null;
        live.bossHp = 0;
        live.bossMax = 0;
      }
    };
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(0.05, rawDt);
    const deadList = useGame.getState().defeated.cavern ?? [];
    const nowDead = deadList.includes("cavern-warden");
    if (nowDead) beaten.current = true;
    else if (beaten.current && (mode.current === "dead" || mode.current === "sleep")) {
      beaten.current = false;
      mode.current = "sleep";
      hp.current = MAX_HP;
      phase.current = 1;
      pos.current.x = WARDEN_AT.x;
      pos.current.z = WARDEN_AT.z;
      eyeOpen.current = false;
      lenses.current = [false, false, false, false];
      rings.current = [];
      bolts.current = [];
      gemTook.current = Boolean(useGame.getState().gems.emerald);
      poseRef.current = "sit";
    }

    const dx = live.x - pos.current.x;
    const dz = live.z - pos.current.z;
    const d = Math.hypot(dx, dz) || 0.001;
    const inRoom = Math.abs(live.x) < 28 && live.z < DOOR_Z - 1.2 && live.z > WARDEN_AT.z - 22;
    const freeze = live.paused || live.doorMath || live.house;

    if (beaten.current && mode.current !== "dead" && mode.current !== "fall") mode.current = "dead";

    if (mode.current === "sleep" && inRoom && !freeze && !beaten.current) {
      mode.current = "intro";
      t.current = 0;
      live.bossFight = true;
      live.bossLock = true;
      live.bossTitle = "THE HOLLOW SUN";
      live.bossTitleT = 4.8;
      live.bossMax = MAX_HP;
      live.bossHp = hp.current;
      live.bossDying = false;
      live.bossDown = false;
      live.aggroIds.add("cavern-warden");
      poseRef.current = "yell";
      sfx.howl();
      sfx.bark();
      live.spark = 1;
      live.listen = "Stone stood up. A lid on its chest stayed shut.";
    }

    if (live.bossTitleT > 0) live.bossTitleT = Math.max(0, live.bossTitleT - dt);

    if (mode.current !== "sleep" && mode.current !== "dead") {
      live.foeTrack["cavern-warden"] = { x: pos.current.x, z: pos.current.z };
      live.aggroIds.add("cavern-warden");
      if (mode.current !== "fall") {
        live.bossFight = true;
        live.bossHp = hp.current;
        live.bossMax = MAX_HP;
      }
    }

    if (seal.current) {
      seal.current.visible = live.bossLock;
      seal.current.position.y = live.bossLock ? 1.7 : -4;
    }

    if (!freeze && mode.current !== "sleep" && mode.current !== "dead") {
      t.current += dt;
      act.current = undefined;
      const nx = dx / d;
      const nz = dz / d;
      yaw.current += ((Math.atan2(-dx, -dz) - yaw.current + Math.PI * 3) % (Math.PI * 2) - Math.PI) * (1 - Math.exp(-dt * 3.4));

      if (mode.current === "intro") {
        poseRef.current = t.current < 1.2 ? "yell" : "hiss";
        if (t.current > 2.7) {
          mode.current = "stalk";
          t.current = 0;
          poseRef.current = "chase";
        }
      } else if (mode.current === "stalk") {
        poseRef.current = "chase";
        const spd = phase.current === 1 ? 2.05 : 2.7;
        pos.current.x += nx * spd * dt;
        pos.current.z += nz * spd * dt;
        const c = clampArena(pos.current.x, pos.current.z);
        pos.current.x = c.x;
        pos.current.z = c.z;
        if (d < 2.2 && live.playT - swipeAt.current > 1.15) {
          mode.current = "swipe";
          t.current = 0;
          swipeAt.current = live.playT;
          poseRef.current = "swipe";
          sfx.claw();
        } else if (t.current > (phase.current === 1 ? 2.35 : 1.65)) {
          if (phase.current >= 3) {
            mode.current = "leap";
            t.current = 0;
            poseRef.current = "yell";
            sfx.howl();
          } else if (phase.current === 2 && Math.random() < 0.58) {
            mode.current = "paw";
            t.current = 0;
            poseRef.current = "hiss";
            sfx.bark();
            live.listen = live.listen || "It dropped a shoulder.";
          } else {
            mode.current = "wind";
            t.current = 0;
            poseRef.current = "hiss";
            sfx.hiss();
          }
        }
      } else if (mode.current === "wind") {
        poseRef.current = "hiss";
        act.current = "hop";
        if (t.current > 0.9) {
          mode.current = "slam";
          t.current = 0;
          poseRef.current = "swipe";
          act.current = "slam";
          sfx.sunSlam();
          live.spark = 1;
          crackAt(pos.current.x, pos.current.z);
          puffAt(pos.current.x, pos.current.z, heightAt(pos.current.x, pos.current.z) + 0.2, true);
          rings.current.push({ r: 0.6, t: 0, x: pos.current.x, z: pos.current.z });
          if (!taught.current.jump) {
            taught.current.jump = true;
            live.listen = "The floor jumped.";
          }
        }
      } else if (mode.current === "slam") {
        poseRef.current = "swipe";
        act.current = "slam";
        if (t.current > 0.38) {
          mode.current = "open";
          t.current = 0;
          eyeOpen.current = true;
          if (phase.current === 2) {
            color.current = PLATES[Math.floor(Math.random() * PLATES.length)]!.id;
          }
          sfx.sunOpen();
          live.wardenCue = true;
          if (!taught.current.lid) {
            taught.current.lid = true;
            live.listen = "The lid opened.";
          } else if (phase.current === 2 && !taught.current.plate) {
            taught.current.plate = true;
            live.listen = "The eye took a color. The floor has the same four.";
          }
        }
      } else if (mode.current === "open") {
        poseRef.current = "hiss";
        const hold = phase.current === 1 ? 2.7 : 2.2;
        if (t.current > hold) {
          eyeOpen.current = false;
          mode.current = "stalk";
          t.current = 0;
        }
      } else if (mode.current === "paw") {
        poseRef.current = "hiss";
        act.current = "hop";
        if (t.current > 0.72) {
          mode.current = "charge";
          t.current = 0;
          poseRef.current = "gallop";
          sfx.bark();
        }
      } else if (mode.current === "charge") {
        poseRef.current = "gallop";
        pos.current.x += nx * 8.2 * dt;
        pos.current.z += nz * 8.2 * dt;
        const c = clampArena(pos.current.x, pos.current.z);
        pos.current.x = c.x;
        pos.current.z = c.z;
        if (d < 1.75 && live.heroFlash < 0.2) {
          hurtHero(nx, nz, 10);
          sfx.hit();
        }
        if (t.current > 0.95) {
          mode.current = "open";
          t.current = 0;
          eyeOpen.current = true;
          color.current = PLATES[Math.floor(Math.random() * PLATES.length)]!.id;
          sfx.sunOpen();
          if (!taught.current.plate) {
            taught.current.plate = true;
            live.listen = "The eye took a color. The floor has the same four.";
          }
        }
      } else if (mode.current === "swipe") {
        poseRef.current = "swipe";
        if (t.current > 0.18 && t.current < 0.4 && d < 2.05 && live.heroFlash < 0.2) {
          hurtHero(nx, nz, 8);
        }
        if (t.current > 0.7) {
          mode.current = "stalk";
          t.current = 0;
        }
      } else if (mode.current === "leap") {
        poseRef.current = "yell";
        act.current = "hop";
        pos.current.x += (WARDEN_AT.x - pos.current.x) * (1 - Math.exp(-dt * 4));
        pos.current.z += (WARDEN_AT.z - pos.current.z) * (1 - Math.exp(-dt * 4));
        if (t.current > 1.15) {
          mode.current = "rain";
          t.current = 0;
          rainN.current = 0;
          poseRef.current = "yell";
          if (!taught.current.lens) {
            taught.current.lens = true;
            live.listen = "The four suns on the pillars woke.";
          }
        }
      } else if (mode.current === "rain") {
        poseRef.current = "yell";
        if (t.current > 0.5) {
          t.current = 0;
          rainN.current += 1;
          const lead = 0.32;
          const tx = live.x + (-Math.sin(live.yaw)) * live.speed * lead;
          const tz = live.z + (-Math.cos(live.yaw)) * live.speed * lead;
          const bx = pos.current.x;
          const bz = pos.current.z;
          const dd = Math.hypot(tx - bx, tz - bz) || 1;
          bolts.current.push({
            x: bx,
            y: heightAt(bx, bz) + 2.4,
            z: bz,
            vx: ((tx - bx) / dd) * 7.0,
            vz: ((tz - bz) / dd) * 7.0,
            age: 0,
          });
          sfx.crackle();
          if (rainN.current === 4 && !lenses.current.some(Boolean)) {
            live.listen = "The four suns on the pillars woke.";
          }
        }
        const lit = lenses.current.filter(Boolean).length;
        if (lit >= 4 && rainN.current >= 2) {
          mode.current = "beam";
          t.current = 0;
          sfx.flare();
          live.spark = 1;
          live.listen = "The sun fell on it.";
        }
      } else if (mode.current === "beam") {
        poseRef.current = "hiss";
        act.current = "hurt";
        if (t.current > 1.15) {
          mode.current = "down";
          t.current = 0;
          eyeOpen.current = true;
          live.bossDown = true;
          poseRef.current = "sit";
          sfx.sunCrack();
          crackAt(pos.current.x, pos.current.z);
          if (!taught.current.down) {
            taught.current.down = true;
            live.listen = "It fell. The shell is open.";
          }
        }
      } else if (mode.current === "down") {
        poseRef.current = "sit";
        eyeOpen.current = true;
        if (t.current > 5.2 && hp.current > 0) {
          live.bossDown = false;
          eyeOpen.current = false;
          mode.current = "leap";
          t.current = 0;
        }
      } else if (mode.current === "fall") {
        poseRef.current = t.current < 0.85 ? "yell" : "sit";
        act.current = t.current < 0.85 ? "hurt" : undefined;
        eyeOpen.current = true;
        live.bossDown = true;
        if (t.current > 1.85) {
          mode.current = "dead";
          live.listen = "The Hollow Sun cracked. The shrine behind it is quiet.";
        }
      }
    }

    if (!freeze) {
      for (const ring of rings.current) {
        ring.t += dt;
        ring.r += dt * 11.5;
        const band = Math.abs(Math.hypot(live.x - ring.x, live.z - ring.z) - ring.r);
        const airborne = !live.grounded && live.y > heightAt(live.x, live.z) + 0.55;
        if (band < 0.62 && !airborne && live.heroFlash < 0.18 && !live.god && mode.current !== "dead" && mode.current !== "fall") {
          hurtHero(live.x - ring.x, live.z - ring.z, 9);
        }
      }
      rings.current = rings.current.filter((r) => r.r < 18);
    }
    for (let i = 0; i < ringMesh.current.length; i++) {
      const m = ringMesh.current[i];
      const mat = ringMat.current[i];
      const r0 = rings.current[i];
      if (!m || !mat) continue;
      if (r0) {
        m.visible = true;
        m.position.set(r0.x, heightAt(r0.x, r0.z) + 0.08, r0.z);
        m.scale.setScalar(Math.max(0.2, r0.r));
        mat.opacity = Math.max(0, 0.72 - r0.t * 0.5);
      } else {
        m.visible = false;
      }
    }

    if (!freeze) {
      for (const b of bolts.current) {
        b.age += dt;
        b.x += b.vx * dt;
        b.z += b.vz * dt;
        b.y += (heightAt(b.x, b.z) + 0.55 - b.y) * (1 - Math.exp(-dt * 3));
        if (Math.hypot(live.x - b.x, live.z - b.z) < 0.85 && live.heroFlash < 0.18 && !live.god && mode.current !== "dead" && mode.current !== "fall") {
          if (live.shieldUp && useGame.getState().hasShield) sfx.block();
          else {
            const hx = live.x - b.x;
            const hz = live.z - b.z;
            hurtHero(hx, hz, 6);
          }
          b.age = 9;
        }
      }
      bolts.current = bolts.current.filter((b) => b.age < 2.6);
    }

    if (phase.current >= 3 && mode.current !== "dead" && mode.current !== "sleep" && mode.current !== "fall" && !freeze) {
      for (let i = 0; i < LENSES.length; i++) {
        if (lenses.current[i]) continue;
        const L = LENSES[i]!;
        for (const a of live.arrows) {
          if (Math.hypot(a.x - L.x, a.z - L.z) < 1.15 && a.y > heightAt(L.x, L.z) + 1.4) {
            lenses.current[i] = true;
            a.age = 9;
            sfx.chime();
            puffAt(L.x, L.z, heightAt(L.x, L.z) + 3.2);
            live.listen = `${lenses.current.filter(Boolean).length} of 4.`;
          }
        }
      }
    }
    for (let i = 0; i < lensMats.current.length; i++) {
      const m = lensMats.current[i];
      if (!m) continue;
      const on = lenses.current[i];
      const wake = phase.current >= 3 && mode.current !== "sleep" && mode.current !== "dead";
      m.emissiveIntensity = on ? 1.55 : wake ? 0.55 + Math.sin(live.playT * 7 + i) * 0.28 : 0.12;
    }

    if (beam.current) {
      const on = mode.current === "beam";
      beam.current.visible = on;
      if (on) beam.current.scale.y = 1 + Math.sin(t.current * 18) * 0.06;
    }

    if (!freeze && mode.current !== "sleep" && mode.current !== "dead" && mode.current !== "intro" && mode.current !== "fall") {
      let seedHit = false;
      let seedKind: "seed" | "arrow" | null = null;
      for (const a of live.arrows) {
        if (Math.hypot(a.x - pos.current.x, a.z - pos.current.z) < 1.55 && a.y > heightAt(pos.current.x, pos.current.z) + 0.7) {
          seedHit = true;
          seedKind = a.kind === "seed" ? "seed" : "arrow";
          a.age = 9;
          break;
        }
      }
      const swordHit =
        Boolean(live.slash) &&
        Math.hypot((live.slash?.x ?? 0) - pos.current.x, (live.slash?.z ?? 0) - pos.current.z) < (live.slash?.r ?? 1.2) + 0.7;

      if ((seedHit || swordHit) && live.playT - hitAt.current > 0.38) {
        const needSling = seedKind === "seed" || seedKind === "arrow";
        if (mode.current === "down" && swordHit) {
          wound(1, true);
        } else if (eyeOpen.current && needSling) {
          if (phase.current === 2) {
            const stand = plateAt(live.x, live.z);
            if (stand !== color.current) {
              clang("Stand on the color it shows. Then a seed.");
            } else {
              wound(1, false);
            }
          } else if (phase.current === 1) {
            wound(1, false);
          } else if (mode.current === "down") {
            wound(1, false);
          } else {
            clang();
          }
        } else {
          clang(swordHit && eyeOpen.current ? "The lid is open. A seed would fit." : undefined);
        }
      }
    }

    if (eye.current && lid.current) {
      const open = eyeOpen.current && mode.current !== "dead";
      const col = phase.current === 2 && open ? PLATES.find((p) => p.id === color.current)!.color : GOLD;
      eye.current.color.set(col);
      eye.current.emissive.set(col);
      eye.current.emissiveIntensity = open ? 1.85 : 0.08;
      lid.current.scale.y = open ? 0.1 : 1;
      lid.current.position.y = open ? 1.72 : 1.62;
    }
    if (eyeLight.current) {
      eyeLight.current.intensity = eyeOpen.current && mode.current !== "dead" ? 5.5 : 0;
      eyeLight.current.color.set(phase.current === 2 && eyeOpen.current ? PLATES.find((p) => p.id === color.current)!.color : SUN);
    }
    if (crown.current) {
      crown.current.rotation.y += dt * (eyeOpen.current ? 1.8 : 0.45);
    }

    for (let i = 0; i < PLATES.length; i++) {
      const m = plateMats.current[i];
      if (!m) continue;
      const p = PLATES[i]!;
      const active = phase.current === 2 && eyeOpen.current && color.current === p.id && mode.current !== "dead";
      const stood = plateAt(live.x, live.z) === p.id;
      m.emissiveIntensity = active ? (stood ? 1.45 : 0.75 + Math.sin(live.playT * 8) * 0.28) : phase.current >= 2 && mode.current !== "dead" ? 0.22 : 0.06;
    }

    for (let i = 0; i < shell.current.length; i++) {
      const m = shell.current[i];
      if (!m) continue;
      m.visible = mode.current !== "dead" && hp.current > 4 - i;
    }

    if (root.current) {
      const y = heightAt(pos.current.x, pos.current.z);
      const hop = mode.current === "leap" ? Math.sin(Math.min(1, t.current) * Math.PI) * 2.4 : mode.current === "fall" ? -Math.min(0.55, t.current * 0.4) : 0;
      root.current.position.set(pos.current.x, y + hop, pos.current.z);
      root.current.rotation.y = yaw.current;
      root.current.rotation.x = mode.current === "fall" ? Math.min(0.85, t.current * 0.55) : 0;
      const flash = live.playT - hitAt.current < 0.16;
      root.current.scale.setScalar((flash ? 1.08 : 1) * 1.22);
      root.current.visible = mode.current !== "dead";
    }
    if (rubble.current) rubble.current.visible = mode.current === "dead";

    if (mode.current === "dead") {
      live.aggroIds.delete("cavern-warden");
      live.bossFight = false;
      live.bossLock = false;
      live.bossDown = true;
      if (live.bossTitleT <= 0) {
        live.bossTitle = null;
        live.bossMax = 0;
      }
      if (!gemTook.current && !useGame.getState().gems.emerald) {
        const ds = Math.hypot(live.x - SHRINE.x, live.z - SHRINE.z);
        if (ds < 1.55 && !live.house) {
          gemTook.current = true;
          useGame.getState().grantGem("emerald");
          revealItem("emerald", true);
          live.ceremony = { gem: "emerald", t: 0 };
          live.listen = "The Sun Jewel. The shrine let it go.";
        } else if (ds < 3.4) {
          live.listen = live.listen || "The shrine is quiet now.";
        }
      }
    }

    function clang(say?: string) {
      if (live.playT - clangAt.current < 0.45) return;
      clangAt.current = live.playT;
      clangN.current += 1;
      hitAt.current = live.playT;
      sfx.miss();
      sfx.block();
      puffAt(pos.current.x, pos.current.z, heightAt(pos.current.x, pos.current.z) + 1.6);
      if (say && clangN.current >= 2) live.listen = say;
      else if (clangN.current === 1) live.listen = "The shell rang.";
      else if (clangN.current === 3 && !eyeOpen.current) live.listen = "Wait. The lid opens after it slams.";
    }

    function wound(n: number, sword: boolean) {
      hitAt.current = live.playT;
      hp.current = Math.max(0, hp.current - n);
      live.bossHp = hp.current;
      act.current = "hurt";
      sfx.sunCrack();
      live.spark = Math.max(live.spark, 0.85);
      puffAt(pos.current.x, pos.current.z, heightAt(pos.current.x, pos.current.z) + 1.5, true);
      crackAt(pos.current.x, pos.current.z);
      eyeOpen.current = false;
      if (hp.current <= 0) {
        finish();
        return;
      }
      if (phase.current === 1 && hp.current <= 4) {
        phase.current = 2;
        live.listen = "The floor found four colors.";
        sfx.chime();
        mode.current = "stalk";
        t.current = 0;
      } else if (phase.current === 2 && hp.current <= 2) {
        phase.current = 3;
        live.listen = "It climbed the sun in the floor.";
        sfx.howl();
        mode.current = "leap";
        t.current = 0;
      } else if (sword) {
        live.listen = "The stone gave.";
        mode.current = "down";
        t.current = 0.2;
        eyeOpen.current = true;
        live.bossDown = true;
      } else {
        mode.current = "stalk";
        t.current = 0;
      }
    }

    function finish() {
      mode.current = "fall";
      t.current = 0;
      beaten.current = true;
      live.bossDying = true;
      live.bossDown = true;
      live.bossHp = 0;
      live.bossTitleT = 2.6;
      live.aggroIds.delete("cavern-warden");
      poseRef.current = "yell";
      const g = useGame.getState();
      g.markDefeated("cavern", "cavern-warden");
      g.addCoins(48);
      useGame.setState({ xp: useGame.getState().xp + 90 });
      playFanfare("full");
      sfx.over();
      live.spark = 1;
      crackAt(pos.current.x, pos.current.z);
      puffAt(pos.current.x, pos.current.z, heightAt(pos.current.x, pos.current.z) + 1, true);
      live.listen = "The Hollow Sun cracked.";
      live.hint = "The shrine behind it is quiet.";
      if (live.lock?.id === "cavern-warden") live.lock = null;
      takeCipher("tablet", false);
    }

    function hurtHero(hx: number, hz: number, knock: number) {
      if (live.god || live.heroFlash > 0.18) return;
      if (live.shieldUp && useGame.getState().hasShield) {
        sfx.block();
        return;
      }
      useGame.getState().hurtField(4, true);
      const len = Math.hypot(hx, hz) || 1;
      live.knock = { vx: (hx / len) * knock, vz: (hz / len) * knock, t: 0.22 };
      sfx.ouch();
    }
  });

  return (
    <group>
      <group ref={root}>
        <N64Foe kind="warden" seed={11} world="cavern" pose="sit" poseRef={poseRef} actRef={act} />
        <group ref={crown} position={[0, 2.08, -0.06]}>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} position={[Math.sin((i / 8) * Math.PI * 2) * 0.28, 0.12, Math.cos((i / 8) * Math.PI * 2) * 0.28]} rotation={[0.15, (i / 8) * Math.PI * 2, 0]} castShadow>
              <coneGeometry args={[0.06, 0.28, 5]} />
              {lamb(GOLD)}
            </mesh>
          ))}
        </group>
        <mesh position={[-0.42, 1.28, -0.08]} rotation={[0.1, 0, 0.45]} castShadow>
          <boxGeometry args={[0.38, 0.22, 0.28]} />
          {lamb(GOLD, { kind: "stone" })}
        </mesh>
        <mesh position={[0.42, 1.28, -0.08]} rotation={[0.1, 0, -0.45]} castShadow>
          <boxGeometry args={[0.38, 0.22, 0.28]} />
          {lamb(GOLD, { kind: "stone" })}
        </mesh>
        {[-1, 1].map((s, i) => (
          <mesh
            key={`sh${s}`}
            ref={(el) => {
              shell.current[i] = el;
            }}
            position={[s * 0.18, 1.02, 0.28]}
            rotation={[0.35, s * 0.2, 0]}
            castShadow
          >
            <boxGeometry args={[0.42, 0.55, 0.12]} />
            {lamb("#4a3a2c", { kind: "stone" })}
          </mesh>
        ))}
        <mesh position={[0, 1.48, -0.52]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.045, 8, 16]} />
          {lamb(GOLD)}
        </mesh>
        <mesh position={[0, 1.48, -0.56]}>
          <sphereGeometry args={[0.22, 12, 10]} />
          <meshLambertMaterial ref={eye} color={GOLD} emissive={GOLD} emissiveIntensity={0.1} />
        </mesh>
        <mesh ref={lid} position={[0, 1.62, -0.6]}>
          <boxGeometry args={[0.5, 0.18, 0.14]} />
          {lamb("#3a322c", { kind: "stone" })}
        </mesh>
        <pointLight ref={eyeLight} position={[0, 1.5, -0.75]} color={SUN} intensity={0} distance={9} />
      </group>

      <group ref={rubble} visible={beaten.current}>
        <Rubble />
      </group>

      {PLATES.map((p, i) => (
        <group key={p.id} position={[p.x, heightAt(p.x, p.z) + 0.03, p.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2.05, 16]} />
            {lamb("#2a2218", { kind: "stone" })}
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <circleGeometry args={[1.72, 16]} />
            <meshLambertMaterial
              ref={(el) => {
                plateMats.current[i] = el;
              }}
              color={p.color}
              emissive={p.color}
              emissiveIntensity={0.05}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <ringGeometry args={[0.55, 0.82, 16]} />
            {lamb(SUN)}
          </mesh>
        </group>
      ))}

      {LENSES.map((L, i) => (
        <group key={i} position={[L.x, heightAt(L.x, L.z) + 3.15, L.z]}>
          <mesh>
            <sphereGeometry args={[0.38, 12, 8]} />
            <meshLambertMaterial
              ref={(el) => {
                lensMats.current[i] = el;
              }}
              color={GOLD}
              emissive={GOLD}
              emissiveIntensity={0.12}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.48, 0.05, 6, 14]} />
            {lamb(SUN)}
          </mesh>
          <mesh position={[0, -1.4, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 2.8, 6]} />
            {lamb("#4a3a28", { kind: "stone" })}
          </mesh>
        </group>
      ))}

      <mesh ref={beam} position={[WARDEN_AT.x, 6.2, WARDEN_AT.z]} visible={false}>
        <cylinderGeometry args={[0.55, 1.15, 12, 10]} />
        <meshBasicMaterial color="#ffe08a" transparent opacity={0.45} depthWrite={false} />
      </mesh>

      {[0, 1, 2].map((i) => (
        <mesh
          key={`ring${i}`}
          ref={(el) => {
            ringMesh.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <ringGeometry args={[0.86, 1.05, 28]} />
          <meshBasicMaterial
            ref={(el) => {
              ringMat.current[i] = el;
            }}
            color="#e8c040"
            transparent
            opacity={0.6}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      <Bolts bolts={bolts} />
      <SealMesh seal={seal} />
    </group>
  );
}

function SealMesh({ seal }: { seal: MutableRefObject<THREE.Group | null> }) {
  return (
    <group ref={seal} position={[0, 1.7, DOOR_Z]} visible={false}>
      <mesh castShadow>
        <boxGeometry args={[8.6, 3.4, 0.55]} />
        {lamb("#3a322c", { kind: "stone" })}
      </mesh>
      {[-2.4, -0.8, 0.8, 2.4].map((x) => (
        <mesh key={x} position={[x, 0, 0.32]} castShadow>
          <boxGeometry args={[0.22, 2.8, 0.12]} />
          {lamb(GOLD)}
        </mesh>
      ))}
      <mesh position={[0, 1.35, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 12]} />
        {lamb(GOLD)}
      </mesh>
    </group>
  );
}

function Bolts({ bolts }: { bolts: MutableRefObject<Bolt[]> }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    for (let i = 0; i < refs.current.length; i++) {
      const m = refs.current[i];
      const b = bolts.current[i];
      if (!m) continue;
      if (!b) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      m.position.set(b.x, b.y, b.z);
    }
  });
  return (
    <group>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          visible={false}
        >
          <sphereGeometry args={[0.22, 8, 6]} />
          <meshLambertMaterial color={GOLD} emissive={FIRE} emissiveIntensity={1.2} />
        </mesh>
      ))}
    </group>
  );
}

function Rubble() {
  const bits = useRef(
    Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return { x: Math.sin(a) * (1.15 + (i % 3) * 0.4), z: Math.cos(a) * (1.15 + (i % 2) * 0.42), s: 0.3 + (i % 3) * 0.09, r: i * 0.7 };
    }),
  );
  return (
    <group position={[WARDEN_AT.x, heightAt(WARDEN_AT.x, WARDEN_AT.z), WARDEN_AT.z]}>
      <mesh position={[0, 0.22, 0]} rotation={[0.4, 0.2, 0.1]} castShadow>
        <dodecahedronGeometry args={[0.55, 0]} />
        {lamb("#4a4038", { kind: "stone" })}
      </mesh>
      {bits.current.map((b, i) => (
        <mesh key={i} position={[b.x, 0.16, b.z]} rotation={[0.2, b.r, 0.1]} castShadow>
          <dodecahedronGeometry args={[b.s, 0]} />
          {lamb(i % 2 ? "#5a4a38" : GOLD, { kind: "stone" })}
        </mesh>
      ))}
      <mesh position={[0, 0.42, 0.1]} rotation={[0.6, 0.4, 0]}>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshLambertMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}
