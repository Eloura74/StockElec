'use client'

import { useState } from 'react'
import { Upload, Plus, Trash2, Mail, CheckCircle2, AlertTriangle, FileText, ArrowRight, LineChart as ChartIcon, X } from 'lucide-react'
import { saveFactureAndCheckPrices, getPriceHistory } from '@/app/actions/factures'
import { createAlias } from '@/app/actions/alias'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function FournisseursClient({ initialFactures }: { initialFactures: any[] }) {
  const router = useRouter()
  const [fournisseur, setFournisseur] = useState('Rexel')
  const [numeroFacture, setNumeroFacture] = useState('')
  const [lignes, setLignes] = useState<any[]>([])
  
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Modale Graphique
  const [chartData, setChartData] = useState<any[]>([])
  const [isChartOpen, setIsChartOpen] = useState(false)
  const [chartRef, setChartRef] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/factures/parse', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.items && data.items.length > 0) {
        setLignes(prev => [...prev, ...data.items])
      } else {
        alert("Aucun article n'a pu être extrait automatiquement. Vous pouvez les ajouter manuellement.")
      }
    } catch (err) {
      alert("Erreur lors de l'extraction.")
    } finally {
      setIsUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const addLigne = () => {
    setLignes([...lignes, { id: Math.random().toString(), reference: '', designation: '', quantite: 1, prixUnitaire: 0 }])
  }

  const updateLigne = (id: string, field: string, value: any) => {
    setLignes(lignes.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  const removeLigne = (id: string) => {
    setLignes(lignes.filter(l => l.id !== id))
  }

  const handleSave = async () => {
    if (!numeroFacture) return alert("Veuillez saisir un numéro de facture")
    if (lignes.length === 0) return alert("Veuillez ajouter au moins une ligne")

    setIsSaving(true)
    
    // Traiter les alias
    for (const ligne of lignes) {
      if (ligne.originalReference && ligne.reference !== ligne.originalReference && ligne.saveAlias !== false) {
        await createAlias(fournisseur, ligne.originalReference, ligne.reference)
      }
    }

    const res = await saveFactureAndCheckPrices(fournisseur, numeroFacture, lignes)
    setIsSaving(false)

    if (res.success) {
      alert("Facture enregistrée et vérifiée avec succès !")
      setNumeroFacture('')
      setLignes([])
      router.refresh()
    } else {
      alert("Erreur : " + res.error)
    }
  }

  const generateMailto = (facture: any, ligne: any) => {
    const subject = encodeURIComponent(`Demande d'avoir - Facture ${facture.numeroFacture || '[NUMÉRO]'}`)
    
    // Formater la date précédente si elle existe
    let datePrecedenteText = ""
    if (ligne.dateFacturePrecedente) {
      datePrecedenteText = ` le ${new Date(ligne.dateFacturePrecedente).toLocaleDateString()}`
    }
    const numPrecedentText = ligne.numeroFacturePrecedente ? ` (Facture ${ligne.numeroFacturePrecedente})` : ""
    const fournisseurPrecedentText = ligne.fournisseurPrecedent ? ` chez ${ligne.fournisseurPrecedent}` : ""

    const diffUnitaire = ligne.prixUnitaire - ligne.prixUnitairePrecedent;
    const diffTotale = diffUnitaire * ligne.quantite;

    const body = encodeURIComponent(
      `Bonjour,\n\n` +
      `Nous avons constaté une anomalie de prix sur la facture ${facture.numeroFacture || '[NUMÉRO]'}.\n\n` +
      `Article concerné : ${ligne.designation} (Réf: ${ligne.reference})\n` +
      `Quantité facturée : ${ligne.quantite}\n\n` +
      `Prix historique enregistré${fournisseurPrecedentText}${datePrecedenteText}${numPrecedentText} : ${ligne.prixUnitairePrecedent.toFixed(2)} €\n` +
      `Nouveau prix facturé : ${ligne.prixUnitaire.toFixed(2)} €\n` +
      `Différence unitaire : +${diffUnitaire.toFixed(2)} €\n` +
      `Surcoût total pour cette ligne : +${diffTotale.toFixed(2)} €\n\n` +
      `Merci de bien vouloir vous aligner et nous établir un avoir de ${diffTotale.toFixed(2)} €.\n\n` +
      `Cordialement,\nLa Comptabilité`
    )
    return `mailto:contact@${facture.fournisseur.toLowerCase()}.fr?subject=${subject}&body=${body}`
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'hausse', 'baisse'

  const handleOpenChart = async (reference: string) => {
    setChartRef(reference)
    setIsChartOpen(true)
    const data = await getPriceHistory(reference)
    const formattedData = data.map((d: any) => ({
      date: new Date(d.facture.dateFacture).toLocaleDateString(),
      prix: d.prixUnitaire,
      fournisseur: d.facture.fournisseur
    }))
    setChartData(formattedData)
  }

  // Calcul des statistiques globales (sur les données non filtrées par la recherche)
  const totalFactures = initialFactures.length
  let totalLignesAnalysees = 0
  let totalAlertes = 0
  let totalBaisses = 0
  
  initialFactures.forEach(facture => {
    totalLignesAnalysees += facture.lignes.length
    facture.lignes.forEach((ligne: any) => {
      if (ligne.alerteHausse) totalAlertes++
      if (ligne.alerteBaisse) totalBaisses++
    })
  })

  const filteredFactures = initialFactures.map(facture => {
    let filteredLignes = facture.lignes

    // 1. Filtre sur les alertes
    if (filterType === 'hausse') {
      filteredLignes = filteredLignes.filter((ligne: any) => ligne.alerteHausse)
    } else if (filterType === 'baisse') {
      filteredLignes = filteredLignes.filter((ligne: any) => ligne.alerteBaisse)
    }

    // 2. Filtre de recherche textuelle
    if (searchQuery.trim() !== '') {
      filteredLignes = filteredLignes.filter((ligne: any) => 
        ligne.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ligne.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facture.fournisseur.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return { ...facture, lignes: filteredLignes }
  }).filter(facture => facture.lignes.length > 0)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* SECTION SAISIE / IMPORT */}
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          Nouvelle Facture
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1">Fournisseur</label>
            <select 
              value={fournisseur} 
              onChange={e => setFournisseur(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-4 py-2"
            >
              <option>Rexel</option>
              <option>Sonepar</option>
              <option>Yesse elec</option>
              <option>Balitran</option>
              <option>Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">N° Facture</label>
            <input 
              type="text" 
              value={numeroFacture}
              onChange={e => setNumeroFacture(e.target.value)}
              placeholder="Ex: FA-2026-08"
              className="w-full rounded-lg border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Import PDF Rapide</label>
            <div className="relative">
              <input 
                type="file" 
                accept="application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 px-4 py-2 hover:bg-blue-100 transition-colors">
                <Upload className="h-5 w-5" />
                <span className="font-medium">{isUploading ? 'Analyse...' : 'Glisser un PDF ici'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden mb-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-950 border-b">
              <tr>
                <th className="p-3">Référence</th>
                <th className="p-3">Désignation</th>
                <th className="p-3 w-24">Qté</th>
                <th className="p-3 w-32">Prix U. (€)</th>
                <th className="p-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map(ligne => (
                <tr key={ligne.id} className="border-b last:border-0">
                  <td className="p-2">
                    <input type="text" value={ligne.reference} onChange={e => updateLigne(ligne.id, 'reference', e.target.value)} className="w-full p-2 border rounded" placeholder="Réf" />
                    {ligne.originalReference && ligne.reference !== ligne.originalReference && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                        <input type="checkbox" checked={ligne.saveAlias !== false} onChange={e => updateLigne(ligne.id, 'saveAlias', e.target.checked)} />
                        <label>Créer alias {ligne.originalReference} &rarr; {ligne.reference}</label>
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    <input type="text" value={ligne.designation} onChange={e => updateLigne(ligne.id, 'designation', e.target.value)} className="w-full p-2 border rounded" placeholder="Description" />
                  </td>
                  <td className="p-2">
                    <input type="number" value={ligne.quantite} onChange={e => updateLigne(ligne.id, 'quantite', parseInt(e.target.value) || 0)} className="w-full p-2 border rounded" min="1" />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={ligne.prixUnitaire} 
                      onChange={e => {
                        const val = e.target.value.replace(',', '.');
                        updateLigne(ligne.id, 'prixUnitaire', val);
                      }}
                      onBlur={e => {
                        const val = parseFloat(String(e.target.value).replace(',', '.')) || 0;
                        updateLigne(ligne.id, 'prixUnitaire', val);
                      }}
                      className="w-full p-2 border rounded" 
                      placeholder="0.00" 
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => removeLigne(ligne.id)} className="text-red-500 hover:text-red-700 p-2">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {lignes.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Aucune ligne. Importez un PDF ou ajoutez manuellement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between">
          <button onClick={addLigne} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium px-4 py-2">
            <Plus className="h-4 w-4" /> Ajouter une ligne
          </button>
          
          <button 
            onClick={handleSave} 
            disabled={isSaving || lignes.length === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer & Vérifier'}
          </button>
        </div>
      </div>

      {/* SECTION HISTORIQUE ET ALERTES */}
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        
        {/* STATISTIQUES */}
        <div className="grid grid-cols-3 divide-x dark:divide-zinc-800 border-b dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/50">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold">{totalFactures}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Factures</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalLignesAnalysees}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Lignes vérifiées</div>
          </div>
          <div className="p-4 text-center">
            <div className={`text-2xl font-bold ${totalAlertes > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalAlertes}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Alertes Hausse</div>
          </div>
        </div>

        {/* HEADER & FILTRES */}
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Historique</h2>
          
          <div className="flex items-center gap-4">
            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="rounded-lg border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-4 py-2 text-sm"
            >
              <option value="all">Toutes les lignes</option>
              <option value="hausse">Uniquement les Hausses</option>
              <option value="baisse">Uniquement les Baisses</option>
            </select>
            
            <input 
              type="text"
              placeholder="Rechercher Réf, Fournisseur..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full md:w-64 rounded-lg border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-4 py-2 text-sm"
            />
          </div>
        </div>
        <div className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-950 border-b">
              <tr>
                <th className="p-4">Date & Facture</th>
                <th className="p-4">Article</th>
                <th className="p-4 text-right">Meilleur Prix Historique</th>
                <th className="p-4 text-right">Nouveau Prix</th>
                <th className="p-4 text-center">Statut</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredFactures.map(facture => (
                facture.lignes.map((ligne: any) => (
                  <tr key={ligne.id} className={ligne.alerteHausse ? "bg-red-50/50 dark:bg-red-900/10" : ""}>
                    <td className="p-4">
                      <div className="font-medium">{facture.fournisseur}</div>
                      <div className="text-xs text-gray-500">{facture.numeroFacture} - {new Date(facture.dateFacture).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{ligne.reference}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">{ligne.designation}</div>
                    </td>
                    <td className="p-4 text-right text-gray-500">
                      {ligne.prixUnitairePrecedent ? (
                        <div>
                          <div>{ligne.prixUnitairePrecedent.toFixed(2)} €</div>
                          {ligne.fournisseurPrecedent && (
                            <div className="text-xs text-gray-400">({ligne.fournisseurPrecedent})</div>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {ligne.prixUnitaire.toFixed(2)} €
                    </td>
                    <td className="p-4 text-center">
                      {ligne.alerteHausse ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                          <AlertTriangle className="h-3 w-3" /> Hausse
                        </span>
                      ) : ligne.alerteBaisse ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                          <ArrowRight className="h-3 w-3 rotate-90" /> Baisse
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                          <CheckCircle2 className="h-3 w-3" /> OK
                        </span>
                      )}
                    </td>
                    <td className="p-4 flex gap-2 items-center">
                      <button 
                        onClick={() => handleOpenChart(ligne.reference)} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors text-xs font-medium" 
                        title="Voir l'évolution du prix"
                      >
                        <ChartIcon className="h-4 w-4" /> Graphique
                      </button>
                      {ligne.alerteHausse && (
                        <a 
                          href={generateMailto(facture, ligne)}
                          className="inline-flex items-center gap-2 text-xs font-medium bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors"
                        >
                          <Mail className="h-3 w-3" /> Demander Avoir
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              ))}
              {initialFactures.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Aucun historique de factures.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL GRAPHIQUE */}
      {isChartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-6 w-full max-w-2xl shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Évolution du prix : {chartRef}</h3>
              <button onClick={() => setIsChartOpen(false)} className="text-gray-500 hover:text-gray-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis dataKey="prix" fontSize={12} unit="€" />
                    <Tooltip 
                      formatter={(value: any) => [`${value} €`, 'Prix']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line type="monotone" dataKey="prix" stroke="#2563eb" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  Chargement des données...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}
