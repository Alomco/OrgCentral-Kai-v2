"use client";

import Link from 'next/link';
import { CheckCircle2, KeyRound, Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TwoFactorSetupSteps } from '@/components/auth/TwoFactorSetupSteps';
import { TwoFactorManagementPanel } from '@/components/auth/TwoFactorManagementPanel';
import { TwoFactorPasswordSetupPanel } from '@/components/auth/TwoFactorPasswordSetupPanel';
import { useTwoFactorSetupState } from '@/components/auth/use-two-factor-setup';

export function TwoFactorSetupForm() {
    const {
        isMfaEnabled,
        requiresPasswordSetup,
        password,
        setPassword,
        setupData,
        code,
        setCode,
        trustDevice,
        setTrustDevice,
        isCodeComplete,
        status,
        passwordStatus,
        isGenerating,
        isVerifying,
        isVerified,
        isSettingPassword,
        providers,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        handleGenerate,
        handleVerify,
        handlePasswordSetup,
        handleCopy,
        handleDisabled,
    } = useTwoFactorSetupState();

    if (isMfaEnabled && !setupData && !isVerified) {
        return (
            <div className="space-y-4">
                <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>MFA already enabled</AlertTitle>
                    <AlertDescription>
                        Your account is already protected with multi-factor authentication. If you need new backup codes,
                        contact support or an administrator.
                    </AlertDescription>
                </Alert>
                <Button asChild variant="outline">
                    <Link href="/hr/profile">Back to profile</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {requiresPasswordSetup ? (
                <TwoFactorPasswordSetupPanel
                    providers={providers}
                    password={newPassword}
                    confirmPassword={confirmPassword}
                    onPasswordChange={setNewPassword}
                    onConfirmPasswordChange={setConfirmPassword}
                    onSubmit={handlePasswordSetup}
                    isSubmitting={isSettingPassword}
                    status={passwordStatus}
                />
            ) : null}

            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <KeyRound className="h-4 w-4" />
                    Verify your password to begin
                </div>
                <Input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
                <Button
                    type="button"
                    className="mt-2 w-full"
                    onClick={handleGenerate}
                    disabled={isGenerating || requiresPasswordSetup}
                >
                    {isGenerating ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating setup...
                        </span>
                    ) : (
                        'Generate MFA setup'
                    )}
                </Button>
            </div>

            {setupData ? (
                <TwoFactorSetupSteps
                    setupData={setupData}
                    code={code}
                    onCodeChange={setCode}
                    trustDevice={trustDevice}
                    onTrustDeviceChange={setTrustDevice}
                    isCodeComplete={isCodeComplete}
                    isVerifying={isVerifying}
                    onVerify={handleVerify}
                    onCopy={handleCopy}
                />
            ) : null}

            {isVerified ? (
                <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-4 text-sm text-emerald-900">
                    <div className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        MFA enabled successfully
                    </div>
                    <p className="mt-2 text-xs text-emerald-700">
                        Keep your backup codes safe and use them if you lose access to your authenticator app.
                    </p>
                </div>
            ) : null}

            {status ? (
                <Alert variant={status.tone === 'error' ? 'destructive' : 'default'}>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>
                        {status.tone === 'error' ? 'Action needed' : status.tone === 'success' ? 'Success' : 'Next step'}
                    </AlertTitle>
                    <AlertDescription>{status.message}</AlertDescription>
                </Alert>
            ) : null}

            {(isMfaEnabled || isVerified) ? (
                <TwoFactorManagementPanel onDisabled={handleDisabled} />
            ) : null}

            <Button asChild variant="outline" className="w-full">
                <Link href="/hr/profile">Back to profile</Link>
            </Button>
        </div>
    );
}
