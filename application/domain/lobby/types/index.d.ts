import type { LobbyClass } from '../../../lib/lobby/types/Class';
import type { DomainLobbySessionClass } from './Session';
import type { DomainLobbyTutorialModule } from './tutorial';
import type { DomainLobbyUserClass } from './User';

export interface DomainLobbyModule {
  User: DomainLobbyUserClass;
  Session: DomainLobbySessionClass;
  tutorial?: DomainLobbyTutorialModule;

  class?: LobbyClass;
  user?: DomainLobbyUserClass;
  session?: DomainLobbySessionClass;
}
