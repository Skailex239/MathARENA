"use client";

import { SPELL_LIST } from "@/lib/game/spells";
import { CLASSES } from "@/lib/game/classes";
import type { ClassId, SpellId } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  classId: ClassId;
  combo: number;
  energy: number;
  locked: boolean;
  canSpell: (id: SpellId) => boolean;
  canUlt: () => boolean;
  canShield: () => boolean;
  onSpell: (id: SpellId) => boolean;
  onUlt: () => boolean;
  onShield: () => boolean;
}

export function SpellDock({
  classId,
  combo,
  energy,
  locked,
  canSpell,
  canUlt,
  canShield,
  onSpell,
  onUlt,
  onShield,
}: Props) {
  const def = CLASSES[classId];
  const comboUnlocked = combo >= 8;
  const ultUnlocked = combo >= 10;

  const handleSpell = (id: SpellId, cost: number) => {
    if (locked) return;
    if (!comboUnlocked) {
      toast("Sorts verrouillés", { description: "Atteins un combo de 8 pour débloquer les sorts." });
      return;
    }
    if (energy < cost) {
      toast("Énergie insuffisante", { description: `Il te faut ${cost} d'énergie.` });
      return;
    }
    const ok = onSpell(id);
    if (!ok) toast("Impossible de lancer ce sort maintenant.");
  };

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e]">
          Sorts & Compétences
        </span>
        <span className="text-[11px] text-[#8b949e] font-mono">
          Combo <span className="text-white">{combo}</span> · Énergie{" "}
          <span className="text-white">{energy}</span>
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {SPELL_LIST.map((s) => {
          const ok = !locked && canSpell(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSpell(s.id, s.cost)}
              disabled={!ok}
              title={`${s.name} — ${s.description} (coût ${s.cost})`}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-0.5 rounded-lg border p-2 transition-all min-h-[56px]",
                ok
                  ? "border-[rgba(124,58,237,0.6)] bg-[rgba(124,58,237,0.1)] hover:bg-[rgba(124,58,237,0.2)] hover:-translate-y-0.5 cursor-pointer"
                  : "border-[#30363d] bg-[#21262d] opacity-50 cursor-not-allowed",
              )}
            >
              <span className="text-xl leading-none">{s.emoji}</span>
              <span className="text-[10px] font-medium leading-none">{s.name}</span>
              <span className="text-[9px] text-[#00d4ff] leading-none font-mono">{s.cost}⚡</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          type="button"
          onClick={() => {
            if (!locked && canShield()) onShield();
            else if (!locked) toast("Bouclier indisponible", { description: "Il faut 40 d'énergie (max 30 de bouclier)." });
          }}
          disabled={locked || !canShield()}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all min-h-[44px]",
            !locked && canShield()
              ? "border-[rgba(34,197,94,0.6)] bg-[rgba(34,197,94,0.1)] hover:bg-[rgba(34,197,94,0.18)] cursor-pointer"
              : "border-[#30363d] bg-[#21262d] opacity-50 cursor-not-allowed",
          )}
        >
          🛡️ Bouclier <span className="text-[10px] text-[#00d4ff] font-mono">40⚡</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (!locked && canUlt()) onUlt();
            else if (!locked) toast("Ultime verrouillé", { description: "Atteins un combo de 10." });
          }}
          disabled={locked || !canUlt()}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-bold transition-all min-h-[44px]",
            !locked && canUlt()
              ? "border-[#ff0080] bg-[rgba(255,0,128,0.12)] hover:bg-[rgba(255,0,128,0.2)] cursor-pointer animate-pulse-blue"
              : "border-[#30363d] bg-[#21262d] opacity-50 cursor-not-allowed",
          )}
        >
          ⚡ {def.ultimate.name}
        </button>
      </div>
    </div>
  );
}
