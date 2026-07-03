"use client"

import { useState } from "react"
import { Search, Plus, Trash2, CheckCircle2 } from "lucide-react"
import { validerDepartMatin } from "@/app/actions/depart"

type Article = { id: string, designation: string, reference: string, stockActuel: number }
type Chantier = { id: string, nom: string }

export function DepartMatinClient({ chantiers, articles, username }: { chantiers: Chantier[], articles: Article[], username: string }) {
  const [chantierId, setChantierId] = useState<string>("")
  const [search, setSearch] = useState("")
  const [panier, setPanier] = useState<{article: Article, quantite: number}[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const filteredArticles = articles.filter(a => 
    a.designation.toLowerCase().includes(search.toLowerCase()) || 
    a.reference.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5) // Garder que 5 résultats pour fluidité mobile

  const addToPanier = (article: Article) => {
    const existing = panier.find(p => p.article.id === article.id)
    if (existing) {
      setPanier(panier.map(p => p.article.id === article.id ? { ...p, quantite: p.quantite + 1 } : p))
    } else {
      setPanier([...panier, { article, quantite: 1 }])
    }
    setSearch("")
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
    
    const res = await validerDepartMatin({ chantierId, username, lignes })
    if (res?.error) {
      alert(res.error)
      setIsSubmitting(false)
    } else {
      setSuccess(true)
      setPanier([])
      setChantierId("")
      setIsSubmitting(false)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <div className="space-y-6">
      
      {success && (
        <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 font-bold shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" /> Départ validé et enregistré ! Bon chantier !
        </div>
      )}

      {/* 1. Choix du Chantier */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border shadow-sm space-y-4">
        <h2 className="font-bold text-gray-900 text-lg">1. Pour quel chantier ?</h2>
        <select 
          className="w-full border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-900 text-lg focus:ring-blue-500 focus:border-blue-500"
          value={chantierId}
          onChange={e => setChantierId(e.target.value)}
        >
          <option value="">-- Sélectionner le chantier --</option>
          {chantiers.map(c => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </div>

      {/* 2. Ajout Matériel */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border shadow-sm space-y-4">
        <h2 className="font-bold text-gray-900 text-lg">2. Qu'as-tu pris ?</h2>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un produit (ex: câble, disjoncteur)..."
            className="block w-full pl-10 rounded-lg border-gray-300 p-3 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 text-lg"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {search && (
          <div className="border rounded-lg divide-y bg-white overflow-hidden shadow-lg">
            {filteredArticles.length === 0 ? (
              <div className="p-3 text-gray-500 text-center">Aucun produit trouvé en stock.</div>
            ) : (
              filteredArticles.map(a => (
                <button
                  key={a.id}
                  className="w-full text-left p-3 hover:bg-blue-50 flex justify-between items-center transition-colors"
                  onClick={() => addToPanier(a)}
                >
                  <div>
                    <div className="font-bold text-gray-900">{a.designation}</div>
                    <div className="text-xs text-gray-500">{a.reference} - En stock: {a.stockActuel}</div>
                  </div>
                  <Plus className="w-5 h-5 text-blue-600" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Panier */}
        {panier.length > 0 && (
          <div className="mt-6 border rounded-xl overflow-hidden divide-y bg-gray-50">
            {panier.map(p => (
              <div key={p.article.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{p.article.designation}</div>
                  <div className="text-xs text-gray-500">{p.article.reference}</div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <input 
                    type="number" 
                    min="1" 
                    value={p.quantite}
                    onChange={(e) => updateQty(p.article.id, parseInt(e.target.value) || 1)}
                    className="w-20 text-center border-gray-300 rounded-lg p-2 font-bold text-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button onClick={() => remove(p.article.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Validation */}
      <button
        onClick={handleValider}
        disabled={isSubmitting || panier.length === 0 || !chantierId}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl p-4 sm:p-5 rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? "Enregistrement..." : "Valider mon départ"}
      </button>

    </div>
  )
}
