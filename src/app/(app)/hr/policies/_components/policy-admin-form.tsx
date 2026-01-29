'use client';

import { useActionState, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { policyKeys } from './policies.api';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { createPolicyAdminAction } from '../policy-admin-actions';
import type { PolicyAdminCreateState } from '../policy-admin-form-utils';
import { PolicyApplicabilityFields, PolicyContentField, PolicyIdentityFields, PolicyScheduleFields } from './policy-admin-form.sections';
import { buildInitialPolicyAdminState } from './policy-admin-form.state';

interface PolicyAdminFormProps {
    policyCategories: readonly string[];
}

export function PolicyAdminForm({ policyCategories }: PolicyAdminFormProps) {
    const queryClient = useQueryClient();
    const initialState = useMemo<PolicyAdminCreateState>(
        () => buildInitialPolicyAdminState(policyCategories),
        [policyCategories],
    );
    const [state, action, pending] = useActionState(createPolicyAdminAction, initialState);
    const formReference = useRef<HTMLFormElement | null>(null);
    const requiresAckReference = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!pending && state.status === 'success') {
            void queryClient.invalidateQueries({ queryKey: policyKeys.list() });
            formReference.current?.reset();
        }
    }, [pending, queryClient, state.status]);

    const message =
        state.status === 'error'
            ? state.message
            : state.status === 'success'
                ? state.message
                : null;

    const handleAckChange = (checked: boolean) => {
        if (requiresAckReference.current) {
            requiresAckReference.current.value = checked ? 'on' : 'off';
        }
    };

    return (
        <form
            ref={formReference}
            action={action}
            className="space-y-4"
        >
            <fieldset disabled={pending} className="space-y-4">
                <PolicyIdentityFields
                    state={state}
                    pending={pending}
                    policyCategories={policyCategories}
                />

                <PolicyScheduleFields
                    state={state}
                    pending={pending}
                    requiresAckInputRef={requiresAckReference}
                    onAckChange={handleAckChange}
                />

                <PolicyApplicabilityFields state={state} pending={pending} />

                <PolicyContentField state={state} pending={pending} />
            </fieldset>

            <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="sm" disabled={pending}>
                    {pending ? <Spinner className="mr-2" /> : null}
                    {pending ? 'Creating...' : 'Create policy'}
                </Button>
                {message ? (
                    <p
                        className={
                            state.status === 'error'
                                ? 'text-xs text-destructive'
                                : 'text-xs text-muted-foreground'
                        }
                    >
                        {message}
                    </p>
                ) : null}
            </div>
        </form>
    );
}
