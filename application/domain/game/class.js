(class Game extends lib.game.class() {
  constructor() {
    super(...arguments);
    Object.assign(this, {
      ...lib.chat['@class'].decorate(),
      ...lib.game.decorators['@hasDeck'].decorate(),
    });

    this.defaultClasses({
      Player: domain.game._objects.Player,
      Deck: domain.game._objects.Deck,
      Card: domain.game._objects.Card,
    });
  }

  getFullPrice() {
    const baseSum = 1000;
    const timerMod = 30000 / this.gameTimer;
    const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[this.gameConfig];
    return Math.floor(baseSum * timerMod * configMod);
  }
  stepLabel(label) {
    return `Раунд ${this.round} (${label})`;
  }

  removeTableCards() {
    const tableDecks = this.select({ className: 'Deck', attr: { placement: 'table' } });
    for (const deck of tableDecks) {
      deck.moveAllItems({ toDrop: true, setData: { visible: false } });
    }
  }

  restorePlayersHands() {
    const { roundStepWinner } = this.rounds[this.round];
    for (const player of this.players()) {
      if (player === roundStepWinner) continue; // карты победителя сбрасываются
      player.returnTableCardsToHand();
    }
  }
  calcClientMoney() {
    const { clientCard, featureCard, creditCard, clientCardNew } = this.rounds[this.round];
    let clientMoney = clientCardNew?.money || clientCard.money;

    if (featureCard.money && featureCard.target === 'client') {
      clientMoney += parseInt(featureCard.money);
    }
    clientMoney *= Math.floor(1000 / parseInt(creditCard.pv)) / 10; // точность до 1 знака после запятой

    return clientMoney;
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
  selectBestOffer(offersMap) {
    const { clientCard, clientMoney, featureCard } = this.rounds[this.round];
    const offers = [];

    const { stars, priceGroup } = clientCard;

    for (const { player, carCard, serviceCards } of Object.values(offersMap)) {
      let offer;
      try {
        offer = this.calcOffer({ player, carCard, serviceCards, featureCard });
        offer.carCard = carCard;
        offer.serviceCards = serviceCards;
      } catch (err) {
        if (err === 'no_car') continue;
        else throw err;
      }

      if (
        offer.fullPrice <= clientMoney &&
        offer.stars >= stars &&
        (priceGroup === '*' || offer.priceGroup.find((group) => priceGroup.includes(group)))
      ) {
        offers.push(offer);
      }
    }

    const bestOffer = { price: clientMoney, stars: 0 };
    for (const { player, ...offer } of offers) {
      if (bestOffer.stars < offer.stars || (bestOffer.stars == offer.stars && bestOffer.price > offer.fullPrice)) {
        bestOffer.carCard = offer.carCard;
        bestOffer.serviceCards = offer.serviceCards;
        bestOffer.price = offer.fullPrice;
        bestOffer.player = player;
        bestOffer.stars = offer.stars;
      }
    }
    return { bestOffer, relevantOffers: offers};
  }

  showTableCards() {
    const { creditCard, featureCard } = this.rounds[this.round];
    const { zone_credit: creditZone, zone_feature: featureZone } = this.decks;

    creditZone.setItemVisible(creditCard);
    featureZone.setItemVisible(featureCard);

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
    const { roundStepWinner } = this.rounds[this.round];
    for (const player of this.players()) {
      if (player === roundStepWinner) continue; // карты победителя сбрасываются
      player.returnTableCardsToHand();
    }
  }
  createClientDealDeck() {
    const { clientCard } = this.rounds[this.round];
    const { feature: featureDeck, credit: creditDeck } = this.decks;
    const clientDealDeck = this.addDeck(
      { type: 'card', subtype: 'deal', placement: 'table' },
      { parentDirectLink: false }
    );

    // порядок добавления влияет на визуализацию
    featureDeck.getRandomItem().moveToTarget(clientDealDeck);
    creditDeck.getRandomItem().moveToTarget(clientDealDeck);
    clientCard.moveToTarget(clientDealDeck);
    clientCard.set({ visible: true, eventData: { playDisabled: true } });

    return clientDealDeck;
  }
});
