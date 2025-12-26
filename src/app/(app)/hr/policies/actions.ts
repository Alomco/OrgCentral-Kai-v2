'use server';

import { headers as nextHeaders } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { acknowledgeHrPolicyController } from '@/server/api-adapters/hr/policies/acknowledge-hr-policy';

import { buildInitialAcknowledgePolicyFormState, type AcknowledgePolicyFormState } from './form-state';
import { acknowledgePolicyFormValuesSchema } from './schema';

function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

export async function acknowledgePolicyAction(
    previous: AcknowledgePolicyFormState,
    formData: FormData,
): Promise<AcknowledgePolicyFormState> {
    const headerStore = await nextHeaders();

    const candidate = {
        policyId: readFormString(formData, 'policyId'),
        version: readFormString(formData, 'version'),
    };

    const parsed = acknowledgePolicyFormValuesSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: 'Invalid form data.',
            values: previous.values,
        };
    }

    try {
        await acknowledgeHrPolicyController({
            headers: headerStore,
            input: { policyId: parsed.data.policyId, version: parsed.data.version },
            auditSource: 'ui:hr:policies:acknowledge',
        });

        revalidatePath(`/hr/policies/${parsed.data.policyId}`);
        redirect(`/hr/policies/${parsed.data.policyId}`);
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to acknowledge policy.',
            values: buildInitialAcknowledgePolicyFormState(parsed.data).values,
        };
    }
}

