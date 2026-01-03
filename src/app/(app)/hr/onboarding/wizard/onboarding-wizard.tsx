'use client';

import { useCallback, useState, useTransition } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Send, X } from 'lucide-react';

import type { ZodError } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Stepper, useStepper, type StepperStep } from '@/components/ui/stepper';

import type { ChecklistTemplate } from '@/server/types/onboarding-types';
import { toFieldErrors } from '../../_components/form-errors';

import { IdentityStep } from './identity-step';
import { JobStep, type Department } from './job-step';
import { AssignmentsStep, type LeaveType } from './assignments-step';
import { ReviewStep } from './review-step';
import { validateWizardStep, type OnboardingWizardValues } from './wizard.schema';
import { buildInitialWizardState, mergeWizardValues, type OnboardingWizardState } from './wizard.state';

const WIZARD_STEPS: StepperStep[] = [
    { id: 'identity', title: 'Identity' },
    { id: 'job', title: 'Job & Comp' },
    { id: 'assignments', title: 'Assignments' },
    { id: 'review', title: 'Review' },
];

export interface OnboardingWizardProps {
    /** Initial form values */
    initialValues?: Partial<OnboardingWizardValues>;
    /** Available departments */
    departments?: Department[];
    /** Available leave types */
    leaveTypes?: LeaveType[];
    /** Available checklist templates */
    checklistTemplates?: ChecklistTemplate[];
    /** Whether the user can manage templates */
    canManageTemplates?: boolean;
    /** Email existence check function */
    onEmailCheck?: (email: string) => Promise<{ exists: boolean; reason?: string }>;
    /** Submit handler */
    onSubmit: (values: OnboardingWizardValues) => Promise<{ success: boolean; token?: string; error?: string }>;
    /** Cancel handler */
    onCancel?: () => void;
}

export function OnboardingWizard({
    initialValues,
    departments = [],
    leaveTypes,
    checklistTemplates = [],
    canManageTemplates = false,
    onEmailCheck,
    onSubmit,
    onCancel,
}: OnboardingWizardProps) {
    const [state, setState] = useState<OnboardingWizardState>(() =>
        buildInitialWizardState(initialValues),
    );
    const [isPending, startTransition] = useTransition();

    const stepper = useStepper({ totalSteps: WIZARD_STEPS.length });

    const handleValuesChange = useCallback((updates: Partial<OnboardingWizardValues>) => {
        setState((previous) => ({
            ...previous,
            values: mergeWizardValues(previous.values, updates),
            fieldErrors: undefined,
            message: undefined,
        }));
    }, []);

    const handleStepValidation = useCallback((): boolean => {
        const result = validateWizardStep(stepper.currentStep, state.values);
        if (!result.success) {
            setState((previous) => ({
                ...previous,
                status: 'error',
                fieldErrors: toFieldErrors(result.error as ZodError<OnboardingWizardValues>),
                message: 'Please correct the highlighted errors.',
            }));
            return false;
        }
        setState((previous) => ({
            ...previous,
            status: 'idle',
            fieldErrors: undefined,
            message: undefined,
        }));
        return true;
    }, [stepper.currentStep, state.values]);

    const handleNext = useCallback(() => {
        if (handleStepValidation()) {
            stepper.nextStep();
        }
    }, [handleStepValidation, stepper]);

    const handlePrevious = useCallback(() => {
        stepper.prevStep();
        setState((previous) => ({
            ...previous,
            status: 'idle',
            fieldErrors: undefined,
            message: undefined,
        }));
    }, [stepper]);

    const handleGoToStep = useCallback(
        (stepIndex: number) => {
            if (stepIndex < stepper.currentStep) {
                stepper.goToStep(stepIndex);
                setState((previous) => ({
                    ...previous,
                    status: 'idle',
                    fieldErrors: undefined,
                    message: undefined,
                }));
            }
        },
        [stepper],
    );

    const handleSubmit = useCallback(() => {
        if (!handleStepValidation()) {
            return;
        }

        setState((previous) => ({ ...previous, status: 'submitting' }));

        startTransition(async () => {
            try {
                const result = await onSubmit(state.values);
                if (result.success) {
                    setState((previous) => ({
                        ...previous,
                        status: 'success',
                        token: result.token,
                        message: 'Invitation sent successfully!',
                    }));
                } else {
                    setState((previous) => ({
                        ...previous,
                        status: 'error',
                        message: result.error ?? 'Failed to send invitation.',
                    }));
                }
            } catch (error) {
                setState((previous) => ({
                    ...previous,
                    status: 'error',
                    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
                }));
            }
        });
    }, [handleStepValidation, onSubmit, state.values]);

    const isSubmitting = state.status === 'submitting' || isPending;
    const isSuccess = state.status === 'success';

    // Success state
    if (isSuccess) {
        return (
            <Card>
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-xl font-semibold">Invitation Sent!</h2>
                    <p className="text-sm text-muted-foreground">
                        The onboarding invitation has been sent to {state.values.email}
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {state.token && (
                        <div className="rounded-lg border bg-muted/50 p-4">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                Invitation token (for manual sharing)
                            </p>
                            <code className="block break-all text-sm">{state.token}</code>
                        </div>
                    )}
                    <Alert>
                        <AlertTitle>Next steps</AlertTitle>
                        <AlertDescription>
                            The employee will receive an email with instructions to accept the invitation
                            and complete their profile setup.
                        </AlertDescription>
                    </Alert>
                </CardContent>
                <CardFooter className="justify-center">
                    <Button onClick={onCancel} variant="outline">
                        Close
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Onboard New Employee</h2>
                    {onCancel && (
                        <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Cancel">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <Stepper
                    steps={WIZARD_STEPS}
                    currentStep={stepper.currentStep}
                    onStepClick={handleGoToStep}
                />
            </CardHeader>

            <CardContent className="min-h-[400px]">
                {state.status === 'error' && state.message && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{state.message}</AlertDescription>
                    </Alert>
                )}

                {stepper.currentStep === 0 && (
                    <IdentityStep
                        values={state.values}
                        fieldErrors={state.fieldErrors}
                        onValuesChange={handleValuesChange}
                        onEmailCheck={onEmailCheck}
                        disabled={isSubmitting}
                    />
                )}

                {stepper.currentStep === 1 && (
                    <JobStep
                        values={state.values}
                        fieldErrors={state.fieldErrors}
                        onValuesChange={handleValuesChange}
                        departments={departments}
                        disabled={isSubmitting}
                    />
                )}

                {stepper.currentStep === 2 && (
                    <AssignmentsStep
                        values={state.values}
                        fieldErrors={state.fieldErrors}
                        onValuesChange={handleValuesChange}
                        leaveTypes={leaveTypes}
                        checklistTemplates={checklistTemplates}
                        canManageTemplates={canManageTemplates}
                        disabled={isSubmitting}
                    />
                )}

                {stepper.currentStep === 3 && (
                    <ReviewStep
                        values={state.values}
                        checklistTemplates={checklistTemplates}
                        onEditStep={handleGoToStep}
                    />
                )}
            </CardContent>

            <CardFooter className="flex justify-between">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={stepper.isFirstStep || isSubmitting}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                {stepper.isLastStep ? (
                    <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Send Invitation
                            </>
                        )}
                    </Button>
                ) : (
                    <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
