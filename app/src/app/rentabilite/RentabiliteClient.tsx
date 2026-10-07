'use client'

import { useState } from 'react'
import { Building2, Search, ArrowUpDown, ReceiptText, ChevronDown, ChevronUp, ExternalLink, Calendar } from 'lucide-react'

export function RentabiliteClient({ initialData }: { initialData: any[] }) {
  const [search, setSearch] = useState('')
  const [expandedChantier, setExpandedChantier] = useState<string | null>(null)

  const filteredData = initialData.filter(c => 
    c.nom.toLowerCase().includes(search.toLowerCase())
  )

  const grandTotal = filteredData.reduce((acc, c) => acc + c.totalAchats, 0)

  return (
    <div className="space-y-6">
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Total Chantiers</p>
              <h3 className="text-2xl font-bold">{filteredData.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Coût d'Achats Total</p>
              <h3 className="text-2xl font-bold">{grandTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de Recherche */}
      <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-2 rounded-2xl shadow-sm">
        <div className="pl-3 text-gray-400">
          <Search className="h-5 w-5" />
        </div>
        <input 
          type="text"
          placeholder="Rechercher un chantier..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
        />
      </div>

      {/* Liste des Chantiers */}
      <div className="space-y-4">
        {filteredData.map(chantier => (
          <div key={chantier.nom} className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            
            {/* Header / Summary */}
            <div 
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
              onClick={() => setExpandedChantier(expandedChantier === chantier.nom ? null : chantier.nom)}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-xl text-gray-600 dark:text-gray-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{chantier.nom}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1"><ReceiptText className="h-3 w-3" /> {chantier.nbLignes} articles</span>
                    {chantier.datePremierAchat && chantier.dateDernierAchat && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> 
                        {new Date(chantier.datePremierAchat).toLocaleDateString('fr-FR')} - {new Date(chantier.dateDernierAchat).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-500 mb-0.5">Total Achats</p>
                  <p className="text-xl font-black text-rose-600 dark:text-rose-500">
                    {chantier.totalAchats.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </p>
                </div>
                <div className="text-gray-400">
                  {expandedChantier === chantier.nom ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedChantier === chantier.nom && (
              <div className="border-t dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/30 p-5">
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Fournisseurs sollicités</p>
                  <div className="flex flex-wrap gap-2">
                    {chantier.fournisseurs.map((f: string) => (
                      <span key={f} className="px-2.5 py-1 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-zinc-950 uppercase border-b dark:border-zinc-800">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Fournisseur</th>
                        <th className="px-4 py-3">Article</th>
                        <th className="px-4 py-3 text-right">Qté</th>
                        <th className="px-4 py-3 text-right">P.U HT</th>
                        <th className="px-4 py-3 text-right">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-zinc-800">
                      {chantier.lignes.map((ligne: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                          <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                            {ligne.date ? new Date(ligne.date).toLocaleDateString('fr-FR') : '-'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">
                            {ligne.fournisseur}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{ligne.designation}</p>
                            <p className="text-xs font-mono text-gray-500">{ligne.reference}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400">
                            {ligne.quantite}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400">
                            {ligne.prixUnitaire.toFixed(2)} €
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                            {ligne.total.toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredData.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 border-dashed">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Aucun chantier trouvé</h3>
            <p className="text-gray-500 text-sm">Les chantiers apparaîtront ici une fois que des factures y seront imputées.</p>
          </div>
        )}
      </div>

    </div>
  )
}
