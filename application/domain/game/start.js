async () => {
  {
    const files = await node.fsp.readdir('./application/static/img/cards', { withFileTypes: true });
    const cardTemplates = Object.values(files).map((_) => _.name);
    domain.game.configs.cardTemplates = cardTemplates;
    domain.game.configs.cardTemplates.random = ({ exclude = [] } = {}) => {
      const templates = cardTemplates.filter((_) => !exclude.includes(_));
      return templates[Math.floor(Math.random() * templates.length)];
    };
  }

  if (application.worker.id === 'W1') {
    db.redis.handlers.afterStart(async () => {
      async function connectToLobby() {
        const lobbyData = await db.redis.get('lobbyData', { json: true });
        if (lobbyData) {
          const { channelName } = lobbyData;
          const gameTypes = lib.game.actions.getFilledGamesConfigs();
          const games = {};

          for (const [gameType, typeData] of Object.entries(gameTypes)) {
            const { items, itemsDefault = {}, ...typeInfo } = typeData;

            games[gameType] = typeInfo;
            games[gameType].items = {};

            for (const [gameConfig, configData] of Object.entries(items)) {
              let { title, timer, teamsCount, playerCount, maxPlayersInGame, difficulty, style } = configData;
              games[gameType].items[gameConfig] = {
                ...{ title, timer, difficulty, style },
                ...{ teamsCount, playerCount, maxPlayersInGame },
              };
            }
          }

          const url = 'https://smartgames.studio/TO_CHANGE';
          lib.store.broadcaster.publishAction(channelName, 'gameServerConnected', {
            code: 'TO_CHANGE',
            title: 'TO_CHANGE',
            icon: ['fas', 'microchip'],
            active: true,
            url: process.env.NODE_ENV === 'development' ? 'http://localhost:TO_CHANGE' : url, // такой же как в package.json serve
            serverUrl:
              process.env.NODE_ENV === 'development' ? `http://localhost:${config.server.balancer}` : `${url}/api`,
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
