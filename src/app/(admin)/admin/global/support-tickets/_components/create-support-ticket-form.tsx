'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { createSupportTicketAction, type SupportTicketActionState } from '../actions';

const initialState: SupportTicketActionState = { status: 'idle' };

export function CreateSupportTicketForm() {
    const [state, formAction, pending] = useActionState(createSupportTicketAction, initialState);

    return (
        <form action={formAction} className="space-y-4 rounded-2xl border border-border/50 bg-card/60 p-4">
            <div className="space-y-1">
                <h3 className="text-sm font-semibold">Create support ticket</h3>
                <p className="text-xs text-muted-foreground">Log a new platform support request.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="tenantId">Tenant ID</Label>
                    <Input id="tenantId" name="tenantId" required disabled={pending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="requesterEmail">Requester email</Label>
                    <Input id="requesterEmail" name="requesterEmail" type="email" required disabled={pending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="requesterName">Requester name</Label>
                    <Input id="requesterName" name="requesterName" disabled={pending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Input id="severity" name="severity" defaultValue="LOW" disabled={pending} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" required disabled={pending} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" required minLength={10} disabled={pending} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input id="tags" name="tags" disabled={pending} />
            </div>
            <Button type="submit" disabled={pending}>Create ticket</Button>
            {state.status !== 'idle' ? (
                <Alert>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            ) : null}
        </form>
    );
}
