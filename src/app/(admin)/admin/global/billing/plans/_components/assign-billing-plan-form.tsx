'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { assignBillingPlanAction, type BillingPlanActionState } from '../actions';

const initialState: BillingPlanActionState = { status: 'idle' };

export function AssignBillingPlanForm() {
    const [state, formAction, pending] = useActionState(assignBillingPlanAction, initialState);

    return (
        <form action={formAction} className="space-y-4 rounded-2xl border border-border/50 bg-card/60 p-4">
            <div className="space-y-1">
                <h3 className="text-sm font-semibold">Assign plan to tenant</h3>
                <p className="text-xs text-muted-foreground">Applies immediately or schedules by effective date.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="tenantId">Tenant ID</Label>
                    <Input id="tenantId" name="tenantId" required disabled={pending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="planId">Plan ID</Label>
                    <Input id="planId" name="planId" required disabled={pending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="effectiveFrom">Effective from (ISO)</Label>
                    <Input id="effectiveFrom" name="effectiveFrom" placeholder="2026-02-01T00:00:00Z" disabled={pending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="prorationBehavior">Proration</Label>
                    <Input id="prorationBehavior" name="prorationBehavior" placeholder="create_prorations" disabled={pending} />
                </div>
            </div>

            <Button type="submit" disabled={pending}>Assign plan</Button>

            {state.status !== 'idle' ? (
                <Alert>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            ) : null}
        </form>
    );
}
