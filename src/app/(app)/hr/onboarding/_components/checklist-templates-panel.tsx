import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ChecklistTemplate } from '@/server/types/onboarding-types';
import { getChecklistTemplatesForUi } from '@/server/use-cases/hr/onboarding/templates/get-checklist-templates.cached';

export interface ChecklistTemplatesPanelProps {
    authorization: RepositoryAuthorizationContext;
}

function typeBadgeVariant(type: ChecklistTemplate['type']): 'default' | 'secondary' | 'outline' {
    switch (type) {
        case 'onboarding':
            return 'secondary';
        case 'offboarding':
            return 'outline';
        case 'custom':
            return 'default';
    }
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
            <CardContent>
                {!result.canManageTemplates ? (
                    <div className="text-sm text-muted-foreground">
                        You do not have access to manage checklist templates in this organization.
                    </div>
                ) : result.templates.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No templates yet.</div>
                ) : (
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Items</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.templates.map((template) => (
                                    <TableRow key={template.id}>
                                        <TableCell className="font-medium">{template.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={typeBadgeVariant(template.type)}>{template.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{template.items.length}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
