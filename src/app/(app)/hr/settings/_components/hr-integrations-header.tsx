'use client';

import type { ReactNode } from 'react';
import { useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { HrStatusIndicator, type StatusVariant } from '@/app/(app)/hr/_components/hr-design-system/status-indicator';

import type { HrIntegrationsStatus } from '../integrations-schema';
import { triggerIntegrationSyncAction } from '../integrations-actions';
import type { IntegrationProvider } from '@/server/workers/hr/integrations/integration-sync.types';
import { HR_INTEGRATIONS_QUERY_KEY } from '../integrations-query';

export interface IntegrationSectionHeaderProps {
    title: string;
    description: string;
    status: HrIntegrationsStatus[keyof HrIntegrationsStatus];
    provider: IntegrationProvider;
    icon: ReactNode;
    disabled: boolean;
}

export function IntegrationSectionHeader({
    title,
    description,
    status,
    provider,
    icon,
    disabled,
}: IntegrationSectionHeaderProps) {
    const indicator = resolveStatusIndicator(status);

    return (
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="text-base font-semibold">{title}</h3>
                    <HrStatusIndicator status={indicator.variant} label={indicator.label} />
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
                <p className="text-xs text-muted-foreground">Last sync: {formatLastSync(status.lastSyncAt)}</p>
            </div>
            <IntegrationSyncButton provider={provider} disabled={disabled} />
        </div>
    );
}

function resolveStatusIndicator(status: { enabled: boolean; status: string | null }): { variant: StatusVariant; label: string } {
    if (!status.enabled) {
        return { variant: 'neutral', label: 'Disabled' };
    }
    if (status.status === 'queued') {
        return { variant: 'pending', label: 'Sync queued' };
    }
    if (status.status === 'error') {
        return { variant: 'error', label: 'Needs attention' };
    }
    if (status.status === 'connected') {
        return { variant: 'success', label: 'Connected' };
    }
    return { variant: 'info', label: 'Configured' };
}

function formatLastSync(value: string | null): string {
    if (!value) {
        return 'Never synced';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return 'Unknown';
    }
    return parsed.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function IntegrationSyncButton(props: { provider: IntegrationProvider; disabled: boolean }) {
    const queryClient = useQueryClient();
    const [message, setMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSync = () => {
        setMessage(null);
        startTransition(() => {
            triggerIntegrationSyncAction(props.provider)
                .then((result) => {
                    setMessage(result.message);
                    if (result.status === 'success') {
                        void queryClient.invalidateQueries({ queryKey: HR_INTEGRATIONS_QUERY_KEY }).catch(() => null);
                    }
                })
                .catch(() => setMessage('Unable to queue sync.'));
        });
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={props.disabled || isPending}
                onClick={handleSync}
                aria-label="Run a manual sync"
            >
                {isPending ? <Spinner className="mr-2" /> : null}
                Sync now
            </Button>
            {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
        </div>
    );
}
