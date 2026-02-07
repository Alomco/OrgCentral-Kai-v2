import { KeyRound, ShieldCheck, UserPlus, Users } from 'lucide-react';

import { ThemeGrid } from '@/components/theme/layout/primitives';
import { ThemeCard } from '@/components/theme/cards/theme-card';
import { GradientAccent } from '@/components/theme/primitives/surfaces';
import { InfoButton } from '@/components/ui/info-button';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import { getAdminDashboardKpis } from '@/server/use-cases/admin/dashboard/get-admin-dashboard-kpis';

interface AdminKpiGridProps {
    authorization: RepositoryAuthorizationContext;
}

export async function AdminKpiGrid({ authorization }: AdminKpiGridProps) {
    const kpis = await getAdminDashboardKpis(authorization);

    const complianceLabel = kpis.complianceScore !== null ? `${String(kpis.complianceScore)}%` : 'No data';

    return (
        <ThemeGrid cols={4} gap="lg">
            <ThemeCard variant="glass" hover="lift" padding="md">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Active members</p>
                            <InfoButton
                                label="Active members"
                                sections={[
                                    {
                                        label: 'What',
                                        text: 'Members with active access in this org.',
                                    },
                                    {
                                        label: 'Prereqs',
                                        text: 'Provisioned and not suspended.',
                                    },
                                    {
                                        label: 'Next',
                                        text: 'Review stale access or resend invites.',
                                    },
                                    {
                                        label: 'Compliance',
                                        text: 'Scoped to org policies and audited.',
                                    },
                                ]}
                            />
                        </div>
                        <p className="text-3xl font-semibold text-foreground">{kpis.activeMembers}</p>
                    </div>
                    <GradientAccent variant="primary" rounded="lg" className="p-3">
                        <Users className="h-5 w-5 text-white" />
                    </GradientAccent>
                </div>
            </ThemeCard>

            <ThemeCard variant="glass" hover="lift" padding="md">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending invites</p>
                            <InfoButton
                                label="Pending invites"
                                sections={[
                                    {
                                        label: 'What',
                                        text: 'Invites sent, not yet accepted or expired.',
                                    },
                                    {
                                        label: 'Prereqs',
                                        text: 'Issued from member management.',
                                    },
                                    {
                                        label: 'Next',
                                        text: 'Resend or revoke stale invites.',
                                    },
                                    {
                                        label: 'Compliance',
                                        text: 'Invite actions are audited.',
                                    },
                                ]}
                            />
                        </div>
                        <p className="text-3xl font-semibold text-foreground">{kpis.pendingInvites}</p>
                    </div>
                    <GradientAccent variant="sunset" rounded="lg" className="p-3">
                        <UserPlus className="h-5 w-5 text-white" />
                    </GradientAccent>
                </div>
            </ThemeCard>

            <ThemeCard variant="glass" hover="lift" padding="md">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total roles</p>
                            <InfoButton
                                label="Total roles"
                                sections={[
                                    {
                                        label: 'What',
                                        text: 'Access roles configured for this org.',
                                    },
                                    {
                                        label: 'Prereqs',
                                        text: 'Roles defined in org settings.',
                                    },
                                    {
                                        label: 'Next',
                                        text: 'Trim unused roles for least privilege.',
                                    },
                                    {
                                        label: 'Compliance',
                                        text: 'Role changes are audited.',
                                    },
                                ]}
                            />
                        </div>
                        <p className="text-3xl font-semibold text-foreground">{kpis.totalRoles}</p>
                    </div>
                    <GradientAccent variant="accent" rounded="lg" className="p-3">
                        <KeyRound className="h-5 w-5 text-white" />
                    </GradientAccent>
                </div>
            </ThemeCard>

            <ThemeCard variant="glass" hover="lift" padding="md">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Compliance score</p>
                            <InfoButton
                                label="Compliance score"
                                sections={[
                                    {
                                        label: 'What',
                                        text: 'Coverage of required controls and evidence.',
                                    },
                                    {
                                        label: 'Prereqs',
                                        text: 'Policies, controls, and evidence configured.',
                                    },
                                    {
                                        label: 'Next',
                                        text: 'Open tasks to close gaps.',
                                    },
                                    {
                                        label: 'Compliance',
                                        text: 'Score follows org classification rules.',
                                    },
                                ]}
                            />
                        </div>
                        <p className="text-3xl font-semibold text-foreground">{complianceLabel}</p>
                    </div>
                    <GradientAccent variant="vibrant" rounded="lg" className="p-3">
                        <ShieldCheck className="h-5 w-5 text-white" />
                    </GradientAccent>
                </div>
            </ThemeCard>
        </ThemeGrid>
    );
}

export function AdminKpiGridSkeleton() {
    return (
        <ThemeGrid cols={4} gap="lg">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={String(index)} className="h-28 rounded-2xl bg-muted/20 animate-pulse" />
            ))}
        </ThemeGrid>
    );
}
