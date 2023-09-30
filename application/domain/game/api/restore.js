async (context, { deckType, gameId }) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const user = session.user();
  if (user.gameId && user.gameId !== gameId) throw new Error('Уже подключен к другой игре');

  const { playerId, viewerId } = user;

  for (const session of user.sessions()) {
    session.set({ gameId, playerId, viewerId });
    await session.saveChanges();
    session.emit('joinGame', { deckType, gameId });
  }

  return { status: 'ok' };
};
