import type { AbsenceTypeConfig } from '@/server/types/hr-ops-types';
import { listAbsenceTypesAction } from './absence-type-actions';

export const ABSENCE_TYPES_QUERY_KEY = ['hr', 'absence-types'] as const;

export async function fetchAbsenceTypes(): Promise<AbsenceTypeConfig[]> {
    const result = await listAbsenceTypesAction();
    return result.types;
}
