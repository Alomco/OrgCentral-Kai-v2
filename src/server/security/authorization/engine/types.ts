import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import type { OrgPermissionMap, OrgRoleKey } from '@/server/security/access-control';

export interface OrgAuthorizationInput {
    orgId: string;
    userId: string;

    requiredPermissions?: OrgPermissionMap;
    /** Any one of these permission sets must be satisfied. */
    requiredAnyPermissions?: readonly OrgPermissionMap[];

    expectedClassification?: DataClassificationLevel;
    expectedResidency?: DataResidencyZone;

    // ABAC fields
    action?: string;
    resourceType?: string;
    resourceAttributes?: Record<string, unknown>;
}

export interface OrgAuthorizationContext {
    orgId: string;
    userId: string;
    roleKey: OrgRoleKey | 'custom';
    roleName?: string | null;
    roleId?: string | null;
    permissions: OrgPermissionMap;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;

}

export interface OrgAuthorizationEngine {
    /** Validates tenant-scoped constraints like classification + residency. */
    assertTenantConstraints(input: OrgAuthorizationInput, context: OrgAuthorizationContext): void;

    /** Validates permission-based RBAC requirements. */
    assertRbac(input: OrgAuthorizationInput, context: OrgAuthorizationContext): void;

    /** Validates ABAC requirements (no-op if no action/resourceType provided). */
    assertAbac(input: OrgAuthorizationInput, context: OrgAuthorizationContext): Promise<void>;
}
