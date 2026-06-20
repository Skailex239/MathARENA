"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { divisionFor } from "@/lib/game/divisions";

/* ============================================================
   MathArena UI primitives — warm dark palette
   ============================================================ */

type BtnVariant = "primary" | "training" | "secondary" | "danger" | "ghost";
type BtnSize = "sm" | "md" | "lg";

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 rounded-md select-none disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: "bg-[#ff8c42] hover:bg-[#e5732a] text-[#14110f]",
  training: "bg-[#f5deb3] hover:bg-[#e5c99a] text-[#14110f]",
  secondary: "bg-transparent border border-[#4a4133] text-[#f5efe6] hover:bg-[#2e2820] hover:border-[#5c5142]",
  danger: "bg-transparent border border-[#c45a4a] text-[#c45a4a] hover:bg-[rgba(196,90,74,0.1)]",
  ghost: "bg-transparent text-[#8b8270] hover:text-[#f5efe6] hover:bg-[#2e2820]",
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

/* Panel — card warm */
export function Panel({
  className,
  children,
  hover,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "bg-[#1c1815] border border-[#4a4133] rounded-[10px]",
        hover && "transition-colors duration-200 hover:border-[#5c5142]",
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
    <h1 className={cn("text-2xl font-semibold text-[#f5efe6] tracking-tight", className)}>{children}</h1>
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-xs font-medium uppercase tracking-wider text-[#8b8270]", className)}>
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
      <div className="text-xs font-medium uppercase tracking-wider text-[#8b8270]">{label}</div>
      <div className="mt-1 font-mono font-medium text-xl text-[#f5efe6]">{value}</div>
      {sub && <div className="text-xs text-[#8b8270] mt-0.5">{sub}</div>}
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

/* Tabs — warm (orange active) */
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
  accent?: "orange" | "beige";
}) {
  const activeColor = accent === "orange" ? "bg-[#ff8c42] text-[#14110f]" : "bg-[#f5deb3] text-[#14110f]";
  return (
    <div className={cn("inline-flex items-center gap-0.5 p-0.5 rounded-md bg-[#252019] border border-[#4a4133]", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1.5 rounded text-sm font-medium transition-colors",
            value === o.value ? activeColor : "text-[#8b8270] hover:text-[#f5efe6] hover:bg-[#2e2820]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* DataTable — dense warm */
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
    <div className={cn("overflow-x-auto scrollbar-warm", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#4a4133] text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn("py-2 px-3 text-xs font-medium uppercase tracking-wider text-[#8b8270] whitespace-nowrap", c.className)}
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
                "border-b border-[#3a3328] transition-colors",
                highlight?.(row, i)
                  ? "bg-[rgba(255,140,66,0.06)] border-l-2 border-l-[#ff8c42]"
                  : i % 2 === 1
                    ? "bg-[#1c1815]/40"
                    : "",
                "hover:bg-[#2e2820]",
              )}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("py-2 px-3 text-[#f5efe6] whitespace-nowrap", c.className)}>
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
