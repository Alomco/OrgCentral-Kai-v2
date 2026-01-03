import type { PermissionResource } from '@/server/types/security-types';

export interface IPermissionResourceRepository {
    listResources(orgId: string): Promise<PermissionResource[]>;
    getResource(orgId: string, resourceId: string): Promise<PermissionResource | null>;
    getResourceByName(orgId: string, resource: string): Promise<PermissionResource | null>;
    createResource(
        orgId: string,
        input: Omit<PermissionResource, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<void>;
    updateResource(
        orgId: string,
        resourceId: string,
        updates: Partial<Omit<PermissionResource, 'id' | 'orgId' | 'createdAt'>>
    ): Promise<void>;
    deleteResource(orgId: string, resourceId: string): Promise<void>;
}
