import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0';
if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is not set');
}

const redis = new Redis(redisUrl);
redis.on('error', (err) => console.error('Redis Error:', err));

export default redis;