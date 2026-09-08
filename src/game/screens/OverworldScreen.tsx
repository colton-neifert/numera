import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TouchPad } from "../components/TouchPad";
import { WORLD_META, cleanName, gemForWorld, playerMaxHp, talk } from "../content";
import { CompassRose, GemRow, Hearts, QuestWhisper, Rupees } from "../components/Hud";
import { DevPanel } from "../components/DevPanel";
import { CharViewer } from "./CharViewer";
import { testGearPatch, TEST_ALL_GEAR, completeGamePatch, COMPLETE_SAVE } from "../kit";
import { sfx, playTheme, setMusicDuck, setMusicMix, setSfxMix, getMusicMix, getSfxMix, setMuted, setScene, setTalkMix, getTalkMix } from "../audio";
import { npcById } from "../dialogue";
import { extraTalk } from "../mysteryTalk";
import { queueTalk, clearQueuedInput, isPad, padHint } from "../input";
import { useGame } from "../store";
import type { WorldId } from "../types";
import { GETS, revealItem, type GetId } from "../items";
import { SONGS, TEACH, completeSong } from "../songs";
import { speakLine, stopSpeech } from "../speech";
import { live, formatClock, parsePartySize, ashPays } from "../world3d/live";
import { POND } from "../world3d/field";
import { pickTableIndex, TOWN_PARTY } from "../world3d/house";
import { writeTableTalk } from "@/lib/mailAi";
import { WRITE_TO, npcIdFromName } from "../mail";
import { KING_FALL, KING_INTRO, ECHO_END, ECHO_OPEN, FALSE_DAWN, GROVE_OPEN, CRATER_OPEN, LAKE_OPEN, GRAVE_OPEN, WASTE_OPEN, RIDGE_OPEN, SPIRE_OPEN, FEN_OPEN, HOLLOW_OPEN, VAULT_OPEN, VAULT_END, type StoryBeat } from "../story";
import { VILLAGE_NAME } from "../world3d/village";
import { isDungeon } from "../world3d/field";
import { WorldCanvas, type WorldHooks } from "../world3d/WorldCanvas";
import { FightOverlay } from "./FightOverlay";
import { StoryShot, shotFromVid } from "../intro/StoryShot";
import { Backpack } from "../components/Backpack";

const STORY_REELS: Record<string, StoryBeat[]> = {
  "false-dawn": FALSE_DAWN,
  "king-intro": KING_INTRO,
  "king-fall": KING_FALL,
  "echo-open": ECHO_OPEN,
  "echo-end": ECHO_END,
  "grove-open": GROVE_OPEN,
  "crater-open": CRATER_OPEN,
  "lake-open": LAKE_OPEN,
  "grave-open": GRAVE_OPEN,
  "waste-open": WASTE_OPEN,
  "ridge-open": RIDGE_OPEN,
  "spire-open": SPIRE_OPEN,
  "fen-open": FEN_OPEN,
  "hollow-open": HOLLOW_OPEN,
  "vault-open": VAULT_OPEN,
  "vault-end": VAULT_END,
};

const STORY_MET: Record<string, string> = {
  "false-dawn": "false-dawn",
  "king-intro": "veyr-intro",
  "king-fall": "veyr-fall",
  "echo-open": "echo-open",
  "echo-end": "echo-end",
  "grove-open": "grove-open",
  "crater-open": "crater-open",
  "lake-open": "lake-open",
  "grave-open": "grave-open",
  "waste-open": "waste-open",
  "ridge-open": "ridge-open",
  "spire-open": "spire-open",
  "fen-open": "fen-open",
  "hollow-open": "hollow-open",
  "vault-open": "vault-open",
  "vault-end": "vault-end",
};

function CoordsHud() {
  const [txt, setTxt] = useState("");
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!live.showCoords) {
        setTxt("");
        return;
      }
      setTxt(`${live.x.toFixed(1)}, ${live.y.toFixed(2)}, ${live.z.toFixed(1)}`);
    }, 120);
    return () => window.clearInterval(id);
  }, []);
  if (!txt) return null;
  return (
    <p className="pointer-events-none absolute bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-md bg-black/70 px-2 py-1 font-mono text-[11px] text-[#6ad0e8]">
      {txt}
    </p>
  );
}

export function OverworldScreen() {
  const worldId = useGame((s) => s.currentWorld);
  const defeated = useGame((s) => (worldId ? (s.defeated[worldId] ?? []) : []));
  const collected = useGame((s) => (worldId ? (s.collected[worldId] ?? []) : []));
  const resumeAt = useGame((s) => s.resumeAt);
  const hp = useGame((s) => s.hp);
  const xp = useGame((s) => s.xp);
  const startEncounter = useGame((s) => s.startEncounter);
  const collectCrystal = useGame((s) => s.collectCrystal);
  const clearWorld = useGame((s) => s.clearWorld);
  const leaveOverworld = useGame((s) => s.leaveOverworld);
  const outfit = useGame((s) => s.outfit);
  const heartsExtra = useGame((s) => s.heartsExtra ?? 0);
  const coins = useGame((s) => s.coins);
  const heroName = useGame((s) => s.heroName);
  const metNpcs = useGame((s) => s.metNpcs);
  const markMetNpc = useGame((s) => s.markMetNpc);
  const cleared = useGame((s) => s.worldsCleared);
  const hasSword = useGame((s) => s.hasSword);
  const hasAxe = useGame((s) => s.hasAxe);
  const hasBow = useGame((s) => s.hasBow);
  const hasShield = useGame((s) => s.hasShield);
  const hasSling = useGame((s) => s.hasSling);
  const hasBoom = useGame((s) => s.hasBoom);
  const hasBombs = useGame((s) => s.hasBombs);
  const buyHearts = useGame((s) => s.buyHearts);
  const buyShield = useGame((s) => s.buyShield);
  const buyQuiver = useGame((s) => s.buyQuiver);
  const buyBombBag = useGame((s) => s.buyBombBag);
  const buySeedBag = useGame((s) => s.buySeedBag);
  const buyGoldQuiver = useGame((s) => s.buyGoldQuiver);
  const buyWallet = useGame((s) => s.buyWallet);
  const buyHorseFeed = useGame((s) => s.buyHorseFeed);
  const horseFeed = useGame((s) => s.horseFeed ?? 0);
  const sellGood = useGame((s) => s.sellGood);
  const wood = useGame((s) => s.wood);
  const holding = useGame((s) => s.holding);
  const holdTool = useGame((s) => s.holdTool);
  const mushrooms = useGame((s) => s.mushrooms);
  const apples = useGame((s) => s.apples);
  const arrows = useGame((s) => s.arrows);
  const arrowsMax = useGame((s) => s.arrowsMax);
  const bombs = useGame((s) => s.bombs);
  const bombsMax = useGame((s) => s.bombsMax);
  const seeds = useGame((s) => s.seeds);
  const rocks = useGame((s) => s.rocks);
  const seedsMax = useGame((s) => s.seedsMax);
  const coinsMax = useGame((s) => s.coinsMax);
  const hasOcarina = useGame((s) => s.hasOcarina);
  const hasCompass = useGame((s) => s.hasCompass);
  const hasPole = useGame((s) => s.hasPole);
  const fish = useGame((s) => s.fish);
  const cooked = useGame((s) => s.cooked);
  const eatFish = useGame((s) => s.eatFish);
  const eatCooked = useGame((s) => s.eatCooked);
  const rentInn = useGame((s) => s.rentInn);
  const eatMeal = useGame((s) => s.eatMeal);
  const innRoom = useGame((s) => s.innRoom);
  const hasHorse = useGame((s) => s.hasHorse);
  const horseName = useGame((s) => s.horseName);
  const setHorseName = useGame((s) => s.setHorseName);
  const songs = useGame((s) => s.songs);
  const learnSong = useGame((s) => s.learnSong);
  const eatMushroom = useGame((s) => s.eatMushroom);
  const eatApple = useGame((s) => s.eatApple);
  const startHeartQuiz = useGame((s) => s.startHeartQuiz);
  const addApple = useGame((s) => s.addApple);
  const muted = useGame((s) => s.muted);
  const combat = useGame((s) => s.combat);
  const doorQuiz = useGame((s) => s.doorQuiz);
  const [pack, setPack] = useState(false);
  const [coach, setCoach] = useState(false);
  const [musicVol, setMusicVol] = useState(getMusicMix);
  const [sfxVol, setSfxVol] = useState(getSfxMix);
  const [talkVol, setTalkVol] = useState(getTalkMix);
  const [saved, setSaved] = useState(false);
  const [whisper, setWhisper] = useState("");
  const [keys, setKeys] = useState(0);
  const [near, setNear] = useState<string | null>(null);
  const [horse, setHorse] = useState(false);
  const [horseStam, setHorseStam] = useState(1);
  const [horseTired, setHorseTired] = useState(false);
  const [riding, setRiding] = useState(false);
  const [nameHorse, setNameHorse] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);
  const [horseDraft, setHorseDraft] = useState("");
  const [buddy, setBuddy] = useState(false);
  const [padUi, setPadUi] = useState(false);
  const [door, setDoor] = useState(false);
  const [chest, setChest] = useState(false);
  const [chestLocked, setChestLocked] = useState(false);
  const [shop, setShop] = useState(false);
  const [innDesk, setInnDesk] = useState(false);
  const [eatery, setEatery] = useState(false);
  const [inside, setInside] = useState(false);
  const [stall, setStall] = useState(false);
  const [bed, setBed] = useState<string | null>(null);
  const [chair, setChair] = useState(false);
  const [carry, setCarry] = useState(false);
  const [song, setSong] = useState(false);
  const [tune, setTune] = useState("");
  const [songOk, setSongOk] = useState<string | null>(null);
  const [aim, setAim] = useState(false);
  const [locked, setLocked] = useState(false);
  const [altar, setAltar] = useState(false);
  const [shake, setShake] = useState(false);
  const [pickShroom, setPickShroom] = useState(false);
  const [pitExit, setPitExit] = useState(false);
  const [dungeonExit, setDungeonExit] = useState(false);
  const [nearRuby, setNearRuby] = useState(false);
  const [songGate, setSongGate] = useState(false);
  const [swim, setSwim] = useState(false);
  const [under, setUnder] = useState(false);
  const [hurtFlash, setHurtFlash] = useState(0);
  const [wakeFade, setWakeFade] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [bossTitle, setBossTitle] = useState<string | null>(null);
  const [bossBig, setBossBig] = useState(false);
  const [bossHp, setBossHp] = useState(0);
  const [bossMax, setBossMax] = useState(0);
  const [reel, setReel] = useState<{ id: string; beat: number } | null>(null);
  const [reelFade, setReelFade] = useState(false);
  const lastArea = useRef("field");
  const lastMusic = useRef<string>("");
  const bannerT = useRef<number | undefined>(undefined);
  const gems = useGame((s) => s.gems);
  const [talkId, setTalkId] = useState<string | null>(null);
  const [letter, setLetter] = useState<{ from: string; lines: string[] } | null>(null);
  const [mailBox, setMailBox] = useState(false);
  const [mailReady, setMailReady] = useState(false);
  const [mailSend, setMailSend] = useState(false);
  const [writeBack, setWriteBack] = useState<null | "ask" | "compose">(null);
  const [draft, setDraft] = useState("");
  const [composeTo, setComposeTo] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [askAgain, setAskAgain] = useState(false);
  const [againYes, setAgainYes] = useState(true);
  const [got, setGot] = useState<GetId | null>(null);
  const waitClimb = useRef<string | null>(null);
  const [clock, setClock] = useState("");
  const [dinePhase, setDinePhase] = useState<string | null>(null);
  const [dineWait, setDineWait] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [partyText, setPartyText] = useState("");
  const [sidePick, setSidePick] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [chatBack, setChatBack] = useState("");
  const signRef = useRef<HTMLCanvasElement | null>(null);
  const signDraw = useRef(false);

  useEffect(() => {
    setPadUi(isPad());
    live.paused = false;
    live.talking = false;
    live.doorMath = false;
    live.sit = false;
    live.bedLie = false;
    live.sleepPhase = "";
    live.dine = null;
    live.chestOpen = null;
    live.wantPause = false;
    live.coachOn = false;
    live.hint = "";
    if (COMPLETE_SAVE) {
      const kit = completeGamePatch();
      useGame.setState(kit);
      live.holding = kit.holding ?? "sword";
      live.hasSword = true;
      live.hasShield = true;
      live.hasHorse = true;
    } else if (TEST_ALL_GEAR) {
      const kit = testGearPatch();
      useGame.setState(kit);
      live.holding = kit.holding ?? "boom";
      live.hasSword = true;
      live.hasShield = true;
    }
  }, []);

  useEffect(() => {
    if (!coach) return;
    live.paused = true;
    live.coachOn = true;
    return () => {
      live.coachOn = false;
      if (!pack) live.paused = false;
    };
  }, [coach, pack]);

  useEffect(() => {
    if (!worldId) return;
    lastMusic.current = "";
    setScene({
      bed: combat ? "battle" : isDungeon(worldId) ? "dungeon" : worldId === "keep" ? "keep" : live.mounted ? "ride" : "field",
      night: live.dusk,
      combat: combat ? 0.7 : 0,
    });
  }, [worldId, combat]);



  useEffect(() => {
    const t = window.setInterval(() => {
      if (live.hint) {
        const msg = padHint(live.hint);
        live.hint = "";
        setWhisper(msg);
        window.setTimeout(() => setWhisper(""), 2800);
      }
      setKeys(live.keys);
      setNear(live.nearNpc);
      setHorse(live.nearHorse || live.mounted);
      setRiding(live.mounted);
      setNameHorse(live.nameHorse);
      setBuddy(live.ashFollow);
      setHorseStam(live.horseStam);
      setHorseTired(live.horseTired);
      setDoor(Boolean(live.nearHouse || live.nearCave || live.nearGate || (live.house && live.nearExit)));
      setChest(Boolean(live.nearChest));
      setChestLocked(live.chestLocked);
      setShop(live.house === "shop");
      setInnDesk(live.house === "inn" && live.innFloor === 0 && !live.innInRoom && !live.bed);
      setEatery(false);
      setClock(formatClock());
      setDinePhase(live.dine?.phase ?? null);
      setDineWait(live.dine?.t ?? 0);
      setMenuOpen(live.menuOpen);
      if (live.dine && (live.dine.phase === "host" || live.dine.phase === "drink" || live.dine.phase === "askok" || live.dine.phase === "return" || live.dine.phase === "check" || live.dine.phase === "sign")) {
        live.talking = true;
      }
      setInside(Boolean(live.house));
      setStall(live.nearStall);
      setBed(live.bed || live.nearBed);
      setChair(live.sit || live.nearChair);
      setCarry(live.heldRock || live.heldWood);
      setSong(live.ocarina);
      setTune(live.songBuf);
      setSongOk(live.songOk);
      setAim(Boolean(live.hover || live.lock));
      setLocked(Boolean(live.lock));
      setAltar(Boolean(live.nearAltar));
      setShake(live.nearApple);
      setMailBox(live.nearMail);
      setMailReady(live.mailReady);
      setMailSend(live.mailSend);
      if (live.pendingLetter && live.letter) {
        live.pendingLetter = false;
        setLetter(live.letter);
        live.letter = null;
        setTalkId("__letter__");
        setPage(0);
        setAskAgain(false);
        live.talking = true;
      }
      setPickShroom(live.nearShroom);
      setPitExit(live.nearPitExit);
      setDungeonExit(live.nearDungeonExit);
      setNearRuby(live.nearRuby);
      setSongGate(live.nearSongGate);
      setSwim(live.swim);
      setUnder(live.under);
      setHurtFlash(live.heroFlash);
      setWakeFade(
        Math.max(
          live.sleepFade,
          live.jail.fade,
          live.passedOut
            ? Math.min(1, live.wakeT / 0.4)
            : live.wakeHome
              ? Math.max(0, 1 - (live.wakeT - 1.15) / 0.85)
              : 0,
        ),
      );
      setBossTitle(live.bossTitle);
      setBossBig(live.bossTitleT > 0.05 || live.rookFight);
      setBossHp(live.bossHp);
      setBossMax(live.bossMax);
      if (live.rookFight) {
        live.talking = false;
        live.talkNpc = null;
        live.pendingTalk = null;
        setTalkId(null);
        setAskAgain(false);
        setWriteBack(null);
        stopSpeech();
      }
      const place =
        live.area === "village" ? VILLAGE_NAME : "";
      if (place !== lastArea.current) {
        lastArea.current = place;
        if (place) {
          setBanner(place);
          window.clearTimeout(bannerT.current);
          bannerT.current = window.setTimeout(() => setBanner(null), 4200);
        } else {
          setBanner(null);
        }
      }
      if (live.wantPause) {
        live.wantPause = false;
        if (pack) {
          live.paused = false;
          clearQueuedInput();
          setPack(false);
        } else {
          live.paused = true;
          setPack(true);
          clearQueuedInput();
        }
      }
      if (live.openPack) {
        live.openPack = false;
        live.paused = true;
        setPack(true);
        clearQueuedInput();
      }
      if (live.story) {
        if (lastMusic.current !== "none") {
          lastMusic.current = "none";
          playTheme("none");
        }
      } else if (live.ocarina || live.talking) {
        setMusicDuck(true);
      } else if (!combat) {
        setMusicDuck(false);
        const pondD = Math.hypot(live.x - POND.x, live.z - POND.z);
        const water = Math.max(0, 1 - pondD / 28);
        const fire = live.sitAt?.warm || live.cookT > 0 ? 1 : live.area === "village" ? 0.15 : 0;
        const combatN = live.rookFight || live.aggroIds.size > 0 ? Math.min(1, 0.45 + live.aggroIds.size * 0.18) : 0;
        const indoor = Boolean(live.house);
        let bed: Parameters<typeof setScene>[0]["bed"] = "field";
        if (live.cookT > 0) bed = "cook";
        else if (live.chamber) bed = "chamber";
        else if (combatN > 0) bed = live.rookFight ? "boss" : "battle";
        else if (live.house === "shop" || live.nearStall) bed = "shop";
        else if (live.area === "village") bed = "town";
        else if (worldId === "keep") bed = "keep";
        else if (worldId === "grove" || worldId === "hollow") bed = "forest";
        else if (worldId && isDungeon(worldId)) bed = "dungeon";
        else if (live.mounted) bed = "ride";
        else bed = "field";
        setScene({
          bed,
          night: live.dusk,
          water,
          fire,
          indoor,
          combat: combatN,
        });
        lastMusic.current = bed;
      }
      if (live.getItem) setGot(live.getItem as GetId);
      if (live.storyCue && !live.story) {
        live.story = live.storyCue;
        const id = live.storyCue;
        live.storyCue = null;
        setReel({ id, beat: 0 });
      }
      if (live.pendingTalk && !live.rookFight) {
        const id = live.pendingTalk;
        live.pendingTalk = null;
        live.talkNpc = id;
        live.talking = true;
        if (id === "tuck") {
          const g = useGame.getState();
          if ((g.metNpcs ?? []).includes("tuck") && (g.coinsMax ?? 100) < 200 && g.coins >= 100) {
            g.buyWallet();
          }
        }
        const climber = npcById(id)?.chore === "pick";
        live.climbed = !climber;
        if (climber) waitClimb.current = id;
        else {
          setTalkId(id);
          setPage(0);
          setAskAgain(false);
          setAgainYes(true);
        }
      }
      if (waitClimb.current && live.climbed) {
        setTalkId(waitClimb.current);
        waitClimb.current = null;
        setPage(0);
        setAskAgain(false);
        setAgainYes(true);
      }
    }, 120);
    return () => {
      window.clearInterval(t);
      live.talking = false;
      live.talkNpc = null;
      live.climbed = false;
      live.nearNpc = null;
      live.pendingTalk = null;
      live.getItem = null;
      stopSpeech();
    };
  }, []);

  const who = talkId && talkId !== "__letter__" ? npcById(talkId) : undefined;
  const lines =
    talkId === "__letter__" && letter
      ? letter.lines.map((text) => ({ speaker: letter.from, text }))
      : who
        ? who.lines({
            name: cleanName(heroName),
            cleared,
            met: metNpcs,
            hasOcarina,
            hasHorse,
            songs: songs ?? [],
            coins,
            coinsMax: coinsMax ?? 100,
            quests: useGame.getState().quests ?? {},
            mushrooms: useGame.getState().mushrooms ?? 0,
            wood: useGame.getState().wood ?? 0,
          }).concat(extraTalk(who.id, cleanName(heroName)))
        : [];

  function endTalk() {
    if (talkId === "mira") {
      addApple();
      revealItem("apple");
      sfx.pick();
      setWhisper("Mira gave you an apple. Backpack — eat it for a heart.");
    }
    setTalkId(null);
    setLetter(null);
    setPage(0);
    setAskAgain(false);
    setWriteBack(null);
    setDraft("");
    setComposeTo(null);
    live.talking = false;
    live.talkNpc = null;
    stopSpeech();
    if (
      talkId === "rook" &&
      live.night &&
      useGame.getState().hasSword &&
      !(useGame.getState().defeated.meadow ?? []).includes("rook") &&
      !live.rookFight
    ) {
      live.rookFight = true;
      live.bossTitle = "ROOK";
      live.bossTitleT = 7.2;
      live.hint = "Hit him or F. Prove the number. R holds your shield.";
      sfx.kingFall();
    }
  }

  function advanceTalk() {
    if (!talkId || (!who && talkId !== "__letter__")) return;
    if (live.flyover) return;
    sfx.select();
    if (askAgain) {
      if (againYes) {
        setPage(0);
        setAskAgain(false);
        return;
      }
      endTalk();
      return;
    }
    if (page + 1 < lines.length) {
      setPage(page + 1);
      return;
    }
    markMetNpc(talkId);
    if (talkId === "ash") {
      const q = useGame.getState().quests.ash ?? 0;
      const huntDone = (useGame.getState().defeated.meadow ?? []).includes("ash-hunt");
      const groveDone = useGame.getState().worldsCleared.includes("grove");
      if (groveDone && q >= 5) {
        live.hint = "Ash stays in Oakstead.";
      } else if (q < 1) {
        useGame.getState().setQuest("ash", 1);
        live.hint = "Go in Ash’s hall. He has a sword for you.";
      } else if (q === 1) {
        live.hint = "Hit the dummies. V slashes. Hold V to spin.";
      } else if (q === 2) {
        live.dinner = { who: "ash", hour: 18.5, arrived: false, left: false };
        live.hint = padUi ? "Ash walks with you to Pell’s." : "Ash will walk with you to Pell’s.";
      } else if (q === 3 && !huntDone) {
        useGame.getState().setQuest("ash", 4);
        live.ashHunt = true;
        live.hint = "Ash is with you. West of town. Ring of stones.";
      }
    }
    if (
      talkId === "rook" &&
      live.night &&
      useGame.getState().hasSword &&
      !(useGame.getState().defeated.meadow ?? []).includes("rook") &&
      !live.rookFight
    ) {
      endTalk();
      return;
    }
    const taught = TEACH[talkId];
    if (taught && hasOcarina) {
      if (taught === "horse" && !hasHorse) {
        /* wait */
      } else {
        learnSong(taught);
      }
    }
    if (talkId === "__letter__") {
      const npc = npcIdFromName(letter?.from ?? "");
      setComposeTo(npc);
      setWriteBack("ask");
      setAgainYes(true);
      return;
    }
    setAskAgain(true);
    setAgainYes(true);
  }

  useEffect(() => {
    if (!talkId) return;
    const onKey = (e: KeyboardEvent) => {
      if (writeBack === "compose") return;
      if (
        (askAgain || writeBack === "ask") &&
        (e.code === "KeyW" || e.code === "ArrowUp" || e.code === "KeyS" || e.code === "ArrowDown")
      ) {
        e.preventDefault();
        sfx.select();
        setAgainYes((v) => !v);
        return;
      }
      if (writeBack === "ask" && (e.code === "Space" || e.code === "Enter" || e.code === "KeyA")) {
        e.preventDefault();
        sfx.select();
        if (againYes) {
          setWriteBack("compose");
          setDraft("");
        } else endTalk();
        return;
      }
      if (e.code === "Space" || e.code === "Enter" || e.code === "KeyA") {
        e.preventDefault();
        advanceTalk();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [talkId, page, lines.length, askAgain, againYes, writeBack, letter]);

  useEffect(() => {
    if (!got) return;
    const go = () => {
      live.getItem = null;
      setGot(null);
    };
    const auto = window.setTimeout(go, 3000);
    return () => {
      window.clearTimeout(auto);
    };
  }, [got]);

  useEffect(() => {
    if (!reel) return;
    live.story = reel.id;
    setReelFade(false);
    playTheme("none");
    const cards = STORY_REELS[reel.id] ?? KING_INTRO;
    const show = window.setTimeout(() => setReelFade(true), 80);
    const hide = window.setTimeout(() => setReelFade(false), 7200);
    const next = window.setTimeout(() => {
      if (reel.beat >= cards.length - 1) {
        const met = STORY_MET[reel.id];
        if (met) markMetNpc(met);
        live.story = null;
        setReel(null);
        if (reel.id === "king-fall" && worldId === "keep") {
          setWhisper("Walk into the light. Green Forest is first.");
          const cleared = useGame.getState().worldsCleared;
          if (!cleared.includes("keep")) useGame.setState({ worldsCleared: [...cleared, "keep"] });
          live.warp = { x: 0, z: -12.2, to: "grove" };
          live.hint = "Walk into the light. Green Forest is first.";
          playTheme("keep");
        } else if (reel.id === "false-dawn") {
          live.hint = "He took the light. Go in the castle.";
          playTheme("keep");
        } else if (reel.id === "echo-end" && worldId === "echo") {
          setWhisper("The leftover split again. Proof Ridge is first.");
          const cleared = useGame.getState().worldsCleared;
          if (!cleared.includes("echo")) useGame.setState({ worldsCleared: [...cleared, "echo"] });
          live.hint = "Walk into the light. Proof Ridge is first.";
          playTheme("dungeon");
        } else if (reel.id === "vault-end" && worldId === "vault") {
          setWhisper("The last scrap of magic is gone.");
          window.setTimeout(() => clearWorld("vault"), 2200);
        } else if (worldId === "keep") playTheme("keep");
        else if (worldId && isDungeon(worldId)) playTheme("dungeon");
        else playTheme("field");
        return;
      }
      setReel((r) => (r ? { ...r, beat: r.beat + 1 } : r));
    }, 8600);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
      window.clearTimeout(next);
    };
  }, [reel, worldId, markMetNpc, clearWorld]);

  const line = lines[page];
  const flewRef = useRef(false);
  useEffect(() => {
    flewRef.current = false;
  }, [talkId]);
  useEffect(() => {
    if (talkId !== "mira" || !line || askAgain) return;
    if (flewRef.current || live.flyover || live.wantFly) return;
    if (!/shrine/i.test(line.text)) return;
    flewRef.current = true;
    live.wantFly = true;
  }, [talkId, page, line?.text, askAgain]);
  useEffect(() => {
    const written = who?.kind === "sign" || who?.kind === "note";
    if (line && !askAgain && !muted && !written) speakLine(line.speaker, line.text);
    else stopSpeech();
    return () => stopSpeech();
  }, [talkId, page, line?.text, line?.speaker, muted, askAgain, who?.kind]);

  if (!worldId) return null;
  const meta = WORLD_META[worldId];
  const maxHp = playerMaxHp(xp, outfit, heartsExtra);

  const hooks: WorldHooks = {
    onEncounter: (encounter, at) =>
      startEncounter(encounter, at, live.spinning ? "spin" : live.jumpAtk ? "jump" : "slash"),
    onCollect: (id) => collectCrystal(worldId, id),
    onGate: () => {
      const gem = gemForWorld(worldId);
      if (gem && !useGame.getState().gems[gem]) {
        useGame.getState().grantGem(gem);
        revealItem(gem);
        window.setTimeout(() => clearWorld(worldId), 4200);
        return;
      }
      if (worldId === "keep") {
        setWhisper("Walk into the light. Green Forest is first.");
        window.setTimeout(() => clearWorld(worldId), 2800);
        return;
      }
      if (worldId === "echo") {
        setWhisper("The leftover split again. Proof Ridge is first.");
        const cleared = useGame.getState().worldsCleared;
        if (!cleared.includes("echo")) useGame.setState({ worldsCleared: [...cleared, "echo"] });
        return;
      }
      if (worldId === "vault") {
        setWhisper("The last scrap is gone. The horse is in the meadow.");
        window.setTimeout(() => clearWorld(worldId), 4200);
        return;
      }
      setWhisper("The field is proven. The stone remembers.");
      clearWorld(worldId);
    },
  };

  return (
    <div className="relative h-full w-full bg-[#c5d8ea]">
      {worldId ? (
        <WorldCanvas
          worldId={worldId}
          defeated={defeated}
          collected={collected}
          spawn={resumeAt}
          hooks={hooks}
          paused={pack || Boolean(reel) || coach || Boolean(talkId)}
        />
      ) : null}
      {coach && !talkId && !pack ? (
        <div
          className="absolute inset-0 z-[80] flex items-center justify-center bg-black/60 px-4"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCoach(false);
            live.coachOn = false;
            live.paused = false;
          }}
        >
          <div className="max-w-md rounded-xl border-2 border-[#c9a227]/70 bg-[#1a1410] px-5 py-5 text-[#f6f1e6] shadow-xl">
            <p className="text-[11px] tracking-[0.2em] text-[#e8d48a] uppercase">{got ? GETS[got as GetId]?.title ?? "You got it" : "New tool"}</p>
            <p className="mt-2 text-sm leading-relaxed">{got ? GETS[got as GetId]?.blurb : "Open the backpack to hold it."}</p>
            <button
              type="button"
              className="mt-4 min-h-12 w-full rounded-md bg-[#c9a227] px-3 py-3 text-base font-semibold text-[#1a1410]"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
      {under ? <div className="pointer-events-none absolute inset-0 z-20 bg-[#16384a]/50" /> : null}
      {reel ? (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/82 px-8 pb-[18vh] pt-16">
          <div
            className="max-w-xl text-center transition-opacity duration-700"
            style={{ opacity: reelFade ? 1 : 0 }}
          >
            <p className="text-[11px] tracking-[0.28em] text-[#c9a227] uppercase">
              {(STORY_REELS[reel.id] ?? KING_INTRO)[reel.beat]?.kicker}
            </p>
            {(() => {
              const card = (STORY_REELS[reel.id] ?? KING_INTRO)[reel.beat];
              if (card?.vid || card?.img) {
                return <StoryShot kind={shotFromVid(card.vid, card.kicker)} />;
              }
              if (reel.id === "king-intro" || reel.id === "false-dawn") {
                return <StoryShot kind="king" />;
              }
              return null;
            })()}
            {((STORY_REELS[reel.id] ?? KING_INTRO)[reel.beat]?.lines ?? []).map((ln) => (
              <p key={ln} className="font-display mt-4 text-xl leading-relaxed text-[#f6f1e6] sm:text-2xl">
                {talk(ln, heroName)}
              </p>
            ))}
          </div>
        </div>
      ) : null}
      {hurtFlash > 0.04 ? (
        <div
          className="pointer-events-none absolute inset-0 z-30"
          style={{ background: `rgba(170, 12, 8, ${Math.min(0.58, hurtFlash * 0.62)})` }}
        />
      ) : null}
      {locked ? (
        <div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
          <div
            className="absolute left-1/2 top-[32%] -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "26px solid transparent",
              borderRight: "26px solid transparent",
              borderTop: "42px solid #ffe44a",
              filter: "drop-shadow(0 0 14px #ffe44acc)",
            }}
          />
          <div
            className="absolute left-1/2 top-[34%] -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "14px solid transparent",
              borderRight: "14px solid transparent",
              borderTop: "22px solid #fff8b0",
            }}
          />
        </div>
      ) : null}
      {wakeFade > 0.02 ? (
        <div
          className="pointer-events-none absolute inset-0 z-50 bg-black"
          style={{ opacity: wakeFade }}
        />
      ) : null}
      <div className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] ${pack ? "hidden" : ""}`}>
        <div className="panel pointer-events-auto max-w-[70%] rounded-lg px-3 py-2">
          <p className="text-[11px] tracking-wide text-[#e8d48a] uppercase">{meta.region}</p>
          <p className="font-display text-lg leading-tight font-semibold">{meta.name}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div
            className={`panel pointer-events-auto cursor-pointer rounded-lg px-3 py-2 transition-all ${hudOpen ? "" : "scale-[0.82] origin-top-right opacity-90"}`}
            onClick={() => {
              sfx.select();
              setHudOpen((o) => !o);
            }}
            title="Tap to size the HUD"
          >
            <Hearts hp={hp} max={maxHp} extra={heartsExtra} size={hudOpen ? 15 : 11} />
            {hudOpen ? (
              <>
            <div className="mt-2 flex justify-end">
              <GemRow gems={gems} />
            </div>
            <div className="mt-2 flex items-center justify-end gap-2">
              <Rupees n={coins} max={coinsMax ?? 100} />
              {clock ? <span className="text-xs tabular text-[#e8d48a]">{clock}</span> : null}
              {hasCompass ? <CompassRose /> : null}
              {keys > 0 ? <span className="text-xs text-[#e8d48a]">Key ×{keys}</span> : null}
              {hasSword && !padUi ? <span className="text-xs text-[#e8d48a]">V · Sword · 1</span> : null}
              {hasBombs && !padUi ? <span className="text-xs text-[#e8d48a]">B · Bomb</span> : null}
              {hasShield && !padUi ? <span className="text-xs text-[#e8d48a]">R · Shield · 2</span> : null}
              {holding === "bow" ? <span className="text-xs text-[#e8d48a]">Arrows {arrows ?? 0}/{arrowsMax ?? 20}</span> : null}
              {holding === "sling" ? <span className="text-xs text-[#e8d48a]">Seeds {seeds ?? 0}/{seedsMax ?? 20}</span> : null}
              {holding === "bomb" ? <span className="text-xs text-[#e8d48a]">Bombs {bombs ?? 0}/{bombsMax ?? 20}</span> : null}
              {holding === "boom" && !padUi ? <span className="text-xs text-[#e8d48a]">B · Boomerang</span> : null}
              {carry && !padUi ? <span className="text-xs text-[#e8d48a]">{live.heldWood ? "Z · Wood" : "Z · Rock"}</span> : null}
              {hasOcarina && !padUi ? <span className="text-xs text-[#e8d48a]">O · Flute</span> : null}
              {buddy ? <span className="text-xs text-[#c8e8a0]">Ash is with you</span> : null}
              {aim && !padUi ? <span className="text-xs text-[#e8d48a]">L · Target</span> : null}
            </div>
              </>
            ) : (
              <div className="mt-1 flex items-center justify-end gap-2">
                <Rupees n={coins} max={coinsMax ?? 100} />
                {clock ? <span className="text-[10px] tabular text-[#e8d48a]">{clock}</span> : null}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="pointer-events-auto min-h-11 border-2 border-[#c9a227]/70 bg-[#1a1410] px-4 text-[#f6f1e6] shadow-md hover:bg-[#2a2218]"
            onPointerDown={() => {
              try {
                sfx.select();
              } catch {
                /* ignore */
              }
              if (pack) {
                live.paused = false;
                clearQueuedInput();
                setPack(false);
                return;
              }
              live.paused = true;
              setPack(true);
            }}
          >
            Backpack
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="pointer-events-auto min-h-11 border-2 border-[#c9a227]/70 bg-[#1a1410] px-4 text-[#f6f1e6] shadow-md hover:bg-[#2a2218]"
            onClick={() => {
              sfx.map();
              leaveOverworld();
            }}
          >
            Map
          </Button>
        </div>
      </div>
      <div className="pointer-events-none absolute right-4 bottom-24 z-30">
        <QuestWhisper text={whisper} />
      </div>

      {banner ? (
        <div className="pointer-events-none absolute inset-x-0 top-24 z-40 text-center">
          <p className="font-display text-5xl tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            {banner}
          </p>
        </div>
      ) : null}
      {bossTitle ? (
        <div className="pointer-events-none absolute inset-x-0 top-[4.6rem] z-40 flex flex-col items-center">
          <p
            className="font-display tracking-tight text-[#f6f1e6] drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]"
            style={{ fontSize: bossBig ? "2.7rem" : "1.15rem" }}
          >
            {bossTitle}
          </p>
          {bossMax > 0 ? (
            <div className="mt-2 h-3 w-[min(72vw,22rem)] overflow-hidden rounded-sm border border-[#1a1410] bg-[#1a1410]/80">
              <div
                className="h-full bg-[#a42828]"
                style={{ width: `${Math.max(0, Math.min(100, (bossHp / bossMax) * 100))}%` }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {pack ? (
        <Backpack
          onClose={() => {
            sfx.select();
            live.paused = false;
            clearQueuedInput();
            setPack(false);
          }}
        />
      ) : null}
      {altar && !talkId ? (
        <button
          type="button"
          className="talk-prompt prompt-lift pointer-events-auto absolute left-1/2 z-30 -translate-x-1/2 rounded-md px-4 py-2"
          onClick={() => queueTalk()}
        >
          Place gem{padUi ? "" : " · F"}
        </button>
      ) : chair && !talkId && !bed ? (
        <button
          type="button"
          className="talk-prompt prompt-lift pointer-events-auto absolute left-1/2 z-30 -translate-x-1/2 rounded-md px-4 py-2"
          onClick={() => queueTalk()}
        >
          {live.sit ? (padUi ? "Get up" : "Get up · F") : padUi ? "Sit" : "Sit · F"}
        </button>
      ) : bed && !talkId && !live.sleepPhase ? (
        <button
          type="button"
          className="talk-prompt prompt-lift pointer-events-auto absolute left-1/2 z-30 -translate-x-1/2 rounded-md px-4 py-2"
          onClick={() => queueTalk()}
        >
          {padUi ? (live.bed ? "Get up" : live.nearBed === "top" ? "Climb up" : "Sleep") : live.bed ? "Get up · F" : live.nearBed === "top" ? "Climb up · F" : "Sleep · F"}
        </button>
      ) : nearRuby && !talkId ? (
        <button
          type="button"
          className="talk-prompt prompt-lift pointer-events-auto absolute left-1/2 z-30 -translate-x-1/2 rounded-md bg-[#1a1410]/90 px-6 py-3 text-lg font-semibold text-[#efe6d4] shadow-lg"
          onClick={() => queueTalk()}
        >
          Take the Ruby{padUi ? "" : " · F"}
        </button>
      ) : dungeonExit && !talkId ? (
        <button
          type="button"
          className="talk-prompt prompt-lift pointer-events-auto absolute left-1/2 z-30 -translate-x-1/2 rounded-md bg-[#1a1410]/90 px-6 py-3 text-lg font-semibold text-[#efe6d4] shadow-lg"
          onClick={() => queueTalk()}
        >
          Leave{padUi ? "" : " · F"}
        </button>
      ) : pitExit && !talkId ? (
        <button
          type="button"
          className="talk-prompt prompt-lift pointer-events-auto absolute left-1/2 z-30 -translate-x-1/2 rounded-md bg-[#1a1410]/90 px-6 py-3 text-lg font-semibold text-[#efe6d4] shadow-lg"
          onClick={() => queueTalk()}
        >
          {padUi ? "Climb" : "Hit F to climb — then math"}
        </button>
      ) : pickShroom && !talkId ? (
        <button
          type="button"
          className="talk-prompt prompt-lift pointer-events-auto absolute left-1/2 z-30 -translate-x-1/2 rounded-md bg-[#1a1410]/90 px-6 py-3 text-lg font-semibold text-[#efe6d4] shadow-lg"
          onClick={() => queueTalk()}
        >
          {padUi ? "Pick" : "Hit F to pick"}
        </button>
      ) : mailBox && !talkId && !mailSend ? (
        <button
          type="button"
          className="talk-prompt prompt-lift pointer-events-auto absolute left-1/2 z-30 -translate-x-1/2 rounded-md px-4 py-2"
          onClick={() => queueTalk()}
        >
          {mailReady ? (padUi ? "Send a letter" : "Send a letter · F") : padUi ? "Prove the mailbox" : "Prove the mailbox · F"}
        </button>
      ) : near && !talkId && !doorQuiz ? (
        <button
          type="button"
          className="talk-prompt prompt-lift pointer-events-auto absolute left-1/2 z-30 -translate-x-1/2 rounded-md px-4 py-2"
          onClick={() => queueTalk()}
        >
          {npcById(near)?.kind === "stone"
            ? padUi ? "Listen" : "Prove · F, then listen"
            : npcById(near)?.kind === "note"
              ? padUi ? "Read" : "Prove · F, then read"
            : npcById(near)?.kind === "sign"
              ? padUi ? "Read" : "Prove · F, then read"
              : npcById(near)?.kind === "well"
                ? padUi ? "Ask" : "Prove · F, then ask"
            : padUi
                ? "Talk"
                : "Prove · F, then talk"}
        </button>
      ) : shake && !talkId ? (
        <button
          type="button"
          className="talk-prompt prompt-lift pointer-events-auto absolute left-1/2 z-30 -translate-x-1/2 rounded-md bg-[#1a1410]/90 px-6 py-3 text-lg font-semibold text-[#efe6d4] shadow-lg"
          onClick={() => queueTalk()}
        >
          {padUi ? "Shake" : "Hit F to shake"}
        </button>
      ) : door && !talkId ? (
        <button
          type="button"
          className="talk-prompt prompt-lift pointer-events-auto absolute left-1/2 z-30 -translate-x-1/2 rounded-md px-4 py-2"
          onClick={() => queueTalk()}
        >
          {live.nearCave
            ? padUi ? "Enter Addend Cavern" : "Enter Addend Cavern · F"
            : live.nearHouse === "sum-shrine" || live.house === "sum-shrine"
              ? live.house
                ? padUi ? "Leave the shrine" : "Leave the shrine · F"
                : padUi ? "Enter the Sun Shrine" : "Enter the Sun Shrine · F"
              : live.nearHouse === "keep-hall"
                ? padUi ? "Enter the Castle" : "Enter the Castle · F"
                : live.house
                  ? padUi ? "Leave" : "Leave · F"
                  : padUi ? "Open" : "Prove the door · F"}
        </button>
      ) : chest && !talkId ? (
        <button
          type="button"
          className="talk-prompt prompt-lift pointer-events-auto absolute left-1/2 z-30 -translate-x-1/2 rounded-md px-4 py-2"
          onClick={() => queueTalk()}
        >
          {chestLocked ? "You can't open this right now" : padUi ? "Open" : "Prove the chest · F"}
        </button>
      ) : songGate && !talkId && !song ? (
        <button
          type="button"
          className="talk-prompt prompt-lift pointer-events-auto absolute left-1/2 z-30 -translate-x-1/2 rounded-md px-5 py-3 text-base font-semibold"
          onClick={() => {
            if ((songs ?? []).includes("oak")) {
              completeSong("oak");
              sfx.ok();
            } else sfx.miss();
          }}
        >
          {padUi ? "Play Oak’s Song" : "O · play Oak’s Song (A S D A S D)"}
        </button>
      ) : swim && !talkId && !near && !door ? (
        <button
          type="button"
          className="talk-prompt prompt-lift pointer-events-auto absolute left-1/2 z-30 -translate-x-1/2 rounded-md px-5 py-3 text-base font-semibold"
        >
          {under ? (padUi ? "Let go of Talk to come up" : "Let go of F to come up") : padUi ? "Hold Talk to go under" : "Hold F to go under"}
        </button>
      ) : horse && !talkId ? (
        <div className="pointer-events-auto prompt-lift absolute left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2">
          {riding ? (
            <div className="panel rounded-md px-3 py-1.5">
              <p className="text-[10px] tracking-[0.14em] text-[#e8d48a] uppercase">
                {horseTired
                  ? "Spent — walk her"
                  : live.horseRear > 0
                    ? "Whoa"
                    : live.horseBrake
                      ? "Braking"
                      : live.horseJump
                    ? "Jump"
                    : live.horseGallop
                      ? "Gallop"
                      : horseStam < 0.2
                        ? "Winded"
                        : padUi
                          ? "Run · Jump · Brake"
                          : "Slide gallop · Space jump · X brake"}
              </p>
              <div className="mt-1 h-1.5 w-36 overflow-hidden rounded-full bg-[#1a1410]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(horseStam * 100)}%`,
                    background: horseTired ? "#8a6a48" : horseStam < 0.25 ? "#c97848" : "#e8d48a",
                  }}
                />
              </div>
            </div>
          ) : null}
          <button
            type="button"
            className="talk-prompt rounded-md px-4 py-2"
            onClick={() => queueTalk()}
          >
            {live.mounted
              ? padUi
                ? "Dismount"
                : "Dismount · F"
              : !horseName
                ? padUi
                  ? "Name her"
                  : "Name her · F"
                : (apples ?? 0) > 0
                  ? padUi
                    ? "Feed"
                    : "Feed · F"
                  : padUi
                    ? "Ride"
                    : "Ride · F"}
          </button>
        </div>
      ) : null}
      {nameHorse ? (
        <div className="pointer-events-auto sheet-lift absolute left-1/2 z-40 w-[min(92vw,22rem)] -translate-x-1/2">
          <div className="panel rounded-xl px-4 py-3">
            <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">A horse</p>
            <p className="font-display mt-1 text-lg">What do you call her?</p>
            <form
              className="mt-3 flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const n = cleanName(horseDraft) || "Rowan";
                setHorseName(n);
                useGame.getState().grantHorse();
                live.hasHorse = true;
                live.nameHorse = false;
                live.talking = false;
                setNameHorse(false);
                setHorseDraft("");
                revealItem("horse");
                live.hint = `${n} is yours. Ride.`;
                sfx.ok();
              }}
            >
              <input
                value={horseDraft}
                onChange={(ev) => setHorseDraft(ev.target.value)}
                autoFocus
                maxLength={12}
                placeholder="Rowan"
                className="min-h-12 flex-1 rounded-md border border-white/20 bg-[#1a1410] px-3 text-base text-[#efe6d4] outline-none"
              />
              <Button type="submit" size="sm" variant="accent">
                She’s yours
              </Button>
            </form>
          </div>
        </div>
      ) : null}
      {shop ? (
        <div className="pointer-events-auto sheet-lift absolute left-1/2 z-30 w-[min(92vw,22rem)] -translate-x-1/2">
          <div className="panel rounded-xl px-4 py-3">
            <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Oakstead stall</p>
            <p className="mt-1 text-sm text-muted">Hearts, bags, a shield. Oats for the horse. Quiver of gold costs 120.</p>
            <div className="mt-3 flex flex-col gap-2">
              <Button
                size="sm"
                variant="accent"
                onClick={() => {
                  if (buyHearts()) sfx.heal();
                  else sfx.miss();
                }}
              >
                Hearts · 20 rupees
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={hasShield}
                onClick={() => {
                  if (buyShield()) {
                    sfx.equip();
                    revealItem("coin");
                  } else sfx.miss();
                }}
              >
                {hasShield ? "Hero’s Shield · owned" : "Hero’s Shield · 80 rupees"}
              </Button>
              {hasBow ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(arrowsMax ?? 20) >= 80}
                  onClick={() => {
                    if (buyQuiver()) sfx.ok();
                    else sfx.miss();
                  }}
                >
                  {(arrowsMax ?? 20) >= 80 ? "Quiver · max" : `Bigger quiver · 50 · now ${arrowsMax ?? 20}`}
                </Button>
              ) : null}
              {hasBow ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(arrowsMax ?? 20) >= 80}
                  onClick={() => {
                    if (buyGoldQuiver()) sfx.get();
                    else sfx.miss();
                  }}
                >
                  Golden Quiver · 120 · holds 80
                </Button>
              ) : null}
              {hasBombs ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(bombsMax ?? 20) >= 80}
                  onClick={() => {
                    if (buyBombBag()) sfx.ok();
                    else sfx.miss();
                  }}
                >
                  {(bombsMax ?? 20) >= 80 ? "Bomb bag · max" : `Bigger bomb bag · 50 · now ${bombsMax ?? 20}`}
                </Button>
              ) : null}
              {hasSling ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(seedsMax ?? 20) >= 80}
                  onClick={() => {
                    if (buySeedBag()) sfx.ok();
                    else sfx.miss();
                  }}
                >
                  {(seedsMax ?? 20) >= 80 ? "Seed bag · max" : `Bigger seed bag · 40 · now ${seedsMax ?? 20}`}
                </Button>
              ) : null}
              {hasHorse ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={horseFeed >= 2}
                  onClick={() => {
                    if (buyHorseFeed()) {
                      sfx.ok();
                      live.hint =
                        horseFeed >= 1
                          ? "Sweet mash. She can gallop a long way now."
                          : "Oats in her bag. She’ll run longer.";
                      live.horseStam = 1;
                      live.horseTired = false;
                    } else sfx.miss();
                  }}
                >
                  {horseFeed >= 2
                    ? "Horse mash · max"
                    : horseFeed >= 1
                      ? "Sweet mash · 150 · longer gallop"
                      : "Horse oats · 80 · more stamina"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {innDesk && !talkId && !doorQuiz ? (
        <div className="pointer-events-auto sheet-lift absolute left-1/2 z-30 w-[min(92vw,22rem)] -translate-x-1/2">
          <div className="panel rounded-xl px-4 py-3">
            <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Lila’s inn</p>
            <p className="mt-1 text-sm text-muted">Pay, then take the stairs. Your room is the one that opens.</p>
            {innRoom ? <p className="mt-1 text-[11px] text-[#c8b090]">You have room {innRoom}.</p> : null}
            <div className="mt-3 flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (rentInn("hard")) sfx.ok();
                  else sfx.miss();
                }}
              >
                Hard cot · 8 · room 5
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (rentInn("comfy")) sfx.ok();
                  else sfx.miss();
                }}
              >
                Comfy bed · 20 · room 3
              </Button>
              <Button
                size="sm"
                variant="accent"
                onClick={() => {
                  if (rentInn("plush")) sfx.ok();
                  else sfx.miss();
                }}
              >
                Really comfy · 45 · room 1
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {dinePhase && live.house === "eatery" && !talkId && !doorQuiz ? (
        <div className="pointer-events-auto sheet-lift absolute left-1/2 z-30 w-[min(92vw,24rem)] -translate-x-1/2">
          {dinePhase === "host" ? (
            <div className="panel rounded-xl px-4 py-3">
              <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Pell’s table</p>
              <p className="font-display mt-1 text-lg">How many people for?</p>
              <form
                className="mt-3 flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!live.dine) return;
                  const n = parsePartySize(partyText || "2");
                  const all = n >= 6 || Boolean(live.dinner?.all);
                  live.dine.party = n;
                  live.dine.table = pickTableIndex(n, all);
                  const invited = live.dine.guests.length
                    ? live.dine.guests
                    : live.dine.guest && live.dine.guest !== "all"
                      ? [live.dine.guest]
                      : all
                        ? TOWN_PARTY
                        : [];
                  const seats = live.dine.table === 3 ? 5 : live.dine.table === 1 || live.dine.table === 2 ? 3 : 1;
                  live.dine.guests = invited.slice(0, seats);
                  live.dine.phase = "follow";
                  live.talking = false;
                  live.hint =
                    n === 1 && !live.dine.guests.length
                      ? "Okay. Just you. Follow me."
                      : all
                        ? "The long table. Follow me."
                        : `Okay. For ${Math.max(n, live.dine.guests.length + 1)}. Follow me.`;
                  sfx.ok();
                  setPartyText("");
                }}
              >
                <input
                  value={partyText}
                  onChange={(ev) => setPartyText(ev.target.value)}
                  autoFocus
                  placeholder="two, 2, for two people…"
                  className="min-h-12 flex-1 rounded-md border border-white/20 bg-[#1a1410] px-3 text-base text-[#efe6d4] outline-none"
                />
                <Button type="submit" size="sm" variant="accent">
                  Seat us
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    live.dine = null;
                    live.talking = false;
                    live.hint = "Whenever you’re ready.";
                    sfx.ok();
                    setPartyText("");
                  }}
                >
                  Never mind
                </Button>
              </form>
            </div>
          ) : dinePhase === "follow" || dinePhase === "seat" ? (
            <div className="panel rounded-xl px-4 py-3">
              <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Pell</p>
              <p className="mt-1 text-sm">Follow Pell to your seats.</p>
            </div>
          ) : dinePhase === "drink" ? (
            <div className="panel rounded-xl px-4 py-3">
              <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Pell</p>
              <p className="font-display mt-1 text-lg">What will you drink?</p>
              <div className="mt-3 flex flex-col gap-2">
                {(["water", "milk", "tea", "juice"] as const).map((d) => (
                  <Button
                    key={d}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!live.dine) return;
                      live.dine.drink = d;
                      live.dine.phase = "ready";
                      live.dine.t = 0;
                      live.talking = false;
                      live.hint = "Ready to order? Look at the menu.";
                      sfx.ok();
                    }}
                  >
                    {d[0]!.toUpperCase() + d.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          ) : dinePhase === "wait" ? (
            <div className="panel rounded-xl px-4 py-3">
              <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Pell’s table</p>
              <p className="mt-1 text-sm">Look at the menu when you’re ready.</p>
            </div>
          ) : dinePhase === "ready" || dinePhase === "menu" ? (
            <div className="panel rounded-xl px-4 py-3">
              <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Pell</p>
              <p className="font-display mt-1 text-lg">Ready to order?</p>
              <p className="mt-1 text-sm text-muted">H or F to look at the menu. Prove it first.</p>
            </div>
          ) : dinePhase === "kitchen" ? (
            <div className="panel rounded-xl px-4 py-3">
              <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Pell</p>
              <p className="mt-1 text-sm">He’s in the kitchen.</p>
            </div>
          ) : dinePhase === "carry" || dinePhase === "served" ? (
            <div className="panel rounded-xl px-4 py-3">
              <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Pell</p>
              <p className="mt-1 text-sm">He brings the plates and the juice.</p>
            </div>
          ) : dinePhase === "eat" ? (
            <div className="panel rounded-xl px-4 py-3">
              <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Pell’s table</p>
              <p className="mt-1 text-sm">Eat. Fork, bite, drink. Hearts come back.</p>
            </div>
          ) : dinePhase === "askok" ? (
            <div className="panel rounded-xl px-4 py-3">
              <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Pell</p>
              <p className="font-display mt-1 text-lg">Is everything good?</p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => {
                    if (!live.dine) return;
                    live.dine.phase = "eat";
                    live.dine.okT = 0;
                    live.talking = false;
                    live.hint = "Good.";
                    sfx.ok();
                  }}
                >
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!live.dine) return;
                    live.dine.phase = "eat";
                    live.dine.okT = 0;
                    live.talking = false;
                    live.hint = "Pell will check again.";
                    sfx.ok();
                  }}
                >
                  No
                </Button>
              </div>
            </div>
          ) : dinePhase === "return" ? (
            <div className="panel rounded-xl px-4 py-3">
              <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Pell</p>
              <p className="mt-1 text-sm">He’s coming back from the kitchen.</p>
            </div>
          ) : dinePhase === "check" ? (
            <div className="panel rounded-xl px-4 py-3">
              <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Pell</p>
              <p className="font-display mt-1 text-lg">{ashPays() ? "Ash already covered it." : "Want your check yet?"}</p>
              <div className="mt-3 flex gap-2">
                {ashPays() ? (
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => {
                      if (!live.dine) return;
                      live.dine.bill = 0;
                      live.dine.phase = "pay";
                      live.dine.t = 0;
                      live.talking = false;
                      live.hint = "Ash: Don’t worry. I’ve got it.";
                      sfx.ok();
                    }}
                  >
                    Thanks
                  </Button>
                ) : (
                  <>
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => {
                    if (!live.dine) return;
                    live.dine.phase = "sign";
                    live.talking = true;
                    sfx.ok();
                  }}
                >
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!live.dine) return;
                    live.dine.phase = "eat";
                    live.dine.checkT = 0;
                    live.dine.askedCheck = true;
                    live.talking = false;
                    live.hint = "Pell will ask again in a bit.";
                    sfx.ok();
                  }}
                >
                  No
                </Button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {menuOpen && dinePhase === "order" && !doorQuiz ? (
        <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/55 px-4">
          <div className="w-[min(94vw,28rem)] rounded-sm border-4 border-[#5a3d24] bg-[#f4ead2] px-6 py-5 text-[#2a2018] shadow-2xl">
            <p className="text-center text-[11px] tracking-[0.28em] text-[#8a5a28] uppercase">Pell’s table · menu</p>
            <p className="font-display mt-1 text-center text-3xl">Open menu</p>
            <p className="mt-3 text-sm">Mains</p>
            <div className="mt-2 flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                className="justify-between border-[#5a3d24] text-[#2a2018]"
                onClick={() => {
                  if (!live.dine) return;
                  const g = useGame.getState();
                  if (!ashPays() && (g.coins ?? 0) < 24) {
                    sfx.miss();
                    live.hint = "Not enough rupees for steak.";
                    return;
                  }
                  live.dine.food = "steak";
                  live.dine.side = sidePick ?? "fries";
                  live.dine.bill = ashPays() ? 0 : 24 + 4;
                  live.dine.phase = "kitchen";
                  live.dine.t = 0;
                  live.menuOpen = false;
                  live.talking = false;
                  sfx.ok();
                  live.hint = "Pell goes to the kitchen.";
                }}
              >
                <span>Hill steak</span>
                <span>24 · 3 hearts</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="justify-between border-[#5a3d24] text-[#2a2018]"
                onClick={() => {
                  if (!live.dine) return;
                  const g = useGame.getState();
                  if (!ashPays() && (g.coins ?? 0) < 16) {
                    sfx.miss();
                    live.hint = "Not enough rupees for eggs.";
                    return;
                  }
                  live.dine.food = "eggs";
                  live.dine.side = sidePick ?? "toast";
                  live.dine.bill = ashPays() ? 0 : 16 + 4;
                  live.dine.phase = "kitchen";
                  live.dine.t = 0;
                  live.menuOpen = false;
                  live.talking = false;
                  sfx.ok();
                  live.hint = "Pell goes to the kitchen.";
                }}
              >
                <span>Pan eggs</span>
                <span>16 · 2 hearts</span>
              </Button>
            </div>
            <p className="mt-4 text-sm">Side</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["fries", "greens", "toast"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={sidePick === s ? "accent" : "outline"}
                  className={sidePick === s ? "" : "border-[#5a3d24] text-[#2a2018]"}
                  onClick={() => setSidePick(s)}
                >
                  {s === "fries" ? "Fries" : s === "greens" ? "Garden greens" : "Toast"}
                </Button>
              ))}
            </div>
            <p className="mt-4 text-center text-[11px] text-[#6a4a28]">Pick a side, then a main.</p>
          </div>
        </div>
      ) : null}
      {dinePhase === "sign" && live.dine ? (
        <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/55 px-4">
          <div className="w-[min(94vw,28rem)] rounded-sm border-4 border-[#5a3d24] bg-[#f4ead2] px-5 py-4 text-[#2a2018] shadow-2xl">
            <p className="text-center text-[11px] tracking-[0.28em] text-[#8a5a28] uppercase">The check</p>
            <p className="font-display mt-1 text-center text-2xl">Scribble your name</p>
            <p className="mt-1 text-center text-sm">
              {ashPays() ? "Ash is paying. Just sign." : `Then Continue. Pell takes ${live.dine.bill} rupees.`}
            </p>
            <canvas
              ref={signRef}
              width={640}
              height={220}
              className="mt-3 w-full touch-none rounded-sm border-2 border-[#5a3d24] bg-white"
              onPointerDown={(e) => {
                signDraw.current = true;
                const c = signRef.current;
                if (!c) return;
                const r = c.getBoundingClientRect();
                const g = c.getContext("2d")!;
                g.strokeStyle = "#1a1410";
                g.lineWidth = 3;
                g.lineCap = "round";
                g.beginPath();
                g.moveTo(((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height);
              }}
              onPointerMove={(e) => {
                if (!signDraw.current) return;
                const c = signRef.current;
                if (!c) return;
                const r = c.getBoundingClientRect();
                const g = c.getContext("2d")!;
                g.lineTo(((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height);
                g.stroke();
              }}
              onPointerUp={() => {
                signDraw.current = false;
              }}
            />
            <Button
              className="mt-4 w-full"
              variant="accent"
              onClick={() => {
                if (!live.dine) return;
                if (ashPays()) {
                  live.dine.bill = 0;
                  live.dine.phase = "pay";
                  live.dine.t = 0;
                  live.talking = false;
                  live.hint = "Ash: Don’t worry. I’ve got it.";
                  sfx.ok();
                  return;
                }
                const cost = live.dine.bill || 20;
                const g = useGame.getState();
                if ((g.coins ?? 0) < cost) {
                  sfx.miss();
                  live.hint = "Not enough rupees.";
                  return;
                }
                useGame.setState({ coins: (g.coins ?? 0) - cost });
                live.dine.phase = "pay";
                live.dine.t = 0;
                live.talking = false;
                live.hint = "Thank you. Come back soon.";
                sfx.ok();
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : null}
      {live.dine?.chatWait && live.dine.chatWho && !doorQuiz ? (
        <div className="pointer-events-auto sheet-lift absolute left-1/2 z-40 w-[min(94vw,26rem)] -translate-x-1/2">
          <div className="panel rounded-xl px-4 py-3">
            <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">{npcById(live.dine.chatWho)?.name ?? "Friend"}</p>
            <p className="font-display mt-1 text-lg">{live.dine.chatLine}</p>
            {chatBack ? <p className="mt-2 text-sm text-[#e8d48a]">{chatBack}</p> : null}
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const d = live.dine;
                if (!d || !d.chatWho) return;
                const text = chatDraft.trim();
                if (!text) return;
                const who = npcById(d.chatWho)?.name ?? "Friend";
                const said = d.chatLine;
                setChatDraft("");
                if (/cobb|night|carrot/i.test(said)) {
                  d.laughT = 3.2;
                  sfx.ok();
                }
                void writeTableTalk({ data: { from: who, name: useGame.getState().heroName || "Scholar", said, reply: text } })
                  .then((res) => {
                    const line = res.ok ? res.line : "Ha. You heard that.";
                    setChatBack(line);
                    if (/ha|laugh|cobb|night/i.test(line)) {
                      if (live.dine) live.dine.laughT = 3.4;
                    }
                  })
                  .catch(() => {
                    setChatBack("Ha. You heard that.");
                  })
                  .finally(() => {
                    window.setTimeout(() => {
                      if (!live.dine) return;
                      live.dine.chatWait = false;
                      live.dine.chatT = 0;
                      live.dine.chatI += 1;
                      live.dine.chatWho = null;
                      live.dine.chatLine = "";
                      live.talking = false;
                      setChatBack("");
                    }, 2200);
                  });
              }}
            >
              <input
                value={chatDraft}
                onChange={(ev) => setChatDraft(ev.target.value)}
                placeholder="Type what you say…"
                className="min-h-12 flex-1 rounded-md border border-white/20 bg-[#1a1410] px-3 text-base text-[#efe6d4] outline-none"
              />
              <Button type="submit" size="sm" variant="accent">
                Say
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!live.dine) return;
                  live.dine.chatWait = false;
                  live.dine.chatT = 0;
                  live.dine.chatI += 1;
                  live.dine.chatWho = null;
                  live.dine.chatLine = "";
                  live.talking = false;
                  setChatBack("");
                  setChatDraft("");
                }}
              >
                Later
              </Button>
            </form>
          </div>
        </div>
      ) : null}
      {eatery && !dinePhase && !talkId && !doorQuiz ? (
        <div className="pointer-events-auto sheet-lift absolute left-1/2 z-30 w-[min(92vw,22rem)] -translate-x-1/2">
          <div className="panel rounded-xl px-4 py-3">
            <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Pell’s table</p>
            <p className="mt-1 text-sm text-muted">Sit if you want. The board is the menu.</p>
            <div className="mt-3 flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (eatMeal("sandwich")) sfx.heal();
                  else sfx.miss();
                }}
              >
                Sandwich · 10 · 1 heart
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (eatMeal("stew")) sfx.heal();
                  else sfx.miss();
                }}
              >
                Stew · 18 · 2 hearts
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={(fish ?? 0) < 1}
                onClick={() => {
                  if (eatMeal("fish")) sfx.heal();
                  else sfx.miss();
                }}
              >
                Your fish, raw · {fish ?? 0}
              </Button>
              <Button
                size="sm"
                variant="accent"
                disabled={(cooked ?? 0) < 1}
                onClick={() => {
                  if (eatMeal("cooked")) sfx.heal();
                  else sfx.miss();
                }}
              >
                Your cooked fish · {cooked ?? 0} · 2 hearts
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {stall && !shop && !talkId && !doorQuiz ? (
        <div className="pointer-events-auto sheet-lift absolute left-1/2 z-30 w-[min(92vw,22rem)] -translate-x-1/2">
          <div className="panel rounded-xl px-4 py-3">
            <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Pax’s pack stall</p>
            <p className="mt-1 text-sm text-muted">He buys what you gather and sells it on. One, or all.</p>
            <p className="mt-1 text-[11px] text-[#c8b090]">
              Wallet {coins}/{coinsMax ?? 100}
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {(
                [
                  ["apple", "Apples", apples ?? 0, 3],
                  ["mushroom", "Mushrooms", mushrooms ?? 0, 4],
                  ["wood", "Firewood", wood ?? 0, 5],
                  ["fish", "Fish", fish ?? 0, 8],
                  ["cooked", "Cooked fish", cooked ?? 0, 14],
                  ["seeds", "Seeds", seeds ?? 0, 2],
                  ["rocks", "Rocks", rocks ?? 0, 1],
                ] as const
              ).map(([kind, label, n, price]) => (
                <div key={kind} className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 justify-between"
                    disabled={n < 1}
                    onClick={() => {
                      if (sellGood(kind) > 0) sfx.buy();
                      else sfx.miss();
                    }}
                  >
                    <span>{label}</span>
                    <span className="text-[#e8d48a]">
                      {n} · {price} each
                    </span>
                  </Button>
                  <Button
                    size="sm"
                    variant="accent"
                    disabled={n < 2}
                    onClick={() => {
                      if (sellGood(kind, true) > 0) sfx.buy();
                      else sfx.miss();
                    }}
                  >
                    All
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {song ? (
        <div className="pointer-events-none absolute top-28 left-3 z-40 max-w-[11.5rem]">
          <div className="panel rounded-xl px-3 py-2 text-left">
            <p className="text-[11px] tracking-[0.18em] text-[#e8d48a] uppercase">Reed Flute</p>
            <p className="font-display mt-1 text-xl tracking-[0.18em]">
              {tune ? tune.split("").join(" ") : "· · ·"}
            </p>
            {songOk ? (
              <p className="font-display mt-2 text-base text-[#e8d48a]">You played {songOk}!</p>
            ) : (
              <p className="mt-1 text-[11px] text-muted">{padUi ? "Play a song from the backpack" : "A S D F G H · O away"}</p>
            )}
            {(songs ?? []).length > 0 ? (
              <p className="mt-2 text-[11px] text-white/70">
                {SONGS.filter((s) => (songs ?? []).includes(s.id)).map((s) => s.name).join(" · ")}
              </p>
            ) : (
              <p className="mt-2 text-[11px] text-muted">No songs yet</p>
            )}
          </div>
        </div>
      ) : null}
      {got && GETS[got] ? (
        <div className="dialog-box pointer-events-none">
          <p className="text-[11px] tracking-[0.22em] text-[#e8d48a] uppercase">Item</p>
          <p className="font-display mt-2 text-2xl leading-snug">{GETS[got].title}</p>
          <p className="mt-2 text-sm text-muted">{padHint(GETS[got].blurb)}</p>
        </div>
      ) : null}
      {mailSend ? (
        <div className="dialog-box">
          <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Send a letter</p>
          <p className="font-display mt-1 mb-3 text-lg">Who gets it?</p>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {WRITE_TO.filter((p) => (metNpcs ?? []).includes(p.id) || p.id === "mira").map((p) => (
              <button
                key={p.id}
                type="button"
                className="block w-full rounded-md px-3 py-2 text-left text-[#efe6d4] hover:bg-white/15"
                onClick={() => {
                  setComposeTo(p.id);
                  setDraft("");
                  setWriteBack("compose");
                  setMailSend(false);
                  live.mailSend = false;
                  live.talking = true;
                  sfx.select();
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 text-[11px] text-muted"
            onClick={() => {
              live.mailSend = false;
              live.talking = false;
              setMailSend(false);
            }}
          >
            Close
          </button>
        </div>
      ) : writeBack === "ask" ? (
        <div className="dialog-box">
          <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Letter</p>
          <p className="font-display mt-2 text-lg leading-snug">Write back?</p>
          <div className="mt-4 space-y-1">
            <button
              type="button"
              className={`block w-full rounded-md px-3 py-2 text-left ${againYes ? "bg-white/15 text-[#e8d48a]" : "text-fg/80"}`}
              onClick={() => {
                setAgainYes(true);
                sfx.select();
                setWriteBack("compose");
                setDraft("");
              }}
            >
              {againYes ? "▸ " : "   "}Yes
            </button>
            <button
              type="button"
              className={`block w-full rounded-md px-3 py-2 text-left ${!againYes ? "bg-white/15 text-[#e8d48a]" : "text-fg/80"}`}
              onClick={() => {
                setAgainYes(false);
                sfx.select();
                endTalk();
              }}
            >
              {!againYes ? "▸ " : "   "}No
            </button>
          </div>
          <p className="mt-3 text-[11px] text-muted">{padUi ? "Tap Yes or No" : "W / S or up / down · A or Space to pick"}</p>
        </div>
      ) : writeBack === "compose" ? (
        <div className="dialog-box">
          <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Write back</p>
          <p className="font-display mt-1 mb-2 text-lg">
            To {WRITE_TO.find((p) => p.id === composeTo)?.name ?? letter?.from ?? "them"}
          </p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            maxLength={180}
            autoFocus
            placeholder="Type what you want to send…"
            className="w-full resize-none rounded-md border border-white/20 bg-[#1a1410] px-3 py-2 text-base text-[#efe6d4] outline-none"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="rounded-md bg-white/15 px-4 py-2 text-[#e8d48a]"
              onClick={() => {
                const to = composeTo ?? npcIdFromName(letter?.from ?? "");
                if (!to || !draft.trim()) {
                  sfx.miss();
                  return;
                }
                useGame.getState().sendMail(to, draft.trim());
                setWriteBack(null);
                setDraft("");
                endTalk();
              }}
            >
              Send
            </button>
            <button
              type="button"
              className="rounded-md px-4 py-2 text-[11px] text-muted"
              onClick={() => endTalk()}
            >
              Never mind
            </button>
          </div>
        </div>
      ) : askAgain ? (
        <div className="dialog-box">
          <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">Talk</p>
          <p className="font-display mt-2 text-lg leading-snug">Do you want to hear this again?</p>
          <div className="mt-4 space-y-1">
            <button
              type="button"
              className={`block w-full rounded-md px-3 py-2 text-left ${againYes ? "bg-white/15 text-[#e8d48a]" : "text-fg/80"}`}
              onClick={() => {
                setAgainYes(true);
                sfx.select();
                setPage(0);
                setAskAgain(false);
              }}
            >
              {againYes ? "▸ " : "   "}Yes
            </button>
            <button
              type="button"
              className={`block w-full rounded-md px-3 py-2 text-left ${!againYes ? "bg-white/15 text-[#e8d48a]" : "text-fg/80"}`}
              onClick={() => {
                setAgainYes(false);
                sfx.select();
                endTalk();
              }}
            >
              {!againYes ? "▸ " : "   "}No
            </button>
          </div>
          <p className="mt-3 text-[11px] text-muted">{padUi ? "Tap Yes or No" : "W / S or up / down · A or Space to pick"}</p>
        </div>
      ) : line ? (
        <button type="button" className="dialog-box" onClick={advanceTalk}>
          <p className="text-[11px] tracking-[0.16em] text-[#e8d48a] uppercase">{line.speaker}</p>
          <p className="font-display mt-2 text-lg leading-snug">{line.text}</p>
          <p className="mt-3 text-[11px] text-muted">Tap · next</p>
        </button>
      ) : null}
      <FightOverlay />
      <TouchPad hidden={Boolean(coach || pack || talkId || shop || innDesk || dinePhase || mailSend || song || got || nameHorse)} />
      <DevPanel />
      <CharViewer />
      <CoordsHud />
    </div>
  );
}
