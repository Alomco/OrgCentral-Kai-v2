import type { OrgPermissionMap } from '@/server/security/access-control';
import type { OrgAccessContext, OrgAccessInput } from '@/server/security/guards';
import type { TenantScope } from '@/server/types/tenant';

export type GuardEvaluator = (input: OrgAccessInput) => Promise<OrgAccessContext>;

export interface RepositoryAuthorizationDefaults {
    readonly requiredPermissions?: Readonly<OrgPermissionMap>;
    readonly expectedClassification?: OrgAccessInput['expectedClassification'];
    readonly expectedResidency?: OrgAccessInput['expectedResidency'];
    readonly auditSource?: string;
}

export interface RepositoryAuthorizerOptions {
    readonly guard?: GuardEvaluator;
    readonly defaults?: RepositoryAuthorizationDefaults;
}

export interface RepositoryAuthorizationContext extends OrgAccessContext {
    readonly tenantScope: TenantScope;
}

export type RepositoryAuthorizationHandler<TResult> = (
    context: RepositoryAuthorizationContext,
) => Promise<TResult>;

export interface TenantScopedRecord {
    orgId?: string | null;
}

export function hasOrgId(record: TenantScopedRecord): record is Required<TenantScopedRecord> {
    return typeof record.orgId === 'string' && record.orgId.length > 0;
}
