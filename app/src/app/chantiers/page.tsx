import { createChantier, deleteChantier } from "@/app/actions/chantiers"
import { HardHat, Plus, MapPin, Wrench, Pencil, Layers, CheckCircle2, DollarSign, Building } from "lucide-react"
import { calculerResteSurChantier } from "@/lib/stockUtils"
import prisma from "@/lib/prisma"
import { chargerAdressesChantiers } from "@/lib/chantier-adresse"
import { DeleteButton } from "@/components/DeleteButton"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ChantiersPage() {
  const [chantiers, adressesMap] = await Promise.all([
    prisma.chantier.findMany({
      include: { 
        mouvements: {
          include: { article: true }
        } 
      },
      orderBy: { createdAt: 'desc' }
    }),
    chargerAdressesChantiers(),
  ])

  // Métriques de synthèse calculées côté serveur
  const chantiersCalcules = chantiers.map((chantier: any) => {
    const resteChantier = calculerResteSurChantier(chantier.mouvements)
    let materielDeploye = 0
    let valeurChantier = 0

    Object.entries(resteChantier).forEach(([articleId, qty]) => {
      const q = qty as number
      materielDeploye += q
      const mvt = chantier.mouvements.find((m: any) => m.articleId === articleId)
      if (mvt?.article?.prixUnitaire) {
        valeurChantier += q * mvt.article.prixUnitaire
      }
    })

    return {
      ...chantier,
      adresse: adressesMap.get(chantier.id) || null,
      materielDeploye,
      valeurChantier
    }
  })

  const chantiersActifsCount = chantiersCalcules.filter((c: any) => c.statut === "Actif").length
  const totalMaterielDeploye = chantiersCalcules.reduce((acc: number, c: any) => acc + c.materielDeploye, 0)
  const valeurTotaleEngagee = chantiersCalcules.reduce((acc: number, c: any) => acc + c.valeurChantier, 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* 1. Header Prestige */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
              Déploiement Opérationnel
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Chantiers & Projets Clients
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gestion des Chantiers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi des sites d'intervention, affectation des fournitures et contrôle budgétaire en direct.
          </p>
        </div>

        {/* Badges d'état rapide */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-[#111622] shadow-2xs flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 live-dot"></span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              {chantiersActifsCount} Actif{chantiersActifsCount > 1 ? "s" : ""}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {chantiers.length} Total
            </span>
          </div>
        </div>
      </div>

      {/* 2. Cartes de synthèse express (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-[#111622] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Chantiers Déployés
            </span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {chantiers.length}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              {chantiersActifsCount} en cours d'exécution
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400 flex items-center justify-center">
            <HardHat className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-[#111622] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Matériel sur Site
            </span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {totalMaterielDeploye.toLocaleString('fr-FR')}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              unités consommées ou en pose
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 flex items-center justify-center">
            <Wrench className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-[#111622] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Capital Mobilisé
            </span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {valeurTotaleEngagee.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              valorisation totale HT sur site
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Formulaire et Liste Principale */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaire d'ajout élégant */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-[#111622] shadow-2xs overflow-hidden sticky top-6">
            <div className="p-4.5 border-b border-slate-100 dark:border-white/6 bg-slate-50/50 dark:bg-white/2 flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Nouveau Chantier
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Ouverture d'un site d'intervention</p>
              </div>
            </div>

            <form action={createChantier} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nom du chantier *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input 
                    required 
                    name="nom" 
                    type="text" 
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/8 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#161d2d] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all" 
                    placeholder="ex: Rénovation Villa Cap d'Antibes" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Adresse / Localisation (optionnel)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input 
                    name="adresse" 
                    type="text" 
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/8 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#161d2d] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all" 
                    placeholder="ex: 14 Bd du Cap, 06160 Antibes" 
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Créer et Initialiser le Chantier</span>
              </button>
            </form>
          </div>
        </div>

        {/* Liste des chantiers */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-[#111622] shadow-2xs overflow-hidden">
            {/* Vue Desktop : Tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-white/6 text-xs">
                <thead className="bg-slate-50/75 dark:bg-white/2">
                  <tr>
                    <th className="px-4 py-3.5 text-left font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Nom du Chantier</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Localisation</th>
                    <th className="px-4 py-3.5 text-center font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Statut</th>
                    <th className="px-4 py-3.5 text-center font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Matériel Mobilisé</th>
                    <th className="px-4 py-3.5 text-right font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/4">
                  {chantiersCalcules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                        <HardHat className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
                        <p className="font-medium">Aucun chantier enregistré pour le moment.</p>
                      </td>
                    </tr>
                  ) : (
                    chantiersCalcules.map((chantier: any) => (
                      <tr 
                        key={chantier.id} 
                        className="hover:bg-slate-50/70 dark:hover:bg-white/2 transition-colors group"
                      >
                        {/* 1. Nom */}
                        <td className="px-4 py-3.5 font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:scale-105 transition-transform">
                              <HardHat className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <Link 
                                href={`/chantiers/${chantier.id}`} 
                                className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors block text-sm"
                              >
                                {chantier.nom}
                              </Link>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                {chantier.mouvements?.length || 0} mouvement(s) de stock
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Adresse */}
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                          {chantier.adresse ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(chantier.adresse)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                              title="Ouvrir dans Google Maps"
                            >
                              <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate max-w-55 underline decoration-dotted underline-offset-2">{chantier.adresse}</span>
                            </a>
                          ) : (
                            <Link
                              href={`/chantiers/${chantier.id}`}
                              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                              title="Cliquer pour renseigner l'adresse du chantier"
                            >
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-45 italic">+ Ajouter une adresse</span>
                            </Link>
                          )}
                        </td>

                        {/* 3. Statut avec live-dot */}
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            chantier.statut === 'Actif' 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40' 
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-white/6'
                          }`}>
                            {chantier.statut === 'Actif' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 live-dot"></span>}
                            <span>{chantier.statut}</span>
                          </span>
                        </td>

                        {/* 4. Matériel et valorisation */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-slate-900 dark:text-white text-xs tabular-nums">
                              {chantier.materielDeploye} unité{chantier.materielDeploye > 1 ? "s" : ""}
                            </span>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                              {chantier.valeurChantier.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT
                            </span>
                          </div>
                        </td>

                        {/* 5. Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link 
                              href={`/chantiers/${chantier.id}`} 
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200/60 transition-colors" 
                              title="Inspecter / Modifier"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>
                            <form action={deleteChantier.bind(null, chantier.id)}>
                              <DeleteButton message="Supprimer ce chantier va aussi supprimer son historique de mouvements. Continuer ?" />
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Vue Mobile (Cartes soignées) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/6">
              {chantiersCalcules.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  Aucun chantier enregistré.
                </div>
              ) : (
                chantiersCalcules.map((chantier: any) => (
                  <div key={chantier.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                          <HardHat className="h-4 w-4" />
                        </div>
                        <div>
                          <Link 
                            href={`/chantiers/${chantier.id}`} 
                            className="font-bold text-slate-900 dark:text-white text-sm hover:text-emerald-600"
                          >
                            {chantier.nom}
                          </Link>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">{chantier.adresse || 'Pas d\'adresse spécifiée'}</div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        chantier.statut === 'Actif' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60' 
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {chantier.statut === 'Actif' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 live-dot"></span>}
                        <span>{chantier.statut}</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-white/4">
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Matériel engagé</div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{chantier.materielDeploye} unités</div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{chantier.valeurChantier.toFixed(2)} € HT</div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Link 
                        href={`/chantiers/${chantier.id}`} 
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Inspecter</span>
                      </Link>
                      <form action={deleteChantier.bind(null, chantier.id)}>
                        <DeleteButton message="Supprimer ce chantier va aussi supprimer son historique de mouvements. Continuer ?" />
                      </form>
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
