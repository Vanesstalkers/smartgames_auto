(class PokerGame extends domain.game.class {
  constructor() {
    super(...arguments);
  }

  broadcastDataBeforeHandler(data, config = {}) {
    super.broadcastDataBeforeHandler(data, config);
    if (data.rounds) {
      data.roundData = data.rounds[data.round]; // ???
      delete data.rounds;
    }
  }

  restart() {
    this.set({ status: 'IN_PROCESS', statusLabel: `Раунд ${this.round}`, restorationMode: null });
    this.run('initGameProcessEvents');

    if (this.gameConfig === 'competition') {
      for (const game of this.getAllGames()) {
        game.set({ status: 'IN_PROCESS', statusLabel: `Раунд ${game.round}`, roundReady: true });
        game.run('initGameProcessEvents'); // из "лишних" событий ADD_PLANE отключится при первом же вызове
      }

      const games = this.roundPool.current({ fixState: true }); // в конце раунда будет вызов с loadFixedState
      for (const game of games) {
        lib.timers.timerRestart(game, game.lastRoundTimerConfig);
        game.playRoundStartCards({ enabled: true });
        game.set({ roundReady: false });
      }

      return;
    }

    const allGamesMerged = this.allGamesMerged();
    const roundActiveGame = allGamesMerged ? this.roundActiveGame() : null;

    const games = this.getAllGames();
    for (const game of games) {
      game.set({ status: 'IN_PROCESS', statusLabel: `Раунд ${game.round}` });
      game.run('initGameProcessEvents'); // из "лишних" событий ADD_PLANE отключится при первом же вызове

      if (roundActiveGame && game !== roundActiveGame && !game.disabled) continue;

      lib.timers.timerRestart(game, game.lastRoundTimerConfig);

      if (!allGamesMerged) game.playRoundStartCards({ enabled: true });
    }

    if (allGamesMerged) this.playRoundStartCards(); // у superGame нет кастомного метода playRoundStartCards, так что можно не укаызвать { enabled: true }
  }

  getFreePlayerSlot() {
    const playerCount = this.players().length;
    if (this.maxPlayersInGame && playerCount >= this.maxPlayersInGame) return null;

    const player = this.run('addPlayer', {
      ...lib.utils.structuredClone(this.settings.playerTemplates['default']),
      _code: playerCount + 1,
    });

    return player;
  }

  async playerJoin({ userId, userName }) {
    try {
      if (this.status === 'FINISHED') throw new Error('Игра уже завершена');

      const restoredPlayer = this.getPlayerByUserId(userId);
      const player = restoredPlayer || this.getFreePlayerSlot();
      if (!player) throw new Error('Свободных мест не осталось');

      const gameId = this.id();
      const playerId = player.id();

      player.set({ userId, userName });
      lib.store.broadcaster.publishAction.call(this, `gameuser-${userId}`, 'joinGame', {
        gameId,
        playerId,
        deckType: this.deckType,
        gameType: this.gameType,
      });

      this.logs({ msg: `Игрок {{player}} присоединился к игре.`, userId });

      // инициатором события был установлен первый player в списке, который совпадает с активным игроком на старте игры
      this.toggleEventHandlers('PLAYER_JOIN', { targetId: playerId }, player);

      await this.saveChanges();
    } catch (exception) {
      console.error(exception);
      lib.store.broadcaster.publishAction.call(this, `user-${userId}`, 'broadcastToSessions', {
        data: { message: exception.message, stack: exception.stack },
      });
      lib.store.broadcaster.publishAction.call(this, `gameuser-${userId}`, 'logout'); // инициирует hideGameIframe
    }
  }

  async playerLeave({ userId, viewerId }) {
    if (this.status !== 'FINISHED' && !viewerId) {
      this.logs({ msg: `Игрок {{player}} вышел из игры.`, userId });
      try {
        const player = this.getPlayerByUserId(userId);
        this.run('processPlayerLeave', {}, player);

        await this.saveChanges();
      } catch (exception) {
        if (exception instanceof lib.game.endGameException) {
          await this.removeGame();
        } else throw exception;
      }
    }
    lib.store.broadcaster.publishAction.call(this, `gameuser-${userId}`, 'leaveGame', {});
  }

  run(actionPath, data, initPlayer) {
    const [actionName, actionDir] = actionPath.split('.').reverse();

    let action;
    if (actionDir) {
      if (actionDir === 'domain') action = domain.game.actions?.[actionName];
      if (!action) action = lib.game.actions?.[actionName];
    } else {
      action = domain.game.poker.actions?.[actionName];
      if (!action) action = domain.game.actions?.[actionName];
      if (!action) action = lib.game.actions?.[actionName];
    }

    if (!action) throw new Error(`action "${actionName}" not found`);

    return action.call(this, data, initPlayer);
  }
});
