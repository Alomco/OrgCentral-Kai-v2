/**
 * Contract for repositories that provide guard-facing membership lookups.
 * Guards use it to enforce zero-trust access without touching Prisma directly.
 */
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import type { OrgPermissionMap } from '@/server/security/access-control';
import type { MembershipStatus, RoleScope } from '../../../../generated/client';

export interface GuardMembershipRecord {
    orgId: string;
    userId: string;
    status: MembershipStatus;
    roleId?: string | null;
    roleName?: string | null;
    roleScope?: RoleScope | null;
    /** Raw permissions attached to the membership role (custom roles live here). */
    rolePermissions?: OrgPermissionMap | null;
    departmentId?: string | null;
    metadata?: Record<string, unknown> | null;
    organization: {
        id: string;
        name?: string | null;
        dataResidency: DataResidencyZone;
        dataClassification: DataClassificationLevel;
    };
}

export interface IGuardMembershipRepository {
    findMembership(orgId: string, userId: string): Promise<GuardMembershipRecord | null>;
}
