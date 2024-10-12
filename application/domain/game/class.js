(class Game extends lib.game.class() {
  constructor() {
    super();
    Object.assign(this, {
      ...lib.chat['@class'].decorate(),
      ...lib.game.decorators['@hasDeck'].decorate(),
    });

    this.defaultClasses({
      Player: domain.game['@objects'].Player,
      Deck: domain.game['@objects'].Deck,
      Card: domain.game['@objects'].Card,
    });
  }

  getFullPrice() {
    const baseSum = 1000; // TO_CHANGE (меняем на свою сумму дохода за игру)
    const timerMod = 30000 / this.gameTimer;
    const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[this.gameConfig];
    return Math.floor(baseSum * timerMod * configMod);
  }
  stepLabel(label) {
    return `Раунд ${this.round} (${label})`;
  }

  removeTableCards() {
    const cardDeckDrop = this.decks.drop;
    const tableDecks = this.getObjects({ className: 'Deck', attr: { placement: 'table' } });
    for (const deck of tableDecks) {
      deck.moveAllItems({
        target: cardDeckDrop,
        setData: { visible: false },
      });
    }
  }
  calcClientMoney() {
    const { clientCard, featureCard, creditCard } = this;
    let clientMoney = clientCard.money;
    if (featureCard.money && featureCard.target === 'client') {
      clientMoney += parseInt(featureCard.money);
    }
    clientMoney *= Math.floor(100 / parseInt(creditCard.pv));
    this.clientMoney = clientMoney;
  }
  calcOffer({ player, carCard, serviceCards, featureCard }) {
    if (!carCard) throw 'no_car';

    const offer = { player, carPrice: 0, stars: 0, priceMods: [], priceGroup: [], equip: [] };
    offer.carTitle = carCard.title;
    offer.carPrice = carCard.price;
    offer.stars = carCard.stars;
    offer.priceGroup.push(...carCard.priceGroup);
    offer.equip.push(...carCard.equip);
    if (featureCard.price) offer.priceMods.push(featureCard.price);

    for (const card of serviceCards) {
      const exclusiveEquip = !card.equip || !card.equip.find((equip) => offer.equip.includes(equip));
      if (!exclusiveEquip) continue;

      if (card.stars) offer.stars += card.stars;
      if (card.priceGroup) offer.priceGroup.push(...card.priceGroup);
      if (card.equip) offer.equip.push(...card.equip);
      offer.priceMods.push(card.price);
    }

    offer.fullPrice = offer.priceMods.reduce((price, mod) => {
      if (mod.at(-1) === '%') return price + offer.carPrice * (parseInt(mod) / 100);
      return price + parseInt(mod);
    }, offer.carPrice);

    return offer;
  }

  showTableCards() {
    this.decks.zone_credit.setItemVisible(this.creditCard);
    this.decks.zone_feature.setItemVisible(this.featureCard);

    for (const player of this.players()) {
      const tableZones = player.select('Deck').filter(({ placement }) => placement == 'table');
      for (const zone of tableZones) {
        for (const card of zone.select('Card')) {
          zone.setItemVisible(card);
        }
      }
    }
  }

  restorePlayersHands() {
    for (const player of this.players()) {
      if (player === this.roundStepWinner) continue; // карты победителя сбрасываются
      player.returnTableCardsToHand();
    }
  }
  createClientDealDeck() {
    const clientDealDeck = this.addDeck(
      { type: 'card', subtype: 'deal', placement: 'table' },
      { parentDirectLink: false }
    );

    // порядок добавления влияет на визуализацию
    this.decks.feature.getRandomItem().moveToTarget(clientDealDeck);
    this.decks.credit.getRandomItem().moveToTarget(clientDealDeck);
    this.clientCard.moveToTarget(clientDealDeck);
    this.clientCard.set({ visible: true, eventData: { playDisabled: true } });
    clientDealDeck.clientCard = this.clientCard;

    return clientDealDeck;
  }
});
