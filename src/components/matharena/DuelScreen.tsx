"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDuel } from "@/hooks/useDuel";
import { useApp } from "@/lib/store";
import { CLASSES } from "@/lib/game/classes";
import { CATEGORY_LABEL, DIFFICULTY_LABEL } from "@/lib/game/math";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CombatantPanel } from "./CombatantPanel";
import { SpellDock } from "./SpellDock";
import { DuelLog } from "./DuelLog";

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

  // autofocus du champ de réponse à chaque nouvelle question
  useEffect(() => {
    if (state.phase === "question") inputRef.current?.focus();
  }, [state.phase, state.questionIndex]);

  const timePct = Math.max(0, Math.min(100, (timeLeftMs / state.timeLimitMs) * 100));
  const timerColor =
    timePct > 50 ? "#3ddc84" : timePct > 25 ? "#ffb02e" : "#f44747";
  const locked = state.phase !== "question";

  const playerDef = CLASSES[state.player.classId];

  return (
    <div className="min-h-screen flex flex-col grid-bg">
      {/* barre supérieure */}
      <header className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 border-b border-border/60 bg-background/60 backdrop-blur">
        <Button
          variant="ghost"
          size="sm"
          onClick={duel.quit}
          className="text-muted-foreground hover:text-[#f44747] h-9"
        >
          ✕ Abandonner
        </Button>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full border border-[#ff3d8b]/50 text-[#ff3d8b] font-semibold">
            {MODE_LABEL[state.mode] ?? state.mode}
          </span>
          <span className="text-muted-foreground">
            Question <span className="font-mono text-foreground">{state.questionIndex + 1}</span>
          </span>
        </div>
      </header>

      {/* panneaux combattants */}
      <div className="px-3 sm:px-5 pt-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <CombatantPanel
            combatant={state.player}
            name="Toi"
            side="player"
            isMe
            flash={flash === "crit" || flash === "hit" ? flash : flash === "miss" ? "miss" : null}
          />
          <CombatantPanel
            combatant={state.opponent}
            name={opponentName}
            side="opponent"
            thinking={opponentThinking}
            flash={null}
          />
        </div>
      </div>

      {/* zone question + timer + saisie */}
      <div className="px-3 sm:px-5 pt-3">
        <div className="relative rounded-2xl border border-border/70 bg-card/80 backdrop-blur p-4 sm:p-6 overflow-hidden">
          {/* timer bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-black/40">
            <div
              className="h-full transition-all duration-100 ease-linear"
              style={{ width: `${timePct}%`, background: timerColor }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 border border-border/60 text-muted-foreground">
              {CATEGORY_LABEL[state.question.category]}
            </span>
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                state.question.difficulty === "legendaire"
                  ? "border-[#ff3d8b] text-[#ff3d8b]"
                  : state.question.difficulty === "extreme"
                    ? "border-[#b15cff] text-[#b15cff]"
                    : "border-border/60 text-muted-foreground",
              )}
            >
              {DIFFICULTY_LABEL[state.question.difficulty]}
            </span>
            <span className="font-mono text-sm font-bold" style={{ color: timerColor }}>
              {(timeLeftMs / 1000).toFixed(1)}s
            </span>
          </div>

          <motion.div
            key={state.questionIndex}
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-4xl sm:text-6xl font-black tracking-tight font-mono text-glow-magenta">
              {state.question.text.endsWith("?") ? (
                state.question.text
              ) : (
                <>
                  {state.question.text} = <span className="text-muted-foreground">?</span>
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
                    flash === "crit" && "text-[#ff3d8b] text-glow-magenta",
                    flash === "hit" && "text-[#3ddc84]",
                    flash === "miss" && "text-[#f44747]",
                    flash === "heal" && "text-[#3ddc84]",
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

          {/* saisie */}
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
              className="w-44 sm:w-64 text-center text-2xl font-mono font-bold bg-black/40 border-2 border-border/60 focus:border-[#ff3d8b] rounded-xl px-3 py-2.5 outline-none transition-colors disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={locked || input.trim() === ""}
              className="h-12 px-5 bg-[#ff3d8b] hover:bg-[#ff3d8b]/85 text-white font-bold"
            >
              Valider
            </Button>
          </form>
        </div>
      </div>

      {/* sorts + journal */}
      <div className="flex-1 px-3 sm:px-5 pt-3 pb-4 grid lg:grid-cols-[1.4fr_1fr] gap-3 min-h-0">
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
        <div className="h-44 lg:h-auto">
          <DuelLog entries={state.log} />
        </div>
      </div>

      <div className="sr-only">
        Classe joueur : {playerDef.name} — {playerDef.passive.name}. Ultime : {playerDef.ultimate.name}.
      </div>
    </div>
  );
}
