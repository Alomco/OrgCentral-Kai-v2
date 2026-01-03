import type { OrgPermissionMap } from '../access-control';

export interface DelegatedAdminScope {
    module: string;
    expiresAt?: Date;
    allowedResources?: (keyof OrgPermissionMap)[];
    allowedActions?: string[];
    auditSource?: string;
    tags?: string[];
}

export interface RbacRequirement {
    requiredPermissions?: OrgPermissionMap;
    delegatedScopes?: DelegatedAdminScope[];
}

export interface RbacDecision {
    allowed: boolean;
    reasons: string[];
    matchedScope?: DelegatedAdminScope;
}

function satisfiesPermissions(
    granted: OrgPermissionMap,
    required: OrgPermissionMap,
): boolean {
    for (const resource of Object.keys(required)) {
        const actions = required[resource];
        if (!actions?.length) {
            continue;
        }
        const allowedActions = granted[resource] ?? [];
        for (const action of actions) {
            if (!allowedActions.includes(action)) {
                return false;
            }
        }
    }
    return true;
}

function isScopeActive(scope: DelegatedAdminScope, now: Date): boolean {
    return !scope.expiresAt || scope.expiresAt.getTime() >= now.getTime();
}

export function evaluateRbac(
    grantedPermissions: OrgPermissionMap,
    requirement: RbacRequirement,
    now: Date = new Date(),
): RbacDecision {
    const reasons: string[] = [];

    const requiredPermissions = requirement.requiredPermissions ?? {};

    if (!satisfiesPermissions(grantedPermissions, requiredPermissions)) {
        reasons.push('Role permissions do not satisfy requiredPermissions.');
    }

    if (reasons.length === 0) {
        return { allowed: true, reasons: [] };
    }

    if (requirement.delegatedScopes?.length) {
        for (const scope of requirement.delegatedScopes) {
            if (!isScopeActive(scope, now)) {
                continue;
            }
            const scopeMatchesRole = !scope.allowedResources?.length;
            if (scopeMatchesRole) {
                return { allowed: true, reasons: [], matchedScope: scope };
            }
            const scopePermissions: OrgPermissionMap = {};
            for (const resource of scope.allowedResources ?? []) {
                scopePermissions[resource] = scope.allowedActions ?? [];
            }
            if (satisfiesPermissions(grantedPermissions, scopePermissions)) {
                return { allowed: true, reasons: [], matchedScope: scope };
            }
        }
    }

    return {
        allowed: false,
        reasons,
    };
}

export function assertRbac(
    grantedPermissions: OrgPermissionMap,
    requirement: RbacRequirement,
): void {
    const decision = evaluateRbac(grantedPermissions, requirement);
    if (!decision.allowed) {
        throw new Error(decision.reasons.join(' '));
    }
}
