import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { ChevronLeft, Database } from 'lucide-react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

import { ColdStartSeeder } from './_components/cold-start-seeder';

export default async function ColdStartSeederPage() {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'ui:admin:cold-start',
        },
    );

    return (
        <div className="space-y-6 p-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/admin">Admin</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Cold start seeder</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary to-accent text-white shadow-lg shadow-primary/25">
                        <Database className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Cold start seeder</h1>
                        <p className="text-sm text-muted-foreground">
                            Configure platform essentials and demo data for org {authorization.orgId}.
                        </p>
                    </div>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Admin
                    </Link>
                </Button>
            </div>

            <ColdStartSeeder orgId={authorization.orgId} />
        </div>
    );
}
