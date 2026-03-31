import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Credentials — set in .env.local or use defaults
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dadashri.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Dadashri@123';

// Secret key for signing tokens — falls back to a static key for dev
const SECRET = process.env.AUTH_SECRET || 'dadashri-designers-secret-key-2024';

// Session duration: 1 day in seconds
const SESSION_DURATION = 24 * 60 * 60;

/**
 * Creates a signed token: email|expiresAt|signature
 * The signature = HMAC-SHA256(email|expiresAt, SECRET)
 * This is stateless — no server-side storage needed.
 */
function createToken(email: string): string {
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION;
    const payload = `${email}|${expiresAt}`;
    const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    // Base64 encode the full token for safe cookie storage
    return Buffer.from(`${payload}|${signature}`).toString('base64');
}

/**
 * Verifies a signed token. Returns the email if valid, null if invalid/expired.
 */
function verifyToken(token: string): string | null {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const parts = decoded.split('|');
        if (parts.length !== 3) return null;

        const [email, expiresAtStr, signature] = parts;
        const expiresAt = parseInt(expiresAtStr, 10);

        // Check expiry
        if (Date.now() / 1000 > expiresAt) return null;

        // Verify signature
        const expectedPayload = `${email}|${expiresAtStr}`;
        const expectedSignature = crypto.createHmac('sha256', SECRET).update(expectedPayload).digest('hex');

        // Constant-time comparison to prevent timing attacks
        if (signature.length !== expectedSignature.length) return null;
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

        return email;
    } catch {
        return null;
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

        // Create signed token
        const token = createToken(email);

        // Set HTTP-only cookie
        const response = NextResponse.json({ success: true });
        response.cookies.set('session_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: SESSION_DURATION, // 1 day
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

    if (!token) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const email = verifyToken(token);
    if (!email) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, email });
}

// LOGOUT (DELETE)
export async function DELETE(req: NextRequest) {
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
