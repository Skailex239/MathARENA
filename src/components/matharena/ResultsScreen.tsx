"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { levelFromXp } from "@/lib/game/progression";
import { CLASSES } from "@/lib/game/classes";
import { divisionFor } from "@/lib/game/divisions";
import { Btn, Panel, RankBadge } from "./ui";
import { Skeleton } from "@/components/ui/skeleton";
import { Swords, User, Home, TrendingUp, TrendingDown, Zap, Target, Flame, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavedInfo {
  eloChange: number;
  xpGained: number;
  newElo: number;
  newLevel: number;
  leveledUp: boolean;
}

export function ResultsScreen() {
  const lastResult = useApp((s) => s.lastResult);
  const setView = useApp((s) => s.setView);
  const [saved, setSaved] = useState<SavedInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lastResult || saved) return;
    let cancelled = false;
    api
      .saveMatch({
        playerClass: lastResult.playerClass,
        opponentClass: lastResult.opponentClass,
        opponentName: lastResult.opponentName,
        result: lastResult.result,
        playerHP: lastResult.playerHP,
        opponentHP: lastResult.opponentHP,
        maxCombo: lastResult.maxCombo,
        avgTimeMs: lastResult.avgTimeMs,
        accuracy: lastResult.accuracy,
        mode: lastResult.mode,
      })
      .then(({ match, profile }) => {
        if (cancelled) return;
        const oldLevel = levelFromXp(profile.xp - match.xpGained);
        setSaved({
          eloChange: match.eloChange,
          xpGained: match.xpGained,
          newElo: profile.elo,
          newLevel: profile.level,
          leveledUp: profile.level > oldLevel,
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e?.message ?? e));
      });
    return () => {
      cancelled = true;
    };
  }, [lastResult, saved]);

  const saving = !!lastResult && !saved && !error;

  if (!lastResult) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-[#8b949e] mb-4">Aucun résultat à afficher.</p>
        <Btn onClick={() => setView("classselect")}>Lancer un duel</Btn>
      </div>
    );
  }

  const won = lastResult.result === "WIN";
  const playerDef = CLASSES[lastResult.playerClass];
  const oppDef = CLASSES[lastResult.opponentClass];
  const div = saved ? divisionFor(saved.newElo) : null;

  const stats = [
    { icon: <Flame className="w-4 h-4" />, label: "Meilleur combo", value: `x${lastResult.maxCombo || 0}`, accent: "#f59e0b" },
    { icon: <Zap className="w-4 h-4" />, label: "Temps moyen", value: lastResult.avgTimeMs > 0 ? `${(lastResult.avgTimeMs / 1000).toFixed(1)} s` : "—", accent: "#22c55e" },
    { icon: <Target className="w-4 h-4" />, label: "Précision", value: `${lastResult.accuracy}%`, accent: "#7c3aed" },
    { icon: <Heart className="w-4 h-4" />, label: "PV restants", value: `${lastResult.playerHP}`, accent: "#ef4444" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "rounded-xl border p-6 sm:p-8 text-center",
          won
            ? "border-[rgba(34,197,94,0.5)] bg-[rgba(34,197,94,0.06)] glow-success"
            : "border-[rgba(239,68,68,0.5)] bg-[rgba(239,68,68,0.06)] glow-danger",
        )}
      >
        <motion.div
          initial={{ scale: 0.5, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="text-6xl mb-2"
        >
          {won ? "🏆" : "💀"}
        </motion.div>
        <h1
          className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight"
          style={{ color: won ? "#22c55e" : "#ef4444" }}
        >
          {won ? "VICTOIRE" : "DÉFAITE"}
        </h1>
        <p className="text-[#8b949e] mt-2">
          {playerDef.emoji} {playerDef.name} vs {oppDef.emoji} {oppDef.name} ({lastResult.opponentName})
        </p>
      </motion.div>

      {/* Elo + XP */}
      <Panel className="mt-4 p-5">
        {saving ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-40 mx-auto bg-[#21262d]" />
            <Skeleton className="h-4 w-full bg-[#21262d]" />
          </div>
        ) : saved ? (
          <div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-sm text-[#8b949e]">Elo</span>
              <span className="font-mono font-bold text-3xl">{saved.newElo}</span>
              <span
                className={cn(
                  "flex items-center gap-1 text-lg font-bold px-2 py-0.5 rounded-lg font-mono",
                  saved.eloChange > 0
                    ? "text-[#22c55e] bg-[rgba(34,197,94,0.12)]"
                    : saved.eloChange < 0
                      ? "text-[#ef4444] bg-[rgba(239,68,68,0.12)]"
                      : "text-[#8b949e] bg-[#21262d]",
                )}
              >
                {saved.eloChange > 0 ? <TrendingUp className="w-4 h-4" /> : saved.eloChange < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                {saved.eloChange > 0 ? "+" : ""}{saved.eloChange}
              </span>
              {div && <RankBadge elo={saved.newElo} />}
            </div>
            {saved.eloChange === 0 && (
              <p className="text-center text-xs text-[#8b949e] mt-2">Elo non affecté (mode non classé)</p>
            )}
            <div className="flex items-center justify-center gap-4 mt-3 text-sm">
              <span className="text-[#f59e0b] font-semibold font-mono">+{saved.xpGained} XP</span>
              {saved.leveledUp && (
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.15, 1] }}
                  className="px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.15)] text-[#f59e0b] font-bold text-xs"
                >
                  ⬆ Niveau {saved.newLevel} !
                </motion.span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-[#8b949e]">
            {error ? `Sauvegarde impossible : ${error}` : "Chargement…"}
          </p>
        )}
      </Panel>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Panel key={s.label} className="p-4 text-center">
            <div className="flex items-center justify-center mb-1" style={{ color: s.accent }}>{s.icon}</div>
            <div className="font-mono font-bold text-2xl">{s.value}</div>
            <div className="text-[11px] text-[#8b949e]">{s.label}</div>
          </Panel>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        <Btn onClick={() => setView("classselect")}>
          <Swords className="w-4 h-4" /> Rejouer
        </Btn>
        <Btn variant="secondary" onClick={() => setView("profile")}>
          <User className="w-4 h-4" /> Profil
        </Btn>
        <Btn variant="secondary" onClick={() => setView("home")}>
          <Home className="w-4 h-4" /> Accueil
        </Btn>
      </div>
    </div>
  );
}
