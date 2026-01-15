import { createEnhancedSecurityEventRepository } from '@/server/repositories/providers/security/enhanced-security-event-repository-provider';
import { createSecurityMetricsRepository } from '@/server/repositories/providers/security/security-metrics-repository-provider';
import { SecurityMetricsService } from '@/server/services/security/security-metrics-service';

export function resolveSecurityMetricsService(): SecurityMetricsService {
    return new SecurityMetricsService({
        securityMetricsRepository: createSecurityMetricsRepository(),
    });
}

export function resolveSecurityEventRepository() {
    return createEnhancedSecurityEventRepository();
}

export function resolveDateRange(daysBack: number): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date(end.getTime());
    start.setDate(start.getDate() - daysBack);
    return { start, end };
}
