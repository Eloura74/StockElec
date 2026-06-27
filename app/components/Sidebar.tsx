import Link from "next/link";
import { Home, Package, HardHat, FileText, Settings } from "lucide-react";

export function Sidebar() {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-gray-50/40 dark:bg-gray-900/40 px-4 py-6 shadow-sm">
      <div className="flex items-center gap-2 px-2 pb-6">
        <HardHat className="h-6 w-6 text-blue-600" />
        <span className="text-lg font-bold tracking-tight">StockPro</span>
      </div>
      
      <nav className="flex flex-1 flex-col gap-1 text-sm font-medium">
        <Link href="/" className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2 text-gray-900 dark:bg-gray-800 dark:text-gray-50">
          <Home className="h-4 w-4" />
          Tableau de bord
        </Link>
        <Link href="/catalogue" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
          <Package className="h-4 w-4" />
          Catalogue (Articles)
        </Link>
        <Link href="/chantiers" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
          <HardHat className="h-4 w-4" />
          Chantiers
        </Link>
        <Link href="/mouvements" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
          <FileText className="h-4 w-4" />
          Mouvements
        </Link>
      </nav>
    </div>
  );
}
