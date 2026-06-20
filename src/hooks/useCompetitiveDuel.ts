"use client";

import { useEffect, useRef, useState } from "react";
import type { GameMode } from "@/lib/game/types";
import {
  advanceComp,
  createCompDuel,
  isCompGameOver,
  opponentFire,
  playerSubmit,
  timeoutQuestion,
  type CompDuelState,
  TARGET_SCORE,
} from "@/lib/game/competitive-engine";
import type { MatchResultPayload } from "@/lib/store";

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
  onFinish: (payload: Omit<MatchResultPayload, "saved">) => void;
  onQuit: () => void;
}

export function useCompetitiveDuel(opts: UseCompDuelOpts) {
  const { mode, opponentName, onFinish, onQuit } = opts;

  const [state, setState] = useState<CompDuelState>(() => createCompDuel(mode));
  const [timeLeftMs, setTimeLeftMs] = useState<number>(state.timeLimitMs);
  const [opponentThinking, setOpponentThinking] = useState(false);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [input, setInput] = useState("");

  const stateRef = useRef(state);
  const inputRef = useRef("");
  const resolvedRef = useRef(false);
  const opponentDoneRef = useRef(false);
  const opponentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const wrongClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionStart = useRef(Date.now());
  const playerStats = useRef<DuelStats>({ answered: 0, correct: 0, totalTimeMs: 0 });
  const opponentStats = useRef<DuelStats>({ answered: 0, correct: 0, totalTimeMs: 0 });
  const finished = useRef(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishRef = useRef(onFinish);
  const onQuitRef = useRef(onQuit);
  const startQuestionRef = useRef<(s: CompDuelState) => void>(() => {});

  onFinishRef.current = onFinish;
  onQuitRef.current = onQuit;

  const commit = (ns: CompDuelState) => {
    if (!ns.question && ns.phase !== "gameover") return;
    stateRef.current = ns;
    setState(ns);
  };
  const triggerFlash = (k: "correct" | "wrong") => {
    setFlash(k);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 300);
  };
  const clearTimers = () => {
    if (opponentTimer.current) clearTimeout(opponentTimer.current);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    if (wrongClearTimer.current) clearTimeout(wrongClearTimer.current);
    opponentTimer.current = null;
    advanceTimer.current = null;
    countdownTimer.current = null;
  };
  const clearQuestionTimers = () => {
    if (opponentTimer.current) { clearTimeout(opponentTimer.current); opponentTimer.current = null; }
    if (countdownTimer.current) { clearInterval(countdownTimer.current); countdownTimer.current = null; }
  };

  const finalize = () => {
    if (finished.current) return;
    finished.current = true;
    clearTimers();
    const s = stateRef.current;
    const won = s.playerScore >= TARGET_SCORE;
    const st = playerStats.current;
    onFinishRef.current({
      universe: "competitive",
      result: won ? "WIN" : "LOSE",
      playerClass: null,
      opponentClass: null,
      opponentName,
      playerHP: s.playerScore,
      opponentHP: s.opponentScore,
      maxCombo: 0,
      avgTimeMs: st.answered > 0 ? Math.round(st.totalTimeMs / st.answered) : 0,
      accuracy: st.answered > 0 ? Math.round((st.correct / st.answered) * 100) : 0,
      mode,
    });
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
    setInput("");
    questionStart.current = Date.now();
    setTimeLeftMs(s.timeLimitMs);
    setOpponentThinking(false);

    countdownTimer.current = setInterval(() => {
      const elapsed = Date.now() - questionStart.current;
      const left = Math.max(0, s.timeLimitMs - elapsed);
      setTimeLeftMs(left);
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
    playerStats.current.answered += 1;
    if (r.correct) {
      playerStats.current.correct += 1;
      playerStats.current.totalTimeMs += timeMs;
      resolvedRef.current = true;
      clearQuestionTimers();
      opponentDoneRef.current = true;
      setOpponentThinking(false);
      triggerFlash("correct");
      inputRef.current = "";
      setInput("");
    } else if (r.timedOut) {
      resolvedRef.current = true;
      opponentDoneRef.current = true;
      clearQuestionTimers();
      triggerFlash("wrong");
    } else {
      // Mauvaise réponse : combo reset, retry autorisé (question continue).
      triggerFlash("wrong");
      // Auto-clear après 500ms pour permettre de retaper.
      if (wrongClearTimer.current) clearTimeout(wrongClearTimer.current);
      wrongClearTimer.current = setTimeout(() => {
        inputRef.current = "";
        setInput("");
      }, WRONG_CLEAR_DELAY);
    }
    if (isCompGameOver(r.state)) {
      clearQuestionTimers();
      finalize();
      return;
    }
    maybeAdvance();
  };

  // init
  useEffect(() => {
    finished.current = false;
    playerStats.current = { answered: 0, correct: 0, totalTimeMs: 0 };
    opponentStats.current = { answered: 0, correct: 0, totalTimeMs: 0 };
    startQuestionRef.current(stateRef.current);
    return () => {
      clearTimers();
    };
  }, []);

  const quit = () => {
    clearTimers();
    onQuitRef.current();
  };

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

  return {
    state,
    timeLeftMs,
    opponentThinking,
    flash,
    input,
    setInput: (v: string) => {
      inputRef.current = v;
      setInput(v);
    },
    submit,
    quit,
    targetScore: TARGET_SCORE,
    stats,
    matchStartTs: state.matchStartTs,
  };
}
