'use server';

import { headers } from 'next/headers';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import { PrismaHRSettingsRepository } from '@/server/repositories/prisma/hr/settings';
import { updateHrSettings } from '@/server/use-cases/hr/settings/update-hr-settings';
import { invalidateHrSettingsCacheTag } from '@/server/use-cases/hr/settings/cache-helpers';

import { toFieldErrors } from '../_components/form-errors';
import { hrSettingsFormValuesSchema } from './schema';
import type { HrSettingsFormState } from './form-state';

const FIELD_CHECK_MESSAGE = 'Check the highlighted fields and try again.';

function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

const adminNotesSchema = z.string().trim().max(500);
const approvalWorkflowsJsonSchema = z.string().trim().max(8000);

function parseApprovalWorkflowsJson(raw: string): Prisma.JsonValue {
    const trimmed = raw.trim();
    if (!trimmed) {
        return {};
    }

    const value = JSON.parse(trimmed) as Prisma.JsonValue;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Approval workflows must be a JSON object.');
    }
    return value;
}

const hrSettingsRepository = new PrismaHRSettingsRepository();

export async function updateHrSettingsAction(
    previous: HrSettingsFormState,
    formData: FormData,
): Promise<HrSettingsFormState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();

        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'ui:hr-settings:update',
                action: HR_ACTION.UPDATE,
                resourceType: HR_RESOURCE.HR_SETTINGS,
                resourceAttributes: { scope: 'global' },
            },
        );
    } catch {
        return {
            status: 'error',
            message: 'Not authorized to update HR settings.',
            values: previous.values,
        };
    }

    const candidate = {
        standardHoursPerDay: formData.get('standardHoursPerDay'),
        standardDaysPerWeek: formData.get('standardDaysPerWeek'),
        enableOvertime: formData.get('enableOvertime') === 'on',
        adminNotes: readFormString(formData, 'adminNotes'),
        approvalWorkflowsJson: readFormString(formData, 'approvalWorkflowsJson'),
    };

    const parsed = hrSettingsFormValuesSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: FIELD_CHECK_MESSAGE,
            fieldErrors: toFieldErrors(parsed.error),
            values: previous.values,
        };
    }

    try {
        const adminNotesParsed = adminNotesSchema.safeParse(parsed.data.adminNotes);
        if (!adminNotesParsed.success) {
            return {
                status: 'error',
                message: FIELD_CHECK_MESSAGE,
                fieldErrors: {
                    adminNotes: 'Admin notes must be 500 characters or fewer.',
                },
                values: parsed.data,
            };
        }

        const adminNotes = adminNotesParsed.data;

        const approvalWorkflowsJsonParsed = approvalWorkflowsJsonSchema.safeParse(parsed.data.approvalWorkflowsJson);
        if (!approvalWorkflowsJsonParsed.success) {
            return {
                status: 'error',
                message: FIELD_CHECK_MESSAGE,
                fieldErrors: {
                    approvalWorkflowsJson: 'Approval workflows JSON must be 8000 characters or fewer.',
                },
                values: parsed.data,
            };
        }

        let approvalWorkflows: Prisma.JsonValue = {};
        try {
            approvalWorkflows = parseApprovalWorkflowsJson(approvalWorkflowsJsonParsed.data);
        } catch (error) {
            return {
                status: 'error',
                message: FIELD_CHECK_MESSAGE,
                fieldErrors: {
                    approvalWorkflowsJson:
                        error instanceof Error ? error.message : 'Approval workflows must be valid JSON.',
                },
                values: parsed.data,
            };
        }

        await updateHrSettings(
            { hrSettingsRepository },
            {
                authorization: session.authorization,
                payload: {
                    orgId: session.authorization.orgId,
                    workingHours: {
                        standardHoursPerDay: parsed.data.standardHoursPerDay,
                        standardDaysPerWeek: parsed.data.standardDaysPerWeek,
                    },
                    overtimePolicy: {
                        enableOvertime: parsed.data.enableOvertime,
                    },
                    approvalWorkflows,
                    metadata: {
                        adminNotes: adminNotes.length > 0 ? adminNotes : null,
                    },
                },
            },
        );

        await invalidateHrSettingsCacheTag(session.authorization);

        return {
            status: 'success',
            message: 'Saved HR settings.',
            fieldErrors: undefined,
            values: {
                ...parsed.data,
                adminNotes,
                approvalWorkflowsJson: approvalWorkflowsJsonParsed.data.trim(),
            },
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to save HR settings.',
            fieldErrors: undefined,
            values: previous.values,
        };
    }
}
