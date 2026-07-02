"use client"

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Camera, CheckCircle2, AlertTriangle, Scale, PlusCircle, Edit3, X, Save } from 'lucide-react'
import { calculerStockArticle } from '@/lib/stockUtils'
import { corrigerStock } from '@/app/actions/mouvements'
import { creerArticleEtStock, updateInfosRapides } from '@/app/actions/articles'

// Dynamic import with SSR false to prevent 'window is not defined' during build
const BarcodeScanner = dynamic(() => import('./BarcodeScanner').then(mod => mod.BarcodeScanner), { ssr: false })

export function InventaireForm({ articles }: { articles: any[] }) {
  const [isScanning, setIsScanning] = useState(false)
  const [mode, setMode] = useState<'idle' | 'known' | 'unknown'>('idle')
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [selectedArticleId, setSelectedArticleId] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)
  
  // Real quantity input
  const [quantiteReelle, setQuantiteReelle] = useState<string>('')
  const [observation, setObservation] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Quick edit mode (for known articles)
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [editDesignation, setEditDesignation] = useState('')
  const [editFournisseur, setEditFournisseur] = useState('')
  const [editReference, setEditReference] = useState('')

  // Create mode (for unknown articles)
  const [newDesignation, setNewDesignation] = useState('')
  const [newFournisseur, setNewFournisseur] = useState('')

  const selectedArticle = useMemo(() => {
    return articles.find(a => a.id === selectedArticleId)
  }, [selectedArticleId, articles])

  const stockTheorique = useMemo(() => {
    if (!selectedArticle) return 0
    const info = calculerStockArticle(selectedArticle, selectedArticle.mouvements || [])
    return info.stockDepot
  }, [selectedArticle])

  const ecart = useMemo(() => {
    if (quantiteReelle === '') return null
    return parseInt(quantiteReelle) - stockTheorique
  }, [quantiteReelle, stockTheorique])

  const handleScan = (code: string) => {
    setIsScanning(false)
    setScanError(null)
    setSuccessMessage(null)
    setObservation('')
    setQuantiteReelle('')
    setIsEditingInfo(false)

    const trimmedCode = code.trim()
    const article = articles.find(a => a.codeBarre === trimmedCode)
    
    if (article) {
      setSelectedArticleId(article.id)
      setMode('known')
      setEditDesignation(article.designation)
      setEditFournisseur(article.fournisseur || '')
      setEditReference(article.reference || '')
    } else {
      setScannedCode(trimmedCode)
      setMode('unknown')
      setSelectedArticleId('')
      setNewDesignation('')
      setNewFournisseur('')
    }
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    if (!id) {
      setMode('idle')
      setSelectedArticleId('')
      return
    }
    const article = articles.find(a => a.id === id)
    if (article) {
      setSelectedArticleId(article.id)
      setMode('known')
      setEditDesignation(article.designation)
      setEditFournisseur(article.fournisseur || '')
      setEditReference(article.reference || '')
      setQuantiteReelle('')
      setObservation('')
      setSuccessMessage(null)
      setIsEditingInfo(false)
    }
  }

  const handleUpdateInfo = async () => {
    if (!selectedArticleId) return
    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("id", selectedArticleId)
    formData.append("designation", editDesignation)
    formData.append("fournisseur", editFournisseur)
    formData.append("reference", editReference)
    
    await updateInfosRapides(formData)
    
    setSuccessMessage("Informations de l'article mises à jour.")
    setIsEditingInfo(false)
    setIsSubmitting(false)
  }

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedArticleId || ecart === null || ecart === 0) return

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("articleId", selectedArticleId)
    formData.append("ecart", ecart.toString())
    if (observation) {
      formData.append("observation", observation)
    }
    
    await corrigerStock(formData)
    
    setSuccessMessage(`Stock mis à jour avec succès. (Nouvelle quantité : ${quantiteReelle})`)
    setMode('idle')
    setSelectedArticleId('')
    setQuantiteReelle('')
    setObservation('')
    setIsSubmitting(false)
  }

  const handleSubmitCreation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scannedCode || !newDesignation) return

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("codeBarre", scannedCode)
    formData.append("designation", newDesignation)
    formData.append("fournisseur", newFournisseur)
    formData.append("quantiteReelle", quantiteReelle)
    if (observation) {
      formData.append("observation", observation)
    }
    
    await creerArticleEtStock(formData)
    
    setSuccessMessage(`Nouvel article "${newDesignation}" créé avec ${quantiteReelle} en stock !`)
    setMode('idle')
    setScannedCode(null)
    setQuantiteReelle('')
    setObservation('')
    setIsSubmitting(false)
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="border-b bg-gray-50/50 px-6 py-4 flex justify-between items-center">
        <span className="font-semibold text-gray-800">Scan & Go</span>
        <button 
          type="button" 
          onClick={() => setIsScanning(true)}
          className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-purple-700 hover:shadow-lg transition-all"
        >
          <Camera className="w-5 h-5" />
          Scanner Code
        </button>
      </div>

      <div className="p-6 space-y-6">
        {scanError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-100">
            {scanError}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-md text-sm border border-emerald-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" /> {successMessage}
          </div>
        )}

        {/* Sélection Manuelle (si pas de scan) */}
        {mode === 'idle' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ou sélectionner manuellement :</label>
            <select 
              value={selectedArticleId}
              onChange={handleSelectChange}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 text-sm bg-white focus:border-purple-500 focus:ring-purple-500"
            >
              <option value="">-- Sélectionner un article --</option>
              {articles.map(a => (
                <option key={a.id} value={a.id}>[{a.reference}] {a.designation}</option>
              ))}
            </select>
            
            <div className="mt-8 text-center text-gray-400 p-8 border-2 border-dashed rounded-xl">
              <Camera className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Scannez un produit avec le bouton "Scanner Code"</p>
              <p className="text-sm mt-1">S'il est inconnu, l'application vous proposera de le créer immédiatement.</p>
            </div>
          </div>
        )}

        {/* MODE CONNU : Mise à jour du stock et des infos */}
        {mode === 'known' && selectedArticle && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">Article Connu</span>
                <button type="button" onClick={() => setMode('idle')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Fiche Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b flex justify-between items-center bg-white">
                <div>
                  <h3 className="font-bold text-gray-900">{selectedArticle.designation}</h3>
                  <p className="text-xs text-gray-500">{selectedArticle.reference} • {selectedArticle.fournisseur || 'Fournisseur inconnu'}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsEditingInfo(!isEditingInfo)}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Modifier les informations"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>

              {isEditingInfo && (
                <div className="p-4 space-y-3 bg-purple-50/30 border-b">
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Désignation</label>
                    <input type="text" value={editDesignation} onChange={(e) => setEditDesignation(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Fournisseur</label>
                      <input type="text" value={editFournisseur} onChange={(e) => setEditFournisseur(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Réf. Fournisseur</label>
                      <input type="text" value={editReference} onChange={(e) => setEditReference(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2" />
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleUpdateInfo}
                    disabled={isSubmitting}
                    className="mt-2 w-full flex items-center justify-center gap-2 bg-purple-100 text-purple-700 px-3 py-2 rounded-md text-sm font-bold hover:bg-purple-200"
                  >
                    <Save className="w-4 h-4" /> Sauvegarder les infos
                  </button>
                </div>
              )}

              <div className="p-4 grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Stock Théorique</p>
                  <p className="text-2xl font-bold text-gray-900">{stockTheorique} <span className="text-sm font-normal text-gray-500">{selectedArticle.unite}</span></p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Code Barre</p>
                  <p className="text-sm font-medium text-gray-700 mt-1">{selectedArticle.codeBarre || 'Aucun'}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 font-bold mb-1">Quantité Physique Réelle</label>
                <input 
                  required 
                  type="number" 
                  min="0"
                  value={quantiteReelle}
                  onChange={(e) => setQuantiteReelle(e.target.value)}
                  placeholder={`Ex: ${stockTheorique}`}
                  className="block w-full rounded-lg border-2 border-purple-200 px-4 py-4 text-2xl font-black text-center focus:border-purple-500 focus:ring-purple-500 transition-colors" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observation (Optionnel)</label>
                <input 
                  type="text" 
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ex: Trouvé dans un autre carton, boîte abîmée..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2" 
                />
              </div>

              {ecart !== null && (
                <div className={`rounded-lg p-3 border flex items-center justify-between
                  ${ecart === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}
                `}>
                  <div className="flex items-center gap-2">
                    <Scale className={`w-5 h-5 ${ecart === 0 ? 'text-emerald-500' : 'text-orange-500'}`} />
                    <p className={`text-sm font-bold ${ecart === 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                      Écart : {ecart > 0 ? '+' : ''}{ecart}
                    </p>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting || ecart === null || ecart === 0}
                className="w-full flex justify-center items-center gap-2 rounded-lg bg-purple-600 px-4 py-4 text-base font-bold text-white hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {isSubmitting ? 'Traitement...' : 'Valider la Quantité'}
              </button>
            </form>
          </div>
        )}

        {/* MODE INCONNU : Création Rapide */}
        {mode === 'unknown' && scannedCode && (
          <form onSubmit={handleSubmitCreation} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Nouveau Produit Détecté
              </span>
              <button type="button" onClick={() => setMode('idle')} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500">Code Barre (Verrouillé)</label>
                <div className="mt-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-mono border border-gray-200">
                  {scannedCode}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Nom du Produit (Désignation) *</label>
                <input 
                  required
                  type="text" 
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  placeholder="Ex: Câble RO2V 3G1.5 Couronne 100m"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 px-3 py-2" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Fournisseur</label>
                <input 
                  type="text" 
                  value={newFournisseur}
                  onChange={(e) => setNewFournisseur(e.target.value)}
                  placeholder="Ex: Rexel, Sonepar..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 px-3 py-2" 
                />
              </div>

              <div className="pt-2 border-t border-amber-200/60">
                <label className="block text-sm font-bold text-gray-900 mb-1">Quantité Actuelle Comptée *</label>
                <input 
                  required 
                  type="number" 
                  min="0"
                  value={quantiteReelle}
                  onChange={(e) => setQuantiteReelle(e.target.value)}
                  placeholder="Ex: 5"
                  className="block w-full rounded-lg border-2 border-amber-300 px-4 py-3 text-xl font-bold text-center focus:border-amber-500 focus:ring-amber-500 transition-colors" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observation (Optionnel)</label>
                <input 
                  type="text" 
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ex: Palette au fond du hangar"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm px-3 py-2" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !newDesignation || !quantiteReelle}
              className="w-full flex justify-center items-center gap-2 rounded-lg bg-amber-500 px-4 py-4 text-base font-bold text-white hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {isSubmitting ? 'Création...' : <><PlusCircle className="w-5 h-5" /> Créer & Ajouter au Stock</>}
            </button>
          </form>
        )}
      </div>

      {isScanning && (
        <BarcodeScanner 
          onScan={handleScan}
          onClose={() => setIsScanning(false)}
        />
      )}
    </div>
  )
}
