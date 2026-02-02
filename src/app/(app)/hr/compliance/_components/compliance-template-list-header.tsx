'use client';

import type { ChangeEvent } from 'react';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { formatCategoryLabel } from '../compliance-template-display';

interface ComplianceTemplateListSummary {
    count: number;
    categories: string[];
    categoryCount: number;
    overflowCount: number;
}

interface ComplianceTemplateListHeaderProps {
    qValue: string;
    summary: ComplianceTemplateListSummary;
    onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onSearchClear: () => void;
}

export function ComplianceTemplateListHeader({
    qValue,
    summary,
    onSearchChange,
    onSearchClear,
}: ComplianceTemplateListHeaderProps) {
    return (
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <CardTitle className="text-lg">Templates</CardTitle>
                <CardDescription>Find a template or see what’s already available.</CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 text-xs sm:w-auto sm:items-end">
                <div className="relative w-full sm:w-56">
                    <Input
                        aria-label="Search templates"
                        value={qValue}
                        onChange={onSearchChange}
                        placeholder="Search by name or category..."
                        className="h-9 pr-9"
                    />
                    {qValue ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onSearchClear}
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Clear search</span>
                        </Button>
                    ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{summary.count} total</Badge>
                    {summary.categoryCount > 0 ? (
                        <Badge variant="secondary">{summary.categoryCount} categories</Badge>
                    ) : null}
                    {summary.categories.map((category) => (
                        <Badge key={category} variant="outline" className="text-[11px]" title={category}>
                            {formatCategoryLabel(category)}
                        </Badge>
                    ))}
                    {summary.overflowCount > 0 ? (
                        <Badge variant="outline" className="text-[11px]">
                            +{summary.overflowCount} categories
                        </Badge>
                    ) : null}
                </div>
            </div>
        </CardHeader>
    );
}
