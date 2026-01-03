import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IEmploymentContractRepository } from '@/server/repositories/contracts/hr/people/employment-contract-repository-contract';
import type { EmploymentContract } from '@/server/types/hr-types';
import { registerContractsCache } from '../shared/cache-helpers';
import { assertEmploymentContractReader } from '@/server/security/guards-hr-people';
import { HR_ACTION } from '@/server/security/authorization/hr-resource-registry';

export interface ListEmploymentContractsByEmployeeInput {
  authorization: RepositoryAuthorizationContext;
  employeeId: string;
}

export interface ListEmploymentContractsByEmployeeResult {
  contracts: EmploymentContract[];
}

export interface ListEmploymentContractsByEmployeeDependencies {
  employmentContractRepository: IEmploymentContractRepository;
}

export async function listEmploymentContractsByEmployee(
  dependencies: ListEmploymentContractsByEmployeeDependencies,
  input: ListEmploymentContractsByEmployeeInput,
): Promise<ListEmploymentContractsByEmployeeResult> {
  await assertEmploymentContractReader({
    authorization: input.authorization,
    action: HR_ACTION.READ,
    resourceAttributes: {
      orgId: input.authorization.orgId,
      employeeId: input.employeeId,
    },
  });

  const contracts = await dependencies.employmentContractRepository.getEmploymentContractsByEmployee(
    input.authorization.orgId,
    input.employeeId,
  );

  registerContractsCache(input.authorization);

  return {
    contracts: contracts.map((contract) => ({
      ...contract,
      dataResidency: contract.dataResidency ?? input.authorization.dataResidency,
      dataClassification: contract.dataClassification ?? input.authorization.dataClassification,
    })),
  };
}
