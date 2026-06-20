"use client";

import { cn } from "@/lib/utils";

interface NumericKeypadProps {
  onKey: (k: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function NumericKeypad({ onKey, onBackspace, onSubmit }: NumericKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5 lg:hidden">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onKey(k)}
          className="h-14 rounded-md bg-[#1c2128] border border-[#2d333b] text-xl font-mono font-medium text-[#e6edf3] active:bg-[#3b82f6] active:text-white transition-colors"
        >
          {k}
        </button>
      ))}
      <button
        type="button"
        onClick={onBackspace}
        className="h-14 rounded-md bg-[#1c2128] border border-[#2d333b] text-xl text-[#9ba4b0] active:bg-[#22272e] transition-colors"
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => onKey("0")}
        className="h-14 rounded-md bg-[#1c2128] border border-[#2d333b] text-xl font-mono font-medium text-[#e6edf3] active:bg-[#3b82f6] active:text-white transition-colors"
      >
        0
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="h-14 rounded-md bg-[#3b82f6] border border-[#3b82f6] text-xl text-white font-semibold active:bg-[#2563eb] transition-colors"
      >
        ✓
      </button>
    </div>
  );
}
