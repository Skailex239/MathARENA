"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, Trophy } from "lucide-react";

import {
  Btn,
  DataTable,
  OrnamentDivider,
  PageTitle,
  Panel,
  Tabs,
} from "@/components/matharena/ui";
import { api, type LeaderboardEntry } from "@/lib/api";
import { useApp } from "@/lib/store";

/* ============================================================
   LeaderboardScreen — Chess.com style, LIGHT WARM cream
   3 classements séparés par mode (Classique / Rapide / Blitz).
   Top 3 surlignés peach tint, ligne utilisateur bordure orange.
   ============================================================ */

type Mode = "classique" | "rapide" | "blitz";

const MODE_FILTERS: { value: Mode; label: string }[] = [
  { value: "classique", label: "Classique" },
  { value: "rapide", label: "Rapide" },
  { value: "blitz", label: "Blitz" },
];

const MODE_DESC: Record<Mode, string> = {
  classique: "Premier à 10 points · 8s/question — la référence endurance.",
  rapide: "Premier à 5 points · 5s/question — rythme soutenu.",
  blitz: "2 minutes — le plus de bonnes réponses gagne.",
};

export default function LeaderboardScreen() {
  const setView = useApp((s) => s.setView);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("classique");

  const reload = useCallback(async (m: Mode) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLeaderboard(m);
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload(mode);
  }, [mode, reload]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div>
          <PageTitle>Classement</PageTitle>
          <p className="mt-1 text-sm text-[#6b5f4f]">
            Les meilleurs calculateurs de MathArena
          </p>
        </div>
        <Btn variant="primary" className="shrink-0" onClick={() => setView("classselect")}>
          Nouveau duel
        </Btn>
      </div>

      <OrnamentDivider />

      {/* Mode filters */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <Tabs
          options={MODE_FILTERS}
          value={mode}
          onChange={setMode}
          accent="orange"
        />
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9c8e7a]">
          Elo {MODE_FILTERS.find((f) => f.value === mode)?.label}
        </span>
      </div>

      {/* Body */}
      {loading ? (
        <LeaderboardSkeleton />
      ) : error ? (
        <Panel className="p-6 flex items-center gap-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#b5524a]" />
          <span className="flex-1 text-[#6b5f4f]">{error}</span>
          <Btn size="sm" variant="secondary" onClick={() => void reload(mode)}>
            Réessayer
          </Btn>
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <LeaderboardTable entries={entries} />
        </Panel>
      )}

      {/* Pagination texte */}
      {!loading && !error && entries.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-[#9c8e7a]">
          <button
            type="button"
            disabled
            className="px-2 py-1 rounded transition-colors hover:bg-[#efe8db] hover:text-[#6b5f4f] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#9c8e7a]"
          >
            ← Précédent
          </button>
          <span className="font-mono">Page 1 / 1</span>
          <button
            type="button"
            disabled
            className="px-2 py-1 rounded transition-colors hover:bg-[#efe8db] hover:text-[#6b5f4f] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#9c8e7a]"
          >
            Suivant →
          </button>
        </div>
      )}

      {/* Note */}
      <div className="mt-4 flex items-start gap-2 text-xs text-[#9c8e7a]">
        <Trophy className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#e8823d]" />
        <span>{MODE_DESC[mode]}</span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Table
   ---------------------------------------------------------------- */

type LBRow = Record<string, ReactNode>;

function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  const rows = useMemo<LBRow[]>(() => {
    const base: LBRow[] = entries.map((e, i) => ({
      rank: <RankNumber rank={i + 1} />,
      player: (
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#2a2520]">{e.name}</span>
          {e.isMe && <YouBadge />}
          {e.isBot && <BotBadge />}
        </div>
      ),
      level: <span className="font-mono text-[#6b5f4f]">{e.level}</span>,
      elo: <span className="font-mono font-semibold text-[#2a2520]">{e.elo}</span>,
      vd: (
        <span className="font-mono">
          <span className="text-[#7a9b6e]">{e.wins}</span>
          <span className="text-[#9c8e7a]">-</span>
          <span className="text-[#b5524a]">{e.losses}</span>
        </span>
      ),
      winrate: <WinratePill winrate={e.winrate} total={e.wins + e.losses} />,
    }));
    // Pad to minimum 5 rows.
    while (base.length < 5) {
      base.push({
        rank: <span className="text-[#c9bba0]">—</span>,
        player: <span className="text-[#c9bba0]">—</span>,
        level: <span className="text-[#c9bba0]">—</span>,
        elo: <span className="text-[#c9bba0]">—</span>,
        vd: <span className="text-[#c9bba0]">—</span>,
        winrate: <span className="text-[#c9bba0]">—</span>,
      });
    }
    return base;
  }, [entries]);

  const rowClassName = (_row: LBRow, i: number) => {
    // Top 3 : fond peach tint très subtil.
    if (i < 3) return "bg-[rgba(240,178,122,0.08)]";
    return undefined;
  };

  // isMe highlight : bordure gauche orange 2px + fond très léger (via DataTable.highlight).
  const highlight = (_row: LBRow, i: number) => {
    const e = entries[i];
    return Boolean(e?.isMe);
  };

  return (
    <DataTable
      columns={[
        { key: "rank", header: "#", className: "w-12" },
        { key: "player", header: "Joueur" },
        { key: "level", header: "Niveau", className: "w-24 text-right" },
        { key: "elo", header: "Elo", className: "w-24 text-right" },
        { key: "vd", header: "V-D", className: "w-24 text-right" },
        { key: "winrate", header: "Winrate", className: "w-28 text-right" },
      ]}
      rows={rows}
      rowKey={(_, i) => String(i)}
      highlight={highlight}
      rowClassName={rowClassName}
    />
  );
}

function RankNumber({ rank }: { rank: number }) {
  let color = "#9c8e7a";
  if (rank === 1) color = "#c9974a";
  else if (rank === 2) color = "#6b5f4f";
  else if (rank === 3) color = "#b5722e";
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded font-mono text-xs font-semibold"
      style={{ color, background: rank <= 3 ? `${color}12` : "transparent" }}
    >
      {rank}
    </span>
  );
}

function YouBadge() {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: "#e8823d", background: "#fce5d1", border: "1px solid #e8823d55" }}
    >
      Toi
    </span>
  );
}

function BotBadge() {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: "#9c8e7a", background: "#efe8db", border: "1px solid #ebe2d2" }}
    >
      Bot
    </span>
  );
}

function WinratePill({ winrate, total }: { winrate: number; total: number }) {
  if (total === 0) {
    return <span className="font-mono text-[#9c8e7a]">—</span>;
  }
  let color = "#9c8e7a";
  if (winrate >= 55) color = "#7a9b6e";
  else if (winrate <= 45) color = "#b5524a";
  return (
    <span className="font-mono" style={{ color }}>
      {winrate}%
    </span>
  );
}

/* ----------------------------------------------------------------
   Skeleton
   ---------------------------------------------------------------- */

function LeaderboardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-md overflow-hidden"
      style={{ background: "#faf6f0", border: "1px solid #ebe2d2" }}
    >
      <div className="h-10 border-b border-[#ebe2d2]" />
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-11 border-b border-[#ebe2d2]" />
      ))}
    </div>
  );
}
