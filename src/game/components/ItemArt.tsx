/** Faceted polygon item portraits — readable silhouettes with marks, not baby toys. */

const ITEMS: Record<string, { bg: string; draw: string }> = {
  sword: {
    bg: "#2a2218",
    draw: `
      <polygon points="48,6 54,18 52,64 44,64 42,18" fill="#8a949c"/>
      <polygon points="48,8 51,16 50,62 46,62" fill="#e8eef4"/>
      <polygon points="47,20 48,20 48,58 47,58" fill="#9aa4b0"/>
      <polygon points="22,62 34,66 44,64 44,70 26,74" fill="#c9a227"/>
      <polygon points="74,62 62,66 52,64 52,70 70,74" fill="#c9a227"/>
      <polygon points="30,64 66,64 64,70 32,70" fill="#e8d48a"/>
      <polygon points="44,70 52,70 53,88 43,88" fill="#6a4a28"/>
      <polygon points="45,72 47,72 47,86 45,86" fill="#3a2414"/>
      <polygon points="49,72 51,72 51,86 49,86" fill="#3a2414"/>
      <polygon points="42,88 54,88 52,94 44,94" fill="#c9a227"/>
    `,
  },
  shield: {
    bg: "#2a2218",
    draw: `
      <polygon points="48,10 66,16 78,32 82,48 78,64 66,80 48,86 30,80 18,64 14,48 18,32 30,16" fill="#4a3020"/>
      <polygon points="48,16 62,21 72,34 76,48 72,62 62,75 48,80 34,75 24,62 20,48 24,34 34,21" fill="#c4a06a"/>
      <polygon points="46,18 50,18 50,78 46,78" fill="#a07840"/>
      <polygon points="28,46 68,46 68,50 28,50" fill="#a07840"/>
      <polygon points="48,48 58,42 62,48 58,54 48,58 38,54 34,48 38,42" fill="#8a9098"/>
      <polygon points="48,44 54,48 48,52 42,48" fill="#d8e0ea"/>
      <polygon points="48,22 51,22 51,28 48,28" fill="#6a7078"/>
      <polygon points="48,68 51,68 51,74 48,74" fill="#6a7078"/>
      <polygon points="26,46 32,46 32,50 26,50" fill="#6a7078"/>
      <polygon points="64,46 70,46 70,50 64,50" fill="#6a7078"/>
    `,
  },
  boom: {
    bg: "#2a2218",
    draw: `
      <path d="M22 70 Q18 36 48 22 Q78 36 74 70" stroke="#6a4a28" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M22 70 Q20 40 48 28 Q76 40 74 70" stroke="#c4a06a" stroke-width="7" fill="none" stroke-linecap="round"/>
      <polygon points="16,66 28,62 24,76" fill="#8a6238"/>
      <polygon points="80,66 68,62 72,76" fill="#8a6238"/>
    `,
  },
  bomb: {
    bg: "#2a2218",
    draw: `
      <circle cx="46" cy="52" r="28" fill="#1a1a18"/>
      <circle cx="46" cy="52" r="24" fill="#2c2c2a"/>
      <ellipse cx="38" cy="44" rx="10" ry="7" fill="#4a4a46"/>
      <rect x="40" y="22" width="12" height="10" rx="2" fill="#6a5428"/>
      <polygon points="50,24 62,12 66,16 54,28" fill="#c4a070"/>
      <circle cx="66" cy="12" r="5" fill="#ffb060"/>
      <circle cx="66" cy="12" r="2.4" fill="#fff4d0"/>
    `,
  },
  axe: {
    bg: "#2a2218",
    draw: `
      <polygon points="42,14 54,14 56,86 40,86" fill="#6a4a28"/>
      <polygon points="44,16 50,16 51,84 43,84" fill="#c4a06a"/>
      <polygon points="45,48 49,48 49,72 45,72" fill="#8a6238"/>
      <polygon points="45,22 49,22 49,28 45,28" fill="#8a6238"/>
      <polygon points="52,18 88,12 90,38 52,48" fill="#8a9098"/>
      <polygon points="52,20 78,16 80,28 52,36" fill="#d8e0ea"/>
      <polygon points="80,16 88,14 88,34 80,36" fill="#c8d0d8"/>
      <polygon points="52,40 70,36 68,44 52,46" fill="#6a7078"/>
      <polygon points="38,82 58,82 56,90 40,90" fill="#c9a227"/>
    `,
  },
  bow: {
    bg: "#2a2218",
    draw: `
      <path d="M36 10 Q12 48 36 86" stroke="#5a3a22" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M36 12 Q18 48 36 84" stroke="#c4a06a" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M36 12 L36 84" stroke="#efe6d4" stroke-width="1.8" fill="none"/>
      <polygon points="30,8 42,8 40,16 32,16" fill="#6a4a28"/>
      <polygon points="30,80 42,80 40,88 32,88" fill="#6a4a28"/>
      <polygon points="40,44 52,40 52,56 40,52" fill="#8a6238"/>
    `,
  },
  arrows: {
    bg: "#2a2218",
    draw: `
      <path d="M24 82 Q42 50 62 16" stroke="#6a4a28" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M24 82 Q42 50 62 16" stroke="#c4a06a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <polygon points="56,12 74,8 64,26" fill="#c8d0d8"/>
      <polygon points="60,14 70,12 64,22" fill="#eef2f6"/>
      <polygon points="18,74 10,88 28,80" fill="#efe6d4"/>
      <polygon points="22,70 12,82 30,76" fill="#d8c8a8"/>
    `,
  },
  sling: {
    bg: "#2a2218",
    draw: `
      <polygon points="42,92 54,92 52,50 44,50" fill="#6a4a28"/>
      <polygon points="44,90 52,90 51,52 45,52" fill="#c4a06a"/>
      <polygon points="44,52 18,16 28,10 50,46" fill="#6a4a28"/>
      <polygon points="48,50 52,46 78,10 68,16" fill="#6a4a28"/>
      <polygon points="22,18 30,14 46,42 40,44" fill="#c4a06a"/>
      <polygon points="74,18 66,14 50,42 56,44" fill="#c4a06a"/>
      <path d="M24 16 L48 38 L72 16" stroke="#3a2414" stroke-width="2.4" fill="none"/>
      <polygon points="40,34 56,34 54,46 42,46" fill="#5a3a22"/>
    `,
  },
  flute: {
    bg: "#2a2218",
    draw: `
      <polygon points="8,40 88,36 90,52 10,56" fill="#8a6a40"/>
      <polygon points="12,42 84,38 85,50 14,54" fill="#d8c48a"/>
      <polygon points="8,40 16,38 16,58 8,56" fill="#efe6d4"/>
      <polygon points="18,40 24,40 24,44 18,44" fill="#c9a227"/>
      <polygon points="76,38 84,38 84,48 76,48" fill="#c9a227"/>
      <polygon points="30,43 36,42 37,48 31,49" fill="#2a2018"/>
      <polygon points="44,42 50,41 51,47 45,48" fill="#2a2018"/>
      <polygon points="58,41 64,40 65,46 59,47" fill="#2a2018"/>
      <polygon points="70,40 76,39 77,45 71,46" fill="#2a2018"/>
    `,
  },
  compass: {
    bg: "#2a2218",
    draw: `
      <polygon points="48,6 58,8 62,18 54,20 42,20 34,18 38,8" fill="#c9a227"/>
      <polygon points="44,8 52,8 52,18 44,18" fill="#8a6a20"/>
      <polygon points="75.7,36.5 75.7,59.5 59.5,75.7 36.5,75.7 20.3,59.5 20.3,36.5 36.5,20.3 59.5,20.3" fill="#c9a227"/>
      <polygon points="70,38 70,58 58,70 38,70 26,58 26,38 38,26 58,26" fill="#6a5018"/>
      <polygon points="66,40 66,56 56,66 40,66 30,56 30,40 40,30 56,30" fill="#d8c890"/>
      <polygon points="64,42 64,54 54,64 42,64 32,54 32,42 42,32 54,32" fill="#efe6d4"/>
      <polygon points="48,28 50,30 50,34 46,34 46,30" fill="#5a3a22"/>
      <polygon points="48,62 50,66 46,66" fill="#5a3a22"/>
      <polygon points="66,46 70,48 66,50" fill="#5a3a22"/>
      <polygon points="30,46 26,48 30,50" fill="#5a3a22"/>
      <polygon points="58,34 60,36 56,36" fill="#8a6238"/>
      <polygon points="38,34 40,36 36,36" fill="#8a6238"/>
      <polygon points="58,60 60,58 56,58" fill="#8a6238"/>
      <polygon points="38,60 40,58 36,58" fill="#8a6238"/>
      <polygon points="48,30 54,48 48,48 42,48" fill="#a42828"/>
      <polygon points="48,66 54,48 48,48 42,48" fill="#efe6d4"/>
      <polygon points="48,46 50,48 48,50 46,48" fill="#c9a227"/>
    `,
  },
  key: {
    bg: "#2a2218",
    draw: `
      <polygon points="18,32 38,32 42,38 42,58 38,64 18,64 14,58 14,38" fill="#c9a227"/>
      <polygon points="22,36 34,36 36,40 36,56 34,60 22,60 20,56 20,40" fill="#2a2218"/>
      <polygon points="40,45 86,45 86,53 40,53" fill="#c9a227"/>
      <polygon points="72,53 80,53 80,70 72,70" fill="#e8d48a"/>
      <polygon points="60,53 68,53 68,64 60,64" fill="#e8d48a"/>
      <polygon points="80,45 86,40 86,53" fill="#e8d48a"/>
    `,
  },
  emerald: { bg: "#1a2418", draw: `<polygon points="48,10 74,48 48,86 22,48" fill="#2a6a32"/><polygon points="48,10 62,48 48,86" fill="#3d8a48"/><polygon points="48,10 56,48 48,78" fill="#6aaa68"/><polygon points="36,40 48,34 60,40 48,52" fill="#b8e0a8"/>` },
  ruby: { bg: "#241818", draw: `<polygon points="48,10 74,48 48,86 22,48" fill="#7a1818"/><polygon points="48,10 62,48 48,86" fill="#a42828"/><polygon points="48,10 56,48 48,78" fill="#d05050"/><polygon points="36,40 48,34 60,40 48,52" fill="#f0a0a0"/>` },
  sapphire: { bg: "#141824", draw: `<polygon points="48,10 74,48 48,86 22,48" fill="#1a4a7a"/><polygon points="48,10 62,48 48,86" fill="#2a6a9a"/><polygon points="48,10 56,48 48,78" fill="#4a90c4"/><polygon points="36,40 48,34 60,40 48,52" fill="#a8d0f0"/>` },
  apple: {
    bg: "#2a2218",
    draw: `
      <polygon points="48,28 68,36 76,54 68,74 48,84 28,74 20,54 28,36" fill="#a42828"/>
      <polygon points="48,28 60,36 66,52 58,70 48,78" fill="#c45c38"/>
      <polygon points="36,40 44,36 46,50 38,54" fill="#d87850"/>
      <polygon points="46,16 50,16 50,30 46,30" fill="#5a3a22"/>
      <polygon points="50,18 70,12 64,28 50,24" fill="#3d6a32"/>
      <polygon points="52,18 64,16 60,24 52,22" fill="#5a8a48"/>
    `,
  },
  mushroom: {
    bg: "#2a2218",
    draw: `
      <polygon points="38,52 58,52 60,84 36,84" fill="#efe6d4"/>
      <polygon points="42,56 54,56 54,80 42,80" fill="#d8c8a8"/>
      <polygon points="16,48 32,28 48,20 64,28 80,48 70,56 26,56" fill="#a42828"/>
      <polygon points="24,46 36,30 48,24 60,30 72,46 64,52 32,52" fill="#c45c58"/>
      <polygon points="28,42 36,36 40,44 32,48" fill="#efe6d4"/>
      <polygon points="54,34 62,38 58,46 50,42" fill="#efe6d4"/>
    `,
  },
  fish: {
    bg: "#2a2218",
    draw: `
      <polygon points="12,48 28,28 56,24 72,40 72,56 56,72 28,68" fill="#5a8890"/>
      <polygon points="18,48 32,34 54,30 68,44 68,52 54,66 32,62" fill="#7aa8b0"/>
      <polygon points="72,40 92,28 86,48 92,68 72,56" fill="#5a8890"/>
      <polygon points="76,42 86,34 84,48 86,62 76,54" fill="#7aa8b0"/>
      <polygon points="40,28 52,12 56,28" fill="#4a7078"/>
      <polygon points="22,44 28,44 28,50 22,50" fill="#1a1410"/>
    `,
  },
  cooked: {
    bg: "#2a2218",
    draw: `
      <polygon points="12,48 28,28 56,24 72,40 72,56 56,72 28,68" fill="#a84828"/>
      <polygon points="18,48 32,34 54,30 68,44 68,52 54,66 32,62" fill="#c46838"/>
      <polygon points="72,40 92,28 86,48 92,68 72,56" fill="#a84828"/>
      <polygon points="40,28 52,12 56,28" fill="#8a3818"/>
    `,
  },
  wood: {
    bg: "#2a2218",
    draw: `
      <polygon points="8,28 78,12 88,28 18,44" fill="#c4a06a"/>
      <polygon points="12,30 74,16 80,24 18,38" fill="#d8b87a"/>
      <polygon points="8,36 18,44 18,52 8,44" fill="#efe6d4"/>
      <polygon points="14,50 84,34 94,50 24,66" fill="#6a4a28"/>
      <polygon points="18,52 80,38 86,46 24,60" fill="#8a6238"/>
    `,
  },
  rupee: { bg: "#2a2218", draw: `<polygon points="48,8 74,48 48,88 22,48" fill="#2a6a32"/><polygon points="48,8 62,48 48,88" fill="#3d8a48"/><polygon points="48,8 54,48 48,80" fill="#6aba70"/><polygon points="38,40 48,32 58,40 48,52" fill="#b8f0c0"/>` },
  map: {
    bg: "#2a2218",
    draw: `
      <polygon points="12,24 36,18 60,26 84,18 88,70 60,78 36,70 16,76" fill="#c4a06a"/>
      <polygon points="16,28 36,22 58,30 80,22 84,66 60,74 36,66 20,72" fill="#e8d8b0"/>
      <polygon points="28,36 52,32 48,40 24,44" fill="#8a5a32"/>
      <polygon points="30,48 70,42 68,48 28,54" fill="#c4a06a"/>
      <polygon points="40,56 58,52 56,64 38,68" fill="#6a8a48"/>
    `,
  },
  lantern: {
    bg: "#2a2218",
    draw: `
      <polygon points="36,8 60,8 62,16 34,16" fill="#6a6a70"/>
      <polygon points="42,4 54,4 54,10 42,10" fill="#c9a227"/>
      <polygon points="28,16 68,16 72,24 24,24" fill="#4a4a50"/>
      <polygon points="26,24 70,24 74,68 22,68" fill="#4a4a50"/>
      <polygon points="32,28 44,28 44,64 32,64" fill="#e8c070"/>
      <polygon points="52,28 64,28 64,64 52,64" fill="#e8c070"/>
      <polygon points="38,36 42,32 46,48 40,50" fill="#fff4d0"/>
      <polygon points="22,68 74,68 70,78 26,78" fill="#4a4a50"/>
    `,
  },
  bottle: {
    bg: "#2a2218",
    draw: `
      <polygon points="38,14 58,14 58,22 38,22" fill="#5a3a22"/>
      <polygon points="42,22 54,22 54,36 42,36" fill="#d8e8ea"/>
      <polygon points="28,40 68,40 64,86 32,86" fill="#6a1818"/>
      <polygon points="32,44 64,44 60,82 36,82" fill="#a42828"/>
      <polygon points="36,48 46,48 44,70 36,68" fill="#d05050"/>
      <polygon points="42,36 54,36 62,44 34,44" fill="#d8e8ea"/>
    `,
  },
  pole: {
    bg: "#2a2218",
    draw: `
      <polygon points="18,84 30,78 34,84 22,90" fill="#3a2414"/>
      <polygon points="22,82 32,74 78,14 68,20" fill="#6a4a28"/>
      <polygon points="26,78 34,72 74,18 66,24" fill="#c4a06a"/>
      <polygon points="28,80 36,74 40,78 32,84" fill="#5a3a22"/>
      <polygon points="36,74 44,68 46,72 38,78" fill="#3a2414"/>
      <polygon points="72,16 80,10 82,16 74,22" fill="#9aa2aa"/>
      <path d="M76 18 L76 70" stroke="#f4efe4" stroke-width="2.2" fill="none"/>
      <path d="M76 70 Q76 82 64 82" stroke="#c8ced6" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M64 82 L68 74" stroke="#c8ced6" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    `,
  },
  rock: {
    bg: "#2a2218",
    draw: `
      <polygon points="22,62 28,28 52,16 78,32 84,58 64,80 30,78" fill="#6a6458"/>
      <polygon points="30,58 34,32 52,22 70,36 74,56 58,72 36,70" fill="#8a8478"/>
      <polygon points="36,36 52,24 62,34 50,46" fill="#b0aaa0"/>
      <polygon points="48,52 66,44 70,58 54,66" fill="#7a7468"/>
    `,
  },
};

export function ItemArt({ id, className = "" }: { id: string; className?: string }) {
  const art = ITEMS[id] ?? ITEMS.rock!;
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden>
      <rect width="96" height="96" rx="12" fill={art.bg} />
      <g dangerouslySetInnerHTML={{ __html: art.draw }} />
    </svg>
  );
}
