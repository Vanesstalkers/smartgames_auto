async (hash, key, { json = false } = {}) => {
  const result = await db.redis.client.hGet(hash, key);
  return json ? JSON.parse(result || '{"notFound": true}') : result;
};
