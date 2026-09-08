import { live } from "./world3d/live";
import { sfx, startOcarina, stopOcarina, setMusicDuck } from "./audio";
import { useGame } from "./store";
import { NOTE_FREQ, NOTE_LETTER, peekSong, completeSong, pushNote } from "./songs";

export function isPad(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
}

export function padHint(s: string) {
  if (!isPad()) return s;
  return s
    .replace(/Hit F to /g, "")
    .replace(/Hit F — /g, "")
    .replace(/Hit F\.?/g, "Talk")
    .replace(/ · F/g, "")
    .replace(/press F/gi, "talk")
    .replace(/Press F/g, "Talk")
    .replace(/Hold F/g, "Hold Talk")
    .replace(/Let go of F/g, "Let go of Talk")
    .replace(/O · /g, "")
    .replace(/H to /g, "")
    .replace(/ · Space jump/g, " · Jump")
    .replace(/Slide gallop/g, "Hold Run");
}

export const touchState = {
  left: false,
  right: false,
  forward: false,
  back: false,
  stickX: 0,
  stickY: 0,
  jumpHeld: false,
  jumpQueued: false,
  sprintHeld: false,
  slideQueued: false,
  slideHeld: false,
  talkQueued: false,
  talkHeld: false,
  swingQueued: false,
  swingHeld: false,
  bombQueued: false,
  bombHeld: false,
  throwQueued: false,
  targetQueued: false,
  camAlignQueued: false,
  lookLeft: false,
  lookRight: false,
  shieldHeld: false,
  brakeHeld: false,
};

export function queueJump() {
  touchState.jumpQueued = true;
}

export function queueRoll() {
  touchState.slideQueued = true;
}

export function consumeSlide(): boolean {
  if (!touchState.slideQueued) return false;
  touchState.slideQueued = false;
  return true;
}

export function isSprintHeld(): boolean {
  return touchState.sprintHeld || isHeld("ShiftLeft") || isHeld("ShiftRight");
}

export function isSlideHeld(): boolean {
  if (live.mounted) return touchState.slideHeld || isHeld("ShiftLeft") || isHeld("ShiftRight") || isHeld("KeyC");
  return touchState.slideHeld || isHeld("KeyC");
}

export function isJumpHeld(): boolean {
  return touchState.jumpHeld || isHeld("Space");
}

export function queueTalk() {
  touchState.talkQueued = true;
}

export function clearQueuedInput() {
  touchState.jumpQueued = false;
  touchState.slideQueued = false;
  touchState.talkQueued = false;
  touchState.swingQueued = false;
  touchState.bombQueued = false;
  touchState.throwQueued = false;
  touchState.targetQueued = false;
  touchState.camAlignQueued = false;
}

export const heldKeys = new Set<string>();
export const injectedKeys = new Set<string>();

export function isHeld(code: string): boolean {
  return heldKeys.has(code) || injectedKeys.has(code);
}

function movingNow() {
  return (
    isHeld("KeyW") ||
    isHeld("KeyS") ||
    isHeld("ArrowUp") ||
    isHeld("ArrowDown") ||
    touchState.forward ||
    touchState.back
  );
}

export function moveAxes(): { steer: number; throttle: number } {
  let steer = 0;
  let throttle = 0;
  if (isHeld("KeyA") || isHeld("ArrowLeft") || touchState.left) steer += 1;
  if (isHeld("KeyD") || isHeld("ArrowRight") || touchState.right) steer -= 1;
  if (isHeld("KeyW") || isHeld("ArrowUp") || touchState.forward) throttle += 1;
  if (isHeld("KeyS") || isHeld("ArrowDown") || touchState.back) throttle -= 1;
  const mag = Math.hypot(touchState.stickX, touchState.stickY);
  if (mag > 0.16) {
    const n = Math.min(1, mag);
    steer -= (touchState.stickX / mag) * n;
    throttle += (-touchState.stickY / mag) * n;
  }
  if (steer > 1) steer = 1;
  if (steer < -1) steer = -1;
  if (throttle > 1) throttle = 1;
  if (throttle < -1) throttle = -1;
  return { steer, throttle };
}

export function lookAxes(): number {
  let look = 0;
  if (isHeld("KeyQ") || touchState.lookLeft) look += 1;
  if (isHeld("KeyT") || touchState.lookRight) look -= 1;
  return look;
}

export function isShieldHeld(): boolean {
  return touchState.shieldHeld || isHeld("KeyR");
}

export function isBrakeHeld(): boolean {
  return touchState.brakeHeld || isHeld("ControlLeft") || isHeld("ControlRight") || isHeld("KeyX");
}

export function isSwingHeld(): boolean {
  return isHeld("KeyV") || touchState.swingHeld;
}

export function queueSwing() {
  touchState.swingQueued = true;
}

export function consumeJump(): boolean {
  if (!touchState.jumpQueued) return false;
  touchState.jumpQueued = false;
  return true;
}

export function isTalkHeld(): boolean {
  return isHeld("KeyF") || isHeld("KeyE") || touchState.talkHeld;
}

export function consumeTalk(): boolean {
  if (!touchState.talkQueued) return false;
  touchState.talkQueued = false;
  return true;
}

export function consumeSwing(): boolean {
  if (!touchState.swingQueued) return false;
  touchState.swingQueued = false;
  return true;
}

export function consumeBomb(): boolean {
  if (!touchState.bombQueued) return false;
  touchState.bombQueued = false;
  return true;
}

export function isBombHeld(): boolean {
  return isHeld("KeyB") || touchState.bombHeld;
}

export function queueBomb() {
  touchState.bombQueued = true;
}

export function queueThrow() {
  touchState.throwQueued = true;
}

export function consumeThrow(): boolean {
  if (!touchState.throwQueued) return false;
  touchState.throwQueued = false;
  return true;
}

export function queueTarget() {
  touchState.targetQueued = true;
}

export function consumeTarget(): boolean {
  if (!touchState.targetQueued) return false;
  touchState.targetQueued = false;
  return true;
}

export function consumeCamAlign(): boolean {
  if (!touchState.camAlignQueued) return false;
  touchState.camAlignQueued = false;
  return true;
}

let heldNote: string | null = null;

export function bindGameKeys(): () => void {
  const down = (e: KeyboardEvent) => {
    const el = document.activeElement;
    const typing =
      live.paused ||
      live.doorMath ||
      (el instanceof HTMLElement &&
        (el.isContentEditable || /input|textarea|select/i.test(el.tagName)));
    if (typing) return;
    if (e.code === "KeyG" && live.house && !e.repeat) {
      if (live.ocarina) {
        live.ocarina = false;
        live.songBuf = "";
        live.songOk = null;
        live.songLock = false;
        heldNote = null;
        stopOcarina();
        setMusicDuck(false);
      }
      touchState.camAlignQueued = true;
      sfx.select();
      e.preventDefault();
      heldKeys.add(e.code);
      return;
    }
    if (e.code === "KeyH" && live.house === "eatery" && live.sit && !live.ocarina && !e.repeat) {
      live.wantMenu = true;
      e.preventDefault();
      heldKeys.add(e.code);
      return;
    }
    if (live.ocarina && NOTE_LETTER[e.code]) {
      if (!live.songLock) {
        const letter = NOTE_LETTER[e.code]!;
        const hit = peekSong(letter);
        if (hit) {
          heldNote = letter;
          startOcarina(NOTE_FREQ[letter] ?? 440);
          completeSong(hit);
        } else {
          heldNote = letter;
          startOcarina(NOTE_FREQ[letter] ?? 440);
          pushNote(letter);
        }
      }
      e.preventDefault();
      return;
    }
    if (
      e.code === "Space" ||
      e.code.startsWith("Arrow") ||
      e.code === "KeyW" ||
      e.code === "KeyA" ||
      e.code === "KeyS" ||
      e.code === "KeyD" ||
      e.code === "KeyQ" ||
      e.code === "KeyE" ||
      e.code === "KeyC" ||
      e.code === "KeyF" ||
      e.code === "KeyT" ||
      e.code === "KeyB" ||
      e.code === "KeyV" ||
      e.code === "KeyR" ||
      e.code === "KeyZ" ||
      e.code === "Digit1" ||
      e.code === "Digit2" ||
      e.code === "KeyO" ||
      e.code === "KeyJ" ||
      e.code === "KeyL" ||
      e.code === "KeyG" ||
      e.code === "Escape" ||
      e.code === "ShiftLeft" ||
      e.code === "ShiftRight"
    ) {
      e.preventDefault();
    }
    if (!e.repeat) {
      if (e.code === "F2" || e.code === "Backquote") {
        live.devOpen = !live.devOpen;
        e.preventDefault();
      }
      if (e.code === "F4") {
        live.charView = !live.charView;
        e.preventDefault();
      }
      if (e.code === "Escape") {
        live.wantPause = true;
      }
      if (e.code === "Space") queueJump();
      if (e.code === "KeyC") queueRoll();
      if (e.code === "KeyF" || e.code === "KeyE") queueTalk();
      if (e.code === "KeyV") {
        queueSwing();
        touchState.swingHeld = true;
      }
      if (e.code === "KeyB") {
        touchState.bombQueued = true;
        touchState.bombHeld = true;
      }
      if (e.code === "KeyZ") {
        if (live.heldRock || live.heldWood || live.carry) queueThrow();
        else queueTarget();
      }
      if (e.code === "Digit1" || e.code === "Digit2") {
        const typing = document.activeElement && /input|textarea/i.test(document.activeElement.tagName);
        if (!typing && !live.engaged) {
          const g = useGame.getState();
          if (e.code === "Digit1" && g.hasSword) {
            g.holdTool("sword");
            live.holding = "sword";
            live.shieldUp = false;
            sfx.equip();
          }
          if (e.code === "Digit2" && g.hasShield) {
            g.holdTool("shield");
            live.holding = "shield";
            live.shieldUp = true;
            sfx.equip();
          }
        }
      }
      if (e.code === "KeyO" && useGame.getState().hasOcarina) {
        live.ocarina = !live.ocarina;
        live.songBuf = "";
        live.songOk = null;
        live.songLock = false;
        heldNote = null;
        stopOcarina();
        setMusicDuck(live.ocarina);
        sfx.select();
      }
      if (e.code === "KeyL") queueTarget();
      if (e.code === "KeyG" && !live.ocarina) {
        touchState.camAlignQueued = true;
        sfx.select();
      }
    }
    heldKeys.add(e.code);
  };
  const up = (e: KeyboardEvent) => {
    heldKeys.delete(e.code);
    if (e.code === "KeyV") touchState.swingHeld = false;
    if (e.code === "KeyB") touchState.bombHeld = false;
    if (e.code === "KeyR") touchState.shieldHeld = false;
    if (NOTE_LETTER[e.code] && NOTE_LETTER[e.code] === heldNote && !live.songLock) {
      heldNote = null;
      stopOcarina();
    }
  };
  const clear = () => {
    heldKeys.clear();
    touchState.swingHeld = false;
    touchState.bombHeld = false;
    touchState.sprintHeld = false;
    touchState.slideHeld = false;
    touchState.jumpHeld = false;
  };
  window.addEventListener("keydown", down, { passive: false });
  window.addEventListener("keyup", up);
  window.addEventListener("blur", clear);
  document.addEventListener("visibilitychange", clear);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", clear);
    document.removeEventListener("visibilitychange", clear);
    heldKeys.clear();
  };
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX: () => number;
      getZ?: () => number;
      getY?: () => number;
      getGrounded?: () => boolean;
      getVx: () => number;
      getLock?: () => boolean;
      getHint?: () => string;
      setKeys: (codes: string[]) => void;
      setSteer?: (v: number | null) => void;
      openPack?: () => void;
      jump?: () => void;
      warp?: (x: number, z: number) => void;
      setShot?: (cam: { x: number; y: number; z: number; lx: number; ly: number; lz: number } | null) => void;
      setPull?: (n: number) => void;
    };
    __gameTest?: {
      get: () => Record<string, unknown>;
      set: (p: Record<string, unknown>) => void;
      enter: (w: string) => void;
      live: () => typeof live;
      boot?: () => void;
      quiz?: (ok: boolean) => void;
      startQuiz?: () => void;
      pause?: () => void;
      mute?: () => void;
    };
  }
}
