import { z } from 'zod';

import { ValidationError } from '@/server/errors';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { readJson } from '@/server/api-adapters/http/request-utils';
import { getPermissionResourceService } from '@/server/services/org';

const ORG_ID_REQUIRED_MESSAGE = 'Organization id is required.';
const RESOURCE_ID_REQUIRED_MESSAGE = 'Permission resource id is required.';

const REQUIRED_PERMISSIONS: Record<string, string[]> = { organization: ['update'] };
const RESOURCE_TYPE = 'org.permissionResource';
const AUDIT_SOURCE = 'api:org:permissions';

const actionsInput = z
  .union([z.string().trim().min(1), z.array(z.string().trim().min(1))])
  .transform((value) => (typeof value === 'string' ? parseActionList(value) : dedupe(value)));

const createSchema = z.object({
  resource: z.string().trim().min(1).max(120),
  actions: actionsInput.refine((v) => v.length > 0, 'At least one action is required.'),
  description: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((value) => (value?.length ? value : undefined)),
});

const updateSchema = z
  .object({
    resource: z.string().trim().min(1).max(120).optional(),
    actions: actionsInput.refine((v) => v.length > 0, 'At least one action is required.').optional(),
    description: z
      .string()
      .trim()
      .max(300)
      .optional()
      .transform((value) => (value?.length ? value : undefined)),
  })
  .refine((object) => Object.keys(object).length > 0, {
    message: 'At least one field must be provided to update a permission resource.',
  });

export async function listPermissionResourcesController(request: Request, orgId: string) {
  const normalizedOrgId = orgId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: REQUIRED_PERMISSIONS,
      auditSource: AUDIT_SOURCE,
      action: 'org.permissionResource.list',
      resourceType: RESOURCE_TYPE,
    },
  );

  const service = getPermissionResourceService();
  const resources = await service.listResources({ authorization });
  return { resources };
}

export async function getPermissionResourceController(request: Request, orgId: string, resourceId: string) {
  const normalizedOrgId = orgId.trim();
  const normalizedResourceId = resourceId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }
  if (!normalizedResourceId) {
    throw new ValidationError(RESOURCE_ID_REQUIRED_MESSAGE);
  }

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: REQUIRED_PERMISSIONS,
      auditSource: AUDIT_SOURCE,
      action: 'org.permissionResource.get',
      resourceType: RESOURCE_TYPE,
      resourceAttributes: { resourceId: normalizedResourceId },
    },
  );

  const service = getPermissionResourceService();
  const resource = await service.getResource({ authorization, resourceId: normalizedResourceId });
  return { resource };
}

export async function createPermissionResourceController(request: Request, orgId: string) {
  const normalizedOrgId = orgId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }

  const body = await readJson(request);
  const input = createSchema.parse(body);

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: REQUIRED_PERMISSIONS,
      auditSource: AUDIT_SOURCE,
      action: 'org.permissionResource.create',
      resourceType: RESOURCE_TYPE,
      resourceAttributes: { resource: input.resource },
    },
  );

  const service = getPermissionResourceService();
  const resource = await service.createResource({ authorization, ...input });
  return { resource };
}

export async function updatePermissionResourceController(
  request: Request,
  orgId: string,
  resourceId: string,
) {
  const normalizedOrgId = orgId.trim();
  const normalizedResourceId = resourceId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }
  if (!normalizedResourceId) {
    throw new ValidationError(RESOURCE_ID_REQUIRED_MESSAGE);
  }

  const body = await readJson(request);
  const input = updateSchema.parse(body);
  const updateKeys = Object.keys(input);

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: REQUIRED_PERMISSIONS,
      auditSource: AUDIT_SOURCE,
      action: 'org.permissionResource.update',
      resourceType: RESOURCE_TYPE,
      resourceAttributes: { resourceId: normalizedResourceId, updateKeys },
    },
  );

  const service = getPermissionResourceService();
  const resource = await service.updateResource({ authorization, resourceId: normalizedResourceId, ...input });
  return { resource };
}

export async function deletePermissionResourceController(request: Request, orgId: string, resourceId: string) {
  const normalizedOrgId = orgId.trim();
  const normalizedResourceId = resourceId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }
  if (!normalizedResourceId) {
    throw new ValidationError(RESOURCE_ID_REQUIRED_MESSAGE);
  }

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: REQUIRED_PERMISSIONS,
      auditSource: AUDIT_SOURCE,
      action: 'org.permissionResource.delete',
      resourceType: RESOURCE_TYPE,
      resourceAttributes: { resourceId: normalizedResourceId },
    },
  );

  const service = getPermissionResourceService();
  await service.deleteResource({ authorization, resourceId: normalizedResourceId });
  return { success: true as const };
}

function parseActionList(input: string): string[] {
  if (!input) {
    return [];
  }
  const parts = input
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
  return dedupe(parts);
}

function dedupe(values: string[]): string[] {
  const set = new Set(values.map((v) => v.trim()).filter((v) => v.length > 0));
  return Array.from(set);
}