import { OutillageForm } from "@/components/OutillageForm"
import { OutillageHistorique } from "@/components/OutillageHistorique"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function EditOutillagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const outil = await prisma.outillage.findUnique({
    where: { id },
    include: {
      chantier: true,
      mouvements: {
        include: {
          chantier: true,
        },
        orderBy: {
          date: "desc",
        },
      },
    },
  })

  if (!outil) {
    notFound()
  }

  return (
    <div className="py-6 space-y-8 max-w-4xl mx-auto">
      <OutillageForm outillage={outil} />

      <div className="pt-4 border-t border-slate-200/80 dark:border-white/[0.08]">
        <OutillageHistorique
          mouvements={outil.mouvements}
          statutActuel={outil.statut}
          utilisateurActuel={outil.utilisateur}
          chantierActuel={outil.chantier}
        />
      </div>
    </div>
  )
}
