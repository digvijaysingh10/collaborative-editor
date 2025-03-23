import { getDb } from '@/lib/db';
import redis from '@/lib/redis';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {

    const cachedContent = await redis.get(`doc:${id}`);
    if (cachedContent) {
      return Response.json({ content: cachedContent }, { status: 200 });
    }
    const db = await getDb();
    const collection = db.collection('documents');
    const document = await collection.findOne({ id });
    if (!document) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    await redis.set(`doc:${id}`, document.content, 'EX', 3600);
    return Response.json({ content: document.content }, { status: 200 });
  } catch (error) {
    console.error(`GET /api/document/${id} error:`, error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}