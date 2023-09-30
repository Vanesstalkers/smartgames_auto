async (col, query) => {
  //console.warn('db deleteOne col=', col);
  if (typeof query === 'string') query = db.mongo.ObjectID(query);
  else if (query._id && typeof query._id === 'string')
    query._id = db.mongo.ObjectID(query._id);
  const result = await db.mongo.client.collection(col).deleteOne(query);
  //console.log("result", result, result.deletedCount, {col, query});
  return result.deletedCount === 1 ? 'ok' : 'err';
};
