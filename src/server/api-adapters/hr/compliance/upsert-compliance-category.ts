import type { Prisma } from '@prisma/client';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { upsertComplianceCategory, type UpsertComplianceCategoryDependencies } from '@/server/use-cases/hr/compliance/upsert-compliance-category';
import { upsertComplianceCategorySchema } from '@/server/types/hr-compliance-schemas';
import type { ComplianceControllerDependencies } from './common';
import { readJson, resolveComplianceControllerDependencies } from './common';

export interface UpsertComplianceCategoryControllerResult {
    success: true;
    category: Awaited<ReturnType<typeof upsertComplianceCategory>>;
}

export async function upsertComplianceCategoryController(
    request: Request,
    dependencies?: ComplianceControllerDependencies,
): Promise<UpsertComplianceCategoryControllerResult> {
    const { session, complianceCategoryRepository } = resolveComplianceControllerDependencies(dependencies);

    const payload = upsertComplianceCategorySchema.parse(await readJson(request));

    const { authorization } = await getSessionContext(session, {
        headers: request.headers,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'api:hr:compliance:categories:upsert',
        action: 'update',
        resourceType: 'hr.compliance',
        resourceAttributes: { key: payload.key },
    });

    const useCaseDeps: UpsertComplianceCategoryDependencies = { complianceCategoryRepository };

    const category = await upsertComplianceCategory(useCaseDeps, {
        orgId: authorization.orgId,
        key: payload.key,
        label: payload.label,
        sortOrder: payload.sortOrder,
        metadata: payload.metadata as Prisma.JsonValue | undefined,
    });

    return { success: true, category };
}
