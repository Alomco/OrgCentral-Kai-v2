import { BasePrismaRepository, type BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { RepositoryAuthorizationContext, TenantScopedRecord } from '@/server/types/repository-authorization';
import { RepositoryAuthorizer } from '@/server/repositories/security/repository-authorizer';
import { registerOrgCacheTag, invalidateOrgCache } from '@/server/lib/cache-tags';
import type { PrismaClientInstance } from '@/server/types/prisma';
import type { CacheScope } from '@/server/repositories/cache-scopes';

export interface OrgScopedRepositoryOptions extends BasePrismaRepositoryOptions {
    prisma?: PrismaClientInstance;
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
        contextOrOrg: RepositoryAuthorizationContext | string,
        resourceType = 'org_scoped_record',
    ): TRecord {
        if (typeof contextOrOrg === 'string') {
            return super.assertTenantRecord(record, contextOrOrg, resourceType);
        }
        return super.assertTenantRecord(record, contextOrOrg, resourceType);
    }

    protected assertOrgRecord<TRecord extends TenantScopedRecord>(
        record: TRecord | null | undefined,
        contextOrOrg: RepositoryAuthorizationContext | string,
        resourceType = 'org_scoped_record',
    ): TRecord {
        return this.assertTenantRecord(record, contextOrOrg, resourceType);
    }

    protected tagCache(context: RepositoryAuthorizationContext, ...tags: CacheScope[]): void {
        for (const tag of tags) {
            registerOrgCacheTag(context.orgId, tag, context.dataClassification, context.dataResidency);
        }
    }

    protected async invalidateCache(context: RepositoryAuthorizationContext, ...tags: CacheScope[]): Promise<void> {
        await Promise.all(
            tags.map((tag) => invalidateOrgCache(context.orgId, tag, context.dataClassification, context.dataResidency)),
        );
    }
}
