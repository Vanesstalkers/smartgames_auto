<template>
  <div :class="['game-zones', clientDopCard ? 'has-client-dop' : '']">
    <div v-for="deck in tableCardZones" :key="deck._id" :code="deck.code" :style="{ width: handCardsWidth }">
      <card
        v-for="[id, { group }] in Object.entries(deck.itemMap)"
        :key="id"
        :id="id"
        :cardId="id"
        :cardGroup="group"
        :canPlay="false"
        imgExt="png"
      />
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
      return Object.keys(this.game.deckMap)
        .map((id) => this.store.deck?.[id])
        .filter(({ placement } = {}) => placement == 'table');
    },
    clientDopCard() {
      return Object.keys(this.tableCardZones.find((deck) => deck.subtype === 'zone_client_dop')?.itemMap || {})?.[0];
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

      [code='Deck[card_zone_client]'] {
        position: absolute;
        left: calc(50% - 130px - 10px + 400px);
        top: calc(50% - 90px);
        z-index: 1;
      }
      [code='Deck[card_zone_feature]'] {
        position: absolute;
        left: calc(50% + 400px);
        top: calc(50% - 90px);
      }
      [code='Deck[card_zone_client_dop]'] {
        position: absolute;
        left: calc(50% + 28px + 400px);
        top: calc(50% - 90px);
        z-index: 1;
      }
      [code='Deck[card_zone_credit]'] {
        position: absolute;
        left: calc(50% + 130px + 10px + 400px);
        top: calc(50% - 90px);
      }

      &.has-client-dop {
        [code='Deck[card_zone_credit]'] {
          left: calc(50% + 130px + 10px + 28px + 400px);
        }
      }
    }
  }

  &.mobile-view {
    #gamePlane {
      .game-zones {
        width: 100%;
        height: 100%;

        &.has-client-dop {
          [code='Deck[card_zone_credit]'] {
            left: calc(50% + 130px + 10px + 28px);
          }
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
      }
    }
  }
}
</style>
