({
  // access: 'public',
  method: async ({ path, args = [] }) => {
    try {
      const splittedPath = new Set(path.split('.'));
      if (!splittedPath.has('api')) throw new Error(`Method (path="${path}") not found`);

      let method = lib.utils.getDeep(domain, [...splittedPath]);
      if (!method) {
        splittedPath.delete('poker');
        method = lib.utils.getDeep(domain, [...splittedPath]);
      }
      if (!method) method = lib.utils.getDeep(lib, [...splittedPath]);

      if (typeof method !== 'function') throw new Error(`Method (path="${path}") not found`);
      if (!Array.isArray(args)) args = [args || {}];
      const result = await method(context, ...args);
      result.serverTime = Date.now();
      return result;
    } catch (err) {
      console.error(err);
      try {
        context.client.emit('action/emit', {
          eventName: 'alert',
          data: { message: err.message, stack: err.stack },
        });
      } catch (transportError) {
        if (
          // !!! заменить на МР c getTransportType() в https://github.com/metarhia
          transportError.message.includes('http transport')
        ) {
          try {
            context.client.send({
              eventName: 'alert',
              data: { message: err.message || err, stack: err.stack },
            });
          } catch (transportError) {
            console.error(transportError);
            throw transportError;
          }
        } else {
          console.error(transportError);
          throw transportError;
        }
      }
    }
  },
});
