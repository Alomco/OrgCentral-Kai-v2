import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import type { JsonRecord } from '@/server/types/json';

export const PLATFORM_TOOL_RUN_STATUSES = ['PENDING', 'COMPLETED', 'FAILED'] as const;
export type PlatformToolRunStatus = (typeof PLATFORM_TOOL_RUN_STATUSES)[number];

export interface PlatformToolDefinition {
    id: string;
    label: string;
    description: string;
    runbookUrl: string;
    requiresBreakGlass: boolean;
    requiresMfa: boolean;
}

export interface PlatformToolExecution {
    id: string;
    orgId: string;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
    auditSource: string;
    toolId: string;
    requestedBy: string;
    status: PlatformToolRunStatus;
    dryRun: boolean;
    parameters: JsonRecord;
    output?: JsonRecord | null;
    createdAt: string;
    completedAt?: string | null;
}
