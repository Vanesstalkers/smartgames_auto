({
  afterStartList: [],
  afterStart: async (handler) => {
    if (handler) {
      if (db.redis.ready) await Object.values(handler)[0]();
      else Object.assign(db.redis.handlers.afterStart, handler);
      return;
    }

    for (const fn of Object.values(db.redis.handlers.afterStart)) {
      if (typeof fn === 'function') await fn();
    }
  },
});
