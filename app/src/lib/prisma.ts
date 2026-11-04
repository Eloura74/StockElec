import { PrismaClient } from '@prisma/client'

// L'URL de la base DOIT être fournie par l'environnement (Vercel ou app/.env en local).
// Aucun fallback en dur : un environnement mal configuré doit échouer explicitement
// plutôt que de se connecter silencieusement à la base de production.
const databaseUrl = process.env.DATABASE_URL
  || process.env.POSTGRES_PRISMA_URL
  || process.env.POSTGRES_URL

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL manquante. En local : copier app/.env.example vers app/.env. " +
    "Sur Vercel : définir DATABASE_URL pour l'environnement concerné (Production / Preview)."
  )
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
