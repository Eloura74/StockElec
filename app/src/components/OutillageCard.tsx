import Link from "next/link"
import { Wrench, CheckCircle, Clock, AlertTriangle, User, MapPin } from "lucide-react"

export function OutillageCard({ outil }: { outil: any }) {
  const isDisponible = outil.statut === "Disponible"
  const isEnChantier = outil.statut === "En Chantier"
  const isEnReparation = outil.statut === "En Réparation"
  const isPerdu = outil.statut === "Perdu"

  return (
    <Link href={`/outillage/${outil.id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
        
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              isDisponible ? 'bg-emerald-100 text-emerald-600' : 
              isEnChantier ? 'bg-orange-100 text-orange-600' : 
              'bg-red-100 text-red-600'
            }`}>
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-tight">{outil.nom}</h3>
              <p className="text-sm text-gray-500 mt-1">{outil.marque || 'Sans marque'} {outil.reference ? `• Réf: ${outil.reference}` : ''}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-50 flex flex-col gap-2">
          {isDisponible && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg text-sm font-medium w-max">
              <CheckCircle className="h-4 w-4" />
              Disponible au dépôt
            </div>
          )}
          
          {isEnChantier && (
            <div className="flex flex-col gap-1 text-orange-800 bg-orange-50 px-3 py-2 rounded-lg text-sm font-medium">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Sur Chantier
              </div>
              <div className="flex items-center gap-4 text-xs font-normal text-orange-700 mt-1">
                {outil.chantier && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {outil.chantier.nom}
                  </div>
                )}
                {outil.utilisateur && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {outil.utilisateur}
                  </div>
                )}
              </div>
            </div>
          )}

          {(isEnReparation || isPerdu) && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-2 rounded-lg text-sm font-medium w-max">
              <AlertTriangle className="h-4 w-4" />
              {outil.statut}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
