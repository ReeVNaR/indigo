import { ObjectId, Document } from "mongodb";
import clientPromise from "./mongodb";
import crypto from "crypto";

export interface User extends Document {
    _id?: ObjectId;
    email: string;
    password: string; // Hashed version
    role: 'admin';
}

/**
 * Hashing logic using PBKDF2 (more secure than plain text)
 */
export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    if (parts.length !== 2) {
        // Fallback for transition from plain text
        return password === storedHash;
    }
    const [salt, hash] = parts;
    const currentHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return currentHash === hash;
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
    
    if (updateData.password) {
        updateData.password = hashPassword(updateData.password);
    }
    
    const admin = await db.collection<User>('users').findOne({ role: 'admin' });
    
    if (admin) {
        return await db.collection<User>('users').updateOne(
            { role: 'admin' },
            { $set: updateData }
        );
    } else {
        return await db.collection<User>('users').insertOne({
            email: process.env.ADMIN_EMAIL || 'admin@dadashri.com',
            password: hashPassword(process.env.ADMIN_PASSWORD || 'Dadashri@123'),
            role: 'admin',
            ...updateData
        } as any);
    }
}

export async function resetPassword(newPassword: string) {
    const client = await clientPromise;
    const db = client.db();
    
    const hashedPassword = hashPassword(newPassword);
    
    return await db.collection<User>('users').updateOne(
        { role: 'admin' },
        { $set: { password: hashedPassword } as any },
        { upsert: true }
    );
}
