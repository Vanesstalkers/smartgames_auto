import * as _Game from 'application/lib/game/types';
import { GameObject, GameObjectData, GameObjectConfig, objects as _objects } from 'application/lib/game/types';
import { ObjectId } from 'mongodb';

export default class Game extends _Game {
  checkStatus(data: { cause: string }): void;
}

export namespace objects {
  class Player extends _objects.Player {}
  class Deck extends _objects.Deck {}
  class Card extends _objects.Card {}
}
