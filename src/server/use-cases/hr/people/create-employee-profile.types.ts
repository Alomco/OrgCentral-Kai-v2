import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IEmploymentContractRepository } from '@/server/repositories/contracts/hr/people/employment-contract-repository-contract';
import type {
  IChecklistInstanceRepository,
} from '@/server/repositories/contracts/hr/onboarding/checklist-instance-repository-contract';
import type {
  IChecklistTemplateRepository,
} from '@/server/repositories/contracts/hr/onboarding/checklist-template-repository-contract';
import type { ProfileMutationPayload } from '@/server/types/hr/people';
import type {
  EmploymentContractCreateInput,
  OnboardingChecklistConfig,
} from '@/server/types/hr/onboarding-workflows';

export interface CreateEmployeeProfileInput {
  authorization: RepositoryAuthorizationContext;
  profileData: ProfileMutationPayload['changes'] & { userId: string; employeeNumber: string };
  contractData?: EmploymentContractCreateInput | null;
  onboardingTemplateId?: string | null;
  onboardingChecklist?: OnboardingChecklistConfig | null;
}

export interface CreateEmployeeProfileResult {
  success: true;
  contractCreated?: boolean;
  checklistInstanceId?: string;
}

export interface CreateEmployeeProfileDependencies {
  employeeProfileRepository: IEmployeeProfileRepository;
  employmentContractRepository?: IEmploymentContractRepository;
  checklistTemplateRepository?: IChecklistTemplateRepository;
  checklistInstanceRepository?: IChecklistInstanceRepository;
  transactionRunner?: CreateEmployeeProfileTransactionRunner;
}

export type TransactionalCreateDependencies = Pick<
  CreateEmployeeProfileDependencies,
  'employeeProfileRepository' | 'employmentContractRepository'
>;

export type CreateEmployeeProfileTransactionRunner = <T>(
  handler: (deps: TransactionalCreateDependencies) => Promise<T>,
) => Promise<T>;
