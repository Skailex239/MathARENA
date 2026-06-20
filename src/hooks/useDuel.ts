"use client";

import { useEffect, useRef, useState } from "react";
import type { ClassId, DuelState, GameMode, SpellId } from "@/lib/game/types";
import {
  activateShield as engineShield,
  advance,
  canCastSpell,
  canCastUltimate,
  canActivateShield,
  castSpell,
  castUltimate,
  createDuel,
  isGameOver,
  planOpponentTurn,
  playerAnswer,
  applyOpponentTurn,
  type OpponentPlan,
} from "@/lib/game/duel-engine";
import type { MatchResultPayload } from "@/lib/store";

const ADVANCE_DELAY = 800;
const TICK_MS = 90;

export interface DuelStats {
  answered: number;
  correct: number;
  totalTimeMs: number;
  maxCombo: number;
}

export interface UseDuelOpts {
  playerClassId: ClassId;
  opponentClassId: ClassId;
  mode: GameMode;
  opponentName: string;
  onFinish: (payload: Omit<MatchResultPayload, "saved">) => void;
  onQuit: () => void;
}

export function useDuel(opts: UseDuelOpts) {
  const { playerClassId, opponentClassId, mode, opponentName, onFinish, onQuit } = opts;

  const [state, setState] = useState<DuelState>(() =>
    createDuel(playerClassId, opponentClassId, mode),
  );
  const [timeLeftMs, setTimeLeftMs] = useState<number>(state.timeLimitMs);
  const [opponentThinking, setOpponentThinking] = useState(false);
  const [flash, setFlash] = useState<"hit" | "crit" | "miss" | "heal" | null>(null);
  const [input, setInput] = useState("");

  const stateRef = useRef(state);
  const inputRef = useRef("");
  const answeredRef = useRef(false);
  const opponentDoneRef = useRef(true);
  const planRef = useRef<OpponentPlan | null>(null);
  const opponentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStart = useRef(Date.now());
  const stats = useRef<DuelStats>({ answered: 0, correct: 0, totalTimeMs: 0, maxCombo: 0 });
  const finished = useRef(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishRef = useRef(onFinish);
  const onQuitRef = useRef(onQuit);
  const startQuestionRef = useRef<(s: DuelState) => void>(() => {});

  onFinishRef.current = onFinish;
  onQuitRef.current = onQuit;

  const commit = (ns: DuelState) => {
    stateRef.current = ns;
    setState(ns);
  };
  const triggerFlash = (kind: "hit" | "crit" | "miss" | "heal") => {
    setFlash(kind);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 520);
  };
  const clearTimers = () => {
    if (opponentTimer.current) clearTimeout(opponentTimer.current);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    opponentTimer.current = null;
    advanceTimer.current = null;
    countdownTimer.current = null;
  };

  const finalize = () => {
    if (finished.current) return;
    finished.current = true;
    clearTimers();
    const s = stateRef.current;
    const won = s.player.hp > 0 && s.opponent.hp <= 0;
    const st = stats.current;
    onFinishRef.current({
      result: won ? "WIN" : "LOSE",
      playerClass: playerClassId,
      opponentClass: opponentClassId,
      opponentName,
      playerHP: Math.max(0, s.player.hp),
      opponentHP: Math.max(0, s.opponent.hp),
      maxCombo: st.maxCombo,
      avgTimeMs: st.answered > 0 ? Math.round(st.totalTimeMs / st.answered) : 0,
      accuracy: st.answered > 0 ? Math.round((st.correct / st.answered) * 100) : 0,
      mode,
    });
  };

  const maybeAdvance = () => {
    if (finished.current) return;
    if (!answeredRef.current || !opponentDoneRef.current) return;
    if (isGameOver(stateRef.current)) {
      finalize();
      return;
    }
    advanceTimer.current = setTimeout(() => {
      if (finished.current) return;
      const ns = advance(stateRef.current);
      commit(ns);
      if (isGameOver(ns)) {
        finalize();
        return;
      }
      startQuestionRef.current(ns);
    }, ADVANCE_DELAY);
  };

  const handleTimeout = () => {
    if (finished.current || answeredRef.current) return;
    if (opponentTimer.current) {
      clearTimeout(opponentTimer.current);
      opponentTimer.current = null;
    }
    opponentDoneRef.current = true;
    setOpponentThinking(false);
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    const ns = playerAnswer(stateRef.current, "", stateRef.current.timeLimitMs);
    commit(ns.state);
    answeredRef.current = true;
    triggerFlash("miss");
    stats.current.answered += 1;
    maybeAdvance();
  };

  const handleOpponentFire = () => {
    if (finished.current || opponentDoneRef.current) return;
    if (!planRef.current) return;
    const ns = applyOpponentTurn(stateRef.current, planRef.current);
    commit(ns.state);
    opponentDoneRef.current = true;
    setOpponentThinking(false);
    if (isGameOver(ns.state)) {
      finalize();
      return;
    }
    maybeAdvance();
  };

  const startQuestion = (s: DuelState) => {
    if (finished.current) return;
    answeredRef.current = false;
    inputRef.current = "";
    setInput("");
    planRef.current = planOpponentTurn(s);
    questionStart.current = Date.now();
    setTimeLeftMs(s.timeLimitMs);

    countdownTimer.current = setInterval(() => {
      const elapsed = Date.now() - questionStart.current;
      const left = Math.max(0, s.timeLimitMs - elapsed);
      setTimeLeftMs(left);
      if (left <= 0) handleTimeout();
    }, TICK_MS);

    if (planRef.current.frozen) {
      opponentDoneRef.current = true;
      setOpponentThinking(false);
    } else {
      opponentDoneRef.current = false;
      setOpponentThinking(true);
      opponentTimer.current = setTimeout(() => {
        handleOpponentFire();
      }, planRef.current.thinkMs);
    }
  };
  startQuestionRef.current = startQuestion;

  const submit = () => {
    if (finished.current || answeredRef.current) return;
    if (stateRef.current.phase !== "question") return;
    const val = inputRef.current.trim();
    if (val === "") return;
    const timeMs = Date.now() - questionStart.current;
    const ns = playerAnswer(stateRef.current, val, timeMs);
    commit(ns.state);
    answeredRef.current = true;
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    stats.current.answered += 1;
    if (ns.result.correct) {
      stats.current.correct += 1;
      stats.current.totalTimeMs += timeMs;
      stats.current.maxCombo = Math.max(stats.current.maxCombo, ns.state.player.combo);
      triggerFlash(ns.result.isCrit ? "crit" : "hit");
    } else {
      triggerFlash("miss");
    }
    if (isGameOver(ns.state)) {
      if (opponentTimer.current) {
        clearTimeout(opponentTimer.current);
        opponentTimer.current = null;
      }
      finalize();
      return;
    }
    maybeAdvance();
  };

  // init : première question
  useEffect(() => {
    finished.current = false;
    stats.current = { answered: 0, correct: 0, totalTimeMs: 0, maxCombo: 0 };
    startQuestionRef.current(stateRef.current);
    return () => {
      clearTimers();
    };
  }, []);

  const doCastSpell = (id: SpellId) => {
    if (stateRef.current.phase !== "question") return false;
    const r = castSpell(stateRef.current, id);
    if (r.ok) {
      commit(r.state);
      triggerFlash("heal");
    }
    return r.ok;
  };
  const doCastUlt = () => {
    if (stateRef.current.phase !== "question") return false;
    const r = castUltimate(stateRef.current);
    if (r.ok) {
      commit(r.state);
      triggerFlash("crit");
    }
    return r.ok;
  };
  const doShield = () => {
    if (stateRef.current.phase !== "question") return false;
    const r = engineShield(stateRef.current);
    if (r.ok) {
      commit(r.state);
      triggerFlash("heal");
    }
    return r.ok;
  };
  const quit = () => {
    clearTimers();
    onQuitRef.current();
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
    doCastSpell,
    doCastUlt,
    doShield,
    canSpell: (id: SpellId) => canCastSpell(stateRef.current, id),
    canUlt: () => canCastUltimate(stateRef.current),
    canShield: () => canActivateShield(stateRef.current),
    quit,
  };
}
