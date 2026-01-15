import { describe, it, expect, vi } from 'vitest';
import { MembershipStatus, RoleScope } from '@/server/types/prisma';

import type { MembershipCreationInput, MembershipCreationResult } from '@/server/repositories/contracts/org/membership';
import type { CreateOrganizationInput } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { Role } from '@/server/types/hr-types';
import type { AbsenceTypeConfig } from '@/server/types/hr-ops-types';
import type { OrganizationData } from '@/server/types/leave-types';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { normalizeLeaveYearStartDate } from '@/server/types/org/leave-year-start-date';
import { buildAuthorizationContext } from '@/server/use-cases/shared/builders';
import {
    createOrganizationWithOwner,
    type CreateOrganizationWithOwnerDependencies,
} from '../create-organization-with-owner';

function buildOrganizationData(): OrganizationData {
    return {
        id: 'org-1',
        slug: 'acme',
        name: 'Acme Corp',
        regionCode: 'UK-LON',
        dataResidency: 'UK_ONLY',
        dataClassification: 'OFFICIAL',
        auditSource: 'org-repository',
        auditBatchId: undefined,
        leaveEntitlements: { annual: 25 },
        primaryLeaveType: 'annual',
        leaveYearStartDate: normalizeLeaveYearStartDate('01-01'),
        leaveRoundingRule: 'half_day',
        createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        updatedAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
    };
}

describe('createOrganizationWithOwner', () => {
    it('creates owner role and membership for the creator', async () => {
        const organization = buildOrganizationData();

        const createOrganization = vi.fn(async (input: CreateOrganizationInput) => organization);
        const getRolesByOrganization = vi.fn(async () => []);
        const createRole = vi.fn(
            async (orgId: string, roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => { },
        );
        const updateRole = vi.fn(async () => { });
        const createMembershipWithProfile = vi.fn(
            async (_ctx: RepositoryAuthorizationContext, _input: MembershipCreationInput): Promise<MembershipCreationResult> =>
                ({ organizationId: organization.id, roles: ['owner'] })
        );
        const getPoliciesForOrg = vi.fn(async () => []);
        const setPoliciesForOrg = vi.fn(async () => { });
        const listPermissionResources = vi.fn(async () => []);
        const createPermissionResource = vi.fn(async () => { });
        const getAbsenceTypeConfigs = vi.fn(async () => [] as AbsenceTypeConfig[]);
        const createAbsenceTypeConfig = vi.fn(
            async (
                _orgId: string,
                input: Omit<AbsenceTypeConfig, 'id' | 'createdAt' | 'updatedAt'>,
            ): Promise<AbsenceTypeConfig> => ({
                ...input,
                id: 'absence-type-1',
                createdAt: new Date('2024-01-01T00:00:00.000Z'),
                updatedAt: new Date('2024-01-01T00:00:00.000Z'),
            }),
        );

        const deps: CreateOrganizationWithOwnerDependencies = {
            organizationRepository: { createOrganization },
            roleRepository: { getRolesByOrganization, createRole, updateRole },
            membershipRepository: { createMembershipWithProfile },
            abacPolicyRepository: { getPoliciesForOrg, setPoliciesForOrg },
            permissionResourceRepository: { listResources: listPermissionResources, createResource: createPermissionResource },
            absenceTypeConfigRepository: { getConfigs: getAbsenceTypeConfigs, createConfig: createAbsenceTypeConfig },
        };

        const authorization = buildAuthorizationContext({
            orgId: 'platform-org',
            userId: 'user-1',
            roleKey: 'orgAdmin',
            dataResidency: 'UK_ONLY',
            dataClassification: 'OFFICIAL',
            auditSource: 'api:org:organization:create',
            correlationId: 'corr-1',
            tenantScope: {
                orgId: 'platform-org',
                dataResidency: 'UK_ONLY',
                dataClassification: 'OFFICIAL',
                auditSource: 'api:org:organization:create',
            },
        });

        const organizationInput: CreateOrganizationInput = {
            slug: 'acme',
            name: 'Acme Corp',
            regionCode: 'UK-LON',
            tenantId: authorization.orgId,
            dataResidency: 'UK_ONLY',
            dataClassification: 'OFFICIAL',
        };

        const result = await createOrganizationWithOwner(deps, {
            authorization,
            actor: {
                userId: authorization.userId,
                email: 'owner@acme.test',
                displayName: 'Acme Owner',
            },
            organization: organizationInput,
        });

        expect(result.organization.id).toBe(organization.id);
        expect(createOrganization).toHaveBeenCalledWith(organizationInput);
        expect(getRolesByOrganization).toHaveBeenCalledWith(organization.id);
        expect(createRole).toHaveBeenCalledWith(
            organization.id,
            expect.objectContaining({ name: 'owner', scope: RoleScope.ORG }),
        );
        expect(setPoliciesForOrg).toHaveBeenCalled();

        const call = createMembershipWithProfile.mock.calls[0];
        if (!call) throw new Error('Expected createMembershipWithProfile to be called');
        const [context, membershipInput] = call;
        expect(context.orgId).toBe(organization.id);
        expect(membershipInput.roles).toEqual(['owner']);
        expect(membershipInput.userUpdate).toEqual(
            expect.objectContaining({
                email: 'owner@acme.test',
                status: MembershipStatus.ACTIVE,
                displayName: 'Acme Owner',
            }),
        );
        expect(membershipInput.profile.employeeNumber).toEqual(expect.any(String));

        expect(listPermissionResources).toHaveBeenCalledWith(organization.id);
        expect(createPermissionResource).toHaveBeenCalled();
        expect(getAbsenceTypeConfigs).toHaveBeenCalledWith(
            expect.objectContaining({ orgId: organization.id }),
            { includeInactive: true },
        );
        expect(createAbsenceTypeConfig).toHaveBeenCalled();
    });
});
