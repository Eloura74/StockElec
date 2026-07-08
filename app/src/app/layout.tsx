import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { getSession } from "@/lib/auth";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StockPro - Gestion de Chantiers",
  description: "Gestion des stocks, dépôts et chantiers",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StockPro",
  },
};

export const viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const showSidebar = session?.role === 'GERANT';

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} flex h-dvh bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 antialiased overflow-hidden transition-colors`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {showSidebar && <Sidebar />}
          <main className={`flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/20 dark:bg-zinc-900/20 ${!showSidebar ? 'p-0 md:p-0' : ''}`}>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
