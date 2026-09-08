import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OUTFITS, WEAPONS, cleanName, outfitById, talk, weaponById } from "../content";
import { Rupees } from "../components/Hud";
import { sfx } from "../audio";
import { useGame } from "../store";
import type { OutfitId, WeaponId } from "../types";

const PIP = (name: string, cleared: string[]) => [
  talk("{name}! Pip’s stall. I used to sell chalk to the Academy. Now I sell what still works.", name),
  "Nora sent you? Fine. I sold Veyr the last stick of chalk the night the windows went dark. He did not pay. I do not like to say that.",
  cleared.includes("meadow")
    ? "Sum woke. Mira’s bird told me. Ember Oak will burn a shade if you have the rupees."
    : "Mira in the meadow still waits by the Oak’s last green. Buy Leaf if you have nothing else.",
  cleared.includes("grove")
    ? "Bram sent word: Product sits. The keep will want a truer staff. Storm for stone. Leaf for the king."
    : "If you walk the grove, take two proofs. Bram is fussy that way.",
  cleared.includes("keep")
    ? "The lamps are on. I might sell chalk again. Not to boys who whisper at leftovers. If you are bored, the Uncounted opened. I will not go."
    : "Rupees from a true fight. I don’t take almost.",
  cleared.includes("echo")
    ? "You named the leftover. Buy something pretty. The stall is not a temple."
    : "Nora still sends people. I still take rupees.",
];

export function MarketScreen() {
  const coins = useGame((s) => s.coins);
  const weapon = useGame((s) => s.weapon);
  const outfit = useGame((s) => s.outfit);
  const ownedWeapons = useGame((s) => s.ownedWeapons);
  const ownedOutfits = useGame((s) => s.ownedOutfits);
  const buyWeapon = useGame((s) => s.buyWeapon);
  const buyOutfit = useGame((s) => s.buyOutfit);
  const equipWeapon = useGame((s) => s.equipWeapon);
  const equipOutfit = useGame((s) => s.equipOutfit);
  const goHub = useGame((s) => s.goHub);
  const heroName = useGame((s) => s.heroName);
  const cleared = useGame((s) => s.worldsCleared);
  const currentW = weaponById(weapon);
  const currentO = outfitById(outfit);
  const lines = PIP(cleanName(heroName), cleared);
  const [pip, setPip] = useState(0);

  return (
    <div className="relative isolate flex h-full flex-col overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(126_184_176/0.18),transparent_50%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted uppercase">Castle town stall</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">
              The Market
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted">
              {lines[pip] ?? talk("{name}! The stall is open.", heroName)}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                sfx.select();
                setPip((p) => (p + 1) % lines.length);
              }}
            >
              Talk to Pip
            </Button>
          </div>
          <div className="text-right">
            <Rupees n={coins} />
            <Button variant="ghost" size="sm" className="mt-2" onClick={goHub}>
              Field map
            </Button>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold">Staves</h2>
          <p className="mt-1 text-sm text-muted">
            Equipped: {currentW.name} · {currentW.element} (+{currentW.atk} attack). Buy a staff to learn its spell.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {WEAPONS.map((item) => {
              const owned = ownedWeapons.includes(item.id);
              const on = weapon === item.id;
              return (
                <article key={item.id} className="panel rounded-xl p-4">
                  <p className="text-[11px] tracking-wide text-subtle uppercase">
                    {item.kind} · {item.element}
                  </p>
                  <h3 className="font-display mt-1 text-lg font-semibold">{item.name}</h3>
                  <p className="mt-1 text-sm text-muted">{item.blurb}</p>
                  <p className="tabular mt-2 text-sm text-fg/80">+{item.atk} attack</p>
                  <div className="mt-3">
                    {on ? (
                      <p className="text-xs text-accent">Equipped</p>
                    ) : owned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          equipWeapon(item.id as WeaponId);
                          sfx.equip();
                        }}
                      >
                        Equip
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="accent"
                        disabled={coins < item.price}
                        onClick={() => {
                          if (buyWeapon(item.id as WeaponId)) sfx.buy();
                        }}
                      >
                        Buy · {item.price}
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-10 pb-8">
          <h2 className="font-display text-xl font-semibold">Clothing</h2>
          <p className="mt-1 text-sm text-muted">
            Equipped: {currentO.name} (+{currentO.hp} health)
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {OUTFITS.map((item) => {
              const owned = ownedOutfits.includes(item.id);
              const on = outfit === item.id;
              return (
                <article key={item.id} className="panel rounded-xl p-4">
                  <div className="mb-3 flex gap-2">
                    <span className="size-8 rounded-md border border-border" style={{ background: item.tunic }} />
                    <span className="size-8 rounded-md border border-border" style={{ background: item.sash }} />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{item.name}</h3>
                  <p className="mt-1 text-sm text-muted">{item.blurb}</p>
                  <p className="tabular mt-2 text-sm text-fg/80">+{item.hp} max health</p>
                  <div className="mt-3">
                    {on ? (
                      <p className="text-xs text-accent">Wearing</p>
                    ) : owned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          equipOutfit(item.id as OutfitId);
                          sfx.equip();
                        }}
                      >
                        Wear
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="accent"
                        disabled={coins < item.price}
                        onClick={() => {
                          if (buyOutfit(item.id as OutfitId)) sfx.buy();
                        }}
                      >
                        Buy · {item.price}
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
