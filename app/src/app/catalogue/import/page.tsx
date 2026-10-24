import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ImportArticlesClient } from "./ImportArticlesClient"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Importer un fichier Excel - StockPro",
  description: "Importation en masse d'articles, tarifs, stocks et codes-barres depuis un fichier Excel",
}

export default async function ImportArticlesPage() {
  const session = await getSession()
  if (!session || session.role !== "GERANT") {
    redirect("/")
  }

  return <ImportArticlesClient />
}
