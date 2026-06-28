"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createOutillage, updateOutillage, deleteOutillage } from "@/app/actions/outillage"
import { Save, Trash2, ArrowLeft } from "lucide-react"
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/outillage" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {outillage ? "Modifier l'outil" : "Ajouter un outil"}
          </h1>
        </div>
      </div>

      <form action={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {outillage && <input type="hidden" name="id" value={outillage.id} />}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Nom de la machine *</label>
            <input 
              required
              name="nom" 
              type="text" 
              defaultValue={outillage?.nom} 
              placeholder="ex: Perforateur Hilti TE 6"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Marque</label>
            <input 
              name="marque" 
              type="text" 
              defaultValue={outillage?.marque || ''} 
              placeholder="ex: Hilti, Makita..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Valeur estimée (€)</label>
            <input 
              name="valeur" 
              type="number" 
              step="0.01" 
              defaultValue={outillage?.valeur || 0} 
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <ScannerInput 
              name="reference" 
              label="Numéro de série ou Code-barres interne" 
              defaultValue={outillage?.reference || ''}
              placeholder="Scannez l'étiquette ou tapez le numéro"
            />
            <p className="text-xs text-gray-500 mt-1">Collez une étiquette code-barres sur l'outil pour l'emprunter en 1 seconde avec l'appareil photo.</p>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </button>

          {outillage && (
            <button 
              type="button"
              onClick={async () => {
                if(confirm("Êtes-vous sûr de vouloir supprimer cet outil ?")) {
                  await deleteOutillage(outillage.id)
                  router.push("/outillage")
                }
              }}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 font-medium flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
