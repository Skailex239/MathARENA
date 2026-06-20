"use client";

import { useEffect, useRef, useState } from "react";
import { useCompetitiveDuel } from "@/hooks/useCompetitiveDuel";
import { useApp } from "@/lib/store";
import { CATEGORY_LABEL, DIFFICULTY_LABEL } from "@/lib/game/math";
import { Btn, RankBadge } from "./ui";
import { DuelLog } from "./DuelLog";
import { cn } from "@/lib/utils";
import type { CompLogEntry } from "@/lib/game/competitive-engine";
import type { DuelLogEntry } from "@/lib/game/types";

const MODE_LABEL: Record<string, string> = {
  PRACTICE: "Entraînement",
  QUICK: "Rapide",
  BLITZ: "Blitz",
  RANKED: "Classé",
};

// Adaptateur : convertit les entrées du log compétitif vers le format DuelLog.
function toDuelLogEntries(entries: CompLogEntry[]): DuelLogEntry[] {
  const kindMap: Record<CompLogEntry["kind"], DuelLogEntry["kind"]> = {
    point: "hit",
    miss: "miss",
    lockout: "miss",
    timeout: "miss",
    info: "info",
  };
  return entries.map((e) => ({
    id: e.id,
    side: e.side,
    text: e.text,
    kind: kindMap[e.kind],
    ts: e.ts,
  }));
}

export function CompetitiveDuelScreen() {
  const selectedMode = useApp((s) => s.selectedMode);
  const opponentName = useApp((s) => s.opponentName);
  const setView = useApp((s) => s.setView);
  const setLastResult = useApp((s) => s.setLastResult);

  const [elo, setElo] = useState(1000);
  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((p) => setElo(p?.eloCompetitive ?? p?.elo ?? 1000)).catch(() => {});
  }, []);

  const duel = useCompetitiveDuel({
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
    if (state.phase === "question" && !state.playerLocked) inputRef.current?.focus();
  }, [state.phase, state.questionIndex, state.playerLocked]);

  if (!state.question) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0e1116] text-[#9ba4b0] text-sm">
        Chargement…
      </div>
    );
  }

  const timePct = Math.max(0, Math.min(100, (timeLeftMs / state.timeLimitMs) * 100));
  const urgent = timeLeftMs <= 3000 && timeLeftMs > 0;
  const timerColor = urgent ? "#f85149" : timePct > 40 ? "#e6edf3" : "#d29922";
  const locked = state.phase !== "question" || state.playerLocked;

  return (
    <div className="min-h-screen flex flex-col bg-[#0e1116]">
      {/* Top bar */}
      <header className="border-b border-[#2d333b] bg-[#0e1116]">
        <div className="mx-auto max-w-3xl px-4 h-12 grid grid-cols-3 items-center">
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
            {MODE_LABEL[state.mode] ?? state.mode} · Compétitif
          </span>
        </div>
      </header>

      {/* Score panel (à la Chess.com : deux noms + score centré) */}
      <div className="mx-auto max-w-3xl w-full px-4 pt-4">
        <div className="rounded-lg border border-[#2d333b] bg-[#161b22] p-3">
          <div className="grid grid-cols-3 items-center gap-2">
            {/* Joueur */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-sm text-[#e6edf3] truncate">Toi</span>
              <RankBadge elo={elo} />
            </div>
            {/* Score centré */}
            <div className="flex items-center justify-center gap-3">
              <span className={cn("font-mono text-3xl font-medium", state.playerScore >= state.opponentScore ? "text-[#3b82f6]" : "text-[#9ba4b0]")}>
                {state.playerScore}
              </span>
              <span className="text-[#6e7681] text-sm">—</span>
              <span className={cn("font-mono text-3xl font-medium", state.opponentScore > state.playerScore ? "text-[#f85149]" : "text-[#9ba4b0]")}>
                {state.opponentScore}
              </span>
            </div>
            {/* Adversaire */}
            <div className="flex items-center gap-2 justify-end min-w-0">
              {opponentThinking && <span className="text-[10px] text-[#6e7681]">…</span>}
              <span className="font-medium text-sm text-[#e6edf3] truncate text-right">{opponentName}</span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[10px] text-[#6e7681] shrink-0">Premier à {duel.targetScore}</span>
            <div className="flex-1 h-1 rounded-sm bg-[#1c2128] overflow-hidden">
              <div className="h-full bg-[#3b82f6]" style={{ width: `${(state.playerScore / duel.targetScore) * 100}%` }} />
            </div>
            <div className="flex-1 h-1 rounded-sm bg-[#1c2128] overflow-hidden">
              <div className="h-full bg-[#f85149] ml-auto" style={{ width: `${(state.opponentScore / duel.targetScore) * 100}%` }} />
            </div>
            <span className="text-[10px] text-[#6e7681] shrink-0">points</span>
          </div>
        </div>
      </div>

      {/* Question + input */}
      <div className="mx-auto max-w-3xl w-full px-4 pt-4">
        <div className="rounded-lg border border-[#2d333b] bg-[#161b22] p-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c2128] border border-[#2d333b] text-[#6e7681] uppercase tracking-wide">
              {CATEGORY_LABEL[state.question.category]}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c2128] border border-[#2d333b] text-[#6e7681] uppercase tracking-wide">
              {DIFFICULTY_LABEL[state.question.difficulty]}
            </span>
          </div>

          <div className="text-center font-mono font-medium text-3xl sm:text-4xl text-[#e6edf3]">
            {state.question.text.endsWith("?") ? (
              state.question.text
            ) : (
              <>
                {state.question.text} = <span className="text-[#6e7681]">?</span>
              </>
            )}
          </div>

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
              placeholder={state.playerLocked ? "Verrouillé" : "Réponse"}
              autoComplete="off"
              className={cn(
                "w-48 sm:w-64 text-center text-2xl font-mono font-medium bg-[#1c2128] border rounded-md px-3 py-2 outline-none transition-colors",
                flash === "wrong"
                  ? "border-[#f85149] animate-shake"
                  : flash === "correct"
                    ? "border-[#2ea043]"
                    : "border-[#2d333b] focus:border-[#3b82f6]",
                state.playerLocked && "border-[#6e7681] text-[#6e7681]",
                "disabled:opacity-50",
              )}
            />
            <Btn type="submit" disabled={locked || input.trim() === ""}>
              Valider
            </Btn>
          </form>
        </div>
      </div>

      {/* Log */}
      <div className="flex-1 mx-auto max-w-3xl w-full px-4 pt-4 pb-4">
        <div className="h-40">
          <DuelLog entries={toDuelLogEntries(state.log)} />
        </div>
      </div>
    </div>
  );
}
