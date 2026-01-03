'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepperStep {
    id: string;
    title: string;
    description?: string;
}

export interface StepperProps {
    steps: StepperStep[];
    currentStep: number;
    onStepClick?: (stepIndex: number) => void;
    className?: string;
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
    return (
        <nav aria-label="Progress" className={cn('w-full', className)}>
            <ol className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isClickable = onStepClick && index <= currentStep;

                    return (
                        <li key={step.id} className="relative flex-1">
                            {index > 0 && (
                                <div
                                    className={cn(
                                        'absolute left-0 top-4 -ml-px h-0.5 w-full -translate-x-1/2',
                                        isCompleted || isCurrent
                                            ? 'bg-primary'
                                            : 'bg-muted-foreground/25',
                                    )}
                                    aria-hidden="true"
                                />
                            )}
                            <div className="relative flex flex-col items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => isClickable && onStepClick?.(index)}
                                    disabled={!isClickable}
                                    className={cn(
                                        'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                                        isCompleted && 'bg-primary text-primary-foreground',
                                        isCurrent &&
                                        'border-2 border-primary bg-background text-primary',
                                        !isCompleted &&
                                        !isCurrent &&
                                        'border-2 border-muted-foreground/25 bg-background text-muted-foreground',
                                        isClickable && 'cursor-pointer hover:opacity-80',
                                        !isClickable && 'cursor-default',
                                    )}
                                    aria-current={isCurrent ? 'step' : undefined}
                                >
                                    {isCompleted ? (
                                        <Check className="h-4 w-4" aria-hidden="true" />
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </button>
                                <div className="text-center">
                                    <span
                                        className={cn(
                                            'text-xs font-medium',
                                            isCurrent
                                                ? 'text-primary'
                                                : isCompleted
                                                    ? 'text-foreground'
                                                    : 'text-muted-foreground',
                                        )}
                                    >
                                        {step.title}
                                    </span>
                                    {step.description ? (
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {step.description}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

export interface UseStepperOptions {
    totalSteps: number;
    initialStep?: number;
}

export interface UseStepperReturn {
    currentStep: number;
    isFirstStep: boolean;
    isLastStep: boolean;
    goToStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    reset: () => void;
}

export function useStepper({ totalSteps, initialStep = 0 }: UseStepperOptions): UseStepperReturn {
    const [currentStep, setCurrentStep] = React.useState(initialStep);

    const goToStep = React.useCallback(
        (step: number) => {
            if (step >= 0 && step < totalSteps) {
                setCurrentStep(step);
            }
        },
        [totalSteps],
    );

    const nextStep = React.useCallback(() => {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }, [totalSteps]);

    const prevStep = React.useCallback(() => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    }, []);

    const reset = React.useCallback(() => {
        setCurrentStep(initialStep);
    }, [initialStep]);

    return {
        currentStep,
        isFirstStep: currentStep === 0,
        isLastStep: currentStep === totalSteps - 1,
        goToStep,
        nextStep,
        prevStep,
        reset,
    };
}
