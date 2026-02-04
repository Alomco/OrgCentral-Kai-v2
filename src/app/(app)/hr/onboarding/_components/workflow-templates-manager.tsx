import { Badge } from '@/components/ui/badge';
import { CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { JsonValue } from '@/server/types/json';
import type { OnboardingWorkflowTemplateRecord } from '@/server/types/hr/onboarding-workflow-templates';

import { WorkflowTemplateCreateForm } from './workflow-template-create-form';
import { WorkflowTemplateDeleteForm } from './workflow-template-delete-form';
import { WorkflowTemplateEditForm } from './workflow-template-edit-form';

function typeBadgeVariant(
    type: OnboardingWorkflowTemplateRecord['templateType'],
): 'default' | 'secondary' | 'outline' {
    switch (type) {
        case 'OFFBOARDING':
            return 'outline';
        case 'ONBOARDING':
        default:
            return 'secondary';
    }
}

function formatJsonPreview(value: JsonValue): string {
    const raw = JSON.stringify(value);
    return raw.length > 120 ? `${raw.slice(0, 120)}…` : raw;
}

export interface WorkflowTemplatesManagerProps {
    templates: OnboardingWorkflowTemplateRecord[];
}

export function WorkflowTemplatesManager({ templates }: WorkflowTemplatesManagerProps) {
    return (
        <CardContent className="space-y-6">
            <WorkflowTemplateCreateForm />

            {templates.length === 0 ? (
                <div className="text-sm text-muted-foreground">No workflow templates yet.</div>
            ) : (
                <div className="space-y-3">
                    <div className="overflow-auto">
                        <Table className="min-w-[640px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Version</TableHead>
                                    <TableHead>Definition</TableHead>
                                    <TableHead className="text-right">Active</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {templates.map((template) => (
                                    <TableRow key={template.id}>
                                        <TableCell className="font-medium min-w-0 max-w-[220px] truncate">
                                            {template.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={typeBadgeVariant(template.templateType)}>
                                                {template.templateType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{template.version}</TableCell>
                                        <TableCell className="min-w-60 text-xs text-muted-foreground">
                                            {formatJsonPreview(template.definition)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {template.isActive ? 'Yes' : 'No'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <details>
                                                    <summary className="cursor-pointer text-xs text-muted-foreground">Edit</summary>
                                                    <div className="mt-2 w-[320px] max-w-[80vw] space-y-3 rounded-lg border p-3 text-left">
                                                        <WorkflowTemplateEditForm template={template} />
                                                    </div>
                                                </details>
                                                <WorkflowTemplateDeleteForm templateId={template.id} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Templates are cached per-org when data classification is OFFICIAL.
                    </div>
                </div>
            )}
        </CardContent>
    );
}
