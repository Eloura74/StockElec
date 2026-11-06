import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ReceptionClient } from "./ReceptionClient"
import { Wand2 } from "lucide-react"

export default async function ReceptionMagiquePage() {
  const session = await getSession()
  if (!session || session.role !== "GERANT") {
    redirect("/login")
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
              <Wand2 className="w-3 h-3" />
              Automatisation Bons de Livraison
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Réception Magique de Factures & BL
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Déposez un Bon de Livraison ou une Facture (Excel / CSV) fourni par votre grossiste. Le système identifie les références et incrémente le stock dépôt automatiquement.
          </p>
        </div>
      </div>

      <ReceptionClient knownReferences={[]} />
    </div>
  )
}
