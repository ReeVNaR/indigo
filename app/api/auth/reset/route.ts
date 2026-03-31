import { NextRequest, NextResponse } from 'next/server';
import { resetPassword } from '@/lib/users';

export async function POST(req: NextRequest) {
    try {
        const { masterKey, newPassword } = await req.json();
        
        // Use a static fallback for development, but ideally set this in .env.local
        const MASTER_RESET_KEY = process.env.MASTER_RESET_KEY || 'dadashri-2024-master-reset';

        if (!masterKey || masterKey !== MASTER_RESET_KEY) {
            return NextResponse.json({ error: 'Invalid Master Reset Key' }, { status: 403 });
        }

        if (!newPassword || newPassword.length < 4) {
            return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
        }

        await resetPassword(newPassword);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
