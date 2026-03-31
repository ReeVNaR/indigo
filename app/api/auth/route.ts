import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyToken } from '@/lib/auth';
import { getAdminUser, verifyPassword } from '@/lib/users';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dadashri.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Dadashri@123';
const SECRET = process.env.AUTH_SECRET || 'dadashri-designers-secret-key-2024';
const SESSION_DURATION = 24 * 60 * 60; // 1 day

function createToken(email: string): string {
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION;
    const payload = `${email}|${expiresAt}`;
    const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    return Buffer.from(`${payload}|${signature}`).toString('base64');
}

// LOGIN
export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        let adminEmail = ADMIN_EMAIL;
        let isCorrect = false;

        try {
            const dbAdmin = await getAdminUser();
            if (dbAdmin) {
                adminEmail = dbAdmin.email;
                isCorrect = (email === adminEmail) && verifyPassword(password, dbAdmin.password);
            } else {
                // Fallback to .env defaults if no DB user exists yet
                isCorrect = (email === ADMIN_EMAIL && password === ADMIN_PASSWORD);
            }
        } catch (e) {
            console.error("Auth DB Error:", e);
            // Emergency fallback
            isCorrect = (email === ADMIN_EMAIL && password === ADMIN_PASSWORD);
        }

        if (!isCorrect) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = createToken(email);
        const response = NextResponse.json({ success: true });
        response.cookies.set('session_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: SESSION_DURATION,
        });

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const token = req.cookies.get('session_token')?.value;
    if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });

    const email = verifyToken(token);
    if (!email) return NextResponse.json({ authenticated: false }, { status: 401 });

    return NextResponse.json({ authenticated: true, email });
}

export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.set('session_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
    return response;
}
