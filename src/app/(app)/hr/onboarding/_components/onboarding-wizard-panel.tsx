'use client';

import { useRouter } from 'next/navigation';

import { OnboardingWizard, type OnboardingWizardValues } from '../wizard';
import type { ChecklistTemplate } from '@/server/types/onboarding-types';
import type { Department } from '../wizard/job-step';
import { submitOnboardingWizardAction, checkEmailExistsAction } from '../actions';

export interface OnboardingWizardPanelProps {
    departments?: Department[];
    checklistTemplates?: ChecklistTemplate[];
    canManageTemplates?: boolean;
}

export function OnboardingWizardPanel({
    departments = [],
    checklistTemplates = [],
    canManageTemplates = false,
}: OnboardingWizardPanelProps) {
    const router = useRouter();

    const handleSubmit = async (values: OnboardingWizardValues) => {
        const result = await submitOnboardingWizardAction(values);
        return {
            success: result.success,
            token: result.token,
            error: result.error,
        };
    };

    const handleEmailCheck = async (email: string) => {
        return checkEmailExistsAction(email);
    };

    const handleCancel = () => {
        router.push('/hr/onboarding');
    };

    return (
        <OnboardingWizard
            departments={departments}
            checklistTemplates={checklistTemplates}
            canManageTemplates={canManageTemplates}
            onEmailCheck={handleEmailCheck}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        />
    );
}
