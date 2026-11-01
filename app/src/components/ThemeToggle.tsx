"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

interface ThemeToggleProps {
  className?: string
  variant?: "icon" | "segmented"
}

export function ThemeToggle({ className = "", variant = "icon" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <div 
        className={`h-8 w-24 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-100/50 dark:bg-white/5 animate-pulse ${className}`} 
        aria-hidden="true" 
      />
    )
  }

  const isDark = resolvedTheme === "dark"

  if (variant === "segmented") {
    return (
      <div 
        className={`relative inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#111622] border border-slate-200/80 dark:border-white/[0.08] shadow-inner ${className}`}
        role="group"
        aria-label="Sélecteur de thème"
      >
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer flex-1 ${
            !isDark
              ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
          aria-pressed={!isDark}
        >
          <Sun className={`w-3.5 h-3.5 ${!isDark ? "text-amber-500" : ""}`} />
          <span>Clair</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer flex-1 ${
            isDark
              ? "bg-[#182030] text-white border border-white/10 shadow-2xs"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
          aria-pressed={isDark}
        >
          <Moon className={`w-3.5 h-3.5 ${isDark ? "text-blue-400" : ""}`} />
          <span>Sombre</span>
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative inline-flex items-center justify-center h-8.5 w-8.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] hover:bg-slate-50 dark:hover:bg-[#161d2d] text-slate-700 dark:text-slate-300 shadow-2xs transition-all duration-150 active:scale-95 group cursor-pointer ${className}`}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 group-hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 transition-transform duration-200 group-hover:-rotate-12" />
      )}
    </button>
  )
}
