"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

import { authClient, useSession } from '@/lib/auth-client';
import type { PasswordSetupStatus } from '@/components/auth/TwoFactorPasswordSetupPanel';
import { normalizeOtp, resolveMfaEnabled, type PasswordStatusResponse, type StatusMessage, OTP_LENGTH } from '@/components/auth/two-factor-setup.utils';

interface TwoFactorSetupData {
    totpURI: string;
    backupCodes: string[];
}

export function useTwoFactorSetupState() {
    const { data: session } = useSession();
    const isMfaEnabled = resolveMfaEnabled(session);

    const [password, setPassword] = useState('');
    const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
    const [code, setCode] = useState('');
    const [trustDevice, setTrustDevice] = useState(true);
    const [status, setStatus] = useState<StatusMessage | null>(null);
    const [passwordStatus, setPasswordStatus] = useState<PasswordSetupStatus | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(true);
    const [hasPassword, setHasPassword] = useState(true);
    const [providers, setProviders] = useState<string[]>([]);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSettingPassword, setIsSettingPassword] = useState(false);

    const normalizedCode = useMemo(() => normalizeOtp(code), [code]);
    const isCodeComplete = normalizedCode.length === OTP_LENGTH;
    const requiresPasswordSetup = !isPasswordLoading && !hasPassword;

    useEffect(() => {
        let isMounted = true;
        const loadStatus = async () => {
            setIsPasswordLoading(true);
            try {
                const response = await fetch('/api/auth/password-status', { method: 'GET' });
                const data = await response.json() as PasswordStatusResponse;
                if (!isMounted) {
                    return;
                }
                if (!response.ok) {
                    setPasswordStatus({
                        tone: 'error',
                        message: data.message ?? 'Unable to check account providers.',
                    });
                    setHasPassword(true);
                    setProviders([]);
                    return;
                }
                setHasPassword(data.hasPassword);
                setProviders(Array.isArray(data.providers) ? data.providers : []);
            } catch {
                if (!isMounted) {
                    return;
                }
                setPasswordStatus({ tone: 'error', message: 'Unable to check account providers.' });
                setHasPassword(true);
                setProviders([]);
            } finally {
                if (isMounted) {
                    setIsPasswordLoading(false);
                }
            }
        };

        loadStatus().catch(() => undefined);
        return () => {
            isMounted = false;
        };
    }, []);

    const handleGenerate = useCallback(async () => {
        setStatus(null);

        if (requiresPasswordSetup) {
            setStatus({ tone: 'error', message: 'Set a password before enabling MFA.' });
            return;
        }

        if (!password.trim()) {
            setStatus({ tone: 'error', message: 'Enter your password to generate the authenticator setup.' });
            return;
        }

        setIsGenerating(true);
        try {
            const { data, error } = await authClient.twoFactor.enable({ password: password.trim() });
            if (error) {
                setStatus({ tone: 'error', message: error.message ?? 'Unable to generate MFA setup.' });
                return;
            }

            if (!data.totpURI || !Array.isArray(data.backupCodes)) {
                setStatus({ tone: 'error', message: 'Setup data was incomplete. Please try again.' });
                return;
            }

            setSetupData({
                totpURI: data.totpURI,
                backupCodes: data.backupCodes,
            });
            setIsVerified(false);
            setStatus({ tone: 'info', message: 'Scan the QR code and enter the 6-digit code to verify.' });
        } catch {
            setStatus({ tone: 'error', message: 'We could not generate the MFA setup. Please try again.' });
        } finally {
            setIsGenerating(false);
        }
    }, [password, requiresPasswordSetup]);

    const handlePasswordSetup = useCallback(async () => {
        setPasswordStatus(null);

        if (newPassword.trim().length < 12) {
            setPasswordStatus({ tone: 'error', message: 'Password must be at least 12 characters long.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordStatus({ tone: 'error', message: 'Passwords do not match.' });
            return;
        }

        setIsSettingPassword(true);
        try {
            const response = await fetch('/api/auth/set-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword: newPassword.trim() }),
            });
            const data = await response.json() as { message?: string };

            if (!response.ok) {
                setPasswordStatus({ tone: 'error', message: data.message ?? 'Unable to set password.' });
                return;
            }

            setHasPassword(true);
            setPassword(newPassword.trim());
            setPasswordStatus({ tone: 'success', message: 'Password saved. You can now enable MFA.' });
        } catch {
            setPasswordStatus({ tone: 'error', message: 'Unable to set password. Please try again.' });
        } finally {
            setIsSettingPassword(false);
        }
    }, [confirmPassword, newPassword]);

    const handleVerify = useCallback(async () => {
        setStatus(null);

        if (!isCodeComplete) {
            setStatus({ tone: 'error', message: 'Enter the 6-digit code from your authenticator app.' });
            return;
        }

        setIsVerifying(true);
        try {
            const { error } = await authClient.twoFactor.verifyTotp({
                code: normalizedCode,
                trustDevice,
            });

            if (error) {
                setStatus({ tone: 'error', message: error.message ?? 'Invalid verification code.' });
                return;
            }

            setIsVerified(true);
            setStatus({ tone: 'success', message: 'Multi-factor authentication is now enabled.' });
        } catch {
            setStatus({ tone: 'error', message: 'We could not verify that code. Please try again.' });
        } finally {
            setIsVerifying(false);
        }
    }, [isCodeComplete, normalizedCode, trustDevice]);

    const handleCopy = useCallback(async (value: string, label: string) => {
        setStatus(null);

        try {
            await navigator.clipboard.writeText(value);
            setStatus({ tone: 'success', message: `${label} copied to clipboard.` });
        } catch {
            setStatus({ tone: 'error', message: `Unable to copy ${label}. Please copy it manually.` });
        }
    }, []);

    const handleDisabled = useCallback(() => {
        setIsVerified(false);
        setSetupData(null);
        setCode('');
        setTrustDevice(true);
        window.location.reload();
    }, []);

    return {
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
    };
}
