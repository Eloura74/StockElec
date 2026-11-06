"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Plus, Minus, Search, ScanBarcode, Box, Truck, CheckCircle2, RotateCcw, Trash2, Wrench, PackagePlus, HardHat, TriangleAlert } from "lucide-react"
import { validerDepartMatin } from "@/app/actions/depart"
import { validerRetourChantier, type TypeMouvementChantier } from "@/app/actions/retour"
import { BarcodeScanner } from "@/components/BarcodeScanner"
import { EmpruntOutillageForm } from "@/components/EmpruntOutillageForm"
import { ArticlesChefPanel, type ArticleChef } from "@/components/ArticlesChefPanel"
import {
  appliquerOperationsOptimistes,
  enqueueOfflineOperation,
  getOfflineSnapshot,
  listOutboxOperations,
  saveOfflineSnapshot,
  OFFLINE_CHANGE_EVENT,
  type OfflineOperation,
  type OfflineSnapshot,
} from "@/lib/offline-sync"
import { toast } from "sonner"

type Article = ArticleChef
type Chantier = { id: string; nom: string }
type LignePanier = {
  article: Article
  quantite: number
  /** Utilisé en mode RETOUR : "Retour" (au dépôt), "Consomme" (posé sur chantier) ou "Perte". */
  typeRetour: TypeMouvementChantier
}

const LABELS_RETOUR: Record<TypeMouvementChantier, { court: string; badge: string }> = {
  Retour: {
    court: "Retour dépôt",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
  },
  Consomme: {
    court: "Posé / Consommé",
    badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30",
  },
  Perte: {
    court: "Perdu / Cassé",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30",
  },
}

export function DepartMatinClient({
  chantiers,
  articles,
  outillages,
  deployeParChantier = {},
  username,
}: {
  chantiers: Chantier[]
  articles: Article[]
  outillages: unknown[]
  deployeParChantier?: Record<string, Record<string, number>>
  username: string
}) {
  const [chantierId, setChantierId] = useState<string>("")
  const [search, setSearch] = useState("")
  const [panier, setPanier] = useState<LignePanier[]>([])
  const [observation, setObservation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [mode, setMode] = useState<"DEPART" | "VERIF" | "RETOUR" | "OUTILLAGE" | "ARTICLES">("DEPART")
  const [lastAdded, setLastAdded] = useState<string | null>(null)
  const [lastScannedId, setLastScannedId] = useState<string | null>(null)

  const [chantierSearchQuery, setChantierSearchQuery] = useState("")
  const [showChantierDropdown, setShowChantierDropdown] = useState(false)
  const [pendingOps, setPendingOps] = useState<OfflineOperation[]>([])
  const [cachedSnapshot, setCachedSnapshot] = useState<OfflineSnapshot | null>(null)

  // Sauvegarde du dernier catalogue connu en mémoire locale (IndexedDB) + repli si démarrage hors-ligne
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.onLine && articles.length > 0) {
      saveOfflineSnapshot({
        articles,
        chantiers,
        outillages: outillages as any[],
        deployeParChantier,
      }).catch(() => {})
    } else if (articles.length === 0) {
      getOfflineSnapshot()
        .then((snap) => {
          if (snap) setCachedSnapshot(snap)
        })
        .catch(() => {})
    }
  }, [articles, chantiers, outillages, deployeParChantier])

  useEffect(() => {
    const chargerOutbox = () => {
      listOutboxOperations()
        .then((ops) => setPendingOps(ops))
        .catch(() => {})
    }
    chargerOutbox()
    window.addEventListener(OFFLINE_CHANGE_EVENT, chargerOutbox)
    return () => window.removeEventListener(OFFLINE_CHANGE_EVENT, chargerOutbox)
  }, [])

  const etatOptimiste = useMemo(() => {
    const baseArticles = articles.length > 0 ? articles : cachedSnapshot?.articles ?? []
    const baseOutillages =
      (outillages as any[]).length > 0 ? (outillages as any[]) : cachedSnapshot?.outillages ?? []
    const baseDeploye =
      Object.keys(deployeParChantier).length > 0
        ? deployeParChantier
        : cachedSnapshot?.deployeParChantier ?? {}

    return appliquerOperationsOptimistes(
      {
        articles: baseArticles,
        outillages: baseOutillages,
        deployeParChantier: baseDeploye,
      },
      pendingOps
    )
  }, [articles, outillages, deployeParChantier, cachedSnapshot, pendingOps])

  const articlesEffectifs = etatOptimiste.articles
  const outillagesEffectifs = etatOptimiste.outillages
  const deployeEffectif = etatOptimiste.deployeParChantier

  const articlesRef = useRef(articlesEffectifs)
  const modeRef = useRef(mode)
  useEffect(() => {
    articlesRef.current = articlesEffectifs
  }, [articlesEffectifs])
  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const filteredArticles = useMemo(
    () =>
      articlesEffectifs
        .filter(
          (a) =>
            a.designation.toLowerCase().includes(search.toLowerCase()) ||
            a.reference.toLowerCase().includes(search.toLowerCase()) ||
            (a.codeBarre && a.codeBarre.includes(search.trim()))
        )
        .slice(0, 5),
    [articlesEffectifs, search]
  )

  // Liste des articles actuellement déployés sur le chantier sélectionné (1.3 + état optimiste hors-ligne)
  const materielSurChantier = useMemo(() => {
    if (!chantierId) return []
    const mapChantier = deployeEffectif[chantierId]
    if (!mapChantier) return []
    const parId = new Map(articlesEffectifs.map((a) => [a.id, a]))
    const res: { article: Article; quantiteDeployce: number }[] = []
    for (const [artId, qte] of Object.entries(mapChantier)) {
      if (qte <= 0) continue
      const art = parId.get(artId)
      if (art) res.push({ article: art, quantiteDeployce: qte })
    }
    res.sort((a, b) => a.article.designation.localeCompare(b.article.designation, "fr"))
    return res
  }, [chantierId, deployeEffectif, articlesEffectifs])

  const upsertLignePanier = useCallback(
    (
      article: Article,
      opts: { delta?: number; quantiteFixe?: number; typeRetour?: TypeMouvementChantier; silencieux?: boolean } = {}
    ) => {
      const typeCible: TypeMouvementChantier = opts.typeRetour ?? "Retour"
      setPanier((prev) => {
        const idx = prev.findIndex((p) => p.article.id === article.id)
        if (idx >= 0) {
          const actuel = prev[idx]
          const nouvelleQte =
            opts.quantiteFixe !== undefined ? opts.quantiteFixe : actuel.quantite + (opts.delta ?? 1)
          const prochain = [...prev]
          prochain[idx] = {
            ...actuel,
            quantite: Math.max(1, nouvelleQte),
            typeRetour: opts.typeRetour ?? actuel.typeRetour,
          }
          if (!opts.silencieux) {
            setLastAdded(`✅ ${article.designation} (×${prochain[idx].quantite})`)
          }
          return prochain
        }
        const qteInitiale = Math.max(1, opts.quantiteFixe ?? opts.delta ?? 1)
        if (!opts.silencieux) {
          setLastAdded(`✅ ${article.designation} ajouté (×${qteInitiale})`)
        }
        return [...prev, { article, quantite: qteInitiale, typeRetour: typeCible }]
      })
      setLastScannedId(article.id)
      setSearch("")
      setTimeout(() => setLastAdded(null), 3000)
    },
    []
  )

  const addToPanier = useCallback(
    (article: Article) => {
      upsertLignePanier(article, { delta: 1, typeRetour: "Retour" })
    },
    [upsertLignePanier]
  )

  const handleScan = useCallback(
    (decodedText: string) => {
      const code = decodedText.trim()
      const found = articlesRef.current.find((a) => a.codeBarre === code || a.reference === code)
      if (found) {
        if (modeRef.current === "DEPART" || modeRef.current === "RETOUR") {
          upsertLignePanier(found, { delta: 1 })
        } else {
          setSearch(found.reference)
          setIsScanning(false)
        }
      } else {
        toast.error("Code-barres introuvable en stock : " + code)
      }
    },
    [upsertLignePanier]
  )

  const remove = (id: string) => setPanier((prev) => prev.filter((p) => p.article.id !== id))

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return
    setPanier((prev) => prev.map((p) => (p.article.id === id ? { ...p, quantite: qty } : p)))
  }

  const updateTypeRetour = (id: string, typeRetour: TypeMouvementChantier) => {
    setPanier((prev) => prev.map((p) => (p.article.id === id ? { ...p, typeRetour } : p)))
  }

  const pointerToutChantier = (typeRetour: TypeMouvementChantier) => {
    if (materielSurChantier.length === 0) return
    setPanier((prev) => {
      const map = new Map<string, LignePanier>()
      prev.forEach((p) => map.set(p.article.id, p))
      for (const item of materielSurChantier) {
        map.set(item.article.id, {
          article: item.article,
          quantite: item.quantiteDeployce,
          typeRetour,
        })
      }
      return Array.from(map.values())
    })
    toast.success(
      typeRetour === "Retour"
        ? "Tout le matériel du chantier a été préparé en retour dépôt."
        : "Tout le matériel du chantier a été pointé comme posé/consommé."
    )
  }

  const handleValider = async () => {
    if (!chantierId) return toast.error("Veuillez sélectionner un chantier.")
    if (panier.length === 0) return toast.error("Votre liste est vide.")

    const chantierNom = chantiers.find((c) => c.id === chantierId)?.nom || "Chantier"
    const nbUnites = panier.reduce((acc, item) => acc + item.quantite, 0)

    const enregistrerHorsLigne = async () => {
      if (mode === "DEPART") {
        await enqueueOfflineOperation({
          type: "DEPART_MATIN",
          label: `Départ « ${chantierNom} » (${panier.length} réf., ${nbUnites} u.)`,
          payload: {
            chantierId,
            chantierNom,
            username,
            lignes: panier.map((item) => ({
              articleId: item.article.id,
              designation: item.article.designation,
              quantite: item.quantite,
            })),
            observation,
          },
        })
      } else {
        await enqueueOfflineOperation({
          type: "RETOUR_CHANTIER",
          label: `Pointage retour « ${chantierNom} » (${panier.length} réf., ${nbUnites} u.)`,
          payload: {
            chantierId,
            chantierNom,
            username,
            lignes: panier.map((item) => ({
              articleId: item.article.id,
              designation: item.article.designation,
              quantite: item.quantite,
              type: item.typeRetour,
            })),
            observation,
          },
        })
      }

      setSuccess(true)
      setPanier([])
      setChantierId("")
      setObservation("")
      setLastScannedId(null)
      toast.success(
        "📡 Enregistré en mode Hors-Ligne ! Sera envoyé automatiquement dès le retour du réseau."
      )
      setTimeout(() => setSuccess(false), 5000)
    }

    setIsSubmitting(true)

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await enregistrerHorsLigne()
      setIsSubmitting(false)
      return
    }

    try {
      let res
      if (mode === "DEPART") {
        res = await validerDepartMatin({
          chantierId,
          username,
          lignes: panier.map((item) => ({ articleId: item.article.id, quantite: item.quantite })),
          observation,
        })
      } else {
        res = await validerRetourChantier({
          chantierId,
          username,
          lignes: panier.map((item) => ({
            articleId: item.article.id,
            quantite: item.quantite,
            type: item.typeRetour,
          })),
          observation,
        })
      }

      if (res.success) {
        setSuccess(true)
        setPanier([])
        setChantierId("")
        setObservation("")
        setLastScannedId(null)
        toast.success(mode === "DEPART" ? "Départ validé avec succès !" : "Pointage chantier enregistré !")
        setTimeout(() => setSuccess(false), 5000)
      } else {
        toast.error("Erreur: " + res.error)
      }
    } catch {
      // Coupure réseau pendant l'envoi : bascule automatique en file d'attente Hors-Ligne
      await enregistrerHorsLigne()
    }
    setIsSubmitting(false)
  }

  const lastScannedItem = useMemo(
    () => (lastScannedId ? panier.find((p) => p.article.id === lastScannedId) ?? null : null),
    [lastScannedId, panier]
  )

  const totalUnitsPanier = useMemo(
    () => panier.reduce((acc, item) => acc + item.quantite, 0),
    [panier]
  )

  const scanContinuActif = mode === "DEPART" || mode === "RETOUR"

  return (
    <div className="space-y-6">
      {isScanning && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setIsScanning(false)}
          continuous={scanContinuActif}
          burstSummary={
            scanContinuActif
              ? {
                  lastLabel: lastScannedItem?.article.designation,
                  lastQty: lastScannedItem?.quantite,
                  totalLines: panier.length,
                  totalUnits: totalUnitsPanier,
                  onIncrementLast: lastScannedItem
                    ? () => updateQty(lastScannedItem.article.id, lastScannedItem.quantite + 1)
                    : undefined,
                  onDecrementLast: lastScannedItem
                    ? () => {
                        if (lastScannedItem.quantite <= 1) {
                          remove(lastScannedItem.article.id)
                          setLastScannedId(null)
                        } else {
                          updateQty(lastScannedItem.article.id, lastScannedItem.quantite - 1)
                        }
                      }
                    : undefined,
                }
              : undefined
          }
        />
      )}

      {/* Sélecteur de Mode Prestige (5 onglets tactiles avec badge compteur panier) */}
      <div className="grid grid-cols-5 gap-1.5 bg-white dark:bg-[#111622] p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs sticky top-2 z-20">
        {([
          { id: "DEPART", label: "Départ", Icon: Truck },
          { id: "RETOUR", label: "Retour", Icon: RotateCcw },
          { id: "OUTILLAGE", label: "Outils", Icon: Wrench },
          { id: "VERIF", label: "Stock", Icon: Box },
          { id: "ARTICLES", label: "Articles", Icon: PackagePlus },
        ] as const).map(({ id, label, Icon }) => {
          const isCurrent = mode === id
          const showBadge =
            (id === "DEPART" || id === "RETOUR") && isCurrent && totalUnitsPanier > 0
          return (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              aria-pressed={isCurrent}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 min-h-14 sm:min-h-12 py-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${
                isCurrent
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{label}</span>
              {showBadge && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-xs tabular-nums">
                  {totalUnitsPanier}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Message de Feedback Flash */}
      {lastAdded && (
        <div className="bg-indigo-600 text-white p-3 rounded-xl font-bold text-center shadow-lg animate-in slide-in-from-top-4 fade-in">
          {lastAdded}
        </div>
      )}

      {success && (mode === "DEPART" || mode === "RETOUR") && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 font-medium shadow-lg animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
          Tout est enregistré ! Bon courage sur le chantier {username} !
        </div>
      )}

      {mode === "VERIF" && (
        <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <Box className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Que cherches-tu ?
            </h2>
            <button
              type="button"
              onClick={() => setIsScanning(true)}
              className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 ring-1 ring-indigo-500/20 dark:ring-indigo-500/30 px-4 py-2 rounded-xl font-medium text-sm transition-colors"
            >
              <ScanBarcode className="w-5 h-5" /> Scanner
            </button>
          </div>

          <div className="relative mt-2">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Ex: câble, disjoncteur..."
              className="block w-full pl-12 rounded-2xl border-0 ring-1 ring-inset ring-slate-200 dark:ring-white/10 p-4 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 text-lg transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {search && (
            <div className="mt-4 space-y-3">
              {filteredArticles.length === 0 ? (
                <div className="p-4 text-slate-500 dark:text-zinc-500 text-center font-medium bg-slate-50 dark:bg-zinc-950/50 rounded-2xl ring-1 ring-slate-100 dark:ring-white/5">
                  Aucun produit trouvé en stock.
                </div>
              ) : (
                filteredArticles.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-white/5 shadow-sm rounded-2xl flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-lg">{a.designation}</div>
                      <div className="text-sm text-slate-500 dark:text-zinc-400">{a.reference}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium mb-1 tracking-wider uppercase">
                        En Stock
                      </span>
                      <span
                        className={`font-black text-xl px-4 py-1.5 rounded-xl ${
                          a.stockActuel <= 0
                            ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20"
                            : a.stockActuel <= a.stockMinimum
                              ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
                              : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
                        }`}
                      >
                        {a.stockActuel}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {mode === "ARTICLES" && <ArticlesChefPanel articles={articlesEffectifs} />}

      {mode === "OUTILLAGE" && (
        <div className="animate-in slide-in-from-bottom-2 fade-in">
          <EmpruntOutillageForm outillages={outillagesEffectifs as never[]} chantiers={chantiers} />
        </div>
      )}

      {/* 1. Choix du Chantier */}
      {(mode === "DEPART" || mode === "RETOUR") && (
        <>
          <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-xl space-y-4">
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              {mode === "DEPART" ? (
                <Truck className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              ) : (
                <RotateCcw className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              )}
              1. {mode === "DEPART" ? "Pour quel chantier ?" : "De quel chantier viens-tu ?"}
            </h2>
            <div className="relative">
              <select
                className="absolute opacity-0 w-full h-full -z-10 pointer-events-none"
                value={chantierId}
                onChange={(e) => setChantierId(e.target.value)}
                tabIndex={-1}
              >
                <option value="">-- Choisir un chantier --</option>
                {chantiers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>

              {!chantierId ? (
                <>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={chantierSearchQuery}
                    onChange={(e) => {
                      setChantierSearchQuery(e.target.value)
                      setShowChantierDropdown(true)
                    }}
                    onFocus={() => setShowChantierDropdown(true)}
                    onBlur={() => setTimeout(() => setShowChantierDropdown(false), 200)}
                    placeholder="Rechercher un chantier..."
                    className="w-full pl-12 border-0 ring-1 ring-inset ring-slate-200 dark:ring-white/10 rounded-2xl p-4 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white text-lg font-medium focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-shadow"
                  />
                  {showChantierDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                      {chantiers
                        .filter((c) => !chantierSearchQuery || c.nom.toLowerCase().includes(chantierSearchQuery.toLowerCase()))
                        .map((c) => {
                          const nbDeployes = Object.keys(deployeParChantier[c.id] || {}).length
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setChantierId(c.id)
                                setChantierSearchQuery("")
                                setShowChantierDropdown(false)
                              }}
                              className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-zinc-800 border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors font-medium text-slate-900 dark:text-white text-lg flex items-center justify-between gap-2"
                            >
                              <span>{c.nom}</span>
                              {mode === "RETOUR" && nbDeployes > 0 && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300 shrink-0">
                                  {nbDeployes} réf. sur site
                                </span>
                              )}
                            </button>
                          )
                        })}
                      {chantiers.filter((c) => !chantierSearchQuery || c.nom.toLowerCase().includes(chantierSearchQuery.toLowerCase()))
                        .length === 0 && (
                        <div className="p-4 text-slate-500 dark:text-zinc-500 text-center font-medium">
                          Aucun chantier trouvé.
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl">
                  <div className="font-semibold text-indigo-900 dark:text-indigo-100 text-lg">
                    {chantiers.find((c) => c.id === chantierId)?.nom}
                  </div>
                  <button
                    type="button"
                    onClick={() => setChantierId("")}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold text-sm px-3 py-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm"
                  >
                    Changer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 1.bis — Vue du matériel actuellement sur ce chantier (1.3 : Retour intelligent) */}
          {mode === "RETOUR" && chantierId && (
            <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-xl space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>Matériel actuellement sur ce chantier</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    {materielSurChantier.length}
                  </span>
                </h2>
                {materielSurChantier.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => pointerToutChantier("Retour")}
                      className="text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-500/30 active:scale-95 transition-all"
                    >
                      Tout ramener au dépôt
                    </button>
                    <button
                      type="button"
                      onClick={() => pointerToutChantier("Consomme")}
                      className="text-xs font-semibold px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-500/30 active:scale-95 transition-all"
                    >
                      Tout posé sur chantier
                    </button>
                  </div>
                )}
              </div>

              {materielSurChantier.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 text-sm text-slate-500 dark:text-zinc-400 text-center">
                  Aucun matériel en cours sur ce chantier. Vous pouvez quand même scanner ou rechercher un article ci-dessous.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
                  {materielSurChantier.map(({ article, quantiteDeployce }) => {
                    const ligneActive = panier.find((p) => p.article.id === article.id)
                    return (
                      <div
                        key={article.id}
                        className="p-3.5 sm:p-4 bg-white dark:bg-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base break-words">
                              {article.designation}
                            </span>
                            {ligneActive && (
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${LABELS_RETOUR[ligneActive.typeRetour].badge}`}>
                                {LABELS_RETOUR[ligneActive.typeRetour].court} (×{ligneActive.quantite})
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                            {article.reference} · <span className="font-bold text-amber-600 dark:text-amber-400">Sur chantier : {quantiteDeployce}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              upsertLignePanier(article, {
                                quantiteFixe: quantiteDeployce,
                                typeRetour: "Retour",
                              })
                            }
                            className={`min-h-10 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                              ligneActive?.typeRetour === "Retour"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-500/30"
                            }`}
                          >
                            Ramener ({quantiteDeployce})
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              upsertLignePanier(article, {
                                quantiteFixe: quantiteDeployce,
                                typeRetour: "Consomme",
                              })
                            }
                            className={`min-h-10 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                              ligneActive?.typeRetour === "Consomme"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-500/30"
                            }`}
                          >
                            Tout posé
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              upsertLignePanier(article, {
                                quantiteFixe: 1,
                                typeRetour: "Perte",
                              })
                            }
                            className={`min-h-10 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1 ${
                              ligneActive?.typeRetour === "Perte"
                                ? "bg-rose-600 text-white shadow-sm"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-500/30"
                            }`}
                          >
                            <TriangleAlert className="w-3.5 h-3.5 shrink-0" />
                            Perdu
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. Ajout de Matériel */}
          <div className={`transition-all duration-500 ${!chantierId ? "opacity-40 pointer-events-none grayscale" : ""}`}>
            <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-xl space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Box className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> 2.{" "}
                  {mode === "RETOUR" ? "Scanner ou ajouter un article" : "Matériel"}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsScanning(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  <ScanBarcode className="w-5 h-5" /> Scan rafale
                </button>
              </div>

              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
                </div>
                <input
                  type="text"
                  placeholder="Ou taper un nom..."
                  className="block w-full pl-12 rounded-2xl border-0 ring-1 ring-inset ring-slate-200 dark:ring-white/10 p-4 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 text-lg transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {search && (
                <div className="mt-4 space-y-2">
                  {filteredArticles.slice(0, 5).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => addToPanier(a)}
                      className="w-full text-left p-4 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-white/5 shadow-sm hover:border-indigo-500/30 dark:hover:border-indigo-500/50 rounded-2xl flex justify-between items-center transition-colors group"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{a.designation}</div>
                        <div className="text-sm text-slate-500 dark:text-zinc-400">{a.reference}</div>
                      </div>
                      <Plus className="text-slate-400 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Panier & Observation */}
          {panier.length > 0 && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in">
                <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Dans ma liste</h3>
                  <span className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2 py-1 rounded-full">
                    {panier.length} article(s) · {totalUnitsPanier} u.
                  </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {panier.map((item) => (
                    <div key={item.article.id} className="p-4 bg-white dark:bg-zinc-800 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-semibold text-slate-900 dark:text-white text-sm break-words">
                            {item.article.designation}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-zinc-400">{item.article.reference}</div>
                        </div>

                        {mode === "RETOUR" && (
                          <div className="flex rounded-xl bg-slate-100 dark:bg-zinc-900 p-1 gap-1 shrink-0">
                            {(["Retour", "Consomme", "Perte"] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => updateTypeRetour(item.article.id, t)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  item.typeRetour === t
                                    ? t === "Retour"
                                      ? "bg-emerald-600 text-white"
                                      : t === "Consomme"
                                        ? "bg-blue-600 text-white"
                                        : "bg-rose-600 text-white"
                                    : "text-slate-500 dark:text-zinc-400"
                                }`}
                              >
                                {t === "Retour" ? "Retour" : t === "Consomme" ? "Posé" : "Perdu"}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateQty(item.article.id, item.quantite + 5)}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-500/20 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => updateQty(item.article.id, item.quantite + 10)}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-500/20 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                          >
                            +10
                          </button>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => updateQty(item.article.id, item.quantite - 1)}
                            className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-700/50 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors active:scale-95 shadow-sm ring-1 ring-slate-200 dark:ring-white/5"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantite}
                            onChange={(e) => updateQty(item.article.id, parseInt(e.target.value) || 1)}
                            className="font-black text-xl w-14 text-center text-slate-900 dark:text-white bg-transparent border-none focus:ring-0 p-0"
                          />
                          <button
                            type="button"
                            onClick={() => updateQty(item.article.id, item.quantite + 1)}
                            className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors active:scale-95 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-500/30"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(item.article.id)}
                            className="p-3 text-rose-500 hover:text-rose-600 dark:text-rose-500/70 dark:hover:text-rose-400 transition-colors ml-1 active:scale-95"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <textarea
                  placeholder="Un commentaire ? (ex: pris dans l'étagère du haut...)"
                  className="w-full rounded-2xl border-0 ring-1 ring-inset ring-slate-200 dark:ring-white/10 p-4 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all resize-none shadow-sm"
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
              type="button"
              onClick={handleValider}
              disabled={isSubmitting || panier.length === 0 || !chantierId}
              className={`w-full text-white font-semibold text-lg p-4 rounded-2xl shadow-xl disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 ${
                mode === "DEPART"
                  ? "bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] ring-1 ring-indigo-500"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500"
              }`}
            >
              {isSubmitting
                ? "Enregistrement en cours..."
                : mode === "DEPART"
                  ? "Valider le départ"
                  : "Valider le pointage chantier"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
