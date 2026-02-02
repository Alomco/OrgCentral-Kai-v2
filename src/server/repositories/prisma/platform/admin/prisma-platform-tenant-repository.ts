import type { IPlatformTenantRepository, PlatformTenantListQuery, PlatformTenantMetrics } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { PlatformTenantDetail, PlatformTenantListItem, PlatformTenantListResult, PlatformTenantSubscriptionSummary } from '@/server/types/platform/tenant-admin';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import { type Prisma, type PrismaClientInstance, type OrganizationStatus } from '@/server/types/prisma';
import type { JsonRecord } from '@/server/types/json';

export class PrismaPlatformTenantRepository extends BasePrismaRepository implements IPlatformTenantRepository {
    constructor(options?: { prisma?: PrismaClientInstance }) {
        super({ prisma: options?.prisma });
    }

    async listTenants(
        context: RepositoryAuthorizationContext,
        query: PlatformTenantListQuery,
    ): Promise<PlatformTenantListResult> {
        const filter = buildTenantFilter(context, query);
        const skip = (query.page - 1) * query.pageSize;

        const [items, total] = await this.prisma.$transaction([
            this.prisma.organization.findMany({
                where: filter,
                orderBy: { createdAt: 'desc' },
                skip,
                take: query.pageSize,
            }),
            this.prisma.organization.count({ where: filter }),
        ]);

        return {
            items: items.map(mapTenantListItem),
            total,
            page: query.page,
            pageSize: query.pageSize,
        };
    }

    async getTenantDetail(
        context: RepositoryAuthorizationContext,
        tenantId: string,
    ): Promise<PlatformTenantDetail | null> {
        const tenant = await this.prisma.organization.findFirst({
            where: buildTenantAccessFilter(context, tenantId),
            include: {
                subscriptions: true,
            },
        });

        if (!tenant) {
            return null;
        }

        const subscription = tenant.subscriptions.length > 0
            ? mapSubscription(tenant.subscriptions[0])
            : null;

        return {
            ...mapTenantListItem(tenant),
            ownerName: tenant.ownerName,
            ownerPhone: tenant.phone,
            website: tenant.website,
            subscription,
            governanceTags: normalizeJsonRecord(tenant.governanceTags),
            securityControls: normalizeJsonRecord(tenant.securityControls),
        };
    }

    async updateTenantStatus(
        context: RepositoryAuthorizationContext,
        tenantId: string,
        status: OrganizationStatus,
    ): Promise<PlatformTenantDetail> {
        const tenant = await this.prisma.organization.findFirst({
            where: buildTenantAccessFilter(context, tenantId),
        });

        if (!tenant) {
            throw new Error('Tenant not found or not within allowed scope.');
        }

        const updated = await this.prisma.organization.update({
            where: { id: tenantId },
            data: { status },
            include: { subscriptions: true },
        });

        const subscription = updated.subscriptions.length > 0
            ? mapSubscription(updated.subscriptions[0])
            : null;

        return {
            ...mapTenantListItem(updated),
            ownerName: updated.ownerName,
            ownerPhone: updated.phone,
            website: updated.website,
            subscription,
            governanceTags: normalizeJsonRecord(updated.governanceTags),
            securityControls: normalizeJsonRecord(updated.securityControls),
        };
    }

    async getTenantMetrics(context: RepositoryAuthorizationContext): Promise<PlatformTenantMetrics> {
        const filter = buildTenantFilter(context, {});

        const [total, active, suspended, decommissioned] = await this.prisma.$transaction([
            this.prisma.organization.count({ where: filter }),
            this.prisma.organization.count({ where: { ...filter, status: 'ACTIVE' } }),
            this.prisma.organization.count({ where: { ...filter, status: 'SUSPENDED' } }),
            this.prisma.organization.count({ where: { ...filter, status: 'DECOMMISSIONED' } }),
        ]);

        return { total, active, suspended, decommissioned };
    }
}

type OrganizationRecord = Prisma.OrganizationGetPayload<Prisma.OrganizationDefaultArgs>;
type OrganizationSubscriptionRecord = Prisma.OrganizationSubscriptionGetPayload<Prisma.OrganizationSubscriptionDefaultArgs>;

function buildTenantFilter(
    context: RepositoryAuthorizationContext,
    query: Pick<PlatformTenantListQuery, 'query' | 'status' | 'complianceTier' | 'classification' | 'residency'>,
): Prisma.OrganizationWhereInput {
    const search = query.query?.trim();
    const classification = query.classification?.length
        ? query.classification
        : [context.dataClassification];
    const residency = query.residency?.length ? query.residency : [context.dataResidency];

    return {
        ...(search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { slug: { contains: search, mode: 'insensitive' } },
                    { ownerEmail: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}),
        ...(query.status?.length ? { status: { in: query.status } } : {}),
        ...(query.complianceTier?.length ? { complianceTier: { in: query.complianceTier } } : {}),
        dataClassification: { in: classification },
        dataResidency: { in: residency },
    };
}

function buildTenantAccessFilter(
    context: RepositoryAuthorizationContext,
    tenantId: string,
): Prisma.OrganizationWhereInput {
    return {
        id: tenantId,
        dataClassification: context.dataClassification,
        dataResidency: context.dataResidency,
    };
}

function mapTenantListItem(tenant: OrganizationRecord): PlatformTenantListItem {
    return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        complianceTier: tenant.complianceTier,
        dataResidency: tenant.dataResidency,
        dataClassification: tenant.dataClassification,
        regionCode: tenant.regionCode,
        ownerEmail: tenant.ownerEmail,
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt.toISOString(),
    };
}

function mapSubscription(subscription: OrganizationSubscriptionRecord): PlatformTenantSubscriptionSummary {
    return {
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        stripePriceId: subscription.stripePriceId,
        status: subscription.status,
        seatCount: subscription.seatCount,
        currentPeriodEnd: subscription.currentPeriodEnd ? subscription.currentPeriodEnd.toISOString() : null,
    };
}

function normalizeJsonRecord(input: Prisma.JsonValue | null): JsonRecord | null {
    if (!input || typeof input !== 'object') {
        return null;
    }
    return input as JsonRecord;
}
