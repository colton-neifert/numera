import type { GradeBand, MathProblem } from "./types";

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(items: T[]): T {
  return items[randInt(0, items.length - 1)]!;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

function uniqueChoices(correct: number, extras: number[]): string[] {
  const set = new Set<number>([correct]);
  for (const n of extras) {
    if (!Number.isFinite(n)) continue;
    if (n === correct) continue;
    set.add(n);
    if (set.size >= 4) break;
  }
  let guard = 0;
  while (set.size < 4 && guard < 40) {
    const wobble = correct + randInt(-8, 8);
    if (wobble !== correct) set.add(wobble);
    guard++;
  }
  return shuffle([...set].slice(0, 4).map(String));
}

function stacked(top: number, bot: number, op: string): MathProblem["stack"] {
  return { top: String(top), bot: String(bot), op };
}

function wrap(p: MathProblem): MathProblem {
  if (!p.choices.includes(p.answer)) p.choices = [p.answer, ...p.choices].slice(0, 4);
  if (p.choices.length < 4) p.choices = uniqueChoices(Number(p.answer), [Number(p.answer) + 1]);
  return p;
}

function addWithin(maxSum: number): MathProblem {
  const a = randInt(0, maxSum);
  const b = randInt(0, maxSum - a);
  const sum = a + b;
  return {
    prompt: `${a} + ${b} = ?`,
    answer: String(sum),
    choices: uniqueChoices(sum, [sum + 1, Math.abs(a - b), a + b + 2, Math.max(0, sum - 1)]),
    topic: "Addition",
    stack: stacked(a, b, "+"),
  };
}

function subWithin(max: number): MathProblem {
  const left = randInt(1, max);
  const right = randInt(0, left);
  const diff = left - right;
  return {
    prompt: `${left} − ${right} = ?`,
    answer: String(diff),
    choices: uniqueChoices(diff, [left + right, Math.abs(diff) + 1, left, right]),
    topic: "Subtraction",
    stack: stacked(left, right, "−"),
  };
}

function oneMore(max: number): MathProblem {
  const n = randInt(1, max);
  const more = Math.random() < 0.5;
  const ans = more ? n + 1 : Math.max(0, n - 1);
  return {
    prompt: more ? `What is 1 more than ${n}?` : `What is 1 less than ${n}?`,
    answer: String(ans),
    choices: uniqueChoices(ans, [n, n + 2, Math.max(0, n - 2), n + 1]),
    topic: "Counting",
  };
}

function countNext(max: number): MathProblem {
  const n = randInt(0, max);
  const after = Math.random() < 0.65;
  const ans = after ? n + 1 : Math.max(0, n - 1);
  return {
    prompt: after ? `What number comes after ${n}?` : `What number comes before ${n}?`,
    answer: String(ans),
    choices: uniqueChoices(ans, [n, n + 2, Math.max(0, n - 2)]),
    topic: "Counting",
  };
}

function compare(max: number): MathProblem {
  let a = randInt(1, max);
  let b = randInt(1, max);
  if (a === b) b = Math.min(max, a + randInt(1, 3));
  const bigger = Math.max(a, b);
  return {
    prompt: `Which is greater, ${a} or ${b}?`,
    answer: String(bigger),
    choices: shuffle([String(a), String(b), String(a + b), String(Math.abs(a - b))]).slice(0, 4),
    topic: "Compare",
  };
}

function addSub(min: number, max: number, allowNeg: boolean): MathProblem {
  const a = randInt(min, max);
  const b = randInt(min, max);
  if (Math.random() < 0.5) {
    const sum = a + b;
    return {
      prompt: `${a} + ${b} = ?`,
      answer: String(sum),
      choices: uniqueChoices(sum, [a + b + 1, a + b - 1, Math.abs(a - b), a + b + 10]),
      topic: "Addition",
      stack: stacked(a, b, "+"),
    };
  }
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  const left = allowNeg ? a : hi;
  const right = allowNeg ? b : lo;
  const diff = left - right;
  return {
    prompt: `${left} − ${right} = ?`,
    answer: String(diff),
    choices: uniqueChoices(diff, [left + right, Math.abs(diff) + 1, -diff, diff + 2]),
    topic: "Subtraction",
    stack: stacked(left, right, "−"),
  };
}

function multiply(aMax: number, bMax: number, aMin = 2, bMin = 2): MathProblem {
  const a = randInt(aMin, aMax);
  const b = randInt(bMin, bMax);
  const prod = a * b;
  return {
    prompt: `${a} × ${b} = ?`,
    answer: String(prod),
    choices: uniqueChoices(prod, [a * b + a, a * (b - 1), a + b, a * b + 1]),
    topic: "Multiplication",
    stack: stacked(a, b, "×"),
  };
}

function divide(maxTable: number): MathProblem {
  const b = randInt(2, maxTable);
  const q = randInt(2, maxTable);
  const a = b * q;
  return {
    prompt: `${a} ÷ ${b} = ?`,
    answer: String(q),
    choices: uniqueChoices(q, [q + 1, q - 1, b, a - b]),
    topic: "Division",
    stack: stacked(a, b, "÷"),
  };
}

function missingAddend(max: number): MathProblem {
  const a = randInt(1, max);
  const b = randInt(1, max);
  const sum = a + b;
  return {
    prompt: `${a} + □ = ${sum}`,
    answer: String(b),
    choices: uniqueChoices(b, [sum, a, b + 1, sum - a + 1]),
    topic: "Missing number",
  };
}

function carryAdd(digits: 2 | 3): MathProblem {
  const min = digits === 2 ? 28 : 148;
  const max = digits === 2 ? 94 : 586;
  const a = randInt(min, max);
  const b = randInt(min, max);
  const sum = a + b;
  return {
    prompt: `${a} + ${b} = ?`,
    answer: String(sum),
    choices: uniqueChoices(sum, [sum + 10, sum - 10, a + b - 1, Math.abs(a - b)]),
    topic: "Addition",
    stack: stacked(a, b, "+"),
  };
}

function twoDigitSub(): MathProblem {
  const a = randInt(41, 98);
  const b = randInt(12, a - 9);
  const diff = a - b;
  return {
    prompt: `${a} − ${b} = ?`,
    answer: String(diff),
    choices: uniqueChoices(diff, [a + b, diff + 10, Math.abs(a - b - 10), b]),
    topic: "Subtraction",
    stack: stacked(a, b, "−"),
  };
}

function threeDigitSub(): MathProblem {
  const a = randInt(240, 860);
  const b = randInt(48, Math.min(390, a - 20));
  const diff = a - b;
  return {
    prompt: `${a} − ${b} = ?`,
    answer: String(diff),
    choices: uniqueChoices(diff, [a + b, diff + 10, diff - 10, b]),
    topic: "Subtraction",
    stack: stacked(a, b, "−"),
  };
}

function timesPlus(): MathProblem {
  const a = randInt(6, 12);
  const b = randInt(4, 11);
  const c = randInt(8, 24);
  const ans = a * b + c;
  return {
    prompt: `${a} × ${b} + ${c} = ?`,
    answer: String(ans),
    choices: uniqueChoices(ans, [a * (b + c), a + b + c, a * b - c, (a + b) * c]),
    topic: "Two steps",
  };
}

function halfOf(): MathProblem {
  const q = randInt(4, 16);
  const n = q * 2;
  return {
    prompt: `What is ½ of ${n}?`,
    answer: String(q),
    choices: uniqueChoices(q, [n, q + 1, n / 2 + 2, q * 2]),
    topic: "Fractions",
  };
}

function rounding(): MathProblem {
  const tens = randInt(2, 9) * 10;
  const ones = randInt(1, 9);
  const n = tens + ones;
  const ans = ones >= 5 ? tens + 10 : tens;
  return {
    prompt: `Round ${n} to the nearest ten.`,
    answer: String(ans),
    choices: uniqueChoices(ans, [tens, tens + 10, n, n + 1]),
    topic: "Rounding",
  };
}

function percent(): MathProblem {
  const pct = pick([10, 20, 25, 50]);
  const base = pick([20, 40, 60, 80, 100]);
  const ans = (pct / 100) * base;
  return {
    prompt: `${pct}% of ${base} = ?`,
    answer: String(ans),
    choices: uniqueChoices(ans, [base - pct, pct, base / 2, ans + 5]),
    topic: "Percent",
  };
}

function percentHard(): MathProblem {
  const pct = pick([15, 30, 40, 75]);
  const base = pick([40, 80, 120, 200]);
  const ans = (pct / 100) * base;
  return {
    prompt: `${pct}% of ${base} = ?`,
    answer: String(ans),
    choices: uniqueChoices(ans, [base - pct, pct, base / 2, ans + 10]),
    topic: "Percent",
  };
}

function integers(): MathProblem {
  const a = randInt(-14, 14);
  const b = randInt(-10, 10);
  if (Math.random() < 0.5) {
    const sum = a + b;
    const aLabel = a < 0 ? `(${a})` : String(a);
    const bLabel = b < 0 ? `(${b})` : String(b);
    return {
      prompt: `${aLabel} + ${bLabel} = ?`,
      answer: String(sum),
      choices: uniqueChoices(sum, [a - b, -(a + b), a + Math.abs(b)]),
      topic: "Integers",
      stack: stacked(a, b, "+"),
    };
  }
  const diff = a - b;
  return {
    prompt: `${a} − ${b} = ?`,
    answer: String(diff),
    choices: uniqueChoices(diff, [a + b, b - a, a - Math.abs(b)]),
    topic: "Integers",
    stack: stacked(a, b, "−"),
  };
}

function integerMul(): MathProblem {
  const a = randInt(-8, 8) || -3;
  const b = randInt(-6, 6) || 4;
  const prod = a * b;
  const aLabel = a < 0 ? `(${a})` : String(a);
  const bLabel = b < 0 ? `(${b})` : String(b);
  return {
    prompt: `${aLabel} × ${bLabel} = ?`,
    answer: String(prod),
    choices: uniqueChoices(prod, [-prod, a + b, a * Math.abs(b)]),
    topic: "Integers",
    stack: stacked(a, b, "×"),
  };
}

function orderOfOps(): MathProblem {
  const a = randInt(2, 9);
  const b = randInt(2, 8);
  const c = randInt(2, 7);
  if (Math.random() < 0.5) {
    const ans = a + b * c;
    return {
      prompt: `${a} + ${b} × ${c} = ?`,
      answer: String(ans),
      choices: uniqueChoices(ans, [(a + b) * c, a + b + c, a * b + c]),
      topic: "Order of operations",
    };
  }
  const ans = a * b + c;
  return {
    prompt: `${a} × ${b} + ${c} = ?`,
    answer: String(ans),
    choices: uniqueChoices(ans, [a * (b + c), a + b + c, a * b - c]),
    topic: "Order of operations",
  };
}

function harderOps(): MathProblem {
  const a = randInt(3, 9);
  const b = randInt(2, 8);
  const c = randInt(2, 6);
  const d = randInt(2, 9);
  if (Math.random() < 0.5) {
    const ans = (a + b) * c - d;
    return {
      prompt: `(${a} + ${b}) × ${c} − ${d} = ?`,
      answer: String(ans),
      choices: uniqueChoices(ans, [a + b * c - d, (a + b) * (c - d), a + b * c + d]),
      topic: "Order of operations",
    };
  }
  const ans = a * b - c * d;
  return {
    prompt: `${a} × ${b} − ${c} × ${d} = ?`,
    answer: String(ans),
    choices: uniqueChoices(ans, [(a * b - c) * d, a * (b - c) * d, a * b + c * d]),
    topic: "Order of operations",
  };
}

function simpleEquation(): MathProblem {
  const n = randInt(4, 18);
  const add = randInt(3, 12);
  return {
    prompt: `n + ${add} = ${n + add}. What is n?`,
    answer: String(n),
    choices: uniqueChoices(n, [n + add, add, n + 1, n + add - 1]),
    topic: "Equations",
  };
}

function equationTimes(): MathProblem {
  const n = randInt(3, 12);
  const m = randInt(2, 6);
  const add = randInt(1, 9);
  return {
    prompt: `${m}n + ${add} = ${m * n + add}. What is n?`,
    answer: String(n),
    choices: uniqueChoices(n, [m * n + add, n + add, m, n * m]),
    topic: "Equations",
  };
}

type Maker = () => MathProblem;

const RUNGS: Maker[][] = [
  [() => addWithin(5), () => subWithin(5), () => oneMore(6), () => countNext(8), () => compare(6)],
  [() => addWithin(10), () => subWithin(10), () => oneMore(10), () => countNext(12), () => compare(10)],
  [() => addWithin(15), () => subWithin(15), () => missingAddend(8), () => oneMore(15), () => compare(15)],
  [() => addSub(4, 20, false), () => addWithin(20), () => multiply(5, 5), () => missingAddend(12), () => subWithin(20)],
  [() => addSub(10, 48, false), () => multiply(8, 8), () => divide(6), () => missingAddend(18), () => twoDigitSub()],
  [() => carryAdd(2), () => twoDigitSub(), () => multiply(10, 10), () => divide(10), () => addSub(20, 70, false)],
  [() => multiply(12, 10), () => divide(10), () => addSub(30, 90, false), () => rounding(), () => halfOf()],
  [() => carryAdd(3), () => multiply(12, 12), () => timesPlus(), () => divide(12), () => rounding()],
  [() => threeDigitSub(), () => timesPlus(), () => halfOf(), () => divide(12), () => carryAdd(3)],
  [() => integers(), () => simpleEquation(), () => multiply(12, 12), () => orderOfOps(), () => percent()],
  [() => orderOfOps(), () => percent(), () => integers(), () => simpleEquation(), () => timesPlus()],
  [() => harderOps(), () => percentHard(), () => integerMul(), () => equationTimes(), () => threeDigitSub()],
];

export const GRADE_ORDER: GradeBand[] = ["k1", "g23", "g45", "g68"];

export function rungRange(chosen: GradeBand): { min: number; max: number; start: number } {
  const i = Math.max(0, GRADE_ORDER.indexOf(chosen));
  return {
    min: Math.max(0, i * 3),
    max: Math.min(RUNGS.length - 1, i * 3 + 3),
    start: Math.min(RUNGS.length - 1, i * 3 + 2),
  };
}

export function startRung(chosen: GradeBand): number {
  return rungRange(chosen).start;
}

export function adjustRung(
  chosen: GradeBand,
  rung: number,
  streak: number,
  correct: boolean,
): { mathRung: number; mathStreak: number } {
  const { min, max } = rungRange(chosen);
  let nextRung = Math.max(min, Math.min(max, rung));
  let nextStreak = streak;
  if (correct) {
    nextStreak = streak >= 0 ? streak + 1 : 1;
    if (nextStreak >= 2) {
      nextRung = Math.min(max, nextRung + 1);
      nextStreak = 0;
    }
  } else {
    nextStreak = streak <= 0 ? streak - 1 : -1;
    if (nextStreak <= -2) {
      nextRung = Math.max(min, nextRung - 1);
      nextStreak = 0;
    }
  }
  return { mathRung: nextRung, mathStreak: nextStreak };
}

export function makeProblem(grade: GradeBand, rung?: number): MathProblem {
  const { min, max, start } = rungRange(grade);
  const r = Math.max(min, Math.min(max, Number.isFinite(rung) ? (rung as number) : start));
  const pool = RUNGS[r] ?? RUNGS[0]!;
  return wrap(pick(pool)());
}

export function answersMatch(given: string, expected: string): boolean {
  const a = given.trim().replace(/,/g, "").replace(/−/g, "-").replace(/\s+/g, "");
  const b = expected.trim().replace(/,/g, "").replace(/−/g, "-").replace(/\s+/g, "");
  if (!a) return false;
  if (a === b) return true;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return Math.abs(na - nb) < 1e-6;
  return a.toLowerCase() === b.toLowerCase();
}
