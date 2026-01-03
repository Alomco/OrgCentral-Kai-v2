import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { EmploymentContract } from '@/server/types/hr-types';

import { formatDate, formatOptionalText } from '../../_components/employee-formatters';

export interface EmployeeContractHistoryCardProps {
    contracts: EmploymentContract[];
}

export function EmployeeContractHistoryCard({ contracts }: EmployeeContractHistoryCardProps) {
    if (contracts.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Contract history</CardTitle>
                    <CardDescription>No contract history is available yet.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    Future contracts will appear here when they are added.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Contract history</CardTitle>
                <CardDescription>Track past and current agreements for this employee.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {contracts.map((contract) => (
                    <div
                        key={contract.id}
                        className="rounded-lg border border-border/60 p-3"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold">
                                {formatOptionalText(contract.jobTitle)}
                            </div>
                            <Badge variant={resolveStatusVariant(contract)}>
                                {resolveStatusLabel(contract)}
                            </Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                            {formatContractType(contract.contractType)} - {formatContractRange(contract)}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                            Dept: {formatOptionalText(contract.departmentId)} - Location: {formatOptionalText(contract.location)}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function formatContractType(value: string | null | undefined): string {
    if (!value) {
        return 'Not set';
    }
    return value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatContractRange(contract: EmploymentContract): string {
    const start = formatDate(contract.startDate);
    const end = formatDate(contract.endDate);
    return `${start} - ${end}`;
}

function resolveStatusLabel(contract: EmploymentContract): string {
    if (contract.archivedAt) {
        return 'Archived';
    }
    if (!contract.endDate) {
        return 'Active';
    }
    return 'Ended';
}

function resolveStatusVariant(contract: EmploymentContract): 'default' | 'secondary' | 'outline' {
    if (contract.archivedAt) {
        return 'outline';
    }
    return contract.endDate ? 'secondary' : 'default';
}
