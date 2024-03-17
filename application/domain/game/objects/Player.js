(class Player extends lib.game.objects.Player {
  constructor(data, { parent }) {
    super(data, { parent });
    this.broadcastableFields(
      this.broadcastableFields().concat(
        //
        ['money']
      )
    );

    this.set({
      money: data.money || 0,
    });
  }
});
