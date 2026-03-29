import createLibGameClass = require('../../../lib/game/types/Class');

export type LibGameInstance = InstanceType<ReturnType<typeof createLibGameClass>>;

export interface DomainGameInstance extends LibGameInstance {
  stepLabel(label: string): string;
  removeTableCards(): void;
  restorePlayersHands(): void;
}

export interface DomainGameClass {
  new (...args: ConstructorParameters<ReturnType<typeof createLibGameClass>>): DomainGameInstance;
}

declare function createDomainGameClass(): DomainGameClass;

export = createDomainGameClass;
