'use client';

import { useQuery } from '@tanstack/react-query';
import type { HRPolicy } from '@/server/types/hr-ops-types';
import { listPoliciesQuery } from './policies.api';

import { PolicyAdminForm } from './policy-admin-form';
import { PolicyAdminRow } from './policy-admin-row';

export function PolicyAdminManager(props: {
    policies: HRPolicy[];
    policyCategories: readonly string[];
}) {
    const { data: policies = props.policies } = useQuery({ ...listPoliciesQuery(), initialData: props.policies });

    return (
        <div className="space-y-6">
            <PolicyAdminForm policyCategories={props.policyCategories} />

            <div className="text-sm font-medium">Existing policies</div>
            {policies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No policies configured yet.</p>
            ) : (
                <div className="space-y-3">
                    {policies.map((policy) => (
                        <PolicyAdminRow
                            key={policy.id}
                            policy={policy}
                            policyCategories={props.policyCategories}
                            statusOptions={['draft', 'active']}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
