async (context, { deckType, gameType, gameConfig, gameTimer, creator }) => {
  const { sessionId, userId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const user = session.user();
  const { lobbyId } = session;

  if (!lobbyId) throw new Error('lobby not found'); // этой ошибки быть не должно - оставил проверку для отладки

  if (gameTimer) {
    gameTimer = {
      DEFAULT: gameTimer,
      SECOND_OFFER: Math.ceil(gameTimer / 2),
      PRESENT: Math.ceil(gameTimer / 3),
      SHOW_RESULTS: Math.max(5, Math.ceil(gameTimer / 5)),
      CARD_DROP: Math.max(5, Math.ceil(gameTimer / 5)),
    };
  }
  const game = await new domain.game.class().create({ deckType, gameType, gameConfig, gameTimer });
  const gameId = game.id();

  for (const session of user.sessions()) {
    // на случай повторного вызова api до обработки playerJoin
    // (session.saveChanges будет выполнен в user.joinGame)
    session.set({ gameId });
  }
  lib.store.broadcaster.publishAction(`game-${gameId}`, 'playerJoin', creator);

  lib.store.broadcaster.publishAction(`lobby-${lobbyId}`, 'addGame', {
    creator,
    gameId,
    ...{ deckType, gameType, gameConfig, gameTimer, playerMap: game.playerMap },
  });

  return { status: 'ok', gameId };
};
