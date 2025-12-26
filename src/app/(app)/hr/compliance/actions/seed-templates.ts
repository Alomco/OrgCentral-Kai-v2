'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { PrismaComplianceTemplateRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-template-repository';
import { seedDefaultComplianceTemplates } from '@/server/use-cases/hr/compliance/seed-default-templates';

export async function seedComplianceTemplatesAction(): Promise<void> {
    const headerStore = await headers();
    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:hr:compliance:templates:seed',
            action: 'create',
            resourceType: 'hr.compliance',
            resourceAttributes: { seedKey: 'uk-employment' },
        },
    );

    await seedDefaultComplianceTemplates(
        { complianceTemplateRepository: new PrismaComplianceTemplateRepository() },
        { authorization },
    );

    redirect('/hr/compliance');
}
