import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import EquipeClient from "./EquipeClient"

export default async function EquipePage() {
  const session = await getSession()
  if (session?.role !== 'GERANT') redirect('/login')

  const users = await (prisma as any).user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      role: true,
      email: true,
      createdAt: true,
    }
  })

  // Sérialiser les dates pour le composant client
  const serializedUsers = users.map((u: any) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <EquipeClient 
      users={serializedUsers} 
      currentUserId={session.userId} 
    />
  )
}
