import type { PrismaClientInstance } from '@/server/types/prisma';
import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import { RepositoryAuthorizationError } from '@/server/repositories/security/repository-errors';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import { getTenantAccessGuard } from '@/server/repositories/security/tenant-guard';
import type { CacheScope } from '@/server/repositories/cache-scopes';

export interface BasePrismaRepositoryOptions {
    prisma?: PrismaClientInstance;
    /**
     * Optional hook invoked after a repository write to support cache invalidation or telemetry.
     */
    onAfterWrite?: (orgId: string, scopes?: CacheScope[]) => Promise<void> | void;
    /**
     * Optional tracer hook to wrap repository operations. Accepts either a span name + handler, or span name + metadata.
     */
    trace?: (
        operation: string,
        functionOrMetadata?: (() => Promise<unknown>) | Record<string, unknown>,
    ) => Promise<unknown> | undefined;
}

export type PrismaOptions = Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;

/**
 * Abstract base class for all Prisma-backed repositories.
 * Enforces constructor dependency injection per SOLID principles.
 * Supports optional cache invalidation and tracing hooks.
 * Implements enhanced tenant isolation validation.
 */
export abstract class BasePrismaRepository {
    protected readonly prisma: PrismaClientInstance;
    private readonly onAfterWrite?: BasePrismaRepositoryOptions['onAfterWrite'];
    private readonly traceHook?: BasePrismaRepositoryOptions['trace'];
    private readonly tenantGuard = getTenantAccessGuard();
    private readonly fallbackContextDefaults = {
        dataResidency: 'UK_ONLY' as const,
        dataClassification: 'OFFICIAL' as const,
    };

    constructor(options: BasePrismaRepositoryOptions | PrismaClientInstance = {}) {
        if ('$connect' in (options as PrismaClientInstance)) {
            this.prisma = options as PrismaClientInstance;
            this.onAfterWrite = undefined;
            this.traceHook = undefined;
            return;
        }

        const options_ = options as BasePrismaRepositoryOptions;
        this.prisma = options_.prisma ?? defaultPrismaClient;
        this.onAfterWrite = options_.onAfterWrite;
        this.traceHook = options_.trace;
    }

    protected async runWithTracing<TResult>(
        operation: string,
        handler: () => Promise<TResult>,
        metadata?: Record<string, unknown>,
    ): Promise<TResult> {
        if (!this.traceHook) {
            return handler();
        }

        // Support both (spanName, handler) and (spanName, metadata) signatures.
        if (this.traceHook.length >= 2) {
            const result = this.traceHook(operation, () => handler());
            if (result) {
                return result as Promise<TResult>;
            }
            return handler();
        }

        await this.traceHook(operation, metadata);
        return handler();
    }

    protected async invalidateAfterWrite(orgId: string, scopes: CacheScope[]): Promise<void> {
        if (!this.onAfterWrite) {
            return;
        }
        await this.onAfterWrite(orgId, scopes);
    }

    /**
     * Enhanced tenant-guard helper to prevent cross-org access in repositories.
     * Includes additional validation for data classification and residency.
     */
    protected assertTenantRecord<TRecord extends { orgId?: string | null }>(
        record: TRecord | null | undefined,
        contextOrOrg: RepositoryAuthorizationContext | string,
        resourceType = 'record',
    ): TRecord {
        if (typeof contextOrOrg === 'string') {
            if (!record) {
                throw new RepositoryAuthorizationError('Record not found.');
            }
            if (record.orgId !== contextOrOrg) {
                throw new RepositoryAuthorizationError('Cross-tenant access detected.');
            }
            return record;
        }

        return this.tenantGuard.assertReadable(record, contextOrOrg, resourceType);
    }

    /**
     * Validates that the requested operation complies with data residency requirements
     */
    protected validateDataResidency(
        context: RepositoryAuthorizationContext,
        operation: string,
        resourceType: string,
    ): void {
        this.tenantGuard.validateDataResidency(context, operation, resourceType);
    }

    /**
     * Validates that the requested operation complies with PII access requirements
     */
    protected validatePiiAccess(
        context: RepositoryAuthorizationContext,
        operation: 'read' | 'write' | 'delete' | 'update',
        resourceType: string,
    ): void {
        this.tenantGuard.validatePii(context, operation, resourceType);
    }

    /**
     * Validates classification compliance between context and record
     */
    /**
     * Helper method to validate tenant isolation for write operations
     */
    protected validateTenantWriteAccess(
        context: RepositoryAuthorizationContext,
        recordOrgId: string,
        operation: 'write' | 'update' | 'delete',
    ): void {
        this.tenantGuard.assertWritable(recordOrgId, context, 'write_operation', operation);
    }
    protected normalizeAuthorizationContext(
        contextOrOrgId: RepositoryAuthorizationContext | string,
        auditSource = 'repository:fallback',
    ): RepositoryAuthorizationContext {
        if (typeof contextOrOrgId !== 'string') {
            return contextOrOrgId;
        }

        const now = new Date();
        const tenantScope = {
            orgId: contextOrOrgId,
            dataResidency: this.fallbackContextDefaults.dataResidency,
            dataClassification: this.fallbackContextDefaults.dataClassification,
            auditSource,
        };

        return {
            ...tenantScope,
            tenantScope,
            auditBatchId: undefined,
            roleKey: 'custom',
            userId: 'system',
            sessionId: 'system',
            roles: [],
            permissions: {},
            mfaVerified: false,
            ipAddress: '127.0.0.1',
            userAgent: 'repository-fallback',
            authenticatedAt: now,
            sessionExpiresAt: now,
            lastActivityAt: now,
            requiresMfa: false,
            piiAccessRequired: false,
            dataBreachRisk: false,
            sessionToken: 'system',
            authorizedAt: now,
            authorizationReason: auditSource,
        } satisfies RepositoryAuthorizationContext;
    }
}
