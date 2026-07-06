"use client"

import { useState } from "react"
import { FileUp, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import * as XLSX from "xlsx"
import { validerReceptionMagique, ReceptionItem } from "@/app/actions/reception-magique"
import Link from "next/link"

type ParsedRow = ReceptionItem & {
  estConnu: boolean
  selected: boolean
}

export function ReceptionClient({ knownReferences }: { knownReferences: string[] }) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [report, setReport] = useState<{ succes: number, inconnus: ReceptionItem[] } | null>(null)
  
  const knownSet = new Set(knownReferences)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws) as any[]

        const parsed: ParsedRow[] = []

        data.forEach(row => {
          // Heuristique pour trouver les colonnes :
          // Référence: "reference", "ref", "code", "article"
          // Désignation: "designation", "nom", "description", "libelle"
          // Quantité: "quantite", "qte", "qty", "livre"
          
          let ref = ""
          let des = ""
          let qte = 0

          for (const key of Object.keys(row)) {
            const kl = key.toLowerCase()
            const val = row[key]
            if (!ref && (kl.includes("ref") || kl.includes("code") || kl === "article")) ref = String(val).trim()
            else if (!des && (kl.includes("des") || kl.includes("nom") || kl.includes("libelle") || kl.includes("desc"))) des = String(val).trim()
            else if (qte === 0 && (kl.includes("qte") || kl.includes("quantite") || kl.includes("qty") || kl.includes("livre"))) qte = parseInt(val, 10)
          }

          if (ref && qte > 0) {
            parsed.push({
              reference: ref,
              designation: des || "Article sans nom",
              quantite: qte,
              estConnu: knownSet.has(ref),
              selected: knownSet.has(ref) // par défaut on sélectionne que ceux connus
            })
          }
        })

        setRows(parsed)
      } catch (err) {
        alert("Erreur lors de la lecture du fichier.")
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
    const toImport = rows.filter(r => r.selected).map(r => ({ reference: r.reference, designation: r.designation, quantite: r.quantite }))
    if (toImport.length === 0) return alert("Rien à importer.")

    setIsSubmitting(true)
    const res = await validerReceptionMagique(toImport)
    if (res.success && res.report) {
      setReport(res.report)
      setRows([])
    } else {
      alert("Erreur lors de l'importation: " + res.error)
    }
    setIsSubmitting(false)
  }

  if (report) {
    return (
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-50">Réception terminée !</h2>
        <p className="text-lg text-gray-600 dark:text-zinc-300">
          <strong className="text-emerald-600">{report.succes}</strong> articles ont été ajoutés à votre stock.
        </p>
        
        {report.inconnus.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-left inline-block max-w-lg w-full mt-4">
            <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2"><AlertCircle className="w-5 h-5"/> Articles non importés (Références inconnues)</h3>
            <ul className="text-sm text-orange-700 list-disc pl-5 space-y-1">
              {report.inconnus.map((inc, idx) => (
                <li key={idx}><strong>{inc.reference}</strong> - {inc.designation} (x{inc.quantite})</li>
              ))}
            </ul>
            <div className="mt-3 text-xs text-orange-600">
              Astuce : Créez ces références dans votre <Link href="/catalogue" className="underline font-bold">Catalogue</Link> et recommencez.
            </div>
          </div>
        )}

        <div>
          <button onClick={() => setReport(null)} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl">
            Nouvel import
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {!rows.length && (
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl border-2 border-dashed border-gray-300 dark:border-zinc-700 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-950 hover:border-blue-500 transition-colors cursor-pointer relative group">
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {isParsing ? <Loader2 className="w-10 h-10 animate-spin" /> : <FileUp className="w-10 h-10" />}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-50 mb-2">Glissez un fichier Excel ou CSV ici</h3>
          <p className="text-gray-500 dark:text-zinc-400 max-w-sm">Les colonnes Référence, Désignation et Quantité seront automatiquement détectées.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-gray-50 dark:bg-zinc-950 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-zinc-50">Prévisualisation ({rows.length} lignes détectées)</h3>
            <button onClick={() => setRows([])} className="text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:text-zinc-50">Annuler</button>
          </div>
          
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-white dark:bg-zinc-900 sticky top-0 shadow-sm">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-zinc-400 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                      checked={rows.every(r => r.selected)}
                      onChange={e => setRows(rows.map(r => ({ ...r, selected: e.target.checked })))}
                    />
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Statut</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Référence</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">Désignation</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-zinc-400 text-center">Qté</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, idx) => (
                  <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-950 cursor-pointer ${!row.selected ? 'opacity-50' : ''}`} onClick={() => toggleSelect(idx)}>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                        checked={row.selected}
                        onChange={() => toggleSelect(idx)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {row.estConnu ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                          Reconnu
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                          Inconnu
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-900 dark:text-zinc-50">{row.reference}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-300 max-w-xs">{row.designation}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-zinc-50">+{row.quantite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-zinc-950 border-t flex justify-end">
            <button 
              onClick={handleValider}
              disabled={isSubmitting || !rows.some(r => r.selected)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl disabled:opacity-50 flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Importer {rows.filter(r => r.selected).length} articles
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
