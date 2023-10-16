(function(){
    const clientZone = this.getObjectByCode('Deck[card_zone_client]');
    const creditZone = this.getObjectByCode('Deck[card_zone_credit]');
    const featureZone = this.getObjectByCode('Deck[card_zone_feature]');

    this.clientCard = this.getObjectByCode('Deck[card_client]').getRandomItem();
    this.clientCard.moveToTarget(clientZone);
    this.featureCard = this.getObjectByCode('Deck[card_feature]').getRandomItem();
    this.featureCard.moveToTarget(featureZone);
    this.creditCard = this.getObjectByCode('Deck[card_credit]').smartMoveRandomCard({ target: creditZone });

    if (this.clientReplacedCard) delete this.clientReplacedCard;
})