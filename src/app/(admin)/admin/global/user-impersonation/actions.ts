'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import {
    requestImpersonationService,
    approveImpersonationService,
    stopImpersonationService,
} from '@/server/services/platform/admin/impersonation-service';
import { requestBreakGlassService } from '@/server/services/platform/admin/break-glass-service';
import { invalidateCache } from '@/server/lib/cache-tags';
import { ValidationError } from '@/server/errors';

export interface ImpersonationActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

export interface ImpersonationBreakGlassState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    approvalId?: string;
}

const INITIAL_STATE: ImpersonationActionState = { status: 'idle' };
const BREAK_GLASS_STATE: ImpersonationBreakGlassState = { status: 'idle' };
const IMPERSONATION_SCOPE = 'platform:impersonation';
const IMPERSONATION_PATH = '/admin/global/user-impersonation';

export async function requestImpersonationBreakGlassAction(
    _state: ImpersonationBreakGlassState = BREAK_GLASS_STATE,
    formData: FormData,
): Promise<ImpersonationBreakGlassState> {
    void _state;
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformBreakGlass: ['request'] },
            auditSource: 'ui:admin:impersonation:break-glass',
        },
    );

    try {
        const targetOrgId = readFormString(formData, 'targetOrgId');
        const targetUserId = readFormString(formData, 'targetUserId');
        const result = await requestBreakGlassService(authorization, {
            scope: 'impersonation',
            reason: readFormString(formData, 'reason'),
            targetOrgId,
            action: 'impersonation.request',
            resourceId: targetUserId,
            expiresInMinutes: readFormNumber(formData, 'expiresInMinutes', 30),
        });

        await invalidateCache({
            orgId: authorization.orgId,
            scope: 'platform:break-glass',
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });

        revalidatePath(IMPERSONATION_PATH);
        return { status: 'success', message: 'Break-glass approval requested.', approvalId: result.id };
    } catch (error) {
        const message = error instanceof ValidationError ? error.message : 'Unable to request break-glass approval.';
        return { status: 'error', message };
    }
}

export async function requestImpersonationAction(
    _state: ImpersonationActionState = INITIAL_STATE,
    formData: FormData,
): Promise<ImpersonationActionState> {
    void _state;
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformImpersonation: ['request'] },
            auditSource: 'ui:admin:impersonation:request',
        },
    );

    try {
        const breakGlassApprovalIdValue = readFormString(formData, 'breakGlassApprovalId');
        await requestImpersonationService(authorization, {
            targetUserId: readFormString(formData, 'targetUserId'),
            targetOrgId: readFormString(formData, 'targetOrgId'),
            reason: readFormString(formData, 'reason'),
            expiresInMinutes: readFormNumber(formData, 'expiresInMinutes', 30),
            ...(breakGlassApprovalIdValue ? { breakGlassApprovalId: breakGlassApprovalIdValue } : {}),
        });

        await invalidateCache({
            orgId: authorization.orgId,
            scope: IMPERSONATION_SCOPE,
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });

        revalidatePath(IMPERSONATION_PATH);
        return { status: 'success', message: 'Impersonation request submitted.' };
    } catch (error) {
        const message = error instanceof ValidationError ? error.message : 'Unable to request impersonation.';
        return { status: 'error', message };
    }
}

export async function approveImpersonationAction(
    _state: ImpersonationActionState = INITIAL_STATE,
    formData: FormData,
): Promise<ImpersonationActionState> {
    void _state;
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformImpersonation: ['approve'] },
            auditSource: 'ui:admin:impersonation:approve',
        },
    );

    try {
        await approveImpersonationService(authorization, {
            requestId: readFormString(formData, 'requestId'),
        });

        await invalidateCache({
            orgId: authorization.orgId,
            scope: IMPERSONATION_SCOPE,
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });

        revalidatePath(IMPERSONATION_PATH);
        return { status: 'success', message: 'Impersonation approved.' };
    } catch (error) {
        const message = error instanceof ValidationError ? error.message : 'Unable to approve impersonation.';
        return { status: 'error', message };
    }
}

export async function stopImpersonationAction(
    _state: ImpersonationActionState = INITIAL_STATE,
    formData: FormData,
): Promise<ImpersonationActionState> {
    void _state;
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformImpersonation: ['stop'] },
            auditSource: 'ui:admin:impersonation:stop',
        },
    );

    try {
        await stopImpersonationService(authorization, {
            sessionId: readFormString(formData, 'sessionId'),
            reason: readFormString(formData, 'reason'),
        });

        await invalidateCache({
            orgId: authorization.orgId,
            scope: IMPERSONATION_SCOPE,
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });

        revalidatePath(IMPERSONATION_PATH);
        return { status: 'success', message: 'Impersonation session stopped.' };
    } catch (error) {
        const message = error instanceof ValidationError ? error.message : 'Unable to stop impersonation.';
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
