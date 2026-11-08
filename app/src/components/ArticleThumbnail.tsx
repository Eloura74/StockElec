import React from "react"
import {
  Zap,
  Cable,
  Plug,
  Lightbulb,
  Boxes,
  Wrench,
  Shield,
  Layers,
  Package,
  Cpu,
  Radio,
  Flame,
} from "lucide-react"

interface ArticleThumbnailProps {
  designation?: string | null
  categorie?: string | null
  marque?: string | null
  photoUrl?: string | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function ArticleThumbnail({
  designation = "",
  categorie = "",
  marque = "",
  photoUrl,
  size = "md",
  className = "",
}: ArticleThumbnailProps) {
  if (photoUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shrink-0 ${
          size === "sm"
            ? "w-8 h-8"
            : size === "md"
            ? "w-11 h-11"
            : size === "lg"
            ? "w-16 h-16"
            : "w-24 h-24"
        } ${className}`}
      >
        <img
          src={photoUrl}
          alt={designation || "Article"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    )
  }

  const text = `${designation || ""} ${categorie || ""}`.toLowerCase()

  let Icon = Package
  let gradient = "from-slate-600 to-slate-800"
  let iconColor = "text-slate-200"
  let badgeLabel = "MAT"

  if (text.includes("disjonct") || text.includes("différentiel") || text.includes("inter diff") || text.includes("disj")) {
    Icon = Zap
    gradient = "from-blue-600 to-indigo-700"
    iconColor = "text-blue-100"
    badgeLabel = "DISJ"
  } else if (text.includes("cable") || text.includes("câble") || text.includes("ho7") || text.includes("r2v") || text.includes("fil") || text.includes("couronne")) {
    Icon = Cable
    gradient = "from-emerald-600 to-teal-700"
    iconColor = "text-emerald-100"
    badgeLabel = "CÂBLE"
  } else if (text.includes("prise") || text.includes("interrupteur") || text.includes("poussoir") || text.includes("va-et-vient") || text.includes("va et vient") || text.includes("celiane") || text.includes("mosaic") || text.includes("odace")) {
    Icon = Plug
    gradient = "from-violet-600 to-purple-800"
    iconColor = "text-violet-100"
    badgeLabel = "APP"
  } else if (text.includes("spot") || text.includes("luminaire") || text.includes("led") || text.includes("lampe") || text.includes("hublot") || text.includes("projecteur") || text.includes("eclairage") || text.includes("éclairage")) {
    Icon = Lightbulb
    gradient = "from-amber-500 to-orange-600"
    iconColor = "text-amber-100"
    badgeLabel = "LUM"
  } else if (text.includes("wago") || text.includes("borne") || text.includes("connect")) {
    Icon = Cpu
    gradient = "from-rose-600 to-red-700"
    iconColor = "text-rose-100"
    badgeLabel = "CONN"
  } else if (text.includes("boite") || text.includes("boîte") || text.includes("encastrement") || text.includes("batibox") || text.includes("derivation") || text.includes("dérivation")) {
    Icon = Boxes
    gradient = "from-sky-600 to-blue-700"
    iconColor = "text-sky-100"
    badgeLabel = "BOÎTE"
  } else if (text.includes("gaine") || text.includes("icta") || text.includes("goulotte") || text.includes("moulure") || text.includes("tube")) {
    Icon = Layers
    gradient = "from-stone-600 to-zinc-700"
    iconColor = "text-stone-100"
    badgeLabel = "CONDUIT"
  } else if (text.includes("outil") || text.includes("pince") || text.includes("visseuse") || text.includes("perfo") || text.includes("tournevis")) {
    Icon = Wrench
    gradient = "from-amber-600 to-yellow-700"
    iconColor = "text-amber-100"
    badgeLabel = "OUTIL"
  } else if (text.includes("epi") || text.includes("casque") || text.includes("gant") || text.includes("lunette") || text.includes("masque")) {
    Icon = Shield
    gradient = "from-cyan-600 to-blue-800"
    iconColor = "text-cyan-100"
    badgeLabel = "EPI"
  } else if (text.includes("detecteur") || text.includes("détecteur") || text.includes("camera") || text.includes("caméra") || text.includes("alarme")) {
    Icon = Radio
    gradient = "from-red-600 to-rose-700"
    iconColor = "text-red-100"
    badgeLabel = "SEC"
  }

  const dimensions =
    size === "sm"
      ? "w-8 h-8 rounded-lg"
      : size === "md"
      ? "w-11 h-11 rounded-xl"
      : size === "lg"
      ? "w-16 h-16 rounded-2xl"
      : "w-24 h-24 rounded-2xl"

  const iconSizes =
    size === "sm"
      ? "w-4 h-4"
      : size === "md"
      ? "w-5 h-5"
      : size === "lg"
      ? "w-8 h-8"
      : "w-12 h-12"

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-gradient-to-br ${gradient} ${dimensions} flex items-center justify-center shadow-2xs border border-white/20 select-none ${className}`}
      title={categorie || designation || "Article"}
    >
      <Icon className={`${iconSizes} ${iconColor} drop-shadow-sm`} />
      {size !== "sm" && (
        <span className="absolute bottom-0.5 right-1 text-[8px] font-black tracking-tighter text-white/60 uppercase">
          {badgeLabel}
        </span>
      )}
    </div>
  )
}

