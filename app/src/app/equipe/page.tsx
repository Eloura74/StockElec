import { Shield, PlusCircle, Trash2, Users } from "lucide-react"
import prisma from "@/lib/prisma"
import { createUser, deleteUser } from "@/app/actions/auth"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DeleteUserButton } from "@/components/DeleteUserButton"

export default async function EquipePage() {
  const session = await getSession()
  if (session?.role !== 'GERANT') redirect('/login')

  const users = await (prisma as any).user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Gestion de l'Équipe
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">Créez des accès pour vos chefs d'équipe.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulaire de création */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border shadow-sm">
            <h2 className="font-bold text-gray-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600"/> Nouveau Compte
            </h2>
            <form action={async (data) => {
              "use server"
              await createUser(data)
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200">Identifiant (Nom du chef)</label>
                <input required type="text" name="username" placeholder="ex: max" className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200">Mot de passe</label>
                <input required type="text" name="password" placeholder="ex: 1234" className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50" />
              </div>
              <button type="submit" className="w-full flex justify-center items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors">
                Créer le compte
              </button>
            </form>
            <div className="mt-4 text-xs text-gray-500 dark:text-zinc-400 bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2">
              <Shield className="w-4 h-4 shrink-0 text-blue-600" />
              Ce compte n'aura accès qu'à l'onglet "Départ Matin" et ne verra pas les prix d'achat.
            </div>
          </div>
        </div>

        {/* Liste des comptes */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
              <thead className="bg-gray-50 dark:bg-zinc-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Mot de passe</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 dark:text-zinc-50">{u.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.role === 'GERANT' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {u.role === 'GERANT' ? 'Gérant' : 'Chef d\'équipe'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400 font-mono">
                      {u.password}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {u.role !== 'GERANT' && (
                        <form action={deleteUser.bind(null, u.id)}>
                          <DeleteUserButton />
                        </form>
                      )}
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
