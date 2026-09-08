import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { sfx, playTheme } from "../audio";
import { continueSlot } from "../saves";

export function GameOverScreen() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    playTheme("none");
    sfx.over();
    const t = window.setTimeout(() => setReady(true), 900);
    const auto = window.setTimeout(() => continueSlot(), 7000);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(auto);
    };
  }, []);
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-black text-white">
      <p className="font-display text-6xl tracking-tight sm:text-7xl">GAME OVER</p>
      <p className="mt-4 text-sm text-white/50">The leftover still waits. You wake at your last save.</p>
      {ready ? (
        <Button
          size="xl"
          variant="primary"
          className="mt-10 min-w-44"
          onClick={() => {
            sfx.open();
            continueSlot();
          }}
        >
          Continue
        </Button>
      ) : null}
    </div>
  );
}
