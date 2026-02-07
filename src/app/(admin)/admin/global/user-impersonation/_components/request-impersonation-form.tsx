'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoButton } from '@/components/ui/info-button';

import { requestImpersonationAction, type ImpersonationActionState } from '../actions';

const initialState: ImpersonationActionState = { status: 'idle' };

export function RequestImpersonationForm() {
    const [state, formAction, pending] = useActionState(requestImpersonationAction, initialState);

    return (
        <form action={formAction} className="space-y-4 rounded-2xl border border-border/50 bg-card/60 p-4">
            <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Request impersonation</h3>
                    <InfoButton
                        label="Impersonation request"
                        sections={[
                            { label: 'What', text: 'Request a time-boxed support session.' },
                            { label: 'Prereqs', text: 'Break-glass approval and MFA.' },
                            { label: 'Next', text: 'Submit, then wait for approval.' },
                            { label: 'Compliance', text: 'Requests are audited and rate-limited.' },
                        ]}
                    />
                </div>
                <p className="text-xs text-muted-foreground">Requires break-glass approval and MFA.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="targetUserId">Target user ID</Label>
                    <Input id="targetUserId" name="targetUserId" required disabled={pending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="targetOrgId">Target org ID</Label>
                    <Input id="targetOrgId" name="targetOrgId" required disabled={pending} />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="breakGlassApprovalId">Break-glass approval ID</Label>
                        <InfoButton
                            label="Break-glass approval ID"
                            sections={[
                                { label: 'What', text: 'Approval token for this request.' },
                                { label: 'Prereqs', text: 'Issued by the break-glass form.' },
                                { label: 'Next', text: 'Paste before submitting.' },
                                { label: 'Compliance', text: 'Approvals are time-boxed.' },
                            ]}
                        />
                    </div>
                    <Input id="breakGlassApprovalId" name="breakGlassApprovalId" required disabled={pending} />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="expiresInMinutes">Expires in (minutes)</Label>
                        <InfoButton
                            label="Session time limit"
                            sections={[
                                { label: 'What', text: 'Length of the impersonation session.' },
                                { label: 'Prereqs', text: '15 to 120 minutes per policy.' },
                                { label: 'Next', text: 'Stop the session when done.' },
                                { label: 'Compliance', text: 'Sessions auto-expire.' },
                            ]}
                        />
                    </div>
                    <Input id="expiresInMinutes" name="expiresInMinutes" type="number" min={15} max={120} defaultValue={30} disabled={pending} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea id="reason" name="reason" required minLength={8} disabled={pending} />
            </div>
            <Button type="submit" disabled={pending}>Request access</Button>
            {state.status !== 'idle' ? (
                <Alert>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            ) : null}
        </form>
    );
}
