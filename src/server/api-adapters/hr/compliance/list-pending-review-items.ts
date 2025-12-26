import type { ComplianceLogItem } from '@/server/types/compliance-types';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import {
    listPendingReviewComplianceItems,
    type ListPendingReviewComplianceItemsDependencies,
} from '@/server/use-cases/hr/compliance/list-pending-review-items';
import { listPendingReviewComplianceItemsQuerySchema } from '@/server/types/hr-compliance-schemas';
import type { ComplianceControllerDependencies } from './common';
import { resolveComplianceControllerDependencies } from './common';

export interface ListPendingReviewComplianceItemsControllerResult {
    success: true;
    items: ComplianceLogItem[];
}

export async function listPendingReviewComplianceItemsController(
    request: Request,
    dependencies?: ComplianceControllerDependencies,
): Promise<ListPendingReviewComplianceItemsControllerResult> {
    const { session, complianceItemRepository } = resolveComplianceControllerDependencies(dependencies);

    const url = new URL(request.url);
    const query = listPendingReviewComplianceItemsQuerySchema.parse({
        take: url.searchParams.get('take') ?? undefined,
    });

    const access = await getSessionContext(session, {
        headers: request.headers,
        requiredPermissions: { organization: ['read'] },
        auditSource: 'api:hr:compliance:review-queue:list',
        action: 'list',
        resourceType: 'hr.compliance',
        resourceAttributes: { view: 'review-queue' },
    });

    const useCaseDeps: ListPendingReviewComplianceItemsDependencies = { complianceItemRepository };
    const items = await listPendingReviewComplianceItems(useCaseDeps, {
        authorization: access.authorization,
        take: query.take,
    });

    return { success: true, items };
}
