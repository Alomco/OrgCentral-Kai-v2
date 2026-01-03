'use client';

import type { HRPolicy } from '@/server/types/hr-ops-types';

import { PolicyAdminUpdateForm } from './policy-admin-update-form';

export function PolicyAdminRow(props: {
    policy: HRPolicy;
    policyCategories: readonly string[];
    statusOptions: readonly string[];
}) {
    return (
        <div className="space-y-3 rounded-lg border p-3">
            <PolicyAdminUpdateForm
                policy={props.policy}
                policyCategories={props.policyCategories}
                statusOptions={props.statusOptions}
            />
        </div>
    );
}
