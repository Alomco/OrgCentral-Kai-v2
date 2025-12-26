import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { organizationToTenantScope } from '@/server/security/guards';
import {
    buildAuthorizationContext,
    assertEmailMatch,
    assertNotExpired,
    assertStatus,
} from '@/server/use-cases/shared';
import type { CreateEmployeeProfileDependencies } from '@/server/use-cases/hr/people/create-employee-profile';
import type { OrganizationData } from '@/server/types/leave-types';
import type { OnboardingInvitation } from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';

export function createProfileDependencies(
    deps: {
        employeeProfileRepository: CreateEmployeeProfileDependencies['employeeProfileRepository'];
        employmentContractRepository?: CreateEmployeeProfileDependencies['employmentContractRepository'];
        checklistTemplateRepository?: CreateEmployeeProfileDependencies['checklistTemplateRepository'];
        checklistInstanceRepository?: CreateEmployeeProfileDependencies['checklistInstanceRepository'];
        transactionRunner?: CreateEmployeeProfileDependencies['transactionRunner'];
    },
): CreateEmployeeProfileDependencies {
    return {
        employeeProfileRepository: deps.employeeProfileRepository,
        employmentContractRepository: deps.employmentContractRepository,
        checklistTemplateRepository: deps.checklistTemplateRepository,
        checklistInstanceRepository: deps.checklistInstanceRepository,
        transactionRunner: deps.transactionRunner,
    } satisfies CreateEmployeeProfileDependencies;
}

export function validateInvitation(invitation: OnboardingInvitation, actorEmail: string, resource: string): void {
    assertEmailMatch(actorEmail, invitation.targetEmail, 'Invitation was issued to a different email.');
    assertStatus(invitation.status, 'pending', resource, { token: invitation.token });
    assertNotExpired(invitation.expiresAt ?? undefined, resource, { token: invitation.token });
}

export function buildAuthorizationForInvite(
    organization: OrganizationData,
    userId: string,
): RepositoryAuthorizationContext {
    const tenantScope = organizationToTenantScope(organization);
    return buildAuthorizationContext({
        orgId: organization.id,
        userId,
        dataResidency: tenantScope.dataResidency,
        dataClassification: tenantScope.dataClassification,
        auditSource: 'hr.complete-onboarding-invite',
        tenantScope,
    });
}
