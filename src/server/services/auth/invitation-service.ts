import { createHash } from 'node:crypto';

import { AbstractBaseService } from '@/server/services/abstract-base-service';
import type { ServiceExecutionContext } from '@/server/services/abstract-base-service';
import { buildSystemServiceContext, buildTenantServiceContext } from '@/server/services/auth/service-context';
import type {
    GetInvitationDetailsDependencies,
    GetInvitationDetailsInput,
    GetInvitationDetailsResult,
} from '@/server/use-cases/auth/get-invitation-details';
import { getInvitationDetails } from '@/server/use-cases/auth/get-invitation-details';
import { normalizeToken } from '@/server/use-cases/shared';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import { createInvitationRepository } from '@/server/repositories/providers/auth/invitation-repository-provider';
import { buildUserServiceDependencies } from '@/server/repositories/providers/org/user-service-dependencies';
import { buildOrganizationServiceDependencies } from '@/server/repositories/providers/org/organization-service-dependencies';
import type { InvitationRecord } from '@/server/repositories/contracts/auth/invitations/invitation-repository.types';

const AUDIT_SOURCE = 'auth.invitation-service';

export interface InvitationServiceDependencies extends GetInvitationDetailsDependencies {
    organizationRepository?: IOrganizationRepository;
}

export class InvitationService extends AbstractBaseService {
    constructor(private readonly dependencies: InvitationServiceDependencies) {
        super();
    }

    async getDetails(input: GetInvitationDetailsInput): Promise<GetInvitationDetailsResult> {
        const token = normalizeToken(input.token);
        const context = await this.buildContext(token);
        return this.executeInServiceContext(context, 'auth.invitation.details', () =>
            getInvitationDetails(this.dependencies, { token }),
        );
    }

    private async buildContext(token: string): Promise<ServiceExecutionContext> {
        const record = await this.safeLookupInvitation(token);
        const tokenMetadata = buildTokenLogMetadata(token);
        if (!record) {
            return buildSystemServiceContext({
                auditSource: AUDIT_SOURCE,
                metadata: tokenMetadata,
            });
        }

        const organization = record.organizationId
            ? await this.dependencies.organizationRepository?.getOrganization(record.organizationId)
            : null;

        return buildTenantServiceContext({
            orgId: record.organizationId,
            userId: 'invitation-service',
            dataResidency: organization?.dataResidency ?? 'UK_ONLY',
            dataClassification: organization?.dataClassification ?? 'OFFICIAL',
            auditSource: AUDIT_SOURCE,
            metadata: { ...tokenMetadata, organizationId: record.organizationId },
        });
    }

    private async safeLookupInvitation(token: string): Promise<InvitationRecord | null> {
        try {
            return await this.dependencies.invitationRepository.findByToken(token);
        } catch (error) {
            this.logger.warn('auth.invitation.lookup.failed', {
                ...buildTokenLogMetadata(token),
                reason: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
}

function buildTokenLogMetadata(token: string): { tokenHashPrefix: string; tokenLength: number } {
    const tokenHashPrefix = createHash('sha256').update(token).digest('hex').slice(0, 12);
    return {
        tokenHashPrefix,
        tokenLength: token.length,
    };
}

let sharedService: InvitationService | null = null;

export function getInvitationService(
    overrides?: Partial<InvitationServiceDependencies>,
): InvitationService {
    if (!sharedService || overrides) {
        const { userRepository } = buildUserServiceDependencies();
        const { organizationRepository } = buildOrganizationServiceDependencies();
        const dependencies: InvitationServiceDependencies = {
            invitationRepository:
                overrides?.invitationRepository ?? createInvitationRepository(),
            userRepository: overrides?.userRepository ?? userRepository,
            organizationRepository:
                overrides?.organizationRepository ?? organizationRepository,
        };

        if (!overrides) {
            sharedService = new InvitationService(dependencies);
            return sharedService;
        }

        return new InvitationService(dependencies);
    }

    return sharedService;
}
