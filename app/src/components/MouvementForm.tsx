'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowRightLeft, Camera, Search, User, Check, X, Building, Package } from 'lucide-react'
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

    const trimmedCode = code.trim()
    const article = articles.find(a => a.codeBarre === trimmedCode)
    if (article) {
      setSelectedArticleId(article.id)
    } else {
      setScanError(`Aucun article trouvé pour le code-barres : ${code}`)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs overflow-hidden sticky top-6">
      <div className="p-4.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Nouveau Mouvement
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Enregistrement d'un flux de stock</p>
          </div>
        </div>

        <button 
          type="button" 
          onClick={() => setIsScanning(true)}
          className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Scanner</span>
        </button>
      </div>

      <form action={createMouvement} className="p-5 space-y-4 text-xs">
        {scanError && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0"></span>
            <span>{scanError}</span>
          </div>
        )}
        
        {/* Type de flux */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Type de mouvement *
          </label>
          <select 
            name="type" 
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#161d2d] focus:border-blue-500 font-medium transition-all cursor-pointer"
          >
            <option value="Depart">Départ vers Chantier</option>
            <option value="Retour">Retour au Dépôt</option>
            <option value="Achat">Achat / Entrée Magasin</option>
            <option value="Consomme">Consommé / Posé définitivement</option>
            <option value="Perte">Perdu / Cassé / Défectueux</option>
          </select>
        </div>

        {/* Sélection Article */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Article concerné *
          </label>
          <div className="relative">
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
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 250)}
                  className="block w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#161d2d] focus:border-blue-500 font-medium transition-all"
                  placeholder="Rechercher par référence, désignation..."
                />
                
                {showDropdown && (
                  <div className="absolute z-20 w-full mt-1.5 bg-white dark:bg-[#111622] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {articles
                      .filter(a => 
                        !searchQuery || 
                        a.designation.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (a.reference && a.reference.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .slice(0, 40)
                      .map(a => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setSelectedArticleId(a.id)
                            setSearchQuery('')
                            setShowDropdown(false)
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                        >
                          <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">{a.designation}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Réf : {a.reference || 'Aucune'}</div>
                        </button>
                      ))}
                    {articles.filter(a => !searchQuery || a.designation.toLowerCase().includes(searchQuery.toLowerCase()) || (a.reference && a.reference.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                      <div className="px-4 py-3 text-xs text-slate-400 text-center">
                        Aucun article correspondant.
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-950/40">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">{selectedArticle?.designation}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Réf: {selectedArticle?.reference || 'Aucune'}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedArticleId('')}
                  className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors cursor-pointer shrink-0 ml-2"
                >
                  Changer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sélection Chantier */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Chantier cible (ou Dépôt)
          </label>
          <div className="relative">
            <select 
              name="chantierId" 
              value={selectedChantierId}
              onChange={(e) => setSelectedChantierId(e.target.value)}
              className="absolute opacity-0 w-full h-full -z-10 pointer-events-none"
              tabIndex={-1}
            >
              <option value="">-- Aucun / Stock Magasin --</option>
              {chantiers.map(c => (
                <option key={c.id} value={c.id}>{c.id}</option>
              ))}
            </select>

            {!selectedChantierId ? (
              <>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={chantierSearchQuery}
                  onChange={(e) => {
                    setChantierSearchQuery(e.target.value)
                    setShowChantierDropdown(true)
                  }}
                  onFocus={() => setShowChantierDropdown(true)}
                  onBlur={() => setTimeout(() => setShowChantierDropdown(false), 250)}
                  className="block w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#161d2d] focus:border-blue-500 font-medium transition-all"
                  placeholder="Attribuer à un chantier (optionnel)..."
                />
                
                {showChantierDropdown && (
                  <div className="absolute z-20 w-full mt-1.5 bg-white dark:bg-[#111622] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {chantiers
                      .filter(c => !chantierSearchQuery || c.nom.toLowerCase().includes(chantierSearchQuery.toLowerCase()))
                      .slice(0, 30)
                      .map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedChantierId(c.id)
                            setChantierSearchQuery('')
                            setShowChantierDropdown(false)
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                        >
                          <div className="font-semibold text-slate-900 dark:text-white">{c.nom}</div>
                        </button>
                      ))}
                    {chantiers.filter(c => !chantierSearchQuery || c.nom.toLowerCase().includes(chantierSearchQuery.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-xs text-slate-400 text-center">
                        Aucun chantier trouvé.
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/40">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Building className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white truncate">{selectedChantier?.nom}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedChantierId('')}
                  className="px-2 py-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 transition-colors cursor-pointer shrink-0 ml-2"
                >
                  Changer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quantité & Saisi par */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Quantité *
            </label>
            <input 
              required 
              name="quantite" 
              type="number" 
              min="1" 
              defaultValue="1" 
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-bold text-center" 
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Auteur de la saisie *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input 
                required 
                name="utilisateur" 
                type="text" 
                placeholder="Votre prénom" 
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-blue-500" 
              />
            </div>
          </div>
        </div>

        {/* Observation */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Observation / Remarque
          </label>
          <textarea 
            name="observation" 
            rows={2} 
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-xs" 
            placeholder="Optionnel : motif du mouvement, bon de livraison..."
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Enregistrer le Mouvement</span>
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
