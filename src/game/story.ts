export type StoryBeat = { kicker: string; lines: string[]; img?: string; vid?: string };

export const PROLOGUE: StoryBeat[] = [
  {
    kicker: "The Vale",
    vid: "/game/story/vale.mp4",
    lines: [
      "This is a legend of a green country, and of a door that slept beneath its castle.",
    ],
  },
  {
    kicker: "The Three Jewels",
    vid: "/game/story/jewels.mp4",
    lines: [
      "Sun. Fire. Water.",
      "The people called them treasure. The old oak knew they were a lock.",
    ],
  },
  {
    kicker: "The Lesson",
    vid: "/game/story/oak.mp4",
    lines: [
      "Children learned a simple law in its shade.",
      "Be kind. Tell the truth. Leave sleeping doors alone.",
    ],
  },
  {
    kicker: "Veyr",
    vid: "/game/story/thief.mp4",
    lines: [
      "A boy named Veyr wanted a crown more than he wanted a home.",
      "One night the jewels were gone.",
    ],
  },
  {
    kicker: "The Moon Hall",
    vid: "/game/story/king.mp4",
    lines: [
      "Moonlight found the empty locks.",
      "What woke there still wears gold.",
    ],
  },
  {
    kicker: "The Last Leaf",
    vid: "/game/story/you.mp4",
    lines: [
      "The oak has one green leaf left.",
      "It points at you.",
    ],
  },
];

export const FALSE_DAWN: StoryBeat[] = [
  {
    kicker: "The Door",
    vid: "/game/story/jewels.mp4",
    lines: [
      "The three jewels found their places. For a breath, the door slept again.",
    ],
  },
  {
    kicker: "The Laugh",
    vid: "/game/story/king.mp4",
    lines: [
      "A laugh in the dark.",
      "The light went out of the stones.",
    ],
  },
  {
    kicker: "The Round Hall",
    vid: "/game/story/king.mp4",
    lines: [
      "He is waiting, {name}.",
      "Where moonlight falls in a circle.",
    ],
  },
];

export const KING_INTRO: StoryBeat[] = [
  {
    kicker: "The Crowned One",
    vid: "/game/story/king.mp4",
    lines: [
      "Once he was a boy who wanted a crown.",
      "The moon gave him one.",
    ],
  },
];

export const KING_FALL: StoryBeat[] = [
  {
    kicker: "The Crown",
    vid: "/game/story/king.mp4",
    lines: [
      "Gold hits the stone. A boy stands where a king was.",
      "Then even the boy is gone.",
    ],
  },
  {
    kicker: "Echoes",
    vid: "/game/story/lizards.mp4",
    lines: [
      "His magic hid in five far countries.",
      "Forest. Fire. Water. Night. Sand.",
    ],
  },
  {
    kicker: "The Road",
    vid: "/game/story/vale.mp4",
    lines: [
      "Green Forest. Fire Mountain. Blue Lake. Night Grave. Sand Land.",
      "The vale is wide, {name}. A horse knows the way.",
    ],
  },
];

export const ECHO_OPEN: StoryBeat[] = [
  {
    kicker: "The Last Hall",
    vid: "/game/story/king.mp4",
    lines: [
      "You cleaned five places. One hall is left.",
      "This is where the last bit of his magic hides.",
    ],
  },
  {
    kicker: "You",
    vid: "/game/story/you.mp4",
    lines: [
      "He has no crown now. He still wants to be king.",
      "Stop him, {name}.",
    ],
  },
];

export const ECHO_END: StoryBeat[] = [
  {
    kicker: "Five Temples",
    vid: "/game/story/lizards.mp4",
    lines: [
      "You won. Then the magic split again.",
      "Five quiet temples woke up.",
    ],
  },
  {
    kicker: "Far Countries",
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
