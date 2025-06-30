let path;
if (simpleGame) {
  //
  if (initGame) {
    //
    if (newGame) {
      {
        // $iframe.contentWindow.postMessage({ path: 'game.api.new', args }, '*');
        import('./../../lobby/application/domain/lobby/front/components/games.vue'); // USER`S ACTION (method.addGame)

        // const game = await new domain.game.class.create();
        // -->> this.run('initPlayerWaitEvents');
        /*---*/ import('./lib/game/class.js'); // Game.create
        // lib.store.broadcaster.publishAction(`game-${gameId}`, 'playerJoin', {...});
        import('./domain/game/api/new.js'); // api.new
      }
    } else if (joinGame) {
      {
        // $iframe.contentWindow.postMessage({ path: 'game.api.join', args }, '*');
        import('./../../lobby/application/domain/lobby/front/components/games.vue'); // USER`S ACTION (method.joinGame)

        // lib.store.broadcaster.publishAction(`game-${gameId}`, viewerMode ? 'viewerJoin' : 'playerJoin', {...});
        import('./lib/game/api/join.js'); // api.join
      }
    } else if (restoreGame) {
      {
        // await api.action.call({ path: 'lobby.api.enter', args: [{ lobbyId }], })
        import('./../../lobby/application/domain/lobby/front/Lobby.vue'); // USER`S ACTION (open lobby page)

        // session.emit('restoreGame', { deckType, gameType, gameId, needLoadGame: isAlive ? true : false });
        import('./../../lobby/application/domain/lobby/api/enter.js'); // api.enter

        // $iframe.contentWindow.postMessage({ path: 'game.api.restore', args }, '*');
        import('./../../lobby/application/domain/lobby/front/Lobby.vue'); // state.emit.restoreGame

        /*
          if (needLoadGame) {
            await new domain.game.class({ id: gameId }).load({ fromDB: { id: gameId, () => {
              game.run('fillGameData', loadedData);
            }, fromDump: true } })
            game.restorationMode = true;
            game.run('initPlayerWaitEvents');
            for (const player of game.players()) player.set({ ready: false });
            if (viewerId) await game.viewerJoin(joinData) else await game.playerJoin(joinData);

            return;
          }

          if (restorationMode) {
            if (viewerId) await game.viewerJoin(joinData) else await game.playerJoin(joinData);
            return;
          }

          // сообщаем игре игроку о возврате в игру после обновления страницы в браузере
          await user.joinGame({ gameId, playerId, viewerId, deckType, gameType });
        */
        import('./domain/game/api/restore.js'); // api.restore
      }
    }

    import('./lib/game/class.js'); // Game.playerJoin

    /*
      if (game.getFreePlayerSlot()) return { preventListenerRemove: true };
      game.run('initPrepareGameEvents');
    */
    import('./domain/game/actions/initPlayerWaitEvents.js'); // handlers.PLAYER_JOIN

    /* 
      if (restorationMode) return game.run('startGame');

      game.run('putStartPlanes');

      if (planesToBePlacedByPlayers > 0) {
        game.set({ statusLabel: 'Подготовка к игре', status: 'PREPARE_START' });
        game.selectNextActivePlayer().activate();
        lib.timers.timerRestart(game, { time: timeToPlaceStartPlane });
      }
      game.run('startGame');
    */
    import('./domain/game/actions/initPrepareGameEvents.js'); // init
    waitForPlayerAddPlaneAction();

    /* 
      if (!this.restorationMode) {  
        deck.moveRandomItems({ count: this.settings.playerHandStart, target: playerHand });
      }
      this.run('lib.startGame');
    */
    import('./domain/game/actions/startGame.js'); // action.startGame

    /* 
      this.run('initGameProcessEvents');
      this.set({ status: 'IN_PROCESS' });
      this.run('startNewRound');
    */
    import('./lib/game/actions/startGame.js'); // action.startGame
  } else if (newRound) {
    if (userAction) {
      // await this.handleGameApi({ name: 'updateRoundStep' });
      import('./domain/game/front/components/cardWorker.vue'); // USER`S ACTION
    } else if (timerEnd) {
      // game.run('updateRoundStep', { timerOverdue: true });
      import('./lib/game/events/common/gameProcess.js'); // initPrepareGameEvents.event.handlers.PLAYER_TIMER_END
    }
    /*
      if (this.status === 'PREPARE_START') {
        this.toggleEventHandlers('END_ROUND', {}, initPlayer);
        return;
      }

      this.run('lib.updateRoundStep', { timerOverdue });
    */
    import('./domain/game/actions/updateRoundStep.js'); // domain.action.updateRoundStep
    /*
      if (activePlayer) this.toggleEventHandlers('END_ROUND', {}, activePlayer);
      this.dumpState();
      this.run('startNewRound');
    */
    import('./lib/game/actions/updateRoundStep.js'); // lib.action.updateRoundStep
  }

  /*
    this.roundActivePlayer()?.deactivate();
    const { newRoundLogEvents, statusLabel, newRoundNumber } = roundStepsFunc.call(this);
    this.set({ statusLabel: statusLabel || `Раунд ${newRoundNumber}`, round: newRoundNumber });
  */
  import('./lib/game/actions/startNewRound.js'); // lib.action.startNewRound

  /*
    this.selectNextActivePlayer();
    lib.timers.timerRestart(this, timerConfig);
    const card = this.run('smartMoveRandomCard', playerCardHand);
    newRoundLogEvents.push(`Активировано ежедневное событие "${card.title}".`);
  */
  import('./domain/game/actions/roundSteps.js'); // domain.action.roundSteps
} else if (corporateGame) {
  //
  if (initGame) {
    if (newGame) {
      // $iframe.contentWindow.postMessage({ path: 'game.api.new', args }, '*');
      import('./../../lobby/application/domain/lobby/front/components/games.vue'); // USER`S ACTION (method.addGame)

      /* const game = await new domain.game.corporate.classSuper.create();
       -->> await super.create({ deckType, gameType, gameConfig, gameTimer }, { initPlayerWaitEvents: false });
            for (let _code = 1; _code <= playerCount; _code++) this.run('addPlayer', {});
            this.run('initPlayerWaitEvents');
            for (let _code = 1; _code <= Math.ceil(playerCount / maxPlayersInGame.val); _code++) {
              const game = await new domain.game.corporate.classGame({}}).create({ teamCode: _code, ... }, { initPlayerWaitEvents: false });
              const players = fullPlayersList.splice(0, maxPlayersInGame.val);
              for (const player of players) player.game(game);
            }*/
      /*---*/ import('./domain/game/corporate/classSuper.js'); // Game.create
      // lib.store.broadcaster.publishAction(`game-${gameId}`, 'playerJoin', {...});
      import('./domain/game/api/new.js'); // api.new
    } else if (joinGame) {
      {
        // $iframe.contentWindow.postMessage({ path: 'game.api.join', args }, '*');
        import('./../../lobby/application/domain/lobby/front/components/games.vue'); // USER`S ACTION (method.joinGame)

        // lib.store.broadcaster.publishAction(`game-${gameId}`, viewerMode ? 'viewerJoin' : 'playerJoin', {...});
        import('./lib/game/api/join.js'); // api.join
      }
    } else if (restoreGame) {
      {
        // await api.action.call({ path: 'lobby.api.enter', args: [{ lobbyId }], })
        import('./../../lobby/application/domain/lobby/front/Lobby.vue'); // USER`S ACTION (open lobby page)

        // session.emit('restoreGame', { deckType, gameType, gameId, needLoadGame: isAlive ? true : false });
        import('./../../lobby/application/domain/lobby/api/enter.js'); // api.enter

        // $iframe.contentWindow.postMessage({ path: 'game.api.restore', args }, '*');
        import('./../../lobby/application/domain/lobby/front/Lobby.vue'); // state.emit.restoreGame

        /*
          if (needLoadGame) {
            await new domain.game.corporate.classSuper({ id: gameId }).load({ fromDB: { id: gameId, () => {
              corporateGame.set({ gamesMap: loadedData.gamesMap });
              corporateGame.run('fillGameData', loadedData);
              for (const gameId of Object.keys(loadedData.gamesMap)) {
                const game = await new domain.game.corporate.classGame({...}).load({...});
                game.restorationMode = true;
                game.run('fillGameData', gameData);
              }
            }, fromDump: true } })
            
            game.restorationMode = true;
            game.run('initPlayerWaitEvents');
            for (const player of game.players()) player.set({ ready: false });
            if (viewerId) await game.viewerJoin(joinData) else await game.playerJoin(joinData);
            return;
          }

          if (restorationMode) {
            if (viewerId) await game.viewerJoin(joinData) else await game.playerJoin(joinData);
            return;
          }

          // сообщаем игре игроку о возврате в игру после обновления страницы в браузере
          await user.joinGame({ gameId, playerId, viewerId, deckType, gameType });
        */
        import('./domain/game/api/restore.js'); // api.restore
      }
    }

    /*
      const player = this.restorationMode
        ? this.players().find((player) => player.userId === userId)
        : this.getFreePlayerSlot();
      
      this.set({ gamesMap: {players: {[playerId]: userId} } });
      this.toggleEventHandlers('PLAYER_JOIN', { targetId: playerId }, player);
    */
    import('./domain/game/corporate/classSuper.js'); // CorporateSuperGame.playerJoin

    /*
        if (game.getFreePlayerSlot()) return { preventListenerRemove: true };
        game.run('initPrepareGameEvents');
      */
    import('./domain/game/corporate/actions/initPlayerWaitEvents.js'); // handlers.PLAYER_JOIN

    /*
        if (!restorationMode) game.run('putStartPlanes');

        game.set({ statusLabel: 'Подготовка к игре', status: 'PREPARE_START' });
        for (const childGame of game.getAllGames()) {
          childGame.run('domain.initPrepareGameEvents');
        }
      */
    import('./domain/game/corporate/actions/initPrepareGameEvents.js'); // init

    /*
        if (restorationMode) return game.run('startGame');
        
        game.run('putStartPlanes');
        if (planesToBePlacedByPlayers > 0) {
          game.set({ statusLabel: 'Подготовка к игре', status: 'PREPARE_START' });
          game.selectNextActivePlayer().activate();
          lib.timers.timerRestart(game, { time: timeToPlaceStartPlane });
        }
        return game.run('startGame');
      */
    import('./domain/game/actions/initPrepareGameEvents.js'); // init
    waitForPlayerAddPlaneAction();

    /* 
        this.set({ roundReady: true });
        if (!corporateGame.allGamesRoundReady()) return;

        for (const childGame of corporateGame.getAllGames()) {
          childGame.run('domain.startGame');
        }
        corporateGame.run('lib.startGame'); 
      */
    import('./domain/game/corporate/actions/startGame.js'); // domain.corporate.action.startGame

    /*
        if (!this.restorationMode) {
          deck.moveRandomItems({ count: this.settings.playerHandStart, target: playerHand });
        }
        this.run('lib.startGame');
      */
    import('./domain/game/actions/startGame.js'); // action.startGame

    /*
        this.set({ status: 'IN_PROCESS' });
        this.run('initGameProcessEvents');
        this.run('startNewRound');
      */
    import('./lib/game/actions/startGame.js'); // action.startGame
  } else if (newRound) {
    if (userAction) {
      // await this.handleGameApi({ name: 'updateRoundStep' });
      import('./domain/game/front/components/cardWorker.vue'); // USER`S ACTION
    } else if (timerEnd) {
      // game.run('updateRoundStep', { timerOverdue: true });
      import('./lib/game/events/common/gameProcess.js'); // initPrepareGameEvents.event.handlers.PLAYER_TIMER_END
    }
    /*
      if (this.status === 'PREPARE_START') {
        if (initPlayer) this.toggleEventHandlers('END_ROUND', {}, initPlayer);
        return;
      }

      // осознанно дублируется логика из startNewRound (ради roundReady)
      initPlayer.deactivate();
      if (this.checkAllPlayersFinishRound()) this.set({ roundReady: true });

      const corporateGame = this.game();
      if (!corporateGame.allGamesRoundReady()) return;

      for (const game of corporateGame.getAllGames()) {
        game.run('domain.updateRoundStep'); */
        /* -->> if (this.status === 'PREPARE_START') {
                  const initPlayer = this.roundActivePlayer();
                  this.toggleEventHandlers('END_ROUND', {}, initPlayer);
                  return;
                }
                this.run('lib.updateRoundStep', { timerOverdue }); */
                /* -->> if (activePlayer) this.toggleEventHandlers('END_ROUND', {}, activePlayer);
                        this.dumpState();
                        this.run('startNewRound');*/
                        // -->> if (!this.isCoreGame()) return;
        /*-------------------*/ import('./domain/game/corporate/actions/startNewRound.js'); // lib.action.startNewRound
        /*-----------*/ import('./lib/game/actions/updateRoundStep.js'); // lib.action.updateRoundStep
        /*---*/ import('./domain/game/actions/updateRoundStep.js'); // domain.action.updateRoundStep
      /*}
      // в corporateGame нужна особая логика работы с активным игроком/командой
      corporateGame.run('domain.updateRoundStep');
    */
    import('./domain/game/corporate/actions/updateRoundStep.js'); // domain.corporate.action.updateRoundStep

    /*
      if (this.status === 'PREPARE_START') {
        this.toggleEventHandlers('END_ROUND', {}, initPlayer);
        return;
      }

      this.run('lib.updateRoundStep', { timerOverdue });
    */
    import('./domain/game/actions/updateRoundStep.js'); // domain.action.updateRoundStep

    /*
      if (activePlayer) this.toggleEventHandlers('END_ROUND', {}, activePlayer);
      this.dumpState();
      this.run('startNewRound');
    */
    import('./lib/game/actions/updateRoundStep.js'); // lib.action.updateRoundStep
  }

  /*
    if (!this.isCoreGame()) return;

    this.run('domain.startNewRound');

    for (const game of this.getAllGames()) {
      game.run('domain.startNewRound');
      game.set({ roundReady: false }); // активируем действия пользователя на фронте
    }
  */
  import('./domain/game/corporate/actions/startNewRound.js'); // lib.action.startNewRound

  /*
    this.roundActivePlayer()?.deactivate();
    const { newRoundLogEvents, statusLabel, newRoundNumber } = roundStepsFunc.call(this);
    this.set({ statusLabel: statusLabel || `Раунд ${newRoundNumber}`, round: newRoundNumber });
  */
  import('./lib/game/actions/startNewRound.js'); // lib.action.startNewRound

  /*
    this.selectNextActivePlayer();
    lib.timers.timerRestart(this, timerConfig);
    const card = this.run('smartMoveRandomCard', playerCardHand);
    newRoundLogEvents.push(`Активировано ежедневное событие "${card.title}".`);
  */
  import('./domain.game.actions.roundSteps.js'); // domain.action.roundSteps
}

function waitForPlayerAddPlaneAction() {
  new Promise(() => {
    if (putPlane) {
      {
        // sendApiData: {path: 'game.api.action', args: [{ name: 'putPlaneOnField' }]}
        import('./domain/game/front/Game.vue'); // USER`S ACTION
        // joinPlane.moveToTarget(targetTable);
        import('./domain/game/actions/putPlaneOnField.js'); // action.putPlaneOnField
        // if (target.afterAddItem) target.afterAddItem(this);
        import('./domain/game/_objects/Plane.js'); // Plane.moveToTarget
        // game.toggleEventHandlers('ADD_PLANE', { targetId: item.id() });
        import('./domain/game/_objects/Table.js'); // Table.afterAddItem
        /*
            if (!gamePlaneReady) {
              game.roundActivePlayer().deactivate();
              nextPlayer.activate();
              lib.timers.timerRestart(game, { time: game.settings.timeToPlaceStartPlane });
            }
            game.run('startGame');
          */
        import('./domain/game/actions/initPrepareGameEvents.js'); // initPrepareGameEvents.event.handlers.ADD_PLANE
      }
    } else if (endRoundButtonClick) {
      {
        // await this.handleGameApi({ name: 'updateRoundStep' });
        import('./domain/game/front/components/cardWorker.vue'); // USER`S ACTION
        // this.toggleEventHandlers('END_ROUND', {}, initPlayer);
        import('./domain/game/actions/updateRoundStep.js'); // domain.action.updateRoundStep
        function processPutPlaneAction() {
          import('./domain/game/actions/initPrepareGameEvents.js'); // initPrepareGameEvents.event.handlers.END_ROUND
          import('./domain/game/events/common/putPlaneFromHand.js'); // event.handlers.CHECK_PLANES_IN_HANDS
          import('./domain/game/actions/putPlaneOnField.js'); // action.putPlaneOnField
          // game.toggleEventHandlers('ADD_PLANE', { targetId: item.id() });
          import('./domain/game/_objects/Table.js'); // Table.afterAddItem
        }
        processPutPlaneAction();
      }
    } else if (actionType == 'timerEnd') {
      // this.emit('END_ROUND');
      import('./domain/game/actions/initPrepareGameEvents.js');
      processPutPlaneAction();
    }
  });
}
