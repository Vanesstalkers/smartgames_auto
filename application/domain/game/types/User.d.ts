import type { GameUserClass, GameUserInstance } from '../../../lib/game/types/User';

export interface DomainGameUserInstance extends GameUserInstance {}

export interface DomainGameUserClass extends GameUserClass {
  new (...args: any[]): DomainGameUserInstance;
}

declare function createDomainGameUserClass(): DomainGameUserClass;

export = createDomainGameUserClass;
