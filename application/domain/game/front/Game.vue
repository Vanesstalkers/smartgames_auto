<template>
  <game>
    <template
      #gameplane="{
        /* game = {}, gamePlaneScale */
      } = {}"
    >
      TO_CHANGE
    </template>

    <template #gameinfo="{} = {}">
      <div class="wrapper">TO_CHANGE</div>
    </template>

    <template #player="{} = {}">
      <player
        :playerId="gameState.sessionPlayerId"
        :viewerId="gameState.sessionViewerId"
        :customClass="[`scale-${state.guiScale}`]"
        :iam="true"
        :showControls="showPlayerControls"
      />
    </template>
    <template #opponents="{} = {}">
      <player
        v-for="(id, index) in playerIds"
        :key="id"
        :playerId="id"
        :customClass="[`idx-${index}`]"
        :showControls="false"
      />
    </template>
  </game>
</template>

<script>
import { provide, reactive } from 'vue';

import { prepareGameGlobals } from '~/lib/game/front/gameGlobals.mjs';
import Game from '~/lib/game/front/Game.vue';
import card from '~/lib/game/front/components/card.vue';
import player from './components/player.vue';

export default {
  components: {
    Game,
    player,
    card,
  },
  props: {},
  setup() {
    const gameGlobals = prepareGameGlobals();

    // TO_CHANGE (если нужны дополнительные глобальные обработчики)
    Object.assign(gameGlobals, {
      // calcGamePlaneCustomStyleData({ gamePlaneScale, isMobile }) {
      //   const p = {};
      //   const gamePlane = document.getElementById('gamePlane');
      //   if (gamePlane instanceof HTMLElement) {
      //     const gamePlaneRect = gamePlane.getBoundingClientRect();
      // 
      //      ...
      // 
      //     const planePadding = 300;
      //     return {
      //       height: planePadding + (p.b - p.t) / gamePlaneScale + 'px',
      //       width: planePadding + (p.r - p.l) / gamePlaneScale + 'px',
      //       top: 'calc(50% - ' + ((p.b - p.t) / 2 + p.ot * 1) + 'px)',
      //       left: `calc(${isMobile ? '65%' : '50%'} - ${(p.r - p.l) / 2 + p.ol * 1}px)`,
      //     };
      //   }
      // },
    });

    // TO_CHANGE (если нужны дополнительные глобальные переменные)
    gameGlobals.gameCustom = reactive({
      selectedCard: '',
    });
    provide('gameGlobals', gameGlobals);

    return gameGlobals;
  },
  watch: {
    gameDataLoaded: function () {
      // тут ловим обновление страницы
    },
    'game.activeEvent': function () {
      // тут ловим инициацию событий карт
    },
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.getStore() || {};
    },
    game() {
      return this.getGame();
    },
    gameDataLoaded() {
      return this.game.addTime;
    },
    showPlayerControls() {
      return this.game.status === 'IN_PROCESS';
    },
    playerIds() {
      const ids = Object.keys(this.game.playerMap || {}).sort((id1, id2) => (id1 > id2 ? 1 : -1));
      if (this.gameState.viewerMode) return ids;
      const curPlayerIdx = ids.indexOf(this.gameState.sessionPlayerId);
      const result = ids.slice(curPlayerIdx + 1).concat(ids.slice(0, curPlayerIdx));
      return result;
    },
    sessionPlayer() {
      return this.store.player?.[this.gameState.sessionPlayerId] || {};
    },
    sessionUserCardDeckLength() {
      return (
        Object.keys(
          Object.keys(this.sessionPlayer.deckMap || {})
            .map((id) => this.store.deck?.[id] || {})
            .filter((deck) => deck.type === 'card' && !deck.subtype)[0]?.itemMap || {}
        ).length || 0
      );
    },

    fullPrice() {
      const { gameTimer, gameConfig } = this.game;
      const baseSum = 1000; // TO_CHANGE (меняем на свою сумму дохода за игру)
      const timerMod = 30 / gameTimer;
      const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[gameConfig];
      return Math.floor(baseSum * timerMod * configMod);
    },
    statusLabel() {
      switch (this.game.status) {
        case 'WAIT_FOR_PLAYERS':
          return 'Ожидание игроков';
        case 'PREPARE_START':
          return 'Подготовка к игре'; // TO_CHANGE (меняем на свое описание этапа раунда)
        case 'IN_PROCESS':
          return `Раунд ${this.game.round}`;
        case 'FINISHED':
          return 'Игра закончена';
      }
    },
    deckList() {
      return Object.keys(this.game.deckMap).map((id) => this.store.deck?.[id]) || [];
    },
    activeCards() {
      return this.deckList.find((deck) => deck.subtype === 'active') || {};
    },
  },
  methods: {
    sortActiveCards(arr) {
      return arr
        .map((id) => this.store.card?.[id] || {})
        .sort((a, b) => (a.played > b.played ? 1 : -1)) // сортируем по времени сыгрывания
        .sort((a, b) => (a.played ? 0 : 1)) // переносим не сыгранные в конец
        .map((card) => card._id);
    },
    async takeCard() {
      return;
      await this.handleGameApi({ name: 'takeCard', data: { count: 5 } });
    },
  },
};
</script>
<style>
.deck > .card-event {
  width: 60px;
  height: 90px;
  border: none;
  font-size: 36px;
  display: flex;
  justify-content: center;
  align-content: center;
  color: #ff5900;
  text-shadow: 1px 1px 0 #fff;
  background-image: url(./assets/back-side.jpg);
}

.deck[code='Deck[card]'] {
  position: absolute;
  top: 35px;
  right: 30px;
  cursor: default;
}

.deck[code='Deck[card_drop]'] {
  position: absolute;
  filter: grayscale(1);
  transform: scale(0.5);
  top: 65px;
  right: -10px;
  cursor: default;
}
.deck[code='Deck[card_drop]'] > .card-event {
  color: #ccc;
}

.deck[code='Deck[card_active]'] {
  position: absolute;
  top: 140px;
  right: 0px;
  display: flex;
}
#game.landscape-view .deck[code='Deck[card_active]'] {
  top: 0px;
  right: -135px;
}

.deck[code='Deck[card_active]'] .card-event {
  margin-top: -135px;
}
.deck[code='Deck[card_active]'] .card-event:first-child {
  margin-top: 0px !important;
}
.deck-active {
  display: flex;
  flex-direction: column;
}

.game-status-label {
  text-align: right;
  color: white;
  font-weight: bold;
  font-size: 2em;
  white-space: nowrap;
  text-shadow: black 1px 0 10px;
}
#game.mobile-view .game-status-label {
  font-size: 1.5em;
}
</style>
