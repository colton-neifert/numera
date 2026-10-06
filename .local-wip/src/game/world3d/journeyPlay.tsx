import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heightAt, TREE_HOME, LOOK_AT, KEEP_Z } from "./field";
import { live } from "./live";
import { useGame } from "../store";
import { sfx } from "../audio";
import {
  placeAt,
  chapterOf,
  snapJourney,
  silentPlace,
  type ChapterId,
  type PlaceId,
} from "../journey";
import { FW, RV, MW } from "./lands";
import type { WorldId } from "../types";

function markLeftHome() {
  const g = useGame.getState();
  if ((g.quests?.lefthome ?? 0) >= 1) return false;
  g.setQuest("lefthome", 1);
  return true;
}

function cueChapter(id: ChapterId) {
  if (live.chapterCue) return;
  const key = `ch:${id}`;
  if ((useGame.getState().placesSeen ?? []).includes(key)) return;
  useGame.getState().markPlace(key);
  live.chapterCue = id;
}

export function JourneyPlay({ worldId }: { worldId: WorldId }) {
  return (
    <group>
      <Spine worldId={worldId} />
      {worldId === "meadow" ? <LeaveHome /> : null}
      {worldId === "meadow" ? <LookoutWorld /> : null}
      {worldId === "meadow" ? <FirstFang /> : null}
      {worldId === "meadow" ? <BorderWhispers /> : null}
      {worldId === "meadow" ? <HorizonStare /> : null}
    </group>
  );
}

function Spine({ worldId }: { worldId: WorldId }) {
  const last = useRef<PlaceId | "">("");
  const hold = useRef(0);
  const boot = useRef(0);
  useFrame((_, dt) => {
    boot.current += dt;
    if (live.talking || live.story || live.bossTitle) return;
    const place = placeAt(live.x, live.z, worldId, live.house);
    live.placeName = place;
    if (boot.current < 1.6) {
      last.current = place;
      return;
    }
    if (place !== last.current) {
      hold.current += dt;
      if (hold.current < 0.55) return;
      last.current = place;
      hold.current = 0;
      if (!silentPlace(place) && !live.banner && !live.chapterCue) {
        const first = useGame.getState().markPlace(place);
        live.placeCue = place;
        live.placeCueFirst = first;
      }
    } else {
      hold.current = 0;
    }
    const ch = chapterOf(snapJourney());
    if (ch !== "home" && ch !== "vale") cueChapter(ch);
  });
  return null;
}

function LeaveHome() {
  const stepped = useRef(false);
  const far = useRef(false);
  useFrame(() => {
    if (live.house === "yours") {
      stepped.current = true;
      return;
    }
    const d = Math.hypot(live.x - TREE_HOME.x, live.z - TREE_HOME.z);
    if (stepped.current && d > 8 && d < 24 && markLeftHome()) {
      live.listen = live.listen || "The vale starts at the ladder. It does not end there.";
      cueChapter("vale");
    }
    if (d > 20) markLeftHome();
    if (!far.current && d > 88 && !live.house) {
      far.current = true;
      live.listen = live.listen || "The tree is smaller. The lamp is still on.";
    }
  });
  return null;
}

function LookoutWorld() {
  const y = heightAt(LOOK_AT.x, LOOK_AT.z);
  const seen = useRef(false);
  useFrame(() => {
    if (live.house || live.dungeon) return;
    const d = Math.hypot(live.x - LOOK_AT.x, live.z - LOOK_AT.z);
    if (d < 3.4 && live.stillT > 0.8 && !seen.current) {
      seen.current = true;
      const first = useGame.getState().markPlace("lookout");
      live.peekT = 4.8;
      live.peekKind = "look";
      live.shotCam = {
        x: LOOK_AT.x + 1.4,
        y: y + 6.6,
        z: LOOK_AT.z + 2.2,
        lx: 12,
        ly: y + 16,
        lz: 380,
      };
      if (first) {
        live.listen =
          "West, trees that lie. East, water that does not stop. North, a mountain that was not on any song.";
        sfx.ok();
      } else if (live.night) {
        live.listen = live.listen || "From here the vale is dark. One light. Yours.";
      }
    }
  });
  return (
    <group position={[LOOK_AT.x, y, LOOK_AT.z]}>
      <mesh position={[0, 0.9, -1.55]} rotation={[0.12, 0.2, 0]}>
        <boxGeometry args={[1.7, 0.08, 0.62]} />
        <meshLambertMaterial color="#6a5a40" />
      </mesh>
    </group>
  );
}

function FirstFang() {
  const said = useRef(false);
  useFrame(() => {
    if (said.current || live.house || live.dungeon) return;
    if (live.aggroIds.size > 0 && (useGame.getState().quests?.lefthome ?? 0) >= 1) {
      said.current = true;
      live.listen = live.listen || "The hissing Gran mentioned. It has a body now.";
    }
  });
  return null;
}

function BorderWhispers() {
  useFrame(() => {
    if (live.house || live.listen) return;
    const woodsD = Math.hypot(live.x - FW.gate.x, live.z - FW.gate.z);
    const riverD = Math.hypot(live.x - RV.sign.x, live.z - RV.sign.z);
    const peakD = Math.hypot(live.x - MW.sign.x, live.z - MW.sign.z);
    if (woodsD < 6 && !live.smashed.woodsborder) {
      live.smashed.woodsborder = true;
      live.listen = "The trees ahead do not keep still. Twin pines first.";
    }
    if (riverD < 6 && !live.smashed.riverborder) {
      live.smashed.riverborder = true;
      live.listen = "The water does not stop for Oakstead.";
    }
    if (peakD < 6 && !live.smashed.peakborder) {
      live.smashed.peakborder = true;
      live.listen = "Trails, not a staircase. The peak is watching.";
    }
  });
  return null;
}

function HorizonStare() {
  const ring = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ring.current) return;
    const d = Math.hypot(live.x - LOOK_AT.x, live.z - LOOK_AT.z);
    ring.current.visible = d < 22 && !live.house;
  });
  const keepY = heightAt(0, KEEP_Z) + 18;
  const woodsY = heightAt(FW.twins.x, FW.twins.z) + 22;
  const peakY = heightAt(MW.summit.x, MW.summit.z) + 8;
  return (
    <group ref={ring} visible={false}>
      <mesh position={[0, keepY, KEEP_Z]}>
        <sphereGeometry args={[0.35, 6, 5]} />
        <meshBasicMaterial color="#e8dcc0" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh position={[FW.twins.x, woodsY, FW.twins.z]}>
        <sphereGeometry args={[0.5, 6, 5]} />
        <meshBasicMaterial color="#b8d890" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <mesh position={[MW.summit.x, peakY, MW.summit.z]}>
        <sphereGeometry args={[0.45, 6, 5]} />
        <meshBasicMaterial color="#f4eee0" transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}
