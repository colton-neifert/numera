import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden px-5 py-10">
      <img
        src="/game/maps/battle-keep.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-bg/70" />
      <div className="panel relative z-10 w-full max-w-sm rounded-xl p-6 shadow-2xl">
        <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
          Numera
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Keep your grade, XP, and cleared fields across devices. You can also
          play as a guest from the title screen.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              >
                Continue with {p.label}
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted">Sign-in is disabled.</p>
          )}
        </div>
        <Link
          to="/"
          className="mt-5 block text-center text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          Back to the academy
        </Link>
      </div>
    </main>
  );
}
