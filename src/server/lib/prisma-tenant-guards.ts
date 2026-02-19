import type { Prisma } from '@prisma/client';
import { DEFAULT_CLASSIFICATION, DEFAULT_RESIDENCY } from '@/server/lib/prisma-tenant-scope';
import type { TenantScopedModelConfig } from '@/server/lib/prisma-tenant-scope';
import type { PrismaInputRecord, PrismaInputValue, PrismaOperationArguments } from '@/server/lib/prisma';

export function normalizeDataItems(
    data: PrismaInputRecord | PrismaInputRecord[] | undefined,
): PrismaInputRecord[] {
    if (Array.isArray(data)) {
        return data.filter((value): value is PrismaInputRecord => isInputRecord(value));
    }
    if (data && isInputRecord(data)) {
        return [data];
    }
    return [];
}

export function hasOrgConstraint(where: PrismaInputRecord | undefined, orgField: string): boolean {
    if (!where) {
        return false;
    }

    if (where[orgField] !== undefined) {
        return true;
    }

    for (const key of ['AND', 'OR', 'NOT'] as const) {
        const value = where[key];
        if (Array.isArray(value)) {
            if (value.some((entry) => isInputRecord(entry) && hasOrgConstraint(entry, orgField))) {
                return true;
            }
        } else if (isInputRecord(value) && hasOrgConstraint(value, orgField)) {
            return true;
        }
    }

    return false;
}

export function hasOrgValue(item: PrismaInputRecord, orgField: string): boolean {
    const value = item[orgField];
    return typeof value === 'string' && value.length > 0;
}

export function setDefaultComplianceFields(item: PrismaInputRecord, config: TenantScopedModelConfig): void {
    if (config.classificationField && item[config.classificationField] === undefined) {
        item[config.classificationField] = DEFAULT_CLASSIFICATION;
    }

    if (config.residencyField && item[config.residencyField] === undefined) {
        item[config.residencyField] = DEFAULT_RESIDENCY;
    }
}

export function isInputRecord(
    value: PrismaInputValue | PrismaInputRecord | PrismaInputRecord[] | undefined,
): value is PrismaInputRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

export function enforceUpsertScope(
    config: TenantScopedModelConfig,
    args: PrismaOperationArguments,
    model: string,
    action: Prisma.PrismaAction,
): void {
    if (!config.orgRequired) {
        return;
    }

    const createData = args.create;
    if (!createData || !isInputRecord(createData) || !hasOrgValue(createData, config.orgField)) {
        throw new Error(`Missing ${config.orgField} for ${model}.${action}.`);
    }
}

export function enforceStrictReadScope(
    config: TenantScopedModelConfig,
    where: PrismaInputRecord | undefined,
    model: string,
    action: Prisma.PrismaAction,
): void {
    if (hasOrgConstraint(where, config.orgField)) {
        return;
    }

    throw new Error(`Missing org scope for ${model}.${action}.`);
}

export function enforceCreateScope(
    config: TenantScopedModelConfig,
    args: PrismaOperationArguments,
    model: string,
    action: Prisma.PrismaAction,
): void {
    if (!config.orgRequired) {
        return;
    }

    const dataItems = normalizeDataItems(args.data);
    if (dataItems.length === 0) {
        throw new Error(`Missing data payload for ${model}.${action}.`);
    }

    for (const item of dataItems) {
        if (!hasOrgValue(item, config.orgField)) {
            throw new Error(`Missing ${config.orgField} for ${model}.${action}.`);
        }
    }

    if (Array.isArray(args.data)) {
        args.data = dataItems;
    } else {
        args.data = dataItems[0];
    }
}
