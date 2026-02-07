'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoButton } from '@/components/ui/info-button';

import { executePlatformToolAction, type PlatformToolActionState } from '../actions';

const initialState: PlatformToolActionState = { status: 'idle' };

export function PlatformToolExecuteForm() {
    const [state, formAction, pending] = useActionState(executePlatformToolAction, initialState);

    return (
        <form action={formAction} className="space-y-3 rounded-2xl border border-border/50 bg-card/60 p-4">
            <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Execute tool</h3>
                    <InfoButton
                        label="Execute tool"
                        sections={[
                            { label: 'What', text: 'Run an allowlisted platform tool with scoped inputs.' },
                            { label: 'Prereqs', text: 'Tool ID and required approvals.' },
                            { label: 'Next', text: 'Start with dry run, then execute.' },
                            { label: 'Compliance', text: 'Execution is logged and reviewable.' },
                        ]}
                    />
                </div>
                <p className="text-xs text-muted-foreground">Use the allowlisted tool ID and optional tenant scope.</p>
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
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="breakGlassApprovalId">Break-glass approval ID</Label>
                        <InfoButton
                            label="Break-glass approval ID"
                            sections={[
                                { label: 'What', text: 'Approval token for restricted execution.' },
                                { label: 'Prereqs', text: 'Issued by the break-glass request.' },
                                { label: 'Next', text: 'Paste before running.' },
                                { label: 'Compliance', text: 'Approvals are time-boxed.' },
                            ]}
                        />
                    </div>
                    <Input id="breakGlassApprovalId" name="breakGlassApprovalId" disabled={pending} />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="dryRun">Dry run</Label>
                        <InfoButton
                            label="Dry run"
                            sections={[
                                { label: 'What', text: 'No-op run to validate inputs.' },
                                { label: 'Prereqs', text: 'Tool supports dry-run.' },
                                { label: 'Next', text: 'Set false for real execution.' },
                                { label: 'Compliance', text: 'Dry runs reduce operational risk.' },
                            ]}
                        />
                    </div>
                    <Input id="dryRun" name="dryRun" defaultValue="true" disabled={pending} />
                </div>
            </div>
            <Button type="submit" disabled={pending}>Run tool</Button>
            {state.status !== 'idle' ? (
                <Alert>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            ) : null}
        </form>
    );
}
