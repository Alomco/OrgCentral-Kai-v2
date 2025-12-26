'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { acknowledgePolicyAction } from '../actions';
import { buildInitialAcknowledgePolicyFormState } from '../form-state';

export interface AcknowledgePolicyFormProps {
    policyId: string;
    version: string;
}

export function AcknowledgePolicyForm({ policyId, version }: AcknowledgePolicyFormProps) {
    const [state, action, pending] = useActionState(
        acknowledgePolicyAction,
        buildInitialAcknowledgePolicyFormState({ policyId, version }),
    );

    const feedbackReference = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!pending && state.status === 'error') {
            feedbackReference.current?.focus();
        }
    }, [pending, state.status]);

    return (
        <form action={action} className="flex flex-wrap items-center gap-3" aria-busy={pending}>
            <input type="hidden" name="policyId" value={policyId} />
            <input type="hidden" name="version" value={version} />
            <Button type="submit" disabled={pending}>
                {pending ? <Spinner className="mr-2" /> : null}
                {pending ? 'Acknowledging…' : 'Acknowledge policy'}
            </Button>
            <div className="text-sm text-muted-foreground">
                Confirms you have read and understood this policy.
            </div>
            {state.status === 'error' ? (
                <div
                    ref={feedbackReference}
                    tabIndex={-1}
                    className="w-full text-sm text-destructive"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {state.message ?? 'Unable to acknowledge policy.'}
                </div>
            ) : null}
        </form>
    );
}
