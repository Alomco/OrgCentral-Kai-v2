'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { KeyRound, LockKeyhole } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TwoFactorPasswordSetupPanel, type PasswordSetupStatus } from '@/components/auth/TwoFactorPasswordSetupPanel';
import { fetchPasswordStatus, passwordKeys, setPassword, type PasswordStatusResponse } from '../password.api';

const PASSWORD_MIN_LENGTH = 12;
const EMPTY_PROVIDERS: string[] = [];

export function PasswordManagementPanel() {
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<PasswordSetupStatus | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const { data, isLoading, isError, error } = useQuery({
        queryKey: passwordKeys.status(),
        queryFn: fetchPasswordStatus,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: true,
        refetchOnMount: 'always',
        retry: 1,
    });

    const mutation = useMutation({
        mutationFn: setPassword,
        onSuccess: () => {
            setStatus({ tone: 'success', message: 'Password saved. You can enable MFA next.' });
            queryClient.setQueryData<PasswordStatusResponse>(passwordKeys.status(), (previous) => {
                if (!previous) {
                    return { hasPassword: true, providers: [], message: undefined };
                }
                return { ...previous, hasPassword: true };
            });
            setNewPassword('');
            setConfirmPassword('');
        },
        onError: (mutationError) => {
            setStatus({
                tone: 'error',
                message: mutationError instanceof Error
                    ? mutationError.message
                    : 'Unable to set password. Please try again.',
            });
        },
        onSettled: async () => {
            await queryClient.invalidateQueries({ queryKey: passwordKeys.status() });
        },
    });

    const hasPassword = data?.hasPassword ?? true;
    const providers = data?.providers ?? EMPTY_PROVIDERS;
    const isSaving = mutation.isPending;

    const providerLabel = useMemo(() => {
        if (providers.length === 0) {
            return 'an external provider';
        }
        return providers.join(', ');
    }, [providers]);

    const queryErrorStatus = isError
        ? ({ tone: 'error', message: error.message } satisfies PasswordSetupStatus)
        : null;

    const handleSave = () => {
        setStatus(null);

        if (newPassword.trim().length < PASSWORD_MIN_LENGTH) {
            setStatus({
                tone: 'error',
                message: `Password must be at least ${String(PASSWORD_MIN_LENGTH)} characters.`,
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            setStatus({ tone: 'error', message: 'Passwords do not match.' });
            return;
        }

        mutation.mutate(newPassword.trim());
    };

    const activeStatus = status ?? queryErrorStatus;
    const showStatusAlert = Boolean(activeStatus && (hasPassword || isLoading));

    return (
        <Card className="glass-card h-fit self-start">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                    </span>
                    Password management
                </CardTitle>
                <CardDescription>
                    Keep a password on file for recovery and MFA setup. OAuth-only accounts must set a password first.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="rounded-xl border border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">
                        Checking your password status...
                    </div>
                ) : hasPassword ? (
                    <div className="space-y-3 rounded-xl border border-border/60 bg-card/50 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <KeyRound className="h-4 w-4" />
                            Password set
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Manage password resets through your primary sign-in method. If you use {providerLabel},
                            update your password with that provider.
                        </p>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/login">Go to sign-in</Link>
                        </Button>
                    </div>
                ) : (
                    <TwoFactorPasswordSetupPanel
                        providers={providers}
                        password={newPassword}
                        confirmPassword={confirmPassword}
                        onPasswordChange={setNewPassword}
                        onConfirmPasswordChange={setConfirmPassword}
                        onSubmit={handleSave}
                        isSubmitting={isSaving}
                        status={status}
                    />
                )}

                {showStatusAlert && activeStatus ? (
                    <Alert variant={activeStatus.tone === 'error' ? 'destructive' : 'default'}>
                        <AlertTitle>{activeStatus.tone === 'error' ? 'Action needed' : 'Update'}</AlertTitle>
                        <AlertDescription>{activeStatus.message}</AlertDescription>
                    </Alert>
                ) : null}
            </CardContent>
        </Card>
    );
}
