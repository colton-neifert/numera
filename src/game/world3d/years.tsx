import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../store";
import { sfx } from "../audio";
import { touchState } from "../input";
import { live } from "./live";
import { heightAt, POND, setPondFrozen, VX, VZ } from "./field";

const GARDEN = { x: VX + 22, z: VZ - 12 };
const DUMMY = { x: VX - 18, z: VZ + 12 };
const OLD = { x: 56, z: -172 };

function lamb(color: string) {
  return <meshLambertMaterial color={color} />;
}

/** Outside stair on the west wall, then a loft tucked behind the house. */
export function houseLift(x: number, z: number) {
  const ox = x - OLD.x;
  const oz = z - OLD.z;
  if (ox < -3.25 && ox > -4.35 && oz < 2.4 && oz > -4.4) {
    const t = (2.4 - oz) / 6.8;
    return Math.max(0, Math.min(1, t)) * 1.7;
  }
  if (ox > -3.4 && ox < 2.4 && oz < -3.5 && oz > -5.6) return 1.7;
  return 0;
}

export function YearsMark() {
  const sprout = useRef<THREE.Group>(null);
  const dummy = useRef<THREE.Group>(null);
  const bend = useRef(0);
  const shake = useRef(0);
  const hits = useRef(0);
  const cool = useRef(0);
  const sham = useRef({ x: POND.x + 14, z: POND.z + 6 });
  const shamG = useRef<THREE.Group>(null);
  const drain = useRef(0);
  const mash = useRef(0);
  const lamp = useRef<THREE.Mesh>(null);
  const chair = useRef<THREE.Group>(null);
  const doorG = useRef<THREE.Group>(null);
  const keys = useRef<THREE.Group>(null);
  const bossG = useRef<THREE.Group>(null);
  const bossHp = useRef(6);
  const bossPhase = useRef(0);
  const eyeT = useRef(0);
  const ambience = useRef(0);
  const slammed = useRef(false);
  const opened = useRef(false);
  const plinkAt = useRef(0);
  const bats = useRef([true, true]);
  const batG = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    const g0 = useGame.getState();
    const yearsOn = (g0.quests?.years ?? 0) >= 3;
    setPondFrozen(yearsOn);
    if (live.house) return;
    const g = g0;
    const planted = (g.quests?.planted ?? 0) > 0;
    const grown = yearsOn && planted;
    cool.current = Math.max(0, cool.current - dt);
    if (sprout.current) {
      sprout.current.position.set(GARDEN.x, heightAt(GARDEN.x, GARDEN.z), GARDEN.z);
      sprout.current.rotation.z = Math.sin(bend.current * 14) * bend.current * 0.35;
      bend.current = Math.max(0, bend.current - dt * 1.4);
      sprout.current.scale.setScalar(grown ? 2.4 : planted ? 0.7 : 0.01);
    }
    if (dummy.current) {
      dummy.current.position.set(DUMMY.x, heightAt(DUMMY.x, DUMMY.z), DUMMY.z);
      dummy.current.rotation.x = Math.sin(shake.current * 18) * shake.current * 0.45;
      shake.current = Math.max(0, shake.current - dt * 2.2);
    }
    const gd = Math.hypot(live.x - GARDEN.x, live.z - GARDEN.z);
    if (!planted && gd < 1.5 && (g.seeds ?? 0) > 0 && cool.current <= 0) {
      cool.current = 1;
      useGame.setState({ seeds: Math.max(0, (g.seeds ?? 1) - 1) });
      g.setQuest("planted", 1);
      live.hint = "You planted it. It is only a sprout.";
      sfx.ok();
    } else if (grown && gd < 1.15 && live.grounded && cool.current <= 0) {
      cool.current = 0.8;
      bend.current = 1;
      live.springPop = 14;
      live.hint = "The stalk throws you.";
      sfx.ok();
    }
    const dd = Math.hypot(live.x - DUMMY.x, live.z - DUMMY.z);
    if (dd < 1.6 && live.swinging && live.swingU > 0.34 && live.swingU < 0.7 && cool.current <= 0) {
      cool.current = 0.28;
      shake.current = 1;
      hits.current += 1;
      sfx.material("wood");
      if (hits.current === 6) live.hint = "The post gives. You are hitting it.";
    }
    if (dd < 2.4 && hits.current < 6) live.listen = live.listen || "A training post. Hit it.";

    const hx = OLD.x;
    const hz = OLD.z;
    const ox = live.x - hx;
    const oz = live.z - hz;
    const hd = Math.hypot(ox, oz);
    if (hd < 7 && hd > 3.2) live.listen = live.listen || "A dark house. The door is open a little.";
    const HW = 3.1;
    const HD = 2.5;
    const wallOpen = (g.quests?.housewall ?? 0) >= 1;
    const falseGone = (g.quests?.falsewall ?? 0) >= 1;
    const blast = live.blast;
    if (!wallOpen && blast && Math.hypot(blast.x - hx, blast.z - (hz - 2.5)) < 2.5) {
      g.setQuest("housewall", 1);
      sfx.material("wood", true);
      live.hint = "The split boards blow out. A chest was behind them.";
    }
    if (!falseGone && blast && Math.hypot(blast.x - (hx + 9), blast.z - (hz + 2)) < 2.3) {
      g.setQuest("falsewall", 1);
      sfx.material("stone");
      live.hint = "The cracked stone breaks. Nothing was behind it.";
    }
    if (!wallOpen && Math.abs(ox) < 1.1 && oz < -1.3 && oz > -2.3) {
      live.listen = live.listen || "These boards are split worse than the rest.";
    }
    if (wallOpen && (g.quests?.housechest ?? 0) < 1 && Math.hypot(live.x - hx, live.z - (hz - 3.5)) < 1.15 && cool.current <= 0) {
      cool.current = 1.5;
      g.setQuest("housechest", 1);
      useGame.getState().addCoins(20);
      const st = useGame.getState();
      if (st.hasBombs) useGame.setState({ bombs: Math.min(st.bombsMax ?? 20, (st.bombs ?? 0) + 3) });
      live.hint = "The chest had coins. And a few bombs.";
      sfx.ok();
    }
    const door = Math.abs(ox) < 0.7 && oz > 0;
    const breach = wallOpen && Math.abs(ox) < 0.95 && oz < -0.8;
    if (!door && !breach && Math.abs(ox) < HW + 0.45 && Math.abs(oz) < HD + 0.45) {
      const inside = Math.abs(ox) < HW - 0.45 && Math.abs(oz) < HD - 0.45;
      if (!inside) {
        if (Math.abs(oz) > Math.abs(ox) * (HD / HW)) live.z = hz + Math.sign(oz || 1) * (HD + 0.5);
        else live.x = hx + Math.sign(ox || 1) * (HW + 0.5);
      } else if ((g.quests?.oldhouse ?? 0) < 1 && cool.current <= 0) {
        cool.current = 2;
        g.setQuest("oldhouse", 1);
        useGame.getState().addCoins(12);
        sfx.creak();
        live.hint = yearsOn ? "Something was standing here. It left twelve coins." : "Dust. Twelve coins. The stories were about this house.";
      }
    }

    if (yearsOn) {
      const sx = sham.current.x;
      const sz = sham.current.z;
      const sd = Math.hypot(live.x - sx, live.z - sz);
      if (live.cling > 0) {
        sham.current.x = live.x + Math.sin(live.yaw) * 0.45;
        sham.current.z = live.z + Math.cos(live.yaw) * 0.45;
        if (Math.hypot(touchState.stickX, touchState.stickY) > 0.35) mash.current += dt * 2.4;
        drain.current -= dt;
        if (drain.current <= 0) {
          drain.current = 0.45;
          useGame.setState({ hp: Math.max(1, useGame.getState().hp - 3) });
        }
        live.hint = "It's on your back. Wiggle free.";
        if (mash.current > 1.6) {
          live.cling = 0;
          mash.current = 0;
          sham.current.x = live.x - Math.sin(live.yaw) * 2.4;
          sham.current.z = live.z - Math.cos(live.yaw) * 2.4;
          live.hint = "You threw it off.";
          sfx.material("flesh");
        }
      } else if (sd < 16) {
        const step = Math.min(1.6 * dt, sd);
        sham.current.x += ((live.x - sx) / (sd || 1)) * step;
        sham.current.z += ((live.z - sz) / (sd || 1)) * step;
        if (sd < 1.25 && !live.mounted && cool.current <= 0) {
          cool.current = 0.4;
          live.cling = 1;
          mash.current = 0;
          live.speed = 0;
          sfx.material("flesh");
          live.hint = "It jumped on you.";
        }
      }
      if (shamG.current) {
        shamG.current.position.set(sham.current.x, heightAt(sham.current.x, sham.current.z), sham.current.z);
        shamG.current.visible = true;
      }
    } else if (shamG.current) shamG.current.visible = false;

    if (lamp.current) lamp.current.visible = yearsOn && live.dusk > 0.45;
    ambience.current -= dt;
    if (hd < 16 && ambience.current <= 0 && (g.quests?.houseboss ?? 0) < 1) {
      ambience.current = 6 + Math.random() * 8;
      if (Math.random() < 0.55) sfx.creak();
    }
    if (chair.current) {
      const rock = (g.quests?.houseboss ?? 0) >= 1 ? 0 : Math.sin(live.playT * 1.3) * (Math.sin(live.playT * 0.17) > -0.2 ? 0.22 : 0);
      chair.current.rotation.x = rock;
    }
    if (doorG.current) {
      const want = Math.hypot(live.x - hx, live.z - (hz + 2.6)) < 5.5 ? -1.15 : -0.15;
      if (want < -0.8 && !opened.current && (g.quests?.houseboss ?? 0) < 1) {
        opened.current = true;
        sfx.creak();
      }
      doorG.current.rotation.y += (want - doorG.current.rotation.y) * Math.min(1, dt * 1.4);
    }
    const insideHall = Math.abs(ox) < 2.1 && oz < 1.3 && oz > -2.2;
    if (insideHall && opened.current && !slammed.current && (g.quests?.houseboss ?? 0) < 1) {
      slammed.current = true;
      if (doorG.current) doorG.current.rotation.y = 0.05;
      sfx.doorSlam();
      live.glance = 0.9;
      live.hint = "The door shut behind you.";
    }
    plinkAt.current -= dt;
    if (hd < 8 && hd > 2.2 && plinkAt.current <= 0 && (g.quests?.houseboss ?? 0) < 1) {
      plinkAt.current = 1.6;
      sfx.plink(Math.floor(live.playT) % 5);
    }
    const loft = houseLift(live.x, live.z) > 1.4;
    const closet = loft && Math.abs(ox) < 1.6 && oz < -4.3;
    const beaten = (g.quests?.houseboss ?? 0) >= 1;
    if (!beaten && closet && bossPhase.current === 0) {
      eyeT.current += dt;
      if (eyeT.current > 1.7) {
        bossPhase.current = 1;
        if (bossG.current) bossG.current.position.set(hx, heightAt(hx, hz - 4.8) + 1.7, hz - 4.8);
        sfx.material("wood", true);
        live.hint = "Something left the dark.";
      }
    }
    if (!beaten && bossPhase.current === 1) {
      eyeT.current += dt;
      if (eyeT.current > 2.15) {
        bossPhase.current = 2;
        live.x += Math.sin(live.yaw) * 1.4;
        live.z += Math.cos(live.yaw) * 1.4;
        useGame.setState({ hp: Math.max(1, useGame.getState().hp - 4) });
        live.hint = "It hit you. The room is a fight now.";
      }
    }
    if (!beaten && bossPhase.current === 2 && bossG.current) {
      const bx = bossG.current.position.x;
      const bz = bossG.current.position.z;
      const dx = live.x - bx;
      const dz = live.z - bz;
      const dist = Math.hypot(dx, dz) || 1;
      const step = Math.min(2.4 * dt, dist);
      bossG.current.position.x += (dx / dist) * step;
      bossG.current.position.z += (dz / dist) * step;
      bossG.current.position.y = heightAt(bx, bz) + houseLift(bx, bz);
      if (dist < 1.15 && cool.current <= 0 && live.heroFlash < 0.2) {
        cool.current = 0.9;
        useGame.setState({ hp: Math.max(1, useGame.getState().hp - 3) });
        sfx.material("flesh");
        live.heroFlash = 0.7;
      }
      if (live.swinging && live.swingU > 0.34 && live.swingU < 0.72 && dist < 1.7 && cool.current <= 0.2) {
        bossHp.current -= 1;
        cool.current = 0.35;
        sfx.material("flesh", true);
        live.hint = bossHp.current > 0 ? "It staggers." : "It breaks apart.";
        if (bossHp.current <= 0) {
          bossPhase.current = 3;
          g.setQuest("houseboss", 1);
          useGame.getState().addCoins(24);
          live.hint = "Dust. Then a chest, where it fell.";
        }
      }
    }
    if (bossG.current) bossG.current.visible = !beaten && bossPhase.current >= 1 && bossPhase.current < 3;
    if ((beaten || bossPhase.current >= 3) && Math.hypot(live.x - hx, live.z - (hz - 5.15)) < 0.85 && (g.quests?.housepad ?? 0) < 1) {
      g.setQuest("housepad", 1);
      live.x = hx;
      live.z = hz + 9;
      live.y = heightAt(hx, hz + 9);
      live.hint = "You are outside. The house is quiet.";
      sfx.ok();
    }
    if (batG.current) {
      batG.current.children.forEach((c, i) => {
        if (!bats.current[i]) {
          c.visible = false;
          return;
        }
        const a = live.playT * (1.1 + i * 0.35) + i * 2;
        const bx = hx + Math.cos(a) * (3.4 + i * 0.8);
        const bz = hz - 1 + Math.sin(a) * 2.6;
        c.position.set(bx, heightAt(hx, hz) + 3.1 + Math.sin(a * 4) * 0.25, bz);
        c.rotation.z = Math.sin(live.playT * 14 + i) * 0.4;
        if (live.swinging && live.swingU > 0.32 && live.swingU < 0.7 && Math.hypot(live.x - bx, live.z - bz) < 1.45 && cool.current <= 0) {
          bats.current[i] = false;
          sfx.material("bat");
          cool.current = 0.25;
        }
      });
    }
  });

  const planted = useGame((s) => (s.quests?.planted ?? 0) > 0);
  const grown = useGame((s) => (s.quests?.years ?? 0) >= 3 && (s.quests?.planted ?? 0) > 0);
  const yearsOn = useGame((s) => (s.quests?.years ?? 0) >= 3);
  const wallOpen = useGame((s) => (s.quests?.housewall ?? 0) >= 1);
  const falseGone = useGame((s) => (s.quests?.falsewall ?? 0) >= 1);
  const beaten = useGame((s) => (s.quests?.houseboss ?? 0) >= 1);
  const kidScale = grown ? 0.92 : 0.62;
  const iceY = heightAt(POND.x, POND.z) + 0.08;

  return (
    <group>
      <group position={[VX - 6, heightAt(VX - 6, VZ + 4), VZ + 4]} scale={kidScale}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[0.4, 0.9, 0.28]} />
          {lamb("#6a8f62")}
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[0.28, 0.28, 0.26]} />
          {lamb("#c49674")}
        </mesh>
      </group>
      <group ref={sprout}>
        <mesh position={[0, grown ? 2.2 : 0.45, 0]}>
          <boxGeometry args={[grown ? 0.35 : 0.12, grown ? 4.2 : 0.7, grown ? 0.35 : 0.12]} />
          {lamb(planted ? "#3d7a32" : "#6a5030")}
        </mesh>
      </group>
      <group ref={dummy}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[0.7, 1.5, 0.45]} />
          {lamb("#c4a060")}
        </mesh>
        <mesh position={[0, 1.85, 0]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          {lamb("#8a6230")}
        </mesh>
      </group>
      {yearsOn ? (
        <group>
          <mesh position={[POND.x, iceY, POND.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[POND.r * 0.96, 10]} />
            <meshLambertMaterial color="#d5e4ee" />
          </mesh>
          <mesh position={[POND.x + POND.r * 0.7, iceY + 0.35, POND.z]}>
            <boxGeometry args={[1.4, 0.18, 0.45]} />
            {lamb("#6a5038")}
          </mesh>
        </group>
      ) : null}
      <group ref={shamG} visible={false}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[0.55, 1.15, 0.4]} />
          {lamb("#8d98a3")}
        </mesh>
        <mesh position={[0, 1.55, 0]}>
          <boxGeometry args={[0.36, 0.32, 0.32]} />
          {lamb("#6a7380")}
        </mesh>
      </group>
      <group position={[OLD.x, heightAt(OLD.x, OLD.z), OLD.z]}>
        {[-2.2, -0.7, 0.8, 2.2].map((x, i) =>
          wallOpen && (i === 1 || i === 2) ? null : (
            <mesh key={`b${i}`} position={[x, 1.2, -2.45]} castShadow>
              <boxGeometry args={[1.15, 2.3, 0.16]} />
              {lamb(i % 2 ? "#4a3424" : "#6a4830")}
            </mesh>
          ),
        )}
        {!wallOpen ? (
          <group position={[0, 1.15, -2.2]}>
            <mesh rotation={[0, 0, 0.5]}>
              <boxGeometry args={[0.1, 0.85, 0.12]} />
              {lamb("#1a120e")}
            </mesh>
            <mesh position={[0.2, -0.1, 0]} rotation={[0, 0, -0.7]}>
              <boxGeometry args={[0.1, 0.7, 0.12]} />
              {lamb("#1a120e")}
            </mesh>
          </group>
        ) : (
          <group position={[0, 0.45, -3.55]}>
            <mesh>
              <boxGeometry args={[0.7, 0.42, 0.48]} />
              {lamb("#8a6230")}
            </mesh>
            <mesh position={[0, 0.26, 0]}>
              <boxGeometry args={[0.74, 0.1, 0.5]} />
              {lamb("#c9a227")}
            </mesh>
          </group>
        )}
        <mesh position={[-2.3, 1.15, 2.45]} rotation={[0.08, 0, 0.04]} castShadow>
          <boxGeometry args={[1.5, 2.1, 0.16]} />
          {lamb("#5a4030")}
        </mesh>
        <mesh position={[2.35, 1.05, 2.5]} rotation={[-0.06, 0, -0.05]} castShadow>
          <boxGeometry args={[1.3, 1.7, 0.16]} />
          {lamb("#3e2c20")}
        </mesh>
        <mesh position={[-3.12, 1.2, 0]} castShadow>
          <boxGeometry args={[0.16, 2.15, 3.2]} />
          {lamb("#4a3428")}
        </mesh>
        <mesh position={[3.12, 0.9, 0]} castShadow>
          <boxGeometry args={[0.16, 1.6, 2.4]} />
          {lamb("#5a4030")}
        </mesh>
        <mesh position={[0, 2.72, 1.1]}>
          <boxGeometry args={[6.6, 0.22, 3.2]} />
          {lamb("#3a2a22")}
        </mesh>
        <mesh ref={lamp} position={[1.7, 1.7, 2.55]} visible={false}>
          <boxGeometry args={[0.18, 0.18, 0.05]} />
          {lamb("#f4e2a0")}
        </mesh>
        <mesh position={[0, 0.08, 3.6]}>
          <boxGeometry args={[4.4, 0.12, 2.2]} />
          {lamb("#5a4030")}
        </mesh>
        <group ref={chair} position={[1.35, 0.2, 3.8]}>
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[0.55, 0.08, 0.48]} />
            {lamb("#3a2a22")}
          </mesh>
          <mesh position={[0, 0.58, 0.18]}>
            <boxGeometry args={[0.55, 0.42, 0.08]} />
            {lamb("#3a2a22")}
          </mesh>
        </group>
        <group ref={doorG} position={[-0.15, 0, 2.55]}>
          <mesh position={[0.4, 1.15, 0]}>
            <boxGeometry args={[0.85, 2.15, 0.1]} />
            {lamb("#241810")}
          </mesh>
        </group>
        <mesh position={[-0.15, 0.55, 0.15]}>
          <boxGeometry args={[1.25, 0.65, 0.42]} />
          {lamb("#1c1410")}
        </mesh>
        <group ref={keys} position={[-0.15, 0.92, 0.38]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={`k${i}`} position={[-0.36 + i * 0.18, 0, 0]}>
              <boxGeometry args={[0.07, 0.1, 0.05]} />
              {lamb(i % 2 ? "#efe6d2" : "#14110e")}
            </mesh>
          ))}
        </group>
        <mesh position={[0.2, 0.42, 0.9]}>
          <boxGeometry args={[0.28, 0.1, 0.1]} />
          {lamb("#eee8dc")}
        </mesh>
        {[-3.6, -2.7, -1.8, -0.9, 0.1, 1.1, 2.0].map((z, i) => (
          <mesh key={`st${i}`} position={[-3.85, 0.1 + i * 0.24, z]}>
            <boxGeometry args={[0.85, 0.12, 0.72]} />
            {lamb(i % 2 ? "#4a3424" : "#6a4830")}
          </mesh>
        ))}
        <mesh position={[-0.2, 1.78, -4.5]}>
          <boxGeometry args={[4.8, 0.14, 2.3]} />
          {lamb("#3e3026")}
        </mesh>
        <mesh position={[0, 2.55, -4.6]}>
          <boxGeometry args={[2.6, 2.3, 2.1]} />
          <meshBasicMaterial color="#06050a" side={THREE.BackSide} />
        </mesh>
        {!beaten ? (
          <group position={[0.35, 2.35, -5.05]}>
            <mesh position={[-0.1, 0, 0]}>
              <boxGeometry args={[0.07, 0.05, 0.03]} />
              <meshBasicMaterial color="#f0ead0" />
            </mesh>
            <mesh position={[0.1, 0, 0]}>
              <boxGeometry args={[0.07, 0.05, 0.03]} />
              <meshBasicMaterial color="#f0ead0" />
            </mesh>
          </group>
        ) : (
          <group>
            <mesh position={[0, 2.05, -4.15]}>
              <boxGeometry args={[0.7, 0.38, 0.46]} />
              {lamb("#8a6230")}
            </mesh>
            <mesh position={[0, 1.8, -5.2]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.45, 0.7, 8]} />
              <meshBasicMaterial color="#4a88d8" side={THREE.DoubleSide} />
            </mesh>
          </group>
        )}
      </group>
      {!falseGone ? (
        <group position={[OLD.x + 9, heightAt(OLD.x + 9, OLD.z + 2), OLD.z + 2]}>
          <mesh castShadow>
            <boxGeometry args={[1.3, 1.1, 1.1]} />
            {lamb("#7a736c")}
          </mesh>
          <mesh position={[0.1, 0.1, 0.52]} rotation={[0, 0, 0.6]}>
            <boxGeometry args={[0.08, 0.7, 0.06]} />
            {lamb("#2a241c")}
          </mesh>
        </group>
      ) : null}
      <group ref={bossG} visible={false}>
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[0.72, 1.15, 0.46]} />
          {lamb("#241c22")}
        </mesh>
        <mesh position={[0, 1.4, -0.04]}>
          <boxGeometry args={[0.38, 0.3, 0.3]} />
          {lamb("#121014")}
        </mesh>
      </group>
      <group ref={batG}>
        {[0, 1].map((i) => (
          <mesh key={i}>
            <boxGeometry args={[0.55, 0.08, 0.22]} />
            {lamb("#2a241c")}
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function SleighPass() {
  const years = useGame((s) => (s.quests?.years ?? 0) >= 3);
  const rig = useRef<THREE.Group>(null);
  const t = useRef(-1);
  useFrame((_, dt) => {
    if (!rig.current) return;
    if (!years || live.house) {
      rig.current.visible = false;
      return;
    }
    const q = useGame.getState().quests?.sleigh ?? 0;
    const near = Math.hypot(live.x - POND.x, live.z - POND.z) < 24;
    if (q === 0 && near && !live.talking) {
      useGame.getState().setQuest("sleigh", 1);
      t.current = 0;
      sfx.creak();
      live.hint = "Something heavy is on the ice.";
    }
    if (q === 1 && t.current < 0) t.current = 0;
    if (t.current >= 0 && q < 2) {
      t.current += dt;
      const u = Math.min(1, t.current / 16);
      const x = POND.x - 16 + u * 34;
      const z = POND.z + Math.sin(u * Math.PI) * 3;
      rig.current.visible = true;
      rig.current.position.set(x, heightAt(x, z) + 0.15, z);
      rig.current.rotation.y = 0.2;
      const beasts = rig.current.children[0];
      if (beasts) beasts.position.y = Math.abs(Math.sin(t.current * 8)) * 0.08;
      if (t.current > 4.2 && t.current < 4.6) live.hint = "Where did that man go?";
      if (t.current > 6.4 && t.current < 6.8) {
        live.hint = "So. You're the one they talk about.";
        live.shieldUp = true;
        live.shieldAge = 0;
      }
      if (t.current > 12.5) {
        if (live.shieldUp) live.shieldUp = false;
        useGame.getState().setQuest("sleigh", 2);
        t.current = -2;
        rig.current.visible = false;
        live.hint = "He goes. The ice keeps the tracks.";
      }
    } else if (q >= 2) rig.current.visible = false;
  });
  if (!years) return null;
  return (
    <group ref={rig} visible={false}>
      <group position={[1.6, 0.35, 0]}>
        {[0, 1].map((i) => (
          <group key={i} position={[0.7, 0, i ? 0.55 : -0.55]}>
            <mesh castShadow>
              <boxGeometry args={[0.9, 0.38, 0.42]} />
              {lamb("#8d949c")}
            </mesh>
            <mesh position={[0.42, 0.12, 0]}>
              <boxGeometry args={[0.28, 0.22, 0.22]} />
              {lamb("#7a848c")}
            </mesh>
            {[-0.2, 0.2].map((z) => (
              <mesh key={z} position={[0, -0.24, z]}>
                <boxGeometry args={[0.12, 0.22, 0.12]} />
                {lamb("#6a727a")}
              </mesh>
            ))}
          </group>
        ))}
      </group>
      <mesh position={[-0.4, 0.45, 0]} castShadow>
        <boxGeometry args={[2.4, 0.45, 1.3]} />
        {lamb("#4a3428")}
      </mesh>
      <mesh position={[-0.2, 0.85, 0]}>
        <boxGeometry args={[1.6, 0.35, 1.15]} />
        {lamb("#3a2a22")}
      </mesh>
      <group position={[-0.55, 1.05, 0]}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[1.15, 0.55, 0.55]} />
          {lamb("#2c2428")}
        </mesh>
        <mesh position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[0.72, 0.7, 0.42]} />
          {lamb("#1e1a1c")}
        </mesh>
        <mesh position={[0, 1.72, 0.02]}>
          <boxGeometry args={[0.46, 0.42, 0.4]} />
          {lamb("#b06858")}
        </mesh>
        <mesh position={[0.32, 1.7, 0.08]} rotation={[0.15, 0, -0.55]}>
          <coneGeometry args={[0.09, 0.42, 4]} />
          {lamb("#c47868")}
        </mesh>
        {[-0.12, 0.02, 0.14].map((x) => (
          <mesh key={x} position={[x, 2.05, -0.02]} rotation={[0.2, 0, x * 2]}>
            <boxGeometry args={[0.08, 0.28, 0.08]} />
            {lamb("#1a1614")}
          </mesh>
        ))}
        <mesh position={[0, 1.42, 0.16]}>
          <boxGeometry args={[0.5, 0.12, 0.16]} />
          {lamb("#c8ccd0")}
        </mesh>
        {[-0.16, 0.16].map((x) => (
          <mesh key={`sp${x}`} position={[x, 1.5, 0.22]} rotation={[0.4, 0, 0]}>
            <coneGeometry args={[0.05, 0.16, 4]} />
            {lamb("#d8dce0")}
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`br${s}`} position={[s * 0.42, 0.85, 0]}>
            <boxGeometry args={[0.16, 0.08, 0.22]} />
            {lamb("#1a1a1c")}
          </mesh>
        ))}
        <mesh position={[0, 0.12, 0.08]}>
          <boxGeometry args={[0.36, 0.16, 0.42]} />
          {lamb("#1a1614")}
        </mesh>
      </group>
    </group>
  );
}
