import { recordAuditEvent } from '@/server/logging/audit-logger';
import { appLogger } from '@/server/logging/structured-logger';

const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

export async function recordBootstrapAuditEvent(
    event: Parameters<typeof recordAuditEvent>[0],
): Promise<void> {
    try {
        await recordAuditEvent(event);
        return;
    } catch (error) {
        if (!isAuditMembershipConstraintError(error) || !event.userId) {
            appLogger.error('admin.bootstrap.audit.failed', {
                error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
            });
            return;
        }

        appLogger.warn('admin.bootstrap.audit.fallback', {
            error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        });

        await recordAuditEvent({
            ...event,
            userId: undefined,
            payload: {
                ...event.payload,
                actorUserId: event.userId,
                auditFallback: 'missing-membership',
            },
        });
    }
}

function isAuditMembershipConstraintError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }
    return error.message.includes('audit_logs_orgId_userId_fkey');
}
