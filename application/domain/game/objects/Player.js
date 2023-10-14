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
  initEvent(eventName, { player } = {}) {
    super.initEvent(eventName, { player: this });
  }

  publishInfo(info = {}) {
    if (!info.text) return;

    lib.store.broadcaster.publishData(`gameuser-${this.userId}`, {
      helper: {
        text: info.text,
        pos: {
          desktop: 'top-left',
          mobile: 'top-left',
        },
        hideTime: info.hideTime || 3000,
      },
    });
  }

  activate({ setData, publishText } = {}) {
    this.set({ active: true, activeReady: false, eventData: { actionsDisabled: null } });
    if (setData) this.set(setData);
    if (publishText) this.publishInfo({ text: publishText, hideTime: 5000 });
  }
  returnCardsToHand() {
    const game = this.game();
    const playerCarHand = this.getObjectByCode('Deck[card_car]');
    const playerServiceHand = this.getObjectByCode('Deck[card_service]');

    const carDeck = this.getObjectByCode('Deck[card_car_played]');
    const [carCard] = carDeck.getObjects({ className: 'Card' });
    if (carCard) {
      game.removeAllEventListeners({ sourceId: carCard.id() });
      carCard.set({ visible: null, played: null, activeEvent: null });
      carCard.moveToTarget(playerCarHand);
    }

    const serviceDeck = this.getObjectByCode('Deck[card_service_played]');
    for (const card of serviceDeck.getObjects({ className: 'Card' })) {
      game.removeAllEventListeners({ sourceId: carCard.id() });
      card.set({ visible: null, played: null, activeEvent: null });
      card.moveToTarget(playerServiceHand);
    }
  }
});
