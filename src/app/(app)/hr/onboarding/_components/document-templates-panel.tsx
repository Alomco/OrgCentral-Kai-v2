import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getDocumentTemplatesForUi } from '@/server/use-cases/records/documents/list-document-templates.cached';

import { DocumentTemplatesManager } from './document-templates-manager';

export interface DocumentTemplatesPanelProps {
    authorization: RepositoryAuthorizationContext;
}

export async function DocumentTemplatesPanel({ authorization }: DocumentTemplatesPanelProps) {
    const result = await getDocumentTemplatesForUi({ authorization });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Document templates</CardTitle>
                <CardDescription>
                    Provide documents to include in onboarding packets and compliance workflows.
                </CardDescription>
            </CardHeader>
            {!result.canManageTemplates ? (
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        You do not have access to manage document templates in this organization.
                    </div>
                </CardContent>
            ) : (
                <DocumentTemplatesManager templates={result.templates} />
            )}
        </Card>
    );
}
