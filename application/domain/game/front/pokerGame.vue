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
        <div v-if="showPlayerControls" class="game-info">
          {{ `В банке: ${roundData.betSum}₽` }}
          <br />
          {{ `Текущая ставка: ${roundData.maxBet}₽` }}
        </div>
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
        <div
          v-for="deck in deckList"
          :key="deck._id"
          :class="['deck', deck.code.includes('_drop') ? 'drop' : '']"
          :code="deck.code"
        >
          <div class="card-event">
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
              <div>
                <div v-if="showPlayerControls" class="money" :class="{ over: overLimitHover }">
                  {{
                    new Intl.NumberFormat().format(
                      Math.max(0, (money || 0) - (selectingBet ? displayTotalAmount : 0))
                    ) + '₽'
                  }}
                </div>
              </div>
            </template>
            <template #timer="{ timer, showTimer } = {}">
              <div v-if="showTimer" class="end-round-timer">{{ timer }}</div>
            </template>
            <template #custom>
              <div class="blind">
                <img v-if="playerId === roundData.bigBlindPlayerId" :src="chipImgs.bb" />
                <img v-if="playerId === roundData.smallBlindPlayerId" :src="chipImgs.sb" />
              </div>
              <div
                v-if="showPlayerControls && chipsList.length"
                class="chips-panel"
                :class="[{ 'select-mode': selectingBet }]"
                :style="{ top: `-${chipsPanelTopOffset}px` }"
              >
                <div v-for="chip in chipsList" :key="chip.code" class="chip-col" :style="{ width: chip.size + 'px' }">
                  <div class="chip-stack" :style="{ height: chip.stackHeight + 'px', width: chip.size + 'px' }">
                    <img
                      v-for="individualChip in individualChips[chip.code]"
                      :key="individualChip.id"
                      class="chip-img abs"
                      :src="individualChip.src"
                      :alt="individualChip.label"
                      :style="{
                        width: individualChip.size + 'px',
                        height: individualChip.size + 'px',
                        bottom: individualChip.bottom + 'px',
                        zIndex: individualChip.zIndex,
                        transform:
                          individualChip.position === individualChip.totalInStack
                            ? 'none'
                            : `rotate(${individualChip.rotation}deg)`,
                      }"
                      :class="[
                        selectingBet && individualChip.isHighlighted ? 'highlight' : '',
                        individualChip.isBlocked ? 'blocked-chip' : '',
                        individualChip.customData?.customClass || '',
                      ]"
                      @mouseenter="
                        selectingBet && !individualChip.isBlocked && setHover(chip.code, individualChip.position)
                      "
                      @mousemove="
                        selectingBet && !individualChip.isBlocked && setHover(chip.code, individualChip.position)
                      "
                      @mouseleave="selectingBet && clearHover(chip.code)"
                      @click="selectingBet && !individualChip.isBlocked && confirmRaise(chip.code)"
                    />
                  </div>
                  <div class="chip-count" :class="{ 'has-blocked': blockedChipsCount[chip.code] > 0 }">
                    {{
                      'x' +
                      (selectingBet
                        ? selectedByChip[chip.code] ??
                          (hoverIndex(chip.code) ? chip.count - hoverIndex(chip.code) + 1 : chip.count)
                        : chip.count)
                    }}
                  </div>
                </div>
              </div>
            </template>
            <template v-if="showPlayerControls && game.roundStep === 'BET'" #control="{ controlAction } = {}">
              <div v-if="player.eventData?.controlBtn?.label === 'DEBUG'">
                <div class="action-btn end-round-btn" @click="controlAction">
                  {{ 'DEBUG' }}
                </div>
              </div>
              <template v-else-if="sessionPlayerIsActive()">
                <div class="action-btn-block" v-if="!selectingBet">
                  <div class="action-btn end-round-btn" @click="startRaise(controlAction)">
                    {{ 'Повысить' }}
                  </div>
                  <div
                    :class="['action-btn', 'end-round-btn', betToCall <= 0 ? 'disabled' : '']"
                    @click="controlAction({ action: 'call', amount: betToCall })"
                  >
                    <span v-if="betToCall > 0">Уравнять за {{ betToCall }}₽</span>
                    <span v-else>Уравнять</span>
                  </div>
                  <div
                    :class="['action-btn', 'end-round-btn', betToCall > 0 ? 'disabled' : '']"
                    @click="controlAction({ action: 'check' })"
                  >
                    {{ 'Пропустить' }}
                  </div>
                  <div class="action-btn end-round-btn" @click="controlAction({ action: 'reset' })">
                    {{ 'Сбросить' }}
                  </div>
                </div>
                <div class="action-btn-block select-mode-btns" v-else>
                  <div class="action-btn end-round-btn cancel-btn" @click="cancelRaise()">
                    {{ 'Отменить' }}
                  </div>
                  <div class="action-btn end-round-btn bet-btn" @click="placeRaise()">
                    {{ `Повысить на ${new Intl.NumberFormat().format(displayTotalAmount)}₽` }}
                  </div>
                </div>
              </template>
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
            <template #custom>
              <div class="blind">
                <img v-if="id === roundData.bigBlindPlayerId" :src="chipImgs.bb" />
                <img v-if="id === roundData.smallBlindPlayerId" :src="chipImgs.sb" />
              </div>
            </template>
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

// локальные изображения фишек
import chip5 from './assets/chip-5.png';
import chip25 from './assets/chip-25.png';
import chip50 from './assets/chip-50.png';
import chip100 from './assets/chip-100.png';
import chipSB from './assets/small-blind.png';
import chipBB from './assets/big-blind.png';

// Константы
const DECK_CODES = [
  // TO_CHANGE
  /* 'Deck[card_client]',
  'Deck[card_feature]',
  'Deck[card_credit]',
  'Deck[card_car]',
  'Deck[card_service]',
  'Deck[card_client_drop]',
  'Deck[card_feature_drop]',
  'Deck[card_credit_drop]',
  'Deck[card_car_drop]',
  'Deck[card_service_drop]', */
];

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
  data() {
    return {
      // номиналы фишек
      chipDenoms: { red: 5, green: 25, blue: 50, black: 100 },
      // изображения фишек из локальной папки ./assets
      chipImgs: { red: chip5, green: chip25, blue: chip50, black: chip100, sb: chipSB, bb: chipBB },
      chipSize: 30,
      chipRotations: {},
      chipOffsets: {},
      selectingBet: false,
      hoverByChip: {}, // { code: countHovered }
      pendingControlAction: null,
      // выбор по столбцам: { red: 0, green: 0, ... }
      selectedByChip: {},
    };
  },
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
    player() {
      const playerId = this.gameState?.sessionPlayerId;
      return this.store.player?.[playerId] || {};
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
    roundData() {
      const roundData = this.game.roundData;
      roundData.maxBet = Object.values(roundData.bets || {}).reduce((max, bet) => Math.max(max, bet.amount || 0), 0);
      roundData.betSum = Object.values(roundData.bets || {}).reduce((sum, bet) => sum + (bet.amount || 0), 0);
      return roundData;
    },
    playerIds() {
      const ids = Object.keys(this.game.playerMap || {}).sort((id1, id2) => (id1 > id2 ? 1 : -1));
      if (this.gameState.viewerMode) return ids;
      const curPlayerIdx = ids.indexOf(this.gameState.sessionPlayerId);
      const result = ids.slice(curPlayerIdx + 1).concat(ids.slice(0, curPlayerIdx));
      return result.reverse(); // делаем reverse для эмуляции расположения игроков вокруг стола
    },
    showPlayerControls() {
      return this.player.ready && (this.game.status === 'IN_PROCESS' || this.game.status === 'PREPARE_START');
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
      const decks = Object.keys(this.game.deckMap).map((id) => this.store.deck?.[id]) || [];
      return decks.filter(({ code }) => DECK_CODES.includes(code));
    },
    // Вычисляем количество фишек на основе денег игрока
    chipsCounts() {
      const playerMoney = this.playerMoney;
      const denoms = this.chipDenoms;
      const chips = { red: 0, green: 0, blue: 0, black: 0 };

      const bankSize = playerMoney;
      let remainingMoney = playerMoney;
      let divisionRemainderPart = 0;

      if (bankSize < 100) {
        // Маленький банк - только красные и зеленые
        chips.red = Math.min(Math.floor(remainingMoney / denoms.red), 15);
        remainingMoney -= chips.red * denoms.red;
        divisionRemainderPart = remainingMoney % denoms.green;
        if (divisionRemainderPart > 0) {
          chips.red += divisionRemainderPart / denoms.red;
          remainingMoney -= divisionRemainderPart;
        }
        chips.green = Math.min(Math.floor(remainingMoney / denoms.green), 8);
      } else if (bankSize < 500) {
        // Средний банк - добавляем синие
        chips.red = Math.min(Math.floor(remainingMoney / denoms.red), 12);
        remainingMoney -= chips.red * denoms.red;
        divisionRemainderPart = remainingMoney % denoms.green;
        if (divisionRemainderPart > 0) {
          chips.red += divisionRemainderPart / denoms.red;
          remainingMoney -= divisionRemainderPart;
        }
        chips.green = Math.min(Math.floor(remainingMoney / denoms.green), 8);
        remainingMoney -= chips.green * denoms.green;
        divisionRemainderPart = remainingMoney % denoms.blue;
        if (divisionRemainderPart > 0) {
          chips.green += divisionRemainderPart / denoms.green;
          remainingMoney -= divisionRemainderPart;
        }
        chips.blue = Math.min(Math.floor(remainingMoney / denoms.blue), 6);
      } else {
        // Большой банк - все номиналы
        chips.red = Math.min(Math.floor(remainingMoney / denoms.red), 10);
        remainingMoney -= chips.red * denoms.red;
        divisionRemainderPart = remainingMoney % denoms.green;
        if (divisionRemainderPart > 0) {
          chips.red += divisionRemainderPart / denoms.red;
          remainingMoney -= divisionRemainderPart;
        }
        chips.green = Math.min(Math.floor(remainingMoney / denoms.green), 8);
        remainingMoney -= chips.green * denoms.green;
        divisionRemainderPart = remainingMoney % denoms.blue;
        if (divisionRemainderPart > 0) {
          chips.green += divisionRemainderPart / denoms.green;
          remainingMoney -= divisionRemainderPart;
        }
        chips.blue = Math.min(Math.floor(remainingMoney / denoms.blue), 6);
        remainingMoney -= chips.blue * denoms.blue;
        divisionRemainderPart = remainingMoney % denoms.black;
        if (divisionRemainderPart > 0) {
          chips.blue += divisionRemainderPart / denoms.blue;
          remainingMoney -= divisionRemainderPart;
        }
        chips.black = Math.min(Math.floor(remainingMoney / denoms.black), 4);
      }

      return chips;
    },
    chipsList() {
      const order = ['red', 'green', 'blue', 'black'];

      return order.map((code) => ({
        code,
        label: this.chipDenoms[code] + '',
        count: this.chipsCounts[code] || 0,
        src: this.chipImgs[code],
        size: this.chipSize,
        overlapStep: Math.max(1, Math.round(this.chipSize * 0.1)),
        stackHeight:
          (this.chipsCounts[code] || 0) > 0
            ? (this.chipsCounts[code] - 1) * Math.max(1, Math.round(this.chipSize * 0.5)) + this.chipSize
            : 0,
      }));
    },
    // Создаем массив отдельных фишек для каждого номинала
    // Каждая фишка теперь является отдельным объектом с индивидуальными атрибутами
    individualChips() {
      const chips = {};
      const order = ['red', 'green', 'blue', 'black'];

      order.forEach((code) => {
        const count = this.chipsCounts[code] || 0;
        chips[code] = Array.from({ length: count }, (_, index) => ({
          id: `${code}-${index + 1}`, // Уникальный ID фишки
          code, // Номинал фишки (red, green, blue, black)
          label: this.chipDenoms[code] + '', // Текстовая метка
          src: this.chipImgs[code], // Путь к изображению
          size: this.chipSize, // Размер фишки
          position: index + 1, // Позиция в стопке (снизу вверх, начиная с 1)
          totalInStack: count, // Общее количество фишек в стопке
          rotation: this.getChipRotation(code, index + 1), // Угол поворота
          isSelected: this.isChipSelected(code, index + 1), // Выбрана ли фишка
          isHighlighted: this.isChipHighlighted(code, index + 1), // Подсвечена ли
          isBlocked: this.isChipBlocked(code, index + 1), // Заблокирована ли фишка
          bottom: index * Math.max(1, Math.round(this.chipSize * 0.2)), // Позиция снизу
          zIndex: index + 1, // Z-индекс для наложения

          // Индивидуальные атрибуты фишки - можно добавлять любые
          customAttributes: {
            stackPosition: index + 1, // Позиция в стопке
          },

          // Произвольные данные фишки (любой объект)
          customData: {
            // Здесь можно хранить любые данные
            // customClass: 'my-custom-class',
            // metadata: { ... },
            // history: [ ... ],
          },
        }));
      });

      return chips;
    },
    // Вычисляем количество заблокированных фишек на основе maxBet
    blockedChipsCount() {
      const maxBet = this.roundData.maxBet || 0;
      const playerMoney = this.playerMoney;

      // Если у игрока недостаточно денег для maxBet, блокируем все фишки
      if (playerMoney < maxBet) {
        return {
          red: this.chipsCounts.red || 0,
          green: this.chipsCounts.green || 0,
          blue: this.chipsCounts.blue || 0,
          black: this.chipsCounts.black || 0,
        };
      }

      // Если maxBet равен 0, ничего не блокируем
      if (maxBet === 0) {
        return { red: 0, green: 0, blue: 0, black: 0 };
      }

      // Вычисляем заблокированные фишки, начиная с максимального номинала НЕ ПРЕВЫШАЮЩЕГО maxBet
      // Заблокированные фишки будут визуально вверху стопки
      const denoms = this.chipDenoms;
      const order = ['black', 'blue', 'green', 'red']; // От максимального к минимальному
      const blocked = { red: 0, green: 0, blue: 0, black: 0 };
      let remainingBet = maxBet;

      for (const code of order) {
        const denom = denoms[code];
        const availableChips = this.chipsCounts[code] || 0;

        // Блокируем фишки только если их номинал НЕ ПРЕВЫШАЕТ оставшуюся сумму
        if (remainingBet > 0 && availableChips > 0 && denom <= remainingBet) {
          // Вычисляем, сколько фишек этого номинала можно заблокировать
          // Без превышения оставшейся суммы
          const maxPossibleChips = Math.floor(remainingBet / denom);
          const chipsToBlock = Math.min(maxPossibleChips, availableChips);

          if (chipsToBlock > 0) {
            blocked[code] = chipsToBlock;
            remainingBet -= chipsToBlock * denom;
          }
        }
      }

      // Дополнительная проверка: убеждаемся, что сумма заблокированных фишек не превышает maxBet
      const totalBlockedValue = Object.entries(blocked).reduce((sum, [code, count]) => {
        return sum + (denoms[code] || 0) * count;
      }, 0);

      if (totalBlockedValue > maxBet) {
        console.warn(`ОШИБКА: Сумма заблокированных фишек (${totalBlockedValue}) превышает maxBet (${maxBet})`);
      }

      return blocked;
    },
    blockedChipsSum() {
      return Object.entries(this.blockedChipsCount).reduce((sum, [code, count]) => {
        return sum + this.getDenom(code) * count;
      }, 0);
    },
    maxStackHeight() {
      const list = this.chipsList;
      if (!list.length) return 0;
      return Math.max(...list.map((c) => c.stackHeight));
    },
    chipsPanelTopOffset() {
      // высота самой высокой стопки + небольшой отступ
      return this.maxStackHeight + 20;
    },
    selectedTotalAmount() {
      const denomMap = { red: 5, green: 25, blue: 50, black: 100 };
      return Object.entries(this.selectedByChip).reduce((sum, [code, count]) => {
        return sum + (denomMap[code] || 0) * (count || 0);
      }, 0);
    },
    // отображаемая сумма учитывает текущее наведение, если есть
    displayTotalAmount() {
      let sumUnits = 0;
      for (const chip of this.chipsList) {
        const fixed = this.selectedByChip[chip.code]
          ? this.selectedByChip[chip.code] - this.blockedChipsCount[chip.code]
          : null;

        // Учитываем заблокированные фишки при расчете доступных
        const blockedCount = this.blockedChipsCount[chip.code] || 0;
        const availableChips = Math.max(0, chip.count - blockedCount);

        const requestedHover = this.requestedHoverCount(chip.code, availableChips);
        const count = this.selectingBet ? fixed ?? this.allowedCountFor(chip.code, requestedHover) : 0;
        sumUnits += this.getDenom(chip.code) * (count || 0);
      }
      return sumUnits + this.blockedChipsSum;
    },
    playerMoney() {
      return Number(this.player.money) || 0;
    },
    playerBet() {
      const bet = this.roundData.bets[this.gameState?.sessionPlayerId];
      return Number(bet?.amount) || 0;
    },
    betToCall() {
      return this.roundData.maxBet - this.playerBet;
    },
    fixedSelectedAmountUnits() {
      return Object.entries(this.selectedByChip).reduce(
        (sum, [code, count]) => sum + this.getDenom(code) * (count || 0),
        0
      );
    },
    remainingMoneyUnits() {
      const remain = this.playerMoney - this.fixedSelectedAmountUnits;
      return remain > 0 ? remain : 0;
    },
    overLimitHover() {
      // true, если запроса hover + фикс превышают деньги игрока
      let requestedUnits = this.fixedSelectedAmountUnits;
      for (const chip of this.chipsList) {
        if (this.selectedByChip[chip.code] != null) continue;

        // Учитываем заблокированные фишки при расчете доступных
        const blockedCount = this.blockedChipsCount[chip.code] || 0;
        const availableChips = Math.max(0, chip.count - blockedCount);

        const req = this.requestedHoverCount(chip.code, availableChips);
        const allowed = this.allowedCountFor(chip.code, req);
        // если ограничили — значит пытаемся превысить
        if (req > allowed) return true;
        requestedUnits += this.getDenom(chip.code) * (allowed || 0);
        if (requestedUnits > this.playerMoney) return true;
      }
      return false;
    },
  },
  methods: {
    customMenu({ menuWrapper, menuButtonsMap } = {}) {
      if (!menuButtonsMap) return [];

      const { cancel, restore, tutorials, helperLinks, leave } = menuButtonsMap();
      const fillTutorials = tutorials({
        showList: [
          { title: 'Стартовое приветствие игры', action: { tutorial: 'game-poker-tutorial-start' } },
          { title: 'Управление игровым полем', action: { tutorial: 'game-tutorial-gamePlane' } },
        ],
      });

      return menuWrapper({
        buttons: [cancel(), restore(), fillTutorials, helperLinks({ inGame: true }), leave()],
      });
    },
    getDenom(code) {
      const map = { red: 5, green: 25, blue: 50, black: 100 };
      return map[code] || 0;
    },
    requestedHoverCount(code, total) {
      const topIndex = this.hoverIndex(code);
      return topIndex ? total - topIndex + 1 : 0;
    },
    allowedCountFor(code, requestedCount) {
      const denom = this.getDenom(code);
      if (!denom) return 0;

      const totalChips = this.chipsCounts[code] || 0;

      // Ограничиваем по доступным фишкам и деньгам
      const maxByCash = Math.floor(this.remainingMoneyUnits / denom);
      const maxByChips = totalChips;

      return Math.max(0, Math.min(requestedCount || 0, Math.min(maxByCash, maxByChips)));
    },
    rotationAngle(code, n) {
      // нижнюю фишку не вращаем
      if (n === 1) return 0;
      const key = `${code}-${n}`;
      if (!(key in this.chipRotations)) {
        const range = 180; // стабильный разброс: ±12° (можно поменять)
        const deg = (Math.random() * range - range / 2).toFixed(1);
        this.chipRotations[key] = +deg;
      }
      return this.chipRotations[key];
    },
    // Методы для работы с индивидуальными фишками
    getChipRotation(code, position) {
      // нижнюю фишку не вращаем
      if (position === 1) return 0;
      const key = `${code}-${position}`;
      if (!(key in this.chipRotations)) {
        const range = 180; // стабильный разброс: ±12° (можно поменять)
        const deg = (Math.random() * range - range / 2).toFixed(1);
        this.chipRotations[key] = +deg;
      }
      return this.chipRotations[key];
    },
    isChipSelected(code, position) {
      const fixed = this.selectedByChip[code];
      if (fixed != null) {
        // Если есть зафиксированный выбор, проверяем, входит ли фишка в выбранные
        const totalInStack = this.chipsCounts[code] || 0;
        return position > totalInStack - fixed;
      }
      return false;
    },
    isChipHighlighted(code, position) {
      // Заблокированные фишки не подсвечиваются
      if (this.isChipBlocked(code, position)) {
        return false;
      }

      const fixed = this.selectedByChip[code];
      if (fixed != null) {
        // Если есть зафиксированный выбор, используем его
        const totalInStack = this.chipsCounts[code] || 0;
        return position > totalInStack - fixed;
      }
      // Иначе используем hover
      const requested = this.requestedHoverCount(code, this.chipsCounts[code] || 0);
      const hoveredCount = this.allowedCountFor(code, requested);
      const totalInStack = this.chipsCounts[code] || 0;
      return position > totalInStack - hoveredCount;
    },
    isChipBlocked(code, position) {
      // Проверяем, заблокирована ли фишка на основе maxBet
      const blockedCount = this.blockedChipsCount[code] || 0;
      const totalInStack = this.chipsCounts[code] || 0;

      // Блокируем фишки сверху вниз (последние заблокированные фишки)
      return position > totalInStack - blockedCount;
    },
    chipOffset() {
      return 0;
    },
    // управление режимом Raise через выбор фишек
    startRaise(controlAction) {
      this.selectingBet = true;
      this.pendingControlAction = controlAction;
      // сброс возможного старого ховера
      this.hoverByChip = {};
    },
    setHover(code, n) {
      // n — индекс снизу; для выбора сверху считаем верхней = chip.count
      this.$set ? this.$set(this.hoverByChip, code, n) : (this.hoverByChip = { ...this.hoverByChip, [code]: n });
    },
    clearHover(code) {
      const { [code]: _, ...rest } = this.hoverByChip;
      this.hoverByChip = rest;
    },
    hoverIndex(code) {
      return this.hoverByChip[code] || 0;
    },
    confirmRaise(code) {
      // фиксируем количество по столбцу при клике
      const chip = this.chipsList.find((c) => c.code === code) || { count: 0 };
      const requested = this.requestedHoverCount(code, chip.count);
      const count = this.allowedCountFor(code, requested);
      // если уже был фикс, включаем режим «перемещением»: будем использовать hover как текущий выбор
      if (this.selectedByChip[code] != null) {
        // снимаем фикс, теперь подсветка/сумма будет от ховера
        const { [code]: _, ...rest } = this.selectedByChip;
        this.selectedByChip = rest;
      } else {
        this.selectedByChip = { ...this.selectedByChip, [code]: count };
      }
    },
    highlightChip(code, n, total) {
      // подсветка должна сохраняться после клика — используем зафиксированный выбор, если он есть
      const fixed = this.selectedByChip[code];
      if (fixed != null) return n > total - fixed; // верхние fixed элементов
      const requested = this.requestedHoverCount(code, total);
      const hoveredCount = this.allowedCountFor(code, requested);
      return n > total - hoveredCount;
    },
    cancelRaise() {
      this.selectingBet = false;
      this.hoverByChip = {};
      this.selectedByChip = {};
      this.pendingControlAction = null;
    },
    placeRaise() {
      if (!this.pendingControlAction) return;
      const amount = this.selectedTotalAmount + this.blockedChipsSum;
      this.pendingControlAction({ action: 'raise', amount, selected: { ...this.selectedByChip } });
      this.selectingBet = false;
      this.hoverByChip = {};
      this.selectedByChip = {};
      this.pendingControlAction = null;
    },
    // Методы для работы с индивидуальными атрибутами фишек
    updateChipAttribute(chipId, attribute, value) {
      // Находим фишку по ID и обновляем её атрибут
      const [code, positionStr] = chipId.split('-');
      const position = parseInt(positionStr);

      // Обновляем атрибут в customAttributes
      if (this.individualChips[code] && this.individualChips[code][position - 1]) {
        this.$set
          ? this.$set(this.individualChips[code][position - 1].customAttributes, attribute, value)
          : (this.individualChips[code][position - 1].customAttributes = {
              ...this.individualChips[code][position - 1].customAttributes,
              [attribute]: value,
            });
      }
    },
    getChipAttribute(chipId, attribute) {
      // Получаем значение атрибута конкретной фишки
      const [code, positionStr] = chipId.split('-');
      const position = parseInt(positionStr);

      if (this.individualChips[code] && this.individualChips[code][position - 1]) {
        return this.individualChips[code][position - 1].customAttributes[attribute];
      }
      return null;
    },
    setChipCustomData(chipId, data) {
      // Устанавливаем произвольные данные для фишки
      const [code, positionStr] = chipId.split('-');
      const position = parseInt(positionStr);

      if (this.individualChips[code] && this.individualChips[code][position - 1]) {
        this.$set
          ? this.$set(this.individualChips[code][position - 1], 'customData', data)
          : (this.individualChips[code][position - 1].customData = data);
      }
    },
    getChipCustomData(chipId) {
      // Получаем произвольные данные фишки
      const [code, positionStr] = chipId.split('-');
      const position = parseInt(positionStr);

      if (this.individualChips[code] && this.individualChips[code][position - 1]) {
        return this.individualChips[code][position - 1].customData;
      }
      return null;
    },
    // Пример: добавить произвольные данные к фишке
    addCustomDataToChip(chipId, data) {
      this.setChipCustomData(chipId, data);
    },
  },
};
</script>
<style lang="scss">
@import '@/mixins.scss';

@import './css/game.css';

#gamePlane {
  @include flex();

  .game-zones {
    width: 100%;
    height: 100%;

    .game-info {
      position: absolute;
      left: calc(50% - 80px);
      top: calc(50% - 140px);
      width: calc(118px + 40px);
      text-align: center;
      color: #f4e205;
    }

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

.deck[code='Deck[card_drop]'] {
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

.deck[code='Deck[card_active]'] {
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

    &:hover {
      color: #f4e205;
    }

    &.disabled {
      color: #888 !important;
      > span {
        cursor: not-allowed;
      }
    }
  }
}

#game[type='poker'] {
  .blind {
    position: absolute;
    top: 0px;
    right: -20px;
    img {
      width: 40px;
    }
  }
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
    .blind {
      left: -20px;
      right: auto;
    }
  }
}

/* В режиме выбора делаем 2 кнопки «склеенными» у низа карточки */
.select-mode-btns {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: stretch;
  gap: 0;
  > .action-btn {
    position: relative;
    margin: 0;
  }
  .bet-btn {
    order: 1;
  }
  .cancel-btn {
    order: 2;
    background: #666 !important;
  }
}

.top-chip {
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.blocked-chip {
  filter: contrast(10%);
  cursor: not-allowed;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 0, 0, 0.3);
    border-radius: 50%;
    pointer-events: none;
  }
}

.chip-img {
  transition: all 0.2s ease;

  &.top-chip {
    border-radius: 50%;
  }

  &.blocked-chip {
    pointer-events: none;

    &:hover {
      transform: none !important;
    }
  }
}

/* Стили для отображения заблокированных фишек */
.chip-count {
  &.has-blocked {
    color: #ff6b6b;
  }

  .blocked-count {
    font-size: 0.8em;
    color: #ff4444;
    font-weight: bold;
  }
}

/* нижняя кнопка с закруглением во всех случаях */
.action-btn-block:not(.select-mode-btns) > .action-btn:last-child {
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}
.select-mode-btns > .cancel-btn {
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

.chips-panel {
  position: absolute;
  top: -70px;
  left: 0;
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 2px 4px;
  z-index: 2;

  .chip-col {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
  }

  .chip-stack {
    position: relative;
    background: transparent;
    border-radius: 0;
    width: 100%;
    filter: none;
    pointer-events: none;
  }

  .chip-img.abs {
    position: absolute;
    left: 0;
    border-radius: 50%;
    box-shadow: 0px 1px 0 1px black;
  }

  .chip-count {
    position: absolute;
    bottom: -15px;
    left: 50%;
    transform: translateX(-50%);
    font-weight: 700;
    font-size: 12px;
    color: #f4e205; /* желтоватый, как на макете */
    white-space: nowrap;
    z-index: 3;
  }

  &.select-mode {
    .chip-stack {
      pointer-events: auto;
    }
    .chip-img.abs {
      cursor: pointer;
      pointer-events: auto;
      transition:
        filter 120ms ease,
        transform 120ms ease;
      filter: brightness(0.5) grayscale(0.3); // по умолчанию затемнены
    }
    .chip-img.abs.highlight,
    .chip-img.abs.blocked-chip {
      filter: none; // подсветка выбранных
    }
  }
}

.hand-cards {
  & > .card-event {
    margin-left: -40px;
  }
}
</style>
