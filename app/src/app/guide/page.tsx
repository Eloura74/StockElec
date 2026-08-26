import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { GuideClient } from "./GuideClient"

export default async function GuidePage() {
  const session = await getSession()
  if (!session || session.role !== "GERANT") {
    redirect("/login")
  }

  return (
    <main className="p-2 sm:p-6">
      <GuideClient />
    </main>
  )
}
