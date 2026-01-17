"use client";

import QRCode from 'react-qr-code';
import { Copy, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const OTP_LENGTH = 6;

interface SetupData {
    totpURI: string;
    backupCodes: string[];
}

interface TwoFactorSetupStepsProps {
    setupData: SetupData;
    code: string;
    onCodeChange: (value: string) => void;
    trustDevice: boolean;
    onTrustDeviceChange: (value: boolean) => void;
    isCodeComplete: boolean;
    isVerifying: boolean;
    onVerify: () => void;
    onCopy: (value: string, label: string) => void;
}

function extractSecretFromTotpUri(totpURI: string): string | null {
    try {
        const parsed = new URL(totpURI);
        return parsed.searchParams.get('secret');
    } catch {
        return null;
    }
}

export function TwoFactorSetupSteps({
    setupData,
    code,
    onCodeChange,
    trustDevice,
    onTrustDeviceChange,
    isCodeComplete,
    isVerifying,
    onVerify,
    onCopy,
}: TwoFactorSetupStepsProps) {
    const manualSecret = extractSecretFromTotpUri(setupData.totpURI);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Scan with your authenticator app</p>
                        <p className="text-xs text-muted-foreground">
                            Use Google Authenticator, Authy, 1Password, or another TOTP app.
                        </p>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                        <QRCode value={setupData.totpURI} size={148} />
                    </div>
                </div>
                {manualSecret ? (
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
                            <span>Manual entry key</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() => onCopy(manualSecret, 'secret key')}
                            >
                                <Copy className="h-3.5 w-3.5" />
                                Copy
                            </Button>
                        </div>
                        <div className="rounded-lg bg-muted/40 px-3 py-2 font-mono text-xs text-foreground">
                            {manualSecret}
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Verify the 6-digit code</p>
                    <InputOTP
                        value={code}
                        onChange={onCodeChange}
                        maxLength={OTP_LENGTH}
                        containerClassName="w-full justify-center"
                        className="justify-center"
                        aria-label="Multi-factor authentication code"
                    >
                        <InputOTPGroup>
                            {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                                <InputOTPSlot key={index} index={index} />
                            ))}
                        </InputOTPGroup>
                    </InputOTP>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                            id="trust-device"
                            checked={trustDevice}
                            onCheckedChange={(checked) => onTrustDeviceChange(Boolean(checked))}
                        />
                        Trust this device for 30 days
                    </label>
                    <Button
                        type="button"
                        className="w-full"
                        onClick={onVerify}
                        disabled={!isCodeComplete || isVerifying}
                    >
                        {isVerifying ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Verifying...
                            </span>
                        ) : (
                            'Verify and enable'
                        )}
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Backup codes</p>
                        <p className="text-xs text-muted-foreground">
                            Save these codes somewhere safe. Each code can be used once.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => onCopy(setupData.backupCodes.join('\n'), 'backup codes')}
                    >
                        <Copy className="h-3.5 w-3.5" />
                        Copy all
                    </Button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {setupData.backupCodes.map((backupCode) => (
                        <div
                            key={backupCode}
                            className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs font-mono text-foreground"
                        >
                            {backupCode}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
