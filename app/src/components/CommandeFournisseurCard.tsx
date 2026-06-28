"use client"

import { useState } from "react"
import { Copy, Check, ShoppingCart, AlertCircle } from "lucide-react"

type OrderItem = {
  articleId: string
  designation: string
  reference: string
  referenceFournisseur: string | null
  stockDépôt: number
  stockMinimum: number
  quantiteParBoite: number
  unite: string
  suggestedQuantity: number
}

export function CommandeFournisseurCard({ 
  fournisseur, 
  items 
}: { 
  fournisseur: string, 
  items: OrderItem[] 
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    items.reduce((acc, item) => ({ ...acc, [item.articleId]: item.suggestedQuantity }), {})
  )
  const [copied, setCopied] = useState(false)

  const handleQuantityChange = (id: string, value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0) {
      setQuantities(prev => ({ ...prev, [id]: num }))
    } else if (value === "") {
      setQuantities(prev => ({ ...prev, [id]: 0 }))
    }
  }

  const generateOrderText = () => {
    let text = `Bonjour,\n\nPouvez-vous me préparer la commande suivante s'il vous plaît :\n\n`
    
    items.forEach(item => {
      const qte = quantities[item.articleId]
      if (qte > 0) {
        const refText = item.referenceFournisseur 
          ? `(Réf Fournisseur: ${item.referenceFournisseur})` 
          : `(Réf Interne: ${item.reference})`
        text += `- ${qte} x ${item.designation} ${refText}\n`
      }
    })

    text += `\nMerci d'avance,\nQuentin Elec`
    return text
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateOrderText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
      alert("Erreur lors de la copie de la commande.")
    }
  }

  const totalItemsToOrder = Object.values(quantities).filter(q => q > 0).length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{fournisseur}</h3>
            <p className="text-sm text-gray-500">{items.length} article(s) en alerte</p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          disabled={totalItemsToOrder === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            copied 
              ? "bg-emerald-100 text-emerald-700" 
              : totalItemsToOrder > 0 
                ? "bg-gray-900 text-white hover:bg-gray-800 shadow-md" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Commande copiée !" : "Copier pour Email"}
        </button>
      </div>

      <div className="p-0">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase border-b">
            <tr>
              <th className="px-5 py-3 font-medium">Article</th>
              <th className="px-5 py-3 font-medium text-center">Stock Actuel</th>
              <th className="px-5 py-3 font-medium text-right">Qté à commander</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <tr key={item.articleId} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="font-medium text-gray-900">{item.designation}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.referenceFournisseur ? `Réf: ${item.referenceFournisseur}` : `Réf int: ${item.reference}`}
                  </div>
                </td>
                <td className="px-5 py-3 text-center">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 text-red-700 font-medium text-xs">
                    <AlertCircle className="h-3 w-3" />
                    {item.stockDépôt} {item.unite}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">Min: {item.stockMinimum}</div>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="number"
                      min="0"
                      value={quantities[item.articleId]}
                      onChange={(e) => handleQuantityChange(item.articleId, e.target.value)}
                      className="w-16 text-center border-gray-300 rounded-md text-sm font-bold text-blue-700 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500 w-8 text-left">{item.unite}</span>
                  </div>
                  {item.quantiteParBoite > 1 && (
                    <div className="text-[10px] text-gray-400 mt-1 mr-10">
                      Par boîte de {item.quantiteParBoite}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
