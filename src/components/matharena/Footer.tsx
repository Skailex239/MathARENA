export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-6 h-6 rounded-md bg-[#ff3d8b]/20 text-[#ff3d8b] font-black text-sm">
            M
          </span>
          <span>
            <span className="font-bold text-foreground">MathArena</span> — Ton cerveau est ton arme.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>1v1 · Temps réel · Compétitif</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">Jamais de pay-to-win</span>
        </div>
      </div>
    </footer>
  );
}
