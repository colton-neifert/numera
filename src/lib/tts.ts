import { createServerFn } from "@tanstack/react-start";

const VOICES = new Set([
  "ara",
  "aurora",
  "carina",
  "celeste",
  "eve",
  "iris",
  "liora",
  "luna",
  "ursa",
  "altair",
  "atlas",
  "castor",
  "cosmo",
  "helios",
  "leo",
  "lumen",
  "lux",
  "naksh",
  "orion",
  "perseus",
  "rex",
  "sal",
  "sirius",
  "zagan",
]);

export const speakNpc = createServerFn({ method: "POST" })
  .validator((input: { text: string; voice: string }) => ({
    text: String(input?.text ?? "").trim().slice(0, 480),
    voice: String(input?.voice ?? "eve").toLowerCase().slice(0, 24),
  }))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey || !data.text) return { ok: false as const };
    const voice = VOICES.has(data.voice) ? data.voice : "eve";
    const res = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: data.text,
        voice_id: voice,
        language: "en",
      }),
    });
    if (!res.ok) return { ok: false as const };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 80) return { ok: false as const };
    return { ok: true as const, mime: "audio/mpeg" as const, b64: buf.toString("base64") };
  });
