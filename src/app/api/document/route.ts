import { getDb, closeDb } from '@/lib/db';
import redis from '@/lib/redis';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const cached = await redis.get('doc:1');
    if (cached) {
      return Response.json({ content: cached }, { status: 200 });
    }

    const db = await getDb();
    const collection = db.collection('documents');
    const doc = await collection.findOne({ id: 'doc1' });
    const content = doc?.content || '';
    await redis.set('doc:1', content);

    return Response.json({ content }, { status: 200 });
  } catch (error) {
    console.error('GET /api/document error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  } finally {
    await closeDb();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content } = (await request.json()) as { content: string };
    const db = await getDb();
    const collection = db.collection('documents');

    await collection.updateOne(
      { id: 'doc1' },
      { $set: { content, updatedAt: new Date() } },
      { upsert: true }
    );
    await redis.set('doc:1', content);

    return Response.json({ message: 'Saved' }, { status: 200 });
  } catch (error) {
    console.error('POST /api/document error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  } finally {
    await closeDb();
  }
}