import prisma from "@/lib/prisma"
import Link from "next/link"
import { Plus } from "lucide-react"
import { OutillageCard } from "@/components/OutillageCard"
import { EmpruntOutillageForm } from "@/components/EmpruntOutillageForm"
import { getOutillages } from "@/app/actions/outillage"

export default async function OutillagePage() {
  const outillages = await getOutillages()
  
  const chantiers = await prisma.chantier.findMany({
    where: { statut: 'Actif' },
    orderBy: { nom: 'asc' }
  })

  // Stats rapides
  const total = outillages.length
  const disponibles = outillages.filter((o: any) => o.statut === "Disponible").length
  const enChantier = outillages.filter((o: any) => o.statut === "En Chantier").length
  const autres = total - disponibles - enChantier // En réparation ou perdu

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outillage</h1>
          <p className="text-gray-500 mt-1">Gérez vos machines et équipements onéreux.</p>
        </div>
        <Link href="/outillage/nouveau" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un outil
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Machines</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-700">{disponibles}</div>
          <div className="text-xs text-emerald-600 uppercase tracking-wide">Au dépôt</div>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-700">{enChantier}</div>
          <div className="text-xs text-orange-600 uppercase tracking-wide">Sur Chantier</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outillages.map((outil: any) => (
              <OutillageCard key={outil.id} outil={outil} />
            ))}
            {outillages.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed">
                Aucun outil enregistré pour le moment.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <EmpruntOutillageForm outillages={outillages} chantiers={chantiers} />
        </div>

      </div>
    </div>
  )
}
