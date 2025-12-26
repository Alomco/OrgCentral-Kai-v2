'use server';

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getTrainingService } from '@/server/services/hr/training/training-service.provider';

import type { EnrollTrainingFormState } from './form-state';
import { enrollTrainingSchema } from './schema';

function formDataString(value: FormDataEntryValue | null): string {
    return typeof value === 'string' ? value : '';
}

export async function enrollTrainingAction(
    authorization: RepositoryAuthorizationContext,
    _previousState: EnrollTrainingFormState,
    formData: FormData,
): Promise<EnrollTrainingFormState> {
    const raw = {
        courseName: formData.get('courseName'),
        provider: formData.get('provider'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        expiryDate: formData.get('expiryDate'),
        cost: formData.get('cost'),
    };

    const parsed = enrollTrainingSchema.safeParse(raw);

    if (!parsed.success) {
        const fieldErrors: Partial<Record<keyof typeof raw, string>> = {};
        for (const issue of parsed.error.issues) {
            const field = issue.path[0] as keyof typeof raw;
            fieldErrors[field] ??= issue.message;
        }
        return {
            status: 'error',
            message: 'Please fix the errors below.',
            fieldErrors,
            values: {
                courseName: formDataString(raw.courseName),
                provider: formDataString(raw.provider),
                startDate: formDataString(raw.startDate),
                endDate: formDataString(raw.endDate),
                expiryDate: formDataString(raw.expiryDate),
                cost: Number(raw.cost ?? 0),
            },
        };
    }

    try {
        const service = getTrainingService();
        await service.enrollTraining({
            authorization,
            payload: {
                userId: authorization.userId,
                courseName: parsed.data.courseName,
                provider: parsed.data.provider,
                startDate: new Date(parsed.data.startDate),
                endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
                expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : undefined,
                cost: parsed.data.cost,
            },
        });

        return {
            status: 'success',
            message: 'Enrolled in training successfully.',
            values: {
                courseName: '',
                provider: '',
                startDate: new Date().toISOString().slice(0, 10),
                endDate: '',
                expiryDate: '',
                cost: 0,
            },
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to enroll in training.';
        return {
            status: 'error',
            message,
            values: parsed.data,
        };
    }
}
