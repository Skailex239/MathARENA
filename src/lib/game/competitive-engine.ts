// MathArena — Compétitive duel engine (pur skill, Chess.com style).
// Pas de classes, pas de sorts, pas de PV. Les deux joueurs voient la même question.
// Premier à `TARGET_SCORE` bonnes réponses gagne. Mauvaise réponse = lockout sur la question.

import type { GameMode, Question } from "./types";
import { generateQuestion } from "./math";

export const TARGET_SCORE = 7;

export type CompPhase = "question" | "resolved" | "gameover";

export interface CompLogEntry {
  id: number;
  side: "player" | "opponent" | "system";
  text: string;
  kind: "point" | "miss" | "lockout" | "timeout" | "info";
  ts: number;
}

export interface CompDuelState {
  mode: GameMode;
  question: Question;
  questionStartTs: number;
  timeLimitMs: number;
  phase: CompPhase;
  playerScore: number;
  opponentScore: number;
  /** Le joueur est verrouillé pour la question courante (mauvaise réponse). */
  playerLocked: boolean;
  questionIndex: number;
  winner: "player" | "opponent" | null;
  log: CompLogEntry[];
  /** plan pré-tiré de l'IA pour la question courante */
  opponentPlan: { thinkMs: number; correct: boolean } | null;
}

export interface CompStats {
  answered: number;
  correct: number;
  totalTimeMs: number;
}

let logId = 1;
function makeLog(
  side: CompLogEntry["side"],
  text: string,
  kind: CompLogEntry["kind"],
): CompLogEntry {
  return { id: logId++, side, text, kind, ts: Date.now() };
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
  const question = generateQuestion({ mode, questionIndex: 0 });
  const state: CompDuelState = {
    mode,
    question,
    questionStartTs: Date.now(),
    timeLimitMs: compTimeLimit(mode),
    phase: "question",
    playerScore: 0,
    opponentScore: 0,
    playerLocked: false,
    questionIndex: 0,
    winner: null,
    log: [makeLog("system", `Duel compétitif — premier à ${TARGET_SCORE} points`, "info")],
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

/** Le joueur soumet une réponse. Retourne le nouvel état + info. */
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
    s.log.push(makeLog("system", "Temps écoulé — question annulée", "timeout"));
    return { state: s, correct: false, timedOut: true, alreadyLocked: false };
  }
  const val = Number.parseInt(raw, 10);
  const correct = Number.isFinite(val) && val === s.question.answer;
  if (correct) {
    s.playerScore += 1;
    s.log.push(makeLog("player", `✓ Bonne réponse ! ${s.playerScore} - ${s.opponentScore}`, "point"));
  } else {
    s.playerLocked = true;
    s.log.push(makeLog("player", "✗ Mauvaise réponse — verrouillé pour cette question", "lockout"));
  }
  return { state: s, correct, timedOut, alreadyLocked: false };
}

/** L'adversaire "tire" sa réponse pour la question courante. */
export function opponentFire(prev: CompDuelState): {
  state: CompDuelState;
  scored: boolean;
} {
  const s = clone(prev);
  if (!s.opponentPlan) return { state: s, scored: false };
  if (!s.question) return { state: s, scored: false };
  const plan = s.opponentPlan;
  s.opponentPlan = null;
  if (plan.correct) {
    s.opponentScore += 1;
    s.log.push(makeLog("opponent", `L'adversaire marque. ${s.playerScore} - ${s.opponentScore}`, "point"));
    return { state: s, scored: true };
  }
  s.log.push(makeLog("opponent", "L'adversaire se trompe", "miss"));
  return { state: s, scored: false };
}

/** Avance à la question suivante. */
export function advanceComp(prev: CompDuelState): CompDuelState {
  const s = clone(prev);
  if (isCompGameOver(s)) {
    s.phase = "gameover";
    s.winner = s.playerScore >= TARGET_SCORE ? "player" : "opponent";
    s.log.push(
      makeLog("system", s.winner === "player" ? "Victoire !" : "Défaite.", "info"),
    );
    return s;
  }
  s.questionIndex += 1;
  const next = generateQuestion({ mode: s.mode, questionIndex: s.questionIndex });
  // Garde-fou : ne jamais écraser la question si la génération échoue.
  if (next && next.text) {
    s.question = next;
  }
  s.questionStartTs = Date.now();
  s.timeLimitMs = compTimeLimit(s.mode);
  s.playerLocked = false;
  s.opponentPlan = planOpponent(s);
  s.phase = "question";
  return s;
}
