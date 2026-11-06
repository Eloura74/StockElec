"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createOutillage, updateOutillage, deleteOutillage } from "@/app/actions/outillage"
import { Save, Trash2, ArrowLeft, Wrench } from "lucide-react"
import Link from "next/link"
import { ScannerInput } from "./ScannerInput"

export function OutillageForm({ outillage = null }: { outillage?: any }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    try {
      if (outillage) {
        await updateOutillage(formData)
      } else {
        await createOutillage(formData)
      }
      router.push("/outillage")
    } catch (error) {
      console.error(error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3.5">
        <Link
          href="/outillage"
          className="p-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 shadow-2xs transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 mb-1">
            Parc Machines & Équipements
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {outillage ? `Modifier « ${outillage.nom} »` : "Nouvelle Machine / Outillage"}
          </h1>
        </div>
      </div>

      <form
        action={handleSubmit}
        className="prestige-card bg-white dark:bg-[#111622] rounded-2xl shadow-2xs border border-slate-200/80 dark:border-white/[0.08] p-6 space-y-5 text-xs"
      >
        {outillage && <input type="hidden" name="id" value={outillage.id} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nom de la machine *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Wrench className="h-4 w-4 text-slate-400" />
              </div>
              <input
                required
                name="nom"
                type="text"
                defaultValue={outillage?.nom}
                placeholder="ex: Perforateur Hilti TE 6-A22"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-semibold focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Marque / Constructeur
            </label>
            <input
              name="marque"
              type="text"
              defaultValue={outillage?.marque || ""}
              placeholder="ex: Hilti, Makita, Fluke, Bosch..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Valeur d&apos;achat estimée (€ HT)
            </label>
            <input
              name="valeur"
              type="number"
              step="0.01"
              defaultValue={outillage?.valeur || 0}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-bold tabular-nums focus:border-blue-500 text-sm"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <ScannerInput
              name="reference"
              label="Numéro de série ou Code-barres interne"
              defaultValue={outillage?.reference || ""}
              placeholder="Scannez l'étiquette ou tapez le numéro"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
              Collez une étiquette code-barres sur la machine pour l&apos;emprunter ou la restituer en 1 seconde avec la caméra.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-60 transition-all cursor-pointer tactile-btn"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? "Enregistrement..." : "Enregistrer la Machine"}</span>
          </button>

          {outillage && (
            <button
              type="button"
              onClick={async () => {
                if (confirm("Êtes-vous sûr de vouloir supprimer cet outil ?")) {
                  await deleteOutillage(outillage.id)
                  router.push("/outillage")
                }
              }}
              className="px-4 py-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/60 font-bold flex items-center justify-center transition-colors cursor-pointer"
              title="Supprimer cette machine"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
