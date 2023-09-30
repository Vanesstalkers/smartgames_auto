async (key, value, { json = false } = {}) =>
  await db.redis.client.set(key, json ? JSON.stringify(value) : value);
