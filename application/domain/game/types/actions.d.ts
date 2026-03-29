import type { GameActionsModule } from '../../../lib/game/types/actions';
import type { DomainGameInstance } from './Class';

export interface DomainGameActionsModule extends GameActionsModule {
  fillGameData(this: DomainGameInstance, data: Record<string, any> & { newGame?: boolean }): DomainGameInstance;
  startGame(this: DomainGameInstance): void;
  roundEnd(this: DomainGameInstance, opts?: { timerOverdue?: boolean }, initPlayer?: any): void;
  endGame(
    this: DomainGameInstance,
    opts?: { winningPlayer?: any; canceledByUser?: string | boolean; message?: string }
  ): never;
  initGameProcessEvents(this: DomainGameInstance): any;
  getGameAward(this: DomainGameInstance): number;
}
