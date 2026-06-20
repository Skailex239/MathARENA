// MathArena — Compétitive duel engine (pur skill, Chess.com style).
// 3 modes : Classique (premier à 10, 8s) / Rapide (premier à 5, 5s) / Blitz (2 min, plus de bonnes réponses).
// Mauvaise réponse = lockout (l'adversaire peut encore répondre). Timeout = question invalidée pour les deux.
// Pas de combos. Difficulté moyenne fixe. Tous types de calculs mélangés.

import type { GameMode, Question } from "./types";
import { generateQuestion } from "./math";

export type CompPhase = "question" | "resolved" | "gameover";

export interface CompLogEntry {
  id: number;
  side: "player" | "opponent" | "system";
  text: string;
  kind: "point" | "miss" | "timeout" | "lockout" | "info";
  ts: number;
}

export interface CompDuelState {
  mode: GameMode;
  question: Question;
  questionStartTs: number;
  matchStartTs: number;
  timeLimitMs: number;       // temps par question
  matchTimeLimitMs: number;  // temps total du match (Blitz = 120000, autres = 0 = illimité)
  phase: CompPhase;
  playerScore: number;
  opponentScore: number;
  playerLocked: boolean;     // lockout si mauvaise réponse
  questionIndex: number;
  winner: "player" | "opponent" | null;
  log: CompLogEntry[];
  opponentPlan: { thinkMs: number; correct: boolean } | null;
}

let logId = 1;
function makeLog(
  side: CompLogEntry["side"],
  text: string,
  kind: CompLogEntry["kind"],
  ts = Date.now(),
): CompLogEntry {
  return { id: logId++, side, text, kind, ts };
}

// --- Config par mode ---

export interface ModeConfig {
  targetScore: number;      // 0 = pas de target (Blitz = time-based)
  timeLimitMs: number;      // temps par question
  matchTimeLimitMs: number; // temps total du match (0 = illimité)
  label: string;
  winFormat: string;
}

export function modeConfig(mode: GameMode): ModeConfig {
  switch (mode) {
    case "RANKED": // Classique
      return { targetScore: 10, timeLimitMs: 8000, matchTimeLimitMs: 0, label: "Classique", winFormat: "Premier à 10 points" };
    case "QUICK": // Rapide
      return { targetScore: 5, timeLimitMs: 5000, matchTimeLimitMs: 0, label: "Rapide", winFormat: "Premier à 5 points" };
    case "BLITZ": // Blitz
      return { targetScore: 0, timeLimitMs: 5000, matchTimeLimitMs: 120000, label: "Blitz", winFormat: "Plus de bonnes réponses en 2 min" };
    default:
      return { targetScore: 10, timeLimitMs: 8000, matchTimeLimitMs: 0, label: "Classique", winFormat: "Premier à 10 points" };
  }
}

export function compTimeLimit(mode: GameMode): number {
  return modeConfig(mode).timeLimitMs;
}

// --- IA adversaire ---

function aiAccuracy(): number {
  // Difficulté moyenne fixe → accuracy moyenne
  return 0.78;
}

function aiThinkMs(mode: GameMode): number {
  // Difficulté moyenne → temps moyen
  let t = 2200 + (Math.random() * 900 - 450);
  if (mode === "BLITZ") t = Math.min(t, 4500);
  return Math.max(1000, Math.round(t));
}

export function planOpponent(s: CompDuelState): { thinkMs: number; correct: boolean } {
  return { thinkMs: aiThinkMs(s.mode), correct: Math.random() < aiAccuracy() };
}

// --- Création / helpers ---

export function createCompDuel(mode: GameMode): CompDuelState {
  const now = Date.now();
  const cfg = modeConfig(mode);
  // Difficulté moyenne fixe, tous types mélangés
  const question = generateQuestion({ mode, questionIndex: 0, forcedDifficulty: "moyen" });
  const state: CompDuelState = {
    mode,
    question,
    questionStartTs: now,
    matchStartTs: now,
    timeLimitMs: cfg.timeLimitMs,
    matchTimeLimitMs: cfg.matchTimeLimitMs,
    phase: "question",
    playerScore: 0,
    opponentScore: 0,
    playerLocked: false,
    questionIndex: 0,
    winner: null,
    log: [makeLog("system", `Match commencé — ${cfg.winFormat}`, "info", now)],
    opponentPlan: null,
  };
  state.opponentPlan = planOpponent(state);
  return state;
}

function clone(s: CompDuelState): CompDuelState {
  return {
    ...s,
    question: { ...s.question },
    log: [...s.log],
    opponentPlan: s.opponentPlan ? { ...s.opponentPlan } : null,
  };
}

export function isCompGameOver(s: CompDuelState): boolean {
  const cfg = modeConfig(s.mode);
  // Score-based (Classique/Rapide)
  if (cfg.targetScore > 0) {
    return s.playerScore >= cfg.targetScore || s.opponentScore >= cfg.targetScore;
  }
  // Blitz : game over géré par le timer du hook (matchTimeLimitMs)
  return false;
}

/** Le joueur soumet une réponse. Mauvaise = lockout (pas de retry). */
export function playerSubmit(
  prev: CompDuelState,
  raw: string,
  timeMs: number,
): { state: CompDuelState; correct: boolean; timedOut: boolean; alreadyLocked: boolean } {
  const s = clone(prev);
  if (s.playerLocked) {
    return { state: s, correct: false, timedOut: false, alreadyLocked: true };
  }
  const timedOut = timeMs >= s.timeLimitMs;
  if (timedOut) {
    return { state: s, correct: false, timedOut: true, alreadyLocked: false };
  }
  const val = Number.parseInt(raw, 10);
  const correct = Number.isFinite(val) && val === s.question.answer;
  if (correct) {
    s.playerScore += 1;
    s.log.push(makeLog("player", `✓ Toi — réponse en ${(timeMs / 1000).toFixed(1)}s — ${s.playerScore} point${s.playerScore > 1 ? "s" : ""}`, "point"));
  } else {
    s.playerLocked = true;
    s.log.push(makeLog("player", `✗ Erreur — tu as répondu ${raw} — verrouillé`, "lockout"));
  }
  return { state: s, correct, timedOut: false, alreadyLocked: false };
}

/** L'adversaire "tire" sa réponse pour la question courante. */
export function opponentFire(prev: CompDuelState): {
  state: CompDuelState;
  scored: boolean;
  thinkMs: number;
} {
  const s = clone(prev);
  if (!s.opponentPlan || !s.question) return { state: s, scored: false, thinkMs: 0 };
  const plan = s.opponentPlan;
  s.opponentPlan = null;
  if (plan.correct) {
    s.opponentScore += 1;
    s.log.push(makeLog("opponent", `✓ Adversaire — réponse en ${(plan.thinkMs / 1000).toFixed(1)}s — ${s.opponentScore} point${s.opponentScore > 1 ? "s" : ""}`, "point"));
    return { state: s, scored: true, thinkMs: plan.thinkMs };
  }
  s.log.push(makeLog("opponent", "✗ Adversaire a manqué", "miss"));
  return { state: s, scored: false, thinkMs: plan.thinkMs };
}

/** Avance à la question suivante. */
export function advanceComp(prev: CompDuelState): CompDuelState {
  const s = clone(prev);
  if (isCompGameOver(s)) {
    s.phase = "gameover";
    s.winner = s.playerScore > s.opponentScore ? "player" : s.playerScore < s.opponentScore ? "opponent" : null;
    s.log.push(makeLog("system", s.winner === "player" ? "Victoire !" : s.winner === "opponent" ? "Défaite." : "Égalité.", "info"));
    return s;
  }
  s.questionIndex += 1;
  const next = generateQuestion({ mode: s.mode, questionIndex: s.questionIndex, forcedDifficulty: "moyen" });
  if (next && next.text) s.question = next;
  s.questionStartTs = Date.now();
  s.timeLimitMs = compTimeLimit(s.mode);
  s.playerLocked = false;
  s.opponentPlan = planOpponent(s);
  s.phase = "question";
  return s;
}

/** Timeout : la question est invalidée pour les deux (personne ne marque). */
export function timeoutQuestion(prev: CompDuelState): CompDuelState {
  const s = clone(prev);
  s.log.push(makeLog("system", `⏱ Temps écoulé — réponse: ${s.question?.answer ?? "?"} — question invalidée`, "timeout"));
  return s;
}

/** Fin de match Blitz (temps écoulé). */
export function endBlitz(prev: CompDuelState): CompDuelState {
  const s = clone(prev);
  s.phase = "gameover";
  s.winner = s.playerScore > s.opponentScore ? "player" : s.playerScore < s.opponentScore ? "opponent" : null;
  s.log.push(makeLog("system", `Temps écoulé — ${s.winner === "player" ? "Victoire !" : s.winner === "opponent" ? "Défaite." : "Égalité."}`, "info"));
  return s;
}
