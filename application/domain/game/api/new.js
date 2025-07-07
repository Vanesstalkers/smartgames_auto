async (context, { deckType, gameType, gameConfig, gameTimer, teamsCount, playerCount, maxPlayersInGame, gameRoundLimit }) => {

  lib.game.flush.exec();

  const { sessionId, userId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const user = session.user();
  const { lobbyId } = session;

  const gameClassGetter = gameType === 'corporate' ? domain.game.corporate.classSuper : domain.game.class;
  const game = await new gameClassGetter().create({
    ...{ deckType, gameType, gameConfig, gameTimer },
    ...{ teamsCount, playerCount, maxPlayersInGame, gameRoundLimit },
  });
  const gameId = game.id();

  for (const session of user.sessions()) {
    // на случай повторного вызова api до обработки playerJoin
    // (session.saveChanges будет выполнен в user.joinGame)
    session.set({ gameId });
  }

  const publishData = { userId, userName: user.getName() }; // userName нужно для логов
  lib.store.broadcaster.publishAction.call(session, `game-${gameId}`, 'playerJoin', publishData);

  lib.store.broadcaster.publishAction.call(session, `lobby-${lobbyId}`, 'addGame', {
    gameId,
    creator: { userId: user.id(), tgUsername: user.tgUsername },
    ...{ deckType, gameType, gameConfig, gameTimer, gameRoundLimit, playerMap: game.playerMap },
  });

  return { status: 'ok', gameId };
};
