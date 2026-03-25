/* This import should not be removed. We need to reference impress explicitly
 * so that tsc correctly resolved global variables.
 * For some odd reason using typeRoots results in an array of errors.
 * The problem should have been fixed by having an index file but no luck.
 * PR with the correct fix would be greatly appreciated. */
import * as _impress from 'impress';

import * as _metasql from 'metasql';
import { Database } from 'metasql';

import { Database as MongoDB } from '../application/db/mongo/types';

declare global {
  namespace metarhia {
    const metasql: typeof _metasql;
  }

  namespace api { }

  namespace lib {
    const store: ((col: string) => Map<string, unknown>) & {
      Class: typeof import('../application/lib/store/types/Class');
      broadcaster: import('../application/lib/store/types/broadcaster').BroadcasterApi;
    };
    const user: {
      Class: typeof import('../application/lib/user/types/Class');
      Session: typeof import('../application/lib/user/types/Session');
      api: import('../application/lib/user/types/api').UserApiMethods;
    };
    const lobby: {
      Class: typeof import('../application/lib/lobby/types/Class');
      User: typeof import('../application/lib/lobby/types/User');
      Session: typeof import('../application/lib/lobby/types/Session');
      api: import('../application/lib/lobby/types/api').LobbyApiMethods;
    };
    const helper: import('../application/lib/helper/types/helper').HelperMethods & {
      api: import('../application/lib/helper/types/api').HelperApiMethods;
    };
    const chat: import('../application/lib/chat/types/chat').ChatModule & {
      api: import('../application/lib/chat/types/api').ChatApiMethods;
    };
    const game: {
      Class: typeof import('../application/lib/game/types/Class');
      User: typeof import('../application/lib/game/types/User');
      Session: typeof import('../application/lib/game/types/Session');
      GameObject: typeof import('../application/lib/game/types/GameObject');
      GameEvent: typeof import('../application/lib/game/types/GameEvent');
      endGameException: typeof import('../application/lib/game/types/endGameException');
      flush: import('../application/lib/game/types/flush').GameFlushModule;
      actions: import('../application/lib/game/types/actions').GameActionsModule;
      tutorial: import('../application/lib/game/types/tutorial').GameTutorialModule;
      events?: Record<string, () => any>;
      _objects: import('../application/lib/game/types/objects').GameObjectsModule;
      api: import('../application/lib/game/types/api').GameApiMethods;
    };
  }

  namespace domain { }

  namespace db {
    const pg: Database;
    const mongo: MongoDB;
  }
}
