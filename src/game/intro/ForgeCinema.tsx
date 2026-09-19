import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Humanoid, HERO_LOOK } from "../world3d/actors";
import { N64Foe, N64Nag } from "../world3d/n64";
import { ForgeHall } from "../world3d/forgeHall";
import { live } from "../world3d/live";
import { playTheme, sfx } from "../audio";

const END = 54;

const CAPTIONS: { t: number; kicker: string; line: string }[] = [
  { t: 0.4, kicker: "A legend of the vale", line: "There was a green country, and a door that slept under the castle." },
  { t: 7.2, kicker: "The lock", line: "Three jewels held it shut. Then the jewels were gone." },
  { t: 13.0, kicker: "Moonlight", line: "The hall woke. He still wants a kingdom." },
  { t: 16.4, kicker: "The first", line: "He takes them by the hands." },
  { t: 20.6, kicker: "The cage", line: "The door slams." },
  { t: 21.4, kicker: "Light", line: "The bars burn." },
  { t: 24.2, kicker: "Green", line: "What comes out is not a person." },
  { t: 28.8, kicker: "Another", line: "He takes the next one." },
  { t: 33.8, kicker: "Gray", line: "Another kind. Same hiss." },
  { t: 39.2, kicker: "The last leaf", line: "The old oak has one green leaf left." },
  { t: 45.0, kicker: "You", line: "It points at you." },
];

export function ForgeCinema({ onDone }: { onDone: () => void }) {
  const [cap, setCap] = useState(CAPTIONS[0]!);
  const [fade, setFade] = useState(true);
  const done = useRef(false);

  useEffect(() => {
    playTheme("chamber");
    live.speed = 0;
    live.mounted = false;
    live.grounded = true;
    return () => {
      live.speed = 0;
    };
  }, []);

  return (
    <div className="absolute inset-0 z-20 bg-black">
      <Canvas
        className="absolute inset-0 h-full w-full"
        camera={{ position: [0, 28, 42], fov: 52, near: 0.2, far: 220 }}
        shadows
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      >
        <ForgeScene
          onCaption={setCap}
          onFade={setFade}
          onEnd={() => {
            if (done.current) return;
            done.current = true;
            onDone();
          }}
        />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/70 via-transparent to-black/35" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[11%] z-30 flex flex-col items-center px-6 text-center">
        {cap.kicker ? (
          <p
            className={`text-[11px] tracking-[0.38em] text-[#e8d48a] uppercase transition-opacity duration-700 ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          >
            {cap.kicker}
          </p>
        ) : null}
        <p
          className={`font-display mt-3 max-w-2xl text-[1.65rem] leading-snug text-white sm:text-4xl transition-opacity duration-700 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          {cap.line}
        </p>
      </div>
    </div>
  );
}

function ForgeScene({
  onCaption,
  onFade,
  onEnd,
}: {
  onCaption: (c: (typeof CAPTIONS)[number]) => void;
  onFade: (v: boolean) => void;
  onEnd: () => void;
}) {
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const tRef = useRef(0);
  const look = useRef(new THREE.Vector3(0, 8, 0));
  const victim = useRef<THREE.Group>(null);
  const victim2 = useRef<THREE.Group>(null);
  const fang = useRef<THREE.Group>(null);
  const fangGray = useRef<THREE.Group>(null);
  const king = useRef<THREE.Group>(null);
  const heroWatch = useRef<THREE.Group>(null);
  const heroRun = useRef<THREE.Group>(null);
  const hall = useRef<THREE.Group>(null);
  const vale = useRef<THREE.Group>(null);
  const shake = useRef(0);
  const coffinOpen = useRef(0.72);
  const gait = useRef(false);
  const scare = useRef(true);
  const lineWalk = useRef(false);
  const waiters = useRef<(THREE.Group | null)[]>([]);
  const kingPose = useRef<"idle" | "walk" | "yell" | "gallop" | "carry">("idle");
  const kingY = useRef(0);
  const hang1 = useRef(false);
  const hang2 = useRef(false);
  const glow = useRef(0);
  const sfxAt = useRef(0);
  const capI = useRef(0);
  const ended = useRef(false);
  const dust = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        x: (i % 8) * 1.7 - 6.8,
        y: 1.2 + (i % 5) * 1.4,
        z: Math.floor(i / 8) * 2.1 - 8,
        s: 0.035 + (i % 4) * 0.012,
      })),
    [],
  );

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const w = typeof window !== "undefined" ? (window as Window & { __forgeFast?: boolean; __forgeT?: number }) : null;
    if (w && w.__forgeT != null) tRef.current = w.__forgeT;
    else tRef.current += dt * (w && w.__forgeFast ? 3.2 : 1);
    const t = tRef.current;

    if (t > END && !ended.current) {
      ended.current = true;
      onEnd();
      return;
    }

    const next = CAPTIONS.reduce((acc, c, i) => (t >= c.t ? i : acc), 0);
    if (next !== capI.current) {
      capI.current = next;
      onFade(false);
      window.setTimeout(() => {
        onCaption(CAPTIONS[next]!);
        onFade(true);
      }, 340);
    }

    const u01 = (a: number, b: number) => Math.min(1, Math.max(0, (t - a) / Math.max(0.01, b - a)));
    const smooth = (a: number, b: number) => {
      const u = u01(a, b);
      return u * u * (3 - 2 * u);
    };

    let wantOpen = 0.72;
    if ((t >= 20.55 && t < 22.85) || (t >= 33.25 && t < 35.55)) wantOpen = 0;
    else if ((t >= 22.85 && t < 28.9) || t >= 35.55) wantOpen = 0.95;
    const slam = wantOpen < 0.05;
    coffinOpen.current += (wantOpen - coffinOpen.current) * (1 - Math.exp(-dt * (slam ? 22 : 4.2)));
    let wantGlow = 0;
    if (t >= 21.05 && t < 22.45) wantGlow = 1;
    else if (t >= 33.75 && t < 35.15) wantGlow = 1;
    glow.current += (wantGlow - glow.current) * (1 - Math.exp(-dt * 6.2));
    shake.current *= Math.exp(-dt * 4.5);
    if ((t > 20.6 && t < 21.05) || (t > 33.3 && t < 33.75)) shake.current = 0.28;

    const hallT = t >= 8.2 && t < 42.2;
    const SLOT_X = 0.82;
    const SLOT_Z = 1.18;
    const FRONT = { x: 0.32, z: 3.12 };
    const slotPos = (i: number) => ({
      x: FRONT.x + i * SLOT_X + (i % 2) * 0.12,
      z: FRONT.z + i * SLOT_Z,
    });
    const v1 = slotPos(0);
    const shift = (t >= 16.15 ? smooth(16.15, 17.65) : 0) + (t >= 28.85 ? smooth(28.85, 30.4) : 0);
    lineWalk.current = hallT && ((shift > 0.05 && shift < 0.97) || (shift > 1.05 && shift < 1.97));
    const v2 = slotPos(Math.max(0, 1 - Math.min(1, shift)));
    const cage = { x: 0.12, z: -10.55 };
    const asideR = { x: 6.85, z: -8.15 };
    const asideL = { x: -6.85, z: -8.15 };

    const carry = (
      g: THREE.Group,
      from: { x: number; z: number },
      t0: number,
      aside: { x: number; z: number },
      hanging: { current: boolean },
    ) => {
      const reach = smooth(t0, t0 + 1.22);
      const lift = smooth(t0 + 1.05, t0 + 2.0);
      const haul = smooth(t0 + 1.9, t0 + 3.7);
      const toss = smooth(t0 + 3.62, t0 + 4.38);
      const gone = t > t0 + 4.45;
      g.visible = hallT && !gone;
      hanging.current = hallT && lift > 0.16 && toss < 0.9 && !gone;
      const grabX = from.x;
      const grabZ = from.z - 0.12;
      const kx = 2.4 + (grabX - 2.4) * reach + (aside.x - grabX) * haul;
      const kz = -6.05 + (grabZ - -6.05) * reach + (aside.z - grabZ) * haul;
      const ky = 1.05 * Math.max(lift, haul > 0.04 ? 1 : 0);
      if (gone) {
        return { kx: aside.x, kz: aside.z, ky: 0, moving: false, yell: false, holding: false };
      }
      const side = aside.x > 0 ? 1 : -1;
      const holdX = kx - side * 0.06;
      const holdZ = kz - 0.92;
      const hangY = 3.15 + Math.sin(t * 5.4) * 0.1;
      const nx = holdX + (cage.x - holdX) * toss;
      const nz = holdZ + (cage.z + 0.12 - holdZ) * toss;
      const ny = hangY * (1 - toss) + toss * 1.12 + Math.sin(toss * Math.PI) * 2.35;
      g.position.set(nx, ny, nz);
      g.rotation.set(0.05 + toss * 1.05, side * 0.08 + haul * 0.12, Math.sin(t * 5.1) * 0.09 * (1 - toss) + toss * 0.62);
      return {
        kx,
        kz,
        ky,
        moving: reach > 0.04 && haul < 0.98,
        yell: toss > 0.05 && toss < 0.98,
        holding: hanging.current,
      };
    };

    const fangPath = (
      g: THREE.Group,
      t0: number,
      dur: number,
      mid: { x: number; z: number },
      end: { x: number; z: number },
    ) => {
      const out = t >= t0 && hallT;
      g.visible = out;
      if (!out) return;
      const wait = 1.05;
      const u = Math.min(1, Math.max(0, (t - t0 - wait) / dur));
      const s = u * u * (3 - 2 * u);
      const ax = cage.x;
      const az = cage.z + 1.55;
      if (u <= 0) {
        g.position.set(ax, 0, az);
        g.rotation.y = 0;
        return;
      }
      const o = 1 - s;
      const x = o * o * ax + 2 * o * s * mid.x + s * s * end.x;
      const z = o * o * az + 2 * o * s * mid.z + s * s * end.z;
      const stomp = u < 0.94 ? Math.abs(Math.sin(u * Math.PI * 6.4)) * 0.22 : 0;
      g.position.set(x, stomp, z);
      const dx = 2 * o * (mid.x - ax) + 2 * s * (end.x - mid.x);
      const dz = 2 * o * (mid.z - az) + 2 * s * (end.z - mid.z);
      g.rotation.y = Math.atan2(-dx, -dz);
    };

    let kx = 2.45;
    let kz = -7.4;
    let ky = 0;
    let moving = false;
    let yell = false;
    let holding = false;
    if (victim.current) {
      if (t < 16.15) {
        victim.current.visible = hallT;
        victim.current.position.set(v1.x, 0, v1.z);
        victim.current.rotation.set(0, 0, 0);
        hang1.current = false;
      } else {
        const r = carry(victim.current, v1, 16.15, asideR, hang1);
        kx = r.kx;
        kz = r.kz;
        ky = r.ky;
        moving = r.moving;
        yell = r.yell;
        holding = r.holding;
      }
    }
    if (victim2.current) {
      if (t < 28.85) {
        victim2.current.visible = hallT && t > 8.2;
        victim2.current.position.set(v2.x, 0, v2.z);
        victim2.current.rotation.set(0, -0.15, 0);
        hang2.current = false;
      } else {
        const r = carry(victim2.current, v2, 28.85, asideL, hang2);
        kx = r.kx;
        kz = r.kz;
        ky = r.ky;
        moving = moving || r.moving;
        yell = yell || r.yell;
        holding = holding || r.holding;
      }
    }
    if (king.current) {
      const wantY = holding || yell ? Math.max(1.05, ky) : moving ? Math.max(0.55, ky) : 0;
      kingY.current += (wantY - kingY.current) * (1 - Math.exp(-dt * 3.8));
      king.current.position.set(kx, kingY.current, kz);
      king.current.rotation.x = kingY.current * 0.04;
      king.current.rotation.y = holding
        ? Math.atan2(-(cage.x - kx), -(cage.z - kz))
        : t > 28.85 && t < 33.8
          ? 0.72
          : t > 16.2 && t < 21.2
            ? -0.72
            : t > 24.2 && t < 28.8
              ? -1.15
              : t > 36.2
                ? 1.15
                : -0.35;
      kingPose.current = holding ? "carry" : yell ? "yell" : moving ? "gallop" : "idle";
    }

    if (fang.current) {
      fangPath(fang.current, 22.9, 3.6, { x: -3.4, z: -5.6 }, { x: -4.15, z: 1.15 });
    }
    if (fangGray.current) {
      fangPath(fangGray.current, 35.6, 3.5, { x: 3.4, z: -5.5 }, { x: 4.15, z: 1.2 });
    }

    waiters.current.forEach((g, wi) => {
      if (!g) return;
      g.visible = hallT;
      const i = wi + 2 - shift;
      const p = slotPos(Math.max(0.05, i));
      g.position.set(p.x, lineWalk.current ? Math.abs(Math.sin(t * 10.5 + wi)) * 0.06 : 0, p.z);
      g.rotation.y = -0.18;
    });

    if (sfxAt.current < 1 && t > 8.4) {
      sfxAt.current = 1;
      sfx.chime();
    } else if (sfxAt.current < 2 && t > 16.4) {
      sfxAt.current = 2;
      sfx.claw();
    } else if (sfxAt.current < 3 && t > 20.6) {
      sfxAt.current = 3;
      sfx.thud();
    } else if (sfxAt.current < 4 && t > 21.2) {
      sfxAt.current = 4;
      sfx.hiss();
    } else if (sfxAt.current < 5 && t > 23.95) {
      sfxAt.current = 5;
      sfx.hiss();
    } else if (sfxAt.current < 6 && t > 28.9) {
      sfxAt.current = 6;
      sfx.claw();
    } else if (sfxAt.current < 7 && t > 33.3) {
      sfxAt.current = 7;
      sfx.thud();
    } else if (sfxAt.current < 8 && t > 33.9) {
      sfxAt.current = 8;
      sfx.hiss();
    } else if (sfxAt.current < 9 && t > 36.65) {
      sfxAt.current = 9;
      sfx.hiss();
    } else if (sfxAt.current < 10 && t > 39.4) {
      sfxAt.current = 10;
      sfx.chime();
    } else if (sfxAt.current < 11 && t > 45.2) {
      sfxAt.current = 11;
      sfx.ok();
    }

    const run = t >= 42.4;
    gait.current = run;
    live.speed = run ? 7.2 : 0;
    live.grounded = true;
    if (run) live.yaw = 0;

    if (hall.current) hall.current.visible = hallT;
    if (vale.current) vale.current.visible = t < 8.35 || t >= 42.0;
    if (heroWatch.current) {
      heroWatch.current.visible = t >= 38.4 && t < 42.2;
      heroWatch.current.position.set(11.4, 8.6, 2.2);
    }
    if (heroRun.current) {
      heroRun.current.visible = run;
      const u = t - 42.4;
      heroRun.current.position.set(0.2, 0, 6.2 - u * 2.4);
      heroRun.current.rotation.y = 0;
    }

    const jx = (Math.random() - 0.5) * shake.current;
    const jy = (Math.random() - 0.5) * shake.current * 0.6;
    if (t < 8.2) {
      const s = t / 8.2;
      const e = 1 - Math.pow(1 - s, 1.35);
      cam.position.set(10 - e * 12, 22 - e * 12, 36 - e * 30);
      look.current.set(4.2, 8.4 - e * 2.2, -18 - e * 4);
      cam.fov = 54 - e * 4;
    } else if (t < 16.2) {
      const s = (t - 8.2) / 8;
      cam.position.set(9.6 - s * 1.4, 8.8 - s * 2.4, 11.4 - s * 3.2);
      look.current.set(1.6, 2.2, -2.8);
      cam.fov = 42;
    } else if (t < 21.0) {
      cam.position.set(9.4, 5.8, 8.6);
      look.current.set(1.1, 2.8, -6.4);
      cam.fov = 40;
    } else if (t < 23.0) {
      cam.position.set(3.2 + jx, 3.15 + jy, -4.6);
      look.current.set(0.1, 2.4, -10.4);
      cam.fov = 36;
    } else if (t < 28.1) {
      cam.position.set(5.6 + jx, 2.7 + jy, -1.4);
      look.current.set(-2.4, 1.3, -5.2);
      cam.fov = 38;
    } else if (t < 33.4) {
      cam.position.set(9.2, 5.6, 8.2);
      look.current.set(1.0, 2.7, -6.2);
      cam.fov = 40;
    } else if (t < 35.6) {
      cam.position.set(2.8 + jx, 3.05 + jy, -4.8);
      look.current.set(-0.1, 2.35, -10.2);
      cam.fov = 36;
    } else if (t < 38.4) {
      cam.position.set(4.2 + jx, 2.4 + jy, -2.6);
      look.current.set(2.6, 1.2, -5.0);
      cam.fov = 38;
    } else if (t < 42.2) {
      cam.position.set(10.6, 9.8, 5.2);
      look.current.set(11.2, 9.2, 2.1);
      cam.fov = 42;
    } else {
      const u = t - 42.4;
      cam.position.set(2.4 + u * 0.55, 2.4 + u * 0.42, 10.4 - u * 0.15);
      look.current.set(0.2, 1.15, 2.4 - u * 2.1);
      cam.fov = 48 + Math.min(6, u * 0.7);
    }
    cam.updateProjectionMatrix();
    cam.lookAt(look.current);
  });

  const lineLooks = [
    { tunic: "#a83838", hair: "#2a2018" },
    { tunic: "#6a4a28", hair: "#4a3220" },
    { tunic: "#6a6a68", hair: "#3a2818" },
    { tunic: "#2a2824", hair: "#5a3a22" },
    { tunic: "#e8e4dc", hair: "#4a3220" },
    { tunic: "#3a4a68", hair: "#2a2018" },
  ];

  return (
    <>
      <color attach="background" args={["#070b16"]} />
      <fog attach="fog" args={["#0b1220", 22, 78]} />
      <ambientLight intensity={0.32} color="#8aa0c8" />
      <hemisphereLight args={["#c8d8f4", "#1a1810", 0.55]} />
      <directionalLight position={[8, 28, 6]} intensity={1.35} color="#eef4ff" />
      <pointLight position={[0, 16, 0]} intensity={36} color="#d8e8ff" distance={42} />

      <group ref={vale}>
        <NightVale />
        <group ref={heroRun} visible={false}>
          <Humanoid look={HERO_LOOK} hero gait={gait} />
          <mesh position={[0.22, 1.12, 0.18]}>
            <octahedronGeometry args={[0.14, 0]} />
            <meshLambertMaterial color="#3ecf6a" emissive="#3ecf6a" emissiveIntensity={1.2} />
          </mesh>
        </group>
      </group>

      <group ref={hall}>
        <ForgeHall radius={16.2} wallH={17.6} openRef={coffinOpen} glowRef={glow} />
        {dust.map((d, i) => (
          <mesh key={i} position={[d.x, d.y, d.z]}>
            <sphereGeometry args={[d.s, 4, 3]} />
            <meshBasicMaterial color="#d8e4f8" transparent opacity={0.35} />
          </mesh>
        ))}
        <group ref={king} position={[2.6, 0, -7.2]}>
          <N64Nag poseRef={kingPose} seed={1} />
        </group>
        <group ref={victim} position={[0.32, 0, 3.12]}>
          <Humanoid look={{ ...HERO_LOOK, tunic: "#d0c4a8", hair: "#5a3a22", mouth: "frown", brows: "mad" }} scare={scare} hang={hang1} />
        </group>
        <group ref={victim2} position={[1.14, 0, 4.3]}>
          <Humanoid look={{ ...HERO_LOOK, tunic: "#8a6a48", hair: "#6a4224", pants: "#3a5a88", mouth: "frown", brows: "mad" }} scare={scare} hang={hang2} gait={lineWalk} />
        </group>
        {lineLooks.map((v, i) => (
          <group
            key={i}
            ref={(el) => {
              waiters.current[i] = el;
            }}
            position={[0.32 + (i + 2) * 0.82, 0, 3.12 + (i + 2) * 1.18]}
          >
            <Humanoid
              look={{ ...HERO_LOOK, tunic: v.tunic, hair: v.hair, pants: "#3a5a88", mouth: "frown", brows: "worried" }}
              scare={scare}
              gait={lineWalk}
            />
          </group>
        ))}
        <group ref={fang} visible={false}>
          <N64Foe kind="plusling" seed={4} pose="chase" world="keep" />
        </group>
        <group ref={fangGray} visible={false}>
          <N64Foe kind="plusling" seed={7} pose="chase" world="grave" />
        </group>
        <group ref={heroWatch} visible={false} rotation={[0, -1.1, 0]}>
          <mesh position={[0, -0.4, 0.6]} receiveShadow>
            <boxGeometry args={[2.4, 0.22, 1.4]} />
            <meshLambertMaterial color="#4a4640" />
          </mesh>
          <Humanoid look={HERO_LOOK} kid scare={scare} />
          <mesh position={[0.28, 1.15, 0.22]}>
            <octahedronGeometry args={[0.12, 0]} />
            <meshLambertMaterial color="#3ecf6a" emissive="#3ecf6a" emissiveIntensity={0.95} />
          </mesh>
        </group>
      </group>
    </>
  );
}

function NightVale() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshLambertMaterial color="#1a2e18" />
      </mesh>
      <mesh position={[0, 0.05, -8]} rotation={[-Math.PI / 2, 0, 0.06]}>
        <planeGeometry args={[4.2, 90]} />
        <meshLambertMaterial color="#3a3228" />
      </mesh>
      <mesh position={[-2, 36, -48]}>
        <sphereGeometry args={[6.4, 24, 16]} />
        <meshBasicMaterial color="#eef4ff" />
      </mesh>
      <mesh position={[-0.6, 35.2, -46.4]}>
        <sphereGeometry args={[1.8, 12, 10]} />
        <meshBasicMaterial color="#c4d0e8" />
      </mesh>
      <pointLight position={[-2, 22, -20]} intensity={40} color="#d0e0ff" distance={80} />
      {([-18, -12, -8, 8, 14, 20, -15, 11] as const).map((x, i) => (
        <group key={x} position={[x, 0, -6 - (i % 5) * 5.2]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.3, 2.4, 6]} />
            <meshLambertMaterial color="#3a2818" />
          </mesh>
          <mesh position={[0, 2.7, 0]} castShadow>
            <sphereGeometry args={[1.05 + (i % 3) * 0.18, 8, 6]} />
            <meshLambertMaterial color={i % 2 ? "#1e3a22" : "#183818"} />
          </mesh>
        </group>
      ))}
      {([-10, -4, 3, 11, 18] as const).map((x, i) => (
        <mesh key={`h${x}`} position={[x * 1.8, -1.6, -28 - i * 5]} scale={[5.5, 2.8, 4]}>
          <sphereGeometry args={[1.5, 8, 6]} />
          <meshLambertMaterial color="#243a28" />
        </mesh>
      ))}
      <group position={[8.4, 0, -22]}>
        <mesh position={[0, 4.6, 0]}>
          <boxGeometry args={[5.2, 9.2, 5.2]} />
          <meshLambertMaterial color="#2a3238" />
        </mesh>
        <mesh position={[0, 10.2, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[2.2, 2.8, 4]} />
          <meshLambertMaterial color="#1a2228" />
        </mesh>
      </group>
    </group>
  );
}
