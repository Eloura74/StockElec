import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { DepartMatinClient } from "./DepartMatinClient"
import { LogOut } from "lucide-react"
import { logout } from "@/app/actions/auth"

export default async function DepartMatinPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const chantiers = await prisma.chantier.findMany({
    where: { statut: 'Actif' },
    orderBy: { nom: 'asc' }
  })

  const allArticles = await prisma.article.findMany({
    include: {
      mouvements: true
    },
    orderBy: { designation: 'asc' }
  })

  // Calcul du stock actuel
  const articlesWithStock = allArticles.map((a: any) => {
    let stock = a.stockInitial
    for (const m of a.mouvements) {
      if (['Achat', 'Retour', 'Correction_Plus'].includes(m.type)) stock += m.quantite
      if (['Depart', 'Consomme', 'Perdu', 'Correction_Moins'].includes(m.type)) stock -= m.quantite
    }
    return { 
      id: a.id, 
      designation: a.designation, 
      reference: a.reference, 
      codeBarre: a.codeBarre,
      stockMinimum: a.stockMinimum,
      stockActuel: stock 
    }
  })


  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header Mobile / Tablette (Pas de sidebar) */}
      <header className="bg-zinc-900 border-b border-white/10 text-white p-4 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-xl font-black tracking-tight">Départ Chantier</h1>
          <p className="text-sm text-zinc-400 font-medium">Connecté : <span className="text-indigo-400">{session.username}</span></p>
        </div>
        <form action={logout}>
          <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 ring-1 ring-white/10 p-2.5 rounded-xl transition-all shadow-sm">
            <LogOut className="w-5 h-5 text-zinc-300" />
          </button>
        </form>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:max-w-4xl lg:mx-auto w-full selection:bg-indigo-500/30">
        <DepartMatinClient chantiers={chantiers} articles={articlesWithStock} username={session.username} />
      </main>
    </div>
  )
}
