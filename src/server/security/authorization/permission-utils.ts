import type { OrgPermissionMap } from '@/server/security/access-control';

const RESOURCE_ALIAS_MAP: Record<string, readonly string[]> = {
    'hr.absence': ['hrAbsence'],
    'hr.absence.settings': ['hrAbsenceSettings'],
    'hr.absence.attachment': ['hrAbsence'],
    'hr.compliance.item': ['hrCompliance'],
    'hr.compliance.template': ['hrComplianceTemplate'],
    'hr.compliance.review': ['hrCompliance'],
    'hr.leave.request': ['hrLeave'],
    'hr.leave.balance': ['hrLeaveBalance'],
    'hr.leave.policy': ['hrLeavePolicy'],
    'hr.leave.type': ['hrLeavePolicy'],
    'hr.notification': ['hrNotification'],
    'hr.reminder': ['hrNotification'],
    'hr.onboarding.invite': ['hrOnboarding'],
    'hr.onboarding.task': ['hrOnboarding'],
    'hr.onboarding.checklist': ['hrOnboarding'],
    'hr.checklist.template': ['hrChecklistTemplate'],
    'hr.people.profile': ['employeeProfile'],
    'hr.people.contract': ['employmentContract'],
    'hr.performance.review': ['hrPerformance'],
    'hr.performance.goal': ['hrPerformanceGoal'],
    'hr.performance.feedback': ['hrPerformance'],
    'hr.policy': ['hrPolicy'],
    'hr.policy.acknowledgment': ['hrPolicy'],
    'hr.settings': ['hrSettings'],
    'org.settings': ['organization'],
    'hr.time.entry': ['hrTimeEntry'],
    'hr.time.sheet': ['hrTimeEntry'],
    'hr.training.record': ['hrTraining'],
    'hr.training.enrollment': ['hrTraining'],
} as const;

const LEGACY_TO_RESOURCE_ALIASES = Object.entries(RESOURCE_ALIAS_MAP).reduce<Record<string, readonly string[]>>(
    (accumulator, [canonical, legacyKeys]) => {
        for (const legacyKey of legacyKeys) {
            const existing = accumulator[legacyKey] ?? [];
            accumulator[legacyKey] = existing.includes(canonical)
                ? existing
                : [...existing, canonical];
        }
        return accumulator;
    },
    {},
);

export function permissionsSatisfy(granted: OrgPermissionMap, required: OrgPermissionMap): boolean {
    for (const [resource, actions] of Object.entries(required)) {
        if (!actions?.length) {
            continue;
        }

        const allowed = resolveAllowedActions(granted, resource);
        if (!actions.every((action) => allowed.includes(action))) {
            return false;
        }
    }
    return true;
}

export function satisfiesAnyPermissionProfile(
    granted: OrgPermissionMap,
    profiles: readonly OrgPermissionMap[],
): boolean {
    if (!profiles.length) {
        return true;
    }

    return profiles.some((profile) => permissionsSatisfy(granted, profile));
}

function resolveAllowedActions(granted: OrgPermissionMap, resource: string): readonly string[] {
    const candidates = resolveResourceCandidates(resource);
    const actions = new Set<string>();

    for (const candidate of candidates) {
        const grantedActions = granted[candidate];
        if (!Array.isArray(grantedActions)) {
            continue;
        }
        for (const action of grantedActions) {
            if (typeof action === 'string' && action.trim().length > 0) {
                actions.add(action);
            }
        }
    }

    return Array.from(actions);
}

function resolveResourceCandidates(resource: string): string[] {
    const candidates = new Set<string>([resource]);

    for (const alias of RESOURCE_ALIAS_MAP[resource] ?? []) {
        candidates.add(alias);
    }

    for (const canonical of LEGACY_TO_RESOURCE_ALIASES[resource] ?? []) {
        candidates.add(canonical);
    }

    return Array.from(candidates);
}
