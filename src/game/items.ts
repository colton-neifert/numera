import { playFanfare } from "./audio";
import { useGame } from "./store";
import { live } from "./world3d/live";

export type GetId = "sword" | "heart" | "container" | "mushroom" | "apple" | "rock" | "key" | "crystal" | "horse" | "axe" | "wood" | "coin" | "ocarina" | "bow" | "sling" | "boom" | "bombs" | "arrow" | "seed" | "emerald" | "ruby" | "sapphire" | "compass" | "pole" | "fish" | "cooked";

export const GETS: Record<GetId, { title: string; blurb: string }> = {
  sword: { title: "You got the Hero’s Sword!", blurb: "Hold it high. Tap Sword to swing." },
  heart: { title: "You got a Heart!", blurb: "Your life is a little fuller." },
  container: { title: "You got a Heart Container!", blurb: "A gold heart. Your life grew — and every heart filled." },
  mushroom: { title: "You got a Heart Mushroom!", blurb: "Eat it from the backpack — one heart." },
  apple: { title: "You got an Apple!", blurb: "Eat it from the backpack — one heart." },
  rock: { title: "You got a Rock!", blurb: "Pick it up. Walk, then Throw. It cracks — a heart or rupee hides inside. Stand still and Throw to drop it." },
  key: { title: "You got a Small Key!", blurb: "It opens a locked door in this place." },
  crystal: { title: "You got a Lost Digit!", blurb: "A piece of the Vale’s unfinished count." },
  horse: { title: "You got a Horse!", blurb: "Name her. Then Ride. She is fast." },
  axe: { title: "You got the Forest Axe!", blurb: "Hold it from the backpack. Chop a tree three times. Chop the fallen log for more wood. One stack makes a fire." },
  wood: { title: "You got Wood!", blurb: "One stack makes a fire. Hold it from the backpack. Throw drops it. Stack it by your house, or put it on the town fire to make that fire bigger." },
  coin: { title: "You got a Rupee!", blurb: "It clinks in your purse. Cut grass for more." },
  ocarina: { title: "You got the Reed Flute!", blurb: "People will teach you songs. Play them from the backpack." },
  bow: { title: "You got the Hero’s Bow!", blurb: "Lock, then Sword to shoot. Arrows run out. Cut grass for more." },
  sling: { title: "You got the Slingshot!", blurb: "Sword shoots a seed. Cut grass for seeds. Hold it from the backpack." },
  boom: { title: "You got the Boomerang!", blurb: "Sword throws it. It comes back. Use Lock to aim." },
  bombs: { title: "You got Bombs!", blurb: "Hold them from the backpack. Sword throws. Cut grass for more. Max twenty — until you pay for a bigger bag." },
  arrow: { title: "You got Arrows!", blurb: "For the Hero’s Bow. You can only carry so many." },
  seed: { title: "You got Deku Seeds!", blurb: "For the slingshot." },
  emerald: { title: "You got the Sun Jewel!", blurb: "The orange jewel. One of three. Take it to the castle." },
  ruby: { title: "You got the Fire Jewel!", blurb: "The red jewel. One of three. Take it to the castle." },
  sapphire: { title: "You got the Water Jewel!", blurb: "The blue jewel. One of three. Take it to the castle." },
  compass: { title: "You got the Hero’s Compass!", blurb: "It lives in your backpack. The needle finds Oakstead — and north." },
  pole: { title: "You got a Fishing Pole!", blurb: "Hold it from your backpack. Stand by the pond. Tap Talk to cast." },
  fish: { title: "You caught a Fish!", blurb: "Eat it raw for one heart, or cook it on a fire — up to three at a time — for two hearts each." },
  cooked: { title: "You cooked a Fish!", blurb: "Eat it from the backpack — two hearts." },
};

export function revealItem(id: GetId): boolean {
  if (!useGame.getState().discover(id)) return false;
  live.getItem = id;
  if (id === "coin" || id === "arrow" || id === "seed" || id === "apple" || id === "mushroom" || id === "wood") playFanfare("sparkle");
  else if (id === "emerald") playFanfare("sun");
  else if (id === "ruby") playFanfare("fire");
  else if (id === "sapphire") playFanfare("water");
  else if (id === "sword" || id === "bow" || id === "boom" || id === "bombs" || id === "ocarina" || id === "container" || id === "horse" || id === "key") playFanfare("full");
  else playFanfare("short");
  return true;
}