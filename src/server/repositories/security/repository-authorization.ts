import type { OrgPermissionMap } from '@/server/security/access-control';
import {
    assertOrgAccessWithAbac,
    type OrgAccessContext,
    type OrgAccessInput,
    toTenantScope,
} from '@/server/security/guards';
import { RepositoryAuthorizationError } from './repository-errors';
import type { TenantScope } from '@/server/types/tenant';

const DEFAULT_AUTHORIZATION_FAILED_MESSAGE = 'Authorization failed.';

type GuardEvaluator = (input: OrgAccessInput) => Promise<OrgAccessContext>;

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

export interface TenantScopedRecord {
    orgId?: string | null;
}

export function hasOrgId(record: TenantScopedRecord): record is Required<TenantScopedRecord> {
    return typeof record.orgId === 'string' && record.orgId.length > 0;
}

function mergeUnique<TValue>(
    base: readonly TValue[] | undefined,
    override: readonly TValue[] | undefined,
): TValue[] {
    const combined = new Set<TValue>([...(base ?? []), ...(override ?? [])]);
    return Array.from(combined);
}

function mergePermissionMaps(
    base: Readonly<OrgPermissionMap> | undefined,
    override: OrgPermissionMap | undefined,
): OrgPermissionMap | undefined {
    if (!base && !override) {
        return undefined;
    }
    const result: OrgPermissionMap = {};
    const resources = new Set<string>([...Object.keys(base ?? {}), ...Object.keys(override ?? {})]);
    for (const resource of resources) {
        const baseActions = base?.[resource] ?? [];
        const overrideActions = override?.[resource] ?? [];
        const merged = mergeUnique(baseActions, overrideActions);
        if (merged.length > 0) {
            result[resource] = merged.map((action) => action);
        }
    }
    return Object.keys(result).length ? result : undefined;
}

function toRepositoryAuthorizationError(error: unknown): RepositoryAuthorizationError {
    if (error instanceof RepositoryAuthorizationError) {
        return error;
    }

    const normalized = normalizeAuthorizationError(error);
    return new RepositoryAuthorizationError(normalized.message, { cause: normalized.cause });
}

function normalizeAuthorizationError(error: unknown): { message: string; cause: unknown } {
    if (error instanceof Error) {
        const causeText = truncate(describeUnknownError((error as { cause?: unknown }).cause));

        let message = error.message || error.name || DEFAULT_AUTHORIZATION_FAILED_MESSAGE;

        // Common wrapper message from third-party libs (e.g. "Unknown error: [object Object]")
        if (causeText && message.includes('[object Object]')) {
            message = message.replace('[object Object]', causeText);
        }

        // If the wrapper message isn't helpful, append cause details.
        if (causeText && message.trim().length > 0 && message.trim() !== causeText) {
            const lower = message.toLowerCase();
            const looksGeneric =
                lower === 'unknown error' ||
                lower.startsWith('unknown error:') ||
                lower === DEFAULT_AUTHORIZATION_FAILED_MESSAGE.toLowerCase() ||
                lower === 'authorization failed';

            if (looksGeneric) {
                message = `Authorization failed: ${causeText}`;
            }
        }

        return { message: message || DEFAULT_AUTHORIZATION_FAILED_MESSAGE, cause: error };
    }

    const described = truncate(describeUnknownError(error));
    return {
        message: described ? `Authorization failed: ${described}` : 'Authorization failed.',
        cause: error,
    };
}

function truncate(value: string | undefined, maxLength = 600): string | undefined {
    if (!value) {
        return undefined;
    }
    const text = value.trim();
    if (text.length <= maxLength) {
        return text;
    }
    return `${text.slice(0, maxLength)}…`;
}

function describeUnknownError(value: unknown): string | undefined {
    if (typeof value === 'string') {
        return value.trim().length > 0 ? value : undefined;
    }

    if (value instanceof Error) {
        const message = value.message.trim();
        return message.length > 0 ? message : value.name;
    }

    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
        return String(value);
    }

    if (!value || typeof value !== 'object') {
        return undefined;
    }

    const record = value as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim().length > 0) {
        return record.message;
    }
    if (typeof record.error === 'string' && record.error.trim().length > 0) {
        return record.error;
    }
    if (typeof record.code === 'string' && record.code.trim().length > 0) {
        const code = record.code.trim();
        const message = typeof record.message === 'string' ? record.message.trim() : '';
        return message.length > 0 ? `${code}: ${message}` : code;
    }

    const json = safeJsonStringify(value);
    if (json && json !== '{}' && json !== '[]') {
        return json;
    }

    return undefined;
}

function safeJsonStringify(value: unknown): string | undefined {
    if (!value || typeof value !== 'object') {
        return undefined;
    }

    const seen = new WeakSet<object>();
    try {
        return JSON.stringify(value, (_key, value_) => {
            if (typeof value_ === 'bigint') {
                return value_.toString();
            }
            if (typeof value_ === 'object' && value_ !== null) {
                const objectValue = value_ as object;
                if (seen.has(objectValue)) {
                    return '[Circular]';
                }
                seen.add(objectValue);
            }
            return value_ as string | number | boolean | null | object;
        });
    } catch {
        return undefined;
    }
}
