import type { DomainUserClass } from './Class';
import type { DomainUserSessionClass } from './Session';

export interface DomainUserModule {
  Class: DomainUserClass;
  Session: DomainUserSessionClass;

  class?: DomainUserClass;
  session?: DomainUserSessionClass;
}
