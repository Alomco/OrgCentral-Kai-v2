import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { PageContainer } from '@/components/theme/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { registerCacheTag } from '@/server/lib/cache-tags';
import { listPlatformToolsService, listPlatformToolExecutionsService } from '@/server/services/platform/admin/platform-tools-service';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

import { PlatformToolBreakGlassForm } from './_components/platform-tool-break-glass-form';
import { PlatformToolExecuteForm } from './_components/platform-tool-execute-form';

export const metadata: Metadata = {
    title: 'Platform Tools - OrgCentral',
    description: 'Guarded operational tooling for global administrators.',
};

export default async function PlatformToolsPage() {
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformTools: ['read'] },
            auditSource: 'ui:admin:platform-tools',
        },
    );

    const { tools, executions } = await loadPlatformTools(authorization);

    return (
        <PageContainer padding="lg" maxWidth="full" className="space-y-6">
            <header className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">Platform tools</h1>
                <p className="text-sm text-muted-foreground">
                    Guarded operations with runbook links, approvals, and audit trails.
                </p>
            </header>

            <PlatformToolBreakGlassForm />
            <PlatformToolExecuteForm />

            <Card>
                <CardHeader>
                    <CardTitle>Allowlisted tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    {tools.map((tool) => (
                        <div key={tool.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                            <div>
                                <p className="font-medium text-foreground">{tool.label}</p>
                                <p className="text-xs text-muted-foreground">{tool.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {tool.requiresBreakGlass ? <Badge variant="secondary">Break-glass</Badge> : null}
                                {tool.requiresMfa ? <Badge variant="outline">MFA</Badge> : null}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Execution history</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    {executions.length === 0 ? (
                        <p>No executions logged yet.</p>
                    ) : (
                        executions.slice(0, 6).map((execution) => (
                            <div key={execution.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                                <span>{execution.toolId}</span>
                                <Badge variant="outline">{execution.status}</Badge>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </PageContainer>
    );
}

async function loadPlatformTools(authorization: RepositoryAuthorizationContext) {
    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return loadPlatformToolsUncached(authorization);
    }

    return loadPlatformToolsCached(authorization);
}

async function loadPlatformToolsCached(authorization: RepositoryAuthorizationContext) {
    'use cache';
    cacheLife('minutes');
    registerCacheTag({
        orgId: authorization.orgId,
        scope: 'platform:tools',
        classification: authorization.dataClassification,
        residency: authorization.dataResidency,
    });

    return loadPlatformToolsUncached(authorization);
}

async function loadPlatformToolsUncached(authorization: RepositoryAuthorizationContext) {
    const [tools, executions] = await Promise.all([
        listPlatformToolsService(authorization),
        listPlatformToolExecutionsService(authorization),
    ]);

    return { tools, executions };
}
