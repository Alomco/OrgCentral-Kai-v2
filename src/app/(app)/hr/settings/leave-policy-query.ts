import type { LeavePolicy } from '@/server/types/leave-types';
import { listLeavePoliciesAction } from './leave-policy-read-action';

export const LEAVE_POLICIES_QUERY_KEY = ['hr', 'leave-policies'] as const;

export async function fetchLeavePolicies(): Promise<LeavePolicy[]> {
    const result = await listLeavePoliciesAction();
    return result.policies;
}
