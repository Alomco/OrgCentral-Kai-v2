'use client';

import Link from 'next/link';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorRetryButton } from '@/components/error';
import { LogoutButton } from '@/components/auth/LogoutButton';

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
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
                        <BreadcrumbPage>Onboarding</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <Card className="relative overflow-hidden shadow-[0_15px_50px_-20px_hsl(var(--destructive)/0.25)]">
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[hsl(var(--destructive)/0.1)] blur-2xl" />
                <CardHeader>
                    <CardTitle className="bg-linear-to-r from-[hsl(var(--destructive))] to-[hsl(var(--accent))] bg-clip-text text-transparent">
                        Unable to load Onboarding
                    </CardTitle>
                    <CardDescription role="alert" aria-live="polite" aria-atomic="true">
                        Something went wrong while rendering this page. Try again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    If the problem persists, contact your administrator.
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-end gap-2 border-t">
                    <ErrorRetryButton reset={reset} label="Retry" />
                    <LogoutButton label="Sign out" variant="outline" size="sm" />
                </CardFooter>
            </Card>
        </div>
    );
}
