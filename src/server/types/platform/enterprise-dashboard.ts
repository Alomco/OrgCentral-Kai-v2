export interface EnterpriseTenantMetrics {
    total: number;
    active: number;
    suspended: number;
    decommissioned: number;
}

export interface EnterpriseSupportMetrics {
    openTickets: number;
    slaBreached: number;
}

export interface EnterpriseDashboardSummary {
    tenantMetrics: EnterpriseTenantMetrics;
    supportMetrics: EnterpriseSupportMetrics;
    billingPlans: number;
    pendingImpersonations: number;
}
