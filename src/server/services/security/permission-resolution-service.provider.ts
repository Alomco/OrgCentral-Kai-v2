import { PrismaRoleRepository } from '@/server/repositories/prisma/org/roles';
import type { BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import { PermissionResolutionService, type PermissionResolutionServiceDependencies } from './permission-resolution-service';

let defaultPermissionResolutionServiceProvider: PermissionResolutionServiceProvider | null = null;

export interface PermissionResolutionServiceProviderOptions {
    prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
}

export class PermissionResolutionServiceProvider {
    private readonly prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
    private readonly sharedService: PermissionResolutionService;

    constructor(options?: PermissionResolutionServiceProviderOptions) {
        this.prismaOptions = options?.prismaOptions;
        this.sharedService = new PermissionResolutionService(this.createDependencies(this.prismaOptions));
    }

    getService(overrides?: Partial<PermissionResolutionServiceDependencies>): PermissionResolutionService {
        if (!overrides || Object.keys(overrides).length === 0) {
            return this.sharedService;
        }
        const deps = this.createDependencies(this.prismaOptions);
        return new PermissionResolutionService({
            roleRepository: overrides.roleRepository ?? deps.roleRepository,
        });
    }

    private createDependencies(
        prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>,
    ): PermissionResolutionServiceDependencies {
        const prismaClient = prismaOptions?.prisma ?? defaultPrismaClient;
        const repoOptions = {
            prisma: prismaClient,
            trace: prismaOptions?.trace,
            onAfterWrite: prismaOptions?.onAfterWrite,
        };
        return {
            roleRepository: new PrismaRoleRepository(repoOptions),
        };
    }
}

export function getPermissionResolutionService(
    overrides?: Partial<PermissionResolutionServiceDependencies>,
    options?: PermissionResolutionServiceProviderOptions,
): PermissionResolutionService {
    // Lazy init to avoid eager graph construction that can trigger circular imports at module load.
    const provider = options
        ? new PermissionResolutionServiceProvider(options)
        : (defaultPermissionResolutionServiceProvider ??=
              new PermissionResolutionServiceProvider());
    return provider.getService(overrides);
}
