import type { GameObjectsModule } from '../../../lib/game/types/objects';
import type { DomainGameActionsModule } from './actions';
import type { DomainGameClass } from './Class';
import type { DomainGameConfigsModule } from './configs';
import type { DomainGameSessionClass } from './Session';
import type { DomainGameTutorialModule } from './tutorial';
import type { DomainGameUserClass } from './User';

export interface DomainGameModule {
  Class: DomainGameClass;
  User: DomainGameUserClass;
  Session: DomainGameSessionClass;

  class: DomainGameClass;
  user: DomainGameUserClass;
  session: DomainGameSessionClass;

  actions: DomainGameActionsModule & Record<string, any>;
  configs: DomainGameConfigsModule;
  tutorial: DomainGameTutorialModule;
  events?: Record<string, any>;
  _objects: GameObjectsModule;

  [gameType: string]: any;
}
