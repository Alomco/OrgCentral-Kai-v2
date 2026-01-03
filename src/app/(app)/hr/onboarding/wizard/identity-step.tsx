'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { FieldError } from '../../_components/field-error';
import type { OnboardingWizardValues } from './wizard.schema';
import type { FieldErrors } from '../../_components/form-errors';

export interface IdentityStepProps {
    values: OnboardingWizardValues;
    fieldErrors?: FieldErrors<OnboardingWizardValues>;
    onValuesChange: (updates: Partial<OnboardingWizardValues>) => void;
    onEmailCheck?: (email: string) => Promise<{ exists: boolean; reason?: string }>;
    disabled?: boolean;
}

type EmailCheckStatus = 'idle' | 'checking' | 'valid' | 'invalid';

export function IdentityStep({
    values,
    fieldErrors,
    onValuesChange,
    onEmailCheck,
    disabled = false,
}: IdentityStepProps) {
    const [emailCheckStatus, setEmailCheckStatus] = useState<EmailCheckStatus>('idle');
    const [emailCheckMessage, setEmailCheckMessage] = useState<string | null>(null);
    const previousEmailReference = useRef<string | undefined>(undefined);

    const emailError = fieldErrors?.email;
    const displayNameError = fieldErrors?.displayName;
    const employeeNumberError = fieldErrors?.employeeNumber;

    // Debounced email check using timeout in effect
    // All setState calls must be inside the setTimeout callback to avoid synchronous updates
    useEffect(() => {
        const abortController = new AbortController();

        const timeoutId = setTimeout(() => {
            if (abortController.signal.aborted) {return;}

            // Skip if no check function or email too short
            if (!onEmailCheck || !values.email || values.email.length < 3) {
                if (previousEmailReference.current !== values.email) {
                    previousEmailReference.current = values.email;
                    setEmailCheckStatus('idle');
                    setEmailCheckMessage(null);
                }
                return;
            }

            // Simple email validation before checking
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(values.email)) {
                previousEmailReference.current = values.email;
                setEmailCheckStatus('idle');
                setEmailCheckMessage(null);
                return;
            }

            previousEmailReference.current = values.email;
            setEmailCheckStatus('checking');

            onEmailCheck(values.email)
                .then((result) => {
                    if (abortController.signal.aborted) {return;}
                    if (result.exists) {
                        setEmailCheckStatus('invalid');
                        setEmailCheckMessage(result.reason ?? 'This email is already in use.');
                    } else {
                        setEmailCheckStatus('valid');
                        setEmailCheckMessage(null);
                    }
                })
                .catch(() => {
                    if (abortController.signal.aborted) {return;}
                    setEmailCheckStatus('idle');
                    setEmailCheckMessage(null);
                });
        }, 100); // Small delay ensures all state updates happen asynchronously

        return () => {
            clearTimeout(timeoutId);
            abortController.abort();
        };
    }, [values.email, onEmailCheck]);

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h3 className="text-lg font-semibold">Employee Identity</h3>
                <p className="text-sm text-muted-foreground">
                    Enter the basic information for the new employee. An invitation will be sent to their email.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="wizard-email">Email address *</Label>
                    <div className="relative">
                        <Input
                            id="wizard-email"
                            type="email"
                            autoComplete="email"
                            value={values.email}
                            onChange={(event) => onValuesChange({ email: event.target.value })}
                            aria-invalid={Boolean(emailError) || emailCheckStatus === 'invalid'}
                            aria-describedby={emailError ? 'wizard-email-error' : undefined}
                            disabled={disabled}
                            className="pr-10"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {emailCheckStatus === 'checking' && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {emailCheckStatus === 'valid' && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            {emailCheckStatus === 'invalid' && (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                        </div>
                    </div>
                    <FieldError id="wizard-email-error" message={emailError} />
                    {emailCheckStatus === 'invalid' && emailCheckMessage ? (
                        <Alert variant="destructive" className="py-2">
                            <AlertDescription className="text-sm">{emailCheckMessage}</AlertDescription>
                        </Alert>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="wizard-displayName">Display name *</Label>
                    <Input
                        id="wizard-displayName"
                        type="text"
                        autoComplete="name"
                        value={values.displayName}
                        onChange={(event) => onValuesChange({ displayName: event.target.value })}
                        aria-invalid={Boolean(displayNameError)}
                        aria-describedby={displayNameError ? 'wizard-displayName-error' : undefined}
                        disabled={disabled}
                        placeholder="John Smith"
                    />
                    <FieldError id="wizard-displayName-error" message={displayNameError} />
                </div>

                <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="wizard-employeeNumber">Employee number *</Label>
                    <Input
                        id="wizard-employeeNumber"
                        type="text"
                        autoComplete="off"
                        value={values.employeeNumber}
                        onChange={(event) => onValuesChange({ employeeNumber: event.target.value })}
                        aria-invalid={Boolean(employeeNumberError)}
                        aria-describedby={employeeNumberError ? 'wizard-employeeNumber-error' : undefined}
                        disabled={disabled}
                        placeholder="EMP-001"
                        className="sm:max-w-xs"
                    />
                    <FieldError id="wizard-employeeNumber-error" message={employeeNumberError} />
                    <p className="text-xs text-muted-foreground">
                        A unique identifier for this employee within your organization.
                    </p>
                </div>
            </div>
        </div>
    );
}
