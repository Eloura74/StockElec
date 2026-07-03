import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { getSession } from "@/lib/auth";

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
    <html lang="fr">
      <body className={`${inter.className} flex h-screen bg-white text-gray-900 antialiased overflow-hidden`}>
        {showSidebar && <Sidebar />}
        <main className={`flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-gray-50/20 ${!showSidebar ? 'p-0 md:p-0' : ''}`}>
          {children}
        </main>
      </body>
    </html>
  );
}
