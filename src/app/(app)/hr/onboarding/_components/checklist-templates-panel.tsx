import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getChecklistTemplatesForUi } from '@/server/use-cases/hr/onboarding/templates/get-checklist-templates.cached';

import { ChecklistTemplatesManager } from './checklist-templates-manager';

export interface ChecklistTemplatesPanelProps {
    authorization: RepositoryAuthorizationContext;
}

export async function ChecklistTemplatesPanel({ authorization }: ChecklistTemplatesPanelProps) {
    const result = await getChecklistTemplatesForUi({ authorization });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Checklist templates</CardTitle>
                <CardDescription>
                    Templates are cached per-org when data classification is OFFICIAL.
                </CardDescription>
            </CardHeader>
            {!result.canManageTemplates ? (
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        You do not have access to manage checklist templates in this organization.
                    </div>
                </CardContent>
            ) : (
                <ChecklistTemplatesManager templates={result.templates} />
            )}
        </Card>
    );
}
