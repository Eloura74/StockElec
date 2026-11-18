"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingCart,
  User,
  MapPin,
  Activity,
  Truck,
  ScanBarcode,
  History,
  PlusCircle,
  X,
} from "lucide-react";
import { DeleteButton } from "@/components/DeleteButton";
import { MouvementForm } from "@/components/MouvementForm";

type MouvementItem = {
  id: string;
  date: Date | string;
  type: string;
  quantite: number;
  utilisateur: string | null;
  observation: string | null;
  article: {
    id: string;
    designation: string;
    reference: string;
  };
  chantier: {
    id: string;
    nom: string;
  } | null;
};

interface MouvementsViewClientProps {
  mouvements: MouvementItem[];
  articles: any[];
  chantiers: any[];
  annulerMouvementAction: (id: string) => Promise<any>;
}

export function MouvementsViewClient({
  mouvements,
  articles,
  chantiers,
  annulerMouvementAction,
}: MouvementsViewClientProps) {
  const [mobileTab, setMobileTab] = useState<"history" | "form">("history");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Depart":
        return {
          label: "Départ Chantier",
          icon: ArrowUpRight,
          style:
            "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40",
          isNegative: true,
        };
      case "Retour":
        return {
          label: "Retour Dépôt",
          icon: ArrowDownLeft,
          style:
            "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40",
          isNegative: false,
        };
      case "Achat":
        return {
          label: "Achat Fournisseur",
          icon: ShoppingCart,
          style:
            "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40",
          isNegative: false,
        };
      case "Consomme":
        return {
          label: "Consommé / Posé",
          icon: ArrowUpRight,
          style:
            "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40",
          isNegative: true,
        };
      case "Perte":
        return {
          label: "Perte / Cassé",
          icon: ArrowUpRight,
          style:
            "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40",
          isNegative: true,
        };
      default:
        return {
          label: type,
          icon: Activity,
          style:
            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60 dark:border-white/[0.06]",
          isNegative: false,
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Bannière d'accès direct au mode Terrain (Départ Chantier Camion) */}
      {!bannerDismissed && (
        <div className="rounded-2xl p-3.5 sm:p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-white/10 relative">
          <div className="flex items-center gap-3 min-w-0 pr-6 sm:pr-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/15 text-white shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm text-white">
                Départ Chantier &amp; Scan Camion
              </div>
              <p className="text-[11px] sm:text-xs text-blue-100 truncate sm:whitespace-normal">
                Interface mobile dédiée avec caméra rapide et mode hors-ligne.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/depart-matin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-900 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <ScanBarcode className="w-3.5 h-3.5 text-blue-600" />
              <span>Ouvrir Scan Camion</span>
            </Link>

            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Fermer cette bannière"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Sélecteur d'onglets Mobile (caché sur grand écran où les 2 s'affichent côte à côte) */}
      <div className="lg:hidden flex items-center p-1 bg-slate-100 dark:bg-white/[0.04] rounded-2xl border border-slate-200/60 dark:border-white/[0.06]">
        <button
          type="button"
          onClick={() => setMobileTab("history")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mobileTab === "history"
              ? "bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Historique ({mouvements.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("form")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mobileTab === "form"
              ? "bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5 text-blue-500" />
          <span>+ Saisie Manuelle</span>
        </button>
      </div>

      {/* 3. Grille responsive :
             - Sur mobile : seul l'onglet sélectionné est visible
             - Sur desktop : formulaire à gauche (1 col), historique à droite (2 cols)
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0 max-w-full pb-24 md:pb-8">
        {/* Colonne 1 : Formulaire de création */}
        <div
          className={`w-full min-w-0 max-w-full lg:col-span-1 ${mobileTab === "form" ? "block" : "hidden lg:block"}`}
        >
          <MouvementForm articles={articles} chantiers={chantiers} />
        </div>

        {/* Colonne 2 : Historique des mouvements */}
        <div
          className={`w-full min-w-0 max-w-full lg:col-span-2 ${mobileTab === "history" ? "block" : "hidden lg:block"}`}
        >
          <div className="w-full min-w-0 max-w-full rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs overflow-hidden">
            {/* Header d'historique avec titre et bouton rapide */}
            <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-white/[0.02] w-full min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">
                  Derniers mouvements
                </span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shrink-0">
                  {mouvements.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMobileTab("form")}
                className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition-colors shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-3 h-3" />
                <span>Nouveau</span>
              </button>
            </div>

            {/* Vue Desktop : Tableau (uniquement sur grand écran lg:) */}
            <div className="hidden lg:block overflow-x-auto w-full min-w-0">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
                <thead className="bg-slate-50/75 dark:bg-white/[0.02]">
                  <tr>
                    <th className="px-4 py-3.5 text-left font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                      Date &amp; Heure
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                      Type de flux
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                      Article &amp; Réf
                    </th>
                    <th className="px-4 py-3.5 text-center font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                      Quantité
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                      Destination / Auteur
                    </th>
                    <th className="px-4 py-3.5 text-right font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {mouvements.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-slate-400 dark:text-slate-500"
                      >
                        <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-500" />
                        <p className="font-medium">
                          Aucun mouvement trouvé pour cette période.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    mouvements.map((mvt) => {
                      const badge = getTypeBadge(mvt.type);
                      const Icon = badge.icon;
                      const d = new Date(mvt.date);

                      return (
                        <tr
                          key={mvt.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group"
                        >
                          {/* 1. Date */}
                          <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 tabular-nums">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {d.toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                            <span className="text-[10px] block text-slate-400">
                              {d.getHours()}:
                              {d.getMinutes().toString().padStart(2, "0")}
                            </span>
                          </td>

                          {/* 2. Type */}
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.style}`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{badge.label}</span>
                            </span>
                          </td>

                          {/* 3. Article */}
                          <td className="px-4 py-3.5">
                            <div
                              className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-[200px]"
                              title={mvt.article.designation}
                            >
                              {mvt.article.designation}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {mvt.article.reference}
                            </div>
                          </td>

                          {/* 4. Quantité */}
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-lg font-extrabold text-xs tabular-nums ${
                                badge.isNegative
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              }`}
                            >
                              {badge.isNegative ? "-" : "+"}
                              {mvt.quantite}
                            </span>
                          </td>

                          {/* 5. Destination / Utilisateur */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-0.5">
                              {mvt.chantier?.nom && (
                                <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[150px]">
                                    {mvt.chantier.nom}
                                  </span>
                                </div>
                              )}
                              {mvt.utilisateur && (
                                <div className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                  <User className="w-3 h-3" />
                                  <span>{mvt.utilisateur}</span>
                                </div>
                              )}
                              {mvt.observation && (
                                <p className="text-[10px] text-slate-400 italic truncate max-w-[150px]">
                                  &quot;{mvt.observation}&quot;
                                </p>
                              )}
                            </div>
                          </td>

                          {/* 6. Action */}
                          <td className="px-4 py-3.5 text-right">
                            <form
                              action={annulerMouvementAction.bind(null, mvt.id)}
                            >
                              <DeleteButton message="Annuler ce mouvement ? Un mouvement de correction inverse sera créé pour rétablir le stock." />
                            </form>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Vue Mobile : Cartes 100% responsives, sans aucun débordement */}
            <div className="lg:hidden divide-y divide-slate-100 dark:divide-white/[0.06] w-full min-w-0">
              {mouvements.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  Aucun mouvement enregistré pour cette période.
                </div>
              ) : (
                mouvements.map((mvt) => {
                  const badge = getTypeBadge(mvt.type);
                  const Icon = badge.icon;
                  const d = new Date(mvt.date);

                  return (
                    <div
                      key={mvt.id}
                      className="p-3.5 space-y-2.5 w-full min-w-0 max-w-full"
                    >
                      {/* Ligne 1 : Date & Type de mouvement */}
                      <div className="flex items-center justify-between gap-2 w-full min-w-0">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium tabular-nums shrink-0">
                          {d.toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                          })}{" "}
                          à {d.getHours()}:
                          {d.getMinutes().toString().padStart(2, "0")}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${badge.style}`}
                        >
                          <Icon className="w-3 h-3 shrink-0" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      {/* Ligne 2 : Bloc Article (Titre sur 2 lignes) + Quantité toujours visible */}
                      <div className="flex items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-white/[0.04] w-full min-w-0">
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="font-bold text-slate-900 dark:text-white text-xs leading-snug line-clamp-2 break-words">
                            {mvt.article.designation}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                            {mvt.article.reference}
                          </div>
                        </div>

                        {/* Pastille Quantité : shrink-0, impossible à cacher */}
                        <div
                          className={`text-sm font-black tabular-nums shrink-0 px-2.5 py-1 rounded-xl shadow-2xs border ${
                            badge.isNegative
                              ? "bg-amber-100 text-amber-900 border-amber-300/80 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800/60"
                              : "bg-emerald-100 text-emerald-900 border-emerald-300/80 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800/60"
                          }`}
                        >
                          {badge.isNegative ? "-" : "+"}
                          {mvt.quantite}
                        </div>
                      </div>

                      {/* Ligne 3 : Chantier, Auteur et bouton d'action */}
                      <div className="flex items-center justify-between gap-2 text-xs pt-0.5 w-full min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0 flex-1">
                          {mvt.chantier?.nom && (
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1 truncate max-w-[170px]">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {mvt.chantier.nom}
                              </span>
                            </span>
                          )}
                          {mvt.utilisateur && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium shrink-0">
                              Par: {mvt.utilisateur}
                            </span>
                          )}
                          {mvt.observation && (
                            <span className="text-[10px] text-slate-400 italic truncate max-w-[140px]">
                              &quot;{mvt.observation}&quot;
                            </span>
                          )}
                        </div>

                        <div className="shrink-0">
                          <form
                            action={annulerMouvementAction.bind(null, mvt.id)}
                          >
                            <DeleteButton message="Annuler ce mouvement ?" />
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
