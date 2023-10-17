<template>
  <div :class="['game-zones']">
    <div v-for="deck in tableAuctionZones" :key="deck._id" :code="deck.code" :style="{ width: handCardsWidth }">
      <card
        v-for="[id, { group }] in Object.entries(deck.itemMap)"
        :key="id"
        :id="id"
        :cardId="id"
        :cardGroup="group"
        :canPlay="false"
        :isSelected="false"
        imgExt="png"
      />
    </div>
    <div :class="['sales-zones']">
      <div
        v-for="deck in tableSalesZones"
        :key="deck._id"
        :code="deck.code"
        :class="['sales-deck']"
        :style="{ width: handCardsWidth }"
      >
        <card
          v-for="[id, { group }] in Object.entries(deck.itemMap)"
          :key="id"
          :id="id"
          :cardId="id"
          :cardGroup="group"
          :canPlay="false"
          :isSelected="false"
          imgExt="png"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { provide, reactive, inject } from 'vue';

import { prepareGameGlobals } from '~/lib/game/front/gameGlobals.mjs';
import card from '~/lib/game/front/components/card.vue';

export default {
  components: {
    card,
  },
  props: {},
  setup() {
    return inject('gameGlobals');
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

    tableCardZones() {
      return Object.keys(this.game.deckMap).map((id) => this.store.deck?.[id]);
    },
    tableAuctionZones() {
      return this.tableCardZones.filter((deck) => deck.placement == 'table' && deck.subtype != 'sales');
    },
    tableSalesZones() {
      return this.tableCardZones.filter((deck) => deck.placement == 'table' && deck.subtype == 'sales');
    },

    handCardsWidth() {
      const cardWidth = 130;
      const maxCardStack = 4;
      return state.isMobile ? `${cardWidth}px` : `${Math.ceil(1 / maxCardStack) * cardWidth}px`;
    },
  },
  methods: {},
};
</script>
<style lang="scss" scoped>
#game {
  #gamePlane {
    .game-zones {
      width: 100%;
      height: 100%;

      [code='Deck[card_zone_auction_client]'] {
        position: absolute;
        left: calc(50% - 130px - 10px);
        top: calc(50% - 90px);
        z-index: 1;
      }
      [code='Deck[card_zone_auction_car]'] {
        position: absolute;
        left: calc(50%);
        top: calc(50% - 90px);
      }

      .sales-zones {
        position: absolute;
        left: 0px;
        top: 50px;
        width: 100%;
        display: flex;
        justify-content: center;
        margin-left: 40px;
        transform-origin: center top;
        scale: 0.7;

        .sales-deck {
          display: flex;

          .card-event {
            margin-left: -80px;
          }
        }
      }
    }
  }
}
</style>
