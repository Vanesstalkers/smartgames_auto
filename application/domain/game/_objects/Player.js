(class Player extends lib.game._objects.Player {
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

  getHandCards() {
    return [...this.decks.car.items(), ...this.decks.service.items()];
  }

  getAvailableOffers({ clientCard, featureCard, creditCard }) {
    const offersMap = {};

    const addOffer = (car, serviceCards) => {
      const offerKey = car.name + (serviceCards.length ? '+' + serviceCards.map((c) => c.name).join('+') : '');
      offersMap[offerKey] = { player: this, carCard: car, serviceCards };
    };

    const handCards = this.getHandCards();
    const starCards = new Map();
    const priceGroupCards = new Map();

    for (const service of handCards.filter((c) => c.subtype === 'service')) {
      if (service.stars > 0) starCards.set(service.name, service);

      if (clientCard.priceGroup === '*') continue;

      if (service.priceGroup?.some((group) => clientCard.priceGroup.includes(group)))
        priceGroupCards.set(service.name, service);
    }

    for (const car of handCards.filter((c) => c.subtype === 'car')) {
      let serviceCards = [];

      if (car.stars + starCards.size < clientCard.stars) continue;
      const carPriceGroup = car.priceGroup;
      const carEquip = car.equip;

      if (clientCard.priceGroup !== '*' && !car.priceGroup.some((group) => clientCard.priceGroup.includes(group))) {
        const cards = [...priceGroupCards.values()];
        if (cards.length === 0) continue;

        const matchingServiceCard = cards
          .filter((card) => !card.priceGroup.some((group) => carPriceGroup.includes(group)))
          .filter((card) => !card.equip || !card.equip.some((equip) => carEquip.includes(equip)))
          .sort((a, b) => {
            const aPrice = a.price.at(-1) === '%' ? (a.price.slice(0, -1) * car.price) / 100 : parseInt(a.price);
            const bPrice = b.price.at(-1) === '%' ? (b.price.slice(0, -1) * car.price) / 100 : parseInt(b.price);
            return aPrice - bPrice;
          })[0];
        if (!matchingServiceCard) continue;

        serviceCards.push(matchingServiceCard);
      }

      if (starCards.size > 0) {
        const cards = [...starCards.values()];
        if (car.stars + cards.length < clientCard.stars) continue;

        const matchingStarCards = cards
          .filter((card) => !card.equip || !card.equip.some((equip) => carEquip.includes(equip)))
          .sort((a, b) => {
            const aPrice = a.price.at(-1) === '%' ? (a.price.slice(0, -1) * car.price) / 100 : parseInt(a.price);
            const bPrice = b.price.at(-1) === '%' ? (b.price.slice(0, -1) * car.price) / 100 : parseInt(b.price);
            return aPrice - bPrice;
          });
        const needStars = clientCard.stars - car.stars;
        if (!matchingStarCards || matchingStarCards.length < needStars) continue;

        for (let i = needStars + 1; i <= matchingStarCards.length; i++) {
          addOffer(car, serviceCards.concat(matchingStarCards.slice(0, i)));
        }

        serviceCards.push(...matchingStarCards.slice(0, needStars));
      }

      addOffer(car, serviceCards);
    }

    return offersMap;
  }
});
