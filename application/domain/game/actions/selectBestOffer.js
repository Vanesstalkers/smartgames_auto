(function ({ clientCard, clientMoney, featureCard, offersMap }) {
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
});
