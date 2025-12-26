import { describe, it, expect, beforeEach } from 'vitest';
import { MembershipService } from '../membership-service';
import { EntityNotFoundError } from '@/server/errors';
import {
    FakeInvitationRepository,
    FakeMembershipRepository,
    FakeOrganizationRepository,
    FakeUserRepository,
    buildInvitation,
} from './membership-service.fixtures';

describe('MembershipService', () => {
    let invitationRepository: FakeInvitationRepository;
    let membershipRepository: FakeMembershipRepository;
    let userRepository: FakeUserRepository;
    let organizationRepository: FakeOrganizationRepository;

    beforeEach(() => {
        invitationRepository = new FakeInvitationRepository(new Map([['token-1', buildInvitation('token-1')]]));
        membershipRepository = new FakeMembershipRepository({
            organizationId: 'org-1',
            roles: ['user'],
        });
        userRepository = new FakeUserRepository();
        organizationRepository = new FakeOrganizationRepository();
    });

    it('accepts invitation and creates membership/profile', async () => {
        const service = new MembershipService({
            invitationRepository,
            membershipRepository,
            userRepository,
            organizationRepository,
        });

        const result = await service.acceptInvitation({
            token: 'token-1',
            actor: { userId: 'user-1', email: 'user@example.com' },
        });

        expect(result.success).toBe(true);
        expect(result.organizationId).toBe('org-1');
        expect(membershipRepository.createdInput?.userId).toBe('user-1');
        expect(membershipRepository.context?.orgId).toBe('org-1');
    });

    it('throws when invitation is not found', async () => {
        const service = new MembershipService({
            invitationRepository: new FakeInvitationRepository(new Map()),
            membershipRepository,
            userRepository,
            organizationRepository,
        });

        await expect(
            service.acceptInvitation({
                token: 'missing',
                actor: { userId: 'user-1', email: 'user@example.com' },
            }),
        ).rejects.toBeInstanceOf(EntityNotFoundError);
    });
});
