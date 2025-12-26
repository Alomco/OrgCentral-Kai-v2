import type { ComplianceTemplate } from '@/server/types/compliance-types';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { listComplianceTemplates, type ListComplianceTemplatesDependencies } from '@/server/use-cases/hr/compliance/list-compliance-templates';
import type { ComplianceControllerDependencies } from './common';
import { resolveComplianceControllerDependencies } from './common';
import { PrismaComplianceTemplateRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-template-repository';

export interface ListComplianceTemplatesControllerResult {
    success: true;
    templates: ComplianceTemplate[];
}

export async function listComplianceTemplatesController(
    request: Request,
    dependencies?: ComplianceControllerDependencies,
): Promise<ListComplianceTemplatesControllerResult> {
    const { session } = resolveComplianceControllerDependencies(dependencies);

    const { authorization } = await getSessionContext(session, {
        headers: request.headers,
        requiredPermissions: { organization: ['read'] },
        auditSource: 'api:hr:compliance:templates:list',
        action: 'list',
        resourceType: 'hr.compliance',
        resourceAttributes: { view: 'templates' },
    });

    const useCaseDeps: ListComplianceTemplatesDependencies = {
        complianceTemplateRepository: new PrismaComplianceTemplateRepository(),
    };

    const templates = await listComplianceTemplates(useCaseDeps, { authorization });

    return { success: true, templates };
}
