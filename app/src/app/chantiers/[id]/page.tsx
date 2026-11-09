import prisma from "@/lib/prisma"
import { updateChantier, deleteChantier, cloturerChantier } from "@/app/actions/chantiers"
import {
  ArrowLeft,
  Edit,
  Save,
  Package,
  CheckCircle2,
  MapPin,
  DollarSign,
  HardHat,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { DeleteButton } from "@/components/DeleteButton"
import { CloturerButton } from "@/components/CloturerButton"
import { ExportBonLivraisonButton } from "@/components/ExportBonLivraisonButton"
import { GpsNavigationButtons } from "@/components/GpsNavigationButtons"
import { normaliserUnite } from "@/lib/stockUtils"
import { chargerAdresseChantier } from "@/lib/chantier-adresse"

export default async function ChantierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [chantier, adresse] = await Promise.all([
    prisma.chantier.findUnique({
      where: { id },
      include: {
        mouvements: {
          include: { article: true },
          orderBy: { date: "desc" },
        },
      },
    }),
    chargerAdresseChantier(id),
  ])

  if (!chantier) {
    redirect("/chantiers")
  }

  // Calcul du matériel présent sur ce chantier (par article)
  const materielSurSiteMap = new Map<string, { article: any; quantite: number }>()
  let valeurTotale = 0

  chantier.mouvements.forEach((mvt: any) => {
    if (!materielSurSiteMap.has(mvt.articleId)) {
      materielSurSiteMap.set(mvt.articleId, { article: mvt.article, quantite: 0 })
    }
    const current = materielSurSiteMap.get(mvt.articleId)!

    if (mvt.type === "Depart") {
      current.quantite += mvt.quantite
    } else if (mvt.type === "Retour" || mvt.type === "Consomme" || mvt.type === "Perte") {
      current.quantite -= mvt.quantite
    }
  })

  const materielDeploye = Array.from(materielSurSiteMap.values()).filter((m) => m.quantite > 0)
  materielDeploye.forEach((m) => {
    valeurTotale += m.quantite * (m.article.prixUnitaire || 0)
  })

  let valeurConsommee = 0
  let valeurPerdue = 0

  chantier.mouvements.forEach((mvt: any) => {
    const cout = mvt.quantite * (mvt.article.prixUnitaire || 0)
    if (mvt.type === "Consomme") {
      valeurConsommee += cout
    } else if (mvt.type === "Perte") {
      valeurPerdue += cout
    }
  })

  const totalUnitesSurSite = materielDeploye.reduce((acc, m) => acc + m.quantite, 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* En-tête Prestige */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Link
            href="/chantiers"
            className="mt-1 p-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-2xs transition-colors"
            title="Retour aux chantiers"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  chantier.statut === "Actif"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60 dark:border-white/[0.06]"
                }`}
              >
                {chantier.statut === "Actif" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 live-dot" />}
                {chantier.statut === "Terminé" ? "Clôturé" : "Chantier Actif"}
              </span>

              {adresse && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresse)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-emerald-300 transition-colors"
                  title="Ouvrir dans Google Maps"
                >
                  <MapPin className="w-3 h-3 text-emerald-500" />
                  <span>{adresse}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                {chantier.nom}
              </h1>
              <GpsNavigationButtons
                destination={adresse || chantier.nom}
                size="sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportBonLivraisonButton chantier={chantier} materielDeploye={materielDeploye} />
          {chantier.statut === "Actif" && (
            <form action={cloturerChantier.bind(null, chantier.id)}>
              <CloturerButton />
            </form>
          )}
          <form action={deleteChantier.bind(null, chantier.id)}>
            <DeleteButton message="Supprimer définitivement ce chantier et tout son historique ?" />
          </form>
        </div>
      </div>

      {/* Cartes KPI Prestige */}
      {chantier.statut === "Terminé" ? (
        <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-[#101915] p-6 shadow-2xs">
          <h2 className="text-base font-extrabold text-emerald-900 dark:text-emerald-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Bilan Financier du Chantier
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#111622] p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Matériel Consommé</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{valeurConsommee.toFixed(2)} € HT</p>
            </div>
            <div className="bg-white dark:bg-[#111622] p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Matériel Perdu / Cassé</p>
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">{valeurPerdue.toFixed(2)} € HT</p>
            </div>
            <div className="bg-emerald-600 p-4 rounded-xl text-white shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100 mb-1">Coût Total Réel HT</p>
              <p className="text-2xl font-extrabold tabular-nums">{(valeurConsommee + valeurPerdue).toFixed(2)} € HT</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                Matériel Déployé sur Site
              </span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {totalUnitesSurSite} <span className="text-sm font-semibold opacity-75">unité{totalUnitesSurSite > 1 ? "s" : ""}</span>
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {materielDeploye.length} référence{materielDeploye.length > 1 ? "s" : ""} active{materielDeploye.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-slate-800 dark:text-amber-400 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                Valeur Actuelle sur Site
              </span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                {valeurTotale.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                matériel actuellement mobilisé
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                Mouvements Enregistrés
              </span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {chantier.mouvements.length}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                sorties et retours tracés
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 flex items-center justify-center">
              <HardHat className="h-5 w-5" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulaire de modification Prestige */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs overflow-hidden sticky top-6">
            <div className="p-4.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400 flex items-center justify-center">
                <Edit className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Paramètres du Chantier
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Nom, adresse d'intervention et statut
                </p>
              </div>
            </div>

            <form action={updateChantier} className="p-5 space-y-4 text-xs">
              <input type="hidden" name="id" value={chantier.id} />

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nom du chantier *
                </label>
                <input
                  name="nom"
                  type="text"
                  defaultValue={chantier.nom}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  Adresse / Localisation
                </label>
                <input
                  name="adresse"
                  type="text"
                  defaultValue={adresse || ""}
                  placeholder="ex: 14 Bd du Cap, 06160 Antibes"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Statut
                </label>
                <select
                  name="statut"
                  defaultValue={chantier.statut}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="Actif">Actif</option>
                  <option value="Terminé">Terminé</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-2 flex justify-center items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 px-4 py-2.5 text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer</span>
              </button>
            </form>
          </div>
        </div>

        {/* Matériel sur site + Historique */}
        <div className="lg:col-span-2 space-y-6">
          {chantier.statut === "Actif" && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs overflow-hidden">
              <div className="border-b border-slate-100 dark:border-white/[0.06] px-6 py-4 bg-slate-50/50 dark:bg-white/[0.02]">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Matériel Actuellement sur ce Chantier ({materielDeploye.length})
                </h2>
              </div>
              <div className="p-5">
                {materielDeploye.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                    Aucun matériel actuellement déployé sur ce chantier.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {materielDeploye.map((m) => (
                      <div key={m.article.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0 text-xs">
                        <div>
                          <Link
                            href={`/catalogue/${m.article.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            {m.article.designation}
                          </Link>
                          <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{m.article.reference}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                            {m.quantite} {normaliserUnite(m.article.unite)}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                            Soit {(m.quantite * (m.article.prixUnitaire || 0)).toFixed(2)} € HT
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs overflow-hidden">
            <div className="border-b border-slate-100 dark:border-white/[0.06] px-6 py-4 bg-slate-50/50 dark:bg-white/[0.02]">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Historique des Mouvements ({chantier.mouvements.length})
              </h2>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/75 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06]">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Date</th>
                    <th className="px-5 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Article</th>
                    <th className="px-5 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Par</th>
                    <th className="px-5 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Type</th>
                    <th className="px-5 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Qté</th>
                    <th className="px-5 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Obs.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {chantier.mouvements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                        Aucun mouvement enregistré.
                      </td>
                    </tr>
                  ) : (
                    chantier.mouvements.map((mvt: any) => (
                      <tr key={mvt.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(mvt.date).toLocaleDateString("fr-FR")} à {new Date(mvt.date).getHours()}:
                          {new Date(mvt.date).getMinutes().toString().padStart(2, "0")}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">{mvt.article.designation}</td>
                        <td className="px-5 py-3">
                          {mvt.utilisateur ? (
                            <span className="text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">
                              {mvt.utilisateur}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              mvt.type === "Depart"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                : mvt.type === "Retour"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                            }`}
                          >
                            {mvt.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-extrabold text-slate-900 dark:text-white tabular-nums">
                          {mvt.type === "Depart" ? "+" : "-"}
                          {mvt.quantite}
                        </td>
                        <td className="px-5 py-3 text-slate-400 italic max-w-xs truncate" title={mvt.observation || ""}>
                          {mvt.observation || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Vue Mobile (Historique Mouvements) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.04]">
              {chantier.mouvements.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">Aucun mouvement enregistré.</div>
              ) : (
                chantier.mouvements.map((mvt: any) => (
                  <div key={mvt.id} className="p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>
                        {new Date(mvt.date).toLocaleDateString("fr-FR")} à {new Date(mvt.date).getHours()}:
                        {new Date(mvt.date).getMinutes().toString().padStart(2, "0")}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold text-[10px] uppercase ${
                          mvt.type === "Depart"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                            : mvt.type === "Retour"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                        }`}
                      >
                        {mvt.type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-[#161d2d] p-3 rounded-xl">
                      <div className="font-semibold text-slate-900 dark:text-white">{mvt.article.designation}</div>
                      <div
                        className={`font-extrabold text-sm tabular-nums ${
                          mvt.type === "Depart"
                            ? "text-blue-600 dark:text-blue-400"
                            : mvt.type === "Retour"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {mvt.type === "Depart" ? "+" : "-"}
                        {mvt.quantite}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
