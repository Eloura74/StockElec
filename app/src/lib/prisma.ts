import { PrismaClient } from '@prisma/client'

// L'URL de la base doit être fournie par l'environnement (Vercel ou app/.env en local).
const databaseUrl = process.env.DATABASE_URL
  || process.env.POSTGRES_PRISMA_URL
  || process.env.POSTGRES_URL

if (!process.env.DATABASE_URL && databaseUrl) {
  process.env.DATABASE_URL = databaseUrl
}

// Fallback sûr pour la compilation et phase de build Next.js
// Évite de faire planter 'next build' si Vercel Preview n'a pas encore la variable cochée.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || !databaseUrl
const effectiveUrl = databaseUrl || 'postgresql://postgres:build_time_dummy@localhost:5432/stockelec_dummy'

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: effectiveUrl
      }
    }
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const rawPrisma = globalThis.prismaGlobal ?? prismaClientSingleton()

// Proxy de sécurité pour intercepter au runtime si DATABASE_URL est réellement manquante
const prisma: PrismaClient = (new Proxy(rawPrisma, {
  get(target: any, prop: string | symbol, receiver: any) {
    if (!databaseUrl && typeof prop === 'string' && !['then', '$on', '$connect', '$disconnect'].includes(prop)) {
      if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
        throw new Error(
          "DATABASE_URL manquante au runtime. Veuillez configurer DATABASE_URL dans les paramètres Vercel pour l'environnement concerné (Production / Preview)."
        )
      }
    }
    return Reflect.get(target, prop, receiver)
  }
})) as unknown as PrismaClient

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = rawPrisma
