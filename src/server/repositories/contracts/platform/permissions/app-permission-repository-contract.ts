import type { Prisma } from '../../../../../generated/client';
import type { AppPermission } from '@/server/types/platform-types';

export interface AppPermissionCreateInput {
    name: string;
    description?: string;
    category: string;
    isGlobal?: boolean;
    metadata?: Prisma.JsonValue;
}

export interface AppPermissionUpdateInput {
    name?: string;
    description?: string;
    category?: string;
    isGlobal?: boolean;
    metadata?: Prisma.JsonValue;
}

export interface IAppPermissionRepository {
    listPermissions(): Promise<AppPermission[]>;
    getPermission(permissionId: string): Promise<AppPermission | null>;
    createPermission(input: AppPermissionCreateInput): Promise<AppPermission>;
    updatePermission(permissionId: string, updates: AppPermissionUpdateInput): Promise<AppPermission>;
    deletePermission(permissionId: string): Promise<void>;
}
