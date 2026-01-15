import type { createAuth } from '@/server/lib/auth';
import type { syncBetterAuthUserToPrisma } from '@/server/lib/auth-sync';
import type { IAbacPolicyRepository } from '@/server/repositories/contracts/org/abac/abac-policy-repository-contract';
import type { IPlatformProvisioningRepository } from '@/server/repositories/contracts/platform';
import { buildAbacPolicyServiceDependencies } from '@/server/repositories/providers/org/abac-policy-service-dependencies';
import { buildPlatformProvisioningServiceDependencies } from '@/server/repositories/providers/platform/platform-provisioning-service-dependencies';

export interface AdminBootstrapDependencies {
    provisioningRepository: IPlatformProvisioningRepository;
    abacPolicyRepository: IAbacPolicyRepository;
    auth: ReturnType<typeof createAuth>;
    syncAuthUser?: typeof syncBetterAuthUserToPrisma;
}

export type AdminBootstrapOverrides = {
    auth: AdminBootstrapDependencies['auth'];
} & Partial<Omit<AdminBootstrapDependencies, 'auth'>>;

export function buildAdminBootstrapDependencies(
    overrides: AdminBootstrapOverrides,
): AdminBootstrapDependencies {
    const provisioningRepository =
        overrides.provisioningRepository ??
        buildPlatformProvisioningServiceDependencies().provisioningRepository;
    const abacPolicyRepository =
        overrides.abacPolicyRepository ??
        buildAbacPolicyServiceDependencies().abacPolicyRepository;

    return {
        provisioningRepository,
        abacPolicyRepository,
        auth: overrides.auth,
        syncAuthUser: overrides.syncAuthUser,
    };
}
