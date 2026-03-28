import type { DomainLobbyUserClass, DomainLobbyUserInstance } from '../../lobby/types/User';

export interface DomainUserInstance extends DomainLobbyUserInstance {}

export interface DomainUserClass extends DomainLobbyUserClass {
  new (data?: { id?: string }): DomainUserInstance;
}

declare function createDomainUserClass(): DomainUserClass;

export = createDomainUserClass;
