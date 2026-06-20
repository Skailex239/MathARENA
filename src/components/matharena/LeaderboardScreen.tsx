"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, Trophy } from "lucide-react";

import {
  Btn,
  DataTable,
  OrnamentDivider,
  PageTitle,
  Panel,
  RankBadge,
  Tabs,
} from "@/components/matharena/ui";
import { api, type LeaderboardEntry } from "@/lib/api";
import { useApp } from "@/lib/store";

/* ============================================================
   LeaderboardScreen — Chess.com style, LIGHT WARM cream
   Classement compétitif (Elo officiel, pur skill).
   Filtres : Global / Par mode / Amis.
   Top 3 surlignés peach tint, ligne utilisateur bordure orange.
   ============================================================ */

type Filter = "global" | "mode" | "friends";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "global", label: "Global" },
  { value: "mode", label: "Par mode" },
  { value: "friends", label: "Amis" },
];

export default function LeaderboardScreen() {
  const setView = useApp((s) => s.setView);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("global");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLeaderboard("competitive");
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visible = useMemo<LeaderboardEntry[]>(() => {
    if (filter === "friends") {
      return entries.filter((e) => e.isMe);
    }
    return entries;
  }, [entries, filter]);

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

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <Tabs
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          accent="orange"
        />
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9c8e7a]">
          Compétitif · Elo officiel
        </span>
      </div>

      {/* Body */}
      {loading ? (
        <LeaderboardSkeleton />
      ) : error ? (
        <Panel className="p-6 flex items-center gap-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#b5524a]" />
          <span className="flex-1 text-[#6b5f4f]">{error}</span>
          <Btn size="sm" variant="secondary" onClick={() => void reload()}>
            Réessayer
          </Btn>
        </Panel>
      ) : filter === "friends" && visible.length === 0 ? (
        <Panel className="p-10 text-center">
          <div className="text-sm text-[#6b5f4f]">
            Tu n&apos;as pas encore d&apos;amis sur MathArena.
          </div>
          <div className="text-xs mt-1 text-[#9c8e7a]">
            La liste d&apos;amis arrive dans une prochaine mise à jour.
          </div>
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <LeaderboardTable entries={visible} />
        </Panel>
      )}

      {/* Pagination texte */}
      {!loading && !error && visible.length > 0 && (
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
        <span>
          {filter === "mode"
            ? "Classement agrégé — tous modes compétitifs confondus (Classé, Rapide, Blitz)."
            : filter === "friends"
              ? "Compare ton Elo avec tes amis. Liste d&apos;amis bientôt disponible."
              : "Le classement compétitif prend en compte tous les modes sauf l&apos;entraînement."}
        </span>
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
      division: <RankBadge elo={e.elo} />,
      elo: <span className="font-mono font-semibold text-[#2a2520]">{e.elo}</span>,
      level: <span className="font-mono text-[#6b5f4f]">{e.level}</span>,
      vd: (
        <span className="font-mono">
          <span className="text-[#7a9b6e]">{e.wins}</span>
          <span className="text-[#9c8e7a]">-</span>
          <span className="text-[#b5524a]">{e.losses}</span>
        </span>
      ),
      trend: <Trend winrate={e.winrate} />,
    }));
    // Pad to minimum 5 rows.
    while (base.length < 5) {
      base.push({
        rank: <span className="text-[#c9bba0]">—</span>,
        player: <span className="text-[#c9bba0]">—</span>,
        division: <span className="text-[#c9bba0]">—</span>,
        elo: <span className="text-[#c9bba0]">—</span>,
        level: <span className="text-[#c9bba0]">—</span>,
        vd: <span className="text-[#c9bba0]">—</span>,
        trend: <span className="text-[#c9bba0]">—</span>,
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
        { key: "division", header: "Rang", className: "w-32" },
        { key: "elo", header: "Elo", className: "w-20 text-right" },
        { key: "level", header: "Niveau", className: "w-20 text-right" },
        { key: "vd", header: "V-D", className: "w-24 text-right" },
        { key: "trend", header: "Tendance", className: "w-20 text-center" },
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

function Trend({ winrate }: { winrate: number }) {
  let arrow = "—";
  let color = "#9c8e7a";
  if (winrate >= 55) {
    arrow = "▲";
    color = "#7a9b6e";
  } else if (winrate <= 45) {
    arrow = "▼";
    color = "#b5524a";
  }
  return (
    <span className="font-mono text-sm" style={{ color }}>
      {arrow}
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
