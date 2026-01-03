'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { PrismaAbsenceTypeConfigRepository } from '@/server/repositories/prisma/hr/absences';
import { createAbsenceTypeConfig } from '@/server/use-cases/hr/absences/create-absence-type-config';
import { updateAbsenceTypeConfig } from '@/server/use-cases/hr/absences/update-absence-type-config';

import { toFieldErrors } from '../_components/form-errors';

const keySchema = z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Key must be lower-case kebab-case.')
    .max(64);

const createAbsenceTypeSchema = z.object({
    label: z.string().trim().min(2, 'Label is required.').max(120),
    key: keySchema.optional(),
    tracksBalance: z.boolean(),
    isActive: z.boolean(),
});

const updateAbsenceTypeSchema = z.object({
    typeId: z.uuid(),
    label: z.string().trim().min(2, 'Label is required.').max(120),
    tracksBalance: z.boolean(),
    isActive: z.boolean(),
});

export interface AbsenceTypeCreateValues {
    label: string;
    key: string;
    tracksBalance: boolean;
    isActive: boolean;
}

export interface AbsenceTypeCreateState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: Partial<Record<keyof AbsenceTypeCreateValues, string>>;
    values: AbsenceTypeCreateValues;
}

export interface AbsenceTypeInlineState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

const defaultCreateValues: AbsenceTypeCreateValues = {
    label: '',
    key: '',
    tracksBalance: true,
    isActive: true,
};

function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

function readFormBoolean(formData: FormData, key: string, fallback: boolean): boolean {
    const value = formData.get(key);
    if (typeof value === 'string') {
        return value === 'on';
    }
    return fallback;
}

const typeConfigRepository = new PrismaAbsenceTypeConfigRepository();

export async function createAbsenceTypeAction(
    previous: AbsenceTypeCreateState,
    formData: FormData,
): Promise<AbsenceTypeCreateState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'ui:hr:absence-types:create',
            },
        );
    } catch {
        return {
            status: 'error',
            message: 'Not authorized to manage absence types.',
            values: previous.values,
        };
    }

    const rawKey = readFormString(formData, 'key').trim();
    const candidate = {
        label: readFormString(formData, 'label'),
        key: rawKey.length > 0 ? rawKey : undefined,
        tracksBalance: readFormBoolean(formData, 'tracksBalance', true),
        isActive: readFormBoolean(formData, 'isActive', true),
    };

    const parsed = createAbsenceTypeSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: 'Check the highlighted fields and try again.',
            fieldErrors: toFieldErrors(parsed.error),
            values: {
                label: candidate.label,
                key: rawKey,
                tracksBalance: candidate.tracksBalance,
                isActive: candidate.isActive,
            },
        };
    }

    try {
        await createAbsenceTypeConfig(
            { typeConfigRepository },
            {
                authorization: session.authorization,
                payload: parsed.data,
            },
        );

        revalidatePath('/hr/settings');
        revalidatePath('/hr/absences');

        return {
            status: 'success',
            message: 'Absence type created.',
            values: defaultCreateValues,
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to create absence type.',
            values: {
                label: candidate.label,
                key: rawKey,
                tracksBalance: candidate.tracksBalance,
                isActive: candidate.isActive,
            },
        };
    }
}

export async function updateAbsenceTypeAction(
    _previous: AbsenceTypeInlineState,
    formData: FormData,
): Promise<AbsenceTypeInlineState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'ui:hr:absence-types:update',
            },
        );
    } catch {
        return {
            status: 'error',
            message: 'Not authorized to manage absence types.',
        };
    }

    const candidate = {
        typeId: readFormString(formData, 'typeId'),
        label: readFormString(formData, 'label'),
        tracksBalance: readFormBoolean(formData, 'tracksBalance', true),
        isActive: readFormBoolean(formData, 'isActive', true),
    };

    const parsed = updateAbsenceTypeSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: 'Check the highlighted fields and try again.',
        };
    }

    try {
        await updateAbsenceTypeConfig(
            { typeConfigRepository },
            {
                authorization: session.authorization,
                payload: parsed.data,
            },
        );

        revalidatePath('/hr/settings');
        revalidatePath('/hr/absences');

        return {
            status: 'success',
            message: 'Absence type updated.',
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to update absence type.',
        };
    }
}
