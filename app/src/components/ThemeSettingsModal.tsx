"use client";

import React from "react";
import { 
  X, 
  Sun, 
  Moon, 
  Laptop, 
  Check, 
  Palette
} from "lucide-react";
import { useTheme } from "next-themes";
import { useCyberTheme, CYBER_THEMES } from "./CyberThemeProvider";

export function ThemeSettingsModal() {
  const { theme, setTheme } = useTheme();
  const {
    cyberTheme,
    setCyberTheme,
    isSettingsOpen,
    setIsSettingsOpen,
    currentThemeConfig,
    mounted
  } = useCyberTheme();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop sombre flouté */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
        onClick={() => setIsSettingsOpen(false)}
        aria-hidden="true"
      />

      {/* Boîte de dialogue prestigieuse */}
      <div 
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 animate-in zoom-in-95 duration-200 z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-settings-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div 
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-2xs"
              style={{ backgroundColor: currentThemeConfig.colorHex }}
            >
              <Palette className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 id="theme-settings-title" className="text-base font-bold text-slate-900 dark:text-white">
                Finitions & Ambiance Visuelle
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Harmonies de couleurs et réglages de confort
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            aria-label="Fermer les paramètres"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-5 space-y-6">
          {/* SECTION 1 : MODE D'AFFICHAGE */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Mode Lumineux
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Option Clair */}
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  theme === "light"
                    ? "bg-slate-100 dark:bg-white/10 border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold shadow-2xs"
                    : "bg-white dark:bg-[#161d2d] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Sun className="h-4.5 w-4.5 text-amber-500" />
                  {theme === "light" && <Check className="h-3.5 w-3.5 stroke-2" />}
                </div>
                <p className="text-xs font-medium">Clair</p>
              </button>

              {/* Option Sombre */}
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  theme === "dark"
                    ? "bg-slate-900 dark:bg-slate-800 border-slate-900 dark:border-white text-white font-semibold shadow-2xs"
                    : "bg-white dark:bg-[#161d2d] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Moon className="h-4.5 w-4.5 text-blue-400" />
                  {theme === "dark" && <Check className="h-3.5 w-3.5 stroke-2" />}
                </div>
                <p className="text-xs font-medium">Sombre</p>
              </button>

              {/* Option Système */}
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  theme === "system"
                    ? "bg-slate-200 dark:bg-slate-700 border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold shadow-2xs"
                    : "bg-white dark:bg-[#161d2d] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Laptop className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400" />
                  {theme === "system" && <Check className="h-3.5 w-3.5 stroke-2" />}
                </div>
                <p className="text-xs font-medium">Auto</p>
              </button>
            </div>
          </div>

          {/* SECTION 2 : FINITIONS DE COULEUR */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Finitions & Nuances Nobles
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CYBER_THEMES.map((themeOption) => {
                const isSelected = cyberTheme === themeOption.id;
                return (
                  <button
                    key={themeOption.id}
                    type="button"
                    onClick={() => setCyberTheme(themeOption.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-slate-50 dark:bg-white/[0.08] border-slate-900 dark:border-white shadow-2xs"
                        : "bg-white dark:bg-[#161d2d]/60 border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0 ring-2 ring-white dark:ring-[#111622]"
                        style={{ backgroundColor: themeOption.colorHex }}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {themeOption.name}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                          {themeOption.subtitle}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-slate-900 dark:text-white stroke-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3 : PIED DE PAGE */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Préférences appliquées instantanément.
            </p>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
