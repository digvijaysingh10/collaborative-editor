import { MongoClient, Db } from 'mongodb';

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
if (!mongoUri) {
  throw new Error('MONGO_URI environment variable is not set');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

if (!clientPromise) {
  client = new MongoClient(mongoUri);
  clientPromise = client.connect().catch((err) => {
    console.error('MongoDB connection error:', err);
    throw err;
  });
}

export async function getDb(): Promise<Db> {
  if (!clientPromise) {
    throw new Error('MongoDB clientPromise is not initialized');
  }
  const client = await clientPromise;
  return client.db('editor');
}

export async function closeDb(): Promise<void> {
  if (client && clientPromise) {
    await client.close();
    clientPromise = null;
  }
}