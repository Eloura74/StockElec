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
    where: { statut: 'En cours' },
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
  }).filter(a => a.stockActuel > 0) // On ne montre que ce qui est en stock au dépôt


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header Mobile / Tablette (Pas de sidebar) */}
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-black">Départ Chantier</h1>
          <p className="text-sm text-blue-100">Connecté : {session.username}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="bg-blue-700 hover:bg-blue-800 p-2 rounded-full transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </form>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:max-w-4xl lg:mx-auto w-full">
        <DepartMatinClient chantiers={chantiers} articles={articlesWithStock} username={session.username} />
      </main>
    </div>
  )
}
