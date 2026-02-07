'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { requestBreakGlassService } from '@/server/services/platform/admin/break-glass-service';
import { updatePlatformTenantStatusService } from '@/server/services/platform/admin/tenant-management-service';
import { invalidateCache } from '@/server/lib/cache-tags';
import {
    CACHE_SCOPE_PLATFORM_BREAK_GLASS,
    CACHE_SCOPE_PLATFORM_TENANTS,
    buildPlatformTenantCacheScope,
} from '@/server/repositories/cache-scopes';
import { ValidationError } from '@/server/errors';
import { parseTenantStatusAction } from '@/server/validators/platform/admin/tenant-validators';

export interface BreakGlassActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    approvalId?: string;
}

export interface TenantStatusActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

const BREAK_GLASS_INITIAL_STATE: BreakGlassActionState = { status: 'idle' };
const TENANT_STATUS_INITIAL_STATE: TenantStatusActionState = { status: 'idle' };

export async function requestBreakGlassAction(
    _state: BreakGlassActionState = BREAK_GLASS_INITIAL_STATE,
    formData: FormData,
): Promise<BreakGlassActionState> {
    void _state;
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformBreakGlass: ['request'] },
            auditSource: 'ui:admin:tenants:break-glass',
        },
    );

    try {
        const tenantId = readFormString(formData, 'tenantId');
        const action = readFormString(formData, 'action') || 'SUSPEND';
        const result = await requestBreakGlassService(authorization, {
            scope: 'tenant-status',
            reason: readFormString(formData, 'reason'),
            targetOrgId: tenantId,
            action: `tenant.${action.toLowerCase()}`,
            resourceId: tenantId,
            expiresInMinutes: readFormNumber(formData, 'expiresInMinutes', 60),
        });

        await invalidateCache({
            orgId: authorization.orgId,
            scope: CACHE_SCOPE_PLATFORM_BREAK_GLASS,
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });

        revalidatePath('/admin/global/tenant-management');

        return {
            status: 'success',
            message: 'Break-glass approval requested.',
            approvalId: result.id,
        };
    } catch (error) {
        const message = error instanceof ValidationError ? error.message : 'Unable to request break-glass approval.';
        return { status: 'error', message };
    }
}

export async function updateTenantStatusAction(
    _state: TenantStatusActionState = TENANT_STATUS_INITIAL_STATE,
    formData: FormData,
): Promise<TenantStatusActionState> {
    void _state;
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformTenants: ['update'] },
            auditSource: 'ui:admin:tenants:update',
        },
    );

    try {
        const breakGlassApprovalIdValue = readFormString(formData, 'breakGlassApprovalId');
        const tenantId = readFormString(formData, 'tenantId');
        const payload = parseTenantStatusAction({
            tenantId,
            action: readFormString(formData, 'action'),
            ...(breakGlassApprovalIdValue ? { breakGlassApprovalId: breakGlassApprovalIdValue } : {}),
        });

        await updatePlatformTenantStatusService(authorization, payload);

        await invalidateCache({
            orgId: authorization.orgId,
            scope: CACHE_SCOPE_PLATFORM_TENANTS,
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });
        await invalidateCache({
            orgId: authorization.orgId,
            scope: buildPlatformTenantCacheScope(tenantId),
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });

        revalidatePath('/admin/global/tenant-management');
        revalidatePath(`/admin/global/tenant-management/${tenantId}`);
        return { status: 'success', message: 'Tenant status updated.' };
    } catch (error) {
        const message = error instanceof ValidationError ? error.message : 'Unable to update tenant status.';
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
