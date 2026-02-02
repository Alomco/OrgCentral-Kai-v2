'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { createBillingPlanAction, type BillingPlanActionState } from '../actions';

const initialState: BillingPlanActionState = { status: 'idle' };

export function CreateBillingPlanForm() {
    const [state, formAction, pending] = useActionState(createBillingPlanAction, initialState);

    return (
        <form action={formAction} className="space-y-4 rounded-2xl border border-border/50 bg-card/60 p-4">
            <div className="space-y-1">
                <h3 className="text-sm font-semibold">Create billing plan</h3>
                <p className="text-xs text-muted-foreground">
                    Define plan metadata aligned with Stripe pricing.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required disabled={pending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="stripePriceId">Stripe price ID</Label>
                    <Input id="stripePriceId" name="stripePriceId" required disabled={pending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amountCents">Amount (cents)</Label>
                    <Input id="amountCents" name="amountCents" type="number" min={0} required disabled={pending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" name="currency" defaultValue="gbp" disabled={pending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cadence">Cadence</Label>
                    <Input id="cadence" name="cadence" defaultValue="monthly" disabled={pending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Input id="status" name="status" defaultValue="DRAFT" disabled={pending} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" disabled={pending} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="features">Features (comma separated)</Label>
                <Input id="features" name="features" disabled={pending} />
            </div>

            <Button type="submit" disabled={pending}>Create plan</Button>

            {state.status !== 'idle' ? (
                <Alert>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            ) : null}
        </form>
    );
}
