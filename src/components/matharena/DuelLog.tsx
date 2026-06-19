"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DuelLogEntry } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const KIND_STYLE: Record<DuelLogEntry["kind"], string> = {
  crit: "text-[#ff3d8b] font-bold",
  hit: "text-foreground",
  miss: "text-[#f44747]",
  heal: "text-[#3ddc84]",
  shield: "text-[#3ddc84]",
  spell: "text-[#b15cff]",
  ult: "text-[#ffb02e] font-bold",
  combo: "text-[#ffb02e] font-semibold",
  info: "text-muted-foreground",
};

export function DuelLog({ entries }: { entries: DuelLogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries]);

  const recent = entries.slice(-40);
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-3 h-full flex flex-col">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Journal de combat
      </span>
      <div
        ref={ref}
        className="scrollbar-neon flex-1 overflow-y-auto space-y-1 pr-1 text-xs"
      >
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
