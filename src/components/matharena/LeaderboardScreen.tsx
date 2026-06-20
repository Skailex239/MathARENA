"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Trophy } from "lucide-react";

import { Btn, Panel, PageTitle, SectionLabel, RankBadge } from "@/components/matharena/ui";
import { api, type LeaderboardEntry } from "@/lib/api";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ============================================================
   LeaderboardScreen — Chess.com style, WARM palette
   Classement compétitif (Elo officiel, pur skill).
   Filtres : Global / Par mode / Amis.
   Top 3 surlignés beige doré, ligne utilisateur bordure orange.
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
        <div>
          <PageTitle className="!text-[#F5EFE6]">Classement</PageTitle>
          <p className="mt-1 text-sm" style={{ color: "#C9BFB0" }}>
            Les meilleurs calculateurs de MathArena
          </p>
        </div>
        <Btn
          className="!bg-[#FF8C42] !text-[#14110F] hover:!bg-[#E5732A] shrink-0"
          onClick={() => setView("classselect")}
        >
          Nouveau duel
        </Btn>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <div
          className="inline-flex items-center gap-0.5 p-0.5 rounded-md"
          style={{ background: "#1C1815", border: "1px solid #3A3328" }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                filter === f.value
                  ? "bg-[#FF8C42] text-[#14110F]"
                  : "text-[#C9BFB0] hover:text-[#F5EFE6] hover:bg-[#2E2820]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <SectionLabel className="!text-[#8B8270]">Compétitif · Elo officiel</SectionLabel>
      </div>

      {/* Body */}
      {loading ? (
        <LeaderboardSkeleton />
      ) : error ? (
        <Panel className="p-6 flex items-center gap-3 text-sm !bg-[#1C1815] !border-[#3A3328]">
          <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#C45A4A" }} />
          <span className="flex-1" style={{ color: "#C9BFB0" }}>
            {error}
          </span>
          <Btn
            size="sm"
            variant="secondary"
            className="!bg-transparent !border-[#4A4133] !text-[#F5EFE6] hover:!bg-[#2E2820]"
            onClick={() => void reload()}
          >
            Réessayer
          </Btn>
        </Panel>
      ) : filter === "friends" && visible.length === 0 ? (
        <Panel className="p-10 text-center !bg-[#1C1815] !border-[#3A3328]">
          <div className="text-sm" style={{ color: "#C9BFB0" }}>
            Tu n'as pas encore d'amis sur MathArena.
          </div>
          <div className="text-xs mt-1" style={{ color: "#8B8270" }}>
            La liste d'amis arrive dans une prochaine mise à jour.
          </div>
        </Panel>
      ) : (
        <Panel className="overflow-hidden !bg-[#1C1815] !border-[#3A3328]">
          <LeaderboardTable entries={visible} offsetRank={0} />
        </Panel>
      )}

      {/* Note */}
      <div className="mt-4 flex items-start gap-2 text-xs" style={{ color: "#8B8270" }}>
        <Trophy className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#FF8C42" }} />
        <span>
          {filter === "mode"
            ? "Classement agrégé — tous modes compétitifs confondus (Classé, Rapide, Blitz)."
            : filter === "friends"
              ? "Compare ton Elo avec tes amis. Liste d'amis bientôt disponible."
              : "Le classement compétitif prend en compte tous les modes sauf l'entraînement."}
        </span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Table
   ---------------------------------------------------------------- */

function LeaderboardTable({
  entries,
  offsetRank,
}: {
  entries: LeaderboardEntry[];
  offsetRank: number;
}) {
  const rows = useMemo(() => entries, [entries]);

  return (
    <div className="overflow-x-auto scrollbar-warm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left" style={{ borderColor: "#3A3328" }}>
            <Th className="w-12">#</Th>
            <Th>Joueur</Th>
            <Th className="w-32">Rang</Th>
            <Th className="w-20 text-right">Elo</Th>
            <Th className="w-20 text-right">Niveau</Th>
            <Th className="w-24 text-right">V-D</Th>
            <Th className="w-20 text-center">Tendance</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e, i) => {
            const rank = i + 1 + offsetRank;
            const isTop3 = rank <= 3;
            return (
              <tr
                key={e.id}
                className="border-b transition-colors"
                style={{
                  borderColor: "#2E2820",
                  background: e.isMe
                    ? "rgba(255,140,66,0.07)"
                    : isTop3
                      ? "rgba(245,222,179,0.06)"
                      : i % 2 === 1
                        ? "#1C181580"
                        : undefined,
                  boxShadow: e.isMe ? "inset 2px 0 0 #FF8C42" : undefined,
                }}
                onMouseEnter={(ev) => {
                  (ev.currentTarget as HTMLTableRowElement).style.background = e.isMe
                    ? "rgba(255,140,66,0.12)"
                    : "#2E282080";
                }}
                onMouseLeave={(ev) => {
                  (ev.currentTarget as HTMLTableRowElement).style.background = e.isMe
                    ? "rgba(255,140,66,0.07)"
                    : isTop3
                      ? "rgba(245,222,179,0.06)"
                      : i % 2 === 1
                        ? "#1C181580"
                        : "transparent";
                }}
              >
                <Td className="w-12">
                  <RankNumber rank={rank} />
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: "#F5EFE6" }}>
                      {e.name}
                    </span>
                    {e.isMe && <YouBadge />}
                    {e.isBot && <BotBadge />}
                  </div>
                </Td>
                <Td className="w-32">
                  <RankBadge elo={e.elo} />
                </Td>
                <Td className="w-20 text-right">
                  <span className="font-mono font-semibold" style={{ color: "#F5DEB3" }}>
                    {e.elo}
                  </span>
                </Td>
                <Td className="w-20 text-right">
                  <span className="font-mono" style={{ color: "#C9BFB0" }}>
                    {e.level}
                  </span>
                </Td>
                <Td className="w-24 text-right">
                  <span className="font-mono">
                    <span style={{ color: "#8FAF7E" }}>{e.wins}</span>
                    <span style={{ color: "#8B8270" }}>-</span>
                    <span style={{ color: "#C45A4A" }}>{e.losses}</span>
                  </span>
                </Td>
                <Td className="w-20 text-center">
                  <Trend winrate={e.winrate} />
                </Td>
              </tr>
            );
          })}
          {/* Pad to minimum 5 rows */}
          {rows.length < 5 &&
            Array.from({ length: 5 - rows.length }).map((_, i) => (
              <tr key={`pad-${i}`} className="border-b" style={{ borderColor: "#2E2820" }}>
                <Td className="w-12"><span style={{ color: "#5C5142" }}>—</span></Td>
                <Td><span style={{ color: "#5C5142" }}>—</span></Td>
                <Td className="w-32"><span style={{ color: "#5C5142" }}>—</span></Td>
                <Td className="w-20 text-right"><span style={{ color: "#5C5142" }}>—</span></Td>
                <Td className="w-20 text-right"><span style={{ color: "#5C5142" }}>—</span></Td>
                <Td className="w-24 text-right"><span style={{ color: "#5C5142" }}>—</span></Td>
                <Td className="w-20 text-center"><span style={{ color: "#5C5142" }}>—</span></Td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn("py-2 px-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap", className)}
      style={{ color: "#8B8270" }}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("py-2.5 px-3 whitespace-nowrap", className)}>{children}</td>
  );
}

function RankNumber({ rank }: { rank: number }) {
  let color = "#8B8270";
  if (rank === 1) color = "#F5DEB3";
  else if (rank === 2) color = "#C9BFB0";
  else if (rank === 3) color = "#D9A441";
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded font-mono text-xs font-semibold"
      style={{ color, background: rank <= 3 ? `${color}15` : "transparent" }}
    >
      {rank}
    </span>
  );
}

function YouBadge() {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: "#FF8C42", background: "#FF8C4212", border: "1px solid #FF8C4255" }}
    >
      Toi
    </span>
  );
}

function BotBadge() {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: "#C9BFB0", background: "#252019", border: "1px solid #3A3328" }}
    >
      Bot
    </span>
  );
}

function Trend({ winrate }: { winrate: number }) {
  let arrow = "—";
  let color = "#8B8270";
  if (winrate >= 55) {
    arrow = "▲";
    color = "#8FAF7E";
  } else if (winrate <= 45) {
    arrow = "▼";
    color = "#C45A4A";
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
    <div className="animate-pulse rounded-lg overflow-hidden" style={{ background: "#1C1815", border: "1px solid #3A3328" }}>
      <div className="h-10 border-b" style={{ borderColor: "#3A3328" }} />
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-11 border-b" style={{ borderColor: "#2E2820" }} />
      ))}
    </div>
  );
}
