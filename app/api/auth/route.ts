import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// In production, store these in environment variables or a database.
// For now, we use a hardcoded credential check.
// Default: email = "admin@dadashri.com", password = "Dadashri@123"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dadashri.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Dadashri@123';

// Generate a secure session token
function generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

// In-memory session store (works for single-instance deployments)
// For production, use Redis or a database
const sessions = new Map<string, { email: string; createdAt: number }>();

// Clean expired sessions (24 hour expiry)
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;
function cleanExpiredSessions() {
    const now = Date.now();
    for (const [token, session] of sessions.entries()) {
        if (now - session.createdAt > SESSION_EXPIRY_MS) {
            sessions.delete(token);
        }
    }
}

// LOGIN
export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Validate credentials
        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Clean old sessions
        cleanExpiredSessions();

        // Create session
        const token = generateSessionToken();
        sessions.set(token, { email, createdAt: Date.now() });

        // Set HTTP-only cookie
        const response = NextResponse.json({ success: true });
        response.cookies.set('session_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24, // 24 hours
        });

        return response;
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// VERIFY SESSION (GET)
export async function GET(req: NextRequest) {
    const token = req.cookies.get('session_token')?.value;

    if (!token || !sessions.has(token)) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = sessions.get(token)!;
    if (Date.now() - session.createdAt > SESSION_EXPIRY_MS) {
        sessions.delete(token);
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, email: session.email });
}

// LOGOUT (DELETE)
export async function DELETE(req: NextRequest) {
    const token = req.cookies.get('session_token')?.value;

    if (token) {
        sessions.delete(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('session_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0, // Delete cookie immediately
    });

    return response;
}
