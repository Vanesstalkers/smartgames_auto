import type { LobbySessionClass, LobbySessionInstance } from '../../../lib/lobby/types/Session';

export interface DomainLobbySessionInstance extends LobbySessionInstance {}

export interface DomainLobbySessionClass extends LobbySessionClass {
  new (data?: { id?: string; client?: any }): DomainLobbySessionInstance;
}

declare function createDomainLobbySessionClass(): DomainLobbySessionClass;

export = createDomainLobbySessionClass;
