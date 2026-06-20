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
      toast("Sorts verrouillés", { description: "Combo ≥ 8 requis." });
      return;
    }
    if (energy < cost) {
      toast("Énergie insuffisante", { description: `${cost} requis.` });
      return;
    }
    onSpell(id);
  };

  return (
    <div className="rounded-lg border border-[#2d333b] bg-[#161b22] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-[#6e7681]">Sorts</span>
        <span className="text-[11px] font-mono text-[#9ba4b0]">
          Combo {combo} · Énergie {energy}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {SPELL_LIST.map((s) => {
          const ok = !locked && canSpell(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSpell(s.id, s.cost)}
              disabled={!ok}
              title={`${s.name} — ${s.description} (${s.cost} énergie)`}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded border py-1.5 px-1 transition-colors min-h-[44px]",
                ok
                  ? "border-[#2d333b] bg-[#1c2128] hover:border-[#3b82f6] hover:bg-[#22272e] cursor-pointer"
                  : "border-[#232a33] bg-[#161b22] opacity-40 cursor-not-allowed",
              )}
            >
              <span className="text-sm leading-none">{s.emoji}</span>
              <span className="text-[9px] font-medium leading-none text-[#9ba4b0]">{s.name}</span>
              <span className="text-[8px] font-mono leading-none text-[#6e7681]">{s.cost}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-1.5 mt-1.5">
        <button
          type="button"
          onClick={() => {
            if (!locked && canShield()) onShield();
            else if (!locked) toast("Bouclier indisponible", { description: "40 énergie requis." });
          }}
          disabled={locked || !canShield()}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded border px-3 py-2 text-xs font-medium transition-colors min-h-[36px]",
            !locked && canShield()
              ? "border-[#2d333b] bg-[#1c2128] hover:border-[#2ea043] hover:bg-[#22272e] cursor-pointer"
              : "border-[#232a33] bg-[#161b22] opacity-40 cursor-not-allowed",
          )}
        >
          Bouclier <span className="font-mono text-[10px] text-[#6e7681]">40</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (!locked && canUlt()) onUlt();
            else if (!locked) toast("Ultime verrouillé", { description: "Combo ≥ 10 requis." });
          }}
          disabled={locked || !canUlt()}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded border px-3 py-2 text-xs font-medium transition-colors min-h-[36px]",
            !locked && canUlt()
              ? "border-[#3b82f6] bg-[rgba(59,130,246,0.1)] text-[#3b82f6] hover:bg-[rgba(59,130,246,0.18)] cursor-pointer"
              : "border-[#232a33] bg-[#161b22] opacity-40 cursor-not-allowed",
          )}
        >
          Ultime · {def.ultimate.name}
        </button>
      </div>
    </div>
  );
}
