"use client"

import { useState } from "react"
import {
  Building2,
  Search,
  ReceiptText,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
} from "lucide-react"
import { SupplierBadge } from "@/components/SupplierBadge"

export function RentabiliteClient({ initialData }: { initialData: any[] }) {
  const [search, setSearch] = useState("")
  const [expandedChantier, setExpandedChantier] = useState<string | null>(null)

  const filteredData = initialData.filter((c) =>
    c.nom.toLowerCase().includes(search.toLowerCase())
  )

  const grandTotal = filteredData.reduce((acc, c) => acc + c.totalAchats, 0)
  const moyenneChantier = filteredData.length > 0 ? grandTotal / filteredData.length : 0

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 3 Cartes KPIs Prestige */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="prestige-sheen bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Chantiers Imputés
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {filteredData.length}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              avec factures fournisseurs
            </p>
          </div>
          <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 rounded-xl flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        <div className="prestige-sheen bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Coût d&apos;Achats Total HT
            </p>
            <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 tabular-nums">
              {grandTotal.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              €
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              cumul des factures ventilées
            </p>
          </div>
          <div className="h-10 w-10 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 rounded-xl flex items-center justify-center">
            <ReceiptText className="h-5 w-5" />
          </div>
        </div>

        <div className="prestige-sheen bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Coût Moyen / Chantier
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
              {moyenneChantier.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              €
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              moyenne hors taxes par site
            </p>
          </div>
          <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Barre de Recherche Prestige */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Filtrer un chantier par nom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xs text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Liste des Chantiers */}
      <div className="space-y-3.5">
        {filteredData.map((chantier) => {
          const sharePct =
            grandTotal > 0 ? Math.min(100, Math.round((chantier.totalAchats / grandTotal) * 100)) : 0
          return (
            <div
              key={chantier.nom}
              className="prestige-card bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xs overflow-hidden"
            >
              {/* Header / Summary */}
              <div
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                onClick={() =>
                  setExpandedChantier(expandedChantier === chantier.nom ? null : chantier.nom)
                }
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="h-10 w-10 bg-slate-100 dark:bg-white/[0.05] rounded-xl text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {chantier.nom}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 tabular-nums">
                        {sharePct}% du total
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <ReceiptText className="h-3.5 w-3.5" /> {chantier.nbLignes} lignes facturées
                      </span>
                      {chantier.datePremierAchat && chantier.dateDernierAchat && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(chantier.datePremierAchat).toLocaleDateString("fr-FR")} →{" "}
                          {new Date(chantier.dateDernierAchat).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                        style={{ width: `${Math.max(4, sharePct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Total Achats HT
                    </p>
                    <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                      {chantier.totalAchats.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      €
                    </p>
                  </div>
                  <div className="text-slate-400">
                    {expandedChantier === chantier.nom ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedChantier === chantier.nom && (
                <div className="border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01] p-5 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      Fournisseurs sollicités
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {chantier.fournisseurs.map((f: string) => (
                        <SupplierBadge key={f} name={f} size="sm" />
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622]">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50/80 dark:bg-white/[0.02] uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.06]">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Date</th>
                          <th className="px-4 py-3 font-semibold">Fournisseur</th>
                          <th className="px-4 py-3 font-semibold">Article & Réf</th>
                          <th className="px-4 py-3 font-semibold text-right">Qté</th>
                          <th className="px-4 py-3 font-semibold text-right">P.U. HT</th>
                          <th className="px-4 py-3 font-semibold text-right">Total HT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {chantier.lignes.map((ligne: any, idx: number) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                              {ligne.date ? new Date(ligne.date).toLocaleDateString("fr-FR") : "-"}
                            </td>
                            <td className="px-4 py-3">
                              <SupplierBadge name={ligne.fournisseur} />
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {ligne.designation}
                              </p>
                              <p className="text-[11px] font-mono text-slate-400">
                                {ligne.reference}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                              {ligne.quantite}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                              {ligne.prixUnitaire.toFixed(2)} €
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900 dark:text-white tabular-nums">
                              {ligne.total.toFixed(2)} €
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredData.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-[#111622] rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08]">
            <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Aucun chantier trouvé
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
              Les chantiers apparaîtront ici dès que des factures fournisseurs y seront ventilées.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
