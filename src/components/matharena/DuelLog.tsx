"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DuelLogEntry } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const KIND_STYLE: Record<DuelLogEntry["kind"], string> = {
  crit: "text-[#ff0080] font-bold",
  hit: "text-white",
  miss: "text-[#ef4444]",
  heal: "text-[#22c55e]",
  shield: "text-[#22c55e]",
  spell: "text-[#7c3aed]",
  ult: "text-[#f59e0b] font-bold",
  combo: "text-[#00d4ff] font-semibold",
  info: "text-[#8b949e]",
};

export function DuelLog({ entries }: { entries: DuelLogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries]);

  const recent = entries.slice(-40);
  return (
    <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-3 h-full flex flex-col">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] mb-2">
        Journal de combat
      </span>
      <div ref={ref} className="scrollbar-neo flex-1 overflow-y-auto space-y-1 pr-1 text-xs min-h-[80px]">
        <AnimatePresence initial={false}>
          {recent.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: e.side === "player" ? -8 : 8 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "leading-snug",
                e.side === "player" && "text-left",
                e.side === "opponent" && "text-right",
                e.side === "system" && "text-center italic",
                KIND_STYLE[e.kind],
              )}
            >
              {e.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
