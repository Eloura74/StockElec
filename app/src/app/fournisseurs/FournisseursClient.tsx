'use client'

import { useState } from 'react'
import { 
  Upload, Plus, Trash2, Mail, CheckCircle2, AlertTriangle, FileText, 
  ArrowRight, LineChart as ChartIcon, X, Download, MailCheck, RefreshCw, 
  Copy, ExternalLink, Check, DollarSign, Calendar, Building2, ChevronDown
} from 'lucide-react'
import { saveFactureAndCheckPrices, getPriceHistory, updateStatutAvoir } from '@/app/actions/factures'
import { createAlias } from '@/app/actions/alias'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'

export function FournisseursClient({ initialFactures }: { initialFactures: any[] }) {
  const router = useRouter()
  const [fournisseur, setFournisseur] = useState('Rexel')
  const [numeroFacture, setNumeroFacture] = useState('')
  const [dateFacture, setDateFacture] = useState('')
  const [totalHT, setTotalHT] = useState<number | ''>('')
  const [totalTVA, setTotalTVA] = useState<number | ''>('')
  const [totalTTC, setTotalTTC] = useState<number | ''>('')
  const [dateEcheance, setDateEcheance] = useState('')
  const [modePaiement, setModePaiement] = useState('')

  const [lignes, setLignes] = useState<any[]>([])
  
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [updatingLigneId, setUpdatingLigneId] = useState<string | null>(null)

  // Modale Graphique
  const [isChartOpen, setIsChartOpen] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [chartRef, setChartRef] = useState('')
  const [isSyncingEmail, setIsSyncingEmail] = useState(false)

  // Modale Email
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
    to: string;
    subject: string;
    body: string;
    copied: boolean;
  }>({
    isOpen: false,
    to: '',
    subject: '',
    body: '',
    copied: false
  })

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
        if (data.numeroFacture) setNumeroFacture(data.numeroFacture)
        if (data.totalHT !== undefined && data.totalHT !== null) setTotalHT(data.totalHT)
        if (data.totalTVA !== undefined && data.totalTVA !== null) setTotalTVA(data.totalTVA)
        if (data.totalTTC !== undefined && data.totalTTC !== null) setTotalTTC(data.totalTTC)
        if (data.dateEcheance) setDateEcheance(data.dateEcheance)
        if (data.dateFacture) setDateFacture(data.dateFacture)
        if (data.modePaiement) setModePaiement(data.modePaiement)

        if (data.fournisseur) {
          const fUpper = data.fournisseur.toUpperCase()
          if (fUpper.includes('YESSS') || fUpper.includes('YESSE')) {
            setFournisseur('Yesse elec')
          } else if (fUpper.includes('REXEL')) {
            setFournisseur('Rexel')
          } else if (fUpper.includes('SONEPAR')) {
            setFournisseur('Sonepar')
          } else if (fUpper.includes('BALITRAN')) {
            setFournisseur('Balitran')
          } else {
            setFournisseur('Autre')
          }
        }
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
    setLignes([...lignes, { 
      id: Math.random().toString(), 
      reference: '', 
      designation: '', 
      quantite: 1, 
      prixUnitaire: 0,
      chantier: 'STOCK'
    }])
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

    const res = await saveFactureAndCheckPrices(fournisseur, numeroFacture, lignes, {
      totalHT: totalHT !== '' ? Number(totalHT) : null,
      totalTVA: totalTVA !== '' ? Number(totalTVA) : null,
      totalTTC: totalTTC !== '' ? Number(totalTTC) : null,
      dateEcheance: dateEcheance || null,
      modePaiement: modePaiement || null,
      dateFacture: dateFacture || null
    })
    
    setIsSaving(false)

    if (res.success) {
      alert("Facture enregistrée et vérifiée avec succès !")
      setNumeroFacture('')
      setDateFacture('')
      setTotalHT('')
      setTotalTVA('')
      setTotalTTC('')
      setDateEcheance('')
      setModePaiement('')
      setLignes([])
      router.refresh()
    } else {
      alert("Erreur : " + res.error)
    }
  }

  const handleUpdateStatutAvoir = async (ligneId: string, nouveauStatut: string) => {
    setUpdatingLigneId(ligneId)
    let numeroAvoir: string | null = null
    let montantAvoir: number | null = null

    if (nouveauStatut === 'AVOIR_RECU') {
      const num = window.prompt("Numéro de l'avoir reçu du fournisseur (optionnel) :")
      if (num) numeroAvoir = num
      const mntStr = window.prompt("Montant exact de l'avoir reçu (€) :")
      if (mntStr) montantAvoir = parseFloat(mntStr.replace(',', '.')) || null
    }

    await updateStatutAvoir(ligneId, nouveauStatut, numeroAvoir, montantAvoir)
    setUpdatingLigneId(null)
    router.refresh()
  }

  const openEmailModalForLigne = (facture: any, ligne: any) => {
    const subject = `Demande d'avoir - Facture ${facture.numeroFacture || '[NUMÉRO]'}`
    
    let datePrecedenteText = ""
    if (ligne.dateFacturePrecedente) {
      datePrecedenteText = ` le ${new Date(ligne.dateFacturePrecedente).toLocaleDateString()}`
    }
    const numPrecedentText = ligne.numeroFacturePrecedente ? ` (Facture ${ligne.numeroFacturePrecedente})` : ""
    const fournisseurPrecedentText = ligne.fournisseurPrecedent ? ` chez ${ligne.fournisseurPrecedent}` : ""

    const diffUnitaire = ligne.prixUnitaire - (ligne.prixUnitairePrecedent || 0)
    const diffTotale = diffUnitaire * (ligne.quantite || 1)
    const chantierMention = ligne.chantier && ligne.chantier !== 'STOCK' ? `\nChantier / Réf client : ${ligne.chantier}` : ''

    const body = 
      `Bonjour,\n\n` +
      `Nous avons constaté une anomalie de prix sur la facture ${facture.numeroFacture || '[NUMÉRO]'}.${chantierMention}\n\n` +
      `Article concerné : ${ligne.designation} (Réf: ${ligne.reference})\n` +
      `Quantité facturée : ${ligne.quantite}\n\n` +
      `Prix historique enregistré${fournisseurPrecedentText}${datePrecedenteText}${numPrecedentText} : ${(ligne.prixUnitairePrecedent || 0).toFixed(2)} €\n` +
      `Nouveau prix facturé : ${ligne.prixUnitaire.toFixed(2)} €\n` +
      `Différence unitaire : +${diffUnitaire.toFixed(2)} €\n` +
      `Surcoût total pour cette ligne : +${diffTotale.toFixed(2)} €\n\n` +
      `Merci de bien vouloir vous aligner et nous établir un avoir de ${diffTotale.toFixed(2)} €.\n\n` +
      `Cordialement,\nLa Comptabilité`

    const to = `contact@${facture.fournisseur.toLowerCase().replace(/\s+/g, '')}.fr`
    setEmailModal({
      isOpen: true,
      to,
      subject,
      body,
      copied: false
    })
  }

  const openEmailModalForGlobal = (facture: any) => {
    const lignesEnHausse = facture.lignes.filter((l: any) => l.alerteHausse)
    if (lignesEnHausse.length === 0) return

    const subject = `Demande d'avoir global - Facture ${facture.numeroFacture || '[NUMÉRO]'}`
    
    let totalAvoir = 0
    let listeArticles = ''

    lignesEnHausse.forEach((ligne: any) => {
      const diffUnitaire = ligne.prixUnitaire - (ligne.prixUnitairePrecedent || 0)
      const diffTotale = diffUnitaire * (ligne.quantite || 1)
      totalAvoir += diffTotale

      const chText = ligne.chantier && ligne.chantier !== 'STOCK' ? ` [Chantier: ${ligne.chantier}]` : ''
      listeArticles += `- ${ligne.designation} (Réf: ${ligne.reference})${chText} x${ligne.quantite}\n`
      listeArticles += `  Ancien prix : ${(ligne.prixUnitairePrecedent || 0).toFixed(2)} € -> Nouveau prix : ${ligne.prixUnitaire.toFixed(2)} € (Surcoût: +${diffTotale.toFixed(2)} €)\n\n`
    })

    const body = 
      `Bonjour,\n\n` +
      `Nous avons constaté plusieurs anomalies de prix sur la facture ${facture.numeroFacture || '[NUMÉRO]'}.\n\n` +
      `Voici le détail des écarts constatés par rapport à nos prix historiques :\n\n` +
      listeArticles +
      `Merci de bien vouloir vous aligner et nous établir un avoir global de ${totalAvoir.toFixed(2)} € pour cette facture.\n\n` +
      `Cordialement,\nLa Comptabilité`

    const to = `contact@${facture.fournisseur.toLowerCase().replace(/\s+/g, '')}.fr`
    setEmailModal({
      isOpen: true,
      to,
      subject,
      body,
      copied: false
    })
  }

  const exportExcelComptable = () => {
    const rows: any[] = []

    filteredFactures.forEach(facture => {
      const dateFact = new Date(facture.dateFacture).toLocaleDateString("fr-FR")
      const dateEch = facture.dateEcheance ? new Date(facture.dateEcheance).toLocaleDateString("fr-FR") : ''

      facture.lignes.forEach((ligne: any) => {
        const totalLigneHT = (ligne.quantite * ligne.prixUnitaire)
        const ecartUnitaire = ligne.prixUnitairePrecedent ? (ligne.prixUnitaire - ligne.prixUnitairePrecedent) : 0
        const surcoutTotal = ligne.alerteHausse ? (ecartUnitaire * ligne.quantite) : 0

        rows.push({
          "Date Facture": dateFact,
          "Fournisseur": facture.fournisseur,
          "N° Facture": facture.numeroFacture,
          "Date Échéance": dateEch,
          "Mode Règlement": facture.modePaiement || '',
          "Chantier / Réf Client": ligne.chantier || 'STOCK',
          "Référence": ligne.reference,
          "Désignation": ligne.designation,
          "Quantité": ligne.quantite,
          "Prix Unitaire Net HT (€)": ligne.prixUnitaire,
          "Total Ligne HT (€)": Number(totalLigneHT.toFixed(2)),
          "Meilleur Prix Hist. (€)": ligne.prixUnitairePrecedent || '',
          "Écart (€)": Number(ecartUnitaire.toFixed(2)),
          "Surcoût Hausse (€)": Number(surcoutTotal.toFixed(2)),
          "Statut Comparatif": ligne.alerteHausse ? 'HAUSSE' : ligne.alerteBaisse ? 'BAISSE' : 'CONFORME',
          "Statut Avoir": ligne.statutAvoir || (ligne.alerteHausse ? 'A_RECLAMER' : 'N/A'),
          "N° Avoir Reçu": ligne.numeroAvoir || '',
          "Montant Avoir Reçu (€)": ligne.montantAvoir || '',
          "Total Facture HT (€)": facture.totalHT || '',
          "Total Facture TTC (€)": facture.totalTTC || ''
        })
      })
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Achats & Contrôle Prix")
    
    const today = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `Export_Comptable_Factures_${today}.xlsx`)
  }

  const handleSyncEmail = async () => {
    setIsSyncingEmail(true)
    try {
      const response = await fetch('/api/cron/fetch-emails')
      const data = await response.json()
      
      if (response.ok) {
        alert(`Synchronisation réussie. ${data.processed || 0} nouvelle(s) facture(s) importée(s).`)
        router.refresh()
      } else {
        alert("Erreur lors de la synchronisation : " + (data.error || "inconnue"))
      }
    } catch (error) {
      alert("Erreur lors de l'appel au serveur.")
    } finally {
      setIsSyncingEmail(false)
    }
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'hausse', 'baisse', 'avoir_recu'

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

  // Calcul des statistiques globales
  const totalFactures = initialFactures.length
  let totalLignesAnalysees = 0
  let totalAlertes = 0
  let totalBaisses = 0
  let totalAvoirsRecuperes = 0
  let totalSurcoutHausses = 0
  
  initialFactures.forEach(facture => {
    totalLignesAnalysees += facture.lignes.length
    facture.lignes.forEach((ligne: any) => {
      if (ligne.alerteHausse) {
        totalAlertes++
        if (ligne.prixUnitairePrecedent) {
          totalSurcoutHausses += (ligne.prixUnitaire - ligne.prixUnitairePrecedent) * ligne.quantite
        }
      }
      if (ligne.alerteBaisse) totalBaisses++
      if (ligne.statutAvoir === 'AVOIR_RECU' && ligne.montantAvoir) {
        totalAvoirsRecuperes += ligne.montantAvoir
      }
    })
  })

  const filteredFactures = initialFactures.map(facture => {
    let filteredLignes = facture.lignes

    if (filterType === 'hausse') {
      filteredLignes = filteredLignes.filter((ligne: any) => ligne.alerteHausse)
    } else if (filterType === 'baisse') {
      filteredLignes = filteredLignes.filter((ligne: any) => ligne.alerteBaisse)
    } else if (filterType === 'avoir_recu') {
      filteredLignes = filteredLignes.filter((ligne: any) => ligne.statutAvoir === 'AVOIR_RECU')
    }

    if (searchQuery.trim() !== '') {
      filteredLignes = filteredLignes.filter((ligne: any) => 
        ligne.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ligne.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ligne.chantier && ligne.chantier.toLowerCase().includes(searchQuery.toLowerCase())) ||
        facture.fournisseur.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return { ...facture, lignes: filteredLignes }
  }).filter(facture => facture.lignes.length > 0)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* SECTION SAISIE / IMPORT */}
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Nouvelle Facture Fournisseur
            </h2>
            <p className="text-xs text-gray-500 mt-1">Glissez le PDF pour extraire automatiquement les montants, lignes et chantiers imputés.</p>
          </div>

          <button
            onClick={handleSyncEmail}
            disabled={isSyncingEmail}
            className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncingEmail ? 'animate-spin' : ''}`} />
            {isSyncingEmail ? 'Synchronisation...' : 'Boîte Mail Auto'}
          </button>
        </div>
        
        {/* EN-TÊTE PRINCIPAL */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Fournisseur</label>
            <select 
              value={fournisseur} 
              onChange={e => setFournisseur(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm"
            >
              <option>Rexel</option>
              <option>Sonepar</option>
              <option>Yesse elec</option>
              <option>Balitran</option>
              <option>Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">N° Facture</label>
            <input 
              type="text" 
              value={numeroFacture}
              onChange={e => setNumeroFacture(e.target.value)}
              placeholder="Ex: 061-007-000233"
              className="w-full rounded-lg border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Date Facture</label>
            <input 
              type="text" 
              value={dateFacture}
              onChange={e => setDateFacture(e.target.value)}
              placeholder="JJ/MM/AAAA"
              className="w-full rounded-lg border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Import PDF Rapide (IA)</label>
            <div className="relative">
              <input 
                type="file" 
                accept="application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 px-3 py-2 hover:bg-blue-100 transition-colors text-sm">
                <Upload className="h-4 w-4" />
                <span className="font-medium">{isUploading ? 'Lecture IA...' : 'Glisser un PDF'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* DONNÉES FINANCIÈRES & COMPTABLES */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 mb-6 rounded-xl bg-gray-50 dark:bg-zinc-950/50 border dark:border-zinc-800 text-xs">
          <div>
            <span className="text-gray-500 block mb-1">Total HT (€)</span>
            <input 
              type="number"
              step="0.01"
              value={totalHT}
              onChange={e => setTotalHT(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="0.00"
              className="w-full p-1.5 rounded border dark:border-zinc-700 dark:bg-zinc-900 font-semibold"
            />
          </div>
          <div>
            <span className="text-gray-500 block mb-1">Total TVA (€)</span>
            <input 
              type="number"
              step="0.01"
              value={totalTVA}
              onChange={e => setTotalTVA(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="0.00"
              className="w-full p-1.5 rounded border dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <span className="text-gray-500 block mb-1">Total TTC (€)</span>
            <input 
              type="number"
              step="0.01"
              value={totalTTC}
              onChange={e => setTotalTTC(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="0.00"
              className="w-full p-1.5 rounded border dark:border-zinc-700 dark:bg-zinc-900 font-bold text-blue-600"
            />
          </div>
          <div>
            <span className="text-gray-500 block mb-1">Date Échéance</span>
            <input 
              type="text"
              value={dateEcheance}
              onChange={e => setDateEcheance(e.target.value)}
              placeholder="JJ/MM/AAAA"
              className="w-full p-1.5 rounded border dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <span className="text-gray-500 block mb-1">Mode Règlement</span>
            <input 
              type="text"
              value={modePaiement}
              onChange={e => setModePaiement(e.target.value)}
              placeholder="Ex: LCR 30j FDM"
              className="w-full p-1.5 rounded border dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>

        {/* TABLEAU DES LIGNES */}
        <div className="border rounded-lg overflow-x-auto mb-6">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-gray-50 dark:bg-zinc-950 border-b text-xs text-gray-500">
              <tr>
                <th className="p-3 w-40">Chantier / Réf</th>
                <th className="p-3 w-36">Référence</th>
                <th className="p-3">Désignation</th>
                <th className="p-3 w-20">Qté</th>
                <th className="p-3 w-28">Prix U. Net (€)</th>
                <th className="p-3 w-28 text-right">Total HT</th>
                <th className="p-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map(ligne => {
                const totalLigne = ((Number(ligne.quantite) || 0) * (Number(ligne.prixUnitaire) || 0)).toFixed(2)
                return (
                  <tr key={ligne.id} className="border-b last:border-0 text-xs">
                    <td className="p-2">
                      <input 
                        type="text" 
                        value={ligne.chantier || 'STOCK'} 
                        onChange={e => updateLigne(ligne.id, 'chantier', e.target.value)} 
                        className="w-full p-1.5 border rounded dark:border-zinc-700 dark:bg-zinc-950 font-medium" 
                        placeholder="STOCK / Chantier" 
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="text" 
                        value={ligne.reference} 
                        onChange={e => updateLigne(ligne.id, 'reference', e.target.value)} 
                        className="w-full p-1.5 border rounded dark:border-zinc-700 dark:bg-zinc-950 font-mono" 
                        placeholder="Réf" 
                      />
                      {ligne.originalReference && ligne.reference !== ligne.originalReference && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-600">
                          <input type="checkbox" checked={ligne.saveAlias !== false} onChange={e => updateLigne(ligne.id, 'saveAlias', e.target.checked)} />
                          <label>Alias {ligne.originalReference} &rarr; {ligne.reference}</label>
                        </div>
                      )}
                    </td>
                    <td className="p-2">
                      <input 
                        type="text" 
                        value={ligne.designation} 
                        onChange={e => updateLigne(ligne.id, 'designation', e.target.value)} 
                        className="w-full p-1.5 border rounded dark:border-zinc-700 dark:bg-zinc-950" 
                        placeholder="Description" 
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        value={ligne.quantite} 
                        onChange={e => updateLigne(ligne.id, 'quantite', parseInt(e.target.value) || 0)} 
                        className="w-full p-1.5 border rounded dark:border-zinc-700 dark:bg-zinc-950 text-center" 
                        min="1" 
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="text" 
                        value={ligne.prixUnitaire} 
                        onChange={e => {
                          const val = e.target.value.replace(',', '.')
                          updateLigne(ligne.id, 'prixUnitaire', val)
                        }}
                        onBlur={e => {
                          const val = parseFloat(String(e.target.value).replace(',', '.')) || 0
                          updateLigne(ligne.id, 'prixUnitaire', val)
                        }}
                        className="w-full p-1.5 border rounded dark:border-zinc-700 dark:bg-zinc-950 font-semibold" 
                        placeholder="0.00" 
                      />
                    </td>
                    <td className="p-2 text-right font-mono font-medium text-gray-700 dark:text-gray-300">
                      {totalLigne} €
                    </td>
                    <td className="p-2 text-center">
                      <button onClick={() => removeLigne(ligne.id)} className="text-red-500 hover:text-red-700 p-1.5">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {lignes.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Aucune ligne. Glissez un PDF ci-dessus ou ajoutez manuellement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <button onClick={addLigne} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm">
            <Plus className="h-4 w-4" /> Ajouter une ligne manuelle
          </button>
          
          <button 
            onClick={handleSave} 
            disabled={isSaving || lignes.length === 0}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 shadow-sm"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer & Contrôler les Prix'}
          </button>
        </div>
      </div>

      {/* SECTION HISTORIQUE, RECHERCHE ET SUIVI COMPTABLE */}
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        
        {/* STATISTIQUES GLOBALES */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 dark:divide-zinc-800 border-b dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/50">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold">{totalFactures}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Factures Saisies</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalLignesAnalysees}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Articles Contrôlés</div>
          </div>
          <div className="p-4 text-center">
            <div className={`text-2xl font-bold ${totalAlertes > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalAlertes}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              Hausses ({totalSurcoutHausses.toFixed(2)} €)
            </div>
          </div>
          <div className="p-4 text-center bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="text-2xl font-bold text-emerald-600">
              {totalAvoirsRecuperes.toFixed(2)} €
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">
              Avoirs Récupérés
            </div>
          </div>
        </div>

        {/* HEADER & FILTRES */}
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Historique & Contrôle Comptable</h2>
            <p className="text-xs text-gray-500 mt-0.5">Suivez l'état des demandes d'avoirs et ventilez par chantier.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={exportExcelComptable}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
              title="Exporter au format Excel avec toutes les colonnes comptables"
            >
              <Download className="h-4 w-4" /> Export Comptable (Excel)
            </button>

            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="rounded-lg border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm"
            >
              <option value="all">Toutes les lignes</option>
              <option value="hausse">Hausses détectées</option>
              <option value="baisse">Baisses de prix</option>
              <option value="avoir_recu">Avoirs Validés (€)</option>
            </select>
            
            <input 
              type="text"
              placeholder="Rechercher Réf, Chantier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full md:w-64 rounded-lg border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* TABLEAU HISTORIQUE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-gray-50 dark:bg-zinc-950 border-b text-xs text-gray-500">
              <tr>
                <th className="p-4">Facture & Échéance</th>
                <th className="p-4">Chantier / Réf</th>
                <th className="p-4">Article</th>
                <th className="p-4 text-right">Meilleur Prix Hist.</th>
                <th className="p-4 text-right">Prix Facturé</th>
                <th className="p-4 text-center">Statut Prix</th>
                <th className="p-4">Suivi Avoir</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {filteredFactures.map(facture => {
                const aDesHausses = facture.lignes.some((l: any) => l.alerteHausse)
                return facture.lignes.map((ligne: any, index: number) => {
                  const surcout = ligne.alerteHausse && ligne.prixUnitairePrecedent 
                    ? ((ligne.prixUnitaire - ligne.prixUnitairePrecedent) * ligne.quantite).toFixed(2)
                    : null

                  return (
                    <tr key={ligne.id} className={ligne.alerteHausse ? "bg-red-50/40 dark:bg-red-900/10" : ""}>
                      <td className="p-4 align-top">
                        {index === 0 ? (
                          <>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{facture.fournisseur}</div>
                            <div className="text-[11px] text-gray-500 mb-1">
                              {facture.numeroFacture} - {new Date(facture.dateFacture).toLocaleDateString("fr-FR")}
                            </div>
                            {facture.totalTTC && (
                              <div className="text-[10px] text-gray-400">
                                Total: {facture.totalTTC.toFixed(2)} € TTC {facture.dateEcheance ? `(Éch: ${new Date(facture.dateEcheance).toLocaleDateString("fr-FR")})` : ''}
                              </div>
                            )}
                            {aDesHausses && (
                              <button
                                onClick={() => openEmailModalForGlobal(facture)}
                                className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold bg-zinc-800 dark:bg-zinc-200 text-white dark:text-black px-2.5 py-1 rounded-md hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors shadow-xs"
                                title="Générer un e-mail récapitulant tous les avoirs de cette facture"
                              >
                                <MailCheck className="h-3 w-3" /> Avoir Global
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-gray-400 opacity-40 ml-2">↳</div>
                        )}
                      </td>

                      <td className="p-4 align-top font-medium text-blue-700 dark:text-blue-400">
                        <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded text-[11px]">
                          <Building2 className="h-3 w-3" />
                          {ligne.chantier || 'STOCK'}
                        </span>
                      </td>

                      <td className="p-4 align-top">
                        <div className="font-mono font-semibold">{ligne.reference}</div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[220px]">{ligne.designation}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Quantité : {ligne.quantite}</div>
                      </td>

                      <td className="p-4 align-top text-right text-gray-500">
                        {ligne.prixUnitairePrecedent ? (
                          <div>
                            <div className="font-mono font-semibold">{ligne.prixUnitairePrecedent.toFixed(2)} €</div>
                            {ligne.fournisseurPrecedent && (
                              <div className="text-[10px] text-gray-400">({ligne.fournisseurPrecedent})</div>
                            )}
                          </div>
                        ) : '-'}
                      </td>

                      <td className="p-4 align-top text-right font-mono font-bold">
                        {ligne.prixUnitaire.toFixed(2)} €
                        {surcout && (
                          <div className="text-[10px] text-red-600 font-semibold mt-0.5">
                            +{surcout} €
                          </div>
                        )}
                      </td>

                      <td className="p-4 align-top text-center">
                        {ligne.alerteHausse ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                            <AlertTriangle className="h-3 w-3" /> Hausse
                          </span>
                        ) : ligne.alerteBaisse ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                            <ArrowRight className="h-3 w-3 rotate-90" /> Baisse
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                            <CheckCircle2 className="h-3 w-3" /> OK
                          </span>
                        )}
                      </td>

                      {/* SUIVI COMPTABLE DE L'AVOIR */}
                      <td className="p-4 align-top">
                        {ligne.alerteHausse ? (
                          <div className="space-y-1">
                            <select
                              value={ligne.statutAvoir || 'A_RECLAMER'}
                              disabled={updatingLigneId === ligne.id}
                              onChange={e => handleUpdateStatutAvoir(ligne.id, e.target.value)}
                              className={`text-[11px] font-semibold rounded px-2 py-1 border transition-colors cursor-pointer ${
                                ligne.statutAvoir === 'AVOIR_RECU'
                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                                  : ligne.statutAvoir === 'DEMANDE_ENVOYEE'
                                  ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                                  : ligne.statutAvoir === 'REFUSE'
                                  ? 'bg-gray-100 border-gray-300 text-gray-600'
                                  : 'bg-red-100 border-red-300 text-red-800'
                              }`}
                            >
                              <option value="A_RECLAMER">⏳ À réclamer</option>
                              <option value="DEMANDE_ENVOYEE">📤 E-mail envoyé</option>
                              <option value="AVOIR_RECU">✅ Avoir reçu</option>
                              <option value="REFUSE">❌ Refusé / Justifié</option>
                            </select>

                            {ligne.statutAvoir === 'AVOIR_RECU' && (
                              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                                {ligne.numeroAvoir ? `N° ${ligne.numeroAvoir}` : 'Validé'} 
                                {ligne.montantAvoir ? ` (+${ligne.montantAvoir.toFixed(2)} €)` : ''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="p-4 align-top text-right space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => handleOpenChart(ligne.reference)} 
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors text-[11px] font-medium" 
                          title="Historique des prix"
                        >
                          <ChartIcon className="h-3.5 w-3.5" /> Graph
                        </button>
                        {ligne.alerteHausse && (
                          <button 
                            onClick={() => openEmailModalForLigne(facture, ligne)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-600 text-white px-2.5 py-1 rounded hover:bg-red-700 transition-colors shadow-xs"
                          >
                            <Mail className="h-3.5 w-3.5" /> Réclamer
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              })}
              {initialFactures.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Aucun historique de factures disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL GRAPHIQUE */}
      {isChartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold">Évolution du prix : {chartRef}</h3>
                <p className="text-xs text-gray-500">Historique des achats constatés tous fournisseurs confondus</p>
              </div>
              <button onClick={() => setIsChartOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
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
                    <Line type="monotone" dataKey="prix" stroke="#2563eb" strokeWidth={2.5} activeDot={{ r: 8 }} />
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

      {/* MODALE RECLAMATION EMAIL */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Demande d'avoir prête à envoyer</h3>
                  <p className="text-xs text-gray-500">Choisissez votre méthode d'envoi ou copiez le texte</p>
                </div>
              </div>
              <button 
                onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Destinataire</label>
                <input 
                  type="text" 
                  value={emailModal.to} 
                  onChange={e => setEmailModal({ ...emailModal, to: e.target.value })}
                  className="w-full rounded-lg border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Objet</label>
                <input 
                  type="text" 
                  value={emailModal.subject} 
                  onChange={e => setEmailModal({ ...emailModal, subject: e.target.value })}
                  className="w-full rounded-lg border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Message</label>
                <textarea 
                  rows={8}
                  value={emailModal.body} 
                  onChange={e => setEmailModal({ ...emailModal, body: e.target.value })}
                  className="w-full rounded-lg border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 p-3 text-xs font-mono whitespace-pre-wrap"
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="pt-2 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${emailModal.subject}\n\n${emailModal.body}`)
                  setEmailModal(prev => ({ ...prev, copied: true }))
                  setTimeout(() => setEmailModal(prev => ({ ...prev, copied: false })), 2500)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-zinc-700 font-medium text-sm transition-colors"
              >
                {emailModal.copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {emailModal.copied ? 'Texte copié !' : 'Copier le message'}
              </button>

              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailModal.to)}&su=${encodeURIComponent(emailModal.subject)}&body=${encodeURIComponent(emailModal.body)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir dans Gmail
              </a>

              <a
                href={`mailto:${encodeURIComponent(emailModal.to)}?subject=${encodeURIComponent(emailModal.subject)}&body=${encodeURIComponent(emailModal.body)}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
              >
                <Mail className="h-4 w-4" />
                Ouvrir logiciel de messagerie
              </a>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}
