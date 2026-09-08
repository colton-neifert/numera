export type Letter = {
  id: string;
  from: string;
  lines: (name: string) => string[];
};

export const WRITE_TO = [
  { id: "mira", name: "Mira" },
  { id: "tallow", name: "Tallow" },
  { id: "willow", name: "Willow" },
  { id: "nora", name: "Nora" },
  { id: "nana", name: "Nana" },
  { id: "pip", name: "Pip" },
  { id: "ash", name: "Ash" },
  { id: "pell", name: "Pell" },
  { id: "bram", name: "Bram" },
  { id: "sera", name: "Sera" },
] as const;

const STORY: { id: string; from: string; need?: (met: string[], cleared: string[]) => boolean; lines: (name: string) => string[] }[] = [
  {
    id: "mira-hello",
    from: "Mira",
    lines: (name) => [
      `${name}. I put this in your box so it would find you.`,
      "The Oak still counts. Come by the tree when you can. I will be on the ladder.",
      "If a letter waits, prove the box open. Then put your hand in. That is how mail works in the Vale.",
    ],
  },
  {
    id: "tallow-note",
    from: "Tallow",
    need: (met) => met.includes("tallow"),
    lines: (name) => [
      `${name}!! I wrote this with my leftover chalk.`,
      "Hide and seek still counts. I hide three times. You find me.",
      "I drew a sheep on the back. Mom says that is not a letter. I say it is.",
    ],
  },
  {
    id: "nora-loaf",
    from: "Nora",
    need: (met) => met.includes("nora"),
    lines: (name) => [
      `${name}. Tallow talks too much. This is quieter.`,
      "There is extra bread if you come by the oven. And Cobb is still a problem after dark.",
      "I will write again if the sheep come home the right number.",
    ],
  },
  {
    id: "willow-seat",
    from: "Willow",
    need: (met) => met.includes("willow"),
    lines: (name) => [
      `${name}. I do not come to the shrine. I wrote instead.`,
      "The seat under my tree is still empty. If you see him, tell him Willow kept it.",
      "That is all I have. It is enough for a letter.",
    ],
  },
  {
    id: "hal-keep",
    from: "Hal",
    need: (_m, cleared) => cleared.includes("cavern") || cleared.includes("keep"),
    lines: (name) => [
      `${name}. I am what is left of the door. I still write.`,
      "The unfinished king is inside. Your sword is enough, if you count true.",
      "Come when the gems sit. I will hold.",
    ],
  },
];

const REPLIES: Record<string, Letter> = {
  mira: {
    id: "reply-mira",
    from: "Mira",
    lines: (name) => [
      `${name}. I got your letter. I read it twice, to be sure.`,
      "The Oak says keep counting. I say the same.",
    ],
  },
  tallow: {
    id: "reply-tallow",
    from: "Tallow",
    lines: (name) => [
      `${name}!! YOU WROTE ME!!`,
      "I drew two sheep this time. Mom still says that is not a letter. I mailed it anyway.",
    ],
  },
  willow: {
    id: "reply-willow",
    from: "Willow",
    lines: (name) => [
      `${name}. Thank you. I read it under the tree.`,
      "The seat is still empty. Your words sat in it for a while.",
    ],
  },
  nora: {
    id: "reply-nora",
    from: "Nora",
    lines: (name) => [
      `${name}. A letter at the oven. Imagine that.`,
      "I saved you a heel of bread. Come if you are hungry.",
    ],
  },
  nana: {
    id: "reply-nana",
    from: "Nana",
    lines: (name) => [
      `${name}. Your letter found my table.`,
      "Come in when you like. The kettle remembers you.",
    ],
  },
  pip: {
    id: "reply-pip",
    from: "Pip",
    lines: (name) => [
      `${name}! I got mail!! Me!!`,
      "I will write back with a bigger stick next time.",
    ],
  },
  hal: {
    id: "reply-hal",
    from: "Hal",
    lines: (name) => [
      `${name}. I stood to read it.`,
      "The door still holds. So do you.",
    ],
  },
  pell: {
    id: "reply-pell",
    from: "Pell",
    lines: (name) => [
      `${name}. A shepherd got a letter. The sheep are jealous.`,
      "Count true. That is all I ever write.",
    ],
  },
  bram: {
    id: "reply-bram",
    from: "Bram",
    lines: (name) => [
      `${name}. Your proof arrived in an envelope.`,
      "Two truths, or none. I will keep the paper.",
    ],
  },
  sera: {
    id: "reply-sera",
    from: "Sera",
    lines: (name) => [
      `${name}. I kept your letter with his chalk.`,
      "The grove still smells like rain. Thank you for writing.",
    ],
  },
};

const ALL: Record<string, Letter> = {
  ...Object.fromEntries(STORY.map((s) => [s.id, s])),
  ...Object.fromEntries(Object.values(REPLIES).map((l) => [l.id, l])),
};

export function letterById(id: string): Letter | undefined {
  return ALL[id];
}

export function replyIdFor(npc: string): string | null {
  return REPLIES[npc] ? `reply-${npc}` : null;
}

export function npcIdFromName(name: string): string | null {
  const hit = WRITE_TO.find((p) => p.name.toLowerCase() === name.toLowerCase());
  return hit?.id ?? null;
}

export type CustomLetter = { id: string; from: string; lines: string[] };

export function nextLetter(
  got: string[],
  wait: string[],
  met: string[],
  cleared: string[],
  custom: CustomLetter[] = [],
): Letter | null {
  let pending = false;
  for (const id of wait) {
    if (got.includes(id)) continue;
    const c = custom.find((x) => x.id === id);
    if (c) return { id: c.id, from: c.from, lines: () => c.lines };
    const l = ALL[id];
    if (l) return l;
    if (id.startsWith("reply-")) pending = true;
  }
  if (pending) return null;
  for (const s of STORY) {
    if (got.includes(s.id)) continue;
    if (s.need && !s.need(met, cleared)) continue;
    return s;
  }
  return null;
}

export function hasMailWaiting(
  got: string[],
  wait: string[],
  met: string[],
  cleared: string[],
  custom: CustomLetter[] = [],
): boolean {
  if (wait.some((id) => !got.includes(id))) return true;
  return Boolean(nextLetter(got, wait, met, cleared, custom));
}

function clip(body: string) {
  const t = body.trim().replace(/\s+/g, " ");
  if (!t) return "what you wrote";
  const short = t.length > 42 ? `${t.slice(0, 42)}…` : t;
  return `“${short}”`;
}

export function craftReply(from: string, name: string, body: string): string[] {
  const q = clip(body);
  if (from === "Mira") {
    return [`${name}. I sat with ${q} until the Oak went quiet.`, "Thank you for writing back. Count true."];
  }
  if (from === "Tallow") {
    return [`${name}!! You wrote ${q}!!`, "I am going to read it to the sheep. They will not understand. I do not care."];
  }
  if (from === "Willow") {
    return [`${name}. I read ${q} under the tree.`, "The seat heard it too. Write again if you want. I will be here."];
  }
  if (from === "Nora") {
    return [`${name}. A letter that said ${q}.`, "I kept it by the oven. Come if you are hungry."];
  }
  if (from === "Nana") {
    return [`${name}. Your words found my table. ${q}.`, "The kettle is on. Come in when you like."];
  }
  if (from === "Pip") {
    return [`${name}! You wrote ${q}!!`, "I will write back with a bigger stick next time. Promise."];
  }
  if (from === "Hal") {
    return [`${name}. I stood to read ${q}.`, "The door still holds. So do you."];
  }
  if (from === "Pell") {
    return [`${name}. A shepherd got ${q}.`, "The sheep are jealous. Count true."];
  }
  if (from === "Bram") {
    return [`${name}. Your proof arrived. It said ${q}.`, "I will keep the paper. Two truths, or none."];
  }
  if (from === "Sera") {
    return [`${name}. I kept ${q} with his chalk.`, "The grove still smells like rain. Thank you for writing."];
  }
  return [`${name}. I got your letter. It said ${q}.`, "I will write again when I have more to say."];
}
