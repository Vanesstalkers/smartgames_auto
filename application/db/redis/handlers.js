({
  afterStartList: [],
  afterStart: async (handler) => {
    if (handler) {
      if (db.redis.ready) await handler();
      else db.redis.handlers.afterStartList.push(handler);
      return;
    }

    for (const fn of db.redis.handlers.afterStartList) {
      if (typeof fn === 'function') await fn();
    }
  },
});
