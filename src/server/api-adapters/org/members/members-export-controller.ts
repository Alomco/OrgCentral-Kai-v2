import { z } from 'zod';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getUserService } from '@/server/services/org/users/user-service.provider';

const querySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(['INVITED', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED']).optional(),
  role: z.string().trim().optional(),
  sort: z.enum(['name', 'email', 'status', 'role']).default('name'),
  dir: z.enum(['asc', 'desc']).default('asc'),
});

export async function exportMembersCsvController(request: Request, orgId: string) {
  const url = new URL(request.url);
  const parsed = querySchema.parse(Object.fromEntries(url.searchParams));

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId,
      requiredPermissions: { organization: ['update'] },
      auditSource: 'api:org:members:export',
      action: 'org.user.export',
      resourceType: 'org.user',
    },
  );

  const service = getUserService();
  const result = await service.listUsersInOrganizationPaged({
    authorization,
    page: 1,
    pageSize: 1000,
    filters: { search: parsed.q, status: parsed.status, role: parsed.role },
    sort: { key: parsed.sort, direction: parsed.dir },
  });

  const lines: string[] = [];
  lines.push('id,email,displayName,roles,status');
  for (const user of result.users) {
    const membership = user.memberships.find((m) => m.organizationId === authorization.orgId);
    const status = membership?.status ?? 'INVITED';
    const roles = (membership ? membership.roles : user.roles).join(' ');
    const csv = [user.id, user.email, escapeCsv(user.displayName), escapeCsv(roles), status].join(',');
    lines.push(csv);
  }

  const body = lines.join('\n');
  const filename = `org-members-${authorization.orgId}.csv`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}` + '.csv"',
      'Cache-Control': 'no-store',
    },
  });
}

function escapeCsv(value: string): string {
  const v = String(value ?? '');
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return '"' + v.replaceAll('"', '""') + '"';
  }
  return v;
}
