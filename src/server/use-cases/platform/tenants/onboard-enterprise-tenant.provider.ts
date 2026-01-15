import { buildEnterpriseAdminRepositoryDependencies } from '@/server/repositories/providers/org/enterprise-admin-repository-dependencies';
import type { OnboardEnterpriseTenantDependencies } from './onboard-enterprise-tenant';
import { buildPlatformTenantOnboardingDependencies } from './onboard-platform-tenant.provider';

export function buildEnterpriseTenantOnboardingDependencies(): OnboardEnterpriseTenantDependencies {
    const platformDeps = buildPlatformTenantOnboardingDependencies();
    const enterpriseDeps = buildEnterpriseAdminRepositoryDependencies();

    return {
        ...platformDeps,
        enterpriseAdminRepository: enterpriseDeps.enterpriseAdminRepository,
    };
}
