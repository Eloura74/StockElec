import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { InventaireClient } from "./InventaireClient"

export default async function InventaireRapidePage() {
  const session = await getSession()
  if (!session || session.role !== "GERANT") {
    redirect("/login")
  }

  const articlesDb = await prisma.article.findMany({
    include: {
      mouvements: true
    },
    orderBy: {
      designation: 'asc'
    }
  })

  // Calcul du stock
  const articles = articlesDb.map(art => {
    let stock = 0
    art.mouvements.forEach(m => {
      if (['Achat', 'Retour', 'Correction_Plus'].includes(m.type)) stock += m.quantite
      if (['Depart', 'Consomme', 'Perte', 'Correction_Moins'].includes(m.type)) stock -= m.quantite
    })
    return {
      id: art.id,
      reference: art.reference,
      designation: art.designation,
      codeBarre: art.codeBarre,
      categorie: art.categorie || "Sans catégorie",
      stockActuel: stock
    }
  })

  return (
    <main className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-zinc-50 tracking-tight">Inventaire Rapide</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-2">Scannez ou cherchez un produit pour corriger son stock réel.</p>
      </div>
      <InventaireClient articles={articles} />
    </main>
  )
}
