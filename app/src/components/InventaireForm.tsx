"use client"

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Camera, CheckCircle2, AlertTriangle, Scale } from 'lucide-react'
import { calculerStockArticle } from '@/lib/stockUtils'
import { corrigerStock } from '@/app/actions/mouvements'

// Dynamic import with SSR false to prevent 'window is not defined' during build
const BarcodeScanner = dynamic(() => import('./BarcodeScanner').then(mod => mod.BarcodeScanner), { ssr: false })

export function InventaireForm({ articles }: { articles: any[] }) {
  const [isScanning, setIsScanning] = useState(false)
  const [selectedArticleId, setSelectedArticleId] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)
  
  // Real quantity input
  const [quantiteReelle, setQuantiteReelle] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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

    const trimmedCode = code.trim()
    const article = articles.find(a => a.codeBarre === trimmedCode)
    if (article) {
      setSelectedArticleId(article.id)
      setQuantiteReelle('')
    } else {
      setScanError(`Aucun article trouvé pour le code : ${code}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedArticleId || ecart === null || ecart === 0) return

    setIsSubmitting(true)
    
    // Create formData for the server action
    const formData = new FormData()
    formData.append("articleId", selectedArticleId)
    formData.append("ecart", ecart.toString())
    
    await corrigerStock(formData)
    
    setSuccessMessage(`Stock mis à jour avec succès. (Nouvelle quantité : ${quantiteReelle})`)
    setSelectedArticleId('')
    setQuantiteReelle('')
    setIsSubmitting(false)
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="border-b bg-gray-50/50 px-6 py-4 flex justify-between items-center">
        <span className="font-semibold text-gray-800">Saisie d'inventaire</span>
        <button 
          type="button" 
          onClick={() => setIsScanning(true)}
          className="flex items-center gap-1.5 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-purple-200 transition-colors"
        >
          <Camera className="w-4 h-4" />
          Scanner
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {scanError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-100">
            {scanError}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-md text-sm border border-emerald-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMessage}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">1. Article à contrôler</label>
          <select 
            required 
            value={selectedArticleId}
            onChange={(e) => {
              setSelectedArticleId(e.target.value)
              setQuantiteReelle('')
              setSuccessMessage(null)
            }}
            className="block w-full rounded-md border border-gray-300 px-4 py-3 text-sm bg-white focus:border-purple-500 focus:ring-purple-500"
          >
            <option value="">-- Sélectionner ou Scanner --</option>
            {articles.map(a => (
              <option key={a.id} value={a.id}>[{a.reference}] {a.designation}</option>
            ))}
          </select>
        </div>

        {selectedArticle && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Stock Théorique</p>
                <p className="text-2xl font-bold text-gray-900">{stockTheorique} <span className="text-sm font-normal text-gray-500">{selectedArticle.unite}</span></p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Dernier Mvt</p>
                <p className="text-sm font-medium text-gray-700">
                  {selectedArticle.mouvements?.[0] ? new Date(selectedArticle.mouvements[0].date).toLocaleDateString('fr-FR') : 'Aucun'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 font-bold mb-1">2. Quantité Physique Réelle</label>
              <input 
                required 
                type="number" 
                min="0"
                value={quantiteReelle}
                onChange={(e) => setQuantiteReelle(e.target.value)}
                placeholder={`Ex: ${stockTheorique}`}
                className="block w-full rounded-lg border-2 border-purple-200 px-4 py-3 text-lg font-bold text-center focus:border-purple-500 focus:ring-purple-500 transition-colors" 
              />
            </div>

            {ecart !== null && (
              <div className={`rounded-lg p-4 border flex items-center justify-between
                ${ecart === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}
              `}>
                <div className="flex items-center gap-3">
                  <Scale className={`w-6 h-6 ${ecart === 0 ? 'text-emerald-500' : 'text-orange-500'}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Écart d'inventaire</p>
                    <p className={`text-xs ${ecart === 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                      {ecart === 0 ? 'Le stock est parfait.' : 'Une correction va être enregistrée.'}
                    </p>
                  </div>
                </div>
                <div className={`text-2xl font-black ${ecart > 0 ? 'text-emerald-600' : ecart < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {ecart > 0 ? '+' : ''}{ecart}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting || ecart === null || ecart === 0}
              className="w-full flex justify-center items-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-bold text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Mise à jour...' : 'Enregistrer la Correction'}
            </button>
          </div>
        )}
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
