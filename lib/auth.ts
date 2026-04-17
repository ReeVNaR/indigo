import { NextRequest } from 'next/server';
import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'dadashri-designers-secret-key-2024';
const DEV_AUTH_BYPASS =
    process.env.NODE_ENV !== 'production' &&
    process.env.DEV_AUTH_BYPASS === 'true';

/**
 * Verifies a signed token. Returns the email if valid, null if invalid/expired.
 */
export function verifyToken(token: string): string | null {
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

        if (signature.length !== expectedSignature.length) return null;
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

        return email;
    } catch {
        return null;
    }
}

export function isDevAuthBypassed(): boolean {
    return DEV_AUTH_BYPASS;
}

/**
 * Middleware-like check for API routes. 
 * Returns true if authenticated, false otherwise.
 */
export function isAuthenticated(req: NextRequest): boolean {
    if (DEV_AUTH_BYPASS) return true;
    const token = req.cookies.get('session_token')?.value;
    if (!token) return false;
    return !!verifyToken(token);
}
