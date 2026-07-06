"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, HardHat, FileText, ArrowRightLeft, Wrench, PackageSearch, Users, LogOut, Scan, Wand2, Menu, X } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { ThemeToggle } from "./ThemeToggle";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Tableau de bord", icon: Home },
    { href: "/catalogue", label: "Mon Stock", icon: Package },
    { href: "/chantiers", label: "Chantiers", icon: HardHat },
    { href: "/outillage", label: "Outillage", icon: Wrench },
    { href: "/inventaire", label: "Inventaire", icon: PackageSearch },
    { href: "/inventaire-rapide", label: "Scan & Go", icon: Scan },
    { href: "/reception-magique", label: "Réception Auto", icon: Wand2 },
    { href: "/mouvements", label: "Mouvements", icon: FileText },
    { href: "/reassort", label: "Réassort", icon: ArrowRightLeft },
    { href: "/equipe", label: "Équipe", icon: Users },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <div className="flex h-screen w-64 flex-col border-r bg-gray-50 dark:bg-zinc-950/40 dark:bg-gray-900/40 px-4 py-6 shadow-sm">
          <div className="flex items-center gap-2 px-2 pb-6">
            <HardHat className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold tracking-tight">StockPro</span>
          </div>
          
          <nav className="flex flex-1 flex-col gap-1 text-sm font-medium">
            {links.map((link) => {
              const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/");
              const Icon = link.icon;
              return (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isActive 
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" 
                      : "text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 hover:text-gray-900 dark:text-gray-400 dark:text-zinc-500 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
          
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-zinc-500">
              Thème
              <ThemeToggle />
            </div>
            <form action={logout}>
              <button 
                type="submit" 
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors dark:text-red-400 dark:hover:bg-red-900/30"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium text-sm">Déconnexion</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - FAB & Fullscreen Menu */}
      <div className="md:hidden">
        {/* FAB */}
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-xl shadow-blue-600/30 active:scale-95 transition-transform"
        >
          <Menu className="h-7 w-7" />
        </button>

        {/* Fullscreen Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 flex flex-col animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <HardHat className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                <span className="text-2xl font-black tracking-tight dark:text-white">StockPro</span>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <X className="h-7 w-7" />
                </button>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 dark:bg-zinc-950">
              {links.map((link) => {
                const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/");
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      isActive 
                        ? "bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-sm" 
                        : "bg-gray-50 dark:bg-zinc-950 text-gray-700 dark:text-zinc-200 font-medium border border-transparent hover:border-gray-200 dark:border-zinc-800"
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-400 dark:text-zinc-500'}`} />
                    <span className="text-lg">{link.label}</span>
                  </Link>
                )
              })}
              
              <div className="mt-8 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <form action={logout}>
                  <button 
                    type="submit" 
                    className="flex w-full items-center gap-4 p-4 rounded-2xl bg-red-50 text-red-700 font-bold border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="h-6 w-6 text-red-600" />
                    <span className="text-lg">Déconnexion</span>
                  </button>
                </form>
              </div>
            </nav>
          </div>
        )}
      </div>
    </>
  );
}
