import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard'];
const PROTECTED_API_ROUTES = ['/api/orders', '/api/customers'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the route needs protection
    const isProtectedPage = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isProtectedApi = PROTECTED_API_ROUTES.some(route => pathname.startsWith(route));

    if (!isProtectedPage && !isProtectedApi) {
        return NextResponse.next();
    }

    // Check for session token cookie
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
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

    // Token exists — let the request through.
    // The actual session validation happens server-side in the API routes.
    // This middleware provides the first line of defense (no cookie = no access).
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/api/orders/:path*',
        '/api/customers/:path*',
    ],
};
