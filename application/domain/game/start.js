async () => {
  const gameTypes = domain.game.configs.games();
  const filledGames = {};
  for (const [gameType, typeData] of Object.entries(gameTypes)) {
    const { items, itemsDefault = {}, ...typeInfo } = typeData;
    filledGames[gameType] = typeInfo;
    filledGames[gameType].items = {};
    for (const [gameConfig, configData] of Object.entries(items)) {
      filledGames[gameType].items[gameConfig] = Object.assign({}, itemsDefault, configData);
    }
  }
  domain.game.configs.filledGames = filledGames;

  if (application.worker.id === 'W1') {
    db.redis.handlers.afterStart(async () => {
      async function connectToLobby() {
        const lobbyData = await db.redis.get('lobbyData', { json: true });
        if (lobbyData) {
          const { channelName } = lobbyData;
          const gameTypes = domain.game.configs.filledGames;
          const games = {};

          for (const [gameType, typeData] of Object.entries(gameTypes)) {
            const { items, itemsDefault = {}, ...typeInfo } = typeData;

            games[gameType] = typeInfo;
            games[gameType].items = {};
            games[gameType].playerCount = [];

            for (const [gameConfig, configData] of Object.entries(items)) {
              const { title, playerList } = configData;

              if (!games[gameType].playerCount.includes(playerList.length))
                games[gameType].playerCount.push(playerList.length);
              games[gameType].items[gameConfig] = {
                title,
                playerCount: playerList.length,
              };
            }
          }
          
          lib.store.broadcaster.publishAction(channelName, 'gameServerConnected', {
            code: 'release',
            title: 'Релиз',
            icon: ['fas', 'microchip'],
            active: true,
            url:
              process.env.NODE_ENV === 'development'
                ? /* 'http://192.168.1.37:8082' */ 'http://192.168.43.128:8082' /* 'http://localhost:8082' */
                : 'https://smartgames.studio/release',
            games,
          });
          return;
        }
        setTimeout(async () => {
          await connectToLobby();
        }, 2000);
      }
      await connectToLobby();
    });
  }
};
