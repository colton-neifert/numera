import { speakNpc } from "@/lib/tts";

type Persona = {
  voice: string;
  rate: number;
  kind: "girl" | "boy" | "woman" | "man" | "old-woman" | "old-man" | "kid-girl" | "kid-boy";
};

const PEOPLE: Record<string, Persona> = {
  Mira: { voice: "iris", rate: 1, kind: "woman" },
  Willow: { voice: "carina", rate: 0.98, kind: "girl" },
  Sera: { voice: "aurora", rate: 1, kind: "woman" },
  Nora: { voice: "liora", rate: 0.98, kind: "woman" },
  Nana: { voice: "luna", rate: 0.86, kind: "old-woman" },
  Nim: { voice: "celeste", rate: 1, kind: "girl" },
  Ash: { voice: "ursa", rate: 0.97, kind: "woman" },
  Lark: { voice: "eve", rate: 1.08, kind: "kid-girl" },
  Fairy: { voice: "eve", rate: 1.06, kind: "girl" },
  Tallow: { voice: "cosmo", rate: 1.14, kind: "kid-boy" },
  Pip: { voice: "helios", rate: 1.16, kind: "kid-boy" },
  Echo: { voice: "sirius", rate: 1.1, kind: "kid-boy" },
  Hal: { voice: "castor", rate: 0.96, kind: "man" },
  Bram: { voice: "lux", rate: 0.84, kind: "old-man" },
  Pell: { voice: "naksh", rate: 0.82, kind: "old-man" },
  Note: { voice: "lumen", rate: 0.94, kind: "man" },
  Sign: { voice: "rex", rate: 0.92, kind: "man" },
  Stone: { voice: "zagan", rate: 0.86, kind: "old-man" },
  Well: { voice: "orion", rate: 0.88, kind: "old-man" },
};

const cache = new Map<string, string>();
const sticky = new Map<string, SpeechSynthesisVoice>();
let current: HTMLAudioElement | null = null;
let seq = 0;

function confFor(speaker: string): Persona {
  const s = speaker.toLowerCase();
  for (const [name, conf] of Object.entries(PEOPLE)) {
    if (s.includes(name.toLowerCase())) return conf;
  }
  if (s.includes("stone") || s.includes("gossip")) return PEOPLE.Stone!;
  if (s.includes("well")) return PEOPLE.Well!;
  if (s.includes("sign") || s.includes("weathered") || s.includes("letter")) return PEOPLE.Sign!;
  if (s.includes("note") || s.includes("scrap")) return PEOPLE.Note!;
  if (s.includes("nana") || s.includes("old")) return PEOPLE.Nana!;
  if (s.includes("boy") || s.includes("kid") || s.includes("child")) return PEOPLE.Pip!;
  if (s.includes("girl")) return PEOPLE.Lark!;
  return { voice: "sal", rate: 0.98, kind: "man" };
}

function stopAudio() {
  if (current) {
    current.pause();
    current.src = "";
    current = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function stopSpeech() {
  seq += 1;
  stopAudio();
}

export async function speakLine(speaker: string, text: string) {
  if (typeof window === "undefined" || !text.trim()) return;
  const n = ++seq;
  stopAudio();
  const conf = confFor(speaker);
  const key = `${conf.voice}|${text}`;
  let b64 = cache.get(key);
  if (!b64) {
    try {
      const res = await speakNpc({ data: { text, voice: conf.voice } });
      if (n !== seq) return;
      if (res?.ok) {
        b64 = res.b64;
        if (cache.size > 48) cache.delete(cache.keys().next().value!);
        cache.set(key, b64);
      }
    } catch {
      /* fall through */
    }
  }
  if (n !== seq) return;
  if (b64) {
    const audio = new Audio(`data:audio/mpeg;base64,${b64}`);
    audio.volume = 0.22;
    audio.playbackRate = conf.rate;
    audio.preservesPitch = conf.kind.startsWith("kid") ? false : true;
    current = audio;
    void audio.play().catch(() => {
      if (n === seq) speakFallback(speaker, text, conf);
    });
    return;
  }
  speakFallback(speaker, text, conf);
}

const SIRI = /siri|samantha|nicky|karen|zira|google us english|microsoft zira|enhanced/;
const FEMALE = /female|woman|girl|fiona|moira|tessa|hazel|kate|serena|martha|victoria|susan|veena/;
const MALE = /male|man|boy|david|daniel|fred|guy|alex|george|thomas|james|oliver|junior|daniel/;
const KID = /junior|kid|child|boy/;
const OLD = /daniel|george|thomas|hazel|martha|serena/;

function pickVoice(conf: Persona): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const stuck = sticky.get(conf.voice);
  if (stuck) return stuck;
  const all = window.speechSynthesis.getVoices();
  if (!all.length) return null;
  const en = all.filter((v) => /en[-_]/i.test(v.lang) || v.lang.toLowerCase().startsWith("en"));
  const pool = (en.length ? en : all).filter((v) => !SIRI.test(v.name.toLowerCase()));
  const list = pool.length ? pool : en;
  const girl = conf.kind === "girl" || conf.kind === "woman" || conf.kind === "old-woman" || conf.kind === "kid-girl";
  let best = list[0] ?? all[0]!;
  let bestScore = -99;
  for (const v of list) {
    const n = v.name.toLowerCase();
    let score = 0;
    if (girl && FEMALE.test(n)) score += 6;
    if (!girl && MALE.test(n)) score += 6;
    if (girl && MALE.test(n) && !FEMALE.test(n)) score -= 8;
    if (!girl && FEMALE.test(n) && !MALE.test(n)) score -= 8;
    if ((conf.kind === "kid-boy" || conf.kind === "kid-girl") && KID.test(n)) score += 5;
    if ((conf.kind === "old-man" || conf.kind === "old-woman") && OLD.test(n)) score += 4;
    if (n.includes("natural") || n.includes("premium") || n.includes("neural")) score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  sticky.set(conf.voice, best);
  return best;
}

function speakFallback(speaker: string, text: string, conf: Persona) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(conf);
  if (voice) u.voice = voice;
  u.lang = voice?.lang || "en-US";
  u.pitch = conf.kind.startsWith("kid") ? 1.28 : conf.kind.startsWith("old") ? 0.78 : conf.kind.includes("girl") || conf.kind === "woman" ? 1.12 : 0.92;
  u.rate = conf.kind.startsWith("kid") ? 1.08 : conf.kind.startsWith("old") ? 0.8 : 0.94;
  u.volume = 0.32;
  window.speechSynthesis.speak(u);
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener("voiceschanged", () => window.speechSynthesis.getVoices());
}
