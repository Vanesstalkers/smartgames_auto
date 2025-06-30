async (key, { json = false } = {}) => {
  const result = await db.redis.client.get(key);
  return json ? JSON.parse(result || '{}') : result;
};
