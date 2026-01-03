import { HR_ACTION } from '@/server/security/authorization/hr-permissions/actions';
import { HR_RESOURCE_TYPE } from '@/server/security/authorization/hr-permissions/resources';

export function buildActionOptions(): string[] {
    const extra = [
        '*',
        'invite',
        'resend',
        'revoke',
        'suspend',
        'resume',
        'notifications:list',
        'notifications:read',
        'notifications:compose',
        'notifications:delete',
        'org.abac.read',
        'org.abac.update',
        'org.organization.read',
        'org.organization.update',
        'org.invitation.list',
        'org.invitation.create',
        'org.invitation.revoke',
        'org.invitation.resend',
        'org.role.list',
        'org.role.create',
        'org.role.update',
        'org.role.delete',
    ];

    return dedupe([...extra, ...Object.values(HR_ACTION)]);
}

export function buildResourceOptions(): string[] {
    const extra = [
        '*',
        'hr.*',
        'hr.compliance',
        'hr.onboarding',
        'hr.leave',
        'hr.absence-ai-validation',
        'employeeProfile',
        'employmentContract',
        'checklistTemplate',
        'notification',
        'org.abac.policy',
        'org.organization',
        'org.invitation',
        'org.leave-settings',
        'org.membership',
        'org.settings',
        'security_event',
    ];

    return dedupe([...extra, ...Object.values(HR_RESOURCE_TYPE)]);
}

function dedupe(values: string[]): string[] {
    const seen = new Set<string>();
    const output: string[] = [];

    for (const value of values) {
        const trimmed = value.trim();
        if (!trimmed || seen.has(trimmed)) {
            continue;
        }
        seen.add(trimmed);
        output.push(trimmed);
    }

    return output;
}
