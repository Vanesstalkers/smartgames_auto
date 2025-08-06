<template>
  <game :defaultScaleMinVisibleWidth="1000" :planeScaleMin="1" :planeScaleMax="5">
    <template #helper-guru="{ menuWrapper, menuButtonsMap } = {}">
      <tutorial :game="game" class="scroll-off" :customMenu="customMenu({ menuWrapper, menuButtonsMap })" />
    </template>

    <template
      #gameplane="{
        /* game = {}, gamePlaneScale */
      } = {}"
    >
      <sales-game-plane v-if="game.gameType === 'sales'" />
      <auction-game-plane v-if="game.gameType === 'auction'" />
    </template>

    <template #gameinfo="{} = {}">
      <div class="wrapper">
        <div class="game-status-label">
          {{ statusLabel }}
        </div>
        <div v-for="deck in deckList" :key="deck._id" class="deck" :code="deck.code">
          <div v-if="deck._id && deck.code === 'Deck[card_client]'" class="card-event">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === 'Deck[card_car]'" class="card-event">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === 'Deck[card_drop_service]'" class="card-event">
            {{ Object.keys(deck.itemMap).length }}
          </div>
        </div>
      </div>
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

import SalesGamePlane from './sales/plane.vue';
import AuctionGamePlane from './auction/plane.vue';

import { prepareGameGlobals } from '~/lib/game/front/gameGlobals.mjs';
import Game from '~/lib/game/front/Game.vue';
import card from '~/lib/game/front/components/card.vue';
import player from './components/player.vue';
import tutorial from '~/lib/helper/front/helper.vue';

export default {
  components: {
    SalesGamePlane,
    AuctionGamePlane,
    Game,
    player,
    card,
    tutorial,
  },
  props: {},
  setup() {
    const gameGlobals = prepareGameGlobals();
    provide('gameGlobals', gameGlobals);
    return gameGlobals;
  },
  watch: {
    gameDataLoaded: function () {
      // тут ловим обновление страницы
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
      return this.game.status === 'IN_PROCESS' || this.game.status === 'PREPARE_START';
    },
    restoringGameState() {
      return this.game.status === 'RESTORING_GAME';
    },
    statusLabel() {
      return this.restoringGameState ? 'Восстановление игры' : this.game.statusLabel;
    },
    playerIds() {
      const ids = Object.keys(this.game.playerMap || {}).sort((id1, id2) => (id1 > id2 ? 1 : -1));
      if (this.gameState.viewerMode) return ids;
      const curPlayerIdx = ids.indexOf(this.gameState.sessionPlayerId);
      const result = ids.slice(curPlayerIdx + 1).concat(ids.slice(0, curPlayerIdx));
      return result;
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
      const timerMod = 30000 / gameTimer;
      const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[gameConfig];
      return Math.floor(baseSum * timerMod * configMod);
    },
    deckList() {
      return Object.keys(this.game.deckMap).map((id) => this.store.deck?.[id]) || [];
    },
  },
  methods: {
    customMenu({ menuWrapper, menuButtonsMap } = {}) {
      if (!menuButtonsMap) return [];

      const { cancel, restore, tutorials, helperLinks, leave } = menuButtonsMap();
      const fillTutorials = tutorials({
        showList: [
          { title: 'Стартовое приветствие игры', action: { tutorial: 'game-tutorial-start' } },
          { title: 'Управление игровым полем', action: { tutorial: 'game-tutorial-gamePlane' } },
        ],
      });

      return menuWrapper({
        buttons: [cancel(), restore(), fillTutorials, helperLinks(), leave()],
      });
    },
  },
};
</script>
<style lang="scss">
.card-event.played {
  filter: none !important;
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

#gameInfo {
  .deck {
    position: absolute;
    top: 35px;
    cursor: default;

    .card-event {
      width: 60px;
      height: 90px;
      border: none;
      font-size: 36px;
      display: flex;
      justify-content: center;
      align-content: center;
      color: #ff5900;
      text-shadow: 1px 1px 0 #fff;
    }

    &[code='Deck[card_client]'] {
      right: 70px;

      .card-event {
        background-image: url(./assets/client-back-side.png);
      }
    }

    &[code='Deck[card_car]'] {
      right: 0px;

      .card-event {
        background-image: url(./assets/car-back-side.png);
      }
    }

    &[code='Deck[card_drop_service]'] {
      right: 140px;

      .card-event {
        background-image: url(./assets/service-back-side.png);
      }
    }
  }
}
</style>
