import { getArticlesWithStocks, createArticle, deleteArticle } from "@/app/actions/articles"
import { entrerStockRapide } from "@/app/actions/mouvements"
import { Plus, AlertTriangle, FileSpreadsheet, Package, Truck, Wrench, Shield, Boxes, ArrowRight, Pencil, Sparkles, Building2, Layers } from "lucide-react"
import { DeleteButton } from "@/components/DeleteButton"
import { ScannerInput } from "@/components/ScannerInput"
import Link from "next/link"
import { SearchInput } from "@/components/SearchInput"
import { ExportPDFButton } from "@/components/ExportPDFButton"
import { CatalogueFilters } from "./CatalogueFilters"

export default async function CataloguePage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string, f?: string, c?: string, p?: string, alert?: string, stock?: string }> 
}) {
  const { q, f, c, p, alert, stock } = await searchParams
  const allArticles = await getArticlesWithStocks()

  // Calcul des métriques globales pour le catalogue
  const totalCatalogue = allArticles.length
  let totalEnStock = 0
  let totalPiecesStock = 0
  let totalAlertes = 0
  let valeurTotaleDepot = 0

  allArticles.forEach((a: any) => {
    const s = a.stockInfo
    const prix = a.prixUnitaire || 0
    valeurTotaleDepot += Math.max(0, s.stockDepot) * prix

    if (s.stockDepot > 0 || s.stockChantiersTotal > 0) {
      totalEnStock++
      totalPiecesStock += Math.max(0, s.stockDepot) + Math.max(0, s.stockChantiersTotal)
    }
    if (s.enAlerte) {
      totalAlertes++
    }
  })
  
  let articles = allArticles

  if (stock === 'in_stock') {
    articles = articles.filter((a: any) => a.stockInfo.stockDepot > 0 || a.stockInfo.stockChantiersTotal > 0)
  }
  
  if (alert === 'true') {
    articles = articles.filter((a: any) => a.stockInfo.enAlerte)
  }

  if (q) {
    const query = q.toLowerCase()
    articles = articles.filter((article: any) => 
      article.designation.toLowerCase().includes(query) || 
      article.reference.toLowerCase().includes(query) ||
      (article.referenceFournisseur && article.referenceFournisseur.toLowerCase().includes(query))
    )
  }

  if (f) {
    articles = articles.filter((a: any) => a.fournisseur === f)
  }

  if (c) {
    articles = articles.filter((a: any) => a.categorie === c)
  }

  const fournisseurs = Array.from(new Set(allArticles.map((a: any) => a.fournisseur).filter(Boolean))) as string[]
  const categories = Array.from(new Set(allArticles.map((a: any) => a.categorie).filter(Boolean))) as string[]
  fournisseurs.sort()
  categories.sort()

  // Tri prioritaire : les articles avec du stock physique en premier, puis ordre alphabétique
  articles.sort((a: any, b: any) => {
    const stockA = (a.stockInfo.stockDepot > 0 || a.stockInfo.stockChantiersTotal > 0) ? 1 : 0
    const stockB = (b.stockInfo.stockDepot > 0 || b.stockInfo.stockChantiersTotal > 0) ? 1 : 0
    if (stockA !== stockB) return stockB - stockA
    return a.reference.localeCompare(b.reference)
  })

  const currentPage = parseInt(p || "1", 10)
  const pageSize = 50
  const totalPages = Math.ceil(articles.length / pageSize)
  const paginatedArticles = articles.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* ========================================================= */}
      {/* 1. EN-TÊTE IMMERSIF AVEC MINI-KPIS DYNAMIQUES             */}
      {/* ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
              Inventaire & Fournitures
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Mon Stock & Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi des approvisionnements, entrées rapides et catalogue fournisseurs de Quentin Électricité.
          </p>
        </div>

        {/* 3 Capsules Statistiques d'en-tête */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Capsule Stock Réel */}
          <div className="p-2.5 px-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="live-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 leading-none">Stock Réel</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {totalEnStock} réf. <span className="font-normal text-slate-400">({totalPiecesStock} pcs)</span>
              </p>
            </div>
          </div>

          {/* Capsule Valeur */}
          <div className="p-2.5 px-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 leading-none">Valeur Dépôt</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {valeurTotaleDepot.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </p>
            </div>
          </div>

          {/* Actions d'export & import */}
          <div className="flex items-center gap-2">
            <ExportPDFButton articles={articles} />
            <Link
              href="/catalogue/import"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#161d2d] shadow-2xs transition-all"
              title="Importer un fichier Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Import Excel</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Barre de recherche plein écran */}
      <div className="w-full">
        <SearchInput />
      </div>

      {/* Filtres segmentés interactifs */}
      <CatalogueFilters 
        fournisseurs={fournisseurs} 
        categories={categories} 
        totalPages={totalPages} 
        currentPage={currentPage}
        totalCatalogue={totalCatalogue}
        totalEnStock={totalEnStock}
        totalAlertes={totalAlertes}
      />

      {/* ========================================================= */}
      {/* 2. GRILLE PRINCIPALE : FORMULAIRE D'AJOUT + TABLEAU       */}
      {/* ========================================================= */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Panneau d'Ajout d'Article (Inspecteur latéral moderne) */}
        <div className="lg:col-span-1">
          <div className="prestige-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs">
            <div className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Nouvel Article
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Ajout immédiat au catalogue</p>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-amber-500/80" />
            </div>

            <form action={createArticle} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Référence interne *
                </label>
                <input 
                  required 
                  name="reference" 
                  type="text" 
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#161d2d] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium" 
                  placeholder="ex: DISJ-16A-HAGER" 
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Désignation complète *
                </label>
                <input 
                  required 
                  name="designation" 
                  type="text" 
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#161d2d] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium" 
                  placeholder="ex: Disjoncteur 1P+N 16A Courbe C" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Catégorie
                  </label>
                  <select 
                    name="categorie" 
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white focus:border-blue-500 font-medium cursor-pointer"
                  >
                    <option value="Consommable">Consommable</option>
                    <option value="Outillage">Outillage</option>
                    <option value="EPI">EPI</option>
                    <option value="Matériaux">Matériaux</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Stock Initial
                  </label>
                  <input 
                    name="stockInitial" 
                    type="number" 
                    defaultValue="0" 
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Unité de mesure
                  </label>
                  <input 
                    name="unite" 
                    type="text" 
                    defaultValue="u" 
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Seuil alerte (Min)
                  </label>
                  <input 
                    name="stockMinimum" 
                    type="number" 
                    defaultValue="0" 
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Fournisseur
                  </label>
                  <input 
                    name="fournisseur" 
                    type="text" 
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 font-medium" 
                    placeholder="ex: Rexel, YESSS" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Réf. Fournisseur
                  </label>
                  <input 
                    name="referenceFournisseur" 
                    type="text" 
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 font-medium" 
                    placeholder="ex: REX-8820" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Prix unitaire HT (€)
                  </label>
                  <input 
                    name="prixUnitaire" 
                    type="number" 
                    step="0.01" 
                    defaultValue="0" 
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Qté / Lot (Boîte)
                  </label>
                  <input 
                    name="quantiteParBoite" 
                    type="number" 
                    defaultValue="1" 
                    min="1" 
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium" 
                  />
                </div>
              </div>

              {/* Code-barres Scanner */}
              <div>
                <ScannerInput 
                  name="codeBarre" 
                  label="Code-Barres EAN" 
                />
              </div>
              
              <div className="flex items-center gap-2.5 pt-1">
                <input 
                  id="retour" 
                  name="retourAttendu" 
                  type="checkbox" 
                  className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                />
                <label htmlFor="retour" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer font-medium">
                  Matériel réutilisable avec retour attendu
                </label>
              </div>
              
              <button 
                type="submit" 
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 px-4 py-2.5 text-xs font-semibold shadow-xs active:scale-[0.99] transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Enregistrer l'article</span>
              </button>
            </form>
          </div>
        </div>

        {/* Tableau des Articles (Rendu haute fidélité) */}
        <div className="lg:col-span-2">
          <div className="prestige-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs">
            {/* Vue Desktop : Tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
                <thead className="bg-slate-50/75 dark:bg-white/[0.02]">
                  <tr>
                    <th className="px-4 py-3.5 text-left font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Article & Référence</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Fournisseur</th>
                    <th className="px-4 py-3.5 text-center font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Stock Dépôt</th>
                    <th className="px-4 py-3.5 text-center font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">En Chantier</th>
                    <th className="px-4 py-3.5 text-right font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Actions Rapides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {paginatedArticles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="font-medium">Aucun article ne correspond aux critères sélectionnés.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedArticles.map((article: any) => {
                      const stockInfo = article.stockInfo
                      const hasStock = stockInfo.stockDepot > 0
                      const enAlerte = stockInfo.enAlerte
                      const cat = article.categorie || "Matériel"
                      
                      const catColor = 
                        cat === "Outillage" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40" :
                        cat === "Consommable" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40" :
                        cat === "EPI" ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40" :
                        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60 dark:border-white/[0.06]"

                      return (
                        <tr 
                          key={article.id} 
                          className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group"
                        >
                          {/* 1. Article & Catégorie */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${catColor}`}>
                                  {cat}
                                </span>
                                {article.prixUnitaire > 0 && (
                                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
                                    {article.prixUnitaire.toFixed(2)} € HT
                                  </span>
                                )}
                              </div>

                              <Link 
                                href={`/catalogue/${article.id}`} 
                                className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block line-clamp-1"
                              >
                                {article.designation}
                              </Link>

                              <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                                {article.reference}
                              </p>
                            </div>
                          </td>

                          {/* 2. Fournisseur & Réf Fournisseur */}
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-slate-800 dark:text-slate-200">
                                {article.fournisseur || "Fournisseur non spécifié"}
                              </p>
                              {article.referenceFournisseur && (
                                <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                                  Réf: {article.referenceFournisseur}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* 3. Stock Dépôt avec indicateurs visuels */}
                          <td className="px-4 py-3.5 text-center">
                            {hasStock ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs shadow-2xs tabular-nums">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 live-dot"></span>
                                  <span>{stockInfo.stockDepot} {article.unite || 'u'}</span>
                                </span>
                                {article.stockMinimum > 0 && (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                    Seuil: {article.stockMinimum}
                                  </span>
                                )}
                              </div>
                            ) : enAlerte ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs tabular-nums">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                  <span>0 {article.unite || 'u'}</span>
                                </span>
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                                  Alerte rupture
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">
                                0 {article.unite || 'u'}
                              </span>
                            )}
                          </td>

                          {/* 4. En Chantier */}
                          <td className="px-4 py-3.5 text-center">
                            {stockInfo.stockChantiersTotal > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs tabular-nums">
                                <Truck className="w-3 h-3 text-blue-500" />
                                <span>{stockInfo.stockChantiersTotal} {article.unite || 'u'}</span>
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>

                          {/* 5. Actions Rapides */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Formulaire ajout rapide +1 */}
                              <form action={entrerStockRapide} className="flex items-center gap-1">
                                <input type="hidden" name="articleId" value={article.id} />
                                <input 
                                  type="number" 
                                  name="quantite" 
                                  defaultValue="1" 
                                  min="1" 
                                  className="w-11 px-1.5 py-1 rounded-lg text-center bg-slate-50 dark:bg-[#161d2d] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold" 
                                  title="Quantité à ajouter"
                                />
                                <button 
                                  type="submit" 
                                  title="Ajouter du stock en dépôt" 
                                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-200/60 dark:border-emerald-800/40 transition-colors font-bold cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </form>

                              {/* Modifier */}
                              <Link 
                                href={`/catalogue/${article.id}`} 
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200/60 transition-colors"
                                title="Modifier la fiche article"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Link>

                              {/* Supprimer */}
                              <form action={deleteArticle.bind(null, article.id)}>
                                <DeleteButton message="Supprimer cet article va aussi supprimer son historique. Continuer ?" />
                              </form>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Vue Mobile (Cartes interactives modernes) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.04]">
              {paginatedArticles.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Aucun article dans le catalogue.</div>
              ) : (
                paginatedArticles.map((article: any) => {
                  const stockInfo = article.stockInfo
                  const hasStock = stockInfo.stockDepot > 0
                  const enAlerte = stockInfo.enAlerte

                  return (
                    <div key={article.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {article.categorie || "Matériel"}
                          </span>
                          <Link 
                            href={`/catalogue/${article.id}`} 
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 block mt-1 text-sm"
                          >
                            {article.designation}
                          </Link>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {article.reference} {article.referenceFournisseur ? `• ${article.referenceFournisseur}` : ''}
                          </p>
                        </div>
                        {article.prixUnitaire > 0 && (
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                            {article.prixUnitaire.toFixed(2)} €
                          </span>
                        )}
                      </div>

                      {/* Barres de stock dépôt et chantier */}
                      <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/60 dark:border-white/[0.06]">
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Stock Dépôt</p>
                          <p className={`font-bold mt-0.5 ${hasStock ? 'text-emerald-600 dark:text-emerald-400' : enAlerte ? 'text-rose-600' : 'text-slate-400'}`}>
                            {stockInfo.stockDepot} {article.unite || 'u'}
                          </p>
                        </div>
                        <div className="border-l border-slate-200 dark:border-white/[0.06] pl-2.5">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">En Chantier</p>
                          <p className="font-bold mt-0.5 text-blue-600 dark:text-blue-400">
                            {stockInfo.stockChantiersTotal} {article.unite || 'u'}
                          </p>
                        </div>
                      </div>

                      {/* Actions tactiles mobiles */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          Seuil: {article.stockMinimum}
                        </span>
                        <div className="flex items-center gap-2">
                          <form action={entrerStockRapide} className="flex items-center gap-1">
                            <input type="hidden" name="articleId" value={article.id} />
                            <input 
                              type="number" 
                              name="quantite" 
                              defaultValue="1" 
                              min="1" 
                              className="w-12 px-2 py-1 rounded-lg text-center bg-slate-100 dark:bg-slate-800 text-xs font-semibold" 
                            />
                            <button 
                              type="submit" 
                              className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </form>
                          <Link 
                            href={`/catalogue/${article.id}`} 
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <form action={deleteArticle.bind(null, article.id)}>
                            <DeleteButton message="Supprimer cet article ?" />
                          </form>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
