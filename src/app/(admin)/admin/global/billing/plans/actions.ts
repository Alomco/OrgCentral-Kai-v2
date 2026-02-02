'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import {
    createBillingPlanService,
    updateBillingPlanService,
    assignBillingPlanService,
} from '@/server/services/platform/admin/billing-plan-service';
import { parseBillingPlanAssign, parseBillingPlanCreate, parseBillingPlanUpdate } from '@/server/validators/platform/admin/billing-plan-validators';
import { invalidateCache } from '@/server/lib/cache-tags';
import { ValidationError } from '@/server/errors';

export interface BillingPlanActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

const INITIAL_STATE: BillingPlanActionState = { status: 'idle' };
const BILLING_PLANS_SCOPE = 'platform:billing-plans';
const BILLING_PLANS_PATH = '/admin/global/billing/plans';

export async function createBillingPlanAction(
    _state: BillingPlanActionState = INITIAL_STATE,
    formData: FormData,
): Promise<BillingPlanActionState> {
    void _state;
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformBillingPlans: ['create'] },
            auditSource: 'ui:admin:billing-plans:create',
        },
    );

    try {
        const payload = parseBillingPlanCreate({
            name: readFormString(formData, 'name'),
            description: readFormString(formData, 'description'),
            stripePriceId: readFormString(formData, 'stripePriceId'),
            currency: readFormString(formData, 'currency') || 'gbp',
            amountCents: readFormNumber(formData, 'amountCents', 0),
            cadence: readFormString(formData, 'cadence') || 'monthly',
            features: parseCommaList(readFormString(formData, 'features')),
            limits: {},
            status: readFormString(formData, 'status') || 'DRAFT',
            effectiveFrom: readFormString(formData, 'effectiveFrom') || new Date().toISOString(),
        });

        await createBillingPlanService(authorization, payload);

        await invalidateCache({
            orgId: authorization.orgId,
            scope: BILLING_PLANS_SCOPE,
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });

        revalidatePath(BILLING_PLANS_PATH);
        return { status: 'success', message: 'Billing plan created.' };
    } catch (error) {
        const message = error instanceof ValidationError ? error.message : 'Unable to create billing plan.';
        return { status: 'error', message };
    }
}

export async function updateBillingPlanAction(
    _state: BillingPlanActionState = INITIAL_STATE,
    formData: FormData,
): Promise<BillingPlanActionState> {
    void _state;
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformBillingPlans: ['update'] },
            auditSource: 'ui:admin:billing-plans:update',
        },
    );

    try {
        const payload = parseBillingPlanUpdate({
            id: readFormString(formData, 'planId'),
            status: readFormString(formData, 'status') || 'ACTIVE',
        });

        await updateBillingPlanService(authorization, payload);

        await invalidateCache({
            orgId: authorization.orgId,
            scope: BILLING_PLANS_SCOPE,
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });

        revalidatePath(BILLING_PLANS_PATH);
        return { status: 'success', message: 'Billing plan updated.' };
    } catch (error) {
        const message = error instanceof ValidationError ? error.message : 'Unable to update billing plan.';
        return { status: 'error', message };
    }
}

export async function assignBillingPlanAction(
    _state: BillingPlanActionState = INITIAL_STATE,
    formData: FormData,
): Promise<BillingPlanActionState> {
    void _state;
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformBillingPlans: ['assign'] },
            auditSource: 'ui:admin:billing-plans:assign',
        },
    );

    try {
        const effectiveFromValue = readFormString(formData, 'effectiveFrom');
        const prorationBehaviorValue = readFormString(formData, 'prorationBehavior');
        const payload = parseBillingPlanAssign({
            tenantId: readFormString(formData, 'tenantId'),
            planId: readFormString(formData, 'planId'),
            ...(effectiveFromValue ? { effectiveFrom: effectiveFromValue } : {}),
            ...(prorationBehaviorValue ? { prorationBehavior: prorationBehaviorValue } : {}),
        });

        await assignBillingPlanService(authorization, payload);

        await invalidateCache({
            orgId: authorization.orgId,
            scope: 'platform:billing-assignments',
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });

        revalidatePath(BILLING_PLANS_PATH);
        return { status: 'success', message: 'Billing plan assigned.' };
    } catch (error) {
        const message = error instanceof ValidationError ? error.message : 'Unable to assign billing plan.';
        return { status: 'error', message };
    }
}

function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value.trim() : '';
}

function readFormNumber(formData: FormData, key: string, fallback: number): number {
    const raw = readFormString(formData, key);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCommaList(value: string): string[] {
    if (!value) {
        return [];
    }
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
