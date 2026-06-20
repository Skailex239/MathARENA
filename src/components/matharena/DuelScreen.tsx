"use client";

import { useEffect, useRef, useState } from "react";
import { useDuel } from "@/hooks/useDuel";
import { useApp } from "@/lib/store";
import { CATEGORY_LABEL, DIFFICULTY_LABEL } from "@/lib/game/math";
import { Btn } from "./ui";
import { CombatantPanel } from "./CombatantPanel";
import { SpellDock } from "./SpellDock";
import { DuelLog } from "./DuelLog";
import { cn } from "@/lib/utils";

const MODE_LABEL: Record<string, string> = {
  PRACTICE: "Entraînement",
  QUICK: "Rapide",
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
  const timerColor = urgent ? "#f85149" : timePct > 40 ? "#e6edf3" : "#d29922";
  const locked = state.phase !== "question";

  return (
    <div className="min-h-screen flex flex-col bg-[#0e1116]">
      {/* Top bar sobre : abandon | timer centre | mode */}
      <header className="border-b border-[#2d333b] bg-[#0e1116]">
        <div className="mx-auto max-w-4xl px-4 h-12 grid grid-cols-3 items-center">
          <button onClick={duel.quit} className="text-sm text-[#9ba4b0] hover:text-[#f85149] justify-self-start">
            ✕ Abandonner
          </button>
          <div className="flex flex-col items-center">
            <span
              className={cn("font-mono font-medium text-xl leading-none", urgent && "animate-timer-urgent")}
              style={{ color: timerColor }}
            >
              {(timeLeftMs / 1000).toFixed(1)}s
            </span>
            <span className="text-[10px] text-[#6e7681] mt-0.5">Question {state.questionIndex + 1}</span>
          </div>
          <span className="text-xs text-[#9ba4b0] justify-self-end">
            {MODE_LABEL[state.mode] ?? state.mode}
          </span>
        </div>
      </header>

      {/* Panneaux joueur / adversaire */}
      <div className="mx-auto max-w-4xl w-full px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <CombatantPanel
            combatant={state.player}
            name="Toi"
            elo={elo}
            side="player"
            isMe
            shake={flash === "miss"}
          />
          <CombatantPanel
            combatant={state.opponent}
            name={opponentName}
            elo={1000}
            side="opponent"
            thinking={opponentThinking}
            shake={flash === "hit" || flash === "crit"}
          />
        </div>
      </div>

      {/* Question + input */}
      <div className="mx-auto max-w-4xl w-full px-4 pt-4">
        <div className="rounded-lg border border-[#2d333b] bg-[#161b22] p-6">
          {/* badges catégorie */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c2128] border border-[#2d333b] text-[#6e7681] uppercase tracking-wide">
              {CATEGORY_LABEL[state.question.category]}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c2128] border border-[#2d333b] text-[#6e7681] uppercase tracking-wide">
              {DIFFICULTY_LABEL[state.question.difficulty]}
            </span>
          </div>

          {/* question mono */}
          <div className="text-center font-mono font-medium text-3xl sm:text-4xl text-[#e6edf3]">
            {state.question.text.endsWith("?") ? (
              state.question.text
            ) : (
              <>
                {state.question.text} = <span className="text-[#6e7681]">?</span>
              </>
            )}
          </div>

          {/* input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="mt-4 flex items-center justify-center gap-2"
          >
            <input
              ref={inputRef}
              inputMode="numeric"
              pattern="-?[0-9]*"
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/[^0-9-]/g, ""))}
              disabled={locked}
              placeholder="Réponse"
              autoComplete="off"
              className={cn(
                "w-48 sm:w-64 text-center text-2xl font-mono font-medium bg-[#1c2128] border rounded-md px-3 py-2 outline-none transition-colors",
                flash === "miss"
                  ? "border-[#f85149] animate-shake"
                  : flash === "hit" || flash === "crit"
                    ? "border-[#2ea043]"
                    : "border-[#2d333b] focus:border-[#3b82f6]",
                "disabled:opacity-50",
              )}
            />
            <Btn type="submit" disabled={locked || input.trim() === ""}>
              Valider
            </Btn>
          </form>
        </div>
      </div>

      {/* Sorts + log */}
      <div className="flex-1 mx-auto max-w-4xl w-full px-4 pt-4 pb-4 grid lg:grid-cols-[1.5fr_1fr] gap-3 min-h-0">
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
        <div className="h-32 lg:h-auto">
          <DuelLog entries={state.log} />
        </div>
      </div>
    </div>
  );
}
