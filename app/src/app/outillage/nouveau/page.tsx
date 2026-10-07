import { OutillageForm } from "@/components/OutillageForm"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function NouveauOutillagePage() {
  const session = await getSession()
  if (session?.role !== 'GERANT') {
    redirect('/outillage')
  }

  return (
    <div className="py-6">
      <OutillageForm />
    </div>
  )
}
