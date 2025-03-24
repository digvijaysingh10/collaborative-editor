import { getDb } from '@/lib/db';
import redis from '@/lib/redis';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const forceRefresh = request.nextUrl.searchParams.get('force') === 'true';
    if (!forceRefresh) {
      const cachedContent = await redis.get(`doc:${id}`);
      if (cachedContent) {
        console.log(`Returning cached content for ${id}:`, cachedContent);
        return Response.json({ content: cachedContent }, { status: 200 });
      }
    }

    const db = await getDb();
    const collection = db.collection('documents');
    const document = await collection.findOne({ id });
    if (!document) {
      console.log(`Document ${id} not found in MongoDB`);
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    console.log(`Fetched from MongoDB for ${id}:`, document.content);
    await redis.set(`doc:${id}`, document.content, 'EX', 3600);
    return Response.json({ content: document.content }, { status: 200 });
  } catch (error) {
    console.error(`GET /api/document/${id} error:`, error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const db = await getDb();
    const collection = db.collection('documents');
    const result = await collection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    await redis.del(`doc:${id}`);
    return Response.json({ message: 'Document deleted' }, { status: 200 });
  } catch (error) {
    console.error(`DELETE /api/document/delete/${id} error:`, error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}