import type { PrismaClient } from '@prisma/client';
import { BasePrismaRepository, type BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { RepositoryAuthorizationContext, TenantScopedRecord } from '@/server/repositories/security';
import { RepositoryAuthorizer, RepositoryAuthorizationError } from '@/server/repositories/security';
import { registerOrgCacheTag, invalidateOrgCache } from '@/server/lib/cache-tags';

export interface OrgScopedRepositoryOptions extends BasePrismaRepositoryOptions {
    prisma?: PrismaClient;
    authorizer?: RepositoryAuthorizer;
}

export abstract class OrgScopedPrismaRepository extends BasePrismaRepository {
    protected readonly repositoryAuthorizer: RepositoryAuthorizer;

    public constructor(options?: OrgScopedRepositoryOptions) {
        super(options ?? {});
        this.repositoryAuthorizer = options?.authorizer ?? RepositoryAuthorizer.default();
    }

    protected assertTenantRecord<TRecord extends TenantScopedRecord>(
        record: TRecord | null | undefined,
        orgId: string,
    ): TRecord {
        if (!record || !record.orgId || record.orgId !== orgId) {
            throw new RepositoryAuthorizationError('Cross-tenant access detected.');
        }
        return record;
    }

    protected assertOrgRecord<TRecord extends TenantScopedRecord>(
        record: TRecord | null | undefined,
        orgId: string,
    ): TRecord {
        if (!record) {
            throw new RepositoryAuthorizationError('Record not found.');
        }
        if (!record.orgId || record.orgId !== orgId) {
            throw new RepositoryAuthorizationError('Cross-tenant access detected.');
        }
        return record;
    }

    protected tagCache(context: RepositoryAuthorizationContext, ...tags: string[]): void {
        for (const tag of tags) {
            registerOrgCacheTag(context.orgId, tag);
        }
    }

    protected async invalidateCache(context: RepositoryAuthorizationContext, ...tags: string[]): Promise<void> {
        await Promise.all(tags.map((tag) => invalidateOrgCache(context.orgId, tag)));
    }
}
