"use client"

import { useState } from "react"
import { emprunterOutillage } from "@/app/actions/outillage"
import { ArrowRightLeft, Camera } from "lucide-react"
import dynamic from 'next/dynamic'

const BarcodeScanner = dynamic(() => import('./BarcodeScanner').then(mod => mod.BarcodeScanner), { ssr: false })

export function EmpruntOutillageForm({ outillages, chantiers }: { outillages: any[], chantiers: any[] }) {
  const [isScanning, setIsScanning] = useState(false)
  const [selectedOutillageId, setSelectedOutillageId] = useState("")
  const [actionType, setActionType] = useState("Emprunt")
  const [scanError, setScanError] = useState<string | null>(null)
  
  const handleScan = (code: string) => {
    setIsScanning(false)
    setScanError(null)

    const trimmedCode = code.trim()
    const outil = outillages.find(o => o.reference === trimmedCode)
    if (outil) {
      setSelectedOutillageId(outil.id)
      
      // Auto-select action based on current status
      if (outil.statut === "Disponible") setActionType("Emprunt")
      else if (outil.statut === "En Chantier") setActionType("Retour")
      
    } else {
      setScanError(`Outil introuvable (Code lu : ${trimmedCode})`)
    }
  }

  const selectedOutil = outillages.find(o => o.id === selectedOutillageId)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <ArrowRightLeft className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Emprunt & Retour</h2>
      </div>

      <div className="mb-6">
        <button 
          onClick={() => setIsScanning(true)}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-xl hover:bg-gray-800 transition-colors font-medium shadow-md shadow-gray-900/20"
        >
          <Camera className="h-5 w-5" />
          Scanner un outil
        </button>
        {scanError && <p className="text-red-500 text-sm mt-2 font-medium text-center">{scanError}</p>}
      </div>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">OU SÉLECTION MANUELLE</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      <form action={async (formData) => {
        await emprunterOutillage(formData)
        setSelectedOutillageId("")
        setActionType("Emprunt")
      }} className="space-y-5">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sélectionner l'outil</label>
          <select 
            name="outillageId" 
            required 
            value={selectedOutillageId}
            onChange={(e) => {
              setSelectedOutillageId(e.target.value)
              const out = outillages.find(o => o.id === e.target.value)
              if (out?.statut === "Disponible") setActionType("Emprunt")
              if (out?.statut === "En Chantier") setActionType("Retour")
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Choisir un outil --</option>
            {outillages.map(o => (
              <option key={o.id} value={o.id}>
                {o.nom} {o.reference ? `(${o.reference})` : ''} - {o.statut}
              </option>
            ))}
          </select>
        </div>

        {selectedOutil && (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
            <span className="font-semibold text-gray-900">{selectedOutil.nom}</span>
            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              selectedOutil.statut === 'Disponible' ? 'bg-emerald-100 text-emerald-800' :
              selectedOutil.statut === 'En Chantier' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {selectedOutil.statut}
            </span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
          <div className="grid grid-cols-2 gap-2">
            <label className={`border rounded-lg p-3 flex flex-col items-center gap-1 cursor-pointer transition-colors ${actionType === 'Emprunt' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'hover:bg-gray-50 text-gray-600'}`}>
              <input type="radio" name="type" value="Emprunt" checked={actionType === 'Emprunt'} onChange={(e) => setActionType(e.target.value)} className="sr-only" />
              <span className="text-sm font-semibold">Emprunter</span>
            </label>
            <label className={`border rounded-lg p-3 flex flex-col items-center gap-1 cursor-pointer transition-colors ${actionType === 'Retour' ? 'bg-emerald-50 border-emerald-600 text-emerald-700' : 'hover:bg-gray-50 text-gray-600'}`}>
              <input type="radio" name="type" value="Retour" checked={actionType === 'Retour'} onChange={(e) => setActionType(e.target.value)} className="sr-only" />
              <span className="text-sm font-semibold">Restituer</span>
            </label>
            <label className={`border rounded-lg p-3 flex flex-col items-center gap-1 cursor-pointer transition-colors ${actionType === 'Réparation' ? 'bg-orange-50 border-orange-600 text-orange-700' : 'hover:bg-gray-50 text-gray-600'}`}>
              <input type="radio" name="type" value="Réparation" checked={actionType === 'Réparation'} onChange={(e) => setActionType(e.target.value)} className="sr-only" />
              <span className="text-sm font-semibold text-center leading-tight">Envoyer en réparation</span>
            </label>
            <label className={`border rounded-lg p-3 flex flex-col items-center gap-1 cursor-pointer transition-colors ${actionType === 'Perte' ? 'bg-red-50 border-red-600 text-red-700' : 'hover:bg-gray-50 text-gray-600'}`}>
              <input type="radio" name="type" value="Perte" checked={actionType === 'Perte'} onChange={(e) => setActionType(e.target.value)} className="sr-only" />
              <span className="text-sm font-semibold">Déclarer perdu</span>
            </label>
          </div>
        </div>

        {actionType === 'Emprunt' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chantier de destination *</label>
            <select name="chantierId" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">-- Sélectionner --</option>
              {chantiers.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Collaborateur *</label>
          <input 
            type="text" 
            name="utilisateur" 
            required
            defaultValue={selectedOutil?.utilisateur || ""}
            placeholder="Ex: Quentin, Julien..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observation (Optionnel)</label>
          <input 
            type="text" 
            name="observation" 
            placeholder="État de la machine, batterie manquante..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold text-lg shadow-md transition-colors"
        >
          Valider le mouvement
        </button>
      </form>

      {isScanning && (
        <BarcodeScanner 
          onScan={handleScan} 
          onClose={() => setIsScanning(false)} 
        />
      )}
    </div>
  )
}
