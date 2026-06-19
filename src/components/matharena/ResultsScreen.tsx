"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { levelFromXp } from "@/lib/game/progression";
import { CLASSES } from "@/lib/game/classes";
import { divisionFor } from "@/lib/game/divisions";
import { Button } from "@/components/ui/button";
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
  // État de sauvegarde dissocié de lastResult pour éviter qu'une mise à jour
  // de lastResult relance l'effect (et son cleanup qui annulerait setSaving).
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
        <p className="text-muted-foreground mb-4">Aucun résultat à afficher.</p>
        <Button onClick={() => setView("classselect")} className="bg-[#ff3d8b] hover:bg-[#ff3d8b]/85 text-white">
          Lancer un duel
        </Button>
      </div>
    );
  }

  const won = lastResult.result === "WIN";
  const playerDef = CLASSES[lastResult.playerClass];
  const oppDef = CLASSES[lastResult.opponentClass];
  const div = saved ? divisionFor(saved.newElo) : null;

  const stats = [
    { icon: <Flame className="w-4 h-4" />, label: "Meilleur combo", value: `x${lastResult.maxCombo || 0}`, accent: "text-[#ffb02e]" },
    { icon: <Zap className="w-4 h-4" />, label: "Temps moyen", value: lastResult.avgTimeMs > 0 ? `${(lastResult.avgTimeMs / 1000).toFixed(1)} s` : "—", accent: "text-[#3ddc84]" },
    { icon: <Target className="w-4 h-4" />, label: "Précision", value: `${lastResult.accuracy}%`, accent: "text-[#b15cff]" },
    { icon: <Heart className="w-4 h-4" />, label: "PV restants", value: `${lastResult.playerHP}`, accent: "text-[#f44747]" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "rounded-3xl border p-6 sm:p-8 text-center",
          won
            ? "border-[#3ddc84]/50 bg-gradient-to-b from-[#3ddc84]/10 to-transparent"
            : "border-[#f44747]/50 bg-gradient-to-b from-[#f44747]/10 to-transparent",
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
          className={cn(
            "text-4xl sm:text-5xl font-black",
            won ? "text-[#3ddc84] text-glow-emerald" : "text-[#f44747]",
          )}
        >
          {won ? "VICTOIRE" : "DÉFAITE"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {playerDef.emoji} {playerDef.name} vs {oppDef.emoji} {oppDef.name} ({lastResult.opponentName})
        </p>
      </motion.div>

      {/* Elo + XP */}
      <div className="mt-4 rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-5">
        {saving ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-40 mx-auto" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : saved ? (
          <div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground">Elo</span>
              <span className="text-3xl font-black font-mono">{saved.newElo}</span>
              <span
                className={cn(
                  "flex items-center gap-1 text-lg font-bold px-2 py-0.5 rounded-lg",
                  saved.eloChange > 0
                    ? "text-[#3ddc84] bg-[#3ddc84]/10"
                    : saved.eloChange < 0
                      ? "text-[#f44747] bg-[#f44747]/10"
                      : "text-muted-foreground bg-muted/40",
                )}
              >
                {saved.eloChange > 0 ? <TrendingUp className="w-4 h-4" /> : saved.eloChange < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                {saved.eloChange > 0 ? "+" : ""}{saved.eloChange}
              </span>
              {div && (
                <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: div.color, borderColor: `${div.color}66` }}>
                  {div.emoji} {div.name}
                </span>
              )}
            </div>
            {saved.eloChange === 0 && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                Elo non affecté (mode non classé)
              </p>
            )}
            <div className="flex items-center justify-center gap-4 mt-3 text-sm">
              <span className="text-[#ffb02e] font-semibold">+{saved.xpGained} XP</span>
              {saved.leveledUp && (
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.15, 1] }}
                  className="px-2 py-0.5 rounded-full bg-[#ffb02e]/15 text-[#ffb02e] font-bold text-xs"
                >
                  ⬆ Niveau {saved.newLevel} !
                </motion.span>
              )}
            </div>
            {error && (
              <p className="text-center text-xs text-[#f44747] mt-2">Sauvegarde impossible : {error}</p>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            {error ? `Sauvegarde impossible : ${error}` : "Chargement…"}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-4 text-center">
            <div className={cn("flex items-center justify-center mb-1", s.accent)}>{s.icon}</div>
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        <Button
          onClick={() => setView("classselect")}
          className="h-12 bg-[#ff3d8b] hover:bg-[#ff3d8b]/85 text-white font-bold"
        >
          <Swords className="w-4 h-4 mr-2" /> Rejouer
        </Button>
        <Button variant="outline" onClick={() => setView("profile")} className="h-12">
          <User className="w-4 h-4 mr-2" /> Profil
        </Button>
        <Button variant="outline" onClick={() => setView("home")} className="h-12">
          <Home className="w-4 h-4 mr-2" /> Accueil
        </Button>
      </div>
    </div>
  );
}
