/**
 * TODO: Refactor this file (currently > 250 LOC).
 * Action: Split into smaller modules and ensure adherence to SOLID principles, Dependency Injection, and Design Patterns.
 */
import {
    assertOrgAccessWithAbac,
    type OrgAccessContext,
    type OrgAccessInput,
    toTenantScope,
} from '@/server/security/guards';
import { RepositoryAuthorizationError } from './repository-errors';
import { authorizeOrgAccessRbacOnly } from '@/server/security/authorization/engine';
import { mergePermissionMaps, toRepositoryAuthorizationError } from './repository-authorization.helpers';
import type {
    GuardEvaluator,
    RepositoryAuthorizationContext,
    RepositoryAuthorizationDefaults,
    RepositoryAuthorizationHandler,
    RepositoryAuthorizerOptions,
    TenantScopedRecord,
} from '@/server/types/repository-authorization';
import { hasOrgId } from '@/server/types/repository-authorization';

export class RepositoryAuthorizer {
    private static singleton: RepositoryAuthorizer | null = null;
    private readonly guard: GuardEvaluator;
    private readonly defaults: RepositoryAuthorizationDefaults;

    constructor(options?: RepositoryAuthorizerOptions) {
        this.guard = options?.guard ?? assertOrgAccessWithAbac;
        this.defaults = options?.defaults ?? {};
    }

    static default(): RepositoryAuthorizer {
        RepositoryAuthorizer.singleton ??= new RepositoryAuthorizer();
        return RepositoryAuthorizer.singleton;
    }

    async authorize<TResult>(
        input: OrgAccessInput,
        handler: RepositoryAuthorizationHandler<TResult>,
    ): Promise<TResult> {
        const mergedInput = this.mergeWithDefaults(input);
        const context = await this.evaluateGuard(mergedInput);
        const tenantScope = toTenantScope(context);
        return handler({ ...context, tenantScope });
    }

    assertTenantRecord<TRecord extends TenantScopedRecord>(
        record: TRecord | null | undefined,
        context: RepositoryAuthorizationContext,
    ): TRecord {
        if (!record) {
            throw new RepositoryAuthorizationError('Record not found.');
        }
        if (!hasOrgId(record) || record.orgId !== context.orgId) {
            throw new RepositoryAuthorizationError('Cross-tenant access detected.');
        }
        return record;
    }

    private mergeWithDefaults(input: OrgAccessInput): OrgAccessInput {
        const mergedPermissions = mergePermissionMaps(
            this.defaults.requiredPermissions,
            input.requiredPermissions,
        );
        return {
            ...this.defaults,
            ...input,
            requiredPermissions: mergedPermissions,
            expectedClassification:
                input.expectedClassification ?? this.defaults.expectedClassification,
            expectedResidency: input.expectedResidency ?? this.defaults.expectedResidency,
            auditSource: input.auditSource ?? this.defaults.auditSource,
        };
    }

    private async evaluateGuard(input: OrgAccessInput): Promise<OrgAccessContext> {
        try {
            return await this.guard(input);
        } catch (error) {
            throw toRepositoryAuthorizationError(error);
        }
    }
}

export function withRepositoryAuthorization<TResult>(
    input: OrgAccessInput,
    handler: RepositoryAuthorizationHandler<TResult>,
    authorizer: RepositoryAuthorizer = RepositoryAuthorizer.default(),
): Promise<TResult> {
    return authorizer.authorize(input, handler);
}

export function enforcePermission(
    context: RepositoryAuthorizationContext,
    resource: string,
    action: string,
): void {
    // We construct a temporary input to validate just this permission against the context
    const input = {
        orgId: context.orgId,
        userId: context.userId,
        requiredPermissions: { [resource]: [action] },
    };

    // Check RBAC using the standard engine
    authorizeOrgAccessRbacOnly(input, context);
}

// helper functions moved to repository-authorization.helpers.ts
