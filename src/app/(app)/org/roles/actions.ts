'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getRoleService } from '@/server/services/org';
import type { Role } from '@/server/types/hr-types';
import { initialRoleCreateState, type InlineRoleActionState, type RoleCreateState } from './actions.state';

const createRoleSchema = z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).nullable(),
});

export async function createRoleAction(
    _previous: RoleCreateState = initialRoleCreateState,
    formData: FormData,
): Promise<RoleCreateState> {
    void _previous;

    const headerStore = await headers();

    const parsed = createRoleSchema.safeParse({
        name: formData.get('name') ?? '',
        description: normalizeOptionalText(formData.get('description')),
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid form data.' };
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:org-roles:create',
        },
    );

    await getRoleService().createRole({
        authorization,
        name: parsed.data.name,
        description: parsed.data.description,
        permissions: {},
    });

    return { status: 'success', message: 'Role created.' };
}

const updateRoleInlineSchema = z
    .object({
        roleId: z.string().trim().min(1),
        name: z.string().trim().max(120).optional(),
        description: z.string().trim().max(500).optional(),
        permissionsText: z.string().max(10_000).optional(),
    })
    .strict();

export async function updateRoleInlineAction(
    _previous: InlineRoleActionState,
    formData: FormData,
): Promise<InlineRoleActionState> {
    void _previous;
    const headerStore = await headers();

    const parsed = updateRoleInlineSchema.safeParse({
        roleId: formData.get('roleId') ?? '',
        name: normalizeOptionalTextToUndefined(formData.get('name')),
        description: normalizeOptionalTextToUndefined(formData.get('description')),
        permissionsText: normalizeOptionalTextToUndefined(formData.get('permissionsText')),
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid role update input.' };
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:org-roles:update',
        },
    );

    const permissionsParseResult = parsed.data.permissionsText
        ? parsePermissionsText(parsed.data.permissionsText)
        : { ok: true as const, value: undefined as Role['permissions'] | undefined };

    if (!permissionsParseResult.ok) {
        return { status: 'error', message: permissionsParseResult.error };
    }

    const updates = {
        name: parsed.data.name,
        description: parsed.data.description === undefined ? undefined : normalizeOptionalTextToNull(parsed.data.description),
        permissions: permissionsParseResult.value,
    };

    if (updates.name === undefined && updates.description === undefined && updates.permissions === undefined) {
        return { status: 'error', message: 'No changes to save.' };
    }

    try {
        await getRoleService().updateRole({
            authorization,
            roleId: parsed.data.roleId,
            name: updates.name,
            description: updates.description,
            permissions: updates.permissions,
        });
        return { status: 'success', message: 'Role updated.' };
    } catch (error) {
        return { status: 'error', message: error instanceof Error ? error.message : 'Failed to update role.' };
    }
}

const deleteRoleInlineSchema = z
    .object({
        roleId: z.string().trim().min(1),
    })
    .strict();

export async function deleteRoleInlineAction(
    _previous: InlineRoleActionState,
    formData: FormData,
): Promise<InlineRoleActionState> {
    void _previous;
    const headerStore = await headers();

    const parsed = deleteRoleInlineSchema.safeParse({
        roleId: formData.get('roleId') ?? '',
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid role delete input.' };
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:org-roles:delete',
        },
    );

    try {
        await getRoleService().deleteRole({
            authorization,
            roleId: parsed.data.roleId,
        });
        return { status: 'success', message: 'Role deleted.' };
    } catch (error) {
        return { status: 'error', message: error instanceof Error ? error.message : 'Failed to delete role.' };
    }
}

function parsePermissionsText(input: string):
    | { ok: true; value: Role['permissions'] }
    | { ok: false; error: string } {
    const trimmed = input.trim();
    if (!trimmed) {
        return { ok: true, value: {} };
    }

    const map: Record<string, string[]> = {};
    const lines = trimmed
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    for (const line of lines) {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex <= 0) {
            return { ok: false, error: `Invalid permissions line: "${line}"` };
        }

        const resource = line.slice(0, separatorIndex).trim();
        const permissionsPart = line.slice(separatorIndex + 1).trim();

        if (!resource) {
            return { ok: false, error: `Invalid permissions resource in line: "${line}"` };
        }

        const permissions = permissionsPart
            .split(',')
            .map((value) => value.trim())
            .filter((value) => value.length > 0);

        if (permissions.length === 0) {
            return { ok: false, error: `No permissions provided for "${resource}"` };
        }

        map[resource] = Array.from(new Set(permissions));
    }

    return { ok: true, value: map };
}

function normalizeOptionalText(value: FormDataEntryValue | null): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function normalizeOptionalTextToUndefined(value: FormDataEntryValue | null): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}

function normalizeOptionalTextToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
