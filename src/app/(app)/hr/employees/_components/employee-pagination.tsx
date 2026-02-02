'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EmployeePaginationProps {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export function EmployeePagination({
    page,
    totalPages,
    total,
    pageSize,
    onPageChange,
}: EmployeePaginationProps) {
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    return (
        <div className="flex flex-col gap-2 px-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{start}</span> to{' '}
                <span className="font-medium">{end}</span> of{' '}
                <span className="font-medium">{total}</span> employees
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                </Button>
                <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                        let pageNumber: number;
                        if (totalPages <= 5) {
                            pageNumber = index + 1;
                        } else if (page <= 3) {
                            pageNumber = index + 1;
                        } else if (page >= totalPages - 2) {
                            pageNumber = totalPages - 4 + index;
                        } else {
                            pageNumber = page - 2 + index;
                        }
                        return (
                            <Button
                                key={pageNumber}
                                variant={pageNumber === page ? 'default' : 'outline'}
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => onPageChange(pageNumber)}
                            >
                                {pageNumber}
                            </Button>
                        );
                    })}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}
