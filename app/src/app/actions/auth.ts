"use server"

import prisma from "@/lib/prisma"
import { cookies } from "next/headers"
import { encrypt } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Création du compte gérant s'il n'existe pas (appelé à la volée lors du login par sécurité si db vide)
async function initAdmin() {
  const admin = await (prisma as any).user.findUnique({ where: { username: 'cedricelec' } })
  if (!admin) {
    await (prisma as any).user.create({
      data: {
        username: 'cedricelec',
        password: 'cogolin',
        role: 'GERANT'
      }
    })
  }
}

export async function login(formData: FormData) {
  await initAdmin()

  const username = (formData.get("username") as string).toLowerCase().trim()
  const password = formData.get("password") as string

  const user = await (prisma as any).user.findUnique({
    where: { username }
  })

  if (!user || user.password !== password) {
    return { error: "Identifiant ou mot de passe incorrect." }
  }

  // Création de la session
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const sessionData = { 
    userId: user.id, 
    username: user.username, 
    role: user.role 
  }
  
  const sessionToken = await encrypt(sessionData)
  
  const cookieStore = await cookies()
  cookieStore.set("session", sessionToken, { 
    expires, 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production" 
  })

  // Redirection selon le rôle
  if (user.role === 'GERANT') {
    redirect("/")
  } else {
    redirect("/depart-matin")
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
  redirect("/login")
}

export async function createUser(formData: FormData) {
  const username = (formData.get("username") as string).toLowerCase().trim()
  const password = formData.get("password") as string

  if (!username || !password) return { error: "Veuillez remplir tous les champs" }

  const exists = await (prisma as any).user.findUnique({ where: { username } })
  if (exists) return { error: "Ce nom d'utilisateur existe déjà." }

  await (prisma as any).user.create({
    data: {
      username,
      password,
      role: 'CHEF_EQUIPE'
    }
  })

  revalidatePath("/equipe")
  return { success: true }
}

export async function deleteUser(id: string) {
  await (prisma as any).user.delete({ where: { id } })
  revalidatePath("/equipe")
}
