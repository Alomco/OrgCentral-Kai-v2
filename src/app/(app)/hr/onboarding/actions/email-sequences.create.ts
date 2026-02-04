import { z } from 'zod';
import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { createEmailSequenceTemplate } from '@/server/use-cases/hr/onboarding/email-sequences/create-email-sequence-template';
import { buildEmailSequenceDependencies } from '@/server/use-cases/hr/onboarding/email-sequences/sequence-repository-dependencies';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_EMAIL_SEQUENCES } from '@/server/repositories/cache-scopes';
import type { JsonValue } from '@/server/types/json';

const emailSequenceSchema = z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(240).optional(),
    trigger: z.enum(['ONBOARDING_INVITE', 'ONBOARDING_ACCEPTED', 'OFFBOARDING_STARTED']),
    steps: z.string().trim().min(2),
});

export async function createEmailSequenceTemplateAction(formData: FormData) {
    const parsed = emailSequenceSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        trigger: formData.get('trigger'),
        steps: formData.get('steps'),
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid email sequence input.' } as const;
    }

    const steps = parseJsonValue(parsed.data.steps);
    if (!steps) {
        return { status: 'error', message: 'Email steps must be valid JSON.' } as const;
    }

    const headerStore = await headers();
    const session = await getSessionContext({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:onboarding:email-sequence:create',
    });

    await createEmailSequenceTemplate(
        { templateRepository: buildEmailSequenceDependencies().templateRepository },
        {
            authorization: session.authorization,
            name: parsed.data.name,
            description: parsed.data.description ?? null,
            trigger: parsed.data.trigger,
            steps,
            isActive: true,
        },
    );

    await invalidateOrgCache(
        session.authorization.orgId,
        CACHE_SCOPE_ONBOARDING_EMAIL_SEQUENCES,
        session.authorization.dataClassification,
        session.authorization.dataResidency,
    );

    return { status: 'success', message: 'Email sequence created.' } as const;
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
