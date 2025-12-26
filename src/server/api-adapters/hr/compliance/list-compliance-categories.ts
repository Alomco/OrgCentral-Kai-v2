import type { ComplianceCategory } from '@/server/types/compliance-types';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { listComplianceCategories, type ListComplianceCategoriesDependencies } from '@/server/use-cases/hr/compliance/list-compliance-categories';
import type { ComplianceControllerDependencies } from './common';
import { resolveComplianceControllerDependencies } from './common';

export interface ListComplianceCategoriesControllerResult {
    success: true;
    categories: ComplianceCategory[];
}

export async function listComplianceCategoriesController(
    request: Request,
    dependencies?: ComplianceControllerDependencies,
): Promise<ListComplianceCategoriesControllerResult> {
    const { session, complianceCategoryRepository } = resolveComplianceControllerDependencies(dependencies);

    const { authorization } = await getSessionContext(session, {
        headers: request.headers,
        requiredPermissions: { organization: ['read'] },
        auditSource: 'api:hr:compliance:categories:list',
        action: 'list',
        resourceType: 'hr.compliance',
        resourceAttributes: { view: 'categories' },
    });

    const useCaseDeps: ListComplianceCategoriesDependencies = { complianceCategoryRepository };
    const categories = await listComplianceCategories(useCaseDeps, { authorization });

    return { success: true, categories };
}
