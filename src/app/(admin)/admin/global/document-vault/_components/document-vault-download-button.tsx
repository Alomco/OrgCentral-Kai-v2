'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

interface DocumentVaultDownloadButtonProps {
    documentId: string;
    tenantId: string;
    breakGlassApprovalId: string;
}

export function DocumentVaultDownloadButton({
    documentId,
    tenantId,
    breakGlassApprovalId,
}: DocumentVaultDownloadButtonProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [message, setMessage] = useState<string | null>(null);

    const handleClick = async () => {
        if (status === 'loading') {
            return;
        }

        setStatus('loading');
        setMessage(null);

        try {
            const search = new URLSearchParams({
                tenantId,
                breakGlassApprovalId,
            });
            const response = await fetch(`/api/admin/document-vault/${documentId}/download?${search.toString()}`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                const errorPayload = (await response.json().catch(() => null)) as
                    | { error?: { message?: string } }
                    | null;
                throw new Error(errorPayload?.error?.message ?? 'Unable to prepare download.');
            }

            const payload = (await response.json()) as { downloadUrl?: string };
            if (!payload.downloadUrl) {
                throw new Error('Download URL missing.');
            }

            window.location.assign(payload.downloadUrl);
            setStatus('idle');
        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Unable to download document.');
        }
    };

    return (
        <div className="flex flex-col items-start gap-1">
            <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleClick}
                disabled={status === 'loading'}
            >
                {status === 'loading' ? 'Preparing…' : 'Download'}
            </Button>
            {status === 'error' && message ? (
                <span className="text-xs text-destructive">{message}</span>
            ) : null}
        </div>
    );
}
