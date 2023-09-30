({
  access: 'public',
  method: async ({ path, args = [] }) => {
    try {
      const splittedPath = path.split('.');
      if (!splittedPath.includes('api')) throw new Error(`Method (path="${path}") not found`);

      let methodContainer = lib.utils.getDeep(domain, splittedPath);
      if (!methodContainer) methodContainer = lib.utils.getDeep(lib, splittedPath);

      const { method, access } = methodContainer || {};
      if (typeof method !== 'function') throw new Error(`Method (path="${path}") not found`);
      if (access !== 'public') throw new Error(`Method (path="${path}") not found`);
      if (!Array.isArray(args)) args = [args];
      return await method(context, ...args);
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
