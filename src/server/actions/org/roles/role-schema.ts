import { z } from 'zod';
import { RoleScope } from '@prisma/client';

const roleScopeValues = Object.values(RoleScope) as [RoleScope, ...RoleScope[]];

export const createRoleSchema = z.object({
    name: z.string().min(1, 'Role name is required').max(50, 'Role name too long'),
    description: z.string().optional(),
    permissions: z.record(z.string(), z.array(z.string())).optional().nullable(),
    scope: z.enum(roleScopeValues).default(RoleScope.ORG),
});

export const updateRoleSchema = z.object({
    roleId: z.string().min(1),
    name: z.string().min(1).max(50).optional(),
    description: z.string().optional().nullable(),
    permissions: z.record(z.string(), z.array(z.string())).optional().nullable(),
    scope: z.enum(roleScopeValues).optional(),
});

export const deleteRoleSchema = z.object({
    roleId: z.string().min(1),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type DeleteRoleInput = z.infer<typeof deleteRoleSchema>;
