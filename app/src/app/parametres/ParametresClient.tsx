"use client";

import React from "react";
import { 
  Sun, 
  Moon, 
  Laptop, 
  Palette, 
  Sliders, 
  Check, 
  ShieldCheck, 
  Contrast
} from "lucide-react";
import { useTheme } from "next-themes";
import { useCyberTheme, CYBER_THEMES, CyberThemeId } from "@/components/CyberThemeProvider";
import { toast } from "sonner";
import Link from "next/link";

interface ParametresClientProps {
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export function ParametresClient({ user }: ParametresClientProps) {
  const { theme, setTheme } = useTheme();
  const {
    cyberTheme,
    setCyberTheme,
    contrastHigh,
    setContrastHigh,
    setIsSettingsOpen,
    currentThemeConfig,
    mounted
  } = useCyberTheme();

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success(`Affichage basculé en mode ${newTheme === "dark" ? "Sombre" : newTheme === "light" ? "Clair" : "Automatique"}`);
  };

  const handleCyberThemeChange = (themeId: CyberThemeId) => {
    setCyberTheme(themeId);
    const selected = CYBER_THEMES.find(t => t.id === themeId);
    toast.success(`Finition appliquée : ${selected?.name || themeId}`);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header Prestigieux & Sobre */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Préférences & Finitions
            </h1>
            <span 
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white shadow-2xs"
              style={{ backgroundColor: currentThemeConfig.colorHex }}
            >
              {mounted ? currentThemeConfig.name : "Bleu Saphir"}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personnalisez l'ambiance lumineuse, les finitions exclusives et le confort visuel de StockElec.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111622] hover:bg-slate-50 dark:hover:bg-[#161d2d] text-slate-700 dark:text-slate-200 text-xs font-medium transition-all shadow-2xs cursor-pointer"
        >
          <Palette className="h-3.5 w-3.5 text-slate-400" />
          <span>Panneau Rapide</span>
        </button>
      </div>

      {/* SECTION 1 : MODE LUMINEUX (Clair / Sombre / Système) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
              Mode d'Affichage
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sélectionnez la tonalité générale selon vos conditions de travail.
            </p>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Actuel : <span suppressHydrationWarning className="font-semibold text-slate-900 dark:text-white">{mounted ? (theme === "dark" ? "Sombre" : theme === "light" ? "Clair" : "Automatique") : "Automatique"}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Option Clair */}
          <button
            type="button"
            onClick={() => handleThemeChange("light")}
            className={`relative p-5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
              mounted && theme === "light"
                ? "bg-white border-slate-900 text-slate-900 shadow-md ring-1 ring-slate-900"
                : "bg-white dark:bg-[#111622] border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 dark:bg-slate-800 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-transparent">
                <Sun className="h-4.5 w-4.5" />
              </div>
              {mounted && theme === "light" && (
                <div className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                  <Check className="h-3 w-3 stroke-2" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Mode Clair</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Fond blanc pur et contrasté, lisibilité maximale en plein soleil et extérieur.
              </p>
            </div>
          </button>

          {/* Option Sombre */}
          <button
            type="button"
            onClick={() => handleThemeChange("dark")}
            className={`relative p-5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
              mounted && theme === "dark"
                ? "bg-[#111622] border-white text-white shadow-md ring-1 ring-white"
                : "bg-white dark:bg-[#111622] border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-transparent">
                <Moon className="h-4.5 w-4.5" />
              </div>
              {mounted && theme === "dark" && (
                <div className="h-5 w-5 rounded-full bg-white text-slate-950 flex items-center justify-center">
                  <Check className="h-3 w-3 stroke-2" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Mode Sombre</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Fond obsidienne feutré et mat, repos visuel d'exception et élégance sobre.
              </p>
            </div>
          </button>

          {/* Option Système */}
          <button
            type="button"
            onClick={() => handleThemeChange("system")}
            className={`relative p-5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
              mounted && theme === "system"
                ? "bg-white dark:bg-[#111622] border-slate-900 dark:border-white text-slate-900 dark:text-white shadow-md ring-1 ring-slate-900 dark:ring-white"
                : "bg-white dark:bg-[#111622] border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-transparent">
                <Laptop className="h-4.5 w-4.5" />
              </div>
              {mounted && theme === "system" && (
                <div className="h-5 w-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center">
                  <Check className="h-3 w-3 stroke-2" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Synchronisation Système</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Bascule automatiquement selon l'horaire et les préférences de votre appareil.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 2 : FINITIONS EXCLUSIVES DE COULEUR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
              Finitions & Nuances Nobles
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choisissez l'harmonie de couleur appliquée aux boutons, indicateurs et sélections.
            </p>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            5 harmonies disponibles
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {CYBER_THEMES.map((themeOption) => {
            const isSelected = cyberTheme === themeOption.id;
            return (
              <button
                key={themeOption.id}
                type="button"
                onClick={() => handleCyberThemeChange(themeOption.id)}
                className={`relative p-4.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-3.5 ${
                  isSelected
                    ? "bg-white dark:bg-[#111622] border-slate-900 dark:border-white shadow-md ring-1 ring-slate-900 dark:ring-white"
                    : "bg-white dark:bg-[#111622] border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: themeOption.colorHex }}
                    />
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                      {themeOption.badge}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 stroke-2" />
                      Actif
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {themeOption.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {themeOption.subtitle}
                  </p>
                </div>

                {/* Échantillon visuel */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="h-2 w-5 rounded-full" 
                      style={{ backgroundColor: themeOption.colorHex }}
                    />
                    <div 
                      className="h-2 w-2 rounded-full opacity-50" 
                      style={{ backgroundColor: themeOption.colorHex }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {isSelected ? "Sélectionné" : "Appliquer"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3 : CONFORT VISUEL & DÉTAILS */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
            Confort Visuel
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ajustez la précision de contraste pour une lisibilité accrue.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Contraste renforcé */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Contrast className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-xs">
                  Contraste Renforcé
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Contours plus nets et contrastes accentués pour l'extérieur.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setContrastHigh(!contrastHigh);
                toast.success(contrastHigh ? "Contraste standard rétabli" : "Contraste renforcé activé");
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                contrastHigh ? "bg-slate-900 dark:bg-white" : "bg-slate-200 dark:bg-slate-700"
              }`}
              role="switch"
              aria-checked={contrastHigh}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-slate-950 shadow-sm ring-0 transition duration-200 ease-in-out ${
                  contrastHigh ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4 : SYSTÈME & INFOS */}
      <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">Logiciel</p>
            <p className="font-semibold text-slate-900 dark:text-white mt-0.5">StockElec Entreprise</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">v2.6 Professionnel</p>
          </div>
          <div>
            <p className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">Session</p>
            <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{user.username}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">{user.role}</p>
          </div>
          <div>
            <p className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">Sécurité</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">Authentifiée</p>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Contrôle d'accès RBAC</p>
          </div>
          <div>
            <p className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">Ressources</p>
            <div className="flex items-center gap-3 mt-1">
              <Link href="/guide" className="text-blue-600 dark:text-blue-400 hover:underline">
                Documentation
              </Link>
              <Link href="/journal" className="text-blue-600 dark:text-blue-400 hover:underline">
                Journal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
