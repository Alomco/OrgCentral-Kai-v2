'use client';

import { useState, useCallback, useTransition } from 'react';
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
    const [result, setResult] = useState(initialResult);
    const [params, setParams] = useState<Partial<EmployeeSearchParams>>({
        page: 1,
        pageSize: 20,
    });
    const [isPending, startTransition] = useTransition();

    const handleParamsChange = useCallback((newParams: Partial<EmployeeSearchParams>) => {
        setParams(newParams);
        startTransition(async () => {
            const newResult = await getEmployeeList(newParams);
            setResult(newResult);
        });
    }, []);

    const handlePageChange = useCallback(
        (page: number) => {
            handleParamsChange({ ...params, page });
        },
        [params, handleParamsChange],
    );

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

                {isPending ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                    <EmployeeDirectoryTable result={result} />
                )}

                {result.totalPages > 1 ? (
                    <EmployeePagination
                        page={result.page}
                        totalPages={result.totalPages}
                        total={result.total}
                        pageSize={result.pageSize}
                        onPageChange={handlePageChange}
                    />
                ) : null}
            </CardContent>
        </Card>
    );
}
