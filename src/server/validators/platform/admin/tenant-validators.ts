import { z } from 'zod';
import type { PlatformTenantStatusAction } from '@/server/types/platform/tenant-admin';
import { OrganizationStatus, ComplianceTier, DataClassificationLevel, DataResidencyZone } from '@/server/types/prisma';

export const tenantListQuerySchema = z.object({
    query: z.string().trim().min(1).max(120).optional(),
    status: z.array(z.enum(OrganizationStatus)).optional(),
    complianceTier: z.array(z.enum(ComplianceTier)).optional(),
    classification: z.array(z.enum(DataClassificationLevel)).optional(),
    residency: z.array(z.enum(DataResidencyZone)).optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(5).max(100).default(25),
});

export const tenantStatusActionSchema = z.object({
    tenantId: z.uuid(),
    action: z.enum(['SUSPEND', 'RESTORE', 'ARCHIVE'] as const),
    breakGlassApprovalId: z.uuid().optional(),
});

export type TenantListQueryInput = z.infer<typeof tenantListQuerySchema>;
export type TenantStatusActionInput = z.infer<typeof tenantStatusActionSchema>;

export function parseTenantListQuery(input: unknown) {
    return tenantListQuerySchema.parse(input);
}

export function parseTenantStatusAction(input: unknown): {
    tenantId: string;
    action: PlatformTenantStatusAction;
    breakGlassApprovalId?: string;
} {
    return tenantStatusActionSchema.parse(input);
}
