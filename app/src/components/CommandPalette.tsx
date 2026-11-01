"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Package, 
  HardHat, 
  Wrench, 
  ArrowRightLeft, 
  FileText, 
  Wand2, 
  Palette, 
  Home, 
  Zap, 
  CornerDownLeft, 
  Command, 
  X,
  Truck,
  PackageSearch,
  BookOpen,
  Shield,
  Layers
} from "lucide-react";
import { useCyberTheme } from "./CyberThemeProvider";

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Navigation" | "Actions Rapides" | "Personnalisation";
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { setIsSettingsOpen, currentThemeConfig } = useCyberTheme();

  // Écouteur global Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Bloquer le scroll d'arrière-plan quand la palette est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setSelectedIndex(0);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const runCommand = useCallback((commandAction: () => void) => {
    setIsOpen(false);
    commandAction();
  }, []);

  const commands: CommandItem[] = [
    // Actions Rapides
    {
      id: "scan",
      title: "Scanner un Code-Barres / Référence",
      subtitle: "Accès instantané à la caméra et au scanner de pièces",
      category: "Actions Rapides",
      icon: Zap,
      action: () => router.push("/catalogue?focus=scan"),
      shortcut: "S",
    },
    {
      id: "depart-camion",
      title: "Départ Camion / Affectation Chantier",
      subtitle: "Préparer les sorties matériel vers un chantier",
      category: "Actions Rapides",
      icon: Truck,
      action: () => router.push("/depart-matin"),
      shortcut: "D",
    },
    {
      id: "reception-facture",
      title: "Réception Magique de Factures",
      subtitle: "Extraction automatique PDF Rexel, Sonepar, etc.",
      category: "Actions Rapides",
      icon: Wand2,
      action: () => router.push("/reception-magique"),
    },
    {
      id: "mouvement-rapide",
      title: "Nouveau Mouvement de Stock",
      subtitle: "Enregistrer une entrée, sortie ou retour chantier",
      category: "Actions Rapides",
      icon: ArrowRightLeft,
      action: () => router.push("/mouvements"),
      shortcut: "M",
    },

    // Navigation
    {
      id: "nav-dashboard",
      title: "Tableau de Bord Exécutif",
      subtitle: "Vue synthétique, KPIs et valorisation globale",
      category: "Navigation",
      icon: Home,
      action: () => router.push("/"),
    },
    {
      id: "nav-stock",
      title: "Mon Stock & Catalogue",
      subtitle: "Consulter les 10 000+ références et stocks réels",
      category: "Navigation",
      icon: Package,
      action: () => router.push("/catalogue"),
    },
    {
      id: "nav-chantiers",
      title: "Chantiers en Cours",
      subtitle: "Suivi des chantiers actifs et matériel immobilisé",
      category: "Navigation",
      icon: HardHat,
      action: () => router.push("/chantiers"),
    },
    {
      id: "nav-outillage",
      title: "Parc Outillage & Engins",
      subtitle: "Emprunts, affectations et maintenance machines",
      category: "Navigation",
      icon: Wrench,
      action: () => router.push("/outillage"),
    },
    {
      id: "nav-inventaire",
      title: "Session d'Inventaire Dépôt",
      subtitle: "Comptage physique et réconciliation de stock",
      category: "Navigation",
      icon: PackageSearch,
      action: () => router.push("/inventaire"),
    },
    {
      id: "nav-reassort",
      title: "Réassort & Alertes Stock",
      subtitle: "Générer les bons de commande fournisseurs",
      category: "Navigation",
      icon: Layers,
      action: () => router.push("/reassort"),
    },
    {
      id: "nav-journal",
      title: "Journal d'Audit & Sécurité",
      subtitle: "Traçabilité intégrale des mouvements et logins",
      category: "Navigation",
      icon: Shield,
      action: () => router.push("/journal"),
    },
    {
      id: "nav-guide",
      title: "Guide & Bonnes Pratiques",
      subtitle: "Mode d'emploi Quentin Électricité",
      category: "Navigation",
      icon: BookOpen,
      action: () => router.push("/guide"),
    },

    // Personnalisation
    {
      id: "theme-finition",
      title: "Changer la Finition Visuelle",
      subtitle: `Actuelle : ${currentThemeConfig.name} (Bleu Saphir, Émeraude, Ambre, Titane...)`,
      category: "Personnalisation",
      icon: Palette,
      action: () => setIsSettingsOpen(true),
      shortcut: "T",
    },
  ];

  // Filtrage selon la requête
  const filteredCommands = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  // Navigation clavier Up / Down / Enter
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        runCommand(filteredCommands[selectedIndex].action);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150"
      onClick={() => setIsOpen(false)}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Palette de commandes rapides"
        className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#0e131d] border border-slate-200/90 dark:border-white/10 shadow-2xl overflow-hidden electric-conduit animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Champ de recherche haute fidélité */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
          <Search className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Rechercher une action, une page, un outil... (ex: scan, stock, chantier)"
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Liste des résultats */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center">
              <PackageSearch className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Aucune commande trouvée</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Essayez avec un mot-clé comme "stock", "chantier", "camion"...</p>
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              const Icon = cmd.icon;
              return (
                <div
                  key={cmd.id}
                  onClick={() => runCommand(cmd.action)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isSelected 
                        ? "bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950" 
                        : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-semibold truncate ${
                          isSelected ? "text-white dark:text-slate-950" : "text-slate-900 dark:text-white"
                        }`}>
                          {cmd.title}
                        </p>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-md ${
                          isSelected 
                            ? "bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950" 
                            : "bg-slate-200/60 dark:bg-white/[0.08] text-slate-500 dark:text-slate-400"
                        }`}>
                          {cmd.category}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${
                        isSelected ? "text-white/80 dark:text-slate-800" : "text-slate-400 dark:text-slate-500"
                      }`}>
                        {cmd.subtitle}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-[10px] font-medium opacity-80 hidden sm:inline">Exécuter</span>
                      <CornerDownLeft className="h-3.5 w-3.5 opacity-80" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer avec astuces clavier */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.01] flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded shadow-2xs">↓</kbd>
              <span className="ml-1">Naviguer</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded shadow-2xs">Entrée</kbd>
              <span className="ml-1">Ouvrir</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded shadow-2xs">Échap</kbd>
              <span className="ml-1">Fermer</span>
            </span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </div>
      </div>
    </div>
  );
}
