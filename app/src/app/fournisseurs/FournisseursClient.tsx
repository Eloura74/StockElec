'use client'

import { useState } from 'react'
import { Upload, Plus, Trash2, Mail, CheckCircle2, AlertTriangle, FileText, ArrowRight } from 'lucide-react'
import { saveFactureAndCheckPrices } from '@/app/actions/factures'
import { useRouter } from 'next/navigation'

export function FournisseursClient({ initialFactures }: { initialFactures: any[] }) {
  const router = useRouter()
  const [fournisseur, setFournisseur] = useState('Rexel')
  const [numeroFacture, setNumeroFacture] = useState('')
  const [lignes, setLignes] = useState<any[]>([])
  
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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

  const generateMailto = (ligne: any) => {
    const subject = encodeURIComponent(`Demande d'avoir - Facture ${numeroFacture || '[NUMÉRO]'}`)
    
    // Formater la date précédente si elle existe
    let datePrecedenteText = ""
    if (ligne.dateFacturePrecedente) {
      datePrecedenteText = ` le ${new Date(ligne.dateFacturePrecedente).toLocaleDateString()}`
    }
    const numPrecedentText = ligne.numeroFacturePrecedente ? ` (Facture ${ligne.numeroFacturePrecedente})` : ""

    const body = encodeURIComponent(
      `Bonjour,\n\n` +
      `Nous avons constaté une augmentation de prix non convenue sur la facture ${numeroFacture || '[NUMÉRO]'}.\n\n` +
      `Article concerné : ${ligne.designation} (Réf: ${ligne.reference})\n` +
      `Ancien prix unitaire payé${datePrecedenteText}${numPrecedentText} : ${ligne.prixUnitairePrecedent} €\n` +
      `Nouveau prix facturé : ${ligne.prixUnitaire} €\n` +
      `Quantité facturée : ${ligne.quantite}\n\n` +
      `Merci de bien vouloir nous établir un avoir pour la différence.\n\n` +
      `Cordialement,\nLa Comptabilité`
    )
    return `mailto:contact@${fournisseur.toLowerCase()}.fr?subject=${subject}&body=${body}`
  }

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
                  </td>
                  <td className="p-2">
                    <input type="text" value={ligne.designation} onChange={e => updateLigne(ligne.id, 'designation', e.target.value)} className="w-full p-2 border rounded" placeholder="Description" />
                  </td>
                  <td className="p-2">
                    <input type="number" value={ligne.quantite} onChange={e => updateLigne(ligne.id, 'quantite', parseInt(e.target.value) || 0)} className="w-full p-2 border rounded" min="1" />
                  </td>
                  <td className="p-2">
                    <input type="number" step="0.01" value={ligne.prixUnitaire} onChange={e => updateLigne(ligne.id, 'prixUnitaire', parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded" min="0" />
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
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Historique & Alertes</h2>
        </div>
        <div className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-950 border-b">
              <tr>
                <th className="p-4">Date & Facture</th>
                <th className="p-4">Article</th>
                <th className="p-4 text-right">Ancien Prix</th>
                <th className="p-4 text-right">Nouveau Prix</th>
                <th className="p-4 text-center">Statut</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialFactures.map(facture => (
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
                      {ligne.prixUnitairePrecedent ? `${ligne.prixUnitairePrecedent.toFixed(2)} €` : '-'}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {ligne.prixUnitaire.toFixed(2)} €
                    </td>
                    <td className="p-4 text-center">
                      {ligne.alerteHausse ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                          <AlertTriangle className="h-3 w-3" /> Hausse
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                          <CheckCircle2 className="h-3 w-3" /> OK
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {ligne.alerteHausse && (
                        <a 
                          href={generateMailto(ligne)}
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
      
    </div>
  )
}
