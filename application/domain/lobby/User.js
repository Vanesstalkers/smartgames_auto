(class DomainLobbyUser extends domain.game.User {
  async enterLobby({ sessionId, lobbyId }) {
    const smartgamesLobby = await db.redis.get('smartgamesPortalLobby', { json: true });

    await lib.store.broadcaster.publishAction.call(this, smartgamesLobby.channelName, 'gameLobbyUserEnter', {
      sessionId,
      userId: this.id(),
      name: this.name,
      tgUsername: this.tgUsername,
      broadcastableFields: this.broadcastableFields(),
    });

    await super.enterLobby({ sessionId, lobbyId });
  }
});
