import type { ProfileMutationPayload } from '@/server/types/hr/people';
import { invalidateContractsAfterMutation, invalidateProfilesAfterMutation } from './shared/cache-helpers';
import { assertEmploymentContractEditor, assertPeopleProfileEditor } from '@/server/security/guards-hr-people';
import { HR_ACTION } from '@/server/security/authorization/hr-resource-registry';
import type {
  CreateEmployeeProfileDependencies,
  CreateEmployeeProfileInput,
  CreateEmployeeProfileResult,
} from './create-employee-profile.types';
import {
  buildContractPayload,
  instantiateOnboardingChecklist,
  resolveOnboardingChecklistConfig,
  runProfileAndContractPhase,
} from './create-employee-profile.helpers';

// Use-case: create an employee profile via people repositories with RBAC/ABAC authorization safeguards.

export type {
  CreateEmployeeProfileDependencies,
  CreateEmployeeProfileInput,
  CreateEmployeeProfileResult,
  CreateEmployeeProfileTransactionRunner,
  TransactionalCreateDependencies,
} from './create-employee-profile.types';

export async function createEmployeeProfile(
  dependencies: CreateEmployeeProfileDependencies,
  input: CreateEmployeeProfileInput,
): Promise<CreateEmployeeProfileResult> {
  const orgId = input.authorization.orgId;
  const payload: ProfileMutationPayload['changes'] & { orgId: string } = {
    ...input.profileData,
    orgId,
    healthStatus: input.profileData.healthStatus ?? 'UNDEFINED',
    employmentType: input.profileData.employmentType ?? 'FULL_TIME',
    employmentStatus: input.profileData.employmentStatus ?? 'ACTIVE',
    dataResidency: input.authorization.dataResidency,
    dataClassification: input.authorization.dataClassification,
  };
  const contractPayload = buildContractPayload(orgId, input.authorization, input.contractData ?? null);

  await assertPeopleProfileEditor({
    authorization: input.authorization,
    action: HR_ACTION.CREATE,
    resourceAttributes: {
      orgId,
      userId: payload.userId,
      employeeNumber: payload.employeeNumber,
      departmentId: payload.departmentId ?? null,
      jobTitle: payload.jobTitle ?? null,
      employmentType: payload.employmentType,
    },
  });

  if (contractPayload) {
    await assertEmploymentContractEditor({
      authorization: input.authorization,
      action: HR_ACTION.CREATE,
      resourceAttributes: {
        orgId,
        userId: contractPayload.userId,
        employeeId: contractPayload.userId,
        departmentId: contractPayload.departmentId ?? null,
        contractType: contractPayload.contractType,
        jobTitle: contractPayload.jobTitle,
        startDate: contractPayload.startDate,
      },
    });
  }

  const profileAndContractResult = await runProfileAndContractPhase({
    dependencies,
    payload,
    orgId,
    contractPayload,
  });

  let checklistInstanceId: string | undefined;
  const onboardingChecklist = resolveOnboardingChecklistConfig(input);
  if (onboardingChecklist) {
    checklistInstanceId = await instantiateOnboardingChecklist({
      dependencies,
      authorization: input.authorization,
      onboardingChecklist,
      employeeIdentifier: input.profileData.employeeNumber,
    });
  }

  await invalidateProfilesAfterMutation(input.authorization);
  if (profileAndContractResult.contractCreated) {
    await invalidateContractsAfterMutation(input.authorization);
  }

  return {
    success: true,
    contractCreated: profileAndContractResult.contractCreated || undefined,
    checklistInstanceId,
  };
}
