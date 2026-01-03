import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChecklistInstance } from '@/server/types/onboarding-types';

import { formatDate, formatOptionalText } from '../../_components/employee-formatters';

export interface EmployeeChecklistHistoryCardProps {
    instances: ChecklistInstance[];
}

export function EmployeeChecklistHistoryCard({ instances }: EmployeeChecklistHistoryCardProps) {
    if (instances.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Checklist history</CardTitle>
                    <CardDescription>No completed or cancelled checklists yet.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    Completed onboarding or offboarding checklists will appear here.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Checklist history</CardTitle>
                <CardDescription>Completed and cancelled checklists for this employee.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {instances.map((instance) => (
                    <div
                        key={instance.id}
                        className="rounded-lg border border-border/60 p-3"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold">
                                {formatOptionalText(instance.templateName ?? null)}
                            </div>
                            <Badge variant={resolveStatusVariant(instance.status)}>
                                {formatStatus(instance.status)}
                            </Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                            Started {formatDate(instance.startedAt)} - Completed {formatDate(instance.completedAt ?? null)}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                            {instance.items.length} task(s)
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function formatStatus(value: ChecklistInstance['status']): string {
    return value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveStatusVariant(status: ChecklistInstance['status']): 'default' | 'secondary' | 'outline' {
    switch (status) {
        case 'IN_PROGRESS':
            return 'secondary';
        case 'COMPLETED':
            return 'default';
        case 'CANCELLED':
            return 'outline';
    }
}
