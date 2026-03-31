import { NextRequest, NextResponse } from 'next/server';
import { updateAdminUser, getAdminUser } from '@/lib/users';

export async function GET() {
    const admin = await getAdminUser();
    if (!admin) {
        return NextResponse.json({
            email: process.env.ADMIN_EMAIL || 'admin@dadashri.com'
        });
    }
    return NextResponse.json({ email: admin.email });
}

export async function PUT(req: NextRequest) {
    try {
        const { email, password } = await req.json();
        
        if (!email && !password) {
            return NextResponse.json({ error: 'No data to update' }, { status: 400 });
        }
        
        const updateData: any = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        
        await updateAdminUser(updateData);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update credentials' }, { status: 500 });
    }
}
