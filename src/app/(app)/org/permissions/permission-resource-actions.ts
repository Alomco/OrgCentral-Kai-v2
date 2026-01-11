'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';

import { getPermissionResourceService } from '@/server/services/org';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';

import {
    defaultCreateValues,
    parseActionList,
    permissionResourceCreateSchema,
    permissionResourceUpdateSchema,
    readFormString,
    toFieldErrors,
    type PermissionResourceCreateState,
    type PermissionResourceInlineState,
} from './permission-resource-form-utils';

const requiredPermissions = { organization: ['update'] } as const;
const ORG_PERMISSIONS_PATH = '/org/permissions';
const NOT_AUTHORIZED_PERMISSION_RESOURCE_MESSAGE = 'Not authorized to manage permission resources.';

export async function createPermissionResourceAction(
    previous: PermissionResourceCreateState,
    formData: FormData,
): Promise<PermissionResourceCreateState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions,
                auditSource: 'ui:org-permissions:registry:create',
            },
        );
    } catch {
        return {
            status: 'error',
            message: NOT_AUTHORIZED_PERMISSION_RESOURCE_MESSAGE,
            values: previous.values,
        };
    }

    const candidate = {
        resource: readFormString(formData, 'resource'),
        actions: readFormString(formData, 'actions'),
        description: readFormString(formData, 'description'),
    };

    const parsed = permissionResourceCreateSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: 'Check the highlighted fields and try again.',
            fieldErrors: toFieldErrors(parsed.error),
            values: candidate,
        };
    }

    const actions = parseActionList(parsed.data.actions);
    const description = parsed.data.description?.trim();

    try {
        await getPermissionResourceService().createResource({
            authorization: session.authorization,
            resource: parsed.data.resource,
            actions,
            description: description && description.length > 0 ? description : null,
        });

        revalidatePath(ORG_PERMISSIONS_PATH);

        return {
            status: 'success',
            message: 'Permission resource created.',
            values: defaultCreateValues,
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to create permission resource.',
            values: candidate,
        };
    }
}

export async function updatePermissionResourceAction(
    _previous: PermissionResourceInlineState,
    formData: FormData,
): Promise<PermissionResourceInlineState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions,
                auditSource: 'ui:org-permissions:registry:update',
            },
        );
    } catch {
        return {
            status: 'error',
            message: NOT_AUTHORIZED_PERMISSION_RESOURCE_MESSAGE,
        };
    }

    const candidate = {
        resourceId: readFormString(formData, 'resourceId'),
        resource: readFormString(formData, 'resource'),
        actions: readFormString(formData, 'actions'),
        description: readFormString(formData, 'description'),
    };

    const parsed = permissionResourceUpdateSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: 'Check the highlighted fields and try again.',
            fieldErrors: toFieldErrors(parsed.error),
        };
    }

    const actions = parseActionList(parsed.data.actions);
    const description = parsed.data.description?.trim();

    try {
        await getPermissionResourceService().updateResource({
            authorization: session.authorization,
            resourceId: parsed.data.resourceId,
            resource: parsed.data.resource,
            actions,
            description: description && description.length > 0 ? description : null,
        });

        revalidatePath(ORG_PERMISSIONS_PATH);

        return {
            status: 'success',
            message: 'Permission resource updated.',
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to update permission resource.',
        };
    }
}

export async function deletePermissionResourceAction(
    _previous: PermissionResourceInlineState,
    formData: FormData,
): Promise<PermissionResourceInlineState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions,
                auditSource: 'ui:org-permissions:registry:delete',
            },
        );
    } catch {
        return {
            status: 'error',
            message: NOT_AUTHORIZED_PERMISSION_RESOURCE_MESSAGE,
        };
    }

    const resourceId = readFormString(formData, 'resourceId');
    const parsedId = z.uuid().safeParse(resourceId);
    if (!parsedId.success) {
        return { status: 'error', message: 'Invalid permission resource id.' };
    }

    try {
        await getPermissionResourceService().deleteResource({
            authorization: session.authorization,
            resourceId: parsedId.data,
        });

        revalidatePath(ORG_PERMISSIONS_PATH);

        return {
            status: 'success',
            message: 'Permission resource deleted.',
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to delete permission resource.',
        };
    }
}
