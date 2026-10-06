/** A return the village does not announce. Stored on this device, not in the quest log. */
const KEY = "numeria-quiet";

type Quiet = { seen?: 1; left?: 1; armed?: 1; stirred?: 1; kept?: 1 };

function read(): Quiet {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Quiet) : {};
  } catch {
    return {};
  }
}

function write(patch: Partial<Quiet>) {
  const next = { ...read(), ...patch };
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
}

export function quietSeen() {
  return read().seen === 1;
}
export function markQuietSeen() {
  if (!quietSeen()) write({ seen: 1 });
}
export function quietLeft() {
  return read().left === 1;
}
export function markQuietLeft() {
  if (!quietLeft()) write({ left: 1 });
}
export function quietArmed() {
  return read().armed === 1;
}
export function markQuietArmed() {
  if (!quietArmed()) write({ armed: 1 });
}
export function quietStirred() {
  return read().stirred === 1;
}
export function markQuietStirred() {
  write({ stirred: 1, armed: 1 });
}
export function quietKept() {
  return read().kept === 1;
}
export function markQuietKept() {
  write({ kept: 1, stirred: 1, armed: 1 });
}
