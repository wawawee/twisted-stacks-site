/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameState, Brick, Particle, Racket } from "./types";
import { FONT_5X7 } from "./font";
import {
  MAX_LEVEL,
  CHAMPION_STORAGE_KEY,
  getLevelProfile,
} from "./levels";
import {
  fetchRemoteScores,
  isRemoteLeaderboardConfigured,
  submitRemoteScore,
  type ScoreEntry,
} from "./leaderboard";
import { BRICK_PIXEL_GAP, BRICK_PIXEL_SIZE } from "./brickPixel";
import {
  applyCornerComboBoost,
  applyNaturalRacketDeflection,
  applyRacketImpulse,
  advanceBall,
  bounceVelocityOffRacket,
  cornerComboIntensity,
  createBallState,
  decayBallGlint,
  getGlintOpacity,
  getGlintScale,
  integrateBallCurve,
  isPanicSave,
  normalizeBallSpeed,
  randomLaunchVelocity,
  resetBallMotion,
  resolveBrickBallCollision,
  ricochetIntroBounds,
  type BallState,
} from "./ballPhysics";
import { computeCameraTilt } from "./cameraTilt";
import { clamp } from "./math";
import { computeMusicTick } from "./gameplayMusic";
import {
  computeAiTargetOffset,
  computeAiTrackingParams,
  computeGameplaySpeed,
  computeLevelStartSpeed,
  computePointMultiplier,
} from "./gameplaySpeed";
import {
  buildMonsterBrickCells,
  computeMonsterBlockSize,
  getLevelMonsterSpawns,
  getMonsterBrickGridPosition,
  getMonsterPulseScale,
  getMonsterShotRacketHit,
  getMonsterVariant,
  getMonsterWobble,
  type MonsterVariant,
  getNextMonsterShotDelay,
  isMonsterShotOutOfBounds,
  parseMonsterBrickGrid,
  shouldMonsterExplode,
} from "./monsters";
import {
  buildMotifBrickSpecs,
  computeMotifRotation,
  getMotifBrickWorldPosition,
  getMotifLayoutSpec,
  getMotifMirrorBurstTilt,
  shouldTriggerMotifMirrorFlip,
} from "./centerMotif";
import {
  getLevelIntroColor,
  getLevelIntroLines,
  LEVEL_INTRO_DURATION_MS,
  levelIntroOverlayOpacity,
  levelIntroWeirdOffset,
} from "./levelIntro";
import { monsterShotAngle, monsterShotSpeed } from "./monsterShots";

// Theme Palette Configuration
const COLOR_BLACK = 0x050505;       // Pure near-black background
const COLOR_INTRO_ACTIVE = 0xA855F7; // Neon purple
const COLOR_INTRO_DAMAGED = 0x44403C; // Charcoal gray
const COLOR_INTRO_DEAD = 0x1C1917;    // Slate gray (obstacle)
const COLOR_PLAYER = 0xEAB308;       // Yellow/Gold for human player
const COLOR_AI = 0x06B6D4;           // Cyan for artificial intelligence
const COLOR_WIN_GREEN = 0x22C55E;    // Neon Green for victory
const COLOR_LOSS_RED = 0xEF4444;     // Blood Red for defeat
const COLOR_WHITE = 0xFFFFFF;        // Neutral highlights
const CONTACT_EMAIL = "dev@twistedstacks.com";
const HARMONIC_SCALE = [196.0, 220.0, 246.94, 293.66, 329.63, 392.0, 440.0, 493.88];
const SCOREBOARD_STORAGE_KEY = "twisted_pongg_scoreboard_v1";
const SCOREBOARD_LIMIT = 5;
const PLAYER_NAME_LIMIT = 6;
const MATCH_LIVES = 3;
const AI_RACKET_SHOT_SCORE = 1;

interface ScoreCandidate {
  score: number;
  level: number;
  outcome: "lost" | "champion";
}

function normalizePlayerName(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, PLAYER_NAME_LIMIT);
}

function loadScoreboard(): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SCOREBOARD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScoreEntry[];
    if (!Array.isArray(parsed)) return [];
    return rankScoreboard(parsed.filter((entry) => entry && typeof entry.name === "string" && Number.isFinite(entry.score)));
  } catch {
    return [];
  }
}

function rankScoreboard(entries: ScoreEntry[]) {
  return entries
    .map((entry) => ({
      name: normalizePlayerName(entry.name) || "PLAYER",
      score: Math.max(0, Math.round(entry.score)),
      level: Math.max(1, Math.min(MAX_LEVEL, Math.round(entry.level || 1))),
      date: typeof entry.date === "string" ? entry.date : new Date().toISOString(),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.level - a.level || a.date.localeCompare(b.date))
    .slice(0, SCOREBOARD_LIMIT);
}

function persistScoreboard(entries: ScoreEntry[]) {
  try {
    localStorage.setItem(SCOREBOARD_STORAGE_KEY, JSON.stringify(rankScoreboard(entries)));
  } catch {
    /* ignore quota / private mode */
  }
}

export interface ShowroomProject {
  id: string;
  name: string;
  version: string;
  tagline: string;
  description: string;
  status: "SHIPPED" | "PRODUCTION" | "DEPRECATED" | "ACTIVE DEMO";
  techStack: string[];
  telemetry: { label: string; value: string }[];
  href?: string;
  actionLabel?: string;
  contactMessage?: string;
}

const CATALOG_PROJECTS: ShowroomProject[] = [
  {
    id: "system_skatterevision",
    name: "SkatteRevision",
    version: "working product / private demo",
    status: "PRODUCTION",
    tagline: "Audit-grade retroactive tax recovery intelligence.",
    description: "A working UI for finding historical repayment signals across company data, iXBRL, legal context, risk checks, and sourced dossiers for accountants and tax advisors.",
    techStack: ["TypeScript", "iXBRL", "AI Agents", "Dossiers"],
    telemetry: [
      { label: "MODE", value: "DOSSIERS" },
      { label: "DATA", value: "HISTORIC" },
      { label: "STATUS", value: "DEMO" }
    ],
    actionLabel: "Book Demo",
    contactMessage: "Hej Per,\n\nJag vill boka en full demonstration av SkatteRevision-systemet.\n\n"
  },
  {
    id: "system_laga",
    name: "LAGA",
    version: "workflow modeler / macOS path",
    status: "ACTIVE DEMO",
    tagline: "Legal workflow, transcription, contradiction analysis, and RAG.",
    description: "A legal workflow lab for media-to-analysis pipelines, Swedish transcription, source tracking, and local/private AI workflows.",
    techStack: ["Vite", "React Flow", "MLX", "OpenRouter"],
    telemetry: [
      { label: "NODES", value: "4 MVP" },
      { label: "MODEL", value: "LOCAL+API" },
      { label: "STATUS", value: "LOCAL" }
    ],
    href: "https://github.com/wawawee/LAGA-REBOOT",
    actionLabel: "Repo"
  },
  {
    id: "system_relay",
    name: "Relay / THE-AI-BUTTON",
    version: "voice-first iOS",
    status: "ACTIVE DEMO",
    tagline: "Say it once. Let the agent do the rest.",
    description: "A tiny voice-first relay for sending spoken tasks to reminders, mail, n8n, or AI agents without living inside a chat window.",
    techStack: ["Swift", "iOS", "n8n", "Voice UX"],
    telemetry: [
      { label: "PLATFORM", value: "iOS" },
      { label: "INPUT", value: "VOICE" },
      { label: "STATUS", value: "PRIVATE" }
    ],
    actionLabel: "Private"
  },
  {
    id: "system_recon",
    name: "Recon Search Assistant",
    version: "responsible cyber",
    status: "ACTIVE DEMO",
    tagline: "Defensive recon with scope, memory, and AI triage.",
    description: "A security research assistant for authorized search, exposed-surface checks, finding triage, and responsible workflows.",
    techStack: ["JavaScript", "Supabase", "OpenRouter", "OSINT"],
    telemetry: [
      { label: "MODE", value: "DEFENSIVE" },
      { label: "SCOPE", value: "REQUIRED" },
      { label: "STATUS", value: "LAB" }
    ],
    href: "https://github.com/wawawee/Recon-Search-Assistant",
    actionLabel: "Repo"
  },
  {
    id: "system_anslag",
    name: "ANSLAG",
    version: "free grant helper",
    status: "SHIPPED",
    tagline: "Find grants. Shape applications. Move practical projects forward.",
    description: "A free public grant-search and application-writing service for founders, associations, local projects, and teams that need help turning ideas into fundable applications.",
    techStack: ["React", "Vite", "OpenRouter", "Grants"],
    telemetry: [
      { label: "TARGET", value: "FUNDING" },
      { label: "MODEL", value: "FREE ROUTE" },
      { label: "STATUS", value: "LIVE" }
    ],
    href: "https://app-one-olive-53.vercel.app/",
    actionLabel: "Live"
  },
  {
    id: "system_silversmeden",
    name: "Silversmeden",
    version: "client site",
    status: "SHIPPED",
    tagline: "Clean craft site for a working silversmith.",
    description: "A restrained public site built for a silversmith: simple, elegant, and focused on the work rather than framework noise.",
    techStack: ["Vercel", "Frontend", "Design", "Client"],
    telemetry: [
      { label: "MODE", value: "CRAFT" },
      { label: "STATUS", value: "LIVE" },
      { label: "TEXTURE", value: "CLEAN" }
    ],
    href: "https://silversmeden.vercel.app/",
    actionLabel: "Live"
  },
  {
    id: "system_arena",
    name: "TWISTED PONGG",
    version: "playable site",
    status: "ACTIVE DEMO",
    tagline: "Self-pass square court with spin.",
    description: "The homepage itself is playable: a light arcade shell around the TwistedStacks portfolio instead of a static landing page.",
    techStack: ["React", "Three.js", "WebGL", "Vite"],
    telemetry: [
      { label: "BALL SPEED", value: "DYNAMIC" },
      { label: "RENDER RATE", value: "60 FPS" },
      { label: "PADDLE MULTI", value: "4 ACTIVE" }
    ],
    actionLabel: "Play"
  }
];

const ASCII_ROWS = [
  "                 .:-=+*#%@#*+=-:.                  ",
  "          ..:-=+*###***++===++***###*+=-:..         ",
  "      .:-+**+=--..                 ..--=+**+-:.     ",
  "    :=*+=:.      TWISTEDSTACKS / LOCAL AI      .:=*=:   ",
  "  .=*-.       AGENTS  RAG  LEGAL  VOICE  CYBER      .-*=: ",
  " .+=.      01001010 01100101 01110100 01110011       .=+. ",
  ":+:       public data -> sourced decisions -> tools     :+:",
  "-*.       SkatteRevision   LAGA   Relay   Recon         .*-",
  ":+:       applets, demos, grants, jobs, and strange UI   :+:",
  " .+=.      01010011 01010100 01000001 01000011 01001011 .=+. ",
  "  .=*-.        clean front door / playable archive     .-*=: ",
  "    :=*+=:.                                      .:=*=:   ",
  "      .:-+**+=--..                         ..--=+**+-:.     ",
  "          ..:-=+*###***++===++***###*+=-:..         ",
  "                 .:-=+*#%@#*+=-:.                  ",
];

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO_TWISTEDSTACKS);
  const transitionRef = useRef<((state: GameState) => void) | null>(null);
  const endActionRequestRef = useRef<"next" | "retry" | "champion" | "level1" | null>(null);
  const devLevelRequestRef = useRef<number | null>(null);
  const [endAction, setEndAction] = useState<"next" | "retry" | "champion" | null>(null);
  const endActionRef = useRef(endAction);
  endActionRef.current = endAction;
  const [retryCountdown, setRetryCountdown] = useState(10);
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const showEasterEggRef = useRef<(open: boolean) => void>(() => {});
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  showEasterEggRef.current = setShowEasterEgg;
  const [championUnlocked, setChampionUnlocked] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(CHAMPION_STORAGE_KEY) === "1",
  );
  const isDevMode = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);

  // Showroom states
  const [selectedProjectId, setSelectedProjectId] = useState<string>("system_skatterevision");
  const [showShowroomModal, setShowShowroomModal] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [highScores, setHighScores] = useState<ScoreEntry[]>(loadScoreboard);
  const [leaderboardMode, setLeaderboardMode] = useState<"local" | "global">(
    isRemoteLeaderboardConfigured() ? "global" : "local",
  );
  const [scoreCandidate, setScoreCandidate] = useState<ScoreCandidate | null>(null);
  const [playerInitials, setPlayerInitials] = useState("");

  const rigStateRef = useRef<"normal" | "autopilot">("normal");
  const highScoresRef = useRef(highScores);
  highScoresRef.current = highScores;

  useEffect(() => {
    let cancelled = false;

    if (!isRemoteLeaderboardConfigured()) return undefined;

    fetchRemoteScores(SCOREBOARD_LIMIT)
      .then((remoteScores) => {
        if (cancelled) return;
        setLeaderboardMode("global");
        if (remoteScores.length === 0) return;
        const nextScores = rankScoreboard([...remoteScores, ...highScoresRef.current]);
        persistScoreboard(nextScores);
        highScoresRef.current = nextScores;
        setHighScores(nextScores);
      })
      .catch((error) => {
        setLeaderboardMode("local");
        console.warn("Remote leaderboard unavailable; using local scores.", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const requestRetryYes = () => {
    clearRetryTimer();
    endActionRequestRef.current = "retry";
  };

  const requestAcceptAiWins = () => {
    clearRetryTimer();
    setEndAction(null);
    endActionRequestRef.current = "level1";
  };

  useEffect(() => {
    if (!showGame || endAction !== "retry") {
      clearRetryTimer();
      setRetryCountdown(10);
      return undefined;
    }

    setRetryCountdown(10);
    const started = performance.now();
    clearRetryTimer();
    retryTimerRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((10000 - (performance.now() - started)) / 1000));
      setRetryCountdown(left);
      if (left <= 0) {
        clearRetryTimer();
        setEndAction(null);
        window.setTimeout(() => {
          endActionRequestRef.current = "level1";
        }, 750);
      }
    }, 200);

    return () => {
      clearRetryTimer();
    };
  }, [endAction, showGame]);

  const startTwistedPongg = () => {
    setShowGame(true);
    if (endAction) {
      endActionRequestRef.current = endAction === "champion" ? "retry" : endAction;
    }
  };

  const qualifiesForScoreboard = (score: number, entries = highScoresRef.current) =>
    score > 0 && (entries.length < SCOREBOARD_LIMIT || score > entries[entries.length - 1].score);

  const submitScoreCandidate = (score: number, level: number, outcome: ScoreCandidate["outcome"]) => {
    if (!qualifiesForScoreboard(score)) return;
    setPlayerInitials("");
    setScoreCandidate({ score: Math.round(score), level, outcome });
  };

  const saveScoreCandidate = async () => {
    if (!scoreCandidate) return;
    const name = normalizePlayerName(playerInitials) || "PLAYER";
    const submission = {
      name,
      score: scoreCandidate.score,
      level: scoreCandidate.level,
      outcome: scoreCandidate.outcome,
    };
    const nextScores = rankScoreboard([
      ...highScoresRef.current,
      {
        name: submission.name,
        score: submission.score,
        level: submission.level,
        date: new Date().toISOString(),
      },
    ]);
    persistScoreboard(nextScores);
    highScoresRef.current = nextScores;
    setHighScores(nextScores);
    setScoreCandidate(null);
    setPlayerInitials("");

    try {
      const remoteScores = await submitRemoteScore(submission, SCOREBOARD_LIMIT);
      if (remoteScores.length === 0) return;
      const syncedScores = rankScoreboard(remoteScores);
      persistScoreboard(syncedScores);
      highScoresRef.current = syncedScores;
      setHighScores(syncedScores);
      setLeaderboardMode("global");
    } catch (error) {
      setLeaderboardMode("local");
      console.warn("Could not submit remote leaderboard score; kept local score.", error);
    }
  };

  // Difficulty: hold D for compact picker; default hardcore arcade boot
  const [showDifficultyScreen, setShowDifficultyScreen] = useState(false);
  const [difficulty, setDifficulty] = useState<"casual" | "hardcore" | "impossible">("hardcore");
  const difficultyRef = useRef<"casual" | "hardcore" | "impossible">("hardcore");
  const setDifficultyRef = useRef(setDifficulty);
  setDifficultyRef.current = setDifficulty;

  const [hud, setHud] = useState({
    rallySec: 0,
    cornerCombos: 0,
    level: 1,
    cornerFlash: 0,
    playerPoints: 0,
    pointMultiplier: 1,
  });
  const hudSyncRef = useRef(hud);
  const arcadeBootedRef = useRef(false);

  // Contact Form State
  const [initError, setInitError] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactType, setContactType] = useState<"FEEDBACK" | "BUG_REPORT" | "QUERY">("FEEDBACK");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!contactMessage.trim()) {
      setFormError("Skriv något först");
      return;
    }

    setIsSubmitting(true);
    const subject = encodeURIComponent(`TWISTED PONGG ${contactType.replace("_", " ")}`);
    const body = encodeURIComponent(contactMessage.trim());
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitSuccess(true);
    }, 400);
  };

  const handleCloseContact = () => {
    setShowContactForm(false);
    setContactMessage("");
    setContactType("FEEDBACK");
    setIsSubmitSuccess(false);
    setFormError("");
  };

  const openContactForm = (prefill?: { message?: string; type?: "FEEDBACK" | "BUG_REPORT" | "QUERY" }) => {
    if (prefill?.message) setContactMessage(prefill.message);
    if (prefill?.type) setContactType(prefill.type);
    setShowContactForm(true);
    setIsSubmitSuccess(false);
    setFormError("");
  };

  const championUnlockedRef = useRef(championUnlocked);
  championUnlockedRef.current = championUnlocked;

  const persistChampionUnlock = () => {
    try {
      localStorage.setItem(CHAMPION_STORAGE_KEY, "1");
    } catch {
      /* ignore quota / private mode */
    }
    championUnlockedRef.current = true;
    setChampionUnlocked(true);
  };

  const closeEasterEgg = () => {
    setShowEasterEgg(false);
    rigStateRef.current = "normal";
  };

  useEffect(() => {
    if (showEasterEgg) {
      rigStateRef.current = "autopilot";
    }
  }, [showEasterEgg]);

  // Keep track of interaction state for parallax tilt
  const interactionRef = useRef({
    mouseX: 0,
    mouseY: 0,
    targetMouseX: 0,
    targetMouseY: 0,
    isTouch: false,
    playerTargetX: 0, // In normalized/ortho units
    playerTargetY: 0, // In normalized/ortho units
  });

  useEffect(() => {
    if (!mountRef.current) return;

    try {
      // --- GAME ENGINE STATE VAULT ---
    let currentState: GameState = GameState.INTRO_TWISTEDSTACKS;
    // Safely fallback to make sure initial dimensions are non-zero to prevent NaN camera projection matrix
    let width = Math.max(320, mountRef.current?.clientWidth || window.innerWidth);
    let height = Math.max(240, mountRef.current?.clientHeight || window.innerHeight);

    // Speeds & timings
    const baseSpeed = 320; // Hypnotic slow start
    let currentSpeed = baseSpeed;
    let cameraZoomOut = 1;
    let gameplayStartTime = 0;
    let currentLevel = 1;
    let scorePlayer = MATCH_LIVES;
    let scoreAI = MATCH_LIVES;
    let playerPoints = 0;
    let pointMultiplier = 1;
    let playerScale = 1.0;
    let aiScale = 1.0;
    let playerTargetScale = 1.0;
    let aiTargetScale = 1.0;

    // Viewport dimensions limits
    let racketThickness = 20;
    let racketInitialLength = Math.max(112, height * 0.17);
    let ballSize = 24;
    const racketDepth = 22;

    // Array storage
    let bricks: Brick[] = [];
    let scoreBricks: Brick[] = [];
    let endBricks: Brick[] = []; // Bricks for end typographic card
    let countdownMeshes: THREE.Mesh[] = [];
    let countdownStepMs = 350;
    let levelIntroActive = false;
    let levelIntroStartedAt = 0;
    let levelIntroOverlayMesh: THREE.Mesh | null = null;
    let centerMotifBricks: Brick[] = [];
    let motifMirrorSign = 1;
    let motifMirrorBurstUntil = 0;
    let motifLastFlipAt = 0;
    let particles: Particle[] = [];
    let monsters: Array<{
      id: string;
      x: number;
      y: number;
      phase: number;
      nextShotAt: number;
      explodedAt60: boolean;
      hitCount: number;
      variant: MonsterVariant;
      bricks: Brick[];
    }> = [];
    let monsterShots: Array<{
      id: string;
      ownerMonsterId: string;
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      mesh: THREE.Mesh;
    }> = [];
    let playerShots: Array<{
      id: string;
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      mesh: THREE.Mesh;
    }> = [];

    // Screen Shake Manager
    let shakeIntensity = 0;
    let endOutcome: "player" | "ai" | null = null;
    let playerWinLines = ["WELL", "PLAYED", "HOOMAN"];
    let nextWinFlashAt = 0;
    let winFlashUntil = 0;
    let winFlashActive = false;
    let paintDripAccumulator = 0;
    let pendingNextLevelAt = 0;
    let championRevealAt = 0;
    let championBurstDone = false;
    let serveResumeAt = 0;
    let lastServeCountdownValue: number | null = null;
    let nextPlayerShotAt = 0;
    let nextMusicTickAt = 0;
    let musicStep = 0;
    let hitNoteIndex = 0;
    let audioCtx: AudioContext | null = null;
    let lastPlayerHitSide: "left" | "bottom" | null = null;
    let lastPlayerHitAt = 0;
    let cornerComboPulse = 0;
    let cornerComboCount = 0;
    let cornerTutorialSeen = false;
    let cornerTutorialFlash = 0;
    let hudFrameCounter = 0;

    function syncHudToReact() {
      hudFrameCounter += 1;
      if (hudFrameCounter % 6 !== 0) return;
      const rallySec =
        currentState === GameState.GAMEPLAY && gameplayStartTime > 0
          ? Math.floor((performance.now() - gameplayStartTime) / 1000)
          : 0;
      const next = {
        rallySec,
        cornerCombos: cornerComboCount,
        level: currentLevel,
        cornerFlash: cornerTutorialFlash,
        playerPoints,
        pointMultiplier,
      };
      const prev = hudSyncRef.current;
      if (
        prev.rallySec !== next.rallySec ||
        prev.cornerCombos !== next.cornerCombos ||
        prev.level !== next.level ||
        prev.playerPoints !== next.playerPoints ||
        prev.pointMultiplier !== next.pointMultiplier ||
        Math.abs(prev.cornerFlash - next.cornerFlash) > 0.04
      ) {
        hudSyncRef.current = next;
        setHud(next);
      }
    }

    function tryArcadeBoot() {
      if (arcadeBootedRef.current) return;
      arcadeBootedRef.current = true;
      difficultyRef.current = "hardcore";
      setDifficultyRef.current("hardcore");
      if (
        currentState === GameState.INTRO_TWISTED ||
        currentState === GameState.INTRO_STACKS ||
        currentState === GameState.INTRO_TWISTEDSTACKS
      ) {
        triggerSkipIntro();
      }
    }

    function ensureAudio() {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtor) return null;
      if (!audioCtx) audioCtx = new AudioCtor();
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
      return audioCtx;
    }

    function playTone(
      frequency: number,
      duration = 0.08,
      gainValue = 0.045,
      type: OscillatorType = "triangle",
    ) {
      const ctx = ensureAudio();
      if (!ctx) return;

      const now = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
    }

    function playHitSound(power: number, owner: "player" | "ai" | "brick") {
      const octave = owner === "player" ? 1 : owner === "ai" ? 1.5 : 2;
      const note = HARMONIC_SCALE[hitNoteIndex % HARMONIC_SCALE.length] * octave;
      hitNoteIndex += Math.max(1, Math.round(power * 2));
      playTone(note, 0.055 + power * 0.025, 0.026 + power * 0.035, owner === "brick" ? "square" : "triangle");
      if (power > 0.55) {
        playTone(note * 1.5, 0.05, 0.014 + power * 0.018, "sine");
      }
    }

    function playScoreLossSound() {
      const root = HARMONIC_SCALE[hitNoteIndex % HARMONIC_SCALE.length];
      playTone(root * 0.49, 0.19, 0.07, "sawtooth");
      setTimeout(() => playTone(root * 1.07, 0.08, 0.055, "square"), 28);
      setTimeout(() => playTone(root * Math.SQRT2, 0.16, 0.045, "sawtooth"), 78);
      setTimeout(() => playTone(root * 0.52, 0.2, 0.036, "square"), 128);
    }

    function playScoreWinSound() {
      const root = HARMONIC_SCALE[(hitNoteIndex + 2) % HARMONIC_SCALE.length];
      playTone(root * 1.5, 0.055, 0.045, "triangle");
      setTimeout(() => playTone(root * 2, 0.06, 0.04, "sine"), 42);
      setTimeout(() => playTone(root * 2.5, 0.075, 0.035, "square"), 86);
      setTimeout(() => playTone(root * 1.875, 0.05, 0.018, "sawtooth"), 126);
    }

    function playCornerComboSound(intensity: number) {
      const root = HARMONIC_SCALE[hitNoteIndex % HARMONIC_SCALE.length];
      playTone(root * 2, 0.07, 0.035 + intensity * 0.02, "triangle");
      setTimeout(() => playTone(root * 3, 0.075, 0.025 + intensity * 0.018, "sine"), 38);
      setTimeout(() => playTone(root * 4, 0.06, 0.018, "sine"), 72);
    }

    function playPanicSaveSound() {
      const root = HARMONIC_SCALE[(hitNoteIndex + 3) % HARMONIC_SCALE.length];
      playTone(root * 0.75, 0.045, 0.045, "square");
      setTimeout(() => playTone(root * 2, 0.06, 0.035, "triangle"), 42);
    }

    function updatePointMultiplier() {
      pointMultiplier = computePointMultiplier(baseSpeed, currentSpeed, currentLevel);
    }

    function addPlayerPoints(points: number) {
      playerPoints += Math.max(0, Math.round(points));
      hudFrameCounter = 5;
    }

    function addRescuePoints() {
      updatePointMultiplier();
      addPlayerPoints((12 + currentLevel * 3) * pointMultiplier);
    }

    function addMonsterHitPoints(destroyed: boolean) {
      updatePointMultiplier();
      addPlayerPoints((destroyed ? 24 : 9) * pointMultiplier);
    }

    function updateMusicLoop(timeNow: number) {
      if (!audioCtx || currentState !== GameState.GAMEPLAY) return;
      const tick = computeMusicTick(
        timeNow,
        nextMusicTickAt,
        currentLevel,
        MAX_LEVEL,
        currentSpeed,
        baseSpeed,
        musicStep,
        HARMONIC_SCALE,
      );
      if (!tick) return;
      nextMusicTickAt = tick.nextTickAt;
      musicStep = tick.nextMusicStep;
      tick.tones.forEach((tone) => {
        playTone(tone.frequency, tone.duration, tone.gain, tone.waveType);
      });
    }

    // --- THREE.JS INFRASTRUCTURE ---
    const scene = new THREE.Scene();
    
    // Setting up the orthographic camera. 1 unit in Three JS is exactly equal to 1 screen space pixel!
    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      1,
      1000
    );
    camera.position.set(0, 0, 500);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(COLOR_BLACK, 1);
    mountRef.current.appendChild(renderer.domElement);

    // --- RACKET INITIALIZER ---
    // Establish the four rackets (Left, Bottom, Right, Top)
    // Vertical geometry: scale Y is actual length. Horizontal geometry: scale X is actual length.
    const verticalGeom = new THREE.BoxGeometry(racketThickness, 1, racketDepth);
    const horizontalGeom = new THREE.BoxGeometry(1, racketThickness, racketDepth);

    const materialPlayer = new THREE.MeshBasicMaterial({ color: COLOR_PLAYER });
    const materialAI = new THREE.MeshBasicMaterial({ color: COLOR_AI });

    const leftRacketMesh = new THREE.Mesh(verticalGeom, materialPlayer);
    const bottomRacketMesh = new THREE.Mesh(horizontalGeom, materialPlayer);
    const rightRacketMesh = new THREE.Mesh(verticalGeom, materialAI);
    const topRacketMesh = new THREE.Mesh(horizontalGeom, materialAI);

    scene.add(leftRacketMesh);
    scene.add(bottomRacketMesh);
    scene.add(rightRacketMesh);
    scene.add(topRacketMesh);

    const cornerRailMaterial = new THREE.MeshBasicMaterial({
      color: COLOR_PLAYER,
      transparent: true,
      opacity: 0.14,
    });
    const cornerRailAiMaterial = new THREE.MeshBasicMaterial({
      color: COLOR_AI,
      transparent: true,
      opacity: 0.14,
    });
    const cornerRailVertical = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 4), cornerRailMaterial);
    const cornerRailHorizontal = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 4), cornerRailMaterial);
    const cornerRailVerticalAi = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 4), cornerRailAiMaterial);
    const cornerRailHorizontalAi = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 4), cornerRailAiMaterial);
    cornerRailVertical.position.z = -10;
    cornerRailHorizontal.position.z = -10;
    cornerRailVerticalAi.position.z = -10;
    cornerRailHorizontalAi.position.z = -10;
    scene.add(cornerRailVertical);
    scene.add(cornerRailHorizontal);
    scene.add(cornerRailVerticalAi);
    scene.add(cornerRailHorizontalAi);

    const rackets: Record<string, Racket> = {
      left: { x: -width / 2 + 35, y: 0, length: racketInitialLength, thickness: racketThickness, mesh: leftRacketMesh },
      bottom: { x: 0, y: -height / 2 + 35, length: racketInitialLength, thickness: racketThickness, mesh: bottomRacketMesh },
      right: { x: width / 2 - 35, y: 0, length: racketInitialLength, thickness: racketThickness, mesh: rightRacketMesh },
      top: { x: 0, y: height / 2 + 35, length: racketInitialLength, thickness: racketThickness, mesh: topRacketMesh },
    };
    const racketVelocity = {
      left: { x: 0, y: 0 },
      bottom: { x: 0, y: 0 },
      right: { x: 0, y: 0 },
      top: { x: 0, y: 0 },
    };
    const previousRacketPosition = {
      left: { x: rackets.left.x, y: rackets.left.y },
      bottom: { x: rackets.bottom.x, y: rackets.bottom.y },
      right: { x: rackets.right.x, y: rackets.right.y },
      top: { x: rackets.top.x, y: rackets.top.y },
    };

    // --- BALL INITIALIZER ---
    const ballGeometry = new THREE.BoxGeometry(ballSize, ballSize, ballSize);
    const ballMaterial = new THREE.MeshBasicMaterial({ color: COLOR_WHITE });
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    scene.add(ballMesh);
    const ballGlintGeometry = new THREE.BoxGeometry(ballSize * 1.46, ballSize * 1.46, ballSize * 1.46);
    const ballGlintMaterial = new THREE.MeshBasicMaterial({
      color: COLOR_WHITE,
      transparent: true,
      opacity: 0,
      wireframe: true,
    });
    const ballGlintMesh = new THREE.Mesh(ballGlintGeometry, ballGlintMaterial);
    scene.add(ballGlintMesh);

    const ball: BallState = createBallState(COLOR_WHITE);

    function launchBall(speed: number) {
      resetBallMotion(ball);
      ballMesh.position.set(0, 0, 0);
      ballMesh.rotation.set(0, 0, 0);
      ballGlintMesh.position.set(0, 0, 2);
      ballGlintMaterial.opacity = 0;

      const velocity = randomLaunchVelocity(speed);
      ball.vx = velocity.vx;
      ball.vy = velocity.vy;
    }

    function clearCountdownMeshes() {
      countdownMeshes.forEach((mesh) => scene.remove(mesh));
      countdownMeshes = [];
    }

    function renderServeCountdownDigit(value: number) {
      clearCountdownMeshes();

      const gridMatrix = FONT_5X7[String(value)] || FONT_5X7["1"];
      const sizeFactor = value >= 7
        ? 0.95
        : value >= 4
          ? 0.72
          : value === 3
            ? 0.92
            : value === 2
              ? 0.62
              : 0.28;
      const gapRatio = 0.1;
      const block = Math.max(
        BRICK_PIXEL_SIZE,
        Math.floor(
          Math.min(
            (width * sizeFactor) / (5 + 4 * gapRatio),
            (height * sizeFactor) / (7 + 6 * gapRatio),
          ),
        ),
      );
      const gap = Math.max(BRICK_PIXEL_GAP, Math.floor(block * gapRatio));
      const digitW = 5 * block + 4 * gap;
      const digitH = 7 * block + 6 * gap;
      const material = value >= 4
        ? materialCache.active
          : value === 3
            ? materialCache.lossRed
            : value === 2
              ? materialCache.playerScore
              : materialCache.winGreen;

      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 5; c++) {
          if (gridMatrix[r][c] !== 1) continue;
          const bx = -digitW / 2 + c * (block + gap) + block / 2;
          const by = digitH / 2 - r * (block + gap) - block / 2;
          const mesh = new THREE.Mesh(getBrickGeometry(block, block), material);
          mesh.position.set(bx, by, 30);
          scene.add(mesh);
          countdownMeshes.push(mesh);
        }
      }
    }

    function ensureLevelIntroOverlay() {
      if (levelIntroOverlayMesh) return;
      const material = new THREE.MeshBasicMaterial({
        color: COLOR_BLACK,
        transparent: true,
        opacity: 0,
        depthTest: false,
      });
      levelIntroOverlayMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      levelIntroOverlayMesh.position.set(0, 0, 40);
      levelIntroOverlayMesh.renderOrder = 20;
      levelIntroOverlayMesh.visible = false;
      scene.add(levelIntroOverlayMesh);
    }

    function syncLevelIntroOverlaySize() {
      if (!levelIntroOverlayMesh) return;
      const pad = 1.28 * cameraZoomOut;
      levelIntroOverlayMesh.scale.set(width * pad, height * pad, 1);
    }

    function setLevelIntroSceneMasked(masked: boolean) {
      const show = !masked;
      ballMesh.visible = show;
      ballGlintMesh.visible = show;
      leftRacketMesh.visible = show;
      bottomRacketMesh.visible = show;
      rightRacketMesh.visible = show;
      topRacketMesh.visible = show;
      cornerRailVertical.visible = show;
      cornerRailHorizontal.visible = show;
      cornerRailVerticalAi.visible = show;
      cornerRailHorizontalAi.visible = show;
      scoreBricks.forEach((brick) => {
        if (brick.mesh) brick.mesh.visible = show;
      });
      centerMotifBricks.forEach((brick) => {
        if (brick.mesh) brick.mesh.visible = show;
      });
      bricks.forEach((brick) => {
        if (brick.mesh) brick.mesh.visible = show;
      });
      monsters.forEach((monster) => {
        monster.bricks.forEach((brick) => {
          if (brick.mesh) brick.mesh.visible = show;
        });
      });
      monsterShots.forEach((shot) => {
        shot.mesh.visible = show;
      });
    }

    function clearServeCountdown() {
      const wasLevelIntro = levelIntroActive;
      serveResumeAt = 0;
      lastServeCountdownValue = null;
      levelIntroActive = false;
      clearCountdownMeshes();
      if (levelIntroOverlayMesh) {
        levelIntroOverlayMesh.visible = false;
        if (levelIntroOverlayMesh.material instanceof THREE.MeshBasicMaterial) {
          levelIntroOverlayMesh.material.opacity = 0;
        }
      }
      if (wasLevelIntro) {
        setLevelIntroSceneMasked(false);
      }
    }

    function renderLevelIntro(level: number) {
      clearCountdownMeshes();
      const lines = getLevelIntroLines(level);
      const colorHex = getLevelIntroColor(level);
      const lineCount = lines.length;
      const spaceBetweenLines = level >= 7 ? 38 : 46;
      const brickW = Math.max(10, Math.floor((width * 0.42) / 28));
      const brickH = Math.floor(brickW * 1.05);
      const gap = 2;
      const charW = 5 * brickW + 4 * gap;
      const charSpacing = brickW * 1.35;
      const accentMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.92,
      });
      const dimMat = new THREE.MeshBasicMaterial({
        color: COLOR_WHITE,
        transparent: true,
        opacity: 0.42,
      });

      lines.forEach((lineText, lineIdx) => {
        const len = lineText.length;
        const totalLineWidth = len * charW + (len - 1) * charSpacing;
        const startX = -totalLineWidth / 2;
        const startY = (lineCount - 1) * (7 * brickH + 6 * gap + spaceBetweenLines) / 2 -
          lineIdx * (7 * brickH + 6 * gap + spaceBetweenLines);
        const mat = lineIdx === 1 ? accentMat : lineIdx === 2 ? accentMat : dimMat;
        const depth = lineIdx === 1 ? 52 : 50;

        for (let i = 0; i < len; i++) {
          const char = lineText[i];
          if (char === " ") continue;
          const matrix = FONT_5X7[char];
          if (!matrix) continue;
          const charStartX = startX + i * (charW + charSpacing);

          for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 5; c++) {
              if (matrix[r][c] !== 1) continue;
              const bx = charStartX + c * (brickW + gap) + brickW / 2;
              const by = startY - r * (brickH + gap) - brickH / 2;
              const mesh = new THREE.Mesh(getBrickGeometry(brickW, brickH), mat);
              mesh.position.set(bx, by, depth);
              scene.add(mesh);
              countdownMeshes.push(mesh);
            }
          }
        }
      });
    }

    function startLevelIntro(timeNow: number, level: number) {
      resetBallForCountdown();
      ensureLevelIntroOverlay();
      syncLevelIntroOverlaySize();
      setLevelIntroSceneMasked(true);
      levelIntroActive = true;
      levelIntroStartedAt = timeNow;
      countdownStepMs = LEVEL_INTRO_DURATION_MS;
      serveResumeAt = timeNow + LEVEL_INTRO_DURATION_MS;
      lastServeCountdownValue = null;
      if (levelIntroOverlayMesh) {
        levelIntroOverlayMesh.visible = true;
        if (levelIntroOverlayMesh.material instanceof THREE.MeshBasicMaterial) {
          levelIntroOverlayMesh.material.opacity = 0;
        }
      }
      renderLevelIntro(level);
      playTone(196 * (1 + level * 0.08), 0.07, 0.04, "triangle");
      setTimeout(() => playTone(392 * (1 + level * 0.04), 0.05, 0.03, "sine"), 90);
    }

    function animateLevelIntroMeshes(timeNow: number) {
      syncLevelIntroOverlaySize();
      const curtain = levelIntroOverlayOpacity(timeNow, levelIntroStartedAt);
      if (levelIntroOverlayMesh?.material instanceof THREE.MeshBasicMaterial) {
        levelIntroOverlayMesh.material.opacity = curtain * 0.97;
      }
      countdownMeshes.forEach((mesh, index) => {
        const offset = levelIntroWeirdOffset(timeNow, index, levelIntroStartedAt);
        mesh.position.z = offset.z;
        mesh.rotation.z = offset.rotZ;
        mesh.scale.setScalar(offset.scale);
        mesh.renderOrder = 30;
        if (mesh.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.opacity = offset.opacity;
          mesh.material.depthTest = false;
        }
      });
    }

    function resetBallForCountdown() {
      ball.x = 0;
      ball.y = 0;
      ball.vx = 0;
      ball.vy = 0;
      ball.curveSpin = 0;
      ball.glint = 0;
      ballMesh.position.set(0, 0, 0);
      ballMesh.rotation.set(0, 0, 0);
      ballGlintMesh.position.set(0, 0, 2);
      ballGlintMaterial.opacity = 0;
    }

    function startCountdown(timeNow: number, fromValue: number, stepMs = 350) {
      resetBallForCountdown();
      countdownStepMs = stepMs;
      serveResumeAt = timeNow + fromValue * stepMs;
      lastServeCountdownValue = fromValue;
      renderServeCountdownDigit(fromValue);
    }

    function startServeCountdown(timeNow: number) {
      startCountdown(timeNow, 3, 350);
    }

    function clearCenterMotif() {
      centerMotifBricks.forEach((brick) => {
        if (brick.mesh) scene.remove(brick.mesh);
      });
      centerMotifBricks = [];
      motifMirrorSign = 1;
      motifMirrorBurstUntil = 0;
    }

    function spawnCenterMotif() {
      clearCenterMotif();
      const layout = getMotifLayoutSpec(currentLevel, width, height);
      motifLastFlipAt = performance.now();

      buildMotifBrickSpecs(layout).forEach((spec) => {
        const color = layout.palette[spec.colorIndex];
        const material = new THREE.MeshBasicMaterial({ color });
        const mesh = new THREE.Mesh(getBrickGeometry(layout.block, layout.block), material);
        mesh.position.set(spec.localX, spec.localY, 3);
        scene.add(mesh);

        centerMotifBricks.push({
          id: `motif_${currentLevel}_${spec.row}_${spec.col}`,
          x: spec.localX,
          y: spec.localY,
          w: layout.block,
          h: layout.block,
          hitsMax: 2,
          hitsLeft: 2,
          isCenterMotif: true,
          motifLocalX: spec.localX,
          motifLocalY: spec.localY,
          state: "active",
          mesh,
          color,
        });
      });
    }

    function updateCenterMotif(timeNow: number) {
      if (currentState !== GameState.GAMEPLAY || centerMotifBricks.length === 0) return;

      const gameplayElapsed = timeNow - gameplayStartTime;
      const rotation = computeMotifRotation(timeNow, currentLevel, gameplayElapsed);
      const alive = centerMotifBricks.filter((brick) => brick.hitsLeft > 0);
      const aliveRatio = alive.length / centerMotifBricks.length;

      if (shouldTriggerMotifMirrorFlip(currentLevel, timeNow, motifLastFlipAt, aliveRatio)) {
        motifMirrorSign *= -1;
        motifMirrorBurstUntil = timeNow + 1200;
        motifLastFlipAt = timeNow;
        shakeIntensity = Math.max(shakeIntensity, 14);
        playTone(110, 0.08, 0.05, "sawtooth");
      }

      centerMotifBricks.forEach((brick) => {
        if (!brick.mesh || brick.hitsLeft <= 0 || brick.motifLocalX === undefined || brick.motifLocalY === undefined) {
          return;
        }
        const world = getMotifBrickWorldPosition(
          brick.motifLocalX,
          brick.motifLocalY,
          rotation,
          motifMirrorSign,
        );
        brick.x = world.x;
        brick.y = world.y;
        const burst = getMotifMirrorBurstTilt(motifMirrorBurstUntil, timeNow, motifMirrorSign);
        brick.mesh.position.set(world.x, world.y, 3);
        brick.mesh.rotation.z = rotation;
        brick.mesh.rotation.x = burst.pitch;
        brick.mesh.rotation.y = burst.yaw;
        brick.mesh.scale.set(burst.scaleX, 1, 1);
      });
    }

    // --- BRICK AND GEOMETRY UTILITIES ---
    // Generate individual brick meshes with high-contrast materials
    const brickGeomCache: Record<string, THREE.BoxGeometry> = {};
    function getBrickGeometry(w: number, h: number): THREE.BoxGeometry {
      const key = `${w}_${h}`;
      if (!brickGeomCache[key]) {
        brickGeomCache[key] = new THREE.BoxGeometry(w, h, 14);
      }
      return brickGeomCache[key];
    }

    const AMIGA_COPPER_COLORS = [
      0xFF3366, // Row 0: Amiga Hot Red-Pink
      0xFF5500, // Row 1: Retro Copper Orange
      0xFFCC00, // Row 2: Gold Yellow
      0x33FF33, // Row 3: Lime Green
      0x00FFFF, // Row 4: Retro Cyan
      0x9D00FF, // Row 5: Amiga Purple
      0xFF00FF, // Row 6: Neon Pink Magenta
    ];
    const copperMaterials = AMIGA_COPPER_COLORS.map(color => new THREE.MeshBasicMaterial({ color }));

    const materialCache: Record<string, THREE.MeshBasicMaterial> = {
      active: new THREE.MeshBasicMaterial({ color: COLOR_INTRO_ACTIVE }),
      damaged1: new THREE.MeshBasicMaterial({ color: COLOR_WHITE }), // Flash white
      damaged2: new THREE.MeshBasicMaterial({ color: COLOR_INTRO_DAMAGED }), // Charcoal
      dead: new THREE.MeshBasicMaterial({ color: COLOR_INTRO_DEAD, transparent: true, opacity: 0.85 }), // Slate Grey
      playerScore: new THREE.MeshBasicMaterial({ color: COLOR_PLAYER }),
      aiScore: new THREE.MeshBasicMaterial({ color: COLOR_AI }),
      winGreen: new THREE.MeshBasicMaterial({ color: COLOR_WIN_GREEN }),
      lossRed: new THREE.MeshBasicMaterial({ color: COLOR_LOSS_RED }),
    };
    const monsterEyeMaterial = new THREE.MeshBasicMaterial({ color: 0xfff7ed });
    const monsterShotMaterial = new THREE.MeshBasicMaterial({ color: COLOR_LOSS_RED });
    const monsterShotGeom = new THREE.BoxGeometry(10, 10, 10);
    const playerShotMaterial = new THREE.MeshBasicMaterial({
      color: COLOR_PLAYER,
      transparent: true,
      opacity: 0.82,
    });
    const playerShotGeom = new THREE.BoxGeometry(26, 3, 2);
    const paintDripGeom = new THREE.BoxGeometry(1, 1, 6);
    const paintDripMat = new THREE.MeshBasicMaterial({
      color: COLOR_LOSS_RED,
      transparent: true,
      opacity: 0.92,
    });

    // Procedurally create jagged black "crack" lines over damaged bricks
    function applyCrackOverlay(mesh: THREE.Mesh, w: number, h: number) {
      // Create a small group to host lines on the front face of the brick
      const group = new THREE.Group();
      mesh.add(group);

      const crackMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
      
      // Draw 2 jagged custom diagonal lines for authentic brutalist cracking
      const p1 = [];
      p1.push(new THREE.Vector3(-w/2, h/2, 7.1));
      p1.push(new THREE.Vector3(-w/6, h/5, 7.1));
      p1.push(new THREE.Vector3(w/6, -h/6, 7.1));
      p1.push(new THREE.Vector3(w/2, -h/2, 7.1));
      const geom1 = new THREE.BufferGeometry().setFromPoints(p1);
      const line1 = new THREE.Line(geom1, crackMat);
      group.add(line1);

      const p2 = [];
      p2.push(new THREE.Vector3(-w/3, -h/2, 7.1));
      p2.push(new THREE.Vector3(-w/10, -h/4, 7.1));
      p2.push(new THREE.Vector3(w/5, h/8, 7.1));
      p2.push(new THREE.Vector3(w/2, h/3, 7.1));
      const geom2 = new THREE.BufferGeometry().setFromPoints(p2);
      const line2 = new THREE.Line(geom2, crackMat);
      group.add(line2);

      return group;
    }

    function measureWordLayout(word: string, scaleFactor: number) {
      const charCount = word.length;
      const spacingUnits = 1; // Gap spaces between letters
      const brickGap = 2;     // Space in pixels

      // Target sizing constraints
      const maxLetterWidth = (width * scaleFactor) / charCount;
      const letterBrickW = Math.max(7, Math.floor((maxLetterWidth - spacingUnits * 5) / 5));
      const letterBrickH = Math.max(7, Math.floor(letterBrickW * 0.8));

      const charWidth = 5 * letterBrickW + 4 * brickGap;
      const charSpacing = spacingUnits * letterBrickW;
      const totalWidth = charCount * charWidth + (charCount - 1) * charSpacing;
      const totalHeight = 7 * letterBrickH + 6 * brickGap;

      return {
        brickGap,
        charCount,
        charSpacing,
        charWidth,
        letterBrickH,
        letterBrickW,
        totalHeight,
        totalWidth,
      };
    }

    // Main layout procedural grid calculator
    function layOutWordBricks(
      word: string,
      scaleFactor: number,
      centerY: number = 0,
      isHard: boolean = false,
      occupiedCells?: Set<string>,
      occupancyCell?: { w: number; h: number }
    ): Brick[] {
      const layout = measureWordLayout(word, scaleFactor);
      const {
        brickGap,
        charCount,
        charSpacing,
        charWidth,
        letterBrickH,
        letterBrickW,
        totalHeight,
        totalWidth,
      } = layout;

      const startX = -totalWidth / 2;
      const startY = centerY + totalHeight / 2;
      const cellW = occupancyCell?.w ?? letterBrickW + brickGap;
      const cellH = occupancyCell?.h ?? letterBrickH + brickGap;

      const results: Brick[] = [];

      for (let i = 0; i < charCount; i++) {
        const char = word[i];
        if (char === " ") continue;
        const matrix = FONT_5X7[char];
        if (!matrix) continue;

        const charStartX = startX + i * (charWidth + charSpacing);

        for (let r = 0; r < 7; r++) {
          for (let c = 0; c < 5; c++) {
            if (matrix[r][c] === 1) {
              const bX = charStartX + c * (letterBrickW + brickGap) + letterBrickW / 2;
              let bY = startY - r * (letterBrickH + brickGap) - letterBrickH / 2;

              if (occupiedCells) {
                const direction = centerY >= 0 ? 1 : -1;
                let guard = 0;
                let cellKey = `${Math.round(bX / cellW)}:${Math.round(bY / cellH)}`;
                while (occupiedCells.has(cellKey) && guard < 12) {
                  bY += direction * cellH;
                  cellKey = `${Math.round(bX / cellW)}:${Math.round(bY / cellH)}`;
                  guard += 1;
                }
                occupiedCells.add(cellKey);
              }

              const brickId = `brick_${word}_${i}_${r}_${c}`;
              const hMax = isHard ? 3 : 1;

              const geometry = getBrickGeometry(letterBrickW, letterBrickH);
              const hexColor = AMIGA_COPPER_COLORS[r % AMIGA_COPPER_COLORS.length];
              const material = copperMaterials[r % AMIGA_COPPER_COLORS.length];
              const bMesh = new THREE.Mesh(geometry, material);
              bMesh.position.set(bX, bY, 0);
              scene.add(bMesh);

              results.push({
                id: brickId,
                x: bX,
                y: bY,
                w: letterBrickW,
                h: letterBrickH,
                hitsMax: hMax,
                hitsLeft: hMax,
                state: "active",
                mesh: bMesh,
                color: hexColor,
              });
            }
          }
        }
      }

      return results;
    }

    function registerWordOccupancy(
      wordBricks: Brick[],
      occupiedCells: Set<string>,
      cellW: number,
      cellH: number
    ) {
      for (const b of wordBricks) {
        const minX = b.x - b.w / 2;
        const maxX = b.x + b.w / 2;
        const minY = b.y - b.h / 2;
        const maxY = b.y + b.h / 2;
        const gx0 = Math.floor(minX / cellW);
        const gx1 = Math.ceil(maxX / cellW);
        const gy0 = Math.floor(minY / cellH);
        const gy1 = Math.ceil(maxY / cellH);
        for (let gx = gx0; gx <= gx1; gx++) {
          for (let gy = gy0; gy <= gy1; gy++) {
            occupiedCells.add(`${gx}:${gy}`);
          }
        }
      }
    }

    function layOutStackedTitleBricks(): Brick[] {
      const twistedLayout = measureWordLayout("TWISTED", 0.68);
      const stacksLayout = measureWordLayout("STACKS", 0.70);
      const rowGap = Math.max(48, Math.max(twistedLayout.letterBrickH, stacksLayout.letterBrickH) * 2.45);
      const twistedCenterY = (twistedLayout.totalHeight + rowGap) / 2;
      const stacksCenterY = -(stacksLayout.totalHeight + rowGap) / 2;
      const occupiedCells = new Set<string>();
      const occupancyCell = {
        w: Math.max(twistedLayout.letterBrickW, stacksLayout.letterBrickW) + 2,
        h: Math.max(twistedLayout.letterBrickH, stacksLayout.letterBrickH) + 2,
      };

      const twistedBricks = layOutWordBricks("TWISTED", 0.68, twistedCenterY, true);
      registerWordOccupancy(twistedBricks, occupiedCells, occupancyCell.w, occupancyCell.h);
      const stacksBricks = layOutWordBricks(
        "STACKS",
        0.70,
        stacksCenterY,
        true,
        occupiedCells,
        occupancyCell
      );
      return [...twistedBricks, ...stacksBricks];
    }

    function layOutLevelNineLeaderBricks(): Brick[] {
      const leaderName = normalizePlayerName(highScoresRef.current[0]?.name || "PLAYER") || "PLAYER";
      const beatBricks = layOutWordBricks("BEAT", 0.32, height * 0.18, false);
      const nameBricks = layOutWordBricks(leaderName, Math.min(0.64, 0.18 + leaderName.length * 0.07), height * 0.02, false);
      const backdropBricks = [...beatBricks, ...nameBricks];
      backdropBricks.forEach((brick) => {
        brick.hitsLeft = 0;
        brick.state = "dead";
        brick.color = COLOR_INTRO_DEAD;
        if (brick.mesh) {
          const material = materialCache.dead.clone();
          material.opacity = 0.28;
          brick.mesh.material = material;
          brick.mesh.position.z = -24;
          brick.mesh.scale.z = 0.35;
        }
      });
      return backdropBricks;
    }

    // Spectacular particle explosion of current active letters/bricks on skip or transit
    function explodeCurrentIntroductionBricks(onComplete: () => void) {
      if (bricks.length === 0) {
        onComplete();
        return;
      }

      shakeIntensity = 22; // Extreme screen shake for heavy impact

      bricks.forEach((b) => {
        if (!b.mesh) return;

        // Determine matching spark color
        let col = b.color !== undefined ? b.color : COLOR_INTRO_ACTIVE;
        if (b.state === "damaged1") col = COLOR_WHITE;
        else if (b.state === "damaged2") col = COLOR_INTRO_DAMAGED;
        else if (b.state === "dead") col = COLOR_INTRO_DEAD;

        // Spawn a blast of dynamic particles for each letter block
        const numSparks = 6;
        const sparkGeom = new THREE.BoxGeometry(4, 4, 4);
        const sparkMat = new THREE.MeshBasicMaterial({ color: col });

        for (let i = 0; i < numSparks; i++) {
          const sMesh = new THREE.Mesh(sparkGeom, sparkMat);
          sMesh.position.set(b.x, b.y, 0);
          scene.add(sMesh);

          // Fly outward radially from center
          const angle = Math.atan2(b.y, b.x) + (Math.random() - 0.5) * 1.5;
          const speed = 250 + Math.random() * 450;

          particles.push({
            id: `intro_skip_boom_${performance.now()}_${i}_${Math.random()}`,
            x: b.x,
            y: b.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            vz: (Math.random() - 0.5) * 180, // Multi-dimensional spray
            life: 1.0,
            color: col,
            mesh: sMesh,
          });
        }

        // Cleanly remove from ThreeJS scene and dispose geometries
        scene.remove(b.mesh);
        b.mesh.geometry?.dispose();
      });

      // Clear layout array immediately so background physics does not hit them
      bricks = [];

      // 450ms delay for full glorious debris dispersion before launching battle gameplay
      setTimeout(() => {
        onComplete();
      }, 450);
    }

    function triggerSkipIntro() {
      rigStateRef.current = "normal";
      explodeCurrentIntroductionBricks(() => {
        transitionToNextIntroState(GameState.GAMEPLAY);
      });
    }

    // Setup active bricks based on Current State
    function transitionToNextIntroState(targetState: GameState) {
      // Dispose prior scene bricks
      bricks.forEach((b) => {
        if (b.mesh) {
          if (b.crackGroup) {
            b.mesh.remove(b.crackGroup);
          }
          scene.remove(b.mesh);
        }
      });
      bricks = [];

      scoreBricks.forEach((sb) => {
        if (sb.mesh) scene.remove(sb.mesh);
      });
      scoreBricks = [];

      endBricks.forEach((eb) => {
        if (eb.mesh) scene.remove(eb.mesh);
      });
      endBricks = [];

      clearMonsterEntities();
      clearPlayerShots();
      clearCenterMotif();
      pendingNextLevelAt = 0;
      clearServeCountdown();

      currentState = targetState;
      setGameState(targetState);
      
      // Update our transitionRef to support explosive intro skip
      if (
        currentState === GameState.INTRO_TWISTED ||
        currentState === GameState.INTRO_STACKS ||
        currentState === GameState.INTRO_TWISTEDSTACKS
      ) {
        transitionRef.current = () => triggerSkipIntro();
      } else {
        transitionRef.current = transitionToNextIntroState;
      }

      if (currentState === GameState.INTRO_TWISTEDSTACKS) {
        // Lay out "TWISTEDSTACKS" as staggered dual lines for premium visual stacking using maximum possible size
        bricks = layOutStackedTitleBricks();
        launchBall(baseSpeed);
      } else if (currentState === GameState.GAMEPLAY) {
        // Game Start Initialization
        endOutcome = null;
        setEndAction(null);
        cornerComboCount = 0;
        cornerTutorialSeen = false;
        cornerTutorialFlash = 0;
        scorePlayer = MATCH_LIVES;
        scoreAI = MATCH_LIVES;
        if (currentLevel === 1) {
          playerPoints = 0;
        }
        pointMultiplier = 1;
        playerScale = 1.0;
        aiScale = 1.0;
        playerTargetScale = 1.0;
        aiTargetScale = 1.0;
        gameplayStartTime = performance.now();

        const startProfile = getLevelProfile(currentLevel);
        currentSpeed = computeLevelStartSpeed(
          baseSpeed,
          difficultyRef.current,
          startProfile.speedBonus,
        );
        ballMaterial.color.setHex(COLOR_WHITE);
        championRevealAt = 0;
        championBurstDone = false;
        nextMusicTickAt = 0;
        musicStep = 0;

        // Ensure intro-level remains textured inside as background
        bricks.forEach((b) => {
          if (b.mesh) {
            b.mesh.material = materialCache.dead;
            // Reduce structural mesh scale to make background non-distracting but still bounceable
            b.mesh.scale.set(0.92, 0.92, 0.5);
          }
        });

        rebuildScoreDigits();
        spawnCenterMotif();
        if (currentLevel >= MAX_LEVEL) {
          bricks.push(...layOutLevelNineLeaderBricks());
        }
        startLevelIntro(performance.now(), currentLevel);
        spawnLevelMonsters();
      }
    }

    // Giant Block Digit Score generator
    function generateScoreDigitBricks(
      digit: number,
      centerX: number,
      owner: "player" | "ai"
    ): Brick[] {
      const scaleW = BRICK_PIXEL_SIZE;
      const scaleH = BRICK_PIXEL_SIZE;
      const gap = BRICK_PIXEL_GAP;
      const gridMatrix = FONT_5X7[String(digit)] || FONT_5X7["0"];

      // Total Matrix Offset sizing to center the digit
      const digitW = 5 * scaleW + 4 * gap;
      const digitH = 7 * scaleH + 6 * gap;

      const scoreResults: Brick[] = [];
      const mat = owner === "player" ? materialCache.playerScore : materialCache.aiScore;

      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 5; c++) {
          if (gridMatrix[r][c] === 1) {
            const bx = centerX - digitW / 2 + c * (scaleW + gap) + scaleW / 2;
            const by = 0 - digitH / 2 + (6 - r) * (scaleH + gap) + scaleH / 2;

            const geometry = getBrickGeometry(scaleW, scaleH);
            const sMesh = new THREE.Mesh(geometry, mat);
            sMesh.position.set(bx, by, -5); // Position slightly behind main game elements
            scene.add(sMesh);

            scoreResults.push({
              id: `score_${owner}_${r}_${c}`,
              x: bx,
              y: by,
              w: scaleW,
              h: scaleH,
              hitsMax: 2,
              hitsLeft: 2,
              isScoreBrick: true,
              scoreOwner: owner,
              state: "active",
              mesh: sMesh,
            });
          }
        }
      }

      return scoreResults;
    }

    // Rebuild active player scores inside threeJS
    function rebuildScoreDigits() {
      scoreBricks.forEach((sb) => {
        if (sb.mesh) scene.remove(sb.mesh);
      });
      scoreBricks = [];

      if (currentState !== GameState.GAMEPLAY) return;

      const offsetDist = width * 0.26;
      const leftDigits = generateScoreDigitBricks(scorePlayer, -offsetDist, "player");
      const rightDigits = generateScoreDigitBricks(scoreAI, offsetDist, "ai");
      scoreBricks = [...leftDigits, ...rightDigits];
    }

    // --- SPARK / PARTICLE SYSTEM ---
    function triggerBallGlint(hexColor: number, intensity = 1) {
      ball.glint = Math.max(ball.glint, clamp(intensity, 0.35, 1.3));
      ball.glintColor = hexColor;
      ballGlintMaterial.color.setHex(hexColor);
      ballGlintMesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
    }

    function spawnSparks(x: number, y: number, hexColor: number) {
      const numSparks = 3 + Math.floor(Math.random() * 3);
      const sparkGeom = new THREE.BoxGeometry(3, 3, 3);
      const sparkMat = new THREE.MeshBasicMaterial({ color: hexColor });

      for (let i = 0; i < numSparks; i++) {
        const sMesh = new THREE.Mesh(sparkGeom, sparkMat);
        sMesh.position.set(x, y, 0);
        scene.add(sMesh);

        // Disperse in beautiful three dimensions
        const angle = Math.random() * Math.PI * 2;
        const sparkSpeed = 160 + Math.random() * 200;
        
        particles.push({
          id: `spark_${performance.now()}_${i}_${Math.random()}`,
          x: x,
          y: y,
          vx: Math.cos(angle) * sparkSpeed,
          vy: Math.sin(angle) * sparkSpeed,
          vz: (Math.random() - 0.2) * 120, // Velocity towards screen
          life: 1.0,
          color: hexColor,
          mesh: sMesh,
        });
      }
    }

    function spawnMonsterPaintDrips(source: Brick, amount = 2) {
      if (!source.mesh || source.hitsLeft < 0) return;
      for (let i = 0; i < amount; i++) {
        const dripMaterial = paintDripMat.clone();
        dripMaterial.color.setHex(COLOR_LOSS_RED);
        const drip = new THREE.Mesh(paintDripGeom, dripMaterial);
        const dripW = 2 + Math.random() * 3;
        const dripH = 10 + Math.random() * 22;
        drip.scale.set(dripW, dripH, 1);
        drip.position.set(
          source.x + (Math.random() - 0.5) * source.w * 0.9,
          source.y - source.h * 0.15,
          6,
        );
        scene.add(drip);
        particles.push({
          id: `monster_drip_${performance.now()}_${i}_${Math.random()}`,
          x: drip.position.x,
          y: drip.position.y,
          vx: (Math.random() - 0.5) * 16,
          vy: -(60 + Math.random() * 110),
          vz: 0,
          life: 1.0,
          decay: 1.2 + Math.random() * 1.1,
          gravity: -200,
          color: COLOR_LOSS_RED,
          mesh: drip,
        });
      }
    }

    function spawnPaintDrips(amount = 4) {
      if (endBricks.length === 0) return;
      const redSources = endBricks.filter(
        (b) =>
          b.hitsLeft > 0 &&
          b.state === "active" &&
          b.color === COLOR_LOSS_RED,
      );
      if (redSources.length === 0) return;

      for (let i = 0; i < amount; i++) {
        const source = redSources[Math.floor(Math.random() * redSources.length)];
        if (!source) continue;
        const dripMaterial = paintDripMat.clone();
        dripMaterial.color.setHex(COLOR_LOSS_RED);
        const drip = new THREE.Mesh(paintDripGeom, dripMaterial);
        const dripW = 3 + Math.random() * 4;
        const dripH = 12 + Math.random() * 32;
        drip.scale.set(dripW, dripH, 1);
        drip.position.set(
          source.x + (Math.random() - 0.5) * source.w,
          source.y - source.h * 0.2,
          8,
        );
        scene.add(drip);

        particles.push({
          id: `paint_drip_${performance.now()}_${i}_${Math.random()}`,
          x: drip.position.x,
          y: drip.position.y,
          vx: (Math.random() - 0.5) * 12,
          vy: -(80 + Math.random() * 130),
          vz: 0,
          life: 1.0,
          decay: 1.8 + Math.random() * 1.4,
          gravity: -240,
          color: COLOR_LOSS_RED,
          mesh: drip,
        });
      }
    }

    function damageBrick(b: Brick, fallbackColor: number, soundOwner: "player" | "ai" | "brick" = "brick") {
      if (b.hitsLeft <= 0 || !b.mesh) return;

      const ownerColor = b.scoreOwner === "player" ? COLOR_PLAYER : b.scoreOwner === "ai" ? COLOR_AI : fallbackColor;
      playHitSound(b.isScoreBrick ? 0.16 : 0.22, soundOwner);
      b.hitsLeft--;

      if (b.isMonster) {
        spawnMonsterPaintDrips(b, b.hitsLeft <= 0 ? 4 : 2);
        if (b.hitsLeft === 1) {
          b.state = "damaged1";
          if (b.mesh.material instanceof THREE.MeshBasicMaterial) {
            b.mesh.material.color.setHex(0xdc2626);
          }
          applyCrackOverlay(b.mesh, b.w, b.h);
          shakeIntensity = Math.max(shakeIntensity, 4);
          spawnSparks(b.x, b.y, COLOR_LOSS_RED);
        } else if (b.hitsLeft <= 0) {
          b.state = "dead";
          b.mesh.visible = false;
          if (b.crackGroup) b.mesh.remove(b.crackGroup);
          shakeIntensity = Math.max(shakeIntensity, 3);
          spawnSparks(b.x, b.y, COLOR_LOSS_RED);
        }
        registerMonsterBrickHit(b);
        return;
      }

      if (b.hitsLeft === 2) {
        b.state = "damaged1";
        b.mesh.material = materialCache.damaged1;
        shakeIntensity = Math.max(shakeIntensity, 6);
        applyCrackOverlay(b.mesh, b.w, b.h);
        spawnSparks(b.x, b.y, COLOR_WHITE);
      } else if (b.hitsLeft === 1) {
        b.state = "damaged2";
        if (b.isScoreBrick) {
          b.mesh.material = new THREE.MeshBasicMaterial({ color: ownerColor, transparent: true, opacity: 0.38 });
        } else {
          b.mesh.material = materialCache.damaged2;
        }
        shakeIntensity = Math.max(shakeIntensity, 4);
        spawnSparks(b.x, b.y, b.isScoreBrick ? ownerColor : COLOR_INTRO_DAMAGED);
      } else if (b.hitsLeft === 0) {
        b.state = "dead";
        if (currentState !== GameState.GAMEPLAY || b.isScoreBrick || b.isMonster || b.isCenterMotif) {
          b.mesh.visible = false;
        } else {
          b.mesh.material = materialCache.dead;
        }
        if (b.crackGroup) {
          b.mesh.remove(b.crackGroup);
        }
        b.mesh.children.forEach((child: any) => {
          b.mesh?.remove(child);
        });
        shakeIntensity = Math.max(shakeIntensity, 2);
        spawnSparks(b.x, b.y, b.color !== undefined ? b.color : ownerColor);
      }

    }

    function explodeEndBricks() {
      if (endBricks.length === 0) return;

      shakeIntensity = Math.max(shakeIntensity, 24);
      playTone(98, 0.13, 0.07, "sawtooth");
      setTimeout(() => playTone(392, 0.08, 0.035, "square"), 45);

      endBricks.forEach((brick) => {
        if (!brick.mesh) return;
        brick.mesh.visible = true;
        brick.mesh.position.z = 16;

        const angle = Math.atan2(brick.y, brick.x) + (Math.random() - 0.5) * 1.15;
        const speed = 300 + Math.random() * 620;

        particles.push({
          id: `end_boom_${performance.now()}_${brick.id}_${Math.random()}`,
          x: brick.x,
          y: brick.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          vz: 80 + Math.random() * 260,
          life: 1.0,
          color: brick.color ?? COLOR_WIN_GREEN,
          mesh: brick.mesh,
        });
      });

      endBricks = [];
    }

    function clearMonsterEntities() {
      monsterShots.forEach((shot) => scene.remove(shot.mesh));
      monsterShots = [];
      monsters = [];
    }

    function clearPlayerShots() {
      playerShots.forEach((shot) => scene.remove(shot.mesh));
      playerShots = [];
    }

    function clearMonsterShotsFor(monsterId: string) {
      for (let i = monsterShots.length - 1; i >= 0; i--) {
        if (monsterShots[i].ownerMonsterId !== monsterId) continue;
        scene.remove(monsterShots[i].mesh);
        monsterShots.splice(i, 1);
      }
    }

    function spawnMonsterExplosionBurst(x: number, y: number) {
      const burstPalette = [COLOR_LOSS_RED, 0xdc2626, 0xf87171, COLOR_WHITE, 0x991b1b];
      for (let i = 0; i < 52; i++) {
        const angle = (i / 52) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const radius = 8 + Math.random() * 24;
        spawnSparks(
          x + Math.cos(angle) * radius,
          y + Math.sin(angle) * radius,
          burstPalette[i % burstPalette.length],
        );
      }
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 160 + Math.random() * 320;
        const dripMaterial = paintDripMat.clone();
        dripMaterial.color.setHex(COLOR_LOSS_RED);
        const drip = new THREE.Mesh(paintDripGeom, dripMaterial);
        drip.scale.set(3 + Math.random() * 5, 14 + Math.random() * 28, 1);
        drip.position.set(x, y, 9);
        scene.add(drip);
        particles.push({
          id: `monster_burst_drip_${performance.now()}_${i}_${Math.random()}`,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          vz: 50 + Math.random() * 90,
          life: 1.0,
          decay: 0.5 + Math.random() * 0.35,
          gravity: -130,
          color: COLOR_LOSS_RED,
          mesh: drip,
        });
      }
      const shockMaterial = new THREE.MeshBasicMaterial({
        color: COLOR_LOSS_RED,
        transparent: true,
        opacity: 0.72,
      });
      const shock = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 2), shockMaterial);
      shock.position.set(x, y, 7);
      scene.add(shock);
      particles.push({
        id: `monster_shock_${performance.now()}_${Math.random()}`,
        x,
        y,
        vx: 0,
        vy: 0,
        life: 1.0,
        decay: 0.34,
        expand: true,
        color: COLOR_LOSS_RED,
        mesh: shock,
      });
    }

    function explodeMonster(monster: {
      id: string;
      x: number;
      y: number;
      nextShotAt: number;
      explodedAt60: boolean;
      bricks: Brick[];
    }) {
      if (monster.explodedAt60) return;
      monster.explodedAt60 = true;
      monster.nextShotAt = Number.POSITIVE_INFINITY;
      clearMonsterShotsFor(monster.id);

      shakeIntensity = Math.max(shakeIntensity, 26);
      addPlayerPoints(110 * pointMultiplier);
      playTone(73.42, 0.12, 0.06, "sawtooth");
      setTimeout(() => playTone(220, 0.07, 0.04, "square"), 40);
      setTimeout(() => playTone(392, 0.08, 0.035, "triangle"), 95);
      spawnMonsterExplosionBurst(monster.x, monster.y);

      monster.bricks.forEach((brick) => {
        if (!brick.mesh || brick.hitsLeft <= 0) return;
        brick.hitsLeft = 0;
        brick.state = "dead";
        brick.mesh.visible = true;
        brick.mesh.position.z = 16;
        const angle = Math.atan2(brick.y - monster.y, brick.x - monster.x) + (Math.random() - 0.5) * 0.9;
        const speed = 240 + Math.random() * 520;
        particles.push({
          id: `monster_boom_${performance.now()}_${brick.id}_${Math.random()}`,
          x: brick.x,
          y: brick.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          vz: 80 + Math.random() * 260,
          life: 1.0,
          color: brick.color ?? COLOR_LOSS_RED,
          mesh: brick.mesh,
        });
      });
    }

    function registerMonsterBrickHit(brick: Brick) {
      const parent = monsters.find((monster) => monster.bricks.some((b) => b.id === brick.id));
      if (!parent || parent.explodedAt60) return;
      parent.hitCount += 1;
      if (shouldMonsterExplode(parent.hitCount, parent.bricks)) {
        explodeMonster(parent);
      }
    }

    function createBlockMonster(id: string, x: number, y: number, phase: number, variantIndex: number) {
      const variant = getMonsterVariant(variantIndex);
      const block = computeMonsterBlockSize(width);
      const bodyMaterial = new THREE.MeshBasicMaterial({ color: variant.bodyColor });
      const monster: {
        id: string;
        x: number;
        y: number;
        phase: number;
        nextShotAt: number;
        explodedAt60: boolean;
        hitCount: number;
        variant: ReturnType<typeof getMonsterVariant>;
        bricks: Brick[];
      } = {
        id,
        x,
        y,
        phase,
        nextShotAt: performance.now() + 1800 + Math.random() * 1200,
        explodedAt60: false,
        hitCount: 0,
        variant,
        bricks: [],
      };

      buildMonsterBrickCells(x, y, variant, block).forEach((cell) => {
        const mesh = new THREE.Mesh(
          getBrickGeometry(block, block),
          cell.isEye ? monsterEyeMaterial : bodyMaterial,
        );
        mesh.position.set(cell.x, cell.y, 4);
        scene.add(mesh);

        const brick: Brick = {
          id: `${id}_${cell.row}_${cell.col}`,
          x: cell.x,
          y: cell.y,
          w: block,
          h: block,
          hitsMax: cell.hitsMax,
          hitsLeft: cell.hitsMax,
          isMonster: true,
          state: "active",
          mesh,
          color: cell.isEye ? COLOR_WHITE : variant.bodyColor,
        };
        monster.bricks.push(brick);
        bricks.push(brick);
      });
      monsters.push(monster);
    }

    function spawnLevelMonsters() {
      const profile = getLevelProfile(currentLevel);
      getLevelMonsterSpawns(currentLevel, profile.monsterCount, width, height).forEach((spawn) => {
        createBlockMonster(spawn.id, spawn.x, spawn.y, spawn.phase, spawn.variantIndex);
      });
    }

    function spawnChampionCelebration() {
      if (championBurstDone) return;
      championBurstDone = true;
      ballMaterial.color.setHex(0xffd700);
      shakeIntensity = 28;
      for (let i = 0; i < 96; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * Math.min(width, height) * 0.35;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        const palette = [COLOR_PLAYER, COLOR_WIN_GREEN, COLOR_INTRO_ACTIVE, COLOR_WHITE, 0xffd700];
        spawnSparks(px, py, palette[i % palette.length]);
      }
      HARMONIC_SCALE.forEach((freq, idx) => {
        setTimeout(() => playTone(freq * 1.25, 0.06, 0.04, "triangle"), idx * 90);
      });
    }

    function fireMonsterShot(monster: { id: string; x: number; y: number; phase: number; nextShotAt: number }) {
      const profile = getLevelProfile(currentLevel);
      const speed = monsterShotSpeed(currentLevel, profile.speedBonus);
      const angle = monsterShotAngle(
        currentLevel,
        monster.x,
        monster.y,
        rackets.left.x,
        rackets.bottom.y,
      );
      const mesh = new THREE.Mesh(monsterShotGeom, monsterShotMaterial);
      mesh.position.set(monster.x, monster.y, 12);
      scene.add(mesh);
      monsterShots.push({
        id: `shot_${performance.now()}_${Math.random()}`,
        ownerMonsterId: monster.id,
        x: monster.x,
        y: monster.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 4.0,
        mesh,
      });
    }

    function updateMonsterSystem(timeNow: number, dt: number) {
      const levelProfile = getLevelProfile(currentLevel);
      if (currentState !== GameState.GAMEPLAY || levelProfile.monsterCount === 0) return;
      const servePaused = serveResumeAt > 0;

      monsters.forEach((monster) => {
        if (monster.explodedAt60) return;
        const alive = monster.bricks.some((b) => b.hitsLeft > 0);
        if (!alive) return;
        const { x: wobbleX, y: wobbleY } = getMonsterWobble(
          timeNow,
          monster.phase,
          currentLevel,
          levelProfile.wobbleScale,
        );
        monster.bricks.forEach((brick) => {
          if (!brick.mesh || brick.hitsLeft <= 0) return;
          const { row, col } = parseMonsterBrickGrid(brick.id);
          const blockW = brick.w + 2;
          const position = getMonsterBrickGridPosition(
            monster.x,
            monster.y,
            row,
            col,
            blockW,
            wobbleX,
            wobbleY,
          );
          brick.x = position.x;
          brick.y = position.y;
          brick.mesh.position.set(brick.x, brick.y, 4);
          brick.mesh.scale.setScalar(getMonsterPulseScale(timeNow, monster.phase));
        });
        if (!servePaused && timeNow > monster.nextShotAt) {
          fireMonsterShot(monster);
          monster.nextShotAt = getNextMonsterShotDelay(
            timeNow,
            currentLevel,
            levelProfile.monsterShotScale,
          );
        }
      });

      if (servePaused) return;

      for (let i = monsterShots.length - 1; i >= 0; i--) {
        const shot = monsterShots[i];
        shot.life -= dt;
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
        shot.mesh.position.set(shot.x, shot.y, 12);
        shot.mesh.rotation.z += dt * 7;

        const racketHit = getMonsterShotRacketHit(shot.x, shot.y, {
          left: rackets.left,
          bottom: rackets.bottom,
          right: rackets.right,
          top: rackets.top,
          playerScale,
          aiScale,
          thickness: racketThickness,
        });

        if (racketHit) {
          if (racketHit === "player") {
            playerTargetScale = Math.max(0.24, playerTargetScale * 0.93);
            cornerComboPulse = Math.max(cornerComboPulse, 0.85);
          } else {
            aiTargetScale = Math.max(0.24, aiTargetScale * 0.93);
          }
          shakeIntensity = Math.max(shakeIntensity, 10);
          playScoreLossSound();
          spawnSparks(shot.x, shot.y, racketHit === "ai" ? COLOR_AI : COLOR_LOSS_RED);
          scene.remove(shot.mesh);
          monsterShots.splice(i, 1);
        } else if (shot.life <= 0 || isMonsterShotOutOfBounds(shot.x, shot.y, width, height)) {
          scene.remove(shot.mesh);
          monsterShots.splice(i, 1);
        }
      }
    }

    function fireRacketStreakShot(aimX: number, aimY: number, timeNow: number) {
      if (currentState !== GameState.GAMEPLAY || serveResumeAt > 0 || timeNow < nextPlayerShotAt) return;
      nextPlayerShotAt = timeNow + 165;

      const leftLen = rackets.left.length * playerScale;
      const bottomLen = rackets.bottom.length * playerScale;
      const useLeft = Math.abs(aimX - rackets.left.x) <= Math.abs(aimY - rackets.bottom.y);

      let startX = 0;
      let startY = 0;
      let dirX = 0;
      let dirY = 0;
      if (useLeft) {
        startX = rackets.left.x + racketThickness * 0.65;
        startY = clamp(aimY, rackets.left.y - leftLen / 2 + 8, rackets.left.y + leftLen / 2 - 8);
        dirX = aimX - startX;
        dirY = aimY - startY;
      } else {
        startX = clamp(aimX, rackets.bottom.x - bottomLen / 2 + 8, rackets.bottom.x + bottomLen / 2 - 8);
        startY = rackets.bottom.y + racketThickness * 0.65;
        dirX = aimX - startX;
        dirY = aimY - startY;
      }

      const len = Math.max(1, Math.sqrt(dirX * dirX + dirY * dirY));
      const speed = 880 + currentLevel * 30;
      const mesh = new THREE.Mesh(playerShotGeom, playerShotMaterial);
      mesh.position.set(startX, startY, -5);
      mesh.rotation.z = Math.atan2(dirY, dirX);
      scene.add(mesh);
      playerShots.push({
        id: `player_shot_${performance.now()}_${Math.random()}`,
        x: startX,
        y: startY,
        vx: (dirX / len) * speed,
        vy: (dirY / len) * speed,
        life: 0.85,
        mesh,
      });
      playTone(HARMONIC_SCALE[hitNoteIndex % HARMONIC_SCALE.length] * 2.5, 0.03, 0.018, "square");
    }

    function updatePlayerShots(dt: number) {
      if (playerShots.length === 0) return;

      for (let i = playerShots.length - 1; i >= 0; i--) {
        const shot = playerShots[i];
        shot.life -= dt;
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
        shot.mesh.position.set(shot.x, shot.y, -5);
        shot.mesh.rotation.z += dt * 6;

        let destroyed = false;
        for (const brick of bricks) {
          if (!brick.isMonster || brick.hitsLeft <= 0 || !brick.mesh) continue;
          const hit = shot.x > brick.x - brick.w / 2 &&
            shot.x < brick.x + brick.w / 2 &&
            shot.y > brick.y - brick.h / 2 &&
            shot.y < brick.y + brick.h / 2;
          if (!hit) continue;

          const wasOneHitFromDeath = brick.hitsLeft <= 1;
          damageBrick(brick, COLOR_PLAYER, "player");
          addMonsterHitPoints(wasOneHitFromDeath || brick.hitsLeft <= 0);
          shakeIntensity = Math.max(shakeIntensity, 3);
          spawnSparks(shot.x, shot.y, COLOR_PLAYER);
          scene.remove(shot.mesh);
          playerShots.splice(i, 1);
          destroyed = true;
          break;
        }

        if (!destroyed) {
          const rightLen = rackets.right.length * aiScale;
          const topLen = rackets.top.length * aiScale;
          const hitRight = Math.abs(shot.x - rackets.right.x) < racketThickness * 1.1 &&
            shot.y > rackets.right.y - rightLen / 2 &&
            shot.y < rackets.right.y + rightLen / 2;
          const hitTop = Math.abs(shot.y - rackets.top.y) < racketThickness * 1.1 &&
            shot.x > rackets.top.x - topLen / 2 &&
            shot.x < rackets.top.x + topLen / 2;
          if (hitRight || hitTop) {
            aiTargetScale = Math.max(0.68, aiTargetScale * 0.993);
            addPlayerPoints(AI_RACKET_SHOT_SCORE);
            shakeIntensity = Math.max(shakeIntensity, 2);
            spawnSparks(shot.x, shot.y, COLOR_AI);
            playTone(220, 0.025, 0.012, "triangle");
            scene.remove(shot.mesh);
            playerShots.splice(i, 1);
            destroyed = true;
          }
        }

        if (!destroyed && (
          shot.life <= 0 ||
          shot.x < -width / 2 - 120 ||
          shot.x > width / 2 + 120 ||
          shot.y < -height / 2 - 120 ||
          shot.y > height / 2 + 120
        )) {
          scene.remove(shot.mesh);
          playerShots.splice(i, 1);
        }
      }
    }

    // --- GAMEPLAY END CARD ---
    function renderEndTypography(lines: string[], colorHex: number) {
      // Clear previous elements
      bricks.forEach(b => { if (b.mesh) scene.remove(b.mesh); });
      bricks = [];
      scoreBricks.forEach(sb => { if (sb.mesh) scene.remove(sb.mesh); });
      scoreBricks = [];
      clearCenterMotif();
      endBricks.forEach(eb => { if (eb.mesh) scene.remove(eb.mesh); });
      endBricks = [];

      const lineCount = lines.length;
      const spaceBetweenLines = 65; // Massive gap for awesome brutalism

      const brickW = Math.max(12, Math.floor((width * 0.58) / 36));
      const brickH = Math.floor(brickW * 1.1);
      const gap = 2;

      const charW = 5 * brickW + 4 * gap;
      const charSpacing = brickW * 2;

      const mat = new THREE.MeshBasicMaterial({ color: colorHex });

      lines.forEach((lineText, lineIdx) => {
        const len = lineText.length;
        const totalLineWidth = len * charW + (len - 1) * charSpacing;
        const startX = -totalLineWidth / 2;

        const startY = (lineCount - 1) * (7 * brickH + 6 * gap + spaceBetweenLines) / 2 - 
          lineIdx * (7 * brickH + 6 * gap + spaceBetweenLines);

        for (let i = 0; i < len; i++) {
          const char = lineText[i];
          if (char === " ") continue;
          const matrix = FONT_5X7[char];
          if (!matrix) continue;

          const charStartX = startX + i * (charW + charSpacing);

          for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 5; c++) {
              if (matrix[r][c] === 1) {
                const bx = charStartX + c * (brickW + gap) + brickW / 2;
                const by = startY - r * (brickH + gap) - brickH / 2;

                const geometry = brickW === 12 ? getBrickGeometry(brickW, brickH) : new THREE.BoxGeometry(brickW, brickH, 20);
                const eMesh = new THREE.Mesh(geometry, mat);
                eMesh.position.set(bx, by, 0);
                scene.add(eMesh);

                endBricks.push({
                  id: `end_${lineIdx}_${i}_${r}_${c}`,
                  x: bx,
                  y: by,
                  w: brickW,
                  h: brickH,
                  hitsMax: 2,
                  hitsLeft: 2,
                  state: "active",
                  mesh: eMesh,
                  color: colorHex,
                });
              }
            }
          }
        }
      });
    }

    // --- DYNAMIC VIEWPORT RESIZER ---
    function handleResize() {
      let newWidth = mountRef.current?.clientWidth || window.innerWidth;
      let newHeight = mountRef.current?.clientHeight || window.innerHeight;

      if (newWidth < 300) newWidth = window.innerWidth > 300 ? window.innerWidth : 800;
      if (newHeight < 200) newHeight = window.innerHeight > 200 ? window.innerHeight : 600;

      width = newWidth;
      height = newHeight;

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      camera.left = (-width / 2) * cameraZoomOut;
      camera.right = (width / 2) * cameraZoomOut;
      camera.top = (height / 2) * cameraZoomOut;
      camera.bottom = (-height / 2) * cameraZoomOut;
      camera.updateProjectionMatrix();
      syncLevelIntroOverlaySize();

      // Recalculate racket coordinates
      rackets.left.x = -width / 2 + 35;
      rackets.right.x = width / 2 - 35;
      rackets.bottom.y = -height / 2 + 35;
      rackets.top.y = height / 2 - 35;

      // Ensure appropriate letters fit cleanly inside the screen limits
      if (currentState === GameState.INTRO_TWISTEDSTACKS) {
        transitionToNextIntroState(GameState.INTRO_TWISTEDSTACKS);
      } else if (currentState === GameState.GAMEPLAY) {
        rebuildScoreDigits();
      } else if (currentState === GameState.END_SCREEN) {
        if (scorePlayer === 0) {
          renderEndTypography(["AI", "WINS"], COLOR_LOSS_RED);
        } else {
          renderEndTypography(playerWinLines, COLOR_WIN_GREEN);
        }
      }
    }
    window.addEventListener("resize", handleResize);

    // Bootstrapping: call handleResize to compute correct initial coordinates and trigger the first layout
    handleResize();

    // --- CORE ANIMATION & LAUNCH SYSTEM LOOP ---
    let lastTime = performance.now();
    let frameId: number;

    const gameLoop = (timeNow: number) => {
      try {
        frameId = requestAnimationFrame(gameLoop);

        let dt = (timeNow - lastTime) / 1000;
      lastTime = timeNow;

      // Cap delta time to prevent clipping during deep frame rate drops
      if (dt > 0.1) dt = 0.1;

      if (devLevelRequestRef.current !== null) {
        currentLevel = devLevelRequestRef.current;
        devLevelRequestRef.current = null;
        endActionRequestRef.current = null;
        endOutcome = null;
        setEndAction(null);
        winFlashActive = false;
        paintDripAccumulator = 0;
        pendingNextLevelAt = 0;
        transitionToNextIntroState(GameState.GAMEPLAY);
      }

      if (pendingNextLevelAt > 0 && timeNow >= pendingNextLevelAt) {
        pendingNextLevelAt = 0;
        transitionToNextIntroState(GameState.GAMEPLAY);
      }

      if (championRevealAt > 0 && timeNow >= championRevealAt) {
        championRevealAt = 0;
        spawnChampionCelebration();
        persistChampionUnlock();
        showEasterEggRef.current(true);
      }

      if (serveResumeAt > 0) {
        if (timeNow >= serveResumeAt) {
          clearServeCountdown();
          launchBall(currentSpeed);
        } else if (levelIntroActive) {
          animateLevelIntroMeshes(timeNow);
        } else {
          const countdownValue = Math.max(1, Math.ceil((serveResumeAt - timeNow) / countdownStepMs));
          if (countdownValue !== lastServeCountdownValue) {
            lastServeCountdownValue = countdownValue;
            renderServeCountdownDigit(countdownValue);
            playTone(
              HARMONIC_SCALE[countdownValue % HARMONIC_SCALE.length] * 1.5,
              0.045,
              0.026,
              "triangle",
            );
          }
        }
      }

      if (currentState === GameState.END_SCREEN && endActionRequestRef.current) {
        const action = endActionRequestRef.current;
        endActionRequestRef.current = null;
        endOutcome = null;
        setEndAction(null);
        winFlashActive = false;
        paintDripAccumulator = 0;
        if (action === "next") {
          if (currentLevel < MAX_LEVEL) {
            currentLevel += 1;
          }
          explodeEndBricks();
          pendingNextLevelAt = timeNow + 560;
        } else if (action === "champion") {
          explodeEndBricks();
          spawnChampionCelebration();
          persistChampionUnlock();
          showEasterEggRef.current(true);
        } else if (action === "level1") {
          currentLevel = 1;
          championRevealAt = 0;
          championBurstDone = false;
          explodeEndBricks();
          transitionToNextIntroState(GameState.INTRO_TWISTEDSTACKS);
        } else {
          explodeEndBricks();
          pendingNextLevelAt = timeNow + 560;
        }
      }

      // Update interactive parallax camera tilt based on mouse moves
      const deltaMouseX = interactionRef.current.targetMouseX - interactionRef.current.mouseX;
      const deltaMouseY = interactionRef.current.targetMouseY - interactionRef.current.mouseY;
      interactionRef.current.mouseX += deltaMouseX * 0.08;
      interactionRef.current.mouseY += deltaMouseY * 0.08;

      // Handle screen shake viewport shifts
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (shakeIntensity > 0) {
        shakeOffsetX = (Math.random() - 0.5) * shakeIntensity;
        shakeOffsetY = (Math.random() - 0.5) * shakeIntensity;
        shakeIntensity *= 0.88;
        if (shakeIntensity < 0.1) shakeIntensity = 0;
      }

      const gameplayElapsed = currentState === GameState.GAMEPLAY ? timeNow - gameplayStartTime : 0;
      const cameraFrame = computeCameraTilt({
        timeNow,
        dt,
        currentState,
        currentLevel,
        maxLevel: MAX_LEVEL,
        currentSpeed,
        gameplayStartTime,
        wobbleScale: currentState === GameState.GAMEPLAY
          ? getLevelProfile(currentLevel).wobbleScale
          : 1,
        mouseX: interactionRef.current.mouseX,
        mouseY: interactionRef.current.mouseY,
        width,
        height,
        cameraZoomOut,
      });
      const { pitchAngle, yawAngle, twistAngle } = cameraFrame;
      if (cameraFrame.cameraZoomOut !== cameraZoomOut) {
        cameraZoomOut = cameraFrame.cameraZoomOut;
        camera.left = (-width / 2) * cameraZoomOut;
        camera.right = (width / 2) * cameraZoomOut;
        camera.top = (height / 2) * cameraZoomOut;
        camera.bottom = (-height / 2) * cameraZoomOut;
        camera.updateProjectionMatrix();
      }
      camera.position.set(shakeOffsetX, shakeOffsetY, 500);
      camera.rotation.set(
        pitchAngle,
        yawAngle,
        twistAngle,
      );

      // --- BALL PHYSICS ---
      if ((currentState !== GameState.END_SCREEN || endBricks.length > 0) && serveResumeAt === 0) {
        integrateBallCurve(
          ball,
          dt,
          currentSpeed,
          currentState === GameState.GAMEPLAY,
          currentLevel,
        );
        const spinLift = advanceBall(ball, dt);
        ballMesh.position.set(ball.x, ball.y, spinLift);
        ballMesh.rotation.z += ball.curveSpin * dt * 9;
        ballMesh.rotation.x = ball.curveSpin * 0.55;
        ballGlintMesh.position.set(ball.x, ball.y, spinLift + 2);
        ballGlintMesh.rotation.x += dt * 5.8;
        ballGlintMesh.rotation.y += dt * 4.2;
        ballGlintMesh.rotation.z -= dt * 6.4;
        decayBallGlint(ball, dt);
        if (ball.glint > 0) {
          ballGlintMesh.scale.setScalar(getGlintScale(ball.glint));
          ballGlintMaterial.opacity = getGlintOpacity(ball.glint);
          ballMaterial.color.setHex(ball.glintColor);
        } else {
          ballGlintMaterial.opacity = 0;
        }
      }

      // --- SPEEDS AND EXPONENTIAL PROGRESSIONS ---
      if (currentState === GameState.GAMEPLAY) {
        const profile = getLevelProfile(currentLevel);
        currentSpeed = computeGameplaySpeed(
          baseSpeed,
          difficultyRef.current,
          profile,
          gameplayElapsed,
        );

        // Apply visual color shifts/pulsation to the active Ball mesh so it looks alive
        const pulse = 0.94 + Math.sin(timeNow * 0.01) * 0.06;
        ballMesh.scale.setScalar(pulse);
        if (ball.glint <= 0) {
          ballMaterial.color.setHex(COLOR_WHITE);
        }

        if (serveResumeAt === 0) {
          normalizeBallSpeed(ball, currentSpeed);
        }
        updatePointMultiplier();
        updateMusicLoop(timeNow);
      }

      // --- ANIMATED RACKET SHRINKING ---
      if (currentState === GameState.GAMEPLAY) {
        const shrinkEase = Math.min(1, dt * 9);
        playerScale += (playerTargetScale - playerScale) * shrinkEase;
        aiScale += (aiTargetScale - aiScale) * shrinkEase;
      }

      // --- ACTIVE INTERACTION POINT TRACKING ---
      let targetPlayerY = interactionRef.current.playerTargetY;
      let targetPlayerX = interactionRef.current.playerTargetX;

      if (rigStateRef.current === "autopilot") {
        const waveOffset = Math.sin(timeNow * 0.003) * 8;
        targetPlayerY = ball.y - waveOffset;
        targetPlayerX = ball.x - waveOffset;
      }

      // Set boundary restrictions to lock rackets firmly inside screen limits
      const halfPlayerLenY = (rackets.left.length * playerScale) / 2;
      const halfPlayerLenX = (rackets.bottom.length * playerScale) / 2;
      targetPlayerY = Math.max(-height / 2 + halfPlayerLenY + 30, Math.min(height / 2 - halfPlayerLenY - 30, targetPlayerY));
      targetPlayerX = Math.max(-width / 2 + halfPlayerLenX + 30, Math.min(width / 2 - halfPlayerLenX - 30, targetPlayerX));

      // Player manual controls applied to Left and Bottom paddles in all states (intro & gameplay)
      rackets.left.y = targetPlayerY;
      rackets.bottom.x = targetPlayerX;

      if (currentState === GameState.GAMEPLAY) {
        // Smart Adaptive AI with imperfect tracking delay & capped movement pacing
        const halfAiLenY = (rackets.right.length * aiScale) / 2;
        const halfAiLenX = (rackets.top.length * aiScale) / 2;

        const profile = getLevelProfile(currentLevel);
        const aiParams = computeAiTrackingParams(
          difficultyRef.current,
          currentLevel,
          MAX_LEVEL,
          profile,
        );
        const maxAiSpeed = currentSpeed * aiParams.aiSpeedFactor;
        const { targetY: targetAiY, targetX: targetAiX } = computeAiTargetOffset(
          ball.x,
          ball.y,
          ball.vx,
          ball.vy,
          aiParams,
          timeNow,
          currentLevel,
        );

        // Right Racket moves along vertical coordinate (AI side)
        const diffY = targetAiY - rackets.right.y;
        const trackY = diffY * aiParams.trackingAlpha;
        const clampedTrackY = Math.sign(trackY) * Math.min(Math.abs(trackY), maxAiSpeed * dt);
        rackets.right.y = Math.max(-height / 2 + halfAiLenY + 30, Math.min(height / 2 - halfAiLenY - 30, rackets.right.y + clampedTrackY));

        // Top Racket moves along horizontal coordinate (AI side)
        const diffX = targetAiX - rackets.top.x;
        const trackX = diffX * aiParams.trackingAlpha;
        const clampedTrackX = Math.sign(trackX) * Math.min(Math.abs(trackX), maxAiSpeed * dt);
        rackets.top.x = Math.max(-width / 2 + halfAiLenX + 30, Math.min(width / 2 - halfAiLenX - 30, rackets.top.x + clampedTrackX));

      } else {
        // --- SEAMLESS HIGH-FIDELITY SOLITAIRE AUTO-PLAY SEQUENCES ---
        // Perfect automated solitaire play: track coordinates with dynamic sine-wave variation
        const waveOffset = Math.sin(timeNow * 0.002) * 22;

        // Player controls left and bottom (handled above), AI automatically plays right and top
        rackets.right.y = Math.max(-height / 2 + rackets.right.length / 2 + 30, Math.min(height / 2 - rackets.right.length / 2 - 30, ball.y - waveOffset));
        rackets.top.x = Math.max(-width / 2 + rackets.top.length / 2 + 30, Math.min(width / 2 - rackets.top.length / 2 - 30, ball.x - waveOffset));
      }

      const velocityDt = Math.max(dt, 1 / 120);
      (["left", "bottom", "right", "top"] as const).forEach((side) => {
        racketVelocity[side].x = (rackets[side].x - previousRacketPosition[side].x) / velocityDt;
        racketVelocity[side].y = (rackets[side].y - previousRacketPosition[side].y) / velocityDt;
        previousRacketPosition[side].x = rackets[side].x;
        previousRacketPosition[side].y = rackets[side].y;
      });

      // Sync active mesh vectors inside ThreeJS objects
      rackets.left.mesh.position.set(rackets.left.x, rackets.left.y, 0);
      rackets.left.mesh.scale.set(1.0, rackets.left.length * (currentState === GameState.GAMEPLAY ? playerScale : 1.0), 1.0);

      rackets.bottom.mesh.position.set(rackets.bottom.x, rackets.bottom.y, 0);
      rackets.bottom.mesh.scale.set(rackets.bottom.length * (currentState === GameState.GAMEPLAY ? playerScale : 1.0), 1.0, 1.0);

      rackets.right.mesh.position.set(rackets.right.x, rackets.right.y, 0);
      rackets.right.mesh.scale.set(1.0, rackets.right.length * (currentState === GameState.GAMEPLAY ? aiScale : 1.0), 1.0);

      rackets.top.mesh.position.set(rackets.top.x, rackets.top.y, 0);
      rackets.top.mesh.scale.set(rackets.top.length * (currentState === GameState.GAMEPLAY ? aiScale : 1.0), 1.0, 1.0);

      cornerComboPulse = Math.max(0, cornerComboPulse - dt * 2.8);
      const railPulse = 0.14 + cornerComboPulse * 0.34;
      cornerRailMaterial.opacity = railPulse;
      const cornerAnchorX = rackets.left.x;
      const cornerAnchorY = rackets.bottom.y;
      const verticalSpan = Math.max(8, Math.abs(rackets.left.y - cornerAnchorY));
      const horizontalSpan = Math.max(8, Math.abs(rackets.bottom.x - cornerAnchorX));
      cornerRailVertical.position.set(cornerAnchorX, (rackets.left.y + cornerAnchorY) / 2, -10);
      cornerRailVertical.scale.set(1, verticalSpan, 1);
      cornerRailHorizontal.position.set((rackets.bottom.x + cornerAnchorX) / 2, cornerAnchorY, -10);
      cornerRailHorizontal.scale.set(horizontalSpan, 1, 1);

      const aiCornerAnchorX = rackets.right.x;
      const aiCornerAnchorY = rackets.top.y;
      const aiVerticalSpan = Math.max(8, Math.abs(rackets.right.y - aiCornerAnchorY));
      const aiHorizontalSpan = Math.max(8, Math.abs(rackets.top.x - aiCornerAnchorX));
      cornerRailVerticalAi.position.set(aiCornerAnchorX, (rackets.right.y + aiCornerAnchorY) / 2, -10);
      cornerRailVerticalAi.scale.set(1, aiVerticalSpan, 1);
      cornerRailHorizontalAi.position.set((rackets.top.x + aiCornerAnchorX) / 2, aiCornerAnchorY, -10);
      cornerRailHorizontalAi.scale.set(aiHorizontalSpan, 1, 1);
      cornerRailAiMaterial.opacity = railPulse;

      if (cornerTutorialFlash > 0) {
        cornerTutorialFlash = Math.max(0, cornerTutorialFlash - dt * 2.8);
        cornerRailMaterial.opacity = Math.max(railPulse, cornerTutorialFlash * 0.85);
      }
      updateCenterMotif(timeNow);
      updateMonsterSystem(timeNow, dt);
      updatePlayerShots(dt);
      syncHudToReact();

      const handlePlayerCornerHit = (side: "left" | "bottom") => {
        const otherSide = side === "left" ? "bottom" : "left";
        const timeSinceOther = lastPlayerHitSide === otherSide ? (timeNow - lastPlayerHitAt) : Number.POSITIVE_INFINITY;
        const comboIntensity = cornerComboIntensity(timeSinceOther);
        if (comboIntensity !== null) {
          applyCornerComboBoost(ball, comboIntensity);
          cornerComboPulse = Math.max(cornerComboPulse, 1);
          cornerComboCount += 1;
          if (!cornerTutorialSeen) {
            cornerTutorialSeen = true;
            cornerTutorialFlash = 1.35;
          }
          shakeIntensity = Math.max(shakeIntensity, 5 + comboIntensity * 6);
          playCornerComboSound(comboIntensity);
          spawnSparks(ball.x, ball.y, COLOR_WIN_GREEN);
          spawnSparks(ball.x, ball.y, COLOR_PLAYER);
        }

        if (isPanicSave(side, ball.x, ball.y, ballSize, width, height)) {
          cornerComboPulse = Math.max(cornerComboPulse, 0.75);
          shakeIntensity = Math.max(shakeIntensity, 9);
          playPanicSaveSound();
          spawnSparks(ball.x, ball.y, COLOR_WHITE);
        }

        lastPlayerHitSide = side;
        lastPlayerHitAt = timeNow;
      };

      // Left Player Racket Collision
      if (ball.vx < 0 && 
          ball.x - ballSize / 2 <= rackets.left.x + rackets.left.thickness / 2 && 
          ball.x + ballSize / 2 >= rackets.left.x - rackets.left.thickness / 2) {
        const currentLen = rackets.left.length * (currentState === GameState.GAMEPLAY ? playerScale : 1.0);
        if (ball.y >= rackets.left.y - currentLen / 2 && ball.y <= rackets.left.y + currentLen / 2) {
          ball.x = rackets.left.x + rackets.left.thickness / 2 + ballSize / 2;
          const intersectY = (rackets.left.y - ball.y) / (currentLen / 2);
          const realSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          ({ vx: ball.vx, vy: ball.vy } = bounceVelocityOffRacket("left", intersectY, realSpeed));
          {
            const power = applyRacketImpulse(ball, "y", racketVelocity.left.y, currentSpeed);
            if (power > 0.14) shakeIntensity = Math.max(shakeIntensity, 2 + power * 4);
            playHitSound(power, "player");
          }
          triggerBallGlint(
            COLOR_PLAYER,
            applyNaturalRacketDeflection(ball, "y", -intersectY, racketVelocity.left.y, currentSpeed, timeNow),
          );
          handlePlayerCornerHit("left");
          addRescuePoints();
          spawnSparks(ball.x, ball.y, COLOR_PLAYER);
          shakeIntensity = Math.max(shakeIntensity, 2);
          // Trigger vibration feedback on supported mobile devices
          if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
            navigator.vibrate(20);
          }
        }
      }

      // Bottom Player Racket Collision
      if (ball.vy < 0 && 
          ball.y - ballSize / 2 <= rackets.bottom.y + rackets.bottom.thickness / 2 && 
          ball.y + ballSize / 2 >= rackets.bottom.y - rackets.bottom.thickness / 2) {
        const currentLen = rackets.bottom.length * (currentState === GameState.GAMEPLAY ? playerScale : 1.0);
        if (ball.x >= rackets.bottom.x - currentLen / 2 && ball.x <= rackets.bottom.x + currentLen / 2) {
          ball.y = rackets.bottom.y + rackets.bottom.thickness / 2 + ballSize / 2;
          const intersectX = (ball.x - rackets.bottom.x) / (currentLen / 2);
          const realSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          ({ vx: ball.vx, vy: ball.vy } = bounceVelocityOffRacket("bottom", intersectX, realSpeed));
          {
            const power = applyRacketImpulse(ball, "x", racketVelocity.bottom.x, currentSpeed);
            if (power > 0.14) shakeIntensity = Math.max(shakeIntensity, 2 + power * 4);
            playHitSound(power, "player");
          }
          triggerBallGlint(
            COLOR_PLAYER,
            applyNaturalRacketDeflection(ball, "x", intersectX, racketVelocity.bottom.x, currentSpeed, timeNow),
          );
          handlePlayerCornerHit("bottom");
          addRescuePoints();
          spawnSparks(ball.x, ball.y, COLOR_PLAYER);
          shakeIntensity = Math.max(shakeIntensity, 2);
          // Trigger vibration feedback on supported mobile devices
          if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
            navigator.vibrate(20);
          }
        }
      }

      // Right AI Racket Collision
      if (ball.vx > 0 && 
          ball.x + ballSize / 2 >= rackets.right.x - rackets.right.thickness / 2 && 
          ball.x - ballSize / 2 <= rackets.right.x + rackets.right.thickness / 2) {
        const currentLen = rackets.right.length * (currentState === GameState.GAMEPLAY ? aiScale : 1.0);
        if (ball.y >= rackets.right.y - currentLen / 2 && ball.y <= rackets.right.y + currentLen / 2) {
          ball.x = rackets.right.x - rackets.right.thickness / 2 - ballSize / 2;
          const intersectY = (rackets.right.y - ball.y) / (currentLen / 2);
          const realSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          ({ vx: ball.vx, vy: ball.vy } = bounceVelocityOffRacket("right", intersectY, realSpeed));
          {
            const power = applyRacketImpulse(ball, "y", racketVelocity.right.y, currentSpeed);
            if (power > 0.14) shakeIntensity = Math.max(shakeIntensity, 2 + power * 4);
            playHitSound(power, "ai");
          }
          triggerBallGlint(
            COLOR_AI,
            applyNaturalRacketDeflection(ball, "y", -intersectY, racketVelocity.right.y, currentSpeed, timeNow),
          );
          spawnSparks(ball.x, ball.y, COLOR_AI);
          shakeIntensity = Math.max(shakeIntensity, 2);
        }
      }

      // Top AI Racket Collision
      if (ball.vy > 0 && 
          ball.y + ballSize / 2 >= rackets.top.y - rackets.top.thickness / 2 && 
          ball.y - ballSize / 2 <= rackets.top.y + rackets.top.thickness / 2) {
        const currentLen = rackets.top.length * (currentState === GameState.GAMEPLAY ? aiScale : 1.0);
        if (ball.x >= rackets.top.x - currentLen / 2 && ball.x <= rackets.top.x + currentLen / 2) {
          ball.y = rackets.top.y - rackets.top.thickness / 2 - ballSize / 2;
          const intersectX = (ball.x - rackets.top.x) / (currentLen / 2);
          const realSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          ({ vx: ball.vx, vy: ball.vy } = bounceVelocityOffRacket("top", intersectX, realSpeed));
          {
            const power = applyRacketImpulse(ball, "x", racketVelocity.top.x, currentSpeed);
            if (power > 0.14) shakeIntensity = Math.max(shakeIntensity, 2 + power * 4);
            playHitSound(power, "ai");
          }
          triggerBallGlint(
            COLOR_AI,
            applyNaturalRacketDeflection(ball, "x", intersectX, racketVelocity.top.x, currentSpeed, timeNow),
          );
          spawnSparks(ball.x, ball.y, COLOR_AI);
          shakeIntensity = Math.max(shakeIntensity, 2);
        }
      }

      // --- OUT OF BOUNDS BOUNDARY CHECKS (SCORE TRIGGER) ---
      if (currentState === GameState.GAMEPLAY) {
        let scored = false;
        let pScoreLost = false;
        let aiScoreLost = false;

        // Player Controls Left & Bottom. AI Controls top/right sides
        if (ball.x < -width / 2) {
          scorePlayer = Math.max(0, scorePlayer - 1);
          pScoreLost = true;
          scored = true;
        } else if (ball.y < -height / 2) {
          scorePlayer = Math.max(0, scorePlayer - 1);
          pScoreLost = true;
          scored = true;
        } else if (ball.x > width / 2) {
          scoreAI = Math.max(0, scoreAI - 1);
          aiScoreLost = true;
          scored = true;
        } else if (ball.y > height / 2) {
          scoreAI = Math.max(0, scoreAI - 1);
          aiScoreLost = true;
          scored = true;
        }

        if (scored) {
          shakeIntensity = 10;
          if (pScoreLost) {
            playScoreLossSound();
          } else {
            playScoreWinSound();
          }
          spawnSparks(0, 0, pScoreLost ? COLOR_LOSS_RED : COLOR_WIN_GREEN);

          if (pScoreLost) {
            playerTargetScale = Math.max(0.28, playerTargetScale * 0.84);
            playerScale = Math.min(1.15, playerScale + 0.1);
          }
          if (aiScoreLost) {
            aiTargetScale = Math.max(0.28, aiTargetScale * 0.84);
            aiScale = Math.min(1.15, aiScale + 0.1);
          }

          if (scorePlayer <= 0) {
            // AI Wins
            currentState = GameState.END_SCREEN;
            setGameState(GameState.END_SCREEN);
            endOutcome = "ai";
            paintDripAccumulator = 0;
            submitScoreCandidate(playerPoints, currentLevel, "lost");
            setEndAction("retry");
            renderEndTypography(["AI", "WINS"], COLOR_LOSS_RED);
            spawnPaintDrips(18);
            launchBall(Math.min(currentSpeed, 560));
          } else if (scoreAI <= 0) {
            // Player Wins
            currentState = GameState.END_SCREEN;
            setGameState(GameState.END_SCREEN);
            endOutcome = "player";
            if (currentLevel >= MAX_LEVEL) {
              playerWinLines = ["STACK", "MASTER"];
              submitScoreCandidate(playerPoints, currentLevel, "champion");
              championRevealAt = timeNow + 3400;
              setEndAction("champion");
            } else {
              playerWinLines = currentLevel >= 2 ? ["CLEAR", "NEXT"] : ["WELL", "PLAYED", "HOOMAN"];
              setEndAction("next");
            }
            nextWinFlashAt = timeNow + 1700;
            winFlashActive = false;
            renderEndTypography(playerWinLines, COLOR_WIN_GREEN);
            launchBall(Math.min(currentSpeed, 560));
          } else {
            rebuildScoreDigits();
            startServeCountdown(timeNow);
          }
        }
      } else {
        ricochetIntroBounds(ball, ballSize, width, height);
      }

      // --- AXIS-ALIGNED COLLISION RESOLUTION: BRICKS ---
      // Single continuous collection hosting standard bricks and active score objects
      const activeBricks = currentState === GameState.END_SCREEN
        ? [...endBricks]
        : [...bricks, ...scoreBricks, ...centerMotifBricks];
      let brickHitResolved = false;

      for (let i = 0; i < activeBricks.length; i++) {
        const b = activeBricks[i];

        // Ensure collision math with valid meshes only
        if (!b.mesh) continue;

        if (b.hitsLeft <= 0) continue;

        const bW = b.w;
        const bH = b.h;

        const halfBW = bW / 2;
        const halfBH = bH / 2;
        const halfBS = ballSize / 2;

        const bMinX = b.x - halfBW;
        const bMaxX = b.x + halfBW;
        const bMinY = b.y - halfBH;
        const bMaxY = b.y + halfBH;

        const ballMinX = ball.x - halfBS;
        const ballMaxX = ball.x + halfBS;
        const ballMinY = ball.y - halfBS;
        const ballMaxY = ball.y + halfBS;

        // Perform fast AABB bounding overlap checks
        const overlapX = Math.min(ballMaxX, bMaxX) - Math.max(ballMinX, bMinX);
        const overlapY = Math.min(ball.y + halfBS, bMaxY) - Math.max(ball.y - halfBS, bMinY);

        if (overlapX > 0 && overlapY > 0) {
          resolveBrickBallCollision(ball, b.x, b.y, overlapX, overlapY);

          // Damage logic for active bricks, score digits, and end typography.
          if (b.hitsLeft > 0) {
            const ownerColor = b.scoreOwner === "player"
              ? COLOR_PLAYER
              : b.scoreOwner === "ai"
                ? COLOR_AI
                : b.isCenterMotif
                  ? (b.color ?? COLOR_INTRO_ACTIVE)
                  : COLOR_INTRO_DEAD;
            const wasOneHitFromDeath = b.hitsLeft <= 1;
            damageBrick(b, ownerColor, b.scoreOwner ?? "brick");
            if (b.isMonster) {
              addMonsterHitPoints(wasOneHitFromDeath || b.hitsLeft <= 0);
            }
          }

          brickHitResolved = true;
          break; // Avoid multi-collisions evaluation in a single tick
        }
      }

      // Check remaining active bricks in INTRO sequence to guide transitions
      if (!brickHitResolved && currentState !== GameState.GAMEPLAY && currentState !== GameState.END_SCREEN) {
        // Ensure bricks have been loaded before evaluating empty condition to prevent startup skips
        if (bricks.length > 0) {
          const remainingActive = bricks.filter((b) => b.hitsLeft > 0).length;
          if (remainingActive === 0) {
            if (currentState === GameState.INTRO_TWISTEDSTACKS) {
              transitionToNextIntroState(GameState.GAMEPLAY);
            }
          }
        }
      }

      if (currentState === GameState.END_SCREEN && endOutcome === "ai") {
        paintDripAccumulator += dt;
        if (paintDripAccumulator > 0.075) {
          paintDripAccumulator = 0;
          spawnPaintDrips(3);
        }
      } else if (currentState === GameState.END_SCREEN && endOutcome === "player") {
        const endTypographyPristine = endBricks.length > 0 && endBricks.every((b) => b.hitsLeft === b.hitsMax);
        const isFinalLevel = currentLevel >= MAX_LEVEL;
        if (endTypographyPristine && !winFlashActive && timeNow > nextWinFlashAt && !isFinalLevel) {
          renderEndTypography(["UNTIL", "NEXT", "TIME"], COLOR_LOSS_RED);
          playTone(155.56, 0.08, 0.05, "sawtooth");
          shakeIntensity = Math.max(shakeIntensity, 8);
          winFlashActive = true;
          winFlashUntil = timeNow + 115;
        } else if (winFlashActive && timeNow > winFlashUntil) {
          renderEndTypography(playerWinLines, COLOR_WIN_GREEN);
          winFlashActive = false;
          nextWinFlashAt = timeNow + 2300;
        }
      }

      // --- PARTICLE PHYSICS UPDATE ---
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt / (p.decay ?? 0.38); // Sparks vanish quickly; paint drips live longer.

        if (p.life <= 0) {
          if (p.mesh) scene.remove(p.mesh);
          particles.splice(i, 1);
        } else {
          if (p.gravity) p.vy += p.gravity * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          const currentZ = p.mesh.position.z + (p.vz || 0) * dt;

          p.mesh.position.set(p.x, p.y, currentZ);
          if (p.expand) {
            const growth = 1 + (1 - p.life) * 14;
            p.mesh.scale.set(growth, growth, 1);
          } else if (p.decay) {
            p.mesh.scale.y += dt * 18;
          } else {
            p.mesh.scale.setScalar(p.life);
          }

          // Apply a brutalist spin
          if (!p.decay && !p.expand) {
            p.mesh.rotation.x += 0.08;
            p.mesh.rotation.y += 0.08;
          }

          if (p.mesh.material) {
            p.mesh.material.opacity = p.expand ? p.life * 0.75 : p.life;
          }
        }
      }

      renderer.render(scene, camera);
      } catch (err: any) {
        setInitError(err?.message || String(err));
        console.error("Game Loop Error:", err);
      }
    };

    frameId = requestAnimationFrame(gameLoop);

    // --- INTERACTION EVENT LISTENERS ---
    const handleMouseMove = (e: MouseEvent) => {
      ensureAudio();
      tryArcadeBoot();
      interactionRef.current.isTouch = false;

      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;

      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      // Track screen coords relative to container for 3D Camera Parallax
      const normX = (localX / rect.width) * 2 - 1;
      const normY = -(localY / rect.height) * 2 + 1;
      interactionRef.current.targetMouseX = normX;
      interactionRef.current.targetMouseY = normY;

      // Translate mouse coordinates to central orthographic plane
      const orthoX = normX * (width / 2);
      const orthoY = normY * (height / 2);

      interactionRef.current.playerTargetX = orthoX;
      interactionRef.current.playerTargetY = orthoY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      ensureAudio();
      tryArcadeBoot();
      interactionRef.current.isTouch = true;
      if (e.touches.length === 0) return;
      const touch = e.touches[0];

      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;

      const localX = touch.clientX - rect.left;
      const localY = touch.clientY - rect.top;

      const normX = (localX / rect.width) * 2 - 1;
      const normY = -(localY / rect.height) * 2 + 1;
      interactionRef.current.targetMouseX = normX;
      interactionRef.current.targetMouseY = normY;

      const orthoX = normX * (width / 2);
      const orthoY = normY * (height / 2);

      interactionRef.current.playerTargetX = orthoX;
      interactionRef.current.playerTargetY = orthoY;
    };

    // Keydown hook enables spacebar as a secondary safe navigation channel for skip
    const handleKeyDown = (e: KeyboardEvent) => {
      ensureAudio();
      tryArcadeBoot();
      if (e.key.toLowerCase() === "d") {
        setShowDifficultyScreen(true);
        return;
      }
      if ((isDevMode || championUnlockedRef.current) && e.key.toLowerCase() === "p") {
        setShowShowroomModal(true);
        return;
      }
      if (isDevMode && e.key.toLowerCase() === "m") {
        setShowContactForm(true);
        return;
      }
      if (e.key === "2") {
        devLevelRequestRef.current = 2;
        return;
      }
      if (currentState === GameState.END_SCREEN && endActionRef.current === "retry") {
        if (e.key.toLowerCase() === "y") {
          requestRetryYes();
          return;
        }
        if (e.key.toLowerCase() === "n") {
          requestAcceptAiWins();
          return;
        }
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        if (
          currentState === GameState.INTRO_TWISTED ||
          currentState === GameState.INTRO_STACKS ||
          currentState === GameState.INTRO_TWISTEDSTACKS
        ) {
          triggerSkipIntro();
        }
      }
    };

    // Clicking restarts the game immediately in END_SCREEN state, or skips intro straight to gameplay
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "d") {
        setShowDifficultyScreen(false);
      }
    };

    const handleScreenClick = (e: MouseEvent) => {
      ensureAudio();
      tryArcadeBoot();
      if (pendingNextLevelAt > 0) {
        return;
      }
      if (currentState === GameState.END_SCREEN) {
        if (endOutcome === "player") {
          endActionRequestRef.current = "next";
        }
        return;
      } else if (
        currentState === GameState.INTRO_TWISTED ||
        currentState === GameState.INTRO_STACKS ||
        currentState === GameState.INTRO_TWISTEDSTACKS
      ) {
        triggerSkipIntro();
      } else if (currentState === GameState.GAMEPLAY) {
        const rect = renderer.domElement.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        fireRacketStreakShot(normX * (width / 2) * cameraZoomOut, normY * (height / 2) * cameraZoomOut, performance.now());
      }
    };

    const mountElement = mountRef.current;
    if (mountElement) {
      mountElement.addEventListener("click", handleScreenClick);
    }
    window.addEventListener("mousemove", handleMouseMove);
    const handleTouchStart = () => {
      ensureAudio();
      tryArcadeBoot();
    };
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // --- CLEANUP DISPOSAL VAULT ---
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      if (mountElement) {
        mountElement.removeEventListener("click", handleScreenClick);
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(frameId);

      // Deep geometry and material release to avoid GPU leaks
      bricks.forEach((b) => { if (b.mesh) scene.remove(b.mesh); });
      scoreBricks.forEach((sb) => { if (sb.mesh) scene.remove(sb.mesh); });
      centerMotifBricks.forEach((brick) => { if (brick.mesh) scene.remove(brick.mesh); });
      endBricks.forEach((eb) => { if (eb.mesh) scene.remove(eb.mesh); });
      countdownMeshes.forEach((mesh) => scene.remove(mesh));
      particles.forEach((p) => { if (p.mesh) scene.remove(p.mesh); });
      monsterShots.forEach((shot) => scene.remove(shot.mesh));
      playerShots.forEach((shot) => scene.remove(shot.mesh));
      scene.remove(ballGlintMesh);
      if (levelIntroOverlayMesh) {
        scene.remove(levelIntroOverlayMesh);
        levelIntroOverlayMesh.geometry.dispose();
        if (levelIntroOverlayMesh.material instanceof THREE.Material) {
          levelIntroOverlayMesh.material.dispose();
        }
        levelIntroOverlayMesh = null;
      }

      verticalGeom.dispose();
      horizontalGeom.dispose();
      materialPlayer.dispose();
      materialAI.dispose();
      cornerRailVertical.geometry.dispose();
      cornerRailHorizontal.geometry.dispose();
      cornerRailVerticalAi.geometry.dispose();
      cornerRailHorizontalAi.geometry.dispose();
      cornerRailMaterial.dispose();
      cornerRailAiMaterial.dispose();
      ballGeometry.dispose();
      ballMaterial.dispose();
      ballGlintGeometry.dispose();
      ballGlintMaterial.dispose();
      paintDripGeom.dispose();
      paintDripMat.dispose();
      monsterEyeMaterial.dispose();
      monsterShotMaterial.dispose();
      monsterShotGeom.dispose();
      playerShotMaterial.dispose();
      playerShotGeom.dispose();

      Object.values(brickGeomCache).forEach(geo => geo.dispose());
      Object.values(materialCache).forEach(mat => mat.dispose());
      copperMaterials.forEach(m => m.dispose());

      if (mountElement && renderer.domElement.parentNode === mountElement) {
        mountElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
    } catch (err: any) {
      setInitError(err?.message || String(err));
      console.error("Initialization Error:", err);
      return () => {};
    }
  }, []);

  const isIntro = (gameState === GameState.INTRO_TWISTED || gameState === GameState.INTRO_STACKS || gameState === GameState.INTRO_TWISTEDSTACKS) && !showDifficultyScreen;

  const selectDifficulty = (diff: "casual" | "hardcore" | "impossible") => {
    setDifficulty(diff);
    difficultyRef.current = diff;
    setShowDifficultyScreen(false);
  };

  const showHud = gameState === GameState.GAMEPLAY && !showDifficultyScreen;
  const hudLevelProfile = getLevelProfile(hud.level);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505] select-none">
      
      {/* ERROR DIAGNOSTIC OVERLAY */}
      {initError && (
        <div className="absolute inset-0 bg-[#0d0404]/95 border border-red-900/50 flex flex-col justify-center items-center p-6 z-[9999] pointer-events-auto">
          <div className="max-w-md w-full bg-[#1c0808]/80 border border-red-500/30 p-6 rounded-sm shadow-2xl font-mono text-center">
            <div className="text-red-500 font-bold uppercase tracking-widest text-xs mb-3 animate-pulse">
              ⚠️ RUNTIME EXCEPTION DETECTED
            </div>
            <p className="text-[11px] text-zinc-300 bg-black/40 p-4 border border-red-500/10 rounded-sm text-left whitespace-pre-wrap select-text mb-4 leading-relaxed">
              {initError}
            </p>
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest leading-normal">
              Systems auto-abort active. Refresh browser or contact support if issue persists.
            </div>
          </div>
        </div>
      )}

      {/* IMMERSIVE 3D WEBGL INTERACTION PORT */}
      <div
        ref={mountRef}
        className={`w-full h-full absolute inset-0 cursor-default z-10 transition-opacity duration-700 ${
          showGame ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-[0.18]"
        }`}
      />

      {!showGame && (
        <main className="showroom-shell pointer-events-auto">
          <div className="ascii-backdrop" aria-hidden>
            {ASCII_ROWS.map((row, index) => (
              <pre key={`${row}-${index}`}>{row}</pre>
            ))}
          </div>

          <section className="showroom-hero">
            <div className="showroom-kicker">TWISTEDSTACKS // SANDVIKEN AI LAB</div>
            <h1 className="showroom-hero-title">
              <span>Useful systems.</span>
              <span className="showroom-hero-twist">TWISTED edge.</span>
            </h1>
            <p className="showroom-lede">
              Local AI, legal workflows, grant tooling, voice-first interfaces, defensive research, and small polished
              sites. Built by Per Brinell as a practical showroom rather than a pitch deck.
            </p>
            <div className="showroom-actions">
              <button
                type="button"
                className="showroom-action showroom-action-primary"
                onClick={startTwistedPongg}
              >
                Play Pongg
              </button>
              <button
                type="button"
                className="showroom-action"
                onClick={() => openContactForm({
                  type: "QUERY",
                  message: "Hej Per,\n\nJag vill boka en full demonstration av SkatteRevision-systemet.\n\n",
                })}
              >
                Book Demo
              </button>
              <button
                type="button"
                className="showroom-action"
                onClick={() => openContactForm({ type: "QUERY", message: "Hej Per,\n\n" })}
              >
                Contact
              </button>
              <a className="showroom-action" href="https://github.com/wawawee" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </div>
          </section>

          <section className="showroom-project-grid" aria-label="TwistedStacks projects">
            {CATALOG_PROJECTS.filter((project) => project.id !== "system_arena").map((project) => (
              <article
                key={project.id}
                className={`showroom-project ${selectedProjectId === project.id ? "is-selected" : ""}`}
                onMouseEnter={() => setSelectedProjectId(project.id)}
              >
                <div className="showroom-project-topline">
                  <span>{project.version}</span>
                  <span>{project.status}</span>
                </div>
                <h2>{project.name}</h2>
                <p className="showroom-project-tagline">{project.tagline}</p>
                <p className="showroom-project-description">{project.description}</p>
                <div className="showroom-project-stack">
                  {project.techStack.map((tech) => (
                    <span key={`${project.id}-${tech}`}>{tech}</span>
                  ))}
                </div>
                <div className="showroom-project-footer">
                  <div className="showroom-project-metric">
                    {project.telemetry[0]?.label}: <strong>{project.telemetry[0]?.value}</strong>
                  </div>
                  {project.href ? (
                    <a href={project.href} target="_blank" rel="noreferrer">
                      {project.actionLabel || "Open"}
                    </a>
                  ) : project.contactMessage ? (
                    <button
                      type="button"
                      onClick={() => openContactForm({ type: "QUERY", message: project.contactMessage })}
                    >
                      {project.actionLabel || "Contact"}
                    </button>
                  ) : project.id === "system_arena" ? (
                    <button type="button" onClick={startTwistedPongg}>
                      {project.actionLabel || "Open"}
                    </button>
                  ) : (
                    <span className="showroom-project-pending">{project.actionLabel || "Soon"}</span>
                  )}
                </div>
              </article>
            ))}
          </section>

          <section className="showroom-note">
            <p>
              KryptoArkeologi is intentionally not linked yet. It needs a private-data scrub first, then a stripped
              public edition.
            </p>
          </section>
        </main>
      )}

      {hud.cornerFlash > 0.04 && (
        <div
          className="corner-flash-overlay pointer-events-none"
          style={{ opacity: Math.min(0.7, hud.cornerFlash * 0.55) }}
          aria-hidden
        />
      )}

      {showHud && (
        <div className="hud-strip pointer-events-none" aria-hidden>
          {hud.playerPoints.toLocaleString("sv-SE").padStart(6, "0")}
        </div>
      )}

      {showHud && (
        <div className="level-badge pointer-events-none" aria-hidden>
          <span>Level {hud.level}</span>
          <strong>{hudLevelProfile.codename}</strong>
          <em>{hud.pointMultiplier}x</em>
        </div>
      )}

      {(showGame || highScores.length > 0) && (
        <aside className={`pongg-scoreboard ${showGame ? "is-game" : "is-showroom"}`} aria-label="Twisted Pongg scoreboard">
          <div className="pongg-scoreboard-title">
            Top 5
            <span className={`pongg-scoreboard-badge ${leaderboardMode === "global" ? "is-global" : "is-local"}`}>
              {leaderboardMode === "global" ? "Global" : "Local"}
            </span>
          </div>
          {highScores.length > 0 ? (
            <ol>
              {highScores.map((entry, index) => (
                <li key={`${entry.name}-${entry.score}-${entry.date}`}>
                  <span>{index + 1}. {entry.name}</span>
                  <strong>{entry.score.toLocaleString("sv-SE")}</strong>
                </li>
              ))}
            </ol>
          ) : (
            <p>No scores yet</p>
          )}
        </aside>
      )}

      {showGame && (
        <button
          type="button"
          className="showroom-return pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            setShowGame(false);
          }}
        >
          Showroom
        </button>
      )}

      {isDevMode && showGame && (
        <div className="absolute left-3 top-3 z-50 flex max-w-[min(100vw-24px,320px)] flex-wrap gap-1 rounded-sm border border-white/10 bg-black/35 p-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/55 backdrop-blur-sm pointer-events-auto">
          {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((level) => (
            <button
              key={level}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                devLevelRequestRef.current = level;
              }}
              className="h-6 min-w-8 rounded-[2px] border border-white/10 px-2 transition-colors hover:border-yellow-300/50 hover:bg-yellow-300/10 hover:text-yellow-100"
              title={`Jump to level ${level}`}
            >
              L{level}
            </button>
          ))}
        </div>
      )}

      {endAction && (
        <div className="absolute bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 pointer-events-auto">
          {!showGame ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startTwistedPongg();
              }}
              className="rounded-sm border border-yellow-300/30 bg-yellow-300/10 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-yellow-200 backdrop-blur-sm transition-all duration-150 hover:border-yellow-200 hover:text-yellow-50"
            >
              Play Twisted Pongg
            </button>
          ) : endAction === "retry" ? (
            <div className="retry-prompt-dock" onClick={(e) => e.stopPropagation()}>
              <div className="retry-prompt-title">Retry level {hud.level}?</div>
              <div className="retry-prompt-countdown" aria-live="polite">
                {retryCountdown}
              </div>
              <div className="retry-prompt-actions">
                <button type="button" className="retry-prompt-btn retry-prompt-yes" onClick={requestRetryYes}>
                  Yes
                </button>
                <button type="button" className="retry-prompt-btn retry-prompt-loss" onClick={requestAcceptAiWins}>
                  AI Wins
                </button>
              </div>
              <div className="retry-prompt-hint">Y = retry · 0 = AI wins → level 1</div>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                endActionRequestRef.current = endAction;
              }}
              className={`rounded-sm border px-5 py-2 font-mono text-[10px] uppercase tracking-[0.28em] backdrop-blur-sm transition-all duration-150 ${
                endAction === "next"
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:border-emerald-300 hover:text-emerald-100"
                  : "border-yellow-300/30 bg-yellow-300/10 text-yellow-200 hover:border-yellow-200 hover:text-yellow-50"
              }`}
            >
              {endAction === "next"
                ? hud.level < MAX_LEVEL
                  ? `Level ${Math.min(hud.level + 1, MAX_LEVEL)}`
                  : "Next Level"
                : "Open Vault"}
            </button>
          )}
        </div>
      )}

      {scoreCandidate && (
        <div className="score-entry-overlay pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <form
            className="score-entry-panel"
            onSubmit={(e) => {
              e.preventDefault();
              saveScoreCandidate();
            }}
          >
            <div className="score-entry-kicker">
              {scoreCandidate.outcome === "champion" ? "Stack Master Score" : "Top 5 Run"}
            </div>
            <h2>{scoreCandidate.score.toLocaleString("sv-SE")}</h2>
            <label htmlFor="score-name">Name</label>
            <input
              id="score-name"
              value={playerInitials}
              maxLength={PLAYER_NAME_LIMIT}
              autoFocus
              onChange={(e) => setPlayerInitials(normalizePlayerName(e.target.value))}
              placeholder="PLAYER"
            />
            <div className="score-entry-actions">
              <button type="submit">Save</button>
              <button
                type="button"
                onClick={() => {
                  setScoreCandidate(null);
                  setPlayerInitials("");
                }}
              >
                Skip
              </button>
            </div>
          </form>
        </div>
      )}

      {showDifficultyScreen && (
        <div className="absolute inset-x-0 top-14 z-40 flex justify-center px-4 pointer-events-auto animate-fade-in">
          <div className="difficulty-dock">
            <div className="difficulty-dock-row">
              {(["casual", "hardcore", "impossible"] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => selectDifficulty(diff)}
                  className={`difficulty-pip ${difficulty === diff ? "is-active" : ""} difficulty-pip-${diff}`}
                  title={diff}
                  aria-label={diff}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {showGame && (
        <button
          type="button"
          className="contact-fab pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            openContactForm();
          }}
          title={`Contact ${CONTACT_EMAIL}`}
          aria-label="Contact TwistedStacks"
        >
          @
        </button>
      )}

      {showEasterEgg && (
        <div className="easter-vault-overlay pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <div className="easter-vault-panel custom-scrollbar">
            <button type="button" className="easter-vault-close" onClick={closeEasterEgg} aria-label="Close vault">
              [✕]
            </button>
            <p className="easter-vault-kicker">TWISTED PONGG // CLASSIFIED</p>
            <h2 className="easter-vault-title">STACK MASTER VAULT</h2>
            <p className="easter-vault-lede">
              Du klarade alla 9 nivåer. Courtet öppnar en dold tråd — autopilot-riggen spinner, bollen är guld,
              och arkivet låser upp sig för dig som pallat hela vägen.
            </p>
            <div className="easter-vault-grid">
              {[
                { code: "THREAD-09", name: "ENDLESS SELF", note: "Solo endless med twist-ramp — kommer." },
                { code: "THREAD-Ω", name: "CORNER OVERDRIVE", note: "Corner combo overspeed-belöning i lab." },
                { code: "THREAD-KEY", name: "LAB DIRECT", note: "Tidig access till nästa TwistedStacks-drop." },
              ].map((item) => (
                <div key={item.code} className="easter-vault-card">
                  <span className="easter-vault-card-code">{item.code}</span>
                  <span className="easter-vault-card-name">{item.name}</span>
                  <p className="easter-vault-card-note">{item.note}</p>
                </div>
              ))}
            </div>
            <p className="easter-vault-hint">
              {championUnlocked ? "Tryck P för arkivkatalogen när du vill." : ""} Skicka en signal till studion — vi vill höra från riktiga stack masters.
            </p>
            <div className="easter-vault-actions">
              <button
                type="button"
                className="easter-vault-btn easter-vault-btn-primary"
                onClick={() => {
                  openContactForm({
                    type: "FEEDBACK",
                    message:
                      "STACK MASTER reporting in — I cleared all 9 levels in TWISTED PONGG.\n\n",
                  });
                  setShowEasterEgg(false);
                }}
              >
                Transmit Victory
              </button>
              <button
                type="button"
                className="easter-vault-btn"
                onClick={() => {
                  closeEasterEgg();
                  endActionRequestRef.current = "level1";
                }}
              >
                Play Again
              </button>
              {(isDevMode || championUnlocked) && (
                <button
                  type="button"
                  className="easter-vault-btn"
                  onClick={() => {
                    setShowEasterEgg(false);
                    setShowShowroomModal(true);
                  }}
                >
                  Open Archive
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {(isDevMode || championUnlocked) && showShowroomModal && (
        <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md flex justify-center items-center px-4 z-50 animate-fade-in select-none pointer-events-auto">
          <div className="bg-[#09090b]/95 border border-zinc-900 p-6 md:p-8 max-w-2xl w-full rounded-sm relative shadow-[0_25px_60px_rgba(0,0,0,0.98)] max-h-[85vh] overflow-y-auto custom-scrollbar">
            
            {/* Elegant Close Button */}
            <button
              onClick={() => setShowShowroomModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors font-mono text-[10px] tracking-widest cursor-pointer focus:outline-none"
            >
              [CLOSE_CABIN ✕]
            </button>

            {/* Header */}
            <div className="text-[8px] font-mono tracking-[0.25em] text-[#EAB308] uppercase mb-1">
              TWISTED STACKS // ARCHITECTURE DIRECTORY
            </div>
            <h2 className="text-xl md:text-2xl font-sans font-bold tracking-tighter text-zinc-100 uppercase pb-4 border-b border-zinc-900 mb-6">
              LIVE THREADS
            </h2>

            {/* Grid layout of active systems in showrooms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {CATALOG_PROJECTS.map((proj) => (
                <div 
                  key={proj.id} 
                  className="bg-[#050505]/60 border border-zinc-900 p-4 rounded-sm flex flex-col justify-between hover:border-zinc-800 hover:bg-zinc-950/20 transition-all duration-200"
                >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-yellow-500 font-bold truncate">
                          {proj.name.split(" ")[0]}
                        </span>
                        <span className="text-[7px] font-mono tracking-wider border border-emerald-500/10 text-emerald-500 bg-emerald-500/5 px-1 py-0.5 rounded-sm">
                          {proj.status}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-1 uppercase mb-2">
                        {proj.version}
                      </div>
                      <p className="text-[11px] font-sans text-zinc-400 mt-1 pb-3 text-justify leading-relaxed border-b border-zinc-900">
                        {proj.description}
                      </p>
                    </div>

                    <div className="mt-3">
                      <div className="text-[7px] font-mono text-zinc-650 uppercase tracking-widest mb-1.5 label-tag">
                        DIAGNOSTIC_METRICS
                      </div>
                      <div className="space-y-1 mb-3">
                        {proj.telemetry.map((tel, idx) => (
                          <div key={idx} className="flex justify-between text-[9px] font-mono">
                            <span className="text-zinc-505 truncate">{tel.label}:</span>
                            <span className="text-[#06B6D4] font-medium">{tel.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {proj.techStack.map((tech, idx) => (
                          <span key={idx} className="text-[7px] font-mono bg-zinc-950 border border-zinc-900 px-1.5 py-0.5 text-zinc-500 rounded-sm">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Call To Action within showroom cabinet */}
            <div className="pt-4 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider text-center md:text-left">
                Skatterevision, LAGA, iOS, and a playable front door.
              </p>
              <button
                onClick={() => {
                  setShowShowroomModal(false);
                  openContactForm();
                }}
                className="px-4 py-1.5 bg-[#EAB308] hover:bg-yellow-400 text-zinc-950 font-mono text-[9px] tracking-widest uppercase transition-all duration-150 cursor-pointer font-bold rounded-sm select-none"
              >
                CONNECT WITH STUDIO
              </button>
            </div>

          </div>
        </div>
      )}

      {showContactForm && (
        <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-sm flex justify-center items-end sm:items-center px-3 pb-4 sm:pb-0 z-50 animate-fade-in pointer-events-auto">
          <div className="contact-panel relative w-full max-w-3xl">
            <button
              type="button"
              onClick={handleCloseContact}
              className="contact-panel-close"
              aria-label="Stäng"
            >
              ✕
            </button>

            {isSubmitSuccess ? (
              <button
                type="button"
                onClick={handleCloseContact}
                className="contact-success-mark"
                aria-label="Stäng"
              >
                ✓
              </button>
            ) : (
              <form onSubmit={handleFormSubmit} className="contact-form">
                <div className="contact-type-row">
                  {(
                    [
                      ["FEEDBACK", "FEEDBACK"],
                      ["BUG_REPORT", "BUG"],
                      ["QUERY", "QUERY"],
                    ] as const
                  ).map(([t, label]) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setContactType(t)}
                      className={`contact-type-btn ${contactType === t ? "is-active" : ""}`}
                      title={t.replace("_", " ")}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="contact-compose-row">
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={9}
                    className="contact-textarea select-text"
                    aria-label="Meddelande"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="contact-send-btn"
                    aria-label="Skicka"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                      <path
                        fill="currentColor"
                        d="M3.4 20.4 20.8 12 3.4 3.6 3.4 10l11.2 2-11.2 2z"
                      />
                    </svg>
                  </button>
                </div>

                {formError ? <p className="contact-form-error">{formError}</p> : null}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
