"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Package, 
  HardHat, 
  FileText, 
  ArrowRightLeft, 
  Wrench, 
  PackageSearch, 
  Users, 
  LogOut, 
  Wand2, 
  Menu, 
  X, 
  BookOpen, 
  Shield,
  Zap,
  Palette,
  Search
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { ThemeToggle } from "./ThemeToggle";
import { useCyberTheme } from "./CyberThemeProvider";

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  links: NavLink[];
}

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<{ from: string; to: string } | null>(null);
  const { setIsSettingsOpen, currentThemeConfig, mounted } = useCyberTheme();

  const isNavigating = pendingNav !== null && pendingNav.from === pathname && pendingNav.to !== pathname;
  const activePath = isNavigating ? pendingNav.to : pathname;

  // Support touche Échap pour fermer le menu mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Bloquer le défilement du fond quand le menu mobile est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navSections: NavSection[] = [
    {
      title: "Pilotage",
      links: [
        { href: "/", label: "Tableau de bord", icon: Home },
        { href: "/catalogue", label: "Mon Stock", icon: Package },
        { href: "/chantiers", label: "Chantiers", icon: HardHat },
        { href: "/outillage", label: "Outillage", icon: Wrench },
        { href: "/inventaire", label: "Inventaire", icon: PackageSearch },
      ],
    },
    {
      title: "Logistique & Flux",
      links: [
        { href: "/reception-magique", label: "Réception Factures", icon: Wand2 },
        { href: "/mouvements", label: "Mouvements", icon: FileText },
        { href: "/reassort", label: "Réassort", icon: ArrowRightLeft },
        { href: "/fournisseurs", label: "Fournisseurs", icon: FileText },
        { href: "/rentabilite", label: "Rentabilité", icon: FileText },
      ],
    },
    {
      title: "Système",
      links: [
        { href: "/journal", label: "Journal d'Audit", icon: Shield },
        { href: "/guide", label: "Guide & Aide", icon: BookOpen },
        { href: "/equipe", label: "Équipe & Accès", icon: Users },
        { href: "/parametres", label: "Préférences & Thèmes", icon: Palette },
      ],
    },
  ];

  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR — ÉLÉGANTE, PRESTIGIEUSE & ÉPURÉE         */}
      {/* ========================================================= */}
      <aside className="hidden md:flex h-dvh w-64 flex-col border-r border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c1017] shrink-0 select-none transition-colors">
        
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01]">
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="h-9 w-9 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200/80 dark:ring-white/10 group-hover:scale-105 transition-transform shrink-0 bg-slate-900">
              <img 
                src="/images/cedricelec_badge.jpg" 
                alt="CédricElec" 
                className="h-full w-full object-cover" 
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-slate-900 dark:text-white text-sm">
                  StockElec
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                CédricElec • Quentin Elec
              </p>
            </div>
          </Link>
        </div>

        {/* Barre de Recherche & Commande Rapide (Ctrl+K) */}
        <div className="px-3 pt-3 pb-1">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200/70 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-white/[0.06] transition-all cursor-pointer group shadow-2xs tactile-btn"
            title="Ouvrir la palette de commandes (Ctrl + K)"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
              <span>Recherche rapide...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-sm">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-2.5 text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                {section.title}
              </p>

              <div className="space-y-0.5">
                {section.links.map((link) => {
                  const isActive =
                    activePath === link.href ||
                    (activePath.startsWith(link.href) && link.href !== "/");
                  const isLoadingTarget = isNavigating && pendingNav?.to === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch={false}
                      onClick={() => setPendingNav({ from: pathname, to: link.href })}
                      className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-2xs font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`h-4 w-4 shrink-0 ${
                          isActive 
                            ? "text-white dark:text-slate-950" 
                            : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                        } ${isLoadingTarget ? "animate-pulse" : ""}`} />
                        <span className="truncate">{link.label}</span>
                      </div>

                      {isActive && (
                        <span 
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${isLoadingTarget ? "animate-ping" : ""}`}
                          style={{ backgroundColor: currentThemeConfig.colorHex }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: Finition & Utilisateur */}
        <div className="p-3 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01] space-y-2.5">
          {/* Bouton de sélection de finition */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] hover:bg-slate-50 dark:hover:bg-[#161d2d] text-slate-700 dark:text-slate-300 transition-all cursor-pointer group shadow-2xs"
            title="Personnaliser les finitions de couleur"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-[#0c1017]"
                style={{ backgroundColor: currentThemeConfig.colorHex }}
              />
              <span className="text-xs truncate text-slate-600 dark:text-slate-300">
                Finition : <span suppressHydrationWarning className="font-semibold text-slate-900 dark:text-white">{mounted ? currentThemeConfig.name : "Bleu Saphir"}</span>
              </span>
            </div>
            <Palette className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
          </button>

          {/* Sélecteur Mode Clair / Sombre */}
          <ThemeToggle variant="segmented" className="w-full flex justify-between" />

          {/* Profil utilisateur & Déconnexion */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-semibold text-xs shrink-0">
                Q
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate">Quentin Elec</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">Gérant</p>
              </div>
            </div>

            <form action={logout}>
              <button
                type="submit"
                title="Se déconnecter"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                aria-label="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MOBILE TRIGGER & DRAWER                                   */}
      {/* ========================================================= */}
      <div className="md:hidden">
        {/* Floating Trigger Button (FAB) */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-950 pl-4 pr-5 py-3 rounded-full shadow-lg active:scale-95 transition-all border border-white/10 cursor-pointer"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="h-4.5 w-4.5" />
          <span className="text-xs font-semibold">Menu</span>
        </button>

        {/* Backdrop sombre */}
        {isOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Drawer */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal de navigation"
          className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[82vw] max-w-sm flex-col bg-white dark:bg-[#0c1017] shadow-2xl transition-transform duration-300 ease-in-out border-r border-slate-200/80 dark:border-white/[0.08] ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Mobile Drawer Header */}
          <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 focus:outline-none"
            >
              <div className="h-8.5 w-8.5 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200/80 dark:ring-white/10 shrink-0 bg-slate-900">
                <img 
                  src="/images/cedricelec_badge.jpg" 
                  alt="CédricElec" 
                  className="h-full w-full object-cover" 
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-slate-900 dark:text-white text-sm">
                    StockElec
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                    Pro
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  CédricElec • Quentin Elec
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Recherche rapide mobile */}
          <div className="px-3.5 pt-3 pb-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-white/4 hover:bg-slate-200/70 dark:hover:bg-white/8 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-white/6 transition-all cursor-pointer group shadow-2xs tactile-btn"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <span>Recherche rapide...</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="px-2.5 text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.links.map((link) => {
                    const isActive =
                      activePath === link.href ||
                      (activePath.startsWith(link.href) && link.href !== "/");
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        prefetch={false}
                        onClick={() => {
                          setPendingNav({ from: pathname, to: link.href });
                          setIsOpen(false);
                        }}
                        className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                          isActive
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-2xs font-semibold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4.5 w-4.5 shrink-0 ${
                            isActive 
                              ? "text-white dark:text-slate-950" 
                              : "text-slate-400 dark:text-slate-500"
                          }`} />
                          <span>{link.label}</span>
                        </div>
                        {isActive && (
                          <span 
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: currentThemeConfig.colorHex }}
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Mobile Drawer Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01] space-y-3">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsSettingsOpen(true);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] text-slate-700 dark:text-slate-300 text-xs shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: currentThemeConfig.colorHex }}
                />
                <span>
                  Finition : <span suppressHydrationWarning className="font-semibold text-slate-900 dark:text-white">{mounted ? currentThemeConfig.name : "Bleu Saphir"}</span>
                </span>
              </div>
              <Palette className="h-4 w-4 text-slate-400" />
            </button>

            <ThemeToggle variant="segmented" className="w-full flex justify-between" />

            <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-semibold text-xs">
                  Q
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Quentin Elec</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Gérant</p>
                </div>
              </div>

              <form action={logout}>
                <button
                  type="submit"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  aria-label="Se déconnecter"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
