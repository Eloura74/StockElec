"use client";

import React, { useState } from "react";
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export interface ItemAuditCamion {
  id: string;
  famille: "Tableau" | "Câblage" | "Appareillage" | "Connexion & Fixation";
  nom: string;
  referenceType?: string;
  statut: "OK" | "MANQUANT";
}

const ITEMS_DEFAUT_CAMION: ItemAuditCamion[] = [
  // Tableau
  {
    id: "1",
    famille: "Tableau",
    nom: "Disjoncteurs 16A",
    referenceType: "Hager / Legrand",
    statut: "OK",
  },
  {
    id: "2",
    famille: "Tableau",
    nom: "Disjoncteurs 20A",
    referenceType: "Hager / Legrand",
    statut: "OK",
  },
  {
    id: "3",
    famille: "Tableau",
    nom: "Disjoncteurs 10A (Éclairage)",
    referenceType: "Hager / Legrand",
    statut: "OK",
  },
  {
    id: "4",
    famille: "Tableau",
    nom: "Inter différentiel 40A 30mA (Type A & AC)",
    referenceType: "Diff 30mA",
    statut: "OK",
  },

  // Câblage & Gaines
  {
    id: "5",
    famille: "Câblage",
    nom: "Couronne R2V 3G1.5 (Éclairage)",
    referenceType: "R2V 3G1.5",
    statut: "OK",
  },
  {
    id: "6",
    famille: "Câblage",
    nom: "Couronne R2V 3G2.5 (Prises)",
    referenceType: "R2V 3G2.5",
    statut: "OK",
  },
  {
    id: "7",
    famille: "Câblage",
    nom: "Gaine ICTA Ø16 / Ø20 préfilée",
    referenceType: "ICTA",
    statut: "OK",
  },

  // Appareillage
  {
    id: "8",
    famille: "Appareillage",
    nom: "Prises de courant 2P+T",
    referenceType: "Céliane / Dooxie / Odace",
    statut: "OK",
  },
  {
    id: "9",
    famille: "Appareillage",
    nom: "Interrupteurs Va-et-Vient",
    referenceType: "Mécanismes",
    statut: "OK",
  },
  {
    id: "10",
    famille: "Appareillage",
    nom: "Boîtes d'encastrement 1 Poste prof. 40",
    referenceType: "Batibox",
    statut: "OK",
  },
  {
    id: "11",
    famille: "Appareillage",
    nom: "Boîtes d'encastrement 1 Poste prof. 50 (Micromodules)",
    referenceType: "Batibox 50",
    statut: "OK",
  },

  // Connexion & Fixation
  {
    id: "12",
    famille: "Connexion & Fixation",
    nom: "Wago 2 entrées (221-412)",
    referenceType: "WAGO",
    statut: "OK",
  },
  {
    id: "13",
    famille: "Connexion & Fixation",
    nom: "Wago 3 entrées (221-413)",
    referenceType: "WAGO",
    statut: "OK",
  },
  {
    id: "14",
    famille: "Connexion & Fixation",
    nom: "Wago 5 entrées (221-415)",
    referenceType: "WAGO",
    statut: "OK",
  },
  {
    id: "15",
    famille: "Connexion & Fixation",
    nom: "Boîte de vis placo 25/35mm",
    referenceType: "Vis",
    statut: "OK",
  },
  {
    id: "16",
    famille: "Connexion & Fixation",
    nom: "Chevilles crampon Ø6",
    referenceType: "Chevilles",
    statut: "OK",
  },
  {
    id: "17",
    famille: "Connexion & Fixation",
    nom: "Adhésif électricien / Chatterton (Noir, Bleu, V/J)",
    referenceType: "Scotch",
    statut: "OK",
  },
  {
    id: "18",
    famille: "Connexion & Fixation",
    nom: "Colliers d'installation Colson / Rilsan",
    referenceType: "Colliers",
    statut: "OK",
  },
];

interface AuditCamionModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
}

export function AuditCamionModal({
  isOpen,
  onClose,
  username = "Chef d'équipe",
}: AuditCamionModalProps) {
  const [items, setItems] = useState<ItemAuditCamion[]>(ITEMS_DEFAUT_CAMION);
  const [immatriculation, setImmatriculation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dernierAudit, setDernierAudit] = useState<{
    date: string;
    manques: string[];
  } | null>(null);

  if (!isOpen) return null;

  const toggleStatut = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, statut: item.statut === "OK" ? "MANQUANT" : "OK" }
          : item,
      ),
    );
  };

  const toutMettreOk = () => {
    setItems((prev) => prev.map((item) => ({ ...item, statut: "OK" })));
    toast.success("Toutes les lignes sont cochées en stock OK !");
  };

  const nbManquants = items.filter((i) => i.statut === "MANQUANT").length;
  const pourcentageOk = Math.round(
    ((items.length - nbManquants) / items.length) * 100,
  );

  const handleValider = () => {
    setIsSubmitting(true);
    const manques = items
      .filter((i) => i.statut === "MANQUANT")
      .map((i) => i.nom);

    // Stockage local pour persistance rapide
    const auditRecord = {
      date:
        new Date().toLocaleDateString("fr-FR") +
        " à " +
        new Date().toLocaleTimeString("fr-FR"),
      utilisateur: username,
      camion: immatriculation || "Camion Équipe",
      score: `${pourcentageOk}%`,
      manques,
    };

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(
          "dernier_audit_camion",
          JSON.stringify(auditRecord),
        );
      }
    } catch {
      // ignore
    }

    setDernierAudit({
      date: auditRecord.date,
      manques,
    });

    setIsSubmitting(false);

    if (manques.length === 0) {
      toast.success("✅ Audit camion validé : Coffre 100% complet et prêt !");
    } else {
      toast.warning(
        `⚠️ Audit enregistré : ${manques.length} référence(s) à réapprovisionner.`,
      );
    }
  };

  const familles = [
    "Tableau",
    "Câblage",
    "Appareillage",
    "Connexion & Fixation",
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Audit Rapide Coffre Camion
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    nbManquants === 0
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200"
                  }`}
                >
                  {pourcentageOk}% Prêt
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Check-list express en 3 min des consommables indispensables
                avant le départ.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre d'outils rapide */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Immat. ou Camion (ex: Trafic #2)"
              value={immatriculation}
              onChange={(e) => setImmatriculation(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-[#161d2d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium placeholder:text-slate-400 w-48"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toutMettreOk}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/15 transition-all cursor-pointer"
            >
              ✅ Tout cocher OK
            </button>
          </div>
        </div>

        {/* Liste avec défilement fluide */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {familles.map((famille) => {
            const itemsFamille = items.filter((i) => i.famille === famille);
            return (
              <div key={famille} className="space-y-2">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {famille} ({itemsFamille.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {itemsFamille.map((item) => {
                    const isOk = item.statut === "OK";
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleStatut(item.id)}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all active:scale-[0.98] cursor-pointer ${
                          isOk
                            ? "bg-white dark:bg-[#111622] border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-700"
                            : "bg-amber-50/70 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/60 ring-1 ring-amber-400/30"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {item.nom}
                          </p>
                          {item.referenceType && (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {item.referenceType}
                            </p>
                          )}
                        </div>

                        <span
                          className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl border transition-all ${
                            isOk
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200"
                              : "bg-amber-500 text-white border-amber-600 shadow-xs"
                          }`}
                        >
                          {isOk ? "✅ En stock" : "⚠️ Manquant"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer avec Validation */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/75 dark:bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {nbManquants === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Aucun manque détecté,
                camion opérationnel.
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> {nbManquants} article(s) à
                réapprovisionner au dépôt.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleValider}
              disabled={isSubmitting}
              className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Valider l'audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
