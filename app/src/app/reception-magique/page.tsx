import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { ReceptionClient } from "./ReceptionClient"

export default async function ReceptionMagiquePage() {
  const session = await getSession()
  if (!session || session.role !== "GERANT") {
    redirect("/login")
  }

  // On récupère juste les références pour que le client puisse identifier ce qui est connu ou pas
  const articles = await prisma.article.findMany({
    select: {
      reference: true,
      designation: true
    }
  })

  // Set pour un accès très rapide côté client (O(1))
  const knownReferences = new Set<string>()
  articles.forEach(a => {
    if (a.reference) knownReferences.add(a.reference)
  })

  return (
    <main className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-zinc-50 tracking-tight">Réception Magique</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-2">Importez un Bon de Livraison ou une Facture (Excel / CSV) fourni par votre grossiste. Le système lira les références et préparera les stocks.</p>
      </div>
      
      <ReceptionClient knownReferences={Array.from(knownReferences)} />
    </main>
  )
}
