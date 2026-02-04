import { Badge } from '@/components/ui/badge';
import { CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { OnboardingMetricDefinitionRecord } from '@/server/types/hr/onboarding-metrics';

import { MetricDefinitionCreateForm } from './metric-definition-create-form';
import { MetricDefinitionDeleteForm } from './metric-definition-delete-form';
import { MetricDefinitionEditForm } from './metric-definition-edit-form';

export interface OnboardingMetricsManagerProps {
    definitions: OnboardingMetricDefinitionRecord[];
}

function formatTarget(value: OnboardingMetricDefinitionRecord['targetValue']): string {
    if (value === null || value === undefined) {
        return '—';
    }
    return String(value);
}

export function OnboardingMetricsManager({ definitions }: OnboardingMetricsManagerProps) {
    return (
        <CardContent className="space-y-6">
            <MetricDefinitionCreateForm />

            {definitions.length === 0 ? (
                <div className="text-sm text-muted-foreground">No metric definitions yet.</div>
            ) : (
                <div className="space-y-3">
                    <div className="overflow-auto">
                        <Table className="min-w-[640px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Key</TableHead>
                                    <TableHead>Label</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead className="text-right">Target</TableHead>
                                    <TableHead className="text-right">Active</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {definitions.map((definition) => (
                                    <TableRow key={definition.id}>
                                        <TableCell className="font-medium">{definition.key}</TableCell>
                                        <TableCell>{definition.label}</TableCell>
                                        <TableCell>
                                            {definition.unit ? (
                                                <Badge variant="secondary">{definition.unit}</Badge>
                                            ) : (
                                                '—'
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatTarget(definition.targetValue)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {definition.isActive ? 'Yes' : 'No'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <details>
                                                    <summary className="cursor-pointer text-xs text-muted-foreground">Edit</summary>
                                                    <div className="mt-2 w-[320px] max-w-[80vw] space-y-3 rounded-lg border p-3 text-left">
                                                        <MetricDefinitionEditForm definition={definition} />
                                                    </div>
                                                </details>
                                                <MetricDefinitionDeleteForm definitionId={definition.id} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Metrics are cached per-org when data classification is OFFICIAL.
                    </div>
                </div>
            )}
        </CardContent>
    );
}
