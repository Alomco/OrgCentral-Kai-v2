import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { PrismaComplianceTemplateRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-template-repository';
import { PrismaComplianceCategoryRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-category-repository';
import {
    seedDefaultComplianceTemplates,
    type SeedDefaultComplianceTemplatesDependencies,
} from '@/server/use-cases/hr/compliance/seed-default-templates';
import { seedComplianceTemplatesQuerySchema } from '@/server/types/hr-compliance-schemas';

export interface SeedComplianceTemplatesControllerResult {
    success: true;
    created: boolean;
    templateId: string;
}

export async function seedComplianceTemplatesController(request: Request): Promise<SeedComplianceTemplatesControllerResult> {
    const url = new URL(request.url);
    const query = seedComplianceTemplatesQuerySchema.parse({
        force: url.searchParams.get('force') ?? undefined,
    });

    const { authorization } = await getSessionContext(
        {},
        {
            headers: request.headers,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'api:hr:compliance:templates:seed',
            action: 'create',
            resourceType: 'hr.compliance',
            resourceAttributes: { seedKey: 'uk-employment', force: query.force ?? false },
        },
    );

    const useCaseDeps: SeedDefaultComplianceTemplatesDependencies = {
        complianceTemplateRepository: new PrismaComplianceTemplateRepository(),
        complianceCategoryRepository: new PrismaComplianceCategoryRepository(),
    };

    const result = await seedDefaultComplianceTemplates(useCaseDeps, {
        authorization,
        force: query.force ?? false,
    });

    return { success: true, created: result.created, templateId: result.template.id };
}
