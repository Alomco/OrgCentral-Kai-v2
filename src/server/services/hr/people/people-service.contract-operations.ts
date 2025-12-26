import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
  createEmploymentContract,
  deleteEmploymentContract,
  getEmploymentContract,
  getEmploymentContractByEmployee,
  listEmploymentContracts,
  updateEmploymentContract,
} from '@/server/services/hr/people/helpers/contract-handlers';
import {
  emitContractSideEffects,
  invalidateContractCaches,
  registerContractReadCaches,
  unwrapOrThrow,
} from './people-service.operation-helpers';
import type {
  CreateEmploymentContractPayload,
  CreateEmploymentContractResult,
  DeleteEmploymentContractPayload,
  DeleteEmploymentContractResult,
  GetEmploymentContractByEmployeePayload,
  GetEmploymentContractByEmployeeResult,
  GetEmploymentContractPayload,
  GetEmploymentContractResult,
  ListEmploymentContractsPayload,
  ListEmploymentContractsResult,
  PeopleServiceInput,
  UpdateEmploymentContractPayload,
  UpdateEmploymentContractResult,
} from './people-service.types';
import type { PeopleContractOperationsContext } from './people-service.contract-operations.types';

export function createPeopleContractOperations(context: PeopleContractOperationsContext) {
  const {
    dependencies,
    notifications,
    runner,
    ensureEntityAccess,
    ensureEntitiesAccess,
    adapters,
  } = context;

  const invalidateContractAndRelatedCaches = (
    authorization: RepositoryAuthorizationContext,
    contract?: Parameters<typeof invalidateContractCaches>[1],
  ) => invalidateContractCaches(authorization, contract);

  return {
    async getEmploymentContract(
      input: PeopleServiceInput<GetEmploymentContractPayload>,
    ): Promise<GetEmploymentContractResult> {
      const { contractId } = input.payload;

      return runner.runContractReadOperation(
        'hr.people.contracts.get',
        input.authorization,
        { contractId },
        input.correlationId,
        async (authorization) => {
          const { contract } = unwrapOrThrow(await getEmploymentContract({
            authorization,
            contractId,
            repositories: { contractRepo: dependencies.contractRepo },
          }));

          if (!contract) {
            return { contract: null };
          }

          registerContractReadCaches(authorization, contract);
          return { contract: ensureEntityAccess(authorization, contract) };
        },
      );
    },

    async getEmploymentContractByEmployee(
      input: PeopleServiceInput<GetEmploymentContractByEmployeePayload>,
    ): Promise<GetEmploymentContractByEmployeeResult> {
      const { employeeId } = input.payload;

      return runner.runContractReadOperation(
        'hr.people.contracts.getByEmployee',
        input.authorization,
        { employeeId },
        input.correlationId,
        async (authorization) => {
          const { contract } = unwrapOrThrow(await getEmploymentContractByEmployee({
            authorization,
            employeeId,
            repositories: { contractRepo: dependencies.contractRepo },
          }));

          return { contract: contract ? ensureEntityAccess(authorization, contract) : null };
        },
      );
    },

    async listEmploymentContracts(
      input: PeopleServiceInput<ListEmploymentContractsPayload>,
    ): Promise<ListEmploymentContractsResult> {
      const filters = input.payload.filters;

      return runner.runContractReadOperation(
        'hr.people.contracts.list',
        input.authorization,
        { filterCount: Object.keys(filters ?? {}).length, filters },
        input.correlationId,
        async (authorization) => {
          const { contracts } = unwrapOrThrow(await listEmploymentContracts({
            authorization,
            filters,
            repositories: { contractRepo: dependencies.contractRepo },
          }));

          contracts.forEach((contract) => registerContractReadCaches(authorization, contract));
          return { contracts: ensureEntitiesAccess(authorization, contracts) };
        },
      );
    },

    async createEmploymentContract(
      input: PeopleServiceInput<CreateEmploymentContractPayload>,
    ): Promise<CreateEmploymentContractResult> {
      const { contractData } = input.payload;

      return runner.runContractWriteOperation(
        'hr.people.contracts.create',
        input.authorization,
        { targetUserId: contractData.userId, contractType: contractData.contractType },
        input.correlationId,
        async (authorization) => {
          const { contractId, contract } = unwrapOrThrow(await createEmploymentContract({
            authorization,
            payload: contractData,
            repositories: { contractRepo: dependencies.contractRepo },
          }));

          await invalidateContractAndRelatedCaches(authorization, contract ?? undefined);
          if (contract) {
            const scopedContract = ensureEntityAccess(authorization, contract);
            await emitContractSideEffects({
              authorization,
              contract: scopedContract,
              notifications,
              adapters,
              action: 'created',
              correlationId: input.correlationId,
            });
            return { contractId: scopedContract.id };
          }

          return { contractId };
        },
      );
    },

    async updateEmploymentContract(
      input: PeopleServiceInput<UpdateEmploymentContractPayload>,
    ): Promise<UpdateEmploymentContractResult> {
      const { contractId, contractUpdates } = input.payload;

      return runner.runContractWriteOperation(
        'hr.people.contracts.update',
        input.authorization,
        { contractId, updateKeys: Object.keys(contractUpdates) },
        input.correlationId,
        async (authorization) => {
          const { contract } = unwrapOrThrow(await updateEmploymentContract({
            authorization,
            contractId,
            updates: contractUpdates,
            repositories: { contractRepo: dependencies.contractRepo },
          }));

          if (!contract) {
            throw new Error('Employment contract not found after update.');
          }

          const scopedContract = ensureEntityAccess(authorization, contract);
          const updatedFields = Object.keys(contractUpdates);

          await invalidateContractAndRelatedCaches(authorization, scopedContract);
          await notifications.contractUpdated(authorization.orgId, scopedContract.id, scopedContract, updatedFields);
          await emitContractSideEffects({
            authorization,
            contract: scopedContract,
            notifications,
            adapters,
            action: 'updated',
            updatedFields,
            correlationId: input.correlationId,
          });

          return { contractId: scopedContract.id };
        },
      );
    },

    async deleteEmploymentContract(
      input: PeopleServiceInput<DeleteEmploymentContractPayload>,
    ): Promise<DeleteEmploymentContractResult> {
      const { contractId } = input.payload;

      return runner.runContractWriteOperation(
        'hr.people.contracts.delete',
        input.authorization,
        { contractId },
        input.correlationId,
        async (authorization) => {
          const { contract } = unwrapOrThrow(await getEmploymentContract({
            authorization,
            contractId,
            repositories: { contractRepo: dependencies.contractRepo },
          }));

          if (!contract) {
            throw new Error('Employment contract not found.');
          }

          const scopedContract = ensureEntityAccess(authorization, contract);

          await deleteEmploymentContract({
            authorization,
            contractId,
            repositories: { contractRepo: dependencies.contractRepo },
          });
          await invalidateContractAndRelatedCaches(authorization, scopedContract);
          await emitContractSideEffects({
            authorization,
            contract: scopedContract,
            notifications,
            adapters,
            action: 'deleted',
            correlationId: input.correlationId,
          });

          return { success: true };
        },
      );
    },
  };
}
