"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompetitiveDuel } from "@/hooks/useCompetitiveDuel";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { CATEGORY_LABEL, DIFFICULTY_LABEL } from "@/lib/game/math";
import { divisionFor } from "@/lib/game/divisions";
import { sound } from "@/lib/sound";
import type { CompLogEntry } from "@/lib/game/competitive-engine";
import type { MatchResultPayload } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

const MODE_LABEL: Record<string, string> = {
  PRACTICE: "Entraînement",
  QUICK: "Rapide",
  BLITZ: "Blitz",
  RANKED: "Classique",
};

const LOG_ICON: Record<CompLogEntry["kind"], string> = {
  point: "✅",
  miss: "❌",
  timeout: "⏱",
  combo: "🔥",
  info: "⚡",
};
const LOG_COLOR: Record<CompLogEntry["kind"], string> = {
  point: "text-[#2a2520]",
  miss: "text-[#b5524a]",
  timeout: "text-[#b5524a]",
  combo: "text-[#c9974a]",
  info: "text-[#7a7164]",
};

function fmtTimestamp(ts: number, start: number): string {
  const sec = Math.max(0, Math.floor((ts - start) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function CompetitiveDuelScreen() {
  const selectedMode = useApp((s) => s.selectedMode);
  const opponentName = useApp((s) => s.opponentName);
  const setView = useApp((s) => s.setView);
  const setLastResult = useApp((s) => s.setLastResult);

  const [elo, setElo] = useState(1000);
  const [muted, setMuted] = useState(true);
  const [showJournal, setShowJournal] = useState(false);
  const [showOpponent, setShowOpponent] = useState(false);
  const [savedInfo, setSavedInfo] = useState<MatchResultPayload["saved"] | null>(null);
  const [saving, setSaving] = useState(false);
  const [showEndStats, setShowEndStats] = useState(false);

  useEffect(() => {
    sound.setMuted(true);
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => setElo(p?.eloCompetitive ?? p?.elo ?? 1000))
      .catch(() => {});
  }, []);

  const duel = useCompetitiveDuel({
    mode: selectedMode,
    opponentName,
    onSave: (payload) => {
      setLastResult(payload);
      setSaving(true);
      api
        .saveMatch({
          universe: "competitive",
          opponentName: payload.opponentName,
          result: payload.result,
          playerScore: payload.playerScore,
          opponentScore: payload.opponentScore,
          avgTimeMs: payload.avgTimeMs,
          accuracy: payload.accuracy,
          mode: payload.mode,
        })
        .then(({ match }) => {
          setSavedInfo({
            eloChange: match.eloChange,
            xpGained: match.xpGained,
            newElo: match.eloAfter,
            newLevel: 1,
            leveledUp: false,
          });
        })
        .catch(() => {})
        .finally(() => setSaving(false));
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
    matchDurationMs,
    matchTimeLeftMs,
    isBlitz,
    isGameOver,
    winner,
  } = duel;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.phase === "question" && !isGameOver) inputRef.current?.focus();
  }, [state.phase, state.questionIndex, isGameOver]);

  // Show end stats after a delay when game over
  useEffect(() => {
    if (isGameOver) {
      const t = setTimeout(() => setShowEndStats(true), 1800);
      return () => clearTimeout(t);
    }
  }, [isGameOver]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showJournal) { setShowJournal(false); return; }
        if (showEndStats) return;
        if (confirm("Abandonner le duel ?")) duel.quit();
      }
      if ((e.key === "j" || e.key === "J") && !isGameOver) {
        e.preventDefault();
        setShowJournal((s) => !s);
      }
      if (e.key === "m" || e.key === "M") {
        const next = !muted;
        setMuted(next);
        sound.setMuted(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [duel, muted, showJournal, showEndStats, isGameOver]);

  if (!state.question && !isGameOver) {
    return (
      <div className="h-screen grid place-items-center bg-[#f5efe6] text-[#6b5f4f] text-sm">
        Chargement…
      </div>
    );
  }

  const timePct = Math.max(0, Math.min(100, (timeLeftMs / state.timeLimitMs) * 100));
  const urgent = timeLeftMs <= 3000 && timeLeftMs > 0 && !isGameOver;
  const warning = timeLeftMs <= 5000 && timeLeftMs > 3000 && !isGameOver;
  const timerColor = isGameOver ? "#7a7164" : urgent ? "#b5524a" : warning ? "#c9974a" : "#e8823d";

  const inputBorderClass = flash === "wrong"
    ? "border-[#b5524a] animate-shake"
    : flash === "correct"
      ? "border-[#7a9b6e]"
      : flash === "critical"
        ? "border-[#f0b27a]"
        : "border-[#dcd0bc] focus:border-[#e8823d]";

  const modeLabel = MODE_LABEL[state.mode] ?? state.mode;
  const q = state.question;
  const div = divisionFor(elo);

  return (
    <div className="h-screen flex flex-col bg-[#f5efe6] overflow-hidden relative">
      {/* ===== DISCRETE ICONS (no top bar) ===== */}
      <button
        onClick={() => { if (confirm("Abandonner le duel ?")) duel.quit(); }}
        className="absolute top-3 left-3 z-30 text-[#7a7164] hover:text-[#2a2520] opacity-40 hover:opacity-100 transition-opacity text-lg"
        title="Abandonner (Échap)"
      >
        ✕
      </button>
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
        <button
          onClick={() => {
            const next = !muted;
            setMuted(next);
            sound.setMuted(next);
          }}
          className="text-[#7a7164] hover:text-[#2a2520] transition-colors text-base"
          title="Muet (M)"
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <button
          onClick={() => !isGameOver && setShowJournal(true)}
          className="text-[#7a7164] hover:text-[#2a2520] transition-colors text-base"
          title="Journal (J)"
        >
          📜
        </button>
      </div>

      {/* ===== MAIN FOCUS ZONE ===== */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 min-h-0 gap-5">
        {/* Blitz match countdown */}
        {isBlitz && !isGameOver && (
          <div className="flex items-center gap-2 text-sm text-[#9c8e7a]">
            <Clock size={16} weight="regular" />
            <span className="font-mono font-bold text-[#e8823d]">
              {fmtDuration(matchTimeLeftMs)}
            </span>
            <span className="text-xs">restant</span>
          </div>
        )}
        {/* Timer */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={cn("font-mono font-bold text-5xl sm:text-6xl leading-none transition-colors", urgent && "animate-timer-pulse")}
            style={{ color: timerColor }}
          >
            {isGameOver ? "—" : `${(timeLeftMs / 1000).toFixed(1)}`}
          </div>
          <div className="w-48 sm:w-64 h-1 rounded-full bg-[#efe8db] overflow-hidden">
            <div
              className="h-full transition-[width] duration-100 ease-linear rounded-full"
              style={{ width: `${isGameOver ? 0 : timePct}%`, background: timerColor }}
            />
          </div>
        </div>

        {/* Metadata (discreet, no badges) */}
        <div className="text-xs font-medium uppercase tracking-wider text-[#7a7164] text-center">
          {q && (
            <>
              Question {state.questionIndex + 1} · {CATEGORY_LABEL[q.category]} · {DIFFICULTY_LABEL[q.difficulty]}
            </>
          )}
          {isGameOver && <>{modeLabel} · Compétitif</>}
        </div>

        {/* Question box (hero) */}
        <AnimatePresence mode="wait">
          {q && !isGameOver && (
            <motion.div
              key={state.questionIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
              className={cn(
                "rounded-2xl border border-[rgba(232,130,61,0.2)] bg-gradient-to-b from-[#faf6f0] to-[#efe8db] px-8 py-10 sm:px-14 sm:py-12 max-w-[680px] w-full text-center warm-glow",
                flash === "correct" && "animate-glow-pulse",
              )}
            >
              <div className="font-mono font-bold text-4xl sm:text-6xl xl:text-7xl text-[#2a2520]">
                {q.text.endsWith("?") ? (
                  q.text
                ) : (
                  <>
                    {q.text} = <span className="text-[#7a7164]">?</span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Critical flash text */}
        <AnimatePresence>
          {flash === "critical" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-bold uppercase tracking-widest text-[#f0b27a]"
            >
              Rapide !
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input (auto-validation + Enter + button) */}
        {q && !isGameOver && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
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
              className="shrink-0 px-4 py-4 rounded-xl text-sm font-medium text-[#6b5f4f] border border-[#dcd0bc] hover:text-[#2a2520] hover:border-[#e8823d] hover:bg-[#e8dfcd] transition-colors"
            >
              Valider
            </button>
          </form>
        )}
        {q && !isGameOver && (
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#7a7164]">
            Validation auto · ⌨ Entrée · Valider
          </div>
        )}
      </main>

      {/* ===== PLAYER PANELS (bottom) ===== */}
      {!isGameOver && (
        <div className="shrink-0 px-4 pb-4">
          <div className="mx-auto max-w-[680px] grid grid-cols-2 gap-3">
            {/* Player panel (left) */}
            <div className="rounded-[10px] border border-[#dcd0bc] bg-[#faf6f0] p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="grid place-items-center w-8 h-8 rounded-full bg-[#efe8db] border border-[#dcd0bc] text-sm font-semibold text-[#2a2520] shrink-0">
                  J
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#2a2520] truncate">Toi</div>
                  <div className="text-[13px] text-[#7a7164]">
                    <span style={{ color: div.color }}>{div.name}</span> · <span className="font-mono">{elo}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#7a7164] mb-1">
                <span>Score</span>
                <span className="font-mono text-[#2a2520]">{state.playerScore}{!isBlitz && `/${targetScore}`}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#efe8db] overflow-hidden">
                <div
                  className="h-full bg-[#e8823d] rounded-full transition-[width] duration-400 ease-out"
                  style={{ width: `${isBlitz ? Math.min(100, (state.playerScore / Math.max(1, state.playerScore + state.opponentScore)) * 100) : (state.playerScore / targetScore) * 100}%` }}
                />
              </div>
            </div>

            {/* Opponent panel (right) — HIDDEN by default */}
            <div className="rounded-[10px] border border-[#dcd0bc] bg-[#faf6f0] p-4 relative">
              {showOpponent ? (
                <>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="grid place-items-center w-8 h-8 rounded-full bg-[#efe8db] border border-[#dcd0bc] text-sm font-semibold text-[#2a2520] shrink-0">
                      {opponentName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#2a2520] truncate">{opponentName}</div>
                      <div className="text-[13px] text-[#7a7164]">Adversaire · <span className="font-mono">1000</span></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#7a7164] mb-1">
                    <span>Score</span>
                    <span className="font-mono text-[#2a2520]">{state.opponentScore}{!isBlitz && `/${targetScore}`}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#efe8db] overflow-hidden">
                    <div
                      className="h-full bg-[#9c8e7a] rounded-full transition-[width] duration-400 ease-out"
                      style={{ width: `${isBlitz ? Math.min(100, (state.opponentScore / Math.max(1, state.playerScore + state.opponentScore)) * 100) : (state.opponentScore / targetScore) * 100}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="grid place-items-center w-8 h-8 rounded-full bg-[#efe8db] border border-[#dcd0bc] text-sm font-semibold text-[#7a7164] shrink-0">
                      ?
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#6b5f4f] truncate">Adversaire</div>
                      <div className="text-[13px] text-[#7a7164]">Caché</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#7a7164] mb-1">
                    <span>Score</span>
                    <span className="font-mono text-[#6b5f4f]">{state.opponentScore}{!isBlitz && `/${targetScore}`}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#efe8db] overflow-hidden">
                    <div
                      className="h-full bg-[#9c8e7a] rounded-full transition-[width] duration-400 ease-out"
                      style={{ width: `${isBlitz ? Math.min(100, (state.opponentScore / Math.max(1, state.playerScore + state.opponentScore)) * 100) : (state.opponentScore / targetScore) * 100}%` }}
                    />
                  </div>
                  {opponentThinking && (
                    <div className="absolute top-2 right-2 flex gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#e8823d] animate-dot" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#e8823d] animate-dot" style={{ animationDelay: "200ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#e8823d] animate-dot" style={{ animationDelay: "400ms" }} />
                    </div>
                  )}
                </>
              )}
              <button
                onClick={() => setShowOpponent((s) => !s)}
                className="absolute bottom-2 right-2 text-[10px] uppercase tracking-wider text-[#7a7164] hover:text-[#e8823d] transition-colors"
              >
                {showOpponent ? "👁 Masquer" : "👁 Voir"}
              </button>
            </div>
          </div>

          {/* Mobile numeric keypad */}
          <div className="lg:hidden mt-3 mx-auto max-w-[680px] grid grid-cols-3 gap-1.5">
            {["1","2","3","4","5","6","7","8","9"].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setInput(input + k)}
                className="h-14 rounded-md bg-[#efe8db] border border-[#dcd0bc] text-xl font-mono font-medium text-[#2a2520] active:bg-[#e8823d] active:text-[#2a2520] transition-colors"
              >
                {k}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setInput(input.slice(0, -1))}
              className="h-14 rounded-md bg-[#efe8db] border border-[#dcd0bc] text-xl text-[#6b5f4f] active:bg-[#e8dfcd] transition-colors"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setInput(input + "0")}
              className="h-14 rounded-md bg-[#efe8db] border border-[#dcd0bc] text-xl font-mono font-medium text-[#2a2520] active:bg-[#e8823d] active:text-[#2a2520] transition-colors"
            >
              0
            </button>
            <button
              type="button"
              onClick={submit}
              className="h-14 rounded-md bg-[#e8823d] border border-[#e8823d] text-xl text-[#2a2520] font-semibold active:bg-[#d26f2a] transition-colors"
            >
              ✓
            </button>
          </div>
        </div>
      )}

      {/* ===== JOURNAL MODAL ===== */}
      <AnimatePresence>
        {showJournal && !isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-12 right-3 z-40 w-80 max-w-[calc(100vw-1.5rem)]"
          >
            <div className="rounded-xl border border-[#dcd0bc] bg-[#faf6f0] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#dcd0bc]">
                <span className="text-xs font-medium uppercase tracking-wider text-[#6b5f4f]">📜 Journal</span>
                <button onClick={() => setShowJournal(false)} className="text-[#7a7164] hover:text-[#2a2520] text-sm">✕</button>
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-warm p-3 font-mono text-[13px] space-y-1">
                {state.log.slice(-30).map((e) => (
                  <div key={e.id} className="flex items-start gap-2">
                    <span className="text-[#7a7164] shrink-0">{fmtTimestamp(e.ts, matchStartTs)}</span>
                    <span className={cn("shrink-0", LOG_COLOR[e.kind])}>{LOG_ICON[e.kind]}</span>
                    <span className={cn("min-w-0", e.side === "system" ? "text-[#7a7164] italic" : "text-[#2a2520]")}>
                      {e.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== END OF MATCH OVERLAY ===== */}
      <AnimatePresence>
        {isGameOver && !showEndStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 grid place-items-center bg-[rgba(42,37,32,0.3)]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
              className="text-center"
            >
              <div
                className="font-display font-extrabold text-5xl sm:text-7xl"
                style={{ color: winner === "player" ? "#e8823d" : "#6b5f4f" }}
              >
                {winner === "player" ? "VICTOIRE" : "DÉFAITE"}
              </div>
              <div className="mt-2 text-lg font-mono text-[#6b5f4f]">
                {state.playerScore} — {state.opponentScore}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== END STATS MODAL ===== */}
      <AnimatePresence>
        {isGameOver && showEndStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 grid place-items-center bg-[rgba(42,37,32,0.4)] p-4"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
              className="w-full max-w-md rounded-2xl border border-[#dcd0bc] bg-[#faf6f0] p-6"
            >
              <div className="text-center mb-5">
                <div
                  className="font-display font-extrabold text-3xl"
                  style={{ color: winner === "player" ? "#e8823d" : "#6b5f4f" }}
                >
                  {winner === "player" ? "VICTOIRE" : "DÉFAITE"}
                </div>
                <div className="mt-1 text-sm text-[#7a7164]">{modeLabel} · Compétitif</div>
              </div>

              {/* Stats grid */}
              <div className="space-y-2.5 mb-5">
                <div className="flex items-center justify-between py-2 border-b border-[#ebe2d2]">
                  <span className="text-sm text-[#6b5f4f]">Score final</span>
                  <span className="font-mono text-lg text-[#2a2520]">{state.playerScore} — {state.opponentScore}</span>
                </div>
                {savedInfo ? (
                  <div className="flex items-center justify-between py-2 border-b border-[#ebe2d2]">
                    <span className="text-sm text-[#6b5f4f]">Elo</span>
                    <span className="font-mono text-sm">
                      <span className={savedInfo.eloChange >= 0 ? "text-[#7a9b6e]" : "text-[#b5524a]"}>
                        {savedInfo.eloChange >= 0 ? "+" : ""}{savedInfo.eloChange}
                      </span>
                      <span className="text-[#7a7164] mx-1">→</span>
                      <span className="text-[#2a2520]">{savedInfo.newElo}</span>
                    </span>
                  </div>
                ) : saving ? (
                  <div className="py-2 text-center text-xs text-[#7a7164] border-b border-[#ebe2d2]">Sauvegarde…</div>
                ) : null}
                <div className="flex items-center justify-between py-2 border-b border-[#ebe2d2]">
                  <span className="text-sm text-[#6b5f4f]">Vitesse moyenne</span>
                  <span className="font-mono text-[#2a2520]">{stats.player.avgTimeMs > 0 ? `${(stats.player.avgTimeMs / 1000).toFixed(1)}s` : "—"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#ebe2d2]">
                  <span className="text-sm text-[#6b5f4f]">Précision</span>
                  <span className="font-mono text-[#2a2520]">{stats.player.accuracy > 0 ? `${stats.player.accuracy}% (${stats.player.correct}/${stats.player.answered})` : "—"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#ebe2d2]">
                  <span className="text-sm text-[#6b5f4f]">Questions tentées</span>
                  <span className="font-mono text-[#2a2520]">{stats.player.answered}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[#6b5f4f]">Durée</span>
                  <span className="font-mono text-[#2a2520]">{fmtDuration(matchDurationMs)}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => setView("classselect")}
                  className="w-full py-2.5 rounded-lg bg-[#e8823d] hover:bg-[#d26f2a] text-[#2a2520] font-semibold text-sm transition-colors"
                >
                  Rejouer
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setView("profile")}
                    className="py-2 rounded-lg border border-[#dcd0bc] text-[#6b5f4f] hover:text-[#2a2520] hover:border-[#c9bba0] text-sm transition-colors"
                  >
                    📊 Analyse
                  </button>
                  <button
                    onClick={() => setView("home")}
                    className="py-2 rounded-lg border border-[#dcd0bc] text-[#6b5f4f] hover:text-[#2a2520] hover:border-[#c9bba0] text-sm transition-colors"
                  >
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
