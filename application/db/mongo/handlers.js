({
  afterStartList: [],
  afterStart: async (handler) => {
    if (handler) {
      if (db.mongo.ready) await handler();
      else db.mongo.handlers.afterStartList.push(handler);
      return;
    }

    for (const fn of db.mongo.handlers.afterStartList) {
      if (typeof fn === 'function') await fn();
    }
  },
});
