// src/server/services/seeder/seed-security.ts
import { faker } from '@faker-js/faker';
import { createSecurityEventRepository } from '@/server/repositories/providers/auth/security-event-repository-provider';
import {
    resolveSeederAuthorization,
    resolveSeedOrganization,
    type SeedContextOptions,
    getSeededMetadata,
    type SeedResult,
    UNKNOWN_ERROR_MESSAGE,
} from './utils';

export async function seedSecurityEventsInternal(count = 20, options?: SeedContextOptions): Promise<SeedResult> {
    try {
        const org = await resolveSeedOrganization(options);
        const authorization = resolveSeederAuthorization(org, options);
        const repository = createSecurityEventRepository();
        let created = 0;

        for (let index = 0; index < count; index++) {
            await repository.createSecurityEvent(org.id, {
                orgId: org.id,
                userId: authorization.userId,
                eventType: faker.helpers.arrayElement(['login_success', 'login_failed', 'password_change', 'mfa_enabled']),
                severity: faker.helpers.arrayElement(['low', 'medium', 'high']),
                description: faker.internet.userAgent(),
                ipAddress: faker.internet.ipv4(),
                userAgent: faker.internet.userAgent(),
                additionalInfo: getSeededMetadata(),
                resolved: false,
                resolvedAt: null,
                resolvedBy: null,
            });
            created++;
        }
        return { success: true, message: `Created ${String(created)} security events`, count: created };
    } catch (error_) {
        return { success: false, message: error_ instanceof Error ? error_.message : UNKNOWN_ERROR_MESSAGE };
    }
}
