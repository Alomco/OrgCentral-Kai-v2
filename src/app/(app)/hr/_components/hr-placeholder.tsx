import type { ReactNode } from 'react';
import Link from 'next/link';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { HrPageHeader } from './hr-page-header';

// TODO(hr): Replace placeholder routes (admin, employees, absences, compliance, performance) with
// server-component pages using cacheLife/cacheTag, PPR + nested Suspense, and typed server actions.
export function HrPlaceholder(props: { title: string; description: string; children?: ReactNode }) {
    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/hr">HR</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <BreadcrumbPage>{props.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader title={props.title} description={props.description} />
            <Card>
                <CardHeader>
                    <CardTitle>Work in progress</CardTitle>
                    <CardDescription>This HR page is being migrated from the legacy app.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>Next steps: data loader, role-aware UI, and server actions.</p>
                    {props.children ? <div className="pt-2">{props.children}</div> : null}
                </CardContent>
            </Card>
        </div>
    );
}
