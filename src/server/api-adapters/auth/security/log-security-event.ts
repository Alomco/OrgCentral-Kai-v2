// API adapter: Use-case: log a security event using the security-event repository for audit/compliance.
import { z } from 'zod';
import { getSecurityEventService } from '@/server/services/auth/security-event-service';
import type { SecurityEventService } from '@/server/services/auth/security-event-service';
import type { LogSecurityEventInput } from '@/server/types';
import { LogSecurityEventRequestSchema } from '@/server/types';
import { recordSecurityEvent } from '@/server/use-cases/auth/security/log-security-event-action';

/**
 * Controller-level adapter for logging a security event.
 * - Validates runtime input using Zod
 * - Instantiates the Prisma repository (caller can provide an alternative implementation)
 * - Calls the use-case with the validated input
 *
 * Returns the use-case output or throws an error that controllers can map to HTTP status codes.
 */
const ActorSchema = z.object({
    userId: z.string().min(1, 'Authenticated user id is required to log a security event.'),
});

const securityEventService = getSecurityEventService();

export async function logSecurityEventController(
    payload: unknown,
    actor: unknown,
    service: SecurityEventService = securityEventService,
): Promise<{ success: true }> {
    const input = LogSecurityEventRequestSchema.parse(payload);
    const { userId } = ActorSchema.parse(actor);
    const logInput: LogSecurityEventInput = { ...input, userId };
    return recordSecurityEvent(logInput, { service });
}
