import type { Metadata } from "next";
import Link from "next/link";
import { headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import { cacheLife } from "next/cache";
import { Suspense } from "react";

import AuthLayout from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/button";
import { registerCacheTag } from "@/server/lib/cache-tags";
import { auth } from '@/server/lib/auth';
import { sanitizeNextPath } from '@/server/ui/auth/role-redirect';

export const metadata: Metadata = {
    title: "Login • OrgCentral",
    description: "Sign in to your OrgCentral account.",
};

type LoginSearchParams = Record<string, string | string[] | undefined>;

interface LoginPageProps {
    searchParams: Promise<LoginSearchParams>;
}

interface ResolvedLoginPageProps {
    searchParams: LoginSearchParams;
}

interface LoginPageCopy {
    title: string;
    subtitle: string;
}

function getLoginPageCopy(): Promise<LoginPageCopy> {
    return Promise.resolve({
        title: "Welcome back",
        subtitle: "Sign in to your account to continue.",
    });
}

interface LoginPageContentProps {
    initialOrgSlug?: string;
}

async function LoginPageContent({ initialOrgSlug }: LoginPageContentProps) {
    "use cache";
    cacheLife("seconds");
    registerCacheTag({
        orgId: "public",
        scope: "auth:login-page",
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
            <LoginForm initialOrgSlug={initialOrgSlug} />
        </AuthLayout>
    );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const resolvedSearchParams = await searchParams;

    return (
        <Suspense fallback={<LoginPageFallback />}>
            <LoginGate searchParams={resolvedSearchParams} />
        </Suspense>
    );
}

async function LoginGate({ searchParams }: ResolvedLoginPageProps) {
    const headerStore = await nextHeaders();
    const session = await auth.api.getSession({
        headers: headerStore,
        query: { disableRefresh: true },
    });

    const initialOrgSlug = extractOrgSlug(searchParams);

    if (session?.session) {
        redirect(buildPostLoginRedirect(searchParams, initialOrgSlug));
    }

    return <LoginPageContent initialOrgSlug={initialOrgSlug} />;
}

function buildPostLoginRedirect(
    searchParams: ResolvedLoginPageProps['searchParams'],
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

function extractNextPath(searchParams: ResolvedLoginPageProps['searchParams']): string | null {
    const value = searchParams.next;
    const nextParameter = Array.isArray(value) ? value[0] : value;
    return sanitizeNextPath(typeof nextParameter === 'string' ? nextParameter : null);
}

function extractOrgSlug(searchParams: ResolvedLoginPageProps['searchParams']): string | undefined {
    const value = searchParams.org;
    const orgSlug = Array.isArray(value) ? value[0] : value;
    if (typeof orgSlug !== 'string') {
        return undefined;
    }

    const trimmed = orgSlug.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function AuthFooter() {
    const isDevelopment = process.env.NODE_ENV === "development";

    return (
        <div className="flex flex-col items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
            <p className="text-center">
                Don&apos;t have an account? <Link className="font-semibold text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-300" href="/auth/register">Sign up</Link>
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
