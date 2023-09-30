({
  // без этого api на фронте не будет иметь доступа к api.session
  // + не будет доступа к api.auth.provider на сервере
  access: 'public',
  method: async ({ test }) => {
    console.info({ test });
    return { status: 'ok' };
  },
});
