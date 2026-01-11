import type { EmploymentType, MembershipStatus, Prisma } from '@prisma/client';
import type { Membership } from '@/server/types/membership';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

export interface EmployeeProfilePayload {
    orgId: string;
    userId: string;
    employeeNumber: string;
    jobTitle?: string | null;
    employmentType?: EmploymentType;
    startDate?: Date | null;
    metadata?: Prisma.JsonValue | null;
}

export interface UserActivationPayload {
    displayName?: string;
    email: string;
    status: MembershipStatus;
}

export interface MembershipCreationInput {
    userId: string;
    invitedByUserId?: string;
    roles: string[];
    profile: EmployeeProfilePayload;
    userUpdate: UserActivationPayload;
}

export interface MembershipCreationResult {
    organizationId: string;
    roles: string[];
}

export interface IMembershipRepository {
    findMembership(context: RepositoryAuthorizationContext, userId: string): Promise<Membership | null>;

    createMembershipWithProfile(
        context: RepositoryAuthorizationContext,
        input: MembershipCreationInput,
    ): Promise<MembershipCreationResult>;

    updateMembershipStatus(
        context: RepositoryAuthorizationContext,
        userId: string,
        status: MembershipStatus,
    ): Promise<void>;

    countActiveMemberships(context: RepositoryAuthorizationContext): Promise<number>;
}
