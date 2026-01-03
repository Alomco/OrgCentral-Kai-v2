import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { PrismaComplianceTemplateRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-template-repository';
import { listComplianceTemplates } from '@/server/use-cases/hr/compliance/list-compliance-templates';

import { ComplianceTemplatesManager } from './compliance-templates-manager';

export interface ComplianceTemplatesPanelProps {
    authorization: RepositoryAuthorizationContext;
}

export async function ComplianceTemplatesPanel({ authorization }: ComplianceTemplatesPanelProps) {
    const templates = await listComplianceTemplates(
        { complianceTemplateRepository: new PrismaComplianceTemplateRepository() },
        { authorization },
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Templates</CardTitle>
                <CardDescription>Default packs and organization templates.</CardDescription>
            </CardHeader>
            <CardContent>
                <ComplianceTemplatesManager templates={templates} />
            </CardContent>
        </Card>
    );
}
