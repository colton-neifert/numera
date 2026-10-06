import type { ErrorComponentProps } from "@tanstack/react-router";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#0c0d10] px-6 text-center text-[#ece8e1]">
      <p className="font-display text-3xl">Numera did not start.</p>
      <p className="max-w-md text-sm text-white/70">{error.message || "The page went blank. Tap to try again."}</p>
      <button
        type="button"
        className="min-h-12 rounded-full border border-white/30 px-8 py-3 text-lg"
        onClick={() => window.location.reload()}
      >
        Tap to play
      </button>
    </main>
  );
}
