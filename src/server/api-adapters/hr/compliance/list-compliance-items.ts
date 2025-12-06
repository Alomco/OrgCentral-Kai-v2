import type { ComplianceLogItem } from '@/server/types/compliance-types';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import {
    listComplianceItems,
    type ListComplianceItemsDependencies,
} from '@/server/use-cases/hr/compliance/list-compliance-items';
import { listComplianceItemsQuerySchema } from '@/server/types/hr-compliance-schemas';
import type { ComplianceControllerDependencies } from './common';
import { resolveComplianceControllerDependencies } from './common';

export interface ListComplianceItemsControllerResult {
    success: true;
    items: ComplianceLogItem[];
}

export async function listComplianceItemsController(
    request: Request,
    dependencies?: ComplianceControllerDependencies,
): Promise<ListComplianceItemsControllerResult> {
    const { session, complianceItemRepository } = resolveComplianceControllerDependencies(dependencies);
    const query = listComplianceItemsQuerySchema.parse({
        userId: new URL(request.url).searchParams.get('userId') ?? '',
    });

    const baseAccess = await getSessionContext(session, {
        headers: request.headers,
        requiredRoles: ['member'],
        auditSource: 'api:hr:compliance:list',
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
            auditSource: 'api:hr:compliance:list.elevated',
            action: 'read',
            resourceType: 'hr.compliance',
            resourceAttributes: {
                targetUserId: query.userId,
            },
        });
        authorization = elevated.authorization;
    }

    const useCaseDeps: ListComplianceItemsDependencies = { complianceItemRepository };
    const items = await listComplianceItems(useCaseDeps, {
        authorization,
        userId: query.userId,
    });

    return {
        success: true,
        items,
    };
}
