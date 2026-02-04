import { Badge } from '@/components/ui/badge';
import { CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DocumentTemplateRecord } from '@/server/types/records/document-templates';

import { DocumentTemplateCreateForm } from './document-template-create-form';
import { DocumentTemplateDeleteForm } from './document-template-delete-form';
import { DocumentTemplateEditForm } from './document-template-edit-form';

function formatBodyPreview(body: string | null | undefined): string {
    if (!body) {
        return '—';
    }
    return body.length > 120 ? `${body.slice(0, 120)}…` : body;
}

export interface DocumentTemplatesManagerProps {
    templates: DocumentTemplateRecord[];
}

export function DocumentTemplatesManager({ templates }: DocumentTemplatesManagerProps) {
    return (
        <CardContent className="space-y-6">
            <DocumentTemplateCreateForm />

            {templates.length === 0 ? (
                <div className="text-sm text-muted-foreground">No document templates yet.</div>
            ) : (
                <div className="space-y-3">
                    <div className="overflow-auto">
                        <Table className="min-w-[640px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Body</TableHead>
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
                                            <Badge variant="secondary">{template.type}</Badge>
                                        </TableCell>
                                        <TableCell className="min-w-60 text-xs text-muted-foreground">
                                            {formatBodyPreview(template.templateBody)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {template.isActive ? 'Yes' : 'No'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <details>
                                                    <summary className="cursor-pointer text-xs text-muted-foreground">Edit</summary>
                                                    <div className="mt-2 w-[320px] max-w-[80vw] space-y-3 rounded-lg border p-3 text-left">
                                                        <DocumentTemplateEditForm template={template} />
                                                    </div>
                                                </details>
                                                <DocumentTemplateDeleteForm templateId={template.id} />
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
