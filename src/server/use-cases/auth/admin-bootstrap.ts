import {
    ComplianceTier,
    DataClassificationLevel,
    DataResidencyZone,
    MembershipStatus,
    OrganizationStatus,
    RoleScope,
} from '@/server/types/prisma';
import { resolveRoleTemplate } from '@/server/security/role-templates';
import { DEFAULT_BOOTSTRAP_POLICIES } from '@/server/security/abac-constants';
import { setAbacPolicies } from '@/server/use-cases/org/abac/set-abac-policies';
import { buildAuthorizationContext } from '@/server/use-cases/shared/builders';
import { syncBetterAuthUserToPrisma } from '@/server/lib/auth-sync';
import { AuthorizationError, ValidationError } from '@/server/errors';
import type { PlatformProvisioningConfig } from '@/server/repositories/contracts/platform';
import type { JsonRecord } from '@/server/types/json';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { appLogger } from '@/server/logging/structured-logger';
import { extractIpAddress, extractUserAgent } from '@/server/use-cases/shared/request-metadata';
import {
    BOOTSTRAP_SEED_SOURCE,
    assertUuid,
    constantTimeEquals,
    isBootstrapEnabled,
    requireBootstrapSecret,
    resolvePlatformConfig,
} from './admin-bootstrap.helpers';
import { buildAdminBootstrapDependencies, type AdminBootstrapOverrides } from './admin-bootstrap.dependencies';
import { seedAdminBootstrapData } from './admin-bootstrap.seed';
import { recordBootstrapAuditEvent } from './admin-bootstrap.audit';

export interface AdminBootstrapInput {
    token: string;
    requestHeaders: Headers;
}

export interface AdminBootstrapResult {
    orgId: string;
    role: string;
    redirectTo: string;
    setActiveHeaders: Headers;
}

export async function runAdminBootstrap(
    overrides: AdminBootstrapOverrides,
    input: AdminBootstrapInput,
): Promise<AdminBootstrapResult> {
    const deps = buildAdminBootstrapDependencies(overrides);
    const ipAddress = extractIpAddress(input.requestHeaders);
    const userAgent = extractUserAgent(input.requestHeaders);

    try {
        if (!isBootstrapEnabled()) {
            throw new AuthorizationError('Admin bootstrap is disabled.');
        }

        const expectedSecret = requireBootstrapSecret();
        if (!constantTimeEquals(input.token, expectedSecret)) {
            throw new AuthorizationError('Invalid bootstrap secret.');
        }

        const session = await deps.auth.api.getSession({ headers: input.requestHeaders });
        if (!session?.session) {
            throw new AuthorizationError('Unauthenticated request.');
        }

        const userEmail = session.user.email;
        if (typeof userEmail !== 'string' || userEmail.trim().length === 0) {
            throw new ValidationError('Authenticated user is missing an email address.');
        }

        const normalizedEmail = userEmail.trim().toLowerCase();
        const userId = await deps.provisioningRepository.ensureAuthUserIdIsUuid(
            session.user.id,
            normalizedEmail,
        );
        assertUuid(userId, 'User id');

        const syncUser = deps.syncAuthUser ?? syncBetterAuthUserToPrisma;
        await syncUser({
            id: userId,
            email: normalizedEmail,
            name: typeof session.user.name === 'string' ? session.user.name : null,
            emailVerified: true,
            lastSignInAt: new Date(),
            updatedAt: new Date(),
        });

        const config = resolvePlatformConfig();
        const superAdminMetadata: JsonRecord = {
            seedSource: BOOTSTRAP_SEED_SOURCE,
            roles: [config.roleName],
            bootstrapProvider: 'oauth',
        };

        const provisioningConfig: PlatformProvisioningConfig = {
            slug: config.platformOrgSlug,
            name: config.platformOrgName,
            regionCode: config.platformRegionCode,
            tenantId: config.platformTenantId,
            status: OrganizationStatus.ACTIVE,
            complianceTier: ComplianceTier.GOV_SECURE,
            dataResidency: DataResidencyZone.UK_ONLY,
            dataClassification: DataClassificationLevel.OFFICIAL,
        };

        const organization = await deps.provisioningRepository.upsertPlatformOrganization(
            provisioningConfig,
        );

        assertUuid(organization.id, 'Organization id');

        const permissions = resolveRoleTemplate(config.roleName).permissions as Record<string, string[]>;

        const role = await deps.provisioningRepository.upsertPlatformRole({
            orgId: organization.id,
            roleName: config.roleName,
            permissions,
            scope: RoleScope.GLOBAL,
            inheritsRoleIds: [],
            isSystem: true,
            isDefault: true,
            description: 'Platform administrator',
        });

        const timestamp = new Date();

        await deps.provisioningRepository.upsertPlatformMembership({
            orgId: organization.id,
            userId,
            roleId: role.id,
            status: MembershipStatus.ACTIVE,
            metadata: superAdminMetadata,
            timestamps: {
                invitedAt: timestamp,
                activatedAt: timestamp,
                updatedAt: timestamp,
            },
            auditUserId: userId,
        });

        const existingPolicies = await deps.abacPolicyRepository.getPoliciesForOrg(organization.id);
        if (existingPolicies.length === 0) {
            const authorization = buildAuthorizationContext({
                orgId: organization.id,
                userId,
                roleKey: config.roleName,
                dataResidency: organization.dataResidency,
                dataClassification: organization.dataClassification,
                auditSource: BOOTSTRAP_SEED_SOURCE,
                tenantScope: {
                    orgId: organization.id,
                    dataResidency: organization.dataResidency,
                    dataClassification: organization.dataClassification,
                    auditSource: BOOTSTRAP_SEED_SOURCE,
                },
            });
            await setAbacPolicies(
                { policyRepository: deps.abacPolicyRepository },
                { authorization, policies: DEFAULT_BOOTSTRAP_POLICIES },
            );
        }

        await deps.provisioningRepository.ensurePlatformAuthOrganization(
            provisioningConfig,
            organization,
        );

        const existingMember = await deps.provisioningRepository.findAuthOrgMember(
            organization.id,
            userId,
        );

        if (existingMember) {
            await deps.provisioningRepository.updateAuthOrgMemberRole(existingMember.id, config.roleName);
        } else {
            await deps.provisioningRepository.createAuthOrgMember({
                organizationId: organization.id,
                userId,
                role: config.roleName,
            });
        }

        const { headers: setActiveHeaders } = await deps.auth.api.setActiveOrganization({
            headers: input.requestHeaders,
            body: { organizationId: organization.id },
            returnHeaders: true,
        });

        await seedAdminBootstrapData({
            orgId: organization.id,
            userId,
            roleKey: config.roleName,
            dataResidency: organization.dataResidency,
            dataClassification: organization.dataClassification,
        });

        await recordBootstrapAuditEvent({
            orgId: organization.id,
            userId,
            eventType: 'SYSTEM',
            action: 'admin.bootstrap.completed',
            resource: 'platform.bootstrap',
            resourceId: organization.id,
            residencyZone: organization.dataResidency,
            classification: organization.dataClassification,
            auditSource: BOOTSTRAP_SEED_SOURCE,
            payload: {
                role: config.roleName,
                ipAddress,
                userAgent,
            },
        });

        return {
            orgId: organization.id,
            role: config.roleName,
            redirectTo: '/admin/dashboard',
            setActiveHeaders,
        };
    } catch (error) {
        try {
            await recordAuditEvent({
                orgId: resolvePlatformConfig().platformTenantId,
                eventType: 'SYSTEM',
                action: 'admin.bootstrap.failed',
                resource: 'platform.bootstrap',
                auditSource: BOOTSTRAP_SEED_SOURCE,
                payload: {
                    errorType: error instanceof Error ? error.name : 'UnknownError',
                    ipAddress,
                    userAgent,
                },
            });
        } catch (auditError) {
            appLogger.error('admin.bootstrap.audit.failed', {
                error: auditError instanceof Error ? auditError.message : 'Unknown error',
            });
        }
        throw error;
    }
}
