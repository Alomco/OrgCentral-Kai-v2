'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { createBillingCheckout, createBillingPortal } from './billing-subscription.api';
import type { BillingSubscriptionStatus } from '@/server/types/billing-types';

const ALLOW_CHECKOUT_STATUSES: BillingSubscriptionStatus[] = [
    'CANCELED',
    'INCOMPLETE_EXPIRED',
    'PAUSED',
];

interface BillingSubscriptionActionsProps {
    orgId: string;
    status: BillingSubscriptionStatus | null;
}

export function BillingSubscriptionActions({ orgId, status }: BillingSubscriptionActionsProps) {
    const [message, setMessage] = useState<string | null>(null);

    const checkout = useMutation({
        mutationFn: () => createBillingCheckout(orgId),
        onSuccess: (data) => {
            window.location.assign(data.url);
        },
        onError: (error) => {
            setMessage(error instanceof Error ? error.message : 'Unable to start checkout.');
        },
    });

    const portal = useMutation({
        mutationFn: () => createBillingPortal(orgId),
        onSuccess: (data) => {
            window.location.assign(data.url);
        },
        onError: (error) => {
            setMessage(error instanceof Error ? error.message : 'Unable to open billing portal.');
        },
    });

    const canStartCheckout = !status || ALLOW_CHECKOUT_STATUSES.includes(status);
    const canOpenPortal = Boolean(status);
    const isBusy = checkout.isPending || portal.isPending;

    return (
        <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                {canStartCheckout ? (
                    <Button type="button" size="sm" disabled={isBusy} onClick={() => checkout.mutate()}>
                        {checkout.isPending ? <Spinner className="mr-2" /> : null}
                        Start subscription
                    </Button>
                ) : null}
                {canOpenPortal ? (
                    <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={() => portal.mutate()}>
                        {portal.isPending ? <Spinner className="mr-2" /> : null}
                        Open billing portal
                    </Button>
                ) : null}
            </div>
            {message ? <p className="text-xs text-destructive">{message}</p> : null}
        </div>
    );
}
