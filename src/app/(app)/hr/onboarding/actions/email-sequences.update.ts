import { z } from 'zod';
import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { updateEmailSequenceTemplate } from '@/server/use-cases/hr/onboarding/email-sequences/update-email-sequence-template';
import { buildEmailSequenceDependencies } from '@/server/use-cases/hr/onboarding/email-sequences/sequence-repository-dependencies';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_EMAIL_SEQUENCES } from '@/server/repositories/cache-scopes';
import type { JsonValue } from '@/server/types/json';

const emailSequenceSchema = z.object({
    templateId: z.uuid(),
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(240).optional(),
    trigger: z.enum(['ONBOARDING_INVITE', 'ONBOARDING_ACCEPTED', 'OFFBOARDING_STARTED']),
    steps: z.string().trim().min(2),
    isActive: z.string().optional(),
});

interface ActionResponse {
    status: 'success' | 'error';
    message: string;
}

export async function updateEmailSequenceTemplateAction(formData: FormData): Promise<ActionResponse> {
    const parsed = emailSequenceSchema.safeParse({
        templateId: formData.get('templateId'),
        name: formData.get('name'),
        description: formData.get('description') ?? undefined,
        trigger: formData.get('trigger'),
        steps: formData.get('steps'),
        isActive: formData.get('isActive') ?? undefined,
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid email sequence input.' };
    }

    const steps = parseJsonValue(parsed.data.steps);
    if (!steps) {
        return { status: 'error', message: 'Email steps must be valid JSON.' };
    }

    const headerStore = await headers();
    const session = await getSessionContext({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:onboarding:email-sequence:update',
    });

    await updateEmailSequenceTemplate(
        { templateRepository: buildEmailSequenceDependencies().templateRepository },
        {
            authorization: session.authorization,
            templateId: parsed.data.templateId,
            updates: {
                name: parsed.data.name,
                description: parsed.data.description ?? null,
                trigger: parsed.data.trigger,
                steps,
                isActive: parseBoolean(parsed.data.isActive) ?? true,
            },
        },
    );

    await invalidateOrgCache(
        session.authorization.orgId,
        CACHE_SCOPE_ONBOARDING_EMAIL_SEQUENCES,
        session.authorization.dataClassification,
        session.authorization.dataResidency,
    );

    return { status: 'success', message: 'Email sequence updated.' };
}

function parseBoolean(value?: string): boolean | null {
    if (!value) {
        return null;
    }
    if (value === 'true' || value === 'on') {
        return true;
    }
    if (value === 'false' || value === 'off') {
        return false;
    }
    return null;
}

function parseJsonValue(raw: string): JsonValue | null {
    try {
        const parsed = JSON.parse(raw) as JsonValue;
        return isJsonValue(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function isJsonValue(value: JsonValue): value is JsonValue {
    if (value === null) {
        return true;
    }
    if (['string', 'number', 'boolean'].includes(typeof value)) {
        return true;
    }
    if (Array.isArray(value)) {
        return value.every((item) => isJsonValue(item));
    }
    if (typeof value === 'object') {
        return Object.values(value).every((item) => isJsonValue(item as JsonValue));
    }
    return false;
}
