'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoButton } from '@/components/ui/info-button';

import { requestToolBreakGlassAction, type PlatformToolActionState } from '../actions';

const initialState: PlatformToolActionState = { status: 'idle' };

export function PlatformToolBreakGlassForm() {
    const [state, formAction, pending] = useActionState(requestToolBreakGlassAction, initialState);

    return (
        <form action={formAction} className="space-y-3 rounded-2xl border border-border/50 bg-card/60 p-4">
            <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Request break-glass approval</h3>
                    <InfoButton
                        label="Platform tool break-glass"
                        sections={[
                            { label: 'What', text: 'Create approval for restricted tools.' },
                            { label: 'Prereqs', text: 'Tool ID and justification.' },
                            { label: 'Next', text: 'Use approval ID when executing.' },
                            { label: 'Compliance', text: 'Approvals are time-boxed and audited.' },
                        ]}
                    />
                </div>
                <p className="text-xs text-muted-foreground">Required for restricted platform tools.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="toolId">Tool ID</Label>
                    <Input id="toolId" name="toolId" required disabled={pending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tenantId">Tenant ID (optional)</Label>
                    <Input id="tenantId" name="tenantId" disabled={pending} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea id="reason" name="reason" required minLength={8} disabled={pending} />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="expiresInMinutes">Expires in (minutes)</Label>
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
                <Input id="expiresInMinutes" name="expiresInMinutes" type="number" min={15} max={240} defaultValue={60} disabled={pending} />
            </div>
            <Button type="submit" disabled={pending}>Request approval</Button>
            {state.status !== 'idle' ? (
                <Alert>
                    <AlertDescription>
                        {state.message}
                        {state.approvalId ? (
                            <span className="block text-xs text-muted-foreground">Approval ID: {state.approvalId}</span>
                        ) : null}
                    </AlertDescription>
                </Alert>
            ) : null}
        </form>
    );
}
