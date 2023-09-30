({
  // без этого api на фронте не будет иметь доступа к api.db
  method: async () => {
    return { status: 'ok' };
  },
});
