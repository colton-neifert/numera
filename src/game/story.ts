export type StoryBeat = { kicker: string; lines: string[]; img?: string; vid?: string };

export const PROLOGUE: StoryBeat[] = [
  {
    kicker: "Once",
    vid: "/game/story/vale.mp4",
    lines: [
      "There was a green valley. Kids played. Sheep came home. Everyone was safe.",
    ],
  },
  {
    kicker: "The jewels",
    vid: "/game/story/jewels.mp4",
    lines: [
      "Three magic jewels lived in the castle.",
      "A sun jewel. A fire jewel. A water jewel. They kept the lizards away.",
    ],
  },
  {
    kicker: "The oak",
    vid: "/game/story/oak.mp4",
    lines: [
      "Kids learned under a big oak tree.",
      "Be kind. Tell the truth. Help your friends.",
    ],
  },
  {
    kicker: "Veyr",
    vid: "/game/story/thief.mp4",
    lines: [
      "A boy named Veyr wanted to be king.",
      "When people said no, he got mad. One night he stole the three jewels.",
    ],
  },
  {
    kicker: "The lizards",
    vid: "/game/story/lizards.mp4",
    lines: [
      "He hid them far away. Then lizards came into town.",
      "Veyr put on a gold crown. He grew big and scaly. He became the Lizard King.",
    ],
  },
  {
    kicker: "Home",
    vid: "/game/story/vale.mp4",
    lines: [
      "The village is still here. The castle is his now.",
      "People are scared. The oak tree is dying.",
    ],
  },
  {
    kicker: "You",
    vid: "/game/story/you.mp4",
    lines: [
      "The last green leaf on the oak points at you.",
    ],
  },
  {
    kicker: "Go",
    vid: "/game/story/jewels.mp4",
    lines: [
      "Find the three jewels. Put them back in the castle.",
      "The sun jewel is in a shrine in this meadow. Then you can stop the Lizard King.",
    ],
  },
];

export const FALSE_DAWN: StoryBeat[] = [
  {
    kicker: "Almost",
    vid: "/game/story/jewels.mp4",
    lines: [
      "You put the three jewels back. The castle lights up.",
      "For a second, the valley is safe again.",
    ],
  },
  {
    kicker: "Then",
    vid: "/game/story/king.mp4",
    lines: [
      "Someone laughs.",
      "He steals the light. The jewels go dark.",
    ],
  },
  {
    kicker: "Him",
    vid: "/game/story/king.mp4",
    lines: [
      "The Lizard King is in the castle.",
      "Go find him, {name}. Wait until he swings. Then hit him.",
    ],
  },
];

export const KING_INTRO: StoryBeat[] = [
  {
    kicker: "The Lizard King",
    vid: "/game/story/king.mp4",
    lines: [
      "He used to be a boy named Veyr. He stole the jewels so he could be king.",
      "Now he is big, and he has a crown, and he will not share.",
    ],
  },
  {
    kicker: "Fight",
    vid: "/game/story/king.mp4",
    lines: [
      "Wait until he swings. Then hit him, {name}.",
      "That is how you win.",
    ],
  },
];

export const KING_FALL: StoryBeat[] = [
  {
    kicker: "The crown",
    vid: "/game/story/king.mp4",
    lines: [
      "The crown falls. He is just Veyr again. Then he is gone.",
      "The valley can breathe.",
    ],
  },
  {
    kicker: "Not done",
    vid: "/game/story/lizards.mp4",
    lines: [
      "But his magic hid in five far places.",
      "Forest. Fire. Water. Night. Sand.",
    ],
  },
  {
    kicker: "Where",
    vid: "/game/story/vale.mp4",
    lines: [
      "Green Forest. Fire Mountain. Blue Lake. Night Grave. Sand Land.",
      "Walk them in that order, {name}. A horse can help.",
    ],
  },
];

export const ECHO_OPEN: StoryBeat[] = [
  {
    kicker: "Last hall",
    vid: "/game/story/king.mp4",
    lines: [
      "You cleaned five places. One hall is left.",
      "This is where the last bit of his magic hides.",
    ],
  },
  {
    kicker: "Finish",
    vid: "/game/story/you.mp4",
    lines: [
      "He has no crown now. He still wants to be king.",
      "Stop him, {name}.",
    ],
  },
];

export const ECHO_END: StoryBeat[] = [
  {
    kicker: "Split",
    vid: "/game/story/lizards.mp4",
    lines: [
      "You won. Then the magic split again.",
      "Five quiet temples woke up.",
    ],
  },
  {
    kicker: "Farther",
    vid: "/game/story/vale.mp4",
    lines: [
      "High Ridge. Clock Tower. Glass Swamp. Thunder Hollow. Crown Cave.",
      "Walk them in that order, {name}.",
    ],
  },
];

export const RIDGE_OPEN: StoryBeat[] = [
  {
    kicker: "High Ridge",
    vid: "/game/story/vale.mp4",
    lines: ["A high hill hid a piece of his magic.", "Walk the halls. Then the light at the end."],
  },
];

export const SPIRE_OPEN: StoryBeat[] = [
  {
    kicker: "Clock Tower",
    vid: "/game/story/jewels.mp4",
    lines: ["This tower counts hours that do not belong to anyone.", "Climb. Do not hurry."],
  },
];

export const FEN_OPEN: StoryBeat[] = [
  {
    kicker: "Glass Swamp",
    vid: "/game/story/vale.mp4",
    lines: ["The water here is like a mirror.", "Two stones. Then the deep swamp."],
  },
];

export const HOLLOW_OPEN: StoryBeat[] = [
  {
    kicker: "Thunder Hollow",
    vid: "/game/story/lizards.mp4",
    lines: ["Thunder hid a fire in this hollow.", "Then only Crown Cave is left."],
  },
];

export const VAULT_OPEN: StoryBeat[] = [
  {
    kicker: "Crown Cave",
    vid: "/game/story/king.mp4",
    lines: [
      "Four quiet temples are done. One cave is left.",
      "This is the last of his magic. He still wants a crown.",
    ],
  },
];

export const VAULT_END: StoryBeat[] = [
  {
    kicker: "Home",
    vid: "/game/story/vale.mp4",
    lines: [
      "The magic is gone. The valley is safe.",
      "A horse waits in the meadow. The Arena is still there if you want a fight that does not end.",
    ],
  },
];

export const GROVE_OPEN: StoryBeat[] = [
  {
    kicker: "Green Forest",
    vid: "/game/story/oak.mp4",
    lines: [
      "A piece of his magic hid in the trees.",
      "Walk the halls, {name}. The light at the end is a long walk.",
    ],
  },
];

export const CRATER_OPEN: StoryBeat[] = [
  {
    kicker: "Fire Mountain",
    vid: "/game/story/lizards.mp4",
    lines: ["Fire hid a piece of his magic.", "The eye of fire is first. Then the deep heat."],
  },
];

export const LAKE_OPEN: StoryBeat[] = [
  {
    kicker: "Blue Lake",
    vid: "/game/story/vale.mp4",
    lines: ["Water hid a piece of his magic.", "Two stones on the floor. Then the deep."],
  },
];

export const GRAVE_OPEN: StoryBeat[] = [
  {
    kicker: "Night Grave",
    vid: "/game/story/thief.mp4",
    lines: ["Night hid a piece of his magic.", "The night-eye first. Then the long dark."],
  },
];

export const WASTE_OPEN: StoryBeat[] = [
  {
    kicker: "Sand Land",
    vid: "/game/story/vale.mp4",
    lines: [
      "Sand hid the last of the five.",
      "When you finish this one, a last hall will open.",
    ],
  },
];
