"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Plus, Minus, Search, ScanBarcode, X, Pencil, PackagePlus, Save, LoaderCircle, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { BarcodeScanner } from "@/components/BarcodeScanner"
import { creerArticleChef, modifierArticleChef, ajusterStockChef } from "@/app/actions/chef-articles"
import { enqueueOfflineOperation, generateOfflineId } from "@/lib/offline-sync"
import { ArticleThumbnail } from "@/components/ArticleThumbnail"

export type ArticleChef = {
  id: string
  designation: string
  reference: string
  codeBarre: string | null
  stockActuel: number
  stockMinimum: number
  fournisseur: string | null
  referenceFournisseur: string | null
  categorie: string | null
  unite: string | null
  quantiteParBoite: number
}

type SheetState = { type: "create"; codeBarre?: string } | { type: "edit"; article: ArticleChef } | null

const PAGE_SIZE = 30
const CATEGORIES_PAR_DEFAUT = ["Consommable", "Outillage", "EPI", "Matériaux"]
const UNITES = ["u", "m", "boîte", "lot", "rouleau", "kg", "L", "paire"]

const inputClass =
  "w-full h-12 px-4 rounded-2xl border-0 ring-1 ring-inset ring-slate-200 dark:ring-white/10 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 text-base focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all"
const labelClass = "block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5"

function enAlerte(a: ArticleChef) {
  return a.stockMinimum > 0 ? a.stockActuel <= a.stockMinimum : a.stockActuel < 0
}

function badgeStock(a: ArticleChef) {
  if (a.stockActuel <= 0) return "bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20"
  if (a.stockActuel <= a.stockMinimum) return "bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
  return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
}

export function ArticlesChefPanel({ articles }: { articles: ArticleChef[] }) {
  const [search, setSearch] = useState("")
  const [filtre, setFiltre] = useState<"tous" | "bas">("tous")
  const [limite, setLimite] = useState(PAGE_SIZE)
  const [scanRecherche, setScanRecherche] = useState(false)
  const [sheet, setSheet] = useState<SheetState>(null)

  // Le scanner redémarre si la fonction change : on la garde stable via une ref vers la liste courante.
  const articlesRef = useRef(articles)
  useEffect(() => { articlesRef.current = articles }, [articles])

  const categories = useMemo(() => {
    const set = new Set<string>(CATEGORIES_PAR_DEFAUT)
    articles.forEach(a => a.categorie && set.add(a.categorie))
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"))
  }, [articles])

  const fournisseurs = useMemo(() => {
    const set = new Set<string>()
    articles.forEach(a => a.fournisseur && set.add(a.fournisseur))
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"))
  }, [articles])

  const nbAlertes = useMemo(() => articles.filter(enAlerte).length, [articles])

  const resultats = useMemo(() => {
    const termes = search.toLowerCase().split(/\s+/).filter(Boolean)
    return articles.filter(a => {
      if (filtre === "bas" && !enAlerte(a)) return false
      if (termes.length === 0) return true
      const texte = [a.designation, a.reference, a.codeBarre, a.fournisseur, a.referenceFournisseur, a.categorie]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return termes.every(t => texte.includes(t))
    })
  }, [articles, search, filtre])

  const handleScanRecherche = useCallback((code: string) => {
    setScanRecherche(false)
    const trouve = articlesRef.current.find(a => a.codeBarre === code || a.reference === code)
    if (trouve) {
      setSheet({ type: "edit", article: trouve })
    } else {
      toast.info("Code inconnu : création d'un nouvel article")
      setSheet({ type: "create", codeBarre: code })
    }
  }, [])

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Barre d'actions */}
      <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-xl space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setScanRecherche(true)}
            className="flex items-center justify-center gap-2 min-h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/20 dark:ring-indigo-500/30 font-semibold active:scale-[0.98] transition-all"
          >
            <ScanBarcode className="w-6 h-6" /> Scanner
          </button>
          <button
            type="button"
            onClick={() => setSheet({ type: "create" })}
            className="flex items-center justify-center gap-2 min-h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
          >
            <PackagePlus className="w-6 h-6" /> Nouvel article
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
          </div>
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); setLimite(PAGE_SIZE) }}
            placeholder="Rechercher un article…"
            className={`${inputClass} pl-12`}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-0.5">
          <button
            type="button"
            onClick={() => { setFiltre("tous"); setLimite(PAGE_SIZE) }}
            className={`shrink-0 px-4 min-h-10 rounded-full text-sm font-semibold transition-colors ${filtre === "tous" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"}`}
          >
            Tous ({articles.length})
          </button>
          <button
            type="button"
            onClick={() => { setFiltre("bas"); setLimite(PAGE_SIZE) }}
            className={`shrink-0 px-4 min-h-10 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 ${filtre === "bas" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"}`}
          >
            <TriangleAlert className="w-4 h-4" /> Stock bas ({nbAlertes})
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-2.5">
        {resultats.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-white/5 space-y-3">
            <p className="text-slate-500 dark:text-zinc-400 font-medium">Aucun article trouvé.</p>
            <button
              type="button"
              onClick={() => setSheet({ type: "create" })}
              className="inline-flex items-center gap-2 px-5 min-h-12 rounded-2xl bg-indigo-600 text-white font-semibold"
            >
              <Plus className="w-5 h-5" /> Créer un article
            </button>
          </div>
        ) : (
          <>
            {resultats.slice(0, limite).map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSheet({ type: "edit", article: a })}
                className="w-full text-left p-3.5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 shadow-sm rounded-2xl flex items-center gap-3 active:scale-[0.99] hover:border-indigo-500/30 transition-all"
              >
                <ArticleThumbnail
                  designation={a.designation}
                  categorie={a.categorie}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white leading-snug break-words">{a.designation}</div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                    {a.reference}{a.fournisseur ? ` · ${a.fournisseur}` : ""}
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span className={`font-black text-xl min-w-12 text-center px-3 py-1 rounded-xl ${badgeStock(a)}`}>{a.stockActuel}</span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                    <Pencil className="w-3 h-3" /> Modifier
                  </span>
                </div>
              </button>
            ))}
            {resultats.length > limite && (
              <button
                type="button"
                onClick={() => setLimite(l => l + PAGE_SIZE)}
                className="w-full min-h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold"
              >
                Afficher plus ({resultats.length - limite} restants)
              </button>
            )}
          </>
        )}
      </div>

      {scanRecherche && <BarcodeScanner onScan={handleScanRecherche} onClose={() => setScanRecherche(false)} />}

      {sheet && (
        <ArticleSheet
          key={sheet.type === "edit" ? sheet.article.id : `create-${sheet.codeBarre ?? ""}`}
          state={sheet}
          articles={articles}
          categories={categories}
          fournisseurs={fournisseurs}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  )
}

function ArticleSheet({
  state,
  articles,
  categories,
  fournisseurs,
  onClose,
}: {
  state: NonNullable<SheetState>
  articles: ArticleChef[]
  categories: string[]
  fournisseurs: string[]
  onClose: () => void
}) {
  const edition = state.type === "edit" ? state.article : null

  const [designation, setDesignation] = useState(edition?.designation ?? "")
  const [reference, setReference] = useState(edition?.reference ?? "")
  const [codeBarre, setCodeBarre] = useState(edition?.codeBarre ?? (state.type === "create" ? state.codeBarre ?? "" : ""))
  const [fournisseur, setFournisseur] = useState(edition?.fournisseur ?? "")
  const [referenceFournisseur, setReferenceFournisseur] = useState(edition?.referenceFournisseur ?? "")
  const [categorie, setCategorie] = useState(edition?.categorie ?? "Consommable")
  const [unite, setUnite] = useState(edition?.unite ?? "u")
  const [stockMinimum, setStockMinimum] = useState(String(edition?.stockMinimum ?? 0))
  const [quantiteParBoite, setQuantiteParBoite] = useState(String(edition?.quantiteParBoite ?? 1))
  const [stock, setStock] = useState(String(edition?.stockActuel ?? 0))
  const [scanChamp, setScanChamp] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const articlesRef = useRef(articles)
  useEffect(() => { articlesRef.current = articles }, [articles])
  const editionId = edition?.id

  const handleScanChamp = useCallback((code: string) => {
    setScanChamp(false)
    const autre = articlesRef.current.find(a => a.codeBarre === code && a.id !== editionId)
    if (autre) {
      toast.warning(`Ce code est déjà utilisé par « ${autre.designation} »`)
      return
    }
    setCodeBarre(code)
    toast.success("Code-barres renseigné")
  }, [editionId])

  const stockNum = Math.max(0, parseInt(stock) || 0)
  const categoriesAffichees = categories.includes(categorie) ? categories : [categorie, ...categories]

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur(null)
    setEnCours(true)

    const base = {
      designation,
      reference,
      codeBarre,
      fournisseur,
      referenceFournisseur,
      categorie,
      unite,
      stockMinimum: parseInt(stockMinimum) || 0,
      quantiteParBoite: parseInt(quantiteParBoite) || 1,
    }

    const enregistrerHorsLigne = async () => {
      if (edition) {
        await enqueueOfflineOperation({
          type: "MODIFIER_ARTICLE_CHEF",
          label: `Modification article « ${designation.trim()} »${stockNum !== edition.stockActuel ? ` (Stock → ${stockNum})` : ""}`,
          payload: {
            input: { id: edition.id, ...base },
            nouveauStock: stockNum !== edition.stockActuel ? stockNum : undefined,
          },
        })
        toast.success("📡 Article mis à jour hors-ligne (synchronisation auto au retour du réseau)")
      } else {
        const tempId = `offline-art-${generateOfflineId()}`
        await enqueueOfflineOperation({
          type: "CREER_ARTICLE_CHEF",
          label: `Nouvel article « ${designation.trim()} » (Stock initial : ${stockNum})`,
          payload: {
            tempId,
            input: { ...base, stockInitial: stockNum },
          },
        })
        toast.success("📡 Article créé hors-ligne (synchronisation auto au retour du réseau)")
      }
      onClose()
    }

    if (
      (typeof navigator !== "undefined" && !navigator.onLine) ||
      (edition && edition.id.startsWith("offline-art-"))
    ) {
      await enregistrerHorsLigne()
      setEnCours(false)
      return
    }

    try {
      if (edition) {
        const res = await modifierArticleChef({ id: edition.id, ...base })
        if (!res.success) { setErreur(res.error); return }
        if (stockNum !== edition.stockActuel) {
          const resStock = await ajusterStockChef(edition.id, stockNum)
          if (!resStock.success) { setErreur("Infos enregistrées mais stock non ajusté : " + resStock.error); return }
        }
        toast.success("Article mis à jour")
      } else {
        const res = await creerArticleChef({ ...base, stockInitial: stockNum })
        if (!res.success) { setErreur(res.error); return }
        toast.success("Article créé")
      }
      onClose()
    } catch {
      await enregistrerHorsLigne()
    } finally {
      setEnCours(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-end md:items-center md:justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={edition ? "Modifier l'article" : "Nouvel article"}
      >
        <div
          className="w-full md:max-w-xl max-h-[92dvh] flex flex-col bg-white dark:bg-zinc-900 rounded-t-3xl md:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 dark:border-white/5">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 min-w-0">
              {edition ? <Pencil className="w-5 h-5 text-indigo-500 shrink-0" /> : <PackagePlus className="w-5 h-5 text-indigo-500 shrink-0" />}
              <span className="truncate">{edition ? "Modifier l'article" : "Nouvel article"}</span>
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-3 -m-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={enregistrer} className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
              {erreur && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm font-medium ring-1 ring-rose-200 dark:ring-rose-500/20">
                  {erreur}
                </div>
              )}

              {/* Code-barres + scan */}
              <div>
                <label className={labelClass}>Code-barres</label>
                <div className="flex gap-2">
                  <input
                    value={codeBarre}
                    onChange={e => setCodeBarre(e.target.value)}
                    inputMode="numeric"
                    placeholder="Scanner ou saisir"
                    className={inputClass}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setScanChamp(true)}
                    className="shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-500/20 active:scale-95"
                    aria-label="Scanner le code-barres"
                  >
                    <ScanBarcode className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Désignation *</label>
                <input
                  required
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  placeholder="ex : Disjoncteur 1P+N 16A courbe C"
                  className={inputClass}
                  autoComplete="off"
                  maxLength={200}
                />
              </div>

              <div>
                <label className={labelClass}>Référence {edition ? "*" : "(auto si vide)"}</label>
                <input
                  required={!!edition}
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="ex : DISJ-16A-HAGER"
                  className={inputClass}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Fournisseur</label>
                  <input
                    value={fournisseur}
                    onChange={e => setFournisseur(e.target.value)}
                    list="chef-fournisseurs"
                    placeholder="ex : Rexel"
                    className={inputClass}
                    autoComplete="off"
                  />
                  <datalist id="chef-fournisseurs">
                    {fournisseurs.map(f => <option key={f} value={f} />)}
                  </datalist>
                </div>
                <div>
                  <label className={labelClass}>Réf. fournisseur</label>
                  <input
                    value={referenceFournisseur}
                    onChange={e => setReferenceFournisseur(e.target.value)}
                    placeholder="ex : REX-8820"
                    className={inputClass}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Catégorie</label>
                  <select value={categorie} onChange={e => setCategorie(e.target.value)} className={inputClass}>
                    {categoriesAffichees.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Unité</label>
                  <input
                    value={unite}
                    onChange={e => setUnite(e.target.value)}
                    list="chef-unites"
                    className={inputClass}
                    autoComplete="off"
                  />
                  <datalist id="chef-unites">
                    {UNITES.map(u => <option key={u} value={u} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Seuil d&apos;alerte</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={stockMinimum}
                    onChange={e => setStockMinimum(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Qté par lot / boîte</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={quantiteParBoite}
                    onChange={e => setQuantiteParBoite(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 ring-1 ring-slate-200 dark:ring-white/10">
                <label className={labelClass}>
                  {edition ? `Stock réel compté (actuel : ${edition.stockActuel})` : "Quantité en stock au dépôt"}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStock(String(Math.max(0, stockNum - 1)))}
                    className="shrink-0 w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 ring-1 ring-slate-200 dark:ring-white/10 active:scale-95"
                    aria-label="Diminuer le stock"
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                    className="flex-1 min-w-0 h-14 text-center text-2xl font-black rounded-2xl border-0 ring-1 ring-inset ring-slate-200 dark:ring-white/10 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setStock(String(stockNum + 1))}
                    className="shrink-0 w-14 h-14 flex items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-500/20 active:scale-95"
                    aria-label="Augmenter le stock"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
                {edition && stockNum !== edition.stockActuel && (
                  <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                    Une correction de {stockNum - edition.stockActuel > 0 ? "+" : ""}{stockNum - edition.stockActuel} sera enregistrée dans les mouvements.
                  </p>
                )}
              </div>
            </div>

            {/* Pied fixe */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/5 grid grid-cols-3 gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={onClose}
                className="min-h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={enCours}
                className="col-span-2 min-h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-lg shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                {enCours ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {enCours ? "Enregistrement…" : edition ? "Enregistrer" : "Créer l'article"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {scanChamp && <BarcodeScanner onScan={handleScanChamp} onClose={() => setScanChamp(false)} />}
    </>
  )
}
