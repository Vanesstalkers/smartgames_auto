({
  steps: {
    credit: {
      initialStep: true,
      text: `
        Окончательный бюджет клиента определяется размером выданного кредита. Расчет делается исходя из того, что <a>сумма на карте клиента являются первоначальным взносом для кредита</a>.
      `,
      active: { selector: '#gamePlane [code="Deck[card_zone_river]"] .card-event', customClass: 'tutorial-credit' },
      buttons: [{ text: 'Продолжай', step: 'example' }],
    },
    example: {
      text: `
        Увеличеие бюджета в зависимости от первоначального взноса (ПВ):
        при ПВ 50% - увеличивается в 2 раза
        при ПВ 40% - увеличивается в 2.5 раза
        при ПВ 30% - увеличивается в 3.3 раза
        при ПВ 25% - увеличивается в 4 раза
        при ПВ 20% - увеличивается в 5 раз
      `,
      active: { selector: '#gamePlane [code="Deck[card_zone_river]"] .card-event', customClass: 'tutorial-credit' },
      buttons: [{ text: 'Продолжай', step: 'feature' }],
    },
    feature: {
      initialStep: true,
      text: `
        Также в первоначальный взнос добавляются деньги с карт особенностей клиента, <a>если на них есть соответствущая отметка</a>.
      `,
      active: { selector: '#gamePlane [code="Deck[card_zone_turn]"] .card-event' },
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
  },
});
