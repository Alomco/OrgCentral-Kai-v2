import type { Metadata } from 'next';
import Link from 'next/link';
import { headers as nextHeaders } from 'next/headers';
import { Suspense } from 'react';
import { z } from 'zod';

import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { auth } from '@/server/lib/auth';
import { getInvitationDetailsController } from '@/server/api-adapters/auth/get-invitation-details';
import { AcceptInvitationForm } from './accept-invitation-form';

export const metadata: Metadata = {
    title: 'Accept invitation | OrgCentral',
    description: 'Accept your invitation to join an organization.',
};

const searchParamsSchema = z.object({
    token: z.string().trim().min(1, 'Invitation token is required'),
});

interface AcceptInvitationPageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default function AcceptInvitationPage({ searchParams }: AcceptInvitationPageProps) {
    return (
        <Suspense
            fallback={(
                <AuthLayout
                    title="Loading invitation"
                    subtitle="We’re preparing your invitation details."
                >
                    <div className="space-y-4 text-center text-sm text-slate-600 dark:text-slate-300">
                        <p>Loading invitation details…</p>
                    </div>
                </AuthLayout>
            )}
        >
            <AcceptInvitationContent searchParams={searchParams} />
        </Suspense>
    );
}

async function AcceptInvitationContent({ searchParams }: AcceptInvitationPageProps) {
    const params = searchParams ? await searchParams : {};
    const parsed = searchParamsSchema.safeParse(params);
    if (!parsed.success) {
        return (
            <AuthLayout
                title="Invitation required"
                subtitle="We need a valid invitation token to continue."
            >
                <div className="space-y-4 text-center text-sm text-slate-600 dark:text-slate-300">
                    <p>Check the invitation link and try again.</p>
                    <Button asChild variant="outline">
                        <Link href="/login">Go to login</Link>
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    const token = parsed.data.token;
    const headerStore = await nextHeaders();
    const session = await auth.api.getSession({ headers: headerStore });

    let invitationResult: Awaited<ReturnType<typeof getInvitationDetailsController>> | null = null;
    let invitationError: string | null = null;

    try {
        invitationResult = await getInvitationDetailsController({ token });
    } catch (error) {
        invitationError = error instanceof Error ? error.message : 'Unable to load invitation details.';
    }

    if (!invitationResult) {
        return (
            <AuthLayout
                title="Invitation unavailable"
                subtitle="We could not load this invitation."
            >
                <div className="space-y-4 text-center text-sm text-slate-600 dark:text-slate-300">
                    <p>{invitationError ?? 'Please request a new invitation from your administrator.'}</p>
                    <Button asChild variant="outline">
                        <Link href="/login">Go to login</Link>
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    if (!session?.session) {
        const loginParams = new URLSearchParams({ next: `/accept-invitation?token=${encodeURIComponent(token)}` });
        return (
            <AuthLayout
                title="Sign in to accept"
                subtitle={`You're invited to join ${invitationResult.invitation.organizationName}.`}
            >
                <div className="space-y-4 text-center text-sm text-slate-600 dark:text-slate-300">
                    <p>Sign in with the invited email to accept the invitation.</p>
                    <Button asChild>
                        <Link href={`/login?${loginParams.toString()}`}>Sign in</Link>
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    const roles = invitationResult.invitation.onboardingData.roles ?? [];

    return (
        <AuthLayout
            title="Accept your invitation"
            subtitle={`Join ${invitationResult.invitation.organizationName} and start collaborating.`}
        >
            <AcceptInvitationForm
                token={token}
                organizationName={invitationResult.invitation.organizationName}
                targetEmail={invitationResult.invitation.email}
                roles={roles}
            />
        </AuthLayout>
    );
}
