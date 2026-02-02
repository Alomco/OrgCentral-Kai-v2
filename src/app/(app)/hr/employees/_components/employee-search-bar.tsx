'use client';

import { useState, useTransition, useCallback } from 'react';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { EmployeeFilterOptions, EmployeeListItem } from '../types';
import type { EmployeeSearchParams } from '../schema';

interface EmployeeSearchBarProps {
    filterOptions: EmployeeFilterOptions;
    currentParams: Partial<EmployeeSearchParams>;
    onParamsChange: (params: Partial<EmployeeSearchParams>) => void;
}

export function EmployeeSearchBar({
    filterOptions,
    currentParams,
    onParamsChange,
}: EmployeeSearchBarProps) {
    const [query, setQuery] = useState(currentParams.query ?? '');
    const [isPending, startTransition] = useTransition();

    const handleSearch = useCallback(
        (value: string) => {
            setQuery(value);
            startTransition(() => {
                onParamsChange({ ...currentParams, query: value === '' ? undefined : value, page: 1 });
            });
        },
        [currentParams, onParamsChange],
    );

    const handleDepartmentFilter = useCallback(
        (department: string | undefined) => {
            startTransition(() => {
                onParamsChange({ ...currentParams, department, page: 1 });
            });
        },
        [currentParams, onParamsChange],
    );

    const handleStatusFilter = useCallback(
        (status: EmployeeListItem['employmentStatus'] | undefined) => {
            startTransition(() => {
                onParamsChange({ ...currentParams, status, page: 1 });
            });
        },
        [currentParams, onParamsChange],
    );

    const handleSort = useCallback(
        (sortBy: EmployeeSearchParams['sortBy']) => {
            const newOrder =
                currentParams.sortBy === sortBy && currentParams.sortOrder === 'asc'
                    ? 'desc'
                    : 'asc';
            startTransition(() => {
                onParamsChange({ ...currentParams, sortBy, sortOrder: newOrder });
            });
        },
        [currentParams, onParamsChange],
    );

    const clearFilters = useCallback(() => {
        setQuery('');
        startTransition(() => {
            onParamsChange({ page: 1, pageSize: currentParams.pageSize });
        });
    }, [currentParams.pageSize, onParamsChange]);

    const hasFilters =
        currentParams.query ??
        currentParams.department ??
        currentParams.status;

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search by name, email, job title..."
                    className="pl-9"
                    value={query}
                    onChange={(event) => handleSearch(event.target.value)}
                    disabled={isPending}
                />
            </div>
            <div className="flex flex-wrap gap-2">
                {/* Department Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isPending} className="w-full sm:w-auto">
                            <Filter className="h-4 w-4 mr-2" />
                            Department
                            {currentParams.department ? (
                                <Badge variant="secondary" className="ml-2">
                                    1
                                </Badge>
                            ) : null}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Filter by Department</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDepartmentFilter(undefined)}>
                            All Departments
                        </DropdownMenuItem>
                        {filterOptions.departments.map((dept) => (
                            <DropdownMenuItem
                                key={dept}
                                onClick={() => handleDepartmentFilter(dept)}
                            >
                                {dept}
                                {currentParams.department === dept ? ' ✓' : ''}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Status Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isPending} className="w-full sm:w-auto">
                            <Filter className="h-4 w-4 mr-2" />
                            Status
                            {currentParams.status ? (
                                <Badge variant="secondary" className="ml-2">
                                    1
                                </Badge>
                            ) : null}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusFilter(undefined)}>
                            All Statuses
                        </DropdownMenuItem>
                        {filterOptions.statuses.map((status) => (
                            <DropdownMenuItem
                                key={status.value}
                                onClick={() => handleStatusFilter(status.value)}
                            >
                                {status.label}
                                {currentParams.status === status.value ? ' ✓' : ''}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isPending} className="w-full sm:w-auto">
                            <ArrowUpDown className="h-4 w-4 mr-2" />
                            Sort
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleSort('lastName')}>
                            Last Name
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('firstName')}>
                            First Name
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('department')}>
                            Department
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('jobTitle')}>
                            Job Title
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('startDate')}>
                            Start Date
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Clear Filters */}
                {hasFilters ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        disabled={isPending}
                        className="w-full sm:w-auto"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
