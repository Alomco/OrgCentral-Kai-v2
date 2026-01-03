 'use client';

import Link from 'next/link';
import { Filter } from 'lucide-react';
import { useCallback, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    EMPLOYMENT_STATUS_VALUES,
    EMPLOYMENT_TYPE_VALUES,
} from '@/server/types/hr/people';

import {
    EMPLOYEE_DIRECTORY_DEFAULTS,
    type EmployeeDirectoryQuery,
} from './employee-directory-helpers';
import { formatEmploymentStatus, formatEmploymentType } from './employee-formatters';

export interface EmployeesDirectoryFiltersProps {
    query: EmployeeDirectoryQuery;
}

const SORT_OPTIONS: { value: EmployeeDirectoryQuery['sort']; label: string }[] = [
    { value: 'name', label: 'Name' },
    { value: 'startDate', label: 'Start date' },
    { value: 'status', label: 'Status' },
    { value: 'jobTitle', label: 'Job title' },
];

const PAGE_SIZES = [10, 25, 50, 100] as const;

export function EmployeesDirectoryFilters({ query }: EmployeesDirectoryFiltersProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const formReference = useRef<HTMLFormElement | null>(null);
    const debounceTimerReference = useRef<number | null>(null);

    const sortLabel = SORT_OPTIONS.find((option) => option.value === query.sort)?.label ?? query.sort;

    const navigateWithForm = useCallback((form: HTMLFormElement) => {
        const formData = new FormData(form);
        formData.set('page', '1');

        const searchParams = new URLSearchParams();
        for (const [key, value] of formData.entries()) {
            if (typeof value !== 'string') {
                continue;
            }
            const trimmed = value.trim();
            if (trimmed.length === 0) {
                continue;
            }
            searchParams.set(key, trimmed);
        }

        const href = searchParams.size > 0
            ? `/hr/employees?${searchParams.toString()}`
            : '/hr/employees';

        startTransition(() => {
            router.push(href);
        });
    }, [router]);

    const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        navigateWithForm(event.currentTarget);
    }, [navigateWithForm]);

    const handleReset = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        startTransition(() => {
            router.push('/hr/employees');
        });
    }, [router]);

    const scheduleDebouncedApply = useCallback(() => {
        if (!formReference.current) {
            return;
        }

        if (debounceTimerReference.current !== null) {
            window.clearTimeout(debounceTimerReference.current);
        }

        debounceTimerReference.current = window.setTimeout(() => {
            if (!formReference.current) {
                return;
            }
            navigateWithForm(formReference.current);
        }, 350);
    }, [navigateWithForm]);

    useEffect(() => {
        return () => {
            if (debounceTimerReference.current !== null) {
                window.clearTimeout(debounceTimerReference.current);
            }
        };
    }, []);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Directory Filters</CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    ref={formReference}
                    action="/hr/employees"
                    method="get"
                    className="space-y-4"
                    onSubmit={handleSubmit}
                    data-pending={isPending ? 'true' : 'false'}
                >
                    <input type="hidden" name="page" value="1" />
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                        <div className="xl:col-span-2">
                            <label className="text-xs font-medium text-muted-foreground" htmlFor="employee-search">
                                Search
                            </label>
                            <Input
                                id="employee-search"
                                name="q"
                                placeholder="Search by name, email, or employee number"
                                defaultValue={query.search}
                                onChange={scheduleDebouncedApply}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground" htmlFor="employee-status">
                                Status
                            </label>
                            <select
                                id="employee-status"
                                name="status"
                                defaultValue={query.status ?? ''}
                                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                onChange={scheduleDebouncedApply}
                            >
                                <option value="">All statuses</option>
                                {EMPLOYMENT_STATUS_VALUES.map((status) => (
                                    <option key={status} value={status}>
                                        {formatEmploymentStatus(status)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground" htmlFor="employee-type">
                                Employment type
                            </label>
                            <select
                                id="employee-type"
                                name="type"
                                defaultValue={query.employmentType ?? ''}
                                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                onChange={scheduleDebouncedApply}
                            >
                                <option value="">All types</option>
                                {EMPLOYMENT_TYPE_VALUES.map((employmentType) => (
                                    <option key={employmentType} value={employmentType}>
                                        {formatEmploymentType(employmentType)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground" htmlFor="employee-department">
                                Department
                            </label>
                            <Input
                                id="employee-department"
                                name="department"
                                placeholder="Dept ID or name"
                                defaultValue={query.departmentId ?? ''}
                                onChange={scheduleDebouncedApply}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground" htmlFor="employee-manager">
                                Manager user ID
                            </label>
                            <Input
                                id="employee-manager"
                                name="manager"
                                placeholder="Manager user ID"
                                defaultValue={query.managerUserId ?? ''}
                                onChange={scheduleDebouncedApply}
                            />
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground" htmlFor="employee-start">
                                Start date from
                            </label>
                            <Input
                                id="employee-start"
                                name="start"
                                type="date"
                                defaultValue={query.startDate ?? ''}
                                onChange={scheduleDebouncedApply}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground" htmlFor="employee-end">
                                Start date to
                            </label>
                            <Input
                                id="employee-end"
                                name="end"
                                type="date"
                                defaultValue={query.endDate ?? ''}
                                onChange={scheduleDebouncedApply}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground" htmlFor="employee-sort">
                                Sort by
                            </label>
                            <select
                                id="employee-sort"
                                name="sort"
                                defaultValue={query.sort}
                                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                onChange={scheduleDebouncedApply}
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground" htmlFor="employee-direction">
                                Direction
                            </label>
                            <select
                                id="employee-direction"
                                name="dir"
                                defaultValue={query.direction}
                                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                onChange={scheduleDebouncedApply}
                            >
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground" htmlFor="employee-page-size">
                                Page size
                            </label>
                            <select
                                id="employee-page-size"
                                name="pageSize"
                                defaultValue={String(query.pageSize)}
                                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                onChange={scheduleDebouncedApply}
                            >
                                {PAGE_SIZES.map((size) => (
                                    <option key={size} value={size}>
                                        {size} per page
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Applying…' : 'Apply filters'}
                        </Button>
                        <Button variant="ghost" type="button" asChild disabled={isPending}>
                            <Link href="/hr/employees" onClick={handleReset}>Reset</Link>
                        </Button>
                        {query.sort !== EMPLOYEE_DIRECTORY_DEFAULTS.sort ||
                        query.direction !== EMPLOYEE_DIRECTORY_DEFAULTS.direction ? (
                            <div className="text-xs text-muted-foreground">
                                Sorting {sortLabel.toLowerCase()} ({query.direction})
                            </div>
                        ) : null}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
