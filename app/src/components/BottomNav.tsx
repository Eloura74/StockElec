"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, Truck, HardHat } from "lucide-react"

export function BottomNav() {
  const pathname = usePathname()

  const links = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/catalogue", label: "Stock", icon: Package },
    { href: "/depart-matin", label: "Départ/Retour", icon: Truck },
    { href: "/chantiers", label: "Chantiers", icon: HardHat },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
          const Icon = link.icon
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive 
                  ? "text-blue-600 dark:text-blue-500" 
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-300"
              }`}
            >
              <Icon className={`w-6 h-6 transition-transform ${isActive ? "scale-110" : "scale-100"}`} />
              <span className={`text-[10px] font-medium ${isActive ? "font-bold" : ""}`}>
                {link.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
