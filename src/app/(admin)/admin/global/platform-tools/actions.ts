'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { executePlatformToolService } from '@/server/services/platform/admin/platform-tools-service';
import { requestBreakGlassService } from '@/server/services/platform/admin/break-glass-service';
import { invalidateCache } from '@/server/lib/cache-tags';
import {
    CACHE_SCOPE_PLATFORM_BREAK_GLASS,
    CACHE_SCOPE_PLATFORM_TOOLS,
} from '@/server/repositories/cache-scopes';
import { ValidationError } from '@/server/errors';

export interface PlatformToolActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    approvalId?: string;
}

const INITIAL_STATE: PlatformToolActionState = { status: 'idle' };

export async function requestToolBreakGlassAction(
    _state: PlatformToolActionState = INITIAL_STATE,
    formData: FormData,
): Promise<PlatformToolActionState> {
    void _state;
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformBreakGlass: ['request'] },
            auditSource: 'ui:admin:tools:break-glass',
            action: 'request',
            resourceType: 'breakGlassApproval',
            resourceAttributes: { scope: 'platform-tools' },
        },
    );

    try {
        const tenantIdValue = readFormString(formData, 'tenantId');
        const toolIdValue = readFormString(formData, 'toolId');
        const result = await requestBreakGlassService(authorization, {
            scope: 'platform-tools',
            reason: readFormString(formData, 'reason'),
            targetOrgId: tenantIdValue || authorization.orgId,
            action: 'platform-tool.execute',
            resourceId: toolIdValue,
            expiresInMinutes: readFormNumber(formData, 'expiresInMinutes', 60),
        });

        await invalidateCache({
            orgId: authorization.orgId,
            scope: CACHE_SCOPE_PLATFORM_BREAK_GLASS,
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });

        revalidatePath('/admin/global/platform-tools');
        return { status: 'success', message: 'Break-glass approval requested.', approvalId: result.id };
    } catch (error) {
        const message = error instanceof ValidationError ? error.message : 'Unable to request break-glass approval.';
        return { status: 'error', message };
    }
}

export async function executePlatformToolAction(
    _state: PlatformToolActionState = INITIAL_STATE,
    formData: FormData,
): Promise<PlatformToolActionState> {
    void _state;
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformTools: ['execute'] },
            auditSource: 'ui:admin:tools:execute',
            action: 'execute',
            resourceType: 'platformTool',
        },
    );

    try {
        const breakGlassApprovalIdValue = readFormString(formData, 'breakGlassApprovalId');
        const tenantIdValue = readFormString(formData, 'tenantId');
        await executePlatformToolService(authorization, {
            toolId: readFormString(formData, 'toolId'),
            dryRun: readFormBoolean(formData, 'dryRun', true),
            parameters: { tenantId: tenantIdValue || null },
            ...(breakGlassApprovalIdValue ? { breakGlassApprovalId: breakGlassApprovalIdValue } : {}),
        });

        await invalidateCache({
            orgId: authorization.orgId,
            scope: CACHE_SCOPE_PLATFORM_TOOLS,
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });

        revalidatePath('/admin/global/platform-tools');
        return { status: 'success', message: 'Tool executed.' };
    } catch (error) {
        const message = error instanceof ValidationError ? error.message : 'Unable to execute tool.';
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

function readFormBoolean(formData: FormData, key: string, fallback: boolean): boolean {
    const value = formData.get(key);
    if (typeof value !== 'string') {
        return fallback;
    }
    return value === 'true' || value === 'on' || value === '1';
}
