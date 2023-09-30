() =>
  class ReleaseGameSession extends lib.game.sessionClass() {
    // TO_CHANGE (название класса)
    getUserClass() {
      return domain.user.class();
    }
  };
