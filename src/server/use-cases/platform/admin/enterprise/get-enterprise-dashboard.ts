import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { ISupportTicketRepository } from '@/server/repositories/contracts/platform/admin/support-ticket-repository-contract';
import type { IBillingPlanRepository } from '@/server/repositories/contracts/platform/admin/billing-plan-repository-contract';
import type { IImpersonationRepository } from '@/server/repositories/contracts/platform/admin/impersonation-repository-contract';
import type { EnterpriseDashboardSummary } from '@/server/types/platform/enterprise-dashboard';
import { enforcePermission } from '@/server/repositories/security';
import { filterRecordsByTenantScope } from '@/server/use-cases/platform/admin/tenants/tenant-scope-guards';
import { recordAuditEvent } from '@/server/logging/audit-logger';

export interface GetEnterpriseDashboardInput {
    authorization: RepositoryAuthorizationContext;
}

export interface GetEnterpriseDashboardDependencies {
    tenantRepository: IPlatformTenantRepository;
    supportTicketRepository: ISupportTicketRepository;
    billingPlanRepository: IBillingPlanRepository;
    impersonationRepository: IImpersonationRepository;
}

export async function getEnterpriseDashboardSummary(
    deps: GetEnterpriseDashboardDependencies,
    input: GetEnterpriseDashboardInput,
): Promise<EnterpriseDashboardSummary> {
    enforcePermission(input.authorization, 'platformTenants', 'read');

    const [tenantMetrics, tickets, plans, impersonationRequests] = await Promise.all([
        deps.tenantRepository.getTenantMetrics(input.authorization),
        deps.supportTicketRepository.listTickets(input.authorization),
        deps.billingPlanRepository.listPlans(input.authorization),
        deps.impersonationRepository.listRequests(input.authorization),
    ]);

    const scopedTickets = await filterRecordsByTenantScope(
        deps.tenantRepository,
        input.authorization,
        tickets,
        (ticket) => ticket.tenantId,
    );
    const scopedImpersonations = await filterRecordsByTenantScope(
        deps.tenantRepository,
        input.authorization,
        impersonationRequests,
        (request) => request.targetOrgId,
    );

    const openTickets = scopedTickets.filter((ticket) => ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED');
    const slaBreached = openTickets.filter((ticket) => ticket.slaBreached);
    const pendingImpersonations = scopedImpersonations.filter((request) => request.status === 'PENDING');

    const summary: EnterpriseDashboardSummary = {
        tenantMetrics,
        supportMetrics: {
            openTickets: openTickets.length,
            slaBreached: slaBreached.length,
        },
        billingPlans: plans.length,
        pendingImpersonations: pendingImpersonations.length,
    };

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'ACCESS',
        action: 'platform.enterprise.dashboard',
        resource: 'enterpriseDashboard',
        payload: { ...summary },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return summary;
}
