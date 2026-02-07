import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { z } from 'zod';
import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { TenantThemeRegistry } from '@/components/theme/tenant-theme-registry';
import styles from './not-invited.module.css';
import notInvitedImage from '@/assets/errors/not_invited.webp';
import { registerCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_AUTH_NOT_INVITED } from '@/server/repositories/cache-scopes';
import {
    IllustrationFallback,
    NotInvitedFallback,
    isSafeNext,
    resolveTenantContext,
    type TenantContext,
} from './not-invited.helpers';

export const metadata: Metadata = {
    title: 'Access not granted | OrgCentral',
    description: 'You need an invitation to access this organization.',
};

const searchParamsSchema = z.object({
    next: z
        .string()
        .trim()
        .optional()
        .refine(isSafeNext, { message: 'Invalid next path' }),
});

const ctaActionSchema = z.object({
    intent: z.enum(['switch-account', 'contact-support']),
    orgId: z.string().trim().optional(),
});

type NotInvitedSearchParams = z.infer<typeof searchParamsSchema>;

export interface CtaActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

export const initialCtaActionState: CtaActionState = { status: 'idle' };

export async function handleCtaAction(
    _previousState: CtaActionState = initialCtaActionState,
    formData: FormData,
): Promise<CtaActionState> {
    'use server';

    void _previousState;

    const parsed = ctaActionSchema.safeParse({
        intent: formData.get('intent'),
        orgId: formData.get('orgId'),
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid action payload' };
    }

    await Promise.resolve();

    // Placeholder hook for future CTA handling (e.g., logging, telemetry, or support routing).
    return { status: 'success', message: parsed.data.intent };
}

interface NotInvitedPageProps {
    searchParams?: NotInvitedSearchParams | Promise<NotInvitedSearchParams | undefined>;
}

export default function NotInvitedPage({ searchParams }: NotInvitedPageProps) {
    return (
        <Suspense fallback={<NotInvitedFallback />}>
            <NotInvitedRuntime searchParams={searchParams} />
        </Suspense>
    );
}

async function NotInvitedRuntime({ searchParams }: NotInvitedPageProps) {
    const tenantContext = await resolveTenantContext();
    const params = await Promise.resolve(searchParams ?? {});
    const parsedSearch = searchParamsSchema.safeParse(params);
    const next = parsedSearch.success ? parsedSearch.data.next ?? null : null;

    return (
        <TenantThemeRegistry
            orgId={tenantContext.orgId}
            cacheContext={{
                classification: tenantContext.classification,
                residency: tenantContext.residency,
            }}
        >
            <Suspense fallback={<IllustrationFallback />}>
                <NotInvitedContent next={next} tenant={tenantContext} />
            </Suspense>
        </TenantThemeRegistry>
    );
}

interface NotInvitedContentProps {
    next: string | null;
    tenant: TenantContext;
}

async function NotInvitedContent({ next, tenant }: NotInvitedContentProps) {
    'use cache';
    cacheLife('seconds');
    registerCacheTag({
        orgId: tenant.orgId,
        scope: CACHE_SCOPE_AUTH_NOT_INVITED,
        classification: tenant.classification,
        residency: tenant.residency,
    });

    await Promise.resolve();

    const loginParams = new URLSearchParams();

    if (next) {
        loginParams.set('next', next);
    }

    if (tenant.orgId) {
        loginParams.set('org', tenant.orgId);
    }
    const loginHref = `/login${loginParams.toString() ? `?${loginParams.toString()}` : ''}`;
    const supportHref = `mailto:support@orgcentral.test?subject=Request%20access&body=Org%20ID:%20${encodeURIComponent(
        tenant.orgId,
    )}`;

    return (
        <AuthLayout
            title="Invitation required"
            subtitle="We found your sign-in, but this workspace needs to invite you before you can enter."
        >
            <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-linear-to-br from-[oklch(var(--background))] via-[oklch(var(--card))] to-[oklch(var(--muted))] p-10 shadow-[0_25px_90px_-40px_oklch(var(--primary)/0.65)] motion-reduce:transition-none">
                <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-[oklch(var(--primary)/0.25)] blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" />
                <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[oklch(var(--accent)/0.25)] blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" />
                <div className={`${styles.mesh} pointer-events-none`} aria-hidden />
                <div className={`${styles.grid} pointer-events-none`} aria-hidden />
                <div className={`${styles.halo} pointer-events-none`} aria-hidden />
                <div className={`${styles.orb} pointer-events-none`} aria-hidden />
                <div className={`${styles.beam} pointer-events-none`} aria-hidden />

                <div className="grid items-center gap-10 lg:grid-cols-[240px,1fr]">
                    <div className="relative flex justify-center">
                        <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-[oklch(var(--primary)/0.25)] via-[oklch(var(--accent)/0.18)] to-[oklch(var(--chart-3)/0.2)] blur-3xl motion-reduce:blur-xl" />
                        <div className="relative flex h-56 w-56 items-center justify-center rounded-2xl bg-[oklch(var(--card)/0.9)] shadow-2xl backdrop-blur-md motion-reduce:backdrop-blur-0">
                            <Image
                                src={notInvitedImage}
                                alt="Invitation required illustration"
                                width={220}
                                height={220}
                                className="h-44 w-44 drop-shadow-[0_18px_38px_rgba(0,0,0,0.45)] motion-reduce:drop-shadow-none"
                                priority
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[oklch(var(--secondary)/0.35)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[oklch(var(--foreground))] shadow-[0_10px_35px_-20px_oklch(var(--primary)/0.8)] backdrop-blur">
                            <span className="meta text-[10px] font-semibold text-[oklch(var(--foreground))]">Access pending</span>
                            <span className="rounded-full bg-[oklch(var(--accent)/0.22)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[oklch(var(--accent))] shadow-sm">
                                Org {tenant.orgId}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <h2 className={`${styles.headline} text-3xl font-semibold tracking-tight`}>No invitation on file</h2>
                            <p className="text-base text-[oklch(var(--foreground))] opacity-90">
                                Your sign-in worked, but this email is not on the invite list for this workspace.
                            </p>
                            <p className="text-sm text-[oklch(var(--foreground))] opacity-75">
                                Ask an admin to send you an invite or sign in with the address that received one. Once the invite is
                                accepted, you will land right back here.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button asChild size="lg" className="px-6 shadow-[0_15px_45px_-22px_oklch(var(--primary)/0.85)] hover:shadow-[0_18px_55px_-20px_oklch(var(--primary)/0.95)] motion-safe:translate-y-0 motion-safe:hover:-translate-y-px">
                                <Link href={loginHref}>Switch account</Link>
                            </Button>
                            <LogoutButton label="Sign out" variant="outline" size="lg" className="px-6" />
                            <Button
                                asChild
                                variant="ghost"
                                size="lg"
                                className={`bg-[oklch(var(--card)/0.7)] px-6 text-[oklch(var(--foreground))] hover:bg-[oklch(var(--card)/0.9)] ${styles.ctaGlow} motion-safe:translate-y-0 motion-safe:hover:-translate-y-px`}
                            >
                                <Link href={supportHref}>Contact support</Link>
                            </Button>
                        </div>

                        <div className="space-y-4 rounded-2xl bg-[oklch(var(--card)/0.12)] p-5 backdrop-blur-md shadow-[0_10px_40px_-30px_oklch(var(--primary)/0.5)]">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[oklch(var(--foreground))] opacity-70">
                                Quick checklist
                            </p>
                            <ul className="space-y-3 text-sm text-[oklch(var(--foreground))] opacity-85">
                                <li className="flex gap-3">
                                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[oklch(var(--accent)/0.18)] text-xs font-semibold text-[oklch(var(--accent-foreground))] shadow-inner">
                                        1
                                    </span>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-[oklch(var(--foreground))]">Ask your org admin for an invite</p>
                                        <p className="text-[oklch(var(--foreground))] opacity-75">
                                            Only workspace admins can add members. Use the email address they have on file for you.
                                        </p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[oklch(var(--chart-3)/0.18)] text-xs font-semibold text-[oklch(var(--primary-foreground))] shadow-inner">
                                        2
                                    </span>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-[oklch(var(--foreground))]">Try a different account</p>
                                        <p className="text-[oklch(var(--foreground))] opacity-75">
                                            If you received an invite at another address, switch to that account and we will redirect you.
                                        </p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[oklch(var(--primary)/0.16)] text-xs font-semibold text-[oklch(var(--primary-foreground))] shadow-inner">
                                        3
                                    </span>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-[oklch(var(--foreground))]">Still stuck?</p>
                                        <p className="text-[oklch(var(--foreground))] opacity-75">
                                            Share the org name and your email with our support team so we can help you get access.
                                        </p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[oklch(var(--foreground))] opacity-75">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500/90 motion-reduce:animate-none" />
                    <span>Signed in to the wrong organization? Switch accounts to jump to the right one.</span>
                </div>
            </div>
        </AuthLayout>
    );
}
