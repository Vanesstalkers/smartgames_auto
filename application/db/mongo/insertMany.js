async (col, items) => {
  for(const item of items) {
    if (item._id && typeof item._id === 'string') item._id = db.mongo.ObjectID(item._id);
  }
  const insertResult = await db.mongo.client.collection(col).insertMany(items);
  return insertResult;
};
