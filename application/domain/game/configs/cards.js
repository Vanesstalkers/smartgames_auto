({ api, selectGroup, template } = {}) => {
  const list = [
    {
      ...{ group: 'car', name: 'lada_niva_travel', title: 'Lada Niva Travel' },
      ...{ stars: 1, price: 1400, priceGroup: ['suv'], equip: ['tires'] },
    },
    {
      ...{ group: 'car', name: 'lada_vesta', title: 'Lada Vesta' },
      ...{ stars: 1, price: 1500, priceGroup: ['cheap'], equip: [] },
    },
    {
      ...{ group: 'car', name: 'uaz_hunter', title: 'UAZ Hunter' },
      ...{ stars: 1, price: 1650, priceGroup: ['suv'], equip: ['tires'] },
    },
    {
      ...{ group: 'car', name: 'changan_alsvin', title: 'Changan Alsvin' },
      ...{ stars: 1, price: 1800, priceGroup: ['cheap'], equip: ['gearbox'] },
    },
    {
      ...{ group: 'car', name: 'uaz_patriot', title: 'UAZ Patriot' },
      ...{ stars: 1, price: 1850, priceGroup: ['suv'], equip: ['tires'] },
    },
    {
      ...{ group: 'car', name: 'moskvich_3', title: 'Moskvich 3' },
      ...{ stars: 1, price: 1900, priceGroup: ['family'], equip: ['climat'] },
    },
    {
      ...{ group: 'car', name: 'lada_vesta_cross_sw', title: 'Lada Vesta Cross SW' },
      ...{ stars: 1, price: 2000, priceGroup: ['family'], equip: ['tires'] },
    },
    {
      ...{ group: 'car', name: 'haval_jolion', title: 'Haval Jolion' },
      ...{ stars: 1, price: 2100, priceGroup: ['family'], equip: ['climat'] },
    },
    {
      ...{ group: 'car', name: 'baic_u5_plus', title: 'BAIC U5 Plus' },
      ...{ stars: 1, price: 2200, priceGroup: ['cheap'], equip: ['leather'] },
    },
    {
      ...{ group: 'car', name: 'changan_cs35_plus', title: 'Changan CS35 Plus' },
      ...{ stars: 1, price: 2300, priceGroup: ['woman'], equip: ['gearbox', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'evolute_ipro', title: 'Evolute i-PRO' },
      ...{ stars: 2, price: 2500, priceGroup: ['cheap'], equip: ['gearbox', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'moskvich_6', title: 'Moskvich 6' },
      ...{ stars: 2, price: 2600, priceGroup: ['cheap'], equip: ['gearbox', 'leather'] },
    },
    {
      ...{ group: 'car', name: 'chery_tiggo4_new', title: 'Chery Tiggo4 New' },
      ...{ stars: 2, price: 2700, priceGroup: ['family'], equip: ['gearbox', 'leather', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'faw_bestune_t77', title: 'FAW Bestune T77' },
      ...{ stars: 2, price: 2800, priceGroup: ['family'], equip: ['leather', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'gac_gs3', title: 'GAC GS3' },
      ...{ stars: 2, price: 2900, priceGroup: ['woman'], equip: ['gearbox'] },
    },
    {
      ...{ group: 'car', name: 'evolute_ijoy', title: 'Evolute i-JOY' },
      ...{ stars: 2, price: 2900, priceGroup: ['family'], equip: ['gearbox', 'leather', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'geely_coolray', title: 'Geely Coolray' },
      ...{ stars: 2, price: 3000, priceGroup: ['woman'], equip: ['gearbox', 'climat', 'leather'] },
    },
    {
      ...{ group: 'car', name: 'exeed_lx', title: 'Exeed LX' },
      ...{ stars: 2, price: 3200, priceGroup: ['family'], equip: ['gearbox', 'leather', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'omoda_c5', title: 'Omoda C5' },
      ...{ stars: 2, price: 3300, priceGroup: ['woman'], equip: ['gearbox', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'baic_bj40', title: 'BAIC BJ40' },
      ...{ stars: 2, price: 3400, priceGroup: ['suv'], equip: ['climat'] },
    },
    {
      ...{ group: 'car', name: 'jetour_dashing', title: 'Jetour Dashing' },
      ...{ stars: 3, price: 3800, priceGroup: ['woman'], equip: ['massage', 'gearbox', 'leather', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'geely_monjaro', title: 'Geely Monjaro' },
      ...{ stars: 3, price: 4000, priceGroup: ['family'], equip: ['gearbox', 'leather', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'tank_300', title: 'Tank 300' },
      ...{ stars: 3, price: 4200, priceGroup: ['suv'], equip: ['gearbox', 'leather', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'changan_uni_k', title: 'Changan UNI-K' },
      ...{ stars: 3, price: 4500, priceGroup: ['family'], equip: ['gearbox', 'leather', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'gac_gs8', title: 'GAC GS8' },
      ...{ stars: 3, price: 4700, priceGroup: ['suv'], equip: ['gearbox', 'leather', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'exeed_rx', title: 'Exeed RX' },
      ...{ stars: 3, price: 5000, priceGroup: ['family'], equip: ['gearbox', 'leather', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'voyah_free', title: 'Voyah Free' },
      ...{ stars: 4, price: 5500, priceGroup: ['vip'], equip: ['massage', 'gearbox', 'leather', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'byd_han', title: 'BYD Han' },
      ...{ stars: 4, price: 6000, priceGroup: ['vip'], equip: ['wheels', 'gearbox', 'leather', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'byd_tang', title: 'BYD Tang' },
      ...{ stars: 4, price: 6500, priceGroup: ['vip'], equip: ['massage', 'gearbox', 'leather', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'tank_500', title: 'Tank 500' },
      ...{ stars: 4, price: 7000, priceGroup: ['suv'], equip: ['massage', 'gearbox', 'leather', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'lixiang_l7', title: 'LiXiang L7' },
      ...{ stars: 4, price: 7500, priceGroup: ['vip'], equip: ['massage', 'wheels', 'gearbox', 'leather', 'climat'] },
    },
    {
      ...{ group: 'car', name: 'zeekr_001', title: 'Zeekr 001' },
      ...{ stars: 4, price: 8000, priceGroup: ['vip'], equip: ['wheels', 'gearbox', 'leather', 'climat'] },
    },

    { group: 'service', name: 'gearbox', title: 'Коробка автомат', price: '+20%', stars: 1, equip: ['gearbox'] },
    { group: 'service', name: 'gearbox', title: 'Коробка автомат', price: '+20%', stars: 1, equip: ['gearbox'] },
    { group: 'service', name: 'ins20', title: 'Страховка авто', price: '+20%' },
    { group: 'service', name: 'ins20', title: 'Страховка авто', price: '+20%' },
    { group: 'service', name: 'ins30', title: 'Страховка жизни', price: '+30%' },
    { group: 'service', name: 'ins30', title: 'Страховка жизни', price: '+30%' },
    { group: 'service', name: 'wheels', title: 'Кованые диски', price: '+10%', equip: ['wheels'] },
    { group: 'service', name: 'wheels', title: 'Кованые диски', price: '+10%', equip: ['wheels'] },
    { group: 'service', name: 'wheels', title: 'Кованые диски', price: '+10%', equip: ['wheels'] },
    { group: 'service', name: 'wheels', title: 'Кованые диски', price: '+10%', equip: ['wheels'] },
    { group: 'service', name: 'tires', title: 'Зимняя резина', price: '+10%', priceGroup: ['suv'], equip: ['tires'] },
    { group: 'service', name: 'tires', title: 'Зимняя резина', price: '+10%', priceGroup: ['suv'], equip: ['tires'] },
    { group: 'service', name: 'tires', title: 'Зимняя резина', price: '+10%', priceGroup: ['suv'], equip: ['tires'] },
    { group: 'service', name: 'tires', title: 'Зимняя резина', price: '+10%', priceGroup: ['suv'], equip: ['tires'] },
    { group: 'service', name: 'sport', title: 'Спортивные обвесы', price: '+10%', priceGroup: ['cheap'] },
    { group: 'service', name: 'sport', title: 'Спортивные обвесы', price: '+10%', priceGroup: ['cheap'] },
    {
      ...{ group: 'service', name: 'massage', title: 'Сиденья с функцией массажа' },
      ...{ price: '+400', stars: 1, equip: ['massage'] },
    },
    {
      ...{ group: 'service', name: 'massage', title: 'Сиденья с функцией массажа' },
      ...{ price: '+400', stars: 1, equip: ['massage'] },
    },
    {
      ...{ group: 'service', name: 'climat', title: 'Климат-контроль' },
      ...{ price: '+20%', priceGroup: ['family'], equip: ['climat'] },
    },
    {
      ...{ group: 'service', name: 'climat', title: 'Климат-контроль' },
      ...{ price: '+20%', priceGroup: ['family'], equip: ['climat'] },
    },
    { group: 'service', name: 'leather', title: 'Кожаный салон', price: '+10%', stars: 1, equip: ['leather'] },
    { group: 'service', name: 'leather', title: 'Кожаный салон', price: '+10%', stars: 1, equip: ['leather'] },
    // ! карточки местами не менять - их позиция влияет на алгоритм распределения в fillStartHandWithServices
    { group: 'service', name: 'aerograf', title: 'Аэрография', price: '+100', priceGroup: ['vip', 'woman'] },
    { group: 'service', name: 'vinyl', title: 'Виниловая пленка', price: '+250', priceGroup: ['vip', 'woman'] },
    { group: 'service', name: 'multisystem200', title: 'Мультимедиа система', price: '+200' },
    { group: 'service', name: 'multisystem250', title: 'Мультимедиа система', price: '+250' },
    { group: 'service', name: 'signaling100', title: 'Автосигнализация', price: '+100' },
    { group: 'service', name: 'signaling200', title: 'Автосигнализация', price: '+200' },
    { group: 'service', name: 'anticor', title: 'Антикоррозийная обработка кузова', price: '+50' },
    { group: 'service', name: 'anticor', title: 'Антикоррозийная обработка кузова', price: '+50' },
    { group: 'service', name: 'anticor', title: 'Антикоррозийная обработка кузова', price: '+50' },
    { group: 'service', name: 'anticor', title: 'Антикоррозийная обработка кузова', price: '+50' },

    {
      ...{ group: 'client', name: 'newlyweds1', title: 'Молодожены' },
      ...{ money: 1200, stars: 1, priceGroup: ['cheap', 'family'] },
    },
    {
      ...{ group: 'client', name: 'newlyweds2', title: 'Молодожены' },
      ...{ money: 1350, stars: 2, priceGroup: ['cheap', 'family'] },
    },
    { group: 'client', name: 'blogger', title: 'Блогер', money: 1950, stars: 3, priceGroup: '*' },
    { group: 'client', name: 'sportsman', title: 'Спортсмен', money: 1350, stars: 2, priceGroup: '*' },
    { group: 'client', name: 'businessman', title: 'Предприниматель', money: 2100, stars: 2, priceGroup: '*' },
    { group: 'client', name: 'major', title: 'Мажор', money: 2250, stars: 2, priceGroup: ['cheap', 'vip'] },
    {
      ...{ group: 'client', name: 'outdoors', title: 'Любители отдыха' },
      ...{ money: 1050, stars: 1, priceGroup: ['cheap', 'suv'] },
    },
    {
      group: 'client',
      name: 'military',
      title: 'Военнослужащий',
      money: 900,
      stars: 1,
      priceGroup: ['cheap', 'suv'],
    },
    { group: 'client', name: 'state', title: 'Бюджетники', money: 850, stars: 1, priceGroup: ['cheap'] },
    { group: 'client', name: 'pensioner', title: 'Пенсионер', money: 800, stars: 1, priceGroup: '*' },
    { group: 'client', name: 'topmanager', title: 'Топ-менеджер', money: 3300, stars: 4, priceGroup: ['vip'] },
    { group: 'client', name: 'farmer', title: 'Фермер', money: 1500, stars: 1, priceGroup: ['suv', 'family'] },
    { group: 'client', name: 'taxi', title: 'Таксист', money: 750, stars: 1, priceGroup: '*' },
    { group: 'client', name: 'family1', title: 'Семейная пара', money: 1650, stars: 2, priceGroup: ['family'] },
    { group: 'client', name: 'family2', title: 'Семейная пара', money: 1800, stars: 2, priceGroup: ['family'] },
    { group: 'client', name: 'programmer', title: 'Программист', money: 1800, stars: 2, priceGroup: '*' },
    { group: 'client', name: 'blonde', title: 'Блондинка', money: 2250, stars: 3, priceGroup: ['woman'] },
    { group: 'client', name: 'hunter', title: 'Любитель охоты', money: 2700, stars: 3, priceGroup: ['suv', 'vip'] },
    { group: 'client', name: 'fisherman', title: 'Любитель рыбалки', money: 1350, stars: 2, priceGroup: ['suv'] },
    { group: 'client', name: 'architect', title: 'Архитектор', money: 1650, stars: 3, priceGroup: ['suv'] },
    { group: 'client', name: 'deputy', title: 'Помощник депутата', money: 3150, stars: 3, priceGroup: ['vip'] },
    {
      ...{ group: 'client', name: 'businesswoman', title: 'Бизнес-леди' },
      ...{ money: 3000, stars: 4, priceGroup: ['vip', 'woman'] },
    },
    { group: 'client', name: 'summer', title: 'Дачница', money: 1200, stars: 2, priceGroup: ['suv', 'woman'] },
    {
      ...{ group: 'client', name: 'housewife', title: 'Домохозяйка' },
      ...{ money: 1050, stars: 2, priceGroup: ['family', 'woman'] },
    },

    { group: 'feature', name: 'for_work', title: 'Покупает для работы', replaceClient: true },
    { group: 'feature', name: 'for_present', title: 'Покупает в подарок', replaceClient: true },
    { group: 'feature', name: 'reference1', title: 'Привел друга', reference: true },
    { group: 'feature', name: 'reference2', title: 'Привел друга', reference: true },
    { group: 'feature', name: 'present', title: 'Пообещали подарок' },
    { group: 'feature', name: 'problem1', title: 'Проблемный клиент' },
    { group: 'feature', name: 'problem2', title: 'Проблемный клиент' },
    { group: 'feature', name: 'downer', title: 'Зануда' },
    { group: 'feature', name: 'grandmother', title: 'Помогла бабушка', money: '+200', target: 'client' },
    { group: 'feature', name: 'relatives', title: 'Помогли родственники', money: '+100', target: 'client' },
    { group: 'feature', name: 'friends250', title: 'Занял у друзей', money: '+250', target: 'client' },
    { group: 'feature', name: 'tradein300', title: 'TRADE-IN', price: '-300', target: 'car' },
    { group: 'feature', name: 'tradein400', title: 'TRADE-IN', price: '-400', target: 'car' },
    { group: 'feature', name: 'tradein500', title: 'TRADE-IN', price: '-500', target: 'car' },
    { group: 'feature', name: 'parents', title: 'Помогли родители', money: '+300', target: 'client' },
    { group: 'feature', name: 'friends150', title: 'Добавили друзья', money: '+150', target: 'client' },
    { group: 'feature', name: 'promo', title: 'По акции', price: '-10%', target: 'car' },
    { group: 'feature', name: 'testdrive', title: 'Авто с тест-драйва', price: '-20%', target: 'car' },
    { group: 'feature', name: 'vip20', title: 'Постоянный клиент', price: '-20%', target: 'car' },
    { group: 'feature', name: 'vip10', title: 'Постоянный клиент', price: '-10%', target: 'car' },
    { group: 'feature', name: 'contact', title: 'Связи в салоне', price: '-20%', target: 'car' },
    { group: 'feature', name: 'grant400', title: 'Субсидия', price: '-400', target: 'car' },
    { group: 'feature', name: 'grant500', title: 'Субсидия', price: '-500', target: 'car' },
    { group: 'feature', name: 'grant600', title: 'Субсидия', price: '-600', target: 'car' },

    { group: 'credit', name: 'credit_20_alfa', title: 'Взял кредит', pv: '20%' },
    { group: 'credit', name: 'credit_30_alfa', title: 'Взял кредит', pv: '30%' },
    { group: 'credit', name: 'credit_40_alfa', title: 'Взял кредит', pv: '40%' },
    { group: 'credit', name: 'credit_50_alfa', title: 'Взял кредит', pv: '50%' },
    { group: 'credit', name: 'credit_20_drive', title: 'Взял кредит', pv: '20%' },
    { group: 'credit', name: 'credit_30_drive', title: 'Взял кредит', pv: '30%' },
    { group: 'credit', name: 'credit_40_drive', title: 'Взял кредит', pv: '40%' },
    { group: 'credit', name: 'credit_50_drive', title: 'Взял кредит', pv: '50%' },
    { group: 'credit', name: 'credit_20_vtb', title: 'Взял кредит', pv: '20%' },
    { group: 'credit', name: 'credit_30_vtb', title: 'Взял кредит', pv: '30%' },
    { group: 'credit', name: 'credit_40_vtb', title: 'Взял кредит', pv: '40%' },
    { group: 'credit', name: 'credit_50_vtb', title: 'Взял кредит', pv: '50%' },
    { group: 'credit', name: 'credit_20_sovcom', title: 'Взял кредит', pv: '20%' },
    { group: 'credit', name: 'credit_30_sovcom', title: 'Взял кредит', pv: '30%' },
    { group: 'credit', name: 'credit_40_sovcom', title: 'Взял кредит', pv: '40%' },
    { group: 'credit', name: 'credit_50_sovcom', title: 'Взял кредит', pv: '50%' },
    { group: 'credit', name: 'credit_20_ural', title: 'Взял кредит', pv: '20%' },
    { group: 'credit', name: 'credit_30_ural', title: 'Взял кредит', pv: '30%' },
    { group: 'credit', name: 'credit_40_ural', title: 'Взял кредит', pv: '40%' },
    { group: 'credit', name: 'credit_50_ural', title: 'Взял кредит', pv: '50%' },
    { group: 'credit', name: 'credit_20_ros', title: 'Взял кредит', pv: '20%' },
    { group: 'credit', name: 'credit_30_ros', title: 'Взял кредит', pv: '30%' },
    { group: 'credit', name: 'credit_40_ros', title: 'Взял кредит', pv: '40%' },
    { group: 'credit', name: 'credit_50_ros', title: 'Взял кредит', pv: '50%' },
  ];

  const result = list
    .filter((card) => !selectGroup || card.group === selectGroup)
    .map((card) =>
      api
        ? {
            price: selectGroup === 'car' ? parseInt(card.price) : undefined,
            path: `${template}/${card.group}/${card.name}.png`,
          }
        : card
    );

  return result;
};
