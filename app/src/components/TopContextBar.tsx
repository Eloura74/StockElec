"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRight,
  Home,
  Search,
  Truck,
  ScanBarcode,
  Wifi,
  WifiOff,
} from "lucide-react"

const ROUTE_META: Record<string, { section: string; label: string }> = {
  "/": { section: "Pilotage", label: "Tableau de bord" },
  "/catalogue": { section: "Pilotage", label: "Mon Stock & Catalogue" },
  "/catalogue/import": { section: "Pilotage › Mon Stock", label: "Import CSV / Excel" },
  "/chantiers": { section: "Pilotage", label: "Chantiers" },
  "/outillage": { section: "Pilotage", label: "Outillage" },
  "/outillage/nouveau": { section: "Pilotage › Outillage", label: "Nouvelle Machine" },
  "/inventaire": { section: "Pilotage", label: "Session d'Inventaire" },
  "/reception-magique": { section: "Logistique & Flux", label: "Réception Factures" },
  "/mouvements": { section: "Logistique & Flux", label: "Mouvements de Stock" },
  "/reassort": { section: "Logistique & Flux", label: "Réassort Fournisseurs" },
  "/fournisseurs": { section: "Logistique & Flux", label: "Fournisseurs & Comptabilité" },
  "/rentabilite": { section: "Logistique & Flux", label: "Rentabilité Chantiers" },
  "/journal": { section: "Système", label: "Journal d'Audit" },
  "/guide": { section: "Système", label: "Guide & Aide" },
  "/equipe": { section: "Système", label: "Équipe & Accès" },
  "/parametres": { section: "Système", label: "Préférences & Thèmes" },
}

export function TopContextBar() {
  const pathname = usePathname()
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const syncOnline = () => setIsOnline(navigator.onLine)
    syncOnline()
    window.addEventListener("online", syncOnline)
    window.addEventListener("offline", syncOnline)
    return () => {
      window.removeEventListener("online", syncOnline)
      window.removeEventListener("offline", syncOnline)
    }
  }, [])

  let meta = ROUTE_META[pathname]
  if (!meta) {
    if (pathname.startsWith("/catalogue/")) {
      meta = { section: "Pilotage › Mon Stock", label: "Fiche Article" }
    } else if (pathname.startsWith("/chantiers/")) {
      meta = { section: "Pilotage › Chantiers", label: "Détail Chantier" }
    } else if (pathname.startsWith("/outillage/")) {
      meta = { section: "Pilotage › Outillage", label: "Fiche Machine" }
    } else {
      meta = { section: "Pilotage", label: "StockElec Pro" }
    }
  }

  return (
    <div className="mb-5 pb-3 border-b border-slate-200/70 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
      {/* Fil d'Ariane cliquable */}
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs min-w-0">
        <Link
          href="/"
          prefetch={false}
          className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors"
          title="Tableau de bord"
        >
          <Home className="w-3.5 h-3.5" />
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
        <span className="text-slate-400 dark:text-slate-500 font-medium hidden sm:inline truncate">
          {meta.section}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 hidden sm:inline" />
        <span className="font-bold text-slate-900 dark:text-white truncate">
          {meta.label}
        </span>
      </nav>

      {/* Actions rapides & Statut Live */}
      <div className="flex items-center gap-2">
        <Link
          href="/inventaire"
          prefetch={false}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-white/[0.08] hover:border-blue-400 dark:hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-300 shadow-2xs transition-all"
          title="Ouvrir Scan & Inventaire"
        >
          <ScanBarcode className="w-3.5 h-3.5 text-blue-500" />
          <span>Scan & Go</span>
        </Link>

        <Link
          href="/depart-matin"
          prefetch={false}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-400 dark:hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-300 shadow-2xs transition-all"
          title="Mode Départ Camion"
        >
          <Truck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden xs:inline">Mode Camion</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))
          }}
          className="hidden md:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-white/[0.08] hover:text-slate-900 dark:hover:text-white shadow-2xs transition-all cursor-pointer"
          title="Recherche globale (Ctrl + K)"
        >
          <Search className="w-3 h-3" />
          <span>Ctrl+K</span>
        </button>

        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border ${
            isOnline
              ? "bg-emerald-50/70 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
              : "bg-amber-50/80 text-amber-700 border-amber-200/70 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/40"
          }`}
        >
          {isOnline ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 live-dot" />
              <Wifi className="w-3 h-3 hidden sm:inline" />
              <span>Synchronisé</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Hors-Ligne</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

