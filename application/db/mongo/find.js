async (col, query, options = {}) => {
  const cursor = db.mongo.client.collection(col).find(query);
  
  if (options.sort) cursor.sort(options.sort);
  if (options.limit) cursor.limit(options.limit);

  return await cursor.toArray();
};
