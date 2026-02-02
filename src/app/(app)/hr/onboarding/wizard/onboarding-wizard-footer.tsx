import { ArrowLeft, ArrowRight, Loader2, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';

interface OnboardingWizardFooterProps {
    isSubmitting: boolean;
    isFirstStep: boolean;
    isLastStep: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onSubmit: () => void;
}

export function OnboardingWizardFooter({
    isSubmitting,
    isFirstStep,
    isLastStep,
    onPrevious,
    onNext,
    onSubmit,
}: OnboardingWizardFooterProps) {
    return (
        <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                disabled={isFirstStep || isSubmitting}
                className="w-full sm:w-auto"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            {isLastStep ? (
                <Button type="button" onClick={onSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
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
                <Button type="button" onClick={onNext} disabled={isSubmitting} className="w-full sm:w-auto">
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
        </CardFooter>
    );
}
