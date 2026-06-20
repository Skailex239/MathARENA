"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { levelFromXp } from "@/lib/game/progression";
import { CLASSES } from "@/lib/game/classes";
import { divisionFor } from "@/lib/game/divisions";
import { Btn, Panel, RankBadge } from "./ui";
import { Swords, User, Home } from "lucide-react";
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
        universe: lastResult.universe,
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
          newElo: match.eloAfter,
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
        <p className="text-[#9ba4b0] mb-4">Aucun résultat à afficher.</p>
        <Btn onClick={() => setView("classselect")}>Lancer un duel</Btn>
      </div>
    );
  }

  const won = lastResult.result === "WIN";
  const isArena = lastResult.universe === "arena";
  const playerDef = lastResult.playerClass ? CLASSES[lastResult.playerClass] : null;
  const oppDef = lastResult.opponentClass ? CLASSES[lastResult.opponentClass] : null;

  // Compétitif : score ; Arène : PV
  const primaryStatLabel = isArena ? "PV restants" : "Score final";
  const primaryStatValue = isArena
    ? `${lastResult.playerHP}`
    : `${lastResult.playerHP} – ${lastResult.opponentHP}`;

  const stats = [
    { label: primaryStatLabel, value: primaryStatValue },
    { label: "Temps moyen", value: lastResult.avgTimeMs > 0 ? `${(lastResult.avgTimeMs / 1000).toFixed(1)}s` : "—" },
    { label: "Précision", value: `${lastResult.accuracy}%` },
    ...(isArena ? [{ label: "Meilleur combo", value: `x${lastResult.maxCombo || 0}` }] : []),
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Panel className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded", won ? "text-[#2ea043] bg-[rgba(46,160,67,0.1)]" : "text-[#f85149] bg-[rgba(248,81,73,0.1)]")}>
            {won ? "Victoire" : "Défaite"}
          </span>
          <span className="text-xs text-[#6e7681] font-mono">
            {isArena ? "ARÈNE" : "COMPÉTITIF"} · {lastResult.mode}
          </span>
        </div>
        <h1 className="text-xl font-semibold text-[#e6edf3]">
          {isArena && playerDef && oppDef
            ? `${playerDef.name} vs ${oppDef.name}`
            : "Duel compétitif"}
        </h1>
        <p className="text-sm text-[#9ba4b0] mt-0.5">vs {lastResult.opponentName}</p>
      </Panel>

      {/* Elo + XP */}
      <Panel className="mt-3 p-5">
        {saving ? (
          <div className="text-sm text-[#6e7681] text-center py-2">Sauvegarde…</div>
        ) : saved ? (
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-[#6e7681]">
                  Elo {isArena ? "arène" : "compétitif"}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-mono text-2xl font-medium text-[#e6edf3]">{saved.newElo}</span>
                  <span
                    className={cn(
                      "font-mono text-sm",
                      saved.eloChange > 0 ? "text-[#2ea043]" : saved.eloChange < 0 ? "text-[#f85149]" : "text-[#6e7681]",
                    )}
                  >
                    {saved.eloChange >= 0 ? "+" : ""}{saved.eloChange}
                  </span>
                </div>
              </div>
              <RankBadge elo={saved.newElo} />
            </div>
            <div className="mt-3 pt-3 border-t border-[#232a33] flex items-center justify-between text-sm">
              <span className="text-[#9ba4b0]">XP gagné</span>
              <span className="font-mono text-[#d29922]">+{saved.xpGained}</span>
            </div>
            {saved.leveledUp && (
              <div className="mt-1 text-xs text-[#3b82f6]">Niveau {saved.newLevel} atteint</div>
            )}
          </div>
        ) : (
          <div className="text-sm text-[#f85149] text-center py-2">
            {error ? `Sauvegarde impossible : ${error}` : "Chargement…"}
          </div>
        )}
      </Panel>

      {/* Stats table */}
      <Panel className="mt-3 overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {stats.map((s, i) => (
              <tr key={s.label} className={cn("border-b border-[#232a33] last:border-0", i % 2 === 1 && "bg-[#161b22]/40")}>
                <td className="py-2 px-4 text-[#9ba4b0]">{s.label}</td>
                <td className="py-2 px-4 text-right font-mono text-[#e6edf3]">{s.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {/* Actions */}
      <div className="mt-4 grid grid-cols-3 gap-2">
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
