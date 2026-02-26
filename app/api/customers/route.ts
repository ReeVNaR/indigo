import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const DB_NAME = 'indigo';
const COLLECTION_NAME = 'customers';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const customers = await db.collection(COLLECTION_NAME).find({}).sort({ created_at: -1 }).toArray();

        const formattedCustomers = customers.map(customer => ({
            ...customer,
            id: customer._id.toString(),
            _id: undefined
        }));

        return NextResponse.json(formattedCustomers);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const data = await req.json();

        const newCustomer = {
            ...data,
            created_at: new Date().toISOString()
        };

        const result = await db.collection(COLLECTION_NAME).insertOne(newCustomer);

        return NextResponse.json({ ...newCustomer, id: result.insertedId.toString() }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const data = await req.json();
        const { id, ...updateData } = data;

        if (!id) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        const result = await db.collection(COLLECTION_NAME).updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
