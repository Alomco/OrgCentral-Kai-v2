import { z } from 'zod';
import type { PlatformToolDefinition } from '@/server/types/platform/platform-tools';

export interface PlatformToolSpec extends PlatformToolDefinition {
    parameterSchema: z.ZodType<Record<string, string | number | boolean | null>>;
}

export const PLATFORM_TOOL_SPECS: PlatformToolSpec[] = [
    {
        id: 'rebuild-search-index',
        label: 'Rebuild search index',
        description: 'Rebuilds the platform search index for cross-tenant discovery.',
        runbookUrl: '/docs/runbooks/platform/rebuild-search-index',
        requiresBreakGlass: true,
        requiresMfa: true,
        parameterSchema: z.object({
            scope: z.enum(['tenants', 'tickets', 'billing']).default('tenants'),
        }),
    },
    {
        id: 'sync-billing-status',
        label: 'Sync billing status',
        description: 'Fetches latest billing status for tenants from Stripe.',
        runbookUrl: '/docs/runbooks/platform/sync-billing-status',
        requiresBreakGlass: true,
        requiresMfa: true,
        parameterSchema: z.object({
            tenantId: z.uuid().optional(),
            dryRunNotes: z.string().max(120).optional(),
        }),
    },
    {
        id: 'refresh-security-flags',
        label: 'Refresh security flags',
        description: 'Re-evaluates security posture flags for compliance monitoring.',
        runbookUrl: '/docs/runbooks/platform/refresh-security-flags',
        requiresBreakGlass: false,
        requiresMfa: true,
        parameterSchema: z.object({
            tenantId: z.uuid().optional(),
        }),
    },
];

export const PLATFORM_TOOL_ALLOWLIST = new Map(
    PLATFORM_TOOL_SPECS.map((tool) => [tool.id, tool]),
);
