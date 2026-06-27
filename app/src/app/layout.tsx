import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StockPro - Gestion de Chantiers",
  description: "Gestion des stocks, dépôts et chantiers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.className} flex h-screen bg-white text-gray-900 antialiased`}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50/20">
          {children}
        </main>
      </body>
    </html>
  );
}
