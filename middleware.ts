import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/request'

// Simple in-memory storage for rate limiting (per instance)
// In a serverless environment, this resets often but remains useful
const rateLimit = new Map<string, { count: number, lastReset: number }>()

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  
  // Only limit sensitive routes
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
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
  matcher: '/api/:path*',
}
