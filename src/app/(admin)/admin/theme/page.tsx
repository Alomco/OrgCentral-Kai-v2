import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { ChevronLeft, Palette } from 'lucide-react';

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
import { getTenantTheme } from '@/server/theme/get-tenant-theme';

import { OrgThemeManager } from './_components/org-theme-manager';

export default async function AdminThemePage() {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['manage'] },
            auditSource: 'ui:admin:theme',
        },
    );

    const currentTheme = await getTenantTheme(authorization.orgId);

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
                        <BreadcrumbPage>Theme Settings</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white shadow-lg shadow-[hsl(var(--primary)/0.3)]">
                        <Palette className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-[hsl(var(--foreground))] via-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent">
                            Theme Settings
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Customize the appearance of your organization
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

            <OrgThemeManager
                orgId={authorization.orgId}
                currentPresetId={currentTheme.presetId}
            />
        </div>
    );
}
