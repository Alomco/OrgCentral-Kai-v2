import type { PeopleProfileOperationsContext } from './people-service.profile-operations.types';
import { createPeopleProfileReadOperations } from './people-service.profile-operations.read';
import { createPeopleProfileWriteOperations } from './people-service.profile-operations.write';

export function createPeopleProfileOperations(context: PeopleProfileOperationsContext) {
  return {
    ...createPeopleProfileReadOperations(context),
    ...createPeopleProfileWriteOperations(context),
  };
}
