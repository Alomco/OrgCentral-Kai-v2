import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getWorkflowTemplatesForUi } from '@/server/use-cases/hr/onboarding/workflows/get-workflow-templates.cached';

import { WorkflowTemplatesManager } from './workflow-templates-manager';

export interface WorkflowTemplatesPanelProps {
    authorization: RepositoryAuthorizationContext;
}

export async function WorkflowTemplatesPanel({ authorization }: WorkflowTemplatesPanelProps) {
    const result = await getWorkflowTemplatesForUi({ authorization });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Workflow templates</CardTitle>
                <CardDescription>
                    Orchestrate onboarding and offboarding flows with reusable templates.
                </CardDescription>
            </CardHeader>
            {!result.canManageTemplates ? (
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        You do not have access to manage workflow templates in this organization.
                    </div>
                </CardContent>
            ) : (
                <WorkflowTemplatesManager templates={result.templates} />
            )}
        </Card>
    );
}
