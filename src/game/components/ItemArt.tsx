/** Faceted polygon item portraits — readable silhouettes with marks, not baby toys. */

const ITEMS: Record<string, { bg: string; draw: string }> = {
  sword: {
    bg: "#2a2218",
    draw: `
      <polygon points="47,6 51,6 54,18 54,68 42,68 42,18" fill="#8a949c"/>
      <polygon points="48,8 51,8 52,66 49,70 46,66" fill="#e8eef4"/>
      <polygon points="47,16 49,16 49,62 47,62" fill="#6a7278"/>
      <polygon points="24,66 72,66 70,74 26,74" fill="#c9a227"/>
      <polygon points="28,68 68,68 66,72 30,72" fill="#e8d48a"/>
      <polygon points="22,68 26,66 26,74 22,72" fill="#8a6a20"/>
      <polygon points="74,68 70,66 70,74 74,72" fill="#8a6a20"/>
      <polygon points="42,74 54,74 55,90 41,90" fill="#5a3a22"/>
      <polygon points="44,76 47,76 47,88 44,88" fill="#3a2414"/>
      <polygon points="49,76 52,76 52,88 49,88" fill="#3a2414"/>
      <polygon points="46,78 50,78 50,86 46,86" fill="#8a6238"/>
      <polygon points="40,90 56,90 54,95 42,95" fill="#c9a227"/>
      <polygon points="45,91 51,91 50,94 46,94" fill="#e8d48a"/>
    `,
  },
  shield: {
    bg: "#2a2218",
    draw: `
      <polygon points="48,8 78,22 80,52 48,88 16,52 18,22" fill="#4a3018"/>
      <polygon points="48,14 72,26 74,50 48,80 24,50 26,26" fill="#c4a06a"/>
      <polygon points="48,14 58,26 56,50 48,78" fill="#d8b87a"/>
      <polygon points="32,28 40,28 40,72 32,68" fill="#a07840"/>
      <polygon points="56,28 64,28 64,68 56,72" fill="#a07840"/>
      <polygon points="48,20 54,48 48,76 42,48" fill="#c9a227"/>
      <polygon points="28,46 48,52 68,46 48,40" fill="#c9a227"/>
      <polygon points="48,40 56,48 48,56 40,48" fill="#e8d48a"/>
      <polygon points="22,24 26,22 28,26 24,28" fill="#c9a227"/>
      <polygon points="74,24 70,22 68,26 72,28" fill="#c9a227"/>
    `,
  },
  boom: {
    bg: "#2a2218",
    draw: `
      <polygon points="10,28 18,14 40,22 48,40 56,22 78,14 86,28 80,40 58,52 48,62 38,52 16,40" fill="#6a4a28"/>
      <polygon points="14,28 22,18 40,26 48,44 56,26 74,18 82,28 76,36 56,46 48,56 40,46 20,36" fill="#c4a06a"/>
      <polygon points="22,22 38,30 46,44 40,42 24,30" fill="#d8b87a"/>
      <polygon points="74,22 58,30 50,44 56,42 72,30" fill="#b89058"/>
      <polygon points="16,26 22,20 24,24 18,30" fill="#e8d48a"/>
      <polygon points="80,26 74,20 72,24 78,30" fill="#e8d48a"/>
      <polygon points="30,32 42,38 36,40 26,34" fill="#8a6238"/>
      <polygon points="66,32 54,38 60,40 70,34" fill="#8a6238"/>
      <polygon points="44,48 48,54 52,48" fill="#c9a227"/>
    `,
  },
  bomb: {
    bg: "#2a2218",
    draw: `
      <polygon points="48,18 68,26 78,44 74,64 56,80 40,80 22,64 18,44 28,26" fill="#1a1a18"/>
      <polygon points="48,22 64,30 72,46 68,62 52,74 44,74 28,62 24,46 32,30" fill="#2e2e2c"/>
      <polygon points="48,22 58,30 54,48 40,32" fill="#4a4a46"/>
      <polygon points="36,36 44,34 42,50 32,52" fill="#3a3a36"/>
      <polygon points="58,56 70,50 66,64 56,66" fill="#222220"/>
      <polygon points="40,16 56,16 56,24 40,24" fill="#5a3a22"/>
      <polygon points="42,17 54,17 54,21 42,21" fill="#8a6238"/>
      <polygon points="44,10 52,10 52,16 44,16" fill="#3a2414"/>
      <polygon points="52,10 62,4 70,8 72,16 64,14 56,12" fill="#c4a070"/>
      <polygon points="70,8 78,6 80,14 74,18 70,12" fill="#c4a070"/>
      <polygon points="78,8 86,12 82,18 76,14" fill="#e07030"/>
      <polygon points="80,10 84,12 82,16 78,14" fill="#f0c060"/>
      <polygon points="30,48 66,48 64,52 32,52" fill="#5a3a22"/>
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
      <polygon points="22,8 34,10 38,22 32,28 24,20" fill="#6a4a28"/>
      <polygon points="24,10 32,12 34,20 28,24" fill="#c4a06a"/>
      <polygon points="32,24 42,36 44,48 40,60 30,74 22,88 16,84 26,68 36,52 34,40 26,28" fill="#6a4a28"/>
      <polygon points="30,28 38,40 40,52 32,70 24,84 22,80 30,64 38,50 36,40 28,30" fill="#c4a06a"/>
      <polygon points="22,86 34,86 38,76 32,70 24,78" fill="#6a4a28"/>
      <polygon points="24,84 32,84 34,78 28,74" fill="#c4a06a"/>
      <polygon points="26,42 38,42 40,54 24,54" fill="#5a3a22"/>
      <polygon points="28,44 36,44 36,52 28,52" fill="#8a6238"/>
      <polygon points="34,12 34,84 30,84 30,12" fill="#efe6d4"/>
      <polygon points="20,8 26,8 24,14 18,12" fill="#c9a227"/>
      <polygon points="20,88 26,88 24,82 18,84" fill="#c9a227"/>
    `,
  },
  arrows: {
    bg: "#2a2218",
    draw: `
      <polygon points="18,78 28,22 34,20 26,80" fill="#6a4a28"/>
      <polygon points="22,76 30,24 32,24 26,78" fill="#c4a06a"/>
      <polygon points="24,74 29,26 30,26 26,76" fill="#8a6238"/>
      <polygon points="26,16 38,28 14,30" fill="#3d6a32"/>
      <polygon points="26,16 32,26 20,28" fill="#5a8a48"/>
      <polygon points="28,18 22,78 24,80 32,20" fill="#5a3a22"/>
      <polygon points="24,12 32,12 30,20 26,20" fill="#8a9098"/>
      <polygon points="26,8 34,16 18,16" fill="#c8d0d8"/>
      <polygon points="40,80 52,18 58,16 48,82" fill="#5a3a22"/>
      <polygon points="44,78 54,20 56,20 48,80" fill="#c4a06a"/>
      <polygon points="46,76 53,22 54,22 48,78" fill="#8a6238"/>
      <polygon points="50,12 64,24 38,26" fill="#a42828"/>
      <polygon points="50,12 58,22 44,24" fill="#c45c38"/>
      <polygon points="52,14 46,80 48,82 56,16" fill="#6a4a28"/>
      <polygon points="48,8 56,8 54,16 50,16" fill="#8a9098"/>
      <polygon points="50,4 60,12 40,12" fill="#c8d0d8"/>
      <polygon points="62,82 72,24 78,22 70,84" fill="#6a4a28"/>
      <polygon points="66,80 74,26 76,26 70,82" fill="#d8b87a"/>
      <polygon points="68,78 73,28 74,28 70,80" fill="#a07840"/>
      <polygon points="70,16 84,28 58,30" fill="#efe6d4"/>
      <polygon points="70,16 78,26 64,28" fill="#d8c8a8"/>
      <polygon points="72,18 66,82 68,84 76,20" fill="#5a3a22"/>
      <polygon points="68,12 76,12 74,20 70,20" fill="#8a9098"/>
      <polygon points="70,8 80,16 60,16" fill="#c8d0d8"/>
    `,
  },
  sling: {
    bg: "#2a2218",
    draw: `
      <polygon points="40,50 56,50 58,90 38,90" fill="#5a3a22"/>
      <polygon points="42,52 54,52 55,88 41,88" fill="#8a6238"/>
      <polygon points="43,60 45,60 45,82 43,82" fill="#3a2414"/>
      <polygon points="51,60 53,60 53,82 51,82" fill="#3a2414"/>
      <polygon points="20,12 36,16 42,52 32,54 18,28" fill="#6a4a28"/>
      <polygon points="24,16 34,20 38,48 30,50 22,28" fill="#c4a06a"/>
      <polygon points="76,12 60,16 54,52 64,54 78,28" fill="#6a4a28"/>
      <polygon points="72,16 62,20 58,48 66,50 74,28" fill="#c4a06a"/>
      <polygon points="32,18 36,14 38,20 34,24" fill="#c9a227"/>
      <polygon points="64,18 60,14 58,20 62,24" fill="#c9a227"/>
      <polygon points="34,20 28,44 38,46 42,28" fill="#5a3a22"/>
      <polygon points="62,20 68,44 58,46 54,28" fill="#5a3a22"/>
      <polygon points="28,44 68,44 64,56 32,56" fill="#6a4a28"/>
      <polygon points="34,46 62,46 58,54 38,54" fill="#8a6238"/>
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
      <polygon points="18,78 28,70 34,76 24,86" fill="#6a4a28"/>
      <polygon points="20,80 26,74 30,78 24,84" fill="#c4a06a"/>
      <polygon points="22,78 26,76 26,80 22,82" fill="#3a2414"/>
      <polygon points="14,72 22,64 30,70 24,80 16,78" fill="#8a6238"/>
      <polygon points="16,70 22,66 26,70 22,76" fill="#c4a06a"/>
      <polygon points="8,66 22,58 26,66 14,74" fill="#5a3a22"/>
      <polygon points="10,64 20,60 22,66 14,70" fill="#8a6238"/>
      <polygon points="26,72 88,10 92,16 32,80" fill="#6a4a28"/>
      <polygon points="30,70 86,14 88,18 34,76" fill="#c4a06a"/>
      <polygon points="40,62 50,54 52,58 42,66" fill="#8a6238"/>
      <polygon points="58,46 68,38 70,42 60,50" fill="#8a6238"/>
      <polygon points="74,32 82,24 84,28 76,36" fill="#a07840"/>
      <polygon points="86,12 94,8 92,14 88,16" fill="#d8b87a"/>
      <polygon points="22,62 12,52 16,48 26,58" fill="#3a2414"/>
      <polygon points="12,54 4,46 8,42 16,50" fill="#5a3a22"/>
      <polygon points="6,48 2,42 8,40 10,46" fill="#8a9098"/>
      <polygon points="88,10 92,6 90,22 86,24 84,14" fill="#efe6d4"/>
      <polygon points="90,22 94,28 88,34 86,28" fill="#8a9098"/>
      <polygon points="88,30 96,38 90,40 86,34" fill="#8a9098"/>
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
