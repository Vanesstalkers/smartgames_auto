async (col, query, options) => {
  //console.warn('db find col=', col);
  const result = await db.mongo.client
    .collection(col)
    .find(query, options)
    .toArray();
  return result;
};
