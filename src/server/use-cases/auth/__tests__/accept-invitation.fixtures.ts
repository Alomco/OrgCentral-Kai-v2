import { vi } from 'vitest';
import type { InvitationRecord } from '@/server/repositories/contracts/auth/invitations/invitation-repository.types';
import type { IInvitationRepository } from '@/server/repositories/contracts/auth/invitations';
import type { IUserRepository } from '@/server/repositories/contracts/org/users/user-repository-contract';
import type { IMembershipRepository } from '@/server/repositories/contracts/org/membership';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { OrganizationData, UserData, Membership } from '@/server/types/leave-types';
import { normalizeLeaveYearStartDate } from '@/server/types/org/leave-year-start-date';

export const actor = { userId: 'user-123', email: 'invitee@example.com' };

export const baseInvitation: InvitationRecord = {
    token: 'token-123',
    status: 'pending',
    targetEmail: actor.email,
    organizationId: 'org-1',
    organizationName: 'Org One',
    invitedByUid: 'user-admin',
    onboardingData: {
        email: actor.email,
        displayName: 'Invitee Example',
        roles: ['employee'],
    },
};

export const organization: OrganizationData = {
    id: 'org-1',
    name: 'Org One',
    slug: 'org-one',
    regionCode: 'UK-LON',
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
    auditBatchId: undefined,
    leaveEntitlements: { annual: 25 },
    primaryLeaveType: 'annual',
    leaveYearStartDate: normalizeLeaveYearStartDate('2025-01-01'),
    leaveRoundingRule: 'full_day',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

export const user: UserData = {
    id: actor.userId,
    email: actor.email,
    displayName: 'Invitee Example',
    roles: [],
    memberships: [] as Membership[],
    memberOf: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

export const buildInvitationRepository = (record: InvitationRecord): IInvitationRepository =>
({
    findByToken: vi.fn(async () => record),
    updateStatus: vi.fn(async () => undefined),
} as unknown as IInvitationRepository);

export const buildUserRepository = (): IUserRepository =>
({
    getUser: vi.fn(async () => user),
    findById: vi.fn(async () => null),
    findByEmail: vi.fn(async () => null),
    userExistsByEmail: vi.fn(async () => false),
    updateUserMemberships: vi.fn(async () => undefined),
    addUserToOrganization: vi.fn(async () => undefined),
    removeUserFromOrganization: vi.fn(async () => undefined),
    getUsersInOrganization: vi.fn(async () => []),
} as unknown as IUserRepository);

export const buildMembershipRepository = (): IMembershipRepository =>
({
    findMembership: vi.fn(async () => null),
    createMembershipWithProfile: vi.fn(async () => ({ organizationId: 'org-1', roles: ['employee'] })),
    updateMembershipStatus: vi.fn(async () => undefined),
} as unknown as IMembershipRepository);

export const buildOrganizationRepository = (): IOrganizationRepository =>
({
    getOrganization: vi.fn(async () => organization),
    getOrganizationBySlug: vi.fn(async () => organization),
    getLeaveEntitlements: vi.fn(async () => ({})),
    updateLeaveSettings: vi.fn(async () => undefined),
    addCustomLeaveType: vi.fn(async () => undefined),
    removeLeaveType: vi.fn(async () => undefined),
} as unknown as IOrganizationRepository);
