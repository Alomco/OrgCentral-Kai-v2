import { PrismaUserRepository } from '@/server/repositories/prisma/org/users/prisma-user-repository';
import type { BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import { prisma as defaultPrismaClient } from '@/server/lib/prisma';

import { UserService, type UserServiceDependencies } from './user-service';

export interface UserServiceProviderOptions {
    prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
}

export class UserServiceProvider {
    private readonly prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
    private readonly defaultDependencies: UserServiceDependencies;
    private readonly sharedService: UserService;

    constructor(options?: UserServiceProviderOptions) {
        this.prismaOptions = options?.prismaOptions;
        this.defaultDependencies = this.createDependencies(this.prismaOptions);
        this.sharedService = new UserService(this.defaultDependencies);
    }

    getService(overrides?: Partial<UserServiceDependencies>): UserService {
        if (!overrides || Object.keys(overrides).length === 0) {
            return this.sharedService;
        }

        const deps = this.createDependencies(this.prismaOptions);

        return new UserService({
            userRepository: overrides.userRepository ?? deps.userRepository,
        });
    }

    private createDependencies(
        prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>,
    ): UserServiceDependencies {
        const prismaClient = prismaOptions?.prisma ?? defaultPrismaClient;
        const repoOptions = {
            prisma: prismaClient,
            trace: prismaOptions?.trace,
            onAfterWrite: prismaOptions?.onAfterWrite,
        };

        return {
            userRepository: new PrismaUserRepository(repoOptions),
        };
    }
}

const defaultUserServiceProvider = new UserServiceProvider();

export function getUserService(
    overrides?: Partial<UserServiceDependencies>,
    options?: UserServiceProviderOptions,
): UserService {
    const provider = options ? new UserServiceProvider(options) : defaultUserServiceProvider;
    return provider.getService(overrides);
}

export type UserServiceContract = Pick<
    UserService,
    'listUsersInOrganization' | 'listUsersInOrganizationPaged' | 'countUsersInOrganization'
>;
