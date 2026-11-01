import { PrismaClient } from '@prisma/client'

// Fallback sécurisé pour la production sur Vercel si les variables ne sont pas injectées
const DEFAULT_DATABASE_URL = "postgres://0a28256d385b1fa31a1e60e1f99170e9a1decbdaa963ccf2ce66b45e927a02ab:sk_ukoaL4DpYXPVvSAkmjmxH@db.prisma.io:5432/postgres?sslmode=require"

const databaseUrl = process.env.DATABASE_URL 
  || process.env.POSTGRES_PRISMA_URL 
  || process.env.POSTGRES_URL 
  || DEFAULT_DATABASE_URL

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

