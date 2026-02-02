'use client';

import type { ChangeEvent } from 'react';

import { Badge } from '@/components/ui/badge';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ComplianceTemplateListSummary {
    count: number;
    categories: string[];
    hasOverflow: boolean;
}

interface ComplianceTemplateListHeaderProps {
    qValue: string;
    summary: ComplianceTemplateListSummary;
    onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function ComplianceTemplateListHeader({
    qValue,
    summary,
    onSearchChange,
}: ComplianceTemplateListHeaderProps) {
    return (
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <CardTitle className="text-lg">Templates</CardTitle>
                <CardDescription>Track coverage by category and version.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
                <input
                    aria-label="Search templates"
                    value={qValue}
                    onChange={onSearchChange}
                    placeholder="Search..."
                    className="h-8 rounded-md border bg-background px-2 text-sm"
                />
                <Badge variant="secondary">{summary.count} total</Badge>
                {summary.categories.map((category) => (
                    <Badge key={category} variant="outline" className="text-[11px]">
                        {category}
                    </Badge>
                ))}
                {summary.hasOverflow ? (
                    <Badge variant="outline" className="text-[11px]">
                        +{summary.count - summary.categories.length} more
                    </Badge>
                ) : null}
            </div>
        </CardHeader>
    );
}
