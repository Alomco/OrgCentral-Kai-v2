import { PrismaPermissionResourceRepository } from '@/server/repositories/prisma/org/permissions/prisma-permission-resource-repository';
import type { BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import { PermissionResourceService, type PermissionResourceServiceDependencies } from './permission-resource-service';

export interface PermissionResourceServiceProviderOptions {
    prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
}

export class PermissionResourceServiceProvider {
    private readonly prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
    private readonly sharedService: PermissionResourceService;

    constructor(options?: PermissionResourceServiceProviderOptions) {
        this.prismaOptions = options?.prismaOptions;
        this.sharedService = new PermissionResourceService(this.createDependencies(this.prismaOptions));
    }

    getService(overrides?: Partial<PermissionResourceServiceDependencies>): PermissionResourceService {
        if (!overrides || Object.keys(overrides).length === 0) {
            return this.sharedService;
        }
        const deps = this.createDependencies(this.prismaOptions);
        return new PermissionResourceService({
            permissionRepository: overrides.permissionRepository ?? deps.permissionRepository,
        });
    }

    private createDependencies(
        prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>,
    ): PermissionResourceServiceDependencies {
        const prismaClient = prismaOptions?.prisma ?? defaultPrismaClient;
        return {
            permissionRepository: new PrismaPermissionResourceRepository({
                prisma: prismaClient,
                trace: prismaOptions?.trace,
                onAfterWrite: prismaOptions?.onAfterWrite,
            }),
        };
    }
}

const defaultPermissionResourceServiceProvider = new PermissionResourceServiceProvider();

export function getPermissionResourceService(
    overrides?: Partial<PermissionResourceServiceDependencies>,
    options?: PermissionResourceServiceProviderOptions,
): PermissionResourceService {
    const provider = options
        ? new PermissionResourceServiceProvider(options)
        : defaultPermissionResourceServiceProvider;
    return provider.getService(overrides);
}
