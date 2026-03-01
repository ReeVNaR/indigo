import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const DB_NAME = 'indigo';
const COLLECTION_NAME = 'expenses';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const expenses = await db.collection(COLLECTION_NAME).find({}).sort({ date: -1 }).toArray();

        const formatted = expenses.map(e => ({
            ...e,
            id: e._id.toString(),
            _id: undefined
        }));

        return NextResponse.json(formatted);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const data = await req.json();

        const newExpense = {
            ...data,
            amount: Number(data.amount),
            date: data.date || new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        const result = await db.collection(COLLECTION_NAME).insertOne(newExpense);

        return NextResponse.json({ ...newExpense, id: result.insertedId.toString() }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
