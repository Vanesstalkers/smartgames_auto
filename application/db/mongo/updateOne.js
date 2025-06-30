async (col, query, update, options) => {
  if (typeof query === 'string') query = { _id: db.mongo.ObjectID(query) };
  else if (lib.utils.isObjectID(query)) query = { _id: query };
  else if (query._id && typeof query._id === 'string') query._id = db.mongo.ObjectID(query._id);

  if (update.$set?._id) delete update.$set._id;
  const result = await db.mongo.client.collection(col).updateOne(query, update, options);

  return result;
};
