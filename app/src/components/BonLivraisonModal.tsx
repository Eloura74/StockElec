"use client";

import React, { useState } from "react";
import {
  Download,
  Share2,
  MessageCircle,
  FileText,
  X,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  BonLivraisonData,
  buildBonLivraisonPdf,
  partagerBonLivraison,
} from "@/lib/generateBonLivraisonPdf";
import { toast } from "sonner";

interface BonLivraisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BonLivraisonData;
}

export function BonLivraisonModal({
  isOpen,
  onClose,
  data,
}: BonLivraisonModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const totalPieces = data.lignes.reduce(
    (sum, l) => sum + (Number(l.quantite) || 0),
    0,
  );

  const handleDownload = () => {
    setIsGenerating(true);
    try {
      const { save } = buildBonLivraisonPdf(data);
      save();
      toast.success("Bon de livraison PDF téléchargé !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la génération du PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      await partagerBonLivraison(data);
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du partage.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsApp = () => {
    const textResume =
      `📄 *BON DE SORTIE CHANTIER - QUENTIN ÉLECTRICITÉ*\n` +
      `🏗️ *Chantier :* ${data.chantierNom}\n` +
      `👤 *Chef d'équipe :* ${data.utilisateur || "Électricien"}\n` +
      `📦 *Matériel :* ${data.lignes.length} réf. (${totalPieces} pièces)\n` +
      `📅 *Date :* ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}\n` +
      (data.observation ? `📝 *Note :* ${data.observation}\n` : "");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(textResume)}`,
      "_blank",
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-white/10 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* En-tête de la modale */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
                Départ Confirmé
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Bon de Sortie & Livraison (BL)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aperçu rapide */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
            <span>Chantier :</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {data.chantierNom}
            </span>
          </div>
          {data.chantierAdresse && (
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Lieu :</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {data.chantierAdresse}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
            <span>Intervenant :</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {data.utilisateur || "Chef d'équipe"}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-white/[0.04] pt-2">
            <span>Matériel embarqué :</span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400">
              {data.lignes.length} références ({totalPieces} pièces)
            </span>
          </div>
        </div>

        {/* Boutons d'actions rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger le PDF A4</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Partager (Mobile)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleWhatsApp}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 font-semibold text-xs transition-all active:scale-95 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>Envoyer le récapitulatif par WhatsApp</span>
        </button>

        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
          >
            Fermer et poursuivre la saisie
          </button>
        </div>
      </div>
    </div>
  );
}
