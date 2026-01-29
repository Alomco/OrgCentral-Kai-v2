import type { ComplianceCategory } from '@/server/types/compliance-types';

export type ComplianceCategoryActionState =
    | { status: 'idle' }
    | { status: 'success'; message: string; category: ComplianceCategory }
    | { status: 'error'; message: string };
