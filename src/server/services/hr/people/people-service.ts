import { AbstractHrService } from '@/server/services/hr/abstract-hr-service';
import { PeopleServiceOperationRunner } from './people-service-runner';
import { createPeopleContractOperations } from './people-service.contract-operations';
import { createPeopleProfileOperations } from './people-service.profile-operations';
import type {
  CreateEmployeeProfilePayload,
  CreateEmployeeProfileResult,
  CountEmployeeProfilesPayload,
  CountEmployeeProfilesResult,
  CreateEmploymentContractPayload,
  CreateEmploymentContractResult,
  DeleteEmployeeProfilePayload,
  DeleteEmployeeProfileResult,
  DeleteEmploymentContractPayload,
  DeleteEmploymentContractResult,
  GetEmployeeProfileByUserPayload,
  GetEmployeeProfileByUserResult,
  GetEmployeeProfilePayload,
  GetEmployeeProfileResult,
  GetEmploymentContractByEmployeePayload,
  GetEmploymentContractByEmployeeResult,
  GetEmploymentContractPayload,
  GetEmploymentContractResult,
  ListEmployeeProfilesPayload,
  ListEmployeeProfilesResult,
  ListEmploymentContractsPayload,
  ListEmploymentContractsResult,
  PeopleServiceCacheHandlers,
  PeopleServiceDependencies,
  PeopleServiceInput,
  PeopleServiceNotifications,
  UpdateEmployeeProfilePayload,
  UpdateEmployeeProfileResult,
  UpdateEmploymentContractPayload,
  UpdateEmploymentContractResult,
} from './people-service.types';
import {
  emitContractCreatedEvent,
  emitContractUpdatedEvent,
  emitProfileCreatedEvent,
  emitProfileUpdatedEvent,
} from '@/server/use-cases/hr/people/shared/notification-helpers';
import {
  registerContractsCache,
  registerProfilesCache,
} from '@/server/use-cases/hr/people/shared/cache-helpers';
import { createPeoplePlatformAdapters, type PeoplePlatformAdapters } from './people-service.adapters';
import {
  createEmployeeProfilePayloadSchema,
  createEmploymentContractPayloadSchema,
  deleteEmployeeProfilePayloadSchema,
  deleteEmploymentContractPayloadSchema,
  getEmployeeProfileByUserPayloadSchema,
  getEmployeeProfilePayloadSchema,
  getEmploymentContractByEmployeePayloadSchema,
  getEmploymentContractPayloadSchema,
  countEmployeeProfilesPayloadSchema,
  listEmployeeProfilesPayloadSchema,
  listEmploymentContractsPayloadSchema,
  updateEmployeeProfilePayloadSchema,
  updateEmploymentContractPayloadSchema,
} from './people-service.schemas';
import { parsePeopleServicePayload } from './people-service.payload';

type ProfileOperations = ReturnType<typeof createPeopleProfileOperations>; type ContractOperations = ReturnType<typeof createPeopleContractOperations>;

export class PeopleService extends AbstractHrService {
  private readonly dependencies: PeopleServiceDependencies;
  private readonly notifications: PeopleServiceNotifications;
  private readonly adapters: PeoplePlatformAdapters;
  private readonly operationRunner: PeopleServiceOperationRunner;
  private readonly profileOperations: ProfileOperations;
  private readonly contractOperations: ContractOperations;

  constructor(dependencies: PeopleServiceDependencies) {
    super();
    this.dependencies = dependencies;
    const cacheHandlers: PeopleServiceCacheHandlers = {
      registerProfiles: dependencies.cache?.registerProfiles ?? registerProfilesCache,
      registerContracts: dependencies.cache?.registerContracts ?? registerContractsCache,
    };
    const adapterOverrides = dependencies.adapters;
    this.adapters = createPeoplePlatformAdapters(adapterOverrides);

    this.notifications = {
      profileCreated: dependencies.notifications?.profileCreated ?? emitProfileCreatedEvent,
      profileUpdated: dependencies.notifications?.profileUpdated ?? emitProfileUpdatedEvent,
      contractCreated: dependencies.notifications?.contractCreated ?? emitContractCreatedEvent,
      contractUpdated: dependencies.notifications?.contractUpdated ?? emitContractUpdatedEvent,
    } satisfies PeopleServiceNotifications;

    this.operationRunner = new PeopleServiceOperationRunner({
      cache: cacheHandlers,
      runtime: {
        buildContext: this.buildContext.bind(this),
        executeInServiceContext: this.executeInServiceContext.bind(this),
        ensureOrgAccess: this.ensureOrgAccess.bind(this),
      },
    });

    this.profileOperations = createPeopleProfileOperations({
      dependencies: this.dependencies,
      notifications: this.notifications,
      runner: this.operationRunner,
      ensureEntityAccess: this.ensureEntityAccess.bind(this),
      ensureEntitiesAccess: this.ensureEntitiesAccess.bind(this),
      adapters: this.adapters,
    });

    this.contractOperations = createPeopleContractOperations({
      dependencies: this.dependencies,
      notifications: this.notifications,
      runner: this.operationRunner,
      ensureEntityAccess: this.ensureEntityAccess.bind(this),
      ensureEntitiesAccess: this.ensureEntitiesAccess.bind(this),
      adapters: this.adapters,
    });
  }

  getEmployeeProfile(
    input: PeopleServiceInput<GetEmployeeProfilePayload>,
  ): Promise<GetEmployeeProfileResult> {
    const payload = parsePeopleServicePayload<GetEmployeeProfilePayload>(
      getEmployeeProfilePayloadSchema,
      input.payload,
    );
    return this.profileOperations.getEmployeeProfile({ ...input, payload });
  }

  getEmployeeProfileByUser(
    input: PeopleServiceInput<GetEmployeeProfileByUserPayload>,
  ): Promise<GetEmployeeProfileByUserResult> {
    const payload = parsePeopleServicePayload<GetEmployeeProfileByUserPayload>(
      getEmployeeProfileByUserPayloadSchema,
      input.payload,
    );
    return this.profileOperations.getEmployeeProfileByUser({ ...input, payload });
  }

  listEmployeeProfiles(
    input: PeopleServiceInput<ListEmployeeProfilesPayload>,
  ): Promise<ListEmployeeProfilesResult> {
    const payload = parsePeopleServicePayload<ListEmployeeProfilesPayload>(
      listEmployeeProfilesPayloadSchema,
      input.payload,
    );
    return this.profileOperations.listEmployeeProfiles({ ...input, payload });
  }

  countEmployeeProfiles(
    input: PeopleServiceInput<CountEmployeeProfilesPayload>,
  ): Promise<CountEmployeeProfilesResult> {
    const payload = parsePeopleServicePayload<CountEmployeeProfilesPayload>(
      countEmployeeProfilesPayloadSchema,
      input.payload,
    );
    return this.profileOperations.countEmployeeProfiles({ ...input, payload });
  }

  createEmployeeProfile(
    input: PeopleServiceInput<CreateEmployeeProfilePayload>,
  ): Promise<CreateEmployeeProfileResult> {
    const payload = parsePeopleServicePayload<CreateEmployeeProfilePayload>(
      createEmployeeProfilePayloadSchema,
      input.payload,
    );
    return this.profileOperations.createEmployeeProfile({ ...input, payload });
  }

  updateEmployeeProfile(
    input: PeopleServiceInput<UpdateEmployeeProfilePayload>,
  ): Promise<UpdateEmployeeProfileResult> {
    const payload = parsePeopleServicePayload<UpdateEmployeeProfilePayload>(
      updateEmployeeProfilePayloadSchema,
      input.payload,
    );
    return this.profileOperations.updateEmployeeProfile({ ...input, payload });
  }

  deleteEmployeeProfile(
    input: PeopleServiceInput<DeleteEmployeeProfilePayload>,
  ): Promise<DeleteEmployeeProfileResult> {
    const payload = parsePeopleServicePayload<DeleteEmployeeProfilePayload>(
      deleteEmployeeProfilePayloadSchema,
      input.payload,
    );
    return this.profileOperations.deleteEmployeeProfile({ ...input, payload });
  }

  getEmploymentContract(
    input: PeopleServiceInput<GetEmploymentContractPayload>,
  ): Promise<GetEmploymentContractResult> {
    const payload = parsePeopleServicePayload<GetEmploymentContractPayload>(
      getEmploymentContractPayloadSchema,
      input.payload,
    );
    return this.contractOperations.getEmploymentContract({ ...input, payload });
  }

  getEmploymentContractByEmployee(
    input: PeopleServiceInput<GetEmploymentContractByEmployeePayload>,
  ): Promise<GetEmploymentContractByEmployeeResult> {
    const payload = parsePeopleServicePayload<GetEmploymentContractByEmployeePayload>(
      getEmploymentContractByEmployeePayloadSchema,
      input.payload,
    );
    return this.contractOperations.getEmploymentContractByEmployee({ ...input, payload });
  }

  listEmploymentContracts(
    input: PeopleServiceInput<ListEmploymentContractsPayload>,
  ): Promise<ListEmploymentContractsResult> {
    const payload = parsePeopleServicePayload<ListEmploymentContractsPayload>(
      listEmploymentContractsPayloadSchema,
      input.payload,
    );
    return this.contractOperations.listEmploymentContracts({ ...input, payload });
  }

  createEmploymentContract(
    input: PeopleServiceInput<CreateEmploymentContractPayload>,
  ): Promise<CreateEmploymentContractResult> {
    const payload = parsePeopleServicePayload<CreateEmploymentContractPayload>(
      createEmploymentContractPayloadSchema,
      input.payload,
    );
    return this.contractOperations.createEmploymentContract({ ...input, payload });
  }

  updateEmploymentContract(
    input: PeopleServiceInput<UpdateEmploymentContractPayload>,
  ): Promise<UpdateEmploymentContractResult> {
    const payload = parsePeopleServicePayload<UpdateEmploymentContractPayload>(
      updateEmploymentContractPayloadSchema,
      input.payload,
    );
    return this.contractOperations.updateEmploymentContract({ ...input, payload });
  }

  deleteEmploymentContract(
    input: PeopleServiceInput<DeleteEmploymentContractPayload>,
  ): Promise<DeleteEmploymentContractResult> {
    const payload = parsePeopleServicePayload<DeleteEmploymentContractPayload>(
      deleteEmploymentContractPayloadSchema,
      input.payload,
    );
    return this.contractOperations.deleteEmploymentContract({ ...input, payload });
  }
}
