'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Download } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import type { EmployeeListResult, EmployeeFilterOptions } from '../types';
import type { EmployeeSearchParams } from '../schema';
import { getEmployeeList } from '../actions/list-employees';
import { EmployeeSearchBar } from './employee-search-bar';
import { EmployeeDirectoryTable } from './employee-directory-table';
import { EmployeePagination } from './employee-pagination';

interface EmployeeDirectoryClientProps {
    initialResult: EmployeeListResult;
    filterOptions: EmployeeFilterOptions;
}

export function EmployeeDirectoryClient({
    initialResult,
    filterOptions,
}: EmployeeDirectoryClientProps) {
    const [params, setParams] = useState<Partial<EmployeeSearchParams>>(() => ({
        page: initialResult.page,
        pageSize: initialResult.pageSize,
    }));
    const isInitialParams = params.page === initialResult.page
        && params.pageSize === initialResult.pageSize
        && !params.query
        && !params.department
        && !params.status
        && !params.sortBy
        && !params.sortOrder;

    const { data } = useQuery({
        queryKey: ['hr', 'employees', params],
        queryFn: async () => getEmployeeList(params),
        initialData: isInitialParams ? initialResult : undefined,
        placeholderData: (previous) => previous,
    });

    const result = data ?? (isInitialParams ? initialResult : undefined);

    const handleParamsChange = useCallback((newParams: Partial<EmployeeSearchParams>) => {
        setParams(newParams);
    }, []);

    const handlePageChange = useCallback(
        (page: number) => {
            setParams((current) => {
                const nextParams = { ...current, page };
                return nextParams;
            });
        },
        [],
    );

    const pagination = result && result.totalPages > 1 ? (
        <EmployeePagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            pageSize={result.pageSize}
            onPageChange={handlePageChange}
        />
    ) : null;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            Employee Directory
                        </CardTitle>
                        <CardDescription>
                            Search and manage employee records
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button size="sm" disabled>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Employee
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <EmployeeSearchBar
                    filterOptions={filterOptions}
                    currentParams={params}
                    onParamsChange={handleParamsChange}
                />

                {!result ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                    <EmployeeDirectoryTable result={result} />
                )}

                {pagination}
            </CardContent>
        </Card>
    );
}
