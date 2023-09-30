({
  // access: 'public',
  method: async ({ path, args = [] }) => {
    try {
      const splittedPath = path.split('.');
      if (!splittedPath.includes('api')) throw new Error(`Method (path="${path}") not found`);

      let method = lib.utils.getDeep(domain, splittedPath);
      if (!method) method = lib.utils.getDeep(lib, splittedPath);

      if (typeof method !== 'function') throw new Error(`Method (path="${path}") not found`);
      if (!Array.isArray(args)) args = [args || {}];
      const result = await method(context, ...args);
      result.serverTime = Date.now();
      return result;
    } catch (err) {
      console.log(err);
      context.client.emit('action/emit', {
        eventName: 'alert',
        data: { message: err.message, stack: err.stack },
      });
      return err;
    }
  },
});
