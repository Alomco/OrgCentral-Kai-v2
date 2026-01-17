"use client";

import { Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface PasswordSetupStatus {
    tone: 'info' | 'error' | 'success';
    message: string;
}

interface TwoFactorPasswordSetupPanelProps {
    providers: string[];
    password: string;
    confirmPassword: string;
    onPasswordChange: (value: string) => void;
    onConfirmPasswordChange: (value: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    status: PasswordSetupStatus | null;
}

export function TwoFactorPasswordSetupPanel({
    providers,
    password,
    confirmPassword,
    onPasswordChange,
    onConfirmPasswordChange,
    onSubmit,
    isSubmitting,
    status,
}: TwoFactorPasswordSetupPanelProps) {
    const providerList = providers.length > 0 ? providers.join(', ') : 'an OAuth provider';

    return (
        <div className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    Set a password first
                </div>
                <p className="text-xs text-muted-foreground">
                    You signed in using {providerList}. Set a password before enabling MFA.
                </p>
                <p className="text-xs text-muted-foreground">
                    Passwords must be at least 12 characters.
                </p>
            </div>

            <div className="mt-4 space-y-3">
                <Input
                    type="password"
                    name="new-password"
                    autoComplete="new-password"
                    placeholder="Create a new password"
                    value={password}
                    onChange={(event) => onPasswordChange(event.target.value)}
                />
                <Input
                    type="password"
                    name="confirm-password"
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(event) => onConfirmPasswordChange(event.target.value)}
                />
                <Button
                    type="button"
                    className="w-full"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving password...
                        </span>
                    ) : (
                        'Save password'
                    )}
                </Button>
            </div>

            {status ? (
                <Alert className="mt-4" variant={status.tone === 'error' ? 'destructive' : 'default'}>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>
                        {status.tone === 'error' ? 'Action needed' : status.tone === 'success' ? 'Password saved' : 'Note'}
                    </AlertTitle>
                    <AlertDescription>{status.message}</AlertDescription>
                </Alert>
            ) : null}
        </div>
    );
}
