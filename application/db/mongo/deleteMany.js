async (col, query) => {
  const result = await db.mongo.client.collection(col).deleteMany(query);
  return result.deletedCount > 0 ? 'ok' : 'err';
};
