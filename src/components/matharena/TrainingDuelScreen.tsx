"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { CATEGORY_LABEL, DIFFICULTY_LABEL } from "@/lib/game/math";
import { generateQuestion } from "@/lib/game/math";
import { sound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/game/types";

const SPRINT_DURATION_MS = 120000; // 2 min
const TICK_MS = 100;

function fmtDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TrainingDuelScreen() {
  const setView = useApp((s) => s.setView);
  const setLastResult = useApp((s) => s.setLastResult);
  const trainingExercise = useApp((s) => s.trainingExercise);

  const [question, setQuestion] = useState<Question>(() =>
    generateQuestion({ mode: "QUICK", questionIndex: 0 }),
  );
  const [input, setInput] = useState("");
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [totalTimeMs, setTotalTimeMs] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(SPRINT_DURATION_MS);
  const [questionStart, setQuestionStart] = useState(Date.now());
  const [gameOver, setGameOver] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [savedInfo, setSavedInfo] = useState<{ xpGained: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);
  const endMatchRef = useRef<() => void>(() => {});

  const endMatch = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (countdownRef.current) clearInterval(countdownRef.current);
    sound.bell();
    setGameOver(true);
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    const avgTimeMs = correct > 0 ? Math.round(totalTimeMs / correct) : 0;
    setLastResult({
      universe: "arena",
      result: correct > 0 ? "WIN" : "LOSE",
      playerClass: null,
      opponentClass: null,
      opponentName: "Entraînement",
      playerHP: correct,
      opponentHP: 0,
      maxCombo: 0,
      avgTimeMs,
      accuracy,
      mode: "PRACTICE",
    });
    // save (entraînement = universe arena, mode PRACTICE = pas d'Elo)
    api.saveMatch({
      universe: "arena",
      playerClass: null,
      opponentClass: null,
      opponentName: "Entraînement",
      result: correct > 0 ? "WIN" : "LOSE",
      playerHP: correct,
      opponentHP: 0,
      maxCombo: 0,
      avgTimeMs,
      accuracy,
      mode: "PRACTICE",
    }).then(({ match }) => {
      setSavedInfo({ xpGained: match.xpGained });
    }).catch(() => {});
    setTimeout(() => setShowStats(true), 1200);
  };

  const submit = () => {
    if (gameOver || input.trim() === "") return;
    const timeMs = Date.now() - questionStart;
    const val = Number.parseInt(input, 10);
    const isCorrect = Number.isFinite(val) && val === question.answer;
    setAnswered((a) => a + 1);
    if (isCorrect) {
      setCorrect((c) => c + 1);
      setTotalTimeMs((t) => t + timeMs);
      setFlash("correct");
      sound.correct();
      // next question
      setQuestion(generateQuestion({ mode: "QUICK", questionIndex: answered + 1 }));
    } else {
      setFlash("wrong");
      sound.wrong();
    }
    setInput("");
    setQuestionStart(Date.now());
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 300);
  };

  endMatchRef.current = endMatch;

  useEffect(() => {
    sound.setMuted(true);
    inputRef.current?.focus();
    countdownRef.current = setInterval(() => {
      setTimeLeftMs((prev) => {
        const next = prev - TICK_MS;
        if (next <= 0) {
          endMatchRef.current();
          return 0;
        }
        return next;
      });
    }, TICK_MS);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!gameOver) inputRef.current?.focus();
  }, [question, gameOver]);

  const timePct = (timeLeftMs / SPRINT_DURATION_MS) * 100;
  const urgent = timeLeftMs <= 10000 && timeLeftMs > 0;
  const timerColor = urgent ? "#c45a4a" : timeLeftMs <= 30000 ? "#d9a441" : "#f0b27a";
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const avgSpeed = correct > 0 ? (totalTimeMs / correct / 1000).toFixed(1) : "—";

  const inputBorderClass = flash === "wrong"
    ? "border-[#c45a4a] animate-shake"
    : flash === "correct"
      ? "border-[#8faf7e]"
      : "border-[#dcd0bc] focus:border-[#f0b27a]";

  return (
    <div className="h-screen flex flex-col bg-[#f5efe6] overflow-hidden relative">
      {/* Discrete icons */}
      <button
        onClick={() => { if (confirm("Quitter l'entraînement ?")) { endMatch(); setView("home"); } }}
        className="absolute top-3 left-3 z-30 text-[#9c8e7a] hover:text-[#2a2520] opacity-40 hover:opacity-100 transition-opacity text-lg"
      >
        ✕
      </button>
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
        <span className="text-[#9c8e7a] text-sm font-mono">🎯 Entraînement</span>
      </div>

      {/* Main focus */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 min-h-0 gap-5">
        {/* Timer */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={cn("font-mono font-bold text-5xl sm:text-6xl leading-none", urgent && "animate-timer-pulse")}
            style={{ color: timerColor }}
          >
            {fmtDuration(timeLeftMs)}
          </div>
          <div className="w-48 sm:w-64 h-1 rounded-full bg-[#efe8db] overflow-hidden">
            <div
              className="h-full transition-[width] duration-100 ease-linear rounded-full"
              style={{ width: `${timePct}%`, background: timerColor }}
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs font-medium uppercase tracking-wider text-[#9c8e7a] text-center">
          Question {answered + 1} · {CATEGORY_LABEL[question.category]} · {DIFFICULTY_LABEL[question.difficulty]}
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={answered}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
            className="rounded-2xl border border-[rgba(240,178,122,0.2)] bg-gradient-to-b from-[#faf6f0] to-[#efe8db] px-8 py-10 sm:px-14 sm:py-12 max-w-[680px] w-full text-center"
            style={{ boxShadow: "0 0 40px rgba(240,178,122,0.08)" }}
          >
            <div className="font-mono font-bold text-4xl sm:text-6xl xl:text-7xl text-[#2a2520]">
              {question.text.endsWith("?") ? (
                question.text
              ) : (
                <>
                  {question.text} = <span className="text-[#9c8e7a]">?</span>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="w-full max-w-[680px] flex items-center gap-2"
        >
          <input
            ref={inputRef}
            inputMode="numeric"
            pattern="-?[0-9]*"
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/[^0-9-]/g, ""))}
            placeholder="—"
            autoComplete="off"
            className={cn(
              "flex-1 text-center font-mono font-bold text-3xl sm:text-5xl bg-[#efe8db] border-2 rounded-xl px-5 py-4 outline-none transition-colors",
              inputBorderClass,
            )}
          />
          <button
            type="submit"
            className="shrink-0 px-4 py-4 rounded-xl text-sm font-medium text-[#9c8e7a] border border-[#dcd0bc] hover:text-[#f0b27a] hover:border-[#f0b27a] hover:bg-[#e8dfcd] transition-colors"
          >
            Valider
          </button>
        </form>
        <div className="text-[11px] font-medium uppercase tracking-wider text-[#9c8e7a]">
          Validation auto · ⌨ Entrée · Valider
        </div>
      </main>

      {/* Player panel (solo, no opponent) */}
      {!gameOver && (
        <div className="shrink-0 px-4 pb-4">
          <div className="mx-auto max-w-[680px]">
            <div className="rounded-[10px] border border-[#dcd0bc] bg-[#faf6f0] p-4 flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="grid place-items-center w-8 h-8 rounded-full bg-[#efe8db] border border-[#dcd0bc] text-sm font-semibold text-[#2a2520]">J</div>
                <div>
                  <div className="text-sm font-semibold text-[#2a2520]">Toi</div>
                  <div className="text-xs text-[#9c8e7a]">Entraînement · {TRAINING_LABEL[trainingExercise]}</div>
                </div>
              </div>
              <div className="flex-1" />
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-[#9c8e7a]">Réussies</div>
                <div className="font-mono text-lg text-[#f0b27a]">{correct}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-[#9c8e7a]">Précision</div>
                <div className="font-mono text-lg text-[#2a2520]">{accuracy}%</div>
              </div>
            </div>
          </div>

          {/* Mobile keypad */}
          <div className="lg:hidden mt-3 mx-auto max-w-[680px] grid grid-cols-3 gap-1.5">
            {["1","2","3","4","5","6","7","8","9"].map((k) => (
              <button key={k} type="button" onClick={() => setInput(input + k)}
                className="h-14 rounded-md bg-[#efe8db] border border-[#dcd0bc] text-xl font-mono font-medium text-[#2a2520] active:bg-[#f0b27a] active:text-[#2a2520] transition-colors">{k}</button>
            ))}
            <button type="button" onClick={() => setInput(input.slice(0, -1))}
              className="h-14 rounded-md bg-[#efe8db] border border-[#dcd0bc] text-xl text-[#c9bfb0] active:bg-[#e8dfcd] transition-colors">←</button>
            <button type="button" onClick={() => setInput(input + "0")}
              className="h-14 rounded-md bg-[#efe8db] border border-[#dcd0bc] text-xl font-mono font-medium text-[#2a2520] active:bg-[#f0b27a] active:text-[#2a2520] transition-colors">0</button>
            <button type="button" onClick={submit}
              className="h-14 rounded-md bg-[#f0b27a] border border-[#f0b27a] text-xl text-[#2a2520] font-semibold active:bg-[#e5c99a] transition-colors">✓</button>
          </div>
        </div>
      )}

      {/* End stats modal */}
      <AnimatePresence>
        {gameOver && showStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 grid place-items-center bg-[rgba(42,37,32,0.4)] p-4"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
              className="w-full max-w-md rounded-2xl border border-[#dcd0bc] bg-[#faf6f0] p-6"
            >
              <div className="text-center mb-5">
                <div className="font-display font-extrabold text-3xl text-[#f0b27a]">Entraînement terminé</div>
                <div className="mt-1 text-sm text-[#9c8e7a]">{TRAINING_LABEL[trainingExercise]}</div>
              </div>
              <div className="space-y-2.5 mb-5">
                <div className="flex items-center justify-between py-2 border-b border-[#ebe2d2]">
                  <span className="text-sm text-[#c9bfb0]">Questions réussies</span>
                  <span className="font-mono text-lg text-[#2a2520]">{correct}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#ebe2d2]">
                  <span className="text-sm text-[#c9bfb0]">Précision</span>
                  <span className="font-mono text-[#2a2520]">{accuracy}% ({correct}/{answered})</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#ebe2d2]">
                  <span className="text-sm text-[#c9bfb0]">Vitesse moyenne</span>
                  <span className="font-mono text-[#2a2520]">{avgSpeed}s</span>
                </div>
                {savedInfo && (
                  <div className="flex items-center justify-between py-2 border-b border-[#ebe2d2]">
                    <span className="text-sm text-[#c9bfb0]">XP gagné</span>
                    <span className="font-mono text-[#d9a441]">+{savedInfo.xpGained}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[#c9bfb0]">Durée</span>
                  <span className="font-mono text-[#2a2520]">2:00</span>
                </div>
              </div>
              <div className="space-y-2">
                <button onClick={() => setView("classselect")}
                  className="w-full py-2.5 rounded-lg bg-[#f0b27a] hover:bg-[#e5c99a] text-[#2a2520] font-semibold text-sm transition-colors">
                  Recommencer
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setView("profile")}
                    className="py-2 rounded-lg border border-[#dcd0bc] text-[#c9bfb0] hover:text-[#2a2520] hover:border-[#c9bba0] text-sm transition-colors">
                    📊 Analyse
                  </button>
                  <button onClick={() => setView("home")}
                    className="py-2 rounded-lg border border-[#dcd0bc] text-[#c9bfb0] hover:text-[#2a2520] hover:border-[#c9bba0] text-sm transition-colors">
                    Accueil
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TRAINING_LABEL: Record<string, string> = {
  vsia: "Vs IA",
  sprint: "Sprint solo",
  category: "Catégorie",
  daily: "Défi du jour",
};
