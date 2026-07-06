"use client"

import { useState } from "react"
import { Search, ScanBarcode, Box, CheckCircle2 } from "lucide-react"
import { corrigerStock } from "@/app/actions/inventaire"
import { BarcodeScanner } from "@/components/BarcodeScanner"

type Article = {
  id: string
  reference: string
  designation: string
  codeBarre: string | null
  categorie: string
  stockActuel: number
}

export function InventaireClient({ articles }: { articles: Article[] }) {
  const [search, setSearch] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [vraiStock, setVraiStock] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const filteredArticles = articles.filter(a => 
    a.designation.toLowerCase().includes(search.toLowerCase()) || 
    a.reference.toLowerCase().includes(search.toLowerCase()) ||
    (a.codeBarre && a.codeBarre.includes(search))
  ).slice(0, 5) // Garder seulement les 5 premiers pour ne pas surcharger

  const handleScan = (decodedText: string) => {
    const found = articles.find(a => a.codeBarre === decodedText || a.reference === decodedText)
    if (found) {
      handleSelectArticle(found)
      setIsScanning(false)
    } else {
      alert("Code barre introuvable : " + decodedText)
    }
  }

  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article)
    setVraiStock("")
    setSearch("")
    setSuccess(false)
  }

  const handleValiderCorrection = async () => {
    if (!selectedArticle) return
    const stockInt = parseInt(vraiStock, 10)
    if (isNaN(stockInt) || stockInt < 0) {
      return alert("Veuillez entrer un nombre valide positif ou nul.")
    }

    if (stockInt === selectedArticle.stockActuel) {
      return alert("Le stock réel renseigné est identique au stock actuel enregistré.")
    }

    setIsSubmitting(true)
    const res = await corrigerStock(selectedArticle.id, stockInt)
    if (res.success) {
      setSuccess(true)
      const updatedArticle = { ...selectedArticle, stockActuel: stockInt }
      setSelectedArticle(updatedArticle)
      
      // La page mère devra rafraichir les données, Next.js va revalider le path.
      setVraiStock("")
      setTimeout(() => setSuccess(false), 3000)
    } else {
      alert("Erreur: " + res.error)
    }
    setIsSubmitting(false)
  }

  if (isScanning) {
    return (
      <div className="bg-black/90 fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-full max-w-md p-4">
          <BarcodeScanner onScan={handleScan} onClose={() => setIsScanning(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Recherche et Scan */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600"/> Trouver un article
          </h2>
          <button 
            onClick={() => setIsScanning(true)}
            className="flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
          >
            <ScanBarcode className="w-5 h-5" /> Scanner
          </button>
        </div>
        
        <div className="relative mt-2">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Référence ou mot-clé..."
            className="block w-full pl-12 rounded-xl border-gray-300 dark:border-zinc-700 p-4 bg-gray-50 dark:bg-zinc-950 focus:bg-white dark:bg-zinc-900 focus:ring-blue-500 focus:border-blue-500 text-lg transition-colors"
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              if (selectedArticle) setSelectedArticle(null)
            }}
          />
        </div>

        {search && !selectedArticle && (
          <div className="mt-4 space-y-2">
            {filteredArticles.length === 0 ? (
              <div className="p-4 text-gray-500 dark:text-zinc-400 text-center bg-gray-50 dark:bg-zinc-950 rounded-xl">Aucun produit trouvé.</div>
            ) : (
              filteredArticles.map(a => (
                <button
                  key={a.id}
                  onClick={() => handleSelectArticle(a)}
                  className="w-full text-left p-4 bg-gray-50 dark:bg-zinc-950 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl flex justify-between items-center transition-colors"
                >
                  <div>
                    <div className="font-bold text-gray-900 dark:text-zinc-50">{a.designation}</div>
                    <div className="text-sm text-gray-500 dark:text-zinc-400">{a.reference}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-zinc-400">Stock DB</div>
                    <div className="font-black text-gray-900 dark:text-zinc-50">{a.stockActuel}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Article Sélectionné */}
      {selectedArticle && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border-2 border-blue-500 shadow-xl space-y-6 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-bold mb-2">
                <Box className="w-3.5 h-3.5" /> {selectedArticle.categorie}
              </div>
              <h3 className="font-black text-xl text-gray-900 dark:text-zinc-50">{selectedArticle.designation}</h3>
              <p className="text-gray-500 dark:text-zinc-400 font-mono mt-1">{selectedArticle.reference}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 text-center">
              <div className="text-sm text-gray-500 dark:text-zinc-400 font-medium mb-1">Stock Informatique</div>
              <div className="text-3xl font-black text-gray-900 dark:text-zinc-50">{selectedArticle.stockActuel}</div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center relative">
              <div className="text-sm text-blue-700 font-bold mb-1">Stock Réel Constaté</div>
              <input 
                type="number" 
                min="0"
                value={vraiStock}
                onChange={e => setVraiStock(e.target.value)}
                placeholder="?"
                className="w-full text-center text-3xl font-black bg-transparent border-b-2 border-blue-300 focus:border-blue-600 focus:ring-0 p-0 text-blue-900 placeholder:text-blue-200"
                autoFocus
              />
            </div>
          </div>

          {success && (
            <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 p-3 rounded-lg flex items-center justify-center gap-2 font-bold animate-pulse">
              <CheckCircle2 className="w-5 h-5" /> Stock mis à jour avec succès !
            </div>
          )}

          <button
            onClick={handleValiderCorrection}
            disabled={isSubmitting || vraiStock === ""}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all flex items-center justify-center"
          >
            {isSubmitting ? "Enregistrement..." : "Valider la correction"}
          </button>
        </div>
      )}

    </div>
  )
}
