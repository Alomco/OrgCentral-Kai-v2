import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PlatformTenantListItem } from '@/server/types/platform/tenant-admin';

import { TenantStatusAction } from './tenant-status-action';

export function TenantTable({ tenants }: { tenants: PlatformTenantListItem[] }) {
    return (
        <div className="rounded-2xl border border-border/50 bg-card/40">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Residency</TableHead>
                        <TableHead>Classification</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tenants.map((tenant) => (
                        <TableRow key={tenant.id}>
                            <TableCell>
                                <div className="space-y-1">
                                    <Link href={`/admin/global/tenant-management/${tenant.id}`} className="font-medium text-foreground">
                                        {tenant.name}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">{tenant.ownerEmail ?? 'No owner email'}</p>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'secondary'}>{tenant.status}</Badge>
                            </TableCell>
                            <TableCell>{tenant.dataResidency}</TableCell>
                            <TableCell>{tenant.dataClassification}</TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-2">
                                    {tenant.status === 'ACTIVE' ? (
                                        <TenantStatusAction tenantId={tenant.id} action="SUSPEND" breakGlassRequired />
                                    ) : (
                                        <TenantStatusAction tenantId={tenant.id} action="RESTORE" />
                                    )}
                                    <TenantStatusAction tenantId={tenant.id} action="ARCHIVE" breakGlassRequired />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
