import { z } from 'zod';
import { ValidationError } from '@/server/errors';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getAuditLogRepository } from '@/server/repositories/providers/records/audit-log-repository-provider';

const REQUIRED_PERMISSIONS: Record<string, string[]> = { organization: ['update'] };
const RESOURCE_TYPE = 'org.auditLog';
const AUDIT_SOURCE = 'api:org:audit:logs';

const querySchema = z.object({
  eventType: z
    .enum(['ACCESS', 'DATA_CHANGE', 'POLICY_CHANGE', 'AUTH', 'SYSTEM', 'COMPLIANCE', 'SECURITY', 'DOCUMENT', 'LEAVE_REQUEST', 'PAYROLL'])
    .optional(),
  action: z.string().trim().optional(),
  resource: z.string().trim().optional(),
  userId: z.string().trim().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  cursor: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
});

export async function listAuditLogsController(request: Request, orgId: string) {
  const normalizedOrgId = orgId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError('Organization id is required.');
  }

  const url = new URL(request.url);
  const parsed = querySchema.parse(Object.fromEntries(url.searchParams));

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: REQUIRED_PERMISSIONS,
      auditSource: AUDIT_SOURCE,
      action: 'org.audit.read',
      resourceType: RESOURCE_TYPE,
    },
  );

  const repo = getAuditLogRepository();
  const logs = await repo.findAll(authorization, {
    orgId: authorization.orgId,
    eventType: parsed.eventType,
    action: parsed.action,
    resource: parsed.resource,
    userId: parsed.userId,
    dateFrom: parsed.dateFrom,
    dateTo: parsed.dateTo,
  });

  // Sort by createdAt desc and apply cursor (createdAt strictly older than cursor)
  const sorted = [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const cursorDate = parsed.cursor ? new Date(parsed.cursor) : undefined;
  const windowed = cursorDate ? sorted.filter((l) => new Date(l.createdAt).getTime() < cursorDate.getTime()) : sorted;

  const page = windowed.slice(0, parsed.limit);
  const last = page.at(-1);
  const nextCursor = last ? new Date(last.createdAt).toISOString() : undefined;

  return { logs: page, nextCursor };
}
