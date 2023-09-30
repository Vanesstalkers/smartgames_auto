async (col, value) => {
  console.warn('db insertMany col=', col);
  const insertResult = await db.mongo.client.collection(col).insertMany(value);
  return insertResult;
};
