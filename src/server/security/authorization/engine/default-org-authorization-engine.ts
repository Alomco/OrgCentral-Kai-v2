import type { DataClassificationLevel } from '@/server/types/tenant';
import type { OrgAuthorizationContext, OrgAuthorizationEngine, OrgAuthorizationInput } from './types';

import { evaluateAbac, makeSubject } from '@/server/security/abac';
import {
    buildAnyPermissionProfiles,
    normalizePermissionRequirement,
} from '../permission-requirements';
import {
    permissionsSatisfy,
    satisfiesAnyPermissionProfile,
} from '@/server/security/authorization/permission-utils';

const classificationRank: Record<DataClassificationLevel, number> = {
    OFFICIAL: 1,
    OFFICIAL_SENSITIVE: 2,
    SECRET: 3,
    TOP_SECRET: 4,
};

function assertTenantConstraints(input: OrgAuthorizationInput, context: OrgAuthorizationContext): void {
    if (
        input.expectedClassification &&
        classificationRank[context.dataClassification] < classificationRank[input.expectedClassification]
    ) {
        throw new Error('User clearance is insufficient for this classification.');
    }

    if (input.expectedResidency && input.expectedResidency !== context.dataResidency) {
        throw new Error('Requested residency zone mismatch.');
    }
}

function assertRbac(input: OrgAuthorizationInput, context: OrgAuthorizationContext): void {
    const requiredPermissions = normalizePermissionRequirement(input.requiredPermissions);
    const requiredAnyPermissionProfiles = buildAnyPermissionProfiles(input.requiredAnyPermissions);

    const hasRbacRequirements =
        Object.keys(requiredPermissions).length > 0 || requiredAnyPermissionProfiles.length > 0;

    if (!hasRbacRequirements) {
        return;
    }

    const grantedPermissions = context.permissions;

    const allowed =
        permissionsSatisfy(grantedPermissions, requiredPermissions) &&
        satisfiesAnyPermissionProfile(grantedPermissions, requiredAnyPermissionProfiles);

    if (!allowed) {
        throw new Error('RBAC check failed for the requested action.');
    }
}

async function assertAbac(input: OrgAuthorizationInput, context: OrgAuthorizationContext): Promise<void> {
    if (!input.action || !input.resourceType) {
        return;
    }

    const baseRole = context.roleKey === 'custom' ? 'custom' : context.roleKey;
    const roleTokens = new Set<string>([baseRole]);
    if (context.roleName && context.roleName !== baseRole) {
        roleTokens.add(context.roleName);
    }
    const subject = makeSubject(
        input.orgId,
        input.userId,
        Array.from(roleTokens),
        {
            residency: context.dataResidency,
            classification: context.dataClassification,
        },
    );

    const allowed = await evaluateAbac(
        input.orgId,
        input.action,
        input.resourceType,
        subject,
        {
            residency: context.dataResidency,
            classification: context.dataClassification,
            ...(input.resourceAttributes ?? {}),
        },
    );

    if (!allowed) {
        throw new Error('ABAC policy denied this action.');
    }
}

export const DEFAULT_ORG_AUTHORIZATION_ENGINE: OrgAuthorizationEngine = {
    assertTenantConstraints,
    assertRbac,
    assertAbac,
};
