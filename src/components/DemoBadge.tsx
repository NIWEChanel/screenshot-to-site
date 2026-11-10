export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning bg-warning/20 px-3 py-1 text-xs font-bold uppercase tracking-wide">
      <span className="h-2 w-2 animate-pulse rounded-full bg-warning" /> Demo environment
    </span>
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

export function StatusPill({ s }: { s: string }) {
  const tone =
    s === "approved" || s === "active"
      ? "bg-leaf/15 text-leaf"
      : s === "rejected" || s === "suspended"
        ? "bg-destructive/15 text-destructive"
        : s === "pending"
          ? "bg-warning/25"
          : "bg-muted";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>{s}</span>;
}
