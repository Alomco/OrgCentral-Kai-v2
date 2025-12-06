import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import {
    assignComplianceItems,
    type AssignComplianceItemsDependencies,
} from '@/server/use-cases/hr/compliance/assign-compliance-items';
import { assignComplianceItemsSchema } from '@/server/types/hr-compliance-schemas';
import type { ComplianceControllerDependencies } from './common';
import { resolveComplianceControllerDependencies, readJson } from './common';

export interface AssignComplianceItemsControllerResult {
    success: true;
    templateId: string;
    userCount: number;
}

export async function assignComplianceItemsController(
    request: Request,
    dependencies?: ComplianceControllerDependencies,
): Promise<AssignComplianceItemsControllerResult> {
    const payload = assignComplianceItemsSchema.parse(await readJson(request));
    const { session, assignmentService } = resolveComplianceControllerDependencies(dependencies);

    const { authorization } = await getSessionContext(session, {
        headers: request.headers,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'api:hr:compliance:assign',
        action: 'assign',
        resourceType: 'hr.compliance',
        resourceAttributes: {
            templateId: payload.templateId,
            userIds: payload.userIds,
        },
    });

    const useCaseDeps: AssignComplianceItemsDependencies = { assignmentService };
    await assignComplianceItems(useCaseDeps, { ...payload, authorization });

    return {
        success: true,
        templateId: payload.templateId,
        userCount: payload.userIds.length,
    };
}
