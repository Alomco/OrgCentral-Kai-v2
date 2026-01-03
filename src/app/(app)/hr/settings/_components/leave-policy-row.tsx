'use client';

import type { LeavePolicy } from '@/server/types/leave-types';

import { LeavePolicyDeleteForm } from './leave-policy-delete-form';
import { LeavePolicyUpdateForm } from './leave-policy-update-form';

export function LeavePolicyRow(props: {
    policy: LeavePolicy;
    policyTypes: readonly string[];
}) {
    return (
        <div className="space-y-3 rounded-lg border p-3">
            <LeavePolicyUpdateForm policy={props.policy} policyTypes={props.policyTypes} />
            <LeavePolicyDeleteForm policyId={props.policy.id} />
        </div>
    );
}
