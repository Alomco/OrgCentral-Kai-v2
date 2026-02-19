import { z } from 'zod';
import { RoleScope } from '../../../../generated/client';
import { ValidationError } from '@/server/errors';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { readJson } from '@/server/api-adapters/http/request-utils';
import { getRoleService } from '@/server/services/org/roles/role-service.provider';

const ROLE_ADMIN_PERMISSIONS: Record<string, string[]> = { organization: ['update'] };
const ROLE_RESOURCE_TYPE = 'org.role';
const AUDIT_SOURCE = 'api:org:roles';

const ORG_ID_REQUIRED_MESSAGE = 'Organization id is required.';
const ROLE_ID_REQUIRED_MESSAGE = 'Role id is required.';

const permissionsSchema = z.record(z.string(), z.array(z.string().min(1))).optional();

const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  permissions: permissionsSchema,
  scope: z.enum(RoleScope).optional(),
});

const updateRoleSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    permissions: permissionsSchema,
    scope: z.enum(RoleScope).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided to update a role.',
  });

export async function listRolesController(request: Request, orgId: string) {
  const normalizedOrgId = orgId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: ROLE_ADMIN_PERMISSIONS,
      auditSource: AUDIT_SOURCE,
      action: 'org.role.list',
      resourceType: ROLE_RESOURCE_TYPE,
    },
  );

  const service = getRoleService();
  const roles = await service.listRoles({ authorization });
  return { roles };
}

export async function getRoleController(request: Request, orgId: string, roleId: string) {
  const normalizedOrgId = orgId.trim();
  const normalizedRoleId = roleId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }
  if (!normalizedRoleId) {
    throw new ValidationError(ROLE_ID_REQUIRED_MESSAGE);
  }

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: ROLE_ADMIN_PERMISSIONS,
      auditSource: AUDIT_SOURCE,
      action: 'org.role.get',
      resourceType: ROLE_RESOURCE_TYPE,
      resourceAttributes: { roleId: normalizedRoleId },
    },
  );

  const service = getRoleService();
  const role = await service.getRole({ authorization, roleId: normalizedRoleId });
  return { role };
}

export async function createRoleController(request: Request, orgId: string) {
  const normalizedOrgId = orgId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }

  const body = await readJson(request);
  const input = createRoleSchema.parse(body);

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: ROLE_ADMIN_PERMISSIONS,
      auditSource: AUDIT_SOURCE,
      action: 'org.role.create',
      resourceType: ROLE_RESOURCE_TYPE,
      resourceAttributes: { roleName: input.name },
    },
  );

  const service = getRoleService();
  const role = await service.createRole({
    authorization,
    ...input,
  });

  return { role };
}

export async function updateRoleController(request: Request, orgId: string, roleId: string) {
  const normalizedOrgId = orgId.trim();
  const normalizedRoleId = roleId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }
  if (!normalizedRoleId) {
    throw new ValidationError(ROLE_ID_REQUIRED_MESSAGE);
  }

  const body = await readJson(request);
  const input = updateRoleSchema.parse(body);
  const updateKeys = Object.keys(input);

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: ROLE_ADMIN_PERMISSIONS,
      auditSource: AUDIT_SOURCE,
      action: 'org.role.update',
      resourceType: ROLE_RESOURCE_TYPE,
      resourceAttributes: { roleId: normalizedRoleId, updateKeys },
    },
  );

  const service = getRoleService();
  const role = await service.updateRole({
    authorization,
    roleId: normalizedRoleId,
    ...input,
  });

  return { role };
}

export async function deleteRoleController(request: Request, orgId: string, roleId: string) {
  const normalizedOrgId = orgId.trim();
  const normalizedRoleId = roleId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
  }
  if (!normalizedRoleId) {
    throw new ValidationError(ROLE_ID_REQUIRED_MESSAGE);
  }

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: ROLE_ADMIN_PERMISSIONS,
      auditSource: AUDIT_SOURCE,
      action: 'org.role.delete',
      resourceType: ROLE_RESOURCE_TYPE,
      resourceAttributes: { roleId: normalizedRoleId },
    },
  );

  const service = getRoleService();
  await service.deleteRole({ authorization, roleId: normalizedRoleId });

  return { success: true as const };
}
