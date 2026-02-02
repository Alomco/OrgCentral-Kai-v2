'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { updateBillingPlanAction, type BillingPlanActionState } from '../actions';

const initialState: BillingPlanActionState = { status: 'idle' };

export function BillingPlanStatusForm({ planId }: { planId: string }) {
    const [state, formAction, pending] = useActionState(updateBillingPlanAction, initialState);

    return (
        <form action={formAction} className="flex flex-col gap-2">
            <input type="hidden" name="planId" value={planId} />
            <Input name="status" defaultValue="ACTIVE" className="h-8" disabled={pending} />
            <Button size="sm" type="submit" disabled={pending}>Update</Button>
            {state.status !== 'idle' ? (
                <Alert>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            ) : null}
        </form>
    );
}
