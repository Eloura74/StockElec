"use client"

import { useState } from "react"
import { Plus, Minus, Search, ScanBarcode, Box, Truck, CheckCircle2, RotateCcw, Trash2 } from "lucide-react"
import { validerDepartMatin } from "@/app/actions/depart"
import { validerRetourChantier } from "@/app/actions/retour"
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
  const [mode, setMode] = useState<"DEPART" | "VERIF" | "RETOUR">("DEPART")

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
      if (mode === "DEPART" || mode === "RETOUR") {
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
    try {
      const data = {
        chantierId,
        username,
        lignes: panier.map(item => ({ articleId: item.article.id, quantite: item.quantite })),
        observation
      }
      
      let res;
      if (mode === "DEPART") {
        res = await validerDepartMatin(data)
      } else {
        res = await validerRetourChantier(data)
      }

      if (res.success) {
        setSuccess(true)
        setPanier([])
        setChantierId("")
        setObservation("")
        setTimeout(() => setSuccess(false), 5000)
      } else {
        alert("Erreur: " + res.error)
      }
    } catch (e: any) {
      alert("Erreur de connexion")
    }
    setIsSubmitting(false)
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
      <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl ring-1 ring-white/5 shadow-inner">
        <button 
          onClick={() => setMode("DEPART")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${mode === "DEPART" ? "bg-zinc-800 text-white shadow-md ring-1 ring-white/10" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          Départ
        </button>
        <button 
          onClick={() => setMode("RETOUR")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${mode === "RETOUR" ? "bg-zinc-800 text-white shadow-md ring-1 ring-white/10" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          Retour
        </button>
        <button 
          onClick={() => setMode("VERIF")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${mode === "VERIF" ? "bg-zinc-800 text-white shadow-md ring-1 ring-white/10" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          Stock
        </button>
      </div>

      {success && (mode === "DEPART" || mode === "RETOUR") && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 font-medium shadow-lg animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" /> 
          Tout est enregistré ! Bon courage sur le chantier {username} !
        </div>
      )}

      {mode === "VERIF" && (
        <div className="bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white text-lg flex items-center gap-2">
              <Box className="w-5 h-5 text-indigo-400"/> Que cherches-tu ?
            </h2>
            <button 
              onClick={() => setIsScanning(true)}
              className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 ring-1 ring-indigo-500/30 px-4 py-2 rounded-xl font-medium text-sm transition-colors"
            >
              <ScanBarcode className="w-5 h-5" /> Scanner
            </button>
          </div>
          
          <div className="relative mt-2">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Ex: câble, disjoncteur..."
              className="block w-full pl-12 rounded-2xl border-0 ring-1 ring-inset ring-white/10 p-4 bg-zinc-950 text-white placeholder:text-zinc-600 focus:bg-zinc-900 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-lg transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {search && (
            <div className="mt-4 space-y-3">
              {filteredArticles.length === 0 ? (
                <div className="p-4 text-zinc-500 text-center font-medium bg-zinc-950/50 rounded-2xl ring-1 ring-white/5">Aucun produit trouvé en stock.</div>
              ) : (
                filteredArticles.map(a => (
                  <div key={a.id} className="p-4 bg-zinc-800 border border-white/5 shadow-sm rounded-2xl flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white text-lg">{a.designation}</div>
                      <div className="text-sm text-zinc-400">{a.reference}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-zinc-500 font-medium mb-1 tracking-wider uppercase">En Stock</span>
                      <span className={`font-black text-xl px-4 py-1.5 rounded-xl ${
                        a.stockActuel <= 0 ? 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20' :
                        a.stockActuel <= a.stockMinimum ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
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
      {(mode === "DEPART" || mode === "RETOUR") && (
        <>
          <div className="bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
        <h2 className="font-semibold text-white text-lg flex items-center gap-2">
          {mode === "DEPART" ? <Truck className="w-5 h-5 text-indigo-400"/> : <RotateCcw className="w-5 h-5 text-emerald-400"/>} 
          1. {mode === "DEPART" ? "Pour quel chantier ?" : "De quel chantier viens-tu ?"}
        </h2>
        <select 
          className="w-full border-0 ring-1 ring-inset ring-white/10 rounded-2xl p-4 bg-zinc-950 text-white text-lg font-medium focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-shadow appearance-none"
          value={chantierId}
          onChange={(e) => setChantierId(e.target.value)}
        >
          <option value="">-- Choisir un chantier --</option>
          {chantiers.map(c => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </div>

      {/* 2. Ajout de Matériel */}
      <div className={`transition-all duration-500 ${!chantierId ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
        <div className="bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white text-lg flex items-center gap-2">
              <Box className="w-5 h-5 text-indigo-400"/> 2. Matériel
            </h2>
            <button 
              onClick={() => setIsScanning(true)}
              className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 ring-1 ring-indigo-500/30 px-4 py-2 rounded-xl font-medium text-sm transition-colors"
            >
              <ScanBarcode className="w-5 h-5" /> Scanner
            </button>
          </div>
          
          <div className="relative mt-2">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Ou taper un nom..."
              className="block w-full pl-12 rounded-2xl border-0 ring-1 ring-inset ring-white/10 p-4 bg-zinc-950 text-white placeholder:text-zinc-600 focus:bg-zinc-900 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-lg transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          {search && (
            <div className="mt-4 space-y-2">
              {filteredArticles.slice(0, 5).map(a => (
                <button
                  key={a.id}
                  onClick={() => addToPanier(a)}
                  className="w-full text-left p-4 bg-zinc-800 border border-white/5 shadow-sm hover:border-indigo-500/50 rounded-2xl flex justify-between items-center transition-colors group"
                >
                  <div>
                    <div className="font-semibold text-white">{a.designation}</div>
                    <div className="text-sm text-zinc-400">{a.reference}</div>
                  </div>
                  <Plus className="text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Panier & Observation */}
      {panier.length > 0 && (
        <div className="space-y-4">
          <div className="bg-zinc-900 rounded-3xl border border-white/5 shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in">
            <div className="p-4 bg-zinc-900/80 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-semibold text-white">Dans ma liste</h3>
              <span className="bg-indigo-500/20 text-indigo-400 text-xs font-bold px-2 py-1 rounded-full">{panier.length} article(s)</span>
            </div>
            <div className="divide-y divide-white/5">
              {panier.map(item => (
                <div key={item.article.id} className="p-4 bg-zinc-800 flex justify-between items-center">
                  <div className="flex-1 pr-4">
                    <div className="font-semibold text-white text-sm">{item.article.designation}</div>
                    <div className="text-xs text-zinc-400">{item.article.reference}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQty(item.article.id, item.quantite - 1)} className="p-2 rounded-xl bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 transition-colors ring-1 ring-white/5">
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="font-black text-xl w-8 text-center text-white">{item.quantite}</span>
                    <button onClick={() => updateQty(item.article.id, item.quantite + 1)} className="p-2 rounded-xl bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 transition-colors ring-1 ring-white/5">
                      <Plus className="w-5 h-5" />
                    </button>
                    <button onClick={() => remove(item.article.id)} className="p-2 text-rose-500/70 hover:text-rose-400 transition-colors ml-2">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <textarea
              placeholder="Un commentaire ? (ex: pris dans l'étagère du haut...)"
              className="w-full rounded-2xl border-0 ring-1 ring-inset ring-white/10 p-4 bg-zinc-900 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-all resize-none shadow-sm"
              rows={2}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* 4. Validation */}
      <div className="sticky bottom-6 z-10 pt-4 pb-2">
        <button
          onClick={handleValider}
          disabled={isSubmitting || panier.length === 0 || !chantierId}
          className={`w-full text-white font-semibold text-lg p-4 rounded-2xl shadow-xl disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 ${
            mode === 'DEPART' 
            ? 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] ring-1 ring-indigo-500'
            : 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500'
          }`}
        >
          {isSubmitting ? "Enregistrement en cours..." : (mode === "DEPART" ? "Valider le départ" : "Valider le retour")}
        </button>
      </div>
      </>
      )}

    </div>
  )
}
