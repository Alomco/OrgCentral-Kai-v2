import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getEmailSequenceTemplatesForUi } from '@/server/use-cases/hr/onboarding/email-sequences/get-email-sequence-templates.cached';

import { EmailSequencesManager } from './email-sequences-manager';

export interface EmailSequencesPanelProps {
    authorization: RepositoryAuthorizationContext;
}

export async function EmailSequencesPanel({ authorization }: EmailSequencesPanelProps) {
    const result = await getEmailSequenceTemplatesForUi({ authorization });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Email sequences</CardTitle>
                <CardDescription>
                    Configure onboarding and offboarding sequences triggered by key events.
                </CardDescription>
            </CardHeader>
            {!result.canManageTemplates ? (
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        You do not have access to manage email sequences in this organization.
                    </div>
                </CardContent>
            ) : (
                <EmailSequencesManager templates={result.templates} />
            )}
        </Card>
    );
}
