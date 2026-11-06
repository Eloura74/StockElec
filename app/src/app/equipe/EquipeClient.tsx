"use client"

import { useState } from "react"
import { Shield, PlusCircle, Trash2, Users, Key, Mail, Check, X, AlertCircle } from "lucide-react"
import { createUser, deleteUser, updateUserPassword, updateUserEmail } from "@/app/actions/auth"

interface UserData {
  id: string
  username: string
  role: string
  email: string | null
  createdAt: string
}

interface EquipeClientProps {
  users: UserData[]
  currentUserId: string
}

export default function EquipeClient({ users, currentUserId }: EquipeClientProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null)
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleCreateUser = async (formData: FormData) => {
    setError(null)
    setSuccess(null)
    setLoadingAction("create")

    const res = await createUser(formData)
    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess(`Compte "${formData.get("username")}" créé avec succès.`)
    }
    setLoadingAction(null)
  }

  const handleDeleteUser = async (id: string, username: string) => {
    if (!window.confirm(`Supprimer le compte "${username}" ? Cette action est irréversible.`)) return

    setError(null)
    setSuccess(null)
    setLoadingAction(`delete-${id}`)

    const res = await deleteUser(id)
    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess(`Compte "${username}" supprimé.`)
    }
    setLoadingAction(null)
  }

  const handleUpdatePassword = async (userId: string) => {
    if (!newPassword) return

    setError(null)
    setSuccess(null)
    setLoadingAction(`password-${userId}`)

    const res = await updateUserPassword(userId, newPassword)
    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess("Mot de passe mis à jour.")
      setEditingPasswordId(null)
      setNewPassword("")
    }
    setLoadingAction(null)
  }

  const handleUpdateEmail = async (userId: string) => {
    setError(null)
    setSuccess(null)
    setLoadingAction(`email-${userId}`)

    const res = await updateUserEmail(userId, newEmail)
    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess("Email mis à jour.")
      setEditingEmailId(null)
      setNewEmail("")
    }
    setLoadingAction(null)
  }

  const adminsCount = users.filter((u) => u.role === "GERANT").length
  const chefsCount = users.length - adminsCount

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
              Habilitations & Sécurité
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Équipe & Contrôle d&apos;Accès
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gérez les identifiants Gérant (accès complet) et Chefs d&apos;équipe (interface mobile Départ Camion).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2.5 px-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 leading-none">
                Collaborateurs
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {users.length} comptes ({adminsCount} admin / {chefsCount} terrain)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages de feedback */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de création */}
        <div className="lg:col-span-1">
          <div className="prestige-card bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Nouveau Compte
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Création immédiate d&apos;accès
                </p>
              </div>
            </div>

            <form action={handleCreateUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Identifiant de connexion *
                </label>
                <input
                  required
                  type="text"
                  name="username"
                  placeholder="ex: julien"
                  className="block w-full rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] px-3.5 py-2.5 text-slate-900 dark:text-white font-medium focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mot de passe initial *
                </label>
                <input
                  required
                  type="text"
                  name="password"
                  placeholder="ex: 1234"
                  className="block w-full rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] px-3.5 py-2.5 text-slate-900 dark:text-white font-medium focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="collaborateur@exemple.com"
                  className="block w-full rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] px-3.5 py-2.5 text-slate-900 dark:text-white font-medium focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Niveau d&apos;habilitation *
                </label>
                <select
                  name="role"
                  defaultValue="GERANT"
                  className="block w-full rounded-xl bg-slate-50 dark:bg-[#161d2d] border border-slate-200/80 dark:border-white/[0.08] px-3.5 py-2.5 text-slate-900 dark:text-white font-semibold focus:border-blue-500 cursor-pointer"
                >
                  <option value="GERANT">Gérant / Admin (accès complet)</option>
                  <option value="CHEF_EQUIPE">Chef d&apos;équipe (Départ Camion)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loadingAction === "create"}
                className="w-full flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-white px-4 py-3 rounded-xl font-bold text-xs transition-all disabled:opacity-50 cursor-pointer tactile-btn"
              >
                {loadingAction === "create" ? "Création..." : "Créer le Compte Utilisateur"}
              </button>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-blue-50/60 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200/60 dark:border-blue-800/40 flex gap-2">
                <Shield className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <span>
                  <strong className="text-slate-800 dark:text-slate-200">Gérant</strong> : accès complet à tous les modules et prix.<br />
                  <strong className="text-slate-800 dark:text-slate-200">Chef d&apos;équipe</strong> : accès dédié à l&apos;écran mobile Départ Camion (sans prix).
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* Liste des comptes */}
        <div className="lg:col-span-2">
          <div className="prestige-card bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
              <thead className="bg-slate-50/75 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                          {u.username.slice(0, 2)}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {u.username}
                          {u.id === currentUserId && (
                            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                              Vous
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 inline-flex text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                          u.role === "GERANT"
                            ? "bg-purple-50 text-purple-700 border-purple-200/70 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/40"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40"
                        }`}
                      >
                        {u.role === "GERANT" ? "Gérant / Admin" : "Chef d'équipe"}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {editingEmailId === u.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="email@exemple.com"
                            className="text-xs rounded-xl border border-slate-200/80 dark:border-white/10 px-2.5 py-1.5 bg-slate-50 dark:bg-[#161d2d] text-slate-900 dark:text-white w-44"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateEmail(u.id)}
                            disabled={loadingAction === `email-${u.id}`}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
                            title="Valider"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingEmailId(null)
                              setNewEmail("")
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Annuler"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {u.email || "—"}
                          </span>
                          <button
                            onClick={() => {
                              setEditingEmailId(u.id)
                              setNewEmail(u.email || "")
                              setEditingPasswordId(null)
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            title="Modifier l'email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {editingPasswordId === u.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Nouveau MDP"
                              className="text-xs rounded-xl border border-slate-200/80 dark:border-white/10 px-2.5 py-1.5 bg-slate-50 dark:bg-[#161d2d] text-slate-900 dark:text-white w-28"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdatePassword(u.id)}
                              disabled={!newPassword || loadingAction === `password-${u.id}`}
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 disabled:opacity-50 cursor-pointer"
                              title="Valider"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingPasswordId(null)
                                setNewPassword("")
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Annuler"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingPasswordId(u.id)
                              setNewPassword("")
                              setEditingEmailId(null)
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100 flex items-center gap-1 transition-colors cursor-pointer text-[11px] font-bold"
                            title="Réinitialiser le mot de passe"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">MDP</span>
                          </button>
                        )}

                        {u.id !== currentUserId && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            disabled={loadingAction === `delete-${u.id}`}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40 hover:bg-rose-100 flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer text-[11px] font-bold"
                            title="Supprimer le compte"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Suppr.</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-400 dark:text-slate-500"
                    >
                      Aucun compte enregistré
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
