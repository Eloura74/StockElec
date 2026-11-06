"use client"

import { useState } from "react"
import { FileUp, CheckCircle2, AlertCircle, Loader2, Download, X } from "lucide-react"
import * as XLSX from "xlsx"
import {
  validerReceptionMagique,
  verifierReferencesConnues,
  ReceptionItem,
} from "@/app/actions/reception-magique"
import Link from "next/link"
import { toast } from "sonner"

type ParsedRow = ReceptionItem & {
  estConnu: boolean
  selected: boolean
}

export function ReceptionClient({ knownReferences }: { knownReferences: string[] }) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [report, setReport] = useState<{ succes: number; inconnus: ReceptionItem[] } | null>(null)

  const knownSet = new Set(knownReferences)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: "binary" })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws) as any[]

        const rawItems: ReceptionItem[] = []

        data.forEach((row) => {
          let ref = ""
          let des = ""
          let qte = 0

          for (const key of Object.keys(row)) {
            const kl = key.toLowerCase()
            const val = row[key]
            if (!ref && (kl.includes("ref") || kl.includes("code") || kl === "article"))
              ref = String(val).trim()
            else if (
              !des &&
              (kl.includes("des") || kl.includes("nom") || kl.includes("libelle") || kl.includes("desc"))
            )
              des = String(val).trim()
            else if (
              qte === 0 &&
              (kl.includes("qte") || kl.includes("quantite") || kl.includes("qty") || kl.includes("livre"))
            )
              qte = parseInt(val, 10)
          }

          if (ref && qte > 0) {
            rawItems.push({
              reference: ref,
              designation: des || "Article sans nom",
              quantite: qte,
            })
          }
        })

        const serverMatched = await verifierReferencesConnues(rawItems.map((i) => i.reference)).catch(
          () => []
        )
        for (const r of serverMatched) knownSet.add(r)

        const parsed: ParsedRow[] = rawItems.map((item) => ({
          ...item,
          estConnu: knownSet.has(item.reference),
          selected: knownSet.has(item.reference),
        }))

        setRows(parsed)
      } catch {
        toast.error("Erreur lors de la lecture du fichier.")
      }
      setIsParsing(false)
    }
    reader.readAsBinaryString(file)
  }

  const toggleSelect = (index: number) => {
    const newRows = [...rows]
    newRows[index].selected = !newRows[index].selected
    setRows(newRows)
  }

  const handleValider = async () => {
    const toImport = rows
      .filter((r) => r.selected)
      .map((r) => ({ reference: r.reference, designation: r.designation, quantite: r.quantite }))
    if (toImport.length === 0) return toast.error("Rien à importer.")

    setIsSubmitting(true)
    const res = await validerReceptionMagique(toImport)
    if (res.success && res.report) {
      setReport(res.report)
      setRows([])
      toast.success("Importation terminée !")
    } else {
      toast.error("Erreur lors de l'importation: " + res.error)
    }
    setIsSubmitting(false)
  }

  if (report) {
    return (
      <div className="prestige-card bg-white dark:bg-[#111622] p-8 rounded-2xl shadow-2xs border border-slate-200/80 dark:border-white/[0.08] text-center space-y-6 animate-in fade-in duration-200">
        <div className="mx-auto w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/40 rounded-2xl flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Réception terminée !
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              {report.succes}
            </strong>{" "}
            références ont été ajoutées à votre stock dépôt.
          </p>
        </div>

        {report.inconnus.length > 0 && (
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-xl p-4 text-left inline-block max-w-lg w-full">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Références non reconnues au catalogue
            </h3>
            <ul className="text-xs text-amber-700 dark:text-amber-300/90 list-disc pl-5 space-y-1">
              {report.inconnus.map((inc, idx) => (
                <li key={idx}>
                  <strong className="font-mono">{inc.reference}</strong> — {inc.designation} (x
                  {inc.quantite})
                </li>
              ))}
            </ul>
            <div className="mt-3 text-[11px] text-amber-600 dark:text-amber-400">
              Astuce : Créez ces références dans votre{" "}
              <Link href="/catalogue" className="underline font-bold">
                Catalogue
              </Link>{" "}
              puis relancez l&apos;import.
            </div>
          </div>
        )}

        <div>
          <button
            onClick={() => setReport(null)}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-white font-bold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer tactile-btn"
          >
            Importer un autre Bon de Livraison
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!rows.length && (
        <div className="prestige-card bg-white dark:bg-[#111622] p-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/[0.1] flex flex-col items-center justify-center text-center hover:border-blue-500 dark:hover:border-blue-500/50 hover:bg-blue-50/10 dark:hover:bg-blue-950/15 transition-all cursor-pointer relative group">
          <input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            {isParsing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <FileUp className="w-8 h-8" />
            )}
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-1">
            Glissez votre fichier Excel (.xlsx) ou CSV ici
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 max-w-md">
            Les colonnes <span className="font-semibold text-slate-600 dark:text-slate-300">Référence</span>,{" "}
            <span className="font-semibold text-slate-600 dark:text-slate-300">Désignation</span> et{" "}
            <span className="font-semibold text-slate-600 dark:text-slate-300">Quantité</span> sont détectées automatiquement.
          </p>
          <a
            href="data:text/csv;charset=utf-8,Reference,Designation,Quantite%0AEX-123,Article%20Exemple,10"
            download="Modele_Import_Stock.csv"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Télécharger le modèle CSV</span>
          </a>
        </div>
      )}

      {rows.length > 0 && (
        <div className="prestige-card bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-200/70 dark:border-white/[0.06] flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Prévisualisation du Bon de Livraison ({rows.length} lignes détectées)
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Vérifiez les lignes reconnues avant validation en stock
              </p>
            </div>
            <button
              onClick={() => setRows([])}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Annuler</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#161d2d] sticky top-0 border-b border-slate-200/70 dark:border-white/[0.06]">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-slate-400 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 dark:border-white/20 text-blue-600 focus:ring-blue-500"
                      checked={rows.every((r) => r.selected)}
                      onChange={(e) =>
                        setRows(rows.map((r) => ({ ...r, selected: e.target.checked })))
                      }
                    />
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                    Correspondance
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                    Référence
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                    Désignation
                  </th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-slate-400 text-center">
                    Quantité Livrée
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50/70 dark:hover:bg-white/[0.02] cursor-pointer transition-colors ${
                      !row.selected ? "opacity-45" : ""
                    }`}
                    onClick={() => toggleSelect(idx)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 dark:border-white/20 text-blue-600 focus:ring-blue-500"
                        checked={row.selected}
                        onChange={() => toggleSelect(idx)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {row.estConnu ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Reconnu au catalogue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40">
                          Inconnu
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                      {row.reference}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-md truncate">
                      {row.designation}
                    </td>
                    <td className="px-4 py-3 text-center font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{row.quantite}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/70 dark:bg-white/[0.02] border-t border-slate-200/70 dark:border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {rows.filter((r) => r.selected && r.estConnu).length} articles connus
              </span>{" "}
              verront leur stock dépôt incrémenté.
              {rows.some((r) => r.selected && !r.estConnu) && (
                <>
                  {" "}
                  •{" "}
                  <span className="font-bold text-amber-500">
                    {rows.filter((r) => r.selected && !r.estConnu).length} inconnus
                  </span>{" "}
                  seront signalés.
                </>
              )}
            </div>
            <button
              onClick={handleValider}
              disabled={isSubmitting || !rows.some((r) => r.selected)}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-white font-bold text-xs py-3 px-6 rounded-xl disabled:opacity-40 flex items-center gap-2 transition-all cursor-pointer tactile-btn"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Valider l&apos;entrée de {rows.filter((r) => r.selected).length} lignes</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
