import { MongoClient, Db } from 'mongodb';

const mongoUri = process.env.MONGO_URI || '';
if (!mongoUri) {
  throw new Error('MONGO_URI environment variable is not set');
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

async function connectMongo(): Promise<MongoClient> {
  if (!clientPromise) {
    client = new MongoClient(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });
    clientPromise = client.connect().catch((err) => {
      console.error('MongoDB connection failed:', err);
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await connectMongo();
  return client.db('editorDB');
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    clientPromise = null;
  }
}

process.on('SIGTERM', async () => {
  await closeDb();
  process.exit(0);
});