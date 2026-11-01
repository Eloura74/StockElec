"use client";

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";

export type CyberThemeId = "cyan" | "emerald" | "amber" | "violet" | "stealth";

export interface CyberThemeConfig {
  id: CyberThemeId;
  name: string;
  subtitle: string;
  colorHex: string;
  glowColor: string;
  badge: string;
}

export const CYBER_THEMES: CyberThemeConfig[] = [
  {
    id: "cyan",
    name: "Bleu Saphir",
    subtitle: "Prestige intemporel, clarté et précision haute joaillerie",
    colorHex: "#2563eb",
    glowColor: "rgba(37, 99, 235, 0.2)",
    badge: "SIGNATURE",
  },
  {
    id: "emerald",
    name: "Émeraude Impérial",
    subtitle: "Élégance sobre, équilibre et prestance naturelle",
    colorHex: "#059669",
    glowColor: "rgba(5, 150, 105, 0.2)",
    badge: "PRESTIGE",
  },
  {
    id: "amber",
    name: "Or & Cuivre Noble",
    subtitle: "Chaleur artisanale d'élite, noblesse du cuivre électricien",
    colorHex: "#d97706",
    glowColor: "rgba(217, 119, 6, 0.2)",
    badge: "ATELIER",
  },
  {
    id: "violet",
    name: "Indigo Profond",
    subtitle: "Profondeur feutrée et signature studio d'architecture",
    colorHex: "#4f46e5",
    glowColor: "rgba(79, 70, 229, 0.2)",
    badge: "STUDIO",
  },
  {
    id: "stealth",
    name: "Titane & Graphite",
    subtitle: "Monochrome absolu, luxe discret et pureté architecturale",
    colorHex: "#475569",
    glowColor: "rgba(71, 85, 105, 0.2)",
    badge: "MINIMAL",
  },
];

interface CyberThemeContextType {
  cyberTheme: CyberThemeId;
  setCyberTheme: (theme: CyberThemeId) => void;
  contrastHigh: boolean;
  setContrastHigh: (enabled: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  currentThemeConfig: CyberThemeConfig;
  mounted: boolean;
}

const CyberThemeContext = createContext<CyberThemeContextType | undefined>(undefined);

const STORAGE_KEY = "stockelec_prestige_theme";
const STORAGE_CONTRAST_KEY = "stockelec_contrast_high";

// Écouteurs pour la synchronisation réactive externe
const themeListeners = new Set<() => void>();
function notifyThemeListeners() {
  for (const listener of themeListeners) {
    listener();
  }
}

function subscribeTheme(callback: () => void) {
  themeListeners.add(callback);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
  }
  return () => {
    themeListeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", callback);
    }
  };
}

function getThemeSnapshot(): CyberThemeId {
  if (typeof window === "undefined") return "cyan";
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as CyberThemeId | null;
    if (saved && CYBER_THEMES.some((t) => t.id === saved)) return saved;
  } catch {
    // Ignorer
  }
  return "cyan";
}

function getContrastSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const saved = localStorage.getItem(STORAGE_CONTRAST_KEY);
    return saved === "true";
  } catch {
    // Ignorer
  }
  return false;
}

const emptySubscribe = () => () => {};

export function CyberThemeProvider({ children }: { children: React.ReactNode }) {
  // Synchronisation avec useSyncExternalStore (norme React 19, sans effet de cascade)
  const cyberTheme = useSyncExternalStore<CyberThemeId>(subscribeTheme, getThemeSnapshot, () => "cyan");
  const contrastHigh = useSyncExternalStore(subscribeTheme, getContrastSnapshot, () => false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Synchronisation des attributs sur la racine du document
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute("data-cyber-theme", cyberTheme);
    root.setAttribute("data-contrast", contrastHigh ? "high" : "normal");
  }, [cyberTheme, contrastHigh, mounted]);

  const setCyberTheme = (theme: CyberThemeId) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
      notifyThemeListeners();
    } catch {
      // Ignorer
    }
  };

  const setContrastHigh = (enabled: boolean) => {
    try {
      localStorage.setItem(STORAGE_CONTRAST_KEY, String(enabled));
      notifyThemeListeners();
    } catch {
      // Ignorer
    }
  };

  const currentThemeConfig =
    CYBER_THEMES.find((t) => t.id === cyberTheme) || CYBER_THEMES[0];

  return (
    <CyberThemeContext.Provider
      value={{
        cyberTheme,
        setCyberTheme,
        contrastHigh,
        setContrastHigh,
        isSettingsOpen,
        setIsSettingsOpen,
        currentThemeConfig,
        mounted,
      }}
    >
      {children}
    </CyberThemeContext.Provider>
  );
}

export function useCyberTheme() {
  const context = useContext(CyberThemeContext);
  if (!context) {
    throw new Error("useCyberTheme doit être utilisé à l'intérieur d'un CyberThemeProvider");
  }
  return context;
}
