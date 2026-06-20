"use client";

import { useEffect, useRef, useState } from "react";
import { useCompetitiveDuel } from "@/hooks/useCompetitiveDuel";
import { useApp } from "@/lib/store";
import { CATEGORY_LABEL, DIFFICULTY_LABEL } from "@/lib/game/math";
import { PlayerPanel } from "./PlayerPanel";
import { NumericKeypad } from "./NumericKeypad";
import type { CompLogEntry } from "@/lib/game/competitive-engine";
import { cn } from "@/lib/utils";

const MODE_LABEL: Record<string, string> = {
  PRACTICE: "Entraînement",
  QUICK: "Rapide",
  BLITZ: "Blitz",
  RANKED: "Classé",
};

const LOG_ICON: Record<CompLogEntry["kind"], string> = {
  point: "✓",
  miss: "✗",
  timeout: "⏱",
  combo: "🔥",
  info: "·",
};
const LOG_COLOR: Record<CompLogEntry["kind"], string> = {
  point: "text-[#e6edf3]",
  miss: "text-[#f85149]",
  timeout: "text-[#f85149]",
  combo: "text-[#d29922]",
  info: "text-[#6e7681]",
};

function fmtTimestamp(ts: number, start: number): string {
  const sec = Math.max(0, Math.floor((ts - start) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CompetitiveDuelScreen() {
  const selectedMode = useApp((s) => s.selectedMode);
  const opponentName = useApp((s) => s.opponentName);
  const setView = useApp((s) => s.setView);
  const setLastResult = useApp((s) => s.setLastResult);

  const [elo, setElo] = useState(1000);
  const [muted, setMuted] = useState(true);
  const [latency] = useState(28);
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => setElo(p?.eloCompetitive ?? p?.elo ?? 1000))
      .catch(() => {});
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

  const {
    state,
    timeLeftMs,
    opponentThinking,
    flash,
    input,
    setInput,
    submit,
    targetScore,
    stats,
    matchStartTs,
  } = duel;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.phase === "question") inputRef.current?.focus();
  }, [state.phase, state.questionIndex]);

  // Escape = quit confirmation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirm("Abandonner le duel ?")) duel.quit();
      }
      if (e.key === "m" || e.key === "M") setMuted((m) => !m);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [duel]);

  if (!state.question) {
    return (
      <div className="h-screen grid place-items-center bg-[#0e1116] text-[#9ba4b0] text-sm">
        Chargement…
      </div>
    );
  }

  const timePct = Math.max(0, Math.min(100, (timeLeftMs / state.timeLimitMs) * 100));
  const urgent = timeLeftMs <= 3000 && timeLeftMs > 0;
  const warning = timeLeftMs <= 5000 && timeLeftMs > 3000;
  const timerColor = urgent ? "#F85149" : warning ? "#D29922" : "#E6EDF3";

  const inputBorder =
    flash === "wrong"
      ? "border-[#f85149] animate-shake"
      : flash === "correct"
        ? "border-[#2ea043]"
        : "border-[#2d333b] focus:border-[#3b82f6]";

  const modeLabel = MODE_LABEL[state.mode] ?? state.mode;

  return (
    <div className="h-screen flex flex-col bg-[#0e1116] overflow-hidden">
      {/* ===== TOP BAR (48px) ===== */}
      <header className="h-12 shrink-0 border-b border-[#2d333b] bg-[#0e1116] flex items-center px-4 gap-3">
        <button
          onClick={() => {
            if (confirm("Abandonner le duel ?")) duel.quit();
          }}
          className="text-sm text-[#9ba4b0] hover:text-[#f85149] transition-colors flex items-center gap-1"
        >
          ← Abandonner
        </button>
        <div className="flex-1 text-center text-[13px] font-medium text-[#9ba4b0]">
          {modeLabel} · Compétitif · Premier à {targetScore}
        </div>
        <div className="flex items-center gap-3 text-[13px] text-[#9ba4b0]">
          <button
            onClick={() => setMuted((m) => !m)}
            className="hover:text-[#e6edf3] transition-colors"
            title="Muet (M)"
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <span className="font-mono text-[12px] flex items-center gap-1" title="Latence">
            📶 {latency}ms
          </span>
        </div>
      </header>

      {/* ===== MAIN (flex-grow) ===== */}
      <main className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {/* Panneaux joueurs — mobile : strip horizontal */}
        <div className="lg:hidden grid grid-cols-2 gap-2 p-3">
          <PlayerPanel
            name="Toi"
            elo={elo}
            score={state.playerScore}
            targetScore={targetScore}
            combo={state.playerCombo}
            avgTimeMs={stats.player.avgTimeMs}
            accuracy={stats.player.accuracy}
            side="left"
            isMe
            shake={flash === "wrong"}
          />
          <PlayerPanel
            name={opponentName}
            elo={1000}
            score={state.opponentScore}
            targetScore={targetScore}
            combo={state.opponentCombo}
            avgTimeMs={stats.opponent.avgTimeMs}
            accuracy={stats.opponent.accuracy}
            side="right"
            thinking={opponentThinking}
            shake={flash === "correct"}
          />
        </div>

        {/* Desktop : 3 colonnes (panneau | centre | panneau) */}
        <div className="hidden lg:grid lg:grid-cols-[280px_1fr_280px] gap-5 p-5 h-full">
          <PlayerPanel
            name="Toi"
            elo={elo}
            score={state.playerScore}
            targetScore={targetScore}
            combo={state.playerCombo}
            avgTimeMs={stats.player.avgTimeMs}
            accuracy={stats.player.accuracy}
            side="left"
            isMe
            shake={flash === "wrong"}
          />

          {/* Zone centrale */}
          <div className="flex flex-col items-center justify-center gap-4 min-h-0">
            {/* Timer */}
            <div
              className={cn("font-mono font-bold text-3xl leading-none", urgent && "animate-timer-urgent")}
              style={{ color: timerColor }}
            >
              {(timeLeftMs / 1000).toFixed(1)}s
            </div>

            {/* Métadonnées discrètes (pas en badges) */}
            <div className="text-[12px] font-medium uppercase tracking-wider text-[#6e7681] text-center">
              Question {state.questionIndex + 1} · {CATEGORY_LABEL[state.question.category]} · {DIFFICULTY_LABEL[state.question.difficulty]}
            </div>

            {/* Question */}
            <div className="rounded-xl border border-[#2d333b] bg-[#161b22] px-12 py-10 max-w-[640px] w-full text-center">
              <div className="font-mono font-bold text-5xl xl:text-6xl text-[#e6edf3]">
                {state.question.text.endsWith("?") ? (
                  state.question.text
                ) : (
                  <>
                    {state.question.text} = <span className="text-[#6e7681]">?</span>
                  </>
                )}
              </div>
            </div>

            {/* Input (auto-validation, pas de bouton) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="w-full max-w-[640px]"
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
                  "w-full text-center font-mono font-bold text-4xl xl:text-5xl bg-[#1c2128] border-2 rounded-[10px] px-5 py-4 outline-none transition-colors",
                  inputBorder,
                )}
              />
            </form>
            <div className="text-[11px] font-medium uppercase tracking-wider text-[#6e7681]">
              Validation automatique · ⌨ Entrée
            </div>
          </div>

          <PlayerPanel
            name={opponentName}
            elo={1000}
            score={state.opponentScore}
            targetScore={targetScore}
            combo={state.opponentCombo}
            avgTimeMs={stats.opponent.avgTimeMs}
            accuracy={stats.opponent.accuracy}
            side="right"
            thinking={opponentThinking}
            shake={flash === "correct"}
          />
        </div>

        {/* Mobile : zone centrale */}
        <div className="lg:hidden flex flex-col items-center gap-3 px-4 pt-2 pb-4">
          <div
            className={cn("font-mono font-bold text-2xl leading-none", urgent && "animate-timer-urgent")}
            style={{ color: timerColor }}
          >
            {(timeLeftMs / 1000).toFixed(1)}s
          </div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#6e7681] text-center">
            Question {state.questionIndex + 1} · {CATEGORY_LABEL[state.question.category]} · {DIFFICULTY_LABEL[state.question.difficulty]}
          </div>
          <div className="rounded-xl border border-[#2d333b] bg-[#161b22] px-6 py-6 w-full text-center">
            <div className="font-mono font-bold text-4xl text-[#e6edf3]">
              {state.question.text.endsWith("?") ? (
                state.question.text
              ) : (
                <>
                  {state.question.text} = <span className="text-[#6e7681]">?</span>
                </>
              )}
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="w-full"
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
                "w-full text-center font-mono font-bold text-3xl bg-[#1c2128] border-2 rounded-[10px] px-4 py-3 outline-none transition-colors",
                inputBorder,
              )}
            />
          </form>
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#6e7681]">
            ⌨ Entrée pour valider
          </div>
        </div>
      </main>

      {/* ===== BOTTOM BAR (log + stats) — desktop ===== */}
      <footer className="hidden lg:flex shrink-0 h-[180px] border-t border-[#2d333b] bg-[#161b22]">
        <div className="flex-1 flex flex-col min-w-0 p-4">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#6e7681] mb-2">
            📜 Journal de match
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin font-mono text-[13px] space-y-0.5 pr-2">
            {state.log.slice(-30).map((e) => (
              <div key={e.id} className="flex items-start gap-2">
                <span className="text-[#6e7681] shrink-0">{fmtTimestamp(e.ts, matchStartTs)}</span>
                <span className={cn("shrink-0", LOG_COLOR[e.kind])}>{LOG_ICON[e.kind]}</span>
                <span className={cn("truncate", e.side === "system" ? "text-[#6e7681] italic" : "text-[#e6edf3]")}>
                  {e.text}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-[280px] border-l border-[#2d333b] p-4 flex flex-col gap-2">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#6e7681] mb-1">
            Stats live
          </div>
          {[
            { l: "Vitesse moyenne", v: stats.player.avgTimeMs > 0 ? `${(stats.player.avgTimeMs / 1000).toFixed(1)}s` : "—", c: "text-[#e6edf3]" },
            { l: "Précision", v: stats.player.accuracy > 0 ? `${stats.player.accuracy}%` : "—", c: "text-[#e6edf3]" },
            { l: "Meilleur combo", v: `x${state.playerCombo}`, c: "text-[#e6edf3]" },
            { l: "Score", v: `${state.playerScore} - ${state.opponentScore}`, c: "text-[#3b82f6]" },
          ].map((s) => (
            <div key={s.l} className="flex items-center justify-between text-[13px]">
              <span className="text-[#9ba4b0]">{s.l}</span>
              <span className={cn("font-mono", s.c)}>{s.v}</span>
            </div>
          ))}
        </div>
      </footer>

      {/* Mobile : pavé numérique + log collapsible */}
      <div className="lg:hidden shrink-0 border-t border-[#2d333b] bg-[#161b22] p-3 space-y-2">
        <NumericKeypad
          onKey={(k) => setInput(input + k)}
          onBackspace={() => setInput(input.slice(0, -1))}
          onSubmit={submit}
        />
      </div>
    </div>
  );
}
