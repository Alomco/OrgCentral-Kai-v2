import type { ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface HrDataTableColumn<TKey extends string = string> {
    key: TKey;
    label: string;
    className?: string;
}

export interface HrDataTableProps<TKey extends string = string> {
    title: string;
    description?: string;
    columns: readonly HrDataTableColumn<TKey>[];
    emptyMessage?: string;
    isEmpty: boolean;
    children: ReactNode;
    actions?: ReactNode;
}

/** Reusable data table wrapper for HR modules. Server Component. */
export function HrDataTable<TKey extends string = string>({
    title,
    description,
    columns,
    emptyMessage = 'No data available.',
    isEmpty,
    children,
    actions,
}: HrDataTableProps<TKey>) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        {description ? <CardDescription>{description}</CardDescription> : null}
                    </div>
                    {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
                </div>
            </CardHeader>
            <CardContent>
                {isEmpty ? (
                    <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                ) : (
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {columns.map((col) => (
                                        <TableHead key={col.key} className={col.className}>
                                            {col.label}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>{children}</TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
