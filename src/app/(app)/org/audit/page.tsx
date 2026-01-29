import { headers } from 'next/headers';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { AuditLogClient } from './_components/audit-log-client';

export default async function OrgAuditPage() {
  const headerStore = await headers();
  const { authorization } = await getSessionContextOrRedirect(
    {},
    {
      headers: headerStore,
      requiredPermissions: { organization: ['update'] },
      auditSource: 'ui:org-audit:read',
      action: 'org.audit.read',
      resourceType: 'org.auditLog',
    },
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Security</p>
        <h1 className="text-2xl font-semibold text-foreground">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Review access, policy, and data-change events.</p>
      </div>

      <AuditLogClient orgId={authorization.orgId} />
    </div>
  );
}
