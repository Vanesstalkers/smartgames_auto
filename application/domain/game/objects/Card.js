(class Card extends lib.game.objects.Card {
  constructor(data, { parent }) {
    super(data, { parent });
    this.broadcastableFields(
      this.broadcastableFields().concat(
        // добавляем недостающие поля
        ['group', 'equip']
      )
    );

    this.set(data);
  }
});
