import { useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { N64Hero } from "../world3d/actors";
import { N64Foe } from "../world3d/n64";
import { VolBush, VolTree } from "../world3d/trees";
import { live } from "../world3d/live";
import { getStoryEnv } from "../world3d/mats";
import { useGame } from "../store";
import { lookForGender } from "../looks";
import { sfx } from "../audio";

const ANIMS = [
  "idle",
  "walk",
  "run",
  "sprint",
  "jump",
  "roll",
  "swing",
  "block",
  "bow",
  "boom",
  "bomb",
  "hurt",
  "talk",
  "item",
  "ride",
] as const;

const VIEWS: { id: string; yaw: number; pitch: number; dist: number }[] = [
  { id: "Front", yaw: 0, pitch: 0.12, dist: 4.6 },
  { id: "Right", yaw: Math.PI / 2, pitch: 0.08, dist: 4.6 },
  { id: "Back", yaw: Math.PI, pitch: 0.12, dist: 4.6 },
  { id: "Left", yaw: -Math.PI / 2, pitch: 0.08, dist: 4.6 },
  { id: "Above", yaw: 0.2, pitch: 1.15, dist: 5.2 },
  { id: "Below", yaw: 0.2, pitch: -0.85, dist: 5.0 },
];

export function CharViewer() {
  const [open, setOpen] = useState(false);
  const gender = useGame((s) => s.heroGender);
  const setHeroGender = useGame((s) => s.setHeroGender);
  const setHeroLook = useGame((s) => s.setHeroLook);
  const [spin, setSpin] = useState(true);
  const [scenery, setScenery] = useState(true);
  const [subject, setSubject] = useState<"hero" | "fang">("hero");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setOpen(live.charView), 80);
    return () => window.clearInterval(id);
  }, []);

  if (!open) return null;

  return (
    <div className="pointer-events-auto absolute inset-0 z-[90] flex flex-col bg-[#10140e]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#e8d48a] uppercase">Character Viewer</p>
        <button
          type="button"
          className="ml-auto min-h-9 rounded-md border border-white/20 px-3 text-sm text-white"
          onClick={() => {
            live.charView = false;
            live.viewerWire = false;
            live.viewerAnim = "idle";
            live.mounted = false;
            live.rolling = false;
            live.swinging = false;
            live.getItem = null;
            live.holding = useGame.getState().holding;
            live.hasSword = useGame.getState().hasSword;
            live.hasShield = useGame.getState().hasShield;
            setOpen(false);
            sfx.select();
          }}
        >
          Close
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <Canvas
          shadows
          camera={{ position: [0.2, 1.4, -5.2], fov: 32, near: 0.1, far: 80 }}
          dpr={[1, 1.6]}
          gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
          onCreated={({ scene, gl }) => {
            const env = getStoryEnv();
            if (env) scene.environment = env;
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
        >
          <color attach="background" args={["#24180e"]} />
          <fog attach="fog" args={["#c8a070", 14, 48]} />
          <StudioLights />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <circleGeometry args={[8, 32]} />
            <meshStandardMaterial color="#4a6a38" roughness={0.9} metalness={0} />
          </mesh>
          {scenery ? (
            <>
              <VolTree x={-2.4} z={1.4} s={0.72} seed={4} kind="oak" y={0} />
              <VolBush x={1.6} z={1.1} s={0.85} seed={8} berry y={0} />
            </>
          ) : null}
          <Studio />
          <Turn spin={spin}>
            {subject === "fang" ? <N64Foe kind="plusling" seed={3} pose="idle" /> : <N64Hero />}
          </Turn>
        </Canvas>
      </div>
      <div className="max-h-[38vh] overflow-y-auto border-t border-white/10 bg-[#0c100c]/95 px-3 py-3">
        <div className="flex flex-wrap gap-1.5">
          {(["boy", "girl"] as const).map((g) => (
            <button
              key={g}
              type="button"
              className={`min-h-9 rounded-md border px-3 text-sm ${gender === g ? "border-[#e8d48a] bg-[#3a3020] text-[#e8d48a]" : "border-white/20 text-white/80"}`}
              onClick={() => {
                setHeroGender(g);
                setHeroLook(lookForGender(g));
                sfx.select();
              }}
            >
              {g === "boy" ? "Boy 1" : "Girl 2"}
            </button>
          ))}
          <button
            type="button"
            className={`min-h-9 rounded-md border px-3 text-sm ${spin ? "border-[#e8d48a] text-[#e8d48a]" : "border-white/20 text-white/80"}`}
            onClick={() => setSpin((v) => !v)}
          >
            Spin 360
          </button>
          <button
            type="button"
            className={`min-h-9 rounded-md border px-3 text-sm ${live.viewerWire ? "border-[#e8d48a] text-[#e8d48a]" : "border-white/20 text-white/80"}`}
            onClick={() => {
              live.viewerWire = !live.viewerWire;
              sfx.select();
            }}
          >
            Wireframe
          </button>
          <button
            type="button"
            className={`min-h-9 rounded-md border px-3 text-sm ${scenery ? "border-[#e8d48a] text-[#e8d48a]" : "border-white/20 text-white/80"}`}
            onClick={() => setScenery((v) => !v)}
          >
            Tree + bush
          </button>
          <button
            type="button"
            className={`min-h-9 rounded-md border px-3 text-sm ${subject === "fang" ? "border-[#e8d48a] text-[#e8d48a]" : "border-white/20 text-white/80"}`}
            onClick={() => setSubject((s) => (s === "fang" ? "hero" : "fang"))}
          >
            {subject === "fang" ? "Show hero" : "Show Fang"}
          </button>
        </div>
        <p className="mt-2 text-[10px] tracking-[0.16em] text-white/40 uppercase">Light</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {(["afternoon", "shade", "sunset", "night", "interior"] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={`min-h-9 rounded-md border px-3 text-sm ${live.studioLight === id ? "border-[#e8d48a] bg-[#3a3020] text-[#e8d48a]" : "border-white/20 text-white/80"}`}
              onClick={() => {
                live.studioLight = id;
                setTick((n) => n + 1);
                sfx.select();
              }}
            >
              {id}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] tracking-[0.16em] text-white/40 uppercase">Camera</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className="min-h-9 rounded-md border border-white/20 px-3 text-sm text-white/80"
              onClick={() => {
                live.viewerYaw = v.yaw;
                live.viewerPitch = v.pitch;
                live.viewerDist = v.dist;
                setSpin(false);
                sfx.select();
              }}
            >
              {v.id}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] tracking-[0.16em] text-white/40 uppercase">Animation</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {ANIMS.map((a) => (
            <button
              key={a}
              type="button"
              className={`min-h-9 rounded-md border px-3 text-sm ${live.viewerAnim === a ? "border-[#e8d48a] bg-[#3a3020] text-[#e8d48a]" : "border-white/20 text-white/80"}`}
              onClick={() => {
                live.viewerAnim = a;
                sfx.select();
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudioLights() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  useFrame(() => {
    const mode = live.studioLight;
    const afternoon = mode === "afternoon";
    const shade = mode === "shade";
    const sunset = mode === "sunset";
    const night = mode === "night";
    const interior = mode === "interior";
    if (sun.current) {
      sun.current.position.set(shade ? -5 : 6.5, sunset ? 3.2 : night ? 8 : 7.5, shade ? 4 : -5);
      sun.current.intensity = night ? 0.38 : shade ? 0.45 : sunset ? 1.05 : interior ? 0.35 : 1.35;
      sun.current.color.set(night ? "#b8c8ea" : sunset ? "#f0a45a" : "#ffd089");
    }
    if (fill.current) {
      fill.current.position.set(-5, 4, 4);
      fill.current.intensity = night ? 0.28 : shade ? 0.55 : 0.4;
      fill.current.color.set(night ? "#8aa0d0" : "#dce8ff");
    }
    if (rim.current) {
      rim.current.intensity = night ? 0.16 : 0.45;
      rim.current.color.set(night ? "#a8b8e0" : "#ffd8a0");
    }
    if (hemi.current) {
      hemi.current.intensity = night ? 0.32 : 0.7;
      hemi.current.color.set(night ? "#7a96c8" : sunset ? "#f0c090" : "#f3d7ae");
      hemi.current.groundColor.set(night ? "#243044" : "#6a7a48");
    }
    if (amb.current) amb.current.intensity = interior ? 0.55 : night ? 0.22 : 0.3;
  });
  return (
    <>
      <ambientLight ref={amb} intensity={0.3} />
      <hemisphereLight ref={hemi} args={["#f3d7ae", "#6a7a48", 0.7]} />
      <directionalLight ref={sun} position={[6.5, 7.5, -5]} intensity={1.35} color="#ffd089" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight ref={fill} position={[-5, 4, 4]} intensity={0.4} color="#dce8ff" />
      <directionalLight ref={rim} position={[3, 4, -6]} intensity={0.4} color="#ffd8a0" />
    </>
  );
}

function Studio() {
  const { camera, scene } = useThree();
  useFrame(() => {
    live.mounted = live.viewerAnim === "ride";
    live.rolling = live.viewerAnim === "roll";
    live.swinging = live.viewerAnim === "swing";
    live.charging = false;
    live.spinning = false;
    live.ocarina = false;
    live.heldRock = false;
    live.getItem = live.viewerAnim === "item" ? "sword" : null;
    live.hasSword = true;
    live.hasShield = true;
    live.shieldUp = live.viewerAnim === "block";
    if (live.viewerAnim === "boom") live.holding = "boom";
    else if (live.viewerAnim === "bomb") live.holding = "bomb";
    else if (live.viewerAnim === "bow") live.holding = "bow";
    else if (live.viewerAnim === "block") live.holding = "shield";
    else if (live.viewerAnim === "swing") live.holding = "sword";
    live.grounded = live.viewerAnim !== "jump" && live.viewerAnim !== "fall";
    const d = live.viewerDist;
    const yaw = live.viewerYaw;
    const pitch = live.viewerPitch;
    camera.position.set(Math.sin(yaw) * d * Math.cos(pitch), 1.15 + Math.sin(pitch) * d, -Math.cos(yaw) * d * Math.cos(pitch));
    camera.lookAt(0, 1.05, 0);
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (m && "wireframe" in m) m.wireframe = live.viewerWire;
        }
      }
    });
  });
  return null;
}

function Turn({ children, spin }: { children: ReactNode; spin: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current && spin) ref.current.rotation.y += dt * 0.55;
  });
  return <group ref={ref}>{children}</group>;
}
