import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { OrgPermissionMap } from '@/server/security/access-control';

export async function authorizePlatformRequest(
    request: Request,
    options: {
        requiredPermissions: OrgPermissionMap;
        auditSource: string;
        action: string;
        resourceType: string;
    },
): Promise<RepositoryAuthorizationContext> {
    const { authorization } = await getSessionContext({}, {
        headers: request.headers,
        requiredPermissions: options.requiredPermissions,
        auditSource: options.auditSource,
        action: options.action,
        resourceType: options.resourceType,
    });

    return authorization;
}
