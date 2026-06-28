import { OutillageForm } from "@/components/OutillageForm"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function EditOutillagePage({ params }: { params: { id: string } }) {
  const { id } = await params
  
  const outil = await prisma.outillage.findUnique({
    where: { id }
  })

  if (!outil) {
    notFound()
  }

  return (
    <div className="py-6">
      <OutillageForm outillage={outil} />
    </div>
  )
}
