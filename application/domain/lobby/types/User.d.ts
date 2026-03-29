import type { LobbyUserClass, LobbyUserInstance } from '../../../lib/lobby/types/User';

export interface DomainLobbyUserInstance extends LobbyUserInstance {
  enterLobby(data: { sessionId: string; lobbyId: string }): Promise<void>;
}

export interface DomainLobbyUserClass extends LobbyUserClass {
  new (data?: { id?: string }): DomainLobbyUserInstance;
}

declare function createDomainLobbyUserClass(): DomainLobbyUserClass;

export = createDomainLobbyUserClass;
