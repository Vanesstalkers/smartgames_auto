import { Game, Player } from '../../lib/game/types';

// Domain Game Class - наследуется от lib.game.class и добавляет специфичные методы
export interface DomainGame extends Game {
  // Переопределенные методы
  players: () => { list: DomainPlayer[] };

  // Дополнительные методы для domain.game.class
  getFullPrice: () => number;
  stepLabel: (label: string) => string;
  removeTableCards: () => void;
  calcClientMoney: () => number;
  calcOffer: (options: { player: DomainPlayer; carCard: any; serviceCards: any[]; featureCard: any }) => any;
  showTableCards: () => void;
  restorePlayersHands: () => void;
  createClientDealDeck: () => any;
}

export interface DomainPlayer extends Player {
  money: number;
  prepareBroadcastData: (options: { data: { test: number }; player: DomainPlayer; viewerMode: boolean }) => {
    visibleId: string;
    preparedData: any;
  };
}

// Типы для domain.game
export type DomainGameModule = {
  class: new (storeData?: any, gameObjectData?: any) => DomainGame;
  _objects: {
    Player: new (storeData?: any, gameObjectData?: any) => DomainPlayer;
    Deck: new (storeData?: any, gameObjectData?: any) => any;
    Card: new (storeData?: any, gameObjectData?: any) => any;
  };
  actions?: any;
};
