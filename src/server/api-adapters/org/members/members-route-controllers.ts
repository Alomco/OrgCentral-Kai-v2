import { z } from 'zod';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getUserService } from '@/server/services/org/users/user-service.provider';

const querySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(['INVITED', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED']).optional(),
  role: z.string().trim().optional(),
  sort: z.enum(['name', 'email', 'status', 'role']).default('name'),
  dir: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
});

export async function listMembersController(request: Request, orgId: string) {
  const url = new URL(request.url);
  const parsed = querySchema.parse(Object.fromEntries(url.searchParams));

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId,
      requiredPermissions: { organization: ['update'] },
      auditSource: 'api:org:members',
      action: 'org.user.list',
      resourceType: 'org.user',
    },
  );

  const service = getUserService();
  return service.listUsersInOrganizationPaged({
    authorization,
    page: parsed.page,
    pageSize: parsed.pageSize,
    filters: { search: parsed.q, status: parsed.status, role: parsed.role },
    sort: { key: parsed.sort, direction: parsed.dir },
  });
}
