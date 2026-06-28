'use client'

import { useState } from 'react'
import { ArrowRightLeft, Camera } from 'lucide-react'
import { createMouvement } from '@/app/actions/mouvements'
import { BarcodeScanner } from './BarcodeScanner'

export function MouvementForm({ articles, chantiers }: { articles: any[], chantiers: any[] }) {
  const [isScanning, setIsScanning] = useState(false)
  const [selectedArticleId, setSelectedArticleId] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)

  const handleScan = (code: string) => {
    setIsScanning(false)
    setScanError(null)

    // Chercher l'article par codeBarre
    const article = articles.find(a => a.codeBarre === code)
    if (article) {
      setSelectedArticleId(article.id)
      // On pourrait aussi jouer un petit son de succès ici
    } else {
      setScanError(`Aucun article trouvé pour le code : ${code}`)
    }
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="border-b bg-gray-50/50 px-4 py-3 font-medium flex justify-between items-center">
        <span>Saisir un mouvement</span>
        <button 
          type="button" 
          onClick={() => setIsScanning(true)}
          className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-200 transition-colors"
        >
          <Camera className="w-4 h-4" />
          Scanner
        </button>
      </div>

      <form action={createMouvement} className="p-4 space-y-4">
        {scanError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {scanError}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Type de mouvement</label>
          <select name="type" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white">
            <option value="Depart">Départ vers Chantier</option>
            <option value="Retour">Retour de Chantier</option>
            <option value="Achat">Achat / Entrée Dépôt</option>
            <option value="Consomme">Consommé / Posé</option>
            <option value="Perte">Perdu / Cassé</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Article</label>
          <select 
            required 
            name="articleId" 
            value={selectedArticleId}
            onChange={(e) => setSelectedArticleId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">-- Sélectionner --</option>
            {articles.map(a => (
              <option key={a.id} value={a.id}>[{a.reference}] {a.designation}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Chantier (si applicable)</label>
            <select name="chantierId" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white">
              <option value="">-- Aucun / Dépôt --</option>
              {chantiers.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantité</label>
            <input required name="quantite" type="number" min="1" defaultValue="1" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 font-bold">👤 Saisi par (OBLIGATOIRE)</label>
            <input required name="utilisateur" type="text" placeholder="Ton prénom" className="mt-1 block w-full rounded-md border-2 border-orange-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Observation</label>
          <textarea name="observation" rows={2} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Optionnel..."></textarea>
        </div>
        
        <button type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <ArrowRightLeft className="h-4 w-4" />
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
