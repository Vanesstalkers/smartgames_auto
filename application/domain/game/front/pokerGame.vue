<template>
  <game :debug="false" :planeScaleMin="0.2" :planeScaleMax="1" :status="game.status">
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
import pokerGameGlobals, { gameCustomArgs } from '~/domain/game/front/pokerGameGlobals.mjs';
import game from '~/lib/game/front/Game.vue';
import tutorial from '~/lib/helper/front/helper.vue';
import chat from '~/lib/chat/front/chat.vue';
import card from '~/lib/game/front/components/card.vue';

import player from '~/domain/game/front/components/player.vue';

export default {
  components: {
    game,
    tutorial,
    chat,
    card,
    player,
  },
  props: {},
  setup() {
    const gameGlobals = prepareGameGlobals({
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
    gamePlaneContentControlStyle(gameId) {
      const transformOrigin = this.gameCustom.gamePlaneTransformOrigin[gameId] ?? 'center center';

      const rotation =
        gameId === this.focusedGameId()
          ? this.gameCustom.gamePlaneRotation
          : this.gameCustom.gamePlaneRotations[gameId];

      const transform = [
        //
        `rotate(${rotation}deg)`,
      ].join(' ');
      return { transform, transformOrigin };
    },
    gamePlaneStyle(gameId) {
      const { x, y } = this.getGamePlaneOffsets()[gameId];
      return { transform: `translate(${x}px, ${y}px)` };
    },
    sortedActiveCards(arr) {
      return arr
        .map((id) => this.store.card?.[id] || {})
        .sort((a, b) => (a.played > b.played ? 1 : -1)) // сортируем по времени сыгрывания
        .sort((a, b) => (a.played ? 0 : 1)); // переносим не сыгранные в конец
    },
    async takeDice() {
      // return;
      await this.handleGameApi({ name: 'takeDice', data: { count: 3 } });
    },
    async takeCard() {
      // return;
      await this.handleGameApi({ name: 'takeCard', data: { count: 5 } });
    },
    possibleAddPlanePositions(game) {
      if (!this.sessionPlayerIsActive()) return [];
      const availablePorts = this.sessionPlayer().eventData.availablePorts || [];
      const positions = availablePorts
        .filter(({ gameId }) => gameId === game.gameId)
        .map(
          ({
            gameId,
            joinPlaneId,
            joinPortId,
            joinPortDirect,
            targetPortId,
            targetPortDirect,
            position,
            linkedPlanes,
          }) => {
            return {
              code: joinPortId + joinPortDirect + targetPortId + targetPortDirect,
              ...{ gameId, joinPlaneId, joinPortId, joinPortDirect, targetPortId, targetPortDirect },
              style: {
                left: position.left + 'px',
                top: position.top + 'px',
                width: position.right - position.left + 'px',
                height: position.bottom - position.top + 'px',
                rotation: position.rotation,
              },
              linkedPlanes,
            };
          }
        );

      return positions;
    },
    async previewPlaneOnField(event, previewPosition) {
      const { code, gameId, joinPlaneId, style: previewStyle, linkedPlanes } = previewPosition;

      function prepareStyle(style) {
        switch (style.rotation) {
          case 1:
            style.left = parseInt(style.left) + parseInt(style.width);
            break;
          case 2:
            style.left = parseInt(style.left) + parseInt(style.width);
            style.top = parseInt(style.top) + parseInt(style.height);
            break;
          case 3:
            style.top = parseInt(style.top) + parseInt(style.height);
            break;
        }
        delete style.width;
        delete style.height;
      }

      const style = { ...previewStyle };
      prepareStyle(style);

      this.hidePreviewPlanes();
      if (!this.gameCustom.selectedFakePlanes[gameId]) this.$set(this.gameCustom.selectedFakePlanes, gameId, {});
      this.$set(this.gameCustom.selectedFakePlanes[gameId], joinPlaneId, style);

      for (const plane of linkedPlanes) {
        const { joinPlaneId, position } = plane;
        const style = {
          left: position.left + 'px',
          top: position.top + 'px',
          width: position.right - position.left + 'px',
          height: position.bottom - position.top + 'px',
          rotation: position.rotation,
        };
        prepareStyle(style);
        this.$set(this.gameCustom.selectedFakePlanes[gameId], joinPlaneId, style);
      }

      this.gameState.cardWorkerAction = {
        show: true,
        label: 'Сделать выбор',
        style: { background: '#ffa500' },
        sendApiData: {
          path: 'game.api.action',
          args: [
            {
              name: 'putPlaneOnField',
              data: {
                joinPortId: event.target.attributes.joinPortId.value,
                targetPortId: event.target.attributes.targetPortId.value,
                joinPortDirect: event.target.attributes.joinPortDirect.value,
                targetPortDirect: event.target.attributes.targetPortDirect.value,
              },
            },
          ],
        },
      };

      this.selectedFakePlanePosition = code;
    },
    zIndexDecrease(event) {
      clearTimeout(this.zIndexDecreaseChangeTimeout);

      this.zIndexDecreaseChangeTimeout = setTimeout(() => {
        event.target.classList.add('low-zindex');
      }, 1000);
    },
    zIndexRestore(event) {
      clearTimeout(this.zIndexDecreaseChangeTimeout);
      event.target.classList.remove('low-zindex');
    },
    async selectGame(gameId, { selectable }) {
      this.gameCustom.gamePlaneRotations = {
        ...this.gameCustom.gamePlaneRotations,
        [this.focusedGameId()]: this.gameCustom.gamePlaneRotation,
      };

      const rotation = this.gameCustom.gamePlaneRotations[gameId] || 0;
      this.resetMouseEventsConfig({ rotation });
      this.gameCustom.gamePlaneRotation = rotation;

      this.$set(this.gameCustom, 'selectedGameId', gameId);
      this.resetPlanePosition();

      if (selectable) {
        await this.handleGameApi({
          name: 'eventTrigger',
          data: {
            eventData: {
              targetId: gameId,
              targetPlayerId: this.$parent.playerId,
            },
          },
        });
      }
    },
  },
};
</script>
<style lang="scss">
#gamePlane {
  transform-origin: left top !important;

  .gp-content {
    position: absolute;
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
</style>
