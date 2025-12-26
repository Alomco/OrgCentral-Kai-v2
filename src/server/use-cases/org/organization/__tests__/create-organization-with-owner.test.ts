import { describe, it, expect, vi } from 'vitest';
import { MembershipStatus, RoleScope } from '@prisma/client';

import type { MembershipCreationInput, MembershipCreationResult } from '@/server/repositories/contracts/org/membership';
import type { CreateOrganizationInput } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { Role } from '@/server/types/hr-types';
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

        const createOrganization = vi.fn<Promise<OrganizationData>, [CreateOrganizationInput]>(async () => organization);
        const getRoleByName = vi.fn<Promise<Role | null>, [string, string]>(async () => null);
        const createRole = vi.fn<Promise<void>, [string, Omit<Role, 'id' | 'createdAt' | 'updatedAt'>]>(
            async () => {},
        );
        const createMembershipWithProfile = vi.fn<
            Promise<MembershipCreationResult>,
            [RepositoryAuthorizationContext, MembershipCreationInput]
        >(async () => ({ organizationId: organization.id, roles: ['owner'] }));

        const deps: CreateOrganizationWithOwnerDependencies = {
            organizationRepository: { createOrganization },
            roleRepository: { getRoleByName, createRole },
            membershipRepository: { createMembershipWithProfile },
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
        expect(getRoleByName).toHaveBeenCalledWith(organization.id, 'owner');
        expect(createRole).toHaveBeenCalledWith(
            organization.id,
            expect.objectContaining({
                name: 'owner',
                scope: RoleScope.ORG,
            }),
        );

        const [context, membershipInput] = createMembershipWithProfile.mock.calls[0];
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
    });
});
