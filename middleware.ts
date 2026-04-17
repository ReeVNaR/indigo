import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory storage for rate limiting (per instance)
// In a serverless environment, this resets often but remains useful
const rateLimit = new Map<string, { count: number, lastReset: number }>()
const SECRET = process.env.AUTH_SECRET || 'dadashri-designers-secret-key-2024'
const DEV_AUTH_BYPASS =
  process.env.NODE_ENV !== 'production' &&
  process.env.DEV_AUTH_BYPASS === 'true'

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function isValidSessionToken(token?: string): Promise<boolean> {
  if (!token) return false

  try {
    const decoded = atob(token)
    const parts = decoded.split('|')
    if (parts.length !== 3) return false

    const [email, expiresAtStr, signature] = parts
    const expiresAt = Number.parseInt(expiresAtStr, 10)
    if (!email || Number.isNaN(expiresAt)) return false
    if (Date.now() / 1000 > expiresAt) return false

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const expectedSigBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${email}|${expiresAtStr}`)
    )
    const expectedSignature = toHex(expectedSigBuffer)
    return signature === expectedSignature
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const sessionToken = request.cookies.get('session_token')?.value
  const isProtectedRoute =
    pathname.startsWith('/dashboard') || pathname.startsWith('/customers')

  // Block direct access to protected pages without a valid session.
  if (isProtectedRoute && !DEV_AUTH_BYPASS) {
    const hasValidSession = await isValidSessionToken(sessionToken)
    if (!hasValidSession) {
      const loginUrl = new URL('/', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (isProtectedRoute && DEV_AUTH_BYPASS && !sessionToken) {
    const loginUrl = new URL('/', request.url)
    return NextResponse.redirect(loginUrl)
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  
  // Only limit sensitive routes
  if (pathname.startsWith('/api/auth')) {
    const now = Date.now()
    const limit = 5 // Max 5 requests per minute for auth
    const windowMs = 60 * 1000 // 1 minute
    
    const record = rateLimit.get(ip) || { count: 0, lastReset: now }
    
    // Reset window if expired
    if (now - record.lastReset > windowMs) {
      record.count = 0
      record.lastReset = now
    }
    
    record.count++
    rateLimit.set(ip, record)
    
    if (record.count > limit) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again in a minute.' }),
        { status: 429, headers: { 'content-type': 'application/json' } }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/customers/:path*'],
}
