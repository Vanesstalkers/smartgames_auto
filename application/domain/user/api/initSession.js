({
  access: 'public',
  method: async (context, { token, windowTabId, userId, lobbyId }) => {
    const userClass = domain.user.class();
    const user = new userClass();
    await user.load({ fromDB: { id: userId } }).catch((err) => {
      throw err;
    });

    const sessionClass = domain.user.session();
    let session = new sessionClass({ client: context.client });
    await session
      .load({
        fromDB: { query: { token, windowTabId } },
      })
      .catch(async (err) => {
        session = await new sessionClass({ client: context.client }).create({
          userId,
          token,
          windowTabId,
        });
      });

    user.subscribe(`user-${userId}`); // user в лобби

    const sessionId = session.id();
    session.set({ lobbyId });

    // createSession
    const sessionData = { sessionId, userId, lobbyId };
    // сессия metacom
    context.client.startSession(token, sessionData); // данные попадут в context (в следующих вызовах)

    // const { ip } = context.client;
    // // сессия impress (нужна для локального хранения context.session.state.gameId = '')
    // await api.auth.provider.createSession(token, sessionData, { ip });
    // ! после включения для работы нужно добавить auth.1/dummy.js

    session.onClose = [];
    // !!!! возможно нужно будет перенести в lib.user.api.initSession
    context.client.addListener('close', async () => {
      if (session.onClose.length) for (const f of session.onClose) await f();

      const user = session.user();
      if (user) {
        user.unsubscribe(`user-${user.id()}`);
        user.unlinkSession(session);
      }

      // удаляем из store и broadcaster
      session.remove();
      if (user && !user.sessions().length) user.remove();

      console.log(`session disconnected (token=${session.token}, windowTabId=${windowTabId}`);
    });

    return {};
  },
});
