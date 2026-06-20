"use client";

import { useEffect, useRef, useState } from "react";
import type { GameMode } from "@/lib/game/types";
import {
  advanceComp,
  createCompDuel,
  endBlitz,
  isCompGameOver,
  modeConfig,
  opponentFire,
  playerSubmit,
  timeoutQuestion,
  type CompDuelState,
} from "@/lib/game/competitive-engine";
import type { MatchResultPayload } from "@/lib/store";
import { sound } from "@/lib/sound";

const ADVANCE_DELAY = 700;
const TICK_MS = 90;
const WRONG_CLEAR_DELAY = 500;

export interface DuelStats {
  answered: number;
  correct: number;
  totalTimeMs: number;
}

export interface UseCompDuelOpts {
  mode: GameMode;
  opponentName: string;
  onSave: (payload: Omit<MatchResultPayload, "saved">) => void;
  onQuit: () => void;
}

export function useCompetitiveDuel(opts: UseCompDuelOpts) {
  const { mode, opponentName, onSave, onQuit } = opts;

  const [state, setState] = useState<CompDuelState>(() => createCompDuel(mode));
  const [timeLeftMs, setTimeLeftMs] = useState<number>(state.timeLimitMs);
  const [matchTimeLeftMs, setMatchTimeLeftMs] = useState<number>(state.matchTimeLimitMs);
  const [opponentThinking, setOpponentThinking] = useState(false);
  const [flash, setFlash] = useState<"correct" | "wrong" | "critical" | null>(null);

  const stateRef = useRef(state);
  const inputRef = useRef("");
  const resolvedRef = useRef(false);
  const opponentDoneRef = useRef(false);
  const opponentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchCountdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const wrongClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionStart = useRef(Date.now());
  const matchStart = useRef(Date.now());
  const playerStats = useRef<DuelStats>({ answered: 0, correct: 0, totalTimeMs: 0 });
  const opponentStats = useRef<DuelStats>({ answered: 0, correct: 0, totalTimeMs: 0 });
  const finished = useRef(false);
  const savedRef = useRef(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTickSec = useRef<number>(-1);
  const onSaveRef = useRef(onSave);
  const onQuitRef = useRef(onQuit);
  const startQuestionRef = useRef<(s: CompDuelState) => void>(() => {});

  onSaveRef.current = onSave;
  onQuitRef.current = onQuit;

  const cfg = modeConfig(mode);

  const commit = (ns: CompDuelState) => {
    if (!ns.question && ns.phase !== "gameover") return;
    stateRef.current = ns;
    setState(ns);
  };
  const triggerFlash = (k: "correct" | "wrong" | "critical") => {
    setFlash(k);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 350);
  };
  const clearTimers = () => {
    if (opponentTimer.current) clearTimeout(opponentTimer.current);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    if (matchCountdownTimer.current) clearInterval(matchCountdownTimer.current);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    if (wrongClearTimer.current) clearTimeout(wrongClearTimer.current);
  };
  const clearQuestionTimers = () => {
    if (opponentTimer.current) { clearTimeout(opponentTimer.current); opponentTimer.current = null; }
    if (countdownTimer.current) { clearInterval(countdownTimer.current); countdownTimer.current = null; }
  };

  const finalize = () => {
    if (finished.current) return;
    finished.current = true;
    clearTimers();
    sound.bell();
    const s = stateRef.current;
    const won = s.playerScore > s.opponentScore;
    const st = playerStats.current;
    if (!savedRef.current) {
      savedRef.current = true;
      onSaveRef.current({
        universe: "competitive",
        result: won ? "WIN" : s.playerScore < s.opponentScore ? "LOSE" : "LOSE",
        opponentName,
        playerScore: s.playerScore,
        opponentScore: s.opponentScore,
        avgTimeMs: st.correct > 0 ? Math.round(st.totalTimeMs / st.correct) : 0,
        accuracy: st.answered > 0 ? Math.round((st.correct / st.answered) * 100) : 0,
        mode,
      });
    }
  };

  const maybeAdvance = () => {
    if (finished.current) return;
    if (!resolvedRef.current || !opponentDoneRef.current) return;
    if (isCompGameOver(stateRef.current)) {
      finalize();
      return;
    }
    advanceTimer.current = setTimeout(() => {
      if (finished.current) return;
      const ns = advanceComp(stateRef.current);
      commit(ns);
      if (isCompGameOver(ns)) {
        finalize();
        return;
      }
      startQuestionRef.current(ns);
    }, ADVANCE_DELAY);
  };

  const handleTimeout = () => {
    if (finished.current || resolvedRef.current) return;
    if (!stateRef.current.question) return;
    clearQuestionTimers();
    resolvedRef.current = true;
    opponentDoneRef.current = true;
    setOpponentThinking(false);
    triggerFlash("wrong");
    sound.wrong();
    playerStats.current.answered += 1;
    const ns = timeoutQuestion(stateRef.current);
    commit({ ...ns, log: [...ns.log] });
    maybeAdvance();
  };

  const handleOpponentFire = () => {
    if (finished.current || opponentDoneRef.current || resolvedRef.current) return;
    if (!stateRef.current.question || !stateRef.current.opponentPlan) return;
    const r = opponentFire(stateRef.current);
    commit(r.state);
    opponentDoneRef.current = true;
    setOpponentThinking(false);
    opponentStats.current.answered += 1;
    if (r.scored) {
      opponentStats.current.correct += 1;
      opponentStats.current.totalTimeMs += r.thinkMs;
      resolvedRef.current = true;
      clearQuestionTimers();
      sound.tac();
    }
    if (isCompGameOver(r.state)) {
      finalize();
      return;
    }
    maybeAdvance();
  };

  const startQuestion = (s: CompDuelState) => {
    if (finished.current) return;
    resolvedRef.current = false;
    opponentDoneRef.current = false;
    inputRef.current = "";
    questionStart.current = Date.now();
    setTimeLeftMs(s.timeLimitMs);
    setOpponentThinking(false);
    lastTickSec.current = -1;

    countdownTimer.current = setInterval(() => {
      const elapsed = Date.now() - questionStart.current;
      const left = Math.max(0, s.timeLimitMs - elapsed);
      setTimeLeftMs(left);
      const secLeft = Math.ceil(left / 1000);
      if (left <= 3000 && left > 0 && secLeft !== lastTickSec.current) {
        lastTickSec.current = secLeft;
        sound.tick();
      }
      if (left <= 0) handleTimeout();
    }, TICK_MS);

    if (s.opponentPlan) {
      setOpponentThinking(true);
      opponentTimer.current = setTimeout(() => {
        handleOpponentFire();
      }, s.opponentPlan.thinkMs);
    } else {
      opponentDoneRef.current = true;
    }
  };
  startQuestionRef.current = startQuestion;

  const submit = () => {
    if (finished.current || resolvedRef.current) return;
    if (stateRef.current.phase !== "question") return;
    const val = inputRef.current.trim();
    if (val === "") return;
    const timeMs = Date.now() - questionStart.current;
    const r = playerSubmit(stateRef.current, val, timeMs);
    commit(r.state);
    if (r.alreadyLocked) return;
    playerStats.current.answered += 1;
    if (r.correct) {
      playerStats.current.correct += 1;
      playerStats.current.totalTimeMs += timeMs;
      resolvedRef.current = true;
      clearQuestionTimers();
      opponentDoneRef.current = true;
      setOpponentThinking(false);
      if (timeMs < 2000) {
        triggerFlash("critical");
        sound.critical();
      } else {
        triggerFlash("correct");
        sound.correct();
      }
      if (wrongClearTimer.current) clearTimeout(wrongClearTimer.current);
    } else if (r.timedOut) {
      resolvedRef.current = true;
      opponentDoneRef.current = true;
      clearQuestionTimers();
      triggerFlash("wrong");
      sound.wrong();
    } else {
      // Mauvaise réponse : lockout. L'adversaire peut encore répondre.
      triggerFlash("wrong");
      sound.wrong();
      if (wrongClearTimer.current) clearTimeout(wrongClearTimer.current);
      wrongClearTimer.current = setTimeout(() => {
        inputRef.current = "";
        forceInputUpdate();
      }, WRONG_CLEAR_DELAY);
    }
    if (isCompGameOver(r.state)) {
      clearQuestionTimers();
      finalize();
      return;
    }
    maybeAdvance();
  };

  const [, forceTick] = useState(0);
  const forceInputUpdate = () => forceTick((n) => n + 1);

  // init
  useEffect(() => {
    finished.current = false;
    savedRef.current = false;
    playerStats.current = { answered: 0, correct: 0, totalTimeMs: 0 };
    opponentStats.current = { answered: 0, correct: 0, totalTimeMs: 0 };
    matchStart.current = Date.now();
    sound.swoosh();
    startQuestionRef.current(stateRef.current);

    // Blitz : countdown du match (2 min)
    if (cfg.matchTimeLimitMs > 0) {
      setMatchTimeLeftMs(cfg.matchTimeLimitMs);
      matchCountdownTimer.current = setInterval(() => {
        const elapsed = Date.now() - matchStart.current;
        const left = Math.max(0, cfg.matchTimeLimitMs - elapsed);
        setMatchTimeLeftMs(left);
        if (left <= 0) {
          // Fin du match Blitz
          if (!finished.current) {
            clearQuestionTimers();
            const ns = endBlitz(stateRef.current);
            commit(ns);
            finalize();
          }
        }
      }, TICK_MS);
    }

    return () => {
      clearTimers();
    };
  }, []);

  const quit = () => {
    clearTimers();
    onQuitRef.current();
  };

  const isGameOver = state.phase === "gameover" || finished.current;

  const stats = {
    player: {
      answered: playerStats.current.answered,
      correct: playerStats.current.correct,
      avgTimeMs:
        playerStats.current.correct > 0
          ? Math.round(playerStats.current.totalTimeMs / playerStats.current.correct)
          : 0,
      accuracy:
        playerStats.current.answered > 0
          ? Math.round((playerStats.current.correct / playerStats.current.answered) * 100)
          : 0,
    },
    opponent: {
      answered: opponentStats.current.answered,
      correct: opponentStats.current.correct,
      avgTimeMs:
        opponentStats.current.correct > 0
          ? Math.round(opponentStats.current.totalTimeMs / opponentStats.current.correct)
          : 0,
      accuracy:
        opponentStats.current.answered > 0
          ? Math.round((opponentStats.current.correct / opponentStats.current.answered) * 100)
          : 0,
    },
  };

  const matchDurationMs = Date.now() - state.matchStartTs;

  return {
    state,
    timeLeftMs,
    matchTimeLeftMs,
    opponentThinking,
    flash,
    input: inputRef.current,
    setInput: (v: string) => {
      inputRef.current = v;
      forceInputUpdate();
    },
    submit,
    quit,
    targetScore: cfg.targetScore,
    isBlitz: cfg.matchTimeLimitMs > 0,
    matchTimeLimitMs: cfg.matchTimeLimitMs,
    stats,
    matchStartTs: state.matchStartTs,
    matchDurationMs,
    isGameOver,
    winner: state.winner,
  };
}
