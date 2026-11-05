import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { DepartMatinClient } from "./DepartMatinClient"
import { LogOut } from "lucide-react"
import { logout } from "@/app/actions/auth"
import { ThemeToggle } from "@/components/ThemeToggle"
import { getOutillages } from "@/app/actions/outillage"
import { calculerStocksDepuisAgregats } from "@/lib/stockUtils"

export default async function DepartMatinPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const chantiers = await prisma.chantier.findMany({
    where: { statut: 'Actif' },
    orderBy: { nom: 'asc' }
  })

  const allArticles = await prisma.article.findMany({
    orderBy: { designation: 'asc' }
  })

  // Stock du dépôt : même source de vérité que le catalogue (stock initial + mouvements agrégés)
  const aggregations = await prisma.mouvement.groupBy({
    by: ['articleId', 'type', 'chantierId'],
    _sum: { quantite: true }
  })
  const stockMap = calculerStocksDepuisAgregats(aggregations)

  const articlesWithStock = allArticles.map((a) => ({
    id: a.id,
    designation: a.designation,
    reference: a.reference,
    codeBarre: a.codeBarre,
    stockMinimum: a.stockMinimum,
    stockActuel: a.stockInitial + (stockMap.get(a.id)?.stockDepot ?? 0),
    // Champs éditables par le chef d'équipe (le prix n'est volontairement pas transmis)
    fournisseur: a.fournisseur,
    referenceFournisseur: a.referenceFournisseur,
    categorie: a.categorie,
    unite: a.unite,
    quantiteParBoite: a.quantiteParBoite
  }))

  const outillages = await getOutillages()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] flex flex-col">
      {/* Header Mobile / Tablette (Pas de sidebar) */}
      <header className="bg-white dark:bg-[#0c1017] border-b border-slate-200/80 dark:border-white/[0.08] p-4 flex justify-between items-center shadow-xs electric-conduit">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200 dark:ring-white/10 shrink-0 bg-slate-900">
            <img 
              src="/images/cedricelec_badge.jpg" 
              alt="CédricElec" 
              className="h-full w-full object-cover" 
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">Départ Chantier Camion</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">Express</span>
            </div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Connecté : <span className="font-semibold text-slate-700 dark:text-slate-300">{session.username}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={logout}>
            <button 
              type="submit" 
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
              title="Se déconnecter"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:max-w-4xl lg:mx-auto w-full selection:bg-indigo-500/30">
        <DepartMatinClient chantiers={chantiers} articles={articlesWithStock} outillages={outillages} username={session.username} />
      </main>
    </div>
  )
}
