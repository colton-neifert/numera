import { useEffect, useRef, useState } from "react";
import { queueJump, queueRoll, queueSwing, queueTalk, queueThrow, queueTarget, queueBomb, queueSheathe, touchState } from "../input";
import { useGame } from "../store";
import { live } from "../world3d/live";
import { HOUSES } from "../world3d/house";
import { sfx, stopOcarina, setMusicDuck } from "../audio";

export function TouchPad({ hidden }: { hidden?: boolean }) {
  const doorQuiz = useGame((s) => s.doorQuiz);
  const combat = useGame((s) => s.combat);
  const hasBombs = useGame((s) => s.hasBombs);
  const hasSword = useGame((s) => s.hasSword);
  const hasShield = useGame((s) => s.hasShield);
  const hasOcarina = useGame((s) => s.hasOcarina);
  const hasHorse = useGame((s) => s.hasHorse);
  const [show, setShow] = useState(false);
  const [carry, setCarry] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [talkLabel, setTalkLabel] = useState("Talk");
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const go = () => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      setShow(coarse || navigator.maxTouchPoints > 0);
    };
    go();
    window.addEventListener("resize", go);
    const t = window.setInterval(() => {
      setCarry(Boolean(live.heldRock || live.heldWood));
      setMounted(Boolean(live.mounted));
      setDrawn(Boolean(live.swordDrawn));
      setTalkLabel(
        live.nearBed ? "Sleep" :
        live.sit ? "Stand" :
        live.nearChair && live.sitAt && live.playT - live.sitFresh < 0.25 ? "Sit" :
        live.nearMail ? "Mail" :
        live.nearPet ? "Pet" :
        live.nearHouse ? (HOUSES.find((h) => h.id === live.nearHouse)?.locked ? "Knock" : "In") :
        live.nearChest ? "Open" :
        "Talk",
      );
    }, 200);
    return () => {
      window.removeEventListener("resize", go);
      window.clearInterval(t);
    };
  }, []);

  useEffect(
    () => () => {
      touchState.stickX = 0;
      touchState.stickY = 0;
      touchState.talkHeld = false;
      touchState.swingHeld = false;
      touchState.shieldHeld = false;
      touchState.slideHeld = false;
      touchState.jumpHeld = false;
      touchState.brakeHeld = false;
    },
    [],
  );

  if (!show || hidden || doorQuiz || combat?.phase === "solve") return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <MoveStick />
      <div className="pointer-events-none absolute right-3 bottom-[max(1rem,env(safe-area-inset-bottom))] flex flex-col items-end gap-2">
        <div className="flex items-end gap-2">
          {hasOcarina ? (
            <Act
              label="Song"
              onDown={() => {
                live.ocarina = !live.ocarina;
                live.songBuf = "";
                live.songOk = null;
                live.songLock = false;
                stopOcarina();
                setMusicDuck(live.ocarina);
                sfx.select();
              }}
              onUp={() => {}}
            />
          ) : null}
          <Act
            label="Cam"
            onDown={() => {
              touchState.camAlignQueued = true;
              sfx.select();
            }}
            onUp={() => {}}
          />
          {hasShield ? (
            <Act label="Guard" onDown={() => { touchState.shieldHeld = true; }} onUp={() => { touchState.shieldHeld = false; }} />
          ) : null}
          <Act
            label="Jump"
            onDown={() => {
              touchState.jumpHeld = true;
              queueJump();
            }}
            onUp={() => {
              touchState.jumpHeld = false;
            }}
          />
        </div>
        <div className="flex items-end gap-3">
          <Act
            label={talkLabel}
            big
            onDown={() => {
              touchState.talkHeld = true;
              queueTalk();
            }}
            onUp={() => {
              touchState.talkHeld = false;
            }}
          />
          {hasBombs ? (
            <Act
              label="Bomb"
              onDown={() => {
                queueBomb();
                touchState.bombHeld = true;
              }}
              onUp={() => {
                touchState.bombHeld = false;
              }}
            />
          ) : null}
          {hasSword ? (
            <Act
              label="Sword"
              big
              primary
              onDown={() => {
                queueSwing();
                touchState.swingHeld = true;
              }}
              onUp={() => {
                touchState.swingHeld = false;
              }}
            />
          ) : null}
          {hasSword && drawn ? (
            <Act label="Sheath" onDown={() => queueSheathe()} onUp={() => {}} />
          ) : null}
        </div>
        <div className="flex items-end gap-2">
          <Act label="▼ Lock" gold onDown={() => queueTarget()} onUp={() => {}} />
          {carry ? <Act label="Throw" onDown={() => queueThrow()} onUp={() => {}} /> : null}
          {mounted ? (
            <Act
              label="Brake"
              onDown={() => {
                touchState.brakeHeld = true;
              }}
              onUp={() => {
                touchState.brakeHeld = false;
              }}
            />
          ) : hasHorse ? (
            <Act
              label="Call"
              onDown={() => {
                live.horseCall = true;
                sfx.neigh();
              }}
              onUp={() => {}}
            />
          ) : null}
          <Act
            label="Roll"
            onDown={() => queueRoll()}
            onUp={() => {}}
          />
          <Act
            label="Run"
            onDown={() => {
              touchState.sprintHeld = true;
              if (mounted) touchState.slideHeld = true;
            }}
            onUp={() => {
              touchState.sprintHeld = false;
              touchState.slideHeld = false;
            }}
          />
        </div>
      </div>
    </div>
  );
}

function MoveStick() {
  const base = useRef<HTMLDivElement>(null);
  const nub = useRef<HTMLDivElement>(null);
  const origin = useRef({ x: 0, y: 0 });

  function setNub(dx: number, dy: number) {
    if (nub.current) nub.current.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function apply(clientX: number, clientY: number) {
    const r = 58;
    let dx = clientX - origin.current.x;
    let dy = clientY - origin.current.y;
    const m = Math.hypot(dx, dy);
    if (m > r) {
      dx = (dx / m) * r;
      dy = (dy / m) * r;
    }
    touchState.stickX = dx / r;
    touchState.stickY = dy / r;
    setNub(dx, dy);
  }

  function clear() {
    touchState.stickX = 0;
    touchState.stickY = 0;
    setNub(0, 0);
  }

  return (
    <div
      ref={base}
      className="pointer-events-auto absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 flex size-40 items-center justify-center rounded-full border-2 border-[#c9a227]/55 bg-[#1a1410]/55 shadow-[inset_0_0_0_1px_#5a4818] touch-none select-none"
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const box = e.currentTarget.getBoundingClientRect();
        origin.current = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
        apply(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        apply(e.clientX, e.clientY);
      }}
      onPointerUp={clear}
      onPointerCancel={clear}
      onLostPointerCapture={clear}
    >
      <div
        ref={nub}
        className="size-16 rounded-full border-2 border-[#e8d48a] bg-[#c9a227]/80 shadow-md will-change-transform"
      />
    </div>
  );
}

function Act({
  label,
  onDown,
  onUp,
  big,
  primary,
  gold,
}: {
  label: string;
  onDown: () => void;
  onUp: () => void;
  big?: boolean;
  primary?: boolean;
  gold?: boolean;
}) {
  return (
    <button
      type="button"
      className={`pointer-events-auto select-none touch-none rounded-full border-2 font-semibold shadow-md ${
        big
          ? "h-[4.6rem] min-w-[4.6rem] px-3 text-lg"
          : "h-14 min-w-14 px-2 text-xs"
      } ${
        gold
          ? "border-[#ffe44a] bg-[#f4d050] text-[#1a1410]"
          : primary
          ? "border-[#c9a227] bg-[#c9a227] text-[#1a1410]"
          : "border-[#c9a227]/70 bg-[#1a1410]/80 text-[#f6f1e6]"
      }`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}
