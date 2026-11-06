export default function GlobalLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-36 rounded-full bg-slate-200/70 dark:bg-white/[0.06]" />
        <div className="h-8 w-72 rounded-xl bg-slate-200/80 dark:bg-white/[0.08]" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-slate-200/50 dark:bg-white/[0.04]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="h-24 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-[#111622]/80" />
        <div className="h-24 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-[#111622]/80" />
        <div className="h-24 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-[#111622]/80" />
      </div>

      <div className="h-80 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-[#111622]/80" />
    </div>
  );
}
