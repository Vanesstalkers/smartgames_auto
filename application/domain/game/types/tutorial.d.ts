import type { GameTutorialModule } from '../../../lib/game/types/tutorial';

export interface DomainGameTutorialModule extends GameTutorialModule {
  links(): Record<string, any>;
  start: Record<string, any>;
}
