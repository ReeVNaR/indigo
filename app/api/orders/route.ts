import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const DB_NAME = 'indigo';
const COLLECTION_NAME = 'orders';

export async function GET() {
    console.log('API: GET /api/orders called');
    try {
        console.log('API: Awaiting clientPromise...');
        const client = await clientPromise;
        console.log('API: Connected to MongoDB');
        const db = client.db(DB_NAME);
        const orders = await db.collection(COLLECTION_NAME).find({}).sort({ created_at: -1 }).toArray();
        console.log(`API: Found ${orders.length} orders`);

        // Transform MongoDB _id to id for the frontend
        const formattedOrders = orders.map(order => ({
            ...order,
            id: order._id.toString(),
            _id: undefined
        }));

        return NextResponse.json(formattedOrders);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const data = await req.json();

        const newOrder = {
            ...data,
            created_at: new Date().toISOString()
        };

        const result = await db.collection(COLLECTION_NAME).insertOne(newOrder);

        return NextResponse.json({ ...newOrder, id: result.insertedId.toString() }, { status: 201 });
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
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const result = await db.collection(COLLECTION_NAME).updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
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
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
