"use client"

import { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  Scale,
  PlusCircle,
  Edit3,
  X,
  Save,
  Search,
  ScanBarcode,
  Minus,
  Plus,
} from "lucide-react"
import { corrigerStock } from "@/app/actions/mouvements"
import {
  creerArticleEtStock,
  updateInfosRapides,
  rechercherArticlesCatalogue,
  trouverArticleParCodeBarre,
} from "@/app/actions/articles"
import { SupplierBadge } from "./SupplierBadge"

// Dynamic import with SSR false to prevent 'window is not defined' during build
const BarcodeScanner = dynamic(() => import("./BarcodeScanner").then((mod) => mod.BarcodeScanner), { ssr: false })

export function InventaireForm({ articles }: { articles: any[] }) {
  const [isScanning, setIsScanning] = useState(false)
  const [mode, setMode] = useState<"idle" | "known" | "unknown">("idle")
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [selectedArticleId, setSelectedArticleId] = useState("")
  const [scanError, setScanError] = useState<string | null>(null)

  // Real quantity input
  const [quantiteReelle, setQuantiteReelle] = useState<string>("")
  const [observation, setObservation] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Search state + résultats dynamiques du catalogue complet (78 000+ réf.)
  const [searchQuery, setSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [remoteArticles, setRemoteArticles] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Quick edit mode (for known articles)
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [editDesignation, setEditDesignation] = useState("")
  const [editFournisseur, setEditFournisseur] = useState("")
  const [editReference, setEditReference] = useState("")

  // Create mode (for unknown articles)
  const [newDesignation, setNewDesignation] = useState("")
  const [newFournisseur, setNewFournisseur] = useState("")

  const allKnownArticles = useMemo(() => {
    const map = new Map<string, any>()
    for (const a of articles) map.set(a.id, a)
    for (const a of remoteArticles) map.set(a.id, a)
    return Array.from(map.values())
  }, [articles, remoteArticles])

  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 2) return
    let cancelled = false
    const timer = setTimeout(() => {
      setIsSearching(true)
      rechercherArticlesCatalogue(q, 40)
        .then((res) => {
          if (!cancelled && res.length > 0) {
            setRemoteArticles((prev) => {
              const map = new Map<string, any>()
              for (const a of prev) map.set(a.id, a)
              for (const a of res) map.set(a.id, a)
              return Array.from(map.values())
            })
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setIsSearching(false)
        })
    }, 180)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchQuery])

  const filteredDropdownArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return allKnownArticles.slice(0, 50)
    return allKnownArticles
      .filter(
        (a) =>
          a.designation?.toLowerCase().includes(q) ||
          a.reference?.toLowerCase().includes(q) ||
          a.referenceFournisseur?.toLowerCase().includes(q) ||
          a.codeBarre?.toLowerCase().includes(q)
      )
      .slice(0, 50)
  }, [allKnownArticles, searchQuery])

  const selectedArticle = useMemo(() => {
    return allKnownArticles.find((a) => a.id === selectedArticleId)
  }, [selectedArticleId, allKnownArticles])

  const stockTheorique = useMemo(() => {
    if (!selectedArticle || !selectedArticle.stockInfo) return 0
    return selectedArticle.stockInfo.stockDepot
  }, [selectedArticle])

  const ecart = useMemo(() => {
    if (quantiteReelle === "") return null
    return parseInt(quantiteReelle, 10) - stockTheorique
  }, [quantiteReelle, stockTheorique])

  const handleScan = async (code: string) => {
    setIsScanning(false)
    setScanError(null)
    setSuccessMessage(null)
    setObservation("")
    setQuantiteReelle("")
    setIsEditingInfo(false)

    const trimmedCode = code.trim()
    let article = allKnownArticles.find(
      (a) => a.codeBarre === trimmedCode || a.reference === trimmedCode
    )
    if (!article) {
      try {
        const found = await trouverArticleParCodeBarre(trimmedCode)
        if (found) {
          article = found
          setRemoteArticles((prev) => [...prev, found])
        }
      } catch {
        // Hors-ligne ou introuvable
      }
    }

    if (article) {
      setSelectedArticleId(article.id)
      setMode("known")
      setEditDesignation(article.designation)
      setEditFournisseur(article.fournisseur || "")
      setEditReference(article.reference || "")
    } else {
      setScannedCode(trimmedCode)
      setMode("unknown")
      setSelectedArticleId("")
      setNewDesignation("")
      setNewFournisseur("")
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
    setMode("idle")
    setSelectedArticleId("")
    setQuantiteReelle("")
    setObservation("")
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
    setMode("idle")
    setScannedCode(null)
    setQuantiteReelle("")
    setObservation("")
    setIsSubmitting(false)
  }

  return (
    <div className="prestige-card rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs overflow-hidden">
      {/* En-tête Prestige de la carte */}
      <div className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-center">
            <ScanBarcode className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Scan & Go — Réconciliation</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Lecture optique EAN ou recherche directe</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsScanning(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 tactile-btn"
        >
          <Camera className="w-4 h-4" />
          <span>Scanner Code</span>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {scanError && (
          <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 p-3.5 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
            <span>{scanError}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-3.5 rounded-xl text-xs font-semibold border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Sélection Manuelle (si pas de scan) */}
        {mode === "idle" && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Ou sélectionner manuellement une référence :
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 220)}
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#161d2d] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#161d2d] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm font-medium transition-all"
                  placeholder="Rechercher par référence, désignation, code-barres..."
                />

                {showDropdown && (
                  <div className="absolute z-20 w-full mt-1.5 bg-white dark:bg-[#111622] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {filteredDropdownArticles.map((a) => {
                      const depot = a.stockInfo?.stockDepot ?? 0
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setSelectedArticleId(a.id)
                            setMode("known")
                            setEditDesignation(a.designation)
                            setEditFournisseur(a.fournisseur || "")
                            setEditReference(a.reference || "")
                            setQuantiteReelle("")
                            setObservation("")
                            setSuccessMessage(null)
                            setIsEditingInfo(false)
                            setSearchQuery("")
                            setShowDropdown(false)
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                              {a.designation}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[11px] font-mono text-slate-400">
                                Réf: {a.reference || "Aucune"}
                              </span>
                              {a.fournisseur && (
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                  • {a.fournisseur}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold tabular-nums border ${
                              depot > 0
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40"
                                : "bg-slate-100 text-slate-500 border-slate-200/70 dark:bg-white/[0.04] dark:text-slate-400 dark:border-white/10"
                            }`}
                          >
                            {depot} {a.unite || "u"}
                          </span>
                        </button>
                      )
                    })}
                    {filteredDropdownArticles.length === 0 && (
                      <div className="px-4 py-5 text-xs text-slate-400 dark:text-slate-500 text-center">
                        {isSearching ? "Recherche dans les 78 000+ articles..." : "Aucun article trouvé."}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsScanning(true)}
              className="w-full text-center text-slate-400 dark:text-slate-500 p-8 border border-dashed border-slate-200 dark:border-white/[0.08] hover:border-purple-400 dark:hover:border-purple-500/40 rounded-2xl bg-slate-50/40 dark:bg-white/[0.015] hover:bg-purple-50/20 dark:hover:bg-purple-950/15 transition-all group cursor-pointer"
            >
              <div className="h-14 w-14 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                <Camera className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Scannez un produit avec le bouton « Scanner Code »
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                S&apos;il est inconnu, l&apos;application vous proposera de le créer immédiatement.
              </p>
            </button>
          </div>
        )}

        {/* MODE CONNU : Mise à jour du stock et des infos */}
        {mode === "known" && selectedArticle && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 text-[11px] font-bold px-2.5 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 live-dot" />
                Article Identifié
              </span>
              <button
                type="button"
                onClick={() => setMode("idle")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Changer d&apos;article</span>
              </button>
            </div>

            {/* Fiche Info Prestige */}
            <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-200/60 dark:border-white/[0.06] flex justify-between items-start gap-3 bg-white dark:bg-[#111622]">
                <div className="space-y-1 min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                    {selectedArticle.designation}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">
                      Réf: {selectedArticle.reference}
                    </span>
                    <SupplierBadge
                      name={selectedArticle.fournisseur}
                      marque={selectedArticle.marque}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(!isEditingInfo)}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Modifier les informations"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {isEditingInfo && (
                <div className="p-4 space-y-3 bg-purple-50/40 dark:bg-purple-950/20 border-b border-slate-200/60 dark:border-white/[0.06]">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Désignation
                    </label>
                    <input
                      type="text"
                      value={editDesignation}
                      onChange={(e) => setEditDesignation(e.target.value)}
                      className="block w-full rounded-xl bg-white dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs px-3 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Fournisseur
                      </label>
                      <input
                        type="text"
                        value={editFournisseur}
                        onChange={(e) => setEditFournisseur(e.target.value)}
                        className="block w-full rounded-xl bg-white dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Réf. Interne
                      </label>
                      <input
                        type="text"
                        value={editReference}
                        onChange={(e) => setEditReference(e.target.value)}
                        className="block w-full rounded-xl bg-white dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs px-3 py-2"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpdateInfo}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Sauvegarder les infos
                  </button>
                </div>
              )}

              <div className="p-4 grid grid-cols-2 gap-4 text-center divide-x divide-slate-200/60 dark:divide-white/[0.06]">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    Stock Théorique Dépôt
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {stockTheorique}{" "}
                    <span className="text-xs font-semibold text-slate-400">
                      {selectedArticle.unite || "u"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    Code-Barres EAN
                  </p>
                  <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 mt-2">
                    {selectedArticle.codeBarre || "Non renseigné"}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                  Quantité Physique Réelle Comptée
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const current = quantiteReelle === "" ? stockTheorique : parseInt(quantiteReelle, 10) || 0
                      setQuantiteReelle(String(Math.max(0, current - 1)))
                    }}
                    className="h-14 w-14 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#161d2d] hover:bg-slate-100 dark:hover:bg-white/[0.08] flex items-center justify-center text-slate-700 dark:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    required
                    type="number"
                    min="0"
                    value={quantiteReelle}
                    onChange={(e) => setQuantiteReelle(e.target.value)}
                    placeholder={`${stockTheorique}`}
                    className="block flex-1 rounded-xl border border-purple-300 dark:border-purple-500/40 bg-slate-50 dark:bg-[#161d2d] px-4 py-3.5 text-2xl font-black text-center text-slate-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const current = quantiteReelle === "" ? stockTheorique : parseInt(quantiteReelle, 10) || 0
                      setQuantiteReelle(String(current + 1))
                    }}
                    className="h-14 w-14 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#161d2d] hover:bg-slate-100 dark:hover:bg-white/[0.08] flex items-center justify-center text-slate-700 dark:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Observation / Motif de l&apos;écart (Optionnel)
                </label>
                <input
                  type="text"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ex: Trouvé dans un autre carton, boîte entamée..."
                  className="block w-full rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs px-3.5 py-2.5"
                />
              </div>

              {ecart !== null && (
                <div
                  className={`rounded-xl p-3.5 border flex items-center justify-between ${
                    ecart === 0
                      ? "bg-emerald-50/70 border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-800/40"
                      : ecart > 0
                      ? "bg-blue-50/70 border-blue-200/80 dark:bg-blue-950/40 dark:border-blue-800/40"
                      : "bg-amber-50/70 border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Scale
                      className={`w-4 h-4 ${
                        ecart === 0
                          ? "text-emerald-500"
                          : ecart > 0
                          ? "text-blue-500"
                          : "text-amber-500"
                      }`}
                    />
                    <p
                      className={`text-xs font-bold ${
                        ecart === 0
                          ? "text-emerald-700 dark:text-emerald-300"
                          : ecart > 0
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {ecart === 0
                        ? "Stock conforme (aucun écart)"
                        : `Écart d'inventaire : ${ecart > 0 ? "+" : ""}${ecart} ${selectedArticle.unite || "u"}`}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || ecart === null || ecart === 0}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 px-4 py-3.5 text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer tactile-btn"
              >
                {isSubmitting ? "Enregistrement..." : "Valider et Corriger le Stock"}
              </button>
            </form>
          </div>
        )}

        {/* MODE INCONNU : Création Rapide */}
        {mode === "unknown" && scannedCode && (
          <form
            onSubmit={handleSubmitCreation}
            className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <div className="flex justify-between items-center">
              <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Nouveau Produit Détecté
              </span>
              <button
                type="button"
                onClick={() => setMode("idle")}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50/70 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Code-Barres scanné
                </label>
                <div className="mt-1 px-3 py-2 bg-white dark:bg-[#161d2d] text-slate-800 dark:text-slate-200 rounded-xl text-xs font-mono border border-slate-200/80 dark:border-white/[0.08]">
                  {scannedCode}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Nom du Produit (Désignation) *
                </label>
                <input
                  required
                  type="text"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  placeholder="Ex: Câble R2V 3G1.5 Couronne 100m"
                  className="block w-full rounded-xl bg-white dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Fournisseur
                </label>
                <input
                  type="text"
                  value={newFournisseur}
                  onChange={(e) => setNewFournisseur(e.target.value)}
                  placeholder="Ex: Rexel, Sonepar, Legrand..."
                  className="block w-full rounded-xl bg-white dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Quantité Actuelle Comptée *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={quantiteReelle}
                  onChange={(e) => setQuantiteReelle(e.target.value)}
                  placeholder="Ex: 5"
                  className="block w-full rounded-xl border border-amber-300 dark:border-amber-500/40 bg-white dark:bg-[#161d2d] px-4 py-3 text-xl font-bold text-center text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Observation (Optionnel)
                </label>
                <input
                  type="text"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ex: Palette au fond du dépôt"
                  className="block w-full rounded-xl bg-white dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs px-3 py-2.5"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newDesignation || !quantiteReelle}
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-3.5 text-xs font-bold text-white disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                "Création..."
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> Créer & Ajouter au Stock
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {isScanning && (
        <BarcodeScanner onScan={handleScan} onClose={() => setIsScanning(false)} />
      )}
    </div>
  )
}
