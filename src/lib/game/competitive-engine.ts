// MathArena — Compétitive duel engine (pur skill, Chess.com style).
// Pas de classes, pas de sorts, pas de PV. Les deux joueurs voient la même question.
// Premier à `TARGET_SCORE` bonnes réponses gagne. Mauvaise réponse = combo reset + retry (pas de lockout).

import type { GameMode, Question } from "./types";
import { generateQuestion } from "./math";

export const TARGET_SCORE = 7;

export type CompPhase = "question" | "resolved" | "gameover";

export interface CompLogEntry {
  id: number;
  side: "player" | "opponent" | "system";
  text: string;
  kind: "point" | "miss" | "timeout" | "combo" | "info";
  ts: number;
}

export interface CompDuelState {
  mode: GameMode;
  question: Question;
  questionStartTs: number;
  matchStartTs: number;
  timeLimitMs: number;
  phase: CompPhase;
  playerScore: number;
  opponentScore: number;
  playerCombo: number;
  opponentCombo: number;
  questionIndex: number;
  winner: "player" | "opponent" | null;
  log: CompLogEntry[];
  /** plan pré-tiré de l'IA pour la question courante */
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

export function compTimeLimit(mode: GameMode): number {
  if (mode === "BLITZ") return 3000;
  if (mode === "QUICK") return 8000;
  return 10000; // RANKED
}

// --- IA adversaire (pur skill) ---

function aiAccuracy(diff: Question["difficulty"]): number {
  const base: Record<Question["difficulty"], number> = {
    facile: 0.9,
    moyen: 0.78,
    difficile: 0.62,
    extreme: 0.45,
    legendaire: 0.3,
  };
  return base[diff];
}

function aiThinkMs(diff: Question["difficulty"], mode: GameMode): number {
  const base: Record<Question["difficulty"], number> = {
    facile: 1500,
    moyen: 2200,
    difficile: 3200,
    extreme: 4200,
    legendaire: 5000,
  };
  let t = base[diff] + (Math.random() * 900 - 450);
  if (mode === "BLITZ") t = Math.min(t, 2600);
  return Math.max(1000, Math.round(t));
}

export function planOpponent(s: CompDuelState): { thinkMs: number; correct: boolean } {
  const acc = aiAccuracy(s.question.difficulty);
  return { thinkMs: aiThinkMs(s.question.difficulty, s.mode), correct: Math.random() < acc };
}

// --- Création / helpers ---

export function createCompDuel(mode: GameMode): CompDuelState {
  const now = Date.now();
  const question = generateQuestion({ mode, questionIndex: 0 });
  const state: CompDuelState = {
    mode,
    question,
    questionStartTs: now,
    matchStartTs: now,
    timeLimitMs: compTimeLimit(mode),
    phase: "question",
    playerScore: 0,
    opponentScore: 0,
    playerCombo: 0,
    opponentCombo: 0,
    questionIndex: 0,
    winner: null,
    log: [makeLog("system", "Match commencé — premier à 7 points gagne", "info", now)],
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
  return s.playerScore >= TARGET_SCORE || s.opponentScore >= TARGET_SCORE;
}

/** Le joueur soumet une réponse. Mauvaise = combo reset + retry (pas de lockout). */
export function playerSubmit(
  prev: CompDuelState,
  raw: string,
  timeMs: number,
): { state: CompDuelState; correct: boolean; timedOut: boolean } {
  const s = clone(prev);
  const timedOut = timeMs >= s.timeLimitMs;
  if (timedOut) {
    return { state: s, correct: false, timedOut: true };
  }
  const val = Number.parseInt(raw, 10);
  const correct = Number.isFinite(val) && val === s.question.answer;
  if (correct) {
    s.playerScore += 1;
    s.playerCombo += 1;
    s.log.push(makeLog("player", `✓ Toi — réponse en ${(timeMs / 1000).toFixed(1)}s — ${s.playerScore} point${s.playerScore > 1 ? "s" : ""}`, "point"));
    // Milestones combo
    if (s.playerCombo === 3 || s.playerCombo === 5 || s.playerCombo === 8 || s.playerCombo === 10) {
      s.log.push(makeLog("player", `🔥 Combo x${s.playerCombo}`, "combo"));
    }
  } else {
    s.playerCombo = 0;
    s.log.push(makeLog("player", `✗ Erreur — tu as répondu ${raw}`, "miss"));
  }
  return { state: s, correct, timedOut: false };
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
    s.opponentCombo += 1;
    s.log.push(makeLog("opponent", `✓ Adversaire — réponse en ${(plan.thinkMs / 1000).toFixed(1)}s — ${s.opponentScore} point${s.opponentScore > 1 ? "s" : ""}`, "point"));
    if (s.opponentCombo === 3 || s.opponentCombo === 5 || s.opponentCombo === 8) {
      s.log.push(makeLog("opponent", `🔥 Adversaire combo x${s.opponentCombo}`, "combo"));
    }
    return { state: s, scored: true, thinkMs: plan.thinkMs };
  }
  s.opponentCombo = 0;
  s.log.push(makeLog("opponent", "✗ Adversaire a manqué", "miss"));
  return { state: s, scored: false, thinkMs: plan.thinkMs };
}

/** Avance à la question suivante. */
export function advanceComp(prev: CompDuelState): CompDuelState {
  const s = clone(prev);
  if (isCompGameOver(s)) {
    s.phase = "gameover";
    s.winner = s.playerScore >= TARGET_SCORE ? "player" : "opponent";
    s.log.push(makeLog("system", s.winner === "player" ? "Victoire !" : "Défaite.", "info"));
    return s;
  }
  s.questionIndex += 1;
  const next = generateQuestion({ mode: s.mode, questionIndex: s.questionIndex });
  if (next && next.text) s.question = next;
  s.questionStartTs = Date.now();
  s.timeLimitMs = compTimeLimit(s.mode);
  s.opponentPlan = planOpponent(s);
  s.phase = "question";
  return s;
}

/** Timeout : la question est annulée (personne ne marque), on révèle la réponse. */
export function timeoutQuestion(prev: CompDuelState): CompDuelState {
  const s = clone(prev);
  s.log.push(makeLog("system", `⏱ Temps écoulé — réponse: ${s.question?.answer ?? "?"}`, "timeout"));
  return s;
}
