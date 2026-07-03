"use client"

import { useState } from "react"
import { Search, Plus, Trash2, CheckCircle2, ScanBarcode, Box, Truck } from "lucide-react"
import { validerDepartMatin } from "@/app/actions/depart"
import { BarcodeScanner } from "@/components/BarcodeScanner"

type Article = { id: string, designation: string, reference: string, codeBarre: string | null, stockActuel: number, stockMinimum: number }
type Chantier = { id: string, nom: string }

export function DepartMatinClient({ chantiers, articles, username }: { chantiers: Chantier[], articles: Article[], username: string }) {
  const [chantierId, setChantierId] = useState<string>("")
  const [search, setSearch] = useState("")
  const [panier, setPanier] = useState<{article: Article, quantite: number}[]>([])
  const [observation, setObservation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [mode, setMode] = useState<"DEPART" | "VERIF">("DEPART")

  const filteredArticles = articles.filter(a => 
    a.designation.toLowerCase().includes(search.toLowerCase()) || 
    a.reference.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5)

  const addToPanier = (article: Article) => {
    const existing = panier.find(p => p.article.id === article.id)
    if (existing) {
      setPanier(panier.map(p => p.article.id === article.id ? { ...p, quantite: p.quantite + 1 } : p))
    } else {
      setPanier([...panier, { article, quantite: 1 }])
    }
    setSearch("")
  }

  const handleScan = (decodedText: string) => {
    const found = articles.find(a => a.codeBarre === decodedText || a.reference === decodedText)
    if (found) {
      if (mode === "DEPART") {
        addToPanier(found)
      } else {
        setSearch(found.reference)
        setIsScanning(false)
      }
    } else {
      alert("Code barre introuvable en stock : " + decodedText)
    }
  }

  const remove = (id: string) => setPanier(panier.filter(p => p.article.id !== id))
  
  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return
    setPanier(panier.map(p => p.article.id === id ? { ...p, quantite: qty } : p))
  }

  const handleValider = async () => {
    if (!chantierId) return alert("Veuillez sélectionner un chantier.")
    if (panier.length === 0) return alert("Votre liste est vide.")
    
    setIsSubmitting(true)
    const lignes = panier.map(p => ({ articleId: p.article.id, quantite: p.quantite }))
    
    const res = await validerDepartMatin({ chantierId, username, observation, lignes })
    if (res?.error) {
      alert(res.error)
      setIsSubmitting(false)
    } else {
      setSuccess(true)
      setPanier([])
      setChantierId("")
      setObservation("")
      setIsSubmitting(false)
      setTimeout(() => setSuccess(false), 4000)
    }
  }

  if (isScanning) {
    return (
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <BarcodeScanner onScan={handleScan} onClose={() => setIsScanning(false)} />
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm text-center">
          Scannez le code-barres de l'article pour l'ajouter automatiquement au panier.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Sélecteur de Mode */}
      <div className="flex bg-gray-200 p-1 rounded-xl">
        <button 
          onClick={() => setMode("DEPART")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mode === "DEPART" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Départ Chantier
        </button>
        <button 
          onClick={() => setMode("VERIF")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mode === "VERIF" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Vérifier un Stock
        </button>
      </div>

      {success && mode === "DEPART" && (
        <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 font-bold shadow-sm animate-pulse">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" /> 
          Tout est enregistré ! Bon courage sur le chantier {username} !
        </div>
      )}

      {mode === "VERIF" && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Box className="w-5 h-5 text-blue-600"/> Que cherches-tu ?
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
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Ex: câble, disjoncteur..."
              className="block w-full pl-12 rounded-xl border-gray-300 p-4 bg-gray-50 focus:bg-white focus:ring-blue-500 focus:border-blue-500 text-lg transition-colors"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {search && (
            <div className="mt-4 space-y-3">
              {filteredArticles.length === 0 ? (
                <div className="p-4 text-gray-500 text-center font-medium bg-gray-50 rounded-xl">Aucun produit trouvé en stock.</div>
              ) : (
                filteredArticles.map(a => (
                  <div key={a.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-900 text-lg">{a.designation}</div>
                      <div className="text-sm text-gray-500">{a.reference}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500 mb-1">En Stock</span>
                      <span className={`font-black text-xl px-3 py-1 rounded-lg ${
                        a.stockActuel <= 0 ? 'bg-red-100 text-red-700' :
                        a.stockActuel <= a.stockMinimum ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>{a.stockActuel}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* 1. Choix du Chantier */}
      {mode === "DEPART" && (
        <>
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-600"/> 1. Pour quel chantier ?
        </h2>
        <select 
          className="w-full border-gray-300 rounded-xl p-4 bg-gray-50 text-gray-900 text-lg font-medium focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          value={chantierId}
          onChange={e => setChantierId(e.target.value)}
        >
          <option value="">-- Sélectionner un chantier --</option>
          {chantiers.map(c => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </div>

      {/* 2. Ajout Matériel */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Box className="w-5 h-5 text-blue-600"/> 2. Qu'as-tu pris ?
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
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Ou recherche manuelle (câble...)"
            className="block w-full pl-12 rounded-xl border-gray-300 p-4 bg-gray-50 focus:bg-white focus:ring-blue-500 focus:border-blue-500 text-lg transition-colors"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {search && (
          <div className="border border-gray-200 rounded-xl divide-y bg-white overflow-hidden shadow-lg mt-2">
            {filteredArticles.length === 0 ? (
              <div className="p-4 text-gray-500 text-center font-medium">Aucun produit trouvé en stock.</div>
            ) : (
              filteredArticles.map(a => (
                <button
                  key={a.id}
                  className="w-full text-left p-4 hover:bg-blue-50 flex justify-between items-center transition-colors"
                  onClick={() => addToPanier(a)}
                >
                  <div>
                    <div className="font-bold text-gray-900">{a.designation}</div>
                    <div className="text-sm text-gray-500 mt-1">{a.reference}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500 mb-1">Stock dispo</span>
                    <span className="font-black text-blue-600 bg-blue-100 px-2 py-1 rounded-md">{a.stockActuel}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Panier */}
        {panier.length > 0 && (
          <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden divide-y bg-gray-50 shadow-inner">
            {panier.map(p => {
              const stockRestant = p.article.stockActuel - p.quantite;
              const isLowStock = stockRestant <= p.article.stockMinimum;
              const isZeroStock = stockRestant < 0;

              return (
                <div key={p.article.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-gray-50/50 transition-colors">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-lg">{p.article.designation}</div>
                    <div className="text-sm text-gray-500">{p.article.reference}</div>
                    
                    {/* Indicateur de stock en temps réel */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Reste au dépôt :</span>
                      {isZeroStock ? (
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md">Stock insuffisant ({stockRestant}) !</span>
                      ) : isLowStock ? (
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md">{stockRestant} (Alerte réassort)</span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">{stockRestant}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 self-end sm:self-auto bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <input 
                      type="number" 
                      min="1" 
                      value={p.quantite}
                      onChange={(e) => updateQty(p.article.id, parseInt(e.target.value) || 1)}
                      className="w-20 text-center border-gray-300 rounded-lg p-2 font-black text-xl text-blue-700 bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    />
                    <button onClick={() => remove(p.article.id)} className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors">
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. Commentaire */}
      {panier.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <label className="font-bold text-gray-900 text-lg">📝 Un commentaire sur ce départ ? (Optionnel)</label>
          <textarea 
            rows={2}
            placeholder="Ex: Reste plus beaucoup de vis au dépôt, ou: Matériel pour l'étage..."
            className="w-full border-gray-300 rounded-xl p-3 bg-gray-50 text-gray-900 focus:ring-blue-500 focus:border-blue-500 resize-none"
            value={observation}
            onChange={e => setObservation(e.target.value)}
          />
        </div>
      )}

      {/* 4. Validation */}
      <div className="sticky bottom-4 z-10 pt-4">
        <button
          onClick={handleValider}
          disabled={isSubmitting || panier.length === 0 || !chantierId}
          className="w-full bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-xl p-5 rounded-2xl shadow-xl shadow-emerald-600/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 border border-emerald-400"
        >
          {isSubmitting ? "Enregistrement en cours..." : "✅ Valider mon départ"}
        </button>
      </div>
      </>
      )}

    </div>
  )
}
