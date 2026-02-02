'use client';

import { useActionState, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { requestDocumentVaultBreakGlassAction, type DocumentVaultBreakGlassState } from '../actions';

const INITIAL_STATE: DocumentVaultBreakGlassState = { status: 'idle' };

export function DocumentVaultBreakGlassForm() {
    const [state, action, pending] = useActionState(requestDocumentVaultBreakGlassAction, INITIAL_STATE);
    const statusReference = useRef<HTMLDivElement | null>(null);
    const [accessType, setAccessType] = useState<'LIST' | 'DOWNLOAD'>('LIST');

    useEffect(() => {
        if (state.status !== 'idle') {
            statusReference.current?.focus();
        }
    }, [state.status]);

    return (
        <form action={action} className="space-y-4 rounded-2xl border border-border/50 bg-card/60 p-4">
            <div className="space-y-1">
                <h3 className="text-sm font-semibold">Request break-glass approval</h3>
                <p className="text-xs text-muted-foreground">
                    Required before listing metadata or downloading a tenant document.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="accessType">Access type</Label>
                    <select
                        id="accessType"
                        name="accessType"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        value={accessType}
                        onChange={(event) => setAccessType(event.target.value === 'DOWNLOAD' ? 'DOWNLOAD' : 'LIST')}
                        disabled={pending}
                    >
                        <option value="LIST">List metadata</option>
                        <option value="DOWNLOAD">Download document</option>
                    </select>
                </div>
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
                    <Label htmlFor="documentId">Document ID (downloads only)</Label>
                    <Input
                        id="documentId"
                        name="documentId"
                        placeholder="Document UUID"
                        required={accessType === 'DOWNLOAD'}
                        disabled={pending || accessType !== 'DOWNLOAD'}
                    />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                        id="reason"
                        name="reason"
                        placeholder="Explain the justification for access."
                        minLength={8}
                        required
                        disabled={pending}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="expiresInMinutes">Expires in</Label>
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
