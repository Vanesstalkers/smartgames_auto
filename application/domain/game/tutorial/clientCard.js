({
  steps: {
    stars: {
      initialStep: true,
      text: `
        Количество звезд в предложении игрока должно быть не меньше, чем количество звезд на карте клиента.
      `,
      active: { selector: '#gamePlane [code="Deck[card_zone_flop]"] .card-event', customClass: 'tutorial-stars' },
      buttons: [{ text: 'Продолжай', step: 'color' }],
    },
    color: {
      text: `
        Хотя бы один из цветов предложения игрока должно совпадать с цветом на карте клиента.
        * Для серого цвета это условие не является обязательным.  
      `,
      active: { selector: '#gamePlane [code="Deck[card_zone_flop]"] .card-event', customClass: 'tutorial-color' },
      buttons: [{ text: 'Продолжай', step: 'budget' }],
    },
    budget: {
      text: `
        Сумма на карте клиента является базовой для расчета общего бюджета, который не должен быть превышен в предложении игрока.
      `,
      active: { selector: '#gamePlane [code="Deck[card_zone_flop]"] .card-event', customClass: 'tutorial-budget' },
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
  },
});
