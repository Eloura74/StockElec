'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowRightLeft, Camera, Search } from 'lucide-react'
import { createMouvement } from '@/app/actions/mouvements'

// Dynamic import with SSR false to prevent 'window is not defined' during build
const BarcodeScanner = dynamic(() => import('./BarcodeScanner').then(mod => mod.BarcodeScanner), { ssr: false })

export function MouvementForm({ articles, chantiers }: { articles: any[], chantiers: any[] }) {
  const [isScanning, setIsScanning] = useState(false)
  const [selectedArticleId, setSelectedArticleId] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const [selectedChantierId, setSelectedChantierId] = useState('')
  const [chantierSearchQuery, setChantierSearchQuery] = useState('')
  const [showChantierDropdown, setShowChantierDropdown] = useState(false)

  const selectedArticle = articles.find(a => a.id === selectedArticleId)
  const selectedChantier = chantiers.find(c => c.id === selectedChantierId)

  const handleScan = (code: string) => {
    setIsScanning(false)
    setScanError(null)

    // Chercher l'article par codeBarre
    const trimmedCode = code.trim()
    const article = articles.find(a => a.codeBarre === trimmedCode)
    if (article) {
      setSelectedArticleId(article.id)
      // On pourrait aussi jouer un petit son de succès ici
    } else {
      setScanError(`Aucun article trouvé pour le code : ${code}`)
    }
  }

  return (
    <div className="rounded-xl border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <div className="border-b bg-gray-50 dark:bg-zinc-950/50 px-4 py-3 font-medium flex justify-between items-center">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200">Type de mouvement</label>
          <select name="type" className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-900">
            <option value="Depart">Départ vers Chantier</option>
            <option value="Retour">Retour de Chantier</option>
            <option value="Achat">Achat / Entrée Dépôt</option>
            <option value="Consomme">Consommé / Posé</option>
            <option value="Perte">Perdu / Cassé</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200 mb-1">Article</label>
          <div className="relative">
            {/* Native select visually hidden for form validation and submission */}
            <select 
              required 
              name="articleId" 
              value={selectedArticleId}
              onChange={(e) => setSelectedArticleId(e.target.value)}
              className="absolute opacity-0 w-full h-full -z-10 pointer-events-none"
              tabIndex={-1}
            >
              <option value="">-- Sélectionner --</option>
              {articles.map(a => (
                <option key={a.id} value={a.id}>{a.id}</option>
              ))}
            </select>

            {!selectedArticleId ? (
              <>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="block w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                  placeholder="Rechercher un article (référence, nom)..."
                />
                
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {articles
                      .filter(a => 
                        !searchQuery || 
                        a.designation.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (a.reference && a.reference.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .slice(0, 50)
                      .map(a => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setSelectedArticleId(a.id)
                            setSearchQuery('')
                            setShowDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800 last:border-0 transition-colors"
                        >
                          <div className="font-medium text-gray-900 dark:text-zinc-100">{a.designation}</div>
                          <div className="text-xs text-gray-500 dark:text-zinc-400">Réf: {a.reference || 'Aucune'}</div>
                        </button>
                      ))}
                    {articles.filter(a => !searchQuery || a.designation.toLowerCase().includes(searchQuery.toLowerCase()) || (a.reference && a.reference.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-zinc-400 text-center">
                        Aucun article trouvé.
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20 rounded-md">
                <div>
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100">{selectedArticle?.designation}</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">Réf: {selectedArticle?.reference || 'Aucune'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedArticleId('')}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-bold"
                >
                  Changer
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200 mb-1">Chantier (si applicable)</label>
            <div className="relative">
              <select 
                name="chantierId" 
                value={selectedChantierId}
                onChange={(e) => setSelectedChantierId(e.target.value)}
                className="absolute opacity-0 w-full h-full -z-10 pointer-events-none"
                tabIndex={-1}
              >
                <option value="">-- Aucun / Dépôt --</option>
                {chantiers.map(c => (
                  <option key={c.id} value={c.id}>{c.id}</option>
                ))}
              </select>

              {!selectedChantierId ? (
                <>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={chantierSearchQuery}
                    onChange={(e) => {
                      setChantierSearchQuery(e.target.value)
                      setShowChantierDropdown(true)
                    }}
                    onFocus={() => setShowChantierDropdown(true)}
                    onBlur={() => setTimeout(() => setShowChantierDropdown(false), 200)}
                    className="block w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                    placeholder="Rechercher un chantier..."
                  />
                  
                  {showChantierDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {chantiers
                        .filter(c => !chantierSearchQuery || c.nom.toLowerCase().includes(chantierSearchQuery.toLowerCase()))
                        .slice(0, 50)
                        .map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedChantierId(c.id)
                              setChantierSearchQuery('')
                              setShowChantierDropdown(false)
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800 last:border-0 transition-colors"
                          >
                            <div className="font-medium text-gray-900 dark:text-zinc-100">{c.nom}</div>
                          </button>
                        ))}
                      {chantiers.filter(c => !chantierSearchQuery || c.nom.toLowerCase().includes(chantierSearchQuery.toLowerCase())).length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-zinc-400 text-center">
                          Aucun chantier trouvé.
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20 rounded-md">
                  <div>
                    <div className="text-sm font-medium text-blue-900 dark:text-blue-100">{selectedChantier?.nom}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedChantierId('')}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-bold"
                  >
                    Changer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200">Quantité</label>
            <input required name="quantite" type="number" min="1" defaultValue="1" className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-900 dark:text-zinc-50 font-bold">👤 Saisi par (OBLIGATOIRE)</label>
            <input required name="utilisateur" type="text" placeholder="Ton prénom" className="mt-1 block w-full rounded-md border-2 border-orange-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200">Observation</label>
          <textarea name="observation" rows={2} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 px-3 py-2 text-sm" placeholder="Optionnel..."></textarea>
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
