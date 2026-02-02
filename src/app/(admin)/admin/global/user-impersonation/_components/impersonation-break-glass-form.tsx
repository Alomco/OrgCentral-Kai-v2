'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { requestImpersonationBreakGlassAction, type ImpersonationBreakGlassState } from '../actions';

const initialState: ImpersonationBreakGlassState = { status: 'idle' };

export function ImpersonationBreakGlassForm() {
    const [state, formAction, pending] = useActionState(requestImpersonationBreakGlassAction, initialState);

    return (
        <form action={formAction} className="space-y-4 rounded-2xl border border-border/50 bg-card/60 p-4">
            <div className="space-y-1">
                <h3 className="text-sm font-semibold">Request break-glass approval</h3>
                <p className="text-xs text-muted-foreground">Required before starting impersonation.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="targetOrgId">Target org ID</Label>
                    <Input id="targetOrgId" name="targetOrgId" required disabled={pending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="targetUserId">Target user ID</Label>
                    <Input id="targetUserId" name="targetUserId" required disabled={pending} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea id="reason" name="reason" required minLength={8} disabled={pending} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="expiresInMinutes">Expires in (minutes)</Label>
                <Input id="expiresInMinutes" name="expiresInMinutes" type="number" min={15} max={120} defaultValue={30} disabled={pending} />
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
