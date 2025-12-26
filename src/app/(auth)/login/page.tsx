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
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import {
    getMembershipRoleSnapshot,
    resolveRoleDashboard,
    ROLE_DASHBOARD_PATHS,
} from '@/server/ui/auth/role-redirect';

export const metadata: Metadata = {
    title: "Login • OrgCentral",
    description: "Sign in to your OrgCentral account.",
};

interface LoginPageProps {
    searchParams?: Record<string, string | string[] | undefined>;
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

export default function LoginPage({ searchParams }: LoginPageProps) {
    return (
        <Suspense fallback={<LoginPageFallback />}>
            <LoginGate searchParams={searchParams} />
        </Suspense>
    );
}

async function LoginGate({ searchParams }: LoginPageProps) {
    const headerStore = await nextHeaders();
    const sessionResult = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'ui:login-redirect',
        },
    ).catch(() => null);

    if (sessionResult) {
        const { authorization } = sessionResult;
        const membershipSnapshot = await getMembershipRoleSnapshot(
            authorization.orgId,
            authorization.userId,
        );
        const dashboardRole = membershipSnapshot
            ? resolveRoleDashboard(membershipSnapshot)
            : 'employee';

        redirect(ROLE_DASHBOARD_PATHS[dashboardRole]);
    }

    const initialOrgSlugValue = searchParams?.org;
    const initialOrgSlug = typeof initialOrgSlugValue === 'string' ? initialOrgSlugValue : undefined;
    return <LoginPageContent initialOrgSlug={initialOrgSlug} />;
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
