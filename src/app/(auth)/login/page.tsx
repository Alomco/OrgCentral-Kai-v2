import type { Metadata } from "next";
import Link from "next/link";
import { headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import { cacheLife } from "next/cache";
import { Suspense } from "react";

import AuthLayout from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { registerCacheTag } from "@/server/lib/cache-tags";
import { CACHE_SCOPE_AUTH_LOGIN_PAGE } from '@/server/repositories/cache-scopes';
import { auth } from '@/server/lib/auth';
import { sanitizeNextPath } from '@/server/ui/auth/role-redirect';

export const metadata: Metadata = {
    title: "Login • OrgCentral",
    description: "Sign in with an invited OrgCentral account.",
};

type LoginSearchParams = Record<string, string | string[] | undefined>;

interface LoginPageProps {
    searchParams: Promise<LoginSearchParams>;
}

interface LoginPageCopy {
    title: string;
    subtitle: string;
}

function getLoginPageCopy(): Promise<LoginPageCopy> {
    return Promise.resolve({
        title: "Welcome back",
        subtitle: "Sign in with your invited account to continue.",
    });
}

interface LoginPageContentProps {
    initialOrgSlug?: string;
    reason?: "session_expired";
}

async function LoginPageContent({ initialOrgSlug, reason }: LoginPageContentProps) {
    "use cache";
    cacheLife("seconds");
    registerCacheTag({
        orgId: "public",
        scope: CACHE_SCOPE_AUTH_LOGIN_PAGE,
        classification: "OFFICIAL",
        residency: "UK_ONLY",
    });

    const copy = await getLoginPageCopy();

    return (
        <AuthLayout
            title={copy.title}
            subtitle={copy.subtitle}
            footer={<AuthFooter />}
        >
            <div className="space-y-4">
                {reason === "session_expired" ? (
                    <Alert>
                        <AlertTitle>Session expired</AlertTitle>
                        <AlertDescription>
                            Your session expired due to inactivity. Please sign in again to continue.
                        </AlertDescription>
                    </Alert>
                ) : null}
                <LoginForm initialOrgSlug={initialOrgSlug} />
            </div>
        </AuthLayout>
    );
}

export default function LoginPage({ searchParams }: LoginPageProps) {
    return (
        <Suspense fallback={<LoginPageFallback />}>
            <LoginGate searchParams={searchParams} />
        </Suspense>
    );
}

async function LoginGate({ searchParams }: LoginPageProps) {
    const resolvedSearchParams = await searchParams;
    const headerStore = await nextHeaders();
    const session = await auth.api.getSession({
        headers: headerStore,
        query: { disableRefresh: true },
    });

    const initialOrgSlug = extractOrgSlug(resolvedSearchParams);
    const reason = extractReason(resolvedSearchParams);

    if (session?.session) {
        redirect(buildPostLoginRedirect(resolvedSearchParams, initialOrgSlug));
    }

    return <LoginPageContent initialOrgSlug={initialOrgSlug} reason={reason} />;
}

function buildPostLoginRedirect(
    searchParams: LoginSearchParams,
    initialOrgSlug?: string,
): string {
    const params = new URLSearchParams();
    const orgSlug = initialOrgSlug ?? extractOrgSlug(searchParams);
    const nextPath = extractNextPath(searchParams);

    if (nextPath) {
        params.set('next', nextPath);
    }

    if (orgSlug) {
        params.set('org', orgSlug);
    }

    const query = params.toString();
    return query ? `/api/auth/post-login?${query}` : '/api/auth/post-login';
}

function extractNextPath(searchParams: LoginSearchParams): string | null {
    const value = searchParams.next;
    const nextParameter = Array.isArray(value) ? value[0] : value;
    return sanitizeNextPath(typeof nextParameter === 'string' ? nextParameter : null);
}

function extractOrgSlug(searchParams: LoginSearchParams): string | undefined {
    const value = searchParams.org;
    const orgSlug = Array.isArray(value) ? value[0] : value;
    if (typeof orgSlug !== 'string') {
        return undefined;
    }

    const trimmed = orgSlug.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function extractReason(searchParams: LoginSearchParams): "session_expired" | undefined {
    const value = searchParams.reason;
    const reason = Array.isArray(value) ? value[0] : value;
    return reason === "session_expired" ? "session_expired" : undefined;
}

function AuthFooter() {
    const isDevelopment = process.env.NODE_ENV === "development";

    return (
        <div className="flex flex-col items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
            <p className="text-center">
                Access is invite-only. <Link className="font-semibold text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-300" href="mailto:support@orgcentral.test?subject=Access%20request">Request access</Link>
            </p>
            {isDevelopment ? (
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                    <Link href="/admin-signup">Dev: Admin bootstrap</Link>
                </Button>
            ) : null}
        </div>
    );
}

function LoginPageFallback() {
    return (
        <AuthLayout
            title="Loading login"
            subtitle="Preparing your workspace..."
            footer={<AuthFooter />}
        >
            <div className="h-32 w-full animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-700/40" />
        </AuthLayout>
    );
}
