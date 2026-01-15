import type { ManagedOrganizationSummary } from '@/server/types/enterprise-types';

export interface EnterpriseOnboardingInput {
    adminUserId: string;
    orgId?: string;
    orgName: string;
    ownerEmail: string;
    planId: string;
    moduleAccess: Record<string, boolean>;
}

export interface ModuleAccessUpdateInput {
    adminUserId: string;
    orgId: string;
    moduleAccess: Record<string, boolean>;
}

export interface IEnterpriseAdminRepository {
    onboardOrganization(input: EnterpriseOnboardingInput): Promise<ManagedOrganizationSummary>;
    listManagedOrganizations(adminUserId: string): Promise<ManagedOrganizationSummary[]>;
    getManagedOrganization(adminUserId: string, orgId: string): Promise<ManagedOrganizationSummary | null>;
    updateModuleAccess(input: ModuleAccessUpdateInput): Promise<ManagedOrganizationSummary>;
}
