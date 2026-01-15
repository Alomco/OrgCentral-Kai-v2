import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/prisma';
import type { OrgRoleKey } from '@/server/security/access-control';
import { buildAuthorizationContext } from '@/server/use-cases/shared/builders';
import { seedPermissionResources } from '@/server/use-cases/org/permissions/seed-permission-resources';
import { seedDefaultAbsenceTypes } from '@/server/use-cases/hr/absences/seed-default-absence-types';
import { buildPermissionResourceServiceDependencies } from '@/server/repositories/providers/org/permission-resource-service-dependencies';
import { buildAbsenceTypeConfigDependencies } from '@/server/repositories/providers/hr/absence-type-config-service-dependencies';
import { BOOTSTRAP_SEED_SOURCE } from './admin-bootstrap.helpers';

export interface AdminBootstrapSeedContext {
    orgId: string;
    userId: string;
    roleKey: OrgRoleKey;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
}

export async function seedAdminBootstrapData(context: AdminBootstrapSeedContext): Promise<void> {
    const { permissionRepository } = buildPermissionResourceServiceDependencies();
    await seedPermissionResources({ permissionResourceRepository: permissionRepository }, { orgId: context.orgId });

    const { absenceTypeConfigRepository } = buildAbsenceTypeConfigDependencies();
    const authorization = buildAuthorizationContext({
        orgId: context.orgId,
        userId: context.userId,
        roleKey: context.roleKey,
        dataResidency: context.dataResidency,
        dataClassification: context.dataClassification,
        auditSource: BOOTSTRAP_SEED_SOURCE,
        tenantScope: {
            orgId: context.orgId,
            dataResidency: context.dataResidency,
            dataClassification: context.dataClassification,
            auditSource: BOOTSTRAP_SEED_SOURCE,
        },
    });

    await seedDefaultAbsenceTypes(
        { typeConfigRepository: absenceTypeConfigRepository },
        { authorization, dataResidency: context.dataResidency, dataClassification: context.dataClassification },
    );
}
