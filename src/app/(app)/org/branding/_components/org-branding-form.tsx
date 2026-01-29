'use client';

import { useActionState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { OrgBranding } from '@/server/types/branding-types';
import { brandingKeys } from '../branding.api';
import { initialOrgBrandingState } from '../actions.state';
import { resetOrgBrandingAction, updateOrgBrandingAction } from '../actions';

export function OrgBrandingForm({ branding, orgId }: { branding: OrgBranding | null; orgId: string }) {
    const queryClient = useQueryClient();
    const [updateState, updateAction, updatePending] = useActionState(
        updateOrgBrandingAction,
        initialOrgBrandingState,
    );
    const [resetState, resetAction, resetPending] = useActionState(
        resetOrgBrandingAction,
        initialOrgBrandingState,
    );

    useEffect(() => {
        if (updateState.status === 'success' || resetState.status === 'success') {
            queryClient.invalidateQueries({ queryKey: brandingKeys.detail(orgId) }).catch(() => null);
        }
    }, [orgId, queryClient, resetState.status, updateState.status]);

    return (
        <div className="space-y-4">
            <form action={updateAction} className="space-y-4 rounded-2xl bg-[oklch(var(--card)/0.6)] p-6 backdrop-blur" aria-busy={updatePending}>
                <div>
                    <p className="text-sm font-semibold text-[oklch(var(--foreground))]">Branding settings</p>
                    <p className="text-xs text-[oklch(var(--muted-foreground))]">Updates apply to this organization.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1">
                        <span className="text-xs font-medium text-[oklch(var(--muted-foreground))]">Company name</span>
                        <Input name="companyName" defaultValue={branding?.companyName ?? ''} placeholder="Org name" />
                    </label>

                    <label className="grid gap-1">
                        <span className="text-xs font-medium text-[oklch(var(--muted-foreground))]">Logo URL</span>
                        <Input name="logoUrl" defaultValue={branding?.logoUrl ?? ''} placeholder="https://..." />
                    </label>

                    <label className="grid gap-1">
                        <span className="text-xs font-medium text-[oklch(var(--muted-foreground))]">Favicon URL</span>
                        <Input name="faviconUrl" defaultValue={branding?.faviconUrl ?? ''} placeholder="https://..." />
                    </label>

                    <label className="grid gap-1">
                        <span className="text-xs font-medium text-[oklch(var(--muted-foreground))]">Primary color</span>
                        <Input name="primaryColor" defaultValue={branding?.primaryColor ?? ''} placeholder="#3B82F6" />
                    </label>

                    <label className="grid gap-1">
                        <span className="text-xs font-medium text-[oklch(var(--muted-foreground))]">Secondary color</span>
                        <Input name="secondaryColor" defaultValue={branding?.secondaryColor ?? ''} placeholder="#F1F5F9" />
                    </label>

                    <label className="grid gap-1">
                        <span className="text-xs font-medium text-[oklch(var(--muted-foreground))]">Accent color</span>
                        <Input name="accentColor" defaultValue={branding?.accentColor ?? ''} placeholder="#22C55E" />
                    </label>
                </div>

                <label className="grid gap-1">
                    <span className="text-xs font-medium text-[oklch(var(--muted-foreground))]">Custom CSS</span>
                    <Textarea name="customCss" defaultValue={branding?.customCss ?? ''} rows={8} placeholder="/* Optional */" />
                </label>

                <div className="flex items-center gap-3">
                    <Button type="submit" size="sm" className="px-4" disabled={updatePending}>
                        Save
                    </Button>
                    {updateState.status === 'success' ? (
                        <p className="text-xs text-[oklch(var(--muted-foreground))]">{updateState.message ?? 'Saved'}</p>
                    ) : null}
                </div>

                {updateState.status === 'error' ? (
                    <p className="text-xs text-red-500" role="alert">{updateState.message ?? 'Unable to save'}</p>
                ) : null}
            </form>

            <form action={resetAction} className="rounded-2xl bg-[oklch(var(--card)/0.6)] p-6 backdrop-blur" aria-busy={resetPending}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-[oklch(var(--foreground))]">Reset branding</p>
                        <p className="text-xs text-[oklch(var(--muted-foreground))]">Clears all organization overrides.</p>
                    </div>
                    <Button type="submit" variant="outline" size="sm" disabled={resetPending}>
                        Reset
                    </Button>
                </div>

                {resetState.status === 'success' ? (
                    <p className="mt-3 text-xs text-[oklch(var(--muted-foreground))]">{resetState.message ?? 'Reset'}</p>
                ) : null}

                {resetState.status === 'error' ? (
                    <p className="mt-3 text-xs text-red-500" role="alert">{resetState.message ?? 'Unable to reset'}</p>
                ) : null}
            </form>
        </div>
    );
}
