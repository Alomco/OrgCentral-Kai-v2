import { Badge } from '@/components/ui/badge';
import { CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { JsonValue } from '@/server/types/json';
import type { EmailSequenceTemplateRecord } from '@/server/types/hr/onboarding-email-sequences';

import { EmailSequenceCreateForm } from './email-sequence-create-form';
import { EmailSequenceDeleteForm } from './email-sequence-delete-form';
import { EmailSequenceEditForm } from './email-sequence-edit-form';

function formatJsonPreview(value: JsonValue): string {
    const raw = JSON.stringify(value);
    return raw.length > 120 ? `${raw.slice(0, 120)}…` : raw;
}

export interface EmailSequencesManagerProps {
    templates: EmailSequenceTemplateRecord[];
}

export function EmailSequencesManager({ templates }: EmailSequencesManagerProps) {
    return (
        <CardContent className="space-y-6">
            <EmailSequenceCreateForm />

            {templates.length === 0 ? (
                <div className="text-sm text-muted-foreground">No email sequences yet.</div>
            ) : (
                <div className="space-y-3">
                    <div className="overflow-auto">
                        <Table className="min-w-[640px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Trigger</TableHead>
                                    <TableHead>Steps</TableHead>
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
                                            <Badge variant="secondary">{template.trigger}</Badge>
                                        </TableCell>
                                        <TableCell className="min-w-60 text-xs text-muted-foreground">
                                            {formatJsonPreview(template.steps)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {template.isActive ? 'Yes' : 'No'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <details>
                                                    <summary className="cursor-pointer text-xs text-muted-foreground">Edit</summary>
                                                    <div className="mt-2 w-[320px] max-w-[80vw] space-y-3 rounded-lg border p-3 text-left">
                                                        <EmailSequenceEditForm template={template} />
                                                    </div>
                                                </details>
                                                <EmailSequenceDeleteForm templateId={template.id} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Sequences are cached per-org when data classification is OFFICIAL.
                    </div>
                </div>
            )}
        </CardContent>
    );
}
