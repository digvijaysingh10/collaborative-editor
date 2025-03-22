import { getDb } from '@/lib/db';
import redis from '@/lib/redis';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content } = (await request.json()) as { content?: unknown };
    if (typeof content !== 'string') {
      return Response.json({ error: 'Content must be a string' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection('documents');
    const updatedAt = new Date();

    await collection.updateOne(
      { id: 'doc1' },
      { $set: { content, updatedAt } },
      { upsert: true }
    );
    await redis.set('doc:1', content, 'EX', 3600);

    return Response.json({ message: 'Saved', updatedAt }, { status: 200 });
  } catch (error) {
    console.error('POST /api/document error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';