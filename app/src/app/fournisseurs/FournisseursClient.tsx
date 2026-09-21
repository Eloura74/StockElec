'use client'

import { useState, useMemo } from 'react'
import { 
  Upload, Plus, Trash2, Mail, CheckCircle2, AlertTriangle, FileText, 
  ArrowRight, LineChart as ChartIcon, X, Download, MailCheck, RefreshCw, 
  Copy, ExternalLink, Check, Settings, Sparkles, Building2, Eye, EyeOff,
  Filter, Tag, HelpCircle, AlertCircle, ArrowUpDown
} from 'lucide-react'
import { saveFactureAndCheckPrices, getPriceHistory, updateStatutAvoir, deleteFacture } from '@/app/actions/factures'
import { createAlias, deleteAlias } from '@/app/actions/alias'
import { saveConfigMail, testConfigMail, syncMailboxNow } from '@/app/actions/config-mail'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'

interface FournisseursClientProps {
  initialFactures: any[]
  initialConfigMail: any
  initialAliases: any[]
}

export function FournisseursClient({ initialFactures, initialConfigMail, initialAliases }: FournisseursClientProps) {
  const router = useRouter()

  // FORMULAIRE FACTURE
  const [fournisseur, setFournisseur] = useState('Rexel')
  const [numeroFacture, setNumeroFacture] = useState('')
  const [dateFacture, setDateFacture] = useState('')
  const [totalHT, setTotalHT] = useState<number | ''>('')
  const [totalTVA, setTotalTVA] = useState<number | ''>('')
  const [totalTTC, setTotalTTC] = useState<number | ''>('')
  const [dateEcheance, setDateEcheance] = useState('')
  const [modePaiement, setModePaiement] = useState('')
  const [lignes, setLignes] = useState<any[]>([])
  const [selectedEntreprise, setSelectedEntreprise] = useState<string>('CedricElec')
  
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [updatingLigneId, setUpdatingLigneId] = useState<string | null>(null)
  const [deletingFactureId, setDeletingFactureId] = useState<string | null>(null)

  // MODALE CONFIG MAIL
  const [isMailModalOpen, setIsMailModalOpen] = useState(false)
  const [mailConfig, setMailConfig] = useState({
    imapHost: initialConfigMail?.imapHost || 'imap.gmail.com',
    imapPort: initialConfigMail?.imapPort || 993,
    imapUser: initialConfigMail?.imapUser || '',
    imapPassword: '',
    nomBoite: initialConfigMail?.nomBoite || 'Boîte Factures'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isTestingMail, setIsTestingMail] = useState(false)
  const [mailTestResult, setMailTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isSavingMail, setIsSavingMail] = useState(false)
  const [isSyncingMail, setIsSyncingMail] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null)

  // MODALE ALIAS
  const [isAliasModalOpen, setIsAliasModalOpen] = useState(false)
  const [aliasesList, setAliasesList] = useState<any[]>(initialAliases || [])
  const [newAliasFournisseur, setNewAliasFournisseur] = useState('Rexel')
  const [newAliasCode, setNewAliasCode] = useState('')
  const [newAliasRefInterne, setNewAliasRefInterne] = useState('')
  const [isAddingAlias, setIsAddingAlias] = useState(false)

  // MODALE GRAPHIQUE
  const [isChartOpen, setIsChartOpen] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [chartRef, setChartRef] = useState('')

  // MODALE EMAIL RECLAMATION
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

  // FILTRES DE RECHERCHE
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFournisseur, setFilterFournisseur] = useState('ALL')
  const [filterChantier, setFilterChantier] = useState('ALL')
  const [filterType, setFilterType] = useState('all') // 'all', 'hausse', 'baisse', 'avoir_recu', 'conforme'

  // EXTRACTION PDF IA
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    
    if (files.length === 1) {
      // 1. Upload unitaire : pré-remplir le formulaire classique
      const formData = new FormData()
      formData.append('file', files[0])

      try {
        const res = await fetch('/api/factures/parse', { method: 'POST', body: formData })
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
            if (fUpper.includes('YESSS') || fUpper.includes('YESSE')) setFournisseur('Yesse elec')
            else if (fUpper.includes('REXEL')) setFournisseur('Rexel')
            else if (fUpper.includes('SONEPAR')) setFournisseur('Sonepar')
            else if (fUpper.includes('BALITRAN')) setFournisseur('Balitran')
            else setFournisseur('Autre')
          }
        } else {
          alert("Aucun article n'a pu être extrait automatiquement. Vous pouvez les ajouter manuellement.")
        }
      } catch (err) {
        alert("Erreur lors de l'extraction de la facture.")
      }
    } else {
      // 2. Upload multiple : Traitement par lot (auto-save)
      let succesCount = 0
      let echecCount = 0
      
      for (let i = 0; i < files.length; i++) {
        try {
          const formData = new FormData()
          formData.append('file', files[i])
          const res = await fetch('/api/factures/parse', { method: 'POST', body: formData })
          const data = await res.json()
          
          if (data.items && data.items.length > 0 && data.fournisseur && data.numeroFacture) {
            let fName = data.fournisseur
            const fUpper = fName.toUpperCase()
            if (fUpper.includes('YESSS') || fUpper.includes('YESSE')) fName = 'Yesse elec'
            else if (fUpper.includes('REXEL')) fName = 'Rexel'
            else if (fUpper.includes('SONEPAR')) fName = 'Sonepar'
            else if (fUpper.includes('BALITRAN')) fName = 'Balitran'
            
            await saveFactureAndCheckPrices(fName, data.numeroFacture, data.items, {
              entreprise: selectedEntreprise,
              totalHT: data.totalHT || null,
              totalTVA: data.totalTVA || null,
              totalTTC: data.totalTTC || null,
              dateEcheance: data.dateEcheance || null,
              modePaiement: data.modePaiement || null,
              dateFacture: data.dateFacture || null
            })
            succesCount++
          } else {
            echecCount++
          }
        } catch (e) {
          echecCount++
        }
      }
      alert(`Traitement par lot terminé.\n${succesCount} factures enregistrées avec succès.\n${echecCount > 0 ? echecCount + ' factures ont échoué.' : ''}`)
      router.refresh()
    }

    setIsUploading(false)
    if (e.target) e.target.value = ''
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
    
    // Enregistrer les nouveaux alias si demandés
    for (const ligne of lignes) {
      if (ligne.originalReference && ligne.reference !== ligne.originalReference && ligne.saveAlias !== false) {
        await createAlias(fournisseur, ligne.originalReference, ligne.reference)
      }
    }

    const res = await saveFactureAndCheckPrices(fournisseur, numeroFacture, lignes, {
      entreprise: selectedEntreprise,
      totalHT: totalHT !== '' ? Number(totalHT) : null,
      totalTVA: totalTVA !== '' ? Number(totalTVA) : null,
      totalTTC: totalTTC !== '' ? Number(totalTTC) : null,
      dateEcheance: dateEcheance || null,
      modePaiement: modePaiement || null,
      dateFacture: dateFacture || null
    })
    
    setIsSaving(false)

    if (res.success) {
      alert("Facture enregistrée et contrôlée avec succès !")
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

  // SUPPRESSION DE FACTURE
  const handleDeleteFacture = async (factureId: string, numFacture: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la facture ${numFacture || ''} ? Cette action est irréversible.`)) {
      return
    }

    setDeletingFactureId(factureId)
    const res = await deleteFacture(factureId)
    setDeletingFactureId(null)

    if (res.success) {
      router.refresh()
    } else {
      alert("Erreur : " + res.error)
    }
  }

  // MISE A JOUR STATUT AVOIR
  const handleUpdateStatutAvoir = async (ligneId: string, nouveauStatut: string) => {
    setUpdatingLigneId(ligneId)
    let numeroAvoir: string | null = null
    let montantAvoir: number | null = null

    if (nouveauStatut === 'AVOIR_RECU') {
      const num = window.prompt("Numéro de l'avoir reçu (optionnel) :")
      if (num) numeroAvoir = num
      const mntStr = window.prompt("Montant de l'avoir reçu en € (optionnel) :")
      if (mntStr) montantAvoir = parseFloat(mntStr.replace(',', '.')) || null
    }

    await updateStatutAvoir(ligneId, nouveauStatut, numeroAvoir, montantAvoir)
    setUpdatingLigneId(null)
    router.refresh()
  }

  // PRESETS DE BOÎTE MAIL
  const applyPreset = (preset: 'gmail' | 'outlook' | 'ovh' | 'hostinger' | 'orange') => {
    switch (preset) {
      case 'gmail':
        setMailConfig(prev => ({ ...prev, imapHost: 'imap.gmail.com', imapPort: 993 }))
        break
      case 'outlook':
        setMailConfig(prev => ({ ...prev, imapHost: 'outlook.office365.com', imapPort: 993 }))
        break
      case 'ovh':
        setMailConfig(prev => ({ ...prev, imapHost: 'ssl0.ovh.net', imapPort: 993 }))
        break
      case 'hostinger':
        setMailConfig(prev => ({ ...prev, imapHost: 'imap.hostinger.com', imapPort: 993 }))
        break
      case 'orange':
        setMailConfig(prev => ({ ...prev, imapHost: 'imap.orange.fr', imapPort: 993 }))
        break
    }
  }

  const handleTestMail = async () => {
    setIsTestingMail(true)
    setMailTestResult(null)
    const res = await testConfigMail({
      imapHost: mailConfig.imapHost,
      imapPort: mailConfig.imapPort,
      imapUser: mailConfig.imapUser,
      imapPassword: mailConfig.imapPassword
    })
    setIsTestingMail(false)
    if (res.success) {
      setMailTestResult({ success: true, message: res.message || 'Connexion réussie !' })
    } else {
      setMailTestResult({ success: false, message: res.error || 'Échec de connexion.' })
    }
  }

  const handleSaveMailConfig = async () => {
    setIsSavingMail(true)
    const res = await saveConfigMail({
      imapHost: mailConfig.imapHost,
      imapPort: mailConfig.imapPort,
      imapUser: mailConfig.imapUser,
      imapPassword: mailConfig.imapPassword || undefined,
      nomBoite: mailConfig.nomBoite
    })
    setIsSavingMail(false)
    if (res.success) {
      alert("Configuration de la boîte mail enregistrée avec succès !")
      setMailConfig(prev => ({ ...prev, imapPassword: '' }))
      router.refresh()
    } else {
      alert("Erreur : " + res.error)
    }
  }

  const handleSyncMailbox = async () => {
    setIsSyncingMail(true)
    setSyncFeedback(null)
    const res = await syncMailboxNow()
    setIsSyncingMail(false)
    if (res.success) {
      setSyncFeedback(res.message || 'Synchronisation terminée.')
      router.refresh()
    } else {
      setSyncFeedback("Erreur : " + (res.error || 'inconnue'))
    }
  }

  // GESTION DES ALIAS
  const handleAddAlias = async () => {
    if (!newAliasCode.trim() || !newAliasRefInterne.trim()) {
      return alert("Veuillez remplir les deux références.")
    }
    setIsAddingAlias(true)
    const res = await createAlias(newAliasFournisseur, newAliasCode.trim(), newAliasRefInterne.trim())
    setIsAddingAlias(false)
    if (res.success && res.alias) {
      setAliasesList(prev => [res.alias, ...prev])
      setNewAliasCode('')
      setNewAliasRefInterne('')
      alert("Équivalence enregistrée !")
    } else {
      alert("Erreur lors de l'enregistrement de l'alias.")
    }
  }

  const handleDeleteAlias = async (id: string) => {
    if (!window.confirm("Supprimer cette équivalence ?")) return
    const res = await deleteAlias(id)
    if (res.success) {
      setAliasesList(prev => prev.filter(a => a.id !== id))
    }
  }

  // RECLAMATIONS EMAIL
  const openEmailModalForLigne = (facture: any, ligne: any) => {
    const subject = `Demande d'avoir - Facture ${facture.numeroFacture || '[NUMÉRO]'}`
    let datePrecedenteText = ""
    if (ligne.dateFacturePrecedente) {
      datePrecedenteText = ` le ${new Date(ligne.dateFacturePrecedente).toLocaleDateString("fr-FR")}`
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

  // EXPORT EXCEL COMPTABLE
  const exportExcelComptable = () => {
    const rows: any[] = []

    filteredFactures.forEach(facture => {
      const dateFact = new Date(facture.dateFacture).toLocaleDateString("fr-FR")

      facture.lignes.forEach((ligne: any) => {
        // Exclure les articles conformes pour plus de clarté
        if (!ligne.alerteHausse && !ligne.alerteBaisse) return;

        const totalLigneHT = (ligne.quantite * ligne.prixUnitaire)
        const ecartUnitaire = ligne.prixUnitairePrecedent ? (ligne.prixUnitaire - ligne.prixUnitairePrecedent) : 0
        const surcoutTotal = ligne.alerteHausse ? (ecartUnitaire * ligne.quantite) : 0

        const isPlusCher = ligne.alerteHausse && ligne.fournisseurPrecedent && ligne.fournisseurPrecedent !== facture.fournisseur

        rows.push({
          "Entreprise": facture.entreprise || 'CedricElec',
          "Date Facture": dateFact,
          "Fournisseur": facture.fournisseur,
          "N° Facture": facture.numeroFacture,
          "Chantier / Réf Client": ligne.chantier || 'STOCK',
          "Référence": ligne.reference,
          "Désignation": ligne.designation,
          "Quantité": ligne.quantite,
          "Prix Unitaire Net HT (€)": ligne.prixUnitaire,
          "Total Ligne HT (€)": Number(totalLigneHT.toFixed(2)),
          "Meilleur Prix Hist. (€)": ligne.prixUnitairePrecedent || '',
          "Comparatif Distributeurs": isPlusCher ? `⚠️ MOINS CHER CHEZ ${ligne.fournisseurPrecedent} (-${ecartUnitaire.toFixed(2)}€/u)` : (ligne.fournisseurPrecedent ? `Meilleur chez ${ligne.fournisseurPrecedent}` : '-'),
          "Écart Unitaire (€)": Number(ecartUnitaire.toFixed(2)),
          "Alerte Prix": ligne.alerteHausse ? '🔴 HAUSSE' : ligne.alerteBaisse ? '🟢 BAISSE' : '⚪ CONFORME',
          "Surcoût Hausse (€)": Number(surcoutTotal.toFixed(2)),
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

  // GRAPHIQUE HISTORIQUE PRIX
  const handleOpenChart = async (reference: string) => {
    setChartRef(reference)
    setIsChartOpen(true)
    const data = await getPriceHistory(reference)
    const formattedData = data.map((d: any) => ({
      date: new Date(d.facture.dateFacture).toLocaleDateString("fr-FR"),
      prix: d.prixUnitaire,
      fournisseur: d.facture.fournisseur
    }))
    setChartData(formattedData)
  }

  // LISTE DES CHANTIERS UNIQUES POUR LE FILTRE
  const chantiersSet = new Set<string>()
  initialFactures.forEach(f => {
    f.lignes.forEach((l: any) => {
      if (l.chantier) chantiersSet.add(l.chantier)
    })
  })
  const uniqueChantiers = Array.from(chantiersSet).sort()

  // CALCUL DES STATISTIQUES GLOBALES
  const totalFactures = initialFactures.length
  let totalLignesAnalysees = 0
  let totalAlertes = 0
  let totalBaisses = 0
  let totalAvoirsRecuperes = 0
  let totalSurcoutHausses = 0
  let totalDepensesHT = 0
  
  initialFactures.forEach(facture => {
    totalLignesAnalysees += facture.lignes.length
    if (facture.totalHT) totalDepensesHT += facture.totalHT
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

  // FILTRAGE
  const filteredFactures = initialFactures.map(facture => {
    // Filtre Fournisseur
    if (filterFournisseur !== 'ALL' && facture.fournisseur !== filterFournisseur) {
      return null
    }

    let filteredLignes = facture.lignes

    // Filtre Chantier
    if (filterChantier !== 'ALL') {
      filteredLignes = filteredLignes.filter((l: any) => l.chantier === filterChantier)
    }

    // Filtre Type d'alerte
    if (filterType === 'hausse') {
      filteredLignes = filteredLignes.filter((l: any) => l.alerteHausse)
    } else if (filterType === 'baisse') {
      filteredLignes = filteredLignes.filter((l: any) => l.alerteBaisse)
    } else if (filterType === 'avoir_recu') {
      filteredLignes = filteredLignes.filter((l: any) => l.statutAvoir === 'AVOIR_RECU')
    } else if (filterType === 'conforme') {
      filteredLignes = filteredLignes.filter((l: any) => !l.alerteHausse && !l.alerteBaisse)
    }

    // Recherche textuelle
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      filteredLignes = filteredLignes.filter((l: any) => 
        l.reference.toLowerCase().includes(q) ||
        l.designation.toLowerCase().includes(q) ||
        (l.chantier && l.chantier.toLowerCase().includes(q)) ||
        (facture.numeroFacture && facture.numeroFacture.toLowerCase().includes(q)) ||
        facture.fournisseur.toLowerCase().includes(q)
      )
    }

    if (filteredLignes.length === 0) return null

    return { ...facture, lignes: filteredLignes }
  }).filter(Boolean) as any[]

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* SECTION NOUVELLE FACTURE / SAISIE & IMPORT */}
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Nouvelle Facture Fournisseur
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Glissez le PDF pour extraire automatiquement les lignes, prix unitaires nets et chantiers imputés.
            </p>
          </div>

          {/* BOUTONS ACTIONS RAPIDES (BOÎTE MAIL + ALIAS) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAliasModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-zinc-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
            >
              <Tag className="h-4 w-4 text-purple-600" />
              Mes Équivalences ({aliasesList.length})
            </button>

            <button
              onClick={() => setIsMailModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              <Settings className="h-4 w-4 text-blue-600" />
              Boîte Mail Auto & Synchro
            </button>
          </div>
        </div>
        
        {/* EN-TÊTE PRINCIPAL DE SAISIE */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Entreprise</label>
            <select 
              value={selectedEntreprise} 
              onChange={e => setSelectedEntreprise(e.target.value)}
              className="w-full rounded-xl border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm font-semibold text-blue-700 dark:text-blue-400"
            >
              <option value="CedricElec">CedricElec</option>
              <option value="LittoralElec">LittoralElec</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Fournisseur</label>
            <select 
              value={fournisseur} 
              onChange={e => setFournisseur(e.target.value)}
              className="w-full rounded-xl border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm"
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
              className="w-full rounded-xl border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Date Facture</label>
            <input 
              type="text" 
              value={dateFacture}
              onChange={e => setDateFacture(e.target.value)}
              placeholder="JJ/MM/AAAA"
              className="w-full rounded-xl border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Import PDF Rapide (IA)</label>
            <div className="relative">
              <input 
                type="file" 
                multiple
                accept="application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 px-3 py-2 hover:bg-blue-100 transition-colors text-sm">
                <Upload className="h-4 w-4" />
                <span className="font-medium">{isUploading ? 'Lecture IA en cours...' : 'Glisser un ou des PDF'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* DONNÉES FINANCIÈRES & COMPTABLES */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 mb-6 rounded-2xl bg-gray-50 dark:bg-zinc-950/50 border dark:border-zinc-800 text-xs">
          <div>
            <span className="text-gray-500 block mb-1">Total HT (€)</span>
            <input 
              type="number"
              step="0.01"
              value={totalHT}
              onChange={e => setTotalHT(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="0.00"
              className="w-full p-2 rounded-lg border dark:border-zinc-700 dark:bg-zinc-900 font-semibold"
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
              className="w-full p-2 rounded-lg border dark:border-zinc-700 dark:bg-zinc-900"
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
              className="w-full p-2 rounded-lg border dark:border-zinc-700 dark:bg-zinc-900 font-bold text-blue-600"
            />
          </div>
          <div>
            <span className="text-gray-500 block mb-1">Date Échéance</span>
            <input 
              type="text"
              value={dateEcheance}
              onChange={e => setDateEcheance(e.target.value)}
              placeholder="JJ/MM/AAAA"
              className="w-full p-2 rounded-lg border dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <span className="text-gray-500 block mb-1">Mode Règlement</span>
            <input 
              type="text"
              value={modePaiement}
              onChange={e => setModePaiement(e.target.value)}
              placeholder="Ex: LCR 30j FDM"
              className="w-full p-2 rounded-lg border dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>

        {/* TABLEAU DES LIGNES */}
        <div className="border rounded-xl overflow-x-auto mb-6">
          <table className="w-full text-left text-sm min-w-175">
            <thead className="bg-gray-50 dark:bg-zinc-950 border-b text-xs text-gray-500">
              <tr>
                <th className="p-3 w-44">Chantier / Réf Client</th>
                <th className="p-3 w-36">Référence</th>
                <th className="p-3">Désignation</th>
                <th className="p-3 w-20 text-center">Qté</th>
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
                        className="w-full p-2 border rounded-lg dark:border-zinc-700 dark:bg-zinc-950 font-medium" 
                        placeholder="STOCK / Chantier" 
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="text" 
                        value={ligne.reference} 
                        onChange={e => updateLigne(ligne.id, 'reference', e.target.value)} 
                        className="w-full p-2 border rounded-lg dark:border-zinc-700 dark:bg-zinc-950 font-mono font-semibold" 
                        placeholder="Réf" 
                      />
                      {ligne.originalReference && ligne.reference !== ligne.originalReference && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-600">
                          <input type="checkbox" checked={ligne.saveAlias !== false} onChange={e => updateLigne(ligne.id, 'saveAlias', e.target.checked)} />
                          <label>Créer équivalence {ligne.originalReference} &rarr; {ligne.reference}</label>
                        </div>
                      )}
                    </td>
                    <td className="p-2">
                      <input 
                        type="text" 
                        value={ligne.designation} 
                        onChange={e => updateLigne(ligne.id, 'designation', e.target.value)} 
                        className="w-full p-2 border rounded-lg dark:border-zinc-700 dark:bg-zinc-950" 
                        placeholder="Description de l'article" 
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        value={ligne.quantite} 
                        onChange={e => updateLigne(ligne.id, 'quantite', parseInt(e.target.value) || 0)} 
                        className="w-full p-2 border rounded-lg dark:border-zinc-700 dark:bg-zinc-950 text-center font-bold" 
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
                        className="w-full p-2 border rounded-lg dark:border-zinc-700 dark:bg-zinc-950 font-semibold" 
                        placeholder="0.00" 
                      />
                    </td>
                    <td className="p-2 text-right font-mono font-medium text-gray-700 dark:text-gray-300">
                      {totalLigne} €
                    </td>
                    <td className="p-2 text-center">
                      <button onClick={() => removeLigne(ligne.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50">
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
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all active:scale-95"
          >
            {isSaving ? 'Enregistrement en cours...' : 'Enregistrer & Contrôler les Prix'}
          </button>
        </div>
      </div>

      {/* SECTION HISTORIQUE, RECHERCHE ET SUIVI COMPTABLE */}
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        
        {/* STATISTIQUES GLOBALES */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 dark:divide-zinc-800 border-b dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/50">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold">{totalFactures}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Factures Enregistrées</div>
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

        {/* HEADER & FILTRES MULTI-CRITÈRES */}
        <div className="p-6 border-b space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Historique & Contrôle Comptable</h2>
              <p className="text-xs text-gray-500 mt-0.5">Filtrage multi-critères, suivi des remboursements et export Excel.</p>
            </div>
            
            <button 
              onClick={exportExcelComptable}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 self-start md:self-auto"
              title="Exporter au format Excel avec toutes les colonnes comptables"
            >
              <Download className="h-4 w-4" /> Export Comptable (Excel)
            </button>
          </div>

          {/* BARRE DE FILTRES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {/* Recherche textuelle */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Recherche</label>
              <input 
                type="text"
                placeholder="Réf, Désignation, Facture..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-xs"
              />
            </div>

            {/* Filtre Fournisseur */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fournisseur</label>
              <select 
                value={filterFournisseur}
                onChange={e => setFilterFournisseur(e.target.value)}
                className="w-full rounded-xl border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-xs"
              >
                <option value="ALL">Tous les distributeurs</option>
                <option value="Rexel">Rexel</option>
                <option value="Sonepar">Sonepar</option>
                <option value="Yesse elec">YESSS Electrique</option>
                <option value="Balitran">Balitran</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            {/* Filtre Chantier */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Chantier</label>
              <select 
                value={filterChantier}
                onChange={e => setFilterChantier(e.target.value)}
                className="w-full rounded-xl border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-xs"
              >
                <option value="ALL">Tous les chantiers</option>
                <option value="STOCK">STOCK Dépôt</option>
                {uniqueChantiers.filter(c => c !== 'STOCK').map(ch => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>

            {/* Filtre Statut */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Statut Prix / Avoir</label>
              <select 
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full rounded-xl border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-xs font-medium"
              >
                <option value="all">Tous les articles</option>
                <option value="hausse">🔴 Hausses à réclamer</option>
                <option value="avoir_recu">✅ Avoirs validés (€)</option>
                <option value="baisse">🟢 Baisses de prix</option>
                <option value="conforme">⚪ Prix conformes</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLEAU HISTORIQUE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-225">
            <thead className="bg-gray-50 dark:bg-zinc-950 border-b text-xs text-gray-500">
              <tr>
                <th className="p-4">Facture & Échéance</th>
                <th className="p-4">Chantier</th>
                <th className="p-4">Article</th>
                <th className="p-4 text-right">Meilleur Prix Hist.</th>
                <th className="p-4 text-right">Prix Facturé</th>
                <th className="p-4 text-center">Statut Prix</th>
                <th className="p-4">Suivi Avoir</th>
                <th className="p-4 text-right">Actions</th>
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
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col gap-1">
                                <div className="font-bold text-gray-900 dark:text-gray-100">{facture.fournisseur}</div>
                                {facture.entreprise && (
                                  <span className={`inline-flex self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ${facture.entreprise === 'LittoralElec' ? 'bg-cyan-100 text-cyan-800' : 'bg-indigo-100 text-indigo-800'}`}>
                                    🏢 {facture.entreprise}
                                  </span>
                                )}
                              </div>
                              <button 
                                onClick={() => handleDeleteFacture(facture.id, facture.numeroFacture)}
                                disabled={deletingFactureId === facture.id}
                                className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors self-start"
                                title="Supprimer cette facture"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="text-[11px] text-gray-500">
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
                                className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold bg-zinc-800 dark:bg-zinc-200 text-white dark:text-black px-2.5 py-1 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors shadow-xs"
                                title="Générer un e-mail récapitulant tous les avoirs de cette facture"
                              >
                                <MailCheck className="h-3 w-3" /> Avoir Global
                              </button>
                            )}
                          </div>
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
                        <div className="text-[11px] text-gray-500 truncate max-w-55">{ligne.designation}</div>
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

                      {/* SUIVI STATUT AVOIR */}
                      <td className="p-4 align-top">
                        {ligne.alerteHausse ? (
                          <div className="space-y-1">
                            <select
                              value={ligne.statutAvoir || 'A_RECLAMER'}
                              disabled={updatingLigneId === ligne.id}
                              onChange={e => handleUpdateStatutAvoir(ligne.id, e.target.value)}
                              className={`text-[11px] font-semibold rounded-lg px-2 py-1 border transition-colors cursor-pointer ${
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors text-[11px] font-medium" 
                          title="Historique des prix"
                        >
                          <ChartIcon className="h-3.5 w-3.5" /> Graph
                        </button>
                        {ligne.alerteHausse && (
                          <button 
                            onClick={() => openEmailModalForLigne(facture, ligne)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-600 text-white px-2.5 py-1 rounded-lg hover:bg-red-700 transition-colors shadow-xs"
                          >
                            <Mail className="h-3.5 w-3.5" /> Réclamer
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              })}
              {filteredFactures.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Aucune facture ne correspond à vos filtres de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE CONFIGURATION BOÎTE MAIL */}
      {isMailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Settings className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Configuration de la Boîte Mail Factures</h3>
                  <p className="text-xs text-gray-500">Renseignez vos identifiants pour automatiser la relève des factures reçues.</p>
                </div>
              </div>
              <button onClick={() => setIsMailModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* PRESETS EN 1 CLIC */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Fournisseur de messagerie (1 clic)</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                <button 
                  onClick={() => applyPreset('gmail')} 
                  className="p-2.5 rounded-xl border hover:border-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/30 text-center font-semibold transition-colors"
                >
                  🔴 Gmail
                </button>
                <button 
                  onClick={() => applyPreset('outlook')} 
                  className="p-2.5 rounded-xl border hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-center font-semibold transition-colors"
                >
                  🔵 Outlook
                </button>
                <button 
                  onClick={() => applyPreset('ovh')} 
                  className="p-2.5 rounded-xl border hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 text-center font-semibold transition-colors"
                >
                  🟣 OVH
                </button>
                <button 
                  onClick={() => applyPreset('hostinger')} 
                  className="p-2.5 rounded-xl border hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 text-center font-semibold transition-colors"
                >
                  🟠 Hostinger
                </button>
                <button 
                  onClick={() => applyPreset('orange')} 
                  className="p-2.5 rounded-xl border hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-950/30 text-center font-semibold transition-colors"
                >
                  🟡 Orange Pro
                </button>
              </div>
            </div>

            {/* CHAMPS DE SAISIE */}
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Adresse e-mail factures</label>
                <input 
                  type="email"
                  value={mailConfig.imapUser}
                  onChange={e => setMailConfig({ ...mailConfig, imapUser: e.target.value })}
                  placeholder="ex: factures@quentin-elec.fr ou compta@gmail.com"
                  className="w-full rounded-xl border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mot de passe e-mail {initialConfigMail?.imapUser && <span className="text-gray-400 font-normal">(Laisser vide pour ne pas modifier)</span>}
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={mailConfig.imapPassword}
                    onChange={e => setMailConfig({ ...mailConfig, imapPassword: e.target.value })}
                    placeholder="••••••••••••••••"
                    className="w-full rounded-xl border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-4 py-2.5 pr-10 text-sm font-mono"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5" /> Pour Gmail ou Microsoft 365, utilisez un <strong>Mot de passe d'application</strong> (sécurité du compte).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Serveur IMAP</label>
                  <input 
                    type="text"
                    value={mailConfig.imapHost}
                    onChange={e => setMailConfig({ ...mailConfig, imapHost: e.target.value })}
                    placeholder="imap.gmail.com"
                    className="w-full rounded-xl border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Port</label>
                  <input 
                    type="number"
                    value={mailConfig.imapPort}
                    onChange={e => setMailConfig({ ...mailConfig, imapPort: parseInt(e.target.value) || 993 })}
                    className="w-full rounded-xl border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-4 py-2.5 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* RÉSULTAT DU TEST */}
            {mailTestResult && (
              <div className={`p-4 rounded-xl text-xs flex items-start gap-2 ${
                mailTestResult.success 
                  ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/50 dark:text-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/50 dark:text-red-200'
              }`}>
                {mailTestResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />}
                <div>{mailTestResult.message}</div>
              </div>
            )}

            {syncFeedback && (
              <div className="p-4 rounded-xl text-xs bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-200">
                {syncFeedback}
              </div>
            )}

            {/* BOUTONS ACTIONS */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t dark:border-zinc-800">
              <button
                onClick={handleTestMail}
                disabled={isTestingMail}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isTestingMail ? 'animate-spin' : ''}`} />
                {isTestingMail ? 'Test en cours...' : '🔍 Tester la connexion'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncMailbox}
                  disabled={isSyncingMail}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncingMail ? 'animate-spin' : ''}`} />
                  {isSyncingMail ? 'Relève en cours...' : '⚡ Relever maintenant'}
                </button>

                <button
                  onClick={handleSaveMailConfig}
                  disabled={isSavingMail}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-md disabled:opacity-50"
                >
                  {isSavingMail ? 'Enregistrement...' : '💾 Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE GESTION DES ÉQUIVALENCES / ALIAS */}
      {isAliasModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Tag className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Équivalences & Alias Fournisseurs</h3>
                  <p className="text-xs text-gray-500">Associez les références distributeurs à vos références internes.</p>
                </div>
              </div>
              <button onClick={() => setIsAliasModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* AJOUTER UNE NOUVELLE ÉQUIVALENCE */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-950/50 border dark:border-zinc-800 space-y-3">
              <div className="font-semibold text-xs uppercase tracking-wider text-gray-500">Ajouter une équivalence</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Fournisseur</label>
                  <select 
                    value={newAliasFournisseur}
                    onChange={e => setNewAliasFournisseur(e.target.value)}
                    className="w-full rounded-lg border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 px-3 py-2 text-xs"
                  >
                    <option>Rexel</option>
                    <option>Sonepar</option>
                    <option>Yesse elec</option>
                    <option>Balitran</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Réf Distributeur</label>
                  <input 
                    type="text"
                    value={newAliasCode}
                    onChange={e => setNewAliasCode(e.target.value)}
                    placeholder="Ex: 91002"
                    className="w-full rounded-lg border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Réf Interne / Canonique</label>
                  <input 
                    type="text"
                    value={newAliasRefInterne}
                    onChange={e => setNewAliasRefInterne(e.target.value)}
                    placeholder="Ex: 069731"
                    className="w-full rounded-lg border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleAddAlias}
                  disabled={isAddingAlias}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <Plus className="h-4 w-4" /> Ajouter l'équivalence
                </button>
              </div>
            </div>

            {/* LISTE DES ALIAS */}
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-zinc-950 border-b text-gray-500">
                  <tr>
                    <th className="p-3">Distributeur</th>
                    <th className="p-3">Réf Distributeur</th>
                    <th className="p-3">Réf Interne</th>
                    <th className="p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {aliasesList.map(alias => (
                    <tr key={alias.id}>
                      <td className="p-3 font-semibold">{alias.fournisseur}</td>
                      <td className="p-3 font-mono text-purple-600">{alias.aliasFournisseur}</td>
                      <td className="p-3 font-mono font-bold text-gray-900 dark:text-gray-100">{alias.referenceCanonique}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDeleteAlias(alias.id)} className="text-gray-400 hover:text-red-600 p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {aliasesList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-500">
                        Aucune équivalence créée pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALE GRAPHIQUE HISTORIQUE */}
      {isChartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold">Évolution du prix : {chartRef}</h3>
                <p className="text-xs text-gray-500">Historique des achats constatés tous distributeurs confondus</p>
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
                    <Line type="linear" dataKey="prix" stroke="#2563eb" strokeWidth={2.5} activeDot={{ r: 8 }} />
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
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-xl bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
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
                  className="w-full rounded-xl border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Objet</label>
                <input 
                  type="text" 
                  value={emailModal.subject} 
                  onChange={e => setEmailModal({ ...emailModal, subject: e.target.value })}
                  className="w-full rounded-xl border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Message</label>
                <textarea 
                  rows={8}
                  value={emailModal.body} 
                  onChange={e => setEmailModal({ ...emailModal, body: e.target.value })}
                  className="w-full rounded-xl border-gray-300 dark:border-zinc-700 dark:bg-zinc-950 p-3 text-xs font-mono whitespace-pre-wrap"
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-zinc-700 font-semibold text-xs transition-colors"
              >
                {emailModal.copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {emailModal.copied ? 'Texte copié !' : 'Copier le message'}
              </button>

              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailModal.to)}&su=${encodeURIComponent(emailModal.subject)}&body=${encodeURIComponent(emailModal.body)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-md"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir dans Gmail
              </a>

              <a
                href={`mailto:${encodeURIComponent(emailModal.to)}?subject=${encodeURIComponent(emailModal.subject)}&body=${encodeURIComponent(emailModal.body)}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-md"
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
