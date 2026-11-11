import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { getSession } from "@/lib/auth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CyberThemeProvider } from "@/components/CyberThemeProvider";
import { ThemeSettingsModal } from "@/components/ThemeSettingsModal";
import { CommandPalette } from "@/components/CommandPalette";
import { OfflineSyncBanner } from "@/components/OfflineSyncBanner";
import { TopContextBar } from "@/components/TopContextBar";
import { PwaRegister } from "@/components/PwaRegister";
import { Toaster } from "sonner";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "StockElec — Pilotage & Gestion des Chantiers",
  description: "Plateforme professionnelle d'élite pour la gestion des stocks, chantiers et outillages de Quentin Électricité",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StockElec",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f17" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const showSidebar = session?.role === "GERANT";

  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.className} flex h-dvh bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 antialiased overflow-hidden selection:bg-blue-600/15 selection:text-blue-900 dark:selection:text-blue-200`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CyberThemeProvider>
            {showSidebar && <Sidebar />}
            
            <main
              className={`flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative ${
                showSidebar ? "p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8" : "p-0"
              }`}
            >
              {/* Fond d'ambiance CédricElec haute définition (filigrane subtil) */}
              <div 
                className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-[0.04] dark:opacity-[0.09] transition-opacity duration-500"
                style={{ backgroundImage: `url('/images/cedricelec_bg.jpg')` }}
              />
              <div className="relative z-10">
                {showSidebar && <TopContextBar />}
                <div className={showSidebar ? "" : "px-3 pt-3 sm:px-6"}>
                  <OfflineSyncBanner />
                </div>
                {children}
              </div>
            </main>

            {/* Modale des paramètres de finitions & thèmes */}
            <ThemeSettingsModal />

            {/* Palette de commandes globales (Ctrl + K) */}
            <CommandPalette />

            {/* Enregistrement PWA & Invite d'installation Android/PC */}
            <PwaRegister />

            <Toaster 
              position="bottom-right" 
              richColors 
              theme="system"
              toastOptions={{
                className: "text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#111622]/95 shadow-xl text-slate-900 dark:text-white",
                duration: 3500
              }}
            />
          </CyberThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
