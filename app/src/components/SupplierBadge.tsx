import React from "react"

interface SupplierBadgeProps {
  name?: string | null
  marque?: string | null
  size?: "xs" | "sm"
}

const BRAND_PALETTES: Array<{
  match: string[]
  bg: string
  dot: string
  short: string
}> = [
  {
    match: ["legrand", "bticino", "arnould", "planet wattohm", "sarlam"],
    bg: "bg-orange-50 text-orange-800 border-orange-200/70 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800/40",
    dot: "bg-orange-500",
    short: "LG",
  },
  {
    match: ["schneider", "telemecanique", "merlin gerin"],
    bg: "bg-emerald-50 text-emerald-800 border-emerald-200/70 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40",
    dot: "bg-emerald-500",
    short: "SE",
  },
  {
    match: ["hager"],
    bg: "bg-sky-50 text-sky-800 border-sky-200/70 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/40",
    dot: "bg-sky-500",
    short: "HG",
  },
  {
    match: ["rexel"],
    bg: "bg-blue-50 text-blue-800 border-blue-200/70 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/40",
    dot: "bg-blue-500",
    short: "RX",
  },
  {
    match: ["sonepar", "cged"],
    bg: "bg-indigo-50 text-indigo-800 border-indigo-200/70 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/40",
    dot: "bg-indigo-500",
    short: "SN",
  },
  {
    match: ["yesss", "cef"],
    bg: "bg-amber-50 text-amber-800 border-amber-200/70 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/40",
    dot: "bg-amber-500",
    short: "YS",
  },
  {
    match: ["wago", "bizline", "hilti", "makita", "fluke"],
    bg: "bg-rose-50 text-rose-800 border-rose-200/70 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/40",
    dot: "bg-rose-500",
    short: "PR",
  },
  {
    match: ["atlantic", "thermor", "delta dore", "somfy", "urmet", "aiphone", "comelit"],
    bg: "bg-purple-50 text-purple-800 border-purple-200/70 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/40",
    dot: "bg-purple-500",
    short: "DT",
  },
]

export function getSupplierPalette(label?: string | null) {
  if (!label) {
    return {
      bg: "bg-slate-100 text-slate-600 border-slate-200/70 dark:bg-white/[0.05] dark:text-slate-300 dark:border-white/10",
      dot: "bg-slate-400",
      short: "—",
    }
  }
  const lower = label.toLowerCase()
  for (const item of BRAND_PALETTES) {
    if (item.match.some((m) => lower.includes(m))) {
      return item
    }
  }
  return {
    bg: "bg-slate-100/90 text-slate-700 border-slate-200/80 dark:bg-white/[0.06] dark:text-slate-200 dark:border-white/10",
    dot: "bg-blue-400",
    short: label.slice(0, 2).toUpperCase(),
  }
}

export function SupplierBadge({ name, marque, size = "xs" }: SupplierBadgeProps) {
  if (!name && !marque) {
    return <span className="text-slate-300 dark:text-slate-600">—</span>
  }

  const primary = name || marque || ""
  const palette = getSupplierPalette(primary)
  const textSize = size === "sm" ? "text-xs px-2.5 py-1" : "text-[11px] px-2 py-0.5"

  return (
    <div className="flex flex-col items-start gap-1">
      {name && (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-lg border leading-tight ${palette.bg} ${textSize}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${palette.dot}`} />
          <span className="truncate max-w-[165px]">{name}</span>
        </span>
      )}
      {marque && marque.toLowerCase() !== (name || "").toLowerCase() && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
          {marque}
        </span>
      )}
    </div>
  )
}

