import { getDb } from '@/lib/db';
import redis from '@/lib/redis';
import { NextRequest } from 'next/server';

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