"use client";

import { useState, useRef } from "react";
import {
  Camera,
  Sparkles,
  X,
  Check,
  Plus,
  Minus,
  AlertCircle,
  RefreshCw,
  UploadCloud,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

export interface PhotoDetectedItem {
  id: string;
  articleId: string | null;
  reference: string;
  designation: string;
  unite: string;
  quantite: number;
  marque?: string;
  confiance: number;
  remarqueVisuelle?: string;
  estExistant: boolean;
}

export function PhotoScannerModal({
  isOpen,
  onClose,
  onValidateItems,
  contexte = "DEPOT",
}: {
  isOpen: boolean;
  onClose: () => void;
  onValidateItems: (items: PhotoDetectedItem[]) => void;
  contexte?: "DEPOT" | "CHANTIER" | "INVENTAIRE";
}) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<PhotoDetectedItem[]>([]);
  const [resumeIA, setResumeIA] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    analyserPhoto(file);
  };

  const analyserPhoto = async (file: File) => {
    setIsAnalyzing(true);
    setDetectedItems([]);
    setResumeIA(null);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await fetch("/api/scan-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || "Échec de l'analyse photo.");
        setIsAnalyzing(false);
        return;
      }

      setDetectedItems(data.items || []);
      setResumeIA(data.resume || "Matériel identifié avec succès.");
      if (data.items?.length > 0) {
        toast.success(
          `✨ ${data.items.length} matériel(s) détecté(s) par l'IA !`,
        );
      } else {
        toast.warning(
          "Aucun équipement électrique net n'a été reconnu. Essayez de vous rapprocher.",
        );
      }
    } catch {
      toast.error("Erreur de connexion lors de l'analyse visuelle.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setDetectedItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantite: Math.max(0, item.quantite + delta) }
            : item,
        )
        .filter((item) => item.quantite > 0),
    );
  };

  const handleValidate = () => {
    if (detectedItems.length === 0) {
      toast.warning("Aucun article à ajouter.");
      return;
    }
    onValidateItems(detectedItems);
    handleClose();
  };

  const handleClose = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setDetectedItems([]);
    setResumeIA(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-white/10 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Prestige */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Snap & Count • Vision IA
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Gemini Vision
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Prenez une photo en vrac : l'IA compte et identifie les
                matériels automatiquement.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Zone de déclenchement photo / upload */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCapturePhoto}
              className="hidden"
              id="snap-photo-input"
            />

            {!photoPreview ? (
              <label
                htmlFor="snap-photo-input"
                className="flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all cursor-pointer group text-center"
              >
                <div className="h-14 w-14 rounded-2xl bg-white dark:bg-[#161d2d] border border-blue-200/80 dark:border-blue-700/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm group-hover:scale-110 transition-transform mb-3">
                  <Camera className="w-7 h-7" />
                </div>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Prendre une photo du matériel
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Disjoncteurs, boîtes, étiquettes de cartons ou retour camion.
                  L'IA analyse tout en quelques secondes.
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Ouvrir l'appareil photo</span>
                </span>
              </label>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 max-h-48 sm:max-h-56 bg-slate-900 flex items-center justify-center">
                  <img
                    src={photoPreview}
                    alt="Aperçu du matériel"
                    className="w-full h-full object-contain max-h-56"
                  />
                  <label
                    htmlFor="snap-photo-input"
                    className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reprendre</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* État de chargement IA */}
          {isAnalyzing && (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] text-center space-y-3 animate-pulse">
              <div className="inline-flex p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  Analyse visuelle en cours par l'IA...
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Reconnaissance des formes, calibres, marques et comptage
                  automatique.
                </p>
              </div>
            </div>
          )}

          {/* Résultats de l'analyse avec contrôle manuel avant validation */}
          {!isAnalyzing && detectedItems.length > 0 && (
            <div className="space-y-3 animate-in fade-in">
              {resumeIA && (
                <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 font-medium flex items-center justify-between">
                  <span>✨ {resumeIA}</span>
                  <span className="text-[11px] font-bold opacity-75">
                    {detectedItems.length} réf. trouvée(s)
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Vérification & Ajustement Rapide (Quantités éditables) :
                </p>

                <div className="divide-y divide-slate-100 dark:divide-white/[0.06] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#161d2d] overflow-hidden shadow-2xs">
                  {detectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {item.designation}
                          </span>
                          {item.estExistant && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 shrink-0">
                              Catalogue
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                          <span>{item.reference}</span>
                          {item.marque && <span>• {item.marque}</span>}
                          {item.remarqueVisuelle && (
                            <span className="font-sans italic text-slate-400">
                              ({item.remarqueVisuelle})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contrôle tactile de quantité (+ / -) */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="h-7 w-7 rounded-lg bg-white dark:bg-[#111622] hover:bg-rose-50 text-slate-700 dark:text-slate-200 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          aria-label="Diminuer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-extrabold text-xs text-slate-900 dark:text-white tabular-nums">
                          {item.quantite}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-7 w-7 rounded-lg bg-white dark:bg-[#111622] hover:bg-emerald-50 text-slate-700 dark:text-slate-200 hover:text-emerald-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          aria-label="Augmenter"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec action de validation */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleValidate}
            disabled={detectedItems.length === 0 || isAnalyzing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-sm disabled:opacity-50 transition-all tactile-btn cursor-pointer"
          >
            <Check className="w-4 h-4 text-emerald-500" />
            <span>
              Valider l'ajout (
              {detectedItems.reduce((acc, i) => acc + i.quantite, 0)} pièces)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
