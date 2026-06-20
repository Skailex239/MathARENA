"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { divisionFor } from "@/lib/game/divisions";

/* ============================================================
   MathArena UI primitives — sober, flat, professional
   ============================================================ */

/* ----------------------------------------------------------------
   Btn — flat, radius 6px, no shadow, no glow
   ---------------------------------------------------------------- */
type BtnVariant = "primary" | "secondary" | "danger" | "ghost";
type BtnSize = "sm" | "md" | "lg";

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 rounded-md select-none disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: "bg-[#3b82f6] hover:bg-[#2563eb] text-white",
  secondary: "bg-transparent border border-[#2d333b] text-[#e6edf3] hover:bg-[#22272e] hover:border-[#444c56]",
  danger: "bg-transparent border border-[#f85149] text-[#f85149] hover:bg-[rgba(248,81,73,0.1)]",
  ghost: "bg-transparent text-[#9ba4b0] hover:text-[#e6edf3] hover:bg-[#22272e]",
};

const BTN_SIZE: Record<BtnSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
};

export interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
}
export const Btn = React.forwardRef<HTMLButtonElement, BtnProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button ref={ref} className={cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)} {...props} />
  ),
);
Btn.displayName = "Btn";

/* ----------------------------------------------------------------
   Panel — card #161B22, border #2D333B, radius 8px, no gradient
   ---------------------------------------------------------------- */
export function Panel({
  className,
  children,
  hover,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "bg-[#161b22] border border-[#2d333b] rounded-lg",
        hover && "transition-colors duration-150 hover:border-[#444c56]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------
   PageTitle — H1 dashboard (28px / 600), pas de hero géant
   ---------------------------------------------------------------- */
export function PageTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h1 className={cn("text-2xl font-semibold text-[#e6edf3] tracking-tight", className)}>{children}</h1>
  );
}

/* ----------------------------------------------------------------
   SectionLabel — small uppercase tracking-wide (12px / 500)
   ---------------------------------------------------------------- */
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-xs font-medium uppercase tracking-wider text-[#6e7681]", className)}>
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------
   StatTile — stat compacte dashboard
   ---------------------------------------------------------------- */
export function StatTile({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  className?: string;
}) {
  return (
    <Panel className={cn("p-4", className)}>
      <div className="text-xs font-medium uppercase tracking-wider text-[#6e7681]">{label}</div>
      <div className="mt-1 font-mono font-medium text-xl text-[#e6edf3]">{value}</div>
      {sub && <div className="text-xs text-[#6e7681] mt-0.5">{sub}</div>}
    </Panel>
  );
}

/* ----------------------------------------------------------------
   HealthBar — compacte, sobre (success/warning/danger calm)
   ---------------------------------------------------------------- */
export function HealthBar({
  hp,
  maxHp,
  shield = 0,
  className,
}: {
  hp: number;
  maxHp: number;
  shield?: number;
  className?: string;
}) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const color = pct > 60 ? "#2ea043" : pct > 30 ? "#d29922" : "#f85149";
  return (
    <div className={cn("relative h-2.5 rounded-sm bg-[#1c2128] overflow-hidden border border-[#2d333b]", className)}>
      <div
        className="absolute inset-y-0 left-0 transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%`, background: color }}
      />
      {shield > 0 && (
        <div
          className="absolute inset-y-0 left-0 bg-[#9ba4b0]/40"
          style={{ width: `${Math.min(100, (shield / maxHp) * 100 + pct)}%` }}
        />
      )}
    </div>
  );
}

/* ----------------------------------------------------------------
   EnergyBar — compacte, bleu sobre
   ---------------------------------------------------------------- */
export function EnergyBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("relative h-1.5 rounded-sm bg-[#1c2128] overflow-hidden border border-[#2d333b]", className)}>
      <div
        className="absolute inset-y-0 left-0 transition-[width] duration-300 ease-out bg-[#3b82f6]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* ----------------------------------------------------------------
   RankBadge — petit, sobre (texte couleur + bordure fine, pas de fond saturé)
   ---------------------------------------------------------------- */
export function RankBadge({ elo, className }: { elo: number; className?: string }) {
  const d = divisionFor(elo);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide border whitespace-nowrap",
        className,
      )}
      style={{ color: d.color, borderColor: `${d.color}55`, background: `${d.color}12` }}
    >
      {d.name}
    </span>
  );
}

/* ----------------------------------------------------------------
   Tabs — compacts (mode de jeu), style Chess.com Bullet/Blitz/Rapide
   ---------------------------------------------------------------- */
export function Tabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; sub?: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 p-0.5 rounded-md bg-[#1c2128] border border-[#2d333b]", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1.5 rounded text-sm font-medium transition-colors",
            value === o.value
              ? "bg-[#3b82f6] text-white"
              : "text-[#9ba4b0] hover:text-[#e6edf3] hover:bg-[#22272e]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------
   DataTable — table dense style Chess.com (zebra subtle + hover)
   ---------------------------------------------------------------- */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  highlight,
  className,
}: {
  columns: { key: string; header: React.ReactNode; className?: string }[];
  rows: T[];
  rowKey: (row: T, i: number) => string;
  highlight?: (row: T, i: number) => boolean;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto scrollbar-thin", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2d333b] text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn("py-2 px-3 text-xs font-medium uppercase tracking-wider text-[#6e7681] whitespace-nowrap", c.className)}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              className={cn(
                "border-b border-[#232a33] transition-colors",
                highlight?.(row, i)
                  ? "bg-[rgba(59,130,246,0.08)]"
                  : i % 2 === 1
                    ? "bg-[#161b22]/40"
                    : "",
                "hover:bg-[#22272e]",
              )}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("py-2 px-3 text-[#e6edf3] whitespace-nowrap", c.className)}>
                  {(row as Record<string, React.ReactNode>)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
