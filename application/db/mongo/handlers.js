({
  afterStartList: [],
  afterStart: async (handler) => {
    if (handler) {
      if (db.mongo.ready) await Object.values(handler)[0]();
      else Object.assign(db.mongo.handlers.afterStart, handler);
      return;
    }

    for (const fn of Object.values(db.mongo.handlers.afterStart)) {
      if (typeof fn === 'function') await fn();
    }
  },
});
