async (col, value) => {
  if (value._id && typeof value._id === 'string') value._id = db.mongo.ObjectID(value._id);
  const insertResult = await db.mongo.client.collection(col).insertOne(value);
  return { _id: insertResult.insertedId };
};
