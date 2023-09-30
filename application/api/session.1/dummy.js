({
  // без этого api на фронте не будет иметь доступа к api.session
  method: async () => {
    return { status: 'ok' };
  },
});
