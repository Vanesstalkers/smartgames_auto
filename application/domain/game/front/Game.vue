<template>
  <game>
    <template
      #gameplane="{
        /* game = {}, gamePlaneScale */
      } = {}"
    >
      <div :class="['game-zones', clientDopCard ? 'has-client-dop' : '']">
        <div v-for="deck in tableCardZones" :key="deck._id" :code="deck.code" :style="{ width: handCardsWidth }">
          <card
            v-for="id in Object.keys(deck.itemMap)"
            :key="id"
            :id="id"
            :cardId="id"
            :cardGroup="deck.cardGroup"
            :canPlay="false"
            :isSelected="false"
            imgExt="png"
          />
        </div>
      </div>
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
          <div v-if="deck._id && deck.code === 'Deck[card_feature]'" class="card-event">
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

    Object.assign(gameGlobals, {
      sessionPlayerIsActive() {
        const playerMap = this.getGame().playerMap || {};
        const activePlayers = Object.keys(playerMap).filter((id) => {
          const player = this.getStore().player?.[id] || {};
          return player.active && !player.activeReady;
        });
        return activePlayers.includes(this.gameState.sessionPlayerId);
      },
      calcGamePlaneCustomStyleData({ gamePlaneScale, isMobile }) {
        return {
          transformOrigin: 'center',
        };
      },
    });

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
        case 'IN_PROCESS': {
          const roundLabels = {
            FIRST_OFFER: 'Первое предложение',
            PRESENT: 'Подарок клиенту',
            SECOND_OFFER: 'Дополнительные продажи',
            ROUND_END: 'Окончание раунда',
          };

          const roundStep = this.game.roundStep;
          const label = roundLabels[roundStep] || roundStep;

          return `Раунд ${this.game.round} (${label})`;
        }
        case 'FINISHED':
          return 'Игра закончена';
      }
    },
    deckList() {
      return Object.keys(this.game.deckMap).map((id) => this.store.deck?.[id]) || [];
    },
    tableCardZones() {
      return Object.keys(this.game.deckMap)
        .map((id) => {
          const deck = this.store.deck?.[id];
          if (deck.code === 'Deck[card_zone_credit]') {
            deck.cardGroup = 'credit';
          }
          if (deck.code === 'Deck[card_zone_feature]') {
            deck.cardGroup = 'feature';
          }
          return deck;
        })
        .filter(({ placement } = {}) => placement == 'table');
    },
    clientDopCard() {
      return Object.keys(this.tableCardZones.find((deck) => deck.subtype === 'zone_client_dop')?.itemMap || {})?.[0];
    },
    activeCards() {
      return this.deckList.find((deck) => deck.subtype === 'active') || {};
    },

    handCardsWidth() {
      const cardWidth = 130;
      const maxCardStack = 4;
      return state.isMobile ? `${cardWidth}px` : `${Math.ceil(1 / maxCardStack) * cardWidth}px`;
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
  },
};
</script>
<style lang="scss">
#game {
  #gamePlane {
    .game-zones {
      width: 100%;
      height: 100%;
    }
  }
  &[type='sales'] #gamePlane {
    .game-zones {
      [code='Deck[card_zone_client]'] {
        position: absolute;
        left: calc(50% - 130px - 10px);
        top: calc(50% - 90px);
        z-index: 1;
      }

      [code='Deck[card_zone_client]'] {
        position: absolute;
        left: calc(50% - 130px - 10px);
        top: calc(50% - 90px);
        z-index: 1;
      }

      [code='Deck[card_zone_feature]'] {
        position: absolute;
        left: calc(50%);
        top: calc(50% - 90px);
      }
      [code='Deck[card_zone_client_dop]'] {
        position: absolute;
        left: calc(50% + 28px);
        top: calc(50% - 90px);
        z-index: 1;
      }

      [code='Deck[card_zone_credit]'] {
        position: absolute;
        left: calc(50% + 130px + 10px);
        top: calc(50% - 90px);
      }

      &.has-client-dop {
        [code='Deck[card_zone_credit]'] {
          left: calc(50% + 130px + 10px + 28px);
        }
      }
    }
  }
  &[type='auction'] #gamePlane {
    .game-zones {
      display: none;
    }
  }
}

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
}

.deck[code='Deck[card_client]'] {
  position: absolute;
  top: 35px;
  right: 70px;
  cursor: default;
  .card-event {
    background-image: url(./assets/client-back-side.png);
  }
}
.deck[code='Deck[card_feature]'] {
  position: absolute;
  top: 35px;
  right: 0px;
  cursor: default;
  .card-event {
    background-image: url(./assets/feature-back-side.png);
  }
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

.game-zones > div[code='Deck[card_zone_any]'] {
  position: absolute;
  right: 0px;
}

.card-event.played {
  filter: none !important;
}
</style>
