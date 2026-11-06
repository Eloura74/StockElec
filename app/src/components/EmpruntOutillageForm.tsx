"use client"

import { useState } from "react"
import { emprunterOutillage } from "@/app/actions/outillage"
import { enqueueOfflineOperation } from "@/lib/offline-sync"
import { toast } from "sonner"
import { ArrowRightLeft, Camera, Search, Wrench, Building, User } from "lucide-react"
import dynamic from "next/dynamic"

const BarcodeScanner = dynamic(() => import("./BarcodeScanner").then((mod) => mod.BarcodeScanner), { ssr: false })

export function EmpruntOutillageForm({ outillages, chantiers }: { outillages: any[]; chantiers: any[] }) {
  const [isScanning, setIsScanning] = useState(false)
  const [selectedOutillageId, setSelectedOutillageId] = useState("")
  const [actionType, setActionType] = useState("Emprunt")
  const [scanError, setScanError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)

  const [selectedChantierId, setSelectedChantierId] = useState("")
  const [chantierSearchQuery, setChantierSearchQuery] = useState("")
  const [showChantierDropdown, setShowChantierDropdown] = useState(false)

  const selectedChantier = chantiers.find((c) => c.id === selectedChantierId)

  const handleScan = (code: string) => {
    setIsScanning(false)
    setScanError(null)

    const trimmedCode = code.trim()
    const outil = outillages.find((o) => o.reference === trimmedCode)
    if (outil) {
      setSelectedOutillageId(outil.id)
      if (outil.statut === "Disponible") setActionType("Emprunt")
      else if (outil.statut === "En Chantier") setActionType("Retour")
    } else {
      setScanError(`Outil introuvable (Code lu : ${trimmedCode})`)
    }
  }

  const selectedOutil = outillages.find((o) => o.id === selectedOutillageId)

  return (
    <div className="prestige-card rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs overflow-hidden sticky top-6">
      <div className="p-4.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center">
            <ArrowRightLeft className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Emprunt & Retour
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Affectation parc machines</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsScanning(true)}
          className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <Camera className="h-3.5 w-3.5" />
          <span>Scanner</span>
        </button>
      </div>

      <div className="p-5 space-y-4 text-xs">
        {scanError && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>{scanError}</span>
          </div>
        )}

        <form
          action={async (formData) => {
            const outillageId = (formData.get("outillageId") as string) || selectedOutillageId
            const type = (formData.get("type") as string) || actionType
            const chantierId = (formData.get("chantierId") as string) || selectedChantierId || null
            const utilisateur = (formData.get("utilisateur") as string) || ""
            const observation = (formData.get("observation") as string) || ""
            const outillageNom = selectedOutil?.nom || "Outil"

            const enregistrerHorsLigne = async () => {
              await enqueueOfflineOperation({
                type: "OUTILLAGE_MOUVEMENT",
                label: `Outillage « ${outillageNom} » (${type}) par ${utilisateur}`,
                payload: {
                  outillageId,
                  outillageNom,
                  type,
                  chantierId: type === "Emprunt" ? chantierId : null,
                  utilisateur,
                  observation,
                },
              })
              toast.success("📡 Mouvement d'outillage enregistré hors-ligne !")
            }

            if (typeof navigator !== "undefined" && !navigator.onLine) {
              await enregistrerHorsLigne()
            } else {
              try {
                await emprunterOutillage(formData)
                toast.success("Mouvement d'outillage validé !")
              } catch {
                await enregistrerHorsLigne()
              }
            }

            setSelectedOutillageId("")
            setSelectedChantierId("")
            setActionType("Emprunt")
          }}
          className="space-y-4"
        >
          {/* Sélection de l'outil */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Machine ou Équipement *
            </label>
            <div className="relative">
              <input type="hidden" name="outillageId" value={selectedOutillageId} required />

              {!selectedOutillageId ? (
                <>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 220)}
                    className="block w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#161d2d] focus:border-blue-500 font-medium transition-all"
                    placeholder="Rechercher un outil (nom, réf)..."
                  />

                  {showDropdown && (
                    <div className="absolute z-20 w-full mt-1.5 bg-white dark:bg-[#111622] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {outillages
                        .filter(
                          (o) =>
                            !searchQuery ||
                            o.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (o.reference && o.reference.toLowerCase().includes(searchQuery.toLowerCase()))
                        )
                        .slice(0, 50)
                        .map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => {
                              setSelectedOutillageId(o.id)
                              setSearchQuery("")
                              setShowDropdown(false)
                              if (o.statut === "Disponible") setActionType("Emprunt")
                              if (o.statut === "En Chantier") setActionType("Retour")
                            }}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors flex justify-between items-center gap-2 cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-white truncate">{o.nom}</div>
                              <div className="text-[10px] font-mono text-slate-400">
                                Réf: {o.reference || "Aucune"}
                              </div>
                            </div>
                            <span
                              className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                o.statut === "Disponible"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40"
                                  : o.statut === "En Chantier"
                                  ? "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40"
                                  : "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/40"
                              }`}
                            >
                              {o.statut}
                            </span>
                          </button>
                        ))}
                      {outillages.filter(
                        (o) =>
                          !searchQuery ||
                          o.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.reference && o.reference.toLowerCase().includes(searchQuery.toLowerCase()))
                      ).length === 0 && (
                        <div className="px-4 py-3 text-xs text-slate-400 text-center">
                          Aucun outil trouvé.
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-950/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {selectedOutil?.nom}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {selectedOutil?.statut} • Réf: {selectedOutil?.reference || "Aucune"}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOutillageId("")
                      setActionType("Emprunt")
                    }}
                    className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer shrink-0"
                  >
                    Changer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sélecteur d'Action Segmenté */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Opération *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  val: "Emprunt",
                  label: "Emprunter",
                  activeClass:
                    "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:border-blue-500/60 dark:text-blue-300",
                },
                {
                  val: "Retour",
                  label: "Restituer",
                  activeClass:
                    "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-500/60 dark:text-emerald-300",
                },
                {
                  val: "Réparation",
                  label: "En Réparation",
                  activeClass:
                    "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/60 dark:border-amber-500/60 dark:text-amber-300",
                },
                {
                  val: "Perte",
                  label: "Déclarer Perdu",
                  activeClass:
                    "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/60 dark:border-rose-500/60 dark:text-rose-300",
                },
              ].map((opt) => (
                <label
                  key={opt.val}
                  className={`border rounded-xl p-2.5 flex items-center justify-center cursor-pointer transition-all font-semibold text-xs ${
                    actionType === opt.val
                      ? opt.activeClass
                      : "border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#161d2d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={opt.val}
                    checked={actionType === opt.val}
                    onChange={(e) => setActionType(e.target.value)}
                    className="sr-only"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {actionType === "Emprunt" && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Chantier de destination *
              </label>
              <div className="relative">
                <input type="hidden" name="chantierId" value={selectedChantierId} required />

                {!selectedChantierId ? (
                  <>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={chantierSearchQuery}
                      onChange={(e) => {
                        setChantierSearchQuery(e.target.value)
                        setShowChantierDropdown(true)
                      }}
                      onFocus={() => setShowChantierDropdown(true)}
                      onBlur={() => setTimeout(() => setShowChantierDropdown(false), 220)}
                      className="block w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#161d2d] focus:border-blue-500 font-medium transition-all"
                      placeholder="Rechercher un chantier..."
                    />

                    {showChantierDropdown && (
                      <div className="absolute z-20 w-full mt-1.5 bg-white dark:bg-[#111622] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {chantiers
                          .filter(
                            (c) =>
                              !chantierSearchQuery ||
                              c.nom.toLowerCase().includes(chantierSearchQuery.toLowerCase())
                          )
                          .slice(0, 50)
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedChantierId(c.id)
                                setChantierSearchQuery("")
                                setShowChantierDropdown(false)
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                            >
                              <div className="font-semibold text-slate-900 dark:text-white">{c.nom}</div>
                            </button>
                          ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {selectedChantier?.nom}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedChantierId("")}
                      className="px-2 py-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 cursor-pointer shrink-0"
                    >
                      Changer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Collaborateur *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                name="utilisateur"
                required
                defaultValue={selectedOutil?.utilisateur || ""}
                placeholder="Ex: Quentin, Julien..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Observation (Optionnel)
            </label>
            <input
              type="text"
              name="observation"
              placeholder="État de la machine, batterie, coffret..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-sm active:scale-[0.99] transition-all cursor-pointer tactile-btn"
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span>Valider le Mouvement Machine</span>
          </button>
        </form>
      </div>

      {isScanning && (
        <BarcodeScanner onScan={handleScan} onClose={() => setIsScanning(false)} />
      )}
    </div>
  )
}
