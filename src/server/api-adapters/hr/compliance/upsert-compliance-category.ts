import type { Prisma } from '../../../../generated/client';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { upsertComplianceCategory, type UpsertComplianceCategoryDependencies } from '@/server/use-cases/hr/compliance/upsert-compliance-category';
import { upsertComplianceCategorySchema } from '@/server/types/hr-compliance-schemas';
import { HR_ACTION, HR_PERMISSION_PROFILE, HR_RESOURCE_TYPE } from '@/server/security/authorization';
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
        requiredPermissions: HR_PERMISSION_PROFILE.COMPLIANCE_TEMPLATE_MANAGE,
        auditSource: 'api:hr:compliance:categories:upsert',
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE_TYPE.COMPLIANCE_TEMPLATE,
        resourceAttributes: { key: payload.key },
    });

    const useCaseDeps: UpsertComplianceCategoryDependencies = { complianceCategoryRepository };

    const metadata: Prisma.JsonValue | undefined = payload.regulatoryRefs?.length
        ? { regulatoryRefs: payload.regulatoryRefs }
        : undefined;

    const category = await upsertComplianceCategory(useCaseDeps, {
        orgId: authorization.orgId,
        key: payload.key,
        label: payload.label,
        sortOrder: payload.sortOrder,
        metadata,
    });

    return { success: true, category };
}
