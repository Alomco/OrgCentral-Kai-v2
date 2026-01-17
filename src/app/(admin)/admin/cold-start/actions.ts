'use server';

import { headers } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';
import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { assertOrgAccess } from '@/server/security/guards';
import { runColdStartSeedPlan } from '@/server/services/seeder/cold-start-plan';
import type {
    ColdStartSeedPlanInput,
    ColdStartSeedPlanResponse,
    SeedCategoryId,
    SeedCategorySelection,
} from '@/server/types/seeder/cold-start';
import {
    createEmptySeedSummaryCounts,
    SEED_CATEGORY_DEFINITIONS,
    SEED_CATEGORY_MAP,
} from '@/lib/seed/cold-start-plan';

const CATEGORY_ID_VALUES = SEED_CATEGORY_DEFINITIONS.map((category) => category.id) as [
    SeedCategoryId,
    ...SeedCategoryId[],
];
const CATEGORY_ID_SCHEMA = z.enum(CATEGORY_ID_VALUES);

const selectionSchema = z.object({
    id: CATEGORY_ID_SCHEMA,
    enabled: z.boolean(),
    dataset: z.enum(['minimal', 'full']),
    count: z.number().int().optional(),
});

const planSchema = z.object({
    platform: z.array(selectionSchema),
    demo: z.array(selectionSchema),
});

export async function runColdStartSeeder(plan: ColdStartSeedPlanInput): Promise<ColdStartSeedPlanResponse> {
    noStore();

    try {
        const payload = planSchema.parse(plan);
        const validationMessage = validateSelections(payload.platform, payload.demo);
        if (validationMessage) {
            return buildErrorResponse(validationMessage);
        }

        const headerStore = await headers();
        const { authorization } = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['read'] },
                auditSource: 'ui:admin:cold-start-seeder',
                action: 'seeder.cold-start.run',
                resourceType: 'seeder.cold-start',
            },
        );

        await assertOrgAccess({
            orgId: authorization.orgId,
            userId: authorization.userId,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'ui:admin:cold-start-seeder',
            action: 'seeder.cold-start.run',
            resourceType: 'seeder.cold-start',
            resourceAttributes: { orgId: authorization.orgId },
        });

        return await runColdStartSeedPlan(payload, { authorization });
    } catch (error) {
        return buildErrorResponse(error instanceof Error ? error.message : 'Unable to run cold start seeding.');
    }
}

function validateSelections(
    platformSelections: SeedCategorySelection[],
    demoSelections: SeedCategorySelection[],
): string | null {
    for (const selection of platformSelections) {
        const definition = SEED_CATEGORY_MAP[selection.id];
        if (definition.group !== 'platform') {
            return `Category ${definition.label} must be in the demo group.`;
        }
        const message = validateCount(selection);
        if (message) {
            return message;
        }
    }

    for (const selection of demoSelections) {
        const definition = SEED_CATEGORY_MAP[selection.id];
        if (definition.group !== 'demo') {
            return `Category ${definition.label} must be in the platform essentials group.`;
        }
        const message = validateCount(selection);
        if (message) {
            return message;
        }
    }

    return null;
}

function validateCount(selection: SeedCategorySelection): string | null {
    const definition = SEED_CATEGORY_MAP[selection.id];
    if (selection.count === undefined) {
        return null;
    }
    if (!definition.count) {
        return `Category ${definition.label} does not accept a count.`;
    }
    if (selection.count < definition.count.min || selection.count > definition.count.max) {
        return `Count for ${definition.label} must be between ${String(definition.count.min)} and ${String(definition.count.max)}.`;
    }
    return null;
}

function buildErrorResponse(message: string): ColdStartSeedPlanResponse {
    return {
        success: false,
        message,
        steps: [],
        summary: {
            totals: createEmptySeedSummaryCounts(),
            skipped: [],
        },
    };
}
