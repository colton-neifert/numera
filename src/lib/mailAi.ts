import { createServerFn } from "@tanstack/react-start";

const VOICE: Record<string, string> = {
  Mira: "You are Mira, a patient orchard girl in the Vale of Numeria. You speak in short, even sentences. You count. You trust the Oak.",
  Tallow: "You are Tallow, an excited little boy. You shout. You love sheep and hide-and-seek. You use too many marks.",
  Willow: "You are Willow, quiet and sad. You sit under a tree. You speak softly, in short lines. You do not go to the shrine.",
  Nora: "You are Nora, a baker and mother. Practical. Warm. A little tired of Tallow talking.",
  Nana: "You are Nana, old and calm. Kettle, table, come-in-when-you-like.",
  Pip: "You are Pip, a small excited kid. Short words. Big feelings.",
  Hal: "You are Hal, a tired door-guard. Few words. Duty. Standing.",
  Pell: "You are Pell, keeper of Pell’s table. Dry. Counts plates. Feeds the Vale.",
  Bram: "You are Bram, an old teacher. Proofs. Two truths or none.",
  Sera: "You are Sera, who kept Veyr’s chalk. Soft. The grove. Rain.",
  Cobb: "You are Cobb, a small sketchy gardener. You inspect other people’s carrots at night. You deny it. You are funny when cornered.",
  Wren: "You are Wren. Wipe your feet. Short. The mill and the fangs.",
  Cole: "You are Cole. Calm. Oakstead is small and you like it that way.",
  Tess: "You are Tess, a kid. The top bunk is yours. Excited. Too many marks.",
  Holt: "You are Holt, a proud gardener. Crates. Carrots. Cobb is a problem.",
  Oat: "You are Oat. The mill. Purses. Comfort when the count is wrong.",
  Nell: "You are Nell. Night listener. Don’t open for fangs.",
  Reed: "You are Reed. Wood, grain, names for the Oak.",
  Rook: "You are Rook. You act like a friend. You are a little sketchy. Warm voice, wrong smile. You hint at a fight someday. Never say you are a boss.",
};

export const writeNpcReply = createServerFn({ method: "POST" })
  .validator((input: { from: string; name: string; body: string }) => ({
    from: String(input?.from ?? "Friend").slice(0, 24),
    name: String(input?.name ?? "Scholar").slice(0, 16),
    body: String(input?.body ?? "").trim().slice(0, 220),
  }))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey || !data.body) return { ok: false as const };
    const who = VOICE[data.from] ?? `You are ${data.from}, a person in the Vale of Numeria. Speak in short in-world lines.`;
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 160,
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content: `${who}

Write a letter back to ${data.name}. Two or three short lines only. Answer what they actually wrote — quote or name a thing they said. Stay in character. No stage directions. No quotes around the whole letter. No markdown.`,
          },
          {
            role: "user",
            content: `${data.name} wrote this letter:\n${data.body}`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false as const };
    const lines = text
      .split(/\n+/)
      .map((s) => s.replace(/^[-*]\s+/, "").trim())
      .filter(Boolean)
      .slice(0, 4);
    if (!lines.length) return { ok: false as const };
    return { ok: true as const, lines };
  });

export const writeTableTalk = createServerFn({ method: "POST" })
  .validator((input: { from: string; name: string; said: string; reply: string }) => ({
    from: String(input?.from ?? "Friend").slice(0, 24),
    name: String(input?.name ?? "Scholar").slice(0, 16),
    said: String(input?.said ?? "").trim().slice(0, 180),
    reply: String(input?.reply ?? "").trim().slice(0, 180),
  }))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey || !data.reply) return { ok: false as const };
    const who = VOICE[data.from] ?? `You are ${data.from}, a villager in Oakstead in the Vale of Numeria. Short in-world talk. You can be funny or snarky.`;
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 90,
        temperature: 0.9,
        messages: [
          {
            role: "system",
            content: `${who}

You are sitting at Pell’s table. ${data.name} is eating with you. Answer what they actually said. One or two short spoken lines. Stay in character. Jokes are allowed. If someone mentioned Cobb at night, be snarky. No stage directions. No markdown.`,
          },
          {
            role: "user",
            content: `${data.from} just said: "${data.said}"\n${data.name} answered: "${data.reply}"`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false as const };
    return { ok: true as const, line: text.replace(/^["']|["']$/g, "").slice(0, 180) };
  });
