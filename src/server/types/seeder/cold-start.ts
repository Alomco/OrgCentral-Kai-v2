export type SeedGroup = 'platform' | 'demo';

export type SeedDatasetSize = 'minimal' | 'full';

export type SeedCategoryId =
    | 'roles'
    | 'permissions'
    | 'starter'
    | 'leave-policies'
    | 'compliance-templates'
    | 'employees'
    | 'absences'
    | 'time-entries'
    | 'training'
    | 'performance'
    | 'notifications'
    | 'security-events'
    | 'billing'
    | 'org-assets'
    | 'compliance'
    | 'integrations';

export interface SeedCategoryCountConfig {
    min: number;
    max: number;
    defaults: Record<SeedDatasetSize, number>;
}

export interface SeedCategoryDefinition {
    id: SeedCategoryId;
    group: SeedGroup;
    label: string;
    description: string;
    count?: SeedCategoryCountConfig;
    requiresEmployees?: boolean;
}

export interface SeedCategorySelection {
    id: SeedCategoryId;
    enabled: boolean;
    dataset: SeedDatasetSize;
    count?: number;
}

export interface ColdStartSeedPlanInput {
    platform: SeedCategorySelection[];
    demo: SeedCategorySelection[];
}

export type SeedStepStatus = 'success' | 'failed' | 'skipped';

export interface SeedStepResult {
    id: SeedCategoryId;
    group: SeedGroup;
    dataset: SeedDatasetSize;
    status: SeedStepStatus;
    message: string;
    count?: number;
}

export type SeedSummaryCounts = Record<SeedCategoryId, number>;

export interface ColdStartSeedPlanSummary {
    totals: SeedSummaryCounts;
    skipped: SeedStepResult[];
}

export interface ColdStartSeedPlanResponse {
    success: boolean;
    message?: string;
    steps: SeedStepResult[];
    summary: ColdStartSeedPlanSummary;
}
