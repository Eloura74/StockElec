import { getArticles } from "@/app/actions/articles"
import { InventaireForm } from "@/components/InventaireForm"
import { PackageSearch } from "lucide-react"

export default async function InventairePage() {
  const articles = await getArticles()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-purple-100 p-2 rounded-lg text-purple-700">
          <PackageSearch className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Inventaire Rapide</h1>
      </div>

      <p className="text-gray-500">
        Sélectionnez ou scannez un produit pour corriger son stock physique. Le système ajustera automatiquement les écarts.
      </p>

      <div className="max-w-xl mx-auto mt-8">
        <InventaireForm articles={articles} />
      </div>
    </div>
  )
}
