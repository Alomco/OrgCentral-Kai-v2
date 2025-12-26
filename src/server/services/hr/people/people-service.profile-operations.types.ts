import type { RepositoryAuthorizationContext, TenantScopedRecord } from '@/server/repositories/security';
import type { PeopleServiceOperationRunner } from './people-service-runner';
import type { PeoplePlatformAdapters } from './people-service.adapters';
import type { PeopleServiceDependencies, PeopleServiceNotifications } from './people-service.types';

export type EnsureEntityAccessFunction = <TRecord extends TenantScopedRecord>(
  authorization: RepositoryAuthorizationContext,
  record: TRecord | null | undefined,
) => TRecord;

export type EnsureEntitiesAccessFunction = <TRecord extends TenantScopedRecord>(
  authorization: RepositoryAuthorizationContext,
  records: TRecord[],
) => TRecord[];

export interface PeopleProfileOperationsContext {
  dependencies: PeopleServiceDependencies;
  notifications: PeopleServiceNotifications;
  runner: PeopleServiceOperationRunner;
  ensureEntityAccess: EnsureEntityAccessFunction;
  ensureEntitiesAccess: EnsureEntitiesAccessFunction;
  adapters: PeoplePlatformAdapters;
}
