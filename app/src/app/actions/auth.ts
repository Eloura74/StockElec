"use server"

import prisma from "@/lib/prisma"
import { cookies } from "next/headers"
import { encrypt, decrypt } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { getSession } from "@/lib/auth"
import { sendPasswordResetEmail } from "@/lib/mailer"

// Création du compte gérant s'il n'existe pas (appelé à la volée lors du login par sécurité si db vide)
async function initAdmin() {
  const admin = await (prisma as any).user.findUnique({ where: { username: 'cedricelec' } })
  if (!admin) {
    const hashedPassword = await bcrypt.hash('cogolin', 10)
    await (prisma as any).user.create({
      data: {
        username: 'cedricelec',
        password: hashedPassword,
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

  if (!user) {
    return { error: "Identifiant ou mot de passe incorrect." }
  }

  // Rétrocompatibilité : si le mot de passe n'est pas haché (ne commence pas par $2a$ ou $2b$ ou $2y$)
  let isPasswordValid = false;
  if (!user.password.startsWith("$2")) {
    isPasswordValid = (user.password === password);
    // Si valide, on le met à jour avec le hash silencieusement pour le migrer
    if (isPasswordValid) {
      const newHash = await bcrypt.hash(password, 10);
      await (prisma as any).user.update({
        where: { id: user.id },
        data: { password: newHash }
      });
    }
  } else {
    isPasswordValid = await bcrypt.compare(password, user.password);
  }

  if (!isPasswordValid) {
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

/**
 * Créer un nouvel utilisateur.
 * Accepte le rôle (GERANT ou CHEF_EQUIPE) et l'email (optionnel) via le formulaire.
 * Seuls les GERANT peuvent créer des utilisateurs.
 */
export async function createUser(formData: FormData) {
  // Vérification que l'appelant est admin
  const session = await getSession()
  if (!session || session.role !== 'GERANT') {
    return { error: "Accès refusé." }
  }

  const username = (formData.get("username") as string).toLowerCase().trim()
  const password = formData.get("password") as string
  const role = (formData.get("role") as string) || 'CHEF_EQUIPE'
  const email = (formData.get("email") as string)?.trim() || null

  if (!username || !password) return { error: "Veuillez remplir l'identifiant et le mot de passe." }
  if (role !== 'GERANT' && role !== 'CHEF_EQUIPE') return { error: "Rôle invalide." }

  const exists = await (prisma as any).user.findUnique({ where: { username } })
  if (exists) return { error: "Ce nom d'utilisateur existe déjà." }

  const hashedPassword = await bcrypt.hash(password, 10)

  await (prisma as any).user.create({
    data: {
      username,
      password: hashedPassword,
      role,
      email: email || undefined,
    }
  })

  revalidatePath("/equipe")
  return { success: true }
}

/**
 * Supprimer un utilisateur.
 * Un admin ne peut pas se supprimer lui-même.
 */
export async function deleteUser(id: string) {
  const session = await getSession()
  if (!session || session.role !== 'GERANT') {
    return { error: "Accès refusé." }
  }

  // Empêcher l'auto-suppression
  if (session.userId === id) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte." }
  }

  await (prisma as any).user.delete({ where: { id } })
  revalidatePath("/equipe")
  return { success: true }
}

/**
 * Réinitialiser le mot de passe d'un utilisateur (action admin).
 */
export async function updateUserPassword(userId: string, newPassword: string) {
  const session = await getSession()
  if (!session || session.role !== 'GERANT') {
    return { error: "Accès refusé." }
  }

  if (!newPassword || newPassword.length < 3) {
    return { error: "Le mot de passe doit contenir au moins 3 caractères." }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)
  await (prisma as any).user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  })

  revalidatePath("/equipe")
  return { success: true }
}

/**
 * Modifier l'email d'un utilisateur (action admin).
 */
export async function updateUserEmail(userId: string, newEmail: string) {
  const session = await getSession()
  if (!session || session.role !== 'GERANT') {
    return { error: "Accès refusé." }
  }

  await (prisma as any).user.update({
    where: { id: userId },
    data: { email: newEmail.trim() || null }
  })

  revalidatePath("/equipe")
  return { success: true }
}

/**
 * Demander une réinitialisation de mot de passe par email (self-service).
 * Génère un token JWT (1h) et envoie un email avec un lien.
 * Ne révèle jamais si l'email existe ou non (sécurité).
 */
export async function requestPasswordReset(email: string) {
  if (!email || !email.trim()) {
    return { error: "Veuillez saisir votre adresse email." }
  }

  const trimmedEmail = email.trim().toLowerCase()

  // Chercher l'utilisateur par email
  const user = await (prisma as any).user.findFirst({
    where: { email: trimmedEmail }
  })

  // Même si l'utilisateur n'existe pas, on retourne le même message (sécurité)
  if (user) {
    // Générer un token de réinitialisation (valable 1h)
    const resetToken = await encrypt({
      userId: user.id,
      purpose: 'password-reset',
    }, '1h')

    // Construire le lien de réinitialisation
    const appUrl = process.env.APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000'
    const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`

    // Envoyer l'email
    await sendPasswordResetEmail(trimmedEmail, resetLink)
  }

  // Message identique dans tous les cas (ne pas révéler si l'email existe)
  return { 
    success: true, 
    message: "Si un compte est associé à cette adresse email, un lien de réinitialisation a été envoyé." 
  }
}

/**
 * Réinitialiser le mot de passe via un token (lien email).
 * Vérifie que le token est valide et non expiré (1h max via JWT).
 */
export async function resetPasswordWithToken(token: string, newPassword: string) {
  if (!token || !newPassword) {
    return { error: "Données manquantes." }
  }

  if (newPassword.length < 3) {
    return { error: "Le mot de passe doit contenir au moins 3 caractères." }
  }

  try {
    const payload = await decrypt(token)
    
    if (!payload || payload.purpose !== 'password-reset' || !payload.userId) {
      return { error: "Lien de réinitialisation invalide." }
    }

    // Vérifier que l'utilisateur existe toujours
    const user = await (prisma as any).user.findUnique({
      where: { id: payload.userId }
    })

    if (!user) {
      return { error: "Utilisateur introuvable." }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await (prisma as any).user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    return { success: true, message: "Mot de passe mis à jour avec succès. Vous pouvez vous connecter." }
  } catch (error) {
    return { error: "Lien de réinitialisation expiré ou invalide. Veuillez en demander un nouveau." }
  }
}
