import { Badge } from '@/components/ui/badge';
import { CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ChecklistTemplate } from '@/server/types/onboarding-types';

import { ChecklistTemplateCreateForm } from './checklist-template-create-form';
import { ChecklistTemplateDeleteForm } from './checklist-template-delete-form';
import { ChecklistTemplateEditForm } from './checklist-template-edit-form';

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

export interface ChecklistTemplatesManagerProps {
    templates: ChecklistTemplate[];
}

export function ChecklistTemplatesManager({ templates }: ChecklistTemplatesManagerProps) {
    return (
        <CardContent className="space-y-6">
            <ChecklistTemplateCreateForm />

            {templates.length === 0 ? (
                <div className="text-sm text-muted-foreground">No templates yet.</div>
            ) : (
                <div className="space-y-3">
                    <div className="overflow-auto">
                        <Table className="min-w-[560px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Items</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {templates.map((template) => (
                                    <TableRow key={template.id}>
                                        <TableCell className="font-medium min-w-0 max-w-[280px] truncate">
                                            {template.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={typeBadgeVariant(template.type)}>{template.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{template.items.length}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <details>
                                                    <summary className="cursor-pointer text-xs text-muted-foreground">Edit</summary>
                                                    <div className="mt-2 w-[320px] max-w-[80vw] space-y-3 rounded-lg border p-3 text-left">
                                                        <ChecklistTemplateEditForm template={template} />
                                                    </div>
                                                </details>

                                                <ChecklistTemplateDeleteForm templateId={template.id} />
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
