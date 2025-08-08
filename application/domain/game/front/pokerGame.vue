<template>
  <game :debug="false" :defaultScaleMinVisibleWidth="1000" :planeScaleMin="1" :planeScaleMax="5">
    <template #helper-guru="{ menuWrapper, menuButtonsMap } = {}">
      <tutorial :game="game" class="scroll-off" :customMenu="customMenu({ menuWrapper, menuButtonsMap })" />
    </template>

    <template #chat="{ isVisible, hasUnreadMessages } = {}">
      <chat
        :defActiveChannel="`game-${gameState.gameId}`"
        :userData="userData"
        :isVisible="isVisible"
        :class="[isVisible ? 'isVisible' : '']"
        :hasUnreadMessages="hasUnreadMessages"
        :channels="chatChannels"
      />
    </template>

    <template #gameplane="{} = {}">
      <div :class="['game-zones']">
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
      >
        <template #worker="{ playerId, viewerId, iam } = {}">
          <card-worker :playerId="playerId" :viewerId="viewerId" :iam="iam">
            <template #money="{ money } = {}">
              <div class="money">{{ new Intl.NumberFormat().format(money || 0) + '₽' }}</div>
            </template>
            <template #timer="{ timer, showTimer } = {}">
              <div v-if="showTimer" class="end-round-timer">{{ timer }}</div>
            </template>
            <template #custom />
            <template v-if="showPlayerControls" #control="{ controlAction } = {}">
              <div class="action-btn-block">
                <div class="action-btn end-round-btn" @click="controlAction({ action: 'raise' })">
                  {{ 'Повысить' }}
                </div>
                <div class="action-btn end-round-btn" @click="controlAction({ action: 'call' })">
                  {{ 'Уравнять' }}
                </div>
                <div class="action-btn end-round-btn" @click="controlAction({ action: 'check' })">
                  {{ 'Пропустить' }}
                </div>
                <div class="action-btn end-round-btn" @click="controlAction({ action: 'reset' })">
                  {{ 'Сбросить' }}
                </div>
              </div>
            </template>
          </card-worker>
        </template>
      </player>
    </template>
    <template #opponents="{} = {}">
      <player v-for="(id, index) in playerIds" :key="id" :playerId="id" :customClass="[`idx-${index}`]">
        <template #worker="{} = {}">
          <card-worker :playerId="id" :viewerId="gameState.sessionViewerId" :iam="false">
            <template #money="{ money } = {}">
              <div class="money">{{ new Intl.NumberFormat().format(money || 0) + '₽' }}</div>
            </template>
            <template #timer="{ timer, showTimer } = {}">
              <div v-if="showTimer" class="end-round-timer">{{ timer }}</div>
            </template>
            <template #custom />
          </card-worker>
        </template>
      </player>
    </template>
  </game>
</template>

<script>
import { provide, reactive } from 'vue';

import { prepareGameGlobals } from '~/lib/game/front/gameGlobals.mjs';
import pokerGameGlobals, { gameCustomArgs } from '~/domain/game/front/pokerGameGlobals.mjs';
import game from '~/lib/game/front/Game.vue';
import tutorial from '~/lib/helper/front/helper.vue';
import chat from '~/lib/chat/front/chat.vue';
import card from '~/lib/game/front/components/card.vue';

import player from '~/domain/game/front/components/player.vue';
import cardWorker from '~/domain/game/front/components/cardWorker.vue';

export default {
  components: {
    game,
    tutorial,
    chat,
    card,
    player,
    cardWorker,
  },
  props: {},
  setup() {
    const gameGlobals = prepareGameGlobals({
      defaultDeviceOffset: 50, // сдвиг gamePlane влево от центра
      gameCustomArgs: {
        ...gameCustomArgs,
      },
    });

    Object.assign(gameGlobals, pokerGameGlobals);

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
    lobby() {
      return this.state.store.lobby?.[this.state.currentLobby] || {};
    },
    userData() {
      return this.sessionUserData();
    },
    playerIds() {
      const ids = Object.keys(this.game.playerMap || {}).sort((id1, id2) => (id1 > id2 ? 1 : -1));
      if (this.gameState.viewerMode) return ids;
      const curPlayerIdx = ids.indexOf(this.gameState.sessionPlayerId);
      const result = ids.slice(curPlayerIdx + 1).concat(ids.slice(0, curPlayerIdx));
      return result;
    },
    showPlayerControls() {
      return this.game.status === 'IN_PROCESS' || this.game.status === 'PREPARE_START';
    },
    tableCardZones() {
      return Object.keys(this.game.deckMap)
        .map((id) => this.store.deck?.[id])
        .filter(({ placement } = {}) => placement == 'table');
    },
    chatChannels() {
      return {
        [`game-${this.gameState.gameId}`]: {
          name: 'Чат игры',
          users: this.gameChatUsers,
          items: this.game.chat || {},
          inGame: true,
        },
        [`lobby-${this.state.currentLobby}`]: {
          name: 'Общий чат',
          users: this.lobby.users || {},
          items: this.lobby.chat || {},
        },
      };
    },
    gameChatUsers() {
      return Object.values(this.store.player)
        .concat(Object.values(this.store.viewer || {}))
        .reduce((obj, { userId, isViewer }) => {
          let user = { ...this.lobby.users?.[userId] };
          if (isViewer) user.name = `${user.name || 'Гость'} (наблюдатель)`;
          return Object.assign(obj, { [userId]: user });
        }, {});
    },
    handCardsWidth() {
      const cardWidth = 130;
      const maxCardStack = 4;
      return state.isMobile ? `${cardWidth}px` : `${Math.ceil(1 / maxCardStack) * cardWidth}px`;
    },
    restoringGameState() {
      return this.game.status === 'RESTORING_GAME';
    },
    statusLabel() {
      return this.restoringGameState ? 'Восстановление игры' : this.game.statusLabel;
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
@import '@/mixins.scss';

#gamePlane {
  .game-zones {
    width: 100%;
    height: 100%;

    [code='Deck[card_zone_flop]'] {
      position: absolute;
      left: calc(50% - 60px - 10px - 120px);
      top: calc(50% - 90px);
      z-index: 1;
    }
    [code='Deck[card_zone_turn]'] {
      position: absolute;
      left: calc(50% - 60px);
      top: calc(50% - 90px);
    }
    [code='Deck[card_zone_river]'] {
      position: absolute;
      left: calc(50% + 60px + 10px);
      top: calc(50% - 90px);
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
  background-image: url(./assets/back-side.jpg);
}

.deck > .card-event:hover {
  box-shadow: inset 0 0 0 1000px rgba(255, 255, 255, 0.5);
  color: black !important;
}

.deck[code='Deck[card]'] {
  position: absolute;
  top: 35px;
  right: 30px;
  cursor: default;
}

.deck[code='Deck[card_drop]'],
.deck[code='SuperDeck[card_drop]'] {
  position: absolute;
  filter: grayscale(1);
  transform: scale(0.5);
  top: 65px;
  right: -10px;
  cursor: default;

  > .card-event {
    color: #ccc;
  }
}

.deck[code='Deck[card_active]'],
.deck[code='SuperDeck[card_active]'] {
  position: absolute;
  top: 140px;
  right: 0px;
  display: flex;

  .card-event {
    margin-top: -135px;

    &:first-child {
      margin-top: 0px !important;
    }
  }
}

.deck-active {
  display: flex;
  flex-direction: column;
}

.deck[code='SuperDeck[card]'],
.deck[code='SuperDeck[card_active]'],
.deck[code='SuperDeck[card_drop]'] {
  display: none;
}

.decks.show-super {
  .deck[code='SuperDeck[card]'],
  .deck[code='SuperDeck[card_active]'],
  .deck[code='SuperDeck[card_drop]'] {
    display: block;
  }

  .deck[code='SuperDeck[card]'] {
    position: absolute;
    top: 35px;
    right: 30px;
    cursor: default;
  }

  .deck[code='Deck[card]'] {
    right: 130px;
  }

  .deck[code='Deck[card_drop]'] {
    right: 90px;
  }
}

.game-status-label {
  position: absolute;
  top: 0px;
  right: 0px;
  z-index: 1;

  text-align: right;
  color: white;
  font-weight: bold;
  font-size: 2em;
  white-space: nowrap;
  text-shadow: black 1px 0 10px;

  > small {
    display: block;
    font-size: 50%;
  }
}

#game.mobile-view .game-status-label {
  font-size: 1.5em;
}

.plane {
  position: absolute;
  transform-origin: 0 0;
}

.plane.card-event {
  display: block;
  margin: 0px;
}

.plane.preview {
  opacity: 0.5;
}

.fake-plane {
  position: absolute;
  background: #ffa500;
  border: 1px solid;
  opacity: 0.5;

  &:hover {
    opacity: 1;
    z-index: 1;
    cursor: pointer;
  }

  &.low-zindex {
    z-index: -1;
  }

  &.hidden {
    display: none;
  }
}

.player {
  margin-left: 60px;
}

.games {
  z-index: 1;
  position: absolute;
  left: 40px;
  bottom: 0px;
  height: 50px;
  display: flex;
  flex-direction: row;
  transform: rotate(-90deg);
  transform-origin: bottom left;

  .game-item {
    background: grey;
    color: white;
    font-size: 24px;
    padding: 4px 10px;
    margin-top: 4px;
    border: 1px solid black;
    border-radius: 4px;
    margin-right: 20px;
    width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      cursor: pointer;
      opacity: 0.7;
    }

    &.selectable {
      box-shadow: 0 0 20px 8px yellow !important;
    }

    &.selected {
      box-shadow: 0px 10px 2px 0px green;
    }

    &.super {
      display: none;
      background: gold;
      color: black;
    }

    &:not(.round-ready) {
      background: orange;
    }

    &.my {
      background: #3f51b5;
    }
  }
}

#game.mobile-view {
  &.portrait-view {
    .player {
      margin-left: 0px;
      margin-right: 60px;
    }

    .games {
      position: absolute;
      left: 100%;
      top: 0px;
      height: 40px;
      display: flex;
      flex-direction: row;
      transform: rotate(90deg);
      transform-origin: top left;
    }

    .deck-active {
      flex-direction: row-reverse;
    }

    .deck[code='Deck[card_active]'] {
      .card-event {
        margin-top: 0px;
        margin-left: -75px;
      }
    }
  }

  .game-status-label {
    font-size: 1.5em;
  }
}

.action-btn-block {
  @include flex($wrap: wrap, $align: flex-end);
  width: 100%;
  height: 120px;

  > .action-btn {
    position: relative;
  }
}

#game[type='poker'] {
  .iam {
    .end-round-timer {
      bottom: auto;
      top: 28px;
      margin: auto;
      height: 30px;
      line-height: 30px;
      font-size: 30px;
      width: 100%;
      text-shadow: none;
    }
  }
}
</style>
