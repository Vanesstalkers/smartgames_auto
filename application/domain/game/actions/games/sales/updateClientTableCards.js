(function () {
  this.clientCard = this.decks.client.getRandomItem();
  this.clientCard.moveToTarget(this.decks.zone_client);
  this.featureCard = this.decks.feature.getRandomItem();
  this.featureCard.moveToTarget(this.decks.zone_feature);
  this.creditCard = this.decks.credit.smartMoveRandomCard({
    target: this.decks.zone_credit,
  });

  if (this.clientReplacedCard) delete this.clientReplacedCard;
});
