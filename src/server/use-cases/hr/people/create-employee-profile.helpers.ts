import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfileDTO, EmploymentContractDTO } from '@/server/types/hr/people';
import type { ChecklistItemProgress, ChecklistTemplateItem } from '@/server/types/onboarding-types';
import type {
  EmploymentContractCreateInput,
  OnboardingChecklistConfig,
} from '@/server/types/hr/onboarding-workflows';
import type {
  CreateEmployeeProfileDependencies,
  CreateEmployeeProfileInput,
  TransactionalCreateDependencies,
} from './create-employee-profile.types';

type ProfileCreateRecord = Omit<EmployeeProfileDTO, 'id' | 'createdAt' | 'updatedAt'>;
type ContractCreateRecord = Omit<EmploymentContractDTO, 'id' | 'createdAt' | 'updatedAt'>;

export async function runProfileAndContractPhase(params: {
  dependencies: CreateEmployeeProfileDependencies;
  payload: ProfileCreateRecord;
  contractPayload: ContractCreateRecord | null;
  orgId: string;
}): Promise<{ contractCreated: boolean }> {
  const { dependencies, payload, contractPayload, orgId } = params;
  const runner =
    dependencies.transactionRunner ??
    (async (handler: (deps: TransactionalCreateDependencies) => Promise<void>) =>
      handler({
        employeeProfileRepository: dependencies.employeeProfileRepository,
        employmentContractRepository: dependencies.employmentContractRepository,
      }));
  const exec = runner;

  let contractCreated = false;
  await exec(async (scopedRepos: TransactionalCreateDependencies) => {
    await scopedRepos.employeeProfileRepository.createEmployeeProfile(orgId, payload);

    if (!contractPayload) {
      return;
    }
    if (!scopedRepos.employmentContractRepository) {
      throw new Error('Employment contract repository is required when contract data is provided.');
    }
    await scopedRepos.employmentContractRepository.createEmploymentContract(orgId, contractPayload);
    contractCreated = true;
  });

  return { contractCreated };
}

export function buildContractPayload(
  orgId: string,
  authorization: RepositoryAuthorizationContext,
  contractData: EmploymentContractCreateInput | null,
): ContractCreateRecord | null {
  if (!contractData) {
    return null;
  }
  return {
    ...contractData,
    orgId,
    dataResidency: authorization.dataResidency,
    dataClassification: authorization.dataClassification,
  };
}

export async function instantiateOnboardingChecklist(params: {
  dependencies: CreateEmployeeProfileDependencies;
  authorization: RepositoryAuthorizationContext;
  onboardingChecklist: OnboardingChecklistConfig;
  employeeIdentifier: string;
}): Promise<string | undefined> {
  const templateId = normalizeTemplateId(params.onboardingChecklist.templateId);
  if (!templateId) {
    return undefined;
  }

  const { checklistInstanceRepository, checklistTemplateRepository } = params.dependencies;
  if (!checklistInstanceRepository || !checklistTemplateRepository) {
    throw new Error('Checklist repositories must be provided when onboarding template IDs are supplied.');
  }

  const existing = await checklistInstanceRepository.getActiveInstanceForEmployee(
    params.authorization.orgId,
    params.employeeIdentifier,
  );
  if (existing) {
    return existing.id;
  }

  const template = await checklistTemplateRepository.getTemplate(params.authorization.orgId, templateId);
  if (!template) {
    return undefined;
  }

  const items = mapTemplateItemsToProgress(template.items);
  const metadata = buildChecklistMetadata(params.onboardingChecklist.metadata);

  const instance = await checklistInstanceRepository.createInstance({
    orgId: params.authorization.orgId,
    employeeId: params.employeeIdentifier,
    templateId: template.id,
    templateName: template.name,
    items,
    metadata,
  });

  return instance.id;
}

export function resolveOnboardingChecklistConfig(
  input: CreateEmployeeProfileInput,
): OnboardingChecklistConfig | null {
  if (input.onboardingChecklist) {
    return input.onboardingChecklist;
  }
  const normalizedId = normalizeTemplateId(input.onboardingTemplateId);
  if (!normalizedId) {
    return null;
  }
  return { templateId: normalizedId };
}

function normalizeTemplateId(value?: string | null): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function mapTemplateItemsToProgress(items: ChecklistTemplateItem[]): ChecklistItemProgress[] {
  return items
    .slice()
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    .map((item) => ({
      task: item.label,
      completed: false,
      completedAt: null,
      notes: item.description ?? null,
    }));
}

function buildChecklistMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  return {
    source: 'create-employee-profile',
    issuedAt: new Date().toISOString(),
    ...metadata,
  };
}
