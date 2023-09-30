async (hash, key, value, { json = false } = {}) =>
  await db.redis.client.hSet(hash, key, json ? JSON.stringify(value) : value);
