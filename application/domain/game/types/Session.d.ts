import type { GameSessionClass, GameSessionInstance } from '../../../lib/game/types/Session';

export interface DomainGameSessionInstance extends GameSessionInstance {}

export interface DomainGameSessionClass extends GameSessionClass {
  new (data?: { id?: string; client?: any }): DomainGameSessionInstance;
}

declare function createDomainGameSessionClass(): DomainGameSessionClass;

export = createDomainGameSessionClass;
