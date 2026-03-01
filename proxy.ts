import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Must match the secret in app/api/auth/route.ts
const SECRET = process.env.AUTH_SECRET || 'dadashri-designers-secret-key-2024';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard'];
const PROTECTED_API_ROUTES = ['/api/orders', '/api/customers', '/api/expenses'];

/**
 * Verify the HMAC-signed session token (stateless — no server storage needed)
 */
function verifyToken(token: string): boolean {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const parts = decoded.split('|');
        if (parts.length !== 3) return false;

        const [email, expiresAtStr, signature] = parts;
        const expiresAt = parseInt(expiresAtStr, 10);

        // Check expiry
        if (Date.now() / 1000 > expiresAt) return false;

        // Verify signature
        const expectedPayload = `${email}|${expiresAtStr}`;
        const expectedSignature = crypto.createHmac('sha256', SECRET).update(expectedPayload).digest('hex');

        if (signature.length !== expectedSignature.length) return false;
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
        return false;
    }
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the route needs protection
    const isProtectedPage = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isProtectedApi = PROTECTED_API_ROUTES.some(route => pathname.startsWith(route));

    if (!isProtectedPage && !isProtectedApi) {
        return NextResponse.next();
    }

    // Check for session token cookie and verify it
    const sessionToken = request.cookies.get('session_token')?.value;
    const isValid = sessionToken ? verifyToken(sessionToken) : false;

    if (!isValid) {
        // For API routes, return 401
        if (isProtectedApi) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // For page routes, redirect to login
        const loginUrl = new URL('/', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/api/orders/:path*',
        '/api/customers/:path*',
        '/api/expenses/:path*',
    ],
};
