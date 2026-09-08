/** Faceted low-poly item portraits matching in-world colors. */

const ITEMS: Record<string, { bg: string; draw: string }> = {
  sword: {
    bg: "#2a2218",
    draw: `<polygon points="48,8 56,70 48,92 40,70" fill="#d8e0ea"/><polygon points="48,8 52,70 48,92" fill="#f4f7fb"/><rect x="36" y="70" width="24" height="6" fill="#c9a227"/><rect x="45" y="76" width="6" height="16" fill="#5a3a22"/><rect x="43" y="90" width="10" height="6" fill="#c9a227"/>`,
  },
  shield: {
    bg: "#2a2218",
    draw: `<ellipse cx="48" cy="50" rx="28" ry="32" fill="#6a4a28"/><ellipse cx="48" cy="50" rx="22" ry="26" fill="#c4a06a"/><ellipse cx="48" cy="50" rx="24" ry="28" fill="none" stroke="#c9a227" stroke-width="3"/><polygon points="48,28 52,50 48,72 44,50" fill="#c9a227"/><polygon points="28,50 48,54 68,50 48,46" fill="#c9a227"/>`,
  },
  boom: {
    bg: "#2a2218",
    draw: `<polygon points="16,28 48,58 22,18" fill="#c4a06a"/><polygon points="80,28 48,58 74,18" fill="#b89058"/><polygon points="16,28 22,18 20,14 12,24" fill="#c9a227"/><polygon points="80,28 74,18 76,14 84,24" fill="#c9a227"/><polygon points="38,50 48,58 58,50" fill="#c9a227"/>`,
  },
  bomb: {
    bg: "#2a2218",
    draw: `<polygon points="48,22 70,38 70,62 48,78 26,62 26,38" fill="#2a2a28"/><polygon points="48,22 70,38 48,48 26,38" fill="#3a3a38"/><rect x="44" y="16" width="8" height="8" fill="#5a3a22"/><path d="M52 16 Q68 8 70 22" stroke="#c4a070" fill="none" stroke-width="3"/><circle cx="70" cy="22" r="4" fill="#e07030"/>`,
  },
  axe: {
    bg: "#2a2218",
    draw: `<rect x="44" y="18" width="8" height="64" rx="2" fill="#c4a06a"/><polygon points="52,22 84,18 86,38 52,42" fill="#d8e0ea"/><polygon points="52,22 70,20 52,34" fill="#f0f4f8"/>`,
  },
  bow: {
    bg: "#2a2218",
    draw: `<path d="M28 16 Q58 48 28 80" fill="none" stroke="#c4a06a" stroke-width="6"/><path d="M30 18 L30 78" stroke="#efe6d4" stroke-width="2"/><rect x="26" y="42" width="10" height="12" fill="#5a3a22"/>`,
  },
  arrows: {
    bg: "#2a2218",
    draw: `<rect x="34" y="48" width="28" height="32" rx="4" fill="#5a3a22"/><rect x="44" y="16" width="4" height="44" fill="#c4a06a"/><polygon points="46,12 52,22 40,22" fill="#d8e0ea"/><rect x="54" y="20" width="4" height="40" fill="#b89058"/><polygon points="56,16 62,26 50,26" fill="#d8e0ea"/>`,
  },
  sling: {
    bg: "#2a2218",
    draw: `<path d="M30 24 Q48 8 66 24 Q48 40 30 24" fill="none" stroke="#c4a06a" stroke-width="5"/><rect x="40" y="44" width="16" height="10" fill="#5a3a22"/>`,
  },
  flute: {
    bg: "#2a2218",
    draw: `<rect x="14" y="42" width="68" height="10" rx="4" fill="#c4b090"/><circle cx="30" cy="47" r="2.4" fill="#2a2018"/><circle cx="42" cy="47" r="2.4" fill="#2a2018"/><circle cx="54" cy="47" r="2.4" fill="#2a2018"/><circle cx="66" cy="47" r="2.4" fill="#2a2018"/>`,
  },
  compass: {
    bg: "#2a2218",
    draw: `<circle cx="48" cy="48" r="26" fill="#c9a227"/><circle cx="48" cy="48" r="20" fill="#d8e8c8"/><polygon points="48,30 52,48 48,66 44,48" fill="#a42828"/>`,
  },
  key: {
    bg: "#2a2218",
    draw: `<circle cx="30" cy="48" r="12" fill="none" stroke="#c9a227" stroke-width="5"/><rect x="40" y="45" width="36" height="6" fill="#c9a227"/><rect x="66" y="45" width="6" height="14" fill="#e8d48a"/>`,
  },
  emerald: { bg: "#1a2418", draw: `<polygon points="48,16 72,48 48,80 24,48" fill="#3d8a48"/><polygon points="48,16 60,48 48,80" fill="#6aaa68"/>` },
  ruby: { bg: "#241818", draw: `<polygon points="48,16 72,48 48,80 24,48" fill="#a42828"/><polygon points="48,16 60,48 48,80" fill="#d05050"/>` },
  sapphire: { bg: "#141824", draw: `<polygon points="48,16 72,48 48,80 24,48" fill="#2a6a9a"/><polygon points="48,16 60,48 48,80" fill="#4a90c4"/>` },
  apple: {
    bg: "#2a2218",
    draw: `<circle cx="48" cy="54" r="22" fill="#c45c38"/><rect x="46" y="24" width="4" height="12" fill="#5a3a22"/><polygon points="50,26 64,22 58,34" fill="#3d6a32"/>`,
  },
  mushroom: {
    bg: "#2a2218",
    draw: `<rect x="40" y="50" width="16" height="22" fill="#efe6d4"/><ellipse cx="48" cy="46" rx="24" ry="16" fill="#c45c58"/><circle cx="38" cy="44" r="4" fill="#efe6d4"/>`,
  },
  fish: {
    bg: "#2a2218",
    draw: `<ellipse cx="42" cy="48" rx="24" ry="12" fill="#7aa8b0"/><polygon points="64,48 84,36 84,60" fill="#5a8890"/><circle cx="28" cy="46" r="3" fill="#1a1410"/>`,
  },
  cooked: {
    bg: "#2a2218",
    draw: `<ellipse cx="42" cy="48" rx="24" ry="12" fill="#c46838"/><polygon points="64,48 84,36 84,60" fill="#a84828"/>`,
  },
  wood: {
    bg: "#2a2218",
    draw: `<rect x="18" y="40" width="60" height="12" rx="4" fill="#c4a06a" transform="rotate(-18 48 46)"/><rect x="20" y="52" width="58" height="12" rx="4" fill="#6a4a28" transform="rotate(12 48 58)"/>`,
  },
  rupee: { bg: "#2a2218", draw: `<polygon points="48,14 70,48 48,82 26,48" fill="#3d8a48"/><polygon points="48,14 58,48 48,82" fill="#6aba70"/>` },
  map: {
    bg: "#2a2218",
    draw: `<rect x="18" y="28" width="60" height="42" fill="#e8d8b0"/><rect x="24" y="34" width="28" height="6" fill="#8a5a32"/><rect x="24" y="46" width="40" height="4" fill="#c4a06a"/>`,
  },
  lantern: {
    bg: "#2a2218",
    draw: `<rect x="34" y="18" width="28" height="8" fill="#6a6a70"/><rect x="32" y="26" width="32" height="36" fill="#e8c070"/><rect x="30" y="62" width="36" height="8" fill="#4a4a50"/><circle cx="48" cy="16" r="6" fill="none" stroke="#c9a227" stroke-width="3"/>`,
  },
  bottle: {
    bg: "#2a2218",
    draw: `<rect x="34" y="36" width="28" height="36" rx="6" fill="#a42828"/><rect x="42" y="20" width="12" height="18" fill="#d8e8ea"/><rect x="40" y="16" width="16" height="8" fill="#5a3a22"/>`,
  },
  pole: {
    bg: "#2a2218",
    draw: `<rect x="22" y="46" width="58" height="6" rx="2" fill="#c4a06a" transform="rotate(-22 51 49)"/><path d="M70 28 Q80 20 74 40" stroke="#efe6d4" fill="none" stroke-width="2"/>`,
  },
  rock: {
    bg: "#2a2218",
    draw: `<polygon points="28,60 36,30 60,24 74,48 62,70 32,72" fill="#8a8478"/><polygon points="36,30 60,24 52,48" fill="#b0aaa0"/>`,
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
