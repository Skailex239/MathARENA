"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { divisionFor } from "@/lib/game/divisions";

/* ============================================================
   MathArena UI primitives — warm LIGHT mode
   Outline buttons, cream cards, subtle borders, ornaments.
   ============================================================ */

type BtnVariant = "primary" | "training" | "secondary" | "danger" | "ghost";
type BtnSize = "sm" | "md" | "lg";

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-md select-none disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const BTN_VARIANT: Record<BtnVariant, string> = {
  // Outline orange → fill on hover
  primary:
    "bg-transparent border border-[#e8823d] text-[#e8823d] hover:bg-[#e8823d] hover:text-[#faf6f0]",
  // Outline golden peach → fill on hover
  training:
    "bg-transparent border border-[#f0b27a] text-[#f0b27a] hover:bg-[#f0b27a] hover:text-[#faf6f0]",
  secondary:
    "bg-[#faf6f0] border border-[#dcd0bc] text-[#6b5f4f] hover:bg-[#efe8db] hover:text-[#2a2520]",
  danger:
    "bg-transparent border border-[#b5524a] text-[#b5524a] hover:bg-[rgba(181,82,74,0.08)]",
  ghost: "bg-transparent text-[#9c8e7a] hover:text-[#2a2520] hover:bg-[#efe8db]",
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

/* Panel — cream card, subtle border */
export function Panel({
  className,
  children,
  hover,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "bg-[#faf6f0] border border-[#ebe2d2] rounded-md",
        hover && "transition-all duration-300 hover:border-[#dcd0bc] hover:shadow-[0_0_24px_rgba(232,130,61,0.06)] hover:-translate-y-0.5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h1 className={cn("text-2xl font-semibold text-[#2a2520] tracking-[-0.01em]", className)}>{children}</h1>
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-[11px] font-medium uppercase tracking-[0.08em] text-[#9c8e7a]", className)}>
      {children}
    </span>
  );
}

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
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9c8e7a]">{label}</div>
      <div className="mt-1 font-mono font-bold text-xl text-[#2a2520]">{value}</div>
      {sub && <div className="text-xs text-[#9c8e7a] mt-0.5">{sub}</div>}
    </Panel>
  );
}

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

/* OrnamentDivider — magazine style ── • ── */
export function OrnamentDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-[#c9bba0] my-3", className)}>
      <span className="flex-1 h-px bg-[#ebe2d2]" />
      <span className="text-xs">•</span>
      <span className="flex-1 h-px bg-[#ebe2d2]" />
    </div>
  );
}

/* Tabs — warm (underline active) */
export function Tabs<T extends string>({
  options,
  value,
  onChange,
  className,
  accent = "orange",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  accent?: "orange" | "peach";
}) {
  const activeColor = accent === "orange" ? "#e8823d" : "#f0b27a";
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-colors border-b-2",
            value === o.value
              ? "border-current"
              : "border-transparent text-[#9c8e7a] hover:text-[#6b5f4f]",
          )}
          style={value === o.value ? { color: activeColor, borderColor: activeColor } : undefined}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* DataTable — dense, warm, no zebra, fine dividers */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  highlight,
  rowClassName,
  className,
}: {
  columns: { key: string; header: React.ReactNode; className?: string }[];
  rows: T[];
  rowKey: (row: T, i: number) => string;
  highlight?: (row: T, i: number) => boolean;
  rowClassName?: (row: T, i: number) => string | undefined;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto scrollbar-warm", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#ebe2d2] text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn("py-2 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#9c8e7a] whitespace-nowrap", c.className)}
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
                "border-b border-[#ebe2d2] transition-colors",
                highlight?.(row, i) ? "bg-[rgba(232,130,61,0.04)] border-l-2 border-l-[#e8823d]" : "",
                rowClassName?.(row, i),
                "hover:bg-[#efe8db]",
              )}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("py-2 px-3 text-[#2a2520] whitespace-nowrap", c.className)}>
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
