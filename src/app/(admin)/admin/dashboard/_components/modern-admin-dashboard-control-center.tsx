import { Suspense } from 'react';
import { ShieldCheck } from 'lucide-react';

import { PageContainer } from '@/components/theme/layout';
import { GradientOrb } from '@/components/theme/decorative/effects';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

import { ModernAdminDashboardHeader } from './modern-admin-dashboard-header';
import { AdminKpiGrid, AdminKpiGridSkeleton } from './admin-kpi-grid';
import { AdminQuickActionsGrid } from './admin-quick-actions-grid';
import { AdminGovernanceAlerts, AdminGovernanceAlertsSkeleton } from './admin-governance-alerts';
import { AdminSecurityEvents, AdminSecurityEventsSkeleton } from './admin-security-events';
import { PendingApprovalsCard, PendingApprovalsSkeleton } from './pending-approvals-card';
import { TenantHealthCard, TenantHealthSkeleton } from './tenant-health-card';

interface ModernAdminDashboardControlCenterProps {
    authorization: RepositoryAuthorizationContext;
}

export function ModernAdminDashboardControlCenter({ authorization }: ModernAdminDashboardControlCenterProps) {
    return (
        <PageContainer padding="lg" maxWidth="full" className="relative overflow-hidden">
            <GradientOrb position="top-right" color="primary" className="opacity-30" />
            <GradientOrb position="bottom-left" color="accent" className="opacity-20" />

            <ModernAdminDashboardHeader />

            <div className="relative z-10 space-y-10">
                <Suspense fallback={<AdminKpiGridSkeleton />}>
                    <AdminKpiGrid authorization={authorization} />
                </Suspense>

                <div className="rounded-3xl border border-border/40 bg-card/40 p-6 shadow-lg backdrop-blur-md">
                    <AdminQuickActionsGrid />
                </div>

                <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground bg-secondary/30 px-4 py-3 rounded-xl inline-flex">
                    <ShieldCheck className="h-5 w-5" />
                    Governance & security
                </div>

                <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-2">
                        <Suspense fallback={<AdminGovernanceAlertsSkeleton />}>
                            <AdminGovernanceAlerts authorization={authorization} />
                        </Suspense>
                        <Suspense fallback={<AdminSecurityEventsSkeleton />}>
                            <AdminSecurityEvents authorization={authorization} />
                        </Suspense>
                    </div>
                    <div className="space-y-6">
                        <Suspense fallback={<PendingApprovalsSkeleton />}>
                            <PendingApprovalsCard authorization={authorization} />
                        </Suspense>
                        <Suspense fallback={<TenantHealthSkeleton />}>
                            <TenantHealthCard authorization={authorization} />
                        </Suspense>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}