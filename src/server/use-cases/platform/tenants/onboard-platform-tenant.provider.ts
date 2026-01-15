import { buildOrganizationServiceDependencies } from '@/server/repositories/providers/org/organization-service-dependencies';
import { buildRoleServiceDependencies } from '@/server/repositories/providers/org/role-service-dependencies';
import { buildMembershipRepositoryDependencies } from '@/server/repositories/providers/org/membership-service-dependencies';
import { buildAbacPolicyServiceDependencies } from '@/server/repositories/providers/org/abac-policy-service-dependencies';
import { buildPermissionResourceServiceDependencies } from '@/server/repositories/providers/org/permission-resource-service-dependencies';
import { buildAbsenceTypeConfigDependencies } from '@/server/repositories/providers/hr/absence-type-config-service-dependencies';
import type { OnboardPlatformTenantDependencies } from './onboard-platform-tenant';

export function buildPlatformTenantOnboardingDependencies(): OnboardPlatformTenantDependencies {
    const orgDeps = buildOrganizationServiceDependencies();
    const roleDeps = buildRoleServiceDependencies();
    const membershipDeps = buildMembershipRepositoryDependencies();
    const abacDeps = buildAbacPolicyServiceDependencies();
    const permissionDeps = buildPermissionResourceServiceDependencies();
    const absenceDeps = buildAbsenceTypeConfigDependencies();

    return {
        organizationRepository: orgDeps.organizationRepository,
        roleRepository: roleDeps.roleRepository,
        membershipRepository: membershipDeps.membershipRepository,
        invitationRepository: membershipDeps.invitationRepository,
        abacPolicyRepository: abacDeps.abacPolicyRepository,
        permissionResourceRepository: permissionDeps.permissionRepository,
        absenceTypeConfigRepository: absenceDeps.absenceTypeConfigRepository,
    };
}
