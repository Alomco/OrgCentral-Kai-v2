import { MembershipService, type MembershipServiceDependencies } from './membership-service';
import { resolveBillingService } from '@/server/services/billing/billing-service.provider';
import { getNotificationComposerService } from '@/server/services/platform/notifications/notification-composer.provider';
import {
    buildMembershipRepositoryDependencies,
    type MembershipRepositoryDependencyOptions,
} from '@/server/repositories/providers/org/membership-service-dependencies';
import { generateEmployeeNumber } from '@/server/use-cases/shared/builders';

export interface MembershipServiceProviderOptions {
    prismaOptions?: MembershipRepositoryDependencyOptions['prismaOptions'];
}

export class MembershipServiceProvider {
    private readonly prismaOptions?: MembershipRepositoryDependencyOptions['prismaOptions'];
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
            notificationComposer: overrides.notificationComposer ?? deps.notificationComposer,
            billingService: overrides.billingService ?? deps.billingService,
        });
    }

    private createDependencies(
        prismaOptions?: MembershipRepositoryDependencyOptions['prismaOptions'],
    ): MembershipServiceDependencies {
        const baseDependencies = buildMembershipRepositoryDependencies({ prismaOptions });

        return {
            ...baseDependencies,
            billingService: resolveBillingService(undefined, { prismaOptions }) ?? undefined,
            notificationComposer: getNotificationComposerService(),
            generateEmployeeNumber,
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
    'acceptInvitation' | 'inviteMember' | 'updateMembershipRoles' | 'bulkUpdateMembershipRoles' | 'suspendMembership' | 'resumeMembership'
>;
