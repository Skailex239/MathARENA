"use client";

import { useEffect, useRef } from "react";
import type { DuelLogEntry } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const KIND_STYLE: Record<DuelLogEntry["kind"], string> = {
  crit: "text-[#e6edf3] font-medium",
  hit: "text-[#9ba4b0]",
  miss: "text-[#f85149]",
  heal: "text-[#2ea043]",
  shield: "text-[#2ea043]",
  spell: "text-[#3b82f6]",
  ult: "text-[#e6edf3] font-medium",
  combo: "text-[#3b82f6]",
  info: "text-[#6e7681] italic",
};

export function DuelLog({ entries }: { entries: DuelLogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries]);

  const recent = entries.slice(-30);
  return (
    <div className="rounded-lg border border-[#2d333b] bg-[#161b22] p-3 h-full flex flex-col min-h-[120px]">
      <span className="text-xs font-medium uppercase tracking-wider text-[#6e7681] mb-2">
        Journal
      </span>
      <div ref={ref} className="scrollbar-thin flex-1 overflow-y-auto space-y-0.5 pr-1 text-xs font-mono min-h-0">
        {recent.map((e) => (
          <div
            key={e.id}
            className={cn(
              "leading-snug py-0.5",
              e.side === "system" && "italic",
              KIND_STYLE[e.kind],
            )}
          >
            {e.side === "system" ? "· " : e.side === "player" ? "› " : "‹ "}
            {e.text}
          </div>
        ))}
      </div>
    </div>
  );
}
