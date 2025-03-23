import { getDb } from '@/lib/db';
import redis from '@/lib/redis';
import { NextRequest } from 'next/server';
import { Document } from 'mongodb';

interface CounterDocument extends Document {
  _id: string;
  seq: number;
}

export async function GET() {
  try {
    const db = await getDb();
    const collection = db.collection('documents');
    const documents = await collection.find({}).toArray();
    return Response.json({ documents }, { status: 200 });
  } catch (error) {
    console.error('GET /api/document error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content, id, title } = (await request.json()) as {
      content?: unknown;
      id?: string;
      title?: string;
    };
    if (typeof content !== 'string') {
      return Response.json({ error: 'Content must be a string' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection('documents'); // Fixed typo: '_documents' -> 'documents'
    const countersCollection = db.collection<CounterDocument>('counters');
    const updatedAt = new Date();

    let docId: string;
    let docTitle: string;

    if (id) {
      docId = id;
      const existingDoc = await collection.findOne({ id });
      if (!existingDoc && content === '') {
        // New document with provided ID
        const counter = await countersCollection.findOneAndUpdate(
          { _id: 'docIndex' },
          { $inc: { seq: 1 } },
          { upsert: true, returnDocument: 'after' }
        );
        const index = counter?.seq || 1;
        docTitle = title || `doc-${index}`;
      } else if (!existingDoc) {
        return Response.json({ error: 'Document not found' }, { status: 404 });
      } else {
        docTitle = title || existingDoc.title;
      }
    } else {
      const counter = await countersCollection.findOneAndUpdate(
        { _id: 'docIndex' },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
      );
      const index = counter?.seq || 1;
      docId = crypto.randomUUID();
      docTitle = title || `doc-${index}`;
    }

    await collection.updateOne(
      { id: docId },
      { $set: { content, updatedAt, title: docTitle } },
      { upsert: true }
    );
    await redis.set(`doc:${docId}`, content, 'EX', 3600);

    return Response.json({ message: 'Saved', updatedAt, id: docId, title: docTitle }, { status: 200 });
  } catch (error) {
    console.error('POST /api/document error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}