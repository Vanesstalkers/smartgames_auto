async (hash, key) => await db.redis.client.hDel(hash, key);
