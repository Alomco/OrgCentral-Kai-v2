import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { EmploymentContract } from '@/server/types/hr-types';

import { formatDate, formatJsonValue, formatOptionalText } from '../../_components/employee-formatters';

export interface EmployeeContractSummaryCardProps {
    contract: EmploymentContract | null;
}

export function EmployeeContractSummaryCard({ contract }: EmployeeContractSummaryCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Employment contract</CardTitle>
                <CardDescription>
                    {contract
                        ? 'Key contract terms and dates.'
                        : 'No contract is currently stored for this employee.'}
                </CardDescription>
            </CardHeader>
            {contract ? (
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <DetailItem label="Contract type" value={formatContractType(contract.contractType)} />
                    <DetailItem label="Job title" value={formatOptionalText(contract.jobTitle)} />
                    <DetailItem label="Department" value={formatOptionalText(contract.departmentId)} />
                    <DetailItem label="Location" value={formatOptionalText(contract.location)} />
                    <DetailItem label="Start date" value={formatDate(contract.startDate)} />
                    <DetailItem label="End date" value={formatDate(contract.endDate)} />
                    <DetailItem label="Probation ends" value={formatDate(contract.probationEndDate)} />
                    <DetailItem label="Furlough start" value={formatDate(contract.furloughStartDate)} />
                    <DetailItem label="Furlough end" value={formatDate(contract.furloughEndDate)} />
                    <DetailItem label="Termination reason" value={formatOptionalText(contract.terminationReason)} />
                    <DetailBlock label="Termination notes" value={formatOptionalText(contract.terminationNotes)} />
                    <DetailJson label="Working pattern" value={formatJsonValue(contract.workingPattern)} />
                    <DetailJson label="Benefits" value={formatJsonValue(contract.benefits)} />
                </CardContent>
            ) : (
                <CardContent className="text-sm text-muted-foreground">
                    Add a contract to capture role terms, dates, and location details.
                </CardContent>
            )}
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

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="mt-1 text-sm">{value}</div>
        </div>
    );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
    return (
        <div className="sm:col-span-2">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="mt-1 text-sm">{value}</div>
        </div>
    );
}

function DetailJson({ label, value }: { label: string; value: string }) {
    const isFallback = value === 'Not set';
    return (
        <div className="sm:col-span-2">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            {isFallback ? (
                <div className="mt-1 text-sm">{value}</div>
            ) : (
                <pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs">
                    {value}
                </pre>
            )}
        </div>
    );
}
