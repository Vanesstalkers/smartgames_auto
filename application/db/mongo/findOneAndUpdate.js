async (col, query, update, options) => {
  // console.warn('db findOneAndUpdate col=', col);
  if (typeof query === 'string') query = db.mongo.ObjectID(query);
  else if (query._id && typeof query._id === 'string')
    query._id = db.mongo.ObjectID(query._id);
  const result = await db.mongo.client
    .collection(col)
    .findOneAndUpdate(query, update, options);
  // console.warn('db findOneAndUpdate', query, update, options, result);
  return result.ok ? result.value : result;
};
