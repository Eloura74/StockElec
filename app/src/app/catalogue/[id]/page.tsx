import prisma from "@/lib/prisma"
import { updateArticle, deleteArticle } from "@/app/actions/articles"
import { ajusterStockDirect } from "@/app/actions/mouvements"
import { calculerStockArticle, normaliserUnite } from "@/lib/stockUtils"
import {
  ArrowLeft,
  Edit,
  Save,
  PackagePlus,
  ArrowRightLeft,
  PackageMinus,
  RefreshCw,
  MapPin,
  Tag,
  Boxes,
  Truck,
  DollarSign,
  SlidersHorizontal,
} from "lucide-react"
import { ScannerInput } from "@/components/ScannerInput"
import Link from "next/link"
import { redirect } from "next/navigation"
import { DeleteButton } from "@/components/DeleteButton"
import { ArticleThumbnail } from "@/components/ArticleThumbnail"

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [article, categoriesRows] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      include: {
        mouvements: {
          include: { chantier: true },
          orderBy: { date: "desc" },
        },
      },
    }),
    prisma.article.findMany({
      select: { categorie: true },
      distinct: ["categorie"],
    }),
  ])

  if (!article) {
    redirect("/catalogue")
  }

  const stockInfo = calculerStockArticle(article, article.mouvements)
  const unite = normaliserUnite(article.unite)
  const valeurTotale = (Math.max(0, stockInfo.stockDepot) + Math.max(0, stockInfo.stockChantiersTotal)) * (article.prixUnitaire || 0)

  const categoriesDisponibles = Array.from(
    new Set([
      ...(article.categorie ? [article.categorie] : []),
      "Consommable",
      "Appareillage",
      "Câblage",
      "Tableau",
      "Éclairage",
      "Outillage",
      "EPI",
      "Matériaux",
      ...categoriesRows.map((r) => r.categorie).filter((c): c is string => Boolean(c)),
    ])
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* En-tête Prestige */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Link
            href="/catalogue"
            className="mt-1 p-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 shadow-2xs transition-colors shrink-0"
            title="Retour au catalogue"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <ArticleThumbnail
            designation={article.designation}
            categorie={article.categorie}
            marque={article.marque}
            size="lg"
            className="mt-0.5"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                {article.categorie || "Matériel"}
              </span>
              {article.marque && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                  <Tag className="w-3 h-3" />
                  {article.marque}
                </span>
              )}
              {article.emplacement && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                  <MapPin className="w-3 h-3" />
                  {article.emplacement}
                </span>
              )}
              <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                Réf: {article.reference}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {article.designation}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <form action={deleteArticle.bind(null, article.id)}>
            <DeleteButton message="Supprimer définitivement cet article et tout son historique ?" />
          </form>
        </div>
      </div>

      {/* 3 Cartes KPI Prestige */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div
          className={`p-4.5 rounded-2xl border shadow-2xs flex items-center justify-between ${
            stockInfo.enAlerte
              ? "border-rose-200/80 dark:border-rose-900/50 bg-rose-50/40 dark:bg-[#1a1116]"
              : "border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622]"
          }`}
        >
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Stock Dépôt Actuel
            </span>
            <p
              className={`text-2xl font-extrabold mt-0.5 tabular-nums ${
                stockInfo.enAlerte
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {stockInfo.stockDepot} <span className="text-sm font-semibold opacity-75">{unite}</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Seuil d'alerte : {article.stockMinimum} {unite}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400 flex items-center justify-center">
            <Boxes className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Stock sur Chantiers
            </span>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 tabular-nums">
              {stockInfo.stockChantiersTotal} <span className="text-sm font-semibold opacity-75">{unite}</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              déployés actuellement sur site
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 flex items-center justify-center">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Valorisation Totale HT
            </span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {valeurTotale.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Prix unitaire : {(article.prixUnitaire || 0).toFixed(2)} € HT / {unite}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulaire d'édition Prestige */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs overflow-hidden sticky top-6">
            <div className="p-4.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 flex items-center justify-center">
                <Edit className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Fiche Technique Article
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Modification des caractéristiques
                </p>
              </div>
            </div>

            <form action={updateArticle} className="p-5 space-y-3.5 text-xs">
              <input type="hidden" name="id" value={article.id} />

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Désignation complète *
                </label>
                <input
                  name="designation"
                  type="text"
                  defaultValue={article.designation}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Référence Interne *
                </label>
                <input
                  name="reference"
                  type="text"
                  defaultValue={article.reference}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Catégorie / Famille
                  </label>
                  <input
                    name="categorie"
                    type="text"
                    list="article-categories-list"
                    defaultValue={article.categorie || "Consommable"}
                    placeholder="ex: Appareillage..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                  <datalist id="article-categories-list">
                    {categoriesDisponibles.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Marque / Fabricant
                  </label>
                  <input
                    name="marque"
                    type="text"
                    defaultValue={article.marque || ""}
                    placeholder="ex: Hager, Legrand"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none"
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
                    defaultValue={article.fournisseur || ""}
                    placeholder="ex: Rexel, YESSS"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Réf. Fournisseur
                  </label>
                  <input
                    name="referenceFournisseur"
                    type="text"
                    defaultValue={article.referenceFournisseur || ""}
                    placeholder="ex: REX-12345"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Emplacement Dépôt
                  </label>
                  <input
                    name="emplacement"
                    type="text"
                    defaultValue={article.emplacement || ""}
                    placeholder="ex: Rayon A1, Bac B2"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Qté / Lot (Boîte)
                  </label>
                  <input
                    name="quantiteParBoite"
                    type="number"
                    defaultValue={article.quantiteParBoite || 1}
                    min="1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Unité
                  </label>
                  <input
                    name="unite"
                    type="text"
                    defaultValue={unite}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Seuil Alerte
                  </label>
                  <input
                    name="stockMinimum"
                    type="number"
                    defaultValue={article.stockMinimum}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Prix HT (€)
                  </label>
                  <input
                    name="prixUnitaire"
                    type="number"
                    step="0.01"
                    defaultValue={article.prixUnitaire || 0}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <ScannerInput
                  name="codeBarre"
                  label="Code-Barres (EAN)"
                  defaultValue={article.codeBarre || ""}
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  id="retourAttendu"
                  name="retourAttendu"
                  type="checkbox"
                  defaultChecked={article.retourAttendu}
                  className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="retourAttendu" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer font-medium">
                  Matériel réutilisable avec retour attendu
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-2 flex justify-center items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 px-4 py-2.5 text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer les modifications</span>
              </button>
            </form>
          </div>
        </div>

        {/* Ajustement direct du stock + Historique des mouvements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Barre d'ajustement rapide du stock (Entrée / Sortie / Fixer le stock exact) */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Ajustement Direct du Stock Dépôt
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Ajoutez, retirez ou définissez directement le stock réel en rayon (avec traçabilité automatique)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Entrée rapide (+) */}
              <form action={ajusterStockDirect} className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col gap-2">
                <input type="hidden" name="articleId" value={article.id} />
                <input type="hidden" name="mode" value="entree" />
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  + Entrée en stock
                </span>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    name="quantite"
                    defaultValue="1"
                    min="1"
                    className="w-full rounded-lg bg-white dark:bg-[#161d2d] border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white cursor-pointer transition-colors"
                  >
                    + Ajouter
                  </button>
                </div>
              </form>

              {/* 2. Sortie rapide (-) */}
              <form action={ajusterStockDirect} className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex flex-col gap-2">
                <input type="hidden" name="articleId" value={article.id} />
                <input type="hidden" name="mode" value="sortie" />
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  − Retrait du stock
                </span>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    name="quantite"
                    defaultValue="1"
                    min="1"
                    className="w-full rounded-lg bg-white dark:bg-[#161d2d] border border-amber-200 dark:border-amber-800/60 px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white cursor-pointer transition-colors"
                  >
                    − Retirer
                  </button>
                </div>
              </form>

              {/* 3. Fixer le stock exact (=) */}
              <form action={ajusterStockDirect} className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex flex-col gap-2">
                <input type="hidden" name="articleId" value={article.id} />
                <input type="hidden" name="mode" value="fixer" />
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                  = Fixer le stock exact
                </span>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    name="quantite"
                    defaultValue={Math.max(0, stockInfo.stockDepot)}
                    min="0"
                    className="w-full rounded-lg bg-white dark:bg-[#161d2d] border border-blue-200 dark:border-blue-800/60 px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white cursor-pointer transition-colors"
                  >
                    = Définir
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Historique des Mouvements */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs overflow-hidden">
            <div className="border-b border-slate-100 dark:border-white/[0.06] px-6 py-4 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Historique des Mouvements ({article.mouvements.length})
              </h2>
            </div>

            <div className="p-6">
              {article.mouvements.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
                  Aucun mouvement enregistré pour le moment.
                </div>
              ) : (
                <div className="relative border-l border-slate-200 dark:border-white/[0.08] ml-3 space-y-6">
                  {article.mouvements.map((mvt: any) => {
                    let Icon = ArrowRightLeft
                    let colorClass = "bg-slate-50 dark:bg-[#161d2d] border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200"
                    let iconBgClass = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"

                    if (mvt.type === "Achat") {
                      Icon = PackagePlus
                      colorClass = "text-emerald-800 dark:text-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/40"
                      iconBgClass = "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300"
                    } else if (mvt.type === "Depart") {
                      Icon = ArrowRightLeft
                      colorClass = "text-amber-800 dark:text-amber-200 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/40"
                      iconBgClass = "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300"
                    } else if (mvt.type === "Retour") {
                      Icon = RefreshCw
                      colorClass = "text-blue-800 dark:text-blue-200 bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800/40"
                      iconBgClass = "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                    } else if (mvt.type === "Consomme" || mvt.type === "Perte") {
                      Icon = PackageMinus
                      colorClass = "text-rose-800 dark:text-rose-200 bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-800/40"
                      iconBgClass = "bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300"
                    } else if (
                      mvt.type === "Correction" ||
                      mvt.type === "Correction_Plus" ||
                      mvt.type === "Correction_Moins"
                    ) {
                      Icon = Edit
                      colorClass = "text-purple-800 dark:text-purple-200 bg-purple-50/60 dark:bg-purple-950/30 border-purple-200/80 dark:border-purple-800/40"
                      iconBgClass = "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300"
                    }

                    const isNegative =
                      mvt.type === "Depart" ||
                      mvt.type === "Consomme" ||
                      mvt.type === "Perte" ||
                      mvt.type === "Correction_Moins" ||
                      (mvt.type === "Correction" && mvt.quantite < 0)

                    return (
                      <div key={mvt.id} className="relative pl-6">
                        <div className={`absolute -left-4 top-1 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#111622] ${iconBgClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className={`rounded-xl border p-4 shadow-2xs text-xs ${colorClass}`}>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm tabular-nums">
                                  {isNegative ? "-" : "+"}
                                  {Math.abs(mvt.quantite)} {unite}
                                </span>
                                <span className="font-semibold">{mvt.type}</span>
                              </div>
                              <div className="mt-1 font-medium opacity-90">
                                Saisi par : <span className="underline decoration-dashed">{mvt.utilisateur || "Anonyme"}</span>
                              </div>
                              {mvt.chantier && (
                                <div className="mt-1">
                                  📍 Chantier : <span className="font-semibold">{mvt.chantier.nom}</span>
                                </div>
                              )}
                              {mvt.observation && (
                                <div className="mt-1.5 italic opacity-80">
                                  "{mvt.observation}"
                                </div>
                              )}
                            </div>
                            <div className="text-[11px] font-medium opacity-60 sm:text-right">
                              {new Date(mvt.date).toLocaleDateString("fr-FR", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
