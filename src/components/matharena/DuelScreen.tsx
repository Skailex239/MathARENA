"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDuel } from "@/hooks/useDuel";
import { useApp } from "@/lib/store";
import { CLASSES } from "@/lib/game/classes";
import { CATEGORY_LABEL, DIFFICULTY_LABEL } from "@/lib/game/math";
import { Btn } from "./ui";
import { CombatantPanel } from "./CombatantPanel";
import { SpellDock } from "./SpellDock";
import { EmoteDock } from "./EmoteDock";
import { DuelLog } from "./DuelLog";
import { cn } from "@/lib/utils";

const MODE_LABEL: Record<string, string> = {
  PRACTICE: "Entraînement",
  QUICK: "Partie rapide",
  BLITZ: "Blitz",
  RANKED: "Classé",
};

export function DuelScreen() {
  const selectedClass = useApp((s) => s.selectedClass);
  const selectedMode = useApp((s) => s.selectedMode);
  const opponentClass = useApp((s) => s.opponentClass);
  const opponentName = useApp((s) => s.opponentName);
  const setView = useApp((s) => s.setView);
  const setLastResult = useApp((s) => s.setLastResult);

  // Elo du joueur pour le badge de rang (décoratif côté duel)
  const [elo, setElo] = useState(1000);
  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((p) => setElo(p?.elo ?? 1000)).catch(() => {});
  }, []);

  const duel = useDuel({
    playerClassId: selectedClass,
    opponentClassId: opponentClass,
    mode: selectedMode,
    opponentName,
    onFinish: (payload) => {
      setLastResult(payload);
      setView("results");
    },
    onQuit: () => setView("home"),
  });

  const { state, timeLeftMs, opponentThinking, flash, input, setInput, submit } = duel;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.phase === "question") inputRef.current?.focus();
  }, [state.phase, state.questionIndex]);

  const timePct = Math.max(0, Math.min(100, (timeLeftMs / state.timeLimitMs) * 100));
  const urgent = timeLeftMs <= 3000 && timeLeftMs > 0;
  const timerColor = urgent ? "#ef4444" : timePct > 50 ? "#ffffff" : "#f59e0b";
  const locked = state.phase !== "question";

  // overlay rouge sur panneau adverse quand elle prend un coup
  const oppHit = flash === "hit" || flash === "crit";
  const selfHit = flash === "miss";

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] grid-bg">
      {/* ===== TOP BAR : abandon + timer centré + mode ===== */}
      <header className="border-b border-[#30363d] bg-[rgba(13,17,23,0.85)] backdrop-blur-lg">
        <div className="mx-auto max-w-5xl px-3 sm:px-5 h-14 grid grid-cols-3 items-center">
          <div>
            <Btn variant="ghost" size="sm" onClick={duel.quit} className="text-[#8b949e] hover:text-[#ef4444]">
              ✕ Abandonner
            </Btn>
          </div>

          {/* Timer centré */}
          <div className="flex flex-col items-center">
            <div
              className={cn("font-mono font-bold text-3xl sm:text-4xl leading-none", urgent && "animate-pulse-danger")}
              style={{ color: timerColor, textShadow: urgent ? "0 0 16px rgba(239,68,68,0.7)" : "none" }}
            >
              {(timeLeftMs / 1000).toFixed(1)}s
            </div>
            <div className="mt-1 h-1 w-24 sm:w-32 rounded-full bg-[#21262d] overflow-hidden">
              <div
                className="h-full transition-[width] duration-100 ease-linear"
                style={{ width: `${timePct}%`, background: timerColor }}
              />
            </div>
          </div>

          <div className="flex justify-end items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full border border-[rgba(37,99,235,0.5)] text-[#00d4ff] font-semibold">
              {MODE_LABEL[state.mode] ?? state.mode}
            </span>
            <span className="text-[#8b949e] hidden sm:inline">
              Q<span className="font-mono text-white ml-1">{state.questionIndex + 1}</span>
            </span>
          </div>
        </div>
      </header>

      {/* ===== PANNEAUX JOUEUR / ADVERSAIRE ===== */}
      <div className="mx-auto max-w-5xl w-full px-3 sm:px-5 pt-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <CombatantPanel
            combatant={state.player}
            name="Toi"
            elo={elo}
            side="player"
            isMe
            shake={selfHit}
            redFlash={selfHit}
          />
          <CombatantPanel
            combatant={state.opponent}
            name={opponentName}
            elo={1000}
            side="opponent"
            thinking={opponentThinking}
            shake={oppHit}
            redFlash={oppHit}
          />
        </div>
      </div>

      {/* ===== QUESTION + INPUT ===== */}
      <div className="mx-auto max-w-5xl w-full px-3 sm:px-5 pt-3">
        <div className="relative rounded-xl border border-[#30363d] bg-[#161b22] p-4 sm:p-6 overflow-hidden">
          {/* timer bar top */}
          <div className="absolute top-0 inset-x-0 h-0.5 bg-[#21262d]">
            <div className="h-full transition-[width] duration-100 ease-linear" style={{ width: `${timePct}%`, background: timerColor }} />
          </div>

          {/* badges catégorie/difficulté */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#21262d] border border-[#30363d] text-[#8b949e]">
              {CATEGORY_LABEL[state.question.category]}
            </span>
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                state.question.difficulty === "legendaire"
                  ? "border-[#ff0080] text-[#ff0080]"
                  : state.question.difficulty === "extreme"
                    ? "border-[#7c3aed] text-[#7c3aed]"
                    : "border-[#30363d] text-[#8b949e]",
              )}
            >
              {DIFFICULTY_LABEL[state.question.difficulty]}
            </span>
          </div>

          <motion.div
            key={state.questionIndex}
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="text-center"
          >
            <div className="font-mono font-bold text-4xl sm:text-6xl tracking-tight text-glow-blue">
              {state.question.text.endsWith("?") ? (
                state.question.text
              ) : (
                <>
                  {state.question.text} = <span className="text-[#8b949e]">?</span>
                </>
              )}
            </div>
          </motion.div>

          {/* flash central */}
          <div className="h-6 mt-1 text-center">
            <AnimatePresence>
              {flash && (
                <motion.div
                  key={flash + state.questionIndex}
                  initial={{ opacity: 0, y: 6, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "text-sm font-bold",
                    flash === "crit" && "text-[#ff0080] text-glow-blue",
                    flash === "hit" && "text-[#22c55e]",
                    flash === "miss" && "text-[#ef4444]",
                    flash === "heal" && "text-[#22c55e]",
                  )}
                >
                  {flash === "crit" && "💥 CRITIQUE !"}
                  {flash === "hit" && "⚔️ Touché !"}
                  {flash === "miss" && "✗ Raté"}
                  {flash === "heal" && "✨ Renforcé"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* INPUT réponse */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="mt-3 flex items-center justify-center gap-2"
          >
            <input
              ref={inputRef}
              inputMode="numeric"
              pattern="-?[0-9]*"
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/[^0-9-]/g, ""))}
              disabled={locked}
              placeholder="Ta réponse…"
              autoComplete="off"
              className={cn(
                "w-44 sm:w-64 text-center text-2xl font-mono font-bold bg-[#21262d] border-2 rounded-lg px-3 py-2.5 outline-none transition-all",
                flash === "miss"
                  ? "border-[#ef4444] animate-shake"
                  : flash === "hit" || flash === "crit"
                    ? "border-[#22c55e] animate-correct"
                    : "border-[#30363d] focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.25)]",
                "disabled:opacity-50",
              )}
            />
            <Btn type="submit" disabled={locked || input.trim() === ""} size="lg">
              Valider
            </Btn>
          </form>
        </div>
      </div>

      {/* ===== SORTS + EMOTES + LOG ===== */}
      <div className="flex-1 mx-auto max-w-5xl w-full px-3 sm:px-5 pt-3 pb-4 grid lg:grid-cols-[1.4fr_1fr] gap-3 min-h-0">
        <div className="flex flex-col gap-3">
          <SpellDock
            classId={state.player.classId}
            combo={state.player.combo}
            energy={state.player.energy}
            locked={locked}
            canSpell={duel.canSpell}
            canUlt={duel.canUlt}
            canShield={duel.canShield}
            onSpell={duel.doCastSpell}
            onUlt={duel.doCastUlt}
            onShield={duel.doShield}
          />
          <EmoteDock />
        </div>
        <div className="h-44 lg:h-auto">
          <DuelLog entries={state.log} />
        </div>
      </div>
    </div>
  );
}
