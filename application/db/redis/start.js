async () => {
  const client = npm.redis.createClient();
  await client.connect();
  
  client.on('error', () => {
    if (application.worker.id === 'W1') {
      console.warn('No redis service detected, so quit client');
    }
    client.quit();
  });
  db.redis.client = client;

  if (application.worker.id === 'W1') {
    console.debug('Connect to redis');
    await db.redis.handlers.afterStart(async () => {
      console.info('db.redis.afterStart');
    });
  }

  db.redis.ready = true;
  await db.redis.handlers.afterStart();
};
