import {
  Clock,
  Calendar,
  User,
  MapPin,
  Wrench,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface MouvementItem {
  id: string;
  type: string;
  utilisateur: string;
  date: Date | string;
  observation?: string | null;
  chantier?: {
    id: string;
    nom: string;
    ville?: string | null;
  } | null;
}

interface OutillageHistoriqueProps {
  mouvements: MouvementItem[];
  statutActuel: string;
  utilisateurActuel?: string | null;
  chantierActuel?: {
    id: string;
    nom: string;
    ville?: string | null;
  } | null;
}

export function OutillageHistorique({
  mouvements,
  statutActuel,
  utilisateurActuel,
  chantierActuel,
}: OutillageHistoriqueProps) {
  const getBadgeType = (type: string) => {
    switch (type?.toLowerCase()) {
      case "emprunt":
        return {
          label: "Départ Chantier",
          icon: (
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          ),
          cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40",
          dot: "bg-blue-500",
        };
      case "retour":
        return {
          label: "Retour Dépôt",
          icon: (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ),
          cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40",
          dot: "bg-emerald-500",
        };
      case "réparation":
      case "reparation":
        return {
          label: "En Réparation",
          icon: (
            <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          ),
          cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40",
          dot: "bg-amber-500",
        };
      case "perte":
        return {
          label: "Déclaré Perdu",
          icon: (
            <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          ),
          cls: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200/60 dark:border-red-800/40",
          dot: "bg-red-500",
        };
      default:
        return {
          label: type || "Mouvement",
          icon: <Clock className="w-3.5 h-3.5 text-slate-500" />,
          cls: "bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300 border-slate-200/60 dark:border-white/10",
          dot: "bg-slate-400",
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Statut actuel résumé */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Affectation en cours
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                statutActuel === "Disponible"
                  ? "bg-emerald-500"
                  : statutActuel === "En Chantier"
                    ? "bg-blue-500 live-dot"
                    : "bg-amber-500"
              }`}
            />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {statutActuel}
            </span>
            {chantierActuel && (
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                sur{" "}
                <Link
                  href={`/chantiers/${chantierActuel.id}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  {chantierActuel.nom}
                </Link>
                {chantierActuel.ville && ` (${chantierActuel.ville})`}
              </span>
            )}
          </div>
        </div>

        {utilisateurActuel && (
          <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-white/[0.03] px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06] self-start sm:self-auto">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400">
              Détenu par :
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {utilisateurActuel}
            </span>
          </div>
        )}
      </div>

      {/* Titre de section */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Historique chronologique des emprunts ({mouvements.length})
          </h2>
        </div>
      </div>

      {/* Liste chronologique (Timeline) */}
      {mouvements.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] text-xs text-slate-400">
          <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 stroke-1" />
          <p className="font-semibold text-slate-600 dark:text-slate-300">
            Aucun emprunt enregistré pour le moment
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Dès qu'un chef d'équipe emprunte cette machine via le départ
            chantier, l'historique complet s'inscrira ici.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] p-4 sm:p-5 shadow-2xs">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-white/10">
            {mouvements.map((m) => {
              const badge = getBadgeType(m.type);
              const d = new Date(m.date);
              const dateFormatted = d.toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const heureFormatted = d.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={m.id} className="relative group">
                  {/* Point sur la timeline */}
                  <div
                    className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-[#111622] ${badge.dot}`}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.cls}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {m.utilisateur}
                      </span>

                      {m.chantier && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <Link
                            href={`/chantiers/${m.chantier.id}`}
                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {m.chantier.nom}
                          </Link>
                          {m.chantier.ville && (
                            <span className="text-[11px] text-slate-400">
                              ({m.chantier.ville})
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                      {dateFormatted} à {heureFormatted}
                    </div>
                  </div>

                  {m.observation && (
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.02] p-2.5 rounded-xl border border-slate-100 dark:border-white/[0.04]">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        Observation :{" "}
                      </span>
                      {m.observation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
