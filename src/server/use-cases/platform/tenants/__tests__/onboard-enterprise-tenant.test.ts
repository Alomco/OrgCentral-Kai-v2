import { describe, it, expect, vi, afterEach } from 'vitest';
import { RoleScope } from '@/server/types/prisma';
import type { AbsenceTypeConfig } from '@/server/types/hr-ops-types';
import type { OrganizationData } from '@/server/types/leave-types';
import type { Role } from '@/server/types/hr-types';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { MembershipCreationInput, MembershipCreationResult } from '@/server/repositories/contracts/org/membership';
import type { InvitationCreateInput, InvitationRecord } from '@/server/repositories/contracts/auth/invitations/invitation-repository.types';
import type { ManagedOrganizationSummary } from '@/server/types/enterprise-types';
import { normalizeLeaveYearStartDate } from '@/server/types/org/leave-year-start-date';
import { buildAuthorizationContext } from '@/server/use-cases/shared/builders';
import { onboardEnterpriseTenant, type OnboardEnterpriseTenantDependencies } from '../onboard-enterprise-tenant';

vi.mock('@/server/logging/audit-logger', () => ({
    recordAuditEvent: vi.fn(async () => undefined),
}));

vi.mock('@/server/lib/cache-tags', () => ({
    invalidateOrgCache: vi.fn(async () => undefined),
}));

function buildOrganizationData(): OrganizationData {
    return {
        id: 'org-100',
        slug: 'enterprise-1',
        name: 'Enterprise Org',
        regionCode: 'UK-LON',
        dataResidency: 'UK_ONLY',
        dataClassification: 'OFFICIAL',
        auditSource: 'org-repository',
        auditBatchId: undefined,
        leaveEntitlements: { annual: 25 },
        primaryLeaveType: 'annual',
        leaveYearStartDate: normalizeLeaveYearStartDate('01-01'),
        leaveRoundingRule: 'half_day',
        createdAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
        updatedAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
    };
}

function buildInvitationRecord(input: InvitationCreateInput): InvitationRecord {
    return {
        token: 'invite-123',
        status: 'pending',
        targetEmail: input.targetEmail,
        organizationId: input.orgId,
        organizationName: input.organizationName,
        onboardingData: input.onboardingData,
        invitedByUserId: input.invitedByUserId,
    };
}

function buildManagedOrganizationSummary(org: OrganizationData): ManagedOrganizationSummary {
    return {
        orgId: org.id,
        orgName: org.name,
        ownerEmail: 'owner@enterprise.test',
        planId: 'plan-enterprise',
        moduleAccess: { hr: true },
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    };
}


describe('onboardEnterpriseTenant', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('creates the organization, invitation, and managed org record', async () => {
        const organization = buildOrganizationData();
        const authorization = buildAuthorizationContext({
            orgId: 'platform-org',
            userId: 'admin-1',
            roleKey: 'orgAdmin',
            dataResidency: 'UK_ONLY',
            dataClassification: 'OFFICIAL',
            auditSource: 'api:platform:enterprise-onboarding',
            correlationId: 'corr-1',
            tenantScope: {
                orgId: 'platform-org',
                dataResidency: 'UK_ONLY',
                dataClassification: 'OFFICIAL',
                auditSource: 'api:platform:enterprise-onboarding',
            },
        });

        const createOrganization = vi.fn(async () => organization);
        const getRolesByOrganization = vi.fn(async () => [] as Role[]);
        const createRole = vi.fn(async () => undefined);
        const updateRole = vi.fn(async () => undefined);
        const createMembershipWithProfile = vi.fn(
            async (_ctx: RepositoryAuthorizationContext, _input: MembershipCreationInput): Promise<MembershipCreationResult> => ({
                organizationId: organization.id,
                roles: ['owner'],
            }),
        );
        const createInvitation = vi.fn(async (input: InvitationCreateInput) => buildInvitationRecord(input));
        const getPoliciesForOrg = vi.fn(async () => []);
        const setPoliciesForOrg = vi.fn(async () => undefined);
        const listResources = vi.fn(async () => []);
        const createResource = vi.fn(async () => undefined);
        const getConfigs = vi.fn(async () => [] as AbsenceTypeConfig[]);
        const createConfig = vi.fn(async (_ctxOrOrgId: string | RepositoryAuthorizationContext, input: Omit<AbsenceTypeConfig, 'id' | 'createdAt' | 'updatedAt'>) => ({
            ...input,
            id: `absence-${input.key}`,
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        }));
        const onboardOrganization = vi.fn(async () => buildManagedOrganizationSummary(organization));

        const deps: OnboardEnterpriseTenantDependencies = {
            organizationRepository: { createOrganization },
            roleRepository: { getRolesByOrganization, createRole, updateRole },
            membershipRepository: { createMembershipWithProfile },
            invitationRepository: { createInvitation },
            abacPolicyRepository: { getPoliciesForOrg, setPoliciesForOrg },
            permissionResourceRepository: { listResources, createResource },
            absenceTypeConfigRepository: { getConfigs, createConfig },
            enterpriseAdminRepository: { onboardOrganization },
        };

        const result = await onboardEnterpriseTenant(deps, {
            authorization,
            organization: {
                name: organization.name,
                slug: organization.slug,
                regionCode: organization.regionCode,
                dataResidency: organization.dataResidency,
                dataClassification: organization.dataClassification,
            },
            owner: { email: 'owner@enterprise.test' },
            planId: 'plan-enterprise',
            moduleAccess: { hr: true },
        });

        expect(result.organization.id).toBe(organization.id);
        expect(createOrganization).toHaveBeenCalled();
        expect(createInvitation).toHaveBeenCalled();
        expect(onboardOrganization).toHaveBeenCalledWith(
            expect.objectContaining({
                orgId: organization.id,
                orgName: organization.name,
                planId: 'plan-enterprise',
            }),
        );
        expect(createRole).toHaveBeenCalledWith(
            organization.id,
            expect.objectContaining({ name: 'owner', scope: RoleScope.ORG }),
        );
    });

    it('propagates invitation request metadata', async () => {
        const organization = buildOrganizationData();
        const authorization: RepositoryAuthorizationContext = buildAuthorizationContext({
            orgId: 'platform-org',
            userId: 'admin-1',
            roleKey: 'orgAdmin',
            dataResidency: 'UK_ONLY',
            dataClassification: 'OFFICIAL',
            auditSource: 'api:platform:enterprise-onboarding',
            correlationId: 'corr-2',
            tenantScope: {
                orgId: 'platform-org',
                dataResidency: 'UK_ONLY',
                dataClassification: 'OFFICIAL',
                auditSource: 'api:platform:enterprise-onboarding',
            },
        });

        const createOrganization = vi.fn(async () => organization);
        const getRolesByOrganization = vi.fn(async () => [] as Role[]);
        const createRole = vi.fn(async () => undefined);
        const updateRole = vi.fn(async () => undefined);
        const createMembershipWithProfile = vi.fn(
            async (_ctx: RepositoryAuthorizationContext, _input: MembershipCreationInput): Promise<MembershipCreationResult> => ({
                organizationId: organization.id,
                roles: ['owner'],
            }),
        );
        const createInvitation = vi.fn(async (input: InvitationCreateInput) => buildInvitationRecord(input));
        const getPoliciesForOrg = vi.fn(async () => []);
        const setPoliciesForOrg = vi.fn(async () => undefined);
        const listResources = vi.fn(async () => []);
        const createResource = vi.fn(async () => undefined);
        const getConfigs = vi.fn(async () => [] as AbsenceTypeConfig[]);
        const createConfig = vi.fn(async (_ctxOrOrgId: string | RepositoryAuthorizationContext, input: Omit<AbsenceTypeConfig, 'id' | 'createdAt' | 'updatedAt'>) => ({
            ...input,
            id: `absence-${input.key}`,
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        }));
        const onboardOrganization = vi.fn(async () => buildManagedOrganizationSummary(organization));

        const deps: OnboardEnterpriseTenantDependencies = {
            organizationRepository: { createOrganization },
            roleRepository: { getRolesByOrganization, createRole, updateRole },
            membershipRepository: { createMembershipWithProfile },
            invitationRepository: { createInvitation },
            abacPolicyRepository: { getPoliciesForOrg, setPoliciesForOrg },
            permissionResourceRepository: { listResources, createResource },
            absenceTypeConfigRepository: { getConfigs, createConfig },
            enterpriseAdminRepository: { onboardOrganization },
        };

        await onboardEnterpriseTenant(deps, {
            authorization,
            organization: {
                name: organization.name,
                slug: organization.slug,
                regionCode: organization.regionCode,
                dataResidency: organization.dataResidency,
                dataClassification: organization.dataClassification,
            },
            owner: { email: 'owner@enterprise.test' },
            planId: 'plan-enterprise',
            moduleAccess: { hr: true },
            request: {
                ipAddress: '10.1.1.10',
                userAgent: 'unit-test',
                securityContext: {
                    action: 'platform.enterprise.onboard',
                    orgId: authorization.orgId,
                },
            },
        });

        const call = createInvitation.mock.calls[0];
        if (!call) {
            throw new Error('Expected createInvitation to be called');
        }
        const [payload] = call;
        expect(payload.ipAddress).toBe('10.1.1.10');
        expect(payload.userAgent).toBe('unit-test');
        expect(payload.securityContext).toEqual(
            expect.objectContaining({
                action: 'platform.enterprise.onboard',
                orgId: authorization.orgId,
            }),
        );
    });
});
