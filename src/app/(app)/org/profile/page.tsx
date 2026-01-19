import { Suspense } from 'react';

import { resolveOrgContext } from '@/server/org/org-context';
import { getOrgProfile, type OrgProfile } from '@/server/org/get-org-profile';
import { OrgProfileForm } from './_components/org-profile-form';

export default async function OrgProfilePage() {
    const orgContext = await resolveOrgContext();
    const profilePromise = getOrgProfile(orgContext);

    return (
        <div className="space-y-6 p-6">
            <Suspense fallback={<ProfileSkeleton />}>
                <ProfileHeader profilePromise={profilePromise} />
            </Suspense>
            <Suspense fallback={<CardSkeleton />}>
                <ProfileDetails profilePromise={profilePromise} />
            </Suspense>
        </div>
    );
}

async function ProfileHeader({ profilePromise }: { profilePromise: Promise<OrgProfile> }) {
    const { organization } = await profilePromise;
    return (
        <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Organization</p>
            <h1 className="text-3xl font-semibold text-foreground">{organization.name}</h1>
            <p className="text-sm text-muted-foreground">
                Region {organization.regionCode} · Residency {organization.dataResidency} · Classification{' '}
                {organization.dataClassification}
            </p>
        </div>
    );
}

async function ProfileDetails({ profilePromise }: { profilePromise: Promise<OrgProfile> }) {
    const { organization } = await profilePromise;
    return (
        <div className="space-y-6">
            <div className="rounded-2xl bg-card/60 p-6 shadow-md backdrop-blur">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Detail label="Slug" value={organization.slug} />
                    <Detail label="Primary leave type" value={organization.primaryLeaveType} />
                    <Detail label="Leave year start" value={organization.leaveYearStartDate} />
                    <Detail label="Org ID" value={organization.id} />
                </div>
            </div>
            <OrgProfileForm organization={organization} />
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-muted/35 p-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
        </div>
    );
}

function ProfileSkeleton() {
    return (
        <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
    );
}

function CardSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-40 w-full animate-pulse rounded-2xl bg-muted" />
            <div className="h-96 w-full animate-pulse rounded-2xl bg-muted" />
        </div>
    );
}
