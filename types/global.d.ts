/* This import should not be removed. We need to reference impress explicitly
 * so that tsc correctly resolved global variables.
 * For some odd reason using typeRoots results in an array of errors.
 * The problem should have been fixed by having an index file but no luck.
 * PR with the correct fix would be greatly appreciated. */
import * as _impress from 'impress';

import * as _metasql from 'metasql';
import { Database } from 'metasql';

import { Database as MongoDB } from '../application/db/mongo/types';
import { GameModule } from '../application/lib/game/types';
import { DomainGameModule } from '../application/domain/game/types';
import { StoreClassFactory } from '../application/lib/store/types';
import { UserModule } from '../application/lib/user/types';

declare global {
  namespace metarhia {
    const metasql: typeof _metasql;
  }

  namespace api { }

  namespace lib {
    const game: GameModule;
    const store: {
      class: StoreClassFactory;
      broadcaster: {
        addChannel: (options: { name: string; instance: any }) => void;
        publishAction: (channelName: string, actionName: string, actionData: any) => void;
        publishData: (channelName: string, data: any) => void;
        removeChannel: (options: { name: string }) => void;
      };
    };
    const user: UserModule;
  };

  namespace domain {
    const game: DomainGameModule;
  }

  namespace db {
    const pg: Database;
    const mongo: MongoDB;
  }
}
