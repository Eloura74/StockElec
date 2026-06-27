"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, HardHat, FileText, ArrowRightLeft } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Tableau de bord", icon: Home },
    { href: "/catalogue", label: "Mon Stock", icon: Package },
    { href: "/chantiers", label: "Chantiers", icon: HardHat },
    { href: "/mouvements", label: "Mouvements", icon: FileText },
    { href: "/reassort", label: "Réassort", icon: ArrowRightLeft },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <div className="flex h-screen w-64 flex-col border-r bg-gray-50/40 dark:bg-gray-900/40 px-4 py-6 shadow-sm">
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
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white pb-safe pt-2 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <nav className="flex justify-around items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/");
            const Icon = link.icon;
            return (
              <Link 
                key={link.href}
                href={link.href} 
                className={`flex flex-col items-center justify-center w-full py-2 px-1 rounded-xl transition-all ${
                  isActive 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon className={`h-6 w-6 mb-1 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
                <span className="text-[10px] font-medium truncate w-full text-center">{link.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  );
}
