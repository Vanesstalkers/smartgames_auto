import type { DomainLobbySessionClass, DomainLobbySessionInstance } from '../../lobby/types/Session';
import type { DomainUserClass } from './Class';

export interface DomainUserSessionInstance extends DomainLobbySessionInstance {
  getUserClass(): DomainUserClass;
}

export interface DomainUserSessionClass extends DomainLobbySessionClass {
  new (data?: { id?: string; client?: any }): DomainUserSessionInstance;
}

declare function createDomainUserSessionClass(): DomainUserSessionClass;

export = createDomainUserSessionClass;
