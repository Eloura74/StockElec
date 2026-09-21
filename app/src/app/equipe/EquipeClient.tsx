"use client"

import { useState } from 'react'
import { Shield, PlusCircle, Trash2, Users, Key, Mail, Check, X, AlertCircle } from 'lucide-react'
import { createUser, deleteUser, updateUserPassword, updateUserEmail } from '@/app/actions/auth'

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
  const [newPassword, setNewPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  // Gestion de la création d'utilisateur
  const handleCreateUser = async (formData: FormData) => {
    setError(null)
    setSuccess(null)
    setLoadingAction('create')
    
    const res = await createUser(formData)
    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess(`Compte "${formData.get('username')}" créé avec succès.`)
    }
    setLoadingAction(null)
  }

  // Gestion de la suppression d'utilisateur
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

  // Gestion du changement de mot de passe
  const handleUpdatePassword = async (userId: string) => {
    if (!newPassword) return
    
    setError(null)
    setSuccess(null)
    setLoadingAction(`password-${userId}`)
    
    const res = await updateUserPassword(userId, newPassword)
    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess('Mot de passe mis à jour.')
      setEditingPasswordId(null)
      setNewPassword('')
    }
    setLoadingAction(null)
  }

  // Gestion du changement d'email
  const handleUpdateEmail = async (userId: string) => {
    setError(null)
    setSuccess(null)
    setLoadingAction(`email-${userId}`)
    
    const res = await updateUserEmail(userId, newEmail)
    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess('Email mis à jour.')
      setEditingEmailId(null)
      setNewEmail('')
    }
    setLoadingAction(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Gestion de l&apos;Équipe
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">Créez et gérez les comptes utilisateurs.</p>
        </div>
      </div>

      {/* Messages de feedback */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulaire de création */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border shadow-sm">
            <h2 className="font-bold text-gray-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600"/> Nouveau Compte
            </h2>
            <form action={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200">Identifiant</label>
                <input 
                  required 
                  type="text" 
                  name="username" 
                  placeholder="ex: max" 
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200">Mot de passe</label>
                <input 
                  required 
                  type="text" 
                  name="password" 
                  placeholder="ex: 1234" 
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200">Email <span className="text-gray-400 font-normal">(optionnel)</span></label>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="email@exemple.com" 
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200">Rôle</label>
                <select 
                  name="role" 
                  defaultValue="GERANT"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50"
                >
                  <option value="GERANT">Admin (accès complet)</option>
                  <option value="CHEF_EQUIPE">Chef d&apos;équipe (Départ Matin)</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={loadingAction === 'create'}
                className="w-full flex justify-center items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {loadingAction === 'create' ? 'Création...' : 'Créer le compte'}
              </button>
            </form>
            <div className="mt-4 text-xs text-gray-500 dark:text-zinc-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-2">
              <Shield className="w-4 h-4 shrink-0 text-blue-600" />
              <span>
                <strong>Admin</strong> : accès complet à toute l&apos;application.<br/>
                <strong>Chef d&apos;équipe</strong> : accès uniquement à l&apos;onglet &quot;Départ Matin&quot;.
              </span>
            </div>
          </div>
        </div>

        {/* Liste des comptes */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border shadow-sm overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
              <thead className="bg-gray-50 dark:bg-zinc-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 dark:text-zinc-50">
                        {u.username}
                        {u.id === currentUserId && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">(vous)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.role === 'GERANT' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300' : 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                      }`}>
                        {u.role === 'GERANT' ? 'Admin' : 'Chef d\'équipe'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingEmailId === u.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="email@exemple.com"
                            className="text-sm rounded-md border-gray-300 dark:border-zinc-700 px-2 py-1 border bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 w-44"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateEmail(u.id)}
                            disabled={loadingAction === `email-${u.id}`}
                            className="text-green-600 hover:text-green-700 disabled:opacity-50"
                            title="Valider"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingEmailId(null); setNewEmail('') }}
                            className="text-gray-400 hover:text-gray-600"
                            title="Annuler"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 dark:text-zinc-400">
                            {u.email || '—'}
                          </span>
                          <button
                            onClick={() => { setEditingEmailId(u.id); setNewEmail(u.email || ''); setEditingPasswordId(null) }}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="Modifier l'email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* Bouton réinitialiser MDP */}
                        {editingPasswordId === u.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Nouveau MDP"
                              className="text-sm rounded-md border-gray-300 dark:border-zinc-700 px-2 py-1 border bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 w-28"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdatePassword(u.id)}
                              disabled={!newPassword || loadingAction === `password-${u.id}`}
                              className="text-green-600 hover:text-green-700 disabled:opacity-50"
                              title="Valider"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingPasswordId(null); setNewPassword('') }}
                              className="text-gray-400 hover:text-gray-600"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingPasswordId(u.id); setNewPassword(''); setEditingEmailId(null) }}
                            className="text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
                            title="Réinitialiser le mot de passe"
                          >
                            <Key className="w-4 h-4" />
                            <span className="hidden sm:inline">MDP</span>
                          </button>
                        )}

                        {/* Bouton supprimer — invisible pour son propre compte */}
                        {u.id !== currentUserId && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            disabled={loadingAction === `delete-${u.id}`}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1 transition-colors disabled:opacity-50"
                            title="Supprimer le compte"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Suppr.</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-zinc-400">
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
