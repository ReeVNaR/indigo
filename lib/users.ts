import { ObjectId, Document } from "mongodb";
import clientPromise from "./mongodb";

export interface User extends Document {
    _id?: ObjectId;
    email: string;
    password: string;
    role: 'admin';
}

export async function getAdminUser() {
    const client = await clientPromise;
    const db = client.db();
    return await db.collection<User>('users').findOne({ role: 'admin' });
}

export async function updateAdminUser(data: Partial<User>) {
    const client = await clientPromise;
    const db = client.db();
    
    // Ensure we don't try to update the _id
    const { _id, ...updateData } = data;
    
    const admin = await db.collection<User>('users').findOne({ role: 'admin' });
    
    if (admin) {
        return await db.collection<User>('users').updateOne(
            { role: 'admin' },
            { $set: updateData }
        );
    } else {
        return await db.collection<User>('users').insertOne({
            email: process.env.ADMIN_EMAIL || 'admin@dadashri.com',
            password: process.env.ADMIN_PASSWORD || 'Dadashri@123',
            role: 'admin',
            ...updateData
        } as any);
    }
}

export async function resetPassword(newPassword: string) {
    const client = await clientPromise;
    const db = client.db();
    
    return await db.collection<User>('users').updateOne(
        { role: 'admin' },
        { $set: { password: newPassword } as any },
        { upsert: true }
    );
}
