import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import {
    listComplianceItemsGrouped,
    type ListComplianceItemsGroupedDependencies,
} from '@/server/use-cases/hr/compliance/list-compliance-items-grouped';
import { listComplianceItemsGroupedQuerySchema } from '@/server/types/hr-compliance-schemas';
import type { ComplianceControllerDependencies } from './common';
import { resolveComplianceControllerDependencies } from './common';

export interface ListComplianceItemsGroupedControllerResult {
    success: true;
    groups: Awaited<ReturnType<typeof listComplianceItemsGrouped>>;
}

export async function listComplianceItemsGroupedController(
    request: Request,
    dependencies?: ComplianceControllerDependencies,
): Promise<ListComplianceItemsGroupedControllerResult> {
    const { session, complianceItemRepository, complianceCategoryRepository } = resolveComplianceControllerDependencies(
        dependencies,
    );
    const query = listComplianceItemsGroupedQuerySchema.parse({
        userId: new URL(request.url).searchParams.get('userId') ?? '',
    });

    const baseAccess = await getSessionContext(session, {
        headers: request.headers,
        requiredPermissions: { employeeProfile: ['read'] },
        auditSource: 'api:hr:compliance:list-grouped',
        action: 'read',
        resourceType: 'hr.compliance',
        resourceAttributes: {
            targetUserId: query.userId,
        },
    });

    let authorization = baseAccess.authorization;

    if (query.userId !== authorization.userId) {
        const elevated = await getSessionContext(session, {
            headers: request.headers,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'api:hr:compliance:list-grouped.elevated',
            action: 'read',
            resourceType: 'hr.compliance',
            resourceAttributes: {
                targetUserId: query.userId,
            },
        });
        authorization = elevated.authorization;
    }

    const useCaseDeps: ListComplianceItemsGroupedDependencies = {
        complianceItemRepository,
        complianceCategoryRepository,
    };
    const groups = await listComplianceItemsGrouped(useCaseDeps, {
        authorization,
        userId: query.userId,
    });

    return {
        success: true,
        groups,
    };
}
