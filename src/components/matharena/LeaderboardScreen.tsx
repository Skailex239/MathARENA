"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Btn, Panel, PageTitle, SectionLabel, RankBadge, Tabs, DataTable } from "@/components/matharena/ui";
import { api, type LeaderboardEntry } from "@/lib/api";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ============================================================
   LeaderboardScreen — dense Chess.com style table
   ============================================================ */

type Filter = "all" | "top" | "rising";

export default function LeaderboardScreen() {
  const setView = useApp((s) => s.setView);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLeaderboard();
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

  const filtered = useMemo(() => {
    if (filter === "top") return entries.slice(0, 10);
    if (filter === "rising") {
      // "rising" = ceux avec le meilleur winrate mais elo < 1300 (sous Or)
      return entries
        .filter((e) => e.elo < 1300)
        .sort((a, b) => b.winrate - a.winrate)
        .slice(0, 25);
    }
    return entries;
  }, [entries, filter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <PageTitle>Classement</PageTitle>
          <p className="mt-1 text-sm text-[#9ba4b0]">
            {loading ? "Chargement…" : `${entries.length} joueurs · top mondiaux`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "Tous" },
              { value: "top", label: "Top 10" },
              { value: "rising", label: "En progression" },
            ]}
          />
          <Btn size="sm" variant="secondary" onClick={() => setView("classselect")}>
            Nouveau duel
          </Btn>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <LeaderboardSkeleton />
      ) : error ? (
        <Panel className="p-6 flex items-center gap-3 text-sm text-[#9ba4b0]">
          <AlertCircle className="w-4 h-4 text-[#f85149] shrink-0" />
          <span className="flex-1">{error}</span>
          <Btn size="sm" variant="secondary" onClick={() => void reload()}>
            Réessayer
          </Btn>
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel className="p-10 text-center text-sm text-[#9ba4b0]">
          Aucun joueur dans cette tranche.
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <LeaderboardTable entries={filtered} />
        </Panel>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs text-[#6e7681]">
        <SectionLabel>Note</SectionLabel>
        <span>Le classement est mis à jour après chaque partie classée.</span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Table
   ---------------------------------------------------------------- */

function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  const rows = useMemo(
    () =>
      entries.map((e, i) => ({
        rank: <RankCell rank={i + 1} isMe={e.isMe} />,
        player: (
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#e6edf3]">{e.name}</span>
            {e.isMe && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide text-[#3b82f6] border border-[#3b82f6]/40 bg-[#3b82f6]/10">
                Toi
              </span>
            )}
            {e.isBot && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide text-[#6e7681] border border-[#2d333b]">
                Bot
              </span>
            )}
          </div>
        ),
        division: <RankBadge elo={e.elo} />,
        elo: <span className="font-mono text-[#e6edf3]">{e.elo}</span>,
        level: <span className="font-mono text-[#9ba4b0]">{e.level}</span>,
        games: <span className="font-mono text-[#9ba4b0]">{e.wins + e.losses}</span>,
        wins: <span className="font-mono text-[#2ea043]">{e.wins}</span>,
        losses: <span className="font-mono text-[#f85149]">{e.losses}</span>,
        winrate: (
          <span className="font-mono text-[#9ba4b0]">{e.winrate}%</span>
        ),
        _isMe: e.isMe,
      })),
    [entries],
  );

  return (
    <DataTable
      columns={[
        { key: "rank", header: "#", className: "w-12" },
        { key: "player", header: "Joueur" },
        { key: "division", header: "Division" },
        { key: "elo", header: "Elo" },
        { key: "level", header: "Niveau" },
        { key: "games", header: "Parties" },
        { key: "wins", header: "V" },
        { key: "losses", header: "D" },
        { key: "winrate", header: "Winrate" },
      ]}
      rows={rows}
      rowKey={(_, i) => String(i)}
      highlight={(r) => (r as { _isMe: boolean })._isMe}
    />
  );
}

function RankCell({ rank, isMe }: { rank: number; isMe: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-6 h-6 rounded font-mono text-xs",
        isMe ? "bg-[#3b82f6]/15 text-[#3b82f6]" : "text-[#9ba4b0]",
        rank === 1 ? "text-[#d29922]" : "",
        rank === 2 ? "text-[#c0c0c0]" : "",
        rank === 3 ? "text-[#cd7f32]" : "",
      )}
    >
      {rank}
    </span>
  );
}

/* ----------------------------------------------------------------
   Skeleton
   ---------------------------------------------------------------- */

function LeaderboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-[#161b22] border border-[#2d333b] rounded-lg mb-1" />
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-10 bg-[#161b22]/40 border-b border-[#232a33]" />
      ))}
    </div>
  );
}
