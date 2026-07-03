import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Normalement stocké dans le .env, mais codé en dur pour éviter les crashs si manquant sur Vercel
const secretKey = process.env.JWT_SECRET || 'secret-ultra-securise-quentin-elec-2024'
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  })
  return payload
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  try {
    return await decrypt(session)
  } catch (error) {
    return null
  }
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  if (!session) return

  try {
    const parsed = await decrypt(session)
    parsed.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const res = NextResponse.next()
    res.cookies.set({
      name: 'session',
      value: await encrypt(parsed),
      httpOnly: true,
      expires: parsed.expires,
    })
    return res
  } catch (e) {
    return NextResponse.next()
  }
}
