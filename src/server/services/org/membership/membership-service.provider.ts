import { PrismaInvitationRepository } from '@/server/repositories/prisma/auth/invitations/prisma-invitation-repository';
import { PrismaMembershipRepository } from '@/server/repositories/prisma/org/membership/prisma-membership-repository';
import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization/prisma-organization-repository';
import { PrismaUserRepository } from '@/server/repositories/prisma/org/users/prisma-user-repository';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people/prisma-employee-profile-repository';
import { PrismaChecklistTemplateRepository } from '@/server/repositories/prisma/hr/onboarding/prisma-checklist-template-repository';
import { PrismaChecklistInstanceRepository } from '@/server/repositories/prisma/hr/onboarding/prisma-checklist-instance-repository';
import { invalidateCache } from '@/server/lib/cache-tags';
import { resolveIdentityCacheScopes } from '@/server/lib/cache-tags/identity';
import type { BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { OrgScopedRepositoryOptions } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';
import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import { MembershipService, type MembershipServiceDependencies } from './membership-service';

export interface MembershipServiceProviderOptions {
    prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
}

export class MembershipServiceProvider {
    private readonly prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
    private readonly defaultDependencies: MembershipServiceDependencies;
    private readonly sharedMembershipService: MembershipService;

    constructor(options?: MembershipServiceProviderOptions) {
        this.prismaOptions = options?.prismaOptions;
        this.defaultDependencies = this.createDependencies(this.prismaOptions);
        this.sharedMembershipService = new MembershipService(this.defaultDependencies);
    }

    getService(overrides?: Partial<MembershipServiceDependencies>): MembershipService {
        if (!overrides || Object.keys(overrides).length === 0) {
            return this.sharedMembershipService;
        }

        const deps = this.createDependencies(this.prismaOptions);

        return new MembershipService({
            invitationRepository: overrides.invitationRepository ?? deps.invitationRepository,
            membershipRepository: overrides.membershipRepository ?? deps.membershipRepository,
            userRepository: overrides.userRepository ?? deps.userRepository,
            organizationRepository: overrides.organizationRepository ?? deps.organizationRepository,
            employeeProfileRepository:
                overrides.employeeProfileRepository ?? deps.employeeProfileRepository,
            checklistTemplateRepository:
                overrides.checklistTemplateRepository ?? deps.checklistTemplateRepository,
            checklistInstanceRepository:
                overrides.checklistInstanceRepository ?? deps.checklistInstanceRepository,
            generateEmployeeNumber: overrides.generateEmployeeNumber ?? this.defaultDependencies.generateEmployeeNumber,
        });
    }

    private createDependencies(
        prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>,
    ): MembershipServiceDependencies {
        const prismaClient = prismaOptions?.prisma ?? defaultPrismaClient;
        const organizationRepo = new PrismaOrganizationRepository({ prisma: prismaClient });
        const identityInvalidator = prismaOptions?.onAfterWrite ?? this.createIdentityInvalidator(organizationRepo);
        const repoOptions: OrgScopedRepositoryOptions = {
            prisma: prismaClient,
            trace: prismaOptions?.trace,
            onAfterWrite: identityInvalidator,
        };

        return {
            invitationRepository: new PrismaInvitationRepository(repoOptions),
            membershipRepository: new PrismaMembershipRepository(repoOptions),
            userRepository: new PrismaUserRepository(repoOptions),
            organizationRepository: organizationRepo,
            employeeProfileRepository: new PrismaEmployeeProfileRepository(repoOptions),
            checklistTemplateRepository: new PrismaChecklistTemplateRepository(repoOptions),
            checklistInstanceRepository: new PrismaChecklistInstanceRepository(repoOptions),
        };
    }

    private createIdentityInvalidator(
        organizationRepo: PrismaOrganizationRepository,
    ): NonNullable<BasePrismaRepositoryOptions['onAfterWrite']> {
        return async (orgId, scopes = resolveIdentityCacheScopes()) => {
            const organization = await organizationRepo.getOrganization(orgId);
            const classification = organization?.dataClassification ?? 'OFFICIAL';
            const residency = organization?.dataResidency ?? 'UK_ONLY';
            const scopesToInvalidate = scopes.length > 0 ? scopes : resolveIdentityCacheScopes();

            await Promise.all(
                scopesToInvalidate.map((scope) =>
                    invalidateCache({
                        orgId,
                        scope,
                        classification,
                        residency,
                    }),
                ),
            );
        };
    }
}

const defaultMembershipServiceProvider = new MembershipServiceProvider();

export function getMembershipService(
    overrides?: Partial<MembershipServiceDependencies>,
    options?: MembershipServiceProviderOptions,
): MembershipService {
    const provider = options ? new MembershipServiceProvider(options) : defaultMembershipServiceProvider;
    return provider.getService(overrides);
}

export type MembershipServiceContract = Pick<
    MembershipService,
    'acceptInvitation' | 'updateMembershipRoles' | 'suspendMembership' | 'resumeMembership'
>;
