async () => {
  const client = new npm.mongodb.MongoClient(config.mongo.url, {
    // useUnifiedTopology: true
  });
  await client.connect();
  db.mongo.client = client.db('xaoc3');
  db.mongo.ObjectID = (id) => new npm.mongodb.ObjectId(id);

  if (application.worker.id === 'W1') {
    console.debug('Connect to mongo');
    await db.mongo.handlers.afterStart(async () => {
      console.log('db.mongo.afterStart');
    });
  }

  db.mongo.ready = true;
  await db.mongo.handlers.afterStart();
};
