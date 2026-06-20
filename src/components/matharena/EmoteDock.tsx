"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const EMOTES = [
  { e: "GG", label: "GG" },
  { e: "👏", label: "Bien joué" },
  { e: "🔥", label: "Feu" },
  { e: "😱", label: "Choqué" },
  { e: "💀", label: "Mort" },
];

export function EmoteDock() {
  const [used, setUsed] = useState<Record<string, number>>({});
  const [last, setLast] = useState<string | null>(null);

  const send = (e: string, label: string) => {
    const count = used[e] ?? 0;
    if (count >= 3) {
      toast("Emote limitée", { description: "Trop de spam, patiente un peu." });
      return;
    }
    setUsed({ ...used, [e]: count + 1 });
    setLast(e);
    toast(`${label}`, { description: "Emote envoyée à l'adversaire" });
    setTimeout(() => setLast(null), 1200);
  };

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e]">Emotes</span>
        {last && <span className="text-lg animate-float-up">{last}</span>}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {EMOTES.map((em) => {
          const count = used[em.e] ?? 0;
          const disabled = count >= 3;
          return (
            <button
              key={em.e}
              type="button"
              onClick={() => send(em.e, em.label)}
              disabled={disabled}
              title={em.label}
              className={cn(
                "flex items-center justify-center rounded-lg border min-h-[44px] transition-all font-bold",
                disabled
                  ? "border-[#30363d] bg-[#21262d] opacity-40 cursor-not-allowed"
                  : "border-[#30363d] bg-[#21262d] hover:border-[rgba(0,212,255,0.5)] hover:bg-[rgba(0,212,255,0.08)] cursor-pointer hover:-translate-y-0.5",
              )}
            >
              {em.e}
            </button>
          );
        })}
      </div>
    </div>
  );
}
