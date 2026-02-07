'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoButton } from '@/components/ui/info-button';

import { requestBreakGlassAction, type BreakGlassActionState } from '../actions';

const initialState: BreakGlassActionState = { status: 'idle' };

export function BreakGlassRequestForm() {
    const [state, action, pending] = useActionState(requestBreakGlassAction, initialState);
    const statusReference = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (state.status !== 'idle') {
            statusReference.current?.focus();
        }
    }, [state.status]);

    return (
        <form action={action} className="space-y-4 rounded-2xl border border-border/50 bg-card/60 p-4">
            <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Request break-glass approval</h3>
                    <InfoButton
                        label="Tenant status break-glass"
                        sections={[
                            { label: 'What', text: 'Approval to suspend or archive a tenant.' },
                            { label: 'Prereqs', text: 'Platform tenant access and justification.' },
                            { label: 'Next', text: 'Use the approval ID when taking action.' },
                            { label: 'Compliance', text: 'Approvals are audited.' },
                        ]}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Required for suspending or archiving tenants.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="tenantId">Tenant ID</Label>
                    <Input
                        id="tenantId"
                        name="tenantId"
                        placeholder="Tenant UUID"
                        required
                        disabled={pending}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="action">Action</Label>
                    <select
                        id="action"
                        name="action"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        defaultValue="SUSPEND"
                        disabled={pending}
                    >
                        <option value="SUSPEND">Suspend</option>
                        <option value="ARCHIVE">Archive</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                        id="reason"
                        name="reason"
                        placeholder="Explain why this action is required."
                        minLength={8}
                        required
                        disabled={pending}
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="expiresInMinutes">Expires in</Label>
                        <InfoButton
                            label="Approval expiry"
                            sections={[
                                { label: 'What', text: 'How long the approval is valid.' },
                                { label: 'Prereqs', text: '15 to 240 minutes per policy.' },
                                { label: 'Next', text: 'Request a new approval if needed.' },
                                { label: 'Compliance', text: 'Short windows reduce access risk.' },
                            ]}
                        />
                    </div>
                    <Input
                        id="expiresInMinutes"
                        name="expiresInMinutes"
                        type="number"
                        min={15}
                        max={240}
                        defaultValue={60}
                        disabled={pending}
                    />
                </div>
            </div>

            <Button type="submit" disabled={pending}>
                Request approval
            </Button>

            {state.status !== 'idle' ? (
                <Alert ref={statusReference} tabIndex={-1} className="mt-2">
                    <AlertTitle>
                        {state.status === 'success' ? 'Request submitted' : 'Request failed'}
                    </AlertTitle>
                    <AlertDescription>
                        {state.message}
                        {state.approvalId ? (
                            <span className="block text-xs text-muted-foreground">
                                Approval ID: {state.approvalId}
                            </span>
                        ) : null}
                    </AlertDescription>
                </Alert>
            ) : null}
        </form>
    );
}
