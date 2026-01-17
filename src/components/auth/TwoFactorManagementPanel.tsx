"use client";

import { useCallback, useState } from 'react';
import { Copy, Loader2, ShieldOff } from 'lucide-react';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface StatusMessage {
    tone: 'info' | 'error' | 'success';
    message: string;
}

interface TwoFactorManagementPanelProps {
    onDisabled?: () => void;
}

export function TwoFactorManagementPanel({ onDisabled }: TwoFactorManagementPanelProps) {
    const [password, setPassword] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [status, setStatus] = useState<StatusMessage | null>(null);
    const [isDisabling, setIsDisabling] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const requirePassword = useCallback((): boolean => {
        if (!password.trim()) {
            setStatus({ tone: 'error', message: 'Enter your password to manage MFA settings.' });
            return false;
        }
        return true;
    }, [password]);

    const handleCopy = useCallback(async (value: string, label: string) => {
        setStatus(null);

        try {
            await navigator.clipboard.writeText(value);
            setStatus({ tone: 'success', message: `${label} copied to clipboard.` });
        } catch {
            setStatus({ tone: 'error', message: `Unable to copy ${label}. Please copy it manually.` });
        }
    }, []);

    const handleGenerateBackupCodes = useCallback(async () => {
        setStatus(null);
        setBackupCodes([]);

        if (!requirePassword()) {
            return;
        }

        setIsGenerating(true);
        try {
            const { data, error } = await authClient.twoFactor.generateBackupCodes({
                password: password.trim(),
            });

            if (error) {
                setStatus({ tone: 'error', message: error.message ?? 'Unable to generate backup codes.' });
                return;
            }

            const codes = data.backupCodes;
            if (!Array.isArray(codes) || codes.length === 0) {
                setStatus({ tone: 'error', message: 'No backup codes were returned. Please try again.' });
                return;
            }

            setBackupCodes(codes);
            setStatus({ tone: 'success', message: 'New backup codes generated. Store them safely.' });
        } catch {
            setStatus({ tone: 'error', message: 'We could not generate new backup codes.' });
        } finally {
            setIsGenerating(false);
        }
    }, [password, requirePassword]);

    const handleDisableMfa = useCallback(async () => {
        setStatus(null);
        setBackupCodes([]);

        if (!requirePassword()) {
            return;
        }

        setIsDisabling(true);
        try {
            const { error } = await authClient.twoFactor.disable({
                password: password.trim(),
            });

            if (error) {
                setStatus({ tone: 'error', message: error.message ?? 'Unable to disable MFA.' });
                return;
            }

            setStatus({ tone: 'success', message: 'MFA disabled. Your account no longer requires a second factor.' });
            if (onDisabled) {
                onDisabled();
            }
        } catch {
            setStatus({ tone: 'error', message: 'We could not disable MFA. Please try again.' });
        } finally {
            setIsDisabling(false);
        }
    }, [onDisabled, password, requirePassword]);

    return (
        <div className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ShieldOff className="h-4 w-4" />
                    Manage MFA
                </div>
                <p className="text-xs text-muted-foreground">
                    Use your password to regenerate backup codes or disable MFA on this account.
                </p>
            </div>

            <div className="mt-4 space-y-3">
                <Input
                    type="password"
                    name="mfa-management-password"
                    autoComplete="current-password"
                    placeholder="Confirm your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerateBackupCodes}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating...
                            </span>
                        ) : (
                            'Regenerate backup codes'
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDisableMfa}
                        disabled={isDisabling}
                    >
                        {isDisabling ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Disabling...
                            </span>
                        ) : (
                            'Disable MFA'
                        )}
                    </Button>
                </div>
            </div>

            {backupCodes.length > 0 ? (
                <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
                        <span>New backup codes</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => handleCopy(backupCodes.join('\n'), 'backup codes')}
                        >
                            <Copy className="h-3.5 w-3.5" />
                            Copy all
                        </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {backupCodes.map((backupCode) => (
                            <div
                                key={backupCode}
                                className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs font-mono text-foreground"
                            >
                                {backupCode}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {status ? (
                <Alert className="mt-4" variant={status.tone === 'error' ? 'destructive' : 'default'}>
                    <ShieldOff className="h-4 w-4" />
                    <AlertTitle>
                        {status.tone === 'error' ? 'Action needed' : status.tone === 'success' ? 'Updated' : 'Note'}
                    </AlertTitle>
                    <AlertDescription>{status.message}</AlertDescription>
                </Alert>
            ) : null}
        </div>
    );
}
