'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { PrismaAbacPolicyRepository } from '@/server/repositories/prisma/org/abac/prisma-abac-policy-repository';
import { setAbacPolicies } from '@/server/use-cases/org/abac/set-abac-policies';
import { abacPolicySchema } from '@/server/security/abac-policy-normalizer';

import { initialAbacPolicyEditorState, type AbacPolicyEditorState } from './actions.state';

const abacPoliciesSchema = z.array(abacPolicySchema);

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export async function updateAbacPoliciesAction(
    _previous: AbacPolicyEditorState = initialAbacPolicyEditorState,
    formData: FormData,
): Promise<AbacPolicyEditorState> {
    void _previous;

    const headerStore = await headers();

    const rawText = formData.get('policiesText');
    if (typeof rawText !== 'string' || rawText.trim().length === 0) {
        return { status: 'error', message: 'Policy JSON is required.' };
    }

    let parsedJson: JsonValue;
    try {
        parsedJson = JSON.parse(rawText) as JsonValue;
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? `Invalid JSON: ${error.message}` : 'Invalid JSON.',
        };
    }

    if (!Array.isArray(parsedJson)) {
        return { status: 'error', message: 'Policy payload must be a JSON array.' };
    }

    const parsedPolicies = abacPoliciesSchema.safeParse(parsedJson);
    if (!parsedPolicies.success) {
        const issue = parsedPolicies.error.issues.at(0);
        const path = issue && issue.path.length > 0 ? issue.path.join('.') : 'policy';
        const message = issue ? issue.message : 'Invalid policy payload.';
        return { status: 'error', message: `Invalid ${path}: ${message}` };
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:org-abac:update',
            action: 'org.abac.update',
            resourceType: 'org.abac.policy',
            resourceAttributes: { policyCount: parsedPolicies.data.length },
        },
    );

    try {
        await setAbacPolicies(
            { policyRepository: new PrismaAbacPolicyRepository() },
            { authorization, policies: parsedPolicies.data },
        );
        return {
            status: 'success',
            message: `Saved ${String(parsedPolicies.data.length)} policies.`,
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to update policies.',
        };
    }
}
